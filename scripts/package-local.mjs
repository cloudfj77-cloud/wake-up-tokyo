// 只打包已构建资源和本地启动器，收件人无需 Wwise 或开发依赖。
import {cp,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {compactPackage} from './compact-package.mjs';
await access('dist/index.html');
const output=resolve('release','wake-up-tokyo-local-'+new Date().toISOString().replaceAll(':','-').replaceAll('.','-'));
await mkdir(output,{recursive:true});await cp('dist',output,{recursive:true});
await cp('scripts/launch-mac.command',resolve(output,'启动游戏-Mac.command'));
await cp('scripts/serve.mjs',resolve(output,'serve.mjs'));
await writeFile(resolve(output,'启动游戏-Windows.bat'),'@echo off\r\ncd /d "%~dp0"\r\nstart "" http://127.0.0.1:5310/\r\nnode serve.mjs 5310 .\r\npause\r\n');
await writeFile(resolve(output,'开始试玩.txt'),'Mac：双击「启动游戏-Mac.command」。Windows：安装 Node.js 后双击对应 bat。\n浏览器打开 http://127.0.0.1:5310/。首次点击或按键后音乐开始。\n声音试听：在网址后添加 ?audio=1，可比较音乐和音效、检查实际输出，并录制 30 秒游玩音频。点击「返回游戏配乐」恢复自动变化。\n请保留整个文件夹；直接双击 index.html 无法启用 Wwise 声音。\n');
const compact=await compactPackage(output);
console.log(JSON.stringify({output,sourceBytes:compact.sourceBytes,storedBytes:compact.storedBytes,reduction:compact.reduction}));
