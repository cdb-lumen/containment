"""Source-only installed fit of approved GLBs. No exports or runtime writes."""
import argparse
import hashlib
import itertools
import json
import math
import re
import sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
TOPOLOGY = 'src/game/roguelike/authoredRoomTopologies.ts'
EXPECTED = [('A',320,240,200,120,40,True), ('B',680,240,200,120,40,True),
            ('C',320,520,200,120,40,True), ('D4',680,520,200,120,40,True),
            ('SN',300,40,600,80,48,False), ('SS',300,760,600,80,32,False),
            ('MN',1040,240,120,80,40,False), ('MS',1040,560,120,80,32,False)]
ROUTES = {'R1':[(100,440),(1100,440)],
          'R2':[(100,440),(260,440),(260,180),(960,180),(960,440),(1100,440)],
          'R3':[(100,440),(260,440),(260,700),(960,700),(960,440),(1100,440)],
          'R4':[(600,180),(600,700)]}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def solids_from_source(root):
    text = (root / TOPOLOGY).read_text().split('export const PASSENGER_BLOCKOUT=Object.freeze([')[1].split('].map(')[0]
    records = re.findall(r"id:'([^']+)',x:(\d+),y:(\d+),w:(\d+),h:(\d+),height:(\d+),row:(true|false)", text)
    actual = [(r[0], *map(int,r[1:6]), r[6]=='true') for r in records]
    assert actual == EXPECTED, 'Existing eight solids changed'
    return [dict(zip(('id','x','y','w','h','height','row'), r)) for r in actual]


def assemble(root):
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    solids = solids_from_source(root)
    imports = {}
    for name in ['chamber','row-carrier']:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(root / f'public/assets/passenger-vault/{name}.glb'))
        imports[name] = [o for o in bpy.data.objects if o not in before and o.type=='MESH']
    bpy.context.view_layer.update()
    rows = []
    for solid in solids[:4]:
        south = solid['id'] in ('C','D4')
        mount = Matrix.Translation(((solid['x']+100)/32, -(solid['y']+60)/32, 0)) @ Matrix.Rotation(math.pi if south else 0, 4, 'Z')
        def copy(parts, transform, prefix):
            result, named = [], {}
            for original in parts:
                obj = original.copy()
                obj.data = original.data
                bpy.context.collection.objects.link(obj)
                obj.matrix_world = transform @ original.matrix_world
                obj.name = prefix+'_'+original.name
                result.append(obj)
                named[original.name] = obj
            return result, named
        carrier, named = copy(imports['row-carrier'], mount, solid['id'])
        chambers, named_chambers = [], []
        for i,x in enumerate([-2.34375,-.78125,.78125,2.34375]):
            parts, names = copy(imports['chamber'], mount @ Matrix.Translation((x,-.25,0)), f"{solid['id']}{i+1}")
            chambers.append(parts)
            named_chambers.append(names)
        rows.append(dict(solid=solid,mount=mount,carrier=carrier,named_carrier=named,chambers=chambers,named_chambers=named_chambers))
    for parts in imports.values():
        for obj in parts:
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.context.view_layer.update()
    return dict(rows=rows,solids=solids)


def vertices(parts):
    return [o.matrix_world @ v.co for o in parts for v in o.data.vertices]


def bounds(parts):
    pts = vertices(parts)
    return [[min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]]


def tree(obj):
    return BVHTree.FromPolygons(vertices([obj]), [list(p.vertices) for p in obj.data.polygons])


