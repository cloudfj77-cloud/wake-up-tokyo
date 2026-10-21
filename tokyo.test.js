import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as rules from './rules.js';
import * as T from 'three';
import {createTokyoNavigation} from './tokyo/navigation.js';
import {selectedMap} from './maps.js';
import {TOKYO_FOG,TOKYO_LOOK,createTokyoPopulation,populationZone,advanceTutorial,tutorialActive,tutorialTarget,tokyoObjective} from './tokyo/gameplay.js';
const data=JSON.parse(readFileSync(new URL('./assets/scenes/tokyo-navigation.json',import.meta.url))),nav=createTokyoNavigation(data);
const sha=s=>createHash('sha256').update(s).digest('hex');
test('approved shaders, lights and render-pass visibility changes match the verified baseline',()=>{
 const baseline=JSON.parse(readFileSync(new URL('./verification/tokyo-render-baseline.json',import.meta.url)));
 for(const f of ['toon-filter.js','outline-filter.js','camera-cutaway.js'])assert.equal(sha(readFileSync(new URL(f,import.meta.url))),baseline.sha256[f],f);
 const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const renderInit=main.slice(main.indexOf('const renderer='),main.indexOf("$('mapSelect').value")).replace("if(mapConfig.id==='riverside')Object.assign(toonFilter,TOKYO_LOOK);\n",'').replace("mapConfig.id==='riverside'?TOKYO_FOG.near:16,mapConfig.id==='riverside'?TOKYO_FOG.far:52",'16,52');
 assert.equal(sha(renderInit),baseline.sha256.renderInit);
 assert.deepEqual(TOKYO_FOG,{near:28,far:145});
 assert.equal(sha(main.slice(main.indexOf(' syncFogMode();\n'),main.indexOf(' if(cameraReadout&&mode'))),baseline.sha256.renderPass);
});
test('new Tokyo model has its own save key while Tidewater is unchanged',()=>{
 assert.equal(selectedMap('?map=riverside').saveKey,'wake-up-tokyo-cyber-v1');
 assert.equal(selectedMap('').saveKey,'wake-up-tokyo-cyber-v1');
});
test('baked routes form one connected component spanning station, plaza, street and viaduct',()=>{
 const seen=new Set([0]),q=[0];for(let i=0;i<q.length;i++)for(const j of data.nodes[q[i]][3]){assert.ok(j>=0&&j<data.nodes.length);if(!seen.has(j)){seen.add(j);q.push(j);}}
 assert.equal(seen.size,data.nodes.length);
 for(const h of [-3.85,0,3.3,12.1])assert.ok(data.nodes.some(n=>Math.abs(n[2]-h)<.1),'missing layer '+h);
});
test('spawn, boss arena and mission sites have usable floor clearance',()=>{
 for(const [x,z,r,hint] of [[5,8,.25,-3.85],[10,-9,3.5,0],[-9,-8,2,0],[11,10,2,0],[-15,15,2,0]]){
  const p=nav.nearest(x,z,r,hint);assert.ok(nav.free(p.x,p.z,r,p.floorY));assert.ok(Math.abs(p.floorY-hint)<.4);
 }
});

