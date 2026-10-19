import {readFile} from 'node:fs/promises';
export async function selectedSfx(){
 const full=JSON.parse(await readFile(new URL('../../audio/wwise/sfx-cues.json',import.meta.url),'utf8'));
 let selection;try{selection=JSON.parse(await readFile(new URL('../../audio/wwise/sfx-bank-selection.json',import.meta.url),'utf8'));}catch(e){if(e.code==='ENOENT')return full;throw e;}
 const selected=full.map(f=>{const ids=selection.families[f.key];if(!ids?.length)throw Error('Missing bank selection '+f.key);const clips=ids.map(id=>{const c=f.clips.find(c=>c.assetId===id);if(!c)throw Error('Unknown selected source '+id);return c;});return {...f,clips,fullVariantCount:f.clips.length};});
 if(selected.reduce((n,f)=>n+f.clips.length,0)+selection.reservedMusic>selection.maximumMedia)throw Error('Wwise media selection exceeds the current project limit');return selected;
}
