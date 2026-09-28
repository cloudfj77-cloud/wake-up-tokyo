import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {VectorKeyframeTrack,AnimationClip} from 'three';
import {stripRootMotion,clipToSkeleton} from './mixamo.js';
const publicFile=path=>new URL('./public/'+path,import.meta.url);
test('all shipped character FBX files contain skinned meshes and animation',async()=>{
 const manifest=JSON.parse(await readFile(publicFile('mixamo/manifest.json'),'utf8'));
 const paths=new Set([manifest.model,...Object.values(manifest.clips)].map(f=>'mixamo/'+f));
 for(const path of ['workers/thriller-idle.fbx','workers/sad-walk.fbx','awakened/running-jump.fbx','awakened-reader/running-jump.fbx'])paths.add(path);
 for(const path of paths){
  const buffer=await readFile(publicFile(path));
  const model=new FBXLoader().parse(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
  let skinned=0;model.traverse(n=>{if(n.isSkinnedMesh)skinned++;});
  assert.ok(skinned>0,path+' has skinned geometry');assert.ok(model.animations.length>0,path+' has animation');
 }
 for(const dir of ['mixamo','workers','awakened','awakened-reader']){
  for(const name of ['base_color','normal','roughness','metallic'])await access(publicFile(`${dir}/tex/${name}.png`));
 }
});
test('root-motion cleanup preserves jump height and prunes absent bones',()=>{
 const clip=new AnimationClip('roll',1,[new VectorKeyframeTrack('mixamorigHips.position',[0,1],[1,2,3,4,5,6]),new VectorKeyframeTrack('Missing.position',[0,1],[0,0,0,1,1,1])]);
 stripRootMotion(clip);clipToSkeleton(clip,new Set(['mixamorigHips']));
 assert.equal(clip.tracks.length,1);assert.deepEqual([...clip.tracks[0].values],[1,2,3,1,5,3]);
});
