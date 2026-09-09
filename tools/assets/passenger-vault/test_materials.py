"""Required, CPU-only exported material contract. No Blender rebuild needed."""
import hashlib
import json
import math
from pathlib import Path
import struct
import unittest

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/assets/passenger-vault/materials'

def glb(path):
    raw = path.read_bytes()
    size = struct.unpack_from('<I', raw, 12)[0]
    return json.loads(raw[20:20+size]), raw[28+size:]

def values(doc, binary, index):
    a = doc['accessors'][index]; v = doc['bufferViews'][a['bufferView']]
    fmt = {5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']]
    n = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    step = v.get('byteStride',struct.calcsize('<'+fmt)*n)
    start = v.get('byteOffset',0)+a.get('byteOffset',0)
    return [struct.unpack_from('<'+fmt*n,binary,start+i*step) for i in range(a['count'])]

class Materials(unittest.TestCase):
    def test_exports_exist(self):
        self.assertTrue((OUT/'wear-chamber.glb').is_file(), 'Material production exports are missing')

    def test_geometry_and_pbr_contract(self):
        self.assertTrue((OUT/'manifest.json').is_file(), 'Material production manifest is missing')
        if not (OUT/'manifest.json').exists(): return
        report=json.loads((OUT/'manifest.json').read_text())
        self.assertLessEqual(report['placed_triangles_all_families'],100000)
        self.assertLessEqual(report['shared_materials_candidate'],8)
        self.assertLessEqual(report['wear_glb_bytes_all_families'],16*1024*1024)
        self.assertLessEqual(report['decoded_texture_bytes_with_mips'],32*1024*1024)
        for family in ['chamber','row-carrier']:
            original,ob=glb(OUT.parent/(family+'.glb'))
            for stage in ['neutral','material','wear']:
                d,b=glb(OUT/f'{stage}-{family}.glb')
                self.assertEqual(d['nodes'],original['nodes'])
                self.assertEqual(len(d['meshes']),len(original['meshes']))
                for mesh,source in zip(d['meshes'],original['meshes']):
                    for p,q in zip(mesh['primitives'],source['primitives']):
                        for attr in ['POSITION','NORMAL']:
                            self.assertEqual(values(d,b,p['attributes'][attr]),values(original,ob,q['attributes'][attr]))
                        self.assertEqual(values(d,b,p['indices']),values(original,ob,q['indices']))
                        uv=values(d,b,p['attributes']['TEXCOORD_0'])
                        self.assertTrue(all(math.isfinite(c) and 0<=c<=1 for v in uv for c in v))
                        self.assertEqual(len(uv),d['accessors'][p['attributes']['POSITION']]['count'])
                self.assertFalse(d.get('animations'))
                self.assertFalse(any('FIXTURE' in n.get('name','') for n in d['nodes']))
                if stage!='neutral':
                    self.assertEqual(len(d['materials']),5)
                    for m in d['materials'][:3]:
                        self.assertIn('baseColorTexture',m['pbrMetallicRoughness'])
                        self.assertIn('metallicRoughnessTexture',m['pbrMetallicRoughness'])
                    for image in d['images']:
                        self.assertNotIn('uri',image)
                        view=d['bufferViews'][image['bufferView']]
                        png=b[view['byteOffset']:view['byteOffset']+view['byteLength']]
                        self.assertEqual(png[:8],b'\x89PNG\r\n\x1a\n')
                self.assertEqual(hashlib.sha256((OUT/f'{stage}-{family}.glb').read_bytes()).hexdigest(), report['files'][f'{stage}-{family}.glb']['sha256'])
        self.assertNotEqual((OUT/'wear-chamber.glb').read_bytes(),(OUT/'material-chamber.glb').read_bytes())

if __name__=='__main__': unittest.main()
