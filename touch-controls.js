// Independent pointer ownership supports movement, aiming and attacks together.
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  const override = new URLSearchParams(location.search).get('touch');
  return override === '1' || (override !== '0' && (globalThis.Capacitor?.isNativePlatform?.() || matchMedia('(any-pointer: coarse)').matches));
}
export function stickVector(dx, dy, radius) {
  const distance = Math.hypot(dx, dy), magnitude = Math.min(1, distance / radius);
  if (magnitude < .16) return { x: 0, y: 0, sprint: false };
  return { x: dx / distance * magnitude, y: dy / distance * magnitude, sprint: magnitude > .88 };
}
export function mobileDialogCopy(html) {
  return html.replace(/进入游戏后鼠标隐藏并转向[^<]*<br>左键 \/ J 轻击[^<]*<br>1 徒手[^<]*<br>/,
    '左下摇杆移动，推至外圈奔跑；在右侧空白处拖动转向。<br>右下可攻击、重击、闪避、跳跃、换武器和换弹；按住攻击或重击可连续出招。<br>右上打开地图或暂停；切到后台会自动暂停。<br>')
    .replace('鼠标锁定不可用时，可拖动右键或使用方向键转动镜头。', '在屏幕右侧空白处拖动镜头；可在这里调节视角灵敏度。')
    .replace('短按 Shift 闪避 / 长按奔跑，R 装填旧档枪械，F 号令，Tab 地图。', '左侧摇杆移动，外圈奔跑；右侧按键攻击、闪避、跳跃、换武器与换弹。');
}
const TOUCH_ICONS={"primary":"<path d=\"m5 19 8-14M10 20 8-14M16 19l5-9M3 13l3 1M16 3l1 3\"/>","heavy":"<path d=\"M5 13V9l3-1V5l4 1 3-2 3 2v3l3 2-2 9H8l-5-5zM8 8v5m4-7v6m4-6v6\"/>","roll":"<path d=\"m7 5 7 7-7 7m7-14 7 7-7 7M3 9h3m-4 5h3\"/>","jump":"<path d=\"M12 20V4m-7 7 7-7 7 7M4 21h16\"/>","weapon":"<path d=\"M3 7h17m-5-5 5 5-5 5M21 17H4m5-5-5 5 5 5\"/>","reload":"<path d=\"M19 8a8 8 0 1 0 1 7M19 3v6h-6M9 9h5v8H9z\"/>"};
export function createTouchControls(doc = document, hooks = {}) {
  const { onMove = () => {}, onLook = () => {}, actions = {}, active = () => true } = hooks;
  const root = doc.createElement('div');
  root.id = 'touchUI';
  root.innerHTML = '<div id="touchLook" aria-label="拖动调整视角"></div><div id="touchStick" aria-label="移动摇杆"><span class="stickRing"></span><div id="touchKnob"></div><small>移动 · 外圈奔跑</small></div><div class="touchActions" aria-label="战斗操作">' +
    [['primary','攻击'],['heavy','重击'],['roll','闪避'],['jump','跳跃'],['weapon','换武器'],['reload','换弹']].map(([act,label]) =>
      '<button type="button" class="touchBtn touch-'+act+'" data-act="'+act+'" aria-label="'+label+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+TOUCH_ICONS[act]+'</svg><span>'+label+'</span></button>').join('') +
    '</div><nav class="touchTools"><button type="button" data-act="map" aria-label="打开地图">地图</button><button type="button" data-act="pause" aria-label="暂停游戏">Ⅱ</button><button type="button" data-act="fullscreen" aria-label="全屏">⛶</button></nav><div class="touchLandscape">横屏游玩，双手操作更舒适</div>';
  (doc.body || doc.documentElement).appendChild(root);
  doc.body.classList.add('touch-mode');
  const win = doc.defaultView, stick = root.querySelector('#touchStick'), knob = root.querySelector('#touchKnob');
  let stickId = null, lookId = null, last = null, visible = false;
  const held = new Map(), listeners = [];
  const listen = (node,event,fn) => { node.addEventListener(event,fn); listeners.push(() => node.removeEventListener(event,fn)); };
  const capture = (node,e) => { e.preventDefault(); e.stopPropagation(); node.setPointerCapture?.(e.pointerId); };
  const reset = () => {
    stickId = lookId = null; last = null;
    knob.style.transform = 'translate(0px,0px)'; onMove(0,0,false);
    for (const {timer,button} of held.values()) { clearInterval(timer); button.classList.remove('pressed'); }
    held.clear();
  };
  const moveStick = e => {
    const r = stick.getBoundingClientRect(), radius = r.width * .32;
    const dx = e.clientX-r.left-r.width/2, dy = e.clientY-r.top-r.height/2;
    const vector = stickVector(dx,dy,radius), scale = Math.min(1,radius/(Math.hypot(dx,dy)||1));
    knob.style.transform = 'translate('+dx*scale+'px,'+dy*scale+'px)';
    onMove(vector.x,vector.y,vector.sprint);
  };
  listen(stick,'pointerdown',e => {
    if (!active() || stickId !== null) return;
    stickId=e.pointerId; capture(stick,e); moveStick(e);
  });
  listen(stick,'pointermove',e => { if (active() && stickId === e.pointerId) moveStick(e); });
  const look = root.querySelector('#touchLook');
  listen(look,'pointerdown',e => {
    if (!active() || lookId !== null) return;
    lookId=e.pointerId; last={x:e.clientX,y:e.clientY}; capture(look,e);
  });
  listen(look,'pointermove',e => {
    if (!active() || lookId !== e.pointerId || !last) return;
    onLook(e.clientX-last.x,e.clientY-last.y); last={x:e.clientX,y:e.clientY};
  });
  for (const button of root.querySelectorAll('[data-act]')) {
    listen(button,'pointerdown',e => {
      if (!active() || [...held.values()].some(value => value.button === button)) return;
      capture(button,e);
      const act=button.dataset.act, fire=() => { if (visible && active()) actions[act]?.(); };
      const timer=['primary','heavy'].includes(act) ? setInterval(fire,100) : null;
      held.set(e.pointerId,{timer,button}); button.classList.add('pressed');
      if (act === 'fullscreen') {
        const promise=doc.fullscreenElement ? doc.exitFullscreen?.() : doc.documentElement.requestFullscreen?.();
        Promise.resolve(promise).catch(() => {});
      } else fire();
    });
  }
  const end = e => {
    if (stickId === e.pointerId) { stickId=null; knob.style.transform='translate(0px,0px)'; onMove(0,0,false); }
    if (lookId === e.pointerId) { lookId=null; last=null; }
    const entry=held.get(e.pointerId);
    if (entry) { clearInterval(entry.timer); entry.button.classList.remove('pressed'); held.delete(e.pointerId); }
  };
  for (const type of ['pointerup','pointercancel','lostpointercapture']) listen(root,type,end);
  listen(win,'blur',reset); listen(win,'resize',reset); listen(doc,'visibilitychange',reset);
  return {
    root, reset,
    show() { visible=true; root.classList.add('on'); },
    hide() { if (!visible) return; visible=false; root.classList.remove('on'); reset(); },
    dispose() { visible=false; reset(); listeners.forEach(remove => remove()); root.remove(); doc.body.classList.remove('touch-mode'); },
  };
}
