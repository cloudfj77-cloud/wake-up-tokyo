import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as r from './rules.js';
const commander={x:0,z:0};
const awake=(id,x=0,z=0)=>{const u=r.makeUnit(id,1,x,z);u.kind='ally';u.converted=true;u.hp=50;u.maxHp=50;return u;};
function state(level){const s=r.makeState();s.abilities.kindling=level;return s;}
test('kindling is a ninth selectable three-tier ability and loads with old ability state',()=>{
 const s=r.makeState();s.pending=3;
 for(let i=0;i<3;i++)assert.equal(r.upgrade(s,'kindling'),true);
 assert.equal(s.abilities.kindling,3);assert.equal(r.upgrade(s,'kindling'),false);
 const old={...r.makeState()};delete old.abilities.kindling;
 assert.equal(r.kindlingMultiplier(old,commander),1);
 const fresh=r.makeState();assert.ok(r.choices(fresh,()=>.999).every(a=>a.id!=='guns'));
 assert.equal(r.ABILITIES.find(a=>a.id==='kindling').descriptions.length,3);
});
test('every qualifying fall refreshes duration, including at the stack cap, without duplicate deaths',()=>{
 for(const [level,cap,duration,bonus]of[[1,3,8,.18],[2,5,12,.4],[3,5,12,.5]]){
  const s=state(level);
  for(let i=0;i<cap;i++){r.damageAlly(awake(i),100,s,commander);assert.equal(s.kindlingStacks,i+1);}
  assert.equal(s.kindlingTime,duration);assert.ok(Math.abs(r.kindlingMultiplier(s,commander)-1-bonus)<1e-9);
  s.kindlingTime=1;const u=awake(100);r.damageAlly(u,100,s,commander);
  assert.equal(s.kindlingStacks,cap);assert.equal(s.kindlingTime,duration);
  s.kindlingTime=2;r.damageAlly(u,100,s,commander);assert.equal(s.kindlingTime,2);
 }
});
test('fall range, living-hit exclusion, guards and expiring stacks follow the selected tier',()=>{
 const s=state(1),near=awake(1,18),far=awake(2,18.01);
 r.damageAlly(near,1,s,commander);assert.equal(s.kindlingStacks,0);
 r.damageAlly(far,100,s,commander);assert.equal(s.kindlingStacks,0);
 r.damageAlly(near,100,s,commander);assert.equal(s.kindlingStacks,1);
 const guard=awake(3);guard.guard=true;r.damageAlly(guard,100,s,commander);assert.equal(s.kindlingStacks,2);
 s.abilities.kindling=2;r.damageAlly(awake(4,24),100,s,commander);assert.equal(s.kindlingStacks,3);
 s.kindlingTime=0;r.damageAlly(awake(5),100,s,commander);assert.equal(s.kindlingStacks,1);assert.equal(s.kindlingTime,12);
});
test('timer freezes in menus and expires fully during combat',()=>{
 const s=state(1);r.damageAlly(awake(1),100,s,commander);
 for(const mode of ['map','paused','upgrade','menu'])r.stepSimulation(s,[],commander,20,mode);
 assert.equal(s.kindlingTime,8);assert.equal(s.kindlingStacks,1);
 r.stepSimulation(s,[],commander,7,'playing');assert.equal(s.kindlingTime,1);
 r.stepSimulation(s,[],commander,1,'playing');assert.equal(s.kindlingTime,0);assert.equal(s.kindlingStacks,0);
});
test('only commander and awakened allies in radius receive damage bonus',()=>{
 const s=state(2);s.kindlingStacks=5;s.kindlingTime=12;
 assert.equal(r.kindlingMultiplier(s,commander),1.4);
 assert.equal(r.kindlingMultiplier(s,commander,awake(1,24)),1.4);
 assert.equal(r.kindlingMultiplier(s,commander,awake(2,24.01)),1);
 assert.equal(r.kindlingMultiplier(s,commander,r.makeUnit(3,1,1,0)),1);
});
test('third-tier pulse starts after filling the cap, refreshes duration and buffs the base one infection per pulse',()=>{
 const s=state(3);
 for(let i=0;i<5;i++)r.damageAlly(awake(i),100,s,commander);
 assert.equal(s.kindlingPulses.length,0);
 s.kindlingTime=1;r.damageAlly(awake(6),100,s,commander);assert.equal(s.kindlingTime,12);
 r.damageAlly(awake(7),100,s,commander);assert.equal(s.kindlingPulses.length,2);
 const near=r.makeUnit(20,1,24,0),far=r.makeUnit(21,1,24.01,0),ally=awake(22),tank=r.makeUnit(23,9,0,0);
 const pulses=r.releaseKindlingPulses(s,[near,far,ally,tank]);assert.equal(pulses.length,2);
 assert.equal(near.infection,3);assert.equal(near.hp,near.maxHp);assert.equal(far.infection,0);assert.equal(tank.infection,0);
 assert.equal(r.releaseKindlingPulses(s,[near]).length,0);
 // A pulse can complete an existing infection and convert an enemy normally.
 near.infection=near.threshold-1;r.damageAlly(awake(8),100,s,commander);r.releaseKindlingPulses(s,[near]);assert.equal(near.converted,true);
});
test('actual hit and Boss paths buff player and nearby allies exactly once, buffing infection',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
 const s=state(3);s.kindlingStacks=5;s.kindlingTime=12;
 const player={...commander},enemy=r.makeUnit(20,1,5,0),ally=awake(21),outside=awake(22,25);
 const bossHits=[];
 const ctx=vm.createContext({...r,state:s,player,enemy,ally,outside,visuals:new Map(),hitStyles:new Map(),performance:{now:()=>0},
  boss:{},baseHitBoss:(b,d)=>bossHits.push(d),burst(){},music:{effect(){}},toast(){},spawnPickup(){},PROFESSIONS:[],STANDING_CHEST:1});
 vm.runInContext(section('function hitBoss(','function playerHurt('),ctx);
 vm.runInContext('applyHit(enemy,2,10)',ctx);assert.equal(enemy.hp,105);assert.equal(enemy.infection,3);
 vm.runInContext('applyHit(enemy,2,10,true,ally)',ctx);assert.equal(enemy.hp,90);assert.equal(enemy.infection,6);
 vm.runInContext('applyHit(enemy,2,10,true,outside)',ctx);assert.equal(enemy.hp,80);
 vm.runInContext('hitBoss(boss,10);hitBoss(boss,10,ally);hitBoss(boss,10,outside)',ctx);
 assert.deepEqual(bossHits,[15,15,10]);
 vm.runInContext('applyHit(enemy,2,10,false,player,player,"heavy");hitBoss(boss,10,player,"heavy")',ctx);
 assert.equal(ctx.hitStyles.get(enemy.id).kind,'heavy');assert.equal(ctx.hitStyles.get('boss').kind,'heavy');
});

