import test from 'node:test';
import assert from 'node:assert/strict';
import {makeState} from './rules.js';
import {MISSIONS,TUTORIAL_STEPS,advanceMission,missionView,recordTutorialAction,skipTutorial,tutorialStep} from './missions.js';

test('tutorial accepts only the action requested by the current step',()=>{
 const state=makeState();
 assert.equal(tutorialStep(state).action,'move');
 assert.equal(recordTutorialAction(state,'shoot').changed,false);
 recordTutorialAction(state,'move',2);
 assert.equal(state.tutorialStep,0);
 const result=recordTutorialAction(state,'move',1);
 assert.equal(result.advanced,true);
 assert.equal(tutorialStep(state).action,'look');
});

test('all guided actions complete the tutorial in order',()=>{
 const state=makeState();
 for(const step of TUTORIAL_STEPS){const result=recordTutorialAction(state,step.action,step.target);assert.equal(result.advanced,true);}
 assert.equal(state.tutorialDone,true);
 assert.equal(tutorialStep(state),null);
});

test('tutorial can be skipped without changing main mission progress',()=>{
 const state=makeState();skipTutorial(state);
 assert.equal(state.tutorialDone,true);
 assert.equal(state.tutorialSkipped,true);
 assert.equal(state.mission,0);
});

test('mission view exposes each objective and advances rewards only once',()=>{
 const state=makeState();state.tutorialDone=true;state.infected=3;
 const first=missionView(state);
 assert.equal(first.title,MISSIONS[0].title);
 assert.equal(first.objectives[0].value,3);
 assert.equal(first.done,true);
 const completed=advanceMission(state);
 assert.equal(completed.reward.ammo,24);
 assert.equal(state.mission,1);
 assert.equal(advanceMission(state),null);
});

test('boss mission remains locked behind all four city objectives',()=>{
 const state=makeState();state.tutorialDone=true;state.infected=40;state.towers=3;state.highestEnemy=5;
 for(let i=0;i<4;i++)assert.ok(advanceMission(state));
 assert.equal(state.mission,4);
 assert.equal(missionView(state).done,false);
 state.bossDefeated=true;
 assert.equal(missionView(state).done,true);
});

test('third destroyed hub completes the final city objective without an infection quota',()=>{
 const state=makeState();state.mission=3;state.infected=0;state.towers=3;
 assert.equal(missionView(state).done,true);
 assert.ok(advanceMission(state));
 assert.equal(state.mission,4);
});
