import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import * as T from 'three';import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {createSyringe,createSyringeGrip,syringeShotOrigin} from './syringe.js';
test('syringe rear grip stays inside the real animated palm while aiming, walking, recoiling, crouching and scaling',()=>{
 for(const file of ['toyAim.fbx','Strafing.fbx','toyRecoil.fbx','jump.fbx']){
  const b=readFileSync(new URL('./public/mixamo/'+file,import.meta.url)),root=new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  const model=new T.Group(),holder=new T.Group();model.add(root);holder.add(model);model.scale.setScalar(.85);
  const syringe=createSyringe(),update=createSyringeGrip({root,model,holder},syringe,.935),mixer=new T.AnimationMixer(root);mixer.clipAction(root.animations[0]).play();
  for(let i=0;i<12;i++){
   model.scale.set(.85*(i>5?1.35:1),i%2?.6:.85,.85);holder.position.set(i,2,-i);holder.rotation.y=i*.3;mixer.update(.08);update();
   const palm=root.getObjectByName('mixamorigRightHand').getWorldPosition(new T.Vector3()).lerp(root.getObjectByName('mixamorigRightHandMiddle1').getWorldPosition(new T.Vector3()),.65);
   assert.ok(syringe.g.localToWorld(new T.Vector3(0,-.27,-.5)).distanceTo(palm)<1e-6,file);
   assert.ok(syringe.muzzle.getWorldPosition(new T.Vector3()).distanceTo(palm)<.9);
   assert.ok(syringe.g.quaternion.toArray().every(Number.isFinite));
  }
 }
});

test('shipped fallback character also has a supported wrist anchor',async()=>{
 const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const b=readFileSync(new URL('./assets/character.glb',import.meta.url));
 const {scene:root}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const model=new T.Group(),holder=new T.Group();model.add(root);holder.add(model);model.scale.setScalar(.5);
 const syringe=createSyringe();createSyringeGrip({root,model,holder},syringe,.935)();
 const wrist=root.getObjectByName('bone_wristR').getWorldPosition(new T.Vector3());
 assert.ok(syringe.g.localToWorld(new T.Vector3(0,-.27,-.5)).distanceTo(wrist)<1e-6);
});

test('projectiles start at the held muzzle unless a wall separates it from the actor',()=>{
 const syringe=createSyringe();syringe.g.updateMatrixWorld(true);const chest=new T.Vector3(0,.02,0),muzzle=syringe.muzzle.getWorldPosition(new T.Vector3());
 assert.ok(syringeShotOrigin(syringe,chest,()=>false).distanceTo(muzzle)<1e-6);
 const origin=syringeShotOrigin(syringe,chest,(x,z)=>z>=.5&&z<=.7);
 assert.ok(origin.z<.5&&origin.z>.4);
});
