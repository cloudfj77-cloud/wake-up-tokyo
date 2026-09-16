import {MISSIONS,missionReady} from './missions.js';
export {MISSIONS,missionReady};

export const LEVEL_CAP=12;
export const POPULATION=58;
// Values absent from the supplied UI reference are explicit Demo tuning.
export const ENEMIES=[
 {name:'苦逼打工人',level:1,hp:80,threshold:60,speed:2.5,damage:0,range:0},
 {name:'持棍巡警',level:2,hp:150,threshold:100,speed:3.4,damage:35,range:1.9},
 {name:'持枪特警',level:3,hp:190,threshold:140,speed:2.8,damage:50,range:19},
 {name:'防暴警察',level:4,hp:260,threshold:200,speed:2.2,damage:60,range:2.3},
 {name:'净化士兵',level:5,hp:180,threshold:130,speed:2.6,damage:50,range:14,purifier:true},
 {name:'大兵',level:6,hp:220,threshold:170,speed:3,damage:50,range:24},
 {name:'重装指挥官',level:7,hp:340,threshold:220,speed:2.2,damage:50,range:26}
];
export const ABILITIES=[
 {id:'air',name:'空气传播',icon:'◌',group:'感染系',descriptions:['5 米范围内，每秒增加 2 点感染。','半径 6 米，每秒 +4 感染；可转化尸体。','母体半径 7 米，每秒 +6；友军获得 5 米 +2/s 光环。']},
 {id:'dot',name:'持续感染',icon:'⌁',group:'感染系',descriptions:['被命中的活体持续获得 +2/s 感染。','持续感染提高至 +4/s。','持续感染提高至 +6/s。']},
 {id:'vital',name:'潜行适应',icon:'✚',group:'母体系',descriptions:['蹲伏移速 +20%，敌人发现距离 −15%。','蹲伏移速 +40%，敌人发现距离 −25%。','蹲伏移速 +60%，敌人发现距离 −35%。']},
 {id:'haste',name:'急速',icon:'↟',group:'机动系',descriptions:['移动速度 +15%，近战与翻滚冷却 −15%。','移动速度 +30%，近战与翻滚冷却 −25%。','移动速度 +45%，近战与翻滚冷却 −35%。']},
 {id:'launcher',name:'可感染发射器',icon:'◎',group:'武器系',descriptions:['解锁感染针，按 2 切换。','感染和伤害提高，并可穿透多名目标。','连续发射 6 次后，下一发变为强化炮弹。']}
];
export const WEAPONS=[{name:'可感染发射器',damage:4,range:24,cooldown:.42}];
export function makeState(){return {hp:100,maxHp:100,infected:0,cityInfected:0,kills:0,towers:0,destroyed:0,xp:0,need:12,level:1,pending:1,time:0,alert:1,peakAlert:1,abilities:{air:0,dot:0,vital:0,haste:0,launcher:0},history:[],ammo:[120],clip:16,clipMax:16,weapon:-1,charge:0,first:null,maxChain:0,purifiers:0,highestEnemy:0,mission:0,bossDefeated:false,tutorialStep:0,tutorialValue:0,tutorialDone:false,tutorialSkipped:false,lastPick:-60,killRewards:[]};}
export function availableAbilities(s){return ABILITIES.filter(a=>s.abilities[a.id]<3);}
export function choices(s,random=Math.random){return availableAbilities(s).map(a=>({a,r:random()})).sort((a,b)=>a.r-b.r).slice(0,3).map(v=>v.a);}
function blockedChoiceIds(current,seen){const blocked=new Set(seen||[]);for(const ability of current||[])if(ability?.id)blocked.add(ability.id);return blocked;}
// 每次只换一张卡，刚刷掉和本轮见过的能力都不会再次出现。
export function rerollChoice(s,current,index,random=Math.random,seen){if(!Array.isArray(current)||index<0||index>=current.length)return null;const blocked=blockedChoiceIds(current,seen),pool=availableAbilities(s).filter(a=>!blocked.has(a.id));if(!pool.length)return null;const next=current.slice();next[index]=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];return next;}
export function hasRerollPool(s,current,seen){if(!Array.isArray(current))return false;const blocked=blockedChoiceIds(current,seen);return availableAbilities(s).some(a=>!blocked.has(a.id));}
export function hasLauncher(s){return (s.abilities.launcher||0)>0;}
// 三级发射器沿用现有炮弹表现，但只有第七次发射才真正消耗六段蓄力。
export function consumeLauncherCharge(s){if((s.abilities.launcher||0)<3)return false;s.charge??=0;if(s.charge>=6){s.charge=0;return true;}s.charge++;return false;}
export function launcherSpec(s,empowered=false){const level=s.abilities.launcher||0;if(!level)return null;const base=level>=2?{infection:20,damage:8,range:28,cooldown:.36,speed:36,pierce:2}:{infection:12,damage:4,range:24,cooldown:.42,speed:32,pierce:0};return empowered?{...base,infection:45,damage:12,speed:14,pierce:4,strong:true}:{...base,strong:false};}
export function upgrade(s,id){if(!ABILITIES.some(a=>a.id===id)||s.abilities[id]>=3||s.pending<=0)return false;s.abilities[id]++;s.pending--;s.history.push({id,level:s.abilities[id],time:s.time});if(id==='launcher'&&s.abilities.launcher===1)s.weapon=0;s.lastPick=s.time;return true;}
export function reward(s,u,converted){if(converted){s.infected++;if(u.city)s.cityInfected++;s.first??={name:ENEMIES[u.type].name,time:s.time};if(u.type===4)s.purifiers++;}else s.kills++;s.highestEnemy=Math.max(s.highestEnemy,ENEMIES[u.type].level);if(ENEMIES[u.type].level>=2)s.ammo[0]=Math.min(999,s.ammo[0]+8);if(u.rewarded)return;u.rewarded=true;if(s.level<LEVEL_CAP){s.xp+=u.type===0?1:2;while(s.xp>=s.need&&s.level<LEVEL_CAP){s.xp-=s.need;s.level++;s.need=Math.ceil(s.need*1.4+3);s.pending++;}if(s.level===LEVEL_CAP)s.xp=0;}}
export function makeUnit(id,type,x,z,city=true,profession=0){const t=ENEMIES[type];return{id,type,x,z,city,profession,kind:type===0?'human':'guard',hp:t.hp,maxHp:t.hp,infection:0,threshold:t.threshold,corpseTime:0,dead:false,converted:false,tagged:false,attackCd:Math.random(),wander:0,tx:x,tz:z,purified:0,hurt:0};}
export function convert(s,u){if(u.converted||u.dead)return false;u.converted=true;u.kind='ally';u.hp=Math.max(u.hp,Math.ceil(u.maxHp*.4));u.corpseTime=0;u.infection=u.threshold;reward(s,u,true);return true;}
export function hit(s,u,infection,damage){if(u.dead||u.converted||u.kind==='corpse')return 'none';u.infection=Math.min(u.threshold,u.infection+infection);u.tagged||=infection>0;if(u.infection>=u.threshold){convert(s,u);return 'converted';}u.hp=Math.max(0,u.hp-damage);u.hurt=2;if(u.hp<=0){u.kind='corpse';u.corpseTime=12;reward(s,u,false);return 'killed';}return 'hit';}
export function damageAlly(u,damage){u.hp=Math.max(0,u.hp-damage);u.hurt=2;if(u.hp===0){u.kind='fallen';u.dead=true;}}
export function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
export function tickInfection(s,units,player,dt){let chain=0;const air=s.abilities.air;const purifiers=units.filter(u=>!u.dead&&u.kind!=='corpse'&&u.type===4);const emitters=air===3?units.filter(u=>u.kind==='ally'&&!u.dead):[];for(const u of units){u.purified=0;if(u.dead||u.converted)continue;const corpse=u.kind==='corpse';let positive=0,negative=0;for(const p of purifiers){if(p===u||distance(p,u)>6)continue;if(p.kind==='ally')positive+=8;else negative+=8;}if(air&&(!corpse||air>=2)){if(distance(player,u)<=4+air)positive+=air*2;for(const a of emitters)if(distance(a,u)<5)positive+=2;}if(!corpse&&u.tagged)positive+=s.abilities.dot*2;if(corpse&&air<2)positive=0;u.infection=Math.max(0,Math.min(u.threshold,u.infection+(positive-negative)*dt));u.purified=negative;if(u.infection>=u.threshold){if(convert(s,u))chain++;continue;}if(corpse){u.corpseTime-=dt;if(u.corpseTime<=0){u.dead=true;u.kind='expired';}}}s.maxChain=Math.max(s.maxChain,chain);return chain;}
export function threat(s){return s.infected>=25||s.towers>=2||s.time>=180?3:s.infected>=10||s.towers>=1||s.time>=90?2:1;}
export function outcome(s){return s.hp<=0?'ended':s.bossDefeated?'won':null;}
export function speed(s){return 5.8*(1+s.abilities.haste*.15);}
export function cooldownScale(s){return [1,.85,.75,.65][s.abilities.haste];}
export function teamCount(units){return units.filter(u=>u.kind==='ally'&&!u.dead).length;}
export function stepSimulation(s,units,player,dt,mode){if(mode!=='playing')return;s.time+=dt;tickInfection(s,units,player,dt);}

export function hurtMother(s,damage,source='秩序火力'){s.lastDamage=source+' · '+damage+' 伤害';s.damageLog??=[];s.damageLog.push({time:s.time,source,damage,before:s.hp});s.damageLog=s.damageLog.slice(-5);s.hp=Math.max(0,s.hp-damage);return s.hp===0;}
