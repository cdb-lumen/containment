"""Stage1 proposed layout only. CPU geometry checks, not runtime gameplay."""
import json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
OUT=Path(__file__).resolve().parent
B=[(40,200),(760,40),(1160,160),(1160,640),(860,840),(280,840),(40,600)]
SCAR=[(440,300),(610,220),(940,460),(820,570),(560,470)]
CARGO=[[(300,600),(400,600),(400,670),(300,670)],[(640,740),(760,740),(760,790),(640,790)]]
ENTRY=(140,440); EXIT=(1080,520)
BREACHES=[(220,260),(1000,240),(300,740),(860,720)]
ROUTES={'north': [ENTRY,(240,320),(370,235),(570,150),(770,160),(1020,360),EXIT],
        'south':[ENTRY,(220,510),(420,550),(590,620),(970,640),EXIT]}
def edges(poly): return list(zip(poly,poly[1:]+poly[:1]))
def distance(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
def cross(a,b,c): return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def intersects(a,b,c,d):
    return cross(a,b,c)*cross(a,b,d)<=0 and cross(c,d,a)*cross(c,d,b)<=0 and max(min(a[0],b[0]),min(c[0],d[0]))<=min(max(a[0],b[0]),max(c[0],d[0])) and max(min(a[1],b[1]),min(c[1],d[1]))<=min(max(a[1],b[1]),max(c[1],d[1]))
def segdist(a,b,c,d):
    return 0 if intersects(a,b,c,d) else min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b))
def inside(p,poly):
    x,y=p; hit=False
    for a,b in edges(poly):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: hit=not hit
    return hit
OBS=[SCAR]+CARGO
def clear(p,r=38):
    return inside(p,B) and min(distance(p,a,b) for a,b in edges(B))>=r and all(not inside(p,o) and min(distance(p,a,b) for a,b in edges(o))>=r for o in OBS)
def route_clearance(route):
    assert all(clear(p,0) for p in route)
    return min(segdist(a,b,c,d) for a,b in zip(route,route[1:]) for o in [B]+OBS for c,d in edges(o))
checks={n:route_clearance(r) for n,r in ROUTES.items()}
assert all(v>=38 for v in checks.values()),checks
assert all(clear(p) for p in [ENTRY,EXIT]+BREACHES)
assert not clear((610,350)), 'solid scar control must fail'
assert not clear((350,630)), 'freight control must fail'
assert not clear((45,400)), 'wall clearance control must fail'
assert segdist((0,0),(10,10),(0,10),(10,0))==0
assert min(segdist(ENTRY,(610,350),a,b) for a,b in edges(SCAR))==0, 'scar crossing must fail'
# Connect each retained enemy arrival anchor to either loop using a clear segment.
connections=[]
for p in BREACHES:
    candidates=[q for r in ROUTES.values() for q in r if min(segdist(p,q,a,b) for o in [B]+OBS for a,b in edges(o))>=38]
    assert candidates,p
    q=min(candidates,key=lambda q:math.dist(p,q));connections.append([p,q])
# No new geometry has left the physical shell or overlapped other solid footprints.
for i,o in enumerate(OBS):
    assert all(inside(p,B) for p in o)
    for other in OBS[i+1:]:
        assert not any(inside(p,other) for p in o)
        assert not any(intersects(a,b,c,d) for a,b in edges(o) for c,d in edges(other))
report={'kind':'continuous planar draft geometry, not shipping navigation or gameplay','source':'7a3f262886104fb024de9684958b3f85a8859f34','radius_tested':[16,28,38],'routes_min_clearance':checks,'retained_breach_connections':connections,'negative_controls':['solid scar','freight occupancy','wall margin','crossed segments'],'failures':0,'errors':0}
(OUT/'geometry-checks.json').write_text(json.dumps(report,indent=2)+'\n')
(OUT/'layout.json').write_text(json.dumps({'boundary':B,'solid_scar':SCAR,'freight':CARGO,'entry':ENTRY,'exit':EXIT,'enemy_arrivals':BREACHES,'routes':ROUTES,'template_envelope':[1200,880],'runtime_applied':False},indent=2)+'\n')
W,H=1680,1270
im=Image.new('RGB',(W,H),'#101a22');d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def f(s):return ImageFont.truetype(font,s)
def text(x,y,t,size=22,col='#e4e9e9'): d.text((x,y),t,font=f(size),fill=col)
text(48,30,'08 / BREACHED LOADING BAY',40)
text(49,88,'STAGE 1  /  TOP-DOWN LAYOUT DRAFT  /  NOT A GAMEPLAY SCREENSHOT',20,'#76c9d1')
text(49,126,'Fight around the sealed breach.',28)
text(49,168,'Alien growth follows the boarding scar. Hull seal intact.',21,'#b1bfbd')
OX,OY,S=50,230,1.05
def pt(p):return (round(OX+p[0]*S),round(OY+p[1]*S))
def poly(p,fill,outline=None,width=1):d.polygon([pt(q) for q in p],fill=fill);d.line([pt(q) for q in p+[p[0]]],fill=outline or fill,width=width)
poly(B,'#23343c','#99afb3',7)
# Subtle planning grid clipped to the footprint.
for x in range(80,1160,80):
    for y in range(80,840,80):
        if inside((x,y),B):
            px,py=pt((x,y));d.ellipse((px-1,py-1,px+1,py+1),fill='#466068')
