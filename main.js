import {createFeedbackVisibility} from './feedback-visibility.js';
import {createCameraCutaway} from './camera-cutaway.js';
import {HIT_RESPONSE,flashCharacter,stepHitStop} from './hit-response.js';
import {createCombatUI} from './combat-ui.js';
import {selectedMap} from './maps.js';
import {createComicAbilityFX,resolveComicAim,launchComicBallistic,stepComicBallistic,stepComicNeedle,createFleshProgressHUD} from './comic-fx.js';
import {createPointerLock} from './pointer-lock.js';
import * as T from 'three';
import {createBoss,hitBoss as baseHitBoss,animateBoss,canBossBombTarget} from './boss.js';
import {createFirearms} from './guns.js';
import {createSyringe} from './syringe.js';
import {loadCharacterAssets,createCharacterVisual,setCharacterKind,playCharacterAttack,playCharacterJump,updateCharacterVisual,characterHeight,setCharacterHeight,PROFESSIONS,acquireCharacterVisual,releaseCharacterVisual,warmCharacterPool,visualPoolKey} from './characters.js';
import {OutlineFilter,createFilterBlitter} from './outline-filter.js';
import {ToonFilter} from './toon-filter.js';
import {block} from './world.js';
import {bridgeDeckHeight,loadRiverside} from './riverside-world.js';
import {Soundtrack} from './music.js';
import {ABILITIES,kindlingSpec,kindlingStacks,kindlingMultiplier,releaseKindlingPulses,ENEMIES,GUNS,POPULATION,STAMINA_MAX,makeState,ownedAbilities,makeUnit,resetUnit,hit,upgrade,choices,rerollChoice,hasRerollPool,stepSimulation,damageAlly,distance,threat,outcome,speed,teamCount,hurtMother,bossReady,spawnPlan,TUNE,resetTune,applyTune,setTuneValue,meleeSpec,gunInfection,guardWanted,guardMissing,levelCap,isRangedEnemy,hostileWindup,stepHostileMelee,beginShieldCharge,stepShieldCharge,shieldChargeHits,beginPurifierSpray,stepPurifierSpray,purifierConeHit,upgradeAutoGap,LAUNCHER_SLOT,launcherSpec,consumePowerCharge,recordPowerHit,canChargePower,POWER_HITS,hasLauncher,weaponSlots,allyTemplate,grenadeBlast,makeSpawnQueue,enqueueSquads,takeSquadJob,hiddenSpawn,reinforcementCandidate,stepIngress,REINFORCEMENT_LIMITS,allyMelee,allySeeksHostile,guardMoveTarget,GUARD_LEASH,tickRunClock,alertValue,ALERT_NAMES,radioBackup,AIRSTRIKE,planePhase,onStrafeLane,tankTreadKind,tankShove,isMechanical,publishWeakenTasks,completeWeaken,closeWeakenTasks,bossWeakenMods,WEAKEN_TASKS,isStreetCivilian,isStreetPatrol,shouldCullTroop,planCivilianSpot,streetStroll,collectPickup,PICKUP_CONFIG,potionMultiplier,stepSprint,civilianTarget,xpNeedFor,cityRegion,regionSpawnSpot,refreshStats,AIR_SPAWN_RANGE,AIR_CLOUD_RADIUS,FLESH_RADIUS} from './rules.js';
const mapConfig=selectedMap(location.search);
const $=id=>document.getElementById(id),canvas=$('game');
const pointerLock=createPointerLock(canvas,(message,seconds)=>toast(message,seconds));
// 点开始、继续、关地图或选完卡时锁住鼠标，画面跟着鼠标转。选卡和暂停会先放开。
function captureView(){if(showDebug||window.__propUi)return;void pointerLock.request({quiet:true});}
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const music=new Soundtrack();let mode='loading',state=makeState(),units=[],player={x:0,z:-7,y:0,vy:0,crouch:false,roll:0,rollX:0,rollZ:1},world,assets;let hurtTimer=0,lastHp=null;
const PLAYER_HEIGHT=characterHeight('player'),STANDING_CHEST=PLAYER_HEIGHT*.72,CROUCH_CHEST=PLAYER_HEIGHT*.45,ROLL_DURATION=.72,ACTION_BUFFER=.18,JUMP_SPEED=7,GRAVITY=18;
const FX_SCALE=PLAYER_HEIGHT/2.25;
let yaw=0,pitch=.08,cameraDistance=2.7,mouseHeld=false,dragging=false,lastMouse=null,attackCd=0,breakCd=0,rushCd=0,reinforceTimer=24,reinforceDirection=0,reinforceAnnounced=false,totalReinforcements=0,invincible=0,toastTime=0,saveTimer=0,shake=0,target=null,frameDelta=0,choiceSet=[],upgradeLock=0,upgradeTimer=0;
// 负值是抬头，大约 60 度才能瞄到头顶的飞机。
// 低头按镜头高度算：准星打到地面的位置必须在角色前方，不能落到人和镜头之间。
const PITCH_UP=-1.05;
function maxLookDown(){
 const camY=player.crouch?PLAYER_HEIGHT*.82:PLAYER_HEIGHT*1.15;
 return Math.atan(camY/((cameraDistance||2.7)+.65));
}
// 中枢改到出生点同岸后，旧存档的物件坐标已不兼容。
let settings={volume:.38,sensitivity:1,quality:'standard'};const SAVE_KEY=mapConfig.saveKey,SAVE_VERSION=11;const debugQuery=new URLSearchParams(location.search);let showDebug=debugQuery.has('debug');let alerted=false,switchTime=0,nextWeapon=-1,reloadTime=0,conversionCount=0,conversionTimer=0,missionTimer=0,policeAlertTimer=0,bossVictoryHold=0,bossMissionTimer=0,nextActorId=100,ramTimer=0;let alarmSurge=0;let rollBuffered=0,jumpBuffered=0;let squadIds=new Set(),choiceRerolls=[false,false,false],choiceSeen=new Set();
const spawnQueue=makeSpawnQueue(),unitPool=[],recentSpawnPoints=[];
let fodderTimer=10;
try{settings={...settings,...JSON.parse(localStorage.getItem('groundzero-settings')||'{}')};}catch{}
music.volume=settings.volume;
const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xffffff);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.32;
// Roboquest 风格化描边：片元程序来自原版 DXBC，输入绑诊断重建。?outline=0 可关掉。
const outlineQuery=new URLSearchParams(location.search).get('outline'),outlineFilter=new OutlineFilter(renderer);
outlineFilter.enabled=outlineQuery!=='0';
// ?outline=0.5 这类数字直接当描边半径用，不写数字就用默认 1，?outline=0 关闭。
const outlineRadius=parseFloat(outlineQuery);if(Number.isFinite(outlineRadius)&&outlineRadius>0)outlineFilter.radius=outlineRadius;
// ?nativeline=1 打开原版 DXBC 描边 pass（默认关：它会以主角为界立一张平面，平面另一侧不出线）。
outlineFilter.lines=new URLSearchParams(location.search).get('nativeline')==='1';
const blitFilter=createFilterBlitter();
outlineFilter.init().then(()=>{if(outlineFilter.enabled){console.log('[outline] Roboquest 描边滤镜已启用 · 半径',outlineFilter.radius);toast('Roboquest 描边滤镜已启用',2.6);}}).catch(error=>{console.warn('[outline] 未启用描边滤镜：',error.message);outlineFilter.enabled=false;});
// 风格化厚涂三渲二：?toon=0 关掉，?toon=2 之类数字改明暗档数。串在描边之后。
const toonQuery=new URLSearchParams(location.search).get('toon'),toonFilter=new ToonFilter(renderer);
toonFilter.enabled=toonQuery!=='0';
const toonLevels=parseFloat(toonQuery);if(Number.isFinite(toonLevels)&&toonLevels>=2)toonFilter.levels=toonLevels;
// ?shadow=0.6 调阴影强度（0 不吃阴影，1 完全冷色）；?shadowtint=r,g,b / ?shadowshift=r,g,b 直接调暗部颜色
const shadowQuery=parseFloat(new URLSearchParams(location.search).get('shadow'));if(Number.isFinite(shadowQuery)&&shadowQuery>=0&&shadowQuery<=1)toonFilter.shadow=shadowQuery;
const vecQuery=k=>{const v=new URLSearchParams(location.search).get(k);if(!v)return;const a=v.split(',').map(Number);if(a.length===3&&a.every(Number.isFinite))toonFilter[k==='shadowtint'?'shadowTint':'shadowShift']=a;};
vecQuery('shadowtint');vecQuery('shadowshift');
// ?sat=1.6 ?con=1.2 ?hi=0.5 直接调厚涂的饱和、对比和顶光强度
const satQuery=parseFloat(new URLSearchParams(location.search).get('sat'));if(Number.isFinite(satQuery))toonFilter.saturation=satQuery;
const conQuery=parseFloat(new URLSearchParams(location.search).get('con'));if(Number.isFinite(conQuery))toonFilter.contrast=conQuery;
const hiQuery=parseFloat(new URLSearchParams(location.search).get('hi'));if(Number.isFinite(hiQuery))toonFilter.hi=hiQuery;
// ?copheight=1.5 调变异警察的身高（现实米数，默认 1.55；普通警察是 1.75）
const copHeightQuery=parseFloat(new URLSearchParams(location.search).get('copheight'));if(Number.isFinite(copHeightQuery))setCharacterHeight('infectedCop',copHeightQuery);
// ?bright=1.25 整体明度倍率（1 = 不动）
const brightQuery=parseFloat(new URLSearchParams(location.search).get('bright'));if(Number.isFinite(brightQuery))toonFilter.exposure=brightQuery;
toonFilter.init().then(()=>{if(toonFilter.enabled){console.log('[toon] 厚涂三渲二已启用 · 明暗档数',toonFilter.levels);toast('厚涂三渲二已启用',2.6);}}).catch(error=>{console.warn('[toon] 未启用厚涂三渲二：',error.message);toonFilter.enabled=false;});
const scene=new T.Scene();scene.fog=new T.Fog(0xffffff,16,52);
// 纯白 0xffffff 经 ACES 会被压成灰白，想让雾「真白」就得给超过 1 的 HDR 值。
scene.fog.color.setRGB(1.18,1.18,1.2);scene.add(new T.HemisphereLight(0xe5f1f5,0x8d9281,2.2));const sun=new T.DirectionalLight(0xffefda,2.8);sun.position.set(-28,55,-22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-52,right:52,top:52,bottom:-52,near:1,far:140});sun.shadow.bias=-.0003;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
// 紫雾可见范围可用 ?fog=近距,远距 调，比如 ?fog=10,40 更闷、?fog=40,120 更通透。
const fogQuery=(new URLSearchParams(location.search).get('fog')||'').split(',').map(Number);
if(fogQuery.length===2&&fogQuery.every(Number.isFinite)){scene.fog.near=fogQuery[0];scene.fog.far=fogQuery[1];}
// 两关要同一个观感，所以记下这套雾参数；海滨那关的环境包建场景时会自己 new 一个 Fog 盖掉它，
// 世界加载完再写回一次（见 applyGameFog）。
const gameFog={color:scene.fog.color.clone(),near:scene.fog.near,far:scene.fog.far};
// 雾只在开局后拉满：菜单要能看清整张地图做预览，所以菜单期间把雾推到看不到的距离（等于关掉）。
// 直接置 null 会让全场材质重编译，改 near/far 只是 uniform 变化，切换是瞬间的。
function fogVisible(){return mode!=='menu'&&mode!=='loading';}
function syncFogMode(){
 if(!scene.fog)return;
 const near=fogVisible()?gameFog.near:4000,far=fogVisible()?gameFog.far:5000;
 if(scene.fog.near!==near||scene.fog.far!==far){scene.fog.near=near;scene.fog.far=far;}
}
function applyGameFog(){
 // 环境包给的是 70~1500 / 主题里 25~900，远景几乎不吃雾，跟河畔完全两个观感。
 // 这里统一成本作的数值；雾色也一起换，否则海滨会拿天空色当雾色。
 if(!scene.fog||!scene.fog.isFog)scene.fog=new T.Fog(0xffffff,gameFog.near,gameFog.far);
 scene.fog.color.copy(gameFog.color);scene.fog.near=gameFog.near;scene.fog.far=gameFog.far;
}
// 描边是后处理，不受三维雾影响；后处理里再按深度补一层雾，让远处描边同步被雾吃掉。
// ?fogpass=0 关掉这层补偿，?fogpass=0.6 减弱。
const fogPassQuery=parseFloat(new URLSearchParams(location.search).get('fogpass')),fogPassAmount=Number.isFinite(fogPassQuery)?fogPassQuery:1;
// 原描边（DXBC 反编译）只朝一个方向采样，物体经常只有一侧有线 —— 转到另一侧看就「没描边」。
// 这段用中心差分把左右上下都采一遍，方向无关，任何朝向的边都出线（= 全向描边）。?edgepass=0 可关。
const edgeQuery=parseFloat(new URLSearchParams(location.search).get('edgepass')),edgePassAmount=Number.isFinite(edgeQuery)?edgeQuery:1;
// 阈值 = 相邻像素的法线差到多大才算边（1 - cos 夹角）：0.3 ≈ 45°，0.15 ≈ 31°，0.6 ≈ 76°。
// 地面是平面、法线处处相同，所以差恒为 0，不会被误判成边。?edgethr=0.15 连缓转折也描。
const edgeThrQuery=parseFloat(new URLSearchParams(location.search).get('edgethr')),edgeThreshold=Number.isFinite(edgeThrQuery)?edgeThrQuery:.3;
// 线色默认纯黑。?edgecolor=r,g,b 可调（比如 ?edgecolor=0.16,0.15,0.20 回到深冷灰）。
const edgeColorRaw=(new URLSearchParams(location.search).get('edgecolor')||'').split(',').map(Number);
const edgeColor=edgeColorRaw.length===3&&edgeColorRaw.every(Number.isFinite)?edgeColorRaw:[0,0,0];
// 按距离整片抹掉描边。默认关：它会在视野里切出一道以相机为界、跟着主角移动的「无描边」分界平面。
// 远处该消失交给雾（雾把线和场景一起吞），该变细交给 edgefar / edgefarthr。?linefade=1 可开回来。
const lineFadeQuery=parseFloat(new URLSearchParams(location.search).get('linefade')),lineFade=Number.isFinite(lineFadeQuery)?lineFadeQuery:0;
const lineFadeRaw=(new URLSearchParams(location.search).get('linefaderange')||'').split(',').map(Number);
// 描边渐隐：[起淡距离, 过渡宽度]。
// 放在雾「后半段」：物体到这个距离已经白掉大半，描边跟着一起消失就看不出分界。
// 早先放在 10~18 米，物体还清清楚楚描边却没了，那道边界看着就像以主角为中心立了张平面。
const fogFade=scene.fog?(scene.fog.far-scene.fog.near)*.5:12;
const lineFadeRange=lineFadeRaw.length===2&&lineFadeRaw.every(Number.isFinite)?lineFadeRaw:[scene.fog?scene.fog.near+fogFade:10,fogFade];
// 线宽 = 采样步长，1.0 是下限（shader 里 max(...,1.0)），也就是最细的一档。?edgestep=2.4 可加粗。
const edgeStepQuery=parseFloat(new URLSearchParams(location.search).get('edgestep')),edgeStep=Number.isFinite(edgeStepQuery)?edgeStepQuery:1;
// ?edgefar=0.6 让远处线更细（远处采样步长 = edgeStep × 这个值）。
// 默认中性 1：任何随距离变化的参数都会在某个距离跨过临界值，画出一圈等值线，看着又像一张平面。
const edgeFarQuery=parseFloat(new URLSearchParams(location.search).get('edgefar')),edgeFarScale=Number.isFinite(edgeFarQuery)?edgeFarQuery:1;
// ?edgefarthr=3 远处少画线（阈值倍率，越大远处线越少越细）；?edgefarlighten=1 远处线色并入雾色（越轻）
// 线要纯黑，这个值就不能给高，否则远处的线又被雾色冲成灰的；0.35 只在很远处淡一点。
const edgeCutQuery=parseFloat(new URLSearchParams(location.search).get('edgecut'));if(Number.isFinite(edgeCutQuery)&&edgeCutQuery>0)lineFadeRange[0]=edgeCutQuery;
// 同上，默认中性 1（远处阈值不抬高）。?edgefarthr=1.5 可让远处弱边少画一点，但会带回等值线。
const edgeFarThrQuery=parseFloat(new URLSearchParams(location.search).get('edgefarthr')),edgeFarThreshold=Number.isFinite(edgeFarThrQuery)?edgeFarThrQuery:1;
const edgeFarLitQuery=parseFloat(new URLSearchParams(location.search).get('edgefarlighten')),edgeFarLighten=Number.isFinite(edgeFarLitQuery)?edgeFarLitQuery:.35;
const camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.12,180);camera.position.set(8,8,-21);camera.lookAt(0,3,5);
$('mapSelect').value=mapConfig.id;$('mapSelect').onchange=e=>{const url=new URL(location.href);url.searchParams.set('map',e.target.value);location.href=url.href;};$('mapName').textContent=mapConfig.hud;$('regionName').textContent=mapConfig.name;
try{world=mapConfig.id==='tidewater'?await (await import('./vendor/tidewater-package.js')).loadTidewater(scene,renderer,{quality:settings.quality}):await loadRiverside(scene);}catch(error){console.error(error);$('loading').textContent='场景加载失败，请刷新重试';$('start').textContent='刷新重试';$('start').disabled=false;$('start').onclick=()=>location.reload();throw error;}applyGameFog();Object.assign(player,world.spawn);yaw=mapConfig.id==='tidewater'?0:Math.PI;const menuHero=world.nearest(-10,10,.55);const boss=createBoss(scene),firearms=createFirearms(),syringe=createSyringe();
firearms.root.scale.setScalar(PLAYER_HEIGHT/1.1);
// 注射枪按 2.25 身高做的，人物缩小后武器跟着缩。
syringe.g.scale.setScalar(PLAYER_HEIGHT/2.25);
const weaponPivot=new T.Group();scene.add(weaponPivot);weaponPivot.add(firearms.root);weaponPivot.add(syringe.g);
const visuals=new Map(),particles=[],waves=[],tracers=[],auraVisuals=new Map();let playerVisual;
// 敌方子弹共用一批模型，打完藏起来下次再拿，不再每次新建和扔掉。
// 敌方和我方攻击特效分开。敌方用红色，让人一眼看出要躲；我方用紫色，跟觉醒光环同一套。
const STRIKE={enemy:{bullet:0xff2b2b,telegraph:0xff2a2a,slam:0xff1e1e,spark:0xff4d4d,spray:0xff3333,bomb:0xff2424,glow:0xff5a5a},ally:{bullet:0xd7b4ff,telegraph:0xb85cff,slam:0xb85cff,spark:0xe6d4ff,spray:0xc084fc,bomb:0xb85cff,glow:0xe4d0ff}};
const bulletPool=[],bulletGeo=new T.BoxGeometry(1,1,1),enemyBulletMat=new T.MeshBasicMaterial({color:STRIKE.enemy.bullet}),allyBulletMat=new T.MeshBasicMaterial({color:STRIKE.ally.bullet});
function acquireEnemyBullet(x,y,z,ally=false){
 let m=bulletPool.pop();
 if(!m){m=new T.Mesh(bulletGeo,enemyBulletMat);m.castShadow=false;m.receiveShadow=false;scene.add(m);}
 m.material=ally?allyBulletMat:enemyBulletMat;
 m.scale.set(ally?.16:.07,ally?.16:.07,ally?.22:.62);
 m.position.set(x,y,z);m.visible=true;return m;
}
function releaseEnemyBullet(m){
 if(!m)return;m.visible=false;m.position.set(0,-40,0);
 if(bulletPool.length<96)bulletPool.push(m);else scene.remove(m);
}
for(let i=0;i<24;i++){const m=new T.Mesh(bulletGeo,enemyBulletMat);m.castShadow=false;m.receiveShadow=false;m.visible=false;scene.add(m);bulletPool.push(m);}
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
function applyQuality(){renderer.setPixelRatio(settings.quality==='low'?1:Math.min(devicePixelRatio,1.5));sun.castShadow=settings.quality!=='low';renderer.shadowMap.enabled=settings.quality!=='low';renderer.setSize(innerWidth,innerHeight);world?.setQuality?.(settings.quality);}
applyQuality();function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
const particlesGeometry=new T.BoxGeometry(.12,.12,.12),particleMaterials=new Map();
function burst(x,y,z,color,count=10,speed=5){if(particles.length>420)return;let mat=particleMaterials.get(color);if(!mat){mat=new T.MeshBasicMaterial({color});particleMaterials.set(color,mat);}const room=Math.max(0,420-particles.length);count=Math.min(count,room);for(let i=0;i<count;i++){const m=new T.Mesh(particlesGeometry,mat);m.position.set(x,y,z);m.scale.setScalar(.8+Math.random()*1.5);scene.add(m);particles.push({m,v:new T.Vector3((Math.random()-.5)*speed,Math.random()*speed*.9+1,(Math.random()-.5)*speed),life:.4+Math.random()*.7});}}
function wave(x,z,r,color=0xb473ec){const m=new T.Mesh(new T.RingGeometry(.92,1,40),new T.MeshBasicMaterial({color,transparent:true,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,.15,z);scene.add(m);waves.push({m,r,t:0});return m;}
function aura(key,x,z,r,color){let a=auraVisuals.get(key);if(!a){const pts=[];for(let i=0;i<64;i+=2){pts.push(new T.Vector3(Math.cos(i/64*Math.PI*2),0,Math.sin(i/64*Math.PI*2)),new T.Vector3(Math.cos((i+1)/64*Math.PI*2),0,Math.sin((i+1)/64*Math.PI*2)));}a=new T.LineSegments(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color,transparent:true,opacity:.7}));scene.add(a);auraVisuals.set(key,a);}a.position.set(x,.12,z);a.scale.set(r,1,r);a.material.color.setHex(color);a.visible=true;return a;}
function toast(text,duration=3){$('toast').textContent=text;$('toast').style.opacity=1;toastTime=duration;}
function flashPoliceAlert(html,className,duration){
 const alert=$('policeAlert');
 alert.innerHTML=html;
 alert.classList.remove('active','upgrade','boss','win','quest','radio');void alert.offsetWidth;
 alert.classList.add('active',...className.split(' '));policeAlertTimer=duration;
}
function showBossArrival(){
 if(boss.announced||!boss.active||boss.dead)return;
 boss.announced=true;
 flashPoliceAlert('<strong>蛙</strong><small>BOSS现身</small><b>蛙来！</b>','boss',2.8);
 bossMissionTimer=2.9;
 music.effect('alertUp');
}
function showBossMission(){
 if(!boss.active||boss.dead||boss.missionAnnounced)return;
 boss.missionAnnounced=true;
 flashPoliceAlert('<strong>任</strong><small>BOSS现身</small><b>任务：带领市民们逃离规训！</b>','boss quest',3.4);
 music.effect('alertUp');
}
function showBossVictory(){
 toastTime=0;$('toast').style.opacity=0;
 flashPoliceAlert('<strong>胜</strong><small>余韵</small><b>秩序失去警戒</b><em>可以继续走一走，准备好再结束本局。</em>','boss win',4.2);
 bossVictoryHold=0;
 const end=$('endAftermath');if(end)end.hidden=false;
 music.effect('upgrade');
}
function updateChargeRing(){
 const el=$('crosshair'),visible=canChargePower(state)&&(holdingLauncher()||!!activeGun());
 const charge=state.powerCharge||0,ready=visible&&charge>=POWER_HITS;
 $('chargeRings').toggleAttribute('hidden',!visible);$('chargeStatus').hidden=!visible;
 $('hud').classList.toggle('charging',visible);
 el.classList.toggle('ready',ready);
 document.querySelectorAll('.chargeFill circle').forEach((ring,i)=>ring.classList.toggle('filled',i<charge));
 $('chargeStatus').textContent=ready?'强化就绪 · 下一发':`${charge} / ${POWER_HITS}`;
}
function pulseAim(className){
 const el=$('crosshair');el.classList.remove(className);void el.offsetWidth;el.classList.add(className);
}
$('crosshair').addEventListener('animationend',e=>{
 if(e.animationName==='ui-aim-hit')$('crosshair').classList.remove('hit');
 if(e.animationName==='ui-charge-release')$('crosshair').classList.remove('discharged');
});
function onPlayerProjectileHit(projectile){
 const shot=projectile.chargeShot;
 if(!shot)return;
 if(!shot.feedback){pulseAim('hit');shot.feedback=true;}
 if(recordPowerHit(state,shot)){
  music.effect('chargeTick',state.powerCharge*2);
  if(state.powerCharge===POWER_HITS)music.effect('chargeReady');
  updateChargeRing();
 }
}
function createPowerOrb(x,y,z){
 const material=new T.MeshStandardMaterial({color:0xdca0ff,emissive:0x9d32e8,emissiveIntensity:3,roughness:.25});
 const orb=new T.Mesh(new T.IcosahedronGeometry(.38,1),material);orb.position.set(x,y,z);orb.castShadow=true;
 orb.add(new T.PointLight(0xc06fff,2.5,4));scene.add(orb);return orb;
}
function releasePowerWave(x,z,damage=12,infection=32){
 wave(x,z,7.5,0xe2a0ff);wave(x,z,5.5,0xb94fff);wave(x,z,3.4,0xf0c8ff);burst(x,STANDING_CHEST,z,0xe4adff,75);world.breakAt(x,z,5.5,110,burst);
 for(const [radius,color,opacity]of[[5.2,0xc75cff,.72],[3.8,0xf0c5ff,.5]]){const blast=new T.Mesh(new T.SphereGeometry(1,20,14),new T.MeshBasicMaterial({color,transparent:true,opacity,wireframe:true,blending:T.AdditiveBlending,depthWrite:false}));blast.position.set(x,world.heightAt(x,z)+.55,z);scene.add(blast);waves.push({m:blast,r:radius,t:0});}
 if(Math.hypot(player.x-x,player.z-z)<15)shake=Math.max(shake,.2);
 for(const u of units)if(!u.dead&&!u.converted&&u.kind!=='corpse'&&Math.hypot(u.x-x,u.z-z)<=6)applyHit(u,infection,damage,false,{x,z});
 if(boss.active&&!boss.dead&&Math.hypot(boss.x-x,boss.z-z)<=6)hitBoss(boss,Math.max(90,damage*2));
 music.effect('powerImpact');
}
function detonatePowerShot(projectile){
 if(!projectile.strong)return false;
 projectile.strong=false;releasePowerWave(projectile.x,projectile.z,projectile.damage,projectile.infection);return true;
}
function updatePowerShot(projectile,dt){
 const oldX=projectile.x,oldZ=projectile.z;projectile.x+=projectile.vx*dt;projectile.z+=projectile.vz*dt;projectile.vy-=8.5*dt;projectile.y+=projectile.vy*dt;
 projectile.m.rotation.x+=dt*5;projectile.m.rotation.z+=dt*7;projectile.trail-=dt;
 if(projectile.trail<=0){burst(projectile.x,projectile.y,projectile.z,0xc66fff,2);projectile.trail=.07;}
 // 强化炮弹撞墙会弹开，落地才爆炸。
 if(world.solid(projectile.x,projectile.z,.2)){projectile.x=oldX;projectile.z=oldZ;projectile.vx*=-.28;projectile.vz*=-.28;projectile.vy=Math.max(1.2,projectile.vy*.35);music.effect('powerBounce');}
 const ground=world.heightAt(projectile.x,projectile.z);
 if(projectile.vy<=0&&ground>-2&&projectile.y<=ground+.38){projectile.y=ground+.38;detonatePowerShot(projectile);projectile.life=0;}
 projectile.m.position.set(projectile.x,projectile.y,projectile.z);
}
const TUNE_KEY='wake-up-tokyo-tune-v2';
const TUNE_FIELDS=[
 {group:'城市警戒',note:'按累计经验升档，不看等级。每 3 点经验加 1 点警戒，10 / 100 / 300 / 500 升档。时间每秒再加 0.1。感染人数本身不加。'},
 {path:'alert.stage2At',label:'局部警情警戒值',min:0,max:500,step:10},
 {path:'alert.stage3At',label:'城市封锁警戒值',min:0,max:800,step:10},
 {path:'alert.maxLevel1',label:'I 档最高兵级',min:1,max:6,step:1},
 {path:'alert.maxLevel2',label:'II 档最高兵级',min:1,max:6,step:1},
 {path:'alert.maxLevel3',label:'III 档最高兵级',min:1,max:6,step:1},
 {path:'alert.pressureTime',label:'击杀+转化折算秒数',min:0,max:8,step:.1},
 {group:'动态难度',note:'按等级和转化友军阶级计算权重；护卫不计队伍权重。按敌方权重缺口投放，耗材库存独立每 10 秒检查。'},
 {path:'difficulty.playerBase',label:'自身基础权重',min:0,max:300,step:10},
 {path:'difficulty.playerPerLevel',label:'每级增加权重',min:0,max:50,step:1},
 {path:'difficulty.maxWaveRatio',label:'单波预算比例',min:.05,max:1,step:.05},
 {path:'difficulty.bossWeightRatio',label:'Boss 战预算倍率',min:1,max:2,step:.05},
 {path:'difficulty.intervalMin',label:'普通最短间隔（秒）',min:1,max:20,step:1},
 {path:'difficulty.intervalMax',label:'普通最长间隔（秒）',min:1,max:40,step:1},
 {path:'difficulty.bossIntervalMin',label:'Boss 最短间隔（秒）',min:1,max:20,step:1},
 {path:'difficulty.bossIntervalMax',label:'Boss 最长间隔（秒）',min:1,max:40,step:1},
 {path:'difficulty.spawnPerBurst',label:'每帧投放上限',min:1,max:1,step:1},
 {path:'difficulty.spawnGap',label:'组内间隔（秒）',min:.02,max:.5,step:.01},
 {path:'difficulty.spawnQueueMax',label:'排队上限',min:4,max:18,step:1},
 {group:'转化活跃',note:'转化前行尸慢走，转化后满街乱跑。改完立刻生效。'},
 {path:'activity.shambleSpeed',label:'转化前移速',min:.1,max:3,step:.05},
 {path:'activity.shambleRadius',label:'转化前徘徊半径',min:1,max:20,step:.5},
 {path:'activity.shambleIdle',label:'转化前发呆（秒）',min:.5,max:20,step:.5},
 {path:'activity.awakeSpeed',label:'转化后乱跑速度',min:1,max:10,step:.1},
 {path:'activity.awakeRadius',label:'转化后乱跑半径',min:6,max:80,step:1},
 {path:'activity.awakeIdle',label:'转化后换目标（秒）',min:.2,max:6,step:.05},
 {path:'activity.chaseSpeed',label:'转化后追敌',min:1,max:10,step:.1},
 {path:'activity.followSpeed',label:'召集跟随',min:1,max:12,step:.1},
 {path:'activity.structureSpeed',label:'拆中枢速度',min:1,max:10,step:.1}
];
function tuneValue(path){const [g,k]=path.split('.');return TUNE[g][k];}
function persistTune(){try{localStorage.setItem(TUNE_KEY,JSON.stringify(TUNE));}catch{}}
function loadTune(){try{
 const saved=JSON.parse(localStorage.getItem(TUNE_KEY)||'null'),d=saved?.difficulty;
 // Migrate only the previous default pacing; preserve deliberately customized intervals.
 if(d?.intervalMin===10&&d.intervalMax===20){d.intervalMin=3;d.intervalMax=5;}
 if(d?.bossIntervalMin===8&&d.bossIntervalMax===15){d.bossIntervalMin=2;d.bossIntervalMax=4;}
 if(d?.spawnGap===.08)d.spawnGap=.18;
 if(d)d.spawnPerBurst=1;
 applyTune(saved);
 }catch{}}
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
 $('tuneWave').onclick=()=>{if(mode!=='playing'||boss.active){toast('进局后再打增援',1.5);return;}alerted=true;const plan=spawnReinforcement();reinforceTimer=plan?.interval??TUNE.difficulty.intervalMin;updateTuneLive();};
}
function setTuneOpen(open){showDebug=open;buildTuneHud();const box=$('tuneHud');if(!box)return;box.hidden=!open;if(open){pointerLock.release();syncTuneInputs();updateTuneLive();}}
function toggleDebug(){setTuneOpen(!showDebug);}
function updateTuneLive(){const live=$('tuneLive');if(!live||!showDebug)return;const plan=spawnPlan(state,units,Math.random,player);const names=plan.types.map(t=>ENEMIES[t].name);const count=names.reduce((m,n)=>(m[n]=(m[n]||0)+1,m),{});const mix=Object.entries(count).map(([n,c])=>`${n}×${c}`).join(' · ')||'无';live.textContent=`时间 ${state.time.toFixed(1)}s · 警戒 ${['','I','II','III'][plan.stage]}${plan.final?' 终局':''} · 最高兵级 ${plan.maxLevel}
权重 ${plan.weight.toFixed(2)} · 敌方 ${plan.enemyWeight.toFixed(1)} · 单波预算 ${plan.waveBudget.toFixed(1)}
下波 路边平民×${plan.civilians.length} 巡逻×${plan.patrol.length} 视线外冲锋×${plan.rush.length} · 间隔 ${plan.interval.toFixed(1)}s · 倒计时 ${Math.max(0,reinforceTimer).toFixed(1)}s
排队投放 ${spawnQueue.jobs.length} · 每批 ${TUNE.difficulty.spawnPerBurst} 人
预览 ${mix}`;}
loadTune();
// 调试面板会把整份参数存下来，旧存档里的 180 秒不能把倒计时盖回 3 分钟。
TUNE.alert.countdown=120;
if(showDebug)setTuneOpen(true);
function unitName(u){
 if(u.converted||u.kind==='ally'){
  if(u.type===0)return PROFESSIONS[u.profession]||ENEMIES[0].allyName;
  return ENEMIES[u.type].allyName||ENEMIES[u.type].name;
 }
 return u.type===0?PROFESSIONS[u.profession]:ENEMIES[u.type].name;
}
// 我方军队只在自己大约 22 米的视野里显示。再远就收起模型，逻辑还在，避免满屏骨骼把画面卡死。
const ALLY_VIEW=22,ENEMY_VIEW=46,VISUAL_BUDGET=72;
const viewScratch=new T.Vector3(),actorFrustum=new T.Frustum(),actorProjection=new T.Matrix4(),actorSphere=new T.Sphere();
function actorViewLimit(u){if(u.kind==='corpse')return 40;if(u.converted||u.kind==='ally')return ALLY_VIEW;return ENEMY_VIEW;}
function actorInFront(u,d){
 // Cull the complete actor against the real camera frustum, with room for moving limbs.
 const lift=u.knock>0?Math.sin((1-Math.min(1,u.knock))*Math.PI)*1.15:0;
 actorSphere.center.set(u.x,world.heightAt(u.x,u.z)+PLAYER_HEIGHT*.6+lift,u.z);
 actorSphere.radius=ENEMIES[u.type]?.tank?2:PLAYER_HEIGHT*1.1*(u.surge>0?1.3:1);
 return actorFrustum.intersectsSphere(actorSphere);
}
async function warmBattleVisuals(){
 let prepared=0;
 for(const [kind,count]of [['guard',48],['shieldCop',12],['batonCop',12],['ally',24]])for(let n=1;n<=count;n++){
  warmCharacterPool(assets,kind,n);
  $('loading').textContent=`准备战斗角色 ${++prepared} / ${VISUAL_BUDGET+24}`;
  await new Promise(resolve=>requestAnimationFrame(resolve));
 }
}
function makeTankShell(ally){
 const hull=new T.MeshStandardMaterial({color:ally?0x5c3d78:0x3e4a34,roughness:.55,metalness:.28});
 const dark=new T.MeshStandardMaterial({color:0x242820,roughness:.62,metalness:.2});
 const body=new T.Mesh(new T.BoxGeometry(1.35,.42,2.15),hull);body.position.y=.48;
 const turret=new T.Mesh(new T.BoxGeometry(.72,.32,.78),hull);turret.position.y=.82;
 const barrel=new T.Mesh(new T.BoxGeometry(.14,.14,1.15),dark);barrel.position.set(0,.82,.95);
 const left=new T.Mesh(new T.BoxGeometry(.22,.38,2.2),dark);left.position.set(-.72,.32,0);
 const right=left.clone();right.position.x=.72;
 const shell=new T.Group();shell.add(body,turret,barrel,left,right);
 shell.userData={ally,parts:[body,turret,barrel,left,right]};
 return shell;
}
function stripTankShell(v){
 if(!v?.tankShell)return;
 v.holder.remove(v.tankShell);
 for(const part of v.tankShell.userData.parts||[]){part.geometry?.dispose?.();part.material?.dispose?.();}
 v.tankShell=null;
 if(v.model)v.model.visible=true;
 if(v.root)v.root.visible=true;
}
// 坦克不用行人模型。阵营一变就换外壳颜色，尸体仍留着车体。
function syncTankShell(v,u){
 const want=!!ENEMIES[u.type]?.tank&&u.kind!=='expired'&&u.kind!=='fallen';
 const ally=u.kind==='ally'||!!u.converted;
 if(!want){stripTankShell(v);return;}
 if(v.tankShell&&v.tankShell.userData.ally!==ally)stripTankShell(v);
 if(!v.tankShell){v.tankShell=makeTankShell(ally);v.holder.add(v.tankShell);}
 if(v.model)v.model.visible=false;
 if(v.root)v.root.visible=false;
}
function actorVisual(u){
 // 感染前：持盾特警（type 3）/持棍巡警（type 1）用各自专属模型，武器和动作都在模型里，不加配件。
 // 感染后：换成变异形态，并把对应的盾牌/棍子配件挂到手上（见 attachCopProp）。
 const copKind=t=>t===3?'shieldCop':t===1?'batonCop':null;
 // 玩家护卫（u.guard）是「号令召集」来的警察，虽然也是 converted，但不走感染变身那一套，
 // 保持兵种原样 —— 否则开局就会冒出一个变异形态的警察。
 const copInfected=t=>(t===1||t===3)&&!!assets?.infectedCop;
 const kind=u.kind==='ally'?(u.type>0?((!u.guard&&copInfected(u.type))?'infectedCop':(copKind(u.type)||'guard')):'ally'):u.type===0?'human':(copKind(u.type)||'guard');
 const v=acquireCharacterVisual(assets,kind,u.profession);
 if(u.kind==='ally')setCharacterKind(v,'ally');
 v.holder.position.set(u.x,world.heightAt(u.x,u.z),u.z);
 v.holder.rotation.y=u.facingYaw??Math.random()*6.28; u.facingYaw=v.holder.rotation.y;
 if(typeof syncTankShell==='function')syncTankShell(v,u);
 attachCopProp(v,u);
 if(!v.holder.parent)scene.add(v.holder);
 visuals.set(u.id,{v,oldKind:u.kind});
 return v;
}
// 盾牌挂左前臂、棍子挂右手。配件是独立 OBJ，位置旋转还带不到模型里，所以留可调参数。
// 配件只给感染后的警察拿。变异形态是 Mixamo 骨骼（mixamorig*），
// 感染前的模型是另一套命名，两组名字都列出来，找到哪个挂哪个。
const PROP_XFORM={
 // 盾牌同理：OBJ 高 1 个单位，不缩放就和人一样高。默认值同样来自面板实测：
 // shieldpos=-0.1,0.195,0.02 · shieldscale=0.48
 // faceForward：盾牌必须定向 —— 盾面朝人物正前方、盾牌竖立，这样它才垂直于横在胸前的小臂。
 // 盾牌 OBJ 的法线在局部 +X、高度在 +Y，所以把这两根轴分别对齐到「前方」和「上方」。
 shield:{bones:['mixamorigLeftForeArm','forearmL','handL'],pos:propVec('shieldpos',[-.1,.195,.02]),rot:propVec('shieldrot',[0,0,0]),scale:propNum('shieldscale',.48),faceForward:true},
 // 配件的 OBJ 是按 1 个单位导出的，和人物身高差不多长，直接挂上去棍子会有整个人那么高。
 // 所以默认缩到 0.45（约到人腿中部），可用 ?batonscale= 微调。
 // gripEnd：棍子的 OBJ 原点在几何中心（y 范围 -0.5~0.5），按中心挂会有一半穿进手臂、
 // 一半露在外面，柄端不在手心。所以要沿长度方向再挪半个长度，且这个量跟随缩放。
 // angle = 棍子相对前臂的倾角（1.2217 弧度 = 70 度）。方向不写死欧拉角：
 // 手骨骼的局部轴和人物朝向并不是同一套，写死 X 轴旋转会歪到身体侧面去，
 // 所以按「人物正前方」这个向量实时算朝向（见 attachCopProp 的 aimForward）。
 // grip 是「柄端相对棍子中心的偏移量」占长度的比例，越小插进掌心越深。
 // 下面这组默认值是用 ?propui=1 面板对着画面调出来的：
 // batonpos=0.085,0.065,0.135 · batonangle=2.1 · batongrip=0.25 · batonscale=0.45
 baton:{bones:['mixamorigRightHand','handR'],pos:propVec('batonpos',[.085,.065,.135]),grip:propNum('batongrip',.25),angle:propNum('batonangle',2.1),rot:propVec('batonrot',[0,0,0]),scale:propNum('batonscale',.45),gripEnd:true,aimForward:true},
};
// 回归测试用 vm 沙箱跑这段代码，里面没有 location / URLSearchParams，所以要守卫。
function propQuery(key){return (typeof location!=='undefined'&&typeof URLSearchParams!=='undefined')?new URLSearchParams(location.search||'').get(key):null;}
function propVec(key,fallback){const raw=propQuery(key);if(!raw)return fallback;const a=raw.split(',').map(Number);return a.length===3&&a.every(Number.isFinite)?a:fallback;}
function propNum(key,fallback){const raw=propQuery(key);if(raw==null)return fallback;const n=Number(raw);return Number.isFinite(n)?n:fallback;}
function attachCopProp(v,u){
 const props=assets?.props;
 // 只有感染变异模型加配件；护卫和原警察模型已经自带武器。
 const eligible=props&&v.modelKind==='infectedCop'&&!u.guard&&(u.converted||u.kind==='ally');
 const propType=eligible?(u.type===3?'shield':u.type===1?'baton':null):null;
 if(!propType){detachCopProp(v);return;}
 if(v.userData?.propType===propType&&v.userData.propMesh)return;
 // 两种感染警察共用模型池，换兵种时必须换掉上次的武器。
 detachCopProp(v);
 const spec=PROP_XFORM[propType];
 if(!v.userData)v.userData={};
 let bone=null;
 for(const name of spec.bones){
  v.root.traverse(n=>{if(!bone&&n.isBone&&n.name===name)bone=n;});
  if(bone)break;
 }
 if(!bone)return;
 const mesh=props[propType].clone(true);
 // 长条配件（棍子）要把柄端落在手心：沿自身长度方向（局部 +Y，也就是手指方向）
 // 平移半个长度，长度 = 1 个单位 × 缩放。偏移必须跟着倾角一起旋转，
 // 否则棍子一倾斜，柄端就绕着手腕转出去了。
 mesh.scale.setScalar(spec.scale);
 if(spec.aimForward){
  // 让棍子朝人物正前方斜：取手臂方向（骨骼局部 +Y）与人物前方（模型局部 +Z），
  // 绕这两者的叉积轴把棍子转 angle 度，倾斜方向就锁定在正前方而不是身体侧面。
  v.holder.updateMatrixWorld(true);
  const qBone=bone.getWorldQuaternion(new T.Quaternion());
  // 手臂方向不能取骨骼的局部 +Y：Mixamo 骨骼各自绑姿旋转不同，+Y 未必指向手指，
  // 取出来会偏到手臂外侧去。用「父骨骼 → 本骨骼」的世界位移，才是手腕指向手指的真实方向。
  const handPos=new T.Vector3();bone.getWorldPosition(handPos);
  const parentPos=new T.Vector3();(bone.parent||bone).getWorldPosition(parentPos);
  const armWorld=handPos.sub(parentPos);
  if(armWorld.lengthSq()<1e-8)armWorld.set(0,1,0);
  armWorld.normalize();
  const frontWorld=new T.Vector3(0,0,1).applyQuaternion(v.root.getWorldQuaternion(new T.Quaternion()));
  const axis=new T.Vector3().crossVectors(armWorld,frontWorld);
  if(axis.lengthSq()<1e-8)axis.set(1,0,0);
  axis.normalize();
  const targetLocal=armWorld.clone().applyAxisAngle(axis,spec.angle).applyQuaternion(qBone.clone().invert()).normalize();
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),targetLocal);
 }else if(spec.faceForward){
  // 把盾牌的法线（局部 +X）对齐人物正前方、高度（局部 +Y）对齐上方，盾牌就竖着朝前，
  // 与横在胸前的小臂成 90 度。方向都在骨骼局部空间里算，人物转到哪都成立。
  v.holder.updateMatrixWorld(true);
  const qBone=bone.getWorldQuaternion(new T.Quaternion());
  const qInv=qBone.clone().invert();
  const qRoot=v.root.getWorldQuaternion(new T.Quaternion());
  const forward=new T.Vector3(0,0,1).applyQuaternion(qRoot).applyQuaternion(qInv).normalize();
  const up=new T.Vector3(0,1,0).applyQuaternion(qRoot).applyQuaternion(qInv).normalize();
  const side=new T.Vector3().crossVectors(forward,up).normalize();
  up.crossVectors(side,forward).normalize();
  mesh.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(forward,up,side));
 }else mesh.rotation.set(...spec.rot);
 // 柄端落在手心：沿棍子自身长度方向（局部 +Y）平移半个长度，偏移必须按最终朝向旋转。
 const half=spec.gripEnd?(spec.grip??.5)*spec.scale:0;
 let ox=0,oy=0,oz=0;
 if(half){const dir=new T.Vector3(0,half,0).applyQuaternion(mesh.quaternion);ox=dir.x;oy=dir.y;oz=dir.z;}
 mesh.position.set(spec.pos[0]+ox,spec.pos[1]+oy,spec.pos[2]+oz);
 bone.add(mesh);v.userData.prop=bone.name;v.userData.propMesh=mesh;v.userData.propType=propType;
}
// 调参面板用：把配件摘下来按新参数重挂，所有在场的角色一起更新。
function detachCopProp(v){
 if(!v.userData)return;
 if(v.userData.propMesh){v.userData.propMesh.removeFromParent();v.userData.propMesh=null;}
 v.userData.prop=null;v.userData.propType=null;
}
function refreshCopProps(){
 for(const entry of visuals.values())detachCopProp(entry.v);
 for(const u of units){const entry=visuals.get(u.id);if(entry&&typeof attachCopProp==='function')attachCopProp(entry.v,u);}
}
function acquireUnitRecord(type,x,z,city=false,profession=0){
 const id=nextActorId++;totalReinforcements++;
 const stale=unitPool.pop();
 return stale?resetUnit(stale,id,type,x,z,city,profession):makeUnit(id,type,x,z,city,profession);
}
function disposeActorWarning(markers,id){
 const mesh=markers.get(id);if(!mesh)return;
 scene.remove(mesh);mesh.geometry?.dispose();mesh.material?.dispose();markers.delete(id);
}
function clearActorWarnings(id){disposeActorWarning(sprayMarkers,id);disposeActorWarning(chargeMarkers,id);}
function releaseActor(u){
 if(u.explosionPending){
  u.explosionPending=false;
  const y=world.heightAt(u.x,u.z);
  burst(u.x,y+.8,u.z,0xff9d38,24,7);burst(u.x,y+.8,u.z,0x696363,10,4);
  const blast=wave(u.x,u.z,3.4,0xff7733);if(blast)blast.position.y=y+.08;
  music.effect('powerImpact');
 }
 clearActorWarnings(u.id);
 const entry=visuals.get(u.id);
 if(entry){
  if(typeof stripTankShell==='function')stripTankShell(entry.v);
  if(entry.v.aura){removeAura(entry.v.aura);entry.v.aura=null;}
  releaseCharacterVisual(entry.v);
  visuals.delete(u.id);
 }
 squadIds.delete(u.id);
 if(unitPool.length<40)unitPool.push(u);
}
// 尸体消失或阵亡友军不再占着模型和 AI 列表，还给缓存池下次增援用。
function recycleSpentActors(){
 for(let i=units.length-1;i>=0;i--){
  const u=units[i];
  if(!u.dead||u.guard)continue;
  if(u.kind!=='expired'&&u.kind!=='fallen')continue;
  releaseActor(u);
  units.splice(i,1);
 }
}
function spawnGuard(type){
 const p=world.nearest(player.x+(Math.random()-.5)*4,player.z+(Math.random()-.5)*4,1);
 const stale=unitPool.pop();
 const u=stale?resetUnit(stale,nextActorId++,type,p.x,p.z,false,0):makeUnit(nextActorId++,type,p.x,p.z,false,0);
 const tpl=allyTemplate(type);
 u.converted=true;u.kind='ally';u.guard=true;u.city=false;
 // 漫画包：三级护卫额外获得 100% 生命与攻击力。
 const want=guardWanted(state);u.maxHp=Math.ceil(tpl.hp*(want.hp||1));u.hp=u.maxHp;u.atk=Math.ceil(tpl.atk*(want.atk||1));u.infection=u.threshold;
 units.push(u);actorVisual(u);squadIds.add(u.id);
 return u;
}
function ensureGuards(announce=false){
 const want=guardWanted(state);if(!want.count)return;
 // Existing guards promote with the command tier, preserving their health ratio.
 units.filter(u=>u.guard).forEach((u,index)=>{
  const type=want.types?.[index];if(type==null||u.type===type)return;
  const ratio=u.maxHp?u.hp/u.maxHp:1,tpl=allyTemplate(type);
  u.type=type;u.threshold=ENEMIES[type].threshold;u.maxHp=Math.ceil(tpl.hp*(want.hp||1));
  u.hp=u.dead?0:Math.max(1,Math.round(u.maxHp*ratio));u.atk=Math.ceil(tpl.atk*(want.atk||1));
 });
 for(const u of units){
  if(!u.guard)continue;
  if(u.dead){u.guardCd=(u.guardCd??want.revive??30)-frameDelta;if(u.guardCd<=0){u.dead=false;u.kind='ally';u.hp=u.maxHp;u.converted=true;const p=world.nearest(player.x,player.z,1);u.x=p.x;u.z=p.z;u.guardCd=0;if(!visuals.get(u.id))actorVisual(u);toast('护卫归队',1);}}
 }
 // 编制把活着的和正在等复活的算在一起。阵亡只是过一会儿归队，不会再额外招人补缺。
 const missing=guardMissing(state,units);
 const roster=units.filter(u=>u.guard).length;
 for(let i=0;i<missing;i++)spawnGuard(want.types?.[roster+i]??want.type);
 if(announce&&missing>0)toast(`护卫到场 · ${want.count} 名 ${ENEMIES[want.type].name}`,2);
}
// 市民散在全城，并离出生点至少 18 米，避免开局被一圈人围住。
function initUnits(){
 let rng=Math.floor(Math.random()*4294967296);const random=()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296;};units=[];
 for(let region=0;region<4;region++)for(const [type,count] of [[0,TUNE.difficulty.civiliansPerRegion],[1,TUNE.difficulty.patrolsPerRegion]])for(let i=0;i<count;i++){
  let spot,wish;
  for(let attempt=0;attempt<80;attempt++){const p=regionSpawnSpot(region,random);wish=p;if(world.free(p.x,p.z,1)&&distance(player,p)>=8){spot=p;break;}}
  spot??=world.nearest(wish.x,wish.z,1);
  const u=makeUnit(units.length,type,spot.x,spot.z,true,units.length%5);units.push(u);
 }
 units.forEach(u=>{if(distance(player,u)<38)actorVisual(u);});
 // 开局先克隆一批警卫模型进缓存池，后面增援直接取出，避免战斗中当场克隆卡顿。
 warmCharacterPool(assets,'guard',8);
}
// 卡住多久算走不动。超过这个时间就换一块能站的空地，不再贴着墙原地磨。
const STUCK_LIMIT=.5;
// 找附近一块能走的空地。挑不到就放弃，下一帧还会再试。
function unstick(u){
 for(let i=0;i<12;i++){
  const a=(i/12)*Math.PI*2+Math.random()*.5,r=1.6+Math.random()*4;
  let spot=null;
  try{spot=world.nearest(u.x+Math.sin(a)*r,u.z+Math.cos(a)*r,.6);}catch{spot=null;}
  if(!spot)continue;
  if(Math.hypot(spot.x-u.x,spot.z-u.z)<1.2)continue;
  u.x=spot.x;u.z=spot.z;u.tx=spot.x;u.tz=spot.z;u.wander=1+Math.random()*1.5;
  return true;
 }
 return false;
}
// 撞上墙或河岸时不再停在原地：先顺着旁边挪，连续挪不动再换空地。
function move(u,dx,dz,detour=false){
 const ox=u.x,oz=u.z,want=Math.hypot(dx,dz);
 const canMove=(x,z)=>world.canMove?world.canMove(u,x,z):world.free(x,z);
 if(canMove(u.x+dx,u.z))u.x+=dx;
 if(canMove(u.x,u.z+dz))u.z+=dz;
 let moved=Math.hypot(u.x-ox,u.z-oz);
 if(detour&&moved<want*.3){
  // 先试惯用一侧再试另一侧，免得整队人都往同一个方向挤。
  for(const side of (u.id%2?[1,-1]:[-1,1])){
   const sx=-dz*side,sz=dx*side;
   if(canMove(u.x+sx,u.z+sz)){u.x+=sx;u.z+=sz;break;}
  }
  moved=Math.hypot(u.x-ox,u.z-oz);
 }
 if(detour){
  if(want>.0001&&moved<want*.25)u.stuck=(u.stuck||0)+frameDelta;
  else u.stuck=0;
  if((u.stuck||0)>=STUCK_LIMIT){u.stuck=0;if(unstick(u))moved=Math.hypot(u.x-ox,u.z-oz);}
 }
 return moved>.001;
}
function forward(){return {x:Math.sin(yaw),z:Math.cos(yaw)};}
function weaponKey(id){return weaponSlots(state).find(slot=>slot.id===id)?.key??'?';}
function acquire(range=3.1){let best=null,score=-Infinity;const f=forward();for(const u of units){if(u.dead||u.converted||u.kind==='corpse')continue;const d=distance(player,u);if(d>range||!world.clear(player,u))continue;const dot=((u.x-player.x)*f.x+(u.z-player.z)*f.z)/(d||1);if(dot<.3)continue;const value=dot*4-d/range;if(value>score){score=value;best=u;}}return best;}
const pickups=[],crossBarGeometry=new T.BoxGeometry(1,1,1);
// 血包按街道来定大小。人物缩小后如果还乘 FX_SCALE，十字只剩约 0.2，走在街上几乎看不见。
const PICKUP_SCALE=.9;
function spawnPickup(x,z,type='health'){
 if(pickups.length>=18)return;
 const body=new T.Group();body.position.set(x,world.heightAt(x,z)+.55*PICKUP_SCALE,z);
 const color=type==='factor'?0xb478f1:type==='potion'?0xffc92e:0x3dff6a;
 const mat=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.6,roughness:.25});
 const vBar=new T.Mesh(crossBarGeometry,mat);vBar.scale.set(.18*PICKUP_SCALE,.62*PICKUP_SCALE,.18*PICKUP_SCALE);body.add(vBar);
 const hBar=new T.Mesh(crossBarGeometry,mat);hBar.scale.set(.62*PICKUP_SCALE,.18*PICKUP_SCALE,.18*PICKUP_SCALE);body.add(hBar);
 body.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 scene.add(body);
 if(type==='factor'){vBar.rotation.z=Math.PI/4;hBar.rotation.z=Math.PI/4;}
 if(type==='potion'){vBar.scale.y*=1.5;hBar.scale.x*=.55;}
 pickups.push({type,m:body,aura:makeAura(body,{core:color,mote:color},{coreSize:1.45,moteSize:.34,radius:.62}),x,z,phase:Math.random()*6.283});
}
function scatterPickups(){for(let i=0;i<12;i++){let x=0,z=0;for(let t=0;t<60;t++){x=(Math.random()-.5)*104;z=(Math.random()-.5)*104;if(world.free(x,z,1))break;}spawnPickup(x,z,['health','factor','potion'][i%3]);}}
function updatePickups(dt){
 for(let i=pickups.length-1;i>=0;i--){
  const p=pickups[i];
  p.phase+=dt*2.2;p.m.rotation.y+=dt*1.5;p.m.position.y=world.heightAt(p.x,p.z)+(.55+Math.sin(p.phase)*.12)*PICKUP_SCALE;
  if(distance(player,p)<PICKUP_CONFIG.radius){
   const result=collectPickup(state,p.type);if(!result)continue;
   removeAura(p.aura);scene.remove(p.m);p.m.traverse(o=>{if(o.isMesh)o.material.dispose();});pickups.splice(i,1);
   const label=result.type==='health'?`血包 · 生命 +${Math.round(result.amount)}`:result.type==='factor'?`狂暴因子 · 经验 +${Number(result.amount.toFixed(1))}`:`狂暴药水 · 强化 ${result.amount} 秒`;
   toast(label,1.6);music.effect('upgrade');
  }
 }
}
function hitBoss(target,damage,attacker=player,impactKind='light'){const dealt=baseHitBoss(target,damage*kindlingMultiplier(state,player,attacker));if(dealt>0)hitStyles.set('boss',{kind:attacker===player?impactKind:'ally',at:performance.now()});return dealt;}
function flushKindlingPulses(){
 for(const pulse of releaseKindlingPulses(state,units)){
  __comicPulse(pulse.x,pulse.z,'kindling',3,pulse.radius);burst(pulse.x,STANDING_CHEST,pulse.z,0xb85cff,12,5);music.effect('powerImpact');
 }
}
function facingFront(u,origin=player){const vis=visuals.get(u.id)?.v;const ang=Number.isFinite(u.chargeYaw)&&u.chargePhase?u.chargeYaw:vis?vis.holder.rotation.y:Number.isFinite(u.facingYaw)?u.facingYaw:Math.atan2((u.tx??player.x)-u.x,(u.tz??player.z)-u.z);const fx=Math.sin(ang),fz=Math.cos(ang);const dx=origin.x-u.x,dz=origin.z-u.z,len=Math.hypot(dx,dz)||1;return (dx*fx+dz*fz)/len>.2;}
function applyHit(u,inf,damage,fromArmy=false,origin=player,attacker=fromArmy?origin:player,impactKind='light'){const bonus=kindlingMultiplier(state,player,attacker);damage*=bonus;inf*=bonus;const result=hit(state,u,inf,damage,ENEMIES[u.type].shield&&facingFront(u,origin),fromArmy);if(result!=='none')hitStyles.set(u.id,{kind:fromArmy?'ally':impactKind,at:performance.now()});if(result==='converted'){burst(u.x,STANDING_CHEST,u.z,0xc781ff,15);music.effect('convert');toast(`${u.type===0?PROFESSIONS[u.profession]:(ENEMIES[u.type].allyName||ENEMIES[u.type].name)} 已觉醒 · 满状态加入`,1.8);}else if(result==='hit')burst(u.x,STANDING_CHEST,u.z,inf?0xb376e9:0xebc5a6,fromArmy?2:4);else if(result==='killed'&&u.type>0)spawnPickup(u.x,u.z,['health','factor','potion'][Math.floor(Math.random()*3)]);return result;}
function playerHurt(damage,source,attacker){
 const dead=hurtMother(state,damage,source,!!state.sprinting);invincible=.35;shake=Math.max(shake,.12);music.effect('hurt');
 const r=state.lastReflect;
 if(attacker&&r?.radius&&r.reflected>0&&!attacker.dead&&!attacker.converted&&attacker.kind!=='corpse'&&distance(player,attacker)<=r.radius){
  if(attacker===boss){if(boss.active)hitBoss(boss,r.reflected);}
  else applyHit(attacker,r.reflected*.5,r.reflected,false,player);
 }
 return dead;
}
function raiseAlarm(){if(alerted)return;alerted=true;const plan=spawnReinforcement();reinforceTimer=plan?.interval??12;toast('感染行为暴露 · 增援开始进入',3);}
function activeGun(){return state.weapon>=0?GUNS[state.weapon]:null;}
function holdingLauncher(){return state.weapon===LAUNCHER_SLOT&&hasLauncher(state);}
function stashMag(){const gun=activeGun();if(gun)state.mags[gun.id]=state.clip;}
function meleeStrike(kind){if(mode!=='playing'||attackCd>0||switchTime>0||reloadTime>0||player.roll>0||player.knock>0)return;raiseAlarm();playerVisual.holder.rotation.y=yaw;const spec=meleeSpec(state,kind),f=forward();
 if(holdingLauncher()){if(kind==='heavy'){toast('注射器没有重击 · 切回徒手或用枪',1.2);return;}fireLauncher();return;}
 const gun=activeGun();
 if(!gun){attackCd=spec.cd;playCharacterAttack(playerVisual,kind==='heavy'?'break':'infect');const hits=[];if(spec.aoe){for(const u of units){if(u.dead||u.converted||u.kind==='corpse')continue;if(distance(player,u)<=spec.aoe)hits.push(u);}}else{const u=acquire(spec.range);if(u)hits.push(u);}for(const u of hits)applyHit(u,spec.infection,spec.damage,false,player,player,kind);if(!hits.length)world.breakAt(player.x+f.x*1.7,player.z+f.z*1.7,kind==='heavy'?2.2:1.8,kind==='heavy'?80:50,burst);if(boss.active&&!boss.dead&&distance(player,boss)<(kind==='heavy'?5.6:5))hitBoss(boss,spec.damage*(kind==='heavy'?3:3.75),player,kind);music.effect('infect');return;}
 if(kind==='heavy'){toast(gun.name+'没有重击 · 切回徒手',1.2);return;}
 fireGun(gun);}
