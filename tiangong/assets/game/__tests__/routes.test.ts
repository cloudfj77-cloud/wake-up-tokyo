import assert from 'node:assert/strict';
import {test} from 'vitest';
import {RouteGrid} from '../routes.ts';
const encode=(v:Float32Array|Uint32Array)=>Buffer.from(v.buffer).toString('base64');
test('small graphs cap the public search budget to their actual node count',()=>{const graph=new RouteGrid({kind:'wakeup-routes',step:1,bounds:{minX:0,minZ:0},positions:encode(new Float32Array([0,0,0,0,0,1,0,0,2])),edges:encode(new Uint32Array([0,1,1,0,1,2,2,1]))});const route=graph.path({x:0,z:0,floorY:0},{x:0,z:2,floorY:0});assert.equal(route.length,2);assert.equal(route.at(-1)?.z,2);});
