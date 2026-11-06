import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// 仅合并同一骨骼/根节点上的不透明刚性配件。动画骨骼、蒙皮网格、透明护目镜和独立动画节点保留。
export function mergeRigidDetails(root,clips=[]){
 root.updateMatrixWorld(true);const animated=new Set(clips.flatMap(c=>c.tracks.map(t=>t.name.slice(0,t.name.lastIndexOf('.'))))),groups=new Map(),textures=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','alphaMap','aoMap','lightMap','envMap','bumpMap','displacementMap'];
 const parents=new Map();let nextParent=0;
 root.traverse(mesh=>{
  const m=mesh.material;if(!mesh.isMesh||mesh.isSkinnedMesh||!mesh.visible||Array.isArray(m)||!m?.isMeshStandardMaterial||m.transparent||m.opacity!==1||Object.keys(mesh.geometry.morphAttributes).length||mesh.geometry.drawRange.count!==Infinity||mesh.geometry.attributes.color?.itemSize===4||m.clippingPlanes)return;
  if(m.onBeforeCompile!==T.Material.prototype.onBeforeCompile)return;
  let parent=mesh.parent,blocked=animated.has(mesh.name);
  for(let p=mesh.parent;p&&p!==root&&!p.isBone;p=p.parent){if(animated.has(p.name))blocked=true;parent=p.parent||root;}
  if(blocked||!parent)return;
  if(!parents.has(parent))parents.set(parent,nextParent++);
  const format=Object.entries(mesh.geometry.attributes).filter(([name])=>name!=='color').map(([name,a])=>name+':'+a.itemSize+':'+a.array.constructor.name).sort().join('|');
  const signature=[parents.get(parent),format,m.roughness,m.metalness,...m.emissive.toArray(),m.emissiveIntensity,m.side,m.fog,m.blending,m.premultipliedAlpha,m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits,m.colorWrite,m.normalMapType,m.flatShading,m.alphaTest,m.depthTest,m.depthWrite,m.toneMapped,m.normalScale?.x,m.normalScale?.y,m.aoMapIntensity,m.lightMapIntensity,m.envMapIntensity,m.bumpScale,m.displacementScale,m.displacementBias,mesh.castShadow,mesh.receiveShadow,...textures.map(key=>m[key]?.uuid||'')].join('/');
  if(!groups.has(signature))groups.set(signature,{parent,meshes:[]});groups.get(signature).meshes.push(mesh);
 });
 let removed=0;
 for(const {parent,meshes}of groups.values()){
  if(meshes.length<2)continue;const geometries=[],inverse=parent.matrixWorld.clone().invert(),matrix=new T.Matrix4();
  for(const mesh of meshes){
   const g=mesh.geometry.clone();matrix.multiplyMatrices(inverse,mesh.matrixWorld);g.applyMatrix4(matrix);
   const source=mesh.geometry.attributes.color,count=g.attributes.position.count,colors=new Float32Array(count*3),color=mesh.material.color,channels=[color.r,color.g,color.b];
   for(let i=0;i<count;i++)for(let j=0;j<3;j++)colors[i*3+j]=channels[j]*(mesh.material.vertexColors&&source?source.getComponent(i,j):1);
   g.setAttribute('color',new T.BufferAttribute(colors,3));g.clearGroups();geometries.push(g);
  }
  const geometry=mergeGeometries(geometries,false);if(!geometry){geometries.forEach(g=>g.dispose());continue;}
  const material=meshes[0].material.clone();material.color.set(0xffffff);material.vertexColors=true;
  const merged=new T.Mesh(geometry,material);merged.name='Rigid_Render_Batch';merged.castShadow=meshes[0].castShadow;merged.receiveShadow=meshes[0].receiveShadow;merged.frustumCulled=false;parent.add(merged);
  for(const mesh of meshes)mesh.removeFromParent();geometries.forEach(g=>g.dispose());removed+=meshes.length-1;
 }
 root.updateMatrixWorld(true);return removed;
}
