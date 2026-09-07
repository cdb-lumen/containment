"""Original frozen-envelope locker, folding service cabinet and parked trolley.
blender -b --factory-startup --python-exit-code 1 -P scripts/build-recovery-storage.py
Preserves approved console/seat assets. Same mount [204/32,0,700/32], scale1.
"""
import bpy, pathlib, json, math, struct
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
# Reuse the approved construction/material helpers without running subset authoring.
exec((ROOT/'scripts/build-recovery-kit.py').read_text().split('# Cabinet is assembled')[0])
OUT=ROOT/'public/assets/awakening/recovery-storage';OUT.mkdir(parents=True,exist_ok=True)
E=ROOT/'docs/art-evidence/recovery-storage';E.mkdir(parents=True,exist_ok=True)
records=[]

def export_asset(name,bounds):
 parts=[o for o in bpy.context.scene.objects if o.type=='MESH'];count=len(parts)
 for o in parts:o['assembly']=name;o['nativeGameUnitsPerUnit']=32
 for image in bpy.data.images:
  if image.source=='FILE' and not image.packed_file:image.pack()
 bpy.context.scene['mountGameXY']=[204,700]
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(name+'.blend')))
 groups={m:[o for o in parts if o.active_material==m] for m in {o.active_material for o in parts}}
 for m,objects in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=name+' '+m.name
 bpy.ops.object.select_all(action='SELECT');f=OUT/(name+'.glb');bpy.ops.export_scene.gltf(filepath=str(f),export_format='GLB',use_selection=True,export_extras=True)
 bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=str(f));bpy.context.view_layer.update()
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];tris=0;allpts=[]
 x0,y0,x1,y1,cap=bounds
 access=[(176,582,232,638),(176,762,232,818),(302,672,358,728),(972,650,1028,706)]
 for o in meshes:
  for poly in o.data.polygons:
   pts=[o.matrix_world@o.data.vertices[i].co for i in poly.vertices];pts=[(v.x*32+204,700-v.y*32,v.z*32) for v in pts];allpts+=pts;tris+=len(pts)-2
   assert all(x0-.002<=x<=x1+.002 and y0-.002<=y<=y1+.002 and -.002<=h<=cap+.002 for x,y,h in pts),(name,pts)
   for a,b,c,d in access:assert max(v[0] for v in pts)<a or min(v[0] for v in pts)>c or max(v[1] for v in pts)<b or min(v[1] for v in pts)>d
 raw=f.read_bytes();jlen=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+jlen]);bo=28+jlen;counts={}
 for m in doc['meshes']:
  for pr in m['primitives']:
   for key,width in [('POSITION',3),('NORMAL',3),('TEXCOORD_0',2)]:
    a=doc['accessors'][pr['attributes'][key]];v=doc['bufferViews'][a['bufferView']];assert a['componentType']==5126
    start=bo+v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',width*4)
    rows=[struct.unpack_from('<'+'f'*width,raw,start+i*stride) for i in range(a['count'])];assert all(math.isfinite(c) for row in rows for c in row)
    if key=='NORMAL':assert all(.98<sum(c*c for c in row)<1.02 for row in rows)
    counts[key]=counts.get(key,0)+len(rows)
 for im in doc['images']:assert 'bufferView' in im
 deps=bpy.context.evaluated_depsgraph_get()
 def ray(x,y,z,d):return bpy.context.scene.ray_cast(deps,Vector(p(x,y,z)),Vector(d))
 contacts=[]
 if name=='trolley':
  for x in [1058,1100]:
   for y in [716,740]:
    hit,loc,*_=ray(x,y,-1,(0,0,1));assert hit and abs(loc.z*32)<.01
    hit,loc,*_=ray(x-4,y,12,(1,0,0));assert hit and abs(loc.x*32+204-x)<1.6;contacts.append([x,y])
  hit,loc,*_=ray(1079,728,19,(0,0,-1));assert hit and abs(loc.z*32-18)<.01
 else:
  for x,y in ([(260,680),(278,720)] if name=='locker' else [(1050,681),(1100,681)]):
   hit,loc,*_=ray(x,y,-1,(0,0,1));assert hit and abs(loc.z*32)<.01;contacts.append([x,y])
 records.append({'asset':name,'bytes':len(raw),'triangles':tris,'batches':len(doc['meshes']),'materials':len(doc['materials']),'namedParts':count,'images':len(doc.get('images',[])),'embeddedImageBytes':sum(doc['bufferViews'][i['bufferView']]['byteLength'] for i in doc.get('images',[])),'texturedPBRMaterials':sum('metallicRoughnessTexture' in m.get('pbrMetallicRoughness',{}) for m in doc['materials']),'finiteAccessorCounts':counts,'boundsGame':[[min(v[i] for v in allpts),max(v[i] for v in allpts)] for i in range(3)],'triangleReservationAndAccess':'PASS','deckContacts':contacts,'unitNormals':True,'roundtrip':'PASS','mountThreeXYZ':[6.375,0,21.875],'nativeScale':1})
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

