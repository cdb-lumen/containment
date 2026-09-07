"""Blender geometry-locked texturing guard against preserved adult revision.
blender -b --factory-startup --python-exit-code 1 -P scripts/verify-cryo-texturing.py
"""
import bpy, pathlib, hashlib, json, struct, math
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
E=pathlib.Path('/home/chernodubv/.hermes/workspaces/containment-cryo-model-benchmark')
def geometry(path):
 bpy.ops.wm.open_mainfile(filepath=str(path))
 result={}
 for o in bpy.context.scene.objects:
  if o.type!='MESH':continue
  result[o.name]={'world':list(sum((list(row) for row in o.matrix_world),[])), 'vertices':[list(v.co) for v in o.data.vertices], 'polygons':[list(p.vertices) for p in o.data.polygons], 'normals':[list(v.normal) for v in o.data.vertices]}
  if o.name in ['Recessed medical display','Small casing pod identification']:
   result[o.name]['graphicsUV']=[list(p.uv) for p in o.data.uv_layers.active.data]
 return result
before=geometry(E/'texture-before/sealed-cryo.blend');after=geometry(ROOT/'public/assets/benchmark/sealed-cryo.blend')
assert before==after,'Geometry, transforms or normals changed'
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  assert o.data.uv_layers and all(math.isfinite(x) for p in o.data.uv_layers.active.data for x in p.uv)
for m in bpy.data.materials:
 for node in m.node_tree.nodes if m.use_nodes else []:
  if node.type=='TEX_IMAGE':
   assert node.image.packed_file and all(node.image.size)
   if 'surface' in node.image.name:
    pixels=np.empty(len(node.image.pixels),dtype=np.float32);node.image.pixels.foreach_get(pixels);pixels=pixels.reshape(-1,4)[:,:3]
    assert np.isfinite(pixels).all()
    if '-normal' in node.image.name:
     lengths=np.linalg.norm(pixels*2-1,axis=1)
     assert lengths.min()>.98 and lengths.max()<1.02 and pixels[:,2].min()>.95
    if '-roughness' in node.image.name:assert pixels[:,0].std()>.001
def glb(p):
 raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];return json.loads(raw[20:20+n]),len(raw)
b,bs=glb(E/'texture-before/sealed-cryo.glb');a,asize=glb(ROOT/'public/assets/benchmark/sealed-cryo.glb')
assert len(a['materials'])==len(b['materials'])==8
assert len([m for m in a['materials'] if 'normalTexture' in m])==4
assert len([m for m in a['materials'] if 'metallicRoughnessTexture' in m.get('pbrMetallicRoughness',{})])==4
assert len(a['images'])==10
assert all(i['mimeType']=='image/png' and 'bufferView' in i for i in a['images'])
# The graphics source is bit-identical; graphic mesh UVs must also be unchanged.
for name in ['Recessed medical display','Small casing pod identification']:
 assert name in before
result={'status':'PASS','geometryAndVertexNormalsExact':True,'namedMeshes':len(after),'materialsBefore':len(b['materials']),'materialsAfter':len(a['materials']),'bytesBefore':bs,'bytesAfter':asize,'embeddedImages':len(a['images']),'normalMappedMaterials':4,'roughnessMappedMaterials':4,'sourceTextureType':'Original analytic image atlases, not high-poly bakes','sha256':hashlib.sha256((ROOT/'public/assets/benchmark/sealed-cryo.glb').read_bytes()).hexdigest()}
assert (E/'texture-before/cryo-graphics-atlas.png').read_bytes()==(ROOT/'public/assets/benchmark/cryo-graphics-atlas.png').read_bytes()
(E/'texture-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
