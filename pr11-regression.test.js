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
 const ctx=vm.createContext({...rules,state:rules.makeState(),mode:'playing',assets:{},units:[],player:{x:0,z:0},yaw:0,pitch:0,cameraDistance:3,attackCd:0,breakCd:0,rushCd:0,reinforceTimer:0,reinforceDirection:0,totalReinforcements:0,alerted:true,reinforceAnnounced:false,spawnQueue:rules.makeSpawnQueue(),boss:{active:false,root:{}},world:{towers:[],destructibles:[],bossSpawn:{x:30,z:0},spawnWeakenSites(){}},toast(){},bossVictoryHold:0,policeAlertTimer:0,music:{pause(){},setBed(){},stopBed(){}},document:{body:{classList:{toggle(){}}}},$:id=>{if(!elements.has(id))elements.set(id,{classList:{remove(){}}});return elements.get(id);},formatTime:t=>String(t),localStorage:{setItem(_key,value){ctx.saved=JSON.parse(value);},removeItem(){}},SAVE_KEY:'test',SAVE_VERSION:10,showDialog:html=>{ctx.dialog=html;},...extra});
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
 const ctx=context({dt:.1});ctx.boss.active=true;ctx.state.rushReinforce=rush;ctx.spawnQueue.jobs=[{type:1},{type:1},{type:1}];ctx.reinforceTimer=5;ctx.flushed=0;
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
  assert.equal(ctx.reinforceTimer,rush?12*.6:12);
  ctx.state.aftermath=true;ctx.spawnQueue.jobs=[{type:1}];const before=ctx.flushed;
  vm.runInContext('updateReinforcements(.1)',ctx);assert.equal(ctx.flushed,before);assert.equal(ctx.spawnQueue.jobs.length,0);
 }
});
test('a Boss wave above the queue limit drains and later waves still arrive',()=>{
 for(const rush of [true,false]){
  const ctx=context({boss:{active:true},armyWave:null,armyCursor:0,cullFarCivilians(){},cullFarTroops(){},forward:()=>({x:0,z:1}),Math:Object.assign(Object.create(Math),{random:()=>.8})});
  Object.assign(ctx.state,{level:25,xpEarned:1600,bossSpawned:true,rushReinforce:rush});
  let spawned=0;
  ctx.placeArmyRusher=ctx.placeOnStreet=type=>ctx.units.push(rules.makeUnit(++spawned,type,15,0));
  vm.runInContext(section('function spawnReinforcement(','function hostileConeHits('),ctx);
  vm.runInContext('updateReinforcements(.04)',ctx);
  assert.equal(spawned,2);
  assert.ok(ctx.spawnQueue.jobs.length>=rules.TUNE.difficulty.spawnQueueMax);
  const waveSize=spawned+ctx.spawnQueue.jobs.length;
  for(let i=0;i<100;i++)vm.runInContext('updateReinforcements(.04)',ctx);
  assert.equal(ctx.spawnQueue.jobs.length,0,'a large wave must continue draining during the Boss fight');
  assert.equal(spawned,waveSize);
  for(let i=0;i<400;i++)vm.runInContext('updateReinforcements(.04)',ctx);
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
