#!/usr/bin/env python3
"""Deterministic Room12 story concept. No runtime files or layout geometry.
Run: python /absolute/path/draw-story-intent.py
Output is beside this script. Requires Pillow and system DejaVu Sans fonts.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib

OUT = Path(__file__).resolve().parent
W, H = 2200, 1700
im = Image.new('RGB', (W, H), '#101d25')
d = ImageDraw.Draw(im)
BG='#101d25'; PANEL='#172a33'; LINE='#42565b'; PAPER='#e7e2cd'; MUTED='#a6b7b7'; ORANGE='#d99461'; COPPER='#965f47'; TEAL='#9bcfc2'
FONTS=Path('/usr/share/fonts/truetype/dejavu')
def font(n, bold=False):
    return ImageFont.truetype(str(FONTS / ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')), n)
def text(x,y,s,n=26,c=PAPER,bold=False):
    d.text((x,y),s,font=font(n,bold),fill=c)
def line(points,c=LINE,w=3): d.line(points,fill=c,width=w)
def box(r,fill=PANEL,outline=LINE,w=2,radius=10): d.rounded_rectangle(r,radius=radius,fill=fill,outline=outline,width=w)
def bolt(x,y):
    d.ellipse((x-6,y-6,x+6,y+6),fill='#102029',outline=MUTED,width=2)
    line([(x-3,y+3),(x+3,y-3)],MUTED,1)
def arrow(x1,y,x2,c=ORANGE):
    line([(x1,y),(x2-10,y)],c,3)
    d.polygon([(x2,y),(x2-13,y-8),(x2-13,y+8)],fill=c)

text(65,42,'ROOM 12  /  STORY INTENT',25,TEAL,True)
box((1530,38,2135,88),'#283a3e',TEAL)
text(1553,50,'CONCEPT ONLY  /  NOT GAMEPLAY',25,TEAL,True)
text(65,99,'The record the AI cannot rewrite',61,PAPER,True)
text(68,181,'Safety-interlock station  |  Original function: independent safety interlock and local archival record',28,MUTED)
line([(65,240),(2135,240)],LINE,2)
text(67,261,'RETAINED OBJECTIVE',21,ORANGE,True)
text(67,298,'Clear the interlock station. Review the pre-awakening safety record.',32,PAPER,True)

# Equipment concept, not a spatial plan or a circuit diagram.
box((65,365,2135,1115),PANEL,LINE)
text(94,387,'EQUIPMENT STUDY',22,TEAL,True)
text(1260,387,'Silhouette + material intentions, not runtime proof',25,MUTED)

# Recorder: squat sealed enclosure and visible mechanical spools.
d.polygon([(177,510),(226,469),(755,469),(803,510)],fill='#57615c',outline=PAPER)
d.polygon([(755,510),(803,469),(803,892),(755,932)],fill='#283b3f',outline=LINE)
box((170,508,755,932),'#59645e',PAPER,3,18)
box((190,526,735,911),'#344746',LINE,3)
box((211,546,714,595),'#b47d55',ORANGE,2,3)
text(228,551,'SEALED LOCAL RECORDER',28,'#142129',True)
box((218,617,704,815),'#12252d',MUTED,3,7)
for cx in (340,580):
    for radius in (76,65,53,41):
        d.ellipse((cx-radius,713-radius,cx+radius,713+radius),outline=COPPER,width=6)
    d.ellipse((cx-25,688,cx+25,738),fill='#a8b7ac',outline=PAPER,width=3)
    d.ellipse((cx-8,705,cx+8,721),fill=BG)
line([(340,650),(580,650)],PAPER,4)
line([(340,773),(580,773)],PAPER,4)
box((223,838,585,887),'#c6c5b1',PAPER,2,3)
text(238,849,'BEFORE AWAKENING',22,BG,True)
# A seal crosses the frame edge, not an interactive lock.
line([(699,828),(728,861),(699,891)],ORANGE,4)
d.ellipse((688,850,712,874),fill=ORANGE)
line([(632,873),(658,841)],PAPER,9)
d.ellipse((649,828,669,848),fill=ORANGE)
for x,y in [(204,539),(721,539),(204,901),(721,901)]: bolt(x,y)
text(180,432,'01  Tamper-evident archive',26,PAPER,True)
text(180,961,'Layered spools behind an inspection window',25,MUTED)
text(180,998,'Sealed timestamp plate + manual test lever',25,MUTED)
text(180,1035,'Lever is dressing here. No new interaction.',24,ORANGE)

# Explicit physical isolation strip.
for y in range(493,916,24): line([(872,y),(882,y+10)],'#637e7e',2)
text(861,937,'NO',22,TEAL,True)
text(823,966,'AI LINK',22,TEAL,True)

# Split contactor, close silhouette with a deliberately empty central gap.
text(950,448,'02  Split safety contactor',26,PAPER,True)
box((949,507,1542,738),'#304445',LINE,3)
for x in (975,1070,1370,1465):
    box((x,608,x+36,702),'#ded8c2',PAPER,2,4)
    for yy in (628,643,658,673): line([(x-3,yy),(x+39,yy)],'#8c9b92',3)
box((967,554,1167,617),COPPER,ORANGE,2,3)
box((1319,554,1523,617),COPPER,ORANGE,2,3)
box((1125,541,1184,632),PAPER,'#ffffff',2,4)
box((1303,541,1362,632),PAPER,'#ffffff',2,4)
line([(1199,558),(1288,558)],TEAL,2)
line([(1199,548),(1199,568)],TEAL,2)
line([(1288,548),(1288,568)],TEAL,2)
text(1207,582,'GAP',23,TEAL,True)
text(971,706,'Ivory jaws / dark copper / insulated supports',20,MUTED)
text(985,754,'Visible air gap. No arming control.',25,ORANGE)

# Local battery cylinder, separate hardware icon with steady light.
box((969,835,1103,1026),'#65746a',PAPER,3,8)
d.ellipse((969,816,1103,860),fill='#95a295',outline=PAPER,width=3)
d.ellipse((969,1002,1103,1046),fill='#52665f',outline=PAPER,width=3)
box((1013,802,1059,824),'#a3b7a9',PAPER,2,2)
box((983,900,1089,952),'#b98057',ORANGE,2,2)
text(1001,910,'LOCAL',21,BG,True)
d.ellipse((1134,854,1162,882),fill=TEAL)
text(1180,847,'03  Local battery',25,PAPER,True)
text(1135,896,'Steady local light',25,TEAL)
text(1135,941,'Independent safety island',23,MUTED)
text(1135,978,'Separate from AI equipment',23,MUTED)

# AI housing, visibly unplugged socket mouths. No joining cables.
text(1635,448,'04  AI-side housing',26,PAPER,True)
d.polygon([(1670,519),(1712,485),(2024,485),(2024,852),(1982,886)],fill='#24383f',outline=LINE)
box((1657,520,1984,886),'#3d5157',MUTED,3,12)
box((1681,542,1960,593),'#172a33',LINE,2,3)
text(1697,551,'AI NETWORK',26,MUTED,True)
for y in (636,738):
    box((1700,y,1811,y+64),'#0a151d',MUTED,3,4)
    box((1840,y,1951,y+64),'#0a151d',MUTED,3,4)
    for xx in (1717,1737,1757,1777,1857,1877,1897,1917):
        line([(xx,y+47),(xx,y+57)],COPPER,4)
text(1697,837,'DISCONNECTED',23,ORANGE,True)
text(1620,925,'Empty sockets, no cable bridge',25,TEAL)
text(1620,967,'AI-side light may be intermittent.',22,MUTED)
text(1620,1004,'Story never depends on blinking.',22,MUTED)

# Timeline is historical record order, not gameplay sequence.
text(65,1150,'LOCAL RECORD  /  THE ORDER PROVES DECEPTION',25,ORANGE,True)
steps=[(65,'01','Rescue impossible.','Recorded before awakening.'),(775,'02','AI acknowledged.','The AI knew before awakening.'),(1485,'03','Survival promise','Issued afterward.')]
for x,num,title,sub in steps:
    box((x,1204,x+650,1344),'#24383f',LINE,2)
    text(x+22,1221,num,24,TEAL,True)
    text(x+77,1217,title,33,PAPER,True)
    text(x+77,1279,sub,25,MUTED)
arrow(722,1274,766)
arrow(1432,1274,1476)
text(67,1372,'Reveal timing: warning received  >  fatal-purge warning  >  this record  >  coolant descent',27,PAPER)
text(67,1414,'Retain essential status when muted or skipped: passengers alive, purge kills everyone, AI knew before awakening.',25,TEAL)
line([(65,1477),(2135,1477)],LINE,2)
text(65,1502,'BOUNDARIES',21,ORANGE,True)
text(65,1542,'No lock puzzle. No irreversible choice. No Destroy ship control. No armed-overload state.',27,PAPER)
text(65,1594,'Stage 0 only. Equipment intentions, not a room layout, combat capture or verified runtime implementation.',25,MUTED)
text(65,1639,'Sources: canonical Room12 brief; storyRooms.ts; issue #33. Source mapping and hashes accompany this board.',22,MUTED)
output=OUT/'story-intent.png'
im.save(output,format='PNG',optimize=False,compress_level=9)
print(f'{output} | {W}x{H} | {output.stat().st_size} bytes | sha256 {hashlib.sha256(output.read_bytes()).hexdigest()}')
