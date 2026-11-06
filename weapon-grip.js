import * as T from 'three';

// Both weapons use the same animated palm basis; each supplies its calibrated grip and size.
export function createWeaponGrip(visual,weapon,grip,size,orientation){
 const hand=visual.root.getObjectByName('mixamorigRightHand')||visual.root.getObjectByName('handR')||visual.root.getObjectByName('bone_wristR');
 if(!hand)throw new Error('主角缺少右手骨骼，无法持握武器');
 const knuckle=visual.root.getObjectByName('mixamorigRightHandMiddle1');
 const index=visual.root.getObjectByName('mixamorigRightHandIndex1');
 const wrist=new T.Vector3(),palm=new T.Vector3(),tip=new T.Vector3(),up=new T.Vector3(),right=new T.Vector3(),forward=new T.Vector3(),basis=new T.Matrix4();
 const offset=new T.Vector3(),baseScale=visual.model.scale.x;
 return ()=>{
  visual.holder.updateMatrixWorld(true);
  hand.getWorldPosition(wrist);
  if(knuckle){
   knuckle.getWorldPosition(tip);forward.subVectors(tip,wrist).normalize();palm.lerpVectors(wrist,tip,.65);
   if(index){index.getWorldPosition(up).sub(tip).normalize();}else up.set(0,1,0);
  }else{
   hand.getWorldPosition(palm);visual.holder.getWorldQuaternion(weapon.quaternion);
   forward.set(0,0,1).applyQuaternion(weapon.quaternion);up.set(0,1,0);
  }
  right.crossVectors(up,forward).normalize();up.crossVectors(forward,right).normalize();
  if(orientation)orientation(weapon.quaternion);
  else weapon.quaternion.setFromRotationMatrix(basis.makeBasis(right,up,forward));
  weapon.scale.setScalar(size*visual.model.scale.x/baseScale);
  offset.copy(grip).multiply(weapon.scale).applyQuaternion(weapon.quaternion);
  weapon.position.copy(palm).sub(offset);
  weapon.updateMatrixWorld(true);
 };
}
