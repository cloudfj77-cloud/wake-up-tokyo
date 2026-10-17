import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createFeedbackVisibility} from './feedback-visibility.js';
const point=(x,y=1,z=0)=>new T.Vector3(x,y,z);
function fixture(material=new T.MeshBasicMaterial()){
 const root=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(1,2,3),material);mesh.position.set(0,1,0);root.add(mesh);root.updateMatrixWorld(true);
 const owner={g:mesh,dead:false,holes:[]},v=createFeedbackVisibility({root,destructibles:[owner]});return {root,mesh,owner,v};
}
test('buildings and cars hide feedback behind them; visible and elevated targets remain',()=>{
 const {v}=fixture();assert.equal(v.visible(point(-3),point(3),{}),false);
 assert.equal(v.visible(point(-3),point(-1),{}),true);
 assert.equal(v.visible(point(-3,3),point(3,3),{}),true);
 assert.equal(v.visible(point(-3,1,4),point(3,1,4),{}),true);
});
test('invisible or destroyed scenery and transparent effects do not hide feedback',()=>{
 const {v,mesh,owner}=fixture();owner.dead=true;assert.equal(v.visible(point(-3),point(3),{}),true);
 owner.dead=false;mesh.visible=false;assert.equal(v.visible(point(-3),point(3),{}),true);
 const translucent=fixture(new T.MeshBasicMaterial({transparent:true,opacity:.2}));assert.equal(translucent.v.visible(point(-3),point(3),{}),true);
});
test('shader-carved holes and parent visibility follow the displayed scene',()=>{
 const {v,owner,root}=fixture();owner.holes=[point(-.5),point(.5)];assert.equal(v.visible(point(-3),point(3),{}),true);
 owner.holes=[];root.visible=false;assert.equal(v.visible(point(-3),point(3),{}),true);
});
test('visibility checks are bounded and deferred units get checked on the next frame',()=>{
 const {v}=fixture(),anchors=Array.from({length:7},()=>({}));
 for(let i=0;i<6;i++)assert.equal(v.visible(point(-3),point(-1),anchors[i]),true);
 assert.equal(v.visible(point(-3),point(-1),anchors[6]),false);
 v.beginFrame();assert.equal(v.visible(point(-3),point(-1),anchors[6]),true);
});
