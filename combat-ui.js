// 读取结算后的生命与污染变化，减伤、护盾和觉醒仍由战斗规则决定。
export function combatDelta(before, after) {
 if (!before || before.dead || (before.kind === 'corpse' && after.kind === 'corpse')) return [];
 if (!before.converted && after.converted) return [{kind:'awaken',amount:0}];
 const events=[];
 const lost=Math.max(0,before.hp-after.hp);
 const shield=Math.max(0,(before.shieldHp||0)-(after.shieldHp||0));
 const infection=Math.max(0,(after.infection||0)-(before.infection||0));
 if(lost>0)events.push({kind:'damage',amount:lost});
 if(shield>0)events.push({kind:'shield',amount:shield});
 if(infection>0)events.push({kind:'infection',amount:infection});
 return events;
}
// 整张爆贴按数值缓慢放大，底板、标签和数字使用同一个倍率；大伤害有上限。
export function combatFeedbackScale(amount,kind='damage'){
 if(kind==='awaken')return .85;
 return Math.min(1.24,.58+.16*Math.log2(1+Math.max(0,amount)/10));
}
// 数字避开身体投影；接近屏幕边缘时换到另一侧，保留可读空间。
export function combatPopupPosition(point,kind,width=Infinity,age=0){
 const gap=point.sideOffset||64,direction=kind==='infection'?1:-1;
 let x=point.x+gap*direction;
 if(x<42||x>width-42)x=point.x-gap*direction;
 x=Math.max(42,Math.min(width-42,x));
 return {x,y:point.y-age*16+(kind==='infection'?20:-10)};
}
export const combatAmount=amount=>String(Number(Math.max(.1,amount).toFixed(1)));
const sample=u=>({hp:u.hp,shieldHp:u.shieldHp,infection:u.infection,converted:u.converted,dead:u.dead,kind:u.kind});
export function createCombatUI(doc, project, onImpact=()=>{}, feedbackTone=(_,side)=>side==='ally') {
 const host=doc.createElement('div');host.id='combatFeedback';host.setAttribute('aria-hidden','true');doc.getElementById('hud').append(host);
 const snapshots=new Map(), impactTimes=new Map(), pending=new Map(), active=[], impacts=[];
 let now=0,hpHold=0,trail=1;
 const descriptors=(units,state,player,boss)=>[
  {key:'player',entity:state,anchor:player,side:'player'},
  ...units.map(u=>({key:u.id,entity:u,anchor:u,side:u.converted?'ally':'enemy'})),
  ...(boss.active?[{key:'boss',entity:boss,anchor:boss,side:'enemy'}]:[])
 ];
 function baseline(units,state,player,boss){
  // 保留上帧结算快照，鼠标/键盘事件中的单次近战不能在下一帧被覆盖。
  const live=new Set();for(const d of descriptors(units,state,player,boss)){live.add(d.key);if(!snapshots.has(d.key))snapshots.set(d.key,sample(d.entity));}
  for(const key of snapshots.keys())if(!live.has(key)){snapshots.delete(key);impactTimes.delete(key);}
 }
 function observe(units,state,player,boss){
  for(const descriptor of descriptors(units,state,player,boss)){
   const d={...descriptor,subdued:feedbackTone(descriptor.anchor,descriptor.side,descriptor.key)};
   const current=sample(d.entity),before=snapshots.get(d.key);
   const events=combatDelta(before,current),canShow=events.length&&!!project(d.anchor,d.key==='boss'?2.2:null);
   if(canShow&&now-(impactTimes.get(d.key)??-Infinity)>=(events.some(e=>e.kind==='damage'||e.kind==='shield')?.1:.28)){
    const impactKind=onImpact(d.anchor,d.side,events,d.key,d.subdued);
    if(impactKind!==false){
     const existing=impacts.find(i=>i.key===d.key);
     if(existing){existing.node.remove();impacts.splice(impacts.indexOf(existing),1);}
     impactTimes.set(d.key,now);
     if(impacts.length>=20)impacts.shift().node.remove();
     if(d.subdued&&impacts.filter(i=>i.subdued).length>=4){const i=impacts.findIndex(i=>i.subdued);impacts.splice(i,1)[0].node.remove();}
     const node=doc.createElement('div');node.className=`combatImpact ${events.some(e=>e.kind==='damage'||e.kind==='shield')?'damageImpact':'pollutionImpact'} ${impactKind||'light'} ${d.subdued?'subdued':''}`;
     host.append(node);impacts.push({...d,node,born:now});
    }
   }
   for(const event of events){
    const key=`${d.key}:${event.kind}`;
    const item=pending.get(key);
    if(canShow&&item){item.amount+=event.amount;item.subdued=item.subdued&&d.subdued;}
    // 首次变化同帧显示，数值合并交给已显示爆贴的短窗口，不再先等待。
    else if(canShow)pending.set(key,{...d,...event,ready:now});
    if(d.side==='player'&&event.kind==='damage'){
     hpHold=.55;trail=Math.max(trail,before.hp/state.maxHp);
     doc.getElementById('playerHit').textContent=`−${combatAmount(event.amount)}`;
     doc.querySelector('.playerPanel').classList.remove('impact');
     // 重新读取布局，让连续受击也能重播这段短促的震动。
     void doc.querySelector('.playerPanel').offsetWidth;
     doc.querySelector('.playerPanel').classList.add('impact');
    }
   }
   snapshots.set(d.key,current);
  }
 }
 function tick(dt,playing,state){
  now+=dt;
  if(!playing){pending.clear();snapshots.clear();impactTimes.clear();for(const item of [...active,...impacts])item.node.remove();active.length=impacts.length=0;return;}
  hpHold=Math.max(0,hpHold-dt);const hp=Math.max(0,state.hp/state.maxHp);
  trail=hp>trail?hp:hpHold>0?trail:Math.max(hp,trail-dt*.6);
  doc.getElementById('hpTrail').style.width=`${trail*100}%`;
  doc.querySelector('.playerPanel').classList.toggle('critical',hp<=.25);
  for(const [key,item] of pending){
   if(now<item.ready)continue;pending.delete(key);
   if(!project(item.anchor,item.key==='boss'?2.2:null))continue;
   // 同一目标的连射在短窗口内合并，防止多个数字重叠成一团。
   const previous=active.findIndex(a=>a.key===item.key&&a.kind===item.kind);
   if(previous>=0){
    const old=active[previous];
    if(now-old.started<.45){
     old.amount+=item.amount;old.born=now;old.subdued=old.subdued&&item.subdued;
     old.node.className=`combatPop ${old.kind} ${old.side} ${old.subdued?'subdued':''}`;
     old.node.style.setProperty('--combat-scale',combatFeedbackScale(old.amount,old.kind)*(old.subdued?.7:1));
     old.node.querySelector('b').textContent=old.kind==='awaken'?'觉醒':`${old.kind==='infection'?'+':'−'}${combatAmount(old.amount)}`;
     continue;
    }
    old.node.remove();active.splice(previous,1);
   }
   if(item.subdued&&active.filter(a=>a.subdued).length>=8){const i=active.findIndex(a=>a.subdued);active.splice(i,1)[0].node.remove();}
   if(active.length>=32){const i=Math.max(0,active.findIndex(a=>a.subdued));active.splice(i,1)[0].node.remove();}
   const node=doc.createElement('div');node.className=`combatPop ${item.kind} ${item.side} ${item.subdued?'subdued':''}`;
   const tag=doc.createElement('small'),number=doc.createElement('b');
   tag.textContent=item.kind==='infection'?'污染':item.kind==='awaken'?'WAKE UP!':item.kind==='shield'?'护盾':item.side==='player'?'受击':item.side==='ally'?'同伴受击':'HIT';
   number.textContent=item.kind==='awaken'?'觉醒':`${item.kind==='infection'?'+':'−'}${combatAmount(item.amount)}`;
   node.style.setProperty('--combat-scale',combatFeedbackScale(item.amount,item.kind)*(item.subdued?.7:1));
   node.append(tag,number);host.append(node);active.push({...item,node,born:now,started:now});
  }
  for(let i=impacts.length-1;i>=0;i--){
   const item=impacts[i],age=now-item.born,point=project(item.anchor,item.key==='boss'?2.2:null);
   if(age>.26){item.node.remove();impacts.splice(i,1);continue;}
   item.node.hidden=!point;if(point){item.node.style.left=`${point.x}px`;item.node.style.top=`${point.y}px`;item.node.style.opacity=Math.max(0,1-age/.26)*(item.subdued?.25:1);}
  }
  for(let i=active.length-1;i>=0;i--){
   const item=active[i],age=now-item.born,point=project(item.anchor,item.key==='boss'?2.2:null);
   if(age>(item.subdued?.65:1.05)){item.node.remove();active.splice(i,1);continue;}
   item.node.hidden=!point;
   if(point){const placed=combatPopupPosition({...point,sideOffset:(point.sideOffset||64)+Math.max(0,(combatFeedbackScale(item.amount,item.kind)-.8)*44)},item.kind,doc.defaultView?.innerWidth??Infinity,age);item.node.style.left=`${placed.x}px`;item.node.style.top=`${placed.y}px`;item.node.style.opacity=Math.min(1,((item.subdued?.65:1.05)-age)*4)*(item.subdued?.38:1);}
  }
 }
 return {baseline,observe,tick};
}
