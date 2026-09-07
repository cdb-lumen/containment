"""Independent actual GLB accessor and world-space clearance validation.
blender -b --factory-startup --python-exit-code 1 -P scripts/verify-recovery-kit.py
"""
import bpy, pathlib, json, struct, math
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parents[1];f=R/'public/assets/awakening/recovery-kit/recovery-kit.glb';raw=f.read_bytes();assert raw[:4]==b'glTF'
jlen,jtype=struct.unpack_from('<II',raw,12);d=json.loads(raw[20:20+jlen]);bo=20+jlen+8
checks={};textureDims=[]
for m in d['meshes']:
 for primitive in m['primitives']:
  for name in ['POSITION','NORMAL','TEXCOORD_0']:
   a=d['accessors'][primitive['attributes'][name]];v=d['bufferViews'][a['bufferView']];assert a['componentType']==5126
   width={'VEC2':2,'VEC3':3}[a['type']];stride=v.get('byteStride',width*4);start=bo+v.get('byteOffset',0)+a.get('byteOffset',0)
   values=[struct.unpack_from('<'+'f'*width,raw,start+i*stride) for i in range(a['count'])]
   assert all(math.isfinite(x) for row in values for x in row)
   if name=='NORMAL':assert all(.98<sum(x*x for x in row)<1.02 for row in values)
   checks[name]=checks.get(name,0)+len(values)
for im in d['images']:
 v=d['bufferViews'][im['bufferView']];start=bo+v.get('byteOffset',0);assert raw[start:start+8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack_from('>II',raw,start+16);textureDims.append({'name':im.get('name'),'width':w,'height':h,'bytes':v['byteLength']})
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=str(f));bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
def p(x,y,h):return Vector(((x-204)/32,-(y-700)/32,h/32))
def ray(x,y,h,direction):return bpy.context.scene.ray_cast(deps,p(x,y,h),Vector(direction))
# Foot undersides contact deck, with solid legs intersecting rays at height10.
contacts=[]
for x in [190,218]:
 for y in [710,742]:
  hit,loc,*_=ray(x,y,-1,(0,0,1));assert hit and abs(loc.z*32)<.01
  hit,loc,*_=ray(x-5,y,10,(1,0,0));assert hit and abs((loc.x*32+204)-x)<2;contacts.append([x,y])
# Console cabinet carries worktop and screen; separate upward rays hit plinth.
for x in [180,204,228]:
 hit,loc,*_=ray(x,684,-1,(0,0,1));assert hit and abs(loc.z*32)<.01
# All mesh polygon AABBs must lie in one reservation, stronger than union vertices.
allowed=[(173,664,235,701,40),(186,704,222,748,38)];polycount=0
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 for face in o.data.polygons:
  pts=[o.matrix_world@o.data.vertices[i].co for i in face.vertices];game=[(v.x*32+204,700-v.y*32,v.z*32) for v in pts]
  assert any(all(x0-.002<=x<=x1+.002 and y0-.002<=y<=y1+.002 and -.002<=z<=cap+.002 for x,y,z in game) for x0,y0,x1,y1,cap in allowed);polycount+=1
result={'result':'PASS','finiteGLBAccessorCounts':checks,'unitLengthNormals':True,'embeddedTextures':textureDims,'individualTriangleReservationChecks':polycount,'deckContactFeet':contacts,'consoleDeckSupportRays':3,'nativeScale':1,'gameUnitsPerUnit':32,'mountThreeXYZ':[204/32,0,700/32],'runtimeCameraOrCollisionVerified':False}
(R/'docs/art-evidence/recovery-kit/independent-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
