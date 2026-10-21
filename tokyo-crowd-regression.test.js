import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as rules from './rules.js';
import {WalkCollision} from './tokyo/collision.js';
import {createTokyoNavigation} from './tokyo/navigation.js';
import {createTokyoPopulation} from './tokyo/gameplay.js';

const data=JSON.parse(readFileSync(new URL('./assets/scenes/tokyo-navigation.json',import.meta.url)));
const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
const section=(a,b)=>main.slice(main.indexOf(a),main.indexOf(b,main.indexOf(a)));
const loader=new GLTFLoader();
// Geometry, instances and transforms are the shipped GLB; image decoding is not
// needed for collision tests and would require a browser canvas in Node.
loader.register(()=>({name:'CollisionTestTextures',loadTexture:async()=>new T.Texture()}));
const binary=readFileSync(new URL('./assets/scenes/tokyo-district.glb',import.meta.url));
const {scene:root}=await loader.parseAsync(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),'');
root.scale.setScalar(.55);root.position.set(11,3.3,-28.6);
const collision=new WalkCollision(root);

test('upper public decks receive balanced spawns with real floor and body clearance',()=>{
 const nav=createTokyoNavigation(data,collision),pop=createTokyoPopulation(nav),units=[];
 for(const zone of ['street','skybridge','viaduct'])for(let i=0;i<6;i++){
  const p=pop.spawn({zone,units,random:()=>i/6});assert.ok(p,'no spawn on '+zone);
  assert.equal(p.zone,zone);assert.ok(nav.free(p.x,p.z,.65,p.floorY));
  assert.ok(Math.abs(nav.heightAt(p.x,p.z,p.floorY)-p.floorY)<.25);
  units.push(p);
 }
});

test('walking upstairs repopulates an old save without adding actors or moving infected companions',()=>{
 const nav=createTokyoNavigation(data,collision),pop=createTokyoPopulation(nav);
 const player=pop.spots.find(p=>p.zone==='viaduct'&&p.z>0&&p.z<4),units=[];
 assert.ok(player);
 for(let i=0;i<12;i++)units.push({...pop.spawn({zone:'plaza',units,random:()=>i/12}),id:i,type:0,city:true,kind:'human',hp:50});
 units[0].converted=true;units[0].kind='ally';units[1].infection=4;
 const protectedActors=units.slice(0,2).map(u=>({...u}));
 const army={...units[2],id:99,city:false,type:7};units.push(army);const initialArmy={...army};
 const moved=pop.rebalance(units,player);
 assert.ok(moved>0&&moved<=4);assert.equal(units.length,13);assert.deepEqual(army,initialArmy,'combat reinforcements must not be recycled as civilians');
 assert.deepEqual(units.slice(0,2),protectedActors);
 assert.ok(units.some(u=>u.zone==='viaduct'));assert.ok(units.every(u=>u.hp===50));
 assert.equal(pop.rebalance(units,player,{hidden:()=>false}),0,'visible people cannot be relocated');
});

test('time spent outside navigation cannot freeze every first route in a frame',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const nav=createTokyoNavigation(data,collision),u={x:5,z:8,floorY:-3.85};
 for(let i=0;i<10;i++){
  nav.beginNavigationFrame();now+=12; // crowd collision/rendering can exceed 2 ms
  const p=nav.waypoint(u,3,8,-3.85);
  assert.ok(p.x<u.x-.1,'a late first query must still receive navigation time');
  now+=16;
 }
});

test('a cached route is discarded when a target changes floors at the same coordinates',t=>{
 t.mock.method(performance,'now',()=>0);
 const nav=createTokyoNavigation({bounds:{minX:0,maxX:2,minZ:0,maxZ:1},step:1,nodes:[[0,0,0,[1]],[1,0,0,[0]],[0,0,3,[3]],[1,0,3,[2]]]}),u={x:.5,z:.5,floorY:0};
 assert.equal(nav.waypoint(u,1.5,.5,0).x,1.5);
 const next=nav.waypoint(u,1.5,.5,3);
 assert.equal(next.x,u.x,'do not keep chasing a point on the old deck');
});

