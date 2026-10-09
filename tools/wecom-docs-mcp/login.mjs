import { DocsBrowser } from './browser.mjs';
const browser = new DocsBrowser();
await browser.open(process.argv[2] || 'https://doc.weixin.qq.com/');
console.log('请在独立 Chrome 中扫码登录，完成后关闭该浏览器。登录态保存在本机，不进入 Git。');
process.on('SIGINT', async () => { await browser.close(); process.exit(0); });
