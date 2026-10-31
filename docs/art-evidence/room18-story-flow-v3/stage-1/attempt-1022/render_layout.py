"""Deterministic Pillow diagram. Run after check_layout.cjs writes layout-data.json."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'layout-data.json').read_text())
P=D['proposal']; B=D['baseline']
W,H=1800,1320
im=Image.new('RGB',(W,H),'#101b23'); dr=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def text(x,y,s,size=22,color='#dce6e8',weight=False):
    dr.text((x,y),s,font=ImageFont.truetype(bold if weight else font,size),fill=color)
def lines(x,y,items,size=21,color='#b8c9ce',step=31):
    for i,s in enumerate(items): text(x,y+i*step,s,size,color)
def panel(box,fill='#192a35',outline='#38515f'):
    dr.rectangle(box,fill=fill,outline=outline,width=2)
def xy(p,ox=65,oy=230,s=.85): return (ox+p['x']*s,oy+p['y']*s)
def pg(points,**kw): return [xy(p,**kw) for p in points]
def line(points,color,width=5,**kw):dr.line(pg(points,**kw),fill=color,width=width,joint='curve')
def arrow(a,b,color):
    a,b=xy(a),xy(b);dr.line([a,b],fill=color,width=5)
    ang=math.atan2(b[1]-a[1],b[0]-a[0]); L=17
    dr.polygon([b,(b[0]-L*math.cos(ang-.5),b[1]-L*math.sin(ang-.5)),(b[0]-L*math.cos(ang+.5),b[1]-L*math.sin(ang+.5))],fill=color)
def point(x,y):return {'x':x,'y':y}
text(48,30,'18 / CONTAINMENT ANNULUS',38,weight=True)
text(48,86,'Layout draft / attempt 1022 / top-down game coordinates / not implemented',23)
dr.line((48,130,1752,130),fill='#d8b467',width=3)
text(48,154,'PROPOSAL',23,'#e1be78',True)
text(232,157,'One floor ring. One shared solid center. Both directions open.',23)
# measured proposal
panel((48,210,1104,1002),'#14232d')
for x in range(0,1201,100):
    a=xy(point(x,0));b=xy(point(x,880));dr.line([a,b],fill='#20333f')
for y in range(0,881,100): dr.line([xy(point(0,y)),xy(point(1200,y))],fill='#20333f')
dr.polygon(pg(P['boundary']),fill='#304651',outline='#829ba5',width=3)
dr.polygon(pg(P['voids'][0]),fill='#0a131b',outline='#c4c8b9',width=5)
# Two routed branches from same entry to same exit.
line(P['routes']['entry_to_exit_north'],'#7ec4ba',6)
line(P['routes']['entry_to_exit_south'],'#d9b56c',6)
for a,b,col in [(point(490,140),point(560,140),'#7ec4ba'),(point(700,740),point(770,740),'#d9b56c'),(point(240,380),point(240,300),'#7ec4ba'),(point(240,500),point(240,580),'#d9b56c')]:arrow(a,b,col)
# Origin, dimensions and orientation.
text(68,211,'0,0',16,'#8ea7b4');text(492,211,'1200 units',18)
text(69,978,'+y down',16,'#8ea7b4');text(947,978,'+x right',16,'#8ea7b4')
text(460,279,'200 clear',18,'#cdd8dd')
text(461,894,'200 clear',18,'#cdd8dd')
text(399,310,'CLOCKWISE',17,'#7ec4ba',True)
text(356,877,'COUNTERCLOCKWISE',17,'#d9b56c',True)
# Canonical anchors. Offset spawn proxies are checked but not cluttered into diagram.
for i,b in enumerate(D['source_template']['breaches']):
    x,y=xy(b);dr.rectangle((x-9,y-9,x+9,y+9),fill='#cba39e')
    text(x+16,y-13,f'B{i}',18,'#ecd6cf',True)
for label,key in [('ENTRY','spawn'),('EXIT','exit')]:
    x,y=xy(D['source_template'][key]);dr.ellipse((x-12,y-12,x+12,y+12),fill='#e5ebed')
    text(x-39,y+22,label,18,weight=True)
    text(x-42,y+47,f"{D['source_template'][key]['x']},440",15)
# Core labels and baseline retained center inset.
text(406,491,'SHIELDED CENTER',25,'#dedfcd',True)
text(445,530,'SOLID / NO ACCESS',20,'#dedfcd')
text(433,565,'Proposed 480 x 400',20)
text(424,598,'Baseline center retained',17,'#9eb3bd')
# Baseline footprint is isolated in the sidebar, not overprinted on proposal labels.
# Separate indicators inside solid reservation.
for s,col in zip(P['status_panels'],['#7ec4ba','#d9b56c']):
    x,y=xy(s['point']);dr.rectangle((x-11,y-23,x+11,y+23),fill=col)
    text(x-8,y-13,s['id'],18,'#14212b',True)
for a in P['activities']:
    x,y=xy(a['point']);dr.ellipse((x-15,y-15,x+15,y+15),fill='#223640',outline='#e2ecee',width=2)
    text(x-8,y-13,a['id'],19,weight=True)
    line(a['approach'],'#e2ecee',2)
# sidebar baseline
panel((1140,154,1750,561))
text(1162,174,'BASELINE / SOURCE GEOMETRY',23,weight=True)
text(1162,212,'1200 x 880 rectangle + five solid blocks',19)
kw={'ox':1217,'oy':253,'s':.32}
dr.rectangle((1217,253,1601,534),fill='#304651',outline='#829ba5',width=2)
for r in B['obstacles']:
    a=xy(point(r['x'],r['y']),**kw);b=xy(point(r['x']+r['width'],r['y']+r['height']),**kw)
    dr.rectangle((*a,*b),fill='#0a131b',outline='#aeb8b2',width=2)
for k in ['spawn','exit']:
    x,y=xy(D['source_template'][k],**kw);dr.ellipse((x-5,y-5,x+5,y+5),fill='#e5ebed')
for b in D['source_template']['breaches']:
    x,y=xy(b,**kw);dr.rectangle((x-4,y-4,x+4,y+4),fill='#cba39e')
text(1630,319,'No',18);text(1630,345,'polygon',18);text(1630,371,'override',18)
panel((1140,581,1750,833))
text(1162,601,'WHAT CHANGES',22,'#e1be78',True)
lines(1162,645,['Outer edge inset 40; corners clipped 40.', 'Central 260 x 260 block becomes one', '480 x 400 chamfered solid reservation.', 'Four detached corner blocks removed.', 'Entry, exit and all four breaches unchanged.'],20,step=32)
panel((1140,852,1750,1017),'#1d393a','#6ba59e')
text(1162,871,'V / PASSENGER VITALS',20,'#7ec4ba',True)
text(1162,909,'PASSENGERS ALIVE',27,weight=True)
text(1162,956,'Read at 930,350. No arming implication.',19)
panel((1140,1034,1750,1201),'#373326','#a48952')
text(1162,1053,'A / AUTHORIZATION',20,'#dfbd79',True)
text(1162,1091,'OVERLOAD IS NOT ARMED',25,weight=True)
text(1162,1137,'Read at 930,490. Manual consent still needed.',18)
# lower notes
text(52,1030,'N / S   INSPECTION     V / A   STATUS READ AREAS',21,weight=True)
lines(52,1074,['White circles are walking/reading anchors, not new interactions.', 'B0-B3 are canonical breaches. Small panel bars stay inside solid.', 'Supports below deck; cables inside solid or below circulation.', 'Shielding heights and far-arc actor visibility await in-scene review.'],21,step=32)
dr.line((48,1226,1752,1226),fill='#38515f',width=2)
text(48,1246,'CPU CHECKED: radii 16 / 28 / 30, route segments, anchors and sampled connectivity.',20)
text(48,1280,'Not gameplay, live combat, pickup simulation or camera proof. Sources and exact coordinates in layout-data.json.',18,'#9ab0bc')
im.save(ROOT/'layout-draft.png')
print(ROOT/'layout-draft.png')
