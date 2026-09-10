"""Measured construction checks for source meshes and freshly imported GLBs."""
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def check_construction(objects):
    trees = {o.name: BVHTree.FromPolygons(
        [o.matrix_world @ v.co for v in o.data.vertices],
        [list(p.vertices) for p in o.data.polygons]) for o in objects}

    def named(name):
        return next(o for o in objects if o.name == name)

    def surface(obj, origin, direction):
        hit, _, _, _ = trees[obj.name].ray_cast(Vector(origin), Vector(direction))
        assert hit is not None, (obj.name, 'missing contact surface', origin)
        return hit

    bed = named('chamber_internal_bed')
    pan = named('chamber_lower_pan')
    gaps = []
    # Interior patches avoid bevel edges. Opposed rays measure both real surfaces.
    for x in [-.2, 0, .2]:
        for y in [-.8, 0, .8]:
            bottom = surface(bed, (x, y, 0), (0, 0, 1))
            top = surface(pan, (x, y, 2), (0, 0, -1))
            gaps.append(bottom.z - top.z)
    assert all(abs(gap) <= 1e-5 for gap in gaps), ('bed support gaps m', gaps)

    fittings = [named('chamber_working_face_status_recess')]
    fittings += [o for o in objects if o.name.startswith('chamber_seal_clamp_')]
    assert len(fittings) == 5, 'Expected plate and four clamps'
    visibility = {}
    for obj in fittings:
        pts = [obj.matrix_world @ v.co for v in obj.data.vertices]
        lo = Vector(tuple(min(p[i] for p in pts) for i in range(3)))
        hi = Vector(tuple(max(p[i] for p in pts) for i in range(3)))
        center = (lo + hi) / 2
        axis = 1 if 'working_face' in obj.name else 0
        sign = -1 if axis == 1 or center.x < 0 else 1
        outward = Vector((0, 0, 0))
        outward[axis] = sign
        hits = []
        # Nine outward approach rays across each fitting's central face patch.
        tangents = [i for i in range(3) if i != axis]
        for a in [-.2, 0, .2]:
            for b in [-.2, 0, .2]:
                origin = center + outward * 2
                for i, offset in zip(tangents, [a, b]):
                    origin[i] += (hi[i] - lo[i]) * offset
                target = surface(obj, origin, -outward)
                distance = (target - origin).length
                blockers = []
                for other in objects:
                    if other == obj:
                        continue
                    hit, _, _, dist = trees[other.name].ray_cast(origin, -outward)
                    if hit is not None and dist < distance - 1e-5:
                        blockers.append(other.name)
                # Raised live relief is deliberately in front of its backing plate.
                blockers = [n for n in blockers if not n.startswith('chamber_working_face_live_relief')]
                hits.append(not blockers)
        assert all(hits), (obj.name, 'buried outward face', hits)
        visibility[obj.name] = len(hits)
    return {'bed_pan_gaps_m': gaps, 'outward_visible_samples': visibility}
