package com.zhixuan.wakeupworker;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * Wake up 打工人！ —— 网页版的安卓外壳。
 *
 * 游戏本体是纯前端资源（dist/），这里只做两件事：
 *   1. 起一个本地 HTTP 服务把 assets/www 里的资源吐给 WebView
 *   2. 给响应加上 COOP / COEP 响应头 —— 没有这两个头浏览器就不是 crossOriginIsolated，
 *      Wwise 的 AudioWorklet 起不来，音乐会整段消失。
 */
public class MainActivity extends Activity {
    private WebView web;
    private AssetServer server;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        server = new AssetServer(getAssets(), 8099);
        server.start();

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(false);
        s.setSupportZoom(false);
        web.setBackgroundColor(0xFF000000);
        setContentView(web);
        web.loadUrl("http://127.0.0.1:8099/index.html");
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // 把音量键之类的按键交给网页，方便游戏内用键盘操作
        if (web != null && event.getAction() == KeyEvent.ACTION_DOWN) web.requestFocus();
        return super.dispatchKeyEvent(event);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        if (server != null) { server.stop(); server = null; }
        super.onDestroy();
    }

    AssetManager assets() { return getAssets(); }
}
