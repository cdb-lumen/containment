"""Geometry-locked material separation, causal contact wear and cold seal frost.
Four per-part colour atlases and three metallic/roughness pairs.
Graphics and their UVs remain untouched. No normal bake.
"""
import numpy as np
import bpy, math, runpy, pathlib
wear=runpy.run_path(str(pathlib.Path(__file__).with_name("cryo-causal-wear.py")))["wear"]

def surface_textures(asset, out):
 result=[]
 settings={'01':((.40,.46,.43),.0,.48),'02':((.022,.038,.042),.05,.62),'03':((.26,.30,.32),.88,.30),'04':((.006,.009,.010),0,.91)}
 for prefix,(base,metal,roughness) in settings.items():
  parts=sorted([o for o in asset if o.type=='MESH' and o.active_material.name.startswith(prefix)],key=lambda o:o.name)
  material=parts[0].active_material;nodes=material.node_tree.nodes;links=material.node_tree.links;p=nodes.get('Principled BSDF')
  for node in list(nodes):
   if node.type not in ['BSDF_PRINCIPLED','OUTPUT_MATERIAL']:nodes.remove(node)
  p.inputs['Base Color'].default_value=(*base,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=roughness
  size=1024 if prefix=='01' else 512;grid=math.ceil(math.sqrt(len(parts)));tile=size//grid
  color=np.ones((size,size,4),dtype=np.float32);color[:,:,:3]=base
  rough=np.ones((size,size,4),dtype=np.float32);rough[:,:,:3]=roughness
  metallic=np.ones((size,size,4),dtype=np.float32);metallic[:,:,:3]=metal
  for index,o in enumerate(parts):
   x=(index%grid)*tile;y=(index//grid)*tile
   yy,xx=np.mgrid[0:tile,0:tile];u=xx/(tile-1);v=yy/(tile-1)
   c=np.empty((tile,tile,3),dtype=np.float32);c[:]=base
   if prefix=='01':
    # A replaceable head-end cover reads as a separate painted component.
    if o.name=='Head end protective crown':c[:]=(.19,.27,.265)
    if o.name=='Recessed formed crown':c[:]=(.33,.40,.375)
   if prefix=='03':
    # Broad satin response rather than subpixel random normals.
    polish=.035*np.cos(v*math.pi*2)
    rough[y:y+tile,x:x+tile,:3]=(roughness+polish)[:,:,None]
   if prefix=='04' and o.name=='Continuous black pressure gasket':
    # Project this seal only in local XY: cold bloom at service-end corners.
    coords=[vert.co for vert in o.data.vertices];xmin=min(q.x for q in coords);xmax=max(q.x for q in coords);ymin=min(q.y for q in coords);ymax=max(q.y for q in coords)
    for loop in o.data.loops:
     q=o.data.vertices[loop.vertex_index].co;o.data.uv_layers.active.data[loop.index].uv=((q.x-xmin)/(xmax-xmin),(q.y-ymin)/(ymax-ymin))
    frost=np.clip((v-.68)/.23,0,1)*np.clip((abs(u-.5)-.22)/.20,0,1)
    frost*=.78+.22*np.sin(u*53+np.sin(v*31))*np.sin(v*69)
    c=c*(1-frost[:,:,None])+np.array([.38,.48,.48])*frost[:,:,None]
   wear(o,c,rough[y:y+tile,x:x+tile,:3],metallic[y:y+tile,x:x+tile,:3])
   color[y:y+tile,x:x+tile,:3]=c
   for loop in o.data.uv_layers.active.data:loop.uv=((x+2+loop.uv.x*(tile-4))/size,(y+2+loop.uv.y*(tile-4))/size)
  def image(kind,pixels):
   name='cryo-surface-'+prefix+'-'+kind
   if kind=='color':
    pixels=pixels.copy();c=pixels[:,:,:3];pixels[:,:,:3]=np.where(c<=.0031308,12.92*c,1.055*np.power(c,1/2.4)-.055)
   im=bpy.data.images.new(name,width=size,height=size,alpha=True);im.colorspace_settings.name='sRGB' if kind=='color' else 'Non-Color';im.pixels.foreach_set(pixels.ravel());im.filepath_raw=str(out/(name+'.png'));im.file_format='PNG';im.save();im.pack()
   t=nodes.new('ShaderNodeTexImage');t.image=im;t.interpolation='Linear';return t
  links.new(image('color',color).outputs['Color'],p.inputs['Base Color'])
  if prefix in ['01','02','03']:
   links.new(image('roughness',rough).outputs['Color'],p.inputs['Roughness'])
   links.new(image('metallic',metallic).outputs['Color'],p.inputs['Metallic'])
  result.append({'material':material.name,'parts':len(parts),'atlasSize':size,'normalMap':False})
 # Remove orphaned legacy source images from the editable file.
 for im in list(bpy.data.images):
  if im.users==0:bpy.data.images.remove(im)
 return result
