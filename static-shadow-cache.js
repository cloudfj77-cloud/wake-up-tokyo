import * as T from 'three';

// 静态街区的深度阴影只烘焙一次；每帧将颜色和深度一起还原，再照常绘制人物阴影。
// 这里只改绘制过程，不参与人物的模拟、碰撞、寻路和攻击。
export function installStaticShadowCache(renderer,scene,light,world){
 const shadowMap=renderer.shadowMap,native=shadowMap.render;
 const quadScene=new T.Scene(),quadCamera=new T.Camera();
 const material=new T.ShaderMaterial({
  uniforms:{cached:{value:null}},depthTest:true,depthWrite:true,depthFunc:T.AlwaysDepth,blending:T.NoBlending,toneMapped:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:'#include <packing>\nuniform sampler2D cached;varying vec2 vUv;void main(){vec4 packed=texture2D(cached,vUv);gl_FragColor=packed;gl_FragDepth=min(1.0,unpackRGBAToDepth(packed));}'
 });
 quadScene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
 let texture=null,revision='',busy=false,bakes=0,seeds=0;
 const roots=()=>[world.root,...world.destructibles.filter(o=>!o.dead).map(o=>o.g)].filter(Boolean);
 function key(){const c=light.shadow.camera;return [renderer.shadowMap.type,...light.matrixWorld.elements,...light.target.matrixWorld.elements,light.shadow.mapSize.x,light.shadow.mapSize.y,c.left,c.right,c.top,c.bottom,c.near,c.far,world.destructibles.length,...world.destructibles.map(o=>Number(!!o.dead))].join(',');}
 function bake(lights,camera,staticRoots){
  const statics=new Set(),hidden=[];
  for(const root of staticRoots)root.traverse(o=>{if(o.isMesh)statics.add(o);});
  scene.traverse(o=>{if(o.isMesh&&o.castShadow&&!statics.has(o)){hidden.push(o);o.castShadow=false;}});
  try{native.call(shadowMap,lights,scene,camera);}finally{for(const o of hidden)o.castShadow=true;}
  const map=light.shadow.map;if(!map)return false;
  if(!texture||texture.image.width!==map.width||texture.image.height!==map.height){texture?.dispose();texture=new T.FramebufferTexture(map.width,map.height);texture.generateMipmaps=false;}
  const target=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),level=renderer.getActiveMipmapLevel();
  try{renderer.setRenderTarget(map);renderer.copyFramebufferToTexture(texture);}finally{renderer.setRenderTarget(target,face,level);}
  material.uniforms.cached.value=texture;bakes++;return true;
 }
 function seed(){
  const autoClear=renderer.autoClear,autoReset=renderer.info.autoReset;renderer.autoClear=false;renderer.info.autoReset=false;busy=true;
  try{renderer.render(quadScene,quadCamera);seeds++;}finally{busy=false;renderer.autoClear=autoClear;renderer.info.autoReset=autoReset;}
 }
 shadowMap.render=function(lights,currentScene,camera){
  if(busy||currentScene!==scene||!shadowMap.enabled||(!shadowMap.autoUpdate&&!shadowMap.needsUpdate)||lights.length!==1||lights[0]!==light||shadowMap.type===T.VSMShadowMap)return native.call(this,lights,currentScene,camera);
  const next=key(),staticRoots=roots();
  if(!texture||next!==revision){if(!bake(lights,camera,staticRoots))return;revision=next;}
  const visibility=staticRoots.map(root=>root.visible),clear=renderer.clear;let seeded=false;
  // 还原深度附件后，动态人物仍使用原来的深度测试，不能穿过建筑投影或留下旧影子。
  renderer.clear=function(...args){clear.apply(renderer,args);if(!seeded&&renderer.getRenderTarget()===light.shadow.map){seeded=true;seed();}};
  for(const root of staticRoots)root.visible=false;
  try{return native.call(this,lights,currentScene,camera);}finally{renderer.clear=clear;staticRoots.forEach((root,i)=>{root.visible=visibility[i];});}
 };
 return {invalidate(){revision='';},diagnostics:()=>({bakes,seeds}),dispose(){shadowMap.render=native;texture?.dispose();material.dispose();quadScene.children[0].geometry.dispose();}};
}
