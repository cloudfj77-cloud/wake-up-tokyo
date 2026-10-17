import test from 'node:test';
import assert from 'node:assert/strict';
import {combatDelta,combatAmount,combatPopupPosition,combatFeedbackScale} from './combat-ui.js';
import {makeState,makeUnit,hit,damageAlly,hurtMother} from './rules.js';
const snapshot=u=>({...u});
test('feedback reports actual mitigated HP loss and applied pollution',()=>{
 const s=makeState(),u=makeUnit(1,3,0,0),before=snapshot(u);
 hit(s,u,3,20,true);
 assert.deepEqual(combatDelta(before,u),[{kind:'damage',amount:10},{kind:'infection',amount:3}]);
});
test('conversion never reads restored ally HP as damage or negative pollution',()=>{
 const s=makeState(),u=makeUnit(1,0,0,0);u.hp=1;const before=snapshot(u);
 hit(s,u,u.threshold,50);
 assert.deepEqual(combatDelta(before,u),[{kind:'awaken',amount:0}]);
});
test('mother and ally damage use the resolved rules; healing produces no damage tag',()=>{
 const s=makeState();s.abilities.tough=3;const before=snapshot(s);hurtMother(s,20,'test');
 assert.deepEqual(combatDelta(before,s),[{kind:'damage',amount:before.hp-s.hp}]);
 const u=makeUnit(1,0,0,0);u.kind='ally';u.converted=true;const allyBefore=snapshot(u);damageAlly(u,10,s,{x:0,z:0});
 assert.deepEqual(combatDelta(allyBefore,u),[{kind:'damage',amount:allyBefore.hp-u.hp}]);
 assert.deepEqual(combatDelta({hp:30},{hp:40}),[]);
});
test('shield-only damage, death, DOT and newly spawned units remain distinct',()=>{
 assert.deepEqual(combatDelta({hp:100,shieldHp:20},{hp:100,shieldHp:4}),[{kind:'shield',amount:16}]);
 assert.deepEqual(combatDelta({hp:4},{hp:0,dead:true}),[{kind:'damage',amount:4}]);
 assert.deepEqual(combatDelta({hp:100,infection:2},{hp:100,infection:2.5}),[{kind:'infection',amount:.5}]);
 assert.deepEqual(combatDelta(undefined,{hp:50}),[]);
 assert.deepEqual(combatDelta({hp:0,dead:true},{hp:0,dead:true}),[]);
});

test('fractional pollution is displayed without becoming a full point',()=>{assert.equal(combatAmount(.5),'0.5');assert.equal(combatAmount(14),'14');});

