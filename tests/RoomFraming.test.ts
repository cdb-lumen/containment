import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {roomFocus} from '../src/render/roomFraming';

describe('room camera framing',()=>{
 it('keeps an interior player as the focus',()=>{expect(roomFocus(25,25,60,60,20,16)).toEqual({x:25,z:25});});
 it('centers rooms smaller than the projected view on either axis',()=>{
  expect(roomFocus(-100,100,8,6,40,30)).toEqual({x:4,z:3});
  expect(roomFocus(1,25,8,60,40,16)).toEqual({x:4,z:25});
  expect(roomFocus(25,1,60,6,20,30)).toEqual({x:25,z:3});
 });
 it('clamps both edges using the actual tilted camera ground projection',()=>{
  const camera=new T.OrthographicCamera(-10,10,8,-8,.1,120);
  camera.position.set(0,26,19);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const ground=new T.Plane(new T.Vector3(0,1,0),0),raycaster=new T.Raycaster();
  raycaster.setFromCamera(new T.Vector2(1,1),camera);
  const corner=raycaster.ray.intersectPlane(ground,new T.Vector3())!;
  const low=roomFocus(-100,-100,60,60,20,16),high=roomFocus(100,100,60,60,20,16);
  expect(low.x).toBeCloseTo(Math.abs(corner.x)-.7,10);expect(low.z).toBeCloseTo(Math.abs(corner.z)-.7,10);
  expect(high.x).toBeCloseTo(60-low.x,10);expect(high.z).toBeCloseTo(60-low.z,10);
  expect(roomFocus(low.x,low.z,60,60,20,16)).toEqual(low);
  expect(roomFocus(high.x,high.z,60,60,20,16)).toEqual(high);
 });
 it('handles narrow views without negative margins and responds to resized view extents',()=>{
  expect(roomFocus(-1,100,60,60,0,0)).toEqual({x:0,z:60});
  expect(roomFocus(0,0,60,60,1,1)).toEqual({x:0,z:0});
  const desktop=roomFocus(0,0,60,60,36,22),portrait=roomFocus(0,0,60,60,16,31);
  expect(portrait.x).toBeLessThan(desktop.x);expect(portrait.z).toBeGreaterThan(desktop.z);
 });
});
