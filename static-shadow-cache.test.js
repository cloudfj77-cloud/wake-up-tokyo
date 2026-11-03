import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {installStaticShadowCache} from './static-shadow-cache.js';

// 模拟 Three 的阴影清屏和递归绘制，检查静态缓存、动态重画以及失败后的状态恢复。
function fixture(){
 const scene=new T.Scene(),root=new T.Group(),tower=new T.Group(),actor=new T.Group(),light=new T.DirectionalLight();scene.add(root,tower,actor,light);
 for(const [parent,name]of [[root,'building'],[tower,'tower'],[actor,'actor']]){const mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());mesh.name=name;mesh.castShadow=true;parent.add(mesh);}
 const world={root,destructibles:[{g:tower,dead:false}]},draws=[];let target={name:'color'},fail=false;
 const map={width:16,height:16},clear=()=>{};
 const renderer={shadowMap:{enabled:true,autoUpdate:true,needsUpdate:false,type:T.PCFSoftShadowMap},info:{autoReset:true},autoClear:true,clear,getRenderTarget:()=>target,getActiveCubeFace:()=>0,getActiveMipmapLevel:()=>0,setRenderTarget:t=>{target=t;},copyFramebufferToTexture(){draws.push('cache');},render(){draws.push('seed');if(fail)throw Error('seed failed');}};
 renderer.shadowMap.render=function(lights,s){if(!lights.length)return;const before=target;light.shadow.map=map;target=map;renderer.clear();const casters=[];s.traverseVisible(o=>{if(o.isMesh&&o.castShadow)casters.push(o.name);});draws.push(casters);target=before;};
 const original=renderer.shadowMap.render,cache=installStaticShadowCache(renderer,scene,light,world);
 return {renderer,scene,root,tower,actor,world,light,draws,clear,original,cache,setFail:value=>{fail=value;}};
}
test('cached static shadows are seeded with depth while moving actors redraw every frame',()=>{
 const f=fixture(),camera=new T.Camera();f.renderer.shadowMap.render([f.light],f.scene,camera);f.actor.position.x=4;f.renderer.shadowMap.render([f.light],f.scene,camera);
 assert.deepEqual(f.draws,[['building','tower'],'cache','seed',['actor'],'seed',['actor']]);assert.deepEqual(f.cache.diagnostics(),{bakes:1,seeds:2});
 assert.equal(f.root.visible,true);assert.equal(f.tower.visible,true);assert.equal(f.actor.children[0].castShadow,true);assert.equal(f.renderer.clear,f.clear);
 f.world.destructibles[0].dead=true;f.tower.visible=false;f.renderer.shadowMap.render([f.light],f.scene,camera);assert.equal(f.cache.diagnostics().bakes,2);assert.equal(f.tower.visible,false);
 f.cache.dispose();assert.equal(f.renderer.shadowMap.render,f.original);
});
test('shadow copy failures restore scene visibility, clear method and renderer flags',()=>{
 const f=fixture();f.renderer.shadowMap.render([f.light],f.scene,new T.Camera());f.setFail(true);
 assert.throws(()=>f.renderer.shadowMap.render([f.light],f.scene,new T.Camera()),/seed failed/);
 assert.equal(f.root.visible,true);assert.equal(f.tower.visible,true);assert.equal(f.renderer.clear,f.clear);assert.equal(f.renderer.autoClear,true);assert.equal(f.renderer.info.autoReset,true);
 f.cache.dispose();
});
