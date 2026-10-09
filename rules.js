// 初版人物上限 15。生存与进化 3 级才把上限抬到 50，而且 16 级起不再给新的三选一。
export const LEVEL_CAP=15;
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
 // drain = 敌方每秒清掉的感染（原 4，已削弱）；aid = 被同化后反过来帮玩家扩散的速率，保留原值当奖励。
 {name:'净化工兵',level:4,hp:400,threshold:300,speed:2.05,damage:10,range:8,interval:.5,aim:.25,purifier:true,spray:true,aura:10,drain:2,aid:4,allyName:'狂暴净化士兵',allyHp:200,allyAtk:5},
 {name:'大兵',level:4,hp:300,threshold:200,speed:2.45,damage:5,range:24,interval:.1,aim:0,allyName:'狂暴大兵',allyHp:150,allyAtk:2.5,grenade:{radius:5,max:50,min:10,cd:20}},
 {name:'持枪特警',level:3,hp:150,threshold:100,speed:2.65,damage:10,range:14,interval:.5,aim:.12,allyName:'狂暴持枪特警',allyHp:75,allyAtk:5},
 // 近战重装：前摇长、命中是以自身为心的范围伤害。range 保持在 3 以内，才会被判成近战而不是远程。
 {name:'重装大锤兵',level:4,hp:700,threshold:500,speed:1.85,damage:55,range:3,interval:2.6,aim:1.9,slam:{radius:4.2},allyName:'狂暴重装大锤兵',allyHp:350,allyAtk:25}
];
export const ABILITIES=[
 {id:'air',name:'空气传播',icon:'◌',group:'感染系',descriptions:[
  '持续散播反抗因子，使自身半径 5m 内的敌人每 0.5 秒累积 2 点感染值。',
  '传播半径扩大至 10m，每 0.5 秒累积 4 点感染值，并可感染尸体。',
  '传播半径扩大至 15m，每 0.5 秒累积 6 点感染值。每隔 0.5 秒，在自身周围 30m 内随机引爆一片区域，形成半径 10m、持续 3 秒的感染气雾，每 0.5 秒施加 4 点感染值，不与自身传播效果叠加。'
 ]},
 {id:'launcher',name:'可感染注射器',icon:'◎',group:'武器系',descriptions:[
  '解锁感染针，按准星方向瞄准射击，命中时累积感染值，但不造成伤害。',
  '感染针的感染累积量提高，并可穿透多名敌人。',
  '解锁「三环充能」：累计命中 3 次后，下一发射击升级为强化炮弹。'
 ]},
 {id:'frenzy',name:'狂杀',icon:'⚔',group:'母体系',descriptions:[
  '由你完成击杀或同化时，恢复 1 点生命，并永久提升 1 点生命上限。攻击、感染武器、空气传播及持续感染造成的同化均可触发。',
  '亲自击杀或同化的提升量变为 2 点。军队每累计 2 次击杀或同化，额外为你恢复 1 点生命并永久提升 1 点生命上限。体型增大，近战攻击范围适度扩大。',
  '亲自击杀或同化的提升量变为 3 点。军队提供成长的效率提升为 每次击杀或同化贡献 1 点。体型进一步增大，并解锁 「血潮」：每累计由你完成击杀或同化 10 个单位，向周围释放血肉冲击，造成范围伤害并击退敌人。感染武器、空气传播及持续感染造成的同化均计入进度；军队独立完成的不计入。'
 ]},
 {id:'dot',name:'持续感染',icon:'⌁',group:'感染系',descriptions:[
  '感染在目标体内扎根。敌人受到你施加的感染后，每秒额外累积 1 点感染值，直至同化完成。',
  '持续感染提升至每秒 2 点，并可对尸体生效。感染目标发生病变，移动速度降低 15%。',
  '持续感染提升至每秒 3 点，军队也能施加相同效果。目标感染值达到同化阈值的 50% 时，触发「深度寄生」：血肉触须将其禁锢 2 秒，此后受到的持续感染效果翻倍，直至同化完成。每个目标仅触发一次。'
 ]},
 {id:'haste',name:'急速',icon:'↟',group:'机动系',descriptions:[
  '移动速度提高 15%。',
  '奔跑时受到的伤害降低 10%。击杀敌人后，获得初始为 50% 的额外移速加成，在 3 秒内逐渐衰减至零。',
  '移动速度加成提升至 30%，奔跑减伤提升至 15%。奔跑时可撞飞沿途敌人，造成重击伤害。'
 ]},
 {id:'tough',name:'皮糙肉厚',icon:'✚',group:'母体系',descriptions:[
  '受到的伤害降低 15%。',
  '减伤提升至 25%。受到来自 10m 内敌人的攻击时，将减免的伤害反弹给攻击者，并附加相当于反弹伤害一半的感染值。',
  '自身减伤提升至 35%，反伤范围扩大至 30m。你的军队获得 15% 减伤。'
 ]},
 {id:'evolve',name:'生存与进化',icon:'✶',group:'成长系',descriptions:[
  '获得相当于自身等级 ×10 的生命加成，以及与等级等量的攻击力加成。每次升级触发「适应修复」，恢复 10% 最大生命。',
  '每生存 1 分钟，所有系数额外提高 5%。生命上限达到 500、1000 时，各额外获得一次能力进化。',
  '等级上限提升至 50，后续升级不再获得新能力。新同化的敌人提升 1 级，随机进化为对应等级的兵种；原本已为 4 级的单位保留兵种，生命提高 28%。新同化单位触发「进化狂潮」，体型暂时增大，攻击速度与移动速度提高 30%，持续 5 秒。'
 ]},
 {id:'command',name:'听我号令',icon:'⚑',group:'指挥系',descriptions:[
  '获得 2 名 2 级护卫，护卫死亡一段时间后自动再生。',
  '护卫提升至 3 级，编制扩大至 5 名。',
  '护卫提升至 4 级，编制扩大至 10 名，额外获得 100% 生命与攻击力加成，且会自动组成合适的阵容。'
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
  history:[],ammo:{pistol:0,shotgun:0,rifle:0,sniper:0,rpg:0,launcher:0},
  mags:{pistol:0,shotgun:0,rifle:0,sniper:0,rpg:0,launcher:0},
  clip:0,clipMax:0,weapon:-1,gunId:null,powerCharge:0,weaponOrder:[],
  first:null,maxChain:0,purifiers:0,highestEnemy:0,mission:0,bossDefeated:false,lastPick:-60,killRewards:[],
  frenzyHp:0,armyFrenzy:0,frenzyMarks:{500:false,1000:false},burstTime:0,commandStance:'follow',
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
 // 狂杀 2 级起人变大，近战范围跟着略增；3 级再大一圈。
 const reach=s.abilities.frenzy>=3?1.35:s.abilities.frenzy>=2?1.15:1;
 return {infection:BASE_INF*m.mult,damage:atk*m.mult,cd:m.cd,range:m.range*reach,aoe:m.aoe*reach};
}
export function refreshStats(s){
 const evolveHp=s.abilities.evolve?s.level*10*evolveCoeff(s):0;
 const next=Math.round(BASE_HP+s.frenzyHp+evolveHp);
 const delta=next-s.maxHp;
 s.maxHp=next;
 if(delta>0)s.hp+=delta;
 s.hp=Math.min(s.hp,s.maxHp);
 // 500 / 1000 的额外三选一从狂杀挪到了生存与进化 2 级。旧存档已经领过的标记不再发第二次。
 if(s.abilities.evolve>=2){
  for(const mark of [500,1000]){
   if(!s.frenzyMarks[mark]&&s.maxHp>=mark){s.frenzyMarks[mark]=true;s.pending++;}
  }
 }
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
// 注射器跟手枪同一档：弹匣 12，点出时给一匣加 24 发备弹，2 级及以上敌人补 3 发。
export const LAUNCHER_CLIP=12;
export const LAUNCHER_RESERVE=24;
export function grantKillAmmo(s,enemyLevel){
 const g=s.abilities.guns;
 if(g){
  const mult=g>=2?2:1;
  if(g>=1&&enemyLevel>=2){addAmmo(s,'pistol',3*mult);addAmmo(s,'shotgun',1*mult);}
  if(g>=2&&enemyLevel>=3){addAmmo(s,'rifle',10);addAmmo(s,'sniper',3);}
  if(g>=3&&enemyLevel>=4)addAmmo(s,'rpg',1);
 }
}
export function gunInfection(s,damage){return s.abilities.guns>=3?damage*.5:0;}
export function hasLauncher(s){return (s.abilities.launcher||0)>=1;}
// 发射器数值：1 级感染针，2 级加伤并穿透，3 级保留穿透，解锁枪械与注射器共用的三次命中充能。
export function launcherSpec(s,empowered=false){
 const lv=s.abilities.launcher||0;
 if(lv<1)return null;
 const pierce=lv>=2?2:0;
 // 普通针剂只负责「叫醒」，不带伤害；只有 3 级充能出的强化炮弹（爆炸）才结算伤害。
 const base=lv>=2
  ?{infection:14,damage:0,range:28,cd:.36,speed:36,pierce,color:0xd48aff,life:.9}
  :{infection:8,damage:0,range:24,cd:.42,speed:32,pierce,color:0xc078ff,life:.85};
 if(empowered)return {...base,infection:32,damage:12,speed:14,pierce:4,splash:6,life:4,strong:true,color:0xe4adff};
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
 // 「枪？枪！」已从能力表删除，新局点不到枪。旧存档里已经写上的枪械键位仍可用。
 // 注射器按这次点击插进键位。手上还是空的，就直接换成刚点出的那件。
 // 感染针按现行文案直接射击，不发弹匣。
 if(id==='launcher'&&s.abilities.launcher===1){rememberWeapon(s,'launcher');if(s.weapon===-1){s.weapon=LAUNCHER_SLOT;s.clip=0;s.clipMax=0;s.gunId=null;}}
 if(id==='frenzy'||id==='evolve')refreshStats(s);
 if(id==='command')s.needGuards=true;
 return true;
}
// 军队击杀/同化要凑满这么多次，才折算成 1 点生命。
export const ARMY_FRENZY_STEP=2;
// 亲自击杀：1/2/3 级各加 1/2/3。军队从 2 级起才算，2 级要攒 2 次才 +1，3 级每次 +1。
export const FRENZY_TIDE_EVERY=10;
export const FRENZY_TIDE_RADIUS=6;
export function grantFrenzy(s,fromArmy=false){
 const lv=s.abilities.frenzy;if(!lv)return 0;
 let amt=0;
 if(fromArmy){
  if(lv<2)return 0;
  if(lv===2){
   s.armyFrenzy=(s.armyFrenzy||0)+1;
   if(s.armyFrenzy<ARMY_FRENZY_STEP)return 0;
   s.armyFrenzy=0;
  }
  amt=1;
 }else{
  amt=lv;
  s.personalFrenzy=(s.personalFrenzy||0)+1;
  // 血潮只数亲自解决的人，军队的不算。凑满 10 个，等这一帧模拟去放冲击波。
  if(lv>=3&&s.personalFrenzy%FRENZY_TIDE_EVERY===0)s.tideReady=(s.tideReady||0)+1;
 }
 s.frenzyHp+=amt;
 refreshStats(s);
 return amt;
}
// 血潮打出伤害并往外推。同一帧只放一次，避免冲击波自己的击杀再套一层冲击波。
export function applyPendingTide(s,units,player){
 if(!s.tideReady||s.tideLock||!player)return [];
 s.tideReady=0;s.tideLock=true;
 const spec=meleeSpec(s,'heavy');
 const hitIds=[];
 for(const u of units||[]){
  if(u.dead||u.converted||u.kind==='corpse')continue;
  if(distance(player,u)>FRENZY_TIDE_RADIUS)continue;
  const dx=u.x-player.x,dz=u.z-player.z,dist=Math.hypot(dx,dz)||1;
  u.x+=dx/dist*3;u.z+=dz/dist*3;
  hit(s,u,0,spec.damage,false,false);
  hitIds.push(u.id);
 }
 s.tideBurst={x:player.x,z:player.z};
 s.tideLock=false;
 return hitIds;
}
export function reward(s,u,converted){
 // 余韵里胜利已经锁定，击杀和转化不再涨经验、等级或结算统计。
 if(s.aftermath)return;
 if(converted){s.infected++;if(u.city)s.cityInfected++;s.first??={name:ENEMIES[u.type].name,time:s.time};if(u.type===4)s.purifiers++;}
 else s.kills++;
 s.highestEnemy=Math.max(s.highestEnemy,ENEMIES[u.type].level);
 grantKillAmmo(s,ENEMIES[u.type].level);
 grantFrenzy(s,!!u.fromArmy);
 if(s.abilities.haste>=2&&!converted&&!u.fromArmy)s.burstTime=3;
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
   // 15 级之后只涨等级和生存与进化的数值，不再发三选一。
   if(s.level<=LEVEL_CAP)s.pending++;
   refreshStats(s);
   if(s.abilities.evolve>=1)s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.1);
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
 u.guard=false;u.fromArmy=false;u.grenadeCd=0;u.aiming=false;u.aim=0;u.guardCd=0;u.rush=false;u.stuck=0;
 u.rankBoost=false;u.rewarded=false;u.atk=undefined;u.promoted=false;
 u.parasite=false;u.root=0;u.slow=false;u.surge=0;
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
// 生存与进化 3 级用：随机挑一个高一等级的敌人当新形态。已经是最高等级时返回原类型。
export function promoteType(type,random=Math.random){
 const e=ENEMIES[type];if(!e)return type;
 const pool=[];
 for(let i=0;i<ENEMIES.length;i++)if(ENEMIES[i].level===e.level+1)pool.push(i);
 if(!pool.length)return type;
 return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
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
 // 先按实际同化的敌人结算；后续友军晋升不能抬高经验、补弹与战绩。
 reward(s,u,true);
 // 点满生存与进化：新转化的单位实打实升 1 级，随机变成高一等级的敌人。
 // 已经是最高等级时没有更高形态可换，退回原来的血量加成。
 let promoted=false;
 if(s.abilities.evolve>=3){
  const next=promoteType(u.type);
  if(next!==u.type){u.type=next;u.threshold=ENEMIES[next].threshold;promoted=true;}
 }
 const tpl=allyTemplate(u.type);
 u.converted=true;u.kind='ally';
 u.maxHp=tpl.hp;u.hp=fromCorpse?Math.ceil(tpl.hp*.6):tpl.hp;u.atk=tpl.atk;
 u.aiming=false;u.aim=0;u.attackCd=.15;u.hurt=0;
 u.corpseTime=0;u.infection=u.threshold;u.wander=0;u.tagged=false;
 u.promoted=promoted;
 // 换成更高一阶本身就已经吃到属性提升；只有换不动（本来就是最高阶）才退回旧的血量乘数。
 if(s.abilities.evolve>=3&&!promoted)applyRankBoost(u);
 // 进化狂潮：新同化的人短暂变大、打得更快、跑得更快。已经是 4 级没换兵种的也算新同化。
 if(s.abilities.evolve>=3)u.surge=5;
 onConverted?.(s,u);
 return true;
}
// 漫画特效在同化落地时补一层标记，不参与数值。
export let onConverted=null;
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
// 皮糙肉厚的减伤档位。3 级不再自带回血。
const TOUGH_DR=[0,.15,.25,.35];
export function damageAlly(u,damage,s){
 const dr=s?.abilities.tough>=3?TOUGH_DR[1]:0;
 u.hp=Math.max(0,u.hp-damage*(1-dr));u.hurt=2;
 if(u.hp===0){u.kind='fallen';u.dead=true;if(u.guard)u.guardCd=guardWanted(s).revive||30;}
}
export function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
const AIR=[
 {radius:0,perHalf:0,corpse:false},
 {radius:5,perHalf:2,corpse:false},
 {radius:10,perHalf:4,corpse:true},
 {radius:15,perHalf:6,corpse:true}
];
// 3 级气雾半径 10 米，落点在身边 30 米内，和自身光环分开结算。
export const AIR_CLOUD_RADIUS=10;
export const AIR_CLOUD_RANGE=30;
const DOT_RATE=[0,1,2,3];
// 净化不叠加：站着三四个净化工兵也只按最强的那一个算，不存在围成一圈把感染冻住的情况。
// 原本是每个各清 4 点线性累加，中后期一轮刷出三四个就能把空气传播（3 级才 12/秒）整个抵消掉，
// 4 级军队永远感染不动。现在无论多少个，都只有单个净化工兵的 2 点/秒。
export const PURIFY_MAX=2;
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
   // 取最强的一个，不累加：多来几个净化工兵不会让净化变快。
   if(p.kind==='ally')positive=Math.max(positive,ENEMIES[p.type].aid??ENEMIES[p.type].drain??8);
   else negative=Math.max(negative,ENEMIES[p.type].drain??8);
  }
  negative=Math.min(negative,PURIFY_MAX);
  const tagged=u.tagged;
  const playerDot=tagged==='player'||tagged===true||u.playerInfection===true;
  const armyDot=tagged==='army'&&s.abilities.dot>=3;
  if(playerDot)u.playerInfection=true;
  const inAura=!!(air.radius&&(!corpse||air.corpse)&&distance(player,u)<=air.radius);
  // 光环按每秒结算；气雾按半秒一跳，重叠的雾也不叠加，并且不和光环叠在同一个人身上。
  let mistGain=0;
  if(inAura){positive+=air.perHalf*2;u.mistTick=0;}
  else if(!corpse&&s.abilities.air>=3){
   let exposure=0;
   for(const cloud of s.airClouds||[]){
    if(cloud.time>0&&Math.hypot(u.x-cloud.x,u.z-cloud.z)<=AIR_CLOUD_RADIUS)exposure=Math.max(exposure,Math.min(dt,cloud.time));
   }
   if(exposure>0){
    const elapsed=(u.mistTick||0)+exposure,ticks=Math.floor((elapsed+1e-9)/.5);
    mistGain=ticks*4;u.mistTick=Math.max(0,elapsed-ticks*.5);
   }else u.mistTick=0;
  }else u.mistTick=0;
  if((inAura&&air.perHalf>0)||mistGain>0)u.playerInfection=true;
  let dot=0;
  if((playerDot||armyDot)&&(!corpse||s.abilities.dot>=2))dot=DOT_RATE[s.abilities.dot]||0;
  // 深度寄生：感染过半就禁锢一次，之后持续感染翻倍，直到同化。
  if(s.abilities.dot>=3&&!corpse&&!u.parasite&&(playerDot||armyDot)&&u.threshold&&u.infection+positive*dt+mistGain>=u.threshold*.5&&u.infection<u.threshold){
   u.parasite=true;u.root=2;
  }
  if(u.parasite)dot*=2;
  positive+=dot;
  u.slow=!!(s.abilities.dot>=2&&!corpse&&(playerDot||armyDot)&&u.infection>0);
  if(u.root>0)u.root=Math.max(0,u.root-dt);
  if(corpse&&!air.corpse&&s.abilities.dot<2)positive=0;
  u.infection=Math.max(0,Math.min(u.threshold,u.infection+(positive-negative)*dt+mistGain));
  u.purified=negative;
  if(u.infection>=u.threshold){if(u.playerInfection)u.fromArmy=false;else if(armyDot)u.fromArmy=true;if(convert(s,u))chain++;continue;}
  if(corpse){u.corpseTime-=dt;if(u.corpseTime<=0){u.dead=true;u.kind='expired';}}
 }
 s.maxChain=Math.max(s.maxChain,chain);
 return chain;
}
export function incomingDamage(s,damage){
 const t=s.abilities.tough;
 const dr=TOUGH_DR[t]||0;
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
export function hasteBonus(s){return s.abilities.haste>=3?.3:s.abilities.haste>=1?.15:0;}
// 击杀后的 3 秒加速不再翻倍：开头只快五成（burstTime=3），随时间线性回落到平时速度。
export const BURST_TIME=3,BURST_PEAK=.5;
export function burstBoost(s){
 if(!(s.burstTime>0))return 1;
 return 1+BURST_PEAK*Math.min(1,s.burstTime/BURST_TIME);
}
export function speed(s,sprinting=false){
 let v=WALK_SPEED*(1+hasteBonus(s))*burstBoost(s);
 if(sprinting)v*=SPRINT_MULT;
 return v;
}
export function sprintResist(s){
 if(s.abilities.haste>=3)return .15;
 if(s.abilities.haste>=2)return .1;
 return 0;
}
export function cooldownScale(s){return [1,.85,.75,.65][s.abilities.haste];}
export function teamCount(units){return units.filter(u=>u.kind==='ally'&&!u.dead).length;}
// 1 级两名 2 级棍警；2 级五名 3 级特警混编；3 级十名 4 级混编，生命和攻击翻倍。
export function guardWanted(s){
 const lv=s.abilities.command||0;
 if(lv===1)return {count:2,type:1,types:[1,1],hp:1,atk:1,revive:30};
 if(lv===2)return {count:5,type:3,types:[3,3,6,3,6],hp:1,atk:1,revive:25};
 if(lv===3)return {count:10,type:5,types:[5,7,4,5,7,4,5,7,4,5],hp:2,atk:2,revive:20};
 return {count:0,type:0};
}
// 编制把活着的和正在等复活的算在一起：阵亡只是过一会儿归队，不会空出名额再招新人。
export function guardRoster(units){return (units||[]).reduce((n,u)=>n+(u.guard?1:0),0);}
export function guardMissing(s,units){
 const want=guardWanted(s);
 if(!want.count)return 0;
 return Math.max(0,want.count-guardRoster(units));
}
// 3 级每半秒在身边 30 米内随机落下一片，持续 3 秒。
function placeAirCloud(s,player){
 const angle=Math.random()*Math.PI*2,radius=Math.sqrt(Math.random())*AIR_CLOUD_RANGE;
 const cloud={x:player.x+Math.cos(angle)*radius,z:player.z+Math.sin(angle)*radius,time:3};
 s.airClouds=s.airClouds||[];
 s.airClouds.push(cloud);
 // 特效可以先把雾拿出来做下落，落地再放回去。
 onAirCloudPlaced?.(s,cloud);
}
export let onAirCloudPlaced=null;
export function stepSimulation(s,units,player,dt,mode){
 if(mode!=='playing')return;
 s.time+=dt;
 if(s.burstTime>0)s.burstTime=Math.max(0,s.burstTime-dt);
 for(const u of units||[])if(u.surge>0)u.surge=Math.max(0,u.surge-dt);
 if((s.abilities.air||0)>=3){
  // 旧存档如果还记着 2 秒一跳，进这版后改回半秒，避免第一片雾等太久。
  if(s.airCycleVersion!==3){s.airPulse=(s.airPulse||0)%.5;s.airCycleVersion=3;}
  s.airPulse=(s.airPulse||0)+dt;
  while(s.airPulse+1e-9>=.5){s.airPulse=Math.max(0,s.airPulse-.5);placeAirCloud(s,player);}
 }
 tickInfection(s,units,player,dt);
 // 先结算再减时间，一整片 3 秒的雾能打满 6 次半秒感染。
 if(s.airClouds){for(const cloud of s.airClouds)cloud.time=Math.max(0,cloud.time-dt);s.airClouds=s.airClouds.filter(cloud=>cloud.time>1e-9);}
 if(s.abilities.evolve>=2)refreshStats(s);
 applyPendingTide(s,units,player);
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
