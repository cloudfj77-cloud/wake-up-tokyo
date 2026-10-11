import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { loadTextureSet, applyCharacterTextures, skeletonBoneNames, clipToSkeleton } from './mixamo.js';

// 持盾特警：Police_Completed/v5 的 Police_Animated_v5.fbx，21 根骨骼、57 个网格部件。
// 资源放在 public/police/ 下；任何一个文件缺失就整体回退到原来的体素警卫模型。
const BASE = `${import.meta.env?.BASE_URL ?? '/'}police/`;
const MODEL = 'Police_Animated_v5.fbx';

const TEXTURES = {
  map: 'tex/base_color.jpg',
  normalMap: 'tex/normal.png',
  roughnessMap: 'tex/roughness.jpg',
  metalnessMap: 'tex/metallic.jpg',
};

// 逻辑动作名 → FBX 里的片段名。FBX 自带六个已命名片段，直接按名字取即可。
// 走和跑是两套：03 是举着盾缓步推进，用来巡逻；05 是持盾奔跑，发现目标后才切过去。
// 02 举盾是猛冲前的立盾，06 是整段猛冲（含前摇、冲刺、刹车、收势）。
const CLIPS = {
  idle: '01_Shield_Idle',
  guard: '02_Raise_Shield_Large',
  walk: '03_Shield_Advance_Large',
  run: '05_Shield_Run',
  heavyPunch: '04_Shield_Bash',
  flurry: '04_Shield_Bash',
  rush: '06_Shield_Dash',
};

// 面罩和透明聚碳酸酯盾牌是半透明部件，FBX 的简化 alpha 材质在 three 里需要手动打开。
const TRANSLUCENT = /visor|polycarbonate/i;

let boneNames = new Set();

// 这套骨架的根骨骼叫 root（不是 Mixamo 的 Hips），位移就烘在 root.position 上。
// 猛冲自带 3.5 米向前位移，锁掉水平分量、保留上下起伏，前进距离才由代码说了算。
function stripRootMotion(clip) {
  for (const track of clip.tracks) {
    if (!/^root\.position$/i.test(track.name)) continue;
    const values = track.values;
    const baseX = values[0];
    const baseZ = values[2];
    for (let i = 0; i < values.length; i += 3) {
      values[i] = baseX;
      values[i + 2] = baseZ;
    }
  }
  return clip;
}

function renameClip(clip, name) {
  const copy = clip.clone();
  copy.name = name;
  clipToSkeleton(copy, boneNames);
  return stripRootMotion(copy);
}

function markTranslucent(model) {
  let count = 0;
  model.traverse(node => {
    if (!node.isMesh) return;
    if (!TRANSLUCENT.test(node.name)) return;
    const material = node.material;
    const list = Array.isArray(material) ? material : [material];
    for (const mat of list) {
      if (!mat) continue;
      mat.transparent = true;
      // 面罩比盾牌更透一点，正脸才看得出是透明护具而不是实心块。
      mat.opacity = /visor/i.test(node.name) ? .42 : .62;
      mat.depthWrite = false;
      mat.needsUpdate = true;
    }
    count++;
  });
  return count;
}

// 返回与 GLTF 资产同构的 { scene, animations }，交给 prepareCharacterAsset 统一处理缩放与边界。
export async function loadPoliceAsset() {
  const loader = new FBXLoader();
  const model = await loader.loadAsync(BASE + MODEL);
  const maps = await loadTextureSet(TEXTURES, BASE);
  const meshCount = applyCharacterTextures(model, maps);
  const translucent = markTranslucent(model);
  boneNames = skeletonBoneNames(model);

  const byName = new Map(model.animations.map(clip => [clip.name, clip]));
  const animations = [];
  for (const [name, sourceName] of Object.entries(CLIPS)) {
    const source = byName.get(sourceName);
    // 同名片段在 FBX 里可能带后缀，退一步按前缀找，找不到就跳过而不是整个角色加载失败。
    const clip = source ?? [...byName.values()].find(item => item.name.startsWith(sourceName));
    if (clip) animations.push(renameClip(clip, name));
  }
  if (!animations.length) throw new Error('警察资源里没有任何动画');
  console.log('[police] 持盾特警已载入 mesh:', meshCount, '| 半透明部件:', translucent,
    '| 动作:', animations.map(clip => clip.name).join(', '));
  return { scene: model, animations };
}
