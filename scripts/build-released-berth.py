"""Original released berth refinement. Native 32 game units/unit, no scale adapter.
python3 scripts/create-released-berth-atlas.py
blender -b --factory-startup --python-exit-code 1 -P scripts/build-released-berth.py
BERTH_EVIDENCE optionally overrides evidence output. No runtime files are touched.
"""
import bpy, math, json, pathlib, os
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/awakening/released-berth';OUT.mkdir(parents=True,exist_ok=True)
E=pathlib.Path(os.environ.get('BERTH_EVIDENCE','/home/chernodubv/.hermes/workspaces/containment-awakening-completion/released-berth'));E.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'public/assets/benchmark/sealed-cryo.blend'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
M={n:bpy.data.materials.get(n) for n in ['01 warm ceramic enamel','02 graphite powdercoat','03 satin stainless','04 EPDM gasket','05 safety ochre']}
ivory,paint,steel,seal,amber=M.values()
def mat(n,c,rough=.6):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;return m
cushion=mat('10 washable recovery upholstery',(.18,.25,.25),.85)
def p(x,y,h):return ((x-135)/32,-(y-440)/32,h/32)
def finish(o,n,m):
 o.name=n;o.data.materials.append(m)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT')
 return o
def box(n,x,y,h,w,d,t,m,r=1):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p(x,y,h));o=bpy.context.object;o.dimensions=(w/32,d/32,t/32);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if r:
  b=o.modifiers.new('Manufactured rolled edge','BEVEL');b.width=r/32;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
  for f in o.data.polygons:f.use_smooth=True
  o.data.use_auto_smooth=True;b=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');b.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=b.name)
 return finish(o,n,m)
def pipe(n,a,b,r,m):
 a,b=Vector(p(*a)),Vector(p(*b));bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r/32,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return finish(o,n,m)
# Supported shallow pressure vessel, open and low on the east.
box('Folded cradle base',135,440,3,88,118,6,paint,3)
box('Insulated enamel lower pan',135,440,6,80,112,6,ivory,4)
box('Continuous recessed inner gasket',136,442,8,61,87,2,seal,4)
box('Removable formed interior liner',136,442,8.8,57,83,1.7,steel,4)
# Interior useful adult envelope 44 x 76 = 1.375 x 2.375 units.
for y,d in [(419,20),(441,22),(463,20)]:
 box('Welded washable cushion segment',136,y,10.2,44,d,2.8,cushion,2)
box('Low shaped head cushion',136,410,11.5,30,10,4,cushion,3)
for x in [106,166]:box('Rolled side flange',x,444,9,4,77,4,ivory,1.7)
box('Low transfer sill east',176,440,5,6,70,6,steel,1)
box('Foot end service cap',135,490,8,64,12,8,ivory,3)
box('Foot cap inset seam',135,496.1,7,44,.35,3,seal,.12)
for x in [114,156]:
 for y in [484,493]:pipe('Captive service screw',(x,y,12),(x,y,12.4),.8,steel)
# North parked, three nested lid sections. No cover above the usable berth.
for x in [101,169]:
 box('Recessed longitudinal slide channel',x,440,15,4,110,4,seal,.8)
 box('Polished channel runner',x,440,17,1.3,108,1,steel,.3)
 box('Bolted north slide carriage',x,395,20,6,18,8,paint,1)
 pipe('Actuator shaft',(x,399,19),(x,428,19),1.2,steel)
 pipe('Actuator sleeve',(x,402,19),(x,414,19),2.1,paint)
 for y in [389,401]:pipe('Carriage captive bolt',(x,y,24),(x,y,24.5),.75,steel)
for i,(y,h,w,d) in enumerate([(393,23,76,20),(394,28,72,18),(395,33,68,16)]):
 box('Parked lid gasket '+str(i),135,y,h-2.5,w-1,d-1,1.2,seal,1.7)
 box('Nested formed enamel lid '+str(i),135,y,h,w,d,4,ivory,2)
 # Framed recessed upper panel avoids false coplanar screen.
 if i<2:box('Lid recessed graphite insert '+str(i),135,y,h+2.1,w-9,d-6,.3,paint,1)
