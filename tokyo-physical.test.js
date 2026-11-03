import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import * as rules from './rules.js';
import {loadTokyoCollisionScene} from './scripts/tokyo/load-collision-scene.mjs';
import {WalkCollision} from './tokyo/collision.js';
import {createTokyoNavigation} from './tokyo/navigation.js';
import {createTokyoPopulation} from './tokyo/gameplay.js';

// 用游戏交付的 GLB，而非仅检查旧导航文件内部是否连通。
const data=JSON.parse(readFileSync(new URL('./assets/scenes/tokyo-navigation.json',import.meta.url)));
const collision=new WalkCollision(await loadTokyoCollisionScene());
const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');

test('static floor reuse preserves exact coordinates and keeps separate decks distinct',()=>{
 let rays=0;const nav=createTokyoNavigation({bounds:{minX:-2,maxX:2,minZ:-2,maxZ:2},step:1,nodes:[]},{raycast(origin){rays++;return {point:{y:origin.y>3?3.3:0}};}});
 for(let i=0;i<100;i++)assert.equal(nav.heightAt(.123,-.321,0),0);assert.equal(rays,1);
 assert.equal(nav.heightAt(.123,-.321,3.3),3.3);assert.equal(rays,2);
 assert.equal(nav.heightAt(.12301,-.321,0),0);assert.equal(rays,3,'nearby coordinates cannot share a rounded cache entry');
});

test('120-actor combat keeps independent movement, both-side attacks and configured attack cadence at a 60 Hz simulation',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);const nav=createTokyoNavigation(data,collision),population=createTokyoPopulation(nav),state=rules.makeState(),units=[];
 const player=nav.nearest(0,-15,.3,0),moved=new Set(),hits=[];
 for(let z=-12;z<16&&units.length<120;z+=1.5)for(let x=-15;x<16&&units.length<120;x+=1.5){
  if(!nav.free(x,z,.35,0))continue;const i=units.length,u=rules.makeUnit(i+1,i%2?1:i%4?1:0,x,z,false,i%5);u.floorY=nav.heightAt(x,z,0);u.rush=true;
  if(i%2===0)rules.convert(state,u);u.hp=u.maxHp=10000;u.threshold=100000;units.push(u);
 }
 assert.equal(units.length,120);state.hp=state.maxHp=100000;state.alert=6;state.time=100;
 const ctx=vm.createContext({...rules,units,player,state,ALLY_VIEW:22,alerted:true,boss:{active:false},squadIds:new Set(),visuals:new Map(),frameDelta:1/60,
  world:{...nav,multilevel:true,tutorial:true,towers:[],populationTarget:population.wander},tickPurifier:()=>null,showHostilePose(){},toast(){},
  allyFire(u,spec,victim){hits.push({id:u.id,type:u.type,ally:true,time:now/1000});const strike=rules.allyMelee(u);rules.hit(state,victim,strike.infection,strike.damage,false,true);},
  enemyFire(u,spec,victim){hits.push({id:u.id,type:u.type,ally:false,time:now/1000});if(victim===player)rules.hurtMother(state,spec.damage,'test');else rules.damageAlly(victim,spec.damage,state,player);}
 });
 const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));vm.runInContext(section('const STUCK_LIMIT=','function forward()')+section('const CROWD_CELL=','function dropActorVisual('),ctx);
 for(let frame=0;frame<240;frame++){const before=units.map(u=>[u.x,u.z]);now+=1000/60;state.time+=1/60;vm.runInContext('runAI(1/60)',ctx);units.forEach((u,i)=>{if(Math.hypot(u.x-before[i][0],u.z-before[i][1])>.005)moved.add(u.id);});}
 assert.ok(units.filter(u=>u.converted&&moved.has(u.id)).length>=20,'allies must keep moving independently');
 assert.ok(units.filter(u=>!u.converted&&moved.has(u.id)).length>=20,'enemies must keep moving independently');
 assert.ok(hits.filter(h=>h.ally).length>25);assert.ok(hits.filter(h=>!h.ally).length>25);
 const last=new Map();for(const h of hits){if(last.has(h.id)){const spec=rules.ENEMIES[h.type];assert.ok(h.time-last.get(h.id)>=spec.interval+spec.aim-.04,'render optimizations cannot change attack cadence');}last.set(h.id,h.time);}
});

