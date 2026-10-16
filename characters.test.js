import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Scene,Group,Mesh,BoxGeometry,MeshStandardMaterial,Texture} from 'three';
import {prepareCharacterAsset,createCharacterVisual,setCharacterKind,playCharacterAttack,playCharacterJump,updateCharacterVisual,characterHeight,acquireCharacterVisual,releaseCharacterVisual,clearCharacterPool,characterPoolSize,warmCharacterPool} from './characters.js';
const buffer=await readFile(new URL('./assets/character.glb',import.meta.url));
const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
const asset=prepareCharacterAsset(gltf);
test('supplied GLB loads its geometry, eight animations and independent actor skeletons',()=>{
  assert.equal(asset.clips.length,8);
  const a=createCharacterVisual(asset,'player'),b=createCharacterVisual(asset,'human');
  assert.ok(a.meshes.length>=15);
  assert.notEqual(a.meshes[0].skeleton.bones[0],b.meshes[0].skeleton.bones[0]);
  assert.equal(a.meshes[0].geometry,b.meshes[0].geometry);
  assert.notEqual(a.meshes[0].material,b.meshes[0].material);
  a.holder.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(a.holder);
  // 人物缩放必须使用统一的现实身高；较高的上限为帽子等职业配饰预留空间。
  assert.equal(a.model.scale.y,characterHeight('player')/asset.height);
  assert.ok(bounds.max.y>.8&&bounds.max.y<1.8);
  // 三个方向必须保持相同倍率，防止模型被横向压扁。
  assert.equal(a.model.scale.x,a.model.scale.y);
  assert.equal(a.model.scale.z,a.model.scale.y);
  assert.ok(bounds.min.y>-.2&&bounds.min.y<.2);
});
test('walk, infection attack, heavy punch and rush return to locomotion',()=>{
  const a=createCharacterVisual(asset,'player');
  updateCharacterVisual(a,true,.1);
  assert.equal(a.current.getClip().name,'walk');
  for(const [input,clip]of [['infect','flurry'],['break','heavyPunch'],['rush','jump']]){
    playCharacterAttack(a,input);updateCharacterVisual(a,true,.2);
    assert.equal(a.current.getClip().name,clip);
    updateCharacterVisual(a,true,.5);
    assert.equal(a.current.getClip().name,'walk');
  }
});
test('unconverted humans shamble; converted allies switch to a fast walk',()=>{
  const a=createCharacterVisual(asset,'human'),b=createCharacterVisual(asset,'human');
  const original=a.meshes[0].material.color.getHex();
  const markerBefore=a.marker.material.color.getHex();
  updateCharacterVisual(a,true,.1);
  assert.equal(a.current.getClip().name,'zombie');
  setCharacterKind(a,'ally');updateCharacterVisual(a,true,.1);
  assert.equal(a.current.getClip().name,'walk');
  assert.equal(a.meshes[0].material.color.getHex(),original);
  assert.notEqual(a.marker.material.color.getHex(),markerBefore);
  assert.equal(a.marker.visible,true);
  assert.equal(b.marker.visible,false);
  updateCharacterVisual(a,true,.1,80);assert.equal(a.holder.visible,false);
  updateCharacterVisual(a,true,.1,10);assert.equal(a.holder.visible,true);
  updateCharacterVisual(a,true,.05,30);assert.equal(a.holder.visible,true);
  assert.equal(a.meshes[0].castShadow,false);
});
test('character visual pool reuses the same skeleton instead of cloning again',()=>{
  clearCharacterPool();
  const a=acquireCharacterVisual(asset,'guard');
  const skeleton=a.meshes[0].skeleton.bones[0];
  releaseCharacterVisual(a);
  assert.equal(characterPoolSize('guard'),1);
  const b=acquireCharacterVisual(asset,'guard');
  assert.equal(b,a);
  assert.equal(b.meshes[0].skeleton.bones[0],skeleton);
  assert.equal(characterPoolSize('guard'),0);
  clearCharacterPool();
});


