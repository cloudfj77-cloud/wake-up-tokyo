// Run alongside the original city project to validate the bake against actual triangles.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildScene} from '../../../tokyo-whitebox-three/scene.mjs';
import {applyDistrictLook} from '../../../tokyo-whitebox-three/district-look.mjs';
import {WalkCollision} from '../../tokyo/collision.js';
import {createTokyoNavigation} from '../../tokyo/navigation.js';
import {createTokyoPopulation,TUTORIAL_LAYOUT} from '../../tokyo/gameplay.js';
const world=buildScene();applyDistrictLook(world);world.root.scale.setScalar(.55);world.root.position.set(11,3.3,-28.6);
const data=JSON.parse(readFileSync(new URL('../../assets/scenes/tokyo-navigation.json',import.meta.url))),nav=createTokyoNavigation(data,new WalkCollision(world.root));
const point=p=>({x:(p[0]+20)*.55,z:(p[2]-52)*.55,floorY:(p[1]+6)*.55});
const tutorial=[TUTORIAL_LAYOUT.spawn,TUTORIAL_LAYOUT.move,TUTORIAL_LAYOUT.worker,...TUTORIAL_LAYOUT.exit].map(([x,z,y])=>nav.nearest(x,z,.25,y));
for(let i=0;i<tutorial.length;i++){
 console.log('tutorial',i,tutorial[i]);
 if(i)assert.ok(nav.clear(tutorial[i-1],tutorial[i]),'tutorial segment '+i+' blocked');
}
const population=createTokyoPopulation(nav);
console.log('physical population candidates',Object.fromEntries(['plaza','hall','platform'].map(zone=>[zone,population.spots.filter(p=>p.zone===zone).length])));
for(const stair of data.stairs){
 for(const [aa,bb]of [[stair.a,stair.b],[stair.b,stair.a]]){
  const a=point(aa),b=point(bb);let u={...a};const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.06);
  for(let i=1;i<=n;i++){
   const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n;
   assert.ok(nav.canMove(u,x,z),stair.name+': '+JSON.stringify({u,x,z}));
   u={x,z,floorY:nav.heightAt(x,z,u.floorY)};
  }
  assert.ok(Math.abs(u.floorY-b.floorY)<.2,stair.name+' wrong landing');
 }
 console.log(stair.name+': both directions / triangle collisions OK');
}
