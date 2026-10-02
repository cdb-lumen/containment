#!/usr/bin/env python3
"""Room20 stage0. Deterministic Pillow concept illustration, no runtime writes."""
from pathlib import Path
import hashlib, json, math, re
from PIL import Image, ImageDraw, ImageFont
OUT = Path(__file__).resolve().parent
ROOT = Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/overload-floor-v3')
BASE = '7a3f262886104fb024de9684958b3f85a8859f34'
FONT = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
BOLD = FONT.with_name('DejaVuSans-Bold.ttf')
W,H = 2400,1600
im = Image.new('RGB',(W,H),'#0b121b'); d = ImageDraw.Draw(im)
white='#ecf0ec'; muted='#a9bbc7'; cyan='#88daeb'; bronze='#ce995b'; red='#ed8876'; steel='#405767'
def text(x,y,s,size=26,color=white,bold=False):
    f=ImageFont.truetype(str(BOLD if bold else FONT),size)
    d.text((x,y),s,font=f,fill=color)
def line(points,c=muted,w=3): d.line(points,fill=c,width=w,joint='curve')
def box(b,fill,outline=None,w=2): d.rectangle(b,fill=fill,outline=outline,width=w)
def ellipse(b,fill=None,outline=None,w=2): d.ellipse(b,fill=fill,outline=outline,width=w)
def arrow(a,b,c=cyan,w=3):
    line([a,b],c,w); ang=math.atan2(b[1]-a[1],b[0]-a[0]); q=[]
    for off in [-.5,.5]: q.append((b[0]-16*math.cos(ang+off),b[1]-16*math.sin(ang+off)))
    d.polygon([b,*q],fill=c)
# Quiet editorial grid, never a floor hazard pattern.
box((0,0,W,12),bronze)
text(64,42,'ROOM 20   /   OVERLOAD FLOOR',24,bronze,True)
text(64,87,'The ship becomes the weapon.',57,white,True)
text(65,165,'STAGE 0 CONCEPT ONLY  |  Story intent, not layout acceptance or gameplay evidence',26,cyan)
line([(64,221),(2336,221)],steel,2)
text(64,252,'OVERLOAD CRUCIBLE',29,white,True)
text(64,298,'A reactor built to sustain the ship is deliberately driven to destroy it.',25,muted)
text(64,336,'Original-function reading is design inference. No new reactor mechanics.',22,muted)
# Source silhouette, projected for a concept cutaway, not a gameplay camera.
src=ROOT/'src/game/roguelike/authoredRoomTopologies.ts'
chunk=src.read_text().split("'overload-floor':Object.freeze({",1)[1].split('\n }),',1)[0]
boundary=json.loads(re.search(r'boundary:polygon\((\[.*?\])\)',chunk).group(1))
void=json.loads(re.search(r'voids:Object.freeze\(\[polygon\((\[.*?\])\)',chunk).group(1))
def proj(p,z=0): return (130+p[0]*1.03,450+p[1]*.57-z)
outer=[proj(p) for p in boundary]; hole=[proj(p) for p in void]
# Visible deck depth and attached under-deck supports.
for a,b in zip(outer,outer[1:]+outer[:1]):
    d.polygon([a,b,(b[0],b[1]+35),(a[0],a[1]+35)],fill='#1b2b39',outline=steel)
d.polygon(outer,fill='#293b49',outline='#738b97',width=3)
d.polygon(hole,fill='#060d15',outline='#8c9aa1',width=4)
for x,y in [proj([200,820]),proj([400,820]),proj([800,820]),proj([1000,820])]:
    d.polygon([(x-24,y+20),(x+24,y+20),(x+5,y+60)],fill='#53616a',outline='#a1aeb0')
# Axial reaction column and nested induction rings all read as one installation.
cx=748
ellipse((584,622,912,811),'#111e2c',bronze,4)
for y in [599,648,697,746]:
    box((cx-105,y,cx+105,y+37),'#243947')
    ellipse((cx-135,y+5,cx+135,y+89),'#314b5b',bronze,5)
    ellipse((cx-105,y+18,cx+105,y+73),'#0f2533',cyan,3)
box((cx-24,505,cx+24,786),'#72c8e2')
box((cx-10,507,cx+10,786),'#e9fcff')
ellipse((cx-24,493,cx+24,524),'#e9fcff',cyan,3)
for y in [564,617,672,726]:
    d.arc((cx-144,y,cx+144,y+87),0,180,fill=bronze,width=14)
    for x in [cx-140,cx+118]:
        box((x,y+29,x+24,y+56),'#dde0cc',steel)
# Distinct service heads and connected returns. Positions are illustrative only.
# Coolant header: twin bent pipes, broad manifold.
for off in [0,22]:
    line([(627,732+off),(555,732+off),(555,669+off),(597,669+off)],'#376075',16)
    line([(627,732+off),(555,732+off),(555,669+off),(597,669+off)],cyan,5)
box((569,646,630,691),'#39596c',cyan,3)
for x in [580,602,622]: ellipse((x-5,657,x+5,667),bronze)
# Power bus: parallel bronze conductors and ceramic collars.
for off in [0,18,36]:
    line([(831,682+off),(898,682+off),(923,712+off)],bronze,10)
    box((877,675+off,889,690+off),'#e5dfca')
