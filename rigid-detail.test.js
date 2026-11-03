import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {mergeRigidDetails} from './rigid-detail.js';

test('merged rigid parts retain their original bone transforms, linear colors and textures',()=>{
 const root=new T.Group(),head=new T.Bone(),texture=new T.Texture();root.position.set(2,3,4);root.add(head);head.position.y=2;
 const parts=[];for(let i=0;i<3;i++){const mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({color:[0x804020,0x204080,0x208040][i],map:texture}));mesh.position.set(i*.5,i*.1,0);mesh.rotation.z=i*.1;head.add(mesh);parts.push(mesh);}
 root.updateMatrixWorld(true);const original=parts.map(mesh=>({geometry:mesh.geometry,matrix:mesh.matrix.clone(),color:mesh.material.color.clone()}));
 assert.equal(mergeRigidDetails(root),2);assert.equal(head.children.length,1);const merged=head.children[0];assert.equal(merged.material.map,texture);assert.equal(merged.material.vertexColors,true);assert.equal(merged.parent,head);
 head.rotation.z=.7;root.updateMatrixWorld(true);let offset=0;
 for(const part of original)for(let i=0;i<part.geometry.attributes.position.count;i++,offset++){
  const expected=new T.Vector3().fromBufferAttribute(part.geometry.attributes.position,i).applyMatrix4(part.matrix).applyMatrix4(head.matrixWorld),actual=new T.Vector3().fromBufferAttribute(merged.geometry.attributes.position,offset).applyMatrix4(merged.matrixWorld);
  assert.ok(actual.distanceTo(expected)<1e-6,'bone motion must match the separate meshes');
  for(let j=0;j<3;j++)assert.ok(Math.abs(merged.geometry.attributes.color.getComponent(offset,j)-part.color.toArray()[j])<1e-7);
 }
});
test('independently animated, transparent and skinned parts remain separate',()=>{
 const root=new T.Group();for(const [name,type]of [['animated','plain'],['glass','transparent'],['body','skinned']]){
  const material=new T.MeshStandardMaterial({transparent:type==='transparent'}),mesh=type==='skinned'?new T.SkinnedMesh(new T.BoxGeometry(),material):new T.Mesh(new T.BoxGeometry(),material);mesh.name=name;root.add(mesh);
 }
 const clip=new T.AnimationClip('motion',1,[new T.VectorKeyframeTrack('animated.position',[0,1],[0,0,0,1,0,0])]);
 assert.equal(mergeRigidDetails(root,[clip]),0);assert.equal(root.children.length,3);
});
