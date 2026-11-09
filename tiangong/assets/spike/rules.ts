import { floors } from './floor.ts';
export const SPEC = { base: 'v0.3.76', version: '0.1.0', npcs: 12, speed: 2.3, fov: 55, width: 1280, height: 720 };
export type Input = { x: number; z: number; lookX: number; lookY: number; jump: boolean; roll: boolean; sprint: boolean; fire: boolean };
export const neutral = (): Input => ({ x:0,z:0,lookX:0,lookY:0,jump:false,roll:false,sprint:false,fire:false });
export type Actor = { x:number;y:number;z:number;ally:boolean;hits:number;seed:number };
export type Run = { x:number;y:number;z:number;vy:number;ground:number;yaw:number;pitch:number;roll:number;rollX:number;rollZ:number; shots:number;hits:number;charge:number;empowered:number;converted:number;flash:number;cooldown:number;time:number;equipped:boolean;actors:Actor[];puddles:number[][];bolts:number[][];rolls:number;jumps:number };
const cells = new Map(floors.map(f=>[`${Math.round(f[0]/.3)},${Math.round(f[2]/.3)}`,f[1]]));
export function floor(x:number,z:number,previous=0) { let best: number|undefined; for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) { const h=cells.get(`${Math.round(x/.3)+dx},${Math.round(z/.3)+dz}`); if(h!==undefined && Math.abs(h-previous)<.55 && (best===undefined||Math.abs(h-previous)<Math.abs(best-previous))) best=h; } return best; }
export function createRun(count=SPEC.npcs):Run { return { x:-3,y:.05,z:4.5,vy:0,ground:.05,yaw:0,pitch:.13,roll:0,rollX:0,rollZ:-1,shots:0,hits:0,charge:0,empowered:0,converted:0,flash:0,cooldown:0,time:0,equipped:false,actors:Array.from({length:count},(_,i)=>({x:i===0?-3:-7+(i%6)*1.65,y:.05,z:i===0?1.2:-.6-Math.floor(i/6)*1.4,ally:false,hits:0,seed:i})),puddles:[],bolts:[],rolls:0,jumps:0 }; }
export function aim(s:Run) { const cp=Math.cos(s.pitch); return [-Math.sin(s.yaw)*cp,-Math.sin(s.pitch),-Math.cos(s.yaw)*cp]; }
export function view(s:Run) { const d=aim(s); const target=[s.x,s.y+1.2,s.z]; return {target,eye:[target[0]-d[0]*4.8,target[1]-d[1]*4.8,target[2]-d[2]*4.8]}; }
export function tick(s:Run,i:Input,dt:number) { dt=Math.min(.05,Math.max(0,dt)); s.time+=dt;s.flash=Math.max(0,s.flash-dt);s.cooldown=Math.max(0,s.cooldown-dt);s.roll=Math.max(0,s.roll-dt);
 s.yaw-=i.lookX*.002;s.pitch=Math.max(-.35,Math.min(.65,s.pitch+i.lookY*.002));
 const n=Math.max(1,Math.hypot(i.x,i.z)),fx=-Math.sin(s.yaw),fz=-Math.cos(s.yaw);const mx=(Math.cos(s.yaw)*i.x+fx*i.z)/n,mz=(-Math.sin(s.yaw)*i.x+fz*i.z)/n;
 // Fresh presses interrupt the current action. No recovery/cooldown between rolls.
 if(i.jump){s.roll=0;s.vy=7;s.jumps++;} if(i.roll){s.roll=.32;s.vy=0;s.rollX=Math.hypot(mx,mz)>.1?mx:fx;s.rollZ=Math.hypot(mx,mz)>.1?mz:fz;s.rolls++;}
 const speed=s.roll>0?8:SPEC.speed*(i.sprint?1.75:1);const nx=s.x+(s.roll>0?s.rollX:mx)*speed*dt,nz=s.z+(s.roll>0?s.rollZ:mz)*speed*dt;
 const h=floor(nx,nz,s.ground);if(h!==undefined){s.x=nx;s.z=nz;s.ground=h;}const base=s.ground;s.vy-=18*dt;s.y=Math.max(base,s.y+s.vy*dt);if(s.y<=base+.001)s.vy=0;
 if(!s.equipped&&Math.hypot(s.x+3,s.z-3.5)<1)s.equipped=true;
 for(const a of s.actors){if(a.seed!==0)a.x+=Math.sin(s.time*.8+a.seed)*dt*.12;}
 if(i.fire&&s.equipped&&s.cooldown===0){s.cooldown=.2;s.shots++;const empowered=s.charge===3;if(empowered){s.charge=0;s.empowered++;}const d=aim(s);let hit:Actor|undefined,dist=18;for(const a of s.actors){if(a.ally)continue;const rx=a.x-s.x,rz=a.z-s.z,t=rx*d[0]+rz*d[2];const miss=Math.hypot(rx-d[0]*t,rz-d[2]*t);if(t>.1&&t<dist&&miss<.65){hit=a;dist=t;}}
 s.bolts.push([s.x,s.y+1,s.z,d[0],d[1],d[2],.24]);if(hit){s.hits++;if(!empowered)s.charge=Math.min(3,s.charge+1);hit.hits+=empowered?3:1;if(hit.hits>=3){hit.ally=true;s.converted++;s.flash=.45;}}
 const px=s.x+d[0]*dist,pz=s.z+d[2]*dist;s.puddles.push([px,floor(px,pz)??.02,pz]);if(s.puddles.length>64)s.puddles.shift();}
 s.bolts=s.bolts.filter(b=>{b[6]-=dt;b[0]+=b[3]*24*dt;b[1]+=b[4]*24*dt;b[2]+=b[5]*24*dt;return b[6]>0;}); }
export function snapshot(s:Run){return {version:SPEC.version,base:SPEC.base,position:[s.x,s.y,s.z],action:s.roll>0?'roll':s.vy!==0?'jump':'walk',grounded:s.vy===0,shots:s.shots,hits:s.hits,charge:s.charge,empowered:s.empowered,converted:s.converted,flash:s.flash,equipped:s.equipped,rolls:s.rolls,jumps:s.jumps,actors:s.actors.map(a=>({position:[a.x,a.y,a.z],ally:a.ally,hits:a.hits})),puddles:s.puddles.length,time:s.time};}
