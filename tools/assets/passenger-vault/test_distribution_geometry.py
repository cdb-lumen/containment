"""Real imported-GLB positive checks and destructive fault regressions."""
import json
import sys
from pathlib import Path
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parent))
import distribution as d

def main():
    results=[]
    for variant in d.HEIGHTS:
        path=d.ROOT/f'public/assets/passenger-vault/distribution-{variant}.glb'
        def fresh():
            d.reset();p=d.load(path);return p,{o.name:o for o in p}
        p,n=fresh();d.validate(p,variant)
        faults={
            'floating skid':lambda p,n:setattr(n['skid_0'].location,'z',n['skid_0'].location.z+.02),
            'buried handle':lambda p,n:setattr(n['handle_0'].location,'y',-.9),
            'back slot':lambda p,n:setattr(n['back_wall'].location,'y',1.1),
            'inset front':lambda p,n:setattr(n['panel_0'].location,'y',-1.0),
            'floating deck':lambda p,n:setattr(n['deck_plinth'].location,'z',.08),
            'missing panel':lambda p,n:p.remove(n['panel_0']),
            'oversize roof':lambda p,n:setattr(n['roof'].scale,'x',1.1),
            'squashed south':lambda p,n:[setattr(o.scale,'z',.7) for o in p],
        }
        for name,fault in faults.items():
            p,n=fresh();fault(p,n)
            try:d.validate(p,variant)
            except AssertionError as e:results.append({'variant':variant,'fault':name,'rejected':str(e)})
            else:raise AssertionError('fault escaped: '+name)
        p,n=fresh()
        mesh=n['roof'].data
        import bmesh
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.delete(bm,geom=[list(bm.faces)[0]],context='FACES');bm.to_mesh(mesh);bm.free()
        try:d.validate(p,variant)
        except AssertionError as e:results.append({'variant':variant,'fault':'open roof mesh','rejected':str(e)})
        else:raise AssertionError('open mesh escaped')
    assert len(results)==18
    print('DISTRIBUTION_FAULTS '+json.dumps(results))

if __name__=='__main__':main()
