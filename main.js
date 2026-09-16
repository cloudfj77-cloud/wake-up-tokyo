import * as T from 'three';
import {createBoss,hitBoss,animateBoss} from './boss.js';
import {createSyringe} from './syringe.js';
import {loadCharacterAssets,createCharacterVisual,setCharacterKind,playCharacterAttack,updateCharacterVisual,characterHeight,PROFESSIONS} from './characters.js';
import {block} from './world.js';
import {bridgeDeckHeight,loadRiverside} from './riverside-world.js';
import {Soundtrack} from './music.js';
import {ABILITIES,ENEMIES,WEAPONS,POPULATION,LEVEL_CAP,makeState,makeUnit,hit,upgrade,choices,stepSimulation,damageAlly,distance,threat,outcome,speed,cooldownScale,teamCount,hurtMother} from './rules.js';
import {MISSIONS,TUTORIAL_STEPS,advanceMission,missionReady,missionView,recordTutorialAction,skipTutorial,tutorialStep} from './missions.js';
const $=id=>document.getElementById(id),canvas=$('game');
const music=new Soundtrack();let mode='loading',state=makeState(),units=[],player={x:0,z:-7,y:0,vy:0,crouch:false,roll:0,rollX:0,rollZ:1},world,assets;
// 人物缩放后，枪口、受击特效和镜头也要跟着身体走，不能继续使用旧人物的高度。
const PLAYER_HEIGHT=characterHeight('player'),STANDING_CHEST=PLAYER_HEIGHT*.72,CROUCH_CHEST=PLAYER_HEIGHT*.45;
const ROLL_DURATION=.72;
// 特效和道具都是按 2.25 单位的老人物调的，人物缩小后必须按同一比例换算，否则会大得离谱。
const FX_SCALE=characterHeight('player')/2.25;
// 镜头距离按缩小后的人物重新设定，保持原来“站在主角肩后”的构图。
let yaw=0,pitch=.08,cameraDistance=2.7,mouseHeld=false,dragging=false,lastMouse=null,attackCd=0,breakCd=0,rushCd=0,reinforceTimer=24,reinforceDirection=0,reinforceAnnounced=false,totalReinforcements=0,invincible=0,toastTime=0,saveTimer=0,shake=0,damageFlash=0,target=null,frameDelta=0,choiceSet=[];
// 出生和导航规则发生变化后提升存档版本，旧角色坐标不会再次覆盖新的开局布局。
let settings={volume:.38,sensitivity:1,quality:'standard'};const SAVE_KEY='wake-up-tokyo-riverside-v1',SAVE_VERSION=6;let alerted=false,switchTime=0,nextWeapon=-1,reloadTime=0,reloadDuration=0,conversionCount=0,conversionTimer=0,hitMarkerTimer=0,policeAlertTimer=0,missionTimer=0,tutorialFinishTimer=0,lastHp=state.hp;let squadIds=new Set(),pendingConversions=[],missionTarget=null;
try{settings={...settings,...JSON.parse(localStorage.getItem('groundzero-settings')||'{}')};}catch{}
music.volume=settings.volume;
const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xbacdd4);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new T.Scene();scene.fog=new T.Fog(0xbacdd4,85,185);scene.add(new T.HemisphereLight(0xe5f1f5,0x8d9281,2.2));const sun=new T.DirectionalLight(0xffefda,2.8);sun.position.set(-28,55,-22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-52,right:52,top:52,bottom:-52,near:1,far:140});sun.shadow.bias=-.0003;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
const camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.12,180);camera.position.set(8,8,-21);camera.lookAt(0,3,5);
try{world=await loadRiverside(scene);}catch(error){console.error(error);$('loading').textContent='场景加载失败，请刷新重试';$('start').textContent='刷新重试';$('start').disabled=false;$('start').onclick=()=>location.reload();throw error;}
// 主菜单单独使用河岸观景位，避免跟随游戏出生点后把镜头放进建筑内部。
const menuHero=world.nearest(-10,10,.55);Object.assign(player,world.spawn);yaw=Math.PI;const boss=createBoss(scene),syringe=createSyringe();
// 注射枪原本按 2.25 单位高的人物制作，人物缩小后武器也要等比例缩小。
syringe.g.scale.setScalar(PLAYER_HEIGHT/2.25);
const weaponPivot=new T.Group();scene.add(weaponPivot);weaponPivot.add(syringe.g);
const visuals=new Map(),particles=[],waves=[],tracers=[],auraVisuals=new Map();let playerVisual,chargeRing,chargeSegments=[];
const missionBeacon=new T.Group(),beaconRing=new T.Mesh(new T.RingGeometry(.34,.43,24),new T.MeshBasicMaterial({color:0xe1a1ff,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false})),beaconBeam=new T.Mesh(new T.CylinderGeometry(.025,.18,2.4,10,1,true),new T.MeshBasicMaterial({color:0xc66cff,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));
beaconRing.rotation.x=-Math.PI/2;beaconBeam.position.y=1.2;missionBeacon.add(beaconRing,beaconBeam);missionBeacon.visible=false;scene.add(missionBeacon);
function createChargeRing(){
 // 圆环独立放在场景里，只跟随主角位置，不继承人物转身的旋转。
 const fullTurn=Math.PI*2,slot=fullTurn/6;
 chargeRing=new T.Group();scene.add(chargeRing);
 // 第一格固定在画面北侧，后续格子沿顺时针方向依次点亮。
 for(let i=0;i<6;i++){const material=new T.MeshBasicMaterial({color:0x634378,transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false});const segment=new T.Mesh(new T.RingGeometry(.58,.78,18,1,Math.PI/2+i*slot+.045,slot-.09),material);segment.rotation.x=-Math.PI/2;chargeRing.add(segment);chargeSegments.push(segment);}
}
function updateChargeRing(){
 if(!chargeSegments.length)createChargeRing();
 const charge=state.charge??0,ready=charge>=6,pulse=ready?1+Math.sin(performance.now()*.012)*.08:1;
 chargeRing.position.set(player.x,world.heightAt(player.x,player.z)+(ready?.11:.09),player.z);
 chargeSegments.forEach((segment,index)=>{const active=index<charge;segment.material.color.setHex(active?0xe2a7ff:0x634378);segment.material.opacity=active?1:.65;segment.scale.setScalar(pulse);});
 $('chargeText').innerHTML=ready?'感染炮弹 <b>下一发就绪</b>':`感染炮弹蓄力 <b>${charge} / 6</b>`;
 $('chargeText').classList.toggle('ready',ready);
}
// 光环特效：贴图取自 Realistic Mesh FX 的光点图，叠加混合。
const awakenGlow=new T.TextureLoader().load(new URL('./assets/vfx/glow.webp',import.meta.url).href);
// 感染统一走 Galaxy；主角升级=黄，场景道具=绿。
const smokeTexture=new T.TextureLoader().load(new URL('./assets/vfx/smoke.webp',import.meta.url).href);
smokeTexture.colorSpace=T.SRGBColorSpace;
// Galaxy 是一团絮状紫烟而非球体：从 8x8 烟雾图集随机取帧，用多张大号 billboard 叠出云团。
const GALAXY_MOTE_COLORS=[0xffffff,0xffd9f5,0xffe066,0x9be7ff];
function makeSmokeSprite(tint,size,opacity){
 const t=smokeTexture.clone();t.repeat.set(1/8,1/8);
 const frame=Math.floor(Math.random()*64);
 t.offset.set((frame%8)/8,1-(Math.floor(frame/8)+1)/8);t.needsUpdate=true;
 // 叠加混合：贴图暗部不加光，天然不留黑块，再乘 HDR 才有发光感。
 const s=new T.Sprite(new T.SpriteMaterial({map:t,color:tint,transparent:true,depthWrite:false,opacity}));
 s.scale.set(size,size,1);
 return s;
}
const galaxyAura={core:0xe83cff,mote:0xffffff,galaxy:true,smokes:9,coreSize:1,moteSize:.2,radius:.54};
// 觉醒市民使用 Galaxy 紫烟；被感染的秩序单位保留 Bloodlust 红光，远处也能辨认来源阵营。
const bloodlustAura={core:0xff293d,mote:0xff9275,coreSize:1.35,moteSize:.3,radius:.46,spin:2.4,count:8};
const AURA_COLORS={worker:galaxyAura,guard:bloodlustAura,level:{core:0xffc92e,mote:0xffe066},pickup:{core:0x2fd15a,mote:0x8dffab}};
const activeAuras=[];
function makeAura(holder,palette,{coreSize=(palette.coreSize??1.7)*FX_SCALE,moteSize=(palette.moteSize??.44)*FX_SCALE,count=palette.count??5,radius=(palette.radius??.3)*FX_SCALE,life=0}={}){
 const g=new T.Group();
 const sprite=(size,color,opacity,map)=>{const s=new T.Sprite(new T.SpriteMaterial({map:map??awakenGlow,color,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity}));s.scale.set(size,size,1);g.add(s);return s;};
 const smokes=[];
 if(palette.galaxy){for(let i=0;i<palette.smokes;i++){const size=coreSize*(.72+Math.random()*.72);const s=makeSmokeSprite(i%3?palette.core:0xf47dff,size,.24+Math.random()*.16);s.material.blending=T.AdditiveBlending;s.material.color.multiplyScalar(2.4);const glow=makeSmokeSprite(i%3?palette.core:0xf47dff,.78,.28);glow.material.blending=T.AdditiveBlending;glow.material.color.multiplyScalar(3.4);s.add(glow);const ang=Math.random()*6.283,rad=.15+Math.random()*.25;s.position.set(Math.cos(ang)*rad,(.35+Math.random()*1.5)*FX_SCALE,Math.sin(ang)*rad);s.material.rotation=Math.random()*6.283;s.userData={angle:ang,radius:rad,baseY:s.position.y,spin:(Math.random()<.5?-1:1)*(.2+Math.random()*.45),turn:(Math.random()<.5?-1:1)*(.15+Math.random()*.3),size,pulse:1+Math.random()*.8,phase:Math.random()*6.283};g.add(s);smokes.push(s);}}
 const core=sprite(coreSize,palette.core,.42,palette.coreMap);if(palette.galaxy)core.material.color.multiplyScalar(3);
 const motes=[];
 for(let i=0;i<count;i++){const m=sprite(moteSize,palette.mote,.9,palette.map);if(palette.moteAspect)m.scale.set(moteSize*palette.moteAspect[0],moteSize*palette.moteAspect[1],1);if(palette.galaxy){m.material.color.setHex(GALAXY_MOTE_COLORS[i%GALAXY_MOTE_COLORS.length]);m.material.color.multiplyScalar(2.4);}m.userData={angle:(i/count)*6.283+Math.random(),radius:radius+Math.random()*.26,speed:.8+Math.random()*.9,phase:Math.random(),turn:Math.random()*6.283};motes.push(m);}
 holder.add(g);
 const aura={g,core,motes,smokes,time:0,life,coreSize,spin:palette.spin??0};
 activeAuras.push(aura);
 return aura;
}
function updateAura(aura,dt){
 aura.time+=dt;
 const pulse=1+.14*Math.sin(aura.time*6.5),s=aura.coreSize*pulse;
 aura.core.scale.set(s,s,1);
 aura.core.material.opacity=.34+.12*Math.sin(aura.time*6.5);
 for(const m of aura.motes){const d=m.userData;d.angle+=dt*d.speed*2.2;const rise=(d.phase+aura.time*.5)%1.25;const y=rise*FX_SCALE;m.position.set(Math.cos(d.angle)*d.radius,y+.05*FX_SCALE,Math.sin(d.angle)*d.radius);m.material.opacity=.9*Math.max(0,1-rise/1.3);if(aura.spin){d.turn+=dt*aura.spin;m.material.rotation=Math.sin(d.turn)*.32;}}
 for(const s of aura.smokes||[]){const d=s.userData;d.angle+=dt*d.spin*.5;s.position.x=Math.cos(d.angle)*d.radius;s.position.z=Math.sin(d.angle)*d.radius;s.position.y=d.baseY+Math.sin(aura.time*d.pulse+d.phase)*.18;s.material.rotation+=dt*d.turn;const sc=d.size*(1+.14*Math.sin(aura.time*1.6+d.phase));s.scale.set(sc,sc,1);}
}
function removeAura(aura){
 const i=activeAuras.indexOf(aura);if(i>=0)activeAuras.splice(i,1);
 aura.g.parent?.remove(aura.g);
 aura.g.traverse(o=>{o.material?.dispose?.();});
}
function updateAuras(dt){
 for(let i=activeAuras.length-1;i>=0;i--){
  const a=activeAuras[i];
  if(a.life>0){a.life-=dt;if(a.life<=0){removeAura(a);continue;}}
  if(a.g.visible===false)continue;
  updateAura(a,dt);
 }
}
function applyQuality(){renderer.setPixelRatio(settings.quality==='low'?1:Math.min(devicePixelRatio,1.5));sun.castShadow=settings.quality!=='low';renderer.shadowMap.enabled=settings.quality!=='low';renderer.setSize(innerWidth,innerHeight);}
applyQuality();function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
const particlesGeometry=new T.BoxGeometry(.12,.12,.12),particleMaterials=new Map();
function burst(x,y,z,color,count=10){if(particles.length>220)return;let mat=particleMaterials.get(color);if(!mat){mat=new T.MeshBasicMaterial({color});particleMaterials.set(color,mat);}for(let i=0;i<count;i++){const m=new T.Mesh(particlesGeometry,mat);m.position.set(x,y,z);m.scale.setScalar(.8+Math.random()*1.5);scene.add(m);particles.push({m,v:new T.Vector3((Math.random()-.5)*5,Math.random()*4+1,(Math.random()-.5)*5),life:.4+Math.random()*.6});}}
function wave(x,z,r,color=0xb473ec){const m=new T.Mesh(new T.RingGeometry(.92,1,40),new T.MeshBasicMaterial({color,transparent:true,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,.15,z);scene.add(m);waves.push({m,r,t:0});}
function aura(key,x,z,r,color){let a=auraVisuals.get(key);if(!a){const pts=[];for(let i=0;i<64;i+=2){pts.push(new T.Vector3(Math.cos(i/64*Math.PI*2),0,Math.sin(i/64*Math.PI*2)),new T.Vector3(Math.cos((i+1)/64*Math.PI*2),0,Math.sin((i+1)/64*Math.PI*2)));}a=new T.LineSegments(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color,transparent:true,opacity:.7}));scene.add(a);auraVisuals.set(key,a);}a.position.set(x,.12,z);a.scale.set(r,1,r);a.material.color.setHex(color);a.visible=true;return a;}
function toast(text,duration=3){$('toast').textContent=text;$('toast').style.opacity=1;toastTime=duration;}
function finishTutorial(skipped=false){
 if(skipped)skipTutorial(state);
 $('tutorialCard').hidden=true;tutorialFinishTimer=skipped?.15:1.2;toast(skipped?'已跳过教学 · 主线任务已开启':'新手引导完成 · 第一个主线任务已开启',2);music.effect('upgrade');
}
function tutorialAction(action,amount=1){
 const before=state.tutorialStep,result=recordTutorialAction(state,action,amount);
 if(!result.changed)return;
 if(result.completed){finishTutorial();return;}
 if(result.advanced&&state.tutorialStep!==before){toast(`教学完成 · ${TUTORIAL_STEPS[before].title}`,1);music.effect('chargeTick',Math.min(6,state.tutorialStep));}
 updateTutorialCard();
}
function updateTutorialCard(){
 const step=tutorialStep(state),card=$('tutorialCard');card.hidden=!step||!['playing','paused'].includes(mode);if(!step)return;
 $('tutorialCount').textContent=`${state.tutorialStep+1} / ${TUTORIAL_STEPS.length}`;$('tutorialKey').textContent=step.key;$('tutorialTitle').textContent=step.title;$('tutorialDetail').textContent=step.detail;card.style.setProperty('--tutorial-progress',`${Math.min(100,(state.tutorialValue??0)/step.target*100)}%`);
}
function showPoliceAlert(title,detail,level=state.alert,upgrade=false){
 // 全屏警戒只承担重大警力变化，普通战斗信息仍使用小提示，避免画面持续被遮挡。
 const alert=$('policeAlert');alert.innerHTML=`<strong>${['','I','II','III'][level]||'!'}</strong><b>${title}</b><small>${detail}</small>`;alert.classList.remove('active','upgrade');void alert.offsetWidth;alert.classList.toggle('upgrade',upgrade);alert.classList.add('active');policeAlertTimer=2.1;music.effect(upgrade?'alertUp':'police');
}
function showDamageFeedback(cameraShake=.18){
 // 每一种受伤来源都走同一个入口，保证红屏、震动和声音不会有的出现、有的漏掉。
 damageFlash=.55;shake=Math.max(shake,cameraShake);
}
function unitName(u){return u.type===0?PROFESSIONS[u.profession]:ENEMIES[u.type].name;}
function showInfectionHit(u){
 // 普通命中要轻而快：目标冒紫光、脚下扩散小圆环，同时准星和音效给出确认。
 burst(u.x,STANDING_CHEST,u.z,0xb86fff,8);wave(u.x,u.z,.55,0xb86fff);hitMarkerTimer=.18;music.effect('hit');
}
function showConversionFeedback(events){
 // 中央只奖励玩家用注射枪主动完成的感染，间接感染不会抢走瞄准区域。
 const names=events.map(event=>event.name),count=events.length,detail=count===1?`${names[0]} 已加入群落`:`${count} 人加入反抗群落`;
 $('infectionFeedback').innerHTML=`<span class="infectionSeal"><i>☣</i></span><b>感染成功${count>1?` ×${count}`:''}</b><small>${detail}</small>`;
 conversionTimer=.9;music.effect('convert');
}
function addInfectionFeed(text){
 // 侧边最多保留五条记录，旧消息自动淡出，避免间接感染大量发生时刷满屏幕。
 const item=document.createElement('div');item.textContent=text;$('infectionFeed').prepend(item);
 while($('infectionFeed').children.length>5)$('infectionFeed').lastElementChild.remove();
 setTimeout(()=>item.remove(),4200);
}
function actorVisual(u){const visualKind=u.type===0?(u.kind==='ally'?'ally':'human'):'guard',v=createCharacterVisual(assets,visualKind,u.profession);v.holder.position.set(u.x,world.heightAt(u.x,u.z),u.z);v.holder.rotation.y=Math.random()*6.28;scene.add(v.holder);visuals.set(u.id,{v,oldKind:u.kind});return v;}
function chooseWanderTarget(u,radius=10,random=Math.random){
 // 只选择视线可达的空地，NPC 就不会隔着一栋楼盯着目标点持续撞墙。
 for(let attempt=0;attempt<12;attempt++){const angle=random()*Math.PI*2,distance=3+random()*radius,x=u.x+Math.cos(angle)*distance,z=u.z+Math.sin(angle)*distance;if(world.free(x,z,.4)&&world.clear(u,{x,z},.35)){u.tx=x;u.tz=z;u.wander=2+random()*4;return;}}
 u.tx=u.x;u.tz=u.z;u.wander=.5;
}
function initUnits(){
 let rng=7142;const random=()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296;},occupied=[];units=[];
 const placeInZone=(zone,radius=.55)=>{for(let attempt=0;attempt<80;attempt++){const angle=random()*Math.PI*2,spread=1.5+random()*5,q=world.nearest(zone[0]+Math.cos(angle)*spread,zone[1]+Math.sin(angle)*spread,radius);if(Math.hypot(q.x-zone[0],q.z-zone[1])>10||occupied.some(p=>Math.hypot(p.x-q.x,p.z-q.z)<1.5))continue;occupied.push(q);return q;}throw Error(`无法在街区 ${zone.join(',')} 放置角色`);};
 // 这些中心点已经用地形数据验证过；每个街区分散四人，落点还会再次经过建筑碰撞检查。
 const citizenZones=[[-15.5,32],[-31.3,41],[-37.5,25.7],[-29.6,12],[-37.5,-8],[-34.1,-25.9],[18.7,41],[35.5,33],[26.8,13.5],[37.5,-3.3],[34.4,-27],[43,-43]];
 for(let i=0;i<48;i++){const point=placeInZone(citizenZones[i%citizenZones.length]),citizen=makeUnit(i,0,point.x,point.z,true,i%5);chooseWanderTarget(citizen,9,random);citizen.wander=0;units.push(citizen);}
 const guardZones=[[-34,31],[25.7,39.5],[-34,12],[34,8],[-34,-30.3],[34,-33],[-13,-52],[15.5,-49.8],[42.4,13.5],[-44,13.5]];guardZones.forEach((zone,i)=>{const q=placeInZone(zone,.7),unit=makeUnit(48+i,i<6?1:i<8?2:4,q.x,q.z,true,i%5);chooseWanderTarget(unit,7,random);units.push(unit);});units.forEach(u=>{const v=actorVisual(u);v.holder.visible=distance(player,u)<38;});
}
function move(u,dx,dz,detour=false){
 const ox=u.x,oz=u.z,length=Math.hypot(dx,dz);if(length<.0001)return false;
 const canStep=(sx,sz)=>{const nextX=u.x+sx,nextZ=u.z+sz,nextHeight=world.heightAt(nextX,nextZ),currentHeight=world.heightAt(u.x,u.z),touchingBridge=bridgeDeckHeight(u.x,u.z)!==null||bridgeDeckHeight(nextX,nextZ)!==null,maxStep=touchingBridge ? .95 : .55;return nextHeight>-2&&Math.abs(nextHeight-currentHeight)<maxStep&&world.free(u.x+sx*.5,u.z+sz*.5,.34)&&world.free(nextX,nextZ,.34);};
 // 正面受阻时依次尝试左右 45° 和 90°，而不是原地对着墙播放走路动画。
 const angles=detour?[0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2]:[0];for(const angle of angles){const c=Math.cos(angle),s=Math.sin(angle),sx=dx*c-dz*s,sz=dx*s+dz*c;if(!canStep(sx,sz))continue;u.x+=sx;u.z+=sz;break;}
 // 玩家贴墙斜走时允许沿未被挡住的轴滑动，手感不会突然卡死。
 if(!detour&&u.x===ox&&u.z===oz){if(canStep(dx,0))u.x+=dx;else if(canStep(0,dz))u.z+=dz;}
 return Math.hypot(u.x-ox,u.z-oz)>.001;
}
function forward(){return {x:Math.sin(yaw),z:Math.cos(yaw)};}
function nearestMissionTarget(items){return items.filter(item=>item&&!item.dead).sort((a,b)=>distance(player,a)-distance(player,b))[0]??null;}
function selectMissionTarget(){
 const tutorial=tutorialStep(state);if(tutorial)return ['shoot','hit','infect'].includes(tutorial.action)?nearestMissionTarget(units.filter(unit=>unit.type===0&&!unit.converted&&unit.kind!=='corpse')):null;
 const view=missionView(state);if(!view)return null;const next=view.objectives.find(item=>!item.done);if(!next)return null;
 if(next.targetKind==='human')return nearestMissionTarget(units.filter(unit=>unit.type===0&&!unit.converted&&unit.kind!=='corpse'));
 if(next.targetKind==='tower')return nearestMissionTarget(world.towers.filter(tower=>!tower.dead));
 if(next.targetKind==='purifier')return nearestMissionTarget(units.filter(unit=>unit.type===4&&!unit.converted&&unit.kind!=='corpse'))||nearestMissionTarget(world.towers.filter(tower=>!tower.dead));
 if(next.targetKind==='boss')return boss.active&&!boss.dead?boss:null;
 return null;
}
function updateMissionGuidance(){
 missionTarget=selectMissionTarget();missionBeacon.visible=!!missionTarget;if(!missionTarget){$('objectiveDistance').textContent='';return;}
 const ground=world.heightAt(missionTarget.x,missionTarget.z),pulse=1+Math.sin(performance.now()*.006)*.15;missionBeacon.position.set(missionTarget.x,ground+.08,missionTarget.z);beaconRing.scale.setScalar(pulse);beaconBeam.material.opacity=.22+(pulse-1)*.5;$('objectiveDistance').textContent=`◆ 目标距离 ${Math.ceil(distance(player,missionTarget))} 米`;
}
function drawMissionMapMarker(){if(!missionTarget)return;const ctx=$('map').getContext('2d'),x=(missionTarget.x+66)/132*200,z=160-(missionTarget.z+66)/132*160;ctx.save();ctx.translate(x,z);ctx.rotate(Math.PI/4);ctx.fillStyle='#f0b6ff';ctx.shadowColor='#c56cff';ctx.shadowBlur=7;ctx.fillRect(-4,-4,8,8);ctx.restore();}
function acquire(range=3.1){let best=null,score=-Infinity;const f=forward();for(const u of units){if(u.dead||u.converted||u.kind==='corpse')continue;const d=distance(player,u);if(d>range||!world.clear(player,u))continue;const dot=((u.x-player.x)*f.x+(u.z-player.z)*f.z)/(d||1);if(dot<.3)continue;const value=dot*4-d/range;if(value>score){score=value;best=u;}}return best;}
function applyHit(u,inf,damage,source='indirect'){const result=hit(state,u,inf,damage),landed=result!=='none';const activeWeapon=source==='syringe'||source==='power';if(source==='syringe'&&landed){tutorialAction('hit');const before=state.charge??0;state.charge=Math.min(6,before+1);if(before<6){music.effect('chargeTick',state.charge);if(state.charge===6){toast('六段充能完成 · 下一发触发觉醒冲击波',2);music.effect('chargeReady');}}}if(result==='converted'){if(activeWeapon)tutorialAction('infect');pendingConversions.push({name:unitName(u),central:activeWeapon});burst(u.x,STANDING_CHEST,u.z,0xc781ff,18);wave(u.x,u.z,.9,0xc781ff);}else if(result==='hit'&&source==='syringe')showInfectionHit(u);else if(result==='hit'&&activeWeapon)burst(u.x,STANDING_CHEST,u.z,0xb86fff,6);else if(result==='hit')burst(u.x,STANDING_CHEST,u.z,0xebc5a6,4);else if(result==='killed'&&u.type>0)spawnPickup(u.x,u.z);return result;}
function releasePowerWave(x,z){
 // 满六段后的针弹在落点爆发，范围内每个目标只结算一次，并且不会反过来给自己充能。
 wave(x,z,7.5,0xe2a0ff);wave(x,z,5.5,0xb94fff);wave(x,z,3.4,0xf0c8ff);burst(x,STANDING_CHEST,z,0xe4adff,75);world.breakAt(x,z,5.5,110,burst,world.heightAt(x,z)+.7);
 // 两层发光球配合三道地面冲击环，让强力炮弹与普通命中特效完全区分开。
 for(const [radius,color,opacity]of[[5.2,0xc75cff,.72],[3.8,0xf0c5ff,.5]]){const blast=new T.Mesh(new T.SphereGeometry(1,20,14),new T.MeshBasicMaterial({color,transparent:true,opacity,wireframe:true,blending:T.AdditiveBlending,depthWrite:false}));blast.position.set(x,world.heightAt(x,z)+.55,z);scene.add(blast);waves.push({m:blast,r:radius,t:0});}
 if(Math.hypot(player.x-x,player.z-z)<15)shake=Math.max(shake,.2);
 for(const u of units)if(!u.dead&&!u.converted&&u.kind!=='corpse'&&Math.hypot(u.x-x,u.z-z)<=6)applyHit(u,45,10,'power');
 music.effect('powerImpact');
}
function createPowerOrb(x,y,z){
 // 强力攻击改成有体积的发光炮弹，不再沿用普通针弹的小方块外观。
 const material=new T.MeshStandardMaterial({color:0xdca0ff,emissive:0x9d32e8,emissiveIntensity:3,roughness:.25});
 const orb=new T.Mesh(new T.IcosahedronGeometry(.38,1),material);orb.position.set(x,y,z);orb.castShadow=true;
 const light=new T.PointLight(0xc06fff,2.5,4);orb.add(light);scene.add(orb);return orb;
}
function detonatePowerShot(projectile){
 if(!projectile.strong)return false;
 projectile.strong=false;releasePowerWave(projectile.x,projectile.z);return true;
}
function updatePowerShot(projectile,dt){
 const oldX=projectile.x,oldZ=projectile.z;projectile.x+=projectile.vx*dt;projectile.z+=projectile.vz*dt;projectile.vy-=8.5*dt;projectile.y+=projectile.vy*dt;
 projectile.m.rotation.x+=dt*5;projectile.m.rotation.z+=dt*7;projectile.trail-=dt;
 if(projectile.trail<=0){burst(projectile.x,projectile.y,projectile.z,0xc66fff,2);projectile.trail=.07;}
 // 撞到建筑会弹开；一旦真正碰到可行走地面就立刻爆炸。
 if(world.solid(projectile.x,projectile.z,.2)){projectile.x=oldX;projectile.z=oldZ;projectile.vx*=-.28;projectile.vz*=-.28;projectile.vy=Math.max(1.2,projectile.vy*.35);music.effect('powerBounce');}
 const ground=world.heightAt(projectile.x,projectile.z);
 if(projectile.vy<=0&&ground>-2&&projectile.y<=ground+.38){projectile.y=ground+.38;detonatePowerShot(projectile);projectile.life=0;}
 projectile.m.position.set(projectile.x,projectile.y,projectile.z);
}
function raiseAlarm(){if(alerted||!state.tutorialDone)return;alerted=true;reinforceTimer=0;spawnReinforcement();reinforceTimer=12;toast('感染行为暴露 · 东侧增援立即进入',3);}
// 场景可捡道具：绿色医疗血包，出现到被拾取为止。
const pickups=[],crossBarGeometry=new T.BoxGeometry(1,1,1);
// 立体十字：一竖一横两根长方体拼成加号，不再是一个贴了十字的箱子。
function spawnPickup(x,z){
 if(pickups.length>=8)return;
 const body=new T.Group();body.position.set(x,world.heightAt(x,z)+.45*FX_SCALE,z);
 const mat=new T.MeshStandardMaterial({color:0x2fd15a,emissive:0x1b8f36,emissiveIntensity:.85,roughness:.3});
 const vBar=new T.Mesh(crossBarGeometry,mat);vBar.scale.set(.15*FX_SCALE,.5*FX_SCALE,.15*FX_SCALE);body.add(vBar);
 const hBar=new T.Mesh(crossBarGeometry,mat);hBar.scale.set(.5*FX_SCALE,.15*FX_SCALE,.15*FX_SCALE);body.add(hBar);
 body.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 scene.add(body);
 pickups.push({m:body,aura:makeAura(body,AURA_COLORS.pickup,{coreSize:1.1,moteSize:.26,radius:.42}),x,z,phase:Math.random()*6.283});
}
function scatterPickups(){for(let i=0;i<6;i++){let x=0,z=0;for(let t=0;t<60;t++){x=(Math.random()-.5)*104;z=(Math.random()-.5)*104;if(world.free(x,z,1))break;}spawnPickup(x,z);}}
function updatePickups(dt){
 for(let i=pickups.length-1;i>=0;i--){
  const p=pickups[i];
  p.phase+=dt*2.2;p.m.rotation.y+=dt*1.5;p.m.position.y=world.heightAt(p.x,p.z)+(.45+Math.sin(p.phase)*.09)*FX_SCALE;
  if(distance(player,p)<1.5){removeAura(p.aura);scene.remove(p.m);pickups.splice(i,1);const healed=Math.min(25,state.maxHp-state.hp);state.hp+=healed;toast(healed>0?`拾取医疗血包 · 生命 +${healed}`:'拾取医疗血包 · 生命已满',1.6);music.effect('upgrade');}
 }
}
function primary(){if(mode!=='playing'||attackCd>0||switchTime>0||reloadTime>0||player.roll>0)return;raiseAlarm();playerVisual.holder.rotation.y=yaw;const f=forward();
 if(state.weapon<0){attackCd=.58*cooldownScale(state);playCharacterAttack(playerVisual,'infect');const u=acquire(2.8);if(u)applyHit(u,20,18,'melee');else world.breakAt(player.x+f.x*1.6,player.z+f.z*1.6,1.8,50,burst,world.heightAt(player.x,player.z)+STANDING_CHEST);if(boss.active&&!boss.dead&&distance(player,boss)<5)hitBoss(boss,75);music.effect('attack');}
 else {if(state.clip<=0){reloadGun();return;}state.clip--;tutorialAction('shoot');attackCd=.42*cooldownScale(state);playCharacterAttack(playerVisual,'shoot');weaponPivot.position.y-=.05;const strong=(state.charge??0)>=6;if(strong)state.charge=0;const u=acquire(24),end=u?{x:u.x,z:u.z}: {x:player.x+f.x*24,z:player.z+f.z*24};const d=Math.hypot(end.x-player.x,end.z-player.z)||1,speed=strong?14:32;const shotHeight=player.crouch?CROUCH_CHEST:STANDING_CHEST,shotY=world.heightAt(player.x,player.z)+player.y+shotHeight;const m=strong?createPowerOrb(player.x,shotY,player.z):block(scene,.1,.1,.7,0xc078ff,player.x,shotY,player.z);tracers.push({m,x:player.x,z:player.z,y:m.position.y,vy:strong?4.8:0,vx:(end.x-player.x)/d*speed,vz:(end.z-player.z)/d*speed,life:strong?4:.8,friendly:true,strong,isPower:strong,trail:0,damage:4});burst(player.x+f.x,player.y+shotHeight,player.z+f.z,strong?0xe4adff:0xba63ff,strong?22:10);music.effect(strong?'powerThrow':'shoot');}}
