// Native SoundBanks are separate from the browser runtime. Never stage Web Init.bnk here.
import {readFile,writeFile,mkdir,readdir,cp,rename,rm} from 'node:fs/promises';
import {resolve,join,relative,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';

export const repository=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const platforms=['Windows','Android'];
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const nativeRoot=platform=>join(repository,'audio/wwise/generated/native',platform);
function validPlatform(platform){assert(platforms.includes(platform),'Expected --platform Windows or Android');return platform;}
async function settings(){return {config:await json(join(repository,'audio/wwise/config.json')),reference:await json(join(repository,'audio/wwise/generated/banks/receipt.json'))};}

export function inspectBank(bytes){
 assert(bytes.length>=12&&bytes.toString('ascii',0,4)==='BKHD','Invalid SoundBank header');
 const result={version:bytes.readUInt32LE(8),media:[],platform:null};let data;
 for(let offset=0;offset<bytes.length;){
  assert(offset+8<=bytes.length,'Truncated bank chunk');
  const tag=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4),end=offset+8+length;
  assert(end<=bytes.length,'Truncated bank '+tag);const b=bytes.subarray(offset+8,end);
  if(tag==='PLAT')result.platform=b.toString('utf8').replace(/\0.*$/s,'');
  if(tag==='DATA')data=b;
  if(tag==='DIDX'){assert(length%12===0,'Invalid media index');for(let i=0;i<length;i+=12)result.media.push({id:String(b.readUInt32LE(i)),offset:b.readUInt32LE(i+4),bytes:b.readUInt32LE(i+8)});}
  offset=end;
 }
 for(const m of result.media){assert(data&&m.offset+m.bytes<=data.length,'Media outside bank DATA: '+m.id);assertVorbis(data.subarray(m.offset,m.offset+m.bytes),m.id);}
 return result;
}
function assertVorbis(bytes,name){
 assert(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE','Invalid WEM '+name);
 for(let i=12;i+8<=bytes.length;){const tag=bytes.toString('ascii',i,i+4),length=bytes.readUInt32LE(i+4);if(tag==='fmt '){assert(length>=2&&i+10<=bytes.length&&bytes.readUInt16LE(i+8)===0xffff,'Expected Wwise Vorbis, not uncompressed/fallback media: '+name);return;}i+=8+length+(length%2);}
 throw Error('Missing Vorbis format: '+name);
}
function sameSet(a,b){return a.size===b.size&&[...a].every(v=>b.has(v));}

export async function inspectNativeDelivery(root,platform){
 validPlatform(platform);root=resolve(root);const {config,reference}=await settings();
 const project=(await json(join(root,'ProjectInfo.json'))).ProjectInfo;
 const info=(await json(join(root,'PlatformInfo.json'))).PlatformInfo;
 const plugins=(await json(join(root,'PluginInfo.json'))).PluginInfo;
 assert(project.Project.Generator===config.sdkVersion,'Wwise generator/SDK mismatch');
 assert(project.Project.GUID==='{E5D4C90C-5E88-452C-9CA0-19EC782CEC8F}','Wrong Wwise project');
 assert(info.Platform.Name===platform&&info.Platform.BasePlatform===platform&&info.Platform.Generator===config.sdkVersion,'PlatformInfo mismatch: '+platform);
 assert(plugins.Platform===platform&&plugins.BasePlatform===platform,'PluginInfo platform mismatch');
 assert(info.Settings.CopyLooseStreamedMediaFiles==='true','Loose streamed media copying is disabled');
 const ids=new Set(),streams=new Map(),events=new Map(),bankMedia={};
 const names=['ProjectInfo.json','PlatformInfo.json','PluginInfo.json'];let bankBytes=0;
 for(const name of config.banks){
  const bytes=await readFile(join(root,name)),binary=inspectBank(bytes);
  assert(binary.version===reference.bankVersion,'Bank version mismatch: '+name);
  if(name==='Init.bnk')assert(binary.platform===platform,'Init.bnk binary platform mismatch: '+binary.platform);
  const meta=(await json(join(root,name.replace('.bnk','.json')))).SoundBanksInfo;
  assert(meta.Platform===platform&&meta.BasePlatform===platform&&Number(meta.SoundBankVersion)===reference.bankVersion,'Bank metadata platform/version mismatch: '+name);
  const local=new Set();
  for(const bank of meta.SoundBanks){
   assert(bank.Path===name,'Unexpected bank path');
   for(const event of bank.Events??[])events.set(event.Name,String(event.Id));
   for(const m of bank.Media??[]){
    ids.add(m.Id);local.add(m.Id);
    if(m.Streaming==='true'){
     assert(m.Path===`Media/${m.Id}.wem`,'Unsafe/unexpected stream path');
     assert(m.ContainsPrefetch==='true'&&Number(m.PrefetchSize)>0,'Missing streaming prefetch: '+m.Id);
     streams.set(m.Id,{id:m.Id,file:m.Path,prefetchBytes:Number(m.PrefetchSize)});
    }else assert(m.Location==='Memory','Unsupported native media location');
   }
  }
  assert(sameSet(local,new Set(binary.media.map(m=>m.id))),'Bank media index/metadata mismatch: '+name);
  const web=(await json(join(repository,'audio/wwise/generated/banks',name.replace('.bnk','.json')))).SoundBanksInfo;
  assert(sameSet(local,new Set(web.SoundBanks.flatMap(b=>(b.Media??[]).map(m=>m.Id)))),'Selected media differs from approved Web selection: '+name);
  for(const event of web.SoundBanks.flatMap(b=>b.Events??[]))assert(events.get(event.Name)===String(event.Id),'Event ID differs between platforms: '+event.Name);
  bankMedia[name]=local.size;bankBytes+=bytes.length;names.push(name,name.replace('.bnk','.json'));
 }
 assert(ids.size===reference.mediaCount&&ids.size<=config.streaming.maximumMedia,'Native media limit/selection mismatch: '+ids.size);
 assert(streams.size===reference.streams.length,'Native streaming count mismatch: '+streams.size);
 assert(sameSet(new Set(streams.keys()),new Set(reference.streams.map(s=>s.id))),'Native streamed media IDs differ');
 for(const event of Object.values(config.events))assert(events.has(event),'Missing gameplay event: '+event);
 let streamBytes=0;
 for(const stream of streams.values()){const b=await readFile(join(root,stream.file));assertVorbis(b,stream.file);assert(b.length>stream.prefetchBytes,'Stream contains only prefetch bytes: '+stream.file);stream.bytes=b.length;streamBytes+=b.length;names.push(stream.file);}
 const files=[];for(const file of names.sort()){const b=await readFile(join(root,file));files.push({file,bytes:b.length,sha256:sha(b)});}
 return {schemaVersion:1,platform,basePlatform:platform,sdkVersion:config.sdkVersion,bankVersion:reference.bankVersion,maximumMedia:config.streaming.maximumMedia,mediaCount:ids.size,mediaByBank:bankMedia,streams:[...streams.values()].sort((a,b)=>a.id.localeCompare(b.id)),eventIds:Object.fromEntries([...events].sort(([a],[b])=>a.localeCompare(b))),bankBytes,streamBytes,audioBytes:bankBytes+streamBytes,requiredCodecLibraries:['AkVorbisDecoder'],files};
}

export async function verifyNativePackage(root,platform,{expectedManifest}={}){
 validPlatform(platform);root=resolve(root);const manifest=await json(join(root,'audio-manifest.json'));
 assert(manifest.platform===platform,'Packaged audio platform mismatch');
 if(expectedManifest)assert(JSON.stringify(manifest)===JSON.stringify(expectedManifest),'Packaged manifest differs from generated delivery');
 const {config}=await settings();
 assert(manifest.projectFingerprint===await projectFingerprint(resolve(repository,config.project)),'Wwise sources changed after native generation; regenerate before packaging');
 const requiredFiles=new Set();
 for(const entry of manifest.files){
  assert(/^(?:[A-Za-z0-9_-]+\.(?:json|bnk)|Media\/[0-9]+\.wem)$/.test(entry.file),'Invalid manifest path');
  assert(!requiredFiles.has(entry.file),'Duplicate manifest path');requiredFiles.add(entry.file);
  const bytes=await readFile(join(root,entry.file));assert(bytes.length===entry.bytes&&sha(bytes)===entry.sha256,'Packaged audio hash mismatch: '+entry.file);
 }
 async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await scan(p);else if(/\.(?:bnk|wem|wav|mp3|ogg|gz)$/i.test(e.name))assert(requiredFiles.has(relative(root,p).replaceAll('\\','/')),'Unexpected audio file in package: '+relative(root,p));}}
 await scan(root);const inspected=await inspectNativeDelivery(root,platform);
 for(const key of Object.keys(inspected))assert(JSON.stringify(inspected[key])===JSON.stringify(manifest[key]),'Native manifest/content mismatch: '+key);
 return {ok:true,platform,mediaCount:manifest.mediaCount,streamedMedia:manifest.streams.length,bankBytes:manifest.bankBytes,streamBytes:manifest.streamBytes,audioBytes:manifest.audioBytes,verifiedFiles:manifest.files.length,diskOnly:true};
}

