import * as T from 'three';
// 仅检测地图实体，先用包围盒筛选，再检查真实表面；透明特效和人物不参与遮挡。
export function createFeedbackVisibility(world){
 const records=new Map(),cache=new WeakMap(),raycaster=new T.Raycaster(),direction=new T.Vector3(),cross=new T.Vector3();
 let count=-1,budget=6;const deferred=new Map();
 function collect(){
  const register=(mesh,owner=null)=>{
   if(!mesh.isMesh||!mesh.geometry)return;
   let r=records.get(mesh);
   if(!r){mesh.updateWorldMatrix(true,false);r={mesh,owner,box:new T.Box3().setFromObject(mesh),matrix:mesh.matrixWorld.clone()};records.set(mesh,r);}
   else if(owner)r.owner=owner;
  };
  world.root?.traverse(n=>register(n));
  for(const o of world.destructibles||[])o.g?.traverse(n=>register(n,o));
  count=world.destructibles?.length||0;
 }
 function check(from,to,anchor){
  if(count!==(world.destructibles?.length||0))collect();
  const now=performance.now(),old=anchor&&cache.get(anchor);
  // 同一角色的冲击、扣血和污染共用结果；位置改变就立即重查，静止时最多缓存 80ms。
  if(old&&now-old.at<80&&old.from.distanceToSquared(from)<.0225&&old.to.distanceToSquared(to)<.0225)return old.visible;
  direction.subVectors(to,from);const length=direction.length();
  if(length<.12)return true;
  raycaster.set(from,direction.normalize());raycaster.near=.035;raycaster.far=length-.07;
  let answer=true;
  for(const r of records.values()){
   if(r.owner?.dead)continue;
   let shown=true;for(let n=r.mesh;n;n=n.parent)if(!n.visible){shown=false;break;}
   if(!shown)continue;
   const mats=Array.isArray(r.mesh.material)?r.mesh.material:[r.mesh.material];
   if(mats.every(m=>!m?.visible||(m.transparent&&m.opacity<.5)))continue;
   if(!r.matrix.equals(r.mesh.matrixWorld)){r.box.setFromObject(r.mesh);r.matrix.copy(r.mesh.matrixWorld);}
   if(!raycaster.ray.intersectBox(r.box,cross)||cross.distanceTo(from)>raycaster.far)continue;
   const hits=raycaster.intersectObject(r.mesh,false);
   if(hits.some(hit=>{
    const mat=mats[hit.face?.materialIndex||0]||mats[0];
    if(!mat?.visible||(mat.transparent&&mat.opacity<.5))return false;
    // 河畔建筑的缺口由 shader 裁切，射线也跳过这些被挖掉的体素。
    return !r.owner?.holes?.some(h=>Math.abs(hit.point.x-h.x)<.55*.62&&Math.abs(hit.point.y-h.y)<.55*.62&&Math.abs(hit.point.z-h.z)<.55*.62);
   })){answer=false;break;}
  }
  if(anchor)cache.set(anchor,{at:now,from:from.clone(),to:to.clone(),visible:answer});
  return answer;
 }
 function visible(from,to,anchor){
  const old=anchor&&cache.get(anchor),now=performance.now();
  if(old&&now-old.at<80&&old.from.distanceToSquared(from)<.0225&&old.to.distanceToSquared(to)<.0225)return old.visible;
  if(budget>0){budget--;if(anchor)deferred.delete(anchor);return check(from,to,anchor);}
  // 每帧最多六条精确射线，未检查的目标暂不显示；下一帧优先处理，避免队友大混战拖慢游戏。
  if(anchor)deferred.set(anchor,{from:from.clone(),to:to.clone(),at:now});
  return false;
 }
 function beginFrame(){
  budget=6;const now=performance.now();
  for(const [anchor,r] of deferred){
   if(now-r.at>300){deferred.delete(anchor);continue;}
   if(!budget)break;budget--;deferred.delete(anchor);check(r.from,r.to,anchor);
  }
 }
 return {visible,beginFrame};
}
