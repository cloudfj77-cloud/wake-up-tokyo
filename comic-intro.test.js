import {tutorialActive} from './tokyo/gameplay.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {comicReadingOrder,comicIntroSequence,comicIntroTimeline,playComicIntro,resetComicIntro,comicIntroPlayed,COMIC_INTRO_BASE_FILL,COMIC_INTRO_LEAD,COMIC_INTRO_MIN_GAP,COMIC_INTRO_SIZE_GAP} from './comic-intro.js';

const panel=(src,x,y,w=40,h=30,fill=.9)=>({src,x,y,w,h,fill,cx:x+w/2,cy:y+h/2});

test('同一排从左到右，排与排从上到下',()=>{
 const pieces=[panel('右上',60,4,38,33),panel('左上',1,5,64,32),panel('中排',0,35,79,27)];
 assert.deepEqual(comicReadingOrder(pieces).map(p=>p.src),['左上','右上','中排']);
});

test('分排不会被滚雪球合并：逐行下移的格子各自成排',()=>{
 // 旧写法会把不断变高的排并成一个，导致底部格子提前出现
 const pieces=[0,1,2,3].map(i=>panel('p'+i,0,i*20,50,25));
 assert.deepEqual(comicReadingOrder(pieces).map(p=>p.src),['p0','p1','p2','p3']);
 const tight=[0,1].map(i=>panel('t'+i,0,i*4,50,30));
 assert.deepEqual(comicReadingOrder(tight).map(p=>p.src),['t0','t1']);
});

test('页眉与页边剩料先铺底，画面格才逐格登场',()=>{
 const pieces=[panel('页眉',0,0,100,50,.1),panel('第一格',0,5,50,30),panel('第二格',50,5,50,30)];
 const {base,panels}=comicIntroSequence(pieces);
 assert.deepEqual(base.map(p=>p.src),['页眉']);
 assert.deepEqual(panels.map(p=>p.src),['第一格','第二格']);
 assert.ok(COMIC_INTRO_BASE_FILL>.1&&COMIC_INTRO_BASE_FILL<.9);
});

test('缺字段也不炸：没有 fill 时按画面格处理，空列表返回空',()=>{
 const {base,panels}=comicIntroSequence([{src:'a',x:0,y:0,w:10,h:10},{src:'b',x:20,y:0,w:10,h:10}]);
 assert.equal(base.length,0);
 assert.deepEqual(panels.map(p=>p.src),['a','b']);
 assert.deepEqual(comicIntroSequence([]),{base:[],panels:[]});
 assert.deepEqual(comicIntroSequence(null),{base:[],panels:[]});
});

test('大格子停留更久，小格子快过：间隔随面积增加',()=>{
 const pieces=[panel('大',0,0,100,50),panel('小',0,55,25,12)];
 const {steps,total}=comicIntroTimeline(pieces);
 assert.equal(steps.length,2);
 assert.ok(steps[0].size>steps[1].size,'大格的面积比例更高');
 const gapAfterBig=steps[1].delay-steps[0].delay;
 // 最大的格子吃满 sizeGap，小格子只吃 minGap
 assert.ok(Math.abs(gapAfterBig-(COMIC_INTRO_MIN_GAP+COMIC_INTRO_SIZE_GAP))<1e-6,'大格停留 = 最短间隔 + 面积追加');
 assert.ok(gapAfterBig>=2,'一张大图至少停 2 秒');
 assert.ok(steps[0].duration>steps[1].duration,'大格落格动画也稍慢');
 assert.ok(total>gapAfterBig);
});

test('节奏表单调递增，空列表不炸',()=>{
 const {steps,total}=comicIntroTimeline([panel('a',0,0,50,20),panel('b',0,25,50,20),panel('c',0,50,50,20)]);
 for(let i=1;i<steps.length;i++)assert.ok(steps[i].delay>steps[i-1].delay);
 assert.ok(total>0);
 assert.deepEqual(comicIntroTimeline([]),{steps:[],total:0});
 assert.deepEqual(comicIntroTimeline(null),{steps:[],total:0});
});

