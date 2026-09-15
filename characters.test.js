import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3} from 'three';
import {prepareCharacterAsset,createCharacterVisual,setCharacterKind,playCharacterAttack,updateCharacterVisual,characterHeight} from './characters.js';
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
test('infection changes only the infected actor and selects zombie locomotion',()=>{
  const a=createCharacterVisual(asset,'human'),b=createCharacterVisual(asset,'human');
  const original=b.meshes[0].material.color.getHex();
  setCharacterKind(a,'ally');updateCharacterVisual(a,true,.1);
  assert.equal(a.current.getClip().name,'zombie');
  assert.equal(b.meshes[0].material.color.getHex(),original);
  assert.notEqual(a.meshes[0].material.color.getHex(),original);
  assert.equal(a.marker.visible,true);
  assert.equal(a.infectionAura.visible,true);
  assert.ok(a.meshes[0].material.emissiveIntensity>=.45);
  updateCharacterVisual(a,true,.1,80);assert.equal(a.holder.visible,false);
  updateCharacterVisual(a,true,.1,10);assert.equal(a.holder.visible,true);
});
