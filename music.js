// 装机音乐：平时一组、Boss 战一组，各随机挑一首循环播放，切换时交叉淡入淡出。
// 路径写成相对路径，配合 vite 的 base:'./' 与单文件里的 fetch 拦截器都能命中。
export const BED_TRACKS={
 play:['music/funky-energy-loop.mp3','music/circuit.mp3'],
 boss:['music/epic-boss-battle.mp3','music/evil-incoming.mp3']
};
export const BED_LEVEL=.5;        // 音乐占总音量的比例，压在音效下面
export const BED_FADE_IN=1.8;
export const BED_FADE_OUT=1.2;
export const BED_ROTATE_AFTER=2;  // 循环几遍之后换同组里的另一首
// 随机挑一首，尽量不和上一首重复；只有一首时就是它。
export function pickBedTrack(list,last,random=Math.random){
 if(!list||!list.length)return null;
 if(list.length===1)return list[0];
 const pool=list.filter(track=>track!==last);
 const source=pool.length?pool:list;
 return source[Math.min(source.length-1,Math.floor(random()*source.length))];
}
// 音效仍走 WebAudio 合成；背景音乐全部来自 public/music 下的 mp3，不再有程序合成的旧音轨。
// 中后期一次群体同化会让几十个音同时响，WebAudio 是线性叠加的，瞬间就能冲过 1.0 削波炸耳。
// 所以音效走三层保护：同名音效最小间隔 → 同时发声数量上限 → master 上的限幅器。
export const SFX_MAX_VOICES=24;   // 同一时刻最多允许多少个振荡器
export const SFX_DEFAULT_GAP=.05; // 没单独配的最小间隔
// 每种音效的最小触发间隔（秒）。密集重复的音给长一点，一次性的给短一点。
export const SFX_GAP={
 convert:.14,       // 群体同化：一发强化炮弹能同化十几个人，必须合并成一声
 infect:.07,        // 射击 / 近战，射速快时每发都响
 hurt:.2,           // 受伤，有无敌帧兜底，别再叠
 powerBounce:.14,   // 强化炮弹撞墙弹跳，一秒内可能弹好几次
 chargeTick:.045,   // 蓄力每命中一发升一级
 chargeReady:.6,
 shoot:.06,
 jump:.12,
 roll:.25,
 upgrade:.5,
 alertUp:2,         // 低频重击，连续升级警戒时会很吵
 police:2.5,
 bossThrow:.35,
 bossImpact:.7,
 powerImpact:.4,
 powerThrow:.3,
 defeat:3,
};
export class Soundtrack {
 constructor(){this.ctx=null;this.volume=.38;this.muted=false;this.enabled=false;
  this.bed={mode:null,el:null,rotate:null,token:0};
  this.bedLast={};this.bedCache=new Map();
  this.voices=0;this.sfxLast={};}
 async start(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=this.volume;
   // 限幅器：threshold -9dB / ratio 20，把任何叠加压回安全区，杜绝削波。
   this.limiter=this.ctx.createDynamicsCompressor();
   this.limiter.threshold.value=-9;this.limiter.knee.value=3;this.limiter.ratio.value=20;
   this.limiter.attack.value=.002;this.limiter.release.value=.25;
   this.master.connect(this.limiter);this.limiter.connect(this.ctx.destination);}await this.ctx.resume();this.enabled=true;}
 setVolume(v){this.volume=v;this.master?.gain.setTargetAtTime(this.muted?0:v,this.ctx.currentTime,.05);this._applyBedVolume();}
 toggle(){this.muted=!this.muted;if(this.ctx)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.05);this._applyBedVolume();return !this.muted;}
 // ---- 装机音乐 ----
 // 音乐走独立的 <audio> 元素（不接 WebAudio），这样单文件 data URI 下也能出声。
 _bedScale(){return this.muted?0:this.volume*BED_LEVEL;}
 _applyBedVolume(el=this.bed.el){if(el)el.volume=Math.max(0,Math.min(1,(el.__gain||0)*this._bedScale()));}
 // 淡入淡出只改包络 __gain，实际音量再乘总音量，这样中途调音量/静音不会打断淡变。
 _fadeBed(el,to,seconds,done){
  if(!el)return;
  const from=el.__gain||0;
  const steps=Math.max(2,Math.ceil(seconds/.06));
  let i=0;
  clearInterval(el.__fadeTimer);
  el.__fadeTimer=setInterval(()=>{
   i++;
   el.__gain=from+(to-from)*(i/steps);
   this._applyBedVolume(el);
   if(i>=steps){clearInterval(el.__fadeTimer);el.__fadeTimer=null;done&&done();}
  },60);
 }
 _retire(el){
  if(!el)return;
  clearInterval(el.__fadeTimer);
  this._fadeBed(el,0,BED_FADE_OUT,()=>{el.pause();el.removeAttribute('src');el.load();});
 }
 // 换曲计时器要跟着暂停一起停，否则会在暂停菜单里自己换歌。
 _scheduleRotate(mode,span){
  clearTimeout(this.bed.rotate);
  this.bed.rotateMode=mode;this.bed.rotateAt=Date.now()+span;
  this.bed.rotate=setTimeout(()=>{this.bed.rotateAt=0;if(this.bed.mode===mode)this._playBed(mode,true);},span);
 }
 async setBed(mode){await this._playBed(mode,false);}
 // 本局结束才用：曲子淡出后释放，结算画面保持安静。菜单、选卡、暂停都不调它。
 stopBed(){clearTimeout(this.bed.rotate);this.bed.rotate=null;this.bed.rotateAt=0;this.bed.rotateLeft=0;
  this.bed.token++;this.bed.mode=null;
  const el=this.bed.el;this.bed.el=null;
  if(el)this._retire(el);}
 async _playBed(mode,force){
  if(!force&&this.bed.mode===mode)return;
  const token=++this.bed.token;
  this.bed.mode=mode;
  const outgoing=this.bed.el;
  this.bed.el=null;
  clearTimeout(this.bed.rotate);
  if(outgoing)this._retire(outgoing);
  if(!mode)return;
  const list=BED_TRACKS[mode];
  if(!list||!list.length)return;
  const track=pickBedTrack(list,this.bedLast[mode]);
  this.bedLast[mode]=track;
  let url=this.bedCache.get(track);
  if(!url){
   // 取不到就静默退回纯合成音轨，不能让音乐缺失把游戏卡住。
   try{
    const res=await fetch(track);
    if(!res.ok)throw new Error(track+' '+res.status);
    url=URL.createObjectURL(await res.blob());
    this.bedCache.set(track,url);
   }catch{return;}
  }
  if(token!==this.bed.token)return;
  const el=new Audio(url);
  el.loop=true;el.preload='auto';el.volume=0;el.__gain=0;
  this.bed.el=el;
  el.onloadedmetadata=()=>{
   if(this.bed.el!==el)return;
   const span=(el.duration||0)*1000*BED_ROTATE_AFTER;
   // 同一首循环够几遍就换同组里的另一首，长时间玩也不会只听一首。
   if(span>0)this._scheduleRotate(mode,span);
  };
  try{await el.play();}catch{}
  if(token!==this.bed.token){el.pause();return;}
  this._fadeBed(el,1,BED_FADE_IN);
 }
 note(freq,time,duration,volume,type='triangle',slide=1){const c=this.ctx;if(!c)return;
  // 复音上限：叠太多了就直接丢掉新的，宁可少一声也不要炸耳。
  if(this.voices>=SFX_MAX_VOICES)return;
  const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);if(slide!==1)o.frequency.exponentialRampToValueAtTime(freq*slide,time+duration);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.012);g.gain.exponentialRampToValueAtTime(.001,time+duration);o.connect(g);g.connect(this.master);
  this.voices++;let freed=false;
  const free=()=>{if(freed)return;freed=true;this.voices=Math.max(0,this.voices-1);clearTimeout(fallback);};
  o.onended=free;
  // onended 在上下文被挂起时可能不触发，用定时器兜底，避免计数只涨不落。
  const fallback=setTimeout(free,Math.max(0,(time-c.currentTime+duration+.1))*1000);
  o.start(time);o.stop(time+duration+.02);}
 effect(type,step=0){if(!this.ctx)return;const t=this.ctx.currentTime;
  // 同名音效在最小间隔内只响一次：群体同化、连续射击这类密集事件会被合并成一声。
  const gap=SFX_GAP[type]??SFX_DEFAULT_GAP;
  if(this.sfxLast[type]!==undefined&&t-this.sfxLast[type]<gap)return;
  this.sfxLast[type]=t;
  // 感染成功使用两段上升音，让它和普通命中有明显区别，同时只在统一反馈入口播放。
  if(type==='convert'){this.note(620,t,.24,.1,'sine',1.35);this.note(930,t+.08,.38,.08,'triangle',1.7);return;}
  // 六段圆环每亮一格音高就升一级，玩家不看脚下也知道当前蓄力进度。
  if(type==='chargeTick'){const level=Math.max(1,Math.min(6,step)),frequency=320*2**((level-1)*2/12);this.note(frequency,t,.12,.065,'sine',1.18);return;}
  if(type==='powerImpact'){this.note(110,t,.45,.2,'sawtooth',.35);this.note(560,t,.5,.12,'sine',2);return;}
  // 炮弹出手、撞墙和触地爆炸各用不同声音，光听声音也能判断当前阶段。
  if(type==='powerThrow'){this.note(140,t,.32,.14,'sawtooth',3.2);this.note(440,t+.05,.2,.07,'triangle',1.5);return;}
  // Boss 炮弹使用低沉喷吐和明亮爆炸，不能与玩家的紫色强化炮弹听起来一样。
  if(type==='bossThrow'){this.note(86,t,.38,.18,'sawtooth',2.4);this.note(620,t+.06,.22,.08,'square',.55);return;}
  if(type==='bossImpact'){this.note(48,t,.85,.32,'sawtooth',.42);this.note(72,t,.7,.28,'square',.35);this.note(210,t,.5,.18,'sawtooth',1.1);this.note(520,t+.04,.38,.12,'triangle',1.6);this.note(880,t+.08,.28,.08,'sine',.9);return;}
  if(type==='defeat'){this.note(180,t,.7,.14,'sawtooth',.45);this.note(120,t+.22,.9,.11,'sine',.4);return;}
  // 警力提示使用交替警笛，警戒升级则叠加低频重击，和普通战斗声音明确分开。
  if(type==='police'){for(let i=0;i<4;i++){this.note(i%2?520:740,t+i*.14,.16,.055,'sine',i%2?1.25:.78);}return;}
  if(type==='alertUp'){this.note(92,t,.7,.18,'sawtooth',.45);for(let i=0;i<3;i++)this.note(680+i*90,t+i*.12,.2,.075,'square',1.18);return;}
  const specs={infect:[420,.18,.12,'triangle',1.8],attack:[155,.16,.09,'sawtooth',2.1],hit:[245,.1,.085,'square',.62],jump:[210,.2,.065,'triangle',1.8],roll:[145,.34,.075,'sawtooth',.38],chargeReady:[760,.35,.08,'sine',1.8],powerBounce:[180,.1,.06,'square',.7],break:[90,.3,.2,'sawtooth',.25],shoot:[125,.13,.11,'square',2.7],hurt:[100,.13,.08,'square',.5],upgrade:[520,.5,.1,'triangle',2]};
  this.note(...(specs[type]?[specs[type][0],t,...specs[type].slice(1)]:[300,t,.1,.08]));
 }
 // 暂停/继续只管音乐床。菜单、选卡、结算这些界面都不再调用它——音乐要一路放下去。
 // 淡出后保留 src，这样再继续时能从原处淡回来。
 pause(){if(this.bed.rotateAt)this.bed.rotateLeft=Math.max(0,this.bed.rotateAt-Date.now());clearTimeout(this.bed.rotate);this.bed.rotate=null;this.bed.rotateAt=0;
  const el=this.bed.el;if(el)this._fadeBed(el,0,BED_FADE_OUT,()=>el.pause());}
 resume(){if(!this.bed.el||!this.bed.mode)return;const el=this.bed.el;
  el.play().then(()=>{if(this.bed.el===el)this._fadeBed(el,1,BED_FADE_IN);}).catch(()=>{});
  if(this.bed.rotateLeft&&this.bed.mode){const left=this.bed.rotateLeft;this.bed.rotateLeft=0;this._scheduleRotate(this.bed.mode,left);}}
}
