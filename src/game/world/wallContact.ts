import type {Point,Rect} from '../roguelike/types';
import {canOccupyExpedition,type ExpeditionGeometry} from './expeditionGeometry';
const corners=(r:Rect):Point[]=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
/** Presentation contact for an already rejected projectile step. Never changes collision. */
export function wallContact(geometry:ExpeditionGeometry,from:Point,to:Point,radius:number){
 let lo=0,hi=1;
 for(let i=0;i<16;i++){const t=(lo+hi)/2,p={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};if(canOccupyExpedition(geometry,p,radius))lo=t;else hi=t;}
 const center={x:from.x+(to.x-from.x)*lo,y:from.y+(to.y-from.y)*lo};
 let distance=Infinity,contact={...center},normal={x:0,y:0};
 const polygons=[corners(geometry.bounds),...geometry.blockers.map(corners),...geometry.boundary?[geometry.boundary]:[],...geometry.voids??[]];
 for(const polygon of polygons)for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(!length)continue;
  const t=Math.max(0,Math.min(1,((center.x-a.x)*dx+(center.y-a.y)*dy)/length)),p={x:a.x+t*dx,y:a.y+t*dy},nx=center.x-p.x,ny=center.y-p.y,d=Math.hypot(nx,ny);
  if(d>=distance)continue;distance=d;contact=p;
  if(d>1e-6)normal={x:nx/d,y:ny/d};else{const sign=(-dy*(from.x-p.x)+dx*(from.y-p.y))>=0?1:-1;normal={x:-dy/Math.sqrt(length)*sign,y:dx/Math.sqrt(length)*sign};}
 }
 return {...contact,normal};
}
