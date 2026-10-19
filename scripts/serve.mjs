// Zero-dependency local server; normal builds and compact distribution packages share URLs.
import {createServer} from 'node:http';
import {stat} from 'node:fs/promises';
import {existsSync,createReadStream} from 'node:fs';
import {join,extname,normalize,resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGunzip} from 'node:zlib';
import {pipeline} from 'node:stream/promises';
const port=process.argv[2]===undefined?5310:Number(process.argv[2]),scriptDir=dirname(fileURLToPath(import.meta.url));
const defaultRoot=[scriptDir,resolve(scriptDir,'../dist'),resolve(scriptDir,'../../web')].find(dir=>existsSync(join(dir,'index.html')));
if(!process.argv[3]&&!defaultRoot){console.error('找不到游戏首页，请先构建，或传入游戏目录。');process.exit(1);}
const rootDir=resolve(process.argv[3]||defaultRoot);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.wasm':'application/wasm','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.fbx':'application/octet-stream','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
function acceptsGzip(header=''){const values=new Map(header.toLowerCase().split(',').map(s=>{const [name,...params]=s.trim().split(';');return [name,Number(params.find(x=>x.trim().startsWith('q='))?.trim().slice(2)??1)];}));return (values.get('gzip')??values.get('*')??0)>0;}
if(!existsSync(rootDir)){console.error('找不到目录：'+rootDir);process.exit(1);}
const server=createServer(async(req,res)=>{
 res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  const urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let logical=resolve(join(rootDir,normalize(urlPath)));
  if(logical!==rootDir&&!logical.startsWith(rootDir+sep)){res.writeHead(403).end('forbidden');return;}
  let info=await stat(logical).catch(()=>null);if(info?.isDirectory()){logical=join(logical,'index.html');info=await stat(logical).catch(()=>null);}
  let stored=logical,compressed=false;if(!info){stored=logical+'.gz';info=await stat(stored).catch(()=>null);compressed=!!info;}
  if(!info?.isFile()){res.writeHead(404).end('not found');return;}
  const encoded=compressed&&acceptsGzip(req.headers['accept-encoding']),etag='"'+info.size.toString(16)+'-'+Math.trunc(info.mtimeMs).toString(16)+'-'+(encoded?'gzip':'identity')+'"';
  res.setHeader('Vary','Accept-Encoding');res.setHeader('ETag',etag);res.setHeader('Cache-Control',/\/assets\/.*-[\w-]{8,}\./.test(logical)?'public, max-age=31536000, immutable':'no-cache');
  if(req.headers['if-none-match']===etag){res.writeHead(304).end();return;}
  res.setHeader('Content-Type',MIME[extname(logical).toLowerCase()]||'application/octet-stream');
  // Wwise streams raw .wem byte ranges. Compressed transport assets keep normal full responses.
  if(!compressed){
   res.setHeader('Accept-Ranges','bytes');
   if(req.headers.range&&(!req.headers['if-range']||req.headers['if-range']===etag)){
    const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);let start,end;
    if(match&&(match[1]||match[2])){start=match[1]?Number(match[1]):Math.max(0,info.size-Number(match[2]));end=match[1]?(match[2]?Math.min(Number(match[2]),info.size-1):info.size-1):info.size-1;}
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=info.size||end<start){res.writeHead(416,{'Content-Range':'bytes */'+info.size}).end();return;}
    res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);res.setHeader('Content-Length',end-start+1);res.writeHead(206);if(req.method==='HEAD'){res.end();return;}await pipeline(createReadStream(stored,{start,end}),res);return;
   }
  }
  if(encoded)res.setHeader('Content-Encoding','gzip');if(!compressed||encoded)res.setHeader('Content-Length',info.size);
  res.writeHead(200);if(req.method==='HEAD'){res.end();return;}
  const input=createReadStream(stored);if(compressed&&!encoded)await pipeline(input,createGunzip(),res);else await pipeline(input,res);
 }catch(error){if(res.headersSent)res.destroy();else res.writeHead(500).end('Unable to serve asset');}
});
server.listen(port,'127.0.0.1',()=>console.log('Wake Up Tokyo: http://127.0.0.1:'+server.address().port+'/'));
