import {createNavigationMesh} from '@forgeax/engine/navigation';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('assets/game/navigation.pack.json','utf8'));
for(const [key,entry] of Object.entries(data.assets)){const r=createNavigationMesh(entry.payload);console.log(key,r.ok?'OK':r.error);if(!r.ok)process.exitCode=1;else console.log(r.value.project([0,0,0],10));}
