import {createFullscreenRenderFeature} from '@forgeax/engine/app';

/** 和 Three.js 后处理同一条身份，参数组件按这个名字把每帧数据送进着色器。 */
export const COMIC_GRADE_ID = 'wakeup.comic-grade';

const PARAM_FLOATS = 20;

/**
 * 厚涂块面 + 法线式描边。
 * 颜色分级已经由 LUT 做过，这里不再乘一次饱和和曝光，避免画面发灰发爆。
 * 描边用深度还原视空间法线：平地法线连续，不会铺满黑线；轮廓法线突变才出线。
 */
const COMIC_WGSL = /* wgsl */ `
struct FullscreenOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};
struct ComicParams {
  range : vec4<f32>,
  fog : vec4<f32>,
  edge : vec4<f32>,
  grade : vec4<f32>,
  tint : vec4<f32>,
};
fn fullscreen_triangle(vertex_index : u32) -> FullscreenOutput {
  var x = -1.0;
  var y = -1.0;
  if (vertex_index == 1u) { x = 3.0; }
  if (vertex_index == 2u) { y = 3.0; }
  var out : FullscreenOutput;
  out.position = vec4<f32>(x, y, 0.0, 1.0);
  out.uv = vec2<f32>((x + 1.0) * 0.5, 1.0 - (y + 1.0) * 0.5);
  return out;
}
@group(1) @binding(0) var scene_color : texture_2d<f32>;
@group(1) @binding(1) var scene_sampler : sampler;
@group(1) @binding(2) var<uniform> params : ComicParams;
@group(1) @binding(3) var scene_depth : texture_depth_2d;

fn color_at(uv : vec2<f32>) -> vec3<f32> {
  return textureSampleLevel(scene_color, scene_sampler, clamp(uv, vec2<f32>(0.0), vec2<f32>(1.0)), 0.0).rgb;
}
fn raw_depth(pixel : vec2<i32>) -> f32 {
  let size = vec2<i32>(textureDimensions(scene_depth));
  let clamped = clamp(pixel, vec2<i32>(0), size - vec2<i32>(1));
  return textureLoad(scene_depth, clamped, 0);
}
fn view_depth(raw : f32) -> f32 {
  let near = max(params.range.x, 0.001);
  let far = max(params.range.y, near + 0.001);
  if (!(raw > 0.0 && raw <= 1.0)) { return far; }
  return near / max(raw + (1.0 - raw) * (near / far), 1e-5);
}
fn view_pos(uv : vec2<f32>, depth : f32) -> vec3<f32> {
  return vec3<f32>((uv.x * 2.0 - 1.0) * params.grade.z * depth, (1.0 - uv.y * 2.0) * params.grade.w * depth, depth);
}
fn scene_normal(uv : vec2<f32>, texel : vec2<f32>) -> vec3<f32> {
  let size = vec2<f32>(textureDimensions(scene_depth));
  let p = vec2<i32>(uv * size);
  let c = view_pos(uv, view_depth(raw_depth(p)));
  let r = view_pos(uv + vec2<f32>(texel.x, 0.0), view_depth(raw_depth(p + vec2<i32>(1, 0))));
  let u = view_pos(uv + vec2<f32>(0.0, texel.y), view_depth(raw_depth(p + vec2<i32>(0, 1))));
  return normalize(cross(r - c, u - c));
}

@vertex
fn vs_main(@builtin(vertex_index) vertex_index : u32) -> FullscreenOutput {
  return fullscreen_triangle(vertex_index);
}
@fragment
fn fs_main(input : FullscreenOutput) -> @location(0) vec4<f32> {
  let size = vec2<f32>(textureDimensions(scene_color));
  let texel = 1.0 / max(size, vec2<f32>(1.0));
  let center = color_at(input.uv);
  var mean = array<vec3<f32>, 4>(vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0));
  var square = array<vec3<f32>, 4>(vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0));
  for (var y = -2; y <= 2; y++) {
    for (var x = -2; x <= 2; x++) {
      let sample = color_at(input.uv + vec2<f32>(f32(x), f32(y)) * texel);
      let sample2 = sample * sample;
      if (x >= 0 && y <= 0) { mean[0] += sample; square[0] += sample2; }
      if (x <= 0 && y <= 0) { mean[1] += sample; square[1] += sample2; }
      if (x <= 0 && y >= 0) { mean[2] += sample; square[2] += sample2; }
      if (x >= 0 && y >= 0) { mean[3] += sample; square[3] += sample2; }
    }
  }
  let count = 9.0;
  var painted = mean[0] / count;
  var best = dot(abs(square[0] / count - painted * painted), vec3<f32>(1.0));
  for (var q = 1; q < 4; q++) {
    let avg = mean[q] / count;
    let variance = dot(abs(square[q] / count - avg * avg), vec3<f32>(1.0));
    if (variance < best) { best = variance; painted = avg; }
  }
  var out_color = painted;
  if (params.edge.x > 0.0) {
    let depth = view_depth(raw_depth(vec2<i32>(input.position.xy)));
    let fog_span = max(params.range.w - params.range.z, 0.001);
    let far_t = smoothstep(params.range.z + fog_span * 0.5, params.range.w, depth);
    let step = max(params.edge.z * mix(1.0, params.edge.w, far_t), 1.0);
    let off = texel * step;
    let n0 = scene_normal(input.uv, texel);
    var grad = 0.0;
    grad = max(grad, 1.0 - dot(n0, scene_normal(input.uv + vec2<f32>(off.x, 0.0), texel)));
    grad = max(grad, 1.0 - dot(n0, scene_normal(input.uv - vec2<f32>(off.x, 0.0), texel)));
    grad = max(grad, 1.0 - dot(n0, scene_normal(input.uv + vec2<f32>(0.0, off.y), texel)));
    grad = max(grad, 1.0 - dot(n0, scene_normal(input.uv - vec2<f32>(0.0, off.y), texel)));
    let threshold = params.grade.x * mix(1.0, params.grade.y, far_t);
    let edge_amount = smoothstep(threshold, threshold * 1.6, grad) * params.edge.x;
    let edge_color = mix(params.tint.rgb, params.fog.rgb * 0.92, far_t * params.tint.w);
    out_color = mix(out_color, edge_color, edge_amount);
  }
  return vec4<f32>(out_color, 1.0);
}
`;

