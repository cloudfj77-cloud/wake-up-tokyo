import type {Point} from './simulation.ts';
// Match the original game's view distances while keeping simulation independent of model admission.
export function visibleActors(units:any[],player:Point,view:{eye:number[];target:number[]},aspect:number,budget:number){
 const f=view.target.map((v,i)=>v-view.eye[i]),length=Math.hypot(...f);for(let i=0;i<3;i++)f[i]/=length;
 const r=[-f[2],0,f[0]],rl=Math.hypot(...r);for(let i=0;i<3;i++)r[i]/=rl;
 const up=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]],tan=Math.tan(55*Math.PI/360);
 return units.filter(u=>{if(u.dead)return false;const distance=Math.hypot(u.x-player.x,u.z-player.z),limit=u.kind==='corpse'?40:u.converted?22:46;if(distance>limit)return false;const d=[u.x-view.eye[0],(u.floorY??0)+.5-view.eye[1],u.z-view.eye[2]],dot=(a:number[])=>d.reduce((sum,v,i)=>sum+v*a[i],0),depth=dot(f);return depth>-.8&&Math.abs(dot(r))<Math.max(0,depth)*tan*aspect+.8&&Math.abs(dot(up))<Math.max(0,depth)*tan+.8;}).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z)).slice(0,budget);
}
