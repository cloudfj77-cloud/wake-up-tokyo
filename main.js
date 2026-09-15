import * as T from 'three';
import {createBoss,hitBoss,animateBoss} from './boss.js';
import {createFirearms} from './guns.js';
import {loadCharacterAssets,createCharacterVisual,setCharacterKind,playCharacterAttack,updateCharacterVisual,characterHeight,PROFESSIONS} from './characters.js';
import {block} from './world.js';
import {loadRiverside} from './riverside-world.js';
import {Soundtrack} from './music.js';
import {ABILITIES,ENEMIES,GUNS,POPULATION,STAMINA_MAX,makeState,makeUnit,hit,upgrade,choices,stepSimulation,damageAlly,distance,threat,outcome,speed,teamCount,hurtMother,missionReady,MISSIONS,spawnPlan,TUNE,resetTune,applyTune,setTuneValue,meleeSpec,gunInfection,guardWanted,levelCap,isRangedEnemy,hostileWindup,stepHostileMelee,upgradeAutoGap} from './rules.js';
const $=id=>document.getElementById(id),canvas=$('game');
const music=new Soundtrack();let mode='loading',state=makeState(),units=[],player={x:0,z:-7,y:0,vy:0,crouch:false,roll:0,rollX:0,rollZ:1},world,assets;let hurtTimer=0,lastHp=null;
const PLAYER_HEIGHT=characterHeight('player'),STANDING_CHEST=PLAYER_HEIGHT*.72,CROUCH_CHEST=PLAYER_HEIGHT*.45;
const FX_SCALE=PLAYER_HEIGHT/2.25;
let yaw=0,pitch=.08,cameraDistance=2.7,mouseHeld=false,dragging=false,lastMouse=null,attackCd=0,breakCd=0,rushCd=0,reinforceTimer=24,reinforceDirection=0,reinforceAnnounced=false,totalReinforcements=0,invincible=0,toastTime=0,saveTimer=0,shake=0,target=null,frameDelta=0,choiceSet=[],pendingChoice=-1,upgradeReveal=0,upgradeLock=0;
let settings={volume:.38,sensitivity:1,quality:'standard'};const SAVE_KEY='wake-up-tokyo-riverside-v4';const debugQuery=new URLSearchParams(location.search);let showDebug=debugQuery.has('debug');let alerted=false,switchTime=0,nextWeapon=-1,reloadTime=0,conversionCount=0,conversionTimer=0,missionTimer=0,nextActorId=800,ramTimer=0;let squadIds=new Set();
try{settings={...settings,...JSON.parse(localStorage.getItem('groundzero-settings')||'{}')};}catch{}
music.volume=settings.volume;
const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xbacdd4);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new T.Scene();scene.fog=new T.Fog(0xbacdd4,85,185);scene.add(new T.HemisphereLight(0xe5f1f5,0x8d9281,2.2));const sun=new T.DirectionalLight(0xffefda,2.8);sun.position.set(-28,55,-22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-52,right:52,top:52,bottom:-52,near:1,far:140});sun.shadow.bias=-.0003;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
const camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.12,180);camera.position.set(8,8,-21);camera.lookAt(0,3,5);
try{world=await loadRiverside(scene);}catch(error){console.error(error);$('loading').textContent='场景加载失败，请刷新重试';$('start').textContent='刷新重试';$('start').disabled=false;$('start').onclick=()=>location.reload();throw error;}Object.assign(player,world.spawn);yaw=Math.PI;const boss=createBoss(scene),firearms=createFirearms();
firearms.root.scale.setScalar(PLAYER_HEIGHT/1.1);
const weaponPivot=new T.Group();scene.add(weaponPivot);weaponPivot.add(firearms.root);
const visuals=new Map(),particles=[],waves=[],tracers=[],auraVisuals=new Map();let playerVisual;
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
const AURA_COLORS={worker:galaxyAura,guard:galaxyAura,level:{core:0xffc92e,mote:0xffe066},pickup:{core:0x2fd15a,mote:0x8dffab}};
const activeAuras=[];
function makeAura(holder,palette,{coreSize=(palette.coreSize??1.7)*FX_SCALE,moteSize=(palette.moteSize??.44)*FX_SCALE,count=palette.count??5,radius=(palette.radius??.3)*FX_SCALE,life=0}={}){
 const g=new T.Group();
 const sprite=(size,color,opacity,map)=>{const s=new T.Sprite(new T.SpriteMaterial({map:map??awakenGlow,color,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity}));s.scale.set(size,size,1);g.add(s);return s;};
 const smokes=[];
 if(palette.galaxy){for(let i=0;i<palette.smokes;i++){const size=coreSize*(1.05+Math.random()*1.05);const s=makeSmokeSprite(i%3?palette.core:0xf47dff,size,.24+Math.random()*.16);s.material.blending=T.AdditiveBlending;s.material.color.multiplyScalar(2.4);const glow=makeSmokeSprite(i%3?palette.core:0xf47dff,.78,.28);glow.material.blending=T.AdditiveBlending;glow.material.color.multiplyScalar(3.4);s.add(glow);const ang=Math.random()*6.283,rad=.2+Math.random()*.36;s.position.set(Math.cos(ang)*rad,(.35+Math.random()*1.5)*FX_SCALE,Math.sin(ang)*rad);s.material.rotation=Math.random()*6.283;s.userData={angle:ang,radius:rad,baseY:s.position.y,spin:(Math.random()<.5?-1:1)*(.2+Math.random()*.45),turn:(Math.random()<.5?-1:1)*(.15+Math.random()*.3),size,pulse:1+Math.random()*.8,phase:Math.random()*6.283};g.add(s);smokes.push(s);}}
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
const TUNE_KEY='wake-up-tokyo-tune-v1';
const TUNE_FIELDS=[
 {group:'城市警戒',note:'只决定下一档敌人能不能出现。时间到了才升档，感染人数默认不升档。'},
 {path:'alert.stage2At',label:'进入 II 档（秒）',min:10,max:600,step:5},
 {path:'alert.stage3At',label:'进入 III / 终局（秒）',min:20,max:900,step:5},
 {path:'alert.maxLevel1',label:'I 档最高兵级',min:1,max:6,step:1},
 {path:'alert.maxLevel2',label:'II 档最高兵级',min:1,max:6,step:1},
 {path:'alert.maxLevel3',label:'III 档最高兵级',min:1,max:6,step:1},
 {path:'alert.pressureTime',label:'击杀+转化折算秒数',min:0,max:8,step:.1},
 {group:'动态难度',note:'耗材只算持棍巡警等战斗杂兵，不含街区打工人。清光了就大量补。威胁人数跟等级和存活友军走，没有上限。城市会一直派人。'},
 {path:'difficulty.armyWeight',label:'间隔用的群落权重',min:0,max:2,step:.05},
 {path:'difficulty.fodderTarget',label:'场上耗材维持数量',min:0,max:24,step:1},
 {path:'difficulty.fodderDump',label:'场上没耗材时补多少',min:1,max:24,step:1},
 {path:'difficulty.threatPerLevel',label:'每级带来的威胁人数',min:0,max:3,step:.05},
 {path:'difficulty.threatPerAlly',label:'每个友军带来的威胁人数',min:0,max:2,step:.05},
 {path:'difficulty.intervalBase',label:'增援间隔基数（秒）',min:3,max:40,step:.5},
 {path:'difficulty.intervalPerWeight',label:'权重缩短间隔',min:0,max:3,step:.05},
 {path:'difficulty.intervalMin',label:'最短间隔（秒）',min:1,max:20,step:.5},
 {group:'转化活跃',note:'转化前行尸慢走，转化后满街乱跑。改完立刻生效。'},
 {path:'activity.shambleSpeed',label:'转化前移速',min:.1,max:3,step:.05},
 {path:'activity.shambleRadius',label:'转化前徘徊半径',min:1,max:20,step:.5},
 {path:'activity.shambleIdle',label:'转化前发呆（秒）',min:.5,max:20,step:.5},
 {path:'activity.fleeSpeed',label:'转化前躲开母体',min:0,max:4,step:.05},
 {path:'activity.awakeSpeed',label:'转化后乱跑速度',min:1,max:10,step:.1},
 {path:'activity.awakeRadius',label:'转化后乱跑半径',min:6,max:80,step:1},
 {path:'activity.awakeIdle',label:'转化后换目标（秒）',min:.2,max:6,step:.05},
 {path:'activity.chaseSpeed',label:'转化后追敌',min:1,max:10,step:.1},
 {path:'activity.followSpeed',label:'召集跟随',min:1,max:12,step:.1},
 {path:'activity.structureSpeed',label:'拆中枢速度',min:1,max:10,step:.1}
];
function tuneValue(path){const [g,k]=path.split('.');return TUNE[g][k];}
function persistTune(){try{localStorage.setItem(TUNE_KEY,JSON.stringify(TUNE));}catch{}}
function loadTune(){try{applyTune(JSON.parse(localStorage.getItem(TUNE_KEY)||'null'));}catch{}}
function syncTuneInputs(){for(const field of TUNE_FIELDS){if(!field.path)continue;const el=$(`tune-${field.path}`);if(el)el.value=tuneValue(field.path);const num=$(`tune-num-${field.path}`);if(num)num.value=tuneValue(field.path);}}
function buildTuneHud(){
 const root=$('tuneHud');if(!root||root.dataset.ready)return;
 let html='<header><strong>调参台</strong><span>F3 开关 · 改完立即生效</span></header><div id="tuneLive"></div>';
 let open=false;
 for(const field of TUNE_FIELDS){
  if(field.group){if(open)html+='</section>';html+=`<section><h3>${field.group}</h3><p>${field.note||''}</p>`;open=true;continue;}
  html+=`<label><span>${field.label}</span><div><input id="tune-${field.path}" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${tuneValue(field.path)}"><input id="tune-num-${field.path}" type="number" min="${field.min}" max="${field.max}" step="${field.step}" value="${tuneValue(field.path)}"></div></label>`;
 }
 if(open)html+='</section>';
 html+='<footer><button type="button" id="tuneReset">恢复默认</button><button type="button" id="tuneCopy">复制 JSON</button><button type="button" id="tuneWave">立刻打一波增援</button></footer>';
 root.innerHTML=html;root.dataset.ready='1';
 root.addEventListener('pointerdown',e=>e.stopPropagation());
 const write=path=>{const value=setTuneValue(path,+$(`tune-${path}`).value);$(`tune-num-${path}`).value=value;persistTune();updateTuneLive();};
 const writeNum=path=>{const value=setTuneValue(path,+$(`tune-num-${path}`).value);$(`tune-${path}`).value=value;persistTune();updateTuneLive();};
 for(const field of TUNE_FIELDS){if(!field.path)continue;$(`tune-${field.path}`).oninput=()=>write(field.path);$(`tune-num-${field.path}`).onchange=()=>writeNum(field.path);}
 $('tuneReset').onclick=()=>{resetTune();persistTune();syncTuneInputs();updateTuneLive();toast('调参已恢复默认',1.5);};
 $('tuneCopy').onclick=async()=>{const text=JSON.stringify(TUNE,null,2);try{await navigator.clipboard.writeText(text);toast('参数已复制',1.2);}catch{toast(text,4);}};
 $('tuneWave').onclick=()=>{if(mode!=='playing'||boss.active){toast('进局后再打增援',1.5);return;}alerted=true;const plan=spawnReinforcement();reinforceTimer=plan?.interval??TUNE.difficulty.intervalBase;updateTuneLive();};
}
function setTuneOpen(open){showDebug=open;buildTuneHud();const box=$('tuneHud');if(!box)return;box.hidden=!open;if(open){document.exitPointerLock?.();syncTuneInputs();updateTuneLive();}}
function toggleDebug(){setTuneOpen(!showDebug);}
function updateTuneLive(){const live=$('tuneLive');if(!live||!showDebug)return;const plan=spawnPlan(state,units);const names=plan.types.map(t=>ENEMIES[t].name);const count=names.reduce((m,n)=>(m[n]=(m[n]||0)+1,m),{});const mix=Object.entries(count).map(([n,c])=>`${n}×${c}`).join(' · ')||'无';live.textContent=`时间 ${state.time.toFixed(1)}s · 警戒 ${['','I','II','III'][plan.stage]}${plan.final?' 终局':''} · 最高兵级 ${plan.maxLevel}
权重 ${plan.weight.toFixed(2)} = 等级 ${state.level} + 群落 ${teamCount(units)} × ${TUNE.difficulty.armyWeight}
场上耗材 ${plan.fodder} · 下波 耗材×${plan.fodderN} 威胁×${plan.threatN}（无上限） · 间隔 ${plan.interval.toFixed(1)}s · 倒计时 ${Math.max(0,reinforceTimer).toFixed(1)}s
预览 ${mix}`;}
loadTune();if(showDebug)setTuneOpen(true);
function actorVisual(u){const v=createCharacterVisual(assets,u.kind==='ally'?'ally':u.type===0?'human':'guard',u.profession);v.holder.position.set(u.x,world.heightAt(u.x,u.z),u.z);v.holder.rotation.y=Math.random()*6.28;scene.add(v.holder);visuals.set(u.id,{v,oldKind:u.kind});return v;}
function spawnGuard(type){
 const p=world.nearest(player.x+(Math.random()-.5)*4,player.z+(Math.random()-.5)*4,1);
 const u=makeUnit(nextActorId++,type,p.x,p.z,false,0);
 u.converted=true;u.kind='ally';u.guard=true;u.city=false;u.maxHp=Math.ceil(u.maxHp*1.4);u.hp=u.maxHp;u.infection=u.threshold;
 units.push(u);actorVisual(u);squadIds.add(u.id);
 return u;
}
function ensureGuards(announce=false){
 const want=guardWanted(state);if(!want.count)return;
 for(const u of units){
  if(!u.guard)continue;
  if(u.dead){u.guardCd=(u.guardCd??12)-frameDelta;if(u.guardCd<=0){u.dead=false;u.kind='ally';u.hp=u.maxHp;u.converted=true;const p=world.nearest(player.x,player.z,1);u.x=p.x;u.z=p.z;u.guardCd=0;if(!visuals.get(u.id))actorVisual(u);toast('护卫归队',1);}}
 }
 const alive=units.filter(u=>u.guard&&!u.dead);
 const missing=want.count-alive.length;
 for(let i=0;i<missing;i++)spawnGuard(want.type);
 if(announce&&missing>0)toast(`护卫到场 · ${want.count} 名 ${ENEMIES[want.type].name}`,2);
}
function initUnits(){let rng=7142;const random=()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296;};units=[];for(let i=0;i<48;i++){let x,z;if(i<10){x=(i%5-2)*2.1;z=player.z-5-Math.floor(i/5)*3.5;x+=player.x;({x,z}=world.nearest(x,z,1));}else{do{x=(random()-.5)*114;z=(random()-.5)*114;}while(!world.free(x,z,1));}const citizen=makeUnit(i,0,x,z,true,i%5);if(i<10){citizen.wander=18;citizen.tx=x;citizen.tz=z;}units.push(citizen);}const positions=[[-7,22],[8,-24],[23,7],[-25,8],[-8,39],[39,-8],[-39,-7],[7,-39],[48,5],[-6,50]];positions.forEach((p,i)=>{const q=world.nearest(p[0],p[1],1);units.push(makeUnit(48+i,1,q.x,q.z,true,i%5));});units.forEach(u=>{const v=actorVisual(u);v.holder.visible=distance(player,u)<38;});}
function move(u,dx,dz,detour=false){const ox=u.x,oz=u.z;if(world.free(u.x+dx,u.z))u.x+=dx;if(world.free(u.x,u.z+dz))u.z+=dz;if(detour&&Math.hypot(u.x-ox,u.z-oz)<Math.hypot(dx,dz)*.3){const side=u.id%2?1:-1;if(world.free(u.x-dz*side,u.z+dx*side)){u.x-=dz*side;u.z+=dx*side;}}return Math.hypot(u.x-ox,u.z-oz)>.001;}
function forward(){return {x:Math.sin(yaw),z:Math.cos(yaw)};}
function acquire(range=3.1){let best=null,score=-Infinity;const f=forward();for(const u of units){if(u.dead||u.converted||u.kind==='corpse')continue;const d=distance(player,u);if(d>range||!world.clear(player,u))continue;const dot=((u.x-player.x)*f.x+(u.z-player.z)*f.z)/(d||1);if(dot<.3)continue;const value=dot*4-d/range;if(value>score){score=value;best=u;}}return best;}
const pickups=[],crossBarGeometry=new T.BoxGeometry(1,1,1);
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
function facingFront(u){const vis=visuals.get(u.id)?.v;const ang=vis?vis.holder.rotation.y:Math.atan2(player.x-u.x,player.z-u.z);const fx=Math.sin(ang),fz=Math.cos(ang);const dx=player.x-u.x,dz=player.z-u.z,len=Math.hypot(dx,dz)||1;return (dx*fx+dz*fz)/len>.2;}
function applyHit(u,inf,damage,fromArmy=false){const result=hit(state,u,inf,damage,ENEMIES[u.type].shield&&facingFront(u),fromArmy);if(result==='converted'){burst(u.x,STANDING_CHEST,u.z,0xc781ff,15);music.effect('convert');toast(`${u.type===0?PROFESSIONS[u.profession]:(ENEMIES[u.type].allyName||ENEMIES[u.type].name)} 已觉醒 · 满状态加入`,1.8);}else if(result==='hit')burst(u.x,STANDING_CHEST,u.z,inf?0xb376e9:0xebc5a6,4);else if(result==='killed'&&u.type>0)spawnPickup(u.x,u.z);return result;}
function playerHurt(damage,source){const sprinting=!!(keys.ShiftLeft||keys.ShiftRight)&&!player.crouch;const dead=hurtMother(state,damage,source,sprinting);invincible=.35;shake=Math.max(shake,.12);music.effect('hurt');const r=state.lastReflect;if(r?.radius&&r.reflected>0){for(const u of units){if(u.dead||u.converted||u.kind==='corpse')continue;if(distance(player,u)<=r.radius)applyHit(u,r.reflected*.5,r.reflected);}}return dead;}
function raiseAlarm(){if(alerted)return;alerted=true;const plan=spawnReinforcement();reinforceTimer=plan?.interval??12;toast('感染行为暴露 · 增援开始进入',3);}
function activeGun(){return state.weapon>=0?GUNS[state.weapon]:null;}
function stashMag(){const gun=activeGun();if(gun)state.mags[gun.id]=state.clip;}
function meleeStrike(kind){if(mode!=='playing'||attackCd>0||switchTime>0||reloadTime>0||player.roll>0)return;raiseAlarm();playerVisual.holder.rotation.y=yaw;const spec=meleeSpec(state,kind),f=forward();
 const gun=activeGun();
 if(!gun){attackCd=spec.cd;playCharacterAttack(playerVisual,kind==='heavy'?'break':'infect');const hits=[];if(spec.aoe){for(const u of units){if(u.dead||u.converted||u.kind==='corpse')continue;if(distance(player,u)<=spec.aoe)hits.push(u);}}else{const u=acquire(spec.range);if(u)hits.push(u);}for(const u of hits)applyHit(u,spec.infection,spec.damage);if(!hits.length)world.breakAt(player.x+f.x*1.7,player.z+f.z*1.7,kind==='heavy'?2.2:1.8,kind==='heavy'?80:50,burst);if(boss.active&&!boss.dead&&distance(player,boss)<(kind==='heavy'?5.6:5))hitBoss(boss,kind==='heavy'?120:75);music.effect('infect');return;}
 if(kind==='heavy'){toast(gun.name+'没有重击 · 切回徒手',1.2);return;}
 fireGun(gun);}