# Full radius38 clearance corridors, followed by centerline arrows.
for name,route in ROUTES.items():
    d.line([pt(p) for p in route],fill='#2e5359',width=round(76*S),joint='curve')
    for p in route:
        x,y=pt(p);r=38*S;d.ellipse((x-r,y-r,x+r,y+r),fill='#2e5359')
for p,q in connections:d.line([pt(p),pt(q)],fill='#667b91',width=3)
poly(SCAR,'#6b6855','#b8b195',4)
# Damage is a sealed, solid footprint, never a hole or a playable void.
d.line([pt(p) for p in [(477,318),(600,273),(710,364),(816,418),(901,469)]],fill='#30382e',width=17)
for k,p in enumerate([(463,316),(483,343),(502,370),(533,410),(570,454),(627,471),(688,493),(747,520),(810,538)]):
    x,y=pt(p);r=10+(k%3)*3;d.ellipse((x-r,y-r,x+r,y+r),fill='#769061',outline='#a1b77a',width=2)
for i,o in enumerate(CARGO):
    poly(o,'#9a7147','#dec08a',3)
    x,y=pt(o[0]);text(x+11,y+12,'F'+str(i+1),22,'#fff0cf')
for name,route in ROUTES.items():
    d.line([pt(p) for p in route],fill='#82d3d5',width=4)
    for a,b in zip(route[1:-1],route[2:]):
        x,y=pt(b);ang=math.atan2(b[1]-a[1],b[0]-a[0]);r=14
        d.polygon([(x,y),(x-r*math.cos(ang-.5),y-r*math.sin(ang-.5)),(x-r*math.cos(ang+.5),y-r*math.sin(ang+.5))],fill='#82d3d5')
for i,p in enumerate(BREACHES):
    x,y=pt(p);d.ellipse((x-10,y-10,x+10,y+10),outline='#b4bdd4',width=3);text(x+13,y-12,'A'+str(i+1),17,'#b4bdd4')
for p,label in [(ENTRY,'IN'),(EXIT,'OUT')]:
    x,y=pt(p);d.ellipse((x-25,y-25,x+25,y+25),fill='#102229',outline='#c4f3ef',width=3);text(x-20,y-12,label,18)
text(*pt((510,320)),'SEALED',24,'#fff3d9');text(*pt((580,364)),'BOARDING SCAR',22,'#fff3d9')
text(*pt((399,190)),'DIRECT NORTH LOOP',17,'#b2edec')
text(*pt((482,661)),'SOUTH HANDLING APRON',18,'#b2edec')
text(*pt((52,465)),'from freight hold',16,'#bdd2d1')
text(*pt((893,559)),'to relay racks',16,'#bdd2d1')
# Side notes are separated from the footprint, with no label leaders hiding space.
x=1325
def note(y,n,title,lines,col):
    text(x,y,n,18,col);text(x,y+27,title,23)
    for i,line in enumerate(lines):text(x,y+66+i*28,line,18,'#b6c7c8')
note(252,'01 / FOCAL POINT','The hull holds',['Solid intrusion remains','the central obstruction.','Growth hugs its damaged','southwest edge.'], '#b8c891')
note(475,'02 / CIRCULATION','Two ways around',['North: direct transit.','South: freight handling.','Both rejoin the retained','exit toward relay racks.'], '#82d3d5')
note(698,'03 / CARGO PURPOSE','Interrupted loading',['F1: staging pallet.','F2: outbound pallet.','Keep the broad apron','usable, not crate-filled.'], '#dec08a')
text(x,916,'DRAFT CHECK',18,'#82d3d5')
text(x,950,'76-unit route corridor',18)
text(x,980,'Radius 38 fits both loops.',18)
text(x,1010,'A1-A4 arrivals retained.',18)
text(x,1040,'No runtime changes yet.',18,'#b6c7c8')
# Scale and actor footprints.
x0,y0=pt((60,850));d.line((x0,y0,x0+100*S,y0),fill='#dae7e5',width=3);text(x0,y0+10,'100 world units',16)
for p,r,label in [((440,865),16,'player r16'),((670,865),28,'brute r28'),((910,865),38,'reserve r38')]:
    x,y=pt(p);d.ellipse((x-r*S,y-r*S,x+r*S,y+r*S),outline='#9cb9bf',width=2);text(x+r*S+8,y-10,label,16)
text(48,1230,'Proposed planar layout. Shipping camera, models, enemy pursuit and combat remain untested at this stage.',18,'#8fa8ad')
im.save(OUT/'layout.png');Image.open(OUT/'layout.png').verify()
print(json.dumps(report))
