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
 // Centroid refinement leaves boundary edges intact and shares every original
 // edge. Unlike independently split edges this cannot introduce T junctions.
 for(let depth=0;depth<3;depth++)faces=faces.flatMap(([a,b,c])=>{
  const k=points.length;points.push({x:(points[a].x+points[b].x+points[c].x)/3,y:(points[a].y+points[b].y+points[c].y)/3});
  return [[a,b,k],[b,c,k],[c,a,k]];
 });
 const vertices:number[]=[],indices:number[]=[],n=points.length;
 const heights=points.map(height);
 if(heights.some(h=>!Number.isFinite(h)||h<=0))throw new Error('Shell heights must be finite and positive');
 for(const top of [false,true])for(const [i,p] of points.entries())vertices.push(p.x/unit,(top?heights[i]:0)/unit,p.y/unit);
 for(const [a,b,c] of faces){
  const cross=(points[b].x-points[a].x)*(points[c].y-points[a].y)-(points[b].y-points[a].y)*(points[c].x-points[a].x);
  const down=cross>0?[a,b,c]:[a,c,b];indices.push(...down,down[0]+n,down[2]+n,down[1]+n);
 }
 const ccw=T.ShapeUtils.area(contour.map(p=>new T.Vector2(p.x,p.y)))>0;
 for(let a=0;a<contour.length;a++){
  const b=(a+1)%contour.length;
  indices.push(...(ccw?[a,a+n,b,b,a+n,b+n]:[a,b,a+n,b,b+n,a+n]));
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));g.setIndex(indices);g.computeVertexNormals();g.userData.environmentUV=true;return g;
}
