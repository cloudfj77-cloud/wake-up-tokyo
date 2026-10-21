package com.zhixuan.wakeupworker;

import android.content.res.AssetManager;

import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.InetAddress;
import java.io.IOException;
import java.net.Socket;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 本机回环上的静态资源服务，专门为 Wwise 准备：
 *   - 加 COOP / COEP 响应头，否则文档不是 crossOriginIsolated，音频起不来
 *   - 支持 Range 请求（206），Wwise 的分段流式读取靠它
 *   - 支持 .wem / .glb / .wasm 等大文件的流式返回，不整份读进内存
 */
public class AssetServer {
    private final AssetManager assets;
    private final int port;
    private ServerSocket socket;
    private volatile boolean running;

    public AssetServer(AssetManager assets, int port) {
        this.assets = assets;
        this.port = port;
    }

    public void start() throws IOException {
        socket = new ServerSocket(port, 0, InetAddress.getByName("127.0.0.1"));
        running = true;
        new Thread(() -> {
            try {
                while (running) {
                    Socket client = socket.accept();
                    Thread handler = new Thread(() -> {
                        try { serve(client); } catch (Throwable ignored) { }
                        try { client.close(); } catch (Throwable ignored) { }
                    });
                    handler.setDaemon(true);
                    handler.start();
                }
            } catch (Throwable ignored) { }
        }, "asset-server").start();
    }

    public void stop() {
        running = false;
        try { if (socket != null) socket.close(); } catch (Throwable ignored) { }
    }

    private void serve(Socket client) throws Exception {
        client.setSoTimeout(10000);
        InputStream in = client.getInputStream();
        StringBuilder head = new StringBuilder();
        int b;
        while ((b = in.read()) != -1) {
            head.append((char) b);
            if (head.length() > 8192) return;
            if (head.length() > 4 && head.substring(head.length() - 4).equals("\r\n\r\n")) break;
        }
        String[] lines = head.toString().split("\r\n");
        if (lines.length == 0) return;
        String[] parts = lines[0].split(" ");
        if (parts.length < 2) return;
        String raw = parts[1];
        String path = raw.contains("?") ? raw.substring(0, raw.indexOf('?')) : raw;
        path = URLDecoder.decode(path, "UTF-8");
        if (path.equals("/") || path.endsWith("/")) path += "index.html";
        if (!path.startsWith("/") || path.contains("..") || path.contains("\\")) return;
        String asset = "www" + path;

        Map<String, String> headers = new HashMap<>();
        for (int i = 1; i < lines.length; i++) {
            int c = lines[i].indexOf(':');
            if (c > 0) headers.put(lines[i].substring(0, c).trim().toLowerCase(Locale.US), lines[i].substring(c + 1).trim());
        }
        long start = 0, end = -1;
        String range = headers.get("range");
        boolean partial = range != null && range.startsWith("bytes=");
        if (partial && !range.matches("bytes=[0-9]+-[0-9]*")) return;
        if (partial) {
            String spec = range.substring(6);
            int dash = spec.indexOf('-');
            start = Long.parseLong(spec.substring(0, dash));
            if (dash + 1 < spec.length()) end = Long.parseLong(spec.substring(dash + 1));
        }

        OutputStream out = client.getOutputStream();
        AssetManager.AssetInputStream stream = null;
        long total = -1;
        try {
            android.content.res.AssetFileDescriptor fd = assets.openFd(asset);
            total = fd.getLength();
            if (partial && (start >= total || (end >= 0 && end < start))) {
                out.write(("HTTP/1.1 416 Range Not Satisfiable\r\nContent-Range: bytes */" + total + "\r\nContent-Length: 0\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
                fd.close();
                return;
            }
            FileInputStream fis = fd.createInputStream();
            if (start > 0) { long skipped = 0; while (skipped < start) skipped += fis.skip(start - skipped); }
            stream = null;
            write(out, partial ? 206 : 200, path, total, start, end, partial, fis);
            fis.close();
            fd.close();
            return;
        } catch (Throwable fdError) {
            // 被压缩的资源拿不到文件描述符，退回普通流式读取（不支持 Range）
        }
        try {
            stream = (AssetManager.AssetInputStream) assets.open(asset, AssetManager.ACCESS_STREAMING);
            total = stream.available();
            write(out, 200, path, total, 0, -1, false, stream);
        } catch (Throwable missing) {
            String body = "404 Not Found";
            out.write(("HTTP/1.1 404 Not Found\r\nContent-Length: " + body.length() + "\r\nConnection: close\r\n\r\n" + body).getBytes("UTF-8"));
        } finally {
            if (stream != null) try { stream.close(); } catch (Throwable ignored) { }
        }
    }

    private void write(OutputStream out, int status, String path, long total, long start, long end, boolean partial, InputStream body) throws Exception {
        long from = partial ? start : 0;
        long to = end >= 0 ? Math.min(end, total - 1) : total - 1;
        long length = to - from + 1;
        StringBuilder h = new StringBuilder();
        h.append(status == 206 ? "HTTP/1.1 206 Partial Content\r\n" : "HTTP/1.1 200 OK\r\n");
        h.append("Content-Type: ").append(mime(path)).append("\r\n");
        h.append("Content-Length: ").append(length).append("\r\n");
        if (partial) h.append("Content-Range: bytes ").append(from).append('-').append(to).append('/').append(total).append("\r\n");
        h.append("Accept-Ranges: bytes\r\n");
        h.append("Cache-Control: no-store\r\n");
        // Wwise 需要独立上下文：缺了这两个头，AudioWorklet 无法启用，音乐与音效全部静音
        h.append("Cross-Origin-Opener-Policy: same-origin\r\n");
        h.append("Cross-Origin-Embedder-Policy: require-corp\r\n");
        h.append("Document-Isolation-Policy: isolate-and-require-corp\r\n");
        h.append("Connection: close\r\n\r\n");
        out.write(h.toString().getBytes("UTF-8"));
        byte[] buffer = new byte[64 * 1024];
        long remaining = length;
        while (remaining > 0) {
            int want = (int) Math.min(buffer.length, remaining);
            int read = body.read(buffer, 0, want);
            if (read <= 0) break;
            out.write(buffer, 0, read);
            remaining -= read;
        }
        out.flush();
    }

    private static String mime(String path) {
        String p = path.toLowerCase(Locale.US);
        if (p.endsWith(".html")) return "text/html; charset=utf-8";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript; charset=utf-8";
        if (p.endsWith(".css")) return "text/css; charset=utf-8";
        if (p.endsWith(".json")) return "application/json; charset=utf-8";
        if (p.endsWith(".wasm")) return "application/wasm";
        if (p.endsWith(".wem") || p.endsWith(".bnk") || p.endsWith(".glb") || p.endsWith(".fbx")) return "application/octet-stream";
        if (p.endsWith(".mp4")) return "video/mp4";
        if (p.endsWith(".webm")) return "video/webm";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
