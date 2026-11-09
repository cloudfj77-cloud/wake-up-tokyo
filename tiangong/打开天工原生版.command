#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
 print '请先安装 Node.js 24，然后重新打开。'
 read '?按回车关闭…'
 exit 1
fi
node tools/serve-web.mjs --open
