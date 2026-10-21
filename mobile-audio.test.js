import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createMobileAudio} from './mobile-audio.js';
class FakeAudio extends EventTarget{
 constructor(url){super();this.src=url;this.currentTime=0;this.ended=false;this.paused=true;}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
 removeAttribute(){this.src='';}
 load(){}
}
test('all 200 authored compatibility clips exist and every event has media',()=>{
 const catalog=JSON.parse(readFileSync('mobile-audio-catalog.json'));
 let count=0;for(const cue of Object.values(catalog)){assert.ok(cue.clips.length);for(const clip of cue.clips){assert.ok(existsSync('public'+clip),clip);count++;}}
 assert.equal(count,200);
});
test('mobile audio handles music replacement, effects, pause, resume and disposal',async()=>{
 const original=globalThis.Audio;globalThis.Audio=FakeAudio;
 try{
  const a=await createMobileAudio();a.registerGameObject(77);a.setRTPC('Music_GainDb',-10);
  const menu=a.postEvent('menu',77);assert.equal(a.playingStatus(menu).playing,true);
  const street=a.postEvent('street',77);assert.equal(a.playingStatus(menu).playing,false);
  a.postEvent('sfx.meleeLight',1000);assert.equal(a.snapshot().voices,2);
  a.setPosition(1000,{x:3,z:4});a.setListener({x:0,z:0});a.postEvent('pause',77);a.postEvent('sfx.Pause',90);
  a.postEvent('resume',77);a.postEvent('sfx.Resume',90);assert.equal(a.playingStatus(street).playing,true);
  a.dispose();assert.equal(a.snapshot().voices,0);assert.equal(a.postEvent('menu',77),0);
 }finally{globalThis.Audio=original;}
});
