import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dedupeRenderResources} from './scripts/tokyo/dedupe-render-resources.mjs';
const parse=b=>{const n=b.readUInt32LE(12);return {json:JSON.parse(b.subarray(20,20+n)),bin:b.subarray(28+n)};};

test('render resource deduplication is idempotent and preserves geometry, transforms and collision extras',()=>{
 const source=readFileSync(new URL('./assets/scenes/tokyo-district.glb',import.meta.url)),result=dedupeRenderResources(source),a=parse(source),b=parse(result.buffer);
 assert.deepEqual(a.bin,b.bin);for(const key of ['accessors','nodes','scenes','bufferViews','animations','extensions','extras'])assert.deepEqual(a.json[key],b.json[key]);
 assert.deepEqual(a.json.meshes,b.json.meshes);assert.deepEqual(result.after,result.before);assert.ok(result.after.images<110);assert.ok(result.after.materials<230);
});

test('identical embedded images, samplers and materials share resources without changing material factors',()=>{
 const data={asset:{version:'2.0'},buffers:[{byteLength:8}],bufferViews:[{buffer:0,byteOffset:0,byteLength:4},{buffer:0,byteOffset:4,byteLength:4}],images:[{bufferView:0,mimeType:'image/png'},{bufferView:1,mimeType:'image/png'}],samplers:[{wrapS:10497},{wrapS:10497}],textures:[{source:0,sampler:0},{source:1,sampler:1}],materials:[{name:'one',pbrMetallicRoughness:{baseColorFactor:[.2,.4,.6,1],baseColorTexture:{index:0}}},{name:'two',pbrMetallicRoughness:{baseColorFactor:[.2,.4,.6,1],baseColorTexture:{index:1}}},{pbrMetallicRoughness:{baseColorFactor:[.8,.4,.6,1],baseColorTexture:{index:1}}}],meshes:[{primitives:[{attributes:{POSITION:0},material:0},{attributes:{POSITION:0},material:1},{attributes:{POSITION:0},material:2}]}]};
 const text=Buffer.from(JSON.stringify(data)),json=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(json);const input=Buffer.alloc(28+json.length+8);input.writeUInt32LE(0x46546c67);input.writeUInt32LE(2,4);input.writeUInt32LE(input.length,8);input.writeUInt32LE(json.length,12);input.writeUInt32LE(0x4e4f534a,16);json.copy(input,20);input.writeUInt32LE(8,20+json.length);input.writeUInt32LE(0x004e4942,24+json.length);Buffer.from([1,2,3,4,1,2,3,4]).copy(input,28+json.length);
 const result=dedupeRenderResources(input),{json:out}=parse(result.buffer);assert.deepEqual(result.after,{images:1,samplers:1,textures:1,materials:2});assert.deepEqual(out.meshes[0].primitives.map(p=>p.material),[0,0,1]);assert.deepEqual(out.materials.map(m=>m.pbrMetallicRoughness.baseColorFactor),[[.2,.4,.6,1],[.8,.4,.6,1]]);
 assert.equal(createHash('sha256').update(parse(input).bin).digest('hex'),createHash('sha256').update(parse(result.buffer).bin).digest('hex'));
});
