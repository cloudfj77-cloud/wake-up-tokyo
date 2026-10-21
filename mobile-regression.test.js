import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import * as rules from './rules.js';
import {canMeleeReach} from './combat-space.js';
import {renderPixelRatio} from './render-quality.js';
import {WalkCollision} from './tokyo/collision.js';
import {batchStaticScene,pruneEmptyStaticGroups} from './tokyo/render-batches.js';
import {prepareStaticMaterials} from './tokyo/material-atlas.js';
import {createTokyoNavigation} from './tokyo/navigation.js';
import {prepareCharacterAsset,createCharacterVisual,setCharacterKind,playCharacterAttack,updateCharacterVisual} from './characters.js';
import {clipToSkeleton,skeletonBoneNames,stripRootMotion} from './mixamo.js';

const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const noop=()=>{};

test('QA completion cannot erase the real checkpoint; ordinary end-of-run still clears it',()=>{
 for(const search of ['?test=abilities','']){
  let removed=0;const elements=new Map(),ctx=vm.createContext({...rules,state:rules.makeState(),units:[],boss:{},mode:'playing',music:{update:noop,effect:noop},hushRadio:noop,clearAirstrike:noop,
   location:{search},URLSearchParams,localStorage:{removeItem(){removed++;}},SAVE_KEY:'game',document:{body:{classList:{toggle:noop}}},
   $:id=>{if(!elements.has(id))elements.set(id,{classList:{remove:noop}});return elements.get(id);},showDialog:noop,formatTime:()=>''});
  vm.runInContext(source.split('\n').find(s=>s.startsWith('function finish(result)'))+";finish('ended');",ctx);
  assert.equal(removed,search?0:1);
 }
});

test('ranged target selection checks the best forward candidate first and uses a chest ray',()=>{
 const units=[{id:1,x:0,z:-1},{id:2,x:1,z:3},{id:3,x:0,z:2}],checked=[];
 const ctx=vm.createContext({...rules,units,player:{x:0,z:0},forward:()=>({x:0,z:1}),world:{combatClear:(a,b)=>{checked.push(b.id);return true;},clear(){throw Error('expensive walkability scan for ranged aim');}}});

 vm.runInContext(source.split('\n').find(s=>s.startsWith('function acquire(range'))+';result=acquire(20)',ctx);
 assert.equal(ctx.result.id,3);assert.deepEqual(checked,[3]);
});

test('combat rays pass below an overpass but stop at walls, upper floors and living towers',()=>{
 const root=new T.Group(),floor=new T.Mesh(new T.PlaneGeometry(12,12),new T.MeshBasicMaterial());floor.rotation.x=-Math.PI/2;floor.position.y=3.3;root.add(floor);
 const wall=new T.Mesh(new T.PlaneGeometry(4,4),floor.material);wall.position.set(4,1,1.5);root.add(wall);
 const collision=new WalkCollision(root),towers=[],worldSource=readFileSync(new URL('./tokyo-world.js',import.meta.url),'utf8');
 const begin=worldSource.indexOf('combatClear(a,b){'),end=worldSource.indexOf('guideTo(p)',begin);
 const ctx=vm.createContext({T,collision,towers,nav:{heightAt:(x,z,h)=>h??0}});
 vm.runInContext('clear=({'+worldSource.slice(begin,end)+'}).combatClear;',ctx);
 const player={x:0,z:0,floorY:0};assert.equal(ctx.clear(player,{x:0,z:3,floorY:0}),true);
 assert.equal(ctx.clear(player,{x:0,z:3,floorY:3.3}),false);
 assert.equal(ctx.clear({x:4,z:0,floorY:0},{x:4,z:3,floorY:0}),false);
 towers.push({x:0,z:1.5,floorY:0,w:1,d:1,h:2,dead:false});assert.equal(ctx.clear(player,{x:0,z:3,floorY:0}),false);
 towers[0].dead=true;assert.equal(ctx.clear(player,{x:0,z:3,floorY:0}),true);
});