function emitLauncherShot(spec,empowered,chargeShot){
 const f=forward(),shotHeight=player.crouch?CROUCH_CHEST:STANDING_CHEST,originY=world.heightAt(player.x,player.z)+player.y+shotHeight;
 const u=acquire(spec.range),end=u?{x:u.x,z:u.z}:{x:player.x+f.x*spec.range,z:player.z+f.z*spec.range};
 const d=Math.hypot(end.x-player.x,end.z-player.z)||1;
 const m=empowered?createPowerOrb(player.x,originY,player.z):block(scene,.1,.1,.7,spec.color,player.x,originY,player.z);
 tracers.push({m,x:player.x,z:player.z,y:m.position.y,vy:empowered?4.8:0,vx:(end.x-player.x)/d*spec.speed,vz:(end.z-player.z)/d*spec.speed,life:spec.life,friendly:true,from:'launcher',damage:spec.damage,infection:spec.infection,pierce:spec.pierce,splash:spec.splash||0,hitIds:new Set(),strong:empowered,isPower:empowered,chargeShot,trail:0});
 burst(player.x+f.x,player.y+shotHeight,player.z+f.z,empowered?0xe4adff:spec.color,empowered?22:10);
 music.effect(empowered?'powerThrow':'shoot');
 if(empowered)pulseAim('discharged');
 updateChargeRing();
}
function fireLauncher(){
 const empowered=consumePowerCharge(state),spec=launcherSpec(state,empowered);
 if(!spec)return;
 attackCd=spec.cd;playCharacterAttack(playerVisual,'shoot');weaponPivot.position.y-=.05;
 emitLauncherShot(spec,empowered,{eligible:canChargePower(state),empowered,counted:false});
}
function fireGun(gun){gun={...gun,damage:gun.damage*potionMultiplier(state,'attack')};if(state.clip<=0){reloadGun();return;}state.clip--;attackCd=gun.cd;playCharacterAttack(playerVisual,'shoot');weaponPivot.position.y-=.05;const empowered=consumePowerCharge(state);const chargeShot={eligible:canChargePower(state),empowered,counted:false};if(empowered){const spec=launcherSpec(state,true);emitLauncherShot({...spec,damage:Math.max(spec.damage,gun.damage*2,gun.damage*gun.pellets)},true,chargeShot);return;}const f=forward();const shotHeight=player.crouch?CROUCH_CHEST:STANDING_CHEST;const originY=world.heightAt(player.x,player.z)+player.y+shotHeight;const u=acquire(gun.range);const inf=gunInfection(state,gun.damage)*potionMultiplier(state,'infection');
 for(let i=0;i<gun.pellets;i++){
  const spread=(i-(gun.pellets-1)/2)*gun.spread;
  const aim=u?{x:u.x-player.x,z:u.z-player.z}:{x:f.x,z:f.z};
  const len=Math.hypot(aim.x,aim.z)||1;
  const c=Math.cos(spread),s=Math.sin(spread);
  const vx=(aim.x/len*c-aim.z/len*s)*gun.speed,vz=(aim.x/len*s+aim.z/len*c)*gun.speed;
  const m=block(scene,gun.splash?0.18:0.08,gun.splash?0.18:0.08,gun.splash?0.55:0.45,gun.color,player.x,originY,player.z);
  tracers.push({m,x:player.x,z:player.z,y:originY,vx,vz,life:.9,friendly:true,damage:gun.damage,infection:inf,splash:gun.splash||0,from:gun.name,chargeShot});
 }
 burst(player.x+f.x,player.y+shotHeight,player.z+f.z,gun.color,gun.splash?14:8);music.effect('infect');}
