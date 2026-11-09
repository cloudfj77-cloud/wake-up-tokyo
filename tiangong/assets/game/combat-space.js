// Floor identity applies to contact attacks and ground auras, not aimed projectiles.
export function sameCombatLayer(a,b,tolerance=1.2){
 return !Number.isFinite(a?.floorY)||!Number.isFinite(b?.floorY)||Math.abs(a.floorY-b.floorY)<=tolerance;
}
export function canMeleeReach(world,a,b,range){
 if(Math.hypot(a.x-b.x,a.z-b.z)>range)return false;
 const ground=p=>world.multilevel?world.heightAt(p.x,p.z,p.floorY):(p.floorY??0);
 if(Math.abs(ground(a)+(a.y||0)-ground(b)-(b.y||0))>1.2)return false;
 return world.clear?.(a,b)!==false;
}
