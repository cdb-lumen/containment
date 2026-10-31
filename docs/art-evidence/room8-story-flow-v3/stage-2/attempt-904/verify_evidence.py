"""Verify source-pinned Room8 stage2 PNGs before parent publication."""
from pathlib import Path
import hashlib,json
from PIL import Image
out=Path(__file__).resolve().parent
root=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3')
workspace=Path('/home/chernodubv/.hermes/workspaces/containment-art-roadmap')
health=json.loads((workspace/'production-health.json').read_text())
assert health['pending']=={'completed_start':904,'stage_index':2}
assert health['accepted']['1']==903
result=json.loads((out/'capture-result.json').read_text())
assert result['passed'] and not result['errors']
for file,sha in result['source'].items():
 assert hashlib.sha256((root/file).read_bytes()).hexdigest()==sha
rows=[]
for row in result['rows']:
 file=out/row['file']; data=file.read_bytes();sha=hashlib.sha256(data).hexdigest()
 assert sha==row['sha256'] and sha not in health['seen_sha256']
 with Image.open(file) as image:
  image.load();assert image.format=='PNG' and image.size==(1280,900)
 assert len(data)<8*1024*1024
 target=root/'docs/art-evidence/room8-story-flow-v3/stage-2/attempt-904'/file.name
 assert target.read_bytes()==data
 rows.append({'file':file.name,'sha256':sha,'bytes':len(data),'size':[1280,900]})
assert len(rows)==2 and len({r['sha256'] for r in rows})==2
report={'pngs':rows,'sourcePinsMatch':True,'novelAgainstGuard':True,'repositoryCopiesExact':True,'failures':0,'errors':0}
(out/'artifact-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
