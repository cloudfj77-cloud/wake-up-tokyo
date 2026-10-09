// 把漫画技能特效接到现在这版玩法上。只改画面，伤害和感染仍走原来的结算。
import {createComicAbilityFX,resolveComicAim,launchComicBallistic,stepComicBallistic,stepComicNeedle,createFleshProgressHUD} from './comic-ability-fx.js';
import {onAirCloudPlaced,onConverted,AIR_CLOUD_RADIUS,AIR_CLOUD_RANGE,FRENZY_TIDE_RADIUS,POWER_HITS} from './rules.js';

export function installComicFX(g){
 const T=g.T;
 const fx=createComicAbilityFX(T,g.scene,{height:g.PLAYER_HEIGHT,reducedMotion:g.reducedMotion.matches,quality:g.settings.quality});
 const flesh=createFleshProgressHUD(document,()=>g.state());
 const unitFX=new Map(),cloudFX=new Map(),projectileFX=new WeakMap(),pendingDrops=new Set();
 let suppress=0,clock=0,scan=0,lastBurst=g.state().burstTime||0,seen=g.state(),chargeAura=null,chargeHolder=null;
 const ground=(x,z)=>{const h=g.world().heightAt(x,z);return Number.isFinite(h)&&h>-2?h:0;};
 const near=(x,z,r=32)=>Math.hypot(x-g.player().x,z-g.player().z)<r;
 function pulse(x,z,kind,level=1,radius=1){
  if(!near(x,z,50))return null;
  const e=fx.pulse(x,ground(x,z)+.06,z,kind,level,radius);
  if(e&&(kind==='haste'||kind==='tough')){
   const p=g.player();
   e.g.rotation.y=kind==='haste'&&p.roll>0?Math.atan2(p.rollX,p.rollZ):g.yaw();
  }
  return e;
 }
 function dropUnit(record){if(record?.aura)fx.removeAura(record.aura);record?.anchor?.removeFromParent();}
 function resetObservers(){
  for(const record of unitFX.values())dropUnit(record);
  unitFX.clear();cloudFX.clear();
  for(const drop of pendingDrops)drop.cancelled=true;
  pendingDrops.clear();
  if(chargeAura)fx.removeAura(chargeAura);
  chargeAura=null;chargeHolder=null;lastBurst=g.state().burstTime||0;
 }
 for(const aura of [...g.activeAuras])g.removeAura(aura);
 for(const entry of g.visuals.values())entry.v.aura=null;
 const original={
  makeAura:g.makeAura,updateAura:g.updateAura,removeAura:g.removeAura,updateAuras:g.updateAuras,
  burst:g.burst,wave:g.wave,aura:g.aura,meleeStrike:g.meleeStrike,emitLauncherShot:g.emitLauncherShot,
  fireGun:g.fireGun,rush:g.rush,stepPlayerMotion:g.stepPlayerMotion,playerHurt:g.playerHurt,
  playLevelUpFx:g.playLevelUpFx,finishUpgrade:g.finishUpgrade,spawnGuard:g.spawnGuard,
  updatePickups:g.updatePickups,createPowerOrb:g.createPowerOrb,releasePowerWave:g.releasePowerWave,
  updatePowerShot:g.updatePowerShot
 };
 function makeAura(holder,palette,options={}){
  const kind=palette===g.AURA_COLORS.guard?'guard':palette===g.AURA_COLORS.level?'level':palette===g.AURA_COLORS.pickup?'pickup':'worker';
  const aura=fx.aura(holder,kind,{life:options.life||0,size:options.coreSize?Math.min(1.25,Math.max(.65,options.coreSize/1.8)):1});
  g.activeAuras.push(aura);return aura;
 }
 function updateAura(aura,dt){fx.updateAura(aura,dt);}
 function removeAura(aura){if(!aura)return;const index=g.activeAuras.indexOf(aura);if(index>=0)g.activeAuras.splice(index,1);fx.removeAura(aura);}
 function updateAuras(dt){
  flesh.update();
  if(g.mode()==='paused'||document.hidden)return;
  commitDrops(0);
  for(let i=g.activeAuras.length-1;i>=0;i--){
   const aura=g.activeAuras[i];
   if(aura.life>0&&(aura.life-=dt)<=0){removeAura(aura);continue;}
   if(aura.g.visible)fx.updateAura(aura,dt);
  }
  fx.update(dt,{pauseAirDrops:g.mode()!=='playing'});
 }
 for(const pickup of g.pickups)pickup.aura=makeAura(pickup.m,g.AURA_COLORS.pickup,{coreSize:1.45});
 function burst(x,y,z,color,count=10,force=5){
  if(suppress||!near(x,z,55))return;
  const effect=fx.burst(x,y,z,color,Math.max(1,Math.min(8,Math.ceil(count*.5))),Math.min(force,3));
  if(effect)effect.g.scale.setScalar(.65);
 }
 function wave(x,z,radius,color=0xb477ec){if(suppress||!near(x,z,65))return;fx.wave(x,ground(x,z)+.055,z,radius,color);}
 const rangeGeo=rangeGeometry(T,.994,1),rangeInk=rangeGeometry(T,.99,1.004);
 function aura(key,x,z,radius,color){
  let group=g.auraVisuals.get(key);
  if(group&&!group.userData.comicRange){g.scene.remove(group);group.geometry?.dispose?.();group.material?.dispose?.();g.auraVisuals.delete(key);group=null;}
  if(!group){
   group=new T.Group();group.userData.comicRange=true;
   const ink=new T.Mesh(rangeInk,new T.MeshBasicMaterial({color:0x24172f,side:T.DoubleSide,transparent:true,opacity:.32,depthWrite:false,toneMapped:false}));
   const edge=new T.Mesh(rangeGeo,new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.55,depthWrite:false,toneMapped:false}));
   edge.position.y=.006;group.add(ink,edge);group.userData.edge=edge;group.userData.ink=ink;g.scene.add(group);g.auraVisuals.set(key,group);
  }
  group.position.set(x,ground(x,z)+.045,z);group.scale.set(radius,1,radius);group.userData.edge.material.color.setHex(color);
  const mother=key==='mother',mist=String(key).startsWith('mist');
  group.userData.edge.material.opacity=(mother?.3:mist?.48:.63)*(g.reducedMotion.matches?1:.88+.12*Math.sin(clock*2));
  group.userData.ink.material.opacity=mother?.18:.32;group.visible=true;return group;
 }
 function meleeStrike(kind){
  const ready=g.mode()==='playing'&&g.attackCd()<=0&&g.switchTime()<=0&&g.reloadTime()<=0&&g.player().roll<=0&&!g.holdingLauncher()&&!g.activeGun();
  const result=original.meleeStrike(kind);
  if(ready&&g.attackCd()>0)fx.melee(g.player().x,ground(g.player().x,g.player().z)+g.player().y,g.player().z,g.yaw(),kind==='heavy');
  return result;
 }
 function muzzle(prior){
  const tracers=g.tracers();if(tracers.length<=prior)return;
  const shot=tracers[tracers.length-1];if(!shot.friendly)return;
  const f=g.forward(),y=shot.y??(ground(g.player().x,g.player().z)+g.player().y+(g.player().crouch?g.CROUCH_CHEST:g.STANDING_CHEST));
  const vx=Number.isFinite(shot.vx)?shot.vx:f.x,vz=Number.isFinite(shot.vz)?shot.vz:f.z,length=Math.hypot(vx,vz)||1;
  fx.shot(shot.x+vx/length*.35,y,shot.z+vz/length*.35,vx,vz,shot.isPower?0xd4ff38:shot.m?.material?.color?.getHex?.()||0xb85cff,!!shot.isPower);
 }
 function emitLauncherShot(spec,empowered,chargeShot){
  const count=g.tracers().length;let result;suppress++;
  try{result=original.emitLauncherShot(spec,empowered,chargeShot);}finally{suppress--;}
  if(g.tracers().length>count){
   const shot=g.tracers()[g.tracers().length-1];
   const origin=new T.Vector3(g.player().x,ground(g.player().x,g.player().z)+g.player().y+(g.player().crouch?g.CROUCH_CHEST:g.STANDING_CHEST),g.player().z);
   const aim=resolveComicAim(T,g.camera,origin,{world:g.world(),units:g.units(),boss:g.boss(),range:spec.range,bodyHeight:g.PLAYER_HEIGHT});
   if(empowered)Object.assign(shot,launchComicBallistic(T,origin,aim.target,spec.speed));
   else{const velocity=aim.target.clone().sub(origin).normalize().multiplyScalar(spec.speed);shot.vx=velocity.x;shot.vy=velocity.y;shot.vz=velocity.z;shot.manualAim=true;}
   shot.aimTarget=aim.target.clone();shot.aimKind=aim.kind;shot.x=origin.x;shot.y=origin.y;shot.z=origin.z;shot.m.position.copy(origin);
   if(empowered)fx.updateProjectile(shot.m,0,shot.vx,shot.vz,shot.vy);
   else shot.m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(shot.vx,shot.vy,shot.vz).normalize());
  }
  muzzle(count);return result;
 }
 function fireGun(...args){const count=g.tracers().length;let result;suppress++;try{result=original.fireGun(...args);}finally{suppress--;}if(!g.tracers()[g.tracers().length-1]?.isPower)muzzle(count);return result;}
 function rush(...args){const was=g.player().roll,result=original.rush(...args);if(was<=0&&g.player().roll>0&&g.state().abilities.haste){const effect=pulse(g.player().x,g.player().z,'haste',g.state().abilities.haste,.4);if(effect)effect.g.scale.setScalar(.45);}return result;}
 function stepPlayerMotion(dt){const was=g.player().y,result=original.stepPlayerMotion(dt);if(was>.045&&g.player().y===0){const effect=fx.burst(g.player().x,ground(g.player().x,g.player().z)+.05,g.player().z,0xfff0cb,2,.7);if(effect)effect.g.scale.setScalar(.35);}return result;}
 function playerHurt(...args){const result=original.playerHurt(...args);if(g.state().abilities.tough)pulse(g.player().x,g.player().z,'tough',g.state().abilities.tough,g.state().lastReflect?.radius?2:1);return result;}
 onConverted=(s,u)=>{if(s!==g.state())return;const effect=pulse(u.x,u.z,'convert',1,.6);if(effect)effect.g.scale.setScalar(.65);if(u.surge>0)pulse(u.x,u.z,'evolve',3,.8);};
 onAirCloudPlaced=(s,cloud)=>{
  if(s!==g.state())return;
  const index=s.airClouds?.indexOf(cloud)??-1;if(index<0)return;
  s.airClouds.splice(index,1);
  const pending={state:s,cloud,remaining:.65,landed:false,cancelled:false};
  pendingDrops.add(pending);
  const effect=fx.airDrop(cloud.x,ground(cloud.x,cloud.z)+.06,cloud.z,AIR_CLOUD_RADIUS,{onImpact:()=>{if(!pending.cancelled)pending.landed=true;}});
  if(Number.isFinite(effect?.impactAt))pending.remaining=effect.impactAt;
 };
 function commitDrops(dt){
  for(const drop of pendingDrops){
   if(drop.state!==g.state()||['menu','loading','ended','won'].includes(g.mode())){drop.cancelled=true;pendingDrops.delete(drop);continue;}
   if(g.mode()!=='playing')continue;
   drop.remaining-=dt;
   if(drop.landed||drop.remaining<=0){drop.cloud.time=3;(drop.state.airClouds||=[]).push(drop.cloud);cloudFX.set(drop.cloud,{t:0});pendingDrops.delete(drop);}
  }
 }
 function playLevelUpFx(){g.music.effect('upgrade');pulse(g.player().x,g.player().z,'upgrade',g.state().level,1.7);if(g.playerVisual())makeAura(g.playerVisual().holder,g.AURA_COLORS.level,{life:1.2,coreSize:1.8});if(g.state().abilities.evolve)pulse(g.player().x,g.player().z,'heal',g.state().abilities.evolve,.9);}
 function finishUpgrade(ability){const result=original.finishUpgrade(ability);pulse(g.player().x,g.player().z,ability.id==='launcher'?'charge':ability.id,g.state().abilities[ability.id]||1,1.15);return result;}
 function spawnGuard(...args){const unit=original.spawnGuard(...args);if(unit)pulse(unit.x,unit.z,'command',g.state().abilities.command||1,.8);return unit;}
 function updatePickups(dt){const count=g.pickups.length,result=original.updatePickups(dt);if(g.pickups.length<count)pulse(g.player().x,g.player().z,'heal',1,.9);return result;}
 function createPowerOrb(x,y,z){const mesh=fx.projectile(x,y,z,0xd4ff38);g.scene.add(mesh);return mesh;}
 function releasePowerWave(x,z,...args){
  const first=g.waves().length;let result;suppress++;
  try{result=original.releasePowerWave(x,z,...args);}finally{suppress--;}
  const waves=g.waves();
  for(let i=waves.length-1;i>=first;i--){const waveItem=waves[i];if(waveItem.m?.material?.wireframe){g.scene.remove(waveItem.m);waveItem.m.geometry?.dispose?.();waveItem.m.material?.dispose?.();waves.splice(i,1);}}
  fx.powerImpact(x,ground(x,z)+.05,z,6);return result;
 }
 function updatePowerShot(projectile,dt){
  stepComicBallistic(T,projectile,dt,g.world(),shot=>g.detonatePowerShot(shot));
  if(projectile.life<=0&&!projectile.comicImpacted){projectile.comicImpacted=true;g.detonatePowerShot(projectile);}
  projectile.trail=(projectile.trail||0)-dt;
  if(projectile.life>0&&projectile.trail<=0){fx.burst(projectile.x,projectile.y,projectile.z,0xb85cff,1,.5);projectile.trail=.12;}
  fx.updateProjectile(projectile.m,dt,projectile.vx,projectile.vz,projectile.vy);
 }
 function stepNeedle(projectile,dt){
  stepComicNeedle(T,projectile,dt,g.world(),{units:g.units(),boss:g.boss(),bodyHeight:g.PLAYER_HEIGHT,
   onUnit:unit=>{g.onPlayerProjectileHit(projectile);g.applyHit(unit,projectile.infection||0,projectile.damage||0);burst(projectile.x,projectile.y,projectile.z,projectile.m?.material?.color?.getHex?.()||0xb85cff,3,1);if(projectile.splash)for(const other of g.units())if(other!==unit&&!other.dead&&!other.converted&&Math.hypot(other.x-unit.x,other.z-unit.z)<projectile.splash)g.applyHit(other,(projectile.infection||0)*.5,(projectile.damage||0)*.5);},
   onBoss:()=>{g.onPlayerProjectileHit(projectile);if(projectile.damage>0)g.hitBoss(g.boss(),projectile.damage);burst(projectile.x,projectile.y,projectile.z,0xb85cff,3,1);},
   onTerrain:()=>{if(projectile.friendly)g.world().breakAt?.(projectile.x,projectile.z,projectile.splash||.75,18,burst);}
  });
 }
 function noteTide(){const burstPoint=g.state().tideBurst;if(!burstPoint)return;pulse(burstPoint.x,burstPoint.z,'frenzy',3,FRENZY_TIDE_RADIUS);flesh.noteBurst(g.state());}
 function beforeFrame(dt){commitDrops(dt);}
 function afterFrame(dt){
  clock+=dt;scan-=dt;
  if(seen!==g.state()){seen=g.state();resetObservers();}
  if(g.mode()!=='playing')return;
  if(g.state().burstTime>lastBurst+.1){const effect=pulse(g.player().x,g.player().z,'haste',2,.5);if(effect)effect.g.scale.setScalar(.45);}
  lastBurst=g.state().burstTime||0;
  const charged=g.state().abilities.launcher>=3&&(g.state().powerCharge||0)>=POWER_HITS;
  if(charged&&chargeHolder!==g.weaponPivot){if(chargeAura)fx.removeAura(chargeAura);chargeHolder=g.weaponPivot;chargeAura=fx.aura(g.weaponPivot,'charge',{size:.65});}
  if(!charged&&chargeAura){fx.removeAura(chargeAura);chargeAura=null;chargeHolder=null;}
  if(chargeAura){chargeAura.g.visible=(g.holdingLauncher()||!!g.activeGun())&&g.player().roll<=0;fx.updateAura(chargeAura,dt);}
  for(const shot of g.tracers()){
   if(!shot.friendly||!shot.m||shot.isPower)continue;
   if(!shot.manualAim&&Number.isFinite(shot.vx)&&Number.isFinite(shot.vz))shot.m.rotation.y=Math.atan2(shot.vx,shot.vz);
   let record=projectileFX.get(shot);if(!record){record={t:0};projectileFX.set(shot,record);}record.t-=dt;
   if(record.t<=0){const effect=fx.burst(shot.x,shot.y??g.STANDING_CHEST,shot.z,shot.m.material?.color?.getHex?.()||0xb85cff,1,.2);if(effect)effect.g.scale.setScalar(.3);record.t=g.reducedMotion.matches?.3:.18;}
  }
  if(scan>0){for(const record of unitFX.values())if(record.aura&&record.holder?.visible)fx.updateAura(record.aura,dt);return;}
  scan=.1;
  const wanted=new Set();
  const nearUnits=g.units().filter(unit=>!unit.dead&&near(unit.x,unit.z,20)).sort((a,b)=>Math.hypot(g.player().x-a.x,g.player().z-a.z)-Math.hypot(g.player().x-b.x,g.player().z-b.z));
  let count=0;
  for(const unit of nearUnits){
   const holder=g.visuals.get(unit.id)?.v?.holder;if(!holder||!holder.visible)continue;
   const kind=unit.converted?(unit.surge>0?'evolve':null):unit.parasite?'parasitic':g.state().abilities.dot>0&&unit.tagged&&unit.infection>0?'dot':null;
   if(!kind||count++>=8)continue;wanted.add(unit);
   let record=unitFX.get(unit);
   const corpse=unit.kind==='corpse';
   if(!record||record.kind!==kind||record.holder!==holder||record.corpse!==corpse){
    if(record)dropUnit(record);const anchor=corpse?new T.Group():null;if(anchor)g.scene.add(anchor);
    record={kind,holder,corpse,anchor,aura:fx.aura(anchor||holder,kind,{size:kind==='evolve'?.85:.7}),root:unit.root||0};unitFX.set(unit,record);
    if(kind==='parasitic')pulse(unit.x,unit.z,'dot',3,.75);
   }
   if(record.anchor)record.anchor.position.set(unit.x,ground(unit.x,unit.z)+.025,unit.z);
   record.aura.g.visible=holder.visible;
   if(unit.root>0&&record.root<=0)pulse(unit.x,unit.z,'dot',3,.75);record.root=unit.root||0;fx.updateAura(record.aura,dt);
  }
  for(const [unit,record] of unitFX)if(!wanted.has(unit)){dropUnit(record);unitFX.delete(unit);}
  for(const [key,group] of g.auraVisuals)if(!group.visible&&key!=='mother'){group.removeFromParent();group.traverse(node=>node.material?.dispose?.());g.auraVisuals.delete(key);}
  const clouds=new Set(g.state().airClouds||[]);
  for(const cloud of clouds)if(!cloudFX.has(cloud))cloudFX.set(cloud,{t:0});
  for(const cloud of cloudFX.keys())if(!clouds.has(cloud))cloudFX.delete(cloud);
 }
 addEventListener('keydown',event=>{
  if(event.code!=='KeyR'||event.repeat||g.mode()!=='playing'||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  pulse(g.player().x,g.player().z,'command',Math.max(1,g.state().abilities.command),g.squadIds.size?2.6:1);
  if(g.squadIds.size)for(const unit of g.units())if(g.squadIds.has(unit.id)&&!unit.dead)pulse(unit.x,unit.z,'command',1,.6);
 });
 window.gameFXSnapshot=()=>({edition:'comic-ability-v6',syringeAim:'crosshair',...fx.diagnostics(),trackedUnits:unitFX.size,clouds:cloudFX.size,pendingDrops:pendingDrops.size,air:{spawnRange:AIR_CLOUD_RANGE,cloudRadius:AIR_CLOUD_RADIUS,interval:.5,duration:3,infectionPerTick:4},fleshProgress:flesh.snapshot()});
 return {makeAura,updateAura,removeAura,updateAuras,burst,wave,aura,meleeStrike,emitLauncherShot,fireGun,rush,stepPlayerMotion,playerHurt,playLevelUpFx,finishUpgrade,spawnGuard,updatePickups,createPowerOrb,releasePowerWave,updatePowerShot,stepNeedle,noteTide,beforeFrame,afterFrame};
}
function rangeGeometry(T,inner,outer){
 const positions=[],segments=48;
 for(let i=0;i<segments;i++){
  const a=i/segments*Math.PI*2,b=(i+.63)/segments*Math.PI*2;
  const ax=Math.sin(a),az=Math.cos(a),bx=Math.sin(b),bz=Math.cos(b);
  positions.push(ax*inner,0,az*inner,ax*outer,0,az*outer,bx*outer,0,bz*outer,ax*inner,0,az*inner,bx*outer,0,bz*outer,bx*inner,0,bz*inner);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}
