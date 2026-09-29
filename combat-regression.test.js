import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as rules from './rules.js';
import * as T from 'three';
const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
function section(start,end){const from=source.indexOf(start);assert.ok(from>=0);const to=source.indexOf(end,from);assert.ok(to>from);return source.slice(from,to);}
const noop=()=>{};
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
 const ctx=vm.createContext({mode:'playing',player:{roll:0,y:0,vy:0,crouch:false},keys:{},forward:()=>({x:0,z:1}),yaw:0,ROLL_DURATION:.72,ACTION_BUFFER:.18,JUMP_SPEED:7,GRAVITY:18,rushCd:10,rollBuffered:0,jumpBuffered:0,attackCd:.7,reloadTime:.5,playerVisual:{attackTime:0},playCharacterAttack:(v,type,duration)=>{v.attackTime=duration;actions.push(type);},playCharacterJump:v=>{v.attackTime=0;actions.push('jump');},music:{effect:noop},mouseHeld:true,dragging:true,pointerLock:{release:noop}});
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
test('jump buffered before landing fires once and takes priority over held roll',()=>{
 const {ctx,actions,run}=motionContext();ctx.player.y=.1;ctx.player.vy=-3;ctx.keys.ShiftLeft=true;
 run('requestJump();stepPlayerMotion(.05)');assert.deepEqual(actions,['jump']);assert.equal(ctx.player.vy,7);
 assert.equal(ctx.player.roll,0);assert.equal(ctx.jumpBuffered,0);
 run('stepPlayerMotion(.1)');assert.deepEqual(actions,['jump']);
 ctx.player.y=.01;ctx.player.vy=-3;run('stepPlayerMotion(.016)');assert.deepEqual(actions,['jump','rush']);
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
  const ctx=vm.createContext({...rules,T,saved,state:rules.makeState(),spawnQueue:{jobs:[],wait:0},recentSpawnPoints:[],visuals:new Map(),actorVisual:noop,world:{destructibles:[],spawnWeakenSites:noop}});
  vm.runInContext(section('function restore(saved)','async function start('),ctx);
  vm.runInContext('restore(saved)',ctx);
  assert.equal(ctx.state.powerCharge,current??0);assert.equal('launcherCharge' in ctx.state,false);
 }
});
