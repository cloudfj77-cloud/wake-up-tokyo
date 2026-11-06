import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {WalkCollision} from './tokyo/collision.js';import {createSurfacePaint} from './surface-paint.js';
function setup(){const scene=new T.Scene(),root=new T.Group();scene.add(root);const floor=new T.Mesh(new T.BoxGeometry(8,.2,8));floor.position.y=-.1;root.add(floor);const wall=new T.Mesh(new T.BoxGeometry(.2,4,6));wall.position.set(2,2,0);root.add(wall);root.updateMatrixWorld(true);const index=new WalkCollision(root),paint=createSurfacePaint(scene,(...args)=>index.raycast(...args));return{scene,paint};}
test('purple juice stays on real ground and walls, survives time, and keeps repeat shots coalesced',()=>{
 const {paint}=setup();assert.ok(paint.splash(new T.Vector3(0,.04,0),new T.Vector3(0,-1,0)));assert.ok(paint.splash(new T.Vector3(1.87,2,0),new T.Vector3(1,0,0)));const before=paint.snapshot();assert.equal(before.marks,2);paint.update(10);const after=paint.snapshot();assert.ok(after.marks>before.marks,'wall juice must flow downward');assert.equal(after.flowing,0);
 for(let i=0;i<100;i++)paint.splash(new T.Vector3(0,.04,0),new T.Vector3(0,-1,0));assert.deepEqual(paint.snapshot(),after);paint.update(10000);assert.deepEqual(paint.snapshot(),after);assert.ok(after.batches<=2);
 const b=new T.Box3().setFromObject(paint.root);assert.ok(b.min.y>-.01);assert.ok(b.max.x<1.91,'decal must not paint the back side of a wall');paint.dispose();assert.equal(paint.root.parent,null);assert.equal(paint.snapshot().marks,0);
});
test('missed shots over empty space leave no floating paint',()=>{const scene=new T.Scene(),paint=createSurfacePaint(scene,()=>null);assert.equal(paint.splash(new T.Vector3(),new T.Vector3(1,0,0)),false);assert.equal(paint.snapshot().marks,0);paint.dispose();});

test('paint restores with the run and upward misses still puddle on the floor',()=>{
 const a=setup();assert.ok(a.paint.splash(new T.Vector3(0,1,0),new T.Vector3(0,1,0)));a.paint.splash(new T.Vector3(1.87,2,0),new T.Vector3(1,0,0));a.paint.update(1);const saved=a.paint.serialize(),b=setup();b.paint.restore(saved);assert.equal(b.paint.snapshot().marks,a.paint.snapshot().marks);assert.ok(b.paint.snapshot().vertices>0);
 b.paint.restore([[Infinity,0,0,0,1,0,1,1],[1e100,0,0,0,1,0,1,1]]);assert.equal(b.paint.snapshot().marks,0);a.paint.dispose();b.paint.dispose();
});
