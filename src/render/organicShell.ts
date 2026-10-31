import * as T from 'three';
import type {Point} from '../game/roguelike/types';

/** Closed heightfield over a simple concave contour. No radial contraction: every
 * refined triangle remains inside an original constrained triangulation face.
 * Caller must establish a simple contour with no self-intersections; reject
 * missing/degenerate coordinates, invalid scale and nonpositive heights here. */
export function organicShell(contour:readonly Point[],height:(p:Point)=>number,unit=32){
 if(contour.length<3||!Number.isFinite(unit)||unit<=0||contour.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error('Invalid shell contour or scale');
 const points=contour.map(p=>({...p}));
 let faces=T.ShapeUtils.triangulateShape(points.map(p=>new T.Vector2(p.x,p.y)),[]);
 const area=Math.abs(T.ShapeUtils.area(points.map(p=>new T.Vector2(p.x,p.y))));
 if(area<1e-8||faces.length!==points.length-2)throw new Error('Shell requires a simple nondegenerate contour');
 // Split shared edges once per level, including the side-wall boundary. A
 // centroid-only split leaves long interior edges at their endpoint heights,
 // producing false valleys across an otherwise smooth heightfield.
 let boundary=contour.map((_,i)=>i);
 for(let depth=0;depth<3;depth++){
  const mids=new Map<string,number>();
  const midpoint=(a:number,b:number)=>{
   const key=`${Math.min(a,b)},${Math.max(a,b)}`;let k=mids.get(key);
   if(k===undefined){k=points.length;points.push({x:(points[a].x+points[b].x)/2,y:(points[a].y+points[b].y)/2});mids.set(key,k);}
   return k;
  };
  faces=faces.flatMap(([a,b,c])=>{
   const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);
   return [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]];
  });
  boundary=boundary.flatMap((a,i)=>[a,midpoint(a,boundary[(i+1)%boundary.length])]);
 }
 const vertices:number[]=[],indices:number[]=[],n=points.length;
 const heights=points.map(height);
 if(heights.some(h=>!Number.isFinite(h)||h<=0))throw new Error('Shell heights must be finite and positive');
 for(const top of [false,true])for(const [i,p] of points.entries())vertices.push(p.x/unit,(top?heights[i]:0)/unit,p.y/unit);
 for(const [a,b,c] of faces){
  const cross=(points[b].x-points[a].x)*(points[c].y-points[a].y)-(points[b].y-points[a].y)*(points[c].x-points[a].x);
  const down=cross>0?[a,b,c]:[a,c,b];indices.push(...down,down[0]+n,down[2]+n,down[1]+n);
 }
 const ccw=T.ShapeUtils.area(contour.map(p=>new T.Vector2(p.x,p.y)))>0;
 for(let i=0;i<boundary.length;i++){
  const a=boundary[i],b=boundary[(i+1)%boundary.length];
  indices.push(...(ccw?[a,a+n,b,b,a+n,b+n]:[a,b,a+n,b,b+n,a+n]));
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));g.setIndex(indices);g.computeVertexNormals();g.userData.environmentUV=true;return g;
}
