// 零依赖静态服务器：只给构建产物（dist）用。
// 用法：node scripts/serve.mjs [端口] [目录]
// 只用 Node 内置模块，不需要 npm install，也不需要联网。
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.argv[2]) || 5310;
// 默认服务脚本自己所在的目录（拷到哪都能跑），也可以手动指定 dist 目录
const rootDir = resolve(process.argv[3] || dirname(fileURLToPath(import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.fbx': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

if (!existsSync(rootDir)) {
  console.error('找不到目录：' + rootDir);
  process.exit(1);
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // 防目录穿越：normalize 之后必须仍在 rootDir 内
    let filePath = join(rootDir, normalize(urlPath));
    if (!filePath.startsWith(rootDir)) { res.writeHead(403).end('forbidden'); return; }

    let info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) {
      filePath = join(filePath, 'index.html');
      info = await stat(filePath).catch(() => null);
    }
    if (!info) { res.writeHead(404).end('not found'); return; }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 被占用了，换一个：`);
    console.error(`  node scripts/serve.mjs ${port + 1}`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`游戏已启动：http://127.0.0.1:${port}/`);
  console.log('（关掉这个窗口就是退出游戏）');
});
