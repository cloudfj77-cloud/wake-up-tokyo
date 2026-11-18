import assert from 'node:assert/strict';
import {test} from 'vitest';
import type {EntityHandle,World} from '@forgeax/engine/ecs';
import {actorPose,CharacterVisual,type ModelName} from '../character.ts';
import {FULL_ASSETS} from '../asset-refs.ts';

function character(model:ModelName) {
 const clips=Object.keys(FULL_ASSETS[model].clips);
 const animation={times:clips.map(()=>0),looping:false};
 const world={
  get:()=>({ok:false,unwrap:()=>animation}),
  set:(_entity:unknown,_component:unknown,patch:object)=>{
   Object.assign(animation,patch);
   return {unwrap:()=>undefined};
  },
 } as unknown as World;
 return {visual:new CharacterVisual(world,1 as EntityHandle,model,clips,clips.length),animation,clips};
}

test('an ending hit window does not rewind the swing, but a new swing starts from zero',()=>{
 const {visual,animation,clips}=character('player');
 const swing=clips.indexOf('flurry');
 visual.update(.016,'flurry',0,true,1);
 animation.times[swing]=.2;

 visual.update(.016,'idle',0,true,0);
 assert.equal(visual.action,'flurry');
 assert.equal(animation.times[swing],.2);

 visual.update(.016,'flurry',0,true,2);
 assert.equal(animation.times[swing],0);
});

test('a moving ranged unit without a strafe clip uses its walk animation',()=>{
 const {visual,animation}=character('shield-cop');
 const unit={type:2,visualMoving:true,groundSpeed:1.2};
 visual.update(.016,actorPose(unit,true),unit.groundSpeed);
 assert.equal(visual.action,'walk');
 assert.equal(animation.looping,true);
});
