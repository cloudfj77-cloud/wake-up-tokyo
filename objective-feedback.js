import {WEAKEN_TASKS} from './rules.js';
import {TUTORIAL_STEPS} from './tokyo/gameplay.js';

export function completedObjectives(state){
 const done=[];
 if(state.tokyoTutorial){
  TUTORIAL_STEPS.forEach((s,i)=>{if(state.tokyoTutorial.stage>i)done.push({id:`tutorial-${i}`,title:s.title});});
  if(state.infected>=5)done.push({id:'gather',title:'在下沉广场集结同伴'});
  if(state.infected>=15)done.push({id:'expand',title:'扩大站前行动'});
 }
 if(state.weakenTasks){
  done.push({id:'blockade',title:'突破站前封锁'});
  WEAKEN_TASKS.forEach(s=>{if(state.weakenTasks[s.id])done.push({id:s.id,title:s.name});});
 }
 if(state.bossDefeated)done.push({id:'boss',title:'击败秩序巨像'});
 return done;
}

// Use simulation time so pausing/choosing an upgrade cannot consume the celebration.
export function createObjectiveFeedback(){
 let seen=new Set(),queue=[],active=null,started=0;
 return {
  reset(state){seen=new Set(completedObjectives(state).map(s=>s.id));queue=[];active=null;},
  update(state){
   for(const item of completedObjectives(state))if(!seen.has(item.id)){seen.add(item.id);queue.push(item);}
   const now=state.time||0;
   if(active&&now-started>=2.8)active=null;
   if(!active&&queue.length){active=queue.shift();started=now;}
   return active?{...active,phase:now-started<1.6?'complete':'next'}:null;
  },
 };
}
