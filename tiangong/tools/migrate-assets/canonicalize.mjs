import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {basename,resolve} from 'node:path';
const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,16);
const folder=resolve('assets/imported/full');mkdirSync(folder,{recursive:true});
for(const source of process.argv.slice(2)){
 const bytes=readFileSync(source),jl=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+jl)),binarySource=Buffer.from(bytes.subarray(28+jl));let binary=binarySource;
 // Collapse multiple skin bindings into one exact joint palette. Alias joints preserve
 // distinct inverse bind matrices while inheriting the original animated bone pose.
 if((g.skins?.length??0)>1){
  const originalSkins=g.skins,union=[],matrices=[],palette=new Map(),skinMaps=[];
  const readAccessor=id=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView];return{a,v,offset:(v.byteOffset??0)+(a.byteOffset??0)};};
  for(const skin of originalSkins){const ib=readAccessor(skin.inverseBindMatrices),map=[];for(let j=0;j<skin.joints.length;j++){const originalJoint=skin.joints[j],matrix=binary.subarray(ib.offset+j*(ib.v.byteStride??64),ib.offset+j*(ib.v.byteStride??64)+64),key=originalJoint+':'+hash(matrix);if(!palette.has(key)){const alias=g.nodes.length;g.nodes.push({name:'skin-binding-'+hash(key),children:[]});(g.nodes[originalJoint].children??=[]).push(alias);palette.set(key,union.length);union.push(alias);matrices.push(Buffer.from(matrix));}map.push(palette.get(key));}skinMaps.push(map);}
  const append=(data,type,componentType,count)=>{const padding=Buffer.alloc((4-binary.length%4)%4),start=binary.length+padding.length;binary=Buffer.concat([binary,padding,data]);const view=g.bufferViews.length;g.bufferViews.push({buffer:0,byteOffset:start,byteLength:data.length});const id=g.accessors.length;g.accessors.push({bufferView:view,componentType,type,count});return id;};
  const nodeMeshes=new Map();
  for(const node of g.nodes){if(node.skin===undefined||node.mesh===undefined)continue;const key=node.mesh+':'+node.skin;let mesh=nodeMeshes.get(key);if(mesh===undefined){const copy=structuredClone(g.meshes[node.mesh]),map=skinMaps[node.skin];for(const primitive of copy.primitives){const id=primitive.attributes.JOINTS_0;if(id===undefined)continue;const {a,v,offset}=readAccessor(id),size=a.componentType===5121?1:2;const data=Buffer.alloc(a.count*4*2);for(let k=0;k<a.count;k++)for(let c=0;c<4;c++){const at=offset+k*(v.byteStride??4*size)+c*size,index=size===1?binary.readUInt8(at):binary.readUInt16LE(at);if(map[index]===undefined)throw Error('Invalid original skin joint');data.writeUInt16LE(map[index],(k*4+c)*2);}primitive.attributes.JOINTS_0=append(data,'VEC4',5123,a.count);}mesh=g.meshes.length;g.meshes.push(copy);nodeMeshes.set(key,mesh);}node.mesh=mesh;node.skin=0;}
  const ib=append(Buffer.concat(matrices),'MAT4',5126,union.length);g.skins=[{name:'unified-native-binding',joints:union,inverseBindMatrices:ib}];g.buffers[0].byteLength=binary.length;
 }
 const accessorBytes=id=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView];return binary.subarray((v.byteOffset??0)+(a.byteOffset??0),(v.byteOffset??0)+v.byteLength);};
 for(const [i,img]of (g.images??[]).entries()){const v=g.bufferViews[img.bufferView];img.name='image-'+hash(binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength));}
 // Stable identities are content based. Identical samplers and meshes share one source entry.
 if(g.samplers){const keep=[],seen=new Map(),remap=new Map();for(const [i,s]of g.samplers.entries()){const key=hash(JSON.stringify({...s,name:undefined}));if(!seen.has(key)){seen.set(key,keep.length);keep.push({...s,name:'sampler-'+key});}remap.set(i,seen.get(key));}g.samplers=keep;for(const t of g.textures??[])if(t.sampler!==undefined)t.sampler=remap.get(t.sampler);}
 if(g.images){const keep=[],seen=new Map(),remap=new Map();for(const [i,image]of g.images.entries()){const v=g.bufferViews[image.bufferView],key=hash(binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength));if(!seen.has(key)){seen.set(key,keep.length);keep.push(image);}remap.set(i,seen.get(key));}g.images=keep;for(const t of g.textures??[])t.source=remap.get(t.source);}
 if(g.textures){const keep=[],seen=new Map(),remap=new Map();for(const [i,t]of g.textures.entries()){const key=hash(JSON.stringify({...t,name:undefined}));if(!seen.has(key)){seen.set(key,keep.length);keep.push(t);}remap.set(i,seen.get(key));}g.textures=keep;const visit=o=>{if(!o||typeof o!=='object')return;for(const [k,v]of Object.entries(o)){if(k.endsWith('Texture')&&v&&typeof v.index==='number')v.index=remap.get(v.index);else visit(v);}};for(const m of g.materials??[])visit(m);}
 for(const t of g.textures??[])t.name='texture-'+hash(JSON.stringify({...t,name:undefined}));
 for(const m of g.materials??[])m.name=(m.name||'material').replace(/[^a-zA-Z0-9_-]/g,'-')+'-'+hash(JSON.stringify({...m,name:undefined}));
 if(g.materials){const keep=[],seen=new Map(),remap=new Map();for(const [i,m]of g.materials.entries()){const key=hash(JSON.stringify({...m,name:undefined}));if(!seen.has(key)){seen.set(key,keep.length);keep.push(m);}remap.set(i,seen.get(key));}g.materials=keep;for(const mesh of g.meshes??[])for(const p of mesh.primitives)if(p.material!==undefined)p.material=remap.get(p.material);}

 if(g.meshes){const used=new Set((g.nodes??[]).filter(n=>n.mesh!==undefined).map(n=>n.mesh));const kept=[],remap=new Map();for(const [i,m]of g.meshes.entries())if(used.has(i)){remap.set(i,kept.length);kept.push(m);}g.meshes=kept;for(const n of g.nodes??[])if(n.mesh!==undefined)n.mesh=remap.get(n.mesh);}
 if(g.meshes){const keep=[],seen=new Map(),remap=new Map();for(const [i,m]of g.meshes.entries()){const h=createHash('sha256');for(const p of m.primitives){h.update(JSON.stringify(p.material===undefined?{}:g.materials[p.material]));for(const [key,id]of Object.entries(p.attributes).sort()){h.update(key);h.update(accessorBytes(id));}if(p.indices!==undefined)h.update(accessorBytes(p.indices));}const key=h.digest('hex').slice(0,16);if(!seen.has(key)){seen.set(key,keep.length);keep.push({...m,name:'mesh-'+key});}remap.set(i,seen.get(key));}g.meshes=keep;for(const n of g.nodes??[])if(n.mesh!==undefined)n.mesh=remap.get(n.mesh);}
 for(const n of g.nodes??[])if(!n.name)n.name='node-'+hash(JSON.stringify(n));
 for(const s of g.scenes??[])s.name=basename(source,'.glb');
 for(const s of g.skins??[])if(!s.name)s.name='skin-'+hash(JSON.stringify(s.joints.map(i=>g.nodes[i].name)));
 let clamped=0;
 const colorIds=new Set((g.meshes??[]).flatMap(m=>m.primitives.map(p=>p.attributes.COLOR_0)).filter(i=>i!==undefined));
 for(const id of colorIds){const a=g.accessors[id],v=g.bufferViews[a.bufferView],size=a.type==='VEC4'?4:3;if(a.componentType!==5126)continue;for(let k=0;k<a.count;k++)for(let c=0;c<size;c++){const off=(v.byteOffset??0)+(a.byteOffset??0)+k*(v.byteStride??size*4)+c*4,value=binary.readFloatLE(off);if(value<0||value>1){binary.writeFloatLE(Math.max(0,Math.min(1,value)),off);clamped++;}}if(a.min)a.min=a.min.map(v=>Math.max(0,Math.min(1,v)));if(a.max)a.max=a.max.map(v=>Math.max(0,Math.min(1,v)));}
 const raw=Buffer.from(JSON.stringify(g)),json=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(json);const out=Buffer.alloc(28+json.length+binary.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);out.writeUInt32LE(binary.length,20+json.length);out.writeUInt32LE(0x004e4942,24+json.length);binary.copy(out,28+json.length);
 const dest=resolve(folder,basename(source));writeFileSync(dest,out);console.log(JSON.stringify({source,dest,bytes:out.length,sourceSha256:hash(bytes),outputSha256:hash(out),clamped}));
}
