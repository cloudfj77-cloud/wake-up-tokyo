import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const colors = { player: 0xe2b7ff, ally: 0xdbb2ed, human: 0xffffff, guard: 0xabc9ea };
const accents = { player: 0xbf78ff, ally: 0xb46afa, human: 0xbca77c, guard: 0x76b9ee };

// 城市和车辆在载入时统一缩小到原尺寸的 55%，人物也必须做同样换算。
// 例如现实中 1.82 米的主角，在游戏画面里应约为 1 个单位，才能和汽车比例一致。
const CITY_MODEL_SCALE = 0.55;
export const CHARACTER_HEIGHTS = {
  player: 1.7 * CITY_MODEL_SCALE,
  guard: 1.75 * CITY_MODEL_SCALE,
  humanBase: 1.58 * CITY_MODEL_SCALE,
  humanVariantStep: 0.025 * CITY_MODEL_SCALE,
};

export function characterHeight(kind, variant = 0) {
  if (kind === 'player') return CHARACTER_HEIGHTS.player;
  if (kind === 'guard') return CHARACTER_HEIGHTS.guard;
  return CHARACTER_HEIGHTS.humanBase + variant * CHARACTER_HEIGHTS.humanVariantStep;
}

export function prepareCharacterAsset(gltf) {
  gltf.scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(gltf.scene);
  const height = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(height) || height <= 0) throw new Error('人物模型尺寸无效');
  return { scene: gltf.scene, clips: gltf.animations, bounds, height };
}

export async function loadCharacterAsset() {
  const gltf = await new GLTFLoader().loadAsync(new URL('./assets/character.glb', import.meta.url).href);
  return prepareCharacterAsset(gltf);
}

// 分型角色模型：主人公 / 秩序警卫 / 打工人（男女各半，感染前后共用同一模型）。
const CHARACTER_MODEL_FILES = {
  player: './assets/characters/player.glb',
  guard: './assets/characters/guard.glb',
  humanMale: './assets/characters/worker-man.glb',
  humanFemale: './assets/characters/worker-woman.glb',
};

export async function loadCharacterAssets() {
  const entries = await Promise.all(Object.entries(CHARACTER_MODEL_FILES).map(async ([key, file]) => {
    const gltf = await new GLTFLoader().loadAsync(new URL(file, import.meta.url).href);
    return [key, prepareCharacterAsset(gltf)];
  }));
  return Object.fromEntries(entries);
}

// 单个资产（旧写法）直接透传；资产集按角色类型选模型。
// 市民与觉醒者共用西装打工人模型（男女各半），感染前后只有动作和特效不同。
function selectCharacterAsset(assets, kind) {
  if (assets.scene) return assets;
  if (kind === 'player' && assets.player) return assets.player;
  if (kind === 'guard' && assets.guard) return assets.guard;
  if (assets.humanMale && assets.humanFemale) return Math.random() < .5 ? assets.humanMale : assets.humanFemale;
  if (assets.ally) return assets.ally;
  return assets.player ?? Object.values(assets)[0];
}

export function createCharacterVisual(assets, kind, variant = 0) {
  const asset = selectCharacterAsset(assets, kind);
  // 每个人共用模型网格，但必须拥有独立骨骼，否则一个人抬手会带着全城一起动。
  const root = clone(asset.scene);
  const model = new THREE.Group();
  const height = characterHeight(kind, variant);
  const scale = height / asset.height;
  const center = asset.bounds.getCenter(new THREE.Vector3());
  // 三个方向必须使用同一个倍率，否则人物会被压扁或拉长。
  model.scale.setScalar(scale);
  root.position.set(-center.x, -asset.bounds.min.y, -center.z);
  model.add(root);
  const holder = new THREE.Group();
  holder.add(model);
  const materials = new Map();
  const meshes = [];
  root.traverse(node => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    // 动画中的手脚会超出模型原始边界，关闭自动裁剪可避免动作时身体突然消失。
    node.frustumCulled = false;
    // 沿用模型自带外观：顶点色与贴图原样保留，不做程序化染色。
    const copyMaterial = source => {
      if (!materials.has(node)) materials.set(node, source.clone());
      return materials.get(node);
    };
    node.material = Array.isArray(node.material) ? node.material.map(copyMaterial) : copyMaterial(node.material);
    meshes.push(node);
  });
  const markerMaterial = new THREE.MeshBasicMaterial({ color: accents[kind], side: THREE.DoubleSide });
  const marker = new THREE.Mesh(new THREE.RingGeometry(kind === 'player' ? .27 : .18, kind === 'player' ? .34 : .23, 24), markerMaterial);
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = .055;
  holder.add(marker);
  const mixer = new THREE.AnimationMixer(root);
  const actions = Object.fromEntries(asset.clips.map(clip => [clip.name, mixer.clipAction(clip)]));
  const visual = { holder, root, model, meshes, materials, marker, mixer, actions, kind, current: null, attackTime: 0, accumulated: 0 };
  setCharacterKind(visual, kind, variant);
  switchAnimation(visual, 'idle', .0);
  mixer.update(variant * .27);
  return visual;
}

export function setCharacterKind(visual, kind) {
  visual.kind = kind;
  // 阵营只用脚下光环区分，模型外观沿用美术自带的贴图与顶点色。
  visual.marker.material.color.setHex(accents[kind]);
  visual.marker.visible = kind !== 'human';
}

function switchAnimation(visual, name, fade = .18) {
  const next = visual.actions[name] || visual.actions.idle;
  if (!next || visual.current === next) return;
  visual.current?.fadeOut(fade);
  next.reset().setEffectiveWeight(1).fadeIn(fade).play();
  visual.current = next;
}

export function playCharacterAttack(visual, type) {
  const name = type === 'shoot' ? 'toyRecoil' : type === 'break' ? 'heavyPunch' : type === 'rush' ? 'jump' : 'flurry';
  const action = visual.actions[name];
  if (!action) return;
  // 原动画约三秒，战斗中太拖沓，因此压缩到 0.65 秒以保证操作响应。
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.setEffectiveTimeScale(action.getClip().duration / .65);
  visual.attackTime = .65;
  if (visual.current === action) action.reset().play();
  else switchAnimation(visual, name, .07);
}

export function updateCharacterVisual(visual, moving, dt, distance = 0, sprinting = false) {
  if (visual.attackTime > 0) visual.attackTime -= dt;
  if (visual.attackTime <= 0) {
    // 感染前是麻木蹒跚的丧尸步，感染后是亢奋癫狂的蹦跳。
    const rabid = visual.kind === 'ally';
    const name = moving
      ? (rabid ? 'jump' : visual.kind === 'human' ? 'zombie' : 'walk')
      : (visual.holdingGun ? 'toyAim' : rabid ? 'jump' : 'idle');
    const action = visual.actions[name];
    if (action) action.setEffectiveTimeScale(rabid ? (moving ? (sprinting ? 2.8 : 2.2) : 1.4) : moving ? (sprinting ? 1.9 : 1.3) : 1);
    switchAnimation(visual, name);
  }
  // 远处人物降低骨骼刷新频率，玩家看不出区别，但能明显减轻渲染压力。
  visual.holder.visible = distance < 58;
  const shadows = distance < 18;
  for (const mesh of visual.meshes) mesh.castShadow = shadows;
  visual.accumulated += dt;
  if (distance < 16 || visual.accumulated >= (distance < 45 ? 1 / 20 : 1 / 10)) {
    visual.mixer.update(visual.accumulated);
    visual.accumulated = 0;
  }
}

export const PROFESSIONS=['厨师','医生','建筑工人','配送员','教师'];
