// ForgeaX's WKWebView may omit the browser Pointer Lock API. Use its
// existing desktop command in that case; browser builds keep the web API.
export function createPointerLock(canvas, notify, win = window, doc = document) {
  let nativeLocked = false, pending = false, generation = 0;
  let invoke;
  for (let current = win; current;) {
    try {
      const bridge = current.__TAURI_INTERNALS__;
      if (typeof bridge?.invoke === 'function') {
        invoke = bridge.invoke.bind(bridge);
        break;
      }
      if (current.parent === current) break;
      current = current.parent;
    } catch { break; }
  }
  const locked = () => nativeLocked || doc.pointerLockElement === canvas || doc.webkitPointerLockElement === canvas;
  const release = () => {
    generation++;
    nativeLocked = false;
    canvas.style.cursor = '';
    if (invoke) void invoke('set_pointer_capture', {capture:false}).catch(console.error);
    const exit = doc.exitPointerLock ?? doc.webkitExitPointerLock;
    if (exit && (doc.pointerLockElement === canvas || doc.webkitPointerLockElement === canvas)) exit.call(doc);
  };
  const request = async () => {
    if (pending || locked()) return;
    pending = true;
    const ticket = generation;
    try {
      const webRequest = canvas.requestPointerLock ?? canvas.webkitRequestPointerLock;
      if (webRequest) {
        try {
          await webRequest.call(canvas);
          if (ticket !== generation) { release(); return; }
          // Legacy APIs return void and report success through pointerlockchange.
          if (locked() || !invoke) return;
        } catch (error) { if (!invoke) throw error; }
      }
      if (ticket !== generation) return;
      if (!invoke) throw new Error('当前预览没有可用的鼠标捕获接口');
      await invoke('set_pointer_capture', {capture:true});
      if (ticket !== generation) { release(); return; }
      nativeLocked = true;
      canvas.style.cursor = 'none';
      notify('鼠标已捕获 · 移动鼠标转向 · Esc 释放', 4);
    } catch (error) {
      notify('鼠标锁定失败：'+(error?.message ?? String(error)), 8);
    } finally { pending = false; }
  };
  const changed = () => { if (locked()) notify('鼠标已锁定 · 移动鼠标转向 · Esc 释放', 3); };
  doc.addEventListener('pointerlockchange', changed);
  doc.addEventListener('webkitpointerlockchange', changed);
  win.addEventListener('pagehide', release);
  win.addEventListener('blur', release);
  doc.addEventListener('visibilitychange', () => { if(doc.hidden) release(); });
  return {locked, request, release};
}
