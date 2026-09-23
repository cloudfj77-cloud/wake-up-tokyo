import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { loadTextureSet } from './mixamo.js';

// 独立预览页：直接读 public/mixamo/ 下的 FBX 与整套 PBR 贴图，改一个滑块就能看到差别。
const BASE = `${import.meta.env?.BASE_URL ?? '/'}mixamo/`;
const TARGET_HEIGHT = 1.8;
const $ = id => document.getElementById(id);

const ui = {
  model: $('model'), clip: $('clip'), play: $('play'), reset: $('reset'),
  speed: $('speed'), speedVal: $('speedVal'), time: $('time'),
  useMap: $('useMap'), useNormal: $('useNormal'), useRough: $('useRough'), useMetal: $('useMetal'),
  rough: $('rough'), roughVal: $('roughVal'), metal: $('metal'), metalVal: $('metalVal'),
  normalScale: $('normalScale'), normalScaleVal: $('normalScaleVal'), flipNormalY: $('flipNormalY'),
  flipTextureY: $('flipTextureY'), recomputeNormals: $('recomputeNormals'),
  wireframe: $('wireframe'), skeleton: $('skeleton'), autoRotate: $('autoRotate'),
  exposure: $('exposure'), exposureVal: $('exposureVal'),
  stats: $('stats'), hint: $('hint'),
};

const canvas = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141519);

const camera = new THREE.PerspectiveCamera(35, 1, .01, 200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .08;
controls.minDistance = .4;
controls.maxDistance = 20;
controls.autoRotateSpeed = 1.1;

// 没有环境贴图时纯靠方向光会把人物照成黑块，所以主光 + 侧逆光 + 补光 + 环境光一起上。
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a2b30, 1.1));
scene.add(new THREE.AmbientLight(0xffffff, .3));
const keyLight = new THREE.DirectionalLight(0xfff3e2, 2.6);
keyLight.position.set(2.4, 3.4, 2.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = .1;
keyLight.shadow.camera.far = 12;
keyLight.shadow.camera.left = -2;
keyLight.shadow.camera.right = 2;
keyLight.shadow.camera.top = 3;
keyLight.shadow.camera.bottom = -1;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x93b6ff, 1.2);
rimLight.position.set(-2.6, 2.2, -2.4);
scene.add(rimLight);
const fillLight = new THREE.DirectionalLight(0xffffff, .55);
fillLight.position.set(0, 1.4, 3.2);
scene.add(fillLight);

const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 64), new THREE.ShadowMaterial({ opacity: .3 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
scene.add(new THREE.GridHelper(6, 24, 0x2e3240, 0x22252f));

// 全模型共用一份材质，滑块改动一次就能看到整只角色的变化。
const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 1 });
const loader = new FBXLoader();
const state = {
  holder: null, model: null, mixer: null, action: null,
  clips: new Map(), clipFiles: {}, maps: {}, skeletonHelper: null, originalNormals: new Map(),
  playing: true, speed: 1, duration: 1, stats: '',
};

function disposeModel() {
  if (state.holder) {
    scene.remove(state.holder);
    state.holder.traverse(node => { if (node.isMesh) node.geometry.dispose(); });
  }
  if (state.skeletonHelper) scene.remove(state.skeletonHelper);
  state.holder = null;
  state.model = null;
  state.mixer = null;
  state.action = null;
  state.skeletonHelper = null;
}

