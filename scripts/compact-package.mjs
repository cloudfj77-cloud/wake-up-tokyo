// Lossless, portable gzip storage. The bundled Node/Python server serves logical asset URLs.
import {readdir,readFile,writeFile,unlink,stat} from 'node:fs/promises';
import {join,relative,extname,resolve} from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
export async function compactPackage(directory){
 const root=resolve(directory),entries=[];let sourceBytes=0,storedBytes=0;
 async function visit(dir){for(const d of await readdir(dir,{withFileTypes:true})){const path=join(dir,d.name);if(d.isDirectory()){await visit(path);continue;}const url=relative(root,path).split('\\').join('/'),b=await readFile(path);sourceBytes+=b.length;let stored=b,storage=url,encoding='identity';
  // Launchers, index and server must remain directly readable before the HTTP server starts.
  if(url.includes('/')&&b.length>=8192&&['.glb','.fbx','.bin','.js','.mjs','.wasm','.json','.css','.frag'].includes(extname(url))){const gz=gzipSync(b,{level:9});if(gz.length<b.length*.92){if(hash(gunzipSync(gz))!==hash(b))throw Error('Compression integrity failure '+url);await writeFile(path+'.gz',gz);await unlink(path);stored=gz;storage=url+'.gz';encoding='gzip';}}
  storedBytes+=stored.length;entries.push({url,storage,encoding,sourceBytes:b.length,storedBytes:stored.length,sourceSha256:hash(b),storedSha256:hash(stored)});
 }}await visit(root);const report={schemaVersion:1,sourceBytes,storedBytes,reduction:1-storedBytes/sourceBytes,files:entries.sort((a,b)=>a.url.localeCompare(b.url))};await writeFile(join(root,'package-assets.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){const r=await compactPackage(process.argv[2]);console.log(JSON.stringify({...r,files:r.files.length}));}
