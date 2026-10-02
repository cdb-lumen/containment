"""Deterministic CPU diagram. Run after validate-layout.cjs; no runtime edits."""
import json, hashlib, subprocess, sys, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out=Path(__file__).resolve().parent
repo=Path(sys.argv[1])
workspace=Path('/home/chernodubv/.hermes/workspaces/containment-art-roadmap')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
state=next(r['state'] for r in json.loads((workspace/'rollout-registry.json').read_text())['rooms'] if r['template_id']=='manual-control-chamber')
assert state['pending']=={'completed_start':1028,'stage_index':1}
for p,h in state['baseline_inputs'].items(): assert sha(workspace/p)==h,p
v=json.loads((out/'geometry-validation.json').read_text()); t=v['template']
assert v['failures']==v['errors']==0
im=Image.new('RGB',(1800,1320),'#101a21'); d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def text(x,y,s,size=23,color='#e8e7de',strong=False):
 f=ImageFont.truetype(bold if strong else font,size)
 assert d.textbbox((x,y),s,font=f)[2]<1790,s
 d.text((x,y),s,font=f,fill=color)
def line(points,color,width=3):d.line(points,fill=color,width=width,joint='curve')
text(45,28,'19 / Manual-control chamber',40,strong=True)
text(45,84,'Stage 1 layout draft | Current collision retained | Proposed art roles only',24,'#aebfc9')
d.rounded_rectangle((40,130,1760,225),radius=9,fill='#34352d',outline='#b6a477',width=2)
text(60,145,'PASSENGERS ALIVE',27,'#e8cf98',True)
text(60,184,'OVERLOAD KILLS EVERYONE ABOARD',23,'#e8cf98',True)
text(970,149,'Clear threats. Read the cost. Explicitly choose.',23)
text(970,187,'Walking to a marker never authorizes destruction.',21)
ox,oy,scale=60,305,.9
P=lambda p:(ox+p['x']*scale,oy+p['y']*scale)
R=lambda x,y,w,h:(ox+x*scale,oy+y*scale,ox+(x+w)*scale,oy+(y+h)*scale)
d.rectangle(R(0,0,t['width'],t['height']),fill='#202e36',outline='#afc0c9',width=5)
for x in range(100,1200,100):line([P({'x':x,'y':0}),P({'x':x,'y':880})],'#2b3b44',1)
for y in range(100,880,100):line([P({'x':0,'y':y}),P({'x':1200,'y':y})],'#2b3b44',1)
text(60,261,'Whole room / 1200 x 880 world units / y increases downward',22,'#aebfc9')
# Activity zones are not solids.
for x,y,w,h in [(220,445,235,140),(780,445,235,140)]:d.rounded_rectangle(R(x,y,w,h),radius=12,fill='#294a4d',outline='#438383',width=2)
d.rounded_rectangle(R(530,500,140,90),radius=9,fill='#48442e',outline='#bba166',width=2)
for name,points in v['routes'].items():
 color='#dfc386' if name=='console' else '#69c7c0' if name=='main' else '#688493'
 q=[P(p) for p in points];line(q,color,6 if name=='main' else 4)
 a,b=q[-2:];angle=math.atan2(b[1]-a[1],b[0]-a[0]); tip=[b,(b[0]-17*math.cos(angle-.5),b[1]-17*math.sin(angle-.5)),(b[0]-17*math.cos(angle+.5),b[1]-17*math.sin(angle+.5))];d.polygon(tip,fill=color)
for idx,o in enumerate(t['obstacles']):
 d.rectangle(R(o['x'],o['y'],o['width'],o['height']),fill='#656d6b' if idx<2 else '#aaa594',outline='#ded9c9',width=3)
 a,b=P(o)
 if idx<2:
  text(a+13,b+37,'LOW SIDE',18,strong=True);text(a+13,b+66,'EQUIPMENT',17);text(a+13,b+107,'Existing solid',15,'#e0ded3')
 else:
  text(a+12,b+32,'GUARDED DESK',20,'#1a272b',True)
# Proposed passenger display stays inside the southern solid footprint.
d.rectangle(R(495,676,210,25),fill='#20383a',outline='#e5ce92',width=2)
# Loom sits inside desk footprint. No extra floor obstruction.
line([P({'x':710,'y':690}),P({'x':718,'y':625}),P({'x':650,'y':625})],'#e8cc90',3)
for name,point,label in [('entry',t['spawn'],'ENTRY'),('exit',t['exit'],'EXIT')]:
 x,y=P(point);d.ellipse((x-12,y-12,x+12,y+12),fill='#88d0c8');text(x-42,y-64,label,20,strong=True)
