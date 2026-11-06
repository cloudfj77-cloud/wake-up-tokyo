import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./main.js',import.meta.url),'utf8').split('\n').find(line=>line.startsWith('function drawLabels()'));
function labels(units){
 const host={innerHTML:''};
 class Vector3{set(){return this;}project(){this.x=0;this.y=0;this.z=0;return this;}}
 const ctx=vm.createContext({units,mode:'playing',player:{x:0,z:0},target:null,distance:()=>2,world:{heightAt:()=>0},T:{Vector3},feedbackVisibility:{visible:()=>true},camera:{position:{}},combatBodyHeight:()=>1,innerWidth:1280,innerHeight:800,state:{abilities:{}},unitName:u=>u.name||'测试角色',$:()=>host});
 vm.runInContext(source+';drawLabels();',ctx);return host.innerHTML;
}
test('nearby friendly actors keep a health bar when they are not hurt',()=>{
 const html=labels([{id:1,kind:'ally',converted:true,type:1,hp:25,maxHp:100,hurt:0}]);
 assert.match(html,/unitLabel friendly/);assert.match(html,/友军/);assert.match(html,/width:25%/);assert.match(html,/class="health"/);
});
test('converted legacy records are labeled as friendly even if their old kind is human',()=>{
 const html=labels([{id:1,kind:'human',converted:true,type:0,hp:60,maxHp:100,hurt:0}]);assert.match(html,/友军/);assert.doesNotMatch(html,/unitLabel hostile/);
});
test('hostile patrols and neutral civilians have explicit, different faction labels',()=>{
 assert.match(labels([{id:1,kind:'guard',type:1,hp:50,maxHp:100,hurt:0}]),/敌方/);
 assert.match(labels([{id:2,kind:'human',type:0,hp:50,maxHp:100,hurt:0}]),/路人/);
});


test('a revivable friendly corpse keeps its countdown instead of showing a living health bar',()=>{
 const html=labels([{id:1,kind:'corpse',converted:true,type:1,hp:0,maxHp:100,hurt:0,corpseTime:5,threshold:50,infection:10}]);assert.match(html,/corpseLabel/);assert.doesNotMatch(html,/unitLabel friendly/);
});
