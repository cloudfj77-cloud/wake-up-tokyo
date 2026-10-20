/* 开场分镜过场：点「开始觉醒」后，把漫画按切好的格子一格一格落出来。
   支持多页连播，每页用自己的画面比例；格子越大停留越久，节奏不再一刀切。
   切片由 comic-intro/cut.html 手工切出，导出到 public/comic/；纯逻辑部分可在 Node 里直接测。 */

export const COMIC_INTRO_BASE_FILL = .35;   // 不透明占比低于此值的是页眉/页边剩料，先铺底
export const COMIC_INTRO_LEAD = .35;        // 铺底到第一格之间的间隔（秒）
export const COMIC_INTRO_MIN_GAP = 1.6;     // 每格之间的最短间隔（一张图约 2 秒）
export const COMIC_INTRO_SIZE_GAP = .8;     // 按格子面积追加的停留时间（最大格约 2.4 秒）

/* 阅读顺序：先上后下，同一排从左到右。按中心高度分排，避免分排被“滚雪球”合并。 */
export function comicReadingOrder(pieces) {
  const items = pieces.slice().map(p => ({ p, mid: p.y + p.h / 2 })).sort((a, b) => a.mid - b.mid);
  const bands = [];
  let cur = null;
  for (const it of items) {
    if (!cur) { cur = { ref: it.mid, h: it.p.h, items: [it.p] }; bands.push(cur); continue; }
    if (it.mid - cur.ref <= 0.45 * Math.min(cur.h, it.p.h)) cur.items.push(it.p);
    else { cur = { ref: it.mid, h: it.p.h, items: [it.p] }; bands.push(cur); }
  }
  const out = [];
  for (const band of bands) out.push(...band.items.sort((a, b) => a.x - b.x));
  return out;
}

/* 把切片分成「铺底」和「逐格登场」两类，并排好顺序。 */
export function comicIntroSequence(pieces) {
  const list = (pieces || []).map(p => ({ ...p, fill: Number.isFinite(p.fill) ? p.fill : 1 }));
  return {
    base: list.filter(p => p.fill < COMIC_INTRO_BASE_FILL),
    panels: comicReadingOrder(list.filter(p => p.fill >= COMIC_INTRO_BASE_FILL)),
  };
}

/* 手工指定的出场顺序：order 里写切片文件名（或 src），没写到的排在后面并保持原顺序。 */
export function applyComicOrder(panels, order) {
  const list = (panels || []).slice();
  if (!Array.isArray(order) || !order.length) return list;
  const name = p => String(p.src || '');
  const rank = new Map();
  order.forEach((key, i) => {
    const k = String(key);
    if (!rank.has(k)) rank.set(k, i);
  });
  const rankOf = p => {
    if (rank.has(name(p))) return rank.get(name(p));
    const tail = name(p).split('/').pop();
    return rank.has(tail) ? rank.get(tail) : Infinity;
  };
  return list.sort((a, b) => {
    const ra = rankOf(a), rb = rankOf(b);
    if (ra === rb) return 0;
    if (ra === Infinity) return 1;
    if (rb === Infinity) return -1;
    return ra - rb;
  });
}

/* 节奏：小格子快快过，大格子多留一会儿（按占最大格的面积比例追加停留）。 */
export function comicIntroTimeline(panels, options = {}) {
  const { lead = COMIC_INTRO_LEAD, minGap = COMIC_INTRO_MIN_GAP, sizeGap = COMIC_INTRO_SIZE_GAP } = options;
  const list = (panels || []).slice();
  if (!list.length) return { steps: [], total: 0 };
  const area = p => Math.max(0, p.w || 0) * Math.max(0, p.h || 0);
  const maxArea = Math.max(...list.map(area)) || 1;
  let at = lead;
  const steps = list.map(p => {
    const size = Math.min(1, area(p) / maxArea);
    const step = { delay: +at.toFixed(3), duration: +(.52 + .26 * size).toFixed(3), size: +size.toFixed(3) };
    at += minGap + sizeGap * size;
    return step;
  });
  return { steps, total: +at.toFixed(3) };
}

