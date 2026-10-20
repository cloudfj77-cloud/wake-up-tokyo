import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { loadTextureSet, stripRootMotion, skeletonBoneNames, clipToSkeleton } from './mixamo.js';

// 持盾特警（type 3）与持棍巡警（type 1）的专属模型：AIGC 出的 FBX，浏览器直接解析，不需要离线转换。
// 资源放在 public/police/ 下，两个模型共用同一套 PBR 贴图。
const BASE = `${import.meta.env?.BASE_URL ?? '/'}police/`;
const SHIELD_FILE = 'shield/Police_Animated_v5.fbx';
const BATON_FILE = 'baton/Police_Baton_Anatomy.fbx';
const INFECTED_FILE = 'infected/Standing Melee Run Jump Attack.fbx';

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

// 感染后的警察是另一套贴图（basecolor / metallic / normal / roughness 文件名都不一样）。
const INFECTED_TEXTURES = {
  map: 'tex-infected/tripo_model_basecolor.JPEG',
  normalMap: 'tex-infected/tripo_model_normal.PNG',
  roughnessMap: 'tex-infected/tripo_model_roughness.JPEG',
  metalnessMap: 'tex-infected/tripo_model_metallic.JPEG',
};

// 只给「没有贴图」的网格补材质：盾警的面罩是透明件，自带材质不能被覆盖成不透明。
// 只挂颜色 + 法线两张：AIGC 出的 roughness/metallic 图经常把表面烘得很光滑（值偏低），
// 套上去就是一层油光；金属度图更是让制服反光发亮。人物是布料和塑料，固定粗糙度即可。
function applyCopTextures(model, maps) {
  let applied = 0;
  model.traverse(node => {
    if (!node.isMesh) return;
    if (!node.geometry?.attributes.normal) node.geometry?.computeVertexNormals();
    const mat = node.material;
    const mats = Array.isArray(mat) ? mat : [mat];
    if (mats.some(m => m && (m.map || m.transparent))) return;
    node.material = new THREE.MeshStandardMaterial({
      map: maps.map ?? null,
      normalMap: maps.normalMap ?? null,
      // 哑光制服：粗糙度固定，不用贴图乘；金属度直接归零，彻底去掉反光发亮。
      roughness: 0.75,
      metalness: 0,
      // 暗面兜底，避免死黑。自发光要用颜色贴图本身当 emissiveMap：
      // 直接用白色 emissive 等于往画面里加白光，人物会「发白掉色」，饱和度全没了。
      emissive: new THREE.Color(0xffffff),
      emissiveMap: maps.map ?? null,
      emissiveIntensity: 0.22,
      normalScale: new THREE.Vector2(0.8, 0.8),
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

// 借来的 Mixamo 动作里 hips 的 Y 是绝对高度（按约 1.8 米的角色烘的），
// 套到身高只有 1 个单位的模型上会把整个人顶到半空 —— 这就是「站在天上」的原因。
// 把 hips 的 Y 整体平移到模型自己的骨盆高度，起伏保留、绝对高度对齐。
function retargetHipsY(clip, model) {
  const point = new THREE.Vector3();
  let hipsY = null;
  model.updateMatrixWorld(true);
  model.traverse(node => {
    if (!node.isBone || !/hips|pelvis/i.test(node.name)) return;
    node.getWorldPosition(point);
    hipsY = hipsY === null ? point.y : Math.max(hipsY, point.y);
  });
  if (hipsY === null) return clip;
  for (const track of clip.tracks) {
    if (!/hips\.position$/i.test(track.name)) continue;
    const values = track.values;
    if (!values.length) continue;
    const delta = hipsY - values[1];
    for (let i = 1; i < values.length; i += 3) values[i] += delta;
  }
  return clip;
}

// 包围盒的最低点不一定是脚底：模型里常带着不可见的参考几何体，按包围盒对齐会把整个人托到半空。
// 找到脚部骨骼的实际高度当地面基准更可靠。只对「脚明显高于包围盒底」的情况生效，
// 认不出脚骨骼或数值离谱就返回 null，交回原来的包围盒逻辑。
function groundHeightOf(model) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const point = new THREE.Vector3();
  let footY = Infinity;
  model.traverse(node => {
    if (!node.isBone || !/foot|toe|ankle/i.test(node.name)) return;
    node.getWorldPosition(point);
    footY = Math.min(footY, point.y);
  });
  if (!Number.isFinite(footY)) return null;
  if (footY <= bounds.min.y) return null;
  if (footY > bounds.min.y + (bounds.max.y - bounds.min.y) * 0.35) return null;
  return footY;
}

// 返回与 GLTF 资产同构的 { scene, animations }，交给 prepareCharacterAsset 统一处理缩放与边界。
// mapping 是 [FBX 里的动作名, 游戏逻辑动作名]；感染警察不走这里（见 loadInfectedCopAsset）。
async function loadCop(file, mapping, label, options = {}) {
  const loader = new FBXLoader();
  const model = await loader.loadAsync(BASE + file);
  const maps = await loadTextureSet(options.textures || TEXTURES, BASE);
  const meshCount = applyCopTextures(model, maps);
  const animations = [];
  const byName = new Map(model.animations.map(clip => [clip.name, clip]));
  for (const [clipName, logicName] of mapping) {
    const source = byName.get(clipName);
    if (!source) { console.warn(`[police] ${label} 缺少动作：${clipName}`); continue; }
    animations.push(renameClip(source, logicName));
  }
  if (!animations.length) throw new Error(`${label}资源里没有可用动画`);
  console.log(`[police] ${label}已载入 · 补贴图网格 ${meshCount} · 动作 ${animations.map(clip => clip.name).join(', ')}`);
  return { scene: model, animations };
}

// 盾牌与棍子是单独的 OBJ 配件（没有骨骼、没有动画，就是一块几何体），
// 加载后挂到对应骨骼上：盾牌挂左前臂 forearmL，棍子挂右手 handR。
async function loadProp(name) {
  const base = `${BASE}parts/${name}/`;
  const object = await new OBJLoader().loadAsync(base + name + '.obj');
  const maps = await loadTextureSet({ map: 'basecolor.jpg', normalMap: 'Normal.png' }, base);
  let count = 0;
  object.traverse(node => {
    if (!node.isMesh) return;
    if (!node.geometry?.attributes.normal) node.geometry?.computeVertexNormals();
    // 和人物同一套质感：只挂颜色 + 法线，固定哑光，避免油光和发白。
    node.material = new THREE.MeshStandardMaterial({
      map: maps.map ?? null,
      normalMap: maps.normalMap ?? null,
      roughness: 0.7,
      metalness: 0.05,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: maps.map ?? null,
      emissiveIntensity: 0.12,
      normalScale: new THREE.Vector2(0.8, 0.8),
    });
    node.castShadow = true;
    count++;
  });
  console.log(`[police] 配件 ${name} 已载入 mesh: ${count}`);
  return object;
}

/* 持枪警察手里那把黑枪：程序化生成，不依赖外部资产。
   和盾牌/棍子同一套约定 —— 长度方向是局部 +Y，整体约 1 个单位长，
   挂载时由 PROP_XFORM.gun 的 scale / grip / angle 决定最终大小和握持角度。
   形状按手枪来：套筒 + 枪管 + 握把 + 弹匣 + 扳机护圈 + 准星，枪身是哑光黑。 */
export function makeGunProp() {
  const gun = new THREE.Group();
  gun.name = 'gun';
  const steel = new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: .42, metalness: .62 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: .68, metalness: .22 });
  const sight = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: .35, metalness: .5 });
  const part = (geometry, material, position, rotation) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    gun.add(mesh);
    return mesh;
  };
  // 机匣 / 套筒
  part(new THREE.BoxGeometry(.086, .5, .062), steel, [0, .2, 0]);
  // 枪管（圆柱默认沿 +Y，正好就是长度方向）
  part(new THREE.CylinderGeometry(.027, .027, .34, 12), steel, [0, .62, 0]);
  // 枪口稍粗一点，看着像真枪口
  part(new THREE.CylinderGeometry(.034, .034, .05, 12), sight, [0, .78, 0]);
  // 握把：向后下倾斜，柄端朝 -Y 落在手心
  part(new THREE.BoxGeometry(.072, .19, .058), grip, [0, -.12, -.012], [.28, 0, 0]);
  // 弹匣
  part(new THREE.BoxGeometry(.062, .13, .05), grip, [0, -.04, -.028], [.12, 0, 0]);
  // 扳机护圈
  part(new THREE.BoxGeometry(.058, .05, .07), grip, [0, .04, -.008]);
  // 准星
  part(new THREE.BoxGeometry(.028, .045, .028), sight, [0, .43, .048]);
  // 套筒后端的击锤
  part(new THREE.BoxGeometry(.05, .05, .05), steel, [0, -.02, .012]);
  return gun;
}

