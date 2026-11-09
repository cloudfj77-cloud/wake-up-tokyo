import assert from 'node:assert/strict';
import {test} from 'vitest';
import {visibleActors} from '../actor-visibility.ts';
test('large crowds retain their simulation but admit only the nearest visible model budget',()=>{const units=Array.from({length:500},(_,id)=>({id,x:0,z:2+id*.02,floorY:0,converted:true}));const view={eye:[0,1,-2],target:[0,1,2]};const shown=visibleActors([...units,{id:900,x:0,z:-15,floorY:0,converted:false}],{x:0,z:0},view,16/9,72);assert.equal(shown.length,72);assert.equal(shown[0].id,0);assert.equal(shown.at(-1).id,71);assert.equal(units.length,500);assert.equal(visibleActors(units,{x:0,z:0},view,16/9,18).length,18);});
