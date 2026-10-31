#!/usr/bin/env python3
"""Deterministic stage1 layout from production-helper geometry export. CPU only."""
from pathlib import Path
import hashlib,json,math,subprocess
from PIL import Image,ImageDraw,ImageFont,__version__ as pillow_version
OUT=Path(__file__).resolve().parent
ROOT=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/overload-floor-v3')
r=json.loads((OUT/'route-results.json').read_text())
assert r['summary']['failures']==0
im=Image.new('RGB',(2400,1600),'#0c141d');d=ImageDraw.Draw(im)
FONT=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');BOLD=FONT.with_name('DejaVuSans-Bold.ttf')
white='#e7efee';muted='#a8b9c4';cyan='#74d8e1';gold='#e3b573';green='#9cd8b1';red='#e59185'
def text(x,y,s,size=25,color=white,bold=False): d.text((x,y),s,font=ImageFont.truetype(str(BOLD if bold else FONT),size),fill=color)
def xy(p):return (90+p['x']*1.22,260+p['y']*1.22)
def line(points,fill,width=3):d.line([xy(p) for p in points],fill=fill,width=width,joint='curve')
def disc(p,radius,fill=None,outline=None,width=2):
 x,y=xy(p);d.ellipse((x-radius,y-radius,x+radius,y+radius),fill=fill,outline=outline,width=width)
def rect(bounds,fill,outline):
 x,y,X,Y=bounds;d.rectangle((90+x*1.22,260+y*1.22,90+X*1.22,260+Y*1.22),fill=fill,outline=outline,width=3)
text(64,36,'ROOM 20 / OVERLOAD FLOOR',26,gold,True)
text(64,80,'Hold the reactor. Keep the platform open.',49,white,True)
text(64,151,'STAGE 1 LAYOUT PROPOSAL  |  Top-down source geometry, not a gameplay capture or acceptance',25,cyan)
d.line((64,214,2336,214),fill='#3e5360',width=2)
# Coordinate grid is diagram furniture only, not a floor material proposal.
for x in range(0,1201,200):
 line([{'x':x,'y':0},{'x':x,'y':880}],'#1b2a36',1);text(90+x*1.22,229,str(x),17,muted)
for y in range(0,881,200):
 line([{'x':0,'y':y},{'x':1200,'y':y}],'#1b2a36',1);text(30,253+y*1.22,str(y),17,muted)
d.polygon([xy(p) for p in r['geometry']['boundary']],fill='#304551',outline='#bcc8cb',width=4)
d.polygon([xy(p) for p in r['geometry']['voids'][0]],fill='#111b26',outline=gold,width=4)
# Radius28 envelope around the exact tested closed polyline.
loop=r['loop']+[r['loop'][0]]
line(loop,'#3d665f',68)
for p in r['loop']:disc(p,34,fill='#3d665f')
line(loop,green,4)
for c in r['connectors']:line(c['points'],green,2)
# Arrowheads indicate reversible retreat around the core, never escape.
for idx in [1,3,5,7]:
 a=xy(loop[idx]);b=xy(loop[idx+1]);mx=(a[0]+b[0])/2;my=(a[1]+b[1])/2;angle=math.atan2(b[1]-a[1],b[0]-a[0])
 for direction in [-1,1]:
  px=mx+direction*12*math.cos(angle);py=my+direction*12*math.sin(angle);ang=angle+(math.pi if direction<0 else 0)
  d.polygon([(px,py),(px-12*math.cos(ang-.5),py-12*math.sin(ang-.5)),(px-12*math.cos(ang+.5),py-12*math.sin(ang+.5))],fill=green)
for h,color,letter in zip(r['heads'],[cyan,gold,white],['C','P','R']):
 rect(h['bounds'],'#334959',color);x,y,X,Y=h['bounds'];text(90+(x+X)*.61-12,260+(y+Y)*.61-18,letter,29,color,True)
rect(r['core'],'#244d60',cyan);text(790,745,'CORE',19,white,True)
text(675,646,'REACTOR FOOTPRINT',19,gold,True)
# The void is identified in the sidebar, with no label across its lower edge.
for i,b in enumerate(r['geometry']['breaches'],1):
 x,y=xy(b);d.polygon([(x,y-12),(x+12,y),(x,y+12),(x-12,y)],fill=red)
 text(x+18,y-18,f'B{i}',23,red,True)
 inner=r['anchors']['inward'+str(i)];disc(inner,5,red)
 line([b,inner],red,2)
