import * as T from 'three';
import {restoreCharacterFlash} from './hit-response.js';
const active=new WeakMap(),PURPLE=new T.Color(0xc65bff),GREEN=new T.Color(0x3be870);
export function clearConversionTransition(visual){
 const effect=active.get(visual);if(!effect)return;restoreCharacterFlash(visual);
 for(const {mesh,material}of effect.originals)mesh.material=material;
 for(const material of effect.copies.values())material.dispose();active.delete(visual);
}
export function beginConversionTransition(visual){
 clearConversionTransition(visual);restoreCharacterFlash(visual);const copies=new Map(),originals=[];
 const copy=material=>{if(!copies.has(material))copies.set(material,material.clone());return copies.get(material);};
 for(const mesh of visual.meshes??[]){const material=mesh.material;originals.push({mesh,material});mesh.material=Array.isArray(material)?material.map(copy):copy(material);}
 active.set(visual,{elapsed:0,stage:-1,copies,originals});stepConversionTransition(visual,0);
}
export function stepConversionTransition(visual,dt){
 const effect=active.get(visual);if(!effect)return;effect.elapsed+=Math.max(0,dt);
 if(effect.elapsed>=.65){clearConversionTransition(visual);return;}
 // Three stable material stages keep the actor batch cache bounded across repeated conversions.
 const phase=effect.elapsed/.65,stage=phase<.3?0:phase<.7?1:2;if(effect.stage===stage)return;effect.stage=stage;
 const target=stage===0?PURPLE:GREEN,strength=[.4,.3,.1][stage],intensity=[1.6,1,.35][stage];
 for(const [original,material]of effect.copies){
  if(material.emissive){material.emissive.copy(target);material.emissiveIntensity=intensity;}
  material.color.copy(original.color).lerp(target,strength);
 }
}
