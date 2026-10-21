import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {withJapaneseRadio} from './japanese-radio.js';
import radio from './japanese-radio.json' with {type:'json'};
import {SfxDirector} from './sfx-director.mjs';

class TestAudio extends EventTarget{
 constructor(src){super();this.src=src;this.currentTime=0;this.ended=false;this.paused=true;}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
 removeAttribute(){this.src='';}
 load(){}
}
test('every escalation uses a packaged Japanese clip with verified audio bytes',()=>{
 assert.equal(radio.language,'ja-JP');
 for(let i=2;i<=6;i++){
  const line=radio.lines['radio'+i],bytes=readFileSync('public'+line.file);
  assert.match(line.text,/[ぁ-んァ-ヶ]/);assert.ok(line.seconds>3&&line.seconds<12);
  assert.equal(bytes.toString('ascii',0,4),'OggS');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),line.sha256);
 }
});
test('desktop and mobile radio intercept English events and preserve volume, pause and cleanup',()=>{
 const events=[],media=[];let disposed=false;
 const base={postEvent:(...args)=>(events.push(args),10),setRTPC(){},stopPlaying(){throw Error('negative radio ID reached backend');},snapshot:()=>({backend:'test'}),dispose(){disposed=true;}};
 const audio=withJapaneseRadio(base,{createAudio:url=>{const a=new TestAudio(url);media.push(a);return a;}});
 audio.setRTPC('Voice_GainDb',-20);const id=audio.postEvent('sfx.radio2',1000);
 assert.ok(id<0);assert.equal(media[0].src,'/radio-ja/radio2.ogg');assert.equal(media[0].volume,.1);assert.equal(events.length,0);
 audio.postEvent('sfx.Pause',90);assert.equal(media[0].paused,true);
 audio.postEvent('sfx.Resume',90);assert.equal(media[0].paused,false);
 audio.setRTPC('Voice_GainDb',-96);assert.ok(media[0].volume<.00002);
 const second=audio.postEvent('sfx.radio5',1001);assert.equal(audio.playingStatus(id).playing,false);assert.equal(audio.playingStatus(second).playing,true);
 audio.stopPlaying(second);assert.equal(audio.snapshot().radioVoices,0);
 audio.postEvent('sfx.radio6',1002);audio.postEvent('sfx.Stop',90);assert.equal(audio.snapshot().radioVoices,0);
 assert.ok(events.every(([name])=>!/^sfx\.radio/.test(name)));
 audio.dispose();assert.equal(disposed,true);assert.equal(audio.postEvent('sfx.radio2',1000),0);
});
test('Chinese captions and the queue use Japanese clip durations',()=>{
 let now=0;const captions=[];
 const base={registerGameObject(){},unregisterGameObject(){},setPosition(){},setRTPC(){},postEvent(){return 1;}};
 const sfx=new SfxDirector({getAudio:()=>base,now:()=>now,onRadio:x=>captions.push(x)});sfx.bind();
 sfx.queueVoice('radio2','unused fallback');sfx.queueVoice('radio3','unused fallback');
 now=radio.lines.radio2.seconds-.1;sfx.updateRadio();assert.equal(sfx.radio.key,'radio2');
 now+=.3;sfx.updateRadio();assert.equal(sfx.radio.key,'radio3');assert.ok(captions.includes(radio.lines.radio2.caption));
});
