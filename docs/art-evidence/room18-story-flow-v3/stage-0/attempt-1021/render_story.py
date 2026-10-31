"""Deterministic Room18 story-intent illustration. Not runtime geometry."""
from pathlib import Path
from math import sin, cos, radians
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
S = 2
im = Image.new('RGB', (1600*S, 1040*S), '#101a23')
d = ImageDraw.Draw(im)
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
white = '#edf0e9'; muted = '#aebec5'; amber = '#d5ac63'; teal = '#7fc4b5'
def font(n, bold=False): return ImageFont.truetype(B if bold else F, n*S)
def text(x,y,s,n=22,color=white,bold=False): d.text((x*S,y*S),s,font=font(n,bold),fill=color)
def line(points,color,width=2): d.line([(int(x*S),int(y*S)) for x,y in points],fill=color,width=width*S)
def rect(box,fill,outline=None,width=1): d.rectangle(tuple(int(v*S) for v in box),fill=fill,outline=outline,width=width*S)
def poly(points,fill,outline=None): d.polygon([(int(x*S),int(y*S)) for x,y in points],fill=fill,outline=outline,width=2*S)
def ellipse(box,fill,outline=None,width=1): d.ellipse(tuple(int(v*S) for v in box),fill=fill,outline=outline,width=width*S)
def arc(cx,cy,rx,ry,a,b,color,width=2):
    pts=[(cx+rx*cos(radians(a+(b-a)*i/100)),cy+ry*sin(radians(a+(b-a)*i/100))) for i in range(101)]
    line(pts,color,width)
def arrow(points,color=teal):
    line(points,color,3)
    x,y=points[-1]; px,py=points[-2]; dx=x-px;dy=y-py; mag=(dx*dx+dy*dy)**.5;dx/=mag;dy/=mag
    poly([(x,y),(x-15*dx+7*dy,y-15*dy-7*dx),(x-15*dx-7*dy,y-15*dy+7*dx)],color)

text(44,30,'18  /  CONTAINMENT ANNULUS',38,bold=True)
text(45,86,'Story-intent concept. Not gameplay, a measured layout or finished models.',21,muted)
rect((44,128,1556,131),amber)
text(44,153,'REACH THE CONTROLS. DO NOT ARM THE OVERLOAD.',28,amber,True)

# Hero diagram: a continuous circulation deck outside a shielded central volume.
rect((44,211,998,762),'#172630','#304550')
text(68,232,'FORM INTENT',17,muted,True)
text(68,260,'A protected core, not an exposed bomb.',25,bold=True)
cx,cy=520,520
ellipse((165,350,875,718),'#263e49','#6c8790',3)
ellipse((186,366,854,700),'#37505a','#7e9597',2)
# Radial structural ribs remain below the deck lip in this construction sketch.
for a in [25,60,120,155,210,250,290,330]:
    c=cos(radians(a)); s=sin(radians(a))
    poly([(cx+192*c,cy+105*s),(cx+278*c-10*s,cy+150*s+12*c),(cx+278*c+10*s,cy+150*s-12*c),(cx+202*c,cy+105*s)],'#213540','#516b72')
ellipse((270,391,770,657),'#101a23','#93a5a3',3)
# Shielding jacket sidewall, with overlapping ceramic courses.
rect((322,427,718,558),'#586b70')
ellipse((322,499,718,619),'#586b70','#83958f',2)
for row in range(3):
    y=438+row*40
    for col in range(8):
        x=327+col*48
        shade=['#a7b0a5','#929f98','#b2b8ac'][(row+col)%3]
        rect((x,y,x+44,y+32),shade,'#526366',2)
        line([(x+4,y+27),(x+39,y+27)],'#c3c8b9',1)
for y in [473,552]:
    rect((318,y,722,y+11),'#40545e','#768b90',1)
    for x in range(335,720,63): rect((x,y-3,x+9,y+15),'#869792')
ellipse((322,360,718,477),'#b5bcae','#d3d6c8',3)
ellipse((355,378,685,457),'#889991','#53676c',2)
ellipse((383,391,657,448),'#657b7b','#a7b6aa',2)
# Closed central cap, no erupting light or exposed red core.
line([(409,406),(634,428)],'#98a69a',3)
line([(410,428),(632,406)],'#98a69a',3)
ellipse((487,400,553,431),'#4b6268','#c1c7b9',2)
for x in [375,650]:
    ellipse((x,514,x+28,541),'#30474e','#bac3b5',2)
    line([(x+8,527),(x+20,527)],amber,2)
# Sparse service rail markers, separate from the route.
arc(cx,cy,322,159,20,158,amber,4)
for a in [30,65,115,150]:
    x=cx+322*cos(radians(a));y=cy+159*sin(radians(a))
    ellipse((x-5,y-5,x+5,y+5),amber)
# Two directional access cues, explicitly conceptual rather than topology proof.
arrow([(217,580),(196,534),(213,467)])
arrow([(823,582),(845,532),(826,467)])
text(69,730,'Continuous ring outside the solid center. Both directions stay open.',20,white)
line([(353,375),(280,327),(88,327)],muted,2)
text(83,304,'Overlapping shielding',17,muted)
line([(691,555),(810,613),(934,613)],muted,2)
text(783,627,'Recessed plugs;',17,muted)
text(783,650,'services inside',17,muted)

# The story is deliberately separated from future mechanical design choices.
rect((1024,211,1556,379),'#1c2b34','#41545d')
text(1046,230,'01  ORIGINAL FUNCTION',17,amber,True)
text(1046,267,'Contain and inspect',27,bold=True)
text(1046,309,'Shielding isolates the reactor.',21)
text(1046,340,'The outer ring gives service access.',21)
rect((1024,397,1556,565),'#1c2b34','#41545d')
text(1046,416,'02  CURRENT STORY STATE',17,amber,True)
text(1046,453,'Passengers are still alive.',26,bold=True)
text(1046,496,'After the defensive line, reach',21)
text(1046,527,'manual access. No consent yet.',21)
rect((1024,583,1556,762),'#1c2b34','#41545d')
text(1046,602,'03  PLAYER UNDERSTANDING',17,amber,True)
text(1046,639,'Reach is not authorize.',27,bold=True)
text(1046,682,'Circle the shielding toward Room19.',21)
text(1046,713,'No countdown. No new mechanism.',21)

rect((44,787,778,954),'#203c3a','#63968b',2)
text(67,807,'PASSENGER VITALS  /  PROPOSED STATUS RAIL',16,teal,True)
line([(71,886),(106,886),(117,871),(129,906),(141,858),(154,886),(201,886)],teal,3)
text(226,850,'PASSENGERS ALIVE',29,white,True)
text(226,901,'Living status, not an arming signal.',20,muted)
rect((800,787,1556,954),'#352f23','#a18d62',2)
text(824,807,'AUTHORIZATION  /  SEPARATE INDICATOR',16,amber,True)
text(825,850,'OVERLOAD IS NOT ARMED',29,white,True)
text(825,901,'Manual authorization still required.',20,muted)
text(44,979,'Ceramic grey + brushed shielding + sparse amber. No red alarm wash or exposed core glow.',20,muted)
text(44,1012,'Sources: canonical storyRooms.ts, Room18 brief, issue40. Proposed forms only; positions and clearances deferred to layout.',16,muted)
im.resize((1600,1040),Image.Resampling.LANCZOS).save(OUT/'story-intent.png')
print(OUT/'story-intent.png')
