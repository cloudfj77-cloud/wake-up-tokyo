import * as T from 'three';
// Keep the injector beside the chest instead of following the source clip's hand up into the face.
export function createHeldArmPose(visual){
 const upper=visual.root.getObjectByName('mixamorigRightArm'),lower=visual.root.getObjectByName('mixamorigRightForeArm'),hand=visual.root.getObjectByName('mixamorigRightHand');
 if(!upper||!lower||!hand)return ()=>{};
 const shoulder=new T.Vector3(),elbow=new T.Vector3(),wrist=new T.Vector3(),goal=new T.Vector3(),bend=new T.Vector3(),axis=new T.Vector3(),side=new T.Vector3(),forward=new T.Vector3(),center=new T.Vector3(),child=new T.Vector3(),from=new T.Vector3(),to=new T.Vector3();
 const delta=new T.Quaternion(),rotation=new T.Quaternion(),parent=new T.Quaternion();
 function align(bone,tip,target){
  bone.getWorldPosition(from);tip.getWorldPosition(child);to.subVectors(target,from).normalize();from.subVectors(child,from).normalize();
  delta.setFromUnitVectors(from,to);bone.getWorldQuaternion(rotation);rotation.premultiply(delta);bone.parent.getWorldQuaternion(parent).invert();bone.quaternion.copy(parent.multiply(rotation));bone.updateWorldMatrix(false,true);
 }
 return()=>{
  if(visual.rolling)return;visual.holder.updateMatrixWorld(true);upper.getWorldPosition(shoulder);lower.getWorldPosition(elbow);hand.getWorldPosition(wrist);
  const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist);if(a+b<1e-5)return;
  visual.holder.getWorldQuaternion(rotation);forward.set(0,0,1).applyQuaternion(rotation);visual.holder.getWorldPosition(center);
  side.subVectors(shoulder,center);side.y=0;side.addScaledVector(forward,-side.dot(forward));if(side.lengthSq()<1e-6)side.set(1,0,0).applyQuaternion(rotation);side.normalize();
  goal.copy(shoulder).addScaledVector(forward,(a+b)*.55).addScaledVector(side,a*.9);goal.y-=a*.25;
  axis.subVectors(goal,shoulder);const d=Math.max(Math.abs(a-b)+1e-5,Math.min(a+b-1e-5,axis.length()));axis.normalize();goal.copy(shoulder).addScaledVector(axis,d);
  bend.copy(side);bend.y-=1;bend.addScaledVector(axis,-bend.dot(axis)).normalize();const reach=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-reach*reach));
  elbow.copy(shoulder).addScaledVector(axis,reach).addScaledVector(bend,height);align(upper,lower,elbow);align(lower,hand,goal);
 };
}
