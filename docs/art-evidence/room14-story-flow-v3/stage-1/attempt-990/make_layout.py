"""Deterministic Room14 stage1 diagram. Run after validate-layout.ts."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'layout.json').read_text())
V=json.loads((ROOT/'validation.json').read_text())
assert V['failures']==0
W,H=1900,1360
im=Image.new('RGB',(W,H),'#101d26'); g=ImageDraw.Draw(im)
C={'text':'#e3eef1','muted':'#adbdc5','amber':'#edbf6c','cyan':'#7ed9d5','floor':'#354955','shaft':'#172e3f','edge':'#7698a8','red':'#e89d86'}
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def text(x,y,s,size=22,fill=None,bold=False):
    g.text((x,y),s,font=ImageFont.truetype(BOLD if bold else FONT,size),fill=fill or C['text'])
def lines(x,y,ss,size=22,fill=None,step=33):
    for i,s in enumerate(ss):text(x,y+i*step,s,size,fill)
def rect(box,fill,outline=None,width=1):g.rectangle(box,fill=fill,outline=outline,width=width)
OX,OY=65,215
def p(a):return OX+a[0],OY+a[1]
def mrect(a,fill,outline=None,width=1):
    x,y,w,h=a;rect((OX+x,OY+y,OX+x+w,OY+y+h),fill,outline,width)
def line(points,fill,width=3):g.line([p(a) for a in points],fill=fill,width=width,joint='curve')
def dot(a,color,r=9):
    x,y=p(a);g.ellipse((x-r,y-r,x+r,y+r),fill=color,outline=C['text'],width=2)
def arrow(a,b,color,width=5):
    x,y=p(a);xx,yy=p(b);g.line((x,y,xx,yy),fill=color,width=width)
    angle=math.atan2(yy-y,xx-x); L=15
    g.polygon([(xx,yy),(xx-L*math.cos(angle-.5),yy-L*math.sin(angle-.5)),(xx-L*math.cos(angle+.5),yy-L*math.sin(angle+.5))],fill=color)
text(60,35,'14 / SERVICE SHAFT LANDING',38,bold=True)
text(60,93,'LAYOUT DRAFT  /  proposed topology, not gameplay or an installed room',24,C['amber'])
text(60,140,'Cross the connected service platforms. Reach the lower decks.',27)
# Orthographic plan, exactly one pixel per world unit.
mrect((0,0,1200,880),C['floor'],C['edge'],4)
for x in range(40,1200,40):line([(x,4),(x,876)],'#3c505b',1)
for y in range(40,880,40):line([(4,y),(1196,y)],'#3c505b',1)
# Activity zones are painted floor, not added collision.
for box in [(45,345,250,195),(55,45,245,145),(940,270,210,230),(625,685,265,130)]:
    mrect(box,'#405763','#68818b',2)
shaft=D['shaft'];g.polygon([p(a) for a in shaft],fill=C['shaft'])
# Solid shaft edge. Small curb remains inside the void.
line(shaft+[shaft[0]],C['amber'],5)
# Single pale inset contour makes the depth readable without hiding the far side.
line([(366,268),(874,268),(874,567),(1176,567)],'#466c83',3)
line([(366,268),(366,611),(1176,611)],'#466c83',3)
# Schematic below-deck guide assembly, not detailed modelling.
mrect((460,310,240,240),'#223e4d','#7d99a5',3)
for x in (475,685):line([(x,290),(x,571)],'#7e98a5',7)
line([(475,320),(685,550)],'#536f80',6)
line([(685,320),(475,550)],'#536f80',6)
mrect((510,330,135,190),'#395666','#aac0c9',3)
for y in range(345,511,22):line([(520,y),(635,y)],'#74929f',3)
for x in (491,668):
    for y in (351,502):dot((x,y),'#a8b9be',9)
text(OX+410,OY+263,'FOCAL SHAFT',25,C['amber'],True)
text(OX+397,OY+572,'Guide + counterweight below deck',20,C['muted'])
text(OX+744,OY+302,'SOLID VOID',20,C['amber'],True)
lines(OX+744,OY+346,['No floor.','No crossing.'],20,C['muted'])
# Control face is entirely inside shaft footprint, approach stays on floor.
mrect((340,380,40,50),'#837459',C['amber'],3)
line([(351,390),(361,400),(352,410)],C['cyan'],3)
# Reserved full C band, exactly 60 units wide for radius30 test envelope.
for name in ['full_c','progression']:
    line(D['routes'][name],'#48686d',60)
# Return/pursuit route uses cyan dashes, not a second mandatory objective.
r=D['routes']['full_c']
for a,b in zip(r,r[1:]):
    length=math.dist(a,b);n=max(1,int(length/22))
    for j in range(0,n,2):
        t=j/n;u=min(1,(j+1)/n)
        line([(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u)],C['cyan'],4)
line(D['routes']['progression'],C['amber'],5)
for a,b in [((180,345),(180,285)),((565,140),(655,140)),((1040,250),(1040,310)),((1040,440),(1100,440))]:arrow(a,b,C['amber'])
arrow((820,740),(740,740),C['cyan'],4)
arrow((180,650),(180,580),C['cyan'],4)
line(D['routes']['local_control'],C['cyan'],3)
dot((280,405),C['cyan'],7)
# Markers, coordinate anchors unchanged from production.
dot(D['spawn'],C['amber'],11);dot(D['exit'],C['amber'],11)
text(OX+28,OY+363,'ENTRY',23,C['amber'],True)
text(OX+28,OY+394,'100 / 440',18)
text(OX+947,OY+350,'EXIT',23,C['amber'],True)
text(OX+947,OY+383,'1100 / 440',18)
text(OX+944,OY+472,'To lower decks',20)
for i,a in enumerate(D['breaches']):
    dot(a,C['red'],9)
    x,y=p(a);g.rectangle((x-6,y-6,x+6,y+6),outline=C['red'],width=2)
    text(x-28,y+(15 if a[1]<400 else 18),f'B{i+1}',19,C['red'],True)
    offset=(a[0]+(56 if a[0]<600 else -56),a[1]);dot(offset,C['red'],4)
text(OX+320,OY+56,'NORTH TRANSIT / FAR EDGE',23,bold=True)
text(OX+46,OY+250,'WEST JUNCTION',21,bold=True)
text(OX+406,OY+796,'SOUTH SERVICE / PURSUIT RETURN',23,bold=True)
text(OX+48,OY+526,'LOCAL CONTROL',18,C['cyan'],True)
line([(280,405),(294,500),(184,516)],C['cyan'],2)
# Dimension labels outside route field.
text(OX+7,OY-30,'0',18,C['muted']);text(OX+1100,OY-30,'1200 units',18,C['muted'])
text(OX+7,OY+886,'880',18,C['muted'])
# Right column, readable scope and exact story boundary.
RX=1320
text(RX,210,'01  CIRCULATION',25,C['amber'],True)
lines(RX,257,['Amber: entry to exit.','Cyan: full C service return.','All four breach anchors retained.','Small red dots: 56-unit inward offsets.'],22)
text(RX,412,'02  SPACE + PURPOSE',25,C['amber'],True)
lines(RX,459,['North / south arms: 240 units.','West spine: 340 units.','East exit landing: 300 units.','Wide turns for pursuit and pickups.','Rails and machines stay in the void.'],22)
text(RX,646,'03  BASELINE → PROPOSAL',25,C['amber'],True)
# Baseline inset uses exact production rectangles, scaled consistently.
bx,by,sc=RX,700,.30
rect((bx,by,bx+1200*sc,by+880*sc),'#354955',C['edge'],2)
for o in V['baseline']['obstacles']:
    x,y,w,h=[o[k]*sc for k in ['x','y','width','height']]
    rect((bx+x,by+y,bx+x+w,by+y+h),'#162e3f',C['amber'],2)
for a in [D['spawn'],D['exit'],*D['breaches']]:
    x,y=bx+a[0]*sc,by+a[1]*sc;g.ellipse((x-3,y-3,x+3,y+3),fill=C['red'])
lines(RX,984,['Existing: 3 rectangular machine solids.','Draft: one east-open shaft void.','Same envelope, entry, exit and breaches.','Runtime source is unchanged.'],21,step=31)
# Exact AI boundary, explicitly not a planar cutoff across the room.
rect((60,1143,1840,1251),'#253b43','#64858f',2)
text(84,1156,'LOCAL ACCESS ONLY. AI connection lost below this landing.',30,C['amber'],True)
text(84,1203,'Pulled fiber + empty socket at the west junction. Call plate is context, not an interaction objective.',24)
text(60,1277,f"CPU layout checks: {V['passed']} passed / 0 failed. Radii 16, 28 and 30. Diagram only, not live combat.",23,C['cyan'])
text(60,1316,'No jump, fall, lift-use, reconnect or overload mechanic. Shaft-edge visibility at shipping cameras remains untested.',20,C['muted'])
im.save(ROOT/'layout-draft.png',optimize=True)
print(f'{ROOT / "layout-draft.png"} | {W}x{H}')
