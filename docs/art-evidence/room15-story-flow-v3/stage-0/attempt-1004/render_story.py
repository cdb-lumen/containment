from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

OUT = Path(__file__).parent
im = Image.new('RGB', (1600, 1100), '#111b24')
d = ImageDraw.Draw(im)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def text(x,y,s,size=24,color='#e5e9e6',bold=False):
    d.text((x,y),s,font=ImageFont.truetype(BOLD if bold else FONT,size),fill=color)
def lines(x,y,ss,size=22,color='#b5c3ca',gap=32):
    for i,s in enumerate(ss): text(x,y+i*gap,s,size,color)
def box(r,c,outline=None,w=2): d.rectangle(r,fill=c,outline=outline,width=w)
def line(p,c,w=3): d.line(p,fill=c,width=w,joint='curve')
def dot(x,y,r,c): d.ellipse((x-r,y-r,x+r,y+r),fill=c)
def arrow(p,c='#e3ba61',w=4):
    line(p,c,w); x,y=p[-1]; a=math.atan2(y-p[-2][1],x-p[-2][0]);
    d.polygon([(x,y),(x-17*math.cos(a-.45),y-17*math.sin(a-.45)),(x-17*math.cos(a+.45),y-17*math.sin(a+.45))],fill=c)

text(48,28,'15 / Infested workshop',42,bold=True)
text(50,88,'Story intent study   |   Concept illustration, not gameplay or a layout',22,'#e3ba61')
line([(48,133),(1552,133)],'#354551',2)
text(48,152,'Human machinery. Deliberate alien conversion.',30,bold=True)
text(48,198,'Keep the machine useful and recognizable. The invaders have changed who it serves.',23)

# Large illustrative machine panel. No claimed room placement or scale.
box((48,250,1040,794),'#1b2934')
text(72,268,'Construction station / proposed visual story',22,'#a7bdc7')
# Floor shadow, feet, bed and two open ways.
d.ellipse((122,651,938,737),fill='#101a22')
box((167,601,265,714),'#364750','#718088');box((701,598,822,714),'#364750','#718088')
box((151,553,863,634),'#81682d','#c8a34e',3)
box((174,538,838,551),'#c5ccd0');box((174,580,838,594),'#98a8af')
box((268,553,727,578),'#15222a')
# Headstock and conspicuous 3-jaw chuck.
box((141,406,310,555),'#aa8239','#deb86a',3)
box((160,431,244,501),'#293b46','#657c89',3)
for yy in (444,458,472,486): line([(171,yy),(231,yy)],'#0e1b23',5)
d.ellipse((264,415,390,551),fill='#8c9ca4',outline='#dae0dd',width=4)
d.ellipse((283,434,371,532),fill='#293741',outline='#bdc6c9',width=3)
for angle in (0,120,240):
    a=math.radians(angle); cx,cy=327,483
    x,y=cx+34*math.cos(a),cy+38*math.sin(a)
    box((x-12,y-9,x+12,y+9),'#cad1ce','#6a7d87',2)
# Workpiece, tailstock and carriage.
box((338,472,718,496),'#7e9ca8','#d2e0e2',2)
for x in (459,470,481): line([(x,473),(x+8,494)],'#c2a86e',4)
d.polygon([(716,472),(742,450),(800,450),(807,525),(748,525),(717,495)],fill='#ba9041',outline='#dfb963')
box((508,533,625,605),'#85969d','#bcc9cc',3)
box((533,512,599,543),'#adbdc4');box((555,485,577,514),'#d1d8d3')
d.ellipse((555,560,594,599),outline='#e1e0cb',width=5)
line([(575,563),(575,595)],'#e1e0cb',3);line([(559,580),(590,580)],'#e1e0cb',3)
# Broken guard, visibly attached only on left.
line([(161,414),(165,363),(262,350),(283,367)],'#cfab53',10)
line([(291,381),(307,402)],'#cfab53',9)
# Articulated manipulator, endpoint grips the same workpiece.
box((861,592,935,694),'#415964','#95a5a9',3)
line([(896,604),(921,412),(782,356),(646,439)],'#9daeb4',29)
line([(896,604),(921,412),(782,356),(646,439)],'#425a66',15)
for x,y in [(896,603),(921,412),(782,356),(646,439)]:
    dot(x,y,23,'#c7a152');dot(x,y,13,'#283b46');dot(x,y,5,'#a6b5bc')
