@echo off
chcp 65001 >nul
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo 没找到 Node.js，请先安装: https://nodejs.org
  echo 安装完把这个文件再双击一次。
  pause
  exit /b 1
)

echo == 安装依赖 ==
call npm install
if errorlevel 1 (
  pause
  exit /b 1
)

echo == 启动本机服务，浏览器会自动打开 ==
start "" http://localhost:5200/
call npm run dev
pause
