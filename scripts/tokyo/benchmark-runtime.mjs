// 同一真实地图、人口配额和固定种子，对照碰撞与 AI 实际耗时；不减少人数或改移速。
import fs from 'node:fs';import {fileURLToPath} from 'node:url';import vm from 'node:vm';import * as rules from '../../rules.js';import {loadTokyoCollisionScene} from './load-collision-scene.mjs';import {WalkCollision} from '../../tokyo/collision.js';import {createTokyoNavigation} from '../../tokyo/navigation.js';import {createTokyoPopulation} from '../../tokyo/gameplay.js';
const root=fileURLToPath(new URL('../../',import.meta.url)),data=JSON.parse(fs.readFileSync(root+'assets/scenes/tokyo-navigation.json')),collision=new WalkCollision(await loadTokyoCollisionScene()),source=fs.readFileSync(root+'main.js','utf8'),section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a))),code=section('const STUCK_LIMIT=','function forward()')+section('const CROWD_CELL=','function dropActorVisual(');
const reports=[];
for(const initSeed of [1,17]){
 const nav=createTokyoNavigation(data,collision),pop=createTokyoPopulation(nav),player={x:5,z:8,floorY:-3.85},units=[];let seed=initSeed,attacks=0;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let region=0;region<4;region++)for(const [type,count] of [[0,rules.TUNE.difficulty.civiliansPerRegion],[1,rules.TUNE.difficulty.patrolsPerRegion]])for(let i=0;i<count;i++){
  const spot=pop.spawn({region,player,units,random,type});if(!spot)continue;const u=rules.makeUnit(units.length,type,spot.x,spot.z,true,units.length%5);Object.assign(u,{floorY:spot.floorY,populationRegion:region});units.push(u);
 }
 const u=rules.makeUnit(999,0,1,8,true);u.floorY=-3.85;rules.convert(rules.makeState(),u);units.push(u);
 const ctx=vm.createContext({...rules,ALLY_VIEW:22,units,player,world:{...nav,multilevel:true,towers:[],tutorial:true,populationTarget:(u,o)=>pop.wander(u,{...o,random})},boss:{active:false},state:{hp:100,maxHp:100,time:0},squadIds:new Set(),visuals:new Map(),frameDelta:.04,tickPurifier:()=>null,showHostilePose(){},allyFire(){attacks++;}});
 vm.runInContext(code+'\nMath.random=()=>.5;',ctx);let idle=0,travel=0,times=[];const cost={raycast:0,resolve:0,rayCalls:0,bodyCalls:0};
 const originalRay=collision.raycast,originalResolve=collision.resolve;
 collision.raycast=function(...a){const at=performance.now();const r=originalRay.apply(this,a);cost.raycast+=performance.now()-at;cost.rayCalls++;return r;};
 collision.resolve=function(...a){const at=performance.now();const r=originalResolve.apply(this,a);cost.resolve+=performance.now()-at;cost.bodyCalls++;return r;};
 for(let i=0;i<240;i++){const x=u.x,z=u.z,at=performance.now();vm.runInContext('runAI(.04,true)',ctx);times.push(performance.now()-at);const moved=Math.hypot(u.x-x,u.z-z);travel+=moved;if(moved<.002)idle++;}
 collision.raycast=originalRay;collision.resolve=originalResolve;times.sort((a,b)=>a-b);reports.push({seed:initSeed,frames:times.length,actors:units.length,aiMedianMs:times[Math.floor(times.length*.5)],aiP95Ms:times[Math.floor(times.length*.95)],aiTotalMs:times.reduce((a,b)=>a+b),...cost,travel,idle,attacks});
}

const result={version:JSON.parse(fs.readFileSync(root+'package.json')).version,reports};if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
