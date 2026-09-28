import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8'));
const labels={demo:'Demo',alpha:'Alpha',beta:'Beta',rc:'RC',release:'正式版'};
const release={version:pkg.version,stage:pkg.game.stage,title:pkg.game.title,label:`${labels[pkg.game.stage]} v${pkg.version}`};
const escapeHtml=value=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export default defineConfig({
  plugins:[{
    name:'game-version',
    transformIndexHtml:html=>html.replaceAll('__GAME_TITLE__',escapeHtml(release.title)).replaceAll('__GAME_RELEASE__',escapeHtml(release.label)),
    generateBundle(){this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify(release,null,2)+'\n'});},
  }],
  base:'./',
  build:{rollupOptions:{input:{main:'index.html',viewer:'fbx-viewer.html'}}},
  // 保留团队 Cloud Agent 通过代理域名访问开发服务的配置。
  server:{host:'0.0.0.0',port:5200,strictPort:true,allowedHosts:true},
});
