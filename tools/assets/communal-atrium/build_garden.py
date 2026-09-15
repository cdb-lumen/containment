"""Original Room4 south32 garden. CPU-only deterministic Blender authoring.
Run with --background --factory-startup --python-exit-code 1 --python this.py
-- --output-root ABSOLUTE. No external assets or texture downloads.
"""
import bpy, math, json, sys, argparse, hashlib, struct
from pathlib import Path
from mathutils import Vector
P=argparse.ArgumentParser(); P.add_argument('--output-root',required=True)
args=P.parse_args(sys.argv[sys.argv.index('--')+1:]); out=Path(args.output_root); out.mkdir(parents=True,exist_ok=True)
src=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
roles={'ca_support':('343a37',.6,.72),'ca_ceramic':('666557',.05,.87),'ca_soil':('30271f',0,1),'ca_leaf':('486344',0,.92),'ca_irrigation':('625344',.3,.83)}
def linear(c): return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
mats={}
for name,(hx,metal,rough) in roles.items():
    m=bpy.data.materials.new(name); m.use_nodes=True
    rgba=tuple(linear(int(hx[i:i+2],16)/255) for i in (0,2,4))+(1,)
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=rgba; bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
    m.diffuse_color=rgba; m.use_backface_culling=name!='ca_leaf'; mats[name]=m
# Design coordinates are local game x, gameY, height. Blender y is -gameY.
def cv(p): return Vector((p[0]/32,-p[1]/32,p[2]/32))
def mesh(name,verts,faces,role):
    me=bpy.data.meshes.new(name); me.from_pydata([cv(p) for p in verts],[],faces); me.update()
    o=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(o); me.materials.append(mats[role])
    bpy.context.view_layer.objects.active=o; o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT'); o.select_set(False)
    return o
def box(name,x0,x1,y0,y1,z0,z1,role):
    return mesh(name,[(x,y,z) for z in (z0,z1) for y in (y0,y1) for x in (x0,x1)],[(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)],role)
def branch(name,points,radii):
    verts=[]; n=8
    for j,p in enumerate(points):
        direction=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)])
        direction.normalize(); u=direction.cross(Vector((0,1,0))).normalized(); v=direction.cross(u).normalized()
        verts.extend([tuple(Vector(p)+radii[j]*(math.cos(k*math.tau/n)*u+math.sin(k*math.tau/n)*v)) for k in range(n)])
    faces=[tuple(reversed(range(n))),tuple((len(points)-1)*n+k for k in range(n))]
    for j in range(len(points)-1):
        for k in range(n): faces.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
    return mesh(name,verts,faces,'ca_irrigation')
# Full reservation remains occupied by the low supporting bed, no extra floor strip.
box('bed_support',-72,72,-32,32,0,17,'ca_support')
box('soil',-67,67,-27,27,17,19,'ca_soil')
# Six quiet ceramic pieces; narrow seams expose the supporting rim, not floating caps.
for side,(y0,y1) in enumerate(((-32,-27),(27,32))):
    for j,(x0,x1) in enumerate(((-72,-.3),(.3,72))): box('rim_long_%d_%d'%(side,j),x0,x1,y0,y1,17,23,'ca_ceramic')
for j,(x0,x1) in enumerate(((-72,-67),(67,72))): box('rim_end_%d'%j,x0,x1,-27,27,17,23,'ca_ceramic')
# Construction replacement after the two retained ico-crown cosmetic attempts.
# Each tree has an exposed fork and separately shaped foliage pads. Coordinates
# retain the three soil anchors and the old 144x64, <=96-high reservation.
a=json.loads((src/'baseline-ico.json').read_text())
centers={}
def crown(name,c,size,phase):
    # Unequal perimeter lobes and offset ring centres form broad leaf clusters,
    # not scaled spheres. Low undersides leave the branch junctions visible.
    n=12; verts=[]
    for ring,(height,radius,dx,dy) in enumerate(((-1,.24,0,0),(-.55,.82,-.08,0),(.05,1,0,0),(.68,.68,.12,-.06),(1,.16,.15,-.08))):
        for k in range(n):
            angle=k*math.tau/n
            edge=1+.12*math.sin(angle*3+phase)+.065*math.cos(angle*5-phase)
            verts.append((c[0]+size[0]*(math.cos(angle)*radius*edge+dx),c[1]+size[1]*(math.sin(angle)*radius*edge+dy),c[2]+size[2]*(height+.06*math.sin(angle*2+phase))))
    faces=[tuple(reversed(range(n))),tuple(4*n+k for k in range(n))]
    for ring in range(4):
        for k in range(n): faces.append((ring*n+k,ring*n+(k+1)%n,(ring+1)*n+(k+1)%n,(ring+1)*n+k))
    centers[name]=c
    return mesh(name,verts,faces,'ca_leaf')