function fireGun(gun){if(state.clip<=0){reloadGun();return;}state.clip--;attackCd=gun.cd;playCharacterAttack(playerVisual,'shoot');weaponPivot.position.y-=.05;const f=forward();const shotHeight=player.crouch?CROUCH_CHEST:STANDING_CHEST;const originY=world.heightAt(player.x,player.z)+player.y+shotHeight;const u=acquire(gun.range);const inf=gunInfection(state,gun.damage);
 for(let i=0;i<gun.pellets;i++){
  const spread=(i-(gun.pellets-1)/2)*gun.spread;
  const aim=u?{x:u.x-player.x,z:u.z-player.z}:{x:f.x,z:f.z};
  const len=Math.hypot(aim.x,aim.z)||1;
  const c=Math.cos(spread),s=Math.sin(spread);
  const vx=(aim.x/len*c-aim.z/len*s)*gun.speed,vz=(aim.x/len*s+aim.z/len*c)*gun.speed;
  const m=block(scene,gun.splash?0.18:0.08,gun.splash?0.18:0.08,gun.splash?0.55:0.45,gun.color,player.x,originY,player.z);
  tracers.push({m,x:player.x,z:player.z,y:originY,vx,vz,life:.9,friendly:true,damage:gun.damage,infection:inf,splash:gun.splash||0,from:gun.name});
 }
 burst(player.x+f.x,player.y+shotHeight,player.z+f.z,gun.color,gun.splash?14:8);music.effect('infect');}
