import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {beginConversionTransition,stepConversionTransition,clearConversionTransition} from './conversion-transition.js';
import {flashCharacter} from './hit-response.js';import {installActorRenderBatches} from './actor-render-batches.js';
function fixture(){const material=new T.MeshStandardMaterial({color:0x445566}),mesh=new T.Mesh(new T.BoxGeometry(),material),other=new T.Mesh(mesh.geometry,material);return{v:{meshes:[mesh]},mesh,other,material};}
test('conversion flashes purple, settles to green and restores opaque art without changing other actors',()=>{
 const {v,mesh,other,material}=fixture();beginConversionTransition(v);assert.notEqual(mesh.material,material);assert.equal(other.material,material);assert.equal(mesh.material.transparent,false);assert.equal(mesh.material.opacity,1);assert.equal(mesh.material.emissive.getHex(),0xc65bff);
 stepConversionTransition(v,.25);assert.equal(mesh.material.emissive.getHex(),0x3be870);stepConversionTransition(v,.41);assert.equal(mesh.material,material);
});
test('hit flash and pooled cleanup cannot restore a disposed transition material',()=>{
 const {v,mesh,material}=fixture();beginConversionTransition(v);const copy=mesh.material;let disposed=0;copy.addEventListener('dispose',()=>disposed++);flashCharacter(v,new T.MeshBasicMaterial(),.1);clearConversionTransition(v);assert.equal(mesh.material,material);assert.equal(v.hitFlash,null);assert.equal(disposed,1);clearConversionTransition(v);assert.equal(disposed,1);
});
test('successive transitions use a bounded number of actor batches rather than a new material signature every frame',()=>{
 const {v,mesh}=fixture(),scene=new T.Scene(),holder=new T.Group();holder.add(mesh);scene.add(holder);v.holder=holder;const batches=installActorRenderBatches(scene,new Map([[1,{v}]]));
 for(let run=0;run<10;run++){beginConversionTransition(v);for(let i=0;i<42;i++){stepConversionTransition(v,1/60);scene.updateMatrixWorld(true);batches.begin(new T.PerspectiveCamera());batches.end();}}
 assert.ok(scene.getObjectByName('Actor_Render_Batches').children.length<=4);batches.dispose();
});