# Small top display in a four-sided machined pocket, not a giant sign.
box('Medical instrument pocket lining',135,395,35.1,33,11,.35,seal,.8)
for x in [117.8,152.2]:box('Display raised side bezel',x,395,35.7,1.4,12,1.4,steel,.3)
for y in [389.3,400.7]:box('Display raised end bezel',135,y,35.7,35.8,1.4,1.4,steel,.3)
atlas=bpy.data.images.load(str(OUT/'released-berth-atlas.png'));atlas.pack()
rough=bpy.data.images.load(str(OUT/'released-berth-roughness.png'));rough.colorspace_settings.name='Non-Color';rough.pack()
def atlasmat(n,emission=0):
 m=mat(n,(1,1,1));nt=m.node_tree;bs=nt.nodes.get('Principled BSDF');t=nt.nodes.new('ShaderNodeTexImage');t.image=atlas;nt.links.new(t.outputs['Color'],bs.inputs['Base Color']);r=nt.nodes.new('ShaderNodeTexImage');r.image=rough;nt.links.new(r.outputs['Color'],bs.inputs['Roughness'])
 if emission:nt.links.new(t.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=emission
 return m
def graphic(n,x,y,h,w,d,uv,m):
 mesh=bpy.data.meshes.new(n);mesh.from_pydata([p(x-w/2,y+d/2,h),p(x+w/2,y+d/2,h),p(x+w/2,y-d/2,h),p(x-w/2,y-d/2,h)],[],[(0,1,2,3)]);mesh.update();o=bpy.data.objects.new(n,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(m);layer=mesh.uv_layers.new();u0,v0,u1,v1=uv
 for loop,co in zip(layer.data,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):loop.uv=co
 return o
graphic('Recessed RELEASE COMPLETE medical display',135,395,35.35,32,10,(0,.5,1,1),atlasmat('11 release LCD',.12))
# Open latch receivers and rolled restraint webbing stay beside, not across, bed.
for y in [425,459]:
 for x,side in [(109,-1),(163,1)]:
  box('Latch receiver',x,y,11,6,5,3,paint,.7)
  pipe('Released buckle hinge',(x-2,y,13),(x+2,y,13),.9,steel)
  box('Released latch lever',x,y+3,13,3,7,1.2,steel,.4)
  box('Latch amber safety detent',x,y+5,13.7,2,2,.3,amber,.15)
  pipe('Rolled released restraint',(x-2,y-4,12.5),(x+2,y-4,12.5),2,seal)
  box('Loose short webbing tail',x,y-7,10.5,4,4,.5,seal,.3)
# West-only welded recovery rail and deck-contact sockets.
for y in [389,442,491]:
 box('West rail bolted foot',96,y,2,7,8,4,steel,.6)
 pipe('West rail stanchion',(96,y,3),(96,y,27),1.3,steel)
 box('West rail socket',96,y,6,4,4,5,paint,.5)
pipe('Continuous west recovery handgrip',(96,386,28),(96,494,28),1.5,ivory)
# Deliberate handling abrasion only at transfer sill and latch contact points.
for y in [433,452,470]:
 for j in range(3):box('Transfer contact enamel rub',173+j*.45,y+j*.9,8.06,.3,2.8-j*.5,.08,paint,.03)
# Flush existing landing, no new boxes above .6 game units.
box('Flush recovery deck',209,440,.16,58,120,.32,paint,0)
graphic('Inset non-slip recovery tread',209,440,.335,50,113,(0,0,1,.49),atlasmat('12 deck tread'))
for x in [182,236]:box('Flush deck steel border',x,440,.36,1,116,.16,steel,0)
for y in [392,488]:box('Small transfer alignment mark',188,y,.4,9,2,.2,amber,.1)
asset=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in asset:o['assembly']='released-berth';o['nativeGameUnitsPerUnit']=32
bpy.context.scene['mountGameXY']=[135,440];bpy.context.scene['pose']='released-empty';bpy.context.scene['sourceContract']='ce03fb6 awakeningRelease and AWAKENING_FUNCTIONAL_ENVELOPES'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'released-berth.blend'))
groups={m:[o for o in asset if o.active_material==m] for m in {o.active_material for o in asset}}
for m,parts in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();parts[0].name='Batch '+m.name
bpy.ops.object.select_all(action='SELECT');glb=OUT/'released-berth.glb';bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_extras=True)
assert glb.read_bytes()[:4]==b'glTF'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=str(glb))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];coords=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
game=[(v.x*32+135,440-v.y*32,v.z*32) for v in coords]
assert all(math.isfinite(n) for v in game for n in v)
assert all(90-.01<=x<=238+.01 and 380-.01<=y<=500+.01 for x,y,h in game)
assert all(h<=.601 for x,y,h in game if x>=180)
assert all(h<=40.01 for x,y,h in game)
assert all(bool(o.data.uv_layers) for o in meshes)
stats={'roundtrip':'PASS','nativeGameUnitsPerUnit':32,'mountGameXY':[135,440],'glbBytes':glb.stat().st_size,'meshes':len(meshes),'triangles':sum(len(f.vertices)-2 for o in meshes for f in o.data.polygons),'boundsGame':[[min(v[i] for v in game),max(v[i] for v in game)] for i in range(3)],'usableInteriorGame':[44,76],'usableInteriorRenderUnits':[44/32,76/32],'eastReleaseGapGame':[405,475],'landingMaxHeightGame':max(h for x,y,h in game if x>=180),'emptyNoAnatomy':True,'studioOnly':True}
(E/'asset-stats.json').write_text(json.dumps(stats,indent=2));print(json.dumps(stats))
# Studio evidence from actual GLB roundtrip, no geometry embellishment.
box('Studio floor',150,440,-1,1200,1200,1,mat('Studio neutral',(.065,.08,.09)),0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=1000;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.world.color=(.18,.18,.18)
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
for loc,power,size in [((-3,-4,7),900,5),((3,4,5),1000,4),((5,-1,3),300,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;aim(o,(.6,0,.3))
bpy.ops.object.camera_add(location=(5,-6,6));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=6.6;aim(cam,(1,0,.25));scene.camera=cam
scene.render.filepath=str(E/'studio-roundtrip.png');bpy.ops.render.render(write_still=True)
cam.location=(.7,-.2,9);cam.data.ortho_scale=5.8;aim(cam,(.7,0,0));scene.render.filepath=str(E/'studio-top-clearance.png');bpy.ops.render.render(write_still=True)
cam.location=(5,-6,6);cam.data.ortho_scale=6.6;aim(cam,(1,0,.25));scene.render.resolution_x=400;scene.render.resolution_y=320;scene.render.filepath=str(E/'studio-scale.png');bpy.ops.render.render(write_still=True)