# Restraint: heavy fork and piston.
line([(691,790),(702,755),(794,755),(807,790)],'#a2aeb1',18)
line([(746,758),(746,820)],steel,24)
line([(746,777),(746,819)],'#d1d7cf',10)
# Labels with leaders to the machine, not travel arrows.
line([(592,657),(438,546),(268,546)],cyan,2)
text(154,485,'01  COOLANT HEADER',24,cyan,True)
text(154,519,'Return plumbing',20,muted)
line([(903,705),(1077,590),(1310,590)],bronze,2)
text(1070,532,'02  POWER BUS',24,bronze,True)
text(1070,566,'Ceramic isolation',20,muted)
line([(750,801),(917,920),(1295,920)],white,2)
text(943,932,'03  RESTRAINT',24,white,True)
text(943,965,'Raised clamp and load path',20,muted)
text(73,1009,'Exposed core in the central void. Open connected lobes remain legible.',24,muted)
text(73,1045,'Assembly study only. Head placement, scale and occlusion are not approved.',22,muted)
# Narrative strip, four separate illustrated states with explicit prior authorization.
box((1450,250,2336,1110),'#111e2b',steel,2)
text(1482,276,'WHY THE PLAYER STAYS',28,white,True)
# Original function icon: reactor to ship loads.
ellipse((1490,349,1585,406),None,cyan,5); line([(1537,344),(1537,414)],cyan,10)
arrow((1595,381),(1685,381),bronze)
for y in [348,378,408]: box((1702,y,1744,y+17),'#54697b',white)
text(1780,339,'BEFORE',22,cyan,True)
text(1780,375,'Regulated ship power',24)
text(1482,451,'Coolant removes heat. Buswork carries power.',23,muted)
text(1482,485,'Restraints keep the core assembly in place.',23,muted)
line([(1482,530),(2303,530)],steel,2)
# Authorized action, not an interactable UI button.
box((1492,562,1590,636),'#3a292b',red,3)
line([(1510,596),(1530,615),(1572,577)],red,7)
text(1620,551,'ROOM 19: ALREADY AUTHORIZED',24,red,True)
text(1620,589,'The player chose Destroy ship.',25)
text(1482,655,'Passengers are alive when that choice is made.',23,muted)
text(1482,690,'This is a deliberate fatal overload, not an accident.',23,muted)
line([(1482,737),(2303,737)],steel,2)
# Stand and defend silhouette, no escape arrow.
ellipse((1517,766,1544,793),white)
line([(1530,795),(1530,848)],white,8)
line([(1530,816),(1564,812)],white,7)
line([(1530,845),(1510,869)],white,7); line([(1530,845),(1548,868)],white,7)
text(1620,766,'ROOM 20: DEFEND THE SEQUENCE',24,white,True)
text(1620,809,'Remain with the exposed reactor.',24)
text(1482,909,'NO ESCAPE',37,red,True)
text(1482,965,'No pod. No evacuation sign. No exit beacon.',23,muted)
text(1482,1007,'Compatibility exit data is not a way out.',23,muted)
# Conclusive consequence strip with ship destruction and prior warning icon.
box((64,1145,2336,1385),'#281c24',red,2)
# Broken ship pictogram.
d.polygon([(101,1237),(178,1200),(201,1235),(174,1248),(194,1282),(106,1267)],fill='#89949d')
d.polygon([(229,1202),(321,1238),(302,1269),(219,1280),(238,1248)],fill='#89949d')
for a,b in [((206,1217),(199,1190)),((217,1251),(244,1299)),((191,1240),(165,1218))]: line([a,b],red,5)
text(361,1185,'SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED',38,white,True)
text(362,1251,'Everyone aboard dies. The warning survives; the crew and passengers do not.',27,muted)
text(362,1301,'Canonical ending. This board does not introduce a rescue or another choice.',24,muted)
text(64,1420,'RETAIN FOR LATER STAGES',22,bronze,True)
text(64,1458,'Three-lobed boundary + central void. Same spawn, four breaches and compatibility anchor. No obstacles.',25)
text(64,1500,'Sector hazards are unimplemented and are not depicted. No new damaging floor areas. No runtime changes.',23,muted)
text(64,1550,'Sources: storyRooms.ts 21-29; authoredRoomTopologies.ts 76-82; issue 42.  |  Base 7a3f262  |  attempt-1031',19,muted)
im.save(OUT/'story-intent.png',compress_level=9)
files=['src/game/roguelike/storyRooms.ts','src/game/roguelike/storyRoomTemplates.ts','src/game/roguelike/roomTemplates.ts','src/game/roguelike/authoredRoomTopologies.ts']
manifest={'base_commit':BASE,'canvas':[W,H],'pillow_version':__import__('PIL').__version__,'source_sha256':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in files},'font_sha256':{str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [FONT,BOLD]},'boundary':boundary,'void':void,'ending':'SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED','scope':'Concept only. No gameplay, layout acceptance, publication or guard state changes.'}
(OUT/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'png':str(OUT/'story-intent.png'),'size':im.size,'sha256':hashlib.sha256((OUT/'story-intent.png').read_bytes()).hexdigest()}))
