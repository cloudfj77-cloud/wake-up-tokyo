import * as T from 'three';
export function createSyringe(){const g=new T.Group(),geo=new T.BoxGeometry(1,1,1);function box(w,h,d,c,x,y,z,glow=false){const mat=new T.MeshStandardMaterial({color:c,roughness:.6,metalness:glow?0:.5,emissive:glow?c:0,emissiveIntensity:glow?.7:0});const m=new T.Mesh(geo,mat);m.scale.set(w,h,d);m.position.set(x,y,z);g.add(m);return m;}
// Long weapon axis +Z; transparent squared reservoir, visible purple liquid and steel cage.
box(.25,.27,1.75,0x363442,0,0,0);box(.18,.25,.35,0x44424b,0,.05,-.8);box(.16,.17,.06,0xb75af5,0,.05,-.99,true);box(.15,.5,.18,0x38313e,0,-.27,-.5);box(.12,.36,.16,0x3a3345,0,-.3,.45);
const glass=new T.Mesh(new T.BoxGeometry(.59,.44,.77),new T.MeshStandardMaterial({color:0xab80c5,transparent:true,opacity:.24,depthWrite:false,roughness:.1}));glass.position.set(0,.03,.32);g.add(glass);const liquid=box(.48,.3,.65,0x9d39df,-.08,.015,.32,true);
for(const z of [-.09,.73])box(.5,.5,.09,0x75717f,0,.03,z);for(const x of [-.24,.24])for(const y of [-.2,.25])box(.04,.04,.9,0x585061,x,y,.32);
box(.17,.18,.27,0x8b8297,0,.02,.92);box(.035,.035,.7,0xdaa9ff,0,.02,1.38,true);box(.16,.22,.12,0xb563f2,0,.04,1.08,true);box(.3,.32,.1,0x77717e,0,.42,-.1);box(.22,.22,.11,0xc18aee,0,.42,-.04,true);box(.1,.018,.13,0x362442,.02,.45,.03);const muzzle=new T.Object3D();muzzle.position.set(0,.02,1.76);g.add(muzzle);g.visible=false;return{g,liquid,muzzle};}

// Anchor the rear grip inside the animated palm, not at a fixed offset beside the actor.
export function createSyringeGrip(visual,syringe,height){
 const hand=visual.root.getObjectByName('mixamorigRightHand')||visual.root.getObjectByName('handR')||visual.root.getObjectByName('bone_wristR');
 if(!hand)throw new Error('主角缺少右手骨骼，无法持握注射器');
 const knuckle=visual.root.getObjectByName('mixamorigRightHandMiddle1');
 const index=visual.root.getObjectByName('mixamorigRightHandIndex1');
 const wrist=new T.Vector3(),palm=new T.Vector3(),tip=new T.Vector3(),up=new T.Vector3(),right=new T.Vector3(),forward=new T.Vector3(),basis=new T.Matrix4();
 const grip=new T.Vector3(0,-.27,-.5),offset=new T.Vector3(),baseScale=visual.model.scale.x;
 return ()=>{
  visual.holder.updateMatrixWorld(true);
  hand.getWorldPosition(wrist);
  if(knuckle){
   knuckle.getWorldPosition(tip);forward.subVectors(tip,wrist).normalize();palm.lerpVectors(wrist,tip,.65);
   if(index){index.getWorldPosition(up).sub(tip).normalize();}else up.set(0,1,0);
  }else{
   hand.getWorldPosition(palm);visual.holder.getWorldQuaternion(syringe.g.quaternion);
   forward.set(0,0,1).applyQuaternion(syringe.g.quaternion);up.set(0,1,0);
  }
  right.crossVectors(up,forward).normalize();up.crossVectors(forward,right).normalize();
  syringe.g.quaternion.setFromRotationMatrix(basis.makeBasis(right,up,forward));
  syringe.g.scale.setScalar(height/4*visual.model.scale.x/baseScale);
  offset.copy(grip).multiply(syringe.g.scale).applyQuaternion(syringe.g.quaternion);
  syringe.g.position.copy(palm).sub(offset);
  syringe.g.updateMatrixWorld(true);
 };
}

export function syringeShotOrigin(syringe,chest,solid){
 const muzzle=syringe.muzzle.getWorldPosition(new T.Vector3()),origin=chest.clone(),probe=new T.Vector3();
 const steps=Math.max(1,Math.ceil(chest.distanceTo(muzzle)/.08));
 // A held weapon can poke through a wall; never start its projectile on the other side.
 for(let i=1;i<=steps;i++){
  probe.lerpVectors(chest,muzzle,i/steps);
  if(solid(probe.x,probe.z,.04,probe.y))break;
  origin.copy(probe);
 }
 return origin;
}
