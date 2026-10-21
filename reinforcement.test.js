import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as r from './rules.js';
import * as T from 'three';
const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const noop=()=>{};
test('squads are hard bounded, infantry grouped, armor separated, and never catch up in one frame',()=>{
 const q=r.makeSpawnQueue(),jobs=Array.from({length:100},()=>({type:1,role:'army'}));jobs[3]={type:9,role:'army'};
 assert.equal(r.enqueueSquads(q,jobs,{x:10,z:20},()=>.2,80),18);
 assert.equal(r.enqueueSquads(q,jobs,{x:10,z:20},()=>.2,80),0);
 assert.equal(q.jobs[0].squad,q.jobs[1].squad);assert.notEqual(q.jobs[2].squad,q.jobs[3].squad);
 assert.equal(q.jobs[3].squad.size,1);assert.notEqual(q.jobs[3].squad,q.jobs[4].squad);
 const first=r.takeSquadJob(q,100);assert.equal(q.jobs.length,17);assert.equal(first.member,0);
 assert.equal(r.takeSquadJob(q,.01),null);
 r.takeSquadJob(q,.2);assert.ok(q.wait>=.8);assert.equal(q.jobs.length,16);
 r.takeSquadJob(q,100);assert.equal(q.jobs.length,15,'long frames still release only one actor');
 const s=r.makeState();s.xpEarned=200;const plan=r.spawnPlan(s,[],()=>.2,{x:0,z:0},{queuedJobs:q.jobs});assert.ok(plan.enemyWeight>0,'queued squads reserve enemy budget');
});
test('camera visibility requires safe distance in front and remains safe after terrain projection',()=>{
 const player={x:0,z:0},camera={x:0,z:-3},dir={x:0,z:1};
 assert.equal(r.hiddenSpawn({x:0,z:25},player,camera,dir),false);
 assert.equal(r.hiddenSpawn({x:0,z:54},player,camera,dir),false);
 assert.equal(r.hiddenSpawn({x:0,z:62},player,camera,dir),true);
 assert.equal(r.hiddenSpawn({x:0,z:-28},player,camera,dir),true);
 assert.equal(r.hiddenSpawn({x:0,z:-19},player,camera,dir),false);
 let queries=0,created=0;
 const ctx=vm.createContext({...r,units:[],player,ENEMY_VIEW:46,viewScratch:{},camera:{position:camera,getWorldDirection:v=>Object.assign(v,dir)},world:{free:()=>false,nearest:()=>{queries++;return {x:0,z:25};}},separated:()=>false,rememberSpawn:noop,acquireUnitRecord:()=>{created++;},totalReinforcements:0});
 vm.runInContext(section('function placeArmyRusher(','// 行人和巡逻军队'),ctx);
 assert.equal(vm.runInContext('placeArmyRusher(1)',ctx),false);assert.equal(queries,1);assert.equal(created,0);
});
test('failed placements preserve queue budget and retry later rather than looping or popping into view',()=>{
 const q=r.makeSpawnQueue();r.enqueueSquads(q,[{type:1,role:'army'}],{x:0,z:0});let calls=0;
 const ctx=vm.createContext({...r,spawnQueue:q,placeArmyRusher:()=>{calls++;return false;},placeOnStreet:noop});
 vm.runInContext(section('function flushSpawnQueue(','function coneForward('),ctx);
 vm.runInContext('flushSpawnQueue(.016);flushSpawnQueue(.016)',ctx);assert.equal(calls,1);assert.equal(q.jobs.length,1);
 vm.runInContext('flushSpawnQueue(.6)',ctx);assert.equal(calls,2);assert.equal(q.jobs.length,1);
});
test('ingress fights nearby allies, resumes marching during cooldown, and returns to ordinary AI',()=>{
 const enemy=r.makeUnit(1,1,0,0),ally=r.makeUnit(2,1,.8,0);r.convert(r.makeState(),ally);
 Object.assign(enemy,{rush:true,attackCd:0,ingressTime:6,ingressGoal:{x:20,z:0},ingressCull:80});
 let hits=0;
 const ctx=vm.createContext({...r,state:r.makeState(),units:[enemy,ally],player:{x:30,z:0},visuals:new Map(),squadIds:new Set(),boss:{active:false},ALLY_VIEW:22,alerted:true,
  world:{clear:()=>true,waypoint:(u,x,z)=>({x,z}),towers:[],buildings:[]},move:(u,x,z)=>{u.x+=x;u.z+=z;return true;},showHostilePose:noop,enemyFire:()=>hits++,tickPurifier:()=>null,tickShieldCharge:noop,lobBomb:noop,allyFire:noop,toast:noop});
 vm.runInContext(section('const CROWD_CELL=6;','function dropActorVisual('),ctx);
 vm.runInContext('runAI(.1);runAI(.8)',ctx);assert.equal(hits,1,'passing allies are attacked');
 const before=enemy.x;vm.runInContext('runAI(.1)',ctx);assert.ok(enemy.x>before,'cooldown resumes the original march');
 r.stepIngress(enemy,6);assert.equal(r.stepIngress(enemy,.1),null);
 const beforeNormal=enemy.x;vm.runInContext('runAI(.1)',ctx);assert.ok(enemy.x<=beforeNormal,'ordinary combat now holds nearby target (separation may push it back)');
});
test('far ingress troops survive normal cleanup, and recycled or converted units lose ingress state',()=>{
 const u=r.makeUnit(1,1,62,0);Object.assign(u,{ingressTime:6,ingressGoal:{x:0,z:0},ingressCull:80});
 assert.equal(r.shouldCullTroop(u,62),false);assert.equal(r.shouldCullTroop(u,81),true);
 u.x=47;r.stepIngress(u,.1);assert.equal(u.ingressCull,0);assert.equal(r.shouldCullTroop(u,62),true);
 r.resetUnit(u,2,1,0,0);assert.equal(u.ingressGoal,null);assert.equal(u.ingressTime,0);assert.equal(u.ingressCull,0);
 Object.assign(u,{converted:true,ingressTime:6,ingressGoal:{x:20,z:0},ingressCull:80});assert.equal(r.stepIngress(u,.1),null);assert.equal(u.ingressCull,0);
});
test('turning into a crowd creates at most two new models per frame',()=>{
 const units=Array.from({length:72},(_,i)=>({id:i,kind:'guard',x:i/10,z:0})),visuals=new Map();let created=0;
 const ctx=vm.createContext({...r,units,visuals,player:{x:0,z:0},VISUAL_BUDGET:72,actorViewLimit:()=>46,actorInFront:()=>true,dropActorVisual:noop,actorVisual:u=>{visuals.set(u.id,{});created++;}});
 vm.runInContext(section('function syncActorPresence(','function updateVisuals('),ctx);
 vm.runInContext('syncActorPresence()',ctx);assert.equal(created,2);vm.runInContext('syncActorPresence()',ctx);assert.equal(created,4);
});
test('blocked civilian route is repaired once and stationary civilians never search terrain',()=>{
 let queries=0;const u=r.makeUnit(1,0,1,1);Object.assign(u,{stationary:false,route:[{x:1,z:1},{x:0,z:0}],routeEnd:1});
 const ctx=vm.createContext({...r,u,world:{buildings:[],free:(x,z)=>x!==0||z!==0,nearest:()=>{queries++;return {x:5,z:5};}}});
 vm.runInContext(section('function civilianMoveTarget(','function runAI('),ctx);
 for(let i=0;i<100;i++)vm.runInContext('civilianMoveTarget(u)',ctx);assert.equal(queries,1);
 u.stationary=true;for(let i=0;i<100;i++)vm.runInContext('civilianMoveTarget(u)',ctx);assert.equal(queries,1);
});
test('shield charge is limited to 3.2 meters with a shorter activation range',()=>{
 assert.equal(r.ENEMIES[3].charge.distance,3.2);assert.equal(r.ENEMIES[3].range,4.3);
 const u=r.makeUnit(1,3,0,0);r.beginShieldCharge(u,r.ENEMIES[3],0);
 r.stepShieldCharge(u,r.ENEMIES[3],.4);r.stepShieldCharge(u,r.ENEMIES[3],1);
 assert.ok(u.chargeDist<=3.2);assert.equal(u.chargePhase,'');
});

