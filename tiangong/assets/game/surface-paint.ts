export function surfacePaintMatrix(mark:{point:number[];normal:number[];strong?:boolean;width?:number;height?:number}){
 const n=mark.normal,p=mark.point.map((v,i)=>v+n[i]*.009),ref=Math.abs(n[1])>.9?[1,0,0]:[0,1,0];
 const cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],t=cross(ref,n),length=Math.hypot(...t);for(let i=0;i<3;i++)t[i]/=length;
 const b=cross(t,n),width=(mark.width??(mark.strong?1.4:.85))/2,height=(mark.height??.85)/2;
 return[t[0]*width,t[1]*width,t[2]*width,0,n[0]*.01,n[1]*.01,n[2]*.01,0,b[0]*height,b[1]*height,b[2]*height,0,...p,1];
}
