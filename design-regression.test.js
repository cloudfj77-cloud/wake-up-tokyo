import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as r from './rules.js';

test('base growth stops at 15; evolution reaches 50 without extra level-up draws',()=>{
 const s=r.makeState();s.pending=0;r.grantExperience(s,1e12);
 assert.equal(s.level,15);assert.equal(s.pending,14);assert.equal(s.xp,0);
 s.abilities.evolve=3;r.grantExperience(s,1e12);
 assert.equal(s.level,50);assert.equal(s.pending,15); // one evolution milestone at 500 HPassert.equal(s.xpEarned,2e12);
});
test('comic syringe accumulates infection without damage and empowers after charging',()=>{
 const s=r.makeState();s.abilities.launcher=2;const spec=r.launcherSpec(s),u=r.makeUnit(1,0,0,0);
 assert.equal(spec.infection,14);assert.equal(spec.damage,0);
 assert.equal(r.hit(s,u,spec.infection,spec.damage),'hit');assert.equal(u.hp,u.maxHp);
 assert.equal(r.hit(s,u,spec.infection,spec.damage),'converted');assert.equal(u.hp,r.allyTemplate(0).hp);
 s.abilities.launcher=3;assert.equal(r.launcherSpec(s,true).infection,32);
});
test('weight distinguishes ranks and excludes summoned or dead allies',()=>{
 const s=r.makeState(),worker=r.makeUnit(1,0,0,0),elite=r.makeUnit(2,4,0,0);
 worker.kind=elite.kind='ally';worker.converted=elite.converted=true;
 assert.equal(r.difficultyWeight(s,[worker]),124);
 assert.equal(r.difficultyWeight(s,[elite]),136);
 elite.guard=true;assert.equal(r.difficultyWeight(s,[elite]),120);
 worker.dead=true;assert.equal(r.difficultyWeight(s,[worker]),120);
});
test('waves respect deficit and 25% budget, including queued enemies',()=>{
 const s=r.makeState();s.level=10;s.xpEarned=400;
 const first=r.spawnPlan(s,[],()=>.5,null,{includeFodder:false});
 assert.ok(first.waveWeight>0);assert.ok(first.waveWeight<=first.targetWeight*.25);
 const next=r.spawnPlan(s,[],()=>.5,null,{includeFodder:false,queuedJobs:first.jobs});
 assert.equal(next.enemyWeight,first.waveWeight);
 const full=Array.from({length:40},(_,i)=>r.makeUnit(i,3,0,0));
 assert.equal(r.spawnPlan(s,full,()=>0).threatN,0);
});
test('regional stock includes the queue and stage-three refills use basic patrols',()=>{
 const s=r.makeState(),queued=[],units=[];
 for(let i=0;i<12;i++){
  const plan=r.spawnPlan(s,units,()=>0,null,{includeThreat:false,queuedJobs:queued});
  assert.ok(plan.fodderN<=8);queued.push(...plan.jobs);
 }
 assert.equal(queued.length,56);
 for(let region=0;region<4;region++){
  assert.equal(queued.filter(j=>j.region===region&&j.type===0).length,12);
  assert.equal(queued.filter(j=>j.region===region&&j.type===1).length,2);
 }
 s.xpEarned=300;
 const lockdown=r.spawnPlan(s,[],()=>0,null,{includeThreat:false});
 assert.equal(lockdown.civilians.length,0);assert.ok(lockdown.patrol.every(t=>t===1));
 s.aftermath=true;assert.equal(r.spawnPlan(s,[],()=>0).types.length,0);
});
test('Boss pressure uses its own range and weakening restores normal pacing',()=>{
 const s=r.makeState();s.bossSpawned=true;s.rushReinforce=true;
 const boss=r.spawnPlan(s,[],()=>0);assert.equal(boss.interval,2);assert.equal(boss.targetWeight,boss.weight*1.25);
 assert.equal(r.spawnPlan(s,[],()=>1).interval,4);
 s.rushReinforce=false;const normal=r.spawnPlan(s,[],()=>0);
 assert.equal(normal.interval,3);assert.equal(normal.targetWeight,normal.weight);
});
test('full-health pickup stays; a blood pack restores 30% of maximum health',()=>{
 const s=r.makeState();assert.equal(r.collectPickup(s,'health'),null);
 s.maxHp=500;s.hp=100;assert.equal(r.collectPickup(s,'health').amount,150);assert.equal(s.hp,250);
 s.hp=490;assert.equal(r.collectPickup(s,'health').amount,10);assert.equal(s.hp,500);
});
test('factor gives 10% of current level requirement and can trigger a level-up',()=>{
 const s=r.makeState();s.pending=0;s.xp=7.4;
 const item=r.collectPickup(s,'factor');assert.equal(item.amount,.8);
 assert.equal(s.level,2);assert.equal(s.pending,1);assert.equal(s.xpEarned,.8);
 assert.ok(Math.abs(s.xp-.2)<1e-10);
 const fresh=r.makeState();fresh.pending=0;for(let i=0;i<10;i++)r.collectPickup(fresh,'factor');
 assert.equal(fresh.level,2);assert.equal(fresh.xp,0); // Ten 0.8 rewards equal one level and must not leave a float remainder.
});
test('potion refreshes instead of stacking and only gameplay advances its timer',()=>{
 const s=r.makeState(),u=r.makeUnit(1,0,20,20),before=r.meleeSpec(s,'light');
 r.collectPickup(s,'potion');assert.equal(r.meleeSpec(s,'light').damage,before.damage*1.5);
 assert.ok(r.meleeSpec(s,'light').infection>before.infection);assert.ok(r.speed(s)>r.WALK_SPEED);
 r.stepSimulation(s,[u],{x:0,z:0},4,'paused');assert.equal(s.potionTime,10);
 r.stepSimulation(s,[u],{x:0,z:0},4,'playing');assert.equal(s.potionTime,6);
 r.collectPickup(s,'potion');assert.equal(s.potionTime,10);
 r.stepSimulation(s,[u],{x:0,z:0},10,'playing');assert.equal(r.meleeSpec(s,'light').damage,before.damage);
});
test('sprint consumes stamina; exhaustion does not cause alternating sprint frames',()=>{
 const s=r.makeState();s.stamina=1;
 assert.equal(r.stepSprint(s,true,true,.1),true);assert.equal(s.stamina,0);
 assert.equal(r.stepSprint(s,true,true,.1),false);
 assert.equal(r.stepSprint(s,true,true,.1),false);
 r.stepSprint(s,false,false,1);assert.equal(r.stepSprint(s,true,true,.1),true);
 s.abilities.haste=2;s.hp=100;r.hurtMother(s,10,'test',true);assert.equal(s.hp,91);
});
test('civilian path stays fixed when infection rises and reverses at its endpoint',()=>{
 const u=r.makeUnit(1,0,0,0),target=r.civilianTarget(u,[],()=>.5);
 assert.deepEqual(r.civilianTarget(u,[],()=>.99),target);
 u.x=target.x;u.z=target.z;assert.deepEqual(r.civilianTarget(u,[],()=>.99),{x:0,z:0});
 r.resetUnit(u,2,0,3,3);assert.equal(u.route,null);
});
test('real key and wheel handlers preserve weapon controls with Shift jump and Space roll',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),events={},calls=[];
 const state=r.makeState();state.pending=1;state.abilities.guns=1;state.weaponOrder=['pistol','shotgun'];
 const ctx=vm.createContext({isTouchDevice:()=>false,MOBILE_DEVICE:false,...r,performance:{now:()=>0},state,mode:'playing',player:{roll:0},units:[],switchTime:0,squadIds:new Set(),canvas:{addEventListener:(k,fn)=>events[k]=fn},addEventListener:(k,fn)=>events[k]=fn,reloadGun:()=>calls.push('reload'),toggleMap:()=>calls.push('map'),togglePause(){},toggleDebug(){},primary(){},heavy(){},requestJump:()=>calls.push('jump'),requestRoll:()=>calls.push('roll'),weaponSelect:w=>calls.push(w),toast(){}});
 vm.runInContext(source.slice(source.indexOf('const keys={};'),source.indexOf('function toggleMap()')),ctx);
 const key=code=>events.keydown({code,target:{tagName:'CANVAS'},preventDefault(){}});
 key('ShiftLeft');assert.deepEqual(calls,['jump']);calls.length=0;key('KeyR');key('Tab');assert.deepEqual(calls,['reload','map']);
 key('KeyE');assert.equal(calls.length,2);
 events.wheel({deltaY:1,preventDefault(){}});assert.equal(calls.at(-1),0);
 events.wheel({deltaY:-1,preventDefault(){}});assert.equal(calls.at(-1),1);
});

