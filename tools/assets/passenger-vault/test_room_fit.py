"""Real imported whole-room geometry regressions; execute with Blender."""
import sys
import unittest
from pathlib import Path
import bpy
from mathutils import Matrix
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

class RoomFit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        assert (HERE / 'room_fit.py').is_file(), 'Whole-room installed fixture is missing'
        import room_fit
        cls.fit = room_fit

    def setUp(self):
        self.room = self.fit.assemble(HERE.parents[2])

    def test_all_installed_geometry(self):
        result = self.fit.validate(self.room)
        self.assertEqual(result['chambers'], 16)
        self.assertEqual(result['carriers'], 4)
        self.assertEqual(result['solids'], 8)
        self.assertCountEqual([r['id'] for r in result['rows']], ['A', 'B', 'C', 'D4'])
        self.assertEqual(result['carriers'], len(self.room['rows']))
        self.assertEqual(result['chambers'], sum(len(r['chambers']) for r in self.room['rows']))
        for row in self.room['rows']:
            self.assertEqual(len(row['chambers']), 4)
            self.assertTrue(row['carrier'])
            self.assertTrue(all(row['chambers']))

    def test_rejects_empty_inventory(self):
        self.room['rows'] = []
        with self.assertRaisesRegex(AssertionError, 'inventory'):
            self.fit.validate(self.room)

    def test_rejects_missing_row(self):
        self.room['rows'].pop()
        with self.assertRaisesRegex(AssertionError, 'inventory'):
            self.fit.validate(self.room)

    def test_rejects_duplicate_row(self):
        self.room['rows'][3] = self.room['rows'][0]
        with self.assertRaisesRegex(AssertionError, 'inventory'):
            self.fit.validate(self.room)

    def test_rejects_missing_chamber(self):
        self.room['rows'][0]['chambers'].pop()
        self.room['rows'][0]['named_chambers'].pop()
        with self.assertRaisesRegex(AssertionError, 'inventory'):
            self.fit.validate(self.room)

    def test_rejects_empty_mesh_groups(self):
        row = self.room['rows'][0]
        for key, named in [('carrier', 'named_carrier'), ('chambers', 'named_chambers')]:
            with self.subTest(group=key):
                old, old_named = row[key], row[named]
                row[key] = [] if key == 'carrier' else [[], *old[1:]]
                row[named] = {} if key == 'carrier' else [{}, *old_named[1:]]
                try:
                    with self.assertRaisesRegex(AssertionError, 'inventory'):
                        self.fit.validate(self.room)
                finally:
                    row[key], row[named] = old, old_named

    def test_rejects_mismatched_named_groups(self):
        row = self.room['rows'][0]
        for names in [row['named_carrier'], row['named_chambers'][0]]:
            with self.subTest(group=list(names)[0]):
                key, obj = next(iter(names.items()))
                del names[key]
                try:
                    with self.assertRaisesRegex(AssertionError, 'inventory'):
                        self.fit.validate(self.room)
                finally:
                    names[key] = obj

    def test_skip_renders_is_rejected_without_writing(self):
        import tempfile
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as root:
            out = Path(root) / 'tools/assets/passenger-vault/room-fit'
            out.mkdir(parents=True)
            manifest = out / 'manifest.json'
            for existing in [False, True]:
                with self.subTest(existing_manifest=existing):
                    if existing:
                        manifest.write_bytes(b'original image provenance\n')
                    with patch.object(sys, 'argv', ['blender', '--', '--output-root', root, '--skip-renders']):
                        with self.assertRaises(SystemExit) as error:
                            self.fit.main()
                        self.assertEqual(error.exception.code, 2)
                    if existing:
                        self.assertEqual(manifest.read_bytes(), b'original image provenance\n')
                    else:
                        self.assertFalse(manifest.exists())

    def test_rejects_south_row_wrong_orientation(self):
        row = self.room['rows'][2]
        for obj in row['carrier'] + sum(row['chambers'], []):
            obj.matrix_world = row['mount'] @ Matrix.Rotation(3.141592653589793, 4, 'Z') @ row['mount'].inverted() @ obj.matrix_world
        with self.assertRaisesRegex(AssertionError, 'orientation'):
            self.fit.validate(self.room)

    def test_rejects_overhang(self):
        for obj in self.room['rows'][0]['chambers'][0]:
            obj.location.x -= .5
        with self.assertRaisesRegex(AssertionError, 'reservation'):
            self.fit.validate(self.room)

    def test_rejects_false_gap(self):
        row = self.room['rows'][0]
        obj = row['named_carrier']['carrier_continuous_deck_plinth']
        obj.scale.x *= .8
        with self.assertRaisesRegex(AssertionError, 'sealed footprint'):
            self.fit.validate(self.room)

    def test_rejects_floating_support(self):
        for obj in self.room['rows'][0]['chambers'][0]:
            obj.location.z += .005
        with self.assertRaisesRegex(AssertionError, 'support contact'):
            self.fit.validate(self.room)

    def test_rejects_disconnected_service(self):
        obj = self.room['rows'][0]['named_carrier']['carrier_supply_return_0_-0.25']
        obj.location.y += .04
        with self.assertRaisesRegex(AssertionError, 'service contact'):
            self.fit.validate(self.room)

    def test_rejects_inter_chamber_overlap(self):
        for obj in self.room['rows'][0]['chambers'][1]:
            obj.location.x -= .4
        with self.assertRaisesRegex(AssertionError, 'inter-chamber overlap'):
            self.fit.validate(self.room)

    def test_rejects_blocked_route(self):
        with self.assertRaisesRegex(AssertionError, 'route clearance'):
            self.fit.check_routes(self.room['solids'] + [{'id':'fault', 'x':590,'y':430,'w':20,'h':20,'height':40,'row':False}])

result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(RoomFit))
if not result.wasSuccessful():
    raise AssertionError('Whole-room geometry regressions failed')