def check_routes(solids):
    # All defined segments are axis-aligned. Minkowski square inflation is
    # conservative for the radius-28 disk, including every segment endpoint.
    def segment(a,b):
        assert a[0]==b[0] or a[1]==b[1]
        for p in (a,b):
            assert 68 <= p[0] <= 1132 and 68 <= p[1] <= 812, 'route clearance boundary'
        for s in solids:
            lo=(s['x']-28,s['y']-28); hi=(s['x']+s['w']+28,s['y']+s['h']+28)
            assert not all(max(a[i],b[i]) >= lo[i] and min(a[i],b[i]) <= hi[i] for i in (0,1)), ('route clearance',a,b,s['id'])
    count=0
    for points in ROUTES.values():
        for a,b in zip(points,points[1:]):
            segment(a,b); count+=1
    accesses=[]
    for s in solids[:4]:
        working=400 if s['y']==240 else 480
        rear=180 if s['y']==240 else 700
        for i in range(4):
            x=s['x']+25+50*i
            for a,b in [((x,440),(x,working)),((600,rear),(x,rear))]:
                segment(a,b); accesses.append([a,b])
    for a,b in [((960,280),(1000,280)),((960,600),(1000,600))]:
        segment(a,b); accesses.append([a,b])
    return dict(radius_game=28, route_segments=count, access_segments=len(accesses), routes=ROUTES, accesses=accesses)


