from pathlib import Path
import json,hashlib,math,shutil
project=Path(__file__).resolve().parents[2]
original=project.parent/'.tools/pr31-32-integration'
sea=json.loads((project/'tools/migrate-assets/exports/tidewater-nav.json').read_text())
tokyo=json.loads((original/'assets/scenes/tokyo-navigation.json').read_text())
def build(points,step):
 cells={}
 for i,(x,y,z) in enumerate(points):cells.setdefault((round(x/step),round(z/step)),[]).append(i)
 polygons=[];edges={};seen=set()
 def triangle(a,b,c):
  key=tuple(sorted([a,b,c]));pairs=[tuple(sorted([a,b])),tuple(sorted([b,c])),tuple(sorted([c,a]))]
  if key in seen or any(edges.get(e,0)>=2 for e in pairs):return
  seen.add(key);polygons.append([a,b,c])
  for e in pairs:edges[e]=edges.get(e,0)+1
 def near(x,z,height):
  candidates=cells.get((x,z),[])
  if not candidates:return None
  i=min(candidates,key=lambda i:abs(points[i][1]-height))
  return i if abs(points[i][1]-height)<=.7 else None
 for a,(x,y,z) in enumerate(points):
  ix,iz=round(x/step),round(z/step);b=near(ix,iz+1,y);d=near(ix+1,iz,y)
  if b is None or d is None:continue
  c=near(ix+1,iz+1,(points[b][1]+points[d][1])/2)
  if c is not None:triangle(a,b,c);triangle(a,c,d)
 assert 0<len(polygons)<=131072,(len(points),len(polygons))
 data={'kind':'navigation-mesh','version':'recast-poly/1','sourceDigest':hashlib.sha256(json.dumps(points,separators=(',',':')).encode()).hexdigest(),'settings':{'radius':.16,'height':.94,'maxSlopeDeg':48,'maxStep':.32,'cellSize':step,'cellHeight':.05},'vertices':[v for point in points for v in point],'polygons':polygons}
 return data
def fine_city():
 points=[[round(tokyo['bounds']['minX']+(n[0]+.5)*tokyo['step'],3),n[2],round(tokyo['bounds']['minZ']+(n[1]+.5)*tokyo['step'],3)] for n in tokyo['nodes']]
 cells={}
 for i,n in enumerate(tokyo['nodes']):cells.setdefault((n[0],n[1]),[]).append(i)
 def at(x,z,y):
  options=cells.get((x,z),[])
  if not options:return None
  i=min(options,key=lambda i:abs(points[i][1]-y))
  return i if abs(points[i][1]-y)<=.7 else None
 quads={}
 for a,n in enumerate(tokyo['nodes']):
  ix,iz,y=n[:3];b=at(ix,iz+1,y);d=at(ix+1,iz,y);c=at(ix+1,iz+1,y)
  if b is not None and c is not None and d is not None:quads[(a,b,c,d)]=(ix,iz)
 by_origin={q[0]:q for q in quads};used=set();polygons=[];edges={};seen=set()
 def polygon(ids):
  key=tuple(sorted(ids));pairs=[tuple(sorted([ids[k],ids[(k+1)%len(ids)]])) for k in range(len(ids))]
  if key in seen or any(edges.get(edge,0)>=2 for edge in pairs):return
  seen.add(key);polygons.append(ids)
  for edge in pairs:edges[edge]=edges.get(edge,0)+1
 for q,(ix,iz) in quads.items():
  if q in used:continue
  a,b,c,d=q;ys=[points[i][1] for i in q];flat=max(ys)-min(ys)<.015;right=by_origin.get(d)
  if flat and right and right not in used and right[1]==c and max(points[i][1] for i in right)-min(ys)<.015 and max(ys)-min(points[i][1] for i in right)<.015:
   polygon([a,b,c,right[2],right[3],d]);used.add(right)
  elif flat:polygon([a,b,c,d])
  else:polygon([a,b,c]);polygon([a,c,d])
  used.add(q)
 assert len(polygons)<=131072,(len(points),len(polygons))
 data=build([],tokyo['step']) if False else {'kind':'navigation-mesh','version':'recast-poly/1','sourceDigest':hashlib.sha256(json.dumps(points,separators=(',',':')).encode()).hexdigest(),'settings':{'radius':.16,'height':.94,'maxSlopeDeg':48,'maxStep':.32,'cellSize':tokyo['step'],'cellHeight':.05},'vertices':[v for point in points for v in point],'polygons':polygons}
 return data
navs={'tidewater':build(sea['points'],.5),'riverside':fine_city()}
assets={f'navigation/{name}':{'kind':'navigation-mesh','payload':data,'refs':[]} for name,data in navs.items()}
(project/'assets/game/navigation.pack.json').write_text(json.dumps({'schemaVersion':'3.0.0','packageId':'a8c0900a-edce-418e-971f-12299e563ffb','assets':assets},separators=(',',':')))
info={'tidewater':{'id':'tidewater','name':'海滨钟楼广场','spawn':{**sea['spawn'],'floorY':0},'bossSpawn':{**sea['bossSpawn'],'floorY':0},'entries':sea['entries']},'riverside':{'id':'riverside','name':'东京立体街区','spawn':{'x':5,'z':8,'floorY':-3.85},'bossSpawn':{'x':10,'z':-9,'floorY':0},'entries':[[-13,-16],[16,-16],[-16,16],[16,16]],'syringe':{'x':-3.2,'z':.5,'floorY':0}}}
(project/'assets/game/map-info.ts').write_text('export const MAP_INFO = '+json.dumps(info,ensure_ascii=False,separators=(',',':'))+' as const;\n')
shutil.copy2(original/'tokyo/gameplay.js',project/'assets/game/tokyo-gameplay.js')
for name,data in navs.items():print(name,len(data['vertices'])//3,len(data['polygons']))
