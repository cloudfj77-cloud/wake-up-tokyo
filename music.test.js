import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BED_TRACKS,BED_ROTATE_AFTER,BED_LEVEL,pickBedTrack,Soundtrack,SFX_MAX_VOICES,SFX_GAP} from './music.js';

// 极简假 AudioContext：只记录建了哪些节点，够验证限幅链路与复音上限。
function fakeAudioContext(){
 const nodes=[];
 const param=()=>({value:0,setValueAtTime(){return this;},linearRampToValueAtTime(){return this;},
  exponentialRampToValueAtTime(){return this;},setTargetAtTime(){return this;}});
 const base=extra=>Object.assign({connect(d){this.dest=d;return d;}},extra);
 const ctx={currentTime:0,state:'running',destination:base({__kind:'destination'}),
  createGain(){const n=base({gain:param(),__kind:'gain'});nodes.push(n);return n;},
  createOscillator(){const n=base({type:'sine',frequency:param(),start(){},stop(){},onended:null,__kind:'osc'});nodes.push(n);return n;},
  createDynamicsCompressor(){const n=base({threshold:param(),knee:param(),ratio:param(),attack:param(),
   release:param(),reduction:0,__kind:'compressor'});nodes.push(n);return n;},
  resume:async()=>{},nodes};
 return ctx;
}

test('both music beds list two loopable tracks and the boss set is separate',()=>{
 assert.equal(BED_TRACKS.play.length,2);
 assert.equal(BED_TRACKS.boss.length,2);
 assert.equal(new Set(BED_TRACKS.play).size,2);
 assert.equal(new Set(BED_TRACKS.boss).size,2);
 for(const track of [...BED_TRACKS.play,...BED_TRACKS.boss])assert.match(track,/^music\/.+\.mp3$/);
 assert.equal(BED_TRACKS.play.some(t=>BED_TRACKS.boss.includes(t)),false,'boss tracks are not reused as ambient tracks');
});

test('bed picks a track at random and avoids repeating the one just played',()=>{
 const list=BED_TRACKS.boss;
 assert.equal(pickBedTrack(list,list[0],()=>0),list[1]);
 assert.equal(pickBedTrack(list,list[1],()=>0),list[0]);
 // 随机源走到上限时也要落在合法下标上，不能越界成 undefined。
 assert.equal(pickBedTrack(list,null,()=>0.999),list[1]);
 assert.equal(pickBedTrack(['only.mp3'],null),'only.mp3');
 assert.equal(pickBedTrack([],null),null);
 assert.ok(BED_ROTATE_AFTER>=1,'tracks rotate after a few loops');
 assert.ok(BED_LEVEL>0&&BED_LEVEL<1,'music sits under the sound effects');
});

test('switching beds never throws when audio is unavailable',async()=>{
 const music=new Soundtrack();
 // 没有浏览器环境时（Node 里没有 fetch 的相对路径 / 没有 Audio），音乐缺失只能静默，不能把游戏拖垮。
 await music.setBed('play');
 assert.equal(music.bed.mode,'play');
 await music.setBed('boss');
 assert.equal(music.bed.mode,'boss');
 music.pause();music.resume();music.setVolume(.2);music.toggle();
});

test('the old procedural score is gone; only mp3 beds remain',()=>{
 // 之前那套靠振荡器实时合成的循环音轨已经删掉，音乐只剩装机 mp3。
 assert.equal(Soundtrack.prototype.schedule,undefined,'no synth sequencer left');
 assert.equal(typeof Soundtrack.prototype.effect,'function','sound effects still exist');
 assert.equal(typeof Soundtrack.prototype._playBed,'function','mp3 beds still exist');
});

test('pausing the bed keeps the track loaded so it can fade back in',async()=>{
 const prev={fetch:globalThis.fetch,Audio:globalThis.Audio,createObjectURL:URL.createObjectURL};
 const played=[];
 globalThis.fetch=async url=>({ok:true,status:200,blob:async()=>({})});
 URL.createObjectURL=()=>'blob:stub';
 globalThis.Audio=class{constructor(src){this.src=src;this.volume=0;this.paused=true;played.push(this);}
  play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){this.src=null;}load(){}};
 try{
  const music=new Soundtrack();
  await music.setBed('play');
  const el=music.bed.el;
  assert.ok(el&&el.loop===true,'the bed loops');
  music.pause();
  assert.ok(el.src,'pausing keeps the source, unlike retiring a finished track');
  music.resume();
  assert.equal(el.paused,false);
  clearInterval(el.__fadeTimer);
  // 结算画面要安静：stopBed 把当前这首交出去淡出，并清空音乐床。
  music.stopBed();
  assert.equal(music.bed.el,null);
  assert.equal(music.bed.mode,null);
 }finally{globalThis.fetch=prev.fetch;globalThis.Audio=prev.Audio;URL.createObjectURL=prev.createObjectURL;}
});

test('sound effects run through a limiter so stacked hits cannot clip',async()=>{
 const prev=globalThis.AudioContext;
 let ctx;
 globalThis.AudioContext=function(){ctx=fakeAudioContext();return ctx;};
 try{
  const music=new Soundtrack();
  await music.start();
  // 中后期几十个音叠在一起会冲过 1.0，所以 master 必须先进限幅器再进 destination。
  assert.ok(music.limiter,'a limiter exists');
  assert.equal(music.master.dest,music.limiter,'master feeds the limiter');
  assert.equal(music.limiter.dest,ctx.destination,'limiter feeds the speakers');
  assert.ok(music.limiter.ratio.value>=10,'the limiter actually clamps');
 }finally{globalThis.AudioContext=prev;}
});

test('repeating the same effect inside its gap only plays once',async()=>{
 const prev=globalThis.AudioContext;
 let ctx;
 globalThis.AudioContext=function(){ctx=fakeAudioContext();return ctx;};
 try{
  const music=new Soundtrack();
  await music.start();
  const oscCount=()=>ctx.nodes.filter(n=>n.__kind==='osc').length;
  // 一发强化炮弹同化十几个人：同一帧里 convert 被叫了 12 次，只能响一次。
  for(let i=0;i<12;i++)music.effect('convert');
  assert.equal(oscCount(),2,'a burst of conversions collapses into one sound');
  // 过了最小间隔要能再响，不然连续同化就没反馈了。
  ctx.currentTime=SFX_GAP.convert+.01;
  music.effect('convert');
  assert.equal(oscCount(),4,'playable again once the gap has passed');
 }finally{globalThis.AudioContext=prev;}
});

test('voice count is capped so a busy frame cannot stack unbounded oscillators',async()=>{
 const prev=globalThis.AudioContext;
 let ctx;
 globalThis.AudioContext=function(){ctx=fakeAudioContext();return ctx;};
 try{
  const music=new Soundtrack();
  await music.start();
  const oscCount=()=>ctx.nodes.filter(n=>n.__kind==='osc').length;
  music.voices=SFX_MAX_VOICES;
  music.effect('bossImpact');           // 单个音效最多 5 个振荡器
  assert.equal(oscCount(),0,'no new voices once the cap is reached');
  music.voices=SFX_MAX_VOICES-1;
  music.effect('infect');               // 还剩一个名额，能出声
  assert.equal(oscCount(),1,'still plays while under the cap');
 }finally{globalThis.AudioContext=prev;}
});
