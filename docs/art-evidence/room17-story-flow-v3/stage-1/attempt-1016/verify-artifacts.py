#!/usr/bin/env python3
"""Check PNG, deterministic regeneration and pinned production bytes."""
from pathlib import Path
import hashlib,json,subprocess,sys,tempfile
from PIL import Image
here=Path(__file__).resolve().parent
root=Path(sys.argv[1]).resolve()
d=json.loads((here/'layout-data.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
for f,h in d['source_sha256'].items():
    b=(root/f).read_bytes()
    assert sha(b)==h,f
    assert b==subprocess.check_output(['git','show',d['source_commit']+':'+f],cwd=root),f
with Image.open(here/'layout.png') as im:
    im.load()
    assert im.size==(2400,1640)
    assert im.mode=='RGB'
assert (here/'layout.png').stat().st_size<=8*1024*1024
with tempfile.TemporaryDirectory(prefix='room17-layout-') as tmp:
    png=Path(tmp)/'regenerated.png'
    subprocess.run([sys.executable,str(here/'generate-layout.py'),str(png)],check=True)
    assert png.read_bytes()==(here/'layout.png').read_bytes()
print(json.dumps({'source_files_verified':len(d['source_sha256']),'png_decodes':True,'size':[2400,1640],'deterministic_bytes':True,'png_sha256':sha((here/'layout.png').read_bytes())},indent=2))
