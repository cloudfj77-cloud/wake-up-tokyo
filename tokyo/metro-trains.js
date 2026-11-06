import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const TRACKS=[5.225,11.275],SPEED=7.2,MIN_X=-80,MAX_X=88;
export function inMetroArea(p){
 const y=p?.floorY??0;
 return y<-.5&&p.x>-45&&p.x<50&&p.z>0&&p.z<18||Math.abs(y)<.3&&p.x>-16&&p.x<2&&p.z>-35&&p.z<-21;
}
// Extract the two existing parked trains before collision indexing and static batching.
export function createMetroTrains(root,scene){
 root.updateMatrixWorld(true);const sources=[[],[]],candidates=[],envelopes=[new T.Box3(),new T.Box3()],metro=root.getObjectByName('07_Sunken_Metro');
 if(!metro)throw Error('东京地图缺少地铁站模型');
 metro.traverse(mesh=>{
  if(!mesh.isMesh)return;mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
  if(b.min.x< -16.3||b.max.x>35.3||b.min.y< -4.55||b.max.y> -2.49)return;
  const side=TRACKS.findIndex(z=>b.min.z>=z-.83&&b.max.z<=z+.83);
  if(side>=0){candidates.push({mesh,bounds:b,side});const size=b.getSize(new T.Vector3());if(size.y>1.6&&size.y<1.7&&size.x>4.6&&size.x<5&&size.z>1.4&&size.z<1.55)envelopes[side].union(b);}
 });
 for(const item of candidates){const box=envelopes[item.side];if(!box.isEmpty()&&item.bounds.min.x>=box.min.x-.12&&item.bounds.max.x<=box.max.x+.12&&Math.abs((item.bounds.min.z+item.bounds.max.z)/2-TRACKS[item.side])<.81&&item.bounds.min.z>=TRACKS[item.side]-.81&&item.bounds.max.z<=TRACKS[item.side]+.81)sources[item.side].push(item);}
 const materials=new Map();
 const trains=sources.map((parts,i)=>{
  if(!parts.length)throw Error('地铁列车提取失败');
  const box=new T.Box3();parts.forEach(p=>box.union(p.bounds));const center=(box.min.x+box.max.x)/2,group=new T.Group();group.name=`Metro train ${i+1}`;
  const byMaterial=new Map();
  for(const {mesh}of parts){
   const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geometry.applyMatrix4(mesh.matrixWorld);geometry.translate(-center,0,0);
   for(const name of Object.keys(geometry.attributes))if(!['position','normal'].includes(name))geometry.deleteAttribute(name);
   if(!geometry.attributes.normal)geometry.computeVertexNormals();
   const original=mesh.material,glow=original.emissive?.getHex()>0&&original.emissiveIntensity>0,key=original.transparent?'glass:'+original.opacity:glow?'glow':'body';
   const tint=glow?original.emissive:original.color,colors=new Float32Array(geometry.attributes.position.count*3);for(let k=0;k<colors.length;k+=3){colors[k]=tint.r;colors[k+1]=tint.g;colors[k+2]=tint.b;}geometry.setAttribute('color',new T.BufferAttribute(colors,3));
   if(!materials.has(key))materials.set(key,glow?new T.MeshBasicMaterial({vertexColors:true}):new T.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.15,transparent:original.transparent,opacity:original.opacity,side:original.side}));
   const material=materials.get(key),list=byMaterial.get(material)||[];list.push(geometry);byMaterial.set(material,list);mesh.removeFromParent();
  }
  const spacing=box.max.x-box.min.x+.45,copies=Math.ceil((MAX_X-MIN_X)/spacing)+3;
  for(const [material,geometries]of byMaterial){const geometry=mergeGeometries(geometries);if(!geometry)throw Error('地铁车厢合批失败');geometries.forEach(g=>g.dispose());const mesh=new T.InstancedMesh(geometry,material,copies);mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);}
  scene.add(group);box.translate(new T.Vector3(-center,0,0));return{group,local:box,boxes:Array.from({length:copies},()=>new T.Box3()),positions:Array(copies).fill(0),spacing,copies,direction:i?-1:1};
 });
 let time=0,active=true;const transform=new T.Matrix4(),shift=new T.Vector3();
 function update(dt,running=true){
  active=!!running;if(active)time+=Math.max(0,Number.isFinite(dt)?dt:0);
  for(const train of trains){
   train.group.visible=active;if(!active)continue;
   const offset=((train.direction*time*SPEED)%train.spacing+train.spacing)%train.spacing;
   for(let k=0;k<train.copies;k++){const x=MIN_X+(k-1)*train.spacing+offset;train.positions[k]=x;transform.makeTranslation(x,0,0);for(const mesh of train.group.children)mesh.setMatrixAt(k,transform);train.boxes[k].copy(train.local).translate(shift.set(x,0,0));}
   for(const mesh of train.group.children)mesh.instanceMatrix.needsUpdate=true;
  }
 }
 const probe=new T.Vector3(),expanded=new T.Box3(),ray=new T.Ray();update(0);
 return{
  update,
  trackBlocked(x,z,r=.16,floor=0){return Math.abs(floor+3.85)<.9&&x> -80-r&&x<88+r&&TRACKS.some(track=>Math.abs(z-track)<.83+r);},
  solid(x,y,z,r=.1){probe.set(x,y,z);return trains.some(t=>t.group.visible&&t.boxes.some(box=>expanded.copy(box).expandByScalar(r).containsPoint(probe)));},
  raycast(origin,direction,distance){ray.set(origin,direction);return trains.some(t=>t.group.visible&&t.boxes.some(box=>ray.intersectBox(box,probe)&&probe.distanceTo(origin)<distance));},
  snapshot(){return{time,active,sourceMeshes:sources.reduce((n,s)=>n+s.length,0),drawMeshes:trains.reduce((n,t)=>n+t.group.children.length,0),trains:trains.map(t=>({x:t.direction*time*SPEED,z:(t.local.min.z+t.local.max.z)/2,speed:t.direction*SPEED,visible:t.group.visible,segments:t.positions.map((x,i)=>({x,min:t.boxes[i].min.x,max:t.boxes[i].max.x}))}))};},
 };
}
