import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ffmpeg=require('@ffmpeg-installer/ffmpeg').path;
const music=JSON.parse(readFileSync('audio/wwise/cues.json'));
const sfx=JSON.parse(readFileSync('audio/wwise/sfx-cues.json'));
const radio=JSON.parse(readFileSync('japanese-radio.json'));
const selected=JSON.parse(readFileSync('audio/wwise/sfx-bank-selection.json')).families;
const dir='public/mobile-audio';mkdirSync(dir,{recursive:true});
const catalog={};
function convert(src,name){
 const output=dir+'/'+name+'.ogg';
 if(!existsSync(output)){
  const result=spawnSync(ffmpeg,['-v','error','-y','-i',src,'-c:a','libvorbis','-q:a','3',output],{encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr);
 }
 return '/mobile-audio/'+name+'.ogg';
}
for(const cue of music)catalog[cue.key]={loop:cue.loop,loopBegin:cue.loopBegin,loopEnd:cue.loopEnd,clips:[convert(cue.originalInProject,'music-'+cue.key)]};
for(const cue of sfx)catalog['sfx.'+cue.key]={loop:cue.loop,spatial:cue.spatial,gainDb:cue.volumeDb??0,clips:radio.lines[cue.key]?[radio.lines[cue.key].file]:cue.clips.filter(c=>selected[cue.key]?.includes(c.assetId)).map((c,i)=>convert(c.file,'sfx-'+cue.key+'-'+i))};
writeFileSync('mobile-audio-catalog.json',JSON.stringify(catalog));
console.log('Prepared Android compatibility audio:',Object.keys(catalog).length,'events');
