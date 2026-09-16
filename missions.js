// 教程只统计当前步骤对应的动作，玩家必须亲手完成每一步，而不是开局瞬间跳过多项。
export const TUTORIAL_STEPS=[
 {id:'move',action:'move',title:'移动身体',detail:'使用 WASD 移动 3 米',target:3,key:'WASD'},
 {id:'look',action:'look',title:'观察街区',detail:'移动鼠标或方向键转动视角',target:120,key:'鼠标'},
 {id:'jump',action:'jump',title:'跨越障碍',detail:'按空格键跳跃一次',target:1,key:'空格'},
 {id:'roll',action:'roll',title:'紧急闪避',detail:'按 Shift 完成一次翻滚',target:1,key:'SHIFT'},
 {id:'shoot',action:'shoot',title:'近身感染',detail:'按左键或 J 打出一次轻击',target:1,key:'左键 / J'},
 {id:'hit',action:'hit',title:'命中目标',detail:'用轻击命中一名未感染者',target:1,key:'靠近攻击'},
 {id:'infect',action:'infect',title:'完成第一次觉醒',detail:'持续命中并感染一名市民',target:1,key:'感染目标'},
];

const objective=(id,label,target,read,targetKind)=>({id,label,target,read,targetKind});
export const MISSIONS=[
 {id:'wake-corner',title:'唤醒街角',description:'扩大最初的觉醒群落。',objectives:[objective('infected','累计感染人数',3,s=>s.infected,'human')],reward:{ammo:24,hp:15}},
 {id:'break-order',title:'切断第一道命令',description:'感染人群，并摧毁控制街区的秩序中枢。',objectives:[objective('infected','累计感染人数',10,s=>s.infected,'human'),objective('towers','摧毁秩序中枢',1,s=>s.towers,'tower')],reward:{ammo:32,hp:20}},
 {id:'break-line',title:'突破镇压线',description:'处理净化士兵，继续瓦解秩序网络。',objectives:[objective('purifier','处理净化士兵',1,s=>s.purifiers>=1||s.highestEnemy>=3?1:0,'purifier'),objective('towers','摧毁秩序中枢',2,s=>s.towers,'tower')],reward:{ammo:40,hp:25}},
 {id:'lose-control',title:'让城市失控',description:'让足够多的人醒来，并关闭最后的中枢。',objectives:[objective('infected','累计感染人数',40,s=>s.infected,'human'),objective('towers','摧毁秩序中枢',3,s=>s.towers,'tower')],reward:{ammo:48,hp:25}},
 {id:'final-awakening',title:'推翻秩序巨像',description:'前往中央路口，击败秩序最后的象征。',objectives:[objective('boss','击败秩序巨像',1,s=>s.bossDefeated?1:0,'boss')],reward:{ammo:0,hp:0}},
];

export function tutorialStep(state){return state.tutorialDone?null:TUTORIAL_STEPS[state.tutorialStep]??null;}

export function recordTutorialAction(state,action,amount=1){
 const step=tutorialStep(state);
 if(!step||step.action!==action||amount<=0)return {changed:false,advanced:false,completed:false};
 state.tutorialValue=Math.min(step.target,(state.tutorialValue??0)+amount);
 if(state.tutorialValue<step.target)return {changed:true,advanced:false,completed:false};
 state.tutorialStep++;state.tutorialValue=0;
 const completed=state.tutorialStep>=TUTORIAL_STEPS.length;
 if(completed)state.tutorialDone=true;
 return {changed:true,advanced:true,completed};
}

export function skipTutorial(state){state.tutorialDone=true;state.tutorialSkipped=true;state.tutorialStep=TUTORIAL_STEPS.length;state.tutorialValue=0;}

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
