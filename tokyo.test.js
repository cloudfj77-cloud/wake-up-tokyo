import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as rules from './rules.js';
import * as T from 'three';
import {createTokyoNavigation} from './tokyo/navigation.js';
import {selectedMap} from './maps.js';
import {OutlineFilter} from './outline-filter.js';
import {batchStaticScene} from './tokyo/render-batches.js';
import {createRenderBudget} from './runtime-performance.js';
import {TOKYO_FOG,TOKYO_LOOK,createTokyoPopulation,populationZone,populationSector,advanceTutorial,tutorialActive,tutorialTarget,tokyoObjective} from './tokyo/gameplay.js';
const data=JSON.parse(readFileSync(new URL('./assets/scenes/tokyo-navigation.json',import.meta.url))),nav=createTokyoNavigation(data);
const sha=s=>createHash('sha256').update(s).digest('hex');
test('static normal batches preserve every transform, merge different materials and restore color-pass visibility',()=>{
 const root=new T.Group(),section=new T.Group();root.add(section);section.position.set(2,3,4);const geometry=new T.BoxGeometry(1,2,1),meshes=[];
 for(let i=0;i<3;i++){const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:i+1}));mesh.position.set(i*2,0,-i);section.add(mesh);meshes.push(mesh);}
 root.updateMatrixWorld(true);const expected=meshes.map(m=>m.matrix.clone()),batches=batchStaticScene(root),normal=section.getObjectByName('Static_Normal_Pass');
 assert.equal(normal.children.length,1,'normal rendering must not retain one draw group per color material');
 const batch=normal.children[0];assert.equal(batch.instanceCount,meshes.length);
 for(let i=0;i<meshes.length;i++)assert.ok(batch.getMatrixAt(i,new T.Matrix4()).elements.every((value,j)=>Math.abs(value-expected[i].elements[j])<1e-6));
 assert.equal(normal.visible,false);batches.normalPass.begin();assert.equal(normal.visible,true);assert.ok(meshes.every(m=>!m.visible));
 batches.normalPass.end();assert.equal(normal.visible,false);assert.ok(meshes.every(m=>m.visible));
 batches.updateDetailVisibility(new T.Vector3(1000,1000,1000));for(let i=0;i<3;i++)assert.equal(batch.getVisibleAt(i),false);
});
test('60 FPS render budget adapts during sustained very slow combat frames without reacting to a tab stall',()=>{
 const budget=createRenderBudget(1.5,.85),changes=[];
 for(let i=0;i<150;i++){const ratio=budget.sample(120);if(ratio!=null)changes.push(ratio);}
 assert.deepEqual(changes,[1.25,1,.85]);
 for(let i=0;i<5;i++)assert.equal(budget.sample(1000),null);
 const moderate=createRenderBudget(1.25,.85),smaller=[];for(let i=0;i<350;i++){const r=moderate.sample(21);if(r!=null)smaller.push(r);}
 assert.ok(smaller.length>0,'a persistent 48 FPS must still adapt toward the 60 FPS target');
 const busy=createRenderBudget(1.5,.85);for(let i=0;i<400;i++)busy.sample(30,25);const floor=[];for(let i=0;i<1800;i++){const r=busy.sample(16.67,15);if(r!=null)floor.push(r);}assert.equal(floor.length,0,'60 FPS without spare drawing time must not raise resolution and cause another slowdown');
});
test('render budget reacts to sustained slow frames, keeps native resolution and ignores startup or tab stalls',()=>{
 const budget=createRenderBudget(1.5),changes=[];
 for(let i=0;i<50;i++)assert.equal(budget.sample(1000),null);
 for(let i=0;i<80;i++)assert.equal(budget.sample(33),null);
 for(let i=0;i<240;i++){const ratio=budget.sample(33);if(ratio!=null)changes.push(ratio);}
 assert.deepEqual(changes,[1.25,1]);
 for(let i=0;i<1400;i++){const ratio=budget.sample(16.67);if(ratio!=null)changes.push(ratio);}
 assert.equal(changes.at(-1),1.125,'quality only recovers after a long smooth interval');
 const native=createRenderBudget(1);for(let i=0;i<400;i++)assert.equal(native.sample(40),null);
});
test('normal rendering reuses color-pass shadows and transforms, restoring state even after a failed pass',()=>{
 for(const fail of [false,true]){
  const transparent={isSprite:true,visible:true},original=new T.MeshStandardMaterial(),opaque=new T.Mesh(new T.BoxGeometry(),[original,original]),scene={matrixWorldAutoUpdate:true,background:'original',overrideMaterial:null,traverse(fn){fn(transparent);fn(opaque);}};
  let renders=0,shadows=0,transforms=0;
  const renderer={shadowMap:{autoUpdate:true,needsUpdate:true},getContext:()=>({}),getDrawingBufferSize:v=>v.set(1280,720),setRenderTarget(){},render(s){renders++;if(this.shadowMap.autoUpdate||this.shadowMap.needsUpdate)shadows++;if(s.matrixWorldAutoUpdate)transforms++;if(renders===2){assert.equal(transparent.visible,false);if(fail)throw Error('normal pass failed');}}};
  const filter=new OutlineFilter(renderer);filter.resize=()=>{};filter.color={texture:{}};filter.normal={};
  if(fail)assert.throws(()=>filter.render(scene,{}),/normal pass failed/);else assert.equal(filter.render(scene,{}),filter.color.texture);
  assert.equal(renders,2);assert.equal(shadows,1);assert.equal(transforms,1);
  assert.deepEqual(renderer.shadowMap,{autoUpdate:true,needsUpdate:true});assert.equal(scene.matrixWorldAutoUpdate,true);assert.equal(scene.overrideMaterial,null);assert.equal(scene.background,'original');assert.equal(transparent.visible,true);assert.deepEqual(opaque.material,[original,original]);
 }
});