test('mobile distant AI advances elapsed time while reducing per-frame navigation work',()=>{
 const actor={...rules.makeUnit(1,0,20,0),floorY:0},units=[actor];let moves=0;
 const ctx=vm.createContext({...rules,units,player:{x:0,z:0},aiStart:0,ALLY_VIEW:18,visuals:new Map(),world:{mobile:true,waypoint:()=>({x:40,z:0})},TUNE:{activity:{shambleSpeed:1}},
  civilianMoveTarget:()=>({x:40,z:0}),move:(u,x,z)=>{moves++;u.x+=x;u.z+=z;return true;}});
 vm.runInContext(section('const CROWD_CELL=','function civilianMoveTarget')+section('function runAI(','function dropActorVisual'),ctx);
 for(let i=0;i<120;i++)vm.runInContext('runAI(.04,true)',ctx);
 assert.ok(actor.x>24.4&&actor.x<24.9);assert.ok(moves<45,'distant workers should not navigate every frame');
});

test('visible throttled workers animate every frame without advancing animation time twice',()=>{
 const actor={...rules.makeUnit(1,0,20,0),floorY:0},visual={holder:{rotation:{},visible:true}};
 let animationTime=0,frames=0,moves=0;
 const ctx=vm.createContext({...rules,units:[actor],player:{x:0,z:0},aiStart:0,ALLY_VIEW:18,
  visuals:new Map([[actor.id,{v:visual}]]),world:{mobile:true,waypoint:()=>({x:40,z:0})},TUNE:{activity:{shambleSpeed:1}},
  actorViewLimit:()=>34,actorInFront:()=>true,civilianMoveTarget:()=>({x:40,z:0}),
  updateCharacterVisual:(v,moving,dt)=>{v.holder.visible=true;frames++;animationTime+=dt;},
  move:(u,x,z)=>{moves++;u.x+=x;u.z+=z;return true;}});
 vm.runInContext(section('const CROWD_CELL=','function civilianMoveTarget')+section('function runAI(','function dropActorVisual'),ctx);
 for(let i=0;i<120;i++)vm.runInContext('runAI(.04,true)',ctx);
 assert.equal(frames,120);assert.ok(Math.abs(animationTime-4.8)<1e-8);assert.ok(moves<45);assert.equal(visual.holder.visible,true);
 actor.x=80;actor.logicWait=.2;visual.accumulated=1;
 vm.runInContext('runAI(.04,true)',ctx);
 assert.equal(visual.holder.visible,false);assert.equal(visual.accumulated,0);assert.equal(frames,120);
});

test('real light and heavy attacks reject lower decks and walls, but reach adjacent stair treads',()=>{
 for(const kind of ['light','heavy']){
  const units=[0,-3.85,.3].map((floorY,i)=>({...rules.makeUnit(i,0,0,1),floorY}));
  const wall={...rules.makeUnit(4,0,0,1),floorY:0,wall:true};units.push(wall);
  const hits=[];
  const ctx=vm.createContext({...rules,canMeleeReach,units,state:rules.makeState(),mode:'playing',attackCd:0,switchTime:0,reloadTime:0,yaw:0,
   player:{x:0,z:0,y:0,floorY:0},playerVisual:{holder:{rotation:{}}},boss:{active:false},
   world:{multilevel:true,heightAt:(x,z,y)=>y,clear:(a,b)=>!b.wall,breakAt:noop},forward:()=>({x:0,z:1}),
   activeGun:()=>null,holdingLauncher:()=>false,raiseAlarm:noop,playCharacterAttack:noop,applyHit:u=>hits.push(u.id),music:{effect:noop},burst:noop});
  vm.runInContext(source.split('\n').find(line=>line.startsWith('function acquire(range'))+'\n'+section('function meleeStrike(kind)','function emitLauncherShot('),ctx);
  // acquire's following helpers may be hoisted but only the actual strike is run.
  vm.runInContext(`meleeStrike('${kind}')`,ctx);
  assert.ok(hits.includes(0));assert.ok(!hits.includes(1));assert.ok(!hits.includes(4));
  if(kind==='heavy')assert.ok(hits.includes(2));
 }
});