function reloadGun(){if(reloadTime||switchTime||state.weapon<0||state.clip>=state.clipMax)return;if(state.ammo[0]<=0){toast('针剂耗尽 · 徒手击败秩序单位或完成任务补充');return;}reloadDuration=state.abilities.guns>=2?1.1:1.5;reloadTime=reloadDuration;}
function updateReloadIndicator(){
 const indicator=$('reloadIndicator'),active=reloadTime>0;indicator.classList.toggle('active',active);
 if(!active)return;
 indicator.querySelector('b').textContent=`${reloadTime.toFixed(1)}s`;
 indicator.querySelector('i').style.setProperty('--reload',`${(1-reloadTime/reloadDuration)*100}%`);
}
function rush(){if(mode!=='playing'||rushCd>0||player.roll>0||player.y>.1)return;const dx=(keys.KeyD?1:0)-(keys.KeyA?1:0),fw=(keys.KeyW?1:0)-(keys.KeyS?1:0),f=forward(),len=Math.hypot(dx,fw);player.rollX=len?(-Math.cos(yaw)*dx+f.x*fw)/len:f.x;player.rollZ=len?(Math.sin(yaw)*dx+f.z*fw)/len:f.z;player.roll=ROLL_DURATION;player.crouch=false;rushCd=2*cooldownScale(state);tutorialAction('roll');playCharacterAttack(playerVisual,'rush');music.effect('roll');}
function weaponSelect(index){if(switchTime||index===state.weapon)return;nextWeapon=index;switchTime=.4;attackCd=Math.max(attackCd,.4);toast(index<0?'切换 · 徒手':'切换 · 终末注射枪',.7);}
const keys={};addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(mode==='tasks'&&(e.code==='KeyM'||e.code==='Escape')){closeTaskLog();return;}if(mode==='upgrade'&&/^Digit[123]$/.test(e.code)){selectChoice(Number(e.code.slice(-1))-1);return;}if(e.code==='KeyM'&&mode==='playing'){showTaskLog();return;}if(e.code==='Escape'||e.code==='KeyP'){togglePause();return;}if(mode!=='playing')return;if(e.code==='KeyJ')primary();if(e.code==='Digit1')weaponSelect(-1);if(e.code==='Digit2')weaponSelect(0);if(e.code==='ShiftLeft'||e.code==='ShiftRight')rush();if(e.code==='Space'&&player.y<=.01&&player.roll<=0){player.crouch=false;player.vy=7;tutorialAction('jump');music.effect('jump');}if(e.code==='KeyC'&&player.roll<=0)player.crouch=!player.crouch;if(e.code==='KeyR'){if(squadIds.size){squadIds.clear();toast('群落已解散 · 自主行动');}else{units.filter(u=>u.converted&&!u.dead&&distance(player,u)<18).sort((a,b)=>distance(player,a)-distance(player,b)).slice(0,6).forEach(u=>squadIds.add(u.id));toast('已召集 '+squadIds.size+' 名同伴');}}if(e.code==='KeyE')reloadGun();if(e.code==='Tab'&&state.tutorialDone&&state.pending)chooseUpgrade();});addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;if(e.button===0){mouseHeld=true;primary();if(!document.pointerLockElement)canvas.requestPointerLock?.()?.catch?.(()=>{});}else{dragging=true;lastMouse={x:e.clientX,y:e.clientY};}});addEventListener('pointerup',()=>{mouseHeld=false;dragging=false;});addEventListener('pointermove',e=>{if(mode!=='playing')return;let dx=0,dy=0;if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}else if(dragging&&lastMouse){dx=e.clientX-lastMouse.x;dy=e.clientY-lastMouse.y;lastMouse={x:e.clientX,y:e.clientY};}if(dx||dy)tutorialAction('look',Math.abs(dx)+Math.abs(dy));yaw-=dx*.0025*settings.sensitivity;pitch=T.MathUtils.clamp(pitch+dy*.0018*settings.sensitivity,-.25,.55);});canvas.addEventListener('wheel',e=>{e.preventDefault();cameraDistance=T.MathUtils.clamp(cameraDistance+e.deltaY*.003,1.9,4.5);},{passive:false});document.addEventListener('pointerlockerror',()=>toast('拖动右键可旋转视角，J 键感染',2));
function clearInput(){mouseHeld=false;dragging=false;Object.keys(keys).forEach(k=>keys[k]=false);document.exitPointerLock?.();}
addEventListener('blur',()=>{clearInput();if(mode==='playing')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')togglePause();});
function showDialog(html){$('dialog').innerHTML=html;$('modal').hidden=false;clearInput();}
function hideDialog(){ $('modal').hidden=true; }
function showTaskLog(){
 if(mode!=='playing')return;mode='tasks';music.pause();
 const entries=MISSIONS.map((mission,index)=>{const view=missionView(state,index),status=index<state.mission?'completed':index===state.mission?'current':'locked',objectives=view.objectives.map(item=>`<span class="${item.done?'done':''}">${item.done?'✓':'○'} ${item.label}　${item.value} / ${item.target}</span>`).join('');return `<article class="missionEntry ${status}"><small>主线 ${String(index+1).padStart(2,'0')} · ${status==='completed'?'已完成':status==='current'?'进行中':'未解锁'}</small><strong>${mission.title}</strong><p>${mission.description}</p><div>${objectives}</div></article>`;}).join('');
 showDialog(`<div class="eyebrow">MISSION LOG / 主线任务</div><h2>让东京，一步步醒来。</h2><div class="missionList">${entries}</div><button class="action" id="closeTasks">返回游戏　M</button>`);$('closeTasks').onclick=closeTaskLog;
}
function closeTaskLog(){if(mode!=='tasks')return;hideDialog();mode='playing';music.resume();}
function selectChoice(index){const a=choiceSet[index];if(!a||mode!=='upgrade')return;if(!upgrade(state,a.id))return;if(playerVisual)makeAura(playerVisual.holder,AURA_COLORS.level,{coreSize:2.3,moteSize:.52,radius:.46,life:1});music.effect('upgrade');hideDialog();mode='playing';music.resume();toast(`获得 ${a.name} Lv.${state.abilities[a.id]}`,2);saveRun();}
function chooseUpgrade(){mode='upgrade';music.pause();choiceSet=choices(state);if(!choiceSet.length){state.pending=0;mode='playing';music.resume();return;}showDialog(`<div class="eyebrow">GENETIC RECOMBINATION / LV.${state.level}</div><h2>${state.history.length?'反抗，正在进化。':'选择你的第一种变异。'}</h2><p>战场已暂停：单位、尸体、感染与增援计时全部冻结。<br>五种能力，各三级。按 1 / 2 / 3 直接选择，选完立即继续。母体固定 100 生命。</p><div class="cards">${choiceSet.map((a,i)=>`<button class="card" data-choice="${i}"><kbd>${i+1}</kbd><span class="type">${a.group} / ${state.abilities[a.id]?'强化能力':'新能力'}</span><span class="icon">${a.icon}</span><strong>${a.name}</strong><em>Lv.${state.abilities[a.id]} → Lv.${state.abilities[a.id]+1}</em><small>${a.descriptions[state.abilities[a.id]]}</small></button>`).join('')}</div>`);document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>selectChoice(+b.dataset.choice));}
function saveRun(){if(import.meta.env.DEV&&new URLSearchParams(location.search).has('test'))return;if(!assets||['loading','menu','ended','won'].includes(mode)||boss.active)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:SAVE_VERSION,state,units,player,yaw,pitch,cameraDistance,attackCd,breakCd,rushCd,reinforceTimer,reinforceDirection,totalReinforcements,alerted,objects:world.destructibles.map(o=>({hp:o.hp,dead:o.dead,removed:o.removed?[...o.removed]:[]}))}));}catch{}}
function loadSaved(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s?.version===SAVE_VERSION&&s.state?.hp>0&&s.units?.length?s:null;}catch{return null;}}
function restore(saved){state=saved.state;state.charge??=0;lastHp=state.hp;units=saved.units;player=saved.player;yaw=saved.yaw;pitch=saved.pitch;
// 旧存档可能保存了适配大人物的远镜头，读取时限制到新的越肩范围。
cameraDistance=T.MathUtils.clamp(saved.cameraDistance??2.7,1.9,4.5);attackCd=saved.attackCd;breakCd=saved.breakCd;rushCd=saved.rushCd;reinforceTimer=saved.reinforceTimer;reinforceDirection=saved.reinforceDirection;totalReinforcements=saved.totalReinforcements;alerted=saved.alerted;for(const a of visuals.values())scene.remove(a.v.holder);visuals.clear();units.forEach(actorVisual);saved.objects.forEach((o,i)=>{const w=world.destructibles[i];w.hp=o.hp;w.dead=o.dead;w.g.visible=!o.dead;if(w.instances){const d=new T.Object3D();d.scale.setScalar(0);d.updateMatrix();for(const ix of o.removed){w.removed.add(ix);w.instances.setMatrixAt(ix,d.matrix);}w.instances.instanceMatrix.needsUpdate=true;}});}
async function start(continuing=false){if(!assets)return;if(continuing){const s=loadSaved();if(s)restore(s);}else if(state.time>0){location.reload();return;}conversionCount=state.infected;await music.start();playerVisual.holder.rotation.y=yaw;document.body.classList.remove('menuMode');$('menu').hidden=true;$('hud').hidden=false;mode='playing';if(!state.tutorialDone){updateTutorialCard();toast('新手引导开始 · 跟随屏幕下方步骤行动',3);}else if(state.pending)chooseUpgrade();else toast('按 M 查看主线任务 · 跟随紫色目标标记行动',4);}
$('start').onclick=()=>start();$('continue').onclick=()=>start(true);
$('skipTutorial').onclick=()=>{if(!state.tutorialDone)finishTutorial(true);};$('taskLogButton').onclick=()=>showTaskLog();
function togglePause(){if(mode==='playing'){mode='paused';music.pause();saveRun();showDialog(`<div class="eyebrow">SIMULATION PAUSED</div><h2>东京，暂时静止。</h2><p>街区进度自动保存；Boss 战从进场前存档重试。所有战斗计时已暂停。</p><div class="controlTable">WASD 移动 · 鼠标或右键拖动转向<br>左键 / J 普通攻击 · 空格跳跃 · Shift 翻滚 · C 蹲伏<br>1 徒手 · 2 注射枪 · E 装填 · R 召集 / 解散<br>感染优先结算：感染值满的这一击不会造成伤害。<br>空气传播 Lv2 可转化尸体；净化士兵在 6 米内每秒清除 8 感染。</div><button class="action" id="resume">继续觉醒 ↗</button><button class="action secondary" id="pauseSettings">设置</button><button class="action secondary" id="endRun">结束并复盘</button>`);$('resume').onclick=togglePause;$('pauseSettings').onclick=()=>settingsDialog('paused');$('endRun').onclick=()=>finish('ended');}else if(mode==='paused'){hideDialog();mode='playing';music.resume();}}
$('pauseButton').onclick=togglePause;$('sound').onclick=()=>{$('sound').textContent='♫ 音乐 '+(music.toggle()?'开':'关');};
function settingsDialog(back='menu'){showDialog(`<div class="eyebrow">SETTINGS / 体验设置</div><h2>找到你的节奏。</h2><label class="setting">音乐与音效 <input id="volume" type="range" min="0" max="1" step=".05" value="${settings.volume}"></label><label class="setting">视角灵敏度 <input id="sensitivity" type="range" min=".4" max="2" step=".1" value="${settings.sensitivity}"></label><label class="setting">画质 <select id="quality"><option value="standard">标准 · 动态阴影</option><option value="low">流畅 · 关闭阴影</option></select></label><p>鼠标锁定不可用时，可拖动右键或使用方向键转动镜头。<br>本作采用越肩第三人称视角，滚轮调节跟随距离。</p><button class="action" id="closeSettings">返回</button>`);$('quality').value=settings.quality;const persist=()=>{try{localStorage.setItem('groundzero-settings',JSON.stringify(settings));}catch{}};$('volume').oninput=e=>{settings.volume=+e.target.value;music.setVolume(settings.volume);persist();};$('sensitivity').oninput=e=>{settings.sensitivity=+e.target.value;persist();};$('quality').onchange=e=>{settings.quality=e.target.value;applyQuality();persist();};$('closeSettings').onclick=()=>{hideDialog();if(back==='paused'){mode='playing';togglePause();}};}
$('settings').onclick=()=>settingsDialog();$('about').onclick=()=>{showDialog('<div class="eyebrow">TOKYO PLAYTEST / 02</div><h2>让全城加入反抗。</h2><p>感染 40 人、摧毁三座中枢、推翻巨大黄色 Boss，完成东京人觉醒。<br>感染造成累积进度，进度满时立即转化；血量归零则留下 12 秒尸体。<br>五类能力各三级，开局抽一次，升级继续三选一，Demo 等级上限 12。<br>摧毁橙色秩序中枢可以压制后续增援。徒手和注射枪均可破坏设施；击败秩序单位可补充针剂。<br>满血两颗普通枪弹致死。利用掩体、蹲伏、跳跃和翻滚生存。<br>职业服饰与体素城市为游戏化示意；建筑采用分块破坏与简化坍塌。</p><button class="action" id="closeAbout">知道了</button>');$('closeAbout').onclick=hideDialog;};
function formatTime(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');}
function showDefeat(){
 mode='ended';music.effect('defeat');music.pause();try{localStorage.removeItem(SAVE_KEY);}catch{}
 document.body.classList.add('defeated');
 showDialog(`<div class="eyebrow defeatEyebrow">SIMULATION FAILED / 觉醒失败</div><h2 class="defeatTitle">母体失去行动能力</h2><p>最后伤害：${state.lastDamage||'未知攻击'}<br>本局坚持 ${formatTime(state.time)}，累计感染 ${state.infected} 人。</p><div class="defeatHint">不要停在这里。调整路线，再让东京醒一次。</div><button class="action defeatRestart" id="again">重新开始本局 ↗</button><p class="restartHint">点击按钮后会清空本局进度并从开局重新开始。</p>`);
 $('again').onclick=()=>location.reload();
}
function finish(result){mode=result;music.pause();try{localStorage.removeItem(SAVE_KEY);}catch{}const pct=result==='won'?100:Math.min(99,Math.round(state.infected/40*100));showDialog(`<div class="eyebrow">${result==='won'?'CITY AWAKENED / 全城觉醒':'RUN COMPLETE / 本局复盘'}</div><h2>城市已感染 <span class="purple">${pct}%</span></h2><p>${result==='won'?'巨像倒下了。紫色觉醒波席卷街道：都给我醒过来！':'这一次的反抗，已经留下了痕迹。'}</p><div class="stats"><div><small>累计感染</small><strong>${state.infected}</strong></div><div><small>存活队伍</small><strong>${teamCount(units)}</strong></div><div><small>最高警戒</small><strong>${['','I','II','III'][state.peakAlert]}</strong></div><div><small>存活时长</small><strong>${formatTime(state.time)}</strong></div></div><div class="recap"><div><b>能力构筑轨迹 · LV.${state.level}</b>${state.history.map(h=>`<p>${formatTime(h.time)}　${ABILITIES.find(a=>a.id===h.id).name} ${h.level}/3</p>`).join('')||'<p>未选择能力</p>'}</div><div><b>关键战绩</b><p>最后受击：${state.lastDamage||'无'}</p>${(state.damageLog||[]).map(d=>`<p>${d.time.toFixed(1)}s ${d.source} −${d.damage} (${d.before}生命)</p>`).join('')}<p>首次转化：${state.first?state.first.name+' · '+formatTime(state.first.time):'尚未转化'}</p><p>最大同时转化：${state.maxChain} 人</p><p>净化士兵转化：${state.purifiers} 名</p><p>最高转化 / 击败等级：${state.highestEnemy}</p><p>中枢瓦解：${state.towers}/3 · 破坏物件 ${state.destroyed}</p><p>初始人口转化：${state.cityInfected}/${POPULATION}</p></div></div><button class="action" id="again">返回主菜单 / 重新开始 ↗</button>`);$('again').onclick=()=>location.reload();}
function spawnReinforcement(){if(state.towers===3||boss.active)return;const entries=world.entries;for(let i=0;i<4;i++){if(reinforceDirection===3||!world.towers[reinforceDirection]?.dead)break;reinforceDirection=(reinforceDirection+1)%4;}const p=entries[reinforceDirection],direction=['东侧','西侧','北侧','南侧'][reinforceDirection],types=state.alert===1?[1,2]:state.alert===2?[2,3,4]:[4,5,6];for(let i=0;i<types.length;i++){const u=makeUnit(100+totalReinforcements++,types[i],p[0]+(p[0]?0:(i-1)*2),p[1]+(p[1]?0:(i-1)*2),false,i%5);Object.assign(u,world.nearest(u.x,u.z));units.push(u);actorVisual(u);}toast(`${direction}增援进入 · ${ENEMIES[types.at(-1)].name}`,3);showPoliceAlert('警力进入街区',`${direction}增援抵达 · ${types.map(type=>ENEMIES[type].name).join(' / ')}`,state.alert);reinforceDirection=(reinforceDirection+1)%4;}
function runAI(dt){const living=units.filter(u=>!u.dead&&u.kind!=='corpse'),allies=living.filter(u=>u.converted),hostiles=living.filter(u=>!u.converted);for(const u of living){u.attackCd-=dt;u.hurt=Math.max(0,u.hurt-dt);for(const other of living){if(other.id>=u.id)continue;const gap=distance(u,other);if(gap>.01&&gap<.85){const push=(.85-gap)*dt*2;move(u,(u.x-other.x)/gap*push,(u.z-other.z)/gap*push);}}let tx=u.x,tz=u.z,pace=0;const d=distance(player,u);if(u.kind==='human'){u.wander-=dt;if(d<7&&state.infected>0){const len=d||1;tx=u.x+(u.x-player.x)/len*4;tz=u.z+(u.z-player.z)/len*4;pace=2.8;}else{if(u.wander<=0)chooseWanderTarget(u,8);tx=u.tx;tz=u.tz;pace=1;}}
else if(u.kind==='ally'){let victim=null,nearest=20;for(const h of hostiles){const dd=distance(u,h);if(dd<nearest&&world.clear(u,h)){nearest=dd;victim=h;}}if(victim){tx=victim.x;tz=victim.z;pace=3.7;if(nearest<2&&u.attackCd<=0){applyHit(victim,10,12);u.attackCd=1.3;const visual=visuals.get(u.id)?.v;if(visual)playCharacterAttack(visual,'infect');}}else{if(squadIds.has(u.id)){const angle=u.id*2.4;tx=player.x+Math.sin(angle)*3;tz=player.z+Math.cos(angle)*3;pace=4.3;}else if(boss.active&&!boss.dead){tx=boss.x+Math.sin(u.id)*4;tz=boss.z+Math.cos(u.id)*4;pace=3.2;if(distance(u,boss)<5.5)hitBoss(boss,dt*(u.profession===2?4:2));}else{const structure=world.towers.find(o=>!o.dead&&distance(u,o)<28);if(structure){tx=structure.x;tz=structure.z;pace=3;if(distance(u,structure)<3&&u.attackCd<=0){world.breakAt(u.x,u.z,2, u.profession===2?24:8,burst);u.attackCd=2;}}else{u.wander-=dt;if(u.wander<=0)chooseWanderTarget(u,12);tx=u.tx;tz=u.tz;pace=1.7;}}if(u.profession===1&&distance(u,player)<5&&u.attackCd<=0&&state.hp<100){state.hp=Math.min(100,state.hp+10);u.attackCd=25;toast('医生支援 +10',1);}}}
else{const detection=player.crouch?15*(1-state.abilities.vital*.1):27+state.alert*3,patrolling=(!alerted&&state.time<8)||d>detection;if(patrolling){u.aim=0;u.wander-=dt;if(u.wander<=0)chooseWanderTarget(u,10);tx=u.tx;tz=u.tz;pace=Math.max(.9,ENEMIES[u.type].speed*.32);}else{let victim=player,nearest=d;for(const a of allies){const dd=distance(u,a);if(dd<nearest){nearest=dd;victim=a;}}const spec=ENEMIES[u.type];tx=victim.x;tz=victim.z;pace=nearest>spec.range*.7?spec.speed:0;if(nearest<spec.range&&u.attackCd<=0&&world.clear(u,victim)){if(!u.aim){u.aim=.55;u.attackCd=.55;u.aimPoint={x:victim.x,z:victim.z,y:victim===player?world.heightAt(player.x,player.z)+player.y+(player.crouch?.6:1.2):world.heightAt(victim.x,victim.z)+1.2};continue;}u.aim=0;u.attackCd=u.type===5?.9:1.6;const visual=visuals.get(u.id)?.v;if(visual){visual.holder.rotation.y=Math.atan2(tx-u.x,tz-u.z);playCharacterAttack(visual,'infect');}if(spec.range>3){const aim=u.aimPoint||victim;const delta=new T.Vector3(aim.x-u.x,0,aim.z-u.z).normalize();const m=block(scene,.12,.12,.35,0xf4bc82,u.x,1.2,u.z);tracers.push({m,x:u.x,z:u.z,vx:delta.x*18,vz:delta.z*18,life:2,y:u.aimPoint?.y||1.2,damage:50,source:u.id});}else if(victim===player){if(invincible<=0){hurtMother(state,spec.damage,ENEMIES[u.type].name);invincible=.35;shake=.12;music.effect('hurt');}}else damageAlly(victim,spec.damage);}}}
({x:tx,z:tz}=world.waypoint(u,tx,tz));const len=Math.hypot(tx-u.x,tz-u.z);let moving=false;if(pace&&len>.6){const vx=(tx-u.x)/len*pace*dt,vz=(tz-u.z)/len*pace*dt,oldX=u.x,oldZ=u.z;moving=move(u,vx,vz,true);if(moving)visuals.get(u.id).v.holder.rotation.y=Math.atan2(u.x-oldX,u.z-oldZ);}const v=visuals.get(u.id)?.v;if(v)updateCharacterVisual(v,moving,dt,d);}}
function updateVisuals(dt){
 for(const {v} of visuals.values())v.marker.visible=false;
 for(const u of units){
  let entry=visuals.get(u.id);if(!entry)continue;
  // 市民觉醒时切换到专属 awakened 模型；秩序单位保留 guard 模型并用 Bloodlust 红光表达感染。
  if(entry.oldKind!==u.kind&&u.kind==='ally'&&u.type===0){scene.remove(entry.v.holder);entry={v:actorVisual(u),oldKind:u.kind};burst(u.x,STANDING_CHEST,u.z,0xba77ed,12);}
  const {v}=entry;v.holder.visible=distance(player,u)<38;v.holder.position.set(u.x,world.heightAt(u.x,u.z),u.z);
  if(u.converted&&!u.dead&&!v.aura)v.aura=makeAura(v.holder,u.type===0?AURA_COLORS.worker:AURA_COLORS.guard);
  if(v.aura){if(u.dead){removeAura(v.aura);v.aura=null;}else v.aura.g.visible=v.holder.visible&&distance(player,u)<34;}
  if(u.dead){v.holder.visible=false;continue;}
  if(entry.oldKind!==u.kind){if(u.kind==='ally'){setCharacterKind(v,'ally');v.holder.rotation.x=0;burst(u.x,STANDING_CHEST,u.z,0xba77ed,12);}if(u.kind==='corpse'){v.holder.rotation.x=Math.PI/2;v.holder.position.y=world.heightAt(u.x,u.z)+.3;}entry.oldKind=u.kind;}
  if(u.kind==='corpse'){v.holder.position.y=world.heightAt(u.x,u.z)+.3;v.holder.visible=distance(player,u)<45;}
 }
for(const a of auraVisuals.values())a.visible=false;if(state.abilities.air)aura('mother',player.x,player.z,4+state.abilities.air,0xb377e7);for(const u of units){if(u.dead||u.kind==='corpse')continue;if(u.type===4&&distance(player,u)<32)aura(u.id,u.x,u.z,6,u.converted?0xb377e7:0x69bce8);else if(u.kind==='ally'&&state.abilities.air===3&&distance(player,u)<17)aura(u.id,u.x,u.z,5,0xb377e7);}}
function updateEffects(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.v.y-=9*dt;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*4;if(p.life<=0){scene.remove(p.m);particles.splice(i,1);}}for(let i=waves.length-1;i>=0;i--){const w=waves[i];w.t+=dt;w.m.scale.setScalar(w.r*Math.min(1,w.t/.35));w.m.material.opacity=Math.max(0,1-w.t/.6);if(w.t>.6){scene.remove(w.m);w.m.geometry.dispose();w.m.material.dispose();waves.splice(i,1);}}
for(let i=tracers.length-1;i>=0;i--){const b=tracers[i];b.life-=dt;if(b.m){
 if(b.isPower)updatePowerShot(b,dt);
 else{b.x+=b.vx*dt;b.z+=b.vz*dt;b.m.position.set(b.x,b.y??1.2,b.z);if(world.solid(b.x,b.z,.1)){if(b.friendly)world.breakAt(b.x,b.z,.75,18,burst,b.y);b.life=0;}else if(b.friendly){if(boss.active&&!boss.dead&&distance(b,boss)<3.4){hitBoss(boss,24+state.abilities.guns*8);burst(b.x,3,b.z,0xc978ff,12);b.life=0;}else for(const u of units)if(!u.dead&&!u.converted&&u.kind!=='corpse'&&distance(b,u)<.72){applyHit(u,10+state.abilities.guns*5,4,'syringe');burst(b.x,STANDING_CHEST,b.z,0xb76bff,12);if(state.abilities.guns===3)for(const n of units)if(n!==u&&distance(n,u)<2)applyHit(n,5,0,'spread');b.life=0;break;}}else if(distance(b,player)<.58&&(b.y??1.2)>world.heightAt(player.x,player.z)+player.y+.12&&(b.y??1.2)<world.heightAt(player.x,player.z)+player.y+(player.crouch||player.roll>0? .85:2)&&invincible<=0){hurtMother(state,50);invincible=.35;b.life=0;shake=.2;music.effect('hurt');}else for(const a of units)if(a.kind==='ally'&&!a.dead&&distance(b,a)<.6){damageAlly(a,b.damage);b.life=0;break;}}
 }if(b.life<=0){scene.remove(b.m||b.line);if(b.line){b.line.geometry.dispose();b.line.material.dispose();}tracers.splice(i,1);}}}