function primary(){meleeStrike('light');}
function heavy(){meleeStrike('heavy');}
function rush(){
 if(mode!=='playing'||player.knock>0||player.roll>0||player.y>0||player.vy>0)return;
 const dx=(keys.KeyD?1:0)-(keys.KeyA?1:0),fw=(keys.KeyW?1:0)-(keys.KeyS?1:0),f=forward(),len=Math.hypot(dx,fw);
 player.rollX=len?(-Math.cos(yaw)*dx+f.x*fw)/len:f.x;
 player.rollZ=len?(Math.sin(yaw)*dx+f.z*fw)/len:f.z;
 player.roll=ROLL_DURATION;player.crouch=false;rushCd=0;rollBuffered=0;
 // 连滚是新的动作，要立即重播；动画时长与实际翻滚一致。
 playerVisual.airborne=false;playerVisual.attackTime=0;
 playCharacterAttack(playerVisual,'rush',ROLL_DURATION);music.effect('roll');
}
function jump(){
 if(mode!=='playing'||player.knock>0||player.y>0||player.vy>0)return;
 // 跳跃可以直接取消地面翻滚，攻击与换弹本身的计时仍继续。
 player.roll=0;player.crouch=false;player.vy=JUMP_SPEED;
 jumpBuffered=0;rollBuffered=0;playerVisual.airborne=true;
 playCharacterJump(playerVisual,2*JUMP_SPEED/GRAVITY);music.effect('jump');
}
function requestRoll(){
 if(mode!=='playing')return;
 // 滚动中再按一次可接下一滚；空中短按只在临近落地时保留。
 rollBuffered=Math.max(ACTION_BUFFER,player.roll);jumpBuffered=0;rush();
}
function requestJump(){
 if(mode!=='playing')return;
 jumpBuffered=ACTION_BUFFER;rollBuffered=0;jump();
}
function stepPlayerMotion(dt){
 const wasAirborne=player.y>0;
 player.vy-=GRAVITY*dt;player.y=Math.max(0,player.y+player.vy*dt);
 if(player.y===0){
  player.vy=0;
  if(wasAirborne){playerVisual.airborne=false;playerVisual.attackTime=0;}
 }
 if(jumpBuffered>0)jump();
 if(rollBuffered>0)rush();
 jumpBuffered=Math.max(0,jumpBuffered-dt);
 // 正在翻滚时不消耗下一滚的按键，避免最后一帧刚好过期。
 if(player.roll<=0)rollBuffered=Math.max(0,rollBuffered-dt);
}
function finishRoll(){
 playerVisual.attackTime=0;
 if(rollBuffered>0)rush();
}
function reloadGun(){const gun=activeGun();if(!gun||reloadTime||switchTime||state.clip>=gun.clip)return;if((state.ammo[gun.id]||0)<=0){toast(gun.name+'备弹耗尽 · 击杀或同化对应等级敌人补充');return;}reloadTime=1.15;toast('装填 '+gun.name+'…',1);}
function weaponSelect(index){
 if(switchTime)return;
 if(index===LAUNCHER_SLOT){if(!hasLauncher(state)){toast('尚未解锁可感染注射器');return;}}
 else if(index>=0){const gun=GUNS[index];if(!gun)return;if(state.abilities.guns<gun.unlock){toast('尚未解锁 '+gun.name+' · 先点「枪？枪！」');return;}}
 if(index===state.weapon)return;nextWeapon=index;switchTime=.35;attackCd=Math.max(attackCd,.35);
 toast(index===LAUNCHER_SLOT?'切换 · 可感染注射器':index<0?'切换 · 徒手':'切换 · '+GUNS[index].name,.7);
}
const keys={};const SHIFT_HOLD_MS=180;keys.shiftStartedAt=null;
function shiftHeld(){return keys.shiftStartedAt!==null&&(keys.ShiftLeft||keys.ShiftRight)&&performance.now()-keys.shiftStartedAt>=SHIFT_HOLD_MS;}
addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName);if(!typing&&(e.code==='F3'||(mode==='playing'&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))))e.preventDefault();if(e.code==='F3'){e.preventDefault();toggleDebug();return;}if(typing)return;keys[e.code]=true;if(e.repeat)return;if(e.code==='Escape'||e.code==='KeyP'){togglePause();return;}if(mode==='map'&&e.code==='Tab'){e.preventDefault();toggleMap();return;}if(mode!=='playing')return;if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&keys.shiftStartedAt===null)keys.shiftStartedAt=performance.now();if(e.code==='KeyJ')primary();if(e.code==='KeyK')heavy();if(e.code==='Digit1')weaponSelect(-1);else if(/^Digit[2-9]$/.test(e.code)){const slot=weaponSlots(state)[Number(e.code.slice(5))-2];if(slot)weaponSelect(slot.weapon);}if(e.code==='Space')requestJump();if(e.code==='KeyC'&&player.roll<=0&&!(player.knock>0))player.crouch=!player.crouch;if(e.code==='KeyF'&&state.abilities.command){if(squadIds.size){squadIds.clear();toast('群落已解散 · 自主行动');}else{const cap=state.abilities.command?Math.max(6,guardWanted(state).count):6;units.filter(u=>u.converted&&!u.dead&&distance(player,u)<22).sort((a,b)=>distance(player,a)-distance(player,b)).slice(0,cap).forEach(u=>squadIds.add(u.id));toast((state.abilities.command?'号令召集 ':'已召集 ')+squadIds.size+' 名同伴');}}if(e.code==='KeyR')reloadGun();if(e.code==='Tab')toggleMap();});addEventListener('keyup',e=>{keys[e.code]=false;if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!keys.ShiftLeft&&!keys.ShiftRight){const started=keys.shiftStartedAt;keys.shiftStartedAt=null;state.sprinting=false;if(mode==='playing'&&started!==null&&performance.now()-started<SHIFT_HOLD_MS)requestRoll();}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;// 开着配件调参面板时不抢鼠标：指针一旦锁定，面板就没法拖了。此时用右键拖动转视角。
if(e.button===0){mouseHeld=true;primary();if(!showDebug&&!window.__propUi&&!pointerLock.locked())void pointerLock.request();}else if(e.button===2){if(pointerLock.locked())heavy();else{dragging=true;lastMouse={x:e.clientX,y:e.clientY};}}});addEventListener('pointerup',()=>{mouseHeld=false;dragging=false;});addEventListener('pointermove',e=>{if(mode!=='playing')return;let dx=0,dy=0;if(pointerLock.locked()){dx=e.movementX;dy=e.movementY;}else if(dragging&&lastMouse){dx=e.clientX-lastMouse.x;dy=e.clientY-lastMouse.y;lastMouse={x:e.clientX,y:e.clientY};}yaw-=dx*.0025*settings.sensitivity;pitch=T.MathUtils.clamp(pitch+dy*.0022*settings.sensitivity,PITCH_UP,maxLookDown());});canvas.addEventListener('wheel',e=>{e.preventDefault();if(mode!=='playing'||switchTime||!e.deltaY)return;const slots=[-1,...weaponSlots(state).map(s=>s.weapon)];const index=slots.indexOf(state.weapon);weaponSelect(slots[(index+(e.deltaY>0?1:-1)+slots.length)%slots.length]);},{passive:false});
function toggleMap(){
 if(mode!=='playing'&&mode!=='map')return;
 const open=mode==='playing';mode=open?'map':'playing';clearInput();
 $('cityMap').classList.toggle('expanded',open);$('mapClose').hidden=!open;
 if(!open){$('mapClose').blur();captureView();}
 $('cityMap').setAttribute('aria-label',open?'城市地图，Tab 或 Esc 关闭':'小地图');
}
$('mapClose').onclick=toggleMap;
function clearInput(){state.sprinting=false;rollBuffered=0;jumpBuffered=0;mouseHeld=false;dragging=false;Object.keys(keys).forEach(k=>keys[k]=false);keys.shiftStartedAt=null;pointerLock.release();}
addEventListener('blur',()=>{clearInput();if(mode==='playing')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')togglePause();});
function showDialog(html){$('dialog').classList.remove('choiceLock');$('dialog').innerHTML=html;$('modal').hidden=false;clearInput();}
function hideDialog(){const modal=$('modal');modal.hidden=true;modal.style.opacity='';$('dialog').classList.remove('choiceLock');}
function fadeModal(to,ms,done){
  const modal=$('modal');
  const from=parseFloat(modal.style.opacity===''?getComputedStyle(modal).opacity:modal.style.opacity);
  const start=performance.now();
  // 用时间推进透明度。升级时画面已经暂停，不能靠渲染帧来计时。
  const timer=setInterval(()=>{
    const t=Math.min(1,(performance.now()-start)/ms);
    modal.style.opacity=String(from+(to-from)*t);
    if(t<1)return;
    clearInterval(timer);
    modal.style.opacity=String(to);
    done?.();
  },16);
}
function hideLevelUpFx(){const fx=$('levelUpFx');if(!fx)return;fx.classList.remove('play');fx.hidden=true;}
function playLevelUpFx(){
  music.effect('upgrade');
  const y=world.heightAt(player.x,player.z)+player.y+PLAYER_HEIGHT*.72;
  if(playerVisual)makeAura(playerVisual.holder,AURA_COLORS.level,{coreSize:2.8,moteSize:.62,count:8,radius:.58,life:1.7});
  burst(player.x,y,player.z,0xffc92e,24);
  burst(player.x,y+.4,player.z,0xffe066,14);
  wave(player.x,player.z,3.6,0xffc92e);
}
function showLevelUpBeat(){
  playLevelUpFx();
  // 升级当下只出字，选卡界面等一秒再淡入，避免一升级就挡住画面。
  hideDialog();
  const fx=$('levelUpFx');
  fx.hidden=false;
  fx.classList.add('play');
  clearTimeout(upgradeTimer);
  upgradeTimer=setTimeout(()=>openUpgradeDialog(),1000);
}
function bindUpgradeCards(){
  document.querySelectorAll('[data-choice]').forEach(b=>{
    b.onclick=()=>applyChoice(+b.dataset.choice);
  });
  document.querySelectorAll('[data-reroll]').forEach(b=>{
    b.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      refreshChoice(+b.dataset.reroll);
    };
  });
}
function choiceSlotHtml(a,i){
  const lv=state.abilities[a.id]||0;
  const used=!!choiceRerolls[i];
  const can=hasRerollPool(state,choiceSet,choiceSeen)&&!used;
  const label=used?'已刷新':(can?'刷新这张':'没有其他能力');
  return `<div class="choiceSlot"><button type="button" class="card" data-choice="${i}"><span class="type">${a.group} / ${lv?'强化能力':'新能力'}</span><span class="icon">${a.icon}</span><strong>${a.name}</strong><em>Lv.${lv} → Lv.${lv+1}</em><small>${a.descriptions[lv]}</small><span class="cardCta" aria-hidden="true">点击获得 <b>↗</b></span></button><button type="button" class="reroll" data-reroll="${i}" ${can?'':'disabled'}>${label}</button></div>`;
}
function refreshChoice(index){
  if(mode!=='upgrade'||upgradeLock>0||$('modal').dataset.closing==='1')return;
  if(choiceRerolls[index]){toast('这张本级已经刷新过了',1.2);return;}
  const next=rerollChoice(state,choiceSet,index,Math.random,choiceSeen);
  if(!next){toast('没有其他可选能力',1.2);return;}
  choiceSet=next;
  choiceSeen.add(next[index].id);
  choiceRerolls[index]=true;
  music.effect('chargeTick',index+1);
  const cards=$('upgradeCards');
  if(cards){
    const slot=cards.children[index];
    if(slot){
      slot.outerHTML=choiceSlotHtml(choiceSet[index],index);
      cards.children[index].classList.add('rerolled');
    }
    // 保留另外两张卡的 DOM 和动画状态，只更新刷新按钮的可用状态。
    const pool=hasRerollPool(state,choiceSet,choiceSeen);
    cards.querySelectorAll('[data-reroll]').forEach(b=>{
      const used=choiceRerolls[+b.dataset.reroll];
      b.disabled=used||!pool;
      b.textContent=used?'已刷新':pool?'刷新这张':'没有其他能力';
    });
    bindUpgradeCards();
    cards.querySelector(`[data-choice="${index}"]`)?.focus({preventScroll:true});
  }
  toast(`第 ${index+1} 张已刷新 · ${choiceSet[index].name}`,1.4);
}
function applyChoice(index){
  const modal=$('modal');
  if(mode!=='upgrade'||upgradeLock>0||modal.dataset.closing==='1')return;
  const a=choiceSet[index];
  if(!a||!upgrade(state,a.id))return;
  modal.dataset.closing='1';
  document.querySelector(`[data-choice="${index}"]`)?.classList.add('claimed');
  document.querySelectorAll('#upgradeCards button').forEach(b=>b.disabled=true);
  clearTimeout(upgradeTimer);
  // 选卡这一下还算玩家点击，趁这时锁住鼠标，淡出后就能直接转画面。
  captureView();
  fadeModal(0,400,()=>finishUpgrade(a));
}
function finishUpgrade(a){
  $('modal').dataset.closing='';
  hideDialog();
  hideLevelUpFx();
  mode='playing';
  if(playerVisual)makeAura(playerVisual.holder,AURA_COLORS.level,{coreSize:1.6,moteSize:.36,radius:.38,life:.7});
  if(a.id==='command')ensureGuards(true);
  if(a.id==='guns'&&state.abilities.guns===1)toast(`解锁手枪 / 霰弹枪 · 按 ${weaponKey('pistol')} / ${weaponKey('shotgun')} 切换`,2.4);
  else if(a.id==='launcher'&&state.abilities.launcher===1)toast(`解锁注射器 · 按 ${weaponKey('launcher')} 切换`,2.4);
  else if(a.id==='launcher'&&state.abilities.launcher===2)toast('注射器强化 · 针剂可穿透',2.4);
  else if(a.id==='launcher'&&state.abilities.launcher===3)toast('解锁三环充能 · 累计命中三次，下一发强化炮弹',2.4);
  else toast(`获得 ${a.name} Lv.${state.abilities[a.id]}`,2);
  saveRun();
}
function openUpgradeDialog(){
  if(mode!=='levelup')return;
  clearTimeout(upgradeTimer);
  hideLevelUpFx();
  mode='upgrade';
  upgradeLock=.45;
  showDialog(`<div class="eyebrow">GENETIC RECOMBINATION / LV.${state.level}</div><h2>${state.history.length?'反抗，正在进化。':'选择你的第一种变异。'}</h2><p class="choiceHint">选一个，继续觉醒。点击卡片立即获得能力。<br>每张卡可单独刷新一次；本轮出现过的能力不会重复刷出。</p><div class="cards" id="upgradeCards">${choiceSet.map((a,i)=>choiceSlotHtml(a,i)).join('')}</div>`);
  const modal=$('modal');
  modal.dataset.closing='';
  modal.style.opacity='0';
  $('dialog').classList.add('choiceLock');
  fadeModal(1,450,()=>{upgradeLock=0;$('dialog')?.classList.remove('choiceLock');});
  bindUpgradeCards();
}
function chooseUpgrade(){
  if(boss.active||mode==='upgrade'||mode==='levelup')return;
  choiceSet=choices(state);
  if(!choiceSet.length){state.pending=0;return;}
  choiceRerolls=choiceSet.map(()=>false);
  choiceSeen=new Set(choiceSet.map(a=>a.id));
  mode='levelup';
  clearInput();
  showLevelUpBeat();
}
function saveRun(){if(import.meta.env.DEV&&new URLSearchParams(location.search).has('test'))return;if(!assets||['loading','menu','ended','won'].includes(mode)||boss.active)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:SAVE_VERSION,state,units,player,yaw,pitch,cameraDistance,attackCd,breakCd,rushCd,reinforceTimer,reinforceDirection,totalReinforcements,alerted,objects:world.destructibles.map(o=>({hp:o.hp,dead:o.dead,removed:o.removed?[...o.removed]:[]}))}));}catch{}}
function loadSaved(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return [10,SAVE_VERSION].includes(s?.version)&&s.state?.hp>0&&s.units?.length?s:null;}catch{return null;}}
function restore(saved){state=saved.state;state.sprinting=false;state.sprintExhausted=false;state.potionTime??=0;state.abilities={...makeState().abilities,...(saved.state.abilities||{})};state.level=Math.min(state.level,levelCap(state));state.need=xpNeedFor(state.level);if(state.level===levelCap(state))state.xp=0;refreshStats(state);if(saved.version<11)state.pending=Math.min(state.pending,Math.max(0,15-state.history.length));state.powerCharge=Math.min(POWER_HITS,Math.max(0,Math.floor(saved.state.powerCharge||0)));delete state.launcherCharge;if(state.weapon===LAUNCHER_SLOT&&!hasLauncher(state))state.weapon=-1;units=saved.units;
 // All actors share one sequence; repair duplicate IDs in older saves before rebuilding visuals.
 nextActorId=units.reduce((n,u)=>Math.max(n,(Number.isSafeInteger(u.id)?u.id:0)+1),100);
 const actorIds=new Set();for(const u of units){if(!Number.isSafeInteger(u.id)||actorIds.has(u.id))u.id=nextActorId++;actorIds.add(u.id);}
 for(const id of sprayMarkers.keys())disposeActorWarning(sprayMarkers,id);for(const id of chargeMarkers.keys())disposeActorWarning(chargeMarkers,id);
 player=saved.player;player.roll=0;player.vy=0;player.knock=0;yaw=saved.yaw;pitch=saved.pitch;cameraDistance=T.MathUtils.clamp(saved.cameraDistance??2.7,1.9,4.5);attackCd=saved.attackCd;breakCd=saved.breakCd;rushCd=saved.rushCd;reinforceTimer=saved.reinforceTimer;reinforceDirection=saved.reinforceDirection;totalReinforcements=saved.totalReinforcements;alerted=saved.alerted;state.weaponOrder??=[];if(state.bossCountdown!=null||state.weakenTasks)world.spawnWeakenSites();spawnQueue.jobs.length=0;spawnQueue.wait=0;recentSpawnPoints.length=0;for(const a of visuals.values()){if(a.v.aura){removeAura(a.v.aura);a.v.aura=null;}releaseCharacterVisual(a.v);}visuals.clear();saved.objects.forEach((o,i)=>{const w=world.destructibles[i];w.hp=o.hp;w.dead=o.dead;w.g.visible=!o.dead;if(w.instances){const d=new T.Object3D();d.scale.setScalar(0);d.updateMatrix();for(const ix of o.removed){w.removed.add(ix);w.instances.setMatrixAt(ix,d.matrix);}w.instances.instanceMatrix.needsUpdate=true;}});}
