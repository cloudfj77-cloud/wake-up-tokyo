import {defineAssetKind} from '@forgeax/engine/assets-runtime';
import {createNavigationGraph,type NavigationGraph} from '@forgeax/engine/navigation';
import type {Point} from './simulation.ts';
export type RouteData={kind:'wakeup-routes';step:number;bounds:{minX:number;minZ:number};positions:string;edges:string};
export const routesKind=defineAssetKind<RouteData>('wakeup-routes');
const decode=(value:string)=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export class RouteGrid{
 private cells=new Map<string,number[]>();readonly positions:Float32Array;private graph:NavigationGraph;
 private source:RouteData;
 constructor(source:RouteData){this.source=source;this.positions=new Float32Array(decode(source.positions).buffer);const pairs=new Uint32Array(decode(source.edges).buffer),edges=[];for(let n=0;n<pairs.length;n+=2)edges.push({from:pairs[n],to:pairs[n+1]});this.graph=createNavigationGraph({positions:this.positions,edges}).unwrap();for(let id=0;id<this.positions.length/3;id++){const key=this.key(this.positions[id*3],this.positions[id*3+2]);let items=this.cells.get(key);if(!items){items=[];this.cells.set(key,items);}items.push(id);}}
 private key(x:number,z:number){return Math.floor((x-this.source.bounds.minX)/this.source.step)+','+Math.floor((z-this.source.bounds.minZ)/this.source.step);}
 nearest(p:Point,radius=6){let result=-1,best=Infinity;const ix=Math.floor((p.x-this.source.bounds.minX)/this.source.step),iz=Math.floor((p.z-this.source.bounds.minZ)/this.source.step);for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++)for(const id of this.cells.get((ix+dx)+','+(iz+dz))??[]){const y=this.positions[id*3+1];const score=(p.x-this.positions[id*3])**2+(p.z-this.positions[id*3+2])**2+(y-(p.floorY??0))**2*4;if(score<best){best=score;result=id;}}return result;}
 sample(p:Point,maxDistance=2){let id=this.nearest(p,Math.min(6,Math.max(1,Math.ceil(maxDistance/this.source.step))));if(id<0&&maxDistance>2)id=this.nearest(p,Math.min(24,Math.ceil(maxDistance/this.source.step)));if(id<0)return null;const x=this.positions[id*3],floorY=this.positions[id*3+1],z=this.positions[id*3+2],horizontal=Math.hypot(x-p.x,z-p.z);if(horizontal>maxDistance)return null;const continuous=horizontal<=this.source.step*.76&&Math.abs(floorY-(p.floorY??floorY))<.4;return{x:continuous?p.x:x,z:continuous?p.z:z,floorY};}
 path(a:Point,b:Point){const start=this.nearest(a),goal=this.nearest(b);if(start<0||goal<0)return[];const route=this.graph.findPath(start,goal,{maxVisited:Math.min(12000,this.positions.length/3)});if(!route.ok)return[];const points:Point[]=[];for(let n=3;n<route.value.points.length;n+=3)points.push({x:route.value.points[n],floorY:route.value.points[n+1],z:route.value.points[n+2]});return points;}
}
