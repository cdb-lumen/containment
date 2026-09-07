import {afterEach,describe,it,expect} from 'vitest';
import * as T from 'three';
import * as rooms from './AuthoredRooms';
const {authoredRoom}=rooms;
import {disposeModel} from './meshParts';
import {AUTHORED_ROOM_TOPOLOGIES} from '../game/roguelike/authoredRoomTopologies';
const owned:T.Group[]=[];
afterEach(()=>{owned.forEach(disposeModel);owned.length=0;});
const room=()=>{const g=authoredRoom('awakening-bay',{width:1200,height:880,...AUTHORED_ROOM_TOPOLOGIES['awakening-bay']!})!;owned.push(g);g.updateMatrixWorld(true);return g;};
const hits=(g:T.Group,x:number,h:number,z:number,dir:T.Vector3)=>new T.Raycaster(new T.Vector3(x/32,h/32,z/32),dir).intersectObject(g,true).filter(i=>!((i.object as T.Mesh).material instanceof T.MeshBasicMaterial));
describe('Awakening envelope',()=>{
 it('replaces spanning blockout banners with contained local status plates',()=>{
  const g=room(),labels=g.userData.localSigns??[];
  expect(labels.filter((s:{text:string})=>s.text==='OCCUPIED')).toHaveLength(8);
  expect(labels.map((s:{text:string})=>s.text)).toContain('RELEASED');
  expect(labels.map((s:{text:string})=>s.text)).toContain('LIFE SUPPORT');
  expect(labels.map((s:{text:string})=>s.text)).toContain('RESTORE COMMS');
  for(const s of labels)expect(s.width).toBeLessThanOrEqual(112);
 });
 it('has a supported high bulkhead lintel and open low threshold',()=>{
  const g=room();expect(hits(g,1154,120,440,new T.Vector3(0,-1,0))[0].point.y*32).toBeGreaterThan(75);
  for(const h of [2,16,32,48,64])for(const z of [402,440,478])expect(hits(g,1080,h,z,new T.Vector3(1,0,0)).filter(i=>i.point.x*32<1168)).toHaveLength(0);
  for(const z of [360,520])expect(hits(g,1120,35,z,new T.Vector3(1,0,0))[0].point.x*32).toBeGreaterThan(1135);
 });
 it('keeps added envelope solids at the perimeter and deck relief flush',()=>{
  expect(rooms).toHaveProperty('createAwakeningEnvelope');
  const envelope=(rooms as unknown as {createAwakeningEnvelope:()=>T.Group}).createAwakeningEnvelope();owned.push(envelope);
  const boundary=AUTHORED_ROOM_TOPOLOGIES['awakening-bay']!.boundary!;
  let vertices=0;envelope.traverse(o=>{if(!(o instanceof T.Mesh)||o.material instanceof T.MeshBasicMaterial)return;const p=o.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){const x=p.getX(i)*32,h=p.getY(i)*32,z=p.getZ(i)*32;if(h<=.61)continue;vertices++;
    const distance=Math.min(...boundary.map((a,j)=>{const b=boundary[(j+1)%boundary.length],dx=b.x-a.x,dz=b.y-a.y,s=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.y)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-s*dx,z-a.y-s*dz);}));
    expect(distance).toBeLessThanOrEqual(22);
   }
  });expect(vertices).toBeGreaterThan(1000);
  const g=room();
  for(const [x,z] of [[320,440],[650,440],[960,190],[960,700],[1080,440]])expect(hits(g,x,65,z,new T.Vector3(0,-1,0))[0].point.y*32).toBeLessThan(.61);
 });
});
