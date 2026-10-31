from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib,json
root=Path('/home/chernodubv/.hermes/workspaces/containment-art-roadmap')
out=Path(__file__).parent
im=Image.new('RGB',(1600,1100),'#111c24'); d=ImageDraw.Draw(im)
def text(x,y,s,size=24,c='#dbe6eb'):
 d.text((x,y),s,font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size),fill=c)
def line(p,c='#90a4ae',w=4):d.line(p,fill=c,width=w)
text(50,32,'14 / SERVICE SHAFT LANDING',42)
text(50,91,'STORY INTENT / concept diagram, not gameplay or a fixed layout',23,'#d5ae70')
text(50,142,'The way down remains physical. The AI link does not.',30)
# isolated narrative illustration, not a route plan
# shaft back and structure
d.rectangle((55,213,940,850),fill='#192d3b',outline='#43596a',width=3)
for x in [360,615]:
 d.rectangle((x,258,x+16,815),fill='#71808a')
for y in [380,575,760]:
 line([(370,y),(625,y+95)],'#365164',10);line([(625,y),(370,y+95)],'#365164',10)
d.rectangle((405,437,570,696),fill='#35454d',outline='#8a9a9f',width=4)
for y in range(457,690,30):line([(414,y),(560,y)],'#61747b',7)
for x in [378,596]:
 for y in [454,655]: d.ellipse((x-12,y-12,x+12,y+12),fill='#aeb1a3',outline='#17242c',width=4)
for x in [438,539]:
 line([(x,280),(x,438)],'#b6bbb1',3)
 d.ellipse((x-28,250,x+28,306),fill='#526774',outline='#b0b5ac',width=4)
# connected balcony shape open on right; top and bottom run to right edge
d.polygon([(90,245),(896,245),(896,351),(245,351),(245,710),(896,710),(896,815),(90,815)],fill='#536069')
for x in range(100,893,16):
 line([(x,260),(x,335)],'#81908f',2);line([(x,727),(x,797)],'#81908f',2)
for y in range(353,711,16):line([(105,y),(229,y)],'#81908f',2)
line([(896,351),(245,351),(245,710),(896,710)],'#ccae72',7)
for x,y in [(280,345),(690,345),(285,710),(720,710)]:
 line([(x,y),(x,y-38)],'#a5a89e',6)
 d.rectangle((x-9,y-42,x+9,y-36),fill='#ffca76')
text(306,365,'EXPOSED GUIDE + COUNTERWEIGHT',19,'#aac1cc')
text(315,836,'Depth cue only. Machinery stays outside walkable floor.',18,'#a8bdc7')
# Local control inset
text(995,220,'LOCAL CONTROL',27,'#e5bd7e')
d.rectangle((998,272,1540,485),fill='#26343a',outline='#596971',width=3)
text(1021,290,'LOCAL ACCESS ONLY',27,'#f0cb8e')
d.rectangle((1032,346,1102,430),fill='#7c8380',outline='#c7c3aa',width=3)
d.ellipse((1051,369,1084,402),fill='#dbb271',outline='#333b3b',width=4)
text(1125,348,'Mechanical call plate',21)
line([(1135,420),(1210,420),(1240,394)],'#75bfc5',7)
d.rectangle((1236,380,1264,404),fill='#89c7c8')
d.rectangle((1321,399,1366,437),fill='#111c24',outline='#8caaaa',width=3)
text(1125,449,'Pulled fiber / empty socket',20,'#9ed6d8')
text(995,522,'BEFORE',21,'#d5ae70')
text(995,557,'Maintenance crews reached',24)
text(995,591,'lift guides and lower decks.',24)
text(995,647,'AFTER',21,'#d5ae70')
text(995,682,'The broken physical link',24)
text(995,716,'explains the AI access limit.',24)
text(995,776,'PLAYER GOAL',21,'#d5ae70')
text(995,811,'Cross connected platforms.',24)
text(995,845,'Reach the lower decks.',24)
line([(50,908),(1550,908)],'#435563',2)
text(50,935,'READ FIRST',20,'#d5ae70');text(50,968,'Continuous landing + shaft depth + severed connection.',25)
text(50,1013,'No jump, fall, lift-use or reconnect mechanic. No overload authorization here.',22)
text(50,1055,'Sources: canonical room14 brief + storyRooms.ts + issue35 / source 7a3f262',18,'#8ba4b2')
im.save(out/'story-intent.png')
inputs=['room14-brief.json','storyRooms.ts','storyRoomTemplates.ts','roomTemplates.ts']
pins={n:hashlib.sha256((root/'rollout-sources'/n).read_bytes()).hexdigest() for n in inputs}
(out/'source-pins.json').write_text(json.dumps({'source_commit':'7a3f262886104fb024de9684958b3f85a8859f34','canonical_sha256':pins,'image_sha256':hashlib.sha256((out/'story-intent.png').read_bytes()).hexdigest()},indent=2)+'\n')
Image.open(out/'story-intent.png').verify()
print(json.dumps({'decoded':True,'dimensions':im.size,'source_pins':pins,'png_bytes':(out/'story-intent.png').stat().st_size}))
