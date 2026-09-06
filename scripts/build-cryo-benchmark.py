"""Original Containment sealed chamber, metres, Blender 4.
Run: blender --background --factory-startup --python-exit-code 1 --python scripts/build-cryo-benchmark.py
No passenger geometry or third-party assets. Opaque pressure shell by design.
"""
import bpy, pathlib, json
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
frost=mat('cryo-frost',(.52,.68,.68),.1,.82)
label=mat('cryo-safety',(.65,.36,.13),.2,.5)
status=mat('cryo-status',(.16,.55,.48),.1,.45)
p=status.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(.08,.46,.36,1);p.inputs['Emission Strength'].default_value=.6
palette=[paint,steel,rubber,frost,label,status]
def xyz(p):return (p[0],-p[2],p[1])
def finish(o,name,m):
 o.name=name;o.data.materials.append(m);o['component']=name;return o
def box(name,p,s,m,b=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.dimensions=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if b:
  mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=b;mod.segments=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,m)
def pipe(name,points,r,m):
 bpy.ops.object.select_all(action='DESELECT')
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=1;c.bevel_depth=r;c.bevel_resolution=1
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*xyz(p),1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);finish(o,name,m)
profile=[(-.54,-1.38),(.54,-1.38),(.78,-1.1),(.78,.98),(.49,1.37),(-.49,1.37),(-.78,.98),(-.78,-1.1)]
def shell(name,loops,m):
 # Closed loft with both end caps. No central aperture and no hidden interior.
 verts=[xyz((x*scale,y,z*scale)) for scale,y in loops for x,z in profile];n=len(profile);faces=[]
 for j in range(len(loops)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
 faces.extend([tuple(reversed(range(n))),tuple((len(loops)-1)*n+i for i in range(n))])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();mesh.uv_layers.new();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,m)
 # Recalculate outward normals after loft construction.
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
shell('Cast pressure tub',[(.82,-.27),(1,-.08),(1,.23),(.9,.28)],paint)
shell('Continuous pressure gasket',[(.91,.275),(.91,.325)],rubber)
shell('Sealed pressure lid',[(.91,.32),(.94,.37),(.86,.49),(.70,.54)],paint)
for side in [-1,1]:
 box('Load rail',(side*.7,-.25,0),(.13,.15,2.36),steel)
 for z in [-.86,.73]:
  box('Pressure dog',(side*.73,.35,z),(.19,.19,.22),steel)
  box('Lock witness',(side*.74,.455,z),(.09,.018,.1),label,.003)
  box('Mounting shoe',(side*.59,-.36,z),(.26,.12,.36),rubber)
 pipe('Coolant return',[(side*.68,-.17,.72),(side*.82,-.17,.72),(side*.82,-.17,1.24),(side*.62,-.17,1.34)],.035,steel)
 # Sparse condensation at the seal, not a white blanket across the lid.
 for z in [-.62,.52]:box('Seal condensation',(side*.63,.494,z),(.035,.006,.18),frost,.002)
box('Lid service spine',(0,.548,0),(.065,.016,1.75),steel,.005)
box('Vitals recess',(0,.548,.99),(.44,.025,.24),rubber,.012)
for i in range(4):box('Life support trace',(-.13+i*.085,.567,.99),(.03,.012,.1 if i==1 else .04),status,.002)
box('Passenger identification plate',(-.27,.551,-.87),(.28,.015,.22),rubber,.006)
for i in range(3):box('ID engraving',(-.27,.562,-.94+i*.065),(.18 if i<2 else .1,.005,.015),frost,0)
# Merge only used materials; semantic component names survive the export.
bpy.ops.object.select_all(action='DESELECT')
for m in palette:
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==m]
 assert objects, m.name
 components=sorted(o['component'] for o in objects)
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=m.name;bpy.context.object['components']=components
 bpy.ops.object.select_all(action='DESELECT')
out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_draco_mesh_compression_enable=False,export_yup=True,export_extras=True)
assert out.read_bytes()[:4]==b'glTF'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(out))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert {o.name for o in meshes}=={m.name for m in palette}
stats={'bytes':out.stat().st_size,'meshes':len(meshes),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),'materials':len(set(m.name for o in meshes for m in o.data.materials)),'passengerGeometry':False,'closedPressureLid':True}
assert stats['triangles']<3500
(out.parent/'cryo-review-stats.json').write_text(json.dumps(stats,indent=2)+'\n');print(stats)
