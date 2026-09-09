"""Create an editable material review scene from the actual exports, no render.
blender -b --factory-startup --python-exit-code 1 --python tools/assets/passenger-vault/material_scene.py
The accepted construction .blend is never opened or written.
"""
import json
import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'tools/assets/passenger-vault/materials'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
bpy.context.scene.unit_settings.system='METRIC'
bpy.context.scene.unit_settings.scale_length=1
sources={};report={'status':'Imported material source validation, independent review pending','assets':{}}
for family in ['chamber','row-carrier']:
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/f'public/assets/passenger-vault/materials/wear-{family}.glb'))
    meshes=[o for o in bpy.data.objects if o not in before and o.type=='MESH'];sources[family]=meshes
    triangles=0
    for o in meshes:
        assert o.data.uv_layers.active is not None,o.name
        assert all(math.isfinite(c) for v in o.data.vertices for c in v.co),o.name
        assert all(math.isfinite(c) for p in o.data.polygons for c in p.normal),o.name
        assert all(math.isfinite(c) for p in o.data.uv_layers.active.data for c in p.uv),o.name
        o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
    report['assets'][family]={'meshes':len(meshes),'triangles':triangles,'uv_normals_positions_finite':True}
# Blender Z up and Y north, matching construction source.
for row,(x,y,angle) in enumerate([(420,-300,0),(780,-300,0),(420,-580,math.pi),(780,-580,math.pi)]):
    root=bpy.data.objects.new(f'carrier_{row+1}_four_closed_living_chambers',None);bpy.context.collection.objects.link(root)
    root.location=(x/32,y/32,0);root.rotation_euler.z=angle
    for family,offsets in [('row-carrier',[(0,0,0)]),('chamber',[(x,-.25,0) for x in [-2.34375,-.78125,.78125,2.34375]])]:
        for slot,offset in enumerate(offsets):
            for original in sources[family]:
                obj=original.copy();obj.data=original.data;bpy.context.collection.objects.link(obj)
                obj.name=f'row_{row+1}_{slot+1}_{original.name}';obj.parent=root;obj.location+=Vector(offset)
for objects in sources.values():
    for o in objects:bpy.data.objects.remove(o,do_unlink=True)
report['images']=[{'name':i.name,'color_space':i.colorspace_settings.name,'size':list(i.size)} for i in bpy.data.images if i.type=='IMAGE']
assert {i['color_space'] for i in report['images']}=={'sRGB','Non-Color'},report['images']
for image in bpy.data.images:
    if image.type=='IMAGE':image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'material-fixture.blend'))
(OUT/'blender-import.json').write_text(json.dumps(report,indent=2)+'\n')
print('MATERIAL_IMPORT_PASS '+json.dumps(report))
