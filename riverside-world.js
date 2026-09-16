import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {block} from './world.js';
import terrain from './assets/scenes/terrain.json' with {type:'json'};

const BRIDGES=[{z:26.4,halfLength:14.35,railOffset:2.05},{z:-15.4,halfLength:14.35,railOffset:2.05}];
export function bridgeDeckHeight(x,z){
 // 桥面使用连续矩形而不是 0.5 米地形格，避免格子边缘出现让角色下沉的缝。
 // 模型射线实测可行走顶面约为 0.755；旧值 0.358 命中了桥底，所以人物会陷进桥里。
 return BRIDGES.some(bridge=>Math.abs(x)<=bridge.halfLength&&Math.abs(z-bridge.z)<=1.72) ? .755 : null;
}
export function hitsBridgeRail(x,z,r=.45){
 // 桥模型缩放后的实际长度约 28.8 米，护栏位于桥中心线两侧约 2.05 米。
 return BRIDGES.some(bridge=>Math.abs(x)<bridge.halfLength&&Math.abs(Math.abs(z-bridge.z)-bridge.railOffset)<.18+r);
}
export function isRiverChannel(x,z,r=0){
 // 河面只按河道宽度封闭；桥面仍可通行。岸上未烘焙到的广场不能当成虚空墙。
 if(bridgeDeckHeight(x,z)!==null)return false;
 return Math.abs(x)<9+r;
}
export function terrainHeightAt(x,z){
 const ix=Math.round((x-terrain.minX)/terrain.step),iz=Math.round((z-terrain.minZ)/terrain.step);
 const baked=ix<0||iz<0||ix>=terrain.size||iz>=terrain.size?-99:terrain.heights[iz*terrain.size+ix];
 if(baked>-2)return baked;
 return isRiverChannel(x,z)?-99:0;
}

