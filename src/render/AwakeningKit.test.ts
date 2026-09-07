import {afterEach,describe,it,expect} from 'vitest';
import * as T from 'three';
import * as rooms from './AuthoredRooms';
import {disposeModel} from './meshParts';
import {AUTHORED_ROOM_TOPOLOGIES,AWAKENING_FUNCTIONAL_ENVELOPES as envelopes} from '../game/roguelike/authoredRoomTopologies';
const owned:T.Group[]=[];
afterEach(()=>{owned.forEach(disposeModel);owned.length=0;});
const room=()=>{const g=rooms.authoredRoom('awakening-bay',{width:1200,height:880,...AUTHORED_ROOM_TOPOLOGIES['awakening-bay']!})!;owned.push(g);g.updateMatrixWorld(true);return g;};
const ray=(g:T.Group,x:number,h:number,z:number,dir:T.Vector3)=>new T.Raycaster(new T.Vector3(x/32,h/32,z/32),dir).intersectObject(g,true).filter(i=>!( (i.object as T.Mesh).material instanceof T.MeshBasicMaterial));
const top=(g:T.Group,x:number,z:number)=>ray(g,x,100,z,new T.Vector3(0,-1,0))[0]?.point.y*32;
describe('monitoring and recovery kit actual meshes',()=>{
 it('places reachable controls at height34 and a recovery seat at23',()=>{
  const g=room();expect(top(g,204,667)).toBeCloseTo(34,2);expect(top(g,204,732)).toBeCloseTo(23,2);
 });
 it('provides open west-facing cabinet shelves rather than a solid dummy door',()=>{
  const g=room();const hits=ray(g,1000,27,680,new T.Vector3(1,0,0));
  expect(hits[0].point.x*32).toBeGreaterThan(1098);
 });
 it('keeps detailed solids inside each immutable sub-reservation',()=>{
  expect(rooms.createAwakeningKit().name).toBe('awakening-kit');
  expect(rooms).toHaveProperty('createAwakeningKit');
  const g=(rooms as unknown as {createAwakeningKit:()=>T.Group}).createAwakeningKit();owned.push(g);
  const allowed=envelopes.filter(e=>['monitor','seat-pullback','locker-door','cabinet-door','trolley'].includes(e.id));let count=0;
  g.traverse(o=>{if(!(o instanceof T.Mesh)||o.material instanceof T.MeshBasicMaterial)return;const p=o.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){const x=p.getX(i)*32,h=p.getY(i)*32,z=p.getZ(i)*32;if(h<.601)continue;count++;
    expect(allowed.some(e=>x>=e.bounds.x-.002&&x<=e.bounds.x+e.bounds.w+.002&&z>=e.bounds.y-.002&&z<=e.bounds.y+e.bounds.h+.002&&h<=e.maxHeight+.002)).toBe(true);
   }
  });expect(count).toBeGreaterThan(1000);
 });
 it('has deck-connected seat legs, trolley wheels and console cabinet',()=>{
  const g=room();for(const [x,z,h] of [[190,710,10],[218,742,10],[1058,716,3],[1100,740,3],[180,680,10]]){
   const hit=ray(g,x-8,h,z,new T.Vector3(1,0,0))[0];expect(hit).toBeDefined();expect(hit.point.x*32).toBeLessThanOrEqual(x+3);
  }
 });
 it('uses the same kit in the room and releases all batched resources',()=>{
  const g=rooms.createAwakeningKit();g.updateMatrixWorld(true);const actual=room();
  for(const [x,z] of [[204,667],[204,686],[204,732],[270,700],[1075,681],[1079,728]])expect(top(actual,x,z)).toBeCloseTo(top(g,x,z),4);
  let geometries=0,materials=0;const resources=new Set<T.Material>();
  g.traverse(o=>{if(o instanceof T.Mesh){geometries++;o.geometry.addEventListener('dispose',()=>geometries--);for(const m of Array.isArray(o.material)?o.material:[o.material])resources.add(m);}});
  for(const m of resources){materials++;m.addEventListener('dispose',()=>materials--);}
  expect(geometries).toBeGreaterThan(0);disposeModel(g);expect(geometries).toBe(0);expect(materials).toBe(0);
 });
 it('preserves clear standing areas at working height',()=>{
  const g=room();for(const [x,z,dx,dz,max] of [[204,610,0,1,54],[330,700,-1,0,42],[1000,678,1,0,44],[204,790,0,-1,42]]){
   const hit=ray(g,x,24,z,new T.Vector3(dx,0,dz))[0];expect(hit.distance*32).toBeGreaterThanOrEqual(max-.1);
  }
 });
});
