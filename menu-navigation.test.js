import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./main.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const noop=()=>{};

function fixture(mode='paused'){
 const nodes=new Map(),listeners={},events=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,value:'',click(){this.onclick?.();}});return nodes.get(id);};
 const ctx=vm.createContext({mode,settings:{volume:.4,voiceVolume:.8,sensitivity:1,quality:'standard'},
  music:{director:{status:'ready'},effect:noop,pause:noop,resume(){events.push('resume');}},
  $:id=>id==='closeAbout'||(id==='closeSettings'&&ctx.view!=='settings')?null:node(id),clearInput:noop,saveRun:noop,captureView:noop,
  showDialog:(html,variant)=>{ctx.view=variant;node('modal').hidden=false;},hideDialog:()=>{node('modal').hidden=true;},
  keys:{},addEventListener:(type,fn)=>listeners[type]=fn,document:{body:{classList:{toggle:noop}}}});
 vm.runInContext(section('function togglePause(){',"$('pauseButton').onclick")+'\n'+section("function settingsDialog(back='menu'){","$('controlHelp').onclick")+'\n'+source.split('\n').find(s=>s.startsWith('function navigateBack(){'))+'\n'+source.split('\n').find(s=>s.startsWith("addEventListener('keydown',e=>{const typing=")),ctx);
 return{ctx,node,events,key:(code,tagName='BODY',repeat=false)=>{let prevented=false;listeners.keydown({code,target:{tagName},repeat,preventDefault(){prevented=true;}});return prevented;}};
}

test('Escape from paused settings returns to pause without resuming, including focused controls',()=>{
 for(const tag of ['BODY','INPUT','SELECT']){
  const f=fixture();vm.runInContext("settingsDialog('paused')",f.ctx);
  assert.equal(f.key('Escape',tag),true);assert.equal(f.ctx.mode,'paused');assert.equal(f.ctx.view,'pause');
  assert.deepEqual(f.events,[]);assert.equal(f.node('modal').hidden,false);
  f.key('Escape');assert.equal(f.ctx.mode,'playing');assert.equal(f.node('modal').hidden,true);assert.deepEqual(f.events,['resume']);
 }
});

test('Escape closes main menu settings; held Escape cannot immediately unpause',()=>{
 const f=fixture('menu');vm.runInContext('settingsDialog()',f.ctx);f.key('Escape','INPUT');
 assert.equal(f.ctx.mode,'menu');assert.equal(f.node('modal').hidden,true);
 f.ctx.mode='paused';vm.runInContext("settingsDialog('paused')",f.ctx);f.key('Escape');f.key('Escape','BODY',true);
 assert.equal(f.ctx.mode,'paused');assert.deepEqual(f.events,[]);
});

test('P respects the settings back action while text controls keep their own input',()=>{
 const f=fixture();vm.runInContext("settingsDialog('paused')",f.ctx);
 f.key('KeyP','INPUT');assert.equal(f.ctx.view,'settings');
 f.key('KeyP');assert.equal(f.ctx.mode,'paused');assert.equal(f.ctx.view,'pause');assert.deepEqual(f.events,[]);
});