export async function loadPoliceProps() {
  const [shield, baton] = await Promise.all([loadProp('shield'), loadProp('baton')]);
  return { shield, baton, gun: makeGunProp() };
}

export function loadShieldCopAsset() {
  return loadCop(SHIELD_FILE, SHIELD_CLIPS, '持盾特警');
}

export function loadBatonCopAsset() {
  return loadCop(BATON_FILE, BATON_CLIPS, '持棍巡警');
}

// 感染后的警察：只取这个 FBX 的外观，动作借用 public/mixamo/ 那套。
// 它的骨骼是 Mixamo 命名（mixamorig*，52 根），和持盾/持棍那两套（root/pelvis/spine，约 21 根）
// 完全对不上，动画没法互相套；而它自带的 FBX 只有一段 3.67 秒的 mixamo.com，
// 分不出站立/移动/攻击。觉醒者用的正是同一套 Mixamo 骨骼，所以借它的动作最稳。
export async function loadInfectedCopAsset() {
  const MIXAMO = `${import.meta.env?.BASE_URL ?? '/'}mixamo/`;
  const loader = new FBXLoader();
  const model = await loader.loadAsync(BASE + INFECTED_FILE);
  const maps = await loadTextureSet(INFECTED_TEXTURES, BASE);
  const meshCount = applyCopTextures(model, maps);
  const boneNames = skeletonBoneNames(model);

  const borrow = async (file, name) => {
    const source = await loader.loadAsync(MIXAMO + file);
    const clip = source.animations[0];
    if (!clip) { console.warn(`[police] 感染警察 借不到动作：${file}`); return null; }
    const copy = clip.clone();
    copy.name = name;
    clipToSkeleton(copy, boneNames);
    retargetHipsY(copy, model);
    return stripRootMotion(copy);
  };
  const animations = [];
  // 站立和移动借 Mixamo 通用动作；攻击必须用模型自带的那段（跳起来劈下去），
  // 借来的拳击动作配这把棍子不对味。翻滚（roll）不借，避免人物一直翻跟头。
  for (const [file, name] of [
    ['idle.fbx', 'idle'],
    ['run.fbx', 'walk'],
    ['zombie.fbx', 'zombie'],
    ['jump.fbx', 'jump'],
  ]) {
    const clip = await borrow(file, name);
    if (clip) animations.push(clip);
  }
  // 自带这段就是「大跳 + 劈砍」，同时兼作重击和连招。
  // 它同样是从 Mixamo 重定向来的（动画名 mixamo.com，描述里写着 Retargeted Clip），
  // hips 的绝对高度并不等于本模型的骨盆高度，不做重定向的话跳起来就落不回地面。
  const own = model.animations[0];
  if (own) {
    for (const name of ['heavyPunch', 'flurry']) {
      const copy = own.clone();
      copy.name = name;
      clipToSkeleton(copy, boneNames);
      retargetHipsY(copy, model);
      animations.push(stripRootMotion(copy));
    }
  }
  if (!animations.length) throw new Error('感染警察没有任何可用动画');
  // 这套模型的包围盒底不在脚上，直接按包围盒对齐会悬空，所以额外给出脚的实际高度。
  const groundY = groundHeightOf(model);
  console.log(`[police] 感染警察已载入 · 补贴图网格 ${meshCount} · 地面基准 ${groundY === null ? '沿用包围盒' : groundY.toFixed(3)} · 动作 ${animations.map(clip => clip.name).join(', ')}`);
  return { scene: model, animations, groundY };
}
