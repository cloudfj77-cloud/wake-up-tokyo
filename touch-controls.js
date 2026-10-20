/* 手机版触屏操作：左侧虚拟摇杆移动，右侧拖动转视角，右下角按钮出招。
   桌面端键鼠逻辑完全不动，触屏只是把同样的输入喂进去（写 keys / 调 yaw、pitch）。 */

const TOUCH_CSS = `
#touchUI{position:fixed;inset:0;z-index:120;display:none;touch-action:none;
  -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
#touchUI.on{display:block}
#touchLook{position:absolute;right:0;top:0;bottom:0;width:52%}
#touchStick{position:absolute;left:20px;bottom:22px;width:138px;height:138px;border-radius:50%;
  background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.4)}
#touchKnob{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;
  background:rgba(255,208,101,.85);border:2px solid #292332;pointer-events:none}
.touchBtn{position:absolute;border-radius:50%;background:rgba(255,208,101,.9);color:#292332;font-weight:800;
  font-size:13px;letter-spacing:0;display:flex;align-items:center;justify-content:center;
  border:2px solid #292332;box-shadow:0 3px 0 #292332;text-align:center;line-height:1.1}
.touchBtn:active{transform:translateY(2px);box-shadow:0 1px 0 #292332}
.touchBtn.dim{background:rgba(255,255,255,.35);color:#4a4458}
`;

export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(location.search).get('touch') === '1') return true;   // 桌面调试用
  return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function createTouchControls(doc = document, hooks = {}) {
  const { onMove = () => {}, onLook = () => {}, actions = {}, active = () => true } = hooks;
  const host = doc.body || doc.documentElement;
  if (!doc.getElementById('touchControlStyle')) {
    const style = doc.createElement('style');
    style.id = 'touchControlStyle';
    style.textContent = TOUCH_CSS;
    doc.head.appendChild(style);
  }
  const root = doc.createElement('div');
  root.id = 'touchUI';
  root.innerHTML =
    '<div id="touchLook"></div>' +
    '<div id="touchStick"><div id="touchKnob"></div></div>' +
    '<div class="touchBtn" data-act="heavy" style="right:112px;bottom:60px;width:64px;height:64px;font-size:12px">重击</div>' +
    '<div class="touchBtn" data-act="primary" style="right:24px;bottom:26px;width:78px;height:78px;font-size:15px">攻击</div>' +
    '<div class="touchBtn" data-act="roll" style="right:120px;bottom:150px;width:58px;height:58px;font-size:12px">闪避</div>' +
    '<div class="touchBtn" data-act="jump" style="right:36px;bottom:122px;width:60px;height:60px;font-size:12px">跳跃</div>' +
    '<div class="touchBtn" data-act="weapon" style="right:30px;bottom:200px;width:54px;height:54px;font-size:12px">换枪</div>' +
    '<div class="touchBtn" data-act="pause" style="left:16px;top:16px;width:46px;height:46px;font-size:12px">暂停</div>';
  host.appendChild(root);

  /* ---- 摇杆 ---- */
  const stick = root.querySelector('#touchStick');
  const knob = root.querySelector('#touchKnob');
  const STICK_R = 46;
  let stickId = null;
  const resetStick = () => {
    stickId = null;
    knob.style.transform = 'translate(0px, 0px)';
    onMove(0, 0, false);
  };
  stick.addEventListener('pointerdown', e => {
    if (!active()) return;
    stickId = e.pointerId;
    try{stick.setPointerCapture(e.pointerId);}catch(err){}
    e.preventDefault();
  });
  stick.addEventListener('pointermove', e => {
    if (stickId !== e.pointerId) return;
    const r = stick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > STICK_R) { dx = dx / len * STICK_R; dy = dy / len * STICK_R; }
    knob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    const nx = dx / STICK_R, ny = dy / STICK_R;
    const mag = Math.min(1, Math.hypot(nx, ny));
    // 死区：轻微触碰不算移动；推到 85% 以上算长按奔跑
    if (mag < .22) { onMove(0, 0, false); return; }
    onMove(nx, ny, mag > .85);
  });
  const endStick = e => { if (stickId === e.pointerId) resetStick(); };
  stick.addEventListener('pointerup', endStick);
  stick.addEventListener('pointercancel', endStick);

  /* ---- 转视角：右侧拖动 ---- */
  const look = root.querySelector('#touchLook');
  let lookId = null, last = null;
  look.addEventListener('pointerdown', e => {
    if (!active()) return;
    lookId = e.pointerId;
    last = { x: e.clientX, y: e.clientY };
    try{look.setPointerCapture(e.pointerId);}catch(err){}
    e.preventDefault();
  });
  look.addEventListener('pointermove', e => {
    if (lookId !== e.pointerId || !last) return;
    onLook(e.clientX - last.x, e.clientY - last.y);
    last = { x: e.clientX, y: e.clientY };
  });
  const endLook = e => { if (lookId === e.pointerId) { lookId = null; last = null; } };
  look.addEventListener('pointerup', endLook);
  look.addEventListener('pointercancel', endLook);

  /* ---- 按钮：点一下触发，按住连续出招（攻击/重击有冷却，连点也不怕） ---- */
  const repeat = new Map();
  for (const btn of root.querySelectorAll('.touchBtn')) {
    const act = btn.dataset.act;
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!active() && act !== 'pause') return;
      const fire = actions[act];
      if (typeof fire !== 'function') return;
      fire();
      if (act === 'primary' || act === 'heavy') {
        clearInterval(repeat.get(act));
        repeat.set(act, setInterval(fire, 200));
      }
      btn.classList.add('dim');
      setTimeout(() => btn.classList.remove('dim'), 120);
    });
    const stop = () => { clearInterval(repeat.get(act)); repeat.delete(act); };
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('pointerleave', stop);
  }

  return {
    root,
    enabled: true,
    show() { root.classList.add('on'); },
    hide() { root.classList.remove('on'); resetStick(); },
    dispose() { root.remove(); },
  };
}
