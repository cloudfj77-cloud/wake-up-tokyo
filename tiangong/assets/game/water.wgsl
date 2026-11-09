#define_import_path wakeup::water
#import forgeax_material::surface_v1::{SurfaceInput,SurfaceData}
fn evaluate_surface(input:SurfaceInput)->SurfaceData{
 let p=input.positionWS.xz;
 let a=p.x*.65+p.y*.38+input.frameTime*.8;
 let b=p.x*1.17-p.y*.79-input.frameTime*.6;
 let wave=sin(a)*.5+sin(b)*.25;
 let normal=normalize(vec3<f32>(cos(a)*.055+cos(b)*.025,1.,cos(a)*.035-cos(b)*.018));
 let color=mix(vec3<f32>(.025,.19,.29),vec3<f32>(.065,.38,.46),wave*.5+.5);
 let glint=pow(max(0.,sin(a*2.1+b)),18.)*.035;
 return SurfaceData(color,normal,.12,.22,vec3<f32>(glint),1.,1.,0.);
}