test('active hostile ceiling stops new actors before any terrain or model work',()=>{
 const units=Array.from({length:96},(_,i)=>r.makeUnit(i,1,0,0));
 const ctx=vm.createContext({...r,units});vm.runInContext(section('function placeArmyRusher(','// 行人和巡逻军队'),ctx);
 assert.equal(vm.runInContext('placeArmyRusher(1)',ctx),false);assert.equal(units.length,96);
});

test('marching bombers resume between throws while normal bomber behavior remains unchanged',()=>{
 const u={grenadeCd:.5},ctx=vm.createContext({u,world:{clear:()=>true},victim:{x:0,z:0},spec:{range:16}});
 vm.runInContext(section('function lobBomb(','function detonateGrenade('),ctx);
 assert.equal(vm.runInContext('lobBomb(u,spec,victim,8,false,true)',ctx),'idle');
 assert.equal(vm.runInContext('lobBomb(u,spec,victim,8,false)',ctx),'windup');
});


test('reinforcement candidates vary continuously in direction and distance around the current player',()=>{
 let seed=713;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const player={x:10,z:20},dir={x:0,z:1};
 for(const front of [true,false]){
  const points=Array.from({length:100},()=>r.reinforcementCandidate(player,dir,front,random));
  assert.equal(new Set(points.map(p=>`${p.x.toFixed(4)},${p.z.toFixed(4)}`)).size,100);
  const distances=points.map(p=>r.distance(player,p));assert.ok(distances.every(d=>d>=(front?56:22)&&d<=(front?74:42)));
  assert.ok(Math.max(...distances)-Math.min(...distances)>15);assert.ok(new Set(points.map(p=>p.angle.toFixed(3))).size>90);
  assert.ok(points.every(p=>r.hiddenSpawn(p,player,player,dir)),'randomness must preserve hidden arrival areas');
 }
});
test('unchanged player and camera still produce different accepted squad spawn positions',()=>{
 let seed=97;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const player={x:0,z:0},units=[],ctx=vm.createContext({...r,MOBILE_DEVICE:false,VISUAL_BUDGET:72,Math:Object.assign(Object.create(Math),{random}),units,player,ENEMY_VIEW:46,viewScratch:{},camera:{position:player,getWorldDirection:v=>Object.assign(v,{x:0,z:1})},world:{free:()=>true,nearest:()=>{throw Error('unexpected projection');}},separated:()=>false,rememberSpawn:noop,acquireUnitRecord:(type,x,z)=>r.makeUnit(units.length,type,x,z),totalReinforcements:0});
 vm.runInContext(section('function placeArmyRusher(','// 行人和巡逻军队'),ctx);
 for(let i=0;i<20;i++)assert.equal(vm.runInContext('placeArmyRusher(1,{squad:{front:true,goal:{...player},anchor:null}})',ctx),true);
 assert.equal(new Set(units.map(u=>`${u.x.toFixed(4)},${u.z.toFixed(4)}`)).size,20);
 assert.ok(new Set(units.map(u=>r.distance(player,u).toFixed(2))).size>15);
});