# East-facing double-track sliding locker. Hollow carcass, supported shelves,
# two overlapping leaves. Handles stay behind outer x288 limit.
box('Locker resilient recessed plinth',270,700,2,33,85,4,seal,1)
box('Locker bottom folded pan',270,700,5,34,86,2,steel,.6)
box('Locker west back',254.5,700,25,3,86,38,ivory,.8)
for y in [658,742]:box('Locker end cheek',270,y,25,34,3,40,ivory,.9)
for h in [17,31]:box('Locker supported shelf',270,700,h,28,81,1.2,steel,.4)
box('Locker crown seal',270,700,44,34,85,1,seal,.5)
box('Locker rolled enamel crown',270,700,45,35,87,1.5,ivory,.7)
for h in [7,42]:
 box('Locker twin track backing',285.8,700,h,3.4,81,1.4,steel,.3)
 for x in [285,287]:box('Locker sliding channel',x,700,h+.8,.5,79,.8,seal,.1)
for x,y in [(285,680.5),(286.9,719)]:
 box('Locker captured sliding leaf',x,y,24.7,1.2,40,33.5,paint,.4)
 box('Locker enamel inset',x+.64,y,24.7,.12,35,29,ivory,.05)
 box('Locker recessed pull pocket',x+.72,y-14,26,.14,3,9,seal,.04)
 box('Locker inset pull bridge',x+.82,y-14,26,.18,.7,7,steel,.09)
 for z in [12,38]:pipe('Locker leaf roller axle',(x-.2,y,z),(x+.65,y,z),.45,steel)
