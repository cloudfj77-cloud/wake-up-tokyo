// 为本仓库的独立工程建立音乐总线、源循环、事件与混音参数。
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {connect} from './waapi.mjs';
const project=resolve('wwise/WakeUpTokyo/WakeUpTokyo.wproj');
const cues=JSON.parse(await readFile('audio/wwise/cues.json','utf8'));
const c=await connect(); let grouped=false;
const create=async(parent,type,name,props={})=>(await c.call('ak.wwise.core.object.create',{parent,type,name,onNameConflict:'merge',...Object.fromEntries(Object.entries(props).map(([k,v])=>['@'+k,v]))})).id;
const set=async(object,property,value)=>c.call('ak.wwise.core.object.setProperty',{object,property,value});
const curve=(x1,y1,x2,y2)=>({type:'Curve',points:[{x:x1,y:y1,shape:'Linear'},{x:x2,y:y2,shape:'Linear'}]});
try {
 const info=await c.call('ak.wwise.core.getProjectInfo');
 if(info.id!=='{E5D4C90C-5E88-452C-9CA0-19EC782CEC8F}')throw Error('请先在 Wwise 打开本仓库 WakeUpTokyo 工程');
 await c.call('ak.wwise.core.undo.beginGroup');grouped=true;
 const bus=await create('\\Busses\\Default Work Unit\\Main Audio Bus','Bus','Tokyo_Music',{BusVolume:-9});
 const root=await create('\\Containers\\Default Work Unit','ActorMixer','Tokyo_Music',{OutputBus:bus,OverrideOutput:true,OverrideConversion:true,Conversion:'{53A9DE0F-3F4F-4B59-8614-3F9E3C7358FC}'});
 // 总音量和广播闪避分开控制；曲线保存在 Wwise 工程中。
 const prototype=(await c.call('ak.wwise.core.object.get',{from:{path:['\\Game Parameters\\Default Work Unit\\Music_Level']}},{return:['id']})).return[0];
 if(prototype)await c.call('ak.wwise.core.object.delete',{object:prototype.id});
 const gain=await create('\\Game Parameters\\Default Work Unit','GameParameter','Music_GainDb',{Min:-96,Max:0,InitialValue:-14.4});
 const duck=await create('\\Game Parameters\\Default Work Unit','GameParameter','Music_DuckDb',{Min:-24,Max:0,InitialValue:0});
 await c.call('ak.wwise.core.object.set',{listMode:'replaceAll',objects:[
 {object:bus,'@RTPC':[{type:'RTPC',name:'','@PropertyName':'BusVolume','@ControlInput':gain,'@Curve':curve(-96,-96,0,0)}]},
 {object:root,'@RTPC':[{type:'RTPC',name:'','@PropertyName':'Volume','@ControlInput':duck,'@Curve':curve(-24,-24,0,0)}]}
 ]});
 const sounds={};
 for(const spec of [...cues,{...cues.find(x=>x.key==='menu'),key:'aftermath',file:'menu',volume:-4}]) {
  const name=spec.key[0].toUpperCase()+spec.key.slice(1);
  const id=await create(root,'Sound',name,{OutputBus:bus,OverrideOutput:true,IsLoopingEnabled:spec.loop,IsLoopingInfinite:spec.loop,IsStreamingEnabled:false,UseMaxSoundPerInstance:true,MaxSoundPerInstance:1,IsGlobalLimit:true,OverrideVirtualVoice:true,BelowThresholdBehavior:0,Volume:spec.volume??0}); sounds[spec.key]=id;
  let source=(await c.call('ak.wwise.core.object.get',{from:{id:[id]}},{return:['activeSource']})).return[0].activeSource?.id;
  if(!source){
   await c.call('ak.wwise.core.audio.import',{importOperation:'useExisting',default:{importLanguage:'SFX'},imports:[{audioFile:'Z:'+resolve(`wwise/WakeUpTokyo/Originals/SFX/TokyoMusic/${spec.file??spec.key}.wav`).replaceAll('/','\\'),objectPath:`\\Containers\\Default Work Unit\\Tokyo_Music\\<Sound>${name}`,originalsSubFolder:'TokyoMusic'}]});
   source=(await c.call('ak.wwise.core.object.get',{from:{id:[id]}},{return:['activeSource']})).return[0].activeSource.id;
  }
  // 早期导入产生的重复源只保留当前活动源，避免工程重载时出现重名。
  const children=(await c.call('ak.wwise.core.object.get',{from:{id:[id]},transform:[{select:['children']}]},{return:['id','type']})).return;
  for(const child of children)if(child.type==='AudioFileSource'&&child.id!==source)await c.call('ak.wwise.core.object.delete',{object:child.id});
  for(const [p,v] of Object.entries({OverrideWavLoop:true,TrimBegin:0,TrimEnd:spec.seconds,LoopBegin:spec.loopBegin,LoopEnd:spec.loopEnd,CrossfadeDuration:spec.crossfadeMs,CrossfadeShape:1}))await set(source,p,v);
 }
 const events={};
 async function action(parent,name,type,target,props={}){return create(parent,'Action',name,{ActionType:type,Target:target,Scope:0,...props});}
 for(const key of ['menu','street','pressure','countdown','boss','victory','defeat','aftermath']) {
  const id=await create('\\Events\\Default Work Unit','Event',`Music_${key[0].toUpperCase()+key.slice(1)}`);events[key]=id;
  const old=(await c.call('ak.wwise.core.object.get',{from:{id:[id]},transform:[{select:['children']}]},{return:['id','name']})).return.find(x=>x.name==='Stop_Previous');
  if(old)await c.call('ak.wwise.core.object.delete',{object:old.id});
  // 分别停止其他源，避免同事件里的根级 Stop 连新 Play 一起停止。
  for(const [other,target] of Object.entries(sounds))if(other!==key)await action(id,'Stop_'+other,2,target,{FadeTime:key==='defeat'?.18:.65});
  await action(id,'Play',1,sounds[key],{FadeTime:['victory','defeat'].includes(key)?.02:.7});
 }
 // 击败 Boss 后先播胜利短句，尾声由 Wwise 的延迟 Play 接到自由探索。
 const after=await create('\\Events\\Default Work Unit','Event','Music_VictoryAftermath');events.victoryAftermath=after;
 const oldAfter=(await c.call('ak.wwise.core.object.get',{from:{id:[after]},transform:[{select:['children']}]},{return:['id','name']})).return.find(x=>x.name==='Stop_Previous');
 if(oldAfter)await c.call('ak.wwise.core.object.delete',{object:oldAfter.id});
 for(const [key,target] of Object.entries(sounds))if(!['victory','aftermath'].includes(key))await action(after,'Stop_'+key,2,target,{FadeTime:.3});
 await action(after,'Victory',1,sounds.victory,{FadeTime:.02});
 await action(after,'Aftermath',1,sounds.aftermath,{Delay:8.6,FadeTime:1.2});
 for(const [name,type,fade] of [['Stop',2,.25],['Pause',7,.18],['Resume',9,.25]]){
  const id=await create('\\Events\\Default Work Unit','Event','Music_'+name);events[name.toLowerCase()]=id;
  await action(id,name,type,root,{FadeTime:fade,...(type===9?{MasterResume:true}:{})});
 }
 const bank=await create('\\SoundBanks\\Default Work Unit','SoundBank','TokyoMusic');
 await c.call('ak.wwise.core.soundbank.setInclusions',{soundbank:bank,operation:'replace',inclusions:Object.values(events).map(object=>({object,filter:['events','structures','media']}))});
 await set(info.id,'GenerateSoundBankJSON',true);await set(info.id,'GenerateSoundBankXML',true);
 await c.call('ak.wwise.core.undo.endGroup',{displayName:'Wake Up Tokyo：街头反抗音乐与游戏状态'});grouped=false;
 await c.call('ak.wwise.core.project.save');
 const receipt={project:'wwise/WakeUpTokyo/WakeUpTokyo.wproj',projectId:info.id,authoringVersion:'2025.1.10.9233',createdAt:new Date().toISOString(),bus,root,events,sounds};
 await writeFile('audio/wwise/authoring.json',JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({saved:true,project,events:Object.keys(events),sounds:Object.keys(sounds)}));
}finally {if(grouped)await c.call('ak.wwise.core.undo.cancelGroup').catch(()=>{});c.close();}
