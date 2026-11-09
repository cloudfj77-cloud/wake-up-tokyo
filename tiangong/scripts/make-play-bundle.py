"""Wrap the unmodified official Web ZIP with a local launcher and credits."""
from pathlib import Path
import hashlib,json,shutil,sys,zipfile
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
source=Path(sys.argv[1]).resolve()
with zipfile.ZipFile(source) as z:
    names=z.namelist()
    assert 'index.html' in names
    assert all(not n.startswith('/') and '..' not in Path(n).parts for n in names)
release=root/'release';folder=release/f'WakeUp-Tiangong-{version}';folder.mkdir(parents=True,exist_ok=True)
shutil.copy2(source,folder/'game-web.zip')
shutil.copy2(root/'tools/serve-web.mjs',folder/'serve-web.mjs')
shutil.copytree(root/'CREDITS',folder/'CREDITS',dirs_exist_ok=True)
launcher=folder/'打开游戏.command'
launcher.write_text('''#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
 print '请安装 Node.js 24 后重新打开。'
 read '?按回车关闭…'
 exit 1
fi
if [[ ! -f game/index.html ]]; then
 mkdir -p game
 /usr/bin/unzip -q -n game-web.zip -d game || exit 1
fi
node serve-web.mjs --dir game --open
''')
launcher.chmod(0o755)
(folder/'先读我.txt').write_text(f'''Wake up 打工人！· 天工原生版 {version}

这是完整资源的浏览器游戏包。正式运行使用天工原生 WebGPU，不需要旧 Three.js 游戏、ForgeaX 兼容工程或开发工具。

Mac：安装 Node.js 24 和支持 WebGPU 的新版 Chrome / Edge，双击“打开游戏.command”。首次自动解压 game-web.zip，然后启动本机 http://127.0.0.1:5240/ 并打开浏览器。终端保持开启，关闭终端即可停止服务。

其他系统：将 game-web.zip 解压到 game 子目录，在本目录执行：
node serve-web.mjs --dir game --open

不能直接双击 game/index.html；需要启动器提供的 HTTP 服务与跨源隔离响应头。此地址仅供本机游玩。发给队友时可分享这个完整包，或把官方 game-web.zip 配合所需响应头部署到 HTTPS 静态托管。

WASD 移动；E 奔跑；空格翻滚；Shift 跳跃；C 蹲伏；左键/J 攻击；右键/K 重击；数字键/滚轮切武器；R 装填；F 号令；V 归队；Tab 地图；Esc/P 暂停。点击画面捕获鼠标。默认海滨地图，可在主菜单切换东京；设置内可开启触屏操作。存档保存在当前浏览器和地址，和原游戏分别保存。

原游戏基准 v0.3.76，SDK @forgeax/engine 0.4.19。画面使用原资源和原版 LUT，原生光照与旧版漫画描边仍有差异。资源署名及原许可见 CREDITS，游戏内“游戏说明”也包含许可。测试与性能的具体范围见工程 docs/migration-report.md。
''')
def sha(p):
    digest=hashlib.sha256()
    with p.open('rb') as stream:
        for block in iter(lambda:stream.read(1024*1024),b''):digest.update(block)
    return digest.hexdigest()
manifest={'version':version,'baseVersion':'v0.3.76','sdk':'@forgeax/engine@0.4.19','officialWebZip':source.name,'officialWebZipSha256':sha(source),'modifiedOfficialWebZip':False,'files':{p.relative_to(folder).as_posix():sha(p) for p in folder.rglob('*') if p.is_file() and p.name!='bundle.json'}}
(folder/'bundle.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
output=release/(folder.name+'-play.zip')
with zipfile.ZipFile(output,'w') as z:
    for p in folder.rglob('*'):
        if p.is_file():z.write(p,folder.name+'/'+p.relative_to(folder).as_posix(),compress_type=zipfile.ZIP_STORED if p.suffix=='.zip' else zipfile.ZIP_DEFLATED)
print(json.dumps({'folder':str(folder),'bundle':str(output),'sha256':sha(output),'officialZipSha256':manifest['officialWebZipSha256']},ensure_ascii=False))
