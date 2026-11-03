import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// 检查直接读取游戏实际使用的 GLB；去掉贴图和灯光即可在 Node 中复现同一套三角面碰撞。
export async function loadTokyoCollisionScene(){
 const source=await readFile(new URL('../../assets/scenes/tokyo-district.glb',import.meta.url));
 const jsonLength=source.readUInt32LE(12),data=JSON.parse(source.subarray(20,20+jsonLength));
 for(const mesh of data.meshes)for(const primitive of mesh.primitives)delete primitive.material;
 delete data.materials;delete data.textures;delete data.images;
 if(data.extensions)delete data.extensions.KHR_lights_punctual;
 for(const node of data.nodes)if(node.extensions)delete node.extensions.KHR_lights_punctual;
 const raw=Buffer.from(JSON.stringify(data)),json=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(json);
 const bin=source.subarray(20+jsonLength),result=Buffer.alloc(20+json.length+bin.length);
 result.writeUInt32LE(0x46546c67,0);result.writeUInt32LE(2,4);result.writeUInt32LE(result.length,8);
 result.writeUInt32LE(json.length,12);result.writeUInt32LE(0x4e4f534a,16);json.copy(result,20);bin.copy(result,20+json.length);
 const {scene}=await new GLTFLoader().parseAsync(result.buffer.slice(result.byteOffset,result.byteOffset+result.byteLength),'');
 scene.scale.setScalar(.55);scene.position.set(11,3.3,-28.6);scene.updateMatrixWorld(true);return scene;
}
