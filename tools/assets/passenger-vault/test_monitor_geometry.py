"""Imported-triangle positive checks and independently mutated regressions."""
import json
import sys
from pathlib import Path
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parent))

def main():
    root=Path(__file__).resolve().parents[3]
    assert all((root/f'public/assets/passenger-vault/monitor-{v}.glb').exists() for v in ['north','south']), 'missing monitoring pair'
    import monitoring as m
    results=[]
    for variant in m.HEIGHTS:
        def fresh():
            m.reset();p=m.load(root/f'public/assets/passenger-vault/monitor-{variant}.glb');return p,{o.name:o for o in p}
        p,n=fresh();m.validate(p,variant)
        from monitor_contract import check
        check(p,variant)
        faults={
            'display raised 1mm':lambda p,n:setattr(n['operating_display'].location,'z',n['operating_display'].location.z+.001),
            'pack raised 100mm':lambda p,n:setattr(n['electronics_pack_0'].location,'z',n['electronics_pack_0'].location.z+.1),
            'lower joint overlap 80mm':lambda p,n:extend_east(n['side_south'],.08),
            'upper joint overlap 80mm':lambda p,n:extend_east(n['instrument_cheek_south'],.08),
            'lower joint separated 10mm':lambda p,n:extend_east(n['side_south'],-.01),
            'upper joint separated 10mm':lambda p,n:extend_east(n['instrument_cheek_south'],-.01),
            'inaccessible pack':lambda p,n:setattr(n['electronics_pack_0'].location,'x',-.8),
            'buried display':lambda p,n:setattr(n['operating_display'].location,'z',n['operating_display'].location.z-.12),
            'floating base':lambda p,n:setattr(n['deck_plinth'].location,'z',n['deck_plinth'].location.z+.02),
            'floating worktop':lambda p,n:setattr(n['service_worktop'].location,'z',n['service_worktop'].location.z+.02),
            'missing support':lambda p,n:p.remove(n['central_bulkhead']),
            'buried latch':lambda p,n:setattr(n['latch_0'].location,'x',-1.5),
            'inset service panel':lambda p,n:setattr(n['service_panel_0'].location,'x',-1.5),
            'scale mismatch':lambda p,n:[setattr(o.scale,'z',.8) for o in p],
            'unexpected mesh':lambda p,n:p.append(n['deck_plinth']),
        }
        for name,mutate in faults.items():
            p,n=fresh();mutate(p,n)
            try:m.validate(p,variant)
            except AssertionError as e:results.append(dict(variant=variant,fault=name,rejected=str(e)))
            else:raise AssertionError('fault escaped '+name)
    assert len(results)==30
    print('MONITOR_FAULTS '+json.dumps(results))
def extend_east(o,delta):
    # Mutate imported vertices without changing inventory or overall envelope.
    maximum=max(v.co.x for v in o.data.vertices)
    for v in o.data.vertices:
        if abs(v.co.x-maximum)<1e-5:v.co.x+=delta
    o.data.update()

if __name__=='__main__':main()
