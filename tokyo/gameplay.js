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
  {title:'在街区集结同伴',detail:`唤醒打工人 ${Math.min(count,5)} / 5。靠近后连续轻击；觉醒者会帮助你战斗。`,progress:count/5},
  {title:'扩大街区行动',detail:`累计唤醒 ${Math.min(count,15)} / 15 人。探索道路、广场和站厅，击退赶来的巡逻队。`,progress:count/15},
  {title:'突破街区封锁',detail:`警戒 ${Math.floor(alert)} / 500。继续唤醒人群、击退增援。达到 500 后，摧毁削弱设施，迎战镇压巨像。`,progress:Math.min(1,alert/500)},
 ];
 return {label:`街区行动 ${step+1} / 3`,...objectives[step],steps:objectives.map((s,i)=>({title:s.title,done:i<step,current:i===step}))};
}
// 行人可使用站台、广场、站厅和街面；高架与屋顶不作为日常刷人位置。
export function populationZone(p){
 if(Math.abs(p.floorY)<.25&&p.x>-19&&p.x<19&&p.z>-17&&p.z<17)return 'plaza';
 if(Math.abs(p.floorY)<.25&&p.x>-15&&p.x<1&&p.z>-34&&p.z<-22)return 'hall';
 if(Math.abs(p.floorY+3.85)<.25&&p.x>-23&&p.x<23&&p.z>6.7&&p.z<9.9)return 'platform';
 if(p.floorY>2.95&&p.floorY<3.7&&p.x>-58&&p.x<78&&p.z>-60&&p.z<55)return 'street';
 return null;
}
export function populationSector(p){
 if(populationZone(p)!=='street')return populationZone(p);
 const x=(p.x-10)/68,z=(p.z+2.5)/57.5;
 if(Math.max(Math.abs(x),Math.abs(z))<.5)return 'street-inner';
 return Math.abs(x)>Math.abs(z)?(x<0?'street-west':'street-east'):(z<0?'street-north':'street-south');
}
export function createTokyoPopulation(nav,isFree=nav.free){
 const spots=nav.nodes.flatMap((n,i)=>{
  if(n[0]%4||n[1]%4)return [];
  const p=nav.point(i),zone=populationZone(p);
  return zone&&isFree(p.x,p.z,.65,p.floorY)?[{...p,zone,sector:populationSector(p)}]:[];
 });
  if(!spots.length)throw Error('东京街区没有可用的人群位置');
 // 将四侧街道与地下公共区域分开配额，避免大面积街面挤掉站台人群。
 const buckets=new Map();for(const p of spots){const key=p.sector+':'+((p.x>=0?1:0)+(p.z>=0?2:0));if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(p);}
 function spawn({region,player,units=[],random=Math.random,accept=()=>true,radius=.65,type,nearPlayer=false}={}){
  let pools=[...buckets.values()].filter(list=>!Number.isInteger(region)||((list[0].x>=0?1:0)+(list[0].z>=0?2:0))===region);
  if(type===1&&!nearPlayer){const outer=pools.filter(list=>list[0].zone==='street'&&list[0].sector!=='street-inner');if(outer.length)pools=outer;}
  const occupied=new Map();
  for(const u of units)if(!u.dead&&u.kind!=='corpse'&&(type===undefined||u.type===type)){const key=populationSector(u)+':'+((u.x>=0?1:0)+(u.z>=0?2:0));occupied.set(key,(occupied.get(key)||0)+1);}
  const offset=Math.floor(random()*Math.max(1,pools.length));pools=pools.slice(offset).concat(pools.slice(0,offset));
  pools.sort((a,b)=>(occupied.get(a[0].sector+':'+((a[0].x>=0?1:0)+(a[0].z>=0?2:0)))||0)-(occupied.get(b[0].sector+':'+((b[0].x>=0?1:0)+(b[0].z>=0?2:0)))||0));
  // 作战增援优先落在玩家所在楼层附近，避免隔着楼板或从地图另一端赶来。
  for(const sameFloor of nearPlayer&&player?[true,false]:[false])for(const list of pools){
   const start=Math.floor(random()*list.length);
   for(let i=0;i<list.length;i++){
    const p=list[(start+i)%list.length],distance=player?Math.hypot(p.x-player.x,p.z-player.z):0;
    if(player&&(distance<8||(nearPlayer&&distance>34)))continue;
    if(sameFloor&&Math.abs(p.floorY-(player.floorY??0))>.5)continue;
    if(units.some(u=>!u.dead&&Math.abs((u.floorY??0)-p.floorY)<1&&Math.hypot(p.x-u.x,p.z-u.z)<1.15))continue;
    if(isFree(p.x,p.z,radius,p.floorY)&&accept(p))return {...p};
   }
  }
  return null;
 }
 function wander(u,{radius=8,random=Math.random}={}){
  const awake=!!u.converted||u.kind==='ally';
  if(u.stationary&&!awake)return u;
  if(awake)u.stationary=false;
  const maxRadius=Math.max(.5,radius),old=u.tokyoDestination;
  if(old&&!!old.freeRoam===awake&&Math.hypot(u.x-old.x,u.z-old.z)>.7&&Math.hypot(u.x-old.x,u.z-old.z)<=maxRadius)return old;
  // 驻留区只约束未感染者；觉醒者在广场边缘、楼梯或战斗结束的位置也必须能取得新目的地。
  const zone=populationZone(u),near=spots.filter(p=>{
   const d=Math.hypot(p.x-u.x,p.z-u.z);
   return (awake||p.zone===zone)&&d>Math.min(2,maxRadius*.5)&&d<maxRadius&&(!u.roamAvoid||Math.hypot(p.x-u.roamAvoid.x,p.z-u.roamAvoid.z)>.7);
  });
  let p;
  if(awake){
   // 优先采用附近同层的可直达路点，让无目标时立即迈步；其他候选仍交给正常寻路处理。
   const local=near.filter(q=>Math.abs(q.floorY-(u.floorY??0))<.4&&Math.hypot(q.x-u.x,q.z-u.z)<=8),start=Math.floor(random()*Math.max(1,local.length));
   for(let i=0;i<Math.min(4,local.length);i++){const q=local[(start+i)%local.length];if(isFree(q.x,q.z,.22,q.floorY)&&nav.clear(u,q)){p=q;break;}}
   p??=near.length?near[Math.floor(random()*near.length)]:null;
   // 可走地面已延伸到旧人口采样区外时，就近取真实路面，不把出生区当作行动边界。
   if(!p)for(let i=0;i<8;i++){
    const a=(i/8+random())*Math.PI*2,d=Math.min(maxRadius,2+random()*4),x=u.x+Math.cos(a)*d,z=u.z+Math.sin(a)*d;
    if(!isFree(x,z,.22,u.floorY))continue;
    const q={x,z,floorY:nav.heightAt(x,z,u.floorY)};if(nav.clear(u,q)){p=q;break;}
   }
  }else p=near.length?near[Math.floor(random()*near.length)]:null;
  u.roamAvoid=undefined;
  u.tokyoDestination=p?{...p,freeRoam:awake}:undefined;
  return u.tokyoDestination||u;
 }
 return {spawn,wander,spots};
}
