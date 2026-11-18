from pathlib import Path
import json
p=Path(__file__).resolve().parents[2];dims=json.loads((p/'tools/migrate-assets/exports/dimensions.json').read_text())
lookup={'player':('player',.935),'worker':('humanMale',.88),'guard':('guard',.9625),'shield-cop':('shieldCop',.9625),'baton-cop':('batonCop',.9625),'infected-cop':('infectedCop',.8525),'ally-0':('allyVariants',.88),'ally-1':('allyVariants',.88)}
refs={}
for f in sorted((p/'assets/imported/full').glob('*.glb.meta.json')):
 name=f.name.removesuffix('.glb.meta.json');d=json.loads(f.read_text());subs=d['subAssets'];scene=next(a['guid'] for a in subs if a['kind']=='scene');ref={'scene':scene,'meshes':[a['guid'] for a in subs if a['kind']=='mesh'],'clips':{a.get('name','default'):a['guid'] for a in subs if a['kind']=='animation-clip'}}
 if name in lookup:
  key,height=lookup[name];info=dims[key][int(name[-1])] if key=='allyVariants' else dims[key]
  ref.update(height=height,sourceHeight=info['height'],minY=info['minY'],durations={a['name']:a['duration'] for a in info['clips']})
 refs[name]=ref
(p/'assets/game/asset-refs.ts').write_text('export const FULL_ASSETS = '+json.dumps(refs,ensure_ascii=False,indent=2)+' as const;\n')
print('Asset sources',len(refs))
