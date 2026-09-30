import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom} from './AuthoredRooms';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {disposeModel} from './meshParts';
const local=['room8-freight-apron','room8-apron-markings','room8-docking-channels'];
describe('Room8 room visuals',()=>{
 it('keeps new apron relief flush and finite with owned materials',()=>{
  const room=authoredRoom('breached-loading-bay',ROOM_TEMPLATES['breached-loading-bay'])!;
  const disposalCounts:Array<()=>number>=[];
  for(const name of local){
   const mesh=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===name) as T.Mesh;
   expect(mesh).toBeDefined();mesh.geometry.computeBoundingBox();
   expect(mesh.geometry.boundingBox!.max.y).toBeLessThan(.04);
   expect(mesh.geometry.boundingBox!.min.y).toBeGreaterThanOrEqual(0);
   for(const x of mesh.geometry.getAttribute('position').array)expect(Number.isFinite(x)).toBe(true);
   let disposed=0;(mesh.material as T.Material).addEventListener('dispose',()=>disposed++);
   disposalCounts.push(()=>disposed);
  }
  disposeModel(room);
  expect(disposalCounts).toHaveLength(3);
  for(const count of disposalCounts)expect(count()).toBe(1);
 });
 it.each(['awakening-bay','passenger-vault','overload-floor'] as const)('does not leak Room8 apron materials into %s',id=>{
  const room=authoredRoom(id,ROOM_TEMPLATES[id])!;
  for(const child of room.children)if(child instanceof T.Mesh)expect(local).not.toContain((child.material as T.Material).name);
  disposeModel(room);
 });
});
