"""Run with Blender --background --factory-startup --python-exit-code 1 --python.
Independent imported-mesh contract; does not use author geometry constants.
"""
import argparse
import json
import sys
import unittest
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
# Individual rectangles meet at edges, never overlap. Wall channel is outside
# the floor, INSIDE the east wall thickness x1160..1200, not SVG annotation1148.
EXPECTED = {
    'feed_A': (418,120,422,248), 'feed_B': (778,120,782,248),
    'feed_C': (418,632,422,760), 'feed_D4': (778,632,782,760),
    'neck_A': (418,102,422,120), 'neck_B': (778,102,782,120),
    'neck_C': (418,760,422,778), 'neck_D4': (778,760,782,778),
    'header_north': (418,98,1162,102), 'header_south': (418,778,1162,782),
    'console_north': (1160,278,1162,282), 'console_south': (1160,598,1162,602),
    'wall_channel': (1162,98,1166,782),
}

def validate(parts):
    bpy.context.view_layer.update()
    assert len(parts) == len(EXPECTED), 'inventory count'
    assert {o.name for o in parts} == set(EXPECTED), 'inventory names'
    triangles = 0
    all_bounds = []
    for o in parts:
        ps = [o.matrix_world @ v.co for v in o.data.vertices]
        assert ps, 'empty mesh'
        assert all(abs(p.z) < 1e-7 for p in ps), 'flush level: no raised or recessed geometry'
        xy = [(p.x*32,-p.y*32) for p in ps]
        rect = EXPECTED[o.name]
        bounds = (min(x for x,y in xy),min(y for x,y in xy),max(x for x,y in xy),max(y for x,y in xy))
        assert all(abs(a-b)<.001 for a,b in zip(bounds,rect)), 'footprint/route intrusion '+o.name
        all_bounds.append(bounds)
        o.data.calc_loop_triangles()
        area = 0
        edges = {}
        for t in o.data.loop_triangles:
            a,b,c = [ps[i] for i in t.vertices]
            cross = (b-a).cross(c-a)
            assert cross.z > 1e-10, 'winding or degenerate triangle'
            area += cross.z/2*1024
            triangles += 1
            pts = [tuple(round(q,6) for q in p) for p in (a,b,c)]
            for i in range(3):
                edge=tuple(sorted((pts[i],pts[(i+1)%3])))
                edges[edge]=edges.get(edge,0)+1
        assert abs(area-(rect[2]-rect[0])*(rect[3]-rect[1]))<.01, 'missing or duplicated area'
        assert all(n in (1,2) for n in edges.values()), 'nonmanifold surface'
        # Every unpaired edge must lie on the rectangle boundary. This rejects
        # internal cracks/holes even when aggregate triangle area is preserved.
        for (a,b),n in edges.items():
            if n==1:
                assert any(abs(a[axis]*factor-value)<.001 and abs(b[axis]*factor-value)<.001
                           for axis,factor,value in [(0,32,rect[0]),(0,32,rect[2]),(1,-32,rect[1]),(1,-32,rect[3])]), 'internal hole or overlap'
        tree=BVHTree.FromPolygons(ps,[list(t.vertices) for t in o.data.loop_triangles])
        for u in (.01,.25,.5,.75,.99):
            for v in (.01,.25,.5,.75,.99):
                x=rect[0]+u*(rect[2]-rect[0]);y=rect[1]+v*(rect[3]-rect[1])
                hit=tree.ray_cast(Vector((x/32,-y/32,1)),Vector((0,0,-1)))[0]
                assert hit is not None and abs(hit.z)<1e-7, 'missing flush surface'
    # Connectivity is measured from imported footprints, including console ends.
    names=[o.name for o in parts]; boxes=dict(zip(names,all_bounds))
    reached={names[0]}
    while True:
        old=len(reached)
        for a in list(reached):
            r=boxes[a]
            for b,s in boxes.items():
                if min(r[2],s[2])>=max(r[0],s[0])-.001 and min(r[3],s[3])>=max(r[1],s[1])-.001:
                    reached.add(b)
        if len(reached)==old:break
    assert reached==set(EXPECTED), 'disconnected feed/console'
    return {'mesh_objects':len(parts),'triangles':triangles,'flush_height_m':0,'connected_parts':len(reached),'surface_ray_probes':len(parts)*25,'row_feeds':4,'console_connections':2,'wall_channel_game_x':[1162,1166]}

class Contract(unittest.TestCase):
    def setUp(self):
        for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
        self.assertTrue(ASSET.exists(), 'service-finish.glb construction artifact missing')
        bpy.ops.import_scene.gltf(filepath=str(ASSET))
        self.parts=[o for o in bpy.data.objects if o.type=='MESH']
    def test_imported_contract(self):
        print('SERVICE_FINISH_GEOMETRY '+json.dumps(validate(self.parts),sort_keys=True))
    def test_missing_each_feed_and_console(self):
        for name in ['feed_A','feed_B','feed_C','feed_D4','console_north','console_south']:
            with self.subTest(name=name),self.assertRaisesRegex(AssertionError,'inventory'):
                validate([o for o in self.parts if o.name!=name])
    def test_raised_route_obstacle(self):
        self.parts[0].location.z+=.01
        with self.assertRaisesRegex(AssertionError,'flush level'):validate(self.parts)
    def test_recess_hole(self):
        self.parts[0].location.z-=.01
        with self.assertRaisesRegex(AssertionError,'flush level'):validate(self.parts)
    def test_route_footprint_intrusion(self):
        o=next(o for o in self.parts if o.name=='feed_A');o.location.x+=1
        with self.assertRaisesRegex(AssertionError,'footprint/route'):validate(self.parts)
    def test_wall_channel_on_floor_rejected(self):
        o=next(o for o in self.parts if o.name=='wall_channel');o.location.x-=16/32
        with self.assertRaisesRegex(AssertionError,'footprint/route'):validate(self.parts)
    def test_cut_connection(self):
        o=next(o for o in self.parts if o.name=='console_north');o.scale.x=.5
        with self.assertRaisesRegex(AssertionError,'footprint/route'):validate(self.parts)
    def test_missing_surface(self):
        o=self.parts[0];o.data.clear_geometry()
        with self.assertRaisesRegex(AssertionError,'empty mesh'):validate(self.parts)
    def test_internal_hole(self):
        import bmesh
        o=next(o for o in self.parts if o.name=='feed_A')
        bm=bmesh.new();bm.from_mesh(o.data);bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[bm.faces[len(bm.faces)//2]],context='FACES');bm.to_mesh(o.data);bm.free()
        with self.assertRaisesRegex(AssertionError,'missing or duplicated area'):validate(self.parts)

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--output-root',type=Path,default=ROOT)
    args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    ASSET=args.output_root/'public/assets/passenger-vault/service-finish.glb'
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Contract))
    if not result.wasSuccessful():raise SystemExit(1)