test('purple flame pulse covers 24 meters and uses the bounded comic FX pool',async()=>{
 const T=await import('three'),{createComicAbilityFX}=await import('./comic-fx.js');
 const scene=new T.Scene(),fx=createComicAbilityFX(T,scene);
 const pulse=fx.pulse(0,0,0,'kindling',3,24);assert.equal(pulse.kind,'kindling');assert.equal(pulse.radius,24);assert.equal(pulse.nodes.length,9);
 for(let i=0;i<100;i++)fx.pulse(0,0,0,'kindling',3,24);assert.ok(fx.diagnostics().active<=fx.diagnostics().limit);
 for(let i=0;i<30;i++)fx.update(.04);assert.equal(fx.diagnostics().active,0);fx.dispose();assert.equal(scene.children.length,0);
});

test('kindling boosts air, mist, persistent infection and nearby allied purifiers without boosting enemy cleansing',()=>{
 const s=state(3);s.kindlingStacks=5;s.kindlingTime=12;s.abilities.air=1;s.abilities.dot=1;
 const target=r.makeUnit(1,1,2,0);target.tagged='player';
 r.tickInfection(s,[target],commander,.5);assert.equal(target.infection,3.75); // (4 aura + 1 DOT) * 1.5 * .5
 s.abilities.air=3;s.abilities.dot=0;s.airClouds=[{x:30,z:0,time:2}];
 const mist=r.makeUnit(2,1,30,0);r.tickInfection(s,[mist],commander,.5);assert.equal(mist.infection,6);
 s.abilities.air=0;const aid=r.makeUnit(3,4,24,0);r.convert(s,aid);
 const nearby=r.makeUnit(4,1,25,0);r.tickInfection(s,[aid,nearby],commander,.5);assert.equal(nearby.infection,3);
 aid.x=25;nearby.infection=0;r.tickInfection(s,[aid,nearby],commander,.5);assert.equal(nearby.infection,2);
 const purifier=r.makeUnit(5,4,25,0);nearby.infection=10;r.tickInfection(s,[nearby,purifier],commander,.5);assert.equal(nearby.infection,8);
});