function setModel(object, label) {
  disposeModel();
  // Mixamo 的 FBX 没有法线，必须重算否则发黑；3ds Max 导出的自带法线含硬边，重算会抹平，所以默认保留。
  let firstMesh = null;
  object.traverse(node => { if (node.isMesh && !firstMesh) firstMesh = node; });
  ui.recomputeNormals.checked = !firstMesh?.geometry.attributes.normal;
  state.originalNormals.clear();
  let vertices = 0, triangles = 0, meshes = 0;
  object.traverse(node => {
    if (!node.isMesh) return;
    meshes++;
    const normal = node.geometry.attributes.normal;
    if (normal) state.originalNormals.set(node.geometry, normal.array.slice());
    if (ui.recomputeNormals.checked || !normal) node.geometry.computeVertexNormals();
    node.material = material;
    node.castShadow = true;
    node.receiveShadow = true;
    node.frustumCulled = false;
    const position = node.geometry.attributes.position;
    vertices += position ? position.count : 0;
    triangles += node.geometry.index ? node.geometry.index.count / 3 : (position ? position.count / 3 : 0);
  });
  object.updateMatrixWorld(true);

  // 统一归一化：缩放到 1.8 米高，把脚底对齐地面并水平居中，换模型时镜头不用重调。
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = TARGET_HEIGHT / (size.y || 1);
  object.position.set(-center.x, -bounds.min.y, -center.z);
  const holder = new THREE.Group();
  holder.add(object);
  holder.scale.setScalar(scale);
  scene.add(holder);

  const bones = new Set();
  object.traverse(node => { if (node.isSkinnedMesh) node.skeleton.bones.forEach(bone => bones.add(bone.name)); });
  state.skeletonHelper = new THREE.SkeletonHelper(object);
  state.skeletonHelper.visible = ui.skeleton.checked;
  scene.add(state.skeletonHelper);

  state.holder = holder;
  state.model = object;
  state.mixer = new THREE.AnimationMixer(object);
  state.stats = `模型   ${label}\n网格   ${meshes} 个 / ${vertices.toLocaleString()} 顶点\n三角面 ${Math.round(triangles).toLocaleString()}\n骨骼   ${bones.size} 根`;

  // 相机按模型体积取景，避免大模型出画、小模型只剩一个点。
  const radius = Math.max(size.x, size.y, size.z) * scale * .5;
  const distance = (radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.5;
  controls.target.set(0, TARGET_HEIGHT * .55, 0);
  camera.position.set(distance * .5, TARGET_HEIGHT * .7, distance);
  controls.update();

  for (const clip of object.animations) if (!state.clips.has(clip.name)) state.clips.set(clip.name, clip);
  return object.animations[0]?.name ?? null;
}

function refreshClipOptions() {
  const previous = ui.clip.value;
  ui.clip.innerHTML = '';
  for (const name of state.clips.keys()) {
    const option = document.createElement('option');
    option.value = option.textContent = name;
    ui.clip.append(option);
  }
  for (const name of Object.keys(state.clipFiles)) {
    if (state.clips.has(name)) continue;
    const option = document.createElement('option');
    option.value = option.textContent = name;
    ui.clip.append(option);
  }
  if ([...ui.clip.options].some(option => option.value === previous)) ui.clip.value = previous;
}

function playClip(name) {
  const clip = state.clips.get(name);
  if (!clip || !state.mixer) return;
  const action = state.mixer.clipAction(clip);
  state.action?.fadeOut(.15);
  action.reset().setEffectiveWeight(1).fadeIn(.15).play();
  state.action = action;
  state.duration = Math.max(clip.duration || 1, .001);
  ui.time.max = state.duration;
  ui.time.value = 0;
}

// 动作文件按需下载，选中才加载；Mixamo 同一角色的骨骼名一致，可以跨文件直接播。
async function selectClip(name) {
  const file = state.clipFiles[name];
  if (file && !state.clips.has(name)) {
    const object = await loader.loadAsync(BASE + file);
    const clip = object.animations[0];
    if (clip) {
      clip.name = name;
      state.clips.set(name, clip);
    }
  }
  playClip(name);
}

function syncMaterial() {
  material.map = ui.useMap.checked ? state.maps.map ?? null : null;
  material.normalMap = ui.useNormal.checked ? state.maps.normalMap ?? null : null;
  const strength = parseFloat(ui.normalScale.value);
  // 法线凹凸方向反了时，改这一个开关即可，不用重新导出贴图。
  material.normalScale.set(strength, strength * (ui.flipNormalY.checked ? -1 : 1));
  material.roughnessMap = ui.useRough.checked ? state.maps.roughnessMap ?? null : null;
  material.roughness = parseFloat(ui.rough.value);
  material.metalnessMap = ui.useMetal.checked ? state.maps.metalnessMap ?? null : null;
  material.metalness = parseFloat(ui.metal.value);
  material.wireframe = ui.wireframe.checked;
  material.needsUpdate = true;
  ui.roughVal.textContent = parseFloat(ui.rough.value).toFixed(2);
  ui.metalVal.textContent = parseFloat(ui.metal.value).toFixed(2);
  ui.normalScaleVal.textContent = strength.toFixed(2);
}

// FBX 的 UV 原点约定和 three 相反，哪个方向对由这一个开关切换，UV 数据本身完全不动。
function applyTextureFlip() {
  for (const texture of Object.values(state.maps)) {
    texture.flipY = ui.flipTextureY.checked;
    texture.needsUpdate = true;
  }
}

// 模型自带的法线先留了一份底，关掉重算就能原样恢复，避免重算破坏硬边后回不去。
function applyNormalMode() {
  if (!state.model) return;
  state.model.traverse(node => {
    if (!node.isMesh) return;
    const geometry = node.geometry;
    if (ui.recomputeNormals.checked) {
      geometry.computeVertexNormals();
      return;
    }
    const original = state.originalNormals.get(geometry);
    if (original) geometry.setAttribute('normal', new THREE.BufferAttribute(original.slice(), 3));
  });
}

function updateStats(fps = 0) {
  const slots = [['map', '基础色'], ['normalMap', '法线'], ['roughnessMap', '粗糙度'], ['metalnessMap', '金属度']];
  const textures = slots
    .filter(([slot]) => state.maps[slot])
    .map(([slot, label]) => {
      const image = state.maps[slot].image;
      return `${label}   ${image ? `${image.width}×${image.height}` : '载入中'}`;
    });
  ui.stats.textContent = [state.stats, ...textures, fps ? `\nFPS     ${fps}` : ''].join('\n');
}

async function loadFBX(file) {
  return loader.loadAsync(BASE + file);
}

async function bootstrap() {
  let manifest = {};
  try {
    const response = await fetch(`${BASE}manifest.json`, { cache: 'no-cache' });
    if (response.ok) manifest = await response.json();
  } catch (error) {
    console.warn('[viewer] 读取 manifest.json 失败：', error.message);
  }

  const models = [...new Set([manifest.model, ...Object.values(manifest.clips || {})].filter(Boolean))];
  ui.model.innerHTML = '';
  for (const file of models) {
    const option = document.createElement('option');
    option.value = option.textContent = file;
    ui.model.append(option);
  }

  state.clipFiles = manifest.clips || {};

  // 贴图与模型并行下载，谁先回来都不影响另一边。
  const texturePromise = manifest.textures
    ? loadTextureSet(manifest.textures, BASE).then(maps => {
        state.maps = maps;
        applyTextureFlip();
        syncMaterial();
        updateStats();
      })
    : Promise.resolve();

  const object = await loadFBX(models[0] ?? 'player.fbx');
  const firstClip = setModel(object, models[0] ?? 'player.fbx');
  refreshClipOptions();
  await texturePromise;
  if (firstClip) playClip(firstClip);
  else await selectClip(Object.keys(state.clipFiles)[0] ?? '');
  ui.stats.textContent = state.stats;
  updateStats();
}

async function useModel(file) {
  const object = await loadFBX(file);
  const firstClip = setModel(object, file);
  refreshClipOptions();
  playClip(firstClip ?? ui.clip.value);
}

ui.model.addEventListener('change', () => useModel(ui.model.value));
ui.clip.addEventListener('change', () => selectClip(ui.clip.value));
ui.play.addEventListener('click', () => {
  state.playing = !state.playing;
  ui.play.textContent = state.playing ? '暂停' : '播放';
});
ui.reset.addEventListener('click', () => {
  camera.position.set(1.5, 1.3, 3.2);
  controls.target.set(0, TARGET_HEIGHT * .55, 0);
  controls.update();
});
ui.speed.addEventListener('input', () => {
  state.speed = parseFloat(ui.speed.value);
  ui.speedVal.textContent = `${state.speed.toFixed(2)}×`;
});
ui.time.addEventListener('input', () => {
  if (!state.mixer) return;
  state.playing = false;
  ui.play.textContent = '播放';
  // 拖动时间轴即定点检视某一帧，方便逐帧核对动作与贴图。
  state.mixer.setTime(parseFloat(ui.time.value));
});
ui.skeleton.addEventListener('change', () => { if (state.skeletonHelper) state.skeletonHelper.visible = ui.skeleton.checked; });
ui.flipTextureY.addEventListener('change', applyTextureFlip);
ui.recomputeNormals.addEventListener('change', applyNormalMode);
ui.autoRotate.addEventListener('change', () => { controls.autoRotate = ui.autoRotate.checked; });
ui.exposure.addEventListener('input', () => {
  renderer.toneMappingExposure = parseFloat(ui.exposure.value);
  ui.exposureVal.textContent = renderer.toneMappingExposure.toFixed(2);
});
for (const element of [ui.useMap, ui.useNormal, ui.useRough, ui.useMetal, ui.rough, ui.metal, ui.normalScale, ui.flipNormalY, ui.wireframe]) {
  element.addEventListener('input', syncMaterial);
}

// 直接把本地的 fbx / 贴图拖进来预览，不用改 manifest 也能看效果。
function guessSlot(name) {
  const lower = name.toLowerCase();
  if (lower.includes('normal')) return 'normalMap';
  if (lower.includes('rough')) return 'roughnessMap';
  if (lower.includes('metal')) return 'metalnessMap';
  return 'map';
}

async function handleFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.fbx')) {
    const buffer = await file.arrayBuffer();
    const object = loader.parse(buffer, '');
    const firstClip = setModel(object, file.name);
    refreshClipOptions();
    if (firstClip) playClip(firstClip);
    return;
  }
  if (!/\.(png|jpe?g|webp)$/.test(name)) return;
  const texture = await new THREE.TextureLoader().loadAsync(URL.createObjectURL(file));
  texture.flipY = ui.flipTextureY.checked;
  texture.colorSpace = guessSlot(name) === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 4;
  state.maps[guessSlot(name)] = texture;
  syncMaterial();
  updateStats();
}

