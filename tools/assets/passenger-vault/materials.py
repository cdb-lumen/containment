"""Original deterministic material layer over accepted GLB geometry. Python stdlib.
python3 tools/assets/passenger-vault/materials.py [--output-root PATH]
Never rewrites construction assets. UVs and embedded PNGs are appended to buffers.
"""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import struct
import zlib

def glb(path):
    raw=path.read_bytes();size=struct.unpack_from('<I',raw,12)[0]
    return json.loads(raw[20:20+size]),raw[28+size:]


def values(doc,binary,index):
    a=doc['accessors'][index];view=doc['bufferViews'][a['bufferView']]
    assert a['componentType']==5126 and a['type']=='VEC3'
    start=view.get('byteOffset',0)+a.get('byteOffset',0)
    return [struct.unpack_from('<fff',binary,start+i*view.get('byteStride',12)) for i in range(a['count'])]

ROOT=Path(__file__).resolve().parents[3]
SIZE=256

def png(rgb):
    def chunk(tag,data):
        return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
    scan=b''.join(b'\0'+rgb[y*SIZE*3:(y+1)*SIZE*3] for y in range(SIZE))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',SIZE,SIZE,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(scan,9))+chunk(b'IEND',b'')

def texture(kind,wear):
    color=bytearray(); orm=bytearray()
    for y in range(SIZE):
        for x in range(SIZE):
            u=(x+.5)/SIZE;v=(y+.5)/SIZE
            # Fixed integer grain, no third-party photographs or random runtime seed.
            grain=(((x*1973+y*9277)^((x+y)*26699))%101)/100-.5
            if kind=='shell':
                wipe=math.exp(-((u-.5)/.34)**6-((v-.52)/.40)**6)*(0.5+0.5*math.sin(48*v+2*math.sin(6*u))) if wear else 0
                c=[232+grain*1.2-wipe*2,232+grain*1.2-wipe*2,222+grain*1.2-wipe*2]
                rough=.38+grain*.018-wipe*.065;metal=0
            elif kind=='carrier':
                # Lower half is untouched insulation. Upper half is reserved for
                # removable service-panel edges where repeated tools/contact rub.
                edge=math.exp(-((min(u,1-u)-.06)/.035)**2) if v>.5 and wear else 0
                c=[42+grain*3+edge*3,49+grain*3+edge*3,52+grain*3+edge*3]
                rough=.89+grain*.025-edge*.09;metal=0
            else:
                # Lower atlas half: hand-polished clamp pad. Upper: short parallel
                # tool strokes at the union wrench-contact region, never rust.
                localv=(v%.5)*2
                contact=math.exp(-((u-.5)/.30)**4-((localv-.5)/.30)**4)
                stroke=(1 if int(u*170+localv*12)%29<2 else 0)*contact
                polish=contact*(.13 if v<.5 else .055)+stroke*.08 if wear else 0
                c=[173+grain*3+polish*18,181+grain*3+polish*18,184+grain*3+polish*18]
                rough=.36+grain*.026-polish;metal=1
            color.extend(max(0,min(255,round(a))) for a in c)
            orm.extend([255,round(max(0,min(1,rough))*255),round(metal*255)])
    return {'basecolor':bytes(color),'orm':bytes(orm)}

def role(name):
    if 'live_relief' in name:return 4
    if 'gasket' in name or 'status_recess' in name or 'internal_bed' in name:return 3
    if any(s in name for s in ['clamp','union','supply_return']):return 2
    if name.startswith('carrier_') or 'cradle' in name:return 1
    return 0

def append_view(d,b,raw,target=None):
    b.extend(b'\0'*((-len(b))%4)); offset=len(b);b.extend(raw)
    view={'buffer':0,'byteOffset':offset,'byteLength':len(raw)}
    if target:view['target']=target
    d['bufferViews'].append(view)
    return len(d['bufferViews'])-1

