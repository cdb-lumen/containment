#!/usr/bin/env python3
"""Deterministic Room12 stage1 drawing and bounded rectangle geometry proof.
Run beside the retained sources directory. Pillow is the only dependency.
"""
from pathlib import Path
import hashlib, json, re, math
from collections import deque
from PIL import Image, ImageDraw, ImageFont
import PIL
ROOT=Path(__file__).resolve().parent
SRC=ROOT/'sources'
ID='safety-interlock-station'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def save(name,data): (ROOT/name).write_text(json.dumps(data,indent=2)+'\n')
t=(SRC/'storyRoomTemplates.ts').read_text()
a=(SRC/'authoredRoomTopologies.ts').read_text()
assert not re.search(r"'"+ID+r"'\s*:",a), 'An authored override now exists. Re-resolve geometry.'
rects=json.loads(re.search(r"'"+ID+r"':(\[\[.*?\]\])",t).group(1))
w,h=map(int,re.search(r'width:(\d+),height:(\d+)',t).groups())
spawn=list(map(int,re.search(r'spawn:Object.freeze\(\{x:(\d+),y:(\d+)\}',t).groups()))
exitp=list(map(int,re.search(r'exit:Object.freeze\(\{x:(\d+),y:(\d+)\}',t).groups()))
breach_block=re.search(r'breaches:Object.freeze\(\[(.*?)\]\.map',t).group(1)
breaches=[list(map(int,p)) for p in re.findall(r'\{x:(\d+),y:(\d+)\}',breach_block)]
assert (w,h)==(1200,880) and len(rects)==3 and len(breaches)==4
roles=['Sealed local recorder','Disconnected AI side','Split contactor + local battery']
routes={
 'direct': [spawn,exitp],
 'north bypass': [spawn,[100,140],[1100,140],exitp],
 'south bypass': [spawn,[100,760],[1100,760],exitp],
 'record approach': [[410,440],[410,395]],
 'AI-side approach': [[780,440],[780,395]],
 'contactor approach': [[600,440],[600,535]],
 **{f'breach {i+1} ingress':[p,[p[0],440]] for i,p in enumerate(breaches)}
}
anchors={'spawn':spawn,'exit':exitp,**{f'breach {i+1}':p for i,p in enumerate(breaches)},'record viewing point':[410,395],'AI-side viewing point':[780,395],'contactor viewing point':[600,535]}
# All route segments are axis aligned. Segment/rectangle separation is exact.
def separation(p,q,rect):
 x,y,ww,hh=rect
 dx=max(x-max(p[0],q[0]),min(p[0],q[0])-(x+ww),0)
 dy=max(y-max(p[1],q[1]),min(p[1],q[1])-(y+hh),0)
 return math.hypot(dx,dy)
def clearance(p,q):
 assert p[0]==q[0] or p[1]==q[1]
 return min(min(p[0],q[0]),w-max(p[0],q[0]),min(p[1],q[1]),h-max(p[1],q[1]),*[separation(p,q,r) for r in rects])
def proof(radius):
 # Inflate by square radius, as runtime traversal does. Partition into exact
 # open rectangular cells at every inflated edge, not a sampled grid.
 inflated=[(x-radius,y-radius,x+ww+radius,y+hh+radius) for x,y,ww,hh in rects]
 xs=sorted(set([radius,w-radius]+[v for r in inflated for v in (r[0],r[2])]))
 ys=sorted(set([radius,h-radius]+[v for r in inflated for v in (r[1],r[3])]))
 cells=set()
 for i in range(len(xs)-1):
  for j in range(len(ys)-1):
   x=(xs[i]+xs[i+1])/2;y=(ys[j]+ys[j+1])/2
   if not any(l<x<rr and top<y<bottom for l,top,rr,bottom in inflated): cells.add((i,j))
 remaining=set(cells);sizes=[]
 while remaining:
  first=min(remaining);remaining.remove(first);queue=deque([first]);n=0
  while queue:
   i,j=queue.popleft();n+=1
   for nei in ((i-1,j),(i+1,j),(i,j-1),(i,j+1)):
    if nei in remaining: remaining.remove(nei);queue.append(nei)
  sizes.append(n)
 checks={name:all(radius<p[0]<w-radius and radius<p[1]<h-radius and not any(l<=p[0]<=rr and top<=p[1]<=bottom for l,top,rr,bottom in inflated) for p in [pos]) for name,pos in anchors.items()}
 route_checks={}
 for name,points in routes.items():
  dist=min(clearance(p,q) for p,q in zip(points,points[1:]))
  # Strict square-inflation separation, matching the conservative traversal contract.
  square_ok=all(not (max(min(p[0],q[0]),l)<=min(max(p[0],q[0]),rr) and max(min(p[1],q[1]),top)<=min(max(p[1],q[1]),bottom)) for p,q in zip(points,points[1:]) for l,top,rr,bottom in inflated)
  route_checks[name]={'minimum_euclidean_clearance':dist,'square_sweep_clear':square_ok,'passed':dist>radius and square_ok}
 result={'radius':radius,'free_cells':len(cells),'connected_components':len(sizes),'component_cell_counts':sizes,'anchors_clear':checks,'routes':route_checks}
 result['passed']=len(sizes)==1 and all(checks.values()) and all(v['passed'] for v in route_checks.values())
 return result