// 小型 DOM 替身只模拟反馈所需的节点操作，验证连射合并、数量上限与暂停清理。
import {createCombatUI} from './combat-ui.js';
function feedbackFixture(onImpact=()=>{},project=()=>({x:100,y:100}),tone){
 class Node {
  constructor(){this.children=[];this.style={setProperty(key,value){this[key]=value;}};this.classList={add(){},remove(){},toggle(){}};this.offsetWidth=1;}
  setAttribute(){} append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
  querySelector(){return this.children[1];}
 }
 const hud=new Node(),panel=new Node(),ids=new Map([['hud',hud],['hpTrail',new Node()],['playerHit',new Node()]]);
 const doc={createElement:()=>new Node(),getElementById:id=>ids.get(id),querySelector:()=>panel};
 return {ui:createCombatUI(doc,project,onImpact,tone),hud};
}
test('suppressed continuous-infection impacts still show every pollution increment and preserve later direct hits',()=>{
 let direct=false;const {ui,hud}=feedbackFixture(()=>direct?'heavy':false),host=hud.children[0],s=makeState(),p={x:0,z:0},b={active:false},u={id:1,hp:100,infection:0};
 ui.baseline([u],s,p,b);
 for(let i=0;i<10;i++){u.infection+=.2;ui.observe([u],s,p,b);ui.tick(.03,true,s);}
 assert.equal(host.children.filter(n=>n.className.startsWith('combatImpact')).length,0);
 assert.equal(host.children.find(n=>n.className.startsWith('combatPop')).children[1].textContent,'+2');
 direct=true;u.infection+=8;ui.observe([u],s,p,b);ui.tick(.01,true,s);
 assert.ok(host.children.some(n=>n.className.includes('pollutionImpact heavy')));
 ui.tick(.3,true,s);
 direct=true;u.hp-=10;ui.observe([u],s,p,b);ui.tick(.01,true,s);
 assert.ok(host.children.some(n=>n.className.includes('damageImpact heavy')));
});
test('rapid shots merge without overlapping, feedback is bounded and pause clears it',()=>{
 const {ui,hud}=feedbackFixture(),host=hud.children[0];const s={hp:100,maxHp:100},p={x:0,z:0},b={active:false};
 const u={id:1,hp:100,infection:0};
 ui.baseline([u],s,p,b);u.hp-=10;ui.observe([u],s,p,b);ui.tick(.1,true,s);
 assert.equal(host.children.filter(n=>n.className.startsWith('combatPop')).length,1);
 ui.baseline([u],s,p,b);u.hp-=10;ui.observe([u],s,p,b);ui.tick(.1,true,s);
 assert.equal(host.children.filter(n=>n.className.startsWith('combatPop')).length,1);assert.equal(host.children.find(n=>n.className.startsWith('combatPop')).children[1].textContent,'−20');
 const crowd=Array.from({length:45},(_,i)=>({id:i+10,hp:100}));
 ui.baseline(crowd,s,p,b);crowd.forEach(a=>a.hp=90);ui.observe(crowd,s,p,b);ui.tick(.1,true,s);
 assert.equal(host.children.filter(n=>n.className.startsWith('combatPop')).length,32);
 ui.tick(.1,false,s);assert.equal(host.children.length,0);
});

// 命中发生在输入事件与下一帧之间，这是此前徒手单次攻击漏反馈的路径。
test('frame baseline preserves a single input-event strike and never reports it twice',()=>{
 const impacts=[];const {ui,hud}=feedbackFixture((...args)=>impacts.push(args)),s=makeState(),p={x:0,z:0},b={active:false},u=makeUnit(1,5,0,1);
 ui.baseline([u],s,p,b);hit(s,u,8,16);ui.baseline([u],s,p,b);ui.observe([u],s,p,b);ui.observe([u],s,p,b);ui.tick(.3,true,s);
 const popups=hud.children[0].children.filter(n=>n.className.startsWith('combatPop'));
 assert.equal(popups.length,2);assert.equal(impacts.length,1);
 assert.deepEqual(popups.map(n=>n.children[1].textContent),['−16','+8']);
});
test('persistent pollution throttles impact flashes while preserving all increments',()=>{
 let flashes=0;const {ui,hud}=feedbackFixture(()=>flashes++),s=makeState(),p={x:0,z:0},b={active:false},u=makeUnit(1,5,0,1);
 ui.baseline([u],s,p,b);
 for(let i=0;i<20;i++){u.infection+=.2;ui.baseline([u],s,p,b);ui.observe([u],s,p,b);ui.tick(.02,true,s);}
 assert.equal(flashes,2);assert.ok(hud.children[0].children.filter(n=>n.className.startsWith('combatImpact')).length<=1);
});

test('damage numbers stay beside the body and switch sides at screen edges',()=>{
 assert.equal(combatPopupPosition({x:300,y:200,sideOffset:100},'damage',1280).x,200);
 assert.equal(combatPopupPosition({x:300,y:200,sideOffset:100},'infection',1280).x,400);
 assert.equal(combatPopupPosition({x:50,y:200},'damage',1280).x,114);
 assert.equal(combatPopupPosition({x:1230,y:200},'infection',1280).x,1166);
});

