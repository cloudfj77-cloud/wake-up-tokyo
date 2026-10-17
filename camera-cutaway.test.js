import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCameraCutaway} from './camera-cutaway.js';
function fixture(pillar=false){
 const root=new T.Group(),original=new T.MeshStandardMaterial(),mesh=new T.Mesh(new T.BoxGeometry(),original);mesh.position.set(0,1,1.2);mesh.scale.set(pillar?.3:4,3,.4);root.add(mesh);root.updateMatrixWorld(true);
 const owner={g:mesh,dead:false,type:pillar?'pillar':'building'},world={root,destructibles:[owner],buildings:pillar?[]:[owner]},cut=createCameraCutaway(world);return {world,cut,mesh,owner,original};
}
const anchor=new T.Vector3(0,1,0),desired=new T.Vector3(0,1,3);
test('camera stops outside the padded wall even when starting behind or inside it',()=>{
 const {cut,mesh}=fixture(),wall=new T.Box3().setFromObject(mesh).expandByScalar(.18);
 for(const start of [desired,new T.Vector3(0,1,1.2),new T.Vector3(-3,1,0)]){
  const p=cut.resolve(anchor,desired,start,.016);assert.equal(wall.containsPoint(p),false);assert.ok(p.z<.82);
 }
});
test('contacted pillar fades and smoothly restores after camera turns away',()=>{
 const {cut}=fixture(true),camera=new T.PerspectiveCamera();camera.position.copy(cut.resolve(anchor,desired,desired,.1));
 const tick=dt=>cut.update(camera,{x:0,z:0},0,1,new T.Vector2(1280,720),dt);
 tick(.1);const before=cut.uniforms.uBuildingFade.value[0];assert.ok(before>.8);
 camera.position.set(-3,1,0);tick(.1);const after=cut.uniforms.uBuildingFade.value[0];assert.ok(after>0&&after<before);
 tick(2);assert.equal(cut.uniforms.uBuildingFade.value[0],0);
});
test('camera extends smoothly after obstruction clears and destroyed buildings stop blocking it',()=>{
 const {cut,owner}=fixture(),first=cut.resolve(anchor,desired,desired,.016);owner.dead=true;
 const next=cut.resolve(anchor,desired,first,.016);assert.ok(next.z>first.z&&next.z<desired.z);
 assert.ok(cut.resolve(anchor,desired,desired,.016).distanceTo(desired)<.001);
});
test('scenery fade isolates shared actor materials and retains carving hooks and instancing',()=>{
 const {world,original}=fixture();let called=false;original.onBeforeCompile=s=>{called=true;s.fragmentShader+='\n// building holes';};
 const m=new T.InstancedMesh(new T.BoxGeometry(.3,4,.3),original,1);world.root.add(m);createCameraCutaway(world);
 const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.material.onBeforeCompile(shader);
 assert.equal(called,true);assert.notEqual(m.material,original);assert.equal(original.transparent,false);assert.equal(m.material.opacity,1);
 assert.match(shader.fragmentShader,/building holes/);assert.match(shader.vertexShader,/cameraLocal=instanceMatrix/);assert.match(shader.fragmentShader,/uBuildingMin/);assert.doesNotMatch(shader.fragmentShader,/uViewFeet|uViewRadius/);assert.equal(m.customDepthMaterial,undefined);
});
test('later task buildings receive collision without any material rewrite',()=>{
 const {world,cut,mesh}=fixture(),old=mesh.material,added=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());const originalAdded=added.material;added.position.set(0,1,-1);world.root.add(added);world.destructibles.push({g:added});
 const p=cut.resolve(anchor,new T.Vector3(0,1,-3),new T.Vector3(0,1,-3),.016);
 assert.ok(p.z>-.5);assert.equal(mesh.material,old);assert.equal(added.material,originalAdded);
});
test('precise map collision also stops camera at walls absent from the building registry',()=>{
 const cut=createCameraCutaway({cameraBlocked:(x,y,z)=>z>.8});
 const p=cut.resolve(anchor,desired,desired,.016);assert.ok(p.z<.8);
});
test('unregistered pillars fade and stop the camera using their actual mesh',()=>{
 const root=new T.Group(),pillar=new T.Mesh(new T.BoxGeometry(.25,4,.25),new T.MeshStandardMaterial());pillar.position.set(0,2,1.2);root.add(pillar);
 const cut=createCameraCutaway({root,destructibles:[],buildings:[]}),camera=new T.PerspectiveCamera();
 camera.position.copy(cut.resolve(anchor,desired,desired,.1));assert.ok(camera.position.z<1);
 cut.update(camera,{x:0,z:0},0,1,new T.Vector2(1280,720),.1);
 assert.ok(cut.uniforms.uBuildingFade.value.some(n=>n>.8));
 assert.ok(cut.uniforms.uBuildingMax.value.some(p=>p.y>=4));
});
test('merged street props only fade near the blocking pillar, not the entire street',()=>{
 const root=new T.Group(),pillar=new T.Mesh(new T.BoxGeometry(.3,4,.3),new T.MeshStandardMaterial());pillar.position.set(0,2,1.2);
 // 模拟同一张街景网格上相隔很远的柱体。
 const g=pillar.geometry.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++){p.setY(i,p.getY(i)+2);p.setZ(i,p.getZ(i)+1.2);}g.computeBoundingBox();g.boundingBox.max.x=100;
 const merged=new T.Mesh(g,pillar.material);merged.name='mergedPosts';root.add(merged);const cut=createCameraCutaway({root,pillarData:[{name:'mergedPosts',pillars:[{min:[-.15,0,1.05],max:[.15,4,1.35]}]}]}),camera=new T.PerspectiveCamera();camera.position.copy(cut.resolve(anchor,desired,desired,.1));
 cut.update(camera,{x:0,z:0},0,1,new T.Vector2(1280,720),.1);
 const slot=cut.uniforms.uBuildingFade.value.findIndex(n=>n>.8);assert.ok(slot>=0);assert.ok(cut.uniforms.uBuildingMax.value[slot].x-cut.uniforms.uBuildingMin.value[slot].x<3);
});
test('buildings remain opaque even when they block the camera-to-body line',()=>{
 const {cut}=fixture(),camera=new T.PerspectiveCamera();camera.position.set(0,1,3);
 cut.update(camera,{x:0,z:0},0,1,new T.Vector2(1280,720),.1);
 assert.ok(cut.uniforms.uBuildingFade.value.every(n=>n===0));
});
test('a pillar in front of the player fades when it obstructs the near combat view',()=>{
 const root=new T.Group(),pillar=new T.Mesh(new T.BoxGeometry(.5,4,.5),new T.MeshStandardMaterial());pillar.position.set(.15,2,-1.4);root.add(pillar);
 const cut=createCameraCutaway({root}),camera=new T.PerspectiveCamera();camera.position.set(.36,1,2.7);camera.lookAt(.36,.8,-5);camera.updateMatrixWorld();
 cut.update(camera,{x:0,z:0},0,1,new T.Vector2(1280,720),.1);
 assert.ok(cut.uniforms.uBuildingFade.value.some(n=>n>.8));
});
test('pillar fade is scoped to its object and never cuts a hole in a neighboring building',()=>{
 const root=new T.Group(),mat=new T.MeshStandardMaterial(),pillar=new T.Mesh(new T.BoxGeometry(.5,4,.5),mat),neighbor=new T.Mesh(new T.BoxGeometry(.1,4,.1),mat);
 pillar.position.set(0,2,1.2);neighbor.position.set(.42,2,1.2);root.add(pillar,neighbor);
 const cut=createCameraCutaway({root}),camera=new T.PerspectiveCamera();camera.position.copy(cut.resolve(anchor,desired,desired,.1));
 cut.update(camera,{x:0,z:0},0,1,new T.Vector2(1280,720),.1);
 const compile=m=>{const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.material.onBeforeCompile(shader);return shader.uniforms.uCameraMeshTag.value;};
 const selected=cut.uniforms.uBuildingTag.value.filter((_,i)=>cut.uniforms.uBuildingFade.value[i]>.1);
 assert.ok(selected.includes(compile(pillar)));assert.ok(!selected.includes(compile(neighbor)));assert.notEqual(pillar.material,neighbor.material);
});

