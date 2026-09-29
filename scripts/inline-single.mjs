// 把 dist-single 里的 JS / CSS / public 资源全部塞进 index.html，产出单个可离线运行的 HTML。
// 用法：npm run build:single（vite build 之后自动执行）
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = process.argv[2] ? process.argv[2] : process.cwd();
const dist = join(root, 'dist-single');
const outDir = join(root, 'release');
const outFile = join(outDir, 'wake-up-tokyo.html');

if (!existsSync(dist)) {
  console.error('找不到 dist-single，请先执行 vite build --config vite.config.single.js');
  process.exit(1);
}

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.json': 'application/json', '.js': 'text/javascript', '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.fbx': 'application/octet-stream',
  '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.css': 'text/css',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
};
const mimeOf = p => MIME[extname(p).toLowerCase()] || 'application/octet-stream';
const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;

// 递归列出目录下所有文件（相对 dist 的 posix 路径）
function walk(dir, base = dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, base, acc);
    else acc.push(relative(base, full).split('\\').join('/'));
  }
  return acc;
}

let html = readFileSync(join(dist, 'index.html'), 'utf8');
const consumed = new Set(['index.html']);

// 1) 内联 <script type="module" src="...">
html = html.replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g, (tag, src) => {
  const rel = src.replace(/^\.?\//, '');
  const file = join(dist, rel);
  if (!existsSync(file)) { console.warn('跳过缺失脚本:', src); return tag; }
  consumed.add(rel);
  const code = readFileSync(file, 'utf8');
  const attrs = /type="module"/.test(tag) ? ' type="module"' : '';
  return `<script${attrs}>\n${code}\n</script>`;
});

// 2) 内联 <link rel="stylesheet" href="...">
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, tag => {
  const m = tag.match(/href="([^"]+)"/);
  if (!m) return tag;
  const rel = m[1].replace(/^\.?\//, '');
  const file = join(dist, rel);
  if (!existsSync(file)) { console.warn('跳过缺失样式:', m[1]); return tag; }
  consumed.add(rel);
  return `<style>\n${readFileSync(file, 'utf8')}\n</style>`;
});

// 3) 其余文件（public 下的 fbx / 贴图 / draco 解码器等）编码成 data URI，
//    运行时由注入的拦截器把相对路径换成本地 data URI。
const assets = {};
let bytes = 0;
for (const rel of walk(dist)) {
  if (consumed.has(rel)) continue;
  assets[rel] = dataUri(join(dist, rel), mimeOf(rel));
  bytes += statSync(join(dist, rel)).size;
}
console.log(`内联外部资源 ${Object.keys(assets).length} 个，原始体积 ${(bytes / 1048576).toFixed(1)}MB`);

// 单文件环境下没有服务器，mixamo / awakened / workers / draco 这些运行时按路径取的文件都不存在，
// 所以在这里统一拦截 fetch / XHR / img.src，把已知路径替换成内联的 data URI。
const prelude = `<script>
window.__SINGLE_FILE__=true;
window.__SF_ASSETS__=${JSON.stringify(assets)};
(function(){
 var MAP=window.__SF_ASSETS__||{};
 var DIRS=['mixamo','awakened','awakened-reader','workers','draco','music'];
 function rewrite(url){
  if(typeof url!=='string'||url.slice(0,5)==='data:')return url;
  var clean=url.split('?')[0].split('#')[0];
  var key=null;
  for(var i=0;i<DIRS.length;i++){
   var d=DIRS[i]+'/';
   // 既匹配绝对路径里的 /music/，也匹配代码里写的相对路径 music/。
   var at=clean.lastIndexOf('/'+d);
   if(at>=0){key=clean.slice(at+1);break;}
   if(clean.indexOf(d)===0){key=clean;break;}
  }
  if(key===null)return url;
  return MAP[key]||url;
 }
 var nativeFetch=window.fetch.bind(window);
 window.fetch=function(input,init){
  if(typeof input==='string'||input instanceof URL)return nativeFetch(rewrite(String(input)),init);
  if(typeof Request!=='undefined'&&input instanceof Request){
   try{return nativeFetch(new Request(rewrite(input.url),input));}catch(e){return nativeFetch(input);}
  }
  return nativeFetch(input,init);
 };
 var nativeOpen=XMLHttpRequest.prototype.open;
 XMLHttpRequest.prototype.open=function(method,url){
  if(typeof url==='string')arguments[1]=rewrite(url);
  return nativeOpen.apply(this,arguments);
 };
 var desc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 if(desc&&desc.set)Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,get:desc.get,set:function(v){desc.set.call(this,rewrite(v));}});
 var nativeSetAttribute=Element.prototype.setAttribute;
 Element.prototype.setAttribute=function(name,value){
  return nativeSetAttribute.call(this,name,(name==='src'||name==='href')&&typeof value==='string'?rewrite(value):value);
 };
})();
</script>
`;

if (/<head[^>]*>/.test(html)) html = html.replace(/<head[^>]*>/, m => m + prelude);
else html = prelude + html;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, html);
const size = statSync(outFile).size;
console.log(`已生成 ${outFile}（${(size / 1048576).toFixed(1)}MB）`);
