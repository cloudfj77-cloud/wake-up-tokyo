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
test('infection keeps the authored look and switches from shambling to rabid locomotion',()=>{
  const a=createCharacterVisual(asset,'human'),b=createCharacterVisual(asset,'human');
  const original=a.meshes[0].material.color.getHex();
  const markerBefore=a.marker.material.color.getHex();
  // 感染前：打工人麻木蹒跚
  updateCharacterVisual(a,true,.1);
  assert.equal(a.current.getClip().name,'zombie');
  // 感染后：亢奋癫狂
  setCharacterKind(a,'ally');updateCharacterVisual(a,true,.1);
  assert.equal(a.current.getClip().name,'jump');
  // 模型外观沿用美术自带材质，感染不再重新染色
  assert.equal(a.meshes[0].material.color.getHex(),original);
  assert.equal(b.meshes[0].material.color.getHex(),original);
  // 阵营差异只体现在脚下光环
  assert.notEqual(a.marker.material.color.getHex(),markerBefore);
  assert.equal(a.marker.visible,true);
  assert.equal(b.marker.visible,false);
  updateCharacterVisual(a,true,.1,80);assert.equal(a.holder.visible,false);
  updateCharacterVisual(a,true,.1,10);assert.equal(a.holder.visible,true);
});
