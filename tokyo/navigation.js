import * as T from 'three';
import {Capsule} from 'three/addons/math/Capsule.js';

export function createTokyoNavigation(data,collision){
 const {bounds,step,width,depth,nodes}=data,cells=new Map(),down=new T.Vector3(0,-1,0),routes=new WeakMap(),fields=new Map(),closedEdges=new Set(),closedNodes=new Set(),floorCache=new Map();let revision=0;
 const point=i=>({x:bounds.minX+(nodes[i][0]+.5)*step,z:bounds.minZ+(nodes[i][1]+.5)*step,floorY:nodes[i][2]});
 const key=(x,z)=>Math.floor((x-bounds.minX)/step)+','+Math.floor((z-bounds.minZ)/step);
 nodes.forEach((n,i)=>{const p=point(i),k=key(p.x,p.z);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(i);});
 function nodeAt(x,z,hint=0){let best=-1,d=Infinity;for(const i of cells.get(key(x,z))||[]){const v=Math.abs(nodes[i][2]-hint);if(v<d){best=i;d=v;}}return best;}
 // 有真实碰撞时由场景地面的尽头限制通行，旧网格矩形不能截断仍然延伸的道路。
 function inside(x,z,r=0){return !!collision||(x>=bounds.minX+r&&x<=bounds.maxX-r&&z>=bounds.minZ+r&&z<=bounds.maxZ-r);}
 function heightAt(x,z,hint=0){
  if(!inside(x,z))return -99;
  if(!collision){const i=nodeAt(x,z,hint);return i<0?-99:nodes[i][2];}
  // 导航网格缺格不能充当空气墙。实际能否落脚以脚下场景三角面为准。
  // 射线只在当前楼层附近取地面，不能吸到头顶街面或隔着楼板换层。
  const i=nodeAt(x,z,hint),base=i>=0&&Math.abs(nodes[i][2]-hint)<.38?nodes[i][2]:hint;
  // 静态场景中相同坐标与射线高度的结果不变；精确缓存重复查询，不取整，避免重新引入空气墙。
  const cacheKey=x+','+z+','+base;if(floorCache.has(cacheKey))return floorCache.get(cacheKey);
  if(floorCache.size>=16384)floorCache.clear();
  for(const [dx,dz]of [[0,0],[.025,0],[-.025,0],[0,.025],[0,-.025]]){
   const hit=collision.raycast(new T.Vector3(x+dx,base+.24,z+dz),down,.6,true);
   if(hit){floorCache.set(cacheKey,hit.point.y);return hit.point.y;}
  }
  floorCache.set(cacheKey,-99);
  return -99;
 }
 function bodyBlocked(x,y,z,r=.16,h=1.0){
  if(!collision)return false;
  // A small capsule checks walls above the tread clearance without snapping onto furniture.
  const radius=Math.min(r,h*.3),start=new T.Vector3(x,y+.18+radius,z),cap=new Capsule(start.clone(),new T.Vector3(x,y+h-radius,z),radius);
  collision.resolve(cap);return cap.start.distanceTo(start)>.025;
 }
 function free(x,z,r=.45,hint=0){
  if(!inside(x,z,r))return false;
  const y=heightAt(x,z,hint);if(y<-90)return false;
  for(let k=0;k<8;k++){const a=k*Math.PI/4,h=heightAt(x+Math.cos(a)*r,z+Math.sin(a)*r,y);if(h<-90||Math.abs(h-y)>.35)return false;}
  return !bodyBlocked(x,y,z,Math.min(r,.22));
 }
 function nearest(x,z,r=.7,hint=0){
  if(free(x,z,r,hint))return {x,z,floorY:heightAt(x,z,hint)};
  let best=null,score=Infinity;for(let i=0;i<nodes.length;i++){
   const p=point(i),d=(p.x-x)**2+(p.z-z)**2+(p.floorY-hint)**2;
   if(d<score&&free(p.x,p.z,r,p.floorY)){score=d;best=p;}
  }if(!best)throw Error('东京街区没有可用出生位置');return best;
 }
 function canMove(from,x,z,r=.16){
  if(!inside(x,z,r))return false;
  let y=heightAt(from.x,from.z,from.floorY);
  if(y<-90)return false;
  const n=Math.max(1,Math.ceil(Math.hypot(x-from.x,z-from.z)/.12));
  for(let i=1;i<=n;i++){
   const xx=from.x+(x-from.x)*i/n,zz=from.z+(z-from.z)*i/n,h=heightAt(xx,zz,y);
   if(h<-90||Math.abs(h-y)>.36)return false;
   y=h;if(bodyBlocked(xx,y,zz,r))return false;
  }return true;
 }
 function clear(a,b,r=.16){
  const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.15));let p={...a,floorY:heightAt(a.x,a.z,a.floorY)};
  for(let i=1;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n;if(!canMove(p,x,z,r))return false;p={x,z,floorY:heightAt(x,z,p.floorY)};}
  return b.floorY===undefined||Math.abs(p.floorY-b.floorY)<.4;
 }
 const edgeKey=(a,b)=>Math.min(a,b)*nodes.length+Math.max(a,b);
 function closeEdge(a,b){
  const key=edgeKey(a,b);if(closedEdges.has(key))return;
  // 原导航文件漏掉的栏杆、家具等，按实际碰撞关闭该边并重算路线，不能一直顶着它走。
  closedEdges.add(key);
  for(const i of [a,b]){const p=point(i);if(bodyBlocked(p.x,heightAt(p.x,p.z,p.floorY),p.z))closedNodes.add(i);}
  fields.clear();revision++;
 }
 function anchor(p){
  const first=nodeAt(p.x,p.z,p.floorY);
  if(first>=0&&!closedNodes.has(first)&&clear(p,point(first)))return first;
  // 人物可以走进旧网格缺格的地面，返程时连接到身边真实可达的节点。
  const near=[];
  for(let dz=-4;dz<=4;dz++)for(let dx=-4;dx<=4;dx++)for(const i of cells.get(key(p.x+dx*step,p.z+dz*step))||[]){
   const q=point(i),d=Math.hypot(q.x-p.x,q.z-p.z);if(!closedNodes.has(i)&&Math.abs(q.floorY-p.floorY)<.4&&d<1.3)near.push({i,d});
  }
  near.sort((a,b)=>a.d-b.d);for(const q of near)if(clear(p,point(q.i)))return q.i;return -1;
 }
 let stepsLeft=4096,queriesLeft=24,workMs=0,pumpCursor=0;
 function pumpFields(maxMs=2-workMs,preferred=null){
  if(maxMs<=0||stepsLeft<=0)return;
  const start=performance.now(),stop=start+maxMs,all=[...fields.values()];
  if(preferred){const at=all.indexOf(preferred);if(at>=0)all.splice(at,1);all.unshift(preferred);}
  else if(all.length)all.push(...all.splice(0,pumpCursor++%all.length));
  outer:for(const f of all)while(f.head<f.queue.length&&stepsLeft>0){
   if((stepsLeft&31)===0&&performance.now()>stop)break outer;
   const i=f.queue[f.head++];stepsLeft--;
   for(const n of nodes[i][3])if(f.next[n]<0&&!closedNodes.has(n)&&!closedEdges.has(edgeKey(i,n))){f.next[n]=i;f.queue.push(n);}
  }
  workMs+=performance.now()-start;
 }
 // 只计算寻路自身的耗时；人物碰撞、动画等工作不能提前耗尽寻路预算。
 function beginNavigationFrame(){stepsLeft=4096;queriesLeft=24;workMs=0;pumpFields(.75);}
 function field(goal,stop){
  // 玩家小幅移动时复用附近且能直达的目标场，避免每跨一个 0.3 米网格就重建整张地图。
  if(!fields.has(goal)){
   const target=point(goal);
   for(const [id,f]of fields){const p=point(id);if(Math.abs(p.floorY-target.floorY)<.35&&Math.hypot(p.x-target.x,p.z-target.z)<2.4&&clear(p,target)){pumpFields(Math.max(0,stop-performance.now()),f);return f.next;}}
  }
  if(!fields.has(goal)){
   if(fields.size>=12){const done=[...fields].find(([,f])=>f.head===f.queue.length);if(!done)return null;fields.delete(done[0]);}
   const next=new Int32Array(nodes.length).fill(-1);next[goal]=goal;fields.set(goal,{next,queue:[goal],head:0});
  }
  const result=fields.get(goal);pumpFields(Math.max(0,stop-performance.now()),result);return result.next;
 }
 function waypoint(u,x,z,hint=0){
  const now=performance.now(),old=routes.get(u),sameDeck=old&&old.revision===revision&&Math.abs(old.hint-hint)<.4;
  if(sameDeck&&now<old.until&&Math.hypot(old.x-x,old.z-z)<1&&Math.hypot(old.p.x-u.x,old.p.z-u.z)>.15)return old.p;
  if(queriesLeft--<=0||workMs>=2)return sameDeck?old.p:{x:u.x,z:u.z,floorY:u.floorY};
  const before=workMs,stop=now+Math.max(0,2-workMs);
  try{
   let p={x,z,floorY:heightAt(x,z,hint)};
   const direct=Math.hypot(x-u.x,z-u.z)<=10&&Math.abs((u.floorY??0)-p.floorY)<.4&&clear(u,p);
   if(!direct){
    // 使用目标所在的实际网格与楼层，不能先取整到隔壁墙体或另一层道路。
    const start=anchor(u),goal=anchor(p);if(start<0||goal<0)return {x:u.x,z:u.z,floorY:u.floorY};
    const next=field(goal,stop);if(!next||next[start]<0)return sameDeck?old.p:{x:u.x,z:u.z,floorY:u.floorY};let at=start;p=point(start);
    for(let k=0;k<10;k++){if(k>0&&performance.now()>stop)break;const n=next[at];if(n<0||n===at)break;const q=point(n);if(!clear(u,q)){if(k===0&&!clear(point(at),q))closeEdge(at,n);break;}at=n;p=q;}
   }
   routes.set(u,{x,z,hint,p,revision,until:now+280});return p;
  }finally{workMs=before+performance.now()-now;}
 }
 return {bounds,nodes,point,beginNavigationFrame,heightAt,bodyBlocked,free,nearest,canMove,clear,waypoint,navigationStats:()=>({fields:fields.size,workMs,stepsLeft,closedEdges:closedEdges.size})};
}