/* 用缩略图量出不透明占比（页眉/页边剩料占比很低，不该当一格来演）。 */
export function comicAssetUrl(src, assetBase = '') {
  return assetBase + String(src || '').replace(/^\.?\//, '');
}

/* 用缩略图量出不透明占比（页眉/页边剩料占比很低，不该当一格来演）。 */
export function measureComicFill(pieces, assetBase = '') {
  return Promise.all((pieces || []).map(p => new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const w = 48, h = Math.max(1, Math.round(48 * image.naturalHeight / image.naturalWidth));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const g = canvas.getContext('2d', { willReadFrequently: true });
      g.drawImage(image, 0, 0, w, h);
      const data = g.getImageData(0, 0, w, h).data;
      let opaque = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 16) opaque++;
      resolve({ ...p, fill: opaque / (w * h) });
    };
    image.onerror = () => resolve({ ...p, fill: 1 });
    image.src = comicAssetUrl(p.src, assetBase);
  })));
}

const COMIC_INTRO_CSS = `
.comicIntro{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
  background:#17141c;opacity:1;transition:opacity .35s ease}
.comicIntro.closing{opacity:0}
/* 高度撑满浏览器视口，宽度按原画比例自动算；窗口太窄时由 max-width 收住，仍然等比 */
.comicStage{position:relative;height:100vh;height:100dvh;width:auto;max-width:100vw;
  background:#f2eee4;overflow:hidden;transition:opacity .32s ease;
  box-shadow:0 30px 80px rgba(0,0,0,.55)}
.comicStage.turning{opacity:0}
.comicPiece{position:absolute;opacity:0}
.comicIntro.done .comicPiece{opacity:1}
.comicClip{position:absolute;opacity:0;pointer-events:none;overflow:hidden}
.comicClip video{position:absolute;object-fit:cover}
.comicIntro.done .comicClip{opacity:1}
@keyframes comicBaseIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes comicPanelIn{
  0%{opacity:0;transform:scale(1.07) rotate(-.7deg) translateY(8px);filter:brightness(2.4) saturate(.35)}
  38%{opacity:1;filter:brightness(1.55) saturate(.7)}
  70%{filter:brightness(.94) saturate(1.08)}
  100%{opacity:1;transform:none;filter:none}}
.comicLines{position:absolute;inset:-20%;opacity:0;pointer-events:none;z-index:30;
  background:repeating-conic-gradient(from 0deg at 50% 50%,transparent 0deg 3.2deg,rgba(41,35,50,.15) 3.2deg 3.6deg);
  mask-image:radial-gradient(circle,transparent 30%,#000 75%);-webkit-mask-image:radial-gradient(circle,transparent 30%,#000 75%)}
@keyframes comicLinesFlash{0%{opacity:0;transform:scale(.7) rotate(-6deg)}25%{opacity:1}100%{opacity:0;transform:scale(1.25) rotate(4deg)}}
@media(prefers-reduced-motion:reduce){.comicIntro *{animation-duration:.01ms!important}}
`;

let introPlayed = false;
export function comicIntroPlayed() { return introPlayed; }
export function resetComicIntro() { introPlayed = false; }

