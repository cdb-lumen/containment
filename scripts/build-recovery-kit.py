"""Original asset-only console and recovery chair. Run with Blender -b --factory-startup --python-exit-code 1 -P scripts/build-recovery-kit.py.
Frozen source: 61153a9 AuthoredRooms awakeningKit and AWAKENING_FUNCTIONAL_ENVELOPES.
No production integration. Native scale32. Materials reused from approved sealed chamber.
"""
import bpy, math, json, pathlib, struct
import numpy as np
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/awakening/recovery-kit';OUT.mkdir(parents=True,exist_ok=True)
E=ROOT/'docs/art-evidence/recovery-kit';E.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'public/assets/benchmark/sealed-cryo.blend'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
ivory,paint,steel,seal,amber=[bpy.data.materials[n] for n in ['01 warm ceramic enamel','02 graphite powdercoat','03 satin stainless','04 EPDM gasket','05 safety ochre']]
def mat(n,c,r=.6):
 m=bpy.data.materials.new(n);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=r;return m
cushion=mat('Washable recovery upholstery',(.18,.25,.25),.82)
def p(x,y,h):return ((x-204)/32,-(y-700)/32,h/32)
# Reuse clean 32px regions of shared chamber atlases, not unrelated per-part wear tiles.
# This prevents chamber crown colour blocks becoming stripes across armrests.
clean_uv={}
for material in [ivory,paint,steel,seal]:
 image=next(n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.name.endswith('-color'))
 w,h=image.size;pixels=np.array(image.pixels[:]).reshape(h,w,4)[:,:,:3]
 target=np.median(pixels.reshape(-1,3),axis=0);best=None
 for y in range(4,h-36,16):
  for x in range(4,w-36,16):
   patch=pixels[y:y+32,x:x+32];score=float(np.mean((patch-target)**2))
   if best is None or score<best[0]:best=(score,x,y)
 _,x,y=best;clean_uv[material.name]=(x/w,y/h,32/w,32/h)
def finish(o,n,m):
 o.name=n;o.data.materials.append(m)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT')
 if m.name in clean_uv:
  x,y,w,h=clean_uv[m.name]
  for loop in o.data.uv_layers.active.data:loop.uv=(x+loop.uv.x*w,y+loop.uv.y*h)
 return o
def box(n,x,y,h,w,d,t,m,r=.6):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p(x,y,h));o=bpy.context.object;o.dimensions=(w/32,d/32,t/32);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if r:
  mod=o.modifiers.new('Formed casing edge','BEVEL');mod.width=r/32;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
  for f in o.data.polygons:f.use_smooth=True
  o.data.use_auto_smooth=True;mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');mod.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,n,m)
def pipe(n,a,b,r,m):
 a,b=Vector(p(*a)),Vector(p(*b));bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r/32,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return finish(o,n,m)
# Cabinet is assembled around recessed drawers, not a solid cube with face stickers.
box('Console recessed deck plinth',204,684,2,56,30,4,seal)
box('Console base pan',204,684,5,58,30,3,paint,1)
box('Console rear removable cover',204,698,18,57,3,25,ivory,1)
for x in [176.5,231.5]:
 box('Console formed side cheek',x,683.5,18,3,32,26,ivory,1)
 box('Inset side service panel',x+(-1.52 if x<204 else 1.52),685,18,.2,20,16,paint,.07)
 for y in [678,692]:
  for h in [12,24]:pipe('Side captive screw',(x-1.65,y,h),(x+1.65,y,h),.55,steel)
for h in [10,22]:
 box('Drawer inner cassette',204,682,h,51,26,9,paint,.7)
 for x in [179,229]:box('Drawer concealed slide rail',x,681,h,1.4,26,2,steel,.3)
 box('Drawer perimeter dark reveal',204,668.4,h,53,1.6,10.8,seal,.3)
 box('Drawer enamel folded face',204,667.5,h,51,1.3,9.5,ivory,.6)
 box('Drawer recessed finger pocket',204,666.78,h+1,18,.18,3,seal,.08)
 box('Drawer rolled pull lip',204,666.3,h+2.3,18,1.1,1,steel,.35)
 for x in [181,227]:pipe('Drawer front quarter-turn',(x,666.65,h),(x,666.45,h),.5,steel)
box('Worktop gasket line',204,682.5,29.5,60,35,1,seal,.6)
box('Rolled stainless worktop',204,682.5,31,62,37,2,steel,.8)
# Reachable north-facing key deck, height 34; rear monitor fully cabinet supported.
box('Key deck sealed recess',204,667,33,48,4,.8,seal,.3)
for x in [185,194,204,214,223]:
 box('Tactile sealed key',x,667,33.7,5,3,.6,amber if x==223 else ivory,.25)
 box('Key tactile index',x,666.9,34.04,1.8,.3,.08,paint,.02)
