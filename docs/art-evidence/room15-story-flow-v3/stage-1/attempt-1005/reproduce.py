"""Reproduce CPU checks and PNG, verify sources, then mirror this attempt only."""
from pathlib import Path
import hashlib,json,subprocess,sys,shutil
from PIL import Image
D=Path(__file__).resolve().parent
R=D.parents[4]
W=Path('/home/chernodubv/.hermes/workspaces/containment-art-roadmap')
M=W/'infested-workshop/story-flow-v3/stage-1/attempt-1005'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):return subprocess.run(args,cwd=R,text=True,capture_output=True)
assert (R/'src').is_dir(),R
pins=json.loads((R/'docs/art-evidence/room15-story-flow-v3/stage-0/attempt-1004/source-pins.json').read_text())
canonical={p:{'expected':h,'actual':sha(W/p)} for p,h in pins['canonical_inputs'].items()}
assert all(v['actual']==v['expected'] for v in canonical.values())
head=run(['git','rev-parse','HEAD']).stdout.strip()
assert head=='89725b920eca96e375f34abcef5d7e72ed631495'
assert run(['git','merge-base','--is-ancestor',pins['base'],'HEAD']).returncode==0
assert not run(['git','diff','HEAD','--','src','public','scripts','tests','package.json','package-lock.json']).stdout
sources={str(p.relative_to(R)):sha(p) for p in sorted((R/'src').rglob('*')) if p.is_file()}
font=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
source_pins={'head':head,'base':pins['base'],'canonical_inputs':canonical,'production_sources':sources,'font':{'path':str(font),'sha256':sha(font)},'typescript_package':'/home/chernodubv/dev/alien-shooter-containment/node_modules/typescript','typescript_version':json.loads(Path('/home/chernodubv/dev/alien-shooter-containment/node_modules/typescript/package.json').read_text())['version']}
(D/'source-pins.json').write_text(json.dumps(source_pins,indent=2)+'\n')
p=run(['node','--loader',str(D/'ts-loader.mjs'),str(D/'validate-layout.mjs')]);(D/'validation.log').write_text(p.stdout+p.stderr);assert p.returncode==0,p.stderr
p=run([sys.executable,str(D/'render_layout.py')]);assert p.returncode==0,p.stderr
first=sha(D/'layout.png')
p=run([sys.executable,str(D/'render_layout.py')]);assert p.returncode==0,p.stderr
assert first==sha(D/'layout.png')
with Image.open(D/'layout.png') as im:
 im.load(); size=im.size;assert im.format=='PNG' and size==(1800,1280)
assert (D/'layout.png').stat().st_size<8*1024*1024
assert run(['git','diff','--check']).returncode==0
allowed='docs/art-evidence/room15-story-flow-v3/stage-1/attempt-1005/'
status=run(['git','status','--porcelain','--untracked-files=all']).stdout
assert all(line[3:].startswith(allowed) for line in status.splitlines()),status
results=json.loads((D/'test-results.json').read_text())
summary={'scope':'Local draft. No publication, acceptance or runtime edit.','canonical_hashes_match':True,'runtime_unchanged':True,'worktree_writes_scoped':True,'git_whitespace_pass':True,'production_checks':len(results['checks']),'failures':results['failures'],'errors':results['errors'],'deterministic_png':True,'png':{'size':size,'bytes':(D/'layout.png').stat().st_size,'sha256':first},'commands':['node --loader '+allowed+'ts-loader.mjs '+allowed+'validate-layout.mjs','python3 '+allowed+'render_layout.py','git diff --check'],'limitations':'No browser, GPU, live combat, model fit, full verifier or human acceptance. Corner-grid and larger-radius diagnostics are retained in test-results.json.'}
(D/'verification.json').write_text(json.dumps(summary,indent=2)+'\n')
# Exclude the manifest itself to avoid a self-referential digest.
manifest={p.name:sha(p) for p in sorted(D.iterdir()) if p.is_file() and p.name!='artifact-manifest.json'}
(D/'artifact-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
M.mkdir(parents=True,exist_ok=True)
for p in D.iterdir():
 if p.is_file():shutil.copy2(p,M/p.name)
assert all(sha(D/name)==sha(M/name) for name in manifest)
print(json.dumps(summary,indent=2))
