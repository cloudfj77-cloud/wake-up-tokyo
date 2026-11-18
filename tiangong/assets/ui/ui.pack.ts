import type {} from '@forgeax/engine/app';
import {definePack,definePackageId} from '@forgeax/engine/pack/source';
import {ok} from '@forgeax/engine/types';
import type {Plugin} from '@forgeax/engine/plugin';
import {AUDIO_REFS,STORY_GUID} from '../game/media-refs.ts';
import {mountNativeInterface} from '../game/interface.ts';
export const ui:Plugin={name:'wakeup/native-interface',inject:['gameHost'],apply(ctx){ctx.effect(function*(){const ui=mountNativeInterface(ctx.gameHost!);yield ()=>ui.dispose();});}};
export default definePack({schemaVersion:'2.0.0',plugins:true,packageId:definePackageId('019fb7ce-3d00-7000-8000-000000000000'),build:()=>ok({'plugin/host':{kind:'plugin',module:{specifier:'./ui.pack.ts',export:'ui'},config:{audio:Object.fromEntries(Object.entries(AUDIO_REFS).map(([key,guid])=>[key,{$asset:guid}])),story:{$asset:STORY_GUID}}}})});
