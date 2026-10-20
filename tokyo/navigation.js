import * as T from 'three';
import {Capsule} from 'three/addons/math/Capsule.js';

export function createTokyoNavigation(data,collision){
 const {bounds,step,width,depth,nodes}=data,cells=new Map(),down=new T.Vector3(0,-1,0),routes=new WeakMap(),fields=new Map();
 const point=i=>({x:bounds.minX+(nodes[i][0]+.5)*step,z:bounds.minZ+(nodes[i][1]+.5)*step,floorY:nodes[i][2]});
 const key=(x,z)=>Math.floor((x-bounds.minX)/step)+','+Math.floor((z-bounds.minZ)/step);
 nodes.forEach((n,i)=>{const p=point(i),k=key(p.x,p.z);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(i);});
 function nodeAt(x,z,hint=0){let best=-1,d=Infinity;for(const i of cells.get(key(x,z))||[]){const v=Math.abs(nodes[i][2]-hint);if(v<d){best=i;d=v;}}return best;}
 function heightAt(x,z,hint=0){const i=nodeAt(x,z,hint);if(i<0)return -99;const y=nodes[i][2];if(!collision)return y;return collision.raycast(new T.Vector3(x,y+.24,z),down,.5,true)?.point.y??y;}
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
  if(free(x,z,r,hint))return {x,z,floorY:heightAt(x,z,hint)};
  let best=null,score=Infinity;for(let i=0;i<nodes.length;i++){
   const p=point(i),d=(p.x-x)**2+(p.z-z)**2+(p.floorY-hint)**2;
   if(d<score&&free(p.x,p.z,r,p.floorY)){score=d;best=p;}
  }if(!best)throw Error('东京街区没有可用出生位置');return best;
 }
 function canMove(from,x,z,r=.16){
  let y=heightAt(from.x,from.z,from.floorY);
  const n=Math.max(1,Math.ceil(Math.hypot(x-from.x,z-from.z)/.12));
  for(let i=1;i<=n;i++){
   const xx=from.x+(x-from.x)*i/n,zz=from.z+(z-from.z)*i/n,to=nodeAt(xx,zz,y);
   if(to<0||Math.abs(nodes[to][2]-y)>.36)return false;
   y=heightAt(xx,zz,y);if(bodyBlocked(xx,y,zz,r))return false;
  }return true;
 }
 function clear(a,b,r=.16){
  const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.15));let p={...a,floorY:heightAt(a.x,a.z,a.floorY)};
  for(let i=1;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n;if(!canMove(p,x,z,r))return false;p={x,z,floorY:heightAt(x,z,p.floorY)};}
  return b.floorY===undefined||Math.abs(p.floorY-b.floorY)<.4;
 }
 let stepsLeft=4096,queriesLeft=24,deadline=Infinity;
 function pumpFields(){
  for(const f of fields.values())while(f.head<f.queue.length&&stepsLeft>0){
   if(performance.now()>deadline)return;
   const i=f.queue[f.head++];stepsLeft--;
   for(const n of nodes[i][3])if(f.next[n]<0){f.next[n]=i;f.queue.push(n);}
  }
 }
 function beginNavigationFrame(){stepsLeft=4096;queriesLeft=24;deadline=performance.now()+2;pumpFields();}
 function field(goal){
  if(!fields.has(goal)){
   if(fields.size>=12){const done=[...fields].find(([,f])=>f.head===f.queue.length);if(!done)return null;fields.delete(done[0]);}
   const next=new Int32Array(nodes.length).fill(-1);next[goal]=goal;fields.set(goal,{next,queue:[goal],head:0});
  }pumpFields();return fields.get(goal).next;
 }
 function waypoint(u,x,z,hint=0){
  const now=performance.now(),old=routes.get(u);if(old&&now<old.until&&Math.hypot(old.x-x,old.z-z)<1&&Math.hypot(old.p.x-u.x,old.p.z-u.z)>.15)return old.p;
  if(queriesLeft--<=0||performance.now()>deadline)return old?.p||{x:u.x,z:u.z};
  let p={x,z,floorY:heightAt(x,z,hint)};
  if(!clear(u,p)){
   const start=nodeAt(u.x,u.z,u.floorY),goal=nodeAt(Math.round(x),Math.round(z),hint)>=0?nodeAt(Math.round(x),Math.round(z),hint):nodeAt(x,z,hint);if(start<0||goal<0)return {x:u.x,z:u.z};
   const next=field(goal);if(!next||next[start]<0)return old?.p||{x:u.x,z:u.z};let at=start;p=point(start);
   for(let k=0;k<10;k++){const n=next[at];if(n<0||n===at)break;const q=point(n);if(!clear(u,q))break;at=n;p=q;}
  }
  routes.set(u,{x,z,p,until:now+280});return p;
 }
 return {bounds,nodes,point,beginNavigationFrame,heightAt,bodyBlocked,free,nearest,canMove,clear,waypoint};
}