function primary(){meleeStrike('light');}
function heavy(){meleeStrike('heavy');}
function reloadGun(){const gun=activeGun();if(!gun||reloadTime||switchTime||state.clip>=gun.clip)return;if((state.ammo[gun.id]||0)<=0){toast(gun.name+'备弹耗尽 · 击杀或同化对应等级敌人补充');return;}reloadTime=1.15;toast('装填 '+gun.name+'…',1);}
function weaponSelect(index){if(switchTime)return;if(index>=0){const gun=GUNS[index];if(!gun)return;if(state.abilities.guns<gun.unlock){toast('尚未解锁 '+gun.name+' · 先点「枪？枪！」');return;}}if(index===state.weapon)return;nextWeapon=index;switchTime=.35;attackCd=Math.max(attackCd,.35);toast(index<0?'切换 · 徒手':'切换 · '+GUNS[index].name,.7);}
const keys={};addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','F3'].includes(e.code)&&!typing)e.preventDefault();if(e.code==='F3'){e.preventDefault();toggleDebug();return;}if(typing)return;keys[e.code]=true;if(e.repeat)return;if(e.code==='Escape'||e.code==='KeyP'){togglePause();return;}if(mode!=='playing')return;if(e.code==='KeyJ')primary();if(e.code==='KeyK')heavy();if(e.code==='Digit1')weaponSelect(-1);if(e.code==='Digit2')weaponSelect(0);if(e.code==='Digit3')weaponSelect(1);if(e.code==='Digit4')weaponSelect(2);if(e.code==='Digit5')weaponSelect(3);if(e.code==='Digit6')weaponSelect(4);if(e.code==='Space'&&player.y<=.01&&player.roll<=0){player.crouch=false;player.vy=7;}if(e.code==='KeyC'&&player.roll<=0)player.crouch=!player.crouch;if(e.code==='KeyR'){if(squadIds.size){squadIds.clear();toast('群落已解散 · 自主行动');}else{const cap=state.abilities.command?Math.max(6,guardWanted(state).count):6;units.filter(u=>u.converted&&!u.dead&&distance(player,u)<22).sort((a,b)=>distance(player,a)-distance(player,b)).slice(0,cap).forEach(u=>squadIds.add(u.id));toast((state.abilities.command?'号令召集 ':'已召集 ')+squadIds.size+' 名同伴');}}if(e.code==='KeyE')reloadGun();if(e.code==='Tab'&&state.pending)chooseUpgrade();});addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;if(e.button===0){mouseHeld=true;primary();if(!showDebug&&!document.pointerLockElement)canvas.requestPointerLock?.()?.catch?.(()=>{});}else if(e.button===2){if(document.pointerLockElement===canvas)heavy();else{dragging=true;lastMouse={x:e.clientX,y:e.clientY};}}});addEventListener('pointerup',()=>{mouseHeld=false;dragging=false;});addEventListener('pointermove',e=>{if(mode!=='playing')return;let dx=0,dy=0;if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}else if(dragging&&lastMouse){dx=e.clientX-lastMouse.x;dy=e.clientY-lastMouse.y;lastMouse={x:e.clientX,y:e.clientY};}yaw-=dx*.0025*settings.sensitivity;pitch=T.MathUtils.clamp(pitch+dy*.0018*settings.sensitivity,-.25,.55);});canvas.addEventListener('wheel',e=>{e.preventDefault();cameraDistance=T.MathUtils.clamp(cameraDistance+e.deltaY*.003,1.9,4.5);},{passive:false});document.addEventListener('pointerlockerror',()=>toast('未锁定鼠标时：拖动右键转向，K 键重击',2));
function clearInput(){mouseHeld=false;dragging=false;Object.keys(keys).forEach(k=>keys[k]=false);document.exitPointerLock?.();}
addEventListener('blur',()=>{clearInput();if(mode==='playing')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')togglePause();});
function showDialog(html){$('dialog').classList.remove('choiceLock');$('dialog').innerHTML=html;$('modal').hidden=false;clearInput();}
function hideDialog(){$('modal').hidden=true;$('dialog').classList.remove('choiceLock');}
function hideLevelUpFx(){const fx=$('levelUpFx');fx.classList.remove('play');fx.hidden=true;}
function playLevelUpFx(){
  music.effect('upgrade');
  const y=world.heightAt(player.x,player.z)+player.y+PLAYER_HEIGHT*.72;
  if(playerVisual)makeAura(playerVisual.holder,AURA_COLORS.level,{coreSize:2.8,moteSize:.62,count:8,radius:.58,life:1.7});
  burst(player.x,y,player.z,0xffc92e,24);
  burst(player.x,y+.4,player.z,0xffe066,14);
  wave(player.x,player.z,3.6,0xffc92e);
  $('levelUpLv').textContent=state.level;
  const fx=$('levelUpFx');
  fx.hidden=false;
  fx.classList.remove('play');
  void fx.offsetWidth;
  fx.classList.add('play');
}
function bindUpgradeCards(){
  pendingChoice=-1;
  document.querySelectorAll('[data-choice]').forEach(b=>{
    b.onclick=()=>{
      if(upgradeLock>0||mode!=='upgrade')return;
      pendingChoice=+b.dataset.choice;
      document.querySelectorAll('[data-choice]').forEach(c=>c.classList.toggle('picked',c===b));
      const confirm=$('confirmUpgrade');
      confirm.disabled=false;
      confirm.textContent=`确定 · ${choiceSet[pendingChoice].name}`;
    };
  });
  $('confirmUpgrade').onclick=confirmChoice;
}
function confirmChoice(){
  if(mode!=='upgrade'||pendingChoice<0||upgradeLock>0)return;
  const a=choiceSet[pendingChoice];
  if(!a||!upgrade(state,a.id))return;
  hideDialog();
  hideLevelUpFx();
  pendingChoice=-1;
  mode='playing';
  music.resume();
  if(playerVisual)makeAura(playerVisual.holder,AURA_COLORS.level,{coreSize:1.6,moteSize:.36,radius:.38,life:.7});
  if(a.id==='command')ensureGuards(true);
  if(a.id==='guns'&&state.abilities.guns===1)toast('解锁手枪 / 霰弹枪 · 按 2 / 3 切换',2.4);
  else toast(`获得 ${a.name} Lv.${state.abilities[a.id]}`,2);
  saveRun();
}
function openUpgradeDialog(){
  hideLevelUpFx();
  mode='upgrade';
  upgradeLock=.45;
  showDialog(`<div class="eyebrow">GENETIC RECOMBINATION / LV.${state.level}</div><h2>${state.history.length?'反抗，正在进化。':'选择你的第一种变异。'}</h2><p>战场已暂停。先点一张卡片预览，再点确定才会生效。<br>空气传播、枪？枪！、狂杀、持续感染、急速、皮糙肉厚、生存与进化、听我号令。</p><div class="cards">${choiceSet.map((a,i)=>`<button type="button" class="card" data-choice="${i}"><span class="type">${a.group} / ${state.abilities[a.id]?'强化能力':'新能力'}</span><span class="icon">${a.icon}</span><strong>${a.name}</strong><em>Lv.${state.abilities[a.id]} → Lv.${state.abilities[a.id]+1}</em><small>${a.descriptions[state.abilities[a.id]]}</small></button>`).join('')}</div><div class="choiceBar"><button type="button" class="action" id="confirmUpgrade" disabled>先点一张卡片</button></div>`);
  $('dialog').classList.add('choiceLock');
  bindUpgradeCards();
}
function chooseUpgrade(){
  if(mode==='upgrade'||mode==='levelup')return;
  choiceSet=choices(state);
  if(!choiceSet.length){state.pending=0;return;}
  pendingChoice=-1;
  mode='levelup';
  music.pause();
  clearInput();
  playLevelUpFx();
  upgradeReveal=1.55;
}
function saveRun(){if(import.meta.env.DEV&&new URLSearchParams(location.search).has('test'))return;if(!assets||['loading','menu','ended','won'].includes(mode)||boss.active)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:7,state,units,player,yaw,pitch,cameraDistance,attackCd,breakCd,rushCd,reinforceTimer,reinforceDirection,totalReinforcements,alerted,objects:world.destructibles.map(o=>({hp:o.hp,dead:o.dead,removed:o.removed?[...o.removed]:[]}))}));}catch{}}
function loadSaved(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s?.version===7&&s.state?.hp>0&&s.units?.length?s:null;}catch{return null;}}
function restore(saved){state=saved.state;units=saved.units;player=saved.player;yaw=saved.yaw;pitch=saved.pitch;cameraDistance=T.MathUtils.clamp(saved.cameraDistance??2.7,1.9,4.5);attackCd=saved.attackCd;breakCd=saved.breakCd;rushCd=saved.rushCd;reinforceTimer=saved.reinforceTimer;reinforceDirection=saved.reinforceDirection;totalReinforcements=saved.totalReinforcements;alerted=saved.alerted;for(const a of visuals.values())scene.remove(a.v.holder);visuals.clear();units.forEach(actorVisual);saved.objects.forEach((o,i)=>{const w=world.destructibles[i];w.hp=o.hp;w.dead=o.dead;w.g.visible=!o.dead;if(w.instances){const d=new T.Object3D();d.scale.setScalar(0);d.updateMatrix();for(const ix of o.removed){w.removed.add(ix);w.instances.setMatrixAt(ix,d.matrix);}w.instances.instanceMatrix.needsUpdate=true;}});}
async function start(continuing=false){if(!assets)return;if(continuing){const s=loadSaved();if(s)restore(s);}else if(state.time>0){location.reload();return;}conversionCount=state.infected;await music.start();playerVisual.holder.rotation.y=yaw;$('menu').hidden=true;$('hud').hidden=false;mode='playing';if(state.pending)chooseUpgrade();else toast('WASD 移动 · Shift 奔跑 · 左键轻击 · 右键重击 · 空格跳跃',4);}
$('start').onclick=()=>start();$('continue').onclick=()=>start(true);
function togglePause(){if(mode==='playing'){mode='paused';music.pause();saveRun();showDialog(`<div class="eyebrow">SIMULATION PAUSED</div><h2>东京，暂时静止。</h2><p>街区进度自动保存；Boss 战从进场前存档重试。所有战斗计时已暂停。</p><div class="controlTable">WASD 移动 · 鼠标锁定后转向，未锁定时右键拖动转向<br>左键 / J 轻击 · 右键 / K 重击 · 空格跳跃 · Shift 奔跑 · C 蹲伏<br>1 徒手 · 2–6 枪械（点出「枪？枪！」后解锁）· E 装填 · R 号令召集 / 解散 · Tab 选择变异<br>两下轻击即可叫醒打工人；持盾特警正面伤害减半。<br>空气传播 Lv2 可转化尸体；净化工兵在 8 米内每秒清除 8 感染。</div><button class="action" id="resume">继续觉醒 ↗</button><button class="action secondary" id="pauseSettings">设置</button><button class="action secondary" id="endRun">结束并复盘</button>`);$('resume').onclick=togglePause;$('pauseSettings').onclick=()=>settingsDialog('paused');$('endRun').onclick=()=>finish('ended');}else if(mode==='paused'){hideDialog();mode='playing';music.resume();}}
$('pauseButton').onclick=togglePause;$('sound').onclick=()=>{$('sound').textContent='♫ 音乐 '+(music.toggle()?'开':'关');};
function settingsDialog(back='menu'){showDialog(`<div class="eyebrow">SETTINGS / 体验设置</div><h2>找到你的节奏。</h2><label class="setting">音乐与音效 <input id="volume" type="range" min="0" max="1" step=".05" value="${settings.volume}"></label><label class="setting">视角灵敏度 <input id="sensitivity" type="range" min=".4" max="2" step=".1" value="${settings.sensitivity}"></label><label class="setting">画质 <select id="quality"><option value="standard">标准 · 动态阴影</option><option value="low">流畅 · 关闭阴影</option></select></label><p>鼠标锁定不可用时，可拖动右键或使用方向键转动镜头。<br>本作采用越肩第三人称视角，滚轮调节跟随距离。</p><button class="action" id="closeSettings">返回</button>`);$('quality').value=settings.quality;const persist=()=>{try{localStorage.setItem('groundzero-settings',JSON.stringify(settings));}catch{}};$('volume').oninput=e=>{settings.volume=+e.target.value;music.setVolume(settings.volume);persist();};$('sensitivity').oninput=e=>{settings.sensitivity=+e.target.value;persist();};$('quality').onchange=e=>{settings.quality=e.target.value;applyQuality();persist();};$('closeSettings').onclick=()=>{hideDialog();if(back==='paused'){mode='playing';togglePause();}};}
$('settings').onclick=()=>settingsDialog();$('about').onclick=()=>{showDialog('<div class="eyebrow">TOKYO PLAYTEST / 04 · 能力更新</div><h2>让全城加入反抗。</h2><p>感染 40 人、摧毁三座中枢、推翻巨大黄色 Boss，完成东京人觉醒。<br>开局选一种变异。八种能力各三级：空气传播、枪？枪！、狂杀、持续感染、急速、皮糙肉厚、生存与进化、听我号令。<br>步行已放慢；Shift 奔跑消耗体力。轻击 0.75 秒、重击 1.25 秒范围伤。<br>点出「枪？枪！」后按 2–6 切换手枪、霰弹、步枪、狙击与 RPG。</p><button class="action" id="closeAbout">知道了</button>');$('closeAbout').onclick=hideDialog;};
function formatTime(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');}
function finish(result){mode=result;music.pause();try{localStorage.removeItem(SAVE_KEY);}catch{}const pct=result==='won'?100:Math.min(99,Math.round(state.infected/40*100));showDialog(`<div class="eyebrow">${result==='won'?'CITY AWAKENED / 全城觉醒':'RUN COMPLETE / 本局复盘'}</div><h2>城市已感染 <span class="purple">${pct}%</span></h2><p>${result==='won'?'巨像倒下了。紫色觉醒波席卷街道：都给我醒过来！':'这一次的反抗，已经留下了痕迹。'}</p><div class="stats"><div><small>累计感染</small><strong>${state.infected}</strong></div><div><small>存活队伍</small><strong>${teamCount(units)}</strong></div><div><small>最高警戒</small><strong>${['','I','II','III'][state.peakAlert]}</strong></div><div><small>存活时长</small><strong>${formatTime(state.time)}</strong></div></div><div class="recap"><div><b>能力构筑轨迹 · LV.${state.level}</b>${state.history.map(h=>`<p>${formatTime(h.time)}　${ABILITIES.find(a=>a.id===h.id).name} ${h.level}/3</p>`).join('')||'<p>未选择能力</p>'}</div><div><b>关键战绩</b><p>最后受击：${state.lastDamage||'无'}</p>${(state.damageLog||[]).map(d=>`<p>${d.time.toFixed(1)}s ${d.source} −${d.damage} (${d.before}生命)</p>`).join('')}<p>首次转化：${state.first?state.first.name+' · '+formatTime(state.first.time):'尚未转化'}</p><p>最大同时转化：${state.maxChain} 人</p><p>净化工兵转化：${state.purifiers} 名</p><p>最高转化 / 击败等级：${state.highestEnemy}</p><p>中枢瓦解：${state.towers}/3 · 破坏物件 ${state.destroyed}</p><p>初始人口转化：${state.cityInfected}/${POPULATION}</p></div></div><button class="action" id="again">返回主菜单 / 重新开始 ↗</button>`);$('again').onclick=()=>location.reload();}
function hiddenSpawnPoint(){
 const minD=36;
 for(let i=0;i<32;i++){
  const a=Math.random()*Math.PI*2,d=minD+6+Math.random()*24;
  const x=player.x+Math.sin(a)*d,z=player.z+Math.cos(a)*d;
  if(world.free(x,z,1)&&distance(player,{x,z})>=minD-1)return world.nearest(x,z,1);
 }
 const far=[...world.entries].sort((p,q)=>Math.hypot(q[0]-player.x,q[1]-player.z)-Math.hypot(p[0]-player.x,p[1]-player.z));
 return world.nearest(far[0][0],far[0][1],1);
}
function spawnReinforcement(plan){
 if(mode==='ended'||mode==='won')return null;
 plan??=spawnPlan(state,units);
 const types=plan.types.length?plan.types:[1];
 const placed=[];
 for(let i=0;i<types.length;i++){
  let p=hiddenSpawnPoint();
  for(let k=0;k<8&&placed.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<2.4);k++)p=hiddenSpawnPoint();
  placed.push(p);
  const u=makeUnit(100+totalReinforcements++,types[i],p.x,p.z,false,i%5);
  units.push(u);actorVisual(u);
 }
 const names=[...new Set(types.map(t=>ENEMIES[t].name))];
 toast(`街区外侧增援进入 · ${names.join(' / ')} · ${types.length} 人`,2.2);
 return plan;
}
function enemyFire(u,spec,victim){
 const ranged=isRangedEnemy(spec);
 const visual=visuals.get(u.id)?.v;
 if(visual){
  visual.holder.rotation.y=Math.atan2(victim.x-u.x,victim.z-u.z);
  if(ranged)playCharacterAttack(visual,'shoot');
  visual.holdingGun=ranged;
 }
 u.attackCd=spec.interval;u.aim=0;u.aiming=false;
 if(ranged){
  const shots=spec.burst?2:1;
  for(let i=0;i<shots;i++){
   const spread=(i-(shots-1)/2)*.05;
   const delta=new T.Vector3(victim.x-u.x,0,victim.z-u.z).normalize();
   const c=Math.cos(spread),s=Math.sin(spread);
   const vx=delta.x*c-delta.z*s,vz=delta.x*s+delta.z*c;
   const y=victim===player?world.heightAt(player.x,player.z)+player.y+(player.crouch?CROUCH_CHEST:STANDING_CHEST):world.heightAt(victim.x,victim.z)+STANDING_CHEST;
   const m=block(scene,.12,.12,.35,0xf4bc82,u.x,STANDING_CHEST,u.z);
   tracers.push({m,x:u.x,z:u.z,vx:vx*18,vz:vz*18,life:2,y,damage:spec.damage,from:ENEMIES[u.type].name});
  }
 }else if(victim===player){if(invincible<=0)playerHurt(spec.damage,ENEMIES[u.type].name);}
 else damageAlly(victim,spec.damage,state);
}
function showHostilePose(u,spec,victim,start){
 const ranged=isRangedEnemy(spec);
 const visual=visuals.get(u.id)?.v;
 if(!visual)return;
 visual.holdingGun=ranged;
 visual.holder.rotation.y=Math.atan2(victim.x-u.x,victim.z-u.z);
 if(start&&!ranged)playCharacterAttack(visual,u.type===1||u.type===3?'break':'infect',Math.max(.9,(hostileWindup(spec))+.2));
}
function runAI(dt){const living=units.filter(u=>!u.dead&&u.kind!=='corpse'),allies=living.filter(u=>u.converted),hostiles=living.filter(u=>!u.converted);for(const u of living){u.attackCd-=dt;u.hurt=Math.max(0,u.hurt-dt);for(const other of living){if(other.id>=u.id)continue;const gap=distance(u,other);if(gap>.01&&gap<.85){const push=(.85-gap)*dt*2;move(u,(u.x-other.x)/gap*push,(u.z-other.z)/gap*push);}}let tx=u.x,tz=u.z,pace=0;const d=distance(player,u);if(u.kind==='human'){const act=TUNE.activity;u.wander-=dt;if(d<7&&state.infected>0){const len=d||1;tx=u.x+(u.x-player.x)/len*4;tz=u.z+(u.z-player.z)/len*4;pace=act.fleeSpeed;}else{if(u.wander<=0){if(Math.random()<.45){u.tx=u.x;u.tz=u.z;u.wander=2+Math.random()*act.shambleIdle;}else{u.tx=u.x+(Math.random()-.5)*act.shambleRadius*2;u.tz=u.z+(Math.random()-.5)*act.shambleRadius*2;u.wander=3+Math.random()*act.shambleIdle;} }tx=u.tx;tz=u.tz;pace=Math.hypot(tx-u.x,tz-u.z)>.7?act.shambleSpeed:0;}}
else if(u.kind==='ally'){const act=TUNE.activity;let victim=null,nearest=20;for(const h of hostiles){const dd=distance(u,h);if(dd<nearest&&world.clear(u,h)){nearest=dd;victim=h;}}if(victim){tx=victim.x;tz=victim.z;pace=act.chaseSpeed;if(nearest<2&&u.attackCd<=0){applyHit(victim,Math.max(4,Math.round((u.atk||12)*.45)),u.atk||12,true);u.attackCd=1.3;const visual=visuals.get(u.id)?.v;if(visual)playCharacterAttack(visual,'infect');}}else{if(squadIds.has(u.id)){const angle=u.id*2.4;tx=player.x+Math.sin(angle)*3;tz=player.z+Math.cos(angle)*3;pace=act.followSpeed;}else if(boss.active&&!boss.dead){tx=boss.x+Math.sin(u.id)*4;tz=boss.z+Math.cos(u.id)*4;pace=act.chaseSpeed;if(distance(u,boss)<5.5)hitBoss(boss,dt*(u.profession===2?4:2));}else{const structure=world.towers.find(o=>!o.dead&&distance(u,o)<28);if(structure){tx=structure.x;tz=structure.z;pace=act.structureSpeed;if(distance(u,structure)<3&&u.attackCd<=0){world.breakAt(u.x,u.z,2, u.profession===2?24:8,burst);u.attackCd=2;}}else{u.wander-=dt;if(u.wander<=0){u.tx=u.x+(Math.random()-.5)*act.awakeRadius*2;u.tz=u.z+(Math.random()-.5)*act.awakeRadius*2;u.wander=act.awakeIdle*(.55+Math.random()*.9);}tx=u.tx;tz=u.tz;pace=act.awakeSpeed;}}if(u.profession===1&&distance(u,player)<5&&u.attackCd<=0&&state.hp<100){state.hp=Math.min(100,state.hp+10);u.attackCd=25;toast('医生支援 +10',1);}}}
else{if((!alerted&&state.time<8)||d>(player.crouch?15:27+state.alert*3)){u.aiming=false;u.aim=0;const visual=visuals.get(u.id)?.v;if(visual){visual.holdingGun=false;updateCharacterVisual(visual,false,dt,d);}continue;}let victim=player,nearest=d;for(const a of allies){const dd=distance(u,a);if(dd<nearest){nearest=dd;victim=a;}}const spec=ENEMIES[u.type];tx=victim.x;tz=victim.z;const swing=stepHostileMelee(u,spec,nearest,world.clear(u,victim),dt);if(swing==='start'||swing==='windup'){pace=0;showHostilePose(u,spec,victim,swing==='start');}else if(swing==='hit'){pace=0;enemyFire(u,spec,victim);}else if(swing==='miss'){pace=0;const visual=visuals.get(u.id)?.v;if(visual)visual.holdingGun=false;}else pace=nearest<=spec.range*.82?0:spec.speed;}
if(u.kind==='ally'&&state.abilities.haste>=3)pace*=1.3;({x:tx,z:tz}=world.waypoint(u,tx,tz));const len=Math.hypot(tx-u.x,tz-u.z);let moving=false;if(pace&&len>.6){const vx=(tx-u.x)/len*pace*dt,vz=(tz-u.z)/len*pace*dt;moving=move(u,vx,vz,true);if(moving)visuals.get(u.id).v.holder.rotation.y=Math.atan2(vx,vz);}const v=visuals.get(u.id)?.v;if(v)updateCharacterVisual(v,moving,dt,d);}}
function updateVisuals(dt){for(const {v} of visuals.values())v.marker.visible=false;for(const u of units){const entry=visuals.get(u.id);if(!entry)continue;const {v}=entry;v.holder.visible=distance(player,u)<38;v.holder.position.set(u.x,world.heightAt(u.x,u.z),u.z);if(u.converted&&!u.dead&&!v.aura)v.aura=makeAura(v.holder,u.type===0?AURA_COLORS.worker:AURA_COLORS.guard);if(v.aura){if(u.dead){removeAura(v.aura);v.aura=null;}else v.aura.g.visible=v.holder.visible&&distance(player,u)<34;}if(u.dead){v.holder.visible=false;continue;}if(entry.oldKind!==u.kind){if(u.kind==='ally'){setCharacterKind(v,'ally');v.holder.rotation.x=0;burst(u.x,1,u.z,0xba77ed,12);music.effect('convert');}if(u.kind==='corpse'){v.holder.rotation.x=Math.PI/2;v.holder.position.y=world.heightAt(u.x,u.z)+.3;}entry.oldKind=u.kind;}if(u.kind==='corpse'){v.holder.position.y=world.heightAt(u.x,u.z)+.3;v.holder.visible=distance(player,u)<45;}}
for(const a of auraVisuals.values())a.visible=false;if(state.abilities.air)aura('mother',player.x,player.z,[0,5,10,15][state.abilities.air],0xb377e7);for(const u of units){if(u.dead||u.kind==='corpse')continue;if(u.aiming&&!isRangedEnemy(ENEMIES[u.type])&&distance(player,u)<22)aura('melee'+u.id,u.x,u.z,ENEMIES[u.type].range+.2,0xf08a4a);else if(u.type===4&&distance(player,u)<32)aura(u.id,u.x,u.z,ENEMIES[4].aura||8,u.converted?0xb377e7:0x69bce8);else if(u.kind==='ally'&&state.abilities.air===3&&distance(player,u)<22)aura(u.id,u.x,u.z,5,0xb377e7);}}
function updateEffects(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.v.y-=9*dt;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*4;if(p.life<=0){scene.remove(p.m);particles.splice(i,1);}}for(let i=waves.length-1;i>=0;i--){const w=waves[i];w.t+=dt;w.m.scale.setScalar(w.r*Math.min(1,w.t/.35));w.m.material.opacity=Math.max(0,1-w.t/.6);if(w.t>.6){scene.remove(w.m);w.m.geometry.dispose();w.m.material.dispose();waves.splice(i,1);}}
for(let i=tracers.length-1;i>=0;i--){const b=tracers[i];b.life-=dt;if(b.m){b.x+=b.vx*dt;b.z+=b.vz*dt;b.m.position.set(b.x,b.y??STANDING_CHEST,b.z);if(world.solid(b.x,b.z,.1)){if(b.friendly)world.breakAt(b.x,b.z,b.splash||.75,18,burst);b.life=0;}else if(b.friendly){const splash=b.splash||0;const hitR=splash||.72;if(boss.active&&!boss.dead&&distance(b,boss)<3.4+splash){hitBoss(boss,b.damage||24);burst(b.x,3,b.z,b.m.material.color.getHex(),12);b.life=0;}else for(const u of units)if(!u.dead&&!u.converted&&u.kind!=='corpse'&&distance(b,u)<hitR){applyHit(u,b.infection||0,b.damage||8);burst(b.x,STANDING_CHEST,b.z,0xb76bff,12);if(splash)for(const n of units)if(n!==u&&!n.dead&&!n.converted&&distance(n,u)<splash)applyHit(n,(b.infection||0)*.5,(b.damage||8)*.5);b.life=0;break;}}else if(distance(b,player)<.58&&(b.y??STANDING_CHEST)>world.heightAt(player.x,player.z)+player.y+.12&&(b.y??STANDING_CHEST)<world.heightAt(player.x,player.z)+player.y+(player.crouch||player.roll>0?CROUCH_CHEST+.12:PLAYER_HEIGHT+.08)&&invincible<=0){playerHurt(b.damage||12,b.from||'秩序火力');b.life=0;}else for(const a of units)if(a.kind==='ally'&&!a.dead&&distance(b,a)<.6){damageAlly(a,b.damage,state);b.life=0;break;}}if(b.life<=0){scene.remove(b.m||b.line);if(b.line){b.line.geometry.dispose();b.line.material.dispose();}tracers.splice(i,1);}}}

