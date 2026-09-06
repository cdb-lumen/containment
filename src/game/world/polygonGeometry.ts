import type {Point} from '../roguelike/types';
export type PolygonTopology=Readonly<{boundary?:readonly Point[];voids?:readonly (readonly Point[])[]}>;
const EPS=1e-8;
function pointSegmentDistanceSquared(p:Point,a:Point,b:Point):number {
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
 return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
}
function inside(p:Point,polygon:readonly Point[]):boolean {
 let result=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  if(pointSegmentDistanceSquared(p,a,b)<EPS)return true;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;
 }return result;
}
function segmentDistanceSquared(a:Point,b:Point,c:Point,d:Point):number {
 if(a===b)return pointSegmentDistanceSquared(a,c,d);
 const cross=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
 const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
 if(((abC>0&&abD<0)||(abC<0&&abD>0))&&((cdA>0&&cdB<0)||(cdA<0&&cdB>0)))return 0;
 return Math.min(pointSegmentDistanceSquared(a,c,d),pointSegmentDistanceSquared(b,c,d),pointSegmentDistanceSquared(c,a,b),pointSegmentDistanceSquared(d,a,b));
}
/** Continuous swept-disc test, including concave edges and arbitrarily thin voids.
 * No sampling or rectangle approximation: rendering and physics use identical edges. */
export function clearPolygonTopology(topology:PolygonTopology,from:Point,to:Point,radius=0):boolean {
 if(![from.x,from.y,to.x,to.y,radius].every(Number.isFinite)||radius<0)return false;
 if(topology.boundary&&(!inside(from,topology.boundary)||!inside(to,topology.boundary)))return false;
 if(topology.voids?.some(p=>inside(from,p)||inside(to,p)))return false;
 const polygons=topology.boundary?[topology.boundary,...topology.voids??[]]:topology.voids??[];
 for(const polygon of polygons)for(let i=0;i<polygon.length;i++){
  const distance=segmentDistanceSquared(from,to,polygon[i],polygon[(i+1)%polygon.length]);
  if(radius===0?distance<EPS:distance+EPS<radius*radius)return false;
 }return true;
}
