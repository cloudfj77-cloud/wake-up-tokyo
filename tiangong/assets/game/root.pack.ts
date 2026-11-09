import {definePack,definePackageId} from '@forgeax/engine/pack/source';
import {ok} from '@forgeax/engine/types';
import {gameRef} from './full-game.pack.ts';
export default definePack({schemaVersion:'2.0.0',plugins:true,packageId:definePackageId('019fb7ce-3800-7000-8000-000000000000'),build:()=>ok({'plugin/engine':{kind:'plugin',module:{specifier:'./composition.ts',export:'compose'},config:{children:[{$asset:'148f7370-c2bc-5c43-976f-b85f5d521057'},{$asset:gameRef}]}}})});
