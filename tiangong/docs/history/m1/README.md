# Wake up 打工人！· 天工原生迁移开发版


> 当前完整游戏迁移尚未验收通过。`dist/` 和 `docs/migration-report.md` 中的 v0.1 样板历史结果不能当作完整游戏的结果。
>
> 已新增两张完整地图的原生资源、原角色与动作、原生物理和导航、技能卡、战斗/感染/充能、Boss 流程、存档及原版媒体/UI 接线。源代码通过类型检查与 11 项单元测试；58 项原规则测试和两张地图的导航数据检查通过。实际画面、完整玩法、双地图实机通路和性能仍待通过官方 owner 浏览器验证。
>
> 最新官方 play 第 12 次：资源生产 accepted，但插件启动失败 `asset-package-invalid / publication generation`；正式 build 定位到地图占位材质跨文件父材质找不到。正在改为几何分片直接引用真实共享材质。未生成或发布完整游戏的可交付安装包。
>
> 当前入口：`assets/game/native.ts`（原生 World），`assets/game/simulation.ts`（玩法），`assets/game/interface.ts`（前端 HUD），`scripts/full-playthrough.mjs`（完整迁移验收，尚未通过）。下文 v0.1 说明保留作历史记录。

基于正式版 v0.3.76（PR33，主线 e2436475c5d52c5ecb0012260fab52405cffdf71）建立的独立原生试验。正式游戏、旧兼容工程及完整旧工程归档均保留。本目录没有设置远程仓库，也不会自动替换主线。

## 两个程序

- 原生样板：`@forgeax/engine` 0.4.19，WebGPU、原生资源 GUID、Engine World/ECS 系统、Frontend HUD。运行时没有 Three.js、iframe 或旧兼容层。
- `reference/`：独立 Three.js WebGL2 对照页，共用同一份咖啡店 GLB、原角色 FBX、规则、相机、HUD、12 个简化巡警。

两边都是试验场；原版完整游戏不参与局部性能排名。场景副本经过规范化，细节见 `docs/source-provenance.json`。资源原有权利和署名继续适用；本样板没有给外部模型另行授予许可。

## 启动与验证

Node 24、普通 JavaScript pnpm 12.15.0（避免旧 standalone pnpm 自动切换写入不同锁文件）。在本目录：

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm exec forgeax project check --json
pnpm exec forgeax project play scripts/playthrough.mjs --backend hardware --headless true --require-ui --viewports 1280x720 --timeout-ms 180000 --json
pnpm build
```

原生预览地址由 `forgeax dev status --json` 返回，不能假设端口固定。官方 owner 浏览器用于验收。开发服务器第一次构建耗时较长，不能拿它当游戏帧率。

对照页：

```sh
cd reference
npm ci
npx vite --host 127.0.0.1 --port 5231 --strictPort
```

另开终端，在样板根目录执行 `node scripts/reference-acceptance.mjs`。测试依赖随 reference/package-lock.json 固定，验收使用本机 Chrome。不要同时运行两个采样窗口。构建对照页：`cd reference && npx vite build`。

WASD 移动，E 奔跑，Shift 跳跃，空格翻滚；点击画面捕获鼠标，Esc 释放；左键或 J 发射。靠近咖啡店前黄色标记拾取注射器。三次有效命中蓄满，下一发强化；感染后的测试巡警转绿。

## 这个样板证明和没有证明的事

已接入真实咖啡店场景、原角色网格、输入、地面高度、拾取、命中蓄力、感染阵营变化、HUD、基础喷射和留痕，并用真实浏览器输入验证。

这是简化玩法切片：巡警为统一代理形状；角色尚未重接贴图和动作混合，人物静态姿势不代表原版动作完成移植。射击使用测试命中规则，场景碰撞只用烘焙地面网格，未完成墙体遮挡/刚体；喷射与留痕为基础形状，最多 64 个留痕，声音为临时合成音。原版漫画描边、完整武器后坐力、六尖感染标、墙面持久喷漆、地铁列车、Boss、技能卡和手机操作未迁移。原生与 Three.js 的曝光、材质和明暗尚未校准到一致。不能据此宣布完整游戏迁移完成。

资源重提取（可选；正常试玩无需原游戏目录）：`node scripts/extract-cafe.mjs /absolute/path/to/original-game`。提取后用官方 asset import 重新导入，不要编辑 DDC 或生成目录。地面数据取自原版 tokyo-navigation.json 的同一局部。

结论、测量窗口与具体不足见 `docs/migration-report.md`，机器可读记录在 `docs/evidence/`。

## 天工迁移 Prompt 工程

迁移任务总指令、分阶段任务和验收清单见 [Prompt 工程入口](prompts/tiangong-migration/README.md)。这套文档默认从人物／动作／画面还原开始；文档创建本身不执行新的游戏迁移。
