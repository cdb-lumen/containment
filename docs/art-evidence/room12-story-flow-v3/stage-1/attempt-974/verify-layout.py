#!/usr/bin/env python3
"""Repeat render, decode, geometry positive and negative controls."""
from pathlib import Path
import contextlib, hashlib, io, json, runpy
from PIL import Image
root=Path(__file__).resolve().parent
checks={}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
with contextlib.redirect_stdout(io.StringIO()): ns=runpy.run_path(str(root/'draw-layout.py'))
first={n:digest(root/n) for n in ('room12-layout.png','layout-geometry.json','geometry-checks.json')}
with contextlib.redirect_stdout(io.StringIO()): runpy.run_path(str(root/'draw-layout.py'))
checks['repeat_render_byte_equal']=all(digest(root/n)==v for n,v in first.items())
with Image.open(root/'room12-layout.png') as im:
 im.load();checks['decoded_rgb_2400x1840']=im.mode=='RGB' and im.size==(2400,1840)
checks['png_under_8_mib']=(root/'room12-layout.png').stat().st_size<8*1024*1024
checks['both_radii_pass']=all(r['passed'] for r in ns['results'])
checks['all_routes_count']=all(len(r['routes'])==10 for r in ns['results'])
checks['record_to_ai_separation_210']=ns['rects'][1][0]-(ns['rects'][0][0]+ns['rects'][0][2])==210
checks['solid_route_negative_control']=ns['clearance']([410,230],[410,300])==0
# Retained rectangles plus a full-height test-only wall must disconnect the proof.
# The mutable list is shared with the function's globals, unlike runpy mappings.
ns['rects'].append([590,0,20,880])
blocked=ns['proof'](28)
checks['disconnected_wall_negative_control']=blocked['connected_components']>1 and not blocked['passed']
ns['rects'].pop()
checks['source_restored_after_negative']=ns['proof'](28)['passed']
# Proposed contactor jaws, battery and socket icons stay in their assigned solids.
proposals=[(2,[496,630,48,32]),(2,[568,630,48,32]),(2,[652,598,54,72]),*[(1,[x,305,15,21]) for x in (720,775,830)]]
checks['purpose_symbols_inside_retained_reservations']=all(x>=bx and y>=by and x+w<=bx+bw and y+h<=by+bh for i,(x,y,w,h) in proposals for bx,by,bw,bh in [ns['rects'][i]])
checks['sources_unchanged']=all(digest(Path(p))==v for p,v in json.loads((root/'source-hashes.json').read_text())['sources'].items())
report={'checks':checks,'failures':sum(not v for v in checks.values()),'errors':0,'artifacts':first,'negative_control_components':blocked['connected_components'],'scope':'Artifact and static bounded geometry checks only. No game process, combat or navigation execution.'}
(root/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
assert not report['failures']
