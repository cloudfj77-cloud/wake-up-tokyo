import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as rules from './rules.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareCharacterAsset,acquireCharacterVisual,releaseCharacterVisual,setCharacterKind,clearCharacterPool} from './characters.js';
const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
function section(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))).replaceAll('import.meta.env.DEV','false');}
function context(extra={}){
 const elements=new Map();
 const ctx=vm.createContext({...rules,state:rules.makeState(),mode:'playing',assets:{},units:[],player:{x:0,z:0},yaw:0,pitch:0,cameraDistance:3,attackCd:0,breakCd:0,rushCd:0,reinforceTimer:0,fodderTimer:10,reinforceDirection:0,totalReinforcements:0,alerted:true,reinforceAnnounced:false,spawnQueue:rules.makeSpawnQueue(),boss:{active:false,root:{}},world:{towers:[],destructibles:[],bossSpawn:{x:30,z:0},spawnWeakenSites(){}},toast(){},bossVictoryHold:0,policeAlertTimer:0,music:{pause(){},update(){},duck(){},stopBed(){}},document:{body:{classList:{toggle(){}}}},$:id=>{if(!elements.has(id))elements.set(id,{classList:{remove(){}}});return elements.get(id);},formatTime:t=>String(t),localStorage:{setItem(_key,value){ctx.saved=JSON.parse(value);},removeItem(){}},SAVE_KEY:'test',SAVE_VERSION:10,showDialog:html=>{ctx.dialog=html;},...extra});
 return ctx;
}
test('resuming the checkpoint written at Boss entry summons the Boss again',()=>{
 const ctx=context();ctx.state.bossCountdown=0;rules.publishWeakenTasks(ctx.state);rules.completeWeaken(ctx.state,'shield');
 vm.runInContext(section('function saveRun()','function loadSaved()')+section('function syncWeakenTasks()','function updateBoss('),ctx);
 vm.runInContext('updateMissions()',ctx);assert.equal(ctx.boss.active,true);assert.ok(ctx.saved);
 ctx.state=ctx.saved.state;ctx.boss={active:false,root:{}};
 vm.runInContext('updateMissions()',ctx);
 assert.equal(ctx.boss.active,true,'continued run must not get stuck with no Boss');assert.equal(ctx.boss.shieldHp,0);
});
function reinforcementContext(rush){
 const ctx=context({dt:.1});ctx.boss.active=true;ctx.state.rushReinforce=rush;ctx.state.bossSpawned=true;ctx.spawnQueue.jobs=[{type:1},{type:1},{type:1}];ctx.reinforceTimer=5;ctx.flushed=0;
 ctx.flushSpawnQueue=()=>{ctx.flushed++;ctx.spawnQueue.jobs.shift();};ctx.spawnReinforcement=()=>({interval:12});
 const code=section('function updateReinforcements(','function flushSpawnQueue(');
 vm.runInContext(code,ctx);return ctx;
}
test('Boss reinforcements drain their queue in both normal and accelerated modes',()=>{
 for(const rush of [false,true]){const ctx=reinforcementContext(rush);vm.runInContext('updateReinforcements(.1)',ctx);assert.equal(ctx.flushed,1);assert.equal(ctx.spawnQueue.jobs.length,2);}
});
test('uncompleted reinforcement task shortens Boss wave interval and aftermath stops spawning',()=>{
 for(const rush of [false,true]){
  const ctx=reinforcementContext(rush);ctx.spawnQueue.jobs=[];ctx.reinforceTimer=0;
  vm.runInContext('updateReinforcements(.1)',ctx);
  assert.ok(ctx.reinforceTimer>=(rush?2:3)&&ctx.reinforceTimer<=(rush?4:5));
  ctx.state.aftermath=true;ctx.spawnQueue.jobs=[{type:1}];const before=ctx.flushed;
  vm.runInContext('updateReinforcements(.1)',ctx);assert.equal(ctx.flushed,before);assert.equal(ctx.spawnQueue.jobs.length,0);
 }
});
test('budgeted Boss waves drain and later waves still arrive',()=>{
 for(const rush of [true,false]){
  const ctx=context({boss:{active:true},armyWave:null,armyCursor:0,cullFarCivilians(){},cullFarTroops(){},forward:()=>({x:0,z:1}),Math:Object.assign(Object.create(Math),{random:()=>.8})});
  Object.assign(ctx.state,{level:25,xpEarned:1600,bossSpawned:true,rushReinforce:rush});
  let spawned=0;
  ctx.placeArmyRusher=ctx.placeOnStreet=type=>ctx.units.push(rules.makeUnit(++spawned,type,15,0));
  vm.runInContext(section('function spawnReinforcement(','function hostileConeHits('),ctx);
  vm.runInContext('updateReinforcements(.04)',ctx);
  assert.equal(spawned,0,'new plans must not spawn before the next camera-aware frame');
  vm.runInContext('updateReinforcements(.04)',ctx);assert.equal(spawned,1);
  assert.ok(ctx.spawnQueue.jobs.length>0,'a budgeted wave must enter the frame queue');
  const waveSize=spawned+ctx.spawnQueue.jobs.length;
  ctx.reinforceTimer=1e6;ctx.fodderTimer=1e6;
  for(let i=0;i<800&&ctx.spawnQueue.jobs.length;i++)vm.runInContext('updateReinforcements(.04)',ctx);
  assert.equal(ctx.spawnQueue.jobs.length,0,'a large wave must continue draining during the Boss fight');
  assert.equal(spawned,waveSize);
  ctx.reinforceTimer=0;ctx.fodderTimer=0;
  for(let i=0;i<600;i++)vm.runInContext('updateReinforcements(.04)',ctx);
  assert.ok(spawned>waveSize,'reinforcement weakening must not disable subsequent waves');
 }
});
test('ending through the pause menu after victory still gives a victory recap',()=>{
 const ctx=context();ctx.state.bossDefeated=true;ctx.state.aftermath=true;ctx.state.peakAlert=6;
 vm.runInContext(section('function finish(result)','function spawnReinforcement('),ctx);
 vm.runInContext("finish('ended')",ctx);assert.equal(ctx.mode,'won');assert.match(ctx.dialog,/觉醒成功/);assert.doesNotMatch(ctx.dialog,/undefined/);
});

