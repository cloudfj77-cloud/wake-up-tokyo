# 安卓包（APK）构建说明 —— Wake up 打工人！

游戏本体是纯前端资源，这个工程只是把它装进 WebView 的外壳。

## 为什么需要这个外壳

Wwise 音频要求页面处于 **crossOriginIsolated**（需要 COOP / COEP 两个响应头），
而 `file://` 或 `asset://` 都没法提供响应头，直接塞进 WebView 会导致**音乐和音效全部静音**。
所以工程里自带一个本机回环 HTTP 服务（`AssetServer.java`）：
从 assets 直接流式读取资源、补上 COOP / COEP 头，并支持 Range 请求（Wwise 分段流式依赖 206）。

## 构建步骤

1. 项目根目录先构建网页资源：

   ```bash
   npm run build
   ```

2. 把资源复制进安卓工程：

   ```bash
   cd packaging/android
   ./prepare-assets.sh
   ```

3. 用 Android Studio 打开 `packaging/android` 目录，等待 Gradle 同步完成，然后：

   - `Build → Build Bundle(s) / APK(s) → Build APK(s)`
   - 或在命令行：`./gradlew assembleRelease`

   产物：`app/build/outputs/apk/release/app-release.apk`

## 名字

安装后桌面显示的名字在 `app/src/main/res/values/strings.xml`：

```xml
<string name="app_name">Wake up 打工人！</string>
```

## 注意事项

- 资源约 340MB，APK 体积会比较大；`noCompress` 已经配置好，不要再让 aapt 压缩 `.wem` / `.glb`。
- `minSdk 26`（Android 8.0），因为 WebView 版本和 Wwise 的 AudioWorklet 需要较新的内核。
- 上传 TapTap 时：手机端勾 Android APK 下载，**不要勾「小游戏」**。
