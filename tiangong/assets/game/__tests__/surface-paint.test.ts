import assert from 'node:assert/strict';
import {test} from 'vitest';
import {surfacePaintMatrix} from '../surface-paint.ts';
test('floor and wall splats face outward with a positive winding basis',()=>{for(const n of [[0,1,0],[0,0,-1],[1,0,0]]){const m=surfacePaintMatrix({point:[2,3,4],normal:n});const determinant=m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5]);assert(determinant>0);assert(m.slice(12,15).reduce((sum,v,i)=>sum+(v-[2,3,4][i])*n[i],0)>0);}});
