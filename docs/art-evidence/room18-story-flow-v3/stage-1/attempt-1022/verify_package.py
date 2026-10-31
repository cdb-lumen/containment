"""Verify and copy only this attempt's artifact package. No git writes."""
import hashlib,json,subprocess,sys,shutil
from pathlib import Path
from PIL import Image
here=Path(__file__).resolve().parent
repo=Path(sys.argv[1]).resolve()
workspace=Path('/home/chernodubv/.hermes/workspaces/containment-art-roadmap')
pub=repo/'docs/art-evidence/room18-story-flow-v3/stage-1/attempt-1022'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
run=subprocess.run(['node',str(here/'check_layout.cjs'),str(repo)],capture_output=True,text=True)
(here/'cpu-check.log').write_text(run.stdout+run.stderr)
assert run.returncode==0,run.stdout+run.stderr
subprocess.run([sys.executable,str(here/'render_layout.py')],check=True)
first=sha(here/'layout-draft.png')
subprocess.run([sys.executable,str(here/'render_layout.py')],check=True)
assert first==sha(here/'layout-draft.png')
with Image.open(here/'layout-draft.png') as im:
    im.load();size=list(im.size);assert im.format=='PNG' and im.width*im.height<=16000000
assert (here/'layout-draft.png').stat().st_size<=8*1024*1024
old=json.loads((workspace/'containment-annulus/story-flow-v3/stage-0/attempt-1021/source-pins.json').read_text())
pins={}
for name,expected in old['canonical_inputs'].items():
    got=sha(workspace/name);assert got==expected,(name,got,expected);pins[name]=got
for name in ['storyRooms.ts','storyRoomTemplates.ts','roomTemplates.ts']:
    assert (workspace/'rollout-sources'/name).read_bytes()==(repo/'src/game/roguelike'/name).read_bytes(),name
checks=json.loads((here/'checks.json').read_text())
assert checks['failures']==0 and checks['tests']==len(checks['checks'])
for name,expected in checks['source_sha256'].items():assert sha(repo/name)==expected,name
tracked=subprocess.check_output(['git','diff','--name-only','HEAD'],cwd=repo,text=True).splitlines()
assert not tracked,tracked
report={'task_id':'room18-story-flow-v3','stage_index':1,'attempt':1022,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'canonical_source_commit':old['source_commit'],'canonical_inputs':pins,'canonical_snapshot_equals_worktree':True,'runtime_source_sha256':checks['source_sha256'],'png':{'file':'layout-draft.png','size':size,'bytes':(here/'layout-draft.png').stat().st_size,'sha256':first,'decoded':True,'deterministic_regeneration':True},'focused_cpu':{'tests':checks['tests'],'failures':checks['failures']},'tracked_diff_before_copy':tracked,'scope':'Only authored evidence. No gameplay, camera, full build or test-suite claim.'}
(here/'package-verification.json').write_text(json.dumps(report,indent=2)+'\n')
names=['layout-draft.png','layout-initial.png','layout-data.json','render_layout.py','check_layout.cjs','checks.json','cpu-check.log','brief.md','verify_package.py','package-verification.json']
pub.mkdir(parents=True,exist_ok=True)
for name in names:
    shutil.copy2(here/name,pub/name)
    assert sha(here/name)==sha(pub/name),name
print(json.dumps({'focused_cpu':report['focused_cpu'],'png':report['png'],'canonical_snapshot_equals_worktree':True,'copied_files':len(names),'publication_directory':str(pub)},indent=2))