test('整页不切的页面：只有一格且铺满整页',()=>{
 const data=JSON.parse(readFileSync(new URL('./public/comic/page3.json',import.meta.url),'utf8'));
 assert.equal(data.pieces.length,1);
 const [only]=data.pieces;
 assert.deepEqual([only.x,only.y,only.w,only.h],[0,0,100,100]);
 assert.ok(data.hold>0,'整页图额外停留一会儿');
 const {steps,total}=comicIntroTimeline([only]);
 assert.equal(steps.length,1);
 assert.ok(steps[0].delay>0&&total>steps[0].delay);
});

test('已入版的分镜保持验收时的出场顺序',()=>{
 const data=JSON.parse(readFileSync(new URL('./public/comic/page1.json',import.meta.url),'utf8'));
 // 切片后缀可能随压缩方案变化（png / webp），这里只比文件名主干
 const stem=p=>p.src.split('/').pop().replace(/\.(png|webp|jpe?g)$/i,'');
 const byStem=name=>data.pieces.find(p=>stem(p)===name);
 const base=[byStem('01-panel')];                         // 页眉 + 页边剩料
 const panels=data.pieces.filter(p=>!base.includes(p));
 assert.deepEqual(base.map(stem),['01-panel']);
 assert.deepEqual(comicReadingOrder(panels).map(stem),
  ['03-panel','02-panel','05-panel','04-panel','06-panel','07-panel']);
});

function startFixture(){
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const begin=source.indexOf('async function start(');
 const snippet=source.slice(begin,source.indexOf("$('start').onclick",begin)).replaceAll('import.meta.env.DEV','false').replaceAll('import.meta.env.MODE',"'production'");
 let finishIntro;
 const intro=new Promise(resolve=>{finishIntro=resolve;});
 const calls={intro:0,music:0},menu={hidden:false},hud={hidden:true};
 const context=vm.createContext({
  objectiveFeedback:{reset(){}},objectiveFeedbackKey:null,tutorialActive,assets:{},starting:false,state:{time:0,infected:0,pending:0},conversionFeedback:{reset(){}},
  touchMode:false,document:{},pointerLock:{release(){}},captureView(){},playComicIntro:()=>{calls.intro++;return intro;},
  loadSaved:()=>null,music:{start:async()=>{calls.music++;}},
  playerVisual:{holder:{rotation:{y:0}}},yaw:0,
  $:id=>({menu,hud})[id],mode:'menu',
  combatUI:{baseline:()=>{}},units:[],player:{},boss:{},toast:()=>{},
 });
 vm.runInContext(snippet,context);
 return {context,calls,finishIntro,menu,hud};
}

test('开场未结束时重复开始不能提前进入游戏，也不会启动第二次开场',async()=>{
 const f=startFixture();
 const first=f.context.start();
 await f.context.start();
 assert.equal(f.calls.intro,1);
 assert.equal(f.calls.music,0);
 assert.equal(f.context.mode,'menu');
 assert.equal(f.menu.hidden,false);
 f.finishIntro();await first;
 assert.equal(f.calls.music,1);
 assert.equal(f.context.mode,'playing');
 assert.equal(f.menu.hidden,true);
 assert.equal(f.hud.hidden,false);
});

test('继续存档直接进入游戏，不等待新开局漫画',async()=>{
 const f=startFixture();
 await f.context.start(true);
 assert.equal(f.calls.intro,0);
 assert.equal(f.calls.music,1);
 assert.equal(f.context.mode,'playing');
});

test('all three opening pages have Chinese replacements for narrative captions and headings',async()=>{
 const {COMIC_ZH,comicChineseLabels}=await import('./comic-zh.js');
 for(let n=1;n<=3;n++){
  const data=JSON.parse(readFileSync(new URL(`./public/comic/page${n}.json`,import.meta.url)));
  assert.ok(COMIC_ZH[data.source.split('/').pop()]?.length);
  const labels=data.pieces.flatMap(p=>comicChineseLabels(data,p));assert.equal(labels.length,COMIC_ZH[data.source.split('/').pop()].length);
  for(const l of labels){assert.match(l.text,/[\u4e00-\u9fff]/);assert.doesNotMatch(l.text,/[A-Za-z]/);assert.ok(Number.isFinite(l.left)&&Number.isFinite(l.top)&&l.width>0&&l.height>0);}
 }
});

