import * as T from 'three';

// 风格化厚涂三渲二后处理。
//
// 目标风格取自 Roboquest 设定集（Art Of Roboquest.pdf）里的美术方向原文：
//   p8  "stay away from realism, opting for a rather cartoony approach"
//       "colorful, vibrant and vivid game"
//   p51 "simplicity in design ... play around their shape, silhouette and to create rhythm"
// 落到后处理上是三件事：
//   1. 厚涂 —— Kuwahara：四象限里取方差最小的均值，把细节抹成块面，像笔触压出来的色块
//   2. 三渲二 —— 把亮度量化成几档，形成赛璐璐式的明暗台阶（保留色相，不丢颜色）
//   3. 鲜艳 —— 提饱和与对比，对应 "vibrant and vivid"
// 串在描边之后跑，描边负责剪影，这里负责块面与色阶。

const VERTEX = `#version 300 es
precision highp float;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0,1);}`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D tColor;
uniform vec2 uTexel;        // 1/w, 1/h
uniform float uLevels;      // 明暗档数（2~3 就是三渲二的味道）
uniform float uSaturation;  // 饱和度
uniform float uContrast;    // 对比
uniform float uHi;          // 顶光强度：最亮一档往上再提一档，厚涂感的亮面色块
uniform float uExposure;    // 整体明度倍率
uniform vec3 uShadowTint;   // 暗部乘数：暗且偏冷（蓝紫）
uniform vec3 uShadowShift;  // 暗部加色：把暗部往蓝推，红/橙固有色也能出现蓝阴影
uniform float uShadow;      // 阴影强度 0~1，0 = 不吃阴影
uniform float uMix;         // 整体强度，0 = 原图

// 深度雾补偿：描边是后处理，画在所有几何之后，三维雾管不到它，
// 远处物体的黑线会浮在雾外面。这里按深度把远处（连同描边黑线）一起沉进雾色。
uniform sampler2D tDepth;
uniform sampler2D tNormal;   // 视图空间法线：描边改用法线跳变出线，掠射的地面/墙面法线连续，不会满地密线
uniform vec3 uFogColor;
uniform vec2 uFogRange;    // fog.near, fog.far
uniform vec2 uCamRange;    // camera.near, camera.far
uniform float uFogAmount;  // 0 = 关掉这段补偿
uniform float uEdge;          // 深度边缘补全强度：原描边只描到一侧，这里对称补另一侧
uniform float uEdgeThreshold; // 相对深度差阈值，越小线越多
uniform float uEdgeStep;      // 采样步长（像素），决定线宽
uniform float uEdgeFarScale;  // 远处线宽收缩：远处的采样步长按这个系数缩小，线真的变细（0.6 = 远处只有近处 6 成宽）
uniform float uEdgeFarThreshold; // 远处阈值倍率：越大 → 远处只有强边画线，弱边直接不出线
uniform float uEdgeFarLighten;   // 远处线色向雾色浅化的程度：0 = 远处线还是近处的深色，1 = 完全雾色

uniform vec3 uEdgeColor;      // 线色：不用纯黑，纯黑在浓雾场景里会显得死黑
uniform float uLineFade;      // 远处线条淡化强度：屏幕空间描边线宽是固定像素，只能靠淡掉来模拟透视变细
uniform vec2 uLineFadeRange;  // 开始淡化 / 完全淡掉的距离

out vec4 o0;

#define R 2   // Kuwahara 半径：2 已经出块面，3 更重但明显掉帧

vec3 fetch(vec2 uv){ return texture(tColor, clamp(uv, vec2(0.0), vec2(1.0))).rgb; }

// 一个象限的均值与方差（用亮度方差衡量更稳，这里用三通道和近似）
void quadrant(vec2 uv, int x0, int x1, int y0, int y1, out vec3 mean, out float sigma){
  vec3 s = vec3(0.0), s2 = vec3(0.0);
  float n = 0.0;
  for (int y = y0; y <= y1; y++) {
    for (int x = x0; x <= x1; x++) {
      vec3 c = fetch(uv + vec2(float(x), float(y)) * uTexel);
      s += c; s2 += c * c; n += 1.0;
    }
  }
  mean = s / n;
  vec3 v = abs(s2 / n - mean * mean);
  sigma = v.r + v.g + v.b;
}

vec3 nrm(vec2 uv){ return texture(tNormal, uv).xyz * 2.0 - 1.0; }

// 把深度缓冲还原成视深，和 three 的 fog 口径一致
float linDepth(vec2 uv){
  float raw = texture(tDepth, uv).x;
  float n = uCamRange.x, f = uCamRange.y;
  float z = raw * 2.0 - 1.0;
  return (2.0 * n * f) / (f + n - z * (f - n));
}

