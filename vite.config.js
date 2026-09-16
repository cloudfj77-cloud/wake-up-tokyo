import {defineConfig} from 'vite';

// Cloud Agent 预览会用代理域名访问开发服务；Vite 7 默认拦掉非 localhost 的 Host。
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5200,
    strictPort: true,
    allowedHosts: true,
  },
});
