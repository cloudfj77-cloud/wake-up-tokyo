# Android 手机试玩版

基于 main 的 7948977（已合并 PR #28），版本 0.3.60-mobile.1。

## 安装与操作

安装 release/都给我醒醒-v0.3.60-mobile.1.apk。此包为可直接安装的 debug 签名试玩 APK，不是应用商店发行签名。需要 Android 7.0 及以上、支持 WebGL2 的较新 Android System WebView；较旧或低性能设备仍需真机验证。

安装后横屏游玩。地图、模型与声音随 APK 打包，无需电脑开服务器。两张地图均保留，主菜单可选择东京立体街区。

- 左下：360 度摇杆，推到外圈奔跑。
- 右侧空白区域：滑动调整镜头。
- 右下：攻击／重击（支持按住），闪避、跳跃、切换武器、换弹。
- 右上：地图、暂停、全屏。
- 切后台时暂停并清理触控输入，回到游戏后从暂停菜单继续。

手机控件沿用黑红白涂鸦风格，使用纸片切角、网点、粗线图标和按下反色。手机 HUD 为摇杆和技能区留出位置，考虑刘海／系统安全区。Android 默认低画质。升级和暂停时收起触控层。

## 音频

Android 使用同一套作者原始音源生成的 200 个 Ogg 文件，通过移动兼容后端播放（音乐、91 类音效／环境／电台）。这样不依赖 Android WebView 缺少的 SharedArrayBuffer。声音选择和玩法事件沿用现有 Director；兼容后端使用距离音量衰减，混音、转场不等同于原生 Wwise。桌面仍用现有 Wwise。兼容音源约 10 MiB。

## 重建

安装 Node.js、JDK 21、Android SDK（API 36，Build Tools 35/36）。将 JAVA_HOME、ANDROID_HOME 指向实际工具目录，或在 android/local.properties 中配置 sdk.dir。

    npm ci
    npm run test:mobile
    npm test
    npm run mobile:apk

也可先运行 npm run mobile:sync，再在 Android Studio 中打开 android 工程构建。macOS/Linux 在同步后使用 android/gradlew assembleDebug。输出：android/app/build/outputs/apk/debug/app-debug.apk。

mobile:audio 从仓库内 Originals 与现有选择清单生成兼容音源，不需要 Wwise SDK。已生成的音源随源代码保留。APK 中没有远程站点 URL。

## 验证边界

已验证触控指针独立占用、取消／失焦停止、连发清理、摇杆死区和方向；兼容音频资源完整性及生命周期；现有游戏回归；生产打包和 Android APK 编译、签名、资源清单。已在 MuMu Android 15（WebView 110）安装并运行，验证东京地图、存档继续、攻击、跳跃、镜头拖动、地图开关、暂停及全屏显示；试玩中观察到摇杆移动并完成教学目标。Android 音频服务可看到本应用的播放轨道；模拟器处于静音，未完成听感验收。构建机没有连接 Android 真机，实际手机帧率、发热和多指触控仍需真机验证。首次角色资源预热需要等待。
