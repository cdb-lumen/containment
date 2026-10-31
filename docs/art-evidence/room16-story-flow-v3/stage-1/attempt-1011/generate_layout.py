"""Deterministic stage1 diagram. Coordinates come only from layout/check JSON."""
from pathlib import Path
import json, argparse, hashlib
from PIL import Image, ImageDraw, ImageFont
P=Path(__file__).parent
ap=argparse.ArgumentParser();ap.add_argument('--output',default=str(P/'room16-layout-original.png'));args=ap.parse_args()
L=json.loads((P/'layout.json').read_text()); C=json.loads((P/'cpu-validation.json').read_text()); B=C['baseline']
assert C['proposal']==L and C['pass']
W,H=2800,1780
im=Image.new('RGB',(W,H),'#101820');d=ImageDraw.Draw(im)
def font(n,b=False):return ImageFont.truetype(str(P/'fonts'/('DejaVuSans-Bold.ttf' if b else 'DejaVuSans.ttf')),n)
def text(x,y,s,n=25,c='#dce5ea',b=False):d.text((x,y),s,font=font(n,b),fill=c)
text(65,35,'ROOM 16 / SWARM JUNCTION',47,b=True)
text(65,103,'Stage 1 layout proposal. Source baseline at 04aab8d. Not gameplay or a finished model.',27,c='#a8bac4')
text(65,148,'Break the concentrated swarm guarding reactor access.',31,c='#e5d5aa')
S=1.02; Y=310
routecolors={'entry-exit':'#6cd5ed','west-south':'#f0bd65','south-east':'#f0bd65','east-west':'#6cd5ed'}
def panel(X,proposed):
 def p(q):return (X+q[0]*S,Y+q[1]*S)
 def line(points,col,w):d.line([p(q) for q in points],fill=col,width=w,joint='curve')
 def rect(r,fill,outline=None,w=2):d.rectangle([p([r['x'],r['y']]),p([r['x']+r['width'],r['y']+r['height']])],fill=fill,outline=outline,width=w)
 def label(q,t,col='#dce5ea',size=22):a=p(q);text(a[0],a[1],t,size,col)
 d.rectangle([p([0,0]),p([1200,880])],fill='#202b33',outline='#b6c4ca',width=4)
 for x in range(100,1200,100):line([[x,0],[x,880]],'#2c3841',1)
 for y in range(100,880,100):line([[0,y],[1200,y]],'#2c3841',1)
 if proposed:
  # Flush service channels remain visible beyond the torn root ends.
  for run in L['shipServiceRuns']:
   line(run,'#65747c',22);line(run,'#17242c',11)
  rect(L['gantry'],'#82959d')
  label([440,38],'FAR-WALL DIRECTIONAL GANTRY',size=19)
  poly=[p(q) for q in L['organPolygon']]
  d.polygon(poly,fill='#665850',outline='#cfbba2',width=4)
  for end in [[400,135],[800,135],[600,365]]:line([end,L['focal']],'#b8a18a',9)
  cx,cy=p(L['focal']);d.ellipse((cx-32,cy-23,cx+32,cy+23),fill='#111920',outline='#d8c5ac',width=3)
  label([325,175],'ROOT A',size=21);label([820,175],'ROOT B',size=21);label([637,337],'ROOT C',size=21)
  label([405,290],'ONE LOW',size=20);label([390,317],'ROUTING ORGAN',size=20)
  # Reserved combat space, not another collision shape.
  d.ellipse([p([485,405]),p([715,555])],outline='#8c8f66',width=2)
 else:
  for i,r in enumerate(B['obstacles']):
   rect(r,'#667780','#aab7be');label([r['x']+10,r['y']+35],f'SOLID {i+1}',size=25)
 # Display all tested paths in proposal; baseline only existing direct progression.
 routes=L['routes'] if proposed else {'entry-exit':L['routes']['entry-exit']}
 for name,pts in routes.items():
  col=routecolors.get(name,'#6a9688');line(pts,col,5 if name in routecolors else 3)
  if len(pts)>1:
   a,b=pts[-2:];vx=b[0]-a[0];vy=b[1]-a[1];norm=(vx*vx+vy*vy)**.5;ux,uy=vx/norm,vy/norm
   d.polygon([p(b),p([b[0]-14*ux+7*uy,b[1]-14*uy-7*ux]),p([b[0]-14*ux-7*uy,b[1]-14*uy+7*ux])],fill=col)
 for name,v in [('ENTRY',[100,440]),('EXIT',[1100,440])]:
  x,y=p(v);d.ellipse((x-11,y-11,x+11,y+11),fill='#7fdbed');label([v[0]-42,v[1]-48],name,size=23)
 for i,b in enumerate(B['breaches']):
  x,y=p([b['x'],b['y']]);d.rectangle((x-9,y-9,x+9,y+9),fill='#e7a67c');label([b['x']-28,b['y']+16],f'B{i+1}',size=21)
 x,y=p([600,440]);d.ellipse((x-9,y-9,x+9,y+9),outline='#ffffff',width=3)
 if proposed:
  for name,v in L['arms'].items():
   x,y=p(v);d.ellipse((x-14,y-14,x+14,y+14),outline='#f0bd65',width=3)
  for v in L['activities'].values():
   x,y=p(v);d.rectangle((x-5,y-5,x+5,y+5),fill='#c3ce9e')
  label([150,470],'WEST ARM',size=23);label([940,470],'EAST ARM',size=23);label([505,770],'SOUTH ARM',size=23)
  label([465,565],'SWARM / ESCAPE TURNS',size=22)
 label([15,840],'0',size=20);label([1050,840],'1200 x 880',size=20)
