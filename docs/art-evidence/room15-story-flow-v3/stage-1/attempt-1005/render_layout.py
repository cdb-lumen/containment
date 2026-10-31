"""CPU-only deterministic top-down concept. Run after validate-layout.mjs."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parent
DATA=json.loads((ROOT/'layout-data.json').read_text())
im=Image.new('RGB',(1800,1280),'#101b22');d=ImageDraw.Draw(im)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def text(x,y,s,size=21,c='#e7edf0'):
 d.text((x,y),s,font=ImageFont.truetype(FONT,size),fill=c)
def pt(p):return (70+p['x'],200+p['y'])
def box(r):return (70+r['x'],200+r['y'],70+r['x']+r['width'],200+r['y']+r['height'])
def line(points,c,w=3):d.line([pt(p) for p in points],fill=c,width=w)
def arrow(a,b,c,w=3):
 line([a,b],c,w); x,y=pt(b); t=math.atan2(b['y']-a['y'],b['x']-a['x']);d.polygon([(x,y),(x-13*math.cos(t-.5),y-13*math.sin(t-.5)),(x-13*math.cos(t+.5),y-13*math.sin(t+.5))],fill=c)
text(60,35,'15 / INFESTED WORKSHOP',38)
text(60,91,'Layout draft  |  Keep the machine islands. Give the floor back to combat.',25,'#d4b571')
text(60,137,'Clear the converted workshop and its converging attackers.',21)
# Exact room bounds. Anchor symbols do not cut new door holes.
d.rectangle((70,200,1270,1080),fill='#202e35',outline='#b8c6ce',width=5)
for x in range(100,1200,100):d.line((70+x,204,70+x,1076),fill='#2a373e',width=1)
for y in range(100,880,100):d.line((74,200+y,1266,200+y),fill='#2a373e',width=1)
for x in range(0,1201,200):text(64+x,174,str(x),14,'#9aacb6')
for y in range(0,881,220):text(18,191+y,str(y),14,'#9aacb6')
# Width 56 depicts radius-28 route reservation, not a painted floor stripe.
for r in DATA['routes']:
 line(r['points'],'#304e54',56)
for r in DATA['routes']:
 c='#70ccd2' if r['id']=='main' else '#568e9a'
 line(r['points'],c,4 if r['id']=='main' else 2)
 if not r['id'].startswith('activity'):arrow(r['points'][-2],r['points'][-1],c)
for i,r in enumerate(DATA['template']['obstacles']):
 d.rectangle(box(r),fill='#42525b',outline='#d7e1e6',width=3)
 # thin inner proposal bounds distinct from authoritative white outline
 e=next(e for e in DATA['equipment'] if e['obstacle']==i)
 d.rectangle(box(e['envelope']),outline='#d4b571',width=2)
# Top-down symbols, all inside their existing solid islands.
# A lathe bed, exposed ways, chuck and rear-mounted articulated arm.
d.rectangle((370,488,518,537),fill='#232d32',outline='#cfaa55',width=3)
d.line((385,506,505,506),fill='#c5d0d5',width=4);d.line((385,521,505,521),fill='#c5d0d5',width=4)
d.rectangle((367,486,393,540),fill='#b9994e');d.rectangle((472,496,493,530),fill='#ab914f')
d.ellipse((395,501,413,525),outline='#e1e6e7',width=3)
d.line((402,513,486,513),fill='#dcd2ba',width=4)
d.line((505,454,466,445,450,478,464,505),fill='#be9b50',width=10)
for x,y in [(505,454),(466,445),(450,478)]:d.ellipse((x-7,y-7,x+7,y+7),fill='#222e32',outline='#dcc075',width=2)
d.line((507,455,475,459,459,479),fill='#a07760',width=3)
d.line((362,492,373,486,378,500),fill='#a07760',width=4)
text(360,431,'A',23,'#f4d181')
# B gantry floor footprint with two rails and a transverse carriage.
for x in [790,866]:d.rectangle((x,386,x+12,575),fill='#998553')
d.rectangle((788,438,881,462),fill='#b29a61');text(814,486,'B',25,'#f4d181')
# C assembly fixture bench.
d.rectangle((573,791,699,851),fill='#29363e',outline='#aa9769',width=3)
d.rectangle((617,805,654,837),outline='#aebdc5',width=3);text(616,866,'C',25,'#f4d181')
# D supply cabinet with bays.
for x in [937,974,1011]:d.rectangle((x,777,x+29,850),fill='#36444c',outline='#aa9769',width=2)
text(982,862,'D',25,'#f4d181')
for a in DATA['activities']:
 x,y=pt(a['point']);d.ellipse((x-28,y-28,x+28,y+28),outline='#e4bc6d',width=2);text(x-7,y-12,a['id'],18,'#f4d181')
for i,b in enumerate(DATA['template']['breaches']):
 x,y=pt(b);d.polygon([(x,y-13),(x+13,y),(x,y+13),(x-13,y)],fill='#c08077');text(x-26,y-39,'B'+str(i+1),16,'#e9b1a4')
for key,label in [('spawn','ENTRY'),('exit','EXIT')]:
 p=DATA['template'][key];x,y=pt(p);d.ellipse((x-16,y-16,x+16,y+16),fill='#72c5cf',outline='#dfebed',width=2);text(x-33,y+33,label,19)
text(512,657,'CLEAR CROSS-AISLE',21,'#b9e3e5')
text(295,730,'Open working floor',18,'#869ba5')
text(925,415,'East return lane',18,'#869ba5')
# Technical corner diagnostics are explicitly not proposed debris.
res=json.loads((ROOT/'test-results.json').read_text())
for p in res['radii']['28']['sampledConnectivity']['unreachable']:
 x,y=pt(p);d.line((x-4,y-4,x+4,y+4),fill='#e18c9d',width=2);d.line((x-4,y+4,x+4,y-4),fill='#e18c9d',width=2)
text(1330,200,'PROPOSED USE',24,'#d4b571')
blocks=[('A  Conversion focal point',['Lathe + rear-mounted arm.','Shared workpiece stays inside','the original 190 x 140 solid.']),('B  Fabrication gantry',['Retain the tall north island.','Working face looks west.']),('C  Fixture bench',['Assembly faces the central aisle.','No loose stock on the floor.']),('D  Tool and stock cabinet',['North-facing access.','Keep the southeast lane open.'])]
y=249
for title,rows in blocks:
 text(1330,y,title,21);y+=35
 for row in rows:text(1330,y,row,18,'#adc0ca');y+=27
 y+=26
text(1330,851,'PLAN KEY',23,'#d4b571')
for y,s,c in [(895,'White outline: existing solids','#d7e1e6'),(928,'Gold: equipment / access proposal','#e4bc6d'),(961,'Blue band: 56-unit route envelope','#70ccd2'),(994,'Red diamond: breach anchor','#e9b1a4'),(1027,'Pink x: sweep-corner diagnostic','#e18c9d')]:text(1330,y,s,17,c)
text(70,1120,'UNCHANGED GEOMETRY',23,'#d4b571')
text(70,1159,'1200 x 880 units. Four retained obstacles. Entry, exit and all four breaches remain fixed.',21)
text(70,1193,'CPU route checks: radii 16 / 28 pass. Corner-grid mismatch retained in report. Not live combat evidence.',19,'#aec3ce')
text(70,1231,'Stage 1 / attempt 1005  |  Top-down concept only. No runtime edit, new hazard, model approval or room acceptance.',17,'#859ca9')
im.save(ROOT/'layout.png')
print(ROOT/'layout.png')
