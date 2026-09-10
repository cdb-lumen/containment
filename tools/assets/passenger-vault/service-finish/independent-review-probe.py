import bpy, sys, json, hashlib, struct, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout')
S=ROOT/'tools/assets/passenger-vault'; O=S/'service-finish'
receipt=json.loads((O/'verification.json').read_text()); clean=Path(receipt['clean_root'])
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
spec=importlib.util.spec_from_file_location('reviewed_contract',S/'test_service_finish.py'); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/passenger-vault/service-finish.glb'))
parts=list(bpy.data.objects)
report=m.validate(parts)
def normals_ok(objects):
    for o in objects:
        o.data.calc_loop_triangles()
        for tri in o.data.loop_triangles:
            pts=[o.matrix_world@o.data.vertices[i].co for i in tri.vertices]
            assert (pts[1]-pts[0]).cross(pts[2]-pts[0]).z>0
        for p in o.data.polygons: assert p.normal.z>.99999
normals_ok(parts)
negative=[]
for name in ['feed_A','feed_B','feed_C','feed_D4','console_north','console_south']:
    try:m.validate([o for o in parts if o.name!=name])
    except AssertionError:negative.append('missing_'+name)
    else:raise AssertionError('missing part accepted')
o=next(o for o in parts if o.name=='feed_A')
for h in [-.01,.01]:
    o.location.z=h
    try:m.validate(parts)
    except AssertionError:negative.append('height_'+str(h))
    else:raise AssertionError('height defect accepted')
o.location.z=0;bpy.context.view_layer.update()
# Mutate actual imported faces, never manufacture passing geometry.
for p in o.data.polygons:p.flip()
o.data.update()
try:m.validate(parts)
except AssertionError as e:
    assert 'winding' in str(e);negative.append('reversed_imported_winding')
else:raise AssertionError('reversed winding accepted')
# Direct GLB accessor audit, including exported normals rather than only face winding.
b=(ROOT/'public/assets/passenger-vault/service-finish.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);binary=b[28+n:]
normal_count=0
for mesh in g['meshes']:
    for prim in mesh['primitives']:
        a=g['accessors'][prim['attributes']['NORMAL']];v=g['bufferViews'][a['bufferView']]
        assert a['componentType']==5126 and a['type']=='VEC3'
        for i in range(a['count']):
            normal=struct.unpack_from('<fff',binary,v.get('byteOffset',0)+a.get('byteOffset',0)+i*v.get('byteStride',12))
            assert all(abs(x-y)<1e-6 for x,y in zip(normal,(0,1,0))),normal
            normal_count+=1
expected_context={'A':(320,240,520,360),'B':(680,240,880,360),'C':(320,520,520,640),'D4':(680,520,880,640),'SN':(300,40,900,120),'SS':(300,760,900,840),'MN':(1040,240,1160,320),'MS':(1040,560,1160,640)}
def source_snapshot(root):
    p=root/'tools/assets/passenger-vault/service-finish/service-finish.blend'
    bpy.ops.wm.open_mainfile(filepath=str(p))
    kit=[o for o in bpy.data.objects if not o.name.startswith('CONTEXT_')]
    m.validate(kit);normals_ok(kit)
    assert len(kit)==13 and len(bpy.data.objects)==23
    for name,r in expected_context.items():
        o=bpy.data.objects['CONTEXT_reservation_'+name]
        coords=[o.matrix_world@v.co for v in o.data.vertices]
        got=(min(p.x*32 for p in coords),min(-p.y*32 for p in coords),max(p.x*32 for p in coords),max(-p.y*32 for p in coords))
        assert all(abs(a-b)<1e-4 for a,b in zip(got,r))
        assert all(p.z<0 for p in coords)
    snap=[]
    for o in sorted(bpy.data.objects,key=lambda o:o.name):
        snap.append({'name':o.name,'matrix':[list(row) for row in o.matrix_world],'vertices':[list(v.co) for v in o.data.vertices],'faces':[(list(p.vertices),p.material_index) for p in o.data.polygons],'materials':[(mat.name,list(mat.diffuse_color)) for mat in o.data.materials]})
        assert all(mat.node_tree.nodes.get('Principled BSDF') for mat in o.data.materials)
    return hashlib.sha256(json.dumps(snap,sort_keys=True).encode()).hexdigest()
a=source_snapshot(ROOT);b=source_snapshot(clean);assert a==b==receipt['editable_source']['semantic_sha256']
result={'geometry':report,'own_negative_controls':negative,'own_negative_control_count':len(negative),'exported_upward_normals':normal_count,'source_semantic_sha256':a,'source_roots_reopened':2,'reservation_footprints_checked':len(expected_context),'glb_nodes':len(g['nodes']),'glb_materials':len(g['materials'])}
(O/'independent-geometry.json').write_text(json.dumps(result,indent=2)+'\n')
print('INDEPENDENT_REVIEW '+json.dumps(result,sort_keys=True))