test('fine three-dimensional collision buckets include every intersecting instance across floor and cell boundaries',()=>{
 const items=new Set([...collision.cells.values()].flat());
 for(const [x,y,z]of [[4,-4,8],[0,0,0],[-4,4,-4],[-8,-1.65,4],[68,3.3,25]]){
  const box=new T.Box3(new T.Vector3(x-.2,y-.2,z-.2),new T.Vector3(x+.2,y+1,z+.2)),actual=collision.candidates(box),expected=new Set([...items].filter(item=>item.bounds.intersectsBox(box)));
  assert.deepEqual(actual,expected,`missing collision near ${x},${y},${z}`);
 }
});

test('real street, plaza and platform floors remain walkable in missing navigation cells',()=>{
 const nav=createTokyoNavigation(data,collision);
 for(const [x,z,floorY]of [[-53,-54,3.3],[5.8,9.6,-3.85],[-14.6,3.6,0]]){
  assert.ok(!nav.bodyBlocked(x,floorY,z));
  assert.ok(Math.abs(nav.heightAt(x,z,floorY)-floorY)<.05);
  assert.ok(nav.canMove({x:x-.06,z,floorY},x+.06,z),`invisible wall at ${x}, ${z}`);
 }
});

test('physical walls, empty space and map edges still block while overlapping decks stay separate',()=>{
 const root=new T.Group(),material=new T.MeshBasicMaterial();
 for(const y of [0,3.3]){const p=new T.Mesh(new T.PlaneGeometry(8,8),material);p.rotation.x=-Math.PI/2;p.position.y=y;root.add(p);}
 const wall=new T.Mesh(new T.BoxGeometry(.1,2,4),material);wall.position.y=1;root.add(wall);
 const nav=createTokyoNavigation({bounds:{minX:-2,maxX:2,minZ:-2,maxZ:2},step:1,width:4,depth:4,nodes:[]},new WalkCollision(root));
 assert.equal(nav.heightAt(-1,0,0),0);assert.ok(Math.abs(nav.heightAt(-1,0,3.3)-3.3)<.001);
 assert.equal(nav.canMove({x:-1,z:0,floorY:0},1,0),false,'cannot walk through a visible wall');
 assert.equal(nav.canMove({x:-1,z:2.8,floorY:0},1,2.8),true,'open space must not depend on navigation coverage');
 assert.equal(nav.canMove({x:2.5,z:2.8,floorY:0},3.5,2.8),true,'the old grid rectangle must not cut through a visible road');
 assert.equal(nav.canMove({x:3.5,z:2.8,floorY:0},4.1,2.8),false,'outer boundary retained');
 assert.equal(nav.heightAt(8,8,0),-99);
});

test('real metro enemies pass narrow corners and pursue in both directions using the actual AI movement',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const nav=createTokyoNavigation(data,collision);
 const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
 const code=section('const STUCK_LIMIT=','function forward()')+section('const CROWD_CELL=','function attackHasLine(')+section('let aiStart=','function dropActorVisual(');
 for(const [a,b]of [[[12.95,8.55],[-20,8]],[[5.7790655,8.9449876],[-20,8]],[[-20,8],[20,8]]]){
  const start=nav.nearest(...a,.2,-3.85),goal=nav.nearest(...b,.2,-3.85),enemy=rules.makeUnit(100,1,start.x,start.z,false);enemy.floorY=start.floorY;
  const context=vm.createContext({...rules,units:[enemy],player:goal,world:{...nav,multilevel:true,populationTarget:()=>goal},visuals:new Map(),frameDelta:.05});
  vm.runInContext(code,context);
  for(let frame=0;frame<1800&&Math.hypot(enemy.x-goal.x,enemy.z-goal.z)>.75;frame++){now+=50;vm.runInContext('runAI(.05,true)',context);}
  assert.ok(Math.hypot(enemy.x-goal.x,enemy.z-goal.z)<.75,`metro enemy stalled at ${enemy.x}, ${enemy.z}`);
  assert.ok(Math.abs(enemy.floorY+3.85)<.15,'enemy must stay on the platform floor');
 }
 assert.ok(nav.navigationStats().closedEdges>0,'the real railing missed by the old graph must trigger rerouting');
});

