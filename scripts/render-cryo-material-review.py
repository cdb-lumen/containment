import bpy, math, pathlib, sys
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
args=sys.argv[sys.argv.index('--')+1:]
glb=pathlib.Path(args[0]);E=pathlib.Path(args[1]);E.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(glb))
def mat(n,c,metal=0,rough=.4):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
def finish(o,n,m):
 o.name=n;o.data.materials.append(m);return o
def box(n,p,s,m,r=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.dimensions=s;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if r:
  b=o.modifiers.new('Tool radius','BEVEL');b.width=r;b.segments=4;bpy.ops.object.modifier_apply(modifier=b.name)
  for p in o.data.polygons:p.use_smooth=True
  o.data.use_auto_smooth=True;b=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');b.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=b.name)
 return finish(o,n,m)
box('Studio floor',(0,0,-.065),(200,200,.1),mat('studio',(.055,.069,.08),0,.7),0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=128;scene.cycles.use_denoising=False;scene.render.resolution_x=1000;scene.render.resolution_y=770;scene.render.resolution_percentage=100
scene.world.color=(.18,.18,.18)
def light(n,p,power,size):
 bpy.ops.object.light_add(type='AREA',location=p);o=bpy.context.object;o.name=n;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.3))-o.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox',(-3,-4,6),650,4);light('Rim',(2,3,4),800,3);light('Fill',(4,-1,2),180,3)
bpy.ops.object.camera_add(location=(2.65,-3.5,3.05));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.32))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.7;scene.camera=cam
scene.render.filepath=str(E/'studio-closeup.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=2.5;cam.location=(2.5,3.5,2.2);cam.rotation_euler=(Vector((0,.70,.32))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(E/'studio-service.png');bpy.ops.render.render(write_still=True)
