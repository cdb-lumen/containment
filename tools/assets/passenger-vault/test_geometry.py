"""Run with Blender, passing -- --output-root ROOT to inspect another build."""
import argparse
import sys
import unittest
from pathlib import Path
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geometry_checks import check_construction

parser = argparse.ArgumentParser()
parser.add_argument('--output-root', type=Path, default=Path(__file__).resolve().parents[3])
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(args.output_root / 'public/assets/passenger-vault/chamber.glb'))
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.context.view_layer.update()


class ActualGeometry(unittest.TestCase):
    def test_exported_contact_and_visibility(self):
        check_construction(objects)

    def rejects_move(self, name, axis, delta, message):
        obj = next(o for o in objects if o.name == name)
        original = obj.location.copy()
        try:
            obj.location[axis] += delta
            bpy.context.view_layer.update()
            with self.assertRaisesRegex(AssertionError, message):
                check_construction(objects)
        finally:
            obj.location = original
            bpy.context.view_layer.update()

    def test_rejects_floating_bed(self):
        self.rejects_move('chamber_internal_bed', 2, .01, 'bed support gaps')

    def test_rejects_buried_plate(self):
        self.rejects_move('chamber_working_face_status_recess', 1, .04, 'buried outward face')


def clamp_regression(name, delta):
    def test(self):
        self.rejects_move(name, 0, delta, 'buried outward face')
    return test


for i, obj in enumerate(sorted((o for o in objects if o.name.startswith('chamber_seal_clamp_')), key=lambda o: o.name)):
    setattr(ActualGeometry, f'test_rejects_buried_clamp_{i}', clamp_regression(obj.name, .01 if obj.location.x < 0 else -.01))
result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ActualGeometry))
if not result.wasSuccessful():
    raise AssertionError('Exported construction regressions failed')