test('old stationary flags do not pin station workers or converted tutorial companions',()=>{
 const nav=createTokyoNavigation(data),pop=createTokyoPopulation(nav);
 for(const converted of [false,true]){
  const u={x:1,z:8,floorY:-3.85,stationary:true,converted,tutorialWorker:converted};
  const destination=pop.wander(u);
  assert.ok(Math.hypot(destination.x-u.x,destination.z-u.z)>2);
  assert.equal(u.stationary,false);
 }
 const tutorial={x:1,z:8,floorY:-3.85,stationary:true,tutorialWorker:true};
 assert.equal(pop.wander(tutorial),tutorial);
});

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} station crowd moves against real geometry after a busy frame`,t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const nav=createTokyoNavigation(data,collision),pop=createTokyoPopulation(nav);
 const spots=pop.spots.filter(p=>p.zone==='platform');
 const units=Array.from({length:12},(_,i)=>{
  const p=spots[i*4%spots.length],u=Object.assign(rules.makeUnit(i,0,p.x,p.z,true,0),p);
  if(i%2){u.converted=true;u.kind='ally';}
  return u;
 });
 const initial=units.map(u=>({...u})),travelled=units.map(()=>0);
 let seed=123;
 const seededMath=Object.create(Math);seededMath.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const ctx=vm.createContext({...rules,Math:seededMath,units,player:{x:5,z:8,floorY:-3.85},aiStart:0,ALLY_VIEW:18,STUCK_LIMIT:Infinity,frameDelta:1/30,visuals:new Map(),
  world:{...nav,mobile,multilevel:true,populationTarget:pop.wander,beginNavigationFrame(){nav.beginNavigationFrame();now+=8;}},TUNE:{activity:{shambleSpeed:1}}});
 // Population wander also uses seeded random, without modifying the real game.
 t.mock.method(Math,'random',seededMath.random);
 vm.runInContext(section('function move(u,','function forward()')+section('const CROWD_CELL=','function attackHasLine(')+section('function runAI(','function dropActorVisual('),ctx);
 for(let frame=0;frame<240;frame++){
  const previous=units.map(u=>({...u}));now+=33;vm.runInContext('runAI(1/30,true)',ctx);
  units.forEach((u,i)=>travelled[i]+=Math.hypot(u.x-previous[i].x,u.z-previous[i].z));
 }
 units.forEach((u,i)=>{
  assert.ok(travelled[i]>1,`station actor ${i} never started walking: ${JSON.stringify(initial[i])}`);
  assert.ok(Math.abs(u.floorY+3.85)<.25,'station walkers must retain the platform floor');
 });
});

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} converted companion follows the actual stairs out of the station`,t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const nav=createTokyoNavigation(data,collision),u={x:1,z:8,floorY:-3.85,id:1},goal={x:10,z:-9,floorY:0};
 const ctx=vm.createContext({world:{...nav,multilevel:true},STUCK_LIMIT:Infinity,frameDelta:1/30,u});
 vm.runInContext(section('function move(u,','function forward()'),ctx);
 for(let frame=0;frame<900;frame++){
  nav.beginNavigationFrame();now+=8;
  const p=nav.waypoint(u,goal.x,goal.z,goal.floorY),distance=Math.hypot(p.x-u.x,p.z-u.z);
  if(distance>.1){const step=Math.min(distance,(mobile?3.6:3.8)/30);ctx.dx=(p.x-u.x)/distance*step;ctx.dz=(p.z-u.z)/distance*step;vm.runInContext('move(u,dx,dz,true)',ctx);}
  now+=33;if(Math.hypot(u.x-goal.x,u.z-goal.z)<.4&&Math.abs(u.floorY)<.4)break;
 }
 assert.ok(Math.hypot(u.x-goal.x,u.z-goal.z)<.4,JSON.stringify(u));
 assert.ok(Math.abs(u.floorY)<.4,'companion never reached the plaza floor');
});

test('platform continues underneath overlapping stair cells without an invisible grid wall',()=>{
 const nav=createTokyoNavigation(data,collision);
 for(const z of [6.3,6.5,6.6]){
  const u={x:-8.2,z,floorY:-3.85},y=nav.heightAt(u.x,u.z,u.floorY);
  assert.ok(Math.abs(y-u.floorY)<.1,'must retain the platform rather than the upper landing');
  assert.equal(nav.bodyBlocked(u.x,y,u.z),false);
  assert.ok(nav.canMove(u,u.x+.08,z),'real floor must remain walkable across the grid hole');
 }
 assert.equal(nav.clear({x:-8.2,z:6.5,floorY:-3.85},{x:-8.2,z:6.5,floorY:-1.65}),false,'overlapping decks are still separate');
});

