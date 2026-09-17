import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { loadTextureSet, applyCharacterTextures, stripRootMotion, skeletonBoneNames, clipToSkeleton } from './mixamo.js';

// 打工人被感染后的觉醒形态，有两套外观（画家、读者），感染时随机取一个。
// 两套的骨骼都是主角 46 根骨骼的子集（画家 22 根、读者 28 根），所以能直接套主角的待机与攻击动作，
// 多出来的骨骼轨道会被安全忽略。任一形态资源缺失只跳过它自己，不影响另一套。
const MIXAMO = `${import.meta.env?.BASE_URL ?? '/'}mixamo/`;

const VARIANTS = [
  { label: '画家', dir: 'awakened' },
  { label: '读者', dir: 'awakened-reader' },
];

const TEXTURES = {
  map: 'tex/base_color.png',
  normalMap: 'tex/normal.png',
  roughnessMap: 'tex/roughness.png',
  metalnessMap: 'tex/metallic.png',
};

function renameClip(clip, name, boneNames) {
  const copy = clip.clone();
  copy.name = name;
  clipToSkeleton(copy, boneNames);
  return stripRootMotion(copy);
}

async function loadVariant({ label, dir }) {
  const base = `${import.meta.env?.BASE_URL ?? '/'}${dir}/`;
  const loader = new FBXLoader();
  const model = await loader.loadAsync(base + 'running-jump.fbx');
  const maps = await loadTextureSet(TEXTURES, base);
  const meshCount = applyCharacterTextures(model, maps);
  const boneNames = skeletonBoneNames(model);

  const animations = [];
  // 自带的 Running Jump 髋部起伏很大，是跳跃动作，当跑步循环会一直起跳落地，所以归位成跳跃。
  const jump = model.animations[0];
  if (jump) animations.push(renameClip(jump, 'jump', boneNames));
  const runModel = await loader.loadAsync(MIXAMO + 'run.fbx');
  const run = runModel.animations[0];
  if (run) animations.push(renameClip(run, 'walk', boneNames));
  const idleModel = await loader.loadAsync(MIXAMO + 'idle.fbx');
  const idle = idleModel.animations[0];
  if (idle) animations.push(renameClip(idle, 'idle', boneNames));
  const attackModel = await loader.loadAsync(MIXAMO + 'flurry.fbx');
  const attack = attackModel.animations[0];
  if (attack) {
    animations.push(renameClip(attack, 'flurry', boneNames));
    animations.push(renameClip(attack, 'heavyPunch', boneNames));
  }

  if (!animations.length) throw new Error('没有任何动画');
  console.log(`[awakened] ${label}形态已载入 mesh: ${meshCount} | 动作: ${animations.map(clip => clip.name).join(', ')}`);
  return { scene: model, animations, label };
}

// 返回与 GLTF 资产同构的 { scene, animations }，交给 prepareCharacterAsset 统一处理缩放与边界。
export async function loadAwakenedAssets() {
  const results = await Promise.all(VARIANTS.map(variant => loadVariant(variant).catch(error => {
    console.warn(`[awakened] ${variant.label}形态载入失败，已跳过：`, error.message);
    return null;
  })));
  const loaded = results.filter(Boolean);
  if (!loaded.length) throw new Error('没有任何觉醒形态资源可用');
  return loaded;
}
