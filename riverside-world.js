import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {block} from './world.js';
import terrain from './assets/scenes/terrain.json';

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
    shader.uniforms.uHoles={value:o.holeSlots};shader.uniforms.uHoleCount={value:0};shader.uniforms.uCell={value:CELL};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWPos=(modelMatrix*vec4(position,1.)).xyz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWPos;\nuniform vec3 uHoles['+MAX_HOLES+'];\nuniform int uHoleCount;\nuniform float uCell;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfor(int i=0;i<'+MAX_HOLES+';i++){if(i>=uHoleCount)break;vec3 hd=abs(vWPos-uHoles[i]);if(hd.x<uCell*.5&&hd.y<uCell*.5&&hd.z<uCell*.5)discard;}');
    o.shaders.push(shader);
   };
   mat.needsUpdate=true;node.material=mat;
  });
 }
 function carve(o,x,z,r,emit,color){
  if(o.holes.length>=MAX_HOLES)return 0;
  const base=heightAt(x,z);let added=0;
  for(let dy=0;dy<2&&o.holes.length<MAX_HOLES;dy+=CELL)
   for(let dx=-r;dx<=r&&o.holes.length<MAX_HOLES;dx+=CELL)
    for(let dz=-r;dz<=r&&o.holes.length<MAX_HOLES;dz+=CELL){
     if(Math.hypot(dx,dz)>r)continue;
     const px=Math.round((x+dx)/CELL)*CELL+CELL*.5,py=Math.round((base+dy)/CELL)*CELL+CELL*.5,pz=Math.round((z+dz)/CELL)*CELL+CELL*.5;
     if(Math.abs(px-o.x)>o.w/2+.4||Math.abs(pz-o.z)>o.d/2+.4||py>base+o.h)continue;
     if(o.holes.some(h=>h.x===px&&h.y===py&&h.z===pz))continue;
     const slot=o.holeSlots[o.holes.length];slot.set(px,py,pz);o.holes.push(slot);added++;
     emit?.(px,py,pz,color,3);
    }
  if(added)for(const s of o.shaders)if(s.uniforms.uHoleCount)s.uniforms.uHoleCount.value=Math.min(o.holes.length,MAX_HOLES);
  return added;
 }
 function add(g,type,hp){const box=new T.Box3().setFromObject(g),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());const o={g,x:c.x,z:c.z,w:size.x,d:size.z,h:size.y,hp,maxHp:hp,type,dead:false};attachCarve(o);obstacles.push(o);destructibles.push(o);if(type==='building')buildings.push(o);return o;}
 for(const g of root.children){if(/^(Machiya|Urban_building|Urban building)/.test(g.name))add(g,'building',220);else if(/^(Tokyo_Tower|Tokyo Tower|Ferris_wheel|Ferris wheel)/.test(g.name)){const box=new T.Box3().setFromObject(g),c=box.getCenter(new T.Vector3()),sz=box.getSize(new T.Vector3());obstacles.push({x:c.x,z:c.z,w:sz.x,d:sz.z,dead:false});}}
 function heightAt(x,z){const ix=Math.round((x-terrain.minX)/terrain.step),iz=Math.round((z-terrain.minZ)/terrain.step);return ix<0||iz<0||ix>=terrain.size||iz>=terrain.size?-99:terrain.heights[iz*terrain.size+ix];}
 function solid(x,z,r=.45){return x<=-60||x>=60||z<=-68||z>=57||obstacles.some(o=>!o.dead&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r)||[[0,0],[r,0],[-r,0],[0,r],[0,-r]].some(([dx,dz])=>{const ix=Math.round((x+dx-terrain.minX)/terrain.step),iz=Math.round((z+dz-terrain.minZ)/terrain.step);return terrain.blocked?.[iz*terrain.size+ix]===1;});}
 function free(x,z,r=.45){return !solid(x,z,r)&&[[0,0],[r,0],[-r,0],[0,r],[0,-r]].every(([dx,dz])=>heightAt(x+dx,z+dz)>-2);}
 function waypoint(u,x,z){if(u.x*x<0&&Math.abs(x)>9){const bz=[26.4,-15.4].sort((a,b)=>Math.abs(a-u.z)+Math.abs(a-z)-Math.abs(b-u.z)-Math.abs(b-z))[0];if(Math.abs(u.z-bz)>1.2)return {x:Math.sign(u.x)*12.5,z:bz};return {x:Math.sign(x)*13,z:bz};}return {x,z};}
 function nearest(x,z,r=.7){if(free(x,z,r))return {x,z};for(let radius=.5;radius<130;radius+=.5)for(let i=0;i<24;i++){const a=i*Math.PI/12,xx=x+Math.cos(a)*radius,zz=z+Math.sin(a)*radius;if(free(xx,zz,r))return {x:xx,z:zz};}throw Error('No walkable spawn');}
 const spawn=nearest(-12,32),bossSpawn=nearest(33,-24,4);
 for(const p of [[-35,14],[34,-12],[12,-52]]){const {x,z}=nearest(...p,2),g=new T.Group();g.position.set(x,heightAt(x,z),z);scene.add(g);block(g,2.4,.5,2.4,0x657575,0,.25,0);block(g,1.4,3,1.4,0x425c64,0,1.8,0);block(g,1.7,.25,1.7,0xd7865a,0,3.5,0);block(g,.15,2,.15,0x576b70,0,4.5,0);block(g,1.5,.5,.3,0x62b1d0,0,5.5,0);towers.push(add(g,'tower',180));}
 const entries=[[34,40],[-35,40],[-35,-57],[34,-57]].map(p=>{const q=nearest(...p,2);return[q.x,q.z];});
 function clear(a,b,r=.1){const d=Math.hypot(a.x-b.x,a.z-b.z),n=Math.ceil(d/.7);for(let i=1;i<n;i++)if(solid(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,r))return false;return true;}
 function breakAt(x,z,r,damage,emit){let count=0;for(const o of destructibles){if(o.dead)continue;const nx=T.MathUtils.clamp(x,o.x-o.w/2,o.x+o.w/2),nz=T.MathUtils.clamp(z,o.z-o.d/2,o.z+o.d/2);if(Math.hypot(x-nx,z-nz)>r)continue;o.hp-=damage;const tint=o.type==='tower'?0xe5a374:0xbab3a2;if(!carve(o,nx,nz,Math.min(r,.85),emit,tint))emit?.(nx,heightAt(nx,nz)+1,nz,tint,12);if(o.hp<=0){o.dead=true;o.g.visible=false;count++;emit?.(o.x,2,o.z,0xb5ae9f,35);}}return count;}
 return {root,obstacles,destructibles,buildings,towers,free,clear,breakAt,heightAt,solid,waypoint,nearest,spawn,bossSpawn,entries};
}
