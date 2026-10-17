import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as rules from './rules.js';
import * as T from 'three';
import {createBoss,animateBoss,canBossBombTarget} from './boss.js';
const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
function section(start,end){const from=source.indexOf(start);assert.ok(from>=0);const to=source.indexOf(end,from);assert.ok(to>from);return source.slice(from,to);}
const noop=()=>{};
test('Boss charge and launch use each map targeting rule, including cancellation out of range',()=>{
 for(const [map,x,expected] of [['tidewater',0,true],['riverside',0,false],['riverside',20,true],['tidewater',100,false]]){
  const scene=new T.Scene(),boss=createBoss(scene),elements=new Map();
  Object.assign(boss,{active:true,x:14.25,z:23.75,attack:0});
  const world={heightAt:()=>0,free:()=>false,breakAt:noop};
  if(map==='tidewater')world.bossCanTarget=(b,p)=>rules.distance(b,p)<=28;
  const ctx=vm.createContext({...rules,T,boss,world,scene,animateBoss,canBossBombTarget,
   player:{x,z:24},state:rules.makeState(),tracers:[],missionTimer:0,bossMissionTimer:0,
   BOSS_ORB_WINDUP:.1,createBossTargetMarker:()=>new T.Group(),disposeBossMarker:noop,
   pulseBossMarker:noop,showBossArrival:noop,showBossMission:noop,burst:noop,music:{effect:noop},
   document:{querySelector:()=>({style:{}})},$:id=>{if(!elements.has(id))elements.set(id,{style:{}});return elements.get(id);}});
  vm.runInContext(section('function clearPendingOrb(','function releaseBossExplosion(')+section('function updateBoss(','function updateAlertEffect('),ctx);
  vm.runInContext('updateBoss(.016)',ctx);
  assert.equal(!!boss.pendingOrb,expected,`${map} charge at x=${x}`);
  vm.runInContext('updateBoss(.1)',ctx);
  assert.equal(ctx.tracers.length,expected?1:0,`${map} launch at x=${x}`);
  if(expected){
   boss.attack=0;vm.runInContext('updateBoss(.016)',ctx);assert.ok(boss.pendingOrb);
   ctx.player.x=100;vm.runInContext('updateBoss(.016)',ctx);
   assert.equal(boss.pendingOrb,null);assert.equal(ctx.tracers.length,1);
  }
 }
});
function projectileContext(){
 const state=rules.makeState();state.abilities.launcher=3;
 const ctx=vm.createContext({...rules,state,particles:[],waves:[],tracers:[],units:[],boss:{active:false},world:{solid:()=>false},scene:{remove:noop},burst:noop,applyHit:noop,pulseAim:noop,updateChargeRing:noop,music:{effect:noop},STANDING_CHEST:1});
 vm.runInContext(section('function onPlayerProjectileHit(','function createPowerOrb(')+section('function updateEffects(','function updateCamera('),ctx);
 return ctx;
}
function bullet(shot){return {chargeShot:shot,friendly:true,x:0,z:0,vx:0,vz:0,life:1,damage:10,infection:2,m:{position:{set:noop}}};}
test('actual projectile collision charges on a hit, not a miss or an allied shot',()=>{
 const ctx=projectileContext();ctx.units=[{id:1,x:3,z:0,kind:'enemy'}];
 const shot={eligible:true};ctx.tracers=[bullet(shot)];
 vm.runInContext('updateEffects(.016)',ctx);assert.equal(ctx.state.powerCharge,0);
 ctx.units[0].x=.2;
 vm.runInContext('updateEffects(.016)',ctx);assert.equal(ctx.state.powerCharge,1);
 ctx.tracers=[bullet(undefined)];vm.runInContext('updateEffects(.016)',ctx);
 assert.equal(ctx.state.powerCharge,1);
 ctx.tracers=Array.from({length:6},()=>bullet({eligible:true}));
 const shotgun={eligible:true};ctx.tracers.forEach(b=>b.chargeShot=shotgun);
 vm.runInContext('updateEffects(.016)',ctx);assert.equal(ctx.state.powerCharge,2);
});
test('Boss collision contributes only one ring for a piercing projectile',()=>{
 const ctx=projectileContext();ctx.boss={active:true,dead:false,x:0,z:0};ctx.hitBoss=noop;
 const b=bullet({eligible:true});b.pierce=2;b.hitIds=new Set();ctx.tracers=[b];
 vm.runInContext('updateEffects(.016);updateEffects(.016)',ctx);
 assert.equal(ctx.state.powerCharge,1);assert.equal(b.pierce,1);
});
test('an empty magazine preserves full charge; a loaded gun spends it on one power projectile',()=>{
 const state=rules.makeState();state.abilities.launcher=3;state.powerCharge=3;
 const emitted=[];
 const ctx=vm.createContext({...rules,state,gun:rules.GUNS[0],attackCd:0,playerVisual:{},weaponPivot:{position:{y:0}},reloadGun:noop,playCharacterAttack:noop,emitLauncherShot:(...args)=>emitted.push(args)});
 vm.runInContext(section('function fireGun(gun)','function primary()'),ctx);
 state.clip=0;vm.runInContext('fireGun(gun)',ctx);assert.equal(state.powerCharge,3);assert.equal(emitted.length,0);
 state.clip=2;vm.runInContext('fireGun(gun)',ctx);
 assert.equal(state.powerCharge,0);assert.equal(state.clip,1);assert.equal(emitted.length,1);
 assert.equal(emitted[0][1],true);assert.ok(emitted[0][0].damage>=rules.GUNS[0].damage*2);
});
function motionContext(){
 const actions=[];
 const ctx=vm.createContext({state:rules.makeState(),mode:'playing',player:{roll:0,y:0,vy:0,crouch:false},keys:{},forward:()=>({x:0,z:1}),yaw:0,ROLL_DURATION:.72,ACTION_BUFFER:.18,JUMP_SPEED:7,GRAVITY:18,rushCd:10,rollBuffered:0,jumpBuffered:0,attackCd:.7,reloadTime:.5,playerVisual:{attackTime:0},playCharacterAttack:(v,type,duration)=>{v.attackTime=duration;actions.push(type);},playCharacterJump:v=>{v.attackTime=0;actions.push('jump');},music:{effect:noop},mouseHeld:true,dragging:true,pointerLock:{release:noop}});
 vm.runInContext(section('function rush()','function reloadGun(')+source.match(/function clearInput\(\)\{[^\n]+/)[0],ctx);
 return {ctx,actions,run:code=>vm.runInContext(code,ctx)};
}
test('roll restarts with a fresh full animation and no recovery; mid-roll, air and pause block it',()=>{
 const {ctx,actions,run}=motionContext();
 run('rush()');assert.deepEqual(actions,['rush']);assert.equal(ctx.rushCd,0);
 assert.equal(ctx.playerVisual.attackTime,.72);
 run('rush()');assert.equal(actions.length,1);
 run('requestRoll()');ctx.player.roll=0;run('finishRoll()');
 assert.deepEqual(actions,['rush','rush']);assert.equal(ctx.playerVisual.attackTime,.72);
 ctx.player.roll=0;ctx.player.y=.01;run('rush()');assert.equal(actions.length,2);
 ctx.player.y=0;ctx.mode='paused';run('rush()');assert.equal(actions.length,2);
});
test('jump immediately cancels a roll without resetting attack or reload timing',()=>{
 const {ctx,actions,run}=motionContext();run('rush();requestJump()');
 assert.deepEqual(actions,['rush','jump']);assert.equal(ctx.player.roll,0);assert.equal(ctx.player.vy,7);
 assert.equal(ctx.playerVisual.attackTime,0);assert.equal(ctx.rollBuffered,0);
 assert.equal(ctx.attackCd,.7);assert.equal(ctx.reloadTime,.5);
 run('requestJump()');assert.equal(actions.length,2); // 起跳同一帧也不能再跳一次。
 run('stepPlayerMotion(.1);requestJump()');assert.equal(actions.length,2);
});
test('roll pressed just before landing triggers on landing; early airborne taps expire',()=>{
 const {ctx,actions,run}=motionContext();ctx.player.y=.12;ctx.player.vy=-3;
 run('requestRoll();stepPlayerMotion(.05)');assert.deepEqual(actions,['rush']);assert.equal(ctx.player.y,0);
 ctx.player.roll=0;ctx.player.y=1;ctx.player.vy=1;actions.length=0;
 run('requestRoll();stepPlayerMotion(.1);stepPlayerMotion(.1)');assert.equal(ctx.rollBuffered,0);
 ctx.player.y=.01;ctx.player.vy=-3;run('stepPlayerMotion(.016)');assert.deepEqual(actions,[]);
});
test('jump buffered before landing fires once; holding Shift never rolls',()=>{
 const {ctx,actions,run}=motionContext();ctx.player.y=.1;ctx.player.vy=-3;ctx.keys.ShiftLeft=true;
 run('requestJump();stepPlayerMotion(.05)');assert.deepEqual(actions,['jump']);assert.equal(ctx.player.vy,7);
 assert.equal(ctx.player.roll,0);assert.equal(ctx.jumpBuffered,0);
 run('stepPlayerMotion(.1)');assert.deepEqual(actions,['jump']);
 ctx.player.y=.01;ctx.player.vy=-3;run('stepPlayerMotion(.016)');assert.deepEqual(actions,['jump']);
});
test('the latest landing input wins, and pausing clears all queued movement',()=>{
 const {ctx,actions,run}=motionContext();ctx.player.y=.1;ctx.player.vy=-3;
 run('requestJump();requestRoll();stepPlayerMotion(.05)');assert.deepEqual(actions,['rush']);
 ctx.player.roll=0;ctx.player.y=.1;ctx.player.vy=-3;
 run('requestRoll();requestJump();clearInput();stepPlayerMotion(.05)');assert.deepEqual(actions,['rush']);
 assert.equal(ctx.jumpBuffered,0);assert.equal(ctx.rollBuffered,0);assert.equal(ctx.mouseHeld,false);
 ctx.mode='paused';run('requestRoll();requestJump()');assert.deepEqual(actions,['rush']);
});
test('landing and roll completion release stale animation locks immediately',()=>{
 const {ctx,run}=motionContext();ctx.player.y=.1;ctx.player.vy=-3;ctx.playerVisual.attackTime=.6;
 run('stepPlayerMotion(.05)');assert.equal(ctx.playerVisual.attackTime,0);
 ctx.playerVisual.attackTime=.5;run('finishRoll()');assert.equal(ctx.playerVisual.attackTime,0);
});

test('restoring old cast-based charge starts empty, while new hit-based progress survives',()=>{
 for(const current of [undefined,2]){
  const state=rules.makeState();state.abilities.launcher=3;state.launcherCharge=6;
  if(current===undefined)delete state.powerCharge;else state.powerCharge=current;
  const saved={state,units:[],player:{x:0,z:0},cameraDistance:2.7,objects:[]};
  const ctx=vm.createContext({...rules,T,saved,state:rules.makeState(),sprayMarkers:new Map(),chargeMarkers:new Map(),spawnQueue:{jobs:[],wait:0},recentSpawnPoints:[],visuals:new Map(),actorVisual:noop,world:{destructibles:[],spawnWeakenSites:noop}});
  vm.runInContext(section('function restore(saved)','async function start('),ctx);
  vm.runInContext('restore(saved)',ctx);
  assert.equal(ctx.state.powerCharge,current??0);assert.equal('launcherCharge' in ctx.state,false);
 }
});

test('format 10 checkpoint clamps base level, preserves owned abilities and earned alert XP',()=>{
 const state=rules.makeState();state.level=19;state.xp=4;state.pending=3;state.xpEarned=900;
 state.abilities.launcher=3;state.history=Array.from({length:18},()=>({id:'launcher',level:3,time:0}));
 const saved={version:10,state,units:[],player:{x:0,z:0,roll:.4,vy:2},objects:[]};
 const ctx=vm.createContext({...rules,T,saved,state:rules.makeState(),sprayMarkers:new Map(),chargeMarkers:new Map(),spawnQueue:{jobs:[],wait:0},recentSpawnPoints:[],visuals:new Map(),actorVisual:noop,world:{destructibles:[],spawnWeakenSites:noop}});
 vm.runInContext(section('function restore(saved)','async function start('),ctx);
 vm.runInContext('restore(saved)',ctx);
 assert.equal(ctx.state.level,15);assert.equal(ctx.state.need,rules.xpNeedFor(15));assert.equal(ctx.state.xp,0);
 assert.equal(ctx.state.pending,0);assert.equal(ctx.state.abilities.launcher,3);assert.equal(ctx.state.xpEarned,900);
 assert.equal(ctx.player.roll,0);assert.equal(ctx.player.vy,0);
});

test('Boss melee preserves base hits and scales evolution and attack potion damage',()=>{
 for(const kind of ['light','heavy'])for(const buff of [false,true]){
  const state=rules.makeState();if(buff){state.level=15;state.abilities.evolve=3;state.potionTime=10;}
  const hits=[];
  const ctx=vm.createContext({...rules,state,mode:'playing',attackCd:0,switchTime:0,reloadTime:0,
   player:{x:0,z:0,roll:0,knock:0},playerVisual:{holder:{rotation:{}}},yaw:0,
   boss:{active:true,dead:false,x:0,z:1},units:[],raiseAlarm:noop,playCharacterAttack:noop,
   forward:()=>({x:0,z:1}),holdingLauncher:()=>false,activeGun:()=>null,acquire:()=>null,
   world:{breakAt:noop},burst:noop,music:{effect:noop},hitBoss:(b,n)=>hits.push(n)});
  vm.runInContext(section('function meleeStrike(kind)','function emitLauncherShot('),ctx);
  vm.runInContext(`meleeStrike('${kind}')`,ctx);
  const expected=rules.meleeSpec(state,kind).damage*(kind==='heavy'?3:3.75);
  assert.equal(hits[0],expected);
  if(!buff)assert.equal(hits[0],kind==='heavy'?120:75);
 }
});

test('reflection hits only the real attacker in range, including projectile source identity',()=>{
 const state=rules.makeState();state.abilities.tough=2;
 const attacker=rules.makeUnit(7,1,5,0),bystander=rules.makeUnit(8,1,2,0),hits=[];
 const ctx=vm.createContext({...rules,state,player:{x:0,z:0,y:0},units:[attacker,bystander],boss:{active:false},
  invincible:0,shake:0,music:{effect:noop},applyHit:(u,inf,dmg)=>hits.push([u.id,inf,dmg]),
  particles:[],waves:[],tracers:[],world:{solid:()=>false,heightAt:()=>0},scene:{remove:noop},
  burst:noop,STANDING_CHEST:1,PLAYER_HEIGHT:2,CROUCH_CHEST:.7});
 vm.runInContext(section('function playerHurt(','function raiseAlarm(')+section('function updateEffects(','function updateCamera('),ctx);
 ctx.tracers=[{m:{position:{set:noop}},x:0,z:0,y:1,vx:0,vz:0,life:1,damage:20,sourceId:7,from:'巡警'}];
 vm.runInContext('updateEffects(.016)',ctx);assert.deepEqual(hits,[[7,2.5,5]]);
 hits.length=0;attacker.x=11;ctx.attacker=attacker;
 vm.runInContext('playerHurt(20,"巡警",attacker)',ctx);assert.equal(hits.length,0);
 attacker.x=5;attacker.dead=true;
 vm.runInContext('playerHurt(20,"巡警",attacker)',ctx);assert.equal(hits.length,0);
 vm.runInContext('playerHurt(20,"unknown")',ctx);assert.equal(hits.length,0);
 attacker.dead=false;state.abilities.tough=3;attacker.x=29;
 vm.runInContext('playerHurt(20,"巡警",attacker)',ctx);assert.deepEqual(hits,[[7,3.5,7]]);
});

test('shield defense uses each melee or projectile origin instead of the player position',()=>{
 const state=rules.makeState(),enemy=rules.makeUnit(2,3,0,0);
 const ctx=vm.createContext({...rules,state,player:{x:0,z:5},units:[enemy],boss:{active:false},hitStyles:new Map(),performance:{now:()=>0},
  visuals:new Map([[2,{v:{holder:{rotation:{y:0}}}}]]),burst:noop,music:{effect:noop},toast:noop,
  spawnPickup:noop,STANDING_CHEST:1,PROFESSIONS:[],particles:[],waves:[],tracers:[],
  world:{solid:()=>false},scene:{remove:noop},enemy});
 vm.runInContext(section('function facingFront(','function playerHurt(')+section('function updateEffects(','function updateCamera('),ctx);
 vm.runInContext('applyHit(enemy,0,20,true,{x:0,z:-5})',ctx);assert.equal(enemy.hp,320);
 ctx.player.z=-5;vm.runInContext('applyHit(enemy,0,20,true,{x:0,z:5})',ctx);assert.equal(enemy.hp,310);
 // A friendly projectile travelling from behind still bypasses the shield with the player in front.
 ctx.player.z=5;ctx.tracers=[{m:{position:{set:noop}},x:0,z:-.28,y:1,vx:0,vz:18,life:1,damage:20,allyShot:true}];
 vm.runInContext('updateEffects(.016)',ctx);assert.equal(enemy.hp,290);
 // Facing remains available even while the model is culled.
 ctx.visuals.clear();enemy.facingYaw=0;
 vm.runInContext('applyHit(enemy,0,20,true,{x:0,z:5})',ctx);assert.equal(enemy.hp,280);
});

function armyAIContext(x,{hp=100,maxHp=100,doctor=false}={}){
 const state=rules.makeState();state.hp=hp;state.maxHp=maxHp;
 const u=rules.makeUnit(1,doctor?0:1,x,0);rules.convert(state,u);u.attackCd=0;if(doctor)u.profession=1;
 const ctx=vm.createContext({...rules,state,units:[u],player:{x:0,z:0},visuals:new Map(),
  squadIds:new Set([1]),boss:{active:false},ALLY_VIEW:22,alerted:true,
  world:{clear:()=>true,waypoint:(u,x,z)=>({x,z}),towers:[],buildings:[]},
  move:(u,dx,dz)=>{u.x+=dx;u.z+=dz;return true;},toast:noop});
 vm.runInContext(section('const CROWD_CELL=6;','function dropActorVisual('),ctx);
 return {ctx,u,state};
}
test('throttled distant AI advances elapsed movement and clears leftover time when near',()=>{
 const near=armyAIContext(15),far=armyAIContext(30);
 for(let i=0;i<60;i++){vm.runInContext('runAI(1/60)',near.ctx);vm.runInContext('runAI(1/60)',far.ctx);}
 assert.ok(30-far.u.x>3.8);assert.ok(15-near.u.x>4.1);
 const elapsed=far.u.logicElapsed;assert.ok(elapsed>=0&&elapsed<.22);
 far.u.x=15;vm.runInContext('runAI(1/60)',far.ctx);assert.equal(far.u.logicElapsed,0);assert.equal(far.u.logicWait,0);
 // Pooled actors and newly converted actors must not inherit unprocessed AI time.
 far.u.logicElapsed=.3;far.u.logicWait=.2;rules.resetUnit(far.u,2,1,0,0);
 assert.equal(far.u.logicElapsed,0);assert.equal(far.u.logicWait,0);
 far.u.logicElapsed=.3;rules.convert(far.state,far.u);assert.equal(far.u.logicElapsed,0);
});
test('doctor heals to the actual maximum and never exceeds it',()=>{
 for(const [hp,maxHp,expected]of [[150,200,160],[195,200,200],[200,200,200],[90,100,100]]){
  const {ctx,state}=armyAIContext(1,{hp,maxHp,doctor:true});
  vm.runInContext('runAI(.016)',ctx);assert.equal(state.hp,expected);
 }
});

test('save restore repairs duplicate IDs and guards and reinforcements share a sequence',()=>{
 const state=rules.makeState();state.abilities.command=2;
 const units=[800,801,800].map(id=>Object.assign(rules.makeUnit(id,1,0,0),{guard:true,converted:true,kind:'ally'}));
 const saved={version:11,state,units,player:{x:0,z:0},objects:[],totalReinforcements:700};
 const ctx=vm.createContext({...rules,T,saved,state:rules.makeState(),units:[],player:{x:0,z:0},
  nextActorId:100,unitPool:[],visuals:new Map(),squadIds:new Set(),sprayMarkers:new Map(),chargeMarkers:new Map(),
  spawnQueue:{jobs:[]},recentSpawnPoints:[],world:{nearest:()=>({x:0,z:0}),destructibles:[]},actorVisual:noop});
 vm.runInContext(section('function acquireUnitRecord(','function ensureGuards(')+section('function restore(saved)','async function start('),ctx);
 vm.runInContext('restore(saved);spawnGuard(3);units.push(acquireUnitRecord(2,0,0))',ctx);
 assert.deepEqual(Array.from(ctx.units,u=>u.id),[800,801,802,803,804]);assert.equal(ctx.totalReinforcements,701);
 for(let i=0;i<1000;i++)vm.runInContext('units.push(acquireUnitRecord(1,0,0))',ctx);
 vm.runInContext('spawnGuard(3)',ctx);
 assert.equal(new Set(ctx.units.map(u=>u.id)).size,ctx.units.length);
});

test('warning meshes are released on actor recycle, skill completion, and restore',()=>{
 const scene=new T.Scene(),sprayMarkers=new Map(),chargeMarkers=new Map();let geometries=0,materials=0;
 const mesh=()=>{const m=new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial());
  m.geometry.addEventListener('dispose',()=>geometries++);m.material.addEventListener('dispose',()=>materials++);scene.add(m);return m;};
 sprayMarkers.set(1,mesh());chargeMarkers.set(1,mesh());
 const ctx=vm.createContext({...rules,T,scene,sprayMarkers,chargeMarkers,visuals:new Map(),squadIds:new Set(),unitPool:[],
  units:[],player:{x:0,z:0},state:rules.makeState(),auraVisuals:new Map(),world:{heightAt:()=>0},
  syncActorPresence:noop,actorVisual:noop});
 vm.runInContext(section('function disposeActorWarning(','function spawnGuard(')+section('function updateVisuals(','function updateEffects('),ctx);
 vm.runInContext('releaseActor({id:1})',ctx);assert.equal(scene.children.length,0);assert.equal(geometries,2);assert.equal(materials,2);
 sprayMarkers.set(2,mesh());chargeMarkers.set(3,mesh());
 vm.runInContext('updateVisuals(.016)',ctx);assert.equal(sprayMarkers.size,0);assert.equal(chargeMarkers.size,0);assert.equal(scene.children.length,0);
 sprayMarkers.set(4,mesh());chargeMarkers.set(5,mesh());
 ctx.saved={version:11,state:rules.makeState(),units:[],player:{x:0,z:0},objects:[]};
 ctx.spawnQueue={jobs:[]};ctx.recentSpawnPoints=[];ctx.world.destructibles=[];
 vm.runInContext(section('function restore(saved)','async function start('),ctx);vm.runInContext('restore(saved)',ctx);
 assert.equal(scene.children.length,0);assert.equal(geometries,6);assert.equal(materials,6);
});


