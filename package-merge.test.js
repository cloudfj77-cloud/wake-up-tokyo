import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as r from './rules.js';
import {selectedMap} from './maps.js';
import {createComicAbilityFX,resolveComicAim,launchComicBallistic,stepComicBallistic,stepComicNeedle,getComicFleshProgress} from './comic-fx.js';
const ground={heightAt:()=>0,cameraBlocked:()=>false};
test('map selection and saves stay isolated',()=>{
 assert.equal(selectedMap('?map=bogus').id,'riverside');assert.equal(selectedMap('?map=tidewater').id,'tidewater');
 assert.notEqual(selectedMap().saveKey,selectedMap('?map=tidewater').saveKey);
});
test('needle follows camera ray vertically and hits a target on the ray',()=>{
 const camera=new T.PerspectiveCamera(64,1,.1,100);camera.position.set(0,1,0);camera.lookAt(0,2,-10);
 const aim=resolveComicAim(T,camera,new T.Vector3(0,1,-.5),{world:ground,range:20,units:[]});
 assert.ok(aim.target.y>1);assert.ok(aim.target.z<-.5);
 const b={x:0,y:1,z:0,vx:0,vy:0,vz:-40,life:1,pierce:1};let hits=[];
 const units=[{id:1,x:0,z:-1},{id:2,x:0,z:-2},{id:3,x:0,z:-3}];
 stepComicNeedle(T,b,.1,ground,{units,bodyHeight:2,onUnit:u=>hits.push(u.id)});
 assert.deepEqual(hits,[1,2]);assert.equal(b.life,0);
});
test('terrain stops needle before actors behind the wall',()=>{
 const b={x:0,y:1,z:0,vx:0,vy:0,vz:-40,life:1};let count=0;
 stepComicNeedle(T,b,.1,{...ground,cameraBlocked:(x,y,z)=>z<-.6},{units:[{id:1,x:0,z:-2}],bodyHeight:2,onUnit:()=>count++});
 assert.equal(count,0);assert.equal(b.life,0);
});
test('empowered projectile arcs to aim and impacts only once',()=>{
 const origin=new T.Vector3(0,1,0),target=new T.Vector3(0,.24,8);
 const b={x:0,y:1,z:0,life:4,...launchComicBallistic(T,origin,target)};let impacts=0;
 for(let i=0;i<30;i++)stepComicBallistic(T,b,.04,ground,()=>impacts++);
 assert.equal(impacts,1);assert.equal(b.life,0);assert.ok(Math.abs(b.z-8)<.3);
});
test('mist drops pause, land after flight, and do not double mother aura',()=>{
 const s=r.makeState();s.abilities.air=3;
 r.stepSimulation(s,[],{x:0,z:0},.5,'playing');assert.equal(s.airDrops.length,1);
 const drop=s.airDrops[0];r.stepSimulation(s,[],{x:0,z:0},2,'map');assert.equal(drop.remaining,.65);
 r.stepSimulation(s,[],{x:0,z:0},.65,'playing');assert.ok(s.airClouds.length>0);
 const u=r.makeUnit(1,7,0,0);s.airClouds=[{x:0,z:0,time:3}];r.tickInfection(s,[u],{x:0,z:0},.5);assert.equal(u.infection,6);
 const distant=r.makeUnit(2,7,20,0);s.airClouds=[{x:20,z:0,time:3},{x:20,z:0,time:3}];r.tickInfection(s,[distant],{x:0,z:0},.5);assert.equal(distant.infection,4);
});
test('deep parasite triggers once and preserves player attribution',()=>{
 const s=r.makeState();s.abilities.dot=3;const u=r.makeUnit(1,1,0,0);u.infection=20;u.tagged='player';
 r.tickInfection(s,[u],{x:30,z:30},.1);assert.equal(u.parasite,true);assert.ok(u.root>0);assert.equal(u.slow,true);
 r.tickInfection(s,[u],{x:30,z:30},2.1);assert.equal(u.root,0);
 r.tickInfection(s,[u],{x:30,z:30},.1);assert.equal(u.root,0);
});
test('ten personal completions release tide; army completions do not',()=>{
 const s=r.makeState();s.abilities.frenzy=3;
 for(let i=0;i<9;i++)r.reward(s,r.makeUnit(i,0,0,0),true);
 r.reward(s,{...r.makeUnit(10,0,0,0),fromArmy:true},true);
 assert.equal(getComicFleshProgress(s).current,9);
 r.reward(s,r.makeUnit(11,0,0,0),true);assert.equal(getComicFleshProgress(s).current,10);
 const enemy=r.makeUnit(20,7,2,0);const ids=r.releaseFleshTide(s,[enemy],{x:0,z:0});
 assert.deepEqual(ids,[20]);assert.ok(enemy.x>2);assert.ok(enemy.hp<enemy.maxHp);assert.equal(getComicFleshProgress(s).current,0);
});
test('evolution heals, grants milestone cards once, and buffs conversions temporarily',()=>{
 const s=r.makeState();s.abilities.evolve=3;s.pending=0;s.hp=10;
 r.grantExperience(s,r.xpNeedFor(1));assert.ok(s.hp>30);
 s.level=40;r.refreshStats(s);assert.equal(s.pending,2);r.refreshStats(s);assert.equal(s.pending,2);
 const u=r.makeUnit(1,0,0,0);r.convert(s,u);assert.equal(u.surge,5);
 r.stepSimulation(s,[u],{x:0,z:0},1,'playing');assert.equal(u.surge,4);
});
test('comic effects pool and dispose geometry with bounded active groups',()=>{
 const scene=new T.Scene(),fx=createComicAbilityFX(T,scene,{quality:'low'});
 for(let i=0;i<200;i++)fx.burst(0,1,0,0xb85cff,3,1);
 assert.ok(fx.diagnostics().active<=fx.diagnostics().limit);
 for(let i=0;i<100;i++)fx.update(.04);assert.equal(fx.diagnostics().active,0);
 fx.dispose();assert.equal(fx.diagnostics().disposed,true);assert.equal(scene.children.length,0);
});

