"""Original distribution family only. Blender 4.0+, no accepted asset writes.
Local X east, Y toward back, Z up; south uses a proper half-turn at placement.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
HEIGHTS = {'north': 1.5, 'south': 1.0}

def reset():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)

def mat(name, v):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (v,v,v,1)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = m.diffuse_color
    b.inputs['Roughness'].default_value = .72
    return m

def box(name, p, size, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=p)
    o = bpy.context.object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    return o

def rod(name, a, b, radius, material):
    a,b = Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=(b-a).length, location=(a+b)/2)
    o=bpy.context.object
    o.name=name
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    o.data.materials.append(material)
    return o

def author(variant):
    # Identical plate gauges and pump diameters in both variants, never Z scaling.
    h=HEIGHTS[variant]
    clay=mat(variant+'_neutral_shell',.48)
    dark=mat(variant+'_neutral_gasket',.19)
    inside=mat(variant+'_neutral_mechanism',.32)
    parts=[]
    def B(n,p,s,m=clay):
        o=box(n,p,s,m); parts.append(o); return o
    def R(n,a,b,r,m=inside):
        o=rod(n,a,b,r,m); parts.append(o); return o
    B('deck_plinth',(0,0,.06),(18.75,2.5,.12),dark)
    B('back_wall',(0,1.21,(h+.12)/2),(18.75,.08,h-.12))
    B('roof',(0,0,h-.04),(18.75,2.5,.08))
    for x in [-9.335,9.335]:
        B('end_'+str(x),(x,0,(h+.12)/2),(.08,2.5,h-.12))
    # Rear twin headers are completely enclosed; deck branches are deferred.
    for z in [.32,.56]:
        R('header_'+str(z),(-9.2,.82,z),(9.2,.82,z),.055)
    for i in range(6):
        x=-7.8125+i*3.125
        # Continuous closed front, removable plates seated against perimeter rails.
        B(f'panel_{i}',(x,-1.19,(h+.12)/2),(3.125,.08,h-.12))
        for dx in [-1.51,1.51]:
            B(f'gasket_{i}_{dx}',(x+dx,-1.235,(h+.16)/2),(.025,.01,h-.24),dark)
        for dx in [-1.25,1.25]:
            for z in [.23,h-.16]:
                R(f'latch_{i}_{dx}_{z}',(x+dx,-1.23,z),(x+dx,-1.25,z),.042,dark)
        B(f'handle_{i}',(x,-1.242,h-.26),(.40,.016,.055),dark)
        # Runners land directly on continuous plinth.
        B(f'skid_{i}',(x,0,.16),(2.55,1.8,.08),inside)
        if i%2==0:
            # Horizontal motor and pump volute, same geometry at both heights.
            B(f'pump_foot_{i}',(x-.5,-.1,.25),(.8,.6,.1),inside)
            R(f'motor_{i}',(x-.8,-.1,.46),(x-.15,-.1,.46),.16)
            R(f'pump_volute_{i}',(x-.15,-.1,.46),(x+.10,-.1,.46),.25)
            R(f'pump_inlet_{i}',(x+.10,-.1,.46),(x+.48,-.1,.46),.065)
            R(f'inlet_drop_{i}',(x+.48,-.1,.46),(x+.48,-.1,.32),.065)
            R(f'inlet_branch_{i}',(x+.48,-.1,.32),(x+.48,.82,.32),.055)
            R(f'outlet_rise_{i}',(x-.02,-.1,.46),(x-.02,-.1,.56),.065)
            R(f'outlet_branch_{i}',(x-.02,-.1,.56),(x-.02,.82,.56),.055)
        else:
            # North upright plate pack; south has a shorter wider pack, with
            # unchanged plate gauge, tie rods, header bore and plinth thickness.
            ph,pw=(.88,1.0) if variant=='north' else (.48,1.50)
            for j in range(12):
                B(f'exchanger_plate_{i}_{j}',(x,-.45+j*.075,.20+ph/2),(pw,.035,ph),inside)
            for y in [-.51,.43]:
                B(f'exchanger_frame_{i}_{y}',(x,y,.20+ph/2),(pw+.12,.08,ph+.04))
            for dx in [-pw/2,pw/2]:
                for z in [.26,.14+ph]:
                    R(f'tie_rod_{i}_{dx}_{z}',(x+dx,-.58,z),(x+dx,.5,z),.022)
            for dx,z in [(-.25,.32),(.25,.56)]:
                R(f'exchanger_port_{i}_{z}',(x+dx,.43,z),(x+dx,.82,z),.055)
    bpy.context.view_layer.update()
    return parts

def vertices(parts):
    return [o.matrix_world@v.co for o in parts for v in o.data.vertices]

def bounds(parts):
    p=vertices(parts)
    return [[min(v[i] for v in p) for i in range(3)],[max(v[i] for v in p) for i in range(3)]]

def tree(o):
    return BVHTree.FromPolygons(vertices([o]),[list(p.vertices) for p in o.data.polygons])

def validate(parts,variant):
    bpy.context.view_layer.update()
    h=HEIGHTS[variant]
    names={o.name:o for o in parts}
    assert len(names)==len(parts) and parts,'inventory'
    for n in ['deck_plinth','back_wall','roof',*[f'panel_{i}' for i in range(6)],*[f'handle_{i}' for i in range(6)]]:
        assert n in names,'inventory '+n
    actual=bounds(parts)
    expected=[[-9.375,-1.25,0],[9.375,1.25,h]]
    assert all(abs(actual[k][i]-expected[k][i])<1e-5 for k in range(2) for i in range(3)),'bounds'
    tris=0
    for o in parts:
        assert all(math.isfinite(c) for p in vertices([o]) for c in p),'finite'
        assert all(abs(s-1)<1e-5 for s in o.scale),'unbaked scale'
        bm=bmesh.new(); bm.from_mesh(o.data)
        # glTF splits vertices at hard normals: weld before manifold checks.
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
        assert all(e.is_manifold for e in bm.edges) and bm.calc_volume(signed=True)>0,'closed topology '+o.name
        bm.free(); o.data.calc_loop_triangles(); tris+=len(o.data.loop_triangles)
    trees={o.name:tree(o) for o in parts}
    def ray(n,p,d):
        q,_,_,_=trees[n].ray_cast(Vector(p),Vector(d))
        assert q is not None,'missing surface '+n
        return q
    support=back=sealed=exposure=0
    for x in [-9.37,-7.8125,-4.6875,-1.5625,1.5625,4.6875,7.8125,9.37]:
        for y in [-1.245,0,1.245]:
            assert abs(ray('deck_plinth',(x,y,-1),(0,0,1)).z)<1e-5,'deck gap'
            assert abs(ray('deck_plinth',(x,y,2),(0,0,-1)).z-.12)<1e-5,'deck top'
            support+=1
        for z in [.13,h/2,h-.09]:
            assert abs(ray('back_wall',(x,2,z),(0,-1,0)).y-1.25)<1e-5,'back wall gap'
            back+=1
    for i in range(6):
        x=-7.8125+i*3.125
        for dx in [-1.56,0,1.56]:
            for z in [.121,h/2,h-.081]:
                assert abs(ray(f'panel_{i}',(x+dx,-2,z),(0,1,0)).y+1.23)<1e-5,'sealed front'
                sealed+=1
        for name in [f'handle_{i}',*[n for n in names if n.startswith(f'latch_{i}_')]]:
            lo,hi=bounds([names[name]])
            p=Vector(((lo[0]+hi[0])/2,-2,(lo[2]+hi[2])/2))
            hits=[]
            for n,t in trees.items():
                q,_,_,dist=t.ray_cast(p,Vector((0,1,0)))
                if q is not None: hits.append((dist,n))
            assert min(hits)[1]==name,'buried service fitting '+name
            exposure+=1
        a=ray('deck_plinth',(x,0,2),(0,0,-1))
        b=ray(f'skid_{i}',(x,0,-1),(0,0,1))
        assert abs(a.z-b.z)<1e-5,'skid support gap'
    return dict(bounds_blender_m=actual,mesh_objects=len(parts),triangles=tris,deck_probes=support,back_probes=back,closed_front_probes=sealed,exposed_fittings=exposure)

def export(path,parts):
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_extras=False,export_cameras=False,export_lights=False)

def load(path):
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    return [o for o in bpy.data.objects if o not in before and o.type=='MESH']

def render(path,parts,pos,target,scale,title):
    for o in bpy.data.objects:
        if o.type=='MESH':o.hide_render=o not in parts
    scene=bpy.context.scene
    scene.render.engine='CYCLES'; scene.cycles.device='CPU'; scene.cycles.samples=16; scene.cycles.seed=0; scene.cycles.use_denoising=False
    scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.world.color=(.25,.25,.25)
    bpy.ops.object.camera_add(location=pos);camera=bpy.context.object
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=scale;scene.camera=camera
    extras=[camera]
    for p,power,size in [((0,-8,12),3500,12),((-10,4,8),2200,10)]:
        bpy.ops.object.light_add(type='AREA',location=Vector(target)+Vector(p));o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();extras.append(o)
    bpy.context.view_layer.update()
    curve=bpy.data.curves.new('source_label','FONT');curve.body=title;curve.size=scale*.016
    text=bpy.data.objects.new('source_label',curve);bpy.context.collection.objects.link(text);text.matrix_world=camera.matrix_world.copy();text.location=camera.matrix_world@Vector((-scale*.47,scale*.285,-3))
    m=mat('label',.9);bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(.9,.9,.9,1);bs.inputs['Emission Strength'].default_value=1;curve.materials.append(m);extras.append(text)
    scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)
    for o in extras:bpy.data.objects.remove(o,do_unlink=True)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output-root',type=Path,default=ROOT)
    args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    root=args.output_root.resolve();out=root/'tools/assets/passenger-vault/distribution';public=root/'public/assets/passenger-vault'
    out.mkdir(parents=True,exist_ok=True);public.mkdir(parents=True,exist_ok=True)
    bpy.context.preferences.filepaths.save_version=0
    report={}
    for variant in HEIGHTS:
        reset();parts=author(variant);validate(parts,variant)
        bpy.ops.wm.save_as_mainfile(filepath=str(out/f'{variant}.blend'))
        path=public/f'distribution-{variant}.glb';export(path,parts)
        reset();parts=load(path);report[variant]=validate(parts,variant)
        render(out/f'{variant}-closed.png',parts,(12,-18,11),(0,0,.5),22,f'SOURCE-ONLY | {variant} distribution | neutral GLB roundtrip')
        cut=[o for o in parts if not (o.name=='roof' or o.name.startswith(('panel_','handle_','latch_','gasket_')))]
        render(out/f'{variant}-cutaway.png',cut,(5,-9,7),(0,0,.5),21,f'SOURCE-ONLY | {variant} cutaway | roof and removable faces hidden')
    # Read-only reuse of the accepted complete-row fixture, never run its writer.
    sys.path.insert(0,str(HERE));import room_fit
    room=room_fit.assemble(root);prior=room_fit.validate(room)
    context=[o for o in bpy.data.objects if o.type=='MESH']
    neutral=mat('source_room_clay',.32)
    context.append(box('SOURCE_deck',(18.75,-13.75,-.08),(35,25,.16),neutral))
    for variant,y in [('north',80),('south',800)]:
        parts=load(public/f'distribution-{variant}.glb')
        mount=Matrix.Translation((600/32,-y/32,0))@Matrix.Rotation(math.pi if variant=='south' else 0,4,'Z')
        for o in parts:o.matrix_world=mount@o.matrix_world
        bpy.context.view_layer.update()
        b=bounds(parts);game=[b[0][0]*32,-b[1][1]*32,b[1][0]*32,-b[0][1]*32]
        expected=[300,40,900,120] if variant=='north' else [300,760,900,840]
        assert all(abs(a-b)<.001 for a,b in zip(game,expected)),'installed bounds'
        report[variant]['installed_bounds_game']=game;context+=parts
    for y in [-1.125,-26.375]:context.append(box('SOURCE_wall',(18.75,y,.6),(35,.25,1.2),neutral))
    for y,h in [(280,1.25),(600,1)]:context.append(box('SOURCE_monitor_placeholder',(1100/32,-y/32,h/2),(3.75,2.5,h),neutral))
    render(out/'room-placement.png',context,(32,-43,37),(18.75,-13.75,0),46,'SOURCE-ONLY | installed pair + accepted rows | consoles remain placeholders')
    report['room_context']={'carriers':prior['carriers'],'chambers':prior['chambers'],'routes':prior['access']['route_segments']}
    files=[*sorted(public.glob('distribution-*.glb')),*sorted(out.glob('*.png')),*sorted(out.glob('*.blend'))]
    manifest={'schema':1,'gate':'source-only geometry candidate; independent review pending','blender':bpy.app.version_string,'validation':report,'files':{str(p.relative_to(root)):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in files}}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('DISTRIBUTION_VERIFIED '+json.dumps(report))

if __name__=='__main__':main()