test('destroyed tanks explode once on release, never convert, and recycle without corpse UI or duplicate rewards',()=>{
 const state=rules.makeState(),tank=rules.makeUnit(90,9,1,2);
 state.abilities.air=3;state.abilities.dot=3;state.abilities.evolve=3;
 assert.equal(rules.hit(state,tank,999,2000),'killed');
 assert.equal(tank.dead,true);assert.equal(tank.kind,'expired');assert.equal(tank.corpseTime,0);
 assert.equal(tank.infection,0);assert.equal(tank.converted,false);assert.equal(rules.convert(state,tank),false);
 const earned=state.xpEarned;assert.equal(rules.hit(state,tank,999,2000),'none');assert.equal(state.xpEarned,earned);
 const bursts=[],waves=[],sounds=[],visuals=new Map(),pool=[];
 const ctx=vm.createContext({tank,world:{heightAt:()=>2},burst:(...args)=>bursts.push(args),wave:(...args)=>{waves.push(args);return {position:{y:0}};},music:{effect:t=>sounds.push(t)},clearActorWarnings:noop,visuals,squadIds:new Set(),unitPool:pool,releaseCharacterVisual:noop});
 vm.runInContext(section('function releaseActor(','// 尸体消失'),ctx);
 vm.runInContext('releaseActor(tank)',ctx);assert.equal(bursts.length,2);assert.equal(waves.length,1);assert.equal(sounds.length,1);assert.equal(tank.explosionPending,false);
 vm.runInContext('releaseActor(tank)',ctx);assert.equal(waves.length,1);
 rules.resetUnit(tank,91,1,0,0);assert.equal(tank.explosionPending,false);
 const old=rules.makeUnit(92,9,0,0);old.kind='corpse';old.hp=0;old.corpseTime=12;
 rules.tickInfection(state,[old],{x:0,z:0},.1);assert.equal(old.kind,'expired');assert.equal(old.dead,true);assert.equal(old.explosionPending,true);
 const human=rules.makeUnit(93,1,0,0);rules.hit(state,human,0,1000);assert.equal(human.kind,'corpse');assert.equal(human.dead,false);assert.equal(human.corpseTime,12);
});


test('large checkpoints restore logic without synchronously cloning every actor model',()=>{
 const saved={state:rules.makeState(),units:Array.from({length:200},(_,i)=>rules.makeUnit(i,1,i%20,i%10)),player:{x:0,z:0},objects:[]};
 let clones=0;
 const ctx=vm.createContext({...rules,T,saved,state:rules.makeState(),sprayMarkers:new Map(),chargeMarkers:new Map(),spawnQueue:{jobs:[],wait:0},recentSpawnPoints:[],visuals:new Map(),actorVisual:()=>clones++,world:{destructibles:[],spawnWeakenSites:noop}});
 vm.runInContext(section('function restore(saved)','async function start('),ctx);vm.runInContext('restore(saved)',ctx);
 assert.equal(ctx.units.length,200);assert.equal(clones,0,'visibility budget must build models as needed after resuming');
});
