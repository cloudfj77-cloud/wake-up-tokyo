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
test('routes go around the clock tower between the two halves',()=>{
 const u=nav.nearest(0,-12,.45),goal=nav.nearest(0,12,.45);
 assert.equal(nav.clear(u,goal),false);
 for(let i=0;i<2000&&Math.hypot(u.x-goal.x,u.z-goal.z)>.8;i++){
  const p=nav.waypoint(u,goal.x,goal.z),d=Math.hypot(p.x-u.x,p.z-u.z);
  assert.ok(d>.01,'navigation did not find a next step');
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
