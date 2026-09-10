"""Actual imported skin and front pull/release geometry, not bounds alone."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import bmesh
from mathutils import Vector
from distribution import bounds, tree


def check(parts, variant):
    n = {o.name: o for o in parts}
    for name in ['service_sill','service_mullion','support_shelf']:
        assert name in n, 'missing closure mesh '+name
        o=n[name];lo,hi=bounds([o]);t=tree(o)
        bm=bmesh.new();bm.from_mesh(o.data);volume=bm.calc_volume(signed=True);bm.free()
        assert abs(volume-(hi[0]-lo[0])*(hi[1]-lo[1])*(hi[2]-lo[2]))<1e-6, 'closure must occupy its rectangular extent'
        for axis in range(3):
            other=[a for a in range(3) if a!=axis]
            for u in [.1,.5,.9]:
                for v in [.1,.5,.9]:
                    for sign in [-1,1]:
                        p=Vector(lo);p[other[0]]+=u*(hi[other[0]]-lo[other[0]]);p[other[1]]+=v*(hi[other[1]]-lo[other[1]])
                        p[axis]=lo[axis]-1 if sign==1 else hi[axis]+1
                        d=Vector((0,0,0));d[axis]=sign
                        q,_,_,_=t.ray_cast(p,d)
                        assert q is not None and abs(q[axis]-(lo[axis] if sign==1 else hi[axis]))<1e-5, 'missing closure surface '+name
    for i in range(2):
        o = n[f'service_panel_{i}']
        lo, hi = bounds([o])
        bm = bmesh.new(); bm.from_mesh(o.data)
        volume = bm.calc_volume(signed=True); bm.free()
        size = [hi[a]-lo[a] for a in range(3)]
        expected = size[0]*size[1]*size[2] - (size[0]-.004)*(size[1]-.004)*(size[2]-.004)
        assert abs(volume-expected) < 1e-6, f'panel {i}: not a hollow 2mm skin'
        t = tree(o)
        centre = Vector([(lo[a]+hi[a])/2 for a in range(3)])
        for axis in range(3):
            for sign in [-1, 1]:
                d = Vector((0,0,0)); d[axis] = sign
                q, normal, _, distance = t.ray_cast(centre, d)
                assert q is not None and abs(distance-(size[axis]/2-.002)) < 1e-5, 'missing inner 2mm surface'
                assert normal.dot(d) < -.99, 'cavity must face inward'
        latch = n[f'latch_{i}']; lt = tree(latch); a,b = bounds([latch])
        y=(a[1]+b[1])/2; z=(a[2]+b[2])/2
        # Front opening must be real, not a labelled solid plate. A 50x25mm
        # aperture and 18mm under-bar depth are this fitting's bounded contract.
        for dy in [-.025,0,.025]:
            for dz in [-.0125,0,.0125]:
                q,_,_,_=lt.ray_cast(Vector((-2,y+dy,z+dz)),Vector((1,0,0)))
                assert q is None, 'front release aperture blocked'
        for dy in [-.02,0,.02]:
            q,_,_,_=lt.ray_cast(Vector((a[0]+.007,y+dy,z)),Vector((0,0,1)))
            assert q is None, 'under-bar finger/tool depth blocked'
        for yy in [a[1]+.006,b[1]-.006]:
            q,_,_,_=lt.ray_cast(Vector((-2,yy,z)),Vector((1,0,0)))
            assert q is not None, 'missing grip mounting leg'
    return dict(hollow_panels=2,skin_m=.002,front_operable_fittings=2)


if __name__ == '__main__':
    import monitoring as m
    from pathlib import Path
    root=Path(__file__).resolve().parents[3]
    for variant in m.HEIGHTS:
        m.reset(); print(variant, check(m.load(root/f'public/assets/passenger-vault/monitor-{variant}.glb'),variant))
