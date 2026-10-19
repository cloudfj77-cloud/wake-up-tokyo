import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MusicDirector,selectMusicScene} from './music-director.mjs';
const fake=()=>({events:[],params:[],disposed:false,registerGameObject(){},postEvent(name){this.events.push(name);return this.events.length;},setRTPC(...args){this.params.push(args);},dispose(){this.disposed=true;},snapshot(){return {backend:'wwise',disposed:this.disposed};}});
test('music follows real alert, countdown, boss and ending precedence',()=>{
 const select=(mode,state={},boss={})=>selectMusicScene({mode,state,boss});
 assert.equal(select('menu'),'menu');assert.equal(select('playing',{alert:2}),'street');
 assert.equal(select('playing',{alert:3}),'pressure');assert.equal(select('playing',{alert:5,bossCountdown:120}),'countdown');
 assert.equal(select('playing',{alert:5,bossCountdown:0,bossSpawned:true},{active:true}),'boss');
 assert.equal(select('playing',{aftermath:true},{active:true,dead:true}),'aftermath');
 assert.equal(select('won',{bossDefeated:true}),'aftermath');assert.equal(select('won'),'victory');assert.equal(select('ended'),'defeat');
});
test('concurrent initialization applies only the latest scene and mix',async()=>{
 let resolve,calls=0;const a=fake();const d=new MusicDirector({createAudio:()=>{calls++;return new Promise(r=>resolve=r);}});
 const one=d.start(),two=d.start();d.setScene('pressure');d.setScene('boss');d.setVolume(.2);d.duck(true);resolve(a);
 assert.equal(await one,true);await two;assert.equal(calls,1);assert.deepEqual(a.events,['boss']);
 assert.equal(a.params.find(x=>x[0]==='Music_DuckDb')[1],-9);assert.equal(a.params.find(x=>x[0]==='Music_GainDb')[1],-20);
 for(let i=0;i<20;i++)d.update({mode:'playing',state:{bossSpawned:true},boss:{active:true}});
 assert.deepEqual(a.events,['boss'],'frames never restart a running scene');
});
test('pause during load stays silent until resume; changing scene does not bypass pause',async()=>{
 let resolve;const a=fake(),d=new MusicDirector({createAudio:()=>new Promise(r=>resolve=r)});const p=d.start();d.setScene('street');d.pause();resolve(a);await p;
 assert.deepEqual(a.events,[]);d.resume();assert.deepEqual(a.events,['resume','street']);
 d.pause();d.pause();d.setScene('boss');assert.equal(a.events.filter(x=>x==='pause').length,1);assert.equal(a.events.includes('boss'),false);
 d.resume();assert.deepEqual(a.events.slice(-2),['resume','boss']);
});
test('disposing pending load releases stale runtime before a new start',async()=>{
 let resolve,count=0;const stale=fake(),fresh=fake();const d=new MusicDirector({createAudio:()=>++count===1?new Promise(r=>resolve=r):Promise.resolve(fresh)});
 const old=d.start();d.dispose();const next=d.start();resolve(stale);assert.equal(await old,false);assert.equal(await next,true);assert.equal(stale.disposed,true);assert.equal(fresh.disposed,false);d.dispose();d.dispose();assert.equal(fresh.disposed,true);
});
test('failure is visible and a deliberate retry can recover',async()=>{
 let attempt=0;const a=fake(),d=new MusicDirector({createAudio:async()=>{if(!attempt++)throw Error('missing bank');return a;}});
 assert.equal(await d.start(),false);assert.equal(d.status,'error');assert.match(d.error,/missing bank/);assert.equal(await d.start(),true);assert.equal(d.status,'ready');
});
test('radio duck, upgrade focus and mute use separate authored parameters',async()=>{
 const a=fake(),d=new MusicDirector({createAudio:async()=>a});await d.start();d.update({mode:'upgrade'});assert.equal(a.params.at(-1)[1],-4);
 d.duck(true);assert.equal(a.params.at(-1)[1],-9);d.duck(false);assert.equal(a.params.at(-1)[1],-4);
 const n=a.events.length;d.setMuted(true);assert.equal(a.params.at(-1)[1],-96);d.setMuted(false);assert.equal(a.events.length,n,'muting never restarts the music');
});
test('an unexpectedly ended loop recovers without rebuilding the shared SFX engine',async()=>{
 let now=0,playing=true;const a=fake();a.playingStatus=()=>({playing,positionMs:now});const d=new MusicDirector({createAudio:async()=>a,now:()=>now});d.setScene('street');await d.start();playing=false;now=1000;d.checkPlayback();assert.deepEqual(a.events,['street'],'startup grace');now=1600;d.checkPlayback();assert.deepEqual(a.events,['street','street']);assert.equal(a.disposed,false);assert.equal(d.recoveries.length,1);assert.equal(d.recoveries[0].reason,'event-ended');now=1700;d.checkPlayback();assert.equal(a.events.length,2,'no per-frame restart storm');d.dispose();
});
test('pause, stop and ending stingers never trigger the loop watchdog',async()=>{
 let now=0;const a=fake();a.playingStatus=()=>({playing:false,positionMs:-1});const d=new MusicDirector({createAudio:async()=>a,now:()=>now});await d.start();d.pause();now=5000;d.checkPlayback();assert.deepEqual(a.events,['menu','pause']);d.resume();d.setScene('defeat');now=20000;d.checkPlayback();assert.equal(a.events.filter(e=>e==='defeat').length,1);d.stop();now=30000;d.checkPlayback();assert.equal(a.events.at(-1),'stop');d.dispose();
});
test('a still-registered but stalled music source is replaced after a grace period',async()=>{
 let now=0;const a=fake(),stops=[];a.playingStatus=()=>({playing:true,positionMs:3000});a.stopPlaying=(...args)=>stops.push(args);const d=new MusicDirector({createAudio:async()=>a,now:()=>now});d.setScene('street');await d.start();now=2000;d.checkPlayback();now=9000;d.checkPlayback();assert.equal(a.events.length,1);now=10100;d.checkPlayback();assert.deepEqual(stops,[[1,0]]);assert.deepEqual(a.events,['street','street']);assert.equal(d.recoveries[0].reason,'source-stalled');d.dispose();
});
