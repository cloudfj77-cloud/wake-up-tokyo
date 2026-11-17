import type {AssetRegistry} from '@forgeax/engine/assets-runtime';
import {AnimationPlayer,AnimationTargetId,bindAnimationTargets,createIKSolver,type IKSolver} from '@forgeax/engine/animation';
import type {EntityHandle,World} from '@forgeax/engine/ecs';
import {Name,Transform,Children,ChildOf,worldDespawnScene} from '@forgeax/engine/scene';
import {Visibility,VisibilityStateValue,MeshFilter,MeshRenderer} from '@forgeax/engine/render';
import type {AssetHandle} from '@forgeax/engine/types';
import {vec3,quat} from '@forgeax/engine/math';
import {FULL_ASSETS} from './asset-refs.ts';
import {ENEMIES,isRangedEnemy} from './rules.js';
export type PropName='shield'|'baton'|'gun';
export type ModelName='player'|'worker'|'guard'|'shield-cop'|'baton-cop'|'infected-cop'|'ally-0'|'ally-1';
export function descendants(world:World,root:EntityHandle):EntityHandle[]{const out:EntityHandle[]=[],stack=[root];while(stack.length){const e=stack.pop()!;out.push(e);const children=world.get(e,Children);if(children.ok)for(const c of children.value.entities)stack.push(c as EntityHandle);}return out;}
export class CharacterLibrary{
 loaded=new Map<string,Promise<{scene:AssetHandle<'scene'>,clips:AssetHandle<'animation-clip'>[],names:string[]}>>();
 private propSources=new Map<PropName,Promise<AssetHandle<'scene'>>>();
 handles:number[]=[];private lifetime=new AbortController();private closed=false;
 constructor(public world:World,public assets:AssetRegistry){}
 load(name:ModelName){let task=this.loaded.get(name);if(!task){task=(async()=>{const ref=FULL_ASSETS[name];const scene=(await this.assets.load(ref.scene,'scene',{signal:this.lifetime.signal})).unwrap();this.handles.push(scene);const clips:AssetHandle<'animation-clip'>[]=[],names:string[]=[];for(const [key,guid]of Object.entries(ref.clips)){const handle=(await this.assets.load(guid,'animation-clip',{signal:this.lifetime.signal})).unwrap();this.handles.push(handle);clips.push(handle);names.push(key);}return{scene,clips,names};})();this.loaded.set(name,task);}return task;}
 private loadProp(name:PropName){let task=this.propSources.get(name);if(!task){task=(async()=>{const h=(await this.assets.load(FULL_ASSETS[('prop-'+name) as 'prop-gun'].scene,'scene',{signal:this.lifetime.signal})).unwrap();this.handles.push(h);return h;})();this.propSources.set(name,task);}return task;}
 instantiate(name:ModelName,parent:EntityHandle,prop?:PropName):Promise<CharacterVisual>;
 instantiate(name:ModelName,parent:EntityHandle,prop:PropName|undefined,current:()=>boolean):Promise<CharacterVisual|undefined>;
 async instantiate(name:ModelName,parent:EntityHandle,prop?:PropName,current?:()=>boolean){const source=await this.load(name),propScene=prop?await this.loadProp(prop):undefined,ref=FULL_ASSETS[name],world=this.world;if(current&&!current())return;if(this.closed)throw new Error('Character library closed');const parentState=world.get(parent,Transform);if(!parentState.ok){if(current&&parentState.error.code==='stale-entity')return;throw parentState.error;}const root=this.assets.instantiate(source.scene,world,parent).unwrap();const scale=ref.height/ref.sourceHeight;world.set(root,Transform,{scale:[scale,scale,scale],pos:[0,-ref.minY*scale,0]}).unwrap();if(world.get(root,Name).ok)world.set(root,Name,{value:name}).unwrap();else world.addComponent(root,{component:Name,data:{value:name}}).unwrap();
  // Bind imported defaults explicitly so the render publication owns the entire material/texture closure on its first visible frame.
  for(const entity of descendants(world,root)){const filter=world.get(entity,MeshFilter),renderer=world.get(entity,MeshRenderer);if(!filter.ok||!renderer.ok)continue;const mesh=this.assets.read(filter.value.assetHandle).unwrap();const defaults=mesh.materialSlots.map(slot=>slot.defaultMaterial);if(defaults.length&&defaults.every(value=>typeof value==='number'))world.set(entity,MeshRenderer,{materials:defaults as AssetHandle<'material'>[]}).unwrap();}
  let propRoot:EntityHandle|undefined;if(propScene&&prop){const spec=prop==='shield'?{bones:['mixamorigLeftForeArm','forearmL','handL'],pos:[-.1,.195,.02],scale:.48,angle:0,grip:0}:prop==='baton'?{bones:['mixamorigRightHand','handR'],pos:[.085,.065,.135],scale:.45,angle:2.1,grip:.25}:{bones:['mixamorigRightHand','handR'],pos:[.055,.02,.075],scale:.26,angle:1.45,grip:.18};const bone=descendants(world,root).find(e=>{const n=world.get(e,Name);return n.ok&&spec.bones.includes(n.value.value);});if(bone!==undefined){const chain:EntityHandle[]=[];for(let e=bone;;){chain.push(e);if(e===root)break;const parent=world.get(e,ChildOf);if(!parent.ok||parent.value.parent===null)break;e=parent.value.parent;}chain.reverse();const orientation=quat.create();let parentOrientation=quat.create();for(const e of chain){parentOrientation=quat.clone(orientation);quat.multiply(orientation,orientation,world.get(e,Transform).unwrap().quat);}const inverse=quat.invert(quat.create(),orientation);let q=quat.create();if(prop==='shield')quat.multiply(q,inverse,quat.eulerY(-Math.PI/2));else{const local=world.get(bone,Transform).unwrap().pos,arm=vec3.normalize(vec3.create(),quat.transformVec3(vec3.create(),parentOrientation,local)),axis=vec3.cross(vec3.create(),arm,[0,0,1]);if(vec3.length(axis)<1e-6)vec3.set(axis,1,0,0);vec3.normalize(axis,axis);const turn=quat.fromAxisAngle(quat.create(),axis,spec.angle),target=quat.transformVec3(vec3.create(),inverse,quat.transformVec3(vec3.create(),turn,arm));quat.fromUnitVectors(q,[0,1,0],target);}const offset=quat.transformVec3(vec3.create(),q,[0,spec.scale*spec.grip,0]);propRoot=this.assets.instantiate(propScene,world,bone).unwrap();world.set(propRoot,Transform,{pos:spec.pos.map((n,i)=>n+offset[i]),scale:[spec.scale,spec.scale,spec.scale],quat:Array.from(q)}).unwrap();}}
  if(source.clips.length){world.addComponent(root,{component:AnimationPlayer,data:{clips:source.clips,times:source.clips.map(()=>0),weights:source.clips.map((_,i)=>source.names[i]==='idle'?1:0),speeds:source.clips.map(()=>1),looping:true}}).unwrap();const targets=descendants(world,root).filter(e=>world.get(e,AnimationTargetId).ok);bindAnimationTargets(world,root,targets).unwrap();}
  world.addComponent(root,{component:Visibility,data:{state:VisibilityStateValue.inherited}}).unwrap();return new CharacterVisual(world,root,name,source.names,source.clips.length,propRoot);
 }
 dispose(){this.closed=true;this.lifetime.abort();for(const h of this.handles.reverse())this.assets.release(h).unwrap();this.handles=[];this.loaded.clear();}
}
const LOOPING=['idle','walk','zombie','toyAim','strafe'];
const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
function clipSpan(action:string){return (action==='roll'||action==='diveRoll') ? .72 : .65;}

