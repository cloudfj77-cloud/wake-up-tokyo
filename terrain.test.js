import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bridgeDeckHeight,hitsBridgeRail} from './riverside-world.js';
const t=JSON.parse(readFileSync(new URL('./assets/scenes/terrain.json',import.meta.url)));
const cell=(x,z)=>Math.round((z-t.minZ)/t.step)*t.size+Math.round((x-t.minX)/t.step);
test('river is impassable while both bridge decks and mission approaches have ground',()=>{
 assert.equal(t.heights[cell(0,0)],-99);
 for(const [x,z] of [[0,26.4],[0,-15.4],[-12,32],[-35,14],[34,-12],[12,-52]]){assert.ok(t.heights[cell(x,z)]>-2);assert.equal(t.blocked[cell(x,z)],0);}
});
test('both banks and all mission approaches share connected terrain',()=>{
 const seen=new Set([cell(-12,32)]),queue=[cell(-12,32)];
 for(let i=0;i<queue.length;i++){const k=queue[i],x=k%t.size,z=Math.floor(k/t.size);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,n=nz*t.size+nx;if(nx<0||nz<0||nx>=t.size||nz>=t.size||seen.has(n)||t.heights[n]<-2||t.blocked[n])continue;seen.add(n);queue.push(n);}}
 for(const p of [[0,26.4],[0,-15.4],[-35,14],[34,-12],[12,-52]])assert.ok(seen.has(cell(...p)),`${p} must be reachable`);
});
test('bridge centers and entrances stay open while both side rails block actors',()=>{
 // 玩家可以从桥头进入并走在正中间，但不能穿过左右护栏掉入河中。
 for(const bridgeZ of [26.4,-15.4]){
  assert.equal(bridgeDeckHeight(0,bridgeZ),.755);
  assert.equal(bridgeDeckHeight(14,bridgeZ+1.7),.755);
  assert.equal(bridgeDeckHeight(0,bridgeZ+2),null);
  assert.equal(hitsBridgeRail(0,bridgeZ,.34),false);
  assert.equal(hitsBridgeRail(0,bridgeZ-2.05,.34),true);
  assert.equal(hitsBridgeRail(0,bridgeZ+2.05,.34),true);
  assert.equal(hitsBridgeRail(14.5,bridgeZ+2.05,.34),false);
 }
});
