import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const colors = { player: 0xe2b7ff, ally: 0xdbb2ed, human: 0xffffff, guard: 0xabc9ea };
const accents = { player: 0xbf78ff, ally: 0xb46afa, human: 0xbca77c, guard: 0x76b9ee };

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
  // SkeletonUtils gives every actor independent bones; geometry stays shared.
  const root = clone(asset.scene);
  const model = new THREE.Group();
  const height = kind === 'player' ? 2.25 : kind === 'guard' ? 2.15 : 2.05 + variant * 0.035;
  const scale = height / asset.height;
  const center = asset.bounds.getCenter(new THREE.Vector3());
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
    // Animated limbs can leave the original mesh bounds.
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
  const marker = new THREE.Mesh(new THREE.RingGeometry(kind === 'player' ? .62 : .38, kind === 'player' ? .73 : .44, 24), markerMaterial);
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
  // Fit authored three-second clips to responsive ability timings.
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
  // Skip off-range models and throttle distant skeleton updates.
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
