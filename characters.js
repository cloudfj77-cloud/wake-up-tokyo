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

export function createCharacterVisual(asset, kind, variant = 0) {
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
    const copyMaterial = source => {
      if (!materials.has(node)) {const m=source.clone();m.vertexColors=false;const skin=/head|wrist/.test(node.name);const legs=/hip|knee|ankle/.test(node.name);const shirt=kind==='guard'?0x526c83:[0xe7e0cd,0xd8dfd9,0xd7a15b,0x779a7e,0xb19b79][variant%5];m.userData.baseTone=skin?0xc7a487:legs?0x53616a:shirt;m.color.setHex(m.userData.baseTone);materials.set(node,m);}
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
  decorateProfession(visual, kind, variant);
  setCharacterKind(visual, kind, variant);
  switchAnimation(visual, 'idle', .0);
  mixer.update(variant * .27);
  return visual;
}

export function setCharacterKind(visual, kind, variant = 0) {
  visual.kind = kind;
  if(visual.infectionAccent){visual.infectionAccent.visible=kind==='player'||kind==='ally';visual.infectionAccent.userData.streak.visible=visual.infectionAccent.visible;}
  visual.marker.material.color.setHex(accents[kind]);
  visual.marker.visible = kind !== 'human';
  for (const material of visual.materials.values()) {
    material.color.setHex(material.userData.baseTone??0xffffff).multiply(new THREE.Color(colors[kind]));
    if (kind === 'human') material.color.offsetHSL((variant - 2) * .015, 0, -(variant % 3) * .025);
    material.emissive?.setHex(kind === 'player' ? 0x3b105a : kind === 'ally' ? 0x30094c : 0);
    material.emissiveIntensity = .3;
  }
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
    const name = moving ? (visual.kind === 'human' ? 'zombie' : 'walk') : visual.holdingGun ? 'toyAim' : 'idle';
    const action = visual.actions[name];
    const scale = !moving ? 1 : visual.kind === 'human' ? .42 : visual.kind === 'ally' ? 1.95 : (sprinting ? 1.9 : 1.3);
    if (action) action.setEffectiveTimeScale(scale);
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

const accessoryGeometry=new THREE.BoxGeometry(1,1,1);
export const PROFESSIONS=['厨师','医生','建筑工人','配送员','教师'];
function decorateProfession(v,kind,variant){
 const head=v.root.getObjectByName('bone_head'),waist=v.root.getObjectByName('bone_waist'),wrist=v.root.getObjectByName('bone_wristR');
 if(!head||!waist||!wrist)return;
 const add=(parent,w,h,d,color,x,y,z)=>{const m=new THREE.Mesh(accessoryGeometry,new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;parent.add(m);v.meshes.push(m);return m;};
 const p=variant%5;
 if(kind==='guard'){
  add(head,1.3,.45,1.15,0x425b71,0,.8,0);add(head,1.1,.28,.16,0x89b8d2,0,.38,.64);
  add(waist,1.7,1.1,.35,0x385268,0,.55,.55);add(wrist,.25,.3,1.45,0x344049,0,0,.65);
 }else if(p===0){
  add(head,1.3,.45,1.1,0xe9e5d6,0,.9,0);add(head,1.55,.6,1.25,0xf7f1e0,0,1.3,0);
  add(waist,1.35,1.8,.18,0x343545,0,.1,.58);add(waist,.25,.35,.2,0xbd6551,0,1.03,.62);
  add(wrist,.13,1.3,.12,0x777b79,0,.5,0);add(wrist,.65,.6,.12,0xb3bab6,0,1.3,0);
 }else if(p===1){
  for(const xx of [-.55,.55])add(waist,.7,1.9,.28,0xf0eee0,xx,.1,.54);
  add(waist,1.5,1.5,.3,0xe9e8db,0,.2,-.6);add(wrist,.4,.95,.4,0xaf6fe5,0,.5,.2);add(wrist,.09,.9,.09,0xcbd1d0,0,1.3,.2);
 }else if(p===2){
  add(head,1.35,.5,1.15,0xe8b14c,0,.92,0);add(head,1.65,.12,1.5,0xf0c25f,0,.65,.15);
  add(waist,1.8,1.35,.22,0xdb964e,0,.5,.58);for(const xx of [-.5,.5])add(waist,.17,1.35,.08,0xf3edc3,xx,.5,.74);
  add(wrist,.7,.9,.55,0xdcb15e,0,.1,.2);add(wrist,.15,1.25,.15,0x7a8389,0,-.9,.2);
 }else if(p===3){
  add(head,1.1,.4,1.1,0x629b77,0,.8,0);add(head,.95,.1,.7,0x629b77,0,.65,.8);
  add(waist,1.65,1.55,.9,0xc4a17b,0,.4,-.95);add(waist,1.4,.18,.12,0x749b74,0,.4,-1.44);
  add(wrist,.35,.65,.2,0x354a48,0,.2,.15);
 }else{
  add(waist,1.5,1.2,.22,0xb49b70,0,.45,.6);add(waist,1.1,1.35,.5,0x695c76,0,.25,-.85);
  for(let i=0;i<3;i++)add(wrist,.85,.22,.65,[0xad714e,0x607e86,0xa1ac6f][i],0,i*.23,.2);
 }
 const accents=new THREE.Group();head.add(accents);const am=new THREE.MeshStandardMaterial({color:0xc77bff,emissive:0xa344ef,emissiveIntensity:1.4});
 for(const x of [-.25,.2]){const m=new THREE.Mesh(accessoryGeometry,am);m.scale.set(.19,.13,.12);m.position.set(x,.17,.63);accents.add(m);}
 const streak=new THREE.Mesh(accessoryGeometry,am);streak.scale.set(.2,.8,.15);streak.position.set(.3,.4,.8);waist.add(streak);accents.userData.streak=streak;v.infectionAccent=accents;

}