test('mother aura, purifier and landed mist preserve floor identity; existing DOT follows its target',()=>{
 const s=rules.makeState();s.abilities.air=3;
 const player={x:0,z:0,floorY:3.3},same={...rules.makeUnit(1,0,1,0),floorY:3.3},below={...rules.makeUnit(2,0,1,0),floorY:0};
 rules.tickInfection(s,[same,below],player,.5);assert.ok(same.infection>0);assert.equal(below.infection,0);
 s.airClouds=[{x:1,z:0,floorY:3.3,time:3}];player.x=40;
 rules.tickInfection(s,[same,below],player,.5);assert.equal(below.infection,0);
 s.abilities.dot=1;below.tagged='player';rules.tickInfection(s,[below],player,.5);assert.ok(below.infection>0);
 const purifier={...rules.makeUnit(3,4,1,0),floorY:3.3};s.abilities.air=0;s.abilities.dot=0;below.tagged=false;below.playerInfection=false;below.infection=10;
 rules.tickInfection(s,[below,purifier],player,.5);assert.equal(below.infection,10);
 rules.spawnAirDrop(s,[],player);assert.equal(s.airDrops[0].floorY,3.3);
 rules.stepSimulation(s,[],player,.7,'playing');assert.ok(s.airClouds.some(c=>c.floorY===3.3));
});

test('converted tutorial workers are released and old checkpoints clear stationary state',()=>{
 const s=rules.makeState(),u={...rules.makeUnit(1,0,0,0),stationary:true,tutorialWorker:true};
 rules.hit(s,u,u.threshold,0);assert.equal(u.converted,true);assert.equal(u.stationary,false);
 assert.match(section('function restore(saved)','let starting=false'),/if\(u.converted\)u.stationary=false/);
});

