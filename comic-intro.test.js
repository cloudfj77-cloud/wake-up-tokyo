import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {comicReadingOrder,comicIntroSequence,comicIntroTimeline,COMIC_INTRO_BASE_FILL,COMIC_INTRO_MIN_GAP,COMIC_INTRO_SIZE_GAP} from './comic-intro.js';

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
