import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {isTouchDevice} from './touch-controls.js';
import {batchStaticScene} from './tokyo/render-batches.js';

let serial=0;
async function profile(search,agent='Android',coarse=true,native=false){
 const environment={window:{},location:{search},navigator:{userAgent:agent},matchMedia:()=>({matches:coarse}),Capacitor:{isNativePlatform:()=>native}};
 const previous=new Map(Object.keys(environment).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 try{
  for(const[key,value]of Object.entries(environment))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  const device=await import(new URL(`./device.js?case=${serial++}`,import.meta.url));
  return{...device,touch:isTouchDevice()};
 }finally{
  for(const[key,descriptor]of previous)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
 }
}

test('explicit quality overrides win over mobile detection without changing input mode',async()=>{
 for(const[search,low,quality]of [['?lowspec=0',false,'standard'],['?lowspec=1',true,'low'],['?mobile=0',false,'standard'],['?lowspec=0&mobile=1',false,'standard']]){
  const p=await profile(search);assert.equal(p.LOW_SPEC,low,search);assert.equal(p.FORCED_QUALITY,quality,search);assert.equal(p.touch,true,search);
 }
 const desktop=await profile('?lowspec=1','desktop',false);assert.equal(desktop.LOW_SPEC,true);assert.equal(desktop.touch,false);
 const keyboard=await profile('?touch=0&lowspec=0');assert.equal(keyboard.LOW_SPEC,false);assert.equal(keyboard.touch,false);
});

test('automatic quality includes coarse and native devices while desktops stay full quality',async()=>{
 assert.equal((await profile('','desktop',false)).LOW_SPEC,false);
 assert.equal((await profile('','Macintosh',true)).LOW_SPEC,true);
 assert.equal((await profile('','desktop',false,true)).LOW_SPEC,true);
 assert.equal((await profile('','desktop',false)).FORCED_QUALITY,null);
});

function extractFunction(text,name){
 const start=text.indexOf('function '+name+'(');assert.ok(start>=0,name);
 let end=text.indexOf('{',start),depth=1;
 while(depth&&++end<text.length){if(text[end]==='{')depth++;else if(text[end]==='}')depth--;}
 return text.slice(start,end+1);
}
const vendor=readFileSync(new URL('./vendor/tidewater-package.js',import.meta.url),'utf8');
const editable=readFileSync(new URL('./tidewater-world.js',import.meta.url),'utf8');
function tidewaterVisible(config,distance,mode,bundled){
 const mesh={visible:true},chunk={mesh,center:new T.Vector3(0,0,-distance),radius:0};
 const scene={fog:{near:16,far:52}},position=new T.Vector3();
 const ctx=vm.createContext({LOW_SPEC_RENDER:config,j:scene,scene,gChunks:[chunk],chunks:[chunk],position});
 vm.runInContext(extractFunction(bundled?vendor:editable,bundled?'gApply':'applyChunks')+`;${bundled?'gApply':'applyChunks'}(position,'${mode}')`,ctx);
 return mesh.visible;
}
function tokyoVisible(config,distance,outline){
 const root=new T.Group(),section=new T.Group();root.add(section);
 const m=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial());m.position.z=-distance;section.add(m);
 const api=batchStaticScene(root,{...config,fog:new T.Fog(0,16,52)}),position=new T.Vector3();
 api.updateDetailVisibility(position);if(outline)api.updateOutlineVisibility(position);
 let visible=false;root.traverse(o=>{if(o.name==='Static_Material_Batch')visible=o.visible&&o.getVisibleAt(0);});
 return visible;
}
test('Tokyo and both Tidewater loaders share full/low main and outline ranges on Android',async()=>{
 for(const forced of ['0','1']){
  const {LOW_SPEC_RENDER:config}=await profile('?lowspec='+forced),full=forced==='0';
  for(const[distance,mode]of [[57,'main'],[24,'outline']]){
   assert.equal(tokyoVisible(config,distance,mode==='outline'),full,`Tokyo ${mode} ${forced}`);
   for(const bundled of [true,false])assert.equal(tidewaterVisible(config,distance,mode,bundled),full,`Tidewater ${bundled?'bundle':'source'} ${mode} ${forced}`);
  }
 }
});

test('startup quality overrides cached graphics while preserving unrelated saved preferences',()=>{
 const main=readFileSync(new URL('./main.js',import.meta.url),'utf8');
 const load=main.split('\n').find(line=>line.startsWith('try{settings='));
 const override=main.split('\n').find(line=>line.startsWith('if(FORCED_QUALITY)'));
 for(const[forced,cached,expected]of [['standard','low','standard'],['low','standard','low'],[null,'standard','standard']]){
  const ctx=vm.createContext({settings:{quality:'low',volume:.4},FORCED_QUALITY:forced,localStorage:{getItem:()=>JSON.stringify({quality:cached,sensitivity:1.7})}});
  vm.runInContext(load+'\n'+override,ctx);
  assert.equal(ctx.settings.quality,expected);assert.equal(ctx.settings.volume,.4);assert.equal(ctx.settings.sensitivity,1.7);
 }
});