# Left spreading fork, middle upright tiers, right leaning crown.
trees=[
    (-40,[(0,0,19),(-1,0,37),(-6,1,54),(-10,2,74)],[( (-13,1,77),(12,13,8),.3),((11,-7,69),(10,11,7),1.5)]),
    (0,[(0,0,19),(2,1,42),(0,2,61),(3,1,84)],[((3,1,83),(10,11,9),2.1),((-12,-8,67),(9,10,6),.7),((13,7,74),(8,10,6),1.2)]),
    (40,[(0,0,19),(-2,-1,40),(4,-2,58),(11,-2,77)],[((12,-2,79),(12,14,8),1.8),((-11,7,71),(10,10,7),2.8)]),
]
for t,(tx,path,pads) in enumerate(trees):
    branch('tree%d_trunk'%t,[(tx+x,y,z) for x,y,z in path],[3.6,3,2.2,1])
    for j,(local,size,phase) in enumerate(pads):
        c=(tx+local[0],local[1],local[2]); fork=path[2]
        branch('tree%d_branch%d'%(t,j),[(tx+fork[0],fork[1],fork[2]-6),(tx+(fork[0]+local[0])*.5,local[1]*.45,local[2]-14),c],[2.3,1.7,.7])
        crown('tree%d_crown%d'%(t,j),c,size,phase)
