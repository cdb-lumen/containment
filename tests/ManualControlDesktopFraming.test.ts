import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {environmentArchitecture} from '../src/render/ShipEnvironments';
import {roomFocus} from '../src/render/roomFraming';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';

const room=ROOM_TEMPLATES['manual-control-chamber'];
function camera(width:number,height:number,z=110/32){
 const viewHeight=22,viewWidth=viewHeight*width/height;
 const focus=roomFocus(828/32,z,room.width/32,room.height/32,viewWidth,viewHeight,room.id);
 const c=new T.OrthographicCamera(-viewWidth/2,viewWidth/2,11,-11,.1,120);
 c.position.set(focus.x,26,focus.z+19);c.lookAt(focus.x,0,focus.z);c.updateMatrixWorld(true);
 return c;
}
describe('Room19 desktop observation opening',()=>{
 it.each([[1280,720],[1280,900],[960,540]])('keeps the actual recessed opening inside the native %ix%i view on north approach', (width,height)=>{
  const world=new T.Group();environmentArchitecture(world,'reactor',room.width/32,room.height/32,room.id);world.updateMatrixWorld(true);
  const opening=new T.Box3().setFromObject(world.getObjectByName('armored-observation-recess')!,true),c=camera(width,height);
  for(const x of [opening.min.x,opening.max.x])for(const y of [opening.min.y,opening.max.y])for(const z of [opening.min.z,opening.max.z]){
   const projected=new T.Vector3(x,y,z).project(c);
   expect(Math.abs(projected.x)).toBeLessThan(.97);expect(Math.abs(projected.y)).toBeLessThan(.97);
  }
  expect(c.zoom).toBe(1);
 });
 it('keeps center-room framing and other rooms unchanged',()=>{
  const args=[828/32,440/32,room.width/32,room.height/32,39.1111111111,22] as const;
  expect(roomFocus(...args,room.id)).toEqual(roomFocus(...args));
  for(const id of Object.keys(ROOM_TEMPLATES).filter(id=>id!==room.id)){
   expect(roomFocus(10,2,37.5,27.5,39.1111111111,22,id)).toEqual(roomFocus(10,2,37.5,27.5,39.1111111111,22));
  }
 });
 it('follows continuously and keeps the approaching player visible without changing scale',()=>{
  let previous:ReturnType<typeof roomFocus>|undefined;
  for(let z=.5;z<=27;z+=.01){
   const focus=roomFocus(828/32,z,37.5,27.5,39.1111111111,22,room.id);
   if(previous)expect(Math.abs(focus.z-previous.z)).toBeLessThanOrEqual(.010001);
   const c=camera(1280,720,z),head=new T.Vector3(828/32,2,z).project(c);
   expect(Math.abs(head.y)).toBeLessThan(1);expect(c.zoom).toBe(1);previous=focus;
  }
 });
});
