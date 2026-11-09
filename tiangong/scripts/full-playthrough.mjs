import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export default async function(play){
 const read='wakeup.game';
 const menu=await play.step('native menu and full seaside map',async()=>{const s=await play.state(read);assert.equal(s.map,'tidewater');assert.equal(s.renderer,'native-webgpu');await play.screenshot('native-main-menu');return s;});
 await play.step('start and choose a real upgrade',async()=>{await play.page.locator('#start').click();await play.page.locator('.comicSkip').click();await play.waitFor(s=>s.mode==='upgrade',{read});await play.screenshot('native-upgrade-cards');await play.page.locator('[data-choice="0"]').click();await play.waitFor(s=>s.mode==='playing',{read});await play.page.locator('#modal').waitFor({state:'hidden'});await play.mouse.click([.5,.55]);});
 const start=await play.state(read);
 const walked=await play.step('move through native collision',async()=>{const trace=[];try{return await play.keyboard.hold('KeyW',s=>{trace.push({time:s.state.time,mode:s.mode,player:s.player,hp:s.state.hp});return Math.hypot(s.player.x-start.player.x,s.player.z-start.player.z)>.3;},{read,timeoutMs:15000});}finally{await writeFile('/private/tmp/wake-native-real-move-trace.json',JSON.stringify(trace));}});
 await play.step('jump on Shift',async()=>{await play.keyboard.press('ShiftLeft');const s=await play.state(read);assert(s.jumps>0);await play.screenshot('native-jump');});
 await play.step('moving roll cancels jump',async()=>{await play.keyboard.hold(['KeyD','Space'],s=>s.rolls>0,{read});await play.screenshot('native-roll');});
 await play.step('pause and resume',async()=>{await play.keyboard.press('KeyP');await play.waitFor(s=>s.mode==='paused',{read});await play.advance(1.05,{read});await play.page.locator('[data-native="resume"]').click();await play.waitFor(s=>s.mode==='playing',{read});});
 await play.step('save survives reload',async()=>{await play.keyboard.press('KeyP');await play.waitFor(s=>s.mode==='paused',{read});await play.page.locator('[data-native="save"]').click();await play.page.waitForFunction(()=>localStorage.getItem('wakeup-tiangong-native-v1:tidewater')!==null);await play.reload();await play.page.locator('#continue').click();await play.waitFor(s=>s.mode==='playing',{read});await play.screenshot('native-restored');});
 return {menu,start,walked,final:await play.state(read)};
}
