export function renderPixelRatio(width,height,dpr,quality,touch){
 if(quality!=='low')return Math.min(dpr||1,1.5);
 return touch?Math.min(1,900/Math.max(1,width,height)):1;
}
