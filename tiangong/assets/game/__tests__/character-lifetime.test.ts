import assert from 'node:assert/strict';
import {test,vi} from 'vitest';
import {CharacterLibrary,CharacterVisual} from '../character.ts';
const stale={ok:false,error:{code:'stale-entity'}};
test('a model read finishing after its actor was retired cannot attach a scene',async()=>{
 let resolve!:(v:any)=>void,retired=false;const pending=new Promise<any>(r=>resolve=r),attach=vi.fn(()=>{throw Error('stale ChildOf attachment');}),world={get:()=>stale};const library=new CharacterLibrary(world as any,{instantiate:attach} as any);library.load=()=>pending;const task=library.instantiate('worker',298 as any,undefined,()=>!retired);retired=true;resolve({scene:1,clips:[],names:[]});assert.equal(await task,undefined);assert.equal(attach.mock.calls.length,0);
});
test('a stale parent handle is cancellation even if the actor predicate is still true',async()=>{
 const attach=vi.fn(()=>{throw Error('stale ChildOf attachment');}),library=new CharacterLibrary({get:()=>stale} as any,{instantiate:attach} as any);library.load=async()=>({scene:1 as any,clips:[],names:[]});assert.equal(await library.instantiate('worker',298 as any,undefined,()=>true),undefined);assert.equal(attach.mock.calls.length,0);
});
test('cleanup of an already retired character and prop is idempotent',()=>{
 const visual=new CharacterVisual({get:()=>stale} as any,298 as any,'worker',[],0,299 as any);assert.doesNotThrow(()=>{visual.dispose();visual.dispose();});
});