for p in t['breaches']:
 x,y=P(p);d.polygon([(x,y-10),(x+10,y),(x,y+10),(x-10,y)],outline='#a3a6ad',fill='#465460')
x,y=P(v['activities']['warningRead']);d.ellipse((x-13,y-13,x+13,y+13),fill='#e9cf92');text(x-56,y-45,'READ COST',18,'#ebd29b',True)
text(285,805,'A / Clear threats',21,'#9ed5cf',True)
text(765,805,'A / Clear threats',21,'#9ed5cf',True)
text(459,976,'B / Passenger panel + guarded control',19,'#e5cd96',True)
text(363,467,'',18)
text(445,407,'North service loop',20,'#a8bdc7')
text(458,1030,'South service loop',20,'#a8bdc7')
text(76,1115,'Grid = 100 units',20,'#aebfc9');line([(320,1130),(500,1130)],'#e8e7de',4);text(525,1115,'200 units',20)
# Right-side reading order and legend.
x=1190
text(x,268,'Spatial intent',30,strong=True)
rows=[('01 / Arrival', ['West spawn stays at 100,440.', 'Open cross-room route remains.']),('02 / Clear threats', ['Two broad activity pockets flank', 'the warning approach. Keep them clear.']),('03 / Read the fatal cost', ['South desk is the focal point.', 'Panel and guarded actuator stay distinct.', 'Read position is an art-planning anchor,', 'not a new interaction trigger.']),('04 / Deliberate choice', ['Existing explicit Destroy ship action only.', 'East exit anchor remains at 1100,440.', 'Transition is gated by the existing game.'])]
y=324
for heading,body in rows:
 text(x,y,heading,24,'#e5cd96',True);y+=37
 for s in body:text(x,y,s,21);y+=29
 y+=24
text(x,937,'Diagram key',25,strong=True)
for yy,col,s in [(983,'#69c7c0','Primary route'),(1023,'#688493','Alternate circulation'),(1063,'#dfc386','Warning approach / focal point')]:line([(x,yy+13),(x+45,yy+13)],col,5);text(x+60,yy,s,21)
text(x,1105,'Filled blocks = current collision.',20,'#b9c6ca')
text(x,1136,'Diamond markers = existing breaches.',20,'#b9c6ca')
text(45,1190,'No geometry change. Desk and equipment names propose roles for the three existing solid footprints.',23)
text(45,1230,'CPU occupancy + swept paths checked at radii 16 and 28. No gameplay capture or human acceptance.',23,'#aebfc9')
text(45,1270,'Source: 6047b90 / canonical 7a3f262 / issue 41 / full source hashes and limits in manifest.json',19,'#879da9')
im.save(out/'layout.png');Image.open(out/'layout.png').verify()
sourcefiles=['src/game/roguelike/storyRooms.ts','src/game/roguelike/storyRoomTemplates.ts','src/game/roguelike/roomTemplates.ts','src/game/roguelike/authoredRoomTopologies.ts','src/game/world/expeditionGeometry.ts','src/game/world/polygonGeometry.ts','src/game/input/aimAssist.ts','tests/StoryRoute.test.ts','docs/art-evidence/room19-story-flow-v3/stage-0/attempt-1027/story.md']
manifest={'task_id':'room19-story-flow-v3','stage_index':1,'attempt':1028,'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'canonical_commit':'7a3f262886104fb024de9684958b3f85a8859f34','canonical_inputs':state['baseline_inputs'],'source_hashes':{p:sha(repo/p) for p in sourcefiles},'artifact_sha256':sha(out/'layout.png'),'dimensions':[1800,1320],'generator_sha256':sha(Path(__file__)),'validator_sha256':sha(out/'validate-layout.cjs'),'geometry_validation_sha256':sha(out/'geometry-validation.json'),'changes':'Diagram only. Current collision, anchors and breaches unchanged. Art roles and warning-read location proposed, not implemented.','technical':{'assertions':v['checks'],'radii':v['results'],'failures':0,'errors':0},'limits':v['limitations'],'generation':'node validate-layout.cjs <worktree>; python3 draw-layout.py <worktree>','review_status':'Author inspection only. Parent and independent review required.'}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'image':str(out/'layout.png'),'sha256':manifest['artifact_sha256'],'checks':v['checks'],'size_bytes':(out/'layout.png').stat().st_size}))
