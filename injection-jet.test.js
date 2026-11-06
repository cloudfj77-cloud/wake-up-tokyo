import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createInjectionJet,updateInjectionJet,createInjectionSplash,updateInjectionSplash,disposeInjectionEffect} from './injection-jet.js';
test('purple juice uses round drops and follows the travelled path instead of a rigid cone',()=>{
 const a=createInjectionJet(0,1,0),b=createInjectionJet(0,1,0);assert.equal(a.children[0].geometry,b.children[0].geometry);assert.equal(a.children[0].material,b.children[0].material);assert.ok(a.children[0].isInstancedMesh);assert.equal(a.children[0].material.transparent,false);
 for(let i=1;i<80;i++){a.position.set(Math.sin(i*.03),1+i*.01,i*.1);updateInjectionJet(a,.016);}assert.equal(a.userData.fluid.count,48);assert.ok(a.children[0].count<=96);const matrix=new T.Matrix4();a.children[0].getMatrixAt(30,matrix);assert.ok(matrix.elements.every(Number.isFinite));assert.ok(a.children[0].count>8);disposeInjectionEffect(a);updateInjectionJet(b,.016);
});
test('wet impact splashes shrink to nothing and share their fixed resources',()=>{
 const a=createInjectionSplash(1,2,3);updateInjectionSplash(a,.12);const m=new T.Matrix4();a.children[0].getMatrixAt(0,m);assert.ok(m.elements[13]>0);updateInjectionSplash(a,.32);a.children[0].getMatrixAt(0,m);assert.equal(new T.Vector3().setFromMatrixScale(m).length(),0);disposeInjectionEffect(a);
});