test('real riverside pole metadata matches the shipped asset and does not depend on hit-face size',async()=>{
 const {readFile}=await import('node:fs/promises'),{createHash}=await import('node:crypto');
 const data=JSON.parse(await readFile(new URL('./assets/scenes/pillars.json',import.meta.url))),asset=await readFile(new URL('./assets/scenes/riverside.glb',import.meta.url));
 assert.equal(data.sourceHash,createHash('sha256').update(asset).digest('hex'));
 const real=data.meshes.find(m=>m.name.includes('utility_poles'));assert.equal(real.pillars.length,14);
 const mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshStandardMaterial());mesh.name=real.name;mesh.raycast=()=>{throw Error('must never scan street triangles');};
 const root=new T.Group();root.add(mesh);root.scale.setScalar(.55);root.position.set(0,-.715,19.25);root.updateMatrixWorld(true);
 const cut=createCameraCutaway({root,pillarData:data.meshes}),pole=cut.pillarAnchors()[0].box,center=pole.getCenter(new T.Vector3()),camera=new T.PerspectiveCamera();
 const player={x:center.x,z:center.z+1.4};camera.position.set(center.x,1,center.z+4);camera.lookAt(center.x,1,center.z-2);camera.updateMatrixWorld();
 cut.update(camera,player,0,1,new T.Vector2(1280,720),.1);
 assert.ok(cut.uniforms.uBuildingFade.value.some(n=>n>.8));assert.equal(cut.diagnostics().triangleRaycasts,0);assert.equal(cut.diagnostics().patchedMeshes,1);
});

test('merged map props consume pre-merge pillar bounds without scanning their triangles',()=>{
 const root=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(100,4,100),new T.MeshStandardMaterial());
 mesh.userData.cameraPillars=[{min:[-.2,0,1],max:[.2,4,1.4]}];mesh.raycast=()=>{throw Error('unexpected mesh ray');};root.add(mesh);
 const cut=createCameraCutaway({root}),camera=new T.PerspectiveCamera();camera.position.set(0,1,3);cut.update(camera,{x:0,z:0},0,1,new T.Vector2(1280,720),.1);
 assert.equal(cut.diagnostics().pillars,1);assert.ok(cut.uniforms.uBuildingFade.value.some(x=>x>.8));assert.equal(cut.diagnostics().triangleRaycasts,0);
});

test('far-away pillar counts do not multiply per-frame candidate work',()=>{
 const mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshStandardMaterial());mesh.name='gridPosts';
 const bounds=Array.from({length:1000},(_,i)=>({min:[i*10-.2,0,1],max:[i*10+.2,4,1.4]})),root=new T.Group();root.add(mesh);
 const cut=createCameraCutaway({root,pillarData:[{name:mesh.name,pillars:bounds}]}),camera=new T.PerspectiveCamera();camera.position.set(0,1,3);
 cut.update(camera,{x:0,z:0},0,1,new T.Vector2(1280,720),.1);
 assert.equal(cut.diagnostics().pillars,1000);assert.ok(cut.diagnostics().candidateChecks<10);assert.ok(cut.uniforms.uBuildingFade.value.some(x=>x>.8));
});
