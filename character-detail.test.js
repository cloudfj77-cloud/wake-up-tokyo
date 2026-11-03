import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {prepareCharacterDetails,setCharacterDetail,characterDetailStats} from './character-detail.js';

test('character detail levels reduce triangles while keeping retained vertices, skin weights, materials and animated poses',async()=>{
 const geometry=new T.SphereGeometry(1,192,128),count=geometry.attributes.position.count,weights=new Float32Array(count*4),indices=new Uint16Array(count*4);
 for(let i=0;i<count;i++){const weight=(geometry.attributes.position.getY(i)+1)/2;weights[i*4]=1-weight;weights[i*4+1]=weight;indices[i*4+1]=1;}
 geometry.setAttribute('skinWeight',new T.BufferAttribute(weights,4));geometry.setAttribute('skinIndex',new T.BufferAttribute(indices,4));
 const root=new T.Group(),bone=new T.Bone(),child=new T.Bone();bone.add(child);child.position.y=1;root.add(bone);
 const mesh=new T.SkinnedMesh(geometry,new T.MeshStandardMaterial());root.add(mesh);const skeleton=new T.Skeleton([bone,child]);mesh.bind(skeleton);root.updateMatrixWorld(true);
 const key=(g,i)=>['position','normal','uv','skinWeight','skinIndex'].flatMap(name=>Array.from({length:g.attributes[name].itemSize},(_,j)=>g.attributes[name].getComponent(i,j))).join(',');
 const originalVertices=new Map();for(let i=0;i<count;i++)originalVertices.set(key(geometry,i),i);
 await prepareCharacterDetails({scene:root});const stats=characterDetailStats(mesh.geometry);assert.ok(stats.levels[0]<stats.original*.8);assert.ok(stats.levels[2]<stats.levels[0]*.3);
 const reference=new T.SkinnedMesh(geometry,mesh.material);reference.bind(skeleton,mesh.bindMatrix);const visual={kind:'ally',meshes:[mesh]};
 child.rotation.z=.6;root.updateMatrixWorld(true);skeleton.update();
 for(const distance of [1.5,6,18]){
  setCharacterDetail(visual,distance);assert.equal(mesh.skeleton,skeleton);assert.equal(mesh.material,reference.material);
  const index=mesh.geometry.index;for(let sample=0;sample<30;sample++){
   const vertex=index.getX(Math.floor(index.count*sample/30)),original=originalVertices.get(key(mesh.geometry,vertex));assert.notEqual(original,undefined,'retained attributes must come from an original vertex');
   assert.ok(mesh.getVertexPosition(vertex,new T.Vector3()).distanceTo(reference.getVertexPosition(original,new T.Vector3()))<1e-5,'animated skin position must match the original rig');
  }
 }
 setCharacterDetail(visual,9);assert.equal(visual.geometryDetail,2);setCharacterDetail(visual,7);assert.equal(visual.geometryDetail,1);setCharacterDetail(visual,3);assert.equal(visual.geometryDetail,1);setCharacterDetail(visual,2.5);assert.equal(visual.geometryDetail,0);
 visual.kind='player';setCharacterDetail(visual,40);assert.equal(mesh.geometry,geometry,'the player retains full geometry');
});

test('interleaved FBX groups with the same material remain a solid surface after simplification',async()=>{
 const geometry=new T.PlaneGeometry(2,2,256,256),indices=geometry.index.array,halves=[[],[]];for(let i=0;i<indices.length;i+=3)halves[(i/3)%2].push(...indices.subarray(i,i+3));geometry.setIndex(halves.flat());geometry.clearGroups();geometry.addGroup(0,halves[0].length,0);geometry.addGroup(halves[0].length,halves[1].length,0);
 const mesh=new T.Mesh(geometry,[new T.MeshStandardMaterial()]),scene=new T.Group();scene.add(mesh);await prepareCharacterDetails({scene});
 assert.ok(mesh.geometry.index.count/3<=30000);let area=0;const g=mesh.geometry,p=g.attributes.position,a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();for(let i=0;i<g.index.count;i+=3){a.fromBufferAttribute(p,g.index.getX(i));b.fromBufferAttribute(p,g.index.getX(i+1));c.fromBufferAttribute(p,g.index.getX(i+2));area+=b.sub(a).cross(c.sub(a)).length()/2;}assert.ok(Math.abs(area-4)<1e-6,'a checkerboard export must not become holes');
});