void main(){
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec3 src = fetch(uv);

  vec3 m0, m1, m2, m3; float s0, s1, s2, s3;
  quadrant(uv,  0,  R, -R,  0, m0, s0);
  quadrant(uv, -R,  0, -R,  0, m1, s1);
  quadrant(uv, -R,  0,  0,  R, m2, s2);
  quadrant(uv,  0,  R,  0,  R, m3, s3);

  // 取方差最小的象限：平坦处直接抹平，边缘处保留跳变，块面感就出来了
  vec3 painted = m0; float best = s0;
  if (s1 < best) { best = s1; painted = m1; }
  if (s2 < best) { best = s2; painted = m2; }
  if (s3 < best) { best = s3; painted = m3; }

  // 三渲二：亮度量化成台阶，暗部 = 固有色 × 冷色乘数 + 蓝色偏移。
  // 纯乘法只能把红压暗成暗红，做不出参考图那种「红车蓝紫阴影」，所以暗部额外加一个冷色偏移。
  float lum = dot(painted, vec3(0.299, 0.587, 0.114));
  float q = clamp(floor(lum * uLevels + 0.5) / uLevels, 0.0, 1.0);
  vec3 shade = painted * mix(vec3(1.0), uShadowTint, uShadow) + uShadowShift * uShadow;
  vec3 cel = mix(shade, painted, q);
  // 厚涂的「顶光」：最亮一档再往上抬一档。参考图（Roboquest 原画）的亮面都是
  // 直接提到发白的亮色块，没有这档的话物体只有明暗两截，厚涂感出不来。
  // 顶光要「提亮」而不是「加白」：加常数白会把亮面冲成灰白，饱和度就没了，
  // 所以只乘不补白，色相留在原色上。
  float hi = smoothstep(0.72, 0.95, lum);
  cel = mix(cel, painted * 1.32, hi * uHi);

  // 鲜艳度：先提饱和再提对比，对应 "vibrant and vivid"
  float l = dot(cel, vec3(0.299, 0.587, 0.114));
  cel = mix(vec3(l), cel, uSaturation);
  cel = (cel - 0.5) * uContrast + 0.5;

  // 整体明度：雾色已经是顶到 1 的白，再乘也只会 clamp，不会把远景冲爆。
  vec3 outColor = clamp(mix(src, cel, uMix) * uExposure, 0.0, 1.0);

  // 深度还原成视深，按 fog 的口径算雾量；近处为 0 不动，越远越被雾色吃掉。
  // 描边黑线在这一步和场景一起被混掉，所以远处不会再有浮在雾外的黑轮廓。
  // 原描边来自 DXBC 反编译，边缘只朝一个方向采样，物体经常只有一侧有线。
  // 中心差分左右上下都采，是对称的，把缺的那一侧补上。
  // 描边不再挂 uFogAmount：菜单里关掉雾（为了看全地图）时，轮廓不能跟着一起没。
  if (uEdge > 0.0) {
    float d0 = linDepth(uv);
    // 远处的采样步长收窄 → 深度梯度变小 → 过不了阈值的地方不再画线，线就真的细下来。
    // 只靠淡化（uLineFade）远处线还是一样宽，只是变浅，看着仍发平。
    // 硬截止：uLineFadeRange = (截止距离, 过渡宽度)。过渡只有几米，跨过去线就没了。
    // 早先是长距离渐变，中间那段半透明的线看着像重影，所以改成「近处有线、远处没线」。
    float farT = smoothstep(uLineFadeRange.x, uLineFadeRange.x + max(uLineFadeRange.y, 0.001), d0);
    vec2 off = uTexel * max(uEdgeStep * mix(1.0, uEdgeFarScale, farT), 1.0);
    // 用法线跳变出线，不再用深度差：
    // 地面/墙面是一整片平面，法线处处相同（差 ≈ 0），所以任何距离都不会出线；
    // 物体的轮廓是法线突变（差很大），照常描出来。深度只用来算距离（远处渐隐、线宽）。
    vec3 n0 = normalize(nrm(uv));
    float grad = 0.0;
    grad = max(grad, 1.0 - dot(n0, normalize(nrm(uv + vec2(off.x, 0.0)))));
    grad = max(grad, 1.0 - dot(n0, normalize(nrm(uv - vec2(off.x, 0.0)))));
    grad = max(grad, 1.0 - dot(n0, normalize(nrm(uv + vec2(0.0, off.y)))));
    grad = max(grad, 1.0 - dot(n0, normalize(nrm(uv - vec2(0.0, off.y)))));
    // 远处把阈值抬高：只有落差够大的边才配画线，弱边直接不画 —— 这是远处线变细最有效的一步。
    // 光靠事后淡化做不到：粗线的中心像素四周还是线，判不出「我比周围暗」，淡不掉。
    // 阈值单位是米（深度跳变的绝对大小）：判定不再除以 d0，掠射面就不会被放大成边。
    float thr = uEdgeThreshold * mix(1.0, uEdgeFarThreshold, farT);
    float e = smoothstep(thr, thr * 1.6, grad);
    // 大气透视：远处线不该还是近处那种深色，往雾色靠才不「重」。
    vec3 ecol = mix(uEdgeColor, uFogColor * 0.92, farT * uEdgeFarLighten);
    // 按距离「整片不画」会切出一道跟着主角走的分界平面，所以默认不做（uLineFade = 0）。
    // 远处要变细变少交给步长收缩和阈值倍率；要彻底消失交给雾 —— 雾本来就会把线和场景一起吞掉。
    outColor = mix(outColor, ecol, e * uEdge * (1.0 - farT * uLineFade));
  }

  // 透视补偿：后处理描边的线宽是固定像素数，远近一样粗，看着发平。
  // 屏幕空间做不到「真正的亚像素线宽」，只能按深度把远处的线淡掉，视觉上等效于变细。
  // 判定方式：比原场景暗很多的像素就是要淡化的线。
  if (uLineFade > 0.0) {
    // 参考色必须取自「不含线」的地方：src 本身就是描边之后的画面，拿它当参考永远判不出线。
    // 改用四周邻域的平均色 —— 线像素天然比周围暗，这个差值才是可靠的线信号。
    // 取样半径要大于线宽，否则粗线中心像素的四周还是线，比不出「更暗」，就淡不掉。
    vec2 off = uTexel * 3.0;
    vec3 avg = (fetch(uv + vec2(off.x, 0.0)) + fetch(uv - vec2(off.x, 0.0))
              + fetch(uv + vec2(0.0, off.y)) + fetch(uv - vec2(0.0, off.y))) * 0.25;
    float lc = dot(outColor, vec3(0.299, 0.587, 0.114));
    float la = dot(avg, vec3(0.299, 0.587, 0.114));
    float darker = clamp((la - lc) / max(la, 0.001), 0.0, 1.0);
    // 同上：截止距离外整条线（含原描边画的）直接抹掉，不留半透明残影。
    float fade = smoothstep(uLineFadeRange.x, uLineFadeRange.x + max(uLineFadeRange.y, 0.001), linDepth(uv));
    outColor = mix(outColor, avg, darker * fade * uLineFade);
  }

  if (uFogAmount > 0.0) {
    float fogFactor = smoothstep(uFogRange.x, uFogRange.y, linDepth(uv));
    outColor = mix(outColor, uFogColor, fogFactor * uFogAmount);
  }

  o0 = vec4(outColor, 1.0);
}`;

export class ToonFilter {
  constructor(renderer) {
    this.renderer = renderer;
    this.gl = renderer.getContext();
    // 明暗档数：3 档是典型三渲二，2 档更硬，5 档更接近原图
    this.levels = 3;
    // 厚涂参考（Roboquest 原画）：高饱和、强对比，阴影带明显色相偏移。
    this.saturation = 1.62;
    // 对比别给太高：它会把暗部往黑里压，画面整体就发闷。
    this.contrast = 1.08;
    // 顶光强度：0 = 关掉最亮一档的提亮。
    this.hi = 0.4;
    // 整体明度倍率：1 = 不动。
    this.exposure = 1.15;
    // 暗部颜色 = 固有色 × shadowTint + shadowShift（参考图那种红车蓝紫阴影的做法）。
    // shadowTint 压暗并整体偏冷；shadowShift 加蓝，让暖色固有色也能出蓝阴影。
    // 厚涂参考里阴影的色相偏移很明显（橙黄部件的暗面是深紫棕），所以比之前收着用的版本重一档。
    this.shadowTint = [0.66, 0.62, 0.72];
    this.shadowShift = [0.0, 0.0, 0.06];
    // 阴影强度：0 = 不吃阴影，1 = 完全用上面的冷色。可用 ?shadow= 调。
    this.shadow = 1;
    this.mix = 1;
    this.enabled = true;
    this.ready = false;
    this.width = 0;
    this.height = 0;
  }

  async init() {
    const gl = this.gl;
    const compile = (type, text) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, text);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    this.program = gl.createProgram();
    gl.attachShader(this.program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(this.program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));

    gl.useProgram(this.program);
    this.locations = {};
    for (const name of ['tColor', 'uTexel', 'uLevels', 'uSaturation', 'uContrast', 'uHi', 'uExposure', 'uShadowTint', 'uShadowShift', 'uShadow', 'uMix',
      'tDepth', 'tNormal', 'uFogColor', 'uFogRange', 'uCamRange', 'uFogAmount', 'uEdge', 'uEdgeThreshold', 'uEdgeStep', 'uEdgeFarScale', 'uEdgeColor',
      'uEdgeFarThreshold', 'uEdgeFarLighten', 'uLineFade', 'uLineFadeRange']) {
      this.locations[name] = gl.getUniformLocation(this.program, name);
    }
    gl.uniform1i(this.locations.tColor, 0);
    gl.uniform1i(this.locations.tDepth, 1);
    gl.uniform1i(this.locations.tNormal, 2);
    this.vao = gl.createVertexArray();
    this.ready = true;
    this.renderer.resetState();
  }

  resize(w, h) {
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    if (this.color) { this.color.dispose(); this.result.dispose(); }
    this.color = new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true });
    this.result = new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: false });
  }

  // inputTexture 为空时自己先把场景渲一遍（描边关掉时走这条路）。
  // 返回叠加厚涂三渲二之后的画面；调用方负责贴到屏幕。
  render(scene, camera, inputTexture, fog) {
    const r = this.renderer, gl = this.gl;
    const size = r.getDrawingBufferSize(new T.Vector2());
    this.resize(size.x, size.y);

    let source = inputTexture;
    if (!source) {
      r.setRenderTarget(this.color);
      r.render(scene, camera);
      source = this.color.texture;
    }

    r.setRenderTarget(this.result);
    r.clear();
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const u = this.locations;
    gl.uniform2f(u.uTexel, 1 / this.width, 1 / this.height);
    gl.uniform1f(u.uLevels, this.levels);
    gl.uniform1f(u.uSaturation, this.saturation);
    gl.uniform1f(u.uContrast, this.contrast);
    gl.uniform1f(u.uHi, this.hi);
    gl.uniform1f(u.uExposure, this.exposure);
    gl.uniform3fv(u.uShadowTint, this.shadowTint);
    gl.uniform3fv(u.uShadowShift, this.shadowShift);
    gl.uniform1f(u.uShadow, this.shadow);
    gl.uniform1f(u.uMix, this.mix);

    // fog 由调用方给：描边滤镜的深度纹理 + 场景雾参数。没给就跳过这段补偿。
    gl.uniform1f(u.uFogAmount, fog ? (fog.amount ?? 1) : 0);
    // 没有法线纹理就别画：采样到空纹理会解读成 (-1,-1,-1)，差值巨大 → 满屏黑线。
    gl.uniform1f(u.uEdge, fog && fog.normalTexture ? (fog.edge ?? 0) : 0);
    gl.uniform1f(u.uEdgeThreshold, fog ? (fog.edgeThreshold ?? 0.008) : 0.008);
    gl.uniform1f(u.uEdgeStep, fog ? (fog.edgeStep ?? 1) : 1);
    gl.uniform1f(u.uEdgeFarScale, fog ? (fog.edgeFarScale ?? 0.6) : 1);
    gl.uniform1f(u.uEdgeFarThreshold, fog ? (fog.edgeFarThreshold ?? 2.2) : 1);
    gl.uniform1f(u.uEdgeFarLighten, fog ? (fog.edgeFarLighten ?? 0.35) : 0);

    const ec = fog && fog.edgeColor ? fog.edgeColor : [0, 0, 0];
    gl.uniform3f(u.uEdgeColor, ec[0], ec[1], ec[2]);
    gl.uniform1f(u.uLineFade, fog ? (fog.lineFade ?? 0) : 0);
    const lfr = fog && fog.lineFadeRange ? fog.lineFadeRange : [10, 8];
    gl.uniform2f(u.uLineFadeRange, lfr[0], lfr[1]);
    if (fog) {
      gl.uniform3f(u.uFogColor, fog.color.r, fog.color.g, fog.color.b);
      gl.uniform2f(u.uFogRange, fog.near, fog.far);
      gl.uniform2f(u.uCamRange, fog.cameraNear, fog.cameraFar);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, r.properties.get(fog.depthTexture).__webglTexture);
      if (fog.normalTexture) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, r.properties.get(fog.normalTexture).__webglTexture);
      }
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.properties.get(source).__webglTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    r.resetState();
    r.setRenderTarget(null);
    return this.result.texture;
  }
}
