import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {createFirearms,createFirearmGrip} from './guns.js';
const grips={pistol:[0,-.12,-.02],shotgun:[0,-.12,-.08],rifle:[0,-.1,-.08],sniper:[0,-.12,-.1],rpg:[0,-.14,-.12]};
test('every firearm grip stays inside the real animated palm through aim, walk, recoil and jump poses',()=>{
 for(const file of ['toyAim.fbx','Strafing.fbx','toyRecoil.fbx','jump.fbx']){
  const b=readFileSync(new URL('./public/mixamo/'+file,import.meta.url)),root=new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  const holder=new T.Group(),model=new T.Group();model.add(root);holder.add(model);model.scale.setScalar(.85);
  const pivot=new T.Group(),weapons=createFirearms();pivot.add(weapons.root);const update=createFirearmGrip({root,model,holder},pivot,.935),mixer=new T.AnimationMixer(root);mixer.clipAction(root.animations[0]).play();
  for(let i=0;i<10;i++){
   model.scale.set(i>5?1.05:.85,i%2?.65:.85,.85);holder.position.set(i,2,-i);holder.rotation.y=i*.4;mixer.update(.08);update();
   const palm=root.getObjectByName('mixamorigRightHand').getWorldPosition(new T.Vector3()).lerp(root.getObjectByName('mixamorigRightHandMiddle1').getWorldPosition(new T.Vector3()),.65);
   for(const[id,grip]of Object.entries(grips))assert.ok(weapons.map[id].localToWorld(new T.Vector3(...grip)).distanceTo(palm)<1e-6,file+' '+id);
   assert.ok(pivot.quaternion.toArray().every(Number.isFinite));
   const muzzleDirection=new T.Vector3(0,0,1).applyQuaternion(pivot.quaternion),aim=new T.Vector3(0,0,1).applyQuaternion(holder.getWorldQuaternion(new T.Quaternion()));assert.ok(muzzleDirection.dot(aim)>.999,'barrel must follow aim rather than the clenched finger direction');
  }
 }
});
test('the enlarged pistol keeps the shared grip and the fallback wrist is supported',()=>{
 const root=new T.Group(),model=new T.Group(),holder=new T.Group(),wrist=new T.Bone();wrist.name='bone_wristR';wrist.position.set(.2,.6,.1);root.add(wrist);model.add(root);holder.add(model);
 const weapons=createFirearms(),pivot=new T.Group();pivot.add(weapons.root);createFirearmGrip({root,model,holder},pivot,.935)();
 assert.equal(weapons.map.pistol.scale.x,1.35);assert.ok(weapons.map.pistol.localToWorld(new T.Vector3(...grips.pistol)).distanceTo(wrist.getWorldPosition(new T.Vector3()))<1e-6);
});