async function start(continuing=false){if(!assets)return;if(continuing){const s=loadSaved();if(s)restore(s);}else if(state.time>0){location.reload();return;}conversionCount=state.infected;await music.start();music.setBed('play');playerVisual.holder.rotation.y=yaw;$('menu').hidden=true;$('hud').hidden=false;mode='playing';combatUI.baseline(units,state,player,boss);if(state.pending)chooseUpgrade();else toast('WASD 移动 · 短按 Shift 闪避 / 长按奔跑 · 左键轻击 · 右键重击 · 空格跳跃',4);}
$('start').onclick=()=>{captureView();void start();};$('continue').onclick=()=>{captureView();void start(true);};
// 音乐不跟着界面停：暂停菜单、设置、选卡、结算界面弹出来时曲子继续走。
function togglePause(){if(mode==='map'){toggleMap();return;}if(mode==='playing'){mode='paused';hushRadio();saveRun();showDialog(`<div class="eyebrow">SIMULATION PAUSED</div><h2>东京，暂时静止。</h2><p>街区进度自动保存；Boss 战从进场前存档重试。所有战斗计时已暂停。</p><div class="controlTable">进入游戏后鼠标隐藏并转向，Esc 暂停后显示鼠标；未锁定时可右键拖动<br>左键 / J 轻击 · 右键 / K 重击 · 空格跳跃 · 短按 Shift 闪避 / 长按奔跑 · C 蹲伏<br>1 徒手 · 2 起按点出顺序切换枪械和注射器 · R 装填 · F 号令召集 / 解散 · Tab 地图<br>两下轻击即可叫醒打工人；持盾特警正面伤害减半。<br>空气传播 Lv2 可转化尸体；敌方净化士兵在 10 米内每 0.5 秒清除 2 点感染，多人不叠加。喷雾会先亮出扇形预警约 1 秒，再至少喷 2 秒。敌方攻击是红色警示，我方攻击是紫色。掷弹兵每秒投一枚空中炸弹，落地前地面会亮圈，2 米内 50 点伤害。持盾特警会短蓄力后向前冲，撞上会打伤并把玩家和我方单位击飞 1 秒。警戒升到新阶段时，秩序方会用英语呼叫增援，屏幕上不打字。军事介入和 Boss 战时，头顶会有一架飞机盘旋投弹，也会俯冲扫射。扫射前地面先亮出弹道。这架飞机有血，主角的强化炮弹打中会把它击落，飞机接着坠毁。军事介入还会派出坦克，消耗权重 40，炮弹落地前地面会亮圈。坦克开过时，敌方步兵会被挤开，玩家和我方部队会被撞飞并扣 60 点血。闪避的无敌时间里撞不上。坦克没有感染值，也不会被击飞、定身或减速。</div><button class="action" id="resume">继续觉醒 ↗</button><button class="action secondary" id="pauseSettings">设置</button><button class="action secondary" id="endRun">结束并复盘</button>`);$('resume').onclick=togglePause;$('pauseSettings').onclick=()=>settingsDialog('paused');$('endRun').onclick=()=>finish('ended');}else if(mode==='paused'){hideDialog();mode='playing';captureView();}}
$('pauseButton').onclick=togglePause;$('sound').onclick=()=>{const on=music.toggle();$('sound').textContent='♫ 音乐 '+(on?'开':'关');if(!on)hushRadio();};
function settingsDialog(back='menu'){showDialog(`<h2>选项设置</h2><label class="setting">音乐与音效 <input id="volume" type="range" min="0" max="1" step=".05" value="${settings.volume}"></label><label class="setting">视角灵敏度 <input id="sensitivity" type="range" min=".4" max="2" step=".1" value="${settings.sensitivity}"></label><label class="setting">画质 <select id="quality"><option value="standard">标准 · 动态阴影</option><option value="low">流畅 · 关闭阴影</option></select></label><p>鼠标锁定不可用时，可拖动右键或使用方向键转动镜头。</p><button class="action" id="closeSettings">返回</button>`);$('quality').value=settings.quality;const persist=()=>{try{localStorage.setItem('groundzero-settings',JSON.stringify(settings));}catch{}};$('volume').oninput=e=>{settings.volume=+e.target.value;music.setVolume(settings.volume);persist();};$('sensitivity').oninput=e=>{settings.sensitivity=+e.target.value;persist();};$('quality').onchange=e=>{settings.quality=e.target.value;applyQuality();persist();};$('closeSettings').onclick=()=>{hideDialog();if(back==='paused'){mode='playing';togglePause();}};}
$('controlHelp').onclick=()=>{if(mode==='playing')togglePause();};
$('endAftermath').onclick=()=>{if(state.aftermath)state.settle=true;};$('settings').onclick=()=>settingsDialog();$('about').onclick=()=>{showDialog('<div class="eyebrow">WAKE UP / 能力说明</div><h2>让全城加入反抗。</h2><p>九种三级变异：空气传播、可感染注射器、狂杀、持续感染、急速、皮糙肉厚、生存与进化、听我号令、薪火。升级卡显示下一等级的完整效果。</p><p>普通感染针按准星瞄准，只累积感染、不造成伤害；三级命中三次后，下一发升级为强化炮弹。狂杀三级每亲自完成十次击杀或同化释放血潮；军队独立战果不计入血潮。</p><p>短按 Shift 闪避 / 长按奔跑，R 装填旧档枪械，F 号令，Tab 地图。警戒达到 500 后进入两分钟镇压倒计时。</p><p>海滨钟楼广场移植自 INKWAVE © 2026 Jayden Davis（MIT）。<a href="./third-party/inkwave-LICENSE.txt" target="_blank" rel="noopener">许可与署名</a></p><button class="action" id="closeAbout">知道了</button>');$('closeAbout').onclick=hideDialog;};
function formatTime(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');}
// 复盘画面要安静，本局的曲子在这里淡出收尾。
function finish(result){if(state.bossDefeated)result='won';mode=result;music.stopBed();try{hushRadio();}catch{}try{clearAirstrike();}catch{}bossVictoryHold=0;policeAlertTimer=0;$('policeAlert').classList.remove('active','upgrade','boss','win','quest','radio');document.body.classList.toggle('awakened',result==='won');try{localStorage.removeItem(SAVE_KEY);}catch{}const pct=result==='won'?100:Math.min(99,Math.round(state.infected/40*100));showDialog(`<div class="eyebrow">${result==='won'?'CITY AWAKENED / 觉醒成功':'RUN COMPLETE / 本局复盘'}</div><h2 class="${result==='won'?'winTitle':''}">${result==='won'?'击败奶蛙龙！':`城市已感染 <span class="purple">${pct}%</span>`}</h2><p class="${result==='won'?'winSub':''}">${result==='won'?'带领市民们逃离规训，觉醒成功！':'这一次的反抗，已经留下了痕迹。'}</p><div class="stats"><div><small>累计感染</small><strong>${state.infected}</strong></div><div><small>存活队伍</small><strong>${teamCount(units)}</strong></div><div><small>最高警戒</small><strong>${ALERT_NAMES[state.peakAlert]||'尚未警觉'}</strong></div><div><small>存活时长</small><strong>${formatTime(state.time)}</strong></div></div><div class="recap"><div><b>能力构筑轨迹 · LV.${state.level}</b>${state.history.map(h=>`<p>${formatTime(h.time)}　${(ABILITIES.find(a=>a.id===h.id)?.name||'旧版枪械')} ${h.level}/3</p>`).join('')||'<p>未选择能力</p>'}</div><div><b>关键战绩</b><p>最后受击：${state.lastDamage||'无'}</p>${(state.damageLog||[]).map(d=>`<p>${d.time.toFixed(1)}s ${d.source} −${d.damage} (${d.before}生命)</p>`).join('')}<p>首次转化：${state.first?state.first.name+' · '+formatTime(state.first.time):'尚未转化'}</p><p>最大同时转化：${state.maxChain} 人</p><p>净化工兵转化：${state.purifiers} 名</p><p>最高转化 / 击败等级：${state.highestEnemy}</p><p>中枢瓦解：${state.towers}/3 · 破坏物件 ${state.destroyed}</p><p>初始人口转化：${state.cityInfected}/${POPULATION}</p></div></div><button class="action" id="again">返回主菜单 / 重新开始 ↗</button>`);$('again').onclick=()=>location.reload();}
// 走远、还没被感染的行人和巡逻队收回名额，下一波才能在身边再补。
function cullFarCivilians(){
 for(let i=units.length-1;i>=0;i--){
  const u=units[i];
  if(u.infection>0||(!isStreetCivilian(u)&&!isStreetPatrol(u)))continue;
  if(distance(player,u)<46)continue;
  releaseActor(u);
  units.splice(i,1);
 }
}
// 冲锋过来、又跑出玩家身边的敌兵也删掉，免得他们在屏幕外继续开枪。
function cullFarTroops(){
 for(let i=units.length-1;i>=0;i--){
  const u=units[i];
  if(!shouldCullTroop(u,distance(player,u)))continue;
  releaseActor(u);
  units.splice(i,1);
 }
}
function rememberSpawn(p){
 recentSpawnPoints.push(p);
 if(recentSpawnPoints.length>12)recentSpawnPoints.shift();
}
function separated(p){return recentSpawnPoints.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<2.4);}
// A squad shares one approach and one snapshot of the player's area. Never force a visible fallback.
function placeArmyRusher(type,job={}){
 if(units.filter(u=>u.type>0&&!u.converted&&!u.dead&&u.kind!=='corpse').length>=REINFORCEMENT_LIMITS.hostiles)return false;
 camera.getWorldDirection(viewScratch);
 const dir={x:viewScratch.x,z:viewScratch.z},origin={x:camera.position.x,z:camera.position.z};
 const safe=p=>world.free(p.x,p.z,1)&&hiddenSpawn(p,player,origin,dir,ENEMY_VIEW);
 const squad=job.squad||{goal:{x:player.x,z:player.z},front:Math.random()<.45,anchor:null};
 let p=null;
 if(squad.anchor){
  // Members stay near their squad, with fresh random spacing and lateral displacement.
  const angle=squad.angle+(Math.random()-.5)*1.6,radius=1.3+Math.random()*1.8;
  const q={x:squad.anchor.x+Math.sin(angle)*radius,z:squad.anchor.z+Math.cos(angle)*radius};
  if(safe(q))p=q;
 }
 if(!p){
  let wish=null;
  for(let i=0;i<36;i++){
   // If the preferred sector is blocked, sample the hidden rear area too.
   const candidate=reinforcementCandidate(player,dir,i<12?squad.front:false,Math.random);
   const q={x:candidate.x,z:candidate.z};wish=q;
   if(safe(q)&&!separated(q)){p=q;squad.angle=candidate.angle;break;}
  }
  if(!p){const q=world.nearest(wish.x,wish.z,1);if(safe(q)&&!separated(q)){p=q;squad.angle=Math.atan2(q.x-player.x,q.z-player.z);}}
  if(!p)return false;
  squad.anchor={...p};rememberSpawn(p);
 }
 const u=acquireUnitRecord(type,p.x,p.z,false,totalReinforcements%5);
 u.rush=job.role!=='patrol';u.ingressTime=REINFORCEMENT_LIMITS.ingressSeconds;u.ingressGoal={...squad.goal};u.ingressCull=80;
 units.push(u);return true;
}
// 行人和巡逻军队都补在前方路边，生成时就朝着街的方向走。
function placeOnStreet(type,region){
 if(Number.isInteger(region)){
  let p;for(let i=0;i<60;i++){const q=regionSpawnSpot(region);if(world.free(q.x,q.z,1)&&distance(player,q)>=8){p=q;break;}}
  p??=world.nearest((region%2?1:-1)*34,region>=2?30:-34,1);
  const u=acquireUnitRecord(type,p.x,p.z,true,totalReinforcements%5);u.rush=false;units.push(u);return;
 }
 const wish=planCivilianSpot(player,forward(),world.buildings);
 let p=world.nearest(wish.x,wish.z,1);
 if(distance(player,p)<9||separated(p)){
  const f=forward();
  p=world.nearest(player.x+f.x*16+(Math.random()-.5)*6,player.z+f.z*16+(Math.random()-.5)*6,1);
 }
 rememberSpawn(p);
 const u=acquireUnitRecord(type,p.x,p.z,false,totalReinforcements%5);
 const step=streetStroll(p.x,p.z,world.buildings);
 const dest=world.free(step.x,step.z,.8)?step:world.nearest(step.x,step.z,1);
 u.tx=dest.x;u.tz=dest.z;u.wander=4+Math.random()*3;u.rush=false;
 units.push(u);
}
// 警戒升级用英语呼叫增援；军队进场时另有飞机盘旋、投弹并劝降。
// 语音走系统朗读。静音、暂停和结算都会停掉，同一句不会叠着播。
let radioQueue=[],radioBusy=false,airWing=null,planeSpent={stage4:false,boss:false};
function westernVoice(){
 if(typeof speechSynthesis==='undefined')return null;
 const voices=speechSynthesis.getVoices();
 const en=voices.filter(v=>/^en([-_]|$)/i.test(v.lang));
 return en.find(v=>/en-US/i.test(v.lang)&&/male|daniel|alex|david|fred|aaron|arthur|rishi|mark/i.test(v.name))
  ||en.find(v=>/male|daniel|arthur|rishi|david|alex|mark/i.test(v.name))
  ||en.find(v=>/en-US|en-GB/i.test(v.lang))
  ||en[0]||null;
}
function hushRadio(){
 radioQueue.length=0;radioBusy=false;
 try{if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();}catch{}
}
function pumpRadio(){
 if(radioBusy||music.muted||typeof speechSynthesis==='undefined')return;
 const text=radioQueue.shift();if(!text)return;
 radioBusy=true;
 const line=new SpeechSynthesisUtterance(text);
 line.lang='en-US';line.rate=.96;line.pitch=.86;
 const voice=westernVoice();
 if(voice){line.voice=voice;line.lang=voice.lang;}
 const done=()=>{radioBusy=false;pumpRadio();};
 line.onend=done;line.onerror=done;
 try{speechSynthesis.resume?.();speechSynthesis.speak(line);}catch{radioBusy=false;}
}
function speakEnglish(text){
 if(!text||music.muted||typeof speechSynthesis==='undefined')return;
 if(radioQueue.includes(text)||radioQueue.length>=2)return;
 radioQueue.push(text);
 pumpRadio();
}
function callBackup(stage){
 const line=radioBackup(stage);if(!line)return;
 speakEnglish(line);
}
function disposeMesh(root){
 if(!root)return;
 scene.remove(root);
 root.traverse(o=>{
  o.geometry?.dispose?.();
  for(const m of [].concat(o.material||[]))m?.dispose?.();
 });
}
function makePlane(){
 const g=new T.Group();
 const hull=new T.MeshStandardMaterial({color:0x3c4650,roughness:.5,metalness:.25});
 const dark=new T.MeshStandardMaterial({color:0x242a30,roughness:.55,metalness:.2});
 const body=new T.Mesh(new T.BoxGeometry(1.05,.32,3.6),hull);
 const wing=new T.Mesh(new T.BoxGeometry(5.2,.08,.72),dark);wing.position.z=.15;
 const tail=new T.Mesh(new T.BoxGeometry(1.5,.07,.42),dark);tail.position.set(0,.2,-1.55);
 const fin=new T.Mesh(new T.BoxGeometry(.08,.62,.5),dark);fin.position.set(0,.42,-1.55);
 const prop=new T.Mesh(new T.BoxGeometry(.08,.9,.12),new T.MeshStandardMaterial({color:0xd7dde4,roughness:.4}));
 prop.position.z=1.85;
 g.add(body,wing,tail,fin,prop);scene.add(g);g.userData.prop=prop;
 return g;
}
function clearAirstrike(){
 if(!airWing)return;
 clearStrafeMarker();
 disposeMesh(airWing.mesh);
 airWing=null;
}
function beginAirstrike(){
 if(airWing)return;
 airWing={mesh:makePlane(),angle:Math.random()*Math.PI*2,time:AIRSTRIKE.duration,drop:.9,cx:player.x,cz:player.z,hp:AIRSTRIKE.hp,mode:'orbit',strafe:3.6,marker:null,shotsFired:0};
}
function planeAimPoint(){
 if(!airWing?.mesh||airWing.mode==='crash')return null;
 const p=airWing.mesh.position;
 return {x:p.x,y:p.y,z:p.z,radius:AIRSTRIKE.hit};
}
// 只有带爆炸的炮弹能打飞机。普通子弹和感染针不算。
function shellHitsPlane(b){
 if(!airWing?.mesh||airWing.mode==='crash'||!b||(!b.isPower&&!(b.splash>0)))return false;
 const p=airWing.mesh.position,dx=b.x-p.x,dy=(b.y??0)-p.y,dz=b.z-p.z;
 return dx*dx+dy*dy+dz*dz<=AIRSTRIKE.hit*AIRSTRIKE.hit;
}
function hurtPlane(amount){
 if(!airWing||airWing.mode==='crash'||amount<=0)return false;
 airWing.hp-=amount;
 const p=airWing.mesh.position;
 if(typeof burst==='function')burst(p.x,p.y,p.z,0xff6a3a,airWing.hp>0?12:18);
 if(airWing.hp>0)return false;
 toast('飞机被击落',1.6);
 beginPlaneCrash();
 return true;
}
// 击落之后先顺着飞行方向往下栽，撞到地面再炸开。栽的过程里不能再被瞄准。
function beginPlaneCrash(){
 if(!airWing||airWing.mode==='crash')return;
 clearStrafeMarker();
 const yaw=airWing.mesh.rotation.y;
 airWing.mode='crash';
 airWing.crashT=1.35;
 airWing.crashVx=Math.sin(yaw)*7;
 airWing.crashVz=Math.cos(yaw)*7;
}
function stepPlaneCrash(dt){
 const mesh=airWing.mesh;
 const ground=world.heightAt(mesh.position.x,mesh.position.z)+.4;
 airWing.crashT-=dt;
 mesh.position.x+=airWing.crashVx*dt;
 mesh.position.z+=airWing.crashVz*dt;
 const fall=6+(1.35-Math.max(0,airWing.crashT))*10;
 mesh.position.y=Math.max(ground,mesh.position.y-dt*fall);
 mesh.rotation.x=Math.min(1.2,(mesh.rotation.x||0)+dt*1.15);
 mesh.rotation.z+=dt*2.6;
 if(mesh.userData.prop)mesh.userData.prop.rotation.z+=dt*10;
 if(typeof burst==='function'&&Math.random()<dt*10)burst(mesh.position.x,mesh.position.y,mesh.position.z,0x4a4a4a,2,2);
 if(mesh.position.y<=ground+.05||airWing.crashT<=0){
  if(typeof burst==='function'){burst(mesh.position.x,ground+.5,mesh.position.z,0xff6a3a,32,8);burst(mesh.position.x,ground+.8,mesh.position.z,0x2a2a2a,12,3);}
  if(typeof wave==='function')wave(mesh.position.x,mesh.position.z,4.4,0xff5a32);
  clearAirstrike();
 }
}
function clearStrafeMarker(){
 const marker=airWing?.marker;if(!marker)return;
 scene.remove(marker);
 for(const effect of marker.userData.effects||[]){effect.geometry?.dispose?.();effect.material?.dispose?.();}
 airWing.marker=null;
}
function strafeMarker(lane){
 const y=world.heightAt(lane.x+lane.dx*lane.len/2,lane.z+lane.dz*lane.len/2);
 const group=new T.Group();
 const strip=new T.Mesh(new T.PlaneGeometry(AIRSTRIKE.strafeWidth*2,lane.len),new T.MeshBasicMaterial({color:STRIKE.enemy.bomb,transparent:true,opacity:.2,side:T.DoubleSide,depthWrite:false}));
 const spine=new T.Mesh(new T.PlaneGeometry(.16,lane.len),new T.MeshBasicMaterial({color:STRIKE.enemy.glow,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}));
 strip.rotation.x=spine.rotation.x=-Math.PI/2;spine.position.y=.03;
 group.add(strip,spine);group.userData.effects=[strip,spine];
 group.position.set(lane.x+lane.dx*lane.len/2,y+.07,lane.z+lane.dz*lane.len/2);
 group.rotation.y=Math.atan2(lane.dx,lane.dz);
 scene.add(group);return group;
}
function pulseStrafeMarker(marker,progress=0){
 if(!marker)return;
 const now=typeof performance!=='undefined'?performance.now():0;
 const flash=.4+.45*Math.sin(now*(.01+progress*.03));
 marker.userData.effects[0].material.opacity=.14+progress*.22;
 marker.userData.effects[1].material.opacity=flash;
}
function beginStrafeWarn(){
 const yaw=Math.random()*Math.PI*2,side=(Math.random()-.5)*2.4;
 const dx=Math.sin(yaw),dz=Math.cos(yaw),len=AIRSTRIKE.strafeLength;
 const mx=player.x-dz*side,mz=player.z+dx*side;
 const lane={x:mx-dx*len/2,z:mz-dz*len/2,dx,dz,len};
 airWing.lane=lane;airWing.marker=strafeMarker(lane);airWing.mode='warn';airWing.warn=AIRSTRIKE.strafeWarn;airWing.shotsFired=0;
}
function startStrafeDive(){
 const p=airWing.mesh.position;
 airWing.diveFrom={x:p.x,y:p.y,z:p.z};airWing.mode='dive';airWing.dive=AIRSTRIKE.strafeTime;airWing.diveTotal=AIRSTRIKE.strafeTime;
}
function finishStrafeDive(){
 clearStrafeMarker();
 airWing.mode='orbit';airWing.strafe=AIRSTRIKE.strafeGap;airWing.cx=player.x;airWing.cz=player.z;
 const p=airWing.mesh.position;airWing.angle=Math.atan2(p.z-player.z,p.x-player.x);airWing.mesh.rotation.x=0;
}
function fireStrafeShot(x,z,lane){
 const ty=world.heightAt(x,z),sx=airWing.mesh.position.x,sy=airWing.mesh.position.y,sz=airWing.mesh.position.z,flight=.22;
 const m=new T.Mesh(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:STRIKE.enemy.bullet}));
 m.position.set(sx,sy,sz);scene.add(m);
 tracers.push({m,strafe:true,lane,sx,sy,sz,tx:x,ty,tz:z,x:sx,y:sy,z:sz,life:flight,total:flight,damage:AIRSTRIKE.strafeDamage,from:'飞机扫射'});
}
function updateStrafeShot(b){
 const progress=T.MathUtils.clamp(1-b.life/b.total,0,1);
 b.x=T.MathUtils.lerp(b.sx,b.tx,progress);b.z=T.MathUtils.lerp(b.sz,b.tz,progress);b.y=T.MathUtils.lerp(b.sy,b.ty+.25,progress);
 b.m.position.set(b.x,b.y,b.z);
}
function impactStrafe(b){
 const width=AIRSTRIKE.strafeWidth,consider=[player,...units.filter(a=>a.kind==='ally'&&!a.dead)];
 for(const t of consider){
  if(!onStrafeLane(t.x,t.z,b.lane,width)||Math.hypot(t.x-b.tx,t.z-b.tz)>width)continue;
  hurtHostileTarget(t,b.damage,b.from);
 }
 if(typeof burst==='function')burst(b.tx,(b.ty||0)+.2,b.tz,STRIKE.enemy.spark,6);
}
function stepStrafeDive(dt){
 airWing.dive-=dt;
 const progress=T.MathUtils.clamp(1-airWing.dive/airWing.diveTotal,0,1),lane=airWing.lane,from=airWing.diveFrom;
 const approach=Math.min(1,progress/.28),along=Math.max(0,(progress-.28)/.72);
 const ax=T.MathUtils.lerp(from.x,lane.x,approach),az=T.MathUtils.lerp(from.z,lane.z,approach);
 const ay=T.MathUtils.lerp(from.y,world.heightAt(lane.x,lane.z)+5.5,approach);
 const bx=lane.x+lane.dx*lane.len*along,bz=lane.z+lane.dz*lane.len*along;
 const by=world.heightAt(bx,bz)+T.MathUtils.lerp(5.5,3.4,Math.sin(Math.min(1,along)*Math.PI));
 const diving=progress>=.28;
 airWing.mesh.position.set(diving?bx:ax,diving?by:ay,diving?bz:az);
 airWing.mesh.rotation.set(diving?.62:.2,diving?Math.atan2(lane.dx,lane.dz):Math.atan2(lane.x-from.x,lane.z-from.z),.18);
 pulseStrafeMarker(airWing.marker,1);
 const n=AIRSTRIKE.strafeShots;
 while(airWing.shotsFired<n&&along>=(airWing.shotsFired+.5)/n){
  const q=(airWing.shotsFired+.5)/n;
  fireStrafeShot(lane.x+lane.dx*lane.len*q,lane.z+lane.dz*lane.len*q,lane);
  airWing.shotsFired++;
 }
 if(airWing.dive<=0)finishStrafeDive();
}
function readStrafe(){
 const shots=(tracers||[]).filter(t=>t.strafe).length;
 if(!airWing)return {mode:'',warned:false,shots};
 return {mode:airWing.mode||'orbit',warned:!!airWing.marker,shots};
}
function readCrash(){
 if(!airWing)return {mode:'',y:0};
 return {mode:airWing.mode||'',y:airWing.mesh?.position.y||0};
}
function dropPlaneBomb(){
 const g={radius:AIRSTRIKE.radius,min:AIRSTRIKE.damage,max:AIRSTRIKE.damage};
 // 落点在玩家附近晃开。红圈亮着的时候走开就不受伤，而且只打玩家一侧。
 const tx=player.x+(Math.random()-.5)*8,tz=player.z+(Math.random()-.5)*8;
 let spot={x:tx,z:tz};
 try{const n=world.nearest(tx,tz,.5);if(n&&Math.hypot(n.x-tx,n.z-tz)<10)spot=n;}catch{}
 const flight=AIRSTRIKE.fall,sy=airWing.mesh.position.y,ty=world.heightAt(spot.x,spot.z);
 const m=new T.Mesh(new T.SphereGeometry(.22,10,8),new T.MeshStandardMaterial({color:STRIKE.enemy.bomb,emissive:STRIKE.enemy.glow,emissiveIntensity:2.4,roughness:.3}));
 m.position.set(airWing.mesh.position.x,sy,airWing.mesh.position.z);scene.add(m);
 tracers.push({m,marker:bombMarker(spot.x,spot.z,g.radius,false),lob:true,grenade:g,allyShot:false,life:flight,total:flight,sx:m.position.x,sy,sz:m.position.z,tx:spot.x,ty,tz:spot.z,x:m.position.x,y:sy,z:m.position.z,arc:1.5,damage:g.max,infection:0,from:'空中轰炸'});
}
function updateAirstrike(dt){
 if(airWing?.mode==='crash'){stepPlaneCrash(dt);return;}
 const phase=planePhase(state.alert,!!(boss.active&&!boss.dead));
 // 离开第 4 阶段或 Boss 战就收走。同一阶段打掉后不再补第二架。
 if(state.aftermath||!phase){if(airWing)clearAirstrike();return;}
 if(airWing)planeSpent[phase]=true;
 else if(!planeSpent[phase]){planeSpent[phase]=true;beginAirstrike();}
 if(!airWing)return;
 if(airWing.mode==='dive'){stepStrafeDive(dt);return;}
 airWing.cx+=(player.x-airWing.cx)*Math.min(1,dt*.4);
 airWing.cz+=(player.z-airWing.cz)*Math.min(1,dt*.4);
 airWing.angle+=dt*AIRSTRIKE.spin;
 const a=airWing.angle,r=AIRSTRIKE.orbit;
 const x=airWing.cx+Math.cos(a)*r,z=airWing.cz+Math.sin(a)*r;
 airWing.mesh.position.set(x,world.heightAt(x,z)+AIRSTRIKE.height,z);
 // 盘旋时压一点坡。俯冲时另算机头，这里只负责转圈。
 airWing.mesh.rotation.set(0,-a,.38);
 if(airWing.mesh.userData.prop)airWing.mesh.userData.prop.rotation.z+=dt*28;
 if(airWing.mode==='warn'){
  airWing.warn-=dt;pulseStrafeMarker(airWing.marker,1-Math.max(0,airWing.warn)/AIRSTRIKE.strafeWarn);
  if(airWing.warn<=0)startStrafeDive();
  return;
 }
 airWing.drop-=dt;
 if(airWing.drop<=0){airWing.drop=AIRSTRIKE.interval;dropPlaneBomb();}
 airWing.strafe-=dt;
 if(airWing.strafe<=0)beginStrafeWarn();
}
function spawnReinforcement(plan){
 if(mode==='ended'||mode==='won')return null;
 cullFarTroops();
 plan??=spawnPlan(state,units,Math.random,player,{queuedJobs:spawnQueue.jobs});
 const jobs=plan.jobs?[...plan.jobs].sort((a,b)=>(a.role==='army'?0:1)-(b.role==='army'?0:1)):[];
 if(!plan.jobs){
  for(const type of plan.rush)jobs.push({type,role:'army'});
  for(const type of plan.patrol)jobs.push({type,role:'patrol'});
  for(const type of plan.civilians)jobs.push({type,role:'civilian'});
 }
 if(!jobs.length)return plan;
 const accepted=enqueueSquads(spawnQueue,jobs,player,Math.random,TUNE.difficulty.spawnQueueMax||18);
 const arriving=jobs.slice(0,accepted).filter(j=>j.role==='army');
 // Alarm and manual-wave callers only enqueue; the frame flushes after updating the camera.
 if(arriving.length){
  const names=[...new Set(arriving.map(j=>ENEMIES[j.type].name))];
  toast(`增援小队正在接近 · ${names.join(' / ')} · ${arriving.length} 人`,2.2);
 }
 return plan;
}
// Boss 战继续分批投放。未削弱增援时波次更快，完成削弱后恢复普通节奏；结算后清空队列。
function updateReinforcements(dt){
 if(state.aftermath){spawnQueue.jobs.length=0;return;}
 flushSpawnQueue(dt);
 fodderTimer-=dt;reinforceTimer-=dt;
 if(spawnQueue.jobs.length>=Math.min(REINFORCEMENT_LIMITS.queue,TUNE.difficulty.spawnQueueMax||18))return;
 const includeFodder=fodderTimer<=0,includeThreat=reinforceTimer<=0;
 if(!includeFodder&&!includeThreat)return;
 const plan=spawnPlan(state,units,Math.random,player,{includeFodder,includeThreat,queuedJobs:spawnQueue.jobs});
 spawnReinforcement(plan);
 if(includeFodder)fodderTimer=TUNE.difficulty.fodderCheck;
 if(includeThreat)reinforceTimer=plan.interval;
 reinforceAnnounced=false;
}

