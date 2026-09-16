const objective=(id,label,target,read,targetKind)=>({id,label,target,read,targetKind});
export const MISSIONS=[
 {id:'wake-corner',title:'唤醒街角',description:'扩大最初的觉醒群落。',objectives:[objective('infected','累计感染人数',3,s=>s.infected,'human')],reward:{ammo:24,hp:15}},
 {id:'break-order',title:'切断第一道命令',description:'感染人群，并摧毁控制街区的秩序中枢。',objectives:[objective('infected','累计感染人数',10,s=>s.infected,'human'),objective('towers','摧毁秩序中枢',1,s=>s.towers,'tower')],reward:{ammo:32,hp:20}},
 {id:'break-line',title:'突破镇压线',description:'处理净化士兵，继续瓦解秩序网络。',objectives:[objective('purifier','处理净化士兵',1,s=>s.purifiers>=1||s.highestEnemy>=3?1:0,'purifier'),objective('towers','摧毁秩序中枢',2,s=>s.towers,'tower')],reward:{ammo:40,hp:25}},
 {id:'lose-control',title:'让城市失控',description:'关闭最后的秩序中枢，直接引出巨像。',objectives:[objective('towers','摧毁秩序中枢',2,s=>s.towers,'tower')],reward:{ammo:48,hp:25}},
 {id:'final-awakening',title:'带领市民们逃离规训',description:'击败奶蛙龙，带领市民们逃离规训。',objectives:[objective('boss','击败奶蛙龙',1,s=>s.bossDefeated?1:0,'boss')],reward:{ammo:0,hp:0}},
];

export function missionView(state,index=state.mission){
 const mission=MISSIONS[index];
 if(!mission)return null;
 const objectives=mission.objectives.map(item=>{const value=Math.min(item.target,item.read(state));return {...item,value,done:value>=item.target};});
 return {...mission,index,objectives,done:objectives.every(item=>item.done)};
}

export function missionReady(state){return missionView(state)?.done??false;}

export function advanceMission(state){
 const completed=missionView(state);
 if(!completed?.done)return null;
 state.mission++;
 return completed;
}
