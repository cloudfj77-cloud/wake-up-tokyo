import {writeFile} from 'node:fs/promises';
// Provenance, original paths and workshop history stay in the editable project.
import {selectedSfx} from './select-sfx.mjs';
const cues=await selectedSfx();
const runtime=cues.map(({key,name,kind,spatial,loop,cooldown,maxInstances,caption,text,maxDurationSeconds,clips})=>({key,name,kind,spatial,loop,cooldown,maxInstances,caption,text,clips:clips.map(({seconds})=>({seconds:Math.min(seconds,maxDurationSeconds??seconds)}))}));
await writeFile(new URL('../../audio/wwise/sfx-runtime.json',import.meta.url),JSON.stringify(runtime)+'\n');
