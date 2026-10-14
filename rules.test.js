import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {makeState,ownedAbilities,makeUnit,resetUnit,hit,upgrade,choices,rerollChoice,hasRerollPool,reward,tickInfection,stepSimulation,damageAlly,teamCount,outcome,ABILITIES,ENEMIES,hurtMother,bossReady,cityAlert,alertValue,tickRunClock,threat,unitWeight,spawnPlan,fodderCount,speed,WALK_SPEED,SPRINT_MULT,setTuneValue,resetTune,meleeSpec,grantKillAmmo,gunInfection,refreshStats,levelCap,convert,allyTemplate,allyMelee,allySeeksHostile,guardMoveTarget,GUARD_LEASH,isRangedEnemy,guardRoster,guardMissing,guardWanted,PURIFY_MAX,hostileWindup,hostileSwingConnects,stepHostileMelee,beginShieldCharge,stepShieldCharge,shieldChargeHits,beginPurifierSpray,stepPurifierSpray,purifierConeHit,xpNeedFor,xpFromUnit,upgradeAutoGap,promoteType,LAUNCHER_SLOT,launcherSpec,consumePowerCharge,recordPowerHit,canChargePower,POWER_HITS,hasLauncher,weaponSlots,grenadeBlast,radioBackup,AIRSTRIKE,planePhase,onStrafeLane,armyCandidate,tankTreadKind,tankShove,isMechanical,makeSpawnQueue,enqueueSpawnTypes,enqueueSpawnJobs,takeSpawnJobs,publishWeakenTasks,completeWeaken,closeWeakenTasks,bossWeakenMods,planArmyWave,armySlot,planCivilianSpot,streetStroll,isRoadside,countStreetCivilians,splitArmyWave,PATROL_KEEP,shouldCullTroop,TROOP_CULL} from './rules.js';
import {createBoss,hitBoss,canBossBombTarget} from './boss.js';
import {createSyringe} from './syringe.js';

