import test from 'node:test';
import assert from 'node:assert/strict';
import {createPointerLock} from './pointer-lock.js';
function setup(invoke, webRequest) {
 const doc = new EventTarget(); const win = new EventTarget();win.parent=win;
 if(invoke)win.__TAURI_INTERNALS__={invoke};
 const canvas={style:{},requestPointerLock:webRequest};const messages=[];
 return {doc,win,canvas,messages,lock:createPointerLock(canvas,(s)=>messages.push(s),win,doc)};
}
test('native success becomes locked and blur releases capture', async()=>{
 const calls=[];const s=setup(async(cmd,args)=>calls.push([cmd,args.capture]));
 await s.lock.request();assert.equal(s.lock.locked(),true);
 s.win.dispatchEvent(new Event('blur'));assert.equal(s.lock.locked(),false);
 assert.deepEqual(calls,[['set_pointer_capture',true],['set_pointer_capture',false]]);
});
test('failed native capture never claims a lock',async()=>{
 const s=setup(async()=>{throw new Error('capture rejected');});
 await s.lock.request();assert.equal(s.lock.locked(),false);assert.match(s.messages[0],/capture rejected/);
});
test('release during pending native request releases late success',async()=>{
 let resolve;const calls=[];const s=setup((_,args)=>{calls.push(args.capture);return args.capture?new Promise(r=>resolve=r):Promise.resolve();});
 const request=s.lock.request();s.lock.release();resolve();await request;
 assert.equal(s.lock.locked(),false);assert.deepEqual(calls,[true,false,false]);
});
test('web API failure falls back to desktop capture',async()=>{
 const s=setup(async()=>{},async()=>{throw new Error('unsupported');});await s.lock.request();assert.equal(s.lock.locked(),true);
});
test('web builds retain real browser pointer-lock state',async()=>{
 const s=setup(undefined,async()=>{s.doc.pointerLockElement=s.canvas;});await s.lock.request();assert.equal(s.lock.locked(),true);
});
