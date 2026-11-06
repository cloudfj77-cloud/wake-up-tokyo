// 全队战果进入侧栏；只有直接完成的个人感染点亮中央六尖徽章。
export const CONVERSION_FEEDBACK_SECONDS=1.35/2;
const FEED_SECONDS=4,FEED_LIMIT=5;
export function createConversionFeedback(doc,unitName,onPersonal=()=>{},clock=()=>performance.now()/1000,visualReady=()=>true){
 const emblem=doc.getElementById('infectionFeedback'),feed=doc.getElementById('infectionFeed');
 let personal=new WeakSet(),count=0,shownAt=-Infinity,paintTicket=0,awaitingPaint=false;const entries=[];
 emblem.innerHTML=`<svg class="conversionSeal" viewBox="0 0 120 120" aria-hidden="true"><circle class="sealDisc" cx="60" cy="60" r="44"/><circle class="sealRim" cx="60" cy="60" r="39"/>${Array.from({length:6},(_,i)=>`<g class="sealPoint" transform="rotate(${i*60} 60 60)"><path d="M60 60 48 45 60 5 72 45Z"/><path class="sealFacet" d="M60 60 60 5 72 45Z"/></g>`).join('')}<circle class="sealCore" cx="60" cy="60" r="4"/></svg><b>感染成功</b><small>0 / 6</small>`;
 const points=[...emblem.querySelectorAll('.sealPoint')];
 emblem.setAttribute('role','status');feed.setAttribute('aria-label','感染成功记录');
 function markPersonal(unit){personal.add(unit);}
 function record(unit){
  const direct=personal.delete(unit),at=clock(),row=doc.createElement('div'),name=doc.createElement('b'),source=doc.createElement('small');
  row.className=`infectionEntry${direct?' personal':''}`;
  name.textContent=unitName(unit);source.textContent=direct?'你亲自感染':unit.fromArmy?'友军感染':'感染扩散';
  row.append(name,source);feed.prepend(row);entries.unshift({node:row,at});
  while(entries.length>FEED_LIMIT)entries.pop().node.remove();
  if(!direct)return;
  count++;const lit=(count-1)%6+1;shownAt=at;
  // Start the short lifetime after the first paint, so an initial model/shader upload cannot consume it.
  const ticket=++paintTicket;awaitingPaint=!!doc.defaultView?.requestAnimationFrame;
  if(awaitingPaint){const afterPaint=()=>{if(ticket!==paintTicket)return;if(!visualReady(unit)&&clock()-at<1){doc.defaultView.requestAnimationFrame(afterPaint);return;}shownAt=clock();awaitingPaint=false;};doc.defaultView.requestAnimationFrame(()=>{if(ticket===paintTicket)doc.defaultView.requestAnimationFrame(afterPaint);});}
  emblem.dataset.points=String(lit);emblem.querySelector('small').textContent=`${lit} / 6`;
  points.forEach((point,i)=>point.classList.toggle('lit',i<lit));
  emblem.classList.remove('active');void emblem.offsetWidth;emblem.classList.add('active');
  onPersonal();
 }
 function tick(playing=true){
  const at=clock(),age=at-shownAt,visible=playing&&(awaitingPaint||age<CONVERSION_FEEDBACK_SECONDS);
  emblem.style.opacity=visible?String(awaitingPaint?1:Math.min(1,(CONVERSION_FEEDBACK_SECONDS-age)/.14)):'0';
  if(!visible)emblem.classList.remove('active');
  for(let i=entries.length-1;i>=0;i--){const entry=entries[i],left=FEED_SECONDS-(at-entry.at);if(left<=0){entry.node.remove();entries.splice(i,1);}else entry.node.style.opacity=String(Math.min(1,left/.4));}
 }
 function reset(){
  personal=new WeakSet();count=0;shownAt=-Infinity;paintTicket++;awaitingPaint=false;emblem.dataset.points='0';
  points.forEach(point=>point.classList.remove('lit'));emblem.querySelector('small').textContent='0 / 6';
  for(const entry of entries)entry.node.remove();entries.length=0;tick(false);
 }
 reset();return{markPersonal,record,tick,reset};
}
