import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {prepareCharacterAsset,acquireCharacterVisual,releaseCharacterVisual,clearCharacterPool,setCharacterKind} from './characters.js';

const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
const start=main.indexOf('const PROP_XFORM=');
const end=main.indexOf('function acquireUnitRecord(',start);
assert.ok(start>=0&&end>start);
const propCode=main.slice(start,end);

function fixture(){
 const scene=new T.Group();
 scene.add(new T.Mesh(new T.BoxGeometry(.5,1,.3),new T.MeshStandardMaterial()));
 for(const name of ['mixamorigLeftForeArm','mixamorigRightHand','forearmL','handR']){
  const parent=new T.Bone(),bone=new T.Bone();
  parent.position.y=.5;bone.name=name;bone.position.y=.1;parent.add(bone);scene.add(parent);
 }
 const asset=prepareCharacterAsset({scene,animations:[new T.AnimationClip('idle',1,[])]});
 const shield=new T.Group(),baton=new T.Group(),gun=new T.Group();
 shield.name='shield';baton.name='baton';gun.name='gun';
 const assets={infectedCop:asset,shieldCop:asset,batonCop:asset,gunCop:asset,guard:asset,props:{shield,baton,gun}};
 const visuals=new Map(),units=[];
 const ctx=vm.createContext({T,assets,visuals,units});
 vm.runInContext(propCode+'\nthis.attach=attachCopProp;this.refresh=refreshCopProps;',ctx);
 return {assets,visuals,units,attach:ctx.attach,refresh:ctx.refresh};
}
const propCount=v=>{let count=0;v.root.traverse(n=>{if(n.name==='shield'||n.name==='baton'||n.name==='gun')count++;});return count;};

test('recycled infected police take the current soldier weapon in both directions',()=>{
 const f=fixture();
 try{
  for(const [first,second] of [[3,1],[1,3]]){
   clearCharacterPool();
   const a=acquireCharacterVisual(f.assets,'infectedCop');
   setCharacterKind(a,'ally');f.attach(a,{type:first,kind:'ally',converted:true});
   const old=a.userData.propMesh;
   releaseCharacterVisual(a);
   const b=acquireCharacterVisual(f.assets,'infectedCop');
   setCharacterKind(b,'ally');f.attach(b,{type:second,kind:'ally',converted:true});
   assert.equal(b,a,'reuse the skeleton');
   assert.equal(b.userData.propMesh.name,second===3?'shield':'baton');
   assert.equal(old.parent,null,'remove the previous weapon');
   assert.equal(propCount(b),1,'attach only one weapon');
   releaseCharacterVisual(b);
  }
 }finally{clearCharacterPool();}
});

test('gun police carry the black gun on the borrowed shield model, guards do not',()=>{
 const f=fixture();
 try{
  for(const type of [2,6]){
   clearCharacterPool();
   const v=acquireCharacterVisual(f.assets,'gunCop');
   setCharacterKind(v,'enemy');f.attach(v,{type,kind:'enemy',converted:false});
   assert.equal(v.userData.propMesh?.name,'gun','type '+type+' 感染前也要拿枪');
   assert.equal(propCount(v),1);
   const enemyMesh=v.userData.propMesh;
   f.attach(v,{type,kind:'ally',converted:true});
   assert.equal(v.userData.propMesh?.name,'gun','转化后仍然拿枪');
   assert.equal(v.userData.propMesh,enemyMesh,'同兵种换阵营时复用同一把枪，不重建');
   assert.ok(enemyMesh.parent,'枪还挂在手上');
   assert.equal(propCount(v),1);
   releaseCharacterVisual(v);
  }
  const guard=acquireCharacterVisual(f.assets,'gunCop');
  setCharacterKind(guard,'ally');f.attach(guard,{type:2,kind:'ally',converted:true,guard:true});
  assert.equal(propCount(guard),0,'召唤的护卫不拿枪');
  releaseCharacterVisual(guard);
 }finally{clearCharacterPool();}
});

test('summoned guards and police with built-in weapons get no extra attachment',()=>{
 const f=fixture();
 for(const [kind,type] of [['shieldCop',3],['batonCop',1]]){
  const v=acquireCharacterVisual(f.assets,kind);setCharacterKind(v,'ally');
  for(const guard of [true,false]){
   f.attach(v,{type,kind:'ally',converted:true,guard});
   assert.equal(propCount(v),0,kind+' guard='+guard);
  }
 }
 const v=acquireCharacterVisual(f.assets,'infectedCop');setCharacterKind(v,'ally');
 f.attach(v,{type:3,kind:'ally',converted:true,guard:true});
 assert.equal(propCount(v),0);
});

test('refresh keeps one correct attachment, preserves tuning, and excludes guards',()=>{
 const f=fixture();
 for(const [id,kind,type,guard] of [[1,'infectedCop',1,false],[2,'infectedCop',3,false],[3,'shieldCop',3,true]]){
  const v=acquireCharacterVisual(f.assets,kind);setCharacterKind(v,'ally');
  const u={id,type,kind:'ally',converted:true,guard};
  f.units.push(u);f.visuals.set(id,{v});f.attach(v,u);
 }
 for(const u of f.units){
  const v=f.visuals.get(u.id).v,previous=v.userData?.propMesh;
  f.attach(v,u);assert.equal(v.userData?.propMesh,previous,'same attachment is reused');
 }
 f.refresh();f.refresh();
 for(const u of f.units){
  const v=f.visuals.get(u.id).v;
  assert.equal(propCount(v),u.guard?0:1);
  if(!u.guard){
   assert.equal(v.userData.propMesh.name,u.type===3?'shield':'baton');
   assert.equal(v.userData.propMesh.scale.x,u.type===3?.48:.45);
  }
 }
 const v=f.visuals.get(1).v,previous=v.userData.propMesh;
 f.attach(v,{type:1,kind:'enemy',converted:false});
 assert.equal(previous.parent,null);assert.equal(propCount(v),0,'clear stale props when no longer eligible');
});

test('prop tuning keeps the pointer free while normal play still captures it',()=>{
 const calls=[],window={};
 const ctx=vm.createContext({window,showDebug:false,pointerLock:{request:options=>calls.push(options)}});
 vm.runInContext(main.match(/function captureView\(\)\{[^\n]+/)[0],ctx);
 ctx.captureView();assert.equal(calls.length,1);
 window.__propUi=true;ctx.captureView();assert.equal(calls.length,1,'panel must keep its pointer');
 window.__propUi=false;ctx.captureView();assert.equal(calls.length,2,'normal play still captures');
 ctx.showDebug=true;ctx.captureView();assert.equal(calls.length,2);
});
