import * as T from 'three';

const maps=['map','emissiveMap','normalMap','roughnessMap','metalnessMap','aoMap','alphaMap','bumpMap','displacementMap','lightMap','envMap'];
const values=['type','roughness','metalness','emissiveIntensity','opacity','transparent','alphaTest','side','vertexColors','flatShading','depthWrite','depthTest','blending','premultipliedAlpha','fog','wireframe','envMapIntensity','normalMapType','bumpScale','displacementScale','displacementBias','aoMapIntensity','lightMapIntensity'];
const imageIds=new WeakMap();let nextImage=1;
function textureKey(tex){
 if(!tex)return null;tex.updateMatrix();const image=tex.image;
 if(image&&!imageIds.has(image))imageIds.set(image,nextImage++);
 return [imageIds.get(image)??tex.uuid,tex.channel,tex.flipY,tex.colorSpace,tex.wrapS,tex.wrapT,tex.minFilter,tex.magFilter,tex.anisotropy,...tex.matrix.elements];
}
export function materialBatchKey(m){
 return JSON.stringify([...values.map(k=>m[k]),m.emissive?.toArray(),m.normalScale?.toArray(),...maps.map(k=>textureKey(m[k]))]);
}

// Pack authored signs at their original resolution. Repeating UVs retain their
// own textures. No network or image codec.
export function prepareStaticMaterials(root,{maxSize=4096,createCanvas=()=>document.createElement('canvas')}={}){
 const sources=[],materials=new Map(),unique=new Map();
 root.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material)||o.material.transparent||!o.material.isMeshStandardMaterial)return;
  sources.push(o);const m=o.material,tex=m.map,image=tex?.image;
  if(!tex||tex.flipY||tex.channel!==0||m.emissiveMap&&JSON.stringify(textureKey(m.emissiveMap))!==JSON.stringify(textureKey(tex))||maps.some(k=>!['map','emissiveMap'].includes(k)&&m[k])||!o.geometry.attributes.uv||!image||image.width+8>maxSize||image.height+8>maxSize)return;
  tex.updateMatrix();const uv=o.geometry.attributes.uv,p=new T.Vector2();
  for(let i=0;i<uv.count;i++){p.fromBufferAttribute(uv,i).applyMatrix3(tex.matrix);if(p.x<-.0001||p.x>1.0001||p.y<-.0001||p.y>1.0001)return;}
  materials.set(m,tex);unique.set(tex.uuid,tex);
 });
 const padding=4,size=Math.min(4096,maxSize),placements=new Map(),pages=[];
 const textures=[...unique.values()].sort((a,b)=>b.image.height-a.image.height);
 for(const tex of textures){
  const w=tex.image.width+padding*2,h=tex.image.height+padding*2;let chosen=null,shelf=null;
  for(const page of pages){shelf=page.shelves.find(s=>s.height>=h&&s.x+w<=size);if(shelf){chosen=page;break;}if(page.height+h<=size){shelf={x:0,y:page.height,height:h};page.shelves.push(shelf);page.height+=h;chosen=page;break;}}
  if(!chosen){shelf={x:0,y:0,height:h};chosen={items:[],shelves:[shelf],width:0,height:h};pages.push(chosen);}
  chosen.items.push({tex,x:shelf.x+padding,y:shelf.y+padding});shelf.x+=w;chosen.width=Math.max(chosen.width,shelf.x);
 }
 for(const page of pages){
  const canvas=createCanvas();canvas.width=page.width;canvas.height=page.height;
  const ctx=canvas.getContext('2d');
  page.items.forEach(({tex,x,y})=>{
   const image=tex.image,w=image.width,h=image.height;
   ctx.drawImage(image,x,y);
   ctx.drawImage(image,0,0,w,1,x,y-padding,w,padding);ctx.drawImage(image,0,h-1,w,1,x,y+h,w,padding);
   ctx.drawImage(image,0,0,1,h,x-padding,y,padding,h);ctx.drawImage(image,w-1,0,1,h,x+w,y,padding,h);
   for(const [sx,sy,dx,dy]of [[0,0,x-padding,y-padding],[w-1,0,x+w,y-padding],[0,h-1,x-padding,y+h],[w-1,h-1,x+w,y+h]])ctx.drawImage(image,sx,sy,1,1,dx,dy,padding,padding);
   placements.set(tex,{x,y,w,h,canvas});
  });
  const atlas=new T.CanvasTexture(canvas);atlas.colorSpace=T.SRGBColorSpace;atlas.flipY=false;atlas.generateMipmaps=false;atlas.minFilter=T.LinearFilter;atlas.magFilter=T.LinearFilter;atlas.name='Tokyo sign atlas';
  for(const {tex}of page.items)placements.get(tex).texture=atlas;
 }
 const remappedMaterials=new Map(),geometries=new Map(),canonical=new Map();let remapped=0;
 for(const o of sources){
  const original=o.material,tex=materials.get(original),place=placements.get(tex);
  if(place){
   if(!remappedMaterials.has(original)){const material=original.clone();material.map=place.texture;if(original.emissiveMap)material.emissiveMap=place.texture;remappedMaterials.set(original,material);}
   const key=o.geometry.uuid+','+tex.uuid;
   if(!geometries.has(key)){
    const geometry=o.geometry.clone(),uv=geometry.attributes.uv,p=new T.Vector2();
    for(let i=0;i<uv.count;i++){p.fromBufferAttribute(uv,i).applyMatrix3(tex.matrix);uv.setXY(i,(place.x+p.x*place.w)/place.canvas.width,(place.y+p.y*place.h)/place.canvas.height);}
    geometries.set(key,geometry);
   }
   o.geometry=geometries.get(key);o.material=remappedMaterials.get(original);remapped++;
  }
  const material=o.material,key=materialBatchKey(material);
  if(!canonical.has(key)){const shared=material.clone();shared.color.set(0xffffff);canonical.set(key,shared);}
  o.userData.batchMaterial=canonical.get(key);o.userData.batchColor=material.color.clone();
 }
 return {signTextures:textures.length,atlasTextures:new Set([...placements.values()].map(p=>p.texture)).size,remapped,materials:canonical.size};
}
