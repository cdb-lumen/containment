"""Original west-facing monitoring pair. Neutral construction, no runtime writes."""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector, Matrix
sys.path.insert(0,str(Path(__file__).resolve().parent))
from distribution import reset, mat, box, rod, vertices, bounds, tree, export, load, render
import room_fit
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
HEIGHTS={'north':1.25,'south':1.0}
NAMES={'service_sill','service_mullion','support_shelf','deck_plinth','back_wall','side_north','side_south','central_bulkhead','service_worktop','instrument_wedge','operating_display','display_bezel','rear_service_cover','instrument_cheek_north','instrument_cheek_south',*[f'{p}_{i}' for p in ['service_panel','latch','panel_seam','electronics_tray','electronics_pack'] for i in range(2)]}

def wedge(name,x0,x1,y0,y1,z0,z1,thickness,material,bottom=None):
    # Constant vertical gauge, rising eastward toward the wall.
    v=[(x0,y0,z0-thickness),(x1,y0,z1-thickness),(x1,y1,z1-thickness),(x0,y1,z0-thickness),(x0,y0,z0),(x1,y0,z1),(x1,y1,z1),(x0,y1,z0)]
    if bottom is not None:v[:4]=[(x,y,bottom) for x,y,z in v[:4]]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);mesh.materials.append(material);return o

def cell_mesh(name, axes, occupied, material):
    # Boundary of occupied rectangular cells, shared interior faces omitted.
    vertices0=[]; faces=[]; index={}
    for cell in sorted(occupied):
        for axis in range(3):
            for sign in [-1,1]:
                neighbor=list(cell);neighbor[axis]+=sign
                if tuple(neighbor) in occupied:continue
                other=[a for a in range(3) if a!=axis]
                corners=[]
                for u,v in [(0,0),(1,0),(1,1),(0,1)]:
                    q=list(cell);q[axis]+=sign==1;q[other[0]]+=u;q[other[1]]+=v
                    xyz=tuple(axes[a][q[a]] for a in range(3))
                    if xyz not in index:index[xyz]=len(vertices0);vertices0.append(xyz)
                    corners.append(index[xyz])
                normal=1 if axis in [0,2] else -1
                faces.append(corners if normal==sign else corners[::-1])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices0,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);mesh.materials.append(material);return o


def hollow_panel(name,y,top,material):
    axes=[[-1.85,-1.848,-1.812,-1.81],[y-.555,y-.553,y+.553,y+.555],[.21,.212,top-.012,top-.01]]
    return cell_mesh(name,axes,{(x,y,z) for x in range(3) for y in range(3) for z in range(3) if (x,y,z)!=(1,1,1)},material)


def front_fitting(name,y,z,material):
    # Open pull/release loop, 56x31mm aperture, 20mm under-bar space.
    axes=[[-1.875,-1.869,-1.849],[y-.04,y-.028,y+.028,y+.04],[z-.0275,z-.0155,z+.0155,z+.0275]]
    cells={(x,y,z) for x in range(2) for y in range(3) for z in range(3) if y!=1 or (x==0 and z!=1)}
    return cell_mesh(name,axes,cells,material)


def author(variant):
    h=HEIGHTS[variant];top=h-.32
    shell=mat('neutral_shell',.48);seal=mat('neutral_gasket',.16);inside=mat('neutral_mechanism',.3)
    p=[]
    def B(n,c,s,m=shell):p.append(box(n,c,s,m))
    B('deck_plinth',(0,0,.06),(3.75,2.5,.12),seal)
    B('back_wall',(1.835,0,(top+.12)/2),(.08,2.5,top-.12))
    for n,y in [('north',1.21),('south',-1.21)]:B('side_'+n,(-.04,y,(top+.12)/2),(3.67,.08,top-.12))
    B('central_bulkhead',(.065,0,(top+.12)/2),(3.47,.08,top-.12),inside)
    B('service_sill',(-1.83,0,.16),(.04,2.34,.08))
    B('support_shelf',(-1.765,0,.205),(.15,2.34,.01),inside)
    B('service_mullion',(-1.83,0,(top+.21)/2),(.04,.08,top-.21))
    B('service_worktop',(0,0,top+.04),(3.75,2.5,.08))
    # Broad wedge is structurally seated on the worktop, with a closed back.
    p.append(wedge('instrument_wedge',-1.875,-.95,-1.13,1.13,top+.12,h-.04,.04,shell))
    # Instrument bed has a shallow slope and maintains the same gauges south.
    slope=(h-.04-(top+.12))/.925
    z=lambda x:top+.12+(x+1.875)*slope
    p.append(wedge('rear_service_cover',-1.03,-.95,-1.13,1.13,z(-1.03)-.04,z(-.95)-.04,.04,shell,bottom=top+.08))
    for name,y0,y1 in [('north',1.09,1.13),('south',-1.13,-1.09)]:
        p.append(wedge('instrument_cheek_'+name,-1.87,-1.03,y0,y1,z(-1.87)-.04,z(-1.03)-.04,.04,shell,bottom=top+.08))
    p.append(wedge('display_bezel',-1.80,-1.08,-1.05,1.05,z(-1.80)+.018,z(-1.08)+.018,.018,seal))
    p.append(wedge('operating_display',-1.75,-1.15,-.94,.94,z(-1.75)+.030,z(-1.15)+.030,.012,inside))
    for i,y in enumerate([-.605,.605]):
        p.append(hollow_panel(f'service_panel_{i}',y,top,shell))
        B(f'panel_seam_{i}',(-1.855,y-.53,(top+.20)/2),(.012,.018,top-.26),seal)
        p.append(front_fitting(f'latch_{i}',-1.06 if i==0 else 1.06,top-.16,seal))
        B(f'electronics_tray_{i}',(-1.1,y,.16),(1.4,1.04,.08),inside)
        # South uses a lower electronics enclosure, not a transform squash.
        ph=.36 if variant=='north' else .22
        B(f'electronics_pack_{i}',(-1.4,y,.20+ph/2),(.5,.8,ph),inside)
    bpy.context.view_layer.update();return p

