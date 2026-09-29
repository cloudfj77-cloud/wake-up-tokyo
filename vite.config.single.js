// 单文件打包配置：把 JS / CSS / 模型 / 贴图全部内联，产出一个双击就能离线运行的 HTML。
// 用法：npm run build:single
import base from './vite.config.js';

export default {
  ...base,
  build: {
    ...(base.build || {}),
    outDir: 'dist-single',
    emptyOutDir: true,
    // 超过这个体积就不再内联，默认 4KB 会把 glb / wasm 拆成外链文件，这里直接拉满。
    assetsInlineLimit: 512 * 1024 * 1024,
    chunkSizeWarningLimit: 4096,
    // 只打游戏本体，fbx-viewer 是给美术调参用的独立页面，不进单文件。
    rollupOptions: { input: 'index.html' },
  },
};
