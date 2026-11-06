import {mergeRigidDetails} from './rigid-detail.js';
import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshoptSimplifier} from 'meshoptimizer/simplifier';
import {MeshoptEncoder} from 'meshoptimizer/encoder';

const records=new WeakMap(),report=[];
const triangles=g=>(g.index?.count||g.attributes.position.count)/3;
// 只生成新的索引，位置、UV、法线和蒙皮权重全部保留原值，骨骼与动作不改。
export async function prepareCharacterDetails(assets){
 await Promise.all([MeshoptSimplifier.ready,MeshoptEncoder.ready]);
 const all=assets.scene?[assets]:Object.values(assets).flat().filter(a=>a?.scene),seen=new Set();
 for(const asset of all){
  if(seen.has(asset)||asset===assets.player)continue;seen.add(asset);
  const meshes=[];asset.scene.traverse(o=>{if(o.isMesh&&o.geometry?.attributes.position)meshes.push(o);});
  const total=meshes.reduce((n,m)=>n+triangles(m.geometry),0);if(total<16000)continue;
  for(const mesh of meshes){
   const original=mesh.geometry;if(records.has(original)){mesh.geometry=records.get(original).levels[0];continue;}
   if(Object.keys(original.morphAttributes).length||triangles(original)<256)continue;
   const geometry=mergeVertices(original,1e-6),position=geometry.attributes.position;
   const positions=Float32Array.from(position.array),indices=Uint32Array.from(geometry.index.array);
   const names=['normal','uv'].filter(n=>geometry.attributes[n]),skin=geometry.attributes.skinIndex&&geometry.attributes.skinWeight,stride=names.reduce((n,key)=>n+geometry.attributes[key].itemSize,0)+(skin?8:0),attrs=new Float32Array(position.count*stride),weights=[];
   for(const name of names){const a=geometry.attributes[name];for(let j=0;j<a.itemSize;j++)weights.push(name==='uv'?1:.5);}
   if(skin)for(let bit=0;bit<8;bit++)weights.push(.5);
   // 骨骼影响按骨骼编号聚合，不能把同一组权重的不同排序误判成关节差异。
   for(let i=0;i<position.count;i++){let at=i*stride;for(const name of names){const a=geometry.attributes[name];for(let j=0;j<a.itemSize;j++)attrs[at++]=a.getComponent(i,j);}
    if(skin)for(let bit=0;bit<8;bit++){let value=0;for(let j=0;j<4;j++)if((geometry.attributes.skinIndex.getComponent(i,j)>>bit)&1)value+=geometry.attributes.skinWeight.getComponent(i,j);attrs[at++]=value;}
   }
   const sourceGroups=geometry.groups.length?geometry.groups:[{start:0,count:indices.length,materialIndex:0}],byMaterial=new Map(),levels=[];
   // FBX 把同一块皮肤的相邻三角面分散在多个组。必须先按材质合回去再精简，否则每组像孤岛一样被删出洞。
   for(const group of sourceGroups){const key=Array.isArray(mesh.material)?group.materialIndex:0;if(!byMaterial.has(key))byMaterial.set(key,[]);byMaterial.get(key).push(indices.subarray(group.start,group.start+group.count));}
   const groups=[...byMaterial].map(([materialIndex,parts])=>{const source=new Uint32Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const part of parts){source.set(part,at);at+=part.length;}return {materialIndex,source};});
   for(const [budget,error]of [[30000,.012],[10000,.025],[3500,.045]]){
    const ratio=Math.min(1,budget/total),parts=[],out=geometry.clone();out.clearGroups();let offset=0;
    // 材质分组分别精简，避免串用贴图；保留属性接缝，并约束关节区域的三角形形状。
    for(const group of groups){const source=group.source,target=Math.min(source.length,Math.max(96,Math.floor(source.length*ratio/3)*3));
     const [reduced]=MeshoptSimplifier.simplifyWithAttributes(source,positions,3,attrs,stride,weights,null,target,error,['Permissive','LockBorder','RegularizeLight']);
     // 相邻三角面尽量连续提交，避免同一个蒙皮顶点在显卡缓存里反复重算；不改变三角形或顶点值。
     const [remap,unique]=MeshoptEncoder.reorderMesh(reduced,true,false),inverse=new Uint32Array(unique);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff)inverse[remap[i]]=i;for(let i=0;i<reduced.length;i++)reduced[i]=inverse[reduced[i]];
     parts.push(reduced);out.addGroup(offset,reduced.length,group.materialIndex);offset+=reduced.length;
    }
    const joined=new Uint32Array(offset);let at=0;for(const part of parts){joined.set(part,at);at+=part.length;}
    // 各等级共用顶点缓冲，仅替换索引，避免每个角色和每个等级重复上传大型蒙皮数据。
    for(const [name,attribute]of Object.entries(geometry.attributes))out.setAttribute(name,attribute);
    out.setIndex(new T.BufferAttribute(joined,1));out.boundingBox=original.boundingBox?.clone()||null;out.boundingSphere=original.boundingSphere?.clone()||null;levels.push(out);
   }
   report.push({mesh:mesh.name,groups:geometry.groups.length,original:triangles(original),levels:levels.map(triangles)});
   const record={original,levels};records.set(original,record);for(const level of levels)records.set(level,record);mesh.geometry=levels[0];
  }
  mergeRigidDetails(asset.scene,asset.clips||[]);
  // 长模型的精简放在载入阶段，战斗中只切换已准备好的几何。
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 for(const prop of Object.values(assets.props||{}))if(prop?.isObject3D)mergeRigidDetails(prop);
 return assets;
}
export function setCharacterDetail(visual,distance){
 let level=visual.geometryDetail;
 // 人物不足百像素高时无需数万三角面；近身仍保留高细节，并留出切换缓冲。
 if(level==null)level=distance<3?0:distance<9?1:2;
 else if(level===0&&distance>3.6)level=distance>10?2:1;
 else if(level===1){if(distance<2.6)level=0;else if(distance>10)level=2;}
 else if(level===2&&distance<8)level=distance<2.6?0:1;
 if(visual.kind==='player')level=-1;
 if(level===visual.geometryDetail)return;visual.geometryDetail=level;
 for(const mesh of visual.meshes){const record=records.get(mesh.geometry);if(record)mesh.geometry=level<0?record.original:record.levels[level];}
}
export function characterDetailStats(geometry){const r=records.get(geometry);return r?{original:triangles(r.original),levels:r.levels.map(triangles)}:null;}

export const characterDetailReport=()=>report;
