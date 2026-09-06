#!/usr/bin/env python3
"""Convert authored Inter-Quake Export skeletal assets to self-contained glTF 2.0.
Usage: python iqe_to_glb.py input.iqe output.glb [--texture-root DIR]
       [--material-map JSON] [--max-texture 1024] [--no-y-up]
Material mapping JSON: {"mesh_name": {"diffuse":"path", "normal":"path"}}.
Paths in mapping are relative to input IQE directory; absolute paths are accepted.
IQE uses clockwise triangles and top-left texture origin; glTF uses CCW and
same UV origin. Geometry is kept in source space, under a -90 degree X root.
Requires numpy and Pillow. No third party glTF writer or Blender required.
"""
import argparse, io, json, math, re, shlex, struct
from pathlib import Path
import numpy as np
from PIL import Image


def pose(vals):
    a=np.array(vals,dtype=np.float64)
    if len(a)==7:a=np.r_[a,[1,1,1]]
    if len(a)!=10 or not np.isfinite(a).all():raise ValueError('Bad pq transform')
    n=np.linalg.norm(a[3:7])
    if n<1e-8:raise ValueError('Zero quaternion')
    a[3:7]/=n
    return a


def matrix(p):
    x,y,z,w=p[3:7]
    r=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
                [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
                [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    m=np.eye(4);m[:3,:3]=r@np.diag(p[7:10]);m[:3,3]=p[:3];return m


def parse(path):
    joints=[];bind=[];meshes=[];anims=[];mesh=None;anim=None;frame=None
    for line in Path(path).read_text().splitlines():
        line=line.strip()
        if not line or line.startswith('#'):continue
        key,_,rest=line.partition(' ')
        if key=='joint':
            a=shlex.split(rest);joints.append((a[0],int(a[1])))
        elif key=='mesh':
            mesh={'name':shlex.split(rest)[0],'material':None,'vp':[],'vn':[],'vt':[],'vx':[],'vb':[],'fm':[]};meshes.append(mesh)
        elif key=='material':mesh['material']=shlex.split(rest)[0]
        elif key in ('vp','vn','vt','vx'):mesh[key].append(list(map(float,rest.split())))
        elif key=='vb':
            a=rest.split();mesh['vb'].append([(int(a[i]),float(a[i+1])) for i in range(0,len(a),2)])
        elif key in ('fm','fa'):
            a=list(map(int,rest.split()))
            if key=='fa':raise ValueError('Absolute face indices unsupported; use fm')
            a=[x if x>=0 else len(mesh['vp'])+x for x in a]
            for k in range(1,len(a)-1):mesh['fm'].append([a[0],a[k+1],a[k]])
        elif key=='animation':
            anim={'name':shlex.split(rest)[0],'fps':30,'frames':[],'loop':False};anims.append(anim);frame=None
        elif key=='framerate':anim['fps']=float(rest)
        elif key=='loop':anim['loop']=True
        elif key=='frame':frame=[];anim['frames'].append(frame)
        elif key=='pq':
            p=pose(list(map(float,rest.split())))
            if anim is None:bind.append(p)
            elif frame is not None:frame.append(p)
            else:raise ValueError('Animation pose outside frame')
        elif key in ('pm','pa'):raise ValueError('Only pq joint transforms supported')
    if len(joints)!=len(bind):raise ValueError(f'{len(joints)} joints but {len(bind)} bind transforms')
    for i,(name,parent) in enumerate(joints):
        if parent>=i or parent < -1:raise ValueError(f'Invalid parent {parent} for {name}')
    for a in anims:
        if any(len(f)!=len(joints) for f in a['frames']):raise ValueError('Incomplete animation skeleton: '+a['name'])
        if a['fps']<=0:raise ValueError('Bad animation framerate')
    return joints,np.array(bind),meshes,anims


def convert(source,output,texture_root=None,material_map=None,max_texture=1024,y_up=True,max_fps=30,keep=None):
    source=Path(source);output=Path(output);joints,bind,meshes,anims=parse(source)
    root=Path(texture_root) if texture_root else source.parent
    mapping=material_map or {};nj=len(joints); binary=bytearray()
    gl={'asset':{'version':'2.0','generator':'iqe_to_glb.py'},'scene':0,'scenes':[{'nodes':[0]}],
        'nodes':[{'name':'IQE Z-up to glTF Y-up','children':[]}], 'meshes':[], 'skins':[],
        'materials':[],'textures':[],'images':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],
        'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[],'animations':[]}
    if y_up:gl['nodes'][0]['rotation']=[-math.sqrt(.5),0,0,math.sqrt(.5)]
    report={'source':str(source),'output':str(output),'joints':nj,'meshes':[],'animations':[], 'repairs':[]}
    def view(data,target=None):
        while len(binary)%4:binary.append(0)
        v={'buffer':0,'byteOffset':len(binary),'byteLength':len(data)}
        if target:v['target']=target
        gl['bufferViews'].append(v);binary.extend(data);return len(gl['bufferViews'])-1
    def accessor(arr,typ,component=5126,target=None,bounds=False):
        dt={5126:'<f4',5123:'<u2',5125:'<u4'}[component]; a=np.asarray(arr,dtype=dt)
        if not np.isfinite(a).all():raise ValueError('Nonfinite accessor')
        v=view(a.tobytes(),target);ac={'bufferView':v,'componentType':component,'count':len(a),'type':typ}
        if bounds:ac.update(min=a.min(axis=0).reshape(-1).tolist(),max=a.max(axis=0).reshape(-1).tolist())
        gl['accessors'].append(ac);return len(gl['accessors'])-1
    globals_=[]
    for i,((name,parent),p) in enumerate(zip(joints,bind)):
        m=matrix(p);gm=globals_[parent]@m if parent>=0 else m;globals_.append(gm)
        gl['nodes'].append({'name':name,'translation':p[:3].tolist(),'rotation':p[3:7].tolist(),'scale':p[7:10].tolist()})
        par=gl['nodes'][parent+1] if parent>=0 else gl['nodes'][0];par.setdefault('children',[]).append(i+1)
    inverse=np.linalg.inv(globals_);err=float(np.max(np.abs(np.array(globals_)@inverse-np.eye(4))))
    report['bind_inverse_max_error']=err
    if err>1e-6:raise ValueError('Bind inverse validation failed')
    # numpy rows converted to glTF column-major serialization.
    gl['skins'].append({'name':source.stem+' skeleton','joints':list(range(1,nj+1)),
                       'inverseBindMatrices':accessor(inverse.transpose(0,2,1).reshape(nj,16),'MAT4')})
    tex_cache={};material_cache={}
    def texture(path,normal=False):
        path=Path(path);key=(str(path),normal)
        if key in tex_cache:return tex_cache[key]
        im=Image.open(path).convert('RGB');im.thumbnail((max_texture,max_texture),Image.Resampling.LANCZOS)
        if normal:
            # Resizing tangent-space normals requires renormalization.
            a=np.asarray(im,dtype=np.float32)/127.5-1; a/=np.maximum(np.linalg.norm(a,axis=2,keepdims=True),1e-6)
            im=Image.fromarray(np.uint8(np.clip((a+1)*127.5,0,255)));fmt='JPEG';mime='image/jpeg'
        else:fmt='JPEG';mime='image/jpeg'
        buf=io.BytesIO();im.save(buf,fmt,quality=95 if normal else 88,subsampling=0 if normal else 2,optimize=True)
        gl['images'].append({'name':path.name,'mimeType':mime,'bufferView':view(buf.getvalue())})
        gl['textures'].append({'source':len(gl['images'])-1,'sampler':0});idx=len(gl['textures'])-1;tex_cache[key]=idx;return idx
    def resolve(name):
        p=Path(name)
        candidates=[p] if p.is_absolute() else [root/p,source.parent/p,source.parent/p.name]
        for c in candidates:
            if c.is_file():return c
            if not c.suffix:
                for ext in ('.png','.jpg','.jpeg','.tga'):
                    if c.with_suffix(ext).is_file():return c.with_suffix(ext)
        return None
    for mesh in meshes:
        n=len(mesh['vp']);pos=np.array(mesh['vp']);normal=np.array(mesh['vn']);uv=np.array(mesh['vt']);faces=np.array(mesh['fm'])
        if len(normal)!=n or len(uv)!=n:raise ValueError('Incomplete normal/UV attributes')
        if faces.min()<0 or faces.max()>=n:raise ValueError('Face index outside mesh')
        ws=[[(j,w) for j,w in influences if w>1e-8] for influences in mesh['vb']]
        if len(ws)!=n:raise ValueError('Missing vertex weight records')
        valid=[i for i,w in enumerate(ws) if sum(v for _,v in w)>1e-8]
        missing=[i for i,w in enumerate(ws) if sum(v for _,v in w)<=1e-8]
        if not valid:raise ValueError('Entire mesh unweighted')
        for i in missing:
            near=valid[int(np.argmin(np.sum((pos[valid]-pos[i])**2,axis=1)))];ws[i]=list(ws[near])
        if missing:report['repairs'].append({'mesh':mesh['name'],'unweighted_vertices':len(missing),'action':'copied nearest weighted vertex influences'})
        maxinf=max(map(len,ws));sets=math.ceil(maxinf/4);ji=np.zeros((n,sets*4),dtype=np.uint16);ww=np.zeros((n,sets*4),dtype=np.float32)
        for i,w in enumerate(ws):
            total=sum(v for _,v in w)
            if any(k<0 or k>=nj or v<0 for k,v in w):raise ValueError('Invalid influence')
            for k,(bone,weight) in enumerate(w):ji[i,k]=bone;ww[i,k]=weight/total
        attrs={'POSITION':accessor(pos,'VEC3',target=34962,bounds=True),'NORMAL':accessor(normal,'VEC3',target=34962),
               'TEXCOORD_0':accessor(uv,'VEC2',target=34962)}
        if len(mesh['vx'])==n:
            tang=np.array(mesh['vx'],dtype=np.float64)
            tang[:,:3]-=normal*np.sum(normal*tang[:,:3],axis=1,keepdims=True)
            for i in np.flatnonzero(np.linalg.norm(tang[:,:3],axis=1)<1e-8):
                axis=np.array([1.,0,0]) if abs(normal[i,0])<.9 else np.array([0.,1,0])
                tang[i,:3]=np.cross(normal[i],axis)
            tang[:,:3]/=np.maximum(np.linalg.norm(tang[:,:3],axis=1,keepdims=True),1e-10)
            # IQM uses cross(tangent, normal); glTF uses cross(normal, tangent).
            tang[:,3]=np.where(tang[:,3]>=0,-1,1)
        else:
            # Generate tangent/bitangent from the retained IQE top-left UVs.
            tangent=np.zeros_like(pos);bitangent=np.zeros_like(pos)
            for tri in faces:
                i,j,k=tri;e1=pos[j]-pos[i];e2=pos[k]-pos[i];u1=uv[j]-uv[i];u2=uv[k]-uv[i]
                det=u1[0]*u2[1]-u1[1]*u2[0]
                if abs(det)<1e-12:continue
                t=(e1*u2[1]-e2*u1[1])/det;bt=(e2*u1[0]-e1*u2[0])/det
                tangent[tri]+=t;bitangent[tri]+=bt
            tangent-=normal*np.sum(normal*tangent,axis=1,keepdims=True)
            lengths=np.linalg.norm(tangent,axis=1)
            for i in np.flatnonzero(lengths<1e-8):
                axis=np.array([1.,0,0]) if abs(normal[i,0])<.9 else np.array([0.,1,0])
                tangent[i]=np.cross(normal[i],axis)
            tangent/=np.maximum(np.linalg.norm(tangent,axis=1,keepdims=True),1e-10)
            signs=np.where(np.sum(np.cross(normal,tangent)*bitangent,axis=1)<0,-1,1)
            tang=np.c_[tangent,signs]
        attrs['TANGENT']=accessor(tang,'VEC4',target=34962)
        for k in range(sets):
            attrs[f'JOINTS_{k}']=accessor(ji[:,k*4:k*4+4],'VEC4',5123,34962)
            attrs[f'WEIGHTS_{k}']=accessor(ww[:,k*4:k*4+4],'VEC4',target=34962)
        matinfo=mapping.get(mesh['name'],{})
        if isinstance(matinfo,str):matinfo={'diffuse':matinfo}
        diffuse=resolve(matinfo.get('diffuse',mesh['material'] or mesh['name']))
        if not diffuse:raise FileNotFoundError('Missing diffuse for '+mesh['name'])
        norm=resolve(matinfo['normal']) if 'normal' in matinfo else resolve(str(diffuse.with_name(diffuse.stem+'_n')))
        mat={'name':mesh['material'] or mesh['name'],'pbrMetallicRoughness':{'baseColorTexture':{'index':texture(diffuse)},'metallicFactor':0,'roughnessFactor':0.72}}
        if norm:mat['normalTexture']={'index':texture(norm,True)}
        matkey=(str(diffuse),str(norm))
        if matkey not in material_cache:
            material_cache[matkey]=len(gl['materials']);gl['materials'].append(mat)
        material_index=material_cache[matkey]
        gl['meshes'].append({'name':mesh['name'],'primitives':[{'attributes':attrs,'indices':accessor(faces.reshape(-1),'SCALAR',5123 if n<65536 else 5125,34963),'material':material_index}]})
        gl['nodes'].append({'name':mesh['name']+' mesh','mesh':len(gl['meshes'])-1,'skin':0});gl['scenes'][0]['nodes'].append(len(gl['nodes'])-1)
        # At rest every weighted skin transform must be the identity.
        skin=np.array(globals_)@inverse;rest=np.zeros((n,4));hp=np.c_[pos,np.ones(n)]
        for k in range(ji.shape[1]):rest+=np.einsum('nij,nj->ni',skin[ji[:,k]],hp)*ww[:,k,None]
        resterr=float(np.max(np.abs(rest[:,:3]-pos)))
        if resterr>1e-4:raise ValueError('Rest skin reconstruction failed')
        report['meshes'].append({'name':mesh['name'],'vertices':n,'triangles':len(faces),'influences_max':maxinf,'weight_sum_max_error':float(np.max(abs(ww.sum(axis=1)-1))),'rest_position_max_error':resterr,'diffuse':str(diffuse),'normal':str(norm),'bounds':[pos.min(axis=0).tolist(),pos.max(axis=0).tolist()]})
    for anim in anims:
        if keep and not re.fullmatch(keep,anim['name']):continue
        frames=np.array(anim['frames']);nf=len(frames)
        if not nf:continue
        stride=max(1,int(math.ceil(anim['fps']/max_fps)))
        selected=np.unique(np.r_[np.arange(0,nf,stride),nf-1]).astype(int)
        frames=frames[selected];times=selected.astype(np.float32)/anim['fps'];nf=len(frames)
        ta=None;single_time=None
        ga={'name':anim['name'],'samplers':[],'channels':[],'extras':{'sourceFramerate':anim['fps'],'sourceLoop':anim['loop']}}
        # Normalize quaternion hemispheres for interpolation continuity.
        for fi in range(1,nf):
            flip=np.sum(frames[fi,:,3:7]*frames[fi-1,:,3:7],axis=1)<0;frames[fi,flip,3:7]*=-1
        for bone in range(nj):
            for prop,sl,typ in [('translation',slice(0,3),'VEC3'),('rotation',slice(3,7),'VEC4'),('scale',slice(7,10),'VEC3')]:
                vals=frames[:,bone,sl]
                # Omit tracks that exactly preserve bind state; include constant pose overrides.
                base=bind[bone,sl]
                if prop=='rotation' and np.dot(base,vals[0])<0:base=-base
                if np.allclose(vals,base,atol=1e-7,rtol=0):continue
                inp=ta
                if np.allclose(vals,vals[0],atol=1e-6,rtol=0):
                    if not ga['samplers'] and nf>1:
                        # One constant track retains the clip's authored duration.
                        vals=vals[[0,-1]];inp=accessor(times[[0,-1]],'SCALAR',bounds=True)
                    else:
                        vals=vals[:1]
                        if single_time is None:single_time=accessor(np.array([0],dtype=np.float32),'SCALAR',bounds=True)
                        inp=single_time
                if inp is None:
                    if ta is None:ta=accessor(times,'SCALAR',bounds=True)
                    inp=ta
                ga['samplers'].append({'input':inp,'output':accessor(vals,typ),'interpolation':'LINEAR'})
                ga['channels'].append({'sampler':len(ga['samplers'])-1,'target':{'node':bone+1,'path':prop}})
        if ga['channels']:gl['animations'].append(ga)
        report['animations'].append({'name':anim['name'],'frames':nf,'sourceFrames':len(anim['frames']),'sourceFps':anim['fps'],'duration':float(times[-1]),'channels':len(ga['channels'])})
    while len(binary)%4:binary.append(0)
    gl['buffers'][0]['byteLength']=len(binary)
    js=json.dumps(gl,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
    data=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
    output.parent.mkdir(parents=True,exist_ok=True);output.write_bytes(data);report['bytes']=len(data)
    output.with_suffix('.report.json').write_text(json.dumps(report,indent=2));return report

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('input');ap.add_argument('output');ap.add_argument('--texture-root');ap.add_argument('--material-map');ap.add_argument('--max-texture',type=int,default=1024);ap.add_argument('--no-y-up',action='store_true');ap.add_argument('--max-fps',type=float,default=30);ap.add_argument('--keep',help='Regex full-match for retained animation names');a=ap.parse_args()
    r=convert(a.input,a.output,a.texture_root,json.loads(Path(a.material_map).read_text()) if a.material_map else None,a.max_texture,not a.no_y_up,a.max_fps,a.keep)
    print(json.dumps({'output':r['output'],'bytes':r['bytes'],'joints':r['joints'],'animations':len(r['animations']),'repairs':r['repairs']}))