box('Backed instrument enclosure lower',204,686,34,52,26,4,ivory,1.4)
box('Instrument split-line seal',204,686,35.8,51,25,.6,seal,.7)
box('Instrument top casing',204,686,36.2,51,25,.8,paint,.65)
box('Recessed LCD pocket',204,686,36.65,46,21,.3,seal,.6)
for x in [180,228]:box('LCD side protective lip',x,686,37.1,1.5,23,1.5,ivory,.5)
for y in [674.7,697.3]:box('LCD end protective lip',204,y,37.1,49.5,1.5,1.5,ivory,.5)
for x in [180,228]:
 for y in [675,697]:pipe('Instrument captive corner screw',(x,y,37.8),(x,y,37.95),.45,steel)
# Screen is a packed original small atlas. Real 08 STABLE and eight traces.
img=bpy.data.images.load(str(OUT/'kit-display.png'));img.pack()
lcd=mat('Recovery LCD original 512x256 atlas',(1,1,1),.65);nt=lcd.node_tree;bs=nt.nodes.get('Principled BSDF');t=nt.nodes.new('ShaderNodeTexImage');t.image=img;nt.links.new(t.outputs['Color'],bs.inputs['Base Color']);nt.links.new(t.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.12
mesh=bpy.data.meshes.new('LCD graphic');mesh.from_pydata([p(181.5,696,36.88),p(226.5,696,36.88),p(226.5,676,36.88),p(181.5,676,36.88)],[],[(0,1,2,3)]);mesh.update();o=bpy.data.objects.new('08 STABLE recessed display',mesh);bpy.context.collection.objects.link(o);mesh.materials.append(lcd);uv=mesh.uv_layers.new()
for l,v in zip(uv.data,[(1,1),(0,1),(0,0),(1,0)]):l.uv=v
# Restrained short contact scuffs at pulls only, not general grunge.
for h in [12.3,24.3]:
 for i in range(3):box('Local pull contact rub',201+i*1.7,665.73,h-.18,.65+i*.14,.04,.13,paint,.02)
# South-facing chair retains seat23 and original four deck contacts.
for x in [190,218]:
 for y in [710,742]:
  box('Chair resilient deck foot',x,y,1,6,6,2,seal,.6)
  box('Chair leg socket',x,y,3,4,4,3,paint,.5)
  pipe('Chair welded load leg',(x,y,3),(x,y,19),1.45,steel)
  pipe('Foot recessed fixing',(x,y,2),(x,y,2.35),.65,steel)
 pipe('Chair side stretcher',(x,710,9),(x,742,9),1.25,steel)
pipe('Chair rear cross brace',(190,710,11),(218,710,11),1.1,steel)
box('Chair formed underseat pan',204,727,19,32,38,4,ivory,1.8)
box('Seat welt shadow',204,727,21.05,30.8,36.8,.7,seal,1.5)
box('Weld-sealed washable seat',204,727,22,30,36,2,cushion,1.7)
for x in [190,218]:
 pipe('Back load upright',(x,708,18),(x,708,36),1.25,steel)
 pipe('Front arm support',(x,738,20),(x,738,31),1,steel)
 box('Armrest underlying bracket',x,725,31.2,3.4,30,1.2,paint,.6)
 box('Rounded enamel hand support',x,725,32.4,4,30,2.2,ivory,1)
 for y in [713,736]:pipe('Arm pad fixing',(x,y,30.4),(x,y,31),.55,steel)
box('Backrest molded shell',204,707,31,32,4,12,ivory,1.5)
box('Backrest sealed welt',204,709.03,31,29,.5,10,seal,.2)
box('Backrest washable pad',204,709.6,31,28,1.2,9,cushion,.55)
# Rear seam and covered fixings make construction legible from north.
box('Back service inset',204,704.95,31,23,.15,6,paint,.07)
for x in [193,215]:pipe('Back shell captive screw',(x,704.75,31),(x,705,31),.5,steel)
asset=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in asset:o['assembly']='console-seat-subset';o['nativeGameUnitsPerUnit']=32
bpy.context.scene['mountGameXY']=[204,700];bpy.context.scene['scope']='Console with medical drawers and recovery seat only. Locker, satellite cabinet and trolley deferred.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'recovery-kit.blend'))
groups={m:[o for o in asset if o.active_material==m] for m in {o.active_material for o in asset}}
for m,parts in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();parts[0].name='Batch '+m.name
bpy.ops.object.select_all(action='SELECT');glb=OUT/'recovery-kit.glb';bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_extras=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=str(glb));bpy.context.view_layer.update()
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];coords=[o.matrix_world@v.co for o in meshes for v in o.data.vertices];game=[(v.x*32+204,700-v.y*32,v.z*32) for v in coords]
assert all(math.isfinite(n) for v in game for n in v)
def contained(v):
 x,y,h=v;return h>=-.002 and ((173-.002<=x<=235+.002 and 664-.002<=y<=701+.002 and h<=40.002) or (186-.002<=x<=222+.002 and 704-.002<=y<=748+.002 and h<=38.002))
