import { defineConfig } from 'vite';

// Cloud Agent 预览会用代理域名访问开发服务；Vite 7 默认拦掉非 localhost 的 Host。
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5200,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    // 游戏主页面与 FBX 预览页各自作为独立入口产出。
    rollupOptions: { input: { main: 'index.html', viewer: 'fbx-viewer.html' } },
  },
});
