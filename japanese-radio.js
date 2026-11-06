import radio from './japanese-radio.json' with {type:'json'};

// Both audio backends use the same packaged Japanese recordings. Keeping radio
// media separate also avoids depending on the OS's installed speech languages.
export function withJapaneseRadio(base,{createAudio=url=>new Audio(url)}={}){
 const playing=new Map();let serial=0,gainDb=-10,disposed=false;
 const stop=id=>{const audio=playing.get(id);if(!audio)return;audio.pause();audio.removeAttribute('src');audio.load();playing.delete(id);};
 const volume=()=>Math.max(0,Math.min(1,10**(gainDb/20)));
 return {...base,
  postEvent(key,object){
   if(disposed)return 0;
   const line=radio.lines[key.replace(/^sfx\./,'')];
   if(key.startsWith('sfx.')&&line){
    for(const id of playing.keys())stop(id);
    const audio=createAudio(line.file),id=--serial;audio.volume=volume();audio.preload='auto';playing.set(id,audio);
    audio.addEventListener('ended',()=>stop(id));audio.addEventListener('error',()=>stop(id));
    audio.play().catch(()=>stop(id));return id;
   }
   if(key==='sfx.Stop')for(const id of playing.keys())stop(id);
   if(key==='sfx.Pause')for(const audio of playing.values())audio.pause();
   if(key==='sfx.Resume')for(const [id,audio]of playing)audio.play().catch(()=>stop(id));
   return base.postEvent(key,object);
  },
  setRTPC(key,value,...args){if(key==='Voice_GainDb'){gainDb=value;for(const audio of playing.values())audio.volume=volume();}return base.setRTPC(key,value,...args);},
  stopPlaying(id,...args){if(id<0)stop(id);else base.stopPlaying(id,...args);},
  playingStatus(id){if(id>=0)return base.playingStatus?.(id);const audio=playing.get(id);return {playing:!!audio&&!audio.ended,positionMs:audio?Math.round(audio.currentTime*1000):0};},
  snapshot(){return {...base.snapshot?.(),radioLanguage:radio.language,radioVoices:playing.size};},
  dispose(){disposed=true;for(const id of playing.keys())stop(id);base.dispose();},
 };
}