def validate(room):
    bpy.context.view_layer.update()
    rows = room['rows']
    ids = [r['solid']['id'] for r in rows]
    assert len(ids) == 4 and set(ids) == {'A', 'B', 'C', 'D4'}, 'inventory: exactly four unique rows A/B/C/D4 required'
    for row in rows:
        assert len(row['chambers']) == len(row['named_chambers']) == 4, 'inventory: four chamber groups per row required'
        groups = [(row['carrier'], row['named_carrier']), *zip(row['chambers'], row['named_chambers'])]
        for parts, names in groups:
            assert parts and all(o.type == 'MESH' and len(o.data.vertices) and len(o.data.polygons) for o in parts), 'inventory: nonempty imported mesh groups required'
            assert len(parts) == len(names) == len(set(parts)) and set(parts) == set(names.values()), 'inventory: named groups must match installed meshes'
    report=dict(chambers=sum(len(r['chambers']) for r in rows),carriers=sum(bool(r['carrier']) for r in rows),solids=len(room['solids']),rows=[],support_contacts=0,service_contacts=0,sealed_probes=0)
    assert report['chambers'] == 16 and report['carriers'] == 4, 'inventory: sixteen chambers and four carriers required'
    chamber_bounds=[]
    for row in room['rows']:
        s=row['solid']; mount=row['mount']; south=s['id'] in ('C','D4')
        # Actual plate and rear union centroids establish working orientation,
        # rather than accepting the declared placement rotation as proof.
        for names in row['named_chambers']:
            front=Vector(tuple(sum(p[i] for p in vertices([names['chamber_working_face_status_recess']]))/len(vertices([names['chamber_working_face_status_recess']])) for i in range(3)))
            rear=names['chamber_rear_union_-0.25'].matrix_world.translation
            assert (front.y-rear.y)*(1 if south else -1)>2, 'working face orientation'
        for parts in row['chambers']:
            chamber_bounds.append(bounds(parts))
    for a,b in itertools.combinations(chamber_bounds,2):
        assert not all(min(a[1][i],b[1][i])-max(a[0][i],b[0][i])>1e-5 for i in range(3)), 'inter-chamber overlap'
    for row in room['rows']:
        s=row['solid']; mount=row['mount']; names=row['named_carrier']
        all_parts=row['carrier']+sum(row['chambers'],[])
        for p in vertices(all_parts):
            assert s['x']-1e-3<=p.x*32<=s['x']+200+1e-3 and s['y']-1e-3<=-p.y*32<=s['y']+120+1e-3 and -1e-5<=p.z<=1.25001, ('row reservation',s['id'],list(p))
        for parts in row['chambers']:
            lo,hi=bounds(parts)
            # Match to one of four fixed chamber reservations, not row bounds alone.
            assert any(lo[0]*32>=s['x']+5+50*i-1e-3 and hi[0]*32<=s['x']+45+50*i+1e-3 for i in range(4)), 'chamber reservation'
            y0=264 if s['y']==240 else 528
            assert -hi[1]*32>=y0-1e-3 and -lo[1]*32<=y0+88+1e-3, 'chamber reservation'
        trees={o:tree(o) for o in all_parts}
        def hit(obj,p,d,message):
            q,_,_,_=trees[obj].ray_cast(mount @ Vector(p), mount.to_3x3() @ Vector(d))
            assert q is not None, message
            return mount.inverted() @ q
        plinth=names['carrier_continuous_deck_plinth']
        # Full projected footprint plus real top/bottom rays rules out fake
        # collision voids between chambers. Grid includes near-edge corners.
        lo,hi=bounds([plinth])
        assert abs(lo[0]*32-s['x'])<1e-3 and abs(hi[0]*32-s['x']-200)<1e-3 and abs(-hi[1]*32-s['y'])<1e-3 and abs(-lo[1]*32-s['y']-120)<1e-3, 'sealed footprint extent'
        for x in [-3.124,-2.8,-1.5625,0,1.5625,2.8,3.124]:
            for y in [-1.874,-1,0,1,1.874]:
                bottom=hit(plinth,(x,y,-1),(0,0,1),'sealed footprint deck')
                top=hit(plinth,(x,y,2),(0,0,-1),'sealed footprint top')
                assert abs(bottom.z)<1e-5 and abs(top.z-.18)<1e-5, 'sealed footprint deck contact'
                report['sealed_probes']+=1
        for i,x in enumerate([-2.34375,-.78125,.78125,2.34375]):
            cn=row['named_chambers'][i]
            for y in [-.85,.85]:
                cradle=cn[f'chamber_cradle_{y}']
                for lower,upper,z in [(plinth,cradle,.18),(cradle,cn['chamber_lower_pan'],.29)]:
                    a=hit(lower,(x,y-.25,2),(0,0,-1),'support contact')
                    b=hit(upper,(x,y-.25,-1),(0,0,1),'support contact')
                    assert abs(a.z-b.z)<1e-5 and abs(a.z-z)<1e-5, 'support contact gap'
                    report['support_contacts']+=1
            for dx in [-.25,.25]:
                rod=names[f'carrier_supply_return_{i}_{dx}']; union=cn[f'chamber_rear_union_{dx}']; manifold=names['carrier_rear_manifold']
                a=hit(union,(x+dx,3,.58),(0,-1,0),'service contact')
                b=hit(rod,(x+dx,-3,.58),(0,1,0),'service contact')
                c=hit(rod,(x+dx,3,.58),(0,-1,0),'service contact')
                d=hit(manifold,(x+dx,-3,.58),(0,1,0),'service contact')
                assert abs(a.y-b.y)<1e-5 and 0<=c.y-d.y<=.011, 'service contact gap'
                report['service_contacts']+=2
        report['rows'].append(dict(id=s['id'], bounds_blender_m=bounds(all_parts), working_face='north' if s['id'] in ('C','D4') else 'south', chambers=[bounds(c) for c in row['chambers']]))
    report['access']=check_routes(room['solids'])
    report['mesh_objects']=sum(len(r['carrier'])+sum(map(len,r['chambers'])) for r in room['rows'])
    report['placed_triangles']=sum(len(o.data.polygons) for r in room['rows'] for o in r['carrier']+sum(r['chambers'],[]))
    report['passed']=True
    return report