def validate(parts,variant):
    bpy.context.view_layer.update();h=HEIGHTS[variant];top=h-.32
    n={o.name:o for o in parts}
    assert len(parts)==len(NAMES) and set(n)==NAMES,'exact inventory'
    b=bounds(parts);expected=[[-1.875,-1.25,0],[1.875,1.25,h-.04]]
    # Rear edge of wedge sets height; broad low profile remains below cap.
    assert all(abs(b[k][i]-expected[k][i])<1e-5 for k in range(2) for i in range(3)),'envelope or scale mismatch'
    triangles=0
    for o in parts:
        assert all(abs(s-1)<1e-5 for s in o.scale),'unbaked scale'
        assert all(math.isfinite(c) for v in vertices([o]) for c in v),'finite'
        bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
        assert all(e.is_manifold for e in bm.edges) and bm.calc_volume(signed=True)>0,'closed mesh '+o.name
        bm.free();o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
    trees={name:tree(o) for name,o in n.items()}
    def ray(name,p,d):
        q,_,_,_=trees[name].ray_cast(Vector(p),Vector(d));assert q is not None,'missing surface '+name;return q
    def first(name,p,d):
        hits=[]
        for key,t in trees.items():
            q,_,_,dist=t.ray_cast(Vector(p),Vector(d))
            if q is not None:hits.append((dist,key))
        assert hits and min(hits)[1]==name,'buried fitting '+name
    deck=contacts=exposed=closed=0
    for name,y,direction in [('north',2,-1),('south',-2,1)]:
        for x in [-1.75,-1.4,-1.1]:
            z0=top+.08+(x+1.875)*(.16/.925)/2
            assert abs(abs(ray('instrument_cheek_'+name,(x,y,z0),(0,direction,0)).y)-1.13)<1e-5,'open instrument side'
    for x in [-1.86,0,1.86]:
        for y in [-1.24,0,1.24]:
            assert abs(ray('deck_plinth',(x,y,-1),(0,0,1)).z)<1e-5,'floating base';deck+=1
    for name,x,y in [('side_north',0,1.21),('side_south',0,-1.21),('central_bulkhead',0,0),('back_wall',1.835,0)]:
        a=ray('deck_plinth',(x,y,2),(0,0,-1));b0=ray(name,(x,y,-1),(0,0,1));b1=ray(name,(x,y,2),(0,0,-1));c=ray('service_worktop',(x,y,-1),(0,0,1))
        assert abs(a.z-b0.z)<1e-5 and abs(b1.z-c.z)<1e-5,'support contact '+name;contacts+=2
    for i,y in enumerate([-.605,.605]):
        for z0 in [.23,(top+.21)/2,top-.03]:
            for dy in [-.53,0,.53]:
                assert abs(ray(f'service_panel_{i}',(-3,y+dy,z0),(1,0,0)).x+1.85)<1e-5,'closed service face';closed+=1
        first(f'latch_{i}',(-3,(-1.06 if i==0 else 1.06)-.034,top-.16),(1,0,0));exposed+=1
        a=ray('deck_plinth',(-1.4,y,2),(0,0,-1));b0=ray(f'electronics_tray_{i}',(-1.4,y,-1),(0,0,1))
        assert abs(a.z-b0.z)<1e-5,'tray support';contacts+=1
    slope=.16/.925
    for x in [-1.7,-1.45,-1.2]:
        for y in [-.85,0,.85]:
            z0=top+.12+(x+1.875)*slope+.030
            first('operating_display',Vector((x,y,z0))+Vector((-slope,0,1))*2,(slope,0,-1));exposed+=1
    # Thin instrument wedge front and rear are supported, not levitating.
    for name,x in [('service_worktop',-1.874),('rear_service_cover',-.99)]:
        a=ray(name,(x,0,2),(0,0,-1));b0=ray('instrument_wedge',(x,0,-1),(0,0,1))
        assert abs(a.z-b0.z)<.004,'instrument support';contacts+=1
    from monitor_contract import check
    repairs=check(parts,variant)
    from monitor_panel_mesh_contract import check as mesh_check
    repairs['panel_mesh']=mesh_check(parts,variant)
    from test_monitor_panel_recovery import check_closure,check_path
    bb={o.name:bounds([o]) for o in parts}
    assert not check_closure(bb),check_closure(bb)
    for i in range(2):assert not check_path(bb,i,h),check_path(bb,i,h)
    return dict(bounds_blender_m=b,mesh_objects=len(parts),triangles=triangles,deck_probes=deck,support_contacts=contacts,exposed_fittings=exposed,closed_front_probes=closed,repair_checks=repairs)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--geometry-only',action='store_true');ap.add_argument('--output-root',type=Path,default=ROOT);args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    root=args.output_root.resolve();out=root/'tools/assets/passenger-vault/monitoring';public=root/'public/assets/passenger-vault';out.mkdir(parents=True,exist_ok=True);public.mkdir(parents=True,exist_ok=True)
    bpy.context.preferences.filepaths.save_version=0;report={}
    for variant in HEIGHTS:
        reset();parts=author(variant);validate(parts,variant);bpy.ops.wm.save_as_mainfile(filepath=str(out/f'{variant}.blend'));path=public/f'monitor-{variant}.glb';export(path,parts)
        reset();parts=load(path);report[variant]=validate(parts,variant)
        if args.geometry_only:continue
        render(out/f'{variant}-closed.png',parts,(-6,-6,4),(0,0,.5),5.8,f'SOURCE ONLY | {variant} west-facing console | neutral imported GLB')
        before={o.name:bounds([o]) for o in parts}
        moving={'service_panel_0','latch_0','panel_seam_0'}
        for o in parts:
            if o.name in moving:o.location+=Vector((.11,.90,0))
        bpy.context.view_layer.update()
        for o in parts:
            if o.name not in moving:assert bounds([o])==before[o.name]
        render(out/f'{variant}-cutaway.png',parts,(-7,-3,2.3),(-1.2,0,.5),4.4,f'SOURCE ONLY | {variant} ACTUAL supported open state\nPanel 0 translated +110mm x, +900mm y; all fixed geometry present\nContinuous hold required; limited one-hand service; no runtime acceptance')
    if args.geometry_only:
        print('MONITOR_GEOMETRY_ONLY '+json.dumps(report));return
    room=room_fit.assemble(root);prior=room_fit.validate(room);context=[o for o in bpy.data.objects if o.type=='MESH'];neutral=mat('source_room_clay',.32)
    context.append(box('SOURCE_deck',(18.75,-13.75,-.08),(35,25,.16),neutral))
    installed=[]
    for family,variant,x,y,angle in [('distribution','north',600,80,0),('distribution','south',600,800,math.pi),('monitor','north',1100,280,0),('monitor','south',1100,600,0)]:
        parts=load(public/f'{family}-{variant}.glb');mount=Matrix.Translation((x/32,-y/32,0))@Matrix.Rotation(angle,4,'Z')
        for o in parts:o.matrix_world=mount@o.matrix_world
        bpy.context.view_layer.update();b=bounds(parts)
        if family=='monitor':
            game=[b[0][0]*32,-b[1][1]*32,b[1][0]*32,-b[0][1]*32];assert all(abs(a-b)<.001 for a,b in zip(game,[1040,y-40,1160,y+40])),'installed envelope'
            installed.append(dict(id='MN' if variant=='north' else 'MS',meshes=len(parts),bounds_game=game,height_game=b[1][2]*32,west_direction=[-1,0,0]))
        context+=parts
    assert [r['id'] for r in installed]==['MN','MS'] and all(r['meshes']==len(NAMES) for r in installed),'installed inventory'
    for y in [-1.125,-26.375]:context.append(box('SOURCE_wall',(18.75,y,.6),(35,.25,1.2),neutral))
    context.append(box('SOURCE_east_wall',(36.375,-13.75,.6),(.25,25,1.2),neutral))
    render(out/'room-placement.png',context,(32,-43,37),(18.75,-13.75,0),46,'SOURCE ONLY | 16 chambers / 4 carriers / 2 distribution / 2 consoles')
    report['room_context']=dict(carriers=prior['carriers'],chambers=prior['chambers'],routes=prior['access']['route_segments'],monitors=installed)
    files=[public/f'monitor-{v}.glb' for v in HEIGHTS]+sorted(out.glob('*.png'))+sorted(out.glob('*.blend'))
    manifest=dict(schema=1,gate='source-only geometry candidate; independent review pending',blender=bpy.app.version_string,validation=report,files={str(p.relative_to(root)):dict(sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size) for p in files})
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('MONITOR_VERIFIED '+json.dumps(report))
if __name__=='__main__':main()