function updateCamera(dt){if(mode==='menu'||mode==='loading'){
 // 主菜单直接取游戏实景：主角位于左侧前景，远处同时能看到摩天轮、东京塔和河岸建筑。
 const cityTarget=new T.Vector3(20,8,-17),direction=new T.Vector3(cityTarget.x-menuHero.x,0,cityTarget.z-menuHero.z).normalize(),drift=Math.sin(performance.now()*.00018)*.35,desired=new T.Vector3(-8+drift,6.2,18);
 if(camera.fov!==70){camera.fov=70;camera.updateProjectionMatrix();}camera.position.lerp(desired,1-Math.exp(-dt*2.5));camera.lookAt(cityTarget);if(playerVisual){playerVisual.holder.position.set(menuHero.x,world.heightAt(menuHero.x,menuHero.z),menuHero.z);playerVisual.holder.rotation.y=Math.atan2(direction.x,direction.z);playerVisual.holder.visible=true;}return;
 }const f=forward(),right={x:-Math.cos(yaw),z:Math.sin(yaw)},bodyHeight=player.crouch?CROUCH_CHEST:PLAYER_HEIGHT*.9,anchor=new T.Vector3(player.x,world.heightAt(player.x,player.z)+player.y+bodyHeight,player.z);
if(camera.fov!==64){camera.fov=64;camera.updateProjectionMatrix();}
// 镜头略高于肩膀并向右偏一点，比例对应缩小前的经典越肩视角。
const cameraHeight=player.crouch?PLAYER_HEIGHT*.82:PLAYER_HEIGHT*1.15;let desired=new T.Vector3(player.x-f.x*cameraDistance+right.x*.36,world.heightAt(player.x,player.z)+player.y+cameraHeight+pitch*2.1,player.z-f.z*cameraDistance+right.z*.36);const delta=desired.clone().sub(anchor),length=delta.length();for(let t=.3;t<length;t+=.18){const point=anchor.clone().addScaledVector(delta,t/length);if(world.solid(point.x,point.z,.16)){desired=anchor.clone().addScaledVector(delta,Math.max(.12,t-.25)/length);break;}}camera.position.lerp(desired,1-Math.exp(-dt*15));camera.lookAt(player.x+f.x*8,world.heightAt(player.x,player.z)+player.y+bodyHeight-pitch*4.7,player.z+f.z*8);if(shake>0){camera.position.x+=Math.sin(performance.now()*.13)*shake;shake=Math.max(0,shake-dt);}playerVisual.holder.visible=camera.position.distanceTo(anchor)>.65;}
function drawMap(){const ctx=$('map').getContext('2d');const px=x=>(x+66)/132*200,pz=z=>160-(z+66)/132*160;ctx.fillStyle='#283d49';ctx.fillRect(0,0,200,160);ctx.fillStyle='#416e86';ctx.fillRect(px(-9),0,18/132*200,160);ctx.fillStyle='#a3aaa3';for(const z of [26.4,-15.4])ctx.fillRect(px(-14.5),pz(z+2),29/132*200,4/132*160);for(const b of world.buildings){ctx.fillStyle=b.dead?'#566273':'#869397';ctx.fillRect(px(b.x-b.w/2),pz(b.z+b.d/2),b.w/132*200,b.d/132*160);}for(const u of units){if(u.dead||u.kind==='corpse')continue;ctx.fillStyle=u.converted?'#b976ed44':u.type?'#e27c68':'#e6e7d5';if(u.converted){ctx.fillRect(px(u.x)-5,pz(u.z)-5,10,10);ctx.fillStyle='#c190ef';}ctx.fillRect(px(u.x)-1,pz(u.z)-1,2.5,2.5);}for(const o of world.towers)if(!o.dead){ctx.fillStyle='#efab6f';ctx.fillRect(px(o.x)-2,pz(o.z)-2,4,4);}ctx.fillStyle='#e5c8ff';ctx.beginPath();ctx.arc(px(player.x),pz(player.z),3,0,7);ctx.fill();const f=forward();ctx.strokeStyle='#e6cfff';ctx.beginPath();ctx.moveTo(px(player.x),pz(player.z));ctx.lineTo(px(player.x+f.x*7),pz(player.z+f.z*7));ctx.stroke();if(reinforceTimer<7&&state.towers<3){const p=world.entries[reinforceDirection];ctx.fillStyle='#f49c67';ctx.font='bold 15px sans-serif';ctx.fillText('▼',px(p[0])-6,pz(p[1])+4);}}
function drawLabels(){if(mode==='menu'||mode==='loading'){$('worldLabels').innerHTML='';return;}const candidates=units.filter(u=>!u.dead&&distance(player,u)<24&&(u.converted||u.type>0||u.infection>0||u===target||distance(player,u)<8)).sort((a,b)=>distance(player,a)-distance(player,b));let html='',shown=0,folded=0;const rectangles=[];const pos=new T.Vector3();for(const u of candidates){const ally=u.kind==='ally',corpse=u.kind==='corpse';pos.set(u.x,world.heightAt(u.x,u.z)+(corpse?.7:2.7),u.z).project(camera);if(pos.z>1||pos.z<-1||Math.abs(pos.x)>1.1||Math.abs(pos.y)>1.1)continue;const x=(pos.x*.5+.5)*innerWidth;let y=(-pos.y*.5+.5)*innerHeight;if(ally&&u.hurt<=0){html+=`<div class="allyDot" style="left:${x}px;top:${y}px">◆</div>`;continue;}if(shown++>=12){folded++;continue;}for(let step=0;step<5;step++){if(!rectangles.some(r=>Math.abs(r.x-x)<108&&Math.abs(r.y-y)<46))break;y-=46;}if(y<200){folded++;continue;}rectangles.push({x,y});if(corpse){html+=`<div class="corpseLabel" style="left:${x}px;top:${y}px;border-color:${u.corpseTime<3?'#e46c69':'#e5a376'};--progress:${u.infection/u.threshold*360}deg"><i></i>${Math.floor(u.infection)}<small>${u.corpseTime.toFixed(1)}s · ${state.abilities.air>=2?'可转化':'需空气 Lv2'}</small></div>`;continue;}html+=`<div class="unitLabel ${target===u?'locked':''}" style="left:${x}px;top:${y}px"><div class="name">${u.type===0?PROFESSIONS[u.profession]:ENEMIES[u.type].name}${u.aim?' ⚠ 瞄准':u.purified?' −8/s':''}</div><div class="health"><i style="width:${u.hp/u.maxHp*100}%"></i></div>${ally?'':`<div class="infection"><i style="width:${u.infection/u.threshold*100}%"></i></div><div class="number">${Math.floor(u.infection)} / ${u.threshold}</div>`}</div>`;}if(folded)html+=`<div id="foldedLabels">附近单位 +${folded}</div>`;$('worldLabels').innerHTML=html;}
function hud(){
 if(import.meta.env.DEV)canvas.dataset.scene=JSON.stringify({buildings:world.buildings.length,spawn:world.spawn,bossSpawn:world.bossSpawn,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,position:{...player},towers:world.towers.map(o=>({x:o.x,z:o.z}))});
 const s=state;$('hpText').textContent=`${Math.max(0,Math.ceil(s.hp))} / ${s.maxHp}`;$('hpBar').style.width=Math.max(0,s.hp/s.maxHp*100)+'%';$('team').textContent=teamCount(units);$('total').textContent=s.infected;$('clock').textContent=formatTime(s.time);$('level').textContent=s.level;$('xpText').textContent=s.level===LEVEL_CAP?'MAX':`${s.xp} / ${s.need}`;$('xpBar').style.width=(s.level===LEVEL_CAP?100:s.xp/s.need*100)+'%';$('abilitySlots').innerHTML=ABILITIES.map(a=>`<div class="slot ${s.abilities[a.id]?'owned':''}" title="${a.name} ${s.abilities[a.id]}/3">${s.abilities[a.id]?a.icon:'+'}<small>${s.abilities[a.id]||''}</small></div>`).join('');
 document.querySelectorAll('#alertLevels b').forEach((b,i)=>b.classList.toggle('on',i<s.alert));$('reinforcement').textContent=s.towers===3?'秩序中枢瓦解 · 增援停止':reinforceTimer<7?`▲ ${['东侧','西侧','北侧','南侧'][reinforceDirection]}增援 · ${Math.ceil(reinforceTimer)} 秒后进入`:`警戒 ${['','I','II','III'][s.alert]} · ${['东侧','西侧','北侧','南侧'][reinforceDirection]}入口`;
 const tutorial=tutorialStep(s),view=missionView(s,Math.min(MISSIONS.length-1,s.mission));if(tutorial){$('taskNumber').textContent='新手训练';$('objective').textContent=tutorial.title;$('objectiveSub').textContent=tutorial.detail;$('objectiveSteps').innerHTML=`<span><i></i>${Math.floor(s.tutorialValue??0)} / ${tutorial.target}</span>`;$('percent').textContent=`${s.tutorialStep+1}/${TUTORIAL_STEPS.length}`;$('taskLogButton').disabled=true;}else if(view){const progress=view.objectives.reduce((sum,item)=>sum+item.value/item.target,0)/view.objectives.length;$('taskNumber').textContent=`主线任务 ${String(view.index+1).padStart(2,'0')}`;$('objective').textContent=view.title;$('objectiveSub').textContent=view.description;$('objectiveSteps').innerHTML=view.objectives.map(item=>`<span class="${item.done?'done':''}"><i></i>${item.label}<b>${item.value} / ${item.target}</b></span>`).join('');$('percent').textContent=Math.floor(progress*100)+'%';$('taskLogButton').disabled=false;}
 $('primaryLabel').textContent=switchTime>0?'切换中…':s.weapon<0?'徒手':'终末注射枪';$('breakCd').textContent=player.y>.1?'空中':player.crouch?'蹲伏':'站立';$('rushCd').textContent=rushCd>0?rushCd.toFixed(1)+'s':'就绪';$('ammo').innerHTML=`<span class="${s.weapon<0?'selected':''}">1 徒手</span><span class="${s.weapon===0?'selected':''}">2 注射枪</span><span>紫液针剂 <b>${s.clip} / ${s.ammo[0]}</b></span><span>${reloadTime>0?'装填 '+reloadTime.toFixed(1)+'s':'E 装填 · R 召集'}</span>`;$('crosshair').classList.toggle('locked',!!target);$('targetHint').textContent=target?`${target.type===0?PROFESSIONS[target.profession]:ENEMIES[target.type].name} · ${Math.ceil(distance(player,target))}m`:'';$('damageVignette').style.opacity=shake>0?.7:0;drawMap();drawMissionMapMarker();drawLabels();
}

