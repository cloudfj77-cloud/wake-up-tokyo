import * as T from 'three';
import {block} from './world.js';
import {createTidewaterNavigation} from './tidewater-navigation.js';
import {STAGES} from './vendor/inkwave/src/world/stages/index.js';
import {Level} from './vendor/inkwave/src/world/level.js';
import {PropKit} from './vendor/inkwave/src/world/props.js';
import {dressingFor} from './vendor/inkwave/src/world/dressing.js';
import {createTextureLibrary} from './vendor/inkwave/src/world/texlib.js';
import {createMuralTexture} from './vendor/inkwave/src/world/murals.js';
import {createLevelMaterial} from './vendor/inkwave/src/world/levelMaterial.js';
import {Environment} from './vendor/inkwave/src/world/environment.js';
import {Decor} from './vendor/inkwave/src/world/decor.js';
import lightmapMeta from './vendor/inkwave/assets/lightmaps/tidewater.json' with {type:'json'};
import {G} from './vendor/inkwave/src/core/ctx.js';

export async function loadTidewater(scene,renderer,{quality='standard'}={}){
 const root=new T.Group();root.name='Tidewater Plaza';scene.add(root);
 const props=new PropKit(root,{quality:quality==='low'?'low':'high'}),colliders=[];
 for(const it of dressingFor('tidewater'))if(it.onlyIn!=='zones')colliders.push(...props.add(it.type,it).colliders);
 props.build();props.setNight(0);
 const original=STAGES.tidewater.LAYOUT;
 const layout={...original,single:original.single.filter(d=>d.onlyIn!=='zones'),half:original.half.filter(d=>d.onlyIn!=='zones')};
 const level=new Level(layout,colliders);
 G.level=level;G.renderer=renderer;G.scene=scene;G.settings={quality:quality==='low'?'low':'medium'};
 const [texlib,murals]=await Promise.all([createTextureLibrary(renderer,{size:256}),createMuralTexture('tidewater')]);
 // An empty ink texture leaves the original dry brick/stucco/paving shader intact.
 const empty=new T.DataTexture(new Uint8Array([0,0,0,0]),1,1);empty.needsUpdate=true;
 level.layoutLightmap(lightmapMeta.ppm,lightmapMeta.size);
 let lightmap=null;
 if(level.layoutHash===lightmapMeta.hash){lightmap=await new T.TextureLoader().loadAsync(new URL('./vendor/inkwave/assets/lightmaps/tidewater.png',import.meta.url).href);lightmap.colorSpace=T.NoColorSpace;lightmap.anisotropy=4;}
 else{level.lightSize=0;for(const face of level.faces)face.light=null;}
 const material=createLevelMaterial(empty,1,murals,{texlib,lightmap});
 const mesh=new T.Mesh(level.buildGeometry(1),material);mesh.name='Tidewater architecture';mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
 const decor=new Decor(root,level);for(const pad of decor.pads){pad.g.visible=false;}
 // Environment owns its daylight, sea and sky. Disable the old city's light rig.
 for(const child of scene.children)if(child.isLight)child.visible=false;
 const footprint=level.blocks.filter(b=>b.axes[1].y>.9999&&b.aabbMax.y<.01&&b.aabbMax.y>-2.5&&b.aabbMin.y<-1).map(b=>({minX:b.aabbMin.x,maxX:b.aabbMax.x,minZ:b.aabbMin.z,maxZ:b.aabbMax.z,cx:b.center.x,cz:b.center.z,hx:b.half.x,hz:b.half.z,ax:b.axes[0].x,az:b.axes[0].z}));
 const environment=new Environment(renderer,scene,{bounds:level.bounds,footprint,theme:'day',shadowSize:2048});
 G.env=environment;
 const nav=createTidewaterNavigation(level),towers=[],destructibles=[];
 const buildings=level.blocks.filter(b=>!b.hidden&&b.roof&&b.half.y>1).map(b=>({x:b.center.x,z:b.center.z,w:b.aabbMax.x-b.aabbMin.x,d:b.aabbMax.z-b.aabbMin.z,h:b.half.y*2,dead:false}));
 function towerBlocked(x,z,r=.45){return towers.some(o=>!o.dead&&Math.abs(o.x-x)<o.w/2+r&&Math.abs(o.z-z)<o.d/2+r);}
 const free=(x,z,r=.45)=>nav.free(x,z,r)&&!towerBlocked(x,z,r);
 function nearest(x,z,r=.7){const p=nav.nearest(x,z,r);if(free(p.x,p.z,r))return p;for(let d=1;d<15;d++)for(let k=0;k<16;k++){const a=k*Math.PI/8,q=nav.nearest(x+Math.cos(a)*d,z+Math.sin(a)*d,r);if(free(q.x,q.z,r))return q;}throw Error('没有可用出生位置');}
 function spawnWeakenSites(){
  if(towers.length)return towers;
  for(const [weaken,x0,z0,color]of[['shield',-10,-23,0xffcf21],['fire',12,-8,0xff7a3c],['reinforce',-12,23,0xc56cff]]){
   const {x,z}=nearest(x0,z0,2),g=new T.Group();g.position.set(x,nav.heightAt(x,z),z);scene.add(g);
   for(const [w,h,d,y]of[[2.4,.4,2.4,.2],[1.2,2.7,1.2,1.7],[1.7,.3,1.7,3.2],[.15,1.5,.15,4]]){const m=block(g,w,h,d,color,0,y,0);m.material=m.material.clone();m.material.emissive.set(color);m.material.emissiveIntensity=.7;}
   const light=new T.PointLight(color,3,10);light.position.y=3;g.add(light);
   const o={g,x,z,w:2.4,d:2.4,h:4.8,type:'tower',weaken,hp:180,maxHp:180,dead:false};towers.push(o);destructibles.push(o);
  }return towers;
 }
 function breakAt(x,z,r,damage,emit,impactY){let n=0;for(const o of towers){if(o.dead||Math.hypot(Math.max(0,Math.abs(x-o.x)-o.w/2),Math.max(0,Math.abs(z-o.z)-o.d/2))>r)continue;o.hp-=damage;emit?.(o.x,impactY??nav.heightAt(o.x,o.z)+1,o.z,0xffcf21,8);if(o.hp<=0){o.dead=true;o.g.visible=false;n++;}}return n;}
 const spawn=nearest(-8,-27,1.2),bossSpawn=nearest(9,24,3.5);
 const entries=[[-12,-32],[12,-26],[-12,26],[12,32]].map(([x,z])=>{const p=nearest(x,z,1.5);return[p.x,p.z];});
 const map=document.createElement('canvas');map.width=112;map.height=188;const ctx=map.getContext('2d');ctx.fillStyle='#416e86';ctx.fillRect(0,0,map.width,map.height);
 for(let i=0;i<nav.connected.length;i++)if(nav.connected[i]){const p=nav.point(i);ctx.fillStyle=nav.heights[i]>.5?'#ddd1b9':'#ba9988';ctx.fillRect((p.x+28)*2,(47-p.z)*2,1.1,1.1);}
 function drawMap(ctx,px,pz){ctx.drawImage(map,px(-28),pz(47),px(28)-px(-28),pz(-47)-pz(47));}
 function setQuality(q){environment.sun.castShadow=q!=='low';G.settings.quality=q==='low'?'low':'medium';}
 setQuality(quality);
 let time=0;
 return {root,buildings,obstacles:[],destructibles,towers,spawn,bossSpawn,entries,spawnWeakenSites,breakAt,
  bossCanTarget:(b,target)=>Math.hypot(target.x-b.x,target.z-b.z)<=28,
  heightAt:nav.heightAt,free,nearest,solid:(x,z,r)=>!free(x,z,r),
  canMove:(u,x,z,r=.4)=>nav.canMove(u,x,z,r)&&!towerBlocked(x,z,r),
  clear:(a,b,r=.1)=>nav.clear(a,b,r)&&!towers.some(o=>!o.dead&&segmentHits(a,b,o,r)),
  waypoint:nav.waypoint,drawMap,setQuality,
  cameraBlocked:(x,y,z,r)=>nav.bodyBlocked(x,y-r,z,r,r*2),
  menuCamera:{from:layout.art.from,look:layout.art.look},
  update(dt,camera){time+=dt;props.update(dt,time);decor.update(dt);environment.update(dt,camera);},
  diagnostics:{bakedAO:!!lightmap,nodes:nav.nodeCount,props:props.stats(),blocks:level.blocks.length},
 };
}
function segmentHits(a,b,o,r){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.4));for(let i=0;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n;if(Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r)return true;}return false;}