test('new runs have different initial patrol positions and no fixed fallback coordinates',()=>{
 let seed=23;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};let projections=0;
 const ctx=vm.createContext({...r,MOBILE_DEVICE:false,VISUAL_BUDGET:72,Math:Object.assign(Object.create(Math),{random}),units:[],player:{x:0,z:0},world:{free:()=>false,nearest:(x,z)=>{projections++;return {x,z};}},actorVisual:noop,warmCharacterPool:noop,assets:{}});
 vm.runInContext(section('function initUnits(){','// 卡住多久'),ctx);
 vm.runInContext('initUnits()',ctx);const first=ctx.units.filter(u=>u.type===1).map(u=>[u.x,u.z]);
 vm.runInContext('initUnits()',ctx);const second=ctx.units.filter(u=>u.type===1).map(u=>[u.x,u.z]);
 assert.equal(first.length,8);assert.notDeepEqual(first,second);assert.equal(projections,112);
 assert.ok(second.every(([x,z])=>!([34,-34].includes(x)&&[30,-34].includes(z))));
});


test('actor visibility uses the true camera frustum including close enemies behind the camera',()=>{
 const camera=new T.PerspectiveCamera(64,1,.1,180);camera.position.set(0,1,0);camera.lookAt(0,1,1);camera.updateMatrixWorld();
 const actorFrustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const ctx=vm.createContext({...r,actorFrustum,actorSphere:new T.Sphere(),world:{heightAt:()=>0},PLAYER_HEIGHT:1.2});
 vm.runInContext(section('function actorInFront(','async function warmBattleVisuals('),ctx);
 assert.equal(vm.runInContext('actorInFront({type:1,x:0,z:12},12)',ctx),true);
 assert.equal(vm.runInContext('actorInFront({type:1,x:12,z:0},12)',ctx),false);
 assert.equal(vm.runInContext('actorInFront({type:1,x:0,z:-3},3)',ctx),false);
 // A character whose limbs overlap the screen edge must remain visible.
 assert.equal(vm.runInContext('actorInFront({type:1,x:6.7,z:10},12)',ctx),true);
});


