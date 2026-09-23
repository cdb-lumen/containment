import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment} from '../src/render/ShipEnvironments';

const footprints=[{x:8.75,y:5.625,width:8.75,height:3.125},{x:23.125,y:5.625,width:5.625,height:3.125},{x:8.75,y:18.75,width:5.625,height:3.125},{x:23.125,y:16.5625,width:5.625,height:5.3125}];
describe('Armory room-owned equipment rough',()=>{
 it('replaces repeated cells with four distinct equipment assemblies',()=>{
  const names=footprints.map((f,i)=>environmentObstacle('security',f,i,'armory').name);
  expect(names).toEqual(['armory-secured-weapons','armory-armor-fitting','armory-issue-bench','armory-ammunition-store']);
 });
 it('keeps each assembly on the deck and within its unchanged collision rectangle',()=>{
  footprints.forEach((f,i)=>{
   const model=environmentObstacle('security',f,i,'armory');
   const owners=[model,new T.Group()];
   for(const [index,root] of owners.entries()){
    if(index===1)appendEnvironment(root,model);
    const b=new T.Box3().setFromObject(root,true);
    expect(b.min.x).toBeGreaterThanOrEqual(f.x-1e-5);expect(b.max.x).toBeLessThanOrEqual(f.x+f.width+1e-5);
    expect(b.min.z).toBeGreaterThanOrEqual(f.y-1e-5);expect(b.max.z).toBeLessThanOrEqual(f.y+f.height+1e-5);
    expect(b.min.y).toBeCloseTo(0,5);expect(b.max.y).toBeLessThanOrEqual(2.5);
   }
  });
 });
 it('exposes each rifle barrel from an elevated front view instead of burying it under a roof',()=>{
  const model=environmentObstacle('security',footprints[0],0,'armory');model.updateMatrixWorld(true);
  const rifles:T.Object3D[]=[];model.traverse(o=>{if(o.name==='stored-rifle')rifles.push(o);});
  expect(rifles).toHaveLength(3);
  for(const rifle of rifles){
   const barrel=rifle.getObjectByName('barrel')!,target=barrel.getWorldPosition(new T.Vector3());
   const origin=target.clone().add(new T.Vector3(0,10,10));
   const hit=new T.Raycaster(origin,target.clone().sub(origin).normalize()).intersectObject(model,true)[0];
   expect(hit?.object).toBe(barrel);
  }
 });
 it('gives the secured store individually supported rifle silhouettes rather than bare bars',()=>{
  const model=environmentObstacle('security',footprints[0],0,'armory');model.updateMatrixWorld(true);
  const rifles:T.Object3D[]=[];model.traverse(o=>{if(o.name==='stored-rifle')rifles.push(o);});
  expect(rifles).toHaveLength(3);
  for(const rifle of rifles){
   for(const part of ['stock','receiver','barrel','magazine','cradle'])expect(rifle.getObjectByName(part)).toBeDefined();
   const b=new T.Box3().setFromObject(rifle,true);
   expect(b.max.y-b.min.y).toBeGreaterThan(.4);expect(b.max.y-b.min.y).toBeLessThan(1.5);
   expect(b.max.x-b.min.x).toBeGreaterThan(1.8);
   const stock=rifle.getObjectByName('stock')!.getWorldPosition(new T.Vector3());
   const barrel=rifle.getObjectByName('barrel')!.getWorldPosition(new T.Vector3());
   expect(barrel.x-stock.x).toBeGreaterThan(1.3);
   const magazine=rifle.getObjectByName('magazine')!.getWorldPosition(new T.Vector3());
   const receiver=rifle.getObjectByName('receiver')!.getWorldPosition(new T.Vector3());
   expect(receiver.y-magazine.y).toBeGreaterThan(.1);
  }
 });
});
