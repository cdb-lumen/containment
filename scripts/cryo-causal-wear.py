"""World-position authored contact wear rasterized into existing UV islands.
No geometry edits, global noise, or simulated high-poly baking.
"""
import numpy as np

def positions(o, tile):
 o.data.calc_loop_triangles()
 xyz=np.zeros((tile,tile,3)); valid=np.zeros((tile,tile),bool)
 uv=o.data.uv_layers.active.data
 for tri in o.data.loop_triangles:
  t=np.array([uv[i].uv[:] for i in tri.loops])*(tile-4)+2
  lo=np.maximum(np.floor(t.min(0)).astype(int),0);hi=np.minimum(np.ceil(t.max(0)).astype(int),tile-1)
  if np.any(hi<lo):continue
  yy,xx=np.mgrid[lo[1]:hi[1]+1,lo[0]:hi[0]+1];q=np.stack([xx,yy],-1)-t[0]
  a=t[1]-t[0];b=t[2]-t[0];d=a[0]*b[1]-a[1]*b[0]
  if abs(d)<1e-8:continue
  u=(q[:,:,0]*b[1]-q[:,:,1]*b[0])/d;v=(a[0]*q[:,:,1]-a[1]*q[:,:,0])/d
  inside=(u>=-.015)&(v>=-.015)&(u+v<=1.015)
  p=np.array([(o.matrix_world@o.data.vertices[i].co)[:] for i in tri.vertices])
  region=xyz[lo[1]:hi[1]+1,lo[0]:hi[0]+1];region[inside]=(p[0]+u[:,:,None]*(p[1]-p[0])+v[:,:,None]*(p[2]-p[0]))[inside]
  valid[lo[1]:hi[1]+1,lo[0]:hi[0]+1]|=inside
 return xyz,valid

def wear(o,c,r,metal):
 tile=len(c);p,valid=positions(o,tile);x,y,z=p[:,:,0],p[:,:,1],p[:,:,2];name=o.name
 edge=np.zeros_like(x);dirt=np.zeros_like(x);rub=np.zeros_like(x)
 # Coating loss where clamp heels meet the removable lid. Broken, finite scars.
 jag=.006*np.sin(y*137+x*93)+.003*np.sin(y*317-x*211)+.002*np.sin(y*79+x*557)
 if name=='Thick removable enamel lid':
  contact=np.maximum(np.exp(-((y-.727-.018*np.sin(x*19))/.090)**2),np.exp(-((y+.688+.017*np.sin(x*13))/.066)**2))
  edge=np.clip((np.abs(x+.12)-.449+jag)/.026,0,1)*contact*(z>.578)*(z<.645)
  edge*=.72+.18*np.sin(y*61+x*43)
  edge=np.maximum(edge,np.clip((1-((x-.29)/.07)**2-((z-.608)/.028)**2+jag*18)*2,0,1)*(y>1.12+jag)*.75)
 if name=='Head end protective crown':
  edge=np.clip((1-((y-.752)/.057)**2-((x-.169)/.040)**2+jag*25)*2,0,1)*(z>.674)*.85
  edge=np.maximum(edge,np.clip((1-((x+.37)/.041)**2-((y-.332)/.013)**2+jag*20)*2,0,1)*(z>.676)*.6)
 if name.startswith('Latch fixed receiver'):
  edge=(z>.50+jag)*(np.sin(y*165+x*99)>.0)*.8
 if name=='Service bay lower sill':
  edge=(y>1.255+jag)*(z>.208)*(np.sin(x*29)>.1)*.95
 if name.startswith('Service bay side cheek'):
  edge=(y>1.245+jag)*(z<.30)*.7
 if name=='Insulated lower vessel':
  # Gravity streaks start at the seal, on the service end, not across clean crown.
  streak=np.exp(-((x+.34)/.017)**2)+.65*np.exp(-((x-.11)/.012)**2)
  dirt=np.clip(streak,0,1)*(y>.89)*(z>.27)*(z<.47)*np.clip((z-.27)/.15,0,1)*.4
 if name.startswith('Rack longitudinal folded rail'):
  rub=(np.abs(y)>.76)*(z>.13)*(np.sin(y*170+x*110)>.25)*.6
 if name.startswith(('Over-centre pressure latch','Manifold hex union','Vessel socket')):
  rub=(np.sin(z*490+y*180+x*60)>.45)*.5
 if name=='Service bay recessed back':dirt=(z<.30)*.3
 if name=='Service bay lower sill':dirt=np.clip((np.abs(x+.12)-.27)/.14,0,1)*(y<1.22)*.38
 edge=np.clip(edge,0,1)*valid;dirt=np.clip(dirt,0,1)*valid;rub=np.clip(rub,0,1)*valid
 c[:]=c*(1-edge[:,:,None])+np.array([.075,.095,.10])*edge[:,:,None]
 c[:]=c*(1-dirt[:,:,None])
 c[:]=c*(1-rub[:,:,None])+np.array([.42,.46,.47])*rub[:,:,None]
 r[:]=r*(1-edge[:,:,None])+.34*edge[:,:,None]
 r[:]=r*(1-rub[:,:,None])+.23*rub[:,:,None]
 metal[:]=metal*(1-edge[:,:,None])+.82*edge[:,:,None]
 return int(np.count_nonzero(edge)),int(np.count_nonzero(rub))
