import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
function unique(items,key){const found=new Map(),values=[],map=items.map(item=>{const k=key(item);if(!found.has(k)){found.set(k,values.length);values.push(item);}return found.get(k);});return {values,map};}
// 场景导出器会给同一张粗糙度贴图和同一种材质生成数百个副本。只合并内容完全一致的资源，网格和碰撞不动。
export function dedupeRenderResources(input){
 const jsonLength=input.readUInt32LE(12),data=JSON.parse(input.subarray(20,20+jsonLength).toString()),binHeader=20+jsonLength,bin=input.subarray(binHeader+8,binHeader+8+input.readUInt32LE(binHeader));
 const before={images:data.images.length,samplers:data.samplers.length,textures:data.textures.length,materials:data.materials.length};
 const images=unique(data.images,image=>{const view=data.bufferViews[image.bufferView],bytes=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);return stable({...image,name:undefined,bufferView:undefined,content:createHash('sha256').update(bytes).digest('hex')});});data.images=images.values;
 const samplers=unique(data.samplers,stable);data.samplers=samplers.values;
 const textures=unique(data.textures.map(t=>({...t,source:images.map[t.source],...(t.sampler===undefined?{}:{sampler:samplers.map[t.sampler]})})),t=>stable({...t,name:undefined}));data.textures=textures.values;
 function remapTextures(value){if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){if(key.endsWith('Texture')&&item&&Number.isInteger(item.index))item.index=textures.map[item.index];else remapTextures(item);}}
 for(const material of data.materials)remapTextures(material);
 const materials=unique(data.materials,m=>stable({...m,name:undefined}));data.materials=materials.values;
 for(const mesh of data.meshes)for(const primitive of mesh.primitives)if(primitive.material!==undefined)primitive.material=materials.map[primitive.material];
 const json=Buffer.from(JSON.stringify(data)),padded=Buffer.alloc(Math.ceil(json.length/4)*4,0x20);json.copy(padded);const out=Buffer.alloc(12+8+padded.length+8+bin.length);input.copy(out,0,0,12);out.writeUInt32LE(out.length,8);out.writeUInt32LE(padded.length,12);out.writeUInt32LE(0x4e4f534a,16);padded.copy(out,20);const at=20+padded.length;out.writeUInt32LE(bin.length,at);out.writeUInt32LE(0x004e4942,at+4);bin.copy(out,at+8);
 return {buffer:out,before,after:{images:data.images.length,samplers:data.samplers.length,textures:data.textures.length,materials:data.materials.length}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[2]||'assets/scenes/tokyo-district.glb',result=dedupeRenderResources(readFileSync(file));writeFileSync(file,result.buffer);console.log(JSON.stringify({file,before:result.before,after:result.after}));}
