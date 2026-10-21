import * as T from 'three';
import {Capsule} from 'three/addons/math/Capsule.js';

export function createTokyoNavigation(data,collision){
 const {bounds,step,width,depth,nodes}=data,cells=new Map(),down=new T.Vector3(0,-1,0),routes=new WeakMap(),fields=new Map(),heightCache=new Map(),edgeCache=new Map(),goalCache=new Map();
 const point=i=>({x:bounds.minX+(nodes[i][0]+.5)*step,z:bounds.minZ+(nodes[i][1]+.5)*step,floorY:nodes[i][2]});
 const key=(x,z)=>Math.floor((x-bounds.minX)/step)+','+Math.floor((z-bounds.minZ)/step);
 nodes.forEach((n,i)=>{const p=point(i),k=key(p.x,p.z);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(i);});
 function nodeAt(x,z,hint=0){let best=-1,d=Infinity;for(const i of cells.get(key(x,z))||[]){const v=Math.abs(nodes[i][2]-hint);if(v<d){best=i;d=v;}}return best;}
 function heightAt(x,z,hint=0){
  if(!collision){const i=nodeAt(x,z,hint);return i<0?-99:nodes[i][2];}
  // The grid guides routes, but the actual treads support feet. A cell beside a
  // stair can contain only its upper landing even though the platform continues
  // underneath it. Never snap a walker to that unrelated deck.
  const cacheKey=x+','+z+','+hint;if(heightCache.has(cacheKey))return heightCache.get(cacheKey);
  const i=nodeAt(x,z,hint),anchor=i>=0&&Math.abs(nodes[i][2]-hint)<.36?nodes[i][2]:hint;
  let value=-99;
  for(const [dx,dz]of [[0,0],[.03,0],[-.03,0],[0,.03],[0,-.03]]){
   const hit=collision.raycast(new T.Vector3(x+dx,anchor+.24,z+dz),down,.6,true);
   if(hit){value=hit.point.y;break;}
  }
  if(heightCache.size>8192)heightCache.clear();heightCache.set(cacheKey,value);return value;
 }
 function bodyBlocked(x,y,z,r=.16,h=1.0){
  if(!collision)return false;
  // A small capsule checks walls above the tread clearance without snapping onto furniture.
  const radius=Math.min(r,h*.3),start=new T.Vector3(x,y+.18+radius,z),cap=new Capsule(start.clone(),new T.Vector3(x,y+h-radius,z),radius);
  collision.resolve(cap);return cap.start.distanceTo(start)>.025;
 }
 function free(x,z,r=.45,hint=0){
  if(x<bounds.minX+r||x>bounds.maxX-r||z<bounds.minZ+r||z>bounds.maxZ-r)return false;
  const i=nodeAt(x,z,hint);if(i<0)return false;const y=nodes[i][2];
  for(let k=0;k<8;k++){const a=k*Math.PI/4,j=nodeAt(x+Math.cos(a)*r,z+Math.sin(a)*r,y);if(j<0||Math.abs(nodes[j][2]-y)>.35)return false;}
  return !bodyBlocked(x,y,z,Math.min(r,.22));
 }
 function nearest(x,z,r=.7,hint=0){
  if(free(x,z,r,hint))return {x,z,floorY:heightAt(x,z,nodes[nodeAt(x,z,hint)][2])};
  let best=null,score=Infinity;for(let i=0;i<nodes.length;i++){
   const p=point(i),d=(p.x-x)**2+(p.z-z)**2+(p.floorY-hint)**2;
   if(d<score&&free(p.x,p.z,r,p.floorY)){score=d;best=p;}
  }if(!best)throw Error('东京街区没有可用出生位置');return best;
 }
 function walk(from,x,z,r=.16){
  if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return null;
  let y=heightAt(from.x,from.z,from.floorY);
  if(y===-99||Math.abs(y-(from.floorY??y))>.36)return null;
  const n=Math.max(1,Math.ceil(Math.hypot(x-from.x,z-from.z)/.12));
  for(let i=1;i<=n;i++){
   const xx=from.x+(x-from.x)*i/n,zz=from.z+(z-from.z)*i/n,nextY=heightAt(xx,zz,y);
   if(nextY===-99||Math.abs(nextY-y)>.36||bodyBlocked(xx,nextY,zz,r))return null;
   y=nextY;
  }return y;
 }
 function canMove(from,x,z,r=.16){return walk(from,x,z,r)!==null;}
 function movePoint(from,x,z,r=.16){const floorY=walk(from,x,z,r);return floorY===null?null:{x,z,floorY};}
 function clear(a,b,r=.16){
  const y=walk(a,b.x,b.z,r);return y!==null&&(b.floorY===undefined||Math.abs(y-b.floorY)<.4);
 }
 function edgeOpen(i,j){
  if(!collision)return true;
  const key=i<j?i+','+j:j+','+i;
  if(!edgeCache.has(key)){
   const open=clear(point(i),point(j));edgeCache.set(key,open);
   if(!open)fields.clear();
  }
  return edgeCache.get(key);
 }
 function routeStart(u){
  const direct=nodeAt(u.x,u.z,u.floorY);
  if(direct>=0&&clear(u,point(direct)))return direct;
  let best=-1,distance=Infinity;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++)for(const i of cells.get(key(u.x+dx*step,u.z+dz*step))||[]){
   const p=point(i),d=Math.hypot(p.x-u.x,p.z-u.z);
   if(d<distance&&Math.abs(p.floorY-u.floorY)<.4&&clear(u,p)){best=i;distance=d;}
  }
  return best;
 }
 function routeGoal(x,z,hint){
  const cacheKey=x+','+z+','+hint;
  if(goalCache.has(cacheKey))return goalCache.get(cacheKey);
  const direct=nodeAt(x,z,hint);
  if(direct>=0&&Math.abs(nodes[direct][2]-hint)<.4&&!bodyBlocked(x,heightAt(x,z,hint),z))return direct;
  let best=-1,distance=Infinity;
  for(let dz=-6;dz<=6;dz++)for(let dx=-6;dx<=6;dx++)for(const i of cells.get(key(x+dx*step,z+dz*step))||[]){
   const p=point(i),d=Math.hypot(p.x-x,p.z-z);
   if(d<distance&&Math.abs(p.floorY-hint)<.4&&!bodyBlocked(p.x,p.floorY,p.z)){best=i;distance=d;}
  }
  if(goalCache.size>=512)goalCache.delete(goalCache.keys().next().value);
  goalCache.set(cacheKey,best);return best;
 }
 let stepsLeft=4096,queriesLeft=24,timeLeft=2,deadline=Infinity;
 function pumpFields(){
  for(const f of fields.values())while(f.head<f.queue.length&&stepsLeft>0){
   if(performance.now()>deadline)return;
   const i=f.queue[f.head++];stepsLeft--;
   for(const n of nodes[i][3])if(f.next[n]<0&&edgeCache.get(i<n?i+','+n:n+','+i)!==false){f.next[n]=i;f.queue.push(n);}
  }
 }
 function beginNavigationFrame(){heightCache.clear();stepsLeft=4096;queriesLeft=24;timeLeft=2;deadline=performance.now()+.5;pumpFields();deadline=Infinity;}
 function field(goal){
  if(!fields.has(goal)){
   if(fields.size>=12){const done=[...fields].find(([,f])=>f.head===f.queue.length);if(!done)return null;fields.delete(done[0]);}
   const next=new Int32Array(nodes.length).fill(-1);next[goal]=goal;fields.set(goal,{next,queue:[goal],head:0});
  }pumpFields();return fields.get(goal).next;
 }
 // Short civilian walks should not build a flood field over all 169k floor nodes.
 // Keep the finished path so actors continue walking while other queries use the budget.
 function localPath(start,goal){
  const cost=new Map([[start,0]]),parent=new Map(),open=[[start,0]],closed=new Set(),target=point(goal);
  const heuristic=i=>{const p=point(i);return Math.hypot(p.x-target.x,p.z-target.z,p.floorY-target.floorY);};
  let visited=0;
  while(open.length&&visited++<2048){
   if(visited%16===0&&performance.now()>deadline)return null;
   let best=0;for(let k=1;k<open.length;k++)if(open[k][1]<open[best][1])best=k;
   const [i]=open.splice(best,1)[0];if(closed.has(i))continue;
   if(i===goal){const path=[];for(let n=goal;n!==start;n=parent.get(n))path.push(point(n));return path.reverse();}
   closed.add(i);const p=point(i);
   for(const n of nodes[i][3]){if(closed.has(n)||!edgeOpen(i,n))continue;const q=point(n),next=cost.get(i)+Math.hypot(p.x-q.x,p.z-q.z,p.floorY-q.floorY);if(next>=(cost.get(n)??Infinity))continue;cost.set(n,next);parent.set(n,i);open.push([n,next+heuristic(n)]);}
  }
  return null;
 }
 function waypoint(u,x,z,hint=0){
  const now=performance.now(),old=routes.get(u);
  const sameGoal=old&&Math.abs((old.hint??0)-hint)<.4;
  if(sameGoal&&old.path&&Math.hypot(old.x-x,old.z-z)<.6){
   while(old.at<old.path.length-1&&Math.hypot(old.p.x-u.x,old.p.z-u.z)<.23&&Math.abs((u.floorY??old.p.floorY)-old.p.floorY)<.4){old.p=old.path[++old.at];old.until=0;}
   const remaining=Math.hypot(old.p.x-u.x,old.p.z-u.z);
   if(remaining>.15&&remaining<4&&(now<old.until||clear(u,old.p))){if(now>=old.until)old.until=now+280;return old.p;}
  }
  const reusable=sameGoal&&now<old.until&&Math.hypot(old.p.x-u.x,old.p.z-u.z)>.15;
  if(reusable&&Math.hypot(old.x-x,old.z-z)<1)return old.p;
  if(queriesLeft--<=0||timeLeft<=0)return reusable?old.p:{x:u.x,z:u.z};
  // Charge only navigation work. Crowd separation, animation and combat between
  // calls must not consume the budget before an actor gets its first route.
  const started=performance.now();deadline=started+timeLeft;
  try{
  let p={x,z,floorY:heightAt(x,z,hint)};
  const goal=routeGoal(x,z,hint);
  if(goal<0)return {x:u.x,z:u.z};
  if(Math.abs(p.floorY-hint)>.4||bodyBlocked(x,p.floorY,z))p=point(goal);
  if(!clear(u,p)){
   const start=routeStart(u);if(start<0)return {x:u.x,z:u.z};
   if(Math.hypot(x-u.x,z-u.z)<12){
    const path=localPath(start,goal);
    if(path?.length){const route={x,z,hint,path,at:0,p:path[0],until:now+280};routes.set(u,route);return route.p;}
   }
   const next=field(goal);if(!next||next[start]<0)return reusable?old.p:{x:u.x,z:u.z};let at=start;p=point(start);
   for(let k=0;k<10;k++){
    const n=next[at];if(n<0||n===at)break;const q=point(n);
    if(!clear(u,q)){
     // Repair a stale baked edge around the real obstacle. Keeping the current
     // node as a waypoint used to leave an entire following squad waiting forever.
     if(at===start){
      let ahead=n;for(let j=0;j<8&&next[ahead]>=0&&next[ahead]!==ahead;j++)ahead=next[ahead];
      const path=localPath(start,ahead);
      if(path?.length){const route={x,z,hint,path,at:0,p:path[0],until:now+280};routes.set(u,route);return route.p;}
     }
     break;
    }
    at=n;p=q;
   }
  }
  routes.set(u,{x,z,hint,p,until:now+280});return p;
  }finally{timeLeft-=performance.now()-started;deadline=Infinity;}
 }
 return {bounds,nodes,point,beginNavigationFrame,heightAt,bodyBlocked,free,nearest,canMove,movePoint,clear,waypoint};
}
