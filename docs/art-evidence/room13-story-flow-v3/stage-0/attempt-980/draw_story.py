from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).parent
im=Image.new('RGB',(1600,1040),'#101c24'); d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def text(x,y,s,size=24,c='#e6edeb'):
 d.text((x,y),s,font=ImageFont.truetype(font,size),fill=c)
def line(points,c='#64aca8',w=10): d.line(points,fill=c,width=w,joint='curve')
def box(b,fill,outline=None,w=2): d.rounded_rectangle(b,12,fill,outline,w)
text(55,30,'13 / COOLANT PLANT',42)
text(55,88,'STORY INTENT  /  Concept diagram, not gameplay or a proposed floor plan',23,'#b9c8ca')
text(55,145,'The machinery still keeps people alive.',32,'#75c7bd')
text(55,190,'The player knows the cost. The ship has not begun the purge.',25)
box((50,255,1020,785),'#1b2b33')
text(80,276,'FUNCTION / Two working heat-exchanger installations',26)
# symbolic paired exchanger assemblies, not room geometry
for x,label in [(125,'SUPPLY / RETURN A'),(605,'SUPPLY / RETURN B')]:
 line([(x+35,444),(x+35,385),(x+270,385),(x+270,454)],'#6caaa5',14)
 line([(x+35,540),(x+35,611),(x+275,611),(x+275,535)],'#9caeb2',12)
 box((x+10,443,x+305,551),'#477f7d','#84b6af',3)
 d.ellipse((x-10,442,x+63,552),fill='#97a9aa',outline='#cad2d0',width=3)
 d.ellipse((x+255,442,x+325,552),fill='#84999c',outline='#cad2d0',width=3)
 for yy in (459,480,507,529):
  d.ellipse((x+275,yy,x+284,yy+9),fill='#263841')
 for xx in (x+72,x+232):
  box((xx,545,xx+27,582),'#677e83')
 d.ellipse((x+95,587,x+151,643),fill='#4c8583',outline='#a8c7c1',width=3)
 box((x+160,598,x+224,636),'#80989d')
 line([(x+149,616),(x+160,616)],'#c5cfcc',8)
 d.ellipse((x+233,372,x+259,398),outline='#dfb260',width=5)
 text(x-4,670,label,21,'#b5d4cf')
text(85,729,'Bolted ends + curved manifolds + supported pumps. Not a cylinder grid.',21)
box((1050,255,1550,785),'#243039')
text(1080,279,'WHAT CHANGED',25,'#e0b66d')
text(1080,330,'The lie has been exposed.',23)
text(1080,367,'Not a destroyed cooling plant.',23)
text(1080,419,'WHAT THE PLAYER DOES',25,'#e0b66d')
text(1080,470,'Descend through the pumps,',23)
text(1080,506,'knowing the fatal cost.',23)
text(1080,560,'WHAT THE ROOM SAYS',25,'#e0b66d')
text(1080,611,'Life support is still working.',23)
text(1080,648,'Descent is not authorization.',23)
text(1080,703,'No valve puzzle. No liquid hazard.',21,'#b9c8ca')
text(55,821,'VISUAL PRIORITIES',22,'#e0b66d')
text(55,860,'Paired machinery / low service saddle / clear alternate circuits and central crossing',25)
for x,c,s in [(55,'#477f7d','Turquoise enamel'),(465,'#98a8ac','Dull stainless'),(835,'#ddb164','Amber indicators')]:
 box((x,918,x+38,956),c);text(x+54,923,s,22)
text(55,996,'Sources: canonical storyRooms.ts + room13 brief at 7a3f262 / Issue #34. No runtime changes.',18,'#a7b9bd')
im.save(ROOT/'story-intent.png')
assert im.size==(1600,1040)
print('Rendered story-intent.png',hashlib.sha256((ROOT/'story-intent.png').read_bytes()).hexdigest())
