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
# Exact donor ico planes, in normalized glTF x/up/gameY axes.
a=json.loads((src/'baseline-ico.json').read_text()); planes=[]
for k in range(0,len(a),9):
    aa,bb,cc=[Vector(a[k+i:k+i+3]) for i in (0,3,6)]; n=(bb-aa).cross(cc-aa).normalized()
    if n.dot(aa)<0:n=-n
    planes.append((n,n.dot(aa)))
centers={}
for t,tx in enumerate((-40,0,40)):
    branch('tree%d_trunk'%t,[(tx,0,19),(tx+.8,0,39),(tx+1.4,.3,56),(tx+2,0,75)],[3.6,3.2,2.7,1.5])
    # Cosmetic attempt 2: restore the seven rough crown pockets at near-donor
    # mass. Keep existing trunks/branches byte-for-byte in design coordinates.
    # Small unequal contractions retain faceted lobe separation, not leaf detail.
    for j,i in enumerate((0,2,4,6,1,3,5)):
        ang=i*2.4; reach=0 if i==6 else 12
        c=(tx+math.cos(ang)*reach,math.sin(ang)*8,68+(i%3)*7); name='tree%d_crown%d'%(t,j); centers[name]=c
        if j<4:
            branch('tree%d_branch%d'%(t,j),[(tx+1.2,0,46+j*4),((tx+c[0])/2,c[1]*.5,58+j*3),c],[1.8,1.35,.6])
        unique=list(dict.fromkeys(tuple(a[k:k+3]) for k in range(0,len(a),3)))
        vv=[]
        for q,p in enumerate(unique):
            v=Vector(p)*(0.94+0.015*((q+t+i)%4))
            vv.append((c[0]+v.x*14,c[1]+v.z*12,c[2]+v.y*14))
        ff=[tuple(unique.index(tuple(a[k+s:k+s+3])) for s in (0,3,6)) for k in range(0,len(a),9)]
        mesh(name,vv,ff,'ca_leaf')
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
    for name,c in centers.items():
        for v in gameverts(objects[name]):
            local=Vector(((v.x-c[0])/14,(v.z-c[2])/14,(v.y-c[1])/12))
            assert all(n.dot(local)<=d+1e-5 for n,d in planes),'foliage outside original lobe'
    for o in objects.values():
        for v in o.data.vertices: assert all(math.isfinite(c) for c in v.normal) and .99<v.normal.length<1.01,'normal'
        for p in o.data.polygons: assert p.area>1e-12,'degenerate'
    assert abs(min(v.z for v in gameverts(objects['bed_support'])))<1e-5
    return {'local_game_bounds':[lo,hi],'world_game_bounds':[[lo[0]+584,lo[1]+336,lo[2]],[hi[0]+584,hi[1]+336,hi[2]]],'meshes':len(objects),'triangles':sum(len(p.vertices)-2 for o in objects.values() for p in o.data.polygons),'trunks':3,'crown_lobes':len(centers),'finite_unit_normals':True,'foliage_contained_in_retained_original_lobes':True}
result=validate(); negatives=[]
def rejected(label):
    try: validate()
    except AssertionError as e:
        assert str(e)==label,(label,str(e)); negatives.append({'control':label,'rejected':True,'actual_error':str(e)})
    else: raise AssertionError('negative accepted: '+label)
o=objects['bed_support']; o.location.x+=10; bpy.context.view_layer.update(); rejected('out-of-envelope'); o.location.x-=10; bpy.context.view_layer.update()
o=objects.pop('tree1_trunk'); rejected('missing-trunk'); objects['tree1_trunk']=o
validate()
result.update({'passed':True,'negative_controls':negatives,'material_roles':list(roles),'textures':0,'glb_bytes':len(raw),'blender':bpy.app.version_string,'appearance_accepted':False,'integration_accepted':False,'native_capture':False})
(out/'validation.json').write_text(json.dumps(result,indent=2)+'\n')
print('GARDEN_VALIDATION '+json.dumps(result))
