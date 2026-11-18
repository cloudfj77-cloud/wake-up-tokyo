import {definePack,definePackageId}from'@forgeax/engine/pack/source';
import {AssetGuid}from'@forgeax/engine/pack/guid';
import {toMaterialAsset}from'@forgeax/engine/gltf';
import {ok,type MaterialAsset}from'@forgeax/engine/types';
import {MATERIAL_LIBS}from'./shared-material-data.ts';
export const MATERIAL_PACKAGE=definePackageId('7a769fd0-16cd-4586-8907-d4cdbb7e52db');
const parse=(text:string)=>{const r=AssetGuid.parse(text);if(!r.ok)throw r.error;return r.value;};
export default definePack({schemaVersion:'2.0.0',packageId:MATERIAL_PACKAGE,build:()=>{
 const assets:Record<string,MaterialAsset>={},families=new Map<string,string>();
 for(const lib of MATERIAL_LIBS){const textures=new Map<number,any>(),samplers=new Map<number,any>();for(const [i,t]of lib.textures.entries())textures.set(i,parse(lib.textureGuids[t.source]));for(const [i,g]of Object.entries(lib.samplerGuids))samplers.set(Number(i),parse(g as string));
  for(const material of lib.materials){const value=toMaterialAsset(material,{textureHandles:textures,samplerHandles:samplers}),signature=JSON.stringify({passes:value.passes,colorSpace:value.colorSpace,staticSwitches:value.staticSwitches});if(value.parent!==undefined)throw new Error('Expected an authored material root');let rootKey=families.get(signature);if(!rootKey){rootKey='root/family-'+families.size;families.set(signature,rootKey);assets[rootKey]={...value,values:{},parameters:[]};}const root=assets[rootKey]!;if(root.parent!==undefined)throw new Error('Shared material family must be a root');
   const parameters=[...root.parameters!];for(const p of value.parameters??[])if(!parameters.some(old=>old.name===p.name))parameters.push(p);assets[rootKey]={...root,parameters};assets['material/'+lib.name+'/'+material.name.toLowerCase()]={kind:'material',parent:AssetGuid.derive(MATERIAL_PACKAGE,rootKey),values:value.values};
  }
 }
 return ok(assets);
}});