test('physical floor fallback retains walls, gaps and separate overlapping decks',()=>{
 const root=new T.Group(),box=(w,h,d,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d));m.position.set(x,y,z);root.add(m);};
 box(2,.1,1,1,-.05,.5);box(2,.1,1,1,2.95,.5);box(.2,1.5,1,1.5,.75,.5);
 const nav=createTokyoNavigation({bounds:{minX:0,maxX:4,minZ:0,maxZ:1},step:1,nodes:[[0,0,0,[1]],[1,0,0,[0]],[0,0,3,[3]],[1,0,3,[2]]]},new WalkCollision(root));
 const u={x:.5,z:.5,floorY:0};
 assert.ok(nav.canMove(u,1,.5));
 assert.equal(nav.canMove(u,1.6,.5),false,'solid walls remain solid');
 assert.equal(nav.canMove(u,3,.5),false,'missing grid must not manufacture a floor over a gap');
 assert.equal(nav.clear(u,{x:.5,z:.5,floorY:3}),false,'no vertical teleport between decks');
});

test('large AI movement updates keep the swept stair height and follow diagonal corners',()=>{
 const nav=createTokyoNavigation(data,collision),ctx=vm.createContext({world:{...nav,multilevel:true},STUCK_LIMIT:Infinity,frameDelta:1/30});
 vm.runInContext(section('function move(u,','function forward()'),ctx);
 ctx.u={x:-2.65,z:8.55,floorY:-3.85};
 vm.runInContext('move(u,-1,0,true)',ctx);
 assert.ok(ctx.u.floorY>-3.5,'endpoint sampling must not leave a long stair step underneath the treads');
 ctx.u={x:-2.35,z:7.95,floorY:-3.85};
 vm.runInContext('move(u,-.3,.6,true)',ctx);
 assert.ok(Math.hypot(ctx.u.x+2.65,ctx.u.z-8.55)<.01,'splitting a clear diagonal into X/Z must not trap actors at the stair corner');
});

test('every authored stair works with the shipped collision geometry in both directions',()=>{
 const nav=createTokyoNavigation(data,collision),transform=p=>({x:(p[0]+20)*.55,floorY:(p[1]+6)*.55,z:(p[2]-52)*.55});
 for(const stair of data.stairs)for(const [aa,bb]of [[stair.a,stair.b],[stair.b,stair.a]]){
  const a=transform(aa),b=transform(bb);let u={...a};const count=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.06);
  for(let i=1;i<=count;i++){
   const p=nav.movePoint(u,a.x+(b.x-a.x)*i/count,a.z+(b.z-a.z)*i/count);
   assert.ok(p,`${stair.name}: ${JSON.stringify(u)}`);u=p;
  }
  assert.ok(Math.abs(u.floorY-b.floorY)<.2,`${stair.name}: wrong landing`);
 }
});

for(const mobile of [false,true])for(const allied of [false,true])test(`${mobile?'mobile':'desktop'} ${allied?'whole companion squad follows':'hostile squad chases'} from station to plaza in live AI`,t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 let seed=123;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 t.mock.method(Math,'random',random);
 const nav=createTokyoNavigation(data,collision),pop=createTokyoPopulation(nav),spots=pop.spots.filter(p=>p.zone==='platform');
 const units=Array.from({length:8},(_,i)=>{
  const p=spots[Math.floor(i*spots.length/8)],u=Object.assign(rules.makeUnit(i,allied?0:1,p.x,p.z,true),p);
  if(allied)Object.assign(u,{converted:true,kind:'ally',guard:true});else u.rush=true;
  return u;
 });
 const player={x:10,z:-9,floorY:0},state=rules.makeState();let hits=0;
 const ctx=vm.createContext({...rules,units,player,state,aiStart:0,ALLY_VIEW:18,STUCK_LIMIT:Infinity,frameDelta:1/30,visuals:new Map(),boss:{active:false},squadIds:new Set(),alerted:true,
  world:{...nav,mobile,multilevel:true,populationTarget:pop.wander,towers:[],tutorial:{},breakAt(){}},
  tickPurifier:()=>undefined,showHostilePose(){},allyFire(){hits++;},enemyFire(){hits++;},toast(){}});
 vm.runInContext(section('function move(u,','function forward()')+section('const CROWD_CELL=','let aiStart=')+section('function runAI(','function dropActorVisual('),ctx);
 for(let frame=0;frame<1800;frame++){
  now+=1000/30;state.time+=1/30;vm.runInContext('runAI(1/30,false)',ctx);
  assert.ok(units.every(u=>u.floorY>-4.2&&u.floorY<.25),'a walker fell through or jumped onto furniture');
 }
 for(const u of units){
  assert.ok(Math.abs(u.floorY)<.15&&Math.hypot(u.x-player.x,u.z-player.z)<4,`actor ${u.id} stalled: ${JSON.stringify({x:u.x,z:u.z,y:u.floorY})}`);
 }
 if(!allied)assert.ok(hits>0,'hostiles must reach the player and attack, not just wander peacefully');
});