test('all eight ability names and all 24 descriptions match the supplied comic package',async()=>{
 const {readFile}=await import('node:fs/promises');
 const canonical=JSON.parse(await readFile(new URL('./fixtures/comic-package-abilities.json',import.meta.url),'utf8'));
 assert.deepEqual(r.ABILITIES,canonical);
 assert.equal(r.ABILITIES.length,8);assert.equal(r.ABILITIES.flatMap(a=>a.descriptions).length,24);
 for(const level of [0,1,2]){
  const s=r.makeState();for(const a of r.ABILITIES)s.abilities[a.id]=level;
  for(let i=0;i<20;i++)assert.ok(r.choices(s).every(a=>a.id!=='guns'));
 }
 const s=r.makeState();assert.equal(r.upgrade(s,'guns'),false);assert.equal(s.pending,1);
});
test('normal syringe never damages; empowered shot uses the comic package values',()=>{
 const s=r.makeState();
 for(const [lv,infection,pierce] of [[1,8,0],[2,14,2],[3,14,2]]){
  s.abilities.launcher=lv;const spec=r.launcherSpec(s);assert.equal(spec.infection,infection);assert.equal(spec.damage,0);assert.equal(spec.pierce,pierce);
 }
 const powered=r.launcherSpec(s,true);assert.equal(powered.infection,32);assert.equal(powered.damage,12);
});
test('haste burst is triggered by personal kills, not conversions or army kills',()=>{
 const s=r.makeState();s.abilities.haste=2;
 r.reward(s,r.makeUnit(1,0,0,0),true);assert.equal(s.burstTime,0);
 r.reward(s,{...r.makeUnit(2,0,0,0),fromArmy:true},false);assert.equal(s.burstTime,0);
 r.reward(s,r.makeUnit(3,0,0,0),false);assert.equal(s.burstTime,3);
});
test('command uses rank 2/3/4 mixed rosters and doubles top-tier guard HP and attack',()=>{
 const s=r.makeState();
 for(const level of [1,2,3]){
  s.abilities.command=level;const plan=r.guardWanted(s);
  assert.equal(plan.types.length,[0,2,5,10][level]);
  for(const type of plan.types)assert.equal(r.ENEMIES[type].level,level+1);
  assert.equal(plan.hp,level===3?2:1);assert.equal(plan.atk,level===3?2:1);
  const guard=r.makeUnit(1,plan.types[0],0,0);guard.guard=true;guard.kind='ally';guard.hp=1;
  r.damageAlly(guard,100,s);assert.equal(guard.guardCd,[0,30,25,20][level]);
 }
});
test('actual guard spawning and promotions honor the mixed roster and stat multipliers',async()=>{
 const {readFile}=await import('node:fs/promises'),{default:vm}=await import('node:vm');
 const source=await readFile(new URL('./main.js',import.meta.url),'utf8');
 const snippet=source.slice(source.indexOf('function spawnGuard('),source.indexOf('// 市民散在全城'));
 const state=r.makeState();state.abilities.command=1;
 const ctx=vm.createContext({...r,state,units:[],unitPool:[],nextActorId:800,player:{x:0,z:0},world:{nearest:(x,z)=>({x,z})},actorVisual:()=>{},squadIds:new Set(),visuals:new Map(),toast:()=>{},frameDelta:0});
 vm.runInContext(snippet,ctx);vm.runInContext('ensureGuards()',ctx);
 assert.equal(ctx.units.length,2);assert.equal(ctx.units[0].maxHp,r.allyTemplate(1).hp);
 state.abilities.command=2;vm.runInContext('ensureGuards()',ctx);assert.equal(ctx.units.length,5);
 assert.deepEqual(Array.from(ctx.units,u=>u.type),r.guardWanted(state).types);
 state.abilities.command=3;vm.runInContext('ensureGuards()',ctx);assert.equal(ctx.units.length,10);
 for(const u of ctx.units){const tpl=r.allyTemplate(u.type);assert.equal(u.maxHp,Math.ceil(tpl.hp*2));assert.equal(u.atk,Math.ceil(tpl.atk*2));}
 ctx.units[0].dead=true;ctx.units[0].hp=0;ctx.units[0].guardCd=0;ctx.frameDelta=.04;
 vm.runInContext('ensureGuards()',ctx);assert.equal(ctx.units.length,10);assert.equal(ctx.units[0].hp,ctx.units[0].maxHp);
});
