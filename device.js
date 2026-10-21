// 移动端 WebView（安卓外壳、手机浏览器）的性能远弱于桌面 Chrome：
// 同样的场景在桌面满帧，到手机上可能只有十几帧。这里给出统一判定，
// 各模块据此自动降配，避免每个模块各写一套检测逻辑。
// 手动覆盖：?lowspec=1 强制低配（也方便在桌面上验证），?lowspec=0 强制满配。
const query = typeof location === 'undefined' ? null : new URLSearchParams(location.search);
const forced = query ? (query.get('lowspec') || query.get('mobile')) : null;
const agent = typeof navigator === 'undefined' ? '' : (navigator.userAgent || '');

export const LOW_SPEC = forced === '1' ? true
  : forced === '0' ? false
  : /Android|iPhone|iPad|iPod|Mobile|wv\)/i.test(agent);

// 低配下的渲染参数：LOD 提前、剔除提前、描边法线趟范围减半、雾外不留余量。
export const LOW_SPEC_RENDER = LOW_SPEC
  ? { lodFactor: .2, outlineFactor: .15, cullPad: 0 }
  : { lodFactor: .35, outlineFactor: .3, cullPad: 10 };
