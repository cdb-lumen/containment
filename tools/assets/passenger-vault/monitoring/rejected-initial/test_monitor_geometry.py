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
        faults={
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
    assert len(results)==16
    print('MONITOR_FAULTS '+json.dumps(results))
if __name__=='__main__':main()