# East-operator-facing original KIT plate, with explicit UV orientation.
box('Locker identifier inset',270,700,45.81,12,24,.12,paint,.08)
image=bpy.data.images.load(str(OUT/'locker-label.png'));image.pack()
label=mat('Locker KIT original label',(1,1,1),.7);nt=label.node_tree;t=nt.nodes.new('ShaderNodeTexImage');t.image=image;nt.links.new(t.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
mesh=bpy.data.meshes.new('KIT label UV');mesh.from_pydata([p(265,689,45.9),p(275,689,45.9),p(275,711,45.9),p(265,711,45.9)],[],[(3,2,1,0)]);mesh.update();o=bpy.data.objects.new('East readable KIT plate',mesh);bpy.context.collection.objects.link(o);mesh.materials.append(label);uv=mesh.uv_layers.new()
for loop in mesh.loops:
 uv.data[loop.index].uv=[(1,1),(1,0),(0,0),(0,1)][loop.vertex_index]
export_asset('locker',(252,656,288,744,48))
# West-facing satellite with paired leaves folded back beside each cheek.
# Each 10-unit half folds onto its mate; shelf edges clear the parked pairs.
box('Service recessed plinth',1075,681.5,2,60,45,4,seal,.8)
box('Service rear enclosure',1103,681.5,24,4,45,40,paint,.9)
for y in [660,703]:box('Service formed side cheek',1075,y,24,60,3,40,ivory,.8)
for h in [5,20,36,45]:box('Service rolled shelf',1075,681.5,h,60,27 if h in [20,36] else 40,2,steel,.5)
for y in [667,696]:
 for h in [20,36]:box('Service shelf load channel',1080,y,h-1.3,44,11,2,paint,.25)
for y,sgn in [(664,1),(699,-1)]:
 box('Folded outer door enamel skin',1050,y,25,10,1.4,36,ivory,.45)
 box('Folded inner door return',1050,y+sgn*2,25,10,1.4,36,paint,.45)
 for x in [1045,1055]:
  for h in [12,36]:pipe('Door hinge barrel',(x,y+sgn,h-2),(x,y+sgn,h+2),.95,steel)
 box('Door recessed pull well',1047,y+sgn*2.75,26,3,.16,9,seal,.08)
 box('Door recessed pull',1047,y+sgn*2.9,26,.7,.25,7,steel,.1)
box('Sealed dressing supply pack',1090,687,11,14,12,10,ivory,1)
box('Pack sealed seam',1090,687,16.05,13,10,.16,seal,.1)
box('Pack ochre inventory tab',1090,687,16.18,8,3,.1,amber,.08)
for y in [668,695]:
 for h in [12,30,40]:pipe('Back captive screw',(1100.85,y,h),(1101.05,y,h),.5,steel)
export_asset('satellite-cabinet',(1044,658,1106,705,48))
# Four actual deck-contact wheels, axles, fork cheeks and load uprights.
for x in [1058,1100]:
 for y in [716,740]:
  pipe('Trolley resilient wheel',(x-1.2,y,3),(x+1.2,y,3),3,seal)
  pipe('Wheel hub axle',(x-2.1,y,3),(x+2.1,y,3),.9,steel)
  for dx in [-1.9,1.9]:box('Caster fork cheek',x+dx,y,4.6,.7,3.1,4.5,paint,.25)
  box('Caster crown',x,y,7,4.7,4,1.4,steel,.4)
  pipe('Trolley welded upright',(x,y,7),(x,y,19),1.1,steel)
for h in [8,17]:
 box('Trolley supported tray pan',1079,728,h,48,28,2,steel,.7)
 for y in [716,740]:box('Tray underside load rail',1079,y,h-1.3,44,1.8,1.2,paint,.3)
for y in [714,742]:box('Upper tray rolled rim',1079,y,20,48,2,4,ivory,.6)
for x in [1055,1103]:box('Upper tray end rim',x,728,20,2,28,4,ivory,.6)
for y in [717,739]:pipe('Push handle rising support',(1055,y,17),(1050,y,30),1.3,steel)
pipe('Enamel push grip',(1050,717,30),(1050,739,30),1.6,ivory)
for y in [718,738]:pipe('Push grip end collar',(1050,y-.5,30),(1050,y+.5,30),1.7,seal)
# Local handling abrasion confined to rim and grip. Empty clean tray is usable.
for y in [723,728,733]:box('Rim contact rub',1053.98,y,20,.06,1.5,.23,paint,.02)
export_asset('trolley',(1044,710,1106,746,34))
(E/'asset-stats.json').write_text(json.dumps({'assets':records,'runtimeVerified':False},indent=2));print(json.dumps(records))
# Real imported GLBs, original console/seat included without modifying them.
for f in [ROOT/'public/assets/awakening/recovery-kit/recovery-kit.glb']+list(OUT.glob('*.glb')):bpy.ops.import_scene.gltf(filepath=str(f))
box('Studio floor',650,700,-.6,1400,1000,1,mat('Storage studio neutral',(.075,.09,.105)),0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=False;scene.render.resolution_percentage=100;scene.world.color=(.18,.18,.18)
def aim(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
for x in [0,27]:
 for loc,power,size in [((x-3,4,7),750,5),((x+4,-3,5),900,4),((x-3,-3,3),250,3)]:
  bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;aim(o,(x,0,.5))
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
for name,target,offset,scale,res in [('whole-kit',(13.5,0,.5),(0,-.01,35),32,(1200,360)),('locker',p(270,700,23),(5,-4,5),3.3,(640,640)),('satellite',p(1075,681.5,22),(-5,4,4),3.3,(640,640)),('trolley',p(1079,728,12),(-4,-5,5),2.5,(640,640)),('west-scale',p(236,700,20),(4,6,6),5.4,(360,360)),('east-scale',p(1075,700,20),(-5,6,6),4.2,(360,360))]:
 cam.location=Vector(target)+Vector(offset);aim(cam,target);cam.data.ortho_scale=scale;scene.render.resolution_x,scene.render.resolution_y=res;scene.render.filepath=str(E/('studio-'+name+'.png'));bpy.ops.render.render(write_still=True)
