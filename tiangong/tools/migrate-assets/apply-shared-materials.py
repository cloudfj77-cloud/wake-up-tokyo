from pathlib import Path
import json,struct,subprocess,os
root=Path(__file__).resolve().parents[2];os.chdir(root);full=root/'assets/imported/full';env=dict(os.environ);env['PATH']=str(root.parent/'.tools/tiangong-pnpm/node_modules/.bin')+':'+env['PATH'];mapping=json.loads((root/'tools/migrate-assets/shared-material-stage/shared-material-remap.json').read_text());log=open('/private/tmp/wake-native-shared-material-import.log','w')
for name in ['tidewater','tokyo']:
 p=full/f'materials-{name}.glb';b=p.read_bytes();jl=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+jl]);binary=b[28+jl:];g.pop('materials',None);raw=json.dumps(g,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);p.write_bytes(struct.pack('<III',0x46546c67,2,28+len(raw)+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary)
 r=subprocess.run(['pnpm','exec','forgeax','asset','import',str(p),'--json'],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);log.write(r.stdout);log.flush()
 if r.returncode:raise Exception(r.stdout)
 meta=p.with_name(p.name+'.meta.json');d=json.loads(meta.read_text());d['importSettings'].update(compressionMode='uastc',downscaleMaxDimension=1024,mipmap=True);meta.write_text(json.dumps(d,indent=2)+'\n')
changed=0
for p in full.glob('*-part-*.glb.meta.json'):
 d=json.loads(p.read_text())
 for value in d.get('sourceOverrides',{}).values():
  for name,guid in value.get('materialSlotDefaultOverrides',{}).items():
   if guid in mapping:value['materialSlotDefaultOverrides'][name]=mapping[guid];changed+=1
  overrides=value.get('materialSlotDefaultOverrides',{})
  if 'Default' in overrides:overrides['gltf:default']=overrides.pop('Default')
 p.write_text(json.dumps(d,indent=2)+'\n')
print('Map mesh slots now point at authored shared materials:',changed)
