import * as T from 'three';
import {createStaticVisibility} from './static-visibility.js';

// 颜色按原材质合批；法线只按几何格式合批，避免为几百种材质重复提交同一种法线材质。
export function batchStaticScene(root){
 root.updateMatrixWorld(true);let sourceCount=0,batchCount=0;const detailBatches=[],normalGroups=[],normalReplaced=[];
 const matrix=new T.Matrix4(),instance=new T.Matrix4(),worldMatrix=new T.Matrix4(),worldBox=new T.Box3(),color=new T.Color(),visibility=createStaticVisibility();
 const layout=o=>Object.entries(o.geometry.attributes).map(([name,a])=>name+':'+a.itemSize).sort().join(',')+'|'+Boolean(o.geometry.index);
 for(const section of [...root.children]){
  if(!section.visible)continue;
  const buckets=new Map(),normalBuckets=new Map(),inverse=section.matrixWorld.clone().invert();
  section.traverse(o=>{
   if(!o.isMesh||o.isBatchedMesh||!o.visible||Array.isArray(o.material))return;
   const format=layout(o),normalKey=format,key=o.material.uuid+'|'+format+'|'+o.castShadow;
   if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);
   if(!o.material.transparent){if(!normalBuckets.has(normalKey))normalBuckets.set(normalKey,[]);normalBuckets.get(normalKey).push(o);}
  });
  const group=new T.Group();group.name='Render_Batches_Exclude_From_Export';section.add(group);
  const normalGroup=new T.Group();normalGroup.name='Static_Normal_Pass';normalGroup.visible=false;section.add(normalGroup);normalGroups.push(normalGroup);
  function build(sources,material,parent,normalOnly=false){
   const geometries=new Map();let vertices=0,indices=0,count=0;
   for(const o of sources){count+=o.isInstancedMesh?o.count:1;if(!geometries.has(o.geometry.uuid)){geometries.set(o.geometry.uuid,{geometry:o.geometry});vertices+=o.geometry.attributes.position.count;indices+=o.geometry.index?.count||0;}}
   const batch=new T.BatchedMesh(count,vertices,indices,material);batch.name=normalOnly?'Static_Normal_Batch':'Static_Material_Batch';
   // 玻璃也共享绘制，但继续按距离排序；它不进入法线趟，也不套细小装饰的距离裁剪。
   batch.sortObjects=!!material.transparent;batch.perObjectFrustumCulled=!!material.transparent;batch.castShadow=normalOnly?false:sources[0].castShadow;batch.receiveShadow=!normalOnly;parent.add(batch);const details=[];
   for(const entry of geometries.values())entry.id=batch.addGeometry(entry.geometry);
   for(const o of sources){
    matrix.multiplyMatrices(inverse,o.matrixWorld);const geometryId=geometries.get(o.geometry.uuid).id;
    for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
     const id=batch.addInstance(geometryId);
     if(o.isInstancedMesh){o.getMatrixAt(i,instance);instance.premultiply(matrix);}else instance.copy(matrix);
     batch.setMatrixAt(id,instance);
     const bounds=new T.Sphere();if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();bounds.copy(o.geometry.boundingSphere).applyMatrix4(instance).applyMatrix4(section.matrixWorld);
     if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();worldMatrix.multiplyMatrices(section.matrixWorld,instance);worldBox.copy(o.geometry.boundingBox).applyMatrix4(worldMatrix);
     const record=material.transparent?null:visibility.add(batch,id,bounds,worldBox);
     if(!material.transparent&&bounds.radius<3)details.push({id,record,center:bounds.center.clone(),range:bounds.radius<.6?30:70,visible:true});
     if(!normalOnly&&o.instanceColor){o.getColorAt(i,color);batch.setColorAt(id,color);}
     if(!normalOnly)sourceCount++;
    }
    if(!normalOnly)o.visible=false;
   }
   batch.computeBoundingBox();batch.computeBoundingSphere();if(!material.transparent)visibility.shadowHooks(batch);if(details.length)detailBatches.push({batch,details});return batch;
  }
  for(const sources of buckets.values()){
   if(sources.length<2){normalReplaced.push(...sources);continue;}
   normalReplaced.push(build(sources,sources[0].material,group));batchCount++;
  }
  // 与颜色批次使用完全相同的几何与变换；仅在法线趟切换可见性，不改颜色、贴图或阴影。
  for(const sources of normalBuckets.values())build(sources,new T.MeshNormalMaterial(),normalGroup,true);
 }
 root.updateMatrixWorld(true);
 const lastDetailCamera=new T.Vector3(Infinity,Infinity,Infinity),savedVisibility=[];
 // 远处细小装饰不参与绘制；建筑轮廓和所有真实碰撞仍保留。
 function updateDetailVisibility(position){
  if(lastDetailCamera.distanceToSquared(position)<64)return false;
  lastDetailCamera.copy(position);let changed=false;
  for(const {batch,details}of detailBatches)for(const item of details){
   const visible=position.distanceToSquared(item.center)<(item.range+(item.visible?12:0))**2;
   if(visible!==item.visible){visibility.setDetail(item.record,visible);item.visible=visible;changed=true;}
  }
  return changed;
 }
 const normalPass={
  begin(){savedVisibility.length=0;for(const mesh of normalReplaced){savedVisibility.push(mesh.visible);mesh.visible=false;}for(const group of normalGroups)group.visible=true;},
  end(){for(const group of normalGroups)group.visible=false;normalReplaced.forEach((mesh,i)=>{mesh.visible=savedVisibility[i];});}
 };
 return {sourceCount,batchCount,updateDetailVisibility,updateVisibility:visibility.update,visibilityDiagnostics:visibility.diagnostics,normalPass};
}
