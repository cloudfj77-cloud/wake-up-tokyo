import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {makeState,makeUnit,resetUnit,hit,upgrade,choices,rerollChoice,hasRerollPool,reward,tickInfection,stepSimulation,damageAlly,teamCount,outcome,ABILITIES,ENEMIES,hurtMother,missionReady,bossReady,cityAlert,threat,spawnPlan,fodderCount,speed,WALK_SPEED,SPRINT_MULT,setTuneValue,resetTune,meleeSpec,grantKillAmmo,gunInfection,refreshStats,levelCap,convert,allyTemplate,allyMelee,allySeeksHostile,isRangedEnemy,hostileWindup,hostileSwingConnects,stepHostileMelee,xpNeedFor,xpFromUnit,upgradeAutoGap,LAUNCHER_SLOT,launcherSpec,consumeLauncherCharge,hasLauncher,grenadeBlast,makeSpawnQueue,enqueueSpawnTypes,takeSpawnJobs} from './rules.js';
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
 const s=makeState();s.pending=3;for(let i=0;i<3;i++)upgrade(s,'guns');
 assert.equal(gunInfection(s,16),8);
 const u=makeUnit(1,0,0,0);
 assert.equal(hit(s,u,8,16),'hit');
 assert.equal(hit(s,u,8,16),'hit');
 assert.equal(u.infection,16);
 assert.equal(hit(s,u,8,16),'converted');
});
test('launcher is chosen like other skills; level 2 pierces; level 3 empowers after six casts',()=>{
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
 assert.equal(lv1.infection,12);
 assert.equal(consumeLauncherCharge(s),false);
 upgrade(s,'launcher');
 const lv2=launcherSpec(s);
 assert.equal(s.abilities.launcher,2);
 assert.ok(lv2.infection>lv1.infection);
 assert.equal(lv2.pierce,2);
 upgrade(s,'launcher');
 assert.equal(s.abilities.launcher,3);
 let empowered=0;
 for(let i=0;i<7;i++)if(consumeLauncherCharge(s))empowered++;
 assert.equal(empowered,1);
 assert.equal(s.launcherCharge,0);
 const boom=launcherSpec(s,true);
 assert.equal(boom.strong,true);
 assert.ok(boom.infection>=40);
});
test('allied death does not subtract cumulative infection',()=>{
 const s=makeState(),u=makeUnit(1,0,0,0);
 hit(s,u,60,0);damageAlly(u,999,s);assert.equal(teamCount([u]),0);assert.equal(s.infected,1);
});
test('corpse requires air 2, revives before expiration, does not duplicate experience',()=>{
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
 tickInfection(s,[p,u],{x:50,z:50},1);assert.equal(u.infection,80);
});
test('berserkers can infect and attack civilians as well as order units',()=>{
 const worker=makeUnit(1,0,0,0);worker.atk=10;
 const cop=makeUnit(2,1,0,0);
 assert.deepEqual(allyMelee(worker),{damage:10,infection:5});
 assert.equal(allySeeksHostile(worker),true);
 assert.equal(allySeeksHostile(cop),true);
});
test('air 3 army aura does not stack per berserker',()=>{
 const s=makeState();s.abilities.air=3;
 const a=makeUnit(1,0,0,0),b=makeUnit(2,0,0,0),t=makeUnit(3,0,2,0);
 convert(s,a);convert(s,b);
 tickInfection(s,[a,b,t],{x:50,z:50},1);
 assert.equal(t.infection,4);
});
test('shield halves frontal damage only',()=>{
 const s=makeState(),u=makeUnit(1,3,0,0);
 assert.ok(ENEMIES[3].shield);hit(s,u,0,20,true);assert.equal(u.hp,190);hit(s,u,0,20,false);assert.equal(u.hp,170);
});
test('city alert is time-gated, not infection-gated',()=>{
 const s=makeState();assert.equal(cityAlert(s).maxLevel,2);assert.equal(threat(s),1);
 s.infected=40;s.kills=20;s.time=10;assert.equal(threat(s),1);
 s.time=90;assert.equal(cityAlert(s).stage,2);assert.equal(cityAlert(s).maxLevel,3);
 s.time=180;assert.equal(cityAlert(s).stage,3);assert.equal(cityAlert(s).final,true);assert.equal(cityAlert(s).maxLevel,4);
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
test('converted full stats are half of the living enemy, except civilian attack',()=>{
 for(const [type,hp,atk] of [[0,20,10],[1,50,10],[2,50,5],[3,100,15],[4,200,5],[5,150,2.5],[6,75,5]]){
  const e=ENEMIES[type],tpl=allyTemplate(type);
  assert.equal(tpl.hp,hp);
  assert.equal(tpl.atk,atk);
  if(type!==0)assert.equal(tpl.hp,e.hp/2);
 }
 assert.equal(grenadeBlast(ENEMIES[5],0),50);
 assert.equal(grenadeBlast(ENEMIES[5],5),10);
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
test('elite soldiers outlast and outdamage converted workers',()=>{
 const worker=allyTemplate(0),elite=ENEMIES[5];
 assert.equal(worker.hp,20);
 assert.ok(elite.hp>=300);
 assert.ok(elite.threshold>=200);
 assert.ok(elite.hp>worker.hp*3);
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
 s.abilities.air=2;s.abilities.guns=2;s.abilities.dot=2;
 const offered=choices(s,()=>0);
 assert.equal(offered.length,3);
 assert.equal(hasRerollPool(s,offered),false);
 assert.equal(rerollChoice(s,offered,0,()=>0),null);
});
test('evolve adds life from player level',()=>{
 const s=makeState();s.pending=1;s.level=4;upgrade(s,'evolve');refreshStats(s);
 assert.equal(s.maxHp,140);
});
test('complete mission chain requires boss defeat, high infection alone never wins',()=>{
 const s=makeState();s.infected=40;s.towers=2;s.highestEnemy=3;
 for(let i=0;i<4;i++){assert.equal(missionReady(s),true);s.mission++;}
 assert.equal(missionReady(s),false);assert.equal(outcome(s),null);s.bossDefeated=true;assert.equal(outcome(s),'won');
});
test('destroying both order hubs unlocks the boss without infection requirements',()=>{const s=makeState();s.infected=0;s.towers=1;assert.equal(bossReady(s),false);s.towers=2;assert.equal(bossReady(s),true);});
test('boss has 6000 HP, changes stages and takes extra weak-point damage',()=>{
 const b=createBoss(new T.Scene());assert.equal(b.hp,6000);b.active=true;hitBoss(b,100);assert.equal(b.hp,5935);b.weak=2;assert.equal(hitBoss(b,100),250);
 for(let i=0;i<30;i++)hitBoss(b,100);assert.equal(b.dead,true);assert.equal(b.hp,0);
});
test('syringe has visible reservoir and forward muzzle',()=>{
 const s=createSyringe();assert.ok(s.g.children.length>10);assert.ok(s.muzzle.position.z>1.5);assert.ok(s.liquid.material.emissiveIntensity>0);
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
