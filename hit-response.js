// 轻击约两帧、重击约五帧的停顿；只在实际命中时使用，不叠加多个目标的时长。
export const HIT_RESPONSE=Object.freeze({
 light:Object.freeze({stop:.035,flash:.055,recoil:.14,tilt:.2,kick:.055,burst:1.15,duration:.2}),
 heavy:Object.freeze({stop:.085,flash:.11,recoil:.26,tilt:.34,kick:.12,burst:1.85,duration:.3})
});
// 只交换这一个人物的网格材质，白色材质可共享；原有士兵材质保持不动。
export function flashCharacter(visual,whiteMaterial,seconds){
 if(!visual?.meshes)return;
 if(!visual.hitFlash){visual.hitFlash={remaining:seconds,originals:visual.meshes.map(mesh=>({mesh,material:mesh.material}))};}
 visual.hitFlash.remaining=Math.max(visual.hitFlash.remaining,seconds);
 for(const {mesh} of visual.hitFlash.originals)mesh.material=whiteMaterial;
}
export function restoreCharacterFlash(visual){
 if(!visual?.hitFlash)return;
 for(const {mesh,material} of visual.hitFlash.originals)mesh.material=material;
 visual.hitFlash=null;
}
export function stepCharacterFlash(visual,dt){
 if(!visual?.hitFlash)return;
 visual.hitFlash.remaining-=dt;
 if(visual.hitFlash.remaining<=0)restoreCharacterFlash(visual);
}
export function stepHitStop(remaining,realDt){
 const held=Math.min(Math.max(0,remaining),realDt);
 return {remaining:Math.max(0,remaining-held),dt:realDt-held};
}