results=[proof(r) for r in (16,28)]
geometry={'template_id':ID,'boundary':[[0,0],[w,0],[w,h],[0,h]],'width':w,'height':h,'obstacles':rects,'voids':[],'spawn':spawn,'exit':exitp,'breaches':breaches,'roles':roles,'routes':routes,'anchors':anchors,'authored_override':False}
save('layout-geometry.json',geometry)
save('geometry-checks.json',{'method':'Exact rectangular cell decomposition of square-inflated obstacles and inset room. Positive-area shared-edge adjacency. Continuous axis-aligned route sweeps. No sampled-grid pass.','bound':'Conservative center domain excludes circular corner slivers. Static source geometry only, not runtime navigation or combat. No added solids.','results':results,'passed':all(r['passed'] for r in results)})
# Drawing coordinates preserve game-unit proportions. Annotations are not solids.
W,H=2400,1840
im=Image.new('RGB',(W,H),'#101e27');d=ImageDraw.Draw(im)
fontdir=Path('/usr/share/fonts/truetype/dejavu')
def f(size,bold=False):return ImageFont.truetype(str(fontdir/('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')),size)
white='#eee9d8';muted='#abc0c5';mint='#a1d4c7';orange='#e5a36b';blue='#80b9d9'
def text(x,y,s,size=24,color=white,bold=False): d.text((x,y),s,font=f(size,bold),fill=color)
def lines(x,y,seq,size=24,color=muted,step=36):
 for i,s in enumerate(seq):text(x,y+i*step,s,size,color)
text(70,42,'ROOM 12  /  STAGE 1  /  LAYOUT DRAFT',25,mint,True)
text(70,94,'The record stays outside the AI network',48,white,True)
text(70,164,'Safety-interlock station  |  Existing geometry retained  |  Top-down, game units',26,muted)
text(70,212,'Clear the interlock station. Review the pre-awakening safety record.',28,orange,True)
ox,oy,scale=80,310,1.30
def pt(p):return (round(ox+p[0]*scale),round(oy+p[1]*scale))
def box(r,fill,outline=None,width=2):
 x,y,ww,hh=r;d.rectangle([pt((x,y)),pt((x+ww,y+hh))],fill=fill,outline=outline,width=width)
def line(points,color,width=3):d.line([pt(p) for p in points],fill=color,width=width,joint='curve')
def label(x,y,s,size=22,color=white,bold=False):text(*pt((x,y)),s,size,color,bold)
box((0,0,w,h),'#1b3039',muted,4)
for x in range(100,w,100):line([(x,0),(x,h)],'#29414a',1)
for y in range(100,h,100):line([(0,y),(w,y)],'#29414a',1)
for x in (0,300,600,900,1200):text(pt((x,0))[0]-15,277,str(x),18,muted)
for y in (0,220,440,660,880):text(15,pt((0,y))[1]-12,str(y),18,muted)
# Swept radius28 bands on the three continuous routes.
for name in ('north bypass','south bypass','direct'):
 line(routes[name],'#294d53',round(56*scale))
 line(routes[name],mint,4)
for name,points in routes.items():
 if name not in ('north bypass','south bypass','direct'):line(points,blue if name.startswith('breach') else orange,3)
