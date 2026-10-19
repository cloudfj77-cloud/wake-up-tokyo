// 在真实游戏页面打开 ?audio，试听与测量同一套 Wwise 实例。
import {mountSfxAudition} from './sfx-audition.mjs';
import {MUSIC_SCENES} from './music-director.mjs';
import {mountMusicContinuityCheck} from './music-continuity-check.mjs';
const labels={menu:'标题 · 街头电台',street:'街头 · 觉醒',pressure:'封锁 · 收紧',countdown:'倒计时 · 镇压将至',boss:'Boss · 巨像',victory:'胜利短句',defeat:'失败短句',aftermath:'胜利 → 自由探索'};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function mountMusicAudition(music){
 const panel=document.createElement('aside');panel.id='musicAudition';
 panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:10000;width:300px;max-height:88vh;overflow:auto;padding:16px;background:#201a2bf5;color:#f9efd9;border:1px solid #aa72e1;border-radius:14px;font:13px/1.5 system-ui;box-shadow:0 10px 40px #0008';
 panel.innerHTML='<style>#musicAudition button{color:#fff0cb;background:#3c2b4d;border:1px solid #9670b4;border-radius:6px;padding:6px 8px;font:12px/1.4 system-ui;cursor:pointer}#musicAudition button:hover{background:#67417d}#musicAudition button:disabled{opacity:.55;cursor:wait}#musicAudition #collapseMusic{float:right;padding:2px 7px}#musicAudition summary{cursor:pointer}</style><button id="collapseMusic">收起</button><strong>街头觉醒 / Wwise 试听</strong><div id="musicContent"><p style="margin:6px 0">切换音乐可直接比较；返回游戏配乐后随警戒变化。</p><div id="cueButtons" style="display:grid;grid-template-columns:1fr 1fr;gap:5px"></div><p><button id="followMusic">返回游戏配乐</button> <button id="pauseMusic">暂停 / 继续</button> <button id="muteMusic">静音 / 恢复</button></p><button id="runAudioChecks">检查实际音频输出与重启</button><pre id="musicLive" style="white-space:pre-wrap"></pre><details><summary>技术检查结果</summary><pre id="audioCheckResult" style="white-space:pre-wrap">尚未运行；技术信号检查不代替听感评审。</pre></details></div>';
 document.body.append(panel);const q=id=>panel.querySelector('#'+id),d=music.director;
 const diagnostics=document.createElement('button');diagnostics.textContent='下载当前音频诊断';diagnostics.onclick=()=>{const report={at:new Date().toISOString(),music:d.snapshot(),sfx:music.sfx.snapshot(),history:diagnosticHistory};const a=document.createElement('a');a.download='wake-audio-diagnostic.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};q('musicContent').append(diagnostics);const diagnosticHistory=[];
 q('collapseMusic').onclick=()=>{const content=q('musicContent');content.hidden=!content.hidden;q('collapseMusic').textContent=content.hidden?'展开':'收起';};
 let manual=false,lastView,testing=false;
 const update=music.update.bind(music);music.update=view=>{lastView=view;if(!manual)update(view);};
 for(const key of MUSIC_SCENES){const button=document.createElement('button');button.textContent=labels[key];button.dataset.scene=key;button.onclick=async()=>{if(testing)return;manual=true;d.resume();d.focus=false;d.duck(false);d.setScene(key);await music.start();};q('cueButtons').append(button);}
 music.audition={getView:()=>lastView,setManual(value){manual=value;if(!value&&lastView)update(lastView);}};mountSfxAudition(music);
 mountMusicContinuityCheck(music,q('musicContent'));
 q('followMusic').onclick=()=>{if(testing)return;manual=false;if(lastView)update(lastView);};
 q('pauseMusic').onclick=()=>{if(testing)return;manual=true;d.paused?d.resume():d.pause();};
 q('muteMusic').onclick=()=>music.toggle();
 const timer=setInterval(()=>{const s=d.snapshot();diagnosticHistory.push({at:performance.now(),mode:lastView?.mode,scene:s.scene,paused:s.paused,playingId:s.playingId,playback:s.playback,streamErrors:s.runtime?.streaming?.errors,reads:s.runtime?.streaming?.completedReads,starvations:s.runtime?.starvations});if(diagnosticHistory.length>1800)diagnosticHistory.shift();q('musicLive').textContent=`${manual?'独立试听':'跟随游戏'} · ${s.status}\n场景：${s.scene??'停止'}${s.paused?'（暂停）':''}${s.radio?'（广播压低）':''}\n后端：${s.runtime?.backend??'等待启动'} · 事件 ${s.playingId??'—'} · ${s.playback?.playing?'运行':'结束'} · ${s.playback?.positionMs??'—'}ms\n${s.runtime?.loadedBanks.map(x=>x.name).join(' + ')??s.error??''}`;},350);
 addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 q('runAudioChecks').onclick=async()=>{
  if(testing)return;testing=true;manual=true;q('runAudioChecks').disabled=true;
  const taps=[],errors=[],nativeConnect=AudioNode.prototype.connect;
  const onError=e=>errors.push(e.message??String(e.reason));
  addEventListener('error',onError);addEventListener('unhandledrejection',onError);
  AudioNode.prototype.connect=function(...args){const r=nativeConnect.apply(this,args);if(this instanceof AudioWorkletNode&&args[0]===this.context.destination&&!taps.some(t=>t.node===this)){const analyser=this.context.createAnalyser();analyser.fftSize=2048;nativeConnect.call(this,analyser);taps.push({node:this,analyser,context:this.context});}return r;};
  const report={url:location.href,browser:navigator.userAgent,crossOriginIsolated,backend:'wwise',hearing:'pending user audition',scenes:[],errors};
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  async function measure(){const t=taps.at(-1);assert(t&&t.context.state==='running','AudioWorklet 未运行');const data=new Float32Array(2048);let energy=0,peak=0,n=0;for(let i=0;i<25;i++){t.analyser.getFloatTimeDomainData(data);for(const x of data){energy+=x*x;peak=Math.max(peak,Math.abs(x));n++;}await wait(40);}return {rms:Math.sqrt(energy/n),peak,samples:n};}
  const progress=text=>q('audioCheckResult').textContent=text;
  try{
   if(d.loading)await d.loading;music.sfx.dispose();d.dispose();d.resume();d.setMuted(false);d.setVolume(.38);d.duck(false);d.focus=false;
   assert(await d.start(),'Wwise 初始化失败');
   for(const scene of MUSIC_SCENES){progress('正在测量 '+labels[scene]);d.setScene(scene);await wait(1100);const signal=await measure();assert(signal.rms>1e-5,scene+' 没有持续输出');assert(signal.peak<.98,scene+' 输出削波');report.scenes.push({scene,playingId:d.playingId,...signal});}
   progress('验证胜利短句接入自由探索…');await wait(8500);report.aftermathLoop=await measure();assert(report.aftermathLoop.rms>1e-5,'胜利后未进入余韵循环');
   d.stop();d.setScene('aftermath');await wait(300);d.stop();progress('验证已停止场景不会留下延迟音乐…');await wait(9500);report.cancelledDelayed=await measure();assert(report.cancelledDelayed.rms<1e-6,'停止后仍有延迟音乐启动');
   d.setScene('street');await wait(900);d.pause();await wait(500);report.paused=await measure();assert(report.paused.rms<1e-6,'暂停后仍在出声');d.resume();await wait(600);report.resumed=await measure();assert(report.resumed.rms>1e-5,'恢复后无声');
   d.setVolume(.19);await wait(500);report.halfVolume=await measure();d.setVolume(.38);
   d.setMuted(true);await wait(400);report.muted=await measure();assert(report.muted.rms<1e-6,'静音后仍在出声');d.setMuted(false);d.duck(true);await wait(500);report.ducked=await measure();d.duck(false);
   d.stop();await wait(1500);report.stopped=await measure();assert(report.stopped.rms<1e-6,'停止后仍在出声');report.beforeDispose=d.snapshot();const io=report.beforeDispose.runtime?.streaming;if(io){assert(io.completedReads>0&&io.errors.length===0,'音乐流式读取失败');assert(io.openFiles===0&&io.nativePending===0,'音乐停止后流式文件未释放');}
   d.dispose();await wait(100);report.contextAfterDispose=taps.at(-1).context.state;assert(report.contextAfterDispose==='closed','卸载没有关闭 AudioContext');
   assert(await d.start(),'第二次初始化失败');d.setScene('street');await wait(1000);report.restarted=await measure();assert(report.restarted.rms>1e-5,'重启后没有声音');report.afterRestart=d.snapshot();assert(!errors.length,'浏览器出现错误');report.ok=true;
  }catch(error){report.ok=false;report.error=String(error);}
  finally{
   AudioNode.prototype.connect=nativeConnect;removeEventListener('error',onError);removeEventListener('unhandledrejection',onError);
   for(const t of taps){try{t.node.disconnect(t.analyser);}catch{}t.analyser.disconnect();}
   testing=false;q('runAudioChecks').disabled=false;progress(JSON.stringify(report,null,2));
   let download=q('downloadMusicReport');if(!download){download=document.createElement('a');download.id='downloadMusicReport';download.textContent='下载音乐验证记录';download.download='wake-up-tokyo-music-check.json';q('audioCheckResult').parentElement.append(download);}if(download.href.startsWith('blob:'))URL.revokeObjectURL(download.href);download.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
   manual=false;d.setVolume(music.volume);d.setMuted(music.muted);if(lastView)update(lastView);
  }
 };
}
