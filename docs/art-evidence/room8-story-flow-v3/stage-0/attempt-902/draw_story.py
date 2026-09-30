from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import random
OUT=Path(__file__).parent
im=Image.new('RGB',(1600,1040),'#101923'); d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def text(x,y,s,size=24,fill='#dce6e9'):
 d.text((x,y),s,font=ImageFont.truetype(font,size),fill=fill)
def line(points,fill,width=3): d.line(points,fill=fill,width=width)
text(48,30,'08 / BREACHED LOADING BAY',38)
text(48,84,'STORY INTENT CONCEPT  /  NOT GAMEPLAY  /  NOT A LAYOUT APPROVAL',20,'#e3b56a')
text(48,134,'Fight around the sealed breach.',30)
text(48,181,'Alien growth follows the boarding scar. Hull seal intact.',24)
# deliberately schematic perspective vignette
floor=[(80,490),(540,285),(1070,430),(715,760)]
d.polygon(floor,fill='#273b47');d.line(floor+[floor[0]],fill='#657681',width=4)
d.polygon([(80,490),(80,398),(540,215),(540,285)],fill='#3b4c57')
d.polygon([(540,215),(1070,355),(1070,430),(540,285)],fill='#485861')
# rear closure visibly solid, scar extends into room
d.polygon([(676,270),(831,312),(831,395),(676,352)],fill='#a38b65',outline='#d6b879',width=3)
for x in [690,725,760,795]: line([(x,282+(x-690)*.27),(x,350+(x-690)*.27)],'#3e4448',5)
scar=[(740,357),(799,383),(724,449),(685,482),(577,531),(493,535),(536,483),(646,425)]
d.polygon(scar,fill='#786b58',outline='#bd9970',width=4)
d.polygon([(728,376),(772,387),(698,441),(674,467),(560,511),(523,517),(561,489),(659,437)],fill='#4c5750')
random.seed(902)
for i in range(40):
 t=random.random();x=751-205*t+random.uniform(-24,24);y=383+128*t+random.uniform(-13,13)
 r=random.randint(3,10); d.ellipse((x-r,y-r*.6,x+r,y+r*.6),fill=random.choice(['#7f9362','#a0a56b','#596e52']))
# freight volumes, deliberate subordinate function
for x,y,w in [(260,476,115),(360,405,95),(776,518,105)]:
 d.polygon([(x,y),(x+w,y-40),(x+w+50,y-21),(x+50,y+22)],fill='#aa8452')
 d.polygon([(x,y),(x+50,y+22),(x+50,y+83),(x,y+60)],fill='#715c41')
 d.polygon([(x+50,y+22),(x+w+50,y-21),(x+w+50,y+40),(x+50,y+83)],fill='#8b704b')
 line([(x+70,y+13),(x+70,y+70)],'#d0b477',4)
# visual flow only, no inferred route proof
line([(198,603),(330,653),(535,694),(743,628),(939,497)],'#7fbdc4',5)
d.polygon([(939,497),(918,509),(929,526)],fill='#7fbdc4')
text(121,700,'Illustrative movement around the scar.',20,'#9bced2')
text(121,730,'Exact routes and scale belong to stage 1.',19,'#9bced2')
# right-hand notes
text(1130,278,'BEFORE',20,'#e3b56a')
text(1130,313,'Cargo transfer bay',23)
text(1130,348,'Freight, deck markings,',19)
text(1130,376,'working ship structure.',19)
text(1130,433,'AFTERMATH',20,'#e3b56a')
text(1130,468,'Boarding scar',23)
text(1130,503,'Growth traces damage.',19)
text(1130,531,'Solid hull closure stays',19)
text(1130,559,'visible behind it.',19)
text(1130,616,'PLAYER READ',20,'#e3b56a')
text(1130,651,'Pass the wound',23)
text(1130,686,'Fight around it.',19)
text(1130,714,'No repair interaction.',19)
# labels with restrained leaders
text(74,254,'SEALED, NOT OPEN TO SPACE',19,'#e3b56a')
line([(395,273),(605,255),(710,301)],'#e3b56a',2)
text(55,804,'ART DIRECTION',19,'#e3b56a')
text(55,839,'Freight explains the old function. The scar is the focal point. Growth follows its edge.',23)
text(55,882,'Proposed appearance only. No decompression, new objective, or new mechanic.',21)
text(55,946,'Source: src/game/roguelike/storyRooms.ts:10-12 | main 7a3f26288610',18,'#98a9b5')
text(55,975,'Room 7 freight hold  >  Room 8 sealed breach  >  Room 9 relay racks',18,'#98a9b5')
im.save(OUT/'story.png')
print(OUT/'story.png')
