#!/usr/bin/env python3
"""Render the original Room17 stage0 concept. No runtime assets are read or edited.
Requires Python 3, Pillow 12.3.0 and DejaVu Sans from Debian fonts-dejavu-core.
Run: python generate-board.py [output.png]
No randomness, timestamps, network calls or embedded metadata.
"""
from pathlib import Path
import math
import sys
from PIL import Image, ImageDraw, ImageFont

W, H, S = 2400, 1700, 2
im = Image.new('RGB', (W*S,H*S), '#ebe9e1')
d = ImageDraw.Draw(im)
C = dict(ink='#233239', muted='#56656a', paper='#f7f5ed', border='#c2c8c4', teal='#286f70', ochre='#b39a60', dark='#35434b', steel='#acb8b9')
fontdir = Path('/usr/share/fonts/truetype/dejavu')
def font(size, bold=False):
    return ImageFont.truetype(str(fontdir / ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')), size*S)
def rect(box, fill, outline=None, width=1):
    d.rectangle(tuple(int(v*S) for v in box), fill=fill, outline=outline, width=width*S)
def line(points, color=C['ink'], width=2):
    d.line([(int(x*S),int(y*S)) for x,y in points],fill=color,width=width*S,joint='curve')
def poly(points, fill, outline=None):
    pts=[(int(x*S),int(y*S)) for x,y in points]
    d.polygon(pts,fill=fill)
    if outline: d.line(pts+[pts[0]],fill=outline,width=2*S)
def text(x,y,s,size=28,color=None,bold=False):
    d.text((x*S,y*S),s,font=font(size,bold),fill=color or C['ink'])
def wrapped(x,y,s,width,size=29,color=None,bold=False,leading=1.4):
    words=s.split(); row=''; rows=[]
    for word in words:
        candidate=(row+' '+word).strip()
        if d.textlength(candidate,font=font(size,bold))>width*S:
            rows.append(row); row=word
        else: row=candidate
    rows.append(row)
    for row in rows:
        text(x,y,row,size,color,bold); y += size*leading
    return y

def badge(x,y,n):
    d.ellipse(((x-22)*S,(y-22)*S,(x+22)*S,(y+22)*S),fill=C['teal'])
    d.text((x*S,y*S),str(n),font=font(25,True),fill='white',anchor='mm')
def arrow(points,color=C['teal'],width=5):
    line(points,color,width)
    x,y=points[-1]; px,py=points[-2]; a=math.atan2(y-py,x-px)
    poly([(x,y),(x-20*math.cos(a-.48),y-20*math.sin(a-.48)),(x-20*math.cos(a+.48),y-20*math.sin(a+.48))],color)

# Editorial frame.
rect((0,0,W,19),C['teal'])
text(70,52,'ROOM 17  /  SHIELDING GATE',57,bold=True)
text(72,135,'Clear the last defensive line before the reactor.',37)
rect((1740,57,2330,113),C['ink'])
text(1765,70,'STAGE 0  /  STORY CONCEPT',28,'#ffffff',True)
text(1780,134,'Not gameplay. Not a layout plan.',26,C['muted'])
line([(70,204),(2330,204)],C['border'],2)

# Hero mechanism, a proposed assembly rather than a room plan.
rect((70,238,1500,1052),C['paper'],C['border'])
text(101,264,'01  /  A barrier with a readable opening',34,bold=True)
text(102,318,'Proposed assembly, shown static and open. Schematic, not to scale.',26,C['muted'])
# shallow perspective platform, floor deliberately clean
poly([(200,832),(1288,832),(1390,935),(125,935)],'#e0e2db')
# Rear stepped backing and crown.
poly([(258,433),(328,386),(1250,386),(1310,433),(1310,860),(1238,906),(258,906)],'#4e5c63',C['ink'])
rect((280,420,1245,860),'#637178',C['ink'],3)
rect((528,474,982,906),C['paper'])
# Cap stack makes depth explicit.
poly([(280,420),(328,386),(1250,386),(1245,420)],'#92a0a4',C['ink'])
rect((306,441,1219,478),'#919da0',C['ink'],2)
rect((332,478,1192,505),'#b0b9b7',C['ink'],2)
# Left and right nested shield leaves. Inner edges form explicit steps.
for mirrored in [False,True]:
    def bx(a,b): return (1525-b,1525-a) if mirrored else (a,b)
    for a,b,top,bottom,col in [(285,454,468,863,'#53616a'),(354,491,502,863,'#6d7c82'),(426,528,539,863,'#899599')]:
        x1,x2=bx(a,b)
        rect((x1,top,x2,bottom),col,C['ink'],3)
        edge=x1 if mirrored else x2-12
        rect((edge,top+8,edge+12,bottom-7),C['steel'])
        for yy in [top+27,bottom-27]:
            rect((x1+16,yy,x2-16,yy+8),'#4c5a60')
    # Recess, neutral dosimeter and ochre service marker.
    x1,x2=bx(307,407)
    rect((x1,660,x2,744),'#26363c',C['steel'],2)
    text(x1+10,674,'mSv',18,'#cbd9d1')
    line([(x1+12,722),(x2-12,722)],'#9daea8',3)
    x1,x2=bx(429,447)
    rect((x1,572,x2,792),C['ochre'])
    # Screw actuator housing and shaft, fully outside the passage.
    x1,x2=bx(192,309)
    rect((x1,555,x2,635),C['dark'],C['ink'],3)
    cx=(x1+x2)/2
    d.ellipse(((cx-23)*S,570*S,(cx+23)*S,619*S),fill='#829196',outline=C['steel'],width=3*S)
    x1,x2=bx(310,519)
    rect((x1,577,x2,610),'#b6c0bd',C['ink'],2)
    for xx in range(int(x1+3),int(x2-8),14): line([(xx,578),(xx+10,610)],'#56656b',3)
    # Drive nut, guide shoe and a pulled-back locking wedge.
    x1,x2=bx(469,513)
    rect((x1,565,x2,623),C['ochre'],C['ink'],3)
    x1,x2=bx(426,528)
    rect((x1,833,x2,873),'#37474d',C['steel'],2)
    x1,x2=bx(477,528)
    poly([(x1,765),(x2,788),(x2,814),(x1,814)],'#b0a17e',C['ink'])
# Unobstructed opening. This is visual intention, not a clearance proof.
text(629,555,'CLEAR',34,C['teal'],True)
text(605,600,'OPENING',34,C['teal'],True)
text(608,655,'static leaves',25,C['muted'])
arrow([(760,865),(760,722)],C['teal'],6)
text(620,913,'Toward reactor access',26,C['teal'],True)
badge(448,493,1); badge(207,547,2); badge(526,808,3); badge(912,733,4)
text(102,993,'Open floor stays legible. No machinery or warning paint spans the passage.',26,C['muted'])

# Narrative column.
text(1555,250,'WHAT THIS ROOM MEANS',28,C['teal'],True)
text(1555,307,'Built to shield reactor access',32,bold=True)
wrapped(1555,365,'Thick nested leaves, stepped supports and exposed screw drives identify a radiation barrier, not an ordinary security door. [B]',735)
line([(1555,525),(2330,525)],C['border'])
text(1555,552,'Now the final defensive line',32,bold=True)
wrapped(1555,610,'The encounter still stands between the player and the reactor. Canonical sources do not explain how the gate came to be open. Do not invent a sabotage event. [S, B]',735)
line([(1555,810),(2330,810)],C['border'])
text(1555,837,'Clear threats, then continue',32,bold=True)
wrapped(1555,895,'Preserve the stepped approach and broad alternate lanes. Show containment infrastructure, not an armed overload or an escape route. [B]',735)

# Callouts under the assembly, separated from drawing for readable text.
rect((70,1082,1500,1377),C['paper'],C['border'])
for x,y,n,title,body in [
    (109,1120,1,'Nested shielding','Interleaved edges and dense backing layers.'),
    (811,1120,2,'Paired screw drives','Threaded shafts link housings to drive nuts.'),
    (109,1245,3,'Guides and locking wedges','Shoes support the leaves. Wedges stay clear.'),
    (811,1245,4,'A physical passage','No solid leaf, seal or overhang across it.')]:
    badge(x+17,y+17,n)
    text(x+58,y-2,title,27,bold=True)
    wrapped(x+58,y+43,body,550,25,color=C['muted'],leading=1.3)

# Material swatches, all local concept intent.
text(1555,1112,'MATERIAL INTENT [B]',27,C['teal'],True)
for y,col,label in [(1165,'#69767d','Dull lead-grey shielding'),(1225,'#aeb9b9','Brushed steel contact edges'),(1285,C['ochre'],'Faded ochre service paint')]:
    rect((1555,y,1610,y+37),col,C['border'])
    text(1631,y,label,27)

# Stage boundary.
rect((70,1410,2330,1589),C['ink'])
text(104,1437,'KEEP THE STORY BOUNDARY',27,'#c8d5d2',True)
text(104,1490,'No timed closure. No crushing hazard. No overload countdown. No escape cues.',31,'#ffffff',True)
text(104,1543,'Layout, collision, actor clearance and live combat remain untested. No runtime changes in this stage.',25,'#d2dcda')
text(72,1621,'[S] storyRooms.ts:20    [B] room17-brief.json:12-31    |    Pinned sources and rationale in sourced-brief.md',24,C['muted'])
text(72,1661,'room17-story-flow-v3  /  stage-0  /  attempt-1015',20,C['muted'])
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).with_name('story-intent.png')
out.parent.mkdir(parents=True,exist_ok=True)
im.resize((W,H),Image.Resampling.LANCZOS).save(out,format='PNG',compress_level=9)
print(out)
