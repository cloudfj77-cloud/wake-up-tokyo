import * as T from 'three';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function splatterTexture(){
 const size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=(x+.5)/size*2-1,dy=(y+.5)/size*2-1,a=Math.atan2(dy,dx),r=Math.hypot(dx,dy),edge=.65+.10*Math.sin(a*7)+.07*Math.cos(a*11);
  const drop=[[.7,.42,.11],[-.65,-.48,.13],[.35,-.78,.08],[-.72,.3,.09]].some(([u,v,s])=>Math.hypot(dx-u,dy-v)<s);
  const i=(y*size+x)*4;data[i]=160;data[i+1]=35;data[i+2]=225;data[i+3]=r<edge||drop?255:0;
 }
 const texture=new T.DataTexture(data,size,size);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;return texture;
}

// Spatially coalesce repeated shots and batch permanent decals; no age-based eviction.
export function createSurfacePaint(scene,traceSurface){
 const texture=splatterTexture(),material=new T.MeshStandardMaterial({map:texture,color:0xffffff,emissive:0x7616af,emissiveIntensity:.35,roughness:.19,transparent:true,opacity:1,alphaTest:.15,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const root=new T.Group();root.name='Persistent purple juice';scene.add(root);
 const cells=new Set(),batches=new Map(),strokes=[],drips=[],proxy=new T.Mesh(),rotation=new T.Quaternion(),orientation=new T.Euler(),front=new T.Vector3(0,0,1),up=new T.Vector3(0,1,0);let marks=0;
 function place(hit,width,height=width){
  const n=hit.normal,point=hit.point,key=[Math.round(point.x*5),Math.round(point.y*5),Math.round(point.z*5),...n.toArray().map(v=>Math.round(v*2)),width<.25?'drip':'splat'].join(',');
  if(cells.has(key))return false;
  proxy.geometry=hit.geometry;proxy.matrixWorld.copy(hit.matrix);rotation.setFromUnitVectors(front,n);orientation.setFromQuaternion(rotation);
  const decal=new DecalGeometry(proxy,point,orientation,new T.Vector3(width,height,.16));
  const source=decal.attributes,position=[],normal=[],uv=[];
  for(let i=0;i<source.position.count;i+=3){
   if(new T.Vector3().fromBufferAttribute(source.normal,i).dot(n)<.5)continue;
   for(let j=0;j<3;j++){const k=i+j;position.push(source.position.getX(k)+n.x*.004,source.position.getY(k)+n.y*.004,source.position.getZ(k)+n.z*.004);normal.push(source.normal.getX(k),source.normal.getY(k),source.normal.getZ(k));uv.push(source.uv.getX(k),source.uv.getY(k));}
  }
  decal.dispose();if(!position.length)return false;
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normal,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const chunk=[Math.floor(point.x/8),Math.floor(point.y/8),Math.floor(point.z/8)].join(',');let batch=batches.get(chunk);
  if(!batch){batch=new T.Mesh(geometry,material);batch.name='Juice surface batch';batch.renderOrder=2;root.add(batch);batches.set(chunk,batch);}
  else{const old=batch.geometry,merged=mergeGeometries([old,geometry]);if(!merged){geometry.dispose();return false;}batch.geometry=merged;old.dispose();geometry.dispose();}
  batch.geometry.computeBoundingSphere();cells.add(key);strokes.push([...point.toArray(),...n.toArray(),width,height]);marks++;return true;
 }
 function splash(point,direction,power=false){
  const d=direction.clone().normalize(),from=point.clone().addScaledVector(d,-.4);
  let hit=traceSurface(from,d,1.1);
  if(!hit)hit=traceSurface(point.clone().addScaledVector(up,.2),new T.Vector3(0,-1,0),3);
  if(!hit)return false;
  if(!place(hit,power?1.4:.85,Math.abs(hit.normal.y)<.4?1:.85))return false;
  if(Math.abs(hit.normal.y)<.4)drips.push({point:hit.point.clone(),normal:hit.normal.clone(),time:0,step:0});
  return true;
 }
 function update(dt){
  for(let i=drips.length-1;i>=0;i--){const drip=drips[i];drip.time+=Math.max(0,dt);
   while(drip.step<5&&drip.time>=(drip.step+1)*.1){drip.step++;const origin=drip.point.clone().addScaledVector(up,-drip.step*.2).addScaledVector(drip.normal,.09),hit=traceSurface(origin,drip.normal.clone().negate(),.18);if(hit&&hit.normal.dot(drip.normal)>.9)place(hit,.18,.45);}
   if(drip.step===5)drips.splice(i,1);
  }
 }
 function clear(){for(const batch of batches.values())batch.geometry.dispose();root.clear();batches.clear();cells.clear();strokes.length=0;drips.length=0;marks=0;}
 function restore(records=[]){
  clear();if(!Array.isArray(records))return;
  for(const s of records){
   if(!Array.isArray(s)||s.length!==8||!s.every(Number.isFinite)||s.slice(0,3).some(v=>Math.abs(v)>1000)||s[6]<=0||s[6]>2||s[7]<=0||s[7]>2)continue;
   const normal=new T.Vector3(s[3],s[4],s[5]);if(Math.abs(normal.length()-1)>.05)continue;normal.normalize();
   const origin=new T.Vector3(s[0],s[1],s[2]).addScaledVector(normal,.08),hit=traceSurface(origin,normal.clone().negate(),.16);if(hit&&hit.normal.dot(normal)>.9)place(hit,s[6],s[7]);
  }
 }
 return{root,splash,update,clear,restore,serialize:()=>strokes.map(s=>s.slice()),dispose(){clear();scene.remove(root);material.dispose();texture.dispose();},snapshot(){return{marks,batches:batches.size,flowing:drips.length,vertices:[...batches.values()].reduce((n,m)=>n+m.geometry.attributes.position.count,0)};}};
}
