// 只打包已构建资源和本地启动器，收件人无需 Wwise 或开发依赖。
import {cp,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {compactPackage} from './compact-package.mjs';
await access('dist/index.html');
const output=resolve('release','wake-up-tokyo-local-'+new Date().toISOString().replaceAll(':','-').replaceAll('.','-'));
await mkdir(output,{recursive:true});await cp('dist',output,{recursive:true});
await cp('scripts/launch-mac.command',resolve(output,'启动游戏-Mac.command'));
await cp('scripts/serve.mjs',resolve(output,'serve.mjs'));
if(process.platform==='win32'){
 await mkdir(resolve(output,'runtime'),{recursive:true});
 await cp(process.execPath,resolve(output,'runtime/node.exe'));
 await cp(resolve(dirname(process.execPath),'LICENSE'),resolve(output,'runtime/Node-LICENSE.txt'));
}
await writeFile(resolve(output,'启动游戏-Windows.bat'),'@echo off\r\ncd /d "%~dp0"\r\nset "WAKE_NODE=%~dp0runtime\\node.exe"\r\nif not exist "%WAKE_NODE%" set "WAKE_NODE=node"\r\nstart "" http://127.0.0.1:5310/\r\n"%WAKE_NODE%" serve.mjs 5310 .\r\npause\r\n');
await writeFile(resolve(output,'开始试玩.txt'),'Windows：解压完整文件夹，双击「启动游戏-Windows.bat」。已附运行环境，无需另装 Node.js。\nMac：双击「启动游戏-Mac.command」，需要 Node.js。\n浏览器打开 http://127.0.0.1:5310/。游玩期间保留启动窗口。\n默认海滨钟楼广场；WASD 移动，鼠标或右键拖动转向，方向键也可转向。Esc 暂停。\n请保留整个文件夹；直接双击 index.html 无法启用游戏资源与声音。\n');
const compact=await compactPackage(output);
console.log(JSON.stringify({output,sourceBytes:compact.sourceBytes,storedBytes:compact.storedBytes,reduction:compact.reduction}));
