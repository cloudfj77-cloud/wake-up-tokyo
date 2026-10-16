import test from 'node:test';
import assert from 'node:assert/strict';
import {Level} from './vendor/inkwave/src/world/level.js';
import {PropKit} from './vendor/inkwave/src/world/props.js';
import {STAGES} from './vendor/inkwave/src/world/stages/index.js';
import {dressingFor} from './vendor/inkwave/src/world/dressing.js';
import {createTidewaterNavigation} from './tidewater-navigation.js';
import {selectedMap} from './maps.js';
const kit=new PropKit(null,{headless:true});
const cols=dressingFor('tidewater').filter(p=>p.onlyIn!=='zones').flatMap(p=>kit.add(p.type,p).colliders);
const L=STAGES.tidewater.LAYOUT;
const level=new Level({...L,single:L.single.filter(p=>p.onlyIn!=='zones'),half:L.half.filter(p=>p.onlyIn!=='zones')},cols);
const nav=createTidewaterNavigation(level);
test('existing save key survives and new map saves are isolated',()=>{
 assert.equal(selectedMap('').saveKey,'wake-up-tokyo-riverside-v4');
 assert.equal(selectedMap('?map=bad').id,'riverside');
 assert.notEqual(selectedMap('?map=tidewater').saveKey,selectedMap('').saveKey);
});
test('clock tower, sea and roof interiors are not walkable',()=>{
 assert.equal(nav.free(0,0),false);
 assert.equal(nav.free(-27,40),false);
 assert.equal(nav.free(100,0),false);
 assert.ok(nav.nodeCount>10000);
});
test('all gameplay placements have clearance on the connected plaza',()=>{
 for(const [x,z,r]of[[-8,-27,1.2],[9,24,3.5],[-10,-23,2],[12,-8,2],[-12,23,2],[-12,-32,1.5],[12,-26,1.5],[-12,26,1.5],[12,32,1.5]]){
  const p=nav.nearest(x,z,r);assert.ok(nav.free(p.x,p.z,r));assert.ok(nav.heightAt(p.x,p.z)>=-.3);
 }
});
test('routes go around the clock tower between the two halves',t=>{
 let now=0;t.mock.method(performance,'now',()=>now);
 const u=nav.nearest(0,-12,.45),goal=nav.nearest(0,12,.45);
 assert.equal(nav.clear(u,goal),false);
 for(let i=0;i<2000&&Math.hypot(u.x-goal.x,u.z-goal.z)>.8;i++){
  now+=16;nav.beginNavigationFrame();const p=nav.waypoint(u,goal.x,goal.z),d=Math.hypot(p.x-u.x,p.z-u.z);
  if(d<=.01)continue; // New fields may deliberately finish in a later frame.
  const x=u.x+(p.x-u.x)/d*Math.min(.12,d),z=u.z+(p.z-u.z)/d*Math.min(.12,d);
  assert.ok(nav.canMove(u,x,z),'route attempted to cross a wall/ledge');u.x=x;u.z=z;
 }
 assert.ok(Math.hypot(u.x-goal.x,u.z-goal.z)<.8,'route did not reach other side');
});
test('movement cannot climb a platform by crossing its sheer side',()=>{
 let checked=0;
 for(let x=-20;x<20;x+=.5)for(let z=-35;z<35;z+=.5){
  if(!nav.free(x,z,.1)||!nav.free(x+.5,z,.1))continue;
  if(Math.abs(nav.heightAt(x,z)-nav.heightAt(x+.5,z))>.4){assert.equal(nav.canMove({x,z},x+.5,z,.1),false);checked++;}
 }
 assert.ok(checked>0,'expected at least one real ledge');
});

test('stationary corner routing reuses the path until the recalculation interval',t=>{
 let now=0,queries=0;
 t.mock.method(performance,'now',()=>now);
 const original=level.queryBlocks.bind(level);
 t.mock.method(level,'queryBlocks',(...args)=>{queries++;return original(...args);});
 const u={x:-1,z:-26};nav.beginNavigationFrame();nav.waypoint(u,0,12);const first=queries;
 assert.ok(first>0);
 for(let i=0;i<100;i++){now=200;nav.waypoint(u,0,12);}
 assert.equal(queries,first,'a stuck actor must not repeat terrain queries every frame');
 now=300;nav.beginNavigationFrame();nav.waypoint(u,0,12);assert.ok(queries>first,'the route must still refresh after the wait');
});


test('many simultaneous routes share bounded frame work and pending flow fields',t=>{
 t.mock.method(performance,'now',()=>0);
 nav.beginNavigationFrame();
 for(let i=0;i<96;i++)nav.waypoint({x:-1,z:-26},(i%8-4)*2,12+Math.floor(i/8)*2);
 const stats=nav.navigationStats();assert.ok(stats.steps<=4096);assert.ok(stats.queries<=32);assert.ok(stats.pending<=8);assert.ok(stats.cached<=32);
 for(let frame=0;frame<80;frame++)nav.beginNavigationFrame();
 assert.equal(nav.navigationStats().pending,0,'background fields must finish instead of blocking actors forever');
});