test('initial and replenished populations cover public decks, respect regions and avoid overlap',()=>{
 const pop=createTokyoPopulation(nav),units=[];
 assert.deepEqual(new Set(pop.spots.map(p=>p.zone)),new Set(['plaza','hall','platform','street','skybridge','viaduct']));
 for(let cycle=0;cycle<4;cycle++){
  for(let region=0;region<4;region++)for(let i=0;i<14;i++){
   const p=pop.spawn({region,units,player:{x:5,z:8},random:()=>((i*13+cycle*7)%57)/57});
   assert.ok(p);assert.ok(populationZone(p));
   assert.equal((p.x>=0?1:0)+(p.z>=0?2:0),region);
   assert.ok(units.every(u=>Math.abs(u.floorY-p.floorY)>1||Math.hypot(u.x-p.x,u.z-p.z)>=1.15));
   units.push(p);
  }units.length=0;
 }
 for(const zone of ['plaza','hall','platform']){
  const u={...pop.spots.find(p=>p.zone===zone)};
  for(let i=0;i<15;i++){const p=pop.wander(u);assert.equal(populationZone(p),zone);Object.assign(u,p);}
 }
 assert.equal(pop.spawn({accept:()=>false}),null,'never bypasses spawn visibility or clearance');
});
test('tutorial requires real movement, conversion and every landing on the correct floor; save resumes',()=>{
 const route={move:{x:3,z:8,floorY:-3.85},worker:{x:1,z:8,floorY:-3.85},exit:[{x:-3,z:9,floorY:-3.85},{x:-7,z:9,floorY:-1.65},{x:3,z:5,floorY:0}]};
 let state={infected:0,time:42,tokyoTutorial:{stage:0,checkpoint:0,baseline:0}};
 advanceTutorial(state,{...route.move,floorY:0},route);assert.equal(state.tokyoTutorial.stage,0);
 advanceTutorial(state,route.move,route);assert.equal(state.tokyoTutorial.stage,1);
 advanceTutorial(state,route.worker,route,{converted:false});assert.equal(state.tokyoTutorial.stage,1);
 advanceTutorial(state,route.worker,route,{converted:true});assert.equal(state.tokyoTutorial.stage,2);
 for(let i=0;i<route.exit.length;i++){
  state=JSON.parse(JSON.stringify(state));assert.deepEqual(tutorialTarget(state,route),route.exit[i]);
  advanceTutorial(state,{...route.exit[i],floorY:12},route);assert.equal(state.tokyoTutorial.checkpoint,i);
  advanceTutorial(state,route.exit[i],route);
 }
 assert.equal(state.tokyoTutorial.completedAt,42);assert.equal(tutorialActive(state),false);assert.equal(tutorialTarget(state,route),null);
 assert.match(tokyoObjective(state).detail,/0 \/ 5/);
 state.infected=5;assert.match(tokyoObjective(state).detail,/5 \/ 15/);
 state.infected=15;assert.equal(tokyoObjective(state,250).progress,.5);
});
test('real initial population and refill callers keep actor heights and leave one stationary tutorial worker',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
 const pop=createTokyoPopulation(nav),ctx=vm.createContext({...rules,MOBILE_DEVICE:false,VISUAL_BUDGET:72,units:[],player:{x:5,z:8,floorY:-3.85},assets:{},actorVisual(){},warmCharacterPool(){},totalReinforcements:0,
  world:{populationSpot:pop.spawn,tutorial:{worker:{x:1,z:8,floorY:-3.85}}},acquireUnitRecord:(type,x,z,city,profession)=>rules.makeUnit(1000,type,x,z,city,profession)});
 vm.runInContext(section('function initUnits(){','// 卡住多久')+section('function placeOnStreet(','\nlet airWing='),ctx);
 vm.runInContext('initUnits();placeOnStreet(0,1)',ctx);
 assert.equal(ctx.units.length,58);assert.equal(ctx.units.filter(u=>u.tutorialWorker&&u.stationary).length,1);
 assert.ok(ctx.units.every(u=>populationZone(u)));
});
test('legacy saves retain progression but migrate people and player to underground floors',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),saved={version:11,state:rules.makeState(),player:{x:40,z:20,floorY:3.3,y:0},units:[rules.makeUnit(1,0,40,20,true),rules.makeUnit(2,1,42,20)] ,objects:[]};
 saved.units[1].converted=true;saved.units.forEach(u=>u.floorY=3.3);saved.state.infected=9;
 const pop=createTokyoPopulation(nav),ctx=vm.createContext({...rules,T,populationZone,saved,world:{tutorial:{},populationSpot:pop.spawn,nearest:nav.nearest},sprayMarkers:new Map(),chargeMarkers:new Map(),visuals:new Map(),spawnQueue:{jobs:[]},recentSpawnPoints:[]});
 vm.runInContext(source.slice(source.indexOf('function restore(saved)'),source.indexOf('let starting=false;'))+'restore(saved);',ctx);
 assert.equal(ctx.state.infected,9);assert.equal(ctx.state.tokyoTutorial.stage,3);assert.ok(populationZone(ctx.player));assert.ok(ctx.units.every(u=>populationZone(u)));
});
test('tutorial attacks do not announce or enqueue a reinforcement wave',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const ctx=vm.createContext({tutorialActive,state:{tokyoTutorial:{stage:1}},alerted:false,spawnReinforcement(){throw Error('wave during tutorial');},toast(){throw Error('alarm during tutorial');}});
 vm.runInContext(source.slice(source.indexOf('function raiseAlarm(){'),source.indexOf('\n',source.indexOf('function raiseAlarm(){')))+';raiseAlarm();',ctx);
 assert.equal(ctx.alerted,false);
});
test('every authored stair can be followed in both directions without switching decks',()=>{
 for(const stair of data.stairs)for(const [aa,bb] of [[stair.a,stair.b],[stair.b,stair.a]]){
  const transform=p=>({x:(p[0]+20)*.55,floorY:(p[1]+6)*.55,z:(p[2]-52)*.55}),a=transform(aa),b=transform(bb);let u={...a};
  const count=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.06);
  for(let i=1;i<=count;i++){const x=a.x+(b.x-a.x)*i/count,z=a.z+(b.z-a.z)*i/count;assert.ok(nav.canMove(u,x,z),JSON.stringify({u,x,z}));u={x,z,floorY:nav.heightAt(x,z,u.floorY)};}
  assert.ok(Math.abs(u.floorY-b.floorY)<.2);
 }
});
test('overlapping decks retain floor identity; movement cannot teleport across gaps or tall ledges',()=>{
 const mini=createTokyoNavigation({bounds:{minX:0,maxX:4,minZ:0,maxZ:1},step:1,width:4,depth:1,nodes:[[0,0,0,[1]],[1,0,.1,[0]],[0,0,3,[3]],[1,0,3,[2]],[3,0,0,[]]]});
 assert.equal(mini.heightAt(.5,.5,3),3);assert.equal(mini.heightAt(.5,.5,0),0);
 assert.equal(mini.canMove({x:.5,z:.5,floorY:0},1.5,.5),true);
 assert.equal(mini.clear({x:.5,z:.5,floorY:0},{x:.5,z:.5,floorY:3}),false);
 assert.equal(mini.canMove({x:.5,z:.5,floorY:0},3.5,.5),false);
});
test('enemy navigation advances to the connected destination',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const u=nav.nearest(5,7,.2),goal=nav.nearest(-12,-10,.2);let distance=Infinity;
 for(let i=0;i<2500;i++){
  now+=16;nav.beginNavigationFrame();const p=nav.waypoint(u,goal.x,goal.z,goal.floorY),d=Math.hypot(p.x-u.x,p.z-u.z);
  if(d>.001){const step=Math.min(.12,d),x=u.x+(p.x-u.x)/d*step,z=u.z+(p.z-u.z)/d*step;assert.ok(nav.canMove(u,x,z));u.floorY=nav.heightAt(x,z,u.floorY);u.x=x;u.z=z;}
  distance=Math.hypot(u.x-goal.x,u.z-goal.z);if(distance<.4)break;
 }
 assert.ok(distance<.4,`route stalled ${distance} m from destination`);
});

