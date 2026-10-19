// Bounded Wwise deferred I/O. No complete-file preload or WebAudio decoding.
class ProtocolError extends Error {}
export function createWwiseStreamIO({module:m,files,fetchImpl=fetch,onError=()=>{},requestTimeoutMs=750,maxAttempts=3}){
 const media=new Map(),requests=new Map(),history=[],errors=[],retryHistory=[];
 let closed=false,bytes=0,completed=0,peakInFlight=0,retries=0;
 if(!m._fw_io_next||!m._fw_io_register)throw Error('This Wwise bridge does not implement streaming');
 for(const file of files){const id=Number(file.id);if(!Number.isInteger(id)||id<=0||id>0xffffffff||!Number.isInteger(file.bytes)||file.bytes<=0||file.bytes>0xffffffff||media.has(id))throw Error('Invalid streamed media manifest');media.set(id,file);if(m._fw_io_register(id,file.bytes)!==1)throw Error('Cannot register streamed media '+id);}
 const pointer=m._malloc(20);if(!pointer)throw Error('Streaming request allocation failed');
 async function range(file,offset,length,signal){
  const controller=new AbortController();let timer,abort;
  const cancelled=new Promise((_,reject)=>{abort=()=>{controller.abort();reject(Error('Streaming request cancelled'));};signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{controller.abort();reject(Error('Streaming read timed out'));},requestTimeoutMs);});
  try{return await Promise.race([cancelled,(async()=>{
   // Wwise owns the bounded media cache. Do not let the browser reuse a partial
   // response for another seek/range on the same immutable .wem URL.
   const response=await fetchImpl(file.url,{cache:'no-store',headers:{Range:`bytes=${offset}-${offset+length-1}`},signal:controller.signal});
   if([408,429].includes(response.status)||response.status>=500){await response.body?.cancel();throw Error('Streaming HTTP '+response.status);}
   if(response.status!==206||response.headers.get('Content-Range')!==`bytes ${offset}-${offset+length-1}/${file.bytes}`||response.headers.get('Content-Encoding')){await response.body?.cancel();throw new ProtocolError(`Streaming range mismatch: HTTP ${response.status}, Content-Range ${response.headers.get('Content-Range')}, encoding ${response.headers.get('Content-Encoding')}; expected bytes ${offset}-${offset+length-1}/${file.bytes}`);}
   const data=new Uint8Array(await response.arrayBuffer());if(data.length!==length)throw Error('Incomplete streaming read');return data;
  })()]);}finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
 }
 async function read(token,id,offset,length,destination){
  const controller=new AbortController(),started=performance.now();requests.set(token,controller);peakInFlight=Math.max(peakInFlight,requests.size);
  try{
   const file=media.get(id);if(!file||!length||offset+length>file.bytes)throw new ProtocolError('Invalid Wwise byte range');
   for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
     const data=await range(file,offset,length,controller.signal);if(closed)return;
     m.HEAPU8.set(data,destination);m._fw_io_complete(token,1);bytes+=length;completed++;history.push({id,offset,bytes:length,attempts:attempt,ms:performance.now()-started});if(history.length>32)history.shift();return;
    }catch(e){if(closed)return;if(e instanceof ProtocolError||attempt===maxAttempts)throw e;retries++;retryHistory.push({id,offset,attempt,error:String(e)});if(retryHistory.length>8)retryHistory.shift();}
   }
  }catch(e){if(!closed){const message=`Media ${id} at ${offset}: ${e}`;errors.push(message);if(errors.length>8)errors.shift();onError(message);m._fw_io_complete(token,0);}}
  finally{requests.delete(token);}
 }
 return {
  pump(){if(closed)return;while(m._fw_io_next(pointer)){const [token,id,offset,length,destination]=m.HEAPU32.slice(pointer>>>2,(pointer>>>2)+5);void read(token,id,offset,length,destination);}},
  snapshot(){return {mode:'wwise-http-range',mediaCount:media.size,poolBytes:2097152,completedReads:completed,bytesRead:bytes,pendingReads:requests.size,openFiles:closed?0:m._fw_io_stat(1),nativePending:closed?0:m._fw_io_stat(0),peakInFlight,retries,retryHistory:[...retryHistory],errors:[...errors],recentReads:[...history]};},
  close(){if(closed)return;closed=true;for(const c of requests.values())c.abort();m._fw_io_abort();m._free(pointer);},
 };
}
