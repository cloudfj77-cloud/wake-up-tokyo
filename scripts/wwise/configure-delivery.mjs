// Only conversion and streaming properties; preserve authored curves, transitions and gain.
import {readFile,writeFile} from 'node:fs/promises';
import {connect} from './waapi.mjs';
import {selectedSfx} from './select-sfx.mjs';
const presets=[{name:'Tokyo_Music_Q4',quality:4,rate:0,channels:4},{name:'Tokyo_SFX_Q4',quality:4,rate:0,channels:4},{name:'Tokyo_Environment_Q3_32k',quality:3,rate:32000,channels:4},{name:'Tokyo_Radio_Q3_24k',quality:3,rate:24000,channels:0}];
const c=await connect();let grouped=false;const profiles={};const streamed=[];
const set=(object,property,value)=>c.call('ak.wwise.core.object.setProperty',{object,property,value,platform:'Web'});
try{
 const info=await c.call('ak.wwise.core.getProjectInfo');if(info.id!=='{E5D4C90C-5E88-452C-9CA0-19EC782CEC8F}'||info.isDirty)throw Error('Open and save the WakeUpTokyo project first');
 await c.call('ak.wwise.core.undo.beginGroup');grouped=true;
 const existing=(await c.call('ak.wwise.core.object.get',{from:{path:['\\Conversion Settings\\Default Work Unit']},transform:[{select:['children']}]},{return:['id','name']})).return;
 for(const p of presets){let object=existing.find(o=>o.name===p.name);if(!object){object=await c.call('ak.wwise.core.object.copy',{object:'{53A9DE0F-3F4F-4B59-8614-3F9E3C7358FC}',parent:'\\Conversion Settings\\Default Work Unit',onNameConflict:'rename'});await c.call('ak.wwise.core.object.setName',{object:object.id,value:p.name});}profiles[p.name]={...p,id:object.id};}
 await c.call('ak.wwise.core.undo.endGroup',{displayName:'Tokyo Web conversion ShareSets'});grouped=false;await c.call('ak.wwise.core.project.save');
 const xml=await readFile('wwise/WakeUpTokyo/Conversion Settings/Default Work Unit.wwu','utf8');
 await c.call('ak.wwise.core.undo.beginGroup');grouped=true;
 for(const p of Object.values(profiles)){const block=[...xml.matchAll(/<Conversion Name="([^"]*)" ID="([^"]*)">([\s\S]*?)<\/Conversion>/g)].find(m=>m[2]===p.id);const plugin=block?.[3].match(/<ConversionPlugin\b[^>]*\bID="([^"]*)"/)?.[1];if(!plugin)throw Error('Cannot resolve owned Vorbis conversion plugin '+p.name);await set(plugin,'QualityFactor',p.quality);await set(p.id,'SampleRate',p.rate);await set(p.id,'Channels',p.channels);}
 const assign=async(object,profile)=>{await set(object,'OverrideConversion',true);await c.call('ak.wwise.core.object.setReference',{object,reference:'Conversion',value:profiles[profile].id});};
 await assign('\\Containers\\Default Work Unit\\Tokyo_Music','Tokyo_Music_Q4');
 for(const [root,profile] of [['SFX','Tokyo_SFX_Q4'],['Ambience','Tokyo_Environment_Q3_32k'],['Voice','Tokyo_Radio_Q3_24k']])await assign('\\Containers\\Default Work Unit\\Tokyo_'+root,profile);
 const music=(await c.call('ak.wwise.core.object.get',{from:{path:['\\Containers\\Default Work Unit\\Tokyo_Music']},transform:[{select:['children']}]},{return:['id','name','type']})).return;
 const musicCues=JSON.parse(await readFile('audio/wwise/cues.json','utf8'));
 for(const sound of music.filter(o=>o.type==='Sound')){const key=sound.name==='Aftermath'?'menu':sound.name.toLowerCase();const streaming=!!musicCues.find(v=>v.key===key)?.loop;await set(sound.id,'IsStreamingEnabled',streaming);if(streaming){await set(sound.id,'IsZeroLatency',true);await set(sound.id,'PreFetchLength',2000);streamed.push({sound:sound.id,key:sound.name,kind:'music'});}}
 for(const f of await selectedSfx()){
  const root=f.kind==='voice'?'Voice':f.bus==='bed'||f.spatial==='bed'?'Ambience':'SFX';const objects=(await c.call('ak.wwise.core.object.get',{from:{path:['\\Containers\\Default Work Unit\\Tokyo_'+root+'\\'+f.key]},transform:[{select:['children']}]},{return:['id','type']})).return.filter(o=>o.type==='Sound');
  const streaming=f.loop&&f.clips.some(clip=>clip.seconds>=10);
  for(const o of objects){await set(o.id,'IsStreamingEnabled',streaming);if(streaming){await set(o.id,'IsZeroLatency',true);await set(o.id,'PreFetchLength',2000);streamed.push({sound:o.id,key:f.key,kind:'environment'});}}
 }
 await c.call('ak.wwise.core.undo.endGroup',{displayName:'Tokyo Web: classified Vorbis and 2s stream prefetch'});grouped=false;await c.call('ak.wwise.core.project.save');
 await writeFile('audio/wwise/conversion-profiles.json',JSON.stringify({at:new Date().toISOString(),profiles,streamed,preFetchMs:2000,subjectiveReview:'pending'},null,2)+'\n');console.log(JSON.stringify({profiles:Object.values(profiles).map(p=>({name:p.name,quality:p.quality,rate:p.rate})),streamed:streamed.length}));
}finally{if(grouped)await c.call('ak.wwise.core.undo.cancelGroup').catch(()=>{});c.close();}
