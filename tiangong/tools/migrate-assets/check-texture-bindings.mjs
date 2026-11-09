import {parseGlb,validateMaterialUvSets} from '@forgeax/engine/gltf';
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
let checked=0;
for(const name of readdirSync('assets/imported/full').filter(n=>n.endsWith('.glb'))){
 const b=readFileSync('assets/imported/full/'+name),doc=(await parseGlb(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),name)).unwrap();
 for(const [index,mesh]of doc.meshes.entries()){
  const material=doc.materials[mesh.materialIndex];if(!material)continue;
  const available=Array.from({length:8},(_,i)=>i).filter(i=>mesh['texcoord'+i]);const r=validateMaterialUvSets(material,'primitive-'+index,available);
  assert(r.ok,JSON.stringify({source:name,error:r.error}));checked++;
 }
}
console.log('Native textured primitive bindings checked:',checked);
