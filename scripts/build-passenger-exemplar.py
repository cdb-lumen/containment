"""Simplify saved room-fit revision3. ONE closed vessel, no extraction rig.
blender -b -t 1 --python-exit-code 1 -P scripts/build-passenger-exemplar.py
Input may be overridden with PASSENGER_SAVED_BLEND; original remains untouched.
"""
import bpy, json, os, hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/passenger-vault'; OUT.mkdir(parents=True,exist_ok=True)
SRC=Path(os.environ.get('PASSENGER_SAVED_BLEND',str(ROOT/'assets-source/passenger-vault/room-fit-reference.blend')))
bpy.ops.wm.open_mainfile(filepath=str(SRC));bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
upper=[o for o in scene.objects if o.name.startswith('REFERENCE upper')]
lower=[o for o in scene.objects if o.name.startswith('REFERENCE lower')]
context=[o for o in scene.objects if o.name.startswith(('architecture_','existing_vessel_or_trunk_','adjacent occupied'))]
keep=upper+lower+context
for o in list(scene.objects):
 if o not in keep:bpy.data.objects.remove(o,do_unlink=True)
assert len(upper)==8 and len(lower)==8
# Match the room-only recessed west rib revision. Full tubes remain connected to liner.
for name in ['architecture_shaft_178','architecture_shaft_179']:bpy.data.objects[name].location.x-=5.5/32
steel=bpy.data.materials.new('Static satin steel');steel.use_nodes=True
bs=steel.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.24,.31,.33,1);bs.inputs['Metallic'].default_value=.7;bs.inputs['Roughness'].default_value=.48
service=bpy.data.materials.new('Jacketed service');service.use_nodes=True
bs=service.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.12,.22,.24,1);bs.inputs['Metallic'].default_value=.3;bs.inputs['Roughness'].default_value=.6
parts=[];supports=[];circuits=[[],[]]
def finish(o,name,material,group):
 o.name=name;o.data.materials.clear();o.data.materials.append(material)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if not o.data.uv_layers:o.data.uv_layers.new()
 parts.append(o);group.append(o);return o
def box(name,c,s,group=supports):
 bpy.ops.mesh.primitive_cube_add(size=1,location=Vector(c)/32);o=bpy.context.object;o.dimensions=Vector(s)/32
 return finish(o,name,steel,group)
def pipe(name,a,b,r,group,material=service):
 a,b=Vector(a)/32,Vector(b)/32;d=b-a
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r/32,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
 return finish(o,name,material,group)
# End posts are outside BOTH the native lower shell and the shipped lower pod.
for x in [-17.25,17.25]:
 for y in [-47,47]:
  box(f'Floor foot {x} {y}',(x,y,-154.96),(5,4,2.4))
  box(f'End post {x} {y}',(x,y,(-153.76-15.84)/2),(2.5,2,137.92))
 box(f'Longitudinal static beam {x}',(x,0,-14.34),(2.5,96,3))
 for y in [-27.84,27.84]:box(f'Foot bearing {x} {y}',(x,y,-10.34),(2.5,10,5))
# Each circuit has its own rearward lane and trunk union. No shared hose centerline.
for i,x in enumerate([-11.52,3.84]):
 y=48+i*4
 points=[(x,40.32,-.16),(x,y,-.16),(x,y,-124.8),(-24,y,-124.8)]
 for j,(a,b) in enumerate(zip(points,points[1:])):pipe(f'Circuit {i} run {j}',a,b,.65,circuits[i])
 pipe(f'Circuit {i} manifold coupling',(x,39.7,-.16),(x,41.5,-.16),1.15,circuits[i],steel)
 pipe(f'Circuit {i} trunk coupling',(-25,y,-124.8),(-22.7,y,-124.8),1.15,circuits[i],steel)
bpy.context.view_layer.update()
def bb(o):
 vs=[o.matrix_world@v.co*32 for v in o.data.vertices];return [[min(v[i] for v in vs),max(v[i] for v in vs)] for i in range(3)]
def overlap(a,b):return all(min(a[i][1],b[i][1])-max(a[i][0],b[i][0])>.002 for i in range(3))
def tree(o):return BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons])
def audit(a,b):
 hits=[]
 for p in a:
  for q in b:
   if p==q or not overlap(bb(p),bb(q)):continue
   count=len(tree(p).overlap(tree(q)))
   if count:hits.append({'a':p.name,'b':q.name,'triangle_pairs':count})
 return hits
# Actual original lower pod is a conservative closed bounding box, not a new vessel.
proxy=box('CHECK existing lower pod',(0,0,-87),(55.04,89.6,28),[]);parts.remove(proxy)
report={'input':str(SRC),'input_sha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'one_closed_vessel':len(upper)==8,'native_scale':32,'support_vs_native_lower':audit(supports,lower),'support_vs_shipped_lower':audit(supports,[proxy]),'support_vs_upper':audit(supports,upper),'cross_circuit':audit(circuits[0],circuits[1]),'room_hits':audit(upper+parts,context),'bounds':{o.name:bb(o) for o in upper+parts},'deferred':['replication','lower-vessel replacement','extraction machinery','moving service lines'],'limitations':['Static triangle intersections and bounds, not structural or medical certification.','Original closed-vessel material joins and exact foot seating are intentional.','Service manifold and trunk couplings are explicit intended endpoint contacts.']}
# Only each short terminal run can join the existing west trunk. Other run names,
# couplings or circuits cannot inherit this exemption. The measured run terminates
# at x=-24 and is confined to its own y lane, z=-124.8 +/- radius.
intended={(f'Circuit {i} run 2','existing_vessel_or_trunk_bronze_320') for i in range(2)}
for i in range(2):
 terminal=bpy.data.objects[f'Circuit {i} run 2']; bounds=bb(terminal)
 assert bounds[0][0]>=-24.01 and bounds[0][1]<=3.85
 assert bounds[1][0]>=48+i*4-.66 and bounds[1][1]<=48+i*4+.66
 assert bounds[2][0]>=-125.46 and bounds[2][1]<=-124.14
unwanted=[p for p in report['room_hits'] if (p['a'],p['b']) not in intended]
report['unwanted_room_hits']=unwanted
(OUT/'geometry-audit.json').write_text(json.dumps(report,indent=2)+'\n')
assert not report['support_vs_native_lower'],report['support_vs_native_lower']
assert not report['support_vs_shipped_lower'],report['support_vs_shipped_lower']
assert not report['support_vs_upper'],report['support_vs_upper']
assert not report['cross_circuit'],report['cross_circuit']
assert not unwanted,unwanted
for o in lower+context+[proxy]:bpy.data.objects.remove(o,do_unlink=True)
for im in bpy.data.images:
 if im.source=='FILE':im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'exemplar.blend'))
# Batch only newly authored parts by material, preserving source PBR batches.
groups=[[o for o in parts if o.data.materials[0]==material] for material in [steel,service]]
for material,group in zip([steel,service],groups):
 bpy.ops.object.select_all(action='DESELECT')
 for o in group:o.select_set(True)
 bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();bpy.context.object.name=material.name
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'exemplar.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(OUT/'exemplar.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert len(meshes)==10
assert all(o.data.uv_layers for o in meshes)
report['roundtrip']={'meshes':len(meshes),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),'bytes':(OUT/'exemplar.glb').stat().st_size}
report['glb_sha256']=hashlib.sha256((OUT/'exemplar.glb').read_bytes()).hexdigest()
(OUT/'geometry-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report['roundtrip']))