def render(room,out):
    def mat(name,value):
        m=bpy.data.materials.new(name); m.diffuse_color=(value,value,value,1); return m
    floor=mat('fixture_deck',.26); context=mat('unbuilt_service_reservation',.38); proxy=mat('scale_proxy',.7)
    def box(name,pos,size,material):
        bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
        o=bpy.context.object; o.name='FIXTURE_'+name; o.dimensions=size; o.data.materials.append(material); return o
    box('deck',(18.75,-13.75,-.06),(35,25,.12),floor)
    for s in room['solids'][4:]:
        box(s['id']+'_reservation',((s['x']+s['w']/2)/32,-(s['y']+s['h']/2)/32,s['height']/64),(s['w']/32,s['h']/32,s['height']/32),context)
    for x,y in [(100,440),(345,400),(345,480),(600,180),(600,700),(1000,280),(1000,600)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=28/32,depth=.018,location=(x/32,-y/32,.01))
        o=bpy.context.object; o.name='FIXTURE_radius28'; o.data.materials.append(proxy)
        box('205cm_actor',(x/32,-y/32,.85),(.48,.28,1.7),proxy)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.175,location=(x/32,-y/32,1.875))
        bpy.context.object.name='FIXTURE_actor_head'; bpy.context.object.data.materials.append(proxy)
    # Thin source-only route traces sit on deck, never exported or queried as solids.
    for name,points in ROUTES.items():
        for a,b in zip(points,points[1:]):
            box(name,((a[0]+b[0])/64,-(a[1]+b[1])/64,.005),(max(abs(a[0]-b[0])/32,.035),max(abs(a[1]-b[1])/32,.035),.008),proxy)
    scene=bpy.context.scene; scene.render.engine='CYCLES'
    scene.cycles.device='CPU'; scene.cycles.samples=16; scene.cycles.use_denoising=False; scene.cycles.seed=0
    for pos,power,size in [((10,-20,30),16000,25),((30,0,25),12000,20)]:
        bpy.ops.object.light_add(type='AREA',location=pos)
        light=bpy.context.object; light.data.energy=power; light.data.size=size
        light.rotation_euler=(Vector((18.75,-13.75,0))-light.location).to_track_quat('-Z','Y').to_euler()
    scene.display.shading.light='STUDIO'; scene.display.shading.studiolight_rotate_z=.3
    scene.display.shading.color_type='MATERIAL'; scene.display.shading.show_shadows=True
    scene.display.shading.show_cavity=True; scene.display.shading.cavity_type='BOTH'
    scene.display.shading.background_type='WORLD'; scene.world.color=(.08,.08,.08)
    scene.render.resolution_x=1600; scene.render.resolution_y=1200; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
    scene.view_settings.view_transform='Standard'
    bpy.ops.object.camera_add(); camera=bpy.context.object; camera.data.type='ORTHO'; scene.camera=camera
    for name,pos,scale in [('whole-room-top.png',(18.75,-13.75,45),42),('whole-room-oblique.png',(43,-51,39),46)]:
        camera.location=pos; camera.rotation_euler=(Vector((18.75,-13.75,0))-camera.location).to_track_quat('-Z','Y').to_euler(); camera.data.ortho_scale=scale
        scene.render.filepath=str(out/name); bpy.ops.render.render(write_still=True)


def main():
    p=argparse.ArgumentParser(); p.add_argument('--output-root',type=Path,default=ROOT)
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    out=args.output_root/'tools/assets/passenger-vault/room-fit'; out.mkdir(parents=True,exist_ok=True)
    room=assemble(ROOT); result=validate(room)
    render(room,out)
    inputs=[ROOT/TOPOLOGY,ROOT/'public/assets/passenger-vault/chamber.glb',ROOT/'public/assets/passenger-vault/row-carrier.glb',HERE/'room_fit.py',HERE/'test_room_fit.py']
    data=dict(gate='whole-room geometry fit candidate; independent review pending',blender=bpy.app.version_string,validation=result,
              solids=room['solids'],source_only=True,inputs={str(f.relative_to(ROOT)):sha(f) for f in inputs},
              limitations=['No distribution or monitoring assets: four unchanged neutral reservations only','No underfloor distribution geometry; existing manifold terminal reach only','No materials, shipping cameras, runtime, release, medical or structural certification','Route checks are conservative continuous geometric tests, not a new production navigation simulation'],files={f.name:sha(f) for f in sorted(out.glob('*.png'))})
    (out/'manifest.json').write_text(json.dumps(data,indent=2)+'\n')
    print('WHOLE_ROOM_FIT '+json.dumps(result))

if __name__=='__main__': main()
