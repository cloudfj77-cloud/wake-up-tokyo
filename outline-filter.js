import * as T from 'three';

// Roboquest 风格化描边滤镜。
// 片元程序本体来自原版 DXBC（ps_5_0-9439587a91cecaeb），走 DXBC -> vkd3d SPIR-V -> SPIRV-Cross
// 转成 GLSL ES 300，没有改写成手写 toon 或 Sobel。详见 Filters/provenance.json。
// 输入绑定是诊断重建：颜色/深度/法线由本文件按 three 的渲染目标现场生成，
// 分类（t6）与材质数据（t2）使用中性诊断值，不等于原引擎的 SRV 与 uniform 默认值。
const SHADER_URL = `${import.meta.env?.BASE_URL ?? '/'}assets/shaders/outline-instance.frag`;

// 全屏三角形，不需要顶点缓冲。
const VERTEX = `#version 300 es
precision highp float;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0,1);}`;

const BLOCKS = ['cb39_struct', 'cb208_struct', 'cb23_struct'];
const SIZES = [39, 208, 23];
const SAMPLERS = [
  'SPIRV_Cross_Combinedt0s0', 'SPIRV_Cross_Combinedt1s0', 'SPIRV_Cross_Combinedt2s0',
  'SPIRV_Cross_Combinedt3s0', 'SPIRV_Cross_Combinedt4s0', 'SPIRV_Cross_Combinedt5s0',
  'SPIRV_Cross_Combinedt6SPIRV_Cross_DummySampler', 'SPIRV_Cross_Combinedt7s1', 'SPIRV_Cross_Combinedt8s1',
];

