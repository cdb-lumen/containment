"""Original, untextured Passenger Vault construction fixture. Blender 4.0+.
blender --background --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/build.py -- --output-root /tmp/passenger-fixture
No prior equipment geometry or textures are read. Nominal metres; Blender Z up.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geometry_checks import check_construction

ARGS = argparse.ArgumentParser()
ARGS.add_argument('--output-root', type=Path, default=Path(__file__).resolve().parents[3])
ARGS.add_argument('--skip-renders', action='store_true')
args = ARGS.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
ROOT = args.output_root.resolve()
OUT = ROOT / 'tools/assets/passenger-vault'
PUBLIC = ROOT / 'public/assets/passenger-vault'
EVIDENCE = OUT / 'evidence'
for path in (OUT, PUBLIC, EVIDENCE):
    path.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1
bpy.context.preferences.filepaths.save_version = 0


def material(name, value):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (value, value, value, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = mat.diffuse_color
    bsdf.inputs['Roughness'].default_value = .7
    return mat


CLAY = material('geometry_clay_not_material_acceptance', .48)
DARK = material('geometry_recess_contrast', .17)
BODY = material('source_only_scale_fixture', .29)
ANNOTATION = material('diagnostic_text_only', .8)
text_bsdf = ANNOTATION.node_tree.nodes.get('Principled BSDF')
text_bsdf.inputs['Emission Color'].default_value = (.8, .8, .8, 1)
text_bsdf.inputs['Emission Strength'].default_value = 1


def finish(obj, name, mat=CLAY):
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj


def box(name, center, size, bevel=0.0, mat=CLAY):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('machined_edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(obj, name, mat)


def outline(w, length, radius, z):
    points = []
    for cx, cy, start in [(w/2-radius, length/2-radius, 0), (-w/2+radius, length/2-radius, 90),
                          (-w/2+radius, -length/2+radius, 180), (w/2-radius, -length/2+radius, 270)]:
        for j in range(9):
            a = math.radians(start+j*90/8)
            points.append((cx+radius*math.cos(a), cy+radius*math.sin(a), z))
    return points


def loft(name, rings, closed=True, mat=CLAY):
    n = len(rings[0])
    vertices = [p for ring in rings for p in ring]
    faces = []
    for k in range(len(rings)-1):
        for j in range(n):
            faces.append((k*n+j, k*n+(j+1)%n, (k+1)*n+(j+1)%n, (k+1)*n+j))
    if closed:
        faces.extend([tuple(reversed(range(n))), tuple((len(rings)-1)*n+j for j in range(n))])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat)


def annulus(name, outer, inner, bottom, top, mat=CLAY):
    rings = [outline(*outer, bottom), outline(*outer, top), outline(*inner, top), outline(*inner, bottom)]
    # Repeat bottom outer ring and weld it so the annular cross-section is closed.
    obj = loft(name, rings+[rings[0]], closed=False, mat=mat)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data)
    bm.free()
    return obj


def rod(name, a, b, radius, mat=CLAY):
    a, b = Vector(a), Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=(b-a).length, location=(a+b)/2)
    obj = bpy.context.object
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return finish(obj, name, mat)


def pulse(name, y, z, vertical=False):
    # A large repeatable relief cue, not a diagnosed medical waveform.
    path = [(-.23, 0), (-.12, 0), (-.06, .055), (0, -.06), (.065, .08), (.12, 0), (.23, 0)]
    out = []
    for i, (a, b) in enumerate(zip(path, path[1:])):
        if vertical:
            p, q = (a[0], y, z+a[1]), (b[0], y, z+b[1])
        else:
            p, q = (a[0], y+a[1], z), (b[0], y+b[1], z)
        out.append(rod(f'{name}_{i}', p, q, .013))
    return out


# The shell has a real open cavity. It is not a tall solid block with a lid.
chamber = []
chamber.append(loft('chamber_lower_pan', [outline(1.24, 2.74, .24, .29), outline(1.24, 2.74, .24, .36)]))
chamber.append(annulus('chamber_cavity_wall', (1.24, 2.74, .24), (.92, 2.44, .10), .36, .92))
chamber.append(annulus('chamber_inset_gasket', (1.205, 2.705, .23), (.94, 2.46, .11), .92, .94, DARK))
chamber.append(loft('chamber_closed_domed_lid', [outline(1.24, 2.74, .24, .94),
    outline(1.24, 2.74, .24, .99), outline(1.18, 2.68, .27, 1.07),
    outline(1.00, 2.50, .30, 1.15), outline(.72, 2.20, .30, 1.20)]))
# Extend the bed down to its pan seat; preserve the existing z0.42 top.
chamber.append(box('chamber_internal_bed', (0, 0, .39), (.8, 2.3, .06), .02))
for y in [-.85, .85]:
    chamber.append(box(f'chamber_cradle_{y}', (0, y, .235), (.99, .24, .11), .018))
# Side clamps embed in the shell and expose their outer faces at x +/-0.625.
for x in [-.59, .59]:
    for y in [-.72, .72]:
        chamber.append(box(f'chamber_seal_clamp_{x}_{y}', (x, y, .935), (.07, .13, .13), .015, DARK))
# Cut a shallow backed seat, not a dark mesh buried in an uncut wall.
wall = chamber[1]
cutter = box('TEMP_status_seat', (0, -1.375, .77), (.68, .05, .27))
bpy.context.view_layer.objects.active = wall
mod = wall.modifiers.new('working_face_seat', 'BOOLEAN')
mod.operation = 'DIFFERENCE'
mod.solver = 'EXACT'
mod.object = cutter
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cutter, do_unlink=True)
finish(wall, 'chamber_cavity_wall')
# The plate embeds in the recess backing; relief remains within the reservation.
chamber.append(box('chamber_working_face_status_recess', (0, -1.3525, .77), (.64, .015, .23), .006, DARK))
chamber.extend(pulse('chamber_working_face_live_relief', -1.359, .77, True))
chamber.append(box('chamber_lid_status_recess', (0, -.70, 1.206), (.60, .29, .012), .004, DARK))
chamber.extend(pulse('chamber_upward_live_relief', -.70, 1.225))
for x in [-.25, .25]:
    chamber.append(rod(f'chamber_rear_union_{x}', (x, 1.35, .58), (x, 1.37, .58), .065, DARK))

# Full continuous deck-contact plinth exactly explains the accepted row footprint.
carrier = [box('carrier_continuous_deck_plinth', (0, 0, .09), (6.25, 3.75, .18))]
carrier.append(box('carrier_rear_manifold', (0, 1.625, .44), (6.25, .50, .52), .025))
xs = [-2.34375, -.78125, .78125, 2.34375]
for i, x in enumerate(xs):
    carrier.append(box(f'carrier_rear_service_panel_{i}', (x, 1.872, .44), (1.38, .006, .37), .002, DARK))
    for dx in [-.25, .25]:
        carrier.append(rod(f'carrier_supply_return_{i}_{dx}', (x+dx, 1.12, .58), (x+dx, 1.385, .58), .046, DARK))
# Infill sits outside the individual 1.25 m chamber reservations.
for i, (left, right) in enumerate([(-3.125, -2.96875), (-1.71875, -1.40625), (-.15625, .15625), (1.40625, 1.71875), (2.96875, 3.125)]):
    carrier.append(box(f'carrier_sealed_infill_{i}', ((left+right)/2, -.125, .29), (right-left, 3.00, .22)))
carrier.append(box('carrier_working_toe_face', (0, -1.75, .29), (6.25, .25, .22)))


def world_vertices(objects):
    return [obj.matrix_world @ v.co for obj in objects for v in obj.data.vertices]


def bounds(objects):
    bpy.context.view_layer.update()
    pts = world_vertices(objects)
    return [[min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]]


def geometry_digest(objects):
    data = []
    for obj in sorted(objects, key=lambda o: o.name):
        data.append({'name': obj.name, 'vertices': [[round(c, 6) for c in obj.matrix_world @ v.co] for v in obj.data.vertices],
                     'faces': [list(p.vertices) for p in obj.data.polygons]})
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


def tree(obj):
    return BVHTree.FromPolygons([obj.matrix_world @ v.co for v in obj.data.vertices], [list(p.vertices) for p in obj.data.polygons])


def inside(point, obj):
    inv = obj.matrix_world.inverted()
    p = inv @ Vector(point)
    direction = Vector((.913, .317, .257)).normalized()
    hit, loc, normal, _ = obj.ray_cast(p, direction)
    return hit and normal.dot(direction) > 0


def topology(objects):
    bad = 0
    tris = 0
    for obj in objects:
        assert all(math.isfinite(c) for v in obj.data.vertices for c in v.co), obj.name
        assert obj.matrix_world.determinant() > 0, obj.name
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bad += sum(not e.is_manifold for e in bm.edges)
        assert bm.calc_volume(signed=True) > 0, obj.name
        bm.free()
        obj.data.calc_loop_triangles()
        tris += len(obj.data.loop_triangles)
        assert all(p.area > 1e-10 for p in obj.data.polygons), obj.name
    assert bad == 0, bad
    return bad, tris


bpy.context.view_layer.update()
# Every fitting stays within the longitudinal reservation without burying it.
assert all(abs(v.x) <= .625+1e-5 and abs(v.y) <= 1.375+1e-5 and 0 <= v.z <= 1.25+1e-5
           for v in world_vertices(chamber)), 'Chamber exceeds its legal reservation'

construction = check_construction(chamber)

# Human-shaped physical fixture, not a collision circle and never exported.
proxy = []
for name, pos, size in [
    ('head', (0, .88, .56), (.145, .145, .14)),
    ('torso', (0, .34, .58), (.225, .40, .16)),
    ('pelvis', (0, -.12, .55), (.205, .22, .13)),
    ('arm_left', (-.24, .30, .49), (.07, .36, .07)),
    ('arm_right', (.24, .30, .49), (.07, .36, .07)),
    ('leg_left', (-.12, -.56, .51), (.09, .39, .09)),
    ('leg_right', (.12, -.56, .51), (.09, .39, .09)),
    ('foot_left', (-.12, -.94, .50), (.09, .085, .08)),
    ('foot_right', (.12, -.94, .50), (.09, .085, .08))]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1, location=pos)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    proxy.append(finish(obj, 'FIXTURE_205cm_'+name, BODY))

bpy.context.view_layer.update()
shell = [o for o in chamber if 'internal_bed' not in o.name]
intersections = [(p.name, s.name) for p in proxy for s in shell if tree(p).overlap(tree(s))]
assert not intersections, intersections
for p in world_vertices(proxy):
    assert abs(p.x) <= .375 and abs(p.y) <= 1.125 and .41999 <= p.z <= .85
    assert not any(inside(p, o) for o in shell)
# Sample the full specified rectangular air volume, not just proxy vertices.
probes = 0
for ix in range(9):
    for iy in range(25):
        for iz in range(5):
            p = (-.375+ix*.75/8, -1.125+iy*2.25/24, .43+iz*.42/4)
            assert not any(inside(p, o) for o in chamber), (p, 'blocked clearance')
            probes += 1
# Check continuous mesh surfaces of the reserved air prism as well as its interior samples.
air = box('FIXTURE_reserved_air_075x225x042', (0, 0, .64), (.75, 2.25, .42))
assert not any(tree(air).overlap(tree(o)) for o in chamber)
air.hide_render = True
air.hide_set(True)
body_bounds = bounds(proxy)
proxy_meshes = [(o.name, [list(o.matrix_world @ v.co) for v in o.data.vertices],
                 [list(p.vertices) for p in o.data.polygons]) for o in proxy]
assert abs(body_bounds[1][1]-body_bounds[0][1]-2.05) < 1e-5
nonmanifold, chamber_triangles = topology(chamber)
_, carrier_triangles = topology(carrier)

# Export reusable resources with deck-centred origins before arranging the fixture.
def export(name, objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    file = PUBLIC / f'{name}.glb'
    bpy.ops.export_scene.gltf(filepath=str(file), export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_animations=False, export_extras=False,
        export_cameras=False, export_lights=False, export_texcoords=True, export_normals=True)
    assert file.read_bytes()[:4] == b'glTF'


export('chamber', chamber)
export('row-carrier', carrier)
chamber_local_bounds = bounds(chamber)
geometry_hashes = {'chamber': geometry_digest(chamber), 'row-carrier': geometry_digest(carrier)}
placements = []
rows = []
for i, x in enumerate(xs):
    parts = []
    for original in chamber:
        obj = original.copy()
        obj.data = original.data  # four fixture placements share the same meshes
        bpy.context.collection.objects.link(obj)
        obj.name = f'row_A_{i+1}_{original.name}'
        obj.location += Vector((x, -.25, 0))
        parts.append(obj)
    rows.extend(parts)
    placements.append({'id': f'A{i+1}', 'translation_blender_m': [x, -.25, 0],
                       'room_bounds_game': [325+50*i, 264, 365+50*i, 352]})
for obj in chamber+proxy:
    obj.hide_render = True
    obj.hide_set(True)
bpy.context.view_layer.update()
row_bounds = bounds(carrier+rows)
assert all(row_bounds[0][i] >= [-3.125, -1.875, 0][i]-1e-5 and row_bounds[1][i] <= [3.125, 1.875, 1.25][i]+1e-5 for i in range(3)), row_bounds
# Vertical contact rays prove that supports land on the continuous plinth.
contacts = []
plinth = carrier[0]
for x in xs:
    for y in [-1.10, .60]:
        hit, loc, _, _ = plinth.ray_cast(Vector((x, y, .181))-plinth.location, Vector((0, 0, -1)))
        assert hit and abs((loc+plinth.location).z-.18) < 1e-5
        contacts.append([x, y, .18])

# Save original editable named-part scene and source-only hidden fit objects.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'passenger-vault.blend'))

# Validate actual exported geometry in a fresh scene, then render imports.
bpy.ops.object.select_all(action='SELECT')
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
roundtrip = {}
imports = {}
for name, expected in [('chamber', chamber_local_bounds), ('row-carrier', [[-3.125, -1.875, 0], [3.125, 1.875, .70]])]:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(PUBLIC / f'{name}.glb'))
    objects = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    imports[name] = objects
    actual = bounds(objects)
    assert all(abs(actual[k][i]-expected[k][i]) < 1e-4 for k in range(2) for i in range(3)), (name, actual, expected)
    assert not any('FIXTURE' in o.name for o in objects)
    assert all(math.isfinite(c) for p in world_vertices(objects) for c in p)
    triangles = sum(len(o.data.polygons) for o in objects)
    roundtrip[name] = {'passed': True, 'bounds_blender_m': actual, 'mesh_objects': len(objects), 'triangles': triangles}
    if name == 'chamber':
        roundtrip[name]['construction'] = check_construction(objects)

# Render staging is diagnostic studio only, not gameplay evidence.
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.cycles.use_denoising = False
scene.render.resolution_x = 1200
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.world.color = (.20, .20, .20)
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.render.film_transparent = False
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = 'ORTHO'
scene.camera = camera
for name, pos, power, size in [('key', (1, -4, 8), 1800, 7), ('fill', (-5, -1, 4), 1200, 6), ('rear', (0, 5, 6), 1600, 5)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object
    light.name = name
    light.data.energy = power
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, .5))-light.location).to_track_quat('-Z', 'Y').to_euler()


def show(objects):
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.hide_render = obj not in objects


def render(name, objects, position, target, scale, title, subtitle):
    show(objects)
    camera.location = position
    camera.rotation_euler = (Vector(target)-camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.ortho_scale = scale
    bpy.context.view_layer.update()
    texts = []
    for line, y, size in [(title, .33*scale, .022*scale), (subtitle, -.34*scale, .014*scale)]:
        curve = bpy.data.curves.new('diagnostic_annotation', 'FONT')
        curve.body = line
        curve.size = size
        obj = bpy.data.objects.new('diagnostic_annotation', curve)
        bpy.context.collection.objects.link(obj)
        obj.matrix_world = camera.matrix_world.copy()
        obj.location = camera.matrix_world @ Vector((-.46*scale, y, -5))
        obj.data.materials.append(ANNOTATION)
        texts.append(obj)
    scene.render.filepath = str(EVIDENCE / name)
    bpy.ops.render.render(write_still=True)
    for obj in texts:
        bpy.data.objects.remove(obj, do_unlink=True)


if not args.skip_renders:
    ci = imports['chamber']
    ca = imports['row-carrier']
    render('chamber-closed.png', ci, (4, -6, 4), (0, 0, .6), 4.4,
           'Closed chamber | construction candidate', 'Envelope 1.25 x 2.75 m | deck-relative height <= 1.25 m | GLB roundtrip')
    row_render = list(ca)
    for i, x in enumerate(xs):
        for original in ci:
            obj = original.copy()
            obj.data = original.data
            bpy.context.collection.objects.link(obj)
            obj.location += Vector((x, -.25, 0))
            row_render.append(obj)
    render('row-closed.png', row_render, (8, -10, 8), (0, 0, .4), 9.2,
           'Carrier A | four closed chambers', '6.25 x 3.75 m reservation | continuous deck-contact base | neutral GLB imports')
    render('row-top.png', row_render, (0, 0, 12), (0, 0, 0), 8.0,
           'Carrier A | orthographic plan', 'Four chambers at 1.5625 m pitch | rear manifold north | working face south')
    render('carrier-rear.png', row_render, (-7, 9, 5), (0, 0, .4), 9.0,
           'Carrier A | service approach', 'Separate supply/return unions | enclosed rear manifold | removable rear panels')
    # Retain exact validated fixture vertices without reloading the current blend library.
    # Ubuntu Blender 4.0.2 segfaults when loading that library in this process.
    proxy_import = []
    for name, vertices, faces in proxy_meshes:
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        finish(obj, name, BODY)
        proxy_import.append(obj)
    cut = []
    for original in ci:
        if not any(n in original.name for n in ['lower_pan', 'cavity_wall', 'closed_domed_lid', 'inset_gasket', 'internal_bed', 'cradle']):
            continue
        obj = original.copy()
        obj.data = original.data.copy()
        bpy.context.collection.objects.link(obj)
        # Remove camera-facing half of enclosure, preserve bed and rear cradle for context.
        if any(n in obj.name for n in ['cavity_wall', 'closed_domed_lid', 'inset_gasket']):
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            inv = obj.matrix_world.inverted()
            bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
                                  plane_co=inv @ Vector((0, 0, 0)), plane_no=(1, 0, 0), clear_outer=True, clear_inner=False)
            bm.to_mesh(obj.data)
            bm.free()
        cut.append(obj)
    render('chamber-cutaway.png', cut+proxy_import, (4, -5, 4), (0, 0, .6), 4.5,
           'SOURCE-ONLY cutaway | no body in shipping GLB', '2.05 m human fixture | clear prism 0.75 x 2.25 x 0.42 m | bed top z0.42')
    render('chamber-section.png', cut+proxy_import, (6, 0, .6), (0, 0, .6), 3.7,
           'SOURCE-ONLY longitudinal section', 'Cavity wall top z0.92 | lid underside z0.94 | proxy top z0.74 | metres')

manifest = {
    'schema': 1, 'gate': 'construction candidate; independent review pending',
    'authority_source': 'e0ac00ffad50e5ebc1da9851833b18cfe6978212',
    'blender_version': bpy.app.version_string, 'procedural_seed': 0, 'randomness': 'none',
    'delivered': {'carriers': 1, 'chambers': 4},
    'remaining_room_inventory': '3 carriers, 12 chambers, 2 distribution units, 2 consoles, 1 flush kit',
    'coordinates': 'metres; Blender X east, Y north, Z up; glTF Y up, Z south; divide game by32',
    'mount_A_game': [420, 300, 0], 'placements': placements,
    'southern_orientation': 'Future instance: proper rotation pi about glTF Y, no negative scale; not delivered as a full-row fit gate',
    'geometry_hashes': geometry_hashes, 'roundtrip': roundtrip,
    'validation': {'passed': True, 'construction': construction, 'clearance_probes': probes, 'proxy_intersections': intersections,
        'air_prism_surface_intersections': 0, 'body_bounds': body_bounds, 'internal_air_prism_m': [.75, 2.25, .42],
        'nonmanifold_edges': nonmanifold, 'row_bounds': row_bounds, 'cradle_deck_contacts': contacts,
        'chamber_triangles': chamber_triangles, 'carrier_triangles': carrier_triangles,
        'placed_triangles': 4*chamber_triangles+carrier_triangles},
    'limitations': ['No material or medical/pressure certification', 'No runtime integration, full-room fit or gameplay pixels',
        'Lids remain closed; opening and passenger loading mechanics are not implemented',
        'Diagnostic grayscale relief cues need future material and shipping-camera readability review'],
    'files': {}}
for path in [OUT / 'passenger-vault.blend', *sorted(PUBLIC.glob('*.glb')), *sorted(EVIDENCE.glob('*.png'))]:
    raw = path.read_bytes()
    manifest['files'][str(path.relative_to(ROOT))] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print('PASSENGER_GEOMETRY_VERIFIED '+json.dumps(manifest['validation']))
