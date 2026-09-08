"""CPU-only exact artifact integrity contract, included in npm test."""
import hashlib
import json
import struct
import sys
import unittest
from pathlib import Path
ROOT=Path(sys.argv.pop(1)) if len(sys.argv)>1 else Path(__file__).resolve().parents[3]

class DistributionArtifacts(unittest.TestCase):
    def test_artifacts(self):
        out=ROOT/'tools/assets/passenger-vault/distribution'
        m=json.loads((out/'manifest.json').read_text())
        self.assertEqual(m['gate'],'source-only geometry candidate; independent review pending')
        self.assertEqual(len(m['files']),9)
        for name,r in m['files'].items():
            raw=(ROOT/name).read_bytes()
            self.assertEqual(len(raw),r['bytes'],name)
            self.assertEqual(hashlib.sha256(raw).hexdigest(),r['sha256'],name)
        for variant,h in [('north',1.5),('south',1.0)]:
            raw=(ROOT/f'public/assets/passenger-vault/distribution-{variant}.glb').read_bytes()
            self.assertEqual(raw[:4],b'glTF');self.assertEqual(struct.unpack_from('<I',raw,8)[0],len(raw))
            doc=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
            self.assertNotIn('animations',doc);self.assertNotIn('images',doc)
            self.assertEqual(len(doc['materials']),3)
            names=[n.get('name','') for n in doc['nodes']]
            self.assertEqual(len(names),len(set(names)))
            self.assertFalse(any('SOURCE' in n for n in names))
            self.assertTrue(all(f'panel_{i}' in names for i in range(6)))
            triangles=0
            for mesh in doc['meshes']:
                for p in mesh['primitives']:
                    self.assertIn('NORMAL',p['attributes'])
                    triangles+=doc['accessors'][p['indices']]['count']//3
            r=m['validation'][variant]
            self.assertEqual(triangles,r['triangles'])
            self.assertEqual(len(doc['meshes']),r['mesh_objects'])
            self.assertEqual(r['bounds_blender_m'],[[-9.375,-1.25,0],[9.375,1.25,h]])
            self.assertEqual([r[k] for k in ['deck_probes','back_probes','closed_front_probes','exposed_fittings']],[24,24,54,30])
        pngs=list(out.glob('*.png'));self.assertEqual(len(pngs),5)
        for p in pngs:
            raw=p.read_bytes();self.assertEqual(raw[:8],b'\x89PNG\r\n\x1a\n')
            self.assertEqual(struct.unpack_from('>II',raw,16),(1200,800))

if __name__=='__main__':unittest.main()