async function projectFingerprint(project){
 const files=[];async function scan(dir){for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){if(e.name.startsWith('.')||e.name==='GeneratedSoundBanks')continue;const p=join(dir,e.name);if(e.isDirectory())await scan(p);else if(/\.(?:wproj|wwu|wav)$/i.test(e.name))files.push([relative(repository,p).replaceAll('\\','/'),sha(await readFile(p))]);}}
 await scan(dirname(project));return sha(Buffer.from(JSON.stringify(files)));
}
export async function generateNative(platform){
 validPlatform(platform);const {config}=await settings(),consolePath=process.env.WWISE_CONSOLE;
 assert(consolePath,'Set WWISE_CONSOLE to Wwise 2025.1.10.9233 WwiseConsole');
 const project=resolve(repository,config.project),xml=await readFile(project,'utf8');
 assert(xml.includes('WwiseVersion="v2025.1.10"')&&xml.includes('WwiseBuild="9233"'),'Use matching Wwise authoring version');
 assert(xml.includes(`Platform Name="${platform}" ReferencePlatform="${platform}"`),'Native platform missing from Wwise project');
 for(const match of xml.matchAll(/<Property\b[^>]*Name="SoundBank(?:Pre|Post)GenerateCustomCmdLines"[^>]*(?:\/>|>[\s\S]*?<\/Property>)/g)){
  const values=(match[0].match(/\bValue="([^"]*)"/)?.[1]??'')+[...match[0].matchAll(/<Value\b[^>]*>([\s\S]*?)<\/Value>/g)].map(m=>m[1]).join('');assert(!values.trim(),'Review project bank-generation custom commands first');
 }
 const fingerprint=await projectFingerprint(project),source=join(dirname(project),'GeneratedSoundBanks',platform);await mkdir(source,{recursive:true});
 const args=['generate-soundbank',project,'--platform',platform,'--bank',...config.banks.filter(n=>n!=='Init.bnk').map(n=>n.replace('.bnk','')),'--soundbank-path',platform,source,'--root-output-path',source,'--abort-on-load-issues','--no-source-control'];
 const run=spawnSync(consolePath,args,{cwd:repository,encoding:'utf8',maxBuffer:8*1024*1024});
 assert(run.status===0,'Wwise generation failed: '+(run.error??run.stdout+run.stderr));
 assert(fingerprint===await projectFingerprint(project),'Project changed during SoundBank generation');
 const manifest={...await inspectNativeDelivery(source,platform),generationId:randomUUID(),projectFingerprint:fingerprint};
 const target=nativeRoot(platform),stage=target+'.stage-'+randomUUID();await mkdir(stage,{recursive:true});
 try{
  for(const file of manifest.files){const to=join(stage,file.file);await mkdir(dirname(to),{recursive:true});await cp(join(source,file.file),to);}
  await writeFile(join(stage,'audio-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const provenance={generatedAt:new Date().toISOString(),generationId:manifest.generationId,project:config.project,projectFingerprint:fingerprint,sdkVersion:config.sdkVersion,command:['WwiseConsole',...args.map(a=>a===project?'<project>':a===source?'<platform-output>':a)].join(' '),result:run.stdout.trim()};
  await writeFile(join(stage,'generation.json'),JSON.stringify(provenance,null,2)+'\n');
  await verifyNativePackage(stage,platform);await rm(target,{recursive:true,force:true});await rename(stage,target);
 }finally{await rm(stage,{recursive:true,force:true});}
 return verifyNativePackage(target,platform);
}

export async function packageNative(platform,output){
 validPlatform(platform);const source=nativeRoot(platform),manifest=await json(join(source,'audio-manifest.json'));await verifyNativePackage(source,platform);
 const dest=resolve(output),bankRoot=join(dest,platform==='Android'?'assets':'audio','wwise',platform);
 // A fresh output folder avoids leaving stale banks from a previous build.
 await mkdir(dirname(dest),{recursive:true});await mkdir(dest,{recursive:false});await mkdir(dirname(bankRoot),{recursive:true});await cp(source,bankRoot,{recursive:true});
 if(platform==='Android')await cp(join(repository,'scripts/wwise/templates/android-audio.gradle'),join(dest,'wwise-audio.gradle'));
 await cp(join(repository,'scripts/wwise/verify-native-archive.py'),join(dest,'verify-native-archive.py'));
 const prefix=relative(dest,bankRoot).replaceAll('\\','/');
 const verification=platform==='Android'?`python3 verify-native-archive.py --apk /path/to/app.apk --manifest ${prefix}/audio-manifest.json --prefix ${prefix}`:`python3 verify-native-archive.py --archive /path/to/final.zip --platform Windows --manifest ${prefix}/audio-manifest.json --prefix ${prefix}`;
 await writeFile(join(dest,'INTEGRATION.txt'),`Wake Up Tokyo / ${platform} / Wwise ${manifest.sdkVersion}\nSoundBank-only delivery, not a game executable.\nKeep the entire ${prefix} folder, including Media/*.wem.\nLoad Init.bnk before TokyoMusic.bnk and TokyoSfx.bnk. Add both the bank directory and its Media directory to the native IO search paths (or use an equivalent custom resolver).\nThe host must provide matching Wwise SoundEngine, StreamMgr and Vorbis decoder; configure real System audio output and lifecycle suspend/resume.\n${platform==='Android'?'Android: merge wwise-audio.gradle into the application module; preserve seekable bnk/wem assets.\n':''}After packaging, run from this delivery folder (adjust --prefix if the host uses a different directory):\n${verification}\nOn Windows, py -3 can replace python3.\n`);
 return {...await verifyNativePackage(bankRoot,platform,{expectedManifest:manifest}),output:dest,bankRoot};
}

async function cli(){
 const [command,...argv]=process.argv.slice(2),options={};for(let i=0;i<argv.length;i+=2){assert(argv[i].startsWith('--')&&argv[i+1],'Expected --option value');assert(['--platform','--root','--out'].includes(argv[i]),'Unknown option: '+argv[i]);options[argv[i]]=argv[i+1];}
 const targets=options['--platform']?[validPlatform(options['--platform'])]:platforms;
 assert(['generate','verify','package'].includes(command),'Usage: node scripts/wwise/native-delivery.mjs generate|verify|package [--platform Windows|Android] [--root bank-folder] [--out new-output-folder]');
 assert(!options['--root']||command==='verify'&&targets.length===1,'--root requires verify --platform');assert(!options['--out']||command==='package'&&targets.length===1,'--out requires package --platform');
 for(const platform of targets){let result;
  if(command==='generate')result=await generateNative(platform);
  else if(command==='verify'){const sourceManifest=await json(join(nativeRoot(platform),'audio-manifest.json'));result=await verifyNativePackage(options['--root']??nativeRoot(platform),platform,{expectedManifest:sourceManifest});}
  else{const version=(await json(join(repository,'package.json'))).version;result=await packageNative(platform,options['--out']??join(repository,'release',`wake-up-tokyo-audio-${version}-${platform}-${Date.now()}`));}
  console.log(JSON.stringify(result));
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)cli().catch(error=>{console.error(error.message);process.exitCode=1;});
