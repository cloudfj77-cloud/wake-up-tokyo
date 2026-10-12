import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import * as rules from './rules.js';
import {resolveComicAim,stepComicNeedle,stepComicBallistic} from './comic-fx.js';
const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
const river=readFileSync(new URL('./riverside-world.js',import.meta.url),'utf8');
const section=(s,start,end)=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)));
function riverAI(start,goal,obstacles){
 let now=0;
 const free=(x,z,r=.45)=>!obstacles.some(o=>!o.dead&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);
 const world={free,buildings:obstacles,towers:[],nearest:(x,z)=>({x,z})};
 const u=rules.makeUnit(1,0,start.x,start.z);
 const ctx=vm.createContext({...rules,world,obstacles,free,solid:(...a)=>!free(...a),performance:{now:()=>now},
  state:rules.makeState(),units:[u],player:goal,boss:{active:false},visuals:new Map(),squadIds:new Set(),
  ALLY_VIEW:22,alerted:true,frameDelta:.04,civilianTarget:()=>goal});
 vm.runInContext(section(river,' const routes=new WeakMap();',' function nearest(')+section(river,' function clear(',' function breakAt(')+section(main,'const STUCK_LIMIT=','function forward(')+section(main,'const CROWD_CELL=6;','function dropActorVisual('),ctx);
 world.waypoint=ctx.waypoint;
 return {u,world,step(dt=.04){now+=dt*1000;ctx.frameDelta=dt;ctx.runAI(dt);}};
}
test('actual AI reaches the far side of a building from all four directions',()=>{
 const building={x:22,z:0,w:4,d:8,dead:false};
 for(const [start,goal] of [[{x:17,z:0},{x:28,z:0}],[{x:28,z:0},{x:17,z:0}],[{x:22,z:-9},{x:22,z:9}],[{x:22,z:9},{x:22,z:-9}]]){
  const sim=riverAI(start,goal,[building]);
  for(let i=0;i<1500&&rules.distance(sim.u,goal)>.75;i++){sim.step();assert.ok(sim.world.free(sim.u.x,sim.u.z),'actor must not enter the building');}
  assert.ok(rules.distance(sim.u,goal)<.75,`actor stopped at ${sim.u.x},${sim.u.z} going from ${JSON.stringify(start)} to ${JSON.stringify(goal)}`);
 }
});
test('actual AI clears the narrow alleys around a real Riverside building',()=>{
 const obstacles=[
  {x:-54.45,z:51.819639,w:4.619997,d:4.859279},
  {x:-54.56,z:45.764689,w:4.839997,d:5.509376},
  {x:-48.620001,z:51.7,w:3.959998,d:5.059998},
  {x:-48.620001,z:45.773496,w:4.4,d:5.526992}
 ];
 const o=obstacles[1],start={x:o.x-o.w/2-.6,z:o.z},goal={x:o.x+o.w/2+.6,z:o.z},sim=riverAI(start,goal,obstacles);
 for(let i=0;i<1800&&rules.distance(sim.u,goal)>.75;i++){sim.step();assert.ok(sim.world.free(sim.u.x,sim.u.z));}
 assert.ok(rules.distance(sim.u,goal)<.75,`narrow alley stopped actor at ${sim.u.x},${sim.u.z}`);
});
test('actual AI follows short corner steps without overshooting them',()=>{
 const sim=riverAI({x:17,z:0},{x:28,z:0},[]),target={x:17.12,z:0};
 sim.world.waypoint=()=>target;
 sim.step(.3);
 assert.ok(sim.u.x>17.05,'a waypoint closer than 0.6 must still allow movement');
 assert.ok(sim.u.x<=target.x+1e-8,'frame movement must not overshoot the waypoint');
});
test('production Tidewater uses the shared navigation covered by map tests',()=>{
 const entry=main.match(/import\('([^']+)'\)\)\.loadTidewater/)[1];
 const source=readFileSync(new URL(entry,import.meta.url),'utf8');
 assert.ok(/import\s*\{createTidewaterNavigation as CS\}\s*from ['"]\.\.\/tidewater-navigation\.js['"]/.test(source),'production map must import shared navigation');
 assert.doesNotMatch(source,/function CS\(/,'the embedded old navigation must be removed');
});
function facilityWorld(){
 const tower={x:0,z:-3,w:2.4,d:2.4,h:4.8,hp:180,dead:false};
 const world={heightAt:()=>0,cameraBlocked:()=>false,obstacles:[],destructibles:[tower],
  breakAt(x,z,r,damage){if(Math.hypot(Math.max(0,Math.abs(x-tower.x)-tower.w/2),Math.max(0,Math.abs(z-tower.z)-tower.d/2))<=r)tower.hp-=damage;}};
 return {world,tower};
}
test('needle stops at a facility and damages it before reaching enemies behind it',()=>{
 const {world,tower}=facilityWorld(),b={x:0,y:1,z:0,vx:0,vy:0,vz:-60,life:1,pierce:3};let hits=0,impacts=0;
 stepComicNeedle(T,b,.1,world,{units:[{id:1,x:0,z:-5}],onUnit:()=>hits++,onTerrain:()=>{impacts++;world.breakAt(b.x,b.z,.75,18);}});
 assert.equal(impacts,1);assert.equal(hits,0);assert.equal(tower.hp,162);assert.equal(b.life,0);
 tower.dead=true;const next={x:0,y:1,z:0,vx:0,vy:0,vz:-60,life:1};
 stepComicNeedle(T,next,.1,world,{onTerrain:()=>impacts++});
 assert.equal(impacts,1);assert.equal(next.life,1,'destroyed facilities must not block later shots');
});
test('crosshair aiming and empowered shots also hit facilities',()=>{
 const {world}=facilityWorld(),camera=new T.PerspectiveCamera(64,1,.1,100);
 camera.position.set(0,1,0);camera.lookAt(0,1,-10);
 const aim=resolveComicAim(T,camera,new T.Vector3(0,1,-.5),{world,range:20});
 assert.equal(aim.kind,'obstacle');assert.ok(aim.target.z>-3);
 const b={x:0,y:1,z:0,vx:0,vy:0,vz:-60,life:1};let impacts=0;
 stepComicBallistic(T,b,.1,world,()=>impacts++);stepComicBallistic(T,b,.1,world,()=>impacts++);
 assert.equal(impacts,1);assert.equal(b.life,0);
 const above={x:0,y:8,z:0,vx:0,vy:0,vz:-60,life:1};
 stepComicNeedle(T,above,.1,world,{onTerrain:()=>impacts++});assert.equal(above.life,1);assert.equal(impacts,1);
});
