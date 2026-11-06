import * as T from 'three';
// Both hands follow the shoulder launcher's handles; locomotion and rolls keep their own animation.
export function createHeldArmPose(visual){
 const solvers=['Right','Left'].map(side=>{
  const upper=visual.root.getObjectByName(`mixamorig${side}Arm`),lower=visual.root.getObjectByName(`mixamorig${side}ForeArm`),hand=visual.root.getObjectByName(`mixamorig${side}Hand`);
  if(!upper||!lower||!hand)return null;
  const shoulder=new T.Vector3(),elbow=new T.Vector3(),wrist=new T.Vector3(),goal=new T.Vector3(),bend=new T.Vector3(),axis=new T.Vector3(),outward=new T.Vector3(),forward=new T.Vector3(),center=new T.Vector3(),child=new T.Vector3(),from=new T.Vector3(),to=new T.Vector3();
  const delta=new T.Quaternion(),rotation=new T.Quaternion(),parent=new T.Quaternion();
  function align(bone,tip,target){bone.getWorldPosition(from);tip.getWorldPosition(child);to.subVectors(target,from).normalize();from.subVectors(child,from).normalize();delta.setFromUnitVectors(from,to);bone.getWorldQuaternion(rotation);rotation.premultiply(delta);bone.parent.getWorldQuaternion(parent).invert();bone.quaternion.copy(parent.multiply(rotation));bone.updateWorldMatrix(false,true);}
  return target=>{
   upper.getWorldPosition(shoulder);lower.getWorldPosition(elbow);hand.getWorldPosition(wrist);const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist);if(a+b<1e-5)return;
   visual.holder.getWorldQuaternion(rotation);forward.set(0,0,1).applyQuaternion(rotation);visual.holder.getWorldPosition(center);outward.subVectors(shoulder,center);outward.y=0;outward.addScaledVector(forward,-outward.dot(forward)).normalize();
   goal.copy(target);axis.subVectors(goal,shoulder);const d=Math.max(Math.abs(a-b)+1e-5,Math.min(a+b-1e-5,axis.length()));axis.normalize();goal.copy(shoulder).addScaledVector(axis,d);
   bend.copy(outward);bend.y-=1;bend.addScaledVector(axis,-bend.dot(axis)).normalize();const reach=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-reach*reach));elbow.copy(shoulder).addScaledVector(axis,reach).addScaledVector(bend,height);align(upper,lower,elbow);align(lower,hand,goal);
  };
 });
 return(right,left)=>{if(visual.rolling)return;visual.holder.updateMatrixWorld(true);if(right)solvers[0]?.(right);if(left)solvers[1]?.(left);};
}
