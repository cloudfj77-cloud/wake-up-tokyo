import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as rules from './rules.js';
const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
function section(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))).replaceAll('import.meta.env.DEV','false');}
function context(extra={}){
 const elements=new Map();
 const ctx=vm.createContext({...rules,state:rules.makeState(),mode:'playing',assets:{},units:[],player:{x:0,z:0},yaw:0,pitch:0,cameraDistance:3,attackCd:0,breakCd:0,rushCd:0,reinforceTimer:0,reinforceDirection:0,totalReinforcements:0,alerted:true,reinforceAnnounced:false,spawnQueue:rules.makeSpawnQueue(),boss:{active:false,root:{}},world:{towers:[],destructibles:[],bossSpawn:{x:30,z:0},spawnWeakenSites(){}},toast(){},bossVictoryHold:0,policeAlertTimer:0,music:{pause(){}},document:{body:{classList:{toggle(){}}}},$:id=>{if(!elements.has(id))elements.set(id,{classList:{remove(){}}});return elements.get(id);},formatTime:t=>String(t),localStorage:{setItem(_key,value){ctx.saved=JSON.parse(value);},removeItem(){}},SAVE_KEY:'test',SAVE_VERSION:10,showDialog:html=>{ctx.dialog=html;},...extra});
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
 const ctx=reinforcementContext(true);ctx.spawnQueue.jobs=[];ctx.reinforceTimer=0;vm.runInContext('updateReinforcements(.1)',ctx);assert.ok(ctx.reinforceTimer<12);
 ctx.state.aftermath=true;ctx.spawnQueue.jobs=[{type:1}];const before=ctx.flushed;vm.runInContext('updateReinforcements(.1)',ctx);assert.equal(ctx.flushed,before);assert.equal(ctx.spawnQueue.jobs.length,0);
});
test('ending through the pause menu after victory still gives a victory recap',()=>{
 const ctx=context();ctx.state.bossDefeated=true;ctx.state.aftermath=true;ctx.state.peakAlert=6;
 vm.runInContext(section('function finish(result)','function spawnReinforcement('),ctx);
 vm.runInContext("finish('ended')",ctx);assert.equal(ctx.mode,'won');assert.match(ctx.dialog,/觉醒成功/);assert.doesNotMatch(ctx.dialog,/undefined/);
});