for(const type of [0,1])test(type===0?'civilian conversion clears the old aura before reusing its model':'soldier conversion keeps its model and a single aura',async()=>{
 clearCharacterPool();
 const buffer=readFileSync(new URL('./assets/character.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
 const assets=prepareCharacterAsset(gltf),original=acquireCharacterVisual(assets,type===0?'human':'guard');
 const unit=rules.makeUnit(1,type,0,0);unit.converted=true;unit.kind='ally';
 const activeAuras=[],visuals=new Map([[1,{v:original,oldKind:type===0?'human':'guard'}]]);
 const ctx=context({assets,units:[unit],visuals,activeAuras,scene:new T.Scene(),auraVisuals:new Map(),world:{heightAt:()=>0},syncActorPresence(){},actorViewLimit:()=>22,actorInFront:()=>true,AURA_COLORS:{worker:{},guard:{}},makeAura(holder){const aura={g:new T.Group(),life:0};holder.add(aura.g);activeAuras.push(aura);return aura;},acquireCharacterVisual,releaseCharacterVisual,setCharacterKind,burst(){},music:{effect(){},setBed(){}},aura(){}});
 vm.runInContext(section('function removeAura(','function updateAuras(')+section('function updateVisuals(','function updateEffects('),ctx);
 vm.runInContext('updateVisuals(.016);updateVisuals(.016)',ctx);
 const current=visuals.get(1).v;
 assert.equal(activeAuras.length,1,'conversion must leave exactly one live aura');
 assert.equal(current.kind,'ally');
 if(type===0){
  assert.notEqual(current,original);
  assert.equal(original.aura,null);
  const reused=acquireCharacterVisual(assets,'human');
  assert.equal(reused,original);
  assert.equal(reused.aura,null,'recycled civilians must not inherit an infection effect');
  releaseCharacterVisual(reused);
 }else assert.equal(current,original);
 vm.runInContext('removeAura(visuals.get(1).v.aura);visuals.get(1).v.aura=null',ctx);
 releaseCharacterVisual(current);clearCharacterPool();
});


for(const [type,corpse] of [[0,false],[0,true],[1,true]])test(`evolve 3 synchronizes type ${type} ${corpse?'corpse':'living'} visuals and rebuilds upright`,async()=>{
 clearCharacterPool();
 const buffer=readFileSync(new URL('./assets/character.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
 const assets=prepareCharacterAsset(gltf),original=acquireCharacterVisual(assets,type===0?'human':'guard');
 const unit=rules.makeUnit(1,type,0,0),state=rules.makeState();state.abilities.evolve=3;
 if(corpse){unit.kind='corpse';unit.hp=0;unit.rewarded=true;original.holder.rotation.x=Math.PI/2;}
 const oldKind=unit.kind;
 rules.convert(state,unit);
 const activeAuras=[],visuals=new Map([[1,{v:original,oldKind}]]);
 const ctx=context({state,assets,units:[unit],visuals,activeAuras,scene:new T.Scene(),auraVisuals:new Map(),world:{heightAt:()=>0},syncActorPresence(){},actorViewLimit:()=>22,actorInFront:()=>true,AURA_COLORS:{worker:{},guard:{}},makeAura(holder){const a={g:new T.Group(),life:0};holder.add(a.g);activeAuras.push(a);return a;},acquireCharacterVisual,releaseCharacterVisual,setCharacterKind,burst(){},aura(){}});
 vm.runInContext(section('function removeAura(','function updateAuras(')+section('function actorVisual(','function acquireUnitRecord(')+section('function updateVisuals(','function updateEffects('),ctx);
 vm.runInContext('updateVisuals(.016);updateVisuals(.016)',ctx);
 const current=visuals.get(1).v;
 assert.equal(current.poolKey,'guard');assert.equal(current.kind,'ally');
 assert.equal(current.holder.rotation.x,0);assert.equal(activeAuras.length,1);
 if(type===0)assert.notEqual(current,original);
 vm.runInContext('removeAura(visuals.get(1).v.aura);visuals.get(1).v.aura=null',ctx);
 releaseCharacterVisual(current);visuals.clear();
 vm.runInContext('actorVisual(units[0])',ctx);
 const rebuilt=visuals.get(1).v;
 assert.equal(rebuilt.poolKey,'guard');assert.equal(rebuilt.kind,'ally');assert.equal(rebuilt.holder.rotation.x,0);
 releaseCharacterVisual(rebuilt);clearCharacterPool();
});
test('army entry circles a plane and drops a bomb that only hurts the player side',()=>{
 const spoken=[],added=[];
 const ctx=context({
  tracers:[],player:{x:3,z:4},music:{muted:false,duck(){},effect(){},sfx:{emit(){}},speak(stage,text){spoken.push(text);},hush(){}},
  STRIKE:{enemy:{bomb:0xff3344,glow:0xff8899,bullet:0xff2b2b,spark:0xff4d4d},ally:{}},
  scene:{add(o){added.push(o);},remove(){}},
  world:{heightAt:()=>0,nearest:(x,z)=>({x,z})},
  T,
  flashPoliceAlert(){ctx.radioShown=true;},
  bombMarker(x,z,radius){return {x,z,radius};},
  speechSynthesis:{getVoices:()=>[{lang:'en-US',name:'Alex'}],speak(u){spoken.push(u.text);u.onend?.();},cancel(){},resume(){},speaking:false,pending:false},
  SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}
 });
 vm.runInContext(section('let airWing=null','function spawnReinforcement('),ctx);
 vm.runInContext('callBackup(3);callBackup(1);beginAirstrike()',ctx);
 assert.match(spoken[0],/lockdown/i);
 assert.equal(spoken.length,1);
 assert.equal(ctx.radioShown,undefined);
 assert.equal(added.length,1);
 vm.runInContext('state.alert=4;updateAirstrike(1)',ctx);
 assert.equal(ctx.tracers.length,1);
 const bomb=ctx.tracers[0];
 assert.equal(bomb.allyShot,false);
 assert.equal(bomb.infection,0);
 assert.equal(bomb.grenade.max,30);
 assert.equal(bomb.grenade.min,30);
 assert.ok(bomb.marker);
 vm.runInContext('for(let i=0;i<60;i++)updateAirstrike(0.05);snapWarn=readStrafe();for(let i=0;i<50;i++)updateAirstrike(0.05);snapDive=readStrafe();',ctx);
 assert.equal(ctx.snapWarn.mode,'warn');
 assert.equal(ctx.snapWarn.warned,true);
 assert.equal(ctx.snapWarn.shots,0);
 assert.ok(ctx.snapDive.shots>0);
 vm.runInContext('const p=planeAimPoint();bullet=shellHitsPlane({x:p.x,y:p.y,z:p.z,damage:12});shell=shellHitsPlane({x:p.x,y:p.y,z:p.z,isPower:true,damage:12});downed=hurtPlane(AIRSTRIKE.hp);gone=!planeAimPoint();',ctx);
 assert.equal(ctx.bullet,false);
 assert.equal(ctx.shell,true);
 assert.equal(ctx.downed,true);
 assert.equal(ctx.gone,true);
 vm.runInContext('crash0=readCrash();for(let i=0;i<8;i++)updateAirstrike(0.05);crash1=readCrash();for(let i=0;i<30;i++)updateAirstrike(0.05);crash2=readCrash();',ctx);
 assert.equal(ctx.crash0.mode,'crash');
 assert.ok(ctx.crash1.y<ctx.crash0.y);
 assert.equal(ctx.crash2.mode,'');
});
