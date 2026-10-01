#!/usr/bin/env python3
"""Deterministic Room17 stage1 board from layout-data.json.
Python 3, Pillow 12.3.0, Debian DejaVu Sans. No runtime artwork.
Run: python generate-layout.py [output.png]
"""
from pathlib import Path
import json,math,sys
from PIL import Image,ImageDraw,ImageFont
D=json.loads(Path(__file__).with_name('layout-data.json').read_text())
W,H,S=2400,1640,2
im=Image.new('RGB',(W*S,H*S),'#eeeae1'); draw=ImageDraw.Draw(im)
C={'ink':'#25353b','muted':'#59696b','line':'#c7ccc6','paper':'#faf8f0','solid':'#46545c','gold':'#c29c51','teal':'#287776','alt':'#727c97','floor':'#e4e9dd'}
def font(n,b=False):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',n*S)
def box(r,fill,outline=None,w=1):draw.rectangle(tuple(round(v*S) for v in r),fill=fill,outline=outline,width=w*S)
def line(points,color,w=2):draw.line([(round(x*S),round(y*S)) for x,y in points],fill=color,width=w*S,joint='curve')
def text(x,y,s,n=26,c=None,b=False):draw.text((x*S,y*S),s,font=font(n,b),fill=c or C['ink'])
def wrap(x,y,s,width=760,n=27,c=None):
 row=''
 for word in s.split():
  test=(row+' '+word).strip()
  if draw.textlength(test,font=font(n))>width*S:text(x,y,row,n,c);y+=n*1.45;row=word
  else:row=test
 text(x,y,row,n,c);return y+n*1.45
OX,OY,K=105,340,1.08
def xy(p):return OX+p[0]*K,OY+p[1]*K
def worldbox(r,fill,outline=None,w=1):
 x,y,ww,hh=r;box((*xy((x,y)),*xy((x+ww,y+hh))),fill,outline,w)
def circle(p,r,fill,outline,w=2):
 x,y=xy(p);rr=r*K;draw.ellipse(((x-rr)*S,(y-rr)*S,(x+rr)*S,(y+rr)*S),fill=fill,outline=outline,width=w*S)
def dashed(points,color,w=3,dash=12):
 for a,b in zip(points,points[1:]):
  dist=math.dist(a,b)
  for t in range(0,int(dist),dash*2):
   end=min(t+dash,dist);line([(a[0]+(b[0]-a[0])*t/dist,a[1]+(b[1]-a[1])*t/dist),(a[0]+(b[0]-a[0])*end/dist,a[1]+(b[1]-a[1])*end/dist)],color,w)
def arrow(points,color,w=4):
 line(points,color,w);x,y=points[-1];a=math.atan2(y-points[-2][1],x-points[-2][0]);draw.polygon([(x*S,y*S),((x-18*math.cos(a-.5))*S,(y-18*math.sin(a-.5))*S),((x-18*math.cos(a+.5))*S,(y-18*math.sin(a+.5))*S)],fill=color)
box((0,0,W,18),C['teal'])
text(70,48,'ROOM 17 / SHIELDING GATE',55,b=True)
text(72,126,'Clear the last defensive line before the reactor.',34)
box((1760,53,2330,108),C['ink']);text(1782,65,'STAGE 1 / LAYOUT DRAFT',28,'white',True)
text(1760,126,'Source-pinned diagram, not gameplay.',24,C['muted'])
line([(70,194),(2330,194)],C['line'])
text(72,221,'Keep the existing stepped solids. Dress the gap as the gate.',30,b=True)
text(73,269,'Top-down game coordinates. 1200 x 880 units. No topology changes.',25,C['muted'])
worldbox(D['bounds'],C['paper'],C['ink'],3)
# Coordinate grid remains behind every editorial overlay.
for x in range(100,1200,100):line([xy((x,0)),xy((x,880))],'#e3e5dd',1)
for y in range(100,880,100):line([xy((0,y)),xy((1200,y))],'#e3e5dd',1)
for x in range(0,1201,200):text(xy((x,0))[0]-12,309,str(x),18,C['muted'])
for y in range(0,881,220):text(58,xy((0,y))[1]-10,str(y),18,C['muted'])
# Broad corridor bands are editorial reservations on existing open floor.
for route in D['routes']:
 points=[xy(p) for p in route['points']]
 line(points,'#e2e8e3' if route['id']=='A' else '#e9e8ec',round(2*route['half_width']*K))
 for p in route['points']:circle(p,route['half_width'],'#e2e8e3' if route['id']=='A' else '#e9e8ec',None,1)
worldbox(D['threshold']['rect'],'#c7dcd1')
for a in D['activities']:
 circle(a['center'],a['radius'],'#dfe5d4','#7b8e79',2)
