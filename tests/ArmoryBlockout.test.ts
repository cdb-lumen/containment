import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment} from '../src/render/ShipEnvironments';

const footprints=[{x:8.75,y:5.625,width:8.75,height:3.125},{x:23.125,y:5.625,width:5.625,height:3.125},{x:8.75,y:18.75,width:5.625,height:3.125},{x:23.125,y:16.5625,width:5.625,height:5.3125}];
describe('Armory room-owned equipment rough',()=>{
 it('keeps every stored rifle grip and magazine distinct from its receiver and mount',()=>{
  const model=environmentObstacle('security',footprints[0],0,'armory');
  const rifles:T.Object3D[]=[];model.traverse(o=>{if(o.name==='stored-rifle')rifles.push(o);});
  expect(rifles).toHaveLength(3);
  for(const stored of rifles){
  const rifle=stored.clone(true);rifle.position.set(0,0,0);rifle.rotation.set(0,0,0);rifle.updateMatrixWorld(true);
  const bounds=(name:string)=>new T.Box3().setFromObject(rifle.getObjectByName(name)!,true);
  expect(bounds('magazine').min.x-bounds('grip').max.x).toBeGreaterThan(.25);
  expect(bounds('grip').min.y).toBeLessThan(bounds('cradle').min.y-.12);
  const grip=rifle.getObjectByName('grip') as T.Mesh;
  const receiver=rifle.getObjectByName('receiver') as T.Mesh;
  expect(grip.material).not.toBe(receiver.material);
  const target=grip.getWorldPosition(new T.Vector3());
  const hit=new T.Raycaster(target.clone().add(new T.Vector3(0,0,3)),new T.Vector3(0,0,-1)).intersectObject(rifle,true)[0];
  expect(hit?.object).toBe(grip);
  }
 });
 it('gives each armor shell a tapered waist and an open neck above its chest',()=>{
  const model=environmentObstacle('security',footprints[1],1,'armory');model.updateMatrixWorld(true);
  const shells:T.Mesh[]=[];model.traverse(o=>{if(o.name==='armor-chest')shells.push(o as T.Mesh);});
  expect(shells).toHaveLength(3);
  for(const shell of shells){
   const positions=shell.geometry.getAttribute('position');
   const xs=(low:number,high:number)=>Array.from({length:positions.count},(_,i)=>i).filter(i=>positions.getY(i)>=low&&positions.getY(i)<=high).map(i=>positions.getX(i));
   const waist=xs(-.4,-.25),chest=xs(.1,.3);
   expect(waist.length).toBeGreaterThan(0);expect(chest.length).toBeGreaterThan(0);
   expect(Math.max(...chest)-Math.min(...chest)).toBeGreaterThan(Math.max(...waist)-Math.min(...waist)+.15);
   const frontHit=(x:number,y:number)=>{
    const target=shell.localToWorld(new T.Vector3(x,y,.5));
    return new T.Raycaster(target,new T.Vector3(0,0,-1)).intersectObject(shell)[0];
   };
   expect(frontHit(0,0)).toBeDefined();
   expect(frontHit(0,.29)).toBeUndefined();
   expect(frontHit(.24,.24)).toBeDefined();
  }
 });
 it('exposes flexible torso joints between separate chest and abdomen plates',()=>{
  const model=environmentObstacle('security',footprints[1],1,'armory');model.updateMatrixWorld(true);
  const backs:T.Mesh[]=[];model.traverse(o=>{if(o.name==='armor-chest')backs.push(o as T.Mesh);});
  expect(backs).toHaveLength(3);
  for(const back of backs){
   const hit=(x:number,y:number)=>new T.Raycaster(back.localToWorld(new T.Vector3(x,y,2)),new T.Vector3(0,0,-1)).intersectObject(model,true)[0]?.object;
   expect(hit(.18,.1)?.name).toBe('armor-upper-plate');
   expect(hit(0,-.23)?.name).toBe('armor-abdomen-plate');
   expect(hit(0,-.09)).toBe(back);
   expect(hit(0,.08)).toBe(back);
  }
 });
 it('gives the breastplates a convex protective volume rather than flat strips',()=>{
  const model=environmentObstacle('security',footprints[1],1,'armory');model.updateMatrixWorld(true);
  const plates:T.Mesh[]=[];model.traverse(o=>{if(o.name==='armor-upper-plate')plates.push(o as T.Mesh);});
  expect(plates).toHaveLength(6);
  for(const plate of plates){
   const bounds=new T.Box3().setFromObject(plate,true);
   expect(bounds.max.z-bounds.min.z).toBeGreaterThan(.25);
   const side=plate.geometry.getAttribute('position').getX(0)<0?-1:1;
   const front=(y:number)=>{
    const origin=plate.localToWorld(new T.Vector3(.18*side,y,2));
    const hit=new T.Raycaster(origin,new T.Vector3(0,0,-1)).intersectObject(plate)[0];
    expect(hit).toBeDefined();return hit.point.z;
   };
   expect(front(.06)-front(.22)).toBeGreaterThan(.05);
  }
 });
 it('supports a separate issue-case lid and leaves its carry-handle opening clear',()=>{
  const model=environmentObstacle('security',footprints[2],2,'armory');model.updateMatrixWorld(true);
  const part=(name:string)=>{const value=model.getObjectByName(name);expect(value,name).toBeDefined();return value!;};
  const bounds=(name:string)=>new T.Box3().setFromObject(part(name),true);
  expect(bounds('issue-case-body').min.y).toBeCloseTo(bounds('issue-worktop').max.y,4);
  expect(bounds('issue-case-lid').min.y).toBeCloseTo(bounds('issue-case-body').max.y,4);
  expect(bounds('issue-case-lid').max.x).toBeGreaterThan(bounds('issue-case-body').max.x);
  const handle=part('issue-case-handle'),b=new T.Box3().setFromObject(handle,true),center=b.getCenter(new T.Vector3());
  const top=new T.Raycaster(center.clone().add(new T.Vector3(0,3,0)),new T.Vector3(0,-1,0)).intersectObject(model,true)[0];
  expect(top?.object).toBe(handle);
  const opening=center.clone();opening.z-=.105;
  const through=new T.Raycaster(opening.clone().add(new T.Vector3(0,3,0)),new T.Vector3(0,-1,0)).intersectObject(model,true)[0];
  expect(through?.object).toBe(part('issue-worktop'));
 });
 it('supports ammunition case lids and exposes raised handles above recessed top panels',()=>{
  const model=environmentObstacle('security',footprints[3],3,'armory');model.updateMatrixWorld(true);
  for(const id of ['left','right']){
   const part=(suffix:string)=>{const p=model.getObjectByName(`ammo-${id}-${suffix}`);expect(p).toBeDefined();return p!;};
   const bounds=(suffix:string)=>new T.Box3().setFromObject(part(suffix),true);
   expect(bounds('body').min.y).toBeCloseTo(bounds('pallet').max.y,4);
   expect(bounds('lid').min.y).toBeCloseTo(bounds('body').max.y,4);
   expect(bounds('handle').min.y).toBeGreaterThan(bounds('panel').max.y+.08);
   const center=bounds('handle').getCenter(new T.Vector3());
   const hit=new T.Raycaster(center.clone().add(new T.Vector3(0,3,0)),new T.Vector3(0,-1,0)).intersectObject(model,true)[0];
   expect(hit?.object).toBe(part('handle'));
  }
 });
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
