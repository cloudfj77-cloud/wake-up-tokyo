import {createHeldArmPose} from './held-arm-pose.js';
import * as T from 'three';
const SHOULDER_REST=new T.Vector3(0,-.34,-.45);
export function createSyringe(){
 const g=new T.Group();g.name='Shoulder bio-injector';const boxGeometry=new T.BoxGeometry(),silver=new T.MeshStandardMaterial({color:0xe5dced,roughness:.35,metalness:.55}),dark=new T.MeshStandardMaterial({color:0x30263b,roughness:.5}),purple=new T.MeshStandardMaterial({color:0xbb36f5,emissive:0x941cdb,emissiveIntensity:.65,roughness:.16});
 function box(w,h,d,material,x,y,z){const m=new T.Mesh(boxGeometry,material);m.scale.set(w,h,d);m.position.set(x,y,z);g.add(m);return m;}
 function cylinder(radius,length,material,z){const m=new T.Mesh(new T.CylinderGeometry(radius,radius,length,20).rotateX(Math.PI/2),material);m.position.z=z;g.add(m);return m;}
 cylinder(.35,1.38,new T.MeshStandardMaterial({color:0xe8d6ff,transparent:true,opacity:.35,depthWrite:false,roughness:.12}),.08);
 const liquid=cylinder(.29,1.22,purple,.08);liquid.name='Purple reservoir';liquid.scale.y=.78;liquid.position.y=-.055;
 cylinder(.39,.13,silver,.82);const rear=new T.Mesh(new T.TorusGeometry(.32,.055,8,24),silver);rear.position.z=-.66;g.add(rear);
 for(let i=0;i<6;i++){const z=-.45+i*.19;box(.08,.025,.02,dark,-.345,.12,z);box(.08,.025,.02,dark,.345,.12,z);}
 cylinder(.045,.87,silver,-1.16);cylinder(.14,.07,silver,-1.63);box(.42,.065,.10,silver,0,0,-1.7);
 cylinder(.19,.27,dark,1.02);cylinder(.1,.75,silver,1.51);cylinder(.15,.12,purple,1.88);
 box(.56,.16,.68,dark,0,-.34,-.45);box(.12,.48,.16,dark,0,-.49,-.05);box(.15,.31,.15,silver,0,-.42,.70);
 const muzzle=new T.Object3D();muzzle.position.set(0,0,1.99);g.add(muzzle);const shoulderRest=new T.Object3D();shoulderRest.position.copy(SHOULDER_REST);g.add(shoulderRest);
 g.visible=false;return{g,liquid,muzzle,shoulderRest,recoil:0};
}
export function kickSyringe(syringe){syringe.recoil=1;}
export function stepSyringeRecoil(syringe,dt){syringe.recoil=Math.max(0,syringe.recoil-Math.max(0,dt)/.24);}
export function createSyringeGrip(visual,syringe,height,orientation){
 const shoulder=visual.root.getObjectByName('mixamorigRightArm')||visual.root.getObjectByName('bone_shoulderR');
 const pose=createHeldArmPose(visual),baseScale=visual.model.scale.x,anchor=new T.Vector3(),center=new T.Vector3(),side=new T.Vector3(),forward=new T.Vector3(),offset=new T.Vector3(),rightHand=new T.Vector3(),leftHand=new T.Vector3(),rotation=new T.Quaternion(),kick=new T.Quaternion(),axis=new T.Vector3(1,0,0);
 return()=>{
  visual.holder.updateMatrixWorld(true);visual.holder.getWorldPosition(center);visual.holder.getWorldQuaternion(rotation);forward.set(0,0,1).applyQuaternion(rotation);
  if(shoulder)shoulder.getWorldPosition(anchor);else anchor.copy(center).add(new T.Vector3(-height*.16,height*.72,0).applyQuaternion(rotation));
  side.subVectors(anchor,center);side.y=0;side.addScaledVector(forward,-side.dot(forward));if(side.lengthSq()<1e-6)side.set(-1,0,0).applyQuaternion(rotation);side.normalize();
  const size=height*visual.model.scale.x/baseScale,recoil=Math.sin(syringe.recoil*Math.PI/2);anchor.addScaledVector(side,size*.18);anchor.y+=size*.055;
  if(orientation)orientation(syringe.g.quaternion);else syringe.g.quaternion.copy(rotation);
  syringe.g.quaternion.multiply(kick.setFromAxisAngle(axis,-.23*recoil));syringe.g.scale.setScalar(size*.39);
  offset.copy(SHOULDER_REST).multiply(syringe.g.scale).applyQuaternion(syringe.g.quaternion);syringe.g.position.copy(anchor).sub(offset).addScaledVector(forward,-size*.045*recoil);syringe.g.updateMatrixWorld(true);
  rightHand.set(0,-.49,-.05);leftHand.set(0,-.42,.70);syringe.g.localToWorld(rightHand);syringe.g.localToWorld(leftHand);pose(rightHand,leftHand);
 };
}
export function syringeShotOrigin(syringe,chest,solid){
 const muzzle=syringe.muzzle.getWorldPosition(new T.Vector3()),origin=chest.clone(),probe=new T.Vector3();const steps=Math.max(1,Math.ceil(chest.distanceTo(muzzle)/.08));
 for(let i=1;i<=steps;i++){probe.lerpVectors(chest,muzzle,i/steps);if(solid(probe.x,probe.z,.04,probe.y))break;origin.copy(probe);}return origin;
}
