"""CPU regression for the complete seven-family budget candidate, not pixel acceptance."""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/assets/passenger-vault/material-budget'
FAMILIES = ('chamber', 'row-carrier', 'distribution-north', 'distribution-south',
            'monitor-north', 'monitor-south', 'service-finish')


def glb(path):
    raw = path.read_bytes()
    size = struct.unpack_from('<I', raw, 12)[0]
    return json.loads(raw[20:20+size]), raw[28+size:]


def signature(material, doc, binary):
    """Resolve texture identity by image bytes and sampler, never local indices/names."""
    def resolve(value, key=''):
        if isinstance(value, dict):
            result = {k: resolve(v, k) for k, v in value.items() if k != 'name'}
            if key.endswith('Texture'):
                texture = doc['textures'][value['index']]
                image = doc['images'][texture['source']]
                view = doc['bufferViews'][image['bufferView']]
                start = view.get('byteOffset', 0)
                result['index'] = hashlib.sha256(binary[start:start+view['byteLength']]).hexdigest()
                result['sampler'] = doc.get('samplers', [])[texture['sampler']]
            return result
        if isinstance(value, list):
            return [resolve(v) for v in value]
        return value
    return json.dumps(resolve(material), sort_keys=True)


class MaterialBudget(unittest.TestCase):
    def test_complete_exported_package_material_ceiling(self):
        signatures = set()
        for family in FAMILIES:
            path = OUT / (family + '.glb')
            self.assertTrue(path.is_file(), f'Missing package family: {family}')
            doc, binary = glb(path)
            used = {p['material'] for m in doc['meshes'] for p in m['primitives']}
            self.assertTrue(used <= set(range(len(doc['materials']))), family)
            signatures.update(signature(m, doc, binary) for m in doc['materials'])
        self.assertLessEqual(len(signatures), 8, 'Whole package, not chamber/carrier alone')


    def test_signature_resolves_image_content_not_local_texture_index(self):
        doc, binary = glb(OUT/'chamber.glb')
        material = doc['materials'][0]
        before = signature(material, doc, binary)
        self.assertEqual(before, signature({**material, 'name': 'renamed'}, doc, binary))
        view = doc['bufferViews'][doc['images'][0]['bufferView']]
        changed = bytearray(binary)
        changed[view.get('byteOffset', 0)+20] ^= 1
        self.assertNotEqual(before, signature(material, doc, changed))

    def test_only_ancillary_material_definitions_change(self):
        for family in FAMILIES:
            source = OUT.parent / ('materials/wear-' + family + '.glb' if family in FAMILIES[:2] else family + '.glb')
            target = OUT / (family + '.glb')
            if family in FAMILIES[:2]:
                self.assertEqual(target.read_bytes(), source.read_bytes())
                continue
            original, source_binary = glb(source)
            doc, binary = glb(target)
            self.assertEqual(binary, source_binary, family + ' binary including all geometry/UVs')
            self.assertEqual(len(doc['materials']), len(original['materials']))
            for before, after in zip(original['materials'], doc['materials']):
                name = before['name']
                role = ('recess' if 'gasket' in name or 'panel_seam' in name else
                        'enclosure' if 'shell' in name or 'cover_marking' in name else
                        'mechanism' if 'mechanism' in name else None)
                self.assertIsNotNone(role, name)
                assert role is not None
                self.assertEqual(after['name'], 'PV_ancillary_' + role)
                self.assertEqual(after['doubleSided'], before['doubleSided'])
                pbr = after['pbrMetallicRoughness']
                self.assertEqual(pbr['baseColorFactor'], [{'recess': .16, 'enclosure': .48, 'mechanism': .32}[role]]*3+[1])
                self.assertEqual(pbr['metallicFactor'], 0)
                self.assertEqual(pbr['roughnessFactor'], .72)
            self.assertEqual({k:v for k,v in doc.items() if k != 'materials'},
                             {k:v for k,v in original.items() if k != 'materials'}, family)

    def test_receipts_and_clean_root_reproduction(self):
        manifest = json.loads((OUT/'manifest.json').read_text())
        digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
        self.assertEqual(manifest['source_script_sha256'], digest(ROOT/'tools/assets/passenger-vault/material_budget.py'))
        self.assertEqual(set(manifest['files']), {f+'.glb' for f in FAMILIES})
        for name, expected in manifest['source_sha256'].items():
            self.assertEqual(digest(ROOT/name), expected)
        for name, expected in manifest['files'].items():
            self.assertEqual(digest(OUT/name), expected['sha256'])
            self.assertEqual((OUT/name).stat().st_size, expected['bytes'])
        with tempfile.TemporaryDirectory(prefix='pv-budget-test-') as root:
            subprocess.run([sys.executable, str(ROOT/'tools/assets/passenger-vault/material_budget.py'), '--output-root', root], check=True, stdout=subprocess.DEVNULL)
            clean = Path(root)/OUT.relative_to(ROOT)
            self.assertEqual({p.name for p in clean.iterdir()}, set(manifest['files']) | {'manifest.json'})
            for name in [*manifest['files'], 'manifest.json']:
                self.assertEqual((clean/name).read_bytes(), (OUT/name).read_bytes(), name)


if __name__ == '__main__':
    unittest.main()
