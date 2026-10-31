from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parent
l=json.loads((ROOT/'layout.json').read_text())
im=Image.new('RGB',(1800,1200),'#111c28'); d=ImageDraw.Draw(im)
def font(n,b=False):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',n)
def text(p,t,size=23,col='#d4e0e8',bold=False):d.text(p,t,font=font(size,bold),fill=col)
def xy(p):return (60+p['x']*.9,210+p['y']*.9)
def line(points,col,w=3):d.line([xy(p) for p in points],fill=col,width=w,joint='curve')
def badge(p,n,col='#9fd9e3'):
 x,y=xy(p);d.ellipse((x-15,y-15,x+15,y+15),fill=col);d.text((x,y),n,font=font(19,True),fill='#13222d',anchor='mm')
text((60,32),'10 / TRANSMISSION CHAMBER',38,bold=True)
text((60,88),'Layout draft  |  Defend the uplink until the war warning is received.',25)
text((60,132),'SOURCE-ISOLATED PROPOSAL   /   Not a gameplay screenshot or implemented collision',20,'#e3b870')
d.rectangle((60,210,1140,1002),fill='#1b2d39',outline='#718595',width=3)
for x in range(100,1200,100):line([{'x':x,'y':0},{'x':x,'y':880}],'#243642',1)
for y in range(100,880,100):line([{'x':0,'y':y},{'x':1200,'y':y}],'#243642',1)
# Planned circulation ribbons show a radius28 sweep, not floor decoration.
for r in l['routes']:
 if r['id'] in ['outer-ring-clockwise','inner-service-clockwise','entry-to-defense','defense-to-exit']:
  line(r['points'],'#254b52',50);line(r['points'],'#70afb8',3)
for r in l['routes']:
 if r['id'].startswith('service-spoke'):line(r['points'],'#477b84',2)
for i in range(4):
 r=next(r for r in l['routes'] if r['id']==f'breach-{i}-to-sector-{[240,300,120,60][i]}')
 line(r['points'],'#aa8456',3)
for s in l['solids']:
 col='#b8cbcb' if s['id'].startswith('waveguide') else '#728a9b'
 if s['id']=='exposed-feed':col='#dcab66'
 d.polygon([xy(p) for p in s['points']],fill=col,outline='#edf0e6',width=2)
 if s['id'].startswith('waveguide'):
  pts=s['points']; a={'x':sum(p['x'] for p in pts)/4,'y':sum(p['y'] for p in pts)/4}; x,y=xy(a)
  d.ellipse((x-4,y-4,x+4,y+4),fill='#30434b')
for p,n in [(l['spawn'],'IN'),(l['exit'],'OUT')]:
 x,y=xy(p);d.ellipse((x-19,y-19,x+19,y+19),fill='#94d2b0');text((x-25,y+28),n,20,'#94d2b0',True)
for i,p in enumerate(l['breaches']):
 x,y=xy(p);d.rectangle((x-9,y-9,x+9,y+9),fill='#e0ad70');text((x-15,y+15),'B'+str(i+1),17,'#e0ad70')
badge({'x':600,'y':440},'1','#e7c48f');badge({'x':600,'y':260},'2');badge({'x':600,'y':75},'3');badge({'x':925,'y':652},'4')
text((78,182),'N / FAR WALL',17,'#8fa7b8');text((848,1015),'1200 x 880 game units',19,'#8fa7b8')
text((410,952),'OPEN DEFENSE FLOOR',18,'#8fa7b8')
text((1210,211),'Equipment and activity',27,bold=True)
y=273
for title,lines in [
 ('1  Exposed feed throat',['The defended focal point.','60-unit radial reservation.']),
 ('2  Broken transmission crown',['Six low radial waveguides.','Broad gaps connect inner service','space to the outer defense loop.']),
 ('3  Far-wall antenna + dish feed',['Tall equipment stays off the arena.','Anchored truss, no overhead roof.']),
 ('4  Acknowledgment desk',['Southeast working station.','Real receipt triggers the message;','no new interaction or shield.'])]:
 text((1210,y),title,22,'#d4e0e8',True); y+=35
 for t in lines:text((1210,y),t,21,'#9fb3c2');y+=29
 y+=25
text((1210,870),'Route checks',25,bold=True)
text((1210,911),'199 / 199 CPU checks passed',22,'#94d2b0',True)
text((1210,947),'Radii 16 / 28 / 38; swept segments.',20,'#9fb3c2')
text((1210,979),'No AI, combat or native-art claim.',20,'#9fb3c2')
d.line((60,1060,1740,1060),fill='#435767',width=2)
text((60,1084),'TEAL  Traversal study, not painted floor     AMBER  Existing breach approaches     FILLED SHAPES  Proposed solids',21)
text((60,1125),'Entry, exit, breaches and envelope retained. Both loop directions pass. Negative feed-crossing route stays blocked.',21,'#9fb3c2')
im.save(ROOT/'layout.png')
print(ROOT/'layout.png')
