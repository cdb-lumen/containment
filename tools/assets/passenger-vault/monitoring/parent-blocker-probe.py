import sys,json
from pathlib import Path
sys.path.insert(0,'/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout/tools/assets/passenger-vault')
import monitoring as m
root=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/passenger-story-layout')
results=[]
for variant in ['north','south']:
 m.reset();parts=m.load(root/f'public/assets/passenger-vault/monitor-{variant}.glb');n={p.name:p for p in parts}
 a=m.bounds([n['service_panel_0']]);b=m.bounds([n['central_bulkhead']])
 overlap=[min(a[1][i],b[1][i])-max(a[0][i],b[0][i]) for i in range(3)]
 assert all(v>0 for v in overlap),overlap
 assert abs(overlap[0]-.03)<1e-5 and abs(overlap[1]-.04)<1e-5
 results.append(dict(variant=variant,panel_bulkhead_overlap_metres=overlap,construction_gate='failed'))
print(json.dumps(results,indent=2))