assert all(contained(v) for v in game),[v for v in game if not contained(v)][:10]
for o in meshes:
 assert o.data.uv_layers
 assert all(math.isfinite(c) for l in o.data.uv_layers.active.data for c in l.uv)
 assert all(math.isfinite(c) for v in o.data.vertices for c in v.normal)
raw=glb.read_bytes();length,kind=struct.unpack_from('<II',raw,12);doc=json.loads(raw[20:20+length]);assert raw[:4]==b'glTF'
for m in doc['meshes']:
 for pr in m['primitives']:assert {'POSITION','NORMAL','TEXCOORD_0'}<=pr['attributes'].keys()
assert all('bufferView' in i for i in doc['images'])
deps=bpy.context.evaluated_depsgraph_get()
def top(x,y):
 hit,loc,*_=bpy.context.scene.ray_cast(deps,Vector(p(x,y,80)),Vector((0,0,-1)));return loc.z*32 if hit else None
assert abs(top(204,727)-23)<.01
for x in [185,194,204,214,223]:assert 33.9<top(x,667)<34.2
# Entire access rectangles are separated from the disjoint convex bounds, so no triangles can enter them.
access=[(176,582,232,638),(176,762,232,818),(302,672,358,728),(972,650,1028,706)]
for o in meshes:
 for f in o.data.polygons:
  pts=[o.matrix_world@o.data.vertices[i].co for i in f.vertices];xs=[v.x*32+204 for v in pts];ys=[700-v.y*32 for v in pts]
  for x0,y0,x1,y1 in access:assert max(xs)<x0 or min(xs)>x1 or max(ys)<y0 or min(ys)>y1
stats={'scope':'console + medical drawers + recovery seat; remaining kit deferred','roundtrip':'PASS','finiteNormalsUV':True,'allTrianglesOutsideFourAccessRectangles':True,'exactFrozenBounds':'PASS','seatHeightGame':top(204,727),'nativeGameUnitsPerUnit':32,'mountGameXY':[204,700],'glbBytes':len(raw),'editableNamedParts':len(asset),'meshes':len(meshes),'triangles':sum(len(f.vertices)-2 for o in meshes for f in o.data.polygons),'boundsGame':[[min(v[i] for v in game),max(v[i] for v in game)] for i in range(3)],'materials':len(doc['materials']),'embeddedImages':len(doc['images']),'embeddedImageBytes':sum(doc['bufferViews'][i['bufferView']]['byteLength'] for i in doc['images']),'baseColorTexturedMaterials':sum('baseColorTexture' in m.get('pbrMetallicRoughness',{}) for m in doc['materials']),'roughnessTexturedMaterials':sum('metallicRoughnessTexture' in m.get('pbrMetallicRoughness',{}) for m in doc['materials']),'normalMappedMaterials':sum('normalTexture' in m for m in doc['materials']),'runtimeVerified':False}
(E/'asset-stats.json').write_text(json.dumps(stats,indent=2));print(json.dumps(stats))
box('Studio floor',204,700,-.6,900,900,1,mat('Studio neutral',(.075,.09,.105)),0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False;scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.world.color=(.18,.18,.18)
def aim(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
for loc,power,size in [((-3,4,7),750,5),((4,-3,5),900,4),((-3,-3,3),250,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;aim(o,(0,0,.5))
bpy.ops.object.camera_add(location=(4,6,6));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=4.6;aim(cam,(0,0,.4));scene.camera=cam
scene.render.filepath=str(E/'studio-whole-subset.png');bpy.ops.render.render(write_still=True)
cam.location=(3,5,5);cam.data.ortho_scale=2.6;aim(cam,(0,.57,.65));scene.render.filepath=str(E/'studio-console-detail.png');bpy.ops.render.render(write_still=True)
cam.location=(3,-5,4);cam.data.ortho_scale=2.2;aim(cam,(0,-.85,.6));scene.render.filepath=str(E/'studio-seat-detail.png');bpy.ops.render.render(write_still=True)
cam.location=(4,6,6);cam.data.ortho_scale=4.6;aim(cam,(0,0,.4));scene.render.resolution_x=360;scene.render.resolution_y=360;scene.render.filepath=str(E/'studio-scale.png');bpy.ops.render.render(write_still=True)
