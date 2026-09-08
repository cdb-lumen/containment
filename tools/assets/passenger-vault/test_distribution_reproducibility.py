"""Rebuild only new distribution GLBs; accepted row GLBs are immutable inputs."""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from test_reproducibility import decoded_png
ROOT=Path(__file__).resolve().parents[3]
SOURCE=Path('tools/assets/passenger-vault')
OUT=SOURCE/'distribution'
PUBLIC=Path('public/assets/passenger-vault')

def main():
    clean=Path(tempfile.mkdtemp(prefix='passenger-distribution-clean-'))
    print('CLEAN_ROOT '+str(clean),flush=True)
    files=[SOURCE/n for n in ['distribution.py','room_fit.py','test_distribution_geometry.py','test_distribution_artifacts.py']]
    files += [PUBLIC/'chamber.glb',PUBLIC/'row-carrier.glb',Path('src/game/roguelike/authoredRoomTopologies.ts')]
    for p in files:
        (clean/p).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/p,clean/p)
    commands=[['blender','-t','6','--background','--factory-startup','--python-exit-code','1','--python',str(clean/SOURCE/'distribution.py'),'--','--output-root',str(clean)],
              ['blender','-t','6','--background','--factory-startup','--python-exit-code','1','--python',str(clean/SOURCE/'test_distribution_geometry.py')],
              [sys.executable,str(clean/SOURCE/'test_distribution_artifacts.py'),str(clean)]]
    for i,cmd in enumerate(commands):
        with (ROOT/OUT/f'clean-{i}.log').open('w') as log:
            r=subprocess.run(cmd,cwd=clean,stdout=log,stderr=subprocess.STDOUT,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
        print(json.dumps({'command':cmd,'exit_code':r.returncode}),flush=True)
        assert r.returncode==0
    a=json.loads((ROOT/OUT/'manifest.json').read_text());b=json.loads((clean/OUT/'manifest.json').read_text())
    assert a['validation']==b['validation']
    hashes={}
    for name in ['distribution-north.glb','distribution-south.glb','chamber.glb','row-carrier.glb']:
        assert (ROOT/PUBLIC/name).read_bytes()==(clean/PUBLIC/name).read_bytes(),name
        hashes[name]=hashlib.sha256((ROOT/PUBLIC/name).read_bytes()).hexdigest()
    pngs={}
    for p in sorted((ROOT/OUT).glob('*.png')):
        pixels=decoded_png(p);assert pixels==decoded_png(clean/OUT/p.name),p.name;pngs[p.name]=pixels
    assert len(pngs)==5
    result={'passed':True,'clean_root':str(clean),'glb_sha256':hashes,'decoded_pngs':pngs,'blend_byte_identity_claimed':False}
    (ROOT/OUT/'reproducibility.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
