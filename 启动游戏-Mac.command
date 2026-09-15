#!/bin/bash
cd "$(dirname "$0")" || exit 1

if ! command -v npm >/dev/null 2>&1; then
  echo "没找到 Node.js，请先安装：https://nodejs.org"
  echo "安装完把这个文件再双击一次。"
  read -r -n 1 -p "按任意键关闭..."
  exit 1
fi

echo "== 安装依赖 =="
npm install || exit 1

echo "== 启动本机服务，浏览器会自动打开 =="
( sleep 4; open "http://localhost:5200/" >/dev/null 2>&1 ) &
npm run dev