function flushSpawnQueue(dt){
 const job=takeSquadJob(spawnQueue,dt,Math.max(.12,TUNE.difficulty.spawnGap||.18));if(!job)return;
 if(job.role==='civilian'||job.type===0)placeOnStreet(job.type,job.region);
 else if(placeArmyRusher(job.type,job)===false){spawnQueue.jobs.unshift(job);spawnQueue.wait=.6;}
}
function coneForward(u,primary){
 if(Number.isFinite(u?.sprayYaw))return {nx:Math.sin(u.sprayYaw),nz:Math.cos(u.sprayYaw),locked:true};
 const fx=primary.x-u.x,fz=primary.z-u.z,fl=Math.hypot(fx,fz)||1;
 return {nx:fx/fl,nz:fz/fl,locked:false};
}
function hostileConeHits(u,spec,primary){
 const range=spec.range,cosLimit=.5,aim=coneForward(u,primary);
 const hits=[];
 const consider=[player,...units.filter(a=>a.kind==='ally'&&!a.dead)];
 for(const t of consider){
  const dx=t.x-u.x,dz=t.z-u.z,d=Math.hypot(dx,dz);
  if(d>range||d<.02)continue;
  if((dx*aim.nx+dz*aim.nz)/d<cosLimit)continue;
  hits.push(t);
 }
 if(!aim.locked&&primary&&!hits.includes(primary)&&distance(u,primary)<=range+0.05)hits.push(primary);
 return hits;
}
function hurtHostileTarget(target,damage,source,attacker){
 if(target===player){if(invincible<=0)playerHurt(damage,source,attacker);}
 else damageAlly(target,damage,state,player);
}
function throwGrenade(u,spec,victim){
 const g=spec.grenade;if(!g)return;
 u.grenadeCd=g.cd;
 if(g.lob)return lobGrenade(u,spec,victim,false);
 const m=block(scene,.28,.28,.28,STRIKE.enemy.bomb,u.x,STANDING_CHEST+0.4,u.z);
 const dx=victim.x-u.x,dz=victim.z-u.z,len=Math.hypot(dx,dz)||1;
 tracers.push({m,x:u.x,z:u.z,vx:dx/len*9,vz:dz/len*9,life:.9,y:STANDING_CHEST+0.4,grenade:g,sourceId:u.id,from:ENEMIES[u.type].name+'手雷'});
}
function bombMarker(x,z,radius,ally){
 const fx=ally?STRIKE.ally:STRIKE.enemy,y=world.heightAt(x,z);
 const group=new T.Group(),disk=new T.Mesh(new T.CircleGeometry(radius,40),new T.MeshBasicMaterial({color:fx.bomb,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false})),ring=new T.Mesh(new T.RingGeometry(Math.max(.2,radius-.28),radius,48),new T.MeshBasicMaterial({color:fx.glow,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}));
 disk.rotation.x=ring.rotation.x=-Math.PI/2;group.add(disk,ring);group.position.set(x,y+.06,z);group.userData.effects=[disk,ring];scene.add(group);return group;
}
function pulseBombMarker(marker,progress=0){
 if(!marker)return;
 const flash=.45+.4*Math.sin(performance.now()*(.01+progress*.02));
 marker.userData.effects[0].material.opacity=.12+progress*.2;
 marker.userData.effects[1].material.opacity=flash;
 marker.scale.setScalar(1+progress*.06);
}
function disposeBombMarker(marker){
 if(!marker)return;scene.remove(marker);for(const effect of marker.userData.effects||[]){effect.geometry.dispose();effect.material.dispose();}
}
function lobGrenade(u,spec,victim,ally){
 const g=spec.grenade,fx=ally?STRIKE.ally:STRIKE.enemy,flight=g.fall||.95;
 const sy=world.heightAt(u.x,u.z)+STANDING_CHEST+1.2,ty=world.heightAt(victim.x,victim.z);
 const m=new T.Mesh(new T.SphereGeometry(.2,10,8),new T.MeshStandardMaterial({color:fx.bomb,emissive:fx.glow,emissiveIntensity:2.4,roughness:.3}));
 m.position.set(u.x,sy+4,u.z);scene.add(m);
 tracers.push({m,marker:bombMarker(victim.x,victim.z,g.radius,ally),lob:true,grenade:g,sourceId:u.id,attacker:{x:u.x,z:u.z,converted:ally,type:u.type},allyShot:ally,life:flight,total:flight,sx:u.x,sy:sy+5.5,sz:u.z,tx:victim.x,ty,tz:victim.z,x:u.x,y:sy+5.5,z:u.z,arc:6.2,damage:ally?allyMelee(u).damage:g.max,infection:0,from:(ally?ENEMIES[u.type].allyName:ENEMIES[u.type].name)+'炸弹'});
}
function updateLobBomb(b){
 const progress=T.MathUtils.clamp(1-b.life/b.total,0,1);
 b.x=T.MathUtils.lerp(b.sx,b.tx,progress);b.z=T.MathUtils.lerp(b.sz,b.tz,progress);
 b.y=T.MathUtils.lerp(b.sy,b.ty+.2,progress)+Math.sin(progress*Math.PI)*(b.arc||6);
 b.m.position.set(b.x,b.y,b.z);b.m.rotation.x+=frameDelta*6;b.m.rotation.z+=frameDelta*4;
 pulseBombMarker(b.marker,progress);
}
function lobBomb(u,spec,victim,nearest,allySide,marching=false){
 const reach=spec.range||16;
 if(!victim||nearest>reach)return 'idle';
 if((u.grenadeCd||0)>0)return marching?'idle':'windup';
 if(!world.clear(u,victim))return 'idle';
 if(allySide)throwAllyGrenade(u,spec,victim);else throwGrenade(u,spec,victim);
 return 'start';
}
function detonateGrenade(b){
 const g=b.grenade,fx=b.allyShot?STRIKE.ally:STRIKE.enemy;
 if(b.marker){disposeBombMarker(b.marker);b.marker=null;}
 if(b.lob){b.x=b.tx;b.z=b.tz;b.y=b.ty;}
 burst(b.x,b.y||STANDING_CHEST,b.z,fx.spark,18);wave(b.x,b.z,g.radius,fx.slam);
 // 觉醒后的手雷打回秩序方，形状和原来一样，伤害用觉醒后的攻击。
 if(b.allyShot){
  const max=g.max||1;
  for(const t of units){
   if(t.dead||t.converted||t.kind==='corpse')continue;
   const blast=grenadeBlast({grenade:g},Math.hypot(t.x-b.x,t.z-b.z));
   if(blast<=0)continue;
   const scale=blast/max;
   applyHit(t,Math.round((b.infection||0)*scale),Math.round((b.damage||0)*scale),true,b,units.find(u=>u.id===b.sourceId)||b.attacker);
  }
  if(boss.active&&!boss.dead){const blast=grenadeBlast({grenade:g},Math.hypot(boss.x-b.x,boss.z-b.z));if(blast>0)hitBoss(boss,Math.round((b.damage||0)*blast/max),units.find(u=>u.id===b.sourceId)||b.attacker);}
  return;
 }
 const consider=[player,...units.filter(a=>a.kind==='ally'&&!a.dead)];
 for(const t of consider){
  const d=Math.hypot(t.x-b.x,t.z-b.z);
  const dmg=grenadeBlast({grenade:g},d);
  if(dmg>0)hurtHostileTarget(t,dmg,b.from,units.find(u=>u.id===b.sourceId));
 }
}
const BOSS_ORB_RADIUS=2.6,BOSS_ORB_WINDUP=0;
function createBossTargetMarker(x,y,z){
 const r=BOSS_ORB_RADIUS,group=new T.Group(),disk=new T.Mesh(new T.CircleGeometry(r,48),new T.MeshBasicMaterial({color:0xffc928,transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending})),ring=new T.Mesh(new T.RingGeometry(r-.4,r,64),new T.MeshBasicMaterial({color:0xffe45b,transparent:true,opacity:.82,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));
 disk.rotation.x=ring.rotation.x=-Math.PI/2;group.add(disk,ring);group.position.set(x,y+.06,z);group.userData.effects=[disk,ring];scene.add(group);return group;
}
function pulseBossMarker(marker,progress=0){
 if(!marker)return;
 const flash=.55+.35*Math.sin(performance.now()*(.006+progress*.018));
 marker.userData.effects[0].material.opacity=.1+progress*.13;
 marker.userData.effects[1].material.opacity=flash;
 marker.scale.setScalar(1+Math.sin(performance.now()*.01)*.025);
}
function disposeBossMarker(marker){
 if(!marker)return;scene.remove(marker);for(const effect of marker.userData.effects||[]){effect.geometry.dispose();effect.material.dispose();}
}
function clearPendingOrb(){
 const pending=boss.pendingOrb;if(!pending)return;disposeBossMarker(pending.marker);boss.pendingOrb=null;
}
function bossCanTarget(b,target){return world.bossCanTarget?world.bossCanTarget(b,target):canBossBombTarget(b,target);}
function beginBossOrbCharge(){
 if(boss.pendingOrb||!bossCanTarget(boss,player))return false;
 const x=player.x,z=player.z,y=world.heightAt(x,z);
 boss.pendingOrb={x,y,z,marker:createBossTargetMarker(x,y,z)};
 if(BOSS_ORB_WINDUP<=0)return throwBossOrb();
 boss.orbWindup=BOSS_ORB_WINDUP;return true;
}
function throwBossOrb(){
 const pending=boss.pendingOrb;
 if(!pending||!bossCanTarget(boss,{x:pending.x,z:pending.z})){clearPendingOrb();return false;}
 boss.root.updateMatrixWorld(true);const mouth=boss.root.localToWorld(new T.Vector3(0,8.7,2)),flight=T.MathUtils.clamp(Math.hypot(pending.x-boss.x,pending.z-boss.z)/18,.9,1.45);
 const material=new T.MeshStandardMaterial({color:0xffe44f,emissive:0xffbd16,emissiveIntensity:3.5,roughness:.2}),orb=new T.Mesh(new T.IcosahedronGeometry(.48,1),material);orb.position.copy(mouth);orb.add(new T.PointLight(0xffd52d,3.6,8,1.5));scene.add(orb);
 tracers.push({m:orb,marker:pending.marker,bossOrb:true,life:flight,total:flight,sx:mouth.x,sy:mouth.y,sz:mouth.z,tx:pending.x,ty:pending.y,tz:pending.z,x:mouth.x,y:mouth.y,z:mouth.z,detonated:false});
 boss.pendingOrb=null;burst(mouth.x,mouth.y,mouth.z,0xffe158,18);music.effect('bossThrow');return true;
}
function releaseBossExplosion(x,z){
 const ground=world.heightAt(x,z);
 wave(x,z,10,0xffe45b);wave(x,z,7.2,0xff9a14);wave(x,z,4.4,0xfff4c0);
 burst(x,ground+.7,z,0xffe45b,70,14);burst(x,ground+1.8,z,0xff7a18,48,11);burst(x,ground+3.2,z,0xfff1a8,28,8);
 for(const [radius,color,opacity] of [[8.4,0xffc428,.9],[6.2,0xff6a10,.55],[3.6,0xfff6c8,.42]]){
  const blast=new T.Mesh(new T.SphereGeometry(1,22,16),new T.MeshBasicMaterial({color,transparent:true,opacity,blending:T.AdditiveBlending,depthWrite:false}));
  blast.position.set(x,ground+1.15,z);if(radius>7)blast.add(new T.PointLight(0xffd000,16,20,1.5));scene.add(blast);waves.push({m:blast,r:radius,t:0,fade:.85,grow:.28,opacity});
 }
 const flash=new T.Mesh(new T.CircleGeometry(1,36),new T.MeshBasicMaterial({color:0xfff3a8,transparent:true,opacity:.95,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));
 flash.rotation.x=-Math.PI/2;flash.position.set(x,ground+.08,z);scene.add(flash);waves.push({m:flash,r:9.5,t:0,fade:.7,grow:.22,opacity:.95});
 if(Math.hypot(player.x-x,player.z-z)<24)shake=Math.max(shake,.62);
}
function detonateBossOrb(projectile){
 if(projectile.detonated)return;projectile.detonated=true;const radius=BOSS_ORB_RADIUS,ground=world.heightAt(projectile.tx,projectile.tz);projectile.x=projectile.tx;projectile.z=projectile.tz;
 if(projectile.marker){disposeBossMarker(projectile.marker);projectile.marker=null;}
 releaseBossExplosion(projectile.tx,projectile.tz);world.breakAt(projectile.tx,projectile.tz,radius,75,burst,ground+.5);
 for(const target of [player,...units.filter(unit=>unit.kind==='ally'&&!unit.dead)]){const gap=Math.hypot(target.x-projectile.tx,target.z-projectile.tz);if(gap<radius)hurtHostileTarget(target,Math.round(60*(1-gap/radius*.65)),'巨像黄色炮弹',boss);}
 music.effect('bossImpact');
}
function updateBossOrb(projectile){
 const progress=T.MathUtils.clamp(1-projectile.life/projectile.total,0,1);projectile.x=T.MathUtils.lerp(projectile.sx,projectile.tx,progress);projectile.z=T.MathUtils.lerp(projectile.sz,projectile.tz,progress);projectile.y=T.MathUtils.lerp(projectile.sy,projectile.ty+.45,progress)+Math.sin(progress*Math.PI)*4.5;projectile.m.position.set(projectile.x,projectile.y,projectile.z);projectile.m.rotation.x+=frameDelta*5;projectile.m.rotation.z+=frameDelta*7;
 pulseBossMarker(projectile.marker,progress);
 if(projectile.life<=0)detonateBossOrb(projectile);
}
function enemyFire(u,spec,victim){
 const ranged=isRangedEnemy(spec);
 const visual=visuals.get(u.id)?.v;
 u.facingYaw=Math.atan2(victim.x-u.x,victim.z-u.z);
 if(visual){
  visual.holder.rotation.y=u.facingYaw;
  if(ranged)playCharacterAttack(visual,'shoot');
  visual.holdingGun=ranged;
 }
 u.attackCd=spec.interval;u.aim=0;u.aiming=false;
 const source=ENEMIES[u.type].name;
 if(spec.cone||spec.spray){
  for(const t of hostileConeHits(u,spec,victim))hurtHostileTarget(t,spec.damage,source,u);
  return;
 }
 // 重装大锤兵：以自己为心砸一圈。正中吃满伤害，外圈打六折。
 if(spec.slam){
  const radius=spec.slam.radius||4;
  for(const t of [player,...units.filter(a=>a.kind==='ally'&&!a.dead)]){
   const gap=Math.hypot(t.x-u.x,t.z-u.z);
   if(gap>radius)continue;
   hurtHostileTarget(t,Math.round(spec.damage*(gap<=radius*.55?1:.6)),source,u);
  }
  wave(u.x,u.z,radius,STRIKE.enemy.slam);burst(u.x,.6,u.z,STRIKE.enemy.spark,22,7);
  return;
 }
 if(ranged){
  const dx=victim.x-u.x,dz=victim.z-u.z,len=Math.hypot(dx,dz)||1;
  const y=victim===player?world.heightAt(player.x,player.z)+player.y+(player.crouch?CROUCH_CHEST:STANDING_CHEST):world.heightAt(victim.x,victim.z)+STANDING_CHEST;
  const m=acquireEnemyBullet(u.x,STANDING_CHEST,u.z);
  tracers.push({m,x:u.x,z:u.z,vx:dx/len*18,vz:dz/len*18,life:2,y,damage:spec.damage,sourceId:u.id,from:source,pooled:true});
 }else{hurtHostileTarget(victim,spec.damage,source,u);burst(victim.x,STANDING_CHEST,victim.z,STRIKE.enemy.spark,6);}
}
// 觉醒后的人打回原来的目标，但出手方式不改：枪还是枪，盾改成冲锋，锤子还是砸地。
function hurtAllyTarget(target,damage,infection,origin){
 if(target===boss){hitBoss(boss,damage,origin);return;}
 applyHit(target,infection,damage,true,origin);
}
function allyConeHits(u,spec,primary){
 const range=spec.range,cosLimit=.5,aim=coneForward(u,primary),hits=[];
 for(const t of units){
  if(t.dead||t.converted||t.kind==='corpse')continue;
  const dx=t.x-u.x,dz=t.z-u.z,d=Math.hypot(dx,dz);
  if(d>range||d<.02)continue;
  if((dx*aim.nx+dz*aim.nz)/d<cosLimit)continue;
  hits.push(t);
 }
 if(boss.active&&!boss.dead){
  const dx=boss.x-u.x,dz=boss.z-u.z,d=Math.hypot(dx,dz);
  if(d<=range&&d>.02&&(dx*aim.nx+dz*aim.nz)/d>=cosLimit)hits.push(boss);
 }
 if(!aim.locked&&primary&&primary!==boss&&!hits.includes(primary)&&distance(u,primary)<=range+.05)hits.push(primary);
 return hits;
}
function throwAllyGrenade(u,spec,victim){
 const g=spec.grenade;if(!g)return;
 u.grenadeCd=g.cd;
 if(g.lob)return lobGrenade(u,spec,victim,true);
 const strike=allyMelee(u);
 const m=block(scene,.28,.28,.28,STRIKE.ally.bomb,u.x,STANDING_CHEST+.4,u.z);
 const dx=victim.x-u.x,dz=victim.z-u.z,len=Math.hypot(dx,dz)||1;
 // 觉醒后的手雷只造成伤害，不附带感染。
 tracers.push({m,x:u.x,z:u.z,vx:dx/len*9,vz:dz/len*9,life:.9,y:STANDING_CHEST+.4,grenade:g,allyShot:true,damage:strike.damage,attacker:{x:u.x,z:u.z,converted:true,type:u.type},sourceId:u.id,infection:0,from:(ENEMIES[u.type].allyName||ENEMIES[u.type].name)+'手雷'});
}
function allyFire(u,spec,victim){
 const ranged=isRangedEnemy(spec),visual=visuals.get(u.id)?.v,strike=allyMelee(u);
 u.facingYaw=Math.atan2(victim.x-u.x,victim.z-u.z);
 if(visual){
  visual.holder.rotation.y=u.facingYaw;
  playCharacterAttack(visual,ranged?'shoot':(u.type===1||u.type===3||spec.slam)?'break':'infect');
  visual.holdingGun=ranged;
 }
 u.attackCd=spec.interval;u.aim=0;u.aiming=false;
 if(spec.cone||spec.spray){for(const t of allyConeHits(u,spec,victim))hurtAllyTarget(t,strike.damage,strike.infection,u);return;}
 if(spec.slam){
  const radius=spec.slam.radius||4;
  // 大锤砸地只造成伤害，不附带感染。近战和喷雾仍走上面的感染结算。
  for(const t of units){
   if(t.dead||t.converted||t.kind==='corpse')continue;
   const gap=Math.hypot(t.x-u.x,t.z-u.z);
   if(gap>radius)continue;
   const scale=gap<=radius*.55?1:.6;
   hurtAllyTarget(t,Math.round(strike.damage*scale),0,u);
  }
  if(boss.active&&!boss.dead){const gap=Math.hypot(boss.x-u.x,boss.z-u.z);if(gap<=radius)hitBoss(boss,Math.round(strike.damage*(gap<=radius*.55?1:.6)),u);}
  wave(u.x,u.z,radius,STRIKE.ally.slam);burst(u.x,.6,u.z,STRIKE.ally.spark,22,7);return;
 }
 if(ranged){
  const dx=victim.x-u.x,dz=victim.z-u.z,len=Math.hypot(dx,dz)||1;
  const m=acquireEnemyBullet(u.x,STANDING_CHEST,u.z,true);
  // 枪械沿用原来的射击，但子弹只造成伤害，不再把目标感染过去。
  tracers.push({m,x:u.x,z:u.z,vx:dx/len*18,vz:dz/len*18,life:2,y:world.heightAt(victim.x,victim.z)+STANDING_CHEST,damage:strike.damage,attacker:{x:u.x,z:u.z,converted:true,type:u.type},sourceId:u.id,infection:0,from:'ally',allyShot:true,pooled:true});
  return;
 }
 hurtAllyTarget(victim,strike.damage,strike.infection,u);burst(victim.x,STANDING_CHEST,victim.z,STRIKE.ally.spark,2);
}
function showHostilePose(u,spec,victim,start){
 const ranged=isRangedEnemy(spec);
 const visual=visuals.get(u.id)?.v;
 if(!visual||!victim)return;
 visual.holdingGun=ranged;
 visual.holder.rotation.y=Number.isFinite(u.chargeYaw)&&spec.charge?u.chargeYaw:Number.isFinite(u.sprayYaw)&&spec.spray?u.sprayYaw:Math.atan2(victim.x-u.x,victim.z-u.z);
 if(start&&!ranged)playCharacterAttack(visual,(u.type===1||u.type===3||spec.slam)?'break':'infect',Math.max(2,(spec.spray?spec.sprayWindup:hostileWindup(spec))+.2));
}
function purifierOccupied(u,spec,allySide){
 if(allySide){
  for(const t of units){if(!t.dead&&!t.converted&&t.kind!=='corpse'&&purifierConeHit(u,spec,t))return true;}
  return !!(boss.active&&!boss.dead&&purifierConeHit(u,spec,boss));
 }
 if(purifierConeHit(u,spec,player))return true;
 for(const t of units){if(t.kind==='ally'&&!t.dead&&purifierConeHit(u,spec,t))return true;}
 return false;
}
function sprayMist(u,spec){
 const yaw=u.sprayYaw||0,color=u.kind==='ally'?STRIKE.ally.spray:STRIKE.enemy.spray;
 for(let i=0;i<4;i++){
  const a=yaw+(Math.random()-.5)*1.05,dist=(spec.range||8)*(.28+Math.random()*.62);
  burst(u.x+Math.sin(a)*dist,1.05,u.z+Math.cos(a)*dist,color,5,1.6);
 }
}
function pulsePurifier(u,spec,allySide){
 const visual=visuals.get(u.id)?.v;
 if(visual){visual.holder.rotation.y=u.sprayYaw||0;playCharacterAttack(visual,'infect',.35);}
 const aim={x:u.x+Math.sin(u.sprayYaw||0)*(spec.range||8),z:u.z+Math.cos(u.sprayYaw||0)*(spec.range||8)};
 if(allySide){const strike=allyMelee(u);for(const t of allyConeHits(u,spec,aim))hurtAllyTarget(t,strike.damage,strike.infection,u);}
 else for(const t of hostileConeHits(u,spec,aim))hurtHostileTarget(t,spec.damage,ENEMIES[u.type].name,u);
 sprayMist(u,spec);
}
// 喷雾单位自己管前摇和持续喷射。返回 null 时，这一下仍走原来的近战或射击。
function tickPurifier(u,spec,victim,nearest,dt,allySide){
 if(!spec?.spray)return null;
 const going=u.sprayPhase==='windup'||u.sprayPhase==='spray';
 const canStart=!going&&victim&&nearest<spec.range&&(u.attackCd||0)<=0&&world.clear(u,victim);
 if(!going&&!canStart)return null;
 if(canStart)return beginPurifierSpray(u,spec,Math.atan2(victim.x-u.x,victim.z-u.z));
 const step=stepPurifierSpray(u,spec,purifierOccupied(u,spec,allySide),dt);
 const visual=visuals.get(u.id)?.v;
 if(visual&&Number.isFinite(u.sprayYaw))visual.holder.rotation.y=u.sprayYaw;
 if(step==='hit')pulsePurifier(u,spec,allySide);
 return step;
}
const sprayMarkers=new Map();
function showSprayWarning(u,spec){
 let mesh=sprayMarkers.get(u.id);
 if(!mesh){
  const half=Math.acos(.5),segs=16,pos=[0,.02,0];
  for(let i=0;i<=segs;i++){const a=-half+half*2*i/segs;pos.push(Math.sin(a),.02,Math.cos(a));}
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  const index=[];for(let i=1;i<=segs;i++)index.push(0,i,i+1);
  geo.setIndex(index);
  mesh=new T.Mesh(geo,new T.MeshBasicMaterial({color:0xffb03a,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide}));
  scene.add(mesh);sprayMarkers.set(u.id,mesh);
 }
 const warning=u.sprayPhase==='windup';
 mesh.material.color.setHex(u.kind==='ally'?(warning?STRIKE.ally.glow:STRIKE.ally.spray):(warning?STRIKE.enemy.glow:STRIKE.enemy.bomb));
 mesh.material.opacity=warning?.2+.12*Math.sin(performance.now()*.012):.36;
 mesh.position.set(u.x,world.heightAt(u.x,u.z)+.05,u.z);
 mesh.rotation.y=u.sprayYaw||0;
 mesh.scale.set(spec.range||8,1,spec.range||8);
 mesh.visible=distance(player,u)<36;
}
function hideSprayWarning(id){const mesh=sprayMarkers.get(id);if(mesh)mesh.visible=false;}
// 盾击只打撞到的人，并把他们沿冲锋方向掀起来。觉醒后的盾警改打敌人，特效用紫色。
function launchKnock(target,fx,fz,seconds){if(isMechanical(target))return;target.knock=Math.max(target.knock||0,seconds);target.knockX=fx;target.knockZ=fz;target.aiming=false;target.chargePhase='';}
function launchPlayer(fx,fz,damage,source,attacker){
 if(invincible<=0)playerHurt(damage,source,attacker);
 player.knock=Math.max(player.knock||0,1);player.knockX=fx;player.knockZ=fz;
 player.vy=Math.max(player.vy||0,9);if(player.y<=0)player.y=.02;player.roll=0;player.crouch=false;
 if(playerVisual)playerVisual.airborne=true;
}
// 坦克只有正在往前开才压人。敌方步兵被挤开，玩家和我方部队被撞飞并扣一大截血。
function rollTank(u){
 const spec=ENEMIES[u.type],tread=spec?.tread;if(!tread)return;
 const yaw=u.facingYaw||0,fx=Math.sin(yaw),fz=Math.cos(yaw);
 const driver={x:u.x,z:u.z,kind:u.kind,converted:u.converted,treadRadius:tread.radius};
 u.treadHit=u.treadHit||{};
 const ready=id=>{if((u.treadHit[id]||0)>state.time)return false;u.treadHit[id]=state.time+(tread.gap||.75);return true;};
 if(tankTreadKind(driver,{...player,isPlayer:true})==='ram'&&invincible<=0&&ready('player'))launchPlayer(fx,fz,tread.hit,spec.name+'撞击',u);
 for(const t of units){
  if(t===u)continue;
  const kind=tankTreadKind(driver,t);
  if(kind==='shove'){const push=tankShove(u,t,tread.radius);if(push.x||push.z)move(t,push.x,push.z);}
  else if(kind==='ram'&&ready(t.id)){
   launchKnock(t,fx,fz,tread.knock);
   hurtHostileTarget(t,tread.hit,spec.name+'撞击',u);
   if(typeof burst==='function')burst(t.x,STANDING_CHEST,t.z,STRIKE.enemy.spark,10);
  }
 }
}
function strikeShieldCharge(u,spec,allySide){
 const yaw=u.chargeYaw||0,fx=Math.sin(yaw),fz=Math.cos(yaw),knock=spec.charge?.knock??1;
 const color=allySide?STRIKE.ally.spark:STRIKE.enemy.spark;
 u.chargeHit=u.chargeHit||{};
 const mark=(id,x,z)=>{if(u.chargeHit[id])return false;u.chargeHit[id]=1;burst(x,STANDING_CHEST,z,color,8);return true;};
 if(!allySide){
  if(shieldChargeHits(u,spec,player)&&mark('player',player.x,player.z)&&invincible<=0)launchPlayer(fx,fz,spec.damage,ENEMIES[u.type].name,u);
  for(const t of units){if(t.kind!=='ally'||t.dead||!shieldChargeHits(u,spec,t)||!mark(t.id,t.x,t.z))continue;launchKnock(t,fx,fz,knock);hurtHostileTarget(t,spec.damage,ENEMIES[u.type].name,u);}
  return;
 }
 const strike=allyMelee(u);
 for(const t of units){if(t.dead||t.converted||t.kind==='corpse'||t.id===u.id||!shieldChargeHits(u,spec,t)||!mark(t.id,t.x,t.z))continue;launchKnock(t,fx,fz,knock);hurtAllyTarget(t,strike.damage,strike.infection,u);}
 if(boss.active&&!boss.dead&&shieldChargeHits(u,spec,boss)&&mark('boss',boss.x,boss.z))hurtAllyTarget(boss,strike.damage,0,u);
}
function tickShieldCharge(u,spec,victim,nearest,dt,allySide){
 if(!spec?.charge)return null;
 const going=u.chargePhase==='windup'||u.chargePhase==='dash';
 if(!going){
  if(!victim||nearest>(spec.range||7)||(u.attackCd||0)>0||!world.clear(u,victim))return 'idle';
  return beginShieldCharge(u,spec,Math.atan2(victim.x-u.x,victim.z-u.z));
 }
 const step=stepShieldCharge(u,spec,dt);
 if(step==='dash'){
  const yaw=u.chargeYaw||0,dist=u.chargeStep||0;
  if(dist>0){
   const fx=Math.sin(yaw),fz=Math.cos(yaw);
   move(u,fx*dist,fz*dist);
   // 冲进人群时把贴身的人拨开，冲锋不会埋进人堆里看不出来。
   for(const t of units){
    if(t===u||t.dead||t.kind==='corpse'||t.chargePhase)continue;
    const dx=t.x-u.x,dz=t.z-u.z,gap=Math.hypot(dx,dz);
    if(gap>=.72||gap<.02)continue;
    const push=.72-gap;
    move(t,dx/gap*push*.7+fx*push*.25,dz/gap*push*.7+fz*push*.25);
   }
  }
  strikeShieldCharge(u,spec,allySide);
  if((u.chargeDist||0)<=dist+.001)burst(u.x,.9,u.z,allySide?STRIKE.ally.spark:STRIKE.enemy.spark,8,2.2);
 }
 const visual=visuals.get(u.id)?.v;
 if(visual&&Number.isFinite(u.chargeYaw))visual.holder.rotation.y=u.chargeYaw;
 return u.chargePhase?step:'stop';
}
const chargeMarkers=new Map();
function showChargeWarning(u,spec){
 let mesh=chargeMarkers.get(u.id);
 if(!mesh){
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute([-.5,.04,0,.5,.04,0,.5,.04,1,-.5,.04,1],3));
  geo.setIndex([0,1,2,0,2,3]);
  mesh=new T.Mesh(geo,new T.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.34,depthWrite:false,side:T.DoubleSide}));
  scene.add(mesh);chargeMarkers.set(u.id,mesh);
 }
 const c=spec.charge||{},warning=u.chargePhase==='windup';
 const len=warning?(c.distance||3.2):Math.max(.35,(c.distance||3.2)-(u.chargeDist||0));
 mesh.material.color.setHex(u.kind==='ally'?(warning?STRIKE.ally.glow:STRIKE.ally.telegraph):(warning?STRIKE.enemy.glow:STRIKE.enemy.telegraph));
 mesh.material.opacity=warning?.24+.14*Math.sin(performance.now()*.016):.5;
 mesh.position.set(u.x,world.heightAt(u.x,u.z)+.05,u.z);
 mesh.rotation.set(0,u.chargeYaw||0,0);
 mesh.scale.set(c.wide||1.6,1,len);
 mesh.visible=distance(player,u)<36;
}
const CROWD_CELL=6;
const crowdScratch=[];
function crowdBuckets(list){const grid=new Map();for(const u of list){const cx=(u.x/CROWD_CELL)|0,cz=(u.z/CROWD_CELL)|0,key=cx+','+cz,bucket=grid.get(key);if(bucket)bucket.units.push(u);else grid.set(key,{cx,cz,units:[u]});}return grid;}
// Queries are consumed immediately by AI loops; reuse the buffer and scan occupied cells only.
function crowdNear(grid,x,z,radius){crowdScratch.length=0;if(!grid.size)return crowdScratch;const r=Math.ceil(radius/CROWD_CELL),cx=(x/CROWD_CELL)|0,cz=(z/CROWD_CELL)|0;for(const bucket of grid.values()){if(Math.abs(bucket.cx-cx)>r||Math.abs(bucket.cz-cz)>r)continue;for(const u of bucket.units)crowdScratch.push(u);}return crowdScratch;}
function civilianMoveTarget(u){
 const route=civilianTarget(u,world.buildings);
 if(!u.stationary&&!world.free(route.x,route.z,1))Object.assign(route,world.nearest(route.x,route.z,1));
 return route;
}
function attackHasLine(u,spec,victim,nearest,dt){
 if(!victim||nearest>=spec.range)return false;
 if(u.aiming){if((u.aim||0)>dt)return false;}
 else if((u.attackCd||0)>0)return false;
 const target=victim.id??-1;
 if(u.sightTarget!==target){u.sightTarget=target;u.sightRetry=0;u.sightBlocked=false;}
 // Only failed start checks are briefly backed off; every actual hit gets a fresh check.
 if(!u.aiming&&(u.sightRetry||0)>0)return false;
 const clear=world.clear(u,victim);u.sightBlocked=!clear;u.sightRetry=clear?0:.1;return clear;
}
function runAI(frameDt){world.beginNavigationFrame?.();const living=units.filter(u=>!u.dead&&u.kind!=='corpse'),allies=living.filter(u=>u.converted),hostiles=living.filter(u=>!u.converted);const crowd=crowdBuckets(living),allyGrid=crowdBuckets(allies),hostileGrid=crowdBuckets(hostiles);for(const u of living){let dt=frameDt;u.attackCd-=dt*(u.surge>0?1.3:1);u.hurt=Math.max(0,u.hurt-dt);u.sightRetry=Math.max(0,(u.sightRetry||0)-dt);let tx=u.x,tz=u.z,pace=0;if(isMechanical(u)){u.knock=0;u.root=0;u.slow=false;u.parasite=false;}else if((u.knock||0)>0){u.knock=Math.max(0,u.knock-dt);u.aiming=false;u.chargePhase='';u.attackCd=Math.max(u.attackCd||0,.4);move(u,(u.knockX||0)*6.5*dt,(u.knockZ||0)*6.5*dt);const kd=distance(player,u);const vis=visuals.get(u.id)?.v;if(vis){vis.holder.rotation.y=Math.atan2(u.knockX||0,u.knockZ||0);if(kd<actorViewLimit(u)&&actorInFront(u,kd))updateCharacterVisual(vis,false,dt,kd);else vis.holder.visible=false;}continue;}const d=distance(player,u);if(d<36&&!u.chargePhase&&!isMechanical(u)){let pushX=0,pushZ=0;for(const other of crowdNear(crowd,u.x,u.z,1.2)){if(other.id<=u.id)continue;const dx=u.x-other.x,dz=u.z-other.z,gap=Math.hypot(dx,dz);if(gap>.01&&gap<.85){const push=(.85-gap)*dt*2;pushX+=dx/gap*push;pushZ+=dz/gap*push;}}const force=Math.hypot(pushX,pushZ);if(force>.0001){const scale=Math.min(1,dt*4.5/force);move(u,pushX*scale,pushZ*scale);}}if(d>58||((u.kind==='ally'||u.converted)&&d>ALLY_VIEW)){u.logicElapsed=(u.logicElapsed||0)+dt;u.logicWait=(u.logicWait||0)-dt;if(u.logicWait>0)continue;dt=u.logicElapsed;u.logicElapsed=0;u.logicWait=d>58?.35:.2;}else{dt+=u.logicElapsed||0;u.logicElapsed=0;u.logicWait=0;}if(u.kind==='human'){const act=TUNE.activity,spot=civilianMoveTarget(u);tx=spot.x;tz=spot.z;pace=Math.hypot(tx-u.x,tz-u.z)>.7?act.shambleSpeed:0;}
else if(u.kind==='ally'){const act=TUNE.activity,spec=ENEMIES[u.type],look=Math.max(20,(spec.range||2)+2);let victim=null,nearest=look;for(const h of crowdNear(hostileGrid,u.x,u.z,look)){if(!allySeeksHostile(h))continue;if(u.guard&&distance(player,h)>GUARD_LEASH)continue;const dd=distance(u,h);if(dd<nearest){nearest=dd;victim=h;}}let closingOnBoss=false;if(!victim&&boss.active&&!boss.dead&&!(u.guard&&distance(player,boss)>GUARD_LEASH)){const bd=distance(u,boss);if(bd<=look){victim=boss;nearest=bd;}else{tx=boss.x;tz=boss.z;pace=act.chaseSpeed;closingOnBoss=true;}}if(victim||(spec.spray&&u.sprayPhase)||(spec.charge&&u.chargePhase)){if(victim){tx=victim.x;tz=victim.z;}u.grenadeCd=(u.grenadeCd||0)-dt;if(victim&&spec.grenade&&!spec.bomber&&u.grenadeCd<=0&&nearest<14&&nearest>3.2&&world.clear(u,victim))throwAllyGrenade(u,spec,victim);const swing=spec.charge?tickShieldCharge(u,spec,victim,nearest,dt,true):spec.bomber?lobBomb(u,spec,victim,nearest,true):tickPurifier(u,spec,victim,nearest,dt,true)??stepHostileMelee(u,spec,nearest,attackHasLine(u,spec,victim,nearest,dt),dt);if(swing==='start'||swing==='windup'||swing==='spraying'||swing==='stop'||swing==='dash'){pace=0;if(victim)showHostilePose(u,spec,victim,swing==='start');}else if(swing==='hit'){pace=0;if(!spec.spray)allyFire(u,spec,victim);}else if(swing==='miss'){pace=0;const visual=visuals.get(u.id)?.v;if(visual)visual.holdingGun=false;}else pace=nearest<=spec.range*.82&&!u.sightBlocked&&!(spec.bomber&&victim&&!world.clear(u,victim))&&!(spec.charge&&victim&&!world.clear(u,victim))?0:act.chaseSpeed;}else if(!closingOnBoss){const visual=visuals.get(u.id)?.v;if(visual)visual.holdingGun=false;if(u.guard||squadIds.has(u.id)){const angle=u.id*2.4;tx=player.x+Math.sin(angle)*3;tz=player.z+Math.cos(angle)*3;pace=act.followSpeed;}else{const structure=world.towers.find(o=>!o.dead&&distance(u,o)<28);if(structure){tx=structure.x;tz=structure.z;pace=act.structureSpeed;if(distance(u,structure)<3&&u.attackCd<=0){world.breakAt(u.x,u.z,2, u.profession===2?24:8,burst);u.attackCd=2;}}else{u.wander-=dt;if(u.wander<=0){u.tx=u.x+(Math.random()-.5)*act.awakeRadius*2;u.tz=u.z+(Math.random()-.5)*act.awakeRadius*2;u.wander=act.awakeIdle*(.55+Math.random()*.9);}tx=u.tx;tz=u.tz;pace=act.awakeSpeed;}}}if(!victim&&u.profession===1&&distance(u,player)<5&&u.attackCd<=0&&state.hp<state.maxHp){state.hp=Math.min(state.maxHp,state.hp+10);u.attackCd=25;toast('医生支援 +10',1);}}
else{const ingress=stepIngress(u,dt);const idle=!ingress&&!u.rush&&((!alerted&&state.time<8)||d>(player.crouch?15:27+state.alert*3));if(idle&&!u.sprayPhase&&!u.chargePhase){u.aiming=false;u.aim=0;const visual=visuals.get(u.id)?.v;if(visual){visual.holdingGun=false;updateCharacterVisual(visual,false,dt,d);}u.wander-=dt;if(u.wander<=0){const step=streetStroll(u.x,u.z,world.buildings);const spot=world.free(step.x,step.z,1)?step:world.nearest(step.x,step.z,1);u.tx=spot.x;u.tz=spot.z;u.wander=4+Math.random()*3;}tx=u.tx;tz=u.tz;pace=Math.hypot(tx-u.x,tz-u.z)>.7?Math.min(Math.max(ENEMIES[u.type].speed*.5,.8),1.5):0;}else{let victim=player,nearest=d;for(const a of crowdNear(allyGrid,u.x,u.z,ingress?Math.min(nearest,Math.max(14,ENEMIES[u.type].range+2)):Math.min(nearest,32))){const dd=distance(u,a);if(dd<nearest){nearest=dd;victim=a;}}const spec=ENEMIES[u.type];tx=victim.x;tz=victim.z;u.grenadeCd=(u.grenadeCd||0)-dt;if(spec.grenade&&!spec.bomber&&u.grenadeCd<=0&&nearest<14&&nearest>3.2&&world.clear(u,victim))throwGrenade(u,spec,victim);const swing=spec.charge?tickShieldCharge(u,spec,victim,nearest,dt,false):spec.bomber?lobBomb(u,spec,victim,nearest,false,!!ingress):tickPurifier(u,spec,victim,nearest,dt,false)??stepHostileMelee(u,spec,nearest,attackHasLine(u,spec,victim,nearest,dt),dt);if(swing==='start'||swing==='windup'||swing==='spraying'||swing==='stop'||swing==='dash'){pace=0;showHostilePose(u,spec,victim,swing==='start');}else if(swing==='hit'){pace=0;if(!spec.spray)enemyFire(u,spec,victim);}else if(swing==='miss'){pace=0;const visual=visuals.get(u.id)?.v;if(visual)visual.holdingGun=false;}else pace=nearest<=spec.range*.82&&!u.sightBlocked&&!(spec.bomber&&!world.clear(u,victim))&&!(spec.charge&&!world.clear(u,victim))?0:spec.speed;if(ingress&&(!['start','windup','spraying','stop','dash','hit'].includes(swing))){tx=ingress.x;tz=ingress.z;pace=spec.speed;}}}
if(u.surge>0)pace*=1.3;if(u.slow)pace*=.85;if(u.root>0)pace=0;if(pace)({x:tx,z:tz}=world.waypoint(u,tx,tz));if(u.guard){const spot=guardMoveTarget(player,tx,tz);tx=spot.x;tz=spot.z;if(distance(player,u)>GUARD_LEASH)pace=Math.max(pace,TUNE.activity.followSpeed);}const len=Math.hypot(tx-u.x,tz-u.z);let moving=false;if(pace&&len>.1){const step=Math.min(pace*dt,len),vx=(tx-u.x)/len*step,vz=(tz-u.z)/len*step;moving=move(u,vx,vz,true);const vis=visuals.get(u.id)?.v;if(moving){u.facingYaw=Math.atan2(vx,vz);if(vis)vis.holder.rotation.y=u.facingYaw;if(ENEMIES[u.type]?.tank)rollTank(u);}}if(u.guard&&distance(player,u)>GUARD_LEASH){const back=guardMoveTarget(player,u.x,u.z),gap=distance(player,u),step=Math.min(gap-GUARD_LEASH,TUNE.activity.followSpeed*dt);moving=move(u,(back.x-u.x)/gap*step,(back.z-u.z)/gap*step)||moving;}const v=visuals.get(u.id)?.v;if(v){if(d<actorViewLimit(u)&&actorInFront(u,d))updateCharacterVisual(v,moving,dt,d);else v.holder.visible=false;}}}
function dropActorVisual(u){const entry=visuals.get(u.id);if(!entry)return;if(typeof stripTankShell==='function')stripTankShell(entry.v);if(entry.v.aura){removeAura(entry.v.aura);entry.v.aura=null;}releaseCharacterVisual(entry.v);visuals.delete(u.id);}
function syncActorPresence(){
 const ranked=[];
 for(const u of units){
  if(u.kind==='expired'||u.kind==='fallen'||u.dead){dropActorVisual(u);continue;}
  const d=distance(player,u),limit=actorViewLimit(u),entry=visuals.get(u.id);
  if(d>=(entry?limit+4:limit)){dropActorVisual(u);continue;}
  if(!actorInFront(u,d)){dropActorVisual(u);continue;}
  ranked.push({u,d});
 }
 ranked.sort((a,b)=>a.d-b.d);
 const keep=new Set(ranked.slice(0,VISUAL_BUDGET).map(item=>item.u.id));
 let created=0;
 for(const item of ranked){if(keep.has(item.u.id)){if(!visuals.get(item.u.id)&&created<2&&actorInFront(item.u,item.d)){actorVisual(item.u);created++;}}else dropActorVisual(item.u);}
}
function updateVisuals(dt){syncActorPresence();for(const {v} of visuals.values())v.marker.visible=false;for(const u of units){const entry=visuals.get(u.id);if(!entry)continue;const {v}=entry;if(typeof syncTankShell==='function')syncTankShell(v,u);if(v.model){v.fitScale??=v.model.scale.x;v.model.scale.setScalar(v.fitScale*(u.surge>0?1.3:1));}const d=distance(player,u);v.holder.visible=d<actorViewLimit(u)&&actorInFront(u,d);v.holder.position.set(u.x,world.heightAt(u.x,u.z)+(u.knock>0?Math.sin((1-Math.min(1,u.knock))*Math.PI)*1.15:0),u.z);if(u.converted&&!u.dead&&!v.aura)v.aura=makeAura(v.holder,u.type===0?AURA_COLORS.worker:AURA_COLORS.guard);if(v.aura){if(u.dead){removeAura(v.aura);v.aura=null;}else v.aura.g.visible=v.holder.visible&&distance(player,u)<34;}if(u.dead){v.holder.visible=false;continue;}if(entry.oldKind!==u.kind){if(u.kind==='ally'){const yaw=v.holder.rotation.y;
 // 按转化后的类型选择外观：市民换觉醒外形；警察换成变异形态（感染前的模型不带配件）；
 // 其余军人留着原来的模型。这里必须和 actorVisual 的兵种判断一致，否则转化时换不出模型。
 // 同上：护卫不换变异形态。
 const modelKind=u.type===0?'ally':(u.type===1||u.type===3)&&!u.guard&&assets?.infectedCop?'infectedCop':'guard';
 // 兵种模型（batonCop / shieldCop / infectedCop）和通用警卫共用同一个模型池，
 // 光比对池键分不出「棍警」和「变异形态」（都是 guard 池），必须再比对兵种名。
 // 换完在 entry 上记一笔，否则下一帧 v.kind 被改成 ally 后又会被判成要换，反复重建。
 // 回归测试只注入部分函数，所以这里做 typeof 守卫并给出等价的本地实现。
 const poolOf=typeof visualPoolKey==='function'?visualPoolKey:(k=>k==='human'||k==='ally'?k:'guard');
 const needSwap=(entry.modelKind??null)!==modelKind;
 if(needSwap&&(poolOf(modelKind)!==v.poolKey||v.kind!==modelKind)){
  if(v.aura){removeAura(v.aura);v.aura=null;}
  if(typeof stripTankShell==='function')stripTankShell(v);
  releaseCharacterVisual(v);
  const nv=acquireCharacterVisual(assets,modelKind,u.profession);
  setCharacterKind(nv,'ally');
  // 感染后的警察要拿上盾牌/棍子（回归测试只注入部分函数，所以加 typeof 守卫）。
  if(typeof attachCopProp==='function')attachCopProp(nv,u);
  nv.holder.position.set(u.x,world.heightAt(u.x,u.z),u.z);
  nv.holder.rotation.set(0,yaw,0);scene.add(nv.holder);entry.v=nv;
 }else{setCharacterKind(v,'ally');v.holder.rotation.set(0,yaw,0);v.attackTime=0;v.holdingGun=false;}entry.modelKind=modelKind;entry.oldKind=u.kind;burst(u.x,1,u.z,0xba77ed,12);continue;}if(u.kind==='corpse'){if(!ENEMIES[u.type]?.tank){v.holder.rotation.x=Math.PI/2;v.holder.rotation.z=0;}v.attackTime=0;v.holdingGun=false;v.holder.position.y=world.heightAt(u.x,u.z)+.3;}entry.oldKind=u.kind;}if(u.kind==='corpse'){if(!ENEMIES[u.type]?.tank){v.holder.rotation.x=Math.PI/2;v.holder.rotation.z=0;}v.attackTime=0;v.holdingGun=false;if(v.current){v.mixer?.stopAllAction();v.current=null;}v.holder.position.y=world.heightAt(u.x,u.z)+.3;v.holder.visible=distance(player,u)<45;}}
for(const a of auraVisuals.values())a.visible=false;if(state.abilities.air)aura('mother',player.x,player.z,[0,5,10,15][state.abilities.air],0xb377e7);for(const u of units){if(u.dead||u.kind==='corpse')continue;if(u.aiming&&!isRangedEnemy(ENEMIES[u.type])&&!ENEMIES[u.type].spray&&!ENEMIES[u.type].charge&&distance(player,u)<22)aura('melee'+u.id,u.x,u.z,ENEMIES[u.type].range+.2,u.kind==='ally'?STRIKE.ally.telegraph:STRIKE.enemy.telegraph);else if(u.type===4&&distance(player,u)<32)aura(u.id,u.x,u.z,ENEMIES[4].aura||8,u.converted?0xb377e7:0x69bce8);if(u.sprayPhase&&ENEMIES[u.type]?.spray)showSprayWarning(u,ENEMIES[u.type]);if(u.chargePhase&&ENEMIES[u.type]?.charge&&typeof showChargeWarning==='function')showChargeWarning(u,ENEMIES[u.type]);}
const spraying=new Set(),charging=new Set();for(const u of units){if(u.dead)continue;if(u.sprayPhase)spraying.add(u.id);if(u.chargePhase)charging.add(u.id);}
for(const [id] of (typeof sprayMarkers==='undefined'?[]:sprayMarkers))if(!spraying.has(id))disposeActorWarning(sprayMarkers,id);
for(const [id] of (typeof chargeMarkers==='undefined'?[]:chargeMarkers))if(!charging.has(id))disposeActorWarning(chargeMarkers,id);}
// 全城弥漫的紫色烟雾（参考 Megabonk）：大号半透明紫烟片铺满城市上空，缓慢漂移旋转；
// 远处那些本身也会被紫雾吞掉，和雾叠在一起就是「蒙在迷雾里」的效果。
const citySmoke=[];let citySmokeGroup=null,citySmokeT=0;
// 主角 SMOKE_INNER 米内完全没烟，到 SMOKE_OUTER 米加满：中间用 smoothstep 过渡，
// 避免出现「主角周围一圈干净、外面突然全白」的硬边。
const SMOKE_INNER=9,SMOKE_OUTER=34;
function buildCitySmoke(){
 if(citySmokeGroup)return;
 // 测试沙箱只注入部分全局，缺 Three/场景/烟图集时直接跳过，不建烟。
 if(typeof T==='undefined'||typeof scene==='undefined'||typeof makeSmokeSprite!=='function'||typeof smokeTexture==='undefined')return;
 citySmokeGroup=new T.Group();
 // 体积感来自分层：近地薄而实、中层、高空大而淡，三层用不同漂浮速度形成视差。
 for(let i=0;i<108;i++){
  // 复用 Galaxy 的 8x8 烟雾图集，普通半透明叠加（不加光），白紫两档颜色交错。
  // 白紫浓雾：颜色接近白、只带一点紫味，靠不透明度堆浓度，而不是靠压暗。
  const layer=i%3;
  const size=layer===0?15+Math.random()*10:layer===1?21+Math.random()*13:30+Math.random()*18;
  const y=layer===0?.6+Math.random()*2:layer===1?2.6+Math.random()*4.4:7+Math.random()*7;
  const op=layer===0?Math.min(1,.84+Math.random()*.2):layer===1?Math.min(1,.78+Math.random()*.2):Math.min(1,.7+Math.random()*.22);
  const s=makeSmokeSprite(0xffffff,size,op);
  s.material.color.multiplyScalar(1.25);  // 烟片同样给到 HDR，跟雾一起被 ACES 提亮，不然白得发灰
  const ang=Math.random()*6.283,rad=Math.sqrt(Math.random())*70;
  s.position.set(Math.cos(ang)*rad,y,Math.sin(ang)*rad);
  s.material.rotation=Math.random()*6.283;
  s.userData={phase:Math.random()*6.283,baseY:y,bob:.35+layer*.3,spin:(Math.random()<.5?-1:1)*(.03+Math.random()*.05),op,rad};
  citySmokeGroup.add(s);citySmoke.push(s);
 }
 scene.add(citySmokeGroup);
}
buildCitySmoke();
function updateEffects(dt){
 if(typeof citySmokeGroup!=='undefined'&&citySmokeGroup){citySmokeT+=dt;
  // 紫烟跟着雾走：菜单预览要看清整张地图，烟一并收起来，进游戏再弥漫。
  citySmokeGroup.visible=typeof fogVisible==='function'?fogVisible():true;
  // 雾跟着玩家平移，跑到哪都泡在雾里；没有 player（菜单/测试沙箱）就留在原点。
  if(typeof player!=='undefined'&&player)citySmokeGroup.position.set(player.x,0,player.z);
  for(const s of citySmoke){const u=s.userData;s.position.y=u.baseY+Math.sin(citySmokeT*.3+u.phase)*u.bob;s.material.rotation+=u.spin*dt;
   // 烟跟着玩家走，rad 就是这片烟到玩家的距离：近处淡到 0，往外平滑加浓。
   const t=Math.min(1,Math.max(0,(u.rad-SMOKE_INNER)/(SMOKE_OUTER-SMOKE_INNER)));
   s.material.opacity=u.op*(t*t*(3-2*t));}}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.v.y-=9*dt;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*4;if(p.life<=0){scene.remove(p.m);particles.splice(i,1);}}for(let i=waves.length-1;i>=0;i--){const w=waves[i];w.t+=dt;const fade=w.fade||.6,grow=w.grow||.35;w.m.scale.setScalar(w.r*Math.min(1,w.t/grow));if(w.m.material){if(w.opacity==null)w.opacity=w.m.material.opacity||1;w.m.material.opacity=Math.max(0,w.opacity*(1-w.t/fade));}if(w.t>fade){scene.remove(w.m);w.m.geometry?.dispose?.();w.m.material?.dispose?.();waves.splice(i,1);}}
