// Build a resource-folder launcher and a self-contained offline Windows EXE.
import {cp,mkdir,readFile,readdir,writeFile,stat,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,join,dirname,relative,sep} from 'node:path';

if(process.platform!=='win32')throw Error('Windows packaging needs the Windows .NET Framework compiler');
const pkg=JSON.parse(await readFile('package.json','utf8'));
const title=pkg.game.title,release=resolve('release'),folder=join(release,title+'-电脑版');
const builds=(await readdir(release)).filter(n=>n.startsWith('wake-up-tokyo-local-')).sort();
if(!builds.length)throw Error('Run scripts/package-local.mjs first');
// This directory contains generated files only. Reusing it would retain obsolete
// hashed chunks after a code change, so verify its exact parent before cleaning.
if(dirname(resolve(folder))!==release||resolve(folder)===release)throw Error('Invalid generated Windows output directory');
await rm(folder,{recursive:true,force:true});
await mkdir(folder,{recursive:true});await cp(join(release,builds.at(-1)),folder,{recursive:true});
const indexHash=createHash('sha256').update(await readFile(join(folder,'index.html'))).digest('hex');
const source=await readFile('scripts/windows-launcher.cs','utf8'),generated=join(release,'windows-build','windows-launcher.generated.cs');
await mkdir(join(release,'windows-build'),{recursive:true});
const compiler=join(process.env.WINDIR||'C:\\Windows','Microsoft.NET','Framework64','v4.0.30319','csc.exe');
const options=['/nologo','/target:winexe','/platform:x64','/optimize+','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.IO.Compression.dll','/reference:System.IO.Compression.FileSystem.dll','/reference:System.Web.Extensions.dll'];
async function compile(out,build,payload){
 await writeFile(generated,source.replaceAll('__GAME_TITLE__',title).replaceAll('__GAME_VERSION__',pkg.version+'.6').replaceAll('__BUILD_ID__',build).replaceAll('__INDEX_HASH__',indexHash));
 const args=[...options,'/out:'+out];if(payload)args.push('/resource:'+payload+',GamePayload.zip');args.push(generated);
 try{execFileSync(compiler,args,{stdio:'pipe'});}catch(error){throw Error(error.stdout?.toString()||error.message);}
}
await compile(join(folder,title+'.exe'),indexHash.slice(0,16));
await writeFile(join(folder,'开始试玩.txt'),title+' · 电脑版\r\n\r\n双击「'+title+'.exe」即可启动，保留启动窗口即可游玩。无需另装 Node.js。\r\nHTML 入口：index.html。请连同 assets、runtime 等目录一起保留。\r\nWASD 移动，鼠标转向，Esc 暂停。\r\n本地离线运行，默认海滨钟楼广场；包含地铁移动与楼梯空气墙修复。\r\n');
const zip=join(release,title+'-HTML资源包.zip');
const psQuote=s=>"'"+s.replaceAll("'","''")+"'";
execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Compress-Archive -LiteralPath '+psQuote(folder)+' -DestinationPath '+psQuote(zip)+' -CompressionLevel Optimal -Force'],{stdio:'pipe'});
const zipHash=createHash('sha256').update(await readFile(zip)).digest('hex'),exe=join(release,title+'.exe');
await compile(exe,zipHash.slice(0,16),zip);
await cp(zip,join(release,title+'-电脑版.zip'));
const artifacts={};for(const [kind,path]of Object.entries({exe,html:zip}))artifacts[kind]={path:relative(process.cwd(),path).split(sep).join('/'),bytes:(await stat(path)).size,sha256:createHash('sha256').update(await readFile(path)).digest('hex')};
await writeFile('verification/windows-desktop-validation.json',JSON.stringify({date:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()),title,build:zipHash.slice(0,16),indexSha256:indexHash,artifacts,htmlEntry:relative(process.cwd(),join(folder,'index.html')).split(sep).join('/'),launchesLocalH5:true,bundledNode:true},null,2)+'\n');
console.log(JSON.stringify({folder,artifacts}));