for name,label,off in [('west','W',(-38,16)),('north','N',(14,-39)),('east','E',(16,16)),('south','S',(15,15)),('coolant-view','V1',(-60,-28)),('power-view','V2',(20,-28)),('restraint-view','V3',(18,-23))]:
 p=r['anchors'][name];disc(p,8,'#0c141d',green,3);x,y=xy(p);text(x+off[0],y+off[1],label,23,green,True)
p=r['anchors']['spawn'];disc(p,11,white);x,y=xy(p);text(x-52,y-60,'SPAWN',23,white,True);text(x-53,y+23,'140,440',19,muted)
# No marker, label or arrow is drawn at the compatibility exit coordinate.
d.rectangle((1600,245,2336,1360),fill='#14212d',outline='#3e5360',width=2)
text(1630,273,'DEFEND THE AUTHORIZED OVERLOAD',26,white,True)
for y,s in [(320,'No new switch, objective or sector hazard.'),(357,'Retreat within the room. There is no escape.')]:text(1630,y,s,24,muted)
text(1630,424,'SERVICE ALLOCATIONS',24,gold,True)
for y,title,detail,color in [(472,'C  Coolant header','x480..540 / y340..410',cyan),(557,'P  Power bus','x660..720 / y340..410',gold),(642,'R  Restraint head','x565..635 / y480..540',white)]:
 text(1630,y,title,28,color,True);text(1630,y+38,detail,23,muted)
text(1630,744,'All head bounds sit inside the existing void.',24)
text(1630,783,'Core reservation: x570..630 / y365..465.',23,muted)
text(1630,833,'CIRCULATION / DIAGRAM LEGEND',24,green,True)
for y,s in [(879,'Green loop: tested radius28 swept corridor.'),(917,'Centerline also tested at radius16.'),(955,'W / N / E / S: open defense positions.'),(993,'V1 / V2 / V3: viewing positions, not controls.'),(1031,'B1..B4: exact breaches. Dots: inward +56.'),(1069,'Pale edge: unchanged platform boundary.'),(1107,'Dark center: existing nonwalkable void.')]:text(1630,y,s,23,muted)
text(1630,1170,'Compatibility anchor retained and tested.',24)
text(1630,1208,'It is deliberately not marked on the plan.',24)
text(1630,1260,'No added obstacles. No under-deck model yet.',23,gold)
text(64,1394,'GEOMETRY ONLY',23,gold,True)
text(64,1434,'Production occupancy and continuous swept-disc traversal checks. Diagram routes are not AI or combat evidence.',25)
text(64,1480,'Next checks: 3D fit, under-deck supports, shipping-zoom readability, overload lighting and the real fatal sequence.',24,muted)
text(64,1536,'Source: authoredRoomTopologies.ts + production expeditionGeometry.ts  |  Room20 stage1 / attempt1032',21,muted)
im.save(OUT/'layout.png',compress_level=9)
files=['src/game/roguelike/'+n for n in ['storyRooms.ts','storyRoomTemplates.ts','roomTemplates.ts','authoredRoomTopologies.ts','types.ts']]+['src/game/world/expeditionGeometry.ts','src/game/world/polygonGeometry.ts','src/game/input/aimAssist.ts']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest={'task':'room20-story-flow-v3','stage':1,'attempt':1032,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'origin_main':subprocess.check_output(['git','rev-parse','origin/main'],cwd=ROOT,text=True).strip(),'source_sha256':{p:sha(ROOT/p) for p in files},'generator_sha256':{p:sha(OUT/p) for p in ['generate.py','check-routes.mjs','ts-loader.mjs']},'font_sha256':{str(p):sha(p) for p in [FONT,BOLD]},'pillow_version':pillow_version,'canvas':list(im.size),'layout_sha256':sha(OUT/'layout.png'),'route_results_sha256':sha(OUT/'route-results.json'),'summary':r['summary'],'scope':'Local stage1 proposal. No runtime writes, GPU, publication, independent review or acceptance.'}
(OUT/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'png':str(OUT/'layout.png'),'sha256':manifest['layout_sha256'],'summary':r['summary']}))