/**
 * 主角动作和 Three.js 的 updateCharacterVisual 用同一套优先级：
 * 持枪翻滚用 diveRoll，空中按起跳速度锁跳跃姿势，持枪移动用横移，站住用举枪。
 */
export function playerPose(player:{roll:number;y:number;vy:number;attackPose:number;attackAction?:string;moving:boolean;groundSpeed?:number},weapon:number,recoil:number){
 const gun=weapon!==-1;
 if(player.roll>0)return{action:gun?'diveRoll':'roll',jumpPhase:undefined as number|undefined};
 if(player.y>.01||player.vy>0)return{action:'jump',jumpPhase:clamp01((7-player.vy)/14)};
 if(player.attackPose>0)return{action:player.attackAction||'flurry',jumpPhase:undefined};
 if(recoil>0)return{action:'toyRecoil',jumpPhase:undefined};
 if(player.moving&&(player.groundSpeed??0)>.12)return{action:gun?'strafe':'walk',jumpPhase:undefined};
 return{action:gun?'toyAim':'idle',jumpPhase:undefined};
}

/** 远程兵举枪横移，工人用蹒跚，近战挥击按原版分成重击和连打。 */
export function actorPose(unit:{type:number;converted?:boolean;attackPose?:number;visualMoving?:boolean;groundSpeed?:number;aiming?:boolean},alerted:boolean){
 const spec=ENEMIES[unit.type as keyof typeof ENEMIES] as {slam?:unknown}|undefined;
 const gun=isRangedEnemy(spec)&&(alerted||!!unit.aiming||(unit.attackPose??0)>0);
 if((unit.attackPose??0)>0)return gun?'toyRecoil':unit.type===1||unit.type===3||spec?.slam?'heavyPunch':'flurry';
 const moving=!!unit.visualMoving&&(unit.groundSpeed??0)>.12,human=unit.type===0&&!unit.converted;
 if(moving)return human?'zombie':gun?'strafe':'walk';
 return gun?'toyAim':'idle';
}

