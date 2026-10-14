import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { loadTextureSet, stripRootMotion } from './mixamo.js';

// 持盾特警（type 3）与持棍巡警（type 1）的专属模型：AIGC 出的 FBX，浏览器直接解析，不需要离线转换。
// 资源放在 public/police/ 下，两个模型共用同一套 PBR 贴图。
const BASE = `${import.meta.env?.BASE_URL ?? '/'}police/`;
const SHIELD_FILE = 'shield/Police_Animated_v5.fbx';
const BATON_FILE = 'baton/Police_Baton_Anatomy.fbx';

const TEXTURES = {
  map: 'tex/Color.jpg',
  normalMap: 'tex/Normal.png',
  roughnessMap: 'tex/tripo_model_roughness.JPEG',
  metalnessMap: 'tex/tripo_model_metallic.JPEG',
};

// FBX 里的动作名 → 游戏里的逻辑动作名。逻辑名要和 characters.js 的状态机对得上：
// idle 站立 / walk 移动 / heavyPunch、flurry 近战攻击 / diveRoll、roll 冲撞。
// 同一个动作可以同时顶多个逻辑名（比如盾击既是重击也是连招），省得没有对应动作时角色僵住。
const SHIELD_CLIPS = [
  ['01_Shield_Idle', 'idle'],
  // 举盾前进当作移动：盾警本来就是举着盾推进的。
  ['03_Shield_Advance_Large', 'walk'],
  ['04_Shield_Bash', 'heavyPunch'],
  ['04_Shield_Bash', 'flurry'],
  // 冲撞：这段自带约 3.5 米根位移，必须剥掉，否则会和代码控制的冲锋距离叠加。
  ['06_Shield_Dash', 'diveRoll'],
  ['06_Shield_Dash', 'roll'],
];

const BATON_CLIPS = [
  ['01_Baton_Idle', 'idle'],
  ['02_Baton_Walk', 'walk'],
  ['02_Baton_Walk', 'zombie'],
  // 高举重劈就是它的近战攻击。
  ['04_Baton_Heavy_Overhead', 'heavyPunch'],
  ['04_Baton_Heavy_Overhead', 'flurry'],
];

// 只给「没有贴图」的网格补整套 PBR：盾警的面罩是透明件，自带材质不能被覆盖成不透明。
function applyCopTextures(model, maps) {
  let applied = 0;
  model.traverse(node => {
    if (!node.isMesh) return;
    if (!node.geometry?.attributes.normal) node.geometry?.computeVertexNormals();
    const mat = node.material;
    const mats = Array.isArray(mat) ? mat : [mat];
    if (mats.some(m => m && (m.map || m.transparent))) return;
    node.material = new THREE.MeshStandardMaterial({
      ...maps,
      // 这两个是贴图的乘数，必须给满 1，否则贴图会被乘成 0 而看不出效果。
      roughness: 1,
      metalness: 1,
      normalScale: new THREE.Vector2(1, 1),
    });
    applied++;
  });
  return applied;
}

function renameClip(clip, name) {
  const copy = clip.clone();
  copy.name = name;
  return stripRootMotion(copy);
}

// 返回与 GLTF 资产同构的 { scene, animations }，交给 prepareCharacterAsset 统一处理缩放与边界。
async function loadCop(file, mapping, label) {
  const loader = new FBXLoader();
  const model = await loader.loadAsync(BASE + file);
  const maps = await loadTextureSet(TEXTURES, BASE);
  const meshCount = applyCopTextures(model, maps);
  const byName = new Map(model.animations.map(clip => [clip.name, clip]));
  const animations = [];
  for (const [clipName, logicName] of mapping) {
    const source = byName.get(clipName);
    if (!source) { console.warn(`[police] ${label} 缺少动作：${clipName}`); continue; }
    animations.push(renameClip(source, logicName));
  }
  if (!animations.length) throw new Error(`${label}资源里没有可用动画`);
  console.log(`[police] ${label}已载入 · 补贴图网格 ${meshCount} · 动作 ${animations.map(clip => clip.name).join(', ')}`);
  return { scene: model, animations };
}

export function loadShieldCopAsset() {
  return loadCop(SHIELD_FILE, SHIELD_CLIPS, '持盾特警');
}

export function loadBatonCopAsset() {
  return loadCop(BATON_FILE, BATON_CLIPS, '持棍巡警');
}
