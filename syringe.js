import * as T from 'three';
export function createSyringe(){const g=new T.Group(),geo=new T.BoxGeometry(1,1,1);function box(w,h,d,c,x,y,z,glow=false){const mat=new T.MeshStandardMaterial({color:c,roughness:.6,metalness:glow?0:.5,emissive:glow?c:0,emissiveIntensity:glow?.7:0});const m=new T.Mesh(geo,mat);m.scale.set(w,h,d);m.position.set(x,y,z);g.add(m);return m;}
// Long weapon axis +Z; transparent squared reservoir, visible purple liquid and steel cage.
box(.25,.27,1.75,0x363442,0,0,0);box(.18,.25,.35,0x44424b,0,.05,-.8);box(.16,.17,.06,0xb75af5,0,.05,-.99,true);box(.15,.5,.18,0x38313e,0,-.27,-.5);box(.12,.36,.16,0x3a3345,0,-.3,.45);
const glass=new T.Mesh(new T.BoxGeometry(.59,.44,.77),new T.MeshStandardMaterial({color:0xab80c5,transparent:true,opacity:.24,depthWrite:false,roughness:.1}));glass.position.set(0,.03,.32);g.add(glass);const liquid=box(.48,.3,.65,0x9d39df,-.08,.015,.32,true);
for(const z of [-.09,.73])box(.5,.5,.09,0x75717f,0,.03,z);for(const x of [-.24,.24])for(const y of [-.2,.25])box(.04,.04,.9,0x585061,x,y,.32);
box(.17,.18,.27,0x8b8297,0,.02,.92);box(.035,.035,.7,0xdaa9ff,0,.02,1.38,true);box(.16,.22,.12,0xb563f2,0,.04,1.08,true);box(.3,.32,.1,0x77717e,0,.42,-.1);box(.22,.22,.11,0xc18aee,0,.42,-.04,true);box(.1,.018,.13,0x362442,.02,.45,.03);const muzzle=new T.Object3D();muzzle.position.set(0,.02,1.76);g.add(muzzle);g.visible=false;return{g,liquid,muzzle};}
