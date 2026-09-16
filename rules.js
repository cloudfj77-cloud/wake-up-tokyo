export const LEVEL_CAP=30;
export const EVOLVE_CAP=50;
export const BASE_NEED=4;
export const LATE_XP_FROM=10;
export const UPGRADE_AUTO_GAP=8;
export const POPULATION=58;
export const BASE_HP=100;
export const BASE_ATK=20;
export const BASE_INF=10;
export const STAMINA_MAX=100;
export const MELEE={
 light:{mult:1,cd:.75,range:2.8,aoe:0},
 heavy:{mult:2,cd:1.25,range:3.2,aoe:2.6}
};
export const WALK_SPEED=4.6;
export const SPRINT_MULT=1.38;
export const ENEMIES=[
 {name:'苦逼打工人',level:1,hp:50,threshold:20,speed:2.2,damage:5,range:1.6,interval:1.5,aim:.2,fodder:true,allyName:'普通狂暴者',allyHp:60,allyAtk:8},
 {name:'持棍巡警',level:2,hp:100,threshold:40,speed:2.55,damage:10,range:1.35,interval:1.7,aim:.7,fodder:true,allyName:'狂暴持棍巡警',allyHp:110,allyAtk:14},
 {name:'持枪巡警',level:3,hp:120,threshold:60,speed:2.45,damage:12,range:12,interval:1.5,aim:1.05,allyName:'狂暴持枪巡警',allyHp:100,allyAtk:13},
 {name:'持盾特警',level:4,hp:180,threshold:110,speed:2.3,damage:16,range:2.3,interval:1.5,aim:.4,shield:true,allyName:'狂暴盾卫',allyHp:190,allyAtk:15},
 {name:'净化工兵',level:6,hp:240,threshold:340,speed:2.05,damage:14,range:2.8,interval:1.5,aim:.45,purifier:true,aura:8,drain:8,allyName:'狂暴净化士兵',allyHp:220,allyAtk:16},
 {name:'大兵',level:6,hp:280,threshold:260,speed:2.45,damage:28,range:24,interval:1.05,aim:.9,allyName:'狂暴大兵',allyHp:260,allyAtk:32},
 {name:'持枪特警',level:5,hp:170,threshold:180,speed:2.65,damage:24,range:14,interval:1.15,aim:1.05,burst:true,allyName:'狂暴突击手',allyHp:140,allyAtk:20}
];
export const ABILITIES=[
 {id:'air',name:'空气传播',icon:'◌',group:'感染系',descriptions:[
  '自身 5m 内敌人每 0.5 秒 +3 感染。',
  '范围 10m，每 0.5 秒 +5 感染，且可作用于尸体。',
  '范围 15m，每 0.5 秒 +10 感染；军队获得 1 级同效果。'
 ]},
 {id:'guns',name:'枪？枪！',icon:'⌐',group:'武器系',descriptions:[
  '解锁手枪与霰弹枪。击杀/同化 2 级及以上敌人：手枪 +3、霰弹 +1 备弹。',
  '解锁步枪与狙击枪。3 级及以上：步枪 +10、狙击 +3；一级补弹量翻倍。',
  '解锁 RPG。4 级及以上 +1 发。枪械造成攻击力一半的感染。'
 ]},
 {id:'launcher',name:'可感染发射器',icon:'◎',group:'武器系',descriptions:[
  '解锁感染针。命中造成感染，适合叫醒路人。按 2 切换。',
  '针剂感染与伤害提高，并可穿透多名敌人。',
  '连续释放 6 次后，下一次打出强化炮弹。'
 ]},
 {id:'frenzy',name:'狂杀',icon:'⚔',group:'母体系',descriptions:[
  '每次击杀或同化 +1 生命与等量上限。',
  '生命上限达到 500 与 1000 时，各额外获得一次能力进化。',
  '提升量翻倍，体型变大。军队的击杀/同化也为你提供 1 级效果。'
 ]},
 {id:'dot',name:'持续感染',icon:'⌁',group:'感染系',descriptions:[
  '你造成的感染会持续累积，直到同化完成。',
  '持续感染增强，尸体也会继续上涨。',
  '你的军队命中也会挂上同样的持续感染。'
 ]},
 {id:'haste',name:'急速',icon:'↟',group:'机动系',descriptions:[
  '额外获得 50 点移速加成。',
  '奔跑减伤 30%。击杀后爆发移速 3 秒（先翻倍再回落）。',
  '移速加成 100。奔跑减伤 50%，可撞飞敌人造成重击伤害。军队获得 2 级效果。'
 ]},
 {id:'tough',name:'皮糙肉厚',icon:'✚',group:'母体系',descriptions:[
  '获得 20% 减伤。',
  '减伤 30%。10m 内敌人打中你后，减免的伤害反弹，并附加一半感染。',
  '自身减伤 50%，反伤 30m。每 0.5 秒回复 1% 生命。军队获得 1 级减伤。'
 ]},
 {id:'evolve',name:'生存与进化',icon:'✶',group:'成长系',descriptions:[
  '获得等级×10 生命，以及等级点的攻击力。',
  '每生存 1 分钟，上述系数额外 +5%。',
  '等级上限 50（31 级后不再给新能力）。新转化单位等阶 +1。'
 ]},
 {id:'command',name:'听我号令',icon:'⚑',group:'指挥系',descriptions:[
  '可以指挥军队。获得 2 名 2 级护卫，阵亡后会复活。',
  '护卫升 1 阶，人数至 5 人。',
  '护卫再升 1 阶，人数至 10 人。'
 ]}
];
export const GUNS=[
 {id:'pistol',name:'手枪',unlock:1,damage:16,range:16,cd:.32,pellets:1,spread:0,clip:12,speed:38,color:0xc078ff},
 {id:'shotgun',name:'霰弹枪',unlock:1,damage:8,range:8,cd:.9,pellets:6,spread:.12,clip:4,speed:26,color:0xe0a36a},
 {id:'rifle',name:'步枪',unlock:2,damage:14,range:22,cd:.14,pellets:1,spread:.02,clip:24,speed:44,color:0x8fd0ff},
 {id:'sniper',name:'狙击枪',unlock:2,damage:52,range:40,cd:1.35,pellets:1,spread:0,clip:4,speed:58,color:0xf0d48a},
 {id:'rpg',name:'RPG',unlock:3,damage:80,range:26,cd:1.8,pellets:1,spread:0,clip:1,speed:20,color:0xf08a4a,splash:4}
];
export const WEAPONS=GUNS;
// 发射器占用独立武器槽，避免和「枪？枪！」的 0–4 枪械下标挤在一起。
export const LAUNCHER_SLOT=-2;
export function makeState(){
 return {
  hp:BASE_HP,maxHp:BASE_HP,stamina:STAMINA_MAX,infected:0,cityInfected:0,kills:0,towers:0,destroyed:0,
  xp:0,need:xpNeedFor(1),level:1,pending:1,time:0,alert:1,peakAlert:1,
  abilities:{air:0,guns:0,launcher:0,frenzy:0,dot:0,haste:0,tough:0,evolve:0,command:0},
  history:[],ammo:{pistol:0,shotgun:0,rifle:0,sniper:0,rpg:0},
  mags:{pistol:0,shotgun:0,rifle:0,sniper:0,rpg:0},
  clip:0,clipMax:0,weapon:-1,gunId:null,launcherCharge:0,
  first:null,maxChain:0,purifiers:0,highestEnemy:0,mission:0,bossDefeated:false,lastPick:-60,killRewards:[],
  frenzyHp:0,frenzyMarks:{500:false,1000:false},burstTime:0,commandStance:'follow',
  tutorialStep:0,tutorialValue:0,tutorialDone:false,tutorialSkipped:false
 };
}
export function availableAbilities(s){return ABILITIES.filter(a=>s.abilities[a.id]<3);}
export function choices(s,random=Math.random){return availableAbilities(s).map(a=>({a,r:random()})).sort((a,b)=>a.r-b.r).slice(0,3).map(v=>v.a);}
function blockedIds(current,seen){
 const blocked=new Set(seen||[]);
 for(const a of current||[])if(a?.id)blocked.add(a.id);
 return blocked;
}
// 只换指定那一张。本轮已经出过的（含刚刷掉的）和满级能力都不会再出现。
export function rerollChoice(s,current,index,random=Math.random,seen){
 if(!Array.isArray(current)||index<0||index>=current.length)return null;
 const blocked=blockedIds(current,seen);
 const pool=availableAbilities(s).filter(a=>!blocked.has(a.id));
 if(!pool.length)return null;
 const next=current.slice();
 next[index]=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
 return next;
}
export function hasRerollPool(s,current,seen){
 if(!Array.isArray(current)||!current.length)return false;
 const blocked=blockedIds(current,seen);
 return availableAbilities(s).some(a=>!blocked.has(a.id));
}
export function levelCap(s){return s.abilities.evolve>=3?EVOLVE_CAP:LEVEL_CAP;}
export function xpNeedFor(level){
 if(level<LATE_XP_FROM)return BASE_NEED+2*Math.max(0,level-1);
 let n=BASE_NEED+2*(LATE_XP_FROM-2);
 for(let l=LATE_XP_FROM;l<=level;l++)n=Math.ceil(n*1.35+3);
 return n;
}
export function xpFromUnit(u){return ENEMIES[u.type]?.level||1;}
export function upgradeAutoGap(s){return s.level<=6?3:UPGRADE_AUTO_GAP;}
export function evolveCoeff(s){
 if(!s.abilities.evolve)return 0;
 let c=1;
 if(s.abilities.evolve>=2)c+=Math.floor(s.time/60)*.05;
 return c;
}
export function attackPower(s){return BASE_ATK+(s.abilities.evolve?s.level*evolveCoeff(s):0);}
export function meleeSpec(s,kind){
 const m=MELEE[kind];
 const atk=attackPower(s);
 return {infection:BASE_INF*m.mult,damage:atk*m.mult,cd:m.cd,range:m.range,aoe:m.aoe};
}
export function refreshStats(s){
 const evolveHp=s.abilities.evolve?s.level*10*evolveCoeff(s):0;
 const next=Math.round(BASE_HP+s.frenzyHp+evolveHp);
 const delta=next-s.maxHp;
 s.maxHp=next;
 if(delta>0)s.hp+=delta;
 s.hp=Math.min(s.hp,s.maxHp);
 return delta;
}
export function unlockedGuns(s){return GUNS.filter(g=>s.abilities.guns>=g.unlock);}
export function gunById(id){return GUNS.find(g=>g.id===id)||null;}
function addAmmo(s,id,n){s.ammo[id]=Math.min(999,(s.ammo[id]||0)+n);}
export function grantKillAmmo(s,enemyLevel){
 const g=s.abilities.guns;if(!g)return;
 const mult=g>=2?2:1;
 if(g>=1&&enemyLevel>=2){addAmmo(s,'pistol',3*mult);addAmmo(s,'shotgun',1*mult);}
 if(g>=2&&enemyLevel>=3){addAmmo(s,'rifle',10);addAmmo(s,'sniper',3);}
 if(g>=3&&enemyLevel>=4)addAmmo(s,'rpg',1);
}
export function gunInfection(s,damage){return s.abilities.guns>=3?damage*.5:0;}
export function hasLauncher(s){return (s.abilities.launcher||0)>=1;}
// 发射器数值：1 级感染针，2 级加伤并穿透，3 级保留穿透、额外走 6 次充能。
export function launcherSpec(s,empowered=false){
 const lv=s.abilities.launcher||0;
 if(lv<1)return null;
 const pierce=lv>=2?2:0;
 const base=lv>=2
  ?{infection:20,damage:8,range:28,cd:.36,speed:36,pierce,color:0xd48aff,life:.9}
  :{infection:12,damage:4,range:24,cd:.42,speed:32,pierce,color:0xc078ff,life:.85};
 if(empowered)return {...base,infection:45,damage:12,speed:14,pierce:4,splash:6,life:4,strong:true,color:0xe4adff};
 return {...base,splash:0,strong:false};
}
// 只有 3 级才计次。前 6 发普通针，第 7 发强化炮弹并清零。
export function consumeLauncherCharge(s){
 if((s.abilities.launcher||0)<3)return false;
 s.launcherCharge=s.launcherCharge||0;
 if(s.launcherCharge>=6){s.launcherCharge=0;return true;}
 s.launcherCharge++;
 return false;
}
export function upgrade(s,id){
 if(!ABILITIES.some(a=>a.id===id)||s.abilities[id]>=3||s.pending<=0)return false;
 s.abilities[id]++;s.pending--;s.history.push({id,level:s.abilities[id],time:s.time});s.lastPick=s.time;
 if(id==='guns'){
  if(s.abilities.guns===1){addAmmo(s,'pistol',24);addAmmo(s,'shotgun',8);s.mags.pistol=GUNS[0].clip;s.mags.shotgun=GUNS[1].clip;}
  if(s.abilities.guns===2){addAmmo(s,'rifle',30);addAmmo(s,'sniper',9);s.mags.rifle=GUNS[2].clip;s.mags.sniper=GUNS[3].clip;}
  if(s.abilities.guns===3){addAmmo(s,'rpg',2);s.mags.rpg=1;}
 }
 // 第一次点出发射器时自动装备，和点出枪械后上手手枪一样。
 if(id==='launcher'&&s.abilities.launcher===1&&s.weapon===-1)s.weapon=LAUNCHER_SLOT;
 if(id==='frenzy'||id==='evolve')refreshStats(s);
 if(id==='command')s.needGuards=true;
 return true;
}
export function grantFrenzy(s,fromArmy=false){
 const lv=s.abilities.frenzy;if(!lv)return 0;
 if(fromArmy&&lv<3)return 0;
 const amt=(!fromArmy&&lv>=3)?2:1;
 s.frenzyHp+=amt;
 refreshStats(s);
 for(const mark of [500,1000]){
  if(lv>=2&&!s.frenzyMarks[mark]&&s.maxHp>=mark){s.frenzyMarks[mark]=true;s.pending++;}
 }
 return amt;
}
export function reward(s,u,converted){
 if(converted){s.infected++;if(u.city)s.cityInfected++;s.first??={name:ENEMIES[u.type].name,time:s.time};if(u.type===4)s.purifiers++;}
 else s.kills++;
 s.highestEnemy=Math.max(s.highestEnemy,ENEMIES[u.type].level);
 grantKillAmmo(s,ENEMIES[u.type].level);
 grantFrenzy(s,!!u.fromArmy);
 if(s.abilities.haste>=2&&!u.fromArmy)s.burstTime=3;
 if(u.rewarded)return;u.rewarded=true;
 const cap=levelCap(s);
 if(s.level<cap){
  s.xp+=xpFromUnit(u);
  while(s.xp>=s.need&&s.level<cap){
   s.xp-=s.need;s.level++;s.need=xpNeedFor(s.level);
   if(s.level<=LEVEL_CAP)s.pending++;
   refreshStats(s);
  }
  if(s.level===cap)s.xp=0;
 }
}
export function makeUnit(id,type,x,z,city=true,profession=0){
 const t=ENEMIES[type];
 return{id,type,x,z,city,profession,kind:type===0?'human':'guard',hp:t.hp,maxHp:t.hp,infection:0,threshold:t.threshold,corpseTime:0,dead:false,converted:false,tagged:false,attackCd:Math.random(),wander:0,tx:x,tz:z,purified:0,hurt:0,guard:false,fromArmy:false};
}
export function applyRankBoost(u){
 if(u.rankBoost)return u;
 u.rankBoost=true;
 u.maxHp=Math.ceil(u.maxHp*1.28);
 u.hp=Math.max(u.hp,Math.ceil(u.maxHp*.45));
 return u;
}
export function allyTemplate(type){
 const e=ENEMIES[type];
 return {name:e.allyName||e.name,hp:e.allyHp??Math.ceil(e.hp*1.2),atk:e.allyAtk??Math.max(8,Math.ceil(e.damage*1.4))};
}
export function convert(s,u){
 if(u.converted||u.dead)return false;
 const fromCorpse=u.kind==='corpse';
 const tpl=allyTemplate(u.type);
 u.converted=true;u.kind='ally';
 u.maxHp=tpl.hp;u.hp=fromCorpse?Math.ceil(tpl.hp*.6):tpl.hp;u.atk=tpl.atk;
 u.aiming=false;u.aim=0;u.attackCd=.15;u.hurt=0;
 u.corpseTime=0;u.infection=u.threshold;u.wander=0;u.tagged=false;
 if(s.abilities.evolve>=3)applyRankBoost(u);
 reward(s,u,true);
 return true;
}
export function hit(s,u,infection,damage,fromFront=false,fromArmy=false){
 if(u.dead||u.converted||u.kind==='corpse')return 'none';
 if(ENEMIES[u.type].shield&&fromFront)damage*=.5;
 u.infection=Math.min(u.threshold,u.infection+infection);
 if(infection>0)u.tagged=fromArmy?'army':'player';
 if(u.infection>=u.threshold){u.fromArmy=fromArmy;convert(s,u);return 'converted';}
 u.hp=Math.max(0,u.hp-damage);u.hurt=2;
 if(u.hp<=0){u.kind='corpse';u.corpseTime=12;u.fromArmy=fromArmy;reward(s,u,false);return 'killed';}
 return 'hit';
}
export function damageAlly(u,damage,s){
 const dr=s?.abilities.tough>=3?.2:0;
 u.hp=Math.max(0,u.hp-damage*(1-dr));u.hurt=2;
 if(u.hp===0){u.kind='fallen';u.dead=true;if(u.guard)u.guardCd=12;}
}
export function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
const AIR=[
 {radius:0,perHalf:0,corpse:false,army:false},
 {radius:5,perHalf:3,corpse:false,army:false},
 {radius:10,perHalf:5,corpse:true,army:false},
 {radius:15,perHalf:10,corpse:true,army:true}
];
const DOT_RATE=[0,4,8,8];
export function tickInfection(s,units,player,dt){
 let chain=0;
 const air=AIR[s.abilities.air]||AIR[0];
 const purifiers=units.filter(u=>!u.dead&&u.kind!=='corpse'&&u.type===4);
 const army=units.filter(u=>u.kind==='ally'&&!u.dead);
 for(const u of units){
  u.purified=0;
  if(u.dead||u.converted)continue;
  const corpse=u.kind==='corpse';
  let positive=0,negative=0;
  for(const p of purifiers){
   if(p===u||distance(p,u)>(ENEMIES[p.type].aura||8))continue;
   if(p.kind==='ally')positive+=ENEMIES[p.type].drain||8;
   else negative+=ENEMIES[p.type].drain||8;
  }
  if(air.radius&&(!corpse||air.corpse)){
   if(distance(player,u)<=air.radius)positive+=air.perHalf*2;
   if(air.army)for(const a of army)if(distance(a,u)<=AIR[1].radius)positive+=AIR[1].perHalf*2;
  }
  const tagged=u.tagged;
  const playerDot=tagged==='player'||tagged===true;
  const armyDot=tagged==='army'&&s.abilities.dot>=3;
  if((playerDot||armyDot)&&(!corpse||s.abilities.dot>=2))positive+=DOT_RATE[s.abilities.dot]||0;
  if(corpse&&!air.corpse&&s.abilities.dot<2)positive=0;
  u.infection=Math.max(0,Math.min(u.threshold,u.infection+(positive-negative)*dt));
  u.purified=negative;
  if(u.infection>=u.threshold){if(convert(s,u))chain++;continue;}
  if(corpse){u.corpseTime-=dt;if(u.corpseTime<=0){u.dead=true;u.kind='expired';}}
 }
 s.maxChain=Math.max(s.maxChain,chain);
 return chain;
}
export function incomingDamage(s,damage){
 const t=s.abilities.tough;
 const dr=[0,.2,.3,.5][t]||0;
 return {taken:damage*(1-dr),reflected:damage*dr,radius:t>=3?30:t>=2?10:0,sprintDr:false};
}
export const TUNE_DEFAULTS={
 alert:{stage2At:90,stage3At:180,maxLevel1:2,maxLevel2:4,maxLevel3:6,pressureTime:0},
 difficulty:{armyWeight:.4,fodderTarget:10,fodderDump:12,threatPerLevel:.55,threatPerAlly:.4,intervalBase:14,intervalPerWeight:.45,intervalMin:5},
 activity:{shambleSpeed:.55,shambleRadius:4,shambleIdle:6,fleeSpeed:.7,awakeSpeed:3.8,awakeRadius:34,awakeIdle:1.05,chaseSpeed:3.6,followSpeed:4.4,structureSpeed:3.2}
};
export const TUNE=structuredClone(TUNE_DEFAULTS);
export function resetTune(){applyTune(TUNE_DEFAULTS);}
export function applyTune(data){if(!data)return TUNE;for(const group of ['alert','difficulty','activity']){if(!data[group])continue;for(const [k,v] of Object.entries(data[group])){if(k in TUNE[group]&&Number.isFinite(+v))TUNE[group][k]=+v;}}return TUNE;}
export function setTuneValue(path,value){const [group,key]=path.split('.');if(TUNE[group]&&key in TUNE[group]&&Number.isFinite(+value))TUNE[group][key]=+value;return TUNE[group][key];}
export function cityAlert(s){
 const a=TUNE.alert;
 const t=s.time+(s.kills+s.infected)*(a.pressureTime||0);
 let stage=1,maxLevel=a.maxLevel1,final=false;
 if(t>=a.stage3At){stage=3;maxLevel=a.maxLevel3;final=true;}
 else if(t>=a.stage2At){stage=2;maxLevel=a.maxLevel2;}
 return {stage,maxLevel,final,time:s.time,pressure:s.kills+s.infected,clock:t};
}
export function threat(s){return cityAlert(s).stage;}
export function difficultyWeight(s,units){return s.level+teamCount(units)*TUNE.difficulty.armyWeight;}
export function isCombatFodder(u){
 if(!u||u.dead||u.converted||u.kind==='corpse')return false;
 const e=ENEMIES[u.type];
 return !!(e?.fodder&&u.type!==0);
}
export function isRangedEnemy(spec){return (spec?.range??0)>3;}
export function hostileWindup(spec){return spec.aim||(isRangedEnemy(spec)?1:.4);}
export function hostileSwingConnects(spec,distance,clear=true){return clear&&distance<spec.range;}
export function stepHostileMelee(u,spec,distance,clear,dt){
 if(u.aiming){
  u.aim=Math.max(0,(u.aim||0)-dt);
  if(u.aim>0)return 'windup';
  u.aiming=false;u.aim=0;u.attackCd=spec.interval;
  return hostileSwingConnects(spec,distance,clear)?'hit':'miss';
 }
 if(distance<spec.range&&(u.attackCd||0)<=0&&clear){
  u.aiming=true;u.aim=hostileWindup(spec);
  return 'start';
 }
 return 'idle';
}
export function fodderCount(units){return units.filter(isCombatFodder).length;}
export function spawnPlan(s,units,random=Math.random){
 const alert=cityAlert(s);
 const d=TUNE.difficulty;
 const army=teamCount(units);
 const weight=s.level+army*(d.armyWeight??.4);
 const fodder=fodderCount(units);
 const pool=ENEMIES.map((e,i)=>({e,i})).filter(({e})=>e.level<=alert.maxLevel);
 const fodderPool=pool.filter(({e,i})=>e.fodder&&i!==0);
 const threatPool=pool.filter(({e})=>!e.fodder);
 const pick=list=>{if(!list.length)return 0;return list[Math.min(list.length-1,Math.floor(random()*list.length))].i;};
 const fodderN=fodder<=0?d.fodderDump:Math.max(0,d.fodderTarget-fodder);
 const threatN=alert.maxLevel<=TUNE.alert.maxLevel1?0:Math.max(1,Math.round(s.level*(d.threatPerLevel??.55)+army*(d.threatPerAlly??.4)));
 const types=[];
 for(let i=0;i<fodderN;i++)types.push(pick(fodderPool.length?fodderPool:pool));
 for(let i=0;i<threatN;i++)types.push(pick(threatPool.length?threatPool:fodderPool.length?fodderPool:pool));
 const interval=Math.max(d.intervalMin,d.intervalBase-weight*(d.intervalPerWeight??.45));
 return {types,interval,weight,fodder,fodderN,threatN,army,...alert};
}
export function outcome(s){return s.hp<=0?'ended':s.bossDefeated?'won':null;}
export function hasteBonus(s){return s.abilities.haste>=3?1:s.abilities.haste>=1?.5:0;}
export function speed(s,sprinting=false){
 let v=WALK_SPEED*(1+hasteBonus(s));
 if(s.burstTime>0)v*=1+s.burstTime/3;
 if(sprinting)v*=SPRINT_MULT;
 return v;
}
export function sprintResist(s){
 if(s.abilities.haste>=3)return .5;
 if(s.abilities.haste>=2)return .3;
 return 0;
}
export function cooldownScale(s){return 1;}
export function teamCount(units){return units.filter(u=>u.kind==='ally'&&!u.dead).length;}
export function guardWanted(s){
 const lv=s.abilities.command;
 if(!lv)return {count:0,type:0};
 return {count:[0,2,5,10][lv],type:lv};
}
export function stepSimulation(s,units,player,dt,mode){
 if(mode!=='playing')return;
 s.time+=dt;
 if(s.burstTime>0)s.burstTime=Math.max(0,s.burstTime-dt);
 tickInfection(s,units,player,dt);
 if(s.abilities.tough>=3)s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.02*dt);
 if(s.abilities.evolve>=2)refreshStats(s);
}
export function hurtMother(s,damage,source='秩序火力',sprinting=false){
 let info=incomingDamage(s,damage);
 if(sprinting){
  const extra=sprintResist(s);
  if(extra){info={...info,taken:info.taken*(1-extra),reflected:info.reflected+damage*extra};}
 }
 s.lastReflect=info;
 s.lastDamage=source+' · '+Math.round(info.taken)+' 伤害';
 s.damageLog??=[];s.damageLog.push({time:s.time,source,damage:info.taken,before:s.hp});s.damageLog=s.damageLog.slice(-5);
 s.hp=Math.max(0,s.hp-info.taken);
 return s.hp===0;
}
export function missionReady(s){return [()=>s.infected>=3,()=>s.infected>=10&&s.towers>=1,()=>s.highestEnemy>=5&&s.towers>=2,()=>s.infected>=40&&s.towers===3,()=>s.bossDefeated][s.mission]?.()??false;}
export const MISSIONS=[['叫醒第一个人','累计感染 3 人'],['让街区失控','感染 10 人，摧毁首座中枢'],['突破镇压','击败 / 转化净化工兵或持枪特警，摧毁两座中枢'],['唤出巨像','累计感染 40 人，摧毁三座中枢'],['东京人觉醒','击败中央路口的巨大 Boss']];
