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
 light:{mult:1,cd:.7,range:2.8,aoe:0},
 heavy:{mult:2,cd:1.2,range:3.2,aoe:2.6}
};
export const WALK_SPEED=4.6;
export const SPRINT_MULT=1.38;
export const ENEMIES=[
 // 类型下标保持现有存档含义。数值和技能按飞书《敌人相关系统》6.1；转化后满状态砍半。
 {name:'苦逼打工人',level:1,hp:50,threshold:20,speed:2.2,damage:0,range:1.6,interval:1.5,aim:.2,fodder:true,allyName:'普通狂暴者',allyHp:20,allyAtk:10},
 {name:'持棍巡警',level:2,hp:100,threshold:40,speed:2.55,damage:20,range:1.35,interval:1.7,aim:.7,fodder:true,allyName:'狂暴持棍巡警',allyHp:50,allyAtk:10},
 {name:'持枪巡警',level:2,hp:100,threshold:40,speed:2.45,damage:10,range:12,interval:2,aim:.45,allyName:'狂暴持枪巡警',allyHp:50,allyAtk:5},
 {name:'持盾特警',level:3,hp:200,threshold:150,speed:2.3,damage:30,range:2.3,interval:1.5,aim:1.5,shield:true,cone:true,allyName:'狂暴持盾特警',allyHp:100,allyAtk:15},
 {name:'净化工兵',level:4,hp:400,threshold:300,speed:2.05,damage:10,range:8,interval:.5,aim:.25,purifier:true,spray:true,aura:10,drain:4,allyName:'狂暴净化士兵',allyHp:200,allyAtk:5},
 {name:'大兵',level:4,hp:300,threshold:200,speed:2.45,damage:5,range:24,interval:.1,aim:0,allyName:'狂暴大兵',allyHp:150,allyAtk:2.5,grenade:{radius:5,max:50,min:10,cd:20}},
 {name:'持枪特警',level:3,hp:150,threshold:100,speed:2.65,damage:10,range:14,interval:.5,aim:.12,allyName:'狂暴持枪特警',allyHp:75,allyAtk:5}
];
export const ABILITIES=[
 {id:'air',name:'空气传播',icon:'◌',group:'感染系',descriptions:[
  '自身 5m 内敌人每 0.5 秒 +2 感染。',
  '范围 10m，每 0.5 秒 +4 感染，且可作用于尸体。',
  '范围 15m，每 0.5 秒 +6 感染，且可作用于尸体。'
 ]},
 {id:'guns',name:'枪？枪！',icon:'⌐',group:'武器系',descriptions:[
  '解锁手枪与霰弹枪。击杀/同化 2 级及以上敌人：手枪 +3、霰弹 +1 备弹。',
  '解锁步枪与狙击枪。3 级及以上：步枪 +10、狙击 +3；一级补弹量翻倍。',
  '解锁 RPG。4 级及以上 +1 发。枪械造成攻击力一半的感染。'
 ]},
 {id:'launcher',name:'可感染发射器',icon:'◎',group:'武器系',descriptions:[
  '解锁感染针。命中造成感染，适合叫醒路人。键位按点出顺序排。',
  '针剂感染与伤害提高，并可穿透多名敌人。',
  '解锁三环充能：枪械与注射器共用，命中三次后下一发强化炮弹。'
 ]},
 {id:'frenzy',name:'狂杀',icon:'⚔',group:'母体系',descriptions:[
  '每次击杀或同化 +1 生命与等量上限。',
  '生命上限达到 500 与 1000 时，各额外获得一次能力进化。',
  '提升量翻倍，体型变大。军队的击杀/同化也为你提供 1 级效果。'
 ]},
 {id:'dot',name:'持续感染',icon:'⌁',group:'感染系',descriptions:[
  '你造成的感染会持续累积，直到同化完成。每秒 +1。',
  '持续感染增强（每秒 +2），尸体也会继续上涨。',
  '你的军队命中也会挂上同样的持续感染（每秒 +3）。'
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
  xp:0,xpEarned:0,need:xpNeedFor(1),level:1,pending:1,time:0,alert:1,peakAlert:1,
  abilities:{air:0,guns:0,launcher:0,frenzy:0,dot:0,haste:0,tough:0,evolve:0,command:0},
  history:[],ammo:{pistol:0,shotgun:0,rifle:0,sniper:0,rpg:0},
  mags:{pistol:0,shotgun:0,rifle:0,sniper:0,rpg:0},
  clip:0,clipMax:0,weapon:-1,gunId:null,powerCharge:0,weaponOrder:[],
  first:null,maxChain:0,purifiers:0,highestEnemy:0,mission:0,bossDefeated:false,lastPick:-60,killRewards:[],
  frenzyHp:0,frenzyMarks:{500:false,1000:false},burstTime:0,commandStance:'follow',
  // 警戒吃累计经验 xpEarned，不吃等级。Boss 倒计时、召唤和余韵都记在这里，避免和拆中枢进度绑在一起。
  alertTime:0,bossCountdown:null,bossSpawned:false,aftermath:false,settle:false
 };
}
// 首次获得决定位置；升级只改等级。缺少历史的旧存档把剩余已拥有能力补在末尾。
export function ownedAbilities(s){
 const owned=new Map(ABILITIES.filter(a=>s.abilities[a.id]>0).map(a=>[a.id,a]));
 const ordered=[];
 for(const entry of s.history||[]){
  const ability=owned.get(entry.id);
  if(ability){ordered.push(ability);owned.delete(entry.id);}
 }
 return [...ordered,...owned.values()];
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
// 枪和注射器没有固定键位。谁先点到对应加成，谁就排在更靠前的数字键。
function rememberWeapon(s,id){s.weaponOrder??=[];if(!s.weaponOrder.includes(id))s.weaponOrder.push(id);}
export function weaponSlots(s){
 return (s.weaponOrder||[]).map((id,index)=>{
  if(id==='launcher')return {key:index+2,id,weapon:LAUNCHER_SLOT,name:'注射器'};
  const weapon=GUNS.findIndex(g=>g.id===id);
  const gun=GUNS[weapon];
  return gun?{key:index+2,id,weapon,name:gun.name,gun}:null;
 }).filter(Boolean);
}
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
// 发射器数值：1 级感染针，2 级加伤并穿透，3 级保留穿透，解锁枪械与注射器共用的三次命中充能。
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
export const POWER_HITS=3;
export function canChargePower(s){return (s.abilities.launcher||0)>=3;}
// 每次扣扳机共用一个 shot；霰弹、多目标穿透只积一环。空枪和强化炮不充能。
export function recordPowerHit(s,shot){
 if(!shot?.eligible||shot.counted||shot.empowered)return false;
 shot.counted=true;
 if(!canChargePower(s)||s.powerCharge>=POWER_HITS)return false;
 s.powerCharge=Math.min(POWER_HITS,(s.powerCharge||0)+1);
 return true;
}
export function consumePowerCharge(s){
 if(!canChargePower(s)||(s.powerCharge||0)<POWER_HITS)return false;
 s.powerCharge=0;
 return true;
}
export function upgrade(s,id){
 if(!ABILITIES.some(a=>a.id===id)||s.abilities[id]>=3||s.pending<=0)return false;
 s.abilities[id]++;s.pending--;s.history.push({id,level:s.abilities[id],time:s.time});s.lastPick=s.time;
 if(id==='guns'){
  if(s.abilities.guns===1){addAmmo(s,'pistol',24);addAmmo(s,'shotgun',8);s.mags.pistol=GUNS[0].clip;s.mags.shotgun=GUNS[1].clip;rememberWeapon(s,'pistol');rememberWeapon(s,'shotgun');if(s.weapon===-1)s.weapon=0;}
  if(s.abilities.guns===2){addAmmo(s,'rifle',30);addAmmo(s,'sniper',9);s.mags.rifle=GUNS[2].clip;s.mags.sniper=GUNS[3].clip;rememberWeapon(s,'rifle');rememberWeapon(s,'sniper');}
  if(s.abilities.guns===3){addAmmo(s,'rpg',2);s.mags.rpg=1;rememberWeapon(s,'rpg');}
 }
 // 注射器和枪一样，按这次点击插进键位。手上还是空的，就直接换成刚点出的那件。
 if(id==='launcher'&&s.abilities.launcher===1){rememberWeapon(s,'launcher');if(s.weapon===-1)s.weapon=LAUNCHER_SLOT;}
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
 // 余韵里胜利已经锁定，击杀和转化不再涨经验、等级或结算统计。
 if(s.aftermath)return;
 if(converted){s.infected++;if(u.city)s.cityInfected++;s.first??={name:ENEMIES[u.type].name,time:s.time};if(u.type===4)s.purifiers++;}
 else s.kills++;
 s.highestEnemy=Math.max(s.highestEnemy,ENEMIES[u.type].level);
 grantKillAmmo(s,ENEMIES[u.type].level);
 grantFrenzy(s,!!u.fromArmy);
 if(s.abilities.haste>=2&&!u.fromArmy)s.burstTime=3;
 if(u.rewarded)return;u.rewarded=true;
 const cap=levelCap(s);
 const gain=xpFromUnit(u);
 // 满级后不再升级，但这份经验仍计入警戒，否则后期警戒会停住。
 if(!Number.isFinite(s.xpEarned))s.xpEarned=earnedXp(s);
 s.xpEarned+=gain;
 if(s.level<cap){
  s.xp+=gain;
  while(s.xp>=s.need&&s.level<cap){
   s.xp-=s.need;s.level++;s.need=xpNeedFor(s.level);
   if(s.level<=LEVEL_CAP)s.pending++;
   refreshStats(s);
  }
  if(s.level===cap)s.xp=0;
 }
}
export function resetUnit(u,id,type,x,z,city=true,profession=0){
 const t=ENEMIES[type];
 u.id=id;u.type=type;u.x=x;u.z=z;u.city=city;u.profession=profession;
 u.kind=type===0?'human':'guard';
 u.hp=t.hp;u.maxHp=t.hp;u.infection=0;u.threshold=t.threshold;
 u.corpseTime=0;u.dead=false;u.converted=false;u.tagged=false;
 u.attackCd=Math.random();u.wander=0;u.tx=x;u.tz=z;u.purified=0;u.hurt=0;
 u.guard=false;u.fromArmy=false;u.grenadeCd=0;u.aiming=false;u.aim=0;u.guardCd=0;u.rush=false;
 u.rankBoost=false;u.rewarded=false;u.atk=undefined;
 return u;
}
export function makeUnit(id,type,x,z,city=true,profession=0){
 return resetUnit({},id,type,x,z,city,profession);
}
export function applyRankBoost(u){
 if(u.rankBoost)return u;
 u.rankBoost=true;
 u.maxHp=Math.ceil(u.maxHp*1.28);
 u.hp=Math.max(u.hp,Math.ceil(u.maxHp*.45));
 return u;
}
// 转化后满状态按敌方生命/攻击砍半。市民敌方无攻击，表里单独给了 10 点。
export function allyTemplate(type){
 const e=ENEMIES[type];
 return {name:e.allyName||e.name,hp:e.allyHp??e.hp/2,atk:e.allyAtk??e.damage/2};
}
// 普攻按原公式打伤害并带感染，路人和警察都能打。
export function allyMelee(u){
 const atk=u.atk||12;
 return {damage:atk,infection:Math.max(4,Math.round(atk*.45))};
}
export function allySeeksHostile(hostile){
 return !!(hostile&&!hostile.dead&&!hostile.converted&&hostile.kind!=='corpse');
}
// 护卫和普通被感染者分开：只在主角身边这个半径里找人、移动，不会自己跑去拆建筑或追巨像。
export const GUARD_LEASH=20;
export function guardMoveTarget(player,x,z,leash=GUARD_LEASH){
 const dx=x-player.x,dz=z-player.z,dist=Math.hypot(dx,dz);
 if(dist<=leash||dist===0)return {x,z};
 return {x:player.x+dx/dist*leash,z:player.z+dz/dist*leash};
}
// 手雷从中心 max 线性降到边缘 min。
export function grenadeBlast(spec,dist){
 const g=spec?.grenade;if(!g||dist>g.radius)return 0;
 return g.max+(g.min-g.max)*(dist/g.radius);
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
 {radius:0,perHalf:0,corpse:false},
 {radius:5,perHalf:2,corpse:false},
 {radius:10,perHalf:4,corpse:true},
 {radius:15,perHalf:6,corpse:true}
];
const DOT_RATE=[0,1,2,3];
export function tickInfection(s,units,player,dt){
 let chain=0;
 const air=AIR[s.abilities.air]||AIR[0];
 const purifiers=units.filter(u=>!u.dead&&u.kind!=='corpse'&&u.type===4);
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
 // 警戒档：10 局部警情，100 城市封锁，300 军事介入，500 开启 120 秒 Boss 倒计时。
 alert:{xpPerAlert:3,perSecond:.1,stage2At:10,stage3At:100,stage4At:300,bossAt:500,countdown:120,maxLevel1:1,maxLevel2:2,maxLevel3:3,maxLevel4:4,pressureTime:0},
 difficulty:{armyWeight:.4,fodderTarget:10,fodderDump:12,threatPerLevel:.55,threatPerAlly:.4,intervalBase:14,intervalPerWeight:.45,intervalMin:5,spawnPerBurst:2,spawnGap:.08,spawnQueueMax:18},
 activity:{shambleSpeed:.55,shambleRadius:4,shambleIdle:6,fleeSpeed:.7,awakeSpeed:3.8,awakeRadius:34,awakeIdle:1.05,chaseSpeed:3.6,followSpeed:4.4,structureSpeed:3.2}
};
export const TUNE=structuredClone(TUNE_DEFAULTS);
export function resetTune(){applyTune(TUNE_DEFAULTS);}
export function applyTune(data){if(!data)return TUNE;for(const group of ['alert','difficulty','activity']){if(!data[group])continue;for(const [k,v] of Object.entries(data[group])){if(k in TUNE[group]&&Number.isFinite(+v))TUNE[group][k]=+v;}}return TUNE;}
export function setTuneValue(path,value){const [group,key]=path.split('.');if(TUNE[group]&&key in TUNE[group]&&Number.isFinite(+value))TUNE[group][key]=+value;return TUNE[group][key];}
export const ALERT_NAMES=['','尚未警觉','局部警情','城市封锁','军事介入','开启计时','全面镇压','失去警戒能力'];
export const BOSS_WARNINGS=[60,30,10];
// 警戒值 = 累计经验 / 3 + 每秒 0.1 点。凑满 3 点经验才涨 1 点警戒，等级本身不加。
// 感染人数本身不加；转化和击杀是因为发了经验才加。
export function earnedXp(s){
 if(Number.isFinite(s.xpEarned))return Math.max(0,s.xpEarned);
 // 旧存档没有累计经验时，用升到当前等级花掉的经验补上，避免警戒突然归零。
 let spent=0;
 const level=Math.max(1,s.level|0);
 for(let i=1;i<level;i++)spent+=xpNeedFor(i);
 return spent+Math.max(0,Number.isFinite(s.xp)?s.xp:0);
}
export function alertValue(s){
 const a=TUNE.alert;
 const time=Number.isFinite(s.alertTime)?s.alertTime:s.time;
 return earnedXp(s)/Math.max(1,a.xpPerAlert||3)+(a.perSecond??.1)*Math.max(0,time);
}
export function cityAlert(s){
 const a=TUNE.alert;
 const value=alertValue(s);
 if(s.aftermath||s.bossDefeated)return {stage:7,name:ALERT_NAMES[7],maxLevel:0,final:false,value,lost:true,countdown:0};
 let stage=1,maxLevel=a.maxLevel1;
 if(value>=(a.stage4At??300)){stage=4;maxLevel=a.maxLevel4??4;}
 else if(value>=a.stage3At){stage=3;maxLevel=a.maxLevel3;}
 else if(value>=a.stage2At){stage=2;maxLevel=a.maxLevel2;}
 if(s.bossSpawned){stage=6;maxLevel=a.maxLevel4??4;}
 else if(s.bossCountdown!=null){stage=5;maxLevel=a.maxLevel4??4;}
 return {stage,name:ALERT_NAMES[stage],maxLevel,final:stage>=5,value,lost:false,countdown:s.bossCountdown,time:s.time,pressure:0,clock:value};
}
// 只在游戏运行时推进警戒时间。余韵、暂停都不调用它。倒计时归零时通知召唤 Boss。
export function tickRunClock(s,dt){
 const events={started:false,warnings:[],summon:false,value:alertValue(s)};
 if(s.aftermath||s.bossDefeated)return events;
 s.alertTime=(s.alertTime||0)+dt;
 events.value=alertValue(s);
 if(s.bossCountdown==null&&events.value>=(TUNE.alert.bossAt??500)){
  s.bossCountdown=TUNE.alert.countdown??120;
  events.started=true;
 }
 if(s.bossCountdown!=null&&!s.bossSpawned){
  const before=s.bossCountdown;
  s.bossCountdown=Math.max(0,s.bossCountdown-dt);
  events.warnings=BOSS_WARNINGS.filter(mark=>before>mark&&s.bossCountdown<=mark);
  if(before>0&&s.bossCountdown===0)events.summon=true;
 }
 return events;
}
export function threat(s){return cityAlert(s).stage;}
export function difficultyWeight(s,units){return s.level+teamCount(units)*TUNE.difficulty.armyWeight;}
// 耗材层：市民一直算库存；2 级巡警从城市封锁（阶段 3）起才算。
export function isCityFodder(u,stage=1){
 if(!u||u.dead||u.converted||u.kind==='corpse'||u.kind==='ally')return false;
 const e=ENEMIES[u.type];
 if(!e)return false;
 if(u.type===0)return true;
 return stage>=3&&e.level===2;
}
export function isCombatFodder(u){return isCityFodder(u,99);}
export function isRangedEnemy(spec){return (spec?.range??0)>3&&!spec.spray;}
export function hostileWindup(spec){
 if(Number.isFinite(spec.aim))return spec.aim;
 return isRangedEnemy(spec)?1:.4;
}
export function hostileSwingConnects(spec,distance,clear=true){return clear&&distance<spec.range;}
export function stepHostileMelee(u,spec,distance,clear,dt){
 if(u.aiming){
  u.aim=Math.max(0,(u.aim||0)-dt);
  if(u.aim>0)return 'windup';
  u.aiming=false;u.aim=0;u.attackCd=spec.interval;
  return hostileSwingConnects(spec,distance,clear)?'hit':'miss';
 }
 if(distance<spec.range&&(u.attackCd||0)<=0&&clear){
  const wind=hostileWindup(spec);
  // 自动步枪一类无前摇，进射程立刻出伤。
  if(wind<=0){
   u.attackCd=spec.interval;
   return hostileSwingConnects(spec,distance,clear)?'hit':'miss';
  }
  u.aiming=true;u.aim=wind;
  return 'start';
 }
 return 'idle';
}
export function fodderCount(units,stage=99){return units.filter(u=>isCityFodder(u,stage)).length;}
export function makeSpawnQueue(){return {jobs:[],wait:0};}
// 一整波只进队列，真正进场由 takeSpawnJobs 按帧拆开，避免同一帧克隆几十个模型。
export function enqueueSpawnTypes(queue,types){
 if(!queue||!types?.length)return 0;
 for(const type of types)queue.jobs.push({type:type|0});
 return types.length;
}
// 军队和平民分开记。冲锋、巡逻、路边行人落地方式不同。
export function enqueueSpawnJobs(queue,jobs){
 if(!queue||!jobs?.length)return 0;
 for(const job of jobs){
  const role=job.role==='civilian'?'civilian':job.role==='patrol'?'patrol':'army';
  queue.jobs.push({type:job.type|0,role});
 }
 return jobs.length;
}
export function isStreetCivilian(u){
 return !!(u&&u.type===0&&!u.dead&&!u.converted&&u.kind==='human');
}
// 没被拉进冲锋的秩序单位，算在路上巡逻的军队。玩家护卫不算。
export function isStreetPatrol(u){
 return !!(u&&u.type>0&&!u.rush&&!u.guard&&!u.dead&&!u.converted&&u.kind!=='human'&&u.kind!=='ally'&&u.kind!=='corpse');
}
// 离开玩家这么远的敌方士兵直接删掉。还在被感染的留下，避免转化到一半被清掉。
export const TROOP_CULL=50;
export function shouldCullTroop(u,dist,range=TROOP_CULL){
 if(!u||u.guard||u.converted||u.kind==='ally'||u.type===0)return false;
 if(!(dist>=range))return false;
 if(u.kind==='corpse'||u.kind==='expired'||u.dead)return true;
 return !(u.infection>0);
}
// 身边想维持的巡逻人数。人够了就不再把冲锋部队拆去站岗。
export const PATROL_NEAR=32,PATROL_KEEP=4;
// 至少留一个人冲锋。巡逻从名单前面拿，耗材巡警会排在威胁单位前面。
export function splitArmyWave(army,nearbyPatrols=0){
 const list=(army||[]).filter(t=>t>0);
 const room=Math.max(0,PATROL_KEEP-(nearbyPatrols|0));
 let n=0;
 if(list.length>=2&&room>0)n=Math.min(room,list.length-1,Math.max(1,Math.round(list.length/3)));
 return {patrol:list.slice(0,n),rush:list.slice(n)};
}
// 身边这条街想维持的行人，以及整张图允许同时存在的行人。
export const STREET_NEAR=32,STREET_KEEP=8,STREET_CAP=36;
export function countStreetCivilians(units,origin=null,radius=STREET_NEAR){
 const all=(units||[]).filter(isStreetCivilian);
 if(!origin)return {all:all.length,near:all.length};
 const near=all.filter(u=>Math.hypot(u.x-origin.x,u.z-origin.z)<=radius).length;
 return {all:all.length,near};
}
// 离建筑外墙 1.2–8 米算路边。没有建筑数据时不拦，方便逻辑测试。
export function buildingClearance(buildings,x,z){
 let best=Infinity;
 for(const b of buildings||[]){
  const dx=Math.max(Math.abs(x-b.x)-(b.w||0)/2,0);
  const dz=Math.max(Math.abs(z-b.z)-(b.d||0)/2,0);
  const d=Math.hypot(dx,dz);
  if(d<best)best=d;
 }
 return best;
}
export function isRoadside(buildings,x,z){
 if(!buildings?.length)return true;
 const d=buildingClearance(buildings,x,z);
 return d>=1.2&&d<=8;
}
// 行人补在玩家前方附近的路边，而不是跟军队同一条冲锋线。
export function planCivilianSpot(origin,facing,buildings,random=Math.random){
 const yaw=Math.atan2(facing?.x||0,facing?.z||1);
 const ox=origin?.x||0,oz=origin?.z||0;
 for(let i=0;i<18;i++){
  const a=yaw+(random()-.5)*2.4,dist=12+random()*12;
  const x=ox+Math.sin(a)*dist,z=oz+Math.cos(a)*dist;
  if(!isRoadside(buildings,x,z))continue;
  return {x,z};
 }
 const a=yaw+(random()-.5)*1.2;
 return {x:ox+Math.sin(a)*16,z:oz+Math.cos(a)*16};
}
// 沿着最近那栋楼的长边走一段，看起来是在街上走，而不是原地挪步。
export function streetStroll(x,z,buildings,random=Math.random){
 let best=null,bestD=Infinity;
 for(const b of buildings||[]){
  const d=buildingClearance([b],x,z);
  if(d<bestD){best=b;bestD=d;}
 }
 let dx,dz;
 if(best&&bestD<14){
  const alongX=(best.w||1)>=(best.d||1);
  const dir=random()<.5?1:-1;
  dx=alongX?dir:(random()-.5)*.35;
  dz=alongX?(random()-.5)*.35:dir;
 }else{
  const a=random()*Math.PI*2;
  dx=Math.sin(a);dz=Math.cos(a);
 }
 const dist=8+random()*6,len=Math.hypot(dx,dz)||1;
 return {x:x+dx/len*dist,z:z+dz/len*dist};
}
// 一整波军队共用一个方向：多半从身后，其余从侧面，都不从正面刷出来。
export function planArmyWave(facing,count,random=Math.random){
 const yaw=Math.atan2(facing?.x||0,facing?.z||1);
 const behind=random()<.75;
 const side=random()<.5?1:-1;
 const jitter=(random()-.5)*.4;
 const angle=(behind?yaw+Math.PI:yaw+side*Math.PI/2)+jitter;
 return {behind,angle,count:Math.max(1,count|0)};
}
export function armySlot(wave,index,random=Math.random){
 const n=wave?.count||1,i=Math.max(0,index|0);
 const span=Math.min(1,Math.max(0,n-1)*.22);
 const along=n<=1?0:(i/(n-1)-.5)*span;
 const a=(wave?.angle||Math.PI)+along+(random()-.5)*.08;
 const dist=20+random()*8;
 return {x:Math.sin(a)*dist,z:Math.cos(a)*dist,dist};
}
export function takeSpawnJobs(queue,dt=0,perBurst=2,gap=.08){
 if(!queue?.jobs.length){if(queue)queue.wait=0;return [];}
 queue.wait=Math.max(0,(queue.wait||0)-dt);
 if(queue.wait>0)return [];
 const n=Math.max(1,Math.min(perBurst|0||1,queue.jobs.length));
 const batch=queue.jobs.splice(0,n);
 queue.wait=queue.jobs.length?gap:0;
 return batch;
}
export function spawnPlan(s,units,random=Math.random,origin=null){
 const alert=cityAlert(s);
 const d=TUNE.difficulty;
 const army=teamCount(units);
 const weight=s.level+army*(d.armyWeight??.4);
 // 开局还没到局部警情时，军队只补持棍巡警在街上巡逻，不冲锋。
 // 阶段 3 起才把 2 级巡警当耗材。冲锋从局部警情才开。
 const fodder=fodderCount(units,alert.stage);
 const indexed=ENEMIES.map((e,i)=>({e,i}));
 const opening=alert.stage<2&&!alert.lost;
 const fodderPool=alert.stage>=3?indexed.filter(({e})=>e.level<=2):indexed.filter(({i})=>i===0);
 const threatPool=opening?indexed.filter(({i})=>i===1):alert.stage>=2?indexed.filter(({e})=>e.level>=2&&e.level<=alert.maxLevel):[];
 const pick=list=>{if(!list.length)return 0;return list[Math.min(list.length-1,Math.floor(random()*list.length))].i;};
 const fodderN=alert.lost?0:fodder<=0?d.fodderDump:Math.max(0,d.fodderTarget-fodder);
 const threatN=alert.lost||!threatPool.length?0:opening?1:Math.max(1,Math.round(s.level*(d.threatPerLevel??.55)+army*(d.threatPerAlly??.4)));
 const drafted=[];
 for(let i=0;i<fodderN;i++)drafted.push(pick(fodderPool));
 for(let i=0;i<threatN;i++)drafted.push(pick(threatPool));
 // 间隔仍是本局公式：等级和友军越高，两波之间越短，并夹在 10–20 秒。
 const interval=Math.max(10,Math.min(20,d.intervalBase-weight*(d.intervalPerWeight??.45)));
 const soldiers=drafted.filter(t=>t>0);
 let rush=opening?[]:soldiers,patrol=opening?[...soldiers]:[];
 let civilians=drafted.filter(t=>t===0);
 let streetN=civilians.length;
 // 开局时行人和巡逻队按身边空街补；冲锋名单不再把这两种人算进去。
 if(origin){
  const stock=countStreetCivilians(units,origin,STREET_NEAR);
  const room=Math.max(0,STREET_CAP-stock.all);
  streetN=alert.lost?0:Math.min(4,room,Math.max(0,STREET_KEEP-stock.near));
  civilians=Array.from({length:streetN},()=>0);
  const nearPatrol=(units||[]).filter(u=>isStreetPatrol(u)&&Math.hypot(u.x-origin.x,u.z-origin.z)<=PATROL_NEAR).length;
  if(opening){
   const room=Math.max(0,PATROL_KEEP-nearPatrol);
   patrol=soldiers.slice(0,room);
   rush=[];
  }else{
   const split=splitArmyWave(soldiers,nearPatrol);
   patrol=split.patrol;
   rush=split.rush;
  }
 }
 const types=origin?[...civilians,...patrol,...rush]:drafted;
 return {types,civilians,patrol,rush,streetN,interval,weight,fodder,fodderN,threatN,army,...alert};
}
export function outcome(s){
 // 胜利锁定前死亡才算失败。余韵里要玩家自己点结束，才进入结算。
 if(s.hp<=0&&!s.bossDefeated)return 'ended';
 if(s.settle&&s.bossDefeated)return 'won';
 return null;
}
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
export function cooldownScale(s){return [1,.85,.75,.65][s.abilities.haste];}
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
// Boss 由警戒倒计时归零召唤，不再看两座中枢是否拆掉。
export function bossReady(s){return s.bossCountdown===0&&!s.bossSpawned&&!s.aftermath;}
// 倒计时一开始同时发布 3 个削弱任务。完成与否不影响 Boss 是否出现，只影响它带什么效果进场。
export const WEAKEN_TASKS=[
 {id:'shield',name:'防护削弱',detail:'摧毁防护供能设施',doneText:'已移除开场护盾',missText:'巨像保留开场护盾'},
 {id:'fire',name:'火力削弱',detail:'摧毁武器控制设施',doneText:'已移除高威力炮击',missText:'巨像保留高威力炮击'},
 {id:'reinforce',name:'增援削弱',detail:'摧毁通讯调度设施',doneText:'增援维持普通节奏',missText:'巨像战增援更快'},
];
export function publishWeakenTasks(s){
 if(s.weakenTasks)return s.weakenTasks;
 s.weakenTasks={shield:false,fire:false,reinforce:false,closed:false};
 return s.weakenTasks;
}
export function completeWeaken(s,id){
 const tasks=s.weakenTasks;
 if(!tasks||tasks.closed||!(id in tasks)||tasks[id])return false;
 tasks[id]=true;
 return true;
}
export function closeWeakenTasks(s){
 const tasks=publishWeakenTasks(s);
 tasks.closed=true;
 return tasks;
}
export function bossWeakenMods(s){
 const tasks=s.weakenTasks||{};
 return {shield:!tasks.shield,empowered:!tasks.fire,rushReinforce:!tasks.reinforce};
}
