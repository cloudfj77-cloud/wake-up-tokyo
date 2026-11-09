import type {} from '@forgeax/engine/app';
import type {AssetHandle} from '@forgeax/engine/types';
import type {Plugin} from '@forgeax/engine/plugin';
import {Time,Update,type EntityHandle} from '@forgeax/engine/ecs';
import {INPUT_SNAPSHOT_RESOURCE_KEY,FRAME_START_SCAN_SYSTEM_NAME,type InputSnapshot} from '@forgeax/engine/input';
import {Camera,perspective,DirectionalLight,Skylight,MeshFilter,MeshRenderer,TONEMAP_ACES_FILMIC,ANTIALIAS_NONE} from '@forgeax/engine/render';
import {Transform,ChildOf,Name,worldDespawnScene,PROPAGATE_TRANSFORMS_SYSTEM} from '@forgeax/engine/scene';
import {quat} from '@forgeax/engine/math';
import {createRun,tick,view,snapshot,neutral,SPEC} from './rules.ts';
export const game:Plugin.Object<Record<string,string>>={name:'wakeup/native-migration',inject:['world','assets','gameHost'],async apply(ctx,cfg){
 const world=ctx.world,assets=ctx.assets!,host=ctx.gameHost!;
 await ctx.effect(async function*(){
  const entities:EntityHandle[]=[];const roots:EntityHandle[]=[];
  yield ()=>{for(const r of roots.reverse())worldDespawnScene(world,r).unwrap();for(const e of entities.reverse())world.despawn(e).unwrap();};
  const loaded=async <K extends 'scene'|'mesh'|'material'>(key:string,kind:K)=>{const h=(await assets.load(cfg[key],kind)).unwrap();return h;};
  const cafe=await loaded('cafe','scene');yield ()=>assets.release(cafe).unwrap();roots.push(assets.instantiate(cafe,world).unwrap());
  const box=await loaded('box','mesh'),sphere=await loaded('sphere','mesh');yield ()=>{assets.release(box).unwrap();assets.release(sphere).unwrap();};
  const mats:Record<string,AssetHandle<'material'>>={};for(const k of ['foe','friend','juice','weapon','marker'])mats[k]=await loaded(k,'material');yield ()=>{for(const h of Object.values(mats))assets.release(h).unwrap();};
  const spawn=(name:string,pos:number[],scale:number[],mesh=box,mat=mats.foe,parent?:EntityHandle)=>{const e=world.spawn({component:Name,data:{value:name}},{component:Transform,data:{pos,scale}},{component:MeshFilter,data:{assetHandle:mesh}},{component:MeshRenderer,data:{materials:[mat]}}).unwrap();if(parent!==undefined)world.addComponent(e,{component:ChildOf,data:{parent}}).unwrap();entities.push(e);return e;};
  const state=createRun();world.insertResource('WakeupRun',state);yield ()=>world.removeResource('WakeupRun');
  const player=world.spawn({component:Name,data:{value:'Player'}},{component:Transform,data:{pos:[state.x,state.y,state.z]}}).unwrap();entities.push(player);
  const playerScene=await loaded('player','scene'),playerMesh=await loaded('playerMesh','mesh');yield ()=>{assets.release(playerScene).unwrap();assets.release(playerMesh).unwrap();};
  const mesh=assets.read(playerMesh).unwrap() as any;const bounds=Array.from(mesh.aabb??[0,0,0,1,175,1]) as number[];const height=Math.max(.001,bounds[4]-bounds[1]);
  const avatar=assets.instantiate(playerScene,world,player).unwrap();roots.push(avatar);world.set(avatar,Transform,{scale:[1.7/height,1.7/height,1.7/height]}).unwrap();
  spawn('Shoulder injector',[.42,1.24,-.3],[.22,.24,.95],box,mats.weapon,player);spawn('Purple reservoir',[.42,1.4,-.22],[.17,.2,.48],box,mats.juice,player);
  const actors=state.actors.map((a,i)=>spawn(`Patrol ${i}`,[a.x,a.y+.85,a.z],[.45,1.7,.45]));
  const bars=state.actors.map((a,i)=>spawn(`Faction bar ${i}`,[a.x,a.y+2,a.z],[.65,.09,.09]));
  const pickup=spawn('Cafe weapon pickup',[-3,.6,3.5],[.35,.35,.35],sphere,mats.marker);
  const puddles=Array.from({length:64},(_,i)=>spawn(`Juice ${i}`,[0,-100,0],[.4,.015,.4],sphere,mats.juice));
  const bolts=Array.from({length:12},(_,i)=>spawn(`Spray ${i}`,[0,-100,0],[.05,.05,.2],sphere,mats.juice));
  const camera=world.spawn({component:Name,data:{value:'Migration camera'}},{component:Transform,data:{}},{component:Camera,data:{...perspective({fov:SPEC.fov*Math.PI/180,aspect:16/9,near:.1,far:150}),tonemap:TONEMAP_ACES_FILMIC,antialias:ANTIALIAS_NONE,clearColor:[.45,.58,.65,1]}}).unwrap();entities.push(camera);
  entities.push(world.spawn({component:DirectionalLight,data:{direction:[-.32,-.91,-.24],intensity:2,color:[1,.98,.93],castShadow:false}}).unwrap());
  entities.push(world.spawn({component:Skylight,data:{color:[.85,.92,1],groundColor:[.55,.5,.4],intensity:1}}).unwrap());
  host.setPointerLockAllowed?.(true);yield ()=>host.setPointerLockAllowed?.(false);
  const unreg=host.gameProjection?.registerRead({id:'wakeup.sample',title:'Wakeup migration state',description:'Native World gameplay authority, no Three.js renderer.',read:()=>({...snapshot(state),playerSourceHeight:height,renderer:'native-webgpu'})});if(unreg)yield unreg;
  let lastPublish=0;
  world.addSystem(Update,{name:'wakeup-native',after:[FRAME_START_SCAN_SYSTEM_NAME],before:[PROPAGATE_TRANSFORMS_SYSTEM],queries:[],fn:()=>{
   const input=world.getResource<InputSnapshot>(INPUT_SNAPSHOT_RESOURCE_KEY),k=input.keyboard,m=input.mouse;const i=neutral();
   i.x=Number(k.downCode('KeyD'))-Number(k.downCode('KeyA'));i.z=Number(k.downCode('KeyW'))-Number(k.downCode('KeyS'));i.jump=k.justPressedCode('ShiftLeft')||k.justPressedCode('ShiftRight');i.roll=k.justPressedCode('Space');i.sprint=k.downCode('KeyE');i.fire=k.downCode('KeyJ')||m.button(0);if(m.pointerLocked||m.button(2)){i.lookX=m.movementDelta.x;i.lookY=m.movementDelta.y;}
   tick(state,i,world.getResource(Time).delta);
   const rotation=quat.eulerY(state.yaw);world.set(player,Transform,{pos:[state.x,state.y,state.z],quat:Array.from(rotation)}).unwrap();
   for(let n=0;n<actors.length;n++){const a=state.actors[n];world.set(actors[n],Transform,{pos:[a.x,a.y+.85,a.z]}).unwrap();world.set(bars[n],Transform,{pos:[a.x,a.y+2,a.z]}).unwrap();const material=a.ally?mats.friend:mats.foe;world.set(actors[n],MeshRenderer,{materials:[material]}).unwrap();world.set(bars[n],MeshRenderer,{materials:[material]}).unwrap();}
   world.set(pickup,Transform,{pos:state.equipped?[0,-100,0]:[-3,.6+Math.sin(state.time*3)*.12,3.5]}).unwrap();
   for(let n=0;n<puddles.length;n++){const p=state.puddles[n];world.set(puddles[n],Transform,{pos:p?[p[0],p[1]+.025,p[2]]:[0,-100,0]}).unwrap();}
   for(let n=0;n<bolts.length;n++){const b=state.bolts[n];world.set(bolts[n],Transform,{pos:b?b.slice(0,3):[0,-100,0]}).unwrap();}
   const v=view(state),q=quat.fromLookAt(quat.create(),v.eye,v.target,[0,1,0]);world.set(camera,Transform,{pos:v.eye,quat:Array.from(q)}).unwrap();
   if(state.time-lastPublish>.05){lastPublish=state.time;host.port?.postMessage({channel:'wakeup',kind:'state',state:snapshot(state)});}
  }}).unwrap();yield ()=>world.removeSystem(Update,'wakeup-native').unwrap();
 });
}};
