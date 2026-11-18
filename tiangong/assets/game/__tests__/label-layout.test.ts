import assert from 'node:assert/strict';
import {test} from 'vitest';
import {placeLabel} from '../label-layout.ts';
test('labels avoid a minimap, another label, and viewport edges',()=>{const minimap={left:1000,right:1270,top:10,bottom:240};assert.equal(placeLabel(1110,180,100,32,1280,720,[minimap]),null);assert.equal(placeLabel(10,100,100,32,1280,720,[]),null);const a=placeLabel(500,300,100,32,1280,720,[])!;const b=placeLabel(500,300,100,32,1280,720,[a.rect])!;assert(b.rect.bottom<a.rect.top);});