def build_variant(source,out,stage,maps):
    original,binary=glb(source);d=copy.deepcopy(original);b=bytearray(binary)
    names={n['mesh']:n['name'] for n in d['nodes'] if 'mesh' in n}
    assignments={}
    for i,mesh in enumerate(d['meshes']):
        name=names[i];material=role(name);assignments[name]=material
        for p in mesh['primitives']:
            positions=values(d,b,p['attributes']['POSITION']);normals=values(d,b,p['attributes']['NORMAL'])
            lo=[min(p[k] for p in positions) for k in range(3)];hi=[max(p[k] for p in positions) for k in range(3)]
            uv=[]
            for pos,n in zip(positions,normals):
                axis=max(range(3),key=lambda k:abs(n[k]));axes=[k for k in range(3) if k!=axis]
                a,c=[(pos[k]-lo[k])/max(1e-9,hi[k]-lo[k]) for k in axes]
                a=max(0,min(1,a));c=max(0,min(1,c))
                if material==1:c=.51+c*.48 if 'service_panel' in name else .01+c*.48
                if material==2:c=.01+c*.48 if 'clamp' in name else .51+c*.48
                uv.extend([a,c])
            view=append_view(d,b,struct.pack('<'+'f'*len(uv),*uv),34962)
            p['attributes']['TEXCOORD_0']=len(d['accessors'])
            d['accessors'].append({'bufferView':view,'componentType':5126,'count':len(positions),'type':'VEC2'})
            if stage!='neutral':p['material']=material
    if stage!='neutral':
        d['images']=[];d['textures']=[];d['samplers']=[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}]
        d['materials']=[]
        for kind in ['shell','carrier','metal']:
            texture_ids=[]
            for channel in ['basecolor','orm']:
                raw=maps[(stage,kind,channel)]
                view=append_view(d,b,png(raw));index=len(d['images'])
                d['images'].append({'name':f'{stage}-{kind}-{channel}','bufferView':view,'mimeType':'image/png'})
                d['textures'].append({'sampler':0,'source':index});texture_ids.append(index)
            d['materials'].append({'name':f'PV_{kind}','pbrMetallicRoughness':{'baseColorTexture':{'index':texture_ids[0]},'metallicRoughnessTexture':{'index':texture_ids[1]},'metallicFactor':1,'roughnessFactor':1}})
        d['materials'].append({'name':'PV_matte_gasket','pbrMetallicRoughness':{'baseColorFactor':[.009,.014,.016,1],'metallicFactor':0,'roughnessFactor':.96}})
        d['materials'].append({'name':'PV_live_cyan','pbrMetallicRoughness':{'baseColorFactor':[.015,.38,.40,1],'metallicFactor':0,'roughnessFactor':.53},'emissiveFactor':[.025,.42,.45]})
    b.extend(b'\0'*((-len(b))%4));d['buffers']=[{'byteLength':len(b)}]
    d['asset']['generator']='Passenger Vault material layer v1; accepted geometry preserved'
    encoded=json.dumps(d,separators=(',',':'),sort_keys=True).encode();encoded+=b' '*((-len(encoded))%4)
    raw=struct.pack('<4sII',b'glTF',2,28+len(encoded)+len(b))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(b),b'BIN\0')+b
    out.write_bytes(raw)
    return assignments

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output-root',type=Path,default=ROOT);args=parser.parse_args()
    out=args.output_root/'public/assets/passenger-vault/materials';out.mkdir(parents=True,exist_ok=True)
    maps={};decoded={}
    for stage in ['material','wear']:
        for kind in ['shell','carrier','metal']:
            for channel,raw in texture(kind,stage=='wear').items():
                maps[(stage,kind,channel)]=raw
                name=f'{stage}-{kind}-{channel}.png';(out/name).write_bytes(png(raw))
                decoded[name]={'sha256_rgb':hashlib.sha256(raw).hexdigest(),'color_space':'sRGB' if channel=='basecolor' else 'linear Non-Color','size':[SIZE,SIZE],'channels':'RGB' if channel=='basecolor' else 'R=occlusion 1, G=roughness, B=metallic'}
    source=ROOT/'public/assets/passenger-vault'; assignments={};triangles={};source_hashes={}
    for path in sorted(source.glob('*.glb')):
        d,b=glb(path);triangles[path.stem]=sum(d['accessors'][p['indices']]['count']//3 for m in d['meshes'] for p in m['primitives'])
        source_hashes[path.name]=hashlib.sha256(path.read_bytes()).hexdigest()
    for family in ['chamber','row-carrier']:
        for stage in ['neutral','material','wear']:
            assignments[family]=build_variant(source/(family+'.glb'),out/f'{stage}-{family}.glb',stage,maps)
    existing=[p for p in source.glob('*.glb') if p.stem not in ['chamber','row-carrier']]
    signatures=set()
    for p in existing:
        for m in glb(p)[0]['materials']:
            signatures.add(json.dumps({k:v for k,v in m.items() if k!='name'},sort_keys=True))
    manifest={'schema':1,'status':'candidate, independent review pending, not runtime integrated','base_commit':'9f2f37a9b77dd44aef72296144feb26631c70091','source_sha256':source_hashes,'source_script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'method':'Append UV/PNG buffers and assign materials only; original POSITION/NORMAL/indices/nodes preserved byte-for-value. Deterministic stdlib PNG encoding.','material_names':['PV_shell','PV_carrier','PV_metal','PV_matte_gasket','PV_live_cyan'],'shared_materials_candidate':5,'remaining_material_slots':3,'whole_package_current_unique_material_signatures':5+len(signatures),'whole_package_material_budget_pass':5+len(signatures)<=8,'material_budget_note':'Five reusable candidate materials. Legacy other-family neutral palettes are not consolidated by this slice; whole-room 8-material gate remains open.','assignments':assignments,'triangles':triangles,'placed_triangles_all_families':16*triangles['chamber']+4*triangles['row-carrier']+sum(triangles[p.stem] for p in existing),'wear_glb_bytes_all_families':sum((out/f'wear-{f}.glb').stat().st_size for f in ['chamber','row-carrier'])+sum(p.stat().st_size for p in existing),'decoded_texture_bytes_with_mips':6*SIZE*SIZE*4*4//3,'texture_budget_note':'One stage, six RGBA8 allocations including mip chain, shared across both GLBs by content during future integration. Without inter-GLB sharing double this value. Neutral/material/wear are alternative presentations, not simultaneous shipping loads.','textures':decoded,'files':{}}
    for path in sorted(out.iterdir()):
        if path.suffix in ['.glb','.png']:
            raw=path.read_bytes();manifest['files'][path.name]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({k:manifest[k] for k in ['status','placed_triangles_all_families','wear_glb_bytes_all_families','decoded_texture_bytes_with_mips','whole_package_current_unique_material_signatures','whole_package_material_budget_pass']},indent=2))

if __name__=='__main__':main()
