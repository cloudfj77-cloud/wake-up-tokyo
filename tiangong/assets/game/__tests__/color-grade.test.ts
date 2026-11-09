import assert from 'node:assert/strict';
import {test} from 'vitest';
import {colorGradeTexture,gradeColor} from '../color-grade.ts';
import {halfFloat} from '@forgeax/engine/math';
test('native LUT meets the renderer half-float contract and preserves white',()=>{const a=colorGradeTexture();assert.equal(a.format,'rgba16float');assert.equal(a.colorSpace,'linear');assert.equal(a.shape.viewDimension,'3d');assert.equal(a.data.byteLength,32**3*8);const data=new DataView(a.data.buffer);assert.equal(halfFloat.f16ToF32(data.getUint16(a.data.length-2,true)),1);assert.deepEqual(gradeColor([1,1,1]),[1,1,1]);assert(gradeColor([.2,.1,.2]).every(x=>Number.isFinite(x)&&x>=0&&x<=1));});
