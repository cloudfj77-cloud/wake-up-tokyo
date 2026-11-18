import { definePack, definePackageId } from '@forgeax/engine/pack/source';
import { AssetGuid } from '@forgeax/engine/pack/guid';
import { createBoxGeometry, createSphereGeometry } from '@forgeax/engine/geometry';
import {Materials} from '@forgeax/engine/render';
import {colorGradeTexture} from './color-grade.ts';
import type {MaterialAsset} from '@forgeax/engine/types';
const parsed=AssetGuid.parse('01a1b16d-f676-768b-9be2-4f0587456f7e');
if(!parsed.ok)throw parsed.error;
const base=parsed.value;
const material=(values:Record<string,any>):MaterialAsset=>({kind:'material',parent:base,values:{metallic:0,roughness:.8,emissive:[0,0,0],emissiveIntensity:0,...values}});
import { ok } from '@forgeax/engine/types';
export const ID=definePackageId('36c8dc68-1fb0-44b1-bf3e-78394854a302');
export const ref=(key:string)=>AssetGuid.format(AssetGuid.derive(ID,key));
export default definePack({schemaVersion:'2.0.0',packageId:ID,build:()=>ok({
 'mesh/box':createBoxGeometry(1,1,1).unwrap(),
 'mesh/sphere':createSphereGeometry(1,12,8).unwrap(),
 'material/foe':material({baseColor:[.8,.025,.06,1],roughness:.8}),
 'material/friend':material({baseColor:[.02,.8,.22,1],roughness:.8}),
 'material/juice':material({baseColor:[.35,.017,.75,1],roughness:.3,emissive:[.18,.01,.42],emissiveIntensity:.35}),
 'material/weapon':material({baseColor:[.08,.09,.11,1],roughness:.4,metallic:.5}),
 'material/tank-foe':material({baseColor:[.047,.068,.034,1],roughness:.85}),
 'material/tank-friend':material({baseColor:[.107,.047,.188,1],roughness:.85}),
 'material/sea':Materials.standard({surfaceModule:'wakeup::water',parameters:[],values:{}}),
 'texture/grade-seaside':colorGradeTexture(),
 'texture/grade-tokyo':colorGradeTexture(true),
 'material/pickup-health':material({baseColor:[.04,.85,.17,1],emissive:[.015,.35,.06],emissiveIntensity:.5}),
 'material/pickup-factor':material({baseColor:[.4,.06,.78,1],emissive:[.16,.015,.3],emissiveIntensity:.5}),
 'material/pickup-potion':material({baseColor:[1,.65,.02,1],emissive:[.4,.18,0],emissiveIntensity:.5}),
 'material/marker':material({baseColor:[1,.75,.015,1],emissive:[1,.5,0],emissiveIntensity:1}),
})});