const defaults = new Float32Array(PARAM_FLOATS);
defaults.set([0.12, 180, 16, 52, 1.18, 1.18, 1.2, 0, 1, 0.3, 1, 1, 0.3, 1, Math.tan((64 * Math.PI) / 360), Math.tan((64 * Math.PI) / 360), 0, 0, 0, 0.35]);

export const comicFeature = createFullscreenRenderFeature({
  identity: COMIC_GRADE_ID,
  source: COMIC_WGSL,
  reads: [{key: 'scene-depth', sampleType: 'depth'}],
  params: {byteSize: PARAM_FLOATS * 4, defaultValue: new Uint8Array(defaults.buffer)},
});

/** 把当前镜头和雾压成着色器的 5 个 vec4。菜单里雾被推远，描边仍保留。 */
export function comicGradeParams(input: {near: number; far: number; fogNear: number; fogFar: number; fov: number; aspect: number; edge?: number}): Uint8Array {
  const tanHalf = Math.tan(input.fov * 0.5);
  const data = new Float32Array([
    input.near, input.far, input.fogNear, input.fogFar,
    1.18, 1.18, 1.2, 0,
    input.edge ?? 1, 0.3, 1, 1,
    0.3, 1, tanHalf * input.aspect, tanHalf,
    0, 0, 0, 0.35,
  ]);
  return new Uint8Array(data.buffer);
}