function constantTexture(gl, values) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(values));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
function idTexture(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, w, h, 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, new Uint32Array(w * h * 4));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export class OutlineFilter {
  constructor(renderer) {
    this.renderer = renderer;
    this.gl = renderer.getContext();
    // 描边宽度倍率：只写进 cb2[10].y。
    // 千万不要动 cb2[10].x —— 它是主采样步长，恒为 1 才是这个 shader 正常出图的前提；
    // 把 .x 一起改掉会让整条边缘链失效，画面变成和没开滤镜一样。
    // 线宽换算：基础偏移是「屏宽/360」并 clamp 到 5 像素，再乘这个倍率 → 线宽 ≈ 5 × radius 像素。
    // 2 ≈ 10px（原始，很粗） / 0.5 ≈ 2.7px / 0.1 ≈ 0.5px / 0.05 ≈ 0.25px / 0.03 ≈ 0.15px。
    this.radius = 0.03;
    // 是否跑原版 DXBC 描边 pass。它带一个世界空间的半空间判定：以相机（=主角）为界立一张平面，
    // 平面一侧才出线，另一侧完全没有，且跟着主角移动。反编译产物改不动，所以关掉它的描边，
    // 只借用这趟渲染产生的深度纹理，线全部交给 toon-filter 里方向无关的对称深度边缘。
    this.lines = false;
    this.enabled = true;
    this.ready = false;
    this.width = 0;
    this.height = 0;
    // 法线趟必须关掉雾：场景有 Fog 的话，远处几何的法线会被雾色混进去，描边会整片飘掉。
    this.normalMaterial = new T.MeshNormalMaterial();
    this.normalMaterial.fog = false;
  }

  async init() {
    const source = await (await fetch(SHADER_URL)).text();
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
    gl.attachShader(this.program, compile(gl.FRAGMENT_SHADER, source));
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));

    this.buffers = SIZES.map(n => new Float32Array(n * 4));
    this.ubos = this.buffers.map((data, i) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
      gl.bufferData(gl.UNIFORM_BUFFER, data, gl.DYNAMIC_DRAW);
      const index = gl.getUniformBlockIndex(this.program, BLOCKS[i]);
      if (index === gl.INVALID_INDEX) throw new Error('缺少原始 uniform block ' + BLOCKS[i]);
      gl.uniformBlockBinding(this.program, index, i);
      return buffer;
    });

    gl.useProgram(this.program);
    SAMPLERS.forEach((name, i) => gl.uniform1i(gl.getUniformLocation(this.program, name), i));
    // 常量纹理直接走原生 GL，不依赖 renderer.initTexture（新版 three 已移除）。
    this.black = constantTexture(gl, [0, 0, 0, 0]);
    this.white = constantTexture(gl, [255, 255, 255, 255]);
    this.materialData = constantTexture(gl, [0, 0, 0, 1]);
    this.vao = gl.createVertexArray();
    this.ready = true;
    this.renderer.resetState();
  }

  resize(w, h) {
    if (w === this.width && h === this.height) return;
    if (this.color) { this.color.dispose(); this.normal.dispose(); this.result.dispose(); }
    if (this.ids !== undefined) this.gl.deleteTexture(this.ids);
    this.width = w;
    this.height = h;
    this.color = new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true });
    this.color.depthTexture = new T.DepthTexture(w, h, T.UnsignedIntType);
    this.normal = new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter });
    this.result = new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: false });
    this.ids = idTexture(this.gl, w, h);
  }

  parameters(camera) {
    const [cb0, cb1, cb2] = this.buffers, w = this.width, h = this.height;
    cb0.fill(0); cb1.fill(0); cb2.fill(1);
    const set = (arr, index, v) => arr.set(v, index * 4);
    set(cb0, 5, [1, 1, 1, 1]); set(cb0, 12, [1, 1, 1, 1]); set(cb0, 13, [0, 0, 1, 1]); set(cb0, 38, [w, h, 1 / w, 1 / h]);
    set(cb1, 130, [w, h, 1 / w, 1 / h]); set(cb1, 132, [w, h, 1 / w, 1 / h]); set(cb1, 133, [0.5 / w, 0.5 / h, 1 - 0.5 / w, 1 - 0.5 / h]);
    set(cb1, 135, [0, 1, 1, 0]);
    const n = camera.near, f = camera.far;
    set(cb1, 65, [0, 0, -(f - n) / (n * f), -1 / n]);
    const inv = camera.projectionMatrixInverse;
    [[2 / w, 0, 0, 0], [0, 2 / h, 0, 0], [0, 0, 2, 0], [-1, -1, -1, 1]]
      .forEach((v, i) => { set(cb1, 44 + i, new T.Vector4(...v).applyMatrix4(inv).toArray()); });
    // 以下是原寄存器地址配上的诊断值，不是还原出来的默认值。
    for (let i = 0; i < 10; i++) set(cb2, i, [1, 1, 1, 1]);
    set(cb2, 4, [0.012, 0.017, 0.014, 1]); set(cb2, 9, [0, 0, 0, 1]);
    // cb2[10].x = 主采样步长（恒 1，别动）；.y = 描边宽度倍率，也就是 URL ?outline=<数字> 调的那一档。
    set(cb2, 10, [1, this.radius, 0, 5000]); set(cb2, 11, [0, 5000, 1, 1]);
    set(cb2, 12, [1, 1, 5000, 1]); set(cb2, 13, [this.radius, 1, 0.16, 1]); set(cb2, 14, [1, 1, 0.22, 1]);
    set(cb2, 15, [1, 1, 1, 1]); set(cb2, 16, [1, 1, 1, 1]); set(cb2, 17, [1, 1, 1, 1]);
    set(cb2, 18, [1, 1, 1, 0.999]); set(cb2, 19, [80, 1, 1, 0]); set(cb2, 20, [0, 1, 0, 1]);
    // 没有可用的分类缓冲，用大分母让该分支保持中性，而不是把整屏算黑。
    set(cb2, 21, [1, 0, 1, 0]); set(cb2, 22, [100000, 0, 10000000, 0]);
  }

  // 返回叠加描边之后的画面；调用方负责把它贴到屏幕上。
  render(scene, camera) {
    const r = this.renderer, gl = this.gl;
    const size = r.getDrawingBufferSize(new T.Vector2());
    this.resize(size.x, size.y);

    r.setRenderTarget(this.color);
    r.render(scene, camera);
    // 法线趟照常跑：我们自己的描边改用法线跳变出线（地面是平面，法线处处相同，不会满地密线）。
    const background = scene.background;
    // Sprite 不吃 overrideMaterial（three 的特例），烟雾片会带着自己的半透明紫色纹理渲染进法线缓冲，
    // 法线一解读是乱值，和周围一比就是一条贯穿画面的「法线跳变」→ 被描成一条跟着烟飘的线。
    // 法线趟把透明物体（烟雾、漫画特效）全部藏起来 —— 它们本来就不该有描边。
    const hidden = [];
    scene.traverse(o => {
      if (!o.visible) return;
      const m = o.material;
      if (o.isSprite || (m && (m.transparent || (Array.isArray(m) && m.some(x => x.transparent))))) { o.visible = false; hidden.push(o); }
    });
    scene.overrideMaterial = this.normalMaterial;
    scene.background = new T.Color(0.5, 0.5, 1);
    r.setRenderTarget(this.normal);
    r.render(scene, camera);
    scene.overrideMaterial = null;
    scene.background = background;
    hidden.forEach(o => { o.visible = true; });
    // 不跑原版描边 shader 时，把这一趟的画面直接交回去（深度和法线都已就绪）。
    if (!this.lines) { r.setRenderTarget(null); return this.color.texture; }

    r.setRenderTarget(this.result);
    r.clear();
    this.parameters(camera);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    for (let i = 0; i < 3; i++) {
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.ubos[i]);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.buffers[i]);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, i, this.ubos[i]);
    }
    const handle = texture => r.properties.get(texture).__webglTexture;
    const inputs = [handle(this.color.depthTexture), handle(this.normal.texture), this.materialData,
      handle(this.color.texture), this.white, handle(this.color.depthTexture), this.ids,
      handle(this.color.texture), this.black];
    inputs.forEach((texture, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texture); gl.bindSampler(i, null); });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    r.resetState();
    r.setRenderTarget(null);
    return this.result.texture;
  }
}

// 把滤镜结果贴回屏幕。toneMapped 必须关掉：颜色趟已经做过一次 ACES，
// 再走一遍会把画面对比度压掉一层。
export function createFilterBlitter() {
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new T.MeshBasicMaterial({ toneMapped: false, depthTest: false, depthWrite: false });
  scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), material));
  return (renderer, texture) => {
    material.map = texture;
    material.needsUpdate = true;
    renderer.render(scene, camera);
  };
}
