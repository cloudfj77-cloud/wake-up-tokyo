import fs from 'node:fs';import assert from 'node:assert/strict';import {RouteGrid} from '../../assets/game/routes.ts';
const source=JSON.parse(fs.readFileSync('assets/game/routes.pack.json','utf8')).assets['navigation/riverside-graph'].payload;const grid=new RouteGrid(source);
const route=[[5,-3.85,8],[-2.75,-3.85,9.35],[-7.15,-1.65,9.35],[-8.25,-1.65,7.15],[-7.15,-1.65,4.95],[-2.75,0,4.95],[-3.2,0,.5]];
for(let i=1;i<route.length;i++){const p=(v:number[])=>({x:v[0],floorY:v[1],z:v[2]}),points=grid.path(p(route[i-1]),p(route[i]));assert(points.length,'Route disconnected at '+i);console.log('Native graph route',i,points.length,'waypoints');}
