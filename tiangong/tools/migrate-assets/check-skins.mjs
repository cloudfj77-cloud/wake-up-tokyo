import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
function glb(path){const b=readFileSync(path),length=b.readUInt32LE(12);return {g:JSON.parse(b.subarray(20,20+length)),binary:b.subarray(28+length)};}
function view(file,id){const a=file.g.accessors[id],v=file.g.bufferViews[a.bufferView];return {a,v,at:(v.byteOffset??0)+(a.byteOffset??0)};}
for(const name of ['shield-cop','baton-cop','guard']){
 const original=glb('tools/migrate-assets/exports/'+name+'.glb'),copy=glb('assets/imported/full/'+name+'.glb');assert.equal(copy.g.skins.length,1);let meshes=0,vertices=0;
 for(let n=0;n<original.g.nodes.length;n++){
  const node=original.g.nodes[n];if(node.skin===undefined||node.mesh===undefined)continue;
  const skin=original.g.skins[node.skin],targetNode=copy.g.nodes[n],targetSkin=copy.g.skins[targetNode.skin];assert.equal(targetNode.name,node.name||targetNode.name);meshes++;
  for(let p=0;p<original.g.meshes[node.mesh].primitives.length;p++){
   const source=original.g.meshes[node.mesh].primitives[p],target=copy.g.meshes[targetNode.mesh].primitives[p];if(source.attributes.JOINTS_0===undefined)continue;
   const a=view(original,source.attributes.JOINTS_0),b=view(copy,target.attributes.JOINTS_0),ib=view(original,skin.inverseBindMatrices),tb=view(copy,targetSkin.inverseBindMatrices),size=a.a.componentType===5121?1:2;assert.equal(a.a.count,b.a.count);vertices+=a.a.count;
   for(let v=0;v<a.a.count;v++)for(let k=0;k<4;k++){
    const offset=a.at+v*(a.v.byteStride??4*size)+k*size,joint=size===1?original.binary.readUInt8(offset):original.binary.readUInt16LE(offset),unified=copy.binary.readUInt16LE(b.at+v*(b.v.byteStride??8)+k*2),alias=targetSkin.joints[unified],parent=skin.joints[joint];
    assert(copy.g.nodes[parent].children.includes(alias));assert.deepEqual(original.binary.subarray(ib.at+joint*(ib.v.byteStride??64),ib.at+joint*(ib.v.byteStride??64)+64),copy.binary.subarray(tb.at+unified*64,tb.at+unified*64+64));
   }
  }
 }
 console.log(JSON.stringify({name,originalSkins:original.g.skins.length,nativeSkins:1,meshes,vertices,allJointBindingsAndInverseMatricesPreserved:true}));
}
