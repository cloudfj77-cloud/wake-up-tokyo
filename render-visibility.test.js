import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {batchStaticScene} from './tokyo/render-batches.js';
import {OutlineFilter} from './outline-filter.js';

function setup(points,geometry=new T.BoxGeometry(1,1,1),options={}){
 const root=new T.Group(),section=new T.Group();root.add(section);
 const material=new T.MeshStandardMaterial();
 for(const [x,y,z] of points){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);section.add(m);}
 const fog=new T.Fog(0,5,100),api=batchStaticScene(root,{fog,lodMeters:10,cullMeters:100,...options});
 const full=[],proxies=[];root.traverse(o=>{if(o.name==='Static_Material_Batch')full.push(o);if(o.name==='Static_LOD_Proxy')proxies.push(o);});
 return{api,full,proxies,fog};
}
const camera=()=>{const c=new T.PerspectiveCamera(40,1,.1,300);c.updateMatrixWorld(true);return c;};
const visible=m=>Array.from({length:m.instanceCount},(_,i)=>m.getVisibleAt(i));

test('only middle-distance geometry uses a proxy; near and culled proxies stay hidden',()=>{
 const s=setup([[0,0,-5],[0,0,-20],[0,0,-150]],new T.SphereGeometry(1,10,8)),c=camera();
 s.api.updateDetailVisibility(c.position,c);
 assert.deepEqual(visible(s.proxies[0]),[false,true,false]);
 assert.deepEqual(visible(s.full[0]),[true,false,false]);
 s.api.updateOutlineVisibility(c.position);
 assert.equal(s.proxies[0].visible,false);
 s.api.updateDetailVisibility(c.position,c);
 assert.deepEqual(visible(s.proxies[0]),[false,true,false]);
});
test('small turns accumulate until newly visible geometry is restored',()=>{
 const s=setup([[20,0,0]],undefined,{lodMeters:100}),c=camera();
 s.api.updateDetailVisibility(c.position,c);assert.equal(s.full[0].visible,false);
 for(let i=1;i<=180;i++){c.rotation.y=-i*Math.PI/360;c.updateMatrixWorld(true);s.api.updateDetailVisibility(c.position,c);}
 assert.equal(s.full[0].visible,true);
});
test('middle-distance low-poly walls stay visible, and large floors are culled by their nearest surface',()=>{
 const c=camera(),wall=setup([[0,0,-30]]);
 wall.api.updateDetailVisibility(c.position,c);assert.equal(wall.full[0].visible,true);
 const floor=setup([[0,-1,-180]],new T.BoxGeometry(100,1,400));
 floor.api.updateDetailVisibility(c.position,c);assert.equal(floor.full[0].visible,true);
});
test('projection and fog changes invalidate visibility without moving the camera',()=>{
 const c=camera(),s=setup([[12,0,-20]],undefined,{lodMeters:100});
 s.api.updateDetailVisibility(c.position,c);assert.equal(s.full[0].visible,false);
 c.fov=100;c.updateProjectionMatrix();s.api.updateDetailVisibility(c.position,c);assert.equal(s.full[0].visible,true);
 const far=setup([[0,0,-30]],undefined,{lodMeters:undefined,cullMeters:undefined});
 far.api.updateDetailVisibility(c.position,c);assert.equal(far.full[0].visible,true);
 far.fog.near=1;far.fog.far=2;far.api.updateDetailVisibility(c.position,c);
 assert.equal(far.full[0].visible,false);
});
function passFixture(fail=false){
 const scene=new T.Scene(),mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial({transparent:true}));scene.add(mesh);
 const color={texture:{}},normal={texture:{}},passes=[];let target,detail=true;
 const filter={color,normal,normalMaterial:{},lines:false,resize(){},renderer:{getDrawingBufferSize:v=>v.set(10,10),setRenderTarget:t=>{target=t;},render(s){passes.push({target,detail,override:s.overrideMaterial,transparent:mesh.visible});if(fail&&target===normal)throw Error('normal failed');}}};
 const hooks={updateDetailVisibility(){detail=true;},updateOutlineVisibility(){detail=false;}};
 return{scene,mesh,filter,hooks,passes,getDetail:()=>detail};
}
test('outline distance applies only to normal pass; color and later rendering retain full visibility',()=>{
 const f=passFixture();const output=OutlineFilter.prototype.render.call(f.filter,f.scene,camera(),f.hooks);
 assert.equal(output,f.filter.color.texture);assert.deepEqual(f.passes.map(p=>p.detail),[true,false]);
 assert.deepEqual(f.passes.map(p=>p.transparent),[true,false]);assert.equal(f.getDetail(),true);assert.equal(f.mesh.visible,true);assert.equal(f.scene.overrideMaterial,null);
});
test('a failed normal pass restores materials, transparency and world visibility',()=>{
 const f=passFixture(true);assert.throws(()=>OutlineFilter.prototype.render.call(f.filter,f.scene,camera(),f.hooks),/normal failed/);
 assert.equal(f.getDetail(),true);assert.equal(f.mesh.visible,true);assert.equal(f.scene.overrideMaterial,null);
});