test('the entire feedback badge scales with its value and stops growing at the cap',()=>{
 const values=[1,5,10,20,50,100,200],scales=values.map(v=>combatFeedbackScale(v));
 assert.ok(scales.every((v,i)=>i===0||v>=scales[i-1]));
 assert.ok(scales[0]<.65);assert.ok(scales[3]<.85);assert.equal(combatFeedbackScale(1e9),1.24);
 const {ui,hud}=feedbackFixture(),s=makeState(),p={x:0,z:0},b={active:false},u={id:1,hp:100};
 ui.baseline([u],s,p,b);u.hp-=10;ui.observe([u],s,p,b);ui.tick(.1,true,s);
 const first=hud.children[0].children.find(n=>n.className.startsWith('combatPop'));
 assert.equal(first.style['--combat-scale'],combatFeedbackScale(10));
 u.hp-=10;ui.observe([u],s,p,b);ui.tick(.1,true,s);
 assert.equal(first.style['--combat-scale'],combatFeedbackScale(20));
});

test('occluded attacks create no floating UI, and existing UI hides when a wall intervenes',()=>{
 let visible=false,impacts=0;const {ui,hud}=feedbackFixture(()=>impacts++,()=>visible?{x:100,y:100}:null),s=makeState(),p={},b={active:false},u={id:1,hp:100};
 ui.baseline([u],s,p,b);u.hp-=10;ui.observe([u],s,p,b);ui.tick(.1,true,s);
 assert.equal(hud.children[0].children.length,0);assert.equal(impacts,0);
 visible=true;u.hp-=10;ui.observe([u],s,p,b);ui.tick(.1,true,s);
 assert.ok(hud.children[0].children.length>0);
 visible=false;ui.tick(.02,true,s);assert.ok(hud.children[0].children.every(n=>n.hidden));
});
test('ally attacks and ally injuries use smaller, quieter, bounded feedback',()=>{
 const {ui,hud}=feedbackFixture(()=>{},()=>({x:100,y:100}),()=>true),s=makeState(),p={},b={active:false};
 const units=Array.from({length:12},(_,id)=>({id,hp:100,converted:id%2===0}));
 ui.baseline(units,s,p,b);units.forEach(u=>u.hp-=10);ui.observe(units,s,p,b);ui.tick(.1,true,s);
 const pops=hud.children[0].children.filter(n=>n.className.startsWith('combatPop'));
 assert.equal(pops.length,8);assert.ok(pops.every(n=>n.className.includes('subdued')));
 assert.ok(pops.every(n=>Number(n.style['--combat-scale'])<combatFeedbackScale(10)));
 assert.ok(pops.every(n=>Number(n.style.opacity)<=.38));
});

test('infection-only hits appear on the first frame instead of waiting for aggregation',()=>{
 const {ui,hud}=feedbackFixture(),s=makeState(),p={},b={active:false},u=makeUnit(1,5,0,1);
 ui.baseline([u],s,p,b);hit(s,u,14,0);ui.observe([u],s,p,b);ui.tick(.016,true,s);
 const pops=()=>hud.children[0].children.filter(n=>n.className.startsWith('combatPop'));
 assert.equal(pops().length,1);assert.equal(pops()[0].children[1].textContent,'+14');
 const first=pops()[0];
 for(let i=0;i<10;i++){u.infection+=.2;ui.observe([u],s,p,b);ui.tick(.02,true,s);}
 assert.equal(pops().length,1);assert.equal(pops()[0],first);assert.equal(first.children[1].textContent,'+16');
});
test('damage and infection from the same strike show together without a pre-display delay',()=>{
 const {ui,hud}=feedbackFixture(),s=makeState(),p={},b={active:false},u=makeUnit(1,5,0,1);
 ui.baseline([u],s,p,b);hit(s,u,10,20);ui.observe([u],s,p,b);ui.tick(.016,true,s);
 const pops=hud.children[0].children.filter(n=>n.className.startsWith('combatPop'));
 assert.deepEqual(pops.map(n=>n.children[1].textContent),['−20','+10']);
});