export class CharacterVisual{
 action='';weights:number[];private shape='';private hands:IKSolver[]=[];private shown=true;private token:unknown;private disposed=false;private hold='';private holdLeft=0;
 constructor(public world:World,public root:EntityHandle,public name:ModelName,public names:string[],count:number,private propRoot?:EntityHandle){this.weights=Array(count).fill(0);if(name==='player'){const nodes=new Map(descendants(world,root).map(e=>[world.get(e,Name).ok?world.get(e,Name).unwrap().value:'',e]));for(const side of ['Right','Left']){const joints=['Arm','ForeArm','Hand'].map(j=>nodes.get('mixamorig'+side+j));if(joints.every(j=>j!==undefined))this.hands.push(createIKSolver(world,{joints:joints as EntityHandle[],maxIterations:12,tolerance:.005}).unwrap());}}}
 pose(growth=1,crouch=false,lift=0){const shape=growth+','+crouch+','+lift;if(shape===this.shape)return;this.shape=shape;const ref=FULL_ASSETS[this.name],fit=ref.height/ref.sourceHeight,scale=fit*growth;this.world.set(this.root,Transform,{scale:[scale,scale*(crouch?.7:1),scale],pos:[0,-ref.minY*scale-(crouch?.15:0)+lift,0]}).unwrap();}
 grip(targets:number[][],poles:number[][]){for(let n=0;n<this.hands.length;n++)this.hands[n].solve(vec3.create(...targets[n] as [number,number,number]),{pole:vec3.create(...poles[n] as [number,number,number])}).unwrap();}
 update(dt:number,action:string,movingSpeed=0,visible=true,token:unknown=0,jumpPhase?:number){if(visible!==this.shown){this.shown=visible;this.world.set(this.root,Visibility,{state:visible?VisibilityStateValue.inherited:VisibilityStateValue.hidden}).unwrap();}if(!this.names.length)return;const requested=this.names.includes(action)?action:this.names.includes(action==='walk'?'zombie':'idle')?(action==='walk'?'zombie':'idle'):action==='strafe'&&this.names.includes('walk')?'walk':this.names[0];
  // 原版一次挥击大约播 0.65 秒，翻滚 0.72 秒。命中窗口更短，但动作不能跟着提前切回待机。
  const interrupt=requested==='jump'||requested==='roll'||requested==='diveRoll';
  const oneShot=!interrupt&&!LOOPING.includes(requested);
  if(oneShot&&(this.token!==token||this.hold!==requested)){this.hold=requested;this.holdLeft=clipSpan(requested);}
  if(interrupt){this.hold='';this.holdLeft=0;}else if(this.holdLeft>0)this.holdLeft=Math.max(0,this.holdLeft-dt);
  if(this.holdLeft<=0)this.hold='';
  const selected=this.hold&&this.names.includes(this.hold)?this.hold:requested;const index=this.names.indexOf(selected),player=this.world.get(this.root,AnimationPlayer).unwrap();const changed=this.action!==selected||this.token!==token;this.token=token;this.action=selected;
  const fade=interrupt ? .025 : LOOPING.includes(selected) ? .18 : .07,step=Math.min(1,dt/Math.max(fade,.001));this.weights=this.weights.map((w,i)=>w+((i===index?1:0)-w)*step);
  const durations=FULL_ASSETS[this.name].durations as Record<string,number>,speeds=this.names.map(()=>1);
  // 步频用真实移动速度除以原版兜底步幅：工人 0.55、同伴 1.9、其余 2，上限 4 倍。
  const natural=this.name==='worker' ? .55 : this.name.startsWith('ally') ? 1.9 : 2;
  if(selected==='walk'||selected==='zombie'||selected==='strafe')speeds[index]=Math.max(0,Math.min(4,movingSpeed/natural));
  if(selected==='roll'||selected==='diveRoll'||selected==='flurry'||selected==='heavyPunch'||selected==='toyRecoil')speeds[index]=Math.max(.01,(durations[selected]??1)/clipSpan(selected));
  const patch:{weights:number[];speeds:number[];paused:boolean;looping:boolean;times?:number[]}={weights:this.weights,speeds,paused:!visible,looping:LOOPING.includes(selected)};
  // 平常不回写时间，让动画系统继续往前走。换动作或跳跃锁帧时才指定这一段的时间。
  if(changed||(selected==='jump'&&jumpPhase!==undefined)){const times=Array.from(player.times);if(changed)times[index]=0;if(selected==='jump'&&jumpPhase!==undefined){times[index]=(durations.jump??1)*clamp01(jumpPhase);speeds[index]=0;}patch.times=times;}
  this.world.set(this.root,AnimationPlayer,patch).unwrap();
 }
 dispose(){if(this.disposed)return;this.disposed=true;for(const root of [this.propRoot,this.root]){if(root===undefined)continue;const state=this.world.get(root,Transform);if(state.ok)worldDespawnScene(this.world,root).unwrap();else if(state.error.code!=='stale-entity')throw state.error;}}
}
