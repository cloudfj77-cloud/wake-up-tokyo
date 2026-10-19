// 从已保存的独立工程生成同一批 Web 银行，检查媒体和版本后同步到游戏。
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const config=JSON.parse(await readFile('audio/wwise/config.json','utf8'));
const consolePath=process.env.WWISE_CONSOLE;if(!consolePath)throw Error('请通过 WWISE_CONSOLE 指定匹配版本的 WwiseConsole');
const source=resolve(config.bankSource),project=resolve(config.project);
const xml=await readFile(project,'utf8');
if(!xml.includes('WwiseVersion="v2025.1.10"')||!xml.includes('WwiseBuild="9233"'))throw Error('工程必须使用 Wwise 2025.1.10.9233');
for(const match of xml.matchAll(/<Property\b[^>]*Name="SoundBank(?:Pre|Post)GenerateCustomCmdLines"[^>]*(?:\/>|>[\s\S]*?<\/Property>)/g)){
 const value=match[0].match(/\bValue="([^"]*)"/)?.[1]??'';
 const nested=[...match[0].matchAll(/<Value\b[^>]*>([\s\S]*?)<\/Value>/g)].map(m=>m[1]).join('');
 if((value+nested).trim())throw Error('请先审核工程中的银行生成自定义命令');
}
await mkdir(source,{recursive:true});
const args=['generate-soundbank',project,'--platform','Web','--bank',...config.banks.filter(n=>n!=='Init.bnk').map(n=>n.replace(/\.bnk$/,'')),'--soundbank-path','Web',source,'--root-output-path',source,'--abort-on-load-issues','--no-source-control'];
const run=spawnSync(consolePath,args,{encoding:'utf8',maxBuffer:4*1024*1024});
if(run.status!==0)throw Error('Wwise 导出失败：'+(run.error??run.stdout+run.stderr));
const projectInfo=JSON.parse(await readFile(resolve(source,'ProjectInfo.json'),'utf8'));
if(!JSON.stringify(projectInfo).includes(config.sdkVersion))throw Error('导出器版本与 SDK 不一致');
const target=resolve('audio/wwise/generated/banks');await mkdir(target,{recursive:true});
const names=config.banks.flatMap(name=>[name,name.replace(/\.bnk$/,'.json')]).concat('ProjectInfo.json','PluginInfo.json');
const files=[],events=[],mediaIds=new Set(),streamed=new Map();
for(const name of config.banks){
 const bytes=await readFile(resolve(source,name));if(bytes.toString('ascii',0,4)!=='BKHD'||bytes.readUInt32LE(8)!==172)throw Error('不兼容的银行：'+name);
 const meta=JSON.parse(await readFile(resolve(source,name.replace(/\.bnk$/,'.json')),'utf8'));
 for(const b of meta.SoundBanksInfo.SoundBanks){for(const m of b.Media??[]){mediaIds.add(m.Id);if(m.Streaming==='true'){if(!m.Path||!/^Media\/[0-9]+\.wem$/.test(m.Path))throw Error('Invalid streamed media path');streamed.set(m.Id,m.Path);}else if(m.Location!=='Memory')throw Error('Unsupported media location');}for(const e of b.Events??[])events.push(e.Name);}
}
let selection;try{selection=JSON.parse(await readFile('audio/wwise/sfx-bank-selection.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(selection&&mediaIds.size>selection.maximumMedia)throw Error('导出媒体数超过已批准的限制：'+mediaIds.size);
for(const alias of Object.values(config.events))if(!events.includes(alias))throw Error('缺少事件 '+alias);
for(const name of names){const bytes=await readFile(resolve(source,name));await copyFile(resolve(source,name),resolve(target,name));files.push({file:name,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});}
await mkdir(resolve('audio/wwise/generated/media'),{recursive:true});
const streams=[];for(const [id,path] of streamed){const bytes=await readFile(resolve(source,path)),file=id+'.wem';await copyFile(resolve(source,path),resolve('audio/wwise/generated/media',file));streams.push({id,file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile('audio/wwise/generated/media/manifest.json',JSON.stringify(streams,null,2)+'\n');
await writeFile(resolve(target,'receipt.json'),JSON.stringify({sdkVersion:config.sdkVersion,bankVersion:172,mediaCount:mediaIds.size,streams,events:events.sort(),files},null,2)+'\n');
await writeFile('audio/wwise/generation.json',JSON.stringify({generatedAt:new Date().toISOString(),mediaCount:mediaIds.size,streams,sdkVersion:config.sdkVersion,project:config.project,projectHash:createHash('sha256').update(xml).digest('hex'),command:'WwiseConsole '+args.map(a=>a===project?'<project>':a===source?'<bankSource>':a).join(' '),result:'completed successfully',files},null,2)+'\n');
console.log('已生成并同步 '+config.banks.join(' + ')+'；版本、事件、200 媒体上限及流式文件检查通过。');
