import {MusicDirector} from './music-director.mjs';
import {SfxDirector} from './sfx-director.mjs';
// 游戏只持有一个 Wwise 引擎。所有音乐、音效和固定电台都通过同一输出与生命周期。
export class Soundtrack {
 constructor({director=new MusicDirector(),sfx}={}){
  this.director=director;this.volume=.38;this.muted=false;this.enabled=false;this.onRadio=null;
  this.sfx=sfx??new SfxDirector({getAudio:()=>this.director.audio,onRadio:text=>{this.director.duck(!!text);this.onRadio?.(text);}});
 }
 async start(){this.director.setVolume(this.volume);this.director.setMuted(this.muted);const ready=await this.director.start();this.enabled=!!ready;this.sfx.bind();this.sfx.setVolume(this.volume);this.sfx.setMuted(this.muted);return this.enabled;}
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));this.director.setVolume(this.volume);this.sfx.setVolume(this.volume);}
 setVoiceVolume(v){this.sfx.setVoiceVolume(v);}
 toggle(){this.muted=!this.muted;this.director.setMuted(this.muted);this.sfx.setMuted(this.muted);return !this.muted;}
 update(view){this.director.update(view);this.sfx.update(view);}
 duck(on){this.director.duck(on);}
 speak(stage,text){return this.sfx.queueVoice('radio'+stage,text);}
 hush(){this.sfx.stopRadio();}
 stopBed(){this.director.stop();}
 effect(type,step=0,position){return this.sfx.emit(type,{step,position});}
 pause(){this.director.pause();this.sfx.setPaused(true);}
 resume(){this.director.resume();this.sfx.setPaused(false);}
 dispose(){this.sfx.dispose();this.director.dispose();this.enabled=false;}
}
