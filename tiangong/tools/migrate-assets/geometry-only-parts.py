from pathlib import Path
import json,struct,subprocess,os
root=Path(__file__).resolve().parents[2];os.chdir(root);full=root/'assets/imported/full';env=dict(os.environ);env['PATH']=str(root.parent/'.tools/tiangong-pnpm/node_modules/.bin')+':'+env['PATH'];log=open('/private/tmp/wake-native-geometry-parts-import.log','w')
for path in sorted(full.glob('*-part-*.glb')):
 b=path.read_bytes();length=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+length]);binary=b[28+length:];meta=path.with_name(path.name+'.meta.json');d=json.loads(meta.read_text());overrides={}
 for mesh in g['meshes']:
  if len(mesh['primitives'])!=1:raise Exception('Multi-primitive source needs explicit per-slot conversion')
  key='mesh:'+mesh['name'];old=d.get('sourceOverrides',{}).get(key,{})
  slots=old.get('materialSlots',[]);defaults=old.get('materialSlotDefaultOverrides',{});target=next(iter(defaults.values()),None) or next((v.get('defaultMaterialGuid')for v in slots if v.get('defaultMaterialGuid')),None)
  if target:overrides[key]={'materialSlotDefaultOverrides':{'gltf:default':target}}
  mesh['primitives'][0].pop('material',None)
 g.pop('materials',None);g.pop('textures',None);g.pop('images',None);g.pop('samplers',None)
 raw=json.dumps(g,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);out=struct.pack('<III',0x46546c67,2,28+len(raw)+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary;path.write_bytes(out)
 d.pop('sourceOverrides',None);d.pop('sourceOverrideDescriptors',None);d['importSettings'].pop('standardMaterialGuid',None);meta.write_text(json.dumps(d,indent=2)+'\n')
 r=subprocess.run(['pnpm','exec','forgeax','asset','import',str(path),'--json'],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);log.write(r.stdout);log.flush()
 if r.returncode:raise Exception(r.stdout)
 d=json.loads(meta.read_text());d['sourceOverrides']=overrides;meta.write_text(json.dumps(d,indent=2)+'\n');print(path.stem,flush=True)
