import type {Plugin} from '@forgeax/engine/plugin';
import {mountPluginAsset} from '@forgeax/engine/plugin';
export const compose:Plugin.Object<{children:string[]}>={name:'wakeup/native-composition',inject:['assets','pluginPrograms'],async apply(ctx,config){await ctx.effect(async function*(){for(const guid of config.children){const child=(await mountPluginAsset(ctx,guid)).unwrap();yield child.dispose;}});}};
