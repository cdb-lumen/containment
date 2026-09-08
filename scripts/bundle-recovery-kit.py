"""Bundle approved kit exports without changing coordinates or PBR/UV data."""
import json, struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=['recovery-kit/recovery-kit.glb','recovery-storage/locker.glb','recovery-storage/satellite-cabinet.glb','recovery-storage/trolley.glb']
out={'asset':{'version':'2.0','generator':'Containment lossless recovery bundle'},'scene':0,'scenes':[{'nodes':[]}],**{k:[] for k in ['nodes','meshes','accessors','bufferViews','materials','textures','images','samplers']}}
binary=bytearray(); image_ids={}; sampler_ids={}
for path in paths:
 data=(root/'public/assets/awakening'/path).read_bytes(); n=struct.unpack_from('<I',data,12)[0]; g=json.loads(data[20:20+n]); chunk=data[28+n:]
 offsets={k:len(out[k]) for k in ['nodes','meshes','accessors','bufferViews','materials','textures','samplers']}; base=len(binary); binary.extend(chunk)
 for v in g['bufferViews']: v['byteOffset']=v.get('byteOffset',0)+base;out['bufferViews'].append(v)
 for a in g['accessors']: a['bufferView']+=offsets['bufferViews'];out['accessors'].append(a)
 imap={}
 for i,image in enumerate(g.get('images',[])):
  v=g['bufferViews'][image['bufferView']]; payload=bytes(binary[v['byteOffset']:v['byteOffset']+v['byteLength']]);key=(image.get('mimeType'),payload)
  if key not in image_ids:
   image_ids[key]=len(out['images']);image['bufferView']+=offsets['bufferViews'];out['images'].append(image)
  imap[i]=image_ids[key]
 smap={}
 for i,sampler in enumerate(g.get('samplers',[])):
  key=json.dumps(sampler,sort_keys=True)
  if key not in sampler_ids:sampler_ids[key]=len(out['samplers']);out['samplers'].append(sampler)
  smap[i]=sampler_ids[key]
 for t in g.get('textures',[]):
  t['source']=imap[t['source']]
  if 'sampler' in t:t['sampler']=smap[t['sampler']]
  out['textures'].append(t)
 def remap_textures(obj):
  if isinstance(obj,dict):
   for k,v in obj.items():
    if k.endswith('Texture') and isinstance(v,dict) and 'index' in v:v['index']+=offsets['textures']
    else:remap_textures(v)
  elif isinstance(obj,list):
   for v in obj:remap_textures(v)
 for m in g['materials']:remap_textures(m);out['materials'].append(m)
 for m in g['meshes']:
  for p in m['primitives']:
   p['attributes']={k:v+offsets['accessors'] for k,v in p['attributes'].items()}
   if 'indices' in p:p['indices']+=offsets['accessors']
   p['material']+=offsets['materials']
  out['meshes'].append(m)
 for node in g['nodes']:
  if 'mesh' in node:node['mesh']+=offsets['meshes']
  if 'children' in node:node['children']=[n+offsets['nodes'] for n in node['children']]
  out['nodes'].append(node)
 out['scenes'][0]['nodes'].extend(n+offsets['nodes'] for n in g['scenes'][g.get('scene',0)]['nodes'])
out['buffers']=[{'byteLength':len(binary)}]; text=json.dumps(out,separators=(',',':')).encode();text+=b' '*((-len(text))%4)
result=struct.pack('<III',0x46546c67,2,28+len(text)+len(binary))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(binary),0x004e4942)+binary
(root/'public/assets/awakening/recovery-kit/room-kit.glb').write_bytes(result)
print(json.dumps({'bytes':len(result),'meshes':len(out['meshes']),'materials':len(out['materials']),'uniqueImages':len(out['images']),'textures':len(out['textures'])}))
