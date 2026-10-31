import {it,expect} from 'vitest';
import * as T from 'three';
import {communalAtrium} from '../src/render/CommunalAtrium';
import {COMMUNAL_ATRIUM_BLOCKOUT} from '../src/game/roguelike/authoredRoomTopologies';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {disposeModel} from '../src/render/meshParts';

const furniture=COMMUNAL_ATRIUM_BLOCKOUT.filter(f=>f.kind==='table'||f.kind.startsWith('seat-'));
it.each(furniture)('$id keeps its physical reservation, floor bearing and authored height',f=>{
 const root=communalAtrium(ROOM_TEMPLATES['communal-atrium'],[f]);
 try{
  const points:T.Vector3[]=[];root.updateMatrixWorld(true);
  root.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){
   const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).multiplyScalar(32);
   // The builder also owns the north wall, outside this fixture's y interval.
   if(v.z>=f.y-1&&v.z<=f.y+f.h+1)points.push(v);
  }}});
  expect(points.length).toBeGreaterThan(100);
  const bounds=new T.Box3().setFromPoints(points);
  expect(bounds.min.x).toBeCloseTo(f.x,3);expect(bounds.max.x).toBeCloseTo(f.x+f.w,3);
  expect(bounds.min.z).toBeCloseTo(f.y,3);expect(bounds.max.z).toBeCloseTo(f.y+f.h,3);
  expect(bounds.min.y).toBeCloseTo(0,3);expect(bounds.max.y).toBeCloseTo(f.kind==='table'?24:34.4,3);
  const normals=new Set<string>();root.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position'),n=o.geometry.getAttribute('normal');for(let i=0;i<p.count;i++)if(p.getZ(i)*32>=f.y&&p.getZ(i)*32<=f.y+f.h)normals.add([n.getX(i),n.getY(i),n.getZ(i)].map(v=>v.toFixed(2)).join(','));}});
  expect(normals.size).toBeGreaterThan(6);
 }finally{disposeModel(root);}
});
it.each(furniture.filter(f=>f.kind!=='table'))('$id exposes warm upholstery on its outer back instead of a dark steel face',f=>{
 const root=communalAtrium(ROOM_TEMPLATES['communal-atrium'],[f]);root.updateMatrixWorld(true);
 try{
  const cx=f.x+f.w/2,cz=f.y+f.h/2;
  const origin=f.kind==='seat-west'?new T.Vector3((f.x-10)/32,24.4/32,cz/32):f.kind==='seat-east'?new T.Vector3((f.x+f.w+10)/32,24.4/32,cz/32):new T.Vector3(cx/32,24.4/32,(f.y+f.h+10)/32);
  const direction=f.kind==='seat-west'?new T.Vector3(1,0,0):f.kind==='seat-east'?new T.Vector3(-1,0,0):new T.Vector3(0,0,-1);
  const hit=new T.Raycaster(origin,direction).intersectObject(root,true)[0];expect(hit).toBeDefined();
  expect(((hit.object as T.Mesh).material as T.Material).name).toBe('ca_upholstery');
 }finally{disposeModel(root);}
});