function updateCamera(dt){if(mode==='menu'||mode==='loading'){camera.position.lerp(new T.Vector3(world.spawn.x-5,5.3,world.spawn.z+7),1-Math.exp(-dt*2));camera.lookAt(0,4,18);return;}const f=forward(),right={x:-Math.cos(yaw),z:Math.sin(yaw)},bodyHeight=player.crouch?CROUCH_CHEST:PLAYER_HEIGHT*.9,anchor=new T.Vector3(player.x,world.heightAt(player.x,player.z)+player.y+bodyHeight,player.z);
// 镜头略高于肩膀并向右偏一点，比例对应缩小前的经典越肩视角。
const cameraHeight=player.crouch?PLAYER_HEIGHT*.82:PLAYER_HEIGHT*1.15;let desired=new T.Vector3(player.x-f.x*cameraDistance+right.x*.36,world.heightAt(player.x,player.z)+player.y+cameraHeight+pitch*2.1,player.z-f.z*cameraDistance+right.z*.36);const delta=desired.clone().sub(anchor),length=delta.length();for(let t=.3;t<length;t+=.18){const point=anchor.clone().addScaledVector(delta,t/length);if(world.solid(point.x,point.z,.16)){desired=anchor.clone().addScaledVector(delta,Math.max(.12,t-.25)/length);break;}}camera.position.lerp(desired,1-Math.exp(-dt*15));camera.lookAt(player.x+f.x*8,world.heightAt(player.x,player.z)+player.y+bodyHeight-pitch*4.7,player.z+f.z*8);if(shake>0){camera.position.x+=Math.sin(performance.now()*.13)*shake;shake=Math.max(0,shake-dt);}playerVisual.holder.visible=camera.position.distanceTo(anchor)>.65;}
function drawMap(){const ctx=$('map').getContext('2d');const px=x=>(x+66)/132*200,pz=z=>160-(z+66)/132*160;ctx.fillStyle='#283d49';ctx.fillRect(0,0,200,160);ctx.fillStyle='#416e86';ctx.fillRect(px(-9),0,18/132*200,160);ctx.fillStyle='#a3aaa3';for(const z of [26.4,-15.4])ctx.fillRect(px(-14.5),pz(z+2),29/132*200,4/132*160);for(const b of world.buildings){ctx.fillStyle=b.dead?'#566273':'#869397';ctx.fillRect(px(b.x-b.w/2),pz(b.z+b.d/2),b.w/132*200,b.d/132*160);}for(const u of units){if(u.dead||u.kind==='corpse')continue;ctx.fillStyle=u.converted?'#b976ed44':u.type?'#e27c68':'#e6e7d5';if(u.converted){ctx.fillRect(px(u.x)-5,pz(u.z)-5,10,10);ctx.fillStyle='#c190ef';}ctx.fillRect(px(u.x)-1,pz(u.z)-1,2.5,2.5);}for(const o of world.towers)if(!o.dead){ctx.fillStyle='#efab6f';ctx.fillRect(px(o.x)-2,pz(o.z)-2,4,4);}ctx.fillStyle='#e5c8ff';ctx.beginPath();ctx.arc(px(player.x),pz(player.z),3,0,7);ctx.fill();const f=forward();ctx.strokeStyle='#e6cfff';ctx.beginPath();ctx.moveTo(px(player.x),pz(player.z));ctx.lineTo(px(player.x+f.x*7),pz(player.z+f.z*7));ctx.stroke();if(reinforceTimer<7&&state.towers<3){const p=world.entries[reinforceDirection];ctx.fillStyle='#f49c67';ctx.font='bold 15px sans-serif';ctx.fillText('▼',px(p[0])-6,pz(p[1])+4);}}
function drawLabels(){if(mode==='menu'||mode==='loading'){$('worldLabels').innerHTML='';return;}const candidates=units.filter(u=>!u.dead&&distance(player,u)<24&&(u.converted||u.type>0||u.infection>0||u===target||distance(player,u)<8)).sort((a,b)=>distance(player,a)-distance(player,b));let html='',shown=0,folded=0;const rectangles=[];const pos=new T.Vector3();for(const u of candidates){const ally=u.kind==='ally',corpse=u.kind==='corpse';pos.set(u.x,world.heightAt(u.x,u.z)+(corpse?.7:2.7),u.z).project(camera);if(pos.z>1||pos.z<-1||Math.abs(pos.x)>1.1||Math.abs(pos.y)>1.1)continue;const x=(pos.x*.5+.5)*innerWidth;let y=(-pos.y*.5+.5)*innerHeight;if(ally&&u.hurt<=0){html+=`<div class="allyDot" style="left:${x}px;top:${y}px">◆</div>`;continue;}if(shown++>=12){folded++;continue;}for(let step=0;step<5;step++){if(!rectangles.some(r=>Math.abs(r.x-x)<108&&Math.abs(r.y-y)<46))break;y-=46;}if(y<200){folded++;continue;}rectangles.push({x,y});if(corpse){html+=`<div class="corpseLabel" style="left:${x}px;top:${y}px;border-color:${u.corpseTime<3?'#e46c69':'#e5a376'};--progress:${u.infection/u.threshold*360}deg"><i></i>${Math.floor(u.infection)}<small>${u.corpseTime.toFixed(1)}s · ${state.abilities.air>=2||state.abilities.dot>=2?'可转化':'需空气 Lv2'}</small></div>`;continue;}html+=`<div class="unitLabel ${target===u?'locked':''}" style="left:${x}px;top:${y}px"><div class="name">${u.type===0?PROFESSIONS[u.profession]:ENEMIES[u.type].name}${u.aiming||u.aim?(isRangedEnemy(ENEMIES[u.type])?' ⚠ 举枪':' ⚠ 抬手'):u.purified?' −8/s':''}</div><div class="health"><i style="width:${u.hp/u.maxHp*100}%"></i></div>${ally?'':`<div class="infection"><i style="width:${u.infection/u.threshold*100}%"></i></div><div class="number">${Math.floor(u.infection)} / ${u.threshold}</div>`}</div>`;}if(folded)html+=`<div id="foldedLabels">附近单位 +${folded}</div>`;$('worldLabels').innerHTML=html;}
function hud(){if(import.meta.env.DEV)canvas.dataset.scene=JSON.stringify({buildings:world.buildings.length,spawn:world.spawn,bossSpawn:world.bossSpawn,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,position:{...player},towers:world.towers.map(o=>({x:o.x,z:o.z}))});const s=state;const cap=levelCap(s);$('hpText').textContent=`${Math.max(0,Math.ceil(s.hp))} / ${Math.ceil(s.maxHp)}`;$('hpBar').style.width=Math.max(0,s.hp/s.maxHp*100)+'%';$('staminaBar').style.width=Math.max(0,s.stamina/STAMINA_MAX*100)+'%';$('team').textContent=teamCount(units);$('total').textContent=s.infected;$('clock').textContent=formatTime(s.time);$('level').textContent=s.level;$('xpText').textContent=s.level===cap?'MAX':`${s.xp} / ${s.need}`;$('xpBar').style.width=(s.level===cap?100:s.xp/s.need*100)+'%';$('percent').textContent=Math.min(100,Math.floor(s.infected/40*100))+'%';$('abilitySlots').innerHTML=ABILITIES.map(a=>`<div class="slot ${s.abilities[a.id]?'owned':''}" title="${a.name} ${s.abilities[a.id]}/3">${s.abilities[a.id]?a.icon:'+'}<small>${s.abilities[a.id]||''}</small></div>`).join('');document.querySelectorAll('#alertLevels b').forEach((b,i)=>b.classList.toggle('on',i<s.alert));$('reinforcement').textContent=reinforceTimer<7?`▲ 街区外侧增援 · ${Math.ceil(reinforceTimer)} 秒 · ${teamCount(units)} 友军`:`警戒 ${['','I','II','III'][s.alert]} · 警员持续增援`;$('objective').textContent=MISSIONS[Math.min(4,s.mission)][0];$('objectiveSub').textContent=MISSIONS[Math.min(4,s.mission)][1]+` · ${s.infected}/40 · 中枢 ${s.towers}/3`;const gun=activeGun();$('primaryLabel').textContent=switchTime>0?'切换中…':gun?gun.name:'轻击 / 重击';$('breakCd').textContent=player.y>.1?'空中':player.crouch?'蹲伏':'站立';$('rushCd').textContent=(keys.ShiftLeft||keys.ShiftRight)&&s.stamina>1?'奔跑 '+Math.ceil(s.stamina):'体力 '+Math.ceil(s.stamina);const ammoBits=[`<span class="${s.weapon<0?'selected':''}">1 徒手</span>`];GUNS.forEach((g,i)=>{const locked=s.abilities.guns<g.unlock;ammoBits.push(`<span class="${s.weapon===i?'selected':''}${locked?'':''}">${i+2} ${g.name}${locked?'':' '+((s.weapon===i?s.clip:s.mags[g.id])||0)+'/'+(s.ammo[g.id]||0)}</span>`);});ammoBits.push(`<span>${reloadTime>0?'装填 '+reloadTime.toFixed(1)+'s':'E 装填 · R 号令'}</span>`);$('ammo').innerHTML=ammoBits.join('');$('crosshair').classList.toggle('locked',!!target);$('targetHint').textContent=target?`${target.type===0?PROFESSIONS[target.profession]:ENEMIES[target.type].name} · ${Math.ceil(distance(player,target))}m`:'';drawMap();drawLabels();updateTuneLive();}

