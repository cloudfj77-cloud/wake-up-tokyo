# 手机和 Windows 构建

本分支整合 main（PR #28）、PR #30 的 v0.3.61 修复，以及用户提供的「都给我醒醒！」手机／电脑版更新。展示名称沿用最新版本的 **Wake up 打工人！**；默认地图为东京立体街区，主菜单可切换海滨。

## Android

手机包使用根目录 `android/` 的 Capacitor 工程。应用 ID 保持 `com.wakeuptokyo.game`，版本为 `0.3.61-mobile.6`（versionCode 6），保留旧 APK 的存档命名空间。覆盖安装仍需相同签名；仓库不包含交付者的签名私钥。

环境：Node.js 22+、JDK 21、Android SDK API 36。配置 `JAVA_HOME` 和 `ANDROID_HOME`，或在本机 `android/local.properties` 中填写 `sdk.dir`。

```sh
npm ci
npm test
npm run test:mobile
npm run mobile:apk
```

Windows 输出为 `android/app/build/outputs/apk/debug/app-debug.apk`，交付时命名为 `Wake up 打工人！.apk`。macOS/Linux 执行 `npm run mobile:sync` 后运行 `cd android && ./gradlew assembleDebug`。debug 签名包用于试玩，正式发行需要配置发行签名。

资源和音频随包离线加载，要求 Android 7.0+ 和支持 WebGL2 的 WebView。横屏、沉浸式全屏；左下摇杆移动，外圈奔跑；右侧滑动镜头，战斗键支持按住攻击。切后台会暂停并释放触控输入。

Android 使用仓库内 200 个 Ogg 兼容音源及 5 条日语播报，无需在 WebView 中启动 Wwise WASM。`mobile:audio` 更新事件清单，缺少兼容音源时才从仓库 Originals 转码；已交付的日语 Ogg 是运行时源，不要求重新生成语音。

上游 `packaging/android/` 是独立的本机 HTTP 外壳，应用 ID 与已交付 APK 不同。本次更新保留它的资源服务修复；更新现有手机安装时使用根目录 Capacitor 工程。

## Windows / H5

```sh
npm run dev
npm run package:windows
```

Windows 上传平台使用 `npm run package:windows:upload`，输出在 `release/Windows上传包-时间戳/`。上传其中的 ZIP；可执行文件相对路径填写 `Wake up 打工人！.exe`，启动参数留空。EXE 位于 ZIP 根目录，资源和附带运行环境均在同一包内。

开发入口为 `http://127.0.0.1:5200/`。`?touch=1` 可预览手机操作，`?touch=0` 使用键鼠。打包命令在 Windows 下生成 `release/Wake up 打工人！.exe` 和 `release/Wake up 打工人！-HTML资源包.zip`，含离线 Node 运行环境；HTML 资源包需要通过附带启动器或本地 HTTP 服务运行。

## 验证

自动回归覆盖双端共用的真实地图碰撞、全部楼梯双向移动、同伴跟随和敌人追击、跨层攻击隔离、高层补兵、可见角色动画、触控生命周期及音频资源。渲染回归覆盖远景代理、视锥、雾、描边切换和材质图集颜色。

本次集成后的具体命令结果记录在 `verification/mobile-desktop-integration.json`。历史交付已在 MuMu 运行；本次测试结果不代表 Android 真机帧率、发热或触感验收。
