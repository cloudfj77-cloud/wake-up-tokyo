// Prefer shipped character art; download a fallback only when its replacement is unavailable.
export async function resolveCharacterAssets(loaders){
 const [worker,awakened,player,shieldCop,batonCop,guard,infectedCop,props]=await Promise.all([loaders.worker(),loaders.awakened(),loaders.player(),loaders.shieldCop(),loaders.batonCop(),loaders.fallback('guard'),loaders.infectedCop(),loaders.props()]);
 const assets={guard};if(infectedCop)assets.infectedCop=infectedCop;if(props)assets.props=props;if(worker){assets.humanMale=worker;assets.humanFemale=worker;}if(awakened?.length){assets.ally=awakened[0];assets.allyVariants=awakened;}if(player)assets.player=player;if(shieldCop)assets.shieldCop=shieldCop;if(batonCop)assets.batonCop=batonCop;
 const missing=['player','ally','humanMale','humanFemale'].filter(key=>!assets[key]);await Promise.all(missing.map(async key=>{assets[key]=await loaders.fallback(key);}));return assets;
}
