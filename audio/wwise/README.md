# 街头觉醒 · Wwise 音乐、音效与电台试听版

用户已确认 P01 的 Funk / Breakbeat 方向。以同一首主题为 Cover 参考，制作六组场景变奏，加上主题共七组；各组保留两份 Suno 候选，实际采用文件与链接见 `cues.json`、`suno-requests.json`。失败组第一份被 Suno 标记退款，本轮使用第二份。

音乐围绕弹性贝斯、干燥碎拍、闷音吉他与短合成器问答。标题更松弛，封锁与倒计时减少旋律空隙中的安全感，Boss 加入厚重吉他与机械打击，胜利和失败各用一个短句。初始提示为 128 BPM，实际波形估计约 130–132 BPM，标题约 96 BPM；没有把生成提示当成可靠节拍标记。循环点按波形准备，听感仍需在游戏中评审。

| 游戏状态 | 音乐 | 行为 |
|---|---|---|
| 标题 / 首次交互 | Menu | 8 小节循环 |
| 警戒 1–2 | Street | 32 小节主题循环 |
| 警戒 3–4 | Pressure | 32 小节压力变奏 |
| 镇压倒计时 | Countdown | 24 小节紧张变奏 |
| Boss 活跃 | Boss | 40 小节战斗变奏 |
| Boss 被击败 | VictoryAftermath | 8.8 秒胜利短句，8.6 秒处交叉接入较轻的标题余韵 |
| 其他胜利 / 失败结算 | Victory / Defeat | 8.8 / 8.4 秒一次性短句 |
| 暂停 / 地图 / 页面隐藏 | Pause / Resume | 保留播放位置，恢复后继续 |
| 选卡 / 广播说话 | Music_DuckDb | 分别 -4 / -9 dB，广播优先 |

音乐、音效、环境与固定电台统一使用一个 Wwise SoundEngine。原有振荡器音效和浏览器 speechSynthesis 已替换为可编辑资产；同一动作不会再叠两套声音。音乐总线 -9 dB，音效总线 -2 dB，主输出预留 -6 dB；总音量通过各总线 RTPC 控制，电台另有语音音量。静音持续保留音乐进度。声音工坊的参考和设计提案保存在本次上层 outputs 工作目录；本仓库保留可独立运行的 Wwise 资产与游戏接入。

## 启动和试听

`npm install` 后执行 `npm run dev`，或 `npm run local` 启动构建版本。网址添加 `?audio=1` 可逐曲比较，点击“返回游戏配乐”恢复自动切换。“检查实际音频输出与重启”测量真实 AudioWorklet 信号，检查暂停、静音、停止、卸载与重启。

`npm run package:local` 生成带启动器的完整本地版。收件人播放时不需要 Wwise。浏览器必须处于安全且隔离的 HTTP/HTTPS 页面；Vite 和仓库本地服务器已配置响应头。直接双击 HTML 的预览不支持 Wwise 音乐，页面会提示使用本地启动器。远程部署也需要 COOP same-origin 与 COEP require-corp；尚未验证 ForgeaX Studio iframe、Safari 或手机浏览器。

本地交付使用可还原原字节的 gzip 资源和随附的 Node/Python 服务器，保留逻辑 URL。`package-assets.json` 记录每个文件压缩前后的长度与 SHA-256。此文件夹不能直接交给不支持这些逻辑 URL 的普通静态服务器；远程部署应使用普通 `dist/`，另行配置压缩和隔离响应头。包体实测 232,149,889 → 94189159 字节（含校验清单），减少 59.4%；gzip 解压恢复的是各构建资源的原字节；下述 Wwise 转换档位另行改变环境和电台的编码，尚待听感验收。

## 200 媒体精选版

当前 Web 银行实际包含 **193 个音效/环境/语音媒体 + 7 个音乐媒体 = 200 个**。全部 91 类声音和 57 项设计要求仍有对应事件，五类枪械各保留四个独立来源。完整 245 个音效源保存在作者工程与声音工坊，52 个未入选变体不随本版银行导出。选择依据为玩法重复频度、角色功能及测得的电平一致性，听感评审仍待进行。

