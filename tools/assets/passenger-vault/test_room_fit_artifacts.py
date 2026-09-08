"""Canonical CPU-only evidence contract for the installed room fixture."""
import hashlib
import json
import sys
import unittest
from pathlib import Path
from test_reproducibility import decoded_png
ROOT = Path(sys.argv.pop(1)).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[3]
FOLDER=ROOT/'tools/assets/passenger-vault/room-fit'

class RoomArtifacts(unittest.TestCase):
    def test_actual_sources_and_evidence(self):
        data=json.loads((FOLDER/'manifest.json').read_text())
        self.assertTrue(data['source_only'])
        v=data['validation']
        self.assertTrue(v['passed'])
        self.assertEqual((v['carriers'],v['chambers'],v['solids']),(4,16,8))
        self.assertCountEqual([r['id'] for r in v['rows']], ['A','B','C','D4'])
        self.assertEqual(v['carriers'], len(v['rows']))
        for row in v['rows']:
            self.assertEqual(len(row['chambers']), 4)
        self.assertEqual(v['chambers'], sum(len(r['chambers']) for r in v['rows']))
        self.assertGreater(v['mesh_objects'], 0)
        self.assertGreater(v['placed_triangles'], 0)
        self.assertEqual([r['working_face'] for r in v['rows']],['south','south','north','north'])
        self.assertEqual(v['support_contacts'],64)
        self.assertEqual(v['service_contacts'],64)
        self.assertEqual(v['sealed_probes'],140)
        self.assertEqual(v['access']['radius_game'],28)
        self.assertEqual(v['access']['route_segments'],12)
        self.assertEqual(v['access']['access_segments'],34)
        for path,digest in data['inputs'].items():
            self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),digest,path)
        self.assertEqual(set(data['files']),{'whole-room-top.png','whole-room-oblique.png'})
        for name,digest in data['files'].items():
            self.assertEqual(hashlib.sha256((FOLDER/name).read_bytes()).hexdigest(),digest)
            pixels=decoded_png(FOLDER/name)
            self.assertEqual((pixels['width'],pixels['height']),(1600,1200))

if __name__=='__main__': unittest.main()
