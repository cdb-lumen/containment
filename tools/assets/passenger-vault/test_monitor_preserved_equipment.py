"""Compare actual imported fixed equipment vertices to reviewed HEAD 9ece1c8."""
import sys
import json
import subprocess
import tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import monitoring as m
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]

def main():
    result={}
    allowed={'central_bulkhead','service_sill','service_mullion','support_shelf',*[f'{p}_{i}' for p in ['service_panel','latch','panel_seam'] for i in range(2)]}
    def snapshot(parts):
        return {o.name:sorted(tuple(round(c,6) for c in v) for v in m.vertices([o])) for o in parts}
    for variant in m.HEIGHTS:
        rel=f'public/assets/passenger-vault/monitor-{variant}.glb'
        with tempfile.TemporaryDirectory() as tmp:
            old=Path(tmp)/'old.glb';old.write_bytes(subprocess.check_output(['git','show',f'9ece1c8:{rel}'],cwd=ROOT))
            m.reset();previous=snapshot(m.load(old))
        m.reset();parts=m.load(ROOT/rel);current=snapshot(parts)
        preserved=sorted(set(previous)-allowed)
        for name in preserved:assert previous[name]==current[name], 'equipment changed '+name
        closed={o.name:m.bounds([o]) for o in parts}
        for o in parts:
            if o.name in {'service_panel_0','latch_0','panel_seam_0'}:o.location+=Vector((.11,.90,0))
        m.bpy.context.view_layer.update()
        opened={o.name:m.bounds([o]) for o in parts}
        for name in closed:
            if name not in {'service_panel_0','latch_0','panel_seam_0'}:assert closed[name]==opened[name]
        assert all(not o.hide_render and not o.hide_viewport for o in parts)
        result[variant]=dict(preserved_equipment=preserved,closed=closed,actual_open=opened,all_meshes_present=len(parts),hidden_meshes=0)
    out=ROOT/'tools/assets/passenger-vault/monitoring/construction-equipment-and-open-state.json'
    out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
if __name__=='__main__':main()
