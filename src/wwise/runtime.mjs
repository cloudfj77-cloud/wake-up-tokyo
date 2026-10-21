import {createWwiseStreamIO} from './stream-io.mjs';
const SUCCESS = 1;
const LISTENER = 0xffffffff;
const finite = (v) => { if (!Number.isFinite(v)) throw new Error('Expected finite number'); return v; };
const idOf = (v) => { if (!Number.isInteger(v) || v < 1 || v >= LISTENER) throw new Error('Invalid game object ID'); return v; };
let active = false;
// 音频渲染节奏可以按机器调：?audiointerval=5 提高轮询频率、?audiopasses=6 与 ?audiobudget=4 加大单趟补渲染量。
// 音乐还卡就往大调（更稳，代价是多占一点主线程）；游戏帧率掉了就往小调。
const audioParam = (key, fallback) => {
  const raw = typeof location === 'undefined' ? null : parseFloat(new URLSearchParams(location.search).get(key));
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

export async function createWwiseRuntime({ createModule, wasmUrl, workletUrl, banks, streams = [], events = {}, fetchBytes,
  // 音频渲染节奏：轮询间隔、单趟最多补渲染几趟、单趟渲染的时间预算（毫秒）。
  renderIntervalMs = audioParam('audiointerval', 7), maxFillPasses = audioParam('audiopasses', 4), fillBudgetMs = audioParam('audiobudget', 3) }) {
  if (active) throw new Error('One Wwise runtime per JS realm; dispose the previous runtime first');
  if (!globalThis.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined' || typeof AudioWorkletNode === 'undefined') {
    throw new Error('Wwise requires an isolated browser document and AudioWorklet; inspect the Studio parent and Play frame');
  }
  if (!banks?.length || banks[0].name !== 'Init.bnk') throw new Error('Init.bnk must be first');
  active = true;
  let m, streamIO, frame, disposed = false, renderCount = 0, maxRenderMs = 0, maxRenderGapMs = 0, lastRender = 0, lastError = null, fillPasses = 0;
  const loaded = [], objects = new Set();
  const check = (r, operation) => { if (r !== SUCCESS) { lastError = `${operation}: AKRESULT ${r}`; throw new Error(lastError); } };
  const alive = () => { if (disposed) throw new Error('Wwise runtime disposed'); };
  const object = (id) => { alive(); idOf(id); if (!objects.has(id)) throw new Error(`Unregistered game object ${id}`); return id; };
  function string(s, fn) {
    if (typeof s !== 'string' || !s.length || s.includes('\0')) throw new Error('Expected nonempty name');
    const b = new TextEncoder().encode(s), p = m._malloc(b.length + 1);
    if (!p) throw new Error('String allocation failed');
    try { m.HEAPU8.set(b,p); m.HEAPU8[p+b.length] = 0; return fn(p); } finally { m._free(p); }
  }
  function dispose() {
    if (disposed) return;
    disposed = true; if (frame !== undefined) clearTimeout(frame);
    if (m) {
      streamIO?.close();
      // On unload failure keep buffers alive until Term has stopped all readers.
      const retained = [];
      for (const bank of [...loaded].reverse()) {
        if (m._fw_unload(bank.id, bank.p) === SUCCESS) m._fw_free(bank.p);
        else retained.push(bank.p);
      }
      m._fw_term(); for (const p of retained) m._fw_free(p);
    }
    objects.clear(); active = false;
  }
  try {
    m = await createModule({ locateFile: (f) => f.endsWith('.wasm') ? wasmUrl : f });
    string(workletUrl, (p) => check(m._fw_init(p), 'init'));
    if(streams.length)streamIO=createWwiseStreamIO({module:m,files:streams,onError:message=>{lastError=message;}});
    for (const bank of banks) {
      const b = await (fetchBytes ?? (async (url) => {
        const r = await fetch(url); if (!r.ok) throw new Error(`Bank HTTP ${r.status}: ${url}`);
        return new Uint8Array(await r.arrayBuffer());
      }))(bank.url);
      if (b.length < 12 || new TextDecoder().decode(b.subarray(0,4)) !== 'BKHD') throw new Error(`Not a SoundBank: ${bank.name}`);
      const p = m._fw_alloc(b.length), out = m._malloc(4);
      if (!p || !out) { if (p) m._fw_free(p); if (out) m._free(out); throw new Error('Bank allocation failed'); }
      try {
        m.HEAPU8.set(b,p); check(m._fw_load(p,b.length,out), `load ${bank.name}`);
        loaded.push({name: bank.name, id: m.HEAPU32[out >>> 2], p, bytes: b.length});
      } catch (e) { m._fw_free(p); throw e; } finally { m._free(out); }
    }
    const render = () => {
      if (disposed) return;
      const t = performance.now();
      if(lastRender)maxRenderGapMs=Math.max(maxRenderGapMs,t-lastRender);lastRender=t;
      try {
        // 环形缓冲靠主线程填充，工作线程只管取：缓冲一空它就输出静音，人耳听到的是音乐断一下。
        // 而这个定时器会被长任务拖住（实测平均 18ms 才轮到一次，峰值 183ms），所以不能只渲染一趟 ——
        // 每趟把缓冲灌满为止，主线程再有几十毫秒的停顿，工作线程还有存货。
        // 灌满后再调用会立刻返回，不会白烧 CPU。
        let passes=0;
        do { check(m._fw_render(), 'render'); passes++; }
        while (passes < maxFillPasses && performance.now()-t < fillBudgetMs);
        fillPasses=Math.max(fillPasses,passes);
        renderCount += passes;
        streamIO?.pump();
      } catch (e) { lastError=String(e);dispose(); return; }
      maxRenderMs = Math.max(maxRenderMs, performance.now()-t);
      // Audio is independent of a visible canvas; rAF stops in background tabs.
      // A main-thread timer is still vulnerable to long tasks / browser suspension.
      frame = setTimeout(render, Math.max(1, renderIntervalMs - (performance.now() - t)));
    };
    render();
  } catch (e) { dispose(); throw e; }
  function position(id, p, forward = {x:0,y:0,z:1}, up = {x:0,y:1,z:0}) {
    alive(); check(m._fw_position(id,...[p.x,p.y,p.z,forward.x,forward.y,forward.z,up.x,up.y,up.z].map(finite)), 'position');
  }
  return {
    registerGameObject(id, name = String(id)) { alive(); idOf(id); if (objects.has(id)) return; string(name, p => check(m._fw_register(id,p),'register')); objects.add(id); },
    unregisterGameObject(id) { object(id); check(m._fw_unregister(id),'unregister'); objects.delete(id); },
    postEvent(name, id) { object(id); return string(events[name] ?? name, p => { const playing = m._fw_post(p,id); if (!playing) throw new Error(`PostEvent failed: ${name}`); return playing; }); },
    stopPlaying(id, ms = 40) { alive(); if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid playing ID'); m._fw_stop(id,Math.max(0,finite(ms))); },
    playingStatus(id) { alive();return {playing:!!m._fw_playing(id),positionMs:m._fw_play_position(id)}; },
    setRTPC(name, value, id, ms = 0) { alive(); if (id !== undefined) object(id); string(name,p => check(m._fw_rtpc(p,finite(value),id ?? 0,id === undefined ? 1:0,Math.max(0,finite(ms))),'RTPC')); },
    setSwitch(group, value, id) { object(id); string(group,g => string(value,v => check(m._fw_switch(g,v,id),'switch'))); },
    setState(group, value) { alive(); string(group,g => string(value,v => check(m._fw_state(g,v),'state'))); },
    setPosition(id,p,forward,up) { object(id); position(id,p,forward,up); },
    setListener(p,forward,up) { position(LISTENER,p,forward,up); },
    snapshot() { return {backend:'wwise',disposed,loadedBanks:disposed?[]:loaded.map(({name,id,bytes})=>({name,id,bytes})),objects:objects.size,heapBytes:m.HEAPU8.byteLength,streaming:streamIO?.snapshot()??null,renderCount,maxRenderMs,maxRenderGapMs,fillPasses,starvations:disposed?null:m._fw_starvations(),lastError}; },
    dispose,
  };
}
