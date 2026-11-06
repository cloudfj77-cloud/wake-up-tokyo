import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {batchStaticScene} from './tokyo/render-batches.js';
import {OutlineFilter} from './outline-filter.js';

function setup(points,geometry=new T.BoxGeometry(1,1,1),options={}){
 const root=new T.Group(),section=new T.Group();root.add(section);
 const material=new T.MeshStandardMaterial();
 for(const [x,y,z] of points.length===1?[...points,...points]:points){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);section.add(m);}
 const fog=new T.Fog(0,5,100),api=batchStaticScene(root,{fog,cullPad:0,...options});
 const full=section.getObjectByName('Static_Material_Batch'),normal=section.getObjectByName('Static_Normal_Batch');
 return{api,full,normal,fog,root};
}
const camera=()=>{const c=new T.PerspectiveCamera(40,1,.1,300);c.updateMatrixWorld(true);return c;};
const visible=m=>Array.from({length:m.instanceCount},(_,i)=>m.getVisibleAt(i));
function update(s,c){s.api.updateDetailVisibility(c.position);s.api.updateVisibility(c);}

test('clustered rendering retains authored middle-distance geometry and only limits normals during the outline pass',()=>{
 const s=setup([[0,0,-5],[0,0,-20],[0,0,-150]],new T.SphereGeometry(1,10,8),{outlineFactor:.05}),c=camera();
 update(s,c);assert.deepEqual(visible(s.full),[true,true,false]);assert.deepEqual(visible(s.normal),[true,false,false]);
 assert.equal(s.root.getObjectByName('Static_LOD_Proxy'),undefined,'do not replace authored walls with box proxies');
 s.api.normalPass.begin();assert.equal(s.full.visible,false);s.api.normalPass.end();
 assert.equal(s.full.visible,true);assert.deepEqual(visible(s.full),[true,true,false]);
});
test('small turns accumulate until newly visible geometry is restored',()=>{
 const s=setup([[20,0,0]]),c=camera();update(s,c);assert.ok(visible(s.full).every(v=>!v));
 for(let i=1;i<=180;i++){c.rotation.y=-i*Math.PI/360;c.updateMatrixWorld(true);update(s,c);}
 assert.ok(visible(s.full).every(Boolean));
});
test('middle-distance low-poly walls and the near surface of a large floor remain visible',()=>{
 const c=camera(),wall=setup([[0,0,-30]]);update(wall,c);assert.ok(visible(wall.full).every(Boolean));
 const floor=setup([[0,-1,-180]],new T.BoxGeometry(100,1,400));update(floor,c);assert.ok(visible(floor.full).every(Boolean));
});
test('projection and fog changes invalidate visibility without moving the camera',()=>{
 const c=camera(),s=setup([[12,0,-20]]);update(s,c);assert.ok(visible(s.full).every(v=>!v));
 c.fov=100;c.updateProjectionMatrix();update(s,c);assert.ok(visible(s.full).every(Boolean));
 const far=setup([[0,0,-30]]);update(far,c);assert.ok(visible(far.full).every(Boolean));
 far.fog.near=1;far.fog.far=2;update(far,c);assert.ok(visible(far.full).every(v=>!v));
});
function passFixture(fail=false){
 const scene=new T.Scene(),mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial({transparent:true}));scene.add(mesh);
 const color={texture:{}},normal={texture:{}},passes=[];let target,detail=true;
 const filter={color,normal,normalMaterial:{},lines:false,resize(){},renderer:{shadowMap:{autoUpdate:true,needsUpdate:true},getDrawingBufferSize:v=>v.set(10,10),setRenderTarget:t=>{target=t;},render(){passes.push({target,detail,transparent:mesh.visible});if(fail&&target===normal)throw Error('normal failed');}}};
 const hooks={updateDetailVisibility(){detail=true;},updateOutlineVisibility(){detail=false;}};
 return{scene,mesh,filter,hooks,passes,getDetail:()=>detail};
}
test('Tidewater outline distance applies only to normals and color retains full visibility',()=>{
 const f=passFixture();const output=OutlineFilter.prototype.render.call(f.filter,f.scene,camera(),f.hooks);
 assert.equal(output,f.filter.color.texture);assert.deepEqual(f.passes.map(p=>p.detail),[true,false]);
 assert.deepEqual(f.passes.map(p=>p.transparent),[true,false]);assert.equal(f.getDetail(),true);assert.equal(f.mesh.visible,true);assert.equal(f.scene.overrideMaterial,null);
});
test('a failed normal pass restores transparency, shadow flags and world visibility',()=>{
 const f=passFixture(true);assert.throws(()=>OutlineFilter.prototype.render.call(f.filter,f.scene,camera(),f.hooks),/normal failed/);
 assert.equal(f.getDetail(),true);assert.equal(f.mesh.visible,true);assert.equal(f.scene.overrideMaterial,null);assert.deepEqual(f.filter.renderer.shadowMap,{autoUpdate:true,needsUpdate:true});
});
