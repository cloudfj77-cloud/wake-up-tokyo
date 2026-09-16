import test from 'node:test';
import assert from 'node:assert/strict';
import {makeState} from './rules.js';
import {MISSIONS,advanceMission,missionView} from './missions.js';

test('mission view exposes each objective and advances rewards only once',()=>{
 const state=makeState();state.infected=3;
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
 const state=makeState();state.infected=40;state.towers=2;state.highestEnemy=5;
 for(let i=0;i<4;i++)assert.ok(advanceMission(state));
 assert.equal(state.mission,4);
 assert.equal(missionView(state).done,false);
 state.bossDefeated=true;
 assert.equal(missionView(state).done,true);
});

test('second destroyed hub completes the final city objective without an infection quota',()=>{
 const state=makeState();state.mission=3;state.infected=0;state.towers=2;
 assert.equal(missionView(state).done,true);
 assert.ok(advanceMission(state));
 assert.equal(state.mission,4);
});
