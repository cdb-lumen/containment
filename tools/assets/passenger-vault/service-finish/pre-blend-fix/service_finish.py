"""Original Passenger Vault flush finish kit, CC0, deterministic Blender source.
No prior asset imports or writes. Room origin: Blender (x/32,-y/32,h/32),
glTF (x/32,h/32,y/32). This is a zero-thickness seam/marking layer, not pipes,
a floor replacement, collision geometry, or a runtime integration.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]

def reset():
    for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)

def material(name,value):
    m=bpy.data.materials.new(name);m.diffuse_color=(value,value,value,1)
    m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=m.diffuse_color
    bs.inputs['Roughness'].default_value=.8
    return m

def panel(name,rect,mats):
    """Tiled, single-owned planar faces; seams are color, never grooves.
    Transverse removable-cover joints at <=32 game units, 1 nominal metre.
    """
    x0,y0,x1,y1=rect
    vertical=(y1-y0)>(x1-x0)
    short=(x0,x1) if vertical else (y0,y1)
    long=(y0,y1) if vertical else (x0,x1)
    short_cuts=[short[0],short[0]+.35,short[1]-.35,short[1]]
    count=math.ceil((long[1]-long[0])/32)
    long_cuts=[long[0]]
    for i in range(1,count):
        p=long[0]+i*(long[1]-long[0])/count
        long_cuts.extend([p-.175,p+.175])
    long_cuts.append(long[1])
    xs,ys=(short_cuts,long_cuts) if vertical else (long_cuts,short_cuts)
    vertices=[(x/32,-y/32,0) for y in ys for x in xs]
    faces=[];indices=[]
    for j in range(len(ys)-1):
        for i in range(len(xs)-1):
            a=j*len(xs)+i;b=a+1;d=a+len(xs);c=d+1
            faces.append((a,d,c,b))
            s=i if vertical else j;l=j if vertical else i
            indices.append(0 if s in (0,2) or l%2==1 else 1)
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    for m in mats:mesh.materials.append(m)
    for p,i in zip(mesh.polygons,indices):p.material_index=i
    return o

def author():
    mats=[material('neutral_panel_seam',.13),material('neutral_cover_marking',.48)]
    parts=[]
    for name,x in [('A',420),('B',780),('C',420),('D4',780)]:
        north=name in ('A','B')
        parts.append(panel('feed_'+name,(x-2,120 if north else 632,x+2,248 if north else 760),mats))
        parts.append(panel('neck_'+name,(x-2,102 if north else 760,x+2,120 if north else 778),mats))
    for name,y in [('north',100),('south',780)]:parts.append(panel('header_'+name,(418,y-2,1162,y+2),mats))
    for name,y in [('north',280),('south',600)]:parts.append(panel('console_'+name,(1160,y-2,1162,y+2),mats))
    parts.append(panel('wall_channel',(1162,98,1166,782),mats))
    return parts

def context_rectangle(name,rect,height,mat):
    x0,y0,x1,y1=rect
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(x0/32,-y0/32,height),(x0/32,-y1/32,height),(x1/32,-y1/32,height),(x1/32,-y0/32,height)],[],[(0,1,2,3)])
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);mesh.materials.append(mat)
    return o

def render(path,oblique):
    scene=bpy.context.scene
    # CPU Cycles avoids unavailable EGL on headless hosts. Flat neutral emission
    # is render-only, applied AFTER GLB export/import, not a material finish gate.
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=4
    scene.cycles.seed=0;scene.cycles.use_denoising=False
    for m in bpy.data.materials:
        if not m.use_nodes:continue
        nodes=m.node_tree.nodes;nodes.clear()
        emission=nodes.new('ShaderNodeEmission');emission.inputs['Color'].default_value=m.diffuse_color
        output=nodes.new('ShaderNodeOutputMaterial');m.node_tree.links.new(emission.outputs[0],output.inputs['Surface'])
    scene.world.color=(.08,.08,.08)
    scene.view_settings.view_transform='Standard'
    scene.render.resolution_x=1200;scene.render.resolution_y=880;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    target=Vector((18.75,-13.75,0))
    bpy.ops.object.camera_add(location=target+Vector((12,-22,34) if oblique else (0,0,50)))
    cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=54 if oblique else 39;scene.camera=cam
    scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam,do_unlink=True)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output-root',type=Path,default=ROOT)
    args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    root=args.output_root.resolve();out=root/'tools/assets/passenger-vault/service-finish';public=root/'public/assets/passenger-vault'
    out.mkdir(parents=True,exist_ok=True);public.mkdir(parents=True,exist_ok=True)
    reset();parts=author()
    bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    asset=public/'service-finish.glb'
    bpy.ops.export_scene.gltf(filepath=str(asset),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=False)
    reset();bpy.ops.import_scene.gltf(filepath=str(asset))
    parts=[o for o in bpy.data.objects if o.type=='MESH']
    sys.path.insert(0,str(HERE));from test_service_finish import validate
    report=validate(parts)
    # Diagram context only: eight flat reservation silhouettes below the kit.
    # No existing room/equipment is altered or passed off as imported geometry.
    floor=material('CONTEXT_floor',.25);solid=material('CONTEXT_solid_reservation',.34);wall=material('CONTEXT_wall_footprint',.17)
    context_rectangle('CONTEXT_camera_envelope',(0,0,1200,880),-.004,wall)
    context_rectangle('CONTEXT_floor_40_1160_40_840',(40,40,1160,840),-.003,floor)
    for n,r in [('A',(320,240,520,360)),('B',(680,240,880,360)),('C',(320,520,520,640)),('D4',(680,520,880,640)),('SN',(300,40,900,120)),('SS',(300,760,900,840)),('MN',(1040,240,1160,320)),('MS',(1040,560,1160,640))]:
        context_rectangle('CONTEXT_reservation_'+n,r,-.002,solid)
    render(out/'top.png',False);render(out/'oblique.png',True)
    files=[asset,out/'top.png',out/'oblique.png']
    manifest={'schema':1,'gate':'source-only flush construction; independent review pending','license':'CC0-1.0, original procedural geometry; no external inputs','blender':bpy.app.version_string,'coordinates':{'origin':'room origin, not centred','blender':'x/32,-game_y/32,height/32','gltf':'x/32,height/32,game_y/32'},'geometry':report,'scope':'zero-thickness planar cover markings and seams only; no pipes, holes, new collision or runtime changes','context':'PNG-only flat eight-solid reservation silhouettes below kit, not equipment meshes. East wall footprint exposed to show channel inside wall. No hidden pipes are asserted.','surface_integration':'Future renderer must resolve coplanar floor markings with a decal/merge strategy; no epsilon height or floor cut introduced here.','files':{str(p.relative_to(root)):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in files},'sources':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__),HERE/'test_service_finish.py']}}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('SERVICE_FINISH_BUILT '+json.dumps(report,sort_keys=True))

if __name__=='__main__':main()
