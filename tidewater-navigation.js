import * as T from 'three';

// Wake Up uses a single floor height per XZ position. Keep only reachable walking
// surfaces; roofs, seawalls and ornamental railing tops never become spawn points.
export function createTidewaterNavigation(level) {
 const bounds=level.bounds,probe=new T.Vector3(),top=new T.Vector3(),ids=[];
 const step=.5,width=Math.ceil((bounds.maxX-bounds.minX)/step),depth=Math.ceil((bounds.maxZ-bounds.minZ)/step);
 const count=width*depth,heights=new Float32Array(count).fill(-99),walk=new Uint8Array(count),connected=new Uint8Array(count);
 function heightAt(x,z){
  let best=-99;
  level.queryBlocks(x,z,x,z,ids);
  for(const id of ids){const b=level.blocks[id];if(!b.solid||b.roof||b.rail||b.perch||b.noNav||b.axes[1].y<.68)continue;
   const n=b.axes[1];top.copy(b.center).addScaledVector(n,b.half.y);
   const y=top.y-(n.x*(x-top.x)+n.z*(z-top.z))/n.y;
   if(y<-.3||y>4.05||y<=best)continue;
   probe.set(x,y-.01,z);if(level.pointInBlock(b,probe,.002))best=y;
  }
  return best;
 }
 function bodyBlocked(x,y,z,r=.4,h=1.25){
  level.queryBlocks(x-r,z-r,x+r,z+r,ids);
  for(const id of ids){const b=level.blocks[id];if(!b.solid||b.aabbMax.y<=y+.26||b.aabbMin.y>=y+h)continue;
   // Check a vertical cylinder against each oriented box. Floor slopes are
   // handled by the step-height check, so their buried sides do not block stairs.
   for(let sample=0;sample<3;sample++){const yy=sample===0?y+.3:sample===1?y+h*.6:y+h-.05;
    probe.set(x,yy,z).sub(b.center);
    const lx=probe.dot(b.axes[0]),ly=probe.dot(b.axes[1]),lz=probe.dot(b.axes[2]);
    if(Math.abs(ly)>=b.half.y+.025)continue;
    const dx=Math.max(0,Math.abs(lx)-b.half.x),dz=Math.max(0,Math.abs(lz)-b.half.z);
    if(dx*dx+dz*dz<r*r)return true;
   }
  }
  return false;
 }
 const clearanceDirections=Array.from({length:8},(_,k)=>({x:Math.cos(k*Math.PI/4),z:Math.sin(k*Math.PI/4)}));
 function rawFree(x,z,r=.4){
  if(x<bounds.minX+r||x>bounds.maxX-r||z<bounds.minZ+r||z>bounds.maxZ-r)return false;
  const y=heightAt(x,z);if(y<-.3||bodyBlocked(x,y,z,r))return false;
  for(const direction of clearanceDirections){const h=heightAt(x+direction.x*r,z+direction.z*r);if(h<-.3||Math.abs(h-y)>.55)return false;}
  return true;
 }
 const index=(x,z)=>{const ix=Math.floor((x-bounds.minX)/step),iz=Math.floor((z-bounds.minZ)/step);return ix<0||iz<0||ix>=width||iz>=depth?-1:iz*width+ix;};
 const nodeX=new Float32Array(count),nodeZ=new Float32Array(count);
 for(let i=0;i<count;i++){nodeX[i]=bounds.minX+(i%width+.5)*step;nodeZ[i]=bounds.minZ+(Math.floor(i/width)+.5)*step;}
 const point=i=>({x:nodeX[i],z:nodeZ[i]});
 for(let i=0;i<count;i++){const p=point(i);if(rawFree(p.x,p.z)){walk[i]=1;heights[i]=heightAt(p.x,p.z);}}
 const edges=Array.from({length:count},()=>[]);
 for(let i=0;i<count;i++)if(walk[i]){const p=point(i);for(const delta of [1,width]){const j=i+delta;if(j>=count||!walk[j]||(delta===1&&Math.floor(i/width)!==Math.floor(j/width))||Math.abs(heights[j]-heights[i])>.45)continue;const q=point(j);if(!rawFree((p.x+q.x)/2,(p.z+q.z)/2))continue;edges[i].push(j);edges[j].push(i);}}
 // Only the largest component is playable. This excludes offshore scenery and
 // small isolated roof/planter islands even when they have a horizontal surface.
 let largest=[];const seen=new Uint8Array(count),queue=new Int32Array(count);
 for(let i=0;i<count;i++)if(walk[i]&&!seen[i]){let head=0,tail=1;queue[0]=i;seen[i]=1;while(head<tail){const at=queue[head++];for(const n of edges[at])if(!seen[n]){seen[n]=1;queue[tail++]=n;}}if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));}
 for(const i of largest)connected[i]=1;
 function inComponent(x,z){const i=index(x,z);if(i>=0&&connected[i])return true;for(const [dx,dz]of[[step,0],[-step,0],[0,step],[0,-step]]){const j=index(x+dx,z+dz);if(j>=0&&connected[j])return true;}return false;}
 const free=(x,z,r=.45)=>inComponent(x,z)&&rawFree(x,z,r);
 function nearest(x,z,r=.7){if(free(x,z,r))return {x,z};let best=null,dist=Infinity;for(const i of largest){const p=point(i),d=(p.x-x)**2+(p.z-z)**2;if(d<dist&&rawFree(p.x,p.z,r)){best=p;dist=d;}}if(!best)throw Error('钟楼广场没有可用出生位置');return best;}
 function canMove(from,x,z,r=.4){return free(x,z,r)&&Math.abs(heightAt(x,z)-heightAt(from.x,from.z))<=.32;}
 function clear(a,b,r=.4){
  const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.25));let prev=a,p={x:0,z:0},spare={x:0,z:0};
  for(let i=1;i<=n;i++){p.x=a.x+(b.x-a.x)*i/n;p.z=a.z+(b.z-a.z)*i/n;if(!canMove(prev,p.x,p.z,r))return false;const prior=prev;prev=p;p=prior===a?spare:prior;}return true;
 }
 function closestNode(x,z){let best=-1,d=Infinity;const center=index(x,z);if(center>=0&&connected[center])return center;for(const i of largest){const v=(nodeX[i]-x)**2+(nodeZ[i]-z)**2;if(v<d){best=i;d=v;}}return best;}
 const fields=new Map(),routes=new WeakMap(),nextPool=[],queuePool=[];
 let fieldDeadline=Infinity,routeDeadline=Infinity,stepsLeft=4096,queriesLeft=32,stepsDone=0,queriesDone=0;
 function pumpFields(){
  for(const entry of fields.values()){
   if(entry.complete)continue;
   while(entry.head<entry.tail&&stepsLeft>0){
    if(stepsDone%64===0&&performance.now()>=fieldDeadline)return;
    const i=entry.queue[entry.head++];stepsLeft--;stepsDone++;
    for(const n of edges[i])if(connected[n]&&entry.next[n]<0){entry.next[n]=i;entry.queue[entry.tail++]=n;}
   }
   if(entry.head===entry.tail){entry.complete=true;queuePool.push(entry.queue);entry.queue=null;}
   if(!stepsLeft)return;
  }
 }
 function beginNavigationFrame(){const now=performance.now();fieldDeadline=now+1.2;routeDeadline=now+3.5;stepsLeft=4096;queriesLeft=32;stepsDone=queriesDone=0;pumpFields();}
 function navigationStats(){return {steps:stepsDone,queries:queriesDone,pending:[...fields.values()].filter(f=>!f.complete).length,cached:fields.size};}
 function field(goal){
  if(fields.has(goal)){const entry=fields.get(goal);fields.delete(goal);fields.set(goal,entry);return entry.next;}
  if([...fields.values()].filter(f=>!f.complete).length>=8)return null;
  if(fields.size>=32){const victim=[...fields.entries()].find(([,f])=>f.complete);if(!victim)return null;fields.delete(victim[0]);nextPool.push(victim[1].next);}
  const next=nextPool.pop()||new Int32Array(count),q=queuePool.pop()||new Int32Array(count);next.fill(-1);next[goal]=goal;q[0]=goal;
  fields.set(goal,{next,queue:q,head:0,tail:1,complete:false});pumpFields();return next;
 }
 function waypoint(u,x,z){
  const now=performance.now(),old=routes.get(u);
  const moved=old?Math.hypot(u.x-old.seen.x,u.z-old.seen.z):1;
  const sameGoal=old&&Math.hypot(old.goal.x-x,old.goal.z-z)<2;
  // 还在靠近就沿用。几乎没动时先留着，大约每 0.28 秒重算一次。
  // 挤在一起时每帧重算整张地图会卡顿，持盾冲锋的动作也就看不清。
  if(sameGoal&&moved>.15&&now<old.until&&Math.hypot(old.p.x-u.x,old.p.z-u.z)>.65)return old.p;
  if(sameGoal&&moved<.1&&now<(old.hold||0))return old.p;
  if(queriesLeft<=0||now>=routeDeadline)return old?.p||{x:u.x,z:u.z};
  queriesLeft--;queriesDone++;
  let p={x,z};
  if(!clear(u,p)){
   // Nearby destinations share a 2 m flow field; the final direct leg keeps the exact target.
   const goal=closestNode(Math.round(x/2)*2,Math.round(z/2)*2),start=closestNode(u.x,u.z),next=field(goal);
   if(!next||next[start]<0){p=old?.p||{x:u.x,z:u.z};}
   else{
    let at=start;const candidates=[];
    for(let k=0;k<16;k++){const n=next[at];if(n<0||n===at)break;at=n;if(k===0||k%4===3)candidates.push(point(n));}
    p=point(start);let found=false;
    for(let k=candidates.length-1;k>=0;k--)if(clear(u,candidates[k])){p=candidates[k];found=true;break;}
    if(!found&&candidates.length){const q=candidates[0],dx=q.x-u.x,dz=q.z-u.z,len=Math.hypot(dx,dz)||1,amount=Math.min(.4,len),sx=u.x+dx/len*amount,sz=u.z+dz/len*amount;if(canMove(u,sx,sz))p={x:sx,z:sz};}
   }
  }
  routes.set(u,{goal:{x,z},p,seen:{x:u.x,z:u.z},until:now+600,hold:now+280});
  return p;
 }
 return {bounds,step,width,depth,heights,connected,point,heightAt,bodyBlocked,free,nearest,canMove,clear,waypoint,beginNavigationFrame,navigationStats,nodeCount:largest.length};
}
