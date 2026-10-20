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
// Population stays on authored public floors, never on the street deck or station roofs.
export function populationZone(p){
 if(Math.abs(p.floorY)<.25&&p.x>-19&&p.x<19&&p.z>-17&&p.z<17)return 'plaza';
 if(Math.abs(p.floorY)<.25&&p.x>-15&&p.x<1&&p.z>-34&&p.z<-22)return 'hall';
 if(Math.abs(p.floorY+3.85)<.25&&p.x>-23&&p.x<23&&p.z>6.7&&p.z<9.9)return 'platform';
 return null;
}
export function createTokyoPopulation(nav,isFree=nav.free){
 const spots=nav.nodes.flatMap((n,i)=>{
  if(n[0]%4||n[1]%4)return [];
  const p=nav.point(i),zone=populationZone(p);
  return zone&&isFree(p.x,p.z,.65,p.floorY)?[{...p,zone}]:[];
 });
 if(!spots.length)throw Error('下沉区域没有可用的人群位置');
 function spawn({region,player,units=[],random=Math.random,accept=()=>true,radius=.65}={}){
  const start=Math.floor(random()*spots.length);
  for(let i=0;i<spots.length;i++){
   const p=spots[(start+i)%spots.length];
   if(Number.isInteger(region)&&((p.x>=0?1:0)+(p.z>=0?2:0))!==region)continue;
   if(player&&Math.hypot(p.x-player.x,p.z-player.z)<8)continue;
   if(units.some(u=>!u.dead&&Math.abs((u.floorY??0)-p.floorY)<1&&Math.hypot(p.x-u.x,p.z-u.z)<1.15))continue;
   if(isFree(p.x,p.z,radius,p.floorY)&&accept(p))return {...p};
  }
  return null;
 }
 function wander(u){
  if(u.stationary)return u;
  if(u.tokyoDestination&&Math.hypot(u.x-u.tokyoDestination.x,u.z-u.tokyoDestination.z)>.7)return u.tokyoDestination;
  const zone=populationZone(u),near=spots.filter(p=>p.zone===zone&&Math.hypot(p.x-u.x,p.z-u.z)>2&&Math.hypot(p.x-u.x,p.z-u.z)<8);
  u.tokyoDestination=near.length?{...near[Math.floor(Math.random()*near.length)]}:{x:u.x,z:u.z,floorY:u.floorY};
  return u.tokyoDestination;
 }
 return {spawn,wander,spots};
}
