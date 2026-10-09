import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';

const scriptDir=fileURLToPath(new URL('./scripts/',import.meta.url));
async function freePort(){
 const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;
}
for(const layout of ['repository','forgeax','distributed'])test(`Mac launcher serves the game in ${layout} layout with spaces in its path`,{skip:process.platform==='win32'},async()=>{
 const root=await mkdtemp(join(tmpdir(),'wake game '));
 const dir=layout==='repository'?join(root,'scripts'):layout==='forgeax'?join(root,'source/scripts'):root;
 const game=layout==='repository'?join(root,'dist'):layout==='forgeax'?join(root,'web'):root;
 let child;
 try{
  await mkdir(dir,{recursive:true});await mkdir(game,{recursive:true});
  for(const file of ['launch-mac.command','serve.mjs'])await cp(join(scriptDir,file),join(dir,file));
  const launcher=join(dir,'launch-mac.command');assert.ok((await stat(launcher)).mode&0o111,'double-click entry must be executable');
  await writeFile(join(game,'index.html'),'<title>Wake launch check</title>');
  const port=await freePort();
  child=spawn(launcher,[],{env:{...process.env,WAKE_PORT:String(port),WAKE_NO_OPEN:'1'},stdio:'ignore'});
  const exited=once(child,'exit');
  let response;
  for(let i=0;i<60;i++){
   assert.equal(child.exitCode,null,'launcher must keep serving instead of exiting');
   try{response=await fetch(`http://127.0.0.1:${port}/`);break;}catch{await new Promise(resolve=>setTimeout(resolve,50));}
  }
  assert.ok(response,'server must start');assert.equal(response.status,200);
  assert.match(await response.text(),/Wake launch check/);
  child.kill();await exited;child=null;
 }finally{child?.kill();await rm(root,{recursive:true,force:true});}
});
