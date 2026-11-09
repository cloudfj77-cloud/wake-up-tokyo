from pathlib import Path
import json,struct,subprocess,os
root=Path(__file__).resolve().parents[2];os.chdir(root);full=root/'assets/imported/full';env=dict(os.environ);env['PATH']=str(root.parent/'.tools/tiangong-pnpm/node_modules/.bin')+':'+env['PATH'];log=open('/private/tmp/wake-native-skin-material-import.log','w')
for path in sorted(full.glob('*.glb')):
 b=path.read_bytes();length=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+length]);binary=b[28+length:];usage={}
 for mesh in g.get('meshes',[]):
  for p in mesh['primitives']:
   if 'material' not in p:continue
   usage.setdefault(p['material'],set()).add('JOINTS_0' in p['attributes'] and 'WEIGHTS_0' in p['attributes'])
 mixed={k for k,v in usage.items() if len(v)>1}
 if not mixed:continue
 replacements={}
 for index in sorted(mixed):
  material=dict(g['materials'][index]);material['name']=material.get('name','material-'+str(index))+'-static';replacements[index]=len(g['materials']);g['materials'].append(material)
 for mesh in g['meshes']:
  for p in mesh['primitives']:
   if p.get('material') in mixed and not ('JOINTS_0' in p['attributes'] and 'WEIGHTS_0' in p['attributes']):p['material']=replacements[p['material']]
 raw=json.dumps(g,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);out=struct.pack('<III',0x46546c67,2,28+len(raw)+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary;path.write_bytes(out)
 meta=path.with_name(path.name+'.meta.json');d=json.loads(meta.read_text());d.pop('sourceOverrides',None);d.pop('sourceOverrideDescriptors',None);meta.write_text(json.dumps(d,indent=2)+'\n')
 r=subprocess.run(['pnpm','exec','forgeax','asset','import',str(path),'--json'],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);log.write(r.stdout);log.flush()
 if r.returncode:raise Exception(r.stdout)
 d=json.loads(meta.read_text());d['importSettings'].update(compressionMode='uastc',downscaleMaxDimension=1024,mipmap=True);meta.write_text(json.dumps(d,indent=2)+'\n');print(path.stem,len(mixed),flush=True)
