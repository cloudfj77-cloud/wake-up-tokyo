import * as T from 'three';

// 只检测空间小块是否入镜，绘制仍按原材质合批。镜头移动时仅修改进出视野的小块，不逐帧重建数万实例的指令。
export function createStaticVisibility(options={}){
 const clusters=new Map(),byBatch=new Map(),matrix=new T.Matrix4(),previous=new T.Matrix4().makeScale(0,0,0),frustum=new T.Frustum(),box=new T.Box3(),size=new T.Vector3();
 let lastNear,lastFar;
 function add(batch,id,sphere,actualBox,normalOnly=false){
  const p=sphere.center,key=[normalOnly,Math.floor(p.x/4),Math.floor(p.y/4),Math.floor(p.z/4)].join(',');let cluster=clusters.get(key);
  if(!cluster){cluster={box:new T.Box3(),normalOnly,visible:null,members:[]};clusters.set(key,cluster);}
  // 高柱和长栏杆不能拿包围球当箱子，否则四周空白也会撑大可见范围。
  if(actualBox)cluster.box.union(actualBox);else{size.setScalar(sphere.radius*2);box.setFromCenterAndSize(p,size);cluster.box.union(box);}
  const record={batch,id,detailVisible:true,cluster};cluster.members.push(record);if(!byBatch.has(batch))byBatch.set(batch,[]);byBatch.get(batch).push(record);return record;
 }
 function setDetail(record,visible){record.detailVisible=visible;record.batch.setVisibleAt(record.id,visible&&record.cluster.visible!==false);}
 function update(camera){
  const fog=options.fog,near=fog?.near,far=fog?.far;
  matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);if(previous.equals(matrix)&&near===lastNear&&far===lastFar)return;previous.copy(matrix);lastNear=near;lastFar=far;frustum.setFromProjectionMatrix(matrix,camera.coordinateSystem,camera.reversedDepth);
  const active=fog&&Number.isFinite(near)&&near<500,span=far-near;
  const mainRange=options.cullMeters??(active?far+(options.cullPad??10):Infinity);
  const normalRange=options.outlineMeters??(active?near+span*Math.min(options.outlineFactor??.3,options.lodFactor??.35):Infinity);
  // 留一点退场余量，受击镜头的轻微震动不会反复重建边缘小块的绘制列表。
  for(const c of clusters.values()){const visible=frustum.intersectsBox(c.visible?box.copy(c.box).expandByScalar(.6):c.box)&&c.box.distanceToPoint(camera.position)<(c.normalOnly?normalRange:mainRange);if(c.visible===visible)continue;c.visible=visible;for(const r of c.members)r.batch.setVisibleAt(r.id,visible&&r.detailVisible);}
 }
 function shadowHooks(batch){
  const before=batch.onBeforeShadow,after=batch.onAfterShadow;
  // 镜头外的楼房仍会向镜头内投影。烘焙阴影时临时恢复其几何，结束再恢复相机的可见列表。
  batch.onBeforeShadow=function(...args){for(const r of byBatch.get(batch)||[])batch.setVisibleAt(r.id,r.detailVisible);return before.apply(this,args);};
  batch.onAfterShadow=function(...args){try{return after.apply(this,args);}finally{for(const r of byBatch.get(batch)||[])batch.setVisibleAt(r.id,r.detailVisible&&r.cluster.visible!==false);}};
 }
 return {add,setDetail,update,shadowHooks,diagnostics:()=>({clusters:clusters.size,visible:[...clusters.values()].filter(c=>c.visible).length})};
}