test('infection shots use the target deck and can pass beneath an overhead road',async()=>{
 const T=await import('three'),{stepComicNeedle}=await import('./comic-fx.js');
 for(const floorY of [-3.85,3.3]){
  const world={multilevel:true,heightAt:(x,z,hint)=>hint??3.3,groundAt:()=>floorY,cameraBlocked:()=>false};
  const unit={id:1,x:0,z:1,floorY},b={x:0,y:floorY+.6,z:0,vx:0,vy:0,vz:20,life:1};let hits=0;
  stepComicNeedle(T,b,.1,world,{units:[unit],onUnit:()=>hits++});assert.equal(hits,1,'wrong deck '+floorY);
 }
});

test('Tokyo colors brighten midtones and reduce saturation without changing shader algorithms',()=>{
 assert.equal(TOKYO_LOOK.saturation,1.03);assert.ok(TOKYO_LOOK.exposure>1.15);assert.ok(TOKYO_LOOK.shadow<1);
});

test('tutorial runs civilian walking on authored floors without running enemy combat AI',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const pop=createTokyoPopulation(nav),spot=pop.spots.find(p=>p.zone==='platform'&&p.x>5);
 const walker={...spot,id:1,kind:'human',attackCd:0,hurt:0},worker={...spot,x:1,id:2,kind:'human',stationary:true,tutorialWorker:true,attackCd:0,hurt:0};
 const enemy={...spot,id:3,kind:'guard',attackCd:9,hurt:0};const units=[walker,worker,enemy];
 const ctx=vm.createContext({aiStart:0,ENEMIES:rules.ENEMIES,units,player:{x:5,z:8},TUNE:{activity:{shambleSpeed:1}},visuals:new Map(),world:{multilevel:true,waypoint:nav.waypoint,populationTarget:pop.wander},
  isMechanical:()=>false,distance:(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),move:(u,x,z)=>{u.x+=x;u.z+=z;return true;},civilianMoveTarget:pop.wander});
 vm.runInContext(source.slice(source.indexOf('const CROWD_CELL='),source.indexOf('function civilianMoveTarget'))+source.slice(source.indexOf('function runAI('),source.indexOf('function dropActorVisual')),ctx);
 const start={...walker};for(let i=0;i<60;i++)vm.runInContext('runAI(1/60,true)',ctx);
 assert.ok(Math.hypot(walker.x-start.x,walker.z-start.z)>.2);assert.equal(walker.floorY,-3.85);
 assert.equal(worker.x,1);assert.ok(Math.hypot(enemy.x-spot.x,enemy.z-spot.z)>.2,'patrols move peacefully too');
 assert.match(source,/if\(!frozen\)runAI\(dt,teaching\)/);
});

test('navigation budget rotates fairly across the whole crowd instead of freezing later actors',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');let budget=0;
 const units=Array.from({length:36},(_,id)=>({id,kind:'human',x:id*1.2,z:0,floorY:0,attackCd:0,hurt:0}));
 const ctx=vm.createContext({aiStart:0,units,player:{x:0,z:0},ENEMIES:rules.ENEMIES,TUNE:{activity:{shambleSpeed:1}},visuals:new Map(),
  world:{multilevel:true,beginNavigationFrame(){budget=2;},waypoint(u,x,z){return budget-->0?{x,z}:u;}},
  isMechanical:()=>false,distance:(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),move:(u,x,z)=>{u.x+=x;u.z+=z;return true;},civilianMoveTarget:u=>({x:u.x,z:5,floorY:0})});
 vm.runInContext(source.slice(source.indexOf('const CROWD_CELL='),source.indexOf('function civilianMoveTarget'))+source.slice(source.indexOf('function runAI('),source.indexOf('function dropActorVisual')),ctx);
 for(let i=0;i<108;i++)vm.runInContext('runAI(.04,true)',ctx);
 assert.ok(units.every(u=>u.z>.03),'each actor must receive navigation time, including the end of the list');
});
