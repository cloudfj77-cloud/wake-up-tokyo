// 只在显式性能采样时记录耗时；正式游戏不创建采样器或额外的界面。
export function createRuntimeProfiler(output,{clock=()=>performance.now(),windowSize=120}={}){
 let start=0,mark=0,previous=0,mode='',parts={},samples=[],publish=0;
 return {
  begin(timestamp,currentMode){start=mark=clock();mode=currentMode;parts={};parts.interval=previous?timestamp-previous:0;previous=timestamp;},
  mark(name){const now=clock();parts[name]=(parts[name]||0)+now-mark;mark=now;},
  end(details={}){
   if(mode!=='playing'){samples=[];return;}
   samples.push({...parts,cpu:clock()-start,...details});if(samples.length>windowSize)samples.shift();
   if(clock()-publish<500||samples.length<10)return;publish=clock();
   const avg=key=>samples.reduce((s,v)=>s+(v[key]||0),0)/samples.length,intervals=samples.map(s=>s.interval).sort((a,b)=>a-b);
   output.textContent=JSON.stringify({samples:samples.length,fps:1000/avg('interval'),frameP95:intervals[Math.floor(intervals.length*.95)],cpu:avg('cpu'),phases:Object.fromEntries(Object.keys(parts).filter(k=>k!=='interval').map(k=>[k,avg(k)])),calls:avg('calls'),triangles:avg('triangles'),actors:details.activeActors,pixelRatio:details.pixelRatio,staticShadows:details.staticShadows,actorBatches:details.actorBatches});
  }
 };
}

// 按帧预算逐步调整 3D 绘制，使用调用方指定的下限；HUD 保持原分辨率。
export function createRenderBudget(maxRatio,minRatio=Math.min(1,maxRatio)){
 let ratio=maxRatio,warmup=0,elapsed=0,cost=0,work=0,frames=0,cooldown=0,stable=0;
 return {
  sample(ms,workMs=0){
   // 切后台、资源首次编译和单次卡顿不作为降档依据，避免画面无故变化。
   if(!Number.isFinite(ms)||ms<=0||ms>250)return null;
   warmup+=ms;if(warmup<3000)return null;
   elapsed+=ms;cost+=Math.min(ms,50);work+=Number.isFinite(workMs)?Math.max(0,workMs):50;frames++;cooldown=Math.max(0,cooldown-ms);
   if(elapsed<1000||frames<20)return null;
   const mean=cost/frames;stable=mean<16.9&&work/frames<12?stable+elapsed:0;elapsed=0;cost=work=0;frames=0;
   if(mean>17.4&&ratio>minRatio&&cooldown===0){ratio=Math.max(minRatio,ratio-.25);cooldown=1500;stable=0;return ratio;}
   // 既要连续流畅，也要有绘制余量。刚好跑满 60 帧时升画质会重新掉帧。
   if(stable>20000&&ratio<maxRatio){ratio=Math.min(maxRatio,ratio+.125);cooldown=3000;stable=0;return ratio;}
   return null;
  }
 };
}
