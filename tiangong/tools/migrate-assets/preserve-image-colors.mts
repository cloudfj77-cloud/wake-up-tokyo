import fs from 'node:fs';
import assert from 'node:assert/strict';
import {MATERIAL_LIBS} from '../../assets/game/shared-material-data.ts';
// These are the five color-encoded glTF slots; other image purposes stay linear.
const slots=['baseColorTexture','emissiveTexture','sheenColorTexture','specularColorTexture','diffuseTransmissionColorTexture'];
for(const lib of MATERIAL_LIBS){const srgb=new Set<number>();for(const m of lib.materials)for(const slot of slots){const binding=m[slot];if(binding===undefined)continue;const index=typeof binding==='number'?binding:binding.texture;srgb.add(lib.textures[index].source);}
 const path='assets/imported/full/materials-'+lib.name+'.glb',b=fs.readFileSync(path),length=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+length).toString()),binary=b.subarray(28+length);
 // Unrendered unlit hints retain the importer's original image color classification.
 g.materials=[...srgb].sort((a,b)=>a-b).map(image=>{const index=g.textures.findIndex((t:any)=>t.source===image);assert(index>=0);return{name:'srgb-import-hint-'+image,pbrMetallicRoughness:{baseColorTexture:{index}},extensions:{KHR_materials_unlit:{}}};});g.extensionsUsed=[...new Set([...(g.extensionsUsed??[]),'KHR_materials_unlit'])];const raw=Buffer.from(JSON.stringify(g)),json=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(json);const out=Buffer.alloc(28+json.length+binary.length);out.writeUInt32LE(0x46546c67);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);out.writeUInt32LE(binary.length,20+json.length);out.writeUInt32LE(0x004e4942,24+json.length);binary.copy(out,28+json.length);fs.writeFileSync(path,out);console.log(lib.name,'sRGB image purposes preserved:',srgb.size);}