bpy.context.scene.unit_settings.system='METRIC'; bpy.context.scene.unit_settings.scale_length=1
bpy.ops.wm.save_as_mainfile(filepath=str(out/'signature-garden.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'signature-garden.glb'),export_format='GLB',export_yup=True,export_normals=True,export_texcoords=False,export_materials='EXPORT',export_cameras=False,export_lights=False,export_extras=False)
raw=(out/'signature-garden.glb').read_bytes(); assert raw[:4]==b'glTF'
n=struct.unpack_from('<I',raw,12)[0]; doc=json.loads(raw[20:20+n]); assert len(doc['scenes'])==1
assert not doc.get('textures') and len(doc['materials'])==5
for m in doc['materials']:
    name=m['name']; hx,metal,rough=roles[name]; p=m['pbrMetallicRoughness']
    expected=[linear(int(hx[i:i+2],16)/255) for i in (0,2,4)]+[1]
    assert max(abs(x-y) for x,y in zip(p['baseColorFactor'],expected))<1e-6
    assert abs(p.get('metallicFactor',1)-metal)<1e-6 and abs(p.get('roughnessFactor',1)-rough)<1e-6
    assert m.get('doubleSided',False)==(name=='ca_leaf')
for me in doc['meshes']:
    for pr in me['primitives']: assert 'NORMAL' in pr['attributes']
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(out/'signature-garden.glb'))
bpy.context.view_layer.update()
objects={o.name:o for o in bpy.context.scene.objects if o.type=='MESH'}
def gameverts(o): return [Vector((p.x*32,-p.y*32,p.z*32)) for p in [o.matrix_world@v.co for v in o.data.vertices]]
def validate():
    vs=[v for o in objects.values() for v in gameverts(o)]
    assert vs and all(math.isfinite(c) for v in vs for c in v),'nonfinite'
    lo=[min(v[k] for v in vs) for k in range(3)]; hi=[max(v[k] for v in vs) for k in range(3)]
    assert lo[0]>=-72.0001 and hi[0]<=72.0001 and lo[1]>=-32.0001 and hi[1]<=32.0001 and lo[2]>=-.0001 and hi[2]<=82+14*max(a[1::3])+1e-4,'out-of-envelope'
    for t in range(3):
        key='tree%d_trunk'%t; assert key in objects,'missing-trunk'
        vv=gameverts(objects[key]); assert min(v.z for v in vv)<=19.0001 and max(v.z for v in vv)>=74,'trunk soil contact/height'
        assert objects[key].data.materials[0].name.startswith('ca_irrigation')
    # Old per-ico containment belongs to the retained rejected construction.
    # Replacement foliage instead obeys the unchanged whole garden envelope.
    assert len(centers)==7 and all(name in objects for name in centers),'missing-crown'
    for t,(tx,path,pads) in enumerate(trees):
        vv=gameverts(objects['tree%d_trunk'%t]); base=[v for v in vv if v.z<23]
        assert base and abs(sum(v.x for v in base)/len(base)-tx)<.15,'moved-anchor'
        crowns=[v for name in centers if name.startswith('tree%d_'%t) for v in gameverts(objects[name])]
        assert min(v.z for v in crowns)>59,'buried-fork'
        assert max(v.z for v in crowns)>80,'missing-green-mass'
    for o in objects.values():
        for v in o.data.vertices: assert all(math.isfinite(c) for c in v.normal) and .99<v.normal.length<1.01,'normal'
        for p in o.data.polygons: assert p.area>1e-12,'degenerate'
    assert abs(min(v.z for v in gameverts(objects['bed_support'])))<1e-5
    return {'local_game_bounds':[lo,hi],'world_game_bounds':[[lo[0]+584,lo[1]+336,lo[2]],[hi[0]+584,hi[1]+336,hi[2]]],'meshes':len(objects),'triangles':sum(len(p.vertices)-2 for o in objects.values() for p in o.data.polygons),'trunks':3,'crown_lobes':len(centers),'finite_unit_normals':True,'foliage_contained_in_retained_garden_envelope':True}
result=validate(); negatives=[]
def rejected(label):
    try: validate()
    except AssertionError as e:
        assert str(e)==label,(label,str(e)); negatives.append({'control':label,'rejected':True,'actual_error':str(e)})
    else: raise AssertionError('negative accepted: '+label)
o=objects['bed_support']; o.location.x+=10; bpy.context.view_layer.update(); rejected('out-of-envelope'); o.location.x-=10; bpy.context.view_layer.update()
o=objects.pop('tree1_trunk'); rejected('missing-trunk'); objects['tree1_trunk']=o
validate()
# Read exported split normals directly. Blender's imported vertex.normal can
# average custom loop normals and change the fallback's shading.
binary=raw[28+n:]
def accessor(index):
    a=doc['accessors'][index]; view=doc['bufferViews'][a['bufferView']]
    width={'SCALAR':1,'VEC3':3}[a['type']]; fmt={5123:'H',5125:'I',5126:'f'}[a['componentType']]
    size=struct.calcsize(fmt); stride=view.get('byteStride',size*width)
    start=view.get('byteOffset',0)+a.get('byteOffset',0)
    return [v for i in range(a['count']) for v in struct.unpack_from('<'+fmt*width,binary,start+i*stride)]
fallback=[]
for node in sorted(doc['nodes'],key=lambda node:node['name']):
    name=node['name']
    if not name.startswith('tree'): continue
    assert not any(k in node for k in ('matrix','translation','rotation','scale'))
    primitives=doc['meshes'][node['mesh']]['primitives']; assert len(primitives)==1
    primitive=primitives[0]
    fallback.append({'name':name,'role':'ca_leaf' if 'crown' in name else 'ca_irrigation','positions':accessor(primitive['attributes']['POSITION']),'normals':accessor(primitive['attributes']['NORMAL']),'indices':accessor(primitive['indices'])})
(out/'garden-trees.json').write_text(json.dumps(fallback,separators=(',',':'))+'\n')
result.update({'passed':True,'negative_controls':negatives,'material_roles':list(roles),'textures':0,'glb_bytes':len(raw),'blender':bpy.app.version_string,'appearance_accepted':False,'integration_accepted':False,'native_capture':False})
(out/'validation.json').write_text(json.dumps(result,indent=2)+'\n')
print('GARDEN_VALIDATION '+json.dumps(result))
