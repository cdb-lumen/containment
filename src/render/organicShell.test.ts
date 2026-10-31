import {it,expect} from 'vitest';
import * as T from 'three';
import proposed from '../../tests/fixtures/swarm-organ-proposed-contour.json';
import {organicShell} from './organicShell';
// U-shaped counterexample: contraction toward its centroid crosses empty space.
const contour=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:7,y:10},{x:7,y:3},{x:3,y:3},{x:3,y:10},{x:0,y:10}];
it.each([2,3].flatMap(refinements=>[[contour,refinements],[[...contour].reverse(),refinements]] as const))('seals a concave footprint without bridging its cavity',(points,refinements)=>{
 const g=organicShell(points,()=>4,1,refinements),p=g.getAttribute('position'),ids=Array.from(g.index!.array);
 const edges=new Map<string,number[]>();let volume=0;
 for(let i=0;i<ids.length;i+=3){
  const v=ids.slice(i,i+3).map(k=>new T.Vector3().fromBufferAttribute(p,k));
  expect(v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).lengthSq()).toBeGreaterThan(1e-12);
  volume+=v[0].dot(v[1].clone().cross(v[2]))/6;
  for(let j=0;j<3;j++){const a=ids[i+j],b=ids[i+(j+1)%3],key=`${Math.min(a,b)},${Math.max(a,b)}`,e=edges.get(key)??[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}
 }
 expect([...edges.values()].every(([count,direction])=>count===2&&direction===0)).toBe(true);expect(volume).toBeCloseTo(72*4,4);
 const mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld(true);
 for(const x of [1,5,9])for(const z of [1,5,9]){
  const ray=new T.Raycaster(new T.Vector3(x,10,z),new T.Vector3(0,-1,0));
  expect(ray.intersectObject(mesh).length>0).toBe(x!==5||z===1);
 }
 // Horizontal shot section also retains the notch, not just the top silhouette.
 expect(new T.Raycaster(new T.Vector3(5,2,11),new T.Vector3(0,0,-1)).intersectObject(mesh)[0].distance).toBeCloseTo(8);
 g.dispose();(mesh.material as T.Material).dispose();
});

it('rejects missing coordinates, invalid scales and collapsed heights',()=>{
 for(const points of [[],[{x:0,y:0},{x:1,y:0},{x:2,y:0}],[{x:NaN,y:0},...contour]])expect(()=>organicShell(points,()=>4)).toThrow();
 for(const refinements of [-1,4,1.5,NaN])expect(()=>organicShell(contour,()=>4,1,refinements)).toThrow();
 for(const unit of [0,-1,NaN])expect(()=>organicShell(contour,()=>4,unit)).toThrow();
 for(const h of [0,-1,NaN,Infinity])expect(()=>organicShell(contour,()=>h)).toThrow();
});
it('keeps the proposed 132-point contour closed under varying positive heights',()=>{
 const g=organicShell(proposed,p=>34+6*Math.sin(p.x/70)*Math.cos(p.y/80)),positions=g.getAttribute('position'),ids=Array.from(g.index!.array),edges=new Map<string,number[]>();let volume=0;
 for(let i=0;i<ids.length;i+=3){
  const v=ids.slice(i,i+3).map(k=>new T.Vector3().fromBufferAttribute(positions,k));
  expect(v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).lengthSq()).toBeGreaterThan(1e-14);
  volume+=v[0].dot(v[1].clone().cross(v[2]))/6;
  for(let j=0;j<3;j++){const a=ids[i+j],b=ids[i+(j+1)%3],key=`${Math.min(a,b)},${Math.max(a,b)}`,e=edges.get(key)??[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}
 }
 expect([...edges.values()].every(([count,direction])=>count===2&&direction===0)).toBe(true);expect(volume).toBeGreaterThan(0);g.dispose();
});
it('samples the curved height along original interior edges instead of leaving a sunken diagonal',()=>{
 const square=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
 const height=(p:{x:number;y:number})=>1+4*Math.sin(Math.PI*p.x/10)*Math.sin(Math.PI*p.y/10);
 const g=organicShell(square,height,1),material=new T.MeshBasicMaterial(),mesh=new T.Mesh(g,material);mesh.updateMatrixWorld(true);
 for(const [x,z] of [[5,5],[2.5,2.5],[7.5,7.5]]){
  const hit=new T.Raycaster(new T.Vector3(x,10,z),new T.Vector3(0,-1,0)).intersectObject(mesh)[0];
  expect(hit.point.y).toBeCloseTo(height({x,y:z}),5);
 }
 g.dispose();material.dispose();
});