test('every actual GLB stair remains passable in both directions',()=>{
 const nav=createTokyoNavigation(data,collision);
 const transform=p=>({x:(p[0]+20)*.55,z:(p[2]-52)*.55,floorY:(p[1]+6)*.55});
 for(const stair of data.stairs)for(const [aa,bb]of [[stair.a,stair.b],[stair.b,stair.a]]){
  const a=transform(aa),b=transform(bb);let u={...a};const count=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.06);
  for(let k=1;k<=count;k++){
   const x=a.x+(b.x-a.x)*k/count,z=a.z+(b.z-a.z)*k/count;assert.ok(nav.canMove(u,x,z),`${stair.name}: ${x}, ${z}`);
   u={x,z,floorY:nav.heightAt(x,z,u.floorY)};
  }
  assert.ok(Math.abs(u.floorY-b.floorY)<.2);
 }
});

test('converted tutorial actors wander independently at their configured speed and report actual travel to animation',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const nav=createTokyoNavigation(data,collision),start=nav.nearest(5.7790655,8.9449876,.2,-3.85),goal=nav.nearest(20,8,.2,-3.85);
 const ally=rules.makeUnit(99,0,start.x,start.z);ally.floorY=start.floorY;ally.converted=true;ally.kind='ally';ally.stationary=false;
 const samples=[],visual={holder:new T.Group()},section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));let previousX=ally.x,previousZ=ally.z;
 const context=vm.createContext({...rules,ALLY_VIEW:22,units:[ally],player:{x:-20,z:8,floorY:-3.85},boss:{active:false},state:{hp:100,maxHp:100},squadIds:new Set(),world:{...nav,multilevel:true,towers:[],populationTarget:()=>goal},visuals:new Map([[99,{v:visual}]]),frameDelta:.05,
  actorViewLimit:()=>58,actorInFront:()=>true,updateCharacterVisual(v,moving,dt,d,sprinting,groundSpeed){samples.push({moving,groundSpeed,actual:Math.hypot(ally.x-previousX,ally.z-previousZ)/dt});previousX=ally.x;previousZ=ally.z;}});
 vm.runInContext(section('const STUCK_LIMIT=','function forward()')+section('const CROWD_CELL=','function attackHasLine(')+section('let aiStart=','function dropActorVisual('),context);
 for(let i=0;i<1200&&Math.hypot(ally.x-goal.x,ally.z-goal.z)>.75;i++){now+=50;vm.runInContext('runAI(.05,true)',context);}
 assert.ok(Math.hypot(ally.x-goal.x,ally.z-goal.z)<.75,'must reach its own destination, away from the player');assert.ok(Math.abs(ally.floorY+3.85)<.15);
 assert.ok(samples.some(s=>Math.abs(s.groundSpeed-rules.TUNE.activity.awakeSpeed)<.01),'must use its own awakeSpeed, not followSpeed or civilian speed');
 assert.ok(samples.every(s=>Math.abs(s.groundSpeed-s.actual)<.001),'animation cadence must follow measured travel, including waypoint transitions');
});

