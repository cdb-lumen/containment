"""Original sealed cryochamber benchmark. Blender 4, meters, Z up.
blender -b --factory-startup --python-exit-code 1 -P scripts/build-sealed-cryo.py
No third-party geometry or textures. References documented in handoff.
"""
import bpy, math, json, pathlib
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/benchmark';OUT.mkdir(parents=True,exist_ok=True)
E=pathlib.Path('/home/chernodubv/.hermes/workspaces/containment-cryo-model-benchmark');E.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(n,c,metal=0,rough=.4):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
ivory=mat('01 warm ceramic enamel',(.38,.46,.44),.05,.48)
paint=mat('02 graphite powdercoat',(.055,.095,.103),.3,.48)
steel=mat('03 satin stainless',(.16,.21,.23),.45,.66)
seal=mat('04 EPDM gasket',(.013,.023,.026),0,.84)
amber=mat('05 safety ochre',(.8,.35,.055),.15,.45)
ink=mat('06 printed markings',(.075,.13,.14),0,.65)
blue=mat('07 supply identification',(.04,.32,.43),.15,.4)
def finish(o,n,m):
 o.name=n;o.data.materials.append(m);return o
def box(n,p,s,m,r=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.dimensions=s;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if r:
  b=o.modifiers.new('Tool radius','BEVEL');b.width=r;b.segments=4;bpy.ops.object.modifier_apply(modifier=b.name)
  for p in o.data.polygons:p.use_smooth=True
  o.data.use_auto_smooth=True;b=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');b.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=b.name)
 return finish(o,n,m)
def cyl(n,p,r,d,m,axis=(0,0,1),verts=32):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=p);o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector(axis).to_track_quat('Z','Y');b=o.modifiers.new('Machined edge','BEVEL');b.width=.004;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
 for p in o.data.polygons:p.use_smooth=True
 o.data.use_auto_smooth=True;b=o.modifiers.new('Machined normals','WEIGHTED_NORMAL');b.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=b.name)
 return finish(o,n,m)
def pipe(n,pts,r,m):
 c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.resolution_u=16;c.bevel_depth=r;c.bevel_resolution=3;s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for b,p in zip(s.bezier_points,pts):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');return finish(o,n,m)
def text(n,body,p,size,m):
 c=bpy.data.curves.new(n,'FONT');c.body=body;c.size=size;c.extrude=.0003;c.align_x='CENTER';o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.location=p;bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');finish(o,n,m)
# Approved single cassette reservation: 84 x 86 game units, scale 50 units/m.
# Braced rack supports and isolation pads belong to this one cassette only.
for x in [-.64,.64]:
 box('Rack longitudinal folded rail',(x,0,.095),(.10,1.68,.14),steel,.012)
 for y in [-.58,.58]:
  box('Bolted foot',(x,y,.035),(.25,.25,.06),paint,.018)
  box('Elastomer isolation block',(x,y,.20),(.20,.22,.08),seal,.016)
  for dx in [-.075,.075]:cyl('Anchor bolt',(x+dx,y,.073),.022,.015,steel,verts=6)
for y in [-.58,.58]:box('Rack transverse support',(0,y,.145),(1.42,.12,.13),paint,.018)
box('Insulated lower vessel',(-.12,-.09,.35),(1.10,1.50,.30),paint,.14)
box('Rolled stainless compression flange',(-.12,0,.476),(1.16,1.72,.065),steel,.12)
box('Continuous black pressure gasket',(-.12,0,.514),(1.10,1.66,.035),seal,.11)
box('Thick removable enamel lid',(-.12,0,.581),(1.08,1.64,.115),ivory,.105)
# Nested top skin forms a genuine recessed step, not a painted black line.
box('Lid inset shadow reveal',(-.12,.035,.640),(.80,1.40,.024),seal,.115)
box('Recessed formed crown',(-.12,.035,.655),(.755,1.355,.045),ivory,.11)
# Pocket is physically cut through the crown; screen sits below surrounding skin.
crown=bpy.data.objects.get('Recessed formed crown')
cutter=box('temporary pocket cutter',(-.12,-.35,.682),(.64,.32,.055),paint,.018)
bpy.context.view_layer.objects.active=crown
mod=crown.modifiers.new('Milled instrument recess','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cutter,do_unlink=True)
# Boolean-generated planar faces must not interpolate old bevel normals.
for face in crown.data.polygons:
 if abs(face.normal.z)>.999:face.use_smooth=False
bpy.context.view_layer.objects.active=crown
wn=crown.modifiers.new('Post recess weighted normals','WEIGHTED_NORMAL');wn.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=wn.name)
box('Instrument pocket dark lining',(-.12,-.35,.658),(.635,.315,.014),paint,.016)
# Opaque head-end shell, no frost-painted window or implied empty chamber.
box('Head end protective crown',(-.12,.40,.681),(.58,.37,.036),ivory,.08)
for x in [-.675,.435]:
 for y in [-.47,.47]:
  box('Latch fixed receiver',(x,y,.466),(.075,.16,.12),paint,.014)
  box('Over-centre pressure latch',(x,y,.549),(.065,.115,.16),steel,.015)
  box('Latch safety tab',(x,y,.622),(.067,.058,.024),amber,.006)
  cyl('Latch pivot',(x,y,.548),.023,.084,steel,axis=(1,0,0))