test('static glass keeps transparent sorting and stays out of normal batches',()=>{
 const root=new T.Group(),section=new T.Group();root.add(section);const geometry=new T.PlaneGeometry(1,2),material=new T.MeshStandardMaterial({transparent:true,opacity:.25,side:T.DoubleSide});for(let i=0;i<20;i++){const mesh=new T.Mesh(geometry,material);mesh.position.z=-i;section.add(mesh);}const result=batchStaticScene(root),batch=section.getObjectByName('Static_Material_Batch');assert.ok(batch.isBatchedMesh);assert.equal(batch.sortObjects,true);assert.equal(batch.material,material);assert.equal(result.sourceCount,20);assert.equal(section.getObjectByName('Static_Normal_Pass').children.length,0);result.normalPass.begin();assert.equal(batch.visible,false);result.normalPass.end();assert.equal(batch.visible,true);
});

test('opaque street visibility reuses draw lists and retains off-camera shadow casters',()=>{
 const root=new T.Group(),section=new T.Group();root.add(section);const geometry=new T.BoxGeometry(),material=new T.MeshStandardMaterial();for(const x of [1,2,100,101,-100,-101]){const m=new T.Mesh(geometry,material);m.position.set(x,0,-10);section.add(m);}const result=batchStaticScene(root),normals=section.getObjectByName('Static_Normal_Pass').children;assert.equal(normals.length,1);const b=normals[0];assert.equal(b.instanceCount,6);assert.equal(b.perObjectFrustumCulled,false);assert.equal(b.sortObjects,false);
 const camera=new T.PerspectiveCamera();camera.updateMatrixWorld(true);result.updateVisibility(camera);const visible=Array.from({length:6},(_,i)=>b.getVisibleAt(i));assert.deepEqual(visible,[true,true,false,false,false,false]);b.onBeforeRender({},null,camera,b.geometry,b.material);const version=b._indirectTexture.version;result.updateVisibility(camera);b.onBeforeRender({},null,camera,b.geometry,b.material);assert.equal(b._indirectTexture.version,version,'unchanged static commands must be reused');
 b.onBeforeShadow({},null,camera,camera,b.geometry,b.material);assert.ok(Array.from({length:6},(_,i)=>b.getVisibleAt(i)).every(Boolean));b.onAfterShadow({},null,camera,camera,b.geometry,b.material);assert.deepEqual(Array.from({length:6},(_,i)=>b.getVisibleAt(i)),visible);
 camera.position.x=100;camera.updateMatrixWorld(true);result.updateVisibility(camera);assert.equal(b.getVisibleAt(2),true);assert.equal(b.getVisibleAt(0),false);
});
test('Wake Up shaders, lights and passes remain unchanged; only Tokyo fog and approved color profile are adjusted',()=>{
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
 assert.equal(selectedMap('').saveKey,'wake-up-tokyo-tidewater-v1');
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

test('initial and replenished populations cover public streets and underground floors without overlaps',()=>{
 const pop=createTokyoPopulation(nav),units=[];
 assert.deepEqual(new Set(pop.spots.map(p=>p.zone)),new Set(['plaza','hall','platform','street','skybridge','viaduct']));
 for(let cycle=0;cycle<4;cycle++){
  for(let region=0;region<4;region++)for(let i=0;i<14;i++){
   const p=pop.spawn({region,units,player:{x:5,z:8},random:()=>((i*13+cycle*7)%57)/57});
   assert.ok(p);assert.ok(populationZone(p));assert.ok(p.floorY<3.7);
   assert.equal((p.x>=0?1:0)+(p.z>=0?2:0),region);
   assert.ok(units.every(u=>Math.abs(u.floorY-p.floorY)>1||Math.hypot(u.x-p.x,u.z-p.z)>=1.15));
   units.push(p);
  }units.length=0;
 }
 for(const zone of ['plaza','hall','platform','street']){
  const u={...pop.spots.find(p=>p.zone===zone)};
  for(let i=0;i<15;i++){const p=pop.wander(u);assert.equal(populationZone(p),zone);Object.assign(u,p);}
 }
 assert.equal(pop.spawn({accept:()=>false}),null,'never ignores spawn acceptance or uses roofs');
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
test('legacy saves retain progression and valid street populations',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),saved={version:11,state:rules.makeState(),player:{x:40,z:20,floorY:3.3,y:0},units:[rules.makeUnit(1,0,40,20,true),rules.makeUnit(2,1,42,20)] ,objects:[]};
 saved.units[1].converted=true;saved.units.forEach(u=>u.floorY=3.3);saved.state.infected=9;
 const pop=createTokyoPopulation(nav),ctx=vm.createContext({...rules,T,surfacePaint:{restore(){}},populationZone,saved,world:{tutorial:{},populationSpot:pop.spawn,nearest:nav.nearest},sprayMarkers:new Map(),chargeMarkers:new Map(),visuals:new Map(),spawnQueue:{jobs:[]},recentSpawnPoints:[]});
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
 const testNav=createTokyoNavigation(data),pop=createTokyoPopulation(testNav),spot=pop.spots.find(p=>p.zone==='platform'&&p.x>5),wander=u=>pop.wander(u,{random:()=>.5});
 const walker={...spot,id:1,kind:'human',attackCd:0,hurt:0},worker={...spot,x:1,id:2,kind:'human',stationary:true,tutorialWorker:true,attackCd:0,hurt:0};
 const enemy={...spot,id:3,kind:'guard',attackCd:9,hurt:0};const units=[walker,worker,enemy];
 // 使用独立导航预算和固定目的地种子，避免上一个用例的预算、随机短路线影响本用例。
 const ctx=vm.createContext({aiStart:0,ENEMIES:rules.ENEMIES,units,player:{x:5,z:8},TUNE:{activity:{shambleSpeed:1}},visuals:new Map(),world:{multilevel:true,waypoint:testNav.waypoint,beginNavigationFrame:testNav.beginNavigationFrame,populationTarget:wander},
  isMechanical:()=>false,distance:(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),move:(u,x,z)=>{u.x+=x;u.z+=z;return true;},civilianMoveTarget:wander});
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

test('converted actors keep their own target selection, chase speed and attack during the tutorial',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),ally=rules.makeUnit(99,0,0,8,false);
 Object.assign(ally,{kind:'ally',converted:true,floorY:-3.85});
 const near=rules.makeUnit(10,1,8,8),far=rules.makeUnit(11,1,15,8);near.floorY=far.floorY=-3.85;
 const attacks=[],targets=[],ctx=vm.createContext({...rules,ALLY_VIEW:22,units:[ally,near,far],player:{x:-12,z:8,floorY:-3.85},boss:{active:false},state:{hp:100,maxHp:100},squadIds:new Set(),visuals:new Map(),
  world:{multilevel:true,towers:[],clear:()=>true,populationTarget:u=>u,waypoint(u,x,z,floorY){if(u===ally)targets.push({x,z,floorY});return {x,z,floorY};}},
  move:(u,x,z)=>{u.x+=x;u.z+=z;return true;},tickPurifier:()=>null,showHostilePose(){},allyFire:(u,spec,victim)=>attacks.push(victim.id)});
 vm.runInContext(source.slice(source.indexOf('const CROWD_CELL='),source.indexOf('function dropActorVisual(')),ctx);
 vm.runInContext('runAI(.05,true)',ctx);
 assert.equal(targets[0].x,near.x,'nearest valid hostile must win over the player position');
 assert.ok(Math.abs(ally.x-rules.TUNE.activity.chaseSpeed*.05)<.001,'configured chase speed must be preserved');
 for(let i=0;i<120&&!attacks.length;i++)vm.runInContext('runAI(.05,true)',ctx);
 assert.equal(attacks[0],near.id,'tutorial must not suppress the converted actor attack state machine');
 assert.ok(ally.x>0,'ordinary infected actor must not follow the player behind it');
});

test('conversion clears civilian stationary flags and stale wander destinations',()=>{
 const state=rules.makeState(),u=rules.makeUnit(1,0,5,8);
 u.stationary=true;u.tokyoDestination={x:5,z:8,floorY:-3.85};u.roamFloor=0;u.roamStillTime=3;
 assert.equal(rules.convert(state,u),true);assert.equal(u.stationary,false);assert.equal(u.tokyoDestination,undefined);
 assert.equal(u.wander,0);assert.equal(u.roamFloor,undefined);assert.equal(u.roamStillTime,0);
});

test('awakened wander ignores old civilian zones and stationary records',()=>{
 const pop=createTokyoPopulation(nav);
 for(const p of [{x:5,z:8,floorY:-3.85},{x:-19.4,z:-8.4,floorY:0},{x:-7.15,z:9.35,floorY:-1.65}]){
  const u={...p,kind:'ally',converted:true,stationary:true,tokyoDestination:{x:p.x,z:p.z,floorY:p.floorY}};
  const goal=pop.wander(u,{radius:34,random:()=>.37});
  assert.equal(u.stationary,false);assert.ok(Math.hypot(goal.x-u.x,goal.z-u.z)>1,'must find a destination even outside the old civilian zone');
  assert.equal(goal.freeRoam,true);assert.ok(populationZone(goal));
 }
});

test('idle roam replaces a blocked destination instead of waiting forever',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),u=rules.makeUnit(99,0,0,0,false);
 u.converted=true;u.kind='ally';let picks=0;
 const ctx=vm.createContext({...rules,ALLY_VIEW:22,units:[u],player:{x:-10,z:0},boss:{active:false},state:{hp:100,maxHp:100},squadIds:new Set(),visuals:new Map(),
  world:{multilevel:true,towers:[],populationTarget(u){if(!u.tokyoDestination)u.tokyoDestination={x:4+(picks++%3),z:0,floorY:0,freeRoam:true};return u.tokyoDestination;},waypoint:u=>u}});
 vm.runInContext(source.slice(source.indexOf('const CROWD_CELL='),source.indexOf('function dropActorVisual(')),ctx);
 for(let i=0;i<70;i++)vm.runInContext('runAI(.05)',ctx);
 assert.ok(picks>=2,'blocked wander destination must be abandoned and replaced');
});