test('real no-target actors keep wandering through multiple destinations on platform, fringe and stair landing',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
 const code=section('const STUCK_LIMIT=','function forward()')+section('const CROWD_CELL=','function dropActorVisual(');
 for(const start of [[5,8,-3.85],[-19.4,-8.4,0],[-7.15,9.35,-1.65]]){
  const nav=createTokyoNavigation(data,collision),pop=createTokyoPopulation(nav),p=nav.nearest(start[0],start[1],.2,start[2]);
  let seed=17;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const u=rules.makeUnit(99,0,p.x,p.z,false);Object.assign(u,{floorY:p.floorY,kind:'ally',converted:true,stationary:true});
  const player={x:p.x+10,z:p.z,floorY:p.floorY};
  const ctx=vm.createContext({...rules,ALLY_VIEW:22,units:[u],player,world:{...nav,multilevel:true,towers:[],populationTarget:(u,options)=>pop.wander(u,{...options,random})},boss:{active:false},state:{hp:100,maxHp:100},squadIds:new Set(),visuals:new Map(),frameDelta:.04});
  vm.runInContext(code+'\nMath.random=()=>.5;',ctx);const goals=new Set();let travel=0,idleFrames=0;
  for(let i=0;i<1000;i++){
   // 始终近距离观察，排除画面外人物的低频更新，逐帧检查换目标和等路线时是否歇脚。
   player.x=u.x+10;player.z=u.z;
   const x=u.x,z=u.z;now+=40;vm.runInContext('runAI(.04)',ctx);const moved=Math.hypot(u.x-x,u.z-z);travel+=moved;
   if(moved<.005)idleFrames++;
   if(u.tokyoDestination)goals.add(`${u.tokyoDestination.x},${u.tokyoDestination.z},${u.tokyoDestination.floorY}`);
  }
  assert.ok(goals.size>=3,`wander stopped choosing new destinations at ${start}`);
  assert.ok(travel>rules.TUNE.activity.awakeSpeed*40*.9,`no-target actor moved only ${travel} at ${start}`);
  assert.equal(idleFrames,0,`no-target actor inserted ${idleFrames} idle frames at ${start}`);
 }
});

test('newly converted tutorial worker starts pursuing immediately with the complete normal population competing for routes',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a))),code=section('const STUCK_LIMIT=','function forward()')+section('const CROWD_CELL=','function dropActorVisual(');
 for(const initialSeed of [1,17,93]){
  const nav=createTokyoNavigation(data,collision),pop=createTokyoPopulation(nav),player={x:5,z:8,floorY:-3.85},units=[],state=rules.makeState();let seed=initialSeed;
  const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  // 沿用正常开局的四区人口配额、出生位置、楼层和转化规则，不能移除会抢占寻路预算的其他人。
  for(let region=0;region<4;region++)for(const [type,count]of [[0,rules.TUNE.difficulty.civiliansPerRegion],[1,rules.TUNE.difficulty.patrolsPerRegion]])for(let i=0;i<count;i++){
   const p=pop.spawn({region,player,units,random,type});assert.ok(p);
   const u=rules.makeUnit(units.length,type,p.x,p.z,true,units.length%5);Object.assign(u,{floorY:p.floorY,populationRegion:region});units.push(u);
  }
  const worker=rules.makeUnit(999,0,1,8,true);worker.floorY=-3.85;worker.stationary=true;worker.tutorialWorker=true;
  rules.convert(state,worker);units.push(worker);let requested=false,pursuitFrames=0,blockedFrames=0,attacks=0;
  const ctx=vm.createContext({...rules,ALLY_VIEW:22,units,player,state,squadIds:new Set(),boss:{active:false},visuals:new Map(),frameDelta:.04,
   world:{...nav,multilevel:true,tutorial:true,towers:[],populationTarget:(u,o)=>pop.wander(u,{...o,random}),waypoint(u,...goal){if(u===worker)requested=true;return nav.waypoint(u,...goal);}},
   tickPurifier:()=>null,showHostilePose(){},toast(){},allyFire(u,spec,victim){attacks++;const strike=rules.allyMelee(u);rules.hit(state,victim,strike.infection,strike.damage,false,true);}});
  vm.runInContext(code+'\nMath.random=()=>.5;',ctx);
  for(let i=0;i<400;i++){
   const x=worker.x,z=worker.z;requested=false;now+=40;state.time+=.04;vm.runInContext('runAI(.04,true)',ctx);
   if(requested){pursuitFrames++;if(Math.hypot(worker.x-x,worker.z-z)<.005)blockedFrames++;}
   if(i<12)assert.ok(Math.hypot(worker.x-x,worker.z-z)>.1,`new infection waits for a route at frame ${i}, seed ${initialSeed}`);
  }
  assert.ok(pursuitFrames>20);assert.equal(blockedFrames,0,`pursuit inserted ${blockedFrames} idle frames, seed ${initialSeed}`);
  assert.ok(attacks>0,'continuous travel must still stop to attack when it reaches a real target');
 }
});
