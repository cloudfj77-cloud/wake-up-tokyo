export const TOKYO_LOOK={saturation:1.03,exposure:1.24,contrast:1.02,shadow:.65,shadowShift:[.015,.015,.025]};
export const TOKYO_FOG={near:28,far:145};
// x, z, floor height: station platform → switchback landing → sunken plaza.
export const TUTORIAL_LAYOUT={
 spawn:[5,8,-3.85],move:[3,8,-3.85],worker:[1,8,-3.85],
 exit:[[-2.75,9.35,-3.85],[-7.15,9.35,-1.65],[-8.25,7.15,-1.65],[-7.15,4.95,-1.65],[-2.75,4.95,0]],
};
export const TUTORIAL_STEPS=[
 {title:'沿站台向前走',detail:'WASD 移动，方向键或右键拖动观察。走到白色菱形标记。'},
 {title:'唤醒第一位打工人',detail:'靠近标记中的打工人，面向他，左键 / J 连续轻击两次。'},
 {title:'走出地铁站',detail:'跟随白色菱形，沿楼梯上行，前往下沉广场。'},
];
export const tutorialActive=state=>!!state.tokyoTutorial&&state.tokyoTutorial.stage<3;
export function advanceTutorial(state,player,route,worker){
 const t=state.tokyoTutorial;if(!tutorialActive(state))return false;
 const before=t.stage;
 if(t.stage===2&&t.checkpoint>=route.exit.length){t.stage=3;t.completedAt=state.time||0;return true;}
 if(t.stage===1){
  if(worker?.converted||state.infected>t.baseline){t.stage=2;t.checkpoint=0;}
 }else{
  const p=t.stage===0?route.move:route.exit[t.checkpoint];
  if(p&&Math.hypot(player.x-p.x,player.z-p.z)<1.05&&Math.abs((player.floorY??0)-p.floorY)<.4){
   if(t.stage===0)t.stage=1;
   else if(++t.checkpoint>=route.exit.length)t.stage=3;
  }
 }
 if(t.stage===3&&before!==3)t.completedAt=state.time||0;
 return t.stage!==before;
}
export function tutorialTarget(state,route,worker){
 const t=state.tokyoTutorial;
 if(!tutorialActive(state))return null;
 return t.stage===0?route.move:t.stage===1?(worker||route.worker):route.exit[t.checkpoint];
}
export function tokyoObjective(state,alert=0){
 if(tutorialActive(state)){
  const step=state.tokyoTutorial.stage;
  return {label:`地铁站教学 ${step+1} / 3`,...TUTORIAL_STEPS[step],progress:step/3,steps:TUTORIAL_STEPS.map((s,i)=>({title:s.title,done:i<step,current:i===step}))};
 }
 const count=state.infected;
 const step=count<5?0:count<15?1:2;
 const objectives=[
  {title:'在下沉广场集结同伴',detail:`唤醒打工人 ${Math.min(count,5)} / 5。靠近后连续轻击；觉醒者会帮助你战斗。`,progress:count/5},
  {title:'扩大站前行动',detail:`累计唤醒 ${Math.min(count,15)} / 15 人。探索广场和站厅，击退赶来的巡逻队。`,progress:count/15},
  {title:'突破站前封锁',detail:`警戒 ${Math.floor(alert)} / 500。继续唤醒人群、击退增援。达到 500 后，摧毁削弱设施，迎战镇压巨像。`,progress:Math.min(1,alert/500)},
 ];
 return {label:`站前行动 ${step+1} / 3`,...objectives[step],steps:objectives.map((s,i)=>({title:s.title,done:i<step,current:i===step}))};
}
// Public floors include the station, street, commercial bridge and viaduct.
// Restrict heights to authored decks so decorative roofs never become spawn sites.
export function populationZone(p){
 if(Math.abs(p.floorY)<.25&&p.x>-19&&p.x<19&&p.z>-17&&p.z<17)return 'plaza';
 if(Math.abs(p.floorY)<.25&&p.x>-15&&p.x<1&&p.z>-34&&p.z<-22)return 'hall';
 if(Math.abs(p.floorY+3.85)<.25&&p.x>-23&&p.x<23&&p.z>6.7&&p.z<9.9)return 'platform';
 if(Math.abs(p.floorY-3.3)<.15)return 'street';
 if(Math.abs(p.floorY-8.8)<.15)return 'skybridge';
 if(Math.abs(p.floorY-12.1)<.15)return 'viaduct';
 return null;
}
export function createTokyoPopulation(nav,isFree=nav.free){
 const spots=nav.nodes.flatMap((n,i)=>{
  if(n[0]%4||n[1]%4)return [];
  const p=nav.point(i),zone=populationZone(p);
  return zone&&isFree(p.x,p.z,.65,p.floorY)?[{...p,zone}]:[];
 });
 if(!spots.length)throw Error('东京街区没有可用的人群位置');
 const zones=[...new Set(spots.map(p=>p.zone))],byZone=new Map(zones.map(zone=>[zone,spots.filter(p=>p.zone===zone)]));
 const weights={plaza:3,hall:1,platform:2,street:3,skybridge:1,viaduct:2};
 function spawn({region,player,units=[],random=Math.random,accept=()=>true,radius=.65,zone,local=false}={}){
  const counts=new Map(zones.map(z=>[z,units.filter(u=>!u.dead&&!u.converted&&populationZone(u)===z).length]));
  const localZone=local&&player?populationZone(player):null;
  const ordered=(zone?[zone]:[...zones]).sort((a,b)=>(a===localZone?-1:counts.get(a)/weights[a])-(b===localZone?-1:counts.get(b)/weights[b]));
  for(const area of ordered){
   const candidates=byZone.get(area)||[],start=Math.floor(random()*candidates.length);
   for(let i=0;i<candidates.length;i++){
   const p=candidates[(start+i)%candidates.length];
   if(Number.isInteger(region)&&((p.x>=0?1:0)+(p.z>=0?2:0))!==region)continue;
   const distance=player?Math.hypot(p.x-player.x,p.z-player.z,p.floorY-(player.floorY??0)):Infinity;
   if(player&&(distance<8||(local&&distance>40)))continue;
   if(units.some(u=>!u.dead&&Math.abs((u.floorY??0)-p.floorY)<1&&Math.hypot(p.x-u.x,p.z-u.z)<1.15))continue;
   if(isFree(p.x,p.z,radius,p.floorY)&&accept(p))return {...p};
   }
  }
  return null;
 }
 function wander(u){
  // Only the first tutorial target waits in place. Older saves can retain the
  // street-map's random stationary flag on ordinary station workers.
  if(u.stationary&&u.tutorialWorker&&!u.converted)return u;
  u.stationary=false;
  const zone=populationZone(u);
  if(u.tokyoDestination&&populationZone(u.tokyoDestination)===zone&&Math.hypot(u.x-u.tokyoDestination.x,u.z-u.tokyoDestination.z)>.7)return u.tokyoDestination;
  const sameFloor=p=>Math.abs((p.floorY??0)-(u.floorY??0))<1;
  const ring=(min,max)=>(byZone.get(zone)||[]).filter(p=>sameFloor(p)&&Math.hypot(p.x-u.x,p.z-u.z)>min&&Math.hypot(p.x-u.x,p.z-u.z)<max);
  let near=ring(2,8);
  if(!near.length)near=ring(2,14);
  if(!near.length)near=ring(1,Infinity);
  u.tokyoDestination=near.length?{...near[Math.floor(Math.random()*near.length)]}:{x:u.x,z:u.z,floorY:u.floorY};
  return u.tokyoDestination;
 }
 function rebalance(units,player,{hidden=()=>true,accept=()=>true}={}){
  const zone=populationZone(player);if(!zone)return 0;
  let nearby=units.filter(u=>!u.dead&&!u.converted&&populationZone(u)===zone&&Math.hypot(u.x-player.x,u.z-player.z)<32).length;
  if(nearby>=6)return 0;
  let moved=0;
  for(const u of units){
   if(moved>=4||nearby>=6)break;
   if(!u.city||u.type>1||u.dead||u.converted||u.tutorialWorker||u.infection>0||u.aiming||u.chargePhase||u.sprayPhase||populationZone(u)===zone||!hidden(u))continue;
   if(Math.hypot(u.x-player.x,u.z-player.z)<16)continue;
   const p=spawn({zone,local:true,player,units,accept});if(!p)break;
   Object.assign(u,p,{tx:p.x,tz:p.z,tokyoDestination:null,stationary:false,wander:0,stuck:0,logicWait:0,logicElapsed:0});
   moved++;nearby++;
  }
  return moved;
 }
 return {spawn,wander,spots,rebalance};
}
