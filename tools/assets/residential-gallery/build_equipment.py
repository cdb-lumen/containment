"""Original Residential Gallery equipment. Blender 4.0+, CPU only, no render.
Run: blender -b --factory-startup --python-exit-code 1 --python SCRIPT -- --output-root REPO --evidence-dir DIR
Geometry is authored in metres: Blender (x,-game_y,height), exported glTF (x,height,game_y).
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
import bpy
from mathutils import Vector

ZONES = [
    ('rg_cabin_nw', 280, 160, 240, 100, 1.35),
    ('rg_bunk_storage', 280, 520, 120, 200, 1.10),
    ('rg_cabin_ne', 650, 270, 260, 100, 1.35),
    ('rg_packing', 780, 570, 140, 150, 1.20),
]
PALETTE = {
    'armor': (0xb7c1b4, .58, .39), 'steel': (0x36464c, .78, .50),
    'edge': (0x52646b, .78, .36), 'rubber': (0x20282c, .05, .91),
    'trim': (0xc29b59, .74, .30), 'bone': (0xc5b894, .14, .42),
    'red': (0xa1543c, .38, .50),
}
MATS = {}
PARTS = {}
ROOT = None
W = D = 0


def linear(v):
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4


def materials():
    for name, (color, metal, rough) in PALETTE.items():
        mat = bpy.data.materials.new('rg_' + name)
        mat.use_nodes = True
        mat.use_backface_culling = True
        rgb = [linear(((color >> shift) & 255) / 255) for shift in (16, 8, 0)]
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (*rgb, 1)
        bsdf.inputs['Metallic'].default_value = metal
        bsdf.inputs['Roughness'].default_value = rough
        mat.diffuse_color = (*rgb, 1)
        MATS[name] = mat


def register(obj, name, material):
    obj.name = ROOT.name + '__' + name
    obj.parent = ROOT
    obj.data.materials.append(MATS[material])
    PARTS[ROOT.name].append(obj.name)
    obj['component_id'] = obj.name
    return obj


def box(name, x, y, w, d, bottom, height, mat='armor', bevel=.018, angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -y, bottom + height / 2))
    obj = bpy.context.object
    obj.dimensions = (w, d, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = -angle
    register(obj, name, mat)
    if bevel:
        mod = obj.modifiers.new('small edge chamfer', 'BEVEL')
        mod.width = min(bevel, min(w, d, height) / 4)
        mod.segments = 1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def b(name, x, y, w, d, bottom, height, mat='armor', bevel=.018, angle=0):
    return box(name, x*W, y*D, w*W, d*D, bottom, height, mat, bevel, angle)


def top_label(name, text, x, y, z, size=.12):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = text
    curve.size = size
    curve.align_x = 'CENTER'
    curve.extrude = 0
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, -y, z)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for other in bpy.context.selected_objects:
        if other != obj:
            other.select_set(False)
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.object
    obj.data.calc_loop_triangles()
    # Blender font tessellation includes collinear triangles. Remove these
    # before float32 glTF export rather than weakening the imported check.
    vertices = [tuple(v.co) for v in obj.data.vertices]
    faces = [tuple(t.vertices) for t in obj.data.loop_triangles if t.area > 1e-9]
    clean = bpy.data.meshes.new(name + '_clean_text')
    clean.from_pydata(vertices, [], faces)
    clean.update()
    obj.data = clean
    register(obj, name, 'rubber')


def cabin():
    # Full-depth residential storage backs, low roofless cutaway frontage.
    b('continuous_toe_plinth', .5, .5, .996, .996, 0, .10, 'steel', 0)
    b('continuous_storage_body', .5, .465, .996, .926, .10, 1.00, 'steel', 0)
    for n in range(3):
        x = (n+.5)/3
        b(f'roof_cassette_{n}', x, .467, .326, .918, 1.10, .06, 'edge')
        b(f'closed_threshold_{n}', x, .965, .316, .07, .10, .06, 'edge', .012)
        b(f'door_gasket_{n}', x, .957, .293, .05, .10, 1.14, 'rubber', .015)
        for leaf in (-1, 1):
            b(f'closed_door_{n}_{leaf}', x+leaf*.068, .975, .131, .046, .10, 1.14, 'armor')
            b(f'door_kickplate_{n}_{leaf}', x+leaf*.068, .999, .118, .002, .13, .17, 'edge', 0)
        b(f'lintel_{n}', x, .96, .326, .076, 1.24, .11, 'edge')
        b(f'lintel_arrival_band_{n}', x, .96, .205, .041, 1.35-.008, .007, 'trim', 0)
        b(f'door_pull_{n}', x+.024, .999, .013, .002, .65, .24, 'trim', 0)
        # Broad numeric door code stays subordinate to the doorway silhouette.
        top_label(f'cabin_number_{n}', str(n+1).zfill(2), x*W, .955*D, 1.3495, .13)
        b(f'back_storage_panel_{n}', x, .02, .315, .026, .15, .79, 'armor')
    for x in (.018, .982):
        b('end_cheek_' + str(x), x, .5, .032, .996, 0, 1.35, 'armor', .015)


def bunk():
    b('continuous_underbed_storage', .5, .5, .996, .996, 0, .56, 'steel', 0)
    # 1.125 x 2.1875m empty berth, not a walk-in opening.
    b('bed_pan', .35, .205, .322, .372, .56, .055, 'edge')
    b('empty_mattress', .35, .205, .30, .35, .615, .14, 'bone', .035)
    b('folded_blanket', .35, .095, .30, .12, .755, .035, 'red', .01)
    b('empty_pillow', .35, .345, .25, .055, .755, .085, 'armor', .035)
    b('bedside_cabinet', .79, .205, .414, .406, .56, .30, 'armor')
    b('bedside_top', .79, .205, .414, .406, .86, .025, 'edge', .01)
    for n in range(3):
        x = (n+.5)/3
        b(f'rear_locker_{n}', x, .705, .326, .586, .56, .44, 'armor')
        b(f'locker_lid_{n}', x, .705, .313, .567, 1., .022, 'edge', .01)
        b(f'locker_grip_{n}', x, .452, .07, .018, .82, .045, 'trim', .008)
        b(f'underbed_drawer_{n}', x, .003, .31, .002, .09, .37, 'edge', 0)
        b(f'drawer_grip_{n}', x, .002, .08, .002, .36, .04, 'trim', 0)
    for x in (.025, .975):
        b('alcove_cheek_' + str(x), x, .5, .046, .996, .56, .54, 'steel')
    b('alcove_back', .5, .975, .95, .046, .56, .54, 'steel')


def trunk(name, x, y, w, d, bottom, height, mat):
    b(name+'_case', x, y, w, d, bottom, height, mat, .035)
    for dx in (-w*.32, w*.32):
        b(name+'_strap_'+str(dx), x+dx, y, .015, d*.98, bottom+height, .012, 'rubber', .003)
    b(name+'_label', x, y-.02, w*.51, d*.25, bottom+height+.013, .004, 'bone', 0)


def packing():
    b('continuous_packing_storage', .5, .5, .996, .996, 0, .40, 'steel', 0)
    # Drawer-like sides explain the solid base under the trolley and bench.
    for n in range(3):
        b(f'packing_drawer_{n}', (n+.5)/3, .002, .314, .002, .07, .25, 'edge', 0)
    for x in range(1,3):
        for y in range(2):
            trunk(f'arrival_trunk_{x}_{y}', .17+x*.33, .15+y*.29, .28, .276,
                  .4, .42+(x+y)%2*.14, 'armor' if (x+y)%2 else 'red')
    for x in (.10, .34):
        for y in (.10, .40):
            bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=.06, depth=.10,
                location=(x*W, -y*D, .46), rotation=(0, math.pi/2, 0))
            register(bpy.context.object, f'trolley_wheel_{x}_{y}', 'rubber')
    b('trolley_deck', .22, .25, .32, .39, .52, .08, 'edge')
    trunk('trolley_lower_case', .22, .25, .28, .35, .60, .29, 'red')
    trunk('trolley_upper_case', .22, .27, .245, .28, .905, .16, 'armor')
    for x in (.08, .36):
        b('trolley_upright_'+str(x), x, .445, .024, .025, .60, .60, 'edge', .015)
    b('trolley_handle', .22, .445, .304, .025, 1.12, .08, 'edge', .02)
    b('bench_support', .52, .8, .80, .30, .4, .18, 'steel')
    b('displaced_bench_frame', .52, .8, .80, .23, .58, .055, 'edge', .018, .10)
    b('displaced_bench_seat', .52, .8, .79, .225, .635, .105, 'rubber', .025, .10)
    trunk('bench_end_luggage', .055, .805, .10, .35, .4, .52, 'armor')
    top_label('new_earth_arrival_label', 'NEW EARTH', .50*W, .15*D, .979, .10)


def glb_json(path):
    raw = path.read_bytes()
    assert raw[:4] == b'glTF'
    length, kind = struct.unpack_from('<II', raw, 12)
    assert kind == 0x4e4f534a
    return json.loads(raw[20:20+length])


def bounds(objects):
    pts = [obj.matrix_world @ v.co for obj in objects for v in obj.data.vertices]
    return [[min(p[i] for p in pts) for i in range(3)],
            [max(p[i] for p in pts) for i in range(3)]]


def check_bounds(actual, expected, tol=2e-5):
    assert all(actual[0][i] >= expected[0][i]-tol and actual[1][i] <= expected[1][i]+tol
               for i in range(3)), (actual, expected)


def verify(path):
    doc = glb_json(path)
    assert not doc.get('images') and not doc.get('textures')
    assert len(doc['materials']) <= 8
    for m in doc['materials']:
        assert not m.get('doubleSided', False)
        key = m['name'].removeprefix('rg_')
        color, metal, rough = PALETTE[key]
        pbr = m['pbrMetallicRoughness']
        assert abs(pbr['metallicFactor']-metal) < 1e-6
        assert abs(pbr['roughnessFactor']-rough) < 1e-6
        expected_rgb = [linear(((color >> s)&255)/255) for s in (16,8,0)]
        assert all(abs(a-b)<1e-6 for a,b in zip(pbr['baseColorFactor'][:3], expected_rgb))
    for mesh in doc['meshes']:
        for p in mesh['primitives']:
            assert {'POSITION', 'NORMAL', 'TEXCOORD_0'} <= set(p['attributes'])
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    rows = []
    for name, x, y, width, depth, height in ZONES:
        root = bpy.data.objects.get(name)
        assert root is not None
        meshes = [o for o in root.children_recursive if o.type == 'MESH']
        assert meshes
        actual = bounds(meshes)
        expected = [[x/32, -(y+depth)/32, 0], [(x+width)/32, -y/32, height]]
        check_bounds(actual, expected)
        assert abs(actual[0][2]) < 2e-5 and abs(actual[1][2]-height)<2e-5
        triangles = 0
        for obj in meshes:
            obj.data.calc_loop_triangles()
            triangles += len(obj.data.loop_triangles)
            for tri in obj.data.loop_triangles:
                assert tri.area > 1e-12, (name, obj.name, tri.index, tri.area)
            assert all(math.isfinite(c) for v in obj.data.vertices for c in v.co)
            assert all(abs(v.normal.length-1)<1e-4 for v in obj.data.vertices)
        # Low horizontal support must occupy every interior grid point.
        depsgraph = bpy.context.evaluated_depsgraph_get()
        occupied = 0
        for ix in range(20):
            for iy in range(20):
                origin = Vector(((x+(ix+.5)*width/20)/32,
                                 -(y+(iy+.5)*depth/20)/32, -.1))
                hit, loc, *_ = bpy.context.scene.ray_cast(depsgraph, origin, Vector((0,0,1)), distance=.2)
                assert hit and abs(loc.z)<2e-5, (name, ix, iy)
                occupied += 1
        # Translate imported root across the reservation: same predicate MUST reject.
        root.location.x += width/32
        bpy.context.view_layer.update()
        rejected = False
        try:
            check_bounds(bounds(meshes), expected)
        except AssertionError:
            rejected = True
        assert rejected, 'negative bounds control falsely accepted'
        root.location.x -= width/32
        bpy.context.view_layer.update()
        rows.append({'id': name, 'bounds_blender_world': actual, 'triangles': triangles,
                     'meshes': len(meshes), 'occupied_floor_grid_points': occupied,
                     'translated_import_negative_control_rejected': rejected})
    total = sum(r['triangles'] for r in rows)
    assert total <= 16000
    return {'passed': True, 'asset_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'bytes': path.stat().st_size, 'materials': len(doc['materials']), 'textures': 0,
            'triangles': total, 'mesh_primitives': sum(len(m['primitives']) for m in doc['meshes']),
            'zones': rows, 'limits': {'triangles': 16000, 'materials': 8},
            'not_verified': ['shipping-camera appearance', 'runtime loading/disposal', 'gameplay integration']}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-root', type=Path, required=True)
    parser.add_argument('--evidence-dir', type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    destination = args.output_root/'public/assets/residential-gallery'
    destination.mkdir(parents=True, exist_ok=True)
    args.evidence_dir.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    materials()
    global ROOT, W, D
    for index, (name, x, y, width, depth, height) in enumerate(ZONES):
        ROOT = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(ROOT)
        PARTS[name] = []
        W, D = width/32, depth/32
        if index in (0,2):
            cabin()
        elif index == 1:
            bunk()
        else:
            packing()
        ROOT.location = (x/32, -y/32, 0)
        ROOT['reservation_game_units'] = [x, y, width, depth]
        ROOT['height_m'] = height
    bpy.context.view_layer.update()
    # Preserve named editable source locally, not in the runtime payload.
    bpy.ops.wm.save_as_mainfile(filepath=str(args.evidence_dir/'residential-gallery-equipment.blend'))
    for name, *_ in ZONES:
        root = bpy.data.objects[name]
        buckets = {}
        for obj in list(root.children):
            if obj.type == 'MESH':
                if not obj.data.uv_layers:
                    obj.data.uv_layers.new(name='UVMap')
                buckets.setdefault(obj.data.materials[0].name, []).append(obj)
        for matname, objs in buckets.items():
            component_ids = [o.name for o in objs]
            bpy.ops.object.select_all(action='DESELECT')
            for obj in objs:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = objs[0]
            bpy.ops.object.join()
            obj = bpy.context.object
            obj.name = name + '__batch_' + matname
            obj['component_ids'] = component_ids
    path = destination/'residential-gallery-equipment.glb'
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', export_yup=True,
        export_materials='EXPORT', export_extras=True, export_texcoords=True,
        export_normals=True, export_cameras=False, export_lights=False)
    receipt = verify(path)
    receipt['source_sha256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    (args.evidence_dir/'roundtrip.json').write_text(json.dumps(receipt, indent=2)+'\n')
    manifest = {'asset': 'residential-gallery-equipment.glb', 'authoring': 'Original scripted geometry; no external meshes or textures.',
        'palette_source': 'src/render/meshParts.ts MAT, sRGB colors converted to linear glTF factors',
        'units': '1 glTF unit = 1 renderer metre = 32 gameplay units',
        'placement': 'Add the entire glTF scene at room-local (0,0,0), scale 1, identity rotation. Do not translate its four roots again.',
        'zone_roots': [{'id': n, 'gltf_translation': [x/32, 0, y/32],
                        'reservation_game_units': [x,y,w,d], 'height_m': h,
                        'components': PARTS[n]} for n,x,y,w,d,h in ZONES],
        'sha256': receipt['asset_sha256'], 'triangles': receipt['triangles'],
        'materials': receipt['materials'], 'textures': 0}
    (destination/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
