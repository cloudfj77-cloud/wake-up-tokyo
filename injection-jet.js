import * as T from 'three';
const geometry=new T.IcosahedronGeometry(1,1),material=new T.MeshStandardMaterial({color:0xb42cfa,emissive:0x8b16cd,emissiveIntensity:.6,roughness:.16,metalness:.05});
const CAP=96,HISTORY=48,forward=new T.Vector3(0,0,1);
export function createInjectionJet(x,y,z,empowered=false){
 const group=new T.Group();group.name='Purple juice spray';group.position.set(x,y,z);group.userData.infectionJet=true;
 const drops=new T.InstancedMesh(geometry,material,CAP);drops.frustumCulled=false;drops.count=0;group.add(drops);
 const points=Array.from({length:HISTORY},()=>new T.Vector3(x,y,z));
 group.userData.fluid={drops,points,index:0,count:1,age:0,power:empowered?1.45:1,matrix:new T.Matrix4(),inverse:new T.Matrix4(),point:new T.Vector3(),tangent:new T.Vector3(),scale:new T.Vector3(),rotation:new T.Quaternion(),inverseRotation:new T.Quaternion()};
 updateInjectionJet(group,0);return group;
}
export function updateInjectionJet(group,dt){
 const f=group?.userData.fluid;if(!f)return;if(f.age===0&&dt===0)f.points[f.index].copy(group.position);f.age+=Math.max(0,dt);
 if(f.points[f.index].distanceToSquared(group.position)>.0025){f.index=(f.index+1)%HISTORY;f.points[f.index].copy(group.position);f.count=Math.min(HISTORY,f.count+1);}
 group.updateMatrixWorld(true);f.inverse.copy(group.matrixWorld).invert();group.getWorldQuaternion(f.inverseRotation).invert();
 const count=Math.min(CAP,8+(f.count-1)*3);f.drops.count=count;
 for(let i=0;i<count;i++){
  const t=i/Math.max(1,count-1),sample=t*(f.count-1),j=Math.floor(sample),a=f.points[(f.index-j+HISTORY)%HISTORY],b=f.points[(f.index-Math.min(j+1,f.count-1)+HISTORY)%HISTORY];
  f.point.lerpVectors(a,b,sample-j);f.point.x+=Math.sin(i*2.4+f.age*11)*(.012+t*.05);f.point.y+=Math.cos(i*3.1+f.age*9)*.02-t*t*.09;
  f.point.applyMatrix4(f.inverse);f.tangent.subVectors(a,b);if(f.tangent.lengthSq()<1e-8)f.tangent.copy(forward);else f.tangent.normalize().applyQuaternion(f.inverseRotation);
  f.rotation.setFromUnitVectors(forward,f.tangent);const radius=(.045+.035*(.5+.5*Math.sin(i*1.7)))*(1-t*.42)*f.power;
  f.scale.set(radius,radius,radius*(1.7+.6*Math.sin(i+f.age*12)));f.matrix.compose(f.point,f.rotation,f.scale);f.drops.setMatrixAt(i,f.matrix);
 }
 f.drops.instanceMatrix.needsUpdate=true;
}
export function createInjectionSplash(x,y,z){
 const group=new T.Group();group.name='Purple juice splash';group.position.set(x,y,z);const drops=new T.InstancedMesh(geometry,material,18);drops.frustumCulled=false;group.add(drops);
 group.userData.splash={drops,matrix:new T.Matrix4(),point:new T.Vector3(),scale:new T.Vector3(),rotation:new T.Quaternion()};updateInjectionSplash(group,0);return group;
}
export function updateInjectionSplash(group,age){
 const f=group.userData.splash;if(!f)return;
 for(let i=0;i<18;i++){const angle=i*2.39996,speed=.8+(i%5)*.32;f.point.set(Math.cos(angle)*speed*age,(1.1+(i%4)*.5)*age-4.5*age*age,Math.sin(angle)*speed*age);const radius=(.025+(i%4)*.012)*Math.max(0,1-age/.32);f.scale.set(radius,radius*(1+age*2),radius);f.matrix.compose(f.point,f.rotation,f.scale);f.drops.setMatrixAt(i,f.matrix);}f.drops.instanceMatrix.needsUpdate=true;
}
export function disposeInjectionEffect(group){for(const child of group?.children??[])if(child.isInstancedMesh)child.dispose();}