line([(646,439),(620,466),(619,486)],'#acb9ba',10)
line([(646,439),(674,465),(672,486)],'#acb9ba',10)
# Alien tendon braces attach joint-to-joint, no floor carpet.
for off in (0,9,18):
    line([(896+off/3,588),(878+off/3,492),(906+off/3,423),(866,394+off/3),(790,365+off/3),(736,406+off/4),(674,431+off/4)],'#806c60',5)
# Directional resin confined to fixed base and headstock housing.
for i in range(7):
    x=160+i*17
    line([(x,631),(x+14,612),(x+6,574),(x+1,526),(x-9,504)],'#766052',9)
    line([(x+2,628),(x+16,611),(x+8,576)],'#a49178',2)
for i in range(4):
    x=718+i*23
    line([(x,693),(x-6,654),(x+7,625),(x+4,605)],'#766052',9)
# Peeled insulation bundle terminates within machine base.
line([(327,621),(382,653),(448,646)],'#161f24',13)
for i,c in enumerate(('#b69359','#6f8e96','#9a766b')):
    line([(422,647+i*3),(450,645+i*4),(465,654+i*7)],c,3)
# Attached local lamp.
line([(804,452),(817,398),(843,392)],'#96a5a9',6)
d.polygon([(832,389),(857,389),(867,405),(829,405)],fill='#c6a45e')
# Label leaders stay outside silhouettes.
text(75,327,'Broken guard',19,'#e3ba61');arrow([(205,350),(214,369)],'#e3ba61',2)
text(368,363,'Exposed chuck + workpiece',20);arrow([(469,393),(381,446)],'#c2d4db',2)
text(611,306,'Tendon-braced tool arm',20);arrow([(823,336),(832,376)],'#c2d4db',2)
text(348,686,'Ways and carriage remain exposed',20);arrow([(526,680),(537,611)],'#c2d4db',2)
text(73,747,'Resin follows the fixed base. Moving parts and working floor stay legible.',20,'#b5c3ca')

# Reader-facing intent, not an invented lore paragraph.
text(1080,258,'Before',27,'#e3ba61',True)
lines(1080,303,['A human machine shop.','A lathe turns stock;','an articulated arm','positions the workpiece.'])
text(1080,448,'What changed',27,'#e3ba61',True)
lines(1080,493,['Resin grips fixed housings.','Tendons brace the arm.','Cut insulation suggests','deliberate conversion,','not random overgrowth.'])
text(1080,670,'Read at a glance',27,'#e3ba61',True)
lines(1080,715,['A working tool repurposed','by intelligent invaders.'])

line([(48,824),(1552,824)],'#354551',2)
text(48,846,'Player goal',26,bold=True)
text(48,887,'Clear the converted workshop and its converging attackers.',27,'#e3ba61')
text(48,939,'Art must not add a repair puzzle, damage zone or new swarm behavior.',21)
text(48,975,'Layout comes next. Preserve legal lanes and keep tendons inside machinery collision.',21)
# Material swatches.
for x,c,label in [(1110,'#35454f','Oil-dark steel'),(1340,'#b38b3c','Chipped yellow'),(1110,'#806c60','Fibrous resin'),(1340,'#b6b0a1','Sparse wet edges')]:
    y=859 if label in ('Oil-dark steel','Chipped yellow') else 928
    box((x,y,x+34,y+32),c)
    text(x+44,y+6,label,17)
text(1110,992,'No poison-like green glow.',19,'#b5c3ca')
text(48,1051,'Source: canonical storyRooms.ts + room brief + issue36  |  Main 7a3f262  |  Story study only',18,'#879da8')
im.save(OUT/'story-intent.png')
print(OUT/'story-intent.png')
