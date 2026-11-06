import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {createInjectionJet} from './injection-jet.js';
test('infection jet exposes a purple exhaust and bright core with shared bounded resources',()=>{
 const a=createInjectionJet(1,2,3),b=createInjectionJet(4,5,6);assert.equal(a.children.length,2);assert.equal(a.children[0].geometry,b.children[0].geometry);assert.equal(a.children[1].material,b.children[1].material);
 assert.deepEqual(a.position.toArray(),[1,2,3]);assert.ok(a.children[0].material.color.b>a.children[0].material.color.g);assert.equal(a.children[0].material.depthWrite,false);
 const box=new T.Box3().setFromObject(a);assert.ok(box.getSize(new T.Vector3()).z>1);a.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(1,1,1).normalize());assert.ok(a.quaternion.toArray().every(Number.isFinite));
});
