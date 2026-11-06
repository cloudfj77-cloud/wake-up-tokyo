import {createHeldArmPose} from './held-arm-pose.js';
import {createWeaponGrip} from './weapon-grip.js';
import * as T from 'three';
export function createSyringe(){const g=new T.Group(),geo=new T.BoxGeometry(1,1,1);function box(w,h,d,c,x,y,z,glow=false){const mat=new T.MeshStandardMaterial({color:c,roughness:.6,metalness:glow?0:.5,emissive:glow?c:0,emissiveIntensity:glow?.7:0});const m=new T.Mesh(geo,mat);m.scale.set(w,h,d);m.position.set(x,y,z);g.add(m);return m;}
// Long weapon axis +Z; transparent squared reservoir, visible purple liquid and steel cage.
box(.25,.27,1.75,0xb9abcc,0,0,0);box(.18,.25,.35,0x645572,0,.05,-.8);box(.16,.17,.06,0xb75af5,0,.05,-.99,true);box(.15,.5,.18,0x38313e,0,-.27,-.5);box(.12,.36,.16,0x3a3345,0,-.3,.45);
const glass=new T.Mesh(new T.BoxGeometry(.76,.58,.9),new T.MeshStandardMaterial({color:0xab80c5,transparent:true,opacity:.38,depthWrite:false,roughness:.1}));glass.position.set(-.42,.03,.32);g.add(glass);const liquid=box(.64,.42,.78,0xc14dff,-.38,.015,.32,true);
for(const z of [-.15,.82])box(.76,.6,.09,0x75717f,-.42,.03,z);for(const x of [-.76,-.08])for(const y of [-.25,.31])box(.05,.05,1.03,0x585061,x,y,.32);
box(.24,.26,.27,0x8b8297,0,.02,.92);box(.10,.10,.7,0xdaa9ff,0,.02,1.38,true);box(.28,.32,.14,0xb563f2,0,.04,1.08,true);box(.3,.14,.1,0x77717e,0,.18,-.1);box(.22,.1,.11,0xc18aee,0,.18,-.04,true);box(.45,.08,.08,0xb9abcc,-.21,.02,-.13);box(.45,.08,.08,0xb9abcc,-.21,.02,.80);const muzzle=new T.Object3D();muzzle.position.set(0,.02,1.76);g.add(muzzle);g.visible=false;return{g,liquid,muzzle};}

export function createSyringeGrip(visual,syringe,height,orientation){
 const pose=createHeldArmPose(visual),grip=createWeaponGrip(visual,syringe.g,new T.Vector3(0,-.27,-.5),height*.48,orientation??(q=>visual.holder.getWorldQuaternion(q)));
 return()=>{pose();grip();};
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
