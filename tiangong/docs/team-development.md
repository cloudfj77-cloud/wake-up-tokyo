# 天工版团队开发

基准版本：`0.3.76-tiangong.1`，SDK 固定 `@forgeax/engine 0.4.19`。仓库：`cloudfj77-cloud/wake-up-tokyo`。协作起点：`feat/tiangong-native-v0.3.76-1`。

## 工程在哪里

- 仓库根目录：原 Three.js / Vite 游戏。
- `tiangong/`：独立天工原生游戏，自己的 package.json、pnpm 锁文件和 forge.json。进入本目录再运行 pnpm 命令。
- `tiangong/assets/imported/full/`：已经转换完成的地图、角色、武器、音频、漫画和贴图源资源。拉取后通过正式 importer/cooker 构建本机缓存，不需要原作者电脑的 `.tools`、旧兼容工程或缓存。
- `tiangong/docs/history`、`reference` 和 `tools/migrate-assets`：历史对照与离线转换记录。转换工具中的旧本机目录仅用于来源追溯；正常开发不执行这些转换工具。重复的 split 中间文件不入库。

## 从哪里开始优化

| 内容 | 入口 |
| --- | --- |
| 战斗、成长、移动、Boss、存档 | `assets/game/simulation.ts` |
| 原版纯规则 | `assets/game/rules.js`、`combat-space.js` |
| ECS、渲染、碰撞、模型显示、输入 | `assets/game/native.ts` |
| 角色装配与动画 | `assets/game/character.ts` |
| HUD、菜单、触屏交互 | `assets/game/interface.ts`、`interface.html`、`interface.css` |
| 音乐与音效 | `assets/game/media.ts` |
| 导航、材质、地图资源声明 | `assets/game/routes.ts`、`routes.pack.json`、`full-game.pack.ts` |
| 官方实机流程 | `scripts/playthrough.mjs`、`full-gameplay.mjs` |

从协作分支再切自己的分支，例如 `git switch -c feat/tiangong-performance`，完成后提 PR 到 `feat/tiangong-native-v0.3.76-1`。如果想把天工工程并入主线，审查的是新增独立目录的 PR；不会用天工代码覆盖根目录游戏。

版本修改同步 package.json；SDK 和依赖使用 pnpm 官方命令更新，不编辑 SDK 内部或生成缓存。实际帧率用完整渲染帧时间窗口测量，区分冷启动资源编译和稳定运行。原生光照与旧版全屏漫画描边仍有差异，物理手机性能尚未验证。

## 提交前检查

```sh
pnpm exec forgeax project check --json
pnpm test
pnpm typecheck
node --test assets/game/original-rules.test.mjs
```

修改画面、玩法或输入后，按 README 的官方 owner 实机流程验收。已有完整通关与正式包证据见 `docs/evidence/full-game/run42`、`docs/evidence/full-game/production` 和迁移报告。历史性能窗口不是队友机器的性能保证。

`node_modules`、`.forgeax`、`.forgeax-debug`、`.assetlib`、`dist`、`artifacts`、`release` 和离线中间输出不提交。资源 sidecar 和稳定 GUID 要和源文件一起提交。