export async function loadRiverside(scene){
 const draco=new DRACOLoader().setDecoderPath('/draco/');
 const loader=new GLTFLoader().setDRACOLoader(draco);
 const gltf=await loader.loadAsync(new URL('./assets/scenes/riverside.glb',import.meta.url).href);
 draco.dispose();const root=gltf.scene;root.scale.setScalar(.55);root.position.set(0,-.715,19.25);root.updateMatrixWorld(true);scene.add(root);
 const obstacles=[],destructibles=[],buildings=[],towers=[];
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=.95;}}});
 // 逐块破坏：攻击点把建筑凿成立方体缺口，边缘自然是像素化的方格。
 const CELL=.55,MAX_HOLES=48;
 function attachCarve(o){
  o.holes=[];o.holeSlots=Array.from({length:MAX_HOLES},()=>new T.Vector3());o.shaders=[];
  o.g.traverse(node=>{
   if(!node.isMesh)return;
   const mat=node.material.clone();
   mat.onBeforeCompile=shader=>{
    // 建筑可能在第一次受击后才进入镜头，因此编译材质时要带上已经产生的缺口数量。
    shader.uniforms.uHoles={value:o.holeSlots};shader.uniforms.uHoleCount={value:o.holes.length};shader.uniforms.uCell={value:CELL};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWPos=(modelMatrix*vec4(position,1.)).xyz;');
    // 稍微放大裁切盒，让位于两个体素边界上的墙面也会被确实挖开，而不是只记录数值。
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;\nuniform vec3 uHoles['+MAX_HOLES+'];\nuniform int uHoleCount;\nuniform float uCell;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfor(int i=0;i<'+MAX_HOLES+';i++){if(i>=uHoleCount)break;vec3 hd=abs(vWPos-uHoles[i]);if(hd.x<uCell*.62&&hd.y<uCell*.62&&hd.z<uCell*.62)discard;}');
    o.shaders.push(shader);
   };
   mat.needsUpdate=true;node.material=mat;
  });
 }
 function carve(o,x,y,z,r,emit,color){
  if(o.holes.length>=MAX_HOLES)return 0;
  const base=heightAt(x,z),radius=Math.max(CELL,r);let added=0;
  // 以真实命中高度为中心挖一个体素缺口，开枪打墙的哪里，缺口就出现在哪里。
  for(let dy=-radius;dy<=radius&&o.holes.length<MAX_HOLES;dy+=CELL)
   for(let dx=-r;dx<=r&&o.holes.length<MAX_HOLES;dx+=CELL)
    for(let dz=-r;dz<=r&&o.holes.length<MAX_HOLES;dz+=CELL){
     if(Math.hypot(dx,dy,dz)>radius)continue;
     // floor 后加半格才是“包含命中点的体素中心”；旧的 round 会把一半缺口推离墙面。
     const px=Math.floor((x+dx)/CELL)*CELL+CELL*.5,py=Math.floor((y+dy)/CELL)*CELL+CELL*.5,pz=Math.floor((z+dz)/CELL)*CELL+CELL*.5;
     if(Math.abs(px-o.x)>o.w/2+.4||Math.abs(pz-o.z)>o.d/2+.4||py<base-.4||py>base+o.h+.4)continue;
     if(o.holes.some(h=>h.x===px&&h.y===py&&h.z===pz))continue;
     const slot=o.holeSlots[o.holes.length];slot.set(px,py,pz);o.holes.push(slot);added++;
     emit?.(px,py,pz,color,3);
    }
  if(added)for(const s of o.shaders)if(s.uniforms.uHoleCount)s.uniforms.uHoleCount.value=Math.min(o.holes.length,MAX_HOLES);
  return added;
 }
 function add(g,type,hp){const box=new T.Box3().setFromObject(g),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());const o={g,x:c.x,z:c.z,w:size.x,d:size.z,h:size.y,hp,maxHp:hp,type,dead:false};attachCarve(o);obstacles.push(o);destructibles.push(o);if(type==='building')buildings.push(o);return o;}
 // 只给真正的建筑做碰撞盒。东京塔、摩天轮的整体包围盒会在 Boss 广场拉出看不见的空气墙。
 for(const g of root.children){if(/^(Machiya|Urban_building|Urban building)/.test(g.name))add(g,'building',220);}
 function heightAt(x,z){const bridgeHeight=bridgeDeckHeight(x,z),terrainHeight=terrainHeightAt(x,z);return bridgeHeight===null?terrainHeight:Math.max(bridgeHeight,terrainHeight);}
 function solid(x,z,r=.45){return x<=-60||x>=60||z<=-68||z>=57||hitsBridgeRail(x,z,r)||isRiverChannel(x,z,r)||obstacles.some(o=>!o.dead&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);}
 function free(x,z,r=.45){return !solid(x,z,r);}
 function waypoint(u,x,z){if(u.x*x<0&&Math.abs(x)>9){const bz=[26.4,-15.4].sort((a,b)=>Math.abs(a-u.z)+Math.abs(a-z)-Math.abs(b-u.z)-Math.abs(b-z))[0];if(Math.abs(u.z-bz)>1.2)return {x:Math.sign(u.x)*12.5,z:bz};return {x:Math.sign(x)*13,z:bz};}return {x,z};}
 function nearest(x,z,r=.7){if(free(x,z,r))return {x,z};for(let radius=.5;radius<130;radius+=.5)for(let i=0;i<24;i++){const a=i*Math.PI/12,xx=x+Math.cos(a)*radius,zz=z+Math.sin(a)*radius;if(free(xx,zz,r))return {x:xx,z:zz};}throw Error('No walkable spawn');}
 // 主角从西北侧开阔街口开始，远离桥头、任务塔和首批巡逻队。
 const spawn=nearest(-34,34,1),bossSpawn=nearest(33,-24,4);
 const glowingBlock=(group,w,h,d,color,x,y,z)=>{const mesh=block(group,w,h,d,color,x,y,z);mesh.material=mesh.material.clone();mesh.material.emissive=new T.Color(0xffc400);mesh.material.emissiveIntensity=1.6;mesh.material.roughness=.35;return mesh;};
 // 南侧旧中枢位于地标塔旁，容易让玩家误判；演示版只保留西北和东侧两座。
 for(const p of [[-35,14],[34,-12]]){const {x,z}=nearest(...p,2),g=new T.Group();g.position.set(x,heightAt(x,z),z);scene.add(g);glowingBlock(g,2.4,.5,2.4,0xb89312,0,.25,0);glowingBlock(g,1.4,3,1.4,0xffcf21,0,1.8,0);glowingBlock(g,1.7,.25,1.7,0xffed6a,0,3.5,0);glowingBlock(g,.15,2,.15,0xffd52f,0,4.5,0);glowingBlock(g,1.5,.5,.3,0xffff9a,0,5.5,0);const halo=new T.Mesh(new T.SphereGeometry(1.05,14,9),new T.MeshBasicMaterial({color:0xffe75c,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false}));halo.position.y=4.9;g.add(halo);const light=new T.PointLight(0xffd83d,4.2,13,1.5);light.position.y=4.5;g.add(light);towers.push(add(g,'tower',180));}
 const entries=[[34,40],[-35,40],[-35,-57],[34,-57]].map(p=>{const q=nearest(...p,2);return[q.x,q.z];});
 function clear(a,b,r=.1){const d=Math.hypot(a.x-b.x,a.z-b.z),n=Math.ceil(d/.7);for(let i=1;i<n;i++)if(solid(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,r))return false;return true;}
 function breakAt(x,z,r,damage,emit,impactY){let count=0;for(const o of destructibles){if(o.dead)continue;const nx=T.MathUtils.clamp(x,o.x-o.w/2,o.x+o.w/2),nz=T.MathUtils.clamp(z,o.z-o.d/2,o.z+o.d/2);if(Math.hypot(x-nx,z-nz)>r)continue;o.hp-=damage;const tint=o.type==='tower'?0xe5a374:0xbab3a2,hitY=impactY??heightAt(nx,nz)+Math.min(1,o.h*.35);if(!carve(o,nx,hitY,nz,Math.min(r,.9),emit,tint))emit?.(nx,hitY,nz,tint,12);if(o.hp<=0){o.dead=true;o.g.visible=false;count++;emit?.(o.x,2,o.z,0xb5ae9f,35);}}return count;}
 return {root,obstacles,destructibles,buildings,towers,free,clear,breakAt,heightAt,solid,waypoint,nearest,spawn,bossSpawn,entries};
}
