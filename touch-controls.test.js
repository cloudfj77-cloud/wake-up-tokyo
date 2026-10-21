import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isTouchDevice,stickVector,createTouchControls} from './touch-controls.js';

test('APK always enters touch mode even when an emulator reports a fine pointer without a native bridge',()=>{
 const config=JSON.parse(readFileSync(new URL('./capacitor.config.json',import.meta.url)));
 const originals=Object.fromEntries(['window','location','matchMedia','Capacitor'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 try{
  globalThis.window={};globalThis.location=new URL(config.server.appStartPath,'https://localhost');
  globalThis.matchMedia=()=>({matches:false});globalThis.Capacitor=undefined;
  assert.equal(isTouchDevice(),true);
  globalThis.location=new URL('http://localhost/?touch=0');assert.equal(isTouchDevice(),false,'desktop H5 keeps keyboard controls');
 }finally{for(const [k,descriptor]of Object.entries(originals)){if(descriptor)Object.defineProperty(globalThis,k,descriptor);else delete globalThis[k];}}
});

class Element extends EventTarget {
 constructor(){super();this.style={};this.dataset={};const classes=new Set();this.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)};}
 appendChild(){} remove(){} setPointerCapture(){} getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}
}
function fixture(){
 const nodes=Object.fromEntries(['#touchStick','#touchKnob','#touchLook'].map(k=>[k,new Element()]));
 const button=new Element();button.dataset.act='primary';
 const root=new Element();root.querySelector=k=>nodes[k];root.querySelectorAll=()=>[button];
 const doc=new Element();doc.defaultView=new Element();doc.body=new Element();doc.createElement=()=>root;
 return {doc,root,button,...nodes};
}
function pointer(node,type,id,x=50,y=50){const event=new Event(type,{bubbles:true,cancelable:true});Object.assign(event,{pointerId:id,clientX:x,clientY:y});node.dispatchEvent(event);}
test('stick preserves arbitrary angles, clamps travel and ignores dead zone',()=>{
 assert.deepEqual(stickVector(0,0,46),{x:0,y:0,sprint:false});
 const v=stickVector(12,-30,46);assert.ok(Math.abs(v.x/v.y+.4)<1e-9);assert.equal(v.sprint,false);
 const full=stickVector(400,300,46);assert.equal(Math.hypot(full.x,full.y),1);assert.equal(full.sprint,true);
});
test('independent fingers keep stick and camera ownership; cancel clears movement',()=>{
 const f=fixture(),moves=[],looks=[];
 const control=createTouchControls(f.doc,{onMove:(...v)=>moves.push(v),onLook:(...v)=>looks.push(v)});control.show();
 pointer(f['#touchStick'],'pointerdown',1,70,20);
 pointer(f['#touchStick'],'pointerdown',2,20,80);
 pointer(f['#touchStick'],'pointermove',2,20,80);
 assert.equal(moves.length,1);assert.ok(moves[0][0]>0&&moves[0][1]<0);
 pointer(f['#touchLook'],'pointerdown',3,80,20);pointer(f['#touchLook'],'pointermove',3,90,30);
 assert.deepEqual(looks,[[10,10]]);
 pointer(f.root,'pointercancel',1);assert.deepEqual(moves.at(-1),[0,0,false]);control.dispose();
});
test('hold repeats only while active and hide/blur/dispose release attacks',async()=>{
 const f=fixture();let hits=0,active=true;
 const control=createTouchControls(f.doc,{active:()=>active,actions:{primary:()=>hits++}});control.show();
 pointer(f.button,'pointerdown',7);await new Promise(r=>setTimeout(r,125));assert.ok(hits>=2);
 active=false;const count=hits;await new Promise(r=>setTimeout(r,125));assert.equal(hits,count);
 control.hide();active=true;await new Promise(r=>setTimeout(r,125));assert.equal(hits,count);
 control.show();pointer(f.button,'pointerdown',8);f.doc.defaultView.dispatchEvent(new Event('blur'));
 const after=hits;await new Promise(r=>setTimeout(r,125));assert.equal(hits,after);control.dispose();
});
