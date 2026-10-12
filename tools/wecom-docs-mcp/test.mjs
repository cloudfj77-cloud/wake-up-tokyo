import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const temporary = await mkdtemp(join(tmpdir(), 'wecom-mcp-test-'));
process.env.WECOM_DOCS_DATA_DIR = temporary;
const { DocsBrowser, allowedUrl } = await import('./browser.mjs');

test('domain restrictions', () => {
  assert.equal(allowedUrl('https://doc.weixin.qq.com/smartpage/test'), 'https://doc.weixin.qq.com/smartpage/test');
  for (const url of ['file:///etc/passwd', 'http://docs.qq.com/', 'https://docs.qq.com.evil.com/', 'https://user@docs.qq.com/', 'https://docs.qq.com:8443/']) assert.throws(() => allowedUrl(url));
});
test('real Chrome editor, backups and conflict checks', async () => {
  const instance = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await instance.newContext();
  await context.route('https://doc.weixin.qq.com/**', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<title>Fixture</title><main><div id="editor" contenteditable="true"><b>代号</b>：Wake Up，正文。</div><div id="duplicate" contenteditable="true">重复 重复</div></main>' }));
  const browser = new DocsBrowser(); browser.context = context; browser.page = await context.newPage();
  try {
    await browser.open('https://doc.weixin.qq.com/smartpage/fixture');
    const inspection = await browser.inspect();
    assert.ok(inspection.frames[0].candidates.some(x => x.selector === '#editor' && x.editable));
    const read = await browser.read({ selector: '#editor', limit: 2 });
    assert.equal(read.text, '代号'); assert.equal(read.has_more, true);
    const args = { selector: '#editor', expected_sha256: read.sha256, old_text: '代号：Wake Up', new_text: '项目：Wake Up' };
    assert.equal((await browser.replace(args)).dry_run, true);
    assert.equal((await browser.read({ selector: '#editor' })).sha256, read.sha256);
    const result = await browser.replace({ ...args, dry_run: false });
    assert.equal(result.dom_verified, true); assert.equal(result.server_save_verified, false);
    assert.equal((await browser.read({ selector: '#editor' })).text, '项目：Wake Up，正文。');
    assert.equal(JSON.parse(await readFile(result.backup, 'utf8')).text, '代号：Wake Up，正文。');
    await assert.rejects(browser.replace({ ...args, dry_run: false }), /正文已变化/);
    const duplicate = await browser.read({ selector: '#duplicate' });
    await assert.rejects(browser.replace({ selector: '#duplicate', expected_sha256: duplicate.sha256, old_text: '重复', new_text: '新' }), /恰好出现一次/);
    await assert.rejects(browser.replace({ selector: 'main', expected_sha256: read.sha256, old_text: '正文', new_text: '内容' }), /不是 contenteditable/);
  } finally { await instance.close(); await rm(temporary, { recursive: true, force: true }); }
});
test('stdio MCP initialize, tools and error result', async () => {
  const client = new Client({ name: 'smoke-test', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [new URL('./server.mjs', import.meta.url).pathname] });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(x => x.name).sort(), ['close_browser', 'inspect_document', 'open_document', 'read_document', 'replace_text']);
    assert.equal((await client.callTool({ name: 'open_document', arguments: { url: 'https://example.com' } })).isError, true);
    assert.equal((await client.callTool({ name: 'close_browser', arguments: {} })).isError, undefined);
  } finally { await client.close(); }
});