function updateMissions(){while(missionReady(state)&&state.mission<4){const done=MISSIONS[state.mission][0];state.mission++;state.hp=Math.min(state.maxHp,state.hp+25);toast('任务完成 · '+done+' | 生命 +25',4);music.effect('upgrade');$('missionComplete').textContent='✓ '+done+' · 完成';missionTimer=3;saveRun();}if(state.mission===4&&!boss.active){saveRun();boss.active=true;boss.root.visible=true;boss.x=world.bossSpawn.x;boss.z=world.bossSpawn.z;boss.attack=4;toast('终局 · 巨像降临：推翻它，让东京人觉醒！',5);}}
function updateBoss(dt){missionTimer=Math.max(0,missionTimer-dt);$('missionComplete').style.opacity=missionTimer>0?1:0;$('bossHud').hidden=!boss.active;document.querySelector('.alertPanel').style.display=boss.active?'none':'';if(!boss.active)return;animateBoss(boss,dt);$('bossHp').style.width=boss.hp/boss.maxHp*100+'%';$('bossValue').textContent=Math.ceil(boss.hp)+' / 6000';$('bossPhase').textContent=['','Ⅰ 装甲镇压','Ⅱ 净化封锁','Ⅲ 核心暴露'][boss.phase]+(boss.weak>0?' · 核心可重创':'');if(boss.dead){state.bossDefeated=true;for(let i=0;i<8;i++)burst(boss.x,Math.random()*9,boss.z,0xd59cff,15);return;}boss.weak=Math.max(0,boss.weak-dt);boss.attack-=dt;const d=distance(player,boss);boss.root.rotation.y=Math.atan2(player.x-boss.x,player.z-boss.z);if(boss.warning>0){boss.warning-=dt;const p=boss.attackPoint;aura('bossAttack',p.x,p.z,boss.phase===3?6:4,0xf18953);$('bossWarning').textContent='⚠ 巨像重击 · 离开橙色区域';if(boss.warning<=0){const radius=boss.phase===3?6:4;if(distance(player,p)<radius&&player.y<1&&invincible<=0){playerHurt(80,'巨像重击');}world.breakAt(p.x,p.z,radius,65,burst);wave(p.x,p.z,radius,0xf19b58);boss.weak=3;boss.attack=boss.phase===3?3:4.5;for(const u of units)if(u.converted&&!u.dead&&distance(u,p)<radius)damageAlly(u,45,state);}}else{ $('bossWarning').textContent=boss.weak>0?'核心暴露 · 集中攻击！':'';if(d>7){const pace=boss.phase===3?2:1.2;const nx=boss.x+(player.x-boss.x)/d*dt*pace,nz=boss.z+(player.z-boss.z)/d*dt*pace;if(world.free(nx,nz,3)){boss.x=nx;boss.z=nz;}else world.breakAt(nx,nz,3,dt*90,burst);}if(boss.attack<=0){boss.warning=1.2;boss.attackPoint={x:player.x,z:player.z};}}}

