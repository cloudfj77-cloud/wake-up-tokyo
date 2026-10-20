import test from 'node:test';
import assert from 'node:assert/strict';
import {createObjectiveFeedback,completedObjectives} from './objective-feedback.js';
test('every tutorial and action completion celebrates once, then shows next objective; pause holds feedback',()=>{
 const state={time:0,infected:0,tokyoTutorial:{stage:0}},ui=createObjectiveFeedback();ui.reset(state);
 assert.equal(ui.update(state),null);
 for(const stage of [1,2,3]){
  state.tokyoTutorial.stage=stage;assert.equal(ui.update(state).id,`tutorial-${stage-1}`);assert.equal(ui.update(state).phase,'complete');
  state.time+=1.7;assert.equal(ui.update(state).phase,'next');state.time+=1.2;assert.equal(ui.update(state),null);
 }
 state.infected=15;assert.equal(ui.update(state).id,'gather');state.time+=2.9;assert.equal(ui.update(state).id,'expand');
 state.time+=2.9;assert.equal(ui.update(state),null);
});
test('restore establishes a baseline, missed weaken tasks never celebrate, multiple completions queue',()=>{
 const s={time:100,infected:15,tokyoTutorial:{stage:3},weakenTasks:{shield:true}},ui=createObjectiveFeedback();ui.reset(s);assert.equal(ui.update(s),null);
 s.weakenTasks.fire=true;s.weakenTasks.reinforce=true;assert.equal(ui.update(s).id,'fire');
 s.time+=3;assert.equal(ui.update(s).id,'reinforce');s.time+=3;assert.equal(ui.update(s),null);
 s.weakenTasks.closed=true;assert.equal(ui.update(s),null);
 s.bossDefeated=true;assert.equal(ui.update(s).id,'boss');
 assert.deepEqual(completedObjectives({weakenTasks:{closed:true}}).map(s=>s.id),['blockade']);
 ui.reset(s);assert.equal(ui.update(s),null);
});
