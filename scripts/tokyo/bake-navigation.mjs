import * as T from '../../node_modules/three/build/three.module.js';
import {writeFileSync} from 'node:fs';
import {buildScene,STAIR_SPECS,METRO_STAIRS} from '../../../tokyo-whitebox-three/scene.mjs';
import {applyDistrictLook} from '../../../tokyo-whitebox-three/district-look.mjs';
import {WalkCollision} from '../../tokyo/collision.js';
import {Capsule} from '../../node_modules/three/examples/jsm/math/Capsule.js';
const world=buildScene();applyDistrictLook(world);world.root.scale.setScalar(.55);world.root.position.set(11,3.3,-28.6);
const c=new WalkCollision(world.root),down=new T.Vector3(0,-1,0),bounds={minX:-58,maxX:78,minZ:-60,maxZ:55},step=.3;
const width=Math.ceil((bounds.maxX-bounds.minX)/step),depth=Math.ceil((bounds.maxZ-bounds.minZ)/step),nodes=[],cells=Array.from({length:width*depth},()=>[]);
function blocked(x,y,z,r=.16){const p=new T.Vector3(x,y+.18+r,z),q=new T.Vector3(x,y+1.02-r,z),cap=new Capsule(p.clone(),q,r);c.resolve(cap);return cap.start.distanceTo(p)>.025;}
function floorRay(x,top,z,distance){
 let best=null;
 for(const [dx,dz]of [[0,0],[.03,0],[-.03,0],[0,.03],[0,-.03]]){
  const hit=c.raycast(new T.Vector3(x+dx,top,z+dz),down,distance,true);
  if(hit&&(!best||hit.distance<best.distance))best=hit;
 }return best;
}
function floor(x,y,z){
 // The character foot spans small expansion joints between adjacent slabs.
 return floorRay(x,y+.4,z,.8)?.point.y;
}
for(let iz=0;iz<depth;iz++){
 for(let ix=0;ix<width;ix++){
  const x=bounds.minX+(ix+.5)*step,z=bounds.minZ+(iz+.5)*step;let top=16;
  for(let k=0;k<40&&top>-4.3;k++){
   const hit=floorRay(x,top,z,top+4.3);if(!hit)break;
   const y=hit.point.y;top=y-.08;if(y<-4.15||blocked(x,y,z))continue;
   if(cells[iz*width+ix].some(id=>Math.abs(nodes[id][2]-y)<.15))continue;
   const id=nodes.length;nodes.push([ix,iz,Math.round(y*1000)/1000,[]]);cells[iz*width+ix].push(id);
  }
 }
 if(iz%25===0)console.log('rows',iz,'/',depth,'nodes',nodes.length);
}
for(let i=0;i<nodes.length;i++){
 const [ix,iz,y,edges]=nodes[i],x=bounds.minX+(ix+.5)*step,z=bounds.minZ+(iz+.5)*step;
 for(const [dx,dz]of [[1,0],[0,1]]){
  if(ix+dx>=width||iz+dz>=depth)continue;
  for(const j of cells[(iz+dz)*width+ix+dx]){
   const ny=nodes[j][2];if(Math.abs(ny-y)>.38)continue;
   const xx=x+dx*step/2,zz=z+dz*step/2,fy=floor(xx,(y+ny)/2,zz);
   if(fy===undefined||Math.abs(fy-y)>.38||Math.abs(fy-ny)>.38||blocked(xx,fy,zz))continue;
   edges.push(j);nodes[j][3].push(i);
  }
 }
}
// Narrow stairs need centreline samples finer than the general navigation grid.
for(const stair of [...STAIR_SPECS,...METRO_STAIRS]){
 const a=new T.Vector3(...stair.a).multiplyScalar(.55).add(new T.Vector3(11,3.3,-28.6)),b=new T.Vector3(...stair.b).multiplyScalar(.55).add(new T.Vector3(11,3.3,-28.6));
 const n=Math.ceil(a.distanceTo(b)/.12);let prev=-1,accepted=0;
 for(let k=0;k<=n;k++){
  const p=a.clone().lerp(b,k/n),fy=floor(p.x,p.y,p.z);if(fy===undefined||Math.abs(fy-p.y)>.3||blocked(p.x,fy,p.z)){prev=-1;continue;}
  const ix=(p.x-bounds.minX)/step-.5,iz=(p.z-bounds.minZ)/step-.5,id=nodes.length;
  nodes.push([ix,iz,fy,[]]);accepted++;
  if(prev>=0){nodes[prev][3].push(id);nodes[id][3].push(prev);}prev=id;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
   const xx=Math.round(ix)+dx,zz=Math.round(iz)+dz;if(xx<0||zz<0||xx>=width||zz>=depth)continue;
   for(const j of cells[zz*width+xx]){
    const v=nodes[j],qx=bounds.minX+(v[0]+.5)*step,qz=bounds.minZ+(v[1]+.5)*step;
    if(Math.hypot(p.x-qx,p.z-qz)>.45||Math.abs(v[2]-fy)>.35)continue;
    let open=true;for(let t=1;t<4;t++){const x=p.x+(qx-p.x)*t/4,z=p.z+(qz-p.z)*t/4,y=floor(x,fy+(v[2]-fy)*t/4,z);if(y===undefined||blocked(x,y,z)){open=false;break;}}
    if(open){nodes[id][3].push(j);nodes[j][3].push(id);}
   }
  }
 }
 console.log('stair',stair.name,accepted,'/',n+1);
}
const seen=new Set();let largest=[];
for(let i=0;i<nodes.length;i++)if(!seen.has(i)){
 const q=[i];seen.add(i);for(let j=0;j<q.length;j++)for(const n of nodes[q[j]][3])if(!seen.has(n)){seen.add(n);q.push(n);}
 if(q.length>largest.length)largest=q;
}
const ids=new Map(largest.map((id,i)=>[id,i])),out=largest.map(id=>{const [x,z,y,e]=nodes[id];return[x,z,y,e.map(v=>ids.get(v))];});
writeFileSync(new URL('../../assets/scenes/tokyo-navigation.json',import.meta.url),JSON.stringify({bounds,step,width,depth,nodes:out,stairs:[...STAIR_SPECS,...METRO_STAIRS]}));
console.log('connected',out.length,'heights',out.reduce((v,n)=>Math.min(v,n[2]),Infinity),out.reduce((v,n)=>Math.max(v,n[2]),-Infinity));
