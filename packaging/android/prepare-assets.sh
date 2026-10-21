#!/bin/sh
# 把构建好的网页资源复制进安卓工程的 assets/www
# 用法：在 packaging/android 目录下执行 ./prepare-assets.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
DIST="$HERE/../../dist"
TARGET="$HERE/app/src/main/assets/www"

if [ ! -f "$DIST/index.html" ]; then
  echo "找不到 $DIST，请先在项目根目录执行 npm run build"
  exit 1
fi

rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -R "$DIST/." "$TARGET/"
echo "资源已就位：$TARGET"
du -sh "$TARGET"