const bulletAllies=[];for(const a of units)if(a.kind==='ally'&&!a.dead)bulletAllies.push(a);for(let i=tracers.length-1;i>=0;i--){const b=tracers[i];b.life-=dt;if(b.m){
 if(b.bossOrb)updateBossOrb(b);
 else if(b.isPower){
  updatePowerShot(b,dt);
  if(b.life>0&&typeof shellHitsPlane==='function'&&shellHitsPlane(b)){hurtPlane(Math.max(b.damage||0,AIRSTRIKE.hp)*kindlingMultiplier(state,player));detonatePowerShot(b);b.life=0;}
  else if(b.life>0){
   let boom=false;
   if(boss.active&&!boss.dead&&distance(b,boss)<3.4&&b.y>=boss.root.position.y-.2&&b.y<=boss.root.position.y+10.5){hitBoss(boss,90);boom=true;}
   else for(const u of units)if(!u.dead&&!u.converted&&u.kind!=='corpse'&&distance(b,u)<PLAYER_HEIGHT*.64&&b.y>=world.heightAt(u.x,u.z)-.2&&b.y<=world.heightAt(u.x,u.z)+PLAYER_HEIGHT*1.3){boom=true;break;}
   if(boom){detonatePowerShot(b);b.life=0;}
  }
 }else if(b.from==='launcher'&&b.manualAim){__comicStepNeedle(b,dt);
 }else if(b.lob){updateLobBomb(b);}else if(b.strafe){updateStrafeShot(b);}else{
  b.x+=b.vx*dt;b.z+=b.vz*dt;b.m.position.set(b.x,b.y??STANDING_CHEST,b.z);
  if(b.grenade){if(world.solid(b.x,b.z,.18))b.life=0;}
  else if(world.solid(b.x,b.z,.1)){if(b.friendly)world.breakAt(b.x,b.z,b.splash||.75,18,burst);b.life=0;}
  else if(b.allyShot){
   if(boss.active&&!boss.dead&&distance(b,boss)<1.1){hitBoss(boss,b.damage||0,units.find(u=>u.id===b.sourceId)||b.attacker);b.life=0;}
   else for(const u of units){if(u.dead||u.converted||u.kind==='corpse'||distance(b,u)>=.6)continue;applyHit(u,b.infection||0,b.damage||0,true,{x:b.x-b.vx,z:b.z-b.vz},units.find(a=>a.id===b.sourceId)||b.attacker);if(b.infection)burst(b.x,STANDING_CHEST,b.z,0xc781ff,8);b.life=0;break;}
  }
  else if(b.friendly){
   if(typeof shellHitsPlane==='function'&&shellHitsPlane(b)){hurtPlane((b.damage||0)*kindlingMultiplier(state,player));b.life=0;}
   else{
   const splash=b.splash||0,hitR=splash||.72;
   // 感染针不带伤害，只有强化炮弹（爆炸）才结算伤害，因此这里不能回落到默认伤害值。
   if(boss.active&&!boss.dead&&!b.hitIds?.has('boss')&&distance(b,boss)<3.4+splash){b.hitIds?.add('boss');onPlayerProjectileHit(b);if(b.damage>0)hitBoss(boss,b.damage);burst(b.x,3,b.z,b.m.material?.color?.getHex?.()||0xc978ff,12);if((b.pierce||0)>0)b.pierce--;else b.life=0;}
   else for(const u of units){
    if(u.dead||u.converted||u.kind==='corpse'||(b.hitIds&&b.hitIds.has(u.id))||distance(b,u)>=hitR)continue;
    b.hitIds?.add(u.id);
    onPlayerProjectileHit(b);applyHit(u,b.infection||0,b.damage||0,false,{x:b.x-b.vx,z:b.z-b.vz});burst(b.x,STANDING_CHEST,b.z,0xb76bff,12);
    if(splash)for(const n of units)if(n!==u&&!n.dead&&!n.converted&&distance(n,u)<splash)applyHit(n,(b.infection||0)*.5,(b.damage||0)*.5,false,b);
    // 2 级发射器穿透：打中后继续飞，已经打过的人不再结算。
    if((b.pierce||0)>0)b.pierce--;else{b.life=0;break;}
   }
   }
  }else if(distance(b,player)<.58&&(b.y??STANDING_CHEST)>world.heightAt(player.x,player.z)+player.y+.12&&(b.y??STANDING_CHEST)<world.heightAt(player.x,player.z)+player.y+(player.crouch||player.roll>0?CROUCH_CHEST+.12:PLAYER_HEIGHT+.08)&&invincible<=0){playerHurt(b.damage||12,b.from||'秩序火力',units.find(u=>u.id===b.sourceId));b.life=0;}
  else for(const a of bulletAllies)if(distance(b,a)<.6){damageAlly(a,b.damage,state,player);b.life=0;break;}
 }
}if(b.life<=0){if(b.strafe)impactStrafe(b);if(b.grenade)detonateGrenade(b);if(b.bossOrb)detonateBossOrb(b);if(b.pooled)releaseEnemyBullet(b.m);else{scene.remove(b.m||b.line);if(b.lob||b.strafe){b.m?.geometry?.dispose?.();b.m?.material?.dispose?.();}if(b.line){b.line.geometry.dispose();b.line.material.dispose();}if(b.isPower||b.bossOrb){b.m.geometry?.dispose?.();b.m.material?.dispose?.();}}tracers.splice(i,1);}}}

