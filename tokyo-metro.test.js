import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createMetroTrains,metroCycle} from './tokyo/metro-trains.js';
import {loadTokyoCollisionScene} from './scripts/tokyo/load-collision-scene.mjs';

test('metro approach, dwell and departure are continuous, opposite and pause-safe',()=>{
 const sample=t=>metroCycle(t,0,1);
 assert.equal(sample(8).x,0);assert.equal(sample(11).x,0);assert.ok(sample(3).x<sample(4).x);assert.ok(sample(17).x>sample(16).x);
 assert.equal(metroCycle(3,0,-1).x,-sample(3).x);
 for(const t of [8,13,21])assert.ok(Math.abs(sample(t-.001).x-sample(t+.001).x)<.01);
 assert.equal(sample(0).visible,false);assert.equal(sample(22).visible,false);
});

test('the real imported trains move as two batches, leaving the station and platform geometry in place',async()=>{
 const root=await loadTokyoCollisionScene(),scene=new T.Scene();scene.add(root);const before=root.getObjectByName('10_Platform_Refinement'),train=createMetroTrains(root,scene);
 assert.equal(train.snapshot().trains.length,2);assert.ok(train.snapshot().sourceMeshes>=50);assert.ok(train.snapshot().drawMeshes<=16);
 assert.ok(root.getObjectByName('10_Platform_Refinement')===before);
 const still=train.snapshot();train.update(0);assert.deepEqual(train.snapshot(),still);train.update(2);assert.notDeepEqual(train.snapshot().trains,still.trains);
 assert.equal(train.trackBlocked(5,8,.2,-3.85),false);assert.equal(train.trackBlocked(5,5.225,.2,-3.85),true);assert.equal(train.trackBlocked(5,5.225,.2,0),false);
 train.update(6);const parked=train.snapshot().trains[0];assert.ok(Math.abs(parked.x)<.001);
 assert.equal(train.solid(0,-3.4,5.225,.1),true);assert.ok(train.raycast(new T.Vector3(0,-3.4,8),new T.Vector3(0,0,-1),8));
});