test('roll can blend directly to jump, then to a landing roll without a frozen pose',()=>{
 const a=createCharacterVisual(asset,'player');
 playCharacterAttack(a,'rush',.72);updateCharacterVisual(a,true,.2);
 a.airborne=true;playCharacterJump(a,.78);updateCharacterVisual(a,true,.1);
 assert.equal(a.current.getClip().name,'jump');assert.equal(a.attackTime,0);
 assert.equal(a.current.paused,false);assert.ok(a.current.time>0);
 a.airborne=false;playCharacterAttack(a,'rush',.72);
 assert.equal(a.current.time,0);assert.equal(a.current.paused,false);
 assert.equal(a.attackTime,.72);
 updateCharacterVisual(a,true,.73);assert.equal(a.current.getClip().name,'walk');
});
test('airborne attacks do not reset jump playback and landing resumes movement',()=>{
 const a=createCharacterVisual(asset,'player');a.airborne=true;playCharacterJump(a,.78);
 updateCharacterVisual(a,true,.2);const before=a.current.time;
 playCharacterAttack(a,'shoot');updateCharacterVisual(a,true,.1);
 assert.equal(a.current.getClip().name,'jump');assert.ok(a.current.time>before);assert.equal(a.attackTime,0);
 a.airborne=false;updateCharacterVisual(a,true,.016);
 assert.equal(a.current.getClip().name,'walk');assert.equal(a.current.paused,false);
});


test('battle reserve retains all 72 guard skeletons for reuse and keeps pool size bounded',()=>{
 clearCharacterPool();assert.equal(warmCharacterPool(asset,'guard',100),72);
 const held=Array.from({length:72},()=>acquireCharacterVisual(asset,'guard'));
 assert.equal(characterPoolSize('guard'),0);
 for(const v of held)releaseCharacterVisual(v);assert.equal(characterPoolSize('guard'),72);
 const reused=Array.from({length:72},()=>acquireCharacterVisual(asset,'guard'));
 assert.ok(reused.every(v=>held.includes(v)));for(const v of reused)releaseCharacterVisual(v);clearCharacterPool();
});
test('nearby NPCs do not add dynamic shadow passes while the player keeps its shadow',()=>{
 const npc=createCharacterVisual(asset,'guard'),player=createCharacterVisual(asset,'player');
 assert.ok(npc.meshes.every(m=>!m.castShadow));updateCharacterVisual(npc,true,.016,2);
 updateCharacterVisual(player,true,.016,0);assert.ok(npc.meshes.every(m=>!m.castShadow));assert.ok(player.meshes.every(m=>m.castShadow));
});


test('pooled characters detach from the scene so hidden skeletons are not traversed every frame',()=>{
 clearCharacterPool();const scene=new Scene(),v=acquireCharacterVisual(asset,'guard');scene.add(v.holder);
 releaseCharacterVisual(v);assert.equal(scene.children.length,0);assert.equal(v.holder.parent,null);
 assert.equal(acquireCharacterVisual(asset,'guard'),v);clearCharacterPool();
});


test('guards share unmodified body materials while preserving independent skeletons and faction markers',()=>{
 clearCharacterPool();const a=acquireCharacterVisual(asset,'guard'),b=acquireCharacterVisual(asset,'guard');
 assert.equal(a.meshes[0].material,b.meshes[0].material);assert.notEqual(a.meshes[0].skeleton.bones[0],b.meshes[0].skeleton.bones[0]);assert.notEqual(a.marker.material,b.marker.material);
 let disposed=0;a.meshes[0].material.addEventListener('dispose',()=>disposed++);
 releaseCharacterVisual(a);releaseCharacterVisual(b);clearCharacterPool();assert.equal(disposed,0,'recycling actors must not dispose shared asset materials');
});


