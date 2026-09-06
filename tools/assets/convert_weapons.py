import struct,json,pathlib,io,math,sys
import numpy as np
from PIL import Image
BASE=pathlib.Path(sys.argv[1])
OUT=pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True,exist_ok=True)
for name,folder,file,tex,normal,length in [('pistol','blaster','tpweapon.md3','tpskin.jpg',None,.9),('rifle','rifle','tpweapon.md3','rifle.png','rifle_n.png',1.6),('shotgun','shotgun','tpshotgun.md3','tpskin.jpg',None,1.75),('plasma','prifle','tpweapon.md3','tpskin.jpg',None,1.65),('rocket','lcannon','tpweapon.md3','tplcannon.webp','tplcannon_n.webp',1.8)]:
 b=(BASE/folder/file).read_bytes();h=struct.unpack_from('<4si64s9i',b);off=h[-2];s=struct.unpack_from('<4s64s10i',b,off)
 vertices=np.array([struct.unpack_from('<3h',b,off+s[10]+j*8) for j in range(s[5])],dtype=float)/64
 scale=length/np.ptp(vertices,axis=0)[0]
 vertices=vertices[:,[1,2,0]]*scale
 norms=[]
 for j in range(s[5]):
  n=struct.unpack_from('<H',b,off+s[10]+j*8+6)[0];lat=(n>>8)*math.pi*2/255;lng=(n&255)*math.pi*2/255
  norms.append([math.sin(lat)*math.sin(lng),math.cos(lng),math.cos(lat)*math.sin(lng)])
 normals=np.array(norms,dtype=float)
 uv=np.array([struct.unpack_from('<2f',b,off+s[9]+j*8) for j in range(s[5])])
 faces=np.array([struct.unpack_from('<3i',b,off+s[7]+j*12) for j in range(s[6])])
 cross=np.cross(vertices[faces[:,1]]-vertices[faces[:,0]],vertices[faces[:,2]]-vertices[faces[:,0]])
 if (cross*normals[faces].mean(1)).sum()<0:faces=faces[:,[0,2,1]]
 data=bytearray();g={'asset':{'version':'2.0','generator':'Containment MD3 conversion','copyright':'Unvanquished contributors, CC BY-SA; see asset-credits.html'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':name,'mesh':0,'children':[1]}],'meshes':[],'buffers':[{}],'bufferViews':[],'accessors':[],'materials':[],'images':[],'textures':[]}
 def view(raw):
  while len(data)%4:data.extend(b'\0')
  n=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':len(data),'byteLength':len(raw)});data.extend(raw);return n
 def access(a,typ,ctype=5126):
  a=np.asarray(a,dtype='<f4' if ctype==5126 else '<u2');v=view(a.tobytes());i=len(g['accessors']);g['accessors'].append({'bufferView':v,'componentType':ctype,'count':len(a),'type':typ,'min':a.reshape(len(a),-1).min(0).tolist(),'max':a.reshape(len(a),-1).max(0).tolist()});return i
 def texture(filename):
  im=Image.open(BASE/folder/filename).convert('RGB');im.thumbnail((1024,1024),Image.Resampling.LANCZOS);buf=io.BytesIO();im.save(buf,format='JPEG',quality=93)
  i=len(g['images']);g['images'].append({'bufferView':view(buf.getvalue()),'mimeType':'image/jpeg'});g['textures'].append({'source':i});return i
 mat={'name':folder,'pbrMetallicRoughness':{'baseColorTexture':{'index':texture(tex)},'metallicFactor':.45,'roughnessFactor':.58}}
 if normal:mat['normalTexture']={'index':texture(normal),'scale':.6}
 g['materials'].append(mat)
 g['meshes'].append({'primitives':[{'attributes':{'POSITION':access(vertices,'VEC3'),'NORMAL':access(normals,'VEC3'),'TEXCOORD_0':access(uv,'VEC2')},'indices':access(faces.flatten(),'SCALAR',5123),'material':0}]})
 tags=[struct.unpack_from('<64s12f',b,h[-3]+j*112) for j in range(h[5])];flash=next(t for t in tags if t[0].startswith(b'tag_flash'))
 g['nodes'].append({'name':'muzzle','translation':[flash[2]*scale,flash[3]*scale,flash[1]*scale]})
 while len(data)%4:data.extend(b'\0')
 g['buffers'][0]['byteLength']=len(data);js=json.dumps(g,separators=(',',':')).encode();js+=b' ' * (-len(js)%4)
 glb=struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(data))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(data),b'BIN\0')+data
 (OUT/(name+'.glb')).write_bytes(glb);print(name,len(vertices),len(faces),len(glb),g['nodes'][1])