# Two purposeful jacketed loops link vessel ports to rack manifold.
box('Service bay recessed back',(-.12,.657,.335),(.90,.025,.23),seal,.01)
box('Service bay lower sill',(-.12,.745,.205),(.98,.22,.045),paint,.015)
for x in [-.62,.38]:box('Service bay side cheek',(x,.735,.33),(.055,.23,.25),paint,.015)
for x,m,label in [(-.36,blue,'SUPPLY'),(.12,amber,'RETURN')]:
 box('Rack service block '+label,(x,.77,.245),(.16,.14,.065),paint,.015)
 cyl('Manifold hex union '+label,(x,.77,.29),.052,.05,steel,verts=6)
 cyl('Vessel socket '+label,(x,.70,.385),.060,.09,steel,axis=(0,1,0),verts=6)
 cyl('Circuit collar '+label,(x,.752,.385),.048,.025,m,axis=(0,1,0))
 pipe('Vacuum jacket flexible '+label,[(x,.77,.385),(x,.825,.38),(x,.825,.34),(x,.77,.325)],.024,steel)
 # Local protective corrugation where flex exits the union.
 for z in [.309,.319,.329]:cyl('Strain relief ring '+label,(x,.77,z),.030,.006,paint)
# Valid per-face UV coordinates even though this benchmark uses no image textures.
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT')
# Human-length standalone revision: 2.58 m flange, 2.25 m lower vessel.
# Room reservation stays 1.68 x 1.72 m, so this model MUST NOT replace it in place.
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':
  o.location.y*=1.5;o.scale.y*=1.5
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
rough=bpy.data.images.load(str(OUT/'cryo-enamel-roughness.png'));rough.colorspace_settings.name='Non-Color';rough.pack()
n=ivory.node_tree.nodes.new('ShaderNodeTexImage');n.image=rough;ivory.node_tree.links.new(n.outputs['Color'],ivory.node_tree.nodes.get('Principled BSDF').inputs['Roughness'])
atlas=bpy.data.images.load(str(OUT/'cryo-graphics-atlas.png'));atlas.pack()
def graphic_mat(name,emission):
 m=mat(name,(1,1,1),0,.72);nodes=m.node_tree.nodes;p=nodes.get('Principled BSDF');t=nodes.new('ShaderNodeTexImage');t.image=atlas;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 if emission:m.node_tree.links.new(t.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.25
 return m
def graphic(name,x,y,z,w,h,uv,m):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata([(x-w/2,y-h/2,z),(x+w/2,y-h/2,z),(x+w/2,y+h/2,z),(x-w/2,y+h/2,z)],[],[(0,1,2,3)]);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,m);layer=mesh.uv_layers.new(name='Atlas UV')
 u0,v0,u1,v1=uv
 for loop,co in zip(layer.data,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):loop.uv=co
screen=graphic_mat('08 recessed medical LCD atlas',True);decal=graphic_mat('09 enamel silkscreen atlas',False)
graphic('Recessed medical display',-.12,-.525,.666,.60,.435,(0,.5,1,1),screen)
graphic('Small casing pod identification',-.12,.08,.678,.34,.085,(0,.25,1,.5),decal)
asset=list(bpy.context.scene.objects)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'sealed-cryo.blend'))
# Join compatible meshes by material after applying normals and UVs.
# The editable blend retains named construction parts; only export is batched.
groups={m:[o for o in asset if o.type=='MESH' and o.active_material==m] for m in {o.active_material for o in asset if o.type=='MESH'}}
for m,parts in sorted(groups.items(),key=lambda item:item[0].name):
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();parts[0].name='Batch '+m.name
asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
glb=OUT/'sealed-cryo.glb';bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_extras=True)
assert glb.read_bytes()[:4]==b'glTF'
# Import into empty scene proves actual exporter/importer compatibility.
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=str(glb))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];coords=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
stats={'bytes':glb.stat().st_size,'meshes':len(meshes),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),'materials':len({m.name for o in meshes for m in o.data.materials}),'boundsBlender':[[min(v[i] for v in coords),max(v[i] for v in coords)] for i in range(3)],'uvMeshes':sum(bool(o.data.uv_layers) for o in meshes),'imageTextures':True,'bakedNormalMap':False,'fitsApprovedReservation':False,'roundtrip':'PASS'}
assert stats['uvMeshes']==stats['meshes'];assert all(math.isfinite(q) for v in coords for q in v)
(E/'asset-stats.json').write_text(json.dumps(stats,indent=2))
# Neutral studio only. Not shipping lighting.
box('Studio floor',(0,0,-.065),(200,200,.1),mat('studio',(.055,.069,.08),0,.7),0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False;scene.render.resolution_x=1300;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(.18,.18,.18)
def light(n,p,power,size):
 bpy.ops.object.light_add(type='AREA',location=p);o=bpy.context.object;o.name=n;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.3))-o.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox',(-3,-4,6),650,4);light('Rim',(2,3,4),800,3);light('Fill',(4,-1,2),180,3)
bpy.ops.object.camera_add(location=(2.65,-3.5,3.05));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.32))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.7;scene.camera=cam
scene.render.filepath=str(E/'studio-closeup.png');bpy.ops.render.render(write_still=True)
cam.location=(2.5,3.5,2.2);cam.rotation_euler=(Vector((0,.25,.32))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(E/'studio-service.png');bpy.ops.render.render(write_still=True)
print(json.dumps(stats))