test('idle roam keeps its speed while routes warm up and crosses short waypoints in the same frame',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 for(const pending of [true,false]){
  const u={id:99,x:0,z:0,floorY:0,facingYaw:0};
  const ctx=vm.createContext({world:{waypoint:u=>pending?u:{x:u.x,z:u.z+.03},canMove:(u,x,z)=>x>=-.2&&x<=.2},
   move(u,x,z){u.x+=x;u.z+=z;return true;}});
  vm.runInContext(source.slice(source.indexOf('function moveAwakeTravel('),source.indexOf('function attackHasLine(')),ctx);
  ctx.u=u;
  // 每帧都检查真实位移，不能仅凭最终走远了判断连续运动。
  for(let i=0;i<60;i++){
   const z=u.z;assert.equal(vm.runInContext('moveAwakeTravel(u,{x:0,z:30,floorY:0},3.8,.04)',ctx),true);
   assert.ok(Math.abs(u.z-z-3.8*.04)<.00001,'route preparation or a short waypoint must not insert an idle frame');
  }
 }
});

test('continuous roam turns away from real walls while waiting for navigation',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),u={id:99,x:0,z:0,floorY:0,facingYaw:0};
 const canMove=(u,x,z)=>Math.abs(x)<2&&z<=.1;
 const ctx=vm.createContext({u,world:{waypoint:u=>u,canMove},move(u,x,z){assert.ok(canMove(u,u.x+x,u.z+z),'cannot cross the wall to keep moving');u.x+=x;u.z+=z;return true;}});
 vm.runInContext(source.slice(source.indexOf('function moveAwakeTravel('),source.indexOf('function attackHasLine(')),ctx);
 assert.equal(vm.runInContext('moveAwakeTravel(u,{x:0,z:10,floorY:0},3.8,.04)',ctx),true);
 assert.ok(Math.abs(u.x)>.1,'must turn into open space instead of waiting against the wall');assert.ok(u.z<=.1);
});

