# Wake up 打工人！· 天工原生版

版本：`0.3.76-tiangong.1`，基于已验收的 Three.js `v0.3.76`。这是独立原生游戏工程，使用 `@forgeax/engine 0.4.19`、WebGPU、Engine World / ECS、Rapier 角色控制器和原生导航。正式运行时不加载 Three.js，也不通过 iframe 播放旧游戏。

## 游玩内容

- 默认海滨钟楼广场，可切换东京立体街区；保留地铁新手路线、双向持续运行的列车与咖啡店注射器拾取。
- 原角色贴图和动作、可中断的跳跃与连续翻滚、肩扛紫色液体注射器和射击后坐力。
- 十种能力及其三级成长、单卡刷新、按获得顺序排列能力；感染、同伴、护卫、军队、空袭和 Boss / 削弱任务 / 战后结算。
- 红色敌方血条、绿色友方和自身血条；六尖感染反馈、原音频、紫色喷射与可存档的地面/墙面留痕。
- 可跳过的中文漫画、中文 HUD、暂停、设置、触屏摇杆与按键、分地图独立存档；F3 打开原版调参台。

## 队友拉取与启动

本目录是独立天工工程。仓库根目录是原 Three.js 版，两个工程分别安装、分别运行。

需要 Node.js 24、pnpm 12.15.0，以及开启硬件加速并支持 WebGPU 的 Chrome / Edge。未安装 pnpm 时可先执行 `npm install -g pnpm@12.15.0`。

第一次拉取：

```sh
git clone --branch feat/tiangong-native-v0.3.76-1 https://github.com/cloudfj77-cloud/wake-up-tokyo.git wake-up-tiangong-dev
cd wake-up-tiangong-dev/tiangong
pnpm install --frozen-lockfile
pnpm exec forgeax project check --json
```

已有仓库的队友，在仓库根目录执行：

```sh
git fetch origin
git switch --track origin/feat/tiangong-native-v0.3.76-1
cd tiangong
pnpm install --frozen-lockfile
```

启动游戏：

```sh
# macOS / Linux
NODE_OPTIONS=--max-old-space-size=16384 pnpm dev
```

Windows PowerShell：

```powershell
$env:NODE_OPTIONS="--max-old-space-size=16384"
pnpm dev
```

在 Chrome / Edge 打开命令实际返回的地址。默认海滨，菜单可切换东京；开发地址以 `pnpm exec forgeax dev status --json` 的结果为准。首次导入、编译完整资源需要等待，之后使用本机缓存。`127.0.0.1` 地址仅供运行该服务的电脑访问。

源码、原始运行资源、锁文件均随仓库提供；`node_modules`、`.forgeax`、`dist`、`release` 由每台电脑自行生成。开发不需要启动旧 Three.js 版。仓库不包含之前本机生成的发布 ZIP，可按下方命令自行构建，再使用本目录的“打开天工原生版.command”运行构建结果。

工程分工与优化入口见 [团队开发说明](docs/team-development.md)。

WASD 移动；E 奔跑；空格翻滚；Shift 跳跃；C 蹲伏；左键 / J 攻击或射击；右键 / K 重击；数字键 / 滚轮切武器；R 装填；F 号令；V 归队；Tab 地图；Esc / P 暂停。触屏可在设置中开启。

## 验证及构建

```sh
pnpm typecheck
pnpm test
node --test assets/game/original-rules.test.mjs
pnpm exec forgeax project check --json
NODE_OPTIONS=--max-old-space-size=16384 pnpm exec forgeax project play scripts/playthrough.mjs --backend hardware --headless true --json
NODE_OPTIONS=--max-old-space-size=16384 pnpm exec forgeax project package --format web-zip --json
pnpm serve
```

最终测试记录、性能窗口与画面差异见 [迁移报告](docs/migration-report.md)。正式 ZIP 需要通过 HTTP(S) 运行，不能双击里面的 index.html。源码在天工独立分支中协作，未发布公网试玩站点。

## 保留与来源

原 Three.js 游戏、旧 ForgeaX iframe 兼容工程和完整旧工程归档全部保留。合并/归档回执见 docs/merge-and-preservation.json；源码来源见 docs/source-provenance.json；资源署名见 CREDITS。早期局部样板数据移到 docs/history/m1，不代表完整游戏性能。

保留的 reference 和离线转换工具只用于追溯，不是正式游戏的运行依赖。开发不需要启动原游戏。
