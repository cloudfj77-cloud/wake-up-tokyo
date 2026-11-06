import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as rules from './rules.js';
import {createConversionFeedback,CONVERSION_FEEDBACK_SECONDS} from './conversion-feedback.js';

function fixture(withPaint=false,visualReady=()=>true){
 class Node{
  constructor(){this.children=[];this.style={};this.dataset={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
  setAttribute(k,v){this[k]=v;} append(...nodes){nodes.forEach(n=>{n.parent=this;this.children.push(n);});}
  prepend(n){n.parent=this;this.children.unshift(n);} remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  querySelectorAll(){return this.points??=[];} querySelector(s){return (this.parts??={})[s]??=new Node();}
  set innerHTML(v){this.html=v;this.points=Array.from({length:6},()=>new Node());} get innerHTML(){return this.html;}
 }
 const emblem=new Node(),feed=new Node(),sounds=[],frames=[];let now=0;
 const doc={getElementById:id=>id==='infectionFeedback'?emblem:feed,createElement:()=>new Node(),defaultView:withPaint?{requestAnimationFrame:cb=>frames.push(cb)}:undefined};
 const ui=createConversionFeedback(doc,u=>u.name,()=>sounds.push('convert'),()=>now,visualReady);
 const personal=u=>{ui.markPersonal(u);ui.record(u);ui.tick(true);};
 return{ui,personal,emblem,feed,sounds,paint:()=>{frames.splice(0).forEach(cb=>cb());},advance:t=>{now+=t;ui.tick(true);}};
}

test('all conversions scroll into a bounded feed; only direct personal success lights the emblem and sound',()=>{
 const {ui,personal,emblem,feed,sounds}=fixture();
 ui.record({name:'友军战果',fromArmy:true});ui.tick(true);
 assert.equal(feed.children.length,1);assert.equal(emblem.style.opacity,'0');assert.equal(sounds.length,0);
 // Gameplay credit may belong to the player after an earlier tag; an ally finishing it is still not a direct success.
 ui.record({name:'持续扩散',playerInfection:true,fromArmy:false});ui.tick(true);assert.equal(emblem.style.opacity,'0');
 personal({name:'亲自感染'});assert.equal(emblem.dataset.points,'1');assert.equal(sounds.length,1);
 assert.equal(emblem.querySelectorAll().filter(n=>n.classes.has('lit')).length,1);
 for(let i=0;i<30;i++)ui.record({name:'同伴'+i,fromArmy:true});
 assert.equal(feed.children.length,5);assert.equal(emblem.dataset.points,'1');assert.equal(sounds.length,1);
});

test('each personal conversion lights one more of six points; seventh starts the next cycle',()=>{
 const {personal,emblem,sounds}=fixture();
 for(let i=1;i<=13;i++){
  personal({name:'目标'+i});const points=(i-1)%6+1;
  assert.equal(Number(emblem.dataset.points),points);
  assert.equal(emblem.querySelectorAll().filter(n=>n.classes.has('lit')).length,points);
 }
 assert.equal(sounds.length,13);
});

test('emblem lasts half the previous 1.35 seconds, refreshes for a new personal success and resets cleanly',()=>{
 const {ui,personal,emblem,feed,advance}=fixture();assert.equal(CONVERSION_FEEDBACK_SECONDS,1.35/2);
 personal({name:'一'});advance(.5);assert.ok(Number(emblem.style.opacity)>0);
 personal({name:'二'});advance(.5);assert.ok(Number(emblem.style.opacity)>0);
 advance(.176);assert.equal(emblem.style.opacity,'0');assert.equal(emblem.classes.has('active'),false);
 assert.equal(feed.children.length,2);advance(4);assert.equal(feed.children.length,0);
 personal({name:'三'});ui.reset();ui.tick(true);assert.equal(feed.children.length,0);assert.equal(emblem.style.opacity,'0');
 personal({name:'新一局'});assert.equal(emblem.dataset.points,'1');
});

test('the real hit path marks only direct player conversions, even when gameplay credit is reassigned',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const marked=[],player={x:0,z:0},ctx=vm.createContext({...rules,state:rules.makeState(),player,STANDING_CHEST:1,hitStyles:new Map(),performance:{now:()=>0},kindlingMultiplier:()=>1,burst(){},worldSfx(){},toast(){},PROFESSIONS:['路人'],conversionFeedback:{markPersonal:u=>marked.push(u.id)}});
 vm.runInContext(source.slice(source.indexOf('function applyHit('),source.indexOf('function playerHurt(')),ctx);
 const direct=rules.makeUnit(1,0,0,0),army=rules.makeUnit(2,0,0,0),mixed=rules.makeUnit(3,0,0,0);mixed.playerInfection=true;
 for(const [u,fromArmy]of [[direct,false],[army,true],[mixed,true]]){ctx.unit=u;ctx.army=fromArmy;vm.runInContext('applyHit(unit,unit.threshold,0,army)',ctx);}
 assert.deepEqual(marked,[1]);assert.equal(mixed.fromArmy,false,'gameplay attribution stays unchanged');
});

test('the short success lifetime survives the first character upload and stale paint callbacks cannot revive a reset',()=>{
 const {ui,personal,emblem,advance,paint}=fixture(true);personal({name:'首个巡警'});advance(1.2);assert.equal(emblem.style.opacity,'1');paint();paint();advance(.5);assert.ok(+emblem.style.opacity>0);advance(.176);assert.equal(emblem.style.opacity,'0');personal({name:'旧事件'});ui.reset();paint();advance(.1);assert.equal(emblem.style.opacity,'0');
});

test('conversion lifetime waits for the actor swap, then counts the short visible duration',()=>{
 let ready=false;const {personal,emblem,advance,paint}=fixture(true,()=>ready);personal({name:'等待换装的巡警'});paint();paint();advance(.4);assert.equal(emblem.style.opacity,'1');ready=true;paint();advance(.5);assert.ok(+emblem.style.opacity>0);advance(.176);assert.equal(emblem.style.opacity,'0');
});
