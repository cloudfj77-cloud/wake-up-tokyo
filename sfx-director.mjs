// 声音选择、距离衰减、循环与复音由 Wwise 工程负责；这里管理玩法生命周期。
import cues from './audio/wwise/sfx-runtime.json' with {type:'json'};
import japaneseRadio from './japanese-radio.json' with {type:'json'};
const catalog=new Map(cues.map(c=>{const line=japaneseRadio.lines[c.key];return [c.key,line?{...c,text:line.text,caption:line.caption,clips:[{seconds:line.seconds}]}:c];}));
const aliases={infect:'meleeLight',attack:'meleeHeavy',hit:'hitBody',shoot:'syringe',powerThrow:'power',break:'breakStone',defeat:'defeatSfx'};
export class SfxDirector{
 constructor({getAudio,now=()=>performance.now()/1000,onRadio=()=>{}}={}){
  this.getAudio=getAudio;this.now=now;this.audio=null;this.last=new Map();this.oneshots=[];this.loops=new Map();this.free=[];this.serial=1000;
  this.volume=.38;this.voiceVolume=.8;this.voiceGainSent=null;this.onRadio=onRadio;this.radio=null;this.radioQueue=[];this.muted=false;this.paused=false;this.view=null;this.gainSent=null;this.stats={posted:0,dropped:0,unknown:0};this.history=[];
 }
 supports(key){return catalog.has(key==='chargeTick'?'charge1':aliases[key]??key);}
 bind(){const a=this.getAudio?.();if(!a){if(this.audio){this.clearState();this.audio=null;}return null;}if(a!==this.audio){this.clearState();this.audio=a;a.registerGameObject(90,'TokyoSfxLifecycle');this.gainSent=null;this.mix();}return a;}
 clearState(){this.last.clear();this.oneshots=[];this.loops.clear();this.free=[];this.serial=1000;this.paused=false;this.walkAnchor=null;this.walkDistance=0;this.previousState=null;this.nextLowHp=0;this.clouds=new WeakSet();this.gameState=null;this.tide=null;this.spotTimers=new Map();this.walkers=new Map();this.radio=null;this.radioQueue=[];this.voiceGainSent=null;this.onRadio(null);}
 mix(){if(!this.audio)return;const db=this.muted||!this.volume?-96:20*Math.log10(this.volume);if(db!==this.gainSent){this.audio.setRTPC('SFX_GainDb',db,undefined,50);this.audio.setRTPC('Ambience_GainDb',db,undefined,250);this.gainSent=db;}const voice=this.muted||!this.volume||!this.voiceVolume?-96:20*Math.log10(this.volume*this.voiceVolume);if(voice!==this.voiceGainSent){this.audio.setRTPC('Voice_GainDb',voice,undefined,50);this.voiceGainSent=voice;}}
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));this.mix();}
 setVoiceVolume(v){this.voiceVolume=Math.max(0,Math.min(1,Number(v)||0));this.mix();}
 setMuted(v){this.muted=!!v;if(this.muted)this.stopRadio();this.mix();}
 queueVoice(key,text){
  if(this.muted||!catalog.has(key)||this.radio?.key===key||this.radioQueue.some(r=>r.key===key))return false;
  if(/^radio[2-6]$/.test(key)){const rank=+key.slice(-1);if(+(this.radio?.key.slice(-1)??0)>rank||this.radioQueue.some(r=>/^radio[2-6]$/.test(r.key)&&+r.key.slice(-1)>rank))return false;this.radioQueue=this.radioQueue.filter(r=>!/^radio[2-6]$/.test(r.key));}
  if(this.radioQueue.length>=2)return false;this.radioQueue.push({key,text});this.updateRadio();return true;
 }
 stopRadio(){if(this.radio&&this.audio)this.audio.stopPlaying(this.radio.playing,100);this.radio=null;this.radioQueue=[];this.onRadio(null);}
 updateRadio(){if(this.paused||!this.audio)return;if(this.radio&&this.now()>=this.radio.until){this.radio=null;this.onRadio(null);}if(!this.radio&&this.radioQueue.length){const next=this.radioQueue.shift(),c=catalog.get(next.key),playing=this.emit(next.key);if(playing){this.radio={...next,playing,until:this.now()+Math.max(...c.clips.map(c=>c.seconds))+.1};this.onRadio(c.caption??next.text);}}}
 allocate(position){const id=this.free.pop()??this.serial++;this.audio.registerGameObject(id,'TokyoEmitter');this.audio.setPosition(id,{x:position?.x??0,y:position?.y??0,z:position?.z??0});return id;}
 release(id){this.audio.unregisterGameObject(id);this.free.push(id);}
 emit(key,{position,scope='player',step=0}={}){
  const a=this.bind();if(!a)return 0;key=key==='chargeTick'?'charge'+Math.max(1,Math.min(3,Math.round(step/2))):aliases[key]??key;const c=catalog.get(key);if(!c){this.stats.unknown++;return 0;}
  const isUI=key.startsWith('ui');if(this.muted||(this.paused&&!isUI)){this.stats.dropped++;return 0;}
  const time=this.now(),gate=key+':'+scope;if(time-(this.last.get(gate)??-Infinity)<c.cooldown){this.stats.dropped++;return 0;}this.last.set(gate,time);
  const p=position??this.view?.player;const id=this.allocate(p);if(key==='land')a.setRTPC('Impact_Strength',Math.max(0,Math.min(1,step)),id,0);const playing=a.postEvent('sfx.'+key,id);
  // 各发弹体独立位置，尾音播放期间不挪给后续事件；超时只回收已播完对象。
  const duration=Math.max(...c.clips.map(x=>x.seconds));this.oneshots.push({id,playing,key,until:time+duration+.3});
  this.stats.posted++;this.history.push({key,playing,position:p?{x:p.x,y:p.y??0,z:p.z}:null,time});if(this.history.length>80)this.history.shift();return playing;
 }
 stopKey(key,fade=80){if(!this.audio)return;for(const shot of this.oneshots)if(shot.key===key){this.audio.stopPlaying(shot.playing,fade);shot.until=this.now()+fade/1000+.1;}}
 loop(key,token,position){
  if(!this.audio||this.paused)return;const old=this.loops.get(token);if(old){if(position)this.audio.setPosition(old.id,position);return old.playing;}
  const c=catalog.get(key);if(!c?.loop)return;
  const id=this.allocate(position),playing=this.audio.postEvent('sfx.'+key,id);this.loops.set(token,{id,playing,key});return playing;
 }
 stopLoop(token){const l=this.loops.get(token);if(!l||!this.audio)return;this.audio.stopPlaying(l.playing,250);this.oneshots.push({id:l.id,playing:l.playing,until:this.now()+.4});this.loops.delete(token);}
 setPaused(value){value=!!value;if(!this.audio||value===this.paused)return;this.audio.postEvent(value?'sfx.Pause':'sfx.Resume',90);this.paused=value;this.walkAnchor=null;this.walkDistance=0;this.walkers.clear();this.pauseTime=value?this.now():this.pauseTime;if(!value){const delta=this.now()-this.pauseTime;for(const x of this.oneshots)x.until+=delta;if(this.radio)this.radio.until+=delta;for(const [key,time]of this.spotTimers)this.spotTimers.set(key,time+delta);}}
 syncEmitters(entries=[],listener={x:0,y:0,z:0}){
  // 只让最近的持续声源占据声部，离开范围、死亡、阵营变化由本帧列表自然收尾。
  const limits={tankLoop:2,sprayLoop:3,planeLoop:1},counts={},wanted=new Set();
  const sorted=entries.map(e=>({...e,distance:Math.hypot(e.position.x-listener.x,(e.position.y??0)-(listener.y??0),e.position.z-listener.z)})).filter(e=>e.distance<65).sort((a,b)=>a.distance-b.distance);
  for(const e of sorted){if((counts[e.key]??0)>=(limits[e.key]??1))continue;counts[e.key]=(counts[e.key]??0)+1;const token='world:'+e.token;wanted.add(token);this.loop(e.key,token,e.position);}
  for(const token of [...this.loops.keys()])if(token.startsWith('world:')&&!wanted.has(token))this.stopLoop(token);
 }
 crowdSteps(entries=[],listener={x:0,z:0},surface='stepRoad'){
  const near=entries.filter(u=>!u.dead&&!['corpse','fallen','expired'].includes(u.kind)&&Math.hypot(u.x-listener.x,u.z-listener.z)<12).sort((a,b)=>Math.hypot(a.x-listener.x,a.z-listener.z)-Math.hypot(b.x-listener.x,b.z-listener.z)).slice(0,2),wanted=new Set();
  for(const u of near){const id=u.id;wanted.add(id);const old=this.walkers.get(id),delta=old?Math.hypot(u.x-old.x,u.z-old.z):0;let travel=old?.travel??0;if(delta<2)travel+=delta;else travel=0;if(travel>=1.8){this.emit(u.surface??surface,{position:u,scope:'walker:'+id});travel%=1.8;}this.walkers.set(id,{x:u.x,z:u.z,travel});}
  for(const id of this.walkers.keys())if(!wanted.has(id))this.walkers.delete(id);
 }
 stateEdges(view){
  const s=view.state,b=view.boss;if(!s)return;if(s!==this.gameState){this.previousState=null;this.gameState=s;this.clouds=new WeakSet();this.tide=s.tideBurst;}const previous=this.previousState;
  if(previous){
   if(previous.kindling>0&&!(s.kindlingTime>0))this.emit('kindlingEnd');
   else if(s.kindlingTime>0&&(s.kindlingStacks??0)>previous.kindling)this.emit('kindlingGain');
   if(b?.active&&!b.dead&&b.weak>0&&!(previous.weak>0))this.emit('bossCoreOpen',{position:b});
   if(previous.potion>0&&!(s.potionTime>0))this.emit('potionEnd');
   if(b?.active&&!b.dead&&!previous.boss)this.emit('bossArrival',{position:b});
   else if(b?.active&&!b.dead&&b.phase>previous.phase)this.emit('bossPhase');
   if(b?.active&&!b.dead&&previous.boss&&b.hp<previous.bossHp&&b.weak>0)this.emit('bossCore',{position:b});
   if(s.tideBurst&&s.tideBurst!==this.tide){this.tide=s.tideBurst;this.emit('abilityBlood',{position:{...s.tideBurst,y:view.player?.y??0}});}
  }
  for(const cloud of s.airClouds??[])if(!this.clouds.has(cloud)){this.clouds.add(cloud);this.emit('abilityAir',{position:{...cloud,y:view.player?.y??0}});}
  if(s.hp>0&&s.hp/s.maxHp<.25&&this.now()>=this.nextLowHp){this.emit('lowHp');this.nextLowHp=this.now()+(s.hp/s.maxHp<.12?1.25:2.5);}
  this.previousState={kindling:s.kindlingTime>0?s.kindlingStacks??0:0,weak:b?.weak??0,potion:s.potionTime??0,boss:!!(b?.active&&!b.dead),phase:b?.phase??1,bossHp:b?.hp??0,frenzyHp:s.frenzyHp??0};
 }
 update(view){
  this.view=view;const a=this.bind();if(!a)return;
  const paused=!!view.hidden||['paused','map'].includes(view.mode);this.setPaused(paused);
  if(view.listener){const f={x:view.forward?.x??0,y:view.forward?.y??0,z:view.forward?.z??1};const length=Math.hypot(f.x,f.y,f.z)||1;a.setListener(view.listener,{x:f.x/length,y:f.y/length,z:f.z/length});}
  if(!paused){const time=this.now();for(let i=this.oneshots.length-1;i>=0;i--)if(this.oneshots[i].until<=time){this.release(this.oneshots[i].id);this.oneshots.splice(i,1);}}
  const active=['playing','upgrade','levelup'].includes(view.mode);
  if(!active&&!paused){for(const token of [...this.loops.keys()])this.stopLoop(token);if(this.radio||this.radioQueue.length)this.stopRadio();return;}
  if(active&&!paused){
   this.updateRadio();
   if(view.mode==='playing'){this.stateEdges(view);this.crowdSteps(view.walkers,view.player,view.surface);}
   this.syncEmitters(view.emitters,view.listener??view.player);
   if(view.mode==='playing'&&view.player)for(const spot of view.spots??[]){if(Math.hypot(spot.position.x-view.player.x,spot.position.z-view.player.z)>(spot.radius??25))continue;const due=this.spotTimers.get(spot.token);if(due===undefined){this.spotTimers.set(spot.token,this.now()+2);continue;}if(this.now()>=due){this.emit(spot.key,{position:spot.position,scope:spot.token});this.spotTimers.set(spot.token,this.now()+(spot.interval??30));}}
   if(view.mode==='playing'&&view.player){const p=view.player,old=this.walkAnchor,d=old?Math.hypot(p.x-old.x,p.z-old.z):0;if(view.grounded&&d<2){this.walkDistance=(this.walkDistance??0)+d;const stride=view.crouch?1.8:2.0;if(this.walkDistance>=stride){this.emit(view.surface??'stepRoad',{position:p});this.walkDistance%=stride;}}else this.walkDistance=0;this.walkAnchor={x:p.x,z:p.z};}
   const beds=view.map==='tidewater'?['seaBed','windBed']:['cityBed','windBed'];
   for(const key of beds)this.loop(key,'bed:'+key);
   for(const token of [...this.loops.keys()])if(token.startsWith('bed:')&&!beds.includes(token.slice(4)))this.stopLoop(token);
  }
 }
 stop(){if(this.audio){this.audio.postEvent('sfx.Stop',90);for(const x of this.oneshots)this.audio.unregisterGameObject(x.id);for(const x of this.loops.values())this.audio.unregisterGameObject(x.id);}this.clearState();}
 dispose(){this.stop();this.audio=null;this.gainSent=null;}
 snapshot(){return {ready:!!this.audio,paused:this.paused,loops:[...this.loops.keys()],radio:this.radio?.key??null,voiceQueue:this.radioQueue.length,activeOneShots:this.oneshots.length,registeredPool:this.serial-1000,...this.stats,history:this.history.slice(-15)};}
}
