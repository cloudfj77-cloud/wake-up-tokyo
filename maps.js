export const MAPS={
 riverside:{id:'riverside',name:'东京河畔',hud:'東京 / RIVERSIDE',saveKey:'wake-up-tokyo-riverside-v4'},
 tidewater:{id:'tidewater',name:'海滨钟楼广场',hud:'海滨 / TIDEWATER',saveKey:'wake-up-tokyo-tidewater-v1'},
};
export function selectedMap(search=''){return MAPS[new URLSearchParams(search).get('map')]||MAPS.riverside;}
