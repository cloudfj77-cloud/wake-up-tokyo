import * as T from 'three';

export function pruneEmptyStaticGroups(root){
 let removed=0;
 for(const child of [...root.children]){
  removed+=pruneEmptyStaticGroups(child);
  if(child.isObject3D&&!child.isMesh&&!child.isLight&&!child.isCamera&&!child.children.length){root.remove(child);removed++;}
 }
 return removed;
}

// Keep editable/exportable source meshes; render the same transforms in native Three batches.
export function batchStaticScene(root,{cellSize=Infinity}={}){
 root.updateMatrixWorld(true);let sourceCount=0,batchCount=0;const detailBatches=[];
 const matrix=new T.Matrix4(),instance=new T.Matrix4(),color=new T.Color();
 for(const section of [...root.children]){
  if(!section.visible)continue;
  const buckets=new Map(),inverse=section.matrixWorld.clone().invert();
  section.traverse(o=>{
   if(!o.isMesh||o.isBatchedMesh||!o.visible||Array.isArray(o.material)||o.material.transparent)return;
   const attributes=Object.entries(o.geometry.attributes).map(([name,a])=>name+':'+a.itemSize).sort().join(',');
   // Optional spatial cells can be useful for large maps with few materials.
   const center=new T.Vector3().setFromMatrixPosition(o.matrixWorld);
   const cell=Math.floor(center.x/cellSize)+','+Math.floor(center.z/cellSize);
   const key=cell+'|'+(o.userData.batchMaterial||o.material).uuid+'|'+attributes+'|'+Boolean(o.geometry.index)+'|'+o.castShadow;
   if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);
  });
  const group=new T.Group();group.name='Render_Batches_Exclude_From_Export';section.add(group);
  for(const sources of buckets.values()){
   if(sources.length<2)continue;
   const geometries=new Map();let vertices=0,indices=0,count=0;
   for(const o of sources){count+=o.isInstancedMesh?o.count:1;if(!geometries.has(o.geometry.uuid)){geometries.set(o.geometry.uuid,{geometry:o.geometry});vertices+=o.geometry.attributes.position.count;indices+=o.geometry.index?.count||0;}}
   const batch=new T.BatchedMesh(count,vertices,indices,sources[0].userData.batchMaterial||sources[0].material);batch.name='Static_Material_Batch';batch.sortObjects=false;batch.castShadow=sources[0].castShadow;batch.receiveShadow=true;group.add(batch);batchCount++;const details=[];
   for(const entry of geometries.values())entry.id=batch.addGeometry(entry.geometry);
   for(const o of sources){
    matrix.multiplyMatrices(inverse,o.matrixWorld);
    const geometryId=geometries.get(o.geometry.uuid).id;
    for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
     const id=batch.addInstance(geometryId);
     if(o.isInstancedMesh){o.getMatrixAt(i,instance);instance.premultiply(matrix);}else instance.copy(matrix);
     batch.setMatrixAt(id,instance);
     const bounds=new T.Sphere();if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();bounds.copy(o.geometry.boundingSphere).applyMatrix4(instance).applyMatrix4(section.matrixWorld);
     if(bounds.radius<3)details.push({id,center:bounds.center.clone(),range:bounds.radius<.6?75:150,visible:true});
     if(o.userData.batchColor||o.instanceColor){color.copy(o.userData.batchColor||new T.Color(0xffffff));if(o.instanceColor){const tint=new T.Color();o.getColorAt(i,tint);color.multiply(tint);}batch.setColorAt(id,color);}
     sourceCount++;
    }
    o.visible=false;
   }
   batch.computeBoundingBox();batch.computeBoundingSphere();if(details.length)detailBatches.push({batch,details});
  }
 }
 root.updateMatrixWorld(true);
 const lastDetailCamera=new T.Vector3(Infinity,Infinity,Infinity);
 function updateDetailVisibility(position){
  if(lastDetailCamera.distanceToSquared(position)<64)return false;
  lastDetailCamera.copy(position);let changed=false;
  for(const {batch,details}of detailBatches)for(const item of details){
   const visible=position.distanceToSquared(item.center)<(item.range+(item.visible?12:0))**2;
   if(visible!==item.visible){batch.setVisibleAt(item.id,visible);item.visible=visible;changed=true;}
  }
  return changed;
 }
 return {sourceCount,batchCount,updateDetailVisibility};
}
