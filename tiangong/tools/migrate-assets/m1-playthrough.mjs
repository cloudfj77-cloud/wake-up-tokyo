import assert from 'node:assert/strict';
export default async function(play){
 const read='wakeup.sample';
 const benchmark=await play.step('steady completed frame window',async()=>{await play.wait(5000);return play.page.evaluate(async()=>{const api=globalThis.__forgeaxGameInspection;const a=api.renderer();const start=performance.now();await new Promise(r=>setTimeout(r,10000));const end=performance.now(),b=api.renderer();return {durationMs:end-start,completedFrames:b.execution.frame.completed-a.execution.frame.completed,completedFps:(b.execution.frame.completed-a.execution.frame.completed)*1000/(end-start),before:a,after:b,viewport:[innerWidth,innerHeight,devicePixelRatio]};});});
 const start=await play.step('spawn real cafe',async()=>{await play.screenshot('native-spawn');return play.state(read);});
 const walked=await play.step('walk and pick up',()=>play.keyboard.hold('KeyW',s=>s.equipped&&s.position[2]<start.position[2]-.4,{read}));
 await play.step('infect by three real shots',async()=>{await play.keyboard.hold('KeyJ',s=>s.converted>=1&&s.hits>=3,{read,timeoutMs:15000});await play.screenshot('native-infected');});
 await play.step('fourth shot consumes charged attack',()=>play.keyboard.hold('KeyJ',s=>s.empowered>=1,{read}));
 const roll=await play.step('moving roll',()=>play.keyboard.hold(['KeyD','Space'],s=>s.rolls>=1,{read}));
 await play.step('jump cancels roll immediately',async()=>{await play.keyboard.press('ShiftLeft');const s=await play.state(read);assert(s.jumps>0);assert(s.position[1]>roll.position[1]);});
 await play.step('roll cancels jump immediately',async()=>{await play.keyboard.press('Space');const s=await play.state(read);assert(s.rolls>=2);});
 await play.waitFor(s=>s.grounded,{read});await play.screenshot('native-after-actions');
 const final=await play.state(read);
 await play.reload();const reloaded=await play.state(read);assert.equal(reloaded.shots,0);await play.screenshot('native-reloaded');
 return {benchmark,start,walked,final,reloaded};
}
