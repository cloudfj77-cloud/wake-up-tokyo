import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {makeState,makeUnit,hit,upgrade,choices,reward,tickInfection,stepSimulation,damageAlly,teamCount,outcome,ABILITIES,ENEMIES,hurtMother,missionReady,cityAlert,threat,spawnPlan,fodderCount,speed,WALK_SPEED,SPRINT_MULT,setTuneValue,resetTune,meleeSpec,grantKillAmmo,gunInfection,refreshStats,levelCap,convert,allyTemplate,isRangedEnemy,hostileWindup,hostileSwingConnects,stepHostileMelee,xpNeedFor,xpFromUnit,upgradeAutoGap} from './rules.js';
import {createBoss,hitBoss} from './boss.js';
import {createSyringe} from './syringe.js';

test('mother survives one bullet and dies on second; tough does not raise max HP',()=>{
 const s=makeState();s.pending=1;upgrade(s,'tough');
 reward(s,makeUnit(1,2,0,0),true);
 assert.equal(s.maxHp,100);
 assert.equal(hurtMother(s,50),false);
 assert.equal(s.hp,60);
 assert.equal(hurtMother(s,80),true);
 assert.equal(outcome(s),'ended');
});
test('citizen converts on two light attacks; final infection cancels damage',()=>{
 const s=makeState(),u=makeUnit(1,0,0,0),light=meleeSpec(s,'light');
 assert.equal(u.threshold,20);
 assert.equal(light.infection,10);
 assert.equal(light.damage,20);
 assert.equal(hit(s,u,light.infection,light.damage),'hit');
 assert.equal(u.hp,30);
 assert.equal(hit(s,u,light.infection,light.damage),'converted');
 assert.equal(u.hp,60);
 assert.equal(u.maxHp,60);
 assert.equal(s.infected,1);
});
test('one heavy attack converts a citizen',()=>{
 const s=makeState(),u=makeUnit(1,0,0,0),heavy=meleeSpec(s,'heavy');
 assert.equal(heavy.infection,20);
 assert.equal(hit(s,u,heavy.infection,heavy.damage),'converted');
 assert.equal(s.infected,1);
});
test('guns level 3 convert infection is half weapon damage',()=>{
 const s=makeState();s.pending=3;for(let i=0;i<3;i++)upgrade(s,'guns');
 assert.equal(gunInfection(s,16),8);
 const u=makeUnit(1,0,0,0);
 assert.equal(hit(s,u,8,16),'hit');
 assert.equal(hit(s,u,8,16),'hit');
 assert.equal(u.infection,16);
 assert.equal(hit(s,u,8,16),'converted');
});
test('allied death does not subtract cumulative infection',()=>{
 const s=makeState(),u=makeUnit(1,0,0,0);
 hit(s,u,60,0);damageAlly(u,999,s);assert.equal(teamCount([u]),0);assert.equal(s.infected,1);
});
test('corpse requires air 2, revives before expiration, does not duplicate experience',()=>{
 const s=makeState(),u=makeUnit(1,2,0,0);u.infection=50;hit(s,u,0,999);
 assert.equal(u.kind,'corpse');const xp=s.xp;
 s.abilities.air=1;tickInfection(s,[u],{x:0,z:0},1);assert.equal(u.kind,'corpse');
 s.abilities.air=2;tickInfection(s,[u],{x:0,z:0},4);assert.equal(u.kind,'ally');assert.equal(s.xp,xp);
});
test('air level 1 adds 6 infection per second in 5m',()=>{
 const s=makeState(),u=makeUnit(1,0,1,0);s.abilities.air=1;
 tickInfection(s,[u],{x:0,z:0},1);assert.equal(u.infection,6);
});
test('card selection pauses time, corpse expiration and infection growth',()=>{
 const s=makeState(),u=makeUnit(1,2,0,0);hit(s,u,0,999);s.abilities.air=2;
 const before=JSON.stringify({s,u});stepSimulation(s,[u],{x:0,z:0},20,'upgrade');
 assert.equal(JSON.stringify({s,u}),before);
});
test('purifier drains infection and reverses after conversion',()=>{
 const s=makeState(),p=makeUnit(1,4,1,0),u=makeUnit(2,3,0,0);u.infection=80;
 tickInfection(s,[p,u],{x:50,z:50},1);assert.equal(u.infection,72);
 hit(s,p,340,0);assert.equal(p.converted,true);
 tickInfection(s,[p,u],{x:50,z:50},1);assert.equal(u.infection,80);
});
test('shield halves frontal damage only',()=>{
 const s=makeState(),u=makeUnit(1,3,0,0);
 assert.ok(ENEMIES[3].shield);hit(s,u,0,20,true);assert.equal(u.hp,170);hit(s,u,0,20,false);assert.equal(u.hp,150);
});
test('city alert is time-gated, not infection-gated',()=>{
 const s=makeState();assert.equal(cityAlert(s).maxLevel,2);assert.equal(threat(s),1);
 s.infected=40;s.kills=20;s.time=10;assert.equal(threat(s),1);
 s.time=90;assert.equal(cityAlert(s).stage,2);assert.equal(cityAlert(s).maxLevel,4);
 s.time=180;assert.equal(cityAlert(s).stage,3);assert.equal(cityAlert(s).final,true);assert.equal(cityAlert(s).maxLevel,6);
});
test('early spawn plan only sends fodder',()=>{
 const s=makeState();const units=[makeUnit(1,0,0,0),makeUnit(2,1,1,1)];
 const plan=spawnPlan(s,units,()=>0);assert.equal(plan.threatN,0);
 assert.ok(plan.types.every(t=>ENEMIES[t].fodder));assert.ok(plan.interval>=5);
});
test('city civilians do not fill the combat fodder quota',()=>{
 const s=makeState();
 const street=Array.from({length:48},(_,i)=>makeUnit(i,0,0,0,true));
 assert.equal(fodderCount(street),0);
 const dump=spawnPlan(s,street,()=>0);
 assert.equal(dump.fodder,0);
 assert.equal(dump.fodderN,12);
 assert.ok(dump.types.every(t=>t!==0));
 const mixed=street.concat(Array.from({length:4},(_,i)=>makeUnit(100+i,1,0,0,true)));
 const plan=spawnPlan(s,mixed,()=>0);
 assert.equal(plan.fodder,4);
 assert.equal(plan.fodderN,6);
});
test('empty field dumps many fodder; army size raises uncapped threats',()=>{
 const s=makeState();
 const empty=spawnPlan(s,[],()=>0);
 assert.ok(empty.fodderN>=10);
 assert.ok(empty.types.filter(t=>ENEMIES[t].fodder).length>=10);
 s.time=90;s.level=8;
 const army=Array.from({length:20},(_,i)=>{const u=makeUnit(i,0,0,0);u.converted=true;u.kind='ally';return u;});
 const plan=spawnPlan(s,army,()=>0);
 assert.ok(plan.threatN>3);
 const bigger=Array.from({length:40},(_,i)=>{const u=makeUnit(100+i,0,0,0);u.converted=true;u.kind='ally';return u;});
 const later=spawnPlan(s,bigger,()=>0);
 assert.ok(later.threatN>plan.threatN);
});
test('live convert restores a full ally; corpse convert is sixty percent',()=>{
 const s=makeState(),live=makeUnit(1,1,0,0);
 live.hp=12;
 convert(s,live);
 const tpl=allyTemplate(1);
 assert.equal(live.hp,tpl.hp);assert.equal(live.maxHp,tpl.hp);assert.equal(live.atk,tpl.atk);
 const corpse=makeUnit(2,0,0,0);corpse.kind='corpse';corpse.hp=0;
 convert(s,corpse);
 assert.equal(corpse.hp,Math.ceil(allyTemplate(0).hp*.6));
});
test('stick cops reach only at stick length and telegraph before damage',()=>{
 const cop=ENEMIES[1];
 assert.ok(cop.range<=1.4);
 assert.ok(cop.aim>=.5);
 assert.ok(cop.interval>=1.5);
 assert.equal(isRangedEnemy(cop),false);
 assert.ok(hostileWindup(cop)>=.5);
 assert.equal(hostileSwingConnects(cop,1.6,true),false);
 assert.equal(hostileSwingConnects(cop,1.2,true),true);
 assert.equal(hostileSwingConnects(cop,1.2,false),false);
 const u={aiming:false,aim:0,attackCd:0};
 assert.equal(stepHostileMelee(u,cop,1.2,true,.016),'start');
 let t=0,result='windup';
 while(t<.65){t+=.05;result=stepHostileMelee(u,cop,1.2,true,.05);if(result==='hit')break;}
 assert.notEqual(result,'hit');
 assert.equal(stepHostileMelee(u,cop,1.2,true,.2),'hit');
 const dodge={aiming:false,aim:0,attackCd:0};
 assert.equal(stepHostileMelee(dodge,cop,1.2,true,0),'start');
 assert.equal(stepHostileMelee(dodge,cop,2.2,true,.8),'miss');
});
test('elite soldiers outlast and outdamage converted workers',()=>{
 const worker=allyTemplate(0),elite=ENEMIES[5];
 assert.ok(elite.hp>worker.hp*3);
 assert.ok(elite.threshold>=200);
 assert.ok(elite.damage*3>=worker.hp);
});
test('tune console can move alert gates without infection',()=>{
 const s=makeState();s.time=40;assert.equal(threat(s),1);
 try{setTuneValue('alert.stage2At',30);assert.equal(threat(s),2);setTuneValue('difficulty.intervalMin',20);assert.ok(spawnPlan(s,[],()=>0).interval>=20);}
 finally{resetTune();}
});
test('sprint multiplies walk speed; haste adds fifty then one hundred',()=>{
 const s=makeState();assert.equal(speed(s),WALK_SPEED);assert.equal(speed(s,true),WALK_SPEED*SPRINT_MULT);
 s.pending=3;upgrade(s,'haste');assert.equal(speed(s),WALK_SPEED*1.5);
 upgrade(s,'haste');upgrade(s,'haste');assert.equal(speed(s),WALK_SPEED*2);
});
test('frenzy raises max HP and army only helps at level 3',()=>{
 const s=makeState();s.pending=3;upgrade(s,'frenzy');
 const u=makeUnit(1,1,0,0);hit(s,u,0,999);
 assert.equal(s.frenzyHp,1);assert.equal(s.maxHp,101);
 s.abilities.frenzy=3;const a=makeUnit(2,1,0,0);a.fromArmy=true;reward(s,a,false);
 assert.ok(s.frenzyHp>=2);
});
test('killing level 2+ units restocks pistol and shotgun ammo',()=>{
 const s=makeState();s.pending=1;upgrade(s,'guns');
 const before=s.ammo.pistol;grantKillAmmo(s,2);
 assert.equal(s.ammo.pistol,before+3);assert.equal(s.ammo.shotgun,9);
});
test('early XP follows Feishu player growth: 4 then +2 per level, XP equals enemy rank',()=>{
 const s=makeState();upgrade(s,'air');
 assert.equal(s.need,4);assert.equal(xpNeedFor(1),4);assert.equal(xpNeedFor(2),6);assert.equal(xpNeedFor(9),20);
 assert.equal(xpFromUnit(makeUnit(1,0,0,0)),1);assert.equal(xpFromUnit(makeUnit(2,1,0,0)),2);
 for(let i=0;i<3;i++){reward(s,makeUnit(i,0,0,0),true);assert.equal(s.level,1);}
 reward(s,makeUnit(3,0,0,0),true);assert.equal(s.level,2);assert.equal(s.need,6);assert.equal(s.pending,1);
 const cop=makeUnit(20,1,0,0);reward(s,cop,true);assert.equal(s.xp,2);
 assert.equal(upgradeAutoGap(s),3);
 s.level=8;assert.equal(upgradeAutoGap(s),8);
 s.pending=40;for(const a of ABILITIES)while(s.abilities[a.id]<3)upgrade(s,a.id);
 assert.deepEqual(choices(s),[]);assert.equal(levelCap(s),50);
});
test('evolve adds life from player level',()=>{
 const s=makeState();s.pending=1;s.level=4;upgrade(s,'evolve');refreshStats(s);
 assert.equal(s.maxHp,140);
});
test('complete mission chain requires boss defeat, high infection alone never wins',()=>{
 const s=makeState();s.tutorialDone=true;s.infected=40;s.towers=3;s.highestEnemy=5;
 for(let i=0;i<4;i++){assert.equal(missionReady(s),true);s.mission++;}
 assert.equal(missionReady(s),false);assert.equal(outcome(s),null);s.bossDefeated=true;assert.equal(outcome(s),'won');
});
test('boss has 6000 HP, changes stages and takes extra weak-point damage',()=>{
 const b=createBoss(new T.Scene());assert.equal(b.hp,6000);b.active=true;hitBoss(b,100);assert.equal(b.hp,5935);b.weak=2;assert.equal(hitBoss(b,100),250);
 for(let i=0;i<30;i++)hitBoss(b,100);assert.equal(b.dead,true);assert.equal(b.hp,0);
});
test('syringe has visible reservoir and forward muzzle',()=>{
 const s=createSyringe();assert.ok(s.g.children.length>10);assert.ok(s.muzzle.position.z>1.5);assert.ok(s.liquid.material.emissiveIntensity>0);
});
