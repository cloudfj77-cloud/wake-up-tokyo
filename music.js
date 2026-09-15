// Original procedural synth score: no external audio or autoplay dependencies.
export class Soundtrack {
 constructor(){this.ctx=null;this.volume=.38;this.muted=false;this.enabled=false;this.next=0;this.step=0;this.alert=1;this.timer=null;}
 async start(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.master.gain.value=this.volume;}await this.ctx.resume();this.enabled=true;if(!this.timer)this.timer=setInterval(()=>this.schedule(),80);this.next=this.ctx.currentTime+.04;}
 setVolume(v){this.volume=v;this.master?.gain.setTargetAtTime(this.muted?0:v,this.ctx.currentTime,.05);}
 toggle(){this.muted=!this.muted;if(this.ctx)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.05);return !this.muted;}
 note(freq,time,duration,volume,type='triangle',slide=1){const c=this.ctx;if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);if(slide!==1)o.frequency.exponentialRampToValueAtTime(freq*slide,time+duration);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.012);g.gain.exponentialRampToValueAtTime(.001,time+duration);o.connect(g);g.connect(this.master);o.start(time);o.stop(time+duration+.02);}
 schedule(){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;const c=this.ctx;const beat=60/(96+this.alert*7)/4;if(this.next<c.currentTime-.3)this.next=c.currentTime+.03;while(this.next<c.currentTime+.18){const n=this.step++,t=this.next;this.next+=beat;const roots=[55,65.406,49,58.27],root=roots[Math.floor(n/32)%4];if(n%4===0)this.note(root,t,beat*3,.12,'sawtooth');if(n%8===0)this.note(105,t,.18,.25,'sine',.35);if(n%8===4){this.note(165,t,.08,.055,'square',.4);this.note(2400,t,.035,.025,'triangle');}if(n%2===0)this.note(6000,t,.026,.025,'square');const pattern=[0,7,12,15,19,12,7,10];if(n%2===0){const freq=root*4*2**(pattern[Math.floor(n/2)%8]/12);this.note(freq,t,beat*1.7,.027+this.alert*.008,'triangle');}if(n%32===0)for(const semitone of [0,3,7])this.note(root*4*2**(semitone/12),t,beat*25,.018,'sine');}}
 effect(type,step=0){if(!this.ctx)return;const t=this.ctx.currentTime;
  // 感染成功使用两段上升音，让它和普通命中有明显区别，同时只在统一反馈入口播放。
  if(type==='convert'){this.note(620,t,.24,.1,'sine',1.35);this.note(930,t+.08,.38,.08,'triangle',1.7);return;}
  // 六段圆环每亮一格音高就升一级，玩家不看脚下也知道当前蓄力进度。
  if(type==='chargeTick'){const level=Math.max(1,Math.min(6,step)),frequency=320*2**((level-1)*2/12);this.note(frequency,t,.12,.065,'sine',1.18);return;}
  if(type==='powerImpact'){this.note(110,t,.45,.2,'sawtooth',.35);this.note(560,t,.5,.12,'sine',2);return;}
  // 炮弹出手、撞墙和触地爆炸各用不同声音，光听声音也能判断当前阶段。
  if(type==='powerThrow'){this.note(140,t,.32,.14,'sawtooth',3.2);this.note(440,t+.05,.2,.07,'triangle',1.5);return;}
  if(type==='defeat'){this.note(180,t,.7,.14,'sawtooth',.45);this.note(120,t+.22,.9,.11,'sine',.4);return;}
  // 警力提示使用交替警笛，警戒升级则叠加低频重击，和普通战斗声音明确分开。
  if(type==='police'){for(let i=0;i<4;i++){this.note(i%2?520:740,t+i*.14,.16,.055,'sine',i%2?1.25:.78);}return;}
  if(type==='alertUp'){this.note(92,t,.7,.18,'sawtooth',.45);for(let i=0;i<3;i++)this.note(680+i*90,t+i*.12,.2,.075,'square',1.18);return;}
  const specs={infect:[420,.18,.12,'triangle',1.8],attack:[155,.16,.09,'sawtooth',2.1],hit:[245,.1,.085,'square',.62],jump:[210,.2,.065,'triangle',1.8],roll:[145,.34,.075,'sawtooth',.38],chargeReady:[760,.35,.08,'sine',1.8],powerBounce:[180,.1,.06,'square',.7],break:[90,.3,.2,'sawtooth',.25],shoot:[125,.13,.11,'square',2.7],hurt:[100,.13,.08,'square',.5],upgrade:[520,.5,.1,'triangle',2]};
  this.note(...(specs[type]?[specs[type][0],t,...specs[type].slice(1)]:[300,t,.1,.08]));
 }
 pause(){this.enabled=false;}
 resume(){this.enabled=true;if(this.ctx)this.next=this.ctx.currentTime+.03;}
}
