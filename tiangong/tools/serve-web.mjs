import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {realpath,stat} from 'node:fs/promises';
import {resolve,relative,extname,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
// Local release launcher: built files only, no SDK or original-game server.
const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const root=await realpath(resolve(arg('--dir',fileURLToPath(new URL('../dist',import.meta.url)))));
const port=Number(arg('--port','5240'));
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
await stat(resolve(root,'index.html'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.wasm':'application/wasm','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp4':'video/mp4'};
const server=createServer(async(req,res)=>{
 res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');res.setHeader('Cross-Origin-Resource-Policy','same-origin');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-cache');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),path=await realpath(resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname))),rel=relative(root,path);
  if(rel==='..'||rel.startsWith('../')||isAbsolute(rel)){res.writeHead(403).end();return;}
  const info=await stat(path);if(!info.isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',mime[extname(path)]??'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
  let start=0,end=info.size-1,status=200;
  if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||!match[1]&&!match[2]){res.writeHead(416).end();return;}
   if(!match[1])start=Math.max(0,info.size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
   if(start>end||start>=info.size){res.setHeader('Content-Range',`bytes */${info.size}`);res.writeHead(416).end();return;}
   status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
  }
  res.setHeader('Content-Length',Math.max(0,end-start+1));res.writeHead(status);
  if(req.method==='HEAD'||!info.size)res.end();else createReadStream(path,{start,end}).on('error',()=>res.destroy()).pipe(res);
 }catch(error){res.writeHead(error.code==='ENOENT'?404:400).end();}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`端口 ${port} 已被占用，请关闭旧窗口或换一个端口。`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{const address=server.address(),url=`http://127.0.0.1:${address.port}/`;console.log(`Wake up 打工人！· 天工原生版\n${url}\n关闭此终端可停止游戏服务。`);if(args.includes('--open')){const command=process.platform==='darwin'?'open':process.platform==='win32'?'cmd':'xdg-open';const child=spawn(command,process.platform==='win32'?['/c','start','',url]:[url],{stdio:'ignore'});child.on('error',()=>{});child.unref();}});
