import { chromium } from 'playwright';
import { mkdir, chmod, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const dataDir = process.env.WECOM_DOCS_DATA_DIR || join(homedir(), '.local/share/wecom-docs-mcp');
export function allowedUrl(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') ||
      !['doc.weixin.qq.com', 'docs.weixin.qq.com', 'docs.qq.com'].includes(u.hostname)) {
    throw new Error('仅支持 HTTPS 企微/腾讯文档链接（doc.weixin.qq.com、docs.weixin.qq.com、docs.qq.com）。');
  }
  return u.href;
}
const hash = text => createHash('sha256').update(text).digest('hex');
const roots = '.ProseMirror, .ql-editor, [data-slate-editor="true"], [contenteditable="true"], [contenteditable="plaintext-only"], main, [role="main"]';

export class DocsBrowser {
  constructor(options = {}) { this.options = options; this.context = null; this.page = null; }
  async start() {
    if (this.context) return;
    await mkdir(dataDir, { recursive: true, mode: 0o700 });
    await chmod(dataDir, 0o700);
    this.context = await chromium.launchPersistentContext(join(dataDir, 'profile'), {
      channel: 'chrome', headless: false, viewport: null, acceptDownloads: false, ...this.options,
    });
    this.context.setDefaultTimeout(12000);
    this.context.on('close', () => { this.context = null; this.page = null; });
    this.page = this.context.pages()[0] || await this.context.newPage();
  }
  async open(url) {
    url = allowedUrl(url);
    await this.start();
    if (!this.page || this.page.isClosed()) this.page = await this.context.newPage();
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await this.page.bringToFront();
    return { url: this.page.url(), title: await this.page.title(), message: '若显示登录页，请在浏览器扫码，完成后再次读取。' };
  }
  async current() {
    await this.start();
    if (!this.page || this.page.isClosed()) throw new Error('请先调用 open_document 打开文档。');
    allowedUrl(this.page.url());
    return this.page;
  }
  frame(page, index) {
    const frame = page.frames()[index];
    if (!frame) throw new Error('frame_index 已失效，请重新 inspect_document。');
    // Do not expose unrelated cross-origin embeds.
    if (index !== 0) allowedUrl(frame.url());
    return frame;
  }
  async inspect() {
    const page = await this.current();
    const frames = [];
    for (const [index, frame] of page.frames().entries()) {
      try {
        this.frame(page, index);
        const candidates = await frame.locator(roots).evaluateAll(elements => {
          function path(el) {
            const parts = [];
            for (; el && el.nodeType === 1; el = el.parentElement) {
              if (el.id) { parts.unshift('#' + CSS.escape(el.id)); break; }
              const siblings = el.parentElement ? [...el.parentElement.children].filter(x => x.tagName === el.tagName) : [el];
              parts.unshift(el.tagName.toLowerCase() + ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')');
            }
            return parts.join(' > ');
          }
          return elements.filter(el => el.getClientRects().length).slice(0, 80).map(el => ({
            selector: path(el), editable: el.isContentEditable,
            characters: el.textContent.length, preview: el.innerText.slice(0, 300),
          }));
        });
        frames.push({ frame_index: index, url: frame.url(), candidates });
      } catch { /* login/third-party frames are not document content */ }
    }
    return { url: page.url(), title: await page.title(), frames,
      warning: '候选区域可能是标题、评论或局部块。先读取目标区域确认；DOM 读取不保证包含折叠、虚拟化、画布或未加载正文。' };
  }
  async target(selector, frame_index = 0, editable = false) {
    const page = await this.current();
    const frame = this.frame(page, frame_index);
    const locator = frame.locator(selector);
    if (await locator.count() !== 1 || !(await locator.isVisible())) throw new Error('selector 必须唯一匹配一个可见区域，请重新 inspect_document。');
    if (editable && !(await locator.evaluate(el => el.isContentEditable))) throw new Error('目标不是 contenteditable 编辑器；拒绝写入。');
    return { page, frame, locator };
  }
  async read({ selector, frame_index = 0, offset = 0, limit = 20000 } = {}) {
    const page = await this.current();
    if (!selector) return { ...(await this.inspect()), message: '请从候选区域选择正文 selector 后再次读取。未将页面导航文字当作正文。' };
    const { locator } = await this.target(selector, frame_index);
    const text = await locator.textContent();
    return { url: page.url(), title: await page.title(), selector, frame_index,
      text: text.slice(offset, offset + limit), offset, total_characters: text.length,
      has_more: offset + limit < text.length, sha256: hash(text),
      completeness: '仅当前 DOM 区域；不能保证 smartpage 全文或服务器已保存。' };
  }
  async replace({ selector, frame_index = 0, expected_sha256, old_text, new_text, dry_run = true }) {
    const { page, locator } = await this.target(selector, frame_index, true);
    const before = await locator.textContent();
    if (hash(before) !== expected_sha256) throw new Error('正文已变化，请重新读取后生成修改。');
    const start = before.indexOf(old_text);
    if (!old_text || start < 0 || before.indexOf(old_text, start + 1) >= 0) throw new Error('old_text 必须非空且在目标区域中恰好出现一次。');
    const after = before.slice(0, start) + new_text + before.slice(start + old_text.length);
    if (dry_run) return { dry_run: true, old_text, new_text, before_sha256: hash(before), after_sha256: hash(after) };
    const backupDir = join(dataDir, 'backups');
    await mkdir(backupDir, { recursive: true, mode: 0o700 });
    const backup = join(backupDir, Date.now() + '-' + randomUUID() + '.json');
    await writeFile(backup, JSON.stringify({ url: page.url(), selector, frame_index, text: before, html: await locator.innerHTML(), old_text, new_text }, null, 2), { mode: 0o600 });
    // Select the exact text range, then use a real browser editing operation.
    // Never assign innerHTML/textContent: that bypasses rich editor state.
    await locator.evaluate((el, { before, start, length }) => {
      if (el.textContent !== before) throw new Error('写入前正文发生变化。');
      el.focus();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node, position = 0, first, last;
      while ((node = walker.nextNode())) {
        const end = position + node.textContent.length;
        if (!first && start >= position && start < end) first = [node, start - position];
        if (start + length > position && start + length <= end) { last = [node, start + length - position]; break; }
        position = end;
      }
      if (!first || !last) throw new Error('无法定位文本范围，未写入。');
      const range = document.createRange();
      range.setStart(...first); range.setEnd(...last);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    }, { before, start, length: old_text.length });
    await page.keyboard.insertText(new_text);
    try {
      // Poll the locator in its own frame; frameworks may apply input asynchronously.
      const deadline = Date.now() + 5000;
      while (await locator.textContent() !== after && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
      if (await locator.textContent() !== after) throw new Error('编辑器返回的正文与预期不一致。');
    } catch (error) {
      throw new Error(`写入结果未验证，勿自动重试。备份：${backup}。${error.message}`);
    }
    return { changed: true, dom_verified: true, server_save_verified: false, backup, sha256: hash(after),
      message: '已核对当前 DOM；仍需检查页面保存状态并重新打开验证持久化。' };
  }
  async close() { if (this.context) await this.context.close(); }
}