function updateCamera(dt){if(mode==='menu'||mode==='loading'){
 if(world.menuCamera){const {from,look}=world.menuCamera;camera.position.lerp(new T.Vector3(...from),1-Math.exp(-dt*3));camera.lookAt(...look);if(playerVisual)playerVisual.holder.visible=false;return;}
 // 主菜单直接取游戏实景：主角位于左侧前景，远处同时能看到摩天轮、东京塔和河岸建筑。
 const cityTarget=new T.Vector3(20,8,-17),direction=new T.Vector3(cityTarget.x-menuHero.x,0,cityTarget.z-menuHero.z).normalize(),drift=Math.sin(performance.now()*.00018)*.35,desired=new T.Vector3(-8+drift,6.2,18);
 if(camera.fov!==70){camera.fov=70;camera.updateProjectionMatrix();}camera.position.lerp(desired,1-Math.exp(-dt*2.5));camera.lookAt(cityTarget);if(playerVisual){playerVisual.holder.position.set(menuHero.x,world.heightAt(menuHero.x,menuHero.z),menuHero.z);playerVisual.holder.rotation.y=Math.atan2(direction.x,direction.z);playerVisual.holder.visible=true;}return;
 }const f=forward(),right={x:-Math.cos(yaw),z:Math.sin(yaw)},bodyHeight=player.crouch?CROUCH_CHEST:PLAYER_HEIGHT*.9,anchor=new T.Vector3(player.x,world.heightAt(player.x,player.z)+player.y+bodyHeight,player.z);
if(camera.fov!==64){camera.fov=64;camera.updateProjectionMatrix();}
pitch=T.MathUtils.clamp(pitch,PITCH_UP,maxLookDown());
// 镜头略高于肩膀并向右偏一点，比例对应缩小前的经典越肩视角。
// 镜头停在建筑实体外侧；建筑保持不透明，柱体遮挡单独淡化。
const cameraHeight=player.crouch?PLAYER_HEIGHT*.82:PLAYER_HEIGHT*1.15;const desired=new T.Vector3(player.x-f.x*cameraDistance+right.x*.36,world.heightAt(player.x,player.z)+player.y+cameraHeight,player.z-f.z*cameraDistance+right.z*.36);
camera.position.copy(cameraCutaway.resolve(anchor,desired,camera.position,dt));const elevation=-pitch,gaze=8,flat=gaze*Math.cos(elevation),rise=gaze*Math.sin(elevation);camera.lookAt(camera.position.x+f.x*flat,camera.position.y+rise,camera.position.z+f.z*flat);if(shake>0){camera.position.x+=Math.sin(performance.now()*.13)*shake;shake=Math.max(0,shake-dt);}playerVisual.holder.visible=camera.position.distanceTo(anchor)>.65;if(impactKick>0){camera.position.x+=Math.sin(performance.now()*.17)*impactKick;camera.position.y+=Math.cos(performance.now()*.13)*impactKick*.45;impactKick=Math.max(0,impactKick-dt*.9);}camera.position.copy(cameraCutaway.resolve(anchor,camera.position,camera.position,0));camera.updateMatrixWorld();actorProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);actorFrustum.setFromProjectionMatrix(actorProjection);}
function drawMap(){
 const map=$('map'),ctx=map.getContext('2d');ctx.setTransform(map.width/200,0,0,map.height/160,0,0);const px=x=>(x+66)/132*200,pz=z=>160-(z+66)/132*160;
 ctx.fillStyle='#0b0b0e';ctx.fillRect(0,0,200,160);ctx.fillStyle='#232327';ctx.fillRect(px(-9),0,18/132*200,160);ctx.fillStyle='#fffdf2';for(const z of [26.4,-15.4])ctx.fillRect(px(-14.5),pz(z+2),29/132*200,4/132*160);
 // 海滨底图只将地形转为灰阶，人物和任务标记在恢复上下文后保留阵营色。
 if(world.drawMap){ctx.fillStyle='#232327';ctx.fillRect(0,0,200,160);ctx.save();ctx.filter='grayscale(1)';world.drawMap(ctx,px,pz);ctx.restore();}
 for(const building of world.buildings){ctx.fillStyle=building.dead?'#353538':'#9b9b99';ctx.fillRect(px(building.x-building.w/2),pz(building.z+building.d/2),building.w/132*200,building.d/132*160);}
 for(const unit of units){if(unit.dead||unit.kind==='corpse')continue;ctx.fillStyle=unit.converted?'#bd79ff44':unit.type?'#ed183c':'#fffdf2';if(unit.converted){ctx.fillRect(px(unit.x)-5,pz(unit.z)-5,10,10);ctx.fillStyle='#bd79ff';}ctx.fillRect(px(unit.x)-1,pz(unit.z)-1,2.5,2.5);}
 // 两个中枢始终保留编号；未摧毁时用醒目的黄色脉冲，摧毁后变暗并打叉。
 world.towers.forEach((tower,index)=>{const x=px(tower.x),z=pz(tower.z),radius=tower.dead?5:6+Math.sin(performance.now()*.008)*1.2;ctx.save();ctx.shadowColor=tower.dead?'transparent':'#ffd400';ctx.shadowBlur=tower.dead?0:12;ctx.fillStyle=tower.dead?'#746f56':'#ffe34f';ctx.beginPath();ctx.arc(x,z,radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=tower.dead?'#c5bea0':'#332900';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(tower.dead?'×':String(index+1),x,z+.5);ctx.restore();});
 ctx.fillStyle='#fffdf2';ctx.beginPath();ctx.arc(px(player.x),pz(player.z),3,0,7);ctx.fill();const f=forward();ctx.strokeStyle='#fffdf2';ctx.beginPath();ctx.moveTo(px(player.x),pz(player.z));ctx.lineTo(px(player.x+f.x*7),pz(player.z+f.z*7));ctx.stroke();if(reinforceTimer<7&&state.towers<2){const p=world.entries[reinforceDirection];ctx.fillStyle='#f49c67';ctx.font='bold 15px sans-serif';ctx.fillText('▼',px(p[0])-6,pz(p[1])+4);}
}
function drawLabels(){if(mode==='menu'||mode==='loading'){$('worldLabels').innerHTML='';return;}const candidates=units.filter(u=>!u.dead&&distance(player,u)<24&&(u.converted||u.type>0||u.infection>0||u===target||distance(player,u)<8)).sort((a,b)=>distance(player,a)-distance(player,b));let html='',shown=0,folded=0;const rectangles=[];const pos=new T.Vector3();for(const u of candidates){const ally=u.kind==='ally',corpse=u.kind==='corpse';pos.set(u.x,world.heightAt(u.x,u.z)+(corpse?.45:1.08),u.z).project(camera);if(pos.z>1||pos.z<-1||Math.abs(pos.x)>1.1||Math.abs(pos.y)>1.1)continue;if(!feedbackVisibility.visible(camera.position,new T.Vector3(u.x,world.heightAt(u.x,u.z)+combatBodyHeight(u),u.z),u))continue;const x=(pos.x*.5+.5)*innerWidth;let y=(-pos.y*.5+.5)*innerHeight;if(ally&&u.hurt<=0){html+=`<div class="allyDot" style="left:${x}px;top:${y}px">◆<small>${unitName(u)}</small></div>`;continue;}if(shown++>=12){folded++;continue;}for(let step=0;step<3;step++){if(!rectangles.some(r=>Math.abs(r.x-x)<90&&Math.abs(r.y-y)<28))break;y-=18;}if(y<200){folded++;continue;}rectangles.push({x,y});if(corpse){html+=`<div class="corpseLabel" style="left:${x}px;top:${y}px;border-color:${u.corpseTime<3?'#ed183c':'#bd79ff'};--progress:${u.threshold?u.infection/u.threshold*360:0}deg"><i></i>${u.threshold?Math.floor(u.infection):''}<small>${u.corpseTime.toFixed(1)}s · ${state.abilities.air>=2||state.abilities.dot>=2?'可转化':'需空气 Lv2'}</small></div>`;continue;}html+=`<div class="unitLabel ${ally?'friendly':'hostile'} ${u.infection>0?'polluted':''} ${u.hurt>1.75?'recentHit':''} ${target===u?'locked':''}" style="left:${x}px;top:${y}px"><div class="name">${unitName(u)}${u.aiming||u.aim?(isRangedEnemy(ENEMIES[u.type])?' ⚠ 举枪':u.chargePhase?' ⚠ 盾击':' ⚠ 抬手'):u.purified?` −${Math.round(u.purified)}/s`:''}</div><div class="health"><i style="width:${u.hp/u.maxHp*100}%"></i></div>${ally||!(u.threshold>0)?'':`<div class="infection"><i style="width:${u.infection/u.threshold*100}%"></i></div><div class="number">${Math.floor(u.infection)} / ${u.threshold}</div>`}</div>`;}if(folded)html+=`<div id="foldedLabels">附近单位 +${folded}</div>`;$('worldLabels').innerHTML=html;}
function hud(){if(import.meta.env.DEV)canvas.dataset.scene=JSON.stringify({buildings:world.buildings.length,spawn:world.spawn,bossSpawn:world.bossSpawn,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,position:{...player},towers:world.towers.map(o=>({x:o.x,z:o.z}))});const s=state;const fire=$('kindlingStatus');if(fire){const stacks=kindlingStacks(s),spec=kindlingSpec(s);fire.hidden=!stacks;fire.textContent=`薪火 ${stacks}/${spec.max} · 伤害/感染 +${Math.round(stacks*spec.perStack*100)}% · ${Math.ceil(s.kindlingTime||0)}s`;fire.title=`自身及 ${spec.radius} 米内友方觉醒者获得伤害和感染值增益；范围内战斗阵亡刷新计时`; }const cap=levelCap(s);$('hpText').textContent=`${Math.max(0,Math.ceil(s.hp))} / ${Math.ceil(s.maxHp)}`;$('hpBar').style.width=Math.max(0,s.hp/s.maxHp*100)+'%';$('staminaBar').style.width=Math.max(0,s.stamina/STAMINA_MAX*100)+'%';$('team').textContent=teamCount(units);$('total').textContent=s.infected;$('clock').textContent=formatTime(s.time);$('level').textContent=s.level;$('xpText').textContent=s.level===cap?'MAX':`${Number(s.xp.toFixed(1))} / ${s.need}`;$('xpBar').style.width=(s.level===cap?100:s.xp/s.need*100)+'%';$('percent').textContent=Math.min(100,Math.floor(s.infected/40*100))+'%';const owned=ownedAbilities(s);$('abilitySlots').innerHTML=owned.map(a=>`<div class="slot owned" data-ability="${a.id}" title="${a.name} ${s.abilities[a.id]}/3">${a.icon}<small>${s.abilities[a.id]}</small></div>`).join('')+'<div class="slot" aria-hidden="true">+</div>'.repeat(ABILITIES.length-owned.length);document.querySelectorAll('#alertLevels b').forEach((b,i)=>b.classList.toggle('on',i+2<=s.alert));$('alertValue').textContent=s.aftermath?'0':Math.floor(alertValue(s));$('alertName').textContent=ALERT_NAMES[s.alert]||'尚未警觉';$('reinforcement').textContent=s.aftermath?'警戒解除':s.bossSpawned?'击败巨像，解除封锁':s.bossCountdown!=null?'镇压已启动':`下一级 · ${[10,100,300,500].find(v=>v>alertValue(s))??500}`;$('hud').classList.toggle('countingDown',s.bossCountdown!=null&&!s.bossSpawned&&!s.aftermath);const weaken=s.weakenTasks;
 if(weaken){
  const done=WEAKEN_TASKS.filter(task=>weaken[task.id]).length;
  $('taskNumber').textContent=s.aftermath?'警戒解除':weaken.closed?'巨像战':`削弱 ${done} / 3`;
  $('objective').textContent=s.aftermath?'城市已觉醒':weaken.closed?'击败秩序巨像':'先削弱，再迎战';
  $('objectiveSub').textContent=s.aftermath?'继续探索，或结束本局。':weaken.closed?'利用炮击间隙集中攻击。':'摧毁地图上的黄色设施，削弱巨像。';
  $('objectiveSteps').innerHTML=s.aftermath?'':WEAKEN_TASKS.map(task=>`<span class="${weaken[task.id]?'done':''}"><i></i><div><strong>${task.name}</strong><small>${weaken[task.id]?task.doneText:weaken.closed?task.missText:task.detail}</small></div></span>`).join('');
 }else{
  $('taskNumber').textContent='街区行动';$('objective').textContent='唤醒这座城市';
  $('objectiveSub').textContent='警戒达到 500 后，进入两分钟镇压倒计时。';$('objectiveSteps').innerHTML='';
 }
 const countdownEl=$('runCountdown');if(countdownEl){const show=s.bossCountdown!=null&&!s.bossSpawned&&!s.aftermath;countdownEl.hidden=!show;const face=countdownEl.querySelector('b');if(show&&face)face.textContent=formatTime(Math.max(0,Math.ceil(s.bossCountdown)));}const gun=activeGun();$('primaryLabel').textContent=switchTime>0?'切换中…':holdingLauncher()?'可感染注射器':gun?gun.name:'徒手';$('potionStatus').hidden=!(s.potionTime>0);$('potionStatus').textContent=`狂暴强化 ${Math.ceil(s.potionTime||0)}s`;$('upgradeHint').textContent=s.pending?`可选变异 ${s.pending} · 升级后自动选择`:'升级后可选变异';const ammoBits=[`<span class="${s.weapon===-1?'selected':''}">1 徒手</span>`];for(const slot of weaponSlots(s)){if(slot.id==='launcher')ammoBits.push(`<span class="${s.weapon===LAUNCHER_SLOT?'selected':''}">${slot.key} 注射器</span>`);else{const g=slot.gun,mag=(s.weapon===slot.weapon?s.clip:s.mags[g.id])||0;ammoBits.push(`<span class="${s.weapon===slot.weapon?'selected':''}">${slot.key} ${g.name} ${mag}/${s.ammo[g.id]||0}</span>`);}}if(reloadTime>0)ammoBits.push(`<span class="reloading">装填 ${reloadTime.toFixed(1)}s</span>`);$('ammo').innerHTML=ammoBits.join('');updateChargeRing();const reloading=$('reloadIndicator');reloading.classList.toggle('active',reloadTime>0);if(reloadTime>0){reloading.querySelector('b').textContent=reloadTime.toFixed(1)+'s';reloading.style.setProperty('--reload',(1-reloadTime/1.15)*100+'%');}$('crosshair').classList.toggle('locked',!!target);$('targetHint').textContent=target?`${unitName(target)} · ${Math.ceil(distance(player,target))}m`:'';drawMap();drawLabels();updateTuneLive();}

function syncWeakenTasks(){if(!state.weakenTasks||state.weakenTasks.closed||!world)return;for(const tower of world.towers){if(!tower.dead||!tower.weaken)continue;if(completeWeaken(state,tower.weaken)){const task=WEAKEN_TASKS.find(item=>item.id===tower.weaken);toast('削弱完成 · '+(task?.name||''),3);}}}
function updateMissions(){if(state.bossCountdown!=null||state.weakenTasks)world.spawnWeakenSites();syncWeakenTasks();
 // 先保存可重新召唤 Boss 的入场存档，再标记运行中的 Boss 已出现。
 if(bossReady(state)&&!boss.active){closeWeakenTasks(state);const mods=bossWeakenMods(state);state.rushReinforce=mods.rushReinforce;state.pending=0;saveRun();state.bossSpawned=true;spawnQueue.jobs.length=0;spawnQueue.wait=0;alerted=true;boss.active=true;boss.shieldHp=mods.shield?800:0;boss.empowered=mods.empowered;boss.root.visible=true;boss.x=world.bossSpawn.x;boss.z=world.bossSpawn.z;boss.attack=boss.empowered?2.8:4.6;music.setBed('boss');toast('镇压倒计时结束 · 巨像降临'+(mods.shield||mods.empowered||mods.rushReinforce?' · 未完成的削弱仍然生效':''),4);}
}
function updateBoss(dt){
 missionTimer=Math.max(0,missionTimer-dt);$('missionComplete').style.opacity=missionTimer>0?1:0;$('bossHud').hidden=!boss.active;document.querySelector('.alertPanel').style.display=boss.active?'none':'';if(!boss.active)return;
 animateBoss(boss,dt);$('bossHp').style.width=boss.hp/boss.maxHp*100+'%';$('bossValue').textContent=Math.ceil(boss.hp)+' / 6000';$('bossPhase').textContent=['','Ⅰ 炮火苏醒','Ⅱ 连续轰击','Ⅲ 狂热炮击'][boss.phase]+(boss.weak>0?' · 核心过热':'');
 if(boss.dead){bossMissionTimer=0;clearPendingOrb();if(!state.bossDefeated){state.bossDefeated=true;state.aftermath=true;state.bossSpawned=true;music.setBed('play');showBossVictory();for(let i=0;i<8;i++)burst(boss.x,Math.random()*9,boss.z,0xd59cff,15);}return;}
 boss.weak=Math.max(0,boss.weak-dt);boss.attack-=dt;const gap=distance(player,boss),canBomb=bossCanTarget(boss,player);boss.root.rotation.y=Math.atan2(player.x-boss.x,player.z-boss.z);
 if(canBomb)showBossArrival();
 if(bossMissionTimer>0){bossMissionTimer=Math.max(0,bossMissionTimer-dt);if(!bossMissionTimer)showBossMission();}
 if(gap>9){const pace=boss.phase===3?2:1.2,nx=boss.x+(player.x-boss.x)/gap*dt*pace,nz=boss.z+(player.z-boss.z)/gap*dt*pace;if(world.free(nx,nz,3)){boss.x=nx;boss.z=nz;}else world.breakAt(nx,nz,3,dt*90,burst);}
 // 预警环在炮弹出手时出现，飞行约 0.9 秒后落地并炸开。
 if(boss.orbWindup>0){if(!canBomb){boss.orbWindup=0;boss.attack=.4;clearPendingOrb();$('bossWarning').textContent=world.bossCanTarget?'离开巨像的炮击范围':'炮击范围仅限巨像所在河岸';}else{pulseBossMarker(boss.pendingOrb?.marker,BOSS_ORB_WINDUP?1-boss.orbWindup/BOSS_ORB_WINDUP:1);boss.orbWindup=Math.max(0,boss.orbWindup-dt);$('bossWarning').textContent='⚠ 落点预警 · 离开黄色圆环';if(!boss.orbWindup&&throwBossOrb()){boss.weak=2.2;boss.attack=(boss.empowered?[0,2.8,2.2,1.6]:[0,4.6,3.7,2.8])[boss.phase];}}}
 else{$('bossWarning').textContent=boss.weak>0?'核心过热 · 集中攻击！':canBomb?'':world.bossCanTarget?'接近巨像后，炮击才会开始':'进入巨像所在河岸后，炮击才会开始';if(boss.attack<=0&&canBomb&&beginBossOrbCharge()&&boss.orbWindup<=0){boss.weak=2.2;boss.attack=(boss.empowered?[0,2.8,2.2,1.6]:[0,4.6,3.7,2.8])[boss.phase];}}
}

function updateAlertEffect(dt){
 const el=$('alertVignette'),playing=mode==='playing'&&!state.aftermath&&!state.bossDefeated;
 if(playing)alarmSurge=Math.max(0,alarmSurge-dt);
 const stage=state.alert,urgent=state.bossCountdown!=null&&state.bossCountdown<=30&&!state.bossSpawned;
 const base=stage>=6?.48:urgent?.44:stage>=5?.34:stage>=4?.26:stage>=3?.16:0;
 el.hidden=!playing||(!base&&!alarmSurge);
 if(el.hidden)return;
 const motion=reducedMotion.matches;
 const breath=motion?0:(1+Math.sin(state.time*(urgent?3:1.7)))*.055;
 el.style.opacity=String(Math.min(.82,base+breath+alarmSurge/3.2*.48));
}

const hitReactions=new Map(),hitStyles=new Map();let hitSoundAt=0,impactKick=0,hitStop=0;
const feedbackVisibility=createFeedbackVisibility(world);
const cameraCutaway=createCameraCutaway(world),cameraBufferSize=new T.Vector2();
// 仅开发复现场景记录摄像机检测开销，正式游戏不显示调试文字。
let cameraFrameCost=0,cameraSamples=[],cameraReadout=null;
if(import.meta.env.DEV&&debugQuery.get('test')==='pillar-real'){
 cameraReadout=document.createElement('output');cameraReadout.id='cameraDiagnostics';cameraReadout.hidden=true;document.body.append(cameraReadout);
 for(const name of ['resolve','update']){const run=cameraCutaway[name];cameraCutaway[name]=(...args)=>{const begin=performance.now();const result=run(...args);cameraFrameCost+=performance.now()-begin;return result;};}
}

const hitWhite=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
function combatBodyHeight(anchor){return anchor===player?(player.crouch?CROUCH_CHEST:STANDING_CHEST):characterHeight(anchor.type>0?'guard':'human',anchor.profession||0)*.62;}
const combatUI=createCombatUI(document,(anchor,height)=>{
 // 人物随城市缩小过；用模型胸口高度，不能用未缩放的固定 1.7 米。
 const bodyPoint=new T.Vector3(anchor.x,world.heightAt(anchor.x,anchor.z)+(anchor.y||0)+(height??combatBodyHeight(anchor)),anchor.z);
 const pos=bodyPoint.clone().project(camera);
 if(pos.z<-1||pos.z>1||Math.abs(pos.x)>1||Math.abs(pos.y)>1)return null;
 if(!feedbackVisibility.visible(camera.position,bodyPoint,anchor))return null;
 const side=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(.32);
 const edge=new T.Vector3(anchor.x,world.heightAt(anchor.x,anchor.z)+(anchor.y||0)+(height??combatBodyHeight(anchor)),anchor.z).add(side).project(camera);
 return {x:(pos.x*.5+.5)*innerWidth,y:(-pos.y*.5+.5)*innerHeight,sideOffset:Math.max(64,Math.abs(edge.x-pos.x)*innerWidth*.5+42)};
},(anchor,side,events,key,subdued)=>{
 if(distance(player,anchor)>26)return;
 const damage=events.some(e=>e.kind==='damage'||e.kind==='shield'),stamp=performance.now(),mark=hitStyles.get(key);
 const fresh=!!mark&&stamp-mark.at<250;
 // 持续感染只更新污染数字和状态光环，不反复触发冲击、后仰、火花与命中音。
 if(!fresh&&events.every(e=>e.kind==='infection'))return false;
 const direct=fresh&&mark.kind!=='ally',kind=direct&&mark.kind==='heavy'?'heavy':'light',response=HIT_RESPONSE[kind];hitStyles.delete(key);
 if(direct&&!subdued&&distance(player,anchor)<12){hitStop=Math.max(hitStop,response.stop);const v=visuals.get(key)?.v;if(v)flashCharacter(v,hitWhite,reducedMotion.matches?.035:response.flash);}

 // 视觉后仰不改碰撞位置、AI 行为或攻击节奏，也不修改士兵共享材质。
 if(key!=='player'&&key!=='boss'&&anchor.kind!=='corpse'&&!anchor.dead){
  const f=forward(),len=Math.hypot(anchor.x-player.x,anchor.z-player.z)||1;
  hitReactions.set(key,{time:response.duration,response,subdued,x:(anchor.x-player.x)/len||f.x,z:(anchor.z-player.z)/len||f.z,damage});
 }
 if(!subdued&&side==='enemy'&&stamp-hitSoundAt>90){music.effect(kind==='heavy'?'heavyHit':damage?'hit':'infect');hitSoundAt=stamp;}
 if(!subdued&&side==='enemy'&&damage&&distance(player,anchor)<8&&!reducedMotion.matches)impactKick=Math.max(impactKick,response.kick);
 // 绕过旧版 burst 的半数粒子和 0.65 倍缩放，且补上当前地形高度。
 if(typeof __comicFX!=='undefined'){
  const e=__comicFX.burst(anchor.x,world.heightAt(anchor.x,anchor.z)+(anchor.y||0)+(key==='boss'?2.2:combatBodyHeight(anchor)),anchor.z,damage?0xfff4db:0xc781ff,subdued?2:8,subdued?1.2:2.4);
  if(e)e.g.scale.setScalar((damage?response.burst:1.05)*(subdued?.4:1));
 }
 return kind;
},(anchor,side,key)=>{
 const mark=hitStyles.get(key);
 if(mark&&performance.now()-mark.at<250)return mark.kind==='ally';
 return side==='ally'||anchor.tagged==='army';
});
function updateHitReactions(dt){
 for(const [id,mark] of hitStyles)if(performance.now()-mark.at>250)hitStyles.delete(id);
 for(const [id,reaction] of hitReactions){
  reaction.time=Math.max(0,reaction.time-dt);const v=visuals.get(id)?.v,u=units.find(u=>u.id===id);
  if(!v||!u||u.dead||u.kind==='corpse'||reaction.time===0){if(v?.model)v.model.rotation.x=0;hitReactions.delete(id);continue;}
  const pulse=Math.sin((1-reaction.time/reaction.response.duration)*Math.PI),strength=reducedMotion.matches?0:(reaction.damage?1:.65)*(reaction.subdued?.4:1);
  v.holder.position.x+=reaction.x*pulse*reaction.response.recoil*strength;v.holder.position.z+=reaction.z*pulse*reaction.response.recoil*strength;
  v.model.rotation.x=-pulse*reaction.response.tilt*strength;
 }
}

let last=performance.now(),hudTimer=0;
function frame(now){requestAnimationFrame(frame);let cameraUpdated=false;const realDt=Math.min(.04,(now-last)/1000);last=now;feedbackVisibility.beginFrame();
 // 顿帧暂停模拟和动作，仍继续绘制和更新 UI；按真实时间结束，不补算暂停期间的战斗。
 const stopped=stepHitStop(mode==='playing'?hitStop:0,realDt);hitStop=mode==='playing'?stopped.remaining:0;const dt=stopped.dt;
 world.update?.(dt,camera);frameDelta=dt;if(mode==='playing'&&dt>0){
 combatUI.baseline(units,state,player,boss);
 attackCd=Math.max(0,attackCd-dt);breakCd=Math.max(0,breakCd-dt);rushCd=Math.max(0,rushCd-dt);invincible=Math.max(0,invincible-dt);if(keys.ArrowLeft)yaw+=dt*1.6;if(keys.ArrowRight)yaw-=dt*1.6;if(keys.ArrowUp)pitch=Math.max(PITCH_UP,pitch-dt);if(keys.ArrowDown)pitch=Math.min(maxLookDown(),pitch+dt);
 if(switchTime>0){switchTime=Math.max(0,switchTime-dt);if(!switchTime){stashMag();state.weapon=nextWeapon;const gun=activeGun();state.gunId=gun?gun.id:null;state.clipMax=gun?gun.clip:0;state.clip=gun?(state.mags[gun.id]||0):0;}}if(reloadTime>0){reloadTime=Math.max(0,reloadTime-dt);if(!reloadTime){const gun=activeGun();if(gun){const n=Math.min(gun.clip-state.clip,state.ammo[gun.id]||0);state.clip+=n;state.ammo[gun.id]-=n;state.mags[gun.id]=state.clip;}}}
 stepPlayerMotion(dt);
 const dx=(keys.KeyD?1:0)-(keys.KeyA?1:0),fw=(keys.KeyW?1:0)-(keys.KeyS?1:0),len=Math.hypot(dx,fw);const sprinting=stepSprint(state,len>0&&!player.crouch&&player.y===0&&player.roll<=0&&!(player.knock>0),shiftHeld(),dt);let moving=false,rollProgress=0;if(player.knock>0){player.knock=Math.max(0,player.knock-dt);moving=move(player,(player.knockX||0)*6.5*dt,(player.knockZ||0)*6.5*dt);playerVisual.holder.rotation.y=Math.atan2(player.knockX||0,player.knockZ||0);}else if(player.roll>0){player.roll=Math.max(0,player.roll-dt);rollProgress=1-player.roll/ROLL_DURATION;const rollSpeed=1.5+Math.sin(rollProgress*Math.PI)*4.7;move(player,player.rollX*rollSpeed*dt,player.rollZ*rollSpeed*dt);if(rollProgress>.28&&rollProgress<.72)invincible=Math.max(invincible,.05);moving=true;playerVisual.holder.rotation.y=Math.atan2(player.rollX,player.rollZ);
  if(player.roll===0){finishRoll();if(player.roll>0)rollProgress=0;}
 }else if(len){const f=forward(),pace=speed(state,sprinting)*(player.crouch?.45:1),vx=(-Math.cos(yaw)*dx+f.x*fw)/len*pace*dt,vz=(Math.sin(yaw)*dx+f.z*fw)/len*pace*dt;moving=move(player,vx,vz);if(attackCd<.2)playerVisual.holder.rotation.y=Math.atan2(vx,vz);}if(sprinting&&state.abilities.haste>=3){ramTimer-=dt;for(const u of units){if(u.dead||u.converted||u.kind==='corpse')continue;if(distance(player,u)<1.05&&ramTimer<=0){const spec=meleeSpec(state,'heavy');applyHit(u,spec.infection,spec.damage);ramTimer=.85;burst(u.x,STANDING_CHEST,u.z,0xe8c07a,10);}}}playerVisual.holder.position.set(player.x,world.heightAt(player.x,player.z)+player.y,player.z);
 playerVisual.model.position.y=player.roll>0?Math.sin(rollProgress*Math.PI)*.28:player.crouch?-.33:0;
 const body=characterHeight('player')/(assets.player?.height||PLAYER_HEIGHT)*(state.abilities.frenzy>=3?1.35:state.abilities.frenzy>=2?1.15:1);playerVisual.model.scale.set(body,body*(player.crouch?.7:1),body);playerVisual.holdingGun=state.weapon>=0||holdingLauncher();playerVisual.airborne=player.y>0||player.vy>0;playerVisual.jumpPhase=playerVisual.airborne?T.MathUtils.clamp((JUMP_SPEED-player.vy)/(2*JUMP_SPEED),0,1):null;updateCharacterVisual(playerVisual,moving,dt,0,false);
 const gun=activeGun();for(const [id,mesh] of Object.entries(firearms.map))mesh.visible=!!(gun&&gun.id===id&&player.roll<=0);syringe.g.visible=holdingLauncher()&&player.roll<=0&&mode==='playing';if(holdingLauncher())syringe.liquid.scale.y=.3*(.55+.45*Math.max(.2,1-(state.abilities.launcher>=3?(state.powerCharge||0)/POWER_HITS:0)));weaponPivot.position.set(player.x-Math.cos(yaw)*.5,world.heightAt(player.x,player.z)+player.y+(player.crouch?CROUCH_CHEST:STANDING_CHEST),player.z+Math.sin(yaw)*.5);weaponPivot.rotation.set(switchTime>0?Math.sin(switchTime/.4*Math.PI)*1.1:reloadTime>0?.5:0,yaw+.38,0);
// 配件调参面板的「静止」开关：整个跳过 AI（不是传 dt=0，那样会让 AI 内部计时停在半路、
// 恢复后接不回去）；动画推进量在后面的 updateVisuals 处给 0。
const frozen=typeof window!=='undefined'&&!!window.__propFreeze;
 const aim=holdingLauncher()?launcherSpec(state):gun;target=acquire(aim?aim.range:3.2);if(mouseHeld||keys.KeyJ)primary();ensureGuards();const before=state.infected;stepSimulation(state,units,player,dt,mode);if(!state.aftermath){const clock=tickRunClock(state,dt);if(clock.started){publishWeakenTasks(state);world.spawnWeakenSites();syncWeakenTasks();flashPoliceAlert('<strong>镇</strong><small>警戒 500</small><b>秩序方开始倒计时</b><em>从 2:00 开始。三座削弱设施现在出现，可做可不做。</em>','upgrade',3.6);}for(const mark of clock.warnings)toast(`镇压倒计时剩余 ${mark} 秒`,2.4);}if(state.infected>before){toast(`感染扩散 · ${state.infected-before} 人觉醒`,1.5);state.maxChain=Math.max(state.maxChain,state.infected-before);}if(!frozen)runAI(dt);updateEffects(dt);flushKindlingPulses();updatePickups(dt);
 state.towers=world.towers.filter(o=>o.dead).length;state.destroyed=world.destructibles.filter(o=>o.dead&&o.type!=='tower').length;updateMissions();updateBoss(dt);const next=threat(state);if(next>state.alert){state.alert=next;state.peakAlert=Math.max(state.peakAlert,next);alarmSurge=3.2;if(!boss.active){toast(`警戒升级 · ${ALERT_NAMES[next]}`,2.4);music.effect('alertUp');callBackup(next);}}
 combatUI.observe(units,state,player,boss);
 recycleSpentActors();cullFarTroops();
 updateCamera(dt);cameraUpdated=true;updateVisuals(frozen?0:dt);updateHitReactions(frozen?0:dt);
 updateReinforcements(dt);updateAirstrike(dt);combatUI.observe(units,state,player,boss);
 if(state.infected>conversionCount){conversionTimer=1.1;$('infectionFeedback').innerHTML=`<span>☣</span><b>觉醒成功 ×${state.infected-conversionCount}</b><small>加入反抗群落</small>`;conversionCount=state.infected;music.effect('convert');}bossVictoryHold=Math.max(0,bossVictoryHold-dt);const result=outcome(state);if(result==='won'&&bossVictoryHold>0){}else if(result)finish(result);else if(!boss.active&&state.pending&&state.time-state.lastPick>=upgradeAutoGap(state))chooseUpgrade();saveTimer+=dt;if(saveTimer>5){saveRun();saveTimer=0;}if(lastHp!==null&&state.hp<lastHp)hurtTimer=.6;lastHp=state.hp;
 }else if(mode==='levelup'||mode==='upgrade'){
  if(mode==='upgrade'&&upgradeLock>0){upgradeLock=Math.max(0,upgradeLock-dt);if(upgradeLock<=0)$('dialog')?.classList.remove('choiceLock');}
  try{updateEffects(dt);if(playerVisual)updateCharacterVisual(playerVisual,false,dt,0);}catch{}
 }else if(mode==='menu'){for(const {v}of visuals.values())updateCharacterVisual(v,false,dt,0);if(playerVisual)updateCharacterVisual(playerVisual,false,dt,0);}
 updateAlertEffect(dt);updateAuras(dt);conversionTimer=Math.max(0,conversionTimer-dt);$('infectionFeedback').style.opacity=conversionTimer>0?1:0;hurtTimer=Math.max(0,hurtTimer-dt);$('hurtVignette').style.opacity=hurtTimer>0?Math.min(.9,hurtTimer/.55):0;$('damageVignette').style.opacity=shake>0?.7:0;policeAlertTimer=Math.max(0,policeAlertTimer-dt);if(!policeAlertTimer)$('policeAlert').classList.remove('active','upgrade','boss','win','quest','radio');if(!cameraUpdated&&dt>0)updateCamera(dt);if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').style.opacity=0;}hudTimer-=dt;if(hudTimer<=0&&assets){hudTimer=.1;hud();}combatUI.tick(realDt,mode==='playing',state);cameraCutaway.update(camera,player,world.heightAt(player.x,player.z),PLAYER_HEIGHT*(player.crouch?.7:1),renderer.getDrawingBufferSize(cameraBufferSize),realDt,!['menu','loading'].includes(mode)&&!(import.meta.env.DEV&&debugQuery.has('cutawayOff')));
 // 镜头和战斗界面沿用本地逻辑。画面最后才走描边和厚涂，关掉时仍直接画场景。
 syncFogMode();
 if(toonFilter?.ready&&toonFilter.enabled){const outlined=(outlineFilter?.ready&&outlineFilter.enabled)?outlineFilter.render(scene,camera):null;blitFilter(renderer,toonFilter.render(scene,camera,outlined,outlined&&scene.fog?{depthTexture:outlineFilter.color.depthTexture,normalTexture:outlineFilter.normal?outlineFilter.normal.texture:null,color:scene.fog.color,near:scene.fog.near,far:scene.fog.far,cameraNear:camera.near,cameraFar:camera.far,amount:fogVisible()?fogPassAmount:0,edge:edgePassAmount,edgeThreshold,edgeStep,edgeFarScale,edgeFarThreshold,edgeFarLighten,edgeColor,lineFade,lineFadeRange}:null));}
 else if(outlineFilter?.ready&&outlineFilter.enabled)blitFilter(renderer,outlineFilter.render(scene,camera));else renderer.render(scene,camera);
 if(cameraReadout&&mode==='playing'){cameraSamples.push(cameraFrameCost);if(cameraSamples.length>180)cameraSamples.shift();const sorted=[...cameraSamples].sort((a,b)=>a-b);cameraReadout.textContent=JSON.stringify({...cameraCutaway.diagnostics(),cameraMedianMs:sorted[Math.floor(sorted.length*.5)],activeFades:cameraCutaway.uniforms.uBuildingFade.value.filter(x=>x>.1).length,renderCalls:renderer.info.render.calls});}cameraFrameCost=0;
}
/* Wake Up Tokyo — revised range mesh, restrained personal effects and half-second airborne infection. */
const __comicFX=createComicAbilityFX(T,scene,{height:PLAYER_HEIGHT,reducedMotion:reducedMotion.matches,quality:settings.quality});
const __comicFleshHUD=createFleshProgressHUD(document,()=>state);
const __comicOriginal={burst,wave,makeAura,updateAura,removeAura,updateAuras,aura,updateEffects,meleeStrike,emitLauncherShot,fireGun,rush,jump,stepPlayerMotion,playerHurt,playLevelUpFx,finishUpgrade,spawnGuard,updatePickups,updatePowerShot,createPowerOrb,releasePowerWave};
const __comicInk=0x24172f,__comicCream=0xfff0cb,__comicPurple=0xb85cff,__comicLime=0xd4ff38,__comicCyan=0x64e4d6;
const __comicUnitFX=new Map(),__comicCloudFX=new Map(),__comicProjectileFX=new WeakMap();
let __comicSuppressLegacyBlast=0;
let __comicSeenDrops=new WeakSet(),__comicSeenTide=null;
let __comicClock=0,__comicScan=0,__comicLastBurst=state.burstTime||0,__comicState=state,__comicChargeAura=null,__comicChargeHolder=null;
const __comicGround=(x,z)=>{const h=world.heightAt(x,z);return Number.isFinite(h)&&h>-2?h:0;};
const __comicNear=(x,z,r=32)=>Math.hypot(x-player.x,z-player.z)<r;
function __comicPulse(x,z,kind,level=1,radius=1){if(!__comicNear(x,z,50))return;const e=__comicFX.pulse(x,__comicGround(x,z)+.06,z,kind,level,radius);if(e&&(kind==='haste'||kind==='tough'))e.g.rotation.y=kind==='haste'&&player.roll>0?Math.atan2(player.rollX,player.rollZ):yaw;return e;}
function __comicDropUnitFX(record){if(record?.aura)__comicFX.removeAura(record.aura);record?.anchor?.removeFromParent();}
function __comicResetObservers(){
 for(const r of __comicUnitFX.values())__comicDropUnitFX(r);__comicUnitFX.clear();__comicCloudFX.clear();
 if(__comicChargeAura)__comicFX.removeAura(__comicChargeAura);__comicChargeAura=null;__comicChargeHolder=null;
 __comicLastBurst=state.burstTime||0;__comicSeenDrops=new WeakSet();__comicSeenTide=null;__comicFX.clear();
}
// Replace the smoke stacks with low density, opaque geometric identity marks.
for(const a of [...activeAuras])__comicOriginal.removeAura(a);
for(const e of visuals.values())e.v.aura=null;
makeAura=function(holder,palette,options={}){
 const kind=palette===AURA_COLORS.guard?'guard':palette===AURA_COLORS.level?'level':palette===AURA_COLORS.pickup?'pickup':'worker';
 const a=__comicFX.aura(holder,kind,{life:options.life||0,size:options.coreSize?Math.min(1.25,Math.max(.65,options.coreSize/1.8)):1});
 activeAuras.push(a);return a;
};
updateAura=function(a,dt){__comicFX.updateAura(a,dt);};
removeAura=function(a){if(!a)return;const i=activeAuras.indexOf(a);if(i>=0)activeAuras.splice(i,1);__comicFX.removeAura(a);};
for(const p of pickups)p.aura=makeAura(p.m,AURA_COLORS.pickup,{coreSize:1.45});
burst=function(x,y,z,color,count=10,force=5){if(__comicSuppressLegacyBlast)return;if(__comicNear(x,z,55)){const e=__comicFX.burst(x,y,z,color,Math.max(1,Math.min(8,Math.ceil(count*.5))),Math.min(force,3));if(e)e.g.scale.setScalar(.65);}};
wave=function(x,z,radius,color=0xb477ec){if(__comicSuppressLegacyBlast)return;if(__comicNear(x,z,65))__comicFX.wave(x,__comicGround(x,z)+.055,z,radius,color);};
// One merged mesh per segmented outline, following each map's ground height.
function __comicRangeGeometry(inner,outer){
 const p=[],segs=48;
 for(let i=0;i<segs;i++){
  const a=i/segs*Math.PI*2,b=(i+.63)/segs*Math.PI*2;
  const ax=Math.sin(a),az=Math.cos(a),bx=Math.sin(b),bz=Math.cos(b);
  p.push(ax*inner,0,az*inner,ax*outer,0,az*outer,bx*outer,0,bz*outer,ax*inner,0,az*inner,bx*outer,0,bz*outer,bx*inner,0,bz*inner);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}
const __comicRangeGeo=__comicRangeGeometry(.994,1),__comicRangeInkGeo=__comicRangeGeometry(.99,1.004);
aura=function(key,x,z,radius,color){
 let g=auraVisuals.get(key);
 if(g&&!g.userData.comicRange){scene.remove(g);g.geometry?.dispose();g.material?.dispose();auraVisuals.delete(key);g=null;}
 if(!g){
  g=new T.Group();g.userData.comicRange=true;
  const ink=new T.Mesh(__comicRangeInkGeo,new T.MeshBasicMaterial({color:__comicInk,side:T.DoubleSide,transparent:true,opacity:.32,depthWrite:false,toneMapped:false}));
  const edge=new T.Mesh(__comicRangeGeo,new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.55,depthWrite:false,toneMapped:false}));
  edge.position.y=.006;g.add(ink,edge);g.userData.edge=edge;g.userData.ink=ink;scene.add(g);auraVisuals.set(key,g);
 }
 g.position.set(x,__comicGround(x,z)+.045,z);g.scale.set(radius,1,radius);g.userData.edge.material.color.setHex(color);
 const mother=key==='mother',mist=String(key).startsWith('mist');
 g.userData.edge.material.opacity=(mother?.3:mist?.48:.63)*(reducedMotion.matches?1:.88+.12*Math.sin(__comicClock*2));
 g.userData.ink.material.opacity=mother?.18:.32;g.visible=true;return g;
};
meleeStrike=function(kind){
 const ready=mode==='playing'&&attackCd<=0&&switchTime<=0&&reloadTime<=0&&player.roll<=0&&!holdingLauncher()&&!activeGun();
 const result=__comicOriginal.meleeStrike(kind);
 if(ready&&attackCd>0&&!holdingLauncher()&&!activeGun())__comicFX.melee(player.x,__comicGround(player.x,player.z)+player.y,player.z,yaw,kind==='heavy');
 return result;
};
function __comicMuzzle(prior){
 if(tracers.length<=prior)return;const b=tracers[tracers.length-1];if(!b.friendly)return;
 const f=forward(),y=b.y??(__comicGround(player.x,player.z)+player.y+(player.crouch?CROUCH_CHEST:STANDING_CHEST));
 const vx=Number.isFinite(b.vx)?b.vx:f.x,vz=Number.isFinite(b.vz)?b.vz:f.z,length=Math.hypot(vx,vz)||1;
 __comicFX.shot(b.x+vx/length*.35,y,b.z+vz/length*.35,vx,vz,b.isPower?__comicLime:b.m?.material?.color?.getHex?.()||__comicPurple,!!b.isPower);
}
emitLauncherShot=function(spec,empowered,chargeShot){
 const n=tracers.length;let result;
 __comicSuppressLegacyBlast++;try{result=__comicOriginal.emitLauncherShot(spec,empowered,chargeShot);}finally{__comicSuppressLegacyBlast--;}
 if(tracers.length>n){
  const b=tracers[tracers.length-1],origin=new T.Vector3(player.x,__comicGround(player.x,player.z)+player.y+(player.crouch?CROUCH_CHEST:STANDING_CHEST),player.z);
  const aim=resolveComicAim(T,camera,origin,{world:world,units:units,boss:boss,range:spec.range,bodyHeight:PLAYER_HEIGHT,flyers:typeof planeAimPoint==='function'&&planeAimPoint()?[planeAimPoint()]:[]});
  if(empowered)Object.assign(b,launchComicBallistic(T,origin,aim.target,spec.speed));
  else{const velocity=aim.target.clone().sub(origin).normalize().multiplyScalar(spec.speed);b.vx=velocity.x;b.vy=velocity.y;b.vz=velocity.z;b.manualAim=true;}
  b.aimTarget=aim.target.clone();b.aimKind=aim.kind;
  b.x=origin.x;b.y=origin.y;b.z=origin.z;b.m.position.copy(origin);
  if(empowered)__comicFX.updateProjectile(b.m,0,b.vx,b.vz,b.vy);else b.m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(b.vx,b.vy,b.vz).normalize());
 }
 __comicMuzzle(n);return result;
};
fireGun=function(...args){const n=tracers.length;let r;__comicSuppressLegacyBlast++;try{r=__comicOriginal.fireGun(...args);}finally{__comicSuppressLegacyBlast--;}if(!tracers[tracers.length-1]?.isPower)__comicMuzzle(n);return r;};
rush=function(...args){const was=player.roll,r=__comicOriginal.rush(...args);if(was<=0&&player.roll>0&&state.abilities.haste){const e=__comicPulse(player.x,player.z,'haste',state.abilities.haste,.4);if(e)e.g.scale.setScalar(.45);}return r;};
jump=function(...args){return __comicOriginal.jump(...args);};
stepPlayerMotion=function(dt){const was=player.y,r=__comicOriginal.stepPlayerMotion(dt);if(was>.045&&player.y===0){const e=__comicFX.burst(player.x,__comicGround(player.x,player.z)+.05,player.z,__comicCream,2,.7);if(e)e.g.scale.setScalar(.35);}return r;};
playerHurt=function(...args){const r=__comicOriginal.playerHurt(...args);if(state.abilities.tough)__comicPulse(player.x,player.z,'tough',state.abilities.tough,state.lastReflect?.radius?2:1);return r;};
playLevelUpFx=function(){music.effect('upgrade');__comicPulse(player.x,player.z,'upgrade',state.level,1.7);if(playerVisual)makeAura(playerVisual.holder,AURA_COLORS.level,{life:1.2,coreSize:1.8});if(state.abilities.evolve)__comicPulse(player.x,player.z,'heal',state.abilities.evolve,.9);};
finishUpgrade=function(ability){const r=__comicOriginal.finishUpgrade(ability);__comicPulse(player.x,player.z,ability.id==='launcher'?'charge':ability.id,state.abilities[ability.id]||1,1.15);return r;};
spawnGuard=function(...args){const u=__comicOriginal.spawnGuard(...args);if(u)__comicPulse(u.x,u.z,'command',state.abilities.command||1,.8);return u;};
updatePickups=function(dt){const n=pickups.length,r=__comicOriginal.updatePickups(dt);if(pickups.length<n)__comicPulse(player.x,player.z,'heal',1,.9);return r;};
createPowerOrb=function(x,y,z){const m=__comicFX.projectile(x,y,z,__comicLime);scene.add(m);return m;};
releasePowerWave=function(...args){
 const first=waves.length;let result;__comicSuppressLegacyBlast++;
 try{result=__comicOriginal.releasePowerWave(...args);}finally{__comicSuppressLegacyBlast--;}
 for(let i=waves.length-1;i>=first;i--){const w=waves[i];if(w.m?.material?.wireframe){scene.remove(w.m);w.m.geometry?.dispose();w.m.material?.dispose();waves.splice(i,1);}}
 __comicFX.powerImpact(args[0],__comicGround(args[0],args[1])+.05,args[1],6);return result;
};
updatePowerShot=function(b,dt){
 stepComicBallistic(T,b,dt,world,p=>detonatePowerShot(p));
 if(b.life<=0&&!b.comicImpacted){b.comicImpacted=true;detonatePowerShot(b);}
 b.trail=(b.trail||0)-dt;
 if(b.life>0&&b.trail<=0){__comicFX.burst(b.x,b.y,b.z,__comicPurple,1,.5);b.trail=.12;}
 __comicFX.updateProjectile(b.m,dt,b.vx,b.vz,b.vy);
};
function __comicStepNeedle(b,dt){
 stepComicNeedle(T,b,dt,world,{units:units,boss:boss,bodyHeight:PLAYER_HEIGHT,
  onUnit:u=>{onPlayerProjectileHit(b);applyHit(u,b.infection||0,b.damage||0,false,{x:b.x-b.vx,z:b.z-b.vz});burst(b.x,b.y,b.z,b.m.material?.color?.getHex?.()||__comicPurple,3,1);},
  onBoss:()=>{onPlayerProjectileHit(b);if(b.damage>0)hitBoss(boss,b.damage);burst(b.x,b.y,b.z,__comicPurple,3,1);},
  onTerrain:()=>{world.breakAt?.(b.x,b.z,b.splash||.75,18,burst);}
 });
}
// Observers never write simulation data; DOT, surge, bursts, and charge remain the original rules.
function __comicObserve(dt){
 __comicClock+=dt;__comicScan-=dt;
 if(__comicState!==state){__comicState=state;__comicResetObservers();}
 if(mode!=='playing')return;
 if(state.burstTime>__comicLastBurst+.1){const e=__comicPulse(player.x,player.z,'haste',2,.5);if(e)e.g.scale.setScalar(.45);}__comicLastBurst=state.burstTime||0;
 for(const drop of state.airDrops||[])if(!__comicSeenDrops.has(drop)){__comicSeenDrops.add(drop);__comicFX.airDrop(drop.x,__comicGround(drop.x,drop.z)+.06,drop.z,AIR_CLOUD_RADIUS);}
 if(state.tideBurst&&state.tideBurst!==__comicSeenTide){__comicSeenTide=state.tideBurst;__comicPulse(state.tideBurst.x,state.tideBurst.z,'frenzy',3,FLESH_RADIUS);__comicFleshHUD.noteBurst(state);}
 const charged=state.abilities.launcher>=3&&(state.powerCharge||0)>=POWER_HITS;
 if(charged&&__comicChargeHolder!==weaponPivot){if(__comicChargeAura)__comicFX.removeAura(__comicChargeAura);__comicChargeHolder=weaponPivot;__comicChargeAura=__comicFX.aura(weaponPivot,'charge',{size:.65});}
 if(!charged&&__comicChargeAura){__comicFX.removeAura(__comicChargeAura);__comicChargeAura=null;__comicChargeHolder=null;}
 if(__comicChargeAura){__comicChargeAura.g.visible=(holdingLauncher()||!!activeGun())&&player.roll<=0;__comicFX.updateAura(__comicChargeAura,dt);}
 for(const b of tracers){
  if(!b.friendly||!b.m)continue;
  if(b.isPower)continue;
  if(!b.manualAim&&Number.isFinite(b.vx)&&Number.isFinite(b.vz))b.m.rotation.y=Math.atan2(b.vx,b.vz);
  let record=__comicProjectileFX.get(b);if(!record){record={t:0};__comicProjectileFX.set(b,record);}record.t-=dt;
  if(record.t<=0){const e=__comicFX.burst(b.x,b.y??STANDING_CHEST,b.z,b.m.material?.color?.getHex?.()||__comicPurple,1,.2);if(e)e.g.scale.setScalar(.3);record.t=reducedMotion.matches?.3:.18;}
 }
 if(__comicScan>0){for(const r of __comicUnitFX.values())if(r.aura&&r.holder?.visible)__comicFX.updateAura(r.aura,dt);return;}__comicScan=.1;
 const wanted=new Set();
 const near=units.filter(u=>!u.dead&&__comicNear(u.x,u.z,20)).sort((a,b)=>distance(player,a)-distance(player,b));let count=0;
 for(const u of near){
  const holder=visuals.get(u.id)?.v?.holder;if(!holder||!holder.visible)continue;
  const kind=u.converted?(u.surge>0?'evolve':null):u.parasite?'parasitic':state.abilities.dot>0&&u.tagged&&u.infection>0?'dot':null;
  if(!kind||count++>=8)continue;wanted.add(u);
  let r=__comicUnitFX.get(u);
  const corpse=u.kind==='corpse';
  if(!r||r.kind!==kind||r.holder!==holder||r.corpse!==corpse){
   if(r)__comicDropUnitFX(r);const anchor=corpse?new T.Group():null;if(anchor)scene.add(anchor);
   r={kind,holder,corpse,anchor,aura:__comicFX.aura(anchor||holder,kind,{size:kind==='evolve'?.85:.7}),root:u.root||0};__comicUnitFX.set(u,r);if(kind==='parasitic')__comicPulse(u.x,u.z,'dot',3,.75);
  }
  if(r.anchor)r.anchor.position.set(u.x,__comicGround(u.x,u.z)+.025,u.z);
  r.aura.g.visible=holder.visible;
  if(u.root>0&&r.root<=0)__comicPulse(u.x,u.z,'dot',3,.75);r.root=u.root||0;__comicFX.updateAura(r.aura,dt);
 }
 for(const [u,r]of __comicUnitFX)if(!wanted.has(u)){__comicDropUnitFX(r);__comicUnitFX.delete(u);}
 for(const [key,g]of auraVisuals)if(!g.visible&&key!=='mother'){g.removeFromParent();g.traverse(n=>n.material?.dispose?.());auraVisuals.delete(key);}
 const clouds=new Set(state.airClouds||[]);
 for(const cloud of clouds)if(!__comicCloudFX.has(cloud))__comicCloudFX.set(cloud,{t:0});
 for(const cloud of __comicCloudFX.keys())if(!clouds.has(cloud))__comicCloudFX.delete(cloud);
}
updateEffects=function(dt){if(mode!=='playing')return;const r=__comicOriginal.updateEffects(dt);__comicObserve(dt);return r;};
updateAuras=function(dt){
 __comicFleshHUD.update();
 if(mode!=='playing'||document.hidden)return;
 for(let i=activeAuras.length-1;i>=0;i--){const a=activeAuras[i];if(a.life>0&&(a.life-=dt)<=0){removeAura(a);continue;}if(a.g.visible)__comicFX.updateAura(a,dt);}
 __comicFX.update(dt,{pauseAirDrops:mode!=='playing'});
};
addEventListener('keydown',e=>{
 if(e.code!=='KeyF'||!state.abilities.command||e.repeat||mode!=='playing'||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
 __comicPulse(player.x,player.z,'command',Math.max(1,state.abilities.command),squadIds.size?2.6:1);
 if(squadIds.size)for(const u of units)if(squadIds.has(u.id)&&!u.dead)__comicPulse(u.x,u.z,'command',1,.6);
});
window.gameFXSnapshot=()=>({edition:'comic-ability-v6',syringeAim:'crosshair',...__comicFX.diagnostics(),trackedUnits:__comicUnitFX.size,clouds:__comicCloudFX.size,pendingDrops:(state.airDrops||[]).length,air:{spawnRange:AIR_SPAWN_RANGE,cloudRadius:AIR_CLOUD_RADIUS,interval:.5,duration:3,infectionPerTick:4},fleshProgress:__comicFleshHUD.snapshot()});


requestAnimationFrame(frame);
try{assets=await loadCharacterAssets();playerVisual=createCharacterVisual(assets,'player',1);scene.add(playerVisual.holder);playerVisual.holder.position.set(player.x,world.heightAt(player.x,player.z),player.z);playerVisual.holder.rotation.y=Math.PI;initUnits();scatterPickups();await warmBattleVisuals();if(import.meta.env.DEV&&new URLSearchParams(location.search).get('test')==='boss'){state.infected=40;state.highestEnemy=5;state.mission=4;state.pending=0;state.weapon=0;state.abilities.guns=3;state.bossCountdown=0;player.z=-15;units.forEach(u=>{u.dead=true;const visual=visuals.get(u.id)?.v;if(visual)visual.holder.visible=false;});}if(import.meta.env.DEV&&new URLSearchParams(location.search).get('test')==='melee'){state.pending=0;alerted=true;units.forEach(u=>{u.dead=true;const visual=visuals.get(u.id)?.v;if(visual)visual.holder.visible=false;});const p=world.nearest(player.x,player.z+1.15,1);const cop=makeUnit(900,1,p.x,p.z,false,0);cop.attackCd=0;units.push(cop);actorVisual(cop);}
// ?test=infected 把「已感染」的警察摆在眼前，看变异形态（只在 DEV 生效）。
// test 支持逗号组合：?test=infected,infectedshield,guncop 一次摆一排（只在 DEV 生效）。
const devTestList=(new URLSearchParams(location.search).get('test')||'').split(',');
const devTest=name=>devTestList.includes(name);
if(import.meta.env.DEV&&devTest('infected')){state.pending=0;const ip=world.nearest(player.x,player.z+2.2,1);const ally=makeUnit(902,1,ip.x,ip.z,false,0);ally.converted=true;ally.kind='ally';ally.guard=false;ally.infection=ENEMIES[1].threshold;units.push(ally);actorVisual(ally);}
// ?test=infectedshield 已感染的持盾特警（拿盾牌，用来调盾牌配件）
// ?test=guncop 未感染的持枪巡警（看它的模型和动作）
// 可以组合：?test=infected,infectedshield,guncop 一次摆一排横向对比（只在 DEV 生效）。
if(import.meta.env.DEV&&devTest('infectedshield')){state.pending=0;const sp=world.nearest(player.x-1.6,player.z+2.6,1);const ally=makeUnit(903,3,sp.x,sp.z,false,0);ally.converted=true;ally.kind='ally';ally.guard=false;ally.infection=ENEMIES[3].threshold;units.push(ally);actorVisual(ally);}
if(import.meta.env.DEV&&devTest('guncop')){state.pending=0;const gp=world.nearest(player.x+1.6,player.z+2.6,1);const gun=makeUnit(904,2,gp.x,gp.z,false,0);gun.attackCd=999;units.push(gun);actorVisual(gun);}
// ?test=shield 把持盾特警摆在眼前，方便直接看新模型（只在 DEV 生效）。
if(import.meta.env.DEV&&new URLSearchParams(location.search).get('test')==='shield'){state.pending=0;const sp=world.nearest(player.x,player.z+2.4,1);const shield=makeUnit(901,3,sp.x,sp.z,false,0);shield.attackCd=999;units.push(shield);actorVisual(shield);}if(import.meta.env.DEV&&new URLSearchParams(location.search).get('test')==='launcher'){state.pending=0;state.abilities.launcher=3;state.weapon=LAUNCHER_SLOT;state.powerCharge=POWER_HITS;}if(import.meta.env.DEV&&debugQuery.get('test')==='abilities'){state.pending=1;for(const a of ABILITIES)state.abilities[a.id]=Math.min(2,Math.max(0,Number(debugQuery.get('abilityLevel')||0)));}if(import.meta.env.DEV&&debugQuery.get('test')==='comic'){state.pending=0;state.hp=state.maxHp=500;for(const id of ['air','frenzy','dot','evolve','tough','haste','command','launcher'])state.abilities[id]=3;state.weapon=LAUNCHER_SLOT;state.powerCharge=POWER_HITS;}if(import.meta.env.DEV&&['hud','charge'].includes(debugQuery.get('test'))){
 state.pending=0;state.hp=state.maxHp=500;state.abilities.launcher=3;state.abilities.guns=3;
 state.weapon=0;state.clip=12;state.weaponOrder=['pistol','shotgun','rifle','sniper','rpg','launcher'];
 for(const gun of GUNS){state.mags[gun.id]=gun.clip;state.ammo[gun.id]=30;}
 if(debugQuery.get('test')==='hud'){
  state.xpEarned=1510;state.bossCountdown=28;state.powerCharge=2;
  publishWeakenTasks(state);completeWeaken(state,'shield');world.spawnWeakenSites();
 }else{
  state.powerCharge=0;alerted=true;
  units.forEach(u=>{u.dead=true;const visual=visuals.get(u.id)?.v;if(visual)visual.holder.visible=false;});
  const f=forward();let spot;
  for(const angle of [0,.3,-.3,.6,-.6]){
   const x=player.x+(f.x*Math.cos(angle)-f.z*Math.sin(angle))*2.5,z=player.z+(f.x*Math.sin(angle)+f.z*Math.cos(angle))*2.5;
   if(world.free(x,z,.6)&&world.clear(player,{x,z})){spot={x,z};break;}
  }
  if(spot){const enemy=makeUnit(990,5,spot.x,spot.z,false,0);enemy.attackCd=999;units.push(enemy);actorVisual(enemy);}
 }
}
// 开发遮挡场景：同一段实体墙用于检查透视窗、镜头距离和 HUD，不影响正式开局。
if(import.meta.env.DEV&&debugQuery.get('test')==='camera'){
 state.pending=0;state.hp=state.maxHp=500;alerted=true;
 units.forEach(u=>{u.dead=true;const v=visuals.get(u.id)?.v;if(v)v.holder.visible=false;});
 const f=forward(),wall=new T.Group(),base=world.heightAt(player.x,player.z);
 wall.position.set(player.x-f.x*1.15,base+1.7,player.z-f.z*1.15);wall.rotation.y=yaw;
 block(wall,4,3.4,.32,0x798592);block(wall,4.1,.2,.4,0x4e5861,0,1.35,0);
 scene.add(wall);world.destructibles.push({g:wall,dead:false,type:'camera-test',hp:1e9});
 const spot=world.nearest(player.x+f.x*4,player.z+f.z*4,.6),enemy=makeUnit(991,5,spot.x,spot.z,false,0);enemy.attackCd=999;units.push(enemy);actorVisual(enemy);
}
// 独立柱体不登记进建筑或可破坏物列表，用于复现真实街景柱子漏判。
if(import.meta.env.DEV&&debugQuery.get('test')==='pillar'){
 state.pending=0;state.hp=state.maxHp=500;alerted=true;
 units.forEach(u=>{u.dead=true;const v=visuals.get(u.id)?.v;if(v)v.holder.visible=false;});
 const f=forward(),base=world.heightAt(player.x,player.z),pillar=new T.Group();
 pillar.position.set(player.x+f.x*1.4-Math.cos(yaw)*.15,base,player.z+f.z*1.4+Math.sin(yaw)*.15);
 block(pillar,.48,3.2,.48,0x202b32,0,1.6,0);block(pillar,.65,.2,.65,0xc8ae7d,0,3.25,0);
 scene.add(pillar);world.root.attach(pillar);cameraCutaway.refresh();
 const spot=world.nearest(player.x+f.x*4,player.z+f.z*4,.6),enemy=makeUnit(992,5,spot.x,spot.z,false,0);enemy.attackCd=999;units.push(enemy);actorVisual(enemy);
}
// 把主角放到原始街景中的电线柱旁，不生成替代柱子。
if(import.meta.env.DEV&&debugQuery.get('test')==='pillar-real'){
 state.pending=0;state.hp=state.maxHp=500;alerted=true;reinforceTimer=999;
 units.forEach(u=>{u.dead=true;const v=visuals.get(u.id)?.v;if(v)v.holder.visible=false;});
 const pole=cameraCutaway.pillarAnchors().find(p=>debugQuery.get('pole')==='streetlight'?p.mesh.includes('streetlights')&&p.box.max.y-p.box.min.y>2.5&&p.box.max.x-p.box.min.x>.5:p.mesh.includes('utility_poles'));
 if(pole){const center=pole.box.getCenter(new T.Vector3()),spot=world.nearest(center.x-.15,center.z+1.4,.45);player.x=spot.x;player.z=spot.z;player.y=0;yaw=Math.PI;pitch=.08;
 const enemySpot=world.nearest(center.x,center.z-2,.6),enemy=makeUnit(993,5,enemySpot.x,enemySpot.z,false,0);enemy.attackCd=999;units.push(enemy);actorVisual(enemy);}
}
mode='menu';$('start').disabled=false;$('start').innerHTML='开始觉醒 <span>↗</span>';$('loading').textContent='';$('loading').closest('.menuStatus').hidden=true;const saved=loadSaved();if(saved){$('continue').hidden=false;$('continue').textContent=`继续 · Lv.${Math.min(saved.state.level,levelCap(saved.state))} · 城市已感染 ${Math.floor(saved.state.cityInfected/POPULATION*100)}%`;}}
catch(error){console.error(error);$('loading').closest('.menuStatus').hidden=false;$('loading').textContent='角色资源载入失败，请刷新页面重试。';$('start').textContent='刷新重试';$('start').disabled=false;$('start').onclick=()=>location.reload();}
window.gameSnapshot=()=>({mode,...state,team:teamCount(units),position:{...player},units:units.map(u=>({id:u.id,kind:u.kind,type:u.type,x:u.x,z:u.z,hp:u.hp,infection:u.infection,corpseTime:u.corpseTime})),pickups:pickups.map(p=>({x:p.x,z:p.z,type:p.type})),characterModel:!!assets,sceneName:mapConfig.name,mapId:mapConfig.id,buildings:world.buildings.length,spawn:world.spawn,renderCalls:renderer.info.render.calls,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},spawnQueued:spawnQueue.jobs.length});
window.gameTune=()=>spawnPlan(state,units,Math.random,player);
window.TUNE=TUNE;