`sfx-bank-selection.json` 保存选择；作者脚本与运行时目录使用同一选择，导出脚本从生成的银行读取媒体 ID 并拒绝超过 200。`generation.json` 和 `generated/banks/receipt.json` 记录实际总数。调整选择后应执行音效作者脚本、保存工程、重新生成银行并构建；单纯改目录不会替换已有银行。

## Wwise 作者工程

打开 `wwise/WakeUpTokyo/WakeUpTokyo.wproj`，版本 **2025.1.10.9233 / Web**。交付可编辑 PCM 位于该工程 `Originals/SFX/TokyoMusic/`。七份交付源统一 -18.0 LUFS，实测真峰值 -7.50 至 -4.78 dBTP，详见 `source-quality.json`。源循环交界使用 40 ms 交叉淡化，保持 Vorbis Q4；五个长音乐媒体采用流式读取，胜利和失败短句保留在内存银行。

这是 Wwise SoundEngine 的 Sound SFX 循环与事件转场方案。循环点、淡变、延迟尾声、暂停与混音曲线都保存在作者工程；游戏只提交状态。本游戏扩展了 Web Stream Manager I/O；不使用 MusicEngine、节拍同步或可拆分 stems。阶段之间采用时间交叉淡化。

已保存工程通常直接生成银行即可：

```sh
WWISE_CONSOLE=/path/to/WwiseConsole node scripts/wwise/generate.mjs
node scripts/wwise/sync-runtime.mjs
npm run build
```

`generate.mjs` 拒绝版本不匹配、加载警告、超过 200 媒体、未知流式路径和缺失事件，同批生成三份银行、9 个流式文件及哈希记录。`sync-runtime.mjs` 校验银行、媒体和运行时后重建导入目录；`verify-delivery.mjs` 可独立复查交付哈希、事件和实际媒体数。本游戏已扩展流式 I/O，不再使用原通用技能中只接受内存银行的 sync/verify。普通声音修改不需要重新编译 Wasm。

需要按本轮模板重新写事件时，先在 Wwise 打开本工程并启用 WAAPI，然后执行 `node scripts/wwise/author.mjs`。脚本只接受本工程 ID，以撤销组修改本轮音乐对象；它会重设模板拥有的曲线和事件，手工精调后请直接在 Wwise 保存并生成银行。循环点和主配置信息在 `cues.json`。`prepare-sources.py --originals <Suno原始WAV目录> --ffmpeg <程序路径>` 可重现响度处理，原始文件哈希另见 `originals-analysis.json`。

## Wwise 压缩与流式读取

`configure-delivery.mjs` 通过 WAAPI 撤销组设置四个可编辑 ShareSet，保留混音、事件、循环点和转场：音乐及主要音效为原 Q4/原采样率，环境为 Q3/32 kHz，电台为 Q3/24 kHz 单声道。完整 PCM 源保留。五个长音乐媒体的 Vorbis data 载荷与压缩前逐一比对相同；环境和电台的新编码尚待听感确认。

5 个音乐媒体与 4 个长环境媒体使用 Streaming + 2 秒预取。常驻银行从 11,643,367 降到 2,992,865 字节（-74.3%），另有固定 2 MiB Wwise I/O 池。9 个 WEM 按实际需要用 HTTP Range 读取，JS 不预载整曲，不调用 decodeAudioData。包括流式文件后的总音频交付为 11,561,352 字节，比压缩前小 0.7%；流式的主要收益是预载量和常驻媒体减少，不能把银行缩小当作总包体缩小。

游戏自有实现位于 `scripts/wwise/native/bridge.cpp`、`src/wwise/stream-io.mjs` 与 `runtime.mjs`。SDK Stream Manager 的 PerformIO 在单线程 Web 渲染循环中推进，异步请求完成后回调原传输；JS 只接受准确的 HTTP 206 字节区间，退出时中止请求并清理回调。暂停仍由 Wwise 保存声音播放位置。随附 Node 和 Python 服务均支持 WEM 范围读取；远程服务器也须支持相同语义。主线程长任务和浏览器后台限制仍可能造成音频饥饿，本版没有实时调度保证。