test('a blocked pursuit waypoint leaves movement time available for a safe turn',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8'),u={id:99,x:0,z:0,floorY:0,facingYaw:0};
 const ctx=vm.createContext({u,world:{waypoint:()=>({x:0,z:5}),canMove:(u,x,z)=>z<=.01},
  move(u,x,z){if(z>0)return false;u.x+=x;u.z+=z;return Math.hypot(x,z)>.001;}});
 vm.runInContext(source.slice(source.indexOf('function moveAwakeTravel('),source.indexOf('function attackHasLine(')),ctx);
 assert.equal(vm.runInContext('moveAwakeTravel(u,{x:0,z:5,floorY:0},3.6,.04)',ctx),true);
 assert.ok(Math.hypot(u.x,u.z)>.14,'a blocked step must not consume the frame without moving');
});

test('all four outer roads receive both civilians and patrols at normal population quotas',()=>{
 const pop=createTokyoPopulation(nav),units=[];let seed=17;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let region=0;region<4;region++)for(const [type,count]of [[0,rules.TUNE.difficulty.civiliansPerRegion],[1,rules.TUNE.difficulty.patrolsPerRegion]])for(let i=0;i<count;i++){
  const p=pop.spawn({region,type,units,player:{x:5,z:8,floorY:-3.85},random});assert.ok(p);units.push({...p,type});
 }
 for(const side of ['north','south','east','west'])for(const type of [0,1])assert.ok(units.some(u=>u.type===type&&populationSector(u)==='street-'+side),`missing ${type} at ${side}`);
 assert.ok(units.some(u=>u.zone==='plaza'));assert.ok(units.some(u=>u.zone==='platform'));
 assert.ok(units.every(p=>p.floorY<3.7),'ordinary population stays on streets and underground; upper decks refill only when explored');
});
test('street reinforcements appear near the player on their deck instead of in the underground plaza',()=>{
 const pop=createTokyoPopulation(nav);
 for(const [x,z]of [[-50,-30],[68,25],[20,-50],[25,45]]){
  const player=nav.nearest(x,z,.65,3.3),p=pop.spawn({type:2,nearPlayer:true,player,random:()=>.23});assert.ok(p);
  assert.ok(Math.hypot(p.x-player.x,p.z-player.z)>=8&&Math.hypot(p.x-player.x,p.z-player.z)<=34);assert.ok(Math.abs(p.floorY-player.floorY)<.5);
 }
 const player=nav.nearest(5,8,.65,-3.85),p=pop.spawn({type:1,nearPlayer:true,player,random:()=>.23});assert.ok(p);assert.ok(Math.abs(p.floorY-player.floorY)<.5,'rushing soldiers can spawn on the platform too');
});
test('unrelated frame work cannot expire navigation before the first actor query',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const local=createTokyoNavigation({bounds:{minX:0,maxX:4,minZ:0,maxZ:1},step:1,width:4,depth:1,nodes:[[0,0,0,[1]],[1,0,0,[0,2]],[2,0,0,[1,3]],[3,0,0,[2]]]});
 local.beginNavigationFrame();now+=12;
 const p=local.waypoint({x:.5,z:.5,floorY:0},2.5,.5,0);assert.ok(p.x>.5,'actor froze because collision/animation work used the wall-clock deadline');
});
test('a cached ground-floor destination is not reused for an overlapping upper-floor target',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const local=createTokyoNavigation({bounds:{minX:0,maxX:4,minZ:0,maxZ:1},step:1,width:4,depth:1,nodes:[[0,0,0,[1]],[1,0,0,[0]],[1,0,3,[]]]}),u={x:.5,z:.5,floorY:0};
 local.beginNavigationFrame();assert.ok(local.waypoint(u,1.5,.5,0).x>.5);
 assert.equal(local.waypoint(u,1.5,.5,3).x,.5,'different deck must not reuse a straight ground-floor route');
});
test('busy-frame enemies can climb from the platform and navigate to an outer street',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);const local=createTokyoNavigation(data),u=local.nearest(5,8,.2,-3.85),goal=local.nearest(40,25,.2,3.3);
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const ctx=vm.createContext({world:{...local,multilevel:true},STUCK_LIMIT:Infinity,frameDelta:1/60,u});
 vm.runInContext(source.slice(source.indexOf('function move(u,'),source.indexOf('function forward()')),ctx);
 let distance=Infinity;
 for(let i=0;i<6000;i++){
  now+=16;local.beginNavigationFrame();now+=8;const p=local.waypoint(u,goal.x,goal.z,goal.floorY),d=Math.hypot(p.x-u.x,p.z-u.z);
  if(d>.001){const step=Math.min(.12,d);ctx.dx=(p.x-u.x)/d*step;ctx.dz=(p.z-u.z)/d*step;vm.runInContext('move(u,dx,dz,true)',ctx);}
  distance=Math.hypot(u.x-goal.x,u.z-goal.z);if(distance<.4&&Math.abs(u.floorY-goal.floorY)<.3)break;
 }
 assert.ok(distance<.4&&Math.abs(u.floorY-goal.floorY)<.3,`stalled ${distance} m away on ${u.floorY}`);
});

