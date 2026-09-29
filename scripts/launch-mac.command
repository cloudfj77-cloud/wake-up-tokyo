#!/bin/bash
# 双击启动《Wake Up Tokyo》本地版。
# 会先在本机起一个小服务（只监听 127.0.0.1，不联网），然后自动打开浏览器。
cd "$(dirname "$0")" || exit 1

PORT=5310

# 找 Node：PATH 里的 → 常见安装位置 → WorkBuddy 托管版本
NODE_BIN=""
for c in node /usr/local/bin/node /opt/homebrew/bin/node \
         "$HOME/.workbuddy/binaries/node/versions/22.22.2-3/bin/node" \
         "$HOME/.nvm/versions/node/"*/bin/node; do
  if command -v "$c" >/dev/null 2>&1; then NODE_BIN="$c"; break; fi
done

open_browser() {
  ( sleep 2; open "http://127.0.0.1:$PORT/" >/dev/null 2>&1 ) &
}

echo "=========================================="
echo " Wake Up Tokyo 正在启动..."
echo " 启动后浏览器会打开 http://127.0.0.1:$PORT/"
echo " 要退出游戏，直接关掉这个窗口就行"
echo "=========================================="
echo ""

if [ -n "$NODE_BIN" ]; then
  open_browser
  exec "$NODE_BIN" serve.mjs "$PORT"
elif command -v python3 >/dev/null 2>&1; then
  echo "（没找到 Node.js，改用 Python3 兜底，加载会稍慢）"
  open_browser
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
else
  echo "没找到 Node.js 或 Python3，没法启动本地服务。"
  echo "装一个 Node.js（https://nodejs.org）之后，把这个文件再双击一次。"
  read -r -n 1 -p "按任意键关闭..."
  exit 1
fi
