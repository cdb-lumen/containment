"""Read-only prior-package preservation audit and current-source receipt."""
import gzip
import hashlib
import json
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'tools/assets/passenger-vault/monitoring'

def main():
    def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
    head='eddc188008f40ac172ff1c2c06936069baa4be0c'
    old=json.loads(git('show',head+':package.json'));new=json.loads((ROOT/'package.json').read_text())
    old_test=old['scripts']['test'];old['scripts']['test']+=' && python3 tools/assets/passenger-vault/test_monitor_artifacts.py';assert old==new,'non-test package edit'
    files=git('ls-tree','-r','--name-only','-z',head,'--','tools/assets/passenger-vault','public/assets/passenger-vault').decode().split('\0')
    preserved={}
    for name in filter(None,files):
        a=(ROOT/name).read_bytes();b=git('show',f'{head}:{name}');assert a==b,name;preserved[name]=hashlib.sha256(a).hexdigest()
    sources=['package.json','tools/assets/passenger-vault/monitoring.py','tools/assets/passenger-vault/distribution.py','tools/assets/passenger-vault/room_fit.py','tools/assets/passenger-vault/test_reproducibility.py','src/game/roguelike/authoredRoomTopologies.ts']+[str(p.relative_to(ROOT)) for p in sorted((ROOT/'tools/assets/passenger-vault').glob('test_monitor*.py'))]
    sources.append('tools/assets/passenger-vault/monitor_contract.py')
    archived=OUT/'rejected-initial'
    snapshot=json.loads((archived/'snapshot-sha256.json').read_text())
    for name,expected in snapshot.items():
        compressed=archived/(name+'.gz')
        raw=gzip.decompress(compressed.read_bytes()) if compressed.exists() else (archived/name).read_bytes()
        assert hashlib.sha256(raw).hexdigest()==expected,'rejected snapshot changed '+name
    manifest=json.loads((OUT/'manifest.json').read_text())
    reproduction=json.loads((OUT/'reproducibility.json').read_text())
    assert reproduction['passed'] and len(reproduction['decoded_pngs'])==5
    for name,r in manifest['files'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==r['sha256'],'stale artifact '+name
    result=dict(base=head,prior_tracked_package_files=len(preserved),preserved_sha256=preserved,source_sha256={n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in sources},rejected_snapshot_sha256=snapshot,previous_npm_test=old_test,only_tracked_edit='package.json: append monitor CPU test',all_five_current_renders_and_reproduction_complete=True,independent_review='FAIL after bounded repair: service-panel access unresolved; worker paused')
    (OUT/'provenance.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(dict(base=head,preserved_files=len(preserved),sources=len(sources),passed=True)))
if __name__=='__main__':main()
