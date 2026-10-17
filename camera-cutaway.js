import * as T from 'three';

// 建筑只约束镜头，不改材质。柱体预先登记，运行时只查包围盒，不扫街景三角形。
export function createCameraCutaway(world){
 const slots=4,uniforms={uBuildingMin:{value:Array.from({length:slots},()=>new T.Vector3())},uBuildingMax:{value:Array.from({length:slots},()=>new T.Vector3())},uBuildingFade:{value:Array(slots).fill(0)},uBuildingTag:{value:Array(slots).fill(0)},uAnyPillarFade:{value:0}};
 const buildings=[],pillars=[],registered=new Set(),seen=new WeakSet(),patches=new WeakMap(),tags=new WeakMap(),active=new Map(),touched=new Set();let count=-1,nextTag=1;
 const pillarGrid=new Map(),nearby=new Set(),cell=4;
 const ray=new T.Ray(),direction=new T.Vector3(),point=new T.Vector3(),expanded=new T.Box3(),size=new T.Vector3(),body=new T.Vector3(),right=new T.Vector3(),end=new T.Vector3();
 const stats={boxTests:0,candidateChecks:0,triangleRaycasts:0,patchedMeshes:0,pillars:0};
 const baked=new Map((world.pillarData||[]).map(r=>[r.name,r.pillars]));
 function patch(mesh,tag){
  if(patches.has(mesh))return;
  patches.set(mesh,true);stats.patchedMeshes++;
  const convert=original=>{
   const material=original.clone(),compile=original.onBeforeCompile;
   material.onBeforeCompile=(shader,renderer)=>{
    compile.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);shader.uniforms.uCameraMeshTag={value:tag};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCameraPillar;').replace('#include <project_vertex>',`#include <project_vertex>
     vec4 cameraLocal=vec4(transformed,1.0);
     #ifdef USE_BATCHING
      cameraLocal=batchingMatrix*cameraLocal;
     #endif
     #ifdef USE_INSTANCING
      cameraLocal=instanceMatrix*cameraLocal;
     #endif
     vCameraPillar=(modelMatrix*cameraLocal).xyz;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
     varying vec3 vCameraPillar;
     uniform vec3 uBuildingMin[4],uBuildingMax[4];
     uniform float uBuildingFade[4],uBuildingTag[4],uCameraMeshTag,uAnyPillarFade;`).replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
     float pillarFade=0.0;
     if(uAnyPillarFade>0.001){
     for(int i=0;i<4;i++){
      if(uBuildingFade[i]>0.001 && abs(uBuildingTag[i]-uCameraMeshTag)<0.5 && all(greaterThanEqual(vCameraPillar,uBuildingMin[i])) && all(lessThanEqual(vCameraPillar,uBuildingMax[i])))pillarFade=max(pillarFade,uBuildingFade[i]);
     }
     }
     if(pillarFade>0.001){
      float grain=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(0.06711056,0.00583715))));
      if(grain<pillarFade*0.92)discard;
     }`);
   };
   material.customProgramCacheKey=()=>original.customProgramCacheKey()+'|pillar-only-v4';return material;
  };
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(convert):convert(mesh.material);
 }
 function collect(){
  const owned=new WeakMap();
  for(const owner of [...world.destructibles||[],...world.buildings||[]]){
   owner.g?.traverse(n=>{if(n.isMesh)owned.set(n,owner);});
   if(registered.has(owner))continue;registered.add(owner);
   if(owner.g){owner.g.updateWorldMatrix(true,true);buildings.push({owner,box:new T.Box3().setFromObject(owner.g)});}
   else if(owner.w&&owner.d){const y=world.heightAt?.(owner.x,owner.z)||0;buildings.push({owner,box:new T.Box3(new T.Vector3(owner.x-owner.w/2,y,owner.z-owner.d/2),new T.Vector3(owner.x+owner.w/2,y+owner.h+2,owner.z+owner.d/2))});}
  }
  const register=mesh=>{
   if(!mesh.isMesh||!mesh.geometry||seen.has(mesh))return;seen.add(mesh);
   mesh.updateWorldMatrix(true,false);
   // 烘焙数据明确包含真实电线柱；电线把柱子连在一起也不影响识别。
   const descriptors=mesh.userData.cameraPillars?.length?mesh.userData.cameraPillars:baked.get(mesh.name);
   let boxes=descriptors?.map(b=>new T.Box3(new T.Vector3(...b.min),new T.Vector3(...b.max)).applyMatrix4(mesh.matrixWorld));
   if(!boxes){
    const owner=owned.get(mesh);
    if(owner&&(world.buildings?.includes(owner)||!/pillar|column|pole|柱/i.test(owner.type||owner.g?.name||'')))return;
    const b=new T.Box3().setFromObject(mesh);b.getSize(size);
    if(size.y<.7||Math.max(size.x,size.z)>1.8||size.y<Math.max(size.x,size.z)*1.6)return;
    boxes=[b];
   }
   if(!boxes.length)return;
   const tag=nextTag++;tags.set(mesh,tag);patch(mesh,tag);
   for(const b of boxes){
    const base=world.heightAt?.((b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2)||0;
    const fadeBox=b.clone().expandByScalar(.2);fadeBox.min.y=Math.max(fadeBox.min.y,base+.08);
    const record={mesh,tag,box:b,fadeBox};pillars.push(record);
    for(let x=Math.floor(b.min.x/cell);x<=Math.floor(b.max.x/cell);x++)for(let z=Math.floor(b.min.z/cell);z<=Math.floor(b.max.z/cell);z++){
     const key=x+','+z;if(!pillarGrid.has(key))pillarGrid.set(key,[]);pillarGrid.get(key).push(record);
    }
   }
  };
  world.root?.traverse(register);for(const o of world.destructibles||[])o.g?.traverse(register);
  count=world.destructibles?.length||0;stats.pillars=pillars.length;
 }
 function visible(r){if(r.owner?.dead)return false;for(let n=r.mesh||r.owner?.g;n;n=n.parent)if(!n.visible)return false;return true;}
 function trace(from,to,collision,includeBuildings){
  direction.subVectors(to,from);const length=direction.length();if(length<.001)return length;
  direction.divideScalar(length);ray.set(from,direction);let limit=length;
  const check=(r,pillar)=>{
   if(pillar)stats.candidateChecks++;
   if(!visible(r))return;
   // 远处柱体不进入精确检查；仅检查镜头附近及前方几米。
   if(pillar&&r.box.distanceToPoint(from)>length+.3)return;
   stats.boxTests++;expanded.copy(r.box).expandByScalar(collision?.18:.12);
   if(expanded.containsPoint(from)){if(pillar)touched.add(r);return;}
   if(ray.intersectBox(expanded,point)){
    const distance=point.distanceTo(from);if(distance<=length){if(pillar)touched.add(r);if(collision)limit=Math.min(limit,Math.max(0,distance-.08));}
   }
  };
  if(includeBuildings)for(const r of buildings)check(r,false);
  // 只取线段附近的网格桶，海滨的栏杆与柱体再多也不逐帧全遍历。
  nearby.clear();
  for(let x=Math.floor((Math.min(from.x,to.x)-.3)/cell);x<=Math.floor((Math.max(from.x,to.x)+.3)/cell);x++)for(let z=Math.floor((Math.min(from.z,to.z)-.3)/cell);z<=Math.floor((Math.max(from.z,to.z)+.3)/cell);z++){
   for(const r of pillarGrid.get(x+','+z)||[])nearby.add(r);
  }
  for(const r of nearby)check(r,true);
  if(collision&&world.cameraBlocked)for(let t=.08;t<limit;t+=.08){point.copy(from).addScaledVector(direction,t);if(world.cameraBlocked(point.x,point.y,point.z,.18)){limit=Math.max(0,t-.12);break;}}
  return limit;
 }
 function constrain(from,to){const distance=trace(from,to,true,true);return end.copy(to).sub(from).normalize().multiplyScalar(distance).add(from).clone();}
 function resolve(anchor,desired,current,dt){
  if(count!==(world.destructibles?.length||0))collect();
  const safe=constrain(anchor,desired),next=current.distanceTo(anchor)>desired.distanceTo(anchor)+1?safe:current.clone().lerp(safe,1-Math.exp(-dt*10));
  return constrain(anchor,next);
 }
 function update(camera,player,ground,height,viewport,dt,enabled=true){
  if(count!==(world.destructibles?.length||0))collect();
  if(enabled){
   body.set(player.x,ground+(player.y||0)+height*.7,player.z);
   trace(camera.position,body,false,false);
   right.set(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(.32);
   trace(camera.position,end.copy(body).add(right),false,false);trace(camera.position,end.copy(body).sub(right),false,false);
   camera.getWorldDirection(end);end.multiplyScalar(4).add(body);end.y=body.y;trace(camera.position,end,false,false);
  }
  for(const r of touched)if(enabled&&!active.has(r)&&active.size<slots)active.set(r,0);
  for(const [r,fade]of active){const selected=enabled&&visible(r)&&touched.has(r),next=T.MathUtils.damp(fade,selected?1:0,selected?24:5,dt);if(next<.001&&!selected)active.delete(r);else active.set(r,next);}
  uniforms.uBuildingFade.value.fill(0);let i=0;
  for(const [r,fade]of active){uniforms.uBuildingMin.value[i].copy(r.fadeBox.min);uniforms.uBuildingMax.value[i].copy(r.fadeBox.max);uniforms.uBuildingTag.value[i]=r.tag;uniforms.uBuildingFade.value[i++]=fade;}
  uniforms.uAnyPillarFade.value=Math.max(...uniforms.uBuildingFade.value);
  touched.clear();
 }
 collect();return {resolve,update,uniforms,refresh:collect,diagnostics:()=>({...stats}),pillarAnchors:()=>pillars.map(r=>({mesh:r.mesh.name,box:r.box.clone()}))};
}
