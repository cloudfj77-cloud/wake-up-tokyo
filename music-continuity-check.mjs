// Development-only fault reproduction, using the game's real Wwise output.
import pressureUrl from './audio/wwise/generated/media/663454604.wem?url';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function mountMusicContinuityCheck(music,host){
 const button=document.createElement('button'),out=document.createElement('pre');button.textContent='检查长时音乐与读取故障恢复（约 3 分钟）';out.style.whiteSpace='pre-wrap';host.append(button,out);
 button.onclick=async()=>{
  button.disabled=true;const d=music.director,sfx=music.sfx,fetchOriginal=globalThis.fetch,connect=AudioNode.prototype.connect;
  const report={at:new Date().toISOString(),kind:'controlled Wwise streaming continuity, not a gameplay recording',samples:[]};let node,analyser,injected=false,start,faultKey,failures=0,transient=false,injecting=true;
  const save=()=>{out.textContent=JSON.stringify(report,null,2);const a=document.createElement('a');a.textContent='下载长时音乐检查';a.download='wake-music-continuity.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));host.append(a);};
  try{
   report.rangeCacheProbe=[];
   for(const cache of ['default','no-store'])for(const [offset,length] of [[883441,32768],[31473,32768],[883441,16384],[883441,32768]]){
    const expected=`bytes ${offset}-${offset+length-1}/1129734`,response=await fetchOriginal(pressureUrl,{cache,headers:{Range:`bytes=${offset}-${offset+length-1}`}}),contentRange=response.headers.get('Content-Range');
    const bytes=(await response.arrayBuffer()).byteLength;report.rangeCacheProbe.push({cache,expected,status:response.status,contentRange,bytes,ok:response.status===206&&contentRange===expected&&bytes===length});
   }
   music.audition.setManual(true);if(d.loading)await d.loading;music.dispose();d.resume();d.setScene('street');
   AudioNode.prototype.connect=function(...args){const result=connect.apply(this,args);if(this instanceof AudioWorkletNode&&args[0]===this.context.destination&&!node){node=this;analyser=this.context.createAnalyser();analyser.fftSize=2048;connect.call(this,analyser);}return result;};
   globalThis.fetch=(url,options)=>{if(!injecting||!start)return fetchOriginal(url,options);const elapsed=performance.now()-start,key=String(url)+' '+options?.headers?.Range;if(elapsed>30000&&!transient&&String(url).includes('659547489')&&options?.headers?.Range){transient=true;report.transientAtMs=elapsed;return Promise.resolve(new Response('',{status:503}));}if(elapsed>95000&&String(url).includes('663454604')&&options?.headers?.Range&&(!faultKey||faultKey===key)&&failures<3){faultKey=key;injected=true;failures++;report.injectedAtMs=elapsed;return Promise.resolve(new Response('',{status:503}));}return fetchOriginal(url,options);};
   await music.start();const deadline=performance.now()+5000;while(!analyser&&performance.now()<deadline)await wait(20);AudioNode.prototype.connect=connect;if(!analyser)throw Error('No Wwise output tap');
   const data=new Float32Array(2048);start=performance.now();

   for(let second=0;second<180;second++){
    // Short sounds exercise the shared engine, with quiet windows to measure music alone.
    sfx.update({mode:'playing',map:'tidewater'});if(second===30)d.setScene('boss');if(second===80)d.setScene('street');if(second===95)d.setScene('pressure');
    if(second%12===0){sfx.emit('gunPistol');sfx.emit('hitBody');sfx.emit('convert');}
    if(second===35||second===70){d.pause();await wait(800);d.resume();}
    await wait(1000);analyser.getFloatTimeDomainData(data);let energy=0;for(const v of data)energy+=v*v;
    report.samples.push({second,elapsedMs:performance.now()-start,rms:Math.sqrt(energy/data.length),...d.snapshot()});
    out.textContent=`音乐连续性 ${second+1}/180 秒 · ${d.snapshot().playback?.playing?'播放中':'已停止'} · ${injected?'已注入读取故障':'正常流式播放'}`;
   }
   report.injected=injected;report.injectedFailureCount=failures;report.transient=transient;report.final=d.snapshot();report.ok=injected&&transient&&failures===3&&report.final.recoveries.some(r=>r.reason==='event-ended')&&report.samples.slice(110).every(s=>s.playback?.playing&&s.rms>1e-6);
  }catch(e){report.ok=false;report.error=String(e);}
  finally{injecting=false;globalThis.fetch=fetchOriginal;AudioNode.prototype.connect=connect;if(node&&analyser)try{node.disconnect(analyser);}catch{}analyser?.disconnect();save();button.disabled=false;music.audition.setManual(false);}
 };
}
