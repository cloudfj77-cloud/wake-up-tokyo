// 从河畔原始网格预提取柱体，运行时不再对整张街景反复做三角形射线。
import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';import * as T from 'three';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),mod={exports:{}};
vm.runInNewContext(fs.readFileSync('node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js','utf8'),{module:mod,exports:mod.exports,require,console,process, __dirname:process.cwd(),setTimeout,clearTimeout,Buffer});
const draco=await mod.exports({}),raw=fs.readFileSync('assets/scenes/riverside.glb');let len=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+len));let bin=raw.subarray(28+len);const output=[];
for(const node of json.nodes){if(node.mesh==null||!/pole|streetlight|piers|bridge|torii/i.test(node.name||''))continue;
 const prim=json.meshes[node.mesh].primitives[0],ext=prim.extensions.KHR_draco_mesh_compression,bv=json.bufferViews[ext.bufferView],bytes=bin.subarray(bv.byteOffset||0,(bv.byteOffset||0)+bv.byteLength),decoder=new draco.Decoder(),buffer=new draco.DecoderBuffer();buffer.Init(new Int8Array(bytes),bytes.length);const g=new draco.Mesh();decoder.DecodeBufferToMesh(buffer,g);const attr=decoder.GetAttributeByUniqueId(g,ext.attributes.POSITION),a=new draco.DracoFloat32Array();decoder.GetAttributeFloatForAllPoints(g,attr,a);let n=g.num_points(),pos=new Float32Array(n*3);for(let i=0;i<pos.length;i++)pos[i]=a.GetValue(i);
 const parent=Int32Array.from({length:n},(_,i)=>i),map=new Map();const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
 for(let i=0;i<n;i++){const key=[0,1,2].map(k=>Math.round(pos[i*3+k]*1e4)).join(',');if(map.has(key))union(i,map.get(key));else map.set(key,i);}
 const face=new draco.DracoInt32Array();for(let i=0;i<g.num_faces();i++){decoder.GetFaceFromMesh(g,i,face);union(face.GetValue(0),face.GetValue(1));union(face.GetValue(0),face.GetValue(2));}
 const boxes=new Map();for(let i=0;i<n;i++){const r=find(i);if(!boxes.has(r))boxes.set(r,new T.Box3());boxes.get(r).expandByPoint(new T.Vector3(...pos.subarray(i*3,i*3+3)));}
 const matrix=new T.Matrix4();if(node.matrix)matrix.fromArray(node.matrix);else matrix.compose(new T.Vector3(...node.translation||[0,0,0]),new T.Quaternion(...node.rotation||[0,0,0,1]),new T.Vector3(...node.scale||[1,1,1]));
 const candidates=[];for(const b of boxes.values()){const world=b.clone().applyMatrix4(matrix),s=world.getSize(new T.Vector3()).multiplyScalar(.55);if(s.y>.65&&Math.max(s.x,s.z)<1.6&&s.y>Math.max(s.x,s.z)*1.6)candidates.push({min:b.min.toArray(),max:b.max.toArray(),size:s.toArray()});}
 if(/utility poles/i.test(node.name)){
 const grid=new Map(),v=new T.Vector3();for(let i=0;i<n;i++){v.fromArray(pos,i*3).applyMatrix4(matrix).multiplyScalar(.55);const ix=Math.floor(v.x/.22),iz=Math.floor(v.z/.22),key=ix+','+iz;if(!grid.has(key))grid.set(key,{ix,iz,box:new T.Box3()});grid.get(key).box.expandByPoint(v);}
 const tall=new Map([...grid].filter(([k,r])=>r.box.max.y-r.box.min.y>.8));let cols=[];
 while(tall.size){let first=tall.values().next().value,queue=[first],b=new T.Box3();tall.delete(first.ix+','+first.iz);while(queue.length){const r=queue.pop();b.union(r.box);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const key=(r.ix+dx)+','+(r.iz+dz);if(tall.has(key)){queue.push(tall.get(key));tall.delete(key);}}}const size=b.getSize(new T.Vector3());if(Math.max(size.x,size.z)<1.6&&size.y>1)cols.push(b);}
 console.log('UTILITY columns',cols.length,cols.slice(0,4).map(b=>({min:b.min.toArray(),max:b.max.toArray()})));
 const inverse=matrix.clone().invert();for(const box of cols){const local=box.clone();local.min.divideScalar(.55);local.max.divideScalar(.55);local.applyMatrix4(inverse);candidates.push({min:local.min.toArray(),max:local.max.toArray(),size:box.getSize(new T.Vector3()).toArray()});}
}
console.log(node.name,'points',n,'components',boxes.size,'pillars',candidates.length,candidates.slice(0,3).map(c=>c.size));
 output.push({name:T.PropertyBinding.sanitizeNodeName(node.name),nodeMatrix:matrix.toArray(),pillars:candidates.map(({min,max})=>({min,max}))});for(const o of [face,a,g,buffer,decoder])draco.destroy(o);
}
fs.writeFileSync('assets/scenes/pillars.json',JSON.stringify({sourceHash:createHash('sha256').update(raw).digest('hex'),meshes:output.map(({name,pillars})=>({name,pillars}))},null,2)+'\n');
