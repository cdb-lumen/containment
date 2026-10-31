from pathlib import Path
import json,math
from PIL import Image,ImageDraw
coords=[(p['x'],p['y']) for p in json.loads(Path('/workspace/containment-room16-remodel/tests/fixtures/swarm-organ-lobed-contour.json').read_text())]
def inside(x,y):
 hit=False
 for (ax,ay),(bx,by) in zip(coords,coords[1:]+coords[:1]):
  if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:hit=not hit
 return hit
def cross(a,b,p):return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
def clip(poly,limit):
 for a,b in zip(limit,limit[1:]+limit[:1]):
  prev=poly[-1];pd=cross(a,b,prev);out=[]
  for cur in poly:
   cd=cross(a,b,cur)
   if (cd>=0)!=(pd>=0):
    t=pd/(pd-cd);out.append((prev[0]+(cur[0]-prev[0])*t,prev[1]+(cur[1]-prev[1])*t))
   if cd>=0:out.append(cur)
   prev,pd=cur,cd
  poly=out
  if not poly:break
 return poly
specs=[('west-outer',408,173,.58,112,100),('west-middle',468,215,.63,123,112),('west-inner',533,254,.2,125,100),('east-outer',790,172,-.65,115,110),('east-middle',737,212,-.56,124,100),('east-inner',680,250,-.20,120,112),('south-upper',590,325,1.0,115,110),('south-lower',612,365,1.22,90,100)]
result=[]
for name,cx,cy,angle,length,width in specs:
 shape=[]
 for i in range(48):
  a=i*math.tau/48;u=math.cos(a)*length*.5;v=math.sin(a)*width*.5;shape.append((cx+u*math.cos(angle)-v*math.sin(angle),cy+u*math.sin(angle)+v*math.cos(angle)))
 pts=clip(coords,shape)
 inset=pts
 result.append({'name':name,'center':{'x':cx,'y':cy},'angle':angle,'length':length,'width':width,'contour':[{'x':round(x,6),'y':round(y,6)} for x,y in inset]})
out=Path('/workspace/room16-structural-scutes-proposal');out.mkdir(exist_ok=True)
if (out/'footprints.png').exists() and not(out/'isolated-plaques-rejected.png').exists():(out/'footprints.png').rename(out/'isolated-plaques-rejected.png')
(out/'scutes.json').write_text(json.dumps(result,indent=2)+'\n');im=Image.new('RGB',(1100,650),'#182127');d=ImageDraw.Draw(im)
def pt(p):return ((p[0]-300)*1.8+30,(p[1]-90)*1.8+50)
d.polygon([pt(p) for p in coords],fill='#65584c',outline='#9d9988')
for i,r in enumerate(result):d.polygon([pt((p['x'],p['y'])) for p in r['contour']],fill=['#384b43','#293c34'][i%2],outline='#a5af94');d.text(pt((r['center']['x'],r['center']['y'])),str(i+1),fill='white')
d.ellipse([pt((547,241)),pt((653,329))],outline='#b49d69',width=2);d.rectangle([pt((660,214)),pt((704,264))],outline='#ddd9ba',width=2)
d.text((20,15),'Structural footprint proposal ONLY: overlapping full-width shells. Height relief must expose cavity, cuts and cabinet.',fill='white');im.save(out/'footprints.png');print([(r['name'],len(r['contour'])) for r in result])
