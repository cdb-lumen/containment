import {afterEach,describe,it,expect} from 'vitest';
import * as T from 'three';
import * as rooms from './AuthoredRooms';
import {disposeModel} from './meshParts';
import {AUTHORED_ROOM_TOPOLOGIES} from '../game/roguelike/authoredRoomTopologies';

const owned:T.Group[]=[];
afterEach(()=>{owned.forEach(disposeModel);owned.length=0;});
const release=()=>{
 const g=rooms.createAwakeningRelease();owned.push(g);return g;
};
const top=(g:T.Group,x:number,z:number)=>{
 g.updateMatrixWorld(true);
 return new T.Raycaster(new T.Vector3(x/32,5,z/32),new T.Vector3(0,-1,0)).intersectObject(g,true)[0]?.point.y;
};
describe('opened player chamber actual geometry',()=>{
 it('uses the same detailed assembly in the real batched room',()=>{
  const g=rooms.authoredRoom('awakening-bay',{width:1200,height:880,...AUTHORED_ROOM_TOPOLOGIES['awakening-bay']!})!;owned.push(g);
  const standalone=release();
  for(const [x,z] of [[135,435],[135,394],[96,440],[204,440]])expect(top(g,x,z)).toBeCloseTo(top(standalone,x,z)!,5);
 });
 it('has an empty low berth and a parked north lid, not a body or overhead canopy',()=>{
  const g=release();
  for(const z of [418,435,455,470])expect(top(g,135,z)).toBeCloseTo(10/32,3);
  expect(top(g,135,394)).toBeGreaterThan(24/32);
  expect(top(g,135,394)).toBeLessThanOrEqual(40/32);
 });
 it('keeps every raised solid vertex inside the frozen pod footprint and landing flush',()=>{
  const g=release();let vertices=0;
  g.traverse(o=>{if(!(o instanceof T.Mesh)||o.material instanceof T.MeshBasicMaterial)return;
   const p=o.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){
    const x=p.getX(i)*32,y=p.getY(i)*32,z=p.getZ(i)*32;
    if(y<=.601)continue;vertices++;
    expect(x).toBeGreaterThanOrEqual(90-.001);expect(x).toBeLessThanOrEqual(180+.001);
    expect(z).toBeGreaterThanOrEqual(380-.001);expect(z).toBeLessThanOrEqual(500+.001);
    expect(y).toBeLessThanOrEqual(40+.001);
   }
  });
  expect(vertices).toBeGreaterThan(100);
  for(const x of [181,204,230,237])expect(top(g,x,440)).toBeLessThanOrEqual(.6/32);
 });
 it('has a supported west handrail but no raised east rail across the release gap',()=>{
  const g=release();
  expect(top(g,96,440)).toBeGreaterThan(27/32);
  for(const z of [410,440,470])expect(top(g,178,z)).toBeLessThan(11/32);
 });
});