test('real worker rigs animate idle, walking and post-attack idle; converted workers keep a walking clip',()=>{
 const manager=new T.LoadingManager();manager.addHandler(/.*/,{load:()=>new T.Texture()});
 const parse=file=>{const b=readFileSync(new URL('./public/workers/'+file,import.meta.url));return new FBXLoader(manager).parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
 const model=parse('thriller-idle.fbx'),names=skeletonBoneNames(model),walk=parse('sad-walk.fbx');
 const clips=[model.animations[0],walk.animations[0]].map((clip,i)=>{clip=stripRootMotion(clipToSkeleton(clip.clone(),names));clip.name=i?'zombie':'idle';return clip;});
 const asset=prepareCharacterAsset({scene:model,animations:clips}),v=createCharacterVisual(asset,'human');
 const pose=()=>{const values=[];v.root.traverse(o=>{if(o.isBone)values.push(...o.quaternion.toArray());});return values;};
 const changed=(a,b)=>a.some((n,i)=>Math.abs(n-b[i])>1e-4);
 const advance=moving=>{for(let i=0;i<30;i++)updateCharacterVisual(v,moving,1/60,2);};
 let before=pose();advance(false);assert.ok(changed(before,pose()),'idle skeleton frozen');
 before=pose();advance(true);assert.ok(changed(before,pose()),'walking skeleton frozen');assert.equal(v.current.getClip().name,'zombie');
 setCharacterKind(v,'ally');advance(true);assert.equal(v.current.getClip().name,'zombie','converted worker must walk');
 playCharacterAttack(v,'infect',.35);advance(false);advance(false);before=pose();advance(false);
 assert.ok(changed(before,pose()),'fallback idle remained clamped after attack');assert.equal(v.current.loop,T.LoopRepeat);
});

test('spatial render batches retain every source transform and cull distant sections',()=>{
 const root=new T.Group(),section=new T.Group();root.position.set(11,3.3,-28.6);root.scale.setScalar(.55);root.add(section);
 const geometry=new T.BoxGeometry(),material=new T.MeshBasicMaterial(),expected=[];
 for(let i=0;i<16;i++){const m=new T.Mesh(geometry,material);m.position.set((i%4)*60,0,Math.floor(i/4)*60);section.add(m);}
 root.updateMatrixWorld(true);for(const m of section.children)expected.push(new T.Vector3().setFromMatrixPosition(m.matrixWorld).toArray().map(n=>n.toFixed(4)).join(','));
 const batch=batchStaticScene(root,{cellSize:24}),actual=[];root.updateMatrixWorld(true);
 // Single-source cells remain ordinary meshes and multi-source cells are batched.
 root.traverse(o=>{if(o.isMesh&&o.visible&&!o.isBatchedMesh)actual.push(new T.Vector3().setFromMatrixPosition(o.matrixWorld).toArray().map(n=>n.toFixed(4)).join(','));if(o.name==='Static_Material_Batch'){const m=new T.Matrix4();for(let i=0;i<o.instanceCount;i++){o.getMatrixAt(i,m);m.premultiply(o.matrixWorld);actual.push(new T.Vector3().setFromMatrixPosition(m).toArray().map(n=>n.toFixed(4)).join(','));}}});

 assert.deepEqual(actual.sort(),expected.sort());assert.ok(batch.batchCount<16);
 const empty=new T.Group();section.add(empty);assert.ok(pruneEmptyStaticGroups(root)>0);assert.ok(!section.children.includes(empty));
});

test('sign atlases keep original pixel dimensions, UV orientation and per-instance colors',()=>{
 const root=new T.Group(),section=new T.Group();root.add(section);const draws=[];
 const canvas=()=>({width:0,height:0,getContext:()=>({drawImage:(...args)=>draws.push(args)})});
 for(const hex of [0xff0000,0x0000ff]){
  const map=new T.Texture({width:256,height:256});map.flipY=false;map.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshStandardMaterial({map,emissiveMap:map,color:hex,emissive:0xffffff,emissiveIntensity:.35,metalness:0,roughness:.45});
  section.add(new T.Mesh(new T.PlaneGeometry(1,1),material));
 }
 const original=[...section.children],stats=prepareStaticMaterials(root,{createCanvas:canvas});
 assert.equal(stats.signTextures,2);assert.equal(stats.atlasTextures,1);assert.equal(stats.materials,1);
 assert.equal(original[0].userData.batchMaterial,original[1].userData.batchMaterial);
 assert.equal(original[0].userData.batchColor.getHex(),0xff0000);assert.equal(original[1].userData.batchColor.getHex(),0x0000ff);
 assert.equal(original[0].material.map.flipY,false);assert.equal(draws[0].length,3,'image must be copied at original size');
 const uv=original[0].geometry.attributes.uv;assert.ok(uv.getY(0)>uv.getY(2));
 const batch=batchStaticScene(root);assert.equal(batch.batchCount,1);
 const mesh=section.children.find(o=>o.name==='Render_Batches_Exclude_From_Export').children.find(o=>o.name==='Static_Material_Batch'),color=new T.Color();
 mesh.getColorAt(0,color);assert.equal(color.getHex(),0xff0000);mesh.getColorAt(1,color);assert.equal(color.getHex(),0x0000ff);
});

test('local paths move a crowd around a corner without waiting for a whole-map flood field',()=>{
 const nodes=[],lookup=new Map();for(let z=0;z<12;z++)for(let x=0;x<12;x++){if(x===5&&z<8)continue;lookup.set(x+','+z,nodes.length);nodes.push([x,z,0,[]]);}
 for(const n of nodes)for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const id=lookup.get((n[0]+dx)+','+(n[1]+dz));if(id!==undefined)n[3].push(id);}
 const nav=createTokyoNavigation({bounds:{minX:0,minZ:0,maxX:12,maxZ:12},step:1,width:12,depth:12,nodes});
 const crowd=Array.from({length:36},(_,id)=>({id,x:3.5,z:4.5,floorY:0}));
 for(let frame=0;frame<480;frame++){nav.beginNavigationFrame();for(let n=0;n<crowd.length;n++){const u=crowd[(n+frame)%crowd.length],p=nav.waypoint(u,7.5,4.5,0),d=Math.hypot(p.x-u.x,p.z-u.z);if(d>.01){const step=Math.min(d,.15),x=u.x+(p.x-u.x)/d*step,z=u.z+(p.z-u.z)/d*step;assert.ok(nav.canMove(u,x,z));Object.assign(u,{x,z,floorY:nav.heightAt(x,z,0)});}}}
 assert.ok(crowd.every(u=>Math.hypot(u.x-7.5,u.z-4.5)<.4),'some workers stalled');
});

test('mobile low quality caps pixels in both orientations while desktop and standard retain their scale',()=>{
 assert.equal(renderPixelRatio(2400,1080,3,'low',true),.375);assert.equal(renderPixelRatio(1080,2400,3,'low',true),.375);
 assert.equal(renderPixelRatio(800,360,3,'low',true),1);assert.equal(renderPixelRatio(1920,1080,2,'low',false),1);assert.equal(renderPixelRatio(2400,1080,3,'standard',true),1.5);
});
