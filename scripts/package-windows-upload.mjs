// Flatten the Windows resource folder so the upload console can launch a root EXE.
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';

if(process.platform!=='win32')throw Error('Run Windows packaging on Windows');
const pkg=JSON.parse(await readFile('package.json','utf8')),title=pkg.game.title;
const source=resolve('release',title+'-电脑版'),entry=title+'.exe';
for(const file of [entry,'index.html','serve.mjs','runtime/node.exe'])await stat(join(source,file));
const stamp=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date()).replace(/\D/g,'');
const output=resolve('release','Windows上传包-'+stamp);await mkdir(output,{recursive:false});
const archive=join(output,title+'-Windows上传包.zip');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
 `Add-Type -AssemblyName System.IO.Compression.FileSystem\n[System.IO.Compression.ZipFile]::CreateFromDirectory(${quote(source)},${quote(archive)},[System.IO.Compression.CompressionLevel]::Optimal,$false)`],{stdio:'pipe',windowsHide:true});
const manifest={version:pkg.version,title,archive,executableRelativePath:entry,bytes:(await stat(archive)).size,sha256:createHash('sha256').update(await readFile(archive)).digest('hex')};
await writeFile(join(output,'上传参数.txt'),`Windows 上传包：${title}-Windows上传包.zip\r\n可执行文件相对路径：${entry}\r\n启动参数：留空\r\n\r\nEXE 位于 ZIP 根目录。平台内上传整个 ZIP，启动路径不要填写电脑盘符或本地完整路径。\r\n`);
await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
