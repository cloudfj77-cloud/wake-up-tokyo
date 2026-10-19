// 只建立 Tokyo_SFX / Tokyo_Ambience 子树，不覆盖已调好的音乐工程。
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {selectedSfx} from './select-sfx.mjs';
import {connect} from './waapi.mjs';
const cues=await selectedSfx();
const c=await connect();let grouped=false;
const create=async(parent,type,name,props={})=>(await c.call('ak.wwise.core.object.create',{parent,type,name,onNameConflict:'merge',...Object.fromEntries(Object.entries(props).map(([k,v])=>['@'+k,v]))})).id;
const set=(object,property,value)=>c.call('ak.wwise.core.object.setProperty',{object,property,value});
const curve=points=>({type:'Curve',points:points.map(([x,y])=>({x,y,shape:'Linear'}))});
try{
 const info=await c.call('ak.wwise.core.getProjectInfo');if(info.id!=='{E5D4C90C-5E88-452C-9CA0-19EC782CEC8F}')throw Error('请打开 WakeUpTokyo 工程');
 if(info.isDirty)throw Error('Wwise 有未保存修改，请先保存后再运行');
 await c.call('ak.wwise.core.undo.beginGroup');grouped=true;
 // Dedicated game project: preserve the music/SFX balance while reserving output headroom.
 await set('\\Busses\\Default Work Unit\\Main Audio Bus','BusVolume',-6);
 const buses={},roots={},events={},sounds={};
 for(const [key,name,volume] of [['sfx','SFX',-2],['bed','Ambience',0],['voice','Voice',0]]){
  buses[key]=await create('\\Busses\\Default Work Unit\\Main Audio Bus','Bus','Tokyo_'+name,{BusVolume:volume});
  roots[key]=await create('\\Containers\\Default Work Unit','ActorMixer','Tokyo_'+name,{OutputBus:buses[key],OverrideOutput:true,OverrideConversion:true,Conversion:'{53A9DE0F-3F4F-4B59-8614-3F9E3C7358FC}',UseMaxSoundPerInstance:true,MaxSoundPerInstance:key==='bed'?8:key==='voice'?1:48,IsGlobalLimit:true,OverrideVirtualVoice:true,BelowThresholdBehavior:3,OverLimitBehavior:0});
  const param=await create('\\Game Parameters\\Default Work Unit','GameParameter',name+'_GainDb',{Min:-96,Max:0,InitialValue:-12});
  await c.call('ak.wwise.core.object.set',{listMode:'replaceAll',objects:[{object:roots[key],'@RTPC':[{type:'RTPC',name:'','@PropertyName':'Volume','@ControlInput':param,'@Curve':curve([[-96,-96],[0,0]])}]}]});
 }
 const attenuation=await create('\\Attenuations\\Default Work Unit','Attenuation','Tokyo_LocalWorld',{RadiusMax:65});
 const impactStrength=await create('\\Game Parameters\\Default Work Unit','GameParameter','Impact_Strength',{Min:0,Max:1,InitialValue:.5});
 for(const [curveType,points] of [['VolumeDryUsage',[[0,0],[3,0],[8,-5],[18,-13],[35,-27],[65,-60]]],['LowPassFilterUsage',[[0,0],[10,0],[35,35],[65,65]]]])await c.call('ak.wwise.core.object.setAttenuationCurve',{object:attenuation,curveType,use:'Custom',points:points.map(([x,y])=>({x,y,shape:'Linear'}))});
 for(const f of cues){
  const group=f.kind==='voice'?'voice':f.bus==='bed'||f.spatial==='bed'?'bed':'sfx';
  const container=await create(roots[group],'RandomSequenceContainer',f.key,{OutputBus:buses[group],OverrideOutput:true,Volume:f.volumeDb,RandomOrSequence:1,NormalOrShuffle:0,GlobalOrPerObject:1,PlayMechanismStepOrContinuous:1,RandomAvoidRepeating:f.clips.length>1,RandomAvoidRepeatingCount:1,UseMaxSoundPerInstance:true,MaxSoundPerInstance:f.maxInstances,IsGlobalLimit:true,MaxReachedBehavior:0,OverridePriority:true,Priority:f.kind==='voice'?100:/Warning|CoreOpen|Arrival/.test(f.key)||f.key==='lowHp'?95:f.spatial==='listener'?80:f.loop?20:60,OverridePositioning:true,ListenerRelativeRouting:f.spatial==='world','3DSpatialization':f.spatial==='world'?1:0,'3DPosition':0,SpeakerPanning3DSpatializationMix:100,EnableAttenuation:f.spatial==='world',...(f.spatial==='world'?{Attenuation:attenuation}:{})});
  sounds[f.key]=container;
  const priorChildren=(await c.call('ak.wwise.core.object.get',{from:{id:[container]},transform:[{select:['children']}]},{return:['id','name','type','activeSource']})).return;
  const desired=new Map(f.clips.map((clip,i)=>['V'+String(i+1).padStart(2,'0'),basename(clip.file,'.wav')]));
  for(const old of priorChildren)if(old.type==='Sound'&&/^V[0-9]+$/.test(old.name)&&(!desired.has(old.name)||old.activeSource?.name!==desired.get(old.name)))await c.call('ak.wwise.core.object.delete',{object:old.id});
  if(f.key==='land')await c.call('ak.wwise.core.object.set',{listMode:'replaceAll',objects:[{object:container,'@RTPC':[{type:'RTPC',name:'','@PropertyName':'Volume','@ControlInput':impactStrength,'@Curve':curve([[0,-8],[.5,-3],[1,1]])}]}]});
  for(let i=0;i<f.clips.length;i++){
   const clip=f.clips[i],name='V'+String(i+1).padStart(2,'0');
   const id=await create(container,'Sound',name,{IsStreamingEnabled:false,IsLoopingEnabled:f.loop,IsLoopingInfinite:f.loop});
   let source=(await c.call('ak.wwise.core.object.get',{from:{id:[id]}},{return:['activeSource']})).return[0].activeSource?.id;
   if(!source){await c.call('ak.wwise.core.audio.import',{importOperation:'useExisting',default:{importLanguage:'SFX'},imports:[{audioFile:'Z:'+resolve(clip.file).replaceAll('/','\\'),objectPath:`\\Containers\\Default Work Unit\\Tokyo_${group==='bed'?'Ambience':group==='voice'?'Voice':'SFX'}\\${f.key}\\<Sound>${name}`,originalsSubFolder:'TokyoSfx'}]});source=(await c.call('ak.wwise.core.object.get',{from:{id:[id]}},{return:['activeSource']})).return[0].activeSource.id;}
   // 长环境保留主体，源级循环交叉淡化；单次完整保留其动作。
   if(f.loop){const xf=Math.min(1,clip.seconds*.12);for(const [p,v] of Object.entries({OverrideWavLoop:true,TrimBegin:0,TrimEnd:clip.seconds,LoopBegin:xf,LoopEnd:clip.seconds-xf,CrossfadeDuration:xf*1000,CrossfadeShape:1}))await set(source,p,v);}
   else if(f.maxDurationSeconds){const seconds=Math.min(clip.seconds,f.maxDurationSeconds);await set(source,'TrimBegin',0);await set(source,'TrimEnd',seconds);await set(source,'FadeOutDuration',Math.min(.12,seconds*.1));}
   if(!f.loop){await set(source,'FadeInDuration',.002);if(!f.maxDurationSeconds)await set(source,'FadeOutDuration',Math.min(.035,clip.seconds*.1));}
   await c.call('ak.wwise.core.object.setRandomizer',{object:id,property:'Volume',enabled:!f.loop,min:-.6,max:.6});
   await c.call('ak.wwise.core.object.setRandomizer',{object:id,property:'Pitch',enabled:!f.loop&&f.kind!=='voice'&&!f.key.startsWith('ui')&&!f.key.startsWith('charge'),min:-25,max:25});
  }
  const event=await create('\\Events\\Default Work Unit','Event','SFX_'+f.key);events[f.key]=event;
  await create(event,'Action','Play',{ActionType:1,Target:container,Scope:0,FadeTime:f.loop?.7:0});
 }
 // 全局生命周期事件使用 Global scope；单个移动声源用 Playing ID 单独停止。
 for(const [name,type,fade] of [['Stop',2,.12],['Pause',7,.08],['Resume',9,.12]]){
  const event=await create('\\Events\\Default Work Unit','Event','SFX_'+name);events[name]=event;
  for(const [key,target]of Object.entries(roots))await create(event,'Action',name+'_'+key,{ActionType:type,Target:target,Scope:1,FadeTime:fade,...(type===9?{MasterResume:true}:{})});
 }
 const bank=await create('\\SoundBanks\\Default Work Unit','SoundBank','TokyoSfx');
 await c.call('ak.wwise.core.soundbank.setInclusions',{soundbank:bank,operation:'replace',inclusions:Object.values(events).map(object=>({object,filter:['events','structures','media']}))});
 await c.call('ak.wwise.core.undo.endGroup',{displayName:'Tokyo 音效：随机变体、环境与空间衰减'});grouped=false;await c.call('ak.wwise.core.project.save');
 const config=JSON.parse(await readFile('audio/wwise/config.json','utf8'));if(!config.banks.includes('TokyoSfx.bnk'))config.banks.push('TokyoSfx.bnk');
 for(const key of Object.keys(events))config.events['sfx.'+key]='SFX_'+key;
 await writeFile('audio/wwise/config.json',JSON.stringify(config,null,2)+'\n');
 await writeFile('audio/wwise/sfx-authoring.json',JSON.stringify({savedAt:new Date().toISOString(),buses,roots,attenuation,events,sounds},null,2)+'\n');
 console.log(JSON.stringify({families:cues.length,clips:cues.reduce((n,x)=>n+x.clips.length,0),saved:true}));
}finally{if(grouped)await c.call('ak.wwise.core.undo.cancelGroup').catch(()=>{});c.close();}