test('outer-road patrols persist when far away while rush troops still recycle',()=>{
 const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const patrol=rules.makeUnit(1,1,75,40,true),rusher=rules.makeUnit(2,1,70,40,false),civilian=rules.makeUnit(3,0,72,42,true);patrol.rush=false;rusher.rush=true;
 const ctx=vm.createContext({...rules,world:{multilevel:true},units:[patrol,rusher,civilian],player:{x:-50,z:-30},releaseActor(){}});
 vm.runInContext(source.slice(source.indexOf('function cullFarTroops(){'),source.indexOf('function rememberSpawn('))+'cullFarTroops();',ctx);
 assert.deepEqual(ctx.units.map(u=>u.id),[1,3]);
});

test('moving targets within the same reachable area reuse navigation fields',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);const local=createTokyoNavigation(data),u=local.nearest(5,8,.2,-3.85);
 for(let i=0;i<20;i++){now+=16;local.beginNavigationFrame();const p=local.nearest(39+(i%4)*.3,25,.2,3.3);local.waypoint(u,p.x,p.z,p.floorY);}
 assert.ok(local.navigationStats().fields<5,'small target movement should not fill all 12 map-wide fields');
});

test('patrols chasing across region boundaries do not create endless replacement patrols',()=>{
 const state=rules.makeState(),units=[];
 for(let region=0;region<4;region++)for(const [type,count]of [[0,rules.TUNE.difficulty.civiliansPerRegion],[1,rules.TUNE.difficulty.patrolsPerRegion]])for(let i=0;i<count;i++){
  const u=rules.makeUnit(units.length,type,10,10,true);u.populationRegion=region;units.push(u);
 }
 const plan=rules.spawnPlan(state,units,()=>.5,{x:10,z:10},{includeThreat:false});assert.equal(plan.jobs.length,0);
});
test('recycled actor records drop old floor destinations and population bookkeeping',()=>{
 const u=rules.makeUnit(1,1,-40,-40,true);u.populationRegion=0;u.tokyoDestination={x:-45,z:-40,floorY:3.3};u.tutorialWorker=true;
 rules.resetUnit(u,2,0,65,45,true);assert.equal(u.populationRegion,undefined);assert.equal(u.tokyoDestination,undefined);assert.equal(u.tutorialWorker,undefined);
});
