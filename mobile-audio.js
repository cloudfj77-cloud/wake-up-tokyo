import catalog from './mobile-audio-catalog.json' with {type:'json'};

// Android WebView has no SharedArrayBuffer on many devices. Play the same
// authored sources through media elements without requiring WASM threads.
export async function createMobileAudio() {
  const playing=new Map(), positions=new Map(), rtpc=new Map();
  let serial=0, listener={x:0,y:0,z:0}, disposed=false;
  const gain=(key,fallback=0)=>10**((rtpc.get(key)??fallback)/20);
  const volume=entry=>{
    const music=!entry.key.startsWith('sfx.');
    const voice=entry.key.startsWith('sfx.radio');
    const bus=music?'Music_GainDb':voice?'Voice_GainDb':'SFX_GainDb';
    const position=positions.get(entry.object);
    const distance=position&&entry.cue.spatial==='world'?Math.hypot(position.x-listener.x,(position.y??0)-(listener.y??0),position.z-listener.z):0;
    entry.audio.volume=Math.max(0,Math.min(1,gain(bus)*gain(music?'Music_DuckDb':'unused')*10**((entry.cue.gainDb??0)/20)/(1+distance*.12)));
  };
  const stop=id=>{const e=playing.get(id);if(e){e.audio.pause();e.audio.removeAttribute('src');e.audio.load();playing.delete(id);}};
  const matching=music=>[...playing].filter(([,e])=>!e.key.startsWith('sfx.')===music);
  return {
    registerGameObject(){},
    unregisterGameObject(id){positions.delete(id);},
    setPosition(id,p){positions.set(id,{...p});for(const e of playing.values())if(e.object===id)volume(e);},
    setListener(p){listener={...p};for(const e of playing.values())volume(e);},
    setRTPC(key,value){rtpc.set(key,value);for(const e of playing.values())volume(e);},
    postEvent(key,object){
      if(disposed)return 0;
      const music=!key.startsWith('sfx.'), command=key.replace('sfx.','').toLowerCase();
      if(['stop','pause','resume'].includes(command)){
        for(const [id,e]of matching(music)){
          if(command==='stop')stop(id);
          else if(command==='pause'){e.paused=true;e.audio.pause();}
          else {e.paused=false;e.audio.play().catch(()=>{});}
        }
        return 0;
      }
      const aftermath=key==='victoryAftermath';if(aftermath)key='victory';
      const cue=aftermath?{...catalog[key],loop:true}:catalog[key];if(!cue?.clips.length)return 0;
      if(music)for(const[id]of matching(true))stop(id);
      // Bound simultaneous mobile voices; preserve music and radio.
      const effects=matching(false).filter(([,e])=>!e.key.startsWith('sfx.radio'));
      if(effects.length>=24)stop(effects[0][0]);
      const audio=new Audio(cue.clips[Math.floor(Math.random()*cue.clips.length)]);
      const id=++serial,entry={audio,key,cue,object,paused:false};
      audio.loop=!!cue.loop;audio.preload='auto';volume(entry);playing.set(id,entry);
      if(cue.loop&&cue.loopEnd)audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=cue.loopEnd)audio.currentTime=cue.loopBegin??0;});
      audio.addEventListener('ended',()=>{if(!cue.loop)stop(id);});
      audio.addEventListener('error',()=>stop(id));
      audio.play().catch(()=>stop(id));
      return id;
    },
    stopPlaying(id){stop(id);},
    playingStatus(id){const e=playing.get(id);return {playing:!!e&&!e.audio.ended,positionMs:e?Math.round(e.audio.currentTime*1000):0};},
    snapshot(){return {backend:'android-media-compatibility',voices:playing.size,disposed};},
    dispose(){disposed=true;for(const[id]of playing)stop(id);positions.clear();},
  };
}