for solid in D['solids']:
 worldbox(solid['rect'],C['solid'],C['ink'],2)
 x,y,w,h=solid['rect'];text(*xy((x+12,y+h-36 if solid['id']=='S3' else y+15)),solid['id'],23,'#f8f7ef',True)
for v in D['visual_reservations']:
 x,y,w,h=v['rect'];worldbox(v['rect'],'#655f4e',C['gold'],3)
 for yy in range(y+6,y+h-8,14):line([xy((x+7,yy)),xy((x+w-7,yy))],C['gold'],2)
 text(*xy((x+12,y+32)),v['id'],22,'#ffffff',True)
for route in D['routes']:
 pts=[xy(p) for p in route['points']]
 if route['id']=='A':arrow(pts,C['teal'],4)
 else:dashed(pts,C['alt'],3)
for a in D['activities']:
 circle(a['center'],19,C['ink'],None)
 x,y=xy(a['center']);draw.text((x*S,y*S),a['id'],font=font(23,True),fill='white',anchor='mm')
# Mark original breaches with a diamond, including source anchors in corners.
for b in D['breaches']:
 x,y=xy(b);draw.polygon([(x*S,(y-10)*S),((x+10)*S,y*S),(x*S,(y+10)*S),((x-10)*S,y*S)],fill='#a86f65')
for p,label,dy in [(D['spawn'],'ENTRY',-58),(D['exit'],'EXIT',-58)]:
 circle(p,11,C['teal'],'#ffffff',2);x,y=xy(p);text(x-47,y+dy,label,22,C['teal'],True)
text(*xy((405,355)),'OPEN FLOOR',23,C['teal'],True)
text(*xy((412,403)),'400 units between solids',19,C['teal'])
text(*xy((505,88)),'B / NORTH ALTERNATE',22,C['alt'],True)
text(*xy((420,814)),'C / SOUTH ALTERNATE',22,C['alt'],True)
text(*xy((440,550)),'A / STEPPED APPROACH',20,C['teal'],True)
# Legend sits outside map. No invented structural opening in the room boundary.
text(78,1321,'Entry and exit are existing progression anchors, not new perimeter door cuts.',23,C['muted'])
line([(105,1380),(321,1380)],C['ink'],4);line([(105,1372),(105,1388)],C['ink'],3);line([(321,1372),(321,1388)],C['ink'],3)
text(115,1394,'200 game units',22,C['muted'])
text(425,1371,'x increases right. y increases down.',23,C['muted'])
# Right reading column.
RX=1490
text(RX,222,'READ THE PLAN',29,C['teal'],True)
y=281
for col,title,body in [
 (C['solid'],'Existing solids / S1-S3','Exact production collision rectangles. Their offsets create the stepped approach and outer bypasses.'),
 (C['gold'],'Proposed visual reservations / G1-G2','Nested static leaves and paired screw drives stay inside S1 and S3. No new solids, span or overhang across the gap.'),
 (C['teal'],'Open threshold / focal point','The 400-unit gap remains ordinary floor. Route A crosses it northward, then turns east toward the exit.')]:
 box((RX,y+5,RX+25,y+30),col);text(RX+43,y,title,27,b=True)
 y=wrap(RX,y+46,body,810,26,C['muted'])+30
line([(RX,y),(2325,y)],C['line']);y+=27
text(RX,y,'ACTIVITY SPACES',27,C['teal'],True);y+=48
for a in D['activities']:
 text(RX,y,a['id']+' / '+a['name'],26,b=True);y+=43
text(RX,y,'Use zones only. No spawn or combat-script edits.',23,C['muted']);y+=58
text(RX,y,'ROUTES AND CLEARANCE',27,C['teal'],True);y+=48
y=wrap(RX,y,'A is the main staged approach. B and C remain alternate lanes, each with a tested 100-unit corridor. All routes join the same entry and exit.',810,26,C['muted'])+18
y=wrap(RX,y,'Small rust diamonds mark the four existing breach anchors. Their inward spawn offsets are included in CPU checks.',810,25,C['muted'])
# Stage boundary and provenance.
box((70,1458,2330,1576),C['ink'])
text(96,1477,'STATIC LAYOUT ONLY',26,'#cfdfd6',True)
text(96,1524,'CPU occupancy, sweeps and shot checks do not prove live combat, camera readability or final mesh clearance.',26,'white')
text(73,1593,'Source 7a3f26288610 / shared layout-data.json / sourced-brief.md / room17-story-flow-v3 / attempt-1016',22,C['muted'])
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).with_name('layout.png')
im.resize((W,H),Image.Resampling.LANCZOS).save(out,compress_level=9)
print(out)
