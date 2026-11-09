import {halfFloat} from '@forgeax/engine/math';
import type {TextureAsset} from '@forgeax/engine/types';
import {TOKYO_LOOK} from './tokyo-gameplay.js';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const srgb=(v:number)=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
const linear=(v:number)=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
export function gradeColor(input:number[],tokyo=false){
 const c=input.map(srgb),look=tokyo?{...TOKYO_LOOK}: {saturation:1.62,exposure:1.15,contrast:1.08,shadow:1,shadowShift:[0,0,.06]},lum=c[0]*.299+c[1]*.587+c[2]*.114,q=clamp(Math.floor(lum*3+.5)/3),t=clamp((lum-.72)/.23),hi=t*t*(3-2*t)*.4;
 let out=c.map((v,i)=>{const shadow=v*(1+([.66,.62,.72][i]-1)*look.shadow)+look.shadowShift[i]*look.shadow,cel=shadow*(1-q)+v*q;return cel*(1-hi)+v*1.32*hi;});const l=out[0]*.299+out[1]*.587+out[2]*.114;
 return out.map(v=>linear(clamp(((l+(v-l)*look.saturation-.5)*look.contrast+.5)*look.exposure)));
}
export function colorGradeTexture(tokyo=false):TextureAsset{const size=32,texels=new Float32Array(size**3*4);for(let b=0;b<size;b++)for(let g=0;g<size;g++)for(let r=0;r<size;r++){const offset=((b*size+g)*size+r)*4,color=gradeColor([r/(size-1),g/(size-1),b/(size-1)],tokyo);for(let n=0;n<3;n++)texels[offset+n]=color[n];texels[offset+3]=1;}return{kind:'texture',shape:{viewDimension:'3d',extent:{width:size,height:size,depth:size}},format:'rgba16float',colorSpace:'linear',mips:{kind:'none'},data:halfFloat.f32ToF16Bytes(new Uint8Array(texels.buffer))};}
