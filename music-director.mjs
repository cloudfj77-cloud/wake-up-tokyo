// 游戏只提交场景和混音意图；循环、淡变、暂停与尾声衔接由 Wwise 事件执行。
export const MUSIC_SCENES=Object.freeze(['menu','street','pressure','countdown','boss','victory','defeat','aftermath']);
export function selectMusicScene({mode,state={},boss={}}={}){
 if(mode==='loading'||mode==='menu')return 'menu';
 if(mode==='ended')return 'defeat';
 if(state.aftermath||state.bossDefeated)return 'aftermath';
 if(mode==='won')return 'victory';
 if(boss.active&&!boss.dead)return 'boss';
 if(state.bossCountdown!=null&&!state.bossSpawned)return 'countdown';
 return state.alert>=3?'pressure':'street';
}
const backend=async()=>{const {createWwiseAudio}=await import('./src/wwise/index.mjs');return createWwiseAudio();};
const loopingScenes=new Set(['menu','street','pressure','countdown','boss','aftermath']);
export class MusicDirector{
 constructor({createAudio=backend,onStatus=()=>{},now=()=>performance.now()}={}){
  this.createAudio=createAudio;this.onStatus=onStatus;this.audio=null;this.loading=null;this.epoch=0;
  this.scene='menu';this.posted=null;this.paused=false;this.pauseSent=false;this.volume=.38;this.muted=false;
  this.radio=false;this.focus=false;this.gainSent=null;this.duckSent=null;this.status='idle';this.error=null;this.playingId=null;
  this.now=now;this.healthTimer=null;this.healthAfter=0;this.lastPosition=null;this.positionAt=0;this.stableSince=0;this.recoveryAttempts=0;this.recoveries=[];
 }
 notify(status,error=null){this.status=status;this.error=error?.message??error;this.onStatus(this.snapshot());}
 start(){
  if(this.audio)return Promise.resolve(true);
  if(this.loading)return this.loadingEpoch===this.epoch?this.loading:this.loading.then(()=>this.start());
  const epoch=this.epoch;this.loadingEpoch=epoch;this.notify('loading');
  // 共享初始化请求，双击开始与首次交互不会建立两套音频引擎。
  let pending;try{pending=this.createAudio();}catch(e){pending=Promise.reject(e);}
  const job=Promise.resolve(pending).then(audio=>{
   if(epoch!==this.epoch){audio.dispose();return false;}
   this.audio=audio;audio.registerGameObject(77,'TokyoMusic');this.gainSent=null;this.duckSent=null;this.posted=null;this.pauseSent=false;
   this.flush();this.notify('ready');this.healthTimer=setInterval(()=>this.checkPlayback(),500);this.healthTimer.unref?.();return true;
  }).catch(error=>{if(epoch===this.epoch){this.audio?.dispose();this.audio=null;this.notify('error',error);}return false;}).finally(()=>{if(this.loading===job)this.loading=null;});
  this.loading=job;return job;
 }
 setScene(scene){if(scene!==null&&!MUSIC_SCENES.includes(scene))throw Error('Unknown music scene: '+scene);this.scene=scene;this.safeFlush();}
 update(view){
  this.focus=['upgrade','levelup'].includes(view.mode);
  this.paused=!!view.hidden||['paused','map'].includes(view.mode);
  if(!this.paused)this.scene=selectMusicScene(view);
  this.safeFlush();
 }
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));this.safeFlush();}
 setMuted(value){this.muted=!!value;this.safeFlush();}
 duck(value){this.radio=!!value;this.safeFlush();}
 pause(){this.paused=true;this.safeFlush();}
 resume(){this.paused=false;this.resetHealth();this.safeFlush();}
 resetHealth(){this.healthAfter=this.now()+1500;this.lastPosition=null;this.positionAt=this.now();this.stableSince=0;}
 checkPlayback(){
  const a=this.audio,now=this.now();if(!a?.playingStatus||this.paused||!loopingScenes.has(this.posted)||now<this.healthAfter)return;
  try{
   const state=a.playingStatus(this.playingId);
   if(state.playing){
    if(!this.stableSince)this.stableSince=now;if(now-this.stableSince>30000)this.recoveryAttempts=0;
    if(state.positionMs!==this.lastPosition){this.lastPosition=state.positionMs;this.positionAt=now;return;}
    if(now-this.positionAt<8000)return;
   }
   const reason=state.playing?'source-stalled':'event-ended',previous=this.playingId;
   if(state.playing)a.stopPlaying(previous,0);
   this.posted=null;this.flush();this.recoveryAttempts++;
   this.healthAfter=now+Math.min(30000,1000*2**Math.min(this.recoveryAttempts-1,5));
   this.recoveries.push({at:now,scene:this.scene,reason,previous,playingId:this.playingId});if(this.recoveries.length>20)this.recoveries.shift();
  }catch(error){this.safeFlushError(error);}
 }
 safeFlushError(error){clearInterval(this.healthTimer);this.healthTimer=null;this.audio?.dispose();this.audio=null;this.notify('error',error);}
 safeFlush(){try{this.flush();}catch(error){this.safeFlushError(error);}}
 flush(){
  const a=this.audio;if(!a)return;
  const gain=this.muted||!this.volume?-96:Math.max(-96,20*Math.log10(this.volume*.5));
  const duck=this.radio?-9:this.focus?-4:0;
  if(gain!==this.gainSent){a.setRTPC('Music_GainDb',gain,undefined,80);this.gainSent=gain;}
  if(duck!==this.duckSent){a.setRTPC('Music_DuckDb',duck,undefined,this.radio?120:550);this.duckSent=duck;}
  // 暂停期间只记录新意图，恢复时再切换；否则新曲会绕过已暂停的旧声部。
  if(!this.paused&&this.scene!==this.posted){
   if(this.pauseSent){a.postEvent('resume',77);this.pauseSent=false;}
   this.playingId=a.postEvent(this.scene==='aftermath'?'victoryAftermath':this.scene??'stop',77);this.posted=this.scene;this.resetHealth();
  }
  if(this.paused!==this.pauseSent){
   if(this.posted!==null)a.postEvent(this.paused?'pause':'resume',77);
   this.pauseSent=this.paused;
  }
 }
 stop(){this.setScene(null);}
 dispose(){this.epoch++;clearInterval(this.healthTimer);this.healthTimer=null;this.audio?.dispose();this.audio=null;this.posted=null;this.playingId=null;this.pauseSent=false;this.notify('disposed');}
 snapshot(){return {status:this.status,error:this.error,scene:this.scene,posted:this.posted,paused:this.paused,muted:this.muted,radio:this.radio,playingId:this.playingId,recoveries:[...this.recoveries],playback:this.audio?.playingStatus?.(this.playingId)??null,runtime:this.audio?.snapshot()??null};}
}
