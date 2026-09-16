import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

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
  // 使用字面量 URL，确保 Vite 在生产构建时能发现并发布每个角色资源。
  player: new URL('./assets/characters/player.glb', import.meta.url).href,
  ally: new URL('./assets/characters/awakened.glb', import.meta.url).href,
  guard: new URL('./assets/characters/guard.glb', import.meta.url).href,
  humanMale: new URL('./assets/characters/worker-man.glb', import.meta.url).href,
  humanFemale: new URL('./assets/characters/worker-woman.glb', import.meta.url).href,
};

export async function loadCharacterAssets() {
  const entries = await Promise.all(Object.entries(CHARACTER_MODEL_FILES).map(async ([key, file]) => {
    const gltf = await new GLTFLoader().loadAsync(file);
    return [key, prepareCharacterAsset(gltf)];
  }));
  return Object.fromEntries(entries);
}

// 单个资产（旧写法）直接透传；资产集按主人公、觉醒者、警卫和打工人选择专属模型。
function selectCharacterAsset(assets, kind) {
  if (assets.scene) return assets;
  if (kind === 'player' && assets.player) return assets.player;
  if (kind === 'ally' && assets.ally) return assets.ally;
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
  const visual = { holder, root, model, meshes, materials, marker, mixer, actions, kind, current: null, attackTime: 0, accumulated: 0, poolKey: visualPoolKey(kind) };
  setCharacterKind(visual, kind, variant);
  switchAnimation(visual, 'idle', .0);
  mixer.update(variant * .27);
  return visual;
}

export function setCharacterKind(visual, kind) {
  visual.kind = kind;
  // 保留专属模型的美术原材质；阵营辨识由脚下标记和场景 Galaxy / Bloodlust 光环承担。
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

export function playCharacterAttack(visual, type, duration = .65) {
  const name = type === 'shoot' ? 'toyRecoil' : type === 'break' ? 'heavyPunch' : type === 'rush' ? 'jump' : 'flurry';
  const action = visual.actions[name];
  if (!action) return;
  // 原动画约三秒，战斗中太拖沓；近战前摇可把时长拉到挥击命中点。
  const span = Math.max(.35, duration);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.setEffectiveTimeScale(action.getClip().duration / span);
  visual.attackTime = span;
  if (visual.current === action) action.reset().play();
  else switchAnimation(visual, name, .07);
}

export function updateCharacterVisual(visual, moving, dt, distance = 0, sprinting = false) {
  if (visual.attackTime > 0) visual.attackTime -= dt;
  if (visual.attackTime <= 0) {
    const name = moving ? (visual.kind === 'human' ? 'zombie' : 'walk') : visual.holdingGun ? 'toyAim' : 'idle';
    const action = visual.actions[name];
    const scale = !moving ? 1 : visual.kind === 'human' ? .38 : visual.kind === 'ally' ? 1.35 : (sprinting ? 1.45 : 1.0);
    if (action) action.setEffectiveTimeScale(scale);
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

const POOL_CAP=24;
const visualPools={human:[],guard:[],ally:[]};
export function visualPoolKey(kind){return kind==='human'||kind==='ally'?kind:'guard';}
function parkPooledVisual(visual){
 visual.holder.visible=false;
 visual.holder.position.set(0,-120,0);
 visual.holder.rotation.set(0,0,0);
 visual.holdingGun=false;
 visual.attackTime=0;
 visual.accumulated=0;
 visual.mixer.stopAllAction();
 visual.current=null;
}
function disposeCharacterVisual(visual){
 visual.mixer.stopAllAction();
 visual.holder.removeFromParent();
 for(const mesh of visual.meshes){
  const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(const mat of mats)mat?.dispose?.();
 }
 visual.marker.geometry.dispose();
 visual.marker.material.dispose();
}
export function acquireCharacterVisual(assets,kind,variant=0){
 const key=visualPoolKey(kind);
 const pooled=visualPools[key].pop();
 if(pooled){
  setCharacterKind(pooled,kind);
  pooled.holder.visible=true;
  pooled.holder.rotation.set(0,0,0);
  switchAnimation(pooled,'idle',0);
  pooled.mixer.update(variant*.05);
  return pooled;
 }
 return createCharacterVisual(assets,kind,variant);
}
export function releaseCharacterVisual(visual){
 if(!visual)return false;
 // 按建模时的模型类型归还，不能按当前阵营：转化后的警卫仍是警卫模型。
 const key=visual.poolKey||visualPoolKey(visual.kind);
 parkPooledVisual(visual);
 if(visualPools[key].length>=POOL_CAP){disposeCharacterVisual(visual);return false;}
 visualPools[key].push(visual);
 return true;
}
export function warmCharacterPool(assets,kind,count=6){
 const key=visualPoolKey(kind);
 while(visualPools[key].length<count){
  const visual=createCharacterVisual(assets,kind,0);
  visual.poolKey=key;
  parkPooledVisual(visual);
  visualPools[key].push(visual);
 }
 return visualPools[key].length;
}
export function clearCharacterPool(){
 for(const pool of Object.values(visualPools)){
  while(pool.length)disposeCharacterVisual(pool.pop());
 }
}
export function characterPoolSize(kind){return visualPools[visualPoolKey(kind)]?.length||0;}
