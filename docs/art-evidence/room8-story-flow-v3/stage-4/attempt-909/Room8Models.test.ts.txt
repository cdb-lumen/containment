import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom} from './AuthoredRooms';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {disposeModel} from './meshParts';
const names=['room8-seam-growth','room8-torn-metal','room8-freight-supports','room8-east-fixture'];
const template=ROOM_TEMPLATES['breached-loading-bay'];
function inside(x:number,z:number){
 const poly=template.voids![0];let yes=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)yes=!yes;
 }
 return yes;
}
describe('Room8 stage4 connected models',()=>{
 it('contains growth and torn edges inside the sealed collision scar',()=>{
  const room=authoredRoom('breached-loading-bay',template)!;
  for(const name of names.slice(0,2)){
   const mesh=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===name) as T.Mesh;
   expect(mesh).toBeDefined();const p=mesh.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){
    expect(inside(p.getX(i)*32,p.getZ(i)*32),`${name} vertex ${i}`).toBe(true);
    expect(p.getY(i)).toBeGreaterThan(.1);
   }
  }
  disposeModel(room);
 });
 it('joins the growth as one welded surface with a seal-contact perimeter',()=>{
  const room=authoredRoom('breached-loading-bay',template)!;
  const mesh=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===names[0]) as T.Mesh;
  const p=mesh.geometry.getAttribute('position'),adj=new Map<string,Set<string>>(),edges=new Map<string,number>(),heights=new Map<string,number>();
  const key=(i:number)=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>x.toFixed(4)).join(',');
  for(let i=0;i<p.count;i+=3)for(let j=0;j<3;j++){
   const a=key(i+j),b=key(i+(j+1)%3);heights.set(a,p.getY(i+j));
   if(!adj.has(a))adj.set(a,new Set());if(!adj.has(b))adj.set(b,new Set());
   if(a===b)continue;adj.get(a)!.add(b);adj.get(b)!.add(a);
   const edge=[a,b].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1);
  }
  const seen=new Set<string>(),todo=[adj.keys().next().value!];
  while(todo.length){const a=todo.pop()!;if(seen.has(a))continue;seen.add(a);for(const b of adj.get(a)!)if(!seen.has(b))todo.push(b);}
  expect(seen.size,'no separate propped plates or disconnected support rods').toBe(adj.size);
  let border=0;
  for(const [edge,count]of edges)if(count===1){for(const a of edge.split('|'))expect(heights.get(a)).toBeCloseTo(.25,3);border++;}
  expect(border).toBeGreaterThan(100);
  room.updateMatrixWorld(true);const ray=new T.Raycaster();
  // Both flanks of the large colony have tissue above the seal, rather than air
  // below a suspended face. These are actual world-space material intersections.
  for(const offset of [-.57,-.17,.23]){
   const along=-2.78,x=21.5625+.81*along-.586*offset,z=12.34375+.586*along+.81*offset;
   ray.set(new T.Vector3(x,5,z),new T.Vector3(0,-1,0));
   const hits=ray.intersectObject(mesh);expect(hits.length,`offset ${offset}; bounds ${JSON.stringify(new T.Box3().setFromObject(mesh))}; normal ${mesh.geometry.getAttribute('normal').getY(400)}`).toBeGreaterThan(0);expect(hits[0].point.y).toBeGreaterThan(.3);
  }
  disposeModel(room);
 });
 it('keeps support geometry inside the existing freight footprints and grounds its skids',()=>{
  const room=authoredRoom('breached-loading-bay',template)!;
  const mesh=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===names[2]) as T.Mesh;
  expect(mesh).toBeDefined();const p=mesh.geometry.getAttribute('position');
  for(let i=0;i<p.count;i++)expect(template.obstacles.some(r=>p.getX(i)*32>=r.x-.001&&p.getX(i)*32<=r.x+r.width+.001&&p.getZ(i)*32>=r.y-.001&&p.getZ(i)*32<=r.y+r.height+.001)).toBe(true);
  mesh.geometry.computeBoundingBox();expect(mesh.geometry.boundingBox!.min.y).toBeCloseTo(0);
  disposeModel(room);
 });
 it('preserves the east opening between clad posts above the flush threshold',()=>{
  const room=authoredRoom('breached-loading-bay',template)!;
  const mesh=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===names[3]) as T.Mesh;
  expect(mesh).toBeDefined();const p=mesh.geometry.getAttribute('position');
  for(let i=0;i<p.count;i++)if(p.getY(i)>.1&&p.getY(i)<1.35)expect(Math.abs(p.getZ(i)-template.exit.y/32)).toBeGreaterThanOrEqual(.60);
  disposeModel(room);
 });
 it('owns finite disposable local model materials without leaking to another room',()=>{
  const room=authoredRoom('breached-loading-bay',template)!;const counts:number[]=[];
  for(const name of names){
   const mesh=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===name) as T.Mesh;
   expect(mesh).toBeDefined();for(const n of mesh.geometry.getAttribute('position').array)expect(Number.isFinite(n)).toBe(true);
   const index=counts.length;counts.push(0);(mesh.material as T.Material).addEventListener('dispose',()=>counts[index]++);
  }
  disposeModel(room);expect(counts).toEqual([1,1,1,1]);
  for(const id of ['awakening-bay','passenger-vault','overload-floor'] as const){
   const other=authoredRoom(id,ROOM_TEMPLATES[id])!;
   for(const m of other.children)if(m instanceof T.Mesh)expect(names).not.toContain((m.material as T.Material).name);
   disposeModel(other);
  }
 });
});
