export const LEVEL_CAP=12;
export const POPULATION=58;
export const MELEE={
 light:{infection:10,damage:8,cd:.42,range:2.8},
 heavy:{infection:22,damage:16,cd:.9,range:3.2}
};
export const WALK_SPEED=7.2;
export const SPRINT_MULT=1.48;
export const ENEMIES=[
 {name:'苦逼打工人',level:1,hp:50,threshold:20,speed:3,damage:5,range:1.6,interval:1.5,aim:.2,fodder:true},
 {name:'持棍巡警',level:2,hp:100,threshold:40,speed:3.6,damage:10,range:1.9,interval:1.2,aim:.35,fodder:true},
 {name:'持枪巡警',level:3,hp:120,threshold:60,speed:3.4,damage:12,range:12,interval:1.5,aim:1.05},
 {name:'持盾特警',level:4,hp:180,threshold:110,speed:3.2,damage:14,range:2.3,interval:1.5,aim:.4,shield:true},
 {name:'净化工兵',level:6,hp:200,threshold:300,speed:2.8,damage:10,range:2.8,interval:1.5,aim:.45,purifier:true,aura:8,drain:8},
 {name:'大兵',level:6,hp:200,threshold:200,speed:3.5,damage:20,range:24,interval:1.1,aim:.9},
 {name:'持枪特警',level:5,hp:130,threshold:150,speed:3.8,damage:18,range:14,interval:1.2,aim:1.05,burst:true}
];
export const ABILITIES=[
 {id:'air',name:'空气传播',icon:'◌',group:'感染系',descriptions:['5 米范围内，每秒增加 2 点感染。','半径 6 米，每秒 +4 感染；可转化尸体。','母体半径 7 米，每秒 +6；友军获得 5 米 +2/s 光环。']},
 {id:'dot',name:'持续感染',icon:'⌁',group:'感染系',descriptions:['被命中的活体持续获得 +2/s 感染。','持续感染提高至 +4/s。','持续感染提高至 +6/s。']},
 {id:'vital',name:'潜行适应',icon:'✚',group:'母体系',descriptions:['蹲伏移速 +20%，敌人发现距离 −15%。','蹲伏移速 +40%，敌人发现距离 −25%。','蹲伏移速 +60%，敌人发现距离 −35%。']},
 {id:'haste',name:'急速',icon:'↟',group:'机动系',descriptions:['移动速度 +15%，近战冷却 −15%。','移动速度 +30%，近战冷却 −25%。','移动速度 +45%，近战冷却 −35%。']},
 {id:'guns',name:'感染注射器',icon:'⌐',group:'武器系',descriptions:['针剂感染 +5，弹匣容量 +4。','针剂感染 +10，装填时间 −25%。','针剂感染 +15，命中后向周围 2 米溅射感染。']}
];
export const WEAPONS=[{name:'终末注射枪',damage:4,range:24,cooldown:.42}];
export function makeState(){return {hp:100,maxHp:100,infected:0,cityInfected:0,kills:0,towers:0,destroyed:0,xp:0,need:12,level:1,pending:1,time:0,alert:1,peakAlert:1,abilities:{air:0,dot:0,vital:0,haste:0,guns:0},history:[],ammo:[120],clip:16,clipMax:16,weapon:-1,first:null,maxChain:0,purifiers:0,highestEnemy:0,mission:0,bossDefeated:false,lastPick:-60,killRewards:[]};}
export function choices(s,random=Math.random){return ABILITIES.filter(a=>s.abilities[a.id]<3).map(a=>({a,r:random()})).sort((a,b)=>a.r-b.r).slice(0,3).map(v=>v.a);}
export function upgrade(s,id){if(!ABILITIES.some(a=>a.id===id)||s.abilities[id]>=3||s.pending<=0)return false;s.abilities[id]++;s.pending--;s.history.push({id,level:s.abilities[id],time:s.time});if(id==='guns'&&s.abilities.guns===1){s.clipMax=20;s.clip+=4;}s.lastPick=s.time;return true;}
export function reward(s,u,converted){if(converted){s.infected++;if(u.city)s.cityInfected++;s.first??={name:ENEMIES[u.type].name,time:s.time};if(u.type===4)s.purifiers++;}else s.kills++;s.highestEnemy=Math.max(s.highestEnemy,ENEMIES[u.type].level);if(ENEMIES[u.type].level>=2)s.ammo[0]=Math.min(999,s.ammo[0]+8);if(u.rewarded)return;u.rewarded=true;if(s.level<LEVEL_CAP){s.xp+=u.type===0?1:2;while(s.xp>=s.need&&s.level<LEVEL_CAP){s.xp-=s.need;s.level++;s.need=Math.ceil(s.need*1.4+3);s.pending++;}if(s.level===LEVEL_CAP)s.xp=0;}}
export function makeUnit(id,type,x,z,city=true,profession=0){const t=ENEMIES[type];return{id,type,x,z,city,profession,kind:type===0?'human':'guard',hp:t.hp,maxHp:t.hp,infection:0,threshold:t.threshold,corpseTime:0,dead:false,converted:false,tagged:false,attackCd:Math.random(),wander:0,tx:x,tz:z,purified:0,hurt:0};}
export function convert(s,u){if(u.converted||u.dead)return false;u.converted=true;u.kind='ally';u.hp=Math.max(u.hp,Math.ceil(u.maxHp*.4));u.corpseTime=0;u.infection=u.threshold;u.wander=0;reward(s,u,true);return true;}
export function hit(s,u,infection,damage,fromFront=false){if(u.dead||u.converted||u.kind==='corpse')return 'none';if(ENEMIES[u.type].shield&&fromFront)damage*=.5;u.infection=Math.min(u.threshold,u.infection+infection);u.tagged||=infection>0;if(u.infection>=u.threshold){convert(s,u);return 'converted';}u.hp=Math.max(0,u.hp-damage);u.hurt=2;if(u.hp<=0){u.kind='corpse';u.corpseTime=12;reward(s,u,false);return 'killed';}return 'hit';}
export function damageAlly(u,damage){u.hp=Math.max(0,u.hp-damage);u.hurt=2;if(u.hp===0){u.kind='fallen';u.dead=true;}}
export function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
export function tickInfection(s,units,player,dt){let chain=0;const air=s.abilities.air;const purifiers=units.filter(u=>!u.dead&&u.kind!=='corpse'&&u.type===4);const emitters=air===3?units.filter(u=>u.kind==='ally'&&!u.dead):[];for(const u of units){u.purified=0;if(u.dead||u.converted)continue;const corpse=u.kind==='corpse';let positive=0,negative=0;for(const p of purifiers){if(p===u||distance(p,u)>(ENEMIES[p.type].aura||8))continue;if(p.kind==='ally')positive+=ENEMIES[p.type].drain||8;else negative+=ENEMIES[p.type].drain||8;}if(air&&(!corpse||air>=2)){if(distance(player,u)<=4+air)positive+=air*2;for(const a of emitters)if(distance(a,u)<5)positive+=2;}if(!corpse&&u.tagged)positive+=s.abilities.dot*2;if(corpse&&air<2)positive=0;u.infection=Math.max(0,Math.min(u.threshold,u.infection+(positive-negative)*dt));u.purified=negative;if(u.infection>=u.threshold){if(convert(s,u))chain++;continue;}if(corpse){u.corpseTime-=dt;if(u.corpseTime<=0){u.dead=true;u.kind='expired';}}}s.maxChain=Math.max(s.maxChain,chain);return chain;}
export const TUNE_DEFAULTS={
 alert:{stage2At:90,stage3At:180,maxLevel1:2,maxLevel2:4,maxLevel3:6,pressureTime:0},
 difficulty:{armyWeight:.35,fodderBase:4,fodderDiv:3,fodderMin:1,threatWeight:3,threatMax:3,intervalBase:15,intervalPerWeight:.85,intervalMin:6,fodderSlowAt:8,fodderSlowAdd:2},
 activity:{shambleSpeed:.65,shambleRadius:4,shambleIdle:6,fleeSpeed:.85,awakeSpeed:5.6,awakeRadius:34,awakeIdle:1.05,chaseSpeed:5.4,followSpeed:6.1,structureSpeed:4.6}
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
export function fodderCount(units){return units.filter(u=>!u.dead&&!u.converted&&u.kind!=='corpse'&&ENEMIES[u.type].fodder).length;}
export function spawnPlan(s,units,random=Math.random){
 const alert=cityAlert(s);
 const d=TUNE.difficulty;
 const weight=difficultyWeight(s,units);
 const fodder=fodderCount(units);
 const pool=ENEMIES.map((e,i)=>({e,i})).filter(({e})=>e.level<=alert.maxLevel);
 const fodderPool=pool.filter(({e})=>e.fodder);
 const threatPool=pool.filter(({e})=>!e.fodder);
 const pick=list=>{if(!list.length)return 0;return list[Math.min(list.length-1,Math.floor(random()*list.length))].i;};
 const fodderN=Math.max(d.fodderMin,d.fodderBase-Math.floor(fodder/d.fodderDiv));
 const threatN=alert.maxLevel<=TUNE.alert.maxLevel1?0:Math.min(d.threatMax,1+Math.floor(weight/d.threatWeight));
 const types=[];
 for(let i=0;i<fodderN;i++)types.push(pick(fodderPool));
 for(let i=0;i<threatN;i++)types.push(pick(threatPool.length?threatPool:fodderPool));
 const interval=Math.max(d.intervalMin,d.intervalBase-weight*d.intervalPerWeight+(fodder>d.fodderSlowAt?d.fodderSlowAdd:0));
 return {types,interval,weight,fodder,fodderN,threatN,...alert};
}
export function outcome(s){return s.hp<=0?'ended':s.bossDefeated?'won':null;}
export function speed(s,sprinting=false){return WALK_SPEED*(1+s.abilities.haste*.15)*(sprinting?SPRINT_MULT:1);}
export function cooldownScale(s){return [1,.85,.75,.65][s.abilities.haste];}
export function teamCount(units){return units.filter(u=>u.kind==='ally'&&!u.dead).length;}
export function stepSimulation(s,units,player,dt,mode){if(mode!=='playing')return;s.time+=dt;tickInfection(s,units,player,dt);}

export function hurtMother(s,damage,source='秩序火力'){s.lastDamage=source+' · '+damage+' 伤害';s.damageLog??=[];s.damageLog.push({time:s.time,source,damage,before:s.hp});s.damageLog=s.damageLog.slice(-5);s.hp=Math.max(0,s.hp-damage);return s.hp===0;}
export function missionReady(s){return [()=>s.infected>=3,()=>s.infected>=10&&s.towers>=1,()=>s.highestEnemy>=5&&s.towers>=2,()=>s.infected>=40&&s.towers===3,()=>s.bossDefeated][s.mission]?.()??false;}
export const MISSIONS=[['叫醒第一个人','累计感染 3 人'],['让街区失控','感染 10 人，摧毁首座中枢'],['突破镇压','击败 / 转化净化工兵或持枪特警，摧毁两座中枢'],['唤出巨像','累计感染 40 人，摧毁三座中枢'],['东京人觉醒','击败中央路口的巨大 Boss']];