在保存好的 Wwise 工程上运行 `node scripts/wwise/configure-delivery.mjs` 可重现本轮转换与流式设置，再按上面的生成、同步和构建顺序交付。重跑作者模板后也需要重做这一步，以免模板恢复默认属性。仅在修改 native bridge 时，用匹配的 WWISESDK/EMSDK 运行 `node scripts/wwise/build-runtime.mjs`。

官方参考：[Vorbis 转换参数](https://www.audiokinetic.com/en/public-library/2025.1.4_9062/?id=vorbis_encoder_parameters&source=Help)、[Stream Manager](https://www.audiokinetic.com/library/?id=streamingdevicemanager.html&source=SDK)。实测数据见 `conversion-optimization.json` 与 `package-optimization.json`；实际浏览器播放结果另记，信号检查不等于主观听感验收。

## 音效与玩法

`main.js` 在有效动作和状态边沿提交事件，`sfx-director.mjs` 管理脚步、移动声源、循环、台词队列与回收。`author-sfx.mjs` 在作者工程保存随机不连续重复、复音上限、空间衰减、低通和落地强度 RTPC。世界声源以 65 米为界，持续声源按距离筛选；坦克最多两个、净化喷雾三个、飞机一个，设施低鸣一个。暂停冻结声源与电台，退出场景停止循环并清理队列。

电台使用本机 macOS Daniel TTS 制作五段固定英语台词，保留 AIFF 原声、文字和处理记录；它是当前可替换的配音候选。显示中文字幕，并在说话时将音乐降低 9 dB。音效与环境复用了用户授权的素材库、画兽风声、成功生成的声音工坊候选和保留配方的原创短提示。所有来源及 SHA-256 位于 `sfx-cues.json`。运行时只加载 `sfx-runtime.json`，不携带本机素材库路径。

声音工坊每个源文件均保留 Pack 版本；部分分组 Pack 保留制作检查点，最新交付修订以 `sfx-cues.json` 与作者工程 Originals 为准。`sfx-plan.json` 映射 57 项设计要求，`sfx-asset-audit.json` 检查完整源文件、哈希、重复和数量，精选银行数量另见选择清单。`implemented_trial` 表示已做试接入，听感仍待用户判断。觉醒成功的首个原声方向已获用户认可；后续加工版本与其他声音不会因此自动成为已采用。

在 Wwise 打开本工程并启用 WAAPI 后，可执行 `node scripts/wwise/author-sfx.mjs`。该脚本使用撤销组，只更新本项目的音效/环境/语音对象和预留主输出余量；不要使用音乐模板脚本重置已经手调的音乐。修改后的来源 Pack 需重新交付到 Originals，再生成银行。直接在 Wwise 修改音乐、音效、衰减和事件后保存即可生成。

## 验证边界

单元与回归测试覆盖状态优先级、并发初始化、加载中暂停、旧请求释放、重试、静音和广播混音；运行记录见 `browser-*-check.json`。非零 PCM 证明功能出声，不能证明编排、循环乐句或长期听感已通过艺术评审。新变奏的听感状态为待用户试听，主方向已确认。原始 Suno 输出及本轮处理痕迹均已保留，未把未试听素材标成最终采用。

本轮已通过 226 项自动测试，91 类真实 Worklet 信号与两轮街头循环，8 个音乐场景、暂停/静音、停止释放和引擎重启。结果见 `sfx-browser-check-streaming.json`、`music-browser-check-streaming.json`。海滨实玩已录得 23.5 秒有效游玩，原始 WebM 与试听剪辑保留在上层输出目录，元数据见 `gameplay-capture.json`；这不代表主观听感验收。


## 长时间播放与断流恢复（2026-10-19）

用户反馈音乐停止而音效继续。新增原生 Playing ID/源位置查询和饥饿计数后，在真实 Wwise 输出中通过一次 503 和一次连续三次 503，分别验证重试与音乐事件结束后的恢复。第一次测试还在后续循环中记录到媒体 663454604、偏移 883441 的区间响应校验失败；该轮记录保留在 `music-continuity-recovery-before-cache-fix.json`，不能作为通过记录。

分段读取现显式使用 `cache: no-store`，保留 Wwise 自己的 2 MiB 媒体缓存，避免浏览器缓存复用不同区间的响应。每次传输最多三次尝试、每次 750 ms 超时；精确校验 HTTP 206、Content-Range、编码和长度，不接受整文件回退。销毁时中止传输，迟到结果不能写回已释放的 Wasm 内存。失败诊断包含媒体 ID、偏移与实际响应头。

音乐每 500 ms 检查当前事件和播放位置。循环意图中的事件意外结束会重新启动；声部保留但位置连续八秒不前进时也会恢复。启动有 1.5 秒宽限，连续失败逐步退避到 30 秒。暂停、主动停止与胜负短句不会触发循环恢复，恢复不重建共享音效引擎。读取故障和恢复次数可在 `?audio=1` 的「下载当前音频诊断」中保存。

「检查长时音乐与读取故障恢复」使用真实 Worklet、两条环境流、短音效、街头/Boss/封锁场景与两次暂停，主动注入可重试及耗尽重试的故障。它是受控技术验证，不是实际游玩录像，也不代表音频艺术评审。正常三分钟播放记录为 `music-continuity-normal-before-fix.json`；其中故障注入未触发，只能证明该轮正常播放。

音乐、音效内容与银行保持不变，仍为 200 个媒体、9 个流式文件。重新运行 `author-sfx.mjs` 后，应重新运行 `configure-delivery.mjs`，再生成银行，以恢复这套独立转换与流式属性。


最终 `music-continuity-recovery.json` 为 182.3 秒通过记录。缓存对照在偏移 883441、请求 32768 字节时，默认缓存实际返回 HTTP 200 / 1,129,734 字节完整 WEM；`no-store` 四次对照全部得到精确 206。最终播放测试只留下主动注入、耗尽三次重试的一个 503 失败，音乐恢复一次；后续完整循环未再出现区间错误，所有一秒采样的事件均仍有效。一次独立 503 已由读取重试消化。该结果定位了已复现的缓存区间异常；未记录用户先前那一局的网络响应。

修复试玩包与逐文件/HTTP/9 个区间校验见 `music-fix-package.json`，226 项自动测试通过。最终包仍约 89.8 MiB（ZIP 88.2 MiB）。


另以项目既有 DEV `test=comic` 高能力预设进行海滨实玩，覆盖移动、连续攻击、队伍战斗、升级选卡。02:33 保存的诊断见 `music-gameplay-continuity.json`：街头播放事件保持 ID 3，229 次分段读取、0 重试、0 错误、0 异常恢复、0 流饥饿回调；最大音频渲染间隔 241 ms。之后 03:19 的截图仍显示相同事件运行，保存于上层输出 `music-continuity-fix-gameplay.png`。这是高能力调试预设实玩，不是普通难度平衡测试；不据此宣称全设备无间隙保证。


## 仓库交付

仓库保留可编辑 Wwise 工程、Originals 和已构建 Web 运行时、银行及流式媒体。接收方执行 `npm ci`、`npm run build`、`npm run serve` 即可运行；只有重新制作/导出声音才需要匹配的 Wwise/SDK。`asset-library://` 表示制作时的本机素材库来源，`workshop-output://` 表示声音工坊制作或本地验证归档；它们仅用于追溯，不是运行时加载地址。实际工程源文件采用 `Originals` 中的相对路径，原始本机路径记录另存本地输出目录，不作为仓库配置上传。

试听交付以 GitHub 预发布试玩包为准；源文件、波形与检查记录不表示全部声音已经获得听感验收。上传内容包括本轮请求的声音接入、200 媒体精选、流式播放、包体压缩与加载去重，以及断音修复；游戏玩法参数与美术资源沿用当前基线。
