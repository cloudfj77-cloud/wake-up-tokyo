import * as RuleSet from './rules.js';
const R:any=RuleSet;
import type {NativeGame} from './simulation.ts';
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export function updateAircraft(game:NativeGame,dt:number){
 const spec=R.AIRSTRIKE,s=game.state,p=game.player,phase=R.planePhase(s.alert,game.boss.active&&!game.boss.dead) as 'stage4'|'boss'|'';
 let a=game.aircraft;
 if(a?.mode==='crash'){
  a.crash-=dt;a.x+=a.vx*dt;a.z+=a.vz*dt;const floor=game.ground.floor(a.x,a.z,p.floorY)+.4;a.y=Math.max(floor,a.y-dt*(6+(1.35-Math.max(0,a.crash))*10));a.pitch=Math.min(1.2,(a.pitch??0)+dt*1.15);a.bank+=dt*2.6;
  if(a.y<=floor+.05||a.crash<=0){game.splashes.push({id:++game.id,x:a.x,y:floor,z:a.z,time:.6,radius:4.4,enemy:true});game.emit('planeCrash');game.aircraft=null;}return;
 }
 if(s.aftermath||!phase){game.aircraft=null;return;}
 if(!a&&!game.planeSpent[phase]){game.planeSpent[phase]=true;game.aircraft=a={id:-2,aircraftBody:true,mode:'orbit',x:p.x+spec.orbit,z:p.z,y:p.floorY+spec.height,yaw:0,pitch:0,bank:.38,angle:0,cx:p.x,cz:p.z,hp:spec.hp,drop:.9,strafe:3.6,shots:0};game.emit('planeArrival');}
 if(!a)return;
 if(a.mode==='dive'){
  a.dive-=dt;const progress=Math.min(1,1-a.dive/spec.strafeTime),approach=Math.min(1,progress/.28),along=Math.max(0,(progress-.28)/.72),lane=a.lane;
  if(progress<.28){a.x=mix(a.from.x,lane.x,approach);a.z=mix(a.from.z,lane.z,approach);a.y=mix(a.from.y,game.ground.floor(lane.x,lane.z,p.floorY)+5.5,approach);a.yaw=Math.atan2(lane.x-a.from.x,lane.z-a.from.z);a.pitch=.2;}
  else{a.x=lane.x+lane.dx*lane.len*along;a.z=lane.z+lane.dz*lane.len*along;a.y=game.ground.floor(a.x,a.z,p.floorY)+mix(5.5,3.4,Math.sin(Math.min(1,along)*Math.PI));a.yaw=Math.atan2(lane.dx,lane.dz);a.pitch=.62;}a.bank=.18;
  while(a.shots<spec.strafeShots&&along>=(a.shots+.5)/spec.strafeShots){const q=(a.shots+.5)/spec.strafeShots,x=lane.x+lane.dx*lane.len*q,z=lane.z+lane.dz*lane.len*q,ty=game.ground.floor(x,z,p.floorY);game.projectiles.push({id:++game.id,x:a.x,y:a.y,z:a.z,sx:a.x,sy:a.y,sz:a.z,tx:x,ty,tz:z,total:.22,life:.22,lob:true,arc:0,splash:spec.strafeWidth,damage:spec.strafeDamage,infection:0,ally:false,lane});a.shots++;game.emit('enemyFire');}
  if(a.dive<=0){a.mode='orbit';a.strafe=spec.strafeGap;a.cx=p.x;a.cz=p.z;a.angle=Math.atan2(a.z-p.z,a.x-p.x);a.pitch=0;}return;
 }
 a.cx+=(p.x-a.cx)*Math.min(1,dt*.4);a.cz+=(p.z-a.cz)*Math.min(1,dt*.4);a.angle+=dt*spec.spin;a.x=a.cx+Math.cos(a.angle)*spec.orbit;a.z=a.cz+Math.sin(a.angle)*spec.orbit;a.y=game.ground.floor(a.x,a.z,p.floorY)+spec.height;a.yaw=-a.angle;a.bank=.38;
 if(a.mode==='warn'){a.warn-=dt;if(a.warn<=0){a.mode='dive';a.dive=spec.strafeTime;a.from={x:a.x,y:a.y,z:a.z};game.emit('planeDive');}return;}
 a.drop-=dt;a.strafe-=dt;
 if(a.drop<=0){a.drop=spec.interval;const q=game.ground.nearest(p.x+(Math.random()-.5)*8,p.z+(Math.random()-.5)*8,p.floorY,10);game.projectiles.push({id:++game.id,x:a.x,y:a.y,z:a.z,sx:a.x,sy:a.y,sz:a.z,tx:q.x,ty:q.floorY??p.floorY,tz:q.z,total:spec.fall,life:spec.fall,lob:true,arc:1.5,splash:spec.radius,damage:spec.damage,infection:0,ally:false});game.emit('planeBomb');}
 if(a.strafe<=0){const yaw=Math.random()*Math.PI*2,side=(Math.random()-.5)*2.4,dx=Math.sin(yaw),dz=Math.cos(yaw),mx=p.x-dz*side,mz=p.z+dx*side;a.lane={x:mx-dx*spec.strafeLength/2,z:mz-dz*spec.strafeLength/2,dx,dz,len:spec.strafeLength};a.mode='warn';a.warn=spec.strafeWarn;a.shots=0;game.emit('planeWarning');}
}
