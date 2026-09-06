"""Original Containment review asset. Blender 4: uncompressed metre-scale GLB.
Run: blender --background --factory-startup --python-exit-code 1 --python scripts/build-cryo-benchmark.py
"""
import bpy, math, pathlib, json
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
root=pathlib.Path(__file__).resolve().parents[1]
out=root/'public/assets/environment/cryo-review.glb'
def mat(name,color,metal=0,rough=.5):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
paint=mat('cryo-ceramic',(.52,.62,.59),.45,.35)
steel=mat('cryo-machined',(.26,.34,.37),.8,.28)
rubber=mat('cryo-seal',(.025,.044,.049),0,.85)
fabric=mat('cryo-berth',(.09,.16,.18),0,.92)
body=mat('cryo-suit',(.22,.31,.35),.05,.8)
skin=mat('cryo-passenger',(.46,.36,.27),0,.7)
glass=mat('cryo-viewport',(.12,.3,.34),.55,.2)
frost=mat('cryo-frost',(.52,.68,.68),.1,.82)
label=mat('cryo-safety',(.65,.36,.13),.2,.5)
def xyz(p):return (p[0],-p[2],p[1])
def finish(o,name,m):
 o.name=name;o.data.materials.append(m);return o
def box(name,p,s,m,b=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.dimensions=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if b:
  mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=b;mod.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,m)
def ell(name,p,s,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=xyz(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,name,m)
def pipe(name,points,r,m):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=1;c.bevel_depth=r;c.bevel_resolution=2
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*xyz(p),1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);finish(o,name,m)
# Continuous tapered octagonal pressure vessel, open at the berth. Nested closed
# loops form an actual thick shell rather than overlapping primitive panels.
profile=[(-.54,-1.38),(.54,-1.38),(.78,-1.1),(.78,.98),(.49,1.37),(-.49,1.37),(-.78,.98),(-.78,-1.1)]
def shell(name,loops,m):
 verts=[xyz((x*scale,y,z*scale)) for scale,y in loops for x,z in profile];faces=[];n=len(profile)
 for j in range(len(loops)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,m)
 bevel=o.modifiers.new('Cast radii','BEVEL');bevel.width=.025;bevel.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
shell('Cast pressure tub',[(.82,-.27),(1,-.08),(1,.23),(.89,.28),(.86,.04),(.65,-.18)],paint)
shell('Continuous pressure gasket',[(.89,.28),(.89,.33),(.85,.33),(.85,.28)],rubber)
box('Recessed mattress',(0,.1,0),(1.08,.16,2.2),fabric,.1)
# Occupants use low-sided anatomical sections, not more smooth spheres.
# Long axis is z, face points upward. The unchanged opaque lid hides the abdomen.
occupant_start=set(bpy.context.scene.objects)
def sectioned(name,sections,m,sides=12):
 verts=[]
 for z,x,y,rx,ry in sections:
  for i in range(sides):
   a=2*math.pi*i/sides;verts.append(xyz((x+rx*math.cos(a),y+ry*math.sin(a),z)))
 faces=[]
 for j in range(len(sections)-1):
  for i in range(sides):
   a=j*sides+i;b=j*sides+(i+1)%sides;faces.append((a,b,b+sides,a+sides))
 faces.extend([tuple(reversed(range(sides))),tuple((len(sections)-1)*sides+i for i in range(sides))])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();mesh.uv_layers.new()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
 for f in mesh.polygons:f.use_smooth=True
 return finish(o,name,m)
sectioned('Contoured face',[(-.997,0,.32,.055,.065),(-.95,0,.35,.13,.115),(-.85,0,.355,.145,.145),(-.77,0,.35,.13,.14),(-.68,0,.325,.09,.105),(-.645,0,.32,.055,.065)],skin)
sectioned('Neck',[(-.69,0,.28,.065,.065),(-.55,0,.28,.075,.065)],skin)
sectioned('Nose bridge',[(-.855,0,.485,.022,.012),(-.785,0,.50,.028,.038),(-.768,0,.486,.035,.016)],skin,8)
# Closed eyes follow the cheek plane. No black eye sockets or open mouth.
for side,word in [(-1,'left'),(1,'right')]:
 box('Closed eyelid '+word,(side*.067,.483,-.85),(.061,.008,.012),fabric,.003)
 sectioned('Ear '+word,[(-.85,side*.14,.345,.012,.02),(-.805,side*.14,.345,.024,.035),(-.76,side*.14,.345,.012,.02)],skin,8)
