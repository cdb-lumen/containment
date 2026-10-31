from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, hashlib, json
ROOT=Path(__file__).resolve().parent
im=Image.new('RGB',(1600,1100),'#111a23'); d=ImageDraw.Draw(im)
def font(n): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',n)
def text(x,y,s,n=22,c='#dce6e9'): d.text((x,y),s,font=font(n),fill=c)
def line(points,c='#62828d',w=3): d.line(points,fill=c,width=w)
text(55,35,'10 / TRANSMISSION CHAMBER',38)
text(55,88,'STORY INTENT  /  CONCEPT DIAGRAM, NOT GAMEPLAY OR A VALIDATED LAYOUT',19,'#76b7c6')
text(55,137,'Hold the uplink. Make the warning reach New Earth.',30)
# Main landmark illustration: schematic oblique equipment, no roof or shield.
d.rounded_rectangle((45,200,995,770),18,fill='#192732',outline='#354b58',width=2)
text(70,220,'Proposed landmark: a low, interrupted transmission crown',23)
d.ellipse((210,330,825,665),fill='#263743',outline='#617b87',width=3)
d.ellipse((265,365,770,625),outline='#425b68',width=2)
# Low radial vanes. Gaps are intentional, not continuous barrier.
for a in [5,50,130,175,225,315]:
 r=math.radians(a); cx=520; cy=490
 pts=[]
 for rad,off in [(105,-.17),(248,-.11),(248,.11),(105,.17)]:
  pts.append((cx+rad*math.cos(r+off),cy+.50*rad*math.sin(r+off)))
 lower=[(x,y+22) for x,y in pts]
 d.polygon(pts+lower[::-1],fill='#425762',outline='#8fa0a7')
 d.polygon(pts,fill='#b6beb9',outline='#e1ddd0')
 line([pts[0],pts[2]],'#778c93',2)
# Central throat on a supported plinth.
d.rectangle((456,452,584,520),fill='#607985',outline='#9db1b8',width=2)
d.ellipse((456,487,584,544),fill='#354c5b',outline='#839ca6',width=2)
d.ellipse((456,425,584,488),fill='#a0b0b2',outline='#dae3dc',width=3)
d.ellipse((480,437,560,475),fill='#12232d',outline='#76b7c6',width=4)
# Far-perimeter antenna: supported dish/truss, no overhead arena structure.
line([(677,383),(725,291),(775,383)],'#a9bbc1',10)
line([(692,350),(757,350),(713,311),(741,311)],'#627e8b',5)
d.arc((670,263,781,323),0,180,fill='#d4d7cf',width=14)
line([(727,296),(742,265)],'#9db4c0',4)
# Desk in foreground with non-success state.
d.polygon([(640,619),(801,619),(821,656),(652,656)],fill='#899a9f',outline='#ced6d4')
d.polygon([(652,656),(821,656),(821,687),(652,687)],fill='#435a68')
d.polygon([(661,626),(784,626),(795,647),(669,647)],fill='#203b49',outline='#76b7c6')
text(315,701,'Quiet floor between equipment groups',22,'#a8bdc6')
line([(414,681),(406,598)],'#a8bdc6',2)
text(72,287,'Far perimeter',20); text(72,313,'antenna + truss',20)
line([(235,307),(634,287),(675,300)],'#86a0ab',2)
text(73,574,'Low ceramic /',20); text(73,599,'alloy vanes',20)
line([(230,601),(300,548)],'#86a0ab',2)
text(810,421,'Exposed',20);text(810,447,'feed throat',20)
line([(800,444),(587,456)],'#86a0ab',2)
# Story summary separate from model sketch.
text(1030,214,'ORIGINAL PURPOSE',20,'#76b7c6')
for i,s in enumerate(['A colony ship communications','chamber, built to transmit','through a central feed.']): text(1030,250+i*30,s,22)
text(1030,364,'WHAT HAPPENED',20,'#76b7c6')
for i,s in enumerate(['The alien-seized ship is hostile.','The player has reached the','uplink after the relay racks.','This is a war warning,','not an evacuation request.']): text(1030,400+i*30,s,22)
text(1030,588,'PLAYER READ',20,'#76b7c6')
for i,s in enumerate(['This machine must keep working.','Defend it until receipt is real.','No shield, new interaction,','or early fatal-cost reveal.']): text(1030,624+i*30,s,22)
# Milestone sequence, deliberately distinct states.
for x in [45,550,1055]: d.rounded_rectangle((x,800,x+490,990),12,fill='#20313d',outline='#476170',width=2)
text(65,820,'01 / BEFORE RECEIPT',21,'#76b7c6')
text(65,862,'Defend the uplink.',24)
text(65,907,'No success message yet.',21)
text(65,944,'Existing timing stays unchanged.',20)
text(570,820,'02 / REAL MILESTONE ONLY',21,'#76b7c6')
text(570,862,'WARNING RECEIVED',24)
text(570,907,'NEW EARTH PREPARING FOR WAR',20)
text(570,944,'Keep existing essential status.',20)
text(1075,820,'03 / LATER, NOT HERE',21,'#76b7c6')
text(1075,862,'Diagnostic gallery next.',24)
text(1075,907,'Fatal purge evidence stays there.',21)
text(1075,944,'No premature story revelation.',20)
text(55,1020,'Sources: #31 / #21 + storyRooms.ts + room10-brief.json | main 7a3f26288610',18,'#99aeb7')
text(55,1050,'Stage 0 only. Equipment relationships are proposed; routes, models and combat remain unverified.',19,'#99aeb7')
im.save(ROOT/'story-intent.png')
with Image.open(ROOT/'story-intent.png') as check:
 check.load(); assert check.size==(1600,1100)
print(json.dumps({'image':'story-intent.png','dimensions':im.size,'sha256':hashlib.sha256((ROOT/'story-intent.png').read_bytes()).hexdigest()}))
