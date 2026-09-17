import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { loadTextureSet, applyCharacterTextures, stripRootMotion, skeletonBoneNames, clipToSkeleton } from './mixamo.js';

// 打工人：AIGC 生成的模型，配 Mixamo 的 Thriller Idle（站立）和 Sad Walk（走路）。
// 资源放在 public/workers/ 下；任何一个文件缺失就整体回退到原来的体素打工人。
const BASE = `${import.meta.env?.BASE_URL ?? '/'}workers/`;

const TEXTURES = {
  map: 'tex/base_color.png',
  normalMap: 'tex/normal.png',
  roughnessMap: 'tex/roughness.png',
  metalnessMap: 'tex/metallic.png',
};

// 动作名必须对齐 characters.js 的取法：未感染者站立取 idle，移动取 zombie。
let boneNames = new Set();
function renameClip(clip, name) {
  const copy = clip.clone();
  copy.name = name;
  clipToSkeleton(copy, boneNames);
  return stripRootMotion(copy);
}

// 返回与 GLTF 资产同构的 { scene, animations }，交给 prepareCharacterAsset 统一处理缩放与边界。
export async function loadWorkerAsset() {
  const loader = new FBXLoader();
  const model = await loader.loadAsync(BASE + 'thriller-idle.fbx');
  const maps = await loadTextureSet(TEXTURES, BASE);
  const meshCount = applyCharacterTextures(model, maps);
  boneNames = skeletonBoneNames(model);

  const animations = [];
  // 站立就用 Thriller Idle 自带的这段待机，自带一点颤栗感，是刻意的姿态。
  const idle = model.animations[0];
  if (idle) animations.push(renameClip(idle, 'idle'));
  const walkModel = await loader.loadAsync(BASE + 'sad-walk.fbx');
  const walk = walkModel.animations[0];
  if (walk) animations.push(renameClip(walk, 'zombie'));

  if (!animations.length) throw new Error('打工人资源里没有任何动画');
  console.log('[worker] 打工人已载入 mesh:', meshCount, '| 动作:', animations.map(clip => clip.name).join(', '));
  return { scene: model, animations };
}
