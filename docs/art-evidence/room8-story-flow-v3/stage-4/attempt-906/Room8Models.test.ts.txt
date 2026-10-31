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
