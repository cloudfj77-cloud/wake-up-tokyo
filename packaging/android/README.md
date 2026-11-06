# 《Wake up 打工人！》Android 工程

游戏本体仍是 Three.js 网页；本工程把构建产物装入 WebView。网页与 Android 版本共用根目录 `package.json` 的版本号，手机桌面名称位于 `app/src/main/res/values/strings.xml`。

## 构建和试玩

需要 JDK 17、Android SDK Platform 34 / Build Tools 34.0.0。Gradle 8.7 Wrapper 和 Android Gradle Plugin 8.5.2 已固定版本，首次构建会下载官方依赖。可用 Android Studio 打开本目录，或在项目根目录执行：

```sh
npm run build
cd packaging/android
./prepare-assets.sh
./gradlew assembleDebug
```

可安装的调试包位于 `app/build/outputs/apk/debug/app-debug.apk`。它使用开发签名，仅供试玩。
`./gradlew assembleRelease` 默认输出 `app/build/outputs/apk/release/app-release-unsigned.apk`；正式分发前必须用团队自己的密钥签名，密钥和密码不要提交到仓库。

`prepare-assets.sh` 会替换本工程 `assets/www/` 中上一次复制的网页资源。该目录、构建产物和本机 SDK 配置均已排除出 Git。资源较大，复制和打包时需要足够磁盘空间。

## 网络与声音

资源服务先成功绑定 `127.0.0.1:8099`，再创建游戏页面；它只监听本机，不向局域网开放。网络安全设置只允许这个本机 HTTP 地址，外部 HTTP 默认禁止。页面内的地图切换继续留在 WebView 中。

Wwise 需要共享音频内存。仅加 COOP / COEP 不足以让普通 Android WebView 支持它：本工程使用 AndroidX WebKit 1.18.0-rc01 的受信来源名单 API，并给本机资源返回 `Document-Isolation-Policy: isolate-and-require-corp`。名单只包含本机游戏来源，不使用通配符；不支持该能力的系统 WebView 会提示先更新，不会悄悄以无声模式启动。

此 API 当前位于候选发布版，因此仍需在支持该能力的实际 Android System WebView 上验收。仅完成网页构建或桌面模拟触屏测试，不能代表 Android APK 的声音和兼容性已经通过。

依据：[Android Gradle Plugin 8.5 配套版本](https://developer.android.com/build/releases/agp-8-5-0-release-notes)、[WebView 受信来源名单](https://developer.android.com/reference/androidx/webkit/Profile#setCrossOriginIsolatedAllowlist(java.util.Set))。

## 资源服务自检

安装 JDK 17 和 SDK Platform 34 后，在本目录可执行：

```sh
javac -cp "$ANDROID_HOME/platforms/android-34/android.jar" -d /tmp/wake-android-check app/src/main/java/com/zhixuan/wakeupworker/AssetServer.java tests/AssetServerCheck.java
java -ea -cp "/tmp/wake-android-check:$ANDROID_HOME/platforms/android-34/android.jar" AssetServerCheck
```

它检查仅本机监听、端口占用时报告启动失败、Range 精确字节、隔离响应头及开场视频类型；不替代 APK 或真机验收。
