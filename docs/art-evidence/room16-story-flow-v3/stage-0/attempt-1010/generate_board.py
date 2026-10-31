#!/usr/bin/env python3
"""CPU-only Room16 story-intent drawing. No runtime or prior-room assets.
Run: python generate_board.py --output room16-story-intent-original.png
Refuses to replace existing evidence. Pillow 12.3.0, bundled DejaVu fonts.
"""
from pathlib import Path
import argparse
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
W, H, SS = 2400, 1680, 2
im = Image.new('RGB', (W * SS, H * SS), '#ede9df')
d = ImageDraw.Draw(im)
INK = '#243235'
MUTED = '#5c6968'
PAPER = '#ede9df'
TEAL = '#8ec0bc'
BONE = '#c0b7a1'
AMBER = '#d5aa74'
fonts = {}
def font(size, bold=False):
    key = size, bold
    if key not in fonts:
        fonts[key] = ImageFont.truetype(str(ROOT / 'fonts' / ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')), size * SS)
    return fonts[key]
def text(x, y, s, size=24, color=INK, bold=False):
    d.text((x*SS,y*SS),s,font=font(size,bold),fill=color)
def line(points, color, width=2):
    d.line([(int(x*SS),int(y*SS)) for x,y in points],fill=color,width=max(1,int(width*SS)),joint='curve')
def poly(points, fill, edge=None, width=2):
    p=[(int(x*SS),int(y*SS)) for x,y in points]
    d.polygon(p,fill=fill)
    if edge: line(points+[points[0]],edge,width)
def box(x,y,w,h,fill,edge=None):
    d.rectangle((x*SS,y*SS,(x+w)*SS,(y+h)*SS),fill=fill,outline=edge,width=SS)
def ellipse(x,y,w,h,fill,edge=None,width=2):
    d.ellipse((int(x*SS),int(y*SS),int((x+w)*SS),int((y+h)*SS)),fill=fill,outline=edge,width=int(width*SS))
def label(x,y,n,color=TEAL):
    ellipse(x-17,y-17,34,34,'#18262a',color,2)
    f=font(18,True)
    bb=d.textbbox((0,0),str(n),font=f)
    d.text((x*SS-(bb[2]-bb[0])/2,y*SS-12*SS),str(n),fill=color,font=f)
def callout(x,y,s,target,color=TEAL):
    text(x,y,s,20,color)
    line([(x,y+31),(x+20,y+47),target],color,1.4)
    ellipse(target[0]-3,target[1]-3,6,6,color)

# Page typography and authority labels.
text(66,42,'ROOM 16 / SWARM JUNCTION',22,MUTED,True)
text(66,80,'The ship routes services. The invasion converges.',43,INK,True)
text(66,146,'STAGE 0  /  SOURCE-BACKED CONCEPT DRAWING  /  NOT GAMEPLAY  /  NOT LAYOUT APPROVAL',21,MUTED,True)
line([(66,195),(2334,195)],'#a4aba3',2)
text(66,220,'01  Original function',31,INK,True)
text(1240,220,'02  Invaded function',31,INK,True)
text(66,266,'Human distribution hub. Reconstructed design intent.',22,MUTED)
text(1240,266,'Three roots converge on one low routing organ.',22,MUTED)

# Two matched oblique cutaways, explicitly illustrative, not collision plans.
def scene(ox, invaded):
    oy = 315
    box(ox,oy,1094,770,'#152125')
    def P(x,y,z=0):
        return ox+547+(x-y)*0.67, oy+416+(x+y)*0.31-z*0.85
    def floorpoly(coords,fill,edge=None): poly([P(x,y) for x,y in coords],fill,edge)
    def beam(a,b,z=0,width=6,col='#566a6b'): line([P(*a,z),P(*b,z)],col,width)
    # Open cutaway floor and far walls, no claimed room boundary.
    floorpoly([(-630,-350),(270,-520),(650,-70),(340,610),(-420,520),(-650,150)],'#2b3c40','#627370')
    for q in range(-400,601,100):
        beam((q,-360),(q,460),width=1,col='#3c4b4e')
        beam((-550,q),(510,q),width=1,col='#3c4b4e')
    for a,b in [((-630,-350),(270,-520)),((270,-520),(650,-70))]:
        poly([P(*a),P(*b),P(*b,170),P(*a,170)],'#33474b','#526469')
        line([P(*a,177),P(*b,177)],'#7a8c88',5)
        for t in [0.1,0.3,0.5,0.7,0.9]:
            x=a[0]+t*(b[0]-a[0]); y=a[1]+t*(b[1]-a[1])
            line([P(x,y,0),P(x,y,161)],'#1c2c30',12)
            line([P(x+8,y,10),P(x+8,y,158)],'#526669',3)
    # Three distinct service trunks, carried through both states.
    ends=[(-490,210),(60,-390),(435,295)]
    for i,(ex,ey) in enumerate(ends):
        sx,sy=ex*0.21,ey*0.21
        vx,vy=ex-sx,ey-sy
        ln=math.hypot(vx,vy); nx,ny=-vy/ln,vx/ln
        floorpoly([(sx+nx*72,sy+ny*72),(ex+nx*72,ey+ny*72),(ex-nx*72,ey-ny*72),(sx-nx*72,sy-ny*72)],'#182a30','#657773')
        for off in [-40,-20,0,20,40]:
            beam((sx+nx*off,sy+ny*off),(ex+nx*off,ey+ny*off),z=8,width=5,col='#758782' if not invaded else '#56615d')
        # Cable saddle brackets show the same human substrate.
        for t in [.58,.8]:
            cx,cy=sx+vx*t,sy+vy*t
            a=(cx+nx*65,cy+ny*65); b=(cx-nx*65,cy-ny*65)
            pts=[P(*a,8),P(*a,34),P(*b,34),P(*b,8)]
            if invaded:
                pts=[P(*a,8),P(*a,46),P(cx+nx*12,cy+ny*12,57)]
                line([P(*b,8),P(*b,30),P(cx-nx*24,cy-ny*24,16)],'#a0a395',7)
            line(pts,'#919c94',8)
            line(pts,'#c0ba9f',2)
    # Far-wall wayfinding survives in both images.
    gx,gy=P(30,-420,206)
    line([(gx-139,gy+50),(gx-139,gy+97)],'#a3ada3',7)
    line([(gx+141,gy+50),(gx+141,gy+89)],'#a3ada3',7)
    poly([(gx-168,gy),(gx+176,gy),(gx+176,gy+50),(gx-168,gy+50)],'#142a2d','#839c94')
    text(gx-148,gy+11,'REACTOR ACCESS  >',20,'#b7cfc1',True)
    if invaded:
        poly([(gx+75,gy),(gx+94,gy+17),(gx+82,gy+27),(gx+108,gy+50),(gx+116,gy+50),(gx+94,gy+22),(gx+100,gy)],'#0d1b1e')
    # Low human distributor chassis, retained beneath infestation.
    base=[(-115,-102),(117,-102),(117,105),(-115,105)]
    floorpoly([(-147,-130),(149,-130),(149,142),(-147,142)],'#111d21','#4d6467')
    for a,b in zip(base,base[1:]+base[:1]):
        poly([P(*a,10),P(*b,10),P(*b,80),P(*a,80)],'#42585c','#6c817e')
    poly([P(x,y,80) for x,y in base],'#6a807e','#a4b4a8')
    if not invaded:
        for x in [-76,-28,20,68]:
            poly([P(x,-75,82),P(x+27,-75,82),P(x+27,72,82),P(x,72,82)],'#20383d','#adc0af')
            line([P(x+9,-55,85),P(x+9,53,85)],'#8fbcb5',3)
        text(ox+35,oy+35,'SERVICE DISTRIBUTION / BEFORE',19,TEAL,True)
        callout(ox+34,oy+590,'01  Cable runs feed one ship hub',P(-70,0,84))
        callout(ox+632,oy+634,'02  Saddles hold ordered trunks',P(305,205,33))
        text(ox+34,oy+711,'Regular metalwork; readable human wayfinding.',20,'#b4c4be')
    else:
        # Three organic roots, directional and asymmetrical. No fourth branch.
        for ri,(ex,ey) in enumerate([ends[1],ends[0],ends[2]]):
            ln=math.hypot(ex,ey); ux,uy=ex/ln,ey/ln; nx,ny=-uy,ux
            def Q(t,n,z): return P(ex*t+nx*n,ey*t+ny*n,z)
            # Shadow and tapered tendon bed.
            poly([Q(.05,-102,12),Q(.92,-47,8),Q(1.04,2,8),Q(.94,57,8),Q(.08,105,12)],'#10191b')
            poly([Q(.08,-69,30),Q(.98,-31,18),Q(1,36,18),Q(.08,76,30)],'#766d5b','#aca18c')
            for off in [-22,0,22]:
                line([Q(.2,off,36),Q(.58,off,25),Q(.99,off,20)],'#a3977f',3)
            # Overlapping charcoal plates, bone-grey rims.
            for j,t in enumerate([.85,.70,.55,.40,.25]):
                wid=37+(1-t)*62; z=22+(1-t)*63
                pts=[Q(t+.11,-wid*.68,z-16),Q(t+.12,wid*.62,z-17),Q(t-.015,wid,z+4),Q(t-.17,wid*.45,z+19),Q(t-.17,-wid*.46,z+19),Q(t-.02,-wid,z+5)]
                poly(pts,['#3c4547','#40494a','#485052','#41484b','#4e5554'][j],'#aaa28d',2)
                line([Q(t+.10,-wid*.63,z-13),Q(t-.015,0,z+9),Q(t+.1,wid*.6,z-14)],'#727971',3)
                line([Q(t-.16,-wid*.40,z+20),Q(t-.06,0,z+26),Q(t-.16,wid*.4,z+20)],'#1e292c',4)
            # Cut end shows tissue tied to a severed cable route.
            poly([Q(.99,-34,11),Q(.99,35,11),Q(.99,35,34),Q(.99,-34,34)],'#b1a28a','#383e3c')
            for off in [-20,0,20]:
                p=Q(1,off,21); ellipse(p[0]-4,p[1]-3,8,6,'#3a3b32')
        # Central layered shell forms a low concave manifold, never an upright creature.
        cx,cy=P(0,0,89)
        poly([(cx-139,cy+28),(cx-113,cy-35),(cx-35,cy-64),(cx+73,cy-55),(cx+145,cy-4),(cx+112,cy+52),(cx+10,cy+76),(cx-101,cy+61)],'#555b58','#b0a58e',3)
        poly([(cx-110,cy+17),(cx-77,cy-28),(cx-18,cy-40),(cx+64,cy-27),(cx+111,cy+3),(cx+69,cy+42),(cx-23,cy+56)],'#2e383a','#7e8175',3)
        # Recessed dark cavity without eye, beam, glow or emission.
        ellipse(cx-58,cy-18,126,61,'#121b1e','#aea28b',5)
        ellipse(cx-37,cy-6,87,37,'#090f12','#414947',2)
        for i in range(5):
            x=cx-108+i*49
            line([(x,cy+39),(x+13,cy+65),(x+28,cy+55)],'#b0a58d',5)
        # Peeled ship ribs remain recognizable as severed architectural strips.
        for dx,dy in [(-165,10),(105,-130)]:
            line([P(dx*1.9,dy*1.9,6),P(dx*1.5,dy*1.5,53),P(dx,dy,80),P(dx*.65,dy*.65,42)],'#98a194',10)
            line([P(dx*1.9,dy*1.9,6),P(dx*1.5,dy*1.5,53),P(dx,dy,80)],'#d0c8ad',2)
        text(ox+35,oy+35,'SERVICE DISTRIBUTION / SEVERED',19,BONE,True)
        callout(ox+34,oy+111,'03  Damaged far-wall gantry',(gx+130,gy+44),BONE)
        callout(ox+680,oy+258,'04  Recessed cavity',(cx+13,cy+10),BONE)
        callout(ox+34,oy+601,'05  Torn cable saddles',P(-390,170,39),BONE)
        callout(ox+630,oy+639,'06  Low layered carapace',P(210,143,49),BONE)
        # Root labels are explanatory IDs, not gameplay markers.
        for i,(ex,ey) in enumerate(ends):
            px,py=P(ex*1.11,ey*1.11,0); label(px,py,chr(65+i),AMBER)
        text(ox+34,oy+711,'A / B / C mark root directions, not doors or spawn sites.',20,'#c2bba9')
scene(66,False)
scene(1240,True)

# Lower brief is visually separate from proposed art.
text(66,1122,'STORY READ',18,MUTED,True)
text(66,1160,'Human infrastructure is still legible.',28,INK,True)
text(66,1205,'Long growth follows its services into one radial mass.',24,INK)
text(66,1245,'The convergence suggests coordinated intent.',24,INK)
text(66,1285,'It does not explain the hive or add enemy behavior.',24,INK)
for i,(col,name) in enumerate([('#3f4849','Charcoal plates'),('#b8af99','Bone-grey ribs'),('#34484e','Dark metal lanes')]):
    x=66+i*360
    box(x,1362,45,45,col)
    text(x+60,1373,name,21,INK)
text(1240,1122,'CANONICAL OBJECTIVE / storyRooms.ts:19',18,MUTED,True)
text(1240,1160,'Break the concentrated swarm',30,INK,True)
text(1240,1203,'guarding reactor access.',30,INK,True)
text(1240,1260,'Keep escape turns and incoming threats readable.',23,INK)
text(1240,1300,'No new boss, emitter, AI or interaction.',23,INK)
text(1240,1340,'No hive explanation. No attack-like decorative pulse.',23,INK)
text(1240,1380,'Combat and circulation remain untested at stage 0.',23,INK)
line([(66,1460),(2334,1460)],'#a4aba3',2)
text(66,1490,'SOURCE PIN',18,MUTED,True)
text(66,1528,'Issue #37, read live 2026-10-01. Room16 brief revalidated against the canonical objective.',22,INK)
text(66,1568,'Source commit 7a3f26288610 / Exact hashes and snapshots: source-manifest.json / Brief: room16-sourced-brief.md',20,MUTED)
text(66,1610,'Illustrative camera, material shapes and before-state reconstruction. Not production art. No earlier-room assets.',20,MUTED)

if __name__ == '__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--output',default='room16-story-intent-original.png')
    args=p.parse_args()
    dest=Path(args.output)
    if not dest.is_absolute(): dest=ROOT/dest
    with dest.open('xb') as f:
        im.resize((W,H),Image.Resampling.LANCZOS).save(f,format='PNG',compress_level=9)
    print(f'{dest} | {W}x{H} RGB | CPU Pillow {Image.__version__}')