text(70,226,'A  /  CURRENT COLLISION BASELINE',32,b=True)
text(70,270,'Three separate solids. Unchanged rectangular room.',24,c='#a8bac4')
text(1490,226,'B  /  PROPOSED THREE-ROOT JUNCTION',32,b=True)
text(1490,270,'One sealed solid. Clear combat floor wraps its south end.',24,c='#a8bac4')
panel(70,False);panel(1490,True)
text(70,1240,'READ THE SHIP FIRST',29,b=True)
text(70,1290,'Three cable trunks once fed a low distributor.',26)
text(70,1330,'Growth follows their directions into one organ.',26)
text(70,1370,'Exposed metal runs and the far-wall gantry survive.',26)
text(70,1430,'Grey channels are flush floor marks, not solid roots.',24,c='#b6c6cf')
text(70,1470,'Charcoal/bone footprint is the proposed solid envelope.',24,c='#b6c6cf')
text(1490,1240,'ROUTES AND CONSTRAINTS',29,b=True)
text(1490,1290,'Cyan: entry to exit. Amber: turns between all three arms.',25)
text(1490,1330,'Green: four breach approaches and north service bypass.',25)
text(1490,1370,'Orange squares: fixed breaches. Pale squares: activity anchors.',24)
text(1490,1410,'White ring: preserved center compatibility anchor, 600 / 440.',24)
text(1490,1470,'Radius 16 / 28: every proposed route and anchor passes.',25,c='#a8d2ae')
text(1490,1510,'20-unit grid: one component at each radius. CPU checks only.',24,c='#a8d2ae')
d.line([(70,1585),(2725,1585)],fill='#46565f',width=2)
text(70,1610,'Boundary, 1200 x 880 camera envelope, entry, exit and all four breach anchors stay fixed.',27,b=True)
text(70,1657,'Baseline is source geometry, not a reconstruction of original ship art. Proposed drawing is a layout, not native gameplay.',25)
text(70,1700,'No runtime edit, new boss, emitter, AI behavior or approval. Spawn visibility and legal encounter stress remain later-stage checks.',24,c='#a8bac4')
with open(args.output,'xb') as f:im.save(f,format='PNG')
print(json.dumps({'output':args.output,'size':[W,H],'sha256':hashlib.sha256(Path(args.output).read_bytes()).hexdigest()}))
