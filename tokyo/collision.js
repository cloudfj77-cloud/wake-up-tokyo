import * as T from 'three';
import {Capsule} from 'three/addons/math/Capsule.js';
import {Octree} from 'three/addons/math/Octree.js';

// Index source instances, not the duplicated render batches. Triangle work stays local to the player.
export class WalkCollision {
 constructor(root){
  this.cells=new Map();this.cellSize=4;this.narrow=new Octree();root.updateMatrixWorld(true);
  const instance=new T.Matrix4(),matrix=new T.Matrix4();
  const visit=o=>{
   if(o.userData.walkThrough||o.name==='04_Access_Guides'||o.name==='Render_Batches_Exclude_From_Export')return;
   if(o.isMesh&&!o.isBatchedMesh){
    const geometry=o.geometry;if(!geometry.boundingBox)geometry.computeBoundingBox();
    for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
     if(o.isInstancedMesh){o.getMatrixAt(i,instance);matrix.multiplyMatrices(o.matrixWorld,instance);}else matrix.copy(o.matrixWorld);
     const item={geometry,matrix:matrix.clone(),bounds:geometry.boundingBox.clone().applyMatrix4(matrix),triangles:null};
     this.forCells(item.bounds,key=>{if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(item);});
    }
   }
   o.children.forEach(visit);
  };visit(root);
 }
 // 三维小网格将地铁、广场和街面分开；不能每次迈步都扫描同一大格里所有楼层的物体。
 forCells(box,fn){const s=this.cellSize;for(let x=Math.floor(box.min.x/s);x<=Math.floor(box.max.x/s);x++)for(let y=Math.floor(box.min.y/s);y<=Math.floor(box.max.y/s);y++)for(let z=Math.floor(box.min.z/s);z<=Math.floor(box.max.z/s);z++)fn(x+','+y+','+z);}
 candidates(box){const found=new Set();this.forCells(box,key=>{for(const item of this.cells.get(key)||[])if(item.bounds.intersectsBox(box))found.add(item);});return found;}
 triangles(item){
  if(!item.triangles){
   const {geometry:g,matrix:m}=item,p=g.attributes.position,index=g.index;item.triangles=[];item.floors=[];const normal=new T.Vector3();
   // 静态三角面的朝向只计算一次，落脚射线直接查可站立的面。
   for(let i=0;i<(index?.count||p.count);i+=3){const v=j=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(m),triangle=new T.Triangle(v(0),v(1),v(2));item.triangles.push(triangle);if(triangle.getNormal(normal).y>=.55)item.floors.push(triangle);}
  }return item.triangles;
 }
 raycast(origin,direction,distance,floorOnly=false){
  const end=origin.clone().addScaledVector(direction,distance),box=new T.Box3().setFromPoints([origin,end]).expandByScalar(.001),ray=new T.Ray(origin,direction),point=new T.Vector3();let result=null;
  for(const item of this.candidates(box)){
   if(!ray.intersectsBox(item.bounds))continue;
   const triangles=this.triangles(item);
   for(const triangle of floorOnly?item.floors:triangles){
    if(ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,point)){
     const d=point.distanceTo(origin);if(d<=distance&&(!result||d<result.distance)){const normal=triangle.getNormal(new T.Vector3());if(normal.dot(direction)>0)normal.negate();result={point:point.clone(),distance:d,normal,geometry:item.geometry,matrix:item.matrix};}
    }
   }
  }return result;
 }
 resolve(capsule){
  for(let iteration=0;iteration<3;iteration++){
   const box=new T.Box3().setFromPoints([capsule.start,capsule.end]).expandByScalar(capsule.radius);let changed=false;
   for(const item of this.candidates(box))for(const triangle of this.triangles(item)){
    const hit=this.narrow.triangleCapsuleIntersect(capsule,triangle);
    if(hit&&hit.depth>1e-5){capsule.translate(hit.normal.multiplyScalar(hit.depth+1e-5));changed=true;}
   }
   if(!changed)break;
  }
 }
}

