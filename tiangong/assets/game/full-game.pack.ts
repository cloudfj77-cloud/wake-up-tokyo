import {definePack,definePackageId} from '@forgeax/engine/pack/source';
import {AssetGuid} from '@forgeax/engine/pack/guid';
import {ok} from '@forgeax/engine/types';
import {FULL_ASSETS} from './asset-refs.ts';
import {ref} from './content.pack.ts';
export const GAME_ID=definePackageId('e6e491b9-e27b-4f3b-9130-7b5b270e1245');
export const gameRef=AssetGuid.format(AssetGuid.derive(GAME_ID,'plugin/game'));
const asset=(guid:string)=>({$asset:guid});
const map=(prefix:string,name:string)=>({
 scenes:Object.entries(FULL_ASSETS).filter(([key])=>key.startsWith(prefix+'-part-')).map(([,value])=>asset(value.scene)),
 collisions:Object.entries(FULL_ASSETS).filter(([key])=>key.startsWith(prefix+'-shape-')).map(([,value])=>asset(value.meshes[0]!)),
 routes:prefix==='tokyo'?asset('f36eb6b1-f79c-5fb7-ae86-83e1885732ce'):asset('a59db4a9-49f6-5063-a1c2-5693429a34b4'),
 navigation:null,
});
export default definePack({schemaVersion:'2.0.0',plugins:true,packageId:GAME_ID,build:()=>ok({'plugin/game':{
 kind:'plugin',module:{specifier:'./native.ts',export:'game'},config:{
  maps:{tidewater:map('tidewater','tidewater'),riverside:map('tokyo','riverside')},
  models:Object.fromEntries(Object.entries(FULL_ASSETS).filter(([name])=>!name.includes('-part-')&&!name.includes('-shape-')).map(([name,value])=>[name,{scene:asset(value.scene),clips:Object.fromEntries(Object.entries(value.clips).map(([key,guid])=>[key,asset(guid)]))}])),
  grades:{tidewater:asset(ref('texture/grade-seaside')),riverside:asset(ref('texture/grade-tokyo'))},
  box:asset(ref('mesh/box')),sphere:asset(ref('mesh/sphere')),
  materials:Object.fromEntries(['foe','friend','juice','weapon','marker','sea','tank-foe','tank-friend','pickup-health','pickup-factor','pickup-potion'].map(key=>[key,asset(ref('material/'+key))])),
 }
}})});
