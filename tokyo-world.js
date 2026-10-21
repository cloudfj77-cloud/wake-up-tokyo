import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {block} from './world.js';
import {WalkCollision} from './tokyo/collision.js';
import {batchStaticScene} from './tokyo/render-batches.js';
import {createTokyoNavigation} from './tokyo/navigation.js';
import {createTokyoPopulation,TUTORIAL_LAYOUT} from './tokyo/gameplay.js';

export async function loadTokyo(scene){
 const [gltf,data]=await Promise.all([new GLTFLoader().loadAsync(new URL('./assets/scenes/tokyo-district.glb',import.meta.url).href),fetch(new URL('./assets/scenes/tokyo-navigation.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('东京通路加载失败');return r.json();})]);
 const root=gltf.scene;root.name='Tokyo Cyber District';root.scale.setScalar(.55);root.position.set(11,3.3,-28.6);root.updateMatrixWorld(true);
 // Keep Wake Up's light rig, fog and postprocessing; the asset contributes geometry and materials only.
 const lights=[];root.traverse(o=>{if(o.isLight)lights.push(o);if(o.isMesh){o.castShadow=o.receiveShadow=true;}});lights.forEach(o=>o.removeFromParent());
 // 把 scene.fog 传进去：LOD 的换挡距离要跟着雾走（雾吃掉细节的距离换代理体，雾吞掉的距离直接不画）。
// 调参：?citylod=0.2 让建筑更早换成简化体（0 = 一起雾就换，1 = 到雾的尽头才换）；?citycull=30 放宽剔除余量。
const cityQuery=new URLSearchParams(location.search);
const cityLod=parseFloat(cityQuery.get('citylod')),cityCull=parseFloat(cityQuery.get('citycull'));
const collision=new WalkCollision(root),nav=createTokyoNavigation(data,collision),batch=batchStaticScene(root,{
 fog:scene.fog,
 lodMeters:Number.isFinite(cityLod)?cityLod:undefined,
 cullMeters:Number.isFinite(cityCull)?cityCull:undefined,
 shadow:cityQuery.get('staticshadow')==='1',
});
 // Source meshes are retained by the collision index; only render batches and transparent meshes stay in the scene tree.
 const hidden=[];root.traverse(o=>{if(o.isMesh&&!o.visible)hidden.push(o);});hidden.forEach(o=>o.removeFromParent());root.updateMatrixWorld(true);root.traverse(o=>{o.matrixAutoUpdate=false;});scene.add(root);
 // shortcut: Imported architecture is static; add destructible modules when building damage is required.
 const towers=[],destructibles=[],buildings=[];
 const towerBlocked=(x,z,r=.16,hint=0)=>towers.some(o=>!o.dead&&Math.abs(nav.heightAt(x,z,hint)-o.floorY)<o.h&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);
 const free=(x,z,r=.45,hint=0)=>nav.free(x,z,r,hint)&&!towerBlocked(x,z,r,hint);
 function nearest(x,z,r=.7,hint=0){const p=nav.nearest(x,z,r,hint);if(!towerBlocked(p.x,p.z,r,p.floorY))return p;for(let d=1;d<12;d++)for(let k=0;k<8;k++){const q=nav.nearest(x+Math.cos(k*Math.PI/4)*d,z+Math.sin(k*Math.PI/4)*d,r,hint);if(!towerBlocked(q.x,q.z,r,q.floorY))return q;}throw Error('东京出生位置被占用');}
 function spawnWeakenSites(){
  if(towers.length)return towers;
  for(const [weaken,x0,z0,color]of [['shield',-9,-8,0xffcf21],['fire',11,10,0xff7a3c],['reinforce',-15,15,0xc56cff]]){
   const {x,z,floorY}=nearest(x0,z0,2),g=new T.Group();g.position.set(x,floorY,z);scene.add(g);
   for(const [w,h,d,y]of [[2.4,.4,2.4,.2],[1.2,2.7,1.2,1.7],[1.7,.3,1.7,3.2],[.15,1.5,.15,4]]){const m=block(g,w,h,d,color,0,y,0);m.material=m.material.clone();m.material.emissive.set(color);m.material.emissiveIntensity=.7;}
   const o={g,x,z,floorY,w:2.4,d:2.4,h:4.8,type:'tower',weaken,hp:180,maxHp:180,dead:false};towers.push(o);destructibles.push(o);
  }return towers;
 }
 function breakAt(x,z,r,damage,emit,impactY){let n=0;for(const o of towers){if(o.dead||Math.hypot(Math.max(0,Math.abs(x-o.x)-o.w/2),Math.max(0,Math.abs(z-o.z)-o.d/2))>r)continue;if(impactY!==undefined&&(impactY<o.floorY-.5||impactY>o.floorY+o.h+.5))continue;o.hp-=damage;emit?.(o.x,impactY??o.floorY+1,o.z,0xffcf21,8);if(o.hp<=0){o.dead=true;o.g.visible=false;n++;}}return n;}
 const population=createTokyoPopulation(nav,free);
 const tutorialPoint=(x,z,floorY)=>{const p=nearest(x,z,.25,floorY);if(Math.abs(p.floorY-floorY)>.3)throw Error('教学位置落在错误楼层');return p;};
 const tutorial={
  move:tutorialPoint(...TUTORIAL_LAYOUT.move),worker:tutorialPoint(...TUTORIAL_LAYOUT.worker),
  exit:TUTORIAL_LAYOUT.exit.map(p=>tutorialPoint(...p)),
 };
 const spawn=tutorialPoint(...TUTORIAL_LAYOUT.spawn),bossSpawn=nearest(10,-9,3.5,0),entries=[[-13,-16],[16,-16],[-16,16],[16,16]].map(([x,z])=>{const p=nearest(x,z,1);return[p.x,p.z];});
 const marker=new T.Group(),markerMaterial=new T.MeshBasicMaterial({color:0xfff3cf,toneMapped:false});
 const ring=new T.Mesh(new T.RingGeometry(.55,.65,32),markerMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.06;marker.add(ring);
 const diamond=new T.Mesh(new T.OctahedronGeometry(.19),markerMaterial);diamond.position.y=1.7;marker.add(diamond);marker.visible=false;scene.add(marker);
 const map=document.createElement('canvas');map.width=Math.ceil((data.bounds.maxX-data.bounds.minX)*2);map.height=Math.ceil((data.bounds.maxZ-data.bounds.minZ)*2);const ctx=map.getContext('2d');ctx.fillStyle='#283d49';ctx.fillRect(0,0,map.width,map.height);
 for(let i=0;i<data.nodes.length;i++){const p=nav.point(i);ctx.fillStyle=p.floorY>8?'#8c9ba3':p.floorY>2?'#a9a99f':'#c9b8a0';ctx.fillRect((p.x+58)*2,(55-p.z)*2,1,1);}
 return {root,multilevel:true,buildings,obstacles:[],destructibles,towers,spawn,bossSpawn,entries,spawnWeakenSites,breakAt,tutorial,
  populationSpot:population.spawn,populationTarget:population.wander,
  guideTo(p){marker.visible=!!p;if(p)marker.position.set(p.x,p.floorY,p.z);},
  free,nearest,heightAt:nav.heightAt,groundAt:(x,y,z)=>collision.raycast(new T.Vector3(x,y+.05,z),new T.Vector3(0,-1,0),Math.max(.1,y+5),true)?.point.y??-99,solid:(x,z,r=.1,y)=>y===undefined?!free(x,z,r):nav.bodyBlocked(x,y-.18-r,z,r,2*r+.2)||towers.some(o=>!o.dead&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r&&y>=o.floorY&&y<=o.floorY+o.h),
  canMove:(u,x,z,r=.16)=>nav.canMove(u,x,z,r)&&!towerBlocked(x,z,r,u.floorY),clear:(a,b,r=.16)=>{
   if(!nav.clear(a,b,r))return false;
   const steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.2);
   for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(towerBlocked(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,r,a.floorY))return false;}return true;
  },waypoint:nav.waypoint,
  beginNavigationFrame:nav.beginNavigationFrame,
  bossCanTarget:(b,p)=>Math.hypot(b.x-p.x,b.z-p.z)<40,
  cameraBlocked:(x,y,z,r=.16)=>nav.bodyBlocked(x,y-.18-r,z,r,2*r+.2),
  menuCamera:{from:[38,27,36],look:[0,3,-6]},
  drawMap(ctx,px,pz){ctx.drawImage(map,px(data.bounds.minX),pz(data.bounds.maxZ),px(data.bounds.maxX)-px(data.bounds.minX),pz(data.bounds.minZ)-pz(data.bounds.maxZ));},
  update(dt,camera){batch.updateDetailVisibility(camera.position,camera);},
 updateDetailVisibility:(p,c)=>batch.updateDetailVisibility(p,c),updateOutlineVisibility:batch.updateOutlineVisibility,
  diagnostics:{model:'tokyo-district',nodes:data.nodes.length,batches:batch.batchCount},
 };
}