test('body parts reuse one skeleton update per actor while different actors stay independent',()=>{
 const a=createCharacterVisual(asset,'guard'),b=createCharacterVisual(asset,'guard');
 const rigs=new Set(a.meshes.filter(m=>m.isSkinnedMesh).map(m=>m.skeleton));assert.equal(rigs.size,1);
 assert.notEqual(a.meshes[0].skeleton,b.meshes[0].skeleton);assert.notEqual(a.meshes[0].skeleton.bones[0],b.meshes[0].skeleton.bones[0]);
 updateCharacterVisual(a,true,.1,0);a.holder.updateMatrixWorld(true);
 const mesh=a.meshes.find(m=>m.isSkinnedMesh);assert.ok(mesh.skeleton.bones.every(b=>b.matrixWorld.elements.every(Number.isFinite)));
});


test('body and glove material slots retain their own colors and textures for every character model',()=>{
 const scene=new Group(),body=new MeshStandardMaterial({color:0xcccccc,map:new Texture()}),gloves=new MeshStandardMaterial({color:0x0b0c10});
 scene.add(new Mesh(new BoxGeometry(1,2,1),[body,gloves]));
 const fixture=prepareCharacterAsset({scene,animations:[]});
 for(const kind of ['player','human','guard','shieldCop','batonCop']){
  const v=createCharacterVisual(fixture,kind),m=v.meshes[0].material;
  assert.notEqual(m[0],m[1],kind);
  assert.equal(m[0].color.getHex(),body.color.getHex());assert.equal(m[1].color.getHex(),gloves.color.getHex());
  assert.equal(m[0].map,body.map);assert.equal(m[1].map,null);
 }
});

test('converted police reuse their original model without mixing guard, shield and baton rigs',()=>{
 clearCharacterPool();
 const kinds=['guard','shieldCop','batonCop'],models=kinds.map(kind=>acquireCharacterVisual(asset,kind));
 for(const v of models){setCharacterKind(v,'ally');releaseCharacterVisual(v);}
 assert.equal(characterPoolSize('guard'),3);
 for(const [i,kind]of kinds.entries()){
  const v=acquireCharacterVisual(asset,kind);
  assert.equal(v,models[i]);assert.equal(v.kind,kind);assert.equal(v.modelKind,kind);
  assert.equal(v.meshes[0].skeleton,models[i].meshes[0].skeleton);
 }
 assert.equal(characterPoolSize('guard'),0);
 for(const v of models)releaseCharacterVisual(v);
 clearCharacterPool();
});

test('battle warmup reserves each police model within the shared pool limit',()=>{
 clearCharacterPool();const kinds=['guard','shieldCop','batonCop'];
 for(const kind of kinds)warmCharacterPool(asset,kind,2);
 assert.equal(characterPoolSize('guard'),6);
 const held=kinds.flatMap(kind=>[acquireCharacterVisual(asset,kind),acquireCharacterVisual(asset,kind)]);
 assert.equal(characterPoolSize('guard'),0,'all three model reserves must actually be reused');
 for(const v of held)releaseCharacterVisual(v);
 warmCharacterPool(asset,'shieldCop',100);
 assert.equal(characterPoolSize('guard'),72);
 clearCharacterPool();
});

test('missing dedicated police assets fall back to the guard model',()=>{
 const guard={...asset,scene:asset.scene.clone()},civilian={...asset,scene:asset.scene.clone()};
 guard.scene.name='guard-fallback';civilian.scene.name='civilian';
 const assets={guard,humanMale:civilian,humanFemale:civilian};
 for(const kind of ['shieldCop','batonCop'])assert.equal(createCharacterVisual(assets,kind).root.name,'guard-fallback');
});


test('a full mixed pool retains a newly used police model by replacing an idle model of another type',()=>{
 clearCharacterPool();warmCharacterPool(asset,'guard',72);
 const shield=acquireCharacterVisual(asset,'shieldCop');setCharacterKind(shield,'ally');
 assert.equal(releaseCharacterVisual(shield),true);
 assert.equal(characterPoolSize('guard'),72);
 assert.equal(acquireCharacterVisual(asset,'shieldCop'),shield);
 assert.equal(characterPoolSize('guard'),71);
 releaseCharacterVisual(shield);clearCharacterPool();
});