function updateMissions(){
 if(!state.tutorialDone)return;
 while(state.mission<MISSIONS.length&&missionReady(state)){const completed=advanceMission(state),reward=completed.reward;state.ammo[0]=Math.min(999,state.ammo[0]+reward.ammo);state.hp=Math.min(100,state.hp+reward.hp);const rewardText=reward.ammo||reward.hp?` · 针剂 +${reward.ammo} · 生命 +${reward.hp}`:'';toast(`任务完成 · ${completed.title}${rewardText}`,4);music.effect('upgrade');$('missionComplete').innerHTML=`<b>任务完成</b><strong>${completed.title}</strong><small>${state.mission<MISSIONS.length?'新任务：'+MISSIONS[state.mission].title:'东京已完成觉醒'}</small>`;missionTimer=3;saveRun();}
 if(state.mission===4&&!boss.active){saveRun();boss.active=true;boss.root.visible=true;boss.x=world.bossSpawn.x;boss.z=world.bossSpawn.z;boss.attack=4;toast('终局 · 巨像降临：跟随目标标记前往中央路口',5);}
}
function updateBoss(dt){missionTimer=Math.max(0,missionTimer-dt);$('missionComplete').style.opacity=missionTimer>0?1:0;$('bossHud').hidden=!boss.active;document.querySelector('.alertPanel').style.display=boss.active?'none':'';if(!boss.active)return;animateBoss(boss,dt);$('bossHp').style.width=boss.hp/boss.maxHp*100+'%';$('bossValue').textContent=Math.ceil(boss.hp)+' / 6000';$('bossPhase').textContent=['','Ⅰ 装甲镇压','Ⅱ 净化封锁','Ⅲ 核心暴露'][boss.phase]+(boss.weak>0?' · 核心可重创':'');if(boss.dead){state.bossDefeated=true;for(let i=0;i<8;i++)burst(boss.x,Math.random()*9,boss.z,0xd59cff,15);return;}boss.weak=Math.max(0,boss.weak-dt);boss.attack-=dt;const d=distance(player,boss);boss.root.rotation.y=Math.atan2(player.x-boss.x,player.z-boss.z);if(boss.warning>0){boss.warning-=dt;const p=boss.attackPoint;aura('bossAttack',p.x,p.z,boss.phase===3?6:4,0xf18953);$('bossWarning').textContent='⚠ 巨像重击 · 离开橙色区域';if(boss.warning<=0){const radius=boss.phase===3?6:4;if(distance(player,p)<radius&&player.y<1&&invincible<=0){hurtMother(state,80,'巨像重击');invincible=.35;shake=.3;}world.breakAt(p.x,p.z,radius,65,burst);wave(p.x,p.z,radius,0xf19b58);boss.weak=3;boss.attack=boss.phase===3?3:4.5;for(const u of units)if(u.converted&&!u.dead&&distance(u,p)<radius)damageAlly(u,45);}}else{ $('bossWarning').textContent=boss.weak>0?'核心暴露 · 集中攻击！':'';if(d>7){const pace=boss.phase===3?2:1.2;const nx=boss.x+(player.x-boss.x)/d*dt*pace,nz=boss.z+(player.z-boss.z)/d*dt*pace;if(world.free(nx,nz,3)){boss.x=nx;boss.z=nz;}else world.breakAt(nx,nz,3,dt*90,burst);}if(boss.attack<=0){boss.warning=1.2;boss.attackPoint={x:player.x,z:player.z};}}}

