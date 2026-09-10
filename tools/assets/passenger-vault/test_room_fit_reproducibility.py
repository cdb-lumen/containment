"""Clean-root installed fixture reproduction. Inputs are immutable approved GLBs."""
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from test_reproducibility import decoded_png
ROOT=Path(__file__).resolve().parents[3]
SOURCE=Path('tools/assets/passenger-vault')
OUT=ROOT/SOURCE/'room-fit'

def main():
    clean=Path(tempfile.mkdtemp(prefix='passenger-whole-room-'))
    files=[SOURCE/n for n in ['room_fit.py','test_room_fit.py','test_room_fit_artifacts.py','test_reproducibility.py']]
    files += [Path('src/game/roguelike/authoredRoomTopologies.ts')]
    files += [Path('public/assets/passenger-vault')/n for n in ['chamber.glb','row-carrier.glb']]
    for path in files:
        (clean/path).parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(ROOT/path,clean/path)
    commands=[['blender','--background','--factory-startup','--python-exit-code','1','--python',str(clean/SOURCE/'room_fit.py'),'--','--output-root',str(clean)],
              ['blender','--background','--factory-startup','--python-exit-code','1','--python',str(clean/SOURCE/'test_room_fit.py')],
              [sys.executable,str(clean/SOURCE/'test_room_fit_artifacts.py'),str(clean)]]
    results=[]
    for i,command in enumerate(commands):
        log=OUT/f'clean-{i}.log'
        with log.open('w') as stream:
            result=subprocess.run(command,cwd=clean,stdout=stream,stderr=subprocess.STDOUT)
        results.append(dict(command=command,exit_code=result.returncode,log=str(log.relative_to(ROOT))))
        assert result.returncode==0,results[-1]
    a=json.loads((OUT/'manifest.json').read_text()); b=json.loads((clean/SOURCE/'room-fit/manifest.json').read_text())
    for key in ['validation','solids','inputs']:
        assert a[key]==b[key],key
    pngs={}
    for name in ['whole-room-top.png','whole-room-oblique.png']:
        pixels=decoded_png(OUT/name)
        assert pixels==decoded_png(clean/SOURCE/'room-fit'/name),name
        pngs[name]=pixels
    for path in files[-2:]:
        assert (ROOT/path).read_bytes()==(clean/path).read_bytes()
    report=dict(passed=True,clean_root=str(clean),commands=results,decoded_pngs=pngs,
                input_glbs='Copied approved immutable GLBs, not regenerated; original builder reproduction is a separate prior gate',
                validation_equal=True,solids_equal=True,input_hashes_equal=True,blend_identity_claimed=False)
    (OUT/'reproducibility.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__': main()