test('mother survives one bullet and dies on second; tough does not raise max HP',()=>{
 const s=makeState();s.pending=1;upgrade(s,'tough');
 reward(s,makeUnit(1,2,0,0),true);
 assert.equal(s.maxHp,100);
 assert.equal(hurtMother(s,50),false);
 assert.equal(s.hp,57.5);              // 1 级减伤 15%
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
 assert.equal(u.hp,20);
 assert.equal(u.maxHp,20);
 assert.equal(s.infected,1);
});
test('one heavy attack converts a citizen',()=>{
 const s=makeState(),u=makeUnit(1,0,0,0),heavy=meleeSpec(s,'heavy');
 assert.equal(heavy.infection,20);
 assert.equal(hit(s,u,heavy.infection,heavy.damage),'converted');
 assert.equal(s.infected,1);
});
test('guns level 3 convert infection is half weapon damage',()=>{
 const s=makeState();s.abilities.guns=3; // restored legacy checkpoint
 assert.equal(gunInfection(s,16),8);
 const u=makeUnit(1,0,0,0);
 assert.equal(hit(s,u,8,16),'hit');
 assert.equal(hit(s,u,8,16),'hit');
 assert.equal(u.infection,16);
 assert.equal(hit(s,u,8,16),'converted');
});
test('launcher upgrades unlock piercing and three-hit shared power charge',()=>{
 const s=makeState();
 assert.equal(s.abilities.launcher,0);
 assert.equal(s.weapon,-1);
 assert.equal(hasLauncher(s),false);
 assert.equal(launcherSpec(s),null);
 s.pending=3;
 assert.equal(upgrade(s,'launcher'),true);
 assert.equal(s.abilities.launcher,1);
 assert.equal(s.weapon,LAUNCHER_SLOT);
 const lv1=launcherSpec(s);
 assert.equal(lv1.pierce,0);
 assert.equal(lv1.infection,8);
 // 漫画包的普通针剂只累积感染。
 assert.equal(lv1.damage,0);
 assert.equal(consumePowerCharge(s),false);
 upgrade(s,'launcher');
 const lv2=launcherSpec(s);
 assert.equal(s.abilities.launcher,2);
 assert.ok(lv2.infection>lv1.infection);
 assert.equal(lv2.pierce,2);
 assert.equal(lv2.damage,0);
 upgrade(s,'launcher');
 assert.equal(s.abilities.launcher,3);
 assert.equal(canChargePower(s),true);
 for(let i=0;i<POWER_HITS;i++){
  assert.equal(consumePowerCharge(s),false,'firing alone never fills a ring');
  assert.equal(recordPowerHit(s,{eligible:true}),true);
 }
 assert.equal(consumePowerCharge(s),true);
 assert.equal(s.powerCharge,0);
 assert.equal(consumePowerCharge(s),false);
 const boom=launcherSpec(s,true);
 assert.equal(boom.strong,true);
 assert.ok(boom.infection>=30);
 assert.ok(boom.damage>0);
});
test('allied death does not subtract cumulative infection',()=>{
 const s=makeState(),u=makeUnit(1,0,0,0);
 hit(s,u,60,0);damageAlly(u,999,s);assert.equal(teamCount([u]),0);assert.equal(s.infected,1);
});
test('corpse requires air 2, revives before expiration, does not duplicate experience',()=>{
 // 2 阶感染上限是 50。空气 2 级每秒 8 点，从 20 点起四秒能跨过上限。
 const s=makeState(),u=makeUnit(1,2,0,0);u.infection=20;hit(s,u,0,999);
 assert.equal(u.kind,'corpse');const xp=s.xp;
 s.abilities.air=1;tickInfection(s,[u],{x:0,z:0},1);assert.equal(u.kind,'corpse');
 s.abilities.air=2;tickInfection(s,[u],{x:0,z:0},4);assert.equal(u.kind,'ally');assert.equal(s.xp,xp);
});
test('air level 1 adds 4 infection per second in 5m',()=>{
 const s=makeState(),u=makeUnit(1,0,1,0);s.abilities.air=1;
 tickInfection(s,[u],{x:0,z:0},1);assert.equal(u.infection,4);
});
test('card selection pauses time, corpse expiration and infection growth',()=>{
 const s=makeState(),u=makeUnit(1,2,0,0);hit(s,u,0,999);s.abilities.air=2;
 const before=JSON.stringify({s,u});stepSimulation(s,[u],{x:0,z:0},20,'upgrade');
 assert.equal(JSON.stringify({s,u}),before);
});
test('purifier drains infection and reverses after conversion',()=>{
 const s=makeState(),p=makeUnit(1,4,1,0),u=makeUnit(2,3,0,0);u.infection=80;
 tickInfection(s,[p,u],{x:50,z:50},1);assert.equal(u.infection,76);
 hit(s,p,340,0);assert.equal(p.converted,true);
 // 同化后的净化士兵反过来帮玩家扩散，每秒 4 点，和清感染同一档。
 tickInfection(s,[p,u],{x:50,z:50},1);assert.equal(u.infection,80);
});
test('purifiers never stack: a squad only purifies as fast as one of them',()=>{
 const s=makeState();s.abilities.air=3;
 const target=makeUnit(1,5,0,0);target.infection=100;
 const squad=Array.from({length:6},(_,i)=>makeUnit(10+i,4,.5,0));
 // 空气 3 级 +12/秒。六个净化士兵如果各清 4 点会把进度倒扣，现在只按一个算。
 tickInfection(s,[target,...squad],{x:0,z:0},1);
 assert.equal(target.purified,PURIFY_MAX);
 assert.equal(target.purified,4,'围六个也只清每秒 4 点');
 assert.equal(target.infection,100+12-PURIFY_MAX);
 assert.ok(target.infection>100,'感染仍在推进，不再被净化锁死');
 // 一个和六个的净化完全一样，多出来的净化兵不再有影响。
 const one=makeUnit(20,5,0,0);one.infection=100;
 tickInfection(s,[one,makeUnit(21,4,.5,0)],{x:0,z:0},1);
 assert.equal(one.purified,target.purified);
 assert.equal(one.infection,target.infection);
});
test('purifier warns for about a second, then sprays the locked cone for at least two seconds',()=>{
 const spec=ENEMIES[4];
 assert.equal(spec.sprayWindup,1);
 assert.equal(spec.spraySustain,2);
 const u={x:0,z:0,attackCd:0};
 assert.equal(beginPurifierSpray(u,spec,0),'start');
 assert.equal(u.sprayPhase,'windup');
 for(let t=0;t<.95;t+=.05)assert.equal(stepPurifierSpray(u,spec,true,.05),'windup','预警这一秒还不出伤');
 assert.equal(stepPurifierSpray(u,spec,false,.05),'hit');
 assert.equal(u.sprayPhase,'spray');
 // 这块扇形已经空了，也要先喷满大约 2 秒再停。
 let steps=0,last='';
 while(u.sprayPhase==='spray'&&steps<80){last=stepPurifierSpray(u,spec,false,.05);steps++;}
 assert.ok(steps>=38,'空了也至少再喷接近 2 秒');
 assert.equal(u.sprayPhase,'');
 assert.ok(last==='hit'||last==='stop');
 const keep={x:0,z:0};
 beginPurifierSpray(keep,spec,0);
 for(let t=0;t<1;t+=.05)stepPurifierSpray(keep,spec,true,.05);
 for(let t=0;t<2.5;t+=.05)stepPurifierSpray(keep,spec,true,.05);
 assert.equal(keep.sprayPhase,'spray','扇形里还有人就继续喷');
 assert.equal(purifierConeHit(keep,spec,{x:0,z:4}),true);
 assert.equal(purifierConeHit(keep,spec,{x:4,z:0}),false);
 assert.equal(purifierConeHit(keep,spec,{x:0,z:9}),false);
});
test('berserkers can infect and attack civilians as well as order units',()=>{
 const worker=makeUnit(1,0,0,0);worker.atk=10;
 const cop=makeUnit(2,1,0,0);
 assert.deepEqual(allyMelee(worker),{damage:10,infection:5});
 assert.equal(allySeeksHostile(worker),true);
 assert.equal(allySeeksHostile(cop),true);
});
test('air 3 stays on the player and does not spread from allies',()=>{
 const s=makeState();s.abilities.air=3;
 const a=makeUnit(1,0,0,0),t=makeUnit(2,0,2,0);
 convert(s,a);
 tickInfection(s,[a,t],{x:50,z:50},1);
 assert.equal(t.infection,0);
});
test('shield halves frontal damage only',()=>{
 const s=makeState(),u=makeUnit(1,3,0,0);
 const hp=u.hp;assert.ok(ENEMIES[3].shield);hit(s,u,0,20,true);assert.equal(u.hp,hp-10);hit(s,u,0,20,false);assert.equal(u.hp,hp-30);
});
test('shield cop winds up briefly then dashes a fixed lane',()=>{
 const spec=ENEMIES[3],gun=ENEMIES[6];
 assert.equal(spec.cone,undefined);
 assert.ok(spec.hp>=240&&gun.hp>=200);
 assert.ok(gun.damage>ENEMIES[2].damage);
 assert.ok(spec.charge.windup<=.6&&spec.charge.knock===1);
 assert.equal(isRangedEnemy(spec),false);
 const u=makeUnit(1,3,0,0);
 assert.equal(beginShieldCharge(u,spec,0),'start');
 assert.equal(stepShieldCharge(u,spec,spec.charge.windup-.05),'windup');
 assert.equal(u.chargeStep,0);
 assert.equal(stepShieldCharge(u,spec,.1),'dash');
 let moved=u.chargeStep,guard=0;
 while(u.chargePhase==='dash'&&guard++<40){stepShieldCharge(u,spec,.05);moved+=u.chargeStep||0;}
 assert.equal(u.chargePhase,'');
 assert.ok(Math.abs(moved-spec.charge.distance)<.02);
 assert.equal(u.attackCd,spec.interval);
 u.chargeYaw=0;u.x=0;u.z=0;
 assert.equal(shieldChargeHits(u,spec,{x:0,z:1}),true);
 assert.equal(shieldChargeHits(u,spec,{x:0,z:-1}),false);
 assert.equal(shieldChargeHits(u,spec,{x:2,z:.4}),false);
});
test('city alert follows earned xp and time, not level or infection',()=>{
 const s=makeState();assert.equal(alertValue(s),0);assert.equal(cityAlert(s).stage,1);assert.equal(cityAlert(s).maxLevel,1);
 s.infected=40;s.kills=20;s.level=20;s.alertTime=10;assert.equal(threat(s),1);assert.equal(alertValue(s),1);
 s.xpEarned=27;assert.equal(alertValue(s),10);assert.equal(cityAlert(s).stage,2);assert.equal(cityAlert(s).name,'局部警情');
 s.xpEarned=300;s.alertTime=0;assert.equal(alertValue(s),100);assert.equal(cityAlert(s).stage,3);
 s.xpEarned=900;assert.equal(cityAlert(s).stage,4);assert.equal(cityAlert(s).maxLevel,4);
 s.xpEarned=1500;assert.equal(alertValue(s),500);assert.equal(tickRunClock(s,0).started,true);assert.equal(s.bossCountdown,120);
});
test('early stock refill supplies patrols without a threat wave',()=>{
 const s=makeState();const units=[makeUnit(1,0,0,0),makeUnit(2,1,1,1)];
 const plan=spawnPlan(s,units,()=>0,{x:0,z:0});
 assert.equal(plan.stage,1);assert.equal(plan.threatN,0);assert.deepEqual(plan.rush,[]);
 assert.ok(plan.patrol.every(t=>t===1));assert.ok(plan.civilians.every(t=>t===0));
 assert.ok(plan.interval>=3&&plan.interval<=5);
 const crowded=Array.from({length:4},(_,i)=>makeUnit(10+i,1,i,0));
 const full=spawnPlan(s,crowded,()=>0,{x:0,z:0});
 assert.deepEqual(full.rush,[]);assert.ok(full.waveWeight===0);
});
test('far enemy troops are removed while nearby and infected ones stay',()=>{
 const far=makeUnit(1,5,0,0);far.rush=true;
 assert.equal(shouldCullTroop(far,TROOP_CULL),true);
 assert.equal(shouldCullTroop(far,TROOP_CULL-1),false);
 far.infection=3;assert.equal(shouldCullTroop(far,80),false);
 const ally=makeUnit(2,1,0,0);ally.converted=true;ally.kind='ally';
 assert.equal(shouldCullTroop(ally,80),false);
 assert.equal(shouldCullTroop(makeUnit(3,0,0,0),80),false);
 const corpse=makeUnit(4,2,0,0);corpse.kind='corpse';corpse.dead=true;
 assert.equal(shouldCullTroop(corpse,80),true);
});
test('city civilians fill the fodder quota until lockdown',()=>{
 const s=makeState();
 const street=Array.from({length:48},(_,i)=>makeUnit(i,0,i%4%2?20:-20,i%4>=2?20:-20,true));
 for(let region=0;region<4;region++)for(let i=0;i<2;i++)street.push(makeUnit(100+region*2+i,1,region%2?20:-20,region>=2?20:-20));
 assert.equal(fodderCount(street,1),48);
 const dump=spawnPlan(s,street,()=>0);
 assert.equal(dump.fodderN,0);
 s.level=6;s.xpEarned=500;
 const few=[makeUnit(200,0,0,0,true)];
 const locked=spawnPlan(s,few,()=>0);
 assert.equal(locked.stage,3);
 assert.ok(locked.types.some(t=>ENEMIES[t].level===2));
});
test('empty field dumps civilians; army size raises threats after alert rises',()=>{
 const s=makeState();
 const empty=spawnPlan(s,[],()=>0);
 assert.equal(empty.fodderN,8);
 assert.ok(empty.civilians.every(t=>t===0));assert.ok(empty.patrol.every(t=>t===1));assert.deepEqual(empty.rush,[]);
 s.level=8;s.xpEarned=500;
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
test('converted full stats are half of the living enemy, except civilian attack',()=>{
 for(const [type,hp,atk] of [[0,20,10],[1,60,10],[2,60,5],[3,170,25],[4,200,5],[5,150,2.5],[6,150,10]]){
  const e=ENEMIES[type],tpl=allyTemplate(type);
  assert.equal(tpl.hp,hp);
  assert.equal(tpl.atk,atk);
  if(type!==0)assert.equal(tpl.hp,e.hp/2);
 }
 assert.equal(ENEMIES[5].grenade,undefined);
 assert.equal(grenadeBlast(ENEMIES[5],0),0);
 assert.equal(allyTemplate(1).name,'狂暴持棍巡警');
 assert.equal(allyTemplate(5).name,'狂暴大兵');
 assert.equal(allyTemplate(6).name,'狂暴持枪特警');
 assert.notEqual(allyTemplate(1).name,ENEMIES[1].name);
 assert.equal(ENEMIES[2].level,2);
 assert.equal(ENEMIES[6].level,3);
 assert.equal(isRangedEnemy(ENEMIES[4]),false);
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
test('rank 2 and 3 soldiers keep the raised health, infection cap, and rank 3 damage',()=>{
 const stick=ENEMIES[1],gun=ENEMIES[2],shield=ENEMIES[3],eliteGun=ENEMIES[6];
 assert.equal(stick.level,2);assert.equal(stick.hp,120);assert.equal(stick.threshold,50);assert.equal(stick.damage,20);
 assert.equal(gun.level,2);assert.equal(gun.hp,120);assert.equal(gun.threshold,50);assert.equal(gun.damage,10);
 assert.equal(shield.level,3);assert.equal(shield.hp,340);assert.equal(shield.threshold,220);assert.equal(shield.damage,50);
 assert.equal(eliteGun.level,3);assert.equal(eliteGun.hp,300);assert.equal(eliteGun.threshold,170);assert.equal(eliteGun.damage,20);
 assert.ok(eliteGun.damage>gun.damage&&shield.damage>stick.damage);
});
test('elite soldiers outlast and outdamage converted workers',()=>{
 const worker=allyTemplate(0),elite=ENEMIES[5];
 assert.equal(worker.hp,20);
 assert.ok(elite.hp>=300);
 assert.ok(elite.threshold>=200);
 assert.ok(elite.hp>worker.hp*3);
});
test('tune console can move alert gates without infection',()=>{
 const s=makeState();s.xpEarned=200;assert.equal(threat(s),2);
 try{setTuneValue('alert.stage2At',80);assert.equal(threat(s),1);setTuneValue('alert.stage2At',10);assert.equal(threat(s),2);}
 finally{resetTune();}
});
test('sprint multiplies walk speed; haste adds fifteen then thirty',()=>{
 const s=makeState();assert.equal(speed(s),WALK_SPEED);assert.equal(speed(s,true),WALK_SPEED*SPRINT_MULT);
 s.pending=3;upgrade(s,'haste');assert.equal(speed(s),WALK_SPEED*1.15);
 upgrade(s,'haste');upgrade(s,'haste');assert.equal(speed(s),WALK_SPEED*1.3);
});
test('kill burst starts at half speed again and eases back instead of doubling',()=>{
 const s=makeState();s.pending=3;upgrade(s,'haste');upgrade(s,'haste');
 const base=speed(s);
 s.burstTime=3;assert.equal(speed(s),base*1.5);
 s.burstTime=1.5;assert.ok(Math.abs(speed(s)-base*1.25)<1e-9);
 s.burstTime=0;assert.equal(speed(s),base);
});
test('tough no longer regenerates and damage reduction was lowered',()=>{
 const s=makeState();s.pending=3;for(let i=0;i<3;i++)upgrade(s,'tough');
 s.hp=80;
 stepSimulation(s,[],{x:0,z:0},1,'playing');
 assert.equal(s.hp,80);                // 3 级不再每 0.5 秒回血
 hurtMother(s,100);
 assert.equal(s.hp,15);                // 减伤 35%：100 伤害只吃 65
});
test('frenzy grows 1/2/3 HP; army rewards improve at levels 2 and 3',()=>{
 const s=makeState();s.pending=3;upgrade(s,'frenzy');
 const u=makeUnit(1,1,0,0);hit(s,u,0,999);
 assert.equal(s.frenzyHp,1);assert.equal(s.maxHp,101);
 s.abilities.frenzy=2;
 const a=makeUnit(2,1,0,0);a.fromArmy=true;reward(s,a,false);
 assert.equal(s.frenzyHp,1);assert.equal(s.armyFrenzy,1);
 const b=makeUnit(3,1,0,0);b.fromArmy=true;reward(s,b,false);
 assert.equal(s.frenzyHp,2);assert.equal(s.armyFrenzy,0);
 s.abilities.frenzy=3;reward(s,{...makeUnit(4,1,0,0),fromArmy:true},false);
 assert.equal(s.frenzyHp,3);
 reward(s,makeUnit(5,0,0,0),true);assert.equal(s.frenzyHp,6);

});
test('killing level 2+ units restocks pistol and shotgun ammo',()=>{
 const s=makeState();s.abilities.guns=1;
 const before=s.ammo.pistol;grantKillAmmo(s,2);
 assert.equal(s.ammo.pistol,before+3);assert.equal(s.ammo.shotgun,1);
});
test('XP need is a mild exponential plus a flat correction, and XP equals enemy rank',()=>{
 const s=makeState();upgrade(s,'air');
 assert.equal(s.need,8);assert.equal(xpNeedFor(1),8);assert.equal(xpNeedFor(2),18);assert.equal(xpNeedFor(5),57);assert.equal(xpNeedFor(8),78);assert.equal(xpNeedFor(15),120);assert.equal(xpNeedFor(31)-xpNeedFor(30),6);assert.equal(xpNeedFor(50)-xpNeedFor(49),6);
 assert.equal(xpFromUnit(makeUnit(1,0,0,0)),1);assert.equal(xpFromUnit(makeUnit(2,1,0,0)),2);
 for(let i=0;i<3;i++){reward(s,makeUnit(i,0,0,0),true);assert.equal(s.level,1);}
 assert.equal(s.xpEarned,3);assert.equal(alertValue(s),1);
 for(let i=3;i<7;i++)reward(s,makeUnit(i,0,0,0),true);
 assert.equal(s.level,1);
 reward(s,makeUnit(7,0,0,0),true);assert.equal(s.level,2);assert.equal(s.need,18);assert.equal(s.pending,1);
 assert.equal(s.xpEarned,8);assert.equal(alertValue(s),8/3);
 const cop=makeUnit(20,1,0,0);reward(s,cop,true);assert.equal(s.xp,2);
 assert.equal(upgradeAutoGap(s),3);
 s.level=8;assert.equal(upgradeAutoGap(s),8);
 s.pending=40;for(const a of ABILITIES)while(s.abilities[a.id]<3)upgrade(s,a.id);
 assert.deepEqual(choices(s),[]);assert.equal(levelCap(s),50);
});
test('earned xp keeps raising alert after a level-up and after the level cap',()=>{
 const s=makeState();
 reward(s,makeUnit(1,0,0,0),true);
 assert.equal(s.level,1);assert.equal(s.xpEarned,1);assert.equal(alertValue(s),1/3);
 s.level=levelCap(s);s.xp=0;
 reward(s,makeUnit(2,5,0,0),false);
 assert.equal(s.level,levelCap(s));assert.equal(s.xp,0);assert.equal(s.xpEarned,5);assert.equal(alertValue(s),5/3);
});
test('reroll replaces one offered card with an unshown ability',()=>{
 const s=makeState();
 const first=choices(s,()=>0);
 assert.equal(first.length,3);
 assert.equal(hasRerollPool(s,first),true);
 const next=rerollChoice(s,first,1,()=>0);
 assert.ok(next);
 assert.equal(next[0].id,first[0].id);
 assert.equal(next[2].id,first[2].id);
 assert.notEqual(next[1].id,first[1].id);
 assert.equal(first.some(a=>a.id===next[1].id),false);
 assert.ok(s.abilities[next[1].id]<3);
});
test('reroll never brings back an ability already seen this round',()=>{
 const s=makeState();
 const first=choices(s,()=>0);
 const seen=new Set(first.map(a=>a.id));
 const after=rerollChoice(s,first,1,()=>0,seen);
 assert.ok(after);
 seen.add(after[1].id);
 assert.equal(seen.has(first[1].id),true);
 const again=rerollChoice(s,after,0,()=>0,seen);
 assert.ok(again);
 assert.equal(seen.has(again[0].id),false);
 assert.notEqual(again[0].id,first[1].id);
 const other=rerollChoice(s,after,2,()=>0,seen);
 assert.ok(other);
 assert.equal(seen.has(other[2].id),false);
 assert.notEqual(other[2].id,first[1].id);
});
test('reroll is empty when every remaining ability is already on the table',()=>{
 const s=makeState();s.pending=80;
 for(const a of ABILITIES)while(s.abilities[a.id]<3)upgrade(s,a.id);
 s.abilities.air=2;s.abilities.command=2;s.abilities.dot=2;
 const offered=choices(s,()=>0);
 assert.equal(offered.length,3);
 assert.equal(hasRerollPool(s,offered),false);
 assert.equal(rerollChoice(s,offered,0,()=>0),null);
});
test('evolve adds life from player level',()=>{
 const s=makeState();s.pending=1;s.level=4;upgrade(s,'evolve');refreshStats(s);
 assert.equal(s.maxHp,140);
});
test('high infection alone never wins, settling after the boss does',()=>{
 const s=makeState();s.infected=40;s.towers=2;s.highestEnemy=3;
 assert.equal(outcome(s),null);s.bossDefeated=true;assert.equal(outcome(s),null);s.settle=true;assert.equal(outcome(s),'won');
});
test('guards stay inside 20m of the player while ordinary allies are not leashed',()=>{
 const player={x:0,z:0};
 assert.equal(GUARD_LEASH,20);
 assert.deepEqual(guardMoveTarget(player,8,0),{x:8,z:0});
 const far=guardMoveTarget(player,30,0);
 assert.equal(far.x,20);
 assert.equal(far.z,0);
 const diagonal=guardMoveTarget(player,30,40);
 assert.ok(Math.hypot(diagonal.x,diagonal.z)<=20.001);
});
test('command roster counts guards that are waiting to return, so nobody extra is recruited',()=>{
 const s=makeState();
 assert.deepEqual(guardWanted(s),{count:0,type:0});
 assert.equal(guardMissing(s,[]),0);
 s.abilities.command=1;assert.equal(guardWanted(s).count,2);
 s.abilities.command=2;assert.equal(guardWanted(s).count,5);
 s.abilities.command=3;assert.equal(guardWanted(s).count,10);
 s.abilities.command=2;
 const roster=[];
 for(let i=0;i<5;i++){const g=makeUnit(100+i,1,i,0,false,0);g.guard=true;g.kind='ally';roster.push(g);}
 assert.equal(guardRoster(roster),5);
 assert.equal(guardMissing(s,roster),0);
 // 阵亡的护卫仍然占编制：它只是过一会儿归队，不会空出名额再招一个新人。
 roster[0].dead=true;roster[0].kind='fallen';roster[0].guardCd=12;
 assert.equal(guardRoster(roster),5);
 assert.equal(guardMissing(s,roster),0);
 // 编制里混进的普通同化者不算数，不该顶掉护卫名额。
 const ally=makeUnit(200,1,0,0,false,0);ally.kind='ally';
 assert.equal(guardMissing(s,[...roster,ally]),0);
 // 从 2 级升到 3 级时才补人，且只补到 10 名为止。
 s.abilities.command=3;
 assert.equal(guardMissing(s,roster),5);
 const big=[];
 for(let i=0;i<12;i++){const g=makeUnit(300+i,1,i,0,false,0);g.guard=true;g.kind='ally';big.push(g);}
 assert.equal(guardMissing(s,big),0);
});
test('legacy weapon order is preserved and new syringe appends to it',()=>{
 const old=makeState();old.abilities.guns=1;old.weaponOrder=['pistol','shotgun'];old.weapon=0;
 assert.equal(upgrade(old,'launcher'),true);
 assert.deepEqual(weaponSlots(old).map(slot=>slot.id),['pistol','shotgun','launcher']);
 assert.equal(old.weapon,0);
 const fresh=makeState();assert.equal(upgrade(fresh,'guns'),false);
 assert.equal(upgrade(fresh,'launcher'),true);assert.equal(fresh.weapon,LAUNCHER_SLOT);
 assert.deepEqual(weaponSlots(fresh).map(slot=>slot.id),['launcher']);
});
test('countdown publishes three weaken tasks that do not gate the boss',()=>{
 const s=makeState();publishWeakenTasks(s);
 assert.equal(completeWeaken(s,'shield'),true);
 assert.equal(completeWeaken(s,'shield'),false);
 assert.deepEqual(bossWeakenMods(s),{shield:false,empowered:true,rushReinforce:true});
 closeWeakenTasks(s);
 assert.equal(completeWeaken(s,'fire'),false);
 assert.equal(bossReady(s),false);
});
test('boss countdown, not hubs, summons the boss',()=>{
 const s=makeState();s.towers=2;assert.equal(bossReady(s),false);
 s.xpEarned=1500;const started=tickRunClock(s,0);assert.equal(started.started,true);
 const done=tickRunClock(s,120);assert.equal(done.summon,true);assert.equal(bossReady(s),true);
 s.aftermath=true;assert.equal(cityAlert(s).stage,7);reward(s,makeUnit(1,0,0,0),true);assert.equal(s.infected,0);
});
test('boss has 6000 HP, changes stages and takes extra weak-point damage',()=>{
 const b=createBoss(new T.Scene());assert.equal(b.hp,6000);assert.ok(b.mouthGlow);assert.equal(b.orbWindup,0);b.active=true;hitBoss(b,100);assert.equal(b.hp,5935);b.weak=2;assert.equal(hitBoss(b,100),250);
 for(let i=0;i<30;i++)hitBoss(b,100);assert.equal(b.dead,true);assert.equal(b.hp,0);
});
test('boss bombs only target its nearby river bank',()=>{const b={x:33,z:-24};assert.equal(canBossBombTarget(b,{x:28,z:-12}),true);assert.equal(canBossBombTarget(b,{x:-20,z:-12}),false);assert.equal(canBossBombTarget(b,{x:30,z:20}),false);});
test('syringe has visible reservoir and forward muzzle',()=>{
 const s=createSyringe();assert.ok(s.g.children.length>10);assert.ok(s.muzzle.position.z>1.5);assert.ok(s.liquid.material.emissiveIntensity>0);
});
test('army rushes from outside the facing while civilians stay a street refill',()=>{
 const s=makeState();s.level=8;s.xpEarned=500;
 const allies=Array.from({length:20},(_,i)=>{const u=makeUnit(i,0,0,0);u.converted=true;u.kind='ally';return u;});
 const plan=spawnPlan(s,allies,()=>0,{x:0,z:0});
 assert.ok(plan.interval>=3&&plan.interval<=5);
 assert.ok(plan.rush.length>=1);
 assert.ok(plan.patrol.length>=1);
 assert.ok(plan.rush.every(t=>t>0));
 assert.ok(plan.patrol.every(t=>t>0));
 assert.equal(plan.rush.length,plan.threatN);
 assert.ok(plan.civilians.every(t=>t===0));
 assert.ok(plan.fodderN<=8);
 const parked=splitArmyWave([1,1,2,2,3,3],0);
 assert.ok(parked.patrol.length>=1&&parked.rush.length>=1);
 assert.equal(parked.patrol.length+parked.rush.length,6);
 const fullStreet=splitArmyWave([1,2,3,4],PATROL_KEEP);
 assert.equal(fullStreet.patrol.length,0);
 assert.equal(fullStreet.rush.length,4);
 const facing={x:0,z:1};
 const wave=planArmyWave(facing,4,()=>0);
 assert.equal(wave.behind,true);
 const slot=armySlot(wave,1,()=>.5);
 assert.ok(slot.x*facing.x+slot.z*facing.z<0);
 const side=planArmyWave(facing,2,()=>.9);
 assert.equal(side.behind,false);
 const flank=armySlot(side,0,()=>.5);
 assert.ok(flank.x*facing.x+flank.z*facing.z<flank.dist*.5);
 const block=[{x:0,z:0,w:10,d:4}];
 assert.equal(isRoadside(block,8,0),true);
 assert.equal(isRoadside(block,0,0),false);
 const spot=planCivilianSpot({x:0,z:0},{x:0,z:1},block,()=>.2);
 assert.ok(spot.z>0);
 const step=streetStroll(8,0,block,()=>0);
 assert.ok(Math.hypot(step.x-8,step.z)>6);
 const nearby=countStreetCivilians([makeUnit(1,0,3,0),makeUnit(2,1,0,0)],{x:0,z:0},32);
 assert.equal(nearby.near,1);
 const queue=makeSpawnQueue();
 enqueueSpawnJobs(queue,[{type:1,role:'army'},{type:1,role:'patrol'},{type:0,role:'civilian'}]);
 assert.deepEqual(takeSpawnJobs(queue,0,3,.08).map(j=>j.role),['army','patrol','civilian']);
});
test('spawn queue releases soldiers in small bursts instead of all at once',()=>{
 const queue=makeSpawnQueue();
 enqueueSpawnTypes(queue,[1,1,2,2,3,3]);
 assert.equal(queue.jobs.length,6);
 const first=takeSpawnJobs(queue,0,2,.08);
 assert.deepEqual(first.map(j=>j.type),[1,1]);
 assert.equal(queue.jobs.length,4);
 assert.ok(queue.wait>0);
 assert.equal(takeSpawnJobs(queue,.04,2,.08).length,0);
 const second=takeSpawnJobs(queue,.08,2,.08);
 assert.deepEqual(second.map(j=>j.type),[2,2]);
 const rest=takeSpawnJobs(queue,1,2,.08);
 assert.deepEqual(rest.map(j=>j.type),[3,3]);
 assert.equal(queue.jobs.length,0);
 assert.equal(queue.wait,0);
});
test('resetUnit clears combat leftovers so pooled records can be reused',()=>{
 const u=makeUnit(9,6,1,2,false,3);
 u.kind='fallen';u.dead=true;u.converted=true;u.infection=80;u.aiming=true;u.aim=1;u.guard=true;u.atk=99;
 resetUnit(u,40,1,-3,8,false,1);
 assert.equal(u.id,40);
 assert.equal(u.type,1);
 assert.equal(u.kind,'guard');
 assert.equal(u.dead,false);
 assert.equal(u.converted,false);
 assert.equal(u.infection,0);
 assert.equal(u.hp,ENEMIES[1].hp);
 assert.equal(u.aiming,false);
 assert.equal(u.guard,false);
 assert.equal(u.atk,undefined);
});

test('one trigger press gives at most one ring across pellets, piercing and late impacts',()=>{
 const s=makeState();s.abilities.launcher=3;
 const shot={eligible:true};
 for(let i=0;i<6;i++)recordPowerHit(s,shot);
 assert.equal(s.powerCharge,1);
 recordPowerHit(s,{eligible:true});recordPowerHit(s,{eligible:true});
 const lateShot={eligible:true};recordPowerHit(s,lateShot);
 assert.equal(s.powerCharge,3);
 assert.equal(consumePowerCharge(s),true);
 assert.equal(recordPowerHit(s,lateShot),false,'a shot already hitting at full charge cannot refill after discharge');
 assert.equal(recordPowerHit(s,{eligible:true,empowered:true}),false);
 assert.equal(recordPowerHit(s,undefined),false,'army, melee and environmental effects do not charge');
 assert.equal(s.powerCharge,0);
});
test('three-hit charge stays locked until the level-three launcher upgrade',()=>{
 const s=makeState();s.abilities.guns=3;s.abilities.launcher=2;
 assert.equal(recordPowerHit(s,{eligible:true}),false);
 assert.equal(s.powerCharge,0);
});


test('ability HUD follows first acquisition and upgrades never reorder an icon',()=>{
 const s=makeState();s.pending=5;
 for(const id of ['command','haste','air','haste','launcher'])upgrade(s,id);
 assert.deepEqual(ownedAbilities(s).map(a=>a.id),['command','haste','air','launcher']);
 assert.equal(s.abilities.haste,2);
});
test('ability order ignores unowned history and fills missing legacy history without gaps',()=>{
 const s=makeState();s.abilities.haste=2;s.abilities.air=1;s.abilities.guns=3;
 s.history=[{id:'haste'},{id:'removed'},{id:'command'},{id:'haste'}];
 assert.deepEqual(ownedAbilities(s).map(a=>a.id),['haste','air']);
 delete s.history;
 assert.deepEqual(ownedAbilities(s).map(a=>a.id),['air','haste']);
 assert.deepEqual(ownedAbilities(makeState()),[]);
});
test('evolve 3 promotes newly converted units one tier up instead of only padding HP',()=>{
 const s=makeState();s.pending=3;for(let i=0;i<3;i++)upgrade(s,'evolve');
 assert.equal(ENEMIES[promoteType(0)].level,2);
 assert.equal(ENEMIES[promoteType(1)].level,3);
 assert.equal(ENEMIES[promoteType(3)].level,4);
 assert.equal(promoteType(4),4,'top-tier units have nothing above them, so they keep their type');
 const u=makeUnit(9,0,0,0);u.infection=u.threshold;
 convert(s,u);
 assert.equal(u.promoted,true);
 assert.equal(ENEMIES[u.type].level,2);
 assert.equal(u.threshold,ENEMIES[u.type].threshold);
 assert.equal(u.maxHp,allyTemplate(u.type).hp);
 // 本来就是 4 级的单位没有更高形态，退回旧的血量乘数，别把它变成负收益。
 const top=makeUnit(10,4,0,0);top.infection=top.threshold;
 convert(s,top);
 assert.equal(top.promoted,false);
 assert.equal(top.type,4);
 assert.equal(top.rankBoost,true);
 assert.ok(top.maxHp>allyTemplate(4).hp,'the fallback boost still lands on the ally template HP');
});
test('hammer brute is a slow high-HP melee bruiser with long windup and area damage',()=>{
 const spec=ENEMIES[7];
 assert.equal(spec.level,4);
 assert.ok(spec.slam?.radius>0,'damage lands in a radius around itself');
 assert.ok(spec.hp>ENEMIES[4].hp&&spec.hp>ENEMIES[5].hp);
 assert.ok(spec.threshold>ENEMIES[4].threshold,'needs far more infection than other tier-4 troops');
 assert.ok(spec.aim>ENEMIES[3].aim,'windup is longer than the shielded riot police');
 assert.ok(spec.speed<ENEMIES[4].speed);
 assert.equal(isRangedEnemy(spec),false,'it stays a melee unit despite the wide swing');
 assert.ok(spec.allyHp>0&&spec.allyAtk>0);
});
test('grenadier lobs one flat 50-damage bomb each second and the ally is half',()=>{
 const spec=ENEMIES[8];
 assert.equal(spec.name,'掷弹兵');
 assert.equal(spec.level,4);
 assert.equal(spec.hp,400);
 assert.equal(spec.threshold,300);
 assert.equal(unitWeight(8),20);
 assert.equal(spec.bomber,true);
 assert.equal(spec.grenade.cd,1);
 assert.equal(spec.grenade.radius,2);
 assert.equal(spec.grenade.lob,true);
 assert.ok(spec.grenade.fall>=.8,'the bomb stays in the air long enough to warn');
 assert.equal(grenadeBlast(spec,0),50);
 assert.equal(grenadeBlast(spec,2),50);
 assert.equal(grenadeBlast(spec,2.01),0);
 assert.equal(isRangedEnemy(spec),false);
 const ally=allyTemplate(8);
 assert.equal(ally.name,'狂暴掷弹兵');
 assert.equal(ally.hp,200);
 assert.equal(ally.atk,25);
});


test('evolve promotion preserves the original enemy XP, ammunition and recap',()=>{
 for(const type of [0,6,4]){
  const states=[0,3].map(evolve=>{
   const s=makeState();s.abilities.evolve=evolve;s.abilities.guns=3;
   const u=makeUnit(99,type,0,0,type===0);
   assert.equal(hit(s,u,u.threshold,0),'converted');
   if(type!==4)assert.equal(ENEMIES[u.type].level,ENEMIES[type].level+(evolve===3?1:0));
   return s;
  });
  const [normal,evolved]=states;
  for(const key of ['xpEarned','highestEnemy','purifiers','cityInfected','infected'])assert.equal(evolved[key],normal[key],key);
  assert.deepEqual(evolved.ammo,normal.ammo);
  assert.deepEqual(evolved.first,normal.first);
 }
});
test('promoting a previously rewarded corpse adds no second XP or higher-tier ammunition',()=>{
 const s=makeState();s.abilities.evolve=3;s.abilities.guns=3;
 const u=makeUnit(99,0,0,0);
 hit(s,u,0,u.hp);assert.equal(s.xpEarned,1);
 assert.equal(convert(s,u),true);assert.equal(s.xpEarned,1);
 assert.deepEqual(s.ammo,{pistol:0,shotgun:0,rifle:0,sniper:0,rpg:0});
 assert.equal(s.first.name,ENEMIES[0].name);assert.equal(s.highestEnemy,1);
 assert.equal(convert(s,u),false);assert.equal(s.infected,1);
});
test('alert upgrades call for backup in English and the army bomb is a flat circle',()=>{
 for(const stage of [2,3,4,5,6]){
  const line=radioBackup(stage);
  assert.match(line,/^[A-Z].*\.$/);
  assert.equal(/[\u4e00-\u9fff]/.test(line),false);
 }
 assert.equal(radioBackup(1),'');
 assert.equal(radioBackup(7),'');
 const spec={grenade:{radius:AIRSTRIKE.radius,max:AIRSTRIKE.damage,min:AIRSTRIKE.damage}};
 assert.equal(grenadeBlast(spec,0),30);
 assert.equal(grenadeBlast(spec,AIRSTRIKE.radius),30);
 assert.equal(grenadeBlast(spec,AIRSTRIKE.radius+.01),0);
 assert.ok(AIRSTRIKE.fall>=1);
 assert.ok(AIRSTRIKE.duration>AIRSTRIKE.interval*2);
 assert.equal(AIRSTRIKE.hp,80);
 assert.ok(AIRSTRIKE.hit>=3);
 assert.equal(planePhase(2,false),'');
 assert.equal(planePhase(3,false),'');
 assert.equal(planePhase(4,false),'stage4');
 assert.equal(planePhase(5,false),'');
 assert.equal(planePhase(6,false),'');
 assert.equal(planePhase(4,true),'boss');
 assert.equal(planePhase(6,true),'boss');
 assert.ok(AIRSTRIKE.strafeWarn>=1);
 assert.ok(AIRSTRIKE.strafeShots>=3);
 const lane={x:0,z:0,dx:1,dz:0,len:10};
 assert.equal(onStrafeLane(5,0,lane,AIRSTRIKE.strafeWidth),true);
 assert.equal(onStrafeLane(5,3,lane,AIRSTRIKE.strafeWidth),false);
});
test('tanks join only the military intervention wave',()=>{
 const tank=ENEMIES.findIndex(e=>e.tank);
 assert.equal(tank,ENEMIES.length-1);
 const military=makeState();military.xpEarned=900;
 const alert4=cityAlert(military);
 assert.equal(alert4.stage,4);
 assert.equal(armyCandidate(tank,alert4),true);
 const countdown=makeState();countdown.xpEarned=1500;countdown.bossCountdown=10;
 assert.equal(armyCandidate(tank,cityAlert(countdown)),false);
 const boss=makeState();boss.bossSpawned=true;
 assert.equal(armyCandidate(tank,cityAlert(boss)),false);
 const lockdown=makeState();lockdown.xpEarned=300;
 assert.equal(armyCandidate(tank,cityAlert(lockdown)),false);
 assert.equal(ENEMIES[tank].grenade.min,ENEMIES[tank].grenade.max);
 assert.ok(ENEMIES[tank].hp>=900);
 assert.equal(unitWeight(tank),40);
 const tread=ENEMIES[tank].tread,driver={x:0,z:0,kind:'guard',treadRadius:tread.radius};
 const soldier={x:.8,z:0,type:5,kind:'guard',hp:300};
 const ally={x:0,z:.9,type:1,kind:'ally',converted:true};
 const person={x:.4,z:0,isPlayer:true};
 const civilian={x:0,z:.6,type:0,kind:'human'};
 const other={x:.7,z:.2,type:tank,kind:'guard'};
 assert.equal(tankTreadKind(driver,soldier),'shove');
 assert.equal(tankTreadKind(driver,ally),'ram');
 assert.equal(tankTreadKind(driver,person),'ram');
 assert.equal(tankTreadKind({...driver,kind:'ally',converted:true},person),'');
 assert.equal(tankTreadKind(driver,civilian),'');
 assert.equal(tankTreadKind(driver,other),'');
 assert.equal(tankTreadKind({...driver,kind:'ally',converted:true},ally),'');
 const shove=tankShove(driver,soldier,tread.radius);
 assert.ok(Math.hypot(soldier.x+shove.x,soldier.z+shove.z)>tread.radius);
 assert.equal(tread.hit,60);
 const mother=makeState();
 hurtMother(mother,tread.hit,'坦克撞击');
 assert.equal(mother.hp,mother.maxHp-60);
 assert.equal(outcome(mother),null);
 const squad=makeUnit(3,1,0,0);squad.kind='ally';squad.converted=true;squad.hp=140;squad.maxHp=140;
 damageAlly(squad,tread.hit,mother);
 assert.equal(squad.dead,false);
 assert.equal(squad.hp,80);
 assert.equal(soldier.hp,300);
 assert.equal(isMechanical(tank),true);
 assert.equal(ENEMIES[tank].threshold,undefined);
 const hull=makeUnit(80,tank,0,0),motherHit=makeState();
 assert.equal(hit(motherHit,hull,999,20),'hit');
 assert.equal(hull.infection,0);
 assert.equal(hull.converted,false);
 assert.equal(hull.hp,ENEMIES[tank].hp-20);
 motherHit.abilities.air=3;motherHit.abilities.dot=3;
 hull.tagged='player';hull.playerInfection=true;hull.infection=400;hull.root=2;hull.slow=true;hull.parasite=true;hull.knock=1;
 tickInfection(motherHit,[hull],{x:0,z:0},1);
 assert.equal(hull.infection,0);
 assert.equal(hull.root,0);
 assert.equal(hull.slow,false);
 assert.equal(hull.parasite,false);
 assert.equal(hull.knock,0);
 assert.equal(convert(motherHit,hull),false);
});
