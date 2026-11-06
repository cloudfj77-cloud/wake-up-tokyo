// 百分比坐标对应原画中的文字区；保留原分镜、人物与动态片段，只替换对白和页眉。
export const COMIC_ZH={
 'act1-the-loop.png':[
  {panel:'01-panel',x:0,y:0,w:100,h:5.2,text:'第一幕：日复一日　　地点：东京',kind:'header',size:1.9},
  {panel:'07-panel',x:1.5,y:96.3,w:98,h:3.7,text:'城市监控 · 早班记录　　　　　　　　　实时画面 · 七号镜头',kind:'footer',size:1.1},
  {panel:'02-panel',x:80.3,y:11.4,w:16.5,h:3.1,text:'员工编号：七四二',kind:'screen',size:1.4},
 ],
 'act2.png':[
  {panel:'03-panel',x:2.4,y:3.5,w:8.4,h:4.3,text:'又是平凡\n的一天……',kind:'note',size:1.05},
  {panel:'01-panel',x:46.7,y:3.6,w:5.5,h:4.7,text:'啊！',kind:'speech',size:2.5},
  {panel:'06-panel',x:2.6,y:38.8,w:4.0,h:5.1,text:'等等……\n这是……',kind:'speech',size:.95},
  {panel:'05-panel',x:51.8,y:48.6,w:4.2,h:4.2,text:'我？',kind:'speech',size:1.6},
  {panel:'09-panel',x:1.7,y:66.8,w:9.5,h:4.4,text:'我想起来了……\n我喜欢跳舞！',kind:'note',size:1.03},
  {panel:'08-panel',x:35.3,y:68.5,w:7.2,h:4.3,text:'这才是\n真正的我！',kind:'note',size:1.05},
  {panel:'04-panel',x:60.4,y:55.2,w:35.5,h:26,text:'砰！',kind:'burst',size:14},
 ],
 'act3.png':[
  {panel:'01-panel',x:0,y:0,w:100,h:5.4,text:'第二幕：觉醒时刻　　地点：东京',kind:'header',size:1.9},
  {panel:'01-panel',x:1.4,y:94.6,w:97.3,h:5.3,text:'城市监控 · 觉醒记录　　　　　　　　　实时画面 · 七号镜头',kind:'footer',size:1.0},
  {panel:'01-panel',x:23.5,y:22.4,w:11,h:3.9,text:'醒过来！',kind:'ink',size:2.05},
  {panel:'01-panel',x:64.8,y:87.0,w:20.2,h:7.3,text:'醒过来！',kind:'ink',size:3.7},
 ],
};
export function comicChineseLabels(page,piece){
 const stem=piece.src.split('/').pop().replace(/\.[^.]+$/,'');
 return (COMIC_ZH[page.source?.split('/').pop()]||[]).filter(r=>r.panel===stem).map(r=>({...r,left:(r.x-piece.x)/piece.w*100,top:(r.y-piece.y)/piece.h*100,width:r.w/piece.w*100,height:r.h/piece.h*100}));
}
