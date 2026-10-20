import * as T from 'three';
import {Capsule} from 'three/addons/math/Capsule.js';
import {Octree} from 'three/addons/math/Octree.js';

// Index source instances, not the duplicated render batches. Triangle work stays local to the player.
export class WalkCollision {
 constructor(root){
  this.cells=new Map();this.narrow=new Octree();root.updateMatrixWorld(true);
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
 forCells(box,fn){for(let x=Math.floor(box.min.x/10);x<=Math.floor(box.max.x/10);x++)for(let z=Math.floor(box.min.z/10);z<=Math.floor(box.max.z/10);z++)fn(x+','+z);}
 candidates(box){const found=new Set();this.forCells(box,key=>{for(const item of this.cells.get(key)||[])if(item.bounds.intersectsBox(box))found.add(item);});return found;}
 triangles(item){
  if(!item.triangles){
   const {geometry:g,matrix:m}=item,p=g.attributes.position,index=g.index;item.triangles=[];
   for(let i=0;i<(index?.count||p.count);i+=3){const v=j=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(m);item.triangles.push(new T.Triangle(v(0),v(1),v(2)));}
  }return item.triangles;
 }
 raycast(origin,direction,distance,floorOnly=false){
  const end=origin.clone().addScaledVector(direction,distance),box=new T.Box3().setFromPoints([origin,end]).expandByScalar(.001),ray=new T.Ray(origin,direction),point=new T.Vector3(),normal=new T.Vector3();let result=null;
  for(const item of this.candidates(box)){
   if(!ray.intersectsBox(item.bounds))continue;
   for(const triangle of this.triangles(item)){
    if(floorOnly&&triangle.getNormal(normal).y<.55)continue;
    if(ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,point)){
     const d=point.distanceTo(origin);if(d<=distance&&(!result||d<result.distance))result={point:point.clone(),distance:d};
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

