import test from 'node:test';
import assert from 'node:assert/strict';
import {HIT_RESPONSE,flashCharacter,restoreCharacterFlash,stepCharacterFlash,stepHitStop} from './hit-response.js';
test('heavy attacks stop longer and recoil harder than light attacks',()=>{
 for(const key of ['stop','flash','recoil','tilt','kick','burst','duration'])assert.ok(HIT_RESPONSE.heavy[key]>HIT_RESPONSE.light[key],key);
 assert.equal(HIT_RESPONSE.light.stop,.035);assert.equal(HIT_RESPONSE.heavy.stop,.085);
});
test('hit stop consumes real time without running or catching up the simulation',()=>{
 let hold=.085,total=0;
 for(let i=0;i<6;i++){const r=stepHitStop(hold,.02);hold=r.remaining;total+=r.dt;}
 assert.equal(hold,0);assert.ok(Math.abs(total-(.12-.085))<1e-9);
 assert.deepEqual(stepHitStop(0,.016),{remaining:0,dt:.016});
});
test('flashing one soldier restores exact materials and leaves other soldiers unchanged',()=>{
 const shared={name:'shared guard material'},array=[shared,{name:'second surface'}],white={name:'white'};
 const a={meshes:[{material:shared},{material:array}]},b={meshes:[{material:shared}]};
 flashCharacter(a,white,.055);assert.equal(a.meshes[0].material,white);assert.equal(b.meshes[0].material,shared);
 stepCharacterFlash(a,0);assert.equal(a.meshes[0].material,white); // 顿帧中保持闪白。
 flashCharacter(a,white,.11);stepCharacterFlash(a,.06);assert.equal(a.meshes[0].material,white);
 stepCharacterFlash(a,.06);assert.equal(a.meshes[0].material,shared);assert.equal(a.meshes[1].material,array);
 flashCharacter(a,white,.1);restoreCharacterFlash(a);assert.equal(a.meshes[0].material,shared);assert.equal(a.hitFlash,null);
});
