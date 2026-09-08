"""Artifact contract. Run with Python after the actual Blender build."""
import hashlib
import json
import struct
import sys
import unittest
from pathlib import Path

ROOT = Path(sys.argv.pop(1)) if len(sys.argv) > 1 else Path(__file__).resolve().parents[3]


class GeometryArtifacts(unittest.TestCase):
    def test_delivered_geometry_and_evidence(self):
        folder = ROOT / 'tools/assets/passenger-vault'
        self.assertTrue((folder / 'manifest.json').is_file(), 'Actual geometry manifest missing')
        data = json.loads((folder / 'manifest.json').read_text())
        self.assertEqual(data['delivered'], {'carriers': 1, 'chambers': 4})
        self.assertEqual(data['gate'], 'construction candidate; independent review pending')
        self.assertTrue(data['validation']['passed'])
        self.assertGreater(data['validation']['clearance_probes'], 100)
        self.assertEqual(data['validation']['proxy_intersections'], [])
        self.assertEqual(data['validation']['nonmanifold_edges'], 0)
        self.assertLessEqual(data['validation']['row_bounds'][1][2], 1.25)
        self.assertEqual(len(data['placements']), 4)
        for construction in [data['validation']['construction'], data['roundtrip']['chamber']['construction']]:
            self.assertEqual(len(construction['bed_pan_gaps_m']), 9)
            self.assertTrue(all(abs(gap) <= 1e-5 for gap in construction['bed_pan_gaps_m']))
            self.assertEqual(len(construction['outward_visible_samples']), 5)
            self.assertTrue(all(count == 9 for count in construction['outward_visible_samples'].values()))
        for name in ['README.md', 'references.md', 'geometry_checks.py', 'test_geometry.py']:
            self.assertTrue((folder / name).is_file(), name)
        self.assertTrue((ROOT / 'public/assets/passenger-vault/CREDITS.md').is_file())
        for name, record in data['files'].items():
            file = ROOT / name
            self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(), record['sha256'], name)
            self.assertEqual(file.stat().st_size, record['bytes'])
        for name in ['chamber', 'row-carrier']:
            raw = (ROOT / f'public/assets/passenger-vault/{name}.glb').read_bytes()
            self.assertEqual(raw[:4], b'glTF')
            self.assertEqual(struct.unpack_from('<I', raw, 8)[0], len(raw))
            size = struct.unpack_from('<I', raw, 12)[0]
            doc = json.loads(raw[20:20 + size])
            self.assertNotIn('animations', doc)
            self.assertNotIn('images', doc)
            self.assertFalse(any('FIXTURE' in n.get('name', '') for n in doc['nodes']))
            for mesh in doc['meshes']:
                for primitive in mesh['primitives']:
                    self.assertIn('NORMAL', primitive['attributes'])
            self.assertTrue(data['roundtrip'][name]['passed'])
        for name in ['row-closed.png', 'row-top.png', 'chamber-closed.png', 'chamber-cutaway.png', 'chamber-section.png', 'carrier-rear.png']:
            self.assertIn(f'tools/assets/passenger-vault/evidence/{name}', data['files'])


if __name__ == '__main__':
    unittest.main()
