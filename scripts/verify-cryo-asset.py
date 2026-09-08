"""Focused uncompressed GLB attribute/bounds guard, no Blender dependency."""
import hashlib,json,math,pathlib,struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=ROOT/'public/assets/benchmark/sealed-cryo.glb';raw=p.read_bytes()
assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);binary=raw[28+n:]
widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4};formats={5126:'f',5125:'I',5123:'H',5121:'B'}
def values(index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];fmt='<'+formats[a['componentType']]*widths[a['type']];size=struct.calcsize(fmt);base=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size)
 return [struct.unpack_from(fmt,binary,base+i*stride) for i in range(a['count'])]
primitives=[p for m in doc['meshes'] for p in m['primitives']]
assert len(primitives)==8
mesh_nodes={node['mesh']:node for node in doc['nodes'] if 'mesh' in node}
normal_count=0;positions=[]
for mesh_index,mesh in enumerate(doc['meshes']):
 for primitive in mesh['primitives']:
  a=primitive['attributes'];assert {'POSITION','NORMAL','TEXCOORD_0'}<=a.keys()
  pos=values(a['POSITION']);normals=values(a['NORMAL']);uv=values(a['TEXCOORD_0']);assert len(pos)==len(normals)==len(uv)
  assert all(math.isfinite(x) for group in [pos,normals,uv] for row in group for x in row)
  assert all(abs(sum(x*x for x in row)-1)<.001 for row in normals)
  node=mesh_nodes[mesh_index];assert 'matrix' not in node
  q=node.get('rotation',[0,0,0,1]);t=node.get('translation',[0,0,0]);s=node.get('scale',[1,1,1])
  for row in pos:
   v=[row[i]*s[i] for i in range(3)];u=q[:3];dot=sum(u[i]*v[i] for i in range(3));uu=sum(x*x for x in u);cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
   positions.append([2*dot*u[i]+(q[3]*q[3]-uu)*v[i]+2*q[3]*cross[i]+t[i] for i in range(3)])
  normal_count+=len(normals)
bounds=[[min(v[i] for v in positions),max(v[i] for v in positions)] for i in range(3)]
assert bounds[0][1]-bounds[0][0]<=1.6801 and 2.57<bounds[2][1]-bounds[2][0]<2.60
assert len(doc.get('images',[]))>=2
assert all('bufferView' in image and image['mimeType']=='image/png' for image in doc['images'])
assert any('baseColorTexture' in m.get('pbrMetallicRoughness',{}) for m in doc['materials'])
assert any('metallicRoughnessTexture' in m.get('pbrMetallicRoughness',{}) for m in doc['materials'])
texture_stats=[{'name':i.get('name'),'bytes':doc['bufferViews'][i['bufferView']]['byteLength'],'mimeType':i['mimeType']} for i in doc['images']]
result={'textures':texture_stats,'bakedNormalMap':False,'fitsApprovedReservation':False,'status':'PASS','primitives':len(primitives),'normalVertices':normal_count,'finiteUVs':True,'unitNormals':True,'boundsGLTF':bounds,'sha256':hashlib.sha256(raw).hexdigest()}
print(json.dumps(result,indent=2))
