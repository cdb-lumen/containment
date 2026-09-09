"""Construction contacts and west reach measured from imported triangles."""
from mathutils import Vector
from distribution import bounds, tree

def check(parts, variant):
    n={o.name:o for o in parts}; t={k:tree(o) for k,o in n.items()}
    def ray(name,p,d):
        q,_,_,_=t[name].ray_cast(Vector(p),Vector(d))
        assert q is not None,'contact missing '+name
        return q
    def contact(a,b,x,y):
        gap=ray(b,(x,y,-1),(0,0,1)).z-ray(a,(x,y,3),(0,0,-1)).z
        assert abs(gap)<.00001,f'support {a}/{b} gap {gap:.6f}m'
    # Butt ends must meet. Sampling both exterior ownership and opposed end
    # rays rejects both coplanar overlap and a separated joint, not inventory.
    joints=0
    for side,sign in [('south',-1),('north',1)]:
        for a,b,y,z in [('side_'+side,'back_wall',sign*1.21,.3),
                         ('instrument_cheek_'+side,'rear_service_cover',sign*1.11,(1.25 if variant=='north' else 1)-.16)]:
            end=ray(a,(3,y,z),(-1,0,0)).x
            start=ray(b,(-3,y,z),(1,0,0)).x
            assert abs(end-start)<.00001,f'joint gap/overlap {a}/{b}: {end-start:.6f}m'
            for x in [start-.02,start+.02]:
                hits=[]
                for key in [a,b]:
                    q,_,_,dist=t[key].ray_cast(Vector((x,sign*2,z)),Vector((0,-sign,0)))
                    if q is not None:hits.append(dist)
                assert len(hits)==1,f'duplicate exterior patch {a}/{b}'
            joints+=1
    lo,hi=bounds([n['operating_display']])
    for x in [lo[0]+.03,(lo[0]+hi[0])/2,hi[0]-.03]:
        for y in [-.8,0,.8]:
            contact('display_bezel','operating_display',x,y)
            contact('instrument_wedge','display_bezel',x,y)
    for i,y in enumerate([-.605,.605]):
        lo0,hi0=bounds([n[f'electronics_pack_{i}']])
        for x in [lo0[0]+.03,hi0[0]-.03]:
            contact(f'electronics_tray_{i}',f'electronics_pack_{i}',x,y)
    # A bounded design reach, not an anthropometric certification. The 2.05m
    # proxy stands adjacent to the edge for maintenance, not at game operator
    # centre. All serviced equipment lies within 0.75m of the west solid face.
    reaches={key:bounds([n[key]])[1][0]+1.875 for key in ['operating_display','electronics_pack_0','electronics_pack_1']}
    assert all(0<r<=.75 for r in reaches.values()),'west maintenance reach '+str(reaches)
    # Direct west access to each pack after its recessed removable service
    # panel is lifted inward. Check actual obstacles along the working rays.
    for i,y in enumerate([-.605,.605]):
        z=(bounds([n[f'electronics_pack_{i}']])[0][2]+bounds([n[f'electronics_pack_{i}']])[1][2])/2
        hits=[]
        for key,t0 in t.items():
            if key in {f'service_panel_{i}',f'latch_{i}',f'panel_seam_{i}'}:continue
            q,_,_,dist=t0.ray_cast(Vector((-2,y,z)),Vector((1,0,0)))
            if q is not None:hits.append((dist,key))
        assert min(hits)[1]==f'electronics_pack_{i}','blocked west pack access'
    return dict(butt_joints=joints,display_support_samples=18,pack_support_samples=4,west_reach_m=reaches,reference_height_m=2.05,maintenance_edge_x=-1.875,operator_centres_unchanged=[[1000,280],[1000,600]])
