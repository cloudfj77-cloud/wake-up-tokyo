import * as T from 'three';
// Shared resources: a bright core and a tapered purple exhaust, with no per-frame allocations.
const coreGeometry=new T.CylinderGeometry(.032,.032,.62,8).rotateX(Math.PI/2),tailGeometry=new T.ConeGeometry(.16,1.35,8).rotateX(Math.PI/2);
const coreMaterial=new T.MeshBasicMaterial({color:0xf5d5ff,toneMapped:false});
const tailMaterial=new T.MeshBasicMaterial({color:0xb436ff,transparent:true,opacity:.78,depthWrite:false,side:T.DoubleSide,toneMapped:false});
export function createInjectionJet(x,y,z){
 const group=new T.Group();group.name='Purple infection jet';group.userData.infectionJet=true;
 const core=new T.Mesh(coreGeometry,coreMaterial),tail=new T.Mesh(tailGeometry,tailMaterial);core.position.z=-.18;tail.position.z=-.58;
 group.add(tail,core);group.position.set(x,y,z);group.material=coreMaterial;return group;
}