/* 新开局必须完整播放分镜；按 pages 顺序连播，全部播完后 resolve。 */
export async function playComicIntro(doc = document, options = {}) {
  const { pages = ['./comic/page1.json'], assetBase = './comic/', lead, minGap, sizeGap, onPanel = null } = options;
  if (introPlayed) return false;
  introPlayed = true;

  const loaded = [];
  for (const url of pages) {
    const data = await fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
    if (typeof url === 'object' && url) { loaded.push(url); continue; }
    if (data && Array.isArray(data.pieces) && data.pieces.length) loaded.push(data);
  }
  if (!loaded.length) { introPlayed = false; return false; }

  const host = doc.body || doc.documentElement;
  if (!doc.getElementById('comicIntroStyle')) {
    const style = doc.createElement('style');
    style.id = 'comicIntroStyle';
    style.textContent = COMIC_INTRO_CSS;
    doc.head.appendChild(style);
  }
  const root = doc.createElement('div');
  root.className = 'comicIntro';
  root.innerHTML = '<div class="comicStage"><div class="comicLines"></div></div>';
  const stageEl = root.querySelector('.comicStage');
  const lines = root.querySelector('.comicLines');
  host.appendChild(root);

  const timers = [];
  for (let pageIndex = 0; pageIndex < loaded.length; pageIndex++) {
    const data = loaded[pageIndex];
    // 每页用自己的画面比例
    stageEl.style.aspectRatio = `${data.width || 1080} / ${data.height || 905}`;
    // 翻页时动图和这一页的格子一起清掉，不留到下一页
    stageEl.querySelectorAll('.comicPiece, .comicClip').forEach(el => el.remove());

    const sequence = comicIntroSequence(await measureComicFill(data.pieces, assetBase));
    const base = sequence.base;
    const panels = applyComicOrder(sequence.panels, data.order);
    const { steps, total } = comicIntroTimeline(panels, { lead, minGap, sizeGap });
    const mount = (piece, z) => {
      const img = doc.createElement('img');
      img.className = 'comicPiece';
      img.src = comicAssetUrl(piece.src, assetBase);
      img.style.left = piece.x + '%';
      img.style.top = piece.y + '%';
      img.style.width = piece.w + '%';
      img.style.height = piece.h + '%';
      img.style.zIndex = String(z);
      stageEl.insertBefore(img, lines);
      return img;
    };
    base.forEach((p, i) => { p.el = mount(p, 10 + i); p.el.style.animation = 'comicBaseIn .45s ease-out forwards'; });
    panels.forEach((p, i) => { p.el = mount(p, 10 + base.length + i); });

    // 覆盖在某格上的动图（例如第一格的动态版），跟着那一格一起出现
    for (const clip of (Array.isArray(data.clips) ? data.clips : [])) {
      // 动图常常是整页画布、只有一格有内容，用 crop 只取有内容的那块，避免只露出一小角
      const box = doc.createElement('div');
      box.className = 'comicClip';
      box.style.left = clip.x + '%';
      box.style.top = clip.y + '%';
      box.style.width = clip.w + '%';
      box.style.height = clip.h + '%';
      box.style.zIndex = String(30 + (clip.z || 0));
      const video = doc.createElement('video');
      video.src = comicAssetUrl(clip.src, assetBase);
      video.muted = true;
      video.loop = clip.loop !== false;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.style.objectFit = clip.fit || (clip.crop ? 'fill' : 'cover');
      const crop = clip.crop;
      if (crop && crop.w > 0 && crop.h > 0) {
        video.style.width = (100 / crop.w) + '%';
        video.style.height = (100 / crop.h) + '%';
        video.style.left = (-(crop.x || 0) / crop.w * 100) + '%';
        video.style.top = (-(crop.y || 0) / crop.h * 100) + '%';
      } else {
        video.style.width = '100%'; video.style.height = '100%';
        video.style.left = '0'; video.style.top = '0';
      }
      // 动图内容可能是斜边的（格子本身就是斜的），用多边形把斜出来的黑边切掉
      const poly = Array.isArray(clip.poly) && clip.poly.length >= 3 ? clip.poly : null;
      if (poly) box.style.clipPath = 'polygon(' + poly.map(p => p[0] + '% ' + p[1] + '%').join(', ') + ')';
      box.appendChild(video);
      stageEl.insertBefore(box, lines);
      const step = steps[Math.min(clip.panel || 0, steps.length - 1)];
      timers.push(setTimeout(() => {
        // 和所属那一格同一时刻、同一条动画登场；loop=false 时播完停在最后一帧
        box.style.animation = `comicPanelIn ${step ? step.duration : .58}s cubic-bezier(.2,1.22,.3,1) forwards`;
        const played = video.play();
        if (played && typeof played.catch === 'function') played.catch(() => {});
      }, ((step ? step.delay : 0) + (clip.delay || 0)) * 1000));
    }

    if (pageIndex > 0) {
      stageEl.classList.add('turning');
      await new Promise(r => setTimeout(r, 40));
      stageEl.classList.remove('turning');
    }
    panels.forEach((p, i) => {
      const step = steps[i];
      timers.push(setTimeout(() => {
        p.el.style.animation = `comicPanelIn ${step.duration}s cubic-bezier(.2,1.22,.3,1) forwards`;
        lines.style.animation = 'none';
        void lines.offsetWidth;
        lines.style.animation = 'comicLinesFlash .55s ease-out forwards';
        if (onPanel) { try { onPanel(i, pageIndex); } catch (e) {} }
      }, step.delay * 1000));
    });
    // hold：整页不切的页面可以额外多停留一会儿（秒）
    await new Promise(r => setTimeout(r, (total + .35 + (Number(data.hold) || 0)) * 1000));
    if (pageIndex < loaded.length - 1) {
      stageEl.classList.add('turning');
      await new Promise(r => setTimeout(r, 340));
    }
  }

  timers.forEach(clearTimeout);
  root.classList.add('done');
  root.classList.add('closing');
  setTimeout(() => root.remove(), 380);
  return true;
}