window.addEventListener('dragover', event => {
  event.preventDefault();
  ui.hint.classList.add('on');
});
window.addEventListener('dragleave', () => ui.hint.classList.remove('on'));
window.addEventListener('drop', async event => {
  event.preventDefault();
  ui.hint.classList.remove('on');
  for (const file of event.dataTransfer.files) {
    try {
      await handleFile(file);
    } catch (error) {
      console.error('[viewer] 载入失败：', file.name, error);
      ui.stats.textContent = `${file.name} 载入失败：${error.message}`;
    }
  }
});

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

let last = performance.now();
let fpsAccumulator = 0;
let frames = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, .1);
  last = now;
  if (state.mixer && state.playing) state.mixer.update(dt * state.speed);
  if (state.action && state.playing) ui.time.value = state.action.time % state.duration;
  controls.update();
  renderer.render(scene, camera);
  frames++;
  fpsAccumulator += dt;
  if (fpsAccumulator >= .5) {
    updateStats(Math.round(frames / fpsAccumulator));
    frames = 0;
    fpsAccumulator = 0;
  }
  requestAnimationFrame(tick);
}

// 调试钩子：方便在控制台直接检查模型、材质与贴图。
window.__viewer = { scene, camera, renderer, material, state };

resize();
controls.autoRotate = ui.autoRotate.checked;
bootstrap().catch(error => {
  console.error(error);
  ui.stats.textContent = `载入失败：${error.message}`;
});
requestAnimationFrame(tick);