// 只模拟播放器需要的 DOM，检查完整播放与动图回收。
function playbackFixture(t,loadImages=true){
 const listeners=new Map(),videos=[];
 const element=tag=>{
  const el={tag,children:[],style:{},className:'',classList:{add(){},remove(){}},offsetWidth:0,
   appendChild(child){child.parent=this;this.children.push(child);return child;},
   insertBefore(child,before){child.parent=this;this.children.splice(this.children.indexOf(before),0,child);},
   remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);},
   setAttribute(){},removeAttribute(){},pause(){this.pauses=(this.pauses||0)+1;},load(){},play(){this.plays=(this.plays||0)+1;return Promise.resolve();},
   querySelectorAll(selector){const all=this.children.flatMap(c=>[c,...c.querySelectorAll('*')]);return selector==='*'?all:all.filter(c=>selector.split(',').some(s=>s.trim().startsWith('.')?c.className===s.trim().slice(1):c.tag===s.trim()));},
   querySelector(selector){return this.querySelectorAll(selector)[0];},
   getContext(){return {drawImage(){},getImageData:()=>({data:new Uint8Array(48*48*4).fill(255)})};},
  };
  Object.defineProperty(el,'innerHTML',{set(html){const stage=element('div');stage.className='comicStage';const lines=element('div');lines.className='comicLines';stage.appendChild(lines);el.appendChild(stage);if(html.includes('comicSkip')){const button=element('button');button.className='comicSkip';el.appendChild(button);}}});
  if(tag==='video')videos.push(el);return el;
 };
 const doc={body:element('body'),head:element('head'),createElement:element,getElementById:()=>null,
  addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name);}};
 const oldImage=globalThis.Image,oldDocument=globalThis.document;
 globalThis.document=doc;globalThis.Image=class{naturalWidth=48;naturalHeight=48;set src(value){if(loadImages)queueMicrotask(()=>this.onload());}};
 resetComicIntro();t.after(()=>{globalThis.Image=oldImage;globalThis.document=oldDocument;resetComicIntro();});
 return {doc,listeners,videos,root:()=>doc.body.children[0]};
}
const flushPlayback=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const playbackPage={width:100,height:100,pieces:[{src:'panel.png',x:0,y:0,w:100,h:100}],clips:[{src:'panel.mp4',x:0,y:0,w:100,h:100}]};

test('comic plays every page naturally and releases each video',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=playbackFixture(t);let panels=0;
 const playing=playComicIntro(f.doc,{pages:[playbackPage,playbackPage],onPanel:()=>panels++});await flushPlayback();
 for(let i=0;i<8;i++){t.mock.timers.tick(10000);await flushPlayback();}
 assert.equal(await playing,true);assert.equal(panels,2);assert.equal(f.videos.length,2);assert.ok(f.videos.every(v=>v.pauses===1));assert.equal(f.listeners.size,0);
});


test('restored skip control exits even during pending image decoding',async t=>{
 const f=playbackFixture(t,false),playing=playComicIntro(f.doc,{pages:[playbackPage]});await flushPlayback();
 const skip=f.root()?.querySelector('.comicSkip');assert.ok(skip,'opening must provide its skip button');skip.onclick({preventDefault(){},stopImmediatePropagation(){}});
 assert.equal(await playing,true);assert.equal(f.doc.body.children.length,0);assert.equal(f.listeners.size,0);
});
test('restored Escape skips the rest of the opening and releases video and timers',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=playbackFixture(t);let panels=0;
 const playing=playComicIntro(f.doc,{pages:[playbackPage,playbackPage],onPanel:()=>panels++});await flushPlayback();
 const escape=f.listeners.get('keydown');assert.equal(typeof escape,'function');escape({code:'Escape',preventDefault(){},stopImmediatePropagation(){}});
 await playing;t.mock.timers.tick(60000);await flushPlayback();assert.equal(panels,0);assert.equal(f.videos[0].pauses,1);assert.equal(f.listeners.size,0);
});