let last=performance.now(),hudTimer=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.04,(now-last)/1000);last=now;frameDelta=dt;if(mode==='playing'){
 attackCd=Math.max(0,attackCd-dt);breakCd=Math.max(0,breakCd-dt);rushCd=Math.max(0,rushCd-dt);invincible=Math.max(0,invincible-dt);if(keys.ArrowLeft)yaw+=dt*1.6;if(keys.ArrowRight)yaw-=dt*1.6;if(keys.ArrowUp)pitch=Math.max(-.25,pitch-dt*.6);if(keys.ArrowDown)pitch=Math.min(.55,pitch+dt*.6);
 if(switchTime>0){switchTime=Math.max(0,switchTime-dt);if(!switchTime){stashMag();state.weapon=nextWeapon;const gun=activeGun();state.gunId=gun?gun.id:null;state.clipMax=gun?gun.clip:0;state.clip=gun?(state.mags[gun.id]||0):0;}}if(reloadTime>0){reloadTime=Math.max(0,reloadTime-dt);if(!reloadTime){const gun=activeGun();if(gun){const n=Math.min(gun.clip-state.clip,state.ammo[gun.id]||0);state.clip+=n;state.ammo[gun.id]-=n;state.mags[gun.id]=state.clip;}}}
 player.vy-=18*dt;player.y=Math.max(0,player.y+player.vy*dt);if(player.y===0)player.vy=0;
 const dx=(keys.KeyD?1:0)-(keys.KeyA?1:0),fw=(keys.KeyW?1:0)-(keys.KeyS?1:0),len=Math.hypot(dx,fw);const wantSprint=!!(keys.ShiftLeft||keys.ShiftRight)&&!player.crouch&&player.y<=.01&&len>0;if(wantSprint)state.stamina=Math.max(0,state.stamina-22*dt);else state.stamina=Math.min(STAMINA_MAX,state.stamina+14*dt);const sprinting=wantSprint&&state.stamina>1;let moving=false;if(player.roll>0){player.roll=Math.max(0,player.roll-dt);move(player,player.rollX*5*dt,player.rollZ*5*dt);if(player.roll>.25&&player.roll<.45)invincible=Math.max(invincible,.05);moving=true;playerVisual.holder.rotation.y=Math.atan2(player.rollX,player.rollZ);}else if(len){const f=forward(),pace=speed(state,sprinting)*(player.crouch?.45:1),vx=(-Math.cos(yaw)*dx+f.x*fw)/len*pace*dt,vz=(Math.sin(yaw)*dx+f.z*fw)/len*pace*dt;moving=move(player,vx,vz);if(attackCd<.2)playerVisual.holder.rotation.y=Math.atan2(vx,vz);}if(sprinting&&state.abilities.haste>=3){ramTimer-=dt;for(const u of units){if(u.dead||u.converted||u.kind==='corpse')continue;if(distance(player,u)<1.05&&ramTimer<=0){const spec=meleeSpec(state,'heavy');applyHit(u,spec.infection,spec.damage);ramTimer=.85;burst(u.x,STANDING_CHEST,u.z,0xe8c07a,10);}}}playerVisual.holder.position.set(player.x,world.heightAt(player.x,player.z)+player.y,player.z);playerVisual.model.rotation.x=player.roll>0?(1-player.roll/.65)*Math.PI*2:0;
 playerVisual.model.position.y=player.roll>0?.26:player.crouch?-.33:0;
 const body=characterHeight('player')/(assets.player?.height||PLAYER_HEIGHT)*(state.abilities.frenzy>=3?1.35:1);playerVisual.model.scale.set(body,body*(player.crouch?.7:1),body);playerVisual.holdingGun=state.weapon>=0;updateCharacterVisual(playerVisual,moving,dt,0,sprinting);
 const gun=activeGun();for(const [id,mesh] of Object.entries(firearms.map))mesh.visible=!!(gun&&gun.id===id&&player.roll<=0);weaponPivot.position.set(player.x-Math.cos(yaw)*.5,world.heightAt(player.x,player.z)+player.y+(player.crouch?CROUCH_CHEST:STANDING_CHEST),player.z+Math.sin(yaw)*.5);weaponPivot.rotation.set(switchTime>0?Math.sin(switchTime/.4*Math.PI)*1.1:reloadTime>0?.5:0,yaw+.38,0);
 target=acquire(gun?gun.range:3.2);if(mouseHeld||keys.KeyJ)primary();ensureGuards();const before=state.infected;stepSimulation(state,units,player,dt,mode);if(state.infected>before){toast(`感染扩散 · ${state.infected-before} 人觉醒`,1.5);state.maxChain=Math.max(state.maxChain,state.infected-before);}runAI(dt);updateVisuals(dt);updateEffects(dt);updatePickups(dt);
 state.towers=world.towers.filter(o=>o.dead).length;state.destroyed=world.destructibles.filter(o=>o.dead&&o.type!=='tower').length;updateMissions();updateBoss(dt);const next=threat(state);if(next>state.alert){state.alert=next;state.peakAlert=Math.max(state.peakAlert,next);if(!boss.active)toast('敌方单位更强大了',3);}music.alert=state.alert;
 if(alerted){reinforceTimer-=dt;if(reinforceTimer<=0){const plan=spawnReinforcement();reinforceTimer=plan?.interval??12;reinforceAnnounced=false;}}
 if(state.infected>conversionCount){conversionTimer=1.1;$('infectionFeedback').innerHTML=`<span>☣</span><b>觉醒成功 ×${state.infected-conversionCount}</b><small>加入反抗群落</small>`;conversionCount=state.infected;music.effect('convert');}const result=outcome(state);if(result)finish(result);else if(state.pending&&state.time-state.lastPick>=upgradeAutoGap(state))chooseUpgrade();saveTimer+=dt;if(saveTimer>5){saveRun();saveTimer=0;}if(lastHp!==null&&state.hp<lastHp)hurtTimer=.6;lastHp=state.hp;
 }else if(mode==='levelup'||mode==='upgrade'){
  updateEffects(dt);
  if(playerVisual)updateCharacterVisual(playerVisual,false,dt,0);
  if(mode==='levelup'){upgradeReveal-=dt;if(upgradeReveal<=0)openUpgradeDialog();}
  else if(upgradeLock>0){upgradeLock=Math.max(0,upgradeLock-dt);if(upgradeLock<=0)$('dialog').classList.remove('choiceLock');}
 }else if(mode==='menu'){for(const {v}of visuals.values())updateCharacterVisual(v,false,dt,0);if(playerVisual)updateCharacterVisual(playerVisual,false,dt,0);}
 updateAuras(dt);conversionTimer=Math.max(0,conversionTimer-dt);$('infectionFeedback').style.opacity=conversionTimer>0?1:0;hurtTimer=Math.max(0,hurtTimer-dt);$('hurtVignette').style.opacity=hurtTimer>0?Math.min(.9,hurtTimer/.55):0;$('damageVignette').style.opacity=shake>0?.7:0;updateCamera(dt);if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').style.opacity=0;}hudTimer-=dt;if(hudTimer<=0&&assets){hudTimer=.1;hud();}renderer.render(scene,camera);
}
requestAnimationFrame(frame);
try{assets=await loadCharacterAssets();playerVisual=createCharacterVisual(assets,'player',1);scene.add(playerVisual.holder);playerVisual.holder.position.set(player.x,world.heightAt(player.x,player.z),player.z);playerVisual.holder.rotation.y=Math.PI;initUnits();scatterPickups();if(import.meta.env.DEV&&new URLSearchParams(location.search).get('test')==='boss'){state.infected=40;state.highestEnemy=5;state.mission=4;state.pending=0;state.weapon=0;state.abilities.guns=3;player.z=-15;world.towers.forEach(o=>{o.dead=true;o.g.visible=false;});units.forEach(u=>{u.dead=true;visuals.get(u.id).v.holder.visible=false;});}if(import.meta.env.DEV&&new URLSearchParams(location.search).get('test')==='melee'){state.pending=0;alerted=true;units.forEach(u=>{u.dead=true;visuals.get(u.id).v.holder.visible=false;});const p=world.nearest(player.x,player.z+1.15,1);const cop=makeUnit(900,1,p.x,p.z,false,0);cop.attackCd=0;units.push(cop);actorVisual(cop);}mode='menu';$('start').disabled=false;$('start').innerHTML='都给我醒过来！ <span>↗</span>';$('loading').textContent='开局 Lv.1 · 先选择一次变异能力';const saved=loadSaved();if(saved){$('continue').hidden=false;$('continue').textContent=`继续 · Lv.${saved.state.level} · 城市已感染 ${Math.floor(saved.state.cityInfected/POPULATION*100)}%`;}}
catch(error){console.error(error);$('loading').textContent='角色资源载入失败，请刷新页面重试。';$('start').textContent='刷新重试';$('start').disabled=false;$('start').onclick=()=>location.reload();}
window.gameSnapshot=()=>({mode,...state,team:teamCount(units),position:{...player},units:units.map(u=>({id:u.id,kind:u.kind,type:u.type,x:u.x,z:u.z,hp:u.hp,infection:u.infection,corpseTime:u.corpseTime})),pickups:pickups.map(p=>({x:p.x,z:p.z})),characterModel:!!assets,sceneName:'日式河畔城市·体素版',buildings:world.buildings.length,spawn:world.spawn,renderCalls:renderer.info.render.calls,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z}});
window.gameTune=()=>spawnPlan(state,units);
window.TUNE=TUNE;
