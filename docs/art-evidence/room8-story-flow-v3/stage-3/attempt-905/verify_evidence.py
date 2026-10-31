from pathlib import Path
import subprocess, hashlib, json, shutil
from PIL import Image, ImageChops
root=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3')
out=Path(__file__).parent
base='a4ee8a1ca271185a706e727fc8c62682037f7ccc'
def git(*args): return subprocess.check_output(['git',*args],cwd=root)
def sha(b): return hashlib.sha256(b).hexdigest()
assert git('rev-parse','HEAD').decode().strip()==base
source='src/render/AuthoredRooms.ts'
before=git('show',base+':'+source).decode(); after=(root/source).read_text()
def outside(s):
 a=s.index('function breachedBay(');b=s.index('function reactorFloor(',a)
 return s[:a]+s[b:]
assert outside(before)==outside(after)
changed=git('diff','--name-only').decode().splitlines()
assert changed==[source],changed
canonical=['src/game/roguelike/storyRooms.ts','src/game/roguelike/authoredRoomTopologies.ts','src/game/roguelike/storyRoomTemplates.ts']
for f in canonical: assert git('show',base+':'+f)==(root/f).read_bytes()
result={'base':base,'changedTrackedFiles':changed,'otherRoomProof':{'allCodeOutsideBreachedBayIdentical':True,'outsideFunctionSha256':sha(outside(after).encode()),'canonicalAndTopologyFilesIdentical':canonical,'scope':'Only breachedBay body changed. Fabricator, dispatch, other room builders and all other tracked source files byte-identical to base.'},'images':[]}
previous=out.parents[1]/'stage-2/attempt-904'
capture=json.loads((out/'capture-result.json').read_text())
assert capture['passed'] and not capture['errors']
for name in ['overview.png','desktop-in-scene.png']:
 p=out/name; im=Image.open(p);im.load();assert im.size==(1280,900)
 old=Image.open(previous/name);bbox=ImageChops.difference(im.convert('RGB'),old.convert('RGB')).getbbox();assert bbox
 assert p.stat().st_size<8*1024*1024
 h=sha(p.read_bytes());assert h!=sha((previous/name).read_bytes())
 assert next(r['sha256'] for r in capture['rows'] if r['file']==name)==h
 result['images'].append({'file':name,'sha256':h,'size':im.size,'bytes':p.stat().st_size,'changedPixelBoundingBox':bbox})
for f in [source,'src/render/Room8Visuals.test.ts','src/render/Room8Placement.test.ts']:
 shutil.copyfile(root/f,out/(Path(f).name+'.txt'))
(out/'source.patch').write_bytes(git('diff','--',source))
(out/'artifact-checks.json').write_text(json.dumps(result,indent=2)+'\n')
repoOut=root/'docs/art-evidence/room8-story-flow-v3/stage-3/attempt-905';repoOut.mkdir(parents=True,exist_ok=True)
for name in ['overview.png','desktop-in-scene.png','capture.mjs','capture-result.json','checks.log','artifact-checks.json','source.patch','AuthoredRooms.ts.txt','Room8Visuals.test.ts.txt','Room8Placement.test.ts.txt','verify_evidence.py']:
 shutil.copyfile(out/name,repoOut/name);assert (out/name).read_bytes()==(repoOut/name).read_bytes()
print(json.dumps(result,indent=2))
