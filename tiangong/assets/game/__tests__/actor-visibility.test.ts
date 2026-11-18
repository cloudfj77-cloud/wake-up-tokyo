import assert from 'node:assert/strict';
import {test} from 'vitest';
import {visibleActors} from '../actor-visibility.ts';
test('large crowds retain their simulation but admit only the nearest visible model budget',()=>{const units=Array.from({length:500},(_,id)=>({id,x:0,z:2+id*.02,floorY:0,converted:true}));const view={eye:[0,1,-2],target:[0,1,2],fov:64*Math.PI/180};const shown=visibleActors([...units,{id:900,x:0,z:-15,floorY:0,converted:false}],{x:0,z:0},view,16/9,72);assert.equal(shown.length,72);assert.equal(shown[0].id,0);assert.equal(shown.at(-1).id,71);assert.equal(units.length,500);assert.equal(visibleActors(units,{x:0,z:0},view,16/9,18).length,18);});

test('actors inside the wider camera view stay visible at its edges', () => {
 const view = {eye:[0,.5,0],target:[0,.5,1],fov:64*Math.PI/180};
 const edge = {id:1,x:20,z:20,floorY:0,converted:false};
 const offscreen = {...edge,id:2,x:25};
 const shown = visibleActors([edge,offscreen],{x:0,z:0},view,16/9,72);
 assert.deepEqual(shown.map(unit=>unit.id),[edge.id]);
});