// 配件调参面板：?propui=1 打开。拖滑杆实时看效果，调好点「复制数值」把参数发回来即可。
(function buildPropPanel(){
 if(new URLSearchParams(location.search).get('propui')!=='1')return;
 window.__propUi=true;   // 告诉输入处理别锁鼠标，否则面板没法拖
 const P=PROP_XFORM;
 const fields=[
  {label:'棍子 X（左右，往中轴为负）',get:()=>P.baton.pos[0],set:v=>P.baton.pos[0]=v,min:-1.5,max:1.5,step:.005},
  {label:'棍子 Y（上下）',get:()=>P.baton.pos[1],set:v=>P.baton.pos[1]=v,min:-1.5,max:1.5,step:.005},
  {label:'棍子 Z（前后）',get:()=>P.baton.pos[2],set:v=>P.baton.pos[2]=v,min:-1.5,max:1.5,step:.005},
  {label:'棍子 倾角（弧度）',get:()=>P.baton.angle,set:v=>P.baton.angle=v,min:0,max:3.1416,step:.01},
  {label:'棍子 长度',get:()=>P.baton.scale,set:v=>P.baton.scale=v,min:.1,max:1.5,step:.01},
  {label:'握持深度（越小插越深）',get:()=>P.baton.grip,set:v=>P.baton.grip=v,min:.2,max:.6,step:.005},
  {label:'盾牌 X',get:()=>P.shield.pos[0],set:v=>P.shield.pos[0]=v,min:-1.5,max:1.5,step:.005},
  {label:'盾牌 Y',get:()=>P.shield.pos[1],set:v=>P.shield.pos[1]=v,min:-1.5,max:1.5,step:.005},
  {label:'盾牌 Z',get:()=>P.shield.pos[2],set:v=>P.shield.pos[2]=v,min:-1.5,max:1.5,step:.005},
  {label:'盾牌 大小',get:()=>P.shield.scale,set:v=>P.shield.scale=v,min:.1,max:1.5,step:.01},
 ];
 const box=document.createElement('div');
 box.id='propPanel';
 box.style.cssText='position:fixed;left:8px;bottom:8px;z-index:60;background:#141414f2;color:#fff;padding:12px;font:12px/1.5 ui-monospace,Menlo,monospace;border:2px solid #ffd21e;max-width:360px;max-height:82vh;overflow:auto';
 const title=document.createElement('div');
 title.textContent='配件调参 · 可拖动 · 右键拖动转视角';
 title.style.cssText='color:#ffd21e;font-weight:800;margin-bottom:8px;cursor:move;user-select:none;display:flex;justify-content:space-between;gap:8px';
 const collapse=document.createElement('span');
 collapse.textContent='收起';
 collapse.style.cssText='cursor:pointer;color:#fff';
 const body=document.createElement('div');
 title.appendChild(collapse);
 box.appendChild(title);box.appendChild(body);
 collapse.onclick=()=>{const hidden=body.style.display==='none';body.style.display=hidden?'':'none';collapse.textContent=hidden?'收起':'展开';};
 // 标题栏拖动：面板挡住画面时可以挪开
 let dragging=false,offX=0,offY=0;
 title.addEventListener('mousedown',e=>{if(e.target===collapse)return;dragging=true;const r=box.getBoundingClientRect();offX=e.clientX-r.left;offY=e.clientY-r.top;box.style.left='0px';box.style.bottom='auto';box.style.top=r.top+'px';e.preventDefault();});
 addEventListener('mousemove',e=>{if(!dragging)return;box.style.left=(e.clientX-offX)+'px';box.style.top=(e.clientY-offY)+'px';});
 addEventListener('mouseup',()=>{dragging=false;});
 const values=[];
 for(const f of fields){
  const row=document.createElement('div');
  row.style.cssText='margin-bottom:8px';
  const label=document.createElement('div');
  const num=document.createElement('input');
  num.type='number';num.step=f.step;num.value=f.get().toFixed(3);
  num.style.cssText='width:70px;background:#1f1f1f;color:#fff;border:1px solid #555;margin-left:6px';
  const range=document.createElement('input');
  range.type='range';range.min=f.min;range.max=f.max;range.step=f.step;range.value=f.get();
  range.style.cssText='width:100%';
  const apply=value=>{f.set(value);num.value=value.toFixed(3);refreshCopProps();updatePropText();};
  range.oninput=()=>apply(Number(range.value));
  num.oninput=()=>apply(Number(num.value));
  label.textContent=f.label;label.appendChild(num);
  row.appendChild(label);row.appendChild(range);
  body.appendChild(row);
  values.push({label:f.label,get:f.get});
 }
 const text=document.createElement('textarea');
 text.readOnly=true;text.rows=4;
 text.style.cssText='width:100%;background:#0d0d0d;color:#9fe;font:11px ui-monospace,monospace;border:1px solid #555';
 body.appendChild(text);
 function updatePropText(){
  const p=new URLSearchParams();
  p.set('batonscale',P.baton.scale.toFixed(3));
  p.set('batonangle',P.baton.angle.toFixed(3));
  p.set('batongrip',P.baton.grip.toFixed(3));
  p.set('batonpos',P.baton.pos.map(v=>v.toFixed(3)).join(','));
  p.set('shieldscale',P.shield.scale.toFixed(3));
  p.set('shieldpos',P.shield.pos.map(v=>v.toFixed(3)).join(','));
  text.value='?'+p.toString();
 }
 const freeze=document.createElement('button');
 freeze.textContent='⏸ 静止';
 freeze.style.cssText='margin-top:6px;padding:6px 12px;background:#35d0e8;color:#141414;font-weight:800;border:0';
 freeze.onclick=()=>{
  window.__propFreeze=!window.__propFreeze;
  freeze.textContent=window.__propFreeze?'▶ 继续':'⏸ 静止';
  // 两种情况都要清一遍动画状态：
  // 静止时清，是为了摆回站立姿势（比停在半空中某个姿势好观察）；
  // 恢复时也必须清 —— 否则 attackTime / current 还停在静止那一刻，
  // 状态机认为「还在播放某个动作」，人物就再也切不回走路和攻击了。
  for(const entry of visuals.values()){
   const v=entry.v;if(!v.mixer)continue;
   v.attackTime=0;v.current=null;v.holdingGun=false;
   v.mixer.stopAllAction();
   const idle=v.actions&&v.actions.idle;
   if(idle){idle.reset().play();v.current='idle';}
   v.mixer.update(0);
  }
 };
 body.appendChild(freeze);
 const copy=document.createElement('button');
 copy.textContent='复制数值';
 copy.style.cssText='margin-top:6px;padding:6px 12px;background:#ffd21e;color:#141414;font-weight:800;border:0';
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(text.value);copy.textContent='已复制 ✓';}catch{copy.textContent='请手动复制';}setTimeout(()=>copy.textContent='复制数值',1600);};
 body.appendChild(copy);
 document.body.appendChild(box);
 updatePropText();
 console.log('[propui] 配件调参面板已开启');
})();
