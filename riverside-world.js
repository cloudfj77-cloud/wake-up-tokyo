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

export async function loadRiverside(scene){
 const draco=new DRACOLoader().setDecoderPath('/draco/');
 const loader=new GLTFLoader().setDRACOLoader(draco);
 const gltf=await loader.loadAsync(new URL('./assets/scenes/riverside.glb',import.meta.url).href);
 draco.dispose();const root=gltf.scene;root.scale.setScalar(.55);root.position.set(0,-.715,19.25);root.updateMatrixWorld(true);scene.add(root);
 const obstacles=[],destructibles=[],buildings=[],towers=[];
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=.95;}}});
 function add(g,type,hp){const box=new T.Box3().setFromObject(g),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());const o={g,x:c.x,z:c.z,w:size.x,d:size.z,h:size.y,hp,maxHp:hp,type,dead:false};obstacles.push(o);destructibles.push(o);if(type==='building')buildings.push(o);return o;}
 for(const g of root.children){if(/^(Machiya|Urban_building|Urban building)/.test(g.name))add(g,'building',220);else if(/^(Tokyo_Tower|Tokyo Tower|Ferris_wheel|Ferris wheel)/.test(g.name)){const box=new T.Box3().setFromObject(g),c=box.getCenter(new T.Vector3()),sz=box.getSize(new T.Vector3());obstacles.push({x:c.x,z:c.z,w:sz.x,d:sz.z,dead:false});}}
 function heightAt(x,z){const bridgeHeight=bridgeDeckHeight(x,z),ix=Math.round((x-terrain.minX)/terrain.step),iz=Math.round((z-terrain.minZ)/terrain.step),terrainHeight=ix<0||iz<0||ix>=terrain.size||iz>=terrain.size?-99:terrain.heights[iz*terrain.size+ix];return bridgeHeight===null?terrainHeight:Math.max(bridgeHeight,terrainHeight);}
 function solid(x,z,r=.45){return x<=-60||x>=60||z<=-68||z>=57||hitsBridgeRail(x,z,r)||obstacles.some(o=>!o.dead&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r)||[[0,0],[r,0],[-r,0],[0,r],[0,-r]].some(([dx,dz])=>{const ix=Math.round((x+dx-terrain.minX)/terrain.step),iz=Math.round((z+dz-terrain.minZ)/terrain.step);return terrain.blocked?.[iz*terrain.size+ix]===1;});}
 function free(x,z,r=.45){return !solid(x,z,r)&&[[0,0],[r,0],[-r,0],[0,r],[0,-r]].every(([dx,dz])=>heightAt(x+dx,z+dz)>-2);}
 function waypoint(u,x,z){if(u.x*x<0&&Math.abs(x)>9){const bz=[26.4,-15.4].sort((a,b)=>Math.abs(a-u.z)+Math.abs(a-z)-Math.abs(b-u.z)-Math.abs(b-z))[0];if(Math.abs(u.z-bz)>1.2)return {x:Math.sign(u.x)*12.5,z:bz};return {x:Math.sign(x)*13,z:bz};}return {x,z};}
 function nearest(x,z,r=.7){if(free(x,z,r))return {x,z};for(let radius=.5;radius<130;radius+=.5)for(let i=0;i<24;i++){const a=i*Math.PI/12,xx=x+Math.cos(a)*radius,zz=z+Math.sin(a)*radius;if(free(xx,zz,r))return {x:xx,z:zz};}throw Error('No walkable spawn');}
 // 主角从西北侧开阔街口开始，远离桥头、任务塔和首批巡逻队。
 const spawn=nearest(-34,34,1),bossSpawn=nearest(33,-24,4);
 for(const p of [[-35,14],[34,-12],[12,-52]]){const {x,z}=nearest(...p,2),g=new T.Group();g.position.set(x,heightAt(x,z),z);scene.add(g);block(g,2.4,.5,2.4,0x657575,0,.25,0);block(g,1.4,3,1.4,0x425c64,0,1.8,0);block(g,1.7,.25,1.7,0xd7865a,0,3.5,0);block(g,.15,2,.15,0x576b70,0,4.5,0);block(g,1.5,.5,.3,0x62b1d0,0,5.5,0);towers.push(add(g,'tower',180));}
 const entries=[[34,40],[-35,40],[-35,-57],[34,-57]].map(p=>{const q=nearest(...p,2);return[q.x,q.z];});
 function clear(a,b,r=.1){const d=Math.hypot(a.x-b.x,a.z-b.z),n=Math.ceil(d/.7);for(let i=1;i<n;i++)if(solid(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,r))return false;return true;}
 function breakAt(x,z,r,damage,emit){let count=0;for(const o of destructibles){if(o.dead)continue;const nx=T.MathUtils.clamp(x,o.x-o.w/2,o.x+o.w/2),nz=T.MathUtils.clamp(z,o.z-o.d/2,o.z+o.d/2);if(Math.hypot(x-nx,z-nz)>r)continue;o.hp-=damage;emit?.(nx,heightAt(nx,nz)+1,nz,o.type==='tower'?0xe5a374:0xbab3a2,12);if(o.hp<=0){o.dead=true;o.g.visible=false;count++;emit?.(o.x,2,o.z,0xb5ae9f,35);}}return count;}
 return {root,obstacles,destructibles,buildings,towers,free,clear,breakAt,heightAt,solid,waypoint,nearest,spawn,bossSpawn,entries};
}
