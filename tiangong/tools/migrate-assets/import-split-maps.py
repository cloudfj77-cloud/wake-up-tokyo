from pathlib import Path
import json,subprocess,os
root=Path(__file__).resolve().parents[2];os.chdir(root);env=dict(os.environ);env['PATH']=str(root.parent/'.tools/tiangong-pnpm/node_modules/.bin')+':'+env['PATH'];out=open('/private/tmp/wake-native-split-imports.log','w')
full=root/'assets/imported/full';original=root/'tools/migrate-assets/whole'
for name in ['tidewater','tokyo']:
 p=full/f'materials-{name}.glb';r=subprocess.run(['pnpm','exec','forgeax','asset','import',str(p),'--json'],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);out.write(r.stdout);out.flush()
 if r.returncode:raise SystemExit(r.stdout)
 meta=p.with_name(p.name+'.meta.json');d=json.loads(meta.read_text());old=json.loads((original/f'{name}.glb.meta.json').read_text());identities={(a['kind'],a['sourceKey']):a['guid'] for a in old['subAssets'] if a['kind']!='scene'}
 for a in d['subAssets']:
  a['guid']=identities.get((a['kind'],a['sourceKey']),a['guid'])
 meta.write_text(json.dumps(d,indent=2)+'\n')
for p in sorted(full.glob('*.glb')):
 if not any(k in p.stem for k in ['-part-','-shape-']):continue
 r=subprocess.run(['pnpm','exec','forgeax','asset','import',str(p),'--json'],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);out.write(r.stdout);out.flush()
 if r.returncode:raise SystemExit(r.stdout)
 meta=p.with_name(p.name+'.meta.json');d=json.loads(meta.read_text())
 if '-shape-' in p.stem:d['importSettings']['meshCollision']=True
 else:
  name=p.stem.split('-part-')[0];library=json.loads((full/f'materials-{name}.glb.meta.json').read_text());materials={a['name']:a['guid'] for a in library['subAssets'] if a['kind']=='material'}
  for key,override in d.get('sourceOverrides',{}).items():
   if not key.startswith('mesh:'):continue
   replacements={}
   for slot in override.get('materialSlots',[]):
    target=materials.get(slot['slotName'])
    if target:replacements[slot['slotName']]=target
    elif slot['slotName']!='Default':raise Exception('Shared material missing: '+slot['slotName'])
   override['materialSlotDefaultOverrides']=replacements
 meta.write_text(json.dumps(d,indent=2)+'\n');print(p.stem,flush=True)
