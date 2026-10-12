// Recovered from the user-supplied v0.3.0 HTML package. INKWAVE © 2026 Jayden Davis, MIT.
import {Vector3 as DA,Color as lA,BufferGeometry as FM,Float32BufferAttribute as xM,ShapeUtils as kI,Vector2 as jM,IcosahedronGeometry as eT,BufferAttribute as dM,SphereGeometry as yN,CylinderGeometry as KN,TorusGeometry as jI,PlaneGeometry as KI,CanvasTexture as mw,SRGBColorSpace as Tj,RepeatWrapping as FN,MeshStandardMaterial as yj,DoubleSide as hj,MeshDepthMaterial as eC,RGBADepthPacking as rE,Matrix3 as Nj,Euler as nj,Quaternion as mj,Matrix4 as YM,CatmullRomCurve3 as rC,Group as oj,NoColorSpace as xN,MeshPhysicalMaterial as OI,MeshBasicMaterial as Vj,Mesh as GM,InstancedMesh as iI,WebGLArrayRenderTarget as zk,UnsignedByteType as zI,RGBAFormat as _j,LinearFilter as aj,LinearMipmapLinearFilter as SN,DataArrayTexture as uC,OrthographicCamera as uT,RawShaderMaterial as Zx,GLSL3 as AE,Scene as Cz,Vector4 as qM,Plane as pD,Box3 as ON,BoxGeometry as DN,TubeGeometry as oz,DataTexture as DI,Fog as dw,FloatType as XN,ShaderMaterial as PN,WebGLRenderTarget as YI,HalfFloatType as OD,DirectionalLight as Kw,HemisphereLight as nE,BackSide as mN,LessEqualDepth as kT,PMREMGenerator as TE,ClampToEdgeWrapping as qN,UniformsUtils as ME,UniformsLib as vM,PerspectiveCamera as NN,WebGLCubeRenderTarget as hx,CubeCamera as Gx,CustomBlending as kx,AddEquation as eD,OneFactor as Q4,SrcAlphaFactor as XO,ZeroFactor as Ux,RedFormat as sC,CircleGeometry as aT,AdditiveBlending as II,DynamicDrawUsage as D4,ConeGeometry as Zw,InstancedBufferAttribute as cT,LatheGeometry as aC,CubicBezierCurve3 as bx,TextureLoader as Sz,PointLight as xD} from 'three';
import * as mo from 'three';
import {mergeVertices as A1,mergeGeometries as uN} from 'three/addons/utils/BufferGeometryUtils.js';
import {block as GC} from '../world.js';
import {createTidewaterNavigation as CS} from '../tidewater-navigation.js';
const VI = { plain: 0, planter: 9, stonestep: 25 };
function wj(j, A, M, N, I, D, T = {}) {
  return { kind: "box", min: [j, M, I], max: [A, N, D], ...T };
}
function IT(j, A, M, N = {}) {
  return { kind: "ramp", low: j, high: A, width: M, thickness: N.thickness ?? 0.6, ...N };
}
function kz(j, A, M, N, I, D, T, w = {}) {
  return { kind: "obox", center: [j, (I + D) / 2, A], size: [M, D - I, N], rotY: T, ...w };
}
function gS(j, A, M, N, I, D = {}) {
  const T = M * Math.cos(Math.PI / 8), w = M * Math.sin(Math.PI / 8), O = { ...D, oct: [j, A, M] }, z = [wj(j - T, j + T, N, I, A - w, A + w, O), wj(j - w, j + w, N, I, A + w, A + T, O), wj(j - w, j + w, N, I, A - T, A - w, O)], C = T - w * Math.SQRT2 + Math.min(0.3, 0.12 * M), E = (T - C / 2) / Math.SQRT2;
  for (const [P, g] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) z.push(kz(j + P * E, A + g * E, 2 * w, C, N, I - 0.1, P * g > 0 ? 45 : -45, O));
  return z;
}
const CN = { herringbone: 28, terrazzo: 29, stucco: 30 }, ES = { detail: 0.6, scale: 2.4, tint: true, mask: true, alpha: false, mode: 0, sym: 0, hr: [-0.012, 14e-4], ao: 0.5, prep: `f[0] = FB(uv, ivec2(4), 4, 0.5, 2801u); f[1] = FB(uv, ivec2(40), 3, 0.5, 2803u); f[2] = FB(uv, ivec2(160), 2, 0.5, 2807u);
  w[0] = WO(uv, ivec2(120), 1.0, 2809u);`, surf: `
  // 90° herringbone of 2:1 bricks on a 120 mm cell grid: along each diagonal strand a stretcher (2 x 1 cells) and a
  // soldier (1 x 2) alternate; strands repeat every 4 cells, so the pattern tiles on 20 cells = 2.4 m exactly
  const float W = 0.12;
  vec2 p = P / W;
  ivec2 cc = ivec2(floor(p));
  float dd = float(cc.x - cc.y); dd -= 4.0 * floor(dd / 4.0);
  vec2 org = vec2(cc), ext = vec2(1.0, 2.0);
  if (dd < 1.5) { org.x -= dd; ext = vec2(2.0, 1.0); }
  else if (dd < 2.5) { org.y -= 1.0; }
  vec2 hb = ext * (0.5 * W);
  vec2 q = (p - org) * W - hb;
  float e = -sdRB(q, hb, 0.008);
  vec2 pr = edgeProf(e, 0.0028, 0.01, 0.0026, 0.009);
  float inJ = pr.y;
  ivec2 bid = wrp(ivec2(org), ivec2(20));
  float b1 = hf(bid, 3u), b2 = hf(bid, 5u), b3 = hf(bid, 7u), b4 = hf(bid, 11u);
  float mott = n[0], tex = n[1], sand = n[2];
  vec4 wc = c[0];
  float pit = step(0.9, wc.z) * (1.0 - aa(0.0025 + 0.002 * fract(wc.z * 7.3), wc.x * (2.4 / 120.0))) * (1.0 - inJ);
  vec2 qn = q / hb;
  float crown = 1.0 - 0.6 * dot(qn * qn, vec2(1.0));
  float tone = 0.8 * (1.0 + 0.24 * (b1 - 0.5)) * (1.0 + 0.06 * mott + 0.045 * tex + 0.03 * sand) * (1.0 - 0.14 * pit);
  tone *= b2 > 0.91 ? 0.74 : (b2 < 0.06 ? 1.12 : 1.0);                       // a few over-fired / pale bricks
  float arris = clamp(1.0 - (e - 0.0028) / 0.012, 0.0, 1.0) * (1.0 - inJ);
  float grime = (1.0 - smoothstep(0.0, 0.03, e - 0.0028)) * (1.0 - inJ) * (0.6 + 0.4 * smoothstep(-0.3, 0.6, mott));
  tone *= (1.0 - 0.1 * arris) * (1.0 - 0.14 * grime);
  float worn = smoothstep(0.1, 0.8, mott * 0.5 + 0.5 + 0.3 * (b4 - 0.5)) * max(crown, 0.0);   // foot-polished crowns
  vec3 joint = lin(vec3(0.63, 0.59, 0.51)) * (0.72 + 0.2 * sand + 0.16 * mott);
  s.alb = joint * inJ;
  s.a = (1.0 - inJ) * tone * (1.0 + 0.05 * worn);
  s.h = pr.x + (0.0006 * max(crown, 0.0) * (0.4 + 0.6 * b3) + 0.00015 * tex + 0.00008 * sand - 0.0012 * pit) * (1.0 - inJ);
  s.rough = mix(0.8 + 0.06 * tex - 0.14 * worn, 0.95, inJ);
  s.cav = mix(1.0, 0.55, inJ) * (1.0 - 0.3 * pit);` }, PS = { detail: 0.3, scale: 2.4, tint: true, mask: true, alpha: false, mode: 1, sym: 4, hr: [-16e-4, 6e-4], ao: 0.3, prep: `f[0] = FB(uv, ivec2(4), 4, 0.5, 2901u); f[1] = FB(uv, ivec2(64), 2, 0.5, 2903u); f[2] = FB(uv, ivec2(12), 3, 0.5, 2907u);
  w[0] = WO(uv, ivec2(72), 1.0, 2909u); w[1] = WO(uv, ivec2(180), 1.0, 2911u);`, surf: `
  // 1.2 m panels in a two-tone chequer, each framed by an 11 cm darker border band; brass divider strips on the panel
  // joints and a finer one at the band's inner edge; the matrix takes the block colour, the chips keep their own
  // (mostly pale marble, a little grey, rare black / coral / seafoam) — calm at distance, crisp close up
  ivec2 pc = wrp(ivec2(floor(P / 1.2)), ivec2(2));
  float chk = float((pc.x + pc.y) & 1);
  float dS = min(jd(P.x, 1.2), jd(P.y, 1.2));
  float strip = 1.0 - aa(0.0024, dS);
  float line2 = 1.0 - aa(0.0016, abs(dS - 0.11));
  float band = 1.0 - aa(0.11, dS);
  vec4 A = c[0], Bc = c[1];
  float rA = 0.16 + 0.2 * fract(A.z * 5.3), rB = 0.2 + 0.18 * fract(Bc.z * 3.7);
  float chipA = (1.0 - smoothstep(rA - 0.05, rA + 0.05, A.x)) * step(0.3, A.z);
  float chipB = (1.0 - smoothstep(rB - 0.08, rB + 0.08, Bc.x)) * step(0.35, Bc.z) * (1.0 - chipA);
  vec3 cw = lin(vec3(0.95, 0.94, 0.91)), cc2 = lin(vec3(0.86, 0.83, 0.77)), cg = lin(vec3(0.6, 0.6, 0.59)), ck = lin(vec3(0.2, 0.2, 0.21));
  vec3 cp = lin(vec3(0.86, 0.62, 0.54)), cs = lin(vec3(0.55, 0.72, 0.66));
  float ia = fract(A.z * 13.37), ib = fract(Bc.z * 7.77);
  vec3 colA = ia < 0.4 ? cw : (ia < 0.66 ? cc2 : (ia < 0.82 ? cg : (ia < 0.89 ? ck : (ia < 0.95 ? cp : cs))));
  vec3 colB = ib < 0.55 ? cw : (ib < 0.85 ? cc2 : cg);
  float mott = n[0], fine = n[1], cloud = n[2];
  float tone = 0.8 * mix(1.0, 0.86, chk) * mix(1.0, 0.7, band) * (1.0 + 0.05 * mott + 0.035 * cloud + 0.02 * fine);
  float dirt = (1.0 - smoothstep(0.0, 0.05, dS)) * (1.0 - strip) * smoothstep(-0.2, 0.6, mott);
  tone *= 1.0 - 0.1 * dirt;
  vec3 own = vec3(0.0); float cov = 1.0;
  own = mix(own, colA * (0.9 + 0.18 * fract(A.z * 3.1)), chipA); cov *= 1.0 - chipA;
  own = mix(own, colB * (0.92 + 0.12 * fine), chipB); cov *= 1.0 - chipB;
  float br = max(strip, line2 * 0.85);
  vec3 brass = lin(vec3(0.74, 0.58, 0.32)) * (0.8 + 0.25 * fine + 0.1 * mott);
  own = mix(own, brass, br); cov *= 1.0 - br;
  s.alb = own; s.a = cov * tone;
  float worn = smoothstep(-0.1, 0.7, cloud);
  s.h = 0.00018 * mott + 0.00004 * fine + 0.00005 * (chipA + chipB) - 0.0005 * dirt - 0.0002 * br;
  s.rough = mix(0.44 + 0.06 * fine + 0.12 * worn, 0.3, chipA + chipB);
  s.rough = mix(s.rough, 0.38, br);
  s.metal = br * 0.8;
  s.cav = 1.0 - 0.2 * dirt;` }, yS = { detail: 0.6, scale: 2.4, tint: true, mask: true, alpha: false, mode: 1, sym: 1, hr: [-8e-3, 12e-4], ao: 0.5, prep: `f[0] = FB(uv, ivec2(4), 4, 0.55, 3001u); f[1] = FB(uv, ivec2(24), 3, 0.5, 3003u); f[2] = FB(uv, ivec2(28, 3), 3, 0.5, 3007u);
  f[3] = FB(uv, ivec2(96), 2, 0.5, 3011u); w[0] = WO(uv, ivec2(10), 0.85, 3013u); w[1] = WO(uv, ivec2(200), 1.0, 3017u);`, surf: `
  // ashlar lining: 400 mm courses, 1.2 m blocks in half bond, V-grooved bed joints (8 mm half-width) and finer
  // perpends; float-finished paint with trowel undulation, soot/rain streaks under each bed joint, hairline cracks,
  // a few flakes of paint lost to the grey render beneath (untinted)
  const float CH = 0.4, BL = 1.2;
  float row = floor(P.y / CH);
  float ly = P.y - row * CH;
  float bx = P.x - mod(row, 2.0) * 0.6;
  float col = floor(bx / BL);
  float lx = bx - col * BL;
  ivec2 bid = wrp(ivec2(int(col), int(row)), ivec2(2, 6));
  float eH = min(ly, CH - ly), eV = min(lx, BL - lx);
  float gH = max(0.0, 1.0 - eH / 0.007), gV = max(0.0, 1.0 - eV / 0.0035);
  float groove = max(gH, gV * 0.8);
  float hJ = -max(0.0045 * gH, 0.002 * gV);
  float b1 = hf(bid, 3u), b2 = hf(bid, 5u);
  float mott = n[0], und = n[1], streak = n[2], fine = n[3];
  vec4 k = c[0];
  float crack = (1.0 - aa(0.0014, (k.y - k.x) * 0.24)) * step(0.7, fract(k.z * 9.1 + k.w * 3.3)) * smoothstep(0.1, 0.5, mott);
  vec4 g = c[1];
  float grain = smoothstep(0.03, 0.25, g.y - g.x) * (1.0 - g.x * g.x);
  float flake = step(0.9, fract(k.w * 13.7 + k.z)) * (1.0 - aa(0.0, (k.x - 0.1 - 0.06 * fine) * 0.24)) * step(0.25, mott);
  float soot = (1.0 - smoothstep(0.0, 0.16, CH - ly)) * smoothstep(0.1, 0.8, streak * 0.5 + 0.5);   // under each bed joint
  float rain = smoothstep(0.35, 0.95, streak * 0.5 + 0.5) * (0.5 + 0.5 * smoothstep(-0.2, 0.6, mott));
  float paint = 0.8 * (1.0 + 0.035 * (b1 - 0.5) + 0.03 * und + 0.025 * fine + 0.04 * mott) * (1.0 - 0.07 * soot - 0.06 * rain) * (1.0 - 0.12 * crack);
  paint *= 1.0 - 0.12 * groove;
  vec3 bare = lin(vec3(0.56, 0.55, 0.52)) * (1.0 + 0.08 * grain);
  s.alb = bare * flake; s.a = (1.0 - flake) * paint;
  s.h = hJ + (0.0005 * und + 0.00025 * grain + 0.00008 * fine) * (1.0 - groove) - 0.0006 * crack - 0.0004 * flake;
  s.rough = 0.74 + 0.06 * mott - 0.04 * und + 0.06 * flake + 0.05 * rain;
  s.cav = (1.0 - 0.32 * groove) * (1.0 - 0.15 * crack);` }, X1 = [{ slot: 28, name: "herringbone", mat: ES, onWall: 30 }, { slot: 29, name: "terrazzo", mat: PS, onWall: 30 }, { slot: 30, name: "stucco", mat: yS, onTop: 29 }], xS = Object.freeze(Object.defineProperty({ __proto__: null, SURF: CN, SURFACES: X1 }, Symbol.toStringTag, { value: "Module" })), tM = { plaza: "#c89c84", prom: "#d9d0c0", colFloor: "#dccdc0", loggia: "#e9e0d0", terrace: "#ddd3c1", stucco: "#efe6d3", mint: "#cfe3d6", pink: "#eed7cb", butter: "#efe0bb", granite: "#b9b3a8", stone: "#d8d0c0", seawall: "#b8b0a3", planter: "#b9ad9a", joint: "#a9a399" }, $I = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]], rj = (j, A = {}) => ({ color: j, pattern: CN.stucco, ...A }), wD = Math.PI / 180, Sj = -0.2, yI = { c: [19, -4], rIn: 38, rOut: 46, a0: 180, a1: 228, n: 13 }, QI = { rIn: 5.8, rOut: 8.5, n: 36, a0: 5, top: 1, dais: 5.8, daisTop: 1.1 }, Jj = { front: [[18.9, -38.3], [22.5, -29], [24.5, -19], [24.5, -9]], deck: 4.5, floor: 5.1, shops: 3, deckBot: 3.35, deckTop: 3.7 }, MN = { x: [17.5, 20], foot: -7, top: -15.5, landing: -18.5 };
function uO(j, A, M, N, I, D, T, w, O, z = null, C = false, E = null) {
  const P = [], g = (I - N) / D, Q = M - A, x = (A + M) / 2, U = Math.abs(g) * wD / 2, k = 2 * A * Math.tan(U);
  for (let s = 0; s < D; s++) {
    if (E && E(s)) continue;
    const v = (N + g * (s + 0.5)) * wD;
    P.push(kz(j[0] + x * Math.cos(v), j[1] + x * Math.sin(v), Q, k, Array.isArray(T) ? T[s % 2] : T, w, -v / wD, O));
  }
  if (z) for (let s = C ? 0 : 1; s <= (C === "closed" ? D - 1 : C ? D : D - 1); s++) {
    const v = (N + g * s) * wD, S = A / Math.cos(U), q = (S + M) / 2, c = 2 * (M - A) * Math.tan(U) + 0.14;
    P.push(kz(j[0] + q * Math.cos(v), j[1] + q * Math.sin(v), M - S, c, z.y0, z.y1, -v / wD, z.o));
  }
  return P;
}
function _1(j, A, M, N, I, D, T, w, O) {
  const z = [], C = (I - N) / D, E = M - A, P = (A + M) / 2, g = Math.abs(C) * wD / 2, Q = 2 * M * Math.tan(g);
  for (let x = 0; x < D; x++) {
    const U = (N + C * (x + 0.5)) * wD;
    z.push(kz(j[0] + P * Math.cos(U), j[1] + P * Math.sin(U), E, Q, T, w[x % 2], -U / wD, O));
  }
  return z;
}
function $1(j, A) {
  const M = A[0] - j[0], N = A[1] - j[1], I = Math.hypot(M, N);
  return [M / I, N / I, I];
}
function VC(j, A) {
  const M = [];
  for (let I = 0; I < j.length - 1; I++) {
    const [D, T, w] = $1(j[I], j[I + 1]);
    M.push({ p: j[I], d: [D, T], n: [T, -D], l: w, h: Math.atan2(D, T) / wD });
  }
  const N = [];
  for (let I = 0; I <= M.length; I++) {
    if (I === 0) {
      const E = M[0];
      N.push([E.p[0] + E.n[0] * A, E.p[1] + E.n[1] * A]);
      continue;
    }
    if (I === M.length) {
      const E = M[I - 1], P = j[I];
      N.push([P[0] + E.n[0] * A, P[1] + E.n[1] * A]);
      continue;
    }
    const D = M[I - 1], T = M[I], w = [D.p[0] + D.n[0] * A, D.p[1] + D.n[1] * A], O = [T.p[0] + T.n[0] * A, T.p[1] + T.n[1] * A], z = D.d[0] * T.d[1] - D.d[1] * T.d[0], C = ((O[0] - w[0]) * T.d[1] - (O[1] - w[1]) * T.d[0]) / z;
    N.push([w[0] + D.d[0] * C, w[1] + D.d[1] * C]);
  }
  return M.map((I, D) => ({ ...I, q0: N[D], q1: N[D + 1], len: Math.hypot(N[D + 1][0] - N[D][0], N[D + 1][1] - N[D][1]) }));
}
function aD(j, A, M, N, I, D, T = null, w = null) {
  const O = [], z = VC(j, A);
  return z.forEach((C, E) => {
    if (w && !w(E)) return;
    const P = M - A, g = (C.q0[0] + C.q1[0]) / 2 + C.n[0] * P / 2, Q = (C.q0[1] + C.q1[1]) / 2 + C.n[1] * P / 2;
    if (O.push(kz(g, Q, P, C.len, Array.isArray(N) ? N[E % 2] : N, I, C.h, D)), T && E > 0) {
      const x = z[E - 1], U = $1([0, 0], [x.n[0] + C.n[0], x.n[1] + C.n[1]]), k = [-U[1], U[0]], s = Math.acos(Math.max(-1, Math.min(1, x.d[0] * C.d[0] + x.d[1] * C.d[1]))) / 2, v = T.e || 0, S = P / Math.cos(s) - v, q = 2 * P * Math.tan(s) + 0.14;
      O.push(kz(C.q0[0] + U[0] * (v + S / 2), C.q0[1] + U[1] * (v + S / 2), S, q, T.y0, T.y1, Math.atan2(k[0], k[1]) / wD, T.o));
    }
  }), O;
}
function AU(j, A, M, N, I, D) {
  const T = M - A;
  return VC(j, M).map((w, O) => kz((w.q0[0] + w.q1[0]) / 2 - w.n[0] * T / 2, (w.q0[1] + w.q1[1]) / 2 - w.n[1] * T / 2, T, w.len, N, I[O % 2], w.h, D));
}
const sN = yI, Xj = QI, Gj = Jj, vD = Jj.front, bg = [-0.9, -0.99], Fi = rj(tM.seawall, { tag: "sea-wall-plinth" }), Vi = { y0: -0.99, y1: -0.1, o: rj(tM.joint, { tag: "paving-joint" }) }, QS = { id: "tidewater", bounds: { minX: -28, maxX: 28, minZ: -47, maxZ: 47 }, spawnPads: [[0, 2.4, -41.8], [0, 2.4, 41.8]], spawnBarrier: 4.2, intro: { from: [11, 16.5, 12], lookFrom: [0, 10.5, 0], toBack: 3 }, art: { from: [-32, 19.5, 9], look: [3.5, 0.5, -15.5], fov: 64 }, single: [...uO([0, 0], Xj.rIn, Xj.rOut, Xj.a0, Xj.a0 + 360, Xj.n, -0.6, Xj.top, rj(tM.terrace, { tag: "terrace-ring" }), { y0: -0.6, y1: Xj.top - 0.1, o: rj(tM.joint, { tag: "terrace-joint" }) }, "closed"), wj(-Xj.dais, Xj.dais, -0.6, Xj.daisTop, -Xj.dais, Xj.dais, rj(tM.terrace, { tag: "terrace-dais", mural: [{ n: [0, 1, 0], id: 5 }] })), wj(-1.7, 1.7, Xj.daisTop, 3.6, -1.7, 1.7, rj(tM.stucco, { tag: "tower-base" })), wj(-1.7, 1.7, 3.6, 12.5, -1.7, 1.7, rj(tM.stucco, { tag: "tower", noPaint: $I, roof: true })), ...uO([0, 0], Xj.rOut - 0.34, Xj.rOut - 0.1, Xj.a0, Xj.a0 + 360, Xj.n, Xj.top, Xj.top + 1.05, { rail: true, tag: "terrace-rail" }, null, false, (j) => [8, 17, 26, 35].some((A) => Math.abs((j - A + 36) % 36) <= 1 || Math.abs((A - j + 36) % 36) <= 1))], half: [wj(-19.5, 21, -0.9, Sj, -25, 0, { tag: "square", color: tM.plaza, pattern: CN.herringbone }), wj(-9, 9, -0.9, Sj, -37, -25, { tag: "square-fountain", color: tM.plaza, pattern: CN.herringbone, mural: [{ n: [0, 1, 0], id: 4 }] }), wj(9, 19, -0.9, Sj, -37, -25, { tag: "square", color: tM.plaza, pattern: CN.herringbone }), wj(-15, -9, -0.9, Sj, -29, -25, { tag: "square", color: tM.plaza, pattern: CN.herringbone }), wj(-11.5, -9, -0.9, Sj, -37, -29, { tag: "square", color: tM.plaza, pattern: CN.herringbone }), wj(-11.5, 19, -1.2, Sj, -38.4, -37, { tag: "square", color: tM.plaza, pattern: CN.herringbone }), wj(-9.5, 17.9, -1.2, Sj, -45.3, -38.4, { tag: "square-under-hall", color: tM.plaza, pattern: CN.herringbone }), wj(-19.5, 21, -2, -1.1, -25, 0, rj(tM.seawall, { tag: "square-deck" })), wj(-12.8, 19, -2, -1.1, -37, -25, rj(tM.seawall, { tag: "square-deck" })), ...uO(sN.c, sN.rIn, sN.rOut, sN.a0, sN.a1, sN.n, bg, 0, { tag: "promenade", color: tM.prom, pattern: CN.terrazzo }, Vi, true), ..._1(sN.c, sN.rIn, sN.rOut, sN.a0, sN.a1, sN.n, -2, bg, Fi), wj(-27, -17, -2, 0, -4, 9, { tag: "pier-forecourt", color: tM.prom, pattern: CN.terrazzo }), wj(-27, -24, 0, 2.6, -5.5, -2.5, rj(tM.stucco, { tag: "pier-booth", roof: true, mural: [{ n: [0, 0, 1], id: 11 }] })), wj(24, 27, 0, 2.6, -5.5, -2.5, rj(tM.stucco, { tag: "pier-booth", roof: true, mural: [{ n: [0, 0, 1], id: 11 }] })), ...uO(sN.c, sN.rOut - 0.24, sN.rOut - 0.08, sN.a0, sN.a1, sN.n, 0, 1.18, { rail: true, tag: "sea-rail" }), wj(-26.95, -26.79, 0, 1.18, 5.5, 9, { rail: true, tag: "sea-rail" }), wj(-11.6, -9.5, Sj, 1, -38.36, -38.2, { rail: true, tag: "sea-rail" }), wj(-9.5, 22, -1.2, 5.2, -46, -45.4, rj(tM.stucco, { tag: "townhall-wall", roof: true })), wj(-9.5, 9.5, Sj, 2.2, -45.4, -38.4, rj(tM.stucco, { tag: "loggia-body", noPaint: [[1, 0, 0], [-1, 0, 0]] })), wj(-9.5, 9.5, 2.2, 2.4, -45.4, -38.4, { tag: "loggia", color: tM.loggia, pattern: CN.terrazzo, noPaint: [[1, 0, 0], [-1, 0, 0]] }), wj(-4.8, 4.8, Sj, 2.2, -38.4, -36, rj(tM.stucco, { tag: "balcony-body", noPaint: [[0, 0, 1]] })), wj(-4.8, 4.8, 2.2, 2.4, -38.4, -36, { tag: "balcony", color: tM.loggia, pattern: CN.terrazzo, noPaint: [[0, 0, 1]] }), IT([-10.8, Sj, -37.2], [-4.8, 2.4, -37.2], 2.4, { tag: "flight-w", color: tM.granite, pattern: VI.stonestep }), IT([10.8, Sj, -37.2], [4.8, 2.4, -37.2], 2.4, { tag: "flight-e", color: tM.granite, pattern: VI.stonestep }), wj(-9.45, -9.2, 2.4, 3.45, -45.3, -38.4, { rail: true, tag: "loggia-rail" }), wj(9.5, 17.9, Sj, 2.2, -45.4, -41.5, rj(tM.stucco, { tag: "wing-body", noPaint: [[0, 0, 1]] })), wj(9.5, 17.9, 2.2, 2.4, -45.4, -41.5, { tag: "wing-walk", color: tM.loggia, pattern: CN.terrazzo, noPaint: [[0, 0, 1]] }), IT([16, 2.4, -41.5], [16, 3.8, -38.3], 3.8, { tag: "wing-steps", color: tM.granite, pattern: VI.stonestep }), wj(14.16, 17.9, Sj, 2.3, -41.5, -38.3, rj(tM.stone, { tag: "wing-steps-base", noPaint: $I })), wj(13.9, 17.9, -1.2, 3.8, -38.3, -36.4, rj(tM.pink, { tag: "colonnade-end", noPaint: [[0, 0, 1], [1, 0, 0]], mural: [{ n: [0, 0, 1], id: 7 }] })), wj(17.9, 25, -1.2, 5.4, -45.4, -38.3, rj(tM.pink, { tag: "crescent-corner", noPaint: $I, roof: true })), wj(17.9, 25, -2, -1.2, -45.4, -38.3, rj(tM.seawall, { tag: "corner-quay", noPaint: $I })), ...aD(vD, -Gj.floor, Gj.shops, bg, 0, { tag: "colonnade-walk", color: tM.colFloor, pattern: CN.terrazzo }, Vi), ...AU(vD, -Gj.floor, Gj.shops, -2, bg, Fi), ...aD(vD, -Gj.deck, 0, Gj.deckBot, Gj.deckTop, { tag: "colonnade-walk-top", color: tM.colFloor, pattern: CN.terrazzo }, { y0: Gj.deckBot, y1: Gj.deckTop - 0.1, o: { tag: "walk-joint", color: tM.colFloor, pattern: CN.terrazzo } }), ...aD(vD, 0, Gj.shops, 0, Gj.deckTop, rj(tM.pink, { tag: "crescent-shops", mural: [{ n: [0, 0, 1], id: 9 }] }), { e: 0.06, y0: 0, y1: Gj.deckTop - 0.1, o: rj(tM.pink, { tag: "crescent-shops-joint", noPaint: $I }) }), ...aD(vD, 0, Gj.shops, Gj.deckTop, 7.6, rj(tM.pink, { tag: "crescent-upper", noPaint: $I, roof: true }), null, (j) => j === 0), ...aD(vD, 0, Gj.shops, Gj.deckTop, 9.2, rj(tM.butter, { tag: "hotel-upper", noPaint: $I, roof: true }), { e: 0.06, y0: Gj.deckTop, y1: 7.5, o: rj(tM.pink, { tag: "crescent-upper-joint", noPaint: $I, roof: true }) }, (j) => j === 1), ...aD(vD, 0, Gj.shops, Gj.deckTop, 7.2, rj(tM.mint, { tag: "crescent-upper", noPaint: $I, roof: true }), { e: 0.06, y0: Gj.deckTop, y1: 7.1, o: rj(tM.mint, { tag: "crescent-upper-joint", noPaint: $I, roof: true }) }, (j) => j === 2), ...aD(vD, 0.02, 0.3, 9.2, 10.05, { rail: true, tag: "hotel-parapet" }, null, (j) => j === 1), ...aD(vD, -Gj.deck, -Gj.deck + 0.16, Gj.deckTop, Gj.deckTop + 1.1, { rail: true, tag: "walk-rail" }, null, (j) => j < 2), wj(MN.x[0], 20, Gj.deckTop, Gj.deckTop + 1.1, MN.landing, MN.landing + 0.16, { rail: true, tag: "walk-rail" }), wj(MN.x[0], MN.x[1], -1.2, Gj.deckTop, MN.landing, MN.top, { tag: "colonnade-landing", color: tM.colFloor, pattern: CN.terrazzo, noPaint: [[0, 0, -1]] }), IT([18.75, 0, MN.foot], [18.75, Gj.deckTop, MN.top], 2.5, { tag: "colonnade-stair", color: tM.granite, pattern: VI.stonestep }), wj(-23, -20.65, 0, 1.15, -19.15, -18.85, rj(tM.mint, { tag: "shelter-screen" })), wj(-20.35, -18, 0, 1.15, -19.15, -18.85, rj(tM.mint, { tag: "shelter-screen" })), wj(-20.65, -20.35, 0, 1.15, -21.5, -16.5, rj(tM.mint, { tag: "shelter-screen" })), wj(-24.9, -22.3, 0, 2.5, -10.3, -7.7, rj(tM.mint, { tag: "icecream-kiosk", mural: [{ n: [0, 0, 1], id: 8 }, { n: [-1, 0, 0], id: 8 }] })), ...gS(0, -21, 3.8, -0.6, 0.8, rj(tM.stone, { tag: "bandstand" })), IT([0, Sj, -27.2], [0, 0.8, -24.51], 2.4, { tag: "bandstand-steps", color: tM.granite, pattern: VI.stonestep }), IT([0, Sj, -14.8], [0, 0.8, -17.49], 2.4, { tag: "bandstand-steps", color: tM.granite, pattern: VI.stonestep }), wj(-10.7, -6.3, -0.6, 0.5, -27.2, -22.8, { tag: "floral-clock", color: tM.planter, pattern: VI.planter }), wj(-15, -9, -0.6, 0.7, -14.5, -9.5, { tag: "border", color: tM.planter, pattern: VI.planter }), wj(8.5, 12.5, -0.6, 2.8, -30, -26, rj(tM.butter, { tag: "tearooms", roof: true })), wj(11.4, 13.6, -0.6, 0.8, -18.6, -16.4, { tag: "anchor-plinth", color: tM.granite, pattern: CN.stucco }), IT([0, Sj, -12.4], [0, Xj.top, -8.1], 4, { tag: "terrace-steps", color: tM.granite, pattern: VI.stonestep }), IT([-12.4, Sj, 0], [-8.1, Xj.top, 0], 4, { tag: "terrace-steps", color: tM.granite, pattern: VI.stonestep })], decor: { lamps: [], palms: [], flags: [[-8.9, 2.4, -44.8], [8.9, 2.4, -44.8]] } }, iS = QS, LS = Object.freeze(Object.defineProperty({ __proto__: null, COLO: Jj, LAYOUT: iS, PROM: yI, SQ: Sj, STAIR: MN, TERR: QI, arcBand: uO, arcSub: _1, chainBand: aD, chainSections: VC, chainSub: AU }, Symbol.toStringTag, { value: "Module" })), ej = Math.PI;
function kS(j, A) {
  const { THREE: M, col: N, shade: I, mixc: D, latheGeo: T, tubeGeo: w, extrudeGeo: O, arcPts: z, PI: C, TAU: E, HP: P, P3: g } = A, Q = (i) => A.noShadow ? A.noShadow(i) : i, x = { stucco: "#efe6d3", stuccoDk: "#d9cfbb", trim: "#f7f3ea", stone: "#e6dfcf", stoneDk: "#c9c1ae", granite: "#a9a49b", graniteDk: "#85817a", iron: "#4d8b7e", ironDk: "#2f5d55", ironLt: "#6fa99b", navy: "#2f3d5c", coral: "#d9826c", coralDk: "#b8624f", gold: "#c9a453", bronze: "#8a6a3c", glass: "#344a58", glassLt: "#557384", slate: "#5b6877", slateDk: "#4a5563", lead: "#727d88", copper: "#7fb2a0", copperDk: "#5d8f7f", brick: "#b76b55", pot: "#b86a4f", wood: "#a87b52", woodLt: "#c49a6c", lamp: "#ffe1a6", blind: "#efe2c4", mint: "#cfe3d6", pink: "#eed7cb", butter: "#f0e2bd", sky: "#d4e3ea", white: "#f5f2ea", ink: "#23262d", leaf: "#4f8a4a", leafDk: "#3a6b3c", leafLt: "#79a95c", red: "#c8483e", yellow: "#f0c94c", purple: "#8a6cc0", water: "#5f9fa6", club: "#2f3d5c", clubGold: "#c9a453" };
  class U {
    constructor() {
      this.p = [], this.n = [], this.uv = [], this.c = [], this.idx = [];
    }
    v($, n, d, b, K, NA, zA = 1, L = zA, V = zA) {
      return this.p.push($, n, d), this.n.push(b, K, NA), this.uv.push(0, 0), this.c.push(zA, L, V), this.p.length / 3 - 1;
    }
    tri($, n, d) {
      const b = this.p, K = this.n, NA = b[$ * 3], zA = b[$ * 3 + 1], L = b[$ * 3 + 2], V = b[n * 3] - NA, e = b[n * 3 + 1] - zA, R = b[n * 3 + 2] - L, y = b[d * 3] - NA, Y = b[d * 3 + 1] - zA, u = b[d * 3 + 2] - L, o = e * u - R * Y, B = R * y - V * u, a = V * Y - e * y;
      if (o * o + B * B + a * a < 1e-18) return;
      o * (K[$ * 3] + K[n * 3] + K[d * 3]) + B * (K[$ * 3 + 1] + K[n * 3 + 1] + K[d * 3 + 1]) + a * (K[$ * 3 + 2] + K[n * 3 + 2] + K[d * 3 + 2]) < 0 ? this.idx.push($, d, n) : this.idx.push($, n, d);
    }
    quad($, n, d, b) {
      this.tri($, n, d), this.tri($, d, b);
    }
    geo() {
      const $ = new M.BufferGeometry();
      return $.setAttribute("position", new M.Float32BufferAttribute(this.p, 3)), $.setAttribute("normal", new M.Float32BufferAttribute(this.n, 3)), $.setAttribute("uv", new M.Float32BufferAttribute(this.uv, 2)), $.setAttribute("color", new M.Float32BufferAttribute(this.c, 3)), $.setIndex(this.idx), $;
    }
  }
  const k = /* @__PURE__ */ new Map(), s = (i, $) => {
    let n = k.get(i);
    return n || (n = $(), k.set(i, n)), n;
  }, v = (i) => typeof i == "number" ? i.toFixed(4) : String(i), S = (i) => {
    const $ = N(i);
    return [$.r, $.g, $.b];
  }, q = () => s("pbox", () => new M.BoxGeometry(1, 1, 1)), c = (i, $, n, d, b, K, NA, zA, L, V = {}) => i.add($, q(), n, NA, zA, L, { ...V, sx: d, sy: b, sz: K }), G = (i, $, n, d = 4e-3) => s("tx|" + i + "|" + v(n), () => O($, n, d)), r = [], t = () => r[r.length - 1] || [0, 0, 0, 0];
  function p(i, $, n, d, b = 0) {
    const K = t(), NA = Math.cos(K[3]), zA = Math.sin(K[3]);
    r.push([K[0] + $ * NA + d * zA, K[1] + n, K[2] - $ * zA + d * NA, K[3] + b]), i.push($, n, d, b);
  }
  function f(i) {
    r.pop(), i.pop();
  }
  function h(i, $, n, d, b, K, NA, zA) {
    const L = t(), V = Math.cos(L[3]), e = Math.sin(L[3]);
    let R = 1 / 0, y = 1 / 0, Y = -1 / 0, u = -1 / 0;
    for (const [a, H] of [[$, d], [b, d], [b, NA], [$, NA]]) {
      const m = L[0] + a * V + H * e, l = L[2] - a * e + H * V;
      R = Math.min(R, m), Y = Math.max(Y, m), y = Math.min(y, l), u = Math.max(u, l);
    }
    const o = (a) => Math.round(a * 1e4) / 1e4, B = (zA && zA.roof ? 1 : 0) | (zA && zA.rail ? 2 : 0);
    i.cols.push(B ? [o(R), o(L[1] + n), o(y), o(Y), o(L[1] + K), o(u), B] : [o(R), o(L[1] + n), o(y), o(Y), o(L[1] + K), o(u)]);
  }
  const X = (i, $, n, d, b, K, NA, zA) => h(i, $ - b / 2, n, d - NA / 2, $ + b / 2, n + K, d + NA / 2, zA), TA = (i) => {
    const $ = i.build;
    return i.build = (n, d) => {
      r.length = 0, $(n, d);
    }, i;
  }, Z = (i, $, n = false) => s(["disc", i, $, n ? 1 : 0].map(v).join("|"), () => {
    const d = new U(), b = d.v(0, 0, 0, 0, 0, 1), K = [], NA = $;
    for (let zA = 0; zA <= NA; zA++) {
      const L = n ? zA / NA * C : zA / NA * E;
      K.push(d.v(Math.cos(L) * i, Math.sin(L) * i, 0, 0, 0, 1));
    }
    for (let zA = 0; zA < NA; zA++) d.tri(b, K[zA], K[zA + 1]);
    return d.geo();
  }), W = (i, $, n = 10) => s(["archp", i, $, n].map(v).join("|"), () => {
    const d = new U(), b = i / 2, K = [d.v(-b, 0, 0, 0, 0, 1), d.v(b, 0, 0, 0, 0, 1), d.v(b, $, 0, 0, 0, 1), d.v(-b, $, 0, 0, 0, 1)];
    d.quad(K[0], K[1], K[2], K[3]);
    const NA = d.v(0, $, 0, 0, 0, 1), zA = [];
    for (let L = 0; L <= n; L++) {
      const V = L / n * C;
      zA.push(d.v(Math.cos(V) * b, $ + Math.sin(V) * b, 0, 0, 0, 1));
    }
    for (let L = 0; L < n; L++) d.tri(NA, zA[L], zA[L + 1]);
    return d.geo();
  }), PA = (i, $) => s(["tri", i, $].map(v).join("|"), () => {
    const n = new U();
    return n.tri(n.v(-i / 2, 0, 0, 0, 0, 1), n.v(i / 2, 0, 0, 0, 0, 1), n.v(0, $, 0, 0, 0, 1)), n.geo();
  }), MA = { cornice: [[0, 0], [0.06, 0], [0.06, 0.05], [0.1, 0.08], [0.13, 0.14], [0.26, 0.17], [0.3, 0.24], [0.33, 0.3], [0.34, 0.36], [0, 0.36]], string: [[0, 0], [0.05, 0], [0.07, 0.03], [0.07, 0.09], [0.05, 0.12], [0, 0.12]], plinth: [[0, 0], [0.09, 0], [0.09, 0.28], [0.05, 0.32], [0, 0.34]], sill: [[0, 0], [0.09, 0.01], [0.1, 0.05], [0.08, 0.07], [0, 0.07]], coping: [[-0.22, 0], [0.22, 0], [0.22, 0.06], [0.17, 0.1], [0, 0.13], [-0.17, 0.1], [-0.22, 0.06]] }, wA = (i, $, n, d, b, K, NA, zA, L = {}) => i.add($, G(d, MA[d], b), n, K, NA, zA, L), xA = (i, $, n, d, b, K, NA = 12) => {
    const zA = [];
    for (let L = 0; L <= NA; L++) {
      const V = (b + (K - b) * (L / NA)) * C / 180;
      zA.push([i + Math.cos(V) * n, $ + Math.sin(V) * d]);
    }
    return zA;
  }, YA = (i, $, n, d, b = 24) => ({ c: xA(i, $, n, d, 0, 360, b).slice(0, b) }), eA = { A: [0.66, [[0, 0], [0.33, 1], [0.66, 0]], [[0.13, 0.33], [0.53, 0.33]]], B: [0.58, [[0, 0], [0, 1]], [[0, 1], ...xA(0.3, 0.755, 0.245, 0.245, 90, -90, 12), [0, 0.51]], [[0, 0.51], ...xA(0.32, 0.255, 0.255, 0.255, 90, -90, 12), [0, 0]]], C: [0.64, xA(0.34, 0.5, 0.34, 0.5, 46, 314, 22)], D: [0.6, [[0, 0], [0, 1]], [[0, 1], ...xA(0.16, 0.5, 0.44, 0.5, 90, -90, 16), [0, 0]]], E: [0.5, [[0.5, 1], [0, 1], [0, 0], [0.5, 0]], [[0, 0.52], [0.42, 0.52]]], F: [0.5, [[0.5, 1], [0, 1], [0, 0]], [[0, 0.52], [0.42, 0.52]]], G: [0.68, [...xA(0.34, 0.5, 0.34, 0.5, 46, 360, 22), [0.4, 0.5]]], H: [0.6, [[0, 0], [0, 1]], [[0.6, 0], [0.6, 1]], [[0, 0.52], [0.6, 0.52]]], I: [0, [[0, 0], [0, 1]]], J: [0.5, [[0.5, 1], ...xA(0.25, 0.3, 0.25, 0.3, 0, -172, 12)]], K: [0.58, [[0, 0], [0, 1]], [[0.56, 1], [0.02, 0.38]], [[0.22, 0.6], [0.6, 0]]], L: [0.48, [[0, 1], [0, 0], [0.48, 0]]], M: [0.76, [[0, 0], [0, 1], [0.38, 0.3], [0.76, 1], [0.76, 0]]], N: [0.62, [[0, 0], [0, 1], [0.62, 0], [0.62, 1]]], O: [0.74, YA(0.37, 0.5, 0.37, 0.5, 28)], P: [0.56, [[0, 0], [0, 1]], [[0, 1], ...xA(0.29, 0.735, 0.265, 0.265, 90, -90, 12), [0, 0.47]]], Q: [0.74, YA(0.37, 0.5, 0.37, 0.5, 28), [[0.46, 0.22], [0.78, -0.04]]], R: [0.58, [[0, 0], [0, 1]], [[0, 1], ...xA(0.29, 0.735, 0.265, 0.265, 90, -90, 12), [0, 0.47]], [[0.26, 0.47], [0.6, 0]]], S: [0.56, [...xA(0.28, 0.75, 0.27, 0.25, 28, 270, 12), ...xA(0.28, 0.25, 0.28, 0.25, 90, -152, 12).slice(1)]], T: [0.62, [[0, 1], [0.62, 1]], [[0.31, 1], [0.31, 0]]], U: [0.6, [[0, 1], ...xA(0.3, 0.32, 0.3, 0.32, 180, 360, 14), [0.6, 1]]], V: [0.66, [[0, 1], [0.33, 0], [0.66, 1]]], W: [0.92, [[0, 1], [0.23, 0], [0.46, 0.72], [0.69, 0], [0.92, 1]]], X: [0.62, [[0, 1], [0.62, 0]], [[0, 0], [0.62, 1]]], Y: [0.64, [[0, 1], [0.32, 0.48], [0.64, 1]], [[0.32, 0.48], [0.32, 0]]], Z: [0.56, [[0, 1], [0.56, 1], [0, 0], [0.56, 0]]], 0: [0.56, YA(0.28, 0.5, 0.28, 0.5, 26)], 1: [0.3, [[0, 0.78], [0.26, 1], [0.26, 0]]], 2: [0.54, [...xA(0.27, 0.72, 0.27, 0.28, 160, -30, 12), [0, 0], [0.56, 0]]], 3: [0.54, xA(0.26, 0.75, 0.25, 0.25, 150, -90, 12), xA(0.27, 0.26, 0.28, 0.26, 90, -150, 12)], 4: [0.6, [[0.44, 0], [0.44, 1], [0, 0.3], [0.6, 0.3]]], 5: [0.54, [[0.5, 1], [0.07, 1], [0.05, 0.52], ...xA(0.29, 0.34, 0.28, 0.34, 150, -150, 14)]], 6: [0.56, [...xA(0.28, 0.5, 0.28, 0.5, 62, 180, 10), [0, 0.3]], YA(0.28, 0.3, 0.28, 0.3, 20)], 7: [0.54, [[0, 1], [0.54, 1], [0.18, 0]]], 8: [0.56, YA(0.28, 0.76, 0.23, 0.24, 18), YA(0.28, 0.27, 0.28, 0.27, 20)], 9: [0.56, YA(0.28, 0.7, 0.28, 0.3, 20), [[0.56, 0.7], ...xA(0.28, 0.5, 0.28, 0.5, 0, -118, 10)]], "-": [0.36, [[0, 0.45], [0.36, 0.45]]], "+": [0.46, [[0, 0.45], [0.46, 0.45]], [[0.23, 0.22], [0.23, 0.68]]], "/": [0.4, [[0, 0], [0.4, 1]]], "'": [0, [[0, 1], [0, 0.8]]], "&": [0.7, [[0.7, 0], ...xA(0.27, 0.72, 0.17, 0.2, -40, 220, 12).reverse(), [0.08, 0.28], ...xA(0.26, 0.24, 0.24, 0.24, 180, 300, 6), [0.62, 0.36]]] }, TM = { "·": [[0, 0.46]], ".": [[0, 0]], ":": [[0, 0.1], [0, 0.62]] }, AM = 0.34;
  function KA(i, $, n, d, b, K, NA) {
    const zA = $.length, L = Math.SQRT1_2, V = K - NA > 1e-5, e = b > 1e-5, R = $.map((o, B) => {
      const a = n ? $[(B - 1 + zA) % zA] : B > 0 ? $[B - 1] : null, H = n ? $[(B + 1) % zA] : B < zA - 1 ? $[B + 1] : null, m = (CA, iA) => {
        const F = iA[0] - CA[0], J = iA[1] - CA[1], AA = Math.hypot(F, J) || 1;
        return [-J / AA, F / AA];
      }, l = a ? m(a, o) : null, _ = H ? m(o, H) : null;
      if (!l) return [_[0], _[1], 1];
      if (!_) return [l[0], l[1], 1];
      let OA = l[0] + _[0], yA = l[1] + _[1];
      const EA = Math.hypot(OA, yA) || 1;
      return OA /= EA, yA /= EA, [OA, yA, Math.min(1.6, 1 / Math.max(0.3, OA * _[0] + yA * _[1]))];
    }), y = $.map((o, B) => {
      const [a, H, m] = R[B], l = (J) => [o[0] + a * m * J, o[1] + H * m * J], _ = e ? d - b : d, OA = l(_), yA = l(d), EA = l(-_), CA = l(-d), iA = e ? b : 0, F = [i.v(OA[0], OA[1], K, 0, 0, 1), i.v(EA[0], EA[1], K, 0, 0, 1)];
      return e && F.push(i.v(OA[0], OA[1], K, a * L, H * L, L), i.v(yA[0], yA[1], K - b, a * L, H * L, L), i.v(EA[0], EA[1], K, -a * L, -H * L, L), i.v(CA[0], CA[1], K - b, -a * L, -H * L, L)), V && F.push(i.v(yA[0], yA[1], K - iA, a, H, 0), i.v(yA[0], yA[1], NA, a, H, 0), i.v(CA[0], CA[1], K - iA, -a, -H, 0), i.v(CA[0], CA[1], NA, -a, -H, 0)), F;
    }), Y = n ? zA : zA - 1, u = y[0].length;
    for (let o = 0; o < Y; o++) {
      const B = y[o], a = y[(o + 1) % zA];
      for (let H = 0; H < u; H += 2) i.quad(B[H], B[H + 1], a[H + 1], a[H]);
    }
  }
  function BA(i, $, n, d, b, K, NA, zA, L = 0, V = E) {
    const e = Math.SQRT1_2, R = K - NA > 1e-5, y = b > 1e-5, Y = y ? d - b : d, u = V - L > E - 1e-4, o = i.v($, n, K, 0, 0, 1), B = [], a = [], H = [], m = [], l = [], _ = u ? zA : zA + 1;
    for (let OA = 0; OA < _; OA++) {
      const yA = L + (V - L) * OA / zA, EA = Math.cos(yA), CA = Math.sin(yA);
      B.push(i.v($ + EA * Y, n + CA * Y, K, 0, 0, 1)), y && (a.push(i.v($ + EA * Y, n + CA * Y, K, EA * e, CA * e, e)), H.push(i.v($ + EA * d, n + CA * d, K - b, EA * e, CA * e, e))), R && (m.push(i.v($ + EA * d, n + CA * d, K - (y ? b : 0), EA, CA, 0)), l.push(i.v($ + EA * d, n + CA * d, NA, EA, CA, 0)));
    }
    for (let OA = 0; OA < zA; OA++) {
      const yA = u ? (OA + 1) % zA : OA + 1;
      i.tri(o, B[OA], B[yA]), y && i.quad(a[OA], H[OA], H[yA], a[yA]), R && i.quad(m[OA], l[OA], l[yA], m[yA]);
    }
  }
  function fA(i, $, n, d, b = 10) {
    return s(["gl", i, $, n, d, b].map(v).join("|"), () => {
      const K = 1 - $, NA = $ / 2, zA = (Y) => [NA + Y[0] * K, NA + Y[1] * K], L = new U(), V = Math.min(d, NA * 0.6);
      if (TM[i]) {
        for (const Y of TM[i]) {
          const u = zA(Y);
          BA(L, NA * 1.15, u[1], NA * 1.15, V, n, 0, b);
        }
        return { geo: L.geo(), adv: $ * 1.3 };
      }
      const e = eA[i];
      if (!e) return { geo: null, adv: AM };
      const [R, ...y] = e;
      return y.forEach((Y, u) => {
        const o = n > 0 ? n - u * 6e-3 : u * 4e-4, B = !Array.isArray(Y);
        let a = (B ? Y.c : Y).map(zA);
        if (a = a.filter((_, OA) => OA === 0 || Math.hypot(_[0] - a[OA - 1][0], _[1] - a[OA - 1][1]) > 1e-4), B) {
          KA(L, a, true, NA, V, o, 0);
          return;
        }
        let H = [a[0]];
        const m = [a[0], a[a.length - 1]];
        for (let _ = 1; _ < a.length; _++) if (H.push(a[_]), _ < a.length - 1) {
          const OA = a[_ - 1], yA = a[_], EA = a[_ + 1], CA = Math.atan2(yA[1] - OA[1], yA[0] - OA[0]), iA = Math.atan2(EA[1] - yA[1], EA[0] - yA[0]);
          let F = Math.abs(iA - CA);
          F > C && (F = E - F), F > 0.6 && (KA(L, H, false, NA, V, o, 0), H = [a[_]], m.push(a[_]));
        }
        H.length > 1 && KA(L, H, false, NA, V, o, 0);
        const l = (_, OA) => {
          const yA = Math.atan2(_[1] - OA[1], _[0] - OA[0]);
          BA(L, _[0], _[1], NA, V, o, 0, Math.max(3, Math.round(b / 2)), yA - P, yA + P);
        };
        l(a[0], a[1]), l(a[a.length - 1], a[a.length - 2]);
        for (const _ of m.slice(2)) BA(L, _[0], _[1], NA, V, o, 0, b);
      }), { geo: L.geo(), adv: R * K + $ };
    });
  }
  const IM = (i, $ = 0.17, n = 0.12) => {
    let d = 0;
    const b = [...i];
    return b.forEach((K, NA) => {
      d += K === " " ? AM : fA(K, $, 0.12, 0.035).adv, NA < b.length - 1 && (d += n);
    }), d;
  };
  function GA(i, $, n = {}) {
    const d = n.h ?? 0.3, b = n.wt ?? 0.17, K = !!n.flat, NA = K ? 0 : n.dep ?? 0.12, zA = K ? 0 : n.bev ?? (d < 0.34 ? 0 : 0.03), L = n.track ?? 0.12, V = n.ds ?? (K || d < 0.12 ? 6 : 8), e = IM($, b, L) * d;
    let R = n.align === "left" ? 0 : n.align === "right" ? -e : -e / 2;
    const y = [...$];
    return y.forEach((Y, u) => {
      if (Y === " ") {
        R += (AM + L) * d;
        return;
      }
      const o = fA(Y, b, NA, zA, V), B = n.mat ?? (K ? "paint" : "gloss");
      if (o.geo && i.add(K || d < 0.2 ? Q(B) : B, o.geo, n.c ?? x.club, (n.x ?? 0) + R, n.y ?? 0, n.z ?? 0, { s: d, sz: K ? 1 : d, glow: n.glow, ao: false }), o.geo && n.lit) {
        const a = fA(Y, b, 0, 0, V);
        a.geo && i.add(Q("glow"), a.geo, n.litC ?? n.c ?? x.clubGold, (n.x ?? 0) + R, n.y ?? 0, (n.z ?? 0) + NA * d + 4e-3, { s: d, sz: 1, glow: n.lit, ao: false });
      }
      R += (o.adv + (u < y.length - 1 ? L : 0)) * d;
    }), e;
  }
  function bA(i, $, n, d, b, K = {}) {
    const NA = K.frame ?? x.trim, zA = K.sash ?? x.white, L = 0.12, V = 0.05, e = K.ns ? Q("paint") : "paint";
    c(i, Q("gloss"), K.glass ?? x.glass, d, b, 0.02, $, n + b / 2, 0.01), c(i, e, NA, d + L * 2, L, V, $, n + b + L / 2, V / 2);
    for (const Y of [-1, 1]) c(i, e, NA, L, b + L, V, $ + Y * (d / 2 + L / 2), n + (b + L) / 2 - 0, V / 2);
    const R = K.bars ?? (d > 0.9 ? 2 : 1);
    c(i, Q("paint"), zA, d, 0.05, 0.035, $, n + b - 0.025, 0.03), c(i, Q("paint"), zA, d, 0.06, 0.035, $, n + 0.03, 0.03);
    for (const Y of [-1, 1]) c(i, Q("paint"), zA, 0.045, b, 0.035, $ + Y * (d / 2 - 0.022), n + b / 2, 0.03);
    c(i, Q("paint"), zA, d, 0.055, 0.045, $, n + b * 0.5, 0.035);
    for (let Y = 1; Y < R; Y++) c(i, Q("paint"), zA, 0.025, b, 0.03, $ - d / 2 + Y * d / R, n + b / 2, 0.028);
    K.lit ? c(i, Q("glow"), x.lamp, d - 0.1, b * 0.28, 6e-3, $, n + b * 0.82, 0.024, { glow: K.lit }) : K.blind && c(i, Q("paint"), K.blind, d - 0.1, b * 0.26, 6e-3, $, n + b * 0.84, 0.024), i.add(e, G("sill", MA.sill, d + L * 2 + 0.12), NA, $, n - 0.075, 0, {});
    for (const Y of [-1, 1]) c(i, Q("paint"), NA, 0.08, 0.12, 0.07, $ + Y * (d / 2 + 0.02), n - 0.14, 0.035);
    const y = n + b + L;
    if (K.hood === "cornice" || K.hood === "pediment" || K.hood === "segment") if (c(i, e, NA, d + L * 2, 0.16, 0.04, $, y + 0.08, 0.02), i.add(e, G("hoodc", [[0, 0], [0.07, 0], [0.1, 0.05], [0.12, 0.1], [0, 0.1]], d + L * 2 + 0.16), NA, $, y + 0.16, 0, {}), K.hood === "pediment") {
      i.add(e, PA(d + L * 2 + 0.1, 0.36), NA, $, y + 0.26, 0.06, {});
      for (const Y of [-1, 1]) i.push($ + Y * (d / 2 + L + 0.05) / 2, y + 0.26 + 0.18, 0.07, 0, 0, -Y * Math.atan2(0.36, (d + L * 2 + 0.1) / 2)), c(i, e, NA, Math.hypot(0.36, (d + L * 2 + 0.1) / 2) + 0.06, 0.07, 0.1, 0, 0, 0), i.pop();
    } else K.hood === "segment" && i.tube(e, NA, z($, y + 0.05 - (d + 0.3) * 0.5, 0.06, (d + 0.3) * 0.5 / Math.sin(1.05) * Math.sin(1.05), P - 0.75, P + 0.75, 10), 0.05, { radial: 5 });
    else K.key !== false && c(i, e, NA, 0.14, 0.2, 0.07, $, y - 0.02, 0.035);
    if (K.balconette) {
      const Y = d + 0.3, u = 0.26;
      c(i, "gloss", x.ironDk, Y, 0.04, 0.3, $, n - 0.06, u / 2 + 0.02);
      for (const o of [-1, 1]) i.cyl("gloss", x.ironDk, 0.018, 0.55, $ + o * Y / 2, n + 0.22, u, { seg: 6 });
      i.cyl("gloss", x.ironDk, 0.016, Y, $, n + 0.48, u, { rz: P, seg: 6 });
      for (let o = 1; o < Math.round(Y / 0.11); o++) i.tube(Q("gloss"), x.ironDk, [g($ - Y / 2 + o * 0.11, n - 0.04, u), g($ - Y / 2 + o * 0.11, n + 0.2, u + 0.05), g($ - Y / 2 + o * 0.11, n + 0.48, u)], 8e-3, { radial: 4 });
    }
  }
  function sM(i, $, n, d, b, K = {}) {
    const NA = K.frame ?? x.trim, zA = d / 2;
    i.add(Q("gloss"), W(d, b, 12), K.glass ?? x.glass, $, n, 0.012, {}), i.tube("paint", NA, z($, n + b, 0.04, zA + 0.07, 0, C, 12), 0.07, { radial: 5 });
    for (const L of [-1, 1]) c(i, "paint", NA, 0.14, b, 0.08, $ + L * (zA + 0.07), n + b / 2, 0.04);
    if (c(i, "paint", K.key ?? NA, 0.18, 0.26, 0.1, $, n + b + zA + 0.06, 0.05), K.impost !== false) for (const L of [-1, 1]) c(i, "paint", NA, 0.24, 0.07, 0.12, $ + L * (zA + 0.07), n + b, 0.06);
    if (K.fan !== false) {
      c(i, Q("paint"), x.white, d, 0.05, 0.04, $, n + b, 0.03);
      for (let L = 1; L < 4; L++) {
        const V = L / 4 * C;
        i.push($, n + b, 0.03, 0, 0, V - P), c(i, Q("paint"), x.white, 0.025, zA, 0.03, 0, zA / 2, 0), i.pop();
      }
      i.tube(Q("paint"), x.white, z($, n + b, 0.03, zA * 0.45, 0, C, 8), 0.014, { radial: 4 });
    }
    if (K.door) {
      const L = K.door;
      for (const V of [-1, 1]) {
        const e = $ + V * d / 4;
        i.box("paint", L, d / 2 - 0.02, b - 0.04, 0.05, e, (b - 0.04) / 2 + n, 0.03, { r: 0.012 }), c(i, Q("gloss"), K.glass ?? x.glass, d / 2 - 0.2, b * 0.42, 0.012, e, n + b * 0.66, 0.058);
        for (const R of [0.18, 0.4]) c(i, Q("paint"), I(L, 0.85), d / 2 - 0.2, b * 0.17, 0.012, e, n + b * R, 0.058);
        c(i, Q("metal"), x.gold, 0.03, 0.16, 0.03, $ + V * 0.06, n + 1, 0.07);
      }
      K.lit && c(i, Q("glow"), x.lamp, d * 0.5, zA * 0.45, 4e-3, $, n + b + zA * 0.35, 0.016, { glow: K.lit });
    } else K.bars !== false && c(i, Q("paint"), x.white, 0.04, b, 0.035, $, n + b / 2, 0.03), K.transom && c(i, Q("paint"), x.white, d, 0.045, 0.035, $, n + b * K.transom, 0.03), K.lit && c(i, Q("glow"), x.lamp, d - 0.1, b * 0.3, 4e-3, $, n + b * 0.78, 0.016, { glow: K.lit });
  }
  function WM(i, $, n, d, b = 0.4, K = x.trim, NA = 0.07) {
    c(i, "paint", K, b, d - n - 0.3, NA, $, (n + d) / 2, NA / 2), c(i, "paint", K, b + 0.1, 0.18, NA + 0.04, $, n + 0.09, (NA + 0.04) / 2), c(i, "paint", K, b + 0.12, 0.08, NA + 0.06, $, d - 0.2, (NA + 0.06) / 2), c(i, "paint", K, b + 0.16, 0.1, NA + 0.08, $, d - 0.06, (NA + 0.08) / 2);
  }
  function cA(i, $, n, d, b = 1, K = x.stoneDk) {
    let NA = 0;
    for (let zA = n; zA < d - 0.1; zA += 0.4, NA++) c(i, "paint", K, NA % 2 ? 0.34 : 0.52, 0.34, 0.035, $ - b * (NA % 2 ? 0.17 : 0.26), zA + 0.19, 0.0175);
  }
  const MM = [[0, 0], [0.068, 0], [0.068, 0.05], [0.048, 0.075], [0.043, 0.11], [0.07, 0.21], [0.076, 0.27], [0.062, 0.37], [0.04, 0.45], [0.036, 0.5], [0.05, 0.53], [0.064, 0.56], [0.064, 0.6], [0, 0.6]];
  function qA(i, $, n = {}) {
    const d = n.h ?? 0.95, b = n.c ?? x.stone, K = n.bay ?? 2.6, NA = Math.max(1, Math.round($ / K)), zA = $ / NA, L = 0.34, V = 0.17, e = d - 0.13, R = e - V;
    i.box("paint", I(b, 0.93), $, V, 0.3, $ / 2, V / 2, 0, { r: 0.025 }), i.add("paint", G("coping", MA.coping, $), b, $ / 2, e, 0, {});
    for (let y = 0; y <= NA; y++) {
      if (y === 0 && n.p0 === false || y === NA && n.p1 === false) continue;
      const Y = y * zA;
      if (i.box("paint", b, L, d + 0.02, L + 0.04, Y, (d + 0.02) / 2, 0, { r: 0.03 }), c(i, "paint", I(b, 1.03), L + 0.08, 0.07, L + 0.12, Y, d + 0.055, 0), y === 0 && n.lamp0 || y === NA && n.lamp1 ? vA(i, Y, d + 0.09, 0) : n.urns && y % n.urns === 0 ? UA(i, Y, d + 0.09, 0, n.urnC) : n.balls !== false && (c(i, "paint", b, 0.18, 0.05, 0.18, Y, d + 0.115, 0), i.sph("paint", b, 0.1, Y, d + 0.24, 0, { ws: 10, hs: 7 })), y < NA) {
        const u = Y + L / 2 + 0.06, o = Y + zA - L / 2 - 0.06, B = Math.max(1, Math.round((o - u) / 0.2));
        for (let a = 0; a <= B; a++) i.lathe("paint", b, MM, u + (o - u) * a / B, V, 0, { seg: n.seg ?? 7, sy: R / 0.6 });
      }
    }
    n.col !== false && h(i, n.c0 ?? -L / 2, 0, -0.2, $ + (n.c1 ?? L / 2), d + 0.1, 0.2, { rail: true });
  }
  function UA(i, $, n, d, b = x.coral) {
    i.lathe("paint", x.stone, [[0, 0], [0.12, 0], [0.12, 0.04], [0.06, 0.08], [0.06, 0.14], [0.16, 0.2], [0.21, 0.32], [0.22, 0.4], [0.2, 0.42], [0, 0.42]], $, n, d, { seg: 10 }), i.add("foliage", VA(0.2, 1, 3), x.leaf, $, n + 0.47, d, { sy: 0.7 });
    for (let K = 0; K < 5; K++) {
      const NA = K / 5 * E + 0.3;
      i.sph(Q("paint"), b, 0.045, $ + Math.cos(NA) * 0.14, n + 0.52 + K % 2 * 0.04, d + Math.sin(NA) * 0.14, { ws: 6, hs: 4 });
    }
  }
  const VA = (i, $, n) => s(["blob", i, $, n].map(v).join("|"), () => A.blobGeo(i, $, n));
  function zM(i, $, n = {}) {
    const d = n.h ?? 1.05, b = n.c ?? x.iron, K = Math.max(1, Math.round($ / (n.bay ?? 1.8))), NA = $ / K;
    i.cyl("gloss", b, 0.028, $, $ / 2, d, 0, { rz: P, seg: 8, open: true }), i.cyl("gloss", b, 0.017, $, $ / 2, d - 0.24, 0, { rz: P, seg: 6, open: true }), i.cyl("gloss", b, 0.017, $, $ / 2, 0.1, 0, { rz: P, seg: 6, open: true });
    for (let zA = 0; zA <= K; zA++) {
      const L = zA * NA;
      if (!(zA === 0 && n.p0 === false || zA === K && n.p1 === false) && (i.lathe("gloss", b, [[0, 0], [0.07, 0], [0.07, 0.04], [0.045, 0.08], [0.035, 0.16], [0.03, d - 0.1], [0.04, d - 0.04], [0.04, d + 0.03], [0.025, d + 0.06], [0, d + 0.07]], L, 0, 0, { seg: 8 }), i.sph("gloss", b, 0.05, L, d + 0.1, 0, { ws: 8, hs: 6 }), zA < K)) {
        const V = Math.max(2, Math.round(NA / 0.12));
        for (let e = 1; e < V; e++) {
          const R = L + e * NA / V;
          i.cyl(Q("gloss"), b, 9e-3, d - 0.34, R, 0.1 + (d - 0.34) / 2, 0, { seg: 4, open: true }), e % 2 === 1 && i.tor(Q("gloss"), b, 0.085, 9e-3, R + NA / V / 2 - NA / V / 2, d - 0.12, 0, { rs: 3, ts: 10 });
        }
      }
    }
    n.col !== false && h(i, 0, 0, -0.08, $, d + 0.12, 0.08, { rail: true });
  }
  function dA(i, $, n, d, b = 1) {
    i.push($, n, d, 0, 0, 0, b), i.lathe("gloss", x.ironDk, [[0, 0], [0.05, 0], [0.11, 0.06], [0.13, 0.1], [0.1, 0.12], [0, 0.12]], 0, 0, 0, { seg: 6 }), i.lathe(Q("glow"), x.lamp, [[0, 0.1], [0.11, 0.12], [0.14, 0.34], [0.12, 0.42], [0, 0.42]], 0, 0, 0, { seg: 6, glow: 1.5 });
    for (let K = 0; K < 6; K++) {
      const NA = K / 6 * E;
      i.cyl(Q("gloss"), x.ironDk, 0.01, 0.32, Math.cos(NA) * 0.14, 0.27, Math.sin(NA) * 0.14, { seg: 4, rz: -Math.cos(NA) * 0.08, rx: Math.sin(NA) * 0.08 });
    }
    i.lathe("gloss", x.ironDk, [[0, 0.4], [0.17, 0.42], [0.18, 0.45], [0.08, 0.56], [0.04, 0.62], [0, 0.63]], 0, 0, 0, { seg: 6 }), i.sph("gloss", x.gold, 0.035, 0, 0.66, 0, { ws: 6, hs: 4 }), i.pop();
  }
  function QM(i, $) {
    i.lathe("paint", x.granite, [[0, 0], [0.34, 0], [0.34, 0.1], [0.3, 0.14], [0.28, 0.3], [0.24, 0.34], [0, 0.34]], 0, 0, 0, { seg: 10 }), i.lathe("gloss", $, [[0, 0.34], [0.2, 0.34], [0.2, 0.4], [0.14, 0.46], [0.11, 0.62], [0.13, 0.66], [0.09, 0.7], [0, 0.7]], 0, 0, 0, { seg: 10 });
    for (let n = 0; n < 3; n++) {
      const d = n / 3 * E, b = [];
      for (let NA = 0; NA <= 10; NA++) {
        const zA = NA / 10, L = d + zA * 2.2, V = 0.18 - 0.06 * zA;
        b.push(g(Math.cos(L) * V, 0.42 + zA * 0.55 + 0.08 * Math.sin(zA * C), Math.sin(L) * V));
      }
      i.add("gloss", s("dolph" + n, () => w(b, (NA) => 0.012 + 0.05 * Math.pow(Math.sin(C * Math.min(1, NA * 1.25)), 0.7), 6)), $, 0, 0, 0, {});
      const K = b[b.length - 1];
      i.push(K[0], K[1], K[2], -(d + 2.2)), c(i, "gloss", $, 0.02, 0.08, 0.12, 0, 0.02, 0, { rx: 0.4 }), i.pop();
    }
  }
  j.tidewater_lamp = { desc: "Victorian seafront lamp standard: granite plinth, three coiled cast-iron dolphins round the foot, fluted column with gilt collars; variant 0 single lantern on top, 1 scrolled crossarm with two lanterns (arm along X), 2 five-light candelabra. Lanterns glow at dusk. Base collides.", params: { color: "iron paint", height: "m (4.2)" }, variants: 3, mount: "ground", build(i, $) {
    const n = $.color ?? x.iron, d = ($.variant ?? 0) % 3, b = $.height ?? (d === 2 ? 4.6 : 4.2);
    QM(i, n), i.lathe("gloss", n, [[0.075, 0.7], [0.07, 1.2], [0.058, b - 0.35], [0.07, b - 0.3], [0.07, b - 0.22], [0.05, b - 0.18], [0, b - 0.18]], 0, 0, 0, { seg: 10 });
    for (const NA of [1.2, 1.26, b - 0.36]) i.tor(Q("metal"), x.gold, 0.072, 0.012, 0, NA, 0, { rx: P, rs: 4, ts: 12 });
    const K = (NA, zA, L) => {
      i.tube(Q("metal"), x.ironDk, [g(NA, zA + 0.45, L), g(NA, zA + 0.1, L)], 8e-3, { radial: 3 }), i.lathe("metal", x.ironDk, [[0, 0], [0.2, 0.02], [0.27, 0.16], [0, 0.16]], NA, zA - 0.1, L, { seg: 8 }), i.add("foliage", VA(0.3, 1, 11), x.leaf, NA, zA + 0.02, L, { sy: 0.7 });
      for (let V = 0; V < 7; V++) {
        const e = V / 7 * E;
        i.sph(Q("paint"), [x.coral, "#f1ede0", "#9a6ac2", "#e7d24a"][V % 4], 0.055, NA + Math.cos(e) * 0.24, zA + V % 2 * 0.1 - 0.08, L + Math.sin(e) * 0.24, { ws: 5, hs: 4 });
      }
      for (let V = 0; V < 5; V++) {
        const e = V / 5 * E + 0.3;
        i.tube(Q("foliage"), x.leafLt, [g(NA + Math.cos(e) * 0.24, zA - 0.05, L + Math.sin(e) * 0.24), g(NA + Math.cos(e) * 0.3, zA - 0.35, L + Math.sin(e) * 0.3), g(NA + Math.cos(e) * 0.28, zA - 0.6, L + Math.sin(e) * 0.28)], 0.02, { radial: 3 });
      }
    };
    if ($.baskets && d !== 1 && (i.tube("gloss", n, [g(0, b - 1.2, 0), g(0.3, b - 1.05, 0), g(0.55, b - 1.1, 0)], 0.018, { radial: 4 }), K(0.55, b - 1.65, 0)), d === 0) dA(i, 0, b - 0.2, 0, 1.1);
    else if (d === 1) {
      const NA = b - 0.45;
      i.tube("gloss", n, [g(-0.62, NA + 0.1, 0), g(-0.4, NA - 0.02, 0), g(0, NA, 0), g(0.4, NA - 0.02, 0), g(0.62, NA + 0.1, 0)], 0.025, { radial: 6 });
      for (const zA of [-1, 1]) i.tube(Q("gloss"), n, [g(0, NA - 0.5, 0), g(zA * 0.15, NA - 0.45, 0), g(zA * 0.32, NA - 0.25, 0), g(zA * 0.3, NA - 0.1, 0), g(zA * 0.22, NA - 0.08, 0)], 0.012, { radial: 4 }), i.tor(Q("gloss"), n, 0.05, 0.01, zA * 0.24, NA - 0.13, 0, { rs: 3, ts: 8 }), dA(i, zA * 0.62, NA + 0.1, 0, 0.95), $.baskets && K(zA * 0.4, NA - 0.55, 0);
    } else {
      dA(i, 0, b - 0.2, 0, 1.1);
      const NA = b - 0.7;
      for (let zA = 0; zA < 4; zA++) {
        const L = zA / 4 * E + C / 4, V = Math.cos(L), e = Math.sin(L);
        i.tube("gloss", n, [g(0, NA - 0.2, 0), g(V * 0.25, NA - 0.1, e * 0.25), g(V * 0.45, NA + 0.08, e * 0.45), g(V * 0.5, NA + 0.2, e * 0.5)], 0.02, { radial: 5 }), dA(i, V * 0.5, NA + 0.22, e * 0.5, 0.85);
      }
    }
    i.col(-0.3, 0, -0.3, 0.3, 1.1, 0.3, { roof: true }), i.blob(1, 1);
  } };
  function mM(i, $, n) {
    for (const d of [-1, 1]) {
      const b = d * ($ / 2 - 0.08);
      i.tube("gloss", n, [g(b, 0, 0.26), g(b, 0.22, 0.22), g(b, 0.42, 0.2), g(b, 0.44, 0), g(b, 0.44, -0.18)], 0.028, { radial: 5 }), i.tube("gloss", n, [g(b, 0, -0.24), g(b, 0.2, -0.2), g(b, 0.44, -0.18), g(b, 0.66, -0.26), g(b, 0.86, -0.3), g(b, 0.9, -0.24)], 0.028, { radial: 5 }), i.tube(Q("gloss"), n, [g(b, 0.44, 0.2), g(b, 0.6, 0.24), g(b, 0.64, 0.14), g(b, 0.56, 0.1)], 0.022, { radial: 4 }), i.tor(Q("gloss"), n, 0.05, 0.012, b, 0.2, 0.02, { ry: P, rs: 3, ts: 8 });
    }
    for (let d = 0; d < 4; d++) i.box("wood", I(x.woodLt, 0.92 + d % 2 * 0.08), $, 0.035, 0.085, 0, 0.47, 0.17 - d * 0.105, { r: 0.012 });
    for (let d = 0; d < 3; d++) i.push(0, 0.56 + d * 0.12, -0.215 - d * 0.03, 0, -0.25), i.box("wood", I(x.woodLt, 0.95 + d % 2 * 0.06), $ - 0.05, 0.085, 0.03, 0, 0, 0, { r: 0.012 }), i.pop();
  }
  j.tidewater_bench = { desc: "Victorian seaside bench: sea-green cast-iron scroll ends, varnished slat seat + back, faces +Z. variant 1 = back-to-back pair. Low collider.", params: { length: "m (1.9)", color: "iron" }, variants: 2, mount: "ground", build(i, $) {
    const n = $.length ?? 1.9, d = $.color ?? x.iron;
    mM(i, n, d);
    const b = ($.variant ?? 0) % 2, K = b ? -0.95 : -0.32, NA = $.segCol ?? 1;
    b && (i.push(0, 0, -0.64, C), mM(i, n, d), i.pop());
    for (let zA = 0; zA < NA; zA++) i.col(-n / 2 + zA * n / NA, 0, K + (NA > 1 ? 0.1 : 0), -n / 2 + (zA + 1) * n / NA, 0.9, 0.3 - (NA > 1 ? 0.1 : 0));
    i.blob(n + 0.3, 0.9);
  } }, j.tidewater_balustrade = { desc: "Portland-stone balustrade run along +X from pos: plinth, vase balusters, moulded coping, piers every ~2.6 m with ball finials (urns: every Nth pier carries a planted urn). Collides as a low wall (0.95 m) unless col:false.", params: { length: "m (4)", h: "m (0.95)", urns: "N", col: "bool", p0: "first pier", p1: "last pier" }, variants: 1, mount: "ground", build(i, $) {
    qA(i, $.length ?? 4, $);
  } }, j.tidewater_searail = { desc: "Sea-green cast-iron promenade railing along +X from pos (posts with ball finials, rings under the top rail, dog bars); collides as a thin 1.1 m wall.", params: { length: "m (6)", col: "bool" }, variants: 1, mount: "ground", build(i, $) {
    zM(i, $.length ?? 6, $);
  } };
  function aM(i, $, n, d, b, K) {
    i.push($, n, d, K), i.add(Q("glow"), Z(b, 32), "#f6eedb", 0, 0, 0.02, { glow: 0.95 }), i.tor("gloss", x.ironDk, b + 0.03, 0.05, 0, 0, 0.03, { rs: 4, ts: 32 }), i.tor(Q("gloss"), x.gold, b + 0.1, 0.03, 0, 0, 0.02, { rs: 4, ts: 32 }), i.tor(Q("paint"), x.ink, b * 0.86, 8e-3, 0, 0, 0.03, { rs: 3, ts: 32 });
    for (let zA = 0; zA < 12; zA++) {
      const L = zA / 12 * E, V = zA % 3 === 0;
      i.push(Math.sin(L) * b * 0.74, Math.cos(L) * b * 0.74, 0.03, 0, 0, -L), c(i, Q("paint"), x.ink, V ? 0.07 : 0.04, V ? 0.24 : 0.16, 0.01, 0, 0, 0), i.pop();
    }
    const NA = (zA, L, V) => {
      i.push(0, 0, 0.05, 0, 0, -zA), c(i, Q("gloss"), x.ink, V, L, 0.012, 0, L / 2 - 0.06, 0), i.add(Q("gloss"), PA(V * 2.8, V * 2.4), x.ink, 0, L - 0.06, 1e-3, {}), i.pop();
    };
    NA((10 + 10 / 60) / 12 * E, b * 0.5, 0.05), NA(10 / 60 * E, b * 0.74, 0.035), i.cyl(Q("gloss"), x.gold, 0.05, 0.05, 0, 0, 0.07, { rx: P, seg: 10 }), i.pop();
  }
  j.tidewater_clocktower = { desc: "Jubilee clock tower dressing for the 3.4 m square tower block (pos = centre of its base on the terrace, block rises 11.3 m): granite quoins, drinking-fountain troughs (±X) and JUBILEE plaques (±Z) on the plinth, string courses, tall lancet slots, four gabled clock stages with glowing dials, then (above the block) an open belfry with a bell, a balustrade, the copper ogee dome, a lantern and a ship weather vane (~18 m). Mirror-symmetric; place once (mirror:false).", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.aoBase = null;
    const n = 3.4, d = n / 2, b = $.top ?? 11.3, K = x.stucco, NA = x.trim;
    for (let e = 0; e < 4; e++) {
      const R = e * P;
      p(i, Math.sin(R) * d, 0, Math.cos(R) * d, R), i.add("paint", G("plinthT", MA.plinth, n + 0.18), x.granite, 0, 0, 0, {});
      for (const y of [-1, 1]) cA(i, y * (d - 0.01), 0.34, 2.3, y, "#c9c2b2");
      if (wA(i, "paint", NA, "string", n + 0.16, 0, 2.3, 0), e % 2 === 0) c(i, "paint", NA, 1.3, 0.8, 0.05, 0, 1.35, 0.025), c(i, "metal", x.bronze, 1.1, 0.6, 0.03, 0, 1.35, 0.06), GA(i, "JUBILEE", { h: 0.14, x: 0, y: 1.44, z: 0.082, c: "#f0d9a0", flat: true, wt: 0.22, track: 0.16, mat: "metal" }), GA(i, "1887", { h: 0.18, x: 0, y: 1.15, z: 0.082, c: "#f0d9a0", flat: true, wt: 0.22, track: 0.2, mat: "metal" });
      else {
        i.add(Q("paint"), W(0.9, 0.7, 10), x.stoneDk, 0, 0.75, 0.01, {}), i.tube("paint", NA, z(0, 1.45, 0.04, 0.5, 0, C, 10), 0.05, { radial: 5 });
        for (const y of [-1, 1]) c(i, "paint", NA, 0.1, 0.72, 0.08, y * 0.5, 1.09, 0.04);
        i.sph("metal", x.bronze, 0.1, 0, 1.3, 0.06, { ws: 8, hs: 6 }), i.cyl("metal", x.bronze, 0.018, 0.12, 0, 1.24, 0.14, { rx: P, seg: 6 }), i.box("paint", x.granite, 1.1, 0.5, 0.42, 0, 0.25, 0.22, { r: 0.05 }), h(i, -0.55, 0, 0, 0.55, 0.5, 0.43), i.box(Q("gloss"), x.water, 0.94, 0.02, 0.3, 0, 0.47, 0.22, { r: 0.01 });
      }
      for (const y of [-1, 1]) c(i, "paint", NA, 0.28, b - 2.9 - 2.42, 0.05, y * (d - 0.14), 2.42 + (b - 2.9 - 2.42) / 2, 0.025);
      i.add(Q("gloss"), W(0.42, 2.2, 8), x.glass, 0, 3.7, 0.012, {}), i.tube("paint", NA, z(0, 5.9, 0.03, 0.29, 0, C, 8), 0.045, { radial: 4 });
      for (const y of [-1, 1]) c(i, "paint", NA, 0.08, 2.2, 0.06, y * 0.29, 4.8, 0.03);
      i.add("paint", G("sillT", MA.sill, 0.8), NA, 0, 3.62, 0, {}), wA(i, "paint", NA, "string", n + 0.16, 0, 6.9, 0), wA(i, "paint", NA, "string", n + 0.16, 0, b - 2.95, 0), c(i, "paint", D(K, x.stoneDk, 0.3), n - 0.5, 2.3, 0.04, 0, b - 1.65, 0.02), aM(i, 0, b - 1.7, 0.02, 0.92, 0);
      for (const [y, Y] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) i.add(Q("paint"), PA(0.3, 0.3), x.gold, y * 1.22, b - 1.7 + Y * 0.98, 0.045, { rz: y * Y > 0 ? y > 0 ? C * 0.75 : -C * 0.75 : y > 0 ? C / 4 : -C / 4 });
      i.add("paint", G("cornT", MA.cornice, n + 0.3), NA, 0, b - 0.36, 0, {}), i.add("paint", PA(n - 0.2, 0.9), K, 0, b, -0.05, {});
      for (const y of [-1, 1]) i.push(y * (n - 0.2) / 4, b + 0.45, 0, 0, 0, -y * Math.atan2(0.9, (n - 0.2) / 2)), c(i, "paint", NA, Math.hypot(0.9, (n - 0.2) / 2) + 0.12, 0.12, 0.16, 0, 0, 0), i.pop();
      i.cyl("gloss", x.gold, 0.16, 0.04, 0, b + 0.3, 0, { rx: P, seg: 12 }), f(i);
    }
    for (const [e, R] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const y = e * (d + 0.05), Y = R * (d + 0.05);
      i.box("paint", NA, 0.36, 0.3, 0.36, y, b + 0.15, Y, { r: 0.03 }), i.lathe("paint", K, [[0.15, 0], [0.15, 0.5], [0.19, 0.55], [0.19, 0.62], [0, 0.62]], y, b + 0.3, Y, { seg: 4, ry: C / 4 }), i.lathe("paint", x.slate, [[0.2, 0], [0.12, 0.3], [0.03, 0.75], [0, 0.8]], y, b + 0.92, Y, { seg: 4, ry: C / 4 }), i.sph("metal", x.gold, 0.05, y, b + 1.76, Y, { ws: 6, hs: 4 });
    }
    i.lathe("paint", x.slate, [[d * 1.414, 0], [0.9, 0.85], [0, 0.95]], 0, b, 0, { seg: 4, ry: C / 4 });
    const zA = b + 0.75;
    i.box("paint", NA, 2.5, 0.3, 2.5, 0, zA + 0.15, 0, { r: 0.04 });
    for (const [e, R] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) i.cyl("paint", K, 0.14, 1.9, e * 1, zA + 1.25, R * 1, { seg: 10 }), i.box("paint", NA, 0.36, 0.14, 0.36, e * 1, zA + 0.37, R * 1, { r: 0.02 }), i.box("paint", NA, 0.38, 0.16, 0.38, e * 1, zA + 2.26, R * 1, { r: 0.02 });
    for (let e = 0; e < 4; e++) {
      const R = e * P;
      i.push(Math.sin(R) * 1, 0, Math.cos(R) * 1, R), i.tube("paint", NA, z(0, zA + 1.75, 0, 0.72, 0.05, C - 0.05, 10), 0.07, { radial: 5 }), c(i, "paint", NA, 2.3, 0.3, 0.2, 0, zA + 2.49, 0), i.pop();
    }
    i.lathe("metal", x.bronze, [[0, 0.62], [0.12, 0.6], [0.22, 0.45], [0.3, 0.12], [0.36, 0], [0.3, 0.02], [0, 0.05]], 0, zA + 1, 0, { seg: 14 }), i.box("paint", NA, 2.7, 0.2, 2.7, 0, zA + 2.72, 0, { r: 0.04 });
    for (let e = 0; e < 4; e++) i.push(0, zA + 2.82, 0, e * P), i.push(-1.2, 0, 1.22, 0), qA(i, 2.4, { h: 0.55, bay: 2.4, col: false, balls: true, seg: 5 }), i.pop(), i.pop();
    const L = zA + 2.82;
    h(i, -1.35, zA, -1.35, 1.35, L + 0.62, 1.35, { rail: true }), h(i, -1.05, L + 0.62, -1.05, 1.05, L + 2.4, 1.05, { roof: true }), i.lathe("gloss", x.copper, [[1.05, 0], [1.02, 0.25], [0.9, 0.55], [0.62, 0.95], [0.42, 1.3], [0.34, 1.62], [0.26, 1.75], [0, 1.8]], 0, L, 0, { seg: 16 });
    for (let e = 0; e < 8; e++) {
      const R = e / 8 * E;
      i.tube(Q("gloss"), x.copperDk, [g(Math.cos(R) * 1.05, L + 0.02, Math.sin(R) * 1.05), g(Math.cos(R) * 0.92, L + 0.55, Math.sin(R) * 0.92), g(Math.cos(R) * 0.62, L + 0.97, Math.sin(R) * 0.62), g(Math.cos(R) * 0.4, L + 1.34, Math.sin(R) * 0.4), g(Math.cos(R) * 0.27, L + 1.76, Math.sin(R) * 0.27)], 0.025, { radial: 4 });
    }
    const V = L + 1.72;
    for (let e = 0; e < 6; e++) {
      const R = e / 6 * E;
      i.cyl("paint", NA, 0.035, 0.55, Math.cos(R) * 0.24, V + 0.3, Math.sin(R) * 0.24, { seg: 5 });
    }
    i.lathe(Q("glow"), x.lamp, [[0, 0.02], [0.2, 0.04], [0.2, 0.5], [0, 0.52]], 0, V, 0, { seg: 8, glow: 0.8 }), i.lathe("gloss", x.copper, [[0.34, 0], [0.3, 0.06], [0.14, 0.3], [0.05, 0.42], [0, 0.45]], 0, V + 0.58, 0, { seg: 12 }), i.sph("metal", x.gold, 0.1, 0, V + 1.1, 0, { ws: 10, hs: 7 }), i.cyl("metal", x.ink, 0.02, 1.3, 0, V + 1.5, 0, { seg: 5 });
    for (const e of [0, P]) c(i, "metal", x.ink, 0.7, 0.014, 0.014, 0, V + 1.35, 0, { ry: e });
    i.push(0, V + 1.95, 0, 0.7), i.add("metal", s("vane-ship", () => O([[-0.34, 0], [0.34, 0], [0.42, 0.1], [-0.4, 0.1]], 0.02, 2e-3)), x.gold, 0, 0, 0, { ry: P });
    for (const [e, R] of [[-0.18, 0.42], [0.02, 0.52], [0.2, 0.4]]) c(i, "metal", x.gold, 0.012, 0.012, R, 0, 0.1 + R / 2, e, { sx: 0.012, sy: R, sz: 0.012 }), i.add("metal", s("vane-sail" + R, () => O([[-0.09, 0], [0.09, 0], [0.07, R * 0.7], [-0.07, R * 0.7]], 0.012, 2e-3)), x.gold, 0, 0.14, e, { ry: P });
    i.pop();
  } }, j.tidewater_townhall = { desc: "Town Hall (variant 0) / Custom House (1): blind arcade of glazed doors with fanlights behind the spawn loggia and the east wing walk, pilasters, lanterns; above the 5.2 m wall a two-storey stucco palazzo — giant-order centre pavilion with a pediment carrying the borough crest, the name in bronze letters on the frieze, sash windows with hoods and balconettes, balustraded parapet with urns, slate roof with dormers and chimneys, a flagstaff; building mass behind the wall for outside views. Upper storey collides (camera-safe).", params: {}, variants: 2, mount: "ground", build(i, $) {
    i.aoBase = null;
    const n = ($.variant ?? 0) % 2, d = n ? "#eadfcb" : x.stucco, b = x.trim, K = n ? x.navy : x.ironDk, NA = 5.2, zA = -9.5, L = 22, V = -8.5;
    i.push(0, 2.4, 0);
    for (const m of [-7.2, -3.6, 0, 3.6, 7.2]) sM(i, m, 0, 1.7, 1.75, { door: K, lit: 0.9, key: x.stone });
    for (const m of [-9, -5.4, -1.8, 1.8, 5.4, 9]) WM(i, m, 0, NA - 2.4 - 0.25, 0.42, b, 0.08);
    for (const m of [11.6, 15.2]) bA(i, m, 0.55, 1.1, 1.65, { frame: b, lit: 0.8, key: true });
    i.pop();
    for (const m of [-5.4, -1.8, 1.8, 5.4, 13.4, 17]) c(i, "gloss", x.ironDk, 0.06, 0.4, 0.2, m, 4.25, 0.1), dA(i, m, 3.9, 0.3, 0.8);
    i.add("paint", G("cornTH", MA.cornice, L - zA + 0.2), b, (zA + L) / 2, NA - 0.35, 0, {});
    const e = NA, R = 10.4, y = -0.02;
    i.box("paint", d, L - zA, R - e, 7.5, (zA + L) / 2, (e + R) / 2, y - 3.75, { r: 0.05 }), wA(i, "paint", b, "string", L - zA, (zA + L) / 2, 7.55, y);
    const Y = [-8.1, -6.2, 6.2, 8.1, 11.2, 13.4, 15.6, 17.8, 20];
    for (const m of Y) bA(i, m, 5.85, 0.95, 1.5, { frame: b, hood: m > 10 ? "cornice" : "pediment", lit: 0.7, balconette: m < 10 }), bA(i, m, 8.2, 0.95, 1.2, { frame: b, lit: 0.6 });
    const u = 5.2;
    i.box("paint", d, u * 2, R - e + 1.2, 0.3, 0, (e + R + 1.2) / 2, 0.13, { r: 0.04 });
    for (const m of [-4.9, -1.75, 1.75, 4.9]) WM(i, m, e, R + 0.2, 0.5, b, 0.12);
    for (const m of [-3.3, 0, 3.3]) i.push(0, 0, 0.28), sM(i, m, 5.75, 1.3, 2.3, { lit: 0.75, transom: 0.72 }), i.pop();
    i.push(0, 0, 0.28), c(i, "paint", b, u * 2 + 0.3, 0.7, 0.12, 0, R + 0.55, 0.06), GA(i, n ? "CUSTOM HOUSE" : "TOWN HALL", { h: 0.46, x: 0, y: R + 0.33, z: 0.12, c: x.bronze, mat: "metal", dep: 0.04, bev: 0, wt: 0.17, track: n ? 0.16 : 0.24 }), i.add("paint", G("cornTH2", MA.cornice, u * 2 + 0.5), b, 0, R + 0.9, 0, {});
    const o = R + 1.26, B = 1.9;
    i.add("paint", PA(u * 2 + 0.2, B), d, 0, o, 0.02, {});
    for (const m of [-1, 1]) i.push(m * (u + 0.1) / 2, o + B / 2, 0.1, 0, 0, -m * Math.atan2(B, u + 0.1)), i.box("paint", b, Math.hypot(B, u + 0.1) + 0.35, 0.22, 0.3, 0, 0, 0, { r: 0.03 }), i.pop();
    c(i, "paint", b, u * 2 + 0.4, 0.14, 0.34, 0, o + 0.02, 0.1), i.cyl("gloss", n ? x.navy : x.ironDk, 0.62, 0.06, 0, o + 0.78, 0.06, { rx: P, seg: 24 }), i.tor(Q("metal"), x.gold, 0.64, 0.05, 0, o + 0.78, 0.1, { rs: 4, ts: 28 }), i.push(0, o + 0.78, 0.12), i.add(Q("metal"), s("crest-hull", () => O([[-0.32, -0.12], [0.32, -0.12], [0.42, 0.02], [-0.42, 0.02]], 0.02, 3e-3)), x.gold, 0, -0.05, 0, { ry: P }), c(i, Q("metal"), x.gold, 0.03, 0.5, 0.02, 0, 0.18, 0), i.add(Q("metal"), PA(0.36, 0.42), x.gold, 0.02, -0.02, 5e-3, { rz: -0.1 });
    for (let m = 0; m < 3; m++) i.tube(Q("metal"), x.gold, z(-0.3 + m * 0.2, -0.3, 0.01, 0.1, 0.2, C - 0.2, 6), 0.018, { radial: 3 });
    i.pop();
    for (const m of [-1, 1]) UA(i, m * (u + 0.1), o + 0.1, 0.1, n ? x.yellow : x.coral);
    i.lathe("paint", b, [[0, 0], [0.2, 0], [0.18, 0.3], [0.1, 0.4], [0.14, 0.55], [0, 0.62]], 0, o + B - 0.05, 0.1, { seg: 10 }), i.pop(), i.add("paint", G("cornTH3", MA.cornice, L - zA), b, (zA + L) / 2, R - 0.36, y, {});
    for (const [m, l] of [[zA, -u], [u, L]]) i.push(m, R, 0.1), qA(i, l - m, { h: 0.85, bay: 2.3, col: false, urns: 2, urnC: n ? x.yellow : x.coral, seg: 5 }), i.pop();
    const a = R, H = 7.3;
    i.push((zA + L) / 2, a, y - 0.3 - H / 2), i.add("paint", s("thRoof", () => O([[-H / 2, 0], [H / 2, 0], [0.6, 2.2], [-0.6, 2.2]], 1, 1e-3)), x.slate, 0, 0, 0, { sx: L - zA - 0.4 }), i.pop();
    for (const m of [-7.2, 12.3, 16.7]) i.push(m, a + 0.5, y - 1.3), i.box("paint", d, 0.9, 1, 0.9, 0, 0.5, 0, { r: 0.03 }), i.add("paint", s("dormRoof", () => O([[-0.55, 0], [0.55, 0], [0, 0.45]], 1, 1e-3)), x.slateDk, 0, 1, -0.05, { ry: P }), c(i, Q("gloss"), x.glass, 0.5, 0.6, 0.02, 0, 0.5, 0.455), c(i, Q("paint"), x.white, 0.04, 0.6, 0.03, 0, 0.5, 0.465), i.pop();
    for (const [m, l] of [[-5.6, -4.6], [5.6, -4.6], [19.6, -5], [14, -4.2]]) {
      i.box("paint", d, 1.1, 2, 0.7, m, a + 2.2, y + l, { r: 0.03 }), c(i, "paint", b, 1.24, 0.12, 0.84, m, a + 3.2, y + l);
      for (const _ of [-0.3, 0, 0.3]) i.cyl("paint", x.pot, 0.08, 0.36, m + _, a + 3.44, y + l, { seg: 8 });
    }
    i.cyl("paint", x.white, 0.07, 6.5, 0, o + B + 3.6, -0.3, { seg: 8 }), i.sph("metal", x.gold, 0.11, 0, o + B + 6.9, -0.3, { ws: 8, hs: 6 }), i.flag(0, o + B + 6.65, -0.3, { color: n ? x.navy : x.coral, s: 2.4 }), i.box(Q("paint"), d, L - zA, e + 1.2, 7.9, (zA + L) / 2, (e - 1.2) / 2, y - 4.15, { r: 0.03 }), i.box(Q("paint"), x.stoneDk, L - zA + 2, 2.2, 10, (zA + L) / 2, -1.1, V + 3.5, { r: 0.04 }), i.push(zA - 0.02, 0, (y + V) / 2, -P);
    for (const m of [-2.4, 0, 2.4]) bA(i, m, 1.4, 0.95, 1.5, { frame: b, ns: true }), bA(i, m, 5.9, 0.95, 1.5, { frame: b, ns: true }), bA(i, m, 8.2, 0.95, 1.2, { frame: b, ns: true, key: false });
    i.pop(), i.box(Q("paint"), d, L - zA, R, 0.2, (zA + L) / 2, R / 2, V, { r: 0.03 }), i.box(Q("paint"), d, 0.2, R, -V, L - 0.1, R / 2, V / 2, { r: 0.03 }), i.push((zA + L) / 2, 0, V - 0.1, C);
    for (let m = -14; m <= 14.1; m += 3.5) bA(i, m, 5.9, 0.95, 1.5, { frame: b, ns: true, key: false }), bA(i, m, 1.4, 0.95, 1.5, { frame: b, ns: true, key: false });
    i.pop(), i.col(zA, NA, V, L, R + 1.3, 0.35, { roof: true }), i.col(-u - 0.3, R, V, u + 0.3, o + B, 0.4, { roof: true });
  } };
  function QA(i, $, n, d, b = x.iron) {
    i.box("gloss", b, 0.36, 0.28, 0.36, $, 0.14, n, { r: 0.03 }), i.lathe("gloss", b, [[0.15, 0.28], [0.15, 0.34], [0.115, 0.4], [0.1, 0.48], [0.09, d - 0.55], [0.105, d - 0.5], [0.095, d - 0.44], [0.14, d - 0.32], [0.19, d - 0.2], [0, d - 0.2]], $, 0, n, { seg: 10 });
    for (const K of [0.6, d - 0.62]) i.tor(Q("gloss"), b, 0.098, 0.018, $, K, n, { rx: P, rs: 4, ts: 10 });
    for (let K = 0; K < 4; K++) {
      const NA = K / 4 * E + C / 4;
      c(i, Q("gloss"), b, 0.03, d - 1.4, 0.03, $ + Math.cos(NA) * 0.09, (d + 0.1) / 2, n + Math.sin(NA) * 0.09);
    }
    i.box("gloss", b, 0.42, 0.2, 0.42, $, d - 0.1, n, { r: 0.02 });
  }
  function IA(i, $, n, d = {}) {
    const b = d.c ?? x.navy, K = d.board ?? b, NA = d.lc ?? x.gold, zA = d.h ?? 2.7;
    for (const B of [-1, 1]) c(i, "paint", b, 0.2, zA, 0.1, B * ($ / 2 - 0.1), zA / 2, 0.05), c(i, "paint", I(b, 1.1), 0.26, 0.3, 0.16, B * ($ / 2 - 0.1), zA - 0.02, 0.08);
    const L = 0.95, V = d.doorLeft ? -$ / 2 + 0.2 + L / 2 : $ / 2 - 0.2 - L / 2, e = d.doorLeft ? V + L / 2 : -$ / 2 + 0.2, R = d.doorLeft ? $ / 2 - 0.2 : V - L / 2, y = R - e, Y = (e + R) / 2;
    c(i, "paint", b, y, 0.55, 0.08, Y, 0.275, 0.04), c(i, "paint", I(b, 0.85), y - 0.12, 0.35, 0.02, Y, 0.28, 0.085), c(i, Q("gloss"), x.glass, y, 1.55, 0.02, Y, 1.33, 0.012), d.lit !== false && c(i, Q("glow"), d.glowC ?? x.lamp, y - 0.1, 0.5, 4e-3, Y, 1.72, 0.024, { glow: d.lit ?? 0.7 }), c(i, Q("paint"), b, y, 0.06, 0.05, Y, 0.58, 0.05), c(i, Q("paint"), b, y, 0.07, 0.05, Y, 1.85, 0.05), c(i, Q("paint"), b, y, 0.06, 0.05, Y, 2.1, 0.05);
    const u = Math.max(1, Math.round(y / 0.9));
    for (let B = 1; B < u; B++) c(i, Q("paint"), b, 0.05, 1.55, 0.05, e + B * y / u, 1.33, 0.05);
    for (let B = 1; B < u * 3; B++) c(i, Q("paint"), b, 0.025, 0.25, 0.04, e + B * y / (u * 3), 1.975, 0.045);
    i.box("paint", b, L, 2.05, 0.06, V, 1.025, 0.02, { r: 0.012 }), c(i, Q("gloss"), x.glass, L - 0.24, 0.9, 0.012, V, 1.45, 0.056), c(i, Q("paint"), I(b, 0.85), L - 0.24, 0.55, 0.012, V, 0.48, 0.056), c(i, Q("metal"), x.gold, 0.035, 0.035, 0.08, V + (d.doorLeft ? 0.33 : -0.33), 1, 0.09), c(i, Q("gloss"), x.glass, L, 0.3, 0.012, V, 2.25, 0.012);
    const o = 2.52;
    i.box("paint", K, $ - 0.1, 0.4, 0.1, 0, o, 0.08, { r: 0.02 }), c(i, "paint", I(K, 1.2), $ - 0.1, 0.05, 0.12, 0, o + 0.22, 0.09), n && GA(i, n, { h: d.lh ?? 0.2, x: 0, y: o - (d.lh ?? 0.2) / 2, z: 0.135, c: NA, flat: true, wt: 0.2, track: 0.1, mat: d.glowLetters ? "glow" : "paint", glow: d.glowLetters });
    for (const B of [-1, 1]) i.box("paint", I(K, 1.1), 0.12, 0.44, 0.2, B * ($ / 2 - 0.06), o - 0.04, 0.1, { r: 0.03 });
  }
  function HA(i, $, n, d) {
    if (i.push($, 0, n), d === 0) {
      i.box("wood", x.woodLt, 0.9, 0.9, 0.5, 0, 0.45, 0, { r: 0.02 });
      for (let b = 0; b < 6; b++) {
        const K = [x.red, x.yellow, "#3f7fc1", "#5caa66", x.coral, x.purple][b];
        i.lathe("gloss", K, [[0, 0], [0.08, 0], [0.11, 0.2], [0, 0.2]], -0.32 + b % 3 * 0.32, 0.9, -0.12 + Math.floor(b / 3) * 0.24, { seg: 8 });
      }
      for (let b = 0; b < 4; b++) i.cyl("wood", x.woodLt, 0.012, 0.7, -0.3 + b * 0.2, 1.25, 0.2, { seg: 4, rx: 0.12 }), i.box("gloss", [x.red, "#3f7fc1", x.yellow, "#5caa66"][b], 0.12, 0.16, 0.02, -0.3 + b * 0.2, 1.62, 0.24, { r: 0.01 });
      i.tor("paint", x.yellow, 0.18, 0.05, 0.3, 1.1, 0.26, { rs: 5, ts: 14 }), X(i, 0, 0, 0, 0.9, 0.95, 0.5);
    } else if (d === 1) {
      i.cyl("metal", x.ironDk, 0.02, 1.6, -0.2, 0.8, 0, { seg: 5 });
      for (let b = 0; b < 4; b++) for (let K = 0; K < 4; K++) i.push(-0.2, 0.55 + K * 0.3, 0, b / 4 * E), c(i, Q("paint"), ["#f3e9d2", "#bfe0ea", "#f4d3c4", "#d9ebd0"][(b + K) % 4], 0.22, 0.15, 0.01, 0, 0, 0.12, { rx: -0.1 }), i.pop();
      i.lathe("wood", x.wood, [[0, 0], [0.26, 0], [0.29, 0.3], [0.27, 0.62], [0, 0.62]], 0.35, 0, 0, { seg: 10 });
      for (let b = 0; b < 9; b++) {
        const K = b / 9 * E;
        i.cyl(Q("gloss"), b % 2 ? "#f07fa8" : x.white, 0.022, 0.4, 0.35 + Math.cos(K) * 0.13, 0.78, Math.sin(K) * 0.13, { seg: 5, rz: Math.cos(K) * 0.2, rx: -Math.sin(K) * 0.2 });
      }
      X(i, 0.05, 0, 0, 0.9, 0.8, 0.6);
    } else if (d === 2) {
      i.box("wood", x.wood, 1.1, 0.72, 0.6, 0, 0.36, 0, { r: 0.02 }), i.box("paint", x.white, 1.02, 0.02, 0.52, 0, 0.73, 0, { r: 5e-3 });
      for (let b = 0; b < 14; b++) i.cyl(Q("gloss"), b % 3 === 0 ? "#f07fa8" : b % 3 === 1 ? x.white : "#e25555", 0.022, 0.48, -0.44 + b % 7 * 0.145, 0.76, -0.12 + Math.floor(b / 7) * 0.2, { rz: P, seg: 5, ry: 0.05 * (b % 3) });
      c(i, "paint", "#fbf1d8", 0.36, 0.24, 0.02, 0.2, 0.95, -0.25, { rx: -0.3 }), X(i, 0, 0, 0, 1.1, 0.8, 0.6);
    } else {
      i.box("paint", x.red, 0.7, 1.1, 0.45, 0, 0.55, 0, { r: 0.03 });
      for (let b = 0; b < 3; b++) c(i, Q("paint"), ["#fbeecf", "#d7e6f2", "#fbe0d0"][b], 0.6, 0.02, 0.3, 0, 0.35 + b * 0.3, 0.12, { rx: -0.35 });
      i.box(("glass" in x, "gloss"), x.glassLt, 0.62, 0.3, 0.02, 0, 1.25, -0.2, { r: 0.01 }), X(i, 0, 0, 0, 0.7, 1.1, 0.45);
    }
    i.blob(1.1, 0.8), i.pop();
  }
  const FA = VC(Jj.front, -Jj.deck), DM = Jj.deck, RA = Jj.deckBot, EM = Jj.deckTop, OM = Jj.deck + Jj.shops, rM = (i, $) => p(i, $.q0[0], 0, $.q0[1], $.h * C / 180), HM = (i, $) => {
    const n = Jj.front[$], d = Jj.front[$ + 1];
    return [(n[0] - i.q0[0]) * i.d[0] + (n[1] - i.q0[1]) * i.d[1], (d[0] - i.q0[0]) * i.d[0] + (d[1] - i.q0[1]) * i.d[1]];
  };
  j.tidewater_colonnade = { desc: "The Crescent’s cast-iron colonnade (site piece, pos = world origin, Alpha half; mirrored copy dresses Bravo’s): fluted sea-green columns (collide) at every bay and bend of the three bent sections, elliptical arches with pierced spandrels, the frieze on the terrace-walk edge, transverse girders + pendant lanterns, the walk railing (visual; the layout carries the rail collision), the landing pier, the mid stair’s handrail (rail collision), the open end’s stone piers.", params: {}, variants: 1, mount: "ground", build(i, $) {
    const n = x.iron;
    FA.forEach((V, e) => {
      const R = V.len, y = Math.max(1, Math.round(R / 3.4)), Y = Array.from({ length: y + 1 }, (u, o) => o * R / y);
      rM(i, V), Y.forEach((u, o) => {
        o === y && e < FA.length - 1 || e === 0 && o === 0 || (QA(i, 0.2, u, RA - 0.02, n), X(i, 0.2, 0, u, 0.36, RA, 0.36, { roof: true }));
      });
      for (let u = 0; u < y; u++) {
        const o = Y[u] + 0.2, B = Y[u + 1] - 0.2, a = (o + B) / 2, H = (B - o) / 2, m = [];
        for (let l = 0; l <= 12; l++) {
          const _ = l / 12 * C;
          m.push(g(0.2, RA - 0.57 + Math.sin(_) * 0.46, a - Math.cos(_) * H));
        }
        e === 0 && u === 0 || (i.tube("gloss", n, m, 0.045, { radial: 5 }), i.tube(Q("gloss"), n, m.map((l) => g(l[0], l[1] + 0.07, l[2])), 0.018, { radial: 4 }));
        for (const l of [-1, 1]) i.tor(Q("gloss"), n, 0.13, 0.016, 0.2, RA - 0.23, a + l * H * 0.62, { ry: P, rs: 3, ts: 12 }), i.sph(Q("gloss"), x.gold, 0.035, 0.2, RA - 0.23, a + l * H * 0.62, { ws: 6, hs: 4 });
        c(i, "gloss", n, 0.06, 0.08, B - o + 0.4, 0.2, RA - 0.04, a), c(i, "gloss", n, DM - 0.2, 0.12, 0.12, (DM + 0.2) / 2, RA - 0.06, Y[u]), i.cyl(Q("metal"), x.ironDk, 8e-3, 0.36, 2.2, RA - 0.18, a, { seg: 4 }), dA(i, 2.2, RA - 0.95, a, 0.8);
      }
      c(i, "gloss", n, 0.03, 0.34, R, -0.015, RA + 0.17, R / 2);
      for (let u = 0.35; u < R - 0.2; u += 0.7) i.tor(Q("gloss"), x.ironLt, 0.1, 0.016, -0.04, RA + 0.17, u, { ry: P, rs: 3, ts: 10 }), i.sph(Q("gloss"), x.gold, 0.025, -0.04, RA + 0.17, u, { ws: 5, hs: 3 });
      for (let u = 0.12; u < R; u += 0.24) c(i, Q("gloss"), n, 0.02, 0.1, 0.1, -0.01, RA - 0.03, u, { rx: C / 4 });
      e < 2 && (p(i, 0.08, EM, 0, 0), i.push(0, 0, 0, -P), zM(i, R, { h: 1, col: false, p0: e === 0 }), i.pop(), f(i)), f(i);
    });
    const d = MN.x[0], b = MN.x[1], K = MN.landing, NA = MN.top, zA = MN.foot;
    p(i, d, EM, K + 0.08, 0), zM(i, b - d, { h: 1, col: false }), f(i), c(i, "gloss", n, 0.03, 0.34, NA - K, d - 0.015, RA + 0.17, (K + NA) / 2), p(i, d, 0, (K + NA) / 2, -P), i.add("paint", G("plinthLd", MA.plinth, NA - K), I(x.stone, 0.9), 0, 0, 0, {});
    for (const V of [-1, 1]) cA(i, V * ((NA - K) / 2 - 0.01), 0.35, RA - 0.1, V, "#c9c2b2");
    f(i), vA(i, d + 0.2, EM, NA - 0.2);
    {
      const e = d - 0.08;
      for (let y = 0; y <= 7; y++) {
        const Y = y / 7, u = zA + Y * (NA - zA), o = Y * EM;
        i.lathe("gloss", n, [[0, 0], [0.05, 0], [0.035, 0.08], [0.03, 1], [0.04, 1.04], [0, 1.08]], e, o, u, { seg: 6 });
      }
      i.tube("gloss", n, [g(e, 1.02, zA), g(e, EM + 1.02, NA)], 0.03, { radial: 6 }), i.tube(Q("gloss"), n, [g(e, 0.55, zA), g(e, EM + 0.55, NA)], 0.016, { radial: 4 });
      for (let y = 0; y < 24; y++) {
        const Y = (y + 0.5) / 24, u = zA + Y * (NA - zA), o = Y * EM;
        i.cyl(Q("gloss"), n, 8e-3, 0.9, e, o + 0.55, u, { seg: 4 });
      }
      const R = 8;
      for (let y = 0; y < R; y++) {
        const Y = y / R, u = (y + 1) / R, o = zA + Y * (NA - zA), B = zA + u * (NA - zA);
        h(i, e - 0.1, 0, Math.min(o, B), d + 0.02, u * EM + 1.12, Math.max(o, B), { rail: true });
      }
      i.lathe("gloss", n, [[0, 0], [0.14, 0], [0.14, 0.1], [0.08, 0.2], [0.07, 1.2], [0.1, 1.28], [0, 1.3]], e, 0, zA + 0.25, { seg: 8 }), dA(i, e, 1.3, zA + 0.25, 1);
    }
    const L = Jj.front[Jj.front.length - 1];
    for (const V of [L[0] - DM + 0.25, L[0] - 0.25]) i.box("paint", x.stone, 0.42, 1, 0.42, V, EM + 0.5, L[1] - 0.25, { r: 0.03 }), c(i, "paint", x.trim, 0.5, 0.08, 0.5, V, EM + 1.04, L[1] - 0.25), UA(i, V, EM + 1.08, L[1] - 0.25, x.coral), X(i, V, EM, L[1] - 0.25, 0.42, 1, 0.42, { roof: true });
  } };
  function PM(i, $, n, d, b, K, NA = {}) {
    i.box("paint", K, d, 0.3, 0.55, $, n - 0.15, 0.55 / 2, { r: 0.03 }), i.box("paint", K, d + 0.1, 0.25, 0.55 + 0.08, $, n + b + 0.12, 0.55 / 2, { r: 0.03 }), c(i, "paint", x.lead, d + 0.14, 0.12, 0.55 + 0.12, $, n + b + 0.3, 0.55 / 2), c(i, Q("gloss"), x.glass, d - 0.45 * 1.2, b, 0.02, $, n + b / 2, 0.55 - 0.02);
    for (const V of [-1, 1]) i.push($ + V * (d / 2 - 0.45 * 0.35), n + b / 2, 0.55 / 2, V * 0.9), c(i, Q("gloss"), x.glass, 0.45, b, 0.02, 0, 0, 0), i.pop();
    for (const V of [-1, 1, -0.33, 0.33]) c(i, "paint", x.white, 0.07, b, 0.07, $ + V * (d / 2 - 0.45 * 0.6), n + b / 2, 0.55 - 0.02);
    c(i, Q("paint"), x.white, d - 0.2, 0.05, 0.55, $, n + b * 0.62, 0.55 / 2 - 0.02), NA.lit && c(i, Q("glow"), x.lamp, d - 0.45 * 1.4, b * 0.25, 4e-3, $, n + b * 0.84, 0.55 - 5e-3, { glow: NA.lit });
  }
  const uM = [["PENNY ARCADE", "#7a3b67", x.yellow, { glowLetters: 1.4, glowC: "#ffd27a", lit: 1.2 }], ["ROCK SHOP", "#e8a7b8", "#8a2f52", {}], ["FISH & CHIPS", "#2f5d8a", x.white, {}], ["POST OFFICE", "#b8342c", x.gold, {}], ["ICES & TEAS", "#5f9f8c", x.white, { doorLeft: true }], ["BUCKETS & SPADES", x.yellow, x.navy, { lh: 0.17 }], ["SEASIDE GIFTS", "#6b7fb3", x.white, { doorLeft: true }], ["SWEETS", "#c97a9a", x.white, {}], ["THE ANCHOR", "#2f4a3a", x.gold, { lit: 0.9 }]];
  j.tidewater_arcadefront = { desc: "The Crescent’s frontage (site piece, pos = world origin, Alpha half): nine shopfronts on the covered walk (PENNY ARCADE … THE ANCHOR) with wares out front (small cover, collides) and blade signs, then above the terrace walk the three buildings of the bent terrace: seaside houses with bay windows, the GRAND HOTEL (glazed canopy, parapet, roof letters), a turreted corner house at the mid end; slate roofs, chimneys, dormers, the sea-side backs.", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.aoBase = null;
    let n = 0;
    FA.forEach((d, b) => {
      const [K, NA] = HM(d, b), zA = NA - K, L = 3;
      rM(i, d);
      for (let V = 0; V < L; V++) {
        const e = K + zA * (V + 0.5) / L, [R, y, Y, u] = uM[n++ % uM.length];
        if (p(i, DM, 0, e, -P), IA(i, zA / L - 0.12, R, { c: y, lc: Y, ...u }), f(i), !(b === 1 && V === 0) && !(b === 2 && V === 2) && HA(i, DM - 0.65, e + (u.doorLeft ? 0.7 : -0.7), (n + b) % 4), V < L - 1 && (V + b) % 2 === 0) {
          const o = K + zA * (V + 1) / L, [B, a, H] = [["ROCK", "#e8a7b8", x.navy], ["POST", "#b8342c", x.gold], ["GIFTS", "#6b7fb3", x.white], ["ALES", "#2f4a3a", x.gold]][(b + V) % 4];
          i.box("paint", a, 0.05, 0.42, 0.8, DM - 0.75, 2.55, o, { r: 0.02 }), c(i, "metal", x.ironDk, 0.75, 0.03, 0.03, DM - 0.4, 2.8, o), i.tube(Q("metal"), x.ironDk, [g(DM - 0.05, 2.55, o), g(DM - 0.3, 2.78, o)], 0.012, { radial: 3 });
          for (const m of [1, -1]) i.push(DM - 0.75 + m * 0.03, 2.5, o, m * P), GA(i, B, { h: 0.13, x: 0, y: -0.02, z: 1e-3, c: H, flat: true, wt: 0.22, track: 0.1 }), i.pop();
        }
      }
      if (p(i, DM, EM - 3.2, K, -P), b === 0) {
        const V = x.pink, e = 3.9 + 3.2;
        for (const R of [zA / 6, zA / 2, 5 * zA / 6]) sM(i, R, 3.2, 1, 1.55, { door: "#3f6d64", lit: 0.8 }), PM(i, R, 5, 1.5, 1.4, V, { lit: 0.7 });
        i.add("paint", G("cornA" + zA.toFixed(2), MA.cornice, zA + 0.2), x.trim, zA / 2, e - 0.36, 0, {});
        for (const R of [0.15, zA / 3, 2 * zA / 3, zA - 0.15]) c(i, "paint", x.trim, 0.22, e - 3.3, 0.06, R, 3.2 + (e - 3.3) / 2, 0.03);
        i.push(zA / 2, e, -1.5), i.add("paint", s("roofA" + zA.toFixed(2), () => O([[-1.6, 0], [1.6, 0], [0, 1.6]], 1, 1e-3)), x.slate, 0, 0, 0, { sx: zA + 0.3 }), i.pop();
        for (const R of [zA / 6, zA / 2, 5 * zA / 6]) {
          i.box("paint", V, 0.8, 1.6, 0.6, R - 0.8, e + 1.3, -1.5, { r: 0.03 }), c(i, "paint", x.trim, 0.9, 0.1, 0.7, R - 0.8, e + 2.1, -1.5);
          for (const y of [-0.2, 0.2]) i.cyl("paint", x.pot, 0.07, 0.3, R - 0.8 + y, e + 2.3, -1.5, { seg: 6 });
        }
        for (const R of [zA / 3 + 0.6, 2 * zA / 3 + 0.6]) i.push(R, e + 0.1, -0.6), i.box("paint", V, 0.9, 0.9, 0.8, 0, 0.45, 0, { r: 0.03 }), i.add("paint", s("dormA", () => O([[-0.55, 0], [0.55, 0], [0, 0.45]], 1, 1e-3)), x.slateDk, 0, 0.9, 0, { ry: P }), c(i, Q("gloss"), x.glass, 0.5, 0.55, 0.02, 0, 0.45, 0.405), i.pop();
      } else if (b === 1) {
        const e = zA / 2;
        i.box("gloss", x.ironDk, zA - 0.6, 0.12, 1.5, e, 5.45, 0.75, { r: 0.03 }), c(i, Q("gloss"), x.glassLt, zA - 0.8, 0.03, 1.4, e, 5.53, 0.75);
        for (let R = 0.5; R <= zA - 0.49; R += (zA - 1) / 7) i.tube("gloss", x.ironDk, [g(R, 4.45, 0.02), g(R, 4.9, 0.4), g(R, 5.4, 1.4)], 0.025, { radial: 4 });
        for (let R = 0.4; R <= zA - 0.39; R += 0.3) c(i, Q("gloss"), x.ironDk, 0.02, 0.18, 0.02, R, 5.33, 1.5);
        GA(i, "GRAND HOTEL", { h: 0.34, x: e, y: 5.62, z: 1.46, c: x.gold, mat: "gloss", dep: 0.05, bev: 0, wt: 0.18, track: 0.14, lit: 1.1, litC: "#ffdca0" });
        for (const R of [e - 3.6, e - 1.2, e + 1.2, e + 3.6]) sM(i, R, 3.2, 1.1, 1.75, { door: "#5a3a2a", lit: 0.9 });
        for (const R of [e - 4.2, e - 2.5, e - 0.85, e + 0.85, e + 2.5, e + 4.2]) bA(i, R, 6, 0.85, 1.2, { frame: x.trim, hood: "segment", lit: 0.6, balconette: true }), bA(i, R, 7.55, 0.85, 0.9, { frame: x.trim, lit: 0.5, key: false });
        i.add("paint", G("cornB" + zA.toFixed(2), MA.cornice, zA + 0.2), x.trim, e, 8.7 - 0.36, 0, {}), i.push(0.1, 8.7, 0.1), qA(i, zA - 0.2, { h: 0.8, bay: 2.4, col: false, urns: 2, urnC: x.coral, seg: 5 }), i.pop(), i.push(e, 8.7 + 1, -1.2);
        for (const R of [-3.9, -1.3, 1.3, 3.9]) c(i, "metal", x.ironDk, 0.08, 1.6, 0.08, R, 0.4, -0.1), i.tube(Q("metal"), x.ironDk, [g(R, -0.4, -0.9), g(R, 1, -0.1)], 0.02, { radial: 3 });
        c(i, "metal", x.ironDk, 8.8, 0.06, 0.06, 0, 0.1, -0.1), GA(i, "GRAND HOTEL", { h: 0.85, x: 0, y: 0.15, z: -0.05, c: "#b23a48", mat: "gloss", dep: 0.1, bev: 0, wt: 0.17, track: 0.08, lit: 1.3, litC: "#ff8f7a" }), i.pop(), i.push(e, 8.7, -1.5), i.add("paint", s("roofB" + zA.toFixed(2), () => O([[-1.6, 0], [1.6, 0], [0.5, 1.4], [-0.5, 1.4]], 1, 1e-3)), x.slate, 0, 0, 0, { sx: zA + 0.2 }), i.pop();
        for (const R of [0.6, zA - 0.6]) i.cyl("paint", x.white, 0.05, 3.2, R, 8.7 + 1.6, 0.1, { seg: 6 }), i.flag(R, 8.7 + 3, 0.1, { color: R < e ? x.navy : x.coral, s: 1.5, ry: -P });
      } else {
        const V = x.mint, e = 3.5 + 3.2;
        for (const Y of [zA * 0.17, zA * 0.47, zA * 0.72]) sM(i, Y, 3.2, 1.1, 1.6, { door: "#7a4a3a", lit: 0.8 }), bA(i, Y, 5.05, 0.9, 1.2, { frame: x.trim, hood: "cornice", lit: 0.6 });
        i.add("paint", G("cornC" + zA.toFixed(2), MA.cornice, zA + 0.2), x.trim, zA / 2, e - 0.36, 0, {}), i.push(zA / 2 - 1, e, -1.5), i.add("paint", s("roofC" + zA.toFixed(2), () => O([[-1.6, 0], [1.6, 0], [0, 1.5]], 1, 1e-3)), x.slate, 0, 0, 0, { sx: zA - 1.8 }), i.pop();
        const R = zA - 1.15, y = -1.45;
        i.lathe("paint", V, [[1.25, 3.2], [1.25, e + 1.6], [0, e + 1.6]], R, 0, y, { seg: 8, ry: C / 8 });
        for (let Y = 0; Y < 8; Y++) {
          const u = Y / 8 * E + C / 8;
          Math.sin(u) < -0.3 || (i.push(R + Math.cos(u) * 1.16, 0, y + Math.sin(u) * 1.16, P - u), bA(i, 0, 5.3, 0.55, 1.1, { frame: x.trim, lit: 0.6, key: false }), bA(i, 0, 7.1, 0.5, 0.8, { frame: x.trim, lit: 0.5, key: false }), i.pop());
        }
        i.lathe("paint", x.trim, [[1.38, 0], [1.38, 0.2], [1.3, 0.24], [0, 0.24]], R, e + 1.6, y, { seg: 8, ry: C / 8 }), i.lathe("paint", x.slate, [[1.42, 0], [1.1, 0.5], [0.5, 1.8], [0.12, 2.8], [0, 2.9]], R, e + 1.84, y, { seg: 8, ry: C / 8 }), i.sph("metal", x.gold, 0.1, R, e + 4.8, y, { ws: 8, hs: 6 }), i.cyl("metal", x.ink, 0.02, 0.8, R, e + 5.1, y, { seg: 4 }), h(i, R - 1.3, 3.2, y - 1.3, R + 1.3, e + 1.6, y + 1.3, { roof: true });
      }
      f(i), p(i, OM, 0, (K + NA) / 2, P);
      for (let V = -zA / 2 + 1.4; V <= zA / 2 - 1.3; V += 2.6) bA(i, V, 1, 0.9, 1.3, { frame: x.trim, ns: true, key: false }), bA(i, V, 4.6, 0.9, 1.3, { frame: x.trim, ns: true, key: false });
      f(i), f(i);
    }), i.push(21.45, 5.4, -41.85), i.lathe("paint", x.slate, [[5.05, 0], [2.6, 1.6], [0, 1.7]], 0, 0, 0, { seg: 4, ry: C / 4 }), i.box("paint", x.pink, 0.8, 1.4, 0.6, 1.6, 1.3, 1.2, { r: 0.03 }), i.pop();
  } }, j.tidewater_bandstand = { desc: "Victorian bandstand dressing for the octagonal 1 m stage (pos = stage centre at ground level, R 3.8): eight sea-green cast-iron columns (collide), railings on the six step-less faces (collide), fretwork frieze, cream + coral ogee roof with cresting, cupola lantern and lyre vane, music stands and chairs, pendant lanterns; cast-iron grilles on the plinth faces.", params: { R: "circumradius (3.8)" }, variants: 1, mount: "ground", build(i, $) {
    const n = $.R ?? 3.8, d = n * Math.cos(C / 8), b = x.iron, K = 1, NA = 4.1, zA = n - 0.28, L = (R, y = zA) => {
      const Y = C / 8 + R * C / 4;
      return [Math.cos(Y) * y, Math.sin(Y) * y];
    };
    for (let R = 0; R < 8; R++) {
      const y = R * C / 4, Y = Math.cos(y) * d, u = Math.sin(y) * d;
      if (!(Math.abs(Math.sin(y)) > 0.99)) {
        i.push(Y, 0, u, P - y), i.add(Q("paint"), W(0.7, 0.4, 8), x.ironDk, 0, 0.18, 0.012, {});
        for (let o = -2; o <= 2; o++) c(i, Q("gloss"), b, 0.025, 0.72, 0.03, o * 0.13, 0.52, 0.03);
        c(i, "paint", x.trim, 2.6, 0.08, 0.12, 0, K - 0.04, 0.06), i.pop();
      }
    }
    for (let R = 0; R < 8; R++) {
      const [y, Y] = L(R);
      i.lathe("gloss", b, [[0, 0], [0.12, 0], [0.12, 0.08], [0.08, 0.14], [0.065, 0.2], [0.055, NA - K - 0.35], [0.07, NA - K - 0.3], [0.12, NA - K - 0.12], [0, NA - K - 0.12]], y, K, Y, { seg: 8 }), i.tor(Q("gloss"), x.gold, 0.065, 0.014, y, K + 0.5, Y, { rx: P, rs: 3, ts: 8 }), X(i, y, K, Y, 0.24, NA - K, 0.24, { roof: true });
      const [u, o] = L(R + 1), B = (y + u) / 2, a = (Y + o) / 2, H = [];
      for (let m = 0; m <= 8; m++) {
        const l = m / 8;
        H.push(g(y + (u - y) * l, NA - 0.12 - 0.4 * (1 - Math.sin(l * C)), Y + (o - Y) * l));
      }
      i.tube("gloss", b, H, 0.03, { radial: 4 }), i.tor(Q("gloss"), b, 0.14, 0.015, B, NA - 0.3, a, { ry: -Math.atan2(o - Y, u - y), rs: 3, ts: 12 });
      for (let m = 1; m < 6; m++) {
        const l = m / 6;
        c(i, Q("gloss"), b, 0.02, 0.14, 0.02, y + (u - y) * l, NA - 0.2, Y + (o - Y) * l);
      }
    }
    for (let R = 0; R < 8; R++) {
      const y = R * C / 4;
      if (Math.abs(Math.sin(y)) > 0.99) continue;
      const [Y, u] = L(R - 1, n - 0.28), [o, B] = L(R, n - 0.28), a = Math.hypot(o - Y, B - u), H = Math.atan2(B - u, o - Y);
      i.push(Y, K, u, -H), i.cyl("gloss", b, 0.025, a, a / 2, 0.85, 0, { rz: P, seg: 6, open: true }), i.cyl(Q("gloss"), b, 0.016, a, a / 2, 0.12, 0, { rz: P, seg: 5, open: true });
      for (let l = 1; l < 12; l++) i.cyl(Q("gloss"), b, 9e-3, 0.72, l * a / 12, 0.48, 0, { seg: 4, open: true });
      for (let l = 0; l < 3; l++) i.tor(Q("gloss"), b, 0.16, 0.012, a * (l + 1) / 4, 0.48, 0, { rs: 3, ts: 12 });
      i.pop();
      const m = Math.abs(Math.cos(y)) > 0.99 ? 1 : 3;
      for (let l = 0; l < m; l++) {
        const _ = (l + 0.5) / m, OA = Y + (o - Y) * _, yA = u + (B - u) * _, EA = m === 1 ? 0.12 : Math.abs(o - Y) / m + 0.1, CA = m === 1 ? a : Math.abs(B - u) / m + 0.1;
        X(i, OA, K, yA, EA, 0.92, CA, { rail: true });
      }
    }
    const V = NA;
    i.lathe("paint", x.trim, [[n + 0.25, 0], [n + 0.25, 0.3], [n + 0.1, 0.32], [0, 0.32]], 0, V, 0, { seg: 8, ry: C / 8 });
    for (let R = 0; R < 8; R++) {
      const y = C / 8 + R * C / 4;
      for (let Y = 0; Y < 7; Y++) {
        const u = y + ((Y + 0.5) / 7 - 0.5) * (C / 4) * 0.92;
        c(i, Q("paint"), x.coral, 0.1, 0.12, 0.03, Math.cos(u) * (n + 0.2), V - 0.05, Math.sin(u) * (n + 0.2), { ry: -u + P });
      }
    }
    i.lathe("paint", x.stucco, [[n + 0.15, 0], [n - 0.2, 0.25], [n * 0.72, 0.9], [n * 0.42, 1.5], [n * 0.2, 1.95], [0.5, 2.05], [0, 2.08]], 0, V + 0.32, 0, { seg: 8, ry: C / 8 });
    for (let R = 0; R < 8; R++) {
      const y = C / 8 + R * C / 4, Y = Math.cos(y), u = Math.sin(y);
      i.tube("gloss", x.coral, [[n + 0.15, 0], [n - 0.2, 0.25], [n * 0.72, 0.9], [n * 0.42, 1.5], [n * 0.2, 1.95], [0.5, 2.05]].map(([o, B]) => g(Y * (o + 0.03), V + 0.33 + B, u * (o + 0.03))), 0.05, { radial: 4 });
    }
    i.lathe("paint", x.ironDk, [[0, 0], [n * 0.95, 0], [n * 0.95, 0.02], [0, 0.02]], 0, V - 0.01, 0, { seg: 8, ry: C / 8 }), h(i, -2.7, V, -2.7, 2.7, V + 2.3, 2.7, { roof: true });
    const e = V + 2.35;
    for (let R = 0; R < 6; R++) {
      const y = R / 6 * E;
      i.cyl("gloss", b, 0.03, 0.6, Math.cos(y) * 0.42, e + 0.3, Math.sin(y) * 0.42, { seg: 5 });
    }
    i.lathe(Q("glow"), x.lamp, [[0, 0], [0.36, 0.02], [0.36, 0.55], [0, 0.57]], 0, e, 0, { seg: 6, glow: 0.7 }), i.lathe("paint", x.coral, [[0.62, 0], [0.5, 0.12], [0.2, 0.4], [0.06, 0.6], [0, 0.66]], 0, e + 0.6, 0, { seg: 6 }), i.sph("metal", x.gold, 0.08, 0, e + 1.3, 0, { ws: 8, hs: 6 }), i.cyl("metal", x.ink, 0.018, 0.9, 0, e + 1.65, 0, { seg: 4 }), i.push(0, e + 1.9, 0, 0.5), i.tube("metal", x.gold, [g(-0.18, 0, 0), g(-0.22, 0.2, 0), g(-0.14, 0.4, 0), g(0, 0.46, 0), g(0.14, 0.4, 0), g(0.22, 0.2, 0), g(0.18, 0, 0)], 0.018, { radial: 4 });
    for (let R = -1; R <= 1; R++) c(i, "metal", x.gold, 8e-3, 0.36, 8e-3, R * 0.06, 0.2, 0);
    i.pop();
    for (let R = 0; R < 8; R += 2) {
      const [y, Y] = L(R, 2.2);
      i.cyl(Q("metal"), x.ironDk, 8e-3, 0.6, y, V - 0.3, Y, { seg: 4 }), dA(i, y, V - 1.2, Y, 0.75);
    }
    for (let R = 0; R < 7; R++) {
      const y = -C * 0.1 + R / 6 * C * 1.2 + P, Y = 1.9, u = Math.cos(y) * Y, o = Math.sin(y) * Y * 0.9;
      if (!(Math.abs(u) < 1.4)) {
        i.push(u, K, o, -y - P), c(i, "wood", x.wood, 0.4, 0.04, 0.4, 0, 0.45, 0);
        for (const [B, a] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c(i, Q("wood"), x.wood, 0.03, 0.45, 0.03, B * 0.17, 0.22, a * 0.17);
        c(i, Q("wood"), x.wood, 0.4, 0.4, 0.03, 0, 0.7, -0.19), i.cyl(Q("metal"), x.ink, 0.01, 1, 0, 0.5, 0.45, { seg: 4 }), c(i, Q("metal"), x.ink, 0.4, 0.28, 0.01, 0, 1.05, 0.45, { rx: -0.35 }), c(i, Q("paint"), x.white, 0.34, 0.22, 4e-3, 0, 1.06, 0.458, { rx: -0.35 }), i.pop();
      }
    }
    i.lathe("metal", x.copper, [[0, 0], [0.3, 0.05], [0.36, 0.3], [0.36, 0.55], [0, 0.55]], 1.1, K, 1.9, { seg: 12 }), i.cyl("paint", x.coral, 0.34, 0.28, 1.6, K + 0.4, 1.5, { rx: P, rz: 0.5, seg: 14 }), i.blob(8.5, 8.5);
  } }, j.tidewater_fountain = { desc: "Town Hall Square fountain (pos = centre): granite basin 4.8 m across (0.34 m kerb, walk-over), water, a tiered cast-iron fountain — dolphin pedestal, scalloped lower bowl, upper bowl, gilt ship finial — with falling water; the pedestal + lower bowl collide (cover).", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.lathe("paint", x.granite, [[2.4 - 0.34, 0.33], [2.4 - 0.3, 0.36], [2.4 - 0.02, 0.36], [2.4 + 0.02, 0.3], [2.4 + 0.04, 0.05], [2.4 + 0.1, 0], [0, 0]], 0, 0, 0, { seg: 24 }), i.lathe("paint", I(x.granite, 0.8), [[0, 0.05], [2.4 - 0.33, 0.05], [2.4 - 0.33, 0.3]], 0, 0, 0, { seg: 24 }), i.lathe(Q("gloss"), "#6fb3b8", [[0, 0.26], [2.4 - 0.32, 0.26]], 0, 0, 0, { seg: 24 });
    for (let d = 0; d < 16; d++) {
      const b = d / 16 * E, K = 2.25;
      X(i, Math.cos(b) * K, 0, Math.sin(b) * K, 0.5, 0.34, 0.5);
    }
    i.lathe("paint", x.granite, [[0, 0.26], [0.7, 0.26], [0.7, 0.5], [0.6, 0.56], [0.5, 0.56], [0, 0.56]], 0, 0, 0, { seg: 12 }), i.lathe("gloss", x.iron, [[0, 0.56], [0.3, 0.56], [0.26, 0.7], [0.18, 0.9], [0.16, 1.3], [0.22, 1.45], [0, 1.45]], 0, 0, 0, { seg: 12 });
    for (let d = 0; d < 3; d++) {
      const b = d / 3 * E + 0.5, K = [];
      for (let V = 0; V <= 10; V++) {
        const e = V / 10;
        K.push(g(Math.cos(b + e * 0.9) * (0.2 + 0.3 * Math.sin(e * C)), 0.62 + e * 0.85, Math.sin(b + e * 0.9) * (0.2 + 0.3 * Math.sin(e * C))));
      }
      i.add("gloss", s("fdolph" + d, () => w(K, (V) => 0.02 + 0.09 * Math.pow(Math.sin(C * Math.min(1, 0.15 + V)), 0.8), 7)), x.ironLt, 0, 0, 0, {});
      const NA = K[0];
      i.sph("gloss", x.ironLt, 0.08, NA[0], NA[1], NA[2], { ws: 6, hs: 5 });
      const zA = Math.cos(b) * 1.35, L = Math.sin(b) * 1.35;
      i.tube(Q("gloss"), "#cfeef0", [g(NA[0] * 1.2, NA[1] + 0.02, NA[2] * 1.2), g(NA[0] * 2 + zA * 0.3, NA[1] + 0.2, NA[2] * 2 + L * 0.3), g(zA, 0.28, L)], 0.035, { radial: 5 });
    }
    i.lathe("gloss", x.iron, [[0, 1.4], [0.4, 1.42], [1.05, 1.55], [1.15, 1.68], [1.08, 1.7], [0.3, 1.6], [0, 1.6]], 0, 0, 0, { seg: 16 });
    for (let d = 0; d < 16; d++) {
      const b = d / 16 * E;
      i.sph(Q("gloss"), x.ironLt, 0.06, Math.cos(b) * 1.12, 1.66, Math.sin(b) * 1.12, { ws: 5, hs: 4 });
    }
    i.lathe(Q("gloss"), "#8cc9cc", [[0, 1.62], [1.02, 1.62]], 0, 0, 0, { seg: 16 }), i.lathe(Q("gloss"), "#d8f2f2", [[1.17, 1.66], [1.24, 1.4], [1.3, 0.9], [1.34, 0.3]], 0, 0, 0, { seg: 16, open: true }), i.lathe("gloss", x.iron, [[0, 1.6], [0.12, 1.6], [0.1, 2], [0.16, 2.2], [0, 2.2]], 0, 0, 0, { seg: 10 }), i.lathe("gloss", x.iron, [[0, 2.15], [0.5, 2.22], [0.58, 2.34], [0.2, 2.3], [0, 2.3]], 0, 0, 0, { seg: 12 }), i.lathe(Q("gloss"), "#d8f2f2", [[0.58, 2.33], [0.62, 2.1], [0.66, 1.8]], 0, 0, 0, { seg: 12, open: true }), i.lathe("metal", x.gold, [[0, 2.3], [0.08, 2.32], [0.06, 2.5], [0.1, 2.56], [0, 2.6]], 0, 0, 0, { seg: 8 }), i.push(0, 2.6, 0, 0.4), i.add("metal", s("fship", () => O([[-0.22, 0], [0.22, 0], [0.28, 0.08], [-0.26, 0.08]], 0.05, 4e-3)), x.gold, 0, 0, 0, { ry: P }), c(i, "metal", x.gold, 0.02, 0.36, 0.02, 0, 0.26, 0), i.add("metal", PA(0.24, 0.28), x.gold, 0, 0.12, 0.012, {}), i.pop(), i.tube(Q("gloss"), "#e4f6f6", [g(0, 2.62, 0), g(0.05, 3, 0), g(0.1, 3.2, 0.05)], 0.03, { radial: 4 }), X(i, 0, 0, 0, 1.3, 1.45, 1.3, { roof: true }), X(i, 0, 1.45, 0, 2.1, 0.3, 2.1, { roof: true }), X(i, 0, 1.75, 0, 0.4, 0.85, 0.4, { roof: true }), i.blob(5.6, 5.6);
  } }, j.tidewater_shelter = { desc: "Cross-plan promenade shelter over the 5 × 5 m cross of 1.15 m stucco screens (pos = centre): white-framed glazed screens above the walls (collide), four bays with benches (collide), iron corner columns (collide), hipped slate roof with a coral fretwork fascia and a finial.", params: {}, variants: 1, mount: "ground", build(i, $) {
    for (const [K, NA] of [[0, 2.5], [P, 2.5]]) for (const zA of [-1, 1]) {
      i.push(0, 0, 0, K + (zA > 0 ? 0 : C)), c(i, "paint", x.trim, 2.5, 0.08, 0.38, 2.5 / 2, 1.15 + 0.04, 0), c(i, Q("gloss"), "#9fc6cf", 2.5 - 0.1, 2.6 - 1.15 - 0.1, 0.03, 2.5 / 2, (1.15 + 2.6) / 2, 0);
      for (let L = 0; L <= 3; L++) c(i, "paint", x.white, 0.07, 2.6 - 1.15, 0.08, 0.1 + L * (2.5 - 0.2) / 3, (1.15 + 2.6) / 2, 0);
      c(i, "paint", x.white, 2.5, 0.07, 0.08, 2.5 / 2, 2.6 - 0.03, 0), c(i, Q("paint"), x.white, 2.5, 0.04, 0.06, 2.5 / 2, 1.15 + 0.6, 0), i.pop();
    }
    h(i, -2.5, 1.15, -0.2, 2.5, 2.6, 0.2, { roof: true }), h(i, -0.2, 1.15, -2.5, 0.2, 2.6, 2.5, { roof: true }), h(i, -2.5 - 0.35, 2.6, -2.5 - 0.35, 2.5 + 0.35, 2.6 + 1.6, 2.5 + 0.35, { roof: true });
    for (let K = 0; K < 4; K++) {
      const NA = K * P + C / 4, zA = Math.cos(NA) * 1.3, L = Math.sin(NA) * 1.3;
      for (const [R, y, Y] of [[zA, Math.sign(L) * 0.42, L > 0 ? 0 : C], [Math.sign(zA) * 0.42, L, zA > 0 ? P : -P]]) {
        i.push(R, 0, y, Y);
        for (let u = 0; u < 3; u++) i.box("wood", I(x.woodLt, 0.95 + u * 0.04), 1.4, 0.035, 0.09, 0, 0.46, 0.08 + u * 0.1, { r: 0.01 });
        for (const u of [-0.6, 0.6]) c(i, "gloss", x.iron, 0.05, 0.46, 0.05, u, 0.23, 0.2), i.tube(Q("gloss"), x.iron, [g(u, 0.46, 0.3), g(u, 0.3, 0.05), g(u, 0, 0)], 0.02, { radial: 4 });
        i.pop();
      }
      X(i, zA, 0, Math.sign(L) * 0.6, 1.4, 0.5, 0.34), X(i, Math.sign(zA) * 0.6, 0, L, 0.34, 0.5, 1.4);
      const V = Math.sign(Math.cos(NA)) * (2.5 - 0.12), e = Math.sign(Math.sin(NA)) * (2.5 - 0.12);
      i.lathe("gloss", x.iron, [[0, 0], [0.1, 0], [0.1, 0.1], [0.06, 0.16], [0.05, 2.6 - 0.3], [0.09, 2.6 - 0.1], [0, 2.6 - 0.1]], V, 0, e, { seg: 8 }), X(i, V, 0, e, 0.2, 2.6, 0.2, { roof: true });
      for (const [R, y] of [[0, -Math.sign(e)], [-Math.sign(V), 0]]) i.tube(Q("gloss"), x.iron, [g(V, 2.6 - 0.55, e), g(V + R * 0.25, 2.6 - 0.2, e + y * 0.25), g(V + R * 0.55, 2.6 - 0.05, e + y * 0.55)], 0.02, { radial: 4 });
    }
    i.box("paint", x.trim, 2.5 * 2 + 0.7, 0.18, 2.5 * 2 + 0.7, 0, 2.6 + 0.09, 0, { r: 0.03 });
    for (let K = 0; K < 4; K++) {
      i.push(0, 0, 0, K * P);
      for (let NA = -2.5 - 0.3; NA <= 2.5 + 0.31; NA += 0.2) c(i, Q("paint"), x.coral, 0.12, 0.16, 0.025, NA, 2.6 - 0.06, 2.5 + 0.36, {});
      i.pop();
    }
    i.lathe("paint", x.slate, [[(2.5 + 0.4) * 1.414, 0], [0.3, 1.5], [0, 1.55]], 0, 2.6 + 0.18, 0, { seg: 4, ry: C / 4 }), i.lathe("paint", x.trim, [[0, 0], [0.12, 0], [0.08, 0.3], [0.12, 0.4], [0, 0.55]], 0, 2.6 + 1.65, 0, { seg: 8 }), i.sph("metal", x.gold, 0.07, 0, 2.6 + 2.25, 0, { ws: 8, hs: 6 }), i.blob(6.4, 6.4);
  } }, j.tidewater_icecream = { desc: "Ice-cream kiosk dressing on the 2.6 m square, 2.5 m block (pos = block base centre): serving hatches with striped awnings on the plaza + spawn-facing sides, menu boards, a chest freezer (collides), a scalloped canopy valance round the flat roof (a squid-only perch) and a giant 99 cone sculpture on the roof (collides), wall posters.", params: {}, variants: 1, mount: "ground", build(i, $) {
    const b = (zA, L) => {
      const V = [0, P, C, -P][zA];
      p(i, Math.sin(V) * 1.3, 0, Math.cos(V) * 1.3, V), L(), f(i);
    };
    for (let zA = 0; zA < 4; zA++) b(zA, () => {
      c(i, "paint", x.trim, 2.7, 0.14, 0.08, 0, 2.5 - 0.07, 0.04);
      for (let L = 0; L < 13; L++) {
        const V = -1.3 + (L + 0.5) * 0.2;
        i.add(Q("paint"), Z(0.1, 6, true), L % 2 ? x.white : "#e98aa6", V, 2.5 - 0.14, 0.085, { rz: C });
      }
      if (c(i, "paint", D(x.mint, x.ink, 0.3), 2.62, 0.2, 0.05, 0, 0.1, 0.025), zA === 1 || zA === 2) {
        c(i, Q("gloss"), x.glass, 1.5, 0.9, 0.02, 0, 1.45, 0.012), c(i, Q("glow"), x.lamp, 1.4, 0.25, 4e-3, 0, 1.75, 0.024, { glow: 0.8 }), c(i, "paint", x.white, 1.64, 0.07, 0.07, 0, 1.94, 0.035), i.box("wood", x.woodLt, 1.7, 0.06, 0.32, 0, 0.97, 0.16, { r: 0.015 });
        for (let L = 0; L < 9; L++) {
          const V = -0.8 + L * 0.2;
          i.push(V, 2.12, 0.02, 0, 0.62), c(i, "paint", L % 2 ? x.white : "#e98aa6", 0.2, 0.03, 0.6, 0, 0, 0.3), i.pop();
        }
        for (const L of [-1, 1]) i.tube(Q("metal"), x.ironDk, [g(L * 0.82, 1.8, 0.02), g(L * 0.82, 1.9, 0.35), g(L * 0.82, 1.83, 0.5)], 0.012, { radial: 3 });
        GA(i, "ICES", { h: 0.14, x: 0, y: 2.25, z: 0.09, c: "#b83a5e", flat: true, wt: 0.22, track: 0.15 });
        for (const [L, V] of [[-1.05, "ice"], [1.05, "menu"]]) i.decal(V, 0.34, 0.44, L, 1.45, 0.02);
      }
    });
    p(i, 1.3 + 0.55, 0, 0.55, 0), i.box("gloss", x.white, 0.9, 0.82, 0.62, 0, 0.41, 0, { round: true, r: 0.05 }), c(i, Q("gloss"), x.glassLt, 0.8, 0.02, 0.52, 0, 0.83, 0), i.decal("ice", 0.3, 0.3, 0, 0.45, 0.315), h(i, -0.45, 0, -0.31, 0.45, 0.85, 0.31), f(i);
    const K = -0.55, NA = -0.55;
    i.box("paint", x.trim, 2.66, 0.08, 2.66, 0, 2.5 + 0.04, 0, { r: 0.02 }), i.lathe("paint", "#d9a55c", [[0.04, 0], [0.36, 1.25], [0.4, 1.3], [0, 1.3]], K, 2.5, NA, { seg: 12 });
    for (let zA = 0; zA < 6; zA++) i.tube(Q("paint"), "#b98543", [g(K + Math.cos(zA) * 0.05, 2.5 + 0.1, NA + Math.sin(zA) * 0.05), g(K + Math.cos(zA + 1.6) * 0.36, 2.5 + 1.25, NA + Math.sin(zA + 1.6) * 0.36)], 0.012, { radial: 3 });
    i.lathe("gloss", "#fbf3df", [[0.44, 0], [0.46, 0.14], [0.38, 0.35], [0.3, 0.46], [0.22, 0.62], [0.1, 0.78], [0, 0.84]], K, 2.5 + 1.26, NA, { seg: 14 }), i.cyl("paint", "#5a3522", 0.05, 0.5, K + 0.12, 2.5 + 2, NA, { rz: -0.4, seg: 6 }), i.tube(Q("gloss"), "#e25a6d", [g(K - 0.3, 2.5 + 1.62, NA + 0.25), g(K - 0.2, 2.5 + 1.45, NA + 0.33), g(K - 0.34, 2.5 + 1.3, NA + 0.36)], 0.035, { radial: 5 }), h(i, K - 0.45, 2.5, NA - 0.45, K + 0.45, 2.5 + 2.1, NA + 0.45, { roof: true }), i.cyl("paint", x.coral, 0.2, 0.4, 0.6, 2.5 + 0.2, 0.6, { seg: 10 }), i.blob(3.4, 3.4);
  } }, j.tidewater_tearooms = { desc: "Tea rooms pavilion on the 4 × 4 m, 2.8 m block (pos = block base centre): arched glazed bays on all sides, a glass entrance porch, a verandah canopy on iron posts on the plaza side, a hipped roof with a lantern cupola and TEA ROOMS letters (roof collides), café tables + parasols outside (cover, collide).", params: {}, variants: 1, mount: "ground", build(i, $) {
    const d = $.h ?? 2.8, b = (K, NA) => {
      const zA = [0, P, C, -P][K];
      p(i, Math.sin(zA) * 2, 0, Math.cos(zA) * 2, zA), NA(), f(i);
    };
    for (let K = 0; K < 4; K++) b(K, () => {
      i.add("paint", G("plinthTR", MA.plinth, 4.1), x.stoneDk, 0, 0, 0, {});
      for (const NA of [-1, 1]) sM(i, NA, 0.55, 1, 1.35, { lit: 0.85, transom: 0.7, key: x.coral });
      for (const NA of [-1.95, 0, 1.95]) c(i, "paint", x.trim, 0.14, d - 0.3, 0.06, NA, (d - 0.3) / 2, 0.03);
      i.add("paint", G("cornTR", MA.cornice, 4.3), x.trim, 0, d - 0.36, 0, {});
    });
    i.lathe("paint", "#6f8a9a", [[2 * 1.414 + 0.35, 0], [0.9, 1.2], [0, 1.3]], 0, d, 0, { seg: 4, ry: C / 4 });
    for (let K = 0; K < 4; K++) {
      const NA = K * P + C / 4;
      i.tube(Q("paint"), x.trim, [g(Math.cos(NA) * (2 * 1.414 + 0.35), d + 0.02, Math.sin(NA) * (2 * 1.414 + 0.35)), g(Math.cos(NA) * 0.9, d + 1.22, Math.sin(NA) * 0.9)], 0.05, { radial: 4 });
    }
    i.box("paint", x.trim, 0.9, 0.7, 0.9, 0, d + 1.5, 0, { r: 0.03 });
    for (let K = 0; K < 4; K++) i.push(0, 0, 0, K * P), c(i, Q("glow"), x.lamp, 0.5, 0.4, 0.01, 0, d + 1.52, 0.455, { glow: 0.7 }), i.pop();
    i.lathe("gloss", x.copper, [[0.62, 0], [0.4, 0.3], [0.1, 0.62], [0, 0.66]], 0, d + 1.85, 0, { seg: 4, ry: C / 4 }), i.sph("metal", x.gold, 0.07, 0, d + 2.58, 0, { ws: 8, hs: 6 }), h(i, -2, d, -2, 2, d + 1.3, 2, { roof: true }), p(i, -2, 0, 0, -P), i.box("gloss", x.ironDk, 4.4, 0.08, 1.3, 0, 2.62, 0.65, { r: 0.02 });
    for (let K = 0; K < 22; K++) c(i, Q("paint"), K % 2 ? x.white : x.coral, 0.2, 0.18, 0.02, -2.1 + K * 0.2, 2.5, 1.31);
    for (const K of [-2, 2]) i.cyl("gloss", x.iron, 0.05, 2.6, K, 1.3, 1.22, { seg: 8 }), h(i, K - 0.08, 0, 1.14, K + 0.08, 2.6, 1.3, { roof: true });
    h(i, -2.2, 2.58, 0, 2.2, 2.7, 1.3, { roof: true }), i.box("paint", x.navy, 2.4, 0.4, 0.06, 0, 3.05, 1.2, { r: 0.02 }), GA(i, "TEA ROOMS", { h: 0.22, x: 0, y: 2.94, z: 1.235, c: x.gold, flat: true, wt: 0.2, track: 0.14 }), f(i);
    for (const [K, NA, zA] of [[-3.3, -1.1, 0], [-3.1, 1.6, 1], [0.4, -3.1, 1], [0.6, 3, 0]]) KM(i, K, 0, NA, zA);
    i.blob(5.2, 5.2);
  } };
  function RM(i, $, n, d, b, K) {
    const NA = Math.round($ * n * 5), zA = A.mulberry32(b);
    for (let L = 0; L < NA; L++) {
      const V = (zA() - 0.5) * ($ - 0.2), e = (zA() - 0.5) * (n - 0.2);
      i.sph(Q("foliage"), K[Math.floor(zA() * K.length)], 0.07 + zA() * 0.05, V, d + 0.04, e, { ws: 5, hs: 3 });
    }
  }
  j.tidewater_floralclock = { desc: "Floral clock on the 4.4 m square, 0.7 m kerbed bed (pos = bed centre on the ground): a tilted dial of bedding plants in rings (numerals as dark leaf batons), giant iron hands, a bronze plaque, box-hedge border. A raked collider over the dial (cover).", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.box("paint", x.stone, 4.5, 0.12, 4.5, 0, 0.7 - 0.04, 0, { r: 0.03 });
    for (const zA of [-1, 1]) i.box("foliage", x.leafDk, 4.3, 0.28, 0.3, 0, 0.7 + 0.14, zA * 2, { r: 0.1 }), i.box("foliage", x.leafDk, 0.3, 0.28, 3.7, zA * 2, 0.7 + 0.14, 0, { r: 0.1 });
    const b = 0.38, K = 3.8 * Math.tan(b);
    i.add("paint", s("fcBank", () => O([[-1.9, 0], [1.9, 0], [1.9, 0.06], [-1.9, K]], 3.8, 2e-3)), "#5a4535", 0, 0.7, 0, { ry: P }), p(i, 0, 0.7 + K / 2 + 0.04, 0, P), i.push(0, 0, 0, 0, b);
    const NA = [["#e7d24a", 1.75], ["#d9554f", 1.45], [x.leaf, 1.2], ["#f1ede0", 0.95], ["#9a6ac2", 0.5]];
    for (const [zA, L] of NA) i.add("foliage", Z(L, 28), zA, 0, 2e-3 * (2 - L), 0, { rx: -P });
    for (let zA = 0; zA < 12; zA++) {
      const L = zA / 12 * E;
      i.push(Math.sin(L) * 1.32, 0.03, Math.cos(L) * 1.32, -L), c(i, Q("foliage"), x.leafDk, 0.1, 0.06, 0.26, 0, 0, 0), i.pop();
    }
    i.push(0, 0.07, 0, 0.8), c(i, "gloss", x.ink, 0.1, 0.04, 1, 0, 0, 0.45), i.pop(), i.push(0, 0.11, 0, 2.4), c(i, "gloss", x.ink, 0.07, 0.04, 1.45, 0, 0, 0.66), i.pop(), i.cyl("metal", x.gold, 0.1, 0.12, 0, 0.1, 0, { seg: 10 }), i.pop(), f(i), h(i, -1.9, 0.7, -1.9, 1.9, 0.7 + K * 0.6, 1.9), i.box("metal", x.bronze, 0.05, 0.3, 0.8, 2.2 + 0.03, 0.4, 0, { r: 0.01 }), i.push(2.2 + 0.06, 0.35, 0, P), GA(i, "FLORAL CLOCK", { h: 0.05, x: 0, y: 0, z: 0, c: x.gold, flat: true, wt: 0.24, track: 0.1, mat: "metal" }), i.pop();
  } }, j.tidewater_border = { desc: "Raised flower border on a W × D stone-kerbed bed of height h (pos = bed centre on the ground): massed bedding (coral, cream, violet, yellow), cordyline palms, clipped box balls, a TIDEWATER IN BLOOM sign.", params: { w: "m (6)", d: "m (5)", h: "m (0.9)" }, variants: 1, mount: "ground", build(i, $) {
    const n = $.w ?? 6, d = $.d ?? 5, b = $.h ?? 0.9;
    i.box("paint", x.stone, n + 0.1, 0.12, d + 0.1, 0, b - 0.04, 0, { r: 0.03 }), i.box("paint", "#5a4535", n - 0.3, 0.04, d - 0.3, 0, b + 5e-3, 0, { r: 0.01 }), RM(i, n - 0.4, d - 0.4, b, 7, ["#e3715e", "#f3ecd8", "#9a6ac2", "#e7d24a", "#e3715e", x.leaf]);
    for (const [K, NA] of [[-n * 0.28, -d * 0.2], [n * 0.1, d * 0.25], [n * 0.3, -d * 0.25]]) {
      i.cyl("wood", "#8b6d4f", 0.07, 1.4, K, b + 0.7, NA, { seg: 6 });
      for (let zA = 0; zA < 9; zA++) {
        const L = zA / 9 * E;
        i.push(K, b + 1.4, NA, L, 0.9 - zA % 3 * 0.25), c(i, Q("foliage"), x.leafLt, 0.06, 0.02, 0.7, 0, 0, 0.3), i.pop();
      }
    }
    for (const [K, NA] of [[-n / 2 + 0.5, d / 2 - 0.5], [n / 2 - 0.5, -d / 2 + 0.5], [n / 2 - 0.5, d / 2 - 0.5], [-n / 2 + 0.5, -d / 2 + 0.5]]) i.add("foliage", VA(0.34, 1, 5), x.leafDk, K, b + 0.3, NA, {});
    i.push(n / 2 + 0.02, 0, 0, P), i.cyl("gloss", x.iron, 0.025, 0.7, -0.6, 0.35, 0.25, { seg: 5 }), i.cyl("gloss", x.iron, 0.025, 0.7, 0.6, 0.35, 0.25, { seg: 5 }), i.box("paint", "#2f5d55", 1.5, 0.36, 0.04, 0, 0.62, 0.25, { r: 0.01 }), GA(i, "TIDEWATER IN BLOOM", { h: 0.075, x: 0, y: 0.58, z: 0.275, c: x.white, flat: true, wt: 0.22, track: 0.08 }), i.pop();
  } }, j.tidewater_anchor = { desc: "Lifeboat memorial on the 2.2 m square, 1.0 m granite plinth (pos = plinth base centre): a great black admiralty anchor standing on it with a chain swag, bronze plaques, a wreath.", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.add("paint", G("plinthAn", MA.plinth, 2.3), x.graniteDk, 0, 0, 1.1, {}), i.box("paint", x.trim, 2.3, 0.1, 2.3, 0, 1 + 0.05, 0, { r: 0.02 }), i.box("paint", x.granite, 1.2, 0.3, 1.2, 0, 1 + 0.25, 0, { r: 0.03 });
    for (let K = 0; K < 4; K++) i.push(0, 0, 0, K * P), c(i, "metal", x.bronze, 1, 0.5, 0.03, 0, 0.5, 1.115), GA(i, K % 2 ? "LOST AT SEA" : "IN MEMORIAM", { h: 0.07, x: 0, y: 0.55, z: 1.135, c: x.gold, flat: true, wt: 0.24, track: 0.1, mat: "metal" }), i.pop();
    const d = "#2b2d33", b = 1 + 0.4;
    i.push(0, b, 0, 0.35), c(i, "metal", d, 0.14, 2.3, 0.14, 0, 1.15, 0), i.cyl("metal", d, 0.05, 1.3, 0, 2.1, 0, { rz: P, seg: 8 });
    for (const K of [-1, 1]) i.sph("metal", d, 0.08, K * 0.65, 2.1, 0, { ws: 8, hs: 6 });
    i.tor("metal", d, 0.16, 0.035, 0, 2.42, 0, { rs: 6, ts: 14 }), i.tube("metal", d, z(0, 0.75, 0, 0.75, C + 0.25, E - 0.25, 12), 0.08, { radial: 7 });
    for (const K of [-1, 1]) i.push(K * 0.73, 0.55, 0, 0, 0, K * 0.6), i.add("metal", PA(0.36, 0.34), d, 0, 0, 0, { rz: K > 0 ? -0.2 : 0.2 }), i.add("metal", PA(0.36, 0.34), d, 0, 0, -0.04, { ry: C }), i.pop();
    i.pop();
    for (let K = 0; K < 9; K++) {
      const NA = K / 8;
      i.tor(Q("metal"), "#3a3d44", 0.07, 0.02, -0.8 + NA * 1.6, b + 0.5 - 0.3 * Math.sin(NA * C), 0.62, { ry: K % 2 ? 0 : P, rs: 3, ts: 8 });
    }
    i.tor("foliage", x.leafDk, 0.28, 0.08, 0.6, 1 + 0.55, 0.62, { rs: 5, ts: 14 });
    for (let K = 0; K < 6; K++) {
      const NA = K / 6 * E;
      i.sph(Q("paint"), x.red, 0.05, 0.6 + Math.cos(NA) * 0.28, 1 + 0.55 + Math.sin(NA) * 0.28, 0.72, { ws: 5, hs: 4 });
    }
    h(i, -0.5, 1, -0.5, 0.5, 1 + 2.8, 0.5, { roof: true }), i.blob(3, 3);
  } };
  function hM(i, $, n, d, b = {}) {
    const K = b.c ?? x.stone, NA = b.h ?? 0.95, zA = Math.atan2(d - n, $), L = Math.hypot($, d - n), V = (e) => n + (d - n) * (e / $);
    if (b.rail !== false) {
      for (const [R, y] of [[0, n], [$, d]]) i.box("paint", K, 0.4, NA + 0.12, 0.42, R, y + (NA + 0.12) / 2, 0, { r: 0.03 }), c(i, "paint", I(K, 1.03), 0.48, 0.07, 0.5, R, y + NA + 0.155, 0), i.sph("paint", K, 0.12, R, y + NA + 0.3, 0, { ws: 10, hs: 7 });
      i.push($ / 2, (n + d) / 2 + NA - 0.08, 0, 0, 0, zA), i.box("paint", K, L - 0.36, 0.13, 0.36, 0, 0, 0, { r: 0.03 }), c(i, "paint", I(K, 0.93), L - 0.36, 0.1, 0.3, 0, -NA + 0.2, 0), i.pop();
      const e = Math.max(2, Math.round(($ - 0.4) / 0.2));
      for (let R = 0; R < e; R++) {
        const y = 0.3 + ($ - 0.6) * R / (e - 1);
        i.lathe("paint", K, MM, y, V(y) + 0.16, 0, { seg: 6, sy: (NA - 0.36) / 0.6 });
      }
      if (b.col !== false) {
        const R = Math.max(2, Math.round($ / 1));
        for (let y = 0; y < R; y++) {
          const Y = y * $ / R, u = (y + 1) * $ / R;
          h(i, Y, 0, -0.2, u, Math.max(V(Y), V(u)) + NA + 0.1, 0.2, { rail: true });
        }
      }
    }
    if (b.skirt !== false) {
      const e = -(b.skirtZ ?? 0.22), R = s(["skirt", $, n, d].map(v).join("|"), () => {
        const y = new U(), Y = [y.v(0, 0, 0, 0, 0, 1), y.v($, 0, 0, 0, 0, 1), y.v($, d, 0, 0, 0, 1), y.v(0, n, 0, 0, 0, 1)];
        return y.quad(Y[0], Y[1], Y[2], Y[3]), y.geo();
      });
      i.add("paint", R, I(K, 0.9), 0, 0, e, {}), i.push($ / 2, (n + d) / 2 - 0.12, e + 0.03, 0, 0, zA), c(i, "paint", K, L, 0.12, 0.06, 0, 0, 0), i.pop(), i.push($ / 2, 0.12, e + 0.03), c(i, "paint", I(K, 0.8), $, 0.24, 0.06, 0, 0, 0), i.pop();
      for (let y = 0.6; y < Math.max(n, d) - 0.35; y += 0.42) {
        const Y = n === d ? 0 : Math.max(0, Math.min($, (y + 0.25 - n) / (d - n) * $)), u = n > d ? 0 : Y, o = n > d ? Y : $;
        o - u > 0.3 && c(i, Q("paint"), I(K, 0.74), o - u, 0.035, 0.02, (u + o) / 2, y, e + 0.012);
      }
      for (let y = 0.9, Y = 0; y < $ - 0.3; y += 0.9, Y++) {
        const u = Math.min(n + (d - n) * (y / $), 99) - 0.3;
        for (let o = 0.6 + Y % 2 * 0.42; o < u - 0.42; o += 0.84) c(i, Q("paint"), I(K, 0.74), 0.03, 0.42, 0.02, y, o + 0.21, e + 0.012);
      }
    }
  }
  j.tidewater_rampbal = { desc: "Stone balustrade on a flight’s open edge: runs along +X from pos, from height ya to yb over `length` (piers + ball finials at both ends, raking coping, balusters), with a skirt over the flight’s side face (rail:false = skirt only); stepped colliders.", params: { length: "m", ya: "m at pos", yb: "m at the far end", col: "bool", rail: "bool", skirt: "bool", skirtZ: "m behind pos (0.22)" }, variants: 1, mount: "ground", build(i, $) {
    hM(i, $.length ?? 6, $.ya ?? 0, $.yb ?? 2.4, $);
  } };
  function UM(i, $, n, d = {}) {
    const b = d.c ?? x.stone;
    i.add("paint", G("plinthR", MA.plinth, $), I(b, 0.9), 0, 0, 0, {});
    for (let K = 0.6; K < n - 0.1; K += 0.45) c(i, Q("paint"), I(b, 0.82), $, 0.035, 0.02, 0, K, 8e-3);
    d.cap !== false && i.add("paint", G("capR", MA.string, $ + 0.04), x.trim, 0, n - 0.12, 0, {});
  }
  j.tidewater_townhallbase = { desc: "Town Hall ground storey under the spawn (site piece, pos = world origin, Alpha half): the balcony front with the rusticated entrance arch + doors, lanterns and a plaque; the east wing front with blind arches + a side door; the wing-steps block’s side; bike stands, a notice board and bins in the nook behind the east flight.", params: {}, variants: 1, mount: "ground", build(i, $) {
    p(i, 0, 0, -36, 0), UM(i, 9.6, 2.4), sM(i, 0, 0, 1.8, 1.25, { door: x.ironDk, lit: 0.9, key: x.stoneDk });
    for (const d of [-2.6, 2.6]) sM(i, d, 0.55, 0.8, 0.8, { lit: 0.7, bars: true });
    for (const d of [-1.35, 1.35]) c(i, "gloss", x.ironDk, 0.06, 0.4, 0.2, d, 1.75, 0.1), dA(i, d, 1.4, 0.3, 0.75);
    const n = ($.variant ?? 0) % 2;
    c(i, "metal", x.bronze, 0.8, 0.34, 0.03, -3.8, 1.25, 0.02), GA(i, n ? "CUSTOM HOUSE" : "TOWN HALL", { h: 0.07, x: -3.8, y: 1.3, z: 0.04, c: x.gold, flat: true, wt: 0.24, track: 0.1, mat: "metal" }), GA(i, "OPEN 9 - 5", { h: 0.05, x: -3.8, y: 1.17, z: 0.04, c: x.gold, flat: true, wt: 0.24, track: 0.1, mat: "metal" }), f(i), p(i, -9.5, 0, -41.9, -P), UM(i, 7, 2.4, { c: x.stoneDk });
    for (const d of [-2.2, 0, 2.2]) sM(i, d, 0.6, 0.8, 0.9, { lit: 0.6, key: x.stone });
    f(i), p(i, 9.5, 0, -39.95, P), UM(i, 3.1, 2.4), sM(i, 0, 0.2, 1, 1.3, { door: "#3a4a5c", lit: 0.8 }), f(i), p(i, 11.8, 0, -41.5, 0), UM(i, 4.6, 2.4), sM(i, -1.1, 0.3, 1.2, 0.95, { door: "#3a4a5c", lit: 0.8 }), c(i, "wood", x.wood, 1.4, 0.9, 0.06, 1.25, 1.35, 0.03), c(i, Q("paint"), "#2f4f45", 1.3, 0.8, 0.02, 1.25, 1.35, 0.065);
    for (const [d, b, K] of [[0.9, 1.5, "pst2"], [1.55, 1.4, "pst6"]]) i.decal(K, 0.3, 0.45, d, b, 0.08);
    f(i);
    for (const d of [11, 11.9, 12.8]) i.tube("metal", x.ironDk, z(d, 0, -40.5, 0.4, 0, C, 8, "xz").map((b) => g(b[0], Math.sin(Math.acos(Math.max(-1, Math.min(1, (b[0] - d) / 0.4)))) * 0.75, -40.5)), 0.025, { radial: 5 }), h(i, d - 0.42, 0, -40.56, d + 0.42, 0.8, -40.44, { rail: true });
    i.push(13.7, 0, -40.9), i.lathe("gloss", x.ironDk, [[0, 0], [0.26, 0], [0.26, 0.85], [0.28, 0.9], [0.2, 1], [0, 1.02]], 0, 0, 0, { seg: 10 }), i.pop(), h(i, 13.4, 0, -41.2, 14, 1, -40.6, { roof: true });
  } }, j.tidewater_lifeboat = { desc: "Lifeboat station out on its own stone jetty off the tip of the promenade (pos = centre of its front at the foot, front faces +Z; out of play, no collision): the 15.5 × 7.6 m, 6.2 m house — gable, LIFEBOAT STATION letters, crew door, windows, service boards, the old bell — roofs + the octagonal lookout tower with its flagstaff, the boat-hall doors (local -X end) open onto a slipway running down into the sea with the lifeboat on its cradle.", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.aoBase = null;
    const n = -25, d = -9.5, b = -38.4, K = 6.2, NA = "#b8403a", zA = x.navy, L = x.butter;
    p(i, 17.25, 0, 38.4, 0), i.box("paint", L, d - n, K + 1.2, 7.6, (n + d) / 2, (K - 1.2) / 2, b - 3.8, { r: 0.05 }), i.box(Q("paint"), x.stoneDk, d - n + 2.4, 2.4, 10.2, (n + d) / 2, -1.2, b - 3.3, { r: 0.05 }), c(i, Q("paint"), x.granite, d - n + 2.5, 0.1, 10.3, (n + d) / 2, 0.02, b - 3.3), p(i, (n + d) / 2, 0, b, 0);
    const V = d - n;
    UM(i, V, 1, { c: x.stoneDk, cap: true }), i.add("paint", G("cornL", MA.cornice, V + 0.2), x.trim, 0, K - 0.36, 0, {}), wA(i, "paint", x.trim, "string", V, 0, 3.55, 0);
    for (const y of [-1, 1]) cA(i, y * (V / 2 - 0.01), 0.4, K - 0.4, y, x.stoneDk);
    sM(i, -3.2, 0, 1.3, 1.9, { door: zA, lit: 0.8, key: NA });
    for (const y of [-6.2, 0.2, 3.2]) bA(i, y, 1, 1, 1.55, { frame: x.trim, lit: 0.7, hood: "cornice" });
    for (const y of [-6.2, -3.2, 0.2, 3.2, 6.2]) bA(i, y, 4.1, 0.9, 1.3, { frame: x.trim, lit: 0.6, key: true });
    c(i, "paint", zA, 9, 0.6, 0.08, -1.2, 3.1, 0.04), GA(i, "LIFEBOAT STATION", { h: 0.34, x: -1.2, y: 2.93, z: 0.085, c: x.white, flat: true, wt: 0.2, track: 0.14 }), i.cyl("gloss", NA, 0.4, 0.05, 6.4, 3.1, 0.03, { rx: P, seg: 18 }), i.cyl("gloss", x.white, 0.3, 0.02, 6.4, 3.1, 0.06, { rx: P, seg: 18 }), i.tor(Q("gloss"), zA, 0.19, 0.04, 6.4, 3.1, 0.075, { rs: 4, ts: 16 }), c(i, "wood", x.woodLt, 1.2, 1.5, 0.06, 5.2, 1.5, 0.03), c(i, Q("paint"), "#1f3150", 1.1, 1.4, 0.02, 5.2, 1.5, 0.065), GA(i, "SERVICES", { h: 0.08, x: 5.2, y: 2.05, z: 0.08, c: x.gold, flat: true, wt: 0.24, track: 0.12 });
    for (let y = 0; y < 8; y++) c(i, Q("paint"), x.gold, 0.8 - y % 3 * 0.15, 0.025, 4e-3, 5.1, 1.85 - y * 0.12, 0.078);
    c(i, "gloss", x.ironDk, 0.06, 0.06, 0.5, -1.5, 2.3, 0.25), i.lathe("metal", x.bronze, [[0, 0.3], [0.08, 0.28], [0.14, 0.12], [0.2, 0], [0.17, 0.01], [0, 0.04]], -1.5, 1.95, 0.45, { seg: 12 }), f(i), i.push((n + d) / 2 - 2.5, K, (b - 46) / 2), i.add("paint", s("lbRoof", () => O([[-3.9, 0], [3.9, 0], [0, 2.3]], 1, 1e-3)), x.slate, 0, 0, 0, { sx: 10.6 }), i.box("paint", I(x.slate, 0.8), 10.8, 0.14, 0.26, 0, 2.3, 0, { r: 0.04 }), i.pop();
    for (const y of [n + 0.02, n + 10.6]) i.push(y, K, (b - 46) / 2, y < -20 ? -P : P), i.add("paint", PA(7.8, 2.3), L, 0, 0, 0, {}), i.pop();
    const e = -12.2, R = -42.2;
    i.box("paint", L, 5.4, 0.4, 7.4, e + 0.2, K + 0.2, R, { r: 0.04 }), i.lathe("paint", L, [[1.5, 0], [1.5, 2.6], [0, 2.6]], e, K + 0.4, R, { seg: 8, ry: C / 8 });
    for (let y = 0; y < 8; y++) {
      const Y = y / 8 * E + C / 8;
      i.push(e + Math.cos(Y) * 1.4, K + 0.4, R + Math.sin(Y) * 1.4, P - Y), c(i, Q("gloss"), x.glassLt, 0.9, 1.2, 0.02, 0, 1.5, 0.02), c(i, "paint", x.white, 0.95, 0.07, 0.06, 0, 2.12, 0.03), c(i, "paint", x.white, 0.95, 0.07, 0.06, 0, 0.88, 0.03), i.pop();
    }
    i.lathe("paint", x.white, [[1.7, 0], [1.7, 0.18], [0, 0.18]], e, K + 3, R, { seg: 8, ry: C / 8 }), i.lathe("paint", NA, [[1.72, 0], [0.9, 0.9], [0.12, 1.7], [0, 1.75]], e, K + 3.18, R, { seg: 8, ry: C / 8 }), i.cyl("paint", x.white, 0.05, 4, e, K + 5.9, R, { seg: 6 }), i.cyl("paint", x.white, 0.03, 1.6, e, K + 6.9, R, { rz: P, seg: 5 }), i.flag(e, K + 7.7, R, { color: "#e8793a", s: 2 });
    for (const y of [-1, 1]) for (let Y = 0; Y < 3; Y++) i.flag(e + y * (0.25 + Y * 0.28), K + 6.82 - Y * 0.2, R, { color: [NA, x.yellow, "#3f6fb0", zA, x.white, NA][Y + (y > 0 ? 3 : 0)], s: 0.9 });
    p(i, n, 0, -42.2, -P), i.add("paint", W(4.2, 2.9, 14), "#1b2430", 0, 0, 0.01, {}), i.tube("paint", x.trim, z(0, 2.9, 0.06, 2.2, 0, C, 14), 0.1, { radial: 5 });
    for (const y of [-1, 1]) {
      c(i, "paint", x.trim, 0.26, 2.9, 0.14, y * 2.23, 1.45, 0.07), i.push(y * 2.1, 0, 0.02, y * -1.2), c(i, "wood", zA, 2.1, 2.8, 0.09, y * -1.05, 1.4, 0.05);
      for (let Y = 0; Y < 7; Y++) c(i, Q("wood"), I(zA, 1.15), 0.04, 2.75, 0.02, y * (-0.15 - Y * 0.3), 1.4, 0.1);
      i.pop();
    }
    GA(i, "LIFEBOAT", { h: 0.42, x: 0, y: 5.3 - 0.1, z: 0.04, c: NA, flat: true, wt: 0.2, track: 0.16 }), f(i), i.push(n - 7.5, -1.55, -42.2, 0, 0, 0.2), i.box("wood", x.wood, 15.3, 0.3, 4.2, 0, 0, 0, { r: 0.04 });
    for (let y = -3; y <= 3; y++) c(i, Q("wood"), I(x.wood, 0.8), 15.3, 0.02, 0.05, 0, 0.16, y * 0.55);
    for (const y of [-1.6, 1.6]) c(i, "metal", x.lead, 15.3, 0.12, 0.14, 0, 0.2, y);
    i.pop();
    for (let y = 0; y < 5; y++) {
      const Y = n - 1.5 - y * 3.2;
      i.cyl(Q("wood"), x.wood, 0.18, 4, Y, -2.8 - y * 0.6 + 0.9, -43.9, { seg: 7 }), i.cyl(Q("wood"), x.wood, 0.18, 4, Y, -2.8 - y * 0.6 + 0.9, -40.5, { seg: 7 });
    }
    i.push(n - 5.4, -1.02, -42.2, -P, 0.2, 0), i.add("gloss", s("lbHull2", () => {
      const y = new U(), Y = 14, u = 8, o = [], B = S(zA), a = S("#e8793a"), H = S("#f2eee6");
      for (let l = 0; l <= Y; l++) {
        const _ = l / Y, OA = -4.2 + _ * 8.4, yA = Math.max(0, (_ - 0.62) / 0.38), EA = 1.45 * Math.sqrt(Math.max(0.02, 1 - yA * yA)) * (_ < 0.08 ? 0.9 + _ : 1), CA = 1.55 + 0.35 * yA * yA, iA = 0.05 + 0.15 * yA, F = [];
        for (let J = 0; J <= u; J++) {
          const AA = J / u, jA = (AA - 0.5) * C, gA = Math.sin(jA) * EA * Math.pow(Math.abs(Math.sin(jA)), -0.25 + 0.25), LA = AA === 0.5 ? iA : iA + (CA - iA) * Math.pow(Math.abs(AA - 0.5) * 2, 0.6), kA = LA > CA - 0.3 ? a : LA > CA - 0.4 ? H : B;
          F.push(y.v(gA, LA, OA, Math.sin(jA), -Math.cos(jA) * 0.4, 0, ...kA));
        }
        o.push(F);
      }
      for (let l = 0; l < Y; l++) for (let _ = 0; _ < u; _++) y.quad(o[l][_], o[l][_ + 1], o[l + 1][_ + 1], o[l + 1][_]);
      const m = y.geo();
      return m.computeVertexNormals(), m;
    }), "white", 0, 0, 0, {}), c(i, "paint", x.white, 2.6, 0.06, 6.2, 0, 1.56, -0.8), i.box("gloss", zA, 2.7, 1.5, 0.08, 0, 0.8, -4.2, { r: 0.04 }), c(i, "paint", "#e8793a", 2.72, 0.3, 0.09, 0, 1.4, -4.2), i.box("gloss", "#e8793a", 2.1, 1.3, 3.2, 0, 2.2, -0.9, { round: true, r: 0.15 });
    for (const y of [-1, 1]) c(i, Q("gloss"), x.glass, 0.02, 0.4, 2.6, y * 1.06, 2.45, -0.9);
    c(i, Q("gloss"), x.glass, 1.8, 0.45, 0.02, 0, 2.45, 0.71), i.box("gloss", "#e8793a", 1.5, 0.5, 1.6, 0, 3.1, -1.2, { r: 0.1 }), c(i, "paint", x.white, 1.6, 0.06, 1.7, 0, 3.38, -1.2);
    for (const y of [-0.25, 0.25]) i.cyl("metal", x.white, 0.035, 1.5, y, 4.1, -1.3, { seg: 5 });
    for (let y = 0; y < 4; y++) c(i, Q("metal"), x.white, 0.5, 0.025, 0.025, 0, 3.55 + y * 0.3, -1.3);
    i.lathe(Q("glow"), "#6ab0ff", [[0, 0], [0.09, 0], [0.09, 0.15], [0, 0.15]], 0, 4.85, -1.3, { seg: 8, glow: 1.4 });
    for (let y = 0; y < 5; y++) i.lathe(Q("gloss"), "#2a2c31", [[0, -0.2], [0.09, -0.18], [0.1, 0.18], [0, 0.2]], 1.47, 1.3, -3 + y * 1.3, { seg: 6, rz: P * 0.1 });
    i.push(1.47, 1.1, 0.4, P), GA(i, "TIDEWATER", { h: 0.2, x: 0, y: 0, z: 0.02, c: x.white, flat: true, wt: 0.22, track: 0.12 }), i.pop(), i.pop(), i.push(n - 5.4, -1.25, -42.2, -P, 0.2, 0);
    for (const y of [-3, -1, 1, 3]) {
      c(i, "metal", x.ironDk, 2.6, 0.18, 0.2, 0, 0.05, y);
      for (const Y of [-1, 1]) c(i, "metal", x.ironDk, 0.15, 0.6, 0.2, Y * 1.1, 0.35, y);
    }
    i.pop(), f(i);
  } }, j.tidewater_pier = { desc: "Pier gate + pier (pos = gate centre on the promenade edge, pier out along local -X): booth dressing (turnstile windows, clocks, pay boards, domed cupolas), a lit wrought-iron arch with the pier’s name, closed ornamental gates (collide), then the pier over the sea: cast-iron legs + bracing, a planked deck with railings and lamps, twin kiosks halfway, and the domed pavilion at the end with flags. variant 0 PALACE PIER, 1 VICTORIA PIER.", params: {}, variants: 2, mount: "ground", build(i, $) {
    const n = ($.variant ?? 0) % 2, d = n ? "VICTORIA PIER" : "PALACE PIER", b = n ? "#5e7fb0" : x.coral, K = x.iron;
    for (const B of [-1, 1]) {
      const a = B * 4, H = 1.5;
      p(i, 3, 0, a, P), UM(i, 3, 2.6, { c: x.stone }), sM(i, 0, 0.8, 1.2, 0.9, { lit: 0.9, transom: 0.6 }), c(i, "wood", x.woodLt, 1.5, 0.08, 0.3, 0, 0.8, 0.15), i.decal("ferry", 0.5, 0.33, 0, 2.2, 0.02), f(i), p(i, H, 0, B * 2.5, B > 0 ? C : 0), i.add("paint", G("plinthR", MA.plinth, 3), I(x.stone, 0.9), 0, 0, 0, {}), i.add("paint", G("capR", MA.string, 3.04), x.trim, 0, 2.48, 0, {}), f(i), i.lathe("paint", x.trim, [[1.6, 0], [1.6, 0.15], [0, 0.15]], H, 2.6, a, { seg: 4, ry: C / 4 }), i.lathe("paint", x.trim, [[1, 0], [1, 0.3], [1.08, 0.34], [1.08, 0.4], [0, 0.4]], H, 2.75, a, { seg: 8, ry: C / 8 });
      const m = [[1.02, 0], [1.06, 0.2], [0.94, 0.5], [0.62, 0.82], [0.32, 1.06], [0.16, 1.3], [0.1, 1.45], [0, 1.5]];
      i.lathe("gloss", b, m, H, 3.15, a, { seg: 8, ry: C / 8 });
      for (let l = 0; l < 8; l++) {
        const _ = C / 8 + l / 8 * E;
        i.tube(Q("gloss"), x.trim, m.slice(0, 7).map(([OA, yA]) => g(H + Math.cos(_) * (OA * 0.96 + 0.03), 3.16 + yA, a + Math.sin(_) * (OA * 0.96 + 0.03))), 0.035, { radial: 3 });
      }
      i.sph("metal", x.gold, 0.09, H, 4.72, a, { ws: 8, hs: 6 }), i.cyl("metal", x.ink, 0.02, 0.6, H, 5, a, { seg: 4 }), h(i, H - 1.5, 2.6, a - 1.5, H + 1.5, 4.3, a + 1.5, { roof: true });
    }
    const NA = 0.3, zA = 5.2;
    for (const B of [-1, 1]) i.box("gloss", K, 0.3, zA - 2.6, 0.3, NA, 2.6 + (zA - 2.6) / 2, B * 2.6, { r: 0.03 }), dA(i, NA, zA, B * 2.6, 1);
    const L = [];
    for (let B = 0; B <= 14; B++) {
      const a = B / 14 * C;
      L.push(g(NA, zA - 0.2 + Math.sin(a) * 0.9, -Math.cos(a) * 2.6));
    }
    i.tube("gloss", K, L, 0.06, { radial: 6 }), i.tube(Q("gloss"), K, L.map((B) => g(B[0], B[1] - 0.55, B[2] * 0.97)), 0.04, { radial: 5 });
    for (let B = 1; B < 14; B++) {
      const a = B / 14 * C;
      i.cyl(Q("gloss"), K, 0.015, 0.5, NA, zA - 0.48 + Math.sin(a) * 0.9, -Math.cos(a) * 2.55, { seg: 4 });
    }
    i.push(NA + 0.05, zA - 0.85, 0, P), GA(i, d, { h: 0.3, x: 0, y: 0, z: 0, c: x.white, flat: true, wt: 0.2, track: 0.12, mat: "glow", glow: 1.2 }), i.pop(), i.push(NA - 0.05, zA - 0.85, 0, -P), GA(i, d, { h: 0.3, x: 0, y: 0, z: 0, c: x.white, flat: true, wt: 0.2, track: 0.12, mat: "glow", glow: 1.2 }), i.pop();
    for (const B of [-1, 1]) {
      i.push(0.15, 0, B * 1.25), c(i, "gloss", K, 0.06, 0.06, 2.5, 0, 0.12, 0), c(i, "gloss", K, 0.06, 0.06, 2.5, 0, 2, 0);
      for (let a = 0; a < 13; a++) {
        const H = -1.2 + a * 0.2;
        i.cyl(Q("gloss"), K, 0.016, 2.1, 0, 1.05, H, { seg: 4 }), i.sph(Q("gloss"), x.gold, 0.03, 0, 2.18, H, { ws: 4, hs: 3 });
      }
      i.tor(Q("gloss"), K, 0.4, 0.02, 0, 1.3, 0, { ry: P, rs: 3, ts: 14 }), i.pop();
    }
    h(i, -0.1, 0, -2.5, 0.4, 2.3, 2.5, { rail: true });
    const V = -0.2, e = -60, R = 6.4, y = x.woodLt;
    i.box(Q("wood"), y, V - e, 0.35, R, (V + e) / 2, -0.175, 0, { r: 0.03 });
    for (let B = -R / 2 + 0.35; B < R / 2; B += 0.35) c(i, Q("wood"), I(y, 0.82), V - e, 0.01, 0.025, (V + e) / 2, 2e-3, B);
    c(i, Q("paint"), K, V - e, 0.35, 0.05, (V + e) / 2, -0.35, R / 2 + 0.02), c(i, Q("paint"), K, V - e, 0.35, 0.05, (V + e) / 2, -0.35, -R / 2 - 0.02);
    for (let B = -3; B > e + 1; B -= 6) {
      for (const a of [-R / 2 + 0.3, 0, R / 2 - 0.3]) i.cyl(Q("gloss"), K, 0.16, 3.2, B, -1.95, a, { seg: 7 });
      i.tube(Q("gloss"), K, [g(B, -2.8, -R / 2 + 0.3), g(B, -0.6, R / 2 - 0.3)], 0.04, { radial: 4 }), i.tube(Q("gloss"), K, [g(B, -2.8, R / 2 - 0.3), g(B, -0.6, -R / 2 + 0.3)], 0.04, { radial: 4 });
    }
    for (const B of [-1, 1]) {
      i.push(e + 0.5, 0, B * (R / 2 - 0.08), 0), i.cyl(Q("gloss"), K, 0.025, V - e - 0.5, (V - e - 0.5) / 2, 1, 0, { rz: P, seg: 6, open: true }), i.cyl(Q("gloss"), K, 0.015, V - e - 0.5, (V - e - 0.5) / 2, 0.12, 0, { rz: P, seg: 4, open: true });
      for (let H = 0; H < V - e - 0.5; H += 0.5) i.cyl(Q("gloss"), K, 0.01, 0.9, H, 0.55, 0, { seg: 3, open: true });
      i.pop();
      for (let H = -8; H > e + 4; H -= 10) i.lathe(Q("gloss"), K, [[0, 0], [0.12, 0], [0.06, 0.3], [0.05, 3.2], [0, 3.2]], H, 0, B * (R / 2 - 0.25), { seg: 6 }), dA(i, H, 3.15, B * (R / 2 - 0.25), 0.9);
      const a = -30;
      i.box(Q("paint"), x.stucco, 2.4, 2.4, 1.8, a, 1.2, B * (R / 2 - 1.2), { r: 0.04 }), i.lathe(Q("gloss"), b, [[1.3, 0], [1.1, 0.4], [0.5, 1.1], [0, 1.4]], a, 2.4, B * (R / 2 - 1.2), { seg: 8 });
    }
    const Y = e - 7, u = 16, o = 12;
    i.box(Q("paint"), y, u + 2, 0.35, o + 3, Y, -0.175, 0, { r: 0.04 });
    for (let B = Y - 7; B <= Y + 7; B += 7) for (const a of [-5, 0, 5]) i.cyl(Q("gloss"), K, 0.2, 3.2, B, -1.95, a, { seg: 7 });
    i.box(Q("paint"), x.stucco, u, 5.2, o, Y, 2.6, 0, { r: 0.05 });
    for (const [B, a, H] of [[P, 0, o], [-P, 0, o]]) {
      i.push(Y + (B > 0 ? u / 2 : -u / 2), 0, 0, B);
      for (let m = -4; m <= 4.1; m += 2.6) sM(i, m, 1, 1.4, 2, { lit: 1, key: b });
      i.pop();
    }
    for (const B of [-1, 1]) {
      i.push(Y, 0, B * o / 2, B > 0 ? 0 : C);
      for (let a = -6; a <= 6.1; a += 2.4) sM(i, a, 1, 1.4, 2, { lit: 1, key: b });
      i.pop();
    }
    i.box(Q("paint"), x.trim, u + 0.4, 0.4, o + 0.4, Y, 5.4, 0, { r: 0.05 }), i.lathe(Q("paint"), x.stucco, [[4.2, 0], [4.2, 1.6], [0, 1.6]], Y, 5.6, 0, { seg: 12 }), i.lathe(Q("gloss"), b, [[4.4, 0], [4.9, 1.6], [4.6, 3.2], [3.4, 4.6], [1.6, 5.8], [0.5, 6.6], [0, 7.2]], Y, 7.2, 0, { seg: 16 });
    for (let B = 0; B < 16; B++) {
      const a = B / 16 * E;
      i.tube(Q("gloss"), x.trim, [[4.4, 0], [4.9, 1.6], [4.6, 3.2], [3.4, 4.6], [1.6, 5.8], [0.5, 6.6]].map(([H, m]) => g(Y + Math.cos(a) * (H + 0.04), 7.2 + m, Math.sin(a) * (H + 0.04))), 0.06, { radial: 3 });
    }
    i.cyl(Q("metal"), x.gold, 0.08, 2, Y, 15.2, 0, { seg: 6 }), i.sph(Q("metal"), x.gold, 0.25, Y, 14.5, 0, { ws: 10, hs: 8 }), i.flag(Y, 16, 0, { color: b, s: 2.4 });
    for (const [B, a] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const H = Y + B * (u / 2 - 0.2), m = a * (o / 2 - 0.2);
      i.lathe(Q("paint"), x.stucco, [[1.2, 0], [1.2, 7.2], [0, 7.2]], H, 0, m, { seg: 8 }), i.lathe(Q("gloss"), b, [[1.3, 0], [1.45, 0.7], [1.2, 1.5], [0.5, 2.3], [0, 2.7]], H, 7.2, m, { seg: 8 }), i.cyl(Q("paint"), x.white, 0.04, 1.8, H, 10.6, m, { seg: 4 }), i.flag(H, 11.4, m, { color: B * a > 0 ? x.white : b, s: 1.3 });
    }
    i.push(Y + u / 2 + 0.05, 4.4, 0, P), GA(i, d, { h: 0.55, x: 0, y: 0, z: 0, c: b, flat: true, wt: 0.2, track: 0.1, mat: "glow", glow: 1 }), i.pop();
  } };
  function KM(i, $, n, d, b) {
    i.push($, n, d), i.cyl("metal", x.ironDk, 0.03, 0.72, 0, 0.36, 0, { seg: 6 }), i.cyl("paint", x.white, 0.4, 0.04, 0, 0.74, 0, { seg: 14 }), i.lathe(Q("metal"), x.ironDk, [[0, 0], [0.22, 0], [0.2, 0.03], [0, 0.03]], 0, 0, 0, { seg: 8 });
    for (let K = 0; K < 3; K++) {
      const NA = K / 3 * E + 0.4;
      i.push(Math.cos(NA) * 0.62, 0, Math.sin(NA) * 0.62, -NA - P), c(i, "gloss", x.iron, 0.36, 0.03, 0.36, 0, 0.45, 0), c(i, Q("gloss"), x.iron, 0.36, 0.4, 0.03, 0, 0.66, -0.17);
      for (const zA of [-1, 1]) c(i, Q("gloss"), x.iron, 0.025, 0.45, 0.025, zA * 0.15, 0.22, 0);
      i.pop();
    }
    i.cyl(Q("metal"), x.white, 0.02, 1.6, 0, 1.4, 0, { seg: 5 }), i.add("foliage", s("parasol" + b, () => {
      const K = new U(), NA = 8, zA = 1.1, V = K.v(0, 0.35, 0, 0, 1, 0, ...S(x.white)), e = [];
      for (let R = 0; R <= NA; R++) {
        const y = R / NA * E, Y = S(R % 2 ? x.white : b ? x.coral : "#4f8fa0");
        e.push(K.v(Math.cos(y) * zA, 0, Math.sin(y) * zA, Math.cos(y) * 0.3, 1, Math.sin(y) * 0.3, ...Y));
      }
      for (let R = 0; R < NA; R++) K.tri(V, e[R], e[R + 1]);
      return K.geo();
    }), "white", 0, 2.05, 0, {}), h(i, -0.45, 0, -0.45, 0.45, 0.78, 0.45), i.blob(1.8, 1.8), i.pop();
  }
  j.tidewater_cafe = { desc: "Café table (marble top on an iron pedestal) with three bistro chairs and a striped parasol; the table collides (low cover). variant 0 teal, 1 coral.", params: {}, variants: 2, mount: "ground", build(i, $) {
    KM(i, 0, 0, 0, ($.variant ?? 0) % 2);
  } }, j.tidewater_punchjudy = { desc: "Punch & Judy booth (front +Z): red-and-white striped canvas tower on a frame, a gilt proscenium with PUNCH & JUDY letters, curtains, Mr Punch and his crocodile, a swazzle-man’s bottle bag; collides (cover).", params: {}, variants: 1, mount: "ground", build(i, $) {
    const K = s("pjStripe", () => {
      const NA = new U(), zA = 10;
      for (let L = 0; L < zA; L++) {
        const V = S(L % 2 ? x.white : x.red), e = -0.5 + L / zA, R = e + 1 / zA, y = [NA.v(e, 0, 0, 0, 0, 1, ...V), NA.v(R, 0, 0, 0, 0, 1, ...V), NA.v(R, 1, 0, 0, 0, 1, ...V), NA.v(e, 1, 0, 0, 0, 1, ...V)];
        NA.quad(y[0], y[1], y[2], y[3]);
      }
      return NA.geo();
    });
    for (let NA = 0; NA < 4; NA++) {
      const zA = NA * P, L = NA % 2 ? 1 : 1.5, V = NA % 2 ? 1.5 / 2 : 1 / 2;
      i.push(Math.sin(zA) * V, 0, Math.cos(zA) * V, zA), NA === 0 ? (i.add("foliage", K, "white", 0, 0, 0, { sx: L, sy: 1.25 }), i.add("foliage", K, "white", 0, 1.95, 0, { sx: L, sy: 0.6 })) : i.add("foliage", K, "white", 0, 0, 0, { sx: L, sy: 2.1 + 0.45 }), i.pop();
    }
    i.box("paint", x.gold, 1.5 + 0.06, 0.08, 0.1, 0, 1.25, 1 / 2 + 0.03, { r: 0.02 }), i.box("paint", x.gold, 1.5 + 0.06, 0.08, 0.1, 0, 1.95, 1 / 2 + 0.03, { r: 0.02 });
    for (const NA of [-1, 1]) i.box("paint", x.gold, 0.08, 0.78, 0.1, NA * (1.5 / 2 - 0.02), 1.6, 1 / 2 + 0.03, { r: 0.02 });
    for (const NA of [-1, 1]) i.box("paint", "#9e2c34", 0.3, 0.66, 0.04, NA * 0.52, 1.62, 1 / 2 - 0.02, { r: 0.02 });
    c(i, Q("paint"), "#1d2a44", 1.5 - 0.2, 0.66, 0.02, 0, 1.6, 1 / 2 - 0.08), i.box("wood", x.wood, 1.5, 0.06, 0.24, 0, 1.3, 1 / 2 + 0.1, { r: 0.01 }), i.box("paint", x.navy, 1.5 + 0.3, 0.42, 0.06, 0, 2.1 + 0.3, 1 / 2 + 0.02, { r: 0.03 }), GA(i, "PUNCH & JUDY", { h: 0.17, x: 0, y: 2.1 + 0.22, z: 1 / 2 + 0.055, c: x.yellow, flat: true, wt: 0.22, track: 0.08 }), i.lathe("paint", x.red, [[0, 0], [0.12, 0.02], [0.14, 0.18], [0, 0.34]], 0, 2.1 + 0.45, 0, { seg: 8 }), i.push(-0.3, 1.33, 1 / 2 + 0.05), i.lathe("paint", x.red, [[0, 0], [0.09, 0], [0.1, 0.2], [0.05, 0.28], [0, 0.28]], 0, 0, 0, { seg: 8 }), i.sph("paint", "#f1c8a8", 0.08, 0, 0.36, 0, { ws: 8, hs: 6 }), i.cyl("paint", "#e79a7a", 0.025, 0.1, 0, 0.35, 0.08, { rx: P, r2: 0.012, seg: 5 }), i.lathe("paint", x.yellow, [[0, 0], [0.07, 0], [0.03, 0.18], [0, 0.2]], 0, 0.42, 0, { seg: 6, rz: 0.4 }), i.pop(), i.push(0.35, 1.36, 1 / 2 + 0.06, 0.3), c(i, "paint", "#4f8a4a", 0.34, 0.1, 0.12, 0, 0.05, 0), c(i, "paint", "#4f8a4a", 0.2, 0.05, 0.1, -0.2, 0.08, 0, { rz: 0.3 });
    for (const NA of [-0.1, 0.02, 0.14]) c(i, Q("paint"), x.white, 0.02, 0.03, 0.12, NA, 0, 0);
    i.pop(), X(i, 0, 0, 0, 1.5, 2.1 + 0.2, 1, { roof: true }), i.blob(1.5 + 0.8, 1 + 0.8);
  } }, j.tidewater_telescope = { desc: "Coin-operated seafront binocular viewer on a fluted cast-iron pedestal, faces +Z; small collider.", params: {}, variants: 1, mount: "ground", build(i, $) {
    const n = $.color ?? x.iron;
    i.lathe("gloss", n, [[0, 0], [0.2, 0], [0.2, 0.06], [0.1, 0.12], [0.07, 0.2], [0.06, 1], [0.09, 1.06], [0, 1.08]], 0, 0, 0, { seg: 10 }), i.push(0, 1.25, 0, 0, -0.15), i.box("gloss", n, 0.34, 0.26, 0.3, 0, 0, 0, { round: true, r: 0.06 });
    for (const d of [-1, 1]) i.cyl("gloss", n, 0.07, 0.3, d * 0.08, 0.02, 0.25, { rx: P, seg: 10 }), i.cyl(Q("gloss"), x.glass, 0.055, 0.01, d * 0.08, 0.02, 0.405, { rx: P, seg: 10 }), i.cyl("gloss", x.ink, 0.05, 0.08, d * 0.07, 0.03, -0.18, { rx: P, seg: 8 });
    c(i, Q("metal"), x.gold, 0.06, 0.02, 0.01, 0.1, 0.1, -0.15), i.pop(), i.cyl("metal", x.ironDk, 0.03, 0.18, 0, 1.12, 0, { seg: 6 }), h(i, -0.2, 0, -0.2, 0.2, 1.3, 0.2, { roof: true }), i.blob(0.7, 0.7);
  } }, j.tidewater_tidegauge = { desc: "Harbour tide board on the sea railing: a tall white post with a painted metre scale, a TIDE TABLE board with high/low water times and a little hood, a brass tide-clock dial. Non-colliding apart from the post.", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.box("paint", x.white, 0.22, 3.4, 0.14, 0, 1.7, 0, { r: 0.02 });
    for (let n = 0; n < 16; n++) c(i, Q("paint"), n % 2 ? x.ink : x.red, n % 5 === 0 ? 0.16 : 0.1, 0.03, 0.01, 0.04, 0.3 + n * 0.2, 0.075);
    i.box("paint", x.navy, 0.9, 1.05, 0.06, 0, 2, 0.1, { r: 0.03 }), i.add("paint", G("tgHood", [[0, 0], [0.25, 0], [0, 0.18]], 1), x.slate, 0, 2.55, 0.08, {}), GA(i, "TIDE TABLE", { h: 0.07, x: 0, y: 2.36, z: 0.135, c: x.gold, flat: true, wt: 0.24, track: 0.1 });
    for (let n = 0; n < 4; n++) GA(i, ["HW 06:12", "LW 12:31", "HW 18:40", "LW 00:55"][n], { h: 0.055, x: -0.05, y: 2.18 - n * 0.12, z: 0.135, c: x.white, flat: true, wt: 0.24, track: 0.06 });
    i.cyl("metal", x.bronze, 0.16, 0.05, 0, 1.65, 0.12, { rx: P, seg: 14 }), i.cyl(Q("paint"), "#f4ecd8", 0.13, 0.01, 0, 1.65, 0.15, { rx: P, seg: 14 }), i.push(0, 1.65, 0.16, 0, 0, -0.7), c(i, Q("paint"), x.ink, 0.015, 0.11, 5e-3, 0, 0.05, 0), i.pop(), h(i, -0.12, 0, -0.08, 0.12, 2.6, 0.08, { roof: true });
  } }, j.tidewater_pillarbox = { desc: "Victorian hexagonal pillar box (red, crowned cap with acanthus bud, VR cypher, posting slit, collection plate); collides.", params: {}, variants: 1, mount: "ground", build(i, $) {
    const n = "#c7372f";
    i.lathe("gloss", n, [[0.3, 0], [0.3, 0.1], [0.26, 0.14], [0.26, 1.2], [0.31, 1.26], [0.31, 1.32], [0.22, 1.42], [0.12, 1.5], [0.06, 1.6], [0, 1.66]], 0, 0, 0, { seg: 6, ry: C / 6 }), i.sph("gloss", n, 0.07, 0, 1.66, 0, { ws: 8, hs: 6 }), c(i, Q("gloss"), x.ink, 0.3, 0.035, 0.03, 0, 1.08, 0.24), c(i, "gloss", I(n, 1.1), 0.34, 0.06, 0.06, 0, 1.13, 0.24), c(i, Q("paint"), x.white, 0.18, 0.12, 0.01, 0, 0.8, 0.266), GA(i, "VR", { h: 0.09, x: 0, y: 0.5, z: 0.266, c: x.gold, flat: true, wt: 0.24, track: 0.1 }), h(i, -0.3, 0, -0.3, 0.3, 1.5, 0.3, { roof: true }), i.blob(0.9, 0.9);
  } }, j.tidewater_barometer = { desc: "The public barometer: a Portland-stone obelisk pillar on a stepped base with a big aneroid barometer dial (glows at dusk), a thermometer, a tide-time plaque and a gas lamp on top; collides (cover).", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.box("paint", x.granite, 1.1, 0.2, 1.1, 0, 0.1, 0, { r: 0.03 }), i.box("paint", x.stone, 0.9, 0.25, 0.9, 0, 0.32, 0, { r: 0.03 }), i.lathe("paint", x.stone, [[0.36, 0], [0.3, 2.3], [0.36, 2.34], [0.36, 2.44], [0, 2.44]], 0, 0.44, 0, { seg: 4, ry: C / 4 });
    for (let n = 0; n < 2; n++) {
      i.push(0, 0, 0, n * C), i.push(0, 1.9, 0.25, 0, -0.05), i.add(Q("glow"), Z(0.22, 24), "#f6eedb", 0, 0, 0.03, { glow: 0.8 }), i.tor("metal", x.bronze, 0.24, 0.03, 0, 0, 0.03, { rs: 4, ts: 24 });
      for (let d = 0; d < 9; d++) {
        const b = -2.2 + d / 8 * 4.4;
        i.push(Math.sin(b) * 0.17, Math.cos(b) * 0.17, 0.035, 0, 0, -b), c(i, Q("paint"), x.ink, 0.012, 0.04, 4e-3, 0, 0, 0), i.pop();
      }
      i.push(0, 0, 0.045, 0, 0, 0.6), c(i, Q("paint"), x.ink, 0.012, 0.18, 4e-3, 0, 0.07, 0), i.pop(), i.pop(), c(i, "metal", x.bronze, 0.1, 0.7, 0.03, 0, 1.2, 0.3), i.cyl(Q("paint"), x.red, 0.012, 0.5, 0, 1.15, 0.32, { seg: 4 }), c(i, "metal", x.bronze, 0.5, 0.3, 0.02, 0, 0.62, 0.36), i.pop();
    }
    dA(i, 0, 2.9, 0, 1), h(i, -0.45, 0, -0.45, 0.45, 2.9, 0.45, { roof: true }), i.blob(1.4, 1.4);
  } }, j.tidewater_boattrips = { desc: "BOAT TRIPS booking kiosk: hexagonal timber booth (2 m across) with a glazed hatch, fare boards, a bell-cast roof and a pennant; collides (cover).", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.lathe("paint", "#3f7fa0", [[1, 0], [1, 2.3], [0, 2.3]], 0, 0, 0, { seg: 6 });
    for (let b = 0; b < 6; b++) {
      const K = b / 6 * E, NA = Math.cos(K + C / 6) * 1 * 0.866, zA = Math.sin(K + C / 6) * 1 * 0.866;
      if (i.push(NA, 0, zA, P - K - C / 6), c(i, "paint", x.white, 1, 0.12, 0.04, 0, 0.1, 0.02), c(i, "paint", x.white, 1, 0.1, 0.04, 0, 2.3 - 0.05, 0.02), b === 1 || b === 4) c(i, Q("gloss"), x.glass, 0.7, 0.75, 0.02, 0, 1.45, 0.012), c(i, Q("glow"), x.lamp, 0.62, 0.2, 4e-3, 0, 1.7, 0.024, { glow: 0.8 }), i.box("wood", x.woodLt, 0.8, 0.05, 0.22, 0, 1.05, 0.11, { r: 0.01 });
      else {
        c(i, "paint", x.white, 0.72, 0.9, 0.02, 0, 1.3, 0.012);
        for (let L = 0; L < 5; L++) c(i, Q("paint"), "#1f3150", 0.55 - L % 2 * 0.12, 0.03, 4e-3, 0, 1.6 - L * 0.14, 0.024);
      }
      i.pop();
    }
    i.lathe("gloss", x.white, [[1 + 0.25, 0], [1 + 0.1, 0.15], [0.45, 0.6], [0.1, 0.9], [0, 0.95]], 0, 2.3, 0, { seg: 6 }), i.cyl("paint", x.white, 0.025, 0.9, 0, 2.3 + 1.3, 0, { seg: 5 }), i.flag(0, 2.3 + 1.72, 0, { color: "#3f7fa0", s: 1.2 }), i.push(0, 2.3 + 0.25, 1 + 0.2, 0, -0.35), i.box("paint", x.navy, 1.4, 0.3, 0.05, 0, 0, 0, { r: 0.02 }), GA(i, "BOAT TRIPS", { h: 0.14, x: 0, y: -0.07, z: 0.03, c: x.yellow, flat: true, wt: 0.22, track: 0.1 }), i.pop(), h(i, -0.9, 0, -0.9, 0.9, 2.3 + 0.6, 0.9, { roof: true }), i.blob(2.6, 2.6);
  } }, j.tidewater_urn = { desc: "Planted Portland-stone urn on a square pedestal (1.3 m), bedding flowers; collides.", params: { color: "flowers" }, variants: 1, mount: "ground", build(i, $) {
    i.box("paint", x.stone, 0.56, 0.72, 0.56, 0, 0.36, 0, { r: 0.03 }), c(i, "paint", x.trim, 0.66, 0.08, 0.66, 0, 0.76, 0), UA(i, 0, 0.8, 0, $.color ?? x.coral), h(i, -0.3, 0, -0.3, 0.3, 1.3, 0.3, { roof: true }), i.blob(0.9, 0.9);
  } }, j.tidewater_kerb = { desc: "Granite band laid in the paving along +X from pos (length, width w), 2 cm proud; non-colliding.", params: { length: "m", w: "m (0.36)" }, variants: 1, mount: "ground", build(i, $) {
    const n = $.length ?? 10, d = $.w ?? 0.36, b = Math.max(1, Math.round(n / 1.2));
    for (let K = 0; K < b; K++) i.box(Q("paint"), I(x.granite, 0.94 + 0.08 * (K * 7 % 3) / 2), n / b - 0.012, 0.03, d, (K + 0.5) * (n / b), 5e-3, 0, { r: 8e-3 });
  } }, j.tidewater_fingerpost = { desc: "Cast-iron fingerpost with a crown finial and three or four pointing arms (PIER, TOWN HALL, BANDSTAND, LIFEBOAT, TEA ROOMS, PROMENADE); arm angles via `arms` [[label, deg], …]. Post collides.", params: { arms: "[[label, yaw deg], …]" }, variants: 1, mount: "ground", build(i, $) {
    const n = x.iron, d = $.arms ?? [["PIER", 90], ["TOWN HALL", 180], ["BANDSTAND", 0]];
    i.lathe("gloss", n, [[0, 0], [0.16, 0], [0.16, 0.1], [0.1, 0.18], [0.07, 0.3], [0.06, 2.9], [0.08, 2.95], [0.08, 3.02], [0, 3.02]], 0, 0, 0, { seg: 8 }), i.tor(Q("gloss"), x.gold, 0.065, 0.014, 0, 0.5, 0, { rx: P, rs: 3, ts: 10 }), i.lathe("gloss", n, [[0, 0], [0.1, 0], [0.12, 0.08], [0.06, 0.16], [0.08, 0.24], [0, 0.3]], 0, 3.02, 0, { seg: 8 }), i.sph("metal", x.gold, 0.05, 0, 3.36, 0, { ws: 6, hs: 4 }), d.forEach(([b, K], NA) => {
      const zA = 2.68 - NA * 0.3;
      i.push(0, zA, 0, K * C / 180);
      const L = Math.max(0.7, b.length * 0.1 + 0.25);
      i.box("paint", x.white, L, 0.2, 0.04, L / 2 + 0.06, 0, 0, { r: 0.02 }), i.add("paint", PA(0.2, 0.14), x.white, L + 0.06, -0.1, 0, { rz: -P });
      for (const V of [1, -1]) i.push(L / 2 + 0.06, -0.055, V * 0.021, V > 0 ? 0 : C), GA(i, b, { h: 0.1, x: 0, y: 0, z: 1e-3, c: x.navy, flat: true, wt: 0.22, track: 0.08 }), i.pop();
      i.pop();
    }), h(i, -0.16, 0, -0.16, 0.16, 2.2, 0.16, { roof: true }), i.blob(0.6, 0.6);
  } }, j.tidewater_bollard = { desc: "Cast-iron cannon bollard (a muzzle-down old cannon, painted), collides; `count` of them along +X every `step` m.", params: { count: "1", step: "m (1.4)" }, variants: 1, mount: "ground", build(i, $) {
    const n = $.count ?? 1, d = $.step ?? 1.4;
    for (let b = 0; b < n; b++) {
      const K = b * d;
      i.lathe("gloss", x.ironDk, [[0, 0], [0.15, 0], [0.15, 0.05], [0.13, 0.08], [0.12, 0.62], [0.14, 0.66], [0.14, 0.72], [0.1, 0.78], [0.12, 0.84], [0.06, 0.92], [0, 0.93]], K, 0, 0, { seg: 10 }), i.tor(Q("gloss"), x.gold, 0.125, 0.012, K, 0.62, 0, { rx: P, rs: 3, ts: 10 }), h(i, K - 0.15, 0, -0.15, K + 0.15, 0.93, 0.15, { roof: true });
    }
  } }, j.tidewater_drain = { desc: "Round cast-iron gully cover / coal-hole plate flush in the paving (no collider).", params: { r: "m (0.3)" }, variants: 1, mount: "ground", build(i, $) {
    const n = $.r ?? 0.3;
    i.cyl(Q("metal"), "#3d4046", n, 0.02, 0, 5e-3, 0, { seg: 16 });
    for (let d = -2; d <= 2; d++) c(i, Q("metal"), "#2b2d31", n * 1.6 * Math.cos(Math.asin(Math.min(0.95, Math.abs(d) * 0.3))), 4e-3, 0.04, 0, 0.017, d * n * 0.3);
  } };
  function vA(i, $, n, d) {
    i.lathe("gloss", x.iron, [[0, 0], [0.14, 0], [0.14, 0.06], [0.09, 0.12], [0.06, 0.2], [0.05, 0.85], [0.07, 0.9], [0, 0.92]], $, n, d, { seg: 8 }), i.tor(Q("gloss"), x.gold, 0.055, 0.012, $, n + 0.3, d, { rx: P, rs: 3, ts: 8 }), dA(i, $, n + 0.9, d, 1);
  }
  j.tidewater_tree = { desc: "Pollarded London plane: mottled trunk with knuckled pollard heads, a cloud of leaf clusters (≈ 3.5 m up, 5 m across), a square cast-iron tree grate + hooped guard; the trunk collides.", params: { s: "size (1)" }, variants: 2, mount: "ground", build(i, $) {
    const n = $.s ?? 1, d = ($.variant ?? 0) % 2;
    c(i, Q("metal"), x.ironDk, 1.3, 0.02, 1.3, 0, 0.01, 0);
    for (let zA = -2; zA <= 2; zA++) c(i, Q("metal"), "#2a2d31", 1.2, 0.022, 0.03, 0, 0.012, zA * 0.22);
    for (let zA = 0; zA < 6; zA++) {
      const L = zA / 6 * E;
      i.cyl(Q("gloss"), x.iron, 0.015, 1, Math.cos(L) * 0.36, 0.5, Math.sin(L) * 0.36, { seg: 4 });
    }
    i.tor(Q("gloss"), x.iron, 0.36, 0.015, 0, 1, 0, { rx: P, rs: 3, ts: 14 }), i.tor(Q("gloss"), x.iron, 0.36, 0.012, 0, 0.55, 0, { rx: P, rs: 3, ts: 14 });
    const b = [g(0, 0, 0), g(0.05, 1.2, 0.02), g(-0.04, 2.4, 0.06), g(0.02, 3.2 * n, 0)];
    i.tube("wood", "#9c9580", b, (zA) => 0.2 - 0.07 * zA, { radial: 8 });
    for (let zA = 0; zA < 5; zA++) {
      const L = zA / 5 * E + d;
      i.tube("wood", "#a8a08a", [g(0.02, 3 * n, 0), g(Math.cos(L) * 0.6, 3.6 * n, Math.sin(L) * 0.6), g(Math.cos(L) * 1, 4.1 * n, Math.sin(L) * 1)], (V) => 0.1 - 0.05 * V, { radial: 5 }), i.sph("wood", "#8f8874", 0.11, Math.cos(L) * 1, 4.1 * n, Math.sin(L) * 1, { ws: 6, hs: 4 });
    }
    const K = A.mulberry32(17 + d * 7), NA = ["#5f9a52", "#6fa85c", "#4f8a4a", "#86b565"];
    for (let zA = 0; zA < 16; zA++) {
      const L = zA / 16 * E * 2.3 + K(), V = 0.35 + K() * 1.45, e = 4.3 + K() * 1.3 - V * 0.3 + (zA < 3 ? 0.6 : 0);
      i.add("foliage", VA(0.45 + K() * 0.3, 1, 3 + zA % 6), NA[zA % 4], Math.cos(L) * V, e * n, Math.sin(L) * V, { sy: 0.75 });
    }
    h(i, -0.25, 0, -0.25, 0.25, 3, 0.25, { roof: true }), h(i, -0.4, 0, -0.4, 0.4, 1.05, 0.4, { rail: true }), i.blob(3.6, 3.6);
  } }, j.tidewater_streetname = { desc: "Cast-iron street name plate on a wall (z = 0, pos = plate centre): white enamel, black letters, a coral key line, fixing bolts; text param.", params: { text: "TIDEWATER PLAZA", sub: "second line (optional)" }, variants: 1, mount: "wall", build(i, $) {
    const n = $.text ?? "TIDEWATER PLAZA", d = Math.max(1, n.length * 0.11 + 0.3), b = $.sub ? 0.44 : 0.32, K = !!$.bronze;
    if (i.box(K ? "metal" : "paint", K ? x.bronze : x.ink, d + 0.06, b + 0.06, 0.03, 0, 0, 0.015, { r: 0.02 }), i.box(K ? "metal" : "paint", K ? I(x.bronze, 0.8) : x.white, d, b, 0.02, 0, 0, 0.035, { r: 0.02 }), K) {
      GA(i, n, { h: 0.12, x: 0, y: $.sub ? 0 : -0.06, z: 0.046, c: "#f0d9a0", flat: true, wt: 0.2, track: 0.1, mat: "metal" }), $.sub && GA(i, $.sub, { h: 0.06, x: 0, y: -0.14, z: 0.046, c: "#f0d9a0", flat: true, wt: 0.24, track: 0.1, mat: "metal" });
      return;
    }
    c(i, Q("paint"), x.coral, d - 0.08, 0.012, 4e-3, 0, b / 2 - 0.05, 0.047), c(i, Q("paint"), x.coral, d - 0.08, 0.012, 4e-3, 0, -b / 2 + 0.05, 0.047), GA(i, n, { h: 0.12, x: 0, y: $.sub ? 0 : -0.06, z: 0.046, c: x.ink, flat: true, wt: 0.2, track: 0.1 }), $.sub && GA(i, $.sub, { h: 0.06, x: 0, y: -0.14, z: 0.046, c: x.coralDk, flat: true, wt: 0.24, track: 0.1 });
    for (const NA of [-1, 1]) i.cyl(Q("metal"), x.lead, 0.015, 0.01, NA * (d / 2 - 0.05), 0, 0.048, { rx: P, seg: 6 });
  } }, j.tidewater_gull = { desc: "Herring gull perched (pos = feet), faces +Z: white body, grey back + wings with black tips, yellow beak with a red spot, pink legs. variant 1 hunched, 2 calling. No collider.", params: {}, variants: 3, mount: "ground", build(i, $) {
    const n = ($.variant ?? 0) % 3;
    for (const d of [-0.035, 0.035]) i.cyl(Q("paint"), "#e8a6a0", 8e-3, 0.08, d, 0.04, 0, { seg: 3 });
    i.push(0, 0.1, 0, 0, n === 1 ? 0.1 : -0.25), i.add("paint", s("gullBody", () => T([[0, -0.16], [0.05, -0.14], [0.075, -0.06], [0.07, 0.06], [0.04, 0.14], [0, 0.17]], 7)), "#f4f2ec", 0, 0.05, 0, { rx: P });
    for (const d of [-1, 1]) i.push(d * 0.06, 0.08, -0.03, 0, 0, d * 0.25), c(i, Q("paint"), "#9aa3ab", 0.03, 0.05, 0.24, 0, 0, 0), c(i, Q("paint"), "#23262d", 0.028, 0.045, 0.07, 0, 0, -0.14), i.pop();
    i.pop(), i.push(0, n === 1 ? 0.2 : 0.24, 0.1, 0, n === 2 ? -0.7 : 0), i.sph("paint", "#f4f2ec", 0.05, 0, 0, 0, { ws: 7, hs: 5 }), i.cyl(Q("paint"), "#e9c24a", 0.012, 0.07, 0, -5e-3, 0.07, { rx: P, r2: 6e-3, seg: 4 });
    for (const d of [-1, 1]) i.sph(Q("paint"), "#1a1c20", 8e-3, d * 0.03, 0.015, 0.03, { ws: 4, hs: 3 });
    i.pop();
  } }, j.tidewater_rnlibox = { desc: "Lifeboat collection box: a little navy-and-orange lifeboat on a red pillar (collides, off-limits top).", params: {}, variants: 1, mount: "ground", build(i, $) {
    i.box("paint", "#b8403a", 0.5, 0.95, 0.5, 0, 0.475, 0, { r: 0.05 }), i.add("gloss", s("cbhull", () => O([[-0.34, 0], [0.34, 0], [0.4, 0.2], [-0.4, 0.2]], 0.9, 0.02)), x.navy, 0, 0.95, 0, {}), c(i, "paint", x.white, 0.9, 0.04, 0.72, 0, 1.17, 0), i.box("gloss", "#e8793a", 0.4, 0.18, 0.4, 0.1, 1.28, 0, { r: 0.03 }), GA(i, "LIFEBOATS", { h: 0.06, x: 0, y: 0.6, z: 0.252, c: x.white, flat: true, wt: 0.24, track: 0.08 }), h(i, -0.45, 0, -0.35, 0.45, 1.3, 0.35, { roof: true }), i.blob(0.9, 0.9);
  } };
  for (const i of Object.keys(j)) i.startsWith("tidewater_") && TA(j[i]);
}
const RN = Math.PI / 180, JN = (j, A, M) => [j[0] + A * Math.cos(M * RN), j[1] + A * Math.sin(M * RN)], O4 = (j, A) => Math.atan2(-(A[1] - j[1]), A[0] - j[0]), zw = (j, A) => Math.atan2(j, A), C4 = (j, A) => Math.hypot(A[0] - j[0], A[1] - j[1]), vO = VC(Jj.front, -Jj.deck), lg = (j, A, M) => {
  const N = vO[j];
  return [N.q0[0] + N.d[0] * M + N.n[0] * A, N.q0[1] + N.d[1] * M + N.n[1] * A];
}, gN = [];
{
  const j = yI.c, A = yI.rOut - 0.16, M = 181.9, N = yI.a1, I = 13, D = (N - M) / I;
  for (let O = 0; O < I; O++) {
    const z = JN(j, A, M + O * D), C = JN(j, A, M + (O + 1) * D);
    gN.push({ type: "tidewater_searail", pos: [z[0], 0, z[1]], rotY: O4(z, C), length: C4(z, C), col: false, p1: O === I - 1 });
  }
  const T = JN(j, A, N);
  gN.push({ type: "tidewater_searail", pos: [T[0], 0, T[1]], rotY: O4(T, [-9.55, -38.28]), length: C4(T, [-9.55, -38.28]), col: false, p0: false });
  const w = [186, 198, 210, 222].map((O) => JN(j, yI.rOut - 0.65, O));
  w.forEach((O, z) => {
    const C = [186, 198, 210, 222][z] * RN;
    gN.push({ type: "tidewater_lamp", pos: [O[0], 0, O[1]], variant: 1, rotY: Math.atan2(-Math.cos(C), -Math.sin(C)), baskets: true }), z < w.length - 1 && gN.push({ type: "bunting", pos: [O[0], 0, O[1]], rotY: O4(O, w[z + 1]), length: C4(O, w[z + 1]), height: 3.55, posts: false });
  });
  for (const O of [192, 204, 216]) {
    const z = JN(j, yI.rOut - 1.3, O);
    gN.push({ type: "tidewater_bench", pos: [z[0], 0, z[1]], rotY: zw(Math.cos(O * RN), Math.sin(O * RN)), segCol: 3 });
  }
  for (const O of [195.5, 213]) {
    const z = JN(j, yI.rOut - 0.72, O);
    gN.push({ type: "tidewater_telescope", pos: [z[0], 0, z[1]], rotY: zw(Math.cos(O * RN), Math.sin(O * RN)) });
  }
  for (const O of [189, 226]) {
    const z = JN(j, yI.rOut - 0.45, O);
    gN.push({ type: "lifering", pos: [z[0], 0, z[1]], rotY: zw(-Math.cos(O * RN), -Math.sin(O * RN)) });
  }
  {
    const z = JN(j, yI.rOut - 0.25, 183.6);
    gN.push({ type: "tidewater_tidegauge", pos: [z[0], 0, z[1]], rotY: zw(-Math.cos(183.6 * RN), -Math.sin(183.6 * RN)) });
  }
  for (const O of [201, 219]) {
    const z = JN(j, yI.rOut - 0.8, O);
    gN.push({ type: "trashbin", pos: [z[0], 0, z[1]], color: "#2f5d55" });
  }
  {
    const z = JN(j, yI.rOut - 2.6, 207);
    gN.push({ type: "deckchair", pos: [z[0], 0, z[1]], rotY: zw(Math.cos(207 * RN), Math.sin(207 * RN)) + 0.2, variant: 1 });
  }
  {
    const O = JN(j, A, 203.4);
    gN.push({ type: "tidewater_gull", pos: [O[0], 1.07, O[1]], rotY: 2 });
  }
  {
    const z = JN(j, yI.rOut - 0.65, 210), C = [-Math.sin(210 * RN), Math.cos(210 * RN)];
    gN.push({ type: "tidewater_gull", pos: [z[0] + C[0] * 0.45, 3.8, z[1] + C[1] * 0.45], rotY: 0.6 });
  }
}
{
  const j = /* @__PURE__ */ new Set([7, 8, 9, 16, 17, 18, 25, 26, 27, 34, 35, 0]), A = QI.rOut - 0.22;
  for (let N = 0; N < QI.n; N++) {
    if (j.has(N)) continue;
    const I = JN([0, 0], A, QI.a0 + N * 10), D = JN([0, 0], A, QI.a0 + (N + 1) * 10);
    gN.push({ type: "tidewater_balustrade", pos: [I[0], QI.top, I[1]], rotY: O4(I, D), length: C4(I, D), col: false, bay: 3, p0: j.has((N + 35) % 36), urns: N % 3 === 1 ? 1 : 0, mirror: false });
  }
  const M = JN([0, 0], A * Math.cos(5 * RN), 220);
  gN.push({ type: "tidewater_gull", pos: [M[0], QI.top + 0.95, M[1]], rotY: -0.9, variant: 1, mirror: false });
}
{
  [[0, 2.6, 0.5], [1, 2.6, 0.3], [1, 2.6, 0.72], [2, 2.7, 0.62]].forEach(([A, M, N], I) => {
    const D = lg(A, M, vO[A].len * N);
    gN.push({ type: "tidewater_cafe", pos: [D[0], Jj.deckTop, D[1]], variant: I % 2 });
  });
  for (const [A, M] of [[0, 0.22], [1, 0.5], [2, 0.3]]) {
    const N = vO[A], I = lg(A, Jj.deck - 0.35, N.len * M);
    gN.push({ type: "tidewater_bench", pos: [I[0], Jj.deckTop, I[1]], rotY: zw(-N.n[0], -N.n[1]), segCol: 3 });
  }
  {
    const A = lg(2, 1.2, vO[2].len - 0.9);
    gN.push({ type: "tidewater_telescope", pos: [A[0], Jj.deckTop, A[1]], rotY: 0.2 });
  }
  {
    const A = vO[1], M = lg(1, 0.08, A.len * 0.4);
    gN.push({ type: "tidewater_gull", pos: [M[0], Jj.deckTop + 1.03, M[1]], rotY: 1.9, variant: 1 });
  }
}
const Lj = (j, A, M) => ({ pos: [j, Sj, A], ...M }), US = [{ type: "tidewater_clocktower", pos: [0, QI.daisTop, 0], rotY: 0, top: 12.5 - QI.daisTop, mirror: false }, { type: "tidewater_townhall", pos: [0, 0, -45.4], rotY: 0, variant: 0, mirror: false }, { type: "tidewater_townhall", pos: [0, 0, 45.4], rotY: ej, variant: 1, mirror: false }, { type: "tidewater_townhallbase", pos: [0, Sj, 0], rotY: 0, variant: 0, mirror: false }, { type: "tidewater_townhallbase", pos: [0, Sj, 0], rotY: ej, variant: 1, mirror: false }, { type: "tidewater_colonnade", pos: [0, 0, 0] }, { type: "tidewater_arcadefront", pos: [0, 0, 0] }, { type: "tidewater_lifeboat", pos: [-19.6, 0, -41.2], rotY: ej / 4 }, { type: "tidewater_pier", pos: [-27, 0, 0], rotY: 0, variant: 0, mirror: false }, { type: "tidewater_pier", pos: [27, 0, 0], rotY: ej, variant: 1, mirror: false }, { type: "tidewater_balustrade", pos: [-4.65, 2.4, -36.2], length: 2.45, lamp1: true }, { type: "tidewater_balustrade", pos: [2.2, 2.4, -36.2], length: 2.45, lamp0: true }, { type: "tidewater_balustrade", pos: [-9.35, 2.4, -38.58], length: 4.5, urns: 1 }, { type: "tidewater_balustrade", pos: [4.85, 2.4, -38.58], length: 4.5, urns: 1 }, { type: "tidewater_balustrade", pos: [9.68, 2.4, -41.62], length: 4.42, p0: false, urns: 1 }, { type: "tidewater_balustrade", pos: [9.68, 2.4, -41.5], rotY: -ej / 2, length: 3, p0: false }, { type: "tidewater_balustrade", pos: [-9.33, 2.4, -45.25], rotY: -ej / 2, length: 6.85, col: false, urns: 2 }, { type: "tidewater_rampbal", pos: [-10.8, Sj, -35.9], rotY: 0, length: 6, ya: 0, yb: 2.6, skirtZ: 0.09 }, { type: "tidewater_rampbal", pos: [4.8, Sj, -35.9], rotY: 0, length: 6, ya: 2.6, yb: 0, skirtZ: 0.09 }, { type: "tidewater_rampbal", pos: [-2.12, Sj, -12.4], rotY: -ej / 2, length: 4.4, ya: 0, yb: 1.2, skirtZ: 0.11 }, { type: "tidewater_rampbal", pos: [2.12, Sj, -8], rotY: ej / 2, length: 4.4, ya: 1.2, yb: 0, skirtZ: 0.11 }, { type: "tidewater_rampbal", pos: [-8, Sj, -2.12], rotY: ej, length: 4.4, ya: 1.2, yb: 0, skirtZ: 0.11 }, { type: "tidewater_rampbal", pos: [-12.4, Sj, 2.12], rotY: 0, length: 4.4, ya: 0, yb: 1.2, skirtZ: 0.11 }, { type: "tidewater_rampbal", pos: [-1.2, Sj, -27.2], rotY: -ej / 2, length: 2.69, ya: 0, yb: 1, rail: false, skirtZ: 0.025 }, { type: "tidewater_rampbal", pos: [1.2, Sj, -24.51], rotY: ej / 2, length: 2.69, ya: 1, yb: 0, rail: false, skirtZ: 0.025 }, { type: "tidewater_rampbal", pos: [-1.2, Sj, -17.49], rotY: -ej / 2, length: 2.69, ya: 1, yb: 0, rail: false, skirtZ: 0.025 }, { type: "tidewater_rampbal", pos: [1.2, Sj, -14.8], rotY: ej / 2, length: 2.69, ya: 0, yb: 1, rail: false, skirtZ: 0.025 }, { type: "tidewater_rampbal", pos: [17.47, 0, MN.top], rotY: -ej / 2, length: MN.foot - MN.top, ya: Jj.deckTop, yb: 0, rail: false, skirtZ: 0 }, { type: "tidewater_rampbal", pos: [13.96, 0, -41.5], rotY: -ej / 2, length: 3.2, ya: 2.4, yb: 3.8, skirtZ: 0.13 }, { type: "tidewater_rampbal", pos: [20.01, 0, MN.foot], rotY: ej / 2, length: MN.foot - MN.top, ya: 0, yb: Jj.deckTop, rail: false, skirtZ: 0 }, { type: "tidewater_streetname", pos: [-2.914, 0.42, -8.006], rotY: -2.793, text: "JUBILEE", sub: "1887", bronze: true }, { type: "tidewater_streetname", pos: [-8.006, 0.42, -2.914], rotY: -1.92, text: "JUBILEE", sub: "1887", bronze: true }, { type: "tidewater_lamp", pos: [-5.1, QI.daisTop, -5.1], variant: 2 }, { type: "tidewater_lamp", pos: [5.1, QI.daisTop, -5.1], variant: 2 }, { type: "tidewater_bench", pos: [-3.95, QI.daisTop, -2.9], rotY: ej / 2, variant: 1, notIn: "zones" }, { type: "tidewater_kerb", ...Lj(-11.5, -37), length: 30.1 }, { type: "tidewater_kerb", ...Lj(-15, -25), length: 36 }, { type: "tidewater_kerb", ...Lj(-9, -37), rotY: -ej / 2, length: 12, w: 0.3 }, { type: "tidewater_kerb", ...Lj(9, -37), rotY: -ej / 2, length: 12, w: 0.3 }, { type: "tidewater_kerb", ...Lj(12.4, 0), length: 4.7 }, { type: "tidewater_kerb", ...Lj(10.8, -38.4), length: 3.15, w: 0.3 }, { type: "tidewater_fountain", ...Lj(0, -31) }, { type: "tidewater_bandstand", ...Lj(0, -21) }, { type: "tidewater_floralclock", ...Lj(-8.5, -25) }, { type: "tidewater_border", ...Lj(-12, -12), w: 6, d: 5, h: 0.9 }, { type: "tidewater_tearooms", ...Lj(10.5, -28), h: 3 }, { type: "tidewater_anchor", ...Lj(12.5, -17.5) }, { type: "tidewater_lamp", ...Lj(-6.5, -35.2), variant: 0 }, { type: "tidewater_lamp", ...Lj(6.5, -35.2), variant: 0 }, { type: "tidewater_lamp", ...Lj(-4.9, -26.6), variant: 0, baskets: true }, { type: "tidewater_lamp", ...Lj(4.9, -26.6), variant: 0, baskets: true, rotY: ej }, { type: "tidewater_lamp", ...Lj(6.2, -15.4), variant: 0 }, { type: "tidewater_lamp", ...Lj(-6.4, -15.8), variant: 0 }, { type: "bunting", ...Lj(-4.9, -26.6), rotY: 0, length: 9.8, height: 4.5, posts: false }, { type: "bunting", ...Lj(-6.5, -35.2), rotY: 0, length: 13, height: 4.4, posts: false }, { type: "tidewater_bench", ...Lj(-6.5, -20.5), rotY: ej / 2 }, { type: "tidewater_bench", ...Lj(6.5, -20.5), rotY: -ej / 2 }, { type: "tidewater_barometer", ...Lj(-5.4, -12.4) }, { type: "tidewater_pillarbox", ...Lj(5, -13.4) }, { type: "tidewater_boattrips", ...Lj(12.6, -9.8) }, { type: "tidewater_urn", ...Lj(15.3, -31.6) }, { type: "tidewater_urn", ...Lj(-15.2, -17.4), color: "#9a6ac2" }, { type: "tidewater_tree", ...Lj(8, -33.6), variant: 1, s: 0.95 }, { type: "tidewater_tree", ...Lj(-10, -18.8), variant: 0 }, { type: "tidewater_fingerpost", ...Lj(-6.6, -33.8), arms: [["PROMENADE", 150], ["TOWN HALL", -90], ["BANDSTAND", 90], ["LIFEBOAT", -150]] }, { type: "tidewater_fingerpost", ...Lj(14.6, -12.8), arms: [["CRESCENT", -20], ["TOWN HALL", -95], ["PIER", 180]] }, { type: "tidewater_bollard", ...Lj(16.4, -8.6), rotY: -ej / 2, count: 3, step: 1.3 }, { type: "tidewater_drain", ...Lj(-2.4, -27.8) }, { type: "tidewater_drain", ...Lj(8.6, -19.6) }, { type: "tidewater_drain", ...Lj(-9.3, -6.2) }, { type: "tidewater_drain", ...Lj(3.2, -36.2), r: 0.25 }, { type: "tidewater_drain", ...Lj(-14.2, -4.3), r: 0.25 }, { type: "tidewater_gull", ...Lj(0.44, -31.25), pos: [0.44, Sj + 2.33, -31.25], rotY: -0.8, variant: 2 }, { type: "tidewater_streetname", pos: [13.9, 2.1, -37.35], rotY: -ej / 2, text: "TIDEWATER PLAZA", sub: "BOROUGH OF TIDEWATER" }, { type: "tidewater_streetname", pos: [9.5, 1.7, -39.2], rotY: ej / 2, text: "HALL LANE" }, { type: "tidewater_streetname", pos: [17.5, 2.6, -17], rotY: -ej / 2, text: "THE CRESCENT" }, { type: "tidewater_shelter", pos: [-20.5, 0, -19] }, { type: "tidewater_icecream", pos: [-23.6, 0, -9] }, { type: "cart", pos: [-19.6, 0, -12.6], rotY: ej / 2, variant: 0 }, { type: "tidewater_punchjudy", pos: [-14.4, 0, -30.4], rotY: ej }, { type: "deckchair", pos: [-13.4, 0, -32.9], rotY: 0.15, variant: 1 }, { type: "deckchair", pos: [-15.8, 0, -32.6], rotY: -0.3 }, { type: "tidewater_rnlibox", pos: [-11.9, 0, -35.4], rotY: -0.5 }, { type: "tidewater_streetname", pos: [-24, 2.1, -4], rotY: ej / 2, text: "MARINE PARADE" }, { type: "tidewater_gull", pos: [-24.45, 3.15, -4], rotY: 2.2, variant: 2 }, { type: "tidewater_searail", pos: [-26.87, 0, 5.5], rotY: -ej / 2, length: 3.5, col: false }, { type: "tidewater_lamp", pos: [-18.2, 0, 7.6], variant: 0, baskets: true }, { type: "tidewater_bench", pos: [-25.9, 0, 7.2], rotY: ej / 2 }, ...gN], YS = Object.freeze(Object.defineProperty({ __proto__: null, PLACEMENTS: US, register: kS }, Symbol.toStringTag, { value: "Module" })), FI = "#27304d", DT = "#f3ead6", Mw = "#d9735f", cS = "#3f8f86", ti = "#c9a453", yO = "#e3b54c", sS = "#e98aa6";
function MU(j) {
  let A = j >>> 0;
  return () => {
    A = A + 1831565813 | 0;
    let M = Math.imul(A ^ A >>> 15, 1 | A);
    return M = M + Math.imul(M ^ M >>> 7, 61 | M) ^ M, ((M ^ M >>> 14) >>> 0) / 4294967296;
  };
}
function bi(j, A, M, N, I, D, T, w, O) {
  j.save(), j.font = w, j.fillStyle = O, j.textAlign = "center", j.textBaseline = "middle";
  const z = A.length;
  for (let C = 0; C < z; C++) {
    const E = D + (C + 0.5) / z * T;
    j.save(), j.translate(M + Math.cos(E) * I, N + Math.sin(E) * I), j.rotate(E + Math.PI / 2), j.fillText(A[C], 0, 0), j.restore();
  }
  j.restore();
}
function li(j, A, M, N, I, D, T) {
  const w = MU(T);
  j.save(), j.globalCompositeOperation = "source-atop";
  for (let O = M; O < M + I; O += D) for (let z = A + (O / D % 2 ? D / 2 : 0) - D; z < A + N; z += D) {
    const C = w();
    j.fillStyle = C < 0.5 ? `rgba(0,0,0,${0.06 * C})` : `rgba(255,255,255,${0.1 * (C - 0.5)})`, j.fillRect(z, O, D, D);
  }
  j.strokeStyle = "rgba(40,30,20,0.28)", j.lineWidth = 1, j.beginPath();
  for (let O = M; O <= M + I; O += D) j.moveTo(A, O), j.lineTo(A + N, O);
  for (let O = M; O < M + I; O += D) for (let z = A + (O / D % 2 ? D / 2 : 0); z <= A + N; z += D) j.moveTo(z, O), j.lineTo(z, O + D);
  j.stroke(), j.restore();
}
function oS(j, A, M, N, I, D, T, w) {
  j.fillStyle = w, j.beginPath(), j.arc(A, M, I, 0, Math.PI * 2), j.arc(A, M, N, 0, Math.PI * 2, true), j.fill(), j.fillStyle = T;
  const O = (N + I) / 2, z = (I - N) / 2;
  for (let C = 0; C < D; C++) {
    const E = C / D * Math.PI * 2, P = Math.PI * 2 / D;
    j.beginPath();
    for (let g = 0; g <= 12; g++) {
      const Q = g / 12, x = E + Q * P * 0.95, U = O - z * 0.85 + z * 1.7 * Math.pow(Math.sin(Q * Math.PI * 0.5), 1.5) * (Q < 0.75 ? 1 : 1 - (Q - 0.75) * 2.4), k = A + Math.cos(x) * U, s = M + Math.sin(x) * U;
      g === 0 ? j.moveTo(k, s) : j.lineTo(k, s);
    }
    j.lineTo(A + Math.cos(E + P * 0.95) * (O - z * 0.85), M + Math.sin(E + P * 0.95) * (O - z * 0.85)), j.closePath(), j.fill();
  }
}
function di(j, A, M, N, I, D, T, w, O) {
  for (let z = 0; z < N; z++) {
    const C = T + z / N * Math.PI * 2, E = Math.PI / N;
    j.fillStyle = w, j.beginPath(), j.moveTo(A, M), j.lineTo(A + Math.cos(C) * I, M + Math.sin(C) * I), j.lineTo(A + Math.cos(C + E) * D, M + Math.sin(C + E) * D), j.closePath(), j.fill(), j.fillStyle = O, j.beginPath(), j.moveTo(A, M), j.lineTo(A + Math.cos(C) * I, M + Math.sin(C) * I), j.lineTo(A + Math.cos(C - E) * D, M + Math.sin(C - E) * D), j.closePath(), j.fill();
  }
}
function TT(j, A, M, N, I, D, T, w = 0.5) {
  const O = MU(T);
  j.save(), j.beginPath(), j.rect(A, M, N, I), j.clip(), j.globalCompositeOperation = "destination-out";
  for (let z = 0; z < D; z++) {
    j.fillStyle = `rgba(0,0,0,${w * (0.3 + 0.7 * O())})`;
    const C = 0.6 + O() * O() * 3;
    j.beginPath(), j.ellipse(A + O() * N, M + O() * I, C * (0.6 + O()), C * (0.6 + O()), O() * 3, 0, Math.PI * 2), j.fill();
  }
  for (let z = 0; z < 8; z++) {
    const C = j.createRadialGradient(0, 0, 0, 0, 0, 1);
    C.addColorStop(0, `rgba(0,0,0,${0.25 * w})`), C.addColorStop(1, "rgba(0,0,0,0)"), j.save(), j.translate(A + O() * N, M + O() * I), j.scale(20 + O() * 60, 12 + O() * 40), j.fillStyle = C, j.beginPath(), j.arc(0, 0, 1, 0, Math.PI * 2), j.fill(), j.restore();
  }
  j.restore();
}
function Ey(j, A, M, N, I, D, T, w, O = 10) {
  j.beginPath(), j.moveTo(A + O, M), j.arcTo(A + N, M, A + N, M + I, O), j.arcTo(A + N, M + I, A, M + I, O), j.arcTo(A, M + I, A, M, O), j.arcTo(A, M, A + N, M, O), j.closePath(), D && (j.fillStyle = D, j.fill()), T && (j.lineWidth = w, j.strokeStyle = T, j.stroke());
}
function uS(j, A, M, N, I) {
  let D = N;
  for (j.font = I(D); j.measureText(A).width > M && D > 8; ) D -= 2, j.font = I(D);
  return D;
}
function vS(j, A, M) {
  const { font: N, fontB: I } = M, D = A.x, T = A.y, w = [];
  {
    const O = { x: D, y: T, w: 512, h: 512 }, z = O.x + 256, C = O.y + 256, E = 256 / 5;
    j.save(), j.fillStyle = DT, j.beginPath(), j.arc(z, C, 4.95 * E, 0, Math.PI * 2), j.fill(), j.strokeStyle = FI, j.lineWidth = 0.1 * E, j.beginPath(), j.arc(z, C, 4.85 * E, 0, Math.PI * 2), j.stroke(), j.beginPath(), j.arc(z, C, 4.05 * E, 0, Math.PI * 2), j.stroke(), bi(j, "· BOROUGH OF TIDEWATER · SALUS PER MARE ", z, C, 4.45 * E, -Math.PI / 2 - 1.3, Math.PI * 2 - 0.1, `800 ${Math.round(0.5 * E)}px Rubik, 'Arial Black', sans-serif`, FI), oS(j, z, C, 3.35 * E, 3.95 * E, 22, Mw, DT), j.strokeStyle = FI, j.lineWidth = 0.06 * E, j.beginPath(), j.arc(z, C, 3.3 * E, 0, Math.PI * 2), j.stroke(), j.fillStyle = cS, j.beginPath(), j.arc(z, C, 3.28 * E, 0, Math.PI * 2), j.fill(), di(j, z, C, 8, 3.25 * E, 1 * E, -Math.PI / 2, yO, "#c79a36"), di(j, z, C, 4, 3.25 * E, 0.9 * E, -Math.PI / 2, DT, "#d9ccb2"), j.font = N(Math.round(0.55 * E)), j.fillStyle = FI, j.textAlign = "center", j.textBaseline = "middle";
    for (const [P, g] of [["N", -Math.PI / 2], ["E", 0], ["S", Math.PI / 2], ["W", Math.PI]]) j.save(), j.translate(z + Math.cos(g) * 3.62 * E, C + Math.sin(g) * 3.62 * E), j.rotate(g + Math.PI / 2), j.fillStyle = Mw, j.fillText(P, 0, 0), j.restore();
    j.fillStyle = FI, j.beginPath(), j.arc(z, C, 2.55 * E, 0, Math.PI * 2), j.fill(), li(j, O.x, O.y, O.w, O.h, 5, 41), TT(j, O.x, O.y, O.w, O.h, 900, 43, 0.35), j.restore(), w.push({ id: 4, ...O, place: [10, 10, 1, 10], fx: [0.55, 0.25] });
  }
  {
    const O = { x: D + 512, y: T, w: 384, h: 384 }, z = O.x + 192, C = O.y + 192, E = 192 / 4;
    j.save(), j.fillStyle = FI, j.beginPath(), j.arc(z, C, 3.95 * E, 0, Math.PI * 2), j.arc(z, C, 2.55 * E, 0, Math.PI * 2, true), j.fill(), j.strokeStyle = ti, j.lineWidth = 0.07 * E;
    for (const P of [3.85, 2.65]) j.beginPath(), j.arc(z, C, P * E, 0, Math.PI * 2), j.stroke();
    bi(j, "JUBILEE TERRACE · MDCCCLXXXVII · ", z, C, 3.25 * E, -Math.PI / 2 - 0.9, Math.PI * 2 - 0.05, `800 ${Math.round(0.46 * E)}px Rubik, 'Arial Black', sans-serif`, DT);
    for (let P = 0; P < 4; P++) {
      const g = Math.PI / 4 + P * Math.PI / 2, Q = z + Math.cos(g) * 3.25 * E, x = C + Math.sin(g) * 3.25 * E;
      j.fillStyle = Mw;
      for (let U = 0; U < 6; U++) {
        const k = U / 6 * Math.PI * 2;
        j.beginPath(), j.ellipse(Q + Math.cos(k) * 0.14 * E, x + Math.sin(k) * 0.14 * E, 0.12 * E, 0.07 * E, k, 0, Math.PI * 2), j.fill();
      }
      j.fillStyle = yO, j.beginPath(), j.arc(Q, x, 0.08 * E, 0, Math.PI * 2), j.fill();
    }
    li(j, O.x, O.y, O.w, O.h, 5, 51), TT(j, O.x, O.y, O.w, O.h, 600, 53, 0.3), j.restore(), w.push({ id: 5, ...O, place: [1.8, 8, 1.8, 8], fx: [0.55, 0.25] });
  }
  {
    const O = { x: D + 896, y: T, w: 1024, h: 116 };
    j.save(), Ey(j, O.x + 6, O.y + 8, O.w - 12, O.h - 16, "rgba(236,228,210,0.95)", "rgba(120,108,90,0.9)", 5, 6), j.font = N(70), j.textAlign = "center", j.textBaseline = "middle", j.fillStyle = "rgba(255,255,255,0.7)", j.fillText("JUBILEE  TERRACE", O.x + O.w / 2 + 2, O.y + O.h / 2 + 5), j.fillStyle = "#34405c", j.fillText("JUBILEE  TERRACE", O.x + O.w / 2, O.y + O.h / 2 + 2);
    for (const z of [O.x + 60, O.x + O.w - 60]) j.fillStyle = Mw, j.beginPath(), j.arc(z, O.y + O.h / 2, 22, 0, Math.PI * 2), j.fill(), j.fillStyle = "#34405c", j.beginPath(), j.arc(z, O.y + O.h / 2, 10, 0, Math.PI * 2), j.fill();
    TT(j, O.x, O.y, O.w, O.h, 500, 61, 0.4), j.restore(), w.push({ id: 6, ...O, place: [8.6, 7.8, 0.2, 0.8], fx: [0.7, 0.5] });
  }
  {
    const O = { x: D + 896, y: T + 128, w: 448, h: 314 }, z = O.x + 70, C = O.y + 26, E = O.w - 140, P = O.h - 40;
    j.save(), j.fillStyle = "#f4ead2", j.fillRect(z - 8, C - 8, E + 16, P + 16), j.save(), j.beginPath(), j.rect(z, C, E, P), j.clip();
    const g = j.createLinearGradient(0, C, 0, C + P * 0.6);
    g.addColorStop(0, "#f2b879"), g.addColorStop(1, "#fbe3b0"), j.fillStyle = g, j.fillRect(z, C, E, P), j.fillStyle = "rgba(255,240,200,0.8)";
    for (let Q = 0; Q < 12; Q++) {
      const x = Math.PI + Q / 11 * Math.PI;
      j.beginPath(), j.moveTo(z + E * 0.5, C + P * 0.56), j.lineTo(z + E * 0.5 + Math.cos(x - 0.05) * 400, C + P * 0.56 + Math.sin(x - 0.05) * 400), j.lineTo(z + E * 0.5 + Math.cos(x + 0.05) * 400, C + P * 0.56 + Math.sin(x + 0.05) * 400), j.fill();
    }
    j.fillStyle = "#f7d27a", j.beginPath(), j.arc(z + E * 0.5, C + P * 0.56, 34, 0, Math.PI * 2), j.fill();
    for (let Q = 0; Q < 5; Q++) j.fillStyle = ["#3f8fa0", "#4f9fb0", "#357f92", "#2f6f86", "#27607a"][Q], j.fillRect(z, C + P * 0.56 + Q * 18, E, 18);
    j.fillStyle = "#2c3346", j.fillRect(z + 20, C + P * 0.52, 150, 5);
    for (let Q = z + 24; Q < z + 170; Q += 12) j.fillRect(Q, C + P * 0.52, 2, 18);
    j.beginPath(), j.moveTo(z + 20, C + P * 0.52), j.lineTo(z + 20, C + P * 0.42), j.quadraticCurveTo(z + 45, C + P * 0.3, z + 70, C + P * 0.42), j.lineTo(z + 70, C + P * 0.52), j.fill(), j.fillRect(z + E - 70, C + P * 0.2, 24, P * 0.4), j.beginPath(), j.moveTo(z + E - 74, C + P * 0.2), j.quadraticCurveTo(z + E - 58, C + P * 0.05, z + E - 42, C + P * 0.2), j.fill(), j.fillStyle = "#f4ead2", j.beginPath(), j.arc(z + E - 58, C + P * 0.26, 7, 0, Math.PI * 2), j.fill(), j.fillStyle = "#f0d9a8", j.fillRect(z, C + P * 0.86, E, P * 0.14);
    for (let Q = 0; Q < 5; Q++) {
      const x = z + 30 + Q * 55;
      j.fillStyle = Q % 2 ? Mw : FI, j.beginPath(), j.arc(x, C + P * 0.86, 16, Math.PI, 0), j.fill(), j.fillStyle = "#2c3346", j.fillRect(x - 1, C + P * 0.86, 2, 14);
    }
    j.restore(), j.fillStyle = FI, j.fillRect(z, C, E, 56), uS(j, "TIDEWATER", E - 30, 44, N), j.fillStyle = DT, j.textAlign = "center", j.textBaseline = "middle", j.fillText("TIDEWATER", z + E / 2, C + 30), j.fillStyle = FI, j.fillRect(z, C + P - 34, E, 34), j.font = I(17), j.fillStyle = yO, j.fillText("FOR SUN, SEA & BANDS  ·  IT'S QUICKER BY RAIL", z + E / 2, C + P - 17), TT(j, z - 8, C - 8, E + 16, P + 16, 1400, 71, 0.55), j.restore(), w.push({ id: 7, ...O, m: [4.5, 3.15], fx: [0.8, 0.9] });
  }
  {
    const O = { x: D + 1344, y: T + 128, w: 256, h: 246 };
    j.save();
    for (let E = 0; E < 13; E++) j.fillStyle = E % 2 ? "#fbf3e4" : sS, j.fillRect(O.x + E * 20, O.y + O.h - 70, 20, 60);
    j.fillStyle = "#fbf3e4";
    for (let E = 0; E < 13; E++) j.beginPath(), j.arc(O.x + 10 + E * 20, O.y + O.h - 70, 10, Math.PI, 0), j.fill();
    const z = O.x + 128, C = O.y + 120;
    j.fillStyle = "#d9a55c", j.beginPath(), j.moveTo(z - 34, C - 10), j.lineTo(z + 34, C - 10), j.lineTo(z, C + 70), j.closePath(), j.fill(), j.strokeStyle = "#b98543", j.lineWidth = 3;
    for (let E = -3; E <= 3; E++) j.beginPath(), j.moveTo(z + E * 11 - 20, C - 10), j.lineTo(z + E * 11 + 16, C + 50), j.stroke();
    j.fillStyle = "#fbf3df";
    for (const [E, P, g] of [[0, -22, 36], [-20, -40, 22], [18, -44, 24], [0, -62, 18]]) j.beginPath(), j.arc(z + E, C + P, g, 0, Math.PI * 2), j.fill();
    j.fillStyle = "#5a3522", j.save(), j.translate(z + 16, C - 70), j.rotate(0.4), j.fillRect(-5, -30, 10, 34), j.restore(), j.fillStyle = "#e25a6d", j.beginPath(), j.arc(z - 16, C - 58, 8, 0, Math.PI * 2), j.fill(), j.font = N(34), j.textAlign = "center", j.textBaseline = "middle", j.lineWidth = 6, j.strokeStyle = "#fbf3e4", j.strokeText("ICES", z, O.y + 30), j.fillStyle = "#b83a5e", j.fillText("ICES", z, O.y + 30), j.font = I(16), j.fillStyle = FI, j.fillText("SOFT SERVE  ·  99s  ·  LOLLIES", z, O.y + O.h - 88), TT(j, O.x, O.y, O.w, O.h, 500, 81, 0.35), j.restore(), w.push({ id: 8, ...O, m: [2.6, 2.5], fx: [0.8, 0.9] });
  }
  {
    const O = { x: D + 1600, y: T + 128, w: 224, h: 261 };
    j.save(), j.globalAlpha = 0.82, Ey(j, O.x + 10, O.y + 16, O.w - 20, O.h - 60, "#7a2f45", null, 0, 4), j.textAlign = "center", j.textBaseline = "middle", j.font = I(26), j.fillStyle = "#f1e4c8", j.fillText("TIDEWATER", O.x + O.w / 2, O.y + 48), j.font = N(76), j.fillStyle = "#f7d9e0", j.fillText("ROCK", O.x + O.w / 2, O.y + 112), j.fillStyle = "#f1e4c8", j.fillRect(O.x + 30, O.y + 150, O.w - 60, 4), j.font = I(17), j.fillText("LETTERED ALL THROUGH", O.x + O.w / 2, O.y + 172), j.font = N(28), j.fillStyle = yO, j.fillText("1d", O.x + O.w / 2, O.y + 202), j.globalAlpha = 1, TT(j, O.x, O.y, O.w, O.h, 1600, 91, 0.7), j.restore(), w.push({ id: 9, ...O, m: [3, 3.5], fx: [0.9, 1] });
  }
  {
    const O = { x: D, y: T + 520, w: 1024, h: 116 };
    j.save(), j.font = N(78), j.textAlign = "center", j.textBaseline = "middle", j.fillStyle = "rgba(255,255,255,0.6)", j.fillText("T I D E W A T E R", O.x + O.w / 2 + 2, O.y + O.h / 2 + 5), j.fillStyle = "#3e4a63", j.fillText("T I D E W A T E R", O.x + O.w / 2, O.y + O.h / 2 + 2), TT(j, O.x, O.y, O.w, O.h, 400, 101, 0.4), j.restore(), w.push({ id: 10, ...O, place: [5.5, 7, 0.2, 0.8], fx: [0.7, 0.5] });
  }
  {
    const O = { x: D + 1024, y: T + 520, w: 300, h: 260 }, z = O.x + 60, C = O.y + 40, E = 180, P = 130;
    j.save(), Ey(j, z, C, E, P, FI, ti, 6, 12), j.textAlign = "center", j.textBaseline = "middle", j.font = N(30), j.fillStyle = DT, j.fillText("PIER TOLL", z + E / 2, C + 32), j.font = N(44), j.fillStyle = yO, j.fillText("2d", z + E / 2, C + 74), j.font = I(14), j.fillStyle = DT, j.fillText("OPEN 9 TILL DUSK", z + E / 2, C + 110), j.fillStyle = Mw, j.beginPath(), j.moveTo(z + 30, C + P + 30), j.lineTo(z + 130, C + P + 30), j.lineTo(z + 130, C + P + 16), j.lineTo(z + 160, C + P + 38), j.lineTo(z + 130, C + P + 60), j.lineTo(z + 130, C + P + 46), j.lineTo(z + 30, C + P + 46), j.closePath(), j.fill(), j.font = I(13), j.fillStyle = DT, j.fillText("TO THE PIER", z + 80, C + P + 38), TT(j, O.x, O.y, O.w, O.h, 500, 111, 0.4), j.restore(), w.push({ id: 11, ...O, m: [3, 2.6], fx: [0.8, 0.9] });
  }
  return w;
}
const SS = Object.freeze(Object.defineProperty({ __proto__: null, drawMurals: vS }, Symbol.toStringTag, { value: "Module" })), AP = { tidewater: { ...LS, ...YS, ...xS, ...SS } }, SD = new DA(), jw = new DA(), BS = new DA(0, 1, 0);
class rS {
  constructor(A, M = []) {
    this.extra = M, this.layout = A, this.bounds = A.bounds, this.spawnPads = A.spawnPads.map((N) => new DA(...N)), this.spawnBarrier = A.spawnBarrier, this.blocks = [], this.faces = [], this._stamp = 1, this._build();
  }
  _build() {
    const A = this.layout, M = [...A.single, ...A.half, ...A.half.map(aS), ...this.extra.map((N) => N.obox ? { kind: "obox", center: N.center, size: N.size, rotY: N.rotY, paint: false, hidden: true, color: "#888888", roof: !!N.roof, rail: !!N.rail, perch: !!N.perch } : { kind: "box", min: N.min, max: N.max, paint: false, hidden: true, color: "#888888", roof: !!N.roof, rail: !!N.rail, perch: !!N.perch })];
    for (const N of M) this._addBlock(N);
    this.hasRails = this.blocks.some((N) => N.rail), this._buildHash();
    for (const N of this.blocks) this._buildFaces(N);
  }
  _addBlock(A) {
    const M = { id: this.blocks.length, center: new DA(), half: new DA(), axes: [new DA(1, 0, 0), new DA(0, 1, 0), new DA(0, 0, 1)], aabbMin: new DA(), aabbMax: new DA(), paint: A.paint !== false && !A.grate && !A.rail, solid: A.solid !== false, color: new lA(A.color || "#dddddd"), pattern: A.pattern ?? VI.plain, tag: A.tag || null, mural: A.mural || null, noPaint: A.noPaint || null, grate: !!A.grate || !!A.rail, roof: !!A.roof, perch: !!A.perch, noNav: !!A.noNav, rail: !!A.rail, hidden: !!A.hidden || !!A.rail, bevel: A.bevel, faces: [-1, -1, -1, -1, -1, -1], aligned: true };
    if (A.kind === "box") M.center.set((A.min[0] + A.max[0]) / 2, (A.min[1] + A.max[1]) / 2, (A.min[2] + A.max[2]) / 2), M.half.set((A.max[0] - A.min[0]) / 2, (A.max[1] - A.min[1]) / 2, (A.max[2] - A.min[2]) / 2);
    else if (A.kind === "obox") {
      const N = A.rotY * Math.PI / 180, I = Math.cos(N), D = Math.sin(N);
      M.center.set(A.center[0], A.center[1], A.center[2]), M.half.set(A.size[0] / 2, A.size[1] / 2, A.size[2] / 2), M.axes = [new DA(I, 0, -D), new DA(0, 1, 0), new DA(D, 0, I)], M.aligned = false;
    } else {
      const N = new DA(...A.low), I = new DA(...A.high), D = I.clone().sub(N), T = D.length();
      D.normalize();
      const w = new DA(D.x, 0, D.z).normalize(), O = new DA().crossVectors(BS, w).normalize(), z = new DA().crossVectors(D, O).normalize();
      z.y < 0 && (z.negate(), O.negate());
      const C = z.y, E = I.y - N.y, P = A.thin ? A.thickness : Math.max(A.thickness, E * C + 0.35), g = 0.6, x = N.clone().addScaledVector(D, -g).clone().add(I).multiplyScalar(0.5);
      M.center.copy(x).addScaledVector(z, -P / 2), M.half.set(A.width / 2, P / 2, (T + g) / 2), M.axes = [O, z, D], M.aligned = false, new DA().crossVectors(O, z).dot(D) < 0 && M.axes[0].negate();
    }
    M.aabbMin.set(1 / 0, 1 / 0, 1 / 0), M.aabbMax.set(-1 / 0, -1 / 0, -1 / 0);
    for (let N = 0; N < 8; N++) SD.copy(M.center).addScaledVector(M.axes[0], (N & 1 ? 1 : -1) * M.half.x).addScaledVector(M.axes[1], (N & 2 ? 1 : -1) * M.half.y).addScaledVector(M.axes[2], (N & 4 ? 1 : -1) * M.half.z), M.aabbMin.min(SD), M.aabbMax.max(SD);
    this.blocks.push(M);
  }
  _buildHash() {
    const A = this.hashCell = 4, M = this.bounds;
    this.hx0 = M.minX - 8, this.hz0 = M.minZ - 8, this.hw = Math.ceil((M.maxX - M.minX + 16) / A), this.hd = Math.ceil((M.maxZ - M.minZ + 16) / A), this.hash = Array.from({ length: this.hw * this.hd }, () => []), this.blockStamp = new Uint32Array(this.blocks.length);
    for (const N of this.blocks) {
      const I = this._hxi(N.aabbMin.x), D = this._hxi(N.aabbMax.x), T = this._hzi(N.aabbMin.z), w = this._hzi(N.aabbMax.z);
      for (let O = T; O <= w; O++) for (let z = I; z <= D; z++) this.hash[O * this.hw + z].push(N.id);
    }
  }
  _hxi(A) {
    return Math.max(0, Math.min(this.hw - 1, Math.floor((A - this.hx0) / this.hashCell)));
  }
  _hzi(A) {
    return Math.max(0, Math.min(this.hd - 1, Math.floor((A - this.hz0) / this.hashCell)));
  }
  queryBlocks(A, M, N, I, D) {
    D.length = 0;
    const T = ++this._stamp, w = this._hxi(A), O = this._hxi(N), z = this._hzi(M), C = this._hzi(I);
    for (let E = z; E <= C; E++) for (let P = w; P <= O; P++) {
      const g = this.hash[E * this.hw + P];
      for (let Q = 0; Q < g.length; Q++) {
        const x = g[Q];
        this.blockStamp[x] !== T && (this.blockStamp[x] = T, D.push(x));
      }
    }
    return D;
  }
  pointInBlock(A, M, N = 0) {
    return jw.copy(M).sub(A.center), Math.abs(jw.dot(A.axes[0])) < A.half.x + N && Math.abs(jw.dot(A.axes[1])) < A.half.y + N && Math.abs(jw.dot(A.axes[2])) < A.half.z + N;
  }
  pointInside(A, M = 0, N = -1) {
    const I = this.queryBlocks(A.x - 0.01, A.z - 0.01, A.x + 0.01, A.z + 0.01, this._qtmp || (this._qtmp = []));
    for (const D of I) {
      if (D === N) continue;
      const T = this.blocks[D];
      if (T.solid && this.pointInBlock(T, A, M)) return true;
    }
    return false;
  }
  _buildFaces(A) {
    if (A.hidden) return;
    const M = A.axes, N = [A.half.x, A.half.y, A.half.z];
    for (let I = 0; I < 3; I++) for (const D of [1, -1]) {
      const T = M[I].clone().multiplyScalar(D);
      if (T.y < -0.5 && A.center.y - N[1] < 0.5) continue;
      const w = [0, 1, 2].filter((U) => U !== I);
      let O, z;
      Math.abs(T.y) < 0.5 ? (z = Math.abs(M[w[0]].y) > Math.abs(M[w[1]].y) ? w[0] : w[1], O = w[0] === z ? w[1] : w[0]) : (O = Math.abs(M[w[0]].x) >= Math.abs(M[w[1]].x) ? w[0] : w[1], z = w[0] === O ? w[1] : w[0]);
      const C = M[z].clone();
      Math.abs(T.y) < 0.5 ? C.y < 0 && C.negate() : C.z < 0 && Math.abs(C.z) > 0.3 && C.negate();
      const E = new DA().crossVectors(C, T), P = 2 * N[O], g = 2 * N[z], Q = A.center.clone().addScaledVector(T, N[I]).addScaledVector(E, -P / 2).addScaledVector(C, -g / 2), x = { id: this.faces.length, block: A.id, n: T, u: E, v: C, origin: Q, su: P, sv: g, wall: Math.abs(T.y) < 0.3, turf: T.y > 0.7, ceiling: T.y < -0.5, paintable: A.paint && T.y > -0.5, pattern: A.pattern, color: A.color, groundedBottom: false, atlas: null, grid: -1, nu: 0, nv: 0 };
      if (!this._faceHidden(x)) {
        if (x.mural = -1, A.mural) for (const U of A.mural) T.x * U.n[0] + T.y * U.n[1] + T.z * U.n[2] > 0.9 && (x.mural = U.id);
        if (A.noPaint) for (const U of A.noPaint) T.x * U[0] + T.y * U[1] + T.z * U[2] > 0.9 && (x.paintable = false);
        (A.roof || A.perch) && T.y > 0.5 && (x.paintable = false), x.wall && (SD.copy(Q).addScaledVector(E, P / 2).addScaledVector(C, -0.06).addScaledVector(T, 0.06), x.groundedBottom = this.pointInside(SD, 0, A.id) || SD.y < 0.02), A.faces[I * 2 + (D > 0 ? 0 : 1)] = x.id, this.faces.push(x);
      }
    }
  }
  _faceHidden(A) {
    const M = Math.max(2, Math.ceil(A.su / 1.25)), N = Math.max(2, Math.ceil(A.sv / 1.25));
    for (let I = 0; I <= N; I++) for (let D = 0; D <= M; D++) {
      const T = Math.min(A.su - 0.05, Math.max(0.05, D / M * A.su)), w = Math.min(A.sv - 0.05, Math.max(0.05, I / N * A.sv));
      if (SD.copy(A.origin).addScaledVector(A.u, T).addScaledVector(A.v, w).addScaledVector(A.n, 0.03), !this.pointInside(SD, 0, A.block)) return false;
    }
    return true;
  }
  layoutLightmap(A = 5, M = 1024, N = 2) {
    const D = this.faces.filter((C) => !this.blocks[C.block].grate).map((C) => ({ f: C, w: Math.ceil(C.su * A) + N * 2, h: Math.ceil(C.sv * A) + N * 2 }));
    D.sort((C, E) => E.h - C.h || E.w - C.w || C.f.id - E.f.id);
    let T = 0, w = 0, O = 0;
    for (const C of D) T + C.w > M && (T = 0, w += O, O = 0), C.f.light = { x: T, y: w, ppm: A, pad: N }, T += C.w, O = Math.max(O, C.h);
    this.lightSize = M, this.lightUsed = w + O;
    let z = 2166136261;
    for (const C of this.faces) for (const E of [C.origin.x, C.origin.y, C.origin.z, C.su, C.sv]) z ^= Math.round(E * 100), z = Math.imul(z, 16777619) >>> 0;
    return this.layoutHash = (z >>> 0).toString(16), this.lightUsed <= M;
  }
  buildGeometry(A, M = (N) => !N.grate) {
    const N = { pos: [], nor: [], col: [], puv: [], luv: [], fuv: [], fdat: [], fflag: [], ftan: [], idx: [] }, I = this.lightSize || 1, D = new lA(), T = new DA(), w = new DA(), O = new DA(), z = new DA(), C = (s, v, S) => s.faces[v * 2 + (S > 0 ? 0 : 1)], E = this;
    function P(s, v, S) {
      const q = N.pos.length / 3;
      N.pos.push(v.x, v.y, v.z), N.nor.push(S.x, S.y, S.z), D.copy(s.color), N.col.push(D.r, D.g, D.b), z.copy(v).sub(s.origin);
      const c = z.dot(s.u), G = z.dot(s.v);
      return s.atlas ? N.puv.push((s.atlas.x + s.atlas.pad + c * s.atlas.ppm) / A, (s.atlas.y + s.atlas.pad + G * s.atlas.ppm) / A) : N.puv.push(0, 0), s.light ? N.luv.push((s.light.x + s.light.pad + c * s.light.ppm) / I, (s.light.y + s.light.pad + G * s.light.ppm) / I) : N.luv.push(-1, -1), N.fuv.push(c, G), N.fdat.push(s.pattern, s.atlas ? 1 : 0, s.su, s.sv), N.fflag.push(s.wall ? 1 : 0, s.groundedBottom ? 1 : 0, s.mural), N.ftan.push(s.u.x, s.u.y, s.u.z), q;
    }
    const g = new DA(), Q = new DA(), x = new DA();
    function U(s, v, S, q) {
      const c = N.pos;
      g.set(c[v * 3] - c[s * 3], c[v * 3 + 1] - c[s * 3 + 1], c[v * 3 + 2] - c[s * 3 + 2]), Q.set(c[S * 3] - c[s * 3], c[S * 3 + 1] - c[s * 3 + 1], c[S * 3 + 2] - c[s * 3 + 2]), x.crossVectors(g, Q), x.dot(q) >= 0 ? N.idx.push(s, v, S) : N.idx.push(s, S, v);
    }
    for (const s of this.blocks) {
      if (!s.solid && !s.render || !M(s)) continue;
      const v = s.axes, S = [s.half.x, s.half.y, s.half.z], q = Math.min(S[0], S[1], S[2]), c = Math.min(s.bevel ?? Math.max(0.04, Math.min(0.13, q * 0.14)), q * 0.45), G = /* @__PURE__ */ new Map(), r = (f, h, X, TA) => {
        if (c < 0.01) return false;
        const Z = f < X ? `${f}${h}${X}${TA}` : `${X}${TA}${f}${h}`;
        if (G.has(Z)) return G.get(Z);
        let W = C(s, f, h) >= 0 && C(s, X, TA) >= 0;
        if (W) {
          const PA = 3 - f - X;
          for (let MA = -1; MA <= 1; MA += 0.25) if (O.copy(s.center).addScaledVector(v[f], h * S[f]).addScaledVector(v[X], TA * S[X]).addScaledVector(v[PA], MA * S[PA] * 0.98), z.copy(O).addScaledVector(v[f], h * 0.04).addScaledVector(v[X], TA * 0.04), E.pointInside(z, 0, s.id)) {
            W = false;
            break;
          }
        }
        return G.set(Z, W), W;
      };
      for (let f = 0; f < 3; f++) for (const h of [1, -1]) {
        const X = C(s, f, h);
        if (X < 0) continue;
        const TA = this.faces[X], [Z, W] = [0, 1, 2].filter((fA) => fA !== f), PA = r(f, h, Z, 1) ? c : 0, MA = r(f, h, Z, -1) ? c : 0, wA = r(f, h, W, 1) ? c : 0, xA = r(f, h, W, -1) ? c : 0, YA = O.copy(s.center).addScaledVector(v[f], h * S[f]).clone(), eA = (fA, IM) => {
          const GA = fA > 0 ? S[Z] - PA : -(S[Z] - MA), bA = IM > 0 ? S[W] - wA : -(S[W] - xA);
          return P(TA, T.copy(YA).addScaledVector(v[Z], GA).addScaledVector(v[W], bA), TA.n);
        }, TM = eA(-1, -1), AM = eA(1, -1), KA = eA(1, 1), BA = eA(-1, 1);
        U(TM, AM, KA, TA.n), U(TM, KA, BA, TA.n);
      }
      if (c < 0.01) continue;
      const t = 2;
      for (let f = 0; f < 3; f++) for (let h = f + 1; h < 3; h++) for (const X of [1, -1]) for (const TA of [1, -1]) {
        if (!r(f, X, h, TA)) continue;
        const Z = 3 - f - h, W = this.faces[C(s, f, X)], PA = this.faces[C(s, h, TA)], MA = v[f].clone().multiplyScalar(X), wA = v[h].clone().multiplyScalar(TA), xA = (AM) => C(s, Z, AM) >= 0 && r(Z, AM, f, X) && r(Z, AM, h, TA) ? c : 0, YA = -S[Z] + xA(-1), eA = S[Z] - xA(1), TM = O.copy(s.center).addScaledVector(MA, S[f] - c).addScaledVector(wA, S[h] - c).clone();
        for (const AM of [0, 1]) {
          const KA = AM ? PA : W, BA = [];
          for (let fA = 0; fA <= t; fA++) {
            const IM = Math.PI / 4 * (AM + fA / t);
            w.copy(MA).multiplyScalar(Math.cos(IM)).addScaledVector(wA, Math.sin(IM));
            const GA = P(KA, T.copy(TM).addScaledVector(v[Z], YA).addScaledVector(w, c), w), bA = P(KA, T.copy(TM).addScaledVector(v[Z], eA).addScaledVector(w, c), w);
            BA.push([GA, bA, w.clone()]);
          }
          for (let fA = 0; fA < t; fA++) {
            const [IM, GA, bA] = BA[fA], [sM, WM] = BA[fA + 1];
            U(IM, GA, WM, bA), U(IM, WM, sM, bA);
          }
        }
      }
      const p = 3;
      for (const f of [1, -1]) for (const h of [1, -1]) for (const X of [1, -1]) {
        const TA = [f, h, X];
        if (!(r(0, f, 1, h) && r(0, f, 2, X) && r(1, h, 2, X))) continue;
        const Z = v[0].clone().multiplyScalar(f), W = v[1].clone().multiplyScalar(h), PA = v[2].clone().multiplyScalar(X), MA = O.copy(s.center).addScaledVector(Z, S[0] - c).addScaledVector(W, S[1] - c).addScaledVector(PA, S[2] - c).clone();
        let wA = 0, xA = -2;
        [Z, W, PA].forEach((AM, KA) => {
          AM.y > xA && (xA = AM.y, wA = KA);
        });
        const YA = this.faces[C(s, wA, TA[wA])], eA = [];
        for (let AM = 0; AM <= p; AM++) {
          eA.push([]);
          for (let KA = 0; KA <= p - AM; KA++) {
            const BA = p - AM - KA;
            w.set(0, 0, 0).addScaledVector(Z, AM).addScaledVector(W, KA).addScaledVector(PA, BA).normalize(), eA[AM].push(P(YA, T.copy(MA).addScaledVector(w, c), w));
          }
        }
        const TM = Z.clone().add(W).add(PA).normalize();
        for (let AM = 0; AM < p; AM++) for (let KA = 0; KA < p - AM; KA++) U(eA[AM][KA], eA[AM + 1][KA], eA[AM][KA + 1], TM), KA < p - AM - 1 && U(eA[AM + 1][KA], eA[AM + 1][KA + 1], eA[AM][KA + 1], TM);
      }
    }
    const k = new FM();
    return k.setAttribute("position", new xM(N.pos, 3)), k.setAttribute("normal", new xM(N.nor, 3)), k.setAttribute("color", new xM(N.col, 3)), k.setAttribute("paintUv", new xM(N.puv, 2)), k.setAttribute("lightUv", new xM(N.luv, 2)), k.setAttribute("faceUv", new xM(N.fuv, 2)), k.setAttribute("faceData", new xM(N.fdat, 4)), k.setAttribute("faceFlags", new xM(N.fflag, 3)), k.setAttribute("faceTan", new xM(N.ftan, 3)), k.setIndex(N.idx), k.computeBoundingSphere(), this.renderTris = N.idx.length / 3, k;
  }
  groundHeight(A, M, N = 50, I = false) {
    let D = -1 / 0;
    const T = this.queryBlocks(A - 0.01, M - 0.01, A + 0.01, M + 0.01, this._qtmp2 || (this._qtmp2 = []));
    for (const w of T) {
      const O = this.blocks[w];
      if (!O.solid || I && O.grate) continue;
      const z = O.axes[1];
      if (z.y < 0.5) continue;
      const C = SD.copy(O.center).addScaledVector(z, O.half.y), E = C.y - (z.x * (A - C.x) + z.z * (M - C.z)) / z.y;
      jw.set(A, E - 0.01, M), E <= N && E > D && this.pointInBlock(O, jw, 1e-3) && (D = E);
    }
    return D;
  }
}
function aS(j) {
  const A = j.mural ? j.mural.map((N) => ({ ...N, n: [-N.n[0], N.n[1], -N.n[2]] })) : void 0, M = j.noPaint ? j.noPaint.map((N) => [-N[0], N[1], -N[2]]) : void 0;
  return j.kind === "box" ? { ...j, mural: A, noPaint: M, min: [-j.max[0], j.min[1], -j.max[2]], max: [-j.min[0], j.max[1], -j.min[2]] } : j.kind === "obox" ? { ...j, mural: A, noPaint: M, center: [-j.center[0], j.center[1], -j.center[2]] } : { ...j, mural: A, noPaint: M, low: [-j.low[0], j.low[1], -j.low[2]], high: [-j.high[0], j.high[1], -j.high[2]] };
}
function pS(j, A) {
  const { THREE: M, PI: N, TAU: I, HP: D, P3: T, col: w, shade: O, mixc: z, extrudeGeo: C, TIRE: E, LIFERING: P } = A, g = { hull: "#3f5372", hullDk: "#34455f", hullLt: "#4b6182", boot: "#b04a3f", bootDk: "#8e3a31", white: "#f1ede4", whiteDk: "#dcd6ca", cream: "#ece3cf", glass: "#1c2733", glassLt: "#2a3a4a", frame: "#e6e2d9", frameDk: "#b9b6ae", black: "#23262d", rubber: "#1b1e24", steel: "#aab2ba", steelDk: "#6b727b", galv: "#c3c9ce", rust: "#9c5a3a", rustLt: "#b8744d", teak: "#a87a4f", teakDk: "#8a6240", rope: "#e2d3b0", ropeDk: "#c9b58c", mustard: "#e0b347", mustardDk: "#b98f2f", teal: "#3f9f97", tealDk: "#2c7a74", coral: "#df7c66", navy: "#2f3a57", red: "#c8473d", green: "#3fae6a", hazard: "#e2b64c", canvas: "#2f4f6e", canvasTeal: "#2f6f6a", tug: "#9c4838", tugDk: "#7a3629", tugHouse: "#efe9dd", buff: "#d9b77a", houseTeal: "#8fb8b4", houseTop: "#f0ebe0" }, Q = /* @__PURE__ */ new Map(), x = (y, Y) => {
    let u = Q.get(y);
    return u || (u = Y(), Q.set(y, u)), u;
  }, U = new M.BoxGeometry(1, 1, 1), k = (y, Y, u, o, B, a, H, m, l, _ = {}) => y.add(Y, U, u, H, m, l, { ..._, sx: o, sy: B, sz: a }), s = (y) => x("ucyl|" + y, () => new M.CylinderGeometry(1, 1, 1, y, 1, false)), v = (y, Y, u, o, B, a, H, m, l = {}) => y.add(Y, s(l.seg ?? 6), u, a, H, m, { ...l, sx: o, sy: B, sz: o }), S = (y) => x("ucylO|" + y, () => new M.CylinderGeometry(1, 1, 1, y, 1, true)), q = (y, Y, u, o, B, a, H, m, l = {}) => y.add(Y, S(l.seg ?? 6), u, a, H, m, { ...l, sx: o, sy: B, sz: o }), c = (() => {
    const y = new M.TorusGeometry(0.28, 0.068, 6, 24), Y = y.attributes.position, u = new Float32Array(Y.count * 3), o = new M.Color("#e9836c"), B = new M.Color("#f2eee6");
    for (let a = 0; a < Y.count; a++) {
      const H = Math.atan2(Y.getY(a), Y.getX(a)) + I, m = Math.floor((H + N / 8) / (I / 8)) % 2 ? B : o;
      u.set([m.r, m.g, m.b], a * 3);
    }
    return y.setAttribute("color", new M.BufferAttribute(u, 3)), y;
  })();
  function G(y, Y, u, o, B = 0.8) {
    y.add("gloss", c, "white", Y, u, o, { s: B });
    for (let a = 0; a < 4; a++) {
      const H = N / 4 + a / 4 * I;
      y.tor("rubber", g.cream, 0.075 * B, 0.011, Y + Math.cos(H) * 0.28 * B, u + Math.sin(H) * 0.28 * B, o, { rz: H, ry: D, rs: 3, ts: 8 });
    }
  }
  const r = (y) => A.noShadow ? A.noShadow(y) : y;
  function t(y, Y) {
    return Y === "glow" || Y === "blob" || Y.includes("~") ? Y : r(Y);
  }
  function p(y, Y) {
    const u = Object.prototype.hasOwnProperty.call(y, "add"), o = y.add;
    y.add = function(B, ...a) {
      return o.call(this, t(this, B), ...a);
    };
    try {
      Y();
    } finally {
      u ? y.add = o : delete y.add;
    }
  }
  class f {
    constructor() {
      this.p = [], this.n = [], this.c = [], this.i = [];
    }
    v(Y, u, o, B, a, H, m) {
      const l = Math.hypot(B, a, H) || 1;
      return this.p.push(Y, u, o), this.n.push(B / l, a / l, H / l), m ? this.c.push(m.r, m.g, m.b) : this.c.push(1, 1, 1), this.p.length / 3 - 1;
    }
    tri(Y, u, o) {
      const B = this.p, a = this.n, H = B[Y * 3], m = B[Y * 3 + 1], l = B[Y * 3 + 2], _ = B[u * 3] - H, OA = B[u * 3 + 1] - m, yA = B[u * 3 + 2] - l, EA = B[o * 3] - H, CA = B[o * 3 + 1] - m, iA = B[o * 3 + 2] - l, F = OA * iA - yA * CA, J = yA * EA - _ * iA, AA = _ * CA - OA * EA;
      if (F * F + J * J + AA * AA < 1e-18) return;
      F * (a[Y * 3] + a[u * 3] + a[o * 3]) + J * (a[Y * 3 + 1] + a[u * 3 + 1] + a[o * 3 + 1]) + AA * (a[Y * 3 + 2] + a[u * 3 + 2] + a[o * 3 + 2]) < 0 ? this.i.push(Y, o, u) : this.i.push(Y, u, o);
    }
    quad(Y, u, o, B) {
      this.tri(Y, u, o), this.tri(Y, o, B);
    }
    geo() {
      const Y = new M.BufferGeometry();
      return Y.setAttribute("position", new M.Float32BufferAttribute(this.p, 3)), Y.setAttribute("normal", new M.Float32BufferAttribute(this.n, 3)), Y.setAttribute("uv", new M.Float32BufferAttribute(new Float32Array(this.p.length / 3 * 2), 2)), Y.setAttribute("color", new M.Float32BufferAttribute(this.c, 3)), Y.setIndex(this.i), Y;
    }
  }
  function h(y, Y, u, o, B = false) {
    const a = Y.length, H = Y[0].length, m = [];
    for (let _ = 0; _ < a; _++) {
      const OA = [];
      for (let yA = 0; yA < H; yA++) {
        const EA = Y[_][yA], CA = Y[Math.max(0, _ - 1)][yA], iA = Y[Math.min(a - 1, _ + 1)][yA], F = B ? (yA - 1 + H) % H : Math.max(0, yA - 1), J = B ? (yA + 1) % H : Math.min(H - 1, yA + 1), AA = Y[_][F], jA = Y[_][J], gA = iA[0] - CA[0], LA = iA[1] - CA[1], kA = iA[2] - CA[2], SA = jA[0] - AA[0], hA = jA[1] - AA[1], sA = jA[2] - AA[2];
        let rA = LA * sA - kA * hA, mA = kA * SA - gA * sA, JA = gA * hA - LA * SA;
        const wM = u(_, yA);
        rA * (EA[0] - wM[0]) + mA * (EA[1] - wM[1]) + JA * (EA[2] - wM[2]) < 0 && (rA = -rA, mA = -mA, JA = -JA), OA.push(y.v(EA[0], EA[1], EA[2], rA, mA, JA, o ? o(EA[0], EA[1], EA[2], _, yA) : null));
      }
      m.push(OA);
    }
    const l = B ? H : H - 1;
    for (let _ = 0; _ < a - 1; _++) for (let OA = 0; OA < l; OA++) y.quad(m[_][OA], m[_ + 1][OA], m[_ + 1][(OA + 1) % H], m[_][(OA + 1) % H]);
    return m;
  }
  function X(y, Y, u, o) {
    const B = Y.map((H) => y.v(H[0], H[1], H[2], u[0], u[1], u[2], o)), a = M.ShapeUtils.triangulateShape(Y.map((H) => {
      const m = Math.abs(u[0]), l = Math.abs(u[1]);
      return m > 0.6 ? new M.Vector2(H[2], H[1]) : l > 0.6 ? new M.Vector2(H[0], H[2]) : new M.Vector2(H[0], H[1]);
    }), []);
    for (const H of a) y.tri(B[H[0]], B[H[1]], B[H[2]]);
  }
  function TA(y, Y, u = [0, 1, 0], o = true) {
    const B = new f(), a = Y.length, H = Y.map((J) => new M.Vector3(J[0], J[1], J[2])), m = H.map((J, AA) => H[Math.min(a - 1, AA + 1)].clone().sub(H[Math.max(0, AA - 1)]).normalize()), l = new M.Vector3(u[0], u[1], u[2]);
    let _ = l.clone().addScaledVector(m[0], -l.dot(m[0])).normalize();
    const OA = [];
    for (let J = 0; J < a; J++) {
      J > 0 && _.addScaledVector(m[J], -_.dot(m[J])).normalize();
      const AA = new M.Vector3().crossVectors(m[J], _).normalize();
      OA.push([_.clone(), AA]);
    }
    const yA = y.length;
    let EA = 0;
    for (let J = 0; J < yA; J++) {
      const AA = y[J], jA = y[(J + 1) % yA];
      EA += AA[0] * jA[1] - jA[0] * AA[1];
    }
    const CA = EA > 0 ? 1 : -1, iA = y.map((J, AA) => {
      const jA = y[(AA + 1) % yA], gA = jA[0] - J[0], LA = jA[1] - J[1], kA = Math.hypot(gA, LA) || 1;
      return [LA / kA * CA, -gA / kA * CA];
    }), F = Math.cos(50 * N / 180);
    for (let J = 0; J < yA; J++) {
      const AA = (J + 1) % yA, jA = y[J], gA = y[AA], LA = iA[(J - 1 + yA) % yA], kA = iA[J], SA = iA[AA], hA = LA[0] * kA[0] + LA[1] * kA[1] < F ? kA : [(LA[0] + kA[0]) / 2, (LA[1] + kA[1]) / 2], sA = kA[0] * SA[0] + kA[1] * SA[1] < F ? kA : [(kA[0] + SA[0]) / 2, (kA[1] + SA[1]) / 2];
      let rA = null;
      for (let mA = 0; mA < a; mA++) {
        const [JA, wM] = OA[mA], tA = H[mA].clone().addScaledVector(wM, jA[0]).addScaledVector(JA, jA[1]), WA = H[mA].clone().addScaledVector(wM, gA[0]).addScaledVector(JA, gA[1]), LM = wM.clone().multiplyScalar(hA[0]).addScaledVector(JA, hA[1]), iM = wM.clone().multiplyScalar(sA[0]).addScaledVector(JA, sA[1]), cM = B.v(tA.x, tA.y, tA.z, LM.x, LM.y, LM.z), kM = B.v(WA.x, WA.y, WA.z, iM.x, iM.y, iM.z);
        rA && B.quad(rA[0], rA[1], kM, cM), rA = [cM, kM];
      }
    }
    if (o) for (const [J, AA] of [[0, -1], [a - 1, 1]]) {
      const [jA, gA] = OA[J], LA = y.map((sA) => {
        const rA = H[J].clone().addScaledVector(gA, sA[0]).addScaledVector(jA, sA[1]);
        return [rA.x, rA.y, rA.z];
      }), kA = m[J].clone().multiplyScalar(AA), SA = LA.map((sA) => B.v(sA[0], sA[1], sA[2], kA.x, kA.y, kA.z)), hA = M.ShapeUtils.triangulateShape(y.map((sA) => new M.Vector2(sA[0], sA[1])), []);
      for (const sA of hA) B.tri(SA[sA[0]], SA[sA[1]], SA[sA[2]]);
    }
    return B.geo();
  }
  function Z(y, Y, u, o = 3) {
    u = Math.min(u, y * 0.98, Y * 0.98);
    const B = [], a = [[y - u, Y - u, 0], [-y + u, Y - u, D], [-y + u, -Y + u, N], [y - u, -Y + u, N * 1.5]];
    for (const [H, m, l] of a) for (let _ = 0; _ <= o; _++) {
      const OA = l + _ / o * D;
      B.push([H + Math.cos(OA) * u, m + Math.sin(OA) * u]);
    }
    return B;
  }
  function W(y, Y, u = 7) {
    const o = [[0, -Y / 2]];
    for (let B = 0; B <= u; B++) {
      const a = -D + B / u * N;
      o.push([Math.cos(a) * y, Math.sin(a) * Y / 2]);
    }
    return o.push([0, Y / 2]), o;
  }
  const PA = { A: [0.64, [[0, 0], [0, 0.76], [0.2, 1], [0.44, 1], [0.64, 0.76], [0.64, 0]], [[0, 0.44], [0.64, 0.44]]], B: [0.62, [[0, 0], [0, 1], [0.44, 1], [0.6, 0.86], [0.6, 0.66], [0.46, 0.53], [0, 0.53]], [[0.46, 0.53], [0.62, 0.4], [0.62, 0.15], [0.46, 0], [0, 0]]], C: [0.6, [[0.6, 0.82], [0.43, 1], [0.17, 1], [0, 0.83], [0, 0.17], [0.17, 0], [0.43, 0], [0.6, 0.18]]], D: [0.62, [[0, 0], [0, 1], [0.38, 1], [0.62, 0.76], [0.62, 0.24], [0.38, 0], [0, 0]]], E: [0.54, [[0.54, 1], [0, 1], [0, 0], [0.54, 0]], [[0, 0.52], [0.44, 0.52]]], F: [0.52, [[0.52, 1], [0, 1], [0, 0]], [[0, 0.52], [0.42, 0.52]]], G: [0.62, [[0.62, 0.82], [0.45, 1], [0.17, 1], [0, 0.83], [0, 0.17], [0.17, 0], [0.45, 0], [0.62, 0.17], [0.62, 0.46], [0.34, 0.46]]], H: [0.62, [[0, 0], [0, 1]], [[0.62, 0], [0.62, 1]], [[0, 0.52], [0.62, 0.52]]], I: [0, [[0, 0], [0, 1]]], J: [0.5, [[0.5, 1], [0.5, 0.17], [0.33, 0], [0.16, 0], [0, 0.16], [0, 0.3]]], K: [0.6, [[0, 0], [0, 1]], [[0.6, 1], [0, 0.4]], [[0.2, 0.58], [0.6, 0]]], L: [0.5, [[0, 1], [0, 0], [0.5, 0]]], M: [0.8, [[0, 0], [0, 1], [0.4, 0.4], [0.8, 1], [0.8, 0]]], N: [0.64, [[0, 0], [0, 1], [0.64, 0], [0.64, 1]]], O: [0.66, [[0.17, 0], [0, 0.17], [0, 0.83], [0.17, 1], [0.49, 1], [0.66, 0.83], [0.66, 0.17], [0.49, 0], [0.17, 0]]], P: [0.6, [[0, 0], [0, 1], [0.44, 1], [0.6, 0.84], [0.6, 0.6], [0.44, 0.45], [0, 0.45]]], Q: [0.66, [[0.17, 0], [0, 0.17], [0, 0.83], [0.17, 1], [0.49, 1], [0.66, 0.83], [0.66, 0.17], [0.49, 0], [0.17, 0]], [[0.4, 0.22], [0.7, -0.08]]], R: [0.62, [[0, 0], [0, 1], [0.44, 1], [0.6, 0.84], [0.6, 0.62], [0.44, 0.47], [0, 0.47]], [[0.36, 0.47], [0.62, 0]]], S: [0.6, [[0.6, 0.83], [0.43, 1], [0.17, 1], [0, 0.83], [0, 0.64], [0.13, 0.53], [0.47, 0.49], [0.6, 0.37], [0.6, 0.17], [0.43, 0], [0.17, 0], [0, 0.17]]], T: [0.6, [[0, 1], [0.6, 1]], [[0.3, 1], [0.3, 0]]], U: [0.62, [[0, 1], [0, 0.17], [0.17, 0], [0.45, 0], [0.62, 0.17], [0.62, 1]]], V: [0.64, [[0, 1], [0.32, 0], [0.64, 1]]], W: [0.86, [[0, 1], [0.2, 0], [0.43, 0.62], [0.66, 0], [0.86, 1]]], X: [0.62, [[0, 1], [0.62, 0]], [[0, 0], [0.62, 1]]], Y: [0.62, [[0, 1], [0.31, 0.5], [0.62, 1]], [[0.31, 0.5], [0.31, 0]]], Z: [0.58, [[0, 1], [0.58, 1], [0, 0], [0.58, 0]]], 0: [0.56, [[0.16, 0], [0, 0.16], [0, 0.84], [0.16, 1], [0.4, 1], [0.56, 0.84], [0.56, 0.16], [0.4, 0], [0.16, 0]]], 1: [0.3, [[0, 0.8], [0.26, 1], [0.26, 0]]], 2: [0.56, [[0, 0.83], [0.16, 1], [0.4, 1], [0.56, 0.84], [0.56, 0.6], [0, 0.12], [0, 0], [0.56, 0]]], 3: [0.56, [[0, 0.84], [0.16, 1], [0.4, 1], [0.56, 0.84], [0.56, 0.66], [0.44, 0.54], [0.18, 0.54]], [[0.44, 0.54], [0.56, 0.42], [0.56, 0.16], [0.4, 0], [0.16, 0], [0, 0.16]]], 4: [0.58, [[0.42, 0], [0.42, 1], [0, 0.3], [0.58, 0.3]]], 5: [0.56, [[0.54, 1], [0.02, 1], [0, 0.56], [0.4, 0.56], [0.56, 0.42], [0.56, 0.16], [0.4, 0], [0.16, 0], [0, 0.16]]], 6: [0.56, [[0.54, 0.86], [0.4, 1], [0.16, 1], [0, 0.84], [0, 0.16], [0.16, 0], [0.4, 0], [0.56, 0.16], [0.56, 0.4], [0.4, 0.56], [0, 0.56]]], 7: [0.54, [[0, 1], [0.54, 1], [0.16, 0]]], 8: [0.56, [[0.14, 0.53], [0, 0.66], [0, 0.86], [0.14, 1], [0.42, 1], [0.56, 0.86], [0.56, 0.66], [0.42, 0.53], [0.14, 0.53], [0, 0.4], [0, 0.14], [0.14, 0], [0.42, 0], [0.56, 0.14], [0.56, 0.4], [0.42, 0.53]]], 9: [0.56, [[0.02, 0.14], [0.16, 0], [0.4, 0], [0.56, 0.16], [0.56, 0.84], [0.4, 1], [0.16, 1], [0, 0.84], [0, 0.6], [0.16, 0.44], [0.56, 0.44]]], "-": [0.36, [[0, 0.48], [0.36, 0.48]]], ".": [0.04, [[0, 0], [0, 0.06]]], "/": [0.4, [[0, 0], [0.4, 1]]], "·": [0.04, [[0, 0.46], [0, 0.54]]] };
  function MA(y, Y, u, o, B) {
    let a = Y.length > 2 && Y[0][0] === Y[Y.length - 1][0] && Y[0][1] === Y[Y.length - 1][1];
    a && (Y = Y.slice(0, -1));
    const H = Y.length, m = u / 2, l = [], _ = [], OA = (EA, CA) => {
      const iA = CA[0] - EA[0], F = CA[1] - EA[1], J = Math.hypot(iA, F) || 1;
      return [iA / J, F / J];
    };
    for (let EA = 0; EA < H; EA++) {
      const CA = a || EA > 0, iA = a || EA < H - 1, F = CA ? OA(Y[(EA - 1 + H) % H], Y[EA]) : null, J = iA ? OA(Y[EA], Y[(EA + 1) % H]) : null;
      let AA, jA, gA = 1;
      if (F && J) {
        const LA = -F[1], kA = F[0], SA = -J[1], hA = J[0];
        AA = LA + SA, jA = kA + hA;
        const sA = Math.hypot(AA, jA) || 1;
        AA /= sA, jA /= sA, gA = Math.min(2.2, 1 / Math.max(0.2, AA * SA + jA * hA));
      } else {
        const LA = F || J;
        AA = -LA[1], jA = LA[0];
      }
      l.push([Y[EA][0] + AA * m * gA, Y[EA][1] + jA * m * gA]), _.push([Y[EA][0] - AA * m * gA, Y[EA][1] - jA * m * gA]);
    }
    const yA = a ? H : H - 1;
    for (let EA = 0; EA < yA; EA++) {
      const CA = (EA + 1) % H, iA = y.v(l[EA][0], l[EA][1], o, 0, 0, 1, B), F = y.v(_[EA][0], _[EA][1], o, 0, 0, 1, B), J = y.v(_[CA][0], _[CA][1], o, 0, 0, 1, B), AA = y.v(l[CA][0], l[CA][1], o, 0, 0, 1, B);
      y.quad(iA, F, J, AA);
      for (const jA of [l, _]) {
        const gA = jA[CA][0] - jA[EA][0];
        let kA = jA[CA][1] - jA[EA][1], SA = -gA;
        const hA = (jA[EA][0] + jA[CA][0]) / 2 - (Y[EA][0] + Y[CA][0]) / 2, sA = (jA[EA][1] + jA[CA][1]) / 2 - (Y[EA][1] + Y[CA][1]) / 2;
        kA * hA + SA * sA < 0 && (kA = -kA, SA = -SA);
        const rA = y.v(jA[EA][0], jA[EA][1], o, kA, SA, 0, B), mA = y.v(jA[CA][0], jA[CA][1], o, kA, SA, 0, B), JA = y.v(jA[CA][0], jA[CA][1], 0, kA, SA, 0, B), wM = y.v(jA[EA][0], jA[EA][1], 0, kA, SA, 0, B);
        y.quad(rA, mA, JA, wM);
      }
    }
    if (!a) for (const [EA, CA] of [[0, -1], [H - 1, 1]]) {
      const iA = OA(Y[EA === 0 ? 0 : H - 2], Y[EA === 0 ? 1 : H - 1]), F = iA[0] * CA, J = iA[1] * CA, AA = y.v(l[EA][0], l[EA][1], o, F, J, 0, B), jA = y.v(_[EA][0], _[EA][1], o, F, J, 0, B), gA = y.v(_[EA][0], _[EA][1], 0, F, J, 0, B), LA = y.v(l[EA][0], l[EA][1], 0, F, J, 0, B);
      y.quad(AA, jA, gA, LA);
    }
  }
  function wA(y, Y, u = {}) {
    const o = (u.weight ?? 0.15) * Y, B = u.depth ?? 0.012, a = (u.spacing ?? 0.24) * Y, H = u.align ?? "c", m = ["txt", y, Y, u.weight ?? 0.15, B, u.spacing ?? 0.24, H, u.slant ?? 0].join("|");
    return x(m, () => {
      const l = new f();
      let _ = 0;
      const OA = [];
      for (const F of String(y).toUpperCase()) {
        if (F === " ") {
          _ += 0.5 * Y;
          continue;
        }
        const J = PA[F];
        if (!J) {
          _ += 0.5 * Y;
          continue;
        }
        OA.push([J, _]), _ += J[0] * Y + o + a;
      }
      const yA = Math.max(0, _ - a), EA = H === "c" ? -yA / 2 : H === "r" ? -yA : 0, CA = u.slant ?? 0;
      for (const [F, J] of OA) for (let AA = 1; AA < F.length; AA++) {
        const jA = F[AA].map((gA) => [EA + J + o / 2 + gA[0] * Y + gA[1] * Y * CA, gA[1] * Y * (1 - o / Y) + o / 2]);
        MA(l, jA, o, B, null);
      }
      const iA = l.geo();
      return iA.userData = { width: yA }, iA;
    });
  }
  function xA(y, Y, u, o, B, a, H, m = {}) {
    y.add(t(y, m.mat || "paint"), wA(Y, u, m), o, B, a, H, { ry: m.ry ?? 0, rx: m.rx ?? 0, rz: m.rz ?? 0 });
  }
  function YA(y, Y, u, o = 18) {
    const B = [];
    for (let a = 0; a <= o; a++) {
      const H = a / o, m = 4 * H * (1 - H);
      B.push(T(y[0] + (Y[0] - y[0]) * H, y[1] + (Y[1] - y[1]) * H - u * m, y[2] + (Y[2] - y[2]) * H));
    }
    return B;
  }
  function eA(y, Y, u, o, B = 0.03, a = g.rope, H = 18) {
    y.tube(t(y, "rubber"), a, YA(Y, u, o, H), B, { radial: 6 });
  }
  function TM(y, Y, u, o) {
    return x(["streak", y, Y, u, o].join("|"), () => {
      const B = new f(), a = w(u), H = w(o), m = [B.v(-y / 2, 0, 0, 0, 0, 1, a), B.v(y / 2, 0, 0, 0, 0, 1, a), B.v(y * 0.18, -Y, 0, 0, 0, 1, H), B.v(-y * 0.18, -Y, 0, 0, 0, 1, H)], l = B.v(0, -Y * 0.45, 0, 0, 0, 1, a.clone().lerp(H, 0.55));
      return B.tri(m[0], m[1], l), B.tri(m[1], m[2], l), B.tri(m[2], m[3], l), B.tri(m[3], m[0], l), B.geo();
    });
  }
  function AM(y, Y, u, o, B, a, H, m, l = 0) {
    y.add(t(y, "paint"), TM(B, a, H, m), "white", Y, u, o, { ry: l });
  }
  function KA(y) {
    let Y = 0, u = 0;
    for (const CA of y) Y += CA.g.attributes.position.count, u += CA.g.index.count;
    const o = new Float32Array(Y * 3), B = new Float32Array(Y * 3), a = new Float32Array(Y * 3), H = new Float32Array(Y * 2), m = new Uint32Array(u), l = new M.Vector3(), _ = new M.Matrix3();
    let OA = 0, yA = 0;
    for (const CA of y) {
      const iA = CA.g.attributes.position, F = CA.g.attributes.normal, J = CA.g.attributes.color, AA = w(CA.c);
      _.getNormalMatrix(CA.m);
      for (let gA = 0; gA < iA.count; gA++) {
        l.fromBufferAttribute(iA, gA).applyMatrix4(CA.m), o.set([l.x, l.y, l.z], (OA + gA) * 3), l.fromBufferAttribute(F, gA).applyMatrix3(_).normalize(), B.set([l.x, l.y, l.z], (OA + gA) * 3);
        const LA = J ? J.getX(gA) : 1;
        a.set([AA.r * LA, AA.g * LA, AA.b * LA], (OA + gA) * 3);
      }
      const jA = CA.g.index.array;
      for (let gA = 0; gA < jA.length; gA++) m[yA++] = jA[gA] + OA;
      OA += iA.count;
    }
    const EA = new M.BufferGeometry();
    return EA.setAttribute("position", new M.BufferAttribute(o, 3)), EA.setAttribute("normal", new M.BufferAttribute(B, 3)), EA.setAttribute("color", new M.BufferAttribute(a, 3)), EA.setAttribute("uv", new M.BufferAttribute(H, 2)), EA.setIndex(new M.BufferAttribute(m, 1)), EA.computeBoundingSphere(), EA;
  }
  const BA = (y, Y, u, o = 0, B = 0, a = 0, H = 1, m = 1, l = 1) => new M.Matrix4().compose(new M.Vector3(y, Y, u), new M.Quaternion().setFromEuler(new M.Euler(o, B, a, "YXZ")), new M.Vector3(H, m, l));
  function fA(y) {
    const Y = [];
    return Y.push({ g: A.roundBox(y, 0.13, 0.2, 0.05), m: BA(0, 0.14, 0), c: g.white }), Y.push({ g: A.chamferBox(y - 0.1, 0.05, 0.012, 4e-3), m: BA(0, 0.14, 0.103), c: "#b9bcc0" }), Y.push({ g: A.chamferBox(y - 0.1, 0.05, 0.012, 4e-3), m: BA(0, 0.14, -0.103), c: "#b9bcc0" }), Y.push({ g: A.latheGeo([[0, 0], [0.09, 0], [0.09, 0.09], [0.06, 0.12], [0, 0.12]], 12), m: BA(0, -0.02, 0), c: g.whiteDk }), KA(Y);
  }
  function IM(y, Y, u, o, B, a) {
    const H = "hv_radar" + Math.round(B * 10);
    A.spinTemplate && typeof y.spin == "function" ? (A.spinTemplate(H, () => fA(B)), y.spin(H, Y, u, o, { speed: a })) : y.add("gloss", fA(B), "white", Y, u, o, {});
  }
  const GA = -5, bA = 16, sM = 1.3, WM = [[-0.065, 0], [0.065, 0], [0.065, -0.78], [0.12, -0.8], [0.25, -0.44], [0.3, -0.42], [0.31, -0.5], [0.27, -0.92], [0.2, -1.02], [-0.2, -1.02], [-0.27, -0.92], [-0.31, -0.5], [-0.3, -0.42], [-0.25, -0.44], [-0.12, -0.8], [-0.065, -0.78]];
  function cA(y, Y) {
    const u = x("anchor", () => C(WM.map(([o, B]) => [o, B]), 0.1, 0.025));
    y.add("metal", u, Y, 0, 0, 0.055, { ry: -D }), y.box("metal", Y, 0.2, 0.14, 0.12, 0, -0.05, 0.06, { r: 0.04 }), y.tor("metal", Y, 0.07, 0.022, 0, 0.1, 0.06, { rs: 6, ts: 12 }), y.box("metal", O(Y, 1.15), 0.5, 0.06, 0.12, 0, -0.9, 0.06, { r: 0.025 });
    for (let o = 0; o < 2; o++) y.tor("metal", O(Y, 0.9), 0.07, 0.024, 0, 0.23 + o * 0.13, 0.05, { ry: o % 2 ? D : 0, rs: 5, ts: 10, sy: 1.4 });
  }
  function MM(y, Y, u, o) {
    p(y, () => {
      y.tor("gloss", g.black, 0.13, 0.05, Y, u, o + 0.035, { sx: 1.35, rs: 5, ts: 14 }), y.cyl("gloss", g.black, 0.26, 0.03, Y, u, o + 0.015, { rx: D, sx: 1.3, seg: 14 }), y.cyl("paint", "#15161a", 0.12, 4e-3, Y, u, o + 0.032, { rx: D, sx: 1.3, seg: 10 });
    });
  }
  function qA(y, Y, u, o, B = true) {
    return p(y, () => {
      y.box("metal", g.steelDk, 0.24, 0.24, 0.03, Y, u, o + 0.015, { round: true, r: 0.02 });
      for (const [a, H] of [[-0.08, -0.08], [0.08, 0.08]]) v(y, "metal", "#50555c", 0.018, 0.02, Y + a, u + H, o + 0.035, { rx: D });
      y.box("metal", g.steelDk, 0.07, 0.09, 0.08, Y, u + 0.02, o + 0.07, { r: 0.02 }), y.tor("metal", g.steel, 0.1, 0.022, Y, u - 0.1, o + 0.1, { rx: 0.25, rs: 5, ts: 12 }), B && y.tor("rubber", g.ropeDk, 0.07, 0.026, Y, u - 0.2, o + 0.13, { ry: D, rs: 4, ts: 10 });
    }), [Y, u - 0.26, o + 0.16];
  }
  function UA(y, Y, u, o, B, a, H, m) {
    p(y, () => {
      const l = [];
      for (let OA = 0; OA < H; OA++) for (let yA = 0; yA < 28; yA++) {
        const EA = yA / 28, CA = EA * I;
        l.push(T(Y + Math.sin(CA) * (B + a), u + (OA + EA) * 0.07, o + Math.sin(CA) * Math.cos(CA) * a * 1.6));
      }
      y.tube("rubber", m, l, 0.028, { radial: 6 });
    });
  }
  j.ferry_hull = { desc: "HALYARD double-ended ferry: one long side of the hull (boot-top, belting, plate seams, livery lettering, anchors, draft marks, bulwark cap + guard rail (rail collider), freeing ports, mooring lines) + one end (lowered car-ramp flap, corner fenders). Place at the origin; the mirror copy dresses the other side/end.", params: {}, variants: 1, mount: "ground", build(y) {
    y.aoBase = null;
    const Y = O(g.hull, 0.82), u = z(g.hull, "#7a5646", 0.42), o = O(g.hull, 0.8);
    p(y, () => {
      y.box("paint", g.boot, 32.06, 0.44, 0.024, 0, -1.47, GA - 0.012, { r: 8e-3 }), y.box("paint", g.boot, 0.024, 0.44, 10.04, bA + 0.012, -1.47, 0, { r: 8e-3 }), y.box("paint", g.white, 32.06, 0.035, 0.02, 0, -1.232, GA - 0.01, { r: 6e-3 }), y.box("paint", g.white, 0.02, 0.035, 10.04, bA + 0.01, -1.232, 0, { r: 6e-3 });
    });
    const B = W(0.11, 0.28).slice(1, -1).map(([CA, iA]) => [-CA, iA]), a = x("ferryBelt", () => C(B, 31.66, 0.05));
    y.add("gloss", a, "#1c1f26", 0, 0.77, GA, {});
    const H = x("ferryBeltEnd", () => C(B, 2.24, 0.05));
    for (const CA of [-1, 1]) y.add("gloss", H, "#1c1f26", bA, 0.77, CA * 3.72, { ry: -D });
    p(y, () => {
      y.box("metal", g.steelDk, 31.5, 0.035, 0.02, 0, 0.61, GA - 0.01, { r: 8e-3 });
      for (let CA = -15.2; CA <= 15.3; CA += 1.2) v(y, "metal", g.steelDk, 0.017, 0.022, CA, 0.61, GA - 0.02, { rx: D });
    });
    for (const CA of [-bA, bA]) {
      const iA = Math.sign(CA);
      y.box("gloss", "#1c1f26", 0.4, 2.2, 0.4, CA, -0.08, GA, { round: true, r: 0.13 });
      for (const F of [-0.85, -0.15, 0.55]) y.cyl("metal", g.steelDk, 0.024, 0.012, CA + iA * 0.08, F, GA - 0.203, { rx: D, seg: 6 }), y.cyl("metal", g.steelDk, 0.024, 0.012, CA + iA * 0.203, F, GA + 0.08, { rz: D, seg: 6 });
    }
    xA(y, "HALYARD", 0.46, g.white, 9.6, -0.08, GA, { ry: N, weight: 0.16 }), xA(y, "INKWAVE", 0.19, g.white, 9.6, -0.5, GA, { ry: N, weight: 0.17, spacing: 0.45 });
    const m = wA("KRAKEN LINES", 0.52, { weight: 0.17, depth: 0.014 }), l = m.userData.width, _ = -8.7;
    y.add("paint", m, g.white, _, -0.34, GA, { ry: N }), y.push(_ + l / 2 + 0.72, -0.08, GA, N), y.cyl("paint", g.teal, 0.44, 0.014, 0, 0, 7e-3, { rx: D, seg: 32 }), y.tor("paint", g.white, 0.44, 0.024, 0, 0, 0.012, { rs: 5, ts: 32 }), y.tube("paint", g.white, [T(-0.26, -0.1, 0.018), T(-0.21, 0.13, 0.018), T(-0.02, 0.25, 0.018), T(0.17, 0.15, 0.018), T(0.15, -0.05, 0.018), T(0, -0.08, 0.018), T(-0.02, 0.06, 0.018), T(0.06, 0.05, 0.018)], 0.036, { radial: 6 }), y.tube("paint", g.white, [T(-0.28, -0.23, 0.018), T(-0.14, -0.29, 0.018), T(0, -0.23, 0.018), T(0.14, -0.29, 0.018), T(0.28, -0.23, 0.018)], 0.03, { radial: 6 }), y.pop();
    for (const CA of [-15.3, 15.3]) for (const [iA, F] of [["2", -1.4], ["4", -1.2], ["6", -1], ["8", -0.8], ["4M", -0.6]]) xA(y, iA, 0.1, g.white, CA, F, GA, { ry: N, weight: 0.18, depth: 8e-3 });
    for (const CA of [-14.2, 14.2]) y.push(CA, 0.36, GA, N), y.box("paint", g.hullDk, 0.72, 1.38, 0.03, 0, -0.56, 0.015, { round: true, r: 0.05 }), y.tor("metal", g.steelDk, 0.17, 0.045, 0, 0.05, 0.03, { rs: 6, ts: 18 }), y.cyl("paint", g.black, 0.15, 0.01, 0, 0.05, 0.032, { rx: D, seg: 14 }), y.push(0, -0.06, 0.02), cA(y, "#4a4e55"), y.pop(), AM(y, 0.1, -0.98, 0.034, 0.16, 0.7, u, g.hull), AM(y, -0.13, -1, 0.034, 0.09, 0.45, z(g.hull, "#7a5646", 0.3), g.hull), y.pop();
    for (const [CA, iA] of [[-15, -1.8], [1.8, 15]]) {
      const F = iA - CA, J = (CA + iA) / 2, AA = CA < 0 ? -bA : CA, jA = CA < 0 ? iA : bA;
      y.box("gloss", g.white, jA - AA, 0.08, 0.1, (AA + jA) / 2, 2, GA + 0.03, { r: 0.03 });
      const gA = Math.round(F / 1.45);
      for (let LA = 0; LA <= gA; LA++) {
        const kA = CA + LA / gA * F;
        q(y, "metal", g.galv, 0.021, 0.28, kA, 2.18, GA + 0.04, { seg: 8 }), k(y, "metal", g.galv, 0.07, 0.02, 0.07, kA, 2.05, GA + 0.04), LA < gA && k(y, "paint", Y, 0.05, 0.62, 0.05, kA + F / gA / 2, 1.62, GA + 0.42);
      }
      y.cyl("metal", g.galv, 0.025, F, J, 2.32, GA + 0.04, { rz: D, seg: 10 }), y.cyl("metal", g.galv, 8e-3, F, J, 2.19, GA + 0.04, { rz: D, seg: 6 });
      for (const LA of [CA, iA]) y.sph("metal", g.galv, 0.03, LA, 2.32, GA + 0.04, { ws: 8, hs: 6 });
      y.col(CA < 0 ? CA - 0.03 : CA, 2.06, GA - 0.5, CA < 0 ? iA : iA + 0.03, 2.75, GA + 0.1, { rail: true });
    }
    for (let CA = -13.5; CA <= 13.6; CA += 3) Math.abs(CA) < 5 || (y.box("paint", g.black, 0.5, 0.15, 0.012, CA, 1.38, GA - 6e-3, { r: 0.02 }), y.box("paint", g.hullDk, 0.54, 0.17, 0.02, CA, 1.39, GA - 0.022, { rx: 0.18, r: 0.02 }), y.cyl("metal", g.steelDk, 0.012, 0.6, CA, 1.47, GA - 0.025, { rz: D, seg: 6 }), AM(y, CA + 0.06, 0.6, GA - 2e-3, 0.34, 0.9, o, g.hull, N));
    for (const CA of [-1, 1]) y.box("rubber", g.rubber, 0.16, 1.5, 0.1, CA * 1.95, -0.2, GA - 0.05, { round: true, r: 0.04 });
    const OA = 0.27, yA = 4.7, EA = 2.3;
    for (let CA = 0; CA < 7; CA++) {
      const iA = -yA / 2 + 0.3 + CA * ((yA - 0.6) / 6);
      y.cyl("metal", CA % 2 ? g.steelDk : g.steel, 0.075, 0.42, bA + 0.06, 1.19, iA, { rx: D, seg: 12 });
    }
    y.box("metal", g.steelDk, 0.08, 0.22, yA + 0.2, bA + 0.04, 1.02, 0, { r: 0.02 }), y.push(bA + 0.08, 1.14, 0, 0, 0, OA), y.box("metal", z(g.steel, g.hull, 0.35), 0.16, EA, yA - 0.04, 0.08, -EA / 2, 0, { r: 0.04 });
    for (let CA = 0.22; CA < EA - 0.2; CA += 0.19) y.box("metal", g.steel, 0.035, 0.03, yA - 0.34, 0.175, -CA, 0, { r: 0.01 });
    for (const CA of [-1, 1]) y.box("metal", g.steelDk, 0.26, EA, 0.1, 0.02, -EA / 2, CA * (yA / 2 - 0.05), { r: 0.03 }), y.decal("hazard", EA - 0.1, 0.16, 0.06, -EA / 2, CA * (yA / 2 + 3e-3), { ry: CA > 0 ? 0 : N, rz: D, tint: g.hazard });
    for (let CA = 0; CA < 6; CA++) {
      const iA = -yA / 2 + 0.45 + CA * ((yA - 0.9) / 5);
      y.push(0.1, -EA, iA, 0, 0, 0.35), y.box("metal", g.steel, 0.05, 0.42, 0.66, 0, -0.21, 0, { r: 0.015 }), y.pop(), y.cyl("metal", g.steelDk, 0.04, 0.68, 0.1, -EA + 0.02, iA, { rx: D, seg: 8 });
    }
    y.pop();
    for (const CA of [-1, 1]) {
      const iA = [bA + 0.02, -0.55, CA * 2.05], F = 1.45, J = [bA + 0.08 + Math.sin(OA) * F, 1.14 - Math.cos(OA) * F, CA * 2.05];
      y.tube("metal", g.galv, [T(...iA), T(iA[0] + (J[0] - iA[0]) * 0.55, iA[1] + (J[1] - iA[1]) * 0.55, iA[2])], 0.07, { radial: 10 }), y.tube("metal", g.steel, [T(iA[0] + (J[0] - iA[0]) * 0.5, iA[1] + (J[1] - iA[1]) * 0.5, iA[2]), T(...J)], 0.04, { radial: 8 }), y.box("metal", g.steelDk, 0.12, 0.26, 0.26, bA + 0.06, -0.55, CA * 2.05, { r: 0.03 });
    }
    y.box("metal", g.steelDk, 0.95, 0.05, 0.42, -14, sM + 0.025, -4.12, { r: 0.02 });
    for (const CA of [-1, 1]) y.lathe("gloss", g.black, [[0, 0], [0.13, 0], [0.13, 0.25], [0.18, 0.28], [0.18, 0.32], [0.11, 0.34], [0, 0.34]], -14 + CA * 0.28, sM + 0.03, -4.12, { seg: 14 });
    y.col(-14.5, sM, -4.33, -13.5, sM + 0.34, -3.91), UA(y, -14, sM + 0.1, -4.12, 0.28, 0.16, 2, g.rope), y.push(-14, 0, GA + 0.4), MM(y, 0, 1.66, 0), y.pop(), y.push(-14, 0, GA, N), MM(y, 0, 1.66, 0), y.pop(), eA(y, [-14.25, sM + 0.2, -4.12], [-14, 1.66, GA + 0.42], 0.03, 0.03), eA(y, [-14, 1.66, GA - 0.02], [-19.5 + 0.16, -0.72, -9.2], 0.4, 0.032), y.push(-19.5, 0, -9.2, D), qA(y, 0, -0.46, 0), y.pop();
    for (const CA of [-1, 1]) {
      const iA = CA * 4.4;
      y.box("metal", g.steelDk, 0.44, 0.06, 0.08, iA, 1.84, GA + 0.45, { r: 0.025 }), y.box("metal", g.steelDk, 0.1, 0.12, 0.06, iA, 1.79, GA + 0.43, { r: 0.02 }), y.push(iA, 0, GA + 0.4), MM(y, 0.3 * CA, 1.62, 0), y.pop(), y.push(iA, 0, GA, N), MM(y, -0.3 * CA, 1.62, 0), y.pop(), eA(y, [iA - 0.12 * CA, 1.87, GA + 0.47], [iA + 0.3 * CA, 1.62, GA + 0.42], 0.02, 0.028), eA(y, [iA + 0.3 * CA, 1.62, GA - 0.02], [CA * 3.2, -0.72, -8.6 + 0.16], 0.28, 0.03), y.push(CA * 3.2, 0, -8.6), qA(y, 0, -0.46, 0), y.pop();
    }
    y.box("metal", g.steelDk, 0.44, 0.06, 0.08, 12.4, 1.84, GA + 0.45, { r: 0.025 }), y.box("metal", g.steelDk, 0.1, 0.12, 0.06, 12.4, 1.79, GA + 0.43, { r: 0.02 }), y.push(12.1, 0, GA + 0.4), MM(y, 0, 1.62, 0), y.pop(), y.push(12.1, 0, GA, N), MM(y, 0, 1.62, 0), y.pop(), eA(y, [12.5, 1.87, GA + 0.47], [12.1, 1.62, GA + 0.42], 0.02, 0.028), eA(y, [12.1, 1.62, GA - 0.02], [12.9, -0.72, -7 + 0.16], 0.1, 0.03), y.push(12.9, 0, -7), qA(y, 0, -0.46, 0), y.pop();
  } };
  function VA(y, Y, u = 0.84, o = 1.98, B = g.whiteDk, a = -1) {
    y.box("gloss", O(B, 0.9), u + 0.16, o + 0.1, 0.03, Y, (o + 0.1) / 2, 0.015, { round: true, r: 0.07 }), y.box("gloss", B, u, o - 0.12, 0.035, Y, 0.12 + (o - 0.12) / 2, 0.045, { round: true, r: 0.09 }), y.box("gloss", O(B, 0.94), u - 0.18, 0.05, 0.012, Y, 0.62, 0.068, { r: 0.01 }), y.box("metal", g.steelDk, u + 0.14, 0.1, 0.07, Y, 0.05, 0.035, { r: 0.02 });
    const H = o - 0.52;
    y.tor("metal", g.steel, 0.15, 0.03, Y, H, 0.07, { rs: 6, ts: 20 }), y.cyl("gloss", g.glass, 0.14, 0.012, Y, H, 0.066, { rx: D, seg: 18 });
    for (let l = 0; l < 4; l++) {
      const _ = N / 4 + l * D;
      y.box("metal", g.steelDk, 0.035, 0.05, 0.03, Y + Math.cos(_) * 0.2, H + Math.sin(_) * 0.2, 0.07, { rz: _, r: 8e-3 });
    }
    const m = Y - a * (u / 2 - 0.09);
    y.box("metal", g.steelDk, 0.05, 0.12, 0.05, m, 1.02, 0.075, { r: 0.012 }), y.box("metal", g.steel, 0.2, 0.035, 0.035, m + a * 0.08, 1.02, 0.1, { r: 0.012 });
    for (const l of [0.35, o - 0.35]) y.box("metal", g.steelDk, 0.07, 0.04, 0.045, m, l, 0.07, { r: 0.01 });
    for (const l of [0.34, o / 2 + 0.05, o - 0.3]) y.cyl("metal", g.steelDk, 0.028, 0.16, Y + a * (u / 2 + 0.03), l, 0.06, { seg: 8 });
  }
  function zM(y, Y, u, o, B, a, H = {}) {
    p(y, () => {
      const m = u - Y, l = (Y + u) / 2, _ = B - o, OA = (o + B) / 2, yA = H.frame ?? g.frameDk;
      y.box("gloss", g.glass, m, _, 0.02, l, OA, 0.01, { r: 0.03 }), y.box("gloss", yA, m + 0.08, 0.06, 0.04, l, B + 0.02, 0.02, { r: 0.018 }), y.box("gloss", yA, m + 0.08, 0.07, 0.05, l, o - 0.025, 0.025, { r: 0.02 });
      for (let EA = 0; EA <= a; EA++) y.box("gloss", yA, 0.07, _, 0.035, Y + EA / a * m, OA, 0.018, { r: 0.014 });
      for (let EA = 0; EA < a; EA++) y.box("gloss", g.glassLt, m / a - 0.14, _ * 0.18, 4e-3, Y + (EA + 0.5) / a * m, B - _ * 0.16, 0.022, { r: 3e-3 });
    });
  }
  function dA(y, Y, u, o = 1.2, B = 0.2) {
    y.box("paint", O(g.whiteDk, 0.7), o + 0.16, 2 * B + 0.1, 0.012, Y, u, 6e-3, { round: true, r: 0.08 }), y.push(Y, u, 0.12 - B, 0, 0, D);
    const a = o / 2;
    y.lathe("gloss", g.white, [[0, -a], [B * 0.55, -a + 0.01], [B * 0.9, -a + 0.06], [B, -a + 0.16], [B, a - 0.16], [B * 0.9, a - 0.06], [B * 0.55, a - 0.01], [0, a]], 0, 0, 0, { seg: 18 });
    for (const H of [-a + 0.3, a - 0.3]) y.cyl("gloss", g.black, B + 0.01, 0.05, 0, H, 0, { seg: 18, open: true });
    y.cyl("gloss", g.white, B + 0.012, 0.012, 0, -0.05, 0, { seg: 18, open: true }), y.pop(), y.box("gloss", g.red, 0.1, 0.12, 0.06, Y + o / 2 + 0.03, u - B + 0.04, 0.03, { r: 0.015 }), xA(y, "LIFERAFT", 0.06, g.navy, Y - 0.05, u - 0.03, 0.117, { weight: 0.2, depth: 3e-3 });
  }
  j.ferry_cabin = { desc: "HALYARD passenger saloon (one long side): dark glazed window band with mullions + sky sheen, handrail under the sills, flush life-raft canisters in wall recesses, slim roof lip. Place at the origin (mirrored).", params: {}, variants: 1, mount: "ground", build(y) {
    y.aoBase = null, y.push(0, sM, -2.9, N), zM(y, -5.6, 5.6, 1, 1.9, 7), y.cyl("metal", g.galv, 0.02, 11.6, 0, 0.89, 0.075, { rz: D, seg: 8 });
    for (let Y = -5.6; Y <= 5.61; Y += 1.6) y.box("metal", g.galv, 0.03, 0.03, 0.07, Y, 0.89, 0.036, { r: 8e-3 }), y.cyl("metal", g.galv, 0.03, 0.01, Y, 0.89, 5e-3, { rx: D, seg: 8 });
    dA(y, -3, 2.18), dA(y, 3, 2.18), y.pop(), y.box("gloss", g.white, 13, 0.1, 0.08, 0, 3.77, -2.94, { r: 0.03 }), y.box("metal", g.steelDk, 13, 0.02, 0.03, 0, 3.71, -2.975, { r: 6e-3 });
  } }, j.ferry_bridge = { desc: "HALYARD wheelhouse dressing (placed once at the wheelhouse base): raked wraparound windows, doors, sidelights, nameboards, wipers; the proud Kraken funnel (collider) with emblem, exhausts and horns; radar mast with two spinning scanners, yard, masthead lights, antennas and signal pennants.", params: {}, variants: 1, mount: "ground", build(y) {
    y.aoBase = null;
    const Y = [[1.5, 0, D, 3.2, "end"], [-1.5, 0, -D, 3.2, "end"], [0, 1.6, 0, 3, "side"], [0, -1.6, N, 3, "side"]];
    for (const [sA, rA, mA, JA, wM] of Y) {
      if (y.push(sA, 0, rA, mA), wM === "end") {
        const WA = -JA / 2 + 0.16, LM = JA / 2 - 0.16;
        y.push(0, 0.55, 0, 0, 0), zM(y, WA, LM, 0, 0.66, 4, { frame: g.white });
        for (let iM = 1; iM < 3; iM++) {
          const cM = WA + (iM + 0.5) / 4 * (LM - WA);
          y.box("paint", g.black, 0.02, 0.5, 0.012, cM + 0.12, 0.3, 0.035, { rz: -0.5, r: 4e-3 }), y.cyl("metal", g.black, 0.02, 0.03, cM, 0.05, 0.035, { rx: D, seg: 6 });
        }
        y.pop(), xA(y, "HALYARD", 0.12, g.navy, 0, 1.24, 3e-3, { weight: 0.19, depth: 6e-3 });
      } else {
        zM(y, -1.36, 0.26, 0.55, 1.2, 2, { frame: g.white }), VA(y, 0.82, 0.68, 1.26, g.whiteDk, -1);
        for (const [tA, WA] of [[-1.32, g.red], [1.32, g.green]]) y.box("paint", g.black, 0.26, 0.2, 0.2, tA, 1.3 - 0.02, 0.1, { r: 0.02 }), y.cyl("glow", WA, 0.05, 0.06, tA, 1.28, 0.2, { rx: D, seg: 10, glow: 1.4 }), y.blink(WA, tA, 1.28, 0.23, { size: 0.045, rate: 0.15, lo: 2.2, hi: 2.6 });
      }
      y.box("gloss", g.white, JA + 0.2, 0.05, 0.1, 0, 1.385, 0.05, { r: 0.02 }), y.box("paint", z(g.hull, g.whiteDk, 0.35), JA - 0.04, 0.1, 0.012, 0, 0.05, 6e-3, { r: 4e-3 }), y.pop();
    }
    const u = 1.4, o = 2.4, B = 0.85, a = 0.58, H = 0.3, m = 0.06, l = (sA) => 1 - m * (sA / o), _ = "#23262c", OA = [[0, g.steelDk], [0.1, g.steelDk], [0.1, g.mustard], [1.6, g.mustard], [1.6, g.white], [1.68, g.white], [1.68, g.teal], [1.84, g.teal], [1.84, g.white], [1.89, g.white], [1.89, _], [o - 0.08, _], [o, _]], yA = x("ferryFunnel2", () => {
      const sA = new f(), rA = Z(B, a, H, 5), mA = OA.map(([oM], jj) => {
        const pA = l(oM) * (jj === OA.length - 1 ? 1.035 : 1);
        return rA.map(([yM, SM]) => [yM * pA, oM, SM * pA]);
      });
      h(sA, mA, (oM) => [0, OA[oM][0], 0], (oM, jj, pA, yM) => w(OA[yM][1]), true);
      const JA = l(o) * 1.035, wM = l(o) * 0.9, tA = rA.map(([oM, jj]) => [oM * JA, o, jj * JA]), WA = rA.map(([oM, jj]) => [oM * wM, o, jj * wM]), LM = rA.map(([oM, jj]) => [oM * wM, o - 0.06, jj * wM]);
      h(sA, [tA, WA], () => [0, o - 1, 0], () => w(_), true), h(sA, [WA, LM], () => [0, o + 1, 0], () => w("#17181c"), true), X(sA, LM, [0, 1, 0], w("#17181c"));
      const iM = rA.map(([oM, jj]) => [oM * 1.05, 0, jj * 1.05]), cM = rA.map(([oM, jj]) => [oM * 1.05, 0.06, jj * 1.05]), kM = rA.map(([oM, jj]) => [oM, 0.06, jj]);
      return h(sA, [iM, cM], () => [0, 0.03, 0], () => w(g.steelDk), true), h(sA, [cM, kM], () => [0, -1, 0], () => w(g.steelDk), true), sA.geo();
    });
    y.add("gloss", yA, "white", 0, u, 0, {}), y.col(-B, u, -a, B, u + o, a);
    const EA = u + o;
    for (const [sA, rA, mA, JA] of [[0.36, 0, 0.12, 0.55], [-0.36, 0, 0.12, 0.55], [0, 0.26, 0.06, 0.38]]) y.cyl("metal", "#2a2c31", mA, JA, sA, EA + JA / 2 - 0.06, rA, { seg: 16 }), y.lathe("metal", "#1d1e22", [[mA * 0.8, 0], [mA * 1.35, 0.05], [mA * 1.4, 0.09], [mA * 0.8, 0.07]], sA, EA + JA - 0.06, rA, { seg: 16 }), y.tor("metal", "#3a3c42", mA + 0.01, 0.012, sA, EA + 0.1, rA, { rx: D, rs: 4, ts: 16 });
    const CA = 0.95, iA = a * l(CA), F = Math.atan(m * a / o);
    for (const sA of [-1, 1]) {
      y.push(0, u + CA, sA * iA, sA > 0 ? 0 : N, -F), y.cyl("paint", g.white, 0.47, 0.012, 0, 0, 6e-3, { rx: D, seg: 36 }), y.cyl("paint", g.teal, 0.42, 0.014, 0, 0, 8e-3, { rx: D, seg: 36 }), y.tube("paint", g.white, [T(-0.25, -0.1, 0.018), T(-0.2, 0.13, 0.018), T(-0.02, 0.24, 0.018), T(0.16, 0.14, 0.018), T(0.14, -0.05, 0.018), T(0, -0.08, 0.018), T(-0.02, 0.06, 0.018), T(0.06, 0.05, 0.018)], 0.036, { radial: 6 }), y.tube("paint", g.white, [T(-0.27, -0.22, 0.018), T(-0.135, -0.28, 0.018), T(0, -0.22, 0.018), T(0.135, -0.28, 0.018), T(0.27, -0.22, 0.018)], 0.03, { radial: 6 }), y.pop();
      for (let rA = 0; rA < 11; rA++) {
        const mA = -0.5 + rA * 0.1, JA = 1.55;
        y.sph("metal", O(g.mustard, 0.8), 0.011, mA, u + JA, sA * (a * l(JA) + 4e-3), { ws: 5, hs: 3, half: true, rx: sA * D });
      }
    }
    const J = (sA) => B * l(sA);
    for (let sA = 0; sA < 10; sA++) {
      const rA = 0.3 + sA * 0.22;
      y.cyl("metal", g.galv, 0.013, 0.34, J(rA) + 0.09, u + rA, 0, { rx: D, seg: 6 });
    }
    for (const sA of [-1, 1]) y.tube("metal", g.galv, [T(J(0.1) + 0.02, u + 0.1, sA * 0.17), T(J(0.2) + 0.09, u + 0.2, sA * 0.17), T(J(o) + 0.09, u + o + 0.25, sA * 0.17), T(J(o) - 0.05, u + o + 0.42, sA * 0.17)], 0.018, { radial: 6 });
    y.push(-J(1.15) - 5e-3, u + 1.15, 0, -D, -F), y.box("paint", "#2b2e34", 0.5, 0.56, 0.02, 0, 0, 0.01, { r: 0.03 });
    for (let sA = 0; sA < 7; sA++) y.box("paint", O(g.mustard, 0.85), 0.46, 0.035, 0.035, 0, -0.24 + sA * 0.08, 0.025, { rx: -0.55, r: 8e-3 });
    y.pop();
    const AA = EA, jA = 7.4;
    y.lathe("gloss", g.white, [[0, AA], [0.1, AA], [0.085, AA + 0.12], [0.055, jA], [0, jA + 0.01]], 0, 0, 0, { seg: 12 });
    const gA = 6.05;
    y.box("gloss", g.white, 2.5, 0.1, 0.14, 0, gA, 0, { r: 0.03 });
    for (const sA of [-1, 1]) y.tube("gloss", g.white, [T(0, gA - 0.75, 0), T(sA * 0.9, gA - 0.04, 0)], 0.03, { radial: 6 }), y.box("gloss", g.whiteDk, 0.34, 0.24, 0.3, sA * 1.1, gA + 0.17, 0, { round: true, r: 0.05 }), IM(y, sA * 1.1, gA + 0.3, 0, 1.7, sA > 0 ? 2.4 : 2.9);
    const LA = 6.8;
    y.box("gloss", g.white, 0.08, 0.08, 1.9, 0, LA, 0, { r: 0.025 });
    for (const sA of [-1, 1]) y.cyl(t(y, "metal"), g.steelDk, 0.012, 1.1, 0, LA + 0.55, sA * 0.9, { seg: 6 }), y.sph("gloss", g.white, 0.07, 0, LA + 0.1, sA * 0.55, { ws: 10, hs: 6, half: true }), y.cyl("gloss", g.white, 0.035, 0.1, 0, LA + 0.05, sA * 0.55, { seg: 8 });
    y.cyl("paint", g.black, 0.07, 0.12, 0, jA - 0.25, 0, { seg: 10 }), y.blink("#fff4dc", 0, jA - 0.25, 0, { size: 0.06, rate: 0.12, lo: 2.4, hi: 2.8 }), y.cyl("paint", g.black, 0.07, 0.12, 0, LA - 0.45, 0, { seg: 10 }), y.blink("#fff4dc", 0, LA - 0.45, 0, { size: 0.055, rate: 0.12, lo: 2.2, hi: 2.6 }), y.blink("#ff5a4a", 0, jA + 0.08, 0, { size: 0.05, rate: 0.5, lo: 0.3, hi: 4.5 });
    for (const sA of [-1, 1]) y.push(sA * 0.12, 4.55, 0, 0, 0, -sA * D), y.lathe("gloss", g.white, [[0.03, 0], [0.035, 0.25], [0.06, 0.4], [0.13, 0.5], [0.12, 0.52], [0.05, 0.42]], 0, 0, 0, { seg: 14 }), y.pop();
    y.box("metal", g.steelDk, 0.12, 0.1, 0.12, 0.08, 4.95, 0, { r: 0.02 }), y.cyl("gloss", "#36383e", 0.1, 0.22, 0.25, 5.1, 0, { rz: D, seg: 14 }), y.cyl("glow", "#fff1d6", 0.085, 0.01, 0.362, 5.1, 0, { rz: D, seg: 14, glow: 1.2 });
    const kA = [0, LA + 0.02, 0.92], SA = [0, jA - 0.05, 0.05];
    y.tube(t(y, "rubber"), g.white, YA(kA, SA, 0.04, 8), 8e-3, { radial: 4 });
    const hA = [g.teal, g.mustard, g.coral, g.navy];
    for (let sA = 0; sA < 4; sA++) {
      const rA = (sA + 0.5) / 4.4, mA = YA(kA, SA, 0.04, 40)[Math.round(rA * 40)];
      y.flag(mA[0], mA[1], mA[2], { color: hA[sA], s: 1.25, ry: D });
    }
  } }, j.ferry_locker = { desc: "Lifejacket lockers on the ferry car deck (cover, collider 2.5 × 2.5 × 1.1): two GRP deck chests side by side with overhanging lids, piano hinges, hasps + padlocks, reflective tape, LIFEJACKETS lettering and the lifejacket pictogram.", params: {}, variants: 1, mount: "ground", build(y) {
    const Y = "#e9e5dc", u = z(g.coral, "#d9d2c6", 0.25);
    for (const o of [-1, 1]) {
      const B = o * 0.63;
      y.box("paint", "#5b616a", 2.44, 0.08, 1.14, 0, 0.04, B, { r: 0.02 }), y.box("gloss", Y, 2.4, 0.9, 1.1, 0, 0.08 + 0.45, B, { round: true, r: 0.06 });
      for (let a = 0; a < 4; a++) y.box("gloss", O(Y, 0.95), 0.05, 0.66, 0.02, -0.9 + a * 0.6, 0.53, B + o * 0.555, { r: 0.012 });
      y.box("gloss", u, 2.5, 0.12, 1.2, 0, 1.04, B, { round: true, r: 0.05 }), y.box("gloss", O(u, 0.88), 2.44, 0.03, 1.16, 0, 0.965, B, { r: 0.012 }), y.cyl("metal", g.galv, 0.02, 2.2, 0, 0.99, B - o * 0.56, { rz: D, seg: 8 }), y.box("paint", g.hazard, 2.36, 0.05, 6e-3, 0, 0.2, B + o * 0.553, { r: 2e-3 });
      for (const a of [-0.7, 0.7]) y.box("metal", g.steel, 0.08, 0.16, 0.03, a, 0.9, B + o * 0.565, { r: 0.01 }), y.box("metal", "#9a8a4a", 0.07, 0.07, 0.03, a, 0.8, B + o * 0.585, { r: 0.012 }), y.tor("metal", g.steel, 0.022, 6e-3, a, 0.85, B + o * 0.585, { rs: 4, ts: 10, arc: N });
      xA(y, "LIFEJACKETS", 0.17, g.navy, 0.08, 0.5, B + o * 0.552, { ry: o > 0 ? 0 : N, weight: 0.18, depth: 6e-3 }), xA(y, "40 ADULT · 10 CHILD", 0.06, g.navy, 0.08, 0.34, B + o * 0.552, { ry: o > 0 ? 0 : N, weight: 0.2, depth: 4e-3 });
    }
    for (const o of [-1, 1]) {
      y.push(o * 1.203, 0.55, 0, o * D), y.box("paint", g.white, 0.8, 0.5, 6e-3, 0, 0, 3e-3, { r: 0.01 });
      for (const B of [-1, 1]) y.box("paint", "#e07a3a", 0.16, 0.34, 6e-3, B * 0.11, -0.02, 8e-3, { r: 0.04 });
      y.box("paint", "#e07a3a", 0.12, 0.1, 6e-3, 0, 0.14, 8e-3, { r: 0.03 }), y.box("paint", g.white, 0.05, 0.08, 6e-3, 0, 0.1, 0.011, { r: 0.01 }), y.box("paint", g.navy, 0.3, 0.02, 6e-3, 0, -0.08, 0.011, { r: 4e-3 }), y.pop();
    }
    y.col(-1.25, 0, -1.25, 1.25, 1.1, 1.25), y.blob(3, 3);
  } };
  function QM(y, Y, u) {
    const o = Math.max(3, Math.round(u / 0.19));
    for (const B of [-u / 2 + 0.05, 0, u / 2 - 0.05]) y.box("wood", O(g.teak, y.r(0.95, 1.05)), Y, 0.09, 0.1, 0, 0.065, B, { r: 0.012 });
    for (const B of [-u / 2 + 0.05, 0, u / 2 - 0.05]) y.box("wood", O(g.teakDk, y.r(0.95, 1.05)), Y, 0.02, 0.1, 0, 0.01, B, { r: 5e-3 });
    for (let B = 0; B < o; B++) y.box("wood", O("#d2b082", y.r(0.9, 1.05)), 0.12, 0.022, u, -Y / 2 + 0.06 + B / (o - 1) * (Y - 0.12), 0.121, 0, { r: 6e-3 });
  }
  j.ferry_cargo = { desc: "Deck cargo on the ferry car deck (cover: carton half solid 1 × 2 × 0.9, mesh cage half 1 × 2 × 1.4 = rail): a galvanised mesh stillage of spare fenders, buoys and rope on one pallet, a strapped stack of KRAKEN LINES cartons on the other, ratchet straps to deck rings, a sack truck.", params: {}, variants: 1, mount: "ground", build(y) {
    y.push(0.5, 0, 0), QM(y, 0.98, 1.98), y.pop();
    for (let _ = 0; _ < 2; _++) for (let OA = 0; OA < 3; OA++) {
      const yA = 0.145 + _ * 0.37, EA = -0.64 + OA * 0.64;
      y.box("paint", O("#c8a177", y.r(0.9, 1.04)), 0.9, 0.36, 0.62, 0.5, yA + 0.18, EA, { r: 0.015 }), y.box("paint", "#e7dcc4", 0.9, 4e-3, 0.08, 0.5, yA + 0.362, EA, { r: 1e-3 }), y.decal("stencil", 0.4, 0.2, 0.95 + 2e-3, yA + 0.2, EA, { ry: D, tint: g.navy });
    }
    for (const _ of [-0.35, 0.35]) {
      y.box("paint", "#e0a33a", 0.92, 0.012, 0.05, 0.5, 0.892, _, { r: 3e-3 });
      for (const OA of [-1, 1]) y.box("paint", "#e0a33a", 0.012, 0.86, 0.05, 0.5 + OA * 0.456, 0.46, _, { r: 3e-3 });
      y.box("metal", g.steel, 0.1, 0.06, 0.06, 0.956, 0.62, _, { r: 0.015 });
    }
    y.push(-0.5, 0, 0), QM(y, 0.98, 1.98), y.pop();
    const Y = -0.98, u = -0.02, o = 0.145, B = 1.4, a = -0.98, H = 0.98;
    for (const [_, OA] of [[Y, a], [u, a], [Y, H], [u, H]]) y.box("metal", g.galv, 0.045, B - o, 0.045, _, (o + B) / 2, OA, { r: 0.01 });
    for (const _ of [o + 0.02, B - 0.02]) {
      for (const OA of [a, H]) y.box("metal", g.galv, u - Y, 0.04, 0.04, (Y + u) / 2, _, OA, { r: 8e-3 });
      for (const OA of [Y, u]) y.box("metal", g.galv, 0.04, 0.04, H - a, OA, _, 0, { r: 8e-3 });
    }
    const m = B - o - 0.06, l = (o + B) / 2;
    for (const [_, OA, yA, EA] of [[u - Y, (Y + u) / 2, H, 0], [u - Y, (Y + u) / 2, a, 0], [H - a, Y, 0, D], [H - a, u, 0, D]]) y.add("fence", x("pl|" + _.toFixed(2) + "|" + m.toFixed(2), () => new M.PlaneGeometry(_ - 0.05, m)), g.galv, OA, l, yA, { ry: EA, uvs: [(_ - 0.05) / 0.09, m / 0.09] });
    y.add("fence", x("pl|cagetop", () => new M.PlaneGeometry(u - Y - 0.05, H - a - 0.05)), g.galv, (Y + u) / 2, B, 0, { rx: -D, uvs: [10, 20] });
    for (let _ = 0; _ < 3; _++) y.lathe("rubber", g.black, [[0, -0.42], [0.1, -0.41], [0.16, -0.34], [0.17, -0.2], [0.17, 0.2], [0.16, 0.34], [0.1, 0.41], [0, 0.42]], -0.72 + _ % 2 * 0.22, 0.34 + _ * 0.33, -0.3 + _ * 0.28, { rx: D, rz: 0.1 * _, seg: 12 });
    y.sph("gloss", g.coral, 0.3, -0.45, 0.47, 0.5, { ws: 16, hs: 10 }), y.cyl("gloss", g.white, 0.302, 0.08, -0.45, 0.47, 0.5, { seg: 16, open: true });
    for (let _ = 0; _ < 3; _++) y.tor("rubber", O(g.rope, 0.95 + _ * 0.03), 0.25 - _ * 0.012, 0.03, -0.5, 0.2 + _ * 0.055, -0.55, { rx: D, rs: 5, ts: 18 });
    y.box("paint", g.white, 0.5, 0.18, 6e-3, -0.5, 1.2, H + 0.03, { r: 0.01 }), xA(y, "SPARES", 0.09, g.navy, -0.5, 1.155, H + 0.034, { weight: 0.2, depth: 4e-3 }), y.push(-0.99, 0, -0.55, 0, 0, 0.12);
    for (const _ of [-1, 1]) y.cyl("metal", g.red, 0.018, 1.2, -0.05, 0.62, _ * 0.18, { seg: 8 });
    y.box("metal", g.steelDk, 0.28, 0.02, 0.4, 0.06, 0.05, 0, { r: 6e-3 });
    for (const _ of [-1, 1]) y.cyl("rubber", g.black, 0.1, 0.06, -0.12, 0.1, _ * 0.22, { rx: D, seg: 14, bevel: 0.02 });
    y.cyl("metal", g.red, 0.018, 0.4, -0.05, 1.22, 0, { rx: D, seg: 8 }), y.pop(), y.col(0, 0, -1, 1, 0.9, 1), y.col(-1, 0, -1, 0, 1.4, 1, { rail: true }), y.blob(2.4, 2.4);
  } }, j.ferry_stair = { desc: "Ferry sun-deck stair dressing (place at the origin; mirrored): steel cheek stringers with flanges + support flats on both side faces, stanchion handrails with mid rails following the slope, landing stubs on the sun deck, foot returns. Handrails = rail colliders.", params: {}, variants: 1, mount: "ground", build(y) {
    y.aoBase = null;
    const Y = [12.6, 1.3], u = [6.5, 3.8], o = Math.hypot(u[0] - Y[0], u[1] - Y[1]), B = (u[0] - Y[0]) / o, a = (u[1] - Y[1]) / o, H = a, m = -B, l = Math.atan2(a, B) - N, _ = O("#6d7f95", 0.78), OA = g.galv, yA = (EA) => [Y[0] + B * EA, Y[1] + a * EA];
    for (const [EA, CA] of [[-2.9, -1], [-0.9, 1]]) {
      const iA = EA + CA * 0.03, F = EA + CA * 0.07, J = yA(o / 2), AA = 0.2;
      y.box("metal", _, o + 0.3, 0.3, 0.06, J[0] - H * AA + B * -0.15, J[1] - m * AA + a * -0.15, iA, { rz: l, r: 0.015 }), y.box("metal", O(_, 0.85), o + 0.3, 0.04, 0.1, J[0] - H * 0.37 + B * -0.15, J[1] - m * 0.37 + a * -0.15, EA + CA * 0.05, { rz: l, r: 0.01 }), p(y, () => {
        for (let tA = 0.9; tA < o - 0.3; tA += 1.05) {
          const WA = yA(tA), LM = WA[1] - 0.4, iM = LM - sM;
          iM > 0.12 && k(y, "metal", _, 0.07, iM, 0.04, WA[0] + 0.14, sM + iM / 2, EA + CA * 0.02);
          for (const cM of [-0.07, 0.07]) v(y, "metal", "#50555c", 0.014, 0.016, WA[0] + cM * B - H * 0.08, WA[1] + cM * a - m * 0.08, EA + CA * 0.064, { rx: D });
        }
      });
      const jA = [0.45, 2, 3.55, 5.1, o - 0.25], gA = [];
      for (const tA of jA) {
        const WA = yA(tA);
        q(y, "metal", OA, 0.022, 1.2, WA[0], WA[1] + 0.35, F, { seg: 8 }), k(y, "metal", O(OA, 0.8), 0.07, 0.12, 0.05, WA[0], WA[1] - 0.15, EA + CA * 0.045), gA.push([WA[0], WA[1] + 0.95, F]);
      }
      const LA = yA(0), kA = yA(o), SA = CA < 0 ? EA + 0.03 : F, hA = [[LA[0] + 0.45, sM + 0.02, F], [LA[0] + 0.45, sM + 0.6, F], [LA[0] + 0.2, LA[1] + 0.92, F], ...gA, [kA[0] - 0.05, kA[1] + 0.95, F], [kA[0] - 0.3, kA[1] + 0.95, SA], [kA[0] - 0.42, kA[1] + 0.95, SA], [kA[0] - 0.55, kA[1] + 0.82, SA], [kA[0] - 0.55, kA[1] + 0.03, SA]];
      y.tube("metal", OA, hA.map((tA) => T(...tA)), 0.025, { radial: 8 }), y.tube("metal", OA, [T(LA[0] + 0.3, LA[1] + 0.5 - 0.05, F), ...jA.map((tA) => {
        const WA = yA(tA);
        return T(WA[0], WA[1] + 0.5, F);
      }), T(kA[0] - 0.2, kA[1] + 0.5, F), T(kA[0] - 0.55, kA[1] + 0.5, SA)], 0.016, { radial: 6 }), y.cyl("metal", O(OA, 0.8), 0.045, 0.02, kA[0] - 0.55, kA[1] + 0.01, SA, { seg: 8 }), y.cyl("metal", O(OA, 0.8), 0.045, 0.02, LA[0] + 0.45, sM + 0.01, F, { seg: 8 });
      const [sA, rA] = CA < 0 ? [EA - 0.13, EA - 0.045] : [EA + 0.045, EA + 0.13], mA = (tA) => Y[1] + (Y[0] - tA) * (u[1] - Y[1]) / (Y[0] - u[0]);
      y.col(Y[0], sM + 0.06, sA, LA[0] + 0.5, sM + 0.95, rA, { rail: true });
      for (let tA = 0; tA < 4; tA++) {
        const WA = Y[0] - (Y[0] - u[0]) * tA / 4, LM = Y[0] - (Y[0] - u[0]) * (tA + 1) / 4;
        y.col(LM, mA(WA) + 0.06, sA, WA, mA(LM) + 0.98, rA, { rail: true });
      }
      const [JA, wM] = CA < 0 ? [EA + 5e-3, EA + 0.1] : [sA, rA];
      y.col(kA[0] - 0.55, u[1] + 0.06, JA, u[0], u[1] + 0.98, wM, { rail: true });
    }
  } }, j.tug_ramp_rails = { desc: "Scaffold-style guardrails for the tug ramp (place at the origin; mirrored): galvanised standards on sole boards, sloped top + mid rails, timber toe boards, couplers, ties into the adjacent scaffold tower and the tug deck rail. Guardrails = rail colliders.", params: { z0: "ramp foot z (-7.6)", z1: "ramp head z (-13.0; Zone Control: -13.45, landing in the stern notch)" }, variants: 1, mount: "ground", build(y, Y = {}) {
    y.aoBase = 0;
    const u = Y.z0 ?? -7.6, o = Y.z1 ?? -13, B = 2.6, a = (J) => B * (u - J) / (u - o), H = -13, m = "#c3cad0", l = "#8f979e", _ = "#b89568", OA = [-7.95, -9.6, -11.25, -12.87], yA = [-7.95, -9.6, -11.85, -12.87];
    for (const [J, AA, jA] of [[16.4, -1, OA], [18.6, 1, yA]]) {
      const gA = J + AA * 0.1, LA = J + AA * 0.045;
      for (const JA of jA) {
        const wM = a(JA) + 0.95;
        q(y, "metal", m, 0.024, wM + 0.05, gA, (wM + 0.05) / 2, JA, { seg: 8 }), k(y, "metal", l, 0.15, 0.012, 0.15, gA, 6e-3, JA), k(y, "wood", O(_, 0.8), 0.24, 0.035, 0.4, gA, 0, JA), p(y, () => {
          for (const tA of [a(JA) + 0.5, wM]) k(y, "metal", l, 0.07, 0.06, 0.07, gA, tA, JA);
        });
      }
      const kA = jA[0] + 0.25, SA = jA[jA.length - 1] - 0.06;
      for (const JA of [0.95, 0.5]) y.tube("metal", m, [T(gA, a(kA) + JA, kA), T(gA, a(SA) + JA, SA)], 0.024, { radial: 8 });
      const hA = u - 0.1, sA = Math.max(o, H) + 0.08, rA = Math.hypot(hA - sA, a(sA) - a(hA)), mA = Math.atan2(a(sA) - a(hA), hA - sA);
      y.box("wood", _, 0.035, 0.15, rA, LA, (a(hA) + a(sA)) / 2 + 0.075, (hA + sA) / 2, { rx: mA, r: 8e-3 }), p(y, () => {
        for (const JA of jA) k(y, "metal", l, 0.03, 0.06, 0.05, LA + AA * 0.03, a(JA) + 0.09, JA);
      });
    }
    for (const [J, AA] of [[-12.87, [2.3, 3.18]], [-11.85, [2.3]]]) for (const jA of AA) y.tube("metal", m, [T(18.7, jA, J), T(19.05, jA, J)], 0.024, { radial: 6 }), p(y, () => {
      k(y, "metal", l, 0.07, 0.07, 0.07, 18.7, jA, J), k(y, "metal", l, 0.07, 0.07, 0.07, 19.03, jA, J);
    });
    y.tube("metal", m, [T(16.3, 2.85, -12.87), T(16.21, 2.85, -13.06)], 0.02, { radial: 6 }), p(y, () => k(y, "metal", l, 0.07, 0.07, 0.07, 16.3, 2.85, -12.87));
    const EA = -7.95, CA = -8.3, iA = -12.95, F = 4;
    for (const [J, AA, jA, gA] of [[15.98, 16.355, 16.2, 16.355], [18.645, 19.02, 18.645, 18.8]]) {
      y.col(jA, 0.06, CA, gA, a(CA) + 0.98, EA, { rail: true });
      for (let LA = 0; LA < F; LA++) {
        const kA = CA + (iA - CA) * LA / F, SA = CA + (iA - CA) * (LA + 1) / F;
        y.col(J, a(kA) + 0.06, SA, AA, a(SA) + 0.98, kA, { rail: true });
      }
    }
  } };
  const mM = { zF: -29.95, zH: -24, yH: 2.6, xL: 17.9, xR: 20.1, cx0: 12.1, cx1: 13.1, cx2: 14.5, cz0: -16.9, cz1: -13.3, cA: 0.87, cB: 1.73 };
  function aM(y, Y, u, o, B, a, H, m = 1, l = 0) {
    const _ = u - Y, OA = B - o, yA = H - a, EA = O("#c9a47a", m), CA = O("#8d6a45", m);
    y.push((Y + u) / 2, o, (a + H) / 2, l), y.box("wood", EA, _ - 0.03, OA - 0.02, yA - 0.03, 0, OA / 2, 0, { r: 0.015 }), p(y, () => {
      for (let iA = 1; iA < 5; iA++) {
        const F = iA * OA / 5;
        k(y, "wood", O(EA, 0.72), _ - 0.05, 8e-3, yA - 0.018, 0, F, 0), k(y, "wood", O(EA, 0.72), _ - 0.018, 8e-3, yA - 0.05, 0, F, 0);
      }
      for (const iA of [0.05, OA - 0.05]) {
        for (const F of [-1, 1]) k(y, "wood", CA, _ - 0.01, 0.09, 0.04, 0, iA, F * (yA / 2 - 0.02));
        for (const F of [-1, 1]) k(y, "wood", CA, 0.04, 0.09, yA - 0.09, F * (_ / 2 - 0.02), iA, 0);
      }
      for (const iA of [-1, 1]) for (const F of [-1, 1]) k(y, "wood", CA, 0.06, OA - 0.16, 0.06, iA * (_ / 2 - 0.03), OA / 2, F * (yA / 2 - 0.03));
      for (const iA of [-1, 1]) y.push(iA * (_ / 2 - 0.012), OA / 2, 0, 0, Math.atan2(OA - 0.2, yA - 0.2) * iA), k(y, "wood", CA, 0.025, 0.08, Math.hypot(yA - 0.2, OA - 0.2), 0, 0, 0), y.pop();
    }), y.box("wood", O(EA, 1.05), _ - 0.05, 0.03, yA - 0.05, 0, OA - 5e-3, 0, { r: 0.01 }), y.pop();
  }
  function QA(y, Y, u, o, B, a = 1) {
    const H = u - Y, m = B - o, l = (Y + u) / 2, _ = (o + B) / 2;
    for (const OA of [-0.42, 0, 0.42]) k(y, "wood", O("#7b5a3a", a), H - 0.02, 0.1, 0.1, l, 0.05, _ + OA * (m - 0.1) / 0.84 * 0.84);
    p(y, () => {
      for (let OA = 0; OA < Math.round(H / 0.17); OA++) k(y, "wood", O("#b48f63", a * (0.92 + OA % 3 * 0.04)), 0.13, 0.022, m - 0.02, Y + 0.08 + OA * ((H - 0.16) / Math.max(1, Math.round(H / 0.17) - 1)), 0.111, _);
    });
  }
  j.tug_access = { desc: "Zone Control access to the tug deck (place at the origin; mirrored): steel boarding-stair dressing on the tug-bow-stair block (cheek stringers, support flats, galvanised stanchion handrails with mid rails, hazard kick plates, rails turned down onto the foredeck — rail colliders) and a two-step stack of braced timber spares crates on pallets against the west hull side (colliders: 0.87 m and 1.73 m steps up to the 2.6 m deck), stencilled NUDGE SPARES, lashed with rope.", params: {}, variants: 1, mount: "ground", build(y) {
    y.aoBase = 0;
    const { zF: Y, zH: u, yH: o, xL: B, xR: a } = mM, H = u - Y, m = Math.hypot(H, o), l = H / m, _ = o / m, OA = Math.atan2(o, H), yA = -_, EA = l, CA = (rA) => [Y + l * rA, _ * rA], iA = (rA) => o * (rA - Y) / H, F = O("#6d7f95", 0.78), J = g.galv;
    for (const [rA, mA] of [[B, -1], [a, 1]]) {
      const JA = rA + mA * 0.03, wM = rA + mA * 0.07, tA = CA(m / 2);
      y.box("metal", F, 0.06, 0.3, m + 0.3, JA, tA[1] - EA * 0.2 - _ * 0.15, tA[0] - yA * 0.2 - l * 0.15, { rx: -OA, r: 0.015 }), y.box("metal", O(F, 0.85), 0.1, 0.04, m + 0.3, rA + mA * 0.05, tA[1] - EA * 0.37 - _ * 0.15, tA[0] - yA * 0.37 - l * 0.15, { rx: -OA, r: 0.01 }), p(y, () => {
        for (let pA = 0.9; pA < m - 0.3; pA += 1.05) {
          const yM = CA(pA), SM = yM[1] - 0.4;
          SM > 0.12 && k(y, "metal", F, 0.04, SM, 0.07, rA + mA * 0.02, SM / 2, yM[0] - 0.14);
          for (const JM of [-0.07, 0.07]) v(y, "metal", "#50555c", 0.014, 0.016, rA + mA * 0.064, yM[1] + JM * _ - EA * 0.08, yM[0] + JM * l - yA * 0.08, { rz: D });
        }
      });
      const WA = [0.45, 2, 3.55, 5.1, m - 0.25], LM = [];
      for (const pA of WA) {
        const yM = CA(pA);
        q(y, "metal", J, 0.022, 1.2, wM, yM[1] + 0.35, yM[0], { seg: 8 }), k(y, "metal", O(J, 0.8), 0.05, 0.12, 0.07, rA + mA * 0.045, yM[1] - 0.15, yM[0]), LM.push([wM, yM[1] + 0.95, yM[0]]);
      }
      const iM = CA(0), cM = CA(m), kM = [[wM, 0.02, iM[0] - 0.45], [wM, 0.6, iM[0] - 0.45], [wM, iM[1] + 0.92, iM[0] - 0.2], ...LM, [wM, cM[1] + 0.95, cM[0] + 0.05], [wM, cM[1] + 0.95, cM[0] + 0.3], [wM, cM[1] + 0.82, cM[0] + 0.42], [wM, cM[1] + 0.03, cM[0] + 0.42]];
      y.tube("metal", J, kM.map((pA) => T(...pA)), 0.025, { radial: 8 }), y.tube("metal", J, [T(wM, iM[1] + 0.45, iM[0] - 0.3), ...WA.map((pA) => {
        const yM = CA(pA);
        return T(wM, yM[1] + 0.5, yM[0]);
      }), T(wM, cM[1] + 0.5, cM[0] + 0.2), T(wM, cM[1] + 0.5, cM[0] + 0.42)], 0.016, { radial: 6 }), y.cyl("metal", O(J, 0.8), 0.045, 0.02, wM, cM[1] + 0.01, cM[0] + 0.42, { seg: 8 }), y.cyl("metal", O(J, 0.8), 0.045, 0.02, wM, 0.01, iM[0] - 0.45, { seg: 8 });
      const [oM, jj] = mA < 0 ? [rA - 0.13, rA - 0.045] : [rA + 0.045, rA + 0.13];
      y.col(oM, 0.06, iM[0] - 0.5, jj, 0.95, Y, { rail: true });
      for (let pA = 0; pA < 4; pA++) {
        const yM = Y + H * pA / 4, SM = Y + H * (pA + 1) / 4;
        y.col(oM, iA(yM) + 0.06, yM, jj, iA(SM) + 0.98, SM, { rail: true });
      }
      y.col(oM, o + 0.06, u, jj, o + 0.98, u + 0.45, { rail: true });
    }
    const { cx0: AA, cx1: jA, cx2: gA, cz0: LA, cz1: kA, cA: SA, cB: hA } = mM, sA = (LA + kA) / 2;
    QA(y, AA + 0.02, jA - 0.01, LA + 0.03, sA - 0.02, 0.95), QA(y, AA + 0.02, jA - 0.01, sA + 0.02, kA - 0.03, 1.02), aM(y, AA + 0.04, jA - 0.02, 0.122, SA, LA + 0.05, sA - 0.03, 0.97), aM(y, AA + 0.02, jA - 0.03, 0.122, SA, sA + 0.03, kA - 0.06, 1.04), QA(y, jA + 0.02, gA - 0.03, LA + 0.03, kA - 0.03, 0.9), aM(y, jA + 0.04, gA - 0.04, 0.122, 0.93, LA + 0.05, kA - 0.05, 1), aM(y, jA + 0.05, gA - 0.05, 0.93, hA, LA + 0.12, sA - 0.02, 0.92), aM(y, jA + 0.06, gA - 0.04, 0.93, hA, sA + 0.02, kA - 0.1, 1.06), y.push(AA + 0.05, 0, sA, -D), xA(y, "NUDGE", 0.12, "#3a3f4a", 0.6, 0.55, 4e-3, { weight: 0.2 }), xA(y, "SPARES", 0.09, "#3a3f4a", 0.6, 0.38, 4e-3, { weight: 0.2, spacing: 0.3 }), xA(y, "THIS WAY UP", 0.06, "#3a3f4a", -0.7, 0.62, 4e-3, { weight: 0.2, spacing: 0.2 }), y.pop(), y.push(jA + 0.075, 0, sA, -D), xA(y, "HALYARD BOATYARD", 0.09, "#3a3f4a", 0.7, 1.45, 4e-3, { weight: 0.2, spacing: 0.2 }), y.pop(), y.push((jA + gA) / 2, 0, LA + 0.065, N), xA(y, "FRAGILE", 0.08, "#b0473b", 0, 0.62, 4e-3, { weight: 0.22, spacing: 0.3 }), y.pop();
    for (const rA of [LA + 0.45, sA - 0.35, sA + 0.4, kA - 0.45]) y.tube(t(y, "rubber"), g.rope, [T(jA + 0.03, 0.2, rA), T(jA + 0.03, hA + 5e-3, rA), T(gA - 0.3, hA + 0.02, rA), T(gA - 0.05, hA + 5e-3, rA)], 0.012, { radial: 4 });
    y.tor("rubber", g.ropeDk, 0.2, 0.035, AA + 0.5, SA + 0.035, kA - 0.55, { rx: D, rs: 5, ts: 16 }), y.tor("rubber", g.rope, 0.14, 0.03, AA + 0.5, SA + 0.09, kA - 0.55, { rx: D, rs: 5, ts: 14 }), y.col(AA, 0, LA, jA, SA, kA), y.col(jA, 0, LA, gA, hA, kA);
  } };
  function IA(y) {
    const { L: Y, B: u, T: o, F0: B, F1: a, tr: H = 0.7, rake: m = 0.3, chine: l = 0, flare: _ = 0.06, NS: OA = 20, NP: yA = 7, sternRake: EA = 0.1, keelRise: CA = 0.6 } = y, iA = (sA) => {
      if (sA < 0.46) {
        const mA = sA / 0.46;
        return u / 2 * (H + (1 - H) * Math.pow(Math.sin(mA * D), 0.6));
      }
      const rA = (sA - 0.46) / 0.54;
      return u / 2 * Math.pow(Math.max(0, Math.cos(rA * D)), 0.85);
    }, F = (sA) => B + (a - B) * Math.pow(sA, 1.7), J = (sA) => -o * (1 - CA * Math.pow(Math.max(0, (sA - 0.55) / 0.45), 1.6)) * (1 - 0.25 * Math.pow(Math.max(0, 0.12 - sA) / 0.12, 1.5)), AA = (sA, rA) => -Y / 2 + sA * Y + m * Math.pow(Math.max(0, (sA - 0.8) / 0.2), 1.5) * rA * rA - EA * Math.pow(Math.max(0, (0.06 - sA) / 0.06), 1) * rA, jA = (sA, rA, mA) => {
      const JA = iA(sA), wM = J(sA), tA = F(sA), WA = 1 - Math.cos(rA * D), LM = Math.pow(Math.sin(rA * D), 0.55), iM = rA < 0.55 ? rA / 0.55 * 0.92 : 0.92 + (rA - 0.55) / 0.45 * 0.08, cM = rA < 0.55 ? rA / 0.55 * 0.18 : 0.18 + (rA - 0.55) / 0.45 * 0.82, kM = LM * (1 - l) + iM * l, oM = WA * (1 - l) + cM * l, jj = mA * JA * kM * (1 + _ * Math.max(0, rA - 0.6) / 0.4), pA = wM + (tA - wM) * oM;
      return [jj, pA, AA(sA, oM)];
    }, gA = (sA, rA) => {
      let mA = 0, JA = 1;
      for (let wM = 0; wM < 24; wM++) {
        const tA = (mA + JA) / 2;
        jA(sA, tA, 1)[1] < rA ? mA = tA : JA = tA;
      }
      return (mA + JA) / 2;
    };
    return { geo: () => {
      const sA = new f(), rA = [];
      for (let mA = 0; mA <= OA; mA++) {
        const JA = mA / OA, wM = [];
        for (let tA = -yA; tA <= yA; tA++) wM.push(jA(Math.min(JA, 0.9995), Math.abs(tA) / yA, tA < 0 ? -1 : 1));
        rA.push(wM);
      }
      if (h(sA, rA, (mA, JA) => {
        const wM = mA / OA;
        return [0, (J(wM) + F(wM)) / 2, rA[mA][JA][2]];
      }, null), H > 0.05) {
        const mA = rA[0];
        X(sA, mA.map((JA) => [JA[0], JA[1], JA[2]]), [0, 0, -1], null);
      }
      return sA.geo();
    }, band: (sA, rA, mA = 4e-3) => {
      const JA = new f(), wM = [], tA = 0.995, WA = (cM, kM) => typeof cM == "function" ? cM(kM) : cM, LM = WA(sA, 0.5), iM = WA(rA, 0.5);
      for (let cM = 0; cM <= OA * 2; cM++) {
        const kM = Math.min(tA, cM / (OA * 2)), oM = WA(sA, kM), jj = WA(rA, kM);
        if (J(kM) > oM - 1e-3 || F(kM) < jj) continue;
        const pA = [];
        for (const yM of [-1, 1]) {
          const SM = jA(kM, gA(kM, oM), yM), JM = jA(kM, gA(kM, jj), yM);
          pA.push([SM[0] + yM * mA, SM[1], SM[2]], [JM[0] + yM * mA, JM[1], JM[2]]);
        }
        wM.push(pA);
      }
      for (const cM of [0, 1]) {
        const kM = wM.map((oM) => [oM[cM * 2], oM[cM * 2 + 1]]);
        kM.length > 1 && h(JA, kM, (oM) => [0, (LM + iM) / 2, kM[oM][0][2]], null);
      }
      if (H > 0.05 && wM.length) {
        const cM = wM[0];
        h(JA, [[cM[0], cM[1]], [cM[2], cM[3]]].map((kM) => kM.map((oM) => [oM[0], oM[1], oM[2] - mA])), () => [0, (LM + iM) / 2, cM[0][2] + 1], null);
      }
      return JA.geo();
    }, deck: (sA = 0.04, rA = 0) => {
      const mA = new f(), JA = [];
      for (let wM = 0; wM <= OA; wM++) {
        const tA = Math.min(0.998, wM / OA), WA = jA(tA, 1, -1), LM = jA(tA, 1, 1), iM = [];
        for (let cM = 0; cM <= 4; cM++) {
          const kM = cM / 4, oM = WA[0] + (LM[0] - WA[0]) * kM;
          iM.push([oM * (1 - rA), WA[1] - 0.012 + sA * Math.sin(kM * N) * Math.min(1, iA(tA) * 4), WA[2]]);
        }
        JA.push(iM);
      }
      return h(mA, JA, (wM, tA) => [JA[wM][tA][0], JA[wM][tA][1] - 1, JA[wM][tA][2]], null), mA.geo();
    }, sheer: (sA) => {
      const rA = jA(sA, 1, 1);
      return [rA[0], rA[1], rA[2]];
    }, at: jA, yAt: gA, hb: iA, top: F, bot: J, spec: y };
  }
  function HA(y, Y) {
    return x("hull|" + y, () => {
      const u = IA(Y);
      return { h: u, body: u.geo(), deckGeo: u.deck(Y.camber ?? 0.05) };
    });
  }
  const FA = (y, Y, u) => {
    const o = u / y + 0.5, B = Math.max(0, Math.sin(o * N));
    return Y * (0.55 + 0.45 * Math.pow(B, 0.45)) + 0.05 * Math.pow(Math.abs(o - 0.5) * 2, 3);
  };
  function DM(y, Y, u) {
    return x(["kayak", y, Y, u].join("|"), () => {
      const o = new f(), B = 16, a = 6, H = [];
      for (let m = 0; m <= B; m++) {
        const l = m / B, _ = Math.pow(Math.sin(l * N), 0.62), OA = (l - 0.5) * y, yA = Math.max(4e-3, Y / 2 * _), EA = FA(y, u, OA), CA = u * 0.45 * Math.pow(Math.sin(l * N), 0.5), iA = [];
        for (let F = 0; F < a * 2; F++) {
          const J = F / (a * 2) * I, AA = Math.cos(J), jA = Math.sin(J);
          iA.push([yA * AA, jA > 0 ? jA * EA : jA * CA, OA]);
        }
        H.push(iA);
      }
      return h(o, H, (m) => [0, 0.02, H[m][0][2]], null, true), o.geo();
    });
  }
  function RA(y, Y, u, o, B, a, H, m, l = 0) {
    y.push(Y, u, o, l), y.add("gloss", DM(B, a, H), m, 0, 0, 0, {});
    const _ = -0.12, OA = FA(B, H, _);
    y.cyl("gloss", g.black, a * 0.3, 0.03, 0, OA - 5e-3, _, { sz: 1.9, seg: 16 }), y.tor("gloss", O(m, 0.7), a * 0.31, 0.02, 0, OA + 0.012, _, { rx: D, sy: 1.9, rs: 5, ts: 20 });
    for (const yA of [0.62, 0.9, -0.8]) y.box("rubber", g.black, a * 0.5 * Math.pow(Math.sin((yA / B + 0.5) * N), 0.62), 0.012, 0.014, 0, FA(B, H, yA) + 4e-3, yA, { r: 4e-3 });
    y.box("gloss", g.black, 0.018, 0.012, 0.9, 0, FA(B, H, 0.95) + 6e-3, 0.95, { r: 4e-3 });
    for (const yA of [B / 2 - 0.08, -B / 2 + 0.08]) y.tor("rubber", g.black, 0.035, 8e-3, 0, FA(B, H, yA) - 0.04, yA, { rs: 3, ts: 8 });
    y.pop();
  }
  function EM(y, Y = "#2b2e34", u = 0, o = 1) {
    y.push(0, 0, -0.06 * o, 0, -u), y.box("metal", g.steelDk, 0.12 * o, 0.22 * o, 0.1 * o, 0, 0.02 * o, 0.04 * o, { r: 0.02 }), y.box("gloss", Y, 0.34 * o, 0.36 * o, 0.5 * o, 0, 0.26 * o, -0.2 * o, { round: true, r: 0.1 * o }), y.box("gloss", O(Y, 1.4), 0.345 * o, 0.03 * o, 0.505 * o, 0, 0.14 * o, -0.2 * o, { r: 0.01 }), y.box("gloss", Y, 0.16 * o, 0.62 * o, 0.2 * o, 0, -0.26 * o, -0.16 * o, { round: true, r: 0.05 * o }), y.box("gloss", Y, 0.36 * o, 0.03 * o, 0.34 * o, 0, -0.5 * o, -0.2 * o, { r: 0.01 }), y.box("gloss", Y, 0.1 * o, 0.14 * o, 0.26 * o, 0, -0.6 * o, -0.16 * o, { round: true, r: 0.04 * o });
    for (let B = 0; B < 3; B++) k(y, "metal", g.steel, 0.02 * o, 0.14 * o, 0.05 * o, 0, -0.6 * o, -0.3 * o, { rz: B * I / 3 + 0.3 });
    y.pop();
  }
  const OM = -1.6;
  function rM(y, Y, u, o = {}) {
    const B = o.dy ?? 0.45, a = OM + B, H = o.unit ?? 4.4, m = Math.max(1, Math.round(Y / H)), l = Y / m, _ = o.wood ?? "#b99670";
    for (let OA = 0; OA < m; OA++) {
      const yA = OA * l, EA = yA + l / 2, CA = Math.max(3, Math.round(u / 0.4));
      for (let iA = 0; iA < CA; iA++) k(y, "wood", O(_, 0.9 + (OA * 3 + iA * 7) % 5 * 0.035), l - 0.03, 0.05, u / CA - 0.02, EA, a - 0.025, -u / 2 + (iA + 0.5) * (u / CA));
      k(y, "metal", g.galv, 0.12, 0.012, u - 0.1, yA + (OA ? 0 : 0.06), a + 1e-3, 0);
      for (const iA of [-1, 1]) k(y, "wood", O(_, 0.75), l, 0.24, 0.07, EA, a - 0.14, iA * (u / 2 + 0.035)), k(y, "rubber", g.rubber, l - 0.1, 0.06, 0.05, EA, a - 0.2, iA * (u / 2 + 0.09)), k(y, "rubber", "#23262b", l - 0.3, 0.4, 0.5, EA, OM - 0.05, iA * (u / 2 - 0.3));
      if (o.cleats !== false && OA % 2 === 0) for (const iA of o.cleatSides || [-1, 1]) {
        const F = EA, J = iA * (u / 2 - 0.12);
        k(y, "metal", g.galv, 0.12, 0.07, 0.05, F, a + 0.035, J), k(y, "metal", g.galv, 0.3, 0.03, 0.05, F, a + 0.075, J);
      }
    }
  }
  function HM(y, Y, u, o = 3.2, B = 0.16) {
    y.cyl("metal", "#6f7479", B, o + 1, Y, OM + (o + 1) / 2 - 1, u, { seg: 10 }), y.lathe("gloss", g.white, [[0, 0], [B + 0.03, 0], [B + 0.03, 0.06], [0.03, 0.32], [0, 0.33]], Y, OM + o, u, { seg: 10 }), y.cyl("paint", "#2d3a2f", B + 4e-3, 0.5, Y, OM + 0.1, u, { seg: 10, open: true }), y.tor("metal", g.galv, B + 0.07, 0.025, Y, OM + 0.6, u, { rx: D, rs: 4, ts: 12 });
  }
  function PM(y, Y, u) {
    return x(["dodger", y, Y, u].join("|"), () => {
      const o = new f(), B = [], a = [[0, 0.22, 0.86], [0.25, 0.78, 0.96], [0.6, 1, 1], [1, 1, 1]];
      for (const [l, _, OA] of a) {
        const yA = [];
        for (let EA = 0; EA <= 10; EA++) {
          const CA = EA / 10 * N, iA = Math.cos(CA), F = Math.sin(CA);
          yA.push([iA * (y / 2) * OA, Math.pow(F, 0.55) * Y * _ + (1 - F) * 0, -l * u]);
        }
        B.push(yA);
      }
      h(o, B, (l, _) => [0, 0, B[l][_][2]], null);
      const H = o.geo(), m = [];
      for (let l = 0; l <= 10; l++) {
        const _ = l / 10 * N;
        m.push(T(Math.cos(_) * (y / 2 + 0.01), Math.pow(Math.sin(_), 0.55) * Y + 0.012, -u + 0.02));
      }
      return { canvas: H, frame: m };
    });
  }
  function uM(y, Y) {
    const u = Y.length ?? 10, o = u * 0.32, B = (fM) => fM[Math.floor(y.r(0, fM.length - 1e-3))], a = Y.color ?? B(["#f4f1ea", "#f4f1ea", "#f1eee6", "#2f3a57", "#e8e2d2", "#35574f", "#7a2f35"]), H = w(a).getHSL({}).l < 0.4, m = Y.accent ?? B([g.navy, g.teal, "#8a2f35", "#3b5f8a", "#b98f2f", "#4d6e8e"]), l = { L: u, B: o, T: 0.55, F0: 0.72 + u * 0.018, F1: 0.95 + u * 0.03, tr: 0.64, rake: u * 0.055, chine: 0, flare: 0.04, sternRake: -0.2, keelRise: 0.75, NS: 18, NP: 6 }, { h: _, body: OA, deckGeo: yA } = HA("sail" + u.toFixed(1), l), EA = (fM) => -u / 2 + fM * u;
    y.add("gloss", OA, a, 0, 0, 0, {}), y.add("paint", x("sailAF" + u.toFixed(1), () => _.band(-0.2, 0)), H ? "#1c2130" : "#2a3350", 0, 0, 0, {}), y.add("paint", x("sailBT" + u.toFixed(1), () => _.band(0, 0.07)), H ? g.white : m, 0, 0, 0, {}), y.add("paint", x("sailCV" + u.toFixed(1), () => _.band((fM) => _.top(fM) - 0.17, (fM) => _.top(fM) - 0.13)), H ? "#c9a24a" : m, 0, 0, 0, {}), y.add("paint", yA, "#e9e4d8", 0, 0, 0, {});
    for (const fM of [-1, 1]) {
      const zj = [];
      for (let cI = 1; cI < 10; cI++) {
        const kD = cI / 10, CI = _.at(kD * 0.985, 1, fM);
        zj.push(T(CI[0] * 0.985, CI[1] + 0.02, CI[2]));
      }
      y.tube("wood", g.teak, zj, 0.028, { radial: 4 });
    }
    const CA = 0.34, iA = 0.64, F = (EA(CA) + EA(iA)) / 2, J = EA(iA) - EA(CA), AA = _.hb(0.5) * 1.18, jA = _.top(0.5) + 0.2;
    y.box("gloss", "#f1eee6", AA, 0.42, J, 0, jA, F, { round: true, r: 0.14 });
    for (const fM of [-1, 1]) k(y, "gloss", g.glass, 0.01, 0.1, J * 0.28, fM * AA / 2, jA + 0.02, F + J * 0.18), k(y, "gloss", g.glass, 0.01, 0.1, J * 0.22, fM * AA / 2, jA + 0.02, F - J * 0.2);
    k(y, "gloss", g.glass, AA * 0.4, 0.01, 0.5, 0, jA + 0.212, F + J * 0.25);
    for (const fM of [-1, 1]) y.tube("wood", g.teak, [T(fM * AA * 0.34, jA + 0.21, F - J * 0.35), T(fM * AA * 0.34, jA + 0.27, F - J * 0.3), T(fM * AA * 0.34, jA + 0.27, F + J * 0.3), T(fM * AA * 0.34, jA + 0.21, F + J * 0.35)], 0.016, { radial: 4 });
    const gA = 0.07, LA = 0.33, kA = (EA(gA) + EA(LA)) / 2, SA = EA(LA) - EA(gA), hA = _.hb(0.2) * 1.2, sA = _.top(0.2);
    for (const fM of [-1, 1]) y.box("gloss", "#f1eee6", 0.08, 0.26, SA, fM * hA / 2, sA + 0.1, kA, { r: 0.03 });
    if (k(y, "wood", g.teakDk, hA - 0.1, 0.02, SA - 0.1, 0, sA + 1e-3, kA), u >= 9.5) {
      const fM = EA(0.12);
      v(y, "metal", g.galv, 0.05, 0.6, 0, sA + 0.3, fM, { seg: 8 }), y.tor("metal", g.galv, 0.34, 0.018, 0, sA + 0.72, fM - 0.06, { rx: -0.25, rs: 4, ts: 18 });
      for (let zj = 0; zj < 3; zj++) k(y, "metal", g.galv, 0.012, 0.66, 0.012, 0, sA + 0.72, fM - 0.06, { rx: -0.25, rz: zj * N / 3 });
    } else y.tube("wood", g.teak, [T(0, sA + 0.3, EA(0.02)), T(0, sA + 0.4, EA(0.18))], 0.03, { radial: 5 });
    const rA = PM(AA * 0.92, 0.62, 0.8), mA = jA + 0.2, JA = EA(CA) + 0.1;
    y.add("foliage", rA.canvas, m, 0, mA, JA, {}), y.tube("metal", g.galv, rA.frame.map((fM) => T(fM[0], fM[1] + mA, fM[2] + JA)), 0.014, { radial: 4 }), y.push(0, mA + 0.24, JA - 0.1, 0, -0.95), k(y, "gloss", g.glass, AA * 0.62, 0.3, 0.012, 0, 0, 4e-3), y.pop();
    for (const fM of [-1, 1]) y.push(fM * AA * 0.4, mA + 0.36, JA - 0.42, fM * 0.2), k(y, "gloss", g.glass, 0.012, 0.18, 0.34, 0, 0, 0), y.pop();
    const wM = 0.6, tA = EA(wM), WA = jA + 0.21, LM = u * 1.22 + 1, iM = _.hb(0.5) * 0.92, cM = _.hb(0.5) * 0.6;
    y.lathe("metal", "#d6dbe0", [[0, WA], [0.075, WA], [0.07, WA + LM * 0.55], [0.05, WA + LM], [0, WA + LM + 0.02]], 0, 0, tA, { seg: 8 });
    for (const [fM, zj] of [[0.4, iM], [0.72, cM]]) k(y, "metal", "#d6dbe0", 2 * zj, 0.035, 0.07, 0, WA + LM * fM, tA, { rz: 0 });
    v(y, "metal", g.black, 8e-3, 1, 0.06, WA + LM + 0.5, tA, { seg: 4 }), k(y, "metal", g.black, 0.02, 0.02, 0.4, 0, WA + LM + 0.1, tA - 0.1, { rx: 0.3 }), v(y, "metal", "#e8ecef", 0.09, 0.4, 0, WA + LM * 0.55, tA + 0.12, { seg: 6 }), y.blink("#fff6e0", 0, WA + LM + 0.06, tA, { size: 0.035, rate: 0.1, lo: 1.6, hi: 1.9 });
    const kM = _.at(0.995, 1, 1), oM = _.at(4e-3, 1, 1), jj = [0, WA + LM * 0.985, tA], pA = (fM, zj = 0.013) => y.tube("metal", "#8d949b", fM.map((cI) => T(...cI)), zj, { radial: 3 });
    pA([jj, [0, kM[1] + 0.08, kM[2] - 0.05]]), pA([jj, [0, oM[1] + 0.2, oM[2] + 0.05]]);
    for (const fM of [-1, 1]) {
      const zj = [fM * _.hb(wM) * 0.9, _.top(wM) + 0.03, tA - 0.05];
      pA([jj, [fM * cM, WA + LM * 0.72, tA], [fM * iM, WA + LM * 0.4, tA], zj]), pA([[0, WA + LM * 0.4, tA], [zj[0], zj[1], zj[2] + 0.35]]), pA([[0, WA + LM * 0.4, tA], [zj[0], zj[1], zj[2] - 0.45]]);
    }
    const yM = WA + 1.05, SM = tA - 0.1, JM = EA(0.1);
    y.tube("metal", "#d6dbe0", [T(0, yM, SM), T(0, yM + 0.08, JM)], 0.055, { radial: 6 });
    const Qj = 8, XA = [];
    for (let fM = 0; fM <= Qj; fM++) {
      const zj = fM / Qj;
      XA.push(T(0, 0.18 * (1 - zj * 0.55) + zj * 0.08, SM - 0.1 + (JM + 0.35 - SM) * zj));
    }
    y.tube("paint", m, XA, (fM) => 0.2 * (1 - fM * 0.45), { radial: 7, y: yM, sx: 0.8, sy: 1.25 }), k(y, "paint", O(m, 0.7), 0.02, 0.02, (SM - JM) * 0.9, 0, yM + 0.43, (SM + JM) / 2 + 0.2);
    for (const fM of [-1, 1]) pA([[0, WA + LM * 0.55, tA], [fM * 0.16, yM + 0.3, (SM + JM) / 2 + 0.3]], 6e-3);
    pA([[0, yM, JM + 0.35], [0, sA + 0.15, EA(0.03)]], 8e-3);
    const BM = [];
    for (let fM = 0; fM <= 10; fM++) {
      const zj = fM / 10;
      BM.push(T(0, kM[1] + 0.25 + (jj[1] - kM[1] - 0.25) * zj * 0.9, kM[2] - 0.05 + (tA - kM[2] + 0.05) * zj * 0.9));
    }
    y.tube("paint", m, BM, (fM) => 0.018 + 0.075 * Math.pow(Math.sin(N * Math.min(1, fM * 1.05)), 0.7) * (1 - fM * 0.6), { radial: 6 }), v(y, "metal", g.galv, 0.07, 0.12, 0, kM[1] + 0.16, kM[2] - 0.05, { seg: 8 });
    const sj = (fM, zj, cI) => {
      const kD = [];
      for (const ez of [-1, 1]) {
        const wP = _.at(fM, 1, ez);
        kD.push(T(wP[0] * 0.92, wP[1] + zj, wP[2]));
      }
      const CI = _.at(cI ? 0.998 : 0.02, 1, 1), nC = T(0, CI[1] + zj, CI[2] + (cI ? -0.12 : 0.1));
      y.tube("metal", g.galv, [kD[0], nC, kD[1]], 0.02, { radial: 5 });
      for (const ez of kD) y.tube("metal", g.galv, [ez, T(ez[0], ez[1] - zj + 0.02, ez[2])], 0.016, { radial: 4 });
      return kD;
    }, Mj = sj(0.9, 0.62, true), pj = sj(0.05, 0.66, false);
    for (const fM of [0, 1]) {
      const zj = fM ? 1 : -1, cI = [Mj[fM]];
      for (const kD of [0.72, 0.52, 0.32]) {
        const CI = _.at(kD, 1, zj), nC = T(CI[0] * 0.94, CI[1] + 0.62, CI[2]);
        y.tube("metal", g.galv, [T(CI[0] * 0.94, CI[1], CI[2]), nC], 0.014, { radial: 4 }), cI.push(nC);
      }
      cI.push(pj[fM]), y.tube("metal", "#c9ced3", cI, 7e-3, { radial: 3 });
    }
    const gj = Y.fenderSide ?? 1;
    for (const fM of [0.3, 0.62]) {
      const zj = _.at(fM, 1, gj);
      y.lathe("gloss", fM > 0.5 ? g.white : "#2f3a57", [[0, -0.28], [0.07, -0.26], [0.1, -0.18], [0.1, 0.18], [0.07, 0.26], [0, 0.28]], zj[0] * 1.02 + gj * 0.1, zj[1] - 0.55, zj[2], { seg: 8 }), y.tube("rubber", g.white, [T(zj[0] * 0.96, zj[1] + 0.3, zj[2]), T(zj[0] * 1.02 + gj * 0.1, zj[1] - 0.26, zj[2])], 7e-3, { radial: 3 });
    }
    const _N = [0, oM[1] + 0.2 + (jj[1] - oM[1]) * 0.12, oM[2] + 0.05 + (jj[2] - oM[2]) * 0.12];
    if (y.flag(_N[0], _N[1], _N[2], { color: Y.flag ?? B(["#2f3a57", "#c8473d", "#3f9f97", "#f2eee6"]), s: 1.3, ry: D }), Y.name) {
      const fM = _.at(4e-3, 0.55, 1);
      xA(y, Y.name, 0.13, H ? g.white : g.navy, 0, fM[1] + 0.02, fM[2] - 0.03, { ry: N, weight: 0.18, depth: 4e-3 });
    }
  }
  function RM(y, Y) {
    const u = Y.length ?? 12, o = u * 0.34, B = (tA) => tA[Math.floor(y.r(0, tA.length - 1e-3))], a = Y.color ?? B(["#f4f1ea", "#f4f1ea", "#1f2a40", "#e9e4d6"]), H = w(a).getHSL({}).l < 0.4, m = Y.accent ?? B(["#2f3a57", "#3f9f97", "#6b7280", "#3b5f8a"]), l = { L: u, B: o, T: 0.6, F0: 1.05 + u * 0.02, F1: 1.45 + u * 0.03, tr: 0.92, rake: u * 0.05, chine: 0.75, flare: 0.12, sternRake: 0.05, keelRise: 0.55, NS: 18, NP: 6 }, { h: _, body: OA, deckGeo: yA } = HA("motor" + u.toFixed(1), l), EA = (tA) => -u / 2 + tA * u;
    y.add("gloss", OA, a, 0, 0, 0, {}), y.add("paint", x("myAF" + u.toFixed(1), () => _.band(-0.2, 0)), "#26314a", 0, 0, 0, {}), y.add("paint", x("myBT" + u.toFixed(1), () => _.band(0, 0.1)), H ? g.white : m, 0, 0, 0, {}), y.add("paint", x("myHW" + u.toFixed(1), () => _.band((tA) => _.top(tA) - 0.62, (tA) => _.top(tA) - 0.5)), g.glass, 0, 0, 0, {}), y.add("paint", yA, "#ece8de", 0, 0, 0, {});
    {
      const tA = [];
      for (let WA = 1; WA < 16; WA++) {
        const LM = WA / 16, iM = _.at(LM, 1, 1);
        tA.push(T(iM[0] * 1.01, iM[1] - 0.04, iM[2]));
      }
      y.tube("metal", g.galv, tA, 0.03, { radial: 4 }), y.tube("metal", g.galv, tA.map((WA) => T(-WA[0], WA[1], WA[2])), 0.03, { radial: 4 });
    }
    const CA = _.at(3e-3, 1, 1);
    k(y, "wood", g.teak, _.hb(0) * 2 - 0.1, 0.06, 0.9, 0, 0.32, CA[2] - 0.45);
    for (const tA of [-1, 1]) v(y, "metal", g.galv, 0.015, 0.5, tA * 0.2, 0.1, CA[2] - 0.86, { seg: 5 });
    const iA = 0.14, F = 0.64, J = (EA(iA) + EA(F)) / 2, AA = EA(F) - EA(iA), jA = _.hb(0.4) * 1.56, gA = _.top(0.4) + 0.42;
    y.box("gloss", a === "#1f2a40" ? "#f1eee6" : "#f4f1ea", jA, 0.84, AA, 0, gA, J, { round: true, r: 0.18 }), k(y, "gloss", g.glass, jA + 0.012, 0.3, AA * 0.8, 0, gA + 0.08, J - AA * 0.05), y.push(0, gA + 0.1, EA(F) - 0.04, 0, 0.62), k(y, "gloss", g.glass, jA * 0.84, 0.42, 0.02, 0, 0, 0), y.pop();
    const LA = gA + 0.42, kA = 0.2, SA = 0.5, hA = (EA(kA) + EA(SA)) / 2, sA = EA(SA) - EA(kA);
    y.box("gloss", "#f1eee6", jA * 0.84, 0.3, sA, 0, LA + 0.15, hA, { round: true, r: 0.12 }), k(y, "gloss", g.glass, jA * 0.7, 0.2, 0.02, 0, LA + 0.46, EA(SA) - 0.1, { rx: -0.4 });
    for (const tA of [-1, 1]) y.box("gloss", "#e8e2d2", 0.44, 0.14, 0.42, tA * 0.32, LA + 0.37, hA, { round: true, r: 0.05 }), y.box("gloss", "#e8e2d2", 0.44, 0.36, 0.1, tA * 0.32, LA + 0.52, hA - 0.2, { round: true, r: 0.04 });
    const rA = x("bimini" + (jA * 0.9).toFixed(2), () => {
      const tA = new f(), WA = [];
      for (let LM = 0; LM <= 3; LM++) {
        const iM = (LM / 3 - 0.5) * sA * 0.95, cM = [];
        for (let kM = 0; kM <= 8; kM++) {
          const oM = N * (kM / 8);
          cM.push([Math.cos(oM) * jA * 0.45, Math.sin(oM) * 0.25, iM]);
        }
        WA.push(cM);
      }
      return h(tA, WA, () => [0, -1, 0], null), tA.geo();
    });
    y.add("foliage", rA, m, 0, LA + 1.2, hA, {});
    for (const tA of [-1, 1]) for (const WA of [-0.45, 0.45]) y.tube("metal", g.galv, [T(tA * jA * 0.44, LA + 0.36, hA + WA * sA), T(tA * jA * 0.45, LA + 1.2, hA + WA * sA)], 0.014, { radial: 4 });
    y.tube("metal", g.white, [T(-jA * 0.45, LA + 0.36, EA(0.2)), T(-jA * 0.38, LA + 1.5, EA(0.19)), T(jA * 0.38, LA + 1.5, EA(0.19)), T(jA * 0.45, LA + 0.36, EA(0.2))], 0.05, { radial: 6 }), y.box("gloss", g.white, 0.7, 0.14, 0.3, 0, LA + 1.62, EA(0.19), { round: true, r: 0.06 }), y.sph("gloss", g.white, 0.14, 0.4, LA + 1.65, EA(0.19), { ws: 8, hs: 5, half: true }), v(y, "metal", g.black, 8e-3, 1.2, -0.3, LA + 2.1, EA(0.19), { seg: 4 });
    const mA = [];
    for (let tA = 0; tA <= 8; tA++) {
      const WA = 0.62 + 0.36 * (tA / 8), LM = _.at(WA, 1, -1);
      mA.push(T(LM[0] * 0.9, LM[1] + 0.55, LM[2]));
    }
    for (let tA = 8; tA >= 0; tA--) {
      const WA = 0.62 + 0.36 * (tA / 8), LM = _.at(WA, 1, 1);
      mA.push(T(LM[0] * 0.9, LM[1] + 0.55, LM[2]));
    }
    y.tube("metal", g.galv, mA, 0.022, { radial: 5 });
    for (const tA of [0.66, 0.8, 0.92]) for (const WA of [-1, 1]) {
      const LM = _.at(tA, 1, WA);
      y.tube("metal", g.galv, [T(LM[0] * 0.9, LM[1], LM[2]), T(LM[0] * 0.9, LM[1] + 0.55, LM[2])], 0.016, { radial: 4 });
    }
    const JA = _.at(0.998, 1, 1);
    if (y.box("metal", g.galv, 0.14, 0.12, 0.5, 0, JA[1] + 0.05, JA[2] - 0.1, { r: 0.03 }), y.push(0, JA[1] - 0.05, JA[2] + 0.12, 0, 0.3), y.add("metal", x("anchorS", () => C(WM, 0.08, 0.02)), g.steel, 0, 0, 0, { ry: -D, s: 0.45 }), y.pop(), Y.name) {
      const tA = _.at(3e-3, 0.5, 1);
      xA(y, Y.name, 0.15, H ? g.white : g.navy, 0, tA[1] + 0.05, tA[2] - 0.03, { ry: N, weight: 0.18, depth: 4e-3 });
    }
    const wM = Y.fenderSide ?? 1;
    for (const tA of [0.3, 0.55]) {
      const WA = _.at(tA, 1, wM);
      y.lathe("gloss", g.white, [[0, -0.3], [0.08, -0.28], [0.11, -0.2], [0.11, 0.2], [0.08, 0.28], [0, 0.3]], WA[0] + wM * 0.12, WA[1] - 0.7, WA[2], { seg: 8 });
    }
    y.flag(0, CA[1] + 0.9, CA[2] + 0.15, { color: Y.flag ?? "#2f3a57", s: 1.3, ry: D }), v(y, "metal", g.teak, 0.012, 0.9, 0, CA[1] + 0.5, CA[2] + 0.15, { seg: 4 });
  }
  function hM(y, Y) {
    const u = Y.length ?? 10, o = u * 0.36, B = (SA) => SA[Math.floor(y.r(0, SA.length - 1e-3))], a = Y.color ?? B(["#2f5a52", "#8a2f35", "#2f3a57", "#3b5f8a"]), H = Y.accent ?? B(["#e2b64c", g.white]), m = { L: u, B: o, T: 0.9, F0: 0.95, F1: 1.7, tr: 0.62, rake: 0.35, chine: 0.15, flare: 0.1, sternRake: -0.1, keelRise: 0.45, NS: 18, NP: 6 }, { h: l, body: _, deckGeo: OA } = HA("fish" + u.toFixed(1), m), yA = (SA) => -u / 2 + SA * u;
    y.add("gloss", _, a, 0, 0, 0, {}), y.add("paint", x("fbAF" + u.toFixed(1), () => l.band(-0.2, 0)), "#7a2b24", 0, 0, 0, {}), y.add("paint", x("fbBT" + u.toFixed(1), () => l.band(0, 0.08)), g.white, 0, 0, 0, {}), y.add("paint", x("fbSH" + u.toFixed(1), () => l.band((SA) => l.top(SA) - 0.24, (SA) => l.top(SA) - 0.02)), H, 0, 0, 0, {}), y.add("paint", OA, "#9aa0a0", 0, 0, 0, {});
    for (const SA of [-1, 1]) {
      const hA = [];
      for (let sA = 1; sA < 16; sA++) {
        const rA = sA / 16, mA = l.at(rA, 1, SA);
        hA.push(T(mA[0] * 0.99, mA[1] + 0.05, mA[2]));
      }
      y.tube("wood", g.teakDk, hA, 0.04, { radial: 4 });
      for (const sA of [0.25, 0.45, 0.65]) {
        const rA = l.at(sA, 0.8, SA);
        vA(y, rA[0] + SA * 0.09, rA[1], rA[2], "x", 0.8);
      }
    }
    const EA = 0.52, CA = 0.76, iA = (yA(EA) + yA(CA)) / 2, F = yA(CA) - yA(EA), J = l.hb(0.64) * 1.3, AA = l.top(0.64) + 0.85;
    y.box("gloss", "#f1eee6", J, 1.7, F, 0, AA, iA, { round: true, r: 0.1 }), y.box("gloss", a, J + 0.1, 0.1, F + 0.1, 0, AA + 0.88, iA, { r: 0.04 }), k(y, "gloss", g.glass, J + 0.012, 0.42, F * 0.7, 0, AA + 0.45, iA), y.push(0, AA + 0.45, yA(CA) + 5e-3, 0, 0.12), k(y, "gloss", g.glass, J * 0.84, 0.46, 0.02, 0, 0, 0), y.pop();
    const jA = AA + 0.93, gA = iA - 0.2;
    y.lathe("gloss", g.white, [[0, jA], [0.07, jA], [0.045, jA + 3.2], [0, jA + 3.22]], 0, 0, gA, { seg: 8 }), k(y, "gloss", g.white, 1.2, 0.06, 0.06, 0, jA + 2.4, gA), y.blink("#fff6e0", 0, jA + 3.1, gA + 0.06, { size: 0.04, rate: 0.12, lo: 1.8, hi: 2.1 }), y.box("gloss", g.white, 0.5, 0.1, 0.18, 0, jA + 1.2, gA + 0.25, { round: true, r: 0.04 });
    for (const SA of [-1, 1]) y.tube("metal", "#8d949b", [T(SA * 0.25, jA + 0.2, gA), T(SA * (o * 0.55 + 2.2), jA + 3.6, gA - 0.4)], 0.035, { radial: 5 }), y.tube("metal", "#8d949b", [T(0, jA + 3, gA), T(SA * (o * 0.55 + 2.2), jA + 3.6, gA - 0.4)], 8e-3, { radial: 3 });
    const LA = yA(0.04), kA = l.top(0.05);
    for (const SA of [-1, 1]) y.tube("metal", g.mustardDk, [T(SA * l.hb(0.05) * 0.85, kA, LA + 0.15), T(SA * 0.35, kA + 2.1, LA - 0.15)], 0.06, { radial: 6 });
    y.tube("metal", g.mustardDk, [T(-0.4, kA + 2.1, LA - 0.15), T(0.4, kA + 2.1, LA - 0.15)], 0.07, { radial: 6 }), y.cyl("gloss", g.mustardDk, 0.45, 1.3, 0, kA + 0.6, yA(0.2), { rz: D, seg: 14 }), y.cyl("paint", "#3f6f5a", 0.4, 1.2, 0, kA + 0.6, yA(0.2), { rz: D, seg: 14 });
    for (let SA = 0; SA < 4; SA++) k(y, "gloss", SA % 2 ? "#3f9f97" : "#e2b64c", 0.62, 0.26, 0.4, (SA % 2 ? -1 : 1) * 0.45, kA + 0.13 + Math.floor(SA / 2) * 0.26, yA(0.33));
    for (let SA = 0; SA < 3; SA++) y.sph("gloss", "#e9703a", 0.2, -0.55 + SA * 0.5, kA + 0.2, yA(0.4) + 0.1 * SA, { ws: 10, hs: 7 });
    if (Y.name) {
      const SA = l.at(4e-3, 0.55, 1);
      xA(y, Y.name, 0.16, g.white, 0, SA[1] + 0.02, SA[2] - 0.03, { ry: N, weight: 0.18, depth: 4e-3 });
    }
    y.flag(0, jA + 3.3, gA, { color: Y.flag ?? g.teal, s: 1.2, ry: D });
  }
  function UM(y, Y) {
    const u = Y.length ?? 5, o = (iA) => iA[Math.floor(y.r(0, iA.length - 1e-3))], B = Y.color ?? o(["#5d6470", "#2f3a57", "#e9703a", "#6b7280"]), a = u * 0.07, H = u * 0.19, m = { L: u * 0.92, B: H * 2, T: 0.28, F0: 0.28, F1: 0.36, tr: 0.85, rake: 0.08, chine: 1, flare: 0, keelRise: 0.6, NS: 14, NP: 4 }, { h: l, body: _ } = HA("rib" + u.toFixed(1), m);
    y.add("gloss", _, "#e9e5dc", 0, 0, 0, {});
    const OA = -u * 0.46, yA = u * 0.22, EA = 0.3, CA = [];
    CA.push(T(-H, EA, OA));
    for (let iA = 1; iA < 4; iA++) CA.push(T(-H, EA + iA * 0.01, OA + (yA - OA) * (iA / 4)));
    for (let iA = 0; iA <= 10; iA++) {
      const F = N + iA / 10 * N;
      CA.push(T(Math.cos(F) * H, EA + 0.05 + 0.08 * Math.sin(iA / 10 * N), yA - Math.sin(F) * (u * 0.24)));
    }
    for (let iA = 3; iA >= 1; iA--) CA.push(T(H, EA + iA * 0.01, OA + (yA - OA) * (iA / 4)));
    CA.push(T(H, EA, OA)), y.tube("gloss", B, CA, a, { radial: 10 });
    for (const iA of [-1, 1]) y.lathe("gloss", B, [[0, -0.3], [a * 0.55, -0.26], [a * 0.9, -0.14], [a, 0]], iA * H, EA, OA, { rx: D, seg: 10 });
    if (y.tube("rubber", g.rope, CA.map((iA) => T(iA[0] * (1 + a * 0.4 / H), iA[1] + a * 0.55, iA[2])), 0.01, { radial: 3 }), Y.console !== false) y.box("gloss", "#e9e5dc", 0.6, 0.72, 0.5, 0, EA + 0.28, 0.1, { round: true, r: 0.08 }), k(y, "gloss", g.glass, 0.56, 0.3, 0.02, 0, EA + 0.78, 0.36, { rx: -0.4 }), y.tor("rubber", g.black, 0.13, 0.016, 0, EA + 0.72, -0.12, { rx: -0.6, rs: 3, ts: 12 }), y.box("gloss", g.black, 0.62, 0.35, 0.5, 0, EA + 0.18, -0.55, { round: true, r: 0.1 });
    else {
      y.box("wood", g.teak, H * 2 - 0.1, 0.05, 0.3, 0, EA + 0.02, -0.2, { r: 0.015 }), y.box("gloss", "#c8473d", 0.36, 0.22, 0.26, 0.2, EA - 0.12, -1, { round: true, r: 0.05 }), y.tube("rubber", g.black, [T(0.2, EA, -1), T(0.1, EA - 0.05, -1.4), T(0, EA, OA + 0.1)], 0.012, { radial: 4 });
      for (const iA of [-1, 1]) y.tube("wood", g.teak, [T(iA * 0.25, EA - 0.08, -0.6), T(iA * 0.32, EA - 0.05, 0.9)], 0.022, { radial: 4 });
      k(y, "wood", g.teak, 0.1, 0.02, 0.45, 0.32, EA - 0.05, 1.05), k(y, "wood", g.teak, 0.1, 0.02, 0.45, -0.25, EA - 0.08, -0.85);
    }
    y.push(0, EA - 0.05, OA - 0.02), EM(y, "#2b2e34", Y.tilt ?? 0, Y.motorScale ?? 1.1), y.pop();
  }
  const KM = [[0.33, -0.05], [0.315, -0.088], [0.28, -0.103], [0.2, -0.1], [0.17, -0.06], [0.17, 0.06], [0.2, 0.1], [0.28, 0.103], [0.315, 0.088], [0.33, 0.05]];
  function vA(y, Y, u, o, B, a = 0.9, H = "#202227") {
    y.lathe("rubber", H, KM, Y, u, o, { seg: 12, closed: true, s: a, ...B === "x" ? { rz: D } : { rx: D } });
  }
  function i(y, Y, u, o = 0.014, B = g.rope) {
    y.tube(t(y, "rubber"), B, [T(...Y), T((Y[0] + u[0]) / 2, (Y[1] + u[1]) / 2 - 0.02, (Y[2] + u[2]) / 2 + 0.01), T(...u)], o, { radial: 4 });
  }
  function $(y, Y, u, o) {
    const B = [Y, 0.5, o], a = [Y, u, 0.05];
    for (let H = 0; H < 3; H++) {
      const m = H * I / 3 + 0.5;
      y.tube("metal", "#5f7d84", [T(B[0], B[1], B[2]), T(Y + Math.cos(m) * 0.36, 0.03, o + Math.sin(m) * 0.36)], 0.022, { radial: 6 }), k(y, "metal", g.steelDk, 0.09, 0.02, 0.09, Y + Math.cos(m) * 0.36, 0.01, o + Math.sin(m) * 0.36, { ry: m });
    }
    v(y, "metal", "#5f7d84", 0.05, 0.18, B[0], B[1], B[2], { seg: 8 }), y.tube("metal", g.galv, [T(...B), T(a[0], a[1] - 0.05, a[2] + 0.12)], 0.022, { radial: 6 }), v(y, "metal", g.galv, 0.012, 0.3, B[0], B[1] + 0.12, B[2], { rz: D }), y.box("rubber", g.rubber, 0.22, 0.3, 0.05, a[0], a[1], a[2], { r: 0.015 }), y.box("metal", "#5f7d84", 0.14, 0.18, 0.06, a[0], a[1] - 0.02, a[2] + 0.05, { r: 0.015 });
  }
  function n(y, Y, u, o) {
    k(y, "wood", O(g.teakDk, 0.9), 0.95, 0.16, 0.22, Y, 0.08, o - 0.14);
    for (let B = 0; B < u; B++) {
      const a = 0.25 + B * 0.18, H = O(B % 2 ? g.teak : g.teakDk, 0.88 + 0.08 * (B % 2));
      for (const m of [-0.26, 0.26]) k(y, "wood", H, 0.2, 0.17, o + 0.35, Y + m + (B % 2 ? 0.05 : 0), a, (o - 0.35) / 2);
    }
    k(y, "wood", O(g.teak, 0.8), 0.28, 0.1, 0.22, Y, 0.16 + u * 0.18 + 0.1, 0.1, { rx: 0.3 });
  }
  function d(y, Y, u, o = 0.13, B = "#b58a4a") {
    p(y, () => {
      y.tor("metal", B, o, 0.028, Y, u, 0.02, { rs: 4, ts: 12 }), y.cyl("gloss", g.glass, o * 0.95, 0.01, Y, u, 0.012, { rx: D, seg: 12 }), k(y, "gloss", g.glassLt, o * 0.9, o * 0.3, 4e-3, Y - o * 0.1, u + o * 0.35, 0.02, { rz: 0.5 });
      for (let a = 0; a < 3; a++) {
        const H = -D + a * (I / 3);
        k(y, "metal", B, 0.04, 0.05, 0.03, Y + Math.cos(H) * (o + 0.05), u + Math.sin(H) * (o + 0.05), 0.02, { rz: H });
      }
    });
  }
  function b(y, Y, u, o, B) {
    return x("funnel|" + B, () => {
      const a = new f(), H = "#23262c", m = [[0, g.mustard], [o * 0.62, g.mustard], [o * 0.62, g.white], [o * 0.66, g.white], [o * 0.66, g.teal], [o * 0.74, g.teal], [o * 0.74, H], [o - 0.04, H], [o, H]], l = Z(y, Y, u, 4), _ = (iA, F) => (1 - 0.06 * iA / o) * (F === m.length - 1 ? 1.04 : 1);
      h(a, m.map(([iA], F) => l.map(([J, AA]) => [J * _(iA, F), iA, AA * _(iA, F)])), (iA) => [0, m[iA][0], 0], (iA, F, J, AA) => w(m[AA][1]), true);
      const OA = (1 - 0.06) * 0.9, yA = l.map(([iA, F]) => [iA * 0.94 * 1.04, o, F * 0.94 * 1.04]), EA = l.map(([iA, F]) => [iA * OA, o, F * OA]), CA = l.map(([iA, F]) => [iA * OA, o - 0.05, F * OA]);
      return h(a, [yA, EA], () => [0, o - 1, 0], () => w(H), true), h(a, [EA, CA], () => [0, o + 1, 0], () => w("#17181c"), true), X(a, CA, [0, 1, 0], w("#17181c")), a.geo();
    });
  }
  j.tug_dress = { desc: "Harbour tug NUDGE up on blocks (dresses the tug-hull/tug-house blocks, placed at the hull centre): raked stem with bow fender + tyre stack, gunwale fender, tyre fenders all round on chains, rubbing strake, portholes, boot-top + load line, low deck rail open at the ramp (rail colliders), H-bitt + towing winch (colliders), towing hook, windowed deckhouse with doors + sidelights, Kraken stack (collider), mast with towing lights, radar, horn, searchlight, antennas + flag; boat stands, timber cribbing and a ladder in the yard.", params: { access: "Zone Control build: open the bow rail for the boarding stair (local x 0.35…2.65) and the west rail for the crate steps (local z 1.55…5.25, to the stern corner)" }, variants: 1, mount: "ground", build(y, Y = {}) {
    y.aoBase = 0;
    const u = 3, o = 5.5, B = 2.6, a = g.buff, H = g.tugDk, m = !!Y.access, l = [0.35, 2.65], _ = [1.55, 5.25], OA = (pA) => m && pA > l[0] - 0.05 && pA < l[1] + 0.1, yA = (pA, yM = 0) => m && pA > _[0] - yM && pA < _[1] + yM, EA = 2.44, CA = [], iA = [], F = 0.12, J = 0.2, AA = (pA, yM, SM = F) => {
      CA.push(T(pA, EA, yM)), iA.push(SM);
    }, jA = (pA, yM, SM, JM, Qj = 4) => {
      for (let XA = 0; XA <= Qj; XA++) {
        const BM = SM + (JM - SM) * (XA / Qj);
        AA(pA + Math.cos(BM) * J, yM + Math.sin(BM) * J);
      }
    };
    AA(1.28, o), jA(u - J, o - J, D, 0);
    for (let pA = 1; pA < 10; pA++) AA(u, o - J - pA / 10 * (2 * o - 2 * J));
    jA(u - J, -o + J, 0, -D);
    for (let pA = 1; pA < 16; pA++) {
      const yM = pA / 16, SM = Math.sin(N * yM);
      AA((u - J) * (1 - 2 * yM), -o - 0.3 * SM, F + 0.1 * SM);
    }
    jA(-u + J, -o + J, -D, -N);
    for (let pA = 1; pA < 10; pA++) AA(-u, -o + J + pA / 10 * (2 * o - 2 * J));
    if (jA(-u + J, o - J, N, D), AA(-1.28, o), !m) y.tube("rubber", g.rubber, CA, (pA) => iA[Math.round(pA * (iA.length - 1))], { radial: 8 });
    else {
      let pA = [], yM = [];
      const SM = () => {
        if (pA.length > 1) {
          const JM = yM.slice();
          y.tube("rubber", g.rubber, pA, (Qj) => JM[Math.round(Qj * (JM.length - 1))], { radial: 8 });
          for (const Qj of [0, pA.length - 1]) y.sph("rubber", g.rubber, JM[Qj], pA[Qj][0], pA[Qj][1], pA[Qj][2], { ws: 8, hs: 6 });
        }
        pA = [], yM = [];
      };
      CA.forEach((JM, Qj) => {
        if (JM[2] < -o + 0.05 && OA(JM[0])) {
          SM();
          return;
        }
        pA.push(JM), yM.push(iA[Qj]);
      }), SM();
    }
    const gA = [];
    for (let pA = 0; pA <= 8; pA++) {
      const yM = pA / 8, SM = 0.42 + yM * 1.8;
      gA.push(T(0, SM, -o - 0.09 - 0.21 * Math.pow(yM, 1.6)));
    }
    y.add("gloss", TA(Z(0.17, 0.08, 0.05), gA, [0, 0, -1]), H, 0, 0, 0, {});
    for (const pA of [-1, 1]) y.box("gloss", H, 0.05, 1.5, 0.2, pA * 0.19, 1.35, -o - 0.1, { rx: -0.1, r: 0.02 });
    for (const [pA, yM] of [[0.82, -5.77], [1.38, -5.83], [1.92, -5.91]]) vA(y, 0, pA, yM, "z", 0.9);
    for (const pA of [-1, 1]) y.box("rubber", g.rubber, 0.34, 1.7, 0.34, pA * u, 1.45, -o, { round: true, r: 0.12 });
    i(y, [0, 2.26, -5.84], [0, 2.14, -5.93], 0.016);
    for (const pA of [-1, 1]) y.cyl("gloss", H, 0.05, 2 * o - 0.3, pA * u, 1.25, 0, { rx: D, seg: 10 }), y.box(t(y, "paint"), g.white, 0.014, 0.06, 2 * o + 0.02, pA * (u + 7e-3), 0.69, 0, { r: 4e-3 });
    y.box(t(y, "paint"), g.white, 2 * u + 0.02, 0.06, 0.014, 0, 0.69, -o - 7e-3, { r: 4e-3 });
    for (const pA of [-1, 1]) y.box(t(y, "paint"), g.white, u - 1.18, 0.06, 0.014, pA * (u + 1.18) / 2, 0.69, o + 7e-3, { r: 4e-3 });
    for (const pA of [-1, 1]) {
      y.push(pA * u, 0, 0, pA * D), xA(y, "NUDGE", 0.32, g.white, pA * 3.9, 0.8, 2e-3, { weight: 0.17 }), y.tor(t(y, "paint"), g.white, 0.16, 0.018, -pA * 1.3, 1.02, 0.01, { rs: 4, ts: 24 }), y.box(t(y, "paint"), g.white, 0.5, 0.035, 0.012, -pA * 1.3, 1.02, 0.01, { r: 4e-3 }), y.box(t(y, "paint"), g.white, 0.4, 0.03, 0.012, -pA * 1.3, 1.25, 0.01, { r: 4e-3 });
      for (const yM of [-2.2, -1, 0.2]) d(y, -pA * yM, 1.72);
      for (let yM = 0; yM < 8; yM++) {
        const SM = -4 + yM * 1.2;
        pA < 0 && yA(SM, 0.4) || (vA(y, -pA * SM, 1.72, 0.09, "z", 0.9), i(y, [-pA * SM - 0.1, 2.31, 0.06], [-pA * SM - 0.04, 1.97, 0.1]), i(y, [-pA * SM + 0.1, 2.31, 0.06], [-pA * SM + 0.04, 1.97, 0.1]));
      }
      for (let yM = 0; yM < 8; yM += 2) pA < 0 && yA(-4 + yM * 1.2, 0.4) || AM(y, -pA * (-4 + yM * 1.2), 1.42, 4e-3, 0.36, 0.3, O(g.tug, 0.78), g.tug);
      AM(y, pA * 3.4, 0.62, 5e-3, 0.9, 0.5, z(g.tug, "#b9b3a6", 0.42), g.tug), AM(y, pA * 2.55, 0.5, 6e-3, 0.55, 0.36, z(g.tug, "#b9b3a6", 0.32), g.tug), y.pop();
    }
    for (const pA of [1.75, 2.55]) vA(y, -pA, 1.72, o + 0.09, "z", 0.9);
    xA(y, "NUDGE", 0.2, g.white, -2.15, 1, o + 2e-3, { weight: 0.18 }), xA(y, "INKWAVE", 0.1, g.white, -2.15, 0.82, o + 2e-3, { weight: 0.2, spacing: 0.4 });
    const LA = B + 0.36, kA = 0.1, SA = m ? [[[1.3, o - kA], [u - kA, o - kA], [u - kA, -o + kA], [l[1], -o + kA]], [[l[0], -o + kA], [-u + kA, -o + kA], [-u + kA, _[0]]], [[-u + kA, _[1]], [-u + kA, o - kA], [-1.3, o - kA]]] : [[[1.3, o - kA], [u - kA, o - kA], [u - kA, -o + kA], [-u + kA, -o + kA], [-u + kA, o - kA], [-1.3, o - kA]]];
    for (const pA of SA) {
      const yM = [];
      for (let JM = 0; JM < pA.length - 1; JM++) {
        const [Qj, XA] = pA[JM], [BM, sj] = pA[JM + 1], Mj = Math.hypot(BM - Qj, sj - XA), pj = Math.max(1, Math.round(Mj / 1.15));
        for (let gj = 0; gj < pj; gj++) {
          const _N = gj / pj, fM = Qj + (BM - Qj) * _N, zj = XA + (sj - XA) * _N;
          q(y, "metal", a, 0.02, 0.36, fM, B + 0.18, zj, { seg: 7 });
        }
        yM.push(T(Qj, LA, XA));
      }
      const SM = pA[pA.length - 1];
      yM.push(T(SM[0], LA, SM[1])), y.cyl("metal", a, 0.02, 0.36, SM[0], B + 0.18, SM[1], { seg: 8 }), y.tube("metal", a, yM, 0.024, { radial: 8 }), y.tube("metal", a, yM.map((JM) => T(JM[0], B + 0.19, JM[2])), 0.012, { radial: 6 });
      for (const JM of [yM[0], yM[yM.length - 1]]) y.sph("metal", a, 0.032, JM[0], LA, JM[2], { ws: 8, hs: 6 });
    }
    const hA = B + 0.62, sA = B + 1.1, rA = 0.3, mA = 5e-3;
    y.col(u + mA, hA, -o - rA, u + rA, sA, o + rA, { rail: true }), m ? (y.col(-u - rA, hA, -o - rA, -u - mA, sA, _[0], { rail: true }), y.col(-u - rA, hA, _[1], -u - mA, sA, o + rA, { rail: true }), y.col(-u - rA, hA, -o - rA, l[0], sA, -o - mA, { rail: true }), y.col(l[1], hA, -o - rA, u + rA, sA, -o - mA, { rail: true })) : (y.col(-u - rA, hA, -o - rA, -u - mA, sA, o + rA, { rail: true }), y.col(-u - rA, hA, -o - rA, u + rA, sA, -o - mA, { rail: true }));
    for (const pA of [-1, 1]) y.col(pA > 0 ? 1.26 : -u - rA, hA, o + mA, pA > 0 ? u + rA : -1.26, sA, o + rA, { rail: true });
    y.box("metal", g.steelDk, 1.16, 0.05, 0.4, 0, B + 0.025, -3.7, { r: 0.02 });
    for (const pA of [-1, 1]) y.lathe("gloss", g.black, [[0, 0], [0.12, 0], [0.12, 0.54], [0.16, 0.57], [0.16, 0.62], [0.1, 0.64], [0, 0.64]], pA * 0.4, B + 0.04, -3.7, { seg: 14 }), y.cyl("gloss", g.black, 0.045, 0.2, pA * 0.53, B + 0.46, -3.7, { rz: D, seg: 8 });
    y.cyl("gloss", g.black, 0.07, 0.8, 0, B + 0.44, -3.7, { rz: D, seg: 12 }), y.col(-0.58, B, -3.9, 0.58, B + 0.68, -3.5);
    const JA = 1.47, wM = B + 0.47;
    for (const pA of [-1, 1]) y.box("gloss", a, 0.08, 0.72, 0.7, pA * 0.72, B + 0.36, JA, { r: 0.03 }), y.cyl("gloss", a, 0.42, 0.05, pA * 0.6, wM, JA, { rz: D, seg: 24 });
    y.cyl("gloss", g.steelDk, 0.26, 1.16, 0, wM, JA, { rz: D, seg: 18 }), y.cyl("rubber", g.rope, 0.35, 1.08, 0, wM, JA, { rz: D, seg: 20 });
    for (let pA = 0; pA < 6; pA++) y.tor("rubber", O(g.rope, 0.86 + pA % 2 * 0.1), 0.35, 0.03, -0.46 + pA * 0.184, wM, JA, { ry: D, rs: 3, ts: 16 });
    y.box("gloss", O(a, 0.85), 0.34, 0.4, 0.5, -0.48, B + 0.2, JA + 0.02, { round: true, r: 0.04 }), y.box("metal", g.steelDk, 1.5, 0.05, 0.7, 0, B + 0.025, JA, { r: 0.015 }), y.tube("rubber", g.rope, [T(0.3, wM + 0.3, JA + 0.05), T(0.33, wM + 0.34, JA + 0.2), T(0.36, wM + 0.1, JA + 0.36), T(0.37, wM - 0.12, JA + 0.37)], 0.045, { radial: 7 }), y.tor("rubber", g.ropeDk, 0.08, 0.035, 0.37, wM - 0.2, JA + 0.37, { ry: D, rs: 6, ts: 12 }), y.col(-0.8, B, 1.1, 0.8, B + 0.9, 1.84);
    const tA = 2.6, WA = 4.3, LM = 1.7, iM = -1.9, cM = 1.1;
    y.push(0, tA, iM, N), zM(y, -1.45, 1.45, 0.72, 1.34, 4, { frame: g.white }), y.box("gloss", g.white, 2 * LM + 0.2, 0.05, 0.1, 0, WA - tA - 0.03, 0.05, { r: 0.02 });
    for (const [pA, yM] of [[-1.5, g.green], [1.5, g.red]]) y.box("paint", g.black, 0.22, 0.18, 0.16, pA, 1.47, 0.08, { r: 0.02 }), y.cyl("glow", yM, 0.045, 0.05, pA, 1.47, 0.16, { rx: D, seg: 10, glow: 1.4 }), y.blink(yM, pA, 1.47, 0.19, { size: 0.04, rate: 0.15, lo: 2.2, hi: 2.6 });
    y.pop();
    for (const pA of [-1, 1]) {
      y.push(pA * LM, tA, 0, pA * D);
      const yM = (SM) => -pA * SM;
      zM(y, Math.min(yM(-1.5), yM(-0.45)), Math.max(yM(-1.5), yM(-0.45)), 0.8, 1.35, 1, { frame: g.white }), VA(y, yM(0.66), 0.62, 1.44, g.whiteDk, pA), G(y, yM(-0.06), 0.72, 0.07, 0.8), y.box("gloss", g.white, cM - iM + 0.2, 0.05, 0.1, 0, WA - tA - 0.03, 0.05, { r: 0.02 }), y.pop();
    }
    y.push(0, tA, cM);
    for (const pA of [-1.05, 1.05]) zM(y, pA - 0.42, pA + 0.42, 1, 1.4, 1, { frame: g.white });
    y.box("metal", g.steelDk, 0.5, 0.42, 0.05, 0, 1.2, 0.025, { r: 0.02 });
    for (const pA of [-1, 1]) y.box("metal", g.steelDk, 0.05, 0.3, 0.12, pA * 0.1, 1.22, 0.08, { r: 0.015 });
    v(y, "metal", g.steel, 0.03, 0.26, 0, 1.3, 0.12, { rz: D, seg: 8 }), y.tube("metal", "#3c4046", [T(0, 1.3, 0.12), T(0, 1.14, 0.14), T(0, 1.02, 0.14), T(0, 0.95, 0.1), T(0, 0.97, 0.04), T(0, 1.04, 0.03)], 0.04, { radial: 8 }), y.box("gloss", g.white, 2 * LM + 0.2, 0.05, 0.1, 0, WA - tA - 0.03, 0.05, { r: 0.02 }), y.pop(), y.add("gloss", b(0.45, 0.35, 0.16, 1.2, "tug"), "white", 0, WA, 0.45, {}), y.col(-0.45, WA, 0.1, 0.45, WA + 1.2, 0.8), y.cyl("metal", "#2a2c31", 0.08, 0.4, 0.12, WA + 1.35, 0.45, { seg: 12 }), y.lathe("metal", "#1d1e22", [[0.06, 0], [0.11, 0.04], [0.11, 0.07], [0.06, 0.05]], 0.12, WA + 1.53, 0.45, { seg: 12 });
    for (const pA of [-1, 1]) y.push(0, WA + 0.62, 0.45 + pA * 0.339, pA > 0 ? 0 : N), y.cyl("paint", g.white, 0.17, 0.01, 0, 0, 5e-3, { rx: D, seg: 24 }), y.cyl("paint", g.teal, 0.145, 0.012, 0, 0, 7e-3, { rx: D, seg: 24 }), y.tube("paint", g.white, [T(-0.09, -0.03, 0.014), T(-0.07, 0.05, 0.014), T(0, 0.09, 0.014), T(0.06, 0.05, 0.014), T(0.05, -0.02, 0.014), T(0, -0.03, 0.014)], 0.014, { radial: 4 }), y.pop();
    const kM = 0, oM = -1.3, jj = 9.15;
    y.box("metal", g.steelDk, 0.3, 0.04, 0.3, kM, WA + 0.02, oM, { r: 0.012 }), y.lathe("gloss", a, [[0, WA], [0.08, WA], [0.07, WA + 0.12], [0.05, jj], [0, jj + 0.01]], kM, 0, oM, { seg: 12 });
    for (let pA = 0; pA < 9; pA++) y.cyl(t(y, "metal"), g.galv, 0.012, 0.18, kM + (pA % 2 ? 0.1 : -0.1), WA + 0.45 + pA * 0.38, oM, { rz: D, seg: 5 });
    for (const [pA, yM] of [[7.35, "#fff4dc"], [7.75, "#fff4dc"], [8.15, "#fff4dc"]]) y.box("metal", g.steelDk, 0.06, 0.04, 0.16, kM, pA - 0.06, oM - 0.1, { r: 0.01 }), y.cyl("paint", g.black, 0.055, 0.1, kM, pA, oM - 0.17, { seg: 10 }), y.blink(yM, kM, pA, oM - 0.17, { size: 0.045, rate: 0.13, lo: 2.2, hi: 2.6 });
    y.box("gloss", a, 1.3, 0.06, 0.06, kM, 8.92, oM, { r: 0.02 });
    for (const pA of [-1, 1]) y.cyl(t(y, "metal"), g.steelDk, 0.01, 0.9, kM + pA * 0.62, 9.37, oM, { seg: 5 });
    y.flag(kM + 0.62, 8.9, oM, { color: g.teal, s: 1.2, ry: D }), y.push(kM, 6.2, oM - 0.05, 0, -D), y.lathe("gloss", g.white, [[0.025, 0], [0.03, 0.2], [0.05, 0.32], [0.1, 0.4], [0.09, 0.42], [0.04, 0.34]], 0, 0, 0, { seg: 12 }), y.pop(), y.box("metal", g.steelDk, 0.1, 0.08, 0.2, kM, 5.75, oM - 0.1, { r: 0.02 }), y.cyl("gloss", "#36383e", 0.085, 0.2, kM, 5.85, oM - 0.26, { rx: D, seg: 12 }), y.cyl("glow", "#fff1d6", 0.07, 0.01, kM, 5.85, oM - 0.362, { rx: D, seg: 12, glow: 1.2 }), y.box("gloss", g.whiteDk, 0.26, 0.18, 0.24, kM, jj + 0.08, oM, { round: true, r: 0.04 }), IM(y, kM, jj + 0.2, oM, 1.1, 2.7), y.blink("#ff5a4a", kM, jj + 0.45, oM, { size: 0.04, rate: 0.5, lo: 0.3, hi: 4.5 });
    for (const pA of [-1, 1]) {
      y.push(pA * u, 0, 0, pA * D);
      for (const yM of [-3.3, 0.9, 4.25]) pA < 0 && yA(yM, 0.45) || $(y, -pA * yM, 1.05, 0.62);
      n(y, -pA * -1.6, 2, 0.34), pA < 0 && yA(2, 0.6) || n(y, -pA * 2, 2, 0.34), y.pop();
    }
    if (y.push(m ? -0.35 : 0, 0, -o, N), n(y, 0, 2, 0.5), y.pop(), !m) {
      y.push(-u, 0, 2.6, -D);
      for (const pA of [-1, 1]) y.tube("metal", "#c9ced3", [T(pA * 0.23, 0.02, 0.78), T(pA * 0.23, 2.3, 0.14)], 0.024, { radial: 6 }), y.box("rubber", g.rubber, 0.08, 0.05, 0.1, pA * 0.23, 0.025, 0.79, { r: 0.015 });
      for (let pA = 1; pA < 8; pA++) {
        const yM = pA / 8.2;
        y.cyl("metal", "#c9ced3", 0.016, 0.46, 0, 0.02 + yM * 2.28, 0.78 - yM * 0.64, { rz: D, seg: 6 });
      }
      y.pop();
    }
  } };
  const K = (y, Y = 1) => x("puff|" + y + "|" + Y, () => A.puffGeo(Y, y)), NA = (y) => x("blob|" + y, () => A.blobGeo(1, 0, y));
  function zA(y, Y, u, o, B, a, H, m = ["#e79ab8", "#f2eee6", "#e5b94d", "#a79be0"], l = 1) {
    const _ = Math.max(2, Math.round(B / 0.36));
    for (let OA = 0; OA < _; OA++) {
      const yA = Y - B / 2 + (OA + 0.5) * (B / _), EA = Math.min(a * 0.55, 0.26) * (0.85 + (OA * 37 + H) % 5 * 0.06);
      y.add("foliage", K((OA + H) % 6, l), z("#4f9a57", "#8fc46b", (OA + H) % 3 * 0.2), yA, u + EA * 0.55, o + (OA % 2 - 0.5) * a * 0.18, { s: EA, sy: EA * 0.8, ry: OA * 1.3 });
    }
    for (let OA = 0; OA < _ * 2; OA++) {
      const yA = Y - B / 2 + 0.08 + (OA * 0.618 + H * 0.13) % 1 * (B - 0.16), EA = o + ((OA * 0.414 + H * 0.29) % 1 - 0.5) * a * 0.7;
      y.add("foliage", NA(OA % 8), m[OA % m.length], yA, u + 0.24 + OA * 7 % 5 * 0.025, EA, { s: 0.045 });
    }
  }
  function L(y, Y, u, o, B, a = "#e5b94d", H = false) {
    p(y, () => {
      y.box("gloss", g.white, o + 0.14, B + 0.14, 0.05, Y, u, 0.025, { r: 0.025 }), k(y, "gloss", g.glass, o, B, 0.02, Y, u, 0.045);
      for (const m of [-1, 1]) k(y, "paint", a, o * 0.26, B - 0.04, 0.012, Y + m * (o / 2 - o * 0.13), u, 0.058);
      k(y, "paint", O(a, 0.85), o - 0.02, 0.07, 0.014, Y, u + B / 2 - 0.05, 0.06), k(y, "gloss", g.white, 0.04, B, 0.035, Y, u, 0.07), k(y, "gloss", g.white, o, 0.04, 0.035, Y, u + B * 0.1, 0.07), y.box("wood", g.teak, o + 0.24, 0.05, 0.1, Y, u - B / 2 - 0.1, 0.05, { r: 0.015 }), H && (y.box("wood", O(g.teak, 0.9), o + 0.1, 0.16, 0.12, Y, u - B / 2 - 0.22, 0.06, { r: 0.02 }), zA(y, Y, u - B / 2 - 0.21, 0.07, o + 0.02, 0.1, Math.round(Y * 10 + u * 7) & 7, void 0, 0));
    });
  }
  function V(y, Y, u = false) {
    const B = [-0.5, 0.33], a = [0.52, 0.33], H = [-0.05, 0.3], m = [-0.2, 0.86], l = [0.38, 0.9];
    for (const [OA, yA] of [B, a]) {
      y.tor("rubber", g.black, 0.33 - 0.018, 0.022, OA, yA, 0, { rs: 5, ts: 18 }), y.tor("metal", g.galv, 0.33 - 0.045, 0.01, OA, yA, 0, { rs: 3, ts: 18 }), v(y, "metal", g.galv, 0.024, 0.1, OA, yA, 0, { rx: D, seg: 8 });
      for (let EA = 0; EA < 8; EA++) {
        const CA = EA / 8 * N;
        k(y, "metal", g.galv, 6e-3, 2 * (0.33 - 0.05), 6e-3, OA, yA, 0, { rz: CA });
      }
    }
    const _ = (OA, yA, EA = 0.018) => y.tube("gloss", Y, [T(OA[0], OA[1], 0), T(yA[0], yA[1], 0)], EA, { radial: 5 });
    _(H, m, 0.02), _(m, l, 0.017), _(H, [0.43, 0.72], 0.022), _([0.43, 0.72], l, 0.024), _(H, B, 0.012), _([m[0] + 0.03, m[1] - 0.08], B, 0.011), _([0.43, 0.72], a, 0.013), y.box("gloss", g.black, 0.26, 0.055, 0.15, m[0] - 0.08, m[1] + 0.14, 0, { round: true, r: 0.025 }), y.tube("metal", g.galv, [T(l[0] - 0.02, l[1], 0), T(l[0] - 0.02, l[1] + 0.12, 0)], 0.012, { radial: 5 }), y.tube("metal", g.galv, [T(l[0] - 0.06, l[1] + 0.12, -0.26), T(l[0] + 0.02, l[1] + 0.12, -0.1), T(l[0] + 0.02, l[1] + 0.12, 0.1), T(l[0] - 0.06, l[1] + 0.12, 0.26)], 0.011, { radial: 5 });
    for (const OA of [-1, 1]) v(y, "rubber", g.black, 0.018, 0.1, l[0] - 0.07, l[1] + 0.12, OA * 0.23, { rx: D });
    y.tor("metal", g.steelDk, 0.1, 8e-3, H[0], H[1], 0.05, { rs: 3, ts: 14 }), k(y, "gloss", Y, 0.42, 0.06, 0.012, (H[0] + B[0]) / 2, H[1] + 0.03, 0.065, { rz: 0.06 });
    for (const [OA, yA, EA, CA] of [[B[0], B[1], 0.25, N - 0.4], [a[0], a[1], 0.5, N - 0.15]]) y.tube("gloss", Y, e(OA, yA, 0.33 + 0.035, EA, CA, 7), 0.018, { radial: 5 });
    y.tube("metal", g.steelDk, [T(H[0] - 0.08, H[1] - 0.01, -0.05), T(H[0] - 0.22, 0.01, -0.17)], 0.01, { radial: 4 }), v(y, "gloss", g.white, 0.035, 0.05, l[0] + 0.08, l[1] - 0.04, 0, { rz: D, seg: 8 }), u && (y.push(a[0] + 0.05, l[1] - 0.02, 0), y.box("wood", g.teak, 0.3, 0.2, 0.34, 0, 0.1, 0, { r: 0.02 }), y.box("paint", "#5a4535", 0.26, 0.02, 0.3, 0, 0.19, 0, { r: 5e-3 }), y.add("foliage", K(2), "#6aa35d", 0.02, 0.24, 0.02, { s: 0.12, sy: 0.08 }), y.pop());
  }
  function e(y, Y, u, o, B, a) {
    const H = [];
    for (let m = 0; m <= a; m++) {
      const l = o + (B - o) * (m / a);
      H.push(T(y + Math.cos(l) * u, Y + Math.sin(l) * u, 0));
    }
    return H;
  }
  j.houseboat_dress = { desc: "Houseboat SEA SHANTY (dresses the houseboat hull/cabin blocks, placed at the cabin centre): timber deck-edge cap + rubbing strip, waterline band, sheer line + scuppers, names, fenders, mooring lines to the Long Pier and fuel-dock cleats, porch rail along the fuel-dock side + the open-water stern (rail colliders; open at the gangway, the pier, the finger pier and the boardwalk), cottage windows with curtains + flower boxes, door with lamp + mailbox, fascia/gutters; open sun deck with a café table set + a timber planter bench (colliders) and festoon lights; roof garden (planter trough, solar panels, kayak on a rack, chimney — colliders), deck chair + furled parasol; bike + laundry line.", params: {}, variants: 1, mount: "ground", build(y) {
    y.aoBase = 0.7;
    const Y = -3, u = 7.6, o = (Y + u) / 2, B = (u - Y) / 2, a = 4.5, H = 0.7, m = 1.6, l = -2.5, _ = 2.7, OA = 2.9, yA = g.teak, EA = g.teakDk, CA = [-14.6, -18.9], iA = "#2f3b3a", F = O(g.houseTeal, 1.12);
    for (const [XA, BM] of [[Y, -1], [u, 1]]) y.box(t(y, "paint"), iA, 0.02, 0.34, 2 * a + 0.04, XA + BM * 0.01, -1.5, 0, { r: 6e-3 }), y.box("rubber", g.rubber, 0.07, 0.1, 2 * a - 0.3, XA + BM * 0.03, 0.3, 0, { round: true, r: 0.03 }), y.box(t(y, "paint"), F, 0.012, 0.07, 2 * a - 0.1, XA + BM * 6e-3, 0.47, 0, { r: 4e-3 }), y.box("wood", yA, 0.07, 0.14, 2 * a + 0.14, XA + BM * 0.035, H - 0.07, 0, { r: 0.02 });
    for (const XA of [-1, 1]) y.box(t(y, "paint"), iA, 2 * B + 0.04, 0.34, 0.02, o, -1.5, XA * (a + 0.01), { r: 6e-3 }), y.box("rubber", g.rubber, 2 * B - 0.3, 0.1, 0.07, o, 0.3, XA * (a + 0.03), { round: true, r: 0.03 }), y.box(t(y, "paint"), F, 2 * B - 0.1, 0.07, 0.012, o, 0.47, XA * (a + 6e-3), { r: 4e-3 }), y.box("wood", yA, 2 * B, 0.14, 0.07, o, H - 0.07, XA * (a + 0.035), { r: 0.02 });
    p(y, () => {
      for (let Mj = Y + 1.2; Mj < u - 0.8; Mj += 2.1) for (const pj of [-1, 1]) k(y, "paint", iA, 0.22, 0.06, 0.012, Mj, 0.12, pj * (a + 6e-3));
      for (const Mj of [-3.2, -1.05, 1.1, 3.25]) k(y, "paint", iA, 0.012, 0.06, 0.22, u + 6e-3, 0.12, Mj);
      const XA = O(g.houseTeal, 0.86), BM = (-1.33 + 0.24) / 2, sj = 0.24 + 1.33;
      for (let Mj = -a + 1.5; Mj < a - 0.5; Mj += 1.5) Math.abs(Mj - 2.75) > 1.35 && k(y, "paint", XA, 0.01, sj, 0.035, Y - 5e-3, BM, Mj), Math.abs(Mj) > 1.35 && k(y, "paint", XA, 0.01, sj, 0.035, u + 5e-3, BM, Mj);
      for (let Mj = Y + 1.5; Mj < u - 0.5; Mj += 1.5) Math.abs(Mj - 4.9) > 1.45 && k(y, "paint", XA, 0.035, sj, 0.01, Mj, BM, -a - 5e-3), k(y, "paint", XA, 0.035, sj, 0.01, Mj, BM, a + 5e-3);
    }), y.push(Y, 0, 0, -D), xA(y, "SEA SHANTY", 0.26, g.white, 2.75, -0.2, 2e-3, { weight: 0.17 }), xA(y, "INKWAVE", 0.11, g.white, 2.75, -0.4, 2e-3, { weight: 0.2, spacing: 0.4 }), y.pop(), y.push(4.9, 0, -a, N), xA(y, "SEA SHANTY", 0.3, g.white, 0, -0.18, 2e-3, { weight: 0.17 }), xA(y, "INKWAVE", 0.12, g.white, 0, -0.42, 2e-3, { weight: 0.2, spacing: 0.4 }), y.pop(), y.push(u, 0, 0, D), xA(y, "SEA SHANTY", 0.26, g.white, 0, -0.2, 2e-3, { weight: 0.17 });
    for (const XA of [-1, 1]) y.tube("metal", g.galv, [T(XA * 0.22, -1.9, 0.12), T(XA * 0.22, 0.45, 0.12), T(XA * 0.22, 0.62, 0.08), T(XA * 0.22, 0.62, 0.02)], 0.02, { radial: 6 });
    for (let XA = -1.35; XA < 0.4; XA += 0.3) y.cyl("metal", g.galv, 0.016, 0.44, 0, XA, 0.12, { rz: D, seg: 6 });
    y.pop();
    const J = (XA, BM, sj, Mj) => {
      y.push(XA, BM, sj, Mj), y.box("metal", g.galv, 0.2, 0.04, 0.05, 0, 0, 0.03, { r: 0.012 });
      for (const pj of [-1, 1]) y.cyl("metal", g.galv, 0.015, 0.05, pj * 0.06, 0, 0.02, { rx: D, seg: 6 });
      y.pop();
    }, AA = (XA, BM, sj, Mj = g.navy) => {
      y.push(XA, 0, BM, sj), J(0, 0.58, 0.035, 0), y.tube("rubber", g.rope, [T(0, 0.56, 0.07), T(0, 0.3, 0.14), T(0, 0.12, 0.17)], 0.012, { radial: 4 }), y.lathe("gloss", Mj, [[0, -0.36], [0.06, -0.355], [0.1, -0.31], [0.115, -0.2], [0.115, 0.2], [0.1, 0.31], [0.06, 0.355], [0, 0.36]], 0, -0.28, 0.17, { seg: 12 });
      for (const pj of [-1, 1]) y.tor("gloss", g.white, 0.02, 8e-3, 0, -0.28 + pj * 0.38, 0.17, { rs: 3, ts: 7 });
      y.pop();
    };
    AA(Y, -2.9, -D), AA(Y, 3.1, -D, g.white), AA(-1.4, -a, N, g.white), AA(1.2, -a, N), AA(6.7, -a, N, g.white), AA(u, -2.1, D), AA(u, 2.35, D, g.white);
    const jA = (XA, BM) => [XA - CA[0], BM - CA[1]], gA = [[Y, -3.85, -1, jA(-19.64, -22.8)], [Y, 4.05, -1, jA(-19.64, -14.8)], [u, -2.95, 1, jA(-4.36, -21.6)], [u, 2.95, 1, jA(-4.36, -16.4)]];
    for (const [XA, BM, sj, [Mj, pj]] of gA) J(XA, 0.62, BM, sj * D), eA(y, [XA + sj * 0.07, 0.62, BM], [Mj - sj * 0.07, 0.075 + 0.04, pj], 0.22, 0.018, g.rope, 14), UA(y, Mj, 0.075 - 0.015, pj, 0.05, 0.035, 1, g.rope);
    for (const [XA, BM] of [[-m, l], [m, l], [-m, _], [m, _]]) y.box("wood", g.white, 0.12, OA - H, 0.12, XA, (H + OA) / 2, BM, { r: 0.03 });
    for (const XA of [-1, 1]) y.box("wood", g.white, 0.06, 0.14, _ - l + 0.12, XA * (m + 0.03), OA - 0.07, (l + _) / 2, { r: 0.015 }), y.box("wood", g.white, 2 * m + 0.12, 0.14, 0.06, 0, OA - 0.07, XA > 0 ? _ + 0.03 : l - 0.03, { r: 0.015 }), y.cyl("metal", g.galv, 0.05, _ - l + 0.1, XA * (m + 0.075), OA - 0.12, (l + _) / 2, { rx: D, seg: 10 }), y.tube("metal", g.galv, [T(XA * (m + 0.06), OA - 0.16, _ - 0.08), T(XA * (m + 0.1), OA - 0.3, _ - 0.08), T(XA * (m + 0.1), H + 0.2, _ - 0.08), T(XA * (m + 0.14), H + 0.05, _ - 0.04)], 0.035, { radial: 8 });
    y.push(m, 0, 0, D);
    for (const [XA, BM] of [[-1.55, "#e5b94d"], [0.1, "#df7c66"], [1.75, "#e5b94d"]]) L(y, -XA, 1.95, 0.9, 0.72, BM, true);
    y.pop(), y.push(0, 0, l, N);
    for (const XA of [-0.78, 0.78]) L(y, XA, 1.95, 0.78, 0.72, "#a79be0", XA > 0);
    y.pop(), y.push(0, 0, _), L(y, -0.55, 2, 1.2, 0.66, "#df7c66"), L(y, 0.95, 2.1, 0.44, 0.44, "#e5b94d"), y.pop(), y.push(-m, 0, 0, -D);
    const LA = 0.1;
    y.box("wood", g.white, 1.02, 2.08, 0.06, LA, H + 1.04, 0.03, { round: true, r: 0.03 }), y.box("gloss", g.tealDk, 0.84, 1.96, 0.05, LA, H + 0.98, 0.07, { round: true, r: 0.03 });
    for (const [XA, BM] of [[0.55, 0.62], [1.35, 0.5]]) y.box("gloss", O(g.tealDk, 1.12), 0.64, BM, 0.02, LA, H + XA, 0.1, { round: true, r: 0.02 });
    y.tor("metal", "#b58a4a", 0.13, 0.025, LA, H + 1.58, 0.11, { rs: 6, ts: 18 }), y.cyl("gloss", g.glass, 0.12, 0.01, LA, H + 1.58, 0.1, { rx: D, seg: 16 }), y.sph("metal", "#b58a4a", 0.04, LA + 0.32, H + 1, 0.12, { ws: 8, hs: 6 }), y.box("wood", EA, 1.1, 0.06, 0.14, LA, H + 2.1, 0.07, { r: 0.02 }), y.box("metal", g.black, 0.14, 0.24, 0.1, LA + 0.72, H + 1.75, 0.05, { r: 0.03 }), y.box("glow", "#ffdca0", 0.1, 0.14, 0.02, LA + 0.72, H + 1.73, 0.105, { glow: 1.6, r: 0.01 }), y.box("metal", g.black, 0.18, 0.03, 0.12, LA + 0.72, H + 1.89, 0.06, { r: 0.01 }), y.box("gloss", g.navy, 0.2, 0.2, 0.012, LA - 0.62, H + 1.62, 6e-3, { r: 0.03 }), xA(y, "7", 0.13, g.white, LA - 0.62, H + 1.555, 0.012, { weight: 0.2, depth: 4e-3 }), y.box("gloss", g.coral, 0.32, 0.22, 0.12, LA - 0.66, H + 1.2, 0.06, { round: true, r: 0.04 }), y.box("gloss", O(g.coral, 0.8), 0.24, 0.02, 0.01, LA - 0.66, H + 1.26, 0.121, { r: 4e-3 }), L(y, -1.75, 2, 0.7, 0.6, "#e79ab8"), L(y, 1.85, 2, 0.7, 0.6, "#e79ab8"), G(y, 1.85, H + 0.72, 0.07, 0.75), y.pop();
    const kA = 0.82, SA = u - 0.12, hA = 2.4, sA = [];
    for (let XA = -a + 0.12; XA <= a - 0.11; XA += 1.1) sA.push([SA, XA]);
    sA.push([SA, a - 0.12]);
    for (let XA = SA - 1.1; XA > hA + 0.3; XA -= 1.1) sA.push([XA, -a + 0.12]);
    sA.push([hA, -a + 0.12]);
    for (const XA of [SA - 0.6, SA - 1.2]) sA.push([XA, a - 0.12]);
    for (const [XA, BM] of sA) y.box("wood", g.white, 0.08, kA, 0.08, XA, H + kA / 2, BM, { r: 0.02 }), k(y, "wood", g.white, 0.1, 0.04, 0.1, XA, H + kA + 0.02, BM);
    y.box("wood", yA, 0.12, 0.05, 2 * a - 0.12, SA, H + kA + 0.05, 0, { r: 0.02 }), y.box("wood", yA, SA - hA + 0.12, 0.05, 0.12, (SA + hA) / 2, H + kA + 0.05, -a + 0.12, { r: 0.02 }), y.box("wood", yA, 1.32, 0.05, 0.12, SA - 0.6, H + kA + 0.05, a - 0.12, { r: 0.02 });
    for (const XA of [0.32, 0.56]) y.cyl("rubber", g.rope, 0.014, 2 * a - 0.3, SA, H + XA, 0, { rx: D, seg: 6 }), y.cyl("rubber", g.rope, 0.014, SA - hA - 0.1, (SA + hA) / 2, H + XA, -a + 0.12, { rz: D, seg: 6 }), y.cyl("rubber", g.rope, 0.014, 1.2, SA - 0.6, H + XA, a - 0.12, { rz: D, seg: 6 });
    eA(y, [SA, H + 0.12, -a + 0.12], [-7.74 - CA[0], -1.28, -27.12 - CA[1]], 0.35, 0.014, g.rope, 16);
    const rA = H + 0.06, mA = H + kA + 0.08, JA = u - (SA - 0.04), wM = 0.7;
    y.col(SA - 0.04, rA, -a - wM, u + wM, mA, a + wM, { rail: true }), y.col(hA - 0.06, rA, -a - wM, SA - 0.04, mA, -a + JA, { rail: true }), y.col(SA - 1.26, rA, a - JA, SA - 0.04, mA, a + wM, { rail: true });
    for (const [XA, BM] of [[l + 0.08, -a + 0.12 + 1.1], [_ - 0.08, -a + 0.12 + 4.4]]) {
      y.box("wood", g.white, 0.08, 1.55, 0.08, SA, H + kA + 0.1 + 0.62, BM, { r: 0.02 }), y.sph("metal", g.black, 0.03, SA, H + kA + 0.1 + 1.4, BM, { ws: 8, hs: 6 });
      const sj = [m - 0.06, OA + 1.4, XA], Mj = [SA, H + kA + 0.1 + 1.36, BM];
      y.tube(t(y, "rubber"), g.black, YA(sj, Mj, 0.42, 16), 6e-3, { radial: 4 });
      const pj = YA(sj, Mj, 0.42, 44);
      for (let gj = 1; gj < 11; gj++) {
        const _N = pj[gj * 4];
        v(y, "rubber", g.black, 0.01, 0.04, _N[0], _N[1] - 0.025, _N[2], { seg: 5 }), y.sph("glow", gj % 3 === 1 ? "#ffd9a8" : "#fff0c9", 0.03, _N[0], _N[1] - 0.07, _N[2], { ws: 6, hs: 4, glow: 2.6, sy: 1.25 });
      }
    }
    {
      const XA = y.cols.length;
      y.push(4.4, H, -1.9, 0.35), j.cafeset.build(y, { color: g.coral, variant: 1 }), y.pop(), y.cols.length = XA;
    }
    y.col(4.4 - 0.85, H, -1.9 - 0.85, 4.4 + 0.85, H + 0.78, -1.9 + 0.85);
    {
      y.box("wood", yA, 2.6, 0.5, 0.55, 5, H + 0.5 / 2, 2.95, { r: 0.03 });
      for (let gj = 0; gj < 3; gj++) y.box("wood", O(yA, 0.92), 2.6 + 0.02, 0.02, 0.55 + 0.02, 5, H + 0.12 + gj * 0.14, 2.95, { r: 6e-3 });
      y.box("paint", "#5a4535", 2.6 - 0.1, 0.04, 0.55 - 0.1, 5, H + 0.5 - 0.03, 2.95, { r: 0.01 }), zA(y, 5 - 0.35, H + 0.5 - 0.04, 2.95, 2.6 - 0.9, 0.55 - 0.12, 5), y.cyl("wood", g.teakDk, 0.035, 0.9, 5 + 0.9, H + 0.5 + 0.4, 2.95, { seg: 7 });
      for (let gj = 0; gj < 4; gj++) y.add("foliage", K((gj + 2) % 6), z("#6f8f5a", "#9db77a", gj * 0.25), 5 + 0.9 + (gj % 2 - 0.5) * 0.3, H + 0.5 + 0.95 + (gj >> 1) * 0.18, 2.95 + ((gj >> 1) - 0.5) * 0.22, { s: 0.3, sy: 0.24, ry: gj * 1.7 });
      for (let gj = 0; gj < 4; gj++) y.box("wood", O(g.teak, 1.06), 2.6 - 0.2, 0.03, 0.08, 5, H + 0.44, 2.95 - 0.55 / 2 - 0.08 - gj * 0.09, { r: 0.01 });
      for (const gj of [-1, 1]) y.box("wood", EA, 0.06, 0.44, 0.36, 5 + gj * (2.6 / 2 - 0.3), H + 0.22, 2.95 - 0.55 / 2 - 0.2, { r: 0.012 });
      y.col(5 - 2.6 / 2, H, 2.95 - 0.55 / 2 - 0.42, 5 + 2.6 / 2, H + 0.5, 2.95 + 0.55 / 2);
    }
    const tA = 1.05, WA = a - 0.12, LM = H + kA + 0.3, iM = SA + 0.07;
    for (const XA of [tA, WA]) y.box("wood", g.white, 0.08, 0.5, 0.08, SA, H + kA + 0.22, XA, { r: 0.02 });
    const cM = [iM, LM, tA], kM = [iM, LM, WA];
    y.tube(t(y, "rubber"), g.white, YA(cM, kM, 0.08, 10), 6e-3, { radial: 4 });
    const oM = [["#e9836c", 0.34, 0.42], ["#f2eee6", 0.42, 0.3], ["#7fc0df", 0.3, 0.4], ["#e5b94d", 0.16, 0.2], ["#f2eee6", 0.16, 0.2], ["#a79be0", 0.36, 0.46]], jj = YA(cM, kM, 0.08, 60);
    oM.forEach(([XA, BM, sj], Mj) => {
      const pj = jj[Math.round((Mj + 0.8) / (oM.length + 0.6) * 60)];
      y.box("foliage", XA, 0.012, sj, BM, pj[0] + 0.01, pj[1] - sj / 2 + 0.01, pj[2], { rx: Mj % 2 ? 0.05 : -0.04, r: 4e-3 });
      for (const gj of [-1, 1]) k(y, "wood", "#ddb987", 0.02, 0.05, 0.015, pj[0] + 0.012, pj[1] + 5e-3, pj[2] + gj * BM * 0.35);
    }), y.push(0.25, H, _ + 0.3, 0, 0.08), V(y, g.sky || "#7fc0df", true), y.pop(), y.aoBase = OA;
    const pA = 2.18, yM = 2.3, SM = 0.5, JM = 0.42, Qj = -0.35;
    y.box("wood", yA, yM, JM, SM, Qj, OA + JM / 2, pA, { r: 0.03 });
    for (let XA = 0; XA < 3; XA++) y.box("wood", O(yA, 0.92), yM + 0.02, 0.02, SM + 0.02, Qj, OA + 0.1 + XA * 0.13, pA, { r: 6e-3 });
    y.box("paint", "#5a4535", yM - 0.1, 0.04, SM - 0.1, Qj, OA + JM - 0.03, pA, { r: 0.01 }), zA(y, Qj, OA + JM - 0.04, pA, yM - 0.2, SM - 0.12, 3), y.col(Qj - yM / 2, OA, pA - SM / 2, Qj + yM / 2, OA + JM, pA + SM / 2), y.box("metal", g.steelDk, 0.3, 0.06, 0.3, 1.25, OA + 0.03, 2.3, { r: 0.02 }), y.cyl("metal", "#2b2d31", 0.075, 1.05, 1.25, OA + 0.55, 2.3, { seg: 12 }), y.lathe("metal", "#1f2024", [[0.07, 0], [0.16, 0.08], [0.02, 0.2]], 1.25, OA + 1.1, 2.3, { seg: 12 }), y.cyl("metal", "#2b2d31", 0.1, 0.04, 1.25, OA + 0.85, 2.3, { seg: 12 }), y.col(1.1, OA, 2.15, 1.4, OA + 1.1, 2.45);
    for (const XA of [-0.78, 0.78]) {
      y.push(XA, OA + 0.3, -1.98, 0, -0.32), y.box("metal", g.galv, 1.46, 0.04, 0.96, 0, 0, 0, { r: 0.012 }), y.box("gloss", "#1f2d4a", 1.38, 0.02, 0.88, 0, 0.025, 0, { r: 6e-3 });
      for (let BM = 1; BM < 6; BM++) k(y, "gloss", "#3a4a6a", 0.01, 4e-3, 0.86, -0.69 + BM * 0.23, 0.037, 0);
      for (let BM = 1; BM < 4; BM++) k(y, "gloss", "#3a4a6a", 1.36, 4e-3, 0.01, 0, 0.037, -0.44 + BM * 0.22);
      y.pop();
      for (const [BM, sj] of [[-0.42, 0.18], [0.42, 0.44]]) y.box("metal", g.galv, 0.04, sj, 0.04, XA, OA + sj / 2, -1.98 + BM, { r: 0.01 });
    }
    y.col(-1.55, OA, -2.46, 1.55, OA + 0.48, -1.5);
    for (const XA of [-0.8, 1.1]) {
      y.box("metal", g.steelDk, 0.44, 0.04, 0.06, 1.33, OA + 0.3, XA, { r: 0.012 });
      for (const BM of [1.16, 1.5]) y.box("metal", g.steelDk, 0.04, 0.3, 0.04, BM, OA + 0.15, XA, { r: 0.01 });
      y.box("rubber", g.black, 0.12, 0.03, 0.08, 1.33, OA + 0.335, XA, { r: 0.01 });
    }
    RA(y, 1.33, OA + 0.36, 0.15, 3.1, 0.58, 0.3, g.coral, 0), y.col(1.1, OA, -1.45, 1.58, OA + 0.62, 1.75);
    {
      const XA = y.cols.length;
      y.push(-1, OA, -0.55, -D + 0.25), j.deckchair.build(y, { color: "teal", variant: 0 }), y.pop(), y.cols.length = XA;
    }
    y.cyl("metal", g.steelDk, 0.16, 0.06, -1.3, OA + 0.03, 0.35, { seg: 14, bevel: 0.02 }), y.lathe("foliage", z(g.coral, g.white, 0.2), [[0.014, 0.95], [0.045, 1.08], [0.07, 1.34], [0.066, 1.56], [0.045, 1.78], [0.016, 1.92]], -1.3, OA, 0.35, { seg: 10 });
    for (let XA = 0; XA < 5; XA++) y.lathe("foliage", O(g.coral, 0.82), [[0.02, 1 + XA * 0.18], [0.068, 1.12 + XA * 0.17]], -1.3, OA, 0.35, { seg: 10, ry: XA * 0.9 });
    y.cyl("paint", g.white, 0.072, 0.035, -1.3, OA + 1.45, 0.35, { seg: 10 }), y.cyl("wood", g.teak, 0.022, 0.95, -1.3, OA + 0.5, 0.35, { seg: 8 }), y.sph("wood", g.teakDk, 0.03, -1.3, OA + 1.97, 0.35, { ws: 8, hs: 6 });
    for (const XA of [-1, 1]) {
      for (const pj of [l + 0.08, _ - 0.08]) y.cyl("metal", g.black, 0.025, 1.45, XA * (m - 0.06), OA + 0.72, pj, { seg: 8 }), y.sph("metal", g.black, 0.035, XA * (m - 0.06), OA + 1.45, pj, { ws: 8, hs: 6 });
      const BM = [XA * (m - 0.06), OA + 1.4, l + 0.08], sj = [XA * (m - 0.06), OA + 1.4, _ - 0.08];
      y.tube(t(y, "rubber"), g.black, YA(BM, sj, 0.32, 16), 6e-3, { radial: 4 });
      const Mj = YA(BM, sj, 0.32, 40);
      for (let pj = 1; pj < 10; pj++) {
        const gj = Mj[pj * 4];
        v(y, "rubber", g.black, 0.01, 0.04, gj[0], gj[1] - 0.025, gj[2], { seg: 5 }), y.sph("glow", pj % 3 === 1 ? "#ffd9a8" : "#fff0c9", 0.03, gj[0], gj[1] - 0.07, gj[2], { ws: 6, hs: 4, glow: 2.6, sy: 1.25 });
      }
    }
  } };
  const R = (y, Y) => ({ desc: y, params: { length: "m", color: "hull", accent: "stripe / canvas", name: "transom name", fenderSide: "±1" }, variants: 1, mount: "ground", build(u, o) {
    u.aoBase = null, p(u, () => Y(u, o));
  } });
  j.yacht_sail = R("Masthead cruising yacht: lofted hull with antifouling, boot + cove stripes, teak toe rails, coachroof with ports, cockpit (wheel or tiller), spray dodger, mast with spreaders + standing rigging, boom with stack-pack cover and lazy jacks, furled genoa, pulpits + lifelines, fenders, ensign, transom name.", uM), j.yacht_motor = R("Motor cruiser: hard-chine hull with window band, swim platform, saloon with raked glazing, flybridge with helm seats + bimini, radar arch, bow rail + anchor, fenders, ensign, transom name.", RM), j.boat_fishing = R("Inshore fishing boat: high-bowed hull with bulwark stripe, tyre fenders, forward wheelhouse with mast, radar + lights, outrigger booms, A-frame gantry, net drum, fish boxes and marker buoys.", hM), j.boat_rib = R("RIB tender: GRP deep-V hull inside a grey Hypalon tube with grab line, console + windscreen, jockey seat, outboard.", UM), j.marina_pontoon = { desc: "Floating marina pontoon along local +X (deck 0.45 m above the sea): plank units with joint plates, fascia + rubbing strip, float drums, cleats; optional guide piles, service pedestals, dock boxes, life ring posts. Non-colliding scenery (outside the arena).", params: { length: "m", width: "m (2)", piles: "[s] pile positions on the +Z edge (or {s, side})", pedestals: "[s]", boxes: "[s]", rings: "[s]", kayaks: "s of a kayak rack" }, variants: 1, mount: "ground", build(y, Y) {
    p(y, () => {
      y.aoBase = null;
      const u = Y.length ?? 8, o = Y.width ?? 2, B = OM + 0.45;
      rM(y, u, o, Y);
      for (const a of Y.piles || []) {
        const H = typeof a == "number" ? a : a.s, m = typeof a == "number" ? 1 : a.side;
        HM(y, H, m * (o / 2 + 0.24), a.h ?? 3.2);
      }
      for (const a of Y.pedestals || []) {
        const H = -o / 2 + 0.25;
        y.box("gloss", g.white, 0.26, 0.9, 0.22, a, B + 0.45, H, { r: 0.05 }), y.box("gloss", g.navy, 0.28, 0.12, 0.24, a, B + 0.84, H, { r: 0.04 }), y.box("glow", "#ffe9b8", 0.2, 0.04, 0.2, a, B + 0.93, H, { glow: 1.8, r: 0.01 }), k(y, "paint", g.teal, 0.2, 0.08, 0.01, a, B + 0.62, H + 0.115), y.tube("rubber", "#3a6fb0", [T(a + 0.08, B + 0.5, H + 0.1), T(a + 0.3, B + 0.2, H + 0.3), T(a + 0.6, B + 0.03, H + 0.4)], 0.014, { radial: 4 });
      }
      for (const a of Y.boxes || []) {
        const H = o / 2 - 0.45;
        y.box("gloss", "#f1eee6", 1.3, 0.6, 0.6, a, B + 0.3, H, { round: true, r: 0.06 }), y.box("gloss", "#e6e1d6", 1.34, 0.08, 0.64, a, B + 0.62, H, { round: true, r: 0.03 }), k(y, "metal", g.galv, 0.1, 0.1, 0.02, a, B + 0.52, H - 0.31);
      }
      for (const a of Y.rings || []) {
        const H = o / 2 - 0.15;
        v(y, "gloss", g.white, 0.04, 1.4, a, B + 0.7, H, { seg: 8 }), G(y, a, B + 1.05, H - 0.08, 0.75), k(y, "gloss", "#c8473d", 0.36, 0.06, 0.14, a, B + 1.45, H - 0.04);
      }
      if (Y.kayaks != null) {
        const a = Y.kayaks, H = 0;
        for (const m of [-1.1, 1.1]) for (const l of [-0.45, 0.45]) v(y, "metal", g.galv, 0.03, 1.2, a + m, B + 0.6, H + l, { seg: 6 });
        for (let m = 0; m < 3; m++) {
          for (const l of [-1.1, 1.1]) k(y, "metal", g.galv, 0.05, 0.05, 1, a + l, B + 0.3 + m * 0.4, H);
          RA(y, a, B + 0.33 + m * 0.4, H + (m - 1) * 0.08, 3.4, 0.58, 0.3, [g.coral, g.mustard, g.teal][m], D);
        }
      }
    });
  } }, j.marina_gate = { desc: "Marina access: hinged aluminium gangway with handrails from the quay edge down to the marina pontoon, locked security gate + sign at the top. Outside the play bounds; only the gate collides (rail).", params: { run: "m (3.4)", width: "m (1.3)" }, variants: 1, mount: "ground", build(y, Y) {
    p(y, () => {
      y.aoBase = null;
      const o = Y.run ?? 3.4, B = Y.width ?? 1.3, a = 1.15, H = Math.atan2(a, o), m = Math.hypot(o, a);
      y.push(0.02, 0, 0, 0, 0, -H), k(y, "metal", "#b7bec4", m - 0.1, 0.06, B, m / 2, -0.03, 0);
      for (let l = 0; l < 14; l++) k(y, "metal", "#9aa2a9", 0.04, 0.02, B - 0.1, 0.2 + l * ((m - 0.4) / 13), 5e-3, 0);
      for (const l of [-1, 1]) {
        k(y, "metal", "#b7bec4", m, 0.18, 0.05, m / 2, 0.06, l * B / 2);
        for (let _ = 0; _ <= 4; _++) v(y, "metal", "#c9ced3", 0.02, 0.95, 0.1 + _ * (m - 0.2) / 4, 0.5, l * B / 2, { seg: 6 });
        y.tube("metal", "#c9ced3", [T(0.1, 0.98, l * B / 2), T(m - 0.1, 0.98, l * B / 2)], 0.025, { radial: 6 }), y.tube("metal", "#c9ced3", [T(0.1, 0.52, l * B / 2), T(m - 0.1, 0.52, l * B / 2)], 0.014, { radial: 4 });
      }
      for (const l of [-1, 1]) v(y, "rubber", g.black, 0.08, 0.1, m - 0.1, -0.08, l * (B / 2 - 0.2), { rx: D, seg: 10 });
      y.pop();
      for (const l of [-1, 1]) y.box("metal", "#8b949c", 0.1, 2.1, 0.1, 0.32, 1.05, l * (B / 2 + 0.08), { r: 0.02 });
      y.box("metal", "#8b949c", 0.1, 0.1, B + 0.26, 0.32, 2.1, 0, { r: 0.02 }), y.add("fence", x("gateMesh", () => new M.PlaneGeometry(B - 0.08, 1.7)), g.galv, 0.32, 1, 0, { ry: D, uvs: [(B - 0.08) / 0.07, 1.7 / 0.07] }), y.tube("metal", "#8b949c", [T(0.32, 0.15, -B / 2 + 0.04), T(0.32, 1.86, -B / 2 + 0.04), T(0.32, 1.86, B / 2 - 0.04), T(0.32, 0.15, B / 2 - 0.04), T(0.32, 0.15, -B / 2 + 0.04)], 0.025, { radial: 5 }), y.box("metal", g.black, 0.08, 0.16, 0.1, 0.36, 1.05, B / 2 - 0.12, { r: 0.02 }), y.box("gloss", g.navy, 0.04, 0.46, 1.2, 0.26, 2.42, 0, { round: true, r: 0.03 }), y.push(0.235, 0, 0, -D), xA(y, "HALYARD MARINA", 0.1, g.white, 0, 2.47, 1e-3, { weight: 0.2, depth: 4e-3 }), xA(y, "BERTH HOLDERS ONLY", 0.06, g.mustard, 0, 2.3, 1e-3, { weight: 0.22, depth: 4e-3 }), y.pop();
    });
    const u = (Y.width ?? 1.3) / 2 + 0.13;
    y.col(0.27, 0, -u, 0.37, 2.15, u, { rail: true });
  } }, j.dinghy_trailer = { desc: "Dinghy on its road trailer (cover, collider 3.0 × 3.8 × 1.5): galvanised A-frame trailer with bunks, mudguards, wheels, jockey wheel, winch post + strap, light board; a RIB tender with grey tubes, grab lines, console and a tilted-up outboard.", params: {}, variants: 1, mount: "ground", build(y) {
    const Y = "#aeb5bb", u = "#7d858c";
    for (const o of [-1, 1]) {
      k(y, "metal", Y, 0.08, 0.1, 3, o * 0.62, 0.36, -0.35), y.tube("metal", Y, [T(o * 0.62, 0.36, 1.15), T(o * 0.06, 0.38, 1.82)], 0.045, { radial: 6 }), y.box("wood", "#6b5a48", 0.14, 0.08, 2.4, o * 0.45, 0.47, -0.45, { r: 0.02 }), v(y, "metal", u, 0.035, 0.12, o * 0.45, 0.41, 0.35, { seg: 6 }), v(y, "metal", u, 0.035, 0.12, o * 0.45, 0.41, -1.3, { seg: 6 }), y.cyl("rubber", g.black, 0.3, 0.2, o * 1.18, 0.3, -0.45, { rz: D, seg: 16, bevel: 0.05 }), y.cyl("metal", "#c9ced3", 0.17, 0.21, o * 1.18, 0.3, -0.45, { rz: D, seg: 12 }), v(y, "metal", u, 0.05, 0.22, o * 1.25, 0.3, -0.45, { rz: D, seg: 6 });
      const B = [];
      for (let a = 0; a <= 8; a++) {
        const H = N * (a / 8);
        B.push(T(o * 1.18, 0.3 + Math.sin(H) * 0.42, -0.45 + Math.cos(H) * 0.42));
      }
      y.tube("metal", Y, B, 0.03, { radial: 5 }), k(y, "metal", Y, 0.26, 0.02, 0.85, o * 1.18, 0.73, -0.45), k(y, "metal", Y, 0.56, 0.06, 0.06, o * 0.9, 0.36, -0.45), k(y, "metal", "#c9473d", 0.16, 0.08, 0.04, o * 0.72, 0.42, -1.86);
    }
    v(y, "metal", u, 0.04, 2.5, 0, 0.3, -0.45, { rz: D, seg: 8 }), k(y, "metal", Y, 1.3, 0.08, 0.08, 0, 0.36, 1.15), k(y, "metal", Y, 1.3, 0.08, 0.08, 0, 0.36, -1.84), k(y, "paint", "#f1eee6", 0.5, 0.12, 0.012, 0, 0.42, -1.885), xA(y, "KL 204", 0.07, g.navy, 0, 0.39, -1.892, { ry: N, weight: 0.2, depth: 3e-3 }), y.box("metal", u, 0.14, 0.1, 0.24, 0, 0.4, 1.84, { r: 0.03 }), v(y, "metal", Y, 0.035, 0.5, 0.22, 0.38, 1.5, { seg: 8 }), y.cyl("rubber", g.black, 0.09, 0.06, 0.22, 0.09, 1.5, { rz: D, seg: 12 }), k(y, "metal", Y, 0.08, 0.7, 0.08, 0, 0.72, 1.15), y.box("metal", g.steelDk, 0.18, 0.14, 0.14, 0, 0.98, 1.2, { r: 0.03 }), y.tube("paint", "#3a6fb0", [T(0, 0.98, 1.1), T(0, 0.86, 1.03)], 0.012, { radial: 3 }), y.push(0, 0.78, 0.12), UM(y, { length: 3.9, color: "#5d6470", tilt: 1.25, console: false, motorScale: 0.95 }), y.pop(), y.col(-1.5, 0, -1.9, 1.5, 1.5, 1.9), y.blob(3.2, 4.2);
  } };
}
const eS = [{ type: "ferry_hull", pos: [0, 0, 0] }, { type: "ferry_cabin", pos: [0, 0, 0] }, { type: "ferry_bridge", pos: [0, 3.8, 0], mirror: false }, { type: "ferry_locker", pos: [11.75, 1.3, 2.15] }, { type: "ferry_cargo", pos: [14.2, 1.3, 0.4] }, { type: "tug_dress", pos: [17.5, 0, -18.5], notIn: "zones" }, { type: "tug_dress", pos: [17.5, 0, -18.5], access: true, onlyIn: "zones" }, { type: "tug_access", pos: [0, 0, 0], onlyIn: "zones" }, { type: "ferry_stair", pos: [0, 0, 0] }, { type: "tug_ramp_rails", pos: [0, 0, 0], notIn: "zones" }, { type: "tug_ramp_rails", pos: [0, 0, 0], z0: -7.55, z1: -13.45, onlyIn: "zones" }, { type: "houseboat_dress", pos: [-14.6, 0, -18.9] }, { type: "boat_rib", pos: [-9.4, -1.6, -27], rotY: Math.PI / 2 - 0.08, length: 3.6, color: "#3f9f97" }, { type: "dinghy_trailer", pos: [22.1, 0, -27.7], notIn: "zones" }, { type: "dinghy_trailer", pos: [20.4, 0, -35.3], rotY: 0.12, onlyIn: "zones" }, ...HS()];
function HS() {
  const j = Math.PI, A = [], M = -1.6, N = 27.6, I = 1.8, D = -38.8, T = 4;
  A.push({ type: "marina_gate", pos: [24, 0, -37.9], run: 3.3, width: 1.4 }), A.push({ type: "marina_pontoon", pos: [N, 0, D], rotY: -j / 2, length: T - D, width: I, unit: 4.3, piles: [{ s: 3.4, side: 1 }, { s: 20.5, side: 1 }, { s: 33.2, side: 1 }, { s: 42.2, side: 1 }], pedestals: [7.5, 15.9, 24.3, 32.7], boxes: [12, 29], rings: [5, 38.2], kayaks: 36.2 });
  const w = [];
  for (let z = 0; z <= 9; z++) w.push(-35.5 + z * 4.2);
  for (const z of w) A.push({ type: "marina_pontoon", pos: [N + I / 2, 0, z], length: 4.8, width: 0.7, unit: 2.4, cleatSides: [-1, 1], piles: [{ s: 4.95, side: 0, h: 2.8 }] });
  return [["yacht_sail", 7.8, "SALT SPRAY"], ["yacht_sail", 7.4, "KITTIWAKE"], ["yacht_motor", 7.6, "REEL TIME"], ["yacht_sail", 7.8, "HALCYON"], ["yacht_sail", 7.6, "PIPIT"], ["boat_fishing", 7.6, "MARY ANN"], ["yacht_sail", 7.2, "TERN"], ["yacht_sail", 7.9, "MARGUERITE"], ["yacht_motor", 7.4, "SEA BISCUIT"]].forEach(([z, C, E], P) => {
    const g = -33.4 + P * 4.2;
    A.push({ type: z, pos: [N + I / 2 + 0.5 + C / 2, M, g + (P % 2 ? 0.12 : -0.12)], rotY: j / 2 + (P % 3 - 1) * 0.015, length: C, name: E, fenderSide: P % 2 ? -1 : 1 });
  }), A.push({ type: "boat_rib", pos: [25.58, M, -24.6], rotY: 0.02, length: 4 }), A.push({ type: "boat_rib", pos: [25.58, M, -9.8], rotY: j - 0.02, length: 4, color: "#e9703a" }), A;
}
function fS(j, A) {
  const { THREE: M, col: N, shade: I, mixc: D, chamferBox: T, latheGeo: w, tubeGeo: O, extrudeGeo: z, rcylProf: C, flangeProf: E, arcPts: P, woodCrate: g, drum: Q, pallet: x, rod: U, wheel: k, TIRE: s, LIFERING: v, PI: S, TAU: q, HP: c, P3: G } = A, r = { tar: "#2e2a27", pile: "#8b7a67", pileLt: "#a3927b", endgrain: "#b9a684", whaler: "#86745f", whalerDk: "#6f5f4e", mussel: "#262b35", rope: "#cdb894", ropeBlue: "#3f5a7a", fender: "#25272c", stainless: "#c9d0d6", galv: "#b7bec4", galvDk: "#8d959c", fuelBlue: "#2f5f9e", fuelBlueDk: "#24497a", fuelRed: "#c6503f", fuelYel: "#e8b64a", club: "#23385c", clubGold: "#caa251", glass: "#34495a", glassLt: "#4f6a7c", frame: "#e9e4d9", frameDk: "#56606b", render: "#efe8da", cladding: "#8fb8b4", concrete: "#cfc8bb", concreteDk: "#a9a295", rock: "#8e8a82", rockDk: "#6d6a64", rockLt: "#aba69b", liftBlue: "#2d5f9a", liftYel: "#e3b23c", tarp: "#3d6b8f", tarpDk: "#2f5675", hull: "#eeeae2", antifoul: "#a8483c", red: "#c9453b", green: "#3d8a5a", white: "#f2eee6", lamp: "#ffe2a8", led: "#ff5a3c", ledG: "#63e08a" }, t = new Set(Object.keys(j));
  let p = null;
  const f = (L) => {
    if (A.noShadow) return A.noShadow(L);
    const V = p && p.k && p.k.mat;
    if (!V || L === "glow" || L === "blob" || L.endsWith("_ns")) return L;
    const e = L + "_ns";
    return !V[e] && V[L] && (V[e] = V[L]), V[e] ? e : L;
  };
  class h {
    constructor() {
      this.p = [], this.n = [], this.uv = [], this.c = [], this.idx = [];
    }
    v(V, e, R, y, Y, u, o = 1, B = o, a = o) {
      return this.p.push(V, e, R), this.n.push(y, Y, u), this.uv.push(0, 0), this.c.push(o, B, a), this.p.length / 3 - 1;
    }
    tri(V, e, R) {
      const y = this.p, Y = this.n, u = y[V * 3], o = y[V * 3 + 1], B = y[V * 3 + 2], a = y[e * 3] - u, H = y[e * 3 + 1] - o, m = y[e * 3 + 2] - B, l = y[R * 3] - u, _ = y[R * 3 + 1] - o, OA = y[R * 3 + 2] - B, yA = H * OA - m * _, EA = m * l - a * OA, CA = a * _ - H * l;
      if (yA * yA + EA * EA + CA * CA < 1e-18) return;
      yA * (Y[V * 3] + Y[e * 3] + Y[R * 3]) + EA * (Y[V * 3 + 1] + Y[e * 3 + 1] + Y[R * 3 + 1]) + CA * (Y[V * 3 + 2] + Y[e * 3 + 2] + Y[R * 3 + 2]) < 0 ? this.idx.push(V, R, e) : this.idx.push(V, e, R);
    }
    quad(V, e, R, y) {
      this.tri(V, e, R), this.tri(V, R, y);
    }
    geo() {
      const V = new M.BufferGeometry();
      return V.setAttribute("position", new M.Float32BufferAttribute(this.p, 3)), V.setAttribute("normal", new M.Float32BufferAttribute(this.n, 3)), V.setAttribute("uv", new M.Float32BufferAttribute(this.uv, 2)), V.setAttribute("color", new M.Float32BufferAttribute(this.c, 3)), V.setIndex(this.idx), V;
    }
  }
  const X = /* @__PURE__ */ new Map(), TA = (L, V) => {
    let e = X.get(L);
    return e || (e = V(), X.set(L, e)), e;
  }, Z = (L) => typeof L == "number" ? L.toFixed(4) : String(L), W = (L) => {
    const V = Math.sin(L * 127.1 + 311.7) * 43758.5453;
    return V - Math.floor(V);
  }, PA = (L) => {
    const V = N(L);
    return [V.r, V.g, V.b];
  }, MA = (L, V, e) => [L[0] + (V[0] - L[0]) * e, L[1] + (V[1] - L[1]) * e, L[2] + (V[2] - L[2]) * e], wA = (L, V, e) => {
    const R = Math.max(0, Math.min(1, (e - L) / (V - L)));
    return R * R * (3 - 2 * R);
  };
  function xA(L, V, e, R, y, Y, u = {}) {
    const o = j[V];
    if (!o) return;
    const B = L.cols.length, a = L.aoBase;
    L.push(e, R, y, Y), o.build(L, u), L.pop(), L.aoBase = a;
    const H = Math.cos(Y), m = Math.sin(Y);
    for (let l = B; l < L.cols.length; l++) {
      const _ = L.cols[l];
      let OA = 1 / 0, yA = 1 / 0, EA = -1 / 0, CA = -1 / 0;
      for (const [iA, F] of [[_[0], _[2]], [_[3], _[2]], [_[3], _[5]], [_[0], _[5]]]) {
        const J = e + iA * H + F * m, AA = y - iA * m + F * H;
        OA = Math.min(OA, J), EA = Math.max(EA, J), yA = Math.min(yA, AA), CA = Math.max(CA, AA);
      }
      L.cols[l] = _.length > 6 ? [OA, _[1] + R, yA, EA, _[4] + R, CA, _[6]] : [OA, _[1] + R, yA, EA, _[4] + R, CA];
    }
  }
  const YA = (L, V, e, R, y, Y, u = 12) => {
    const o = [];
    for (let B = 0; B <= u; B++) {
      const a = (y + (Y - y) * (B / u)) * S / 180;
      o.push([L + Math.cos(a) * e, V + Math.sin(a) * R]);
    }
    return o;
  }, eA = (L, V, e, R, y = 24) => ({ c: YA(L, V, e, R, 0, 360, y).slice(0, y) }), TM = { A: [0.66, [[0, 0], [0.33, 1], [0.66, 0]], [[0.13, 0.33], [0.53, 0.33]]], B: [0.58, [[0, 0], [0, 1]], [[0, 1], ...YA(0.3, 0.755, 0.245, 0.245, 90, -90, 12), [0, 0.51]], [[0, 0.51], ...YA(0.32, 0.255, 0.255, 0.255, 90, -90, 12), [0, 0]]], C: [0.64, YA(0.34, 0.5, 0.34, 0.5, 46, 314, 22)], D: [0.6, [[0, 0], [0, 1]], [[0, 1], ...YA(0.16, 0.5, 0.44, 0.5, 90, -90, 16), [0, 0]]], E: [0.5, [[0.5, 1], [0, 1], [0, 0], [0.5, 0]], [[0, 0.52], [0.42, 0.52]]], F: [0.5, [[0.5, 1], [0, 1], [0, 0]], [[0, 0.52], [0.42, 0.52]]], G: [0.68, [...YA(0.34, 0.5, 0.34, 0.5, 46, 360, 22), [0.4, 0.5]]], H: [0.6, [[0, 0], [0, 1]], [[0.6, 0], [0.6, 1]], [[0, 0.52], [0.6, 0.52]]], I: [0, [[0, 0], [0, 1]]], J: [0.5, [[0.5, 1], ...YA(0.25, 0.3, 0.25, 0.3, 0, -172, 12)]], K: [0.58, [[0, 0], [0, 1]], [[0.56, 1], [0.02, 0.38]], [[0.22, 0.6], [0.6, 0]]], L: [0.48, [[0, 1], [0, 0], [0.48, 0]]], M: [0.76, [[0, 0], [0, 1], [0.38, 0.3], [0.76, 1], [0.76, 0]]], N: [0.62, [[0, 0], [0, 1], [0.62, 0], [0.62, 1]]], O: [0.74, eA(0.37, 0.5, 0.37, 0.5, 28)], P: [0.56, [[0, 0], [0, 1]], [[0, 1], ...YA(0.29, 0.735, 0.265, 0.265, 90, -90, 12), [0, 0.47]]], Q: [0.74, eA(0.37, 0.5, 0.37, 0.5, 28), [[0.46, 0.22], [0.78, -0.04]]], R: [0.58, [[0, 0], [0, 1]], [[0, 1], ...YA(0.29, 0.735, 0.265, 0.265, 90, -90, 12), [0, 0.47]], [[0.26, 0.47], [0.6, 0]]], S: [0.56, [...YA(0.28, 0.75, 0.27, 0.25, 28, 270, 12), ...YA(0.28, 0.25, 0.28, 0.25, 90, -152, 12).slice(1)]], T: [0.62, [[0, 1], [0.62, 1]], [[0.31, 1], [0.31, 0]]], U: [0.6, [[0, 1], ...YA(0.3, 0.32, 0.3, 0.32, 180, 360, 14), [0.6, 1]]], V: [0.66, [[0, 1], [0.33, 0], [0.66, 1]]], W: [0.92, [[0, 1], [0.23, 0], [0.46, 0.72], [0.69, 0], [0.92, 1]]], X: [0.62, [[0, 1], [0.62, 0]], [[0, 0], [0.62, 1]]], Y: [0.64, [[0, 1], [0.32, 0.48], [0.64, 1]], [[0.32, 0.48], [0.32, 0]]], Z: [0.56, [[0, 1], [0.56, 1], [0, 0], [0.56, 0]]], 0: [0.56, eA(0.28, 0.5, 0.28, 0.5, 26)], 1: [0.3, [[0, 0.78], [0.26, 1], [0.26, 0]]], 2: [0.54, [...YA(0.27, 0.72, 0.27, 0.28, 160, -30, 12), [0, 0], [0.56, 0]]], 3: [0.54, YA(0.26, 0.75, 0.25, 0.25, 150, -90, 12), YA(0.27, 0.26, 0.28, 0.26, 90, -150, 12)], 4: [0.6, [[0.44, 0], [0.44, 1], [0, 0.3], [0.6, 0.3]]], 5: [0.54, [[0.5, 1], [0.07, 1], [0.05, 0.52], ...YA(0.29, 0.34, 0.28, 0.34, 150, -150, 14)]], 6: [0.56, [...YA(0.28, 0.5, 0.28, 0.5, 62, 180, 10), [0, 0.3]], eA(0.28, 0.3, 0.28, 0.3, 20)], 7: [0.54, [[0, 1], [0.54, 1], [0.18, 0]]], 8: [0.56, eA(0.28, 0.76, 0.23, 0.24, 18), eA(0.28, 0.27, 0.28, 0.27, 20)], 9: [0.56, eA(0.28, 0.7, 0.28, 0.3, 20), [[0.56, 0.7], ...YA(0.28, 0.5, 0.28, 0.5, 0, -118, 10)]], "-": [0.36, [[0, 0.45], [0.36, 0.45]]], "+": [0.46, [[0, 0.45], [0.46, 0.45]], [[0.23, 0.22], [0.23, 0.68]]], "/": [0.4, [[0, 0], [0.4, 1]]], "'": [0, [[0, 1], [0, 0.8]]], "&": [0.7, [[0.7, 0], ...YA(0.27, 0.72, 0.17, 0.2, -40, 220, 12).reverse(), [0.08, 0.28], ...YA(0.26, 0.24, 0.24, 0.24, 180, 300, 6), [0.62, 0.36]]] }, AM = { "·": [[0, 0.46]], ".": [[0, 0]], ":": [[0, 0.1], [0, 0.62]] }, KA = 0.34;
  function BA(L, V, e, R, y, Y, u) {
    const o = V.length, B = Math.SQRT1_2, a = Y - u > 1e-5, H = y > 1e-5, m = V.map((yA, EA) => {
      const CA = e ? V[(EA - 1 + o) % o] : EA > 0 ? V[EA - 1] : null, iA = e ? V[(EA + 1) % o] : EA < o - 1 ? V[EA + 1] : null, F = (kA, SA) => {
        const hA = SA[0] - kA[0], sA = SA[1] - kA[1], rA = Math.hypot(hA, sA) || 1;
        return [-sA / rA, hA / rA];
      }, J = CA ? F(CA, yA) : null, AA = iA ? F(yA, iA) : null;
      if (!J) return [AA[0], AA[1], 1];
      if (!AA) return [J[0], J[1], 1];
      let jA = J[0] + AA[0], gA = J[1] + AA[1];
      const LA = Math.hypot(jA, gA) || 1;
      return jA /= LA, gA /= LA, [jA, gA, Math.min(1.6, 1 / Math.max(0.3, jA * AA[0] + gA * AA[1]))];
    }), l = V.map((yA, EA) => {
      const [CA, iA, F] = m[EA], J = (sA) => [yA[0] + CA * F * sA, yA[1] + iA * F * sA], AA = H ? R - y : R, jA = J(AA), gA = J(R), LA = J(-AA), kA = J(-R), SA = H ? y : 0, hA = [L.v(jA[0], jA[1], Y, 0, 0, 1), L.v(LA[0], LA[1], Y, 0, 0, 1)];
      return H && hA.push(L.v(jA[0], jA[1], Y, CA * B, iA * B, B), L.v(gA[0], gA[1], Y - y, CA * B, iA * B, B), L.v(LA[0], LA[1], Y, -CA * B, -iA * B, B), L.v(kA[0], kA[1], Y - y, -CA * B, -iA * B, B)), a && hA.push(L.v(gA[0], gA[1], Y - SA, CA, iA, 0), L.v(gA[0], gA[1], u, CA, iA, 0), L.v(kA[0], kA[1], Y - SA, -CA, -iA, 0), L.v(kA[0], kA[1], u, -CA, -iA, 0)), hA;
    }), _ = e ? o : o - 1, OA = l[0].length;
    for (let yA = 0; yA < _; yA++) {
      const EA = l[yA], CA = l[(yA + 1) % o];
      for (let iA = 0; iA < OA; iA += 2) L.quad(EA[iA], EA[iA + 1], CA[iA + 1], CA[iA]);
    }
  }
  function fA(L, V, e, R, y, Y, u, o, B = 0, a = q) {
    const H = Math.SQRT1_2, m = Y - u > 1e-5, l = y > 1e-5, _ = l ? R - y : R, OA = a - B > q - 1e-4, yA = L.v(V, e, Y, 0, 0, 1), EA = [], CA = [], iA = [], F = [], J = [], AA = OA ? o : o + 1;
    for (let jA = 0; jA < AA; jA++) {
      const gA = B + (a - B) * jA / o, LA = Math.cos(gA), kA = Math.sin(gA);
      EA.push(L.v(V + LA * _, e + kA * _, Y, 0, 0, 1)), l && (CA.push(L.v(V + LA * _, e + kA * _, Y, LA * H, kA * H, H)), iA.push(L.v(V + LA * R, e + kA * R, Y - y, LA * H, kA * H, H))), m && (F.push(L.v(V + LA * R, e + kA * R, Y - (l ? y : 0), LA, kA, 0)), J.push(L.v(V + LA * R, e + kA * R, u, LA, kA, 0)));
    }
    for (let jA = 0; jA < o; jA++) {
      const gA = OA ? (jA + 1) % o : jA + 1;
      L.tri(yA, EA[jA], EA[gA]), l && L.quad(CA[jA], iA[jA], iA[gA], CA[gA]), m && L.quad(F[jA], J[jA], J[gA], F[gA]);
    }
  }
  function IM(L, V, e, R, y = 10) {
    return TA(["gl", L, V, e, R, y].map(Z).join("|"), () => {
      const Y = 1 - V, u = V / 2, o = (_) => [u + _[0] * Y, u + _[1] * Y], B = new h(), a = Math.min(R, u * 0.6);
      if (AM[L]) {
        for (const _ of AM[L]) {
          const OA = o(_);
          fA(B, u * 1.15, OA[1], u * 1.15, a, e, 0, y);
        }
        return { geo: B.geo(), adv: V * 1.3 };
      }
      const H = TM[L];
      if (!H) return { geo: null, adv: KA };
      const [m, ...l] = H;
      return l.forEach((_, OA) => {
        const yA = e > 0 ? e - OA * 6e-3 : OA * 4e-4, EA = !Array.isArray(_);
        let CA = (EA ? _.c : _).map(o);
        if (CA = CA.filter((AA, jA) => jA === 0 || Math.hypot(AA[0] - CA[jA - 1][0], AA[1] - CA[jA - 1][1]) > 1e-4), EA) {
          BA(B, CA, true, u, a, yA, 0);
          return;
        }
        let iA = [CA[0]];
        const F = [CA[0], CA[CA.length - 1]];
        for (let AA = 1; AA < CA.length; AA++) if (iA.push(CA[AA]), AA < CA.length - 1) {
          const jA = CA[AA - 1], gA = CA[AA], LA = CA[AA + 1], kA = Math.atan2(gA[1] - jA[1], gA[0] - jA[0]), SA = Math.atan2(LA[1] - gA[1], LA[0] - gA[0]);
          let hA = Math.abs(SA - kA);
          hA > S && (hA = q - hA), hA > 0.6 && (BA(B, iA, false, u, a, yA, 0), iA = [CA[AA]], F.push(CA[AA]));
        }
        iA.length > 1 && BA(B, iA, false, u, a, yA, 0);
        const J = (AA, jA) => {
          const gA = Math.atan2(AA[1] - jA[1], AA[0] - jA[0]);
          fA(B, AA[0], AA[1], u, a, yA, 0, Math.max(3, Math.round(y / 2)), gA - c, gA + c);
        };
        J(CA[0], CA[1]), J(CA[CA.length - 1], CA[CA.length - 2]);
        for (const AA of F.slice(2)) fA(B, AA[0], AA[1], u, a, yA, 0, y);
      }), { geo: B.geo(), adv: m * Y + V };
    });
  }
  const GA = (L, V = 0.17, e = 0.12) => {
    let R = 0;
    const y = [...L];
    return y.forEach((Y, u) => {
      R += Y === " " ? KA : IM(Y, V, 0.12, 0.035).adv, u < y.length - 1 && (R += e);
    }), R;
  };
  function bA(L, V, e = {}) {
    const R = e.h ?? 0.3, y = e.wt ?? 0.17, Y = !!e.flat, u = Y ? 0 : e.dep ?? 0.12, o = Y ? 0 : e.bev ?? (R < 0.34 ? 0 : 0.03), B = e.track ?? 0.12, a = e.ds ?? (Y || R < 0.12 ? 6 : 8), H = GA(V, y, B) * R;
    let m = e.align === "left" ? 0 : e.align === "right" ? -H : -H / 2;
    const l = [...V];
    return l.forEach((_, OA) => {
      if (_ === " ") {
        m += (KA + B) * R;
        return;
      }
      const yA = IM(_, y, u, o, a), EA = e.mat ?? (Y ? "paint" : "gloss");
      if (yA.geo && L.add(Y || R < 0.2 ? f(EA) : EA, yA.geo, e.c ?? r.club, (e.x ?? 0) + m, e.y ?? 0, e.z ?? 0, { s: R, sz: Y ? 1 : R, glow: e.glow, ao: false }), yA.geo && e.lit) {
        const CA = IM(_, y, 0, 0, a);
        CA.geo && L.add(f("glow"), CA.geo, e.litC ?? e.c ?? r.clubGold, (e.x ?? 0) + m, e.y ?? 0, (e.z ?? 0) + u * R + 4e-3, { s: R, sz: 1, glow: e.lit, ao: false });
      }
      m += (yA.adv + (OA < l.length - 1 ? B : 0)) * R;
    }), H;
  }
  const sM = { a: [[0.1, 1], [0.46, 1]], b: [[0.53, 0.94], [0.53, 0.56]], c: [[0.53, 0.44], [0.53, 0.06]], d: [[0.1, 0], [0.46, 0]], e: [[0.03, 0.44], [0.03, 0.06]], f: [[0.03, 0.94], [0.03, 0.56]], g: [[0.1, 0.5], [0.46, 0.5]] }, WM = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];
  function cA(L) {
    return TA("seg7|" + L, () => {
      const V = new h(), e = 0.1, R = 0.09, y = (Y, u) => V.v(Y + u * R, u, 0, 0, 0, 1);
      for (const Y of L) {
        if (Y === ".") {
          const EA = [y(0.6, 0), y(0.68, 0), y(0.68, 0.08), y(0.6, 0.08)];
          V.quad(EA[0], EA[1], EA[2], EA[3]);
          continue;
        }
        const [u, o] = sM[Y], B = o[0] - u[0], a = o[1] - u[1], H = Math.hypot(B, a), m = B / H, l = a / H, _ = -l, OA = m, yA = [y(u[0], u[1]), y(u[0] + m * e / 2 + _ * e / 2, u[1] + l * e / 2 + OA * e / 2), y(o[0] - m * e / 2 + _ * e / 2, o[1] - l * e / 2 + OA * e / 2), y(o[0], o[1]), y(o[0] - m * e / 2 - _ * e / 2, o[1] - l * e / 2 - OA * e / 2), y(u[0] + m * e / 2 - _ * e / 2, u[1] + l * e / 2 - OA * e / 2)];
        V.quad(yA[0], yA[1], yA[2], yA[5]), V.quad(yA[5], yA[2], yA[3], yA[4]);
      }
      return V.geo();
    });
  }
  function MM(L, V, e, R, y, Y, u = r.led, o = 2.4) {
    let B = e;
    for (let a = 0; a < V.length; a++) {
      const H = V[a];
      if (H === ".") continue;
      const m = V[a + 1] === "." ? "." : "";
      L.add(f("paint"), cA("abcdefg."), I(u, 0.16), B, R, y, { s: Y, ao: false }), H !== " " && L.add("glow", cA((WM[+H] ?? "") + m), u, B, R, y + 15e-4, { s: Y, glow: o, ao: false }), B += Y * 0.72;
    }
    return B - e;
  }
  const qA = () => TA("pbox", () => new M.BoxGeometry(1, 1, 1)), UA = (L, V, e, R, y, Y, u, o, B, a = {}) => L.add(V, qA(), e, u, o, B, { ...a, sx: R, sy: y, sz: Y });
  function VA(L, V, e, R) {
    return TA(["pile", L, V, e, R % 5].map(Z).join("|"), () => {
      const y = [[V * 1.06, -2.9], [V * 1.045, -1.3], [V * 1.02, -0.92], [V, L - 0.045], null, [V, L - 0.045], [V * 0.84, L], null, [V * 0.84, L], [0, L + 0.016]], Y = w(y, e), u = Y.attributes.position, o = Y.attributes.color, B = Y.attributes.normal, a = Y.attributes.uv, H = PA(r.tar), m = PA(r.pile), l = PA(r.pileLt), _ = PA(r.endgrain);
      for (let OA = 0; OA < u.count; OA++) {
        const yA = u.getY(OA), EA = Math.round(a.getX(OA) * e) % e, CA = W(EA * 3.1 + R), iA = W(EA * 7.7 + R * 1.3);
        let F;
        if (B.getY(OA) > 0.6 && yA > L - 0.01) F = MA(_, l, CA * 0.4);
        else {
          const J = MA(m, l, CA * 0.55), AA = wA(-1.3, -0.92, yA);
          F = MA(MA(H, m, 0.1 + iA * 0.12), J, AA), F = MA(F, PA("#3c4a30"), 0.55 * (1 - wA(-1.52, -1.2, yA)) * wA(-1.9, -1.55, yA));
          const jA = 1 - 0.14 * (1 - wA(-0.92, -0.3, yA)) * AA;
          F = [F[0] * jA, F[1] * jA, F[2] * jA];
        }
        o.setXYZ(OA, F[0], F[1], F[2]);
      }
      return Y;
    });
  }
  function zM(L, V, e) {
    return TA(["mussel", L, V, e % 4].map(Z).join("|"), () => {
      const R = new h(), y = [-1.84, -1.66, -1.5], Y = [], u = PA(r.mussel), o = PA("#34394a"), B = PA("#9a978c"), a = PA("#3b4a33");
      y.forEach((H, m) => {
        const l = [];
        for (let _ = 0; _ <= V; _++) {
          const OA = _ % V, yA = _ / V * q, EA = Math.cos(yA), CA = Math.sin(yA), iA = W(OA * 1.9 + m * 5.3 + e), F = W(OA * 4.1 + m * 2.7 + e * 0.7), J = m === y.length - 1 ? 3e-3 : m === 0 ? 0.01 : 0.022 + 0.03 * iA, AA = L + J;
          let jA = MA(u, o, F);
          iA > 0.82 && m > 0 && m < y.length - 1 && (jA = MA(jA, B, 0.55)), m === y.length - 1 && (jA = MA(o, a, 0.6));
          const gA = m === 0 ? -0.55 : m === y.length - 1 ? 0.85 : (iA - 0.5) * 0.7, LA = Math.hypot(1, gA);
          l.push(R.v(EA * AA, H + (m === 1 ? (F - 0.5) * 0.04 : 0), CA * AA, EA / LA, gA / LA, CA / LA, jA[0], jA[1], jA[2]));
        }
        Y.push(l);
      });
      for (let H = 0; H < Y.length - 1; H++) for (let m = 0; m < V; m++) R.quad(Y[H][m], Y[H][m + 1], Y[H + 1][m + 1], Y[H + 1][m]);
      return R.geo();
    });
  }
  function dA(L, V, e, R) {
    return TA(["wrap", L, V, e, R].map(Z).join("|"), () => {
      const y = [], Y = Math.round(V * 9);
      for (let u = 0; u <= Y; u++) {
        const o = u / Y * V * q;
        y.push([Math.cos(o) * (L + e * 0.8), u / Y * V * e * 2.05, Math.sin(o) * (L + e * 0.8)]);
      }
      return O(y, e, R);
    });
  }
  function QM(L, V, e, R, y, Y = {}) {
    const u = Math.max(5, L.seg(Y.seg ?? (Y.cap ? 7 : 6))), o = Math.floor(L.r(0, 97));
    L.add(Y.cap ? "wood" : f("wood"), VA(R, y, u, o), "white", V, 0, e, { ry: L.r(0, q), ao: false }), L.add(f("rubber"), zM(y * 1.04, u, o), "white", V, 0, e, { ry: L.r(0, q), ao: false }), Y.wrap && L.add(f("paint"), dA(y * 1.02, Y.wrap, 0.021, 4), Y.ropeC ?? r.rope, V, Y.wrapY ?? -0.62, e, { ry: L.r(0, q), ao: false }), Y.cap && L.lathe("metal", r.galv, [[y * 1.07, R - 0.05], [y * 1.07, R + 0.015], [0, R + 0.1]], V, 0, e, { seg: u });
  }
  function mM(L, V, e, R, y, Y = 0.3, u = r.stainless) {
    L.push(V, e, R, y), UA(L, f("metal"), I(u, 0.86), Y * 0.62, 0.014, 0.07, 0, 7e-3, 0);
    for (const B of [-1, 1]) L.lathe(f("metal"), u, [[0.03, 0.012], [0.02, 0.07], [0, 0.074]], B * Y * 0.2, 0, 0, { seg: 6 });
    const o = [];
    for (let B = 0; B <= 6; B++) {
      const a = B / 6, H = (a - 0.5) * Y;
      o.push(G(H, 0.074 + 0.01 * Math.cos((a - 0.5) * S) - 0.022 * Math.pow(Math.abs(a - 0.5) * 2, 3), 0));
    }
    L.tube(f("metal"), u, o, 0.017, { radial: 6 }), L.pop();
  }
  function aM(L, V, e, R, y = {}) {
    const Y = y.len ?? 0.62, u = y.r ?? 0.11, o = !!y.vert, B = y.color ?? r.fender;
    L.push(V, e, R, 0, 0, o ? c : 0), L.lathe(f("gloss"), B, [[0, -Y / 2 - 0.03], [u * 0.5, -Y / 2 - 0.02], [u * 0.9, -Y / 2 + u * 0.4], [u, -Y / 2 + u], [u, Y / 2 - u], [u * 0.9, Y / 2 - u * 0.4], [u * 0.5, Y / 2 + 0.02], [0, Y / 2 + 0.03]], 0, 0, 0, { seg: 8, rz: c });
    for (const l of [-1, 1]) L.tor(f("gloss"), I(B, 1.25), 0.02, 8e-3, l * (Y / 2 + 0.05), 0, 0, { rs: 3, ts: 7, ry: c });
    L.pop();
    const a = y.tie ?? [V, 0, -0.16], H = o ? [[V, e + Y / 2 + 0.06, R]] : [[V - Y / 2 - 0.06, e, R], [V + Y / 2 + 0.06, e, R]], m = [a[0], e + (o ? Y / 2 + 0.2 : 0.2), R - 0.02];
    for (const l of H) L.tube(f("paint"), y.rope ?? r.ropeBlue, [G(l[0], l[1], l[2]), G((l[0] * 2 + m[0]) / 3, (l[1] + m[1]) / 2 + 0.01, R), G(m[0], m[1], m[2])], 0.01, { radial: 4 });
    L.tube(f("paint"), y.rope ?? r.ropeBlue, [G(m[0], m[1], m[2]), G(a[0], -0.12, 0.125), G(a[0], 0.03, 0.07), G(a[0], 0.035, -0.02), G(a[0], 0.012, a[2])], 0.011, { radial: 4 }), L.sph(f("paint"), y.rope ?? r.ropeBlue, 0.02, m[0], m[1], m[2], { ws: 6, hs: 4 }), L.tor(f("metal"), r.stainless, 0.028, 8e-3, a[0], 0.012, a[2], { rs: 3, ts: 8, rx: c }), L.cyl(f("metal"), r.stainless, 0.035, 8e-3, a[0], 4e-3, a[2], { seg: 8 });
  }
  function QA(L, V, e = {}) {
    const u = e.hoop ?? 0.78, o = r.stainless;
    L.push(V, 0, 0);
    for (const B of [-1, 1]) {
      const a = B * 0.46 / 2, H = [G(a, -2.25, 0.1), G(a, -0.08, 0.1)];
      for (let m = 1; m <= 3; m++) {
        const l = m / 3 * c;
        H.push(G(a, -0.08 + Math.sin(l) * 0.1, 0.1 - 0.1 + Math.cos(l) * 0.1));
      }
      H.push(G(a, u - 0.18, -0.02));
      for (let m = 1; m <= 5; m++) {
        const l = m / 5 * S;
        H.push(G(a, u - 0.18 + Math.sin(l) * 0.18, -0.02 - (1 - Math.cos(l)) * 0.17));
      }
      H.push(G(a, 0.05, -0.36), G(a, 0, -0.36)), L.tube("metal", o, H, 0.021, { radial: 6 }), L.cyl("metal", r.galvDk, 0.042, 0.018, a, 9e-3, -0.36, { seg: 8 });
      for (const m of [-0.45, -1.2]) UA(L, "metal", r.galvDk, 0.04, 0.05, 0.1, a, m, 0.1 / 2);
    }
    for (let B = -1.95; B < -0.2; B += 0.3) UA(L, "metal", o, 0.46, 0.028, 0.07, 0, B, 0.1 + 0.01);
    L.pop();
  }
  j.pieredge = { desc: "Pier / quay edge dressing along +X (slab face at z = 0, water on +Z, deck top y = 0): tarred timber fender piles with mussel line + rope wraps, weathered timber whaler with bolts, optional cleats, black cylinder fenders, a rubber D-fender strip, swim ladders. outer: piles rise above deck with galvanised caps (arena perimeter only).", params: { length: "m (8)", outer: "bool tall piles", spacing: "pile spacing m (3.4)", s0: "first pile offset (0.3)", s1: "last pile offset (0.3)", skip: "[[s0,s1]] no piles/whaler", cleats: "[s] cleat positions", fenders: "[s] hung fenders", ladders: "[s] swim ladders", dfender: "rubber strip", ext0: "whaler extension at start (0)", ext1: "at end (0)" }, variants: 1, mount: "wall", build(L, V) {
    L.aoBase = null;
    const e = V.length ?? 8, R = !!V.outer, y = V.spacing ?? (R ? 4.4 : 4.6), Y = V.s0 ?? 0.3, u = V.s1 ?? 0.3, o = V.skip || [], B = (AA, jA = AA) => o.some(([gA, LA]) => jA > gA && AA < LA), a = R ? 0.17 : 0.155, H = 0.1 + a * 0.92, m = R ? 0.82 + L.r(-0.04, 0.05) : -0.06, l = e - Y - u, _ = Math.max(1, Math.round(l / y) + 1), OA = [];
    for (let AA = 0; AA < _; AA++) {
      const jA = _ === 1 ? Y + l / 2 : Y + l * AA / (_ - 1);
      if (B(jA - a, jA + a)) continue;
      OA.push(jA);
      const gA = R ? m + L.r(-0.05, 0.05) : m;
      QM(L, jA, H, gA, a, { wrap: V.wraps === false ? 0 : (R ? AA % 5 === 1 : AA % 5 === 2) ? 2 : 0, wrapY: R ? 0.16 : -0.64, cap: R });
    }
    const yA = V.ext0 ?? 0, EA = V.ext1 ?? 0, CA = [];
    let iA = -yA;
    const F = [...o].sort((AA, jA) => AA[0] - jA[0]);
    for (const [AA, jA] of F) AA > iA && CA.push([iA, Math.min(AA, e + EA)]), iA = Math.max(iA, jA);
    iA < e + EA && CA.push([iA, e + EA]);
    for (const [AA, jA] of CA) {
      const gA = jA - AA, LA = Math.max(1, Math.round(gA / 4.2));
      for (let kA = 0; kA < LA; kA++) {
        const SA = AA + gA * kA / LA, hA = AA + gA * (kA + 1) / LA, sA = hA - SA - (kA < LA - 1 ? 0.012 : 0);
        L.box(f("wood"), D(r.whaler, r.whalerDk, L.r(0, 0.6)), sA, 0.28, 0.1, SA + sA / 2, -0.2, 0.05, { r: 0.018 });
      }
    }
    if (V.dfender) {
      const AA = [-(V.ext0 ?? 0), ...OA.flatMap((jA) => [jA - a - 0.05, jA + a + 0.05]), e + (V.ext1 ?? 0)];
      for (let jA = 0; jA + 1 < AA.length; jA += 2) {
        const gA = AA[jA] + 0.04, LA = AA[jA + 1] - 0.04;
        LA - gA < 0.3 || B(gA, LA) || L.box(f("rubber"), r.fender, LA - gA, 0.15, 0.075, (gA + LA) / 2, -0.19, 0.137, { r: 0.032 });
      }
    }
    const J = (AA, jA) => {
      const gA = jA + a + 0.05;
      if (!OA.some((sA) => Math.abs(AA - sA) < gA)) return AA;
      const kA = [-(V.ext0 ?? 0) + 0.05, ...OA, e + (V.ext1 ?? 0) - 0.05];
      let SA = AA, hA = 1 / 0;
      for (let sA = 0; sA + 1 < kA.length; sA++) {
        const rA = kA[sA] + (sA === 0 ? jA : gA), mA = kA[sA + 1] - (sA + 1 === kA.length - 1 ? jA : gA);
        if (mA < rA) continue;
        const JA = Math.max(rA, Math.min(mA, AA));
        Math.abs(JA - AA) < hA && (hA = Math.abs(JA - AA), SA = JA);
      }
      return SA;
    };
    for (const AA of V.cleats || []) mM(L, AA, 0, -0.14, 0, 0.3);
    for (const AA of V.fenders || []) aM(L, J(AA, 0.4), -0.66, 0.16, {});
    for (const AA of V.ladders || []) QA(L, J(AA, 0.28), { hoop: V.hoop });
  } };
  function IA(L, V, e, R, y, Y) {
    L.push(V, e, R, 0, 0, y * -0.25), L.box("gloss", Y, 0.038, 0.15, 0.055, 0, 0.02, 0, { r: 0.016 }), L.box("rubber", "charcoal", 0.03, 0.05, 0.05, 0, 0.11, 0, { r: 0.01 }), L.tube("metal", r.stainless, [G(0, -0.06, 0), G(y * 0.035, -0.1, 0), G(y * 0.055, -0.16, 0)], 0.012, { radial: 6 }), L.tube("metal", r.galvDk, [G(-y * 0.02, 0.07, 0), G(-y * 0.055, 0.02, 0), G(-y * 0.04, -0.06, 0)], 6e-3, { radial: 4 }), L.pop();
  }
  j.fuelpump = { desc: "Marina fuel dispenser (0.8 × 0.8 × 1.25, collider): spill tray, blue cabinet with doors + louvres, white head with LED price displays on both faces, DIESEL (+X) and UNLEADED (-X) nozzles in boots with looping hoses, FUEL letters, NO SMOKING + flammable labels, e-stop.", params: { price: "diesel price text (1.89)", price2: "unleaded price (2.14)" }, variants: 1, mount: "ground", build(L, V) {
    const e = r.fuelBlue, R = r.white;
    L.box("metal", r.galvDk, 0.8, 0.05, 0.8, 0, 0.025, 0, { r: 0.015 });
    for (const y of [-1, 1]) UA(L, "metal", r.galv, 0.8, 0.035, 0.02, 0, 0.065, y * 0.39), UA(L, "metal", r.galv, 0.02, 0.035, 0.76, y * 0.39, 0.065, 0);
    L.box("paint", r.concreteDk, 0.66, 0.06, 0.54, 0, 0.08, 0, { r: 0.02 }), L.box("gloss", e, 0.6, 0.64, 0.46, 0, 0.43, 0, { round: true, r: 0.03 });
    for (const y of [-1, 1]) {
      L.push(0, 0, y * 0.232, y > 0 ? 0 : S), L.box("gloss", I(e, 1.08), 0.5, 0.5, 0.012, 0, 0.42, 0, { r: 8e-3 });
      for (let Y = 0; Y < 5; Y++) UA(L, "paint", I(e, 0.62), 0.3, 0.012, 0.012, -0.06, 0.24 + Y * 0.03, 8e-3);
      L.cyl("metal", r.stainless, 0.014, 0.012, 0.19, 0.5, 0.01, { rx: c, seg: 8 }), bA(L, "FUEL", { h: 0.085, x: 0, y: 0.52, z: 8e-3, c: R, flat: true, wt: 0.22 }), L.decal("dia0", 0.07, 0.07, 0.19, 0.3, 8e-3), L.pop();
    }
    L.box("paint", R, 0.62, 0.1, 0.48, 0, 0.8, 0, { r: 0.02 }), L.box("gloss", R, 0.66, 0.38, 0.52, 0, 1.04, 0, { round: true, r: 0.04 }), L.box("gloss", e, 0.7, 0.035, 0.56, 0, 1.232, 0, { r: 0.016 });
    for (const y of [-1, 1]) {
      L.push(0, 0, y * 0.26, y > 0 ? 0 : S), L.box("gloss", r.glass, 0.52, 0.24, 0.012, 0, 1.06, 2e-3, { r: 0.01 }), L.box("paint", I(r.glass, 0.5), 0.46, 0.2, 4e-3, 0, 1.06, 9e-3), MM(L, V.price ?? "1.89", -0.2, 1.09, 0.0115, 0.07, r.led), MM(L, "42.60", -0.2, 0.99, 0.0115, 0.045, r.fuelYel, 1.8), UA(L, "glow", r.ledG, 0.014, 0.014, 4e-3, 0.19, 1.14, 0.012, { glow: 2 });
      for (let Y = 0; Y < 3; Y++) UA(L, "gloss", ["#4f9a57", r.fuelYel, r.white][Y], 0.045, 0.022, 0.012, -0.09 + Y * 0.06, 0.9, 4e-3);
      UA(L, "paint", "ink", 0.07, 0.012, 0.01, 0.17, 0.9, 4e-3), bA(L, y > 0 ? "DIESEL" : "UNLEADED", { h: 0.036, x: 0, y: 0.782, z: -0.018, c: y > 0 ? "#a07a1e" : "#3f7a4a", flat: true, wt: 0.22 }), L.pop();
    }
    for (const y of [-1, 1]) {
      const Y = y > 0 ? r.fuelYel : "#4f9a57";
      L.box("rubber", "charcoal", 0.05, 0.14, 0.1, y * 0.355, 0.95, -0.06, { r: 0.018 }), IA(L, y * 0.36, 1.02, -0.06, y, Y), L.cyl("metal", r.galvDk, 0.03, 0.04, y * 0.3, 1.2, 0.12, { rz: c, seg: 8 });
      const u = [G(y * 0.33, 1.2, 0.12), G(y * 0.37, 1.17, 0.14), G(y * 0.395, 1, 0.15), G(y * 0.4, 0.62, 0.12), G(y * 0.395, 0.4, 0.06), G(y * 0.39, 0.36, -0.02), G(y * 0.392, 0.45, -0.07), G(y * 0.39, 0.72, -0.09), G(y * 0.37, 0.93, -0.07), G(y * 0.36, 1.07, -0.06)];
      L.tube("rubber", "#1f2126", u, 0.017, { radial: 6 }), L.cyl("metal", r.stainless, 0.024, 0.05, y * 0.4, 0.66, 0.12, { seg: 8 }), L.decal("lb4", 0.16, 0.04, y * 0.301, 0.2, 0, { ry: y * c });
    }
    L.cyl("metal", r.galv, 0.03, 0.02, 0.24, 1.26, 0.18, { seg: 10 }), L.sph("gloss", r.red, 0.028, 0.24, 1.272, 0.18, { ws: 10, hs: 5, half: true }), L.col(-0.4, 0, -0.4, 0.4, 1.25, 0.4);
  } }, j.dockbox = { desc: "White fibreglass dock box: moulded tapered body on skids, domed lid with overhanging lip, stainless piano hinge + gas struts, hasp and brass padlock, recessed end handles, moulded nameplate, a coiled line on the lid. Local 1.8 (x) × 1.2 (z) × 1.0; front +Z.", params: {}, variants: 1, mount: "ground", build(L, V) {
    const Y = D(r.white, "offwhite", 0.4);
    for (const o of [-1, 1]) L.box("rubber", "charcoal", 1.8 - 0.16, 0.05, 0.1, 0, 0.025, o * (1.2 / 2 - 0.12), { r: 0.018 });
    const u = [[-1.2 / 2 + 0.07, 0.05], [1.2 / 2 - 0.07, 0.05], [1.2 / 2 - 0.02, 0.84], [-1.2 / 2 + 0.02, 0.84]];
    L.add("gloss", TA("dbx", () => z(u, 1.8 - 0.06, 0.03)), Y, 0, 0, 0), L.box("gloss", I(Y, 0.93), 1.8 - 0.02, 0.05, 1.2 - 0.02, 0, 0.83, 0, { r: 0.02 }), L.box("gloss", Y, 1.8 + 0.04, 0.1, 1.2 + 0.04, 0, 0.9, 0, { round: true, r: 0.045 }), L.box("gloss", Y, 1.8 - 0.2, 0.06, 1.2 - 0.24, 0, 0.965, 0, { round: true, r: 0.03 });
    for (let o = 0; o < 3; o++) UA(L, "paint", I(Y, 0.9), 1.8 - 0.5, 8e-3, 0.03, 0, 0.999, -0.3 + o * 0.3);
    L.cyl("metal", r.stainless, 0.012, 1.8 - 0.3, 0, 0.86, -1.2 / 2 - 0.02, { rz: c, seg: 6 });
    for (const o of [-1, 1]) L.tube("metal", r.stainless, [G(o * 0.6, 0.62, -1.2 / 2 + 5e-3), G(o * 0.6, 0.82, -1.2 / 2 - 5e-3)], 9e-3, { radial: 5 });
    L.box("metal", r.stainless, 0.06, 0.12, 0.012, 0, 0.8, 1.2 / 2 - 0.01, { r: 4e-3 }), L.box("metal", "#c9a24b", 0.045, 0.05, 0.022, 0, 0.72, 1.2 / 2 + 0.012, { r: 8e-3 }), L.tor("metal", r.stainless, 0.016, 4e-3, 0, 0.755, 1.2 / 2 + 0.012, { rs: 3, ts: 8 });
    for (const o of [-1, 1]) L.box("paint", I(Y, 0.78), 0.012, 0.06, 0.26, o * (1.8 / 2 - 0.022), 0.66, 0, { r: 6e-3 }), UA(L, "metal", r.stainless, 0.012, 0.018, 0.2, o * (1.8 / 2 - 0.012), 0.69, 0);
    L.box("paint", r.club, 0.46, 0.12, 0.01, -0.45, 0.62, 1.2 / 2 - 0.022, { r: 0.012 }), bA(L, "LIFEJACKETS", { h: 0.036, x: -0.45, y: 0.6, z: 1.2 / 2 - 0.012, c: r.white, flat: true, wt: 0.2 }), L.decal("lb13", 0.22, 0.055, 0.45, 0.62, 1.2 / 2 - 0.02);
    for (let o = 0; o < 4; o++) L.tor("paint", r.rope, 0.16 - o * 0.012, 0.014, 0.35, 1.012 + o * 0.012, -0.1, { rx: c, rs: 4, ts: 16 });
    L.tube("paint", r.rope, [G(0.5, 1.02, -0.12), G(0.62, 1.01, -0.05), G(0.8, 0.98, 0.1), G(0.9, 0.93, 0.2), G(0.93, 0.8, 0.26)], 0.014, { radial: 4 }), L.col(-1.8 / 2, 0, -1.2 / 2, 1.8 / 2, 1, 1.2 / 2);
  } }, j.pumpout = { desc: "Marina service station (collider 1.6 × 2.2 × 1.8 local, front +Z; back 1.25 solid, open front 0.55 behind the barrier = rail): timber-clad shelter with a mono-pitch roof and PUMP OUT fascia letters, yellow vacuum pump-out unit with gauge and buttons, suction hose on a reel, blue potable-water standpipe with brass taps and a coiled hose, notice + lamp.", params: {}, variants: 1, mount: "ground", build(L, V) {
    const y = D(r.cladding, r.white, 0.25), Y = r.white, u = "#d8b04f";
    L.box("paint", r.concrete, 1.6, 0.1, 1.8, 0, 0.05, 0, { round: true, r: 0.03 });
    for (let o = 0; o < 12; o++) UA(L, "wood", D(y, r.white, o % 2 * 0.12), 1.6 - 0.06, 0.155, 0.05, 0, 0.19 + o * 0.16, -1.8 / 2 + 0.05);
    for (const o of [-1, 1]) {
      for (let B = 0; B < 12; B++) UA(L, "wood", D(y, r.white, B % 2 * 0.12), 0.05, 0.155, 1.8 * 0.5, o * (1.6 / 2 - 0.03), 0.19 + B * 0.16, -1.8 * 0.25);
      L.box("paint", Y, 0.09, 2.02, 0.09, o * (1.6 / 2 - 0.04), 1.11, 0.02, { r: 0.02 }), L.box("paint", Y, 0.09, 2.02, 0.09, o * (1.6 / 2 - 0.04), 1.11, -1.8 / 2 + 0.04, { r: 0.02 });
    }
    L.push(0, 2.12, 0, 0, 0.06), L.box("paint", r.frameDk, 1.6 + 0.12, 0.07, 1.8 + 0.12, 0, 0, 0, { r: 0.02 }), L.pop(), L.box("paint", r.fuelBlue, 1.6 + 0.1, 0.2, 0.05, 0, 2.02, 1.8 / 2 + 0.03, { r: 0.015 }), bA(L, "PUMP OUT", { h: 0.1, x: 0, y: 1.97, z: 1.8 / 2 + 0.055, c: r.white, dep: 0.1, wt: 0.2 }), L.cyl("paint", "charcoal", 0.07, 0.03, 0, 1.94, 0.3, { seg: 10 }), L.sph("glow", r.lamp, 0.05, 0, 1.92, 0.3, { ws: 8, hs: 4, half: false, glow: 1.3 }), L.push(-0.33, 0.1, -0.35), L.box("gloss", u, 0.7, 1, 0.62, 0, 0.5, 0, { round: true, r: 0.04 }), L.box("metal", r.stainless, 0.5, 0.32, 0.012, 0, 0.72, 0.312, { r: 8e-3 }), L.cyl("metal", r.stainless, 0.07, 0.03, -0.12, 0.76, 0.32, { rx: c, seg: 14 }), L.cyl("paint", r.white, 0.058, 4e-3, -0.12, 0.76, 0.336, { rx: c, seg: 14 }), UA(L, "paint", "ink", 4e-3, 0.05, 2e-3, -0.1, 0.77, 0.339, { rz: -0.7 }), L.cyl("gloss", "#4f9a57", 0.03, 0.03, 0.08, 0.8, 0.325, { rx: c, seg: 10 }), L.cyl("gloss", r.red, 0.03, 0.03, 0.17, 0.8, 0.325, { rx: c, seg: 10 });
    for (let o = 0; o < 4; o++) UA(L, "paint", I(u, 0.7), 0.44, 0.014, 0.012, 0, 0.18 + o * 0.05, 0.312);
    bA(L, "PUMP OUT", { h: 0.045, x: 0, y: 0.47, z: 0.314, c: r.club, flat: true, wt: 0.22 }), L.push(0.36, 0.62, 0), L.cyl("metal", r.galvDk, 0.3, 0.02, 0, 0, -0.2, { rz: c, seg: 18 }), L.cyl("metal", r.galvDk, 0.3, 0.02, 0.26, 0, -0.2, { rz: c, seg: 18 });
    for (let o = 0; o < 4; o++) L.tor("rubber", "#1f2126", 0.2 + o % 2 * 0.04, 0.032, 0.05 + o * 0.055, 0, -0.2, { ry: c, rs: 5, ts: 12 });
    L.pop(), L.tube("rubber", "#1f2126", [G(0.5, 0.42, -0.2), G(0.55, 0.2, 0.05), G(0.5, 0.12, 0.3), G(0.3, 0.14, 0.45), G(0.2, 0.35, 0.42), G(0.18, 0.55, 0.36)], 0.032, { radial: 7 }), L.box("metal", r.stainless, 0.08, 0.18, 0.08, 0.18, 0.62, 0.36, { r: 0.015 }), L.pop(), L.push(0.5, 0.1, -0.25), L.box("gloss", "#3f6fb0", 0.14, 1.3, 0.14, 0, 0.65, 0, { r: 0.03 }), L.box("gloss", I("#3f6fb0", 1.2), 0.18, 0.06, 0.18, 0, 1.33, 0, { r: 0.02 });
    for (const o of [0.62, 0.95]) L.cyl("metal", "#c9a24b", 0.022, 0.12, 0, o, 0.12, { rx: c, seg: 8 }), L.cyl("metal", "#c9a24b", 0.012, 0.08, 0, o - 0.04, 0.17, { seg: 6 }), L.tor("metal", "#c9a24b", 0.03, 8e-3, 0, o + 0.04, 0.12, { rx: c, rs: 3, ts: 10 });
    L.decal("lb1", 0.2, 0.05, 0, 1.16, 0.072);
    for (let o = 0; o < 3; o++) L.tor("rubber", "#5a8fc9", 0.17 - o % 2 * 0.012, 0.017, 0, 0.34 + o * 0.02, 0.2, { rx: c * 0.25, rs: 4, ts: 12 });
    L.box("metal", r.galvDk, 0.05, 0.05, 0.14, 0, 0.44, 0.1, { r: 0.012 }), L.pop();
    for (const o of [-1.6 / 2 + 0.05, -0.05, 1.6 / 2 - 0.05]) L.box("metal", r.fuelYel, 0.07, 1.05, 0.07, o, 0.62, 1.8 / 2 - 0.05, { r: 0.02 });
    for (const o of [0.62, 1.1]) L.cyl("metal", r.fuelYel, 0.022, 1.6 / 2 - 0.1, -1.6 / 4 - 0.02, o, 1.8 / 2 - 0.05, { rz: c, seg: 6 });
    L.tube("metal", r.galvDk, P(0.37, 1.02, 1.8 / 2 - 0.05, 0.37, S, q, 8).map((o, B, a) => G(o[0], 1.02 - Math.sin(B / (a.length - 1) * S) * 0.12, o[2])), 0.01, { radial: 3 }), L.decal("lb6", 0.3, 0.075, -0.4, 0.86, 1.8 / 2 - 0.01), L.box("paint", r.white, 0.36, 0.5, 0.01, 0.25, 1.55, -1.8 / 2 + 0.08, { r: 0.01 }), L.decal("pst9", 0.32, 0.46, 0.25, 1.55, -1.8 / 2 + 0.086), L.col(-1.6 / 2, 0, -1.8 / 2, 1.6 / 2, 2.2, 0.35), L.col(-1.6 / 2, 0, 0.35, 1.6 / 2, 2.2, 1.8 / 2, { rail: true });
  } };
  function HA(L, V, e) {
    return TA(["beam", L, V, e % 6].map(Z).join("|"), () => {
      const R = T(L, V, V, 0.018), y = R.attributes.color, Y = R.attributes.normal, u = R.attributes.position, o = W(e * 1.9), B = PA(o < 0.35 ? D("#8a8478", "#a39c8f", W(e)) : D(r.pile, "#b58a5a", W(e) * 0.9)), a = PA(o < 0.35 ? "#b5ab98" : r.endgrain), H = PA(r.antifoul);
      for (let m = 0; m < y.count; m++) {
        let l = Math.abs(Y.getX(m)) > 0.7 ? a : B;
        Y.getY(m) > 0.7 && W(e * 3.7) > 0.55 && Math.abs(u.getX(m)) < L * 0.3 && (l = MA(l, H, 0.55));
        const _ = 0.9 + 0.12 * W(m * 0.37 + e);
        y.setXYZ(m, l[0] * _, l[1] * _, l[2] * _);
      }
      return R;
    });
  }
  j.keelblocks = { desc: "Boatyard keel-block crib (1.8 × 2.0 × 1.2, collider): six crossed layers of 200 mm timbers with end grain and antifouling smudges, carpeted top block with hardwood wedges, a steel boat stand leaning against it.", params: {}, variants: 1, mount: "ground", build(L, V) {
    for (let y = 0; y < 6; y++) {
      const Y = y % 2 === 0, u = 0.2 / 2 + y * 0.2;
      for (let o = 0; o < 4; o++) {
        const B = -0.72 + o * 0.48 + L.r(-0.03, 0.03), a = y * 7 + o, H = [0, 0.04, 0.08][a * 5 % 3];
        Y ? L.add("wood", HA(2 - H, 0.2 - 4e-3, a), "white", B * (1.8 / 2), u, L.r(-0.02, 0.02), { ry: c + L.r(-0.02, 0.02), ao: false }) : L.add("wood", HA(1.8 - H, 0.2 - 4e-3, a), "white", L.r(-0.02, 0.02), u, B, { ry: L.r(-0.02, 0.02), ao: false });
      }
    }
    L.box("paint", "#5d6a78", 0.5, 0.02, 1.6, 0, 6 * 0.2 + 0.01, 0, { r: 6e-3 });
    for (const y of [-0.45, 0.45]) L.push(0.1, 6 * 0.2 + 0.02, y, 0.1), L.add("wood", TA("wedge", () => z([[-0.18, 0], [0.18, 0], [0.18, 0.02], [-0.18, 0.09]], 0.14, 8e-3)), "#b08556", 0, 0, 0, { ry: c }), L.pop();
    L.push(1.02, 0, 0.3, 0, 0, 0.22), L.tube("metal", r.liftBlue, [G(0, 0.02, -0.25), G(0, 1.05, 0)], 0.028, { radial: 6 }), L.tube("metal", r.liftBlue, [G(0, 0.02, 0.25), G(0, 1.05, 0)], 0.028, { radial: 6 }), L.cyl("metal", r.galv, 0.022, 0.4, 0, 1.2, 0, { seg: 8 }), L.box("rubber", "charcoal", 0.16, 0.04, 0.16, 0, 1.41, 0, { r: 0.015 }), L.pop(), L.col(-0.9, 0, -1, 0.9, 1.2, 1);
  } };
  function FA(L, V, e, R, y, Y, u, o, B) {
    L.push(V, e, R, o);
    const a = I("woodlight", B), H = I("wooddark", B * 0.95);
    L.box("wood", a, y - 0.03, Y - 0.02, u - 0.03, 0, Y / 2, 0, { r: 0.015 });
    for (let m = 1; m < 5; m++) {
      const l = m * Y / 5;
      UA(L, "wood", I(a, 0.72), y - 0.05, 8e-3, u - 0.02, 0, l, 0), UA(L, "wood", I(a, 0.72), y - 0.02, 8e-3, u - 0.05, 0, l, 0);
    }
    for (const m of [0.05, Y - 0.05]) UA(L, "wood", H, y, 0.09, 0.05, 0, m, u / 2 - 0.025), UA(L, "wood", H, y, 0.09, 0.05, 0, m, -u / 2 + 0.025), UA(L, "wood", H, 0.05, 0.09, u - 0.1, y / 2 - 0.025, m, 0), UA(L, "wood", H, 0.05, 0.09, u - 0.1, -y / 2 + 0.025, m, 0);
    for (const m of [-1, 1]) for (const l of [-1, 1]) UA(L, "wood", H, 0.07, Y - 0.16, 0.07, m * (y / 2 - 0.035), Y / 2, l * (u / 2 - 0.035));
    for (const m of [-1, 1]) L.push(0, Y / 2, m * (u / 2 - 5e-3), 0, 0, Math.atan2(Y - 0.2, y - 0.2) * m), UA(L, "wood", H, Math.hypot(y - 0.2, Y - 0.2), 0.08, 0.03, 0, 0, 0), L.pop();
    L.box("wood", I(a, 1.04), y - 0.06, 0.03, u - 0.06, 0, Y + 5e-3, 0, { r: 0.01 }), L.pop();
  }
  j.quaycrates = { desc: "Quay cargo stack (2.2 × 1.6 × 1.2, collider): two braced timber export crates on pallets with painted HALYARD MARINA stencils and arrows, a blue tarp half drawn over one with rope lashings, a strapped fender bundle on top.", params: {}, variants: 2, mount: "ground", build(L, V) {
    const e = (V.variant ?? 0) % 2;
    for (const y of [-1, 1]) {
      L.push(y * 0.55, 0, 0);
      for (const Y of [-0.62, 0, 0.62]) UA(L, "wood", I("wooddark", 0.92), 1, 0.1, 0.1, 0, 0.05, Y);
      for (let Y = 0; Y < 6; Y++) UA(L, "wood", I("woodlight", 0.88 + Y % 3 * 0.05), 0.14, 0.022, 1.46, -0.43 + Y * 0.172, 0.111, 0);
      L.pop();
    }
    FA(L, -0.55, 0.122, 0, 1.02, 1.07, 1.5, L.r(-0.02, 0.02), 1), FA(L, 0.56, 0.122, 0.02, 1.02, 1, 1.46, L.r(-0.03, 0.03), 0.93);
    for (const [y, Y, u, o] of [[-0.55, 1.07, 1, 0.737], [0.56, 1, -1, -0.697]]) L.push(y, 0.122, o, u > 0 ? 0 : S), bA(L, "HALYARD", { h: 0.1, x: 0, y: Y * 0.62, z: 4e-3, c: "#3a3f4a", flat: true, wt: 0.2 }), L.pop();
    L.push(0.56, 0.122, 0.02, 0);
    const R = TA("tarp|" + e, () => {
      const y = new h(), Y = 9, u = 11, o = 1.14, B = 1.58, a = 1, H = PA(r.tarp), m = PA(r.tarpDk), l = [];
      for (let OA = 0; OA <= u; OA++) {
        const yA = [];
        for (let EA = 0; EA <= Y; EA++) {
          const CA = EA / Y, iA = OA / u;
          let F = (CA - 0.5) * o, J = (iA - 0.5) * B, AA = a + 0.012 + 0.02 * Math.sin(CA * 9 + iA * 3);
          if (CA > 0.78) {
            const gA = (CA - 0.78) / 0.22;
            F = o / 2 + 0.012 + 0.03 * Math.sin(iA * 11) * gA, AA = a - gA * 0.75 + 0.05 * Math.sin(iA * 14);
          }
          if (iA > 0.86 && CA <= 0.78) {
            const gA = (iA - 0.86) / 0.14;
            J = B / 2 + 0.012, AA = a - gA * 0.35 - 0.04 * Math.sin(CA * 13);
          }
          const jA = MA(H, m, 0.5 + 0.5 * Math.sin(CA * 12 + iA * 7));
          yA.push(y.v(F, AA, J, CA > 0.78 ? 1 : 0, CA > 0.78 ? 0 : 1, iA > 0.86 ? 0.8 : 0, jA[0], jA[1], jA[2]));
        }
        l.push(yA);
      }
      for (let OA = 0; OA < u; OA++) for (let yA = 0; yA < Y; yA++) y.quad(l[OA][yA], l[OA][yA + 1], l[OA + 1][yA + 1], l[OA + 1][yA]);
      const _ = y.geo();
      return _.computeVertexNormals(), _;
    });
    L.add("foliage", R, "white", 0, 0, 0, {});
    for (const y of [-0.4, 0.35]) L.tube("paint", r.rope, [G(-0.55, 0.3, y), G(-0.54, 1.02, y), G(0, 1.035, y + 0.02), G(0.53, 1.02, y), G(0.54, 0.35, y)], 0.012, { radial: 4 });
    for (const y of [-0.62, -0.2, 0.2, 0.62]) L.tor("metal", r.galv, 0.016, 5e-3, 0.535, 0.3, y, { rs: 3, ts: 8, ry: c });
    if (L.pop(), e === 0) {
      for (let y = 0; y < 3; y++) L.lathe("gloss", y === 1 ? r.white : r.fender, [[0, -0.28], [0.07, -0.26], [0.1, -0.2], [0.1, 0.2], [0.07, 0.26], [0, 0.28]], -0.55, 1.29, -0.28 + y * 0.22, { seg: 10, rz: c, ry: 0.08 });
      L.box("paint", r.fuelRed, 0.05, 0.012, 0.7, -0.3, 1.39, 0, { r: 4e-3 });
    } else for (let y = 0; y < 7; y++) L.sph("gloss", y % 2 ? r.fuelRed : r.white, 0.08, -0.72 + y % 4 * 0.13, 1.28 + Math.floor(y / 4) * 0.1, -0.2 + y % 3 * 0.14, { ws: 7, hs: 5 });
    L.col(-1.1, 0, -0.8, 1.1, 1.2, 0.8);
  } };
  function DM(L, V, e) {
    return TA(["val", L, V, e].map(Z).join("|"), () => {
      const R = new h(), y = Math.max(2, Math.round(L / 0.2)), Y = L / y, u = PA(V), o = PA(e);
      for (let B = 0; B < y; B++) {
        const a = B % 2 ? o : u, H = -L / 2 + B * Y, m = H + Y, l = [R.v(H, 0, 0, 0, 0, 1, ...a), R.v(m, 0, 0, 0, 0, 1, ...a), R.v(m, -0.13, 0, 0, 0, 1, ...a), R.v(H, -0.13, 0, 0, 0, 1, ...a)];
        R.quad(l[0], l[1], l[2], l[3]);
        const _ = R.v((H + m) / 2, -0.13, 0, 0, 0, 1, ...a), OA = [];
        for (let yA = 0; yA <= 5; yA++) {
          const EA = S + yA / 5 * S;
          OA.push(R.v((H + m) / 2 - Math.cos(EA) * Y / 2, -0.13 + Math.sin(EA) * Y * 0.4, 0, 0, 0, 1, ...a));
        }
        for (let yA = 0; yA < 5; yA++) R.tri(_, OA[yA], OA[yA + 1]);
      }
      return R.geo();
    });
  }
  function RA(L, V, e, R, y = r.fuelBlue, Y = r.white) {
    L.box("gloss", D(y, r.white, 0.1), R + 0.06, 0.13, 0.12, V, e, 0.06, { round: true, r: 0.04 });
    for (const u of [-1, 1]) L.box("metal", r.galvDk, 0.03, 0.18, 0.05, V + u * (R / 2 + 0.05), e - 0.02, 0.025, { r: 0.01 });
    L.add("foliage", DM(R, y, Y), "white", V, e - 0.055, 0.125, {}), L.cyl("metal", r.galv, 0.012, R, V, e - 0.06, 0.1, { rz: c, seg: 6 });
  }
  function EM(L, V, e, R, y, Y = {}) {
    const u = Y.frame ?? r.frame, o = Y.glass ?? r.glass, B = Y.t ?? 0.07, a = Y.dz ?? 0.06, H = Y.ns ? f("paint") : "paint";
    UA(L, f("gloss"), o, R, y, 0.02, V, e + y / 2, 0.012), UA(L, H, u, R + B * 2, B, a, V, e + y + B / 2, a / 2), UA(L, H, u, R + B * 2, B * 0.8, a, V, e - B * 0.4, a / 2);
    for (const l of [-1, 1]) UA(L, H, u, B, y, a, V + l * (R / 2 + B / 2), e + y / 2, a / 2);
    const m = Y.mull ?? (R > 1.1 ? Math.round(R / 0.8) - 1 : 0);
    for (let l = 1; l <= m; l++) UA(L, f("paint"), u, 0.04, y, 0.035, V - R / 2 + l * R / (m + 1), e + y / 2, 0.035);
    if (Y.transom && UA(L, f("paint"), u, R, 0.04, 0.035, V, e + y * Y.transom, 0.035), Y.sill !== false && L.box(H, Y.sillC ?? D(u, r.concreteDk, 0.35), R + B * 2 + 0.08, 0.05, a + 0.05, V, e - B * 0.8 - 0.025, (a + 0.05) / 2, { r: 0.012 }), Y.blind && UA(L, f(Y.lit ? "glow" : "paint"), Y.lit ? "#ffdca0" : Y.blind, R - 0.02, y * 0.34, 6e-3, V, e + y * 0.83, 0.024, Y.lit ? { glow: Y.lit } : {}), Y.shutters) for (const l of [-1, 1]) {
      const _ = R / 2 + 0.02, OA = V + l * (R / 2 + B + _ / 2 + 0.02);
      UA(L, H, Y.shutters, _, y + 0.04, 0.035, OA, e + y / 2, 0.02);
      for (let yA = 1; yA < 4; yA++) UA(L, f("paint"), I(Y.shutters, 0.8), _ - 0.06, 0.014, 0.01, OA, e + yA * y / 4, 0.04);
    }
  }
  function OM(L, V, e, R, y = {}) {
    const Y = y.frame ?? r.frameDk, u = y.leaf ?? r.frameDk, o = y.glass ?? r.glass, B = !!y.double;
    for (const m of [-1, 1]) UA(L, "paint", Y, 0.08, R + 0.08, 0.07, V + m * (e / 2 + 0.04), (R + 0.08) / 2, 0.035);
    UA(L, "paint", Y, e + 0.16, 0.08, 0.07, V, R + 0.04, 0.035), UA(L, "metal", r.galvDk, e + 0.1, 0.02, 0.1, V, 0.01, 0.03);
    const a = B ? 2 : 1, H = e / a;
    for (let m = 0; m < a; m++) {
      const l = V - e / 2 + H * (m + 0.5);
      L.box("paint", u, H - 0.01, R - 0.01, 0.045, l, R / 2, 0.022, { r: 0.012 }), UA(L, "gloss", o, H - 0.16, R * (y.glassH ?? 0.62), 0.012, l, R * 0.6, 0.047), UA(L, "metal", r.stainless, H - 0.1, 0.16, 8e-3, l, 0.1, 0.048);
      const _ = B ? l + (m ? -1 : 1) * (H / 2 - 0.08) : l + H / 2 - 0.09;
      y.pushbar ? L.cyl("metal", r.stainless, 0.016, H * 0.7, l, 1, 0.09, { rz: c, seg: 6 }) : (UA(L, "metal", r.stainless, 0.03, 0.14, 0.03, _, 1.02, 0.07), UA(L, "metal", r.stainless, 0.1, 0.022, 0.03, _ - 0.03, 1.05, 0.09));
    }
  }
  function rM(L, V, e, R, y = {}) {
    const Y = y.h ?? 0.22, u = y.pad ?? Y * 0.7, o = y.w ?? GA(V, y.wt ?? 0.17, y.track ?? 0.12) * Y + u * 2, B = y.hb ?? Y + u * 1.1;
    return L.box(y.boardMat ?? "gloss", y.board ?? r.fuelBlue, o, B, y.bd ?? 0.05, e, R, (y.bd ?? 0.05) / 2 + (y.z ?? 0), { round: true, r: Math.min(0.04, B * 0.2) }), y.border && L.box("paint", y.border, o - 0.05, B - 0.05, 4e-3, e, R, (y.bd ?? 0.05) + (y.z ?? 0) + 1e-3, { r: 0.01 }), y.border && L.box(y.boardMat ?? "gloss", y.board ?? r.fuelBlue, o - 0.09, B - 0.09, 6e-3, e, R, (y.bd ?? 0.05) + (y.z ?? 0) + 2e-3, { r: 0.01 }), bA(L, V, { h: Y, x: e, y: R - Y / 2, z: (y.bd ?? 0.05) + (y.z ?? 0) + 4e-3, c: y.c ?? r.white, wt: y.wt, track: y.track, mat: y.mat, dep: y.dep, glow: y.glow, lit: y.lit, litC: y.litC, bev: y.lit ? 0 : void 0 }), o;
  }
  function HM(L, V, e) {
    L.box("gloss", r.red, 0.3, 0.62, 0.1, V, e + 0.31, 0.05, { r: 0.02 }), UA(L, f("gloss"), r.glassLt, 0.22, 0.44, 0.01, V, e + 0.34, 0.101), L.cyl(f("gloss"), I(r.red, 1.15), 0.06, 0.36, V, e + 0.32, 0.07, { seg: 10 }), UA(L, f("paint"), r.white, 0.2, 0.06, 4e-3, V, e + 0.075, 0.102), UA(L, f("metal"), r.stainless, 0.03, 0.08, 0.02, V + 0.12, e + 0.34, 0.105);
  }
  j.fuelhut = { desc: "Fuel-dock attendant hut dressing around a w × d × h block (pos = block base centre): door + awning (-Z), service hatch + awning (+Z), windows and FUEL PRICES boards (±X), roof trim, gutters + downpipes, double-sided FUEL · ICE · BAIT roof sign, rooftop AC and vent (roof pieces collide), extinguisher, NO SMOKING plates.", params: { w: "m (3.4)", d: "m (3.7)", h: "m (2.7)", diesel: "1.89", unleaded: "2.14" }, variants: 1, mount: "ground", build(L, V) {
    L.aoBase = null;
    const e = V.w ?? 3.4, R = V.d ?? 3.7, y = V.h ?? 2.7, Y = (B, a) => {
      const H = [0, c, S, -c][B], m = B % 2 === 0 ? R / 2 : e / 2;
      L.push(Math.sin(H) * m, 0, Math.cos(H) * m, H), a(B % 2 === 0 ? e : R), L.pop();
    };
    for (let B = 0; B < 4; B++) Y(B, (a) => {
      L.box("paint", r.fuelBlue, a + 0.12, 0.2, 0.06, 0, y - 0.02, 0.03, { r: 0.02 }), L.box("paint", r.white, a + 0.13, 0.035, 0.07, 0, y + 0.09, 0.03, { r: 0.012 }), L.box("paint", D(r.white, r.concreteDk, 0.3), a + 0.02, 0.1, 0.04, 0, 0.05, 0.02, { r: 0.012 });
    });
    Y(2, (B) => {
      OM(L, -0.75, 0.86, 2.02, { frame: r.fuelBlueDk, leaf: r.fuelBlue }), RA(L, -0.75, 2.36, 1.1), EM(L, 0.72, 1, 1.1, 0.95, { frame: r.white, mull: 1, blind: "#e6ddc8", lit: 0.8 }), L.decal("lb4", 0.34, 0.085, 0.72, 2.2, 0.012), HM(L, 0.1, 0.55), L.decal("lb9", 0.3, 0.075, -0.75, 2.2, 0.075);
    }), Y(0, (B) => {
      EM(L, 0, 1, 1.5, 1, { frame: r.white, mull: 1, transom: 0.72 }), L.box("wood", r.woodlight ?? "woodlight", 1.7, 0.05, 0.12, 0, 0.975, 0.06, { r: 0.012 }), RA(L, 0, 2.36, 1.8), L.decal("lb11", 0.52, 0.13, 0, 0.62, 0.012), L.decal("ferry", 0.45, 0.3, 1.25, 1.55, 0.012);
    });
    for (const B of [1, 3]) Y(B, (a) => {
      EM(L, -0.95, 1.05, 0.9, 0.9, { frame: r.white, mull: 0, blind: "#e6ddc8", lit: 0.8 }), L.push(0.72, 0, 0), L.box("gloss", r.fuelBlueDk, 1.3, 1.02, 0.05, 0, 1.52, 0.025, { round: true, r: 0.03 }), L.box("gloss", r.white, 1.2, 0.2, 0.012, 0, 1.9, 0.052, { r: 0.01 }), bA(L, "FUEL PRICES", { h: 0.085, x: 0, y: 1.857, z: 0.059, c: r.fuelBlueDk, flat: true, wt: 0.22, track: 0.1 });
      for (const [H, m, l, _] of [[0, "DIESEL", V.diesel ?? "1.89", r.fuelYel], [1, "UNLEADED", V.unleaded ?? "2.14", "#4f9a57"]]) {
        const OA = 1.58 - H * 0.3;
        L.box("paint", _, 0.05, 0.2, 0.01, -0.56, OA, 0.052, { r: 6e-3 }), bA(L, m, { h: 0.06, x: -0.5, y: OA - 0.03, z: 0.052, c: r.white, flat: true, wt: 0.22, align: "left" }), L.box("gloss", "#15181d", 0.46, 0.22, 0.012, 0.3, OA, 0.052, { r: 8e-3 }), MM(L, l, 0.13, OA - 0.075, 0.059, 0.15, r.led, 2.6);
      }
      L.pop(), L.cyl("paint", r.fuelBlueDk, 0.04, y - 0.25, a / 2 - 0.12, (y - 0.25) / 2 + 0.05, 0.06, { seg: 8 }), L.cyl("paint", r.fuelBlueDk, 0.05, 0.12, a / 2 - 0.12, 0.06, 0.1, { rx: 0.9, seg: 8 });
      for (const H of [0.7, 1.7]) UA(L, "metal", r.galvDk, 0.1, 0.03, 0.06, a / 2 - 0.12, H, 0.03);
    });
    const u = y, o = -0.55;
    for (const B of [-1.3, 1.3]) L.box("metal", r.galvDk, 0.08, 0.36, 0.08, B, u + 0.18, o, { r: 0.02 }), L.box("metal", r.galvDk, 0.2, 0.02, 0.2, B, u + 0.01, o, { r: 6e-3 });
    L.box("gloss", r.fuelBlue, 3.2, 0.6, 0.1, 0, u + 0.62, o, { round: true, r: 0.04 }), L.box("paint", r.fuelYel, 3.2, 0.05, 0.11, 0, u + 0.36, o, { r: 0.015 });
    for (const B of [1, -1]) L.push(0, 0, o + B * 0.05, B > 0 ? 0 : S), bA(L, "FUEL · ICE · BAIT", { h: 0.25, x: 0, y: u + 0.5, z: 3e-3, c: r.white, flat: true, wt: 0.2, track: 0.1, mat: "glow", glow: 0.9 }), L.pop();
    L.col(-1.62, u, o - 0.08, 1.62, u + 0.94, o + 0.08), xA(L, "acunit", 0.75, u, 0.95, 0, { variant: 1 }), xA(L, "vent", -1, u, 1.1, 0, { variant: 2 });
  } }, j.fueldocksign = { desc: "Tall FUEL DOCK landmark: 6.4 m galvanised mast on a bolted base at the dock edge (pos), cantilever arm toward local -X over the water carrying a double-sided lit panel (FUEL / DOCK + nozzle icon) facing ±Z, gooseneck lamps, wind pennant. Only the mast collides.", params: { reach: "arm length m (2.2)" }, variants: 1, mount: "ground", build(L, V) {
    const R = V.reach ?? 2.2, y = r.galv;
    L.box("metal", r.galvDk, 0.44, 0.04, 0.44, 0, 0.02, 0, { r: 0.012 });
    for (const [a, H] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) L.cyl("metal", r.galvDk, 0.022, 0.04, a * 0.16, 0.055, H * 0.16, { seg: 6 }), L.cyl("metal", r.galvDk, 0.012, 0.05, a * 0.16, 0.08, H * 0.16, { seg: 5 });
    L.lathe("metal", y, [[0.13, 0.04], [0.12, 0.3], [0.1, 0.34], [0.1, 6.4], [0.06, 6.4 + 0.04], [0, 6.4 + 0.05]], 0, 0, 0, { seg: 12 });
    for (const a of [1.2, 3.2]) L.cyl("metal", r.galvDk, 0.108, 0.05, 0, a, 0, { seg: 12, open: true });
    L.box("metal", y, R + 0.15, 0.12, 0.12, -R / 2, 6.4 - 0.3, 0, { r: 0.02 }), L.tube("metal", y, [G(0, 6.4 - 1.3, 0), G(-R * 0.7, 6.4 - 0.36, 0)], 0.035, { radial: 6 });
    const Y = 2.1, u = 1.35, o = -R + 0.95, B = 6.4 - 0.55 - 0.18 - u / 2;
    for (const a of [-0.75, 0.75]) L.cyl("metal", r.galvDk, 0.012, 0.18, o + a, 6.4 - 0.45, 0, { seg: 5 });
    L.box("gloss", r.white, Y + 0.08, u + 0.08, 0.1, o, B, 0, { round: true, r: 0.05 });
    for (const a of [1, -1]) {
      L.push(o, B, a * 0.052, a > 0 ? 0 : S), L.box("gloss", r.fuelBlue, Y - 0.04, u - 0.04, 0.012, 0, 0, 4e-3, { r: 0.03 }), bA(L, "FUEL", { h: 0.46, x: 0.18, y: -0.02, z: 0.012, c: r.white, flat: true, wt: 0.21, track: 0.1, mat: "glow", glow: 1.25 }), bA(L, "DOCK", { h: 0.24, x: 0.18, y: -0.42, z: 0.012, c: r.fuelYel, flat: true, wt: 0.22, track: 0.2, mat: "glow", glow: 1.2 }), L.push(-0.66, -0.06, 0.012), L.box("glow", r.white, 0.26, 0.42, 0.02, 0, 0, 0.012, { r: 0.03, glow: 1.25 }), UA(L, "paint", r.fuelBlue, 0.15, 0.1, 0.01, 0, 0.1, 0.025), L.box("glow", r.white, 0.34, 0.05, 0.02, 0, -0.23, 0.012, { r: 0.012, glow: 1.25 }), L.tube("glow", r.white, [G(0.13, 0.12, 0.014), G(0.21, 0.14, 0.014), G(0.25, 0.04, 0.014), G(0.25, -0.12, 0.014), G(0.2, -0.15, 0.014)], 0.018, { radial: 4, glow: 1.25 }), L.box("glow", r.white, 0.06, 0.1, 0.02, 0.23, 0.18, 0.012, { r: 0.015, glow: 1.25, rz: -0.35 }), L.pop(), L.pop();
      for (const H of [-0.6, 0.6]) L.tube("metal", r.galvDk, [G(o + H, 6.4 - 0.36, 0), G(o + H, 6.4 - 0.2, a * 0.25), G(o + H, 6.4 - 0.3, a * 0.5)], 0.016, { radial: 5 }), L.cyl("paint", "charcoal", 0.06, 0.08, o + H, 6.4 - 0.34, a * 0.52, { seg: 8, rx: a * 0.6 }), L.cyl("glow", r.lamp, 0.045, 0.01, o + H, 6.4 - 0.38, a * 0.55, { seg: 8, rx: a * 0.6, glow: 2 });
    }
    L.cyl("metal", y, 0.012, 0.6, 0, 6.4 + 0.3, 0, { seg: 5 }), L.flag(0, 6.4 + 0.46, 0, { color: r.fuelYel, rz: c, ry: S, s: 1.7 }), L.col(-0.16, 0, -0.16, 0.16, 6.4, 0.16);
  } };
  function PM(L, V, e) {
    L.box("metal", r.club, 0.2, 0.2, 0.03, V, e, 0.015, { r: 0.012 }), L.cyl("metal", r.club, 0.085, 0.03, V, e, 0.035, { rx: c, seg: 10 }), L.sph("glow", r.lamp, 0.07, V, e, 0.045, { ws: 10, hs: 4, half: true, rx: c, glow: 1.7 });
    for (const R of [0, c]) UA(L, "metal", r.club, 0.15, 0.014, 0.014, V, e, 0.1, { rz: R });
  }
  function uM(L, V, e, R, y, Y, u, o = {}) {
    const B = e - V, a = (V + e) / 2, H = y - R, m = (R + y) / 2, l = o.roof ?? "#5f6d7c", _ = o.ov ?? 0.18;
    L.add("paint", TA(["gprism", H, u].map(Z).join("|"), () => z([[-H / 2, 0], [H / 2, 0], [0, u]], 1, 1e-3)), o.wall ?? r.render, a, Y, m, { sx: B });
    const OA = Math.atan2(u, H / 2), yA = Math.hypot(u, H / 2) + _, EA = 0.13;
    for (const CA of [-1, 1]) {
      if (L.push(a, Y + u / 2, m + CA * H / 4, 0, CA * OA), L.box("paint", l, B + _ * 2, EA, yA, 0, EA / 2 + 0.01, CA * (_ / 2 - 0), { r: 0.03 }), o.seams) for (let iA = -B / 2 + 0.3; iA < B / 2 - 0.1; iA += o.seams) UA(L, "paint", I(l, 1.12), 0.035, 0.03, yA - 0.06, iA, EA + 0.02, 0);
      L.pop(), L.box("metal", r.galvDk, B + _ * 2, 0.08, 0.1, a, Y - 0.02, m + CA * (H / 2 + _ * 0.7), { r: 0.03 });
    }
    L.box("paint", I(l, 0.8), B + _ * 2, 0.1, 0.22, a, Y + u + 0.07, m, { r: 0.04 });
  }
  j.clubhouse = { desc: "HALYARD MARINA yacht club (pos = centre of the back wall face, local z = 0 is the wall face, building behind it): ground-floor fittings on the playable wall (THE GALLEY café + CHANDLERY shopfronts, clubroom French doors behind the terrace, lanterns, rolled awnings, cornice), upper storey + roofs + central gabled pavilion with the big HALYARD MARINA · YACHT CLUB sign, cupola, nautical flagstaff with burgee + signal pennants, chimneys, and the lower building + quay extension behind the wall for outside views. Upper storey collides (camera-safe); nothing sits in front of z = 0 except flush trims ≤ 0.1 m.", params: {}, variants: 1, mount: "ground", build(L, V) {
    L.aoBase = null;
    const e = -0.2, R = -6.1, y = 4.6, Y = 7.7, u = r.render, o = "#f7f4ee", B = r.club, a = r.clubGold;
    L.box("paint", o, 48.2, 0.2, 0.28, 0, y - 0.02, -0.06, { r: 0.04 }), L.box("paint", I(o, 0.92), 48.2, 0.06, 0.2, 0, y - 0.15, -0.02, { r: 0.02 });
    for (const [J, AA] of [[-24, -8.5], [8.5, 24]]) L.box("paint", D(u, r.concreteDk, 0.45), AA - J, 0.32, 0.06, (J + AA) / 2, 0.16, 0.03, { r: 0.015 });
    EM(L, -16, 0.62, 1.8, 2, { frame: o, mull: 1, transom: 0.74, blind: "#efe2c4", lit: 0.85 }), EM(L, -9.9, 0.62, 1.6, 2, { frame: o, mull: 1, transom: 0.74, blind: "#efe2c4", lit: 0.85 }), OM(L, -12.95, 1.7, 2.45, { double: true, frame: B, leaf: B, pushbar: true, glassH: 0.7 });
    for (const [J, AA] of [[-16, 2.1], [-12.95, 2], [-9.9, 1.9]]) RA(L, J, 2.98, AA, B, o);
    for (const [J, AA, jA] of [[-16.55, 1.7, "menu"], [-9.45, 1.55, "pst11"], [-15.4, 1.5, "chalk2"]]) L.decal(jA, jA === "pst11" ? 0.36 : 0.44, jA === "pst11" ? 0.54 : 0.32, J, AA, 0.024);
    rM(L, "THE GALLEY", -12.95, 3.72, { h: 0.3, board: B, c: "#6e5530", bd: 0.05, pad: 0.22, wt: 0.18, track: 0.14, lit: 1.3, litC: a });
    for (const J of [-17.55, -14.35, -11.45, -8.75]) PM(L, J, 2.3);
    OM(L, -20.2, 0.95, 2.1, { frame: I(u, 0.8), leaf: "#8a939c", glassH: 0.25 }), L.box("paint", "#c9c3b6", 0.7, 0.9, 0.1, -18.6, 1.1, 0.05, { r: 0.02 }), L.decal("lb0", 0.34, 0.085, -18.6, 1.3, 0.102);
    for (const J of [-23.7, -8.95, 8.95, 23.7]) {
      L.cyl("paint", I(o, 0.9), 0.055, y - 0.3, J, (y - 0.3) / 2, 0.08, { seg: 8 });
      for (const AA of [1, 2.6, 3.9]) UA(L, "metal", r.galvDk, 0.14, 0.035, 0.1, J, AA, 0.05);
    }
    EM(L, 10.6, 0.62, 2.6, 2, { frame: o, mull: 2, transom: 0.74, blind: "#efe2c4", lit: 0.85 }), OM(L, 13.35, 1, 2.35, { frame: B, leaf: B, glassH: 0.7 }), RA(L, 10.6, 2.98, 2.9, B, o), RA(L, 13.35, 2.98, 1.2, B, o);
    for (const [J, AA, jA] of [[9.8, 1.6, "pst4"], [11.55, 1.5, "pst8"], [10.7, 0.95, "lb11"]]) L.decal(jA, jA === "lb11" ? 0.6 : 0.36, jA === "lb11" ? 0.15 : 0.54, J, AA, 0.024);
    rM(L, "CHANDLERY", 11.5, 3.72, { h: 0.28, board: B, c: "#6e5530", bd: 0.05, pad: 0.2, wt: 0.18, track: 0.14, lit: 1.3, litC: a });
    for (const J of [9.05, 12.25, 14.2]) PM(L, J, 2.3);
    for (const J of [16.2, 20.8]) EM(L, J, 3.52, 1, 0.72, { frame: o, mull: 1, sill: false });
    L.push(0, 2.4, 0);
    for (const J of [-6.6, -3.3, 0, 3.3, 6.6]) OM(L, J, 1.2, 1.9, { double: true, frame: o, leaf: o, glass: r.glassLt, glassH: 0.78 });
    L.pop(), L.box("metal", r.galvDk, 17.2, 0.03, 0.08, 0, 2.415, 0.04, { r: 0.01 });
    for (const J of [-4.95, -1.65, 1.65, 4.95]) PM(L, J, 3.9);
    for (const J of [-1, 1]) L.cyl("gloss", B, 0.28, 0.04, J * 8, 3.35, 0.02, { rx: c, seg: 18 }), L.cyl("gloss", a, 0.22, 0.012, J * 8, 3.35, 0.045, { rx: c, seg: 18 }), L.cyl("gloss", B, 0.18, 0.014, J * 8, 3.35, 0.05, { rx: c, seg: 18 }), bA(L, "HM", { h: 0.14, x: J * 8, y: 3.28, z: 0.055, c: a, flat: true, wt: 0.22, track: 0.06 });
    L.box("paint", u, 48, Y - y, 5.9, 0, (y + Y) / 2, (e + R) / 2, { r: 0.05 });
    for (let J = y + 0.3; J < Y - 0.1; J += 0.23) UA(L, f("paint"), I(u, 0.9), 48, 0.018, 0.02, 0, J, e + 5e-3);
    for (const J of [-1, 1]) for (let AA = 0; AA < 5; AA++) {
      const jA = J * (10.9 + AA * 2.85);
      EM(L, jA, 5.25, 1.05, 1.55, { frame: o, mull: 1, transom: 0.66, dz: 0.07, shutters: B, sillC: o });
    }
    for (const J of [-24, 24]) L.box("paint", o, 0.22, Y - y + 0.3, 0.2, J - Math.sign(J) * 0.09, (y + Y) / 2, e - 0.08, { r: 0.03 });
    L.box("paint", o, 48.2, 0.24, 0.18, 0, Y - 0.12, e - 0.06, { r: 0.03 }), uM(L, -24.2, -9, R - 0.1, e, Y, 1.75, { roof: "#5f6d7c", ov: 0.16 }), uM(L, 9, 24.2, R - 0.1, e, Y, 1.75, { roof: "#5f6d7c", ov: 0.16 });
    for (const J of [-1, 1]) L.cyl("paint", o, 0.36, 0.08, J * 24.08, Y + 0.62, (e + R) / 2, { rz: c, seg: 16 }), L.cyl("paint", B, 0.28, 0.02, J * 24.13, Y + 0.62, (e + R) / 2, { rz: c, seg: 16 });
    for (const [J, AA] of [[-17.5, -4.2], [18.5, -4.4]]) {
      L.box("paint", "#b36d58", 0.9, 2.2, 0.7, J, Y + 1.3, AA, { r: 0.04 }), L.box("paint", I("#b36d58", 0.85), 1.02, 0.14, 0.82, J, Y + 2.4, AA, { r: 0.03 });
      for (const jA of [-0.2, 0.2]) L.cyl("paint", "#8c4c3c", 0.1, 0.34, J + jA, Y + 2.62, AA, { seg: 10 });
    }
    const H = 9.1, m = 9.6, l = 2.1;
    L.box("paint", u, H * 2, m - Y + 0.1, 6.1, 0, (Y + m) / 2, (e + R) / 2 - 0.1, { r: 0.05 }), L.box("paint", u, H * 2, Y - y, 0.12, 0, (y + Y) / 2, e + 0.02, { r: 0.03 });
    for (let J = Y + 0.25; J < m - 0.1; J += 0.23) UA(L, f("paint"), I(u, 0.9), H * 2, 0.018, 0.02, 0, J, e + 5e-3);
    for (const J of [-1, 1]) L.box("paint", o, 0.24, m - y, 0.24, J * (H - 0.02), (y + m) / 2, e - 0.06, { r: 0.04 });
    L.box("gloss", B, 13.6, 1.7, 0.08, 0, 5.95, e + 0.04, { round: true, r: 0.05 }), L.box("paint", a, 13.4, 0.04, 0.012, 0, 6.72, e + 0.086, { r: 4e-3 }), L.box("paint", a, 13.4, 0.04, 0.012, 0, 5.18, e + 0.086, { r: 4e-3 }), bA(L, "HALYARD MARINA", { h: 0.84, x: 0, y: 5.66, z: e + 0.085, c: "#6e5530", mat: "gloss", dep: 0.1, bev: 0, wt: 0.17, track: 0.09, lit: 1.3, litC: a }), bA(L, "YACHT CLUB", { h: 0.25, x: 0, y: 5.3, z: e + 0.085, c: "#8a8578", mat: "gloss", dep: 0.12, bev: 0, wt: 0.2, track: 0.34, lit: 0.86, litC: o });
    for (const J of [-1, 1]) L.push(J * 6.35, 5.95, e + 0.09, 0), L.cyl("metal", a, 0.018, 1, 0, 0, 0, { seg: 6 }), L.add("paint", TA("burgee", () => {
      const AA = new h(), jA = PA("#c9453b"), gA = PA("#f2eee6"), kA = [[0, 0.42], [0.62, 0.3], [0.44, 0.21], [0.62, 0.12], [0, 0]].map(([hA, sA]) => AA.v(hA, sA, 0, 0, 0, 1, ...jA));
      AA.tri(kA[0], kA[1], kA[2]), AA.tri(kA[0], kA[2], kA[4]), AA.tri(kA[2], kA[3], kA[4]);
      const SA = [[0.08, 0.3], [0.26, 0.21], [0.08, 0.12]].map(([hA, sA]) => AA.v(hA, sA, 2e-3, 0, 0, 1, ...gA));
      return AA.tri(SA[0], SA[1], SA[2]), AA.geo();
    }), "white", 0, 0.08, 0.01, { sx: J * 1.1, s: 1.1 }), L.pop();
    for (const J of [-4.2, 0, 4.2]) EM(L, J, 6.98, 1.4, 1.45, { frame: o, mull: 1, transom: 0.62, dz: 0.07, sill: true, sillC: o }), L.tube("paint", o, P(J, 8.5, e + 0.05, 0.78, 0.06, S - 0.06, 10), 0.07, { radial: 6 }), L.sph("paint", a, 0.07, J, 9.3, e + 0.1, { ws: 8, hs: 6 });
    L.push(0, m, (e + R) / 2 - 0.1, c), L.add("paint", TA("pgable", () => z([[-H, 0], [H, 0], [0, l]], 1, 1e-3)), u, 0, 0, 0, { sx: 6.1 });
    const _ = Math.atan2(l, H), OA = Math.hypot(l, H) + 0.2;
    for (const J of [-1, 1]) {
      L.push(0, l / 2, J * H / 2, 0, J * _), L.box("paint", "#56636f", 6.4, 0.14, OA, 0, 0.08, 0, { r: 0.03 });
      for (let AA = -2.9; AA <= 2.9; AA += 0.58) UA(L, "paint", "#6b7885", 0.035, 0.035, OA - 0.05, AA, 0.17, 0);
      L.pop();
    }
    L.box("paint", "#4a5560", 6.5, 0.12, 0.26, 0, l + 0.08, 0, { r: 0.04 }), L.pop();
    for (const J of [-1, 1]) L.push(J * H / 2, m + l / 2, e + 0.06, 0, 0, -J * Math.atan2(l, H)), L.box("paint", o, Math.hypot(l, H) + 0.3, 0.22, 0.16, 0, 0, 0, { r: 0.03 }), L.pop();
    L.box("paint", o, H * 2 + 0.3, 0.22, 0.18, 0, m - 0.02, e - 0.04, { r: 0.03 }), L.cyl("paint", o, 0.62, 0.12, 0, m + 0.85, e + 0, { rx: c, seg: 24 }), L.cyl("gloss", r.glass, 0.5, 0.05, 0, m + 0.85, e + 0.04, { rx: c, seg: 24 });
    for (const J of [0, c]) UA(L, "paint", o, 1, 0.05, 0.05, 0, m + 0.85, e + 0.07, { rz: J });
    const yA = m + l - 0.3, EA = (e + R) / 2 - 0.1;
    L.box("paint", o, 1.9, 0.5, 1.9, 0, yA + 0.25, EA, { r: 0.04 }), L.box("paint", u, 1.6, 1.3, 1.6, 0, yA + 1.15, EA, { r: 0.03 });
    for (let J = 0; J < 4; J++) {
      const AA = J * S / 2;
      L.push(Math.sin(AA) * 0.81, 0, EA + Math.cos(AA) * 0.81, AA), EM(L, 0, yA + 0.72, 0.95, 0.8, { frame: o, mull: 1, dz: 0.05, sill: false, glass: r.glassLt }), L.pop();
    }
    for (const [J, AA] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) L.box("paint", o, 0.14, 1.36, 0.14, J * 0.8, yA + 1.15, EA + AA * 0.8, { r: 0.03 });
    L.box("paint", o, 1.95, 0.14, 1.95, 0, yA + 1.86, EA, { r: 0.04 }), L.lathe("gloss", "#6fa08e", [[1.28, 0], [0.9, 0.35], [0.35, 0.95], [0.09, 1.2], [0, 1.24]], 0, yA + 1.93, EA, { seg: 4, ry: S / 4 }), L.sph("metal", a, 0.1, 0, yA + 3.2, EA, { ws: 10, hs: 6 }), L.cyl("metal", "#3a3f48", 0.02, 0.9, 0, yA + 3.6, EA, { seg: 5 });
    for (const J of [0, c]) UA(L, "metal", "#3a3f48", 0.5, 0.012, 0.012, 0, yA + 3.45, EA, { ry: J });
    L.push(0, yA + 3.85, EA, 0.6), L.add("paint", TA("vane", () => z([[-0.34, 0], [0.26, 0], [0.34, 0.08], [0.26, 0.16], [-0.26, 0.16], [-0.34, 0.26], [-0.3, 0.08]], 0.01, 2e-3)), "#3a3f48", 0, 0, 0, { ry: c }), L.pop();
    const CA = 15.5, iA = (e + R) / 2, F = Y + 1.7;
    L.lathe("metal", o, [[0.14, 0], [0.11, 0.3], [0.09, 1], [0.06, 7.2], [0.04, 7.4], [0, 7.42]], CA, F, iA, { seg: 10 }), L.sph("metal", a, 0.1, CA, F + 7.5, iA, { ws: 10, hs: 6 }), L.cyl("metal", o, 0.035, 3.2, CA, F + 5.6, iA, { rz: c, seg: 6 }), L.push(CA, F + 4.6, iA, 0, 0, -0.9), L.cyl("metal", o, 0.03, 2.2, 0, 1.1, 0, { seg: 6 }), L.pop();
    for (const J of [-1, 1]) for (let AA = 0; AA < 3; AA++) L.flag(CA + J * (0.5 + AA * 0.45), F + 5.55 - AA * 0.3, iA, { color: ["#c9453b", "#f2eee6", "#3f6fb0", "#e3b23c", "#2f5f9e", "#c9453b"][AA + (J > 0 ? 3 : 0)], s: 1.2 });
    L.flag(CA, F + 7.3, iA, { color: "#c9453b", rz: c, s: 2 }), L.flag(CA - 1.62, F + 5.92, iA, { color: B, rz: c, s: 1.6 });
    for (const J of [-1, 1]) L.tube("paint", "#e8e2d0", [G(CA, F + 7.3, iA), G(CA + J * 1.6, F + 5.62, iA + 0.01)], 8e-3, { radial: 3 });
    for (const J of [-1, 1]) L.box(f("paint"), u, 0.2, y, 5.6, J * 23.88, y / 2, (-0.6 + R) / 2, { r: 0.03 }), L.push(J * 24, 0, (-0.6 + R) / 2, J * c), EM(L, -1.2, 1.2, 1, 1.4, { frame: o, mull: 1, shutters: B }), EM(L, 1.4, 1.2, 1, 1.4, { frame: o, mull: 1, shutters: B }), L.pop();
    L.box(f("paint"), u, 48, y, 0.2, 0, y / 2, R + 0.1, { r: 0.03 }), L.box(f("paint"), D(r.concrete, "#dccbb0", 0.4), 48, 1.2, 5.95, 0, -0.6, -3.575, { r: 0.04 }), L.push(0, 0, R - 0.1, S);
    for (let J = -21; J <= 21.1; J += 3.5) EM(L, J, 5.3, 1, 1.4, { frame: o, mull: 1, sill: false, ns: true }), EM(L, J + 1.75, 1.3, 1, 1.5, { frame: o, mull: 0, sill: false, ns: true });
    OM(L, -1.75, 1.6, 2.3, { double: true, frame: B, leaf: B }), L.pop();
    for (const J of [-1, 1]) {
      L.push(J * 24.02, 0, (e + R) / 2, J * c);
      for (const AA of [-1.5, 1.5]) EM(L, AA, 5.3, 1, 1.4, { frame: o, mull: 1, sill: false, ns: true });
      L.pop();
    }
    L.col(-24.3, y, R - 0.3, 24.3, Y + 1.75, e, { roof: true }), L.col(-H, Y, R - 0.2, H, m + l, e, { roof: true }), L.col(-1, m + l - 0.3, EA - 1, 1, yA + 3.2, EA + 1, { roof: true });
  } };
  function RM(L, V, e, R, y) {
    const Y = [0, c, S, -c][R], u = R % 2 === 0 ? e / 2 : V / 2;
    L.push(Math.sin(Y) * u, 0, Math.cos(Y) * u, Y), y(R % 2 === 0 ? V : e), L.pop();
  }
  function hM(L, V, e, R, y, Y = [0, 1, 2, 3]) {
    for (const u of Y) RM(L, V, e, u, (o) => {
      L.box("paint", y, o + 0.1, 0.16, 0.05, 0, R - 0.02, 0.025, { r: 0.015 }), UA(L, "paint", I(y, 1.12), o + 0.12, 0.04, 0.06, 0, R + 0.07, 0.025), UA(L, "paint", D(y, r.concreteDk, 0.5), o + 0.02, 0.12, 0.035, 0, 0.06, 0.017);
    });
  }
  function UM(L, V, e, R) {
    L.cyl("paint", R, 0.045, e - 0.3, V, (e - 0.3) / 2 + 0.08, 0.07, { seg: 8 }), L.cyl("paint", R, 0.055, 0.14, V, 0.08, 0.12, { rx: 0.95, seg: 8 }), L.box("paint", R, 0.16, 0.08, 0.14, V, e - 0.16, 0.07, { r: 0.02 });
    for (const y of [0.8, e - 0.8]) UA(L, "metal", r.galvDk, 0.12, 0.03, 0.08, V, y, 0.04);
  }
  j.boathouse = { desc: "Boathouse dressing around a W × D × H block (pos = block base centre): big ribbed roller door with guide rails + drum box + hazard edges + KEEP CLEAR, pedestrian door, BOATHOUSE letters, side windows, gutters/downpipes, roof trim; roof kit (turbine vents, glazed rooflight, solar panels) collides.", params: { w: "m (8)", d: "m (4.8)", h: "m (3.2)" }, variants: 1, mount: "ground", build(L, V) {
    L.aoBase = null;
    const e = V.w ?? 8, R = V.d ?? 4.8, y = V.h ?? 3.2, Y = r.white, u = "#2f4a52";
    hM(L, e, R, y, Y, [0, 1, 3]), RM(L, e, R, 0, (B) => {
      for (const l of [-1, 1]) UA(L, "metal", r.galvDk, 0.12, 2.36 + 0.1, 0.1, -0.7 + l * (4.3 / 2 + 0.06), (2.36 + 0.1) / 2, 0.05), L.decal("hazard", 2.36 * 0.42, 0.1, -0.7 + l * (4.3 / 2 + 0.06), 2.36 * 0.23, 0.101, { rz: c, tint: r.fuelYel });
      L.box("metal", r.galvDk, 4.3 + 0.36, 0.3, 0.12, -0.7, 2.36 + 0.18, 0.06, { r: 0.03 }), UA(L, "metal", r.galv, 4.3, 2.36, 0.03, -0.7, 2.36 / 2, 0.02);
      for (let l = 0.12; l < 2.36 - 0.02; l += 0.105) UA(L, "metal", I(r.galv, 0.82), 4.3, 0.016, 0.012, -0.7, l, 0.038);
      UA(L, "metal", r.galvDk, 4.3, 0.06, 0.05, -0.7, 0.03, 0.03);
      for (const l of [-1.1, 1.1]) UA(L, "metal", "charcoal", 0.18, 0.04, 0.04, -0.7 + l, 0.3, 0.05);
      L.decal("lb6", 0.5, 0.125, -0.7, 1.3, 0.042), OM(L, 2.85, 0.9, 2.1, { frame: u, leaf: u, glassH: 0.3 }), PM(L, 2.1, 2.2), bA(L, "BOATHOUSE", { h: 0.24, x: -0.7, y: 2.78, z: 4e-3, c: r.club, dep: 0.12, wt: 0.2, track: 0.16 }), UM(L, B / 2 - 0.12, y, Y);
    });
    for (const B of [1, 3]) RM(L, e, R, B, (a) => {
      EM(L, -0.9, 1.1, 1.2, 1.05, { frame: Y, mull: 1, blind: "#d9e1dc" }), EM(L, 1, 1.1, 1.2, 1.05, { frame: Y, mull: 1 }), UM(L, -a / 2 + 0.14, y, Y);
    });
    const o = y;
    xA(L, "vent", -2.6, o, -1.2, 0, { variant: 1 }), xA(L, "vent", 1.6, o, -1.3, 0, { variant: 2 }), L.box("paint", Y, 1.6, 0.28, 1, -0.4, o + 0.14, 0.4, { r: 0.03 }), L.push(-0.4, o + 0.28, 0.4, 0, -0.18), UA(L, "gloss", r.glassLt, 1.5, 0.04, 0.9, 0, 0.02, 0);
    for (let B = -2; B <= 2; B++) UA(L, "paint", Y, 0.03, 0.05, 0.92, B * 0.3, 0.03, 0);
    L.pop(), L.col(-1.22, o, -0.12, 0.42, o + 0.45, 0.92);
    for (let B = 0; B < 3; B++) {
      L.push(2.2 + (B - 1) * 0.02, o + 0.25, 1.05 - B * 0.02 + 0, 0, 0.3), UA(L, "metal", r.galvDk, 1, 0.04, 0.62, 0 + (B - 1) * 1.05, 0, 0), UA(L, "gloss", "#243248", 0.96, 0.02, 0.58, (B - 1) * 1.05, 0.03, 0);
      for (let a = -1; a <= 1; a++) UA(L, "paint", "#6f7d90", 6e-3, 0.022, 0.56, (B - 1) * 1.05 + a * 0.24, 0.04, 0);
      L.pop();
    }
    for (const B of [-1, 1]) for (const a of [0.8, 1.35]) UA(L, "metal", r.galvDk, 0.04, 0.3, 0.04, 2.2 + B * 1.45, o + 0.12, a);
    L.col(0.6, o, 0.7, 3.8, o + 0.45, 1.5);
  } }, j.harbouroffice = { desc: "Harbour-office kiosk dressing around a W × D × H block (pos = block base centre): service window with rolled awning, counter and bell on +X, HARBOUR OFFICE fascia letters, notice board with notices, door + window on +Z, window on -X, roof trim, antenna mast with blinking light + dish + flagpole (roof pieces collide).", params: { w: "m (4.8)", d: "m (3.4)", h: "m (2.8)" }, variants: 1, mount: "ground", build(L, V) {
    L.aoBase = null;
    const e = V.w ?? 4.8, R = V.d ?? 3.4, y = V.h ?? 2.8, Y = r.club;
    hM(L, e, R, y, Y, [0, 1, 3]), RM(L, e, R, 1, (u) => {
      EM(L, -0.35, 0.95, 1.5, 1.1, { frame: r.white, mull: 1, transom: 0.7 }), L.box("wood", "woodlight", 1.7, 0.05, 0.12, -0.35, 0.93, 0.06, { r: 0.012 }), L.cyl("metal", "#c9a24b", 0.04, 0.03, 0.2, 0.97, 0.08, { seg: 10 }), L.sph("metal", "#c9a24b", 0.035, 0.2, 0.995, 0.08, { ws: 8, hs: 4, half: true }), RA(L, -0.35, 2.3, 1.8, r.club, r.white), L.box("gloss", r.white, u - 0.3, 0.34, 0.04, 0, y - 0.3, 0.02, { round: true, r: 0.03 }), bA(L, "HARBOUR OFFICE", { h: 0.16, x: 0, y: y - 0.38, z: 0.043, c: r.club, flat: true, wt: 0.22, track: 0.14 }), L.box("wood", "wooddark", 0.95, 0.75, 0.05, 1.35, 1.45, 0.025, { r: 0.015 }), UA(L, "paint", "#b98f62", 0.85, 0.65, 0.01, 1.35, 1.45, 0.052), L.decal("ferry", 0.36, 0.24, 1.14, 1.58, 0.059), L.decal("pst9", 0.2, 0.3, 1.55, 1.5, 0.059, { rz: 0.04 }), L.decal("pst10", 0.18, 0.27, 1.62, 1.28, 0.06, { rz: -0.06 }), L.decal("pst2", 0.17, 0.25, 1.1, 1.27, 0.06, { rz: 0.05 }), UM(L, -u / 2 + 0.12, y, Y);
    }), RM(L, e, R, 0, (u) => {
      OM(L, -1.2, 0.9, 2.1, { frame: Y, leaf: Y, glassH: 0.55 }), EM(L, 0.8, 1, 1.3, 1, { frame: r.white, mull: 1, blind: "#e6ddc8", lit: 0.8 }), L.decal("lb13", 0.3, 0.075, -1.2, 2.25, 0.02), PM(L, -0.45, 2.05);
    }), RM(L, e, R, 3, () => {
      EM(L, 0, 1, 1.2, 1, { frame: r.white, mull: 1 });
    }), xA(L, "dish", -1.4, y, -0.8, 0, { variant: 1 }), L.lathe("metal", r.white, [[0.05, 0], [0.04, 0.2], [0.03, 3.4], [0, 3.42]], 1.6, y, 0.9, { seg: 8 }), L.sph("metal", r.clubGold, 0.05, 1.6, y + 3.45, 0.9, { ws: 8, hs: 5 }), L.flag(1.6, y + 3.3, 0.9, { color: "#3f6fb0", s: 1.3 }), L.col(1.5, y, 0.8, 1.7, y + 3.4, 1);
  } };
  function KM(L, V, e, R, y, Y, u, o = 8) {
    L.add("foliage", TA(["para", y, Y, u, o].map(Z).join("|"), () => {
      const B = new h(), a = PA(Y), H = PA(u), m = 0.38, l = 3;
      for (let _ = 0; _ < o; _++) {
        const OA = _ % 2 ? H : a, yA = [];
        for (const [F, J] of [[0.02, m], [y * 0.55, m * 0.58], [y, 0]]) {
          const AA = [];
          for (let jA = 0; jA <= l; jA++) {
            const gA = (_ + jA / l) / o * q, LA = Math.sin(jA / l * S) * 0.035 * (F / y);
            AA.push(B.v(Math.cos(gA) * F, J - LA, Math.sin(gA) * F, Math.cos(gA) * 0.4, 0.92, Math.sin(gA) * 0.4, ...OA));
          }
          yA.push(AA);
        }
        for (let F = 0; F < 2; F++) for (let J = 0; J < l; J++) B.quad(yA[F][J], yA[F][J + 1], yA[F + 1][J + 1], yA[F + 1][J]);
        const EA = _ / o * q, CA = (_ + 1) / o * q, iA = [[EA, 0], [CA, 0], [CA, -0.12], [EA, -0.12]].map(([F, J]) => B.v(Math.cos(F) * y, J, Math.sin(F) * y, Math.cos(F), 0, Math.sin(F), ...OA));
        B.quad(iA[0], iA[1], iA[2], iA[3]);
      }
      return B.geo();
    }), "white", V, e, R, {}), L.sph("gloss", Y, 0.045, V, e + 0.42, R, { ws: 8, hs: 6 });
    for (let B = 0; B < o; B++) {
      const a = (B + 0.5) / o * q;
      L.tube("metal", r.galv, [G(V, e - 0.32, R), G(V + Math.cos(a) * y * 0.5, e + 0.14, R + Math.sin(a) * y * 0.5)], 7e-3, { radial: 3 });
    }
  }
  function vA(L, V, e, R, y) {
    L.push(V, 0, e, R);
    for (const [Y, u] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) L.tube("metal", y, [G(Y * 0.19, 0, u * 0.19), G(Y * 0.17, 0.45, u * 0.17)], 0.013, { radial: 5 });
    L.box("wood", "woodlight", 0.42, 0.035, 0.4, 0, 0.465, 0, { r: 0.012 });
    for (let Y = 0; Y < 3; Y++) UA(L, "wood", I("woodlight", 0.93), 0.4, 0.06, 0.02, 0, 0.58 + Y * 0.1, -0.2);
    for (const Y of [-1, 1]) L.tube("metal", y, [G(Y * 0.17, 0.45, -0.19), G(Y * 0.18, 0.86, -0.22)], 0.012, { radial: 5 });
    L.pop();
  }
  j.cafeset = { desc: "Café terrace set: round bistro table with a painted steel base, three slatted bistro chairs, striped parasol (2.3 m), a little menu stand and cups. Collider covers table + chairs.", params: { color: "parasol stripe (club navy)" }, variants: 2, mount: "ground", build(L, V) {
    const e = V.color ?? r.club, R = (V.variant ?? 0) % 2, y = "#2f3a47";
    L.lathe("metal", y, [[0, 0], [0.26, 0], [0.27, 0.02], [0.08, 0.06], [0.03, 0.1], [0.028, 0.7], [0, 0.7]], 0, 0, 0, { seg: 12 }), L.cyl("wood", "woodlight", 0.36, 0.035, 0, 0.73, 0, { seg: 18, bevel: 0.01 });
    for (let Y = 0; Y < 3; Y++) {
      const u = Y / 3 * q + (R ? 0.5 : 0.2);
      vA(L, Math.cos(u) * 0.62, Math.sin(u) * 0.62, -u - c, y);
    }
    L.cyl("metal", r.galv, 0.02, 2.3, 0, 1.15, 0, { seg: 6 }), KM(L, 0, 1.95, 0, 1.15, e, r.white, 8), L.box("paint", r.white, 0.1, 0.13, 0.02, 0.12, 0.81, -0.08, { r: 6e-3, rx: -0.2 });
    for (const [Y, u] of [[-0.12, 0.1], [0.18, 0.16]]) L.lathe("gloss", r.white, [[0, 0], [0.03, 0], [0.035, 0.07], [0.028, 0.072], [0, 0.01]], Y, 0.748, u, { seg: 8 });
    L.col(-0.85, 0, -0.85, 0.85, 0.78, 0.85);
  } }, j.mapboard = { desc: "HALYARD MARINA site map on two galvanised posts (front +Z): navy frame, pale blue water with the piers laid out in cream, berth numbers as ticks, a red YOU ARE HERE dot, header letters, little roof.", params: {}, variants: 1, mount: "ground", build(L, V) {
    for (const u of [-1, 1]) L.box("metal", r.galv, 0.07, 2 + 0.2, 0.07, u * (1.5 / 2 + 0.02), (2 + 0.2) / 2, 0, { r: 0.015 }), L.box("paint", r.concrete, 0.22, 0.08, 0.22, u * (1.5 / 2 + 0.02), 0.04, 0, { r: 0.02 });
    L.box("gloss", r.club, 1.5 + 0.08, 1 + 0.08, 0.06, 0, 1 + 1 / 2, 0.02, { r: 0.02 }), UA(L, "paint", "#3f79a3", 1.5 - 0.06, 1 - 0.26, 6e-3, 0, 1 + 1 / 2 - 0.1, 0.053);
    for (let u = 0; u < 5; u++) UA(L, "paint", "#4f8ab3", 1.5 - 0.08, 6e-3, 2e-3, 0, 1 + 0.2 + u * 0.13, 0.057);
    bA(L, "HALYARD MARINA", { h: 0.08, x: 0, y: 2 - 0.14, z: 0.052, c: r.white, flat: true, wt: 0.22, track: 0.12 });
    const Y = (u, o, B, a) => {
      const H = 0.028333333333333335, m = (1 - 0.34) / 92;
      UA(L, "paint", "#f4ead2", Math.abs(o - u) * H, Math.abs(a - B) * m, 4e-3, (u + o) / 2 * H, 1 + 0.05 + (1 - 0.34) / 2 + (B + a) / 2 * m, 0.058);
    };
    for (const u of [1, -1]) Y(-24 * u, 24 * u, -46 * u, -31 * u), Y(-4.5, 4.5, -31 * u, -8.6 * u), Y(-24 * u, -19.5 * u, -31 * u, 0), Y(-19.5 * u, -4.5 * u, -12.4 * u, -10.4 * u), Y(-19.5 * u, -12.5 * u, -26.4 * u, -25.2 * u), Y(10 * u, 24 * u, -31 * u, -7 * u), Y(19.5 * u, 24 * u, -7 * u, 0), Y(4.5 * u, 10 * u, -26 * u, -24 * u);
    UA(L, "paint", "#1f2a3d", 32 * 0.68 / 24, 10 * (1 - 0.34) / 92, 4e-3, 0, 1 + 0.05 + (1 - 0.34) / 2, 0.06), UA(L, "paint", r.white, 13 * 0.68 / 24, 5.8 * (1 - 0.34) / 92, 4e-3, 0, 1 + 0.05 + (1 - 0.34) / 2, 0.062), L.cyl("glow", r.red, 0.022, 0.01, -21.5 * 0.68 / 24, 1 + 0.05 + (1 - 0.34) / 2 + -31.5 * (1 - 0.34) / 92, 0.066, { rx: c, seg: 10, glow: 1.4 }), L.box("paint", r.club, 1.5 + 0.24, 0.05, 0.3, 0, 2 + 0.12, 0.06, { r: 0.02, rx: 0.12 }), L.col(-1.5 / 2 - 0.1, 0, -0.1, 1.5 / 2 + 0.1, 2 + 0.2, 0.14);
  } };
  function i(L, V, e) {
    return TA(["kayak", L, V, e].map(Z).join("|"), () => {
      const R = [];
      for (let m = 0; m <= 12; m++) {
        const l = m / 12, _ = (l - 0.5) * L, OA = V / 2 * Math.pow(Math.sin(l * S), 0.62);
        R.push([_, OA]);
      }
      const y = new h(), Y = 8, u = [], o = PA(e), B = PA(I(e, 0.72));
      R.forEach(([m, l]) => {
        const _ = [];
        for (let OA = 0; OA <= Y; OA++) {
          const yA = OA / Y * S, EA = Math.cos(yA), CA = Math.sin(yA), iA = -CA * l * 0.55 + (1 - Math.abs(EA)) * 0, F = EA * l, J = OA === 0 || OA === Y;
          _.push(y.v(m, J ? 0 : iA, F, 0, J ? 1 : -CA, EA, ...OA < Y / 2 ? o : B));
        }
        u.push(_);
      });
      for (let m = 0; m < u.length - 1; m++) for (let l = 0; l < Y; l++) y.quad(u[m][l], u[m][l + 1], u[m + 1][l + 1], u[m + 1][l]);
      const a = R.map(([m, l]) => [y.v(m, 0, -l, 0, 1, 0, ...o), y.v(m, 0.05 * (l / (V / 2 + 1e-6)), 0, 0, 1, 0, ...o), y.v(m, 0, l, 0, 1, 0, ...o)]);
      for (let m = 0; m < a.length - 1; m++) y.quad(a[m][0], a[m][1], a[m + 1][1], a[m + 1][0]), y.quad(a[m][1], a[m][2], a[m + 1][2], a[m + 1][1]);
      const H = y.geo();
      return H.computeVertexNormals(), H;
    });
  }
  j.kayakrack = { desc: "Galvanised kayak rack (along +X, front +Z): two A-frame uprights with padded arms, three sit-on-top kayaks (hull + deck + seat wells), paddles leaning at the end.", params: {}, variants: 1, mount: "ground", build(L, V) {
    const R = r.galv;
    for (const y of [-1, 1]) {
      for (const Y of [-1, 1]) L.tube("metal", R, [G(y, 0.02, Y * 0.32), G(y, 1.6, Y * 0.06)], 0.025, { radial: 6 });
      for (const Y of [0.45, 0.95, 1.45]) UA(L, "metal", R, 0.05, 0.05, 0.9, y, Y, 0.05), L.box("rubber", "charcoal", 0.08, 0.06, 0.34, y, Y + 0.05, 0.28, { r: 0.02 });
      L.box("metal", r.galvDk, 0.1, 0.03, 0.7, y, 0.015, 0, { r: 0.01 });
    }
    [["#e36a4a", 0.5], ["#e3b23c", 1], ["#3f8fb0", 1.5]].forEach(([y, Y], u) => {
      L.add("gloss", i(3.4 - 0.1 * u, 0.72, y), "white", 0.05 * (u - 1), Y + 0.12, 0.22, { ry: 0.02 * (u - 1) }), L.box("rubber", "charcoal", 0.5, 0.02, 0.36, -0.1, Y + 0.17, 0.22, { r: 0.01 });
    });
    for (let y = 0; y < 2; y++) {
      L.push(1.55 + y * 0.12, 0, 0.2 - y * 0.1, 0, 0, 0.1), L.cyl("metal", "#2b2f36", 0.017, 2.1, 0, 1.05, 0, { seg: 6 });
      for (const Y of [-1, 1]) L.box("gloss", y ? "#e3b23c" : "#3f8fb0", 0.03, 0.4, 0.16, 0, 1.05 + Y * 0.95, 0, { r: 0.012 });
      L.pop();
    }
    L.col(-1.3, 0, -0.4, 1.85, 1.75, 0.6);
  } }, j.shorepower = { desc: "Marina shore-power pedestal (front +Z, 1.2 m): rounded two-tone fibreglass body on a steel base, glowing dome light, two blue 16 A sockets with flip lids + one plugged-in lead running off, meter window, blinking status LEDs, a brass tap with a coiled hose on the side, berth number.", params: { berth: "label text (A12)" }, variants: 1, mount: "ground", build(L, V) {
    const e = "#e9ebe6", R = "#3f4a58";
    L.box("metal", r.galvDk, 0.4, 0.05, 0.34, 0, 0.025, 0, { r: 0.012 }), L.box("gloss", R, 0.32, 0.3, 0.26, 0, 0.2, 0, { round: true, r: 0.03 }), L.box("gloss", e, 0.3, 0.72, 0.24, 0, 0.7, 0, { round: true, r: 0.05 }), L.box("gloss", R, 0.33, 0.1, 0.27, 0, 1.08, 0, { round: true, r: 0.035 }), L.lathe("gloss", "#f4f1e6", [[0.1, 0], [0.1, 0.03], [0.08, 0.09], [0.04, 0.12], [0, 0.125]], 0, 1.13, 0, { seg: 10 }), L.sph("glow", r.lamp, 0.075, 0, 1.18, 0, { ws: 10, hs: 5, half: true, glow: 1.5 }), UA(L, "gloss", "#1d2229", 0.12, 0.07, 0.01, -0.05, 0.93, 0.122), UA(L, "glow", r.ledG, 0.09, 0.035, 4e-3, -0.05, 0.93, 0.128, { glow: 1.3 }), L.blink(r.ledG, 0.09, 0.95, 0.125, { size: 0.012, rate: 0.35, lo: 0.3, hi: 4 }), UA(L, "glow", r.fuelYel, 0.018, 0.018, 6e-3, 0.09, 0.91, 0.124, { glow: 1.2 }), bA(L, V.berth ?? "A12", { h: 0.045, x: 0, y: 1, z: 0.122, c: R, flat: true, wt: 0.24 });
    for (const y of [-1, 1]) L.cyl("gloss", "#3f6fb0", 0.045, 0.06, y * 0.075, 0.62, 0.12, { rx: c, seg: 10 }), L.push(y * 0.075, 0.67, 0.155, 0, -0.5), UA(L, "gloss", "#3f6fb0", 0.09, 0.012, 0.06, 0, 0, 0.03), L.pop();
    L.cyl("gloss", "#3f6fb0", 0.05, 0.12, 0.075, 0.62, 0.2, { rx: c, seg: 10 }), L.tube("rubber", "#2a5d9a", [G(0.075, 0.62, 0.26), G(0.1, 0.45, 0.34), G(0.12, 0.05, 0.45), G(0.2, 0.012, 0.8), G(0.25, 0.012, 1.1)], 0.012, { radial: 5 }), L.cyl("metal", "#c9a24b", 0.018, 0.1, 0.19, 0.5, 0, { rz: c, seg: 8 }), L.cyl("metal", "#c9a24b", 0.01, 0.06, 0.24, 0.47, 0, { seg: 6 }), UA(L, "metal", r.galvDk, 0.03, 0.16, 0.12, 0.165, 0.34, 0);
    for (let y = 0; y < 2; y++) L.tor("rubber", "#5a8fc9", 0.13 - y * 0.012, 0.016, 0.2, 0.26 - y * 0.02, 0, { ry: c, rx: 0.2, rs: 4, ts: 12 });
    L.decal("lb0", 0.2, 0.05, 0, 0.35, 0.122), L.col(-0.2, 0, -0.17, 0.2, 1.22, 0.17);
  } }, j.bollardlight = { desc: "Low dock bollard light (0.85 m): cast base, anodised post, louvred glowing head under a domed cap.", params: {}, variants: 1, mount: "ground", build(L, V) {
    const e = "#39424d";
    L.lathe("metal", e, [[0, 0], [0.12, 0], [0.12, 0.03], [0.085, 0.07], [0.075, 0.1], [0, 0.1]], 0, 0, 0, { seg: 12 }), L.cyl("metal", e, 0.068, 0.56, 0, 0.38, 0, { seg: 12 }), L.cyl("glow", r.lamp, 0.058, 0.14, 0, 0.73, 0, { seg: 12, glow: 1.7 });
    for (let R = 0; R < 4; R++) UA(L, "metal", e, 0.13, 0.012, 0.13, 0, 0.675 + R * 0.035, 0, { ry: S / 4 });
    L.lathe("metal", e, [[0.085, 0], [0.085, 0.02], [0.05, 0.06], [0, 0.07]], 0, 0.8, 0, { seg: 12 }), L.col(-0.1, 0, -0.1, 0.1, 0.87, 0.1);
  } };
  function $(L, V, e, R, y, Y) {
    L.lathe("rubber", "#26282d", s.map(([u, o]) => [u * (y / 0.33), o * (Y / 0.2)]), V, e, R, { seg: 9, closed: true, rz: c }), L.cyl("metal", r.liftYel, y * 0.52, Y * 0.9, V, e, R, { rz: c, seg: 12 }), L.cyl("metal", r.galvDk, y * 0.2, Y * 1.05, V, e, R, { rz: c, seg: 8 });
  }
  j.travellift = { desc: "Boatyard travel lift (35 t): four blue box-section legs on yellow twin-tyre bogies (colliders), side beams at 5.4–6.1 m, rear cross beam with knee braces, four winch drums with cables and raised lifting slings, engine house with exhaust, operator console, HALYARD + SWL 35 T markings, hazard bands. Local: W 5.4 between leg centres (X), L 3.8 (Z), open at +Z.", params: { w: "leg span X (5.4)", l: "leg span Z (3.8)" }, variants: 1, mount: "ground", build(L, V) {
    const e = V.w ?? 5.4, R = V.l ?? 3.8, y = 5.45, Y = 0.66, u = r.liftBlue, o = r.liftYel;
    for (const B of [-1, 1]) for (const a of [-1, 1]) {
      const H = B * e / 2, m = a * R / 2;
      L.box("metal", o, 0.5, 0.5, 1.3, H, 0.8, m, { r: 0.04 }), L.box("metal", I(o, 0.85), 0.56, 0.08, 1.36, H, 1.07, m, { r: 0.02 });
      for (const l of [-0.42, 0.42]) $(L, H + B * 0.02, 0.42, m + l, 0.42, 0.3);
      L.box("metal", u, 0.42, y - 1.05, 0.52, H, 1.05 + (y - 1.05) / 2, m, { r: 0.03 }), L.decal("hazard", 0.42, 0.3, H, 1.35, m + a * 0.262, { tint: o, ry: a > 0 ? 0 : S }), L.decal("hazard", 0.52, 0.3, H + B * 0.212, 1.35, m, { tint: o, ry: B * c });
      for (const l of [0, 1]) UA(L, "metal", I(u, 0.8), 0.44, 0.03, 0.54, H, 2.4 + l * 1.6, m);
      L.push(H, y - 0.25, m - a * 0.45, 0, a * 0.62), L.box("metal", u, 0.34, 0.14, 1, 0, 0, 0, { r: 0.02 }), L.pop();
    }
    for (const B of [-1, 1]) {
      const a = B * e / 2;
      L.box("metal", u, 0.46, Y, R + 1.3, a, y + Y / 2, -0.2, { r: 0.04 }), UA(L, "metal", o, 0.47, 0.06, R + 1.28, a, y + 0.1, -0.2), L.push(a + B * 0.235, y + 0.38, 0.2, B * c), bA(L, "HALYARD", { h: 0.22, x: 0, y: 0, z: 2e-3, c: r.white, flat: true, wt: 0.2, track: 0.14 }), B > 0 && bA(L, "SWL 35 T", { h: 0.1, x: -1.55, y: -0.2, z: 2e-3, c: o, flat: true, wt: 0.22 }), L.pop();
      for (const H of [-1, 0.8]) L.cyl("metal", r.galvDk, 0.2, 0.36, a - B * 0.05, y - 0.12, H, { rz: c, seg: 12 }), L.cyl("metal", r.galv, 0.012, 0.3, a - B * 0.05, y - 0.42, H, { seg: 4 });
    }
    for (const B of [-1, 0.8]) {
      const a = [];
      for (let H = 0; H <= 8; H++) {
        const m = H / 8, l = (m - 0.5) * (e - 0.2);
        a.push([l, y - 0.5 - 0.22 * Math.sin(m * S)]);
      }
      for (let H = 0; H < 8; H++) {
        const [m, l] = a[H], [_, OA] = a[H + 1];
        L.push((m + _) / 2, (l + OA) / 2, B, 0, 0, Math.atan2(OA - l, _ - m)), UA(L, "paint", "#3f6fb0", Math.hypot(_ - m, OA - l) + 0.02, 0.012, 0.16, 0, 0, 0), L.pop();
      }
      for (const H of [-1, 1]) L.box("metal", r.galvDk, 0.12, 0.2, 0.2, H * (e / 2 - 0.1), y - 0.52, B, { r: 0.02 });
    }
    L.box("metal", u, e + 0.46, 0.56, 0.48, 0, y + 0.34, -R / 2 - 0.62, { r: 0.04 }), UA(L, "metal", o, e + 0.44, 0.06, 0.49, 0, y + 0.62, -R / 2 - 0.62);
    for (const B of [-1, 1]) L.push(B * (e / 2 - 0.45), y - 0.2, -R / 2 - 0.62, 0, 0, B * 0.75), L.box("metal", u, 1.1, 0.16, 0.3, 0, 0, 0, { r: 0.02 }), L.pop();
    L.push(e / 2 - 0.9, y + 0.62, -R / 2 - 0.62), L.box("metal", u, 1.5, 0.75, 0.62, 0, 0.375, 0, { round: true, r: 0.05 });
    for (let B = 0; B < 6; B++) UA(L, "metal", I(u, 0.7), 0.05, 0.4, 0.02, -0.5 + B * 0.1, 0.4, 0.315);
    L.cyl("metal", "#3a3f48", 0.05, 0.9, 0.55, 1.05, 0, { seg: 8 }), L.cyl("metal", "#3a3f48", 0.06, 0.08, 0.55, 1.52, 0, { seg: 8 }), L.pop(), L.push(-e / 2 - 0.3, 1.5, -R / 2 + 0.55), L.box("metal", r.galvDk, 0.12, 0.9, 0.12, 0, -0.1, 0, { r: 0.02 }), L.box("metal", o, 0.36, 0.3, 0.22, 0, 0.45, 0, { r: 0.03, rx: -0.3 });
    for (let B = 0; B < 3; B++) L.cyl("metal", "charcoal", 0.012, 0.1, -0.1 + B * 0.1, 0.62, 0.02, { seg: 5, rx: 0.3 });
    L.sph("gloss", r.red, 0.03, 0.12, 0.55, 0.12, { ws: 8, hs: 4 }), L.pop(), L.blink("#ffb347", e / 2, y + Y + 0.12, R / 2 + 0.3, { size: 0.05, rate: 0.8, lo: 0.2, hi: 5 }), L.cyl("metal", "charcoal", 0.06, 0.1, e / 2, y + Y + 0.05, R / 2 + 0.3, { seg: 8 });
    for (const B of [-1, 1]) for (const a of [-1, 1]) L.col(B * e / 2 - (B < 0 && a < 0 ? 0.5 : 0.3), 0, a * R / 2 - 0.66, B * e / 2 + 0.3, y, a * R / 2 + 0.66);
  } };
  function n(L, V, e, R = 14) {
    const y = [];
    for (let Y = 0; Y <= R; Y++) {
      const u = Y / R, o = (u - 0.5) * L, B = V / 2 * (u < 0.55 ? 0.94 + 0.06 * Math.sin(u / 0.55 * c) : Math.max(0.03, Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.55) / 0.45, 1.6))))), a = e + 0.18 * Math.pow(Math.max(0, u - 0.45) / 0.55, 2), H = -0.06 + (a + 0.06) * Math.pow(Math.max(0, u - 0.72) / 0.28, 1.8) * 0.92, m = H + (a - H) * 0.42;
      y.push({ x: o, bw: B, sheer: a, keel: H, chine: m, t: u });
    }
    return { secs: y };
  }
  const d = (L) => {
    const V = (y, Y) => [y, Y], e = L.bw * 0.9, R = [V(L.bw, L.sheer), V((L.bw + e) / 2 + 0.01, (L.sheer + L.chine) / 2), V(e, L.chine), V(e * 0.5, (L.chine + L.keel) / 2 - 0.02), V(0, L.keel)];
    return [...R, ...R.slice(0, 4).reverse().map(([y, Y]) => [-y, Y])];
  };
  j.tarpboat = { desc: "Laid-up motor launch on a painted steel cradle with screw pads, wrapped in a sagging blue tarp with lashings and bungees, white topsides with a navy boot stripe and red antifouling showing below the cover. Keel along local X.", params: {}, variants: 1, mount: "ground", build(L, V) {
    for (const B of [-0.55, 0.55]) L.box("metal", r.liftBlue, 3.6 * 0.8, 0.1, 0.12, 0, 0.05, B, { r: 0.02 });
    for (const B of [-0.9, 0.8]) {
      L.box("metal", r.liftBlue, 0.12, 0.12, 1.35, B, 0.16, 0, { r: 0.02 });
      const a = n(3.6, 1.5, 0.75).secs[Math.round((B / 3.6 + 0.5) * 14)], H = 0.62 + 0.1 + a.chine + (a.keel - a.chine) * Math.max(0, (a.bw * 0.9 - 0.52) / (a.bw * 0.9)) + 0.01;
      for (const l of [-1, 1]) L.tube("metal", r.galv, [G(B, 0.2, l * 0.66), G(B, H - 0.06, l * 0.56)], 0.025, { radial: 5 }), L.box("rubber", "charcoal", 0.16, 0.05, 0.14, B, H - 0.02, l * 0.54, { r: 0.012, rx: -l * 0.75 });
      const m = 0.62 + 0.1 + a.keel;
      UA(L, "wood", "#9c7a52", 0.24, m - 0.2, 0.26, B, 0.2 + (m - 0.2) / 2, 0);
    }
    const u = TA("tarphull2", () => {
      const { secs: B } = n(3.6, 1.5, 0.75), a = new h(), H = [], m = PA(r.hull), l = PA(r.club), _ = PA(r.antifoul);
      for (const CA of B) {
        const iA = CA.keel + 0.405;
        H.push(d(CA).map(([F, J]) => a.v(CA.x, J, F, 0, J < CA.chine ? -1 : 0, Math.sign(F) || 0, ...J < iA - 0.05 ? _ : J < iA + 0.04 ? l : m)));
      }
      for (let CA = 0; CA < H.length - 1; CA++) for (let iA = 0; iA < H[CA].length - 1; iA++) a.quad(H[CA][iA], H[CA][iA + 1], H[CA + 1][iA + 1], H[CA + 1][iA]);
      const OA = H[0], yA = a.v(B[0].x, (B[0].sheer + B[0].keel) / 2, 0, -1, 0, 0, ...m);
      for (let CA = 0; CA < OA.length - 1; CA++) a.tri(yA, OA[CA], OA[CA + 1]);
      const EA = a.geo();
      return EA.computeVertexNormals(), EA;
    });
    L.add("gloss", u, "white", 0, 0.62 + 0.1, 0, {}), L.add("paint", TA("strake", () => {
      const { secs: B } = n(3.6, 1.5, 0.75), a = [];
      for (const H of B) a.push([H.x, H.sheer - 0.03, H.bw + 0.015]);
      for (let H = B.length - 1; H >= 0; H--) a.push([B[H].x, B[H].sheer - 0.03, -B[H].bw - 0.015]);
      return O(a, 0.022, 5);
    }), r.club, 0, 0.62 + 0.1, 0, {});
    const o = TA("tarpcover2", () => {
      const { secs: B } = n(3.7, 1.58, 0.75), a = new h(), H = [], m = 12, l = PA(r.tarp), _ = PA(r.tarpDk);
      B.forEach((yA, EA) => {
        const CA = [], iA = Math.abs(Math.cos(yA.t * S * 3));
        for (let F = 0; F <= m; F++) {
          const J = F / m, AA = J * S, jA = Math.cos(AA) * yA.bw * 1.03, gA = (0.24 + 0.12 * Math.sin(yA.t * S)) * Math.pow(Math.sin(AA), 0.8) * (0.8 + 0.2 * iA), LA = Math.pow(Math.abs(Math.cos(AA)), 5) * (0.26 + 0.05 * Math.sin(EA * 1.7 + F)), kA = MA(l, _, 0.3 + 0.4 * (1 - iA) * Math.sin(AA) + 0.15 * Math.sin(EA * 0.9 + F * 0.7));
          CA.push(a.v(yA.x, yA.sheer + gA - LA, jA * (1 + LA * 0.12), 0, Math.sin(AA), Math.cos(AA), ...kA));
        }
        H.push(CA);
      });
      for (let yA = 0; yA < H.length - 1; yA++) for (let EA = 0; EA < m; EA++) a.quad(H[yA][EA], H[yA][EA + 1], H[yA + 1][EA + 1], H[yA + 1][EA]);
      const OA = a.geo();
      return OA.computeVertexNormals(), OA;
    });
    L.add("foliage", o, "white", 0, 0.62 + 0.1, 0, {});
    for (const B of [-1.2, -0.4, 0.45]) {
      const a = [];
      for (let H = 0; H <= 8; H++) {
        const m = H / 8 * S;
        a.push(G(B, 0.62 + 0.1 + 0.75 + Math.pow(Math.sin(m), 0.8) * 0.3 + 0.012, Math.cos(m) * (1.5 / 2 + 0.07)));
      }
      a.unshift(G(B, 0.2, 1.5 / 2 - 0.1)), a.push(G(B, 0.2, -1.5 / 2 + 0.1)), L.tube("paint", r.fuelYel, a, 0.012, { radial: 4 });
    }
    L.col(-3.6 / 2 - 0.05, 0, -0.8, 3.6 / 2 + 0.05, 0.62 + 0.1 + 0.75 + 0.4, 0.8);
  } }, j.scaffold = { desc: "Mobile aluminium scaffold tower (1.3 × 1.1 × 4.2): castor wheels, ladder-frame ends, diagonal braces, timber-boarded platform at 3.2 m with toe boards and double guard rails, paint tin + roller tray up top. Collides as a rail block (see-through frame: kids blocked, shots / ink / squids pass, nobody perches).", params: {}, variants: 1, mount: "ground", build(L, V) {
    const u = "#c3cad0";
    for (const o of [-1, 1]) for (const B of [-1, 1]) {
      const a = o * 0.61, H = B * (1.1 / 2 - 0.04);
      L.cyl("metal", u, 0.024, 4.2 - 0.2, a, 0.2 + (4.2 - 0.2) / 2, H, { seg: 6 }), L.cyl("metal", r.galvDk, 0.03, 0.12, a, 0.16, H, { seg: 6 }), L.cyl("rubber", "charcoal", 0.06, 0.04, a, 0.06, H, { rz: c, seg: 8 }), UA(L, "metal", r.red, 0.02, 0.05, 0.06, a + 0.05, 0.1, H);
    }
    for (let o = 0.5; o < 4.2; o += 0.9) for (const B of [-1, 1]) L.cyl("metal", u, 0.017, 1.1 - 0.08, B * (1.3 / 2 - 0.04), o, 0, { rx: c, seg: 5 });
    for (const o of [0.5, 1.4, 2.3, 3.2 - 0.02, 3.2 + 0.5, 4.2 - 0.02]) for (const B of [-1, 1]) L.cyl("metal", u, 0.017, 1.3 - 0.08, 0, o, B * (1.1 / 2 - 0.04), { rz: c, seg: 5 });
    for (const o of [-1, 1]) for (const [B, a] of [[0.5, 1.4], [1.4, 2.3], [2.3, 3.2]]) L.tube("metal", u, [G(-1.3 / 2 + 0.04, B, o * (1.1 / 2 - 0.04)), G(1.3 / 2 - 0.04, a, o * (1.1 / 2 - 0.04))], 0.014, { radial: 4 });
    for (let o = 0; o < 5; o++) UA(L, "wood", I("woodlight", 0.9 + o % 2 * 0.08), 1.3 - 0.1, 0.04, (1.1 - 0.1) / 5 - 0.01, 0, 3.2 + 0.02, -1.1 / 2 + 0.05 + (o + 0.5) * (1.1 - 0.1) / 5);
    for (const o of [-1, 1]) UA(L, "wood", "wooddark", 1.3 - 0.06, 0.15, 0.025, 0, 3.2 + 0.1, o * (1.1 / 2 - 0.02));
    for (const o of [-1, 1]) UA(L, "wood", "wooddark", 0.025, 0.15, 1.1 - 0.06, o * (1.3 / 2 - 0.02), 3.2 + 0.1, 0);
    L.lathe("gloss", r.white, [[0, 0], [0.09, 0], [0.09, 0.16], [0, 0.16]], 0.35, 3.2 + 0.04, 0.25, { seg: 10 }), L.cyl("metal", r.galvDk, 0.092, 0.012, 0.35, 3.2 + 0.205, 0.25, { seg: 10 }), UA(L, "paint", "#2f5f9e", 0.28, 0.04, 0.34, -0.3, 3.2 + 0.06, -0.2), L.col(-1.3 / 2, 0, -1.1 / 2, 1.3 / 2, 4.2, 1.1 / 2, { rail: true });
  } };
  function b(L, V, e, R, y, Y = 1) {
    L.lathe("metal", r.galv, [[0, 0], [0.085 * Y, 0], [0.085 * Y, 0.17 * Y], [0.08 * Y, 0.18 * Y], [0, 0.18 * Y]], V, e, R, { seg: 10 }), L.cyl("paint", y, 0.086 * Y, 0.09 * Y, V, e + 0.09 * Y, R, { seg: 10, open: true }), L.tube("paint", y, [G(V + 0.07 * Y, e + 0.18 * Y, R), G(V + 0.087 * Y, e + 0.12 * Y, R + 0.01), G(V + 0.087 * Y, e + 0.05 * Y, R + 0.01)], 9e-3 * Y, { radial: 4 });
  }
  j.workbench = { desc: "Boatyard workbench (1.5 × 0.65 × 0.9, back to a hull at -Z): thick timber top on steel legs, engineer vice, hammer + mallet, antifoul tins and a roller tray on the shelf and the ground, plus a wheeled pressure washer with its hose reel and lance at +X.", params: {}, variants: 1, mount: "ground", build(L, V) {
    const Y = V.washerSide ?? 1;
    for (const u of [-1, 1]) for (const o of [-1, 1]) UA(L, "metal", "#3f4a58", 0.05, 0.9 - 0.06, 0.05, u * (1.5 / 2 - 0.06), (0.9 - 0.06) / 2, o * (0.65 / 2 - 0.06));
    L.box("wood", "#b08556", 1.5, 0.07, 0.65, 0, 0.9 - 0.035, 0, { r: 0.015 }), UA(L, "wood", "#9c7a52", 1.5 - 0.1, 0.03, 0.65 - 0.1, 0, 0.25, 0), L.push(-1.5 / 2 + 0.22, 0.9, 0.65 / 2 - 0.08), L.box("metal", "#3f6fb0", 0.18, 0.12, 0.14, 0, 0.06, 0, { r: 0.02 }), L.box("metal", "#3f6fb0", 0.18, 0.1, 0.06, 0, 0.07, 0.12, { r: 0.015 }), L.cyl("metal", r.galv, 0.012, 0.28, 0, 0.06, 0.2, { rx: c, seg: 5 }), L.cyl("metal", r.galv, 8e-3, 0.18, 0, 0.06, 0.33, { rz: c, seg: 5 }), L.pop(), L.push(0.15, 0.9 + 0.02, 0.05, 0.4), UA(L, "wood", "#c99a61", 0.3, 0.025, 0.025, 0, 0, 0), UA(L, "metal", "#3a3f48", 0.03, 0.035, 0.1, 0.15, 0.01, 0), L.pop(), L.push(0.45, 0.9 + 0.04, -0.12, -0.2), L.cyl("wood", "#b08556", 0.05, 0.14, 0, 0, 0, { rz: c, seg: 8 }), UA(L, "wood", "#c99a61", 0.025, 0.025, 0.26, 0, -0.01, 0.13), L.pop(), b(L, -0.35, 0.9, -0.15, r.antifoul), b(L, 0.65, 0.27, 0.05, "#3f6fb0", 0.9), b(L, -0.45, 0.27, 0, r.antifoul, 0.9), b(L, 0.1, 0, 0.65 / 2 + 0.15, r.antifoul, 1.1), b(L, 0.34, 0, 0.65 / 2 + 0.2, r.white, 1), UA(L, "metal", "#2f3a47", 0.34, 0.04, 0.26, -0.3, 0.02, 0.65 / 2 + 0.2), L.cyl("paint", r.antifoul, 0.03, 0.2, -0.3, 0.08, 0.65 / 2 + 0.2, { rz: c, seg: 8 }), L.push(Y * (1.5 / 2 + 0.42), 0, 0.05, Y > 0 ? 0 : S), L.box("metal", r.fuelYel, 0.42, 0.34, 0.5, 0, 0.4, 0, { round: true, r: 0.05 }), UA(L, "metal", "#2f3a47", 0.44, 0.08, 0.52, 0, 0.2, 0);
    for (const u of [-1, 1]) $(L, 0, 0.13, u * 0.26, 0.13, 0.06);
    L.tube("metal", "#2f3a47", [G(-0.2, 0.25, -0.22), G(-0.24, 0.9, -0.2), G(-0.24, 0.9, 0.2), G(-0.2, 0.25, 0.22)], 0.015, { radial: 5 }), L.cyl("rubber", "#1f2126", 0.12, 0.1, -0.1, 0.72, 0, { rz: c, seg: 12 });
    for (let u = 0; u < 3; u++) L.tor("rubber", "#1f2126", 0.12 + u * 8e-3, 0.012, -0.1 + (u - 1) * 0.03, 0.72, 0, { ry: c, rs: 4, ts: 14 });
    L.tube("metal", r.galv, [G(-0.26, 0.88, 0.15), G(-0.3, 0.5, 0.2), G(-0.32, 0.12, 0.24)], 0.01, { radial: 4 }), L.tube("rubber", "#1f2126", [G(-0.1, 0.6, 0.12), G(0.1, 0.08, 0.35), G(0.4, 0.012, 0.45), G(0.7, 0.012, 0.3)], 0.012, { radial: 4 }), L.pop(), L.col(Y > 0 ? -1.5 / 2 : -1.5 / 2 - 0.66, 0, -0.65 / 2, Y > 0 ? 1.5 / 2 + 0.66 : 1.5 / 2, 0.9 + 0.05, 0.65 / 2);
  } }, j.beacon = { desc: "Harbour beacon crown for the S × S × H beacon block: red band + daymark + nameplate on the block, flush steel wall ladder (-Z face) with grab hoops, galvanised railing ring round the top (collides), red/white lantern house with glazed lantern, blinking red light, domed roof, ventilator ball and lightning rod (collides).", params: { s: "block size (2.4)", h: "block height (2.4)", color: "identity colour (red)" }, variants: 1, mount: "ground", build(L, V) {
    L.aoBase = null;
    const e = V.s ?? 2.4, R = V.h ?? 2.4, y = V.color ?? r.red, Y = r.white, u = r.galv;
    for (let l = 0; l < 4; l++) RM(L, e, e, l, (_) => {
      L.box("paint", y, _ + 0.06, 0.34, 0.04, 0, R - 0.2, 0.02, { r: 0.012 }), L.box("paint", Y, _ + 0.06, 0.06, 0.045, 0, R - 0.4, 0.022, { r: 0.01 });
    });
    for (const l of [1, 3]) RM(L, e, e, l, () => {
      L.box("paint", Y, 0.9, 0.9, 0.04, 0, 1.2, 0.02, { r: 0.02 }), L.add("paint", TA("daymark", () => {
        const _ = new h(), OA = PA(r.red), yA = _.v(-0.36, -0.3, 0, 0, 0, 1, ...OA), EA = _.v(0.36, -0.3, 0, 0, 0, 1, ...OA), CA = _.v(0, 0.34, 0, 0, 0, 1, ...OA);
        return _.tri(yA, EA, CA), _.geo();
      }), "white", 0, 1.2, 0.042, {}), L.box("paint", r.club, 0.7, 0.16, 0.02, 0, 0.55, 0.012, { r: 0.01 }), bA(L, "HM 1", { h: 0.08, x: 0, y: 0.51, z: 0.023, c: Y, flat: true, wt: 0.22, track: 0.14 });
    });
    RM(L, e, e, 2, () => {
      for (const l of [-1, 1]) {
        const _ = l * 0.22, OA = [G(_, 0.05, 0.1), G(_, R - 0.02, 0.1)];
        for (let yA = 1; yA <= 4; yA++) {
          const EA = yA / 4 * S;
          OA.push(G(_, R + Math.sin(EA) * 0.55 + 0.4 * (yA / 4), 0.1 - (1 - Math.cos(EA)) * 0.16));
        }
        OA.push(G(_, R + 0.3, -0.22), G(_, R + 0.02, -0.22)), L.tube("metal", u, OA, 0.02, { radial: 6 });
        for (const yA of [0.3, R - 0.4]) UA(L, "metal", r.galvDk, 0.04, 0.05, 0.1, _, yA, 0.05);
      }
      for (let l = 0.3; l < R - 0.1; l += 0.3) L.cyl("metal", u, 0.014, 0.44, 0, l, 0.1, { rz: c, seg: 5 });
    });
    const o = R, B = e / 2 - 0.08;
    UA(L, "metal", r.galvDk, e - 0.1, 0.03, e - 0.1, 0, o + 0.015, 0);
    for (let l = 0; l < 4; l++) {
      const _ = l * S / 2;
      L.push(Math.sin(_) * B, o, Math.cos(_) * B, _);
      for (const OA of [0.5, 1]) L.cyl("metal", u, OA > 0.9 ? 0.028 : 0.018, 2 * B, 0, OA, 0, { rz: c, seg: 6, open: true });
      for (const OA of [-B, -B / 3, B / 3]) L.cyl("metal", u, 0.022, 1, OA, 0.5, 0, { seg: 6 });
      L.pop();
    }
    for (const [l, _] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) L.sph("metal", u, 0.035, l * B, o + 1, _ * B, { ws: 6, hs: 4 });
    const a = o + 0.03;
    L.lathe("gloss", y, [[0, 0], [0.66, 0], [0.66, 0.08], [0.6, 0.12], [0.6, 0.72], [0.68, 0.76], [0.68, 0.82], [0, 0.82]], 0, a, 0, { seg: 16 }), L.cyl("gloss", Y, 0.605, 0.16, 0, a + 0.4, 0, { seg: 16, open: true }), L.cyl("glow", "#ffd8cc", 0.3, 0.7, 0, a + 0.82 + 0.39, 0, { seg: 12, glow: 0.9 }), L.blink("#ff4a3a", 0, a + 1.21, 0, { size: 0.46, rate: 0.4, lo: 0.35, hi: 3.2 });
    for (let l = 0; l < 8; l++) {
      const _ = l / 8 * q;
      UA(L, "metal", Y, 0.035, 0.8, 0.035, Math.cos(_) * 0.49, a + 0.82 + 0.39, Math.sin(_) * 0.49, { ry: -_ });
    }
    L.tor("metal", Y, 0.49, 0.02, 0, a + 1.21, 0, { rx: c, rs: 4, ts: 24 }), L.lathe("gloss", y, [[0, 0], [0.62, 0], [0.62, 0.05], [0.5, 0.2], [0.3, 0.36], [0.1, 0.44], [0, 0.45]], 0, a + 1.6, 0, { seg: 16 }), L.sph("metal", Y, 0.1, 0, a + 2.12, 0, { ws: 10, hs: 6 }), L.cyl("metal", "#3a3f48", 0.012, 0.7, 0, a + 2.5, 0, { seg: 4 }), L.push(0, a + 2.62, 0, 0.9), UA(L, "metal", "#3a3f48", 0.4, 0.1, 8e-3, 0.1, 0, 0), L.pop(), L.col(-0.68, o, -0.68, 0.68, a + 2.1, 0.68);
    const H = e / 2 - 0.04, m = e / 2 + 0.02;
    L.col(-m, o, H, m, o + 1.05, m, { rail: true }), L.col(-m, o, -m, m, o + 1.05, -H, { rail: true }), L.col(H, o, -m, m, o + 1.05, m, { rail: true }), L.col(-m, o, -m, -H, o + 1.05, m, { rail: true });
  } };
  function K(L) {
    return TA("rock|" + L, () => {
      let V = new M.DodecahedronGeometry(1, 0);
      V.deleteAttribute("normal"), V.deleteAttribute("uv");
      const e = V.attributes.position, R = [];
      for (let u = 0; u < e.count; u++) {
        const o = e.getX(u), B = e.getY(u), a = e.getZ(u), H = 0.82 + 0.3 * W(Math.round(o * 7) * 3.1 + Math.round(B * 7) * 1.7 + Math.round(a * 7) * 2.3 + L * 5.1);
        R.push(o * H * 1.15, B * H * 0.75, a * H);
      }
      const y = new M.BufferGeometry();
      y.setAttribute("position", new M.Float32BufferAttribute(R, 3)), y.computeVertexNormals();
      const Y = new Float32Array(e.count * 3);
      for (let u = 0; u < e.count; u++) {
        const o = R[u * 3 + 1], B = 0.78 + 0.26 * wA(-0.8, 0.9, o) + 0.08 * W(u + L);
        Y[u * 3] = B, Y[u * 3 + 1] = B, Y[u * 3 + 2] = B * 0.97;
      }
      return y.setAttribute("color", new M.BufferAttribute(Y, 3)), y;
    });
  }
  j.breakwater = { desc: "Rubble-mound breakwater arm along local +Z (pos = root at the waterline centre-line): tumbled armour rocks in two rows either side, a concrete crest slab with a seaward parapet, a rounded rock head at the +Z end with a small green pier-head light (blinks).", params: { length: "m (60)", light: "head light colour (green)" }, variants: 1, mount: "wall", build(L, V) {
    L.aoBase = null;
    const e = V.length ?? 60, R = 2.4, y = [r.rock, r.rockDk, r.rockLt, "#98938a"], Y = (B, a, H, m, l) => L.add(f("paint"), K(l % 7), D(y[l % 4], "#6d7a74", a < -1.2 ? 0.35 : 0), B, a, H, { s: m, ry: W(l * 3.3) * q, rx: (W(l * 1.7) - 0.5) * 0.5, ao: false });
    let u = 0;
    for (let B = 0.8; B < e; B += 2.8) for (const [a, H, m] of [[-3.1, -1.5, 1.45], [-1.8, -0.5, 1.2], [1.9, -0.55, 1.2], [3.3, -1.7, 1.4]].filter((l, _) => _ !== 3 || Math.round(B / 2.2) % 2 === 0)) Y(a + (W(u) - 0.5) * 0.5, H + (W(u + 9) - 0.5) * 0.3, B + (W(u + 4) - 0.5) * 0.7, m * (0.8 + 0.4 * W(u + 2)), u), u++;
    L.box(f("paint"), r.concrete, R, 0.55, e, 0, 0.2, e / 2, { r: 0.06 }), L.box(f("paint"), r.concreteDk, 0.5, 0.75, e, 1.1, 0.8, e / 2, { r: 0.06 });
    for (let B = 4; B < e; B += 4) UA(L, f("paint"), I(r.concreteDk, 0.8), R + 0.02, 0.01, 0.03, 0, 0.475, B);
    for (let B = 0; B < 14; B++) {
      const a = B / 14 * S - c * 0, H = 2.6 + W(B) * 0.6;
      Y(Math.cos(a + S) * H * 0 + Math.sin(a - c) * H, B % 2 ? -1.5 : -0.5, e + Math.cos(a - c) * H * 0.9 + 0.4, 1.2 + W(B + 3) * 0.4, u++);
    }
    L.cyl(f("paint"), r.concrete, 1.5, 0.55, 0, 0.2, e, { seg: 16 });
    const o = V.light ?? r.green;
    L.lathe(f("gloss"), r.white, [[0, 0], [0.42, 0], [0.42, 0.1], [0.3, 0.18], [0.26, 2.2], [0.34, 2.26], [0.34, 2.32], [0, 2.32]], 0, 0.47, e, { seg: 12 }), L.cyl(f("gloss"), o, 0.285, 0.5, 0, 1.6, e, { seg: 12, open: true }), L.cyl(f("gloss"), r.glassLt, 0.18, 0.36, 0, 3, e, { seg: 10 }), L.lathe(f("gloss"), o, [[0, 0], [0.24, 0], [0.12, 0.2], [0, 0.26]], 0, 3.18, e, { seg: 10 }), L.blink(o === r.green ? "#5dff8a" : "#ff5a4a", 0, 3, e, { size: 0.22, rate: 0.33, lo: 0.1, hi: 4 });
  } }, j.channelmarker = { desc: "Channel marker on the water (pos y = sea level): variant 0 = green steel pile beacon with a ladder, cone topmark and blinking green light; 1 = red floating can buoy with a can topmark and blinking red light.", params: {}, variants: 2, mount: "wall", build(L, V) {
    if (L.aoBase = null, (V.variant ?? 0) % 2 === 0) {
      L.add(f("wood"), VA(2.2, 0.26, 10, 3), "white", 0, 1.6, 0, { ao: false }), L.add(f("rubber"), zM(0.28, 10, 3), "white", 0, 1.6, 0, { ao: false }), L.cyl(f("gloss"), r.green, 0.3, 1.4, 0, 1.6 + 1.5, 0, { seg: 12, open: true }), L.box(f("metal"), r.galvDk, 0.9, 0.06, 0.9, 0, 3.9, 0, { r: 0.02 }), L.lathe(f("gloss"), r.green, [[0, 0], [0.34, 0], [0, 0.5]], 0, 4.3, 0, { seg: 12 }), L.cyl(f("metal"), r.galv, 0.03, 0.4, 0, 4.1, 0, { seg: 6 }), L.cyl(f("gloss"), r.glassLt, 0.1, 0.2, 0, 4.92, 0, { seg: 8 }), L.blink("#5dff8a", 0, 4.92, 0, { size: 0.16, rate: 0.5, lo: 0.1, hi: 4 });
      for (let e = 0.3; e < 2.2; e += 0.3) L.cyl(f("metal"), r.galv, 0.014, 0.4, 0.33, e + 1.6 - 1.6, 0, { rx: c, seg: 5 });
    } else {
      const e = L.cols.length;
      xA(L, "buoy", 0, -0.45, 0, 0, { variant: 1, color: r.red }), L.cols.length = e;
    }
  } };
  const NA = (L, V, e) => L * e / V;
  function zA(L, V, e, R, y, Y, u, o, B, a) {
    for (let H = 0; H < B; H++) {
      const m = R + (y - R) * H / B, l = R + (y - R) * (H + 1) / B, _ = a ?? Math.max(0, NA(Y, u, Math.min(m, l))) + 0.06, OA = NA(Y, u, Math.max(m, l)) + o;
      L.col(V, _, Math.min(m, l), e, OA, Math.max(m, l), { rail: true });
    }
  }
  j.gangwayrails = { desc: "Marina gangway dressing for a thin level ramp (local +Z from (0,0,0) up to (0,rise,run), width W centred): aluminium side trusses outside the walking width — bottom chord doubling as kick plate, stanchions, sloped top rail + mid rail, N-bracing — hinge brackets with pins at the pier end, landing rollers on forks at the far end. Rail colliders along both trusses (the walkway stays open end to end).", params: { run: "m (3.85)", rise: "m (1.3)", width: "m (3.4)", thick: "plank thickness (0.22)", posts: "stanchions per side (5)", land0: "low deck edge along the run (0.2)", land1: "high deck edge along the run (run - 0.05)" }, variants: 1, mount: "ground", build(L, V) {
    L.aoBase = null;
    const e = V.run ?? 3.85, R = V.rise ?? 1.3, y = V.width ?? 3.4, Y = V.thick ?? 0.22, u = Math.max(2, V.posts ?? 5), o = Math.hypot(e, R), B = Math.atan2(R, e), a = "#b7bec4", H = "#c9ced3", m = "#8b949c", l = 1, _ = 0.5, OA = y / 2 + 0.035;
    for (const iA of [-1, 1]) {
      const F = iA * OA;
      L.push(F, R / 2, e / 2, 0, -B), L.box("metal", a, 0.06, Y + 0.12, o + 0.04, 0, 0.08 - (Y + 0.12) / 2, 0, { r: 0.012 }), UA(L, f("metal"), m, 0.062, 0.02, o + 0.02, 0, 0.075, 0), L.pop();
      const J = [];
      for (let LA = 0; LA < u; LA++) J.push(0.12 + (e - 0.24) * LA / (u - 1));
      for (const LA of J) {
        const kA = NA(R, e, LA);
        L.cyl("metal", H, 0.02, l - 0.05, F, kA + 0.05 + (l - 0.05) / 2, LA, { seg: 6 }), UA(L, f("metal"), m, 0.07, 0.02, 0.07, F, kA + 0.075, LA);
      }
      const AA = (LA, kA, SA) => {
        const hA = G(F, LA + NA(R, e, J[0]), J[0]), sA = G(F, LA + NA(R, e, J[u - 1]), J[u - 1]);
        L.tube(SA, H, [hA, sA], kA, { radial: 6 });
        for (const [rA, mA] of [[hA, -1], [sA, 1]]) L.sph(SA, H, kA * 1.05, rA[0], rA[1], rA[2], { ws: 6, hs: 4 });
      };
      AA(l, 0.025, "metal"), AA(_, 0.015, f("metal"));
      for (let LA = 0; LA + 1 < u; LA++) {
        const kA = J[LA], SA = J[LA + 1];
        L.tube(f("metal"), m, [G(F, NA(R, e, kA) + 0.1, kA), G(F, NA(R, e, SA) + _ - 0.03, SA)], 0.01, { radial: 4 });
      }
      L.box("metal", r.galvDk, 0.2, 0.02, 0.34, iA * (y / 2 + 0.14), 0.01, -0.02, { r: 6e-3 });
      for (const LA of [-0.13, 0.09]) L.cyl(f("metal"), r.galv, 0.012, 0.012, iA * (y / 2 + 0.2), 0.024, LA, { seg: 5 });
      UA(L, "metal", r.galvDk, 0.025, 0.2, 0.24, iA * (y / 2 + 0.095), 0.1, 0), L.cyl("metal", r.stainless, 0.03, 0.14, iA * (y / 2 + 0.07), 0.1, 0.02, { rz: c, seg: 8 });
      const jA = e + 0.1, gA = R + 0.07;
      UA(L, "metal", m, 0.02, 0.16, 0.2, F + iA * 0.045, gA + 0.02, jA - 0.06), UA(L, "metal", m, 0.02, 0.16, 0.2, F - iA * 0.045, gA + 0.02, jA - 0.06), L.cyl("rubber", "#26282d", 0.07, 0.07, F, gA, jA, { rz: c, seg: 10 }), L.cyl("metal", H, 0.03, 0.09, F, gA, jA, { rz: c, seg: 6 });
    }
    const yA = (V.land0 ?? 0.2) + 0.25, EA = (V.land1 ?? e - 0.05) - 0.25, CA = Math.max(1, Math.ceil((EA - yA) / 1.3));
    zA(L, y / 2 + 0.045, y / 2 + 0.5, yA, EA, R, e, l + 0.03, CA), zA(L, -y / 2 - 0.5, -y / 2 - 0.045, yA, EA, R, e, l + 0.03, CA);
  } }, j.grandstair = { desc: "Grand-stair dressing (local +Z from the foot (0,0,0) up to (0,rise,run), width W centred): render cheek stringers + stone coping outside the walking width covering the upper band of the ramp sides, navy stanchions with a varnished teak handrail and two rod rails, square newel pillars with lanterns at the foot and ball finials at the top. Balustrade = rail colliders, newels = solid (off-limits tops).", params: { run: "m (6.1)", rise: "m (2.4)", width: "m (6)" }, variants: 1, mount: "ground", build(L, V) {
    L.aoBase = null;
    const e = V.run ?? 6.1, R = V.rise ?? 2.4, y = V.width ?? 6, Y = Math.hypot(e, R), u = Math.atan2(R, e), o = r.render, B = "#e7e1d4", a = r.club, H = "#9a6a3f", m = 0.95;
    for (const l of [-1, 1]) {
      const _ = l * (y / 2 + 0.06);
      L.push(_, R / 2, e / 2, 0, -u), L.box("paint", o, 0.12, 0.42, Y + 0.1, 0, 0.06 - 0.21, 0, { r: 0.02 }), L.box("paint", B, 0.2, 0.06, Y + 0.14, l * 0.02, 0.09, 0, { r: 0.02 }), UA(L, f("paint"), I(o, 0.88), 0.122, 0.018, Y + 0.08, 0, -0.26, 0), L.pop();
      const OA = 0.35, yA = e - 0.3, EA = 6;
      for (let gA = 0; gA < EA; gA++) {
        const LA = OA + (yA - OA) * gA / (EA - 1), kA = NA(R, e, LA) + 0.12;
        L.cyl("metal", a, 0.02, m - 0.1, _, kA + (m - 0.1) / 2, LA, { seg: 6 }), L.cyl(f("metal"), a, 0.035, 0.02, _, kA + 0.01, LA, { seg: 8 });
      }
      const CA = (gA, LA) => G(_, NA(R, e, gA) + LA, gA);
      L.tube("wood", H, [CA(0.12, m - 0.02), CA(OA, m + 0.02), CA(yA, m + 0.02), CA(e - 0.1, m - 0.02)], 0.035, { radial: 7 });
      for (const gA of [0.35, 0.62]) L.tube(f("metal"), a, [CA(0.14, gA), CA(e - 0.12, gA)], 0.011, { radial: 4 });
      const iA = (gA, LA, kA, SA) => {
        const hA = l * (y / 2 + 0.14);
        if (L.box("paint", o, 0.28, kA, 0.28, hA, LA + kA / 2, gA, { r: 0.03 }), L.box("paint", B, 0.36, 0.08, 0.36, hA, LA + kA + 0.04, gA, { r: 0.02 }), L.box("paint", B, 0.34, 0.1, 0.34, hA, LA + 0.05, gA, { r: 0.02 }), SA) {
          L.lathe("metal", a, [[0.09, 0], [0.07, 0.04], [0.05, 0.05], [0, 0.05]], hA, LA + kA + 0.08, gA, { seg: 8 }), L.cyl("glow", r.lamp, 0.07, 0.24, hA, LA + kA + 0.25, gA, { seg: 8, glow: 1.6 });
          for (let sA = 0; sA < 4; sA++) {
            const rA = sA / 4 * q + S / 4;
            L.cyl(f("metal"), a, 8e-3, 0.26, hA + Math.cos(rA) * 0.075, LA + kA + 0.25, gA + Math.sin(rA) * 0.075, { seg: 4 });
          }
          L.lathe("metal", a, [[0.11, 0], [0.1, 0.02], [0.03, 0.1], [0, 0.11]], hA, LA + kA + 0.38, gA, { seg: 8 }), L.sph("metal", r.clubGold, 0.022, hA, LA + kA + 0.5, gA, { ws: 6, hs: 4 });
        } else L.sph("paint", B, 0.11, hA, LA + kA + 0.18, gA, { ws: 10, hs: 7 });
      };
      iA(-0.02, 0, 1, true), iA(e + 0.14, R, 0.95, false);
      const F = l * (y / 2 + 0.045), J = l * (y / 2 + 0.2), AA = l * (y / 2 + 0.045), jA = l * (y / 2 + 0.28);
      zA(L, Math.min(F, J), Math.max(F, J), 0.12, e - 0.06, R, e, m + 0.08, 4, 0.06), L.col(Math.min(AA, jA), 0, -0.16, Math.max(AA, jA), 1.08, 0.12, { roof: true }), L.col(Math.min(AA, jA), R, e, Math.max(AA, jA), R + 1.03, e + 0.28, { roof: true });
    }
  } };
  for (const L of Object.keys(j)) {
    if (t.has(L)) continue;
    const V = j[L], e = V.build;
    V.build = function(R, y) {
      const Y = p;
      p = R;
      try {
        return e.call(this, R, y);
      } finally {
        p = Y;
      }
    };
  }
}
const nM = Math.PI, $A = nM * 2, NM = nM / 2, jx = { white: "#ffffff", offwhite: "#f2eee6", cream: "#eee2c8", concrete: "#d2cdc3", concreteDark: "#b3ada2", warmgrey: "#a39c90", grey: "#7c776f", charcoal: "#474950", ink: "#2c2e35", railing: "#dde2e6", steel: "#aeb7bf", galv: "#c5cbd0", darksteel: "#5b616a", copper: "#c78b5d", wood: "#cc9d66", woodlight: "#ddb987", wooddark: "#a2733f", kraft: "#c8a177", bark: "#8b6749", soil: "#5a4535", teal: "#47aea3", tealdark: "#2f7f78", coral: "#e9836c", coraldark: "#c4614f", mustard: "#e5b94d", mustarddark: "#c0942f", lavender: "#a79be0", lavenderdark: "#7c70bd", sky: "#7fc0df", mint: "#a1d7b7", pink: "#eea0bf", navy: "#35405a", leaf: "#5ba257", leafdark: "#3f8249", leaflight: "#8fc46b", rubber: "#34353c", cone: "#ec8a57" }, jU = ["teal", "coral", "mustard", "lavender", "sky", "mint", "pink"], Ji = /* @__PURE__ */ new Map();
function Wj(j) {
  if (j && j.isColor) return j;
  j == null && (j = "white"), typeof j == "string" && jx[j] && (j = jx[j]);
  const A = typeof j + ":" + j;
  let M = Ji.get(A);
  return M || (M = new lA(j), Ji.set(A, M)), M;
}
const Aj = (j, A) => Wj(j).clone().multiplyScalar(A), aN = (j, A, M) => Wj(j).clone().lerp(Wj(A), M);
function lI(j) {
  return function() {
    j |= 0, j = j + 1831565813 | 0;
    let A = Math.imul(j ^ j >>> 15, 1 | j);
    return A = A + Math.imul(A ^ A >>> 7, 61 | A) ^ A, ((A ^ A >>> 14) >>> 0) / 4294967296;
  };
}
class GI {
  constructor() {
    this.p = [], this.n = [], this.uv = [], this.c = [], this.idx = [];
  }
  v(A, M, N, I, D, T, w = 0, O = 0, z = 1) {
    return this.p.push(A, M, N), this.n.push(I, D, T), this.uv.push(w, O), this.c.push(z, z, z), this.p.length / 3 - 1;
  }
  tri(A, M, N) {
    const I = this.p, D = this.n, T = I[A * 3], w = I[A * 3 + 1], O = I[A * 3 + 2], z = I[M * 3] - T, C = I[M * 3 + 1] - w, E = I[M * 3 + 2] - O, P = I[N * 3] - T, g = I[N * 3 + 1] - w, Q = I[N * 3 + 2] - O, x = C * Q - E * g, U = E * P - z * Q, k = z * g - C * P;
    if (x * x + U * U + k * k < 1e-16) return;
    x * (D[A * 3] + D[M * 3] + D[N * 3]) + U * (D[A * 3 + 1] + D[M * 3 + 1] + D[N * 3 + 1]) + k * (D[A * 3 + 2] + D[M * 3 + 2] + D[N * 3 + 2]) < 0 ? this.idx.push(A, N, M) : this.idx.push(A, M, N);
  }
  quad(A, M, N, I) {
    this.tri(A, M, N), this.tri(A, N, I);
  }
  geo() {
    const A = new FM();
    return A.setAttribute("position", new xM(this.p, 3)), A.setAttribute("normal", new xM(this.n, 3)), A.setAttribute("uv", new xM(this.uv, 2)), A.setAttribute("color", new xM(this.c, 3)), A.setIndex(this.idx), A;
  }
}
function sQ(j, A, M, N) {
  const I = [j / 2, A / 2, M / 2];
  N = Math.max(5e-4, Math.min(N, I[0] * 0.48, I[1] * 0.48, I[2] * 0.48));
  const D = new GI(), T = (w, O, z) => {
    const C = [0, 0, 0];
    C[O] = z;
    const E = (O + 1) % 3, P = (O + 2) % 3;
    return D.v(w[0], w[1], w[2], C[0], C[1], C[2], (w[E] + I[E]) / (2 * I[E]), (w[P] + I[P]) / (2 * I[P]));
  };
  for (let w = 0; w < 3; w++) for (const O of [-1, 1]) {
    const z = (w + 1) % 3, C = (w + 2) % 3, E = [];
    for (const [P, g] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const Q = [0, 0, 0];
      Q[w] = O * I[w], Q[z] = P * (I[z] - N), Q[C] = g * (I[C] - N), E.push(T(Q, w, O));
    }
    D.quad(E[0], E[1], E[2], E[3]);
  }
  for (let w = 0; w < 3; w++) {
    const O = (w + 1) % 3, z = (w + 2) % 3;
    for (const C of [-1, 1]) for (const E of [-1, 1]) {
      const P = [];
      for (const g of [-1, 1]) {
        const Q = [0, 0, 0];
        Q[w] = C * I[w], Q[O] = E * (I[O] - N), Q[z] = g * (I[z] - N), P.push(T(Q, w, C));
      }
      for (const g of [1, -1]) {
        const Q = [0, 0, 0];
        Q[w] = C * (I[w] - N), Q[O] = E * I[O], Q[z] = g * (I[z] - N), P.push(T(Q, O, E));
      }
      D.quad(P[0], P[1], P[2], P[3]);
    }
  }
  for (const w of [-1, 1]) for (const O of [-1, 1]) for (const z of [-1, 1]) {
    const C = [w, O, z], E = [];
    for (let P = 0; P < 3; P++) {
      const g = [0, 0, 0];
      for (let Q = 0; Q < 3; Q++) g[Q] = C[Q] * (Q === P ? I[Q] : I[Q] - N);
      E.push(T(g, P, C[P]));
    }
    D.tri(E[0], E[1], E[2]);
  }
  return D.geo();
}
function NU(j, A, M, N) {
  const I = [j / 2, A / 2, M / 2];
  N = Math.max(1e-3, Math.min(N, I[0] * 0.48, I[1] * 0.48, I[2] * 0.48));
  const D = new GI(), T = [I[0] - N, I[1] - N, I[2] - N];
  for (let w = 0; w < 3; w++) for (const O of [-1, 1]) {
    const z = (w + 1) % 3, C = (w + 2) % 3, E = [-I[z], -T[z], T[z], I[z]], P = [-I[C], -T[C], T[C], I[C]], g = [];
    for (let Q = 0; Q < 4; Q++) for (let x = 0; x < 4; x++) {
      const U = [0, 0, 0];
      U[w] = O * I[w], U[z] = E[Q], U[C] = P[x];
      const k = [0, 0, 0], s = [0, 0, 0];
      let v = 0;
      for (let S = 0; S < 3; S++) {
        const q = Math.max(-T[S], Math.min(T[S], U[S]));
        s[S] = U[S] - q, k[S] = q, v += s[S] * s[S];
      }
      v = Math.sqrt(v) || 1;
      for (let S = 0; S < 3; S++) s[S] /= v, k[S] += s[S] * N;
      g.push(D.v(k[0], k[1], k[2], s[0], s[1], s[2], (U[z] + I[z]) / (2 * I[z]), (U[C] + I[C]) / (2 * I[C])));
    }
    for (let Q = 0; Q < 3; Q++) for (let x = 0; x < 3; x++) D.quad(g[Q * 4 + x], g[(Q + 1) * 4 + x], g[(Q + 1) * 4 + x + 1], g[Q * 4 + x + 1]);
  }
  return D.geo();
}
function IU(j, A, M = false) {
  const N = new GI(), I = [[]];
  for (const D of j) D === null ? I.push([]) : I[I.length - 1].push(D);
  for (const D of I) {
    const T = D.length;
    if (T < 2) continue;
    const w = [], O = [];
    for (let E = 0; E < T; E++) {
      let P, g;
      M ? (P = D[(E - 1 + T) % T], g = D[(E + 1) % T]) : (P = D[Math.max(0, E - 1)], g = D[Math.min(T - 1, E + 1)]);
      let Q = g[0] - P[0], x = g[1] - P[1];
      const U = Math.hypot(Q, x) || 1;
      Q /= U, x /= U, w.push(x), O.push(-Q);
    }
    const z = [];
    for (let E = 0; E < T; E++) {
      const P = [];
      for (let g = 0; g <= A; g++) {
        const Q = g / A * $A, x = Math.cos(Q), U = Math.sin(Q);
        P.push(N.v(D[E][0] * x, D[E][1], -D[E][0] * U, w[E] * x, O[E], -w[E] * U, g / A, E / (T - 1)));
      }
      z.push(P);
    }
    const C = M ? T : T - 1;
    for (let E = 0; E < C; E++) {
      const P = z[E], g = z[(E + 1) % T];
      for (let Q = 0; Q < A; Q++) N.quad(P[Q], P[Q + 1], g[Q + 1], g[Q]);
    }
  }
  return N.geo();
}
function DU(j, A, M = 8, N = false, I = null) {
  const D = j.length, T = new GI(), w = j.map((g) => new DA(g[0], g[1], g[2])), O = [];
  for (let g = 0; g < D; g++) {
    const Q = N ? w[(g - 1 + D) % D] : w[Math.max(0, g - 1)], x = N ? w[(g + 1) % D] : w[Math.min(D - 1, g + 1)];
    O.push(x.clone().sub(Q).normalize());
  }
  const z = new DA();
  if (I && z.set(I[0], I[1], I[2]).addScaledVector(O[0], -O[0].dot(z.set(I[0], I[1], I[2]))).normalize(), !I || z.lengthSq() < 0.5) {
    const g = Math.abs(O[0].y) < 0.9 ? new DA(0, 1, 0) : new DA(1, 0, 0);
    z.crossVectors(O[0], g).normalize();
  }
  const C = new DA(), E = [];
  for (let g = 0; g < D; g++) {
    g > 0 && z.addScaledVector(O[g], -z.dot(O[g])).normalize(), C.crossVectors(O[g], z).normalize();
    const Q = typeof A == "function" ? A(g / (D - 1)) : A, x = [];
    for (let U = 0; U < M; U++) {
      const k = U / M * $A, s = Math.cos(k), v = Math.sin(k), S = z.x * s + C.x * v, q = z.y * s + C.y * v, c = z.z * s + C.z * v;
      x.push(T.v(w[g].x + S * Q, w[g].y + q * Q, w[g].z + c * Q, S, q, c, U / M, g / (D - 1)));
    }
    E.push(x);
  }
  const P = N ? D : D - 1;
  for (let g = 0; g < P; g++) {
    const Q = E[g], x = E[(g + 1) % D];
    for (let U = 0; U < M; U++) T.quad(Q[U], Q[(U + 1) % M], x[(U + 1) % M], x[U]);
  }
  return T.geo();
}
function oQ(j) {
  const A = j.length;
  let M = 0;
  for (let D = 0; D < A; D++) {
    const T = j[D], w = j[(D + 1) % A];
    M += T[0] * w[1] - w[0] * T[1];
  }
  const N = M > 0 ? 1 : -1, I = [];
  for (let D = 0; D < A; D++) {
    const T = j[D], w = j[(D + 1) % A];
    let O = (w[1] - T[1]) * N, z = -(w[0] - T[0]) * N;
    const C = Math.hypot(O, z) || 1;
    I.push([O / C, z / C]);
  }
  return I;
}
function uQ(j, A) {
  const M = oQ(j), N = j.length;
  return j.map((I, D) => {
    const T = M[(D - 1 + N) % N], w = M[D], O = 1 + T[0] * w[0] + T[1] * w[1], z = [(T[0] + w[0]) / Math.max(0.35, O), (T[1] + w[1]) / Math.max(0.35, O)];
    return [I[0] + z[0] * A, I[1] + z[1] * A];
  });
}
function TU(j, A, M) {
  const N = j.length, I = new GI(), D = oQ(j), T = Math.cos(40 * nM / 180), w = (P) => {
    const g = D[(P - 1 + N) % N], Q = D[P];
    return g[0] * Q[0] + g[1] * Q[1] < T;
  }, O = (P) => {
    const g = D[(P - 1 + N) % N], Q = D[P], x = g[0] + Q[0], U = g[1] + Q[1], k = Math.hypot(x, U) || 1;
    return [x / k, U / k];
  }, z = uQ(j, -M), C = A / 2 - M;
  for (let P = 0; P < N; P++) {
    const g = (P + 1) % N, Q = j[P], x = j[g], U = w(P) ? D[P] : O(P), k = w(g) ? D[P] : O(g), s = I.v(-C, Q[1], Q[0], 0, U[1], U[0]), v = I.v(C, Q[1], Q[0], 0, U[1], U[0]), S = I.v(C, x[1], x[0], 0, k[1], k[0]), q = I.v(-C, x[1], x[0], 0, k[1], k[0]);
    I.quad(s, v, S, q);
    for (const c of [-1, 1]) {
      const G = I.v(c * C, Q[1], Q[0], 0, U[1], U[0]), r = I.v(c * C, x[1], x[0], 0, k[1], k[0]), t = I.v(c * A / 2, z[g][1], z[g][0], c, 0, 0), p = I.v(c * A / 2, z[P][1], z[P][0], c, 0, 0);
      I.quad(G, r, t, p);
    }
  }
  const E = kI.triangulateShape(z.map((P) => new jM(P[0], P[1])), []);
  for (const P of [-1, 1]) {
    const g = z.map((Q) => I.v(P * A / 2, Q[1], Q[0], P, 0, 0));
    for (const Q of E) I.tri(g[Q[0]], g[Q[1]], g[Q[2]]);
  }
  return I.geo();
}
function zU(j, A, M, N = 0.13, I = 0.72, D = 1.12) {
  let T = new eT(j, A);
  T.deleteAttribute("normal"), T.deleteAttribute("uv"), T = A1(T);
  const w = T.attributes.position, O = M * 1.713, z = new Float32Array(w.count * 3), C = new Float32Array(w.count * 2);
  for (let E = 0; E < w.count; E++) {
    let P = w.getX(E), g = w.getY(E), Q = w.getZ(E);
    const x = P / j, U = g / j, k = Q / j, s = Math.sin(x * 3.1 + O) * Math.sin(U * 2.7 + O * 1.3) * Math.sin(k * 3.3 + O * 0.7) + 0.45 * Math.sin(x * 6.3 + k * 5.1 + O * 2.1) * Math.sin(U * 5.7 - O);
    let v = 1 + N * s;
    U < -0.2 && (v *= 1 - (-0.2 - U) * 0.35), P *= v, g *= v, Q *= v, w.setXYZ(E, P, g, Q);
    const S = Math.max(0, Math.min(1, (U + 1) / 2)), q = I + (D - I) * Math.pow(S, 1.3) + s * 0.04;
    z[E * 3] = q, z[E * 3 + 1] = q, z[E * 3 + 2] = q;
  }
  return T.computeVertexNormals(), T.setAttribute("color", new dM(z, 3)), T.setAttribute("uv", new dM(C, 2)), T;
}
function wU(j, A) {
  const [M, N] = [[7, 5], [10, 7], [12, 8]][j];
  let I = new yN(1, M, N);
  I.deleteAttribute("normal"), I.deleteAttribute("uv"), I = A1(I);
  const D = I.attributes.position, T = A * 2.17 + 0.5, w = new Float32Array(D.count * 3), O = new Float32Array(D.count * 2);
  for (let z = 0; z < D.count; z++) {
    const C = D.getX(z), E = D.getY(z), P = D.getZ(z);
    let Q = 1 + 0.07 * (Math.sin(C * 4.1 + T) * Math.sin(E * 3.7 + T * 1.3) * Math.sin(P * 4.3 + T * 0.7));
    E < -0.3 && (Q *= 1 - (-0.3 - E) * 0.3), D.setXYZ(z, C * Q, E * Q, P * Q);
    const x = Math.max(0, Math.min(1, (E + 1) / 2)), U = 0.66 + 0.5 * Math.pow(x, 1.4);
    w[z * 3] = U * 0.97, w[z * 3 + 1] = U, w[z * 3 + 2] = U * 0.94;
  }
  return I.computeVertexNormals(), I.setAttribute("color", new dM(w, 3)), I.setAttribute("uv", new dM(O, 2)), I;
}
const ni = /* @__PURE__ */ new Map(), oI = (j) => typeof j == "number" ? j.toFixed(4) : String(j);
function uI(j, A) {
  let M = ni.get(j);
  return M || (M = A(), ni.set(j, M)), M;
}
const vj = { cbox: (j, A, M, N) => uI(["cb", j, A, M, N].map(oI).join("|"), () => sQ(j, A, M, N)), rbox: (j, A, M, N) => uI(["rb", j, A, M, N].map(oI).join("|"), () => NU(j, A, M, N)), cyl: (j, A, M, N, I) => uI(["cy", j, A, M, N, I ? 1 : 0].map(oI).join("|"), () => new KN(j, A, M, N, 1, I)), sph: (j, A, M, N) => uI(["sp", j, A, M, N ? 1 : 0].map(oI).join("|"), () => new yN(j, A, M, 0, $A, 0, N ? NM : nM)), tor: (j, A, M, N, I) => uI(["to", j, A, M, N, I].map(oI).join("|"), () => new jI(j, A, M, N, I)), plane: (j, A) => uI(["pl", j, A].map(oI).join("|"), () => new KI(j, A)), lathe: (j, A, M) => uI("la|" + A + "|" + (M ? 1 : 0) + "|" + j.map((N) => N ? N[0].toFixed(3) + "," + N[1].toFixed(3) : "x").join(";"), () => IU(j, A, M)), extrude: (j, A, M, N) => uI("ex|" + j + "|" + oI(M) + "|" + oI(N), () => TU(A, M, N)), blob: (j, A, M) => uI(["bl", j, A, M].map(oI).join("|"), () => zU(j, A, M)), puff: (j, A) => uI(["pf", j, A].map(oI).join("|"), () => wU(j, A)) }, OU = (j, A, M) => {
  const N = -A / 2, I = A / 2;
  return [[0, N], [j - M, N], [j, N + M], [j, I - M], [j - M, I], [0, I]];
}, QT = (j, A) => [[0, 0], [j, 0], [j, A * 0.5], [j * 0.82, A], [0, A]], xC = 2048, QC = 2048, rz = { sign0: [0, 0, 512, 256], sign1: [512, 0, 512, 256], sign2: [1024, 0, 512, 256], sign3: [1536, 0, 512, 256], vend0: [0, 256, 256, 512], vend1: [256, 256, 256, 512], side: [512, 256, 256, 512], emblem: [768, 256, 256, 512], head0: [1024, 256, 512, 128], head1: [1024, 384, 512, 128], stencil: [1536, 256, 512, 256], hazard: [1024, 512, 512, 128], tag: [1536, 512, 512, 256], grille: [1024, 640, 256, 256], badge: [1280, 640, 256, 96], white: [1536, 768, 64, 64], clear: [1600, 768, 64, 64], wbadge: [1280, 736, 256, 96], pw0: [0, 768, 512, 256], stall1: [512, 768, 384, 128], stall2: [512, 896, 384, 128], ice: [896, 768, 128, 128], mail: [896, 896, 128, 128], cab: [1664, 768, 384, 128], dia0: [1664, 896, 128, 128], dia1: [1792, 896, 128, 128], dia2: [1920, 896, 128, 128], menu: [1280, 832, 256, 192], torn: [1536, 832, 128, 192], pst0: [0, 1024, 256, 384], pst1: [256, 1024, 256, 384], pst2: [512, 1024, 256, 384], pst3: [768, 1024, 256, 384], pst4: [1024, 1024, 256, 384], pst5: [1280, 1024, 256, 384], pst6: [1536, 1024, 256, 384], pst7: [1792, 1024, 256, 384], pst8: [0, 1408, 256, 384], pst9: [256, 1408, 256, 384], pst10: [512, 1408, 256, 384], pst11: [768, 1408, 256, 384], chalk: [1024, 1408, 256, 256], ferry: [1280, 1408, 384, 256], cart0: [1664, 1408, 384, 128], cart1: [1664, 1536, 384, 128], stall0: [1664, 1664, 384, 128], chalk2: [1024, 1664, 256, 128], news0: [1280, 1664, 128, 128], news1: [1408, 1664, 128, 128], qr: [1536, 1664, 128, 128], manhole: [0, 1792, 256, 256], gully: [256, 1792, 128, 128], gauge: [384, 1792, 64, 256], scuff: [256, 1920, 128, 128] };
for (let j = 0; j < 16; j++) rz["stk" + j] = [448 + j % 8 * 64, 1792 + Math.floor(j / 8) * 64, 64, 64];
for (let j = 0; j < 8; j++) rz["sg" + j] = [960 + j * 128, 1792, 128, 128];
for (let j = 0; j < 8; j++) rz["bl" + j] = [448 + j % 4 * 256, 1920 + Math.floor(j / 4) * 64, 256, 64];
for (let j = 0; j < 16; j++) rz["lb" + j] = [1472 + j % 4 * 128, 1920 + Math.floor(j / 4) * 32, 128, 32];
function vQ(j, A = 3) {
  const [M, N, I, D] = rz[j];
  return [(M + A) / xC, 1 - (N + D - A) / QC, (M + I - A) / xC, 1 - (N + A) / QC];
}
const CE = (() => {
  const [j, A, M, N] = rz.white;
  return [(j + M / 2) / xC, 1 - (A + N / 2) / QC];
})();
let xO = null;
const CU = "InkwavePropsDisplay", gU = "InkwavePropsText";
function GS() {
  if (xO) return xO;
  if (typeof FontFace > "u" || typeof document > "u") return xO = Promise.resolve();
  const j = new FontFace(CU, `url(${new URL("../assets/imported-package/asset-7.bin", import.meta.url)})`), A = new FontFace(gU, `url(${new URL("../assets/imported-package/asset-8.bin", import.meta.url)})`, { weight: "400 900" });
  return xO = Promise.all([j.load(), A.load()]).then((M) => {
    M.forEach((N) => document.fonts.add(N));
  }).catch(() => {
  }), xO;
}
const pM = (j) => `${j}px ${CU}, 'Titan One', 'Arial Black', sans-serif`, VM = (j, A = 800) => `${A} ${j}px ${gU}, Rubik, 'Arial', sans-serif`;
function AD(j, A, M, N, I, D) {
  j.beginPath(), j.roundRect(A, M, N, I, D);
}
function hS(j, A, M, N, I) {
  let D = N;
  for (j.font = I(D); j.measureText(A).width > M && D > 8; ) D -= 2, j.font = I(D);
  return D;
}
function _A(j, A, M, N, I, D, T, w = null, O = 0, z = 9999, C = "center") {
  hS(j, A, z, I, D), j.textAlign = C, j.textBaseline = "middle", j.lineJoin = "round", w && (j.strokeStyle = w, j.lineWidth = O, j.strokeText(A, M, N)), j.fillStyle = T, j.fillText(A, M, N);
}
function bM(j, A, M) {
  const [N, I, D, T] = rz[A];
  j.save(), j.translate(N, I), j.beginPath(), j.rect(0, 0, D, T), j.clip(), M(j, D, T), j.restore();
}
function EU(j, A, M, N) {
  j.beginPath(), j.moveTo(A, M - 1 * N), j.bezierCurveTo(A + 0.35 * N, M - 0.7 * N, A + 0.45 * N, M - 0.45 * N, A + 0.75 * N, M - 0.25 * N), j.bezierCurveTo(A + 0.55 * N, M - 0.1 * N, A + 0.5 * N, M + 0 * N, A + 0.48 * N, M + 0.2 * N), j.bezierCurveTo(A + 0.46 * N, M + 0.45 * N, A + 0.3 * N, M + 0.5 * N, A + 0.32 * N, M + 0.8 * N), j.lineTo(A + 0.16 * N, M + 0.62 * N), j.lineTo(A + 0.08 * N, M + 0.85 * N), j.lineTo(A, M + 0.62 * N), j.lineTo(A - 0.08 * N, M + 0.85 * N), j.lineTo(A - 0.16 * N, M + 0.62 * N), j.lineTo(A - 0.32 * N, M + 0.8 * N), j.bezierCurveTo(A - 0.3 * N, M + 0.5 * N, A - 0.46 * N, M + 0.45 * N, A - 0.48 * N, M + 0.2 * N), j.bezierCurveTo(A - 0.5 * N, M + 0 * N, A - 0.55 * N, M - 0.1 * N, A - 0.75 * N, M - 0.25 * N), j.bezierCurveTo(A - 0.45 * N, M - 0.45 * N, A - 0.35 * N, M - 0.7 * N, A, M - 1 * N), j.closePath();
}
function RS(j) {
  j.clearRect(0, 0, xC, QC), bM(j, "sign0", (N, I, D) => {
    N.fillStyle = "#35405a", N.fillRect(0, 0, I, D), N.fillStyle = "#3e4c6b";
    for (let T = -4; T < 12; T++) N.beginPath(), N.moveTo(T * 60, D), N.lineTo(T * 60 + 30, D), N.lineTo(T * 60 + 130, 0), N.lineTo(T * 60 + 100, 0), N.fill();
    N.fillStyle = "#47aea3", N.beginPath(), N.arc(108, 128, 78, 0, $A), N.fill(), N.strokeStyle = "#f2eee6", N.lineWidth = 15, N.lineCap = "round", N.beginPath(), N.moveTo(56, 150), N.bezierCurveTo(74, 72, 140, 62, 160, 110), N.bezierCurveTo(175, 150, 120, 170, 110, 135), N.bezierCurveTo(102, 110, 135, 100, 140, 120), N.stroke(), N.beginPath(), N.moveTo(52, 180), N.quadraticCurveTo(80, 164, 108, 180), N.quadraticCurveTo(136, 196, 164, 180), N.stroke(), _A(N, "KRAKEN", 355, 100, 74, pM, "#f2eee6", null, 0, 280), _A(N, "LINES", 355, 168, 60, pM, "#e5b94d", null, 0, 280), _A(N, "HARBOR FREIGHT  ·  EST. 1998", 355, 218, 18, VM, "#9fb0cc", null, 0, 280);
  }), bM(j, "sign1", (N, I, D) => {
    N.fillStyle = "#f0c65c", N.fillRect(0, 0, I, D), N.save(), N.translate(120, 128), N.fillStyle = "#f5d47e";
    for (let T = 0; T < 16; T++) N.rotate($A / 16), N.beginPath(), N.moveTo(0, 0), N.lineTo(420, -40), N.lineTo(420, 40), N.fill();
    N.restore(), N.fillStyle = "#e9836c", N.beginPath(), N.ellipse(118, 132, 72, 48, -0.2, 0, $A), N.fill(), N.beginPath(), N.moveTo(175, 118), N.lineTo(222, 82), N.lineTo(214, 160), N.closePath(), N.fill(), N.fillStyle = "#fff", N.beginPath(), N.arc(84, 116, 15, 0, $A), N.fill(), N.fillStyle = "#2c2e35", N.beginPath(), N.arc(80, 116, 8, 0, $A), N.fill(), N.strokeStyle = "#2c2e35", N.lineWidth = 5, N.lineCap = "round", N.beginPath(), N.arc(92, 146, 14, 0.2, 1.9), N.stroke(), N.fillStyle = "#c4614f";
    for (const [T, w] of [[122, 108], [140, 132], [118, 156], [152, 110]]) N.beginPath(), N.arc(T, w, 5, 0, $A), N.fill();
    _A(N, "TIDE", 368, 92, 86, pM, "#e9836c", "#fff", 14, 260), _A(N, "SNACKS", 368, 172, 58, pM, "#35405a", "#fff", 10, 270), N.save(), N.translate(470, 36), N.rotate(0.25), N.fillStyle = "#35405a", AD(N, -44, -16, 88, 32, 10), N.fill(), _A(N, "CRUNCH!", 0, 1, 20, pM, "#f0c65c", null, 0, 80), N.restore();
  }), bM(j, "sign2", (N, I, D) => {
    N.fillStyle = "#f2eee6", N.fillRect(0, 0, I, D), N.fillStyle = "#d9d2f3";
    for (let T = -6; T < 14; T++) N.beginPath(), N.moveTo(T * 44, D), N.lineTo(T * 44 + 22, D), N.lineTo(T * 44 + 122, 0), N.lineTo(T * 44 + 100, 0), N.fill();
    N.save(), N.translate(122, 132), N.rotate(-0.35), N.fillStyle = "#47aea3", AD(N, -44, -108, 88, 216, 44), N.fill(), N.strokeStyle = "#2c2e35", N.lineWidth = 6, N.stroke(), N.fillStyle = "#fff", N.beginPath(), N.ellipse(-16, -20, 13, 17, 0, 0, $A), N.ellipse(16, -20, 13, 17, 0, 0, $A), N.fill(), N.fillStyle = "#2c2e35", N.beginPath(), N.arc(-14, -17, 7, 0, $A), N.arc(18, -17, 7, 0, $A), N.fill(), N.fillStyle = "#e5b94d";
    for (const T of [-78, 78]) for (const w of [-30, 30]) N.beginPath(), N.arc(w, T, 11, 0, $A), N.fill();
    N.restore(), N.save(), N.translate(350, 100), N.rotate(-0.08), _A(N, "SQUIDKID", 0, 0, 70, pM, "#2c2e35", null, 0, 300), N.restore(), N.save(), N.translate(356, 172), N.rotate(-0.08), N.fillStyle = "#e9836c", AD(N, -104, -32, 208, 64, 16), N.fill(), _A(N, "SKATE", 0, 2, 50, pM, "#fff", null, 0, 190), N.restore(), _A(N, "DECKS · WHEELS · GEAR", 350, 228, 16, VM, "#7c70bd", null, 0, 280);
  }), bM(j, "sign3", (N, I, D) => {
    N.fillStyle = "#2f7f78", N.fillRect(0, 0, I, D), N.fillStyle = "#36928a", N.beginPath();
    for (let T = 0; T <= 16; T++) {
      const w = T * 32;
      N.lineTo(w, 220 + Math.sin(T * 1.2) * 10);
    }
    N.lineTo(I, D), N.lineTo(0, D), N.fill(), N.fillStyle = "#f2eee6", AD(N, 64, 92, 104, 118, 18), N.fill(), N.strokeStyle = "#f2eee6", N.lineWidth = 14, N.beginPath(), N.arc(172, 146, 26, -1.2, 1.2), N.stroke(), N.fillStyle = "#c4614f", N.fillRect(64, 128, 104, 22), N.strokeStyle = "#e5b94d", N.lineWidth = 8, N.lineCap = "round";
    for (const T of [92, 118, 144]) N.beginPath(), N.moveTo(T, 80), N.bezierCurveTo(T - 14, 64, T + 14, 52, T, 34), N.stroke();
    _A(N, "BARNACLE", 348, 98, 64, pM, "#f2eee6", null, 0, 300), _A(N, "BREW", 348, 164, 64, pM, "#e5b94d", null, 0, 300), _A(N, "COLD BREW · SODA · SHAKES", 348, 214, 17, VM, "#bfe3dc", null, 0, 300);
  });
  const A = (N, I, D, T) => bM(j, N, (w, O, z) => {
    const C = w.createLinearGradient(0, 0, 0, z);
    C.addColorStop(0, I), C.addColorStop(1, D), w.fillStyle = C, w.fillRect(0, 0, O, z);
    for (let E = 0; E < 4; E++) {
      const P = 30 + E * 118;
      w.fillStyle = "rgba(40,50,70,0.18)", w.fillRect(10, P + 86, O - 20, 8);
      for (let g = 0; g < 3; g++) {
        const Q = 45 + g * 83;
        T(w, Q, P, E, g), w.fillStyle = "#35405a", AD(w, Q - 22, P + 96, 44, 14, 4), w.fill(), w.fillStyle = "#9ff0c8", w.fillRect(Q - 16, P + 101, 32, 4);
      }
    }
    w.fillStyle = "rgba(255,255,255,0.35)", w.beginPath(), w.moveTo(0, 0), w.lineTo(70, 0), w.lineTo(0, 170), w.fill();
  }), M = ["#ec7e68", "#47aea3", "#e5b94d", "#a79be0", "#eea0bf", "#7fc0df"];
  A("vend0", "#e8fbff", "#bfe9f5", (N, I, D, T, w) => {
    const O = M[(T * 3 + w) % M.length];
    N.fillStyle = O, AD(N, I - 20, D + 18, 40, 68, 9), N.fill(), N.fillStyle = "#ffffff", N.fillRect(I - 20, D + 42, 40, 16), N.fillStyle = O, N.beginPath(), N.arc(I, D + 50, 5, 0, $A), N.fill(), N.fillStyle = "#d6dbe0", AD(N, I - 17, D + 12, 34, 8, 3), N.fill();
  }), A("vend1", "#fff8ea", "#fbe7c2", (N, I, D, T, w) => {
    const O = M[(T * 3 + w + 2) % M.length];
    N.strokeStyle = "#9aa0a8", N.lineWidth = 3, N.beginPath();
    for (let z = 0; z < 5; z++) N.ellipse(I, D + 84, 20, 5, 0, 0, nM);
    N.stroke(), N.fillStyle = O, N.beginPath(), N.moveTo(I - 24, D + 22), N.quadraticCurveTo(I, D + 12, I + 24, D + 22), N.lineTo(I + 22, D + 80), N.quadraticCurveTo(I, D + 88, I - 22, D + 80), N.closePath(), N.fill(), N.fillStyle = "#fff", N.beginPath(), N.ellipse(I, D + 50, 14, 11, 0, 0, $A), N.fill(), N.fillStyle = "#e5b94d", N.beginPath(), N.ellipse(I, D + 50, 8, 6, 0.4, 0, $A), N.fill();
  }), bM(j, "side", (N, I, D) => {
    N.fillStyle = "#fff", N.beginPath(), N.moveTo(0, D * 0.62);
    for (let T = 0; T <= 20; T++) N.lineTo(T / 20 * I, D * 0.62 + Math.sin(T * 0.9) * 22);
    N.lineTo(I, D * 0.7);
    for (let T = 20; T >= 0; T--) N.lineTo(T / 20 * I, D * 0.7 + Math.sin(T * 0.9 + 0.8) * 18);
    N.fill();
    for (const [T, w, O] of [[70, 120, 34], [160, 200, 22], [110, 250, 14], [190, 90, 16], [60, 330, 18], [180, 400, 28], [90, 450, 12]]) N.lineWidth = 8, N.strokeStyle = "#fff", N.beginPath(), N.arc(T, w, O, 0, $A), N.stroke();
  }), bM(j, "emblem", (N, I, D) => {
    N.clearRect(0, 0, I, D), N.fillStyle = "#2c2e35", N.fillRect(0, 0, I, 34), N.fillRect(0, D - 44, I, 44), N.fillStyle = "#ffffff", N.fillRect(0, 34, I, 7), N.fillRect(0, D - 51, I, 7), N.save(), N.translate(0, D - 40);
    for (let T = 0; T < 8; T++) N.beginPath(), N.moveTo(T * 32 + 4, 0), N.lineTo(T * 32 + 16, 26), N.lineTo(T * 32 + 28, 0), N.fillStyle = "#ffffff", N.fill();
    N.restore(), N.fillStyle = "#fff", N.beginPath(), N.arc(I / 2, 214, 92, 0, $A), N.fill(), N.globalCompositeOperation = "destination-out", EU(N, I / 2, 222, 70), N.fill(), N.globalCompositeOperation = "source-over", N.fillStyle = "#fff", N.beginPath(), N.ellipse(I / 2 - 20, 214, 13, 17, 0, 0, $A), N.ellipse(I / 2 + 20, 214, 13, 17, 0, 0, $A), N.fill(), N.fillStyle = "#2c2e35", N.beginPath(), N.arc(I / 2 - 18, 218, 7, 0, $A), N.arc(I / 2 + 22, 218, 7, 0, $A), N.fill(), N.strokeStyle = "#fff", N.lineWidth = 10, N.lineCap = "round", N.beginPath();
    for (let T = 0; T <= 16; T++) {
      const w = 28 + T / 16 * (I - 56);
      N.lineTo(w, 356 + Math.sin(T * 1.2) * 10);
    }
    N.stroke(), _A(N, "INK", I / 2, 404, 44, pM, "#fff", null, 0, 200);
  }), bM(j, "head0", (N, I, D) => {
    const T = N.createLinearGradient(0, 0, I, 0);
    T.addColorStop(0, "#2f7f78"), T.addColorStop(1, "#47aea3"), N.fillStyle = T, N.fillRect(0, 0, I, D), _A(N, "FIZZ CURRENT", I / 2, D / 2 + 4, 64, pM, "#ffffff", null, 0, I - 60);
    for (const [w, O, z] of [[26, 30, 9], [44, 80, 6], [486, 40, 8], [470, 92, 5]]) N.strokeStyle = "#d9fff8", N.lineWidth = 4, N.beginPath(), N.arc(w, O, z, 0, $A), N.stroke();
  }), bM(j, "head1", (N, I, D) => {
    const T = N.createLinearGradient(0, 0, I, 0);
    T.addColorStop(0, "#c4614f"), T.addColorStop(1, "#e9836c"), N.fillStyle = T, N.fillRect(0, 0, I, D), _A(N, "TIDE SNACKS", I / 2, D / 2 + 4, 64, pM, "#fff4dc", null, 0, I - 60);
  }), bM(j, "stencil", (N, I, D) => {
    N.clearRect(0, 0, I, D), _A(N, "KRAKEN LINES", I / 2, 62, 66, pM, "#fff", null, 0, I - 30), N.fillStyle = "#fff", N.fillRect(24, 106, I - 48, 8), _A(N, "KRKU 204519  3", 30, 150, 40, VM, "#fff", null, 0, I - 60, "left"), _A(N, "MAX GROSS 30,480 KG", 30, 196, 26, VM, "#fff", null, 0, I - 60, "left"), _A(N, "TARE 2,200 KG", 30, 230, 26, VM, "#fff", null, 0, I - 60, "left");
  }), bM(j, "hazard", (N, I, D) => {
    N.fillStyle = "#fff", N.fillRect(0, 0, I, D), N.fillStyle = "#34363c";
    for (let T = -3; T < 12; T++) N.beginPath(), N.moveTo(T * 64, D), N.lineTo(T * 64 + 32, D), N.lineTo(T * 64 + 32 + D, 0), N.lineTo(T * 64 + D, 0), N.fill();
  }), bM(j, "tag", (N, I, D) => {
    N.clearRect(0, 0, I, D), N.save(), N.translate(I / 2, D / 2), N.rotate(-0.1), _A(N, "SK8 SQUAD", 6, 8, 96, pM, "#2c2e35", "#2c2e35", 26, I - 50), _A(N, "SK8 SQUAD", 0, 0, 96, pM, "#ffffff", "#2c2e35", 12, I - 50), N.restore(), N.fillStyle = "#fff";
    for (const [T, w] of [[60, 40], [460, 210], [470, 50]]) {
      N.beginPath();
      for (let O = 0; O < 8; O++) {
        const z = O / 8 * $A, C = O % 2 ? 7 : 18;
        N.lineTo(T + Math.cos(z) * C, w + Math.sin(z) * C);
      }
      N.fill();
    }
  }), bM(j, "grille", (N, I, D) => {
    N.clearRect(0, 0, I, D), N.strokeStyle = "#fff", N.lineWidth = 7;
    for (let T = 24; T < 124; T += 19) N.beginPath(), N.arc(I / 2, D / 2, T, 0, $A), N.stroke();
    N.lineWidth = 9;
    for (let T = 0; T < 8; T++) {
      const w = T / 8 * $A;
      N.beginPath(), N.moveTo(I / 2 + Math.cos(w) * 20, D / 2 + Math.sin(w) * 20), N.lineTo(I / 2 + Math.cos(w) * 124, D / 2 + Math.sin(w) * 124), N.stroke();
    }
    N.fillStyle = "#fff", N.beginPath(), N.arc(I / 2, D / 2, 22, 0, $A), N.fill();
  }), bM(j, "badge", (N, I, D) => {
    N.fillStyle = "#f2eee6", AD(N, 0, 0, I, D, 18), N.fill(), N.fillStyle = "#35405a", AD(N, 8, 8, I - 16, D - 16, 12), N.fill(), _A(N, "KOOLWAVE", I / 2, D / 2 + 3, 44, pM, "#f2eee6", null, 0, I - 36);
  }), bM(j, "wbadge", (N, I, D) => {
    N.fillStyle = "#2c2e35", AD(N, 0, 0, I, D, 18), N.fill(), _A(N, "BOOMTIDE", I / 2, D / 2 + 3, 46, pM, "#e5b94d", null, 0, I - 36);
  }), bM(j, "white", (N, I, D) => {
    N.fillStyle = "#fff", N.fillRect(0, 0, I, D);
  }), bM(j, "clear", (N, I, D) => {
    N.clearRect(0, 0, I, D);
  }), VS(j);
}
const PU = { navy: "#2f3a57", cream: "#f4ecd8", coral: "#df7c66", coraldk: "#c25f4c", teal: "#3f9f97", tealdk: "#2c7a74", mustard: "#e2b64c", lav: "#a397dc", pink: "#e79ab8", sky: "#7fbcd9", mint: "#98cfb0", ink: "#2c2e35", kraft: "#d2b287", grey: "#8b8f98", red: "#d0584a" };
function tN(j, A, M, N, I, D = 0.06, T = true) {
  j.fillStyle = N, j.fillRect(0, 0, A, M);
  const w = lI(I);
  for (let O = 0; O < A * M / 140; O++) j.fillStyle = w() < 0.5 ? `rgba(255,255,255,${w() * D})` : `rgba(80,60,30,${w() * D})`, j.fillRect(w() * A, w() * M, 1 + w() * 2.5, 1 + w() * 1.5);
  if (T) {
    const O = A * (0.45 + w() * 0.1), z = M * (0.45 + w() * 0.1);
    j.fillStyle = "rgba(255,255,255,0.10)", j.fillRect(O, 0, 2, M), j.fillRect(0, z, A, 2), j.fillStyle = "rgba(60,40,20,0.08)", j.fillRect(O + 2, 0, 2, M), j.fillRect(0, z + 2, A, 2);
  }
}
function WT(j, A, M, N = 0.16) {
  const I = j.createRadialGradient(A / 2, M / 2, Math.min(A, M) * 0.3, A / 2, M / 2, Math.max(A, M) * 0.75);
  I.addColorStop(0, "rgba(90,70,40,0)"), I.addColorStop(1, `rgba(90,70,40,${N})`), j.fillStyle = I, j.fillRect(0, 0, A, M);
}
function zT(j, A, M, N, I, D = 3) {
  const T = lI(I);
  j.beginPath();
  const w = 40;
  for (let O = 0; O <= w; O++) {
    const z = O / w * $A, C = 1 + 0.16 * Math.sin(z * 5 + I) + 0.1 * Math.sin(z * 11 + I * 1.7) + (T() < 0.12 ? 0.22 : 0), E = A + Math.cos(z) * N * C, P = M + Math.sin(z) * N * C;
    O === 0 ? j.moveTo(E, P) : j.lineTo(E, P);
  }
  j.fill();
  for (let O = 0; O < D; O++) {
    const z = A + (T() - 0.5) * N * 1.2, C = N * (0.4 + T() * 0.7), E = N * (0.08 + T() * 0.07);
    j.beginPath(), j.roundRect(z - E, M, E * 2, N * 0.6 + C, E), j.fill(), j.beginPath(), j.arc(z, M + N * 0.6 + C, E * 1.35, 0, $A), j.fill();
  }
  for (let O = 0; O < 7; O++) {
    const z = T() * $A, C = N * (1.25 + T() * 0.5);
    j.beginPath(), j.arc(A + Math.cos(z) * C, M + Math.sin(z) * C, N * (0.04 + T() * 0.07), 0, $A), j.fill();
  }
}
function qS(j, A, M, N, I, D, T, w) {
  j.fillStyle = T;
  for (let O = M, z = 0; O < M + I; O += D, z++) for (let C = A + z % 2 * D * 0.5; C < A + N; C += D) {
    const E = w(C, O) * D * 0.55;
    E > 0.35 && (j.beginPath(), j.arc(C, O, E, 0, $A), j.fill());
  }
}
function dg(j, A, M, N, I, D, T, w = 0) {
  j.beginPath();
  for (let O = 0; O < D * 2; O++) {
    const z = w + O / (D * 2) * $A, C = O % 2 ? I : N;
    j.lineTo(A + Math.cos(z) * C, M + Math.sin(z) * C);
  }
  j.closePath(), j.fillStyle = T, j.fill();
}
function mS(j, A, M, N, I, D, T) {
  j.fillStyle = T;
  for (const w of [-1, 1]) j.beginPath(), j.moveTo(A + w * (N / 2 - 6), M - I / 2 + 8), j.lineTo(A + w * (N / 2 + 22), M - I / 2 + 8), j.lineTo(A + w * (N / 2 + 10), M + 4), j.lineTo(A + w * (N / 2 + 22), M + I / 2 + 8), j.lineTo(A + w * (N / 2 - 6), M + I / 2 + 8), j.fill();
  j.fillStyle = D, j.fillRect(A - N / 2, M - I / 2, N, I);
}
function Nw(j, A, M, N, I, D, T = 0, w = 400) {
  j.beginPath(), j.moveTo(0, A);
  for (let O = 0; O <= M; O += 4) j.lineTo(O, A + Math.sin(O / I * $A + T) * N);
  j.lineTo(M, A + w), j.lineTo(0, A + w), j.closePath(), j.fillStyle = D, j.fill();
}
function FS(j, A, M, N, I = 6) {
  const D = lI(N);
  j.save(), j.globalCompositeOperation = "destination-out", j.fillStyle = "#000";
  for (const T of [0, 1, 2, 3]) {
    j.beginPath();
    const w = T % 2 ? M : A;
    T === 0 ? j.moveTo(0, 0) : T === 1 ? j.moveTo(A, 0) : T === 2 ? j.moveTo(A, M) : j.moveTo(0, M);
    for (let O = 0; O <= w; O += 5) {
      const z = D() * I * (D() < 0.08 ? 2.5 : 1);
      T === 0 ? j.lineTo(O, z) : T === 1 ? j.lineTo(A - z, O) : T === 2 ? j.lineTo(A - O, M - z) : j.lineTo(z, M - O);
    }
    T === 0 ? j.lineTo(A, 0) : T === 1 ? j.lineTo(A, M) : T === 2 ? j.lineTo(0, M) : j.lineTo(0, 0), j.fill();
  }
  j.restore();
}
function Py(j, A, M, N, I, D, T, w) {
  const O = lI(w);
  j.fillStyle = T;
  for (let z = 0; z < I; z++) j.fillRect(A, M + z * D, N * (z === I - 1 ? 0.55 : 0.8 + O() * 0.2), Math.max(2, D * 0.35));
}
function Zi(j, A, M, N, I, D) {
  return j.clearRect(0, 0, A, M), j.fillStyle = N, j.beginPath(), j.arc(A / 2, M / 2, A / 2 - 3, 0, $A), j.fill(), j.fillStyle = I, j.beginPath(), j.arc(A / 2, M / 2, A / 2 - 15, 0, $A), j.fill(), D ? () => {
    j.save(), j.translate(A / 2, M / 2), j.rotate(-nM / 4), j.fillStyle = N, j.fillRect(-A / 2 + 16, -6, A - 32, 12), j.restore();
  } : null;
}
function yy(j, A, M, N, I) {
  j.clearRect(0, 0, A, M);
  const D = (T) => {
    j.beginPath(), j.moveTo(A / 2, 8 + T * 1.9), j.lineTo(A - 6 - T * 1.6, M - 12 - T), j.lineTo(6 + T * 1.6, M - 12 - T), j.closePath();
  };
  j.lineJoin = "round", j.lineWidth = 10, j.strokeStyle = I, j.fillStyle = I, D(0), j.fill(), j.stroke(), j.fillStyle = N, D(9), j.fill();
}
function Iw(j, A, M, N, I, D = "#fff", T = PU.navy) {
  EU(j, A, M, N), j.fillStyle = I, j.fill(), j.fillStyle = D, j.beginPath(), j.ellipse(A - 0.2 * N, M + 0.05 * N, 0.13 * N, 0.17 * N, 0, 0, $A), j.ellipse(A + 0.2 * N, M + 0.05 * N, 0.13 * N, 0.17 * N, 0, 0, $A), j.fill(), j.fillStyle = T, j.beginPath(), j.arc(A - 0.18 * N, M + 0.09 * N, 0.07 * N, 0, $A), j.arc(A + 0.22 * N, M + 0.09 * N, 0.07 * N, 0, $A), j.fill();
}
function VS(j) {
  const A = PU;
  bM(j, "pst0", (z, C, E) => {
    tN(z, C, E, "#f3ead6", 11), z.fillStyle = "#e8dcc0";
    for (let P = -6; P < 16; P++) z.beginPath(), z.moveTo(P * 30, E), z.lineTo(P * 30 + 14, E), z.lineTo(P * 30 + 214, 0), z.lineTo(P * 30 + 200, 0), z.fill();
    z.fillStyle = A.coral, zT(z, 78, 168, 78, 3, 2), z.fillStyle = A.teal, zT(z, 184, 182, 78, 8, 2), qS(z, 0, 90, C, 180, 7, "rgba(255,255,255,0.28)", (P, g) => Math.max(0, 1 - Math.hypot(P - 128, g - 175) / 120)), z.fillStyle = "#fff", z.strokeStyle = A.navy, z.lineWidth = 5, z.lineJoin = "round", z.beginPath(), z.moveTo(140, 96), z.lineTo(108, 170), z.lineTo(134, 170), z.lineTo(112, 248), z.lineTo(160, 156), z.lineTo(134, 156), z.lineTo(156, 96), z.closePath(), z.fill(), z.stroke(), Iw(z, 62, 172, 30, A.cream, A.coraldk, "#fff"), Iw(z, 200, 188, 30, A.cream, A.tealdk, "#fff"), _A(z, "TURF WAR", C / 2, 46, 46, pM, A.navy, A.cream, 10, C - 20), mS(z, C / 2, 282, 170, 44, A.mustard, "#b98f2f"), _A(z, "FINALS", C / 2, 284, 36, pM, A.navy, null, 0, 160), _A(z, "SAT · 8PM", C / 2, 326, 22, VM, A.navy, null, 0, C - 30, "center"), _A(z, "PIER 3 ARENA · FREE ENTRY", C / 2, 348, 12, VM, A.coraldk, null, 0, C - 30), z.fillStyle = A.navy, z.fillRect(0, E - 18, C, 18), _A(z, "LIVE ON SQUID RADIO 88.2 FM", C / 2, E - 9, 10, VM, A.cream, null, 0, C - 20), WT(z, C, E);
  }), bM(j, "pst1", (z, C, E) => {
    tN(z, C, E, A.navy, 21, 0.09), z.fillStyle = "#394670";
    for (let P = 0; P < 9; P++) z.beginPath(), z.arc(128, 150, 40 + P * 16, 0, $A), z.lineWidth = 3, z.strokeStyle = "#3a4872", z.stroke();
    z.fillStyle = A.pink, z.beginPath(), z.arc(128, 146, 92, 0, $A), z.fill(), z.strokeStyle = "#d686a6", z.lineWidth = 2;
    for (let P = 36; P < 90; P += 7) z.beginPath(), z.arc(128, 146, P, 0, $A), z.stroke();
    z.fillStyle = A.mustard, z.beginPath(), z.arc(128, 146, 28, 0, $A), z.fill(), z.fillStyle = A.navy, z.beginPath(), z.arc(128, 146, 5, 0, $A), z.fill(), _A(z, "LTR", 128, 131, 14, pM, A.navy, null, 0, 40), z.strokeStyle = A.coral, z.lineCap = "round", z.lineWidth = 11;
    for (const [P, g, Q] of [[60, 230, -1], [196, 232, 1], [100, 236, -0.4], [156, 236, 0.4]]) z.beginPath(), z.moveTo(P, 214), z.bezierCurveTo(P + Q * 20, 238, g - Q * 30, 250, g + Q * 16, 226), z.stroke();
    _A(z, "LOW TIDE", C / 2, 272, 40, pM, A.cream, null, 0, C - 24), _A(z, "RIOT", C / 2 + 3, 317, 54, pM, "#1d2438", null, 0, C - 24), _A(z, "RIOT", C / 2, 314, 54, pM, A.mustard, null, 0, C - 24), _A(z, "LIVE @ THE SHACK · FRI 9PM", C / 2, 350, 13, VM, A.pink, null, 0, C - 24), _A(z, "+ THE BARNACLES · FREE", C / 2, 368, 11, VM, "#c9cfe0", null, 0, C - 24);
  }), bM(j, "pst2", (z, C, E) => {
    tN(z, C, E, "#f7f5ef", 31, 0.05), _A(z, "LOST", C / 2, 44, 58, pM, A.red, null, 0, C - 30), _A(z, "SQUID", C / 2, 92, 36, pM, A.navy, null, 0, C - 30), z.save(), z.translate(128, 176), z.rotate(-0.035), z.fillStyle = "#fff", z.fillRect(-78, -60, 156, 118), z.fillStyle = "#bfe0ee", z.fillRect(-70, -52, 140, 96), z.fillStyle = "#9fd0e4", z.fillRect(-70, 20, 140, 24), Iw(z, 0, -4, 40, A.teal), z.restore(), _A(z, "HAVE YOU SEEN BLOOP?", C / 2, 256, 15, VM, A.navy, null, 0, C - 24), _A(z, "small · teal · loves fries", C / 2, 276, 12, (g) => VM(g, 600), A.grey, null, 0, C - 30), _A(z, "REWARD!", C / 2, 300, 22, pM, A.red, null, 0, C - 30);
    const P = 256 / 7;
    for (let g = 0; g < 7; g++) z.save(), z.translate(g * P + P / 2, 348), z.rotate(-NM), _A(z, "BLOOP 555-0142", 0, 0, 9, VM, A.navy, null, 0, 64), z.restore();
    z.clearRect(0, 318, C, 2);
    for (let g = 1; g < 7; g++) z.clearRect(g * P - 1, 318, 2, 66);
    z.clearRect(2 * P + 1, 320, P - 2, 64), z.clearRect(5 * P + 1, 320, P - 2, 64);
  }), bM(j, "pst3", (z, C, E) => {
    const P = z.createLinearGradient(0, 0, 0, 230);
    P.addColorStop(0, "#86c3e0"), P.addColorStop(1, "#f2d6a2"), z.fillStyle = P, z.fillRect(0, 0, C, E), z.fillStyle = "rgba(255,240,200,0.5)";
    for (let g = 0; g < 14; g++) z.save(), z.translate(128, 226), z.rotate(-nM + g / 13 * nM), z.fillRect(0, -5, 200, 10), z.restore();
    z.fillStyle = A.mustard, z.beginPath(), z.arc(128, 226, 64, nM, $A), z.fill(), Nw(z, 222, C, 6, 64, A.teal, 0.4), Nw(z, 252, C, 7, 72, "#57b2a8", 1.9), Nw(z, 290, C, 6, 58, A.tealdk, 3.1), _A(z, "SPLASH", C / 2, 58, 50, pM, A.cream, A.navy, 10, C - 20), _A(z, "FEST", C / 2, 112, 58, pM, A.coral, A.navy, 10, C - 20), _A(z, "SUMMER MUSIC & INK", C / 2, 150, 13, VM, A.navy, null, 0, C - 30), _A(z, "JULY 12–14", C / 2, 276, 30, pM, A.cream, null, 0, C - 30), _A(z, "LOW TIDE RIOT · DJ KELPY · THE BARNACLES", C / 2, 318, 10, VM, "#e9f6f3", null, 0, C - 24), _A(z, "TIDEWATER PLAZA", C / 2, 344, 14, VM, A.mustard, null, 0, C - 30), tN(z, 0, 0, "rgba(0,0,0,0)", 1), WT(z, C, E, 0.2);
  }), bM(j, "pst4", (z, C, E) => {
    tN(z, C, E, A.teal, 41, 0.07), z.fillStyle = "#48aaa1";
    for (let P = -6; P < 14; P++) z.beginPath(), z.moveTo(P * 40, E), z.lineTo(P * 40 + 18, E), z.lineTo(P * 40 + 218, 0), z.lineTo(P * 40 + 200, 0), z.fill();
    z.save(), z.translate(150, 214), z.rotate(-0.62), z.fillStyle = A.cream, z.beginPath(), z.ellipse(0, 0, 150, 34, 0, 0, $A), z.fill(), z.fillStyle = A.coral, z.fillRect(-150, -8, 300, 16), z.fillStyle = A.mustard, z.fillRect(-150, -2, 300, 4), z.fillStyle = A.navy, z.beginPath(), z.moveTo(-120, 30), z.lineTo(-100, 58), z.lineTo(-88, 30), z.fill(), z.restore(), _A(z, "SURF", 84, 54, 56, pM, A.cream, A.tealdk, 8, 150), _A(z, "SCHOOL", 90, 102, 34, pM, A.mustard, A.tealdk, 7, 170), z.fillStyle = A.navy, z.fillRect(0, 312, C, 72), _A(z, "LEARN TO RIDE THE SWELL", C / 2, 334, 14, VM, A.cream, null, 0, C - 24), _A(z, "LESSONS DAILY · 7AM · PIER 1", C / 2, 358, 11, VM, A.mint, null, 0, C - 24), WT(z, C, E, 0.18);
  }), bM(j, "pst5", (z, C, E) => {
    tN(z, C, E, "#e8c25c", 51, 0.07), z.save(), z.translate(128, 210), z.fillStyle = "#efd07e";
    for (let g = 0; g < 18; g++) z.rotate($A / 18), z.beginPath(), z.moveTo(0, 0), z.lineTo(300, -26), z.lineTo(300, 26), z.fill();
    z.restore();
    const P = [[-40, -60, -0.25], [-22, -76, -0.12], [-4, -84, 0.02], [14, -78, 0.12], [30, -66, 0.22], [-30, -50, -0.4], [40, -52, 0.35], [6, -70, -0.05]];
    z.save(), z.translate(128, 250);
    for (const [g, Q, x] of P) z.save(), z.translate(g, Q), z.rotate(x), z.fillStyle = "#f7dc8a", z.fillRect(-7, -40, 14, 90), z.fillStyle = "#e6be5c", z.fillRect(3, -40, 4, 90), z.restore();
    z.fillStyle = A.coral, z.beginPath(), z.moveTo(-62, -30), z.lineTo(62, -30), z.lineTo(44, 70), z.lineTo(-44, 70), z.closePath(), z.fill(), z.fillStyle = A.cream;
    for (const g of [-30, 0, 30]) z.beginPath(), z.moveTo(g - 9, -30), z.lineTo(g + 9, -30), z.lineTo(g * 0.7 + 6, 70), z.lineTo(g * 0.7 - 6, 70), z.fill();
    z.fillStyle = "#fff";
    for (let g = 0; g < 18; g++) z.fillRect(-50 + g * 37 % 100, -100 + g * 23 % 60, 3, 3);
    z.restore(), dg(z, 204, 118, 44, 32, 14, A.coraldk, 0.1), _A(z, "2 FOR 1", 204, 118, 20, pM, A.cream, null, 0, 70), _A(z, "SEA SALT", C / 2, 40, 36, pM, A.navy, null, 0, C - 24), _A(z, "FRIES", 104, 88, 48, pM, A.coral, A.cream, 8, 170), z.fillStyle = A.navy, z.fillRect(0, E - 38, C, 38), _A(z, "TIDE SNACKS · KIOSK", C / 2, E - 19, 14, VM, A.mustard, null, 0, C - 24);
  }), bM(j, "pst6", (z, C, E) => {
    tN(z, C, E, "#b3a8e3", 61, 0.06);
    for (let P = 0; P < 2; P++) for (let g = 0; g < 16; g++) z.fillStyle = (P + g) % 2 ? A.navy : A.cream, z.fillRect(g * 16, E - 64 + P * 16, 16, 16);
    z.save(), z.translate(128, 196), z.rotate(-0.3), z.fillStyle = A.navy, z.beginPath(), z.roundRect(-110, -26, 220, 52, 26), z.fill(), z.fillStyle = A.coral, z.fillRect(-60, -26, 18, 52), z.fillStyle = A.mustard, z.fillRect(42, -26, 18, 52), z.fillStyle = A.mustard;
    for (const [P, g] of [[-70, 34], [-40, 34], [40, 34], [70, 34]]) z.beginPath(), z.arc(P, g, 11, 0, $A), z.fill();
    z.restore(), z.strokeStyle = A.cream, z.lineWidth = 5, z.lineCap = "round";
    for (let P = 0; P < 4; P++) z.beginPath(), z.moveTo(12 + P * 6, 150 + P * 16), z.lineTo(40 + P * 6, 150 + P * 16), z.stroke();
    _A(z, "SKATE", C / 2, 52, 52, pM, A.cream, A.navy, 10, C - 20), _A(z, "JAM", C / 2, 114, 70, pM, A.mustard, A.navy, 10, C - 20), _A(z, "BEST TRICK CONTEST", C / 2, 276, 15, VM, A.navy, null, 0, C - 24), _A(z, "SUN 3PM · SQUIDKID SKATE", C / 2, 298, 12, VM, "#5a4f93", null, 0, C - 24), WT(z, C, E, 0.14);
  }), bM(j, "pst7", (z, C, E) => {
    tN(z, C, E, "#e48a73", 71, 0.07), z.strokeStyle = A.cream, z.lineCap = "round";
    for (let P = 0; P < 5; P++) z.lineWidth = 9 - P, z.beginPath(), z.arc(128, 150, 36 + P * 26, -nM * 0.8, -nM * 0.2), z.stroke();
    z.fillStyle = A.navy, z.beginPath(), z.moveTo(128, 126), z.lineTo(112, 206), z.lineTo(144, 206), z.closePath(), z.fill(), z.fillStyle = A.cream, z.beginPath(), z.arc(128, 126, 10, 0, $A), z.fill(), _A(z, "88.2", C / 2 + 4, 262, 72, pM, "#8c3f31", null, 0, C - 20), _A(z, "88.2", C / 2, 258, 72, pM, A.cream, null, 0, C - 20), _A(z, "FM", 220, 222, 22, pM, A.navy, null, 0, 60), _A(z, "SQUID RADIO", C / 2, 44, 32, pM, A.navy, null, 0, C - 24), _A(z, "NONSTOP INK HITS", C / 2, 316, 14, VM, A.navy, null, 0, C - 24), _A(z, "ALL DAY · ALL SPLAT", C / 2, 340, 11, VM, A.cream, null, 0, C - 24), WT(z, C, E);
  }), bM(j, "pst8", (z, C, E) => {
    const P = z.createLinearGradient(0, 0, 0, E);
    P.addColorStop(0, "#2f3a57"), P.addColorStop(1, "#3d5a7a"), z.fillStyle = P, z.fillRect(0, 0, C, E);
    const g = lI(81);
    z.fillStyle = "rgba(244,236,216,0.7)";
    for (let Q = 0; Q < 40; Q++) z.fillRect(g() * C, g() * 150, 2, 2);
    z.fillStyle = A.cream, z.beginPath(), z.arc(196, 70, 22, 0, $A), z.fill(), z.fillStyle = A.cream, z.beginPath(), z.moveTo(40, 226), z.lineTo(216, 226), z.lineTo(196, 262), z.lineTo(60, 262), z.closePath(), z.fill(), z.fillRect(80, 196, 100, 30), z.fillRect(100, 176, 56, 20), z.fillStyle = A.coral, z.fillRect(120, 150, 16, 26), z.fillStyle = A.navy;
    for (let Q = 0; Q < 5; Q++) z.beginPath(), z.arc(94 + Q * 18, 211, 5, 0, $A), z.fill();
    z.strokeStyle = A.mustard, z.lineWidth = 12, z.lineCap = "round", z.beginPath(), z.moveTo(30, 300), z.bezierCurveTo(24, 240, 70, 230, 52, 196), z.stroke(), z.beginPath(), z.arc(52, 188, 8, 0, $A), z.stroke(), Nw(z, 258, C, 7, 50, A.teal, 0.3), Nw(z, 282, C, 6, 44, A.tealdk, 2.1), _A(z, "KRAKEN LINES", C / 2, 36, 32, pM, A.cream, null, 0, C - 24), _A(z, "SAIL THE SEVEN REEFS", C / 2, 118, 16, VM, A.mustard, null, 0, C - 24), _A(z, "DAILY FERRIES · PIER 1", C / 2, 336, 13, VM, A.cream, null, 0, C - 24), _A(z, "kids ride free", C / 2, 358, 11, (Q) => VM(Q, 600), "#bcd6e8", null, 0, C - 24);
  }), bM(j, "pst9", (z, C, E) => {
    tN(z, C, E, "#fbfaf6", 91, 0.04, false), z.strokeStyle = A.red, z.lineWidth = 8, z.strokeRect(8, 8, C - 16, E - 16), z.fillStyle = A.red, z.fillRect(8, 8, C - 16, 58), _A(z, "NOTICE", C / 2, 38, 34, pM, "#fff", null, 0, C - 40), z.save(), z.translate(128, 142), z.fillStyle = A.red, z.beginPath(), z.arc(0, 0, 56, 0, $A), z.fill(), z.fillStyle = "#fff", z.beginPath(), z.arc(0, 0, 45, 0, $A), z.fill(), z.fillStyle = A.navy, z.beginPath(), z.ellipse(-4, 4, 26, 12, -0.2, 0, $A), z.fill(), z.beginPath(), z.arc(22, -6, 9, 0, $A), z.fill(), z.strokeStyle = A.sky, z.lineWidth = 4;
    for (let P = 0; P < 2; P++) {
      z.beginPath();
      for (let g = -40; g <= 40; g += 4) z.lineTo(g, 24 + P * 9 + Math.sin(g * 0.25) * 3);
      z.stroke();
    }
    z.rotate(-nM / 4), z.fillStyle = A.red, z.fillRect(-48, -5, 96, 10), z.restore(), _A(z, "NO SWIMMING", C / 2, 228, 26, VM, A.navy, null, 0, C - 36), _A(z, "IN THE HARBOR DOCK", C / 2, 254, 14, VM, A.navy, null, 0, C - 36), Py(z, 30, 276, C - 60, 5, 12, "#b9bcc4", 92), _A(z, "HARBOR AUTHORITY · BYLAW 14", C / 2, 352, 10, VM, A.grey, null, 0, C - 36);
  }), bM(j, "pst10", (z, C, E) => {
    tN(z, C, E, A.kraft, 101, 0.1), _A(z, "HARBOR", C / 2, 46, 44, pM, A.navy, null, 0, C - 24), _A(z, "MARKET", C / 2, 96, 48, pM, A.coraldk, null, 0, C - 24), z.save(), z.translate(200, 150), z.rotate(0.3), z.strokeStyle = A.red, z.lineWidth = 4, z.beginPath(), z.arc(0, 0, 34, 0, $A), z.stroke(), z.beginPath(), z.arc(0, 0, 28, 0, $A), z.stroke(), _A(z, "SUNDAYS", 0, 1, 12, VM, A.red, null, 0, 52), z.restore(), z.lineWidth = 5, z.lineCap = "round", z.lineJoin = "round", z.strokeStyle = A.tealdk, z.beginPath(), z.ellipse(70, 170, 38, 18, 0, 0, $A), z.stroke(), z.beginPath(), z.moveTo(106, 170), z.lineTo(126, 154), z.lineTo(126, 186), z.closePath(), z.stroke(), z.beginPath(), z.arc(52, 166, 3, 0, $A), z.stroke(), z.strokeStyle = "#b8902c", z.beginPath(), z.ellipse(84, 246, 28, 22, 0.3, 0, $A), z.stroke(), z.beginPath(), z.moveTo(104, 230), z.lineTo(112, 222), z.stroke(), z.strokeStyle = A.coraldk, z.beginPath(), z.ellipse(176, 244, 30, 20, 0, 0, $A), z.stroke();
    for (const P of [-1, 1]) z.beginPath(), z.moveTo(176 + P * 26, 232), z.quadraticCurveTo(176 + P * 44, 210, 176 + P * 30, 204), z.stroke();
    _A(z, "FRESH · LOCAL · SALTY", C / 2, 300, 14, VM, A.navy, null, 0, C - 24), _A(z, "8AM – 2PM · PIER 2", C / 2, 324, 12, VM, "#6a5236", null, 0, C - 24), WT(z, C, E, 0.22);
  }), bM(j, "pst11", (z, C, E) => {
    tN(z, C, E, A.tealdk, 111, 0.08), Nw(z, 300, C, 8, 70, "#358c85", 0.5), z.save(), z.translate(128, 196), z.fillStyle = "rgba(255,255,255,0.35)", z.beginPath(), z.moveTo(-50, -80), z.lineTo(50, -80), z.lineTo(38, 80), z.lineTo(-38, 80), z.closePath(), z.fill();
    const P = z.createLinearGradient(0, -40, 0, 80);
    P.addColorStop(0, "#a9774e"), P.addColorStop(1, "#6e4a2f"), z.fillStyle = P, z.beginPath(), z.moveTo(-45, -40), z.lineTo(45, -40), z.lineTo(38, 78), z.lineTo(-38, 78), z.closePath(), z.fill(), z.fillStyle = "rgba(255,255,255,0.5)";
    for (const [g, Q, x] of [[-16, -24, 0.3], [14, -10, -0.2], [-6, 8, 0.1]]) z.save(), z.translate(g, Q), z.rotate(x), z.fillRect(-12, -12, 24, 24), z.restore();
    z.fillStyle = A.cream, z.fillRect(-56, -90, 112, 12), z.fillStyle = A.coral, z.save(), z.rotate(0.18), z.fillRect(8, -170, 10, 100), z.restore(), z.restore(), dg(z, 62, 96, 34, 25, 12, A.coral, 0.2), _A(z, "NEW!", 62, 96, 16, pM, A.cream, null, 0, 52), _A(z, "COLD BREW", C / 2, 44, 40, pM, A.cream, null, 0, C - 24), _A(z, "BARNACLE BREW", C / 2, 330, 18, pM, A.mustard, null, 0, C - 24), _A(z, "SLOW STEEPED · SEA SALT CARAMEL", C / 2, 356, 10, VM, "#cdebe6", null, 0, C - 24);
  }), bM(j, "pw0", (z, C, E) => {
    tN(z, C, E, "#f3ead6", 121, 0.05), z.fillStyle = A.mustard, zT(z, 108, 124, 92, 5, 3), z.fillStyle = A.lav, zT(z, 420, 70, 50, 9, 1), Iw(z, 108, 118, 52, A.navy, "#fff", A.navy), _A(z, "INK THE TOWN", 336, 88, 50, pM, A.navy, null, 0, 300), _A(z, "TURF WAR · SEASON 3", 336, 140, 26, pM, A.coral, null, 0, 300), _A(z, "NEW STAGES · NEW GEAR · SAME SQUIDS", 336, 180, 13, VM, A.navy, null, 0, 300), z.fillStyle = A.teal, z.fillRect(0, E - 26, C, 26), _A(z, "KELPLINE TERMINAL NOW OPEN", C / 2, E - 13, 12, VM, A.cream, null, 0, C - 40), WT(z, C, E, 0.14);
  }), bM(j, "ferry", (z, C, E) => {
    tN(z, C, E, "#fbfaf6", 131, 0.04, false), z.fillStyle = A.navy, z.fillRect(0, 0, C, 50), _A(z, "FERRY TIMES", 20, 26, 28, pM, A.cream, null, 0, 240, "left"), _A(z, "PIER 1", C - 20, 27, 18, VM, A.mustard, null, 0, 120, "right"), [["SEVEN REEFS", "07:15"], ["KELP ISLE", "08:40"], ["LIGHTHOUSE", "10:05"], ["CORAL BAY", "12:30"], ["SEVEN REEFS", "15:45"], ["LAST FERRY", "19:20"]].forEach(([g, Q], x) => {
      const U = 62 + x * 30;
      x % 2 === 0 && (z.fillStyle = "#e6eef4", z.fillRect(10, U - 2, C - 20, 28)), _A(z, g, 22, U + 12, 15, VM, A.navy, null, 0, 220, "left"), _A(z, Q, C - 22, U + 12, 16, VM, x === 5 ? A.red : A.tealdk, null, 0, 120, "right");
    }), _A(z, "tickets on board · harbor authority", C / 2, E - 12, 10, (g) => VM(g, 600), A.grey, null, 0, C - 30);
  }), bM(j, "torn", (z, C, E) => {
    z.clearRect(0, 0, C, E), [[4, 6, 70, 80, A.coral, "TUR"], [60, 30, 64, 70, A.teal, "FEST"], [8, 96, 56, 90, A.cream, "LOS"], [58, 110, 66, 76, A.mustard, "88"]].forEach(([g, Q, x, U, k, s], v) => {
      z.save(), z.translate(g, Q), z.fillStyle = k, z.fillRect(0, 0, x, U), _A(z, s, x / 2, U * 0.45, 26, pM, v === 2 ? A.red : A.navy, null, 0, x), FS(z, x, U, 140 + v, 9), z.restore();
    });
  });
  const M = (z, C, E, P, g, Q) => bM(j, z, (x, U, k) => {
    x.fillStyle = C, x.fillRect(0, 0, U, k), x.fillStyle = "rgba(255,255,255,0.12)", x.fillRect(0, 0, U, k * 0.45), x.strokeStyle = E, x.lineWidth = 4, x.strokeRect(8, 8, U - 16, k - 16), Q && Q(x, 62, k / 2), _A(x, P, 226, k / 2 - (g ? 10 : 0), 44, pM, E, null, 0, 280), g && _A(x, g, 226, k / 2 + 30, 14, VM, E, null, 0, 280);
  });
  M("cart0", "#eba7c0", A.navy, "CHILLY SCOOPS", "SOFT SERVE · POPS · FLOATS", (z, C, E) => {
    z.fillStyle = "#c9934f", z.beginPath(), z.moveTo(C - 20, E - 6), z.lineTo(C + 20, E - 6), z.lineTo(C, E + 44), z.fill(), z.fillStyle = A.cream, z.beginPath(), z.arc(C, E - 14, 22, 0, $A), z.fill(), z.fillStyle = A.pink, z.beginPath(), z.arc(C + 4, E - 30, 14, 0, $A), z.fill();
  }), M("cart1", A.mustard, A.navy, "SQUID DOGS", "GRILLED · SAUCED · LEGENDARY", (z, C, E) => {
    z.fillStyle = "#e8cf95", z.beginPath(), z.roundRect(C - 42, E - 14, 84, 30, 14), z.fill(), z.fillStyle = A.coral, z.beginPath(), z.roundRect(C - 46, E - 8, 92, 16, 8), z.fill(), z.strokeStyle = A.mustard, z.lineWidth = 3, z.beginPath();
    for (let P = 0; P < 8; P++) z.lineTo(C - 36 + P * 10, E + (P % 2 ? -4 : 3));
    z.stroke();
  }), M("stall0", A.teal, A.cream, "FRESH CATCH", "CAUGHT THIS MORNING", (z, C, E) => {
    z.fillStyle = A.cream, z.beginPath(), z.ellipse(C - 6, E, 34, 16, 0, 0, $A), z.fill(), z.beginPath(), z.moveTo(C + 24, E), z.lineTo(C + 44, E - 16), z.lineTo(C + 44, E + 16), z.fill(), z.fillStyle = A.teal, z.beginPath(), z.arc(C - 24, E - 3, 4, 0, $A), z.fill();
  }), M("stall1", "#8cc49a", A.navy, "HARBOR GREENS", "FRUIT · VEG · HERBS", (z, C, E) => {
    z.fillStyle = A.mustard, z.beginPath(), z.ellipse(C - 12, E + 4, 20, 16, 0.4, 0, $A), z.fill(), z.fillStyle = A.coral, z.beginPath(), z.arc(C + 16, E + 8, 16, 0, $A), z.fill(), z.fillStyle = "#4f9a57", z.beginPath(), z.ellipse(C + 18, E - 12, 8, 4, -0.6, 0, $A), z.fill();
  }), M("stall2", A.lav, A.cream, "SPLAT MERCH", "TEES · CAPS · STICKERS", (z, C, E) => {
    z.fillStyle = A.cream, z.beginPath(), z.moveTo(C - 30, E - 26), z.lineTo(C - 12, E - 30), z.quadraticCurveTo(C, E - 22, C + 12, E - 30), z.lineTo(C + 30, E - 26), z.lineTo(C + 38, E - 10), z.lineTo(C + 24, E - 6), z.lineTo(C + 24, E + 30), z.lineTo(C - 24, E + 30), z.lineTo(C - 24, E - 6), z.lineTo(C - 38, E - 10), z.closePath(), z.fill(), z.fillStyle = A.coral, zT(z, C, E + 6, 10, 4, 0);
  }), bM(j, "chalk", (z, C, E) => {
    z.fillStyle = "#34403d", z.fillRect(0, 0, C, E);
    const P = lI(151);
    for (let x = 0; x < 90; x++) z.fillStyle = `rgba(255,255,255,${0.02 + P() * 0.05})`, z.beginPath(), z.ellipse(P() * C, P() * E, 6 + P() * 30, 2 + P() * 6, P() * nM, 0, $A), z.fill();
    const g = (x, U, k, s, v, S = "center", q = pM) => {
      _A(z, x, U, k, s, q, v, null, 0, C - 30, S);
    };
    g("TODAY", C / 2, 34, 32, "#f3efe4"), [["SQUID DOG", "3.50"], ["SEA FRIES", "2.00"], ["FISH TACO", "4.00"], ["KELP SHAKE", "3.00"], ["FIZZ", "1.50"]].forEach(([x, U], k) => {
      const s = 76 + k * 34;
      g(x, 18, s, 17, "#f3efe4", "left", VM), g(U, C - 18, s, 17, k % 2 ? "#f5d98a" : "#f7b6c8", "right", VM), z.fillStyle = "rgba(243,239,228,0.45)";
      for (let v = 130; v < 196; v += 8) z.fillRect(v, s + 2, 3, 3);
    }), z.strokeStyle = "rgba(243,239,228,0.7)", z.lineWidth = 3, z.strokeRect(6, 6, C - 12, E - 12);
  }), bM(j, "chalk2", (z, C, E) => {
    z.fillStyle = "#34403d", z.fillRect(0, 0, C, E), [["LEMONS", "3 / 1.00"], ["MANGO", "1.50"], ["MELON", "2.50"]].forEach(([g, Q], x) => {
      _A(z, g, 16, 26 + x * 36, 18, VM, "#f3efe4", null, 0, 120, "left"), _A(z, Q, C - 16, 26 + x * 36, 18, VM, "#f5d98a", null, 0, 110, "right");
    }), z.strokeStyle = "rgba(243,239,228,0.6)", z.lineWidth = 3, z.strokeRect(5, 5, C - 10, E - 10);
  }), bM(j, "menu", (z, C, E) => {
    tN(z, C, E, "#fbf3e4", 161, 0.04, false), z.fillStyle = A.pink, z.fillRect(0, 0, C, 38), _A(z, "MENU", C / 2, 20, 26, pM, "#fff", null, 0, C - 20), [[A.pink, "BERRY"], [A.mint, "MINT"], [A.mustard, "MANGO"], [A.lav, "UBE"]].forEach(([g, Q], x) => {
      const U = 32 + x * 64;
      z.fillStyle = "#d9b27a", z.fillRect(U - 3, 110, 6, 26), z.fillStyle = g, z.beginPath(), z.roundRect(U - 18, 52, 36, 62, 16), z.fill(), z.fillStyle = "rgba(255,255,255,0.35)", z.fillRect(U - 12, 58, 6, 44), _A(z, Q, U, 150, 11, VM, A.navy, null, 0, 60), _A(z, "1.50", U, 170, 12, VM, A.coraldk, null, 0, 60);
    });
  }), bM(j, "ice", (z, C, E) => {
    z.fillStyle = "#e9f5fb", z.fillRect(0, 0, C, E), z.fillStyle = A.sky, z.fillRect(0, E - 30, C, 30), _A(z, "ICE", C / 2, 52, 60, pM, "#3d7fb0", "#fff", 8, C - 12), _A(z, "BAGGED · 5 KG", C / 2, E - 15, 11, VM, "#fff", null, 0, C - 12), z.strokeStyle = "#8cc6e2", z.lineWidth = 3;
    for (let P = 0; P < 6; P++) z.beginPath(), z.moveTo(22, 20), z.lineTo(22 + Math.cos(P * nM / 3) * 12, 20 + Math.sin(P * nM / 3) * 12), z.stroke();
  }), bM(j, "mail", (z, C, E) => {
    z.fillStyle = A.coraldk, z.fillRect(0, 0, C, E), z.fillStyle = "#fff", z.beginPath(), z.roundRect(14, 36, C - 28, 56, 8), z.fill(), _A(z, "POST", C / 2, 20, 22, pM, "#fff", null, 0, C - 16), _A(z, "LAST PICKUP", C / 2, 52, 11, VM, A.navy, null, 0, C - 30), _A(z, "5:30 PM", C / 2, 74, 18, VM, A.coraldk, null, 0, C - 30), _A(z, "HARBOR MAIL", C / 2, 110, 11, VM, "#fbe3dc", null, 0, C - 16);
  }), bM(j, "cab", (z, C, E) => {
    z.fillStyle = "#e8e4d8", z.fillRect(0, 0, C, E), z.fillStyle = A.navy, z.fillRect(0, 0, 110, E), z.fillStyle = A.mustard, z.beginPath(), z.moveTo(64, 18), z.lineTo(36, 70), z.lineTo(56, 70), z.lineTo(44, 112), z.lineTo(78, 54), z.lineTo(58, 54), z.lineTo(72, 18), z.closePath(), z.fill(), _A(z, "HARBOR POWER", 244, 50, 34, pM, A.navy, null, 0, 250), _A(z, "SUBSTATION 7 · AUTHORISED ONLY", 244, 90, 13, VM, "#6b6f7a", null, 0, 250);
  });
  const N = (z, C, E, P, g, Q) => bM(j, z, (x, U, k) => {
    x.clearRect(0, 0, U, k), x.save(), x.translate(U / 2, k / 2), x.rotate(nM / 4), x.fillStyle = "#fff", x.fillRect(-44, -44, 88, 88), x.fillStyle = C, x.fillRect(-40, -40, 80, 80), x.strokeStyle = E, x.lineWidth = 2, x.strokeRect(-36, -36, 72, 72), x.restore(), Q(x, U / 2, k / 2 - 22), _A(x, P, U / 2, k / 2 + 10, 11, VM, E, null, 0, 70), _A(x, g, U / 2, k / 2 + 34, 16, pM, E, null, 0, 30);
  });
  N("dia0", A.red, "#fff", "FLAMMABLE", "2", (z, C, E) => {
    z.fillStyle = "#fff", z.beginPath(), z.moveTo(C, E - 18), z.quadraticCurveTo(C + 16, E, C + 8, E + 12), z.quadraticCurveTo(C, E + 16, C - 8, E + 12), z.quadraticCurveTo(C - 14, E, C, E - 18), z.fill();
  }), N("dia1", "#4e9a64", "#fff", "COMPRESSED", "2", (z, C, E) => {
    z.fillStyle = "#fff", z.beginPath(), z.roundRect(C - 7, E - 16, 14, 32, 6), z.fill(), z.fillRect(C - 3, E - 21, 6, 6);
  }), N("dia2", A.mustard, A.ink, "OXIDIZER", "5.1", (z, C, E) => {
    z.strokeStyle = A.ink, z.lineWidth = 3, z.beginPath(), z.arc(C, E + 6, 8, 0, $A), z.stroke(), z.fillStyle = A.ink, z.beginPath(), z.moveTo(C, E - 18), z.quadraticCurveTo(C + 10, E - 4, C, E + 2), z.quadraticCurveTo(C - 10, E - 4, C, E - 18), z.fill();
  });
  const I = (z, C, E, P, g) => bM(j, z, (Q, x, U) => {
    tN(Q, x, U, "#f1efe8", g, 0.04, false), _A(Q, C, x / 2, 14, 15, pM, A.ink, null, 0, x - 8), Q.fillStyle = A.ink, Q.fillRect(6, 25, x - 12, 2), _A(Q, E, x / 2, 40, 14, VM, A.ink, null, 0, x - 10), Q.fillStyle = P, Q.fillRect(8, 54, 58, 44), Q.fillStyle = "rgba(255,255,255,0.5)", Q.beginPath(), Q.arc(37, 76, 12, 0, $A), Q.fill(), Py(Q, 72, 56, 48, 6, 7, "#9a9ca2", g + 1), Py(Q, 8, 104, x - 16, 3, 7, "#9a9ca2", g + 2);
  });
  I("news0", "HARBOR DAILY", "TURF RECORD!", A.coral, 171), I("news1", "INK WEEKLY", "NEW SEASON", A.teal, 181), bM(j, "qr", (z, C, E) => {
    z.fillStyle = "#fff", z.beginPath(), z.roundRect(0, 0, C, E, 14), z.fill(), z.fillStyle = A.tealdk, z.fillRect(0, 0, C, 30), _A(z, "RIDE ME", C / 2, 15, 16, pM, "#fff", null, 0, C - 10);
    const P = lI(191);
    z.fillStyle = A.ink;
    for (let g = 0; g < 9; g++) for (let Q = 0; Q < 9; Q++) P() < 0.5 && z.fillRect(28 + Q * 8, 38 + g * 8, 8, 8);
    for (const [g, Q] of [[28, 38], [76, 38], [28, 86]]) z.fillStyle = A.ink, z.fillRect(g, Q, 24, 24), z.fillStyle = "#fff", z.fillRect(g + 4, Q + 4, 16, 16), z.fillStyle = A.ink, z.fillRect(g + 8, Q + 8, 8, 8);
    _A(z, "KELPWHEEL", C / 2, E - 12, 11, VM, A.tealdk, null, 0, C - 10);
  }), bM(j, "manhole", (z, C, E) => {
    z.clearRect(0, 0, C, E);
    const P = C / 2;
    z.fillStyle = "#d4d4d4", z.beginPath(), z.arc(P, P, P - 2, 0, $A), z.fill(), z.fillStyle = "#9a9a9a", z.beginPath(), z.arc(P, P, P - 12, 0, $A), z.fill(), z.fillStyle = "#c8c8c8", z.beginPath(), z.arc(P, P, P - 18, 0, $A), z.fill(), z.save(), z.beginPath(), z.arc(P, P, 78, 0, $A), z.clip();
    for (let Q = -8; Q <= 8; Q++) for (let x = -8; x <= 8; x++) z.fillStyle = (x + Q) % 2 ? "#a6a6a6" : "#dcdcdc", z.fillRect(P + x * 12 - 4, P + Q * 12 - 4, 8, 8);
    z.restore(), z.fillStyle = "#b4b4b4", z.beginPath(), z.arc(P, P, 40, 0, $A), z.fill(), Iw(z, P, P + 2, 30, "#e2e2e2", "#8a8a8a", "#e2e2e2"), z.font = VM(15), z.fillStyle = "#e8e8e8", z.textAlign = "center", z.textBaseline = "middle";
    const g = "INKWAVE HARBOR · SEWER · INKWAVE HARBOR · SEWER · ";
    for (let Q = 0; Q < g.length; Q++) {
      const x = Q / g.length * $A - NM;
      z.save(), z.translate(P + Math.cos(x) * 95, P + Math.sin(x) * 95), z.rotate(x + NM), z.fillText(g[Q], 0, 0), z.restore();
    }
  }), bM(j, "gully", (z, C, E) => {
    z.clearRect(0, 0, C, E), z.fillStyle = "#fff", z.fillRect(0, 0, C, 10), z.fillRect(0, E - 10, C, 10), z.fillRect(0, 0, 10, E), z.fillRect(C - 10, 0, 10, E);
    for (let P = 1; P < 8; P++) z.fillRect(P * 16 - 3, 0, 6, E);
    z.fillRect(0, E / 2 - 4, C, 8);
  }), bM(j, "gauge", (z, C, E) => {
    z.fillStyle = "#f4f2ea", z.fillRect(0, 0, C, E);
    for (let P = 0; P <= 32; P++) {
      const g = 8 + P * 7.5;
      z.fillStyle = P % 8 === 0 ? A.red : A.ink, z.fillRect(0, g - 1, P % 4 === 0 ? 30 : 16, 3);
    }
    for (let P = 1; P <= 4; P++) _A(z, (P * 0.5).toFixed(1), 46, 8 + P * 60, 13, VM, A.ink, null, 0, 30);
    z.strokeStyle = A.ink, z.lineWidth = 3, z.strokeRect(1, 1, C - 2, E - 2);
  }), bM(j, "scuff", (z, C, E) => {
    z.clearRect(0, 0, C, E);
    const P = lI(201);
    for (let g = 0; g < 14; g++) {
      z.strokeStyle = `rgba(40,40,46,${0.5 + P() * 0.4})`, z.lineWidth = 2 + P() * 5, z.lineCap = "round", z.beginPath();
      const Q = P() * E, x = P() * 30;
      z.moveTo(x, Q), z.quadraticCurveTo(C / 2, Q + (P() - 0.5) * 30, x + 60 + P() * 60, Q + (P() - 0.5) * 20), z.stroke();
    }
  });
  const D = (z, C) => bM(j, "stk" + z, (E, P, g) => {
    E.clearRect(0, 0, P, g), E.save(), E.translate(P / 2, g / 2), C(E), E.restore();
  }), T = (z, C, E) => {
    z.fillStyle = E, z.beginPath(), z.arc(0, 0, C, 0, $A), z.fill();
  };
  D(0, (z) => {
    T(z, 29, "#fff"), T(z, 25, A.teal), Iw(z, 0, 2, 18, A.cream);
  }), D(1, (z) => {
    dg(z, 0, 0, 29, 13, 5, "#fff", -NM), dg(z, 0, 0, 24, 10, 5, A.mustard, -NM);
  }), D(2, (z) => {
    z.fillStyle = "#fff", z.beginPath(), z.roundRect(-29, -20, 58, 36, 10), z.fill(), z.beginPath(), z.moveTo(-10, 14), z.lineTo(-18, 28), z.lineTo(2, 14), z.fill(), z.fillStyle = A.coral, z.beginPath(), z.roundRect(-25, -16, 50, 28, 8), z.fill(), _A(z, "INK!", 0, -2, 18, pM, "#fff", null, 0, 44);
  }), D(3, (z) => {
    T(z, 29, "#fff"), T(z, 25, A.ink), z.fillStyle = A.mustard, z.beginPath(), z.moveTo(4, -18), z.lineTo(-9, 3), z.lineTo(0, 3), z.lineTo(-4, 18), z.lineTo(10, -3), z.lineTo(1, -3), z.closePath(), z.fill();
  }), D(4, (z) => {
    z.fillStyle = "#fff", z.beginPath(), z.moveTo(0, 26), z.bezierCurveTo(-40, -2, -18, -34, 0, -12), z.bezierCurveTo(18, -34, 40, -2, 0, 26), z.fill(), z.fillStyle = A.pink, z.beginPath(), z.moveTo(0, 20), z.bezierCurveTo(-32, -2, -16, -27, 0, -8), z.bezierCurveTo(16, -27, 32, -2, 0, 20), z.fill();
  }), D(5, (z) => {
    z.fillStyle = A.navy, z.beginPath(), z.roundRect(-30, -16, 60, 32, 8), z.fill(), _A(z, "SK8", 0, 1, 22, pM, A.mustard, null, 0, 52);
  }), D(6, (z) => {
    z.fillStyle = "#fff", z.beginPath(), z.ellipse(0, 0, 30, 20, 0, 0, $A), z.fill(), T(z, 13, A.lav), T(z, 6, A.ink), z.fillStyle = "#fff", z.beginPath(), z.arc(4, -4, 3, 0, $A), z.fill();
  }), D(7, (z) => {
    T(z, 29, "#fff"), T(z, 25, A.sky), z.strokeStyle = "#fff", z.lineWidth = 4;
    for (let C = 0; C < 3; C++) {
      z.beginPath();
      for (let E = -18; E <= 18; E += 3) z.lineTo(E, -8 + C * 9 + Math.sin(E * 0.35) * 3);
      z.stroke();
    }
  }), D(8, (z) => {
    z.fillStyle = "#fff", zT(z, 0, 0, 20, 12, 0), z.fillStyle = A.mint, zT(z, 0, 0, 16, 12, 0);
  }), D(9, (z) => {
    T(z, 29, A.coral), _A(z, "88.2", 0, 0, 18, pM, "#fff", null, 0, 50);
  }), D(10, (z) => {
    z.fillStyle = "#fff", z.fillRect(-28, -14, 56, 28), z.fillStyle = A.ink;
    const C = lI(210);
    for (let E = -24; E < 24; E += 2) C() < 0.6 && z.fillRect(E, -10, C() < 0.3 ? 2 : 1, 16);
  }), D(11, (z) => {
    T(z, 29, A.mustard), z.fillStyle = A.ink, z.beginPath(), z.arc(-9, -6, 4, 0, $A), z.arc(9, -6, 4, 0, $A), z.fill(), z.strokeStyle = A.ink, z.lineWidth = 4, z.beginPath(), z.arc(0, 2, 14, 0.3, nM - 0.3), z.stroke();
  }), D(12, (z) => {
    z.fillStyle = "#fff", z.beginPath(), z.ellipse(-4, 0, 24, 15, 0, 0, $A), z.fill(), z.beginPath(), z.moveTo(14, 0), z.lineTo(30, -14), z.lineTo(30, 14), z.fill(), z.fillStyle = A.teal, z.beginPath(), z.ellipse(-4, 0, 20, 11, 0, 0, $A), z.fill(), z.beginPath(), z.moveTo(14, 0), z.lineTo(26, -9), z.lineTo(26, 9), z.fill();
  }), D(13, (z) => {
    z.fillStyle = "#fff", z.beginPath(), z.moveTo(-28, 16), z.lineTo(-28, -12), z.lineTo(-14, 2), z.lineTo(0, -20), z.lineTo(14, 2), z.lineTo(28, -12), z.lineTo(28, 16), z.fill(), z.fillStyle = A.mustard, z.beginPath(), z.moveTo(-24, 12), z.lineTo(-24, -4), z.lineTo(-13, 7), z.lineTo(0, -13), z.lineTo(13, 7), z.lineTo(24, -4), z.lineTo(24, 12), z.fill();
  }), D(14, (z) => {
    T(z, 29, A.ink), _A(z, "LTR", 0, 1, 20, pM, A.pink, null, 0, 48);
  }), D(15, (z) => {
    z.fillStyle = "#fff", z.beginPath(), z.moveTo(-26, -10), z.lineTo(6, -10), z.lineTo(6, -24), z.lineTo(30, 0), z.lineTo(6, 24), z.lineTo(6, 10), z.lineTo(-26, 10), z.fill(), z.fillStyle = A.coraldk, z.beginPath(), z.moveTo(-22, -6), z.lineTo(10, -6), z.lineTo(10, -16), z.lineTo(24, 0), z.lineTo(10, 16), z.lineTo(10, 6), z.lineTo(-22, 6), z.fill();
  }), bM(j, "sg0", (z, C, E) => {
    const P = Zi(z, C, E, A.red, "#fff", true);
    z.fillStyle = A.navy, z.beginPath(), z.ellipse(C / 2 - 6, E / 2 + 2, 26, 12, -0.25, 0, $A), z.fill(), z.beginPath(), z.arc(C / 2 + 22, E / 2 - 10, 9, 0, $A), z.fill(), z.strokeStyle = A.sky, z.lineWidth = 4, z.beginPath();
    for (let g = -32; g <= 32; g += 4) z.lineTo(C / 2 + g, E / 2 + 26 + Math.sin(g * 0.3) * 3);
    z.stroke(), P();
  }), bM(j, "sg1", (z, C, E) => {
    yy(z, C, E, "#f1c95c", A.ink), z.fillStyle = A.ink, z.beginPath(), z.arc(58, 60, 7, 0, $A), z.fill(), z.lineWidth = 6, z.lineCap = "round", z.strokeStyle = A.ink, z.beginPath(), z.moveTo(60, 68), z.lineTo(72, 84), z.lineTo(86, 80), z.moveTo(72, 84), z.lineTo(62, 96), z.moveTo(60, 72), z.lineTo(46, 76), z.stroke(), z.fillStyle = A.teal, z.beginPath(), z.ellipse(64, 102, 22, 5, 0, 0, $A), z.fill();
  }), bM(j, "sg2", (z, C, E) => {
    yy(z, C, E, "#f1c95c", A.ink), z.fillStyle = A.ink, z.beginPath(), z.moveTo(70, 42), z.lineTo(52, 78), z.lineTo(64, 78), z.lineTo(56, 104), z.lineTo(78, 68), z.lineTo(66, 68), z.lineTo(76, 42), z.closePath(), z.fill();
  }), bM(j, "sg3", (z, C, E) => {
    z.fillStyle = "#fff", z.fillRect(0, 0, C, E), z.fillStyle = A.red, z.fillRect(0, 0, C, 44), z.fillStyle = "#fff", z.beginPath(), z.ellipse(C / 2, 22, 52, 15, 0, 0, $A), z.fill(), _A(z, "DANGER", C / 2, 23, 20, pM, A.red, null, 0, 96), _A(z, "DEEP", C / 2, 70, 26, pM, A.ink, null, 0, 110), _A(z, "WATER", C / 2, 102, 24, pM, A.ink, null, 0, 110), z.strokeStyle = A.ink, z.lineWidth = 4, z.strokeRect(2, 2, C - 4, E - 4);
  }), bM(j, "sg4", (z, C, E) => {
    z.fillStyle = "#fff", z.beginPath(), z.roundRect(0, 0, C, E, 12), z.fill(), z.fillStyle = "#3f6fb0", z.beginPath(), z.roundRect(6, 6, C - 12, E - 12, 9), z.fill(), _A(z, "P", C / 2, 52, 68, pM, "#fff", null, 0, 90), _A(z, "2 HR", C / 2, 104, 20, VM, "#fff", null, 0, 100);
  }), bM(j, "sg5", (z, C, E) => {
    Zi(z, C, E, A.red, A.red, false), z.fillStyle = "#fff", z.fillRect(22, E / 2 - 12, C - 44, 24);
  }), bM(j, "sg6", (z, C, E) => {
    z.clearRect(0, 0, C, E), z.save(), z.translate(C / 2, E / 2), z.rotate(nM / 4), z.fillStyle = A.ink, z.fillRect(-44, -44, 88, 88), z.fillStyle = "#f1c95c", z.fillRect(-39, -39, 78, 78), z.restore(), z.fillStyle = A.teal, zT(z, C / 2, E / 2 - 8, 16, 21, 2), _A(z, "WET INK", C / 2, E / 2 + 30, 12, VM, A.ink, null, 0, 70);
  }), bM(j, "sg7", (z, C, E) => {
    yy(z, C, E, "#fff", A.red), z.fillStyle = A.ink, z.beginPath(), z.moveTo(64, 38), z.lineTo(56, 50), z.lineTo(72, 50), z.fill(), z.beginPath(), z.moveTo(64, 100), z.lineTo(56, 88), z.lineTo(72, 88), z.fill(), _A(z, "2.0 m", 64, 70, 20, VM, A.ink, null, 0, 70);
  });
  const w = (z, C, E, P, g) => bM(j, "bl" + z, (Q, x, U) => {
    Q.clearRect(0, 0, x, U), Q.fillStyle = P, Q.beginPath(), E ? (Q.moveTo(4, 4), Q.lineTo(x - 34, 4), Q.lineTo(x - 4, U / 2), Q.lineTo(x - 34, U - 4), Q.lineTo(4, U - 4)) : (Q.moveTo(x - 4, 4), Q.lineTo(34, 4), Q.lineTo(4, U / 2), Q.lineTo(34, U - 4), Q.lineTo(x - 4, U - 4)), Q.closePath(), Q.fill(), Q.strokeStyle = g, Q.lineWidth = 3, Q.stroke(), _A(Q, C, E ? (x - 30) / 2 + 4 : (x + 30) / 2 - 4, U / 2 + 2, 30, pM, g, null, 0, x - 60);
  });
  w(0, "PIER 3", false, A.cream, A.navy), w(1, "FERRY", true, A.cream, A.navy), w(2, "SKATE PARK", true, A.teal, A.cream), w(3, "BEACH", false, A.mustard, A.navy), w(4, "MARKET", true, A.coral, A.cream), w(5, "TERMINAL B", false, A.navy, A.cream), w(6, "LIGHTHOUSE", true, A.cream, A.navy), w(7, "KELP ISLE", false, A.teal, A.cream);
  const O = (z, C, E, P, g) => bM(j, "lb" + z, (Q, x, U) => {
    if (Q.fillStyle = E, Q.fillRect(0, 0, x, U), g) {
      Q.fillStyle = P;
      for (let k = -2; k < 20; k++) Q.beginPath(), Q.moveTo(k * 12, U), Q.lineTo(k * 12 + 6, U), Q.lineTo(k * 12 + 6 + U, 0), Q.lineTo(k * 12 + U, 0), Q.fill();
      Q.fillStyle = E, Q.fillRect(12, 4, x - 24, U - 8);
    }
    _A(Q, C, x / 2, U / 2 + 1, 16, VM, P, null, 0, x - 26);
  });
  O(0, "DANGER 400V", "#f1c95c", A.ink, true), O(1, "POTABLE WATER", "#3f6fb0", "#fff"), O(2, "PROPANE", A.red, "#fff"), O(3, "FIRE HOSE", A.red, "#fff"), O(4, "NO SMOKING", "#fff", A.red), O(5, "SQD · 042", "#fbfaf4", A.navy), O(6, "KEEP CLEAR", "#f1c95c", A.ink, true), O(7, "CLEARANCE 2.0 M", "#fff", A.ink), O(8, "KRKU 882130", "#fff", A.ink), O(9, "SERVICE 24H", A.navy, A.cream), O(10, "FIRE INLET", A.red, "#fff"), O(11, "BAIT · ICE · TACKLE", A.teal, A.cream), O(12, "MIND THE GAP", "#f1c95c", A.ink, true), O(13, "MOORING 12", "#fff", A.navy), O(14, "NO PARKING", "#fff", A.red), O(15, "WASH DOWN", "#3f6fb0", "#fff");
}
function Wi(j, A, M, N = false) {
  const I = document.createElement("canvas");
  I.width = j, I.height = A, M(I.getContext("2d"), j, A);
  const D = new mw(I);
  return D.colorSpace = Tj, D.anisotropy = 8, N && (D.wrapS = D.wrapT = FN), D;
}
const yU = `uniform float uTime;
attribute float flex;
attribute vec3 wave;
`, xU = `
  vec3 ipos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float cph = ipos.x * 0.83 + ipos.z * 0.61 + ipos.y * 0.37;
  float ca = uTime * wave.x + cph + position.x * wave.y;
  float cb = uTime * wave.x * 2.3 + cph * 1.7 + position.y * 3.0;
  float cw = sin(ca) + 0.35 * sin(cb);
`;
function tS(j, A) {
  const M = new yj({ map: j, roughness: 0.82, metalness: 0, side: hj });
  return M.onBeforeCompile = (N) => {
    N.uniforms.uTime = A, N.vertexShader = yU + N.vertexShader.replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>
        ${xU}
        objectNormal = normalize(objectNormal + vec3(-flex * wave.z * wave.y * cos(ca), -flex * wave.z * 1.05 * cos(cb), 0.0));`).replace("#include <begin_vertex>", `#include <begin_vertex>
        transformed.z += flex * wave.z * cw;`), N.fragmentShader = N.fragmentShader.replace("#include <map_fragment>", `vec4 clothTx = texture2D(map, vMapUv);
#if defined( USE_COLOR )
 diffuseColor.rgb *= vColor.rgb;
#endif
 diffuseColor.rgb = mix(diffuseColor.rgb, clothTx.rgb, clothTx.a);`).replace("#include <color_fragment>", "");
  }, M;
}
function bS(j) {
  const A = new eC({ depthPacking: rE, side: hj });
  return A.onBeforeCompile = (M) => {
    M.uniforms.uTime = j, M.vertexShader = yU + M.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      ${xU}
      transformed.z += flex * wave.z * cw;`);
  }, A;
}
function lS() {
  const M = new KI(0.28, 0.34, 2, 4), N = M.attributes.position, I = N.count, D = new Float32Array(I), T = new Float32Array(I * 3), w = M.attributes.uv, O = vQ("clear");
  for (let z = 0; z < I; z++) {
    const C = N.getY(z) - 0.17, E = -C / 0.34;
    N.setXY(z, N.getX(z) * (1 - E), C), D[z] = Math.pow(E, 1.2), T[z * 3] = 3.4, T[z * 3 + 1] = 5, T[z * 3 + 2] = 0.055, w.setXY(z, (O[0] + O[2]) / 2, (O[1] + O[3]) / 2);
  }
  return M.setAttribute("flex", new dM(D, 1)), M.setAttribute("wave", new dM(T, 3)), M.computeVertexNormals(), M;
}
function dS(j, A) {
  const M = new KI(j, A, 4, 10), N = M.attributes.position, I = N.count, D = M.attributes.uv, T = vQ("emblem", 2), w = new Float32Array(I), O = new Float32Array(I * 3);
  for (let z = 0; z < I; z++) {
    const C = N.getY(z) - A / 2, E = -C / A;
    N.setY(z, C), w[z] = Math.pow(E, 1.15), O[z * 3] = 2.1, O[z * 3 + 1] = 3.2, O[z * 3 + 2] = 0.075, D.setXY(z, T[0] + D.getX(z) * (T[2] - T[0]), T[1] + D.getY(z) * (T[3] - T[1]));
  }
  return M.setAttribute("flex", new dM(w, 1)), M.setAttribute("wave", new dM(O, 3)), M;
}
const BD = new DA(), Ki = new Nj();
function SQ(j) {
  let A = 0, M = 0;
  for (const E of j) {
    const P = E.g.attributes.position.count;
    A += P, M += E.g.index ? E.g.index.count : P;
  }
  const N = new Float32Array(A * 3), I = new Float32Array(A * 3), D = new Float32Array(A * 3), T = new Float32Array(A * 2), w = A > 65535 ? new Uint32Array(M) : new Uint16Array(M);
  let O = 0, z = 0;
  for (const E of j) {
    const P = E.g, g = P.attributes.position, Q = P.attributes.normal, x = P.attributes.uv, U = P.attributes.color;
    Ki.getNormalMatrix(E.m);
    const k = E.m.determinant() < 0, s = E.c.r, v = E.c.g, S = E.c.b;
    for (let q = 0; q < g.count; q++) {
      BD.fromBufferAttribute(g, q).applyMatrix4(E.m);
      const c = (O + q) * 3;
      N[c] = BD.x, N[c + 1] = BD.y, N[c + 2] = BD.z;
      let G = 1;
      if (E.ao != null) {
        const h = Math.max(0, BD.y - E.ao), X = Math.min(1, h / 0.55);
        G = 0.72 + 0.28 * X * X * (3 - 2 * X);
      }
      BD.fromBufferAttribute(Q, q).applyMatrix3(Ki).normalize(), I[c] = BD.x, I[c + 1] = BD.y, I[c + 2] = BD.z;
      const r = U ? U.getX(q) : 1, t = U ? U.getY(q) : 1, p = U ? U.getZ(q) : 1;
      D[c] = s * r * G, D[c + 1] = v * t * G, D[c + 2] = S * p * G;
      const f = (O + q) * 2;
      if (E.uv) {
        const h = E.uv;
        T[f] = h[0] + x.getX(q) * (h[2] - h[0]), T[f + 1] = h[1] + x.getY(q) * (h[3] - h[1]);
      } else E.uvs ? (T[f] = x.getX(q) * E.uvs[0], T[f + 1] = x.getY(q) * E.uvs[1]) : (T[f] = CE[0], T[f + 1] = CE[1]);
    }
    if (P.index) {
      const q = P.index.array;
      for (let c = 0; c < q.length; c += 3) w[z++] = q[c] + O, k ? (w[z++] = q[c + 2] + O, w[z++] = q[c + 1] + O) : (w[z++] = q[c + 1] + O, w[z++] = q[c + 2] + O);
    } else for (let q = 0; q < g.count; q += 3) w[z++] = O + q, w[z++] = O + q + (k ? 2 : 1), w[z++] = O + q + (k ? 1 : 2);
    O += g.count;
  }
  const C = new FM();
  return C.setAttribute("position", new dM(N, 3)), C.setAttribute("normal", new dM(I, 3)), C.setAttribute("color", new dM(D, 3)), C.setAttribute("uv", new dM(T, 2)), C.setIndex(new dM(w, 1)), C.computeBoundingSphere(), C.computeBoundingBox(), C;
}
const g4 = (j) => (j.index ? j.index.count : j.attributes.position.count) / 3, JS = new nj(), nS = new mj(), ZS = new DA(), WS = new DA();
function iT(j, A, M, N = 0, I = 0, D = 0, T = 1, w = 1, O = 1) {
  return new YM().compose(ZS.set(j, A, M), nS.setFromEuler(JS.set(N, I, D, "YXZ")), WS.set(T, w, O));
}
class KS {
  constructor(A) {
    this.k = A, this.stack = [new YM()], this.base = new YM(), this.cols = [], this.aoBase = 0, this.rng = Math.random, this.tris = 0;
  }
  begin(A, M, N, I, D) {
    this.base = iT(A[0], A[1], A[2], 0, M, 0, N, N, N), this.stack = [new YM()], this.cols = [], this.aoBase = D ? A[1] : null, this.rng = lI(I), this.scale = N;
  }
  get top() {
    return this.stack[this.stack.length - 1];
  }
  push(A = 0, M = 0, N = 0, I = 0, D = 0, T = 0, w = 1) {
    this.stack.push(this.top.clone().multiply(iT(A, M, N, D, I, T, w, w, w)));
  }
  pop() {
    this.stack.pop();
  }
  seg(A) {
    return Math.max(3, Math.round(A * this.k.qf));
  }
  r(A = 0, M = 1) {
    return A + (M - A) * this.rng();
  }
  _m(A, M, N, I) {
    const D = I.s ?? 1;
    return this.base.clone().multiply(this.top).multiply(iT(A, M, N, I.rx || 0, I.ry || 0, I.rz || 0, I.sx ?? D, I.sy ?? D, I.sz ?? D));
  }
  add(A, M, N, I, D, T, w = {}) {
    let O = Wj(N);
    w.glow && (O = O.clone().multiplyScalar(w.glow)), this.k._push(A, { g: M, m: this._m(I, D, T, w), c: O, uv: w.uv || null, uvs: w.uvs || null, ao: w.ao === false || A.startsWith("glow") || A.startsWith("blob") ? null : this.aoBase }), this.tris += g4(M);
  }
  box(A, M, N, I, D, T, w, O, z = {}) {
    const C = z.r ?? Math.min(0.045, Math.min(N, I, D) * 0.22);
    this.add(A, z.round ? vj.rbox(N, I, D, C) : vj.cbox(N, I, D, C), M, T, w, O, z);
  }
  cyl(A, M, N, I, D, T, w, O = {}) {
    const z = this.seg(O.seg ?? 12), C = O.bevel ? vj.lathe(OU(N, I, O.bevel), z) : vj.cyl(O.r2 ?? N, N, I, z, !!O.open);
    this.add(A, C, M, D, T, w, O);
  }
  sph(A, M, N, I, D, T, w = {}) {
    this.add(A, vj.sph(N, this.seg(w.ws ?? 12), Math.max(3, this.seg(w.hs ?? 8)), w.half), M, I, D, T, w);
  }
  tor(A, M, N, I, D, T, w, O = {}) {
    this.add(A, vj.tor(N, I, O.rs ?? 6, this.seg(O.ts ?? 20), O.arc ?? $A), M, D, T, w, O);
  }
  lathe(A, M, N, I, D, T, w = {}) {
    this.add(A, vj.lathe(N, this.seg(w.seg ?? 16), w.closed), M, I, D, T, w);
  }
  tube(A, M, N, I, D = {}) {
    this.add(A, DU(N, I, D.radial ?? 8, !!D.closed, D.up || null), M, D.x || 0, D.y || 0, D.z || 0, D);
  }
  decal(A, M, N, I, D, T, w = {}) {
    this.add(w.glow ? "glow" : "paint", vj.plane(M, N), w.tint ?? "white", I, D, T, { ...w, uv: vQ(A), ao: false });
  }
  blob(A, M, N = 0, I = 0) {
    this.aoBase != null && (this.add("blob", vj.plane(1, 1), "white", N, 0.012, I, { rx: -NM, sx: A, sy: M, uvs: [1, 1] }), this.tris -= 2);
  }
  col(A, M, N, I, D, T, w) {
    const O = (w && w.roof ? 1 : 0) | (w && w.rail ? 2 : 0) | (w && w.perch ? 4 : 0);
    this.cols.push(O ? [A, M, N, I, D, T, O] : [A, M, N, I, D, T]);
  }
  spin(A, M, N, I, D = {}) {
    this.k._spin.push({ kind: A, base: this._m(M, N, I, D), speed: D.speed ?? 8, phase: this.r(0, $A) }), this.tris += this.k._tplTris(A);
  }
  blink(A, M, N, I, D = {}) {
    this.k._blink.push({ m: this._m(M, N, I, { s: D.size ?? 0.045 }), color: Wj(A).clone(), rate: D.rate ?? 1, phase: D.phase ?? this.r(0, $A), lo: D.lo ?? 0.25, hi: D.hi ?? 5 }), this.tris += 84;
  }
  flag(A, M, N, I = {}) {
    this.k._flags.push({ m: this._m(A, M, N, I), team: I.team ?? null, color: Wj(I.color ?? "offwhite").clone(), tint: I.tint ?? 0 }), this.tris += 16;
  }
  banner(A, M, N, I = {}) {
    this.k._banners.push({ m: this._m(A, M, N, I), team: I.team ?? null, color: Wj(I.color ?? "lavender").clone(), tint: 0 }), this.tris += 80;
  }
}
function OT(j, A, M, N) {
  const I = [];
  for (let D = 0; D < N; D++) {
    const T = D / N * $A;
    I.push([j + Math.cos(T) * M, A + Math.sin(T) * M]);
  }
  return I;
}
function E4(j, A, M) {
  const I = new rC(j.map((D) => new DA(D[0], D[1], 0)), A, "centripetal").getPoints(M).map((D) => [D.x, D.y]);
  return A && I.pop(), I;
}
function Nx(j, A, M = 3) {
  const N = [], I = j.length;
  for (let D = 0; D < I; D++) {
    const T = j[D], w = j[(D - 1 + I) % I], O = j[(D + 1) % I], z = [w[0] - T[0], w[1] - T[1]], C = [O[0] - T[0], O[1] - T[1]], E = Math.hypot(...z), P = Math.hypot(...C), g = Math.min(A, E * 0.45, P * 0.45), Q = [T[0] + z[0] / E * g, T[1] + z[1] / E * g], x = [T[0] + C[0] / P * g, T[1] + C[1] / P * g];
    for (let U = 0; U <= M; U++) {
      const k = U / M, s = 1 - k;
      N.push([s * s * Q[0] + 2 * s * k * T[0] + k * k * x[0], s * s * Q[1] + 2 * s * k * T[1] + k * k * x[1]]);
    }
  }
  return N;
}
const eM = {}, aA = (j, A, M) => [j, A, M];
eM.railing = { desc: "Painted steel handrail (posts every ~1.2 m, rounded top rail, mid + toe rails, flanged feet). Runs from pos along local +X.", params: { length: "m (4)", height: "m (1.0)", color: "paint (railing)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.length ?? 4, N = A.height ?? 1, I = A.color ?? "railing", D = Math.max(2, Math.round(M / 1.2) + 1);
  for (let T = 0; T < D; T++) {
    const w = T / (D - 1) * M;
    j.cyl("gloss", I, 0.03, N - 0.03, w, (N - 0.03) / 2, 0, { seg: 10, open: true }), j.lathe("gloss", I, QT(0.075, 0.03), w, 0, 0, { seg: 12 });
  }
  j.cyl("gloss", I, 0.036, M, M / 2, N - 0.018, 0, { rz: NM, seg: 12, open: true }), j.sph("gloss", I, 0.04, 0, N - 0.018, 0, { ws: 10, hs: 6 }), j.sph("gloss", I, 0.04, M, N - 0.018, 0, { ws: 10, hs: 6 }), j.cyl("gloss", I, 0.021, M, M / 2, N * 0.55, 0, { rz: NM, seg: 8, open: true }), j.cyl("gloss", I, 0.018, M, M / 2, 0.15, 0, { rz: NM, seg: 8, open: true }), j.col(-0.05, 0, -0.06, M + 0.05, N, 0.06, { rail: true });
} };
eM.fence = { desc: "Harbor site fence on chunky concrete feet. variant 0 = chain-link panels (alpha-tested), 1 = painted bar panels. Runs along +X.", params: { length: "m (4)", height: "m (2.0)", color: "frame paint (galv)" }, variants: 2, mount: "ground", build(j, A) {
  const M = A.length ?? 4, N = A.height ?? 2, I = (A.variant ?? 0) % 2, D = A.color ?? (I ? "tealdark" : "galv"), T = Math.max(1, Math.round(M / 2.5)), w = M / T, O = 0.14, z = N;
  for (let C = 0; C <= T; C++) {
    const E = C * w;
    j.box("paint", "concrete", 0.6, 0.15, 0.26, E, 0.075, 0, { r: 0.045, round: true }), j.cyl("metal", D, 0.034, z - 0.1, E, 0.1 + (z - 0.1) / 2, 0, { seg: 10, open: true }), j.sph("metal", D, 0.038, E, z, 0, { ws: 10, hs: 6 });
    for (const P of [O + 0.08, z - 0.12]) j.cyl("metal", "darksteel", 0.046, 0.05, E, P, 0, { seg: 10 });
  }
  for (let C = 0; C < T; C++) {
    const E = C * w + 0.07, P = (C + 1) * w - 0.07, g = P - E, Q = (E + P) / 2;
    for (const U of [O + 0.08, z - 0.12]) j.cyl("metal", D, 0.02, g, Q, U, 0, { rz: NM, seg: 8, open: true });
    for (const U of [E, P]) j.cyl("metal", D, 0.02, z - 0.2 - O, U, (O + 0.08 + z - 0.12) / 2, 0, { seg: 8, open: true });
    const x = z - 0.2 - O - 0.02;
    if (I === 0) j.add("fence", vj.plane(g, x), "galv", Q, (O + 0.08 + z - 0.12) / 2, 0, { uvs: [g / 0.16, x / 0.16] });
    else {
      const U = Math.max(2, Math.round(g / 0.13));
      for (let k = 1; k < U; k++) j.cyl("gloss", D, 0.013, x, E + k / U * g, (O + 0.08 + z - 0.12) / 2, 0, { seg: 6, open: true });
      j.cyl("gloss", D, 0.016, g, Q, (O + z) / 2 + 0.15, 0, { rz: NM, seg: 6, open: true });
    }
  }
  j.col(-0.3, 0, -0.14, M + 0.3, z, 0.14, { rail: true });
} };
eM.bollard = { desc: "variant 0 = charcoal steel bollard with mustard reflective band, 1 = chunky concrete ball bollard, 2 = harbor mooring bitt.", params: { color: "band / accent (mustard)" }, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3, N = A.color ?? "mustard";
  if (M === 0) j.lathe("gloss", "charcoal", QT(0.15, 0.035), 0, 0, 0, { seg: 16 }), j.cyl("gloss", "charcoal", 0.095, 0.76, 0, 0.03 + 0.38, 0, { seg: 16, open: true }), j.sph("gloss", "charcoal", 0.095, 0, 0.79, 0, { ws: 16, hs: 5, half: true }), j.cyl("gloss", N, 0.099, 0.07, 0, 0.64, 0, { seg: 16, open: true }), j.cyl("gloss", N, 0.099, 0.03, 0, 0.54, 0, { seg: 16, open: true }), j.col(-0.15, 0, -0.15, 0.15, 0.9, 0.15), j.blob(0.55, 0.55);
  else if (M === 1) j.lathe("paint", "concrete", [[0, 0], [0.19, 0], [0.2, 0.03], [0.17, 0.08], [0.15, 0.42], [0, 0.42]], 0, 0, 0, { seg: 16 }), j.sph("paint", "concrete", 0.17, 0, 0.52, 0, { ws: 16, hs: 10 }), j.cyl("paint", N, 0.153, 0.06, 0, 0.3, 0, { seg: 16, open: true }), j.col(-0.2, 0, -0.2, 0.2, 0.7, 0.2), j.blob(0.7, 0.7);
  else {
    j.lathe("gloss", "charcoal", [[0, 0], [0.32, 0], [0.33, 0.03], [0.3, 0.06], [0.17, 0.09], [0.14, 0.13], [0.14, 0.34], [0.2, 0.38], [0.24, 0.44], [0.22, 0.5], [0.12, 0.53], [0, 0.535]], 0, 0, 0, { seg: 18 }), j.cyl("gloss", N, 0.144, 0.05, 0, 0.26, 0, { seg: 18, open: true });
    for (let I = 0; I < 6; I++) {
      const D = I / 6 * $A;
      j.cyl("metal", "darksteel", 0.018, 0.025, Math.cos(D) * 0.26, 0.04, Math.sin(D) * 0.26, { seg: 6 });
    }
    j.col(-0.33, 0, -0.33, 0.33, 0.54, 0.33), j.blob(0.95, 0.95);
  }
} };
eM.bench = { desc: "Plaza bench: wood slats on painted steel side frames. Seat faces +Z. variant 0 = with backrest, 1 = backless.", params: { length: "m (1.8)", color: "frame paint (tealdark)" }, variants: 2, mount: "ground", build(j, A) {
  const M = A.length ?? 1.8, N = (A.variant ?? 0) % 2 === 0, I = A.color ?? "tealdark";
  for (const T of [-1, 1]) {
    const w = T * (M / 2 - 0.22);
    j.box("gloss", I, 0.06, 0.4, 0.06, w, 0.2, 0.18, { r: 0.02 }), j.box("gloss", I, 0.06, 0.4, 0.06, w, 0.2, -0.18, { r: 0.02 }), j.box("gloss", I, 0.065, 0.05, 0.52, w, 0.4, 0, { r: 0.02 }), j.box("gloss", I, 0.07, 0.035, 0.5, w, 0.018, 0, { r: 0.015 }), N && (j.push(w, 0.4, -0.2, 0, -0.22), j.box("gloss", I, 0.055, 0.5, 0.05, 0, 0.23, -0.02, { r: 0.018 }), j.pop());
  }
  [-0.165, -0.055, 0.055, 0.165].forEach((T) => j.box("wood", Aj("wood", j.r(0.9, 1.06)), M, 0.038, 0.095, 0, 0.445, T, { r: 0.014 })), N && (j.push(0, 0.4, -0.23, 0, -0.22), [0.16, 0.28, 0.4].forEach((T) => j.box("wood", Aj("wood", j.r(0.9, 1.06)), M, 0.095, 0.036, 0, T, 0, { r: 0.014 })), j.pop()), j.col(-M / 2, 0, -0.3, M / 2, N ? 0.88 : 0.47, 0.25), j.blob(M + 0.3, 0.8);
} };
eM.trashbin = { desc: "variant 0 = round street bin (glossy body, domed lid with slot), 1 = wheelie bin with hinged lid, handle and wheels.", params: { color: "body (teal)" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.color ?? (M ? "mustard" : "teal");
  if (M === 0) j.cyl("paint", "charcoal", 0.25, 0.06, 0, 0.03, 0, { seg: 18, bevel: 0.015 }), j.lathe("gloss", N, [[0, 0.06], [0.235, 0.06], [0.255, 0.1], [0.27, 0.74], [0.286, 0.765], [0.29, 0.8], [0.27, 0.82], [0, 0.82]], 0, 0, 0, { seg: 20 }), j.lathe("gloss", "offwhite", [[0.2715, 0.555], [0.2735, 0.645]], 0, 0, 0, { seg: 20 }), j.lathe("gloss", "offwhite", [[0, 0.8], [0.295, 0.8], [0.3, 0.84], [0.27, 0.9], [0.2, 0.97], [0.1, 1], [0, 1.01]], 0, 0, 0, { seg: 20 }), j.box("paint", "ink", 0.26, 0.1, 0.1, 0, 0.885, 0.235, { rx: -0.55, r: 0.03 }), j.sph("gloss", N, 0.045, 0, 1.02, 0, { ws: 10, hs: 6 }), j.col(-0.3, 0, -0.3, 0.3, 1.05, 0.3), j.blob(0.8, 0.8);
  else {
    j.box("gloss", N, 0.6, 0.86, 0.7, 0, 0.55, 0.02, { round: true, r: 0.05 }), j.box("gloss", Aj(N, 0.78), 0.66, 0.06, 0.78, 0, 1, 0.02, { r: 0.025 }), j.box("gloss", Aj(N, 0.78), 0.58, 0.07, 0.05, 0, 0.965, 0.41, { r: 0.02 }), j.box("gloss", Aj(N, 0.92), 0.44, 0.5, 0.03, 0, 0.58, 0.37, { r: 0.015 }), j.cyl("paint", "charcoal", 0.024, 0.56, 0, 0.94, -0.4, { rz: NM, seg: 10 });
    for (const I of [-1, 1]) j.box("paint", "charcoal", 0.05, 0.08, 0.1, I * 0.24, 0.94, -0.36, { r: 0.015 }), j.cyl("rubber", "rubber", 0.11, 0.07, I * 0.3, 0.11, -0.28, { rz: NM, seg: 16, bevel: 0.02 }), j.cyl("metal", "galv", 0.045, 0.075, I * 0.3, 0.11, -0.28, { rz: NM, seg: 10 }), j.box("paint", "charcoal", 0.08, 0.12, 0.08, I * 0.2, 0.08, 0.28, { r: 0.02 });
    j.cyl("metal", "darksteel", 0.018, 0.62, 0, 0.11, -0.28, { rz: NM, seg: 8 }), j.col(-0.34, 0, -0.42, 0.34, 1.04, 0.42), j.blob(0.9, 1);
  }
} };
function gE(j, A, M, N, I, D, T, w = "leaf") {
  const O = (C, E, P, g, Q, x = 0) => j.add("foliage", vj.puff(D, (T + Q) % 6), aN(w, "leaflight", x * 0.45 + j.r(0, 0.08)), C, E, P, { s: g, sy: g * 0.9, ry: j.r(0, $A) });
  O(0, N + M * 0.55, 0, M * 0.66, 0, 0.3);
  const z = Math.max(2, A - 2);
  for (let C = 0; C < z; C++) {
    const E = C / z * $A + j.r(-0.3, 0.3), P = M * 0.58 + I * 0.2;
    O(Math.cos(E) * P, N + M * 0.38, Math.sin(E) * P, M * j.r(0.44, 0.52), C + 1, 0.1);
  }
  A > 3 && O(j.r(-0.1, 0.1) * M, N + M * 1, j.r(-0.1, 0.1) * M, M * 0.46, 7, 0.9);
}
function QU(j, A, M, N, I, D, T, w, O = "leaf") {
  j.add("foliage", vj.puff(w, 0), Aj(O, 0.95), A, M, N, { s: I * 0.78, sy: D * 0.8 });
  for (let z = 0; z < T; z++) {
    const C = (z + 0.5) / T, E = 1 - 1.7 * C, P = Math.sqrt(Math.max(0, 1 - E * E)), g = z * 2.39996 + j.r(-0.2, 0.2);
    j.add("foliage", vj.puff(w, (z + 1) % 6), aN(O, "leaflight", Math.max(0, E) * 0.55 + j.r(0, 0.08)), A + Math.cos(g) * P * I * 0.72, M + E * D * 0.7, N + Math.sin(g) * P * I * 0.72, { s: I * j.r(0.44, 0.52), sy: D * j.r(0.44, 0.5), ry: j.r(0, $A) });
  }
}
eM.planter = { desc: "Rounded concrete planter box with accent band. variant 0 = bushes, 1 = flower bed, 2 = small round tree.", params: { length: "m, X size (1.6)", width: "m, Z size (0.8)", height: "m (0.6)", color: "band accent (teal)" }, variants: 3, mount: "ground", build(j, A) {
  const M = A.length ?? 1.6, N = A.width ?? 0.8, I = A.height ?? 0.6, D = (A.variant ?? 0) % 3, T = A.color ?? "teal";
  if (j.k.qf >= 1, j.box("paint", "concrete", M, I - 0.07, N, 0, (I - 0.07) / 2, 0, { round: true, r: 0.06 }), j.box("paint", "offwhite", M + 0.07, 0.08, N + 0.07, 0, I - 0.04, 0, { round: true, r: 0.035 }), j.box("paint", T, M + 0.012, 0.08, N + 0.012, 0, 0.17, 0, { r: 0.02 }), j.box("paint", "soil", M - 0.1, 0.04, N - 0.1, 0, I + 5e-3, 0, { r: 0.015 }), D === 0) {
    const w = Math.max(1, Math.round(M / 0.75));
    for (let O = 0; O < w; O++) j.push(-M / 2 + (O + 0.5) / w * M, 0, 0), gE(j, 4, Math.min(N, 0.9) * 0.5, I - 0.05, 0.05, 1, O * 3 + 1), j.pop();
  } else if (D === 1) {
    const w = Math.max(1, Math.round(M / 0.6));
    for (let C = 0; C < w; C++) j.add("foliage", vj.blob(1, 1, (C + 2) % 8), "leafdark", -M / 2 + (C + 0.5) / w * M, I + 0.02, 0, { s: 0.34, sy: 0.14, sz: N * 0.52 / 0.34 * 0.34 });
    const O = ["pink", "mustard", "offwhite", "lavender", "coral"], z = Math.round(M * N * 15);
    for (let C = 0; C < z; C++) {
      const E = j.r(-M / 2 + 0.1, M / 2 - 0.1), P = j.r(-N / 2 + 0.1, N / 2 - 0.1);
      j.add("foliage", vj.blob(1, 0, C % 8), O[C % O.length], E, I + 0.1 + j.r(0, 0.05), P, { s: 0.055, ry: j.r(0, $A), ao: false }), j.sph("foliage", "mustard", 0.02, E, I + 0.15 + 0.03, P, { ws: 5, hs: 3, ao: false });
    }
  } else j.cyl("wood", "bark", 0.055, 1.2, 0, I + 0.6, 0, { r2: 0.04, seg: 8 }), QU(j, 0, I + 1.5, 0, 0.6, 0.55, 5, 1), gE(j, 3, 0.26, I - 0.05, 0.05, 0, 3, "leafdark");
  j.col(-M / 2 - 0.035, 0, -N / 2 - 0.035, M / 2 + 0.035, I, N / 2 + 0.035), j.blob(M + 0.4, N + 0.4);
} };
eM.bush = { desc: "Round stylised shrub cluster (3–4 lumpy blobs with baked top-light gradient).", params: { scale: "uniform (1)", color: "leaf", seed: "layout" }, variants: 1, mount: "ground", build(j, A) {
  const M = j.k.qf >= 1 ? 2 : 1;
  gE(j, A.count ?? 6, 0.5, -0.04, 0.1, M, (A.seed ?? 3) % 6, A.color ?? "leaf"), j.col(-0.55, 0, -0.55, 0.55, 0.8, 0.55), j.blob(1.5, 1.5);
} };
eM.tree = { desc: "variant 0 = round-canopy plaza tree on a steel tree grate, 1 = curved palm with serrated fronds + coconuts.", params: { height: "m (v0 4.2 / v1 5.2)", seed: "shape" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = j.k.qf >= 1 ? 2 : 1;
  if (M === 0) {
    const I = (A.height ?? 4.2) / 4.2;
    j.push(0, 0, 0, 0, 0, 0, 1), j.box("metal", "darksteel", 1.2, 0.03, 1.2, 0, 0.015, 0, { r: 0.012 }), j.lathe("wood", "bark", [[0, 0], [0.24, 0], [0.18, 0.06], [0.14, 0.2], [0.12, 0.9 * I], [0.1, 1.9 * I], [0.08, 2.5 * I], [0, 2.55 * I]], 0, 0, 0, { seg: 10 }), j.tube("wood", "bark", [aA(0, 1.5 * I, 0), aA(0.25, 1.9 * I, 0.08), aA(0.55, 2.35 * I, 0.15)], (T) => 0.07 - T * 0.03, { radial: 7 }), j.tube("wood", "bark", [aA(0, 1.7 * I, 0), aA(-0.22, 2.1 * I, -0.1), aA(-0.45, 2.5 * I, -0.2)], (T) => 0.06 - T * 0.025, { radial: 7 });
    const D = 3 * I;
    QU(j, 0, D, 0, 1.35 * I, 1.1 * I, 7, N), j.pop(), j.col(-0.2, 0, -0.2, 0.2, 2.2 * I, 0.2), j.blob(2.6, 2.6);
  } else {
    const I = A.height ?? 5.2, D = 0.9, T = [], w = Math.max(12, j.seg(30));
    for (let P = 0; P <= w; P++) {
      const g = P / w;
      T.push(aA(Math.sin(g * 1.4) * D * g, g * I, 0));
    }
    j.tube("wood", "bark", T, (P) => (0.17 - P * 0.06) * (1 + 0.1 * Math.max(0, Math.sin(P * nM * 22))), { radial: j.seg(9) }), j.lathe("wood", "bark", [[0, 0], [0.26, 0], [0.2, 0.08], [0.17, 0.2], [0, 0.2]], 0, 0, 0, { seg: 10 });
    const O = T[w];
    j.sph("wood", "wooddark", 0.16, O[0], O[1] + 0.02, 0, { ws: 9, hs: 6 });
    for (let P = 0; P < 3; P++) {
      const g = P / 3 * $A + 0.5;
      j.sph("wood", "wooddark", 0.1, O[0] + Math.cos(g) * 0.14, O[1] - 0.12, Math.sin(g) * 0.14, { ws: 8, hs: 6 });
    }
    const z = new GI(), C = 9, E = 12;
    for (let P = 0; P < C; P++) {
      const g = P / C * $A + j.r(-0.2, 0.2), Q = j.r(1.7, 2.1), x = P % 2 ? 0.55 : 0.35, U = Math.cos(g), k = Math.sin(g), s = -k, v = U;
      for (let S = 0; S <= E; S++) {
        const q = S / E, c = O[0] + U * Q * q, G = k * Q * q, r = O[1] + 0.05 + x * q - 1.25 * q * q, t = 0.34 * Math.pow(Math.sin(nM * Math.min(1, q * 1.08 + 0.02)), 0.7) * (S % 2 ? 1 : 0.62), p = 0.78 + 0.35 * q, f = 1, h = U * (2.5 * q - x) * 0.5, X = k * (2.5 * q - x) * 0.5;
        if (z.v(c, r + t * 0.18, G, h, f, X, 0, q, p), z.v(c + s * t, r - t * 0.14, G + v * t, h + s * 0.3, f, X + v * 0.3, 0, q, p * 1.04), z.v(c - s * t, r - t * 0.14, G - v * t, h - s * 0.3, f, X - v * 0.3, 0, q, p * 1.04), S > 0) {
          const TA = z.p.length / 3 - 3, Z = TA - 3;
          z.quad(Z, Z + 1, TA + 1, TA), z.quad(Z, TA, TA + 2, Z + 2);
        }
      }
    }
    j.add("foliage", z.geo(), "leaf", 0, 0, 0, {}), j.col(-0.22, 0, -0.22, 0.22, I * 0.7, 0.22), j.blob(1.2, 1.2);
  }
} };
eM.vending = { desc: "Vending machine with glowing product window (emissive, non-blooming), lit brand header, button column, dispense flap, side graphics. variant 0 = FIZZ CURRENT drinks, 1 = TIDE SNACKS. Front faces +Z.", params: { color: "body (teal / coral)" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.color ?? (M ? "coral" : "teal"), I = 1, D = 1.86, T = 0.78, w = T / 2;
  j.box("gloss", N, I, D - 0.08, T, 0, 0.08 + (D - 0.08) / 2, 0, { round: true, r: 0.06 }), j.box("rubber", "rubber", I - 0.08, 0.1, T - 0.08, 0, 0.05, 0, { r: 0.02 }), j.box("paint", "offwhite", 0.72, 1.18, 0.05, -0.12, 1.1, w, { r: 0.02 }), j.decal(M ? "vend1" : "vend0", 0.64, 1.08, -0.12, 1.1, w + 0.027, { glow: 1.35 }), j.box("paint", "offwhite", 0.72, 0.03, 0.06, -0.12, 0.5, w + 5e-3, { r: 0.01 }), j.box("paint", "charcoal", 0.2, 0.96, 0.04, 0.35, 1.1, w + 4e-3, { r: 0.015 }), j.box("glow", "mint", 0.14, 0.055, 0.012, 0.35, 1.5, w + 0.026, { glow: 1.8 });
  for (let O = 0; O < 3; O++) for (let z = 0; z < 2; z++) j.box("gloss", O === 0 ? "offwhite" : z ? "mustard" : "offwhite", 0.055, 0.04, 0.025, 0.315 + z * 0.07, 1.4 - O * 0.07, w + 0.03, { r: 8e-3 });
  j.box("metal", "galv", 0.07, 0.11, 0.025, 0.35, 1.08, w + 0.03, { r: 0.01 }), j.box("paint", "ink", 0.03, 0.07, 0.01, 0.35, 1.08, w + 0.043, { r: 4e-3 }), j.box("metal", "galv", 0.1, 0.05, 0.03, 0.35, 0.86, w + 0.03, { r: 0.01 }), j.box("paint", "ink", 0.64, 0.26, 0.04, -0.12, 0.3, w + 4e-3, { r: 0.015 }), j.box("gloss", "charcoal", 0.58, 0.17, 0.03, -0.12, 0.31, w + 0.03, { rx: 0.18, r: 0.012 }), j.box("paint", "offwhite", I - 0.04, 0.2, 0.04, 0, 1.745, w + 4e-3, { r: 0.015 }), j.decal(M ? "head1" : "head0", I - 0.1, 0.16, 0, 1.745, w + 0.027, { glow: 1.9 });
  for (const O of [-1, 1]) j.decal("side", 0.6, 1.25, O * (I / 2 + 2e-3), 0.95, -0.02, { ry: O * NM, tint: Aj("offwhite", 1) });
  j.col(-I / 2, 0, -T / 2, I / 2, D, T / 2 + 0.05), j.blob(1.45, 1.15, 0, 0.05);
} };
eM.acunit = { desc: "variant 0 = wall-mounted AC condenser (projects +Z from wall at z=0, pos.y = unit bottom) with spinning fan behind a grille, brackets and refrigerant pipes; 1 = rooftop unit with upward fan and louvres.", params: { color: "casing (offwhite)" }, variants: 2, mount: "wall", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.color ?? "offwhite";
  if (M === 0) {
    j.aoBase = null;
    const I = 0.86, D = 0.62, T = 0.34, w = 0.06, O = w + T;
    j.box("paint", N, I, D, T, 0, D / 2, w + T / 2, { round: true, r: 0.045 }), j.cyl("paint", "ink", 0.235, 0.03, -0.13, D / 2, O - 0.01, { rx: NM, seg: 20 }), j.spin("fan", -0.13, D / 2, O + 0.012, { rx: 0, speed: 11, s: 1.05 }), j.tor("metal", "galv", 0.238, 0.02, -0.13, D / 2, O + 0.018, { rs: 5, ts: 24 }), j.decal("grille", 0.46, 0.46, -0.13, D / 2, O + 0.034, { tint: "darksteel" }), j.cyl("metal", "galv", 0.035, 0.03, -0.13, D / 2, O + 0.036, { rx: NM, seg: 10 }), j.box("paint", "cream", 0.25, 0.52, 0.024, 0.27, D / 2, O + 4e-3, { r: 0.012 }), j.decal("badge", 0.17, 0.064, 0.27, D * 0.8, O + 0.018);
    for (let z = 0; z < 4; z++) j.box("paint", Aj(N, 0.86), 0.2, 0.018, 0.02, 0.27, 0.13 + z * 0.055, O + 0.018, { r: 6e-3, rx: -0.4 });
    j.tube("gloss", "cream", [aA(I / 2 - 0.04, 0.1, w + 0.12), aA(I / 2 + 0.06, 0.1, w + 0.12), aA(I / 2 + 0.1, 0.1, w + 0.06), aA(I / 2 + 0.11, 0.1, 0)], 0.028, { radial: 8 }), j.tube("metal", "copper", [aA(I / 2 - 0.04, 0.2, w + 0.1), aA(I / 2 + 0.03, 0.2, w + 0.1), aA(I / 2 + 0.05, 0.2, w + 0.05), aA(I / 2 + 0.055, 0.2, 0)], 0.014, { radial: 6 });
    for (const z of [-1, 1]) {
      const C = z * 0.3;
      j.box("metal", "darksteel", 0.045, 0.045, T + 0.1, C, -0.022, (T + 0.1) / 2, { r: 0.012 }), j.box("metal", "darksteel", 0.1, 0.36, 0.025, C, -0.16, 0.012, { r: 0.01 }), j.push(C, -0.18, 0.14, 0, -0.9), j.box("metal", "darksteel", 0.035, 0.035, 0.34, 0, 0, 0, { r: 0.01 }), j.pop(), j.cyl("rubber", "rubber", 0.04, 0.03, C, 5e-3, w + T / 2, { seg: 8 });
    }
    j.col(-I / 2, -0.05, 0, I / 2 + 0.12, D, O + 0.04);
  } else {
    for (const z of [-1, 1]) j.box("metal", "darksteel", 0.09, 0.12, 0.9 + 0.1, z * 0.44, 0.12 / 2, 0, { r: 0.02 });
    j.box("paint", N, 1.1, 0.72, 0.9, 0, 0.12 + 0.72 / 2, 0, { round: true, r: 0.05 });
    const O = 0.12 + 0.72;
    j.cyl("paint", "ink", 0.34, 0.03, 0, O - 0.01, 0, { seg: 24 }), j.spin("fan", 0, O + 0.012, 0, { rx: -NM, speed: 9, s: 1.55 }), j.tor("metal", "galv", 0.345, 0.024, 0, O + 0.02, 0, { rx: NM, rs: 5, ts: 28 }), j.decal("grille", 0.68, 0.68, 0, O + 0.036, 0, { rx: -NM, tint: "darksteel" });
    for (let z = 0; z < 5; z++) j.box("paint", Aj(N, 0.84), 1.1 - 0.2, 0.03, 0.04, 0, 0.12 + 0.15 + z * 0.1, 0.9 / 2 + 0.01, { r: 8e-3, rx: -0.5 });
    for (let z = 0; z < 5; z++) j.box("paint", Aj(N, 0.84), 0.04, 0.03, 0.9 - 0.2, 1.1 / 2 + 0.01, 0.12 + 0.15 + z * 0.1, 0, { r: 8e-3, rz: 0.5 });
    j.decal("badge", 0.2, 0.075, -1.1 / 2 - 2e-3, 0.12 + 0.72 * 0.75, 0.2, { ry: -NM }), j.tube("gloss", "cream", [aA(-1.1 / 2 + 0.1, 0.12 + 0.2, -0.9 / 2), aA(-1.1 / 2 + 0.1, 0.12 + 0.2, -0.9 / 2 - 0.12), aA(-1.1 / 2 + 0.1, 0.06, -0.9 / 2 - 0.2), aA(-1.1 / 2 + 0.1, 0.03, -0.9 / 2 - 0.5)], 0.035, { radial: 8 }), j.col(-1.1 / 2, 0, -0.9 / 2, 1.1 / 2, 0.12 + 0.72 + 0.05, 0.9 / 2), j.blob(1.1 + 0.4, 0.9 + 0.4);
  }
} };
eM.vent = { desc: "Roof vents. variant 0 = gooseneck pipe hood, 1 = spinning turbine ventilator, 2 = mushroom cap vent, 3 = louvred exhaust box.", params: { color: "metal tint (galv)" }, variants: 4, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 4, N = A.color ?? "galv";
  if (M === 0) {
    j.lathe("metal", N, QT(0.2, 0.05), 0, 0, 0, { seg: 16 });
    const I = 0.16, D = [aA(0, 0.04, 0), aA(0, 0.62, 0)];
    for (let T = 1; T <= 8; T++) {
      const w = T / 8 * nM;
      D.push(aA(I - Math.cos(w) * I, 0.62 + Math.sin(w) * I, 0));
    }
    D.push(aA(2 * I, 0.5, 0)), j.tube("metal", N, D, 0.1, { radial: 14 }), j.lathe("metal", N, [[0.1, 0.52], [0.15, 0.4], [0.16, 0.38], null, [0.14, 0.38], [0.09, 0.5]], 2 * I, 0, 0, { seg: 14 }), j.cyl("paint", "ink", 0.13, 0.01, 2 * I, 0.43, 0, { seg: 12 }), j.cyl("metal", "darksteel", 0.106, 0.05, 0, 0.3, 0, { seg: 14, open: true }), j.col(-0.2, 0, -0.2, 0.5, 0.9, 0.2), j.blob(0.8, 0.6, 0.12, 0);
  } else if (M === 1) j.lathe("metal", N, QT(0.24, 0.05), 0, 0, 0, { seg: 16 }), j.cyl("metal", N, 0.15, 0.36, 0, 0.23, 0, { seg: 16, open: true }), j.tor("metal", Aj(N, 0.85), 0.16, 0.02, 0, 0.42, 0, { rx: NM, rs: 5, ts: 20 }), j.spin("turbine", 0, 0.42, 0, { speed: 2.2 }), j.col(-0.26, 0, -0.26, 0.26, 0.9, 0.26), j.blob(0.8, 0.8);
  else if (M === 2) {
    j.lathe("metal", N, QT(0.22, 0.05), 0, 0, 0, { seg: 16 }), j.cyl("metal", N, 0.12, 0.5, 0, 0.29, 0, { seg: 16, open: true });
    for (let I = 0; I < 3; I++) {
      const D = I / 3 * $A;
      j.box("metal", "darksteel", 0.03, 0.14, 0.03, Math.cos(D) * 0.11, 0.6, Math.sin(D) * 0.11, { r: 8e-3 });
    }
    j.lathe("metal", N, [[0, 0.64], [0.29, 0.64], [0.3, 0.67], [0.24, 0.74], [0.12, 0.79], [0, 0.8]], 0, 0, 0, { seg: 20 }), j.cyl("paint", "ink", 0.115, 0.01, 0, 0.535, 0, { seg: 12 }), j.col(-0.3, 0, -0.3, 0.3, 0.8, 0.3), j.blob(0.8, 0.8);
  } else {
    j.box("metal", N, 0.9, 0.12, 0.7, 0, 0.06, 0, { r: 0.03 }), j.box("metal", N, 0.78, 0.5, 0.58, 0, 0.37, 0, { round: true, r: 0.04 }), j.push(0, 0.66, 0, 0, 0, 0), j.box("metal", Aj(N, 0.95), 0.88, 0.06, 0.7, 0, 0, 0, { r: 0.025 }), j.pop();
    for (const I of [-1, 1]) for (let D = 0; D < 5; D++) j.box("metal", Aj(N, 0.8), 0.66, 0.025, 0.05, 0, 0.18 + D * 0.075, I * 0.3, { rx: I * 0.6, r: 8e-3 });
    j.col(-0.45, 0, -0.35, 0.45, 0.7, 0.35), j.blob(1.2, 1);
  }
} };
eM.pipes = { desc: "Wall pipe run: 2–3 parallel painted pipes along +X at the wall (z=0), nested elbows dropping to the floor at the start and into the wall at the end, clamp brackets, flanges and a valve wheel.", params: { length: "m (4)", count: "2–3 (3)", height: "m, top pipe centre (2.2)", color: "all pipes (default mixed teal/cream/mustard)" }, variants: 1, mount: "wall", build(j, A) {
  const M = Math.max(1.6, A.length ?? 4), N = Math.max(1, Math.min(3, A.count ?? 3)), I = A.height ?? 2.2, D = 0.27, T = 0.2, w = 0.17, O = 0.14, z = M - 0.02, C = [0.075, 0.062, 0.052], E = A.color ? [A.color, A.color, A.color] : ["teal", "cream", "mustard"], P = j.seg(8);
  for (let S = 0; S < N; S++) {
    const q = C[S], c = I - S * D, G = S * D + 0.1, r = [aA(G, 0.04, T), aA(G, c - w, T)];
    for (let f = 1; f <= 4; f++) {
      const h = f / 5 * NM;
      r.push(aA(G + w * (1 - Math.cos(h)), c - w + w * Math.sin(h), T));
    }
    r.push(aA(G + w, c, T), aA(z - O, c, T));
    for (let f = 1; f <= 4; f++) {
      const h = f / 5 * NM;
      r.push(aA(z - O + O * Math.sin(h), c, T - O + O * Math.cos(h)));
    }
    r.push(aA(z, c, T - O), aA(z, c, 0)), j.tube("gloss", E[S], r, q, { radial: P }), j.lathe("metal", "darksteel", QT(q * 1.6, 0.04), G, 0, T, { seg: 10 }), j.cyl("gloss", Aj(E[S], 0.9), q * 1.3, 0.05, G, 0.5, T, { seg: 10 }), j.cyl("metal", "darksteel", q * 1.55, 0.03, z, c, 0.015, { rx: NM, seg: 10 });
    const t = G + w + 0.3, p = z - O - 0.2;
    for (let f = t + 0.5; f < p - 0.2; f += 1.9) j.cyl("gloss", Aj(E[S], 0.9), q * 1.3, 0.05, f, c, T, { rz: NM, seg: 10 });
  }
  const g = I + 0.12, Q = I - (N - 1) * D - 0.12, x = (N - 1) * D + 0.1 + w + 0.35, U = z - O - 0.25, k = Math.max(1, Math.round((U - x) / 2) + 1);
  for (let S = 0; S < k; S++) {
    const q = k === 1 ? (x + U) / 2 : x + S / (k - 1) * (U - x);
    j.box("metal", "darksteel", 0.05, g - Q, 0.05, q, (g + Q) / 2, T - 0.1, { r: 0.012 });
    for (const c of [g - 0.03, Q + 0.03]) j.box("metal", "darksteel", 0.05, 0.05, T - 0.1 + 0.03, q, c, (T - 0.1) / 2, { r: 0.012 });
    for (let c = 0; c < N; c++) j.cyl("metal", "galv", C[c] + 0.012, 0.045, q, I - c * D, T, { rz: NM, seg: 10 });
  }
  const s = Math.min(U - 0.5, x + 0.7), v = I;
  j.cyl("gloss", "coral", C[0] * 1.5, 0.18, s, v, T, { rz: NM, seg: 12, bevel: 0.02 }), j.cyl("metal", "galv", 0.018, 0.16, s, v + 0.12, T, { seg: 8 }), j.tor("gloss", "coral", 0.1, 0.014, s, v + 0.2, T, { rx: NM, rs: 5, ts: 16 }), j.box("gloss", "coral", 0.2, 0.02, 0.02, s, v + 0.2, T, { r: 6e-3 });
} };
eM.ladder = { desc: "Decorative steel wall ladder (wall at z=0): rails with goose-neck tops returning into the wall, rungs every 0.3 m, stand-off brackets.", params: { height: "m (3)", color: "paint (mustard)" }, variants: 1, mount: "wall", build(j, A) {
  const M = A.height ?? 3, N = 0.5, I = 0.18, D = A.color ?? "mustard";
  for (const T of [-1, 1]) {
    const w = T * N / 2, O = [aA(w, 0.02, I), aA(w, M, I)];
    for (let z = 1; z <= 6; z++) {
      const C = z / 6 * NM;
      O.push(aA(w, M + Math.sin(C) * I, Math.cos(C) * I));
    }
    j.tube("gloss", D, O, 0.026, { radial: 8 }), j.cyl("metal", "darksteel", 0.04, 0.03, w, 0.015, I, { seg: 8 });
    for (const z of [0.5, M - 0.4]) j.box("metal", "darksteel", 0.04, 0.05, I, w, z, I / 2, { r: 0.01 });
  }
  for (let T = 0.3; T < M - 0.05; T += 0.3) j.cyl("gloss", D, 0.016, N, 0, T, I, { rz: NM, seg: 8, open: true });
} };
eM.sign = { desc: "Billboard with a bold original brand graphic on twin steel posts with goose-neck spot lamps. variant 0 KRAKEN LINES, 1 TIDE SNACKS, 2 SQUIDKID SKATE, 3 BARNACLE BREW. wall:true mounts it flat on a wall (z=0).", params: { width: "m board (2.8)", height: "m board (1.4)", color: "frame (charcoal)", wall: "bool" }, variants: 4, mount: "ground|wall", build(j, A) {
  const M = A.width ?? 2.8, N = A.height ?? 1.4, I = (A.variant ?? 0) % 4, D = !!A.wall, T = A.color ?? "charcoal";
  D && (j.aoBase = null);
  const w = D ? 0 : 1.9, O = w + N / 2, z = D ? 0.08 : 0;
  if (j.box("paint", T, M + 0.14, N + 0.14, 0.12, 0, O, z, { round: true, r: 0.045 }), j.decal("sign" + I, M, N, 0, O, z + 0.062), !D) {
    for (const C of [-1, 1]) {
      const E = C * M * 0.3;
      j.box("gloss", "darksteel", 0.13, w + N * 0.7, 0.13, E, (w + N * 0.7) / 2, -0.13, { r: 0.03 }), j.box("metal", "darksteel", 0.34, 0.04, 0.34, E, 0.02, -0.13, { r: 0.012 });
      for (const [P, g] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) j.cyl("metal", "galv", 0.016, 0.03, E + P, 0.05, -0.13 + g, { seg: 6 });
    }
    j.box("gloss", "darksteel", M * 0.6 + 0.13, 0.09, 0.07, 0, w - 0.3, -0.13, { r: 0.02 }), j.col(-M * 0.3 - 0.17, 0, -0.3, M * 0.3 + 0.17, w + N, 0.04), j.blob(0.5, 0.5, -M * 0.3, -0.13), j.blob(0.5, 0.5, M * 0.3, -0.13);
  }
  for (const C of [-1, 1]) {
    const E = C * M * 0.28, P = w + N + 0.07;
    j.tube("metal", "darksteel", [aA(E, P - 0.05, z - 0.02), aA(E, P + 0.16, z - 0.02), aA(E, P + 0.26, z + 0.08), aA(E, P + 0.28, z + 0.36)], 0.016, { radial: 6 }), j.push(E, P + 0.26, z + 0.42, 0, 0.75), j.box("paint", "charcoal", 0.24, 0.07, 0.12, 0, 0, 0, { r: 0.025 }), j.box("glow", "cream", 0.2, 0.012, 0.09, 0, -0.036, 0, { glow: 3, r: 4e-3 }), j.pop();
  }
} };
const XS = { 0: { W: 0.9, H: 0.95, paths: () => {
  const A = [{ pts: E4([[0, 0.33], [0.12, 0.2], [0.27, 0.1], [0.16, 0.06], [0.15, -0.1], [0.07, -0.13], [-0.07, -0.13], [-0.15, -0.1], [-0.16, 0.06], [-0.27, 0.1], [-0.12, 0.2]], true, 36), closed: true, c: "n_pink" }];
  for (const M of [-0.065, 0.065]) A.push({ pts: OT(M, -0.03, 0.042, 11), closed: true, c: "n_white" });
  for (const M of [-0.1, -0.034, 0.034, 0.1]) {
    const N = [];
    for (let I = 0; I <= 8; I++) {
      const D = I / 8;
      N.push([M + 0.025 * Math.sin(D * nM * 2 + M * 20), -0.17 - D * 0.2]);
    }
    A.push({ pts: N, closed: false, c: "n_pink" });
  }
  return A;
} }, 1: { W: 1.2, H: 0.75, paths: () => {
  const j = [{ pts: OT(-0.3, 0.1, 0.14, 22), closed: true, c: "n_yellow" }];
  for (let A = 0; A < 5; A++) {
    const M = 0.4 + A / 4 * (nM - 0.8);
    j.push({ pts: [[-0.3 + Math.cos(M) * 0.19, 0.1 + Math.sin(M) * 0.19], [-0.3 + Math.cos(M) * 0.26, 0.1 + Math.sin(M) * 0.26]], closed: false, c: "n_yellow" });
  }
  for (const [A, M] of [[-0.12, 0], [-0.25, 1.4]]) {
    const N = [];
    for (let I = 0; I <= 20; I++) {
      const D = -0.5 + I / 20;
      N.push([D, A + 0.04 * Math.sin(D * 13 + M)]);
    }
    j.push({ pts: N, closed: false, c: "n_cyan" });
  }
  return j.push({ pts: E4([[0.12, 0.05], [0.2, 0.2], [0.3, 0.12], [0.4, 0.26], [0.48, 0.1]], false, 14), closed: false, c: "n_cyan" }), j;
} }, 2: { W: 1.1, H: 0.75, paths: () => {
  const j = [];
  for (let A = 0; A < 30; A++) {
    const M = A / 30 * $A;
    j.push([0.02 + Math.cos(M) * 0.27, Math.sin(M) * 0.15 * (1 - 0.25 * Math.cos(M))]);
  }
  return [{ pts: j, closed: true, c: "n_coral" }, { pts: Nx([[0.26, 0], [0.44, 0.15], [0.44, -0.15]], 0.04), closed: true, c: "n_coral" }, { pts: OT(-0.14, 0.04, 0.03, 10), closed: true, c: "n_white" }, { pts: E4([[-0.2, -0.06], [-0.13, -0.09], [-0.06, -0.07]], false, 8), closed: false, c: "n_white" }, { pts: OT(-0.38, 0.14, 0.032, 10), closed: true, c: "n_cyan" }, { pts: OT(-0.43, 0.24, 0.024, 9), closed: true, c: "n_cyan" }, { pts: OT(-0.36, 0.3, 0.018, 8), closed: true, c: "n_cyan" }];
} }, 3: { W: 0.9, H: 0.9, paths: () => {
  const j = [];
  for (let A = 0; A < 10; A++) {
    const M = NM + A / 10 * $A, N = A % 2 ? 0.12 : 0.28;
    j.push([Math.cos(M) * N, Math.sin(M) * N - 0.01]);
  }
  return [{ pts: Nx(j, 0.025), closed: true, c: "n_yellow" }, { pts: OT(0, -0.01, 0.37, 40), closed: true, c: "n_lavender" }];
} } }, _S = { n_pink: "#ff86c2", n_white: "#e8f6ff", n_yellow: "#ffd978", n_cyan: "#7ee8ff", n_coral: "#ff9c7a", n_lavender: "#c6a8ff" };
eM.neon = { desc: "Wall neon sign: glass tubes (emissive ×4.5, blooms) on a dark backing board with stand-offs (wall at z=0, pos.y = board bottom). variant 0 squid, 1 sun + waves, 2 fish + bubbles, 3 star badge.", params: { color: "override tube colour", scale: "uniform" }, variants: 4, mount: "wall", build(j, A) {
  j.aoBase = null;
  const M = (A.variant ?? 0) % 4, N = XS[M], I = N.H / 2, D = 0.085;
  j.box("paint", "ink", N.W, N.H, 0.05, 0, I, 0.03, { round: true, r: 0.03 }), j.box("paint", "charcoal", N.W + 0.05, N.H + 0.05, 0.02, 0, I, 0.01, { r: 0.012 });
  for (const [w, O] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) j.cyl("metal", "galv", 0.012, 0.03, w * (N.W / 2 - 0.08), I + O * (N.H / 2 - 0.08), 0.065, { rx: NM, seg: 6 });
  const T = j.seg(5);
  for (const w of N.paths()) {
    const O = A.color ?? _S[w.c], z = w.pts.map((C) => aA(C[0], C[1] + I, D));
    if (j.tube("glow", O, z, 0.016, { radial: T, closed: w.closed, up: [0, 0, 1], glow: 6 }), !w.closed) for (const C of [z[0], z[z.length - 1]]) j.sph("glow", O, 0.017, C[0], C[1], C[2], { ws: 5, hs: 3, glow: 6 });
  }
} };
eM.awning = { desc: "Striped canvas shop awning (wall at z=0, pos.y = top edge) with scalloped valance and steel arms.", params: { width: "m (2.4)", length: "m projection (1.1)", color: "stripe accent (coral)" }, variants: 1, mount: "wall", build(j, A) {
  j.aoBase = null;
  const M = A.width ?? 2.4, N = A.length ?? 1.1, I = A.color ?? "coral", D = Math.max(4, Math.round(M / 0.24)), T = M / D, w = 7, O = [];
  for (let x = 0; x <= w; x++) {
    const U = x / w;
    O.push([N * U, -0.5 * U + 0.1 * Math.sin(nM * U)]);
  }
  const z = new GI();
  for (let x = 0; x < D; x++) {
    const U = -M / 2 + x * T, k = U + T, s = (x % 2, 1), v = x % 2 ? 1 : 0;
    for (const S of [1, -1]) {
      const q = [];
      for (let W = 0; W <= w; W++) {
        const PA = O[Math.max(0, W - 1)], MA = O[Math.min(w, W + 1)];
        let wA = MA[0] - PA[0], xA = MA[1] - PA[1];
        const YA = Math.hypot(wA, xA);
        wA /= YA, xA /= YA;
        const eA = -xA * S, TM = wA * S, AM = S > 0 ? 0 : -6e-3;
        q.push([z.v(U, O[W][1] + TM * AM, O[W][0] + eA * AM, 0, TM, eA, v, 0, s), z.v(k, O[W][1] + TM * AM, O[W][0] + eA * AM, 0, TM, eA, v, 0, s)]);
      }
      for (let W = 0; W < w; W++) z.quad(q[W][0], q[W][1], q[W + 1][1], q[W + 1][0]);
      const c = N + (S > 0 ? 2e-3 : -4e-3), G = -0.5, r = 0.15, t = (U + k) / 2, p = z.v(U, G, c, 0, 0, S, v), f = z.v(k, G, c, 0, 0, S, v), h = z.v(k, G - r, c, 0, 0, S, v), X = z.v(U, G - r, c, 0, 0, S, v);
      z.quad(p, f, h, X);
      const TA = z.v(t, G - r, c, 0, 0, S, v), Z = [];
      for (let W = 0; W <= 6; W++) {
        const PA = nM + W / 6 * nM;
        Z.push(z.v(t - Math.cos(PA) * T / 2, G - r + Math.sin(PA) * T * 0.42, c, 0, 0, S, v));
      }
      for (let W = 0; W < 6; W++) z.tri(TA, Z[W], Z[W + 1]);
    }
  }
  const C = z.geo(), E = C.attributes.uv, P = C.attributes.color, g = Wj(I), Q = Wj("offwhite");
  for (let x = 0; x < E.count; x++) {
    const U = E.getX(x) > 0.5 ? Q : g;
    P.setXYZ(x, U.r, U.g, U.b), E.setXY(x, 0, 0);
  }
  j.add("paint", C, "white", 0, 0, 0, {}), j.cyl("metal", "darksteel", 0.03, M + 0.06, 0, 0.02, 0.04, { rz: NM, seg: 8, bevel: 0.01 });
  for (const x of [-1, 1]) {
    const U = x * (M / 2 + 0.01);
    j.tube("metal", "darksteel", [aA(U, -0.5 - 0.35, 0.01), aA(U, -0.5 - 0.02, N - 0.02)], 0.016, { radial: 6 }), j.box("metal", "darksteel", 0.06, 0.1, 0.02, U, -0.5 - 0.35, 0.01, { r: 8e-3 });
  }
} };
eM.bunting = { desc: "String of triangular flags on a sagging rope between two poles (flags sway in the shader). team:0|1 tints flags with that team ink (alternating with white), otherwise mixed accents. posts:false omits the poles (rope from pos at `height`).", params: { length: "m (6)", height: "m rope anchor (3.4)", team: "0|1", posts: "bool (true)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.length ?? 6, N = A.height ?? 3.4, I = A.posts !== false, D = A.team ?? null;
  if (I) {
    for (const C of [0, M]) j.lathe("paint", "concrete", [[0, 0], [0.2, 0], [0.21, 0.03], [0.17, 0.12], [0, 0.12]], C, 0, 0, { seg: 14 }), j.cyl("gloss", "offwhite", 0.04, N + 0.08, C, 0.12 + (N + 0.08) / 2 - 0.1, 0, { seg: 10, open: true }), j.sph("gloss", D == null ? "coral" : "charcoal", 0.065, C, N + 0.14, 0, { ws: 10, hs: 7 }), j.box("metal", "darksteel", 0.06, 0.04, 0.06, C, N, 0, { r: 0.01 }), j.blob(0.5, 0.5, C, 0);
    j.col(-0.2, 0, -0.2, 0.2, N, 0.2), j.col(M - 0.2, 0, -0.2, M + 0.2, N, 0.2);
  }
  const T = Math.min(0.7, M * 0.075), w = (C) => N - T * (1 - Math.pow(2 * C / M - 1, 2)), O = [];
  for (let C = 0; C <= 16; C++) {
    const E = C / 16 * M;
    O.push(aA(E, w(E), 0));
  }
  j.tube("paint", "charcoal", O, 8e-3, { radial: 4 });
  const z = Math.max(2, Math.floor((M - 0.3) / 0.36));
  for (let C = 0; C < z; C++) {
    const E = 0.15 + (C + 0.5) / z * (M - 0.3), P = T * (4 * E / M - 2) * (-2 / M) * -1, g = -T * (-2 * (2 * E / M - 1) * (2 / M)), Q = D == null ? jU[C % 5] : "offwhite";
    j.flag(E, w(E) - 4e-3, 0, { rz: Math.atan(g) + 0 * P, team: D != null && C % 2 === 0 ? D : null, tint: C % 4 === 2 ? 0.35 : 0, color: Q });
  }
} };
eM.banner = { desc: "Vertical team banner hanging from a street pole arm (cloth flutters in the shader, emblem from the atlas). team:0|1 = team ink; otherwise `color`.", params: { height: "m pole (3.6)", team: "0|1", color: "cloth when no team (lavender)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.height ?? 3.6, N = A.team ?? null;
  j.lathe("paint", "concrete", [[0, 0], [0.26, 0], [0.27, 0.04], [0.22, 0.16], [0.08, 0.2], [0, 0.2]], 0, 0, 0, { seg: 16 }), j.cyl("gloss", "charcoal", 0.05, M - 0.18, 0, 0.18 + (M - 0.18) / 2, 0, { seg: 12, open: true, r2: 0.042 }), j.sph("gloss", "mustard", 0.075, 0, M + 0.04, 0, { ws: 12, hs: 8 });
  const I = M - 0.25;
  j.cyl("gloss", "charcoal", 0.024, 1, 0.5, I, 0, { rz: NM, seg: 8, open: true }), j.sph("gloss", "mustard", 0.045, 1, I, 0, { ws: 10, hs: 6 }), j.box("gloss", "charcoal", 0.08, 0.1, 0.08, 0.02, I, 0, { r: 0.02 });
  for (const D of [0.2, 0.5, 0.8]) j.tor("metal", "galv", 0.035, 8e-3, D, I, 0, { ry: NM, rs: 4, ts: 10 });
  j.banner(0.5, I - 0.03, 0, { team: N, color: A.color ?? "lavender" }), j.col(-0.27, 0, -0.27, 0.27, M, 0.27), j.blob(0.8, 0.8);
} };
function xy(j, A, M, N, I) {
  j.lathe("rubber", "rubber", [[I * 1.04, 0], [I * 1, 0.012], [I * 0.92, 0.03], [I * 0.84, 8e-3], [I * 0.55, -0.03], [I * 0.3, -0.05], [0, -0.05]], A, M, N, { rx: NM, seg: 16 }), j.sph("metal", "galv", I * 0.24, A, M, N - 0.03, { ws: 10, hs: 3, half: true, rx: NM });
}
eM.speaker = { desc: "Stage speaker stack on a road case: big woofer cabinet + two-driver top cabinet with horn, BOOMTIDE badges, blinking power LED. Faces +Z.", params: { color: "cabinet (ink)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.color ?? "ink";
  j.box("paint", "charcoal", 1, 0.28, 0.72, 0, 0.08 + 0.14, 0, { r: 0.03 });
  for (const D of [0.09, 0.35]) j.box("metal", "galv", 1.02, 0.03, 0.74, 0, D, 0, { r: 0.01 });
  for (const [D, T] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) j.cyl("rubber", "rubber", 0.045, 0.05, D * 0.4, 0.045, T * 0.26, { rz: NM, seg: 10 });
  const N = 0.365 + 0.47;
  j.box("paint", M, 0.96, 0.94, 0.66, 0, N, 0, { round: true, r: 0.05 }), xy(j, 0, N - 0.02, 0.33, 0.35), j.decal("wbadge", 0.2, 0.075, 0.33, N + 0.39, 0.332);
  for (const D of [-1, 1]) j.box("metal", "darksteel", 0.02, 0.06, 0.2, D * 0.485, N + 0.15, 0, { r: 8e-3 });
  const I = N + 0.47 + 0.29;
  j.push(0, I, 0, 0, 0.1), j.box("paint", M, 0.94, 0.56, 0.62, 0, 0, 0, { round: true, r: 0.045 }), xy(j, -0.24, -0.02, 0.31, 0.17), xy(j, 0.24, -0.02, 0.31, 0.17), j.box("paint", "charcoal", 0.26, 0.13, 0.04, 0, 0.17, 0.31, { r: 0.025 }), j.box("paint", "ink", 0.2, 0.08, 0.03, 0, 0.17, 0.325, { r: 0.02 }), j.decal("wbadge", 0.16, 0.06, 0, -0.2, 0.312), j.pop(), j.blink("mint", 0.38, N - 0.38, 0.335, { rate: 0.7, size: 0.014, lo: 0.4, hi: 4 }), j.col(-0.5, 0, -0.37, 0.5, I + 0.3, 0.37), j.blob(1.4, 1.1);
} };
function cw(j, A, M, N, I, D) {
  j.push(A, M, N, I), j.box("wood", Aj("woodlight", j.r(0.95, 1.05)), D - 0.04, D - 0.02, D - 0.04, 0, D / 2, 0, { r: 0.02 });
  for (const T of [0.045, D - 0.045]) j.box("wood", Aj("wooddark", j.r(0.95, 1.05)), D, 0.09, D, 0, T, 0, { r: 0.018 });
  for (const [T, w] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) j.box("wood", "wooddark", 0.075, D - 0.18, 0.075, T * (D / 2 - 0.03), D / 2, w * (D / 2 - 0.03), { r: 0.015 });
  j.push(0, D / 2, D / 2 - 8e-3, 0, 0, Math.atan2(D - 0.2, D - 0.2)), j.box("wood", "wooddark", Math.hypot(D - 0.2, D - 0.2) - 0.05, 0.07, 0.03, 0, 0, 0, { r: 0.01 }), j.pop(), j.decal("stencil", D * 0.5, D * 0.25, D * 0.12, D * 0.66, D / 2 + 0.01, { tint: Aj("ink", 1.2) }), j.pop();
}
eM.crates = { desc: "Decor stacks. variant 0 = braced wooden crates (3), 1 = coloured plastic bottle crates (5), 2 = taped cardboard boxes (4).", params: { seed: "layout", color: "plastic crate accent" }, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3;
  if (M === 0) cw(j, -0.36, 0, 0, j.r(-0.08, 0.08), 0.66), cw(j, 0.36, 0, 0.03, j.r(-0.08, 0.08), 0.66), cw(j, 0.02, 0.66, 0, j.r(0.15, 0.4), 0.66 * 0.88), j.col(-0.72, 0, -0.36, 0.72, 0.66, 0.38), j.col(-0.38, 0.66, -0.38, 0.42, 0.66 * 1.88, 0.38), j.blob(1.9, 1.1);
  else if (M === 1) {
    const N = [A.color ?? "teal", "mustard", "coral", "lavender"], I = (D, T, w, O, z) => {
      j.push(D, T, w, O);
      const C = 0.52, E = 0.3, P = 0.36;
      j.box("gloss", z, C, E - 4e-3, P, 0, E / 2, 0, { r: 0.016 }), j.box("paint", Aj(z, 0.42), C - 0.06, 0.02, P - 0.06, 0, E - 4e-3, 0, { r: 6e-3 });
      for (const g of [-1, 1]) j.box("paint", "ink", 0.012, 0.05, 0.14, g * (C / 2 + 1e-3), E - 0.07, 0, { r: 4e-3 });
      for (const g of [-1, 1]) j.box("paint", Aj(z, 0.62), C - 0.12, 0.12, 0.012, 0, E * 0.45, g * (P / 2 + 1e-3), { r: 4e-3 });
      j.pop();
    };
    for (let D = 0; D < 3; D++) I(-0.3, D * 0.3, 0, j.r(-0.06, 0.06), N[D % 4]);
    for (let D = 0; D < 2; D++) I(0.3, D * 0.3, 0.04, j.r(-0.06, 0.06), N[(D + 2) % 4]);
    j.col(-0.58, 0, -0.22, 0.58, 0.9, 0.26), j.blob(1.5, 0.8);
  } else {
    const N = (I, D, T, w, O, z, C) => {
      j.push(I, D, T, C), j.box("paint", Aj("kraft", j.r(0.92, 1.05)), w, O, z, 0, O / 2, 0, { r: 0.012 }), j.box("paint", "cream", w + 4e-3, 6e-3, 0.07, 0, O + 1e-3, 0, { r: 2e-3 }), j.box("paint", "cream", 6e-3, O * 0.35, 0.07, w / 2 + 1e-3, O * 0.82, 0, { r: 1e-3 }), j.pop();
    };
    N(-0.3, 0, 0, 0.55, 0.42, 0.45, 0.05), N(0.32, 0, 0.05, 0.5, 0.36, 0.5, -0.1), N(-0.25, 0.42, 0.02, 0.44, 0.32, 0.38, 0.3), N(0.3, 0.36, 0.05, 0.34, 0.26, 0.3, -0.2), j.col(-0.6, 0, -0.3, 0.6, 0.74, 0.32), j.blob(1.5, 1);
  }
} };
const $S = [[0, 0], [0.27, 0], [0.285, 0.015], [0.29, 0.045], [0.29, 0.27], [0.302, 0.29], [0.29, 0.31], [0.29, 0.57], [0.302, 0.59], [0.29, 0.61], [0.29, 0.84], [0.284, 0.87], [0.268, 0.88], [0.255, 0.872], [0, 0.872]];
function Ix(j, A, M, N, I, D = 0, T = 0) {
  j.push(M, N, I, 0, D, T), j.lathe("gloss", A, $S, 0, 0, 0, { seg: 18 }), j.lathe("gloss", "offwhite", [[0.2935, 0.35], [0.2935, 0.53]], 0, 0, 0, { seg: 18 }), j.cyl("metal", "galv", 0.035, 0.025, 0.14, 0.875, 0.05, { seg: 8 }), j.cyl("metal", "galv", 0.025, 0.025, -0.15, 0.875, -0.05, { seg: 8 }), j.pop();
}
eM.barrel = { desc: "Glossy steel drum with rolling hoops, label band and bungs. variant 0 = single upright, 1 = upright + one lying on its side.", params: { color: "drum (teal)" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.color ?? "teal";
  Ix(j, N, 0, 0, 0), j.col(-0.3, 0, -0.3, 0.3, 0.88, 0.3), j.blob(0.85, 0.85), M === 1 && (Ix(j, A.color2 ?? "coral", 0.72, 0.3, 0.05, 0, 0), j.box("wood", "wooddark", 0.1, 0.07, 0.2, 0.36, 0.035, 0.05, { r: 0.015 }), j.col(0.3, 0, -0.26, 1.2, 0.6, 0.36), j.blob(1.1, 0.8, 0.72, 0.05));
} };
function Dx(j, A, M) {
  j.push(0, A, 0, M);
  for (const N of [-0.42, 0, 0.42]) j.box("wood", Aj("wooddark", j.r(0.95, 1.05)), 1.2, 0.02, 0.1, 0, 0.01, N, { r: 6e-3 });
  for (const N of [-0.42, 0, 0.42]) j.box("wood", Aj("wood", j.r(0.9, 1)), 1.2, 0.08, 0.1, 0, 0.06, N, { r: 0.012 });
  for (let N = 0; N < 7; N++) j.box("wood", Aj("woodlight", j.r(0.9, 1.06)), 0.12, 0.022, 1, -0.54 + N * 0.18, 0.111, 0, { r: 7e-3 });
  j.pop();
}
eM.pallet = { desc: "Wooden shipping pallet. variant 0 = single, 1 = stack of 2, 2 = pallet loaded with kraft sacks.", params: { seed: "jitter" }, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3;
  Dx(j, 0, 0);
  let N = 0.122;
  if (M === 1 && (Dx(j, 0.122, j.r(-0.08, 0.08)), N = 0.244), M === 2) {
    for (let I = 0; I < 4; I++) {
      const D = I % 2 ? 0.26 : -0.26, T = I < 2 ? -0.2 : 0.2;
      j.box("paint", Aj("kraft", j.r(0.9, 1.05)), 0.5, 0.2, 0.36, D, N + 0.1, T, { round: true, r: 0.08, ry: j.r(-0.1, 0.1) });
    }
    j.box("paint", Aj("cream", 0.95), 0.52, 0.2, 0.38, 0, N + 0.3, 0, { round: true, r: 0.08, ry: 0.2 }), N += 0.4;
  }
  j.col(-0.6, 0, -0.5, 0.6, N, 0.5), j.blob(1.6, 1.4);
} };
const iU = (() => {
  const j = [], D = [[0.28500000000000003, 0.05500000000000001, 0], [0.197, 0.07300000000000001, NM], [0.197, -0.07300000000000001, nM], [0.28500000000000003, -0.05500000000000001, nM * 1.5]], T = [0.045, 0.045 * 0.6, 0.045 * 0.6, 0.045];
  for (let w = 0; w < 4; w++) for (let O = 0; O <= 2; O++) {
    const z = D[w][2] + O / 2 * NM;
    j.push([D[w][0] + Math.cos(z) * T[w], D[w][1] + Math.sin(z) * T[w]]);
  }
  return j;
})();
eM.tires = { desc: "Tyre stack. variant 0 = three black tyres with painted rims, 1 = skatepark-painted stack of four, 2 = two stacked + one leaning.", params: { color: "paint accent" }, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3, N = j.seg(15), I = (D, T, w, O, z = 0, C = 0, E = 0) => {
    j.lathe("rubber", O, iU, D, T, w, { seg: N, closed: true, rx: z, rz: C, ry: E }), O === "rubber" && j.tor("gloss", A.color ?? "offwhite", 0.205, 0.014, D, T + 0.092, w, { rx: NM + z, rs: 4, ts: 18, rz: C });
  };
  if (M === 0) {
    for (let D = 0; D < 3; D++) I(j.r(-0.03, 0.03), 0.1 + D * 0.2, j.r(-0.03, 0.03), "rubber");
    j.col(-0.34, 0, -0.34, 0.34, 0.6, 0.34);
  } else if (M === 1) {
    const D = ["teal", "mustard", "coral", "lavender"];
    for (let T = 0; T < 4; T++) I(j.r(-0.03, 0.03), 0.1 + T * 0.2, j.r(-0.03, 0.03), Aj(D[T], 0.75));
    j.col(-0.34, 0, -0.34, 0.34, 0.8, 0.34);
  } else I(0, 0.1, 0, "rubber"), I(0.02, 0.3, 0, "rubber"), I(0.5, 0.31, 0.02, "rubber", 0, -1.25), j.col(-0.34, 0, -0.34, 0.66, 0.6, 0.34);
  j.blob(1, 1, M === 2 ? 0.2 : 0, 0);
} };
eM.cone = { desc: "Traffic cone: soft coral-orange glossy cone with two white reflective bands on a square rubber base.", params: { color: "cone (cone)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.color ?? "cone";
  j.box("rubber", "charcoal", 0.4, 0.04, 0.4, 0, 0.02, 0, { r: 0.018 });
  const N = (I) => 0.14 - (I - 0.04) / 0.64 * 0.105;
  j.lathe("gloss", M, [[0, 0.04], [0.15, 0.04], [0.14, 0.07], [N(0.4), 0.4], [N(0.66), 0.66], [0.03, 0.695], [0, 0.7]], 0, 0, 0, { seg: 16 });
  for (const [I, D] of [[0.3, 0.38], [0.46, 0.52]]) j.lathe("gloss", "offwhite", [[N(I) + 3e-3, I], [N(D) + 3e-3, D]], 0, 0, 0, { seg: 16 });
  j.col(-0.2, 0, -0.2, 0.2, 0.7, 0.2), j.blob(0.6, 0.6);
} };
const A7 = [[-0.26, 0], [0.26, 0], [0.27, 0.035], [0.262, 0.1], [0.2, 0.2], [0.13, 0.64], [0.11, 0.74], [0.07, 0.8], [0, 0.815], [-0.07, 0.8], [-0.11, 0.74], [-0.13, 0.64], [-0.2, 0.2], [-0.262, 0.1], [-0.27, 0.035]], M7 = [[-0.3, 0], [0.3, 0], [0.305, 0.03], [0.3, 0.08], [0.2, 0.25], [0.11, 0.78], [0.08, 0.81], [-0.08, 0.81], [-0.11, 0.78], [-0.2, 0.25], [-0.3, 0.08], [-0.305, 0.03]];
eM.barrier = { desc: "Barriers along +X centred on pos. variant 0 = water-filled plastic barrier (glossy, fork slots, fill cap, reflectors), 1 = concrete jersey barrier with hazard stripes, 2 = steel crowd barrier.", params: { length: "m (1.8)", color: "body (coral / concrete / galv)" }, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3, N = A.length ?? (M === 2 ? 2.2 : 1.8);
  if (M === 0) {
    const I = A.color ?? "coral";
    j.add("gloss", vj.extrude("bp", A7, N - 0.06, 0.04), I, 0, 0, 0);
    for (const D of [-1, 1]) for (const T of [0.62, 0.22]) j.cyl("gloss", I, 0.06, 0.07, D * (N / 2 - 0.01), T, 0, { rz: NM, seg: 10, bevel: 0.02 });
    for (const D of [-0.28, 0.28]) j.box("paint", "ink", 0.3, 0.09, 0.55, D * N, 0.045, 0, { r: 0.02 });
    j.cyl("gloss", "offwhite", 0.055, 0.03, -N * 0.3, 0.822, 0, { seg: 12, bevel: 0.01 });
    for (const D of [-1, 1]) for (const T of [-0.18, 0.18]) j.box("glow", "offwhite", 0.14, 0.05, 0.01, T * N, 0.52, D * 0.15, { rx: -D * 0.155, glow: 1.15, r: 4e-3 });
    j.col(-N / 2, 0, -0.27, N / 2, 0.82, 0.27), j.blob(N + 0.3, 0.9);
  } else if (M === 1) {
    const I = A.color ?? "concrete";
    j.add("paint", vj.extrude("bj", M7, N - 0.02, 0.035), I, 0, 0, 0);
    const D = Math.atan2(0.53, 0.09);
    for (const T of [-1, 1]) j.decal("hazard", N - 0.2, 0.2, 0, 0.62, T * 0.14, { ry: T > 0 ? 0 : nM, rx: -(NM - D) * 1, tint: "mustard" });
    j.col(-N / 2, 0, -0.31, N / 2, 0.81, 0.31), j.blob(N + 0.3, 0.9);
  } else {
    const I = A.color ?? "galv", D = N - 0.1, T = 0.14, w = 1.08, O = 0.08, z = [], C = [[D / 2 - O, w - O, 0], [-D / 2 + O, w - O, NM], [-D / 2 + O, T + O, nM], [D / 2 - O, T + O, nM * 1.5]];
    for (const [P, g, Q] of C) for (let x = 0; x <= 3; x++) {
      const U = Q + x / 3 * NM;
      z.push(aA(P + Math.cos(U) * O, g + Math.sin(U) * O, 0));
    }
    j.tube("metal", I, z, 0.022, { closed: true, radial: 8, up: [0, 0, 1] });
    const E = Math.round(D / 0.16);
    for (let P = 1; P < E; P++) j.cyl("metal", I, 0.011, w - T, -D / 2 + P / E * D, (T + w) / 2, 0, { seg: 6, open: true });
    for (const P of [-1, 1]) j.box("metal", I, 0.06, 0.025, 0.7, P * (D / 2 - 0.08), 0.012, 0, { r: 0.01 }), j.cyl("metal", I, 0.02, T, P * (D / 2 - 0.08), T / 2, 0, { seg: 8 });
    j.col(-N / 2, 0, -0.35, N / 2, w, 0.35), j.blob(N, 0.8);
  }
} };
eM.lightpole = { desc: "Tall flood-light pole on a concrete plinth. variant 0 = four-head stadium bar, 1 = two-head area light. Heads emissive ×4 (blooms).", params: { height: "m (8)", color: "pole (galv)" }, variants: 2, mount: "ground", build(j, A) {
  const M = A.height ?? 8, N = (A.variant ?? 0) % 2, I = A.color ?? "galv";
  j.box("paint", "concrete", 0.62, 0.55, 0.62, 0, 0.275, 0, { round: true, r: 0.06 }), j.lathe("metal", I, QT(0.22, 0.04), 0, 0.55, 0, { seg: 16 });
  for (let w = 0; w < 4; w++) {
    const O = w / 4 * $A + nM / 4;
    j.cyl("metal", "darksteel", 0.02, 0.05, Math.cos(O) * 0.17, 0.6, Math.sin(O) * 0.17, { seg: 6 });
  }
  j.lathe("metal", I, [[0.13, 0.58], [0.125, 0.7], [0.075, M], [0.06, M + 0.02], [0, M + 0.03]], 0, 0, 0, { seg: 14 }), j.box("metal", Aj(I, 0.9), 0.1, 0.34, 0.03, 0, 1.4, 0.112, { r: 0.012 });
  const D = N === 0 ? 1.8 : 1;
  j.box("metal", I, D, 0.1, 0.1, 0, M - 0.1, 0.08, { r: 0.03 }), j.box("metal", I, 0.06, 0.5, 0.06, -D * 0.3, M - 0.32, 0.08, { rz: 0.9, r: 0.015 }), j.box("metal", I, 0.06, 0.5, 0.06, D * 0.3, M - 0.32, 0.08, { rz: -0.9, r: 0.015 });
  const T = N === 0 ? [-0.66, -0.22, 0.22, 0.66] : [-0.34, 0.34];
  for (const w of T) j.push(w, M - 0.1, 0.17, 0, 0.55), j.box("metal", "darksteel", 0.05, 0.16, 0.05, 0, -0.04, -0.03, { r: 0.012 }), j.box("paint", "charcoal", 0.38, 0.3, 0.16, 0, -0.14, 0.05, { round: true, r: 0.04 }), j.add("glow", vj.plane(0.31, 0.23), "cream", 0, -0.14, 0.132, { glow: 4.2 }), j.box("paint", "charcoal", 0.4, 0.02, 0.1, 0, 0.02, 0.15, { rx: -0.15, r: 8e-3 }), j.pop();
  j.col(-0.31, 0, -0.31, 0.31, M, 0.31), j.blob(1.2, 1.2);
} };
eM.container_door = { desc: "Shipping-container door end panel to stick on the end face of a container box (face at z=0, pos = bottom centre): corner posts, header/sill, twin ribbed leaves, four lock bars with cams + handles, hinges, KRAKEN LINES stencil.", params: { width: "m (2.44)", height: "m (2.59)", color: "container paint (coral)" }, variants: 1, mount: "wall", build(j, A) {
  const M = A.width ?? 2.44, N = A.height ?? 2.59, I = A.color ?? "coraldark", D = Aj(I, 0.82);
  for (const C of [-1, 1]) j.box("paint", D, 0.15, N, 0.09, C * (M / 2 - 0.075), N / 2, 0.045, { r: 0.02 });
  j.box("paint", D, M, 0.2, 0.1, 0, N - 0.1, 0.05, { r: 0.025 }), j.box("paint", D, M, 0.13, 0.1, 0, 0.065, 0.05, { r: 0.025 });
  const T = M / 2 - 0.16, w = 0.13, O = N - 0.2, z = O - w;
  for (const C of [-1, 1]) {
    const E = C * (4e-3 + T / 2);
    j.box("paint", I, T, z, 0.04, E, w + z / 2, 0.03, { r: 0.012 });
    for (let P = 0; P < 3; P++) j.box("paint", Aj(I, 1.04), 0.13, z - 0.36, 0.025, E + (P - 1) * T * 0.3, w + z / 2, 0.055, { r: 0.012 });
    for (const P of [-0.3, 0.3]) {
      const g = E + P * T * 0.82;
      j.cyl("metal", "galv", 0.02, N - 0.26, g, N / 2, 0.095, { seg: 8 });
      for (const Q of [0.2, N - 0.26]) j.box("metal", "darksteel", 0.09, 0.08, 0.06, g, Q, 0.085, { r: 0.015 });
      j.push(g, 1.15, 0.11, 0, 0, -C * NM * 0.95), j.box("metal", "galv", 0.035, 0.34, 0.03, 0, -0.17, 0, { r: 0.01 }), j.pop(), j.box("metal", "darksteel", 0.06, 0.06, 0.04, g - C * 0.33, 1.15, 0.1, { r: 0.012 });
    }
    for (let P = 0; P < 3; P++) j.cyl("metal", "darksteel", 0.03, 0.16, C * (M / 2 - 0.15), 0.4 + P * (N - 0.9) / 2, 0.075, { seg: 8 });
  }
  j.decal("stencil", T * 0.8, T * 0.4, 4e-3 + T / 2, N * 0.72, 0.06, { tint: "offwhite" });
} };
const j7 = (() => {
  const M = 0.44999999999999996, N = [[-0.95, 0], [M + 0.03, 0], [M + 0.03, 0.012]];
  for (let I = 8; I >= 0; I--) {
    const D = I / 8 * NM;
    N.push([M - 0.95 * Math.cos(D) + 0, 0.95 - 0.95 * Math.sin(D) + (I === 8 ? 0.012 : 0)]);
  }
  return N.push([-0.95, 0.95]), N;
})(), N7 = (() => {
  const j = [[-0.6, 0], [0.62, 0], [0.62, 0.01]];
  for (let A = 7; A >= 0; A--) {
    const M = A / 7;
    j.push([0.6 - 1.2 * (1 - M), 0.45 * Math.pow(1 - M, 1.6) + (A === 7 ? 0.01 : 0)]);
  }
  return j;
})();
eM.skateramp = { desc: "Skatepark pieces facing +Z (ride side toward +Z). variant 0 = quarter-pipe with steel coping and deck, 1 = kicker ramp, 2 = grind box with steel edges. Painted side panels with SK8 tag.", params: { width: "m along X (2.4)", color: "side panels (lavender)" }, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3, N = A.width ?? 2.4, I = A.color ?? "lavender";
  if (M === 2) {
    j.box("paint", "concrete", N, 0.4, 0.62, 0, 0.2, 0, { round: true, r: 0.04 });
    for (const O of [-1, 1]) j.cyl("metal", "galv", 0.025, N - 0.02, 0, 0.4, O * 0.3, { rz: NM, seg: 8 });
    j.box("paint", I, N + 0.01, 0.12, 0.63, 0, 0.08, 0, { r: 0.02 }), j.decal("tag", 0.9, 0.3, N * 0.2, 0.24, 0.312, { tint: "offwhite" }), j.col(-N / 2, 0, -0.31, N / 2, 0.42, 0.31), j.blob(N + 0.4, 1);
    return;
  }
  const D = M === 0 ? j7 : N7, T = M === 0 ? "qp" : "kick";
  j.add("paint", vj.extrude(T, D, N - 0.1, 0.02), "offwhite", 0, 0, 0);
  const w = uQ(D, 0.02);
  for (const O of [-1, 1]) j.add("paint", vj.extrude(T + "s", w, 0.07, 0.02), I, O * (N / 2 - 0.035), 0, 0);
  if (M === 0) {
    j.cyl("metal", "galv", 0.032, N, 0, 0.955, -0.5, { rz: NM, seg: 10, bevel: 0.01 }), j.box("metal", "galv", N - 0.1, 0.012, 0.2, 0, 6e-3, 0.55, { r: 4e-3 });
    for (const O of [-1, 1]) j.decal("tag", 0.7, 0.35, O * (N / 2 + 3e-3), 0.35, -0.55, { ry: O * NM, tint: "offwhite" });
    j.col(-N / 2, 0, -0.95, N / 2, 0.97, 0.5);
  } else j.box("metal", "galv", N - 0.1, 0.012, 0.16, 0, 6e-3, 0.62, { r: 4e-3 }), j.col(-N / 2, 0, -0.6, N / 2, 0.45, 0.62);
  j.blob(N + 0.4, M === 0 ? 1.8 : 1.5, 0, -0.1);
} };
eM.buoy = { desc: "variant 0 = glossy mooring ball with white band and lifting eye, 1 = channel-marker can buoy with cage and blinking lamp.", params: { color: "body (coral)" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.color ?? "coral";
  if (M === 0) {
    j.sph("gloss", N, 0.45, 0, 0.44, 0, { ws: 22, hs: 14 });
    const I = [];
    for (let D = 0; D <= 4; D++) {
      const T = -0.28 + D / 4 * 0.56;
      I.push([Math.cos(T) * 0.455, 0.44 + Math.sin(T) * 0.455]);
    }
    j.lathe("gloss", "offwhite", I, 0, 0, 0, { seg: 22 }), j.cyl("metal", "galv", 0.07, 0.06, 0, 0.9, 0, { seg: 10, bevel: 0.015 }), j.tor("metal", "galv", 0.07, 0.018, 0, 1, 0, { rs: 5, ts: 14 }), j.col(-0.45, 0, -0.45, 0.45, 0.9, 0.45), j.blob(1, 1);
  } else {
    j.lathe("gloss", "charcoal", [[0, 0], [0.5, 0], [0.54, 0.05], [0.54, 0.15], [0.5, 0.2], [0.3, 0.24], [0, 0.24]], 0, 0, 0, { seg: 20 }), j.lathe("gloss", N, [[0, 0.24], [0.3, 0.24], [0.3, 0.9], [0.28, 0.95], [0, 0.96]], 0, 0, 0, { seg: 18 }), j.cyl("gloss", "offwhite", 0.302, 0.16, 0, 0.62, 0, { seg: 18, open: true });
    for (let I = 0; I < 3; I++) {
      const D = I / 3 * $A;
      j.tube("metal", "galv", [aA(Math.cos(D) * 0.24, 0.94, Math.sin(D) * 0.24), aA(Math.cos(D) * 0.08, 1.5, Math.sin(D) * 0.08)], 0.02, { radial: 6 });
    }
    j.tor("metal", "galv", 0.18, 0.015, 0, 1.25, 0, { rx: NM, rs: 4, ts: 16 }), j.cyl("paint", "charcoal", 0.1, 0.05, 0, 1.52, 0, { seg: 12, bevel: 0.015 }), j.sph("glow", "mustard", 0.07, 0, 1.6, 0, { ws: 10, hs: 6, glow: 0.35, half: false }), j.blink("#ffd36b", 0, 1.6, 0, { size: 0.075, rate: 0.5, lo: 0.3, hi: 6 }), j.col(-0.54, 0, -0.54, 0.54, 1.65, 0.54), j.blob(1.3, 1.3);
  }
} };
const LU = (() => {
  const j = new jI(0.28, 0.068, 10, 32), A = j.attributes.position, M = new Float32Array(A.count * 3), N = Wj("coral"), I = Wj("offwhite");
  for (let D = 0; D < A.count; D++) {
    const T = Math.atan2(A.getY(D), A.getX(D)) + $A, O = Math.floor((T + nM / 8) / ($A / 8)) % 2 ? I : N;
    M[D * 3] = O.r, M[D * 3 + 1] = O.g, M[D * 3 + 2] = O.b;
  }
  return j.setAttribute("color", new dM(M, 3)), j;
})();
eM.lifering = { desc: "Harbor life ring (coral/white quarters, rope wraps) hung on a painted post with a little hood; faces +Z.", params: { color: "post (offwhite)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.color ?? "offwhite";
  j.box("metal", "darksteel", 0.26, 0.03, 0.26, 0, 0.015, 0, { r: 0.01 }), j.box("gloss", M, 0.11, 1.55, 0.11, 0, 0.03 + 0.775, 0, { r: 0.03 }), j.box("gloss", M, 0.76, 0.76, 0.04, 0, 1.12, 0.075, { round: true, r: 0.02 }), j.box("gloss", "navy", 0.86, 0.05, 0.18, 0, 1.52, 0.1, { rx: 0.2, r: 0.02 }), j.cyl("metal", "galv", 0.015, 0.12, 0, 1.42, 0.15, { rx: NM, seg: 6 }), j.add("gloss", LU, "white", 0, 1.12, 0.17, {});
  for (let N = 0; N < 4; N++) {
    const I = nM / 4 + N / 4 * $A;
    j.tor("paint", "cream", 0.075, 0.012, Math.cos(I) * 0.28, 1.12 + Math.sin(I) * 0.28, 0.17, { rz: I, ry: NM, rs: 4, ts: 10 });
  }
  j.col(-0.4, 0, -0.08, 0.4, 1.58, 0.26), j.blob(0.7, 0.6);
} };
const xI = (j, A, M, N, I, D, T = 6) => j.tube(A, M, [N, I], D, { radial: T });
function iC(j, A, M, N, I, D, T, w = "xy") {
  const O = [];
  for (let z = 0; z <= T; z++) {
    const C = I + (D - I) * (z / T), E = Math.cos(C) * N, P = Math.sin(C) * N;
    O.push(w === "xy" ? aA(j + E, A + P, M) : w === "xz" ? aA(j + E, A, M + P) : aA(j, A + P, M + E));
  }
  return O;
}
const LN = (j, A) => A[Math.floor(j.r(0, A.length - 1e-4))];
function I7(j, A, M, N, I) {
  const D = new GI(), T = [[0, A], [j * 0.5, A * 0.64], [j, 0]], w = 3, O = Wj(N), z = Wj(I), C = [], E = (x, U, k, s, v, S, q, c) => {
    const G = D.v(x, U, k, s * c, v * c, S * c, 0, 0, 1);
    return C.push(q), G;
  };
  for (const x of [1, -1]) {
    const U = x > 0 ? 0 : -8e-3;
    for (let k = 0; k < M; k++) {
      const s = k % 2, v = [];
      for (let p = 0; p < T.length; p++) {
        const f = [];
        for (let h = 0; h <= w; h++) {
          const X = (k + h / w) / M * $A, TA = T[p][0], Z = T[p][1], W = Math.sin(h / w * nM) * 0.04 * (p / 2), PA = j / Math.hypot(j, A), MA = A / Math.hypot(j, A);
          f.push(E(Math.cos(X) * TA, Z - W + U, Math.sin(X) * TA, Math.cos(X) * MA, PA, Math.sin(X) * MA, s, x));
        }
        v.push(f);
      }
      for (let p = 0; p < T.length - 1; p++) for (let f = 0; f < w; f++) D.quad(v[p][f], v[p][f + 1], v[p + 1][f + 1], v[p + 1][f]);
      const S = k / M * $A, q = (k + 1) / M * $A, c = (S + q) / 2, G = [];
      for (const p of [S, q]) for (const f of [0, -0.11]) G.push(E(Math.cos(p) * j * 1.001, f + U, Math.sin(p) * j * 1.001, Math.cos(p), 0, Math.sin(p), s, x));
      D.quad(G[0], G[2], G[3], G[1]);
      const r = E(Math.cos(c) * j, -0.11 + U, Math.sin(c) * j, Math.cos(c), 0, Math.sin(c), s, x), t = [];
      for (let p = 0; p <= 6; p++) {
        const f = S + (q - S) * (p / 6), h = Math.sin(p / 6 * nM) * 0.07;
        t.push(E(Math.cos(f) * j, -0.11 - h + U, Math.sin(f) * j, Math.cos(f), 0, Math.sin(f), s, x));
      }
      for (let p = 0; p < 6; p++) D.tri(r, t[p], t[p + 1]);
    }
  }
  const P = D.geo(), g = P.attributes.color, Q = P.attributes.normal;
  for (let x = 0; x < g.count; x++) {
    const U = C[x] ? z : O, k = Q.getY(x) < -0.2 ? 0.8 : 1;
    g.setXYZ(x, U.r * k, U.g * k, U.b * k);
  }
  return P;
}
function kU(j, A, M, N, I, D, T = "coral", w = "offwhite", O = 8) {
  j.cyl("metal", "galv", 0.022, I, A, N + I / 2, M, { seg: 8 }), j.add("paint", uI("parasol|" + [D, O, T, w].map(oI).join("|"), () => I7(D, 0.42, O, T, w)), "white", A, N + I - 0.4, M, {}), j.sph("gloss", T, 0.04, A, N + I + 0.04, M, { ws: 8, hs: 6 });
  for (let z = 0; z < O; z++) {
    const C = z / O * $A;
    j.tube("metal", "galv", [aA(A, N + I - 0.62, M), aA(A + Math.cos(C) * D * 0.5, N + I - 0.14, M + Math.sin(C) * D * 0.5)], 7e-3, { radial: 3 });
  }
  j.cyl("metal", "darksteel", 0.035, 0.08, A, N + I - 0.62, M, { seg: 8 });
}
function D7(j, A, M, N, I) {
  const D = new GI(), T = Math.max(4, Math.round(j / 0.26)), w = j / T, O = Wj(N), z = Wj(I), C = [], E = (x, U, k, s, v, S, q) => {
    const c = D.v(x, U, k, s, v, S);
    return C.push(q), c;
  };
  for (const x of [1, -1]) {
    const U = x > 0 ? 0 : -7e-3;
    for (const k of [-1, 1]) {
      const s = Math.hypot(A / 2, M), v = A / 2 / s * x, S = k * M / s * x;
      for (let q = 0; q < T; q++) {
        const c = -j / 2 + q * w, G = c + w, r = q % 2, t = E(c, M + U, 0, 0, v, S, r), p = E(G, M + U, 0, 0, v, S, r), f = E(G, U, k * A / 2, 0, v, S, r), h = E(c, U, k * A / 2, 0, v, S, r);
        D.quad(t, p, f, h);
        const X = k * (A / 2 + 2e-3 * x), TA = E(c, U, X, 0, 0, k * x, r), Z = E(G, U, X, 0, 0, k * x, r), W = E(G, -0.13 + U, X, 0, 0, k * x, r), PA = E(c, -0.13 + U, X, 0, 0, k * x, r);
        D.quad(TA, Z, W, PA);
        const MA = E((c + G) / 2, -0.13 + U, X, 0, 0, k * x, r), wA = [];
        for (let xA = 0; xA <= 6; xA++) {
          const YA = nM + xA / 6 * nM;
          wA.push(E((c + G) / 2 - Math.cos(YA) * w / 2, -0.13 + Math.sin(YA) * w * 0.42 + U, X, 0, 0, k * x, r));
        }
        for (let xA = 0; xA < 6; xA++) D.tri(MA, wA[xA], wA[xA + 1]);
      }
    }
  }
  const P = D.geo(), g = P.attributes.color, Q = P.attributes.normal;
  for (let x = 0; x < g.count; x++) {
    const U = C[x] ? z : O, k = Q.getY(x) < -0.2 ? 0.78 : 1;
    g.setXYZ(x, U.r * k, U.g * k, U.b * k);
  }
  return P;
}
function Jg(j, A, M, N, I, D, T, w = 0, O = "corners") {
  if (j.push(I, D, T, 0, 0, w), j.box("paint", "offwhite", M + 0.016, N + 0.016, 4e-3, 0, 0, 2e-3, { r: 15e-4 }), j.decal(A, M, N, 0, 0, 65e-4, { tint: Aj("white", 0.98) }), O === "corners") for (const [z, C] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) j.box("paint", aN("cream", "white", 0.4), 0.075, 0.024, 2e-3, z * (M / 2 - 0.012), C * (N / 2 - 8e-3), 85e-4, { rz: z * C * 0.72, r: 8e-4 });
  else if (O === "staples") for (const [z, C] of [[-1, 1], [1, 1], [0, 1], [-1, -1], [1, -1]]) j.box("metal", "galv", 0.018, 4e-3, 3e-3, z * (M / 2 - 0.03), C * (N / 2 - 0.03), 9e-3, { r: 1e-3 });
  j.pop();
}
eM.poster = { desc: "Paper posters on a wall (z = 0). variant 0–11 = event / notice posters, 12 = wide INK THE TOWN print, 13 = torn remnants. count > 1 pastes up an overlapping cluster with stickers and torn scraps.", params: { count: "1–6 (1)", seed: "layout" }, variants: 14, mount: "wall", build(j, A) {
  j.aoBase = null;
  const M = Math.max(1, Math.min(6, A.count ?? 1)), N = (A.variant ?? 0) % 14, I = (O, z, C, E, P) => {
    O === 12 ? Jg(j, "pw0", 1.5, 0.75, z, C, E, P, "staples") : O === 13 ? Jg(j, "torn", 0.34, 0.51, z, C, E, P, "none") : Jg(j, "pst" + O, 0.56, 0.84, z, C, E, P, j.r() < 0.5 ? "corners" : "staples");
  };
  if (M === 1) {
    I(N, 0, 0, 0, j.r(-0.03, 0.03));
    return;
  }
  let D = -(M - 1) * 0.3, T = 0;
  for (let O = 0; O < M; O++) {
    const z = O === 0 ? N : (N + O * 5) % 12;
    I(z, D + j.r(-0.05, 0.05), j.r(-0.08, 0.08), T, j.r(-0.05, 0.05)), D += 0.56 + j.r(-0.02, 0.05), T += 4e-3;
  }
  const w = M * 0.6;
  for (let O = 0; O < 2 + M; O++) {
    const z = j.r(0.08, 0.12);
    j.decal("stk" + Math.floor(j.r(0, 15.99)), z, z, j.r(-w / 2, w / 2), j.r(-0.55, 0.6), T + 4e-3 + O * 12e-4, { rz: j.r(-0.5, 0.5) });
  }
  Jg(j, "torn", 0.26, 0.39, -w / 2 - 0.1, -0.3, 2e-3, j.r(-0.1, 0.1), "none");
} };
eM.stickers = { desc: "A scatter of original vinyl stickers on a wall / post (z = 0) within width × height.", params: { count: "(8)", width: "m (1.2)", height: "m (0.8)" }, variants: 1, mount: "wall", build(j, A) {
  j.aoBase = null;
  const M = A.count ?? 8, N = A.width ?? 1.2, I = A.height ?? 0.8;
  for (let D = 0; D < M; D++) {
    const T = j.r(0.075, 0.13);
    j.decal("stk" + Math.floor(j.r(0, 15.99)), T, T, j.r(-N / 2, N / 2), j.r(-I / 2, I / 2), 4e-3 + D * 12e-4, { rz: j.r(-0.6, 0.6) });
  }
} };
eM.streetsign = { desc: "Harbor / road sign (variant: 0 no swimming, 1 slippery, 2 high voltage, 3 deep water, 4 P 2HR, 5 no entry, 6 WET INK, 7 2.0 m clearance). Galvanised pole with clamp bands on a foot; wall:true mounts the plate flat on a wall (z = 0).", params: { wall: "bool", height: "m plate centre (2.05)", size: "m plate (0.56)" }, variants: 8, mount: "ground|wall", build(j, A) {
  const M = (A.variant ?? 0) % 8, N = A.size ?? 0.56;
  if (!!A.wall) {
    j.aoBase = null, j.decal("sg" + M, N, N, 0, 0, 0.012), j.decal("sg" + M, N * 1.02, N * 1.02, 0, 0, 6e-3, { tint: Aj("galv", 0.85) });
    for (const T of [-1, 1]) j.cyl("metal", "galv", 0.012, 0.012, T * N * 0.2, N * 0.2, 0.016, { rx: NM, seg: 6 });
    return;
  }
  const D = A.height ?? 2.05;
  j.lathe("paint", "concrete", [[0, 0], [0.14, 0], [0.15, 0.03], [0.12, 0.08], [0, 0.08]], 0, 0, 0, { seg: 12 }), j.cyl("metal", "galv", 0.03, D + N * 0.5 - 0.08, 0, 0.08 + (D + N * 0.5 - 0.08) / 2, 0, { seg: 10 }), j.cyl("metal", "darksteel", 0.034, 0.02, 0, D + N * 0.5 + 5e-3, 0, { seg: 10 });
  for (const T of [-N * 0.28, N * 0.28]) j.cyl("metal", "darksteel", 0.036, 0.035, 0, D + T, 0, { seg: 10 }), j.box("metal", "darksteel", 0.05, 0.03, 0.05, 0, D + T, 0.035, { r: 8e-3 });
  j.decal("sg" + M, N, N, 0, D, 0.068), j.decal("sg" + M, N * 1.02, N * 1.02, 0, D, 0.062, { tint: Aj("galv", 0.85) }), j.decal("sg" + M, N * 1.02, N * 1.02, 0, D, 0.061, { ry: nM, tint: Aj("galv", 0.9) }), j.decal("stk" + M * 3 % 16, 0.07, 0.07, 0.012, 1.1, 0.031, { rz: 0.3 }), j.col(-0.07, 0, -0.07, 0.07, D, 0.07), j.blob(0.45, 0.45);
} };
const T7 = [{ right: false, bg: "#f4ecd8", back: 1 }, { right: true, bg: "#f4ecd8", back: 0 }, { right: true, bg: "#3f9f97", back: 7 }, { right: false, bg: "#e2b64c", back: -1 }, { right: true, bg: "#df7c66", back: -1 }, { right: false, bg: "#2f3a57", back: -1 }, { right: true, bg: "#f4ecd8", back: 0 }, { right: false, bg: "#3f9f97", back: 2 }];
eM.fingerpost = { desc: "Harbor wayfinding fingerpost: fluted post with collar rings and ball finial, 2–4 arrow blades (PIER 3, FERRY, SKATE PARK, BEACH, MARKET, TERMINAL B, LIGHTHOUSE, KELP ISLE) pointing different ways.", params: { count: "1–4 (3)", height: "m (2.7)", variant: "first blade" }, variants: 8, mount: "ground", build(j, A) {
  const M = Math.max(1, Math.min(4, A.count ?? 3)), N = A.height ?? 2.7, I = (A.variant ?? 0) % 8;
  j.lathe("paint", "concrete", [[0, 0], [0.2, 0], [0.21, 0.03], [0.16, 0.1], [0, 0.1]], 0, 0, 0, { seg: 14 }), j.lathe("gloss", "navy", [[0.075, 0.1], [0.07, 0.24], [0.052, 0.3], [0.05, N], [0.058, N + 0.02], [0.045, N + 0.05], [0, N + 0.05]], 0, 0, 0, { seg: 12 });
  for (const C of [0.3, 1.1, N - 0.02]) j.cyl("gloss", "mustard", 0.06, 0.03, 0, C, 0, { seg: 12, bevel: 8e-3 });
  j.sph("gloss", "mustard", 0.075, 0, N + 0.12, 0, { ws: 12, hs: 8 });
  const D = 0.86, T = 0.2, w = 0.1, O = 0.028, z = [0.25, 2.2, -1.35, 3.8];
  for (let C = 0; C < M; C++) {
    const E = (I + C * 3) % 8, P = T7[E], g = P.right ? 1 : -1;
    j.push(0, N - 0.22 - C * 0.26, 0, z[C] + j.r(-0.08, 0.08));
    const Q = [[-D / 2, -T / 2], [D / 2 - w, -T / 2], [D / 2, 0], [D / 2 - w, T / 2], [-D / 2, T / 2]].map((U) => [U[0] * g, U[1]]);
    g < 0 && Q.reverse();
    const x = g * (D / 2 + 0.05);
    j.add("paint", vj.extrude("blade" + g, Q, O, 6e-3), P.bg, x, 0, 0, { ry: NM }), j.decal("bl" + E, D + 0.02, T + 0.035, x, 0, O / 2 + 3e-3), P.back >= 0 && j.decal("bl" + P.back, D + 0.02, T + 0.035, x, 0, -O / 2 - 3e-3, { ry: nM }), j.box("metal", "darksteel", 0.12, 0.05, 0.05, g * 0.07, 0, 0, { r: 0.01 }), j.pop();
  }
  j.col(-0.09, 0, -0.09, 0.09, N, 0.09), j.blob(0.55, 0.55);
} };
function Tx(j, A, M, N, I, D, T = 14) {
  j.tor("rubber", "rubber", I - 0.018, 0.022, A, M, N, { rs: 6, ts: 22 }), j.tor("metal", D ?? "galv", I - 0.042, 9e-3, A, M, N, { rs: 4, ts: 22 }), j.cyl("metal", "galv", 0.022, 0.1, A, M, N, { rx: NM, seg: 8 });
  for (let w = 0; w < T; w++) {
    const O = w / T * $A, z = w % 2 ? 1 : -1;
    j.tube("metal", "galv", [aA(A, M, N + z * 0.035), aA(A + Math.cos(O) * (I - 0.05), M + Math.sin(O) * (I - 0.05), N + z * 4e-3)], 26e-4, { radial: 3 });
  }
}
function UU(j, A, M = false) {
  const I = aA(-0.5, 0.33, 0), D = aA(0.52, 0.33, 0), T = aA(-0.05, 0.3, 0), w = aA(-0.2, 0.86, 0), O = aA(0.38, 0.9, 0), z = aA(0.43, 0.72, 0);
  Tx(j, I[0], I[1], 0, 0.33), Tx(j, D[0], D[1], 0, 0.33);
  const C = (P, g, Q = 0.018) => xI(j, "gloss", A, P, g, Q, 7);
  C(T, w, 0.02), C(w, O, 0.017), C(T, z, 0.022), C(z, O, 0.024);
  for (const P of [-1, 1]) C(aA(T[0], T[1], P * 0.03), aA(I[0], I[1], P * 0.05), 0.011), C(aA(w[0] + 0.03, w[1] - 0.08, P * 0.02), aA(I[0], I[1], P * 0.05), 0.01);
  for (const P of [-1, 1]) C(aA(z[0], z[1], P * 0.03), aA(D[0], D[1], P * 0.05), 0.012);
  xI(j, "metal", "galv", w, aA(w[0] - 0.04, w[1] + 0.12, 0), 0.012), j.box("gloss", "charcoal", 0.26, 0.055, 0.15, w[0] - 0.06, w[1] + 0.15, 0, { round: true, r: 0.025 }), xI(j, "metal", "galv", O, aA(O[0] - 0.03, O[1] + 0.12, 0), 0.013);
  const E = O[1] + 0.12;
  j.tube("metal", "galv", [aA(O[0] - 0.03, E, -0.27), aA(O[0] + 0.02, E, -0.12), aA(O[0] + 0.02, E, 0.12), aA(O[0] - 0.03, E, 0.27)], 0.011, { radial: 6 });
  for (const P of [-1, 1]) j.cyl("rubber", "rubber", 0.017, 0.11, O[0] - 0.035, E, P * 0.24, { rx: NM, seg: 8 }), j.tube("metal", "darksteel", [aA(O[0] + 0.01, E, P * 0.18), aA(O[0] + 0.07, E - 0.02, P * 0.2)], 5e-3, { radial: 3 });
  j.tor("metal", "darksteel", 0.1, 8e-3, T[0], T[1], 0.055, { rs: 3, ts: 18 }), j.cyl("metal", "galv", 0.03, 0.02, T[0], T[1], 0.055, { rx: NM, seg: 10 }), j.tor("metal", "darksteel", 0.04, 6e-3, I[0], I[1], 0.055, { rs: 3, ts: 12 }), xI(j, "metal", "darksteel", aA(T[0], T[1] + 0.1, 0.055), aA(I[0], I[1] + 0.04, 0.055), 4e-3, 3), xI(j, "metal", "darksteel", aA(T[0], T[1] - 0.1, 0.055), aA(I[0], I[1] - 0.04, 0.055), 4e-3, 3);
  for (const P of [-1, 1]) {
    const g = T[0] + P * 0.13, Q = T[1] - P * 0.05;
    xI(j, "metal", "galv", aA(T[0], T[1], P * 0.07), aA(g, Q, P * 0.08), 9e-3, 5), j.box("rubber", "rubber", 0.1, 0.025, 0.08, g, Q, P * 0.12, { r: 8e-3 });
  }
  if (j.tube("gloss", A, iC(I[0], I[1], 0, 0.33 + 0.03, 0.2, nM - 0.4, 9), 0.02, { radial: 6 }), j.tube("gloss", A, iC(D[0], D[1], 0, 0.33 + 0.03, 0.5, nM - 0.1, 9), 0.02, { radial: 6 }), xI(j, "metal", "darksteel", aA(T[0] - 0.08, T[1] - 0.01, -0.05), aA(T[0] - 0.22, 0.01, -0.17), 0.01, 4), j.cyl("gloss", "offwhite", 0.035, 0.05, O[0] + 0.07, O[1] - 0.04, 0, { rz: NM, seg: 10 }), j.cyl("glow", "cream", 0.03, 5e-3, O[0] + 0.097, O[1] - 0.04, 0, { rz: NM, seg: 10, glow: 1.6 }), j.box("glow", "coral", 0.02, 0.03, 0.05, I[0] - 0.36, I[1] + 0.3, 0, { glow: 1.3, r: 6e-3 }), M) {
    j.push(D[0] + 0.04, O[1] - 0.03, 0);
    for (const [P, g, Q, x, U, k] of [[0.3, 0.22, 0, 0.11, 0.17, 0], [0.3, 0.22, 0, 0.11, -0.17, 0], [0.34, 0.22, 0.15, 0.11, 0, NM], [0.34, 0.22, -0.15, 0.11, 0, NM]]) j.add("fence", vj.plane(P, g), "galv", Q, x, U, { ry: k, uvs: [P / 0.08, g / 0.08] });
    j.add("fence", vj.plane(0.3, 0.34), "galv", 0, 5e-3, 0, { rx: -NM, uvs: [4, 4] }), j.tube("metal", "galv", [aA(-0.15, 0.22, -0.17), aA(0.15, 0.22, -0.17), aA(0.15, 0.22, 0.17), aA(-0.15, 0.22, 0.17)], 8e-3, { radial: 4, closed: true }), j.box("paint", "kraft", 0.2, 0.12, 0.14, 0.01, 0.1, 0.02, { round: true, r: 0.02, ry: 0.3 }), j.pop();
  }
}
const YU = ["teal", "coral", "mustard", "lavender", "sky", "mint", "pink", "navy"];
eM.bike = { desc: "City bicycle along local +X (front wheel +X): spoked wheels, diamond frame, saddle, bars with grips, chainring + chain, pedals, mudguards, lamp, kickstand; leans on its stand. variant 1 adds a wire front basket with a parcel.", params: { color: "frame (seeded accent)" }, variants: 2, mount: "ground", build(j, A) {
  const M = A.color ?? LN(j, YU);
  j.push(0, 0, 0, 0, 0.09), UU(j, M, (A.variant ?? 0) % 2 === 1), j.pop(), A.solid !== false && j.col(-0.85, 0, -0.3, 0.9, 1.05, 0.3), j.blob(1.9, 0.6);
} };
eM.bikerack = { desc: "Row of galvanised hoop bike stands (hoops across Z, spaced along +X) with bikes parked alongside some of them.", params: { count: "hoops (3)", bikes: "parked bikes (2)" }, variants: 1, mount: "ground", build(j, A) {
  const M = Math.max(1, A.count ?? 3), N = Math.min(M, A.bikes ?? 2), I = 0.85;
  for (let D = 0; D < M; D++) {
    const T = D * I;
    j.tube("metal", "galv", [aA(T, 0, -0.34), ...iC(T, 0.62, 0, 0.34, nM, 0, 10, "yz"), aA(T, 0, 0.34)], 0.024, { radial: 8 });
    for (const w of [-1, 1]) j.cyl("metal", "darksteel", 0.05, 0.012, T, 6e-3, w * 0.34, { seg: 10 });
    j.cyl("gloss", "mustard", 0.026, 0.05, T, 0.72, 0.18, { rz: 0, seg: 8 });
  }
  for (let D = 0; D < N; D++) {
    const T = Math.min(M - 1, Math.round((D + 0.5) * M / N - 0.5));
    j.push(T * I + 0.2, 0, j.r(-0.05, 0.05), NM + (D % 2 ? nM : 0) + j.r(-0.05, 0.05), 0.04), UU(j, LN(j, YU), j.r() < 0.4), j.pop();
  }
  j.col(-0.25, 0, -0.95, (M - 1) * I + 0.45, 1.05, 0.95, { rail: true }), j.blob(M * I + 0.6, 2, (M - 1) * I / 2, 0);
} };
eM.scooter = { desc: "variant 0 = kick scooter leaning on its stand (grip-taped deck, T-bar, small wheels); 1 = rental moped (rounded body, leg shield, seat, headlight, mirrors, rear rack, RIDE ME QR sticker). Faces +X.", params: { color: "body (mint / sky)" }, variants: 2, mount: "ground", build(j, A) {
  if ((A.variant ?? 0) % 2 === 0) {
    const I = A.color ?? LN(j, ["mint", "coral", "sky", "lavender"]);
    j.push(0, 0, 0, 0, 0.12);
    for (const D of [-0.3, 0.32]) j.cyl("rubber", "offwhite", 0.06, 0.035, D, 0.06, 0, { rx: NM, seg: 14, bevel: 0.012 }), j.cyl("metal", "galv", 0.02, 0.045, D, 0.06, 0, { rx: NM, seg: 8 });
    j.box("gloss", I, 0.58, 0.035, 0.13, 0, 0.1, 0, { round: true, r: 0.015 }), j.box("rubber", "ink", 0.5, 4e-3, 0.11, 0, 0.119, 0, { r: 2e-3 }), j.tube("gloss", I, [aA(0.26, 0.1, 0), aA(0.33, 0.16, 0), aA(0.33, 0.9, 0)], 0.018, { radial: 7 }), j.tube("metal", "galv", [aA(0.33, 0.9, -0.2), aA(0.33, 0.9, 0.2)], 0.013, { radial: 6 });
    for (const D of [-1, 1]) j.cyl("rubber", "charcoal", 0.019, 0.08, 0.33, 0.9, D * 0.17, { rx: NM, seg: 8 });
    j.tube("gloss", I, iC(-0.3, 0.06, 0, 0.08, 0.2, nM * 0.9, 6), 0.012, { radial: 5 }), j.pop(), j.tube("metal", "darksteel", [aA(-0.05, 0.09, -0.06), aA(-0.15, 5e-3, -0.15)], 7e-3, { radial: 4 }), j.col(-0.4, 0, -0.18, 0.42, 0.9, 0.18), j.blob(0.9, 0.45);
    return;
  }
  const N = A.color ?? LN(j, ["mint", "sky", "coral", "mustard"]);
  j.push(0, 0, 0, 0, 0.06);
  for (const I of [-0.5, 0.52]) j.cyl("rubber", "rubber", 0.2, 0.09, I, 0.2, 0, { rx: NM, seg: 18, bevel: 0.035 }), j.cyl("metal", "galv", 0.11, 0.1, I, 0.2, 0, { rx: NM, seg: 12 });
  j.box("gloss", N, 0.78, 0.36, 0.34, -0.3, 0.52, 0, { round: true, r: 0.14 }), j.box("gloss", N, 0.5, 0.1, 0.3, 0.12, 0.32, 0, { round: true, r: 0.04 }), j.box("gloss", N, 0.12, 0.62, 0.36, 0.4, 0.62, 0, { round: true, r: 0.05, rz: 0.22 }), j.box("gloss", aN(N, "ink", 0.1), 0.26, 0.26, 0.2, 0.55, 0.3, 0, { round: true, r: 0.08 }), j.box("gloss", "charcoal", 0.62, 0.1, 0.28, -0.34, 0.75, 0, { round: true, r: 0.045 }), j.box("metal", "galv", 0.3, 0.02, 0.24, -0.7, 0.72, 0, { r: 8e-3 }), j.box("paint", "kraft", 0.26, 0.18, 0.22, -0.7, 0.83, 0, { round: true, r: 0.03 }), j.tube("metal", "galv", [aA(0.44, 0.9, 0), aA(0.47, 1.05, 0)], 0.022, { radial: 8 }), j.box("gloss", N, 0.16, 0.12, 0.2, 0.49, 1.07, 0, { round: true, r: 0.045 }), j.cyl("glow", "cream", 0.05, 0.02, 0.575, 1.07, 0, { rz: NM, seg: 12, glow: 1.8 }), j.tube("metal", "galv", [aA(0.47, 1.1, -0.34), aA(0.47, 1.1, 0.34)], 0.014, { radial: 6 });
  for (const I of [-1, 1]) j.cyl("rubber", "charcoal", 0.02, 0.1, 0.47, 1.1, I * 0.3, { rx: NM, seg: 8 }), j.tube("metal", "darksteel", [aA(0.47, 1.12, I * 0.22), aA(0.44, 1.28, I * 0.28)], 6e-3, { radial: 3 }), j.box("gloss", "charcoal", 0.03, 0.06, 0.09, 0.44, 1.31, I * 0.29, { round: true, r: 0.015 });
  j.decal("qr", 0.16, 0.16, -0.3, 0.52, 0.172), j.decal("stk" + Math.floor(j.r(0, 15.99)), 0.09, 0.09, 0.2, 0.52, 0.172, { rz: 0.3 }), j.box("glow", "coral", 0.03, 0.05, 0.14, -0.69, 0.6, 0, { glow: 1.4, r: 0.01 }), j.pop(), j.tube("metal", "darksteel", [aA(-0.25, 0.15, -0.12), aA(-0.35, 5e-3, -0.2)], 0.01, { radial: 4 }), j.col(-0.78, 0, -0.26, 0.76, 1.2, 0.26), j.blob(1.7, 0.7);
} };
function Qy(j, A, M) {
  j.box("gloss", A, 0.56, 0.016, 0.2, 0, 0.11, 0, { round: true, r: 7e-3 });
  for (const N of [-1, 1]) j.box("gloss", A, 0.14, 0.016, 0.2, N * 0.335, 0.125, 0, { round: true, r: 7e-3, rz: N * 0.28 });
  j.box("rubber", "ink", 0.54, 3e-3, 0.18, 0, 0.12, 0, { r: 1e-3 });
  for (const N of [-1, 1]) {
    j.box("metal", "galv", 0.06, 0.03, 0.07, N * 0.2, 0.087, 0, { r: 8e-3 }), j.cyl("metal", "galv", 8e-3, 0.2, N * 0.2, 0.06, 0, { rx: NM, seg: 6 });
    for (const I of [-1, 1]) j.cyl("rubber", M, 0.03, 0.035, N * 0.2, 0.052, I * 0.105, { rx: NM, seg: 12, bevel: 8e-3 });
  }
}
eM.skateboard = { desc: "Skateboard (popsicle deck with kicked nose/tail, grip tape, trucks, urethane wheels). variant 0 lying flat, 1 leaning up against a wall behind it (-Z), 2 flipped wheels-up with a scuffed graphic.", params: { color: "deck (seeded)" }, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3, N = A.color ?? LN(j, ["coral", "teal", "lavender", "mustard", "sky"]), I = LN(j, ["mint", "cream", "pink", "offwhite"]);
  if (M === 0) {
    j.push(0, -0.022, 0), Qy(j, N, I), j.pop(), j.blob(0.9, 0.35);
    return;
  }
  if (M === 1) {
    j.push(0, 0.02, -0.08, NM, -1.2), Qy(j, N, I), j.pop(), j.blob(0.5, 0.4, 0, -0.05);
    return;
  }
  j.push(0, 0.155, 0, 0, 0, nM), Qy(j, N, I), j.pop(), j.decal("tag", 0.44, 0.17, 0, 0.056, 0, { rx: -NM, tint: "offwhite" }), j.blob(0.9, 0.35);
} };
eM.skaterail = { desc: "Low flat-bar grind rail on two posts with steel feet (along +X), scuffed and stickered.", params: { length: "m (2.6)", height: "m (0.36)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.length ?? 2.6, N = A.height ?? 0.36;
  j.box("metal", "galv", M, 0.05, 0.05, M / 2, N, 0, { r: 0.01 });
  for (const I of [0.25, M - 0.25]) j.box("gloss", "mustard", 0.05, N - 0.03, 0.05, I, (N - 0.03) / 2, 0, { r: 0.01 }), j.box("metal", "darksteel", 0.22, 0.012, 0.3, I, 6e-3, 0, { r: 4e-3 });
  j.decal("stk5", 0.08, 0.08, 0.25, N * 0.5, 0.027, { rz: 0.2 }), j.col(0, 0, -0.1, M, N + 0.03, 0.1), j.blob(M + 0.3, 0.5, M / 2, 0);
} };
const z7 = [{ head: "stall0", a: "teal", b: "offwhite", goods: "fish" }, { head: "stall1", a: "mint", b: "offwhite", goods: "fruit" }, { head: "stall2", a: "lavender", b: "offwhite", goods: "merch" }];
eM.stall = { desc: "Harbor market stall (front faces +Z): striped pitched canopy with scalloped valance on four posts, header sign, timber counter with goods (0 fish on ice, 1 fruit & veg crates, 2 tees + caps), chalk price boards, hanging lanterns, crates behind.", params: { width: "m (2.4)" }, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3, N = z7[M], I = A.width ?? 2.4, D = 1.3, T = 0.92, w = 2.25;
  for (const [O, z] of [[-I / 2, -D / 2], [I / 2, -D / 2], [-I / 2, D / 2], [I / 2, D / 2]]) j.box("metal", "galv", 0.05, w, 0.05, O, w / 2, z, { r: 0.012 }), j.box("metal", "darksteel", 0.16, 0.02, 0.16, O, 0.01, z, { r: 5e-3 });
  for (const O of [-D / 2, D / 2]) j.box("metal", "galv", I + 0.05, 0.04, 0.04, 0, w, O, { r: 0.01 });
  for (const O of [-I / 2, I / 2]) j.box("metal", "galv", 0.04, 0.04, D, O, w, 0, { r: 0.01 });
  j.add("paint", uI("canopy|" + [I + 0.3, D + 0.35, N.a].map(oI).join("|"), () => D7(I + 0.3, D + 0.35, 0.34, N.a, N.b)), "white", 0, w + 0.02, 0, {}), j.box("paint", "offwhite", 1.5, 0.42, 0.05, 0, w + 0.62, D / 2 + 0.2, { round: true, r: 0.02 }), j.decal(N.head, 1.44, 0.48, 0, w + 0.62, D / 2 + 0.229);
  for (const O of [-1, 1]) j.box("metal", "darksteel", 0.03, 0.5, 0.03, O * 0.6, w + 0.3, D / 2 + 0.18, { r: 6e-3 });
  j.box("wood", Aj("wood", 0.95), I - 0.1, T - 0.05, 0.62, 0, (T - 0.05) / 2, 0.24, { round: true, r: 0.03 }), j.box("wood", "woodlight", I - 0.02, 0.05, 0.72, 0, T - 0.025, 0.24, { r: 0.015 });
  for (let O = 0; O < 6; O++) j.box("wood", Aj("wooddark", j.r(0.95, 1.05)), (I - 0.2) / 6 - 0.02, T - 0.18, 0.02, -I / 2 + 0.1 + (O + 0.5) / 6 * (I - 0.2), (T - 0.05) / 2, 0.555, { r: 6e-3 });
  if (j.box("paint", N.a, I - 0.06, 0.1, 0.03, 0, T - 0.12, 0.565, { r: 8e-3 }), N.goods === "fish") {
    j.box("paint", "offwhite", I - 0.3, 0.06, 0.52, 0, T + 0.03, 0.24, { round: true, r: 0.02 });
    for (let O = 0; O < 12; O++) {
      const z = -I / 2 + 0.3 + O % 6 * ((I - 0.6) / 5), C = 0.1 + Math.floor(O / 6) * 0.26;
      j.sph("gloss", O % 3 ? aN("sky", "galv", 0.5) : "coral", 0.07, z, T + 0.08, C, { ws: 10, hs: 6, sx: 2.3, sy: 0.55, ry: j.r(-0.4, 0.4) }), j.box("gloss", O % 3 ? aN("sky", "galv", 0.5) : "coral", 0.06, 0.04, 5e-3, z - 0.17, T + 0.08, C, { ry: j.r(-0.3, 0.3) });
    }
  } else if (N.goods === "fruit") {
    const O = ["mustard", "coral", "leaf", "pink", "leaflight"];
    for (let z = 0; z < 4; z++) {
      const C = -I / 2 + 0.36 + z * ((I - 0.72) / 3);
      j.box("wood", "woodlight", 0.48, 0.14, 0.5, C, T + 0.07, 0.24, { r: 0.012, rx: -0.08 });
      for (let E = 0; E < 9; E++) j.sph("gloss", O[z % 5], 0.055, C + (E % 3 - 1) * 0.13 + j.r(-0.02, 0.02), T + 0.16 + j.r(0, 0.03), 0.24 + (Math.floor(E / 3) - 1) * 0.13, { ws: 8, hs: 6 });
    }
  } else {
    for (let O = 0; O < 5; O++) {
      const z = -I / 2 + 0.35 + O * ((I - 0.7) / 4);
      j.box("paint", LN(j, ["coral", "teal", "mustard", "lavender", "offwhite"]), 0.36, 0.05, 0.3, z, T + 0.025, 0.24, { round: true, r: 0.02 });
    }
    for (let O = 0; O < 3; O++) {
      const z = -0.6 + O * 0.6;
      j.sph("gloss", LN(j, ["navy", "coral", "teal"]), 0.1, z, w - 0.25, -0.05, { ws: 10, hs: 6, half: true }), j.box("gloss", "navy", 0.12, 0.012, 0.08, z, w - 0.25, 0.06, { r: 4e-3 }), j.tube("paint", "charcoal", [aA(z, w - 0.15, -0.05), aA(z, w, -0.05)], 3e-3, { radial: 3 });
    }
  }
  for (const O of [-1, 1]) j.box("wood", "wooddark", 0.34, 0.2, 0.02, O * (I / 2 - 0.3), T + 0.14, 0.58, { r: 6e-3, rx: -0.2 }), j.decal("chalk2", 0.3, 0.16, O * (I / 2 - 0.3), T + 0.14, 0.592, { rx: -0.2 });
  for (const O of [-I / 2 + 0.3, I / 2 - 0.3]) j.tube("paint", "charcoal", [aA(O, w, D / 2 - 0.05), aA(O, w - 0.3, D / 2 - 0.05)], 4e-3, { radial: 3 }), j.sph("glow", "cream", 0.07, O, w - 0.38, D / 2 - 0.05, { ws: 10, hs: 8, glow: 2.4 }), j.cyl("metal", "darksteel", 0.04, 0.04, O, w - 0.3, D / 2 - 0.05, { seg: 8 });
  cw(j, -I / 2 + 0.4, 0, -0.35, j.r(-0.1, 0.1), 0.5), cw(j, I / 2 - 0.45, 0, -0.38, j.r(-0.1, 0.1), 0.46), j.decal("stk" + Math.floor(j.r(0, 15.99)), 0.1, 0.1, I / 2 - 0.2, 0.5, 0.568, { rz: 0.4 }), j.col(-I / 2 - 0.05, 0, -D / 2 - 0.05, I / 2 + 0.05, T, D / 2 + 0.05), j.blob(I + 0.8, D + 0.6);
} };
eM.cart = { desc: "Street food cart facing +Z (serving side): variant 0 CHILLY SCOOPS ice-cream cart (freezer lids, cone rack, menu board), 1 SQUID DOGS grill cart (grill with sizzling dogs, condiment bottles, napkins). Two big wheels, push bar, striped parasol, header sign.", params: {}, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = M ? "mustard" : "pink", I = 1.5, D = 0.75, T = 0.95;
  j.box("gloss", N, I, T - 0.3, D, 0, 0.3 + (T - 0.3) / 2, 0, { round: true, r: 0.06 }), j.box("gloss", "offwhite", I + 0.06, 0.06, D + 0.06, 0, T + 0.01, 0, { round: true, r: 0.025 }), j.box("gloss", "offwhite", I + 0.02, 0.08, D + 0.02, 0, 0.34, 0, { round: true, r: 0.03 }), j.decal(M ? "cart1" : "cart0", 1.3, 0.43, 0, 0.64, D / 2 + 4e-3), j.decal("menu", 0.5, 0.375, I / 2 + 4e-3, 0.66, 0, { ry: NM }), j.decal("stk" + Math.floor(j.r(0, 15.99)), 0.1, 0.1, -I / 2 + 0.1, 0.45, D / 2 + 6e-3, { rz: -0.3 });
  for (const O of [-1, 1]) j.cyl("rubber", "rubber", 0.24, 0.07, -0.35, 0.24, O * (D / 2 + 0.05), { rx: NM, seg: 18, bevel: 0.025 }), j.cyl("metal", "offwhite", 0.14, 0.075, -0.35, 0.24, O * (D / 2 + 0.05), { rx: NM, seg: 14 }), j.cyl("metal", "galv", 0.03, 0.09, -0.35, 0.24, O * (D / 2 + 0.05), { rx: NM, seg: 8 });
  j.box("metal", "galv", 0.04, 0.3, 0.04, I / 2 - 0.12, 0.15, 0, { r: 0.01 }), j.box("rubber", "rubber", 0.1, 0.03, 0.1, I / 2 - 0.12, 0.015, 0, { r: 0.01 }), j.tube("metal", "galv", [aA(-I / 2, 0.85, -0.3), aA(-I / 2 - 0.28, 1, -0.3), aA(-I / 2 - 0.28, 1, 0.3), aA(-I / 2, 0.85, 0.3)], 0.016, { radial: 6 }), j.cyl("rubber", "charcoal", 0.022, 0.4, -I / 2 - 0.28, 1, 0, { rx: NM, seg: 8 });
  const w = T + 0.04;
  if (M === 0) {
    for (const O of [-0.35, 0.3]) j.cyl("gloss", "offwhite", 0.2, 0.05, O, w + 0.025, 0, { seg: 18, bevel: 0.015 }), j.box("metal", "galv", 0.12, 0.03, 0.03, O, w + 0.06, 0.12, { r: 8e-3 });
    for (let O = 0; O < 4; O++) {
      const z = -0.6 + O * 0.07;
      j.lathe("wood", "woodlight", [[0, 0], [0.028, 0.12]], z, w + 0.01, -0.28, { seg: 8 }), j.sph("gloss", LN(j, ["pink", "cream", "mint"]), 0.03, z, w + 0.14, -0.28, { ws: 8, hs: 6 });
    }
    j.box("gloss", "navy", 0.3, 0.18, 0.08, 0.62, w + 0.09, -0.28, { round: true, r: 0.02 });
  } else {
    j.box("metal", "darksteel", 0.9, 0.05, 0.5, -0.15, w + 0.025, 0, { r: 0.01 });
    for (let O = 0; O < 7; O++) j.cyl("metal", "galv", 6e-3, 0.5, -0.55 + O * 0.13, w + 0.055, 0, { rx: NM, seg: 4 });
    for (let O = 0; O < 5; O++) j.cyl("gloss", "coraldark", 0.025, 0.2, -0.45 + O * 0.15, w + 0.08, j.r(-0.12, 0.12), { rx: NM, rz: j.r(-0.3, 0.3), seg: 8, bevel: 0.012 });
    for (const [O, z] of [[0.45, "coral"], [0.53, "mustard"]]) j.lathe("gloss", z, [[0, 0], [0.035, 0], [0.035, 0.14], [0.015, 0.18], [6e-3, 0.21], [0, 0.21]], O, w, -0.2, { seg: 10 });
    j.box("paint", "offwhite", 0.14, 0.1, 0.1, 0.52, w + 0.05, 0.15, { r: 0.015 });
  }
  kU(j, 0.55, -0.1, w, 1.25, 1.05, M ? "mustard" : "pink", "offwhite", 10), j.col(-I / 2 - 0.3, 0, -D / 2 - 0.1, I / 2, T + 0.05, D / 2 + 0.1), j.blob(I + 0.9, D + 0.7);
} };
eM.picnic = { desc: "Timber picnic table with attached bench seats on A-frame steel legs; variant 0 with a striped parasol through the middle, 1 without (bottle + snack box on top). Long axis along X.", params: { color: "parasol accent (teal)" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = 1.8, I = 0.76, D = 0.45;
  for (let T = 0; T < 5; T++) j.box("wood", Aj("wood", j.r(0.92, 1.05)), N, 0.04, 0.14, 0, I, -0.3 + T * 0.15, { r: 0.012 });
  for (const T of [-1, 1]) for (let w = 0; w < 2; w++) j.box("wood", Aj("wood", j.r(0.92, 1.05)), N, 0.04, 0.14, 0, D, T * (0.62 + w * 0.15), { r: 0.012 });
  for (const T of [-N / 2 + 0.25, N / 2 - 0.25]) {
    for (const w of [-1, 1]) xI(j, "gloss", "charcoal", aA(T, I - 0.02, w * 0.12), aA(T, 0.01, w * 0.72), 0.022, 7);
    j.box("gloss", "charcoal", 0.05, 0.05, 1.7, T, D - 0.04, 0, { r: 0.012 }), j.box("gloss", "charcoal", 0.05, 0.05, 0.62, T, I - 0.05, 0, { r: 0.012 });
  }
  M === 0 ? kU(j, 0, 0, 0, 2.3, 1.2, A.color ?? LN(j, ["teal", "coral", "lavender", "mustard"]), "offwhite", 8) : (j.lathe("gloss", "mint", [[0, 0], [0.035, 0], [0.035, 0.15], [0.014, 0.2], [0.012, 0.24], [0, 0.24]], 0.4, I + 0.02, 0.1, { seg: 10 }), j.box("paint", "coral", 0.2, 0.08, 0.14, -0.3, I + 0.06, -0.05, { round: true, r: 0.02, ry: 0.3 })), j.col(-N / 2, 0, -0.8, N / 2, I + 0.02, 0.8), j.blob(N + 0.5, 2.1);
} };
eM.deckchair = { desc: "Striped canvas deck chair(s) on timber frames facing +Z. variant 0 single, 1 pair with a little side table and a drink.", params: { color: "stripe accent" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = (D, T, w) => {
    j.push(D, 0, 0, T);
    for (const U of [-1, 1]) xI(j, "wood", "woodlight", aA(U * 0.28, 0.01, 0.42), aA(U * 0.28, 0.95, -0.28), 0.018, 6), xI(j, "wood", "woodlight", aA(U * 0.28, 0.01, -0.35), aA(U * 0.28, 0.42, 0.25), 0.016, 6);
    for (const [U, k] of [[0.42, 0.03], [-0.28, 0.95], [0.25, 0.42]]) j.cyl("wood", "woodlight", 0.016, 0.58, 0, k, U, { rz: NM, seg: 6 });
    const O = [aA(0, 0.94, -0.27), aA(0, 0.62, -0.02), aA(0, 0.3, 0.12), aA(0, 0.36, 0.36)], z = new GI(), C = 7;
    for (let U = 0; U < O.length; U++) for (let k = 0; k <= C; k++) z.v(-0.26 + k / C * 0.52, O[U][1], O[U][2], 0, 0.6, 0.8, k % 2, 0, 1);
    for (let U = 0; U < O.length - 1; U++) for (let k = 0; k < C; k++) {
      const s = U * (C + 1) + k;
      z.quad(s, s + 1, s + C + 2, s + C + 1);
    }
    const E = z.geo(), P = E.attributes.color, g = E.attributes.uv, Q = Wj(w), x = Wj("offwhite");
    for (let U = 0; U < P.count; U++) {
      const k = Math.floor((E.attributes.position.getX(U) + 0.26) / 0.52 * 4 + 1e-3) % 2 ? x : Q;
      P.setXYZ(U, k.r, k.g, k.b), g.setXY(U, CE[0], CE[1]);
    }
    j.add("foliage", E, "white", 0, 0, 0, {}), j.pop();
  }, I = A.color ?? LN(j, ["coral", "teal", "mustard", "sky"]);
  if (M === 0) {
    N(0, 0, I), j.col(-0.32, 0, -0.35, 0.32, 0.8, 0.45), j.blob(0.9, 1);
    return;
  }
  N(-0.45, 0.15, I), N(0.55, -0.12, LN(j, ["coral", "teal", "mustard", "sky"])), j.cyl("wood", "woodlight", 0.16, 0.03, 0.05, 0.45, 0.35, { seg: 14 }), j.cyl("wood", "wooddark", 0.018, 0.44, 0.05, 0.22, 0.35, { seg: 6 }), j.lathe("gloss", "coral", [[0, 0], [0.03, 0], [0.034, 0.1], [0.02, 0.12], [0, 0.12]], 0.1, 0.465, 0.33, { seg: 10 }), j.tube("gloss", "offwhite", [aA(0.1, 0.56, 0.33), aA(0.12, 0.64, 0.31)], 4e-3, { radial: 3 }), j.col(-0.8, 0, -0.35, 0.9, 0.8, 0.45), j.blob(2, 1.1);
} };
eM.cooler = { desc: "variant 0 = portable cooler box (two-tone body, white lid with hinge + latches, carry handle, drain plug, stickers); 1 = ICE merchandiser chest freezer with sliding glass lids and big ICE decals.", params: { color: "body" }, variants: 2, mount: "ground", build(j, A) {
  if ((A.variant ?? 0) % 2 === 0) {
    const T = A.color ?? LN(j, ["teal", "coral", "sky", "navy"]);
    j.box("gloss", T, 0.62, 0.34, 0.4, 0, 0.19, 0, { round: true, r: 0.05 }), j.box("gloss", "offwhite", 0.64, 0.08, 0.42, 0, 0.39, 0, { round: true, r: 0.035 }), j.box("rubber", "charcoal", 0.58, 0.03, 0.36, 0, 0.015, 0, { r: 0.01 }), j.tube("gloss", "offwhite", [aA(-0.28, 0.3, 0), aA(-0.34, 0.46, 0), aA(0.34, 0.46, 0), aA(0.28, 0.3, 0)], 0.014, { radial: 6 });
    for (const w of [-1, 1]) j.box("metal", "galv", 0.05, 0.06, 0.02, w * 0.2, 0.33, 0.212, { r: 8e-3 });
    j.cyl("rubber", "charcoal", 0.02, 0.02, 0.26, 0.06, 0.205, { rx: NM, seg: 8 }), j.decal("stk" + Math.floor(j.r(0, 15.99)), 0.1, 0.1, -0.15, 0.2, 0.203, { rz: -0.2 }), j.decal("stk" + Math.floor(j.r(0, 15.99)), 0.08, 0.08, 0.1, 0.24, 0.203, { rz: 0.4 }), j.col(-0.33, 0, -0.22, 0.33, 0.44, 0.22), j.blob(0.9, 0.7);
    return;
  }
  const N = 1.3, I = 0.75, D = 0.92;
  j.box("gloss", "offwhite", N, D - 0.08, I, 0, 0.08 + (D - 0.08) / 2, 0, { round: true, r: 0.05 }), j.box("rubber", "charcoal", N - 0.06, 0.08, I - 0.06, 0, 0.04, 0, { r: 0.015 }), j.box("gloss", "sky", N + 0.01, 0.12, I + 0.01, 0, D - 0.1, 0, { r: 0.02 });
  for (const T of [-1, 1]) j.box("metal", "galv", N / 2 - 0.05, 0.02, I - 0.1, T * (N / 4), D + 5e-3, 0, { r: 8e-3 }), j.box("paint", aN("sky", "white", 0.55), N / 2 - 0.12, 0.012, I - 0.18, T * (N / 4), D + 0.012, 0, { r: 4e-3 });
  j.decal("ice", 0.5, 0.5, -0.25, 0.46, I / 2 + 4e-3), j.decal("ice", 0.5, 0.5, 0.3, 0.46, I / 2 + 4e-3), j.decal("lb11", 0.5, 0.125, 0, 0.15, I / 2 + 4e-3), j.col(-N / 2, 0, -I / 2, N / 2, D + 0.02, I / 2), j.blob(N + 0.4, I + 0.4);
} };
eM.surfrack = { desc: "Timber A-frame surfboard rack with 3–4 glossy boards leaning in it (stringers, fins, leashes, wax sticker). variant 1 = a single board leaning against a wall behind it (-Z) with a fin up.", params: { count: "boards (4)" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = ["teal", "coral", "mustard", "sky", "lavender", "mint", "pink"], I = (w, O, z, C, E, P, g, Q = 2) => {
    j.push(w, O, z, E, C, P), j.sph("gloss", g, 1, 0, 0, 0, { ws: 16, hs: 10, sx: 0.26, sy: Q / 2, sz: 0.035 }), j.box("wood", "woodlight", 0.012, Q * 0.92, 0.074, 0, 0, 0, { r: 4e-3 }), j.box("gloss", "offwhite", 0.26, 0.04, 0.071, 0, Q * 0.2, 0, { r: 4e-3 }), j.box("gloss", aN(g, "offwhite", 0.5), 0.2, 0.03, 0.072, 0, Q * 0.17, 0, { r: 4e-3 }), j.box("gloss", "charcoal", 0.012, 0.12, 0.1, 0, -Q * 0.4, -0.07, { r: 4e-3, rx: -0.2 }), j.tube("rubber", "ink", [aA(0, -Q * 0.47, -0.02), aA(0.08, -Q * 0.5, -0.1), aA(0.14, -Q * 0.48 + 0.02, -0.16)], 6e-3, { radial: 3 }), j.pop();
  };
  if (M === 1) {
    I(0, 1.03, -0.17, -0.14, 0, j.r(-0.06, 0.06), A.color ?? LN(j, N), 2.1), j.blob(0.7, 0.5, 0, -0.1);
    return;
  }
  const D = Math.max(1, Math.min(4, A.count ?? 4)), T = 0.58 * D + 0.2;
  for (const w of [-T / 2, T / 2]) xI(j, "wood", "wooddark", aA(w, 0, -0.45), aA(w, 1.2, -0.05), 0.03, 6), xI(j, "wood", "wooddark", aA(w, 0, 0.3), aA(w, 1.2, -0.05), 0.03, 6);
  j.box("wood", "wood", T + 0.1, 0.06, 0.06, 0, 1.2, -0.05, { r: 0.012 }), j.box("wood", "wood", T + 0.1, 0.05, 0.05, 0, 0.35, -0.33, { r: 0.012 });
  for (let w = 0; w < D; w++) I(-T / 2 + 0.39 + w * 0.58, 1, 0.1, -0.2, j.r(-0.03, 0.03), j.r(-0.02, 0.02), LN(j, N));
  j.decal("stk7", 0.14, 0.14, 0, 1.2, -0.018), j.col(-T / 2 - 0.1, 0, -0.5, T / 2 + 0.1, 1.25, 0.35), j.blob(T + 0.6, 1.2);
} };
eM.stringlights = { desc: "Festoon string lights: a sagging cable with warm glowing bulbs (blooming) between two points along +X, optional painted poles at the ends.", params: { length: "m (6)", height: "m anchor (3.4)", sag: "m (L·0.07)", posts: "bool (false)", solid: "bool: posts collide (false)", count: "bulbs (≈ L/0.45)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.length ?? 6, N = A.height ?? 3.4, I = A.sag ?? Math.min(0.8, M * 0.07), D = A.endHeight ?? N;
  if (A.posts) for (const [z, C] of [[0, N], [M, D]]) j.lathe("paint", "concrete", [[0, 0], [0.18, 0], [0.19, 0.03], [0.15, 0.1], [0, 0.1]], z, 0, 0, { seg: 12 }), j.cyl("gloss", "charcoal", 0.035, C + 0.2, z, 0.1 + (C + 0.2) / 2 - 0.1, 0, { seg: 8 }), j.sph("gloss", "mustard", 0.05, z, C + 0.25, 0, { ws: 8, hs: 6 });
  const T = (z) => N + (D - N) * (z / M) - I * (1 - Math.pow(2 * z / M - 1, 2)), w = [];
  for (let z = 0; z <= 18; z++) {
    const C = z / 18 * M;
    w.push(aA(C, T(C), 0));
  }
  j.tube("paint", "charcoal", w, 6e-3, { radial: 4 });
  const O = A.count ?? Math.max(3, Math.round(M / 0.45));
  for (let z = 0; z < O; z++) {
    const C = (z + 0.5) / O * M, E = T(C);
    j.cyl("rubber", "charcoal", 0.012, 0.05, C, E - 0.03, 0, { seg: 6 }), j.sph("glow", z % 5 === 2 ? "#ffd9a8" : "#fff0c9", 0.034, C, E - 0.085, 0, { ws: 8, hs: 6, glow: 2.8, sy: 1.25 });
  }
  A.posts && (A.solid && (j.col(-0.12, 0, -0.12, 0.12, N, 0.12), j.col(M - 0.12, 0, -0.12, M + 0.12, D, 0.12)), j.blob(0.45, 0.45, 0, 0), j.blob(0.45, 0.45, M, 0));
} };
eM.cable = { desc: "Utility cables. variant 0 = 1–3 sagging cables between two anchors along +X (insulator clamps at the ends); 1 = wall cable tray (wall at z = 0) with bundled cables, brackets and a conduit drop to a junction box at the start.", params: { length: "m (5)", height: "m (3)", count: "cables (2)" }, variants: 2, mount: "ground|wall", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.length ?? 5, I = A.height ?? 3, D = Math.max(1, Math.min(3, A.count ?? 2));
  if (M === 0) {
    j.aoBase = null;
    for (let O = 0; O < D; O++) {
      const z = I - O * 0.12, C = Math.min(0.9, N * 0.08) * (1 + O * 0.15), E = [];
      for (let P = 0; P <= 16; P++) {
        const g = P / 16 * N;
        E.push(aA(g, z - C * (1 - Math.pow(2 * g / N - 1, 2)), O * 0.03));
      }
      j.tube("rubber", O === 1 ? "navy" : "ink", E, 0.011, { radial: 5 });
      for (const P of [0, N]) j.cyl("gloss", "offwhite", 0.025, 0.06, P, z, O * 0.03, { rz: NM, seg: 8, bevel: 0.01 }), j.box("metal", "darksteel", 0.05, 0.05, 0.06, P, z + 0.02, O * 0.03 - 0.02, { r: 8e-3 });
    }
    return;
  }
  j.aoBase = null;
  const T = 0.12;
  j.box("metal", "galv", N, 0.03, 0.2, N / 2, I - 0.07, T, { r: 6e-3 });
  for (const O of [-1, 1]) j.box("metal", "galv", N, 0.08, 0.012, N / 2, I - 0.03, T + O * 0.1, { r: 4e-3 });
  const w = ["ink", "navy", "coraldark", "ink"];
  for (let O = 0; O < 4; O++) j.cyl("rubber", w[O], 0.018, N, N / 2, I - 0.035, T - 0.06 + O * 0.04, { rz: NM, seg: 6 });
  for (let O = 0.4; O < N; O += 1.2) j.box("metal", "darksteel", 0.04, 0.04, 0.24, O, I - 0.11, T, { r: 8e-3 }), j.box("metal", "darksteel", 0.04, 0.2, 0.02, O, I - 0.2, 0.01, { r: 6e-3 });
  j.tube("metal", "galv", [aA(0.2, I - 0.05, T), aA(0.2, I - 0.25, T), aA(0.2, 1.1, T * 0.6)], 0.03, { radial: 8 }), j.box("paint", "offwhite", 0.42, 0.52, 0.18, 0.2, 0.8, 0.09, { round: true, r: 0.02 }), j.decal("lb0", 0.34, 0.085, 0.2, 0.95, 0.182), j.decal("dia2", 0.12, 0.12, 0.2, 0.73, 0.182);
  for (let O = 1.4; O < N - 0.3; O += 1.8) j.tube("rubber", "ink", [aA(O, I - 0.07, T), aA(O + 0.05, I - 0.5, T + 0.03), aA(O + 0.12, I - 0.55, T + 0.04)], 0.012, { radial: 5 });
} };
eM.cabinet = { desc: "HARBOR POWER street cabinet on a concrete plinth (front +Z): twin doors with seams, louvre vents, handle + lock, hazard diamonds, warning labels, conduits into the ground. variant 1 = wall-mounted fuse box (z = 0).", params: { color: "body (sage)" }, variants: 2, mount: "ground|wall", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.color ?? aN("mint", "galv", 0.55);
  if (M === 1) {
    j.aoBase = null, j.box("gloss", N, 0.5, 0.65, 0.2, 0, 0, 0.1, { round: true, r: 0.02 }), j.box("gloss", Aj(N, 0.94), 0.44, 0.59, 0.02, 0, 0, 0.205, { r: 8e-3 }), j.box("metal", "galv", 0.03, 0.1, 0.03, 0.17, 0, 0.22, { r: 8e-3 }), j.decal("dia2", 0.13, 0.13, -0.08, 0.14, 0.217), j.decal("lb0", 0.3, 0.075, 0, -0.18, 0.217), j.tube("metal", "galv", [aA(0, -0.33, 0.1), aA(0, -0.6, 0.1), aA(0, -2, 0.06)], 0.025, { radial: 6 });
    return;
  }
  const I = 0.95, D = 1.3, T = 0.42;
  j.box("paint", "concrete", I + 0.14, 0.14, T + 0.14, 0, 0.07, 0, { round: true, r: 0.03 }), j.box("gloss", N, I, D, T, 0, 0.14 + D / 2, 0, { round: true, r: 0.03 }), j.box("gloss", Aj(N, 0.9), I + 0.06, 0.05, T + 0.06, 0, 0.14 + D + 0.02, 0, { r: 0.015, rx: 0.04 }), j.box("paint", Aj(N, 0.7), 0.012, D - 0.12, 0.01, 0, 0.14 + D / 2, T / 2 + 2e-3, { r: 2e-3 });
  for (const w of [-1, 1]) for (let O = 0; O < 6; O++) j.box("paint", Aj(N, 0.8), 0.28, 0.018, 0.02, w * 0.24, 0.3 + O * 0.045, T / 2 + 5e-3, { rx: -0.5, r: 4e-3 });
  j.box("metal", "galv", 0.03, 0.14, 0.035, 0.08, 0.14 + D * 0.52, T / 2 + 0.015, { r: 8e-3 }), j.cyl("metal", "darksteel", 0.018, 0.02, 0.08, 0.14 + D * 0.62, T / 2 + 0.01, { rx: NM, seg: 8 }), j.box("paint", "offwhite", I - 0.08, 0.28, 6e-3, 0, 0.14 + D - 0.2, T / 2 + 3e-3, { r: 2e-3 }), j.decal("cab", I - 0.1, 0.25, 0, 0.14 + D - 0.2, T / 2 + 8e-3), j.decal("dia2", 0.16, 0.16, -0.25, 0.14 + D * 0.52, T / 2 + 6e-3), j.decal("lb0", 0.36, 0.09, 0.22, 0.14 + D * 0.4, T / 2 + 6e-3), j.decal("lb5", 0.26, 0.065, -I / 2 - 3e-3, 0.14 + D * 0.7, 0, { ry: -NM }), j.decal("stk" + Math.floor(j.r(0, 15.99)), 0.1, 0.1, 0.3, 0.14 + D * 0.25, T / 2 + 7e-3, { rz: 0.4 });
  for (const w of [-0.25, 0.25]) j.tube("metal", "galv", [aA(w, 0.3, -T / 2), aA(w, 0.3, -T / 2 - 0.1), aA(w, 0.02, -T / 2 - 0.2)], 0.035, { radial: 8 });
  j.col(-I / 2 - 0.07, 0, -T / 2 - 0.1, I / 2 + 0.07, 0.14 + D, T / 2 + 0.07), j.blob(I + 0.5, T + 0.5);
} };
eM.hydrant = { desc: "variant 0 = chunky harbor fire hydrant (bonnet, twin hose caps on chains, pentagon op-nut, flange bolts); 1 = wall fire inlet with twin couplings, caps and a FIRE INLET plate (wall z = 0).", params: { color: "body (coral red)" }, variants: 2, mount: "ground|wall", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.color ?? aN("coraldark", "coral", 0.3);
  if (M === 1) {
    j.aoBase = null, j.box("gloss", N, 0.5, 0.3, 0.06, 0, 0, 0.03, { round: true, r: 0.02 });
    for (const I of [-1, 1]) j.cyl("metal", "galv", 0.055, 0.14, I * 0.13, 0, 0.13, { rx: NM, seg: 12, bevel: 0.01 }), j.cyl("gloss", "charcoal", 0.06, 0.03, I * 0.13, 0, 0.21, { rx: NM, seg: 12, bevel: 8e-3 });
    j.decal("lb10", 0.36, 0.09, 0, 0.24, 5e-3);
    return;
  }
  j.lathe("gloss", N, [[0, 0], [0.17, 0], [0.18, 0.03], [0.17, 0.06], [0.13, 0.08], [0.12, 0.5], [0.14, 0.52], [0.14, 0.56], [0.12, 0.58], [0.1, 0.66], [0.05, 0.7], [0, 0.71]], 0, 0, 0, { seg: 16 });
  for (let I = 0; I < 6; I++) {
    const D = I / 6 * $A;
    j.cyl("metal", "galv", 0.012, 0.03, Math.cos(D) * 0.15, 0.08, Math.sin(D) * 0.15, { seg: 6 });
  }
  j.cyl("metal", "galv", 0.035, 0.06, 0, 0.73, 0, { seg: 5 });
  for (const I of [-1, 1]) j.cyl("gloss", N, 0.05, 0.1, I * 0.15, 0.36, 0, { rz: NM, seg: 12 }), j.cyl("gloss", "offwhite", 0.055, 0.035, I * 0.215, 0.36, 0, { rz: NM, seg: 12, bevel: 8e-3 }), j.tube("metal", "galv", [aA(I * 0.2, 0.33, 0.04), aA(I * 0.16, 0.24, 0.1), aA(I * 0.1, 0.3, 0.12)], 4e-3, { radial: 3 });
  j.cyl("gloss", N, 0.065, 0.1, 0, 0.3, 0.14, { rx: NM, seg: 12 }), j.cyl("gloss", "offwhite", 0.07, 0.04, 0, 0.3, 0.2, { rx: NM, seg: 12, bevel: 0.01 }), j.col(-0.25, 0, -0.2, 0.25, 0.75, 0.22), j.blob(0.7, 0.7);
} };
eM.newsbox = { desc: "variant 0 = newspaper vending box (window with a front page, coin slot, pull handle, legs); 1 = pair of boxes (HARBOR DAILY + INK WEEKLY); 2 = rounded harbor mail post box with collection plate.", params: {}, variants: 3, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 3, N = (I, D, T) => {
    j.push(I, 0, 0);
    for (const [w, O] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) j.box("metal", "darksteel", 0.04, 0.35, 0.04, w * 0.18, 0.175, O * 0.16, { r: 0.01 });
    j.box("gloss", D, 0.46, 0.6, 0.4, 0, 0.65, 0, { round: true, r: 0.04 }), j.box("gloss", Aj(D, 0.9), 0.48, 0.06, 0.42, 0, 0.97, 0, { round: true, r: 0.02 }), j.box("paint", "charcoal", 0.36, 0.3, 0.01, 0, 0.66, 0.2, { r: 6e-3 }), j.decal(T, 0.3, 0.26, 0, 0.67, 0.207), j.box("metal", "galv", 0.2, 0.03, 0.03, 0, 0.47, 0.215, { r: 8e-3 }), j.box("metal", "galv", 0.08, 0.08, 0.02, 0.14, 0.88, 0.205, { r: 8e-3 }), j.box("paint", "ink", 0.03, 5e-3, 0.01, 0.14, 0.9, 0.216, { r: 1e-3 }), j.pop();
  };
  if (M === 0) {
    N(0, LN(j, ["coral", "teal", "sky"]), "news0"), j.col(-0.25, 0, -0.22, 0.25, 1, 0.22), j.blob(0.7, 0.6);
    return;
  }
  if (M === 1) {
    N(-0.27, "coral", "news0"), N(0.27, "teal", "news1"), j.col(-0.52, 0, -0.22, 0.52, 1, 0.22), j.blob(1.3, 0.6);
    return;
  }
  j.lathe("gloss", "coraldark", [[0, 0], [0.26, 0], [0.27, 0.04], [0.23, 0.1], [0.22, 1.1], [0.25, 1.14], [0.25, 1.2], [0.2, 1.3], [0.1, 1.36], [0, 1.37]], 0, 0, 0, { seg: 20 }), j.box("paint", "charcoal", 0.26, 0.035, 0.05, 0, 1, 0.21, { r: 0.012 }), j.box("paint", "offwhite", 0.18, 0.18, 0.01, 0, 0.72, 0.222, { r: 4e-3, ry: 0 }), j.decal("mail", 0.17, 0.17, 0, 0.72, 0.232), j.col(-0.27, 0, -0.27, 0.27, 1.37, 0.27), j.blob(0.75, 0.75);
} };
eM.gascage = { desc: "Steel mesh safety cage with propane / gas cylinders (collar caps, valve guards), PROPANE + NO SMOKING labels, flammable diamond; padlocked door (front +Z).", params: { count: "cylinders (5)" }, variants: 1, mount: "ground", build(j, A) {
  const D = Math.max(1, Math.min(6, A.count ?? 5));
  for (const [w, O] of [[-1.3 / 2, -0.6 / 2], [1.3 / 2, -0.6 / 2], [-1.3 / 2, 0.6 / 2], [1.3 / 2, 0.6 / 2]]) j.box("metal", "galv", 0.04, 1.45, 0.04, w, 1.45 / 2, O, { r: 8e-3 });
  for (const w of [0.03, 1.45]) {
    for (const O of [-0.6 / 2, 0.6 / 2]) j.box("metal", "galv", 1.3, 0.03, 0.03, 0, w, O, { r: 6e-3 });
    for (const O of [-1.3 / 2, 1.3 / 2]) j.box("metal", "galv", 0.03, 0.03, 0.6, O, w, 0, { r: 6e-3 });
  }
  for (const [w, O, z, C] of [[1.3, 0, 0.6 / 2, 0], [1.3, 0, -0.6 / 2, 0], [0.6, 1.3 / 2, 0, NM], [0.6, -1.3 / 2, 0, NM]]) j.add("fence", vj.plane(w - 0.04, 1.45 - 0.06), "galv", O, 1.45 / 2, z, { ry: C, uvs: [(w - 0.04) / 0.1, (1.45 - 0.06) / 0.1] });
  j.add("fence", vj.plane(1.3 - 0.04, 0.6 - 0.04), "galv", 0, 1.45, 0, { rx: -NM, uvs: [(1.3 - 0.04) / 0.1, (0.6 - 0.04) / 0.1] });
  const T = ["teal", "coral", "galv", "teal", "mustard", "coral"];
  for (let w = 0; w < D; w++) {
    const O = -0.48 + w % 5 * 0.24, z = w < 5 ? -0.05 : 0.12;
    j.lathe("gloss", T[w], [[0, 0], [0.12, 0], [0.13, 0.03], [0.13, 0.85], [0.1, 0.95], [0.04, 0.99], [0, 0.99]], O, 0.03, z, { seg: 14 }), j.cyl("metal", "galv", 0.03, 0.08, O, 1.06, z, { seg: 8 }), j.tor("metal", "darksteel", 0.06, 0.012, O, 1.07, z, { rx: NM, rs: 4, ts: 12 });
  }
  j.decal("lb2", 0.4, 0.1, -0.3, 1.2, 0.6 / 2 + 0.02), j.decal("lb4", 0.4, 0.1, 0.3, 1.2, 0.6 / 2 + 0.02), j.decal("dia0", 0.2, 0.2, 0, 0.95, 0.6 / 2 + 0.02), j.box("metal", "darksteel", 0.05, 0.07, 0.03, 1.3 / 2 - 0.08, 0.75, 0.6 / 2 + 0.03, { r: 8e-3 }), j.col(-1.3 / 2 - 0.03, 0, -0.6 / 2 - 0.03, 1.3 / 2 + 0.03, 1.45, 0.6 / 2 + 0.03), j.blob(1.3 + 0.4, 0.6 + 0.4);
} };
eM.dish = { desc: "Rooftop kit. variant 0 = satellite dish on a pole mount with LNB arm, feed horn and cable; 1 = antenna mast with cross elements, guy wires and a blinking aviation light.", params: {}, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2;
  if (j.box("metal", "darksteel", 0.5, 0.04, 0.5, 0, 0.02, 0, { r: 0.01 }), M === 0) {
    j.cyl("metal", "galv", 0.035, 0.9, 0, 0.47, 0, { seg: 10 }), j.push(0, 0.95, 0, 0.3, -0.55), j.lathe("gloss", "offwhite", [[0, -0.03], [0.2, -5e-3], [0.36, 0.05], [0.45, 0.11], [0.46, 0.13], [0.44, 0.13], [0.35, 0.075], [0.2, 0.02], [0, 0]], 0, 0, 0, { seg: 20, rx: NM }), j.tube("metal", "galv", [aA(0, -0.35, 0.05), aA(0, -0.1, 0.35), aA(0, 0, 0.45)], 0.012, { radial: 5 }), j.cyl("gloss", "charcoal", 0.035, 0.1, 0, 0, 0.47, { rx: NM, seg: 10 }), j.pop(), j.tube("rubber", "ink", [aA(0.02, 0.9, 0.02), aA(0.05, 0.5, 0.05), aA(0.2, 0.05, 0.2)], 8e-3, { radial: 4 }), j.col(-0.3, 0, -0.3, 0.3, 1.3, 0.3), j.blob(0.9, 0.9);
    return;
  }
  j.cyl("metal", "galv", 0.03, 2.6, 0, 1.3, 0, { seg: 8 });
  for (let N = 0; N < 4; N++) {
    const I = 1.4 + N * 0.32, D = 0.9 - N * 0.16;
    j.cyl("metal", "galv", 0.01, D, 0, I, 0, { rz: NM, seg: 5 });
    for (let T = -2; T <= 2; T++) j.cyl("metal", "galv", 6e-3, 0.25, T * D * 0.2, I, 0.06, { rx: NM, seg: 4 });
  }
  for (const N of [0.5, 2.6, 4.7]) j.tube("metal", "galv", [aA(0, 2.2, 0), aA(Math.cos(N) * 0.9, 0.02, Math.sin(N) * 0.9)], 3e-3, { radial: 3 });
  j.sph("glow", "coral", 0.04, 0, 2.64, 0, { ws: 8, hs: 6, glow: 0.5 }), j.blink("#ff6a5a", 0, 2.64, 0, { size: 0.045, rate: 0.6, lo: 0.2, hi: 5 }), j.col(-0.1, 0, -0.1, 0.1, 2.6, 0.1), j.blob(0.8, 0.8);
} };
eM.ropecoil = { desc: "Coiled mooring rope (stacked turns with a loose tail). variant 1 = two coils, one on a pallet-sized mat.", params: { color: "rope (cream)" }, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = A.color ?? aN("cream", "kraft", 0.35), I = (D, T, w, O) => {
    for (let z = 0; z < O; z++) j.tor("rubber", Aj(N, 0.92 + z % 2 * 0.1), w - z * 0.012, 0.035, D, 0.035 + z * 0.058, T, { rx: NM, rs: 6, ts: 24 });
    j.tube("rubber", N, [aA(D + w, 0.035 + (O - 1) * 0.058, T), aA(D + w + 0.25, 0.04, T + 0.1), aA(D + w + 0.55, 0.035, T - 0.05), aA(D + w + 0.8, 0.035, T + 0.12)], 0.034, { radial: 6 });
  };
  I(0, 0, 0.36, 4), M === 1 && I(-0.9, 0.35, 0.3, 3), j.blob(M ? 2 : 1.3, M ? 1.3 : 1, M ? -0.3 : 0.1, 0);
} };
eM.crabtrap = { desc: "Crab / lobster pot: timber-framed mesh cage with an entry funnel, a coral marker float and a rope. variant 1 = a stack of three pots.", params: {}, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = (I, D, T, w) => {
    j.push(I, D, T, w);
    const O = 0.75, z = 0.55, C = 0.4;
    for (const [E, P] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) j.box("wood", "wooddark", 0.035, C, 0.035, E * O / 2, C / 2, P * z / 2, { r: 6e-3 });
    for (const E of [0.02, C]) {
      for (const P of [-1, 1]) j.box("wood", "wood", O, 0.035, 0.035, 0, E, P * z / 2, { r: 6e-3 });
      for (const P of [-1, 1]) j.box("wood", "wood", 0.035, 0.035, z, P * O / 2, E, 0, { r: 6e-3 });
    }
    for (const [E, P, g, Q, x, U, k] of [[O, C, 0, C / 2, z / 2, 0, 0], [O, C, 0, C / 2, -z / 2, 0, 0], [z, C, O / 2, C / 2, 0, NM, 0], [z, C, -O / 2, C / 2, 0, NM, 0], [O, z, 0, C, 0, 0, -NM], [O, z, 0, 0.02, 0, 0, -NM]]) j.add("fence", vj.plane(E, P), aN("teal", "galv", 0.4), g, Q, x, { ry: U, rx: k, uvs: [E / 0.07, P / 0.07] });
    j.lathe("rubber", aN("teal", "galv", 0.4), [[0.16, 0], [0.05, 0.22]], O / 2 - 0.02, C / 2, 0, { seg: 10, rz: NM }), j.pop();
  };
  N(0, 0, 0, 0), M === 1 && (N(0.05, 0.42, 0.02, 0.1), N(-0.05, 0.84, -0.03, -0.12)), j.sph("gloss", "coral", 0.14, 0.62, 0.14, 0.32, { ws: 12, hs: 8, sy: 1.25 }), j.cyl("gloss", "offwhite", 0.142, 0.05, 0.62, 0.14, 0.32, { seg: 12, open: true }), j.tube("rubber", aN("cream", "kraft", 0.35), [aA(0.36, 0.3, 0.1), aA(0.5, 0.1, 0.25), aA(0.62, 0.3, 0.32)], 0.012, { radial: 4 }), j.col(-0.4, 0, -0.3, 0.4, M ? 1.25 : 0.42, 0.3), j.blob(1.2, 0.9);
} };
eM.net = { desc: "Fishing net hung to dry over two posts (along +X): sagging mesh with a float line of coral + white corks, weighted bottom rope.", params: { length: "m (2.4)", height: "m (1.9)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.length ?? 2.4, N = A.height ?? 1.9;
  for (const O of [0, M]) j.cyl("wood", "wooddark", 0.05, N + 0.1, O, (N + 0.1) / 2, 0, { seg: 8 }), j.sph("wood", "wooddark", 0.055, O, N + 0.1, 0, { ws: 8, hs: 5, half: true });
  const I = new GI(), D = 10, T = 6;
  for (let O = 0; O <= T; O++) for (let z = 0; z <= D; z++) {
    const C = z / D, E = O / T, P = 0.18 * Math.sin(nM * C);
    I.v(C * M, N - P - E * (N - 0.35 - P * 0.5) + Math.sin(C * 9 + E * 4) * 0.02, 0.04 * Math.sin(C * 7 + E * 5) + E * 0.12, 0, 0, 1, C * M / 0.12, E * (N - 0.3) / 0.12, 1);
  }
  for (let O = 0; O < T; O++) for (let z = 0; z < D; z++) {
    const C = O * (D + 1) + z;
    I.quad(C, C + 1, C + D + 2, C + D + 1);
  }
  j.add("fence", I.geo(), aN("teal", "navy", 0.3), 0, 0, 0, { uvs: [1, 1] });
  const w = [];
  for (let O = 0; O <= 12; O++) {
    const z = O / 12;
    w.push(aA(z * M, N - 0.18 * Math.sin(nM * z), 0.02));
  }
  j.tube("rubber", aN("cream", "kraft", 0.35), w, 0.012, { radial: 4 });
  for (let O = 1; O < 8; O++) {
    const z = O / 8;
    j.sph("gloss", O % 2 ? "coral" : "offwhite", 0.045, z * M, N - 0.18 * Math.sin(nM * z), 0.03, { ws: 8, hs: 6, sx: 1.4 });
  }
  j.col(-0.07, 0, -0.07, 0.07, N, 0.07), j.col(M - 0.07, 0, -0.07, M + 0.07, N, 0.07), j.blob(0.35, 0.35, 0, 0), j.blob(0.35, 0.35, M, 0);
} };
eM.hosereel = { desc: "Wall-mounted wash-down hose reel (wall z = 0): back plate, drum with coiled hose, crank handle, nozzle and a WASH DOWN label; a tap below.", params: {}, variants: 1, mount: "wall", build(j, A) {
  j.aoBase = null, j.box("metal", "darksteel", 0.36, 0.42, 0.02, 0, 0, 0.01, { r: 8e-3 }), j.cyl("gloss", "coral", 0.22, 0.24, 0, 0, 0.18, { rx: NM, seg: 18, open: true });
  for (const M of [0.05, 0.31]) j.cyl("gloss", "coral", 0.26, 0.015, 0, 0, M, { rx: NM, seg: 18 });
  for (let M = 0; M < 3; M++) j.tor("rubber", "mustard", 0.235, 0.022, 0, 0, 0.1 + M * 0.05, { rs: 5, ts: 20 });
  j.tube("metal", "galv", [aA(0.2, 0.05, 0.34), aA(0.2, 0.05, 0.4), aA(0.3, 0.05, 0.4)], 0.01, { radial: 4 }), j.tube("rubber", "mustard", [aA(0.22, -0.1, 0.2), aA(0.3, -0.35, 0.25), aA(0.25, -0.55, 0.3)], 0.022, { radial: 6 }), j.cyl("gloss", "charcoal", 0.03, 0.14, 0.25, -0.62, 0.3, { seg: 8, bevel: 0.01 }), j.decal("lb15", 0.3, 0.075, 0, 0.3, 0.022), j.tube("metal", "galv", [aA(-0.1, -0.6, 0), aA(-0.1, -0.6, 0.1), aA(-0.1, -0.7, 0.12)], 0.02, { radial: 6 }), j.cyl("gloss", "navy", 0.035, 0.02, -0.1, -0.55, 0.1, { seg: 8 });
} };
eM.palletjack = { desc: "Hand pallet jack (forks along -X, tow handle up at +X), painted body, steering wheel pair and load rollers.", params: { color: "body (mustard)" }, variants: 1, mount: "ground", build(j, A) {
  const M = A.color ?? "mustard";
  for (const N of [-1, 1]) j.box("gloss", M, 1.15, 0.07, 0.16, -0.45, 0.075, N * 0.26, { r: 0.02 }), j.cyl("rubber", "charcoal", 0.035, 0.12, -0.95, 0.035, N * 0.26, { rx: NM, seg: 10 });
  j.box("gloss", M, 0.16, 0.2, 0.7, 0.18, 0.15, 0, { round: true, r: 0.03 }), j.cyl("gloss", M, 0.06, 0.3, 0.2, 0.36, 0, { seg: 12 });
  for (const N of [-1, 1]) j.cyl("rubber", "charcoal", 0.09, 0.06, 0.24, 0.09, N * 0.08, { rx: NM, seg: 14, bevel: 0.015 });
  j.tube("gloss", M, [aA(0.22, 0.5, 0), aA(0.45, 1.15, 0)], 0.022, { radial: 7 }), j.tube("gloss", M, [aA(0.45, 1.15, -0.16), aA(0.5, 1.28, -0.12), aA(0.5, 1.28, 0.12), aA(0.45, 1.15, 0.16)], 0.018, { radial: 6 }), j.box("gloss", "coral", 0.04, 0.06, 0.1, 0.49, 1.24, 0, { r: 0.01 }), j.col(-1.05, 0, -0.35, 0.35, 0.5, 0.35), j.blob(1.5, 0.9, -0.35, 0);
} };
eM.sandbags = { desc: "Stack of plump burlap sandbags (brick-bonded rows, tied ears) along +X.", params: { length: "bags per row (3)", height: "rows (2)" }, variants: 1, mount: "ground", build(j, A) {
  const M = Math.max(1, A.length ?? 3), N = Math.max(1, A.height ?? 2), I = 0.58;
  for (let D = 0; D < N; D++) for (let T = 0; T < M - D % 2; T++) {
    const w = (T + D % 2 * 0.5) * I, O = 0.09 + D * 0.16;
    j.box("rubber", Aj("kraft", j.r(0.86, 1.02)), I - 0.04, 0.17, 0.36, w, O, j.r(-0.02, 0.02), { round: true, r: 0.075, ry: j.r(-0.06, 0.06) }), j.sph("rubber", Aj("kraft", 0.8), 0.03, w + I / 2 - 0.03, O + 0.02, 0, { ws: 6, hs: 4 });
  }
  j.col(-I / 2, 0, -0.2, (M - 0.5) * I, N * 0.16 + 0.02, 0.2), j.blob(M * I + 0.3, 0.7, (M - 1) * I / 2, 0);
} };
eM.aboard = { desc: "A-frame sandwich board (front +Z): timber frame, chalk menus on both faces, little chain spreader.", params: {}, variants: 2, mount: "ground", build(j, A) {
  const M = (A.variant ?? 0) % 2, N = 0.95, I = 0.6, D = 0.2;
  for (const T of [-1, 1]) j.push(0, 0, T * 0.2, 0, -T * D), j.box("wood", "wooddark", I, N, 0.03, 0, N / 2, 0, { r: 0.012 }), j.decal(M ? "chalk2" : "chalk", I - 0.08, M ? (I - 0.08) * 0.5 : I - 0.08, 0, N * 0.58, T * 0.02, { ry: T > 0 ? 0 : nM }), M && j.decal("chalk2", I - 0.08, (I - 0.08) * 0.5, 0, N * 0.25, T * 0.02, { ry: T > 0 ? 0 : nM }), j.pop();
  j.tube("metal", "galv", [aA(-I / 2 + 0.05, 0.35, -0.12), aA(-I / 2 + 0.05, 0.33, 0.12)], 4e-3, { radial: 3 }), j.col(-I / 2, 0, -0.22, I / 2, N, 0.22), j.blob(I + 0.3, 0.7);
} };
eM.ferryboard = { desc: "FERRY TIMES timetable board under a little pitched roof on two posts (front +Z); wall:true hangs the board flat on a wall (z = 0).", params: { wall: "bool" }, variants: 1, mount: "ground|wall", build(j, A) {
  if (A.wall) {
    j.aoBase = null, j.box("paint", "navy", 1.2 + 0.08, 0.8 + 0.08, 0.04, 0, 0, 0.02, { round: true, r: 0.015 }), j.decal("ferry", 1.2, 0.8, 0, 0, 0.042);
    return;
  }
  const I = 1.35;
  for (const D of [-1, 1]) j.box("gloss", "navy", 0.07, I + 0.8 / 2 + 0.3, 0.07, D * (1.2 / 2 + 0.06), (I + 0.8 / 2 + 0.3) / 2, 0, { r: 0.015 }), j.box("metal", "darksteel", 0.2, 0.02, 0.2, D * (1.2 / 2 + 0.06), 0.01, 0, { r: 5e-3 });
  j.box("paint", "navy", 1.2 + 0.08, 0.8 + 0.08, 0.05, 0, I, 0, { round: true, r: 0.015 }), j.decal("ferry", 1.2, 0.8, 0, I, 0.027);
  for (const D of [-1, 1]) j.box("gloss", "coral", 1.2 + 0.4, 0.03, 0.3, 0, I + 0.8 / 2 + 0.36, D * 0.13, { rx: D * 0.4, r: 0.01 });
  j.sph("gloss", "mustard", 0.05, 0, I + 0.8 / 2 + 0.45, 0, { ws: 8, hs: 6 }), j.col(-1.2 / 2 - 0.1, 0, -0.08, 1.2 / 2 + 0.1, I + 0.8 / 2 + 0.3, 0.08), j.blob(1.2 + 0.5, 0.5);
} };
eM.pot = { desc: "Planting. variant 0 = big glazed pot with a round shrub, 1 = cluster of three terracotta pots with flowers + a herb, 2 = wall-mounted hanging basket (z = 0) with trailing leaves and flowers.", params: {}, variants: 3, mount: "ground|wall", build(j, A) {
  const M = (A.variant ?? 0) % 3, N = j.k.qf >= 1 ? 2 : 1, I = (D, T, w, O, z) => {
    j.lathe("gloss", z, [[0, 0], [w * 0.7, 0], [w * 0.75, 0.02], [w, O - 0.04], [w * 1.08, O - 0.03], [w * 1.08, O], [w * 0.95, O], [0, O - 0.02]], D, 0, T, { seg: 16 }), j.cyl("paint", "soil", w * 0.93, 0.02, D, O - 0.03, T, { seg: 14 });
  };
  if (M === 0) {
    I(0, 0, 0.36, 0.62, LN(j, ["teal", "navy", "coraldark", "mustarddark"])), gE(j, 5, 0.42, 0.56, 0.05, N, Math.floor(j.r(0, 6))), j.col(-0.4, 0, -0.4, 0.4, 0.62, 0.4), j.blob(1.1, 1.1);
    return;
  }
  if (M === 1) {
    const D = aN("coral", "kraft", 0.45);
    for (const [T, w, O, z] of [[0, 0, 0.24, 0.42], [0.42, 0.12, 0.18, 0.3], [-0.3, 0.26, 0.16, 0.26]]) {
      I(T, w, O, z, D);
      const C = LN(j, ["pink", "mustard", "lavender", "coral", "offwhite"]);
      j.add("foliage", vj.blob(1, 1, Math.floor(j.r(0, 8))), "leafdark", T, z + 0.06, w, { s: O * 0.9, sy: O * 0.6 });
      for (let E = 0; E < 6; E++) {
        const P = j.r(0, $A), g = j.r(0, O * 0.6);
        j.add("foliage", vj.blob(1, 0, E % 8), C, T + Math.cos(P) * g, z + 0.12 + j.r(0, 0.05), w + Math.sin(P) * g, { s: 0.05 });
      }
    }
    j.col(-0.48, 0, -0.26, 0.62, 0.42, 0.44), j.blob(1.4, 1, 0.05, 0.12);
    return;
  }
  j.aoBase = null, j.box("metal", "darksteel", 0.04, 0.3, 0.02, 0, 0.1, 0.01, { r: 6e-3 }), j.tube("metal", "darksteel", [aA(0, 0.22, 0.01), aA(0, 0.25, 0.25), aA(0, 0.2, 0.36)], 0.012, { radial: 5 });
  for (const D of [0, 2.1, 4.2]) j.tube("metal", "darksteel", [aA(0, 0.2, 0.36), aA(Math.cos(D) * 0.2, -0.05, 0.36 + Math.sin(D) * 0.2)], 4e-3, { radial: 3 });
  j.lathe("wood", "kraft", [[0, -0.22], [0.12, -0.2], [0.2, -0.1], [0.23, -0.04], [0.22, -0.04], [0, -0.06]], 0, 0, 0.36, { seg: 14 }), j.add("foliage", vj.blob(1, 1, 3), "leaf", 0, -0.02, 0.36, { s: 0.24, sy: 0.14 });
  for (let D = 0; D < 7; D++) {
    const T = D / 7 * $A;
    j.tube("foliage", "leafdark", [aA(Math.cos(T) * 0.2, -0.05, 0.36 + Math.sin(T) * 0.2), aA(Math.cos(T) * 0.26, -0.3 - j.r(0, 0.15), 0.36 + Math.sin(T) * 0.26)], 0.012, { radial: 3 });
  }
  for (let D = 0; D < 8; D++) {
    const T = j.r(0, $A);
    j.add("foliage", vj.blob(1, 0, D % 8), LN(j, ["pink", "mustard", "offwhite", "lavender"]), Math.cos(T) * 0.17, 0.02, 0.36 + Math.sin(T) * 0.17, { s: 0.045 });
  }
} };
function w7() {
  const j = [];
  j.push({ g: vj.cyl(0.045, 0.045, 0.05, 12, false), m: iT(0, 0, 0, NM), c: Wj("charcoal"), ao: null });
  for (let A = 0; A < 5; A++) {
    const M = A / 5 * $A, N = iT(0, 0, 0, 0, 0, M).multiply(iT(0.12, 0, 0, 0.42, 0, 0));
    j.push({ g: sQ(0.16, 0.085, 0.012, 6e-3), m: N, c: Wj("charcoal"), ao: null });
  }
  return SQ(j);
}
function O7() {
  const j = new GI(), A = 14, M = 7, N = 0.2;
  for (let D = 0; D < A; D++) for (const T of [1, -1]) {
    const w = [];
    for (let O = 0; O <= M; O++) {
      const z = O / M, C = -0.25 + z * 1.25, E = N * Math.cos(C) + 0.01, P = 0.03 + N * 0.95 * (Math.sin(C) + 0.25), g = D / A * $A + z * 0.8, Q = Math.cos(g), x = Math.sin(g), U = -x * 0.75 - Q * 0.35, k = Q * 0.75 - x * 0.35, s = 0.075 * Math.cos(C * 0.8), v = Q * T, S = x * T, q = T > 0 ? 0 : -4e-3;
      w.push([j.v(Q * (E + q), P, x * (E + q), v, 0.2 * T, S), j.v(Q * (E + q) + U * s, P, x * (E + q) + k * s, v, 0.2 * T, S)]);
    }
    for (let O = 0; O < M; O++) j.quad(w[O][0], w[O][1], w[O + 1][1], w[O + 1][0]);
  }
  const I = [{ g: j.geo(), m: new YM(), c: Wj("galv"), ao: null }, { g: vj.sph(0.07, 12, 5, true), m: iT(0, 0.03 + N * 0.95 * (Math.sin(1) + 0.25), 0), c: Wj("galv"), ao: null }, { g: vj.tor(0.2, 0.014, 5, 20, $A), m: iT(0, 0.03, 0, NM), c: Wj("galv"), ao: null }];
  return SQ(I);
}
const C7 = { paint: true, gloss: true, metal: true, wood: true, rubber: true, foliage: true, fence: true, glow: false, blob: false }, iy = new YM(), Xi = new YM(), QO = new lA(), _i = new lA(1, 1, 1), zx = /* @__PURE__ */ new Map(), BQ = { THREE: mo, PALETTE: jx, ACCENTS: jU, PI: nM, TAU: $A, HP: NM, P3: aA, col: Wj, shade: Aj, mixc: aN, mulberry32: lI, chamferBox: sQ, roundBox: NU, latheGeo: IU, tubeGeo: DU, extrudeGeo: TU, polyNormals: oQ, offsetPoly: uQ, blobGeo: zU, puffGeo: wU, rcylProf: OU, flangeProf: QT, circlePts: OT, smoothPts: E4, roundPoly: Nx, arcPts: iC, woodCrate: cw, drum: Ix, pallet: Dx, rod: xI, wheel: Tx, TIRE: iU, LIFERING: LU, noShadow: (j) => j + "~ns", spinTemplate: (j, A) => {
  zx.set(j, A);
} };
pS(eM, BQ);
fS(eM, BQ);
for (const [j, A] of Object.entries(AP)) {
  if (!A.register) continue;
  const M = new Set(Object.keys(eM));
  try {
    A.register(eM, BQ);
  } catch (N) {
    console.error(`[inkwave] stage prop pack ${j} failed`, N);
    for (const I of Object.keys(eM)) M.has(I) || delete eM[I];
  }
}
class rQ {
  constructor(A, M = {}) {
    this.scene = A, this.castShadow = M.castShadow !== false, this.quality = M.quality || "high", this.qf = { low: 0.6, medium: 0.8, high: 1 }[this.quality] ?? 1, this.group = new oj(), this.group.name = "props", A && A.add(this.group), this.uTime = { value: 0 }, this.teamColors = [new lA("#ff8a14"), new lA("#2f5bff")], this._headless = !!M.headless || typeof document > "u", this._headless || this._makeMaterials(), this._buckets = /* @__PURE__ */ new Map(), this._spin = [], this._blink = [], this._flags = [], this._banners = [], this._meshes = [], this._inst = [], this._tpl = {}, this._B = new KS(this), this.count = 0, this.lastTris = 0;
  }
  _makeMaterials() {
    const A = document.createElement("canvas");
    A.width = xC, A.height = QC;
    const M = new mw(A);
    M.colorSpace = Tj, M.anisotropy = 8;
    const N = () => {
      RS(A.getContext("2d")), M.needsUpdate = true;
    };
    N(), GS().then(() => {
      this._disposed || N();
    }), this.atlas = M, this.chain = Wi(128, 128, (I, D, T) => {
      I.clearRect(0, 0, D, T), I.strokeStyle = "#fff", I.lineWidth = 7, I.lineCap = "round";
      for (const w of [-D, 0, D]) I.beginPath(), I.moveTo(w, 0), I.lineTo(w + D, T), I.stroke(), I.beginPath(), I.moveTo(w + D, 0), I.lineTo(w, T), I.stroke();
    }, true), this.blobTex = Wi(64, 64, (I, D, T) => {
      const w = I.createRadialGradient(D / 2, T / 2, 0, D / 2, T / 2, D / 2);
      w.addColorStop(0, "rgba(255,255,255,1)"), w.addColorStop(0.45, "rgba(255,255,255,0.7)"), w.addColorStop(1, "rgba(255,255,255,0)"), I.fillStyle = w, I.fillRect(0, 0, D, T);
    }), this.blobTex.colorSpace = xN, this.mat = { paint: new yj({ map: M, vertexColors: true, roughness: 0.6, metalness: 0, alphaTest: 0.5 }), gloss: new OI({ vertexColors: true, roughness: 0.36, metalness: 0, clearcoat: 0.65, clearcoatRoughness: 0.2 }), metal: new yj({ vertexColors: true, roughness: 0.33, metalness: 0.7 }), wood: new yj({ vertexColors: true, roughness: 0.74, metalness: 0 }), rubber: new yj({ vertexColors: true, roughness: 0.86, metalness: 0 }), foliage: new yj({ vertexColors: true, roughness: 0.7, metalness: 0, side: hj }), glow: new Vj({ map: M, vertexColors: true }), fence: new yj({ map: this.chain, vertexColors: true, alphaTest: 0.4, side: hj, metalness: 0.5, roughness: 0.4 }), blob: new Vj({ map: this.blobTex, color: 1843763, transparent: true, opacity: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), blink: new Vj({ color: 16777215 }), cloth: tS(M, this.uTime), clothDepth: bS(this.uTime) }, this.mat.fence.alphaToCoverage = true;
  }
  _push(A, M) {
    let N = this._buckets.get(A);
    N || (N = [], this._buckets.set(A, N)), N.push(M);
  }
  _tplGeo(A) {
    return this._tpl[A] || (this._tpl[A] = zx.has(A) ? zx.get(A)() : A === "fan" ? w7() : O7()), this._tpl[A];
  }
  _tplTris(A) {
    return g4(this._tplGeo(A));
  }
  add(A, M = {}) {
    const N = eM[A];
    if (!N) return console.warn("[props] unknown prop type", A), { colliders: [] };
    const I = M.pos || [0, 0, 0], D = M.rotY || 0, T = M.scale ?? 1, w = M.seed ?? (Math.round(I[0] * 131) ^ Math.round(I[2] * 71) ^ Math.round(I[1] * 17)) + 1013, O = this._B;
    return O.begin(I, D, T, w, N.mount !== "wall" || A === "pipes" || A === "ladder" || A === "container_door"), O.tris = 0, N.build(O, M), this.lastTris = O.tris, this.count++, { colliders: this._xfCols(O.cols, I, D, T, !!M.oboxCols) };
  }
  _xfCols(A, M, N, I, D = false) {
    const T = Math.round(N / NM), w = Math.abs(N - T * NM) < 1e-3, O = (T % 4 + 4) % 4, z = w ? [1, 0, -1, 0][O] : Math.cos(N), C = w ? [0, 1, 0, -1][O] : Math.sin(N), E = [], P = (g) => Math.round(g * 1e4) / 1e4;
    for (const g of A) {
      let Q;
      if (w) {
        let x = 1 / 0, U = 1 / 0, k = -1 / 0, s = -1 / 0;
        for (const [v, S] of [[g[0], g[2]], [g[3], g[2]], [g[3], g[5]], [g[0], g[5]]]) {
          const q = (v * z + S * C) * I, c = (-v * C + S * z) * I;
          x = Math.min(x, q), k = Math.max(k, q), U = Math.min(U, c), s = Math.max(s, c);
        }
        Q = { min: [P(M[0] + x), P(M[1] + g[1] * I), P(M[2] + U)], max: [P(M[0] + k), P(M[1] + g[4] * I), P(M[2] + s)] };
      } else {
        const x = (g[0] + g[3]) / 2, U = (g[2] + g[5]) / 2, k = (x * z + U * C) * I, s = (-x * C + U * z) * I;
        Q = { obox: true, center: [P(M[0] + k), P(M[1] + (g[1] + g[4]) / 2 * I), P(M[2] + s)], size: [P((g[3] - g[0]) * I), P((g[4] - g[1]) * I), P((g[5] - g[2]) * I)], rotY: N * 180 / Math.PI };
      }
      g[6] & 1 && (Q.roof = true), g[6] & 2 && (Q.rail = true), g[6] & 4 && (Q.perch = true), E.push(Q);
    }
    return E;
  }
  build() {
    if (this._disposeMeshes(), this._headless) return this;
    for (const [M, N] of this._buckets) {
      if (!N.length) continue;
      const [I, D] = M.split("~"), T = new GM(SQ(N), this.mat[I]);
      T.name = "props:" + M, T.castShadow = this.castShadow && C7[I] && D !== "ns", T.receiveShadow = I !== "glow" && I !== "blob", I === "blob" && (T.renderOrder = 1), T.matrixAutoUpdate = false, this.group.add(T), this._meshes.push(T);
    }
    const A = {};
    for (const M of this._spin) (A[M.kind] ||= []).push(M);
    for (const M in A) {
      const N = A[M], I = new iI(this._tplGeo(M), M === "fan" ? this.mat.paint : this.mat.metal, N.length);
      N.forEach((D, T) => I.setMatrixAt(T, D.base)), I.castShadow = this.castShadow, I.receiveShadow = true, I.frustumCulled = false, I.name = "props:spin:" + M, I.userData = { recs: N, axis: M === "fan" ? "z" : "y" }, this.group.add(I), this._inst.push(I);
    }
    if (this._blink.length) {
      const M = new iI(vj.sph(1, 8, 6, false), this.mat.blink, this._blink.length);
      this._blink.forEach((N, I) => {
        M.setMatrixAt(I, N.m), M.setColorAt(I, QO.copy(N.color).multiplyScalar(N.hi));
      }), M.frustumCulled = false, M.name = "props:blink", M.userData = { recs: this._blink, blink: true }, this.group.add(M), this._inst.push(M);
    }
    for (const [M, N, I] of [[this._flags, () => lS(), "flags"], [this._banners, () => dS(0.8, 1.9), "banners"]]) {
      if (!M.length) continue;
      const D = new iI(N(), this.mat.cloth, M.length);
      M.forEach((T, w) => {
        D.setMatrixAt(w, T.m), D.setColorAt(w, _i);
      }), D.customDepthMaterial = this.mat.clothDepth, D.castShadow = this.castShadow, D.receiveShadow = true, D.frustumCulled = false, D.name = "props:" + I, D.userData = { recs: M, cloth: true }, this.group.add(D), this._inst.push(D);
    }
    return this._applyColors(), this;
  }
  _applyColors() {
    for (const A of this._inst) A.userData.cloth && (A.userData.recs.forEach((M, N) => {
      M.team != null ? QO.copy(this.teamColors[M.team]).lerp(_i, M.tint || 0) : QO.copy(M.color), A.setColorAt(N, QO);
    }), A.instanceColor.needsUpdate = true);
  }
  setNight(A = 0) {
    this.mat?.glow && this.mat.glow.color.setScalar(0.5 + 0.5 * Math.min(1, Math.max(0, A)));
  }
  setTeamColors(A, M) {
    A != null && this.teamColors[0].set(A), M != null && this.teamColors[1].set(M), this._applyColors();
  }
  update(A, M) {
    this.uTime.value = M;
    for (const N of this._inst) {
      const I = N.userData;
      if (I.axis) {
        const D = I.recs;
        for (let T = 0; T < D.length; T++) {
          const w = D[T], O = M * w.speed + w.phase;
          I.axis === "z" ? iy.makeRotationZ(O) : iy.makeRotationY(O), Xi.multiplyMatrices(w.base, iy), N.setMatrixAt(T, Xi);
        }
        N.instanceMatrix.needsUpdate = true;
      } else if (I.blink) {
        const D = I.recs;
        for (let T = 0; T < D.length; T++) {
          const w = D[T], O = 0.5 + 0.5 * Math.sin(M * w.rate * $A + w.phase), z = O * O * (3 - 2 * O), C = z > 0.6 ? 1 : z / 0.6 * 0.25;
          N.setColorAt(T, QO.copy(w.color).multiplyScalar(w.lo + (w.hi - w.lo) * C));
        }
        N.instanceColor.needsUpdate = true;
      }
    }
  }
  stats() {
    let A = 0;
    for (const M of this._meshes) A += g4(M.geometry);
    for (const M of this._inst) A += g4(M.geometry) * M.count;
    return { props: this.count, meshes: this._meshes.length + this._inst.length, merged: this._meshes.length, instanced: this._inst.length, triangles: Math.round(A) };
  }
  _disposeMeshes() {
    for (const A of this._meshes) A.geometry.dispose(), this.group.remove(A);
    for (const A of this._inst) A.userData.cloth && A.geometry.dispose(), A.dispose?.(), this.group.remove(A);
    this._meshes = [], this._inst = [];
  }
  clear() {
    this._disposeMeshes(), this._buckets.clear(), this._spin = [], this._blink = [], this._flags = [], this._banners = [], this.count = 0;
  }
  dispose() {
    if (this.clear(), this._disposed = true, this.mat) for (const A in this.mat) this.mat[A].dispose();
    for (const A in this._tpl) this._tpl[A].dispose();
    this.atlas?.dispose(), this.chain?.dispose(), this.blobTex?.dispose(), this.group.removeFromParent();
  }
  static triangles(A, M = {}) {
    const N = new rQ(null, { quality: M.quality || "high", headless: true });
    return N.add(A, M), N.lastTris;
  }
}
Object.entries(eM).map(([j, A]) => ({ type: j, description: A.desc, params: A.params, variants: A.variants, mount: A.mount }));
const uj = Math.PI, g7 = { halyard: [{ type: "pieredge", pos: [-19.5, 0, -31], rotY: 0, length: 15, s0: 0.75, s1: 0.75, cleats: [3.2, 8.6], fenders: [1.9, 5.3, 12] }, { type: "pieredge", pos: [4.5, 0, -31], rotY: 0, length: 5.5, s0: 0.75, s1: 0.75 }, { type: "pieredge", pos: [-4.5, 0, -31], rotY: -uj / 2, length: 18.6, ext0: -0.1, ext1: -0.1, dfender: true, cleats: [4.2, 9.4, 14.6], ladders: [2.2] }, { type: "pieredge", pos: [-4.5, 0, -10.4], rotY: -uj / 2, length: 1.8, ext0: -0.1, dfender: true }, { type: "pieredge", pos: [4.5, 0, -26], rotY: uj / 2, length: 5, ext0: -0.1, ext1: -0.1, dfender: true }, { type: "pieredge", pos: [4.5, 0, -8.6], rotY: uj / 2, length: 15.4, ext1: -0.1, dfender: true }, { type: "pieredge", pos: [-4.5, 0, -8.6], rotY: 0, length: 9, ext0: 0.1, ext1: 0.1, skip: [[2.5, 6.5]], dfender: true }, { type: "pieredge", pos: [-19.5, 0, -26.4], rotY: uj / 2, length: 4.6, ext0: -0.1, ext1: -0.1 }, { type: "pieredge", pos: [-19.5, 0, -12.4], rotY: uj / 2, length: 12.8, ext0: -0.1, ext1: -0.1, skip: [[5.4, 7.4]], cleats: [2.4, 10.4], fenders: [3.9, 9.2] }, { type: "pieredge", pos: [-19.5, 0, 0], rotY: uj / 2, length: 10.4, ext1: -0.1 }, { type: "pieredge", pos: [-19.5, 0, -25.2], rotY: 0, length: 7, s0: 0.75, ext1: 0.1, cleats: [2.6, 5.9], fenders: [1.6, 4.3] }, { type: "pieredge", pos: [-12.5, 0, -26.4], rotY: uj, length: 7, ext0: 0.1, s1: 0.75, cleats: [1.1, 4.4], fenders: [2.7, 5.4], ladders: [6.1] }, { type: "pieredge", pos: [-12.5, 0, -25.2], rotY: uj / 2, length: 1.2 }, { type: "pieredge", pos: [-19.5, 0, -10.4], rotY: 0, length: 15, s0: 0.75, s1: 0.75, cleats: [4.1, 10.9] }, { type: "pieredge", pos: [-4.5, 0, -12.4], rotY: uj, length: 15, s0: 0.75, s1: 0.75, cleats: [4.1, 10.9], fenders: [7.5] }, { type: "pieredge", pos: [10, 0, -31], rotY: -uj / 2, length: 5, ext0: -0.1, ext1: -0.1 }, { type: "pieredge", pos: [10, 0, -24], rotY: -uj / 2, length: 17, ext0: -0.1 }, { type: "pieredge", pos: [10, 0, -7], rotY: 0, length: 9.5, ext0: 0.1, s1: 0.75, cleats: [2.2] }, { type: "pieredge", pos: [19.5, 0, -7], rotY: -uj / 2, length: 7, ext0: -0.1, skip: [[1.9, 4.6]] }, { type: "pieredge", pos: [4.5, 0, -24], rotY: 0, length: 5.5, s0: 0.75, s1: 0.75 }, { type: "pieredge", pos: [10, 0, -26], rotY: uj, length: 5.5, s0: 0.75, s1: 0.75 }, { type: "pieredge", pos: [-24, 0, -51.95], rotY: -uj / 2, length: 51.95, outer: true, cleats: [10.5, 27.5, 43.5] }, { type: "pieredge", pos: [24, 0, 0], rotY: uj / 2, length: 51.95, outer: true, spacing: 4, cleats: [8.5, 24.5, 30] }, { type: "pieredge", pos: [24, 0, -51.95], rotY: uj, length: 48, outer: true, ext0: 0.1, ext1: 0.1, spacing: 6, wraps: false }, { type: "clubhouse", pos: [0, 0, -45.4], rotY: 0 }, { type: "planter", pos: [-6.4, 2.4, -44.72], rotY: 0, variant: 2, color: "tealdark" }, { type: "planter", pos: [6.4, 2.4, -44.72], rotY: 0, variant: 2, color: "tealdark" }, { type: "boathouse", pos: [18.5, 0, -43], rotY: 0 }, { type: "harbouroffice", pos: [-19.8, 0, -42.9], rotY: 0 }, { type: "cafeset", pos: [-15.35, 0, -43.55], rotY: 0.3, variant: 0 }, { type: "cafeset", pos: [-14, 0, -41.7], rotY: 0.9, variant: 1 }, { type: "aboard", pos: [-11.75, 0, -44.75], rotY: 0.25 }, { type: "planter", pos: [-10, 0, -44.95], rotY: 0, length: 1.2, width: 0.6, variant: 1, color: "tealdark" }, { type: "bench", pos: [-15.4, 0, -31.75], rotY: 0 }, { type: "bench", pos: [-8.9, 0, -31.75], rotY: 0 }, { type: "bench", pos: [7.6, 0, -31.75], rotY: 0 }, { type: "trashbin", pos: [-13.95, 0, -31.95] }, { type: "trashbin", pos: [9.05, 0, -32] }, { type: "bikerack", pos: [10.85, 0, -44.55], count: 2, bikes: 0 }, { type: "scooter", pos: [12.05, 0, -44.7], rotY: 0.12, variant: 0 }, { type: "kayakrack", pos: [23.25, 0, -43], rotY: uj / 2 }, { type: "surfrack", pos: [14.18, 0, -42.1], rotY: -uj / 2, variant: 1 }, { type: "mapboard", pos: [-23.35, 0, -34.2], rotY: uj / 2 }, { type: "shorepower", pos: [-19.88, 0, -22.3], rotY: uj / 2, berth: "H1" }, { type: "shorepower", pos: [-17.2, 0, -31.38], rotY: 0, berth: "Q4" }, { type: "bollardlight", pos: [-23.72, 0, -27] }, { type: "bollardlight", pos: [-23.72, 0, -13] }, { type: "bollardlight", pos: [23.72, 0, -27.5] }, { type: "bollardlight", pos: [23.72, 0, -15.5] }, { type: "bollardlight", pos: [-4.15, 0, -26] }, { type: "lifering", pos: [-23.6, 0, -21], rotY: uj / 2 }, { type: "bollard", pos: [-23.55, 0, -38], variant: 2 }, { type: "bollard", pos: [23.55, 0, -34], variant: 2 }, { type: "travellift", pos: [13.6, 0, -29], rotY: 0 }, { type: "tarpboat", pos: [23.2, 0, -11.4], rotY: uj / 2 }, { type: "scaffold", pos: [19.66, 0, -12.36], rotY: 0 }, { type: "workbench", pos: [10.45, 0, -29.45], rotY: uj / 2, washerSide: -1 }, { type: "barrel", pos: [21.1, 0, -23.25], rotY: uj / 2, variant: 1, color: "#3f6fb0", color2: "#c9453b" }, { type: "grandstair", pos: [0, 0, -32.4], rotY: uj, run: 6.1, rise: 2.4, width: 6 }, { type: "gangwayrails", pos: [0, 0, -8.8], rotY: 0, run: 3.85, rise: 1.3, width: 3.4, thick: 0.22, posts: 5 }, { type: "gangwayrails", pos: [-19.7, 0, -18.8], rotY: uj / 2, run: 2.35, rise: 0.7, width: 1.6, thick: 0.18, posts: 3, land1: 2.1 }, { type: "beacon", pos: [-22.6, 0, 0], rotY: 0 }, { type: "breakwater", pos: [42, 0, -62], rotY: 0, length: 72 }, { type: "channelmarker", pos: [37, -1.6, 21.5], variant: 0 }, { type: "channelmarker", pos: [31, -1.6, 17], variant: 1 }, { type: "fuelpump", pos: [3.5, 0, -13.8], rotY: 0, price: "1.89" }, { type: "fuelpump", pos: [-3.5, 0, -13.8], rotY: uj, price: "1.89" }, { type: "dockbox", pos: [-23.1, 0, -7.5], rotY: uj / 2 }, { type: "pumpout", pos: [-22.7, 0, -19], rotY: uj / 2 }, { type: "keelblocks", pos: [11.9, 0, -10.8], rotY: 0 }, { type: "quaycrates", pos: [-11.7, 0, -34.4], rotY: 0, variant: 0 }, { type: "quaycrates", pos: [11.5, 0, -35.6], rotY: 0, variant: 1 }, { type: "fuelhut", pos: [0, 0, -20.65], rotY: 0 }, { type: "cooler", pos: [-0.85, 0, -22.9], rotY: uj, variant: 1 }, { type: "cooler", pos: [-0.55, 0.94, -22.85], rotY: uj + 0.18, variant: 0, color: "teal" }, { type: "fueldocksign", pos: [-4.2, 0, -9.3], rotY: 0 }, { type: "lifering", pos: [-4.12, 0, -16.6], rotY: uj / 2 }] }, cU = { halyard: eS };
for (const [j, A] of Object.entries(AP)) A.PLACEMENTS && (cU[j] = A.PLACEMENTS);
function E7(j) {
  const A = [...g7[j] || [], ...cU[j] || []], M = [];
  for (const N of A) {
    if (M.push(N), N.mirror === false) continue;
    const [I, D, T] = N.pos;
    M.push({ ...N, pos: [-I, D, -T], rotY: (N.rotY || 0) + uj, team: N.team === void 0 ? void 0 : 1 - N.team });
  }
  return M;
}
const $i = 28, P7 = 30, wx = X1.map((j) => ({ ...j, stage: "tidewater", name: `tidewater:${j.name}`, group: 3 })), y7 = { plain: 0, grid: 1, hex: 2 }, { plain: ng, grid: oN, hex: Ly } = y7, x7 = `
in vec3 position;
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`, Q7 = `
precision highp float;
precision highp int;
uniform vec2 uRes;
uniform float uScale;
uniform int uMat;
uniform int uOne;   // = 1: non-constant trip counts, so drivers keep loops rolled (short cold compile)
uniform vec2 uHRange;  // height range (m) mapped to orm.a 0..1
uniform float uAO;     // depth-occlusion strength
layout(location = 0) out vec4 oAlb;   // -> albedo (sRGB attachment, hardware-encoded)
layout(location = 1) out vec4 oNrm;
layout(location = 2) out vec4 oOrm;
#define PI 3.14159265
#define TAU 6.28318531
struct S { vec3 alb; float a; float h; float cav; float rough; float metal; };
struct Req { vec2 x; ivec2 per; int oct; float gain; uint seed; };   // fbm request
struct WReq { vec2 uv; ivec2 n; float jit; uint seed; };            // worley request
float PX; // metres per sub-sample step (half a texel): the AA width unit

uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
uint hu(ivec2 p, uint s) { return pcg((uint(p.x) * 0x8da6b343u) ^ (uint(p.y) * 0xd8163841u) ^ (s * 0xcb1ab31fu)); }
float hf(ivec2 p, uint s) { return float(hu(p, s) >> 8u) * (1.0 / 16777216.0); }
vec2 hf2(ivec2 p, uint s) { uint a = hu(p, s); return vec2(float(a >> 8u), float(pcg(a) >> 8u)) * (1.0 / 16777216.0); }
// float wrap: integer % by a non-constant divisor is emulated in software and bloats driver compile time
ivec2 wrp(ivec2 i, ivec2 n) { vec2 fi = vec2(i), fn = vec2(n); return ivec2(fi - fn * floor((fi + 0.5) / fn)); }
vec3 lin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec2 gr(uint h) { return vec2(float(h & 0xffffu), float(h >> 16u)) * (1.0 / 32767.5) - 1.0; }

// periodic gradient noise ~[-1,1]; x in lattice units, n = period in lattice cells
float gn(vec2 x, ivec2 n, uint s) {
  ivec2 i = ivec2(floor(x)); vec2 f = x - vec2(i);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float v0 = dot(gr(hu(wrp(i, n), s)), f);
  float v1 = dot(gr(hu(wrp(i + ivec2(1, 0), n), s)), f - vec2(1.0, 0.0));
  float v2 = dot(gr(hu(wrp(i + ivec2(0, 1), n), s)), f - vec2(0.0, 1.0));
  float v3 = dot(gr(hu(wrp(i + ivec2(1, 1), n), s)), f - vec2(1.0, 1.0));
  return 1.6 * mix(mix(v0, v1, u.x), mix(v2, v3, u.x), u.y);
}
float fbmR(Req r) {
  float sum = 0.0, amp = 1.0, nrm = 0.0; vec2 x = r.x; ivec2 per = r.per;
  for (int o = 0; o < r.oct * uOne; o++) { sum += amp * gn(x, per, r.seed + uint(o) * 1013u); nrm += amp; amp *= r.gain; x *= 2.0; per *= 2; }
  return nrm > 0.0 ? sum / nrm : 0.0;
}
// periodic worley on the tile: n cells per repeat; returns (F1, F2, id of nearest, id of 2nd) in cell units
vec4 worR(WReq q) {
  if (q.n.x == 0) return vec4(0.0);
  vec2 x = q.uv * vec2(q.n); ivec2 i = ivec2(floor(x)); vec2 f = x - vec2(i);
  float F1 = 9.0, F2 = 9.0, id = 0.0, id2 = 0.0;
  for (int y = -uOne; y <= uOne; y++) for (int xx = -uOne; xx <= uOne; xx++) {
    ivec2 c = ivec2(xx, y); ivec2 w = wrp(i + c, q.n);
    vec2 o = vec2(c) + 0.5 + (hf2(w, q.seed) - 0.5) * q.jit;
    float d = length(o - f);
    if (d < F1) { F2 = F1; F1 = d; id2 = id; id = hf(w, q.seed + 7u); } else if (d < F2) { F2 = d; }
  }
  return vec4(F1, F2, id, id2);
}
// request builders: FB = periodic fbm over the repeat (f0 cells), FNP = aperiodic fbm on explicit coords
Req FB(vec2 uv, ivec2 f0, int oct, float gain, uint s) { return Req(uv * vec2(f0), f0, oct, gain, s); }
Req FNP(vec2 x, int oct, uint s) { return Req(x, ivec2(4096), oct, 0.5, s); }
WReq WO(vec2 uv, ivec2 n, float jit, uint s) { return WReq(uv, n, jit, s); }

float aa(float edge, float x) { return smoothstep(edge - PX * 0.75, edge + PX * 0.75, x); }
float jd(float x, float p) { return abs(x - p * floor(x / p + 0.5)); }
float sdRB(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
// joint + rounded arris profile. e = distance from the joint centre line (m), jw = half joint width,
// r = rounding width, de = drop at the arris, dj = joint depth. returns (height, jointMask)
vec2 edgeProf(float e, float jw, float r, float de, float dj) {
  float t = clamp(1.0 - (e - jw) / r, 0.0, 1.0);
  float hE = -de * (1.0 - sqrt(max(1.0 - t * t, 0.0)));
  float inJ = 1.0 - aa(jw, e);
  return vec2(mix(hE, -dj, inJ), inJ);
}
`, i7 = `
// Surface evaluation at 2x2 sub-samples per texel (rotated into one rolled loop, so the whole material pipeline
// exists once in the binary): box-filtered albedo/ORM, normal from the sub-sample height gradient.
void main() {
  PX = uScale / (2.0 * uRes.x);   // AA width unit: half a texel
  vec3 alb = vec3(0.0); float alpha = 0.0, cav = 0.0, rough = 0.0, metal = 0.0; float hs[4];
  for (int k = 0; k < 4 * uOne; k++) {
    vec2 uv = (gl_FragCoord.xy + (vec2(k & 1, k >> 1) - 0.5) * 0.5) / uRes;
    vec2 P = uv * uScale;
    Req f[4]; WReq w[2];
    for (int q = 0; q < 4; q++) f[q] = Req(vec2(0.0), ivec2(1), 0, 0.5, 0u);
    w[0] = WReq(vec2(0.0), ivec2(0), 0.0, 0u); w[1] = w[0];
    PREP_SWITCH
    float n[4]; vec4 c[2];
    for (int q = 0; q < 4 * uOne; q++) n[q] = fbmR(f[q]);
    for (int q = 0; q < 2 * uOne; q++) c[q] = worR(w[q]);
    S s; s.alb = vec3(0.8); s.a = 1.0; s.h = 0.0; s.cav = 1.0; s.rough = 0.8; s.metal = 0.0;
    SURF_SWITCH
    alb += max(s.alb, vec3(0.0)); alpha += clamp(s.a, 0.0, 1.0);
    cav += clamp(s.cav, 0.0, 1.0) * (1.0 - uAO * clamp(-s.h / -uHRange.x, 0.0, 1.0));
    rough += clamp(s.rough, 0.02, 1.0); metal += clamp(s.metal, 0.0, 1.0);
    hs[k] = s.h;
  }
  float dx = (hs[1] - hs[0] + hs[3] - hs[2]) / (2.0 * PX);
  float dy = (hs[2] - hs[0] + hs[3] - hs[1]) / (2.0 * PX);
  float h = (hs[0] + hs[1] + hs[2] + hs[3]) * 0.25;
  oAlb = vec4(alb * 0.25, alpha * 0.25);
  oNrm = vec4(normalize(vec3(-dx, -dy, 1.0)) * 0.5 + 0.5, 1.0);
  oOrm = vec4(cav * 0.25, rough * 0.25, metal * 0.25, clamp((h - uHRange.x) / (uHRange.y - uHRange.x), 0.0, 1.0));
}
`, L7 = "vec2 uv, vec2 P, inout Req f[4], inout WReq w[2]", k7 = "vec2 uv, vec2 P, float n[4], vec4 c[2], inout S s", $T = [{ name: "concrete", detail: 1, scale: 4, tint: true, alpha: false, mode: oN, sym: 7, hr: [-4e-3, 8e-4], ao: 0.5, prep: `f[0] = FB(uv, ivec2(3), 5, 0.55, 11u); f[1] = FB(uv, ivec2(8), 3, 0.5, 19u); f[2] = FB(uv, ivec2(24), 3, 0.5, 23u);
  w[0] = WO(uv, ivec2(64), 0.8, 37u);`, surf: `
  // 2 x 2 m cast panels: hairline seams, per-pour tone, one form-tie hole per panel, sparse bug-hole pores
  ivec2 pan = wrp(ivec2(floor(P / 2.0)), ivec2(2));
  float dSeam = min(jd(P.x, 2.0), jd(P.y, 2.0));
  float seam = 1.0 - aa(0.003, dSeam);
  float seamSoft = 1.0 - smoothstep(0.0, 0.045, dSeam);
  float mott = n[0], cloud = n[1], fine = n[2];
  float tone = 1.0 + 0.07 * (hf(pan, 5u) - 0.5);
  vec3 col = vec3(0.805) * tone * (1.0 + 0.09 * mott + 0.05 * cloud + 0.025 * fine);
  float rh = length(mod(P, 2.0) - 1.0);
  float hole = 1.0 - aa(0.011, rh);
  float ring = (1.0 - aa(0.02, rh)) * (1.0 - hole);
  vec4 wc = c[0];
  float pr = wc.x * (4.0 / 64.0);
  float pore = step(0.975, wc.z) * (1.0 - smoothstep(0.003 + 0.004 * fract(wc.z * 13.7), 0.0045 + 0.004 * fract(wc.z * 13.7) + PX, pr));
  col *= (1.0 - 0.07 * pore) * (1.0 - 0.10 * hole) * (1.0 - 0.12 * seam) * (1.0 - 0.035 * seamSoft) * (1.0 + 0.02 * ring);
  s.alb = col;
  s.h = 0.00035 * mott + 0.0001 * fine - 0.0015 * pore - 0.0032 * hole - 0.0008 * seam + 0.0001 * ring;
  s.rough = 0.78 + 0.07 * mott - 0.04 * cloud + 0.04 * (hf(pan, 9u) - 0.5);
  s.cav = 1.0 - 0.3 * hole - 0.2 * pore - 0.25 * seam;` }, { name: "pavers", detail: 0.9, scale: 4, tint: true, alpha: false, mode: oN, sym: 7, hr: [-8e-3, 1e-3], ao: 0.55, prep: "f[0] = FB(uv, ivec2(6), 4, 0.5, 17u); f[1] = FB(uv, ivec2(3), 3, 0.5, 29u); w[0] = WO(uv, ivec2(240), 1.0, 31u);", surf: `
  // 2 x 2 m plaza slabs, 15 mm joints, rounded arrises, per-slab tone + micro tilt, fine aggregate speckle
  ivec2 cell = ivec2(floor(P / 2.0));
  ivec2 cw = wrp(cell, ivec2(2));
  vec2 lp = P - (vec2(cell) * 2.0 + 1.0);
  float e = -sdRB(lp, vec2(1.0), 0.016);
  vec2 pr = edgeProf(e, 0.0075, 0.016, 0.0045, 0.0075);
  float inJ = pr.y;
  float hid = hf(cw, 3u), hid2 = hf(cw, 11u);
  vec2 tilt = hf2(cw, 9u) - 0.5;
  float mott = n[0], cloud = n[1];
  float grain = smoothstep(0.05, 0.2, c[0].y - c[0].x) * (c[0].z - 0.5);
  vec3 col = vec3(0.84) * (1.0 + 0.2 * (hid - 0.5)) * (1.0 + 0.07 * mott + 0.05 * cloud + 0.1 * grain);
  float arris = clamp(1.0 - (e - 0.0075) / 0.016, 0.0, 1.0) * (1.0 - inJ);
  float grime = (1.0 - smoothstep(0.0, 0.06, e - 0.0075)) * (1.0 - inJ);   // soft dirt band hugging the joints
  col *= (1.0 - 0.06 * arris) * (1.0 - 0.09 * grime * (0.7 + 0.3 * cloud));
  col = mix(col, vec3(0.42) * (1.0 + 0.1 * mott), inJ);
  s.alb = col;
  s.h = pr.x + dot(tilt, lp) * 0.0012 * (1.0 - inJ) + 0.00015 * mott + 0.00005 * grain;
  s.rough = mix(0.7 + 0.12 * hid2 + 0.06 * mott + 0.05 * grime, 0.95, inJ);
  s.cav = mix(1.0, 0.5, inJ) * (1.0 - 0.1 * grime);` }, { name: "tiles", detail: 0.15, scale: 2, tint: true, alpha: false, mode: oN, sym: 7, hr: [-3e-3, 6e-4], ao: 0.5, prep: `ivec2 cw = wrp(ivec2(floor(P / 0.5)), ivec2(4));
  f[0] = FB(uv, ivec2(12), 1, 0.5, 41u + uint(cw.x * 4 + cw.y) * 131u); f[1] = FB(uv, ivec2(8), 3, 0.5, 13u); f[2] = FB(uv, ivec2(96), 2, 0.5, 7u);`, surf: `
  // 0.5 m glazed ceramic tiles, 9 mm grout, cushion edges, per-tile tone / gloss / glaze wave
  ivec2 cell = ivec2(floor(P / 0.5));
  ivec2 cw = wrp(cell, ivec2(4));
  vec2 lp = P - (vec2(cell) * 0.5 + 0.25);
  float e = -sdRB(lp, vec2(0.25), 0.007);
  vec2 pr = edgeProf(e, 0.0045, 0.006, 0.0014, 0.0026);
  float inG = pr.y;
  float hid = hf(cw, 3u), hid2 = hf(cw, 5u);
  float wave = n[0], mott = n[1];
  float edgeTone = 1.0 - smoothstep(0.0, 0.035, e - 0.0045);
  vec3 col = vec3(0.84) * (1.0 + 0.07 * (hid - 0.5) + 0.015 * mott) * (1.0 - 0.05 * edgeTone);
  vec3 grout = vec3(0.6) * (1.0 + 0.06 * n[2]);
  s.alb = mix(col, grout, inG);
  s.h = pr.x + (0.00022 * wave + 0.00004 * mott) * (1.0 - inG);
  s.rough = mix(0.18 + 0.08 * hid2 + 0.03 * mott, 0.9, inG);
  s.cav = mix(1.0, 0.6, inG);` }, { name: "asphalt", detail: 0.4, scale: 2, tint: true, alpha: false, mode: Ly, sym: 7, hr: [-14e-4, 8e-4], ao: 0.45, prep: `f[0] = FB(uv, ivec2(4), 4, 0.5, 13u); f[1] = FB(uv, ivec2(64), 2, 0.5, 7u);
  w[0] = WO(uv, ivec2(150), 1.0, 41u); w[1] = WO(uv, ivec2(360), 1.0, 53u);`, surf: `
  // fine aggregate in binder, sparse light stones, very low contrast
  vec4 wc = c[0], w2 = c[1];
  float stone = smoothstep(0.06, 0.24, wc.y - wc.x);
  float light = step(0.9, wc.z);
  float st = mix(0.76 + 0.16 * fract(wc.z * 7.13), 1.05, light);
  float big = n[0];
  float binder = 0.63 + 0.05 * n[1];
  float grit = smoothstep(0.05, 0.25, w2.y - w2.x) * (fract(w2.z * 5.31) - 0.5);
  float worn = smoothstep(-0.2, 0.5, big);                 // traffic-polished patches: lighter, a bit smoother
  s.alb = vec3(mix(binder, st, stone)) * (1.0 + 0.06 * big + 0.06 * grit) * (1.0 + 0.04 * worn);
  s.h = -0.0011 * (1.0 - stone) + 0.0005 * stone * (1.0 - wc.x * wc.x) + 0.00012 * grit + 0.0001 * big;
  s.rough = mix(0.94, 0.8, stone * (1.0 - light * 0.5)) - 0.1 * worn;` }, { name: "boardwalk", detail: 0.3, scale: 2, tint: false, alpha: false, mode: oN, sym: 1, hr: [-0.015, 12e-4], ao: 0.4, prep: `int row = int(floor(P.y / 0.25)); int rw = (row + 8) % 8;
  int kk[8] = int[8](0, 2, 1, 3, 2, 0, 3, 1);
  float xp = mod(P.x - 0.25 - 0.5 * float(kk[rw]), 2.0), ly = P.y - float(row) * 0.25;
  float rh = hf(ivec2(rw, 0), 3u), rh2 = hf(ivec2(rw, 1), 3u);
  uint sd = uint(rw) * 7919u + 101u;
  f[0] = FNP(vec2(xp * 1.3, ly * 17.0) + rh * 40.0, 4, sd); f[1] = FNP(vec2(xp * 0.5, ly * 4.0) + rh2 * 30.0, 3, sd + 17u);`, surf: `
  // 0.25 m boardwalk planks along u, 8 mm gaps, butt joints on joists (every 0.5 m), grain, nail heads
  const float PW = 0.25;
  int row = int(floor(P.y / PW));
  int rw = (row + 8) % 8;
  float ly = P.y - float(row) * PW;
  int kk[8] = int[8](0, 2, 1, 3, 2, 0, 3, 1);
  float jx = 0.25 + 0.5 * float(kk[rw]);
  float xp = mod(P.x - jx, 2.0);
  float eSide = min(ly, PW - ly);
  float eEnd = min(xp, 2.0 - xp);
  vec2 ps = edgeProf(eSide, 0.004, 0.006, 0.0022, 0.015);
  vec2 pe = edgeProf(eEnd, 0.0015, 0.004, 0.0014, 0.012);
  float gap = max(ps.y, pe.y);
  float h = min(ps.x, pe.x);
  float rh = hf(ivec2(rw, 0), 3u), rh2 = hf(ivec2(rw, 1), 3u), rh3 = hf(ivec2(rw, 2), 3u);
  float streak = n[0], warp = n[1];
  float ring = 0.5 + 0.5 * cos((ly * 64.0 + warp * 3.5 + rh2 * 9.0) * PI);
  float lines = smoothstep(0.72, 1.0, ring);
  vec3 wa = lin(vec3(0.79, 0.64, 0.47)), wb = lin(vec3(0.74, 0.57, 0.42)), wc = lin(vec3(0.82, 0.69, 0.51));
  vec3 base = mix(wa, rh3 > 0.5 ? wb : wc, abs(rh3 - 0.5) * 1.4) * (0.94 + 0.12 * rh);
  vec3 col = base * (1.0 + 0.07 * streak) * (1.0 - 0.07 * lines);
  col *= 1.0 - 0.1 * (1.0 - smoothstep(0.0, 0.035, eEnd - 0.0015));
  col *= 1.0 - 0.05 * (1.0 - smoothstep(0.0, 0.02, eSide - 0.004));
  float nx = eEnd < 0.1 ? abs(eEnd - 0.03) : jd(P.x - 0.25, 0.5);
  float ny = min(abs(ly - 0.045), abs(ly - (PW - 0.045)));
  float nd = length(vec2(nx, ny));
  float nail = 1.0 - aa(0.0042, nd);
  col *= 1.0 - 0.1 * (1.0 - smoothstep(0.004, 0.018, nd));
  col = mix(col, lin(vec3(0.46, 0.45, 0.44)) * (0.85 + 0.3 * smoothstep(0.0042, 0.0, nd)), nail);
  col = mix(col, lin(vec3(0.20, 0.15, 0.11)), gap);
  h += (0.0007 * (1.0 - pow((ly - PW * 0.5) / (PW * 0.5), 2.0)) + 0.00011 * streak - 0.00006 * lines) * (1.0 - gap);
  s.alb = col;
  s.h = h - nail * 0.0003;
  s.rough = mix(mix(0.64 + 0.05 * streak + 0.05 * lines, 0.42, nail), 0.92, gap);
  s.metal = nail * 0.75;
  s.cav = mix(1.0, 0.4, gap);` }, { name: "metalpanel", detail: 0.2, scale: 2, tint: true, alpha: false, mode: oN, sym: 3, hr: [-6e-3, 3e-3], ao: 0.45, prep: "f[0] = FB(uv, ivec2(20, 2), 4, 0.55, 3u); f[1] = FB(uv, ivec2(4), 4, 0.5, 5u); f[2] = FB(uv, ivec2(40), 4, 0.55, 7u);", surf: `
  // painted steel wall panels 1 x 2 m: V-seams, folded edges, two pressed ribs, rivet rows, light edge wear
  ivec2 cell = ivec2(floor(P / vec2(1.0, 2.0)));
  vec2 lp = P - (vec2(cell) * vec2(1.0, 2.0) + vec2(0.5, 1.0));
  float e = -sdRB(lp, vec2(0.5, 1.0), 0.015);
  vec2 pr = edgeProf(e, 0.0035, 0.01, 0.0032, 0.006);
  float inS = pr.y;
  float rib = exp(-pow((abs(lp.y) - 0.333) / 0.022, 2.0)) * smoothstep(0.03, 0.09, e);
  float ry = -0.9 + 0.2 * clamp(floor((lp.y + 1.0) / 0.2), 0.0, 9.0);
  float d1 = length(vec2(abs(lp.x) - 0.465, lp.y - ry));
  float rx = -0.4 + 0.2 * clamp(floor((lp.x + 0.5) / 0.2), 0.0, 4.0);
  float d2 = length(vec2(lp.x - rx, abs(lp.y) - 0.965));
  float rd = min(d1, d2);
  float rv = 1.0 - aa(0.0065, rd);
  float dome = sqrt(max(1.0 - pow(rd / 0.0065, 2.0), 0.0));
  float streak = n[0], mott = n[1], wn = n[2] * 0.5 + 0.5;
  float edgeP = 1.0 - smoothstep(0.004, 0.03, e);
  float wear = smoothstep(0.7, 0.78, wn + 0.3 * edgeP * (1.0 - inS)) * (1.0 - inS);
  wear = max(wear, rv * smoothstep(0.55, 0.9, dome) * smoothstep(0.35, 0.6, wn));
  vec3 col = vec3(0.81) * (1.0 + 0.035 * streak + 0.025 * mott) * (1.0 - 0.08 * edgeP);
  col = mix(col, vec3(0.93), wear * 0.7);
  s.alb = mix(col, vec3(0.36), inS);
  s.h = pr.x + 0.0022 * rib + rv * 0.0025 * dome + 0.00008 * mott - wear * 0.00005;
  s.rough = mix(mix(0.36 + 0.04 * streak, 0.42, wear), 0.7, inS);
  s.metal = mix(mix(0.3, 0.45, wear), 0.2, inS);
  s.cav = mix(1.0, 0.55, inS) * (1.0 - 0.25 * rv * (1.0 - dome));` }, { name: "corrugated", detail: 0.2, scale: 2.4, tint: true, alpha: false, mode: ng, sym: 0, hr: [-0.03, 1e-3], ao: 0.3, prep: `f[0] = FB(uv, ivec2(3, 4), 3, 0.5, 5u); f[1] = FB(uv, ivec2(16, 2), 4, 0.55, 9u); f[2] = FB(uv, ivec2(5), 4, 0.5, 11u);
  f[3] = FB(uv, ivec2(8, 40), 4, 0.55, 13u);`, surf: `
  // container corrugation: vertical ribs (along v), 0.3 m period, trapezoid 30 mm deep, crest-edge paint wear
  float x = mod(P.x + 0.15, 0.3) - 0.15;
  float a = abs(x);
  float t = clamp((a - 0.042) / 0.066, 0.0, 1.0);
  float prof = mix(t, t * t * (3.0 - 2.0 * t), 0.65);
  float dent = n[0], streak = n[1], mott = n[2], wn = n[3] * 0.5 + 0.5;
  float crestEdge = exp(-pow((a - 0.045) / 0.007, 2.0));
  float troughEdge = exp(-pow((a - 0.105) / 0.009, 2.0));
  float wear = crestEdge * smoothstep(0.52, 0.62, wn);
  vec3 col = vec3(0.81) * (1.0 + 0.03 * streak + 0.025 * mott) * (1.0 - 0.07 * smoothstep(0.1, 0.15, a));
  s.alb = mix(col, vec3(0.95), wear * 0.55);
  s.h = -0.03 * prof + 0.0006 * dent - wear * 0.00005;
  s.rough = mix(0.5 + 0.05 * streak, 0.45, wear);
  s.metal = mix(0.25, 0.4, wear);
  s.cav = 1.0 - 0.18 * troughEdge;` }, { name: "hazard", detail: 0.5, scale: 2, tint: false, alpha: false, mode: ng, sym: 0, hr: [-4e-4, 4e-4], ao: 0.3, prep: "f[0] = FB(uv, ivec2(5), 5, 0.55, 5u); f[1] = FB(uv, ivec2(40), 3, 0.5, 9u); f[2] = FB(uv, ivec2(4, 80), 3, 0.5, 15u);", surf: `
  // 45° yellow / black safety stripes (~12 cm each), paint worn through to concrete in soft patches
  const float PER = 1.0 / 3.0;
  float q = fract((P.x + P.y) / PER);
  float dY = q < 0.5 ? min(q, 0.5 - q) : -min(q - 0.5, 1.0 - q);
  float dm = dY * PER * 0.70710678;
  float yel = smoothstep(-PX * 0.75, PX * 0.75, dm);
  vec3 Y = lin(vec3(0.96, 0.77, 0.16)), K = lin(vec3(0.14, 0.14, 0.15));
  float n1 = n[0] * 0.5 + 0.5, n2 = n[1] * 0.5 + 0.5, scuff = n[2] * 0.5 + 0.5;
  float edgeW = 1.0 - smoothstep(0.0, 0.012, abs(dm));
  float thin = smoothstep(0.5, 0.75, n1 + 0.15 * (n2 - 0.5));                    // paint worn thin, broad and soft
  float wear = smoothstep(0.72, 0.8, n1 + 0.35 * (n2 - 0.5) + 0.05 * edgeW);  // worn through, rare
  vec3 paint = mix(K, Y, yel) * (1.0 - 0.05 * (n1 - 0.5)) * (1.0 - 0.06 * smoothstep(0.55, 0.8, scuff));
  vec3 under = lin(vec3(0.63, 0.62, 0.6)) * (1.0 + 0.06 * (n2 - 0.5));
  paint = mix(paint, mix(paint, under, 0.3), thin * (0.2 + 0.25 * yel));
  s.alb = mix(paint, under, wear * 0.85);
  s.h = 0.0003 * (1.0 - wear) + 0.00005 * n2;
  s.rough = mix(0.52 + 0.08 * scuff, 0.86, wear);` }, { name: "grate", detail: 0.3, scale: 1.2, tint: false, alpha: true, mode: oN, sym: 3, hr: [-9e-3, 6e-4], ao: 0.35, prep: "f[0] = FB(uv, ivec2(6), 4, 0.5, 3u); f[1] = FB(uv, ivec2(12), 3, 0.5, 9u); w[0] = WO(uv, ivec2(30), 1.0, 21u);", surf: `
  // galvanised bar grating: bearing bars along u (20 mm, serrated), cross bars along v (14 mm, 3 mm lower),
  // 75 mm pitch -> ~5.5-6 cm openings (alpha 0)
  float db = jd(P.y, 0.075);
  float dc = jd(P.x, 0.075);
  float bb = 1.0 - aa(0.01, db);
  float cb = 1.0 - aa(0.007, dc);
  float hb = -0.0026 * pow(clamp(db / 0.01, 0.0, 1.0), 2.0) - 0.0005 * (0.5 + 0.5 * cos(TAU * P.x / 0.0125)) * smoothstep(0.0075, 0.0, db);
  float hc = -0.003 - 0.002 * pow(clamp(dc / 0.007, 0.0, 1.0), 2.0);
  float h = max(mix(-0.009, hb, bb), mix(-0.009, hc, cb));
  float spang = (c[0].z - 0.5) * smoothstep(0.0, 0.08, c[0].y - c[0].x);
  float mott = n[0];
  vec3 steel = vec3(0.53, 0.55, 0.57) * (1.0 + 0.07 * spang + 0.04 * mott);
  float top = bb * (1.0 - smoothstep(0.0, 0.01, db));
  float polish = top * smoothstep(0.45, 0.7, n[1] * 0.5 + 0.75);
  steel = mix(steel, vec3(0.64, 0.65, 0.66), polish * 0.7);
  float junction = cb * (1.0 - bb) * (1.0 - smoothstep(0.01, 0.02, db));
  s.alb = steel * (1.0 - 0.18 * junction);
  s.a = max(bb, cb);
  s.h = h;
  s.rough = mix(0.46 + 0.05 * mott, 0.3, polish);
  s.metal = 0.85;
  s.cav = 1.0 - 0.35 * junction;` }, { name: "brick", detail: 0.7, scale: 2, tint: true, alpha: false, mode: oN, sym: 1, hr: [-7e-3, 8e-4], ao: 0.5, prep: `f[0] = FB(uv, ivec2(80), 3, 0.5, 11u); f[1] = FB(uv, ivec2(6), 4, 0.5, 13u); f[2] = FB(uv, ivec2(128), 2, 0.5, 19u);
  w[0] = WO(uv, ivec2(120), 1.0, 17u);`, surf: `
  // stylised running-bond brick 250 x 100 mm (incl. 10 mm mortar), recessed joints, soft arrises
  int row = int(floor(P.y / 0.1));
  float ly = P.y - float(row) * 0.1;
  float bx = P.x - ((row % 2 == 1) ? 0.125 : 0.0);
  int col = int(floor(bx / 0.25));
  float lx = bx - float(col) * 0.25;
  ivec2 bid = wrp(ivec2(col, row), ivec2(8, 20));
  vec2 lp = vec2(lx - 0.125, ly - 0.05);
  float e = -sdRB(lp, vec2(0.125, 0.05), 0.007);
  vec2 pr = edgeProf(e, 0.005, 0.007, 0.0035, 0.0065);
  float inM = pr.y;
  float hid = hf(bid, 3u), hid2 = hf(bid, 5u);
  float sand = n[0], mott = n[1];
  float pit = step(0.9, c[0].z) * (1.0 - aa(0.0022, c[0].x * (2.0 / 120.0)));
  float bulge = (1.0 - pow(lp.x / 0.125, 2.0)) * (1.0 - pow(lp.y / 0.05, 2.0));
  vec3 cb = vec3(0.79) * (1.0 + 0.1 * (hid - 0.5)) * (1.0 + 0.025 * sand + 0.02 * mott) * (1.0 - 0.1 * pit);
  cb *= 1.0 - 0.04 * clamp(1.0 - (e - 0.005) / 0.01, 0.0, 1.0) * (1.0 - inM);
  vec3 mort = vec3(0.9) * (1.0 + 0.05 * n[2]);
  s.alb = mix(cb, mort, inM);
  s.h = pr.x + (0.0005 * bulge * hid2 + 0.00012 * sand - 0.0008 * pit) * (1.0 - inM) + inM * 0.0008 * (pow(clamp(e / 0.005, 0.0, 1.0), 2.0) - 1.0);
  s.rough = mix(0.82 + 0.05 * sand, 0.95, inM);
  s.cav = mix(1.0, 0.72, inM);` }, { name: "rubber", detail: 0.35, scale: 2, tint: true, alpha: false, mode: Ly, sym: 7, hr: [-7e-4, 7e-4], ao: 0.35, prep: "f[0] = FB(uv, ivec2(5), 4, 0.5, 71u); w[0] = WO(uv, ivec2(240), 1.0, 61u);", surf: `
  // poured EPDM rubber: ~8 mm bonded granules, sparse light flecks, soft large-scale blotches
  vec4 wc = c[0];
  float gr = smoothstep(0.04, 0.18, wc.y - wc.x);
  float tone = mix(0.78 + 0.08 * fract(wc.z * 3.71), 0.97, step(0.95, wc.z));
  float big = n[0];
  s.alb = vec3(mix(0.7, tone, gr)) * (1.0 + 0.03 * big);
  s.h = 0.00055 * gr * (1.0 - 0.8 * wc.x * wc.x) - 0.0004 * (1.0 - gr) + 0.00008 * big;
  s.rough = 0.9 - 0.04 * gr;` }, { name: "glasstile", detail: 0, scale: 1.2, tint: true, alpha: false, mode: oN, sym: 7, hr: [-4e-3, 18e-4], ao: 0.45, prep: "f[0] = FB(uv, ivec2(96), 2, 0.5, 7u);", surf: `
  // 100 mm glossy glass-mosaic tiles: pillowed edges, slight dome + per-tile tilt, 4 mm grout
  ivec2 cell = ivec2(floor(P / 0.1));
  ivec2 cw = wrp(cell, ivec2(12));
  vec2 lp = P - (vec2(cell) * 0.1 + 0.05);
  float e = -sdRB(lp, vec2(0.05), 0.01);
  vec2 pr = edgeProf(e, 0.002, 0.008, 0.002, 0.0036);
  float inG = pr.y;
  float hid = hf(cw, 3u), hid2 = hf(cw, 5u);
  vec2 tilt = hf2(cw, 9u) - 0.5;
  float dome = 1.0 - dot(lp, lp) / 0.005;
  float inner = exp(-pow((e - 0.016) / 0.004, 2.0));
  vec3 col = vec3(0.8) * (1.0 + 0.09 * (hid - 0.5)) * (1.0 + 0.04 * inner);
  vec3 grout = vec3(0.7) * (1.0 + 0.05 * n[0]);
  s.alb = mix(col, grout, inG);
  s.h = pr.x + (0.0007 * dome + dot(tilt, lp) * 0.012 + 0.0001 * inner) * (1.0 - inG);
  s.rough = mix(0.1 + 0.08 * hid2, 0.85, inG);
  s.cav = mix(1.0, 0.65, inG);` }, { group: 1, name: "planks", detail: 0.35, scale: 2.24, tint: false, alpha: false, mode: oN, sym: 1, hr: [-0.022, 16e-4], ao: 0.4, prep: `int row = int(floor(P.y / 0.14)); float ly = P.y - float(row) * 0.14;
  int js[16] = int[16](0, 2, 3, 1, 2, 0, 1, 3, 0, 2, 1, 3, 0, 1, 3, 2);
  float rn = hf(ivec2(row, 0), 17u); float j1 = 0.28 + 0.56 * float(js[row]);
  int seg = rn >= 0.8 && mod(P.x - j1, 2.24) >= 1.12 ? 1 : 0;
  float bo = float(row) * 6.37 + float(seg) * 17.3;
  f[0] = Req(vec2(uv.x * 10.0, ly * 40.0 + bo), ivec2(10, 4096), 3, 0.55, 211u);
  f[1] = FB(uv, ivec2(5), 4, 0.5, 223u);
  f[2] = Req(vec2(uv.x * 4.0, bo * 0.37), ivec2(4, 4096), 3, 0.5, 227u);
  f[3] = FB(uv, ivec2(48), 2, 0.5, 229u);
  w[0] = WO(uv, ivec2(4, 16), 1.0, 233u);`, surf: `
  // hardwood dock decking: 140 mm boards along u, 9 mm gaps, joists every 0.56 m (seen through the gaps), butt joints
  // staggered over joists, two stainless screws per board per joist, per-board tone / crown or cup / twist, streaky
  // grain with cathedral figure, raised latewood, end grain darker, checks, a few knots and water stains; arrises and
  // board ends weathered to silver. Own colours: the block colour is not used.
  const float PW = 0.14, GAP = 0.0045, JS = 0.56;
  int row = int(floor(P.y / PW));
  float ly = P.y - float(row) * PW;
  int js[16] = int[16](0, 2, 3, 1, 2, 0, 1, 3, 0, 2, 1, 3, 0, 1, 3, 2);
  float rn = hf(ivec2(row, 0), 17u);
  int nj = rn < 0.14 ? 0 : (rn < 0.8 ? 1 : 2);
  float j1 = 0.28 + JS * float(js[row]);
  int seg = nj == 2 && mod(P.x - j1, 2.24) >= 1.12 ? 1 : 0;
  ivec2 bid = ivec2(row, seg);
  float b1 = hf(bid, 3u), b2 = hf(bid, 5u), b3 = hf(bid, 7u), b4 = hf(bid, 11u), b5 = hf(bid, 13u);
  float eE = nj == 0 ? 1.0 : jd(P.x - j1, nj == 2 ? 1.12 : 2.24);
  float eS = min(ly, PW - ly);
  vec2 ps = edgeProf(eS, GAP, 0.0045, 0.0018, 0.022);
  vec2 pe = edgeProf(eE, 0.0014, 0.003, 0.0012, 0.016);
  float gap = max(ps.y, pe.y);
  float q = clamp((ly - PW * 0.5) / (PW * 0.5 - GAP), -1.0, 1.0);
  float crown = mix(-0.0005, 0.0009, b2) * (1.0 - q * q) + (b3 - 0.5) * 0.0007 * q;
  float streak = n[0], patchN = n[1] * 0.5 + 0.5, warp = n[2], fib = n[3];
  // knot on a quarter of the boards: dark oval, the figure bends around it
  float kxc = (nj == 2 ? j1 + 1.12 * float(seg) + 0.56 : j1 + 1.12) + (b5 * 4.0 - 0.5) * 0.7;
  vec2 kd = vec2(jd(P.x - kxc, 2.24) / 0.024, (ly - PW * (0.3 + 0.4 * b1)) / 0.012);
  float kr = b5 < 0.25 ? length(kd) : 99.0;
  float knot = 1.0 - smoothstep(0.75, 1.0 + PX / 0.012, kr);
  float flatSawn = step(0.4, b4);
  float rc = q * (1.6 + 1.4 * b1) + (0.9 + 1.4 * flatSawn) * warp + 3.0 * b3 + 0.9 * exp(-0.25 * kr * kr);
  float late = smoothstep(0.7, 0.95, 0.5 + 0.5 * cos(TAU * rc)) * mix(0.45, 1.0, flatSawn);
  vec3 wa = lin(vec3(0.68, 0.56, 0.46)), wb = lin(vec3(0.59, 0.47, 0.39)), wc = lin(vec3(0.74, 0.62, 0.51)), wd = lin(vec3(0.64, 0.56, 0.49));
  vec3 wood = mix(mix(wa, wb, b1), mix(wc, wd, b2), step(0.55, b3)) * (0.8 + 0.34 * b4);
  bool fresh = b5 > 0.94;                                  // a replaced board: warmer, not silvered yet
  if (fresh) wood *= vec3(1.08, 0.96, 0.84);
  wood *= (1.0 + 0.12 * streak) * (1.0 - 0.12 * late) * (1.0 + 0.03 * fib);
  wood *= 1.0 - 0.26 * (1.0 - smoothstep(0.0014, 0.032, eE)) * step(0.5, float(nj));
  wood = mix(wood, lin(vec3(0.3, 0.2, 0.13)), knot * 0.85);
  float stain = (1.0 - smoothstep(0.15, 0.45, c[0].x + 0.15 * n[1])) * step(0.7, c[0].z);
  wood *= 1.0 - 0.1 * stain;
  // silvering: arrises and board ends first, then patchy across weathered boards
  float edgeW = 1.0 - smoothstep(0.0, 0.016, eS - GAP);
  float endW = nj == 0 ? 0.0 : 1.0 - smoothstep(0.0, 0.035, eE - 0.0014);
  float silver = (0.08 + 0.45 * b2 * b2 * b3) * (0.7 + 0.6 * patchN) + 0.38 * edgeW + 0.3 * endW;
  silver = fresh ? 0.0 : clamp(silver * (0.55 + 0.9 * smoothstep(-0.5, 0.7, streak)) * (0.85 + 0.3 * (fib * 0.5 + 0.5)), 0.0, 0.75);
  vec3 grey = lin(vec3(0.6, 0.59, 0.56)) * (1.0 + 0.14 * streak) * (1.0 - 0.2 * late) * (1.0 - 0.12 * stain);
  // checks: fine splits along the grain, mostly running in from a butt end
  float chk = 0.0;
  for (int k = 0; k < 2 * uOne; k++) {
    ivec2 ck = ivec2(row * 2 + seg, k);
    float h1 = hf(ck, 41u), h2 = hf(ck, 43u), h3 = hf(ck, 47u);
    if (h1 > 0.5) continue;
    float L = 0.04 + 0.22 * h3;
    float xc = (k == 0 && nj > 0) ? j1 + (h2 > 0.5 ? 1.0 : -1.0) * (0.02 + L) : h2 * 2.24;
    float yc = GAP + 0.02 + h3 * (PW - 2.0 * GAP - 0.04);
    float taper = clamp(1.0 - jd(P.x - xc, 2.24) / L, 0.0, 1.0);
    float d = abs(ly - yc - 0.003 * sin(P.x * 23.0 + h1 * 40.0));
    float wdt = 0.0003 + 0.0011 * taper;
    chk = max(chk, (1.0 - smoothstep(wdt, wdt + PX, d)) * step(0.001, taper));
  }
  chk *= 1.0 - gap;
  // screws: over every joist (either side of a butt joint), 26 mm in from each edge; tannin/iron halo; a few rusty
  float jx = jd(P.x - 0.28, JS);
  float atJ = nj == 0 ? 0.0 : step(eE, 0.08);
  float sx = atJ > 0.5 ? abs(eE - 0.03) : jx;
  float sy = min(abs(ly - GAP - 0.026), abs(PW - GAP - 0.026 - ly));
  float sd = length(vec2(sx, sy));
  float screw = 1.0 - aa(0.0042, sd);
  float halo = (1.0 - smoothstep(0.004, 0.02, sd)) * (1.0 - screw);
  float sh = hf(wrp(ivec2(int(floor(P.x / 0.07)), row * 2 + int(ly > PW * 0.5)), ivec2(32, 32)), 53u);
  vec3 steel = (sh < 0.82 ? lin(vec3(0.62, 0.62, 0.6)) : lin(vec3(0.3, 0.25, 0.21))) * (0.78 + 0.35 * smoothstep(0.0042, 0.0, sd));
  float joist = 1.0 - smoothstep(0.018, 0.026, jx);
  vec3 gapC = mix(lin(vec3(0.03, 0.028, 0.025)), lin(vec3(0.16, 0.12, 0.09)), max(joist * ps.y, pe.y) * 0.85);
  vec3 col = mix(wood, grey, silver);
  col *= (1.0 - 0.45 * halo) * (1.0 - 0.55 * chk);
  col = mix(col, steel, screw);
  col = mix(col, gapC, gap);
  float h = min(ps.x, pe.x);
  h += (crown + 0.00011 * streak + 0.00017 * late + 0.00006 * fib - 0.0001 * knot - 0.0024 * chk) * (1.0 - gap);
  h = mix(h, -0.0004 + 0.00025 * sqrt(max(1.0 - pow(sd / 0.0042, 2.0), 0.0)), screw);
  s.alb = col; s.h = h;
  s.rough = mix(mix(0.68 + 0.08 * (fib * 0.5 + 0.5) + 0.05 * late + 0.1 * silver - 0.05 * knot, 0.36, screw), 0.95, gap);
  s.metal = screw * (sh < 0.82 ? 0.85 : 0.35);
  s.cav = mix(1.0, 0.3, gap) * (1.0 - 0.35 * chk) * (1.0 - 0.25 * halo);` }, { group: 1, name: "hullpaint", detail: 0.25, scale: 3.2, tint: true, mask: true, alpha: false, mode: oN, sym: 1, hr: [-4e-3, 3e-3], ao: 0.3, prep: `f[0] = FB(uv, ivec2(5), 4, 0.5, 301u); f[1] = FB(uv, ivec2(128), 2, 0.5, 307u); f[2] = FB(uv, ivec2(32, 4), 3, 0.5, 311u);
  f[3] = FB(uv, ivec2(16), 3, 0.5, 313u); w[0] = WO(uv, ivec2(32), 0.9, 317u);`, surf: `
  // painted steel hull plating: 1.6 m strakes welded on the repeat border, butts staggered (lower strake at the repeat
  // edge, upper at mid-length), a riveted butt-strap seam at 1.6 m (two rivet rows), frames every 0.4 m and stringers
  // every 0.8 m pulling the plate into shallow dishes ("hungry horse" — reads in reflections), chips through primer to
  // steel, rust weeping down from chips / rivets / the seam above, roller touch-up patches over old damage.
  // albedo.a = paint (tinted by the block colour); 0 = rust / primer / bare steel
  float x = P.x, y = P.y;
  float dW = min(y, 3.2 - y);
  float dB = y < 1.6 ? min(x, 3.2 - x) : abs(x - 1.6);
  float bead = max(exp(-dW * dW / 0.00006), exp(-dB * dB / 0.00006));
  float toe = max(exp(-pow((dW - 0.011) / 0.004, 2.0)), exp(-pow((dB - 0.011) / 0.004, 2.0)));   // paint pools at the weld toes
  float dL = abs(y - 1.6);
  float seamL = 1.0 - aa(0.001, dL);
  const float RP = 3.2 / 36.0;
  float rd = length(vec2(abs(mod(x, RP) - RP * 0.5), abs(dL - 0.036)));
  float riv = 1.0 - aa(0.0105, rd);
  float dome = sqrt(max(1.0 - pow(rd / 0.0105, 2.0), 0.0));
  float dish = pow(max(sin(PI * fract(x / 0.4)) * sin(PI * fract(y / 0.8)), 0.0), 0.9);
  // chips (10 cm cells, more where the paint is thin)
  vec4 wc = c[0];
  float cp = step(1.0 - (0.008 + 0.025 * smoothstep(0.1, 0.7, n[3] * 0.5 + 0.5)), wc.z);
  float cr = 0.002 + 0.006 * fract(wc.z * 37.1);
  float cdist = wc.x * 0.1 + cr * 0.9 * n[1] + 0.002 * n[2];
  float chip = cp * (1.0 - aa(cr, cdist));
  float core = cp * (1.0 - aa(cr * 0.55, cdist));
  float rsty = step(0.45, fract(wc.z * 71.3));
  // rust weeps: per 10 cm column up to two sources (the welded seam above, a rivet, or a chip), running down
  float weep = 0.0, spot = 0.0;
  int ci = int(floor(x / 0.1));
  for (int it = 0; it < 6 * uOne; it++) {
    int dc = (it >> 1) - 1, k = it & 1;
    ivec2 cid = wrp(ivec2(ci + dc, k), ivec2(32, 2));
    float h1 = hf(cid, 61u), h2 = hf(cid, 67u), h3 = hf(cid, 71u), h4 = hf(cid, 73u);
    if (h1 > 0.2) continue;
    float xs = (float(ci + dc) + 0.15 + 0.7 * h2) * 0.1, ys;
    if (h3 < 0.35) ys = 3.194;
    else if (h3 < 0.7) { xs = (floor(xs / RP) + 0.5) * RP; ys = 1.6 - 0.036 - 0.009; }
    else ys = 0.3 + 2.7 * fract(h4 * 7.3);
    float L = min(0.12 + 0.7 * h4 * h4, ys - 0.03);
    float dy = ys - y;
    if (dy < -0.02 || dy > L) continue;
    float t = max(dy, 0.0) / L;
    float xm = xs + 0.005 * sin(dy * 7.0 + h2 * 30.0) + 0.006 * n[2] * t;
    float w = (0.01 + 0.018 * h2) * (0.5 + 1.5 * t);
    float lat = 1.0 - smoothstep(w * 0.1, w, abs(x - xm) * (1.0 + 0.35 * n[1]));
    weep = max(weep, lat * lat * pow(1.0 - t, 1.2) * smoothstep(-0.015, 0.01, dy) * (0.55 + 0.45 * h4) * (0.75 + 0.25 * n[1]));
    if (h3 >= 0.7) spot = max(spot, 1.0 - aa(0.003 + 0.004 * h2, length(vec2(x - xs, y - ys)) + 0.003 * n[1]));
  }
  // roller touch-up patches (fresh, glossier paint in a slightly different shade) over old chips and weeps
  ivec2 pc = ivec2(floor(P / vec2(0.8, 0.4)));
  ivec2 pcw = wrp(pc, ivec2(4, 8));
  vec2 pl = P - (vec2(pc) * vec2(0.8, 0.4) + vec2(0.4, 0.2)) - (hf2(pcw, 89u) - 0.5) * vec2(0.2, 0.08);
  float pd = sdRB(pl, vec2(0.1 + 0.16 * hf(pcw, 83u), 0.05 + 0.08 * hf(pcw, 87u)), 0.025) + 0.01 * n[1] + 0.012 * n[2];
  float patchM = step(hf(pcw, 81u), 0.07) * (1.0 - aa(0.0, pd));
  float mott = n[0], stip = n[1];
  float chalk = smoothstep(0.15, 0.75, mott);
  float paint = 0.8 * (1.0 + 0.04 * mott + 0.012 * stip) * (1.0 + 0.04 * chalk);
  paint *= mix(1.0, 0.94 + 0.12 * hf(pcw, 91u), patchM);
  paint *= (1.0 + 0.12 * (bead * 0.7 + riv * smoothstep(0.55, 1.0, dome))) * (1.0 - 0.14 * toe);
  weep *= 1.0 - patchM;
  float chipT = max(chip, spot) * (1.0 - patchM);
  vec3 rust = lin(vec3(0.56, 0.33, 0.19)) * (0.85 + 0.3 * n[2]);
  vec3 chipC = mix(lin(vec3(0.36, 0.34, 0.33)), rsty > 0.5 ? lin(vec3(0.33, 0.17, 0.09)) : lin(vec3(0.27, 0.27, 0.28)), core);
  vec3 own = vec3(0.0); float cov = 1.0;
  own = mix(own, rust, weep * 0.62); cov *= 1.0 - weep * 0.62;
  own = mix(own, chipC, chipT); cov *= 1.0 - chipT;
  s.alb = own; s.a = cov * paint;
  s.h = 0.0016 * bead - 0.0002 * toe + 0.0028 * riv * dome - 0.0018 * dish - 0.0003 * seamL - 0.00025 * chipT + 0.00003 * stip + 0.0001 * patchM;
  s.rough = mix(mix(mix(0.44 + 0.12 * chalk + 0.03 * stip + 0.06 * bead, 0.3, patchM), 0.72, weep * 0.6), core * (1.0 - rsty) > 0.5 ? 0.42 : 0.82, chipT);
  s.metal = chipT * core * (1.0 - rsty) * 0.75;
  s.cav = (1.0 - 0.3 * seamL) * (1.0 - 0.3 * riv * (1.0 - dome)) * (1.0 - 0.2 * toe);` }, { group: 1, name: "nonslip", detail: 0.5, scale: 2.4, tint: true, mask: true, alpha: false, mode: oN, sym: 7, hr: [-0.012, 15e-4], ao: 0.4, prep: `f[0] = FB(uv, ivec2(5), 4, 0.5, 401u); f[1] = FB(uv, ivec2(64), 2, 0.5, 409u); f[2] = FB(uv, ivec2(12), 3, 0.5, 419u);
  w[0] = WO(uv, ivec2(260), 1.0, 421u); w[1] = WO(uv, ivec2(10), 0.9, 431u);`, surf: `
  // ro-ro car deck: 2.4 m plates welded on the repeat border (slightly sagging between beams), anti-slip coating with
  // grit in the paint, cloverleaf lashing sockets on a 1.2 m grid (galvanised, paint worn off round the rims, some
  // rusty), rubber scuffs, thin worn patches, rust spotting along the seams
  float dW = min(jd(P.x, 2.4), jd(P.y, 2.4));
  float bead = exp(-dW * dW / 0.00003);
  vec2 pu = P / 2.4;
  float sag = sin(PI * pu.x) * sin(PI * pu.y);
  vec4 g = c[0];
  float gran = smoothstep(0.02, 0.22, g.y - g.x) * (1.0 - g.x * g.x);
  float gt = fract(g.z * 7.7) - 0.5;
  ivec2 pc = ivec2(floor(P / 1.2));
  vec2 lp = P - (vec2(pc) * 1.2 + 0.6);
  float r = length(lp);
  float ph = hf(wrp(pc, ivec2(2)), 7u);
  float plate = 1.0 - aa(0.068, r);
  float rim = exp(-pow((r - 0.064) / 0.004, 2.0));
  float lobe = min(min(length(lp - vec2(0.021, 0.0)), length(lp + vec2(0.021, 0.0))), min(length(lp - vec2(0.0, 0.021)), length(lp + vec2(0.0, 0.021)))) - 0.019;
  float hole = 1.0 - aa(0.0, min(lobe, max(abs(lp.x), abs(lp.y)) - 0.02));
  float wearRing = (1.0 - smoothstep(0.068, 0.1 + 0.02 * n[2], r)) * (1.0 - plate);
  float rustHalo = step(ph, 0.4) * (1.0 - smoothstep(0.07, 0.15 + 0.05 * n[2], r)) * (1.0 - plate) * smoothstep(-0.3, 0.3, n[2]);
  float worn = smoothstep(0.4, 0.75, n[0] * 0.5 + 0.5 + 0.1 * n[1]);
  float scuff = step(0.8, c[1].z) * (1.0 - smoothstep(0.03, 0.2, c[1].x + 0.22 * n[2]));
  float seamRust = exp(-dW * dW / 0.00018) * smoothstep(0.62, 0.85, n[2] * 0.5 + 0.5);
  float grime = (1.0 - gran) * smoothstep(0.1, 0.6, g.x);          // dirt settles between the granules
  float paint = 0.8 * (1.0 + 0.03 * n[0] + 0.03 * n[1]) * (1.0 + 0.2 * gt * gran) * (1.0 - 0.1 * grime * (1.0 - worn)) * (1.0 + 0.035 * worn) * (1.0 - 0.22 * scuff);
  paint *= 1.0 + 0.08 * bead;
  vec3 galv = lin(vec3(0.47, 0.48, 0.49)) * (0.8 + 0.2 * n[1]) * (1.0 - 0.3 * smoothstep(0.045, 0.068, r));
  vec3 rust = lin(vec3(0.42, 0.21, 0.1)) * (0.85 + 0.3 * n[2]);
  vec3 own = vec3(0.0); float cov = 1.0;
  own = mix(own, lin(vec3(0.36, 0.36, 0.37)), wearRing * 0.45); cov *= 1.0 - wearRing * 0.45;
  own = mix(own, rust, rustHalo * 0.75); cov *= 1.0 - rustHalo * 0.75;
  own = mix(own, rust, seamRust * 0.7); cov *= 1.0 - seamRust * 0.7;
  vec3 potC = mix(galv, lin(vec3(0.015)), hole);
  potC = mix(potC, rust * 0.8, step(ph, 0.4) * smoothstep(0.024, 0.06, r) * 0.45 * (1.0 - hole));
  own = mix(own, potC, plate); cov *= 1.0 - plate;
  float h = 0.0009 * bead - 0.0012 * sag + 0.0006 * gran * (1.0 - 0.5 * worn) + 0.00006 * n[1];
  h = mix(h, 0.0003 + 0.0006 * rim - 0.012 * hole, plate);
  s.alb = own; s.a = cov * paint; s.h = h;
  s.rough = mix(mix(0.86 - 0.06 * gran - 0.09 * worn + 0.04 * n[1], 0.66, seamRust * 0.5), mix(0.5, 0.95, hole), plate);
  s.metal = plate * (1.0 - hole) * 0.8 + wearRing * 0.4;
  s.cav = mix(1.0, 0.15, hole * plate) * (1.0 - 0.2 * rim);` }, { group: 1, name: "gelcoat", detail: 0.1, scale: 2.4, tint: true, mask: true, alpha: false, mode: oN, sym: 1, hr: [-16e-4, 5e-4], ao: 0.3, prep: `f[0] = FB(uv, ivec2(4), 4, 0.5, 501u); f[1] = FB(uv, ivec2(40, 4), 3, 0.5, 503u); f[2] = FB(uv, ivec2(3, 30), 3, 0.5, 509u);
  f[3] = FB(uv, ivec2(16), 3, 0.5, 511u); w[0] = WO(uv, ivec2(110), 1.0, 521u); w[1] = WO(uv, ivec2(40), 1.0, 523u);`, surf: `
  // moulded fibreglass: gloss gelcoat, faint orange peel, moulded panel lines (2.4 x 0.8 m, rounded), crazing round a
  // few panel corners, chalky oxidised patches, horizontal fender scuffs and faint brown run-off streaks
  vec2 cell = floor(P / vec2(2.4, 0.8));
  vec2 lp = P - (cell * vec2(2.4, 0.8) + vec2(1.2, 0.4));
  float e = min(jd(P.y, 0.8), jd(P.x, 2.4) + 0.0006);   // moulded seams: every 0.8 m up, every 2.4 m along
  float line = exp(-e * e / 0.0000035) * (jd(P.y, 0.8) < jd(P.x, 2.4) ? 1.0 : 0.7);
  float ridge = exp(-pow((e - 0.005) / 0.002, 2.0));
  float peel = smoothstep(0.0, 0.25, c[0].y - c[0].x) * (1.0 - c[0].x * c[0].x);
  float ox = smoothstep(0.1, 0.65, n[0]);
  float corner = 1.0 - smoothstep(0.03, 0.22, length(abs(lp) - vec2(1.2, 0.4)));
  float ch = hf(wrp(ivec2(cell), ivec2(1, 3)), 5u);
  float craze = (1.0 - aa(0.0005, (c[1].y - c[1].x) * 0.03)) * corner * step(ch, 0.4) * step(0.001, e);
  float run = smoothstep(0.45, 0.85, n[1] * 0.5 + 0.5) * smoothstep(0.0, 0.5, n[3]);
  float scuff = smoothstep(0.74, 0.94, n[2] * 0.5 + 0.5) * smoothstep(0.6, 0.85, n[3] * 0.5 + 0.5);
  float paint = 0.8 * (1.0 + 0.012 * n[3]) * (1.0 + 0.025 * ox) * (1.0 - 0.14 * scuff) * (1.0 - 0.16 * line) * (1.0 - 0.3 * craze);
  vec3 own = vec3(0.0); float cov = 1.0;
  float oxc = 0.06 * ox;                                   // chalky oxidation drifts toward a pale cream
  own = mix(own, lin(vec3(0.9, 0.87, 0.8)) * (1.0 - 0.14 * scuff), oxc); cov *= 1.0 - oxc;
  float rn2 = 0.1 * run;                                   // faint tannin / run-off streaks
  own = mix(own, lin(vec3(0.62, 0.52, 0.38)), rn2); cov *= 1.0 - rn2;
  s.alb = own; s.a = cov * paint;
  s.h = -0.0006 * line + 0.00008 * ridge + 0.00009 * peel + 0.00006 * n[3] - 0.00025 * craze - 0.00002 * scuff;
  s.rough = 0.12 + 0.1 * ox + 0.06 * scuff + 0.25 * line + 0.2 * craze + 0.015 * n[3];
  s.cav = (1.0 - 0.3 * line) * (1.0 - 0.3 * craze);` }, { group: 1, name: "yard", detail: 0.9, scale: 3.2, tint: true, mask: true, alpha: false, mode: oN, sym: 7, hr: [-0.01, 12e-4], ao: 0.5, prep: `f[0] = FB(uv, ivec2(4), 5, 0.55, 601u); f[1] = FB(uv, ivec2(16), 3, 0.5, 607u);
  f[2] = FB(uv, ivec2(10, 96), 1, 0.5, 613u); f[3] = FB(uv, ivec2(64), 3, 0.5, 617u);
  vec2 wq = uv + 0.02 * vec2(sin(TAU * (3.0 * uv.y + 2.0 * uv.x)) + 0.5 * sin(TAU * (7.0 * uv.y - 5.0 * uv.x) + 1.3),
                             sin(TAU * (3.0 * uv.x - 2.0 * uv.y) + 0.7) + 0.5 * sin(TAU * (6.0 * uv.x + 5.0 * uv.y) + 2.1));
  w[0] = WO(wq, ivec2(4), 0.85, 619u); w[1] = WO(uv, ivec2(64), 1.0, 631u);`, surf: `
  // boatyard hardstanding: 3.2 m broom-finished slabs (broom direction per slab via the grid transform), sealed
  // expansion joints on the repeat border with chipped arrises, oil stains, rust rings from jack stands, clusters of
  // antifouling specks where hulls were sanded and painted, hairline cracks, a trowelled repair, rubber scuffs
  float dE = min(jd(P.x, 3.2), jd(P.y, 3.2));
  float spall = 0.002 * smoothstep(0.25, 0.85, n[3] * 0.5 + 0.5);
  vec2 pe = edgeProf(dE, 0.0055, 0.004 + spall, 0.0016 + spall * 0.5, 0.004);
  float mott = n[0], broom = n[2];
  vec4 wc = c[0];
  float kind = wc.z;
  float d = wc.x + 0.3 * n[1] + 0.07 * n[3];
  float rS = 0.08 + 0.2 * fract(kind * 17.3);
  float away = smoothstep(0.35, 0.75, dE);                      // keep distinct stains off the slab edges (no mirrored twins)
  float oilK = 0.0;                                                // oil lives in the level shader at world scale (never repeats)
  float oil = oilK * (1.0 - smoothstep(rS * 0.85, rS, d));
  float oilCore = oilK * (1.0 - smoothstep(rS * 0.2, rS * 0.8, d + 0.06 * n[3]));
  float ringD = abs(wc.x * 0.8 - (0.07 + 0.07 * fract(kind * 31.0)));
  float rust = step(0.34, kind) * step(kind, 0.42) * max(exp(-ringD * ringD / 0.0003), 0.3 * (1.0 - smoothstep(0.0, 0.12, wc.x * 0.8))) * smoothstep(-0.35, 0.3, n[1]) * away;
  float cluster = step(0.46, kind) * step(kind, 0.6) * (1.0 - smoothstep(0.1, 0.75, wc.x + 0.2 * n[1])) * away;
  vec4 sc = c[1];
  float sr = 0.0018 + 0.004 * pow(fract(sc.z * 13.1), 3.0) + 0.006 * step(0.985, fract(sc.z * 29.3));
  float spk = step(1.0 - 0.45 * cluster * smoothstep(-0.2, 0.3, n[1]), sc.z) * (1.0 - aa(sr, sc.x * 0.05 + 0.25 * sr * n[3]));
  float dust = cluster * smoothstep(-0.3, 0.5, n[1]) * 0.22;                 // sanding dust haze around the specks
  float kf = fract(kind * 7.0);
  vec3 af = kf < 0.55 ? lin(vec3(0.42, 0.27, 0.22)) : (kf < 0.85 ? lin(vec3(0.24, 0.28, 0.34)) : lin(vec3(0.18, 0.18, 0.19)));
  float crack = (1.0 - aa(0.0006, (wc.y - wc.x) * 0.4)) * step(0.55, fract(wc.z * 5.3 + wc.w * 2.7)) * smoothstep(0.1, 0.4, mott) * step(0.02, dE);
  ivec2 pc = ivec2(floor(P / 1.6));
  ivec2 pcw = wrp(pc, ivec2(2));
  vec2 pl = P - (vec2(pc) * 1.6 + 0.8) - (hf2(pcw, 15u) - 0.5) * 0.5;
  float pd = sdRB(pl, vec2(0.2 + 0.22 * hf(pcw, 17u), 0.16 + 0.16 * hf(pcw, 19u)), 0.03) + 0.006 * n[3];
  float patchM = step(hf(pcw, 13u), 0.16) * (1.0 - aa(0.0, pd));
  float patchEdge = step(hf(pcw, 13u), 0.16) * (1.0 - aa(0.0015, abs(pd)));
  float scuff = smoothstep(0.62, 0.92, n[1] * 0.5 + 0.5) * smoothstep(-0.1, 0.5, mott);
  float agg = step(0.8, fract(sc.z * 5.3)) * (1.0 - aa(0.004, sc.x * 0.05 + 0.002 * n[3])) * smoothstep(0.0, 0.6, mott * 0.5 + 0.5);
  float pore = step(0.9, fract(sc.w * 7.9 + sc.z)) * (1.0 - aa(0.0018, sc.x * 0.05));          // bug holes
  float paint = 0.8 * (1.0 + 0.11 * mott + 0.045 * n[1] + 0.02 * broom + 0.05 * n[3]) * (1.0 - 0.35 * pore);
  paint *= 1.0 - 0.1 * smoothstep(0.3, 0.9, -mott);
  paint *= mix(1.0, 0.92 + 0.04 * n[3], patchM) * (1.0 - 0.25 * patchEdge);
  paint *= (1.0 - 0.25 * oil) * (1.0 - 0.14 * scuff) * (1.0 - 0.45 * crack);
  paint *= 1.0 - 0.18 * (1.0 - smoothstep(0.007, 0.03, dE)) * (1.0 - pe.y);   // dirt along the joint
  vec3 rustC = lin(vec3(0.5, 0.27, 0.13)) * (0.85 + 0.3 * n[3]);
  vec3 own = vec3(0.0); float cov = 1.0;
  own = mix(own, lin(vec3(0.46, 0.43, 0.39)) * (0.8 + 0.4 * fract(sc.z * 11.3)), agg * 0.6); cov *= 1.0 - agg * 0.6;
  own = mix(own, lin(vec3(0.1, 0.09, 0.08)), oilCore * 0.4); cov *= 1.0 - oilCore * 0.4;
  own = mix(own, af * 1.3, dust); cov *= 1.0 - dust;
  own = mix(own, rustC, rust * 0.7); cov *= 1.0 - rust * 0.7;
  own = mix(own, af * (0.85 + 0.3 * fract(sc.z * 3.7)), spk); cov *= 1.0 - spk;
  own = mix(own, lin(vec3(0.17, 0.165, 0.16)) * (0.85 + 0.3 * n[3]), pe.y); cov *= 1.0 - pe.y;
  s.alb = own; s.a = cov * paint;
  s.h = pe.x + (0.00007 * broom + 0.0001 * n[3] + 0.0002 * spk + 0.00035 * patchM - 0.0015 * crack - 0.0012 * pore + 0.00012 * agg) * (1.0 - pe.y) - 0.0003 * patchEdge;
  s.rough = mix(mix(mix(0.87 + 0.04 * n[3] - 0.05 * agg, 0.72, patchM) - 0.2 * oilCore - 0.06 * oil, 0.5, spk), 0.62, pe.y);
  s.cav = mix(1.0, 0.8, pe.y) * (1.0 - 0.4 * crack) * (1.0 - 0.2 * patchEdge) * (1.0 - 0.4 * pore);` }, { group: 1, name: "weatherboard", detail: 0.3, scale: 2.4, tint: true, mask: true, alpha: false, mode: oN, sym: 1, hr: [-0.016, 6e-4], ao: 0.55, prep: `int row = int(floor(P.y / 0.15)); float ly = P.y - float(row) * 0.15;
  f[0] = Req(vec2(uv.x * 8.0, ly * 45.0 + float(row) * 5.3), ivec2(8, 4096), 3, 0.5, 701u);
  f[1] = FB(uv, ivec2(5), 4, 0.5, 709u); f[2] = FB(uv, ivec2(40, 16), 3, 0.5, 719u); f[3] = FB(uv, ivec2(24), 3, 0.5, 727u);
  w[0] = WO(uv, ivec2(12, 64), 0.9, 733u);`, surf: `
  // painted bevel-lap weatherboards: 150 mm exposure, each board tapering back under the butt of the one above (a crisp
  // drip-edge shadow line), studs every 0.6 m with a nail per board, butt joints over studs, grain telegraphing through
  // satin paint, chalky weathering, paint peeling to grey timber (untinted) along butt edges, rust runs from nails
  const float BW = 0.15;
  int row = int(floor(P.y / BW));
  float ly = P.y - float(row) * BW;
  float t = ly / BW;
  float grain = n[0], weath = smoothstep(0.0, 0.7, n[1]), pn = n[2];
  float h = -0.013 * pow(t, 1.15) - 0.0022 * (1.0 - smoothstep(0.0, 0.005, ly));
  int jsw[16] = int[16](1, 3, 0, 2, 3, 1, 2, 0, 1, 2, 3, 0, 2, 0, 3, 1);
  float jxp = 0.3 + 0.6 * float(jsw[row]);
  float eJ = hf(ivec2(row, 0), 19u) < 0.55 ? jd(P.x - jxp, 2.4) : 1.0;
  vec2 pj = edgeProf(eJ, 0.0009, 0.002, 0.0008, 0.008);
  float nx = eJ < 0.05 ? abs(eJ - 0.022) : jd(P.x - 0.3, 0.6);
  float nd = length(vec2(nx, ly - 0.028));
  float nail = 1.0 - aa(0.0035, nd);
  // peeling: flakes (10 cm cells, denser where weathered) + along the butt edges and joints
  vec4 wc = c[0];                                   // cells 0.2 m along x 37 mm up: flakes run with the grain
  float pp = step(1.0 - (0.02 + 0.11 * weath) * (1.4 - t), wc.z);
  float peel = pp * (1.0 - aa(0.0, (wc.x + 0.28 * pn - (0.3 + 0.35 * fract(wc.z * 19.3))) * 0.0375));
  float edgeP = (1.0 - smoothstep(0.0, 0.005 + 0.016 * weath, ly + 0.005 * pn)) * step(0.64 - 0.3 * weath, pn * 0.5 + 0.5);
  float jointP = (1.0 - smoothstep(0.0, 0.008 + 0.016 * weath, eJ + 0.004 * pn)) * step(0.52, pn * 0.5 + 0.5);
  peel = max(max(peel, edgeP), jointP) * (1.0 - nail);
  float pedge = (1.0 - smoothstep(0.0, 0.6, abs(peel - 0.5) * 2.0)) * step(0.02, peel);
  float checkP = (1.0 - smoothstep(0.0, 0.05, abs(grain))) * smoothstep(0.35, 0.9, weath);   // paint checking along the grain
  // rust runs from a quarter of the nails, a few boards down
  float weep = 0.0;
  int sk = int(floor((P.x - 0.3) / 0.6 + 0.5));
  float xs0 = 0.3 + 0.6 * float(sk);
  for (int dr = 0; dr < 4 * uOne; dr++) {
    int rr = row + dr;
    if (rr > 15) break;
    ivec2 id = wrp(ivec2(sk, rr), ivec2(4, 16));
    float h1 = hf(id, 61u);
    if (h1 > 0.24) continue;
    float ys = float(rr) * BW + 0.024;
    float L = min(0.06 + 0.4 * hf(id, 67u), ys - 0.02);
    float dy = ys - P.y;
    if (dy < -0.004 || dy > L) continue;
    float tt = max(dy, 0.0) / L;
    float xm = xs0 + 0.002 * sin(dy * 40.0 + h1 * 50.0) + 0.002 * pn;
    float w = 0.007 * (1.0 + 1.4 * tt);
    float lat = 1.0 - smoothstep(0.0, w, abs(P.x - xm));
    weep = max(weep, lat * lat * pow(1.0 - tt, 1.2) * (0.6 + 0.4 * h1 / 0.24));
  }
  float paint = 0.8 * (1.0 + 0.025 * grain + 0.02 * n[3]) * (1.0 + 0.05 * weath);
  paint *= (1.0 - 0.06 * smoothstep(0.75, 1.0, t)) * (1.0 + 0.12 * pedge) * (1.0 - 0.3 * checkP) * (1.0 - 0.15 * nail);
  float gl = smoothstep(0.55, 0.95, 0.5 + 0.5 * cos(TAU * (ly * 38.0 + 2.2 * grain)));      // grain lines in the bare wood
  vec3 bare = lin(vec3(0.61, 0.59, 0.55)) * (1.0 + 0.1 * grain) * (1.0 - 0.28 * gl) * (1.0 + 0.06 * n[3]);
  bare *= 1.0 - 0.35 * (1.0 - smoothstep(0.0, 0.35, peel)) * step(0.02, peel);          // shadow under the lifted edge
  vec3 own = vec3(0.0); float cov = 1.0;
  own = mix(own, bare, peel); cov *= 1.0 - peel;
  own = mix(own, lin(vec3(0.52, 0.28, 0.13)), weep * 0.6); cov *= 1.0 - weep * 0.6;
  own = mix(own, lin(vec3(0.05)), pj.y); cov *= 1.0 - pj.y;
  s.alb = own; s.a = cov * paint;
  s.h = min(h, pj.x) + 0.00006 * grain * (1.0 + peel) - 0.00012 * peel - 0.0004 * nail;
  s.rough = mix(mix(0.5 + 0.18 * weath + 0.03 * n[3], 0.82, peel), 0.75, weep * 0.5);
  s.cav = (1.0 - 0.45 * smoothstep(0.8, 1.0, t)) * mix(1.0, 0.4, pj.y);` }, { group: 1, name: "render", detail: 0.8, scale: 2.4, tint: true, mask: true, alpha: false, mode: Ly, sym: 7, hr: [-16e-4, 12e-4], ao: 0.4, prep: `f[0] = FB(uv, ivec2(4), 4, 0.55, 801u); f[1] = FB(uv, ivec2(12), 3, 0.5, 809u); f[2] = FB(uv, ivec2(48), 2, 0.5, 811u);
  vec2 wq = uv + 0.018 * vec2(sin(TAU * (4.0 * uv.y + 3.0 * uv.x)) + 0.45 * sin(TAU * (11.0 * uv.y - 7.0 * uv.x) + 1.9),
                              sin(TAU * (4.0 * uv.x - 3.0 * uv.y) + 0.4) + 0.45 * sin(TAU * (9.0 * uv.x + 8.0 * uv.y) + 2.6));
  w[0] = WO(uv, ivec2(220), 1.0, 821u); w[1] = WO(wq, ivec2(5), 0.85, 823u);`, surf: `
  // painted cement render, float finish: sand grain, soft trowel undulation, hairline map cracks, chalky blotches,
  // small flakes of paint lost to the grey render beneath (untinted). Isotropic → hex anti-tiling.
  vec4 g = c[0];
  float grain = smoothstep(0.03, 0.25, g.y - g.x) * (1.0 - g.x * g.x);
  float gt = fract(g.z * 5.7) - 0.5;
  float und = n[1], blot = smoothstep(0.0, 0.7, n[0]);
  vec4 k = c[1];
  float crackOn = step(0.72, fract(k.z * 9.1 + k.w * 3.3)) * smoothstep(0.0, 0.35, n[0]);
  float crack = (1.0 - aa(0.0003, (k.y - k.x) * 0.24)) * crackOn;
  float flake = step(0.82, fract(k.w * 13.7 + k.z)) * (1.0 - aa(0.0, (k.x - 0.08 - 0.05 * n[2]) * 0.48)) * step(0.3, n[0]);
  float pass = smoothstep(-0.25, 0.25, n[1] + 0.35 * n[0]);                 // trowel passes: slightly different tone
  float paint = 0.8 * (1.0 + 0.1 * gt * grain - 0.05 * (1.0 - grain) + 0.035 * n[2] + 0.03 * und) * (1.0 + 0.06 * blot) * (1.0 - 0.035 * pass) * (1.0 - 0.3 * crack);
  vec3 bare = lin(vec3(0.55, 0.54, 0.51)) * (1.0 + 0.06 * gt * grain);
  s.alb = bare * flake; s.a = (1.0 - flake) * paint;
  s.h = 0.0006 * grain + 0.0011 * und + 0.0001 * n[2] - 0.0008 * crack - 0.0003 * flake;
  s.rough = 0.8 + 0.06 * blot - 0.04 * grain + 0.03 * flake;
  s.cav = 1.0 - 0.35 * crack;` }, { group: 2, name: "treads", detail: 0.25, scale: 1.12, stair: [0.28, 4, 0.5, 1], tint: true, mask: true, alpha: false, mode: oN, sym: 1, hr: [-0.1, 2e-3], ao: 0.1, prep: `f[0] = FB(uv, ivec2(6), 4, 0.5, 901u); f[1] = FB(uv, ivec2(48), 2, 0.5, 907u); f[2] = FB(uv, ivec2(16, 4), 3, 0.5, 911u);
  f[3] = FB(uv, ivec2(10), 3, 0.5, 913u); w[0] = WO(uv, ivec2(40), 1.0, 919u); w[1] = WO(uv, ivec2(12, 16), 0.9, 929u);`, surf: `
  // galvanised steel stair (ferry sun-deck stairs): a step every 0.28 m along the slope (θ ≈ 22°), checker-plate
  // treads (raised lozenges alternating ±45° on 28 mm cells), rounded nosings with a yellow anti-slip strip worn at the
  // edge, painted risers (albedo.a = paint, tinted by the block colour), rust at the riser feet, boot scuffs, spangle
  const float PD = 0.28, S2 = 0.1403, TT = 0.4040, CT = 2.4751;
  float j = floor(P.y / PD);
  float a = P.y - j * PD;                          // metres downhill of this step's nosing line (the next one at PD)
  float ar = PD * S2;                              // the riser's footprint on the slope plane
  float r1 = -a * CT, r2 = (a - PD) * TT;          // riser line, tread line
  float kF = 0.004, qF = max(kF - abs(r1 - r2), 0.0) / kF;
  float h = max(r1, r2) + qF * qF * kF * 0.25;     // small fillet at the riser foot
  float xa = a < PD * 0.5 ? a : a - PD;            // signed distance from the nearest nosing line
  float l1 = xa * TT, l2 = -xa * CT;
  float kN = 0.014, qN = max(kN - abs(l1 - l2), 0.0) / kN;
  if (abs(xa) < 0.02) h = min(h, min(l1, l2) - qN * qN * kN * 0.25);   // rounded nosing
  float riser = 1.0 - smoothstep(ar - PX, ar + PX, a);
  vec2 cp = P / 0.028;
  ivec2 ci = ivec2(floor(cp));
  vec2 cf = cp - vec2(ci) - 0.5;
  bool odd = ((ci.x + ci.y) & 1) == 1;
  vec2 q = (odd ? vec2(cf.x + cf.y, cf.y - cf.x) : vec2(cf.x - cf.y, cf.x + cf.y)) * 0.70710678;
  float ld = length(vec2(max(abs(q.x) - 0.3, 0.0), q.y)) - 0.12;
  float lw = PX / 0.028;
  float onPlate = smoothstep(ar + 0.006, ar + 0.014, a) * (1.0 - smoothstep(PD - 0.012, PD - 0.005, a));
  float loz = (1.0 - smoothstep(-lw, lw, ld)) * onPlate;
  float ldome = sqrt(clamp(-ld / 0.12, 0.0, 1.0));
  float lbase = (1.0 - smoothstep(0.0, 0.06, abs(ld))) * onPlate;
  vec4 sp = c[0];
  float mott = n[0], fineN = n[1], strk = n[2], dullN = n[3];
  vec3 galv = lin(vec3(0.6, 0.62, 0.64)) * (1.0 + 0.08 * (sp.z - 0.5) + 0.05 * mott + 0.02 * fineN);
  float dull = smoothstep(0.1, 0.6, dullN);
  galv = mix(galv, lin(vec3(0.68, 0.69, 0.68)), dull * 0.35);                  // white-rust dulling
  float polish = loz * ldome * smoothstep(0.35, 0.75, 0.5 + 0.5 * strk);         // lozenge tops polished by boots
  galv = mix(galv, lin(vec3(0.76, 0.77, 0.79)), polish * 0.6);
  float nose = max(1.0 - smoothstep(0.045 - PX, 0.045 + PX, PD - a), 1.0 - smoothstep(0.012 - PX, 0.012 + PX, a));
  float worn = smoothstep(0.62, 0.86, 0.5 + 0.5 * strk + 0.35 * (1.0 - smoothstep(0.0, 0.01, abs(xa))) + 0.15 * (sp.w - 0.5));
  vec3 yel = lin(vec3(0.93, 0.72, 0.17)) * (1.0 + 0.05 * mott) * (1.0 - 0.1 * smoothstep(0.3, 0.8, dullN));
  vec4 rc = c[1];
  float foot = exp(-pow((a - ar - 0.004) / 0.007, 2.0));
  float rust = foot * smoothstep(0.05, 0.5, dullN + 0.35 * (rc.z - 0.5));
  rust = max(rust, step(0.9, rc.z) * (1.0 - smoothstep(0.06, 0.2, rc.x)) * onPlate * 0.8);
  float scuff = step(0.72, fract(rc.z * 7.3)) * (1.0 - smoothstep(0.1, 0.35, rc.x + 0.15 * fineN)) * smoothstep(PD - 0.13, PD - 0.06, a) * (1.0 - nose);
  galv *= 1.0 - 0.3 * scuff;
  vec3 rustC = lin(vec3(0.46, 0.25, 0.12)) * (0.85 + 0.3 * fineN);
  float yN = nose * (1.0 - worn);
  float rP = riser * (1.0 - nose);
  vec3 own = mix(galv, yel, yN);
  own = mix(own, vec3(0.0), rP); float cov = rP;
  own = mix(own, rustC, rust * 0.8); cov *= 1.0 - rust * 0.8;
  s.alb = own;
  s.a = cov * 0.8 * (0.94 + 0.08 * mott);
  s.h = h + 0.0013 * loz * ldome - 0.0002 * rust;
  s.rough = mix(mix(mix(0.58 + 0.08 * (sp.z - 0.5) + 0.1 * dull - 0.16 * polish + 0.08 * scuff, 0.62, yN), 0.5, rP), 0.85, rust * 0.8);
  s.metal = (0.35 + 0.3 * polish) * (1.0 - yN) * (1.0 - rP) * (1.0 - rust * 0.8) * (1.0 - 0.5 * scuff);
  s.cav = (1.0 - 0.35 * exp(-pow((a - ar) / 0.006, 2.0))) * (1.0 - 0.18 * lbase);` }, { group: 2, name: "stonestep", detail: 0.6, scale: 1.92, stair: [0.32, 6, 0.5, 2], tint: true, mask: true, alpha: false, mode: oN, sym: 1, hr: [-0.115, 2e-3], ao: 0.1, prep: `f[0] = FB(uv, ivec2(4), 4, 0.5, 1001u); f[1] = FB(uv, ivec2(24), 3, 0.5, 1009u); f[2] = FB(uv, ivec2(96), 2, 0.5, 1013u);
  f[3] = FB(uv, ivec2(6, 30), 3, 0.5, 1019u); w[0] = WO(uv, ivec2(120), 1.0, 1021u); w[1] = WO(uv, ivec2(24), 0.9, 1031u);`, surf: `
  // limestone steps (quay grand stair): a step every 0.32 m along the slope (θ ≈ 21.5°) with a bullnose, a dark
  // carborundum anti-slip insert 20 mm behind each nosing, a dark grime line where each tread meets the riser above,
  // slabs 0.8-1.1 m long with fine joints staggered step to step, per-slab tone and warm/cool cast, shell fragments,
  // pores, bedding, chipped nosings, water staining at the riser feet. albedo.a = limestone (block colour)
  const float PD = 0.32, S2 = 0.1344, TT = 0.3939, CT = 2.5386;
  float j = floor(P.y / PD);
  int ji = int(j);
  float a = P.y - j * PD;
  float ar = PD * S2;
  float r1 = -a * CT, r2 = (a - PD) * TT;
  float kF = 0.005, qF = max(kF - abs(r1 - r2), 0.0) / kF;
  float h = max(r1, r2) + qF * qF * kF * 0.25;
  float xa = a < PD * 0.5 ? a : a - PD;
  float l1 = xa * TT, l2 = -xa * CT;
  float kN = 0.03, qN = max(kN - abs(l1 - l2), 0.0) / kN;
  if (abs(xa) < 0.03) h = min(h, min(l1, l2) - qN * qN * kN * 0.25);   // bullnose
  float riser = 1.0 - smoothstep(ar - PX, ar + PX, a);
  float jx1 = hf(ivec2(ji, 0), 3u) * 1.92;
  bool two = hf(ivec2(ji, 1), 3u) > 0.4;
  float span = 0.82 + 0.28 * hf(ivec2(ji, 2), 3u);
  float sx = mod(P.x - jx1, 1.92);
  float dj = two ? min(min(sx, 1.92 - sx), abs(sx - span)) : min(sx, 1.92 - sx);
  vec2 pj = edgeProf(dj, 0.0016, 0.004, 0.0014, 0.005);
  int si = two && sx > span ? 1 : 0;
  float t1 = hf(ivec2(ji, si), 5u), t2 = hf(ivec2(ji, si), 7u);
  float mott = n[0], fineN = n[1], grain = n[2], bed = n[3];
  vec4 fc = c[0];
  float fr = fc.x * (1.92 / 120.0);
  float shell = step(0.78, fc.z) * (1.0 - aa(0.0016 + 0.0022 * fract(fc.z * 11.0), fr));
  bool light = fract(fc.z * 3.1) > 0.5;
  float pore = step(0.93, fract(fc.z * 5.7)) * (1.0 - aa(0.0009, fr));
  float ins = smoothstep(0.02 - PX, 0.02 + PX, PD - a) * (1.0 - smoothstep(0.055 - PX, 0.055 + PX, PD - a));
  float grit = step(0.55, fract(fc.z * 13.7 + fc.w));
  float gl = exp(-pow((a - ar - 0.003) / 0.006, 2.0));
  float stain = smoothstep(0.1, 0.7, bed * 0.5 + 0.5 + 0.2 * mott) * exp(-max(a - ar, 0.0) / 0.035) * (1.0 - riser);
  vec4 cc = c[1];
  float chip = step(0.8, cc.z) * (1.0 - aa(0.01 + 0.012 * fract(cc.z * 13.0), cc.x * (1.92 / 24.0) + 0.004 * fineN)) * (1.0 - smoothstep(0.004, 0.02, abs(xa)));
  float tone = 0.8 * (1.0 + 0.1 * (t1 - 0.5)) * (1.0 + 0.05 * mott + 0.03 * fineN + 0.025 * grain) * (1.0 + 0.035 * bed);
  tone *= (1.0 - 0.13 * riser) * (1.0 - 0.5 * gl) * (1.0 - 0.12 * stain) * (1.0 + 0.08 * chip);
  tone *= 1.0 + shell * (light ? 0.12 : -0.22) - 0.3 * pore;
  vec3 own = vec3(0.0); float cov = 1.0;
  float hk = 0.16 * abs(t2 - 0.5) * 2.0;
  vec3 hc = (t2 > 0.5 ? lin(vec3(0.84, 0.78, 0.66)) : lin(vec3(0.7, 0.71, 0.7))) * (tone / 0.8);
  own = mix(own, hc, hk); cov *= 1.0 - hk;
  vec3 insC = lin(vec3(0.17, 0.17, 0.18)) * (1.0 + 0.5 * (grit - 0.5)) * (1.0 + 0.1 * mott);
  own = mix(own, insC, ins); cov *= 1.0 - ins;
  own = mix(own, lin(vec3(0.38, 0.37, 0.35)) * (1.0 + 0.1 * grain), pj.y); cov *= 1.0 - pj.y;
  s.alb = own; s.a = cov * tone;
  s.h = h + pj.x + (0.00012 * grain + 0.00008 * fineN - 0.0006 * ins - 0.0025 * chip - 0.0004 * pore) * (1.0 - pj.y);
  s.rough = mix(mix(0.64 + 0.05 * fineN + 0.06 * riser + 0.08 * chip, 0.93, ins), 0.9, pj.y);
  s.cav = (1.0 - 0.3 * gl) * mix(1.0, 0.6, pj.y) * (1.0 - 0.3 * pore);` }, { group: 2, name: "rampboard", detail: 0.35, scale: 1.6, stair: [0.4, 4, 0.45, 3], tint: false, alpha: false, mode: oN, sym: 1, hr: [-0.022, 0.03], ao: 0.3, prep: `float bw = 1.6 / 7.0; int bi = int(floor(P.x / bw)); float lx = P.x - float(bi) * bw;
  f[0] = Req(vec2(lx * 28.0 + float(bi) * 13.1, uv.y * 6.0), ivec2(4096, 6), 3, 0.5, 1101u);
  f[1] = FB(uv, ivec2(5), 4, 0.5, 1103u);
  f[2] = Req(vec2(lx * 90.0 + float(bi) * 7.3, uv.y * 40.0), ivec2(4096, 40), 2, 0.5, 1109u);
  f[3] = FB(uv, ivec2(8, 4), 3, 0.5, 1117u);
  w[0] = WO(uv, ivec2(7, 12), 1.0, 1123u);`, surf: `
  // scaffold-board ramp (tug ramp): seven 229 mm boards across the repeat running down the slope, 8 mm gaps, one
  // staggered butt joint per board with galvanised hoop-iron end bands, nailed cross cleats (50 x 28 mm) every 0.4 m
  // along the slope (centred between the fitted lines), grit banked on the uphill side of each cleat, weathered
  // grey-brown timber with grain along the boards, knots. Own colours.
  const float BW = 1.6 / 7.0, PD = 0.4;
  int bi = int(floor(P.x / BW));
  float lx = P.x - float(bi) * BW;
  float eS = min(lx, BW - lx);
  vec2 ps = edgeProf(eS, 0.004, 0.006, 0.002, 0.022);
  float b1 = hf(ivec2(bi, 0), 3u), b2 = hf(ivec2(bi, 1), 3u), b3 = hf(ivec2(bi, 2), 3u);
  float eE = jd(P.y - b1 * 1.6, 1.6);
  vec2 pe = edgeProf(eE, 0.002, 0.004, 0.0015, 0.018);
  float cy = P.y - (floor(P.y / PD) + 0.5) * PD;   // from the cleat centre line (v grows downhill)
  float ce = 0.025 - abs(cy);
  float cl = smoothstep(-PX, PX, ce);
  float hCl = 0.028 * sqrt(max(1.0 - pow(1.0 - clamp(ce / 0.007, 0.0, 1.0), 2.0), 0.0));
  float gap = max(ps.y, pe.y) * (1.0 - cl);
  float band = smoothstep(0.018 - PX, 0.018 + PX, eE) * (1.0 - smoothstep(0.043 - PX, 0.043 + PX, eE)) * (1.0 - ps.y) * (1.0 - cl);
  float nd = length(vec2(min(abs(lx - 0.05), abs(lx - (BW - 0.05))), cy));
  float nail = (1.0 - aa(0.0045, nd)) * cl;
  float bnail = (1.0 - aa(0.004, length(vec2(lx - BW * 0.5, eE - 0.0305)))) * band;
  float dirt = smoothstep(0.02, 0.03, -cy) * (1.0 - smoothstep(0.035, 0.08 + 0.03 * n[3], -cy)) * smoothstep(-0.3, 0.4, n[3]) * (1.0 - cl);
  float streak = n[0], blot = n[1], fib = n[2];
  vec3 wa = lin(vec3(0.6, 0.5, 0.39)), wb = lin(vec3(0.5, 0.43, 0.35)), wc = lin(vec3(0.66, 0.57, 0.46));
  vec3 wood = mix(mix(wa, wb, b2), wc, step(0.62, b3) * 0.7) * (0.84 + 0.28 * b1);
  wood *= 1.0 + 0.14 * streak + 0.05 * fib;
  vec3 grey = lin(vec3(0.52, 0.51, 0.48)) * (1.0 + 0.12 * streak);
  wood = mix(wood, grey, clamp(0.3 + 0.35 * smoothstep(-0.4, 0.6, blot) + 0.2 * (b3 - 0.5), 0.0, 0.85));
  vec4 kc = c[0];
  float knot = step(0.86, kc.z) * (1.0 - smoothstep(0.1, 0.22, kc.x));
  wood = mix(wood, lin(vec3(0.28, 0.2, 0.14)), knot * 0.7);
  wood *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.03, eE - 0.002));
  vec3 cleatC = lin(vec3(0.44, 0.36, 0.28)) * (0.9 + 0.2 * hf(ivec2(int(floor(P.y / PD)), 5), 9u)) * (1.0 + 0.1 * streak);
  cleatC = mix(cleatC, grey * 0.9, 0.25);
  vec3 col = mix(wood, cleatC, cl);
  col = mix(col, lin(vec3(0.3, 0.26, 0.21)) * (1.0 + 0.2 * blot), dirt * 0.7);
  col = mix(col, lin(vec3(0.5, 0.52, 0.54)) * (1.0 + 0.1 * fib), band);
  col = mix(col, lin(vec3(0.38, 0.38, 0.39)), max(nail, bnail));
  col = mix(col, lin(vec3(0.06, 0.05, 0.045)), gap);
  float hB = min(ps.x, pe.x) + (0.0004 * streak + 0.0002 * fib) * (1.0 - max(ps.y, pe.y)) + 0.0008 * band;
  s.alb = col;
  s.h = mix(hB, max(hB, hCl), cl) + 0.0004 * max(nail, bnail);
  s.rough = mix(mix(mix(mix(0.78 + 0.08 * fib, 0.82, cl), 0.9, dirt * 0.7), 0.5, band), 0.95, gap);
  s.rough = mix(s.rough, 0.4, max(nail, bnail));
  s.metal = 0.7 * band + 0.8 * max(nail, bnail);
  s.cav = mix(1.0, 0.35, gap) * (1.0 - 0.15 * dirt) * (1.0 - 0.55 * exp(-pow((ce + 0.003) / 0.005, 2.0)) * (1.0 - cl));` }, { group: 2, name: "gangdeck", detail: 0.3, scale: 1.2, stair: [0.3, 4, 0.4, 4], tint: false, alpha: false, mode: oN, sym: 1, hr: [-4e-3, 0.02], ao: 0.3, prep: `f[0] = FB(uv, ivec2(40, 3), 3, 0.5, 1201u); f[1] = FB(uv, ivec2(5), 4, 0.5, 1203u); f[2] = FB(uv, ivec2(24), 3, 0.5, 1207u);
  w[0] = WO(uv, ivec2(12), 0.9, 1213u);`, surf: `
  // aluminium gangway decking: extruded planks (8 x 150 mm across the repeat) running down the slope with ten rounded
  // ribs each, bolted cross cleats (35 x 18 mm) every 0.3 m along the slope (centred between the fitted lines),
  // mill-finish streaks, dull oxidised patches, black rubber scuffs, polished cleat tops, a few dents. Own colours.
  const float PW = 0.15, PD = 0.3;
  int pk = int(floor(P.x / PW));
  float lx = P.x - float(pk) * PW;
  float eS = min(lx, PW - lx);
  vec2 ps = edgeProf(eS, 0.001, 0.003, 0.001, 0.004);
  float rib = pow(0.5 + 0.5 * cos(TAU * (lx - 0.0075) / 0.015), 3.0) * smoothstep(0.004, 0.009, eS);
  float cy = P.y - (floor(P.y / PD) + 0.5) * PD;
  float ce = 0.0175 - abs(cy);
  float cl = smoothstep(-PX, PX, ce);
  float hCl = 0.018 * sqrt(max(1.0 - pow(1.0 - clamp(ce / 0.005, 0.0, 1.0), 2.0), 0.0));
  float bd = length(vec2(lx - PW * 0.5, cy));
  float bolt = (1.0 - aa(0.0065, bd)) * cl;
  float bdome = sqrt(max(1.0 - pow(bd / 0.0065, 2.0), 0.0));
  float strk = n[0], ox = smoothstep(0.1, 0.7, n[1]), sc = n[2];
  vec4 wc = c[0];
  float scuff = step(0.82, wc.z) * (1.0 - smoothstep(0.05, 0.3, abs(wc.x - 0.25) + 0.5 * abs(sc))) * smoothstep(0.2, 0.6, strk * 0.5 + 0.5) * (0.5 + 0.5 * cl);
  float dent = step(0.93, fract(wc.z * 7.1)) * (1.0 - smoothstep(0.0, 0.25, wc.x));
  vec3 al = lin(vec3(0.72, 0.73, 0.74)) * (1.0 + 0.05 * strk + 0.02 * sc);
  al = mix(al, lin(vec3(0.77, 0.78, 0.78)), ox * 0.4);
  float pol = cl * smoothstep(0.004, 0.012, ce) * smoothstep(-0.2, 0.5, sc);
  al = mix(al, lin(vec3(0.82, 0.83, 0.85)), pol * 0.5);
  vec3 col = mix(al, lin(vec3(0.07, 0.07, 0.075)), scuff * 0.8);
  col = mix(col, lin(vec3(0.5, 0.51, 0.52)), bolt);
  col *= 1.0 - 0.5 * ps.y * (1.0 - cl);
  float hD = ps.x + 0.0009 * rib - 0.0015 * dent;
  s.alb = col;
  s.h = mix(hD, max(hD, hCl), cl) + 0.002 * bolt * bdome;
  s.rough = mix(0.48 + 0.05 * strk + 0.16 * ox - 0.14 * pol, 0.75, scuff * 0.8);
  s.metal = (0.42 + 0.3 * pol) * (1.0 - scuff * 0.8);
  s.cav = mix(1.0, 0.55, ps.y * (1.0 - cl)) * (1.0 - 0.2 * (1.0 - rib) * (1.0 - cl)) * (1.0 - 0.3 * exp(-pow((ce + 0.0015) / 0.002, 2.0)));` }, { name: "detail", detail: 0, scale: 0.5, tint: true, alpha: false, mode: ng, sym: 0, hr: [-3e-4, 2e-4], ao: 0, prep: `f[0] = FB(uv, ivec2(24), 3, 0.5, 3u); f[1] = FB(uv, ivec2(96), 2, 0.5, 5u);
  w[0] = WO(uv, ivec2(150), 1.0, 7u); w[1] = WO(uv, ivec2(40), 0.9, 9u);`, surf: `
  vec4 g = c[0];                                   // ~3 mm grains
  float grain = smoothstep(0.05, 0.3, g.y - g.x);
  float tone = fract(g.z * 7.31) - 0.5;
  float pit = step(0.93, c[1].z) * (1.0 - smoothstep(0.0007, 0.0007 + 2.0 * PX, c[1].x * (0.5 / 40.0)));
  float m = 1.0 + 0.14 * tone * grain + 0.06 * n[0] + 0.035 * n[1] - 0.16 * pit;
  s.alb = vec3(0.5 * m);
  s.h = 0.0002 * grain * (1.0 - g.x * g.x) + 0.00006 * n[1] - 0.00025 * pit;
  s.rough = 0.5 + 0.05 * n[0] + 0.04 * tone * grain;` }, { name: "gel", detail: 0, scale: 1, tint: true, alpha: false, mode: ng, sym: 0, hr: [-6e-3, 6e-3], ao: 0, prep: "f[0] = FB(uv, ivec2(4), 3, 0.45, 91u); f[1] = FB(uv, ivec2(12), 2, 0.5, 97u); w[0] = WO(uv, ivec2(7), 1.0, 101u);", surf: `
  vec4 wc = c[0];
  float dimple = (1.0 - smoothstep(0.0, 0.22, wc.x)) * step(0.6, wc.z);
  s.h = 0.0034 * n[0] + 0.0009 * n[1] - 0.0012 * dimple * dimple;
  s.alb = vec3(0.5);
  s.rough = 0.5;` }];
for (const j of wx) $T.push({ ...j.mat, name: j.name, group: j.group });
const U7 = `
// ---- INKWAVE texlib (see src/world/texlib.js header for the API) ----
#ifndef TEXLIB_INCLUDED
#define TEXLIB_INCLUDED
#define TEXLIB_PLAIN 0
#define TEXLIB_GRID 1
#define TEXLIB_HEX 2
#ifndef TEXLIB_HEX_SCALE
#define TEXLIB_HEX_SCALE 0.5
#endif
struct TexlibSample { vec4 albedo; vec3 normal; vec4 orm; };

uint texlib_pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
uint texlib_hash(ivec2 p) { return texlib_pcg(uint(p.x) + texlib_pcg(uint(p.y) + 0x9e3779b9u)); }
float texlib_h01(uint h) { return float(h >> 8u) * (1.0 / 16777216.0); }

void texlib_triGrid(vec2 st, out vec3 w, out ivec2 v1, out ivec2 v2, out ivec2 v3) {
  st *= 3.46410162;
  vec2 sk = mat2(1.0, 0.0, -0.57735027, 1.15470054) * st;
  ivec2 b = ivec2(floor(sk));
  vec3 t = vec3(fract(sk), 0.0); t.z = 1.0 - t.x - t.y;
  float s = step(0.0, -t.z), s2 = 2.0 * s - 1.0;
  w = vec3(-t.z * s2, s - t.y * s2, s - t.x * s2);
  int si = int(s);
  v1 = b + ivec2(si, si); v2 = b + ivec2(si, 1 - si); v3 = b + ivec2(1 - si, si);
}
vec2 texlib_hexCentre(ivec2 v) { return mat2(1.0, 0.0, 0.5, 0.8660254) * vec2(v) / (3.46410162 * TEXLIB_HEX_SCALE); }
mat2 texlib_rot(uint h) { float a = texlib_h01(h) * 6.28318531; float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

void texlib_tap(sampler2DArray tA, sampler2DArray tN, sampler2DArray tO, vec2 st, float layer, vec2 gx, vec2 gy, mat2 M,
                out vec4 a, out vec3 n, out float nl, out vec4 o) {
  vec3 p = vec3(st, layer);
  a = textureGrad(tA, p, M * gx, M * gy);
  vec3 nr = textureGrad(tN, p, M * gx, M * gy).xyz * 2.0 - 1.0;
  o = textureGrad(tO, p, M * gx, M * gy);
  nl = length(nr);
  n = vec3(transpose(M) * nr.xy, nr.z);
}

TexlibSample texlibSample(sampler2DArray tA, sampler2DArray tN, sampler2DArray tO, vec2 uv, float layer, int mode, int sym) {
  vec2 gx = dFdx(uv), gy = dFdy(uv);
  // keep the footprint anisotropy within what 16x hardware AF resolves (≤ 12:1): past that, blur instead of alias
  float lx = dot(gx, gx), ly = dot(gy, gy);
  if (lx > ly * 144.0) gy = ly > 1e-20 ? gy * sqrt(lx / (ly * 144.0)) : vec2(-gx.y, gx.x) / 12.0;
  else if (ly > lx * 144.0) gx = lx > 1e-20 ? gx * sqrt(ly / (lx * 144.0)) : vec2(gy.y, -gy.x) / 12.0;
  TexlibSample r;
  vec3 n; float nl;
  if (mode == TEXLIB_HEX) {
    vec3 w; ivec2 v1, v2, v3;
    texlib_triGrid(uv * TEXLIB_HEX_SCALE, w, v1, v2, v3);
    uint h1 = texlib_hash(v1), h2 = texlib_hash(v2), h3 = texlib_hash(v3);
    mat2 R1 = texlib_rot(h1), R2 = texlib_rot(h2), R3 = texlib_rot(h3);
    vec2 c1 = texlib_hexCentre(v1), c2 = texlib_hexCentre(v2), c3 = texlib_hexCentre(v3);
    vec2 o1 = vec2(texlib_h01(texlib_pcg(h1)), texlib_h01(texlib_pcg(h1 + 1u)));
    vec2 o2 = vec2(texlib_h01(texlib_pcg(h2)), texlib_h01(texlib_pcg(h2 + 1u)));
    vec2 o3 = vec2(texlib_h01(texlib_pcg(h3)), texlib_h01(texlib_pcg(h3 + 1u)));
    vec4 a1, a2, a3, q1, q2, q3; vec3 n1, n2, n3; float l1, l2, l3;
    texlib_tap(tA, tN, tO, R1 * (uv - c1) + c1 + o1, layer, gx, gy, R1, a1, n1, l1, q1);
    texlib_tap(tA, tN, tO, R2 * (uv - c2) + c2 + o2, layer, gx, gy, R2, a2, n2, l2, q2);
    texlib_tap(tA, tN, tO, R3 * (uv - c3) + c3 + o3, layer, gx, gy, R3, a3, n3, l3, q3);
    vec3 W = w * w; W *= W; W *= w * w * w;                   // w^7
    W *= mix(vec3(1.0), vec3(q1.a, q2.a, q3.a) + 0.05, 0.6);  // height-aware contrast blend
    W /= max(W.x + W.y + W.z, 1e-6);
    r.albedo = W.x * a1 + W.y * a2 + W.z * a3;
    r.orm = W.x * q1 + W.y * q2 + W.z * q3;
    n = W.x * n1 + W.y * n2 + W.z * n3;
    nl = W.x * l1 + W.y * l2 + W.z * l3;
  } else if (mode == TEXLIB_GRID) {
    uint h = texlib_hash(ivec2(floor(uv))) & uint(sym);
    mat2 M = mat2(1.0);
    if ((h & 4u) != 0u) M = mat2(0.0, 1.0, 1.0, 0.0);
    if ((h & 1u) != 0u) M = mat2(-1.0, 0.0, 0.0, 1.0) * M;
    if ((h & 2u) != 0u) M = mat2(1.0, 0.0, 0.0, -1.0) * M;
    texlib_tap(tA, tN, tO, M * (fract(uv) - 0.5) + 0.5, layer, gx, gy, M, r.albedo, n, nl, r.orm);
  } else {
    texlib_tap(tA, tN, tO, uv, layer, gx, gy, mat2(1.0), r.albedo, n, nl, r.orm);
  }
  // Toksvig: mips average bumps into shorter normals -> widen the lobe instead of sparkling
  float v = max((1.0 - nl) / max(nl, 1e-3) - 0.006, 0.0);
  float a = r.orm.g * r.orm.g;
  r.orm.g = sqrt(sqrt(min(a * a + 2.0 * v, 1.0)));
  r.normal = normalize(vec3(n.xy, max(n.z, 1e-3)));
  return r;
}

mat3 texlibTangentFrame(vec3 eyePos, vec3 surfNormal, vec2 uv) {
  vec3 q0 = dFdx(eyePos), q1 = dFdy(eyePos);
  vec2 st0 = dFdx(uv), st1 = dFdy(uv);
  vec3 N = surfNormal;
  vec3 q1perp = cross(q1, N), q0perp = cross(N, q0);
  vec3 T = q1perp * st0.x + q0perp * st1.x;
  vec3 B = q1perp * st0.y + q0perp * st1.y;
  float det = max(dot(T, T), dot(B, B));
  float sc = det == 0.0 ? 0.0 : inversesqrt(det);
  return mat3(T * sc, B * sc, N);
}
vec3 texlibPerturbNormal(vec3 nTS, vec3 T, vec3 B, vec3 N, float strength) {
  return normalize(T * (nTS.x * strength) + B * (nTS.y * strength) + N * nTS.z);
}
vec3 texlibPerturbNormal(vec3 nTS, mat3 tbn, float strength) {
  return texlibPerturbNormal(nTS, tbn[0], tbn[1], tbn[2], strength);
}

#ifndef TEXLIB_DETAIL_SCALE
#define TEXLIB_DETAIL_SCALE 0.5
#endif
// blends the 'detail' layer into a sample at two rotated scales (no visible period). pMetres = surface coords in
// metres; amount = meta.detail (0 = skip). Albedo x (2 * detail), normal UDN-blended, roughness += delta.
void texlibDetail(inout TexlibSample s, sampler2DArray tA, sampler2DArray tN, sampler2DArray tO, vec2 pMetres, float layer, float amount) {
  vec2 u1 = pMetres / TEXLIB_DETAIL_SCALE;
  vec2 gx = dFdx(u1), gy = dFdy(u1);
  if (amount <= 0.0) return;
  const mat2 R = mat2(0.8660254, 0.5, -0.5, 0.8660254);
  vec2 u2 = R * u1 * 0.61 + vec2(0.37, 0.71);
  vec2 hx = R * gx * 0.61, hy = R * gy * 0.61;
  vec4 a1 = textureGrad(tA, vec3(u1, layer), gx, gy), a2 = textureGrad(tA, vec3(u2, layer), hx, hy);
  vec3 n1 = textureGrad(tN, vec3(u1, layer), gx, gy).xyz * 2.0 - 1.0, n2 = textureGrad(tN, vec3(u2, layer), hx, hy).xyz * 2.0 - 1.0;
  vec4 o1 = textureGrad(tO, vec3(u1, layer), gx, gy), o2 = textureGrad(tO, vec3(u2, layer), hx, hy);
  s.albedo.rgb *= mix(1.0, a1.r + a2.r, amount);
  vec2 dn = (n1.xy + transpose(R) * n2.xy) * 0.7071;
  s.normal = normalize(vec3(s.normal.xy + dn * amount, s.normal.z));
  s.orm.g = clamp(s.orm.g + (o1.g + o2.g - 1.0) * amount, 0.02, 1.0);
}

// screen-space specular AA on the final (perturbed) normal (Tokuyoshi-Kaplanyan / Filament): widens the lobe where
// the normal changes faster than the pixel grid can resolve — kills glints on bevels/rivets at distance.
float texlibSpecularAA(vec3 n, float roughness) {
  vec3 du = dFdx(n), dv = dFdy(n);
  float kernel = min(2.0 * 0.15 * (dot(du, du) + dot(dv, dv)), 0.2);
  float a = roughness * roughness;
  return sqrt(sqrt(clamp(a * a + kernel, 0.0, 1.0)));
}
float texlib_vn(vec2 p) {
  vec2 i = floor(p), f = p - i; vec2 u = f * f * (3.0 - 2.0 * f);
  ivec2 c = ivec2(i);
  float a = texlib_h01(texlib_hash(c)), b = texlib_h01(texlib_hash(c + ivec2(1, 0)));
  float d = texlib_h01(texlib_hash(c + ivec2(0, 1))), e = texlib_h01(texlib_hash(c + ivec2(1, 1)));
  return mix(mix(a, b, u.x), mix(d, e, u.x), u.y);
}
float texlibMacro(vec2 p) {
  float n = 0.62 * texlib_vn(p * 0.085 + 3.7) + 0.38 * texlib_vn(p * 0.29 + 11.3);
  return 0.94 + 0.12 * n;
}
float texlibCoverage(float a, vec2 uv, float texSize) {
  vec2 dx = dFdx(uv) * texSize, dy = dFdy(uv) * texSize;
  float lod = 0.5 * log2(max(max(dot(dx, dx), dot(dy, dy)), 1e-8));
  float sharp = clamp((a - 0.5) / max(fwidth(a), 1e-4) + 0.5, 0.0, 1.0);
  // coverage-preserving: as openings fall below the pixel grid the bars thicken until the grate reads solid
  // (as real grating does at a distance / grazing angle) instead of breaking into dotted, shimmering holes
  float far = clamp(a * (1.0 + 1.6 * max(lod, 0.0)), 0.0, 1.0);
  return mix(sharp, far, smoothstep(-0.5, 0.8, lod));
}
#endif
`;
async function Y7(j, { size: A = 512 } = {}) {
  const M = performance.now(), N = $T.length, I = Math.min(16, j.capabilities.getMaxAnisotropy()), D = new zk(A, A, N, { count: 3, type: zI, format: _j, colorSpace: Tj, wrapS: FN, wrapT: FN, magFilter: aj, minFilter: SN, generateMipmaps: true, anisotropy: I, depthBuffer: false, stencilBuffer: false });
  for (let c = 1; c < 3; c++) {
    const G = new uC(null, A, A, N), r = D.texture;
    for (const t of ["format", "type", "wrapS", "wrapT", "magFilter", "minFilter", "anisotropy", "generateMipmaps", "flipY", "internalFormat"]) G[t] = r[t];
    G.colorSpace = xN, G.isRenderTargetTexture = true, G.renderTarget = D, D.textures[c] = G;
  }
  D.textures[0].name = "texlib.albedo", D.textures[1].name = "texlib.normal", D.textures[2].name = "texlib.orm";
  const T = new FM();
  T.setAttribute("position", new xM([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const w = new uT(-1, 1, 1, -1, 0, 1), O = (c, G) => new Zx({ glslVersion: AE, vertexShader: x7, fragmentShader: c, uniforms: G, depthTest: false, depthWrite: false }), z = { uRes: { value: new jM(A, A) }, uScale: { value: 1 }, uMat: { value: 0 }, uOne: { value: 1 }, uHRange: { value: new jM() }, uAO: { value: 0.5 } }, C = [...new Set($T.map((c) => c.group || 0))].sort((c, G) => c - G).map((c) => $T.map((G, r) => [G, r]).filter(([G]) => (G.group || 0) === c)).filter((c) => c.length), E = C.map((c) => {
    const G = c.map(([t, p]) => `void prep${p}(${L7}) {
  ${t.prep}
}
void surf${p}(${k7}) {${t.surf}
}`).join(`
`), r = (t, p) => c.map(([, f], h) => `${h ? "else " : ""}if (uMat == ${f}) ${t}${f}(${p});`).join(`
  `);
    return O(Q7 + G + i7.replace("PREP_SWITCH", r("prep", "uv, P, f, w")).replace("SURF_SWITCH", r("surf", "uv, P, n, c, s")), z);
  }), P = new Cz(), g = E.map((c) => {
    const G = new GM(T, c);
    return G.frustumCulled = false, P.add(G), G;
  }), Q = new Map(C.flatMap((c, G) => c.map(([, r]) => [r, G])));
  await j.compileAsync(P, w);
  const x = performance.now(), U = j.getRenderTarget(), k = j.autoClear, s = j.xr.enabled;
  j.autoClear = false, j.xr.enabled = false, j.initRenderTarget(D);
  for (const c of D.textures) c.generateMipmaps = false;
  for (let c = 0; c < N; c++) {
    const G = $T[c];
    if (g.forEach((r, t) => {
      r.visible = t === Q.get(c);
    }), z.uMat.value = c, z.uScale.value = G.scale, z.uHRange.value.set(G.hr[0], G.hr[1]), z.uAO.value = G.ao, c === N - 1) for (const r of D.textures) r.generateMipmaps = true;
    j.setRenderTarget(D, c), j.render(P, w);
  }
  j.readRenderTargetPixels(D, 0, 0, 1, 1, new Uint8Array(4), void 0, 2), j.setRenderTarget(U), j.autoClear = k, j.xr.enabled = s, E.forEach((c) => c.dispose()), T.dispose();
  const v = {}, S = {};
  $T.forEach((c, G) => {
    v[c.name] = G, S[c.name] = { scale: c.scale, tint: c.tint, mask: !!c.mask, stair: c.stair || null, alpha: c.alpha, mode: c.mode, sym: c.sym, detail: c.detail, depth: +(c.hr[1] - c.hr[0]).toFixed(4) };
  });
  const q = performance.now();
  return { albedo: D.textures[0], normal: D.textures[1], orm: D.textures[2], layers: v, meta: S, names: $T.map((c) => c.name), size: A, stats: { ms: +(q - M).toFixed(1), compileMs: +(x - M).toFixed(1), size: A }, dispose() {
    D.dispose();
  } };
}
const dI = 2048, iO = 256, Dw = 2048, Ez = "#27304d", sw = "#ec7a6b", aQ = "#3fa8a2", qO = "#eec35c", FD = "#fbf5e8", c7 = "#7cc6e6", ky = { deck: 4, cabinSide: 5, cabinEnd: 6 }, Zg = { x: 0, y: 1040, w: 2048, h: 640, m: [32, 10] }, AL = { x: 0, y: 1696, w: 1248, h: 240, m: [13, 2.5] }, ML = { x: 1264, y: 1696, w: 557, h: 240, m: [5.8, 2.5] }, rD = { x: 0, y: 1040, w: 2048, h: 1008 }, Ox = { halyard: (j) => (r7(j, Zg), p7(j, AL), e7(j, ML), [{ id: ky.deck, ...Zg, place: [0, Zg.m[0], 0, Zg.m[1]], fx: [1, 1] }, { id: ky.cabinSide, ...AL, fx: [0.85, 1] }, { id: ky.cabinEnd, ...ML, fx: [0.85, 1] }]) };
for (const [j, A] of Object.entries(AP)) A.drawMurals && (Ox[j] = A.drawMurals);
async function s7(j = "halyard") {
  try {
    await Promise.all([document.fonts.load('120px "Titan One"'), document.fonts.load("800 100px Rubik")]);
  } catch {
  }
  const A = document.createElement("canvas");
  A.width = dI, A.height = Dw;
  const M = A.getContext("2d");
  M.clearRect(0, 0, dI, Dw);
  const N = (z) => `${z}px "Titan One", "Arial Black", sans-serif`, I = (z) => `800 ${z}px Rubik, "Arial Black", sans-serif`;
  o7(M, 0, N), u7(M, iO), v7(M, iO * 2, N), S7(M, iO * 3, N);
  const D = new mw(A);
  D.colorSpace = Tj, D.anisotropy = 8, D.wrapS = FN, D.generateMipmaps = true, D.minFilter = SN;
  const T = (z) => [z.x / dI, z.w / dI, 1 - (z.y + z.h) / Dw, z.h / Dw], w = { font: N, fontB: I, NAVY: Ez, CORAL: sw, TEAL: aQ, MUSTARD: qO, CREAM: FD, SKY: c7, squid: pQ, blob: P4 };
  let O = null;
  return D.userData.setStage = (z) => {
    if (z === O) return;
    O = z, M.clearRect(rD.x, rD.y, rD.w, rD.h);
    const C = [0, 1, 2, 3].map((P) => ({ rect: [0, 1, 1 - (P + 1) * iO / Dw, iO / Dw], place: [0, -8, 0, 0], fx: [0, 0] }));
    let E = [];
    try {
      M.save(), M.beginPath(), M.rect(rD.x, rD.y, rD.w, rD.h), M.clip(), E = Ox[z] && Ox[z](M, { ...rD }, w) || [];
    } catch (P) {
      console.error("[inkwave] stage murals failed", z, P);
    } finally {
      M.restore();
    }
    for (const P of E) {
      if (!(P.id >= 4 && P.id <= 11)) {
        console.warn("[inkwave] mural id out of range (4…11)", z, P.id);
        continue;
      }
      C[P.id] = { rect: T(P), place: P.place || [0, P.m[0], 0, P.m[1]], fx: P.fx || [0.85, 1] };
    }
    D.userData.murals = C, D.needsUpdate = true;
  }, D.userData.setStage(j), D;
}
function P4(j, A, M, N, I, D) {
  j.fillStyle = D, j.beginPath();
  for (let T = 0; T <= 48; T++) {
    const w = T / 48 * Math.PI * 2, O = N * (1 + 0.12 * Math.sin(w * 3 + I) + 0.08 * Math.sin(w * 7 + I * 2)), z = A + Math.cos(w) * O, C = M + Math.sin(w) * O;
    T === 0 ? j.moveTo(z, C) : j.lineTo(z, C);
  }
  j.fill();
}
function pQ(j, A, M, N, I, D = FD) {
  j.save(), j.translate(A, M), j.scale(N, N), j.fillStyle = I, j.beginPath(), j.moveTo(0, -60), j.bezierCurveTo(34, -40, 34, 10, 26, 22), j.lineTo(-26, 22), j.bezierCurveTo(-34, 10, -34, -40, 0, -60), j.fill(), j.beginPath(), j.moveTo(-18, -44), j.lineTo(-46, -30), j.lineTo(-22, -22), j.fill(), j.beginPath(), j.moveTo(18, -44), j.lineTo(46, -30), j.lineTo(22, -22), j.fill();
  for (let T = 0; T < 5; T++) j.beginPath(), j.ellipse(-20 + T * 10, 34, 5, 14, (T - 2) * 0.15, 0, Math.PI * 2), j.fill();
  j.fillStyle = D, j.beginPath(), j.ellipse(-10, 2, 7, 9, 0, 0, Math.PI * 2), j.ellipse(10, 2, 7, 9, 0, 0, Math.PI * 2), j.fill(), j.fillStyle = Ez, j.beginPath(), j.arc(-9, 4, 3.5, 0, Math.PI * 2), j.arc(11, 4, 3.5, 0, Math.PI * 2), j.fill(), j.restore();
}
function o7(j, A, M) {
  j.save(), j.translate(0, A), j.fillStyle = Ez, j.fillRect(0, 150, dI, 70), j.fillStyle = qO, j.fillRect(0, 150, dI, 10), j.fillStyle = sw, j.fillRect(0, 214, dI, 8);
  for (let N = 0; N < 2; N++) {
    const I = N * 1024;
    P4(j, I + 170, 120, 88, 1 + N, aQ), pQ(j, I + 170, 128, 1.25, FD, Ez), j.font = M(150), j.textBaseline = "alphabetic", j.lineJoin = "round", j.lineWidth = 22, j.strokeStyle = FD, j.strokeText("INKWAVE", I + 300, 186), j.fillStyle = Ez, j.fillText("INKWAVE", I + 300, 186), j.fillStyle = sw, j.fillText("INKWAVE", I + 294, 180), j.font = M(34), j.fillStyle = FD, j.fillText("TURF RIOT  •  TIDEWATER PLAZA", I + 320, 207), P4(j, I + 960, 70, 26, 5 + N, qO), P4(j, I + 925, 110, 12, 7 + N, qO);
  }
  j.restore();
}
function u7(j, A, M) {
  j.save(), j.translate(0, A), j.fillStyle = aQ, j.fillRect(0, 60, dI, 140), j.fillStyle = FD;
  for (let N = 0; N < dI; N += 128) j.beginPath(), j.moveTo(N + 20, 80), j.lineTo(N + 70, 80), j.lineTo(N + 110, 130), j.lineTo(N + 70, 180), j.lineTo(N + 20, 180), j.lineTo(N + 60, 130), j.closePath(), j.fill();
  j.fillStyle = Ez, j.fillRect(0, 60, dI, 8), j.fillRect(0, 192, dI, 8), j.restore();
}
function v7(j, A, M) {
  j.save(), j.translate(0, A);
  for (let N = 0; N < 2; N++) {
    const I = N * 1024;
    j.fillStyle = sw, jL(j, I + 40, 30, 944, 150, 40), j.fill(), j.fillStyle = FD, jL(j, I + 54, 44, 916, 122, 30), j.fill(), j.font = M(92), j.fillStyle = Ez, j.textBaseline = "middle", j.fillText("TIDE SNACKS", I + 250, 108), j.fillStyle = qO, j.beginPath(), j.moveTo(I + 140, 150), j.lineTo(I + 110, 90), j.lineTo(I + 170, 90), j.closePath(), j.fill(), pQ(j, I + 140, 86, 0.7, sw, FD);
    for (let D = 0; D < 1024; D += 64) j.fillStyle = D / 64 % 2 ? FD : sw, j.beginPath(), j.arc(I + D + 32, 212, 30, 0, Math.PI), j.fill();
  }
  j.restore();
}
function S7(j, A, M) {
  j.save(), j.translate(0, A);
  for (let N = 0; N < 2; N++) {
    const I = N * 1024;
    j.font = M(110), j.textBaseline = "middle", j.fillStyle = "rgba(251,245,232,0.92)", j.fillText("KRAKEN", I + 140, 110), j.font = M(44), j.fillText("LINES  ~  SEA FREIGHT", I + 150, 190), j.strokeStyle = "rgba(251,245,232,0.92)", j.lineWidth = 16, j.lineCap = "round", j.beginPath(), j.moveTo(I + 40, 140), j.bezierCurveTo(I + 70, 60, I + 120, 200, I + 110, 70), j.stroke(), j.beginPath(), j.arc(I + 105, 64, 12, 0, Math.PI * 2), j.stroke();
  }
  j.restore();
}
function jL(j, A, M, N, I, D) {
  j.beginPath(), j.moveTo(A + D, M), j.arcTo(A + N, M, A + N, M + I, D), j.arcTo(A + N, M + I, A, M + I, D), j.arcTo(A, M + I, A, M, D), j.arcTo(A, M, A + N, M, D), j.closePath();
}
const gD = { navy: "#2f3a57", teal: "#3f9f97", white: "#f1ede4", coral: "#df7c66" };
function B7(j) {
  let A = j >>> 0;
  return () => {
    A = A + 1831565813 | 0;
    let M = Math.imul(A ^ A >>> 15, 1 | A);
    return M = M + Math.imul(M ^ M >>> 7, 61 | M) ^ M, ((M ^ M >>> 14) >>> 0) / 4294967296;
  };
}
function eQ(j, A, { flecks: M = 2600, fleck: N = [0.6, 2.4], scuffs: I = 60, scuff: D = [6, 22], strokes: T = [], seed: w = 1 } = {}) {
  const O = B7(w);
  j.save(), j.beginPath(), j.rect(A.x, A.y, A.w, A.h), j.clip(), j.globalCompositeOperation = "destination-out";
  for (let z = 0; z < M; z++) {
    const C = A.x + O() * A.w, E = A.y + O() * A.h, P = N[0] + O() * O() * (N[1] - N[0]);
    j.fillStyle = `rgba(0,0,0,${0.35 + 0.65 * O()})`, j.beginPath(), j.ellipse(C, E, P * (0.6 + O()), P * (0.6 + O()), O() * Math.PI, 0, Math.PI * 2), j.fill();
  }
  for (let z = 0; z < I; z++) {
    const C = A.x + O() * A.w, E = A.y + O() * A.h, P = D[0] + O() * (D[1] - D[0]), g = j.createRadialGradient(C, E, 0, C, E, P);
    g.addColorStop(0, `rgba(0,0,0,${0.25 + 0.3 * O()})`), g.addColorStop(1, "rgba(0,0,0,0)"), j.fillStyle = g, j.fillRect(C - P, E - P, P * 2, P * 2);
  }
  for (const z of T) {
    j.strokeStyle = `rgba(0,0,0,${z.a})`, j.lineWidth = z.w, j.lineCap = "round", j.beginPath(), j.moveTo(z.p[0][0], z.p[0][1]);
    for (const C of z.p.slice(1)) j.lineTo(C[0], C[1]);
    j.stroke();
  }
  j.restore();
}
function EE(j, A, M, N, I, D, { weight: T = 800, spacing: w = 0.08, align: O = "center", family: z = "Rubik" } = {}) {
  j.save(), j.translate(M, N), j.scale(I / 100, I / 100), j.font = `${T} 138px ${z}, "Arial Black", sans-serif`, j.textBaseline = "alphabetic", j.fillStyle = D, "letterSpacing" in j && (j.letterSpacing = `${w * 100}px`);
  const C = j.measureText(A).width;
  j.fillText(A, O === "center" ? -C / 2 : 0, 50), j.restore();
}
function r7(j, A) {
  const M = A.w / A.m[0], N = (z) => j.setTransform(-M * z, 0, 0, -M * z, A.x + A.w / 2, A.y + A.h / 2), I = "rgba(241,237,228,0.8)", D = "rgba(226,182,76,0.85)", T = "rgba(30,32,36,0.12)";
  j.save(), j.beginPath(), j.rect(A.x, A.y, A.w, A.h), j.clip();
  for (const z of [1, -1]) {
    N(z), j.fillStyle = T;
    for (const C of [-2.9, 0, 2.9]) for (const E of [-0.8, 0.8]) j.fillRect(6.6, C + E - 0.14, 9.4, 0.28);
    j.fillStyle = D;
    for (const C of [-4.3, 4.3]) j.fillRect(0, C - 0.05, 15.55, 0.1);
    j.fillStyle = I;
    for (const C of [-1.45, 1.45]) for (let E = 7.7; E < 15.4; E += 2.4) j.fillRect(E, C - 0.055, Math.min(1.4, 15.4 - E), 0.11);
    j.fillRect(7.45, -0.8, 0.12, 5.05), NL(j, 9.1, 0, 1.9, I), NL(j, 13.75, 2.9, 1.7, I), IL(j, 12.7, -2.95, 14.05, -0.85, D), IL(j, 14.95, -4.6, 15.95, -2.6, D), j.save(), j.translate(13.38, -1.9), j.rotate(-Math.PI / 2), EE(j, "KEEP CLEAR", 0, 0, 0.19, "rgba(241,237,228,0.85)", { spacing: 0.1 }), j.restore();
    for (const [C, E] of [[0, "2"], [2.9, "3"]]) j.save(), j.translate(15.15, C), j.rotate(-Math.PI / 2), EE(j, E, 0, 0, 0.5, I), j.restore();
    a7(j, -1.8, -5, 1.8, -4.62);
    for (const C of [7.5, 10.5, 13.5]) {
      const E = j.createLinearGradient(0, -4.62, 0, -4.1);
      E.addColorStop(0, "rgba(120,62,34,0.35)"), E.addColorStop(1, "rgba(120,62,34,0)"), j.fillStyle = E, j.beginPath(), j.ellipse(C + 0.05, -4.6, 0.32, 0.45, 0, 0, Math.PI), j.fill();
    }
  }
  j.setTransform(1, 0, 0, 1, 0, 0), j.restore();
  const w = (z, C, E) => [A.x + A.w / 2 - M * z * E, A.y + A.h / 2 - M * C * E], O = [];
  for (const z of [1, -1]) for (const C of [-2.9, 0, 2.9]) for (const E of [-0.8, 0.8]) O.push({ w: M * 0.22, a: 0.3, p: [w(6.6, C + E, z), w(16, C + E, z)] });
  eQ(j, A, { flecks: 5200, fleck: [0.6, 2.6], scuffs: 140, scuff: [8, 30], strokes: O, seed: 7 });
}
function NL(j, A, M, N, I) {
  j.fillStyle = I, j.beginPath(), j.moveTo(A, M - 0.32 / 2), j.lineTo(A + N - 0.62, M - 0.32 / 2), j.lineTo(A + N - 0.62, M - 0.78 / 2), j.lineTo(A + N, M), j.lineTo(A + N - 0.62, M + 0.78 / 2), j.lineTo(A + N - 0.62, M + 0.32 / 2), j.lineTo(A, M + 0.32 / 2), j.closePath(), j.fill();
}
function IL(j, A, M, N, I, D) {
  j.save(), j.beginPath(), j.rect(A, M, N - A, I - M), j.clip(), j.strokeStyle = D, j.lineWidth = 0.12;
  for (let T = -Math.abs(I - M) - 1; T < N - A + 1; T += 0.42) j.beginPath(), j.moveTo(A + T, M), j.lineTo(A + T + (I - M), I), j.stroke();
  j.restore(), j.strokeStyle = D, j.lineWidth = 0.1, j.strokeRect(A + 0.05, M + 0.05, N - A - 0.1, I - M - 0.1);
}
function a7(j, A, M, N, I) {
  j.save(), j.beginPath(), j.rect(A, M, N - A, I - M), j.clip(), j.fillStyle = "rgba(226,182,76,0.9)", j.fillRect(A, M, N - A, I - M), j.fillStyle = "rgba(42,44,49,0.9)";
  for (let D = A - 1; D < N + 1; D += 0.36) j.beginPath(), j.moveTo(D, M), j.lineTo(D + 0.18, M), j.lineTo(D + 0.18 + (I - M), I), j.lineTo(D + (I - M), I), j.closePath(), j.fill();
  j.restore();
}
function sU(j, A) {
  j.fillStyle = gD.teal, j.beginPath(), j.arc(0, 0, A, 0, Math.PI * 2), j.fill(), j.strokeStyle = gD.white, j.lineWidth = A * 0.11, j.beginPath(), j.arc(0, 0, A * 0.86, 0, Math.PI * 2), j.stroke(), j.fillStyle = gD.white, j.beginPath(), j.moveTo(-A * 0.06, -A * 0.62), j.lineTo(-A * 0.06, A * 0.12), j.lineTo(-A * 0.5, A * 0.12), j.closePath(), j.fill(), j.beginPath(), j.moveTo(A * 0.04, -A * 0.52), j.quadraticCurveTo(A * 0.46, -A * 0.1, A * 0.42, A * 0.12), j.lineTo(A * 0.04, A * 0.12), j.closePath(), j.fill(), j.lineWidth = A * 0.1, j.lineCap = "round", j.strokeStyle = gD.white;
  for (const [M, N] of [[A * 0.3, 1], [A * 0.52, 0.8]]) {
    j.beginPath();
    for (let I = 0; I <= 24; I++) {
      const D = -A * 0.56 + I / 24 * A * 1.12, T = M + Math.sin(I / 24 * Math.PI * 3) * A * 0.06 * N;
      I ? j.lineTo(D, T) : j.moveTo(D, T);
    }
    j.stroke();
  }
}
function oU(j, A, M, N) {
  const I = (D) => 0.74 + 0.07 * Math.sin((D + N) * 1.1) + 0.03 * Math.sin((D + N) * 2.7 + 1.3);
  j.fillStyle = gD.navy, j.fillRect(A, 0, M - A, 0.62), j.fillStyle = gD.teal, j.beginPath(), j.moveTo(A, 0.5);
  for (let D = A; D <= M + 1e-3; D += 0.05) j.lineTo(D, I(D));
  j.lineTo(M, 0.5), j.closePath(), j.fill(), j.strokeStyle = gD.white, j.lineWidth = 0.035, j.beginPath();
  for (let D = A; D <= M + 1e-3; D += 0.05) {
    const T = I(D) + 0.05;
    D === A ? j.moveTo(D, T) : j.lineTo(D, T);
  }
  j.stroke(), j.fillStyle = gD.coral, j.fillRect(A, 0.955, M - A, 0.03);
}
function uU(j, A) {
  const M = A.w / A.m[0];
  j.setTransform(M, 0, 0, -M, A.x, A.y + A.h);
}
function p7(j, A) {
  j.save(), j.beginPath(), j.rect(A.x, A.y, A.w, A.h), j.clip(), uU(j, A), oU(j, 0, A.m[0], 0), j.save(), j.scale(1, -1), EE(j, "HALYARD", A.m[0] / 2, -0.31, 0.34, gD.white, { family: '"Titan One"', weight: 400, spacing: 0.12 }), j.restore();
  for (const M of [A.m[0] / 2 - 2.35, A.m[0] / 2 + 2.35]) j.save(), j.translate(M, 0.34), j.scale(1, -1), sU(j, 0.25), j.restore();
  j.restore(), eQ(j, A, { flecks: 160, fleck: [0.4, 1.1], scuffs: 22, scuff: [6, 16], seed: 11 });
}
function e7(j, A) {
  j.save(), j.beginPath(), j.rect(A.x, A.y, A.w, A.h), j.clip(), uU(j, A), oU(j, 0, A.m[0], 3.7), j.save(), j.translate(1.9, 1.62), j.scale(1, -1), sU(j, 0.56), j.restore(), j.save(), j.scale(1, -1), EE(j, "HALYARD", 1.9, -0.3, 0.3, gD.white, { family: '"Titan One"', weight: 400, spacing: 0.1 }), j.restore(), j.restore(), eQ(j, A, { flecks: 70, fleck: [0.4, 1.1], scuffs: 10, scuff: [6, 14], seed: 13 });
}
const nN = { renderer: null, scene: null, settings: null, level: null, paint: null, env: null, actors: [] }, Vw = 24;
function H7() {
  return { uInkClock: { value: 0 }, uRip: { value: Array.from({ length: Vw }, () => new qM(0, -999, 0, -99)) }, uRipP: { value: Array.from({ length: Vw }, () => new qM(0, 0.2, 1, 0.01)) } };
}
function f7(j, A) {
  if (!j.uInkClock) return;
  j.uInkClock.value = A.clock || 0;
  const M = A.rip, N = A.ripP;
  if (!M || !N) return;
  const I = j.uRip.value, D = j.uRipP.value;
  for (let T = 0; T < Vw; T++) {
    const w = T * 4;
    I[T].set(M[w], M[w + 1], M[w + 2], M[w + 3]), D[T].set(N[w], N[w + 1], N[w + 2], N[w + 3]);
  }
}
const G7 = `
uniform float uInkClock;
uniform vec4 uRip[${Vw}];
uniform vec4 uRipP[${Vw}];
float gInkKeep = 0.0;      // share of the surface relief that still shows through thin (wall) ink
// Paint lookups use textureGrad with gradients clamped to ≤ 8 texels: trilinear + anisotropic filtering (no shimmer at
// distance) while never reaching mip levels coarse enough to bleed across the 8-texel face padding.
vec2 gPdx = vec2(0.0), gPdy = vec2(0.0);
vec4 paintAt(vec2 uv) { return textureGrad(uPaint, uv, gPdx, gPdy); }
// Close-up reconstruction of the paint atlas with a cubic B-spline (C2: smooth, round ink outlines and a smooth height
// field at any magnification) plus its analytic gradient — 12 bilinear taps inside one 4×4 texel footprint.
void inkBspl(float t, out vec4 w, out vec4 dw) {
  float t2 = t * t, t3 = t2 * t, it = 1.0 - t;
  w = vec4(it * it * it, 3.0 * t3 - 6.0 * t2 + 4.0, -3.0 * t3 + 3.0 * t2 + 3.0 * t + 1.0, t3) * (1.0 / 6.0);
  dw = vec4(-it * it, 3.0 * t2 - 4.0 * t, -3.0 * t2 + 2.0 * t + 1.0, t2) * 0.5;
}
vec4 inkTap(vec2 st) { return textureLod(uPaint, (st + 0.5) / uAtlasSize, 0.0); }
vec4 paintCubic(vec2 uv, out vec4 gX, out vec4 gY) {
  vec2 st = uv * uAtlasSize - 0.5;
  vec2 i = floor(st), f = st - i;
  vec4 wx, dwx, wy, dwy;
  inkBspl(f.x, wx, dwx); inkBspl(f.y, wy, dwy);
  vec2 gx = vec2(wx.x + wx.y, wx.z + wx.w), gy = vec2(wy.x + wy.y, wy.z + wy.w);
  vec2 ox = vec2(-1.0 + wx.y / gx.x, 1.0 + wx.w / gx.y), oy = vec2(-1.0 + wy.y / gy.x, 1.0 + wy.w / gy.y);
  vec2 dgx = vec2(dwx.x + dwx.y, dwx.z + dwx.w), dgy = vec2(dwy.x + dwy.y, dwy.z + dwy.w);
  vec2 dox = vec2(-1.0 + dwx.y / dgx.x, 1.0 + dwx.w / dgx.y), doy = vec2(-1.0 + dwy.y / dgy.x, 1.0 + dwy.w / dgy.y);
  vec4 v = gx.x * (gy.x * inkTap(i + vec2(ox.x, oy.x)) + gy.y * inkTap(i + vec2(ox.x, oy.y)))
         + gx.y * (gy.x * inkTap(i + vec2(ox.y, oy.x)) + gy.y * inkTap(i + vec2(ox.y, oy.y)));
  gX = dgx.x * (gy.x * inkTap(i + vec2(dox.x, oy.x)) + gy.y * inkTap(i + vec2(dox.x, oy.y)))
     + dgx.y * (gy.x * inkTap(i + vec2(dox.y, oy.x)) + gy.y * inkTap(i + vec2(dox.y, oy.y)));
  gY = dgy.x * (gx.x * inkTap(i + vec2(ox.x, doy.x)) + gx.y * inkTap(i + vec2(ox.y, doy.x)))
     + dgy.y * (gx.x * inkTap(i + vec2(ox.x, doy.y)) + gx.y * inkTap(i + vec2(ox.y, doy.y)));
  return v;
}
// Unnormalised Mikkelsen bump: dHdxy is the per-pixel change of a height in metres, so the tilt equals the true
// slope of the ink surface regardless of distance/viewing angle.
vec3 perturbInk(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection) {
  vec3 vSigmaX = dFdx(surf_pos.xyz);
  vec3 vSigmaY = dFdy(surf_pos.xyz);
  vec3 R1 = cross(vSigmaY, surf_norm);
  vec3 R2 = cross(surf_norm, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`, h7 = `
  if (vFaceData.y > 0.5) {
    vec2 pdx = dFdx(vPaintUv), pdy = dFdy(vPaintUv);
    float texFoot = max(length(pdx), length(pdy)) / uTexel;
    float gk = min(1.0, 8.0 / max(texFoot, 1e-4));
    gPdx = pdx * gk; gPdy = pdy * gk;
    vec4 pnt = paintAt(vPaintUv);
    float near = 1.0 - smoothstep(0.9, 2.4, texFoot);
    vec4 gX = vec4(0.0), gY = vec4(0.0);                   // per-texel gradients of all four channels
    vec4 l2 = textureLod(uPaint, vPaintUv, 2.0);
    float seam2 = l2.r / max(l2.a, 1e-3);
    if (near > 0.0 && l2.a > 0.002 && (l2.a < 0.998 || pnt.a < 0.998 || (seam2 > 0.006 && seam2 < 0.994))) {
      vec4 cX, cY;
      vec4 cub = paintCubic(vPaintUv, cX, cY);
      pnt = mix(pnt, cub, near);
      gX = cX * near; gY = cY * near;
    }
    gInkNear = near;
    float amt = pnt.a;
    float fw = fwidth(amt);
    float w = clamp(fw * 0.8, 0.008, 0.25);
    gInk = smoothstep(0.5 - w, 0.5 + w, amt);
    float ia = 1.0 / max(amt, 0.02);
    float tRaw = clamp(pnt.r * ia, 0.0, 1.0);
    // crisp, pixel-anti-aliased colour border between the teams (no muddy mixed-colour fringe)
    float wT = clamp(fwidth(tRaw) * 0.75, 0.012, 0.2);
    float tm = smoothstep(0.5 - wT, 0.5 + wT, tRaw);
    float wet = clamp(pnt.g * ia, 0.0, 1.0);
    float fresh = smoothstep(0.3, 0.97, wet);               // visibly wet for ≈ 4 s after landing
    gFresh = fresh * gInk;
    float tone = clamp(pnt.b * ia, 0.0, 1.0);
    bool wallF = abs(vWNorm.y) < 0.5;
    vec3 Tf = normalize(vFaceTan - vWNorm * dot(vFaceTan, vWNorm)), Bf = cross(vWNorm, Tf);
    // world-space direction toward the sun (the scene's only directional light)
#if NUM_DIR_LIGHTS > 0
    vec3 sunW = normalize((vec4(directionalLights[0].direction, 0.0) * viewMatrix).xyz);
#else
    vec3 sunW = normalize(vec3(-0.41, 0.83, -0.38));
#endif
    vec2 sunF = vec2(dot(sunW, Tf), dot(sunW, Bf));        // sun direction in the face's (u, v) plane
    // thickness profile: 0 at the edge → 1 on the flat top (≈2–3 texels in). Floors pool (tall rounded lip, taller
    // while fresh); walls hold a thinner clinging film that lets the surface relief show through a little.
    float s = clamp((amt - 0.5) * 1.7, 0.0, 1.0);
    float hs = 1.0 - (1.0 - s) * (1.0 - s);
    gInkS = hs;
    float thick = (wallF ? 0.6 : 1.0) * (1.0 + 0.5 * fresh);
    gInkKeep = wallF ? 0.32 * (1.0 - 0.5 * fresh) : 0.0;
    vec2 gradA = vec2(gX.a, gY.a);
    gInkD = gradA * 2.0 * (1.0 - s) * 1.7 * 1.9 * gInk * thick;
    // where the two teams' inks meet: the newer (wetter) ink rides over the older one on a rounded lip; two inks of
    // the same age meet in a soft crease between their rounded edges
    vec2 gT = (vec2(gX.r, gY.r) - tRaw * gradA) * ia;       // d(team share) per texel
    float gTl = length(gT);
    float seam = 0.0, seamShadow = 0.0;
    if (gTl > 0.03 && amt > 0.6) {
      vec2 sn = gT / gTl;                                    // across the seam, toward team B
      float x = (tRaw - 0.5) / gTl;                          // signed distance to the midline, texels
      float e1 = exp(-x * x / 1.7), e2 = exp(-x * x / 0.8);
      seam = e1 * smoothstep(0.03, 0.14, gTl) * near;
      vec2 gW = (vec2(gX.g, gY.g) - wet * gradA) * ia;
      float newer = clamp(dot(gW, sn) / gTl * 1.6, -1.0, 1.0);   // +1: team B's side is the newer, wetter ink
      float dh = newer * 2.4 * e1 / 2.3 + 0.9 * 2.0 * x / 0.8 * e2 * (1.0 - 0.6 * abs(newer));
      gInkD += sn * dh * seam * gInk * thick;
      // the lower (older) side sits in the lip's shadow; the crease itself is a thin dark line
      seamShadow = seam * (0.45 * max(0.0, -x * newer) * e1 + 0.55 * e2 * (1.0 - 0.7 * abs(newer)));
    }
    vec3 team = mix(uTeamA, uTeamB, tm);
    vec3 inkCol = team * (0.93 + 0.13 * tone);
    // translucent thin lip reads lighter and a touch more saturated; the thick body a little deeper
    float lip = (1.0 - hs) * near;
    inkCol = mix(inkCol, inkCol * 1.16 + team * 0.05, lip * 0.35);
    inkCol *= 1.0 - 0.05 * hs;
    inkCol *= 1.0 - 0.3 * seamShadow * gInk;
    // fresh ink: a touch brighter + richer for the first moments, settling to its dry colour
    inkCol *= 1.0 + 0.07 * fresh * fresh;
    gInkCol = inkCol;
    float halo = smoothstep(0.06, 0.5, amt) * (1.0 - gInk) * near;
    if (!wallF) {
      // ink sits ON the ground: the lip throws a soft contact shadow, heavier on the side away from the sun
      vec2 outN = -gradA / max(length(gradA), 1e-4);
      float away = clamp(0.55 - 0.9 * dot(outN, normalize(sunF + 1e-4)) * length(sunF), 0.25, 1.3);
      halo *= smoothstep(0.4, 0.85, vWNorm.y) * away;
      base *= mix(vec3(1.0), team * 0.45 + 0.3, halo * 0.5);
    } else {
      // walls: the edge soaks into the surface — a damp, slightly tinted halo instead of a shadow
      base *= mix(vec3(1.0), team * 0.35 + 0.5, halo * 0.55);
    }
    base = mix(base, gInkCol, gInk);
  }`, R7 = `
roughnessFactor = mix(gBaseRough, mix(0.26, 0.14, gFresh), gInk);`, q7 = `
  if (gInk > 0.01) {
    // gel micro-surface: soft swells so reflections break into wet highlights. Mip-filtered (fades to flat by itself
    // at distance). Walls stretch it vertically. Fresh ink is smoother (surface tension) and sways very gently while it
    // settles; dry ink shows a little more texture.
    vec2 gp = vFaceUv * (abs(vWNorm.y) < 0.5 ? vec2(0.9, 0.42) : vec2(0.75));
    float fr2 = gFresh * gFresh;
    gp += vec2(uTime * 0.011, -uTime * 0.007) + fr2 * 0.022 * vec2(sin(uTime * 2.3), cos(uTime * 1.9));
#ifdef USE_TEXLIB
    if (uGel >= 0.0) {
      vec2 gx = dFdx(gp), gy = dFdy(gp);
      vec3 gn = textureGrad(tNormal, vec3(gp, uGel), gx, gy).xyz * 2.0 - 1.0;
      slope += -gn.xy / max(gn.z, 0.3) * (0.95 - 0.5 * gFresh) * gInk * gInkS;
    }
#else
    {
      const float e = 0.06;
      vec2 q = gp * 2.2;
      float hx = vnoise(q + vec2(e, 0.0)) - vnoise(q - vec2(e, 0.0));
      float hy = vnoise(q + vec2(0.0, e)) - vnoise(q - vec2(0.0, e));
      float gf = 1.0 - smoothstep(0.03, 0.12, length(fwidth(vWPos)));
      slope += vec2(hx, hy) / (2.0 * e) * 0.035 * gf * gInk;
    }
#endif
  }`, m7 = `
  if (gInk > 0.01) {
    // ripples: a wave packet runs out from every impact / footstep / dive, thinning as it spreads; the crests catch
    // the light (glossier). Height field → analytic gradient in the face plane.
    vec3 rS = vec3(0.0); float rG = 0.0;
    for (int i = 0; i < ${Vw}; i++) {
      vec4 Pr = uRip[i], Qr = uRipP[i];
      float age = uInkClock - Pr.w;
      if (age <= 0.0 || age >= Qr.w) continue;
      vec3 D = vWPos - Pr.xyz;
      float off = dot(D, vWNorm);
      if (abs(off) > 0.4) continue;                          // another surface
      D -= vWNorm * off;
      float front = Qr.z * age;
      float d = length(D);
      float x = d - front;
      float sg = Qr.y * 0.8;
      if (x > sg * 3.0 || x < -Qr.y * 4.0) continue;
      float env = exp(-x * x / (sg * sg));
      float k = 6.2831853 / Qr.y;
      float fade = 1.0 - age / Qr.w;
      fade *= fade * smoothstep(0.0, 0.03, age);
      float amp = Qr.x * fade / (1.0 + d * 1.6);
      float dh = amp * env * (-2.0 * x / (sg * sg) * cos(k * x) - k * sin(k * x));
      rS += D * (dh / max(d, 1e-4));
      rG += env * fade * min(Qr.x * 90.0, 1.0);
    }
    float rl = length(rS);
    if (rl > 0.75) rS *= 0.75 / rl;
    float rFar = 1.0 - smoothstep(0.05, 0.18, length(fwidth(vWPos)));
    slope += vec2(dot(rS, T), dot(rS, Bt)) * gInk * rFar;
    gWake = max(gWake, clamp(rG * 0.5, 0.0, 1.0) * gInk * rFar);
  }`, F7 = `
totalEmissiveRadiance += gInkCol * gInk * uInkGlow * (0.75 + 0.35 * gInkS);`, V7 = `
{
  // glossy wet coat on ink (sharp while fresh, satin once dry); roughness widened where the ink normal varies faster
  // than the pixel grid (no sparkle)
  vec3 cdu = dFdx(normal), cdv = dFdy(normal);
  float kern = min(0.3 * (dot(cdu, cdu) + dot(cdv, cdv)), 0.18);
  float cr = mix(mix(0.06, 0.028, gFresh), 0.022, gWake);
  material.clearcoat = gInk;
  material.clearcoatRoughness = min(sqrt(sqrt(cr * cr * cr * cr + kern)), 1.0);
  material.roughness = mix(material.roughness, min(sqrt(sqrt(pow(material.roughness, 4.0) + kern)), 1.0), gInk);
  // the coat carries the gloss; the pigment layer underneath only adds a soft sheen (keeps the hue pure)
  material.specularColor *= 1.0 - 0.7 * gInk;
  // Wake Up uses Three r180: specularColorBlended was introduced later.
  material.specularF90 = mix(material.specularF90, 0.35, gInk);
  // flatter Fresnel on the coat: a little more reflection head-on, far less at grazing angles, so the team colour
  // survives a low gameplay camera instead of washing out to sky-white
  material.clearcoatF0 = vec3(mix(0.04, 0.055 + 0.015 * gFresh, gInk));
  material.clearcoatF90 = mix(1.0, 0.3, gInk);
}`, t7 = `
// ink keeps its hue in shade: the blue sky's ambient is applied hue-neutral to the pigment
if (gInk > 0.0) {
  const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
  irradiance = mix(irradiance, vec3(dot(irradiance, LW)), 0.7 * gInk);
  #if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
  iblIrradiance = mix(iblIrradiance, vec3(dot(iblIrradiance, LW)), 0.7 * gInk);
  #endif
}
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular ) && defined( USE_CLEARCOAT )
  // stylised wet reflections: pushed toward a neutral sheen so a blue sky never turns yellow ink olive, then tinted a
  // little by the pigment underneath (a thick coloured gel) so a grazing view keeps the team hue
  {
    float cl = dot(clearcoatRadiance, vec3(0.2126, 0.7152, 0.0722));
    vec3 tint = gInkCol / max(dot(gInkCol, vec3(0.2126, 0.7152, 0.0722)), 1e-3);
    clearcoatRadiance = mix(clearcoatRadiance, mix(vec3(cl), cl * min(tint, vec3(2.5)), 0.3), 0.6 * gInk);
    clearcoatRadiance *= 1.0 + gInk * (0.25 + 0.3 * gFresh) + gWake * 0.7;
  }
#endif`, b7 = `
if (gInk > 0.0) {
  const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
  float dL = dot(reflectedLight.directDiffuse, LW), iL = dot(reflectedLight.indirectDiffuse, LW);
  float shade = 1.0 - smoothstep(0.1, 0.6, dL / max(dL + iL, 1e-5));
  vec3 c2 = gInkCol * gInkCol;
  vec3 rich = c2 * (dot(gInkCol, LW) / max(dot(c2, LW), 1e-4));      // same brightness, deeper chroma
  vec3 id = reflectedLight.indirectDiffuse;
  vec3 idRich = rich * (iL / max(dot(gInkCol, LW), 1e-4));
  id = mix(id, idRich, 0.5 * shade) * (1.0 + 0.6 * shade);
  reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse, id, gInk);
}`, Cx = 12, Uy = 10, l7 = `
for (int i = 0; i < ${Cx}; i++) {
  if (i >= uLampN) break;
  vec3 lw = uLamps[i] - vWPos;
  float d2 = dot(lw, lw);
  if (d2 > ${(Uy * Uy).toFixed(2)}) continue;
  float w = clamp(1.0 - d2 * d2 / ${(Uy ** 4).toFixed(1)}, 0.0, 1.0);
  IncidentLight lampL;
  lampL.direction = normalize((viewMatrix * vec4(lw, 0.0)).xyz);
  lampL.color = uLampCol * (w * w / max(d2, 0.35));
  lampL.visible = true;
  RE_Direct(lampL, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight);
}`;
function d7(j, A, M = null, N = {}) {
  const I = new OI({ color: 16777215, vertexColors: true, roughness: 0.82, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.9 }), D = { uPaint: { value: j }, uTexel: { value: 1 / A }, uTeamA: { value: new lA("#ff8a14") }, uTeamB: { value: new lA("#2f5bff") }, uTime: { value: 0 }, uInkGlow: { value: 0.06 }, uMural: { value: M }, uLight: { value: N.lightmap || null }, uSeeA: { value: new DA() }, uSeeB: { value: new DA() }, uSeeOn: { value: 0 }, uSeeFeet: { value: 0 }, uSeeA2C: { value: 0 }, uAO: { value: N.lightmap ? 1 : 0 }, uLamps: { value: Array.from({ length: Cx }, () => new DA()) }, uLampN: { value: 0 }, uLampCol: { value: new lA(0, 0, 0) }, uAtlasSize: { value: A }, uPpm: { value: N.ppm || 20 }, ...H7(), uGel: { value: 13 }, uWake: { value: Array.from({ length: 48 }, () => new qM(0, 0, 0, -9)) }, uWakeB: { value: Array.from({ length: 4 }, () => new qM(0, -999, 0, 0)) }, uSwimH: { value: Array.from({ length: 4 }, () => new qM(0, -999, 0, 0)) }, uSwimF: { value: Array.from({ length: 4 }, () => new qM(0, 0, 1, 0)) } }, T = N.texlib || null;
  if (T) {
    const w = T.layers, O = T.meta, z = ["concrete", "pavers", "tiles", "concrete", "rubber", "corrugated", "boardwalk", "metalpanel", "tiles", "concrete", "asphalt", "metalpanel", "grate", "brick", "rubber", "glasstile", "pavers", "planks", "hullpaint", "nonslip", "gelcoat", "yard", "weatherboard", "render", "treads", "stonestep", "rampboard", "gangdeck", ...Array.from({ length: P7 - $i + 1 }, (g, Q) => (wx.find((x) => x.slot === $i + Q) || { name: "concrete" }).name), "concrete"], C = z.length - 1, E = { 4: C, 10: C, 21: C, 19: 18, 24: 18, 25: 23, 26: 17, 27: 11 }, P = { 20: 17 };
    for (const g of wx) g.onWall != null && (E[g.slot] = g.onWall), g.onTop != null && (P[g.slot] = g.onTop);
    D.tAlbedo = { value: T.albedo }, D.tNormal = { value: T.normal }, D.tOrm = { value: T.orm }, D.uTexSize = { value: T.stats?.size || 512 }, D.uTL = { value: z.map((g) => new qM(w[g] ?? 0, 1 / (O[g] && O[g].scale || 4), (O[g] && O[g].mode) ?? 1, (O[g] && O[g].sym) ?? 7)) }, D.uTLt = { value: z.map((g, Q) => new qM(O[g] && O[g].mask ? 2 : O[g] && O[g].tint === false ? 0 : 1, g === "grate" ? 0.6 : 1, E[Q] ?? Q, P[Q] ?? Q)) }, D.uTLs = { value: z.map((g) => new qM(...O[g] && O[g].stair || [0, 0, 0, 0])) }, D.uGel.value = w.gel ?? -1, I.defines = { ...I.defines || {}, USE_TEXLIB: 1, TL_SLOTS: z.length };
  }
  {
    const O = M && M.userData && M.userData.murals || [0, 1, 2, 3].map((z) => ({ rect: [0, 1, (3 - z) / 4, 0.25], place: [0, -8, 0, 0] }));
    D.uMurA = { value: Array.from({ length: 12 }, (z, C) => new qM(...O[C] && O[C].rect || [0, 1, 0, 0.25])) }, D.uMurB = { value: Array.from({ length: 12 }, (z, C) => new qM(...O[C] && O[C].place || [0, -8, 0, 0])) }, D.uMurC = { value: Array.from({ length: 12 }, (z, C) => new jM(...O[C] && O[C].fx || [0, 0])) };
  }
  return I.userData.uniforms = D, I.alphaToCoverage = true, I.onBeforeRender = (w) => {
    D.uSeeFeet.value = D.uSeeB.value.y - 1;
    const O = w.getRenderTarget();
    D.uSeeA2C.value = O && O.samples > 0 ? 1 : 0;
    const z = N.paint || nN.paint;
    z && z.texture === D.uPaint.value && (D.uPpm.value = z.ppm, f7(D, z));
  }, I.onBeforeCompile = (w) => {
    Object.assign(w.uniforms, D), w.vertexShader = w.vertexShader.replace("#include <common>", `#include <common>
attribute vec2 paintUv;
attribute vec2 faceUv;
attribute vec4 faceData;
attribute vec3 faceFlags;
attribute vec3 faceTan;
attribute vec2 lightUv;
varying vec2 vLightUv;
varying vec3 vFaceTan;
varying vec2 vPaintUv;
varying vec2 vFaceUv;
varying vec4 vFaceData;
varying vec3 vFaceFlags;
varying vec3 vWPos;
varying vec3 vWNorm;`).replace("#include <project_vertex>", `#include <project_vertex>
vPaintUv = paintUv; vFaceUv = faceUv; vFaceData = faceData; vFaceFlags = faceFlags;
vFaceTan = normalize(mat3(modelMatrix) * faceTan);
vLightUv = lightUv;
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWNorm = normalize(mat3(modelMatrix) * objectNormal);`), w.fragmentShader = w.fragmentShader.replace("#include <common>", `#include <common>
uniform sampler2D uPaint;
uniform float uTexel;
uniform vec3 uTeamA;
uniform vec3 uTeamB;
uniform float uTime;
uniform float uInkGlow;
uniform sampler2D uMural;
uniform sampler2D uLight;
uniform float uAO;
uniform vec3 uLamps[${Cx}];
uniform int uLampN;
uniform vec3 uLampCol;
uniform vec3 uSeeA;
uniform vec3 uSeeB;
uniform float uSeeOn;
uniform float uSeeFeet;
uniform float uSeeA2C;
uniform float uAtlasSize;
uniform float uPpm;
uniform float uGel;
uniform vec4 uWake[48];
uniform vec4 uWakeB[4];
uniform vec4 uSwimH[4];
uniform vec4 uSwimF[4];
varying vec2 vLightUv;
varying vec3 vFaceTan;
varying vec2 vPaintUv;
varying vec2 vFaceUv;
varying vec4 vFaceData;
varying vec3 vFaceFlags;
varying vec3 vWPos;
varying vec3 vWNorm;

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
// anti-aliased grid line: returns 1 on the line
float gridLine(float x, float period, float width) {
  float fx = abs(fract(x / period + 0.5) - 0.5) * period;
  float w = fwidth(x) * 0.75;
  return 1.0 - smoothstep(width - w, width + w, fx);
}
${G7}
vec2 fsz0(vec4 fd) { return fd.zw; }
#ifdef USE_TEXLIB
precision highp sampler2DArray;
uniform sampler2DArray tAlbedo;
uniform sampler2DArray tNormal;
uniform sampler2DArray tOrm;
uniform float uTexSize;
uniform vec4 uTL[TL_SLOTS];
uniform vec4 uTLt[TL_SLOTS];
uniform vec4 uTLs[TL_SLOTS];
${U7}
#endif
uniform vec4 uMurA[12];
uniform vec4 uMurB[12];
uniform vec2 uMurC[12];
vec3 gTexMod = vec3(1.0);   // surface albedo modulation (≈ 1 mean) + paint coverage, for weathered murals
float gTexPaint = 1.0;
vec3 gTexN = vec3(0.0, 0.0, 1.0);
vec4 gTexORM = vec4(1.0, 0.8, 0.0, 0.5);
float gTexStr = 0.0;
vec4 gStair = vec4(0.0);    // stair / ramp top: distance across from one side (m), width (m), edge kind, step coordinate
float gTexKeep = 0.0;       // share of the texture relief kept under ink (stairs keep their steps)
float gTexAlpha = 1.0;
float gInk = 0.0;
vec3 gInkCol = vec3(0.0);
float gBaseRough = 0.8;
float gInkH = 0.0;
vec2 gInkD = vec2(0.0);
float gRib = 0.0;
float gFresh = 0.0;
float gInkNear = 0.0;
float gInkS = 0.0;
float gWake = 0.0;`).replace("#include <color_fragment>", `#include <color_fragment>
{
  // see-through: geometry in front of the local player that overlaps their on-screen silhouette dissolves, so low
  // cover never hides your character. The window is a capsule in screen space around the body (feet → head) with a
  // soft edge; only fragments clearly in front of the player dissolve (never anything behind them), and floors /
  // platform sides at or below the player's feet are never cut (no holes under you).
  // With MSAA the fade uses alpha-to-coverage (sub-pixel, smooth); without it an 8×8 ordered dither + discard.
  diffuseColor.a = 1.0;
  if (uSeeOn > 0.001) {
    vec3 Bv = (viewMatrix * vec4(uSeeB, 1.0)).xyz;
    float dB = -Bv.z, dP = vViewPosition.z;
    if (dB > 0.6 && dP < dB - 0.2) {
      float bodyH = uSeeB.y - uSeeFeet;                        // kid ≈ 1.0, squid ≈ 0.4
      vec3 Fv = (viewMatrix * vec4(uSeeB.x, uSeeFeet + 0.05, uSeeB.z, 1.0)).xyz;
      vec3 Hv = (viewMatrix * vec4(uSeeB.x, uSeeFeet + bodyH * 1.42 + 0.06, uSeeB.z, 1.0)).xyz;
      vec2 p = -vViewPosition.xy / dP, f = Fv.xy / max(-Fv.z, 0.05), h = Hv.xy / max(-Hv.z, 0.05);
      vec2 fh = h - f;
      float t = clamp(dot(p - f, fh) / max(dot(fh, fh), 1e-8), 0.0, 1.0);
      float sd = length(p - (f + fh * t)) * dB;                  // metres, measured at the player's distance
      float R = mix(0.3, 0.46, clamp(bodyH, 0.0, 1.0));          // body half-width + margin
      float k = 1.0 - smoothstep(R, R + 0.42, sd);
      k *= smoothstep(dB - 0.2, dB - 0.75, dP);                  // only well in front of the player
      // never cut floors at the player's feet, nor the sides of the platform they stand on
      float feetTop = uSeeFeet + 0.3;
      if (vWNorm.y > 0.6 && vWPos.y < feetTop) k = 0.0;
      if (abs(vWNorm.y) < 0.6 && vWPos.y + max(vFaceData.w - vFaceUv.y, 0.0) * 0.9 < feetTop) k = 0.0;
      k *= uSeeOn;
      if (k > 0.002) {
        ivec2 q = ivec2(gl_FragCoord.xy) & 7;
        int xy = q.x ^ q.y;
        float bay = (float(((xy & 1) << 5) | ((q.x & 1) << 4) | ((xy & 2) << 2) | ((q.x & 2) << 1) | ((xy & 4) >> 1) | ((q.x & 4) >> 2)) + 0.5) / 64.0;
        // alpha-to-coverage gives 4 levels per pixel; a small ordered offset fills the steps in between, tapered so
        // the open centre and the untouched rim stay perfectly clean (no screen-door grain over the character)
        float a = 1.0 - k;
        if (uSeeA2C > 0.5) diffuseColor.a = clamp(a + (bay - 0.5) * 0.25 * smoothstep(0.0, 0.2, a) * smoothstep(1.0, 0.8, a), 0.0, 1.0);
        else if (k > bay * 0.98 + 0.01) discard;
      }
    }
  }
  vec2 fu = vFaceUv;
  float pattern = vFaceData.x;
#ifdef GRATE
  // bar grating: 4 cm bars on a 7 cm pitch one way, 2 cm cross-bars every 20 cm; holes are cut out
  {
    float gw = fwidth(fu.x) + 1e-4;
    float bx = 1.0 - smoothstep(0.02 - gw, 0.02 + gw, abs(fract(fu.x / 0.07 + 0.5) - 0.5) * 0.07);
    float by = 1.0 - smoothstep(0.01 - gw, 0.01 + gw, abs(fract(fu.y / 0.2 + 0.5) - 0.5) * 0.2);
    float edge = 1.0 - smoothstep(0.05, 0.06, min(min(fu.x, fsz0(vFaceData).x - fu.x), min(fu.y, fsz0(vFaceData).y - fu.y)));
    float solid = max(max(bx, by), edge);
    if (abs(vWNorm.y) < 0.5) solid = 1.0;
    if (solid < 0.5) discard;
  }
#endif
  vec2 fsz = vFaceData.zw;
  vec3 base = diffuseColor.rgb;
  float rough = 0.82;
  float big = fbm(vWPos.xz * 0.18 + vWPos.y * 0.1);
  float fine = vnoise(fu * 9.0);
#ifdef USE_TEXLIB
  {
    int pid = int(pattern + 0.5);
    bool vertical = abs(vWNorm.y) < 0.5;
    // per-slot remaps: ramp / asphalt / yard sides → concrete, car-deck edge → plating, gelcoat tops → planks
    if (vertical) pid = int(uTLt[pid].z + 0.5); else if (vWNorm.y > 0.5) pid = int(uTLt[pid].w + 0.5);
    vec4 tl = uTL[pid]; vec4 tt = uTLt[pid];
    // stairs / ramps: sample in the ramp's own frame — u across, v downhill from the top landing — with v phase-locked so
    // a whole number of steps fits the visible flight (the slab runs 0.6 m on under the floor at its low end, level.js)
    vec2 tuv = fu * tl.y;
    vec4 sp = uTLs[pid];
    vec2 tA = vec2(1.0, 0.0), tD = vec2(0.0, 1.0);
    if (sp.x > 0.0 && vWNorm.y > 0.5) {
      bool alongU = abs(vFaceTan.y) > 0.02;                                   // x-running ramps: face u runs up/down the slope
      float sg = alongU ? sign(vFaceTan.y) : sign(vWNorm.z * vFaceTan.x - vWNorm.x * vFaceTan.z);   // uphill = +axis?
      float fa = alongU ? fu.x : fu.y, fcr = alongU ? fu.y : fu.x;
      float La = alongU ? fsz.x : fsz.y, Wd = alongU ? fsz.y : fsz.x;
      float dTop = sg > 0.0 ? La - fa : fa;
      if (dTop > La - 0.3) { sg = -sg; dTop = La - dTop; }                   // bevel past the crest: visible fragments never sit in the buried tail
      float Lv = max(La - 0.6, sp.x);
      float Ps = Lv / max(1.0, floor(Lv / sp.x + 0.5));
      tuv = vec2(fcr * tl.y, dTop / (Ps * sp.y));
      tA = alongU ? vec2(0.0, 1.0) : vec2(1.0, 0.0);
      tD = alongU ? vec2(-sg, 0.0) : vec2(0.0, -sg);
      gStair = vec4(fcr, Wd, sp.w, dTop / Ps);
      gTexKeep = sp.z;
    }
    TexlibSample ts = texlibSample(tAlbedo, tNormal, tOrm, tuv, tl.x, int(tl.z), int(tl.w));
    ts.normal = vec3(ts.normal.x * tA + ts.normal.y * tD, ts.normal.z);      // back into the face's (u, v) frame
    base = tt.x > 1.5 ? ts.albedo.rgb + diffuseColor.rgb * ts.albedo.a * 1.25
         : (tt.x > 0.5 ? diffuseColor.rgb * ts.albedo.rgb * 1.25 : ts.albedo.rgb);
    base *= texlibMacro(vWPos.xz + vWPos.y * 0.7);
    base *= mix(1.0, ts.orm.r, 0.85);                            // cavity occlusion in grout / seams / grooves
    gTexMod = (tt.x > 1.5 ? vec3(ts.albedo.a * 1.25) : (tt.x > 0.5 ? ts.albedo.rgb * 1.25 : vec3(1.0))) * mix(1.0, ts.orm.r, 0.85);
    gTexPaint = tt.x > 1.5 ? clamp(ts.albedo.a * 1.45, 0.0, 1.0) : 1.0;
    rough = ts.orm.g;
    gTexN = ts.normal; gTexORM = ts.orm; gTexStr = tt.y; gTexAlpha = ts.albedo.a;
    #ifdef GRATE
      if (texlibCoverage(ts.albedo.a, fu * tl.y, uTexSize) < 0.5 && !vertical) discard;
    #endif
  }
  if (pattern < 0.5) {
  } else if (pattern < 1.5) {
    // court markings over the pavers
    float rr = length(vWPos.xz);
    float wr = fwidth(rr);
    float mark = 1.0 - smoothstep(0.09 - wr, 0.09 + wr, abs(rr - 9.5));
    float wz = fwidth(vWPos.z);
    mark = max(mark, (1.0 - smoothstep(0.07 - wz, 0.07 + wz, abs(vWPos.z))) * step(9.5, abs(vWPos.x)));
    mark *= 0.75 + 0.25 * step(0.35, vnoise(vWPos.xz * 6.0));
    if (vWNorm.y > 0.5) base = mix(base, vec3(0.97, 0.96, 0.92), mark * 0.9);
  } else if (pattern > 3.5 && pattern < 4.5) {
    float edge = 1.0 - smoothstep(0.16, 0.2, min(fu.x, fsz.x - fu.x));
    if (vWNorm.y > 0.5) { base = mix(base, vec3(0.93, 0.72, 0.12), edge * 0.95); rough = mix(rough, 0.6, edge); }
  } else if (pattern > 7.5 && pattern < 8.5) {
    float e = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
    float band = 1.0 - smoothstep(0.34, 0.36, e);
    float chev = step(0.5, fract((fu.x + fu.y) * 1.6));
    if (vWNorm.y > 0.5) base = mix(base, mix(vec3(0.95, 0.76, 0.1), vec3(0.12), chev), band * step(0.05, e));
  } else if (pattern > 8.5 && pattern < 9.5) {
    float e = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
    float bed = smoothstep(0.24, 0.27, e) * step(0.5, vWNorm.y);
    vec3 grass = vec3(0.32, 0.55, 0.22) * (0.8 + 0.35 * fbm(fu * 6.0));
    base = mix(base, grass, bed);
    rough = mix(rough, 0.95, bed);
    gTexStr *= 1.0 - bed;
  }
  // ---- modelled detail (shader-only, no layout change) ----
  {
    int pid = int(pattern + 0.5);
    vec2 wp = vWPos.xz;
    float ef = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
    bool isTop = vWNorm.y > 0.6;
    bool isWall = abs(vWNorm.y) < 0.5;
    // floors: soft grime patches, sun-bleached warm areas and smoother traffic-polished patches (sheen at grazing sun)
    if (isTop && (pid == 1 || pid == 16 || pid == 10 || pid == 2 || pid == 8 || pid == 17 || pid == 19 || pid == 21)) {
      float m1 = vnoise(wp * 0.09 + 5.3), m2 = vnoise(wp * 0.31 + 1.7), m3 = vnoise(wp * 1.3);
      float grime = smoothstep(0.52, 0.86, m1 * 0.65 + m2 * 0.35);
      base *= 1.0 - 0.075 * grime * (0.7 + 0.3 * m3);
      base *= mix(vec3(1.0), vec3(1.025, 1.005, 0.965), smoothstep(0.42, 0.12, m1));
      rough = mix(rough, rough * 0.72, smoothstep(0.62, 0.9, m2) * 0.7);
    }
    // stone coping on exposed tops of walls / platforms / parapets, with a drip-groove shadow under the cap
    if (pid == 0 || pid == 2 || pid == 3 || pid == 13 || pid == 15 || pid == 16 || pid == 23) {
      float cop = 0.0, groove = 0.0;
      float cw = mix(0.2, 0.26, step(3.0, min(fsz.x, fsz.y)));
      if (isTop) {
        cop = min(fsz.x, fsz.y) < 1.15 ? 1.0 : 1.0 - smoothstep(cw - 0.008, cw + 0.008, ef);
        groove = (1.0 - smoothstep(0.004, 0.012, abs(ef - cw))) * step(1.15, min(fsz.x, fsz.y));
      } else if (isWall && vFaceFlags.x > 0.5) {
        float dt = fsz.y - fu.y;
        cop = 1.0 - smoothstep(0.1, 0.108, dt);
        groove = 1.0 - smoothstep(0.005, 0.016, abs(dt - 0.118));
      }
      vec3 stone = vec3(0.9, 0.885, 0.845) * (0.95 + 0.07 * vnoise(fu * 9.0) + 0.03 * vnoise(fu * 41.0));
      base = mix(base, stone * texlibMacro(wp + vWPos.y * 0.7), cop);
      rough = mix(rough, 0.72, cop);
      gTexStr *= 1.0 - 0.8 * cop;
      base *= 1.0 - 0.28 * groove;
    }
    // ramps: anti-slip grooves across the slope
    if (pid == 4 && isTop) {
      vec3 Tt = normalize(vFaceTan - vWNorm * dot(vFaceTan, vWNorm)), Bb = cross(vWNorm, Tt);
      vec2 up2 = vec2(Tt.y, Bb.y);
      float along = dot(fu, up2 / max(length(up2), 1e-4));
      float g = gridLine(along, 0.32, 0.016);
      base *= 1.0 - 0.2 * g;
      rough = mix(rough, 0.95, g);
    }
    // containers: rust streaks bleeding from the top rail and corners, dirt toward the bottom
    if (pid == 5 && isWall) {
      float st = vnoise(vec2(dot(wp, vec2(0.707)) * 5.5 + vWPos.x * 0.8, vWPos.y * 0.35));
      float fromTop = smoothstep(fsz.y * 0.25, fsz.y, fu.y);
      float rust = smoothstep(0.6, 0.92, st) * (0.35 + 0.65 * fromTop);
      rust = max(rust, (1.0 - smoothstep(0.05, 0.3, ef)) * smoothstep(0.45, 0.8, vnoise(fu * 3.0)) * 0.8);
      base = mix(base, vec3(0.42, 0.2, 0.1) * (0.8 + 0.4 * vnoise(fu * 11.0)), rust * 0.42);
      rough = mix(rough, 0.85, rust);
      base *= mix(0.84, 1.0, smoothstep(0.0, 0.7, fu.y));
    }
    // stairs / ramps: soft contact shadow along the stringers / kick plates / cheek walls the props put at both sides;
    // the stone stair is worn smoother and paler down its middle, the steel stair's plate polished along the walking line
    if (gStair.z > 0.5) {
      float e = min(gStair.x, gStair.y - gStair.x);
      float kind = gStair.z;
      float sw = kind < 1.5 ? 0.16 : (kind < 2.5 ? 0.3 : (kind < 3.5 ? 0.14 : 0.12));
      base *= 1.0 - (kind < 2.5 ? 0.26 : 0.2) * (1.0 - smoothstep(0.0, sw, e));
      float mid = 1.0 - smoothstep(0.18, 0.42, abs(gStair.x / max(gStair.y, 0.01) - 0.5));
      if (kind > 1.5 && kind < 2.5) { base *= 1.0 + 0.05 * mid; rough = mix(rough, rough * 0.78, mid); }
      if (kind < 1.5) rough = mix(rough, rough * 0.85, mid * (1.0 - gTexPaint));
    }
    // painted render / timber cladding: rain-washed grime streaks hanging from the top edge of each wall face
    if ((pid == 23 || pid == 22) && isWall) {
      float fromTop = fsz.y - fu.y;
      float st = 0.6 * vnoise(vec2(fu.x * 1.9, fromTop * 0.3 + 7.1)) + 0.4 * vnoise(vec2(fu.x * 6.3, fromTop * 0.8 + 2.3));
      float streak = smoothstep(0.5, 0.85, st) * exp(-fromTop * 0.75);
      base *= 1.0 - 0.2 * streak;
      rough = mix(rough, 0.9, streak * 0.6);
    }
    // boatyard: galvanised slot drain round the tug's wash-down bay (Alpha-half coordinates; the 180° twin follows)
    if (pid == 21 && isTop) {
      vec2 q = wp.y > 0.0 ? -wp : wp;
      vec2 d = abs(q - vec2(17.5, -18.4)) - vec2(4.4, 7.0);
      float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
      float e = abs(sd), aw = fwidth(e) + 1e-4;
      float chan = 1.0 - smoothstep(0.08 - aw, 0.08 + aw, e);
      float lip = (1.0 - smoothstep(0.105 - aw, 0.105 + aw, e)) * (1.0 - chan);
      float run = d.x > d.y ? q.y : q.x;
      float fw = fwidth(run) + 1e-5;
      float slot = smoothstep(0.3 - fw / 0.025, 0.3 + fw / 0.025, abs(fract(run / 0.025) - 0.5) * 2.0);
      float bar = mix(0.4, slot, clamp(0.025 / (fw * 4.0) - 0.5, 0.0, 1.0));
      base = mix(base, mix(vec3(0.025), vec3(0.34, 0.35, 0.36), bar), chan);
      base = mix(base, vec3(0.4, 0.41, 0.42) * (0.9 + 0.2 * fine), lip * 0.85);
      rough = mix(rough, 0.48, max(chan * bar, lip));
      gTexORM.b = mix(gTexORM.b, 0.75, max(chan * bar, lip));
      gTexStr *= 1.0 - max(chan, lip);
      base *= mix(vec3(1.0), vec3(0.94, 0.9, 0.87), step(sd, -0.105) * 0.8);   // the bay floor: darker, run-off stained
      // world-scale (non-repeating) oil drips and a worn service-lane wheel track beside the bay
      float oilW = smoothstep(0.68, 0.88, 0.65 * vnoise(q * 0.9 + 13.1) + 0.35 * vnoise(q * 3.1 + 2.7));
      base *= 1.0 - 0.26 * oilW * (1.0 - chan);
      rough = mix(rough, 0.62, oilW * 0.5);
      float tx = q.x - (12.15 + 0.25 * sin(q.y * 0.37));
      float track = (1.0 - smoothstep(0.1, 0.17, min(abs(tx - 0.85), abs(tx + 0.85)))) * step(q.y, -7.6) * (0.5 + 0.5 * vnoise(q * vec2(1.3, 0.35)));
      base *= 1.0 - 0.1 * track;
      rough = mix(rough, rough * 0.85, track);
    }
  }
  if (false) { if (pattern < 0.5) {   // legacy procedural chain below is compiled out of use
#else
  base *= 0.93 + 0.1 * big;
  if (pattern < 0.5) {
#endif
    // plain painted concrete
    base *= 0.97 + 0.05 * fine;
  } else if (pattern < 1.5) {
    // deck: 2 m concrete slabs with dark joints, tone per slab, speckle
    vec2 cell = floor(fu / 2.0);
    base *= 0.95 + 0.08 * h21(cell);
    float j = max(gridLine(fu.x, 2.0, 0.018), gridLine(fu.y, 2.0, 0.018));
    base *= 1.0 - 0.28 * j;
    base *= 0.96 + 0.06 * step(0.93, h21(floor(fu * 22.0)));
    // painted court markings: centre ring + halfway line (slightly worn)
    float rr = length(vWPos.xz);
    float wr = fwidth(rr);
    float mark = 1.0 - smoothstep(0.09 - wr, 0.09 + wr, abs(rr - 9.5));
    float wz = fwidth(vWPos.z);
    mark = max(mark, (1.0 - smoothstep(0.07 - wz, 0.07 + wz, abs(vWPos.z))) * step(9.5, abs(vWPos.x)));
    mark *= 0.75 + 0.25 * step(0.35, vnoise(vWPos.xz * 6.0));
    if (vWNorm.y > 0.5) base = mix(base, vec3(0.97, 0.96, 0.92), mark * 0.9);
    rough = 0.86;
  } else if (pattern < 2.5) {
    // tiles: 0.5 m tiles with lighter grout
    vec2 cell = floor(fu / 0.5);
    base *= 0.94 + 0.09 * h21(cell + 3.1);
    float j = max(gridLine(fu.x, 0.5, 0.012), gridLine(fu.y, 0.5, 0.012));
    base = mix(base, base * 0.78 + 0.08, j);
    rough = 0.6;
  } else if (pattern < 3.5) {
    // concrete wall: formwork bands + tie holes + low grime
    float band = gridLine(fu.y, 1.2, 0.01);
    base *= 1.0 - 0.14 * band;
    vec2 tp = vec2(fract(fu.x / 1.2) - 0.5, fract(fu.y / 1.2 - 0.25) - 0.5) * 1.2;
    base *= 1.0 - 0.35 * (1.0 - smoothstep(0.02, 0.035, length(tp)));
    base *= 0.94 + 0.06 * smoothstep(0.0, 0.9, fu.y);
    rough = 0.9;
  } else if (pattern < 4.5) {
    // ramps: grip grooves + yellow safety edges
    float g = gridLine(fu.y, 0.35, 0.02);
    base *= 1.0 - 0.18 * g;
    float edge = 1.0 - smoothstep(0.16, 0.2, min(fu.x, fsz.x - fu.x));
    if (vWNorm.y > 0.5) base = mix(base, vec3(0.93, 0.72, 0.12), edge * 0.95);
    rough = 0.75;
  } else if (pattern < 5.5) {
    // shipping container: vertical corrugation ribs
    float rib = sin(fu.x / 0.28 * 6.2831);
    gRib = rib;
    base *= 0.92 + 0.1 * rib;
    float frame = 1.0 - smoothstep(0.08, 0.1, min(min(fu.y, fsz.y - fu.y), min(fu.x, fsz.x - fu.x)));
    base = mix(base, base * 0.7, frame);
    base *= 0.95 + 0.07 * fbm(fu * vec2(3.0, 0.7));
    rough = 0.55;
  } else if (pattern < 6.5) {
    // wood planks
    float pl = gridLine(fu.y, 0.26, 0.008);
    float plank = floor(fu.y / 0.26);
    float grain = fbm(vec2(fu.x * 0.7 + h21(vec2(plank)) * 30.0, fu.y * 18.0));
    base *= 0.84 + 0.22 * grain;
    base *= 1.0 - 0.35 * pl;
    float frame = 1.0 - smoothstep(0.1, 0.12, min(min(fu.y, fsz.y - fu.y), min(fu.x, fsz.x - fu.x)));
    base = mix(base, base * 0.82, frame * step(fsz.x, 3.0) * step(fsz.y, 3.0));
    rough = 0.78;
  } else if (pattern < 7.5) {
    // metal railing: brushed + rivets
    base *= 0.92 + 0.08 * vnoise(vec2(fu.x * 40.0, fu.y * 1.5));
    vec2 rp = vec2(fract(fu.x / 0.8) - 0.5, fu.y - fsz.y + 0.12) * vec2(0.8, 1.0);
    base *= 1.0 - 0.3 * (1.0 - smoothstep(0.02, 0.03, length(rp)));
    rough = 0.45;
  } else if (pattern < 8.5) {
    // spawn deck: tiles + chevron hazard band around the edges
    vec2 cell = floor(fu / 0.6);
    base *= 0.95 + 0.06 * h21(cell + 7.7);
    float j = max(gridLine(fu.x, 0.6, 0.01), gridLine(fu.y, 0.6, 0.01));
    base *= 1.0 - 0.15 * j;
    float e = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
    float band = 1.0 - smoothstep(0.34, 0.36, e);
    float chev = step(0.5, fract((fu.x + fu.y) * 1.6));
    if (vWNorm.y > 0.5) base = mix(base, mix(vec3(0.95, 0.76, 0.1), vec3(0.12), chev), band * step(0.05, e));
    rough = 0.65;
  } else if (pattern > 9.5 && pattern < 10.5) {
    if (abs(vWNorm.y) < 0.5) {
      // slab edges / trench walls read as poured concrete
      base = base * 1.18 * (0.95 + 0.05 * fine);
      base *= 1.0 - 0.12 * gridLine(fu.y, 1.2, 0.01);
      rough = 0.9;
    } else {
      base *= 0.92 + 0.08 * vnoise(fu * 3.0) + 0.04 * (vnoise(fu * 37.0) - 0.5) * (1.0 - smoothstep(0.02, 0.06, length(fwidth(fu))));
      rough = 0.92;
    }
  } else if (pattern > 10.5 && pattern < 11.5) {
    // painted steel panels: 1.2 m panels with seams + bolt rows
    float seam = max(gridLine(fu.x, 1.2, 0.008), gridLine(fu.y, 1.2, 0.008));
    base *= 1.0 - 0.22 * seam;
    base *= 0.95 + 0.06 * fbm(fu * 1.3);
    rough = 0.5;
  } else if (pattern > 11.5 && pattern < 12.5) {
    base *= 0.9;
    rough = 0.45;
  } else if (pattern > 15.5 && pattern < 16.5) {
    // pavers: 2 m slabs
    vec2 cell = floor(fu / 2.0);
    base *= 0.95 + 0.07 * h21(cell + 1.3);
    float j = max(gridLine(fu.x, 2.0, 0.02), gridLine(fu.y, 2.0, 0.02));
    base *= 1.0 - 0.25 * j;
    rough = 0.84;
  } else if (pattern > 12.5) {
    base *= 0.95 + 0.05 * fine;
    rough = 0.7;
  } else {
    // planter: stone rim with grass bed on top
    float e = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
    float bed = smoothstep(0.24, 0.27, e) * step(0.5, vWNorm.y);
    vec3 grass = vec3(0.32, 0.55, 0.22) * (0.8 + 0.35 * fbm(fu * 6.0));
    base = mix(base * (0.95 + 0.05 * fine), grass, bed);
    rough = mix(0.8, 0.95, bed);
  }
#ifdef USE_TEXLIB
  }
#endif
  // murals / signage
  if (vFaceFlags.z > -0.5) {
    // atlas rect (mA) + placement on the face in metres (mB: x0, xLen, y0, yLen; xLen < 0 = strip repeating every
    // -xLen face heights, yLen <= 0 = full face height) + weathering (mC: surface shows through, paint damage cuts it)
    int mi = int(vFaceFlags.z + 0.5);
    vec4 mA = uMurA[mi], mB = uMurB[mi];
    vec2 mC = uMurC[mi];
    float my = mB.w > 0.0 ? (fu.y - mB.z) / mB.w : fu.y / fsz.y;
    float mx = mB.y < 0.0 ? fu.x / (-mB.y * fsz.y) : clamp((fu.x - mB.x) / mB.y, 0.0005, 0.9995);
    vec2 muv = vec2(mA.x + mA.y * mx, mA.z + mA.w * clamp(my, 0.004, 0.996));
    vec4 mc = texture2D(uMural, muv);
    mc.rgb *= mix(vec3(1.0), gTexMod, mC.x);
    mc.a *= mix(1.0, gTexPaint, mC.y);
    base = mix(base, mc.rgb * (0.92 + 0.1 * big), mc.a * 0.96);
  }
  // crisp modelled edges: thin bright chamfer + soft inner shadow
  float e = min(min(fu.x, fsz.x - fu.x), min(fu.y, fsz.y - fu.y));
  float ew = fwidth(e);
  // (edges are real bevel geometry now; the old painted chamfer lines drew seams where faces stack)
  // contact darkening at the foot of walls that stand on something
  if (vFaceFlags.x > 0.5 && vFaceFlags.y > 0.5) {
    base *= mix(0.55, 1.0, smoothstep(0.0, 0.85, fu.y));
  }
  gBaseRough = rough;

  // ---- wet ink (src/world/inkShading.js) ----
${h7}
  diffuseColor.rgb = base;
}`).replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
${R7}`).replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
#ifdef USE_TEXLIB
metalnessFactor = gTexORM.b * (1.0 - gInk);
#endif`).replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
{
  // slopes along the face's u / v axes (height per unit length), applied in the face's world tangent frame
  vec2 slope = gInkD;
${q7}
#ifndef USE_TEXLIB
  if (vFaceData.x > 4.5 && vFaceData.x < 5.5) {
    // corrugation on containers (only where not inked), analytic derivative
    slope.x += (1.0 - gInk) * -sin(vFaceUv.x / 0.28 * 6.2831) * 0.35;
  }
#endif
  vec3 T = normalize(vFaceTan - vWNorm * dot(vFaceTan, vWNorm));
  vec3 Bt = cross(vWNorm, T);
  if (gInk > 0.01) {
    // swim wakes: the ink itself ripples where a squid swims. Each trail segment sheds an expanding ripple (a stadium
    // around the path — their envelope opens into the V-wake) and the submerged body pushes up a glossy mound with a
    // small bow ridge at speed. Height field → analytic gradient in the face's tangent plane.
    vec3 wS = vec3(0.0); float wG = 0.0;
    for (int s = 0; s < 4; s++) {
      vec4 Bd = uWakeB[s];
      if (Bd.w <= 0.0 || distance(vWPos, Bd.xyz) > Bd.w) continue;
      for (int i = 0; i < 11; i++) {
        vec4 A0 = uWake[s * 12 + i], A1 = uWake[s * 12 + i + 1];
        if (A0.w < -1.0 || A1.w < -1.0) continue;
        vec3 ab = A1.xyz - A0.xyz;
        float t = clamp(dot(vWPos - A0.xyz, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
        float age = uTime - mix(A0.w, A1.w, t);
        if (age <= 0.0 || age > 1.15) continue;
        vec3 D = vWPos - (A0.xyz + ab * t);
        D -= vWNorm * dot(D, vWNorm);
        float d = length(D);
        float r = 0.1 + age * 0.95, w = 0.075 + age * 0.085;
        float x = d - r;
        float env = exp(-x * x / (w * w));
        if (env < 0.003) continue;
        float fade = 1.0 - age / 1.15;
        fade *= fade * smoothstep(0.0, 0.05, age);
        float amp = 0.0135 * fade;
        float dh = amp * env * (-2.0 * x / (w * w) * cos(x * 25.0) - 25.0 * sin(x * 25.0));
        wS += D * (dh / max(d, 1e-4));
        wG += env * fade * 0.6;
      }
      vec4 H = uSwimH[s], F = uSwimF[s];
      if (H.w > 0.002) {
        vec3 D = vWPos - H.xyz;
        D -= vWNorm * dot(D, vWNorm);
        vec3 Fp = F.xyz - vWNorm * dot(F.xyz, vWNorm);
        float fl = length(Fp);
        Fp = fl > 1e-3 ? Fp / fl : T;
        float al = dot(D, Fp);
        vec3 Cv = D - Fp * al;
        float ac = length(Cv);
        vec3 Cn = Cv / max(ac, 1e-4);
        // mound over the body (sits a touch behind the head, stretches with speed)
        float am = al + 0.1, La = 0.3 + 0.2 * F.w, Lc = 0.19;
        float hm = 0.05 * H.w * exp(-(am * am) / (La * La) - (ac * ac) / (Lc * Lc));
        // bow ridge pushed ahead of the head
        float ab2 = al - 0.3, hb = 0.022 * H.w * F.w * exp(-(ab2 * ab2) / 0.012 - (ac * ac) / 0.07);
        wS += Fp * (-2.0 * am / (La * La) * hm - 2.0 * ab2 / 0.012 * hb) + Cn * (-2.0 * ac / (Lc * Lc) * hm - 2.0 * ac / 0.07 * hb);
        wG += hm * 16.0 + hb * 20.0;
      }
    }
    // clamp the slope so crests never flip the normal; fade with distance like the gel (no shimmer on far floors)
    float wl = length(wS);
    if (wl > 0.9) wS *= 0.9 / wl;
    float wFar = 1.0 - smoothstep(0.05, 0.16, length(fwidth(vWPos)));
    slope += vec2(dot(wS, T), dot(wS, Bt)) * gInk * wFar;
    gWake = clamp(wG, 0.0, 1.0) * gInk * wFar;
  }
${m7}
  vec3 nBase = vWNorm;
#ifdef USE_TEXLIB
  // surface relief from the texture library; ink fills the grooves so the relief fades out under it
  // (on corrugated metal the ink still follows the ribs)
  float keep = max((vFaceData.x > 4.5 && vFaceData.x < 5.5) ? 0.55 : 0.0, gTexKeep);   // containers + stairs
  nBase = texlibPerturbNormal(gTexN, T, Bt, vWNorm, gTexStr * (1.0 - gInk * (1.0 - max(keep, gInkKeep))));
#endif
  vec3 wn = normalize(nBase - slope.x * T - slope.y * Bt);
  normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
}`).replace("#include <lights_fragment_begin>", `#include <lights_fragment_begin>${l7}`).replace("#include <lights_fragment_end>", `#include <lights_fragment_end>${b7}`).replace("#include <aomap_fragment>", `#include <aomap_fragment>
if (uAO > 0.0 && vLightUv.x >= 0.0) {
  // baked ambient occlusion: full on sky/indirect light, a touch on the sun so contact shadows read in daylight
  float bao = mix(1.0, texture2D(uLight, vLightUv).r, uAO);
  reflectedLight.indirectDiffuse *= bao;
  reflectedLight.indirectSpecular *= mix(1.0, bao, 0.85);
  reflectedLight.directDiffuse *= mix(1.0, bao, 0.4);
}`).replace("#include <clearcoat_normal_fragment_begin>", `#include <clearcoat_normal_fragment_begin>
clearcoatNormal = normal;`).replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
${F7}`).replace("#include <lights_physical_fragment>", `#include <lights_physical_fragment>${V7}`).replace("#include <lights_fragment_maps>", `#include <lights_fragment_maps>${t7}`).replace("#include <opaque_fragment>", `outgoingLight = min(outgoingLight, vec3(5.0));
#include <opaque_fragment>`);
  }, N.grate && (I.side = hj, I.defines = { ...I.defines || {}, GRATE: 1 }), I.customProgramCacheKey = () => "inkwave-level-v6" + (N.grate ? "-grate" : ""), I;
}
const J7 = { waterY: -1.6 }, n7 = [{ id: "tidewater", name: "Tidewater Plaza", blurb: "A Victorian seaside square: fight round the Jubilee clock tower, under the colonnade and along the promenade.", theme: "day", times: { day: "day", dusk: "sunset" } }, { id: "kelpline", name: "Kelpline Terminal", blurb: "A container terminal at shift change: a gantry crane straddles the pier between two moored ships. Mind the water.", theme: "day", times: { day: "day", dusk: "sunset" } }, { id: "halyard", name: "Halyard Marina", blurb: "Floating docks, a tug on blocks and a car ferry moored across the middle. Mind the water.", theme: "golden", times: { day: "golden", dusk: "sunset" } }, { id: "saltpan", name: "Saltpan Basin", blurb: "An open salt works: sunken pans and boardwalks round a wind pump, with the shed roof and salt heap as high ground.", theme: "day", times: { day: "day", dusk: "sunset" } }, { id: "crossmarket", name: "Crossroads Market", blurb: "Narrow shop streets and an iron gallery close in on the glass Market Hall, where the No. 3 tram waits under the clock.", theme: "golden", times: { day: "golden", dusk: "sunset" } }, { id: "lockgate", name: "Lockgate Canals", blurb: "Drained locks through a brick warehouse district: the canal splits the map, so hold the bridge and the gates.", theme: "day", times: { day: "day", dusk: "sunset" } }, { id: "terraces", name: "Terrace Heights", blurb: "A whitewashed hill village: hold the terraces, fight for the stairs and drop in on the Piazzetta.", theme: "golden", times: { day: "golden", dusk: "sunset" } }, { id: "cargo", name: "Cargo Terminal", blurb: "A container terminal at shift change: a gantry crane straddles the pier between two moored box ships.", theme: "day", times: { day: "day", dusk: "sunset" }, onlineOnly: true, noBots: true, noBoss: true }];
n7.filter((j) => !j.onlineOnly);
const _M = J7.waterY, DD = Math.PI / 180, Pz = 48, yz = 24, Z7 = 0.1, W7 = 10, Wg = { day: { sunAz: 222, sunEl: 39, sunColor: "#fff0dc", sunIntensity: 3.3, skySun: 2.75, hemiSky: "#b4d0ff", hemiGround: "#dcc3a0", hemiGroundK: 2.2, hemiIntensity: 0.45, envK: 0.45, zenith: "#1d6fdc", skyMid: "#5aa8f2", horizon: "#d4ecfa", ground: "#6fa4bd", horizonGlow: "#fff4dc", horizonGlowK: 0.05, glowColor: "#fff0cc", glow: [900, 0.9, 7, 0.06], sunDisk: "#fff6e6", sunDiskK: 34, sunRadius: 1.25, cloudLit: "#ffffff", cloudLitK: 0.94, cloudShade: "#a9bfdc", cloud: [0.44, 1, 1, 0.5], seaDeep: "#0a4f8a", seaShallow: "#12a7b8", seaCrest: "#48e2d6", foam: "#f7fcff", seaAmbientK: 0.62, sunSpec: 1, waveStrength: 1, haze: [1 / 1850, 0.9, 260], fog: [25, 900], night: 0, grade: { uExposure: 0.9, uSat: 1.1, uVib: 0.12, uContrast: 1.09, uLift: 0, uVignette: 0.2, uShadowTint: [0.92, 0.97, 1.1], uHighTint: [1.035, 1, 0.955] }, marina: { channel: "#0b4552", shade: "#05121a", calm: 0.55, lap: 1, caustic: 2, wet: 0.5 } }, sunset: { sunAz: 206, sunEl: 15, sunColor: "#ffac4c", sunIntensity: 4.6, skySun: 3.7, hemiSky: "#5e7fd6", hemiGround: "#c08a66", hemiGroundK: 1.6, hemiIntensity: 0.6, envK: 0.42, zenith: "#1b2768", skyMid: "#56509e", horizon: "#ffa266", ground: "#4a4f7a", horizonGlow: "#ff8a4a", horizonGlowK: 0.55, glowColor: "#ffb35c", glow: [260, 2.2, 5.5, 0.55], sunDisk: "#ffd9a0", sunDiskK: 22, sunRadius: 1.7, cloudLit: "#ffc39a", cloudLitK: 0.95, cloudShade: "#62598f", cloud: [0.4, 1, 1, 0.44], seaDeep: "#1a2c5e", seaShallow: "#2f6f8f", seaCrest: "#6a8fc4", foam: "#ffe2cf", seaAmbientK: 0.5, sunSpec: 1.35, waveStrength: 1, haze: [1 / 1100, 0.9, 260], fog: [25, 800], night: 1, grade: { uExposure: 1, uSat: 1.05, uVib: 0.1, uContrast: 1.07, uLift: 0, uVignette: 0.28, uShadowTint: [0.88, 0.96, 1.16], uHighTint: [1.07, 1, 0.88], bloom: [0.4, 0.55, 1.7] }, marina: { channel: "#132140", shade: "#04060d", calm: 0.55, lap: 1, caustic: 1.7, wet: 0.55 } }, golden: { sunAz: 194, sunEl: 28, sunColor: "#ffd9ae", sunIntensity: 3.6, skySun: 3.35, hemiSky: "#aecaf0", hemiGround: "#cfb08a", hemiGroundK: 1.8, hemiIntensity: 0.42, envK: 0.5, zenith: "#2a62b2", skyMid: "#72a3d6", horizon: "#f0d8b8", ground: "#5b7d90", horizonGlow: "#ffbf80", horizonGlowK: 0.3, glowColor: "#ffd29a", glow: [480, 1.5, 6, 0.24], sunDisk: "#fff1d8", sunDiskK: 26, sunRadius: 1.35, cloudLit: "#f4fbf4", cloudLitK: 0.95, cloudShade: "#909fbc", cloud: [0.42, 1, 0.85, 0.46], cloudCov: 0.4, cloudSeed: 7, seaDeep: "#0a3f53", seaShallow: "#16707a", seaCrest: "#5fc9b6", foam: "#fff6ea", seaAmbientK: 0.6, sunSpec: 1.2, waveStrength: 0.8, haze: [1 / 1650, 0.9, 240], fog: [30, 1e3], night: 0, shafts: 1, grade: { uExposure: 0.95, uSat: 1.05, uVib: 0.12, uContrast: 1.1, uLift: 0, uVignette: 0.22, uShadowTint: [0.93, 0.98, 1.09], uHighTint: [1.06, 1, 0.925] }, marina: { channel: "#0d3a37", shade: "#06110f", calm: 0.55, lap: 1, caustic: 2.2, wet: 0.55 } } }, LO = (j, A = 1) => new lA(j).multiplyScalar(A), HQ = `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vnoise2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1.0,0.0)), u.x), mix(hash12(i+vec2(0.0,1.0)), hash12(i+vec2(1.0,1.0)), u.x), u.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f*f*(3.0-2.0*f);
  float a = hash13(i), b = hash13(i+vec3(1.0,0.0,0.0)), c = hash13(i+vec3(0.0,1.0,0.0)), d = hash13(i+vec3(1.0,1.0,0.0));
  float e = hash13(i+vec3(0.0,0.0,1.0)), f1 = hash13(i+vec3(1.0,0.0,1.0)), g = hash13(i+vec3(0.0,1.0,1.0)), h = hash13(i+vec3(1.0,1.0,1.0));
  return mix(mix(mix(a,b,u.x), mix(c,d,u.x), u.y), mix(mix(e,f1,u.x), mix(g,h,u.x), u.y), u.z); }
float fbm2(vec2 p){ float s = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++){ s += a * vnoise2(p); p = m * p + 3.7; a *= 0.5; } return s / 0.96875; }
// Round cumulus lobes: nearest jittered feature point; x = 1 - (d/r)^2 (>0 inside a puff), yz = offset from its centre.
vec3 lobes(vec2 p, float period){
  vec2 i = floor(p), f = fract(p);
  // smooth (soft-min) blend of neighbouring lobes → no Voronoi seams; creases between puffs stay soft
  float acc = 0.0; vec2 ob = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 c = i + g;
    if (period > 0.0) c.x = mod(c.x, period);
    vec2 h = vec2(hash12(c), hash12(c + 17.31));
    float rad = 0.6 + 0.35 * hash12(c + 5.13);
    vec2 o = (g + 0.2 + 0.6 * h - f) / rad;
    float w = exp(-5.0 * dot(o, o));
    acc += w; ob -= w * o;
  }
  acc = max(acc, 1e-6);
  return vec3(1.0 + log(acc) / 5.0, ob / acc);
}
float fbm3(vec3 p){ float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ s += a * vnoise3(p); p = p * 2.02 + vec3(1.7, 9.2, 4.1); a *= 0.5; } return s / 0.96875; }
`, MP = `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uZenith;
uniform vec3 uSkyMid;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform vec3 uHorizonGlow;
uniform vec3 uGlowColor;
uniform vec4 uGlowParams;   // x tight power, y tight strength, z horizon band sharpness, w wide strength
uniform vec4 uHaze;         // x density (1/m), y max, z height falloff (m)
uniform float uNight;

vec3 skyGradient(vec3 d) {
  float h = d.y;
  float hp = max(h, 0.0);
  float t = sqrt(hp);
  vec3 c = mix(uHorizon, uSkyMid, smoothstep(0.0, 0.52, t));
  c = mix(c, uZenith, smoothstep(0.4, 1.0, t));
  vec2 sh = normalize(uSunDir.xz + vec2(1e-5));
  vec2 dh = normalize(d.xz + vec2(1e-5));
  float az = dot(sh, dh) * 0.5 + 0.5;
  float band = exp(-hp * uGlowParams.z);
  c += uHorizonGlow * band * (0.2 + 0.8 * az * az * az);
  float sd = max(dot(normalize(vec3(d.x, hp, d.z)), uSunDir), 0.0);
  c += uGlowColor * (pow(sd, uGlowParams.x) * uGlowParams.y + pow(sd, 6.0) * uGlowParams.w);
  // dusk: the horizon opposite the sun lies in the earth's shadow — cooler and dimmer than the sunward side, so the
  // far shore / skyline away from the sun hazes into lavender-blue instead of glowing salmon (sky, env map and haze)
  float anti = (1.0 - az) * (1.0 - az);
  c *= mix(vec3(1.0), vec3(0.7, 0.74, 0.95), uNight * anti * exp(-hp * 2.5));
  c = mix(c, uGround, smoothstep(0.0, -0.22, h));
  return c;
}
vec3 hazeColor(vec3 d) {
  vec3 h = skyGradient(normalize(vec3(d.x, clamp(d.y, 0.0, 1.0) * 0.3, d.z)));
  h = mix(h, uSkyMid * 1.08 + uHorizon * 0.12, 0.22);   // aerial perspective: distant land turns bluer
  // looking down through the haze you see scattered ambient, not the glowing horizon band
  return mix(h, uGround * 1.15 + uSkyMid * 0.25, smoothstep(-0.02, -0.45, d.y) * 0.75);
}
vec3 applyHaze(vec3 col, vec3 wp) {
  vec3 dv = wp - cameraPosition;
  float dist = length(dv);
  vec3 dir = dv / max(dist, 1e-3);
  float hf = exp(-max(wp.y, 0.0) / uHaze.z);
  float f = 1.0 - exp(-dist * uHaze.x * mix(0.45, 1.0, hf));
  return mix(col, hazeColor(dir), min(f, uHaze.y));
}
`, Yy = 2048, Kg = 640, K7 = `
${MP}
uniform vec2 uRes;
uniform vec3 uCloudLit;
uniform vec3 uCloudShade;
uniform vec3 uSunCol;
uniform vec4 uCloudParams;
uniform float uSeed;
uniform float uCov;
vec3 hash33c(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0; }
vec4 hash42c(vec2 p) { vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099)); p4 += dot(p4, p4.wzxy + 33.33); return fract((p4.xxyz + p4.yzzw) * p4.zywx); }
float gn3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash33c(i), f), b = dot(hash33c(i + vec3(1, 0, 0)), f - vec3(1, 0, 0));
  float c = dot(hash33c(i + vec3(0, 1, 0)), f - vec3(0, 1, 0)), d = dot(hash33c(i + vec3(1, 1, 0)), f - vec3(1, 1, 0));
  float e = dot(hash33c(i + vec3(0, 0, 1)), f - vec3(0, 0, 1)), g = dot(hash33c(i + vec3(1, 0, 1)), f - vec3(1, 0, 1));
  float h = dot(hash33c(i + vec3(0, 1, 1)), f - vec3(0, 1, 1)), k = dot(hash33c(i + vec3(1, 1, 1)), f - vec3(1, 1, 1));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
}
const float HB = 1150.0, CELL = 2700.0, RMAX = 55000.0, TOPMAX = 3300.0;
// signed distance (m) to the cumulus field: flattened-base ellipsoid heaps per cell, smooth-merged, then eroded into
// cauliflower lobes by billowy noise that grows toward the tops. hf = height fraction inside the nearest heap.
float smin2(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float ellip(vec3 p, vec2 c, float cy, float r, float ht, float flt) {
  vec3 q = vec3((p.x - c.x) / r, (p.y - cy) / ht, (p.z - c.y) / r);
  q.y = q.y < 0.0 ? q.y * flt : q.y;
  return (length(q) - 1.0) * min(r, ht);
}
// cumulus: a wide low base heap with up to two bubbling turrets on top, smooth-merged across neighbouring cells
float cloudSD(vec3 p, out float hf) {
  vec2 c = floor(p.xz / CELL);
  float sd = 1e5; hf = 0.0; float best = 1e5;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cc = c + vec2(float(i), float(j));
    vec4 h = hash42c(cc + uSeed);
    if (h.x > uCov) continue;
    vec2 ctr = (cc + 0.2 + 0.6 * h.yz) * CELL;
    float r = mix(560.0, 1500.0, h.w * h.w);
    vec4 h2 = hash42c(cc.yx + 17.3);
    float tower = h2.x;
    float hb = HB + 160.0 * h2.y;
    float ht = r * mix(0.4, 0.6, h2.z);
    float e = ellip(p, ctr, hb, r, ht, 2.5);
    float top = hb + ht;
    for (int k = 0; k < 2; k++) {
      vec4 hk = hash42c(cc * 1.31 + vec2(11.0 + float(k) * 7.0, 3.0));
      if (hk.x > 0.85) continue;
      vec2 o = (hk.yz - 0.5) * r * 0.8;
      float rr = r * mix(0.4, 0.62, hk.w) * (tower > 0.8 ? 1.25 : 1.0);
      float hh = rr * mix(0.85, 1.25, hk.x) * (tower > 0.8 ? 1.6 : 1.0);
      float cy = hb + ht * mix(0.2, 0.55, hk.y);
      e = smin2(e, ellip(p, ctr + o, cy, rr, hh, 1.6), 220.0);
      top = max(top, cy + hh);
    }
    if (e < best) { best = e; hf = clamp((p.y - hb) / max(top - hb, 1.0), 0.0, 1.0); }
    sd = smin2(sd, e, 380.0);
  }
  return sd;
}
float cloudDens(vec3 p, out float hf, out float sdo) {
  float sd = cloudSD(p, hf);
  sdo = sd;
  if (sd > 520.0) return 0.0;
  vec3 w = p / 520.0 + vec3(uSeed * 3.1, 0.0, 0.0);
  float b = 1.0 - abs(gn3(w)) * 1.9;                          // billows
  b += 0.5 * (1.0 - abs(gn3(w * 2.3 + 11.7)) * 1.9);
  float fine = gn3(w * 5.1 + 3.3);
  sd += (0.55 - b * 0.45) * mix(310.0, 430.0, hf) + fine * 22.0;
  sdo = sd;
  return clamp(-sd / 42.0, 0.0, 1.0) * smoothstep(HB - 120.0, HB + 60.0, p.y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float az = (uv.x - 0.5) * 6.28318531;
  float sy = pow(uv.y, 1.6);
  float cy = sqrt(max(1.0 - sy * sy, 0.0));
  vec3 d = vec3(cos(az) * cy, sy, sin(az) * cy);
  vec3 L = vec3(0.0); float T = 1.0;
  if (d.y > 0.004) {
    float t0 = (HB - 60.0) / d.y, t1 = min(TOPMAX / d.y, RMAX);
    if (t0 < t1) {
      float span = t1 - t0;
      const float dt = 16.0;
      float t = t0;
      float cosT = dot(d, uSunDir);
      float g1 = 0.62, g2 = -0.18;
      float ph = min(mix((1.0 - g1 * g1) / pow(1.0 + g1 * g1 - 2.0 * g1 * cosT, 1.5), (1.0 - g2 * g2) / pow(1.0 + g2 * g2 - 2.0 * g2 * cosT, 1.5), 0.62), 2.6);
      float tHit = -1.0;
      for (int s = 0; s < 320; s++) {
        if (t > t1 || T < 0.015) break;
        vec3 p = d * t;
        float hf, sdv;
        float den = cloudDens(p, hf, sdv);
        if (den <= 0.002) { t += clamp(sdv * 0.6, dt, 900.0); continue; }   // sphere-trace the empty space
        {
          if (tHit < 0.0) tHit = t;
          // light march toward the sun (self-shadowing)
          float od = 0.0, ls = 45.0; vec3 lp = p;
          for (int k = 0; k < 6; k++) { lp += uSunDir * ls; float hk, sk; od += cloudDens(lp, hk, sk) * ls; ls *= 1.9; }
          float Tl = exp(-od * 0.0105);
          float powder = 1.0 - exp(-den * 3.0);
          float sun = Tl * mix(0.55, 1.0, powder) * ph * 1.35;
          float amb = mix(0.6, 1.0, smoothstep(0.0, 0.9, hf)) * (0.62 + 0.38 * powder);
          vec3 S = uSunCol * uCloudLit * sun + uCloudShade * amb * 0.95;
          float sig = den * 0.02;
          float Ts = exp(-sig * dt);
          L += T * S * (1.0 - Ts);
          T *= Ts;
        }
        t += dt;
      }
      if (tHit > 0.0) {
        // aerial perspective: far heaps melt into the horizon haze
        float f = 1.0 - exp(-tHit / 26000.0);
        vec3 hz = hazeColor(d);
        L = mix(L, (1.0 - T) * hz, clamp(f * 0.9, 0.0, 0.92));
        // fade the far edge of the field so there is no hard cut-off line
        float edge = smoothstep(RMAX, RMAX * 0.7, tHit);
        L *= edge; T = mix(1.0, T, edge);
      }
    }
  }
  gl_FragColor = vec4(L, 1.0 - T);
}
`, X7 = `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  gl_Position = vec4(p.xy, p.w * 0.99999, p.w);
}
`, _7 = `
${MP}
${HQ}
uniform vec3 uSunDisk;
uniform float uSunCos;
uniform vec3 uCloudLit;
uniform vec3 uCloudShade;
uniform vec4 uCloudParams;   // x overhead coverage, y horizon bank amount, z drift speed, w bank height
uniform sampler2D uCloudTex;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  vec3 col = skyGradient(d);
  float sd = dot(d, uSunDir);
  float cloudA = 0.0;
  vec2 sunH = normalize(uSunDir.xz + vec2(1e-4));

  // ---- baked volumetric cumulus (slow drift = rotation of the whole field) ----
  {
    float u = atan(d.z, d.x) / 6.28318531 + 0.5 + uTime * 0.00035 * uCloudParams.z;
    float v = pow(clamp(d.y, 0.0, 1.0), 1.0 / 1.6);
    vec4 cl = textureLod(uCloudTex, vec2(u, v), 0.0);
    cl *= smoothstep(-0.002, 0.012, d.y);
    col = col * (1.0 - cl.a) + cl.rgb;
    cloudA = cl.a;
  }
  // ---- high cirrus veil: faint, streaky, far above the cumulus ----
  if (d.y > 0.02) {
    vec2 cp = d.xz / (d.y + 0.08) * 0.9 + vec2(uTime * 0.004, uTime * 0.0015) * uCloudParams.z;
    vec2 cs = vec2(cp.x * 0.35 + cp.y * 0.9, cp.y * 0.35 - cp.x * 0.9);
    float ci = fbm2(cs * vec2(0.55, 3.2) + 4.0) - 0.52;
    ci = smoothstep(0.02, 0.3, ci) * smoothstep(0.06, 0.35, d.y) * (1.0 - cloudA) * 0.11;
    col = mix(col, uCloudLit * 0.95 + uGlowColor * 0.1, ci);
  }
#if defined(SKY_SHAFTS) && !defined(ENV_PASS)
  // crepuscular rays: walk from this direction toward the sun across the baked cloud layer — clear paths glow, paths
  // behind a heap fall into its shade, so shafts fan out from the sun between the clouds
  {
    float sdo = dot(d, uSunDir);
    if (sdo > 0.35 && d.y > -0.05) {
      float occ = 0.0;
      for (int k = 0; k < 6; k++) {
        vec3 s = normalize(mix(d, uSunDir, (float(k) + 0.5) / 6.0));
        float uu = atan(s.z, s.x) / 6.28318531 + 0.5 + uTime * 0.00035 * uCloudParams.z;
        float vv = pow(clamp(s.y, 0.0, 1.0), 1.0 / 1.6);
        occ += textureLod(uCloudTex, vec2(uu, vv), 0.0).a * smoothstep(-0.002, 0.012, s.y);
      }
      occ /= 6.0;
      float w = smoothstep(0.35, 1.0, sdo);
      w *= w;
      col += uGlowColor * (1.0 - occ) * w * 0.1 * (1.0 - cloudA);
      col *= 1.0 - occ * w * 0.2 * (1.0 - cloudA);
    }
  }
#endif

#ifndef ENV_PASS
  // ---- sun disk + tight halo (HDR → blooms) ----
  float aa = 0.00012;
  float disk = smoothstep(uSunCos - aa, uSunCos + aa, sd);
  col += uSunDisk * disk * (1.0 - cloudA * 0.94);
  col += uSunDisk * 0.02 * pow(max(sd, 0.0), 1400.0) * (1.0 - cloudA * 0.6);
#else
  // env map: soft sun lobe only (a tiny HDR disk would sparkle in rough mips)
  col += uGlowColor * pow(max(sd, 0.0), 64.0) * 1.2;
  col *= 0.72;
#endif

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
#ifndef ENV_PASS
  gl_FragColor.rgb += (hash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
#endif
}
`, vU = `
uniform vec4 uRects[${Pz}];
uniform vec2 uRectAx[${Pz}];
uniform int uRectCount;
// axis-aligned rect given as (minX, minZ, maxX, maxZ) — the arena bounds
float sdRect(vec2 p, vec4 r) {
  vec2 c = (r.xy + r.zw) * 0.5; vec2 h = (r.zw - r.xy) * 0.5;
  vec2 q = abs(p - c) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
// oriented rect: r = (centre, half extents), a = local x axis
float sdORect(vec2 p, vec4 r, vec2 a) {
  vec2 d = p - r.xy;
  vec2 q = abs(vec2(dot(d, a), dot(d, vec2(-a.y, a.x)))) - r.zw;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
#ifdef DECK_FIELD
// more rects than uniform slots: the deck union (R) and the marina hull union (G) baked into a signed-distance field
// (Environment._bakeDeckField), exact within uDeckFieldK.y of any rect; past that, the distance to the rects' AABB
uniform sampler2D uDeckField;
uniform vec4 uDeckFieldRect;   // field origin (x, z), 1 / field size (x, z)
uniform vec4 uDeckFieldK;      // x: texel (m), y: exact reach (m)
uniform vec4 uDeckBox;         // AABB of the deck rects (minX, minZ, maxX, maxZ)
uniform vec4 uWetBox;          // AABB of the hull rects
vec2 deckField(vec2 p) { return textureLod(uDeckField, clamp((p - uDeckFieldRect.xy) * uDeckFieldRect.zw, 0.0, 1.0), 0.0).rg; }
float sdDeck(vec2 p) { return max(deckField(p).r, sdRect(p, uDeckBox)); }
#else
float sdDeck(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < ${Pz}; i++) { if (i >= uRectCount) break; d = min(d, sdORect(p, uRects[i], uRectAx[i])); }
  return d;
}
#endif
#ifdef MARINA
uniform vec4 uWet[${yz}];
uniform vec2 uWetAx[${yz}];
uniform int uWetCount;
uniform vec4 uArena;        // arena bounds (minX, minZ, maxX, maxZ): the harbour basin around it is sheltered
float basinK(vec2 p) { return smoothstep(60.0, 210.0, sdRect(p, uArena)); }   // 0 in the basin → 1 open sea
#ifdef DECK_FIELD
float sdWet(vec2 p) { return max(deckField(p).g, sdRect(p, uWetBox)); }
#else
float sdWet(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < ${yz}; i++) { if (i >= uWetCount) break; d = min(d, sdORect(p, uWet[i], uWetAx[i])); }
  return d;
}
#endif
#endif
`, $7 = `
// long gentle swell; returns height (unit amplitude) and writes gradient
float swell(vec2 p, float t, out vec2 g) {
  float h = 0.0; g = vec2(0.0);
  vec2 k; float ph;
  k = vec2(0.110, 0.047); ph = dot(p, k) + t * 0.95;        h += 0.45 * sin(ph); g += 0.45 * k * cos(ph);
  k = vec2(-0.052, 0.097); ph = dot(p, k) + t * 1.13 + 1.7; h += 0.35 * sin(ph); g += 0.35 * k * cos(ph);
  k = vec2(0.173, -0.141); ph = dot(p, k) + t * 1.61 + 4.1; h += 0.20 * sin(ph); g += 0.20 * k * cos(ph);
  return h;
}
float swellAmp(float dDeck) { return mix(0.035, 0.16, smoothstep(3.0, 70.0, dDeck)); }
`, AB = `
${HQ}
uniform sampler2D uReflTex;
uniform mat4 uReflMat;
uniform float uReflOn;
uniform samplerCube uFarCube;   // far scenery (hills, city, port, bridge) baked from the arena centre, alpha = coverage
uniform float uFarOn;
uniform sampler2D uCloudTex;
uniform vec4 uCloudParams;
uniform vec3 uChannelCol;
uniform vec3 uShadeCol;
uniform vec4 uMarinaK;     // x calm (wave-normal scale hugging faces), y face-ripple strength, z reflection distortion (m)
// distance (m) + outward unit gradient (world xz) to an oriented rect / the nearest rect of a set. The gradient is
// found in the rect's frame and rotated back (g.x·a + g.y·(−a.y, a.x)); exact for axis-aligned rects (a = (1, 0)).
vec3 sdORectG(vec2 p, vec4 r, vec2 a) {
  vec2 b = vec2(-a.y, a.x);
  vec2 d = p - r.xy;
  vec2 l = vec2(dot(d, a), dot(d, b));
  vec2 s = vec2(l.x < 0.0 ? -1.0 : 1.0, l.y < 0.0 ? -1.0 : 1.0);
  vec2 q = abs(l) - r.zw;
  vec3 o;
  if (max(q.x, q.y) > 0.0) { vec2 m = max(q, 0.0); float len = max(length(m), 1e-4); o = vec3(len, s * m / len); }
  else o = q.x > q.y ? vec3(q.x, s.x, 0.0) : vec3(q.y, 0.0, s.y);
  return vec3(o.x, o.y * a + o.z * b);
}
#ifdef DECK_FIELD
// field mode: both unions + outward gradients from five taps (central differences one texel apart)
void deckWetG(vec2 p, out vec3 gd, out vec3 gw) {
  float h = uDeckFieldK.x;
  vec2 c = deckField(p);
  vec2 dx = deckField(p + vec2(h, 0.0)) - deckField(p - vec2(h, 0.0));
  vec2 dz = deckField(p + vec2(0.0, h)) - deckField(p - vec2(0.0, h));
  vec2 nd = vec2(dx.x, dz.x), nw = vec2(dx.y, dz.y);
  float ld = length(nd), lw = length(nw);
  gd = vec3(max(c.x, sdRect(p, uDeckBox)), ld > 1e-5 ? nd / ld : vec2(0.0, 1.0));
  gw = vec3(max(c.y, sdRect(p, uWetBox)), lw > 1e-5 ? nw / lw : vec2(0.0, 1.0));
}
#else
vec3 sdDeckG(vec2 p) {
  vec3 b = vec3(1e5, 0.0, 1.0);
  for (int i = 0; i < ${Pz}; i++) { if (i >= uRectCount) break; vec3 r = sdORectG(p, uRects[i], uRectAx[i]); if (r.x < b.x) b = r; }
  return b;
}
vec3 sdWetG(vec2 p) {
  vec3 b = vec3(1e5, 0.0, 1.0);
  for (int i = 0; i < ${yz}; i++) { if (i >= uWetCount) break; vec3 r = sdORectG(p, uWet[i], uWetAx[i]); if (r.x < b.x) b = r; }
  return b;
}
#endif
vec3 skyRefl(vec3 R) {
  vec3 c = skyGradient(normalize(R + vec3(0.0, 0.015, 0.0)));
  float u = atan(R.z, R.x) / 6.28318531 + 0.5 + uTime * 0.00035 * uCloudParams.z;
  float v = pow(clamp(R.y, 0.0, 1.0), 1.0 / 1.6);
  vec4 cl = textureLod(uCloudTex, vec2(u, v), 0.0) * smoothstep(-0.002, 0.012, R.y);
  return c * (1.0 - cl.a) + cl.rgb;
}
void main() {
  vec3 P = vWorld;
  vec3 toCam = cameraPosition - P;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec2 p = P.xz;
  float detail = 1.0 - smoothstep(35.0, 380.0, dist);

  // the per-rect work only matters near the stage: past 24 m from the arena every face is out of reach
  float dA = sdRect(p, uArena);
  vec3 gw = vec3(dA, 0.0, 1.0), gd = gw;
  if (dA < 24.0) {
#ifdef DECK_FIELD
    deckWetG(p, gd, gw);
    if (gw.x < -0.03) discard;
#else
    gw = sdWetG(p);
    if (gw.x < -0.03) discard;                     // inside a hull / over a sunken floor: no sea
    gd = sdDeckG(p);
#endif
  }
  vec3 gs = gd.x < gw.x ? gd : gw;                 // nearest face: distance + outward normal
  float dS = gs.x;
  float shelter = smoothstep(0.3, 9.0, max(dS, 0.0));

  vec4 w1 = texture2D(uWaveTex, p * 0.041 + uTime * vec2(0.012, 0.007));
  vec4 w2 = texture2D(uWaveTex, p * 0.097 + vec2(0.37, 0.61) + uTime * vec2(-0.019, 0.013));
  vec4 w3 = texture2D(uWaveTex, p * 0.0083 + uTime * vec2(0.0034, -0.0022));
  float nearF = 1.0 - smoothstep(6.0, 40.0, dist);
  vec4 w4 = texture2D(uWaveTex, p * 0.29 + vec2(0.71, 0.13) + uTime * vec2(0.031, -0.026));
  vec2 g = (w3.xy - 0.5) * 0.9 + ((w1.xy - 0.5) * 0.85 + (w2.xy - 0.5) * 0.55) * mix(0.3, 1.0, detail);
  float basin = smoothstep(60.0, 210.0, dA);   // = basinK(p)
  g *= uWaveStrength * 0.42 * mix(uMarinaK.x, 1.0, shelter) * mix(0.62, 1.0, basin);
  // fine cat's-paw ripples close to the camera are not damped: glassy, never dead flat
  g += (w4.xy - 0.5) * 0.45 * nearF * uWaveStrength * 0.42 * 0.85;
  // ripples bounced off the faces: crests parallel to the nearest face, running outward, gone within ~3 m
  float along = dot(p, vec2(-gs.z, gs.y));
  float ph1 = dS * 4.4 - uTime * 1.8 + sin(along * 0.62 + uTime * 0.55) * 0.9 + w2.z * 3.0;
  float ph2 = dS * 7.1 - uTime * 2.6 + sin(along * 1.25 - uTime * 0.45) * 0.8 + w1.z * 2.2;
  float lapA = uMarinaK.y * exp(-max(dS, 0.0) * 0.85) * smoothstep(-0.25, 0.1, dS) * (0.4 + 0.9 * w3.z);
  g += gs.yz * lapA * (0.055 * sin(ph1) + 0.03 * sin(ph2)) * detail;
  vec2 gRip = g;
  g += vSwellGrad;
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  float crest = (w1.z * 0.9 + w2.z * 0.5 + w3.z * 0.9) / 2.3;

  vec2 fuv = (p - uFoamRect.xy) * uFoamRect.zw;
  float inField = step(0.0, fuv.x) * step(fuv.x, 1.0) * step(0.0, fuv.y) * step(fuv.y, 1.0);
  float dObj = mix(uMarinaK.w, texture2D(uFoamTex, clamp(fuv, 0.0, 1.0)).r * uMarinaK.w, inField);

  // light: the shadow map (it covers every slab and hull here); no sky / sun under the floating slabs
  float shadow = getShadowMask();
  float under = smoothstep(0.0, -0.8, gd.x);
  float skyVis = mix(0.55, 1.0, smoothstep(-0.2, 3.0, dS)) * (1.0 - 0.9 * under);

  vec3 body = mix(uSeaDeep, uSeaShallow, clamp(0.4 + 0.5 * (w3.z - 0.5), 0.0, 1.0));
  body = mix(uChannelCol, body, 0.3 + 0.7 * shelter);
  body += uSeaCrest * smoothstep(0.55, 0.95, crest) * (0.3 + 0.7 * shadow) * 0.3 * mix(0.25, 1.0, detail) * shelter;
  float NdL = max(dot(N, uSunDir), 0.0);
  vec3 lit = body * (uSeaAmbient * skyVis + uSunLight * (0.35 + 0.65 * NdL) * shadow * 0.5);

  // reflection: sky + clouds, then the planar reflection of everything standing above the water
  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 refl = skyRefl(R);
  float occl = 0.0;
  if (uFarOn > 0.5) {
    vec4 fc = textureLod(uFarCube, R, clamp(log2(1.0 + dist * 0.008) + length(gRip) * 4.0, 0.0, 5.0));
    float fa = clamp(fc.a, 0.0, 1.0);
    refl = refl * (1.0 - fa) + fc.rgb;
    occl = fa;
  }
  refl *= skyVis;
  if (uReflOn > 0.5) {
    vec2 off = (N.xz - vSwellGrad * 0.5) * uMarinaK.z;
    vec4 rp = uReflMat * vec4(P.x + off.x, ${_M.toFixed(3)}, P.z + off.y, 1.0);
    vec2 ruv = rp.xy / max(rp.w, 1e-4);
    float lod = clamp(log2(1.0 + dist * 0.035) + length(gRip) * 5.0, 0.0, 4.5);
    vec4 rc = textureLod(uReflTex, clamp(ruv, 0.001, 0.999), lod);
    float ra = clamp(rc.a, 0.0, 1.0);   // coverage: anything additive in the mirror must never push it past 1
    refl = refl * (1.0 - ra) + rc.rgb;
    occl = max(occl, ra);
  }
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  float fres = min((0.025 + 0.975 * pow(1.0 - NdV, 5.0)) * 1.1, 1.0);
  vec3 col = mix(lit, refl, fres);
  col = mix(col, uShadeCol * (uSeaAmbient + 0.02), under * 0.85);

  // sun glints (blocked by shadows and by anything reflected in front of the sky)
  float rs = clamp(dot(R, uSunDir), 0.0, 1.0);
  float spec = pow(rs, 1600.0) * 9.0 + pow(rs, 200.0) * 0.38 + pow(rs, 24.0) * 0.04;
  col += uSunLight * spec * uSunSpec * shadow * (1.0 - under) * (1.0 - occl);

  // foam — calm harbour water: a thin, broken froth line where the water laps a hull or anything standing in it (the
  // contour field: piles, fenders, moored boats), a few drifting clumps, faint rings pushed off by the lapping
  float dC = min(gw.x, dObj);                       // nearest thing standing in the water
  if (dC < 1.2) {
    float fn = w2.z * 0.6 + w1.z * 0.4;
    // non-repeating value noise (the wave texture tiles every ~1 m at froth scale)
    float nA = vnoise2(p * 3.3 + uTime * vec2(0.13, -0.09));
    float nB = vnoise2(p * 0.8 + vec2(17.0, 3.0) - uTime * vec2(0.05, 0.03));
    float froth = nA * 0.55 + nB * 0.45;
    float contact = smoothstep(0.03 + 0.07 * nA, 0.0, dC) * (0.35 + 0.65 * smoothstep(0.3, 0.7, nB)) * smoothstep(-0.04, 0.0, gw.x);
    float clump = smoothstep(0.66, 0.86, froth) * smoothstep(0.7, 0.05, dC) * smoothstep(0.35, 0.8, nB);
    float lapF = smoothstep(0.05, 0.0, abs(fract(dC * 1.5 - uTime * 0.2 + fn * 0.4) - 0.5) - 0.46)
      * smoothstep(1.1, 0.1, dC) * smoothstep(0.4, 0.75, nB);
    float foam = clamp(contact * 0.7 + clump * 0.35 + lapF * 0.15, 0.0, 1.0) * (1.0 - 0.8 * under);
    vec3 foamCol = uFoamColor * (uSeaAmbient * 1.2 * skyVis + uSunLight * (0.3 + 0.7 * shadow) * 0.55);
    col = mix(col, foamCol, foam * detail);
  }

  col = applyHaze(col, P);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`, MB = `
#include <common>
#include <shadowmap_pars_vertex>
uniform float uTime;
${vU}
${$7}
varying vec3 vWorld;
varying vec2 vSwellGrad;
varying float vDeckD;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  float dd = sdDeck(worldPosition.xz);
#ifdef MARINA
  dd = min(dd, sdWet(worldPosition.xz));
#endif
  float amp = swellAmp(dd);
#ifdef MARINA
  amp *= mix(0.45, 1.0, basinK(worldPosition.xz));
#endif
  vec2 g;
  float h = swell(worldPosition.xz, uTime, g);
  worldPosition.y += h * amp;
  vWorld = worldPosition.xyz;
  vSwellGrad = g * amp;
  vDeckD = dd;
  vec4 mvPosition = viewMatrix * worldPosition;
  vec3 transformedNormal = normalMatrix * vec3(0.0, 1.0, 0.0);
  #include <shadowmap_vertex>
  gl_Position = projectionMatrix * mvPosition;
}
`, jB = `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
${MP}
${vU}
uniform sampler2D uWaveTex;
uniform sampler2D uFoamTex;
uniform vec4 uFoamRect;
uniform vec3 uSeaDeep;
uniform vec3 uSeaShallow;
uniform vec3 uSeaCrest;
uniform vec3 uFoamColor;
uniform vec3 uSunLight;
uniform vec3 uSeaAmbient;
uniform float uSunSpec;
uniform float uWaveStrength;
varying vec3 vWorld;
varying vec2 vSwellGrad;
varying float vDeckD;

#ifdef MARINA
${AB}
#else
void main() {
  vec3 P = vWorld;
  vec3 toCam = cameraPosition - P;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec2 p = P.xz;
  float detail = 1.0 - smoothstep(35.0, 380.0, dist);

  vec4 w1 = texture2D(uWaveTex, p * 0.041 + uTime * vec2(0.012, 0.007));
  vec4 w2 = texture2D(uWaveTex, p * 0.097 + vec2(0.37, 0.61) + uTime * vec2(-0.019, 0.013));
  vec4 w3 = texture2D(uWaveTex, p * 0.0083 + uTime * vec2(0.0034, -0.0022));
  float nearF = 1.0 - smoothstep(6.0, 40.0, dist);
  vec4 w4 = texture2D(uWaveTex, p * 0.29 + vec2(0.71, 0.13) + uTime * vec2(0.031, -0.026));
  vec2 g = (w3.xy - 0.5) * 0.9 + ((w1.xy - 0.5) * 0.85 + (w2.xy - 0.5) * 0.55) * mix(0.3, 1.0, detail) + (w4.xy - 0.5) * 0.45 * nearF;
  g = g * uWaveStrength * 0.42 + vSwellGrad;
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  float crest = (w1.z * 0.9 + w2.z * 0.5 + w3.z * 0.9) / 2.3;

  float dEdge = sdDeck(p);
  // the sea never shows through inside the arena footprint (e.g. dry-dock trenches below sea level)
  if (dEdge < -0.05) discard;
  vec2 fuv = (p - uFoamRect.xy) * uFoamRect.zw;
  float inField = step(0.0, fuv.x) * step(fuv.x, 1.0) * step(0.0, fuv.y) * step(fuv.y, 1.0);
  float dObj = mix(8.0, texture2D(uFoamTex, clamp(fuv, 0.0, 1.0)).r * 8.0, inField);

  // shadows: real shadow map (deck, walls, boats) + analytic deck-slab shadow as a fallback outside the shadow camera
  float sm = getShadowMask();
  vec2 q = p + uSunDir.xz * ((-0.6 - P.y) / max(uSunDir.y, 0.06));
  float ash = smoothstep(-0.2, 0.45, sdDeck(q));
  float shadow = min(sm, ash);
  float under = smoothstep(0.3, -2.4, dEdge);

  // body colour: turquoise shallows near the pier, deep blue further out; crests catch light
  float shallow = smoothstep(8.0, 0.5, dEdge) * (0.7 + 0.6 * (w3.z - 0.5));
  vec3 body = mix(uSeaDeep, uSeaShallow, clamp(shallow, 0.0, 1.0) * 0.6);
  body += uSeaCrest * smoothstep(0.55, 0.95, crest) * (0.3 + 0.7 * shadow) * 0.4 * mix(0.25, 1.0, detail);
  float NdL = max(dot(N, uSunDir), 0.0);
  vec3 lit = body * (uSeaAmbient + uSunLight * (0.4 + 0.6 * NdL) * shadow * 0.55);

  // reflection of the sky
  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 refl = skyGradient(normalize(R + vec3(0.0, 0.015, 0.0)));
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  float fres = 0.035 + 0.965 * pow(1.0 - NdV, 5.0);
  fres = min(fres * 1.1, 1.0);
  vec3 col = mix(lit, refl, fres * mix(1.0, 0.45, under));
  col *= mix(1.0, 0.2, under);

  // sun glint: broad sheen + tight sparkles from the fine normals
  float rs = clamp(dot(R, uSunDir), 0.0, 1.0);
  float spec = pow(rs, 1600.0) * 9.0 + pow(rs, 200.0) * 0.38 + pow(rs, 24.0) * 0.04;
  col += uSunLight * spec * uSunSpec * shadow * (1.0 - under);

  // foam: lapping band along the deck edge, rings around pilings / boats / buoys
  float fn = w2.z * 0.6 + w1.z * 0.4;
  float edgeF = smoothstep(0.75, 0.0, dEdge + (fn - 0.5) * 0.9) * smoothstep(-1.0, -0.2, dEdge);
  float lapPhase = fract(dEdge * 0.7 - uTime * 0.3);
  float lap = smoothstep(0.1, 0.0, abs(lapPhase - 0.5) - 0.4) * smoothstep(3.4, 0.5, dEdge) * step(0.0, dEdge);
  lap *= smoothstep(0.35, 0.7, fn + 0.15);
  float objF = smoothstep(0.55, 0.0, dObj + (fn - 0.5) * 0.45);
  objF += 0.45 * smoothstep(0.1, 0.0, abs(fract(dObj * 0.9 - uTime * 0.35) - 0.5) - 0.42) * smoothstep(2.2, 0.4, dObj) * smoothstep(0.35, 0.7, fn + 0.1);
  float foam = clamp(edgeF + lap * 0.5 + objF, 0.0, 1.0) * mix(1.0, 0.35, under);
  vec3 foamCol = uFoamColor * (uSeaAmbient * 1.3 + uSunLight * (0.35 + 0.65 * shadow) * 0.6);
  col = mix(col, foamCol, foam * detail);

  col = applyHaze(col, P);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
#endif
`, NB = `
uniform float uTime;
attribute float glow;
varying float vGlow;
varying vec3 vHzWorld;
varying vec3 vHzNormal;
varying float vHzSeed;
#ifdef HZ_GULL
attribute float aPhase;
#endif
#ifdef HZ_CITY
attribute vec3 bld;
varying vec3 vBld;
#endif
`, IB = `
#ifdef HZ_GULL
{
  float side = abs(transformed.x);
  float glide = 0.35 + 0.65 * smoothstep(-0.3, 0.6, sin(uTime * 0.55 + aPhase * 17.0));
  float flap = sin(uTime * 8.5 + aPhase * 6.2831);
  transformed.y += flap * glide * side * 0.62 * smoothstep(0.08, 0.35, side);
  transformed.y -= 0.12 * side * side;
}
#endif
`, DB = `
{
  vec4 hzW = vec4(transformed, 1.0);
  vec3 hzN = objectNormal;
  vHzSeed = 0.0;
#ifdef USE_INSTANCING
  hzW = instanceMatrix * hzW;
  hzN = mat3(instanceMatrix) * hzN;
  vHzSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
#endif
  hzW = modelMatrix * hzW;
  vHzWorld = hzW.xyz;
  vHzNormal = normalize(mat3(modelMatrix) * hzN);
  vGlow = glow;
#ifdef HZ_CITY
  vBld = bld;
#endif
}
`, TB = `
${MP}
${HQ}
#ifdef HZ_CITY
varying vec3 vBld;
float aaBand(float x, float a, float b, float w) { return smoothstep(a - w, a + w, x) * smoothstep(b + w, b - w, x); }
float aaLine(float x, float hw, float w) { float d = min(x, 1.0 - x); return smoothstep(hw + w, hw - w, d); }
vec3 hzLitCol = vec3(0.0);
#endif
varying float vGlow;
varying vec3 vHzWorld;
varying vec3 vHzNormal;
varying float vHzSeed;
float hzWin = 0.0;
float hzLit = 0.0;
vec3 hzEmit = vec3(0.0);   // night lights: added after the haze so they punch through it (and bloom)
`, zB = `
#ifdef HZ_CITY
{
  // facade styles (vBld.x): 0 solid, 1 punched windows w/ mullion, 2 ribbon bands, 3 curtain wall, 4 vertical piers, 5 bands only (round towers)
  vec3 wn = normalize(vHzNormal);
  float style = floor(vBld.x + 0.5);
  float seed = vBld.y;
  float v = vHzWorld.y - vBld.z;
  if (style > 0.5 && abs(wn.y) < 0.5) {
    vec2 tdir = normalize(vec2(-wn.z, wn.x));
    float u = dot(vHzWorld.xz, tdir) + seed * 37.0;
    float bay = style < 1.5 ? 3.3 : style < 2.5 ? 1.7 : style < 3.5 ? 1.5 : style < 4.5 ? 2.8 : 2.0;
    float flH = style < 2.5 ? 3.5 : 3.9;
    vec2 cell = vec2(u / bay, v / flH);
    vec2 f = fract(cell), id = floor(cell);
    vec2 fw = fwidth(cell);
    float far = smoothstep(0.22, 0.75, max(fw.x, fw.y));
    float glass = 0.0, mull = 0.0, avg = 0.5;
    if (style < 1.5) {
      glass = aaBand(f.x, 0.2, 0.8, fw.x) * aaBand(f.y, 0.27, 0.86, fw.y);
      mull = aaBand(f.x, 0.485, 0.515, fw.x) * glass;
      avg = 0.6 * 0.59;
    } else if (style < 2.5) {
      glass = aaBand(f.y, 0.3, 0.9, fw.y);
      mull = aaLine(f.x, 0.04, fw.x) * glass;
      avg = 0.58;
    } else if (style < 3.5) {
      glass = 1.0;
      mull = max(aaLine(f.x, 0.035, fw.x), aaLine(f.y, 0.05, fw.y) * 0.8);
      avg = 0.86;
    } else if (style < 4.5) {
      glass = aaBand(f.x, 0.32, 0.92, fw.x) * aaBand(f.y, 0.06, 0.97, fw.y);
      mull = aaLine(f.y, 0.04, fw.y) * glass;
      avg = 0.52;
    } else {
      glass = aaBand(f.y, 0.36, 0.9, fw.y);
      avg = 0.54;
    }
    glass = mix(glass * (1.0 - mull), avg, far);
    // ground-floor storefront band, and no glass right at the roofline
    glass = mix(glass, 0.75 * smoothstep(0.5, 0.9, v), 1.0 - smoothstep(3.6, 4.2, v));
    float r = hash12(id + seed * 113.0);
    vec3 gcol = mix(vec3(0.11, 0.16, 0.23), vec3(0.2, 0.27, 0.33), r);                 // blinds / interiors vary per window
    if (style > 2.5 && style < 3.5) gcol = mix(vec3(0.24, 0.37, 0.47), vec3(0.34, 0.47, 0.55), r * 0.7) * mix(0.9, 1.08, fract(seed * 7.1));
    gcol = mix(gcol, vec3(0.22, 0.29, 0.36), far);
    diffuseColor.rgb = mix(diffuseColor.rgb, gcol, glass);
    diffuseColor.rgb *= 1.0 - mull * 0.3 * (1.0 - far);
    // floor-line grooves on the solid parts
    diffuseColor.rgb *= 1.0 - 0.07 * aaLine(f.y, 0.025, fw.y) * (1.0 - glass) * (1.0 - far);
    hzWin = glass;
    float lit = step(r, style > 2.5 && style < 3.5 ? 0.34 : 0.44);
    lit = mix(lit, 0.38, far);
    vec3 lc = mix(vec3(1.0, 0.72, 0.4), vec3(0.8, 0.88, 1.0), step(0.78, hash12(id * 1.7 + seed)));
    hzLitCol = lc * lit * glass;
  }
}
#endif
#ifdef HZ_TERRAIN
{
  // stylised hills: meadow grass on gentle slopes, clumpy woodland canopy, warm dry meadows on the tops, layered rock on
  // steep faces, a sand + wet-sand beach line at the shore; vGlow carries baked fold AO
  vec3 wn = normalize(vHzNormal);
  float hgt = vHzWorld.y - ${_M.toFixed(3)};
  vec2 tp = vHzWorld.xz;
  float n1 = fbm2(tp * 0.011);
  float n2 = vnoise2(tp * 0.05) * 0.6 + vnoise2(tp * 0.17) * 0.4;
  float nt = vnoise2(tp * 0.3) * 0.55 + vnoise2(tp * 0.83 + 7.0) * 0.45;
  vec3 tint = diffuseColor.rgb;
  float slope = 1.0 - wn.y;
  vec3 grass = tint * mix(0.9, 1.08, n1);
  float wood = smoothstep(0.47, 0.62, n1 + (n2 - 0.5) * 0.3) * smoothstep(0.62, 0.3, slope) * smoothstep(1.5, 5.0, hgt);
  vec3 canopy = tint * vec3(0.5, 0.66, 0.52) * mix(0.68, 1.14, smoothstep(0.3, 0.78, nt));
  grass = mix(grass, canopy, wood * 0.92);
  grass = mix(grass, tint * vec3(1.12, 1.06, 0.8), smoothstep(0.34, 0.12, n1) * (1.0 - wood) * 0.5);
  vec3 rock = vec3(0.56, 0.55, 0.51) * (0.82 + 0.3 * n2);
  rock *= 0.9 + 0.1 * sin(vHzWorld.y * 0.85 + n2 * 5.0);
  float rockM = smoothstep(0.34, 0.54, slope + (n2 - 0.5) * 0.2) * 0.88;
  vec3 sand = vec3(0.95, 0.88, 0.72) * (0.95 + 0.08 * n2);
  float sandM = smoothstep(1.6, 0.6, hgt + (n1 - 0.5) * 1.6);
  vec3 c = mix(grass, rock, rockM);
  c = mix(c, sand, sandM);
  c = mix(c, sand * vec3(0.72, 0.7, 0.66), smoothstep(0.45, 0.1, hgt) * sandM);
  diffuseColor.rgb = c * vGlow;
}
#endif
#ifdef HZ_WATERLINE
{
  float wl = vHzWorld.y - ${_M.toFixed(3)};
  diffuseColor.rgb *= mix(0.5, 1.0, smoothstep(0.0, 0.45, wl));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.27, 0.18), smoothstep(0.3, 0.0, wl) * 0.55);
}
#endif
#ifdef HZ_SHORE
{
  float wl = vHzWorld.y - ${_M.toFixed(3)};
  float wob = 0.12 * sin(uTime * 1.2 + vHzWorld.x * 0.21 + vHzWorld.z * 0.17);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.97, 0.98), smoothstep(0.45, 0.05, abs(wl - 0.12 - wob)) * 0.85);
}
#endif
`, wB = `
#ifdef HZ_CITY
roughnessFactor = mix(roughnessFactor, 0.14, hzWin);
#endif
`, OB = `
{
  float blink = step(0.55, fract(uTime * 0.7 + vHzWorld.x * 0.013 + vHzWorld.z * 0.007));
#ifndef HZ_TERRAIN
  float gAmt = vGlow > 1.5 ? blink * 1.5 : vGlow;
  hzEmit += vColor.rgb * gAmt * (vGlow > 1.5 ? max(uNight, 0.35) : uNight) * 7.0;
#endif
#ifdef HZ_CITY
  hzEmit += uNight * hzLitCol * 1.5;   // warm lit windows, not white: 3.0 blew them out through the tone curve
#endif
#ifdef HZ_WATERLINE
  float wl2 = vHzWorld.y - ${_M.toFixed(3)};
  vec2 cq = vHzWorld.xz * 1.7 + vec2(vHzWorld.y * 2.3, 0.0);
  float cz = sin(cq.x + uTime * 1.3 + sin(cq.y * 1.3 + uTime * 0.9) * 1.6) * sin(cq.y * 1.1 - uTime * 1.1 + sin(cq.x * 0.9 - uTime * 0.7) * 1.4);
  float side = 1.0 - abs(normalize(vHzNormal).y);
  totalEmissiveRadiance += uGlowColor * 0.07 * side * smoothstep(0.45, 0.95, cz) * smoothstep(1.1, 0.15, wl2) * step(0.0, wl2);
#endif
}
`, CB = `
#include <opaque_fragment>
#ifdef HZ_CITY
{
  // glass reflects the sky gradient (grazing angles → mirror-bright), so towers pick up the sky's colours
  vec3 wn2 = normalize(vHzNormal);
  vec3 V = normalize(vHzWorld - cameraPosition);
  vec3 Rr = reflect(V, wn2);
  float fres = 0.05 + 0.95 * pow(1.0 - clamp(dot(-V, wn2), 0.0, 1.0), 5.0);
  vec3 refl = min(skyGradient(normalize(vec3(Rr.x, max(Rr.y, 0.02), Rr.z))), vec3(1.1));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, refl * mix(0.92, 0.55, uNight), hzWin * clamp(0.18 + fres * 0.75, 0.0, 0.85) * (1.0 - uNight * 0.75));
  // dusk: the skyline across the bay settles a stop darker so its lit windows carry it (was one flat salmon glow)
  gl_FragColor.rgb *= 1.0 - 0.38 * uNight;
}
#endif
gl_FragColor.rgb = applyHaze(gl_FragColor.rgb, vHzWorld) + hzEmit * exp(-length(vHzWorld - cameraPosition) * uHaze.x * 0.35);
`, gB = `
#include <common>
#include <shadowmap_pars_vertex>
uniform vec3 uSunDir;
attribute vec4 aInfo;        // rgb = face albedo (linear), a = kind (0 slab fascia / underside, 1 hull in the water)
varying vec3 vP;
varying vec3 vPw;
varying vec3 vN;
varying vec4 vInfo;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vInfo = aInfo;
  float h = max(wp.y - ${_M.toFixed(3)}, 0.0);
  vec2 k = uSunDir.xz / max(uSunDir.y, 0.08);
  vPw = vec3(wp.x + k.x * h, ${_M.toFixed(3)}, wp.z + k.y * h);
  vec4 worldPosition = vec4(vPw, 1.0);
  vec4 mvPosition = viewMatrix * wp;
  vec3 transformedNormal = normalMatrix * vec3(0.0, 1.0, 0.0);
  #include <shadowmap_vertex>
  gl_Position = projectionMatrix * mvPosition;
}
`, EB = `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunLight;
uniform vec4 uStripK;      // x caustic strength, y wet-band darkening
varying vec3 vP;
varying vec3 vPw;
varying vec3 vN;
varying vec4 vInfo;
vec2 hash22s(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
// distance to the nearest cell border of a jittered grid whose points wander (F2 − F1): 0 on the borders
float cellEdge(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 h = hash22s(i + g);
    vec2 o = 0.5 + 0.4 * sin(t * (0.7 + 0.6 * h) + 6.2831 * h.yx);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return d2 - d1;
}
// focused-light network of a rippled surface (mean ≈ 1)
float caustic(vec2 p, float t, float blur) {
  vec2 w = p + 0.3 * vec2(sin(p.y * 1.1 + t * 0.8), sin(p.x * 0.9 - t * 0.7));
  float c1 = 1.0 - smoothstep(0.0, 0.08 + blur, cellEdge(w * 2.2, t * 1.2));
  float c2 = 1.0 - smoothstep(0.0, 0.08 + blur * 1.4, cellEdge(w * 3.3 + 7.3, t * 1.5));
  return (c1 * 0.8 + c2 * 0.5 + c1 * c2 * 1.4) * 2.4;
}
float swellH(vec2 p, float t) {
  return 0.45 * sin(dot(p, vec2(0.110, 0.047)) + t * 0.95) + 0.35 * sin(dot(p, vec2(-0.052, 0.097)) + t * 1.13 + 1.7) + 0.20 * sin(dot(p, vec2(0.173, -0.141)) + t * 1.61 + 4.1);
}
void main() {
  vec3 n = normalize(vN);
  float h = vP.y - ${_M.toFixed(3)};
  // cosine between the face and the light bouncing up off the water (away from the sun)
  float facing = max(dot(n, vec3(uSunDir.x, -uSunDir.y, uSunDir.z)), 0.0);
  vec3 add = vec3(0.0);
  if (facing > 0.002) {
    float lit = getShadowMask();
    if (lit > 0.002) {
      float c = caustic(vPw.xz, uTime, 0.02 + max(h, 0.0) * 0.1);
      float fall = exp(-max(h, 0.0) * 0.8) * smoothstep(-0.02, 0.05, h);
      vec3 alb = max(vInfo.rgb, vec3(0.12));
      add = uSunLight * alb * (c * 0.06) * facing * lit * fall * uStripK.x;
    }
  }
  float mul = 1.0;
  if (vInfo.a > 0.5) {
    // hull in the water: the line bobs with the swell; a dark wet band above it, freshest right at the line
    float wl = ${_M.toFixed(3)} + 0.035 * swellH(vP.xz, uTime) + 0.018 * sin(uTime * 1.7 + (vP.x + vP.z) * 1.3);
    float top = 0.22 + 0.07 * sin(vP.x * 1.7 + vP.z * 1.3) + 0.04 * sin(vP.x * 5.1 - vP.z * 4.3);
    float band = smoothstep(wl + top, wl + top - 0.14, vP.y);
    float fresh = smoothstep(wl + 0.05, wl + 0.004, vP.y);
    mul = 1.0 - uStripK.y * (0.75 * band + 0.25 * fresh);
    add *= 1.0 - 0.5 * band;
  }
  gl_FragColor = vec4(add, mul);
}
`;
function MD(j, A, M = {}) {
  const N = [];
  M.city && N.push("HZ_CITY"), M.terrain && N.push("HZ_TERRAIN"), M.waterline && N.push("HZ_WATERLINE"), M.shore && N.push("HZ_SHORE"), M.gull && N.push("HZ_GULL"), j.defines = j.defines || {};
  for (const I of N) j.defines[I] = "";
  return j.fog = false, j.onBeforeCompile = (I) => {
    for (const D of ["uTime", "uSunDir", "uZenith", "uSkyMid", "uHorizon", "uGround", "uHorizonGlow", "uGlowColor", "uGlowParams", "uHaze", "uNight"]) I.uniforms[D] = A[D];
    I.vertexShader = I.vertexShader.replace("#include <common>", `#include <common>
` + NB).replace("#include <begin_vertex>", `#include <begin_vertex>
` + IB).replace("#include <project_vertex>", `#include <project_vertex>
` + DB), I.fragmentShader = I.fragmentShader.replace("#include <common>", `#include <common>
` + TB).replace("#include <color_fragment>", `#include <color_fragment>
` + zB).replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
` + wB).replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
` + OB).replace("#include <opaque_fragment>", CB);
  }, j.customProgramCacheKey = () => "inkwave-env:" + N.join(","), j;
}
function y4(j) {
  let A = j >>> 0;
  return () => {
    A |= 0, A = A + 1831565813 | 0;
    let M = Math.imul(A ^ A >>> 15, 1 | A);
    return M = M + Math.imul(M ^ M >>> 7, 61 | M) ^ M, ((M ^ M >>> 14) >>> 0) / 4294967296;
  };
}
function yw(j, A) {
  const M = Math.sin(j * 127.1 + A * 311.7) * 43758.5453;
  return M - Math.floor(M);
}
function PB(j, A) {
  const M = Math.floor(j), N = Math.floor(A), I = j - M, D = A - N, T = I * I * (3 - 2 * I), w = D * D * (3 - 2 * D), O = yw(M, N), z = yw(M + 1, N), C = yw(M, N + 1), E = yw(M + 1, N + 1);
  return O + (z - O) * T + (C - O) * w + (O - z - C + E) * T * w;
}
function cy(j, A, M = 4) {
  let N = 0, I = 0.5, D = 0;
  for (let T = 0; T < M; T++) N += I * PB(j, A), D += I, j = j * 2.03 + 5.3, A = A * 2.03 - 1.7, I *= 0.5;
  return N / D;
}
const gx = (j, A, M) => {
  const N = Math.min(1, Math.max(0, (M - j) / (A - j)));
  return N * N * (3 - 2 * N);
}, PI = (j, A) => [Math.cos(j * DD) * A, Math.sin(j * DD) * A];
function mO(j) {
  if (j.hx === void 0) return { ...j, cx: (j.minX + j.maxX) / 2, cz: (j.minZ + j.maxZ) / 2, hx: (j.maxX - j.minX) / 2, hz: (j.maxZ - j.minZ) / 2, ax: 1, az: 0, aligned: true };
  let A = j.ax ?? 1, M = j.az ?? 0, N = j.hx, I = j.hz;
  const D = Math.hypot(A, M) || 1;
  A /= D, M /= D, Math.abs(M) < 1e-7 ? (A = 1, M = 0) : Math.abs(A) < 1e-7 && (A = 1, M = 0, [N, I] = [I, N]);
  const T = A === 1 && M === 0, w = { ...j, hx: N, hz: I, ax: A, az: M, aligned: T };
  if (!(T && j.minX !== void 0)) {
    const O = Math.abs(A) * N + Math.abs(M) * I, z = Math.abs(M) * N + Math.abs(A) * I;
    w.minX = j.cx - O, w.maxX = j.cx + O, w.minZ = j.cz - z, w.maxZ = j.cz + z;
  }
  return w;
}
function yB(j) {
  return j.aligned ? mO({ minX: j.aabbMin.x, maxX: j.aabbMax.x, minZ: j.aabbMin.z, maxZ: j.aabbMax.z }) : Math.abs(j.axes[1].y) < 0.9999 ? null : mO({ cx: j.center.x, cz: j.center.z, hx: j.half.x, hz: j.half.z, ax: j.axes[0].x, az: j.axes[0].z });
}
function Xg(j, A, M, N = 0) {
  if (j.aligned) return A > j.minX - N && A < j.maxX + N && M > j.minZ - N && M < j.maxZ + N;
  const I = A - j.cx, D = M - j.cz;
  return Math.abs(I * j.ax + D * j.az) < j.hx + N && Math.abs(D * j.ax - I * j.az) < j.hz + N;
}
function xB(j, A, M) {
  const N = A - j.cx, I = M - j.cz, D = Math.abs(N * j.ax + I * j.az) - j.hx, T = Math.abs(I * j.ax - N * j.az) - j.hz;
  return D > 0 || T > 0 ? Math.sqrt((D > 0 ? D * D : 0) + (T > 0 ? T * T : 0)) : Math.max(D, T);
}
const xw = (j, A, M) => [j.cx + A * j.ax - M * j.az, j.cz + A * j.az + M * j.ax];
function QB(j) {
  let A, M;
  return j.aligned ? (A = [[j.minX, j.minZ], [j.maxX, j.minZ], [j.maxX, j.maxZ], [j.minX, j.maxZ]], M = [[0, -1], [1, 0], [0, 1], [-1, 0]]) : (A = [xw(j, -j.hx, -j.hz), xw(j, j.hx, -j.hz), xw(j, j.hx, j.hz), xw(j, -j.hx, j.hz)], M = [[j.az, -j.ax], [j.ax, j.az], [-j.az, j.ax], [-j.ax, -j.az]]), A.map((N, I) => ({ ax: N[0], az: N[1], bx: A[I + 1 & 3][0], bz: A[I + 1 & 3][1], nx: M[I][0] + 0, nz: M[I][1] + 0 }));
}
const MI = new YM(), fD = new mj(), TD = new nj(), ET = new DA(), PT = new DA(), _g = [new DA(), new DA(), new DA(), new DA()], sy = new jM(), DL = [new qM(), new qM()], KT = new pD(), TL = new lA(), iB = new ON(), LB = new YM();
function zN(j, A = "#ffffff", M = 0) {
  const N = j.index ? j.toNonIndexed() : j;
  for (const D of Object.keys(N.attributes)) D !== "position" && D !== "normal" && D !== "color" && D !== "glow" && N.deleteAttribute(D);
  N.clearGroups(), N.attributes.normal || N.computeVertexNormals();
  const I = N.attributes.position.count;
  if (!N.attributes.color) {
    const D = new lA(A), T = new Float32Array(I * 3);
    for (let w = 0; w < I; w++) T[w * 3] = D.r, T[w * 3 + 1] = D.g, T[w * 3 + 2] = D.b;
    N.setAttribute("color", new dM(T, 3));
  }
  return N.attributes.glow || N.setAttribute("glow", new dM(new Float32Array(I).fill(M), 1)), N;
}
function nA(j, A = 0, M = 0, N = 0, I = 0, D = 0, T = 0, w = 1, O = 1, z = 1) {
  return TD.set(D, I, T, "YXZ"), fD.setFromEuler(TD), MI.compose(ET.set(A, M, N), fD, PT.set(w, O, z)), j.applyMatrix4(MI), j;
}
const lM = (j, A, M, N, I) => zN(new DN(j, A, M), N, I), Ej = (j, A, M, N, I, D, T = false) => zN(new KN(j, A, M, N, 1, T), I, D), dj = (j, A, M, N, I) => zN(new yN(j, A, M), N, I);
function eN(j, A, M, N, I, D, T, w, O = 0) {
  const z = N - j, C = I - A, E = D - M, P = Math.hypot(z, C, E), g = lM(T, P, T, w, O);
  return fD.setFromUnitVectors(ET.set(0, 1, 0), PT.set(z / P, C / P, E / P)), MI.compose(ET.set((j + N) / 2, (A + I) / 2, (M + D) / 2), fD, PT.set(1, 1, 1)), g.applyMatrix4(MI), g;
}
function oy(j, A, M, N = 4, I = 0) {
  const D = new rC(j.map((T) => new DA(T[0], T[1], T[2])));
  return zN(new oz(D, Math.max(4, Math.round(j.length * 1.2)), A, N, false), M, I);
}
function kB(j, A, M, N = 12) {
  const I = [];
  for (let D = 0; D <= N; D++) {
    const T = D / N;
    I.push([j[0] + (A[0] - j[0]) * T, j[1] + (A[1] - j[1]) * T - M * 4 * T * (1 - T), j[2] + (A[2] - j[2]) * T]);
  }
  return I;
}
function gT(j, A, M = true, N = 0) {
  const I = M ? new Float32Array(j.length * 2) : new Float32Array(j);
  if (M) {
    I.set(j, 0);
    for (let T = 0; T < j.length; T += 9) I.set([j[T], j[T + 1], j[T + 2], j[T + 6], j[T + 7], j[T + 8], j[T + 3], j[T + 4], j[T + 5]], j.length + T);
  }
  const D = new FM();
  return D.setAttribute("position", new dM(I, 3)), D.computeVertexNormals(), zN(D, A, N);
}
function SU(j, A) {
  const M = j.attributes.position, N = j.attributes.normal, I = j.attributes.color;
  for (let D = 0; D < M.count; D++) {
    const T = A(M.getX(D), M.getY(D), M.getZ(D), N.getX(D), N.getY(D), N.getZ(D));
    T && I.setXYZ(D, T.r, T.g, T.b);
  }
  return j;
}
function UB(j = 256, A = 11) {
  const M = y4(A), N = [], I = 0.55;
  for (let x = 0; x < 44; x++) {
    const U = 2 + Math.pow(M(), 1.5) * 26, k = I + (M() - 0.5) * 2.4;
    let s = Math.round(Math.cos(k) * U), v = Math.round(Math.sin(k) * U);
    s === 0 && v === 0 && (s = 2);
    const S = Math.hypot(s, v);
    N.push([s, v, 1 / Math.pow(S, 1.3), M() * Math.PI * 2]);
  }
  const D = j * j, T = new Float32Array(D), w = new Float32Array(D), O = new Float32Array(D);
  let z = 1 / 0, C = -1 / 0, E = 0;
  const P = Math.PI * 2;
  for (let x = 0; x < j; x++) for (let U = 0; U < j; U++) {
    const k = U / j, s = x / j;
    let v = 0, S = 0, q = 0;
    for (let G = 0; G < N.length; G++) {
      const r = N[G], t = P * (r[0] * k + r[1] * s) + r[3], p = Math.sin(t), f = Math.cos(t);
      v += r[2] * p, S += r[2] * r[0] * f, q += r[2] * r[1] * f;
    }
    const c = x * j + U;
    T[c] = v, w[c] = S, O[c] = q, v < z && (z = v), v > C && (C = v), E = Math.max(E, Math.abs(S), Math.abs(q));
  }
  const g = new Uint8Array(D * 4);
  for (let x = 0; x < D; x++) {
    const U = (T[x] - z) / (C - z);
    g[x * 4] = Math.round((w[x] / E * 0.5 + 0.5) * 255), g[x * 4 + 1] = Math.round((O[x] / E * 0.5 + 0.5) * 255), g[x * 4 + 2] = Math.round(Math.pow(U, 1.8) * 255), g[x * 4 + 3] = 255;
  }
  const Q = new DI(g, j, j, _j, zI);
  return Q.wrapS = Q.wrapT = FN, Q.magFilter = aj, Q.minFilter = SN, Q.generateMipmaps = true, Q.anisotropy = 8, Q.colorSpace = xN, Q.needsUpdate = true, Q;
}
function $g({ L: j, B: A, D: M, F: N, sheer: I = 0.3, hull: D = "#ffffff", stripe: T = "#3c6e8f", bottom: w = "#c75c52", deck: O = "#d9c7a6" }) {
  const E = [];
  for (let t = 0; t <= 14; t++) {
    const p = t / 14, f = (p - 0.5) * j;
    let h;
    if (p < 0.55) h = 0.5 * A * (0.82 + 0.18 * Math.sin(p / 0.55 * Math.PI / 2));
    else {
      const W = (p - 0.55) / 0.45;
      h = 0.5 * A * Math.sqrt(Math.max(0, 1 - W * W * 0.995));
    }
    const X = -M * (p < 0.62 ? 1 : 1 - 0.8 * Math.pow((p - 0.62) / 0.38, 1.4)), TA = N + I * p * p, Z = [];
    for (let W = -5; W <= 5; W++) {
      const PA = Math.abs(W) / 5, MA = Math.sign(W) * h * Math.pow(Math.sin(PA * Math.PI / 2), 0.75), wA = X + (TA - X) * (1 - Math.cos(PA * Math.PI / 2));
      Z.push([MA, wA, f]);
    }
    E.push({ pts: Z, top: TA, z: f, w: h });
  }
  const P = [], g = (t, p, f, h) => {
    const X = p[0] - t[0], TA = p[1] - t[1], Z = p[2] - t[2], W = f[0] - t[0], PA = f[1] - t[1], MA = f[2] - t[2], wA = TA * MA - Z * PA, xA = Z * W - X * MA, YA = (t[0] + p[0] + f[0]) / 3, eA = (t[1] + p[1] + f[1]) / 3;
    wA * YA + xA * (eA - h) < 0 ? P.push(...t, ...f, ...p) : P.push(...t, ...p, ...f);
  };
  for (let t = 0; t < 14; t++) {
    const p = E[t].pts, f = E[t + 1].pts, h = E[t].top * 0.7;
    for (let X = 0; X < p.length - 1; X++) g(p[X], p[X + 1], f[X + 1], h), g(p[X], f[X + 1], f[X], h);
  }
  const Q = new FM();
  Q.setAttribute("position", new xM(P, 3)), Q.computeVertexNormals(), zN(Q, D);
  const x = new lA(D), U = new lA(T), k = new lA(w), s = new lA("#2b3440");
  SU(Q, (t, p, f) => {
    const h = Math.min(14, Math.max(0, Math.round((f / j + 0.5) * 14))), X = E[h].top;
    return p < 0.02 ? k : p < 0.12 ? s : p > X - 0.2 ? U : x;
  });
  const v = [Q], S = [];
  for (let t = 0; t < 14; t++) {
    const p = E[t], f = E[t + 1], h = p.top - 0.14, X = f.top - 0.14, TA = [-p.w * 0.96, h, p.z], Z = [p.w * 0.96, h, p.z], W = [-f.w * 0.96, X, f.z], PA = [f.w * 0.96, X, f.z];
    S.push(...TA, ...PA, ...Z, ...TA, ...W, ...PA);
  }
  v.push(gT(S, O, false));
  const q = E[0].pts, c = [], G = (q[0][1] + q[5][1]) * 0.5, r = E[0].z;
  for (let t = 0; t < q.length - 1; t++) c.push(0, G, r, ...q[t + 1], ...q[t]);
  return v.push(gT(c, D, true)), uN(v);
}
function YB(j) {
  const { x: A, z: M, rx: N, rz: I, h: D, seed: T = 1, rot: w = 0, plateau: O = false, R: z = 12, S: C = 44, grass: E = "#9ccf7f", ridge: P = 0.3 } = j, g = Math.cos(w), Q = Math.sin(w), x = (Z, W) => {
    const PA = Math.hypot(Z, W), MA = Math.atan2(W, Z), wA = 1 + (cy(Math.cos(MA) * 1.2 + T * 3.7, Math.sin(MA) * 1.2 - T * 1.9, 3) - 0.5) * 0.34, xA = PA / wA;
    if (xA >= 1) return -(xA - 1) * 30 - 0.6;
    const YA = cy(Z * 1.15 + T * 5.1, W * 1.15 - T * 2.3, 4);
    if (O) return D * gx(1, 0.8, xA) * (0.92 + 0.16 * YA) + (1 - xA) * 0.6 - 0.35;
    const eA = 2 * cy(Z * 1.7 + T * 1.7, W * 1.7 - T * 0.9, 3) - 1, TM = 1 - Math.sqrt(eA * eA + 0.035), AM = Math.pow(1 - xA * xA, 1.35);
    return D * AM * (0.52 + 0.6 * YA + P * TM * TM) + (1 - xA) * 0.6 - 0.35;
  }, U = (Z, W) => {
    const PA = Z - A, MA = W - M;
    return [(PA * g + MA * Q) / N, (-PA * Q + MA * g) / I];
  }, k = (Z, W) => [A + Z * N * g - W * I * Q, M + Z * N * Q + W * I * g], s = [], v = [], S = [], q = [], c = [], G = new lA(E), r = 0.05, t = Math.max(N, I) * 0.012, p = (Z, W) => {
    const [PA, MA] = U(Z, W);
    return x(PA, MA);
  }, f = (Z, W, PA) => {
    const [MA, wA] = k(Z, W), xA = PA ?? x(Z, W);
    if (s.push(MA, _M + xA, wA), PA !== void 0) c.push(0, 1, 0);
    else {
      const TM = (p(MA + t, wA) - p(MA - t, wA)) / (2 * t), AM = (p(MA, wA + t) - p(MA, wA - t)) / (2 * t), KA = 1 / Math.hypot(TM, 1, AM);
      c.push(-TM * KA, KA, -AM * KA);
    }
    const YA = 0.94 + 0.12 * yw(Math.round(MA), Math.round(wA));
    v.push(G.r * YA, G.g * YA, G.b * YA);
    const eA = (x(Z + r, W) + x(Z - r, W) + x(Z, W + r) + x(Z, W - r)) / 4 - xA;
    S.push(PA !== void 0 ? 1 : 1 - Math.min(1, Math.max(0, eA / (0.02 * D + 0.4))) * 0.42);
  };
  f(0, 0);
  const h = z + 2;
  for (let Z = 1; Z < h; Z++) {
    const W = Z === h - 1 ? 1.4 : Z / z * 1.1;
    for (let PA = 0; PA < C; PA++) {
      const MA = PA / C * Math.PI * 2;
      f(Math.cos(MA) * W, Math.sin(MA) * W, Z === h - 1 ? -6 : void 0);
    }
  }
  const X = (Z, W) => 1 + (Z - 1) * C + (W + C) % C;
  for (let Z = 0; Z < C; Z++) q.push(0, X(1, Z + 1), X(1, Z));
  for (let Z = 1; Z < h - 1; Z++) for (let W = 0; W < C; W++) {
    const PA = X(Z, W), MA = X(Z, W + 1), wA = X(Z + 1, W + 1), xA = X(Z + 1, W);
    q.push(PA, wA, xA, PA, MA, wA);
  }
  const TA = new FM();
  return TA.setAttribute("position", new xM(s, 3)), TA.setAttribute("normal", new xM(c, 3)), TA.setAttribute("color", new xM(v, 3)), TA.setAttribute("glow", new xM(S, 1)), TA.setIndex(q), { geo: zN(TA), heightAt: (Z, W) => {
    const [PA, MA] = U(Z, W);
    return _M + x(PA, MA);
  }, localF: (Z, W) => {
    const [PA, MA] = U(Z, W);
    return Math.hypot(PA, MA);
  }, sample: (Z, W = 0.8) => {
    const PA = Z() * Math.PI * 2, MA = Math.sqrt(Z()) * W;
    return k(Math.cos(PA) * MA, Math.sin(PA) * MA);
  } };
}
class cB {
  static get THEMES() {
    return Wg;
  }
  constructor(A, M, N = {}) {
    this.renderer = A, this.scene = M;
    const I = N.bounds || { minX: -25, maxX: 25, minZ: -44, maxZ: 44 };
    this.bounds = { minX: I.minX, maxX: I.maxX, minZ: I.minZ, maxZ: I.maxZ }, this.footprint = (N.footprint && N.footprint.length ? N.footprint : [this.bounds]).map(mO), this.shadowSize = N.shadowSize || 4096, this.waterY = _M, this.time = 0, this.theme = null, this.envMap = null, this.fogColor = new lA(), this._envRT = null, this.root = new oj(), this.root.name = "Environment", M.add(this.root), this._marina = this._stageMarina(), this._frameId = 0, this.reflections = true, this._initUniforms(), this._buildLights(), this._buildSky(), this._buildSea(), this._buildDock(), this._buildScenery(), this._buildLife(), M.fog = new dw(this.fogColor, 70, 1500), this.setTheme(N.theme || "day");
  }
  _initUniforms() {
    const A = () => ({ value: new DA() }), M = () => ({ value: new lA() });
    this.U = { uTime: { value: 0 }, uSunDir: A(), uZenith: M(), uSkyMid: M(), uHorizon: M(), uGround: M(), uHorizonGlow: M(), uGlowColor: M(), uGlowParams: { value: new qM() }, uHaze: { value: new qM() }, uNight: { value: 0 }, uSunDisk: M(), uSunCos: { value: 0.9998 }, uCloudLit: M(), uCloudShade: M(), uCloudParams: { value: new qM() }, uRects: { value: Array.from({ length: Pz }, () => new qM()) }, uRectCount: { value: 0 }, uRectAx: { value: Array.from({ length: Pz }, () => new jM(1, 0)) }, uWaveTex: { value: null }, uFoamTex: { value: null }, uFoamRect: { value: new qM() }, uSeaDeep: M(), uSeaShallow: M(), uSeaCrest: M(), uFoamColor: M(), uSunLight: M(), uSeaAmbient: M(), uSunSpec: { value: 1 }, uWaveStrength: { value: 1 }, uCloudTex: { value: null }, uWet: { value: Array.from({ length: yz }, () => new qM()) }, uWetCount: { value: 0 }, uArena: { value: new qM() }, uWetAx: { value: Array.from({ length: yz }, () => new jM(1, 0)) }, uDeckField: { value: null }, uDeckFieldRect: { value: new qM() }, uDeckFieldK: { value: new qM() }, uDeckBox: { value: new qM() }, uWetBox: { value: new qM() }, uReflTex: { value: null }, uReflMat: { value: new YM() }, uReflOn: { value: 0 }, uFarCube: { value: null }, uFarOn: { value: 0 }, uChannelCol: M(), uShadeCol: M(), uMarinaK: { value: new qM(1, 1, 0.3, 0) }, uStripK: { value: new qM(1, 0.4, 0, 0) } }, this._syncDeckShading();
  }
  _syncDeckShading() {
    const A = this.U, M = this._marina ? this._marinaData : null, N = M ? M.decks : this.footprint, I = M ? M.wet : [], D = N.length > Pz || I.length > yz || !!this.forceDeckField;
    D ? (this._bakeDeckField(N, I), A.uRectCount.value = 0, A.uWetCount.value = 0) : (this._writeRects(N), this._writeWet(I), this._fieldRT && (this._fieldRT.dispose(), this._fieldRT = null, this._fieldKey = null, A.uDeckField.value = null)), this.seaMat && "DECK_FIELD" in this.seaMat.defines !== D && (D ? this.seaMat.defines.DECK_FIELD = "" : delete this.seaMat.defines.DECK_FIELD, this.seaMat.needsUpdate = true);
  }
  _bakeDeckField(A, M) {
    const N = this.U, I = this.bounds, D = W7, T = (k) => {
      if (!k.length) return [1e4, 1e4, 1e4, 1e4];
      const s = [1 / 0, 1 / 0, -1 / 0, -1 / 0];
      for (const v of k) s[0] = Math.min(s[0], v.minX), s[1] = Math.min(s[1], v.minZ), s[2] = Math.max(s[2], v.maxX), s[3] = Math.max(s[3], v.maxZ);
      return s;
    }, w = T(A), O = T(M);
    let z = I.minX, C = I.minZ, E = I.maxX, P = I.maxZ;
    for (const k of [...A, ...M]) z = Math.min(z, k.minX), C = Math.min(C, k.minZ), E = Math.max(E, k.maxX), P = Math.max(P, k.maxZ);
    z = Math.max(z, I.minX - 60) - D - 1, C = Math.max(C, I.minZ - 60) - D - 1, E = Math.min(E, I.maxX + 60) + D + 1, P = Math.min(P, I.maxZ + 60) + D + 1;
    let g = Z7;
    for (; (E - z) / g * ((P - C) / g) > 22e5; ) g *= 1.25;
    const Q = Math.ceil((E - z) / g), x = Math.ceil((P - C) / g), U = [z, C, Q, x, g, ...[A, M].map((k) => k.map((s) => [s.cx, s.cz, s.hx, s.hz, s.ax, s.az].join()).join(";"))].join("|");
    if (U !== this._fieldKey) {
      const k = performance.now();
      this._fieldKey = U;
      const s = Math.max(1, A.length, M.length), v = new Float32Array(2 * s * 2 * 4);
      [A, M].forEach((t, p) => t.forEach((f, h) => v.set([f.cx, f.cz, f.hx, f.hz, f.ax, f.az, 0, 0], (p * 2 * s + 2 * h) * 4)));
      const S = new DI(v, 2 * s, 2, _j, XN);
      S.needsUpdate = true, this._fieldMat || (this._fieldMat = new PN({ name: "DeckFieldBake", depthTest: false, depthWrite: false, uniforms: { uRectTex: { value: null }, uN: { value: new jM() }, uField: { value: new qM() }, uR: { value: D } }, vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }", fragmentShader: `
            uniform sampler2D uRectTex; uniform vec2 uN; uniform vec4 uField; uniform float uR;
            varying vec2 vUv;
            float sdSet(vec2 p, int n, int row) {
              float d = uR;
              for (int i = 0; i < n; i++) {
                vec4 r = texelFetch(uRectTex, ivec2(2 * i, row), 0);
                vec2 a = texelFetch(uRectTex, ivec2(2 * i + 1, row), 0).xy;
                vec2 e = p - r.xy;
                vec2 q = abs(vec2(dot(e, a), dot(e, vec2(-a.y, a.x)))) - r.zw;
                d = min(d, length(max(q, 0.0)) + min(max(q.x, q.y), 0.0));
              }
              return d;
            }
            void main() { vec2 p = uField.xy + vUv * uField.zw; gl_FragColor = vec4(sdSet(p, int(uN.x), 0), sdSet(p, int(uN.y), 1), 0.0, 1.0); }` }), this._fieldQuad = new GM(new KI(2, 2), this._fieldMat), this._fieldQuad.frustumCulled = false, this._fieldScene = new Cz(), this._fieldScene.add(this._fieldQuad), this._fieldCam = new uT(-1, 1, 1, -1, 0, 1));
      const q = this._fieldMat.uniforms;
      q.uRectTex.value = S, q.uN.value.set(A.length, M.length), q.uField.value.set(z, C, Q * g, x * g), (!this._fieldRT || this._fieldRT.width !== Q || this._fieldRT.height !== x) && (this._fieldRT?.dispose(), this._fieldRT = new YI(Q, x, { type: OD, format: _j, depthBuffer: false, stencilBuffer: false, generateMipmaps: false, minFilter: aj, magFilter: aj, colorSpace: xN }));
      const c = this.renderer, G = c.getRenderTarget(), r = c.xr.enabled;
      c.xr.enabled = false, c.setRenderTarget(this._fieldRT), c.render(this._fieldScene, this._fieldCam), c.setRenderTarget(G), c.xr.enabled = r, S.dispose(), N.uDeckField.value = this._fieldRT.texture, this.fieldBakeMs = performance.now() - k;
    }
    N.uDeckFieldRect.value.set(z, C, 1 / (Q * g), 1 / (x * g)), N.uDeckFieldK.value.set(g, D, 0, 0), N.uDeckBox.value.set(...w), N.uWetBox.value.set(...O);
  }
  _writeRects(A = this.footprint) {
    const M = this.U;
    A.forEach((N, I) => {
      M.uRects.value[I].set(N.cx, N.cz, N.hx, N.hz), M.uRectAx.value[I].set(N.ax, N.az);
    }), M.uRectCount.value = A.length;
  }
  _writeWet(A) {
    const M = this.U;
    A.forEach((N, I) => {
      M.uWet.value[I].set(N.cx, N.cz, N.hx, N.hz), M.uWetAx.value[I].set(N.ax, N.az);
    }), M.uWetCount.value = A.length;
  }
  _buildLights() {
    const A = new Kw(16777215, 3);
    A.name = "Sun", A.castShadow = true, A.shadow.mapSize.set(this.shadowSize, this.shadowSize), A.shadow.radius = 2.2 * (this.shadowSize / 4096) + 0.8;
    const M = (this.bounds.minX + this.bounds.maxX) / 2, N = (this.bounds.minZ + this.bounds.maxZ) / 2;
    A.target.position.set(M, 0, N), this.scene.add(A, A.target), this.sun = A, this.hemi = new nE(16777215, 8947848, 0.5), this.hemi.name = "SkyFill", this.scene.add(this.hemi);
  }
  _fitShadow() {
    const A = this.bounds, M = 6, N = (A.minX + A.maxX) / 2, I = (A.minZ + A.maxZ) / 2, D = this.U.uSunDir.value, T = new DA(N, 0, I), w = T.clone().addScaledVector(D, 160);
    this.sun.position.copy(w), this.sun.target.position.copy(T), this.sun.target.updateMatrixWorld();
    const O = new YM().lookAt(w, T, new DA(0, 1, 0)), z = new YM().makeTranslation(w.x, w.y, w.z).multiply(O).invert();
    let C = 1 / 0, E = -1 / 0, P = 1 / 0, g = -1 / 0, Q = 1 / 0, x = -1 / 0;
    const U = new DA();
    for (const S of [A.minX - M, A.maxX + M]) for (const q of [_M - 0.3, 14]) for (const c of [A.minZ - M, A.maxZ + M]) U.set(S, q, c).applyMatrix4(z), C = Math.min(C, U.x), E = Math.max(E, U.x), P = Math.min(P, U.y), g = Math.max(g, U.y), Q = Math.min(Q, U.z), x = Math.max(x, U.z);
    const k = this.sun.shadow.camera;
    k.left = C, k.right = E, k.bottom = P, k.top = g, k.near = Math.max(0.5, -x - 30), k.far = -Q + 2, k.updateProjectionMatrix();
    const s = k.far - k.near;
    this.sun.shadow.bias = -0.025 / s;
    const v = Math.max(E - C, g - P) / this.shadowSize;
    this.sun.shadow.normalBias = Math.max(0.012, v * 1.4), this.sun.shadow.needsUpdate = true;
  }
  _buildSky() {
    const A = new yN(1, 48, 24), M = (I) => new PN({ name: I ? "SkyEnv" : "Sky", uniforms: this.U, vertexShader: X7, fragmentShader: _7, side: mN, depthWrite: false, depthTest: !I, depthFunc: kT, fog: false, defines: I ? { ENV_PASS: "" } : {} });
    this.skyMat = M(false), this.sky = new GM(A, this.skyMat), this.sky.name = "SkyDome", this.sky.frustumCulled = false, this.sky.renderOrder = 9e3, this._initCloudBake(), this.root.add(this.sky), this._envScene = new Cz();
    const N = new GM(A, M(true));
    N.frustumCulled = false, this._envScene.add(N), this._pmrem = new TE(this.renderer);
  }
  _initCloudBake() {
    this._cloudRT = new YI(Yy, Kg, { type: OD, format: _j, colorSpace: xN, minFilter: aj, magFilter: aj, generateMipmaps: false, wrapS: FN, wrapT: qN, depthBuffer: false, stencilBuffer: false }), this.U.uCloudTex.value = this._cloudRT.texture, this._cloudMat = new PN({ name: "CloudBake", vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }", fragmentShader: K7, uniforms: { ...this.U, uRes: { value: new jM(Yy, Kg) }, uSunCol: { value: new lA() }, uSeed: { value: 3 }, uCov: { value: 0.46 } }, depthTest: false, depthWrite: false, toneMapped: false });
    const A = new FM();
    A.setAttribute("position", new xM([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const M = new GM(A, this._cloudMat);
    M.frustumCulled = false, this._cloudScene = new Cz(), this._cloudScene.add(M), this._cloudCam = new uT(-1, 1, 1, -1, 0, 1);
  }
  _bakeClouds(A) {
    const M = this.renderer, N = this._cloudMat.uniforms;
    N.uSunCol.value.copy(LO(A.sunColor, (A.skySun ?? A.sunIntensity) / 2.75)), N.uCov.value = A.cloudCov ?? 0.46, N.uSeed.value = A.cloudSeed ?? 3;
    const I = M.getRenderTarget(), D = M.autoClear, T = M.xr.enabled;
    M.autoClear = false, M.xr.enabled = false;
    const w = this._cloudRT;
    M.setRenderTarget(w), M.setClearColor(0, 0), M.clear(true, false, false);
    const O = 10, z = Math.ceil(Kg / O);
    w.scissorTest = true;
    for (let C = 0; C < O; C++) w.scissor.set(0, C * z, Yy, Math.min(z, Kg - C * z)), M.setRenderTarget(w), M.render(this._cloudScene, this._cloudCam);
    w.scissorTest = false, M.setRenderTarget(I), M.autoClear = D, M.xr.enabled = T;
  }
  _rebuildEnvMap() {
    const A = this._envRT;
    this._envRT = this._pmrem.fromScene(this._envScene, 0, 0.1, 100, { size: 256 });
    const M = this.envMap;
    this.envMap = this._envRT.texture, (this.scene.environment === M || this.scene.environment == null) && (this.scene.environment = this.envMap), A && A.dispose();
  }
  _buildSea() {
    this.U.uWaveTex.value = UB(256, 11);
    const A = [0];
    let M = 1.5;
    for (; M < 6e3; ) A.push(M), M = M * 1.1 + 0.5;
    A.push(6e3);
    const N = 128, I = [], D = [];
    I.push(0, 0, 0);
    for (let O = 1; O < A.length; O++) for (let z = 0; z < N; z++) {
      const C = z / N * Math.PI * 2;
      I.push(Math.cos(C) * A[O], 0, Math.sin(C) * A[O]);
    }
    for (let O = 0; O < N; O++) D.push(0, 1 + (O + 1) % N, 1 + O);
    for (let O = 1; O < A.length - 1; O++) {
      const z = 1 + (O - 1) * N, C = 1 + O * N;
      for (let E = 0; E < N; E++) {
        const P = (E + 1) % N;
        D.push(z + E, z + P, C + P, z + E, C + P, C + E);
      }
    }
    const T = new FM();
    T.setAttribute("position", new xM(I, 3)), T.setAttribute("normal", new xM(new Float32Array(I.length).map((O, z) => z % 3 === 1 ? 1 : 0), 3)), T.setIndex(D);
    const w = { ...ME.clone(vM.lights), ...this.U };
    this.seaMat = new PN({ name: "Sea", uniforms: w, vertexShader: MB, fragmentShader: jB, lights: true, fog: false }), this.sea = new GM(T, this.seaMat), this.sea.name = "Sea", this.sea.position.y = _M, this.sea.frustumCulled = false, this.sea.receiveShadow = true, this.sea.renderOrder = -1, this.sea.onBeforeRender = (O, z, C) => this._renderReflection(O, z, C), this.root.add(this.sea);
  }
  _renderReflection(A, M, N) {
    const I = this.U;
    if (!this._marina || this._reflBusy || M.overrideMaterial || this._reflFrame === this._frameId) return;
    this._reflFrame = this._frameId;
    const D = nN.settings?.quality || "high", T = !this.reflections || D === "low" ? 0 : (D === "medium" ? 0.28 : D === "ultra" ? 0.5 : 0.4) * (this.reflScale ?? 1), w = _g[0].setFromMatrixPosition(N.matrixWorld);
    if (!T || w.y < _M + 0.05) {
      I.uReflOn.value = 0;
      return;
    }
    this._reflRT || (this._reflRT = new YI(64, 64, { type: OD, format: _j, colorSpace: xN, depthBuffer: true, stencilBuffer: false, minFilter: SN, magFilter: aj, generateMipmaps: true }), this._reflRT.texture.name = "SeaReflection", this._reflCam = new NN(), this._reflCam.matrixAutoUpdate = true, I.uReflTex.value = this._reflRT.texture);
    const O = this._reflRT, z = this._reflCam;
    A.getDrawingBufferSize(sy);
    const C = Math.max(64, Math.round(sy.x * T)), E = Math.max(64, Math.round(sy.y * T));
    (O.width !== C || O.height !== E) && O.setSize(C, E);
    const P = _g[1].set(0, 0, -1).transformDirection(N.matrixWorld), g = _g[2].set(0, 1, 0).transformDirection(N.matrixWorld);
    P.y = -P.y, g.y = -g.y, z.position.set(w.x, 2 * _M - w.y, w.z), z.up.copy(g), z.lookAt(_g[3].copy(z.position).add(P)), z.updateMatrixWorld(true), z.layers.mask = N.layers.mask, z.projectionMatrix.copy(N.projectionMatrix), KT.normal.set(0, 1, 0), KT.constant = -_M, KT.applyMatrix4(z.matrixWorldInverse);
    const Q = DL[0].set(KT.normal.x, KT.normal.y, KT.normal.z, KT.constant), x = z.projectionMatrix.elements, U = DL[1].set((Math.sign(Q.x) + x[8]) / x[0], (Math.sign(Q.y) + x[9]) / x[5], -1, (1 + x[10]) / x[14]);
    Q.multiplyScalar(2 / Q.dot(U)), x[2] = Q.x, x[6] = Q.y, x[10] = Q.z + 1, x[14] = Q.w, z.projectionMatrixInverse.copy(z.projectionMatrix).invert(), I.uReflMat.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(z.projectionMatrix).multiply(z.matrixWorldInverse);
    const k = A.getRenderTarget(), s = A.xr.enabled, v = A.shadowMap.autoUpdate, S = A.shadowMap.needsUpdate;
    A.getClearColor(TL);
    const q = A.getClearAlpha(), c = [this.sea, this.sky, this.lhBeam, this.city, this.terrain, this.staticScenery, this.ferris, this.trees, this.sailInst, this.gullInst];
    if (D !== "ultra") {
      for (const r of nN.actors || []) r.character && r.character.root && c.push(r.character.root);
      c.push(...this._reflSkips(M));
    }
    for (let r = c.length - 1; r >= 0; r--) c[r] || c.splice(r, 1);
    const G = c.map((r) => r.visible);
    this._reflBusy = true;
    try {
      for (const r of c) r.visible = false;
      A.xr.enabled = false, A.shadowMap.autoUpdate = false, A.shadowMap.needsUpdate = false, A.setRenderTarget(O), A.setClearColor(0, 0), A.clear(true, true, false), A.render(M, z);
    } finally {
      c.forEach((r, t) => {
        r.visible = G[t];
      }), A.xr.enabled = s, A.shadowMap.autoUpdate = v, A.shadowMap.needsUpdate = S, A.setClearColor(TL, q), A.setRenderTarget(k), this._reflBusy = false;
    }
    I.uReflOn.value = 1;
  }
  _bakeFarReflection() {
    const A = this.U;
    if (!this._marina) {
      A.uFarOn.value = 0;
      return;
    }
    const M = this.renderer;
    this._farRT || (this._farRT = new hx(512, { type: OD, format: _j, colorSpace: xN, generateMipmaps: true, minFilter: SN, magFilter: aj }), this._farRT.texture.name = "FarReflection", this._farCam = new Gx(2, 3e4, this._farRT), A.uFarCube.value = this._farRT.texture);
    const N = new Set([this.terrain, this.city, this.staticScenery, this.ferris, this.trees].filter(Boolean)), I = [];
    for (const P of this.scene.children) P !== this.root && P.visible && !P.isLight && (P.visible = false, I.push(P));
    for (const P of this.root.children) P.visible && !N.has(P) && (P.visible = false, I.push(P));
    const D = this.bounds;
    this._farCam.position.set((D.minX + D.maxX) / 2, _M + 1.5, (D.minZ + D.maxZ) / 2), this._farCam.updateMatrixWorld(true);
    const T = M.getRenderTarget(), w = M.autoClear, O = M.getClearColor(new lA()), z = M.getClearAlpha(), C = M.shadowMap.autoUpdate, E = M.shadowMap.needsUpdate;
    try {
      M.shadowMap.autoUpdate = false, M.shadowMap.needsUpdate = !this.sun.shadow.map, M.autoClear = true, M.setClearColor(0, 0), this._farCam.update(M, this.scene);
    } finally {
      for (const P of I) P.visible = true;
      M.setClearColor(O, z), M.autoClear = w, M.setRenderTarget(T), M.shadowMap.autoUpdate = C, M.shadowMap.needsUpdate = E;
    }
    A.uFarOn.value = 1;
  }
  _reflSkips(A) {
    const M = A.children.find((D) => D.name === "props"), N = A.children.length + ":" + (M ? M.uuid + M.children.length : "-");
    if (this._reflSkipKey === N) return this._reflSkipList;
    const I = [];
    for (const D of A.children) (D.name === "FX" || D.name === "decor") && I.push(D);
    if (M) for (const D of M.children) /glow|blink|flags|spin:|fence|blob|foliage/.test(D.name || "") && I.push(D);
    return this._reflSkipKey = N, this._reflSkipList = I, I;
  }
  _stageMarina() {
    const A = nN.level && nN.level.layout;
    return !!(A && (A.water === "marina" || A.id === "halyard"));
  }
  _marinaSets() {
    const A = nN.level, M = [], N = [];
    if (A) for (const I of A.blocks) {
      if (!I.solid || I.hidden || I.grate) continue;
      const D = I.aabbMin, T = I.aabbMax, w = D.y < _M - 0.02 && T.y > -30, O = !w && D.y >= _M - 0.02 && D.y < _M + 0.9;
      if (!w && !O) continue;
      const z = yB(I);
      z && (z.y0 = D.y, z.y1 = T.y, (w ? N : M).push(z));
    }
    return { decks: M, wet: N };
  }
  _applyMarina() {
    const A = this.U;
    this.marinaFx && (this.root.remove(this.marinaFx), this.marinaFx.traverse((I) => {
      I.geometry && I.geometry.dispose();
    }), this.marinaFx = null);
    const M = this._marina;
    if ("MARINA" in this.seaMat.defines !== M && (M ? this.seaMat.defines.MARINA = "" : delete this.seaMat.defines.MARINA, this.seaMat.needsUpdate = true), !M) {
      this._marinaData = null, A.uWetCount.value = 0, A.uReflOn.value = 0, this._syncDeckShading();
      return;
    }
    const N = this._marinaData = this._marinaSets();
    A.uArena.value.set(this.bounds.minX, this.bounds.minZ, this.bounds.maxX, this.bounds.maxZ), this._syncDeckShading(), this._buildFoamField([...this._foamShapes || [], ...this._waterContours(N.wet)]), this._buildMarinaFx(N);
  }
  _buildMarinaFx(A) {
    const M = nN.level;
    if (!M) return;
    const N = new oj();
    N.name = "MarinaWaterline";
    const I = (g, Q) => !A.decks.some((x) => Xg(x, g, Q)) && !A.wet.some((x) => Xg(x, g, Q)), D = [], T = [], w = [], O = (g, Q, x, U, k, s, v) => {
      D.push(...g, ...Q, ...x, ...g, ...x, ...U);
      for (let S = 0; S < 6; S++) T.push(k.x, k.y, k.z), w.push(s.r, s.g, s.b, v);
    }, z = 0.012;
    for (const g of M.faces) {
      const Q = M.blocks[g.block];
      if (!g.wall || !Q.aligned && Math.abs(Q.axes[1].y) < 0.9999 || Q.hidden || Q.grate || !Q.solid) continue;
      const x = Q.aabbMin.y, U = Q.aabbMax.y, k = x < _M - 0.02 && U > _M + 0.02, s = !k && x >= _M - 0.02 && x < _M + 0.9;
      if (!k && !s) continue;
      const v = k ? 0.035 : z, S = k ? _M - 0.1 : x + 4e-3, q = Math.min(k ? U - 0.16 : U - 0.36, k ? _M + 1.7 : x + 1.15);
      if (q < S + 0.15) continue;
      const c = g.n, G = g.u, r = Math.max(2, Math.ceil(g.su / 0.2)), t = g.su / r, p = (h, X) => {
        const TA = h < 0.01 ? 0.15 : 0.03, Z = X > g.su - 0.01 ? 0.15 : 0.03;
        if (h += TA, X -= Z, X - h < 0.25) return;
        const W = (PA, MA) => [g.origin.x + G.x * PA + c.x * v, MA, g.origin.z + G.z * PA + c.z * v];
        O(W(h, S), W(X, S), W(X, q), W(h, q), c, g.color, k ? 1 : 0);
      };
      let f = -1;
      for (let h = 0; h <= r; h++) {
        const X = h * t, TA = I(g.origin.x + G.x * X + c.x * 0.3, g.origin.z + G.z * X + c.z * 0.3);
        TA && f < 0 && (f = X), f >= 0 && (!TA || h === r) && (p(f, TA ? X : X - t), f = -1);
      }
    }
    const C = [], E = new DA(0, -1, 0), P = new lA("#2e2923");
    for (const g of A.decks) {
      const Q = g.y0 - 2e-3, x = 4e-3;
      let U, k, s, v;
      if (g.aligned) U = [g.minX + x, Q, g.minZ + x], k = [g.maxX - x, Q, g.minZ + x], s = [g.maxX - x, Q, g.maxZ - x], v = [g.minX + x, Q, g.maxZ - x];
      else {
        const q = (r, t) => {
          const p = xw(g, r, t);
          return [p[0], Q, p[1]];
        }, c = g.hx - x, G = g.hz - x;
        U = q(-c, -G), k = q(c, -G), s = q(c, G), v = q(-c, G);
      }
      C.push(...U, ...k, ...s, ...U, ...s, ...v);
      const S = Q - 6e-3;
      O([U[0], S, U[2]], [k[0], S, k[2]], [s[0], S, s[2]], [v[0], S, v[2]], E, P.clone().multiplyScalar(4), 0);
    }
    if (C.length) {
      const g = new FM();
      g.setAttribute("position", new xM(C, 3)), g.computeVertexNormals();
      const Q = new GM(g, this._underMat || (this._underMat = new yj({ color: P, roughness: 0.95, metalness: 0 })));
      Q.name = "SlabUndersides", N.add(Q);
    }
    if (D.length) {
      const g = new FM();
      if (g.setAttribute("position", new xM(D, 3)), g.setAttribute("normal", new xM(T, 3)), g.setAttribute("aInfo", new xM(w, 4)), !this._stripMat) {
        const x = { ...ME.clone(vM.lights), uTime: this.U.uTime, uSunDir: this.U.uSunDir, uSunLight: this.U.uSunLight, uStripK: this.U.uStripK };
        this._stripMat = new PN({ name: "Waterline", uniforms: x, vertexShader: gB, fragmentShader: EB, lights: true, fog: false, transparent: true, depthWrite: false, blending: kx, blendEquation: eD, blendSrc: Q4, blendDst: XO, blendSrcAlpha: Ux, blendDstAlpha: Q4, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
      }
      const Q = new GM(g, this._stripMat);
      Q.name = "WaterlineStrips", Q.receiveShadow = true, Q.frustumCulled = false, N.add(Q);
    }
    this.marinaFx = N, this.root.add(N);
  }
  _buildFoamField(A) {
    const M = this._marina, N = this.bounds, I = 22, D = M ? 0.1 : 0.2, T = M ? 2.5 : 8, w = N.minX - I, O = N.minZ - I, z = Math.ceil((N.maxX - N.minX + I * 2) / D), C = Math.ceil((N.maxZ - N.minZ + I * 2) / D), E = new Uint8Array(z * C).fill(255), P = (Q, x, U, k, s, v) => {
      const S = s - U, q = v - k, c = S * S + q * q, G = c > 0 ? Math.min(1, Math.max(0, ((Q - U) * S + (x - k) * q) / c)) : 0;
      return Math.hypot(Q - U - S * G, x - k - q * G);
    };
    for (const Q of A) {
      const x = Q.r + (Q.reach ?? 3), U = Math.max(0, Math.floor((Math.min(Q.ax, Q.bx) - x - w) / D)), k = Math.min(z - 1, Math.ceil((Math.max(Q.ax, Q.bx) + x - w) / D)), s = Math.max(0, Math.floor((Math.min(Q.az, Q.bz) - x - O) / D)), v = Math.min(C - 1, Math.ceil((Math.max(Q.az, Q.bz) + x - O) / D));
      for (let S = s; S <= v; S++) for (let q = U; q <= k; q++) {
        const c = w + (q + 0.5) * D, G = O + (S + 0.5) * D, r = Math.max(0, P(c, G, Q.ax, Q.az, Q.bx, Q.bz) - Q.r), t = Math.min(255, Math.round(r / T * 255)), p = S * z + q;
        t < E[p] && (E[p] = t);
      }
    }
    const g = new DI(E, z, C, sC, zI);
    g.unpackAlignment = 1, g.magFilter = aj, g.minFilter = aj, g.colorSpace = xN, g.needsUpdate = true, this.U.uFoamTex.value && this.U.uFoamTex.value.dispose(), this.U.uFoamTex.value = g, this.U.uFoamRect.value.set(w, O, 1 / (z * D), 1 / (C * D)), this.U.uMarinaK.value.w = T;
  }
  _waterContours(A) {
    const M = [], N = this.bounds, I = 21, D = N.minX - I, T = N.maxX + I, w = N.minZ - I, O = N.maxZ + I, z = _M, C = new DA(), E = new DA(), P = new DA(), g = [], Q = (s, v) => A.some((S) => Xg(S, s, v, 0.12)), x = (s, v) => {
      const S = (z - s.y) / (v.y - s.y);
      g.push(s.x + (v.x - s.x) * S, s.z + (v.z - s.z) * S);
    }, U = (s, v) => {
      const S = s.attributes.position, q = s.index;
      if (!S) return;
      s.boundingBox || s.computeBoundingBox();
      const c = iB.copy(s.boundingBox);
      if (v && c.applyMatrix4(v), c.min.y > z || c.max.y < z || c.max.x < D || c.min.x > T || c.max.z < w || c.min.z > O) return;
      const G = q ? q.count : S.count;
      for (let r = 0; r + 2 < G; r += 3) {
        const t = q ? q.getX(r) : r, p = q ? q.getX(r + 1) : r + 1, f = q ? q.getX(r + 2) : r + 2;
        if (!v) {
          const PA = S.getY(t) - z, MA = S.getY(p) - z, wA = S.getY(f) - z;
          if (PA > 0 && MA > 0 && wA > 0 || PA <= 0 && MA <= 0 && wA <= 0) continue;
        }
        C.fromBufferAttribute(S, t), E.fromBufferAttribute(S, p), P.fromBufferAttribute(S, f), v && (C.applyMatrix4(v), E.applyMatrix4(v), P.applyMatrix4(v));
        const h = C.y > z, X = E.y > z, TA = P.y > z;
        if (h === X && X === TA || (g.length = 0, h !== X && x(C, E), X !== TA && x(E, P), TA !== h && x(P, C), g.length !== 4)) continue;
        const Z = (g[0] + g[2]) / 2, W = (g[1] + g[3]) / 2;
        Z < D || Z > T || W < w || W > O || Q(Z, W) || M.push({ ax: g[0], az: g[1], bx: g[2], bz: g[3], r: 0, reach: 1.6 });
      }
    }, k = new YM();
    for (const s of this.scene.children) s === this.root || s.name !== "props" || (s.updateMatrixWorld(true), s.traverse((v) => {
      if (!(!v.isMesh || !v.geometry || v.visible === false)) if (v.isInstancedMesh) for (let S = 0; S < v.count; S++) v.getMatrixAt(S, k), k.premultiply(v.matrixWorld), U(v.geometry, k);
      else U(v.geometry, v.matrixWorld.equals(LB) ? null : v.matrixWorld);
    }));
    return M;
  }
  _insideFootprint(A, M) {
    return this.footprint.some((N) => Xg(N, A, M));
  }
  _insideBounds(A, M) {
    const N = this.bounds;
    return A > N.minX + 0.01 && A < N.maxX - 0.01 && M > N.minZ + 0.01 && M < N.maxZ - 0.01;
  }
  _boundaryRuns() {
    const A = [];
    for (const M of this.footprint) for (const N of QB(M)) {
      const I = Math.hypot(N.bx - N.ax, N.bz - N.az), D = 0.25;
      let T = -1;
      const w = Math.floor(I / D);
      for (let O = 0; O <= w; O++) {
        const z = O * D, C = z / I, E = N.ax + (N.bx - N.ax) * C, P = N.az + (N.bz - N.az) * C, g = !this._insideFootprint(E + N.nx * 0.05, P + N.nz * 0.05);
        if (g && T < 0 && (T = z), T >= 0 && (!g || O === w)) {
          const Q = g ? z : z - D;
          Q - T > 0.6 && A.push({ ...N, len: I, s0: T, s1: Q }), T = -1;
        }
      }
    }
    return A;
  }
  _buildDock() {
    const A = this.bounds, M = this._marina, N = this._boundaryRuns();
    this._runs = N;
    const I = [], D = [];
    for (const p of M ? [] : N) {
      const f = (p.bx - p.ax) / p.len, h = (p.bz - p.az) / p.len, X = p.s1 - p.s0, TA = Math.max(2, Math.round(X / 3.4) + 1);
      for (let Z = 0; Z < TA; Z++) {
        const W = p.s0 + 0.3 + (X - 0.6) * (Z / (TA - 1)), PA = p.ax + f * W, MA = p.az + h * W;
        let wA = PA + p.nx * 0.24, xA = MA + p.nz * 0.24, YA = -0.07, eA = 0.2;
        this._insideBounds(wA, xA) && (wA = PA - p.nx * 0.45, xA = MA - p.nz * 0.45, YA = -1.2, eA = 0.24), I.push([wA, xA, eA, YA]), D.push({ ax: wA, az: xA, bx: wA, bz: xA, r: eA });
      }
    }
    for (const p of this.footprint) if (p.aligned) for (let f = p.minX + 3.5; f <= p.maxX - 3.5; f += 7) for (let h = p.minZ + 3.5; h <= p.maxZ - 3.5; h += 7) I.push([f, h, 0.3, -1.2]);
    else for (let f = -p.hx + 3.5; f <= p.hx - 3.5 + 1e-6; f += 7) for (let h = -p.hz + 3.5; h <= p.hz - 3.5 + 1e-6; h += 7) {
      const [X, TA] = xw(p, f, h);
      I.push([X, TA, 0.3, -1.2]);
    }
    const T = M || nN.level?.layout?.envBoats === false ? [] : [{ kind: "fishing", x: A.maxX + 3.25, z: A.minZ + (A.maxZ - A.minZ) * 0.77, yaw: 0 }, { kind: "launch", x: A.minX - 2.85, z: A.minZ + (A.maxZ - A.minZ) * 0.2, yaw: Math.PI }, { kind: "row", x: A.minX - 1.75, z: A.minZ + (A.maxZ - A.minZ) * 0.86, yaw: 0.12 }];
    this._mooredSpec = T;
    const w = (p, f, h, X) => {
      let TA = null, Z = 8;
      for (const W of N) {
        if (W.nx * h + W.nz * X < 0.5) continue;
        const PA = (W.bx - W.ax) / W.len, MA = (W.bz - W.az) / W.len, wA = Math.min(W.s1, Math.max(W.s0, (p - W.ax) * PA + (f - W.az) * MA)), xA = W.ax + PA * wA, YA = W.az + MA * wA, eA = Math.hypot(xA - p, YA - f);
        eA < Z && (Z = eA, TA = { x: xA, z: YA, nx: W.nx, nz: W.nz });
      }
      return TA && Z < 1e-6 && TA.nx === h && TA.nz === X ? { x: p, z: f, nx: h, nz: X } : TA;
    }, O = (p) => z.push(nA(zN(new jI(0.09, 0.02, 5, 10), "#8d969e"), p.x + p.nx * 0.04, -0.36, p.z + p.nz * 0.04, p.nz === 0 ? Math.PI / 2 : Math.atan2(p.nx, p.nz))), z = [], C = (p, f, h = 0.35, X = 0.035) => z.push(oy(kB(p, f, h), X, "#dccaa0")), E = (p, f, h = -0.28) => {
      for (let X = 0; X < 3; X++) {
        const TA = X * 2.094 + 0.3;
        I.push([p + Math.cos(TA) * 0.42, f + Math.sin(TA) * 0.42, 0.22, h - 0.25]);
      }
      return D.push({ ax: p, az: f, bx: p, bz: f, r: 0.7 }), z.push(nA(lM(1.5, 0.45, 1.5, "#d6cfc2"), p, h, f)), z.push(nA(lM(1.56, 0.08, 1.56, "#b8b0a2"), p, h - 0.26, f)), z.push(nA(Ej(0.16, 0.19, 0.38, 10, "#44505b"), p, h + 0.41, f)), z.push(nA(Ej(0.26, 0.22, 0.12, 12, "#f1c95a"), p, h + 0.62, f)), [p, h + 0.45, f];
    };
    for (const p of T) {
      const f = p.kind === "fishing" ? 8.6 : p.kind === "launch" ? 6.4 : 3.4, h = p.x > 0 ? 1 : -1, X = Math.cos(p.yaw) >= 0 ? 1 : -1;
      D.push({ ax: p.x, az: p.z - f * 0.46, bx: p.x, bz: p.z + f * 0.46, r: p.kind === "row" ? 0.55 : 1.05 });
      const TA = h > 0 ? A.maxX : A.minX;
      if (p.kind !== "row") {
        const Z = E(p.x + h * 0.4, p.z + X * (f * 0.5 + 3.2)), W = E(p.x + h * 0.4, p.z - X * (f * 0.5 + 3.2)), PA = p.kind === "fishing" ? 1.15 : 0.85, MA = [p.x, _M + PA + 0.35, p.z + X * f * 0.42], wA = [p.x, _M + PA + 0.05, p.z - X * f * 0.44];
        C(MA, Z, 0.35), C(wA, W, 0.35);
        const xA = w(TA, p.z + 2.8, h, 0), YA = w(TA, p.z - 3.2, h, 0);
        xA && C([p.x - h * 1, _M + PA, p.z + 1], [xA.x + xA.nx * 0.06, -0.3, xA.z + xA.nz * 0.06], 0.2), YA && C([p.x - h * 1, _M + PA, p.z - 1.4], [YA.x + YA.nx * 0.06, -0.3, YA.z + YA.nz * 0.06], 0.2);
        for (const eA of [xA, YA]) eA && O(eA);
      } else {
        const Z = w(TA, p.z + 2.6, h, 0);
        Z && (C([p.x, _M + 0.5, p.z + 1.5], [Z.x + Z.nx * 0.06, -0.3, Z.z + Z.nz * 0.06], 0.25, 0.025), O(Z));
      }
    }
    const P = [];
    for (const p of M ? [] : N) {
      const f = (p.bx - p.ax) / p.len, h = (p.bz - p.az) / p.len, X = p.ax + f * (p.s0 + p.s1) / 2 + p.nx * 0.3, TA = p.az + h * (p.s0 + p.s1) / 2 + p.nz * 0.3;
      if (!this._insideBounds(X, TA)) for (let Z = p.s0 + 2.1; Z < p.s1 - 1.5; Z += 6.8) P.push({ run: p, s: Z, dx: f, dz: h });
    }
    const g = new jI(0.34, 0.13, 6, 12);
    P.forEach((p) => {
      const { run: f, s: h, dx: X, dz: TA } = p, Z = f.ax + X * h + f.nx * 0.16, W = f.az + TA * h + f.nz * 0.16, PA = Math.atan2(f.nx, f.nz);
      z.push(nA(zN(g.clone(), "#3b3f47"), Z, -0.66, W, PA)), z.push(nA(Ej(0.022, 0.022, 0.42, 5, "#d8c69c"), Z + f.nx * 0.02, -0.12, W + f.nz * 0.02));
    });
    const Q = (p, f, h, X) => {
      const TA = Math.atan2(h, X), Z = Math.cos(TA), W = -Math.sin(TA), PA = 0.08;
      for (const MA of [-0.28, 0.28]) z.push(nA(Ej(0.035, 0.035, 2.3, 6, "#aab3bb"), p + h * PA + Z * MA, -0.95, f + X * PA + W * MA));
      for (let MA = -1.9; MA < 0; MA += 0.32) z.push(nA(Ej(0.025, 0.025, 0.56, 5, "#aab3bb"), p + h * PA, MA, f + X * PA, TA, 0, Math.PI / 2));
      z.push(oy([[p + h * PA + Z * 0.28, -0.1, f + X * PA + W * 0.28], [p + h * 0.02 + Z * 0.28, 0.02, f + X * 0.02 + W * 0.28]], 0.035, "#aab3bb"));
    };
    if (T.length) for (const [p, f, h] of [[A.maxX, T[0].z - 5.5, 1], [A.minX, T[1].z + 4.5, -1]]) {
      const X = w(p, f, h, 0);
      X && Q(X.x, X.z, X.nx, X.nz);
    }
    const x = uN([zN(new KN(1, 1, 1, 9, 1, true), "#ffffff"), nA(zN(new aT(1, 9), "#ffffff"), 0, 0.5, 0, 0, -Math.PI / 2)]);
    nA(x, 0, 0.5, 0), SU(x, (p, f, h, X, TA) => TA > 0.5 ? new lA("#e3d8c4") : null);
    const U = MD(new yj({ vertexColors: true, roughness: 0.85, metalness: 0 }), this.U, { waterline: true }), k = new iI(x, U, I.length), s = y4(5), v = new lA("#b99c7d"), S = new lA("#a88d74"), q = new lA("#b7b3aa"), c = new lA(), G = _M - 3.5;
    I.forEach((p, f) => {
      const h = p[3] - G;
      MI.compose(ET.set(p[0], G, p[1]), fD.setFromEuler(TD.set(0, s() * 6, 0)), PT.set(p[2], h, p[2])), k.setMatrixAt(f, MI), p[2] >= 0.29 ? c.copy(q) : c.copy(v).lerp(S, s()), k.setColorAt(f, c);
    }), k.name = "Pilings", k.receiveShadow = true, k.castShadow = true, k.computeBoundingSphere(), this.root.add(k), this.pilings = k;
    const r = MD(new yj({ vertexColors: true, roughness: 0.7, metalness: 0.05 }), this.U, { waterline: true });
    this.dockProps = new GM(z.length ? uN(z) : new FM(), r), this.dockProps.name = "DockProps", this.dockProps.receiveShadow = true, this.dockProps.castShadow = true, this.root.add(this.dockProps);
    const t = MD(new yj({ vertexColors: true, roughness: 0.58, metalness: 0 }), this.U, { waterline: true });
    this.moored = [];
    for (const p of T) {
      const f = p.kind === "fishing" ? this._fishingBoatGeo() : p.kind === "launch" ? this._launchGeo() : this._rowboatGeo(), h = new GM(f, t);
      h.name = "Moored_" + p.kind, h.castShadow = true, h.receiveShadow = true, h.position.set(p.x, _M, p.z), h.rotation.y = p.yaw, this.root.add(h), this.moored.push({ mesh: h, spec: p, phase: s() * 10, roll: p.kind === "row" ? 0.05 : 0.025 });
    }
    this._foamShapes = D;
  }
  _fishingBoatGeo() {
    const A = [$g({ L: 8.6, B: 2.9, D: 0.75, F: 1.15, sheer: 0.55, hull: "#f4f1ea", stripe: "#5f93b8", bottom: "#d0675c", deck: "#d7c29c" })];
    A.push(nA(lM(2, 1.6, 2.2, "#f7f5f0"), 0, 1.85, -0.9)), A.push(nA(lM(2.25, 0.14, 2.5, "#5f93b8"), 0, 2.72, -0.9));
    for (const M of [-1.01, 1.01]) A.push(nA(lM(0.04, 0.6, 1.5, "#23364a"), M, 2.1, -0.9));
    return A.push(nA(lM(1.6, 0.6, 0.04, "#23364a"), 0, 2.1, 0.21)), A.push(nA(Ej(0.06, 0.08, 3.6, 6, "#e8e4dc"), 0, 3.9, -0.6)), A.push(eN(0, 3.2, -0.6, 0, 1.6, 3.2, 0.08, "#e8e4dc")), A.push(nA(lM(0.9, 0.08, 0.2, "#dfe3e6"), 0, 5.2, -0.6)), A.push(nA(dj(0.1, 8, 6, "#ffe7b0", 1), 0, 5.75, -0.6)), A.push(nA(Ej(0.45, 0.45, 1.3, 12, "#6b8f6a"), 0, 1.45, -3.1, 0, 0, Math.PI / 2)), A.push(nA(lM(0.7, 0.35, 0.5, "#f0a66b"), 0.6, 1.2, 2)), A.push(nA(lM(0.7, 0.35, 0.5, "#8cc3d9"), -0.5, 1.2, 2.3)), A.push(nA(zN(new jI(0.28, 0.07, 6, 14), "#ff7f5c"), 1.03, 1.9, -1.2, Math.PI / 2)), uN(A);
  }
  _launchGeo() {
    const A = [$g({ L: 6.4, B: 2.3, D: 0.55, F: 0.85, sheer: 0.4, hull: "#dff0ec", stripe: "#e98b6d", bottom: "#3d5c7a", deck: "#e7dcc6" })];
    A.push(nA(lM(1.6, 0.9, 1.4, "#fbfaf7"), 0, 1.25, 0.4)), A.push(eN(-0.75, 1.7, 1.1, 0.75, 1.7, 1.1, 0.05, "#2a3b4d")), A.push(nA(lM(1.5, 0.5, 0.05, "#23364a"), 0, 1.95, 1.05, 0, -0.5)), A.push(nA(lM(1.8, 0.08, 1.6, "#e98b6d"), 0, 2.15, 0.2));
    for (const M of [-0.8, 0.8]) A.push(nA(Ej(0.03, 0.03, 0.75, 5, "#d0d6da"), M, 1.78, -0.45));
    return A.push(nA(lM(0.45, 0.9, 0.5, "#3a3f47"), 0, 0.85, -3.35)), A.push(nA(lM(1.9, 0.08, 1.6, "#e7dcc6"), 0, 0.85, -1.9)), uN(A);
  }
  _rowboatGeo() {
    const A = [$g({ L: 3.4, B: 1.35, D: 0.3, F: 0.45, sheer: 0.18, hull: "#f2d38b", stripe: "#c8745b", bottom: "#8e5b4a", deck: "#b58b62" })];
    for (const M of [-0.6, 0.45]) A.push(nA(lM(1.2, 0.06, 0.28, "#b58b62"), 0, 0.42, M));
    return A.push(eN(-0.5, 0.52, -0.2, 0.9, 0.3, 1.2, 0.05, "#d9b98c")), A.push(eN(0.5, 0.52, -0.2, -0.3, 0.35, 1.3, 0.05, "#d9b98c")), uN(A);
  }
  _buildScenery() {
    const A = this.U, M = [], N = MD(new yj({ vertexColors: true, roughness: 0.92, metalness: 0 }), A, { shore: true }), I = y4(42), D = [], T = [], w = (MA) => {
      const wA = YB(MA);
      return T.push(wA.geo), D.push({ ...MA, isl: wA }), wA;
    }, [O, z] = PI(22, 900), C = w({ x: O, z, rx: 600, rz: 360, h: 3.2, seed: 3, rot: 112 * DD, plateau: true, R: 10, S: 56, grass: "#c5d3ac" });
    this._cityIsland = C, this._cityFrame = { cx: O, cz: z, rot: 112 * DD };
    for (const [MA, wA, xA, YA, eA] of [[8, 1450, 420, 210, 11], [40, 1520, 380, 260, 12], [68, 1380, 300, 170, 13], [-22, 1320, 330, 150, 14], [95, 1600, 360, 230, 15]]) {
      const [TM, AM] = PI(MA, wA);
      w({ x: TM, z: AM, rx: xA, rz: xA * 0.62, h: YA * 0.85, seed: eA, rot: (MA + 90) * DD, R: 20, S: 84, grass: "#7fb86f", ridge: 0.4 });
    }
    const E = [{ a: 178, d: 640, rx: 250, rz: 120, h: 72, seed: 21, trees: 60 }, { a: 236, d: 300, rx: 42, rz: 30, h: 13, seed: 22, trees: 14 }, { a: 300, d: 470, rx: 95, rz: 60, h: 28, seed: 23, trees: 22 }, { a: 94, d: 1080, rx: 220, rz: 150, h: 62, seed: 24, trees: 26 }, { a: 153, d: 1e3, rx: 240, rz: 160, h: 70, seed: 25, trees: 30 }, { a: 188, d: 1500, rx: 380, rz: 200, h: 120, seed: 26 }, { a: 262, d: 1350, rx: 420, rz: 180, h: 150, seed: 27 }, { a: 318, d: 1600, rx: 380, rz: 200, h: 210, seed: 28 }, { a: 232, d: 1750, rx: 300, rz: 150, h: 90, seed: 29 }];
    for (const MA of E) {
      const [wA, xA] = PI(MA.a, MA.d), YA = MA.rx > 150, eA = w({ x: wA, z: xA, rx: MA.rx, rz: MA.rz, h: MA.h, seed: MA.seed, rot: (MA.a + 90) * DD + (yw(MA.seed, 1) - 0.5), R: YA ? 20 : 12, S: YA ? 84 : 48, ridge: MA.h > 100 ? 0.4 : 0.25, grass: MA.h > 100 ? "#7fb86f" : "#8fca74" });
      MA.isl = eA;
    }
    const [P, g] = PI(248, 178), x = w({ x: P, z: g, rx: 24, rz: 17, h: 7.5, seed: 31, rot: 0.4, R: 9, S: 32, ridge: 0.6, grass: "#a7cf8a" }).heightAt(P, g);
    this._buildLighthouse(M, P, x - 0.3, g);
    const [U, k] = PI(-52, 335), s = Math.atan2(-U, -k), v = _M + 2.7, S = nA(lM(210, v - _M + 6, 80, "#cfc9bd"), U, (v + _M - 6) / 2, k, s);
    M.push(S);
    const q = (MA, wA) => {
      const xA = Math.cos(s), YA = Math.sin(s);
      return [U + MA * xA + wA * YA, k - MA * YA + wA * xA];
    }, c = ["#e8927f", "#6fa6cf", "#e8927f"];
    [-55, 0, 55].forEach((MA, wA) => {
      const [xA, YA] = q(MA, 30);
      M.push(this._craneGeo(xA, v, YA, s, c[wA]));
    });
    const G = ["#e9967a", "#7fb8c9", "#e8c56b", "#a99fd3", "#8fcf9f", "#f2efe8", "#d97f8f", "#6f9fd8"];
    for (let MA = 0; MA < 7; MA++) for (let wA = 0; wA < 12; wA++) {
      if (I() < 0.18) continue;
      const xA = 1 + Math.floor(I() * 4), YA = -85 + wA * 14.5, eA = -25 + MA * 3.1;
      for (let TM = 0; TM < xA; TM++) {
        const [AM, KA] = q(YA + (I() - 0.5) * 0.6, eA);
        M.push(nA(lM(12.2, 2.6, 2.45, G[Math.floor(I() * G.length)]), AM, v + 1.3 + TM * 2.6, KA, s + Math.PI / 2 + (I() - 0.5) * 0.02));
      }
    }
    for (let MA = -100; MA <= 100; MA += 25) {
      const [wA, xA] = q(MA, 38);
      M.push(nA(Ej(0.25, 0.3, 9, 5, "#9aa4ad"), wA, v + 4.5, xA)), M.push(nA(dj(0.9, 6, 4, "#ffd9a0", 1), wA, v + 9.3, xA));
    }
    this._buildBridge(M, PI(97, 960), PI(150, 890));
    let r = 470;
    for (; r < 900 && !(C.heightAt(...PI(4, r)) > _M + 2.6); r += 3) ;
    const [t, p] = PI(4, r + 30);
    this._buildFerris(M, t, C.heightAt(t, p) - 0.3, p);
    for (let MA = -14; MA <= 58; MA += 1.3) {
      let wA = 480;
      for (; wA < 900 && !(C.heightAt(...PI(MA, wA)) > _M + 2.2); wA += 4) ;
      if (wA >= 900) continue;
      const [xA, YA] = PI(MA, wA + 6);
      M.push(nA(Ej(0.3, 0.35, 7, 5, "#a3a9b3"), xA, C.heightAt(xA, YA) + 3.5, YA)), M.push(nA(dj(1.1, 6, 4, "#ffcf8f", 1), xA, C.heightAt(xA, YA) + 7.4, YA));
    }
    const f = MD(new yj({ vertexColors: true, roughness: 0.95, metalness: 0 }), A, { terrain: true, shore: true });
    this.terrain = new GM(uN(T), f), this.terrain.name = "Terrain", this.terrain.frustumCulled = false, this.root.add(this.terrain), this.staticScenery = new GM(uN(M), N), this.staticScenery.name = "FarScenery", this.staticScenery.frustumCulled = false, this.root.add(this.staticScenery), this._buildCity(C, I);
    const h = [nA(Ej(0.35, 0.5, 3.2, 5, "#8a6a52"), 0, 1.6, 0), nA(dj(2.6, 8, 6, "#ffffff"), 0, 4.8, 0, 0.3, 0, 0, 1, 0.9, 1), nA(dj(1.8, 7, 5, "#ffffff"), 0.6, 6.5, 0.3, 1.1)], X = uN(h), TA = [];
    for (const MA of E) {
      if (!MA.trees) continue;
      let wA = 0, xA = 0;
      for (; wA < MA.trees && xA++ < MA.trees * 12; ) {
        const [YA, eA] = MA.isl.sample(I, 0.78), TM = MA.isl.heightAt(YA, eA);
        TM < _M + 2.2 || Math.abs(MA.isl.heightAt(YA + 3, eA) - MA.isl.heightAt(YA - 3, eA)) + Math.abs(MA.isl.heightAt(YA, eA + 3) - MA.isl.heightAt(YA, eA - 3)) > 7 || (TA.push([YA, TM - 0.3, eA, 0.8 + I() * 1.1]), wA++);
      }
    }
    const Z = MD(new yj({ vertexColors: true, roughness: 0.9 }), A, {}), W = new iI(X, Z, TA.length), PA = [new lA("#79b86a"), new lA("#5fa35e"), new lA("#93c979"), new lA("#6aa98a")];
    TA.forEach((MA, wA) => {
      MI.compose(ET.set(MA[0], MA[1], MA[2]), fD.setFromEuler(TD.set(0, I() * 6.28, 0)), PT.set(MA[3], MA[3] * (0.9 + I() * 0.4), MA[3])), W.setMatrixAt(wA, MI), W.setColorAt(wA, PA[wA % PA.length]);
    }), W.name = "Trees", W.frustumCulled = false, this.root.add(W), this.trees = W;
  }
  _buildLighthouse(A, M, N, I) {
    const D = ["#f7f4ee", "#ea7f6e", "#f7f4ee", "#ea7f6e", "#f7f4ee"];
    A.push(nA(Ej(3.4, 3.8, 2.2, 14, "#d9d2c4"), M, N + 1.1, I));
    for (let Q = 0; Q < D.length; Q++) {
      const x = Q / D.length, U = (Q + 1) / D.length;
      A.push(nA(Ej(2.5 + (1.75 - 2.5) * U, 2.5 + (1.75 - 2.5) * x, 17 / D.length, 16, D[Q]), M, N + 2.2 + (x + U) / 2 * 17, I));
    }
    const z = N + 2.2 + 17;
    A.push(nA(Ej(2.5, 2.3, 0.45, 16, "#4c5661"), M, z + 0.22, I));
    for (let Q = 0; Q < 12; Q++) {
      const x = Q / 12 * Math.PI * 2;
      A.push(nA(Ej(0.05, 0.05, 1, 4, "#4c5661"), M + Math.cos(x) * 2.35, z + 0.95, I + Math.sin(x) * 2.35));
    }
    A.push(nA(zN(new jI(2.35, 0.06, 4, 24), "#4c5661"), M, z + 1.45, I, 0, Math.PI / 2)), A.push(nA(Ej(1.3, 1.3, 2.3, 12, "#ffe6a6", 1), M, z + 1.6, I));
    for (let Q = 0; Q < 6; Q++) {
      const x = Q / 6 * Math.PI * 2;
      A.push(nA(lM(0.12, 2.3, 0.12, "#4c5661"), M + Math.cos(x) * 1.32, z + 1.6, I + Math.sin(x) * 1.32));
    }
    A.push(nA(Ej(0.2, 1.6, 1.3, 12, "#ea7f6e"), M, z + 3.4, I)), A.push(nA(dj(0.3, 8, 6, "#4c5661"), M, z + 4.1, I));
    const C = M + 6.5, E = I + 3;
    A.push(nA(lM(6, 3.2, 4.5, "#f4efe4"), C, N + 1.3, E, 0.4)), A.push(nA(zN(new KN(0.01, 3.5, 2.2, 4, 1), "#6f8fb7"), C, N + 3.9, E, 0.4 + Math.PI / 4, 0, 0, 1.25, 1, 0.9)), A.push(nA(lM(0.9, 1, 0.05, "#ffe2a0", 1), C + Math.sin(0.4) * 2.28, N + 1.6, E + Math.cos(0.4) * 2.28, 0.4)), this.lighthouseTop = new DA(M, z + 1.6, I);
    const P = new KN(9, 0.4, 150, 20, 1, true);
    P.translate(0, 75, 0), P.rotateZ(-Math.PI / 2);
    const g = new PN({ uniforms: { uNight: this.U.uNight, uCol: { value: new lA("#ffe2a8") } }, vertexShader: `varying float vA; varying vec3 vN; varying vec3 vV;
        void main(){ vA = clamp(position.x / 150.0, 0.0, 1.0); vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`, fragmentShader: `uniform float uNight; uniform vec3 uCol; varying float vA; varying vec3 vN; varying vec3 vV;
        void main(){ float e = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.0); float a = e * pow(max(1.0 - vA, 0.0), 1.6) * smoothstep(0.0, 0.03, vA) * 0.5 * uNight;
          gl_FragColor = vec4(uCol * a, 1.0); }`, transparent: true, depthWrite: false, blending: II, side: hj, fog: false });
    this.lhBeam = new GM(P, g), this.lhBeam.name = "LighthouseBeam", this.lhBeam.position.copy(this.lighthouseTop), this.lhBeam.frustumCulled = false, this.root.add(this.lhBeam);
  }
  _craneGeo(A, M, N, I, D) {
    const T = [], w = "#f3f0ea";
    for (const z of [-9, 9]) for (const C of [-7, 7]) T.push(nA(lM(1.4, 38, 1.4, D), z, 19, C));
    for (const z of [-7, 7]) T.push(nA(lM(20, 1.8, 1.6, D), 0, 38, z));
    for (const z of [-9, 9]) T.push(nA(lM(1.6, 1.8, 16, D), z, 38, 0)), T.push(nA(lM(1, 1.2, 14, D), z, 16, 0));
    for (const z of [-7, 7]) T.push(eN(-9, 2, z, 9, 36, z, 0.6, D)), T.push(nA(lM(20, 1.2, 1.2, D), 0, 22, z));
    T.push(nA(lM(3.2, 3.2, 100, w), 0, 41, 20)), T.push(nA(lM(4.6, 1.2, 100, D), 0, 39, 20));
    for (const z of [-4, 4]) T.push(eN(z, 40, -6, 0, 64, -8, 1.1, D)), T.push(eN(z, 40, 6, 0, 64, -8, 1, D));
    T.push(eN(0, 64, -8, 0, 42.5, 68, 0.35, "#8f9aa5")), T.push(eN(0, 64, -8, 0, 42.5, 40, 0.35, "#8f9aa5")), T.push(eN(0, 64, -8, 0, 42.5, -28, 0.35, "#8f9aa5")), T.push(nA(lM(10, 6, 12, w), 0, 45.5, -20)), T.push(nA(lM(8, 1, 10, D), 0, 49, -20)), T.push(nA(lM(3, 3.8, 4, w), 0, 36, 10)), T.push(nA(lM(4, 2.2, 6, "#7a8591"), 0, 38.4, 34)), T.push(eN(0, 37.5, 34, 0, 16, 34, 0.25, "#58626c")), T.push(nA(lM(3, 1.2, 12, "#e8c56b"), 0, 15.5, 34)), T.push(nA(dj(0.8, 6, 4, "#ff4a3a", 2), 0, 65, -8)), T.push(nA(dj(0.7, 6, 4, "#ff4a3a", 2), 0, 43.5, 69));
    for (const z of [-9, 9]) for (const C of [-7, 7]) T.push(nA(lM(2.4, 1.6, 3.2, "#5c6670"), z, 0.8, C));
    const O = uN(T);
    return nA(O, A, M, N, I);
  }
  _buildBridge(A, M, N) {
    const I = M[0], D = M[1], T = N[0], w = N[1], O = Math.hypot(T - I, w - D), z = (T - I) / O, C = (w - D) / O, E = -C, P = z, g = Math.atan2(z, C), Q = 32, x = 100, U = "#e59c86", k = "#d98c77", s = (c, G, r) => [I + z * O * c + E * G, r, D + C * O * c + P * G], v = (I + T) / 2, S = (D + w) / 2;
    A.push(nA(lM(22, 3.2, O + 120, "#d8d3ca"), v, Q, S, g)), A.push(nA(lM(22.5, 1.2, O + 120, U), v, Q - 2.1, S, g));
    const q = [0.22, 0.78];
    for (const c of q) {
      for (const t of [-10.5, 10.5]) {
        const [p, f, h] = s(c, t, 0);
        A.push(nA(lM(4.2, x + 6, 4.2, U), p, _M + (x + 6) / 2 - 4, h, g));
      }
      for (const t of [Q + 22, Q + 48, x - 6]) {
        const [p, , f] = s(c, 0, 0);
        A.push(nA(lM(25, 3, 3.4, U), p, _M + t, f, g));
      }
      const [G, , r] = s(c, 0, 0);
      A.push(nA(lM(30, 8, 10, "#cfc9bd"), G, _M + 1, r, g));
    }
    for (const c of [-10.5, 10.5]) {
      const G = q[0], r = q[1], t = _M + x - 2, p = [], f = [], h = [];
      for (let X = 0; X <= 24; X++) {
        const TA = G + (r - G) * (X / 24), Z = X / 24;
        p.push(s(TA, c, t - (t - Q - 3) * (1 - Math.pow(2 * Z - 1, 2))));
      }
      for (let X = 0; X <= 8; X++) {
        const TA = X / 8;
        f.push(s(-0.05 + (G + 0.05) * TA, c, Q + 1 + (t - Q - 1) * TA * TA)), h.push(s(r + (1.05 - r) * TA, c, t - (t - Q - 1) * (1 - (1 - TA) * (1 - TA))));
      }
      for (const X of [p, f, h]) A.push(oy(X, 1, k, 5));
      for (let X = 1; X < 24; X++) {
        const TA = p[X];
        A.push(nA(lM(0.7, TA[1] - Q, 0.7, k), TA[0], (TA[1] + Q) / 2, TA[2]));
      }
      for (let X = 0; X <= 24; X += 2) {
        const TA = p[X];
        A.push(nA(dj(1.2, 6, 4, "#fff1c9", 1), TA[0], TA[1] + 1.2, TA[2]));
      }
      for (let X = -0.04; X <= 1.04; X += 0.035) {
        const TA = s(X, c * 1.02, Q + 2.4);
        A.push(nA(dj(0.9, 5, 3, "#ffcf8f", 1), TA[0], TA[1], TA[2]));
      }
    }
    for (const c of q) for (const G of [-10.5, 10.5]) {
      const [r, , t] = s(c, G, 0);
      A.push(nA(dj(1, 6, 4, "#ff4a3a", 2), r, _M + x + 2, t));
    }
  }
  _buildFerris(A, M, N, I) {
    const T = N + 24 + 5, w = Math.atan2(-M, -I), O = [];
    for (const P of [-3.2, 3.2]) O.push(eN(-12, 0, P, 0, 29, P * 0.35, 1.1, "#f1ede6")), O.push(eN(12, 0, P, 0, 29, P * 0.35, 1.1, "#f1ede6"));
    O.push(nA(lM(30, 1.5, 12, "#d6cfc2"), 0, 0.3, 0)), O.push(nA(lM(10, 5, 8, "#8fbfd9"), 0, 2.5, 0)), A.push(nA(uN(O), M, N, I, w));
    const z = [];
    for (const P of [-1.8, 1.8]) z.push(nA(zN(new jI(24, 0.45, 5, 64), "#f6f3ee"), 0, 0, P));
    const C = 18, E = ["#ff9f8a", "#8fd0e0", "#ffd27a", "#b6a6e8", "#9fdcae", "#ff9fc4"];
    for (let P = 0; P < C; P++) {
      const g = P / C * Math.PI * 2, Q = Math.cos(g), x = Math.sin(g);
      for (const k of [-1.8, 1.8]) z.push(eN(0, 0, k, Q * 24, x * 24, k, 0.28, "#e7e2da"));
      z.push(eN(Q * 24, x * 24, -1.8, Q * 24, x * 24, 1.8, 0.3, "#e7e2da")), z.push(nA(lM(2.4, 2.6, 2.4, E[P % E.length]), Q * (24 + 1.5), x * (24 + 1.5) - 1.2, 0)), z.push(nA(dj(0.55, 5, 3, "#fff0c0", 1), Q * (24 + 0.2), x * (24 + 0.2), 2.3));
      const U = g + Math.PI / C;
      z.push(nA(dj(0.45, 5, 3, "#ffc2e0", 1), Math.cos(U) * (24 * 0.55), Math.sin(U) * (24 * 0.55), 2.1));
    }
    z.push(nA(Ej(1.6, 1.6, 5, 10, "#d6cfc2"), 0, 0, 0, 0, Math.PI / 2)), this._ferrisGeo = uN(z), this._ferrisPose = { x: M, y: T, z: I, yaw: w };
  }
  _buildCity(A, M) {
    const N = this.U, I = this._cityFrame, D = Math.cos(I.rot), T = Math.sin(I.rot), w = [D, T], O = [-T, D], z = -I.rot, C = [], E = [["#eee4d2", "#d8cab0"], ["#e8c4b0", "#d3a791"], ["#f4f2ed", "#d9d6cf"], ["#eadbb6", "#d3bf94"], ["#d4dbe1", "#bac4cc"], ["#dcd4ea", "#c4bad9"], ["#d2e6d8", "#b6d1be"], ["#f1d8d6", "#dcbcba"], ["#e3ddd3", "#c9c0b2"]], P = [["#a9c0d2", "#e6ebef"], ["#a6cbc9", "#e3ecea"], ["#bcc1d8", "#e9eaf1"], ["#b8cfdc", "#eef2f4"]], g = (p, f, h, X) => {
      const TA = p.attributes.position.count, Z = new Float32Array(TA * 3);
      for (let W = 0; W < TA; W++) Z[W * 3] = f, Z[W * 3 + 1] = h, Z[W * 3 + 2] = X;
      return p.setAttribute("bld", new dM(Z, 3)), p;
    }, Q = (p, f) => {
      const h = p.attributes.color.array;
      for (let X = 0; X < h.length; X++) h[X] *= f;
      return p;
    }, x = (p, f, h, X) => {
      for (const TA of p) nA(TA, f, 0, h, X), C.push(TA);
    }, U = (p, f, h, X, TA, Z, W, PA) => {
      const MA = [], wA = M(), xA = Z > 88, YA = Z > 38, eA = xA ? M() < 0.72 : YA && M() < 0.3, TM = eA ? P[Math.floor(M() * P.length)] : E[Math.floor(M() * E.length)], AM = eA ? M() < 0.8 ? 3 : 4 : xA ? 4 : YA ? [1, 2, 4, 1][Math.floor(M() * 4)] : M() < 0.6 ? 1 : 2, KA = 0.95 + M() * 0.1, BA = (qA, UA, VA, zM, dA, QM, mM = 0, aM = 0, QA = 0) => {
        MA.push(g(Q(nA(lM(qA, UA, VA, dA, QA), mM, zM + UA / 2, aM), KA), QM, wA, W));
      };
      let fA = W - 0.6, IM = X, GA = TA, bA = Z;
      if (Z > 70 && M() < 0.5) {
        const qA = 9 + M() * 6;
        BA(X * 1.32, qA, TA * 1.3, fA, TM[1] === "#e6ebef" ? "#dfe3e6" : TM[0], 2), BA(X * 1.36, 0.8, TA * 1.34, fA + qA - 0.4, TM[1], 0), fA += qA, bA -= qA;
      }
      const sM = xA && M() < 0.8 ? Z > 140 ? 3 : 2 : YA && M() < 0.3 ? 2 : 1, WM = sM === 1 ? [1] : sM === 2 ? [0.7, 0.3] : [0.56, 0.27, 0.17];
      for (let qA = 0; qA < sM; qA++) {
        const UA = bA * WM[qA];
        if (BA(IM, UA, GA, fA, TM[0], AM), BA(IM + 0.9, 0.8, GA + 0.9, fA + UA - 0.5, TM[1], 0), fA += UA, qA < sM - 1) {
          const VA = 0.7 + M() * 0.14;
          IM *= VA, GA *= 0.7 + M() * 0.14;
        }
      }
      const cA = M(), MM = "#b7bcc2";
      if (xA && cA < 0.28) {
        let qA = IM, UA = GA, VA = fA;
        for (let zM = 0; zM < 3; zM++) {
          qA *= 0.72, UA *= 0.72;
          const dA = 5 - zM;
          BA(qA, dA, UA, VA, TM[0], 0), VA += dA;
        }
        MA.push(g(nA(Ej(0.25, 0.7, 16, 6, "#d6dadf"), 0, VA + 8, 0), 0, wA, W)), MA.push(g(nA(dj(0.8, 6, 4, "#ff4a3a", 2), 0, VA + 16.4, 0), 0, wA, W));
      } else if (xA && cA < 0.5) {
        const qA = zN(new DN(IM, 16, GA), TM[0]), UA = qA.attributes.position;
        for (let VA = 0; VA < UA.count; VA++) UA.getY(VA) > 0 && UA.getX(VA) > 0 && UA.setY(VA, UA.getY(VA) - 13);
        qA.computeVertexNormals(), MA.push(g(Q(nA(qA, 0, fA + 8, 0), KA), 3, wA, W));
      } else if (xA && cA < 0.72) {
        BA(IM * 0.5, 4, GA * 0.5, fA, MM, 0);
        for (const [qA, UA] of [[-IM * 0.12, 18 + M() * 16], [IM * 0.14, 10 + M() * 8]]) MA.push(g(nA(Ej(0.3, 0.45, UA, 5, "#d0d4d9"), qA, fA + 4 + UA / 2, 0), 0, wA, W)), MA.push(g(nA(dj(0.75, 6, 4, "#ff4a3a", 2), qA, fA + 4 + UA + 0.4, 0), 0, wA, W));
      } else if (xA) MA.push(g(nA(Ej(0.01, Math.min(IM, GA) * 0.7, 12, 4, M() < 0.5 ? "#9cc4b4" : "#d9a58e"), 0, fA + 6, 0, Math.PI / 4), 0, wA, W));
      else if (YA && cA < 0.4) {
        const qA = (M() - 0.5) * IM * 0.4, UA = (M() - 0.5) * GA * 0.4;
        for (const [VA, zM] of [[-1.1, -1.1], [1.1, -1.1], [1.1, 1.1], [-1.1, 1.1]]) MA.push(g(nA(lM(0.25, 3.2, 0.25, "#6b5a4c"), qA + VA, fA + 1.6, UA + zM), 0, wA, W));
        MA.push(g(nA(Ej(1.7, 1.7, 3.4, 10, "#b58d67"), qA, fA + 4.9, UA), 0, wA, W)), MA.push(g(nA(Ej(0.12, 1.9, 1.5, 10, "#8b7361"), qA, fA + 7.3, UA), 0, wA, W));
      } else {
        const qA = 1 + Math.floor(M() * 3);
        for (let UA = 0; UA < qA; UA++) {
          const VA = 2.5 + M() * 4, zM = 2.5 + M() * 4, dA = 1.4 + M() * 2.2;
          BA(VA, dA, zM, fA, UA === 0 && M() < 0.5 ? TM[1] : MM, 0, (M() - 0.5) * (IM - VA) * 0.8, (M() - 0.5) * (GA - zM) * 0.8);
        }
        M() < 0.4 && MA.push(g(nA(Ej(0.7, 0.7, 2.2, 8, "#c4c8cc"), (M() - 0.5) * IM * 0.6, fA + 1.1, (M() - 0.5) * GA * 0.6), 0, wA, W));
      }
      x(MA, p, f, h);
    }, k = (p, f, h, X, TA, Z, W) => {
      const PA = M(), MA = [];
      MA.push(g(nA(Ej(h, h, X, 24, Z), 0, TA - 0.6 + X / 2, 0), 5, PA, TA)), MA.push(g(nA(Ej(h + 0.6, h + 0.6, 0.9, 24, W), 0, TA + X - 0.9, 0), 0, PA, TA)), MA.push(g(nA(Ej(h * 0.55, h * 0.8, 6, 16, W), 0, TA + X + 2.4, 0), 0, PA, TA)), x(MA, p, f, 0);
    }, s = [], v = (p, f) => {
      const [h, X] = PI(p, f);
      return [h, X, A.heightAt(h, X)];
    };
    {
      const [p, f, h] = v(13, 600), X = [], TA = M();
      X.push(g(nA(Ej(2.2, 4.2, 128, 12, "#eef0f2"), 0, h + 64, 0), 0, TA, h));
      for (let Z = 0; Z < 3; Z++) {
        const W = Z * 2.094;
        X.push(g(eN(Math.cos(W) * 9, h, Math.sin(W) * 9, Math.cos(W) * 2, h + 40, Math.sin(W) * 2, 1.2, "#e3e6ea"), 0, TA, h));
      }
      X.push(g(nA(Ej(12, 7, 6, 28, "#f5f6f8"), 0, h + 125, 0), 0, TA, h)), X.push(g(nA(Ej(12.6, 12.6, 3.4, 28, "#9fb7c9"), 0, h + 129.7, 0), 5, TA, h + 128)), X.push(g(nA(Ej(7, 12.6, 3, 28, "#f5f6f8"), 0, h + 132.9, 0), 0, TA, h));
      for (let Z = 0; Z < 14; Z++) {
        const W = Z / 14 * Math.PI * 2;
        X.push(g(nA(dj(0.6, 5, 3, "#fff0c8", 1), Math.cos(W) * 12.4, h + 128.2, Math.sin(W) * 12.4), 0, TA, h));
      }
      X.push(g(nA(Ej(0.45, 1.1, 36, 6, "#dfe2e6"), 0, h + 152, 0), 0, TA, h)), X.push(g(nA(dj(0.9, 6, 4, "#ff4a3a", 2), 0, h + 170.5, 0), 0, TA, h)), x(X, p, f, 0), s.push([p, f, 22]);
    }
    {
      const [p, f, h] = v(27, 790), X = [], TA = M();
      for (let Z = 0; Z < 40; Z++) {
        const W = g(nA(lM(25, 4.25, 25, "#aec6d6"), 0, h + Z * 4.2 + 2.1, 0, Z * 0.042), 3, TA, h);
        X.push(W);
      }
      X.push(g(nA(lM(18, 3, 18, "#e8edf0"), 0, h + 169.5, 0, 40 * 0.042), 0, TA, h)), X.push(g(nA(Ej(0.35, 0.8, 26, 6, "#dfe2e6"), 0, h + 184, 0), 0, TA, h)), X.push(g(nA(dj(0.9, 6, 4, "#ff4a3a", 2), 0, h + 197.5, 0), 0, TA, h)), x(X, p, f, z), s.push([p, f, 24]);
    }
    {
      const [p, f, h] = v(41, 590), X = [], TA = M();
      X.push(g(nA(lM(46, 12, 30, "#f2ece0"), 0, h + 5.4, 0), 1, TA, h)), X.push(g(nA(lM(47, 1, 31, "#dccfb8"), 0, h + 11.6, 0), 0, TA, h)), X.push(g(nA(Ej(12, 12, 9, 28, "#efe8da"), 0, h + 16.5, 0), 1, TA, h)), X.push(g(nA(zN(new yN(12.4, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), "#9fcabd"), 0, h + 21, 0), 0, TA, h)), X.push(g(nA(Ej(1.6, 1.6, 4, 10, "#f2ece0"), 0, h + 35, 0), 0, TA, h)), X.push(g(nA(dj(1.9, 10, 6, "#9fcabd"), 0, h + 37.5, 0), 0, TA, h)), x(X, p, f, z), s.push([p, f, 30]);
    }
    {
      const [p, f, h] = v(5, 770), X = M(), TA = [];
      for (const Z of [-15, 15]) TA.push(g(nA(lM(20, 124, 20, "#b7c9d8"), Z, h + 61.4, 0), 3, X, h)), TA.push(g(nA(lM(21, 1, 21, "#eef1f3"), Z, h + 123.5, 0), 0, X, h)), TA.push(g(nA(lM(12, 8, 12, "#b7c9d8"), Z, h + 128, 0), 3, X, h)), TA.push(g(nA(Ej(0.3, 0.6, 20, 5, "#dfe2e6"), Z, h + 142, 0), 0, X, h)), TA.push(g(nA(dj(0.8, 6, 4, "#ff4a3a", 2), Z, h + 152.4, 0), 0, X, h));
      TA.push(g(nA(lM(10, 6, 7, "#e9edf0"), 0, h + 84, 0), 2, X, h)), x(TA, p, f, z), s.push([p, f, 32]);
    }
    {
      const [p, f, h] = v(34, 705);
      U(p, f, z, 30, 30, 150, h), s.push([p, f, 24]);
    }
    {
      const [p, f, h] = v(19, 840), X = M(), TA = [];
      TA.push(g(nA(lM(30, 160, 24, "#a9c0d2"), 0, h + 79.4, 0), 3, X, h));
      const Z = zN(new DN(30, 26, 24), "#a9c0d2"), W = Z.attributes.position;
      for (let PA = 0; PA < W.count; PA++) W.getY(PA) > 0 && W.getX(PA) > 0 && W.setY(PA, W.getY(PA) - 22);
      Z.computeVertexNormals(), TA.push(g(nA(Z, 0, h + 172, 0), 3, X, h)), x(TA, p, f, z), s.push([p, f, 24]);
    }
    const S = (p, f, h) => s.some((X) => Math.hypot(X[0] - p, X[1] - f) < X[2] + h), [q, c] = PI(24, 760), G = 46;
    for (let p = -13; p <= 13; p++) for (let f = -8; f <= 8; f++) {
      const h = I.cx + w[0] * p * G + O[0] * f * G, X = I.cz + w[1] * p * G + O[1] * f * G;
      if (A.localF(h, X) > 0.78 || A.heightAt(h, X) < _M + 2.4) continue;
      const TA = Math.hypot(h - q, X - c), Z = Math.max(0, 1 - TA / 380), W = M() < 0.35 + Z * 0.3 ? [[0, 0, 1]] : M() < 0.6 ? [[-0.25, 0, 0.5], [0.25, 0, 0.5]] : [[-0.25, -0.25, 0.5], [0.25, -0.25, 0.5], [-0.25, 0.25, 0.5], [0.25, 0.25, 0.5]];
      for (const [PA, MA, wA] of W) {
        if (M() < 0.08) continue;
        const xA = PA * G + (M() - 0.5) * 3, YA = MA * G + (M() - 0.5) * 3, eA = h + w[0] * xA + O[0] * YA, TM = X + w[1] * xA + O[1] * YA, AM = (G - 10) * wA, KA = AM * (0.72 + M() * 0.28), BA = AM * (0.72 + M() * 0.28);
        if (S(eA, TM, Math.max(KA, BA) * 0.6)) continue;
        const fA = A.heightAt(eA, TM);
        if (fA < _M + 2.4) continue;
        let IM = 12 + M() * 22 + Z * Z * (50 + M() * 110) * (wA === 1 ? 1 : 0.7);
        if (f >= 5 && (IM = Math.min(IM, 26 + M() * 16)), IM > 60 && M() < 0.1) {
          k(eA, TM, Math.min(KA, BA) * 0.5, IM, fA, "#d9e3ec", "#eef1f3");
          continue;
        }
        U(eA, TM, z + (M() - 0.5) * 0.04, KA, BA, IM, fA);
      }
    }
    const r = uN(C), t = MD(new yj({ vertexColors: true, roughness: 0.82, metalness: 0 }), N, { city: true });
    this.city = new GM(r, t), this.city.name = "CitySkyline", this.city.frustumCulled = false, this.root.add(this.city);
  }
  _buildLife() {
    const A = this.U, M = y4(77), N = this.staticScenery.material;
    this.ferris = new GM(this._ferrisGeo, N), this.ferris.name = "FerrisWheel", this.ferris.position.set(this._ferrisPose.x, this._ferrisPose.y, this._ferrisPose.z), this.ferris.rotation.set(0, this._ferrisPose.yaw, 0, "YXZ"), this.ferris.frustumCulled = false, this.root.add(this.ferris);
    const I = [$g({ L: 7, B: 2.3, D: 0.7, F: 0.8, sheer: 0.3, hull: "#fbfaf6", stripe: "#6fa6cf", bottom: "#d0675c", deck: "#d8c7a4" })];
    I.push(nA(Ej(0.07, 0.09, 10, 6, "#e6e2da"), 0, 5.8, 0.4)), I.push(eN(0, 1.8, 0.4, 0, 1.7, -3.2, 0.1, "#e6e2da")), I.push(gT([0, 1.9, 0.3, 0, 10.4, 0.3, 0, 1.9, -3.1], "#fffdf7")), I.push(gT([0, 1.3, 3.4, 0, 9.8, 0.55, 0, 1.3, 0.6], "#fff4e8")), I.push(nA(lM(0.5, 0.3, 0.05, "#ff8f7a"), 0.2, 10.7, 0.4));
    const D = uN(I), T = MD(new yj({ vertexColors: true, roughness: 0.6, side: hj }), A, {}), w = [[192, 150, 1], [285, 240, -1], [74, 235, 1], [160, 335, -1], [334, 205, 1], [40, 310, -1], [120, 420, 1]];
    this.sailboats = w.map(([S, q, c]) => ({ a: S * DD, d: q, w: c * (0.9 + M() * 0.5) / q, phase: M() * 10, s: 0.9 + M() * 0.35 })), this.sailInst = new iI(D, T, this.sailboats.length), this.sailInst.name = "Sailboats", this.sailInst.frustumCulled = false, this.sailInst.instanceMatrix.setUsage(D4), this.root.add(this.sailInst);
    const O = [nA(Ej(0.42, 0.5, 1.3, 12, "#ffffff"), 0, 0.2, 0), nA(Ej(0.05, 0.42, 0.7, 12, "#ffffff"), 0, 1.2, 0), nA(zN(new jI(0.55, 0.12, 4, 10), "#3b3f47"), 0, -0.05, 0, 0, Math.PI / 2), nA(Ej(0.03, 0.03, 0.6, 4, "#4b525b"), 0.15, 1.6, 0), nA(Ej(0.03, 0.03, 0.6, 4, "#4b525b"), -0.15, 1.6, 0), nA(dj(0.12, 8, 6, "#fff6d8", 1), 0, 1.95, 0)], z = uN(O), C = MD(new yj({ vertexColors: true, roughness: 0.4 }), A, { waterline: true }), E = this.bounds, P = [], g = 0.625, Q = -0.781;
    for (let S = 0; S < 4; S++) {
      const q = 62 + S * 40 * g, c = -70 + S * 40 * Q;
      P.push({ x: q - Q * 14, z: c + g * 14, col: "#ef6b61", s: 1.1 }), P.push({ x: q + Q * 14, z: c - g * 14, col: "#4fb47e", s: 1.1 });
    }
    for (const [S, q, c] of [[E.maxX + 16, 12, "#ffd463"], [E.minX - 18, -6, "#ffd463"], [8, E.maxZ + 17, "#f7f5f0"], [-14, E.minZ - 16, "#f7f5f0"], [E.maxX + 26, -30, "#ef9d61"], [E.minX - 30, 40, "#ef9d61"]]) P.push({ x: S, z: q, col: c, s: 0.85 });
    this.buoys = P.map((S) => ({ ...S, phase: M() * 10 })), this.buoyInst = new iI(z, C, this.buoys.length), this.buoys.forEach((S, q) => this.buoyInst.setColorAt(q, new lA(S.col))), this.buoyInst.name = "Buoys", this.buoyInst.frustumCulled = false, this.buoyInst.instanceMatrix.setUsage(D4), this.root.add(this.buoyInst);
    for (const S of this.buoys) this._foamShapes.push({ ax: S.x, az: S.z, bx: S.x, bz: S.z, r: 0.55 * S.s });
    this._marina || this._buildFoamField(this._foamShapes);
    const x = [];
    x.push(nA(dj(0.5, 8, 6, "#fbfbf8"), 0, 0, 0, 0, 0, 0, 0.22, 0.2, 0.72)), x.push(nA(dj(0.14, 8, 6, "#fbfbf8"), 0, 0.08, 0.38)), x.push(nA(zN(new Zw(0.04, 0.16, 5), "#f2b340"), 0, 0.06, 0.55, 0, Math.PI / 2)), x.push(gT([0, 0, -0.35, 0, 0, -0.62, 0.14, 0, -0.55], "#e9ecef")), x.push(gT([0, 0, -0.35, 0, 0, -0.62, -0.14, 0, -0.55], "#e9ecef"));
    for (const S of [1, -1]) x.push(gT([0.05 * S, 0.02, 0.2, 0.62 * S, 0.02, 0.12, 0.05 * S, 0.02, -0.2, 0.62 * S, 0.02, 0.12, 0.62 * S, 0.02, -0.18, 0.05 * S, 0.02, -0.2], "#f4f5f6")), x.push(gT([0.62 * S, 0.02, 0.12, 1.15 * S, 0.02, -0.16, 0.62 * S, 0.02, -0.18], "#9aa3ad"));
    const U = uN(x), k = 11, s = new Float32Array(k);
    this.gulls = [];
    for (let S = 0; S < k; S++) {
      const q = S % 4, G = [[0, 0, 58, 26], [E.maxX + 35, -20, 28, 18], [E.minX - 40, 30, 34, 22], [70, 90, 45, 30]][q];
      this.gulls.push({ cx: G[0], cz: G[1], r: G[2] * (0.8 + M() * 0.4), h: G[3] + (M() - 0.5) * 6, w: (0.18 + M() * 0.12) * (M() < 0.5 ? 1 : -1), a0: M() * 6.28, s: 1.4 + M() * 0.4 }), s[S] = M();
    }
    U.setAttribute("aPhase", new cT(s, 1));
    const v = MD(new yj({ vertexColors: true, roughness: 0.7, side: hj }), A, { gull: true });
    this.gullInst = new iI(U, v, k), this.gullInst.name = "Gulls", this.gullInst.frustumCulled = false, this.gullInst.instanceMatrix.setUsage(D4), this.root.add(this.gullInst), this._animate(0);
  }
  waterHeightAt(A, M, N = this.time) {
    let I = 1e5;
    const D = this._marinaData;
    for (const O of D ? [D.decks, D.wet] : [this.footprint]) for (const z of O) {
      const C = Math.max(z.minX - A, A - z.maxX, 0), E = Math.max(z.minZ - M, M - z.maxZ, 0);
      C * C + E * E < I * I && (I = Math.min(I, xB(z, A, M)));
    }
    let T = 0.035 + (0.16 - 0.035) * gx(3, 70, I);
    if (D) {
      const O = this.bounds, z = Math.abs(A - (O.minX + O.maxX) / 2) - (O.maxX - O.minX) / 2, C = Math.abs(M - (O.minZ + O.maxZ) / 2) - (O.maxZ - O.minZ) / 2, E = Math.hypot(Math.max(z, 0), Math.max(C, 0)) + Math.min(Math.max(z, C), 0);
      T *= 0.45 + 0.55 * gx(60, 210, E);
    }
    const w = 0.45 * Math.sin(A * 0.11 + M * 0.047 + N * 0.95) + 0.35 * Math.sin(-A * 0.052 + M * 0.097 + N * 1.13 + 1.7) + 0.2 * Math.sin(A * 0.173 - M * 0.141 + N * 1.61 + 4.1);
    return _M + w * T;
  }
  deckEdges(A = 1.6) {
    const M = [];
    for (const N of this._runs || []) {
      const I = N.s1 - N.s0, D = Math.max(1, Math.floor(I / A)), T = (N.bx - N.ax) / N.len, w = (N.bz - N.az) / N.len;
      for (let O = 0; O < D; O++) {
        const z = N.s0 + I * (O + 0.5) / D;
        M.push({ x: N.ax + T * z + N.nx * 0.05, z: N.az + w * z + N.nz * 0.05, nx: N.nx, nz: N.nz });
      }
    }
    return M;
  }
  get seaState() {
    return this._marina ? 0.15 : 1;
  }
  getSkyColors() {
    const A = this.U;
    return { zenith: A.uZenith.value, sky: A.uSkyMid.value, horizon: A.uHorizon.value, ground: this.hemi.groundColor, sun: this.sun.color, sunColor: this.sun.color, sunIntensity: this.sun.intensity, sunDir: A.uSunDir.value, fog: this.fogColor, cloud: A.uCloudLit.value, night: A.uNight.value };
  }
  rebuildForArena(A, M) {
    this._marina = this._stageMarina(), this.bounds = { ...A }, this.footprint = (M && M.length ? M : [this.bounds]).map(mO), this._rebuildDock(), this._applyMarina(), this._fitShadow(), this._bakeFarReflection();
  }
  _rebuildDock() {
    for (const A of [this.pilings, this.dockProps, ...(this.moored || []).map((M) => M.mesh)]) A && (this.root.remove(A), A.geometry?.dispose());
    this._buildDock();
    for (const A of this.buoys || []) this._foamShapes.push({ ax: A.x, az: A.z, bx: A.x, bz: A.z, r: 0.55 * A.s });
    this._marina || this._buildFoamField(this._foamShapes);
  }
  setFootprint(A) {
    this.footprint = A.map(mO), this._syncDeckShading();
  }
  setTheme(A) {
    const M = Wg[A] || Wg.day, N = this.renderer;
    this.theme = Wg[A] ? A : "day";
    const I = this.U, D = M.sunEl * DD, T = M.sunAz * DD;
    I.uSunDir.value.set(Math.cos(D) * Math.cos(T), Math.sin(D), Math.cos(D) * Math.sin(T)).normalize(), I.uZenith.value.set(M.zenith), I.uSkyMid.value.set(M.skyMid), I.uHorizon.value.set(M.horizon), I.uGround.value.set(M.ground), I.uHorizonGlow.value.copy(LO(M.horizonGlow, M.horizonGlowK)), I.uGlowColor.value.set(M.glowColor), I.uGlowParams.value.set(...M.glow), I.uHaze.value.set(M.haze[0], M.haze[1], M.haze[2], 0), I.uNight.value = M.night, I.uSunDisk.value.copy(LO(M.sunDisk, M.sunDiskK)), I.uSunCos.value = Math.cos(M.sunRadius * DD), I.uCloudLit.value.copy(LO(M.cloudLit, M.cloudLitK)), I.uCloudShade.value.set(M.cloudShade), I.uCloudParams.value.set(...M.cloud), I.uSeaDeep.value.set(M.seaDeep), I.uSeaShallow.value.set(M.seaShallow), I.uSeaCrest.value.set(M.seaCrest), I.uFoamColor.value.set(M.foam), I.uSunLight.value.copy(LO(M.sunColor, (M.skySun ?? M.sunIntensity) / Math.PI)), I.uSeaAmbient.value.copy(I.uSkyMid.value).lerp(I.uHorizon.value, 0.5).multiplyScalar(M.seaAmbientK), I.uSunSpec.value = M.sunSpec, I.uWaveStrength.value = M.waveStrength, this.grade = M.grade;
    const w = !!M.shafts;
    "SKY_SHAFTS" in this.skyMat.defines !== w && (w ? this.skyMat.defines.SKY_SHAFTS = "" : delete this.skyMat.defines.SKY_SHAFTS, this.skyMat.needsUpdate = true);
    const O = this._stageMarina();
    O !== this._marina && (this._marina = O, this._rebuildDock());
    const z = { channel: null, shade: null, calm: 0.55, lap: 1, caustic: 1.5, wet: 0.5, ...M.marina || {} };
    z.channel ? I.uChannelCol.value.set(z.channel) : I.uChannelCol.value.set(M.seaDeep).multiplyScalar(0.65), z.shade ? I.uShadeCol.value.set(z.shade) : I.uShadeCol.value.set(M.seaDeep).multiplyScalar(0.12), I.uMarinaK.value.x = z.calm, I.uMarinaK.value.y = z.lap, I.uMarinaK.value.z = 0.35, I.uStripK.value.set(z.caustic, z.wet, 0, 0), this._applyMarina(), this.sun.color.set(M.sunColor), this.sun.intensity = M.sunIntensity, this.hemi.color.set(M.hemiSky), this.hemi.groundColor.set(M.hemiGround).multiplyScalar(M.hemiGroundK ?? 1), this.hemi.intensity = M.hemiIntensity, this.scene.environmentIntensity = M.envK ?? 0.66, this.fogColor.copy(I.uHorizon.value).lerp(I.uSkyMid.value, 0.15), this.scene.fog && this.scene.fog.isFog && (this.scene.fog.color.copy(this.fogColor), this.scene.fog.near = M.fog[0], this.scene.fog.far = M.fog[1]), this.lhBeam.visible = M.night > 0.01, this._fitShadow();
    const C = N.getClearColor(new lA()), E = N.getClearAlpha();
    this._bakeClouds(M), N.setClearColor(C, E), this._rebuildEnvMap(), this._bakeFarReflection();
  }
  update(A, M) {
    A = Math.min(A || 0, 0.1), this.time += A, this._frameId++, this.U.uTime.value = this.time, M && this.sky.position.copy(M.position), this._animate(A);
  }
  _animate() {
    const A = this.time;
    for (const M of this.moored) {
      const N = M.spec;
      M.mesh.position.y = this.waterHeightAt(N.x, N.z, A) + 0.03 * Math.sin(A * 1.3 + M.phase), M.mesh.rotation.z = M.roll * Math.sin(A * 0.9 + M.phase), M.mesh.rotation.x = 0.012 * Math.sin(A * 0.7 + M.phase * 2);
    }
    for (let M = 0; M < this.sailboats.length; M++) {
      const N = this.sailboats[M], I = N.a + N.w * A, D = Math.cos(I) * N.d, T = Math.sin(I) * N.d, w = Math.atan2(-Math.sin(I) * Math.sign(N.w), Math.cos(I) * Math.sign(N.w)), O = this.waterHeightAt(D, T, A);
      TD.set(0.03 * Math.sin(A * 0.8 + N.phase), w, (0.13 + 0.05 * Math.sin(A * 0.6 + N.phase)) * Math.sign(N.w), "YXZ"), MI.compose(ET.set(D, O, T), fD.setFromEuler(TD), PT.setScalar(N.s)), this.sailInst.setMatrixAt(M, MI);
    }
    this.sailInst.instanceMatrix.needsUpdate = true;
    for (let M = 0; M < this.buoys.length; M++) {
      const N = this.buoys[M], I = this.waterHeightAt(N.x, N.z, A) + 0.06 * Math.sin(A * 1.7 + N.phase);
      TD.set(0.09 * Math.sin(A * 1.1 + N.phase), N.phase, 0.09 * Math.cos(A * 0.93 + N.phase * 1.3), "YXZ"), MI.compose(ET.set(N.x, I, N.z), fD.setFromEuler(TD), PT.setScalar(N.s)), this.buoyInst.setMatrixAt(M, MI);
    }
    this.buoyInst.instanceMatrix.needsUpdate = true;
    for (let M = 0; M < this.gulls.length; M++) {
      const N = this.gulls[M], I = N.a0 + N.w * A, D = N.cx + Math.cos(I) * N.r, T = N.cz + Math.sin(I) * N.r, w = N.h + Math.sin(A * 0.4 + N.a0) * 1.5, O = Math.sign(N.w), z = Math.atan2(-Math.sin(I) * O, Math.cos(I) * O);
      TD.set(0, z, -0.35 * O, "YXZ"), MI.compose(ET.set(D, w, T), fD.setFromEuler(TD), PT.setScalar(N.s)), this.gullInst.setMatrixAt(M, MI);
    }
    this.gullInst.instanceMatrix.needsUpdate = true, this.ferris.rotation.z = A * 0.045, this.lhBeam.rotation.y = A * 0.55;
  }
  dispose() {
    this.scene.remove(this.root, this.sun, this.sun.target, this.hemi), this.root.traverse((A) => {
      A.geometry && A.geometry.dispose(), A.material && A.material.dispose();
    }), this._envRT && this._envRT.dispose(), this._cloudRT?.dispose(), this._cloudMat?.dispose(), this._reflRT?.dispose(), this._farRT?.dispose(), this._stripMat?.dispose(), this._underMat?.dispose(), this._pmrem.dispose(), this.U.uWaveTex.value?.dispose(), this.U.uFoamTex.value?.dispose(), this._fieldRT?.dispose(), this._fieldMat?.dispose(), this._fieldQuad?.geometry.dispose();
  }
}
const zD = Math.PI * 2, BU = `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`, sB = `
float dHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float dNoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(dHash(i), dHash(i+vec2(1.0,0.0)), u.x), mix(dHash(i+vec2(0.0,1.0)), dHash(i+vec2(1.0,1.0)), u.x), u.y); }
`;
function jD(j, A, M = 1) {
  const N = new lA(A).multiplyScalar(M), I = j.attributes.position.count, D = new Float32Array(I * 3);
  for (let T = 0; T < I; T++) D[T * 3] = N.r, D[T * 3 + 1] = N.g, D[T * 3 + 2] = N.b;
  return j.setAttribute("color", new dM(D, 3)), j.attributes.uv || j.setAttribute("uv", new dM(new Float32Array(I * 2), 2)), j;
}
const bN = (j, A, M, N, I = 0, D = 0, T = 0, w = 1) => j.applyMatrix4(new YM().compose(new DA(A, M, N), new mj().setFromEuler(new nj(I, D, T, "YXZ")), new DA(w, w, w))), wT = (j, A = 16) => new aC(j.map(([M, N]) => new jM(M, N)), A);
function A4(j, A, M = 6) {
  const N = new rC(j.map((I) => new DA(...I)));
  return new oz(N, Math.max(4, j.length * 4), A, M, false);
}
function kO(j) {
  const A = j.map((M) => {
    const N = M.index ? M.toNonIndexed() : M;
    for (const I of Object.keys(N.attributes)) ["position", "normal", "color", "uv"].includes(I) || N.deleteAttribute(I);
    return N;
  });
  return uN(A, false);
}
function zL(j = 256, A = true) {
  const M = document.createElement("canvas");
  M.width = M.height = j;
  const N = M.getContext("2d"), I = j / 2, D = j / 256;
  N.clearRect(0, 0, j, j), A && (N.fillStyle = "#fff", N.beginPath(), N.arc(I, I, 118 * D, 0, zD), N.fill(), N.globalCompositeOperation = "destination-out", N.beginPath(), N.arc(I, I, 104 * D, 0, zD), N.fill(), N.globalCompositeOperation = "source-over"), N.fillStyle = "#fff", N.beginPath();
  const T = 78 * D, w = I + 6 * D;
  N.moveTo(I, w - T * 1), N.bezierCurveTo(I + 0.35 * T, w - 0.7 * T, I + 0.45 * T, w - 0.45 * T, I + 0.75 * T, w - 0.25 * T), N.bezierCurveTo(I + 0.55 * T, w - 0.1 * T, I + 0.5 * T, w, I + 0.48 * T, w + 0.2 * T), N.bezierCurveTo(I + 0.46 * T, w + 0.45 * T, I + 0.3 * T, w + 0.5 * T, I + 0.32 * T, w + 0.8 * T), N.lineTo(I + 0.16 * T, w + 0.62 * T), N.lineTo(I + 0.08 * T, w + 0.85 * T), N.lineTo(I, w + 0.62 * T), N.lineTo(I - 0.08 * T, w + 0.85 * T), N.lineTo(I - 0.16 * T, w + 0.62 * T), N.lineTo(I - 0.32 * T, w + 0.8 * T), N.bezierCurveTo(I - 0.3 * T, w + 0.5 * T, I - 0.46 * T, w + 0.45 * T, I - 0.48 * T, w + 0.2 * T), N.bezierCurveTo(I - 0.5 * T, w, I - 0.55 * T, w - 0.1 * T, I - 0.75 * T, w - 0.25 * T), N.bezierCurveTo(I - 0.45 * T, w - 0.45 * T, I - 0.35 * T, w - 0.7 * T, I, w - T), N.fill(), N.globalCompositeOperation = "destination-out";
  for (const O of [-1, 1]) N.beginPath(), N.ellipse(I + O * 0.2 * T, w + 0.05 * T, 0.13 * T, 0.17 * T, 0, 0, zD), N.fill();
  N.globalCompositeOperation = "source-over";
  for (const O of [-1, 1]) N.beginPath(), N.arc(I + O * 0.2 * T + 0.03 * T, w + 0.09 * T, 0.07 * T, 0, zD), N.fill();
  return M;
}
const oB = `
${sB}
uniform vec3 uColor;
uniform float uTime;
uniform float uPulse;
uniform float uPulseT;
uniform sampler2D uEmblem;
varying vec2 vUv;
varying vec3 vW;
void main(){
  vec2 q = vUv * 2.0 - 1.0; float r = length(q); float a = atan(q.y, q.x + 1e-5);
  if (r > 1.0) discard;
  vec3 V = normalize(cameraPosition - vW);
  // glossy dark base with a soft sky reflection band and a moving sun glint
  vec3 base = mix(vec3(0.035, 0.04, 0.055), vec3(0.075, 0.085, 0.11), smoothstep(1.0, 0.0, r));
  float fres = pow(max(1.0 - clamp(V.y, 0.0, 1.0), 0.0), 3.0);
  base += vec3(0.16, 0.2, 0.26) * fres;
  // pooled ink in the centre: slow liquid swirl, wet highlight
  float n = dNoise(q * 3.2 + vec2(uTime * 0.25, -uTime * 0.18)) * 0.6 + dNoise(q * 7.0 - uTime * 0.3) * 0.4;
  float pool = smoothstep(0.58, 0.5, r + (n - 0.5) * 0.06);
  vec3 ink = uColor * (0.42 + 0.3 * n) + vec3(0.9) * pow(n, 7.0) * 1.4;
  base = mix(base, ink, pool);
  // emblem (white squid) in the pool
  vec2 eu = q / 0.46 * 0.5 + 0.5;
  float em = (eu.x > 0.0 && eu.x < 1.0 && eu.y > 0.0 && eu.y < 1.0) ? texture2D(uEmblem, eu).a : 0.0;
  base = mix(base, vec3(1.0) * (0.9 + 0.2 * uPulse), em * pool);
  // rings: bright outer rim, inner rim, dashed rotating track, radial ticks, chevrons pointing out
  float glow = 0.0;
  glow += smoothstep(0.022, 0.0, abs(r - 0.955)) * 1.3;
  glow += smoothstep(0.014, 0.0, abs(r - 0.6)) * 0.95;
  float dash = step(0.5, fract(a / 6.2831853 * 36.0 + uTime * 0.25));
  glow += smoothstep(0.018, 0.0, abs(r - 0.79)) * dash * 0.8;
  float tick = step(0.8, fract(a / 6.2831853 * 72.0)) * smoothstep(0.035, 0.0, abs(r - 0.88));
  glow += tick * 0.45;
  float sa = mod(a - uTime * 0.35, 6.2831853 / 6.0) - 3.14159265 / 6.0;
  vec2 pc = vec2(r - 0.7, sa * 0.7);
  float chev = smoothstep(0.02, 0.0, abs(pc.x - abs(pc.y) * 0.9)) * step(abs(pc.y), 0.07) * step(-0.06, pc.x);
  glow += chev * 0.9;
  // breathing idle + spawn pulse wave
  glow *= 0.85 + 0.15 * sin(uTime * 2.2);
  float wave = uPulse * smoothstep(0.09, 0.0, abs(r - uPulseT * 1.35)) * (1.0 - smoothstep(0.7, 1.35, uPulseT * 1.35));
  vec3 col = base + uColor * glow * 2.6 + (uColor * 2.2 + vec3(1.2)) * wave * 2.2;
  col += uColor * pool * uPulse * 0.8;
  // metal lip just inside the rim
  col = mix(col, vec3(0.5, 0.52, 0.56) * (0.6 + 0.6 * fres), smoothstep(0.975, 0.99, r));
  gl_FragColor = vec4(col, 1.0);
  ${BU}
}`, uB = `
uniform vec3 uColor; uniform float uTime; uniform float uAlpha; uniform float uPulse;
varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){
  float h = vUv.y;
  // hex lattice on the cylinder
  vec2 p = vec2(vUv.x * 64.0, h * 9.0);
  p.x += step(1.0, mod(floor(p.y), 2.0)) * 0.5;
  vec2 f = fract(p) - 0.5;
  float hexEdge = smoothstep(0.43, 0.49, max(abs(f.x) * 1.15 + abs(f.y) * 0.6, abs(f.y) * 1.2));
  float scan = smoothstep(0.08, 0.0, abs(fract(h * 1.4 - uTime * 0.45) - 0.5) - 0.44);
  float fade = pow(max(1.0 - h, 0.0), 1.6);
  float base = smoothstep(0.0, 0.06, h);
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(max(1.0 - abs(dot(normalize(vN), V)), 0.0), 2.0);
  float a = (uAlpha + uPulse * 0.5) * fade * base * (0.25 + 0.75 * hexEdge + scan * 0.6) * (0.55 + 0.45 * rim);
  a += smoothstep(0.035, 0.0, h) * (0.5 + uAlpha);
  gl_FragColor = vec4(uColor * (1.5 + uPulse), a);
  ${BU}
}`, wL = `
varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }`, FO = 1.7, M4 = 1.06, rU = `uniform float uTime;
`, aU = `
  vec3 fip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float fph = fip.x * 0.71 + fip.z * 0.43;
  float fk = clamp(position.x / ${FO.toFixed(2)}, 0.0, 1.0);
  float fa = position.x * 3.1 - uTime * 5.2 + fph;
  float fb = position.x * 5.7 + position.y * 3.9 - uTime * 7.9 + fph * 1.7;
  float fwav = (sin(fa) * 0.16 + sin(fb) * 0.045) * fk;
  float dwdx = (cos(fa) * 3.1 * 0.16 + cos(fb) * 5.7 * 0.045) * fk + (sin(fa) * 0.16 + sin(fb) * 0.045) / ${FO.toFixed(2)};
  float dwdy = cos(fb) * 3.9 * 0.045 * fk;
`;
function vB(j, A) {
  const M = new yj({ map: j, roughness: 0.78, metalness: 0, side: hj });
  return M.onBeforeCompile = (N) => {
    N.uniforms.uTime = A, N.vertexShader = rU + N.vertexShader.replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>
        ${aU}
        objectNormal = normalize(vec3(-dwdx, -dwdy, 1.0));`).replace("#include <begin_vertex>", `#include <begin_vertex>
        transformed.z += fwav;
        transformed.y -= fk * fk * 0.06 + fk * 0.03 * (0.5 + 0.5 * sin(uTime * 2.3 + fph));
        transformed.x -= fk * abs(fwav) * 0.12;`), N.fragmentShader = N.fragmentShader.replace("#include <map_fragment>", "").replace("#include <color_fragment>", `
        vec4 fTx = texture2D(map, vMapUv);
        #if defined( USE_COLOR )
          diffuseColor.rgb *= vColor.rgb;
        #endif
        // hoist sleeve + fly-end hem stripes and the white emblem
        float sleeve = smoothstep(0.075, 0.065, vMapUv.x);
        float hem = smoothstep(0.955, 0.965, vMapUv.x);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93), max(fTx.a, sleeve));
        diffuseColor.rgb *= 1.0 - hem * 0.35;`);
  }, M;
}
function SB(j) {
  const A = new eC({ depthPacking: rE, side: hj });
  return A.onBeforeCompile = (M) => {
    M.uniforms.uTime = j, M.vertexShader = rU + M.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      ${aU}
      transformed.z += fwav;`);
  }, A;
}
function BB(j) {
  const A = new yj({ vertexColors: true, roughness: 0.62, metalness: 0, side: hj });
  return A.onBeforeCompile = (M) => {
    M.uniforms.uTime = j, M.vertexShader = `uniform float uTime;
attribute float sway;
` + M.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      float sph = position.x * 0.37 + position.z * 0.29;
      transformed.x += sin(uTime * 1.6 + sph) * 0.07 * sway;
      transformed.z += cos(uTime * 1.25 + sph * 1.3) * 0.06 * sway;
      transformed.y += sin(uTime * 2.1 + sph * 2.0) * 0.045 * sway * sway;`);
  }, A;
}
class rB {
  constructor(A, M) {
    this.scene = A, this.level = M, this.group = new oj(), this.group.name = "decor", A.add(this.group), this.pads = [], this.flags = [], this.barriers = [], this.time = 0, this.uTime = { value: 0 }, this.emblem = new mw(zL(256, true)), this.emblem.colorSpace = Tj, this.emblem.anisotropy = 4, this._buildPads(), this._buildLamps(), this._buildPalms(), this._buildFlags();
  }
  _buildPads() {
    const A = this.level, M = [];
    M.push(jD(wT([[1.93, 0.072], [1.97, 0.074], [2.01, 0.1], [2.1, 0.104], [2.17, 0.078], [2.2, 0.04], [2.22, 0]], 72), 2830138)), M.push(jD(bN(new jI(2.055, 0.016, 6, 96), 0, 0.104, 0, Math.PI / 2), 10134445));
    for (let D = 0; D < 24; D++) {
      const T = D / 24 * zD;
      M.push(jD(bN(new KN(0.022, 0.026, 0.02, 8), Math.cos(T) * 2.12, 0.1, Math.sin(T) * 2.12), 12107976));
    }
    for (let D = 0; D < 8; D++) {
      const T = D / 8 * zD + 0.2;
      M.push(jD(bN(new DN(0.26, 0.014, 0.03), Math.cos(T) * 2.135, 0.093, Math.sin(T) * 2.135, 0, -T - Math.PI / 2), 1316379));
    }
    const N = kO(M), I = new yj({ vertexColors: true, roughness: 0.32, metalness: 0.55 });
    this._padBase = { geo: N, mat: I };
    for (let D = 0; D < 2; D++) {
      const T = A.spawnPads[D], w = new oj();
      w.position.copy(T);
      const O = new GM(N, I);
      O.receiveShadow = true, O.name = "spawnPad:base", w.add(O);
      const z = new PN({ uniforms: { uColor: { value: new lA() }, uTime: { value: 0 }, uPulse: { value: 0 }, uPulseT: { value: 1 }, uEmblem: { value: this.emblem } }, vertexShader: wL, fragmentShader: oB }), C = new GM(new aT(1.95, 96).rotateX(-Math.PI / 2), z);
      C.position.y = 0.076, C.name = "spawnPad:face", w.add(C);
      const E = new PN({ transparent: true, depthWrite: false, side: hj, blending: II, uniforms: { uColor: { value: new lA() }, uTime: { value: 0 }, uAlpha: { value: 0.12 }, uPulse: { value: 0 } }, vertexShader: wL, fragmentShader: uB }), P = new GM(new KN(A.spawnBarrier, A.spawnBarrier, 2.6, 96, 1, true), E);
      P.position.y = 1.3, P.name = "spawnPad:barrier", w.add(P), this.group.add(w), this.pads.push({ g: w, padMat: z, barMat: E, team: D, pulse: 0, pulseT: 1 });
    }
  }
  pulse(A, M = 1) {
    const N = this.pads[A];
    N && (N.pulse = Math.min(1.5, Math.max(N.pulse, M)), N.pulseT = 0);
  }
  _buildLamps() {
    const A = this.level.layout, M = [...A.decor.lamps, ...A.decor.lamps.map(([C, E]) => [-C, -E])], N = [], I = [], D = 3094855, T = 14267482, w = 15854816;
    for (const [C, E] of M) {
      const P = Math.max(0, this.level.groundHeight(C, E)), g = C > 0 ? -1 : 1, Q = (s, v, S) => {
        s.translate(C, P, E), N.push(jD(s, v, S));
      };
      Q(wT([[0, 0], [0.27, 0], [0.28, 0.04], [0.24, 0.1], [0.24, 0.16], [0.2, 0.2], [0.19, 0.42], [0.21, 0.46], [0.15, 0.52], [0.12, 0.62], [0.1, 0.7], [0, 0.7]], 20), D), Q(wT([[0.1, 0.7], [0.085, 0.9], [0.075, 3.6], [0.068, 5.05], [0, 5.05]], 14), D);
      for (const s of [0.9, 2.6, 4.55]) Q(bN(new jI(0.088, 0.018, 6, 20), 0, s, 0, Math.PI / 2), T);
      Q(A4([[0, 4.9, 0], [0.18 * g, 5.18, 0], [0.55 * g, 5.22, 0], [0.9 * g, 5.08, 0]], 0.032, 7), D), Q(A4([[0.02 * g, 4.45, 0], [0.22 * g, 4.62, 0], [0.4 * g, 4.95, 0], [0.5 * g, 5.18, 0]], 0.016, 5), D), Q(bN(new yN(0.06, 10, 8), 0, 5.12, 0), T);
      const x = 0.92 * g;
      Q(bN(wT([[0, 0.3], [0.08, 0.29], [0.26, 0.12], [0.3, 0.08], [0.29, 0.06], [0.1, 0.06], [0, 0.06]], 20), x, 4.92, 0), D), Q(bN(new yN(0.05, 10, 8), x, 5.26, 0), T), Q(bN(wT([[0, -0.26], [0.07, -0.25], [0.13, -0.2], [0.15, -0.16], [0, -0.16]], 16), x, 4.92, 0), D);
      for (let s = 0; s < 4; s++) {
        const v = s / 4 * zD + 0.4;
        Q(bN(new KN(0.011, 0.011, 0.26, 5), x + Math.cos(v) * 0.16, 4.89, Math.sin(v) * 0.16), D);
      }
      const U = wT([[1e-3, -0.18], [0.1, -0.16], [0.17, -0.05], [0.18, 0.02], [0.13, 0.07], [1e-3, 0.08]], 18);
      U.translate(C + x, P + 4.93, E), I.push(jD(U, w));
      const k = new yN(0.075, 12, 8);
      k.translate(C + x, P + 4.9, E), I.push(jD(k, 16773583, 1));
    }
    if (!M.length) return;
    const O = new GM(kO(N), new yj({ vertexColors: true, roughness: 0.42, metalness: 0.55 }));
    O.castShadow = true, O.receiveShadow = true, O.name = "lamps:body", this.bulbMat = new yj({ vertexColors: true, roughness: 0.18, metalness: 0, emissive: 16767392, emissiveIntensity: 0.9, transparent: true, opacity: 0.92 });
    const z = new GM(kO(I), this.bulbMat);
    z.name = "lamps:glass", this.group.add(O, z);
  }
  _buildPalms() {
    const A = this.level.layout, M = [...A.decor.palms, ...A.decor.palms.map(([C, E]) => [-C, -E])];
    if (!M.length) return;
    const N = [], I = [];
    let D = 7;
    const T = () => (D = D * 16807 % 2147483647, (D - 1) / 2147483646);
    for (const [C, E] of M) {
      const P = Math.max(0, this.level.groundHeight(C, E)), g = T() * zD, Q = Math.cos(g), x = Math.sin(g), U = 4.7 + T() * 0.5, k = 1 + T() * 0.4, s = new bx(new DA(0, 0, 0), new DA(Q * k * 0.1, U * 0.4, x * k * 0.1), new DA(Q * k * 0.55, U * 0.75, x * k * 0.55), new DA(Q * k, U, x * k)), v = 44, S = 12, q = new oz(s, v, 1, S, false), c = q.attributes.position, G = q.attributes.normal, r = new Float32Array(c.count * 3), t = new lA(10122832), p = new lA(8215613), f = new lA();
      for (let KA = 0; KA < c.count; KA++) {
        const BA = Math.floor(KA / (S + 1)), fA = BA / v, IM = s.getPoint(fA), GA = BA % 3 === 0 ? 1.12 : 1, bA = (0.2 - 0.075 * fA + (fA < 0.06 ? (0.06 - fA) * 2.2 : 0)) * GA;
        c.setXYZ(KA, IM.x + G.getX(KA) * bA, IM.y + G.getY(KA) * bA, IM.z + G.getZ(KA) * bA), f.copy(BA % 3 === 0 ? p : t).multiplyScalar(0.85 + 0.25 * fA), r[KA * 3] = f.r, r[KA * 3 + 1] = f.g, r[KA * 3 + 2] = f.b;
      }
      q.setAttribute("color", new dM(r, 3)), q.computeVertexNormals(), q.translate(C, P, E), N.push(q);
      const h = s.getPoint(1).add(new DA(C, P, E));
      N.push(jD(bN(new yN(0.2, 12, 8), h.x, h.y + 0.02, h.z), 7295542));
      for (let KA = 0; KA < 4; KA++) {
        const BA = KA / 4 * zD + T();
        N.push(jD(bN(new yN(0.11, 10, 8), h.x + Math.cos(BA) * 0.15, h.y - 0.14, h.z + Math.sin(BA) * 0.15), 5982764));
      }
      const X = 12, TA = [], Z = [], W = [], PA = [], MA = (KA, BA, fA, IM, GA) => (TA.push(KA, BA, fA), Z.push(IM.r, IM.g, IM.b), W.push(GA), TA.length / 3 - 1), wA = new lA(3501877), xA = new lA(8832350), YA = new lA(10461258), eA = new lA(), TM = new lA();
      for (let KA = 0; KA < X; KA++) {
        const BA = KA % 3 === 2, fA = KA / X * zD + T() * 0.35, IM = (BA ? 2 : 2.3) + T() * 0.5, GA = BA ? 0.05 : KA % 2 ? 0.55 : 0.35, bA = Math.cos(fA), sM = Math.sin(fA), WM = -sM, cA = bA, MM = 18, qA = [];
        for (let zM = 0; zM <= MM; zM++) {
          const dA = zM / MM;
          qA.push([h.x + bA * IM * dA, h.y + 0.05 + GA * dA - (BA ? 1.7 : 1.35) * dA * dA, h.z + sM * IM * dA, dA]);
        }
        let UA = -1, VA = -1;
        for (const [zM, dA, QM, mM] of qA) {
          eA.copy(wA).lerp(xA, mM * 0.5);
          const aM = 0.03 * (1 - mM * 0.7), QA = MA(zM + WM * aM, dA + 0.01, QM + cA * aM, eA, mM), IA = MA(zM - WM * aM, dA + 0.01, QM - cA * aM, eA, mM);
          UA >= 0 && PA.push(UA, QA, IA, UA, IA, VA), UA = QA, VA = IA;
        }
        for (let zM = 2; zM < MM; zM++) {
          const [dA, QM, mM, aM] = qA[zM], [QA, IA, HA] = qA[zM + 1], FA = QA - dA, DM = IA - QM, RA = HA - mM, EM = Math.hypot(FA, DM, RA) || 1, OM = (0.28 + 0.62 * Math.pow(Math.sin(Math.PI * Math.min(1, aM * 1.08)), 0.7)) * (0.9 + T() * 0.2);
          eA.copy(BA ? YA : wA).lerp(xA, 0.25 + aM * 0.35), TM.copy(xA).lerp(BA ? YA : xA, 0.3).multiplyScalar(0.95 + T() * 0.12);
          for (const rM of [-1, 1]) {
            const HM = WM * rM, PM = cA * rM, uM = (0.45 + aM * 0.35) * OM, RM = dA + HM * OM * 0.82 + FA / EM * OM * 0.35, hM = QM - uM, UM = mM + PM * OM * 0.82 + RA / EM * OM * 0.35, KM = MA(dA - FA / EM * 0.035, QM, mM - RA / EM * 0.035, eA, aM), vA = MA(dA + FA / EM * 0.035, QM, mM + RA / EM * 0.035, eA, aM), i = MA(dA * 0.45 + RM * 0.55, QM * 0.45 + hM * 0.55 + 0.04, mM * 0.45 + UM * 0.55, eA, Math.min(1, aM + 0.05)), $ = MA(RM, hM, UM, TM, Math.min(1, aM + 0.15));
            PA.push(KM, vA, i, KM, i, $, vA, $, i);
          }
        }
      }
      const AM = new FM();
      AM.setAttribute("position", new xM(TA, 3)), AM.setAttribute("color", new xM(Z, 3)), AM.setAttribute("sway", new xM(W, 1)), AM.setIndex(PA), AM.computeVertexNormals(), I.push(AM);
    }
    const w = new GM(kO(N), new yj({ vertexColors: true, roughness: 0.88, metalness: 0 }));
    w.castShadow = true, w.receiveShadow = true, w.name = "palms:trunk";
    const O = uN(I, false), z = new GM(O, BB(this.uTime));
    z.castShadow = true, z.receiveShadow = true, z.name = "palms:fronds", this.group.add(w, z);
  }
  _buildFlags() {
    const A = this.level.layout, M = [...A.decor.flags.map((Q) => ({ p: Q, team: 0 })), ...A.decor.flags.map(([Q, x, U]) => ({ p: [-Q, x, -U], team: 1 }))];
    if (!M.length) return;
    const N = [], I = 14934232, D = 14267482, T = 3817288;
    for (const { p: Q } of M) {
      const [x, U, k] = Q, s = (v, S) => {
        v.translate(x, U, k), N.push(jD(v, S));
      };
      s(wT([[0, 0], [0.2, 0], [0.21, 0.03], [0.17, 0.07], [0.07, 0.1], [0, 0.1]], 16), T), s(wT([[0.065, 0.1], [0.058, 0.4], [0.045, 4.35], [0, 4.36]], 12), I), s(bN(new yN(0.085, 14, 10), 0, 4.43, 0), D), s(bN(new KN(0.03, 0.05, 0.08, 10), 0, 4.34, 0), D), s(bN(new DN(0.04, 0.16, 0.05), -0.07, 1.2, 0), T), s(bN(new KN(0.012, 0.012, 0.18, 6), -0.1, 1.2, 0, 0, 0, Math.PI / 2), T), s(A4([[-0.07, 4.3, 0.01], [-0.075, 2.8, 0.03], [-0.1, 1.28, 0.02]], 7e-3, 4), 15788760), s(A4([[0.04, 4.3, 0], [-0.03, 4.3, 0.02], [-0.07, 4.26, 0.01]], 7e-3, 4), 15788760);
    }
    const w = new GM(kO(N), new yj({ vertexColors: true, roughness: 0.38, metalness: 0.55 }));
    w.castShadow = true, w.receiveShadow = true, w.name = "flags:poles", this.group.add(w);
    const O = new KI(FO, M4, 26, 14);
    O.translate(FO / 2 + 0.05, -M4 / 2, 0);
    const z = O.attributes.uv, C = O.attributes.position;
    for (let Q = 0; Q < z.count; Q++) {
      const x = (C.getX(Q) - 0.05) / FO, U = (C.getY(Q) + M4) / M4;
      z.setXY(Q, x, U);
    }
    this.flagTex = new mw((() => {
      const Q = document.createElement("canvas");
      Q.width = 512, Q.height = 320;
      const x = Q.getContext("2d");
      x.clearRect(0, 0, 512, 320), x.drawImage(zL(256, true), 136, 40, 240, 240), x.strokeStyle = "#fff", x.lineWidth = 7, x.lineCap = "round";
      for (const U of [276, 298]) {
        x.beginPath();
        for (let k = 0; k <= 24; k++) {
          const s = 120 + k / 24 * 272;
          x.lineTo(s, U + Math.sin(k * 0.9) * 6);
        }
        x.stroke();
      }
      return Q;
    })()), this.flagTex.colorSpace = Tj, this.flagTex.anisotropy = 4;
    const E = vB(this.flagTex, this.uTime), P = new iI(O, E, M.length), g = new YM();
    M.forEach(({ p: Q }, x) => {
      g.makeTranslation(Q[0], Q[1] + 4.28, Q[2]), P.setMatrixAt(x, g), P.setColorAt(x, new lA(1, 1, 1));
    }), P.customDepthMaterial = SB(this.uTime), P.castShadow = true, P.receiveShadow = true, P.frustumCulled = false, P.name = "flags:cloth", this.group.add(P), this.flagMesh = P, this.flags = M.map(({ team: Q }, x) => ({ team: Q, index: x }));
  }
  setNight(A = 0) {
    this.bulbMat && (this.bulbMat.emissiveIntensity = 0.22 + 0.68 * Math.min(1, Math.max(0, A)));
  }
  setTeamColors(A) {
    for (const M of this.pads) M.padMat.uniforms.uColor.value.copy(A[M.team]), M.barMat.uniforms.uColor.value.copy(A[M.team]);
    if (this.flagMesh) {
      for (const M of this.flags) this.flagMesh.setColorAt(M.index, A[M.team]);
      this.flagMesh.instanceColor.needsUpdate = true;
    }
  }
  update(A) {
    this.time += A, this.uTime.value = this.time;
    for (const M of this.pads) {
      M.pulseT = Math.min(3, M.pulseT + A), M.pulse = Math.max(0, M.pulse - A * 0.9);
      const N = M.padMat.uniforms, I = M.barMat.uniforms;
      N.uTime.value = this.time, N.uPulse.value = M.pulse, N.uPulseT.value = M.pulseT, I.uTime.value = this.time, I.uPulse.value = M.pulse;
      let D = 0;
      for (const T of nN.actors) {
        if (T.team === M.team || !T.alive) continue;
        const w = Math.hypot(T.pos.x - M.g.position.x, T.pos.z - M.g.position.z);
        D = Math.max(D, 1 - Math.min(1, Math.max(0, (w - this.level.spawnBarrier) / 4)));
      }
      I.uAlpha.value = 0.12 + D * 0.55;
    }
  }
}
const aB = "8b3b5d82", pB = 2048, eB = 8, uy = { hash: aB, size: pB, ppm: eB };
async function HB(j, A, { quality: M = "standard" } = {}) {
  const N = new oj();
  N.name = "Tidewater Plaza", j.add(N);
  const I = new rQ(N, { quality: M === "low" ? "low" : "high" }), D = [];
  for (const wA of E7("tidewater")) wA.onlyIn !== "zones" && D.push(...I.add(wA.type, wA).colliders);
  I.build(), I.setNight(0);
  const T = AP.tidewater.LAYOUT, w = { ...T, single: T.single.filter((wA) => wA.onlyIn !== "zones"), half: T.half.filter((wA) => wA.onlyIn !== "zones") }, O = new rS(w, D);
  nN.level = O, nN.renderer = A, nN.scene = j, nN.settings = { quality: M === "low" ? "low" : "medium" };
  const [z, C] = await Promise.all([Y7(A, { size: 256 }), s7("tidewater")]), E = new DI(new Uint8Array([0, 0, 0, 0]), 1, 1);
  E.needsUpdate = true, O.layoutLightmap(uy.ppm, uy.size);
  let P = null;
  if (O.layoutHash === uy.hash) P = await new Sz().loadAsync(new URL("../assets/imported-package/asset-9.png", import.meta.url).href), P.colorSpace = xN, P.anisotropy = 4;
  else {
    O.lightSize = 0;
    for (const wA of O.faces) wA.light = null;
  }
  const g = d7(E, 1, C, { texlib: z, lightmap: P }), Q = new GM(O.buildGeometry(1), g);
  Q.name = "Tidewater architecture", Q.castShadow = true, Q.receiveShadow = true, N.add(Q);
  const x = new rB(N, O);
  for (const wA of x.pads) wA.g.visible = false;
  for (const wA of j.children) wA.isLight && (wA.visible = false);
  const U = O.blocks.filter((wA) => wA.axes[1].y > 0.9999 && wA.aabbMax.y < 0.01 && wA.aabbMax.y > -2.5 && wA.aabbMin.y < -1).map((wA) => ({ minX: wA.aabbMin.x, maxX: wA.aabbMax.x, minZ: wA.aabbMin.z, maxZ: wA.aabbMax.z, cx: wA.center.x, cz: wA.center.z, hx: wA.half.x, hz: wA.half.z, ax: wA.axes[0].x, az: wA.axes[0].z })), k = new cB(A, j, { bounds: O.bounds, footprint: U, theme: "day", shadowSize: 2048 });
  nN.env = k;
  const s = CS(O), v = [], S = [], q = O.blocks.filter((wA) => !wA.hidden && wA.roof && wA.half.y > 1).map((wA) => ({ x: wA.center.x, z: wA.center.z, w: wA.aabbMax.x - wA.aabbMin.x, d: wA.aabbMax.z - wA.aabbMin.z, h: wA.half.y * 2, dead: false }));
  function c(wA, xA, YA = 0.45) {
    return v.some((eA) => !eA.dead && Math.abs(eA.x - wA) < eA.w / 2 + YA && Math.abs(eA.z - xA) < eA.d / 2 + YA);
  }
  const G = (wA, xA, YA = 0.45) => s.free(wA, xA, YA) && !c(wA, xA, YA);
  function r(wA, xA, YA = 0.7) {
    const eA = s.nearest(wA, xA, YA);
    if (G(eA.x, eA.z, YA)) return eA;
    for (let TM = 1; TM < 15; TM++) for (let AM = 0; AM < 16; AM++) {
      const KA = AM * Math.PI / 8, BA = s.nearest(wA + Math.cos(KA) * TM, xA + Math.sin(KA) * TM, YA);
      if (G(BA.x, BA.z, YA)) return BA;
    }
    throw Error("没有可用出生位置");
  }
  function t() {
    if (v.length) return v;
    for (const [wA, xA, YA, eA] of [["shield", -10, -23, 16764705], ["fire", 12, -8, 16742972], ["reinforce", -12, 23, 12938495]]) {
      const { x: TM, z: AM } = r(xA, YA, 2), KA = new oj();
      KA.position.set(TM, s.heightAt(TM, AM), AM), j.add(KA);
      for (const [IM, GA, bA, sM] of [[2.4, 0.4, 2.4, 0.2], [1.2, 2.7, 1.2, 1.7], [1.7, 0.3, 1.7, 3.2], [0.15, 1.5, 0.15, 4]]) {
        const WM = GC(KA, IM, GA, bA, eA, 0, sM, 0);
        WM.material = WM.material.clone(), WM.material.emissive.set(eA), WM.material.emissiveIntensity = 0.7;
      }
      const BA = new xD(eA, 3, 10);
      BA.position.y = 3, KA.add(BA);
      const fA = { g: KA, x: TM, z: AM, w: 2.4, d: 2.4, h: 4.8, type: "tower", weaken: wA, hp: 180, maxHp: 180, dead: false };
      v.push(fA), S.push(fA);
    }
    return v;
  }
  function p(wA, xA, YA, eA, TM, AM) {
    let KA = 0;
    for (const BA of v) BA.dead || Math.hypot(Math.max(0, Math.abs(wA - BA.x) - BA.w / 2), Math.max(0, Math.abs(xA - BA.z) - BA.d / 2)) > YA || (BA.hp -= eA, TM?.(BA.x, AM ?? s.heightAt(BA.x, BA.z) + 1, BA.z, 16764705, 8), BA.hp <= 0 && (BA.dead = true, BA.g.visible = false, KA++));
    return KA;
  }
  const f = r(-8, -27, 1.2), h = r(9, 24, 3.5), X = [[-12, -32], [12, -26], [-12, 26], [12, 32]].map(([wA, xA]) => {
    const YA = r(wA, xA, 1.5);
    return [YA.x, YA.z];
  }), TA = document.createElement("canvas");
  TA.width = 112, TA.height = 188;
  const Z = TA.getContext("2d");
  Z.fillStyle = "#416e86", Z.fillRect(0, 0, TA.width, TA.height);
  for (let wA = 0; wA < s.connected.length; wA++) if (s.connected[wA]) {
    const xA = s.point(wA);
    Z.fillStyle = s.heights[wA] > 0.5 ? "#ddd1b9" : "#ba9988", Z.fillRect((xA.x + 28) * 2, (47 - xA.z) * 2, 1.1, 1.1);
  }
  function W(wA, xA, YA) {
    wA.drawImage(TA, xA(-28), YA(47), xA(28) - xA(-28), YA(-47) - YA(47));
  }
  function PA(wA) {
    k.sun.castShadow = wA !== "low", nN.settings.quality = wA === "low" ? "low" : "medium";
  }
  PA(M);
  let MA = 0;
  return { root: N, buildings: q, obstacles: [], destructibles: S, towers: v, spawn: f, bossSpawn: h, entries: X, spawnWeakenSites: t, breakAt: p, bossCanTarget: (wA, xA) => Math.hypot(xA.x - wA.x, xA.z - wA.z) <= 28, heightAt: s.heightAt, free: G, nearest: r, solid: (wA, xA, YA) => !G(wA, xA, YA), canMove: (wA, xA, YA, eA = 0.4) => s.canMove(wA, xA, YA, eA) && !c(xA, YA, eA), clear: (wA, xA, YA = 0.1) => s.clear(wA, xA, YA) && !v.some((eA) => !eA.dead && fB(wA, xA, eA, YA)), waypoint: s.waypoint, drawMap: W, setQuality: PA, cameraBlocked: (wA, xA, YA, eA) => s.bodyBlocked(wA, xA - eA, YA, eA, eA * 2), menuCamera: { from: w.art.from, look: w.art.look }, update(wA, xA) {
    MA += wA, I.update(wA, MA), x.update(wA), k.update(wA, xA);
  }, diagnostics: { bakedAO: !!P, nodes: s.nodeCount, props: I.stats(), blocks: O.blocks.length } };
}
function fB(j, A, M, N) {
  const I = Math.max(1, Math.ceil(Math.hypot(A.x - j.x, A.z - j.z) / 0.4));
  for (let D = 0; D <= I; D++) {
    const T = j.x + (A.x - j.x) * D / I, w = j.z + (A.z - j.z) * D / I;
    if (Math.abs(T - M.x) < M.w / 2 + N && Math.abs(w - M.z) < M.d / 2 + N) return true;
  }
  return false;
}

export {HB as loadTidewater};
