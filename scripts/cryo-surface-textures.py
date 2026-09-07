"""Original deterministic image-backed surface atlases. Run inside build-sealed-cryo.py.
Not a high-poly bake: analytic tangent micro-normal and roughness maps.
Per-part atlas tiles retain the existing UV islands and geometry. Border fade
keeps micro-detail quiet at island boundaries; medical graphics are untouched.
"""
import numpy as np
import bpy, math

def surface_textures(asset, out):
 rng=np.random.default_rng(8008)
 result=[]
 for prefix,base,amplitude in [('01',.61,.025),('02',.48,.017),('03',.66,.012),('04',.84,.009)]:
  parts=sorted([o for o in asset if o.type=='MESH' and o.active_material.name.startswith(prefix)],key=lambda o:o.name)
  if not parts:continue
  material=parts[0].active_material
  size=1024 if prefix=='01' else 512;grid=math.ceil(math.sqrt(len(parts)));tile=size//grid
  rough=np.full((size,size,4),1.,dtype=np.float32);rough[:,:,:3]=base
  normal=np.ones((size,size,4),dtype=np.float32);normal[:,:,:3]=(.5,.5,1.)
  color=np.ones((size,size,4),dtype=np.float32);color[:,:,:3]=(.013,.023,.026)
  for index,o in enumerate(parts):
   x=(index%grid)*tile;y=(index//grid)*tile
   # Retain orientation of the original UV islands. No geometry mutation.
   for loop in o.data.uv_layers.active.data:
    loop.uv=((x+4+loop.uv.x*(tile-8))/size,(y+4+loop.uv.y*(tile-8))/size)
   yy,xx=np.mgrid[0:tile,0:tile];u=xx/tile;v=yy/tile
   grain=rng.normal(0,1,(tile,tile))
   slow=np.sin(u*math.tau*2+.8)*np.cos(v*math.tau*3+.3)
   handling=prefix=='03' and any(s in o.name.lower() for s in ['latch','union','socket'])
   # Only handled hardware gets mild polish. No dirt or scratch colour pass.
   polish=(.06*(.5+.5*np.sin(v*math.pi)) if handling else 0)
   panel=(rng.uniform(-.018,.018) if prefix in ['01','02'] else 0)
   r=np.clip(base+panel+.009*grain+.012*slow-polish,0,1)
   rough[y:y+tile,x:x+tile,:3]=r[:,:,None]
   fade=np.minimum(1,np.minimum.reduce([xx,yy,tile-1-xx,tile-1-yy])/8)
   nx=amplitude*grain*fade;ny=amplitude*rng.normal(0,1,(tile,tile))*fade
   nz=np.sqrt(1-nx*nx-ny*ny)
   normal[y:y+tile,x:x+tile,:3]=np.stack((nx*.5+.5,ny*.5+.5,nz*.5+.5),axis=-1)
   if prefix=='04' and o.name=='Continuous black pressure gasket':
    # Trace condensation, only on the cold pressure seal, not mounts/reveals.
    frost=np.clip((slow-.40)*.075,0,.04)
    color[y:y+tile,x:x+tile,:3]+=frost[:,:,None]*np.array([.55,.67,.68])
    rough[y:y+tile,x:x+tile,:3]+=frost[:,:,None]
  def image(kind,pixels):
   name='cryo-surface-'+prefix+'-'+kind
   im=bpy.data.images.new(name,width=size,height=size,alpha=True)
   if kind=='seal-color':
    # glTF base colour is sRGB, unlike roughness/normal channels.
    pixels=pixels.copy();c=pixels[:,:,:3];pixels[:,:,:3]=np.where(c<=.0031308,12.92*c,1.055*np.power(c,1/2.4)-.055)
   im.colorspace_settings.name='sRGB' if kind=='seal-color' else 'Non-Color';im.pixels.foreach_set(pixels.ravel());im.filepath_raw=str(out/(name+'.png'));im.file_format='PNG';im.save();im.pack()
   t=material.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;t.label=kind+' / per-part atlas';t.interpolation='Linear'
   return t
  nodes=material.node_tree.nodes;links=material.node_tree.links;p=nodes.get('Principled BSDF')
  for link in list(p.inputs['Roughness'].links):links.remove(link)
  links.new(image('roughness',rough).outputs['Color'],p.inputs['Roughness'])
  nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=1
  links.new(image('normal',normal).outputs['Color'],nm.inputs['Color']);links.new(nm.outputs['Normal'],p.inputs['Normal'])
  if prefix=='04':links.new(image('seal-color',color).outputs['Color'],p.inputs['Base Color'])
  result.append({'material':material.name,'parts':len(parts),'tilePixels':tile,'normalType':'analytic tangent micro-normal, not high-poly baked','handlingOnly':prefix=='03'})
 return result