let last=performance.now(),hudTimer=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.04,(now-last)/1000);last=now;frameDelta=dt;if(mode==='playing'){
 attackCd=Math.max(0,attackCd-dt);breakCd=Math.max(0,breakCd-dt);rushCd=Math.max(0,rushCd-dt);invincible=Math.max(0,invincible-dt);if(keys.ArrowLeft)yaw+=dt*1.6;if(keys.ArrowRight)yaw-=dt*1.6;if(keys.ArrowUp)pitch=Math.max(-.25,pitch-dt*.6);if(keys.ArrowDown)pitch=Math.min(.55,pitch+dt*.6);if(keys.ArrowLeft||keys.ArrowRight||keys.ArrowUp||keys.ArrowDown)tutorialAction('look',dt*80);
 if(switchTime>0){switchTime=Math.max(0,switchTime-dt);if(!switchTime)state.weapon=nextWeapon;}if(reloadTime>0){reloadTime=Math.max(0,reloadTime-dt);if(!reloadTime){const n=Math.min(state.clipMax-state.clip,state.ammo[0]);state.clip+=n;state.ammo[0]-=n;}}
 player.vy-=18*dt;player.y=Math.max(0,player.y+player.vy*dt);if(player.y===0)player.vy=0;
 const oldPlayerX=player.x,oldPlayerZ=player.z,dx=(keys.KeyD?1:0)-(keys.KeyA?1:0),fw=(keys.KeyW?1:0)-(keys.KeyS?1:0),len=Math.hypot(dx,fw);let moving=false,rollProgress=0;if(player.roll>0){player.roll=Math.max(0,player.roll-dt);rollProgress=1-player.roll/ROLL_DURATION;const rollSpeed=1.5+Math.sin(rollProgress*Math.PI)*4.7;move(player,player.rollX*rollSpeed*dt,player.rollZ*rollSpeed*dt);if(rollProgress>.28&&rollProgress<.72)invincible=Math.max(invincible,.05);moving=true;playerVisual.holder.rotation.y=Math.atan2(player.rollX,player.rollZ);}else if(len){const f=forward(),pace=speed(state)*(player.crouch?.45*(1+state.abilities.vital*.2):1),vx=(-Math.cos(yaw)*dx+f.x*fw)/len*pace*dt,vz=(Math.sin(yaw)*dx+f.z*fw)/len*pace*dt;moving=move(player,vx,vz);if(attackCd<.2)playerVisual.holder.rotation.y=Math.atan2(vx,vz);}tutorialAction('move',Math.hypot(player.x-oldPlayerX,player.z-oldPlayerZ));playerVisual.holder.position.set(player.x,world.heightAt(player.x,player.z)+player.y,player.z);const rollEase=rollProgress*rollProgress*(3-2*rollProgress);playerVisual.model.rotation.x=player.roll>0?rollEase*Math.PI*2:0;
 // 人物缩小后，翻滚和蹲伏的下沉量也要跟着缩小，否则脚会穿进路面。
 playerVisual.model.position.y=player.roll>0?Math.sin(rollProgress*Math.PI)*.28:player.crouch?-.33:0;
 // 蹲伏只压低人物，不再偷偷恢复旧的 2.25 米身高，保证所有动作都遵守统一尺度。
 playerVisual.model.scale.y=(characterHeight('player')/assets.player.height)*(player.crouch?.7:1);playerVisual.holdingGun=state.weapon===0;updateCharacterVisual(playerVisual,moving,dt,0,false);updateChargeRing();
 syringe.g.visible=state.weapon===0&&player.roll<=0;weaponPivot.position.set(player.x-Math.cos(yaw)*.5,world.heightAt(player.x,player.z)+player.y+(player.crouch?CROUCH_CHEST:STANDING_CHEST),player.z+Math.sin(yaw)*.5);weaponPivot.rotation.set(switchTime>0?Math.sin(switchTime/.4*Math.PI)*1.1:reloadTime>0?.5:0,yaw+.38,0);syringe.liquid.scale.y=.3*(.4+.6*state.clip/state.clipMax);
 target=acquire(state.weapon<0?3.2:WEAPONS[state.weapon].range);if(mouseHeld||keys.KeyJ)primary();const before=state.infected;stepSimulation(state,units,player,dt,state.tutorialDone?mode:'tutorial');if(state.infected>before)state.maxChain=Math.max(state.maxChain,state.infected-before);runAI(dt);updateVisuals(dt);updatePickups(dt);updateEffects(dt);
 state.towers=world.towers.filter(o=>o.dead).length;state.destroyed=world.destructibles.filter(o=>o.dead&&o.type!=='tower').length;updateMissions();updateBoss(dt);updateMissionGuidance();const next=threat(state);if(next>state.alert){state.alert=next;state.peakAlert=Math.max(state.peakAlert,next);reinforceTimer=0;reinforceAnnounced=false;const force=next===2?'持枪特警、净化士兵':'大兵、重装指挥官';if(!boss.active)toast(`警戒 ${['','I','II','III'][next]} · ${force}将从${['东侧','西侧','北侧','南侧'][reinforceDirection]}进入`,5);showPoliceAlert('城市警戒升级',`等级 ${['','I','II','III'][next]} · ${force}开始部署`,next,true);}music.alert=state.alert;
 if(tutorialFinishTimer>0){tutorialFinishTimer=Math.max(0,tutorialFinishTimer-dt);if(!tutorialFinishTimer&&state.pending)chooseUpgrade();}
 if(state.towers<3&&alerted&&!boss.active){reinforceTimer-=dt;if(reinforceTimer<=0){if(units.filter(u=>!u.dead&&!u.converted&&u.type>0&&u.kind!=='corpse').length<[0,8,14,20][state.alert])spawnReinforcement();reinforceTimer=[0,12,9,6][state.alert];reinforceAnnounced=false;}}
 if(state.infected>conversionCount){const converted=state.infected-conversionCount,events=pendingConversions.splice(0),central=events.filter(event=>event.central),indirect=events.filter(event=>!event.central);if(central.length)showConversionFeedback(central);else music.effect('convert');indirect.forEach(event=>addInfectionFeed(`${event.name} · 间接觉醒`));const untracked=converted-events.length;if(untracked>0)addInfectionFeed(`${untracked} 人 · 感染扩散觉醒`);conversionCount=state.infected;}const result=outcome(state);if(result==='ended')showDefeat();else if(result)finish(result);else if(state.tutorialDone&&state.pending&&state.time-state.lastPick>=50&&!tutorialFinishTimer)chooseUpgrade();saveTimer+=dt;if(saveTimer>5){saveRun();saveTimer=0;}
 }else if(mode==='menu'){for(const {v}of visuals.values())updateCharacterVisual(v,false,dt,0);if(playerVisual)updateCharacterVisual(playerVisual,false,dt,0);}
 updateAuras(dt);if(state.hp<lastHp)showDamageFeedback();lastHp=state.hp;damageFlash=Math.max(0,damageFlash-dt);conversionTimer=Math.max(0,conversionTimer-dt);hitMarkerTimer=Math.max(0,hitMarkerTimer-dt);policeAlertTimer=Math.max(0,policeAlertTimer-dt);$('damageVignette').classList.toggle('active',damageFlash>0);$('infectionFeedback').classList.toggle('active',conversionTimer>0);$('crosshair').classList.toggle('hit',hitMarkerTimer>0);if(!policeAlertTimer)$('policeAlert').classList.remove('active','upgrade');missionBeacon.visible=mode==='playing'&&!!missionTarget;updateTutorialCard();updateReloadIndicator();updateCamera(dt);if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').style.opacity=0;}hudTimer-=dt;if(hudTimer<=0&&assets){hudTimer=.1;hud();}renderer.render(scene,camera);
}
requestAnimationFrame(frame);
try{assets=await loadCharacterAssets();playerVisual=createCharacterVisual(assets,'player',1);scene.add(playerVisual.holder);playerVisual.holder.position.set(player.x,world.heightAt(player.x,player.z),player.z);playerVisual.holder.rotation.y=Math.PI;initUnits();scatterPickups();if(import.meta.env.DEV&&new URLSearchParams(location.search).get('test')==='boss'){state.infected=40;state.highestEnemy=5;state.mission=4;state.pending=0;state.weapon=0;state.abilities.guns=3;player.z=-15;world.towers.forEach(o=>{o.dead=true;o.g.visible=false;});units.forEach(u=>{u.dead=true;visuals.get(u.id).v.holder.visible=false;});}mode='menu';document.body.classList.add('menuMode');$('start').disabled=false;$('start').innerHTML='<span>开始游戏</span><i>▶</i>';$('loading').textContent='城市模拟就绪 · 建议开启声音';const saved=loadSaved();if(saved){const progress=Math.min(100,saved.state.cityInfected/POPULATION*100),awakened=saved.units.filter(unit=>unit.converted&&!unit.dead).length;$('continue').hidden=false;$('continue').textContent=`继续游戏　Lv.${saved.state.level}`;$('menuProgress').textContent=progress.toFixed(1)+'%';$('menuInfected').textContent=saved.state.infected;$('menuAwakened').textContent=awakened;}}
catch(error){console.error(error);$('loading').textContent='角色资源载入失败，请刷新页面重试。';$('start').textContent='刷新重试';$('start').disabled=false;$('start').onclick=()=>location.reload();}
window.gameSnapshot=()=>({mode,...state,team:teamCount(units),position:{...player},units:units.map(u=>({id:u.id,kind:u.kind,type:u.type,x:u.x,z:u.z,hp:u.hp,infection:u.infection,corpseTime:u.corpseTime})),pickups:pickups.map(p=>({x:p.x,z:p.z})),carved:world.destructibles.reduce((n,o)=>n+(o.holes?o.holes.length:0),0),nearestBuilding:world.buildings.length?+Math.min(...world.buildings.map(o=>Math.hypot(player.x-o.x,player.z-o.z))).toFixed(1):-1,characterModel:!!assets,sceneName:'日式河畔城市·体素版',buildings:world.buildings.length,spawn:world.spawn,renderCalls:renderer.info.render.calls,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z}});
