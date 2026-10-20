import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {repository,verifyNativePackage} from './scripts/wwise/native-delivery.mjs';

const delivery=platform=>join(repository,'audio/wwise/generated/native',platform);
for(const platform of ['Windows','Android'])test(`${platform} native delivery retains 200 approved media, all streams, event IDs and Vorbis encoding`,async()=>{
 const report=await verifyNativePackage(delivery(platform),platform);
 assert.equal(report.mediaCount,200);assert.equal(report.streamedMedia,9);assert.equal(report.verifiedFiles,18);
});
test('a Windows Init/bank set cannot be selected as Android',async()=>{
 await assert.rejects(verifyNativePackage(delivery('Windows'),'Android'),/platform mismatch/);
});
async function changedDelivery(change){
 const root=await mkdtemp(join(tmpdir(),'wake native audio '));
 try{await cp(delivery('Android'),root,{recursive:true});await change(root);}finally{await rm(root,{recursive:true,force:true});}
}
test('packaging fails when a streaming WEM is omitted, even with intact banks',async()=>changedDelivery(async root=>{
 const manifest=JSON.parse(await readFile(join(root,'audio-manifest.json'),'utf8'));await rm(join(root,manifest.streams[0].file));
 await assert.rejects(verifyNativePackage(root,'Android'),/ENOENT/);
}));
test('packaging fails on a changed bank byte instead of accepting metadata alone',async()=>changedDelivery(async root=>{
 const p=join(root,'TokyoMusic.bnk'),b=await readFile(p);b[b.length-1]^=1;await writeFile(p,b);
 await assert.rejects(verifyNativePackage(root,'Android'),/hash mismatch: TokyoMusic.bnk/);
}));
test('extra compressed/old audio is rejected in a native bank package',async()=>changedDelivery(async root=>{
 await writeFile(join(root,'Media','stale.wem.gz'),'not a seekable WEM');
 await assert.rejects(verifyNativePackage(root,'Android'),/Unexpected audio file/);
}));
test('a substituted manifest is rejected against the reviewed source delivery',async()=>changedDelivery(async root=>{
 const p=join(root,'audio-manifest.json'),expectedManifest=JSON.parse(await readFile(p,'utf8'));
 const changed={...expectedManifest,generationId:'another-export'};await writeFile(p,JSON.stringify(changed));
 await assert.rejects(verifyNativePackage(root,'Android',{expectedManifest}),/differs from generated delivery/);
}));
test('stale exports cannot be packaged after the authoring sources change',async()=>changedDelivery(async root=>{
 const p=join(root,'audio-manifest.json'),manifest=JSON.parse(await readFile(p,'utf8'));
 manifest.projectFingerprint='old-source-fingerprint';await writeFile(p,JSON.stringify(manifest));
 await assert.rejects(verifyNativePackage(root,'Android'),/sources changed after native generation/);
}));
