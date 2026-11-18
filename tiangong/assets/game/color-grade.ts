import {halfFloat} from '@forgeax/engine/math';
import type {TextureAsset} from '@forgeax/engine/types';
import {TOKYO_LOOK} from './tokyo-gameplay.js';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smoothstep=(edge0:number,edge1:number,x:number)=>{const t=clamp((x-edge0)/(edge1-edge0));return t*t*(3-2*t);};

/**
 * 和 toon-filter.js 同一套算式，直接吃线性颜色。
 * 原版画进离屏缓冲时不做 ACES，厚涂拿到的就是这份线性颜色；
 * 之前先转成 sRGB 再分级，暗部染不出原版那种蓝紫色。
 */
export function gradeColor(input:number[],tokyo=false){
 // 原版海滨 1.62、东京 1.03。这里再抬一档，让广场的海、屋顶和地面更艳，阴影染色和曝光仍按原版。
 const look=tokyo?{...TOKYO_LOOK,saturation:1.25}:{saturation:1.9,exposure:1.15,contrast:1.08,shadow:1,shadowShift:[0,0,.06]};
 const painted=input.slice(0,3),lum=painted[0]*.299+painted[1]*.587+painted[2]*.114,q=clamp(Math.floor(lum*3+.5)/3);
 const shade=painted.map((v,i)=>v*(1+([.66,.62,.72][i]-1)*look.shadow)+look.shadowShift[i]*look.shadow);
 let cel=shade.map((v,i)=>mix(v,painted[i],q));
 const hi=smoothstep(.72,.95,lum);
 cel=cel.map((v,i)=>mix(v,painted[i]*1.32,hi*.4));
 const l=cel[0]*.299+cel[1]*.587+cel[2]*.114;
 cel=cel.map(v=>mix(l,v,look.saturation)).map(v=>(v-.5)*look.contrast+.5);
 return cel.map(v=>clamp(v*look.exposure));
}
export function colorGradeTexture(tokyo=false):TextureAsset{const size=32,texels=new Float32Array(size**3*4);for(let b=0;b<size;b++)for(let g=0;g<size;g++)for(let r=0;r<size;r++){const offset=((b*size+g)*size+r)*4,color=gradeColor([r/(size-1),g/(size-1),b/(size-1)],tokyo);for(let n=0;n<3;n++)texels[offset+n]=color[n];texels[offset+3]=1;}return{kind:'texture',shape:{viewDimension:'3d',extent:{width:size,height:size,depth:size}},format:'rgba16float',colorSpace:'linear',mips:{kind:'none'},data:halfFloat.f32ToF16Bytes(new Uint8Array(texels.buffer))};}