for i,r in enumerate(rects):box(r,['#746653','#435b68','#5a5b49'][i],white,3)
# Plain equipment-purpose blocks, not detailed mechanical models.
label(341,222,'01  SEALED',23,white,True);label(341,248,'LOCAL',23,white,True);label(341,274,'RECORDER',23,white,True)
label(341,311,'FOCAL POINT',17,orange,True)
label(713,224,'02  AI SIDE',23,white,True);label(713,255,'DISCONNECTED',16,white,True)
for x in (720,775,830):box((x,305,15,21),'#142530',blue)
label(498,590,'03  CONTACTOR',19,white,True)
box((496,630,48,32),'#b47c5a');box((568,630,48,32),'#b47c5a')
label(545,666,'GAP',15,orange,True)
box((652,598,54,72),'#8e9980',white)
label(650,677,'BATTERY',13,white,True)
label(490,714,'LOCAL POWER / SAFETY ASSEMBLY',18,muted)
# A dimension line communicates empty floor, never a barrier.
line([(490,195),(700,195)],orange,2)
for x in (490,700):line([(x,188),(x,202)],orange,2)
label(510,158,'210 u clear separation',18,orange)
label(508,262,'NO AI LINK',19,mint,True)
label(506,294,'Open floor',18,muted)
label(346,362,'View record',18,orange)
label(737,363,'Empty sockets',18,orange)
label(427,461,'OPEN COMBAT / TRANSIT FLOOR',22,mint,True)
label(442,99,'NORTH BYPASS',18,mint,True)
label(817,793,'SOUTH BYPASS',18,mint,True)
for key in ('record viewing point','AI-side viewing point','contactor viewing point'):
 x,y=pt(anchors[key]);rr=round(28*scale);d.ellipse((x-rr,y-rr,x+rr,y+rr),outline=orange,width=2)
for name,p in [('ENTRY',spawn),('EXIT',exitp)]:
 x,y=pt(p);d.ellipse((x-12,y-12,x+12,y+12),fill=mint)
 label(p[0]-40,p[1]+42,name,24,mint,True)
 label(p[0]-42,p[1]+72,f'{p[0]}, {p[1]}',18,muted)
for i,p in enumerate(breaches):
 x,y=pt(p);d.polygon([(x,y-13),(x+13,y),(x,y+13),(x-13,y)],fill=blue)
 label(p[0]-55,p[1]-42,f'B{i+1}  {p[0]},{p[1]}',17,blue)
# Scale bar inside otherwise unused bottom left floor.
line([(40,830),(140,830)],white,4);label(42,844,'100 units',15,muted)
rx=1710
text(rx,307,'Purpose within retained solids',26,white,True)
lines(rx,363,['01  Local archive / upper west','Sealed mechanical recorder.','Review from its south face.','No new activation objective.'],23,muted)
lines(rx,533,['02  AI housing / upper east','Unplugged sockets face south.','210 units of open floor separate','the two retained reservations.'],23,muted)
lines(rx,703,['03  Safety assembly / lower center','Split jaws with a visible gap.','Local battery shares this footprint.','No parts extend into the routes.'],23,muted)
text(rx,887,'Retained collision reservations',25,white,True)
lines(rx,934,['01  x330 y210  /  160 x 140','02  x700 y210  /  160 x 140','03  x480 y580  /  240 x 120','Boundary  0,0 to 1200,880','No authored polygon override.','No added walls, voids or solids.'],22,muted,34)
text(rx,1169,'Circulation check',25,mint,True)
lines(rx,1216,['Radius 16 and 28 checked.','One connected conservative domain.','All drawn route sweeps clear.','Tinted bands show radius 28.','Orange circles are viewing centers.','Blue diamonds are breach anchors.'],22,muted,34)
d.line((70,1500,2330,1500),fill='#47616a',width=2)
text(70,1530,'LOCAL RECORD, BEFORE AWAKENING',26,orange,True)
text(70,1580,'Rescue impossible.  >  AI acknowledged.  >  Survival promise issued afterward.',32,white,True)
text(70,1640,'After the war and fatal-purge warnings. Before coolant descent. The ordering proves deliberate deception.',24,muted)
text(70,1690,'Skippable review retains essential status: passengers alive, purge kills everyone, AI knew before awakening.',24,muted)
text(70,1750,'DRAWING ONLY. No lock puzzle, repair, reconnection, Destroy ship control or armed-overload state.',24,orange,True)
text(70,1790,'Static geometry proof only. Not gameplay, model, lighting, muted-flow or human-acceptance evidence.',22,muted)
im.save(ROOT/'room12-layout.png',compress_level=9)
print(json.dumps({'image':[W,H],'geometry_passed':all(r['passed'] for r in results),'radii':results,'pillow':PIL.__version__},indent=2))
assert all(r['passed'] for r in results)