test('crowd queries match occupied-cell neighborhoods and avoid allocating empty-grid results',()=>{
 const ctx=vm.createContext({});vm.runInContext(section('const CROWD_CELL=6;','function civilianMoveTarget('),ctx);
 vm.runInContext('var units=Array.from({length:96},(_,i)=>({id:i,x:(i%12-6)*3,z:(Math.floor(i/12)-4)*3}));var grid=crowdBuckets(units);',ctx);
 const actual=Array.from(vm.runInContext('crowdNear(grid,0,0,7).map(u=>u.id).sort((a,b)=>a-b)',ctx));
 const expected=Array.from(ctx.units).filter(u=>Math.abs((u.x/6)|0)<=2&&Math.abs((u.z/6)|0)<=2).map(u=>u.id).sort((a,b)=>a-b);
 assert.deepEqual(actual,expected);
 assert.equal(vm.runInContext('crowdNear(new Map(),0,0,100)===crowdNear(new Map(),0,0,100)',ctx),true);
});


test('dense crowd separation uses one bounded displacement per actor instead of per neighbor',()=>{
 const units=Array.from({length:32},(_,i)=>{const u=r.makeUnit(i,1,.02*i,0);u.wander=1;u.tx=u.x;u.tz=u.z;return u;}),moves=[];
 const ctx=vm.createContext({...r,units,state:r.makeState(),player:{x:20,z:0},visuals:new Map(),ALLY_VIEW:22,alerted:false,squadIds:new Set(),boss:{active:false},world:{buildings:[],towers:[]},move:(u,x,z)=>{moves.push({id:u.id,d:Math.hypot(x,z)});return true;}});
 vm.runInContext(section('const CROWD_CELL=6;','function dropActorVisual('),ctx);vm.runInContext('runAI(.016)',ctx);
 assert.ok(moves.length<=32);assert.ok(moves.every(m=>m.d<=.016*4.5+1e-9));
});


test('weapon line checks happen only when starting or completing an attack, never on every cooldown frame',()=>{
 const u=r.makeUnit(1,2,0,5);u.rush=true;u.attackCd=1;let checks=0;
 const ctx=vm.createContext({...r,units:[u],state:r.makeState(),player:{x:0,z:0},visuals:new Map(),ALLY_VIEW:22,alerted:true,squadIds:new Set(),boss:{active:false},world:{clear:()=>{checks++;return true;},towers:[],buildings:[]},tickPurifier:()=>null,showHostilePose:noop,enemyFire:noop});
 vm.runInContext(section('const CROWD_CELL=6;','function dropActorVisual('),ctx);
 vm.runInContext('runAI(.016)',ctx);assert.equal(checks,0);
 u.attackCd=0;vm.runInContext('runAI(.016)',ctx);assert.equal(checks,1);assert.equal(u.aiming,true);
 vm.runInContext('runAI(.1)',ctx);assert.equal(checks,1);
 vm.runInContext('runAI(.4)',ctx);assert.equal(checks,2);assert.equal(u.aiming,false);
});


test('blocked ready attacks back off repeated rays briefly, then recheck and navigate toward the target',()=>{
 const u=r.makeUnit(1,2,0,5);u.rush=true;u.attackCd=0;let checks=0,moves=0,clear=false;
 const ctx=vm.createContext({...r,units:[u],state:r.makeState(),player:{x:0,z:0},visuals:new Map(),ALLY_VIEW:22,alerted:true,squadIds:new Set(),boss:{active:false},world:{clear:()=>{checks++;return clear;},waypoint:(u,x,z)=>({x,z}),towers:[],buildings:[]},move:()=>{moves++;return true;},tickPurifier:()=>null,showHostilePose:noop,enemyFire:noop});
 vm.runInContext(section('const CROWD_CELL=6;','function dropActorVisual('),ctx);
 vm.runInContext('runAI(.016)',ctx);assert.equal(checks,1);assert.equal(u.sightBlocked,true);assert.ok(moves>0);
 for(let i=0;i<4;i++)vm.runInContext('runAI(.016)',ctx);assert.equal(checks,1);
 clear=true;vm.runInContext('runAI(.1)',ctx);assert.equal(checks,2);assert.equal(u.aiming,true);
 clear=false;vm.runInContext('runAI(.5)',ctx);assert.equal(checks,3,'hit must freshly check a wall appearing during windup');assert.equal(u.aiming,false);
});
