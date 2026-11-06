import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createMetroTrains,inMetroArea} from './tokyo/metro-trains.js';
import {loadTokyoCollisionScene} from './scripts/tokyo/load-collision-scene.mjs';

test('metro area includes the underground platform and stairs, but stops at the plaza exit',()=>{
 assert.equal(inMetroArea({x:5,z:8,floorY:-3.85}),true);assert.equal(inMetroArea({x:-7,z:9.35,floorY:-1.65}),true);assert.equal(inMetroArea({x:-2.75,z:4.95,floorY:0}),false);assert.equal(inMetroArea({x:5,z:8,floorY:3.3}),false);assert.equal(inMetroArea({x:-8,z:-28,floorY:0}),true);
});

test('the real imported trains move as two batches, leaving the station and platform geometry in place',async()=>{
 const root=await loadTokyoCollisionScene(),scene=new T.Scene();scene.add(root);const before=root.getObjectByName('10_Platform_Refinement'),train=createMetroTrains(root,scene);
 assert.equal(train.snapshot().trains.length,2);assert.ok(train.snapshot().sourceMeshes>=50);assert.ok(train.snapshot().drawMeshes<=16);
 assert.ok(root.getObjectByName('10_Platform_Refinement')===before);
 const still=train.snapshot();train.update(0);assert.deepEqual(train.snapshot(),still);train.update(2);assert.notDeepEqual(train.snapshot().trains,still.trains);
 assert.equal(train.trackBlocked(5,8,.2,-3.85),false);assert.equal(train.trackBlocked(5,5.225,.2,-3.85),true);assert.equal(train.trackBlocked(5,5.225,.2,0),false);
 const moving=train.snapshot();train.update(1);assert.ok(Math.abs(train.snapshot().trains[0].x-moving.trains[0].x-7.2)<1e-8);assert.ok(Math.abs(train.snapshot().trains[1].x-moving.trains[1].x+7.2)<1e-8);
 const beforeExit=train.snapshot();train.update(50,false);assert.equal(train.snapshot().time,beforeExit.time);assert.ok(train.snapshot().trains.every(t=>!t.visible));train.update(.1,true);assert.ok(train.snapshot().trains.every(t=>t.visible&&t.segments.length>5));
 for(let i=0;i<100;i++){train.update(.17);for(const t of train.snapshot().trains){assert.equal(t.visible,true);assert.ok(t.segments.some(s=>s.min<5.25&&s.max>4.75),'both tracks must keep carriages beside the platform');}}
 assert.equal(train.solid(0,-3.4,5.225,.1),true);assert.ok(train.raycast(new T.Vector3(0,-3.4,8),new T.Vector3(0,0,-1),8));
});
