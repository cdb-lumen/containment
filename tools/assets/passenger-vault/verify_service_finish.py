"""Bounded verification: Blender roundtrip, clean-root reproduction, layout tests/build.
Run: python3 tools/assets/passenger-vault/verify_service_finish.py
Requires Blender 4.0+, Python Pillow and installed project npm dependencies.
Never runs browser smoke or writes prior assets. Keeps one receipt and one log.
"""
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import tempfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
SOURCE=Path('tools/assets/passenger-vault')
OUT=SOURCE/'service-finish'
PUBLIC=Path('public/assets/passenger-vault/service-finish.glb')

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def pixels(path):
    with Image.open(path) as im:
        im.load();assert im.size==(1200,880), 'full room evidence size'
        return {'size':list(im.size),'rgba_sha256':hashlib.sha256(im.convert('RGBA').tobytes()).hexdigest()}

def gltf_contract(path):
    b=path.read_bytes();magic,version,total=struct.unpack_from('<4sII',b)
    assert magic==b'glTF' and version==2 and total==len(b)
    n,kind=struct.unpack_from('<I4s',b,12);assert kind==b'JSON'
    d=json.loads(b[20:20+n]);offset=20+n
    binary_size,binary_kind=struct.unpack_from('<I4s',b,offset);assert binary_kind==b'BIN\0'
    binary=b[offset+8:offset+8+binary_size]
    assert len(d['nodes'])==13 and len(d['meshes'])==13 and len(d['materials'])==2
    assert not any(k in d for k in ['animations','cameras','skins','images','textures'])
    assert not any('emissiveFactor' in m or 'normalTexture' in m for m in d['materials'])
    coords=[]
    for node in d['nodes']:
        assert set(node)=={'name','mesh'}, 'room origin; no hidden transforms'
        for primitive in d['meshes'][node['mesh']]['primitives']:
            a=d['accessors'][primitive['attributes']['POSITION']];v=d['bufferViews'][a['bufferView']]
            assert a['componentType']==5126 and a['type']=='VEC3'
            points=[struct.unpack_from('<fff',binary,v.get('byteOffset',0)+a.get('byteOffset',0)+i*v.get('byteStride',12)) for i in range(a['count'])]
            assert all(abs(p[1])<1e-8 and p[0]>0 and p[2]>0 for p in points), 'glTF Y up, positive X/Z metre room placement'
            coords.extend(points)
    bounds=[[min(p[i] for p in coords) for i in range(3)],[max(p[i] for p in coords) for i in range(3)]]
    assert bounds==[[418/32,0,98/32],[1166/32,0,782/32]], 'native metre bounds'
    return {'bytes':len(b),'sha256':digest(path),'gltf_bounds_m':bounds,'mesh_nodes':13,'materials':2,'embedded_textures':0}

def main():
    out=ROOT/OUT;out.mkdir(parents=True,exist_ok=True)
    tracked=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
    # Generated receipts and timestamp-bearing Blender/PNG files are rebuilt.
    # Protect all other tracked files, including earlier asset families.
    before={p:digest(ROOT/p) for p in tracked if p and (ROOT/p).is_file() and not Path(p).is_relative_to(OUT)}
    clean=Path(tempfile.mkdtemp(prefix='passenger-service-finish-clean-'))
    receipt={'base_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip(),'clean_root':str(clean),'commands':[]}
    with (out/'verification.log').open('w') as log:
        def run(cmd,cwd):
            r=subprocess.run(cmd,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
            log.write('$ '+' '.join(map(str,cmd))+'\n'+r.stdout+'\n');log.flush()
            receipt['commands'].append({'command':list(map(str,cmd)),'cwd':str(cwd),'exit_code':r.returncode})
            assert r.returncode==0, r.stdout
        def blender(script,root):
            run(['blender','-t','6','--background','--factory-startup','--python-exit-code','1','--python',str(root/SOURCE/script),'--','--output-root',str(root)],root)
        blender('service_finish.py',ROOT);blender('test_service_finish.py',ROOT)
        for name in ['service_finish.py','test_service_finish.py']:
            target=clean/SOURCE/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/SOURCE/name,target)
        blender('service_finish.py',clean);blender('test_service_finish.py',clean)
        assert (ROOT/PUBLIC).read_bytes()==(clean/PUBLIC).read_bytes(), 'GLB byte reproduction'
        receipt['asset']=gltf_contract(ROOT/PUBLIC)
        receipt['pngs']={}
        for name in ['top.png','oblique.png']:
            p=pixels(ROOT/OUT/name);assert p==pixels(clean/OUT/name), 'PNG pixel reproduction '+name
            receipt['pngs'][name]=p
        original=json.loads((ROOT/OUT/'manifest.json').read_text())
        reproduced=json.loads((clean/OUT/'manifest.json').read_text())
        expected_files={str(OUT/name) for name in ['service-finish.blend','top.png','oblique.png']} | {str(PUBLIC)}
        source_reports=[json.loads(s) for s in re.findall(r'SERVICE_FINISH_SOURCE (\{[^\n]+\})',(out/'verification.log').read_text())]
        assert len(source_reports)==2 and source_reports[0]==source_reports[1], 'reopened source semantic reproduction'
        receipt['editable_source']={'reopened_both_roots':True,'clean_semantics_identical':True,'blend_byte_identity_claimed':False,**source_reports[0],
                                    'sha256':digest(ROOT/OUT/'service-finish.blend'),'clean_sha256':digest(clean/OUT/'service-finish.blend')}
        for base,manifest in [(ROOT,original),(clean,reproduced)]:
            assert set(manifest['files'])==expected_files, 'required source/GLB/PNG inventory'
            for rel,metadata in manifest['files'].items():
                assert digest(base/rel)==metadata['sha256'] and (base/rel).stat().st_size==metadata['bytes']
        # PNG container metadata is timestamped by Blender; decoded pixels above
        # are the reproducibility contract, not byte identity of PNG containers.
        assert {k:v for k,v in original.items() if k!='files'}=={k:v for k,v in reproduced.items() if k!='files'}, 'manifest geometry/source reproduction'
        run(['npx','vitest','run','tests/unit/passengerBlockout.test.ts'],ROOT)
        run(['npm','run','build'],ROOT)
    changed=[p for p,h in before.items() if not (ROOT/p).is_file() or digest(ROOT/p)!=h]
    assert not changed, 'prior tracked files changed: '+repr(changed)
    log_text=(out/'verification.log').read_text()
    geometry_counts=[int(n) for n in re.findall(r'Ran (\d+) tests',log_text)]
    assert len(geometry_counts)==2 and geometry_counts[0]==geometry_counts[1]
    layout_count=int(re.search(r'Tests\s+(\d+) passed',log_text).group(1))
    receipt.update({'passed':True,'prior_tracked_files_unchanged':len(before),'imported_geometry_tests':geometry_counts[0],'layout_tests':layout_count,'clean_glb_bytes_identical':True,'clean_manifest_geometry_and_sources_identical':True,'png_container_byte_identity_claimed':False,'browser_smoke_run':False,'scope':'source-only construction, not independent acceptance or runtime integration'})
    receipt['evidence_sha256']={str(p.relative_to(ROOT)):digest(p) for p in [ROOT/SOURCE/'service_finish.py',ROOT/SOURCE/'test_service_finish.py',Path(__file__),out/'manifest.json',out/'verification.log']}
    (out/'verification.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps(receipt,indent=2))

if __name__=='__main__':main()
