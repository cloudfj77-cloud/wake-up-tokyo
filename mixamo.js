import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// Mixamo 导出的 FBX 由浏览器直接解析，不需要任何离线转换。
// 模型放在 public/mixamo/ 下，用 manifest.json 声明「哪个是主角模型、每个动作对应哪个文件」。
// 后续新增动作：把 fbx 丢进 public/mixamo/，在 manifest.json 的 clips 里加一行即可。
const BASE = `${import.meta.env?.BASE_URL ?? '/'}mixamo/`;

// Mixamo 的位移动作会把位移烘进根骨骼：翻滚自带约 2 米向前位移。
// 它和代码控制的位移叠加会让角色多冲一段，动作切走时这段偏移又瞬间消失，
// 看起来就像「翻滚到位后又退回一点」。锁掉根骨骼的水平位移，上下起伏保留，
// 位移就完全由代码说了算，翻滚距离才能和设定值对得上。
export function stripRootMotion(clip) {
  for (const track of clip.tracks) {
    if (!/hips\.position$/i.test(track.name)) continue;
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

// 模型的骨骼集合，用来裁剪动作里多余的轨道。
export function skeletonBoneNames(model) {
  const names = new Set();
  model.traverse(node => { if (node.isSkinnedMesh) node.skeleton.bones.forEach(bone => names.add(bone.name)); });
  return names;
}

// 把精细骨骼的动作套到精简骨骼的模型上时，多出来的轨道找不到目标节点，
// 会逐帧刷 "No target node found" 警告。按模型实际骨骼裁掉这些轨道即可。
export function clipToSkeleton(clip, boneNames) {
  if (!boneNames || !boneNames.size) return clip;
  clip.tracks = clip.tracks.filter(track => boneNames.has(track.name.split('.')[0]));
  return clip;
}

// Mixamo 每个动作文件里的 clip 都叫 mixamo.com，必须按清单重命名，否则同名会互相覆盖。
function renameClip(clip, name) {
  const copy = clip.clone();
  copy.name = name;
  return stripRootMotion(copy);
}

// 颜色贴图要按 sRGB 解码，法线 / 粗糙度 / 金属度是数据贴图，必须保持线性，否则材质会发灰或发黏。
const SRGB_SLOTS = new Set(['map', 'emissiveMap']);

// 按清单载入整套 PBR 贴图。单张贴图缺失时只丢掉那一槽，不让整个角色加载失败。
export async function loadTextureSet(textures, base = BASE) {
  const loader = new THREE.TextureLoader();
  const results = await Promise.all(Object.entries(textures).map(async ([slot, file]) => {
    try {
      const texture = await loader.loadAsync(base + file);
      // 别被「FBX 的 UV 原点在左上」这句话带偏：实测这套贴图按 three 默认（flipY=true）才连贯，
      // 相邻面采样色差 8.9；反过来设成 false 会跳到 19.7，画面就是碎的。改这个前先量一遍。
      texture.flipY = true;
      texture.colorSpace = SRGB_SLOTS.has(slot) ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = 4;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return [slot, texture];
    } catch (error) {
      console.warn('[mixamo] 贴图载入失败，已跳过：', slot, file, error.message);
      return [slot, null];
    }
  }));
  return Object.fromEntries(results.filter(([, texture]) => texture));
}

// 把整套贴图挂到模型的每个网格上：颜色、法线、粗糙度、金属度一个都不少，才是完整的 PBR 外观。
export function applyCharacterTextures(model, maps) {
  let meshCount = 0;
  model.traverse(node => {
    if (!node.isMesh) return;
    meshCount++;
    // Mixamo 的 FBX 没有法线，必须按三角面重算，否则受光后整块发黑。
    // 3ds Max 导出的 FBX 自带正确法线（含硬边），重算反而会把硬边抹平，所以只在缺失时才算。
    if (!node.geometry?.attributes.normal) node.geometry?.computeVertexNormals();
    node.material = new THREE.MeshStandardMaterial({
      ...maps,
      // 这两个基础值是贴图的乘数，必须给满 1，否则贴图会被乘成 0 而看不出效果。
      roughness: 1,
      metalness: 1,
      normalScale: new THREE.Vector2(1, 1),
    });
  });
  return meshCount;
}

// 返回与 GLTF 资产同构的 { scene, animations }，交给 prepareCharacterAsset 统一处理缩放与边界。
export async function loadMixamoCharacter() {
  const manifestRes = await fetch(`${BASE}manifest.json`, { cache: 'no-cache' });
  if (!manifestRes.ok) throw new Error('未找到 mixamo/manifest.json');
  const manifest = await manifestRes.json();
  if (!manifest.model) throw new Error('manifest.json 缺少 model 字段');

  const loader = new FBXLoader();
  const model = await loader.loadAsync(BASE + manifest.model);
  // Mixamo 只导出骨骼和网格，贴图要按清单手动挂上。
  if (manifest.textures) {
    const maps = await loadTextureSet(manifest.textures);
    const meshCount = applyCharacterTextures(model, maps);
    console.log('[mixamo] 贴图已挂载 mesh:', meshCount, '| 贴图槽:', Object.keys(maps).join(','));
  }
  const animations = [];
  const own = model.animations[0];
  if (own) animations.push(renameClip(own, manifest.modelClip || own.name || 'idle'));

  for (const [name, file] of Object.entries(manifest.clips || {})) {
    // 同一个文件已被当作模型载入时，直接复用已解析的动画，避免重复下载。
    if (file === manifest.model) {
      if (own) animations.push(renameClip(own, name));
      continue;
    }
    const animated = await loader.loadAsync(BASE + file);
    const source = animated.animations[0];
    if (source) animations.push(renameClip(source, name));
  }

  if (!animations.length) throw new Error('mixamo 资源中没有任何动画');
  return { scene: model, animations };
}
