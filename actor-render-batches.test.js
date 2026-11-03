import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {installActorRenderBatches} from './actor-render-batches.js';

function fixture(){
 const scene=new T.Scene(),visuals=new Map(),geometry=new T.BoxGeometry(1,2,1),count=geometry.attributes.position.count;
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(count*4).map((_,i)=>i%4===0?1:0),4));
 geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(new Float32Array(count*4).map((_,i)=>i%4===0?1:0),4));
 const material=new T.MeshStandardMaterial({color:0x75bb33});
 for(let i=0;i<2;i++){
  const holder=new T.Group(),root=new T.Group(),bone=new T.Bone(),child=new T.Bone();holder.add(root);root.add(bone);bone.add(child);child.position.y=1;
  const body=new T.SkinnedMesh(geometry,material.clone());root.add(body);scene.add(holder);body.bind(new T.Skeleton([bone,child]));
  holder.position.set(i*6,2,-3);holder.rotation.y=i*.6;holder.scale.setScalar(.5+i*.2);child.rotation.z=i*.8;
  const prop=new T.Mesh(new T.BoxGeometry(.1,.5,.1),material);child.add(prop);prop.position.y=.3;
  visuals.set(i,{v:{holder,meshes:[body],body,child,prop}});
 }
 scene.updateMatrixWorld(true);return {scene,visuals};
}

test('batched skins keep independent world positions, poses and attached props',()=>{
 const {scene,visuals}=fixture(),manager=installActorRenderBatches(scene,visuals),originals=[...visuals.values()].map(({v})=>v.body.material);
 manager.begin();const batch=scene.getObjectByName('Actor_Skinned_Instances');assert.equal(batch.count,2);assert.ok(batch.visible);
 const data=batch.skeleton.boneTexture.image.data,bones=2;
 for(const [i,{v}]of visuals){
  assert.equal(v.body.material.visible,false);const expected=v.body.getVertexPosition(0,new T.Vector3()).applyMatrix4(v.body.matrixWorld);
  const bindVertex=new T.Vector3().fromBufferAttribute(v.body.geometry.attributes.position,0).applyMatrix4(batch.bindMatrix);
  const gpu=bindVertex.applyMatrix4(new T.Matrix4().fromArray(data,(i*bones+1)*16));assert.ok(gpu.distanceTo(expected)<1e-5);
  const shader={uniforms:{},vertexShader:'#include <skinning_pars_vertex>'};batch.material.onBeforeCompile(shader);assert.match(shader.vertexShader,/actorBoneOffset/);assert.equal(batch.geometry.attributes.actorBoneOffset.getX(i),i*2);
 }
 const props=[];scene.getObjectByName('Actor_Render_Batches').traverse(o=>{if(o.name==='Actor_Rigid_Instances')props.push(o);});
 for(const propBatch of props)for(let i=0;i<propBatch.count;i++)assert.ok([...visuals.values()].some(({v})=>v.prop.matrixWorld.elements.every((n,j)=>Math.abs(n-propBatch.instanceMatrix.array[i*16+j])<1e-5)));
 manager.end();assert.equal(batch.visible,false);for(const [i,{v}]of visuals)assert.equal(v.body.material,originals[i]);
 // 受击换白和感染变色可以各自进入新批次，不把其他人一起变色。
 visuals.get(0).v.body.material=new T.MeshBasicMaterial({color:0xffffff});manager.begin();assert.equal(manager.diagnostics().instances,4);manager.end();
 originals[1].color.set(0xff3322);manager.begin();assert.ok([...scene.getObjectByName('Actor_Render_Batches').children].some(o=>o.visible&&o.material.color?.getHex()===0xff3322));manager.end();manager.dispose();
});

test('normal passes and source visibility restore without hiding transparent children',()=>{
 const {scene,visuals}=fixture(),manager=installActorRenderBatches(scene,visuals),first=visuals.get(0).v,glass=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial({transparent:true,opacity:.3}));first.body.add(glass);
 const materials=[...visuals.values()].map(({v})=>v.body.material);for(const {v}of visuals.values())v.body.material=new T.MeshNormalMaterial();
 scene.onBeforeRender();const batch=scene.getObjectByName('Actor_Skinned_Instances');assert.ok(batch.material.isMeshNormalMaterial);assert.equal(glass.visible,true);assert.equal(glass.material.opacity,.3);scene.onAfterRender();
 for(const [i,{v}]of visuals)v.body.material=materials[i];first.holder.visible=false;manager.begin();assert.equal(manager.diagnostics().instances,2);manager.end();manager.dispose();
});

test('hundreds of combat fragments retain their own transforms in a shared draw batch',()=>{
 const scene=new T.Scene(),geometry=new T.BoxGeometry(.12,.12,.12),material=new T.MeshBasicMaterial({color:0xffaa22}),particles=Array.from({length:420},(_,i)=>{const m=new T.Mesh(geometry,material);m.position.set(i%20,i*.01,-i/20);scene.add(m);return m;});scene.updateMatrixWorld(true);const manager=installActorRenderBatches(scene,new Map(),()=>particles);manager.begin();assert.equal(manager.diagnostics().instances,420);assert.equal(manager.diagnostics().groups,2);manager.end();for(const m of particles)assert.equal(m.material,material);manager.dispose();
});

test('flat comic marks share instance colors while retaining opacity, depth and ink/fill layers',()=>{
 const scene=new T.Scene(),geometry=new T.PlaneGeometry(),meshes=[];for(let i=0;i<40;i++){const material=new T.MeshBasicMaterial({color:i%2?0xffaa22:0x8866dd,transparent:true,opacity:.62,depthTest:true,depthWrite:false,side:T.DoubleSide,toneMapped:false}),mesh=new T.Mesh(geometry,material);mesh.userData.comicBatch=true;mesh.renderOrder=i<20?21:22;mesh.position.z=-i;scene.add(mesh);meshes.push(mesh);}scene.updateMatrixWorld(true);
 const camera=new T.Camera();camera.updateMatrixWorld(true);const manager=installActorRenderBatches(scene,new Map(),()=>meshes);manager.begin(camera);assert.equal(manager.diagnostics().groups,2);for(const batch of scene.getObjectByName('Actor_Render_Batches').children){assert.equal(batch.material.opacity,1);assert.ok(Math.abs(batch.geometry.attributes.actorOpacity.getX(0)-.62)<1e-6);assert.equal(batch.material.depthTest,true);assert.equal(batch.material.depthWrite,false);assert.equal(batch.material.forceSinglePass,true);assert.ok([21,22].includes(batch.renderOrder));assert.equal(batch.instanceColor.count,256);let last=-Infinity;for(let i=0;i<batch.count;i++){const z=batch.instanceMatrix.array[i*16+14];assert.ok(z>=last);last=z;}}
 manager.end();const batches=scene.getObjectByName('Actor_Render_Batches').children.length;for(const m of meshes)m.material.opacity=.39;manager.begin(camera);assert.equal(scene.getObjectByName('Actor_Render_Batches').children.length,batches);manager.end();assert.ok(meshes.every(m=>m.material.color.getHex()===0xffaa22||m.material.color.getHex()===0x8866dd));manager.dispose();
});
