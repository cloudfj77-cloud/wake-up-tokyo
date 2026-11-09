export type Rect={left:number;right:number;top:number;bottom:number};
export function placeLabel(x:number,y:number,width:number,height:number,screenWidth:number,screenHeight:number,reserved:Rect[],previous=0){
 for(const offset of [...new Set([previous,0,-24,-48,-72])]){const rect={left:x-width/2-3,right:x+width/2+3,top:y+offset-height-3,bottom:y+offset+3};if(rect.left<8||rect.right>screenWidth-8||rect.top<8||rect.bottom>screenHeight-8)continue;if(reserved.some(b=>rect.left<b.right&&rect.right>b.left&&rect.top<b.bottom&&rect.bottom>b.top))continue;return{rect,offset};}return null;
}