box('Relaxed mouth',(0,.444,-.711),(.058,.006,.009),skin,0)
sectioned('Suit collar',[(-.60,0,.28,.105,.085),(-.55,0,.28,.125,.10)],fabric)
sectioned('Tailored cryosuit',[(-.55,0,.26,.18,.10),(-.47,0,.26,.265,.125),(-.28,0,.255,.225,.125),(.02,0,.25,.175,.10),(.21,0,.25,.205,.115)],body)
for side,word in [(-1,'Left'),(1,'Right')]:
 sectioned(word+' upper sleeve',[(-.46,side*.265,.265,.085,.09),(-.16,side*.32,.25,.07,.075)],body,8)
 # Elbows bent, palms resting beside the collar in the visible head opening.
 sectioned(word+' forearm',[(-.16,side*.32,.25,.07,.075),(-.43,side*.29,.36,.055,.055)],body,8)
 sectioned(word+' cuff',[(-.42,side*.29,.36,.06,.06),(-.47,side*.285,.37,.06,.06)],fabric,8)
 sectioned(word+' palm',[(-.465,side*.285,.38,.048,.036),(-.53,side*.28,.39,.052,.037),(-.59,side*.27,.385,.037,.03)],skin,8)
 sectioned(word+' thumb',[(-.48,side*.245,.395,.02,.025),(-.55,side*.225,.395,.02,.025)],skin,6)
 # Broad finger division, readable in a close-up without individual cylinders.
 box(word+' finger crease',(side*.275,.422,-.558),(.061,.004,.008),skin,0)
 sectioned(word+' trouser',[ (.15,side*.11,.24,.10,.105),(.54,side*.12,.23,.08,.085),(.91,side*.13,.22,.065,.07)],body,8)
 box(word+' soft boot',(side*.13,.26,.93),(.145,.16,.22),fabric,.04)
 box('Shoulder restraint '+word.lower(),(side*.18,.379,-.46),(.052,.024,.18),fabric,.01)
 box(word+' restraint buckle',(side*.18,.395,-.51),(.066,.016,.046),steel,.006)
box('Suit sternum seam',(0,.381,-.40),(.018,.013,.22),fabric,.004)
occupant_objects=set(bpy.context.scene.objects)-occupant_start
for o in occupant_objects:o['occupantPart']=o.name
for side in [-1,1]:
 box('Load rail',(side*.7,-.25,0),(.13,.15,2.36),steel)
 for z in [-.86,.73]:
  box('Pressure dog',(side*.73,.37,z),(.19,.19,.22),steel)
  box('Lock witness',(side*.74,.48,z),(.09,.025,.1),label,.005)
 pipe('Coolant return',[(side*.68,-.17,.72),(side*.82,-.17,.72),(side*.82,-.17,1.24),(side*.62,-.17,1.34)],.035,steel)
 box('Foot mounting shoe',(side*.59,-.36,.86),(.26,.12,.36),rubber)
# One framed canopy, split into a clear occupant opening and opaque end panels.
shell('Canopy perimeter',[(.87,.36),(.84,.47),(.77,.47),(.79,.36)],steel)
box('Head pressure dome',(0,.43,-1.12),(.92,.17,.36),paint,.09)
box('Foot pressure dome',(0,.39,1.03),(.91,.15,.49),paint,.07)
# Glass is a restrained tinted side visor; central opening keeps the living
# passenger readable without transparency sorting across stacked pods.
for side in [-1,1]:
 box('Laminated side visor',(side*.49,.42,-.03),(.18,.045,1.58),glass,.025)
 for z in [-.62,.05,.69]:box('Seal condensation',(side*.55,.452,z),(.055,.01,.17),frost,.01)
box('Frosted torso canopy',(0,.405,.02),(.79,.07,.92),glass,.09)
box('Condensation at foot seal',(0,.45,.48),(.76,.015,.08),frost,.02)
box('Lid cross brace',(0,.46,.52),(1.25,.07,.1),steel)
box('Vitals recess',(0,.49,1.01),(.42,.025,.2),rubber,.015)
for i in range(4):box('Vitals ticks',(-.13+i*.085,.508,1.01),(.03,.012,.08 if i==1 else .045),frost,.003)
# Merge by material: nine reusable draw batches, no per-pod materials.
bpy.ops.object.select_all(action='DESELECT')
for m in list(bpy.data.materials):
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==m]
 if not objects:continue
 components=sorted(o['occupantPart'] for o in objects if 'occupantPart' in o)
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=m.name
 bpy.context.object['occupantComponents']=components
 bpy.ops.object.select_all(action='DESELECT')
out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_draco_mesh_compression_enable=False,export_yup=True,export_extras=True)
assert out.read_bytes()[:4]==b'glTF'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(out))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert len(meshes)==9
stats={'bytes':out.stat().st_size,'meshes':len(meshes),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),'materials':len(set(m.name for o in meshes for m in o.data.materials))}
(out.parent/'cryo-review-stats.json').write_text(json.dumps(stats,indent=2)+'\n');print(stats)
