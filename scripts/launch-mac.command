#!/bin/bash
# 双击启动《Wake Up Tokyo》本地版。
# 会先在本机起一个小服务（只监听 127.0.0.1，不联网），然后自动打开浏览器。
cd "$(dirname "$0")" || exit 1

SCRIPT_DIR="$PWD"
PORT="${WAKE_PORT:-5310}"
# 分发版：启动器与首页同目录；源码版：从 scripts 找构建输出。
if [ -f "$SCRIPT_DIR/index.html" ]; then
  GAME_DIR="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../dist/index.html" ]; then
  GAME_DIR="$SCRIPT_DIR/../dist"
elif [ -f "$SCRIPT_DIR/../../web/index.html" ]; then
  GAME_DIR="$SCRIPT_DIR/../../web"
else
  echo "找不到游戏首页，请先构建游戏，或检查收到的游戏文件夹是否完整。"
  exit 1
fi

# 找 Node：PATH 里的 → 常见安装位置 → WorkBuddy 托管版本
NODE_BIN=""
for c in node /usr/local/bin/node /opt/homebrew/bin/node \
         "$HOME/.workbuddy/binaries/node/versions/22.22.2-3/bin/node" \
         "$HOME/.nvm/versions/node/"*/bin/node; do
  if command -v "$c" >/dev/null 2>&1; then NODE_BIN="$c"; break; fi
done

open_browser() {
  [ "${WAKE_NO_OPEN:-0}" = 1 ] && return
  ( sleep 2; open "http://127.0.0.1:$PORT/" >/dev/null 2>&1 ) &
}

echo "=========================================="
echo " Wake Up Tokyo 正在启动..."
echo " 启动后浏览器会打开 http://127.0.0.1:$PORT/"
echo " 要退出游戏，直接关掉这个窗口就行"
echo "=========================================="
echo ""

if [ -n "$NODE_BIN" ]; then
  if [ ! -f "$SCRIPT_DIR/serve.mjs" ]; then
    echo "缺少 serve.mjs，请把它与启动器一起放入游戏文件夹。"
    exit 1
  fi
  open_browser
  exec "$NODE_BIN" "$SCRIPT_DIR/serve.mjs" "$PORT" "$GAME_DIR"
elif command -v python3 >/dev/null 2>&1; then
  echo "（没找到 Node.js，改用带音乐隔离响应头的 Python3 服务）"
  open_browser
  exec python3 -c '
import http.server, functools, sys, os, gzip, re
class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        self._range_remaining = None
        if path.endswith(".wem") and os.path.isfile(path) and self.headers.get("Range"):
            size = os.path.getsize(path)
            match = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers["Range"])
            start = end = None
            if match and (match[1] or match[2]):
                start = int(match[1]) if match[1] else max(0, size - int(match[2]))
                end = min(int(match[2]), size - 1) if match[1] and match[2] else size - 1
            if start is None or start >= size or end < start:
                self.send_response(416)
                self.send_header("Content-Range", "bytes */" + str(size))
                self.end_headers()
                return None
            self.send_response(206)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
            self.send_header("Content-Length", str(end - start + 1))
            self.end_headers()
            source = open(path, "rb")
            source.seek(start)
            self._range_remaining = end - start + 1
            return source
        if not os.path.exists(path) and os.path.isfile(path + ".gz"):
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Vary", "Accept-Encoding")
            tokens = {}
            for token in self.headers.get("Accept-Encoding", "").lower().split(","):
                parts = [p.strip() for p in token.split(";")]
                try:
                    tokens[parts[0]] = float(next((p[2:] for p in parts[1:] if p.startswith("q=")), "1"))
                except ValueError:
                    tokens[parts[0]] = 0
            encoded = tokens.get("gzip", tokens.get("*", 0)) > 0
            if encoded:
                self.send_header("Content-Encoding", "gzip")
                self.send_header("Content-Length", str(os.path.getsize(path + ".gz")))
            self.end_headers()
            return open(path + ".gz", "rb") if encoded else gzip.open(path + ".gz", "rb")
        return super().send_head()
    def copyfile(self, source, outputfile):
        if self._range_remaining is None:
            return super().copyfile(source, outputfile)
        remaining = self._range_remaining
        while remaining:
            data = source.read(min(65536, remaining))
            if not data:
                break
            outputfile.write(data)
            remaining -= len(data)
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), functools.partial(Handler, directory=sys.argv[2])).serve_forever()
' "$PORT" "$GAME_DIR"
else
  echo "没找到 Node.js 或 Python3，没法启动本地服务。"
  echo "装一个 Node.js（https://nodejs.org）之后，把这个文件再双击一次。"
  read -r -n 1 -p "按任意键关闭..."
  exit 1
fi
