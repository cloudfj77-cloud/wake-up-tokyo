import * as T from 'three';

// 每人继续使用自己的骨骼、动作与游戏单位；只把同外观的最终绘制合并。
export function installActorRenderBatches(scene,visuals,extraMeshes=()=>[]){
 const root=new T.Group();root.name='Actor_Render_Batches';scene.add(root);
 const groups=new Map(),hidden=new T.MeshBasicMaterial({visible:false}),restore=[],rigs=new Map(),solidKeys=new Map(),flatKeys=new Map(),materialIDs=new Map(),bindIDs=new Map(),bindCache=new WeakMap();
 const before=scene.onBeforeRender,after=scene.onAfterRender;let active=false,instances=0,usedBones=0;
 let atlas=new T.DataTexture(new Float32Array(512*64*4),512,64,T.RGBAFormat,T.FloatType);atlas.needsUpdate=true;
 const maps=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','alphaMap','aoMap','lightMap','envMap','bumpMap'];
 function materialKey(m,flatFX=false){
  const cache=flatFX?flatKeys:solidKeys,known=cache.get(m);if(known!==undefined)return known;
  if(!m||m.transparent&&!flatFX||m.clippingPlanes||m.onBeforeCompile!==T.Material.prototype.onBeforeCompile||!(m.isMeshStandardMaterial||m.isMeshBasicMaterial||m.isMeshNormalMaterial||m.isMeshPhongMaterial))return null;
  // 感染后会直接改颜色和自发光，不依赖 material.version，不能缓存旧阵营的颜色。
  const signature=[m.type,m.visible,...(!flatFX&&m.color?m.color.toArray():[]),...(m.emissive?.toArray()||[]),...(m.specular?.toArray()||[]),m.shininess,m.emissiveIntensity,m.roughness,m.metalness,flatFX?'':m.opacity,m.side,m.fog,m.flatShading,m.vertexColors,m.alphaTest,m.depthTest,m.depthWrite,m.colorWrite,m.toneMapped,m.blending,m.premultipliedAlpha,m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits,m.normalScale?.x,m.normalScale?.y,m.normalMapType,m.envMapIntensity,m.aoMapIntensity,m.lightMapIntensity,m.bumpScale,...maps.map(k=>m[k]?.uuid||'')].join('/');
  if(!materialIDs.has(signature))materialIDs.set(signature,materialIDs.size);const id=materialIDs.get(signature);cache.set(m,id);return id;
 }
 function bindKey(matrix){let id=bindCache.get(matrix);if(id===undefined){const signature=matrix.elements.join(',');if(!bindIDs.has(signature))bindIDs.set(signature,bindIDs.size);id=bindIDs.get(signature);bindCache.set(matrix,id);}return id;}
 function patchSkin(material){
  const key=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{
   const chunk=T.ShaderChunk.skinning_pars_vertex.replace('int j = int( i ) * 4;','int j = ( int( i ) + int( actorBoneOffset ) ) * 4;');
   shader.vertexShader=shader.vertexShader.replace('#include <skinning_pars_vertex>','attribute float actorBoneOffset;\n'+chunk);
  };
  material.customProgramCacheKey=()=>key+'|independent-actor-palette-v2';return material;
 }
 function create(source,skin){
  const capacity=skin?128:256,mats=Array.isArray(source.material)?source.material.map(m=>m.clone()):source.material.clone(),batch=new T.InstancedMesh(source.geometry,mats,capacity);
  batch.name=skin?'Actor_Skinned_Instances':'Actor_Rigid_Instances';batch.frustumCulled=false;batch.boundingSphere=new T.Sphere(new T.Vector3(),1000);batch.matrixAutoUpdate=false;batch.matrixWorldAutoUpdate=false;batch.castShadow=source.castShadow;batch.receiveShadow=source.receiveShadow;batch.renderOrder=source.renderOrder;batch.visible=false;root.add(batch);
  const flatFX=!!source.userData.comicBatch;
  if(flatFX){
   // 透明度逐片上传，动画每帧变淡时复用原批次，不能不断新建材质和网格。
   batch.geometry=source.geometry.clone();batch.geometry.setAttribute('actorOpacity',new T.InstancedBufferAttribute(new Float32Array(capacity),1));mats.color.set(0xffffff);mats.opacity=1;mats.forceSinglePass=true;
   mats.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float actorOpacity;varying float vActorOpacity;').replace('#include <color_vertex>','#include <color_vertex>\nvActorOpacity=actorOpacity;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vActorOpacity;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vActorOpacity;');};mats.customProgramCacheKey=()=> 'comic-instance-alpha-v1';
  }
  const group={batch,capacity,count:0,bones:skin?source.skeleton.bones.length:0,flatFX,items:[]};
  if(skin){
   // 所有身体部位和细节等级共用一次骨骼上传；批次只保存各自人物在调色板中的起点。
   const geometry=new T.BufferGeometry();for(const [name,attribute]of Object.entries(source.geometry.attributes))geometry.setAttribute(name,attribute);geometry.setIndex(source.geometry.index);for(const g of source.geometry.groups)geometry.addGroup(g.start,g.count,g.materialIndex);geometry.drawRange={...source.geometry.drawRange};geometry.setAttribute('actorBoneOffset',new T.InstancedBufferAttribute(new Float32Array(capacity),1));batch.geometry=geometry;
   // 骨骼矩阵已经含人物的世界变换，因此批次自身和反绑定矩阵保持单位矩阵。
   batch.isSkinnedMesh=true;batch.bindMatrix=source.bindMatrix.clone();batch.bindMatrixInverse=new T.Matrix4();batch.skeleton={boneTexture:atlas,bones:source.skeleton.bones,update(){}};
   for(const m of Array.isArray(mats)?mats:[mats])patchSkin(m);
  }
  return group;
 }
 function begin(camera){
  if(active)end();active=true;instances=0;usedBones=0;restore.length=0;rigs.clear();solidKeys.clear();flatKeys.clear();for(const list of groups.values())for(const g of list){g.count=0;g.items.length=0;g.batch.visible=false;}
  try{
   function submit(source,marker){
     if(!source.visible||!source.isMesh||source===marker||source.onBeforeRender!==T.Object3D.prototype.onBeforeRender||Object.keys(source.geometry.morphAttributes).length)return;
     const skin=!!source.isSkinnedMesh;if(skin&&source.bindMode!==T.AttachedBindMode)return;
     const flatFX=!!source.userData.comicBatch,materials=Array.isArray(source.material)?source.material:[source.material],keys=materials.map(m=>materialKey(m,flatFX));if(keys.some(k=>k===null)||materials.every(m=>!m.visible))return;
     // 用短编号组合批次；同一趟只读一次共享材质，避免每帧产生大量重复长字符串。
     const key=[source.geometry.id,skin?source.skeleton.bones.length:0,skin?bindKey(source.bindMatrix):'',source.castShadow,source.receiveShadow,source.renderOrder,flatFX,...keys].join('|');
     let list=groups.get(key);if(!list){list=[];groups.set(key,list);}let group=list.find(g=>g.count<g.capacity);if(!group){group=create(source,skin);list.push(group);}
     const index=group.count++;
     if(skin){
      let offset=rigs.get(source.skeleton);
      if(offset===undefined){offset=usedBones;usedBones+=group.bones;
       if(usedBones*16>atlas.image.data.length){const old=atlas;atlas=new T.DataTexture(new Float32Array(old.image.data.length*2),old.image.width,old.image.height*2,T.RGBAFormat,T.FloatType);atlas.image.data.set(old.image.data);old.dispose();for(const list of groups.values())for(const g of list)if(g.bones)g.batch.skeleton.boneTexture=atlas;}
       source.skeleton.update();atlas.image.data.set(source.skeleton.boneMatrices.subarray(0,group.bones*16),offset*16);rigs.set(source.skeleton,offset);
      }
      group.batch.geometry.attributes.actorBoneOffset.setX(index,offset);
     }
     else if(flatFX){const p=source.matrixWorld.elements,e=camera?.matrixWorldInverse.elements;group.items.push({source,color:materials[0].color,opacity:materials[0].opacity,depth:e?e[2]*p[12]+e[6]*p[13]+e[10]*p[14]+e[14]:0});}
     else group.batch.setMatrixAt(index,source.matrixWorld);
     restore.push([source,source.material]);source.material=hidden;instances++;
   }
   for(const {v}of visuals.values()){
    if(!v.holder.visible)continue;
    v.holder.traverseVisible(source=>submit(source,v.marker));
   }
   // 密集近战会同时出现数百粒同形碎片；保留每粒的运动，仅合并绘制。
   for(const source of extraMeshes())submit(source);
   if(usedBones)atlas.needsUpdate=true;
   for(const list of groups.values())for(const group of list){group.batch.count=group.count;group.batch.visible=group.count>0;if(group.count){
    // 漫画片保留墨边/填色层次，同一形状按远近排列。颜色逐实例上传，不为每种颜色单独画。
    if(group.flatFX){group.items.sort((a,b)=>a.depth-b.depth);const alpha=group.batch.geometry.getAttribute('actorOpacity');group.items.forEach(({source,color,opacity},i)=>{group.batch.setMatrixAt(i,source.matrixWorld);group.batch.setColorAt(i,color);alpha.setX(i,opacity);});group.batch.instanceColor.needsUpdate=true;alpha.needsUpdate=true;}
    if(group.bones)group.batch.geometry.attributes.actorBoneOffset.needsUpdate=true;else group.batch.instanceMatrix.needsUpdate=true;
   }}
  }catch(error){end();throw error;}
 }
 function end(){if(!active)return;for(const [source,material]of restore)source.material=material;restore.length=0;for(const list of groups.values())for(const g of list)g.batch.visible=false;active=false;}
 scene.onBeforeRender=function(...args){before.apply(this,args);begin(args[2]);};
 scene.onAfterRender=function(...args){try{end();}finally{after.apply(this,args);}};
 return {begin,end,diagnostics:()=>({groups:[...groups.values()].reduce((n,list)=>n+list.filter(g=>g.count>0).length,0),instances,rigs:rigs.size,boneUploadBytes:usedBones?atlas.image.data.byteLength:0}),dispose(){end();scene.onBeforeRender=before;scene.onAfterRender=after;for(const list of groups.values())for(const g of list){if(g.flatFX||g.bones)g.batch.geometry.dispose();for(const m of Array.isArray(g.batch.material)?g.batch.material:[g.batch.material])m.dispose();g.batch.dispose();}atlas.dispose();hidden.dispose();root.removeFromParent();}};
}
