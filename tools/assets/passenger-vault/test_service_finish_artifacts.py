"""Required CPU gate: validate delivered hashes and import/reopen, never rebuild/render."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import unittest

ROOT=Path(__file__).resolve().parents[3]
SOURCE=Path('tools/assets/passenger-vault')
OUT=SOURCE/'service-finish'

class ServiceFinishArtifacts(unittest.TestCase):
    def test_package_hashes(self):
        manifest=json.loads((ROOT/OUT/'manifest.json').read_text())
        expected={str(OUT/name) for name in ['service-finish.blend','top.png','oblique.png']} | {'public/assets/passenger-vault/service-finish.glb'}
        self.assertEqual(set(manifest['files']),expected)
        for name,entry in manifest['files'].items():
            data=(ROOT/name).read_bytes()
            self.assertEqual(len(data),entry['bytes'],name)
            self.assertEqual(hashlib.sha256(data).hexdigest(),entry['sha256'],name)
        for name,digest in manifest['sources'].items():
            self.assertEqual(hashlib.sha256((ROOT/SOURCE/name).read_bytes()).hexdigest(),digest,name)

    def test_imported_and_editable_source_regressions(self):
        result=subprocess.run(['blender','-b','-t','2','--factory-startup','--python-exit-code','1','--python',str(ROOT/SOURCE/'test_service_finish.py'),'--','--output-root',str(ROOT)],cwd=ROOT,timeout=180,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
        print(result.stdout)
        self.assertEqual(result.returncode,0,result.stdout)
        self.assertIn('Ran 10 tests',result.stdout)
        self.assertIn('SERVICE_FINISH_SOURCE ',result.stdout)

if __name__=='__main__':unittest.main()