test('Space rolls on the first keydown while moving; Shift jumps, E sprints and keyup never starts an action',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),events={},calls=[];
 const ctx=vm.createContext({isTouchDevice:()=>false,...r,performance:{now:()=>0},state:r.makeState(),mode:'playing',player:{roll:0},
  canvas:{addEventListener:(k,fn)=>events[k]=fn},addEventListener:(k,fn)=>events[k]=fn,
  requestRoll:()=>calls.push('roll'),requestJump:()=>calls.push('jump'),togglePause(){},toggleDebug(){},
  rollBuffered:1,jumpBuffered:1,mouseHeld:true,dragging:true,pointerLock:{release(){}}});
 vm.runInContext(source.slice(source.indexOf('const keys={};'),source.indexOf('function toggleMap()'))+source.match(/function clearInput\(\)\{[^\n]+/)[0],ctx);
 const press=(code,repeat=false,tagName='CANVAS')=>events.keydown({code,repeat,target:{tagName},preventDefault(){}}),release=code=>events.keyup({code});
 press('KeyW');press('Space');assert.deepEqual(calls,['roll']);release('Space');assert.equal(calls.length,1);
 press('Space');assert.deepEqual(calls,['roll','roll']);press('Space',true);assert.equal(calls.length,2);
 press('ShiftLeft');assert.equal(calls.at(-1),'jump');release('ShiftLeft');assert.equal(calls.length,3);
 press('KeyE');assert.equal(vm.runInContext('sprintHeld()',ctx),true);release('KeyE');assert.equal(vm.runInContext('sprintHeld()',ctx),false);
 press('Space',false,'INPUT');assert.equal(calls.length,3);ctx.mode='paused';press('Space');press('ShiftRight');assert.equal(calls.length,3);
 vm.runInContext('clearInput()',ctx);ctx.mode='playing';release('Space');release('ShiftRight');assert.equal(calls.length,3);
});
