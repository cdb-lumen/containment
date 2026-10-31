import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {armoryCarousel} from '../src/render/ArmoryCarousel';
import {createStoredArmoryRifle} from '../src/render/ArmoryBlockout';
import {createExpeditionGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {appendEnvironment} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {disposeModel} from '../src/render/meshParts';

const node={id:'armory-model',templateId:'armory',depth:5,kind:'elite',next:[],reward:'upgrade'} as const;
const meshes=(root:T.Object3D)=>{const out:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)out.push(o);});return out;};
describe('stationary Armory carousel model',()=>{
 it('keeps all raised vertices inside the exact equipment reservations before and after material batching',()=>{
  const world=new T.Group(),g=createExpeditionGeometry(node);appendEnvironment(world,armoryCarousel());
  const check=()=>{world.updateMatrixWorld(true);for(const mesh of meshes(world)){
   const p=mesh.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){
    const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
    expect(v.y,mesh.name).toBeGreaterThanOrEqual(-.001);
    expect(canOccupyExpedition(g,{x:v.x*32,y:v.z*32},.01),`${mesh.name} ${v.toArray()}`).toBe(false);
   }
  }};
  check();(DepthRenderer.prototype as unknown as {bakeWorld:()=>void}).bakeWorld.call({world});check();
  expect(meshes(world).length).toBeLessThanOrEqual(12);disposeModel(world);
 });
 it('retires owned source and baked resources while retaining shared rifle materials and cached boxes',()=>{
  const world=new T.Group();appendEnvironment(world,armoryCarousel());
  const profiles=meshes(world).filter(m=>['stock','receiver','handguard','magazine','grip'].includes(m.name));
  expect(profiles).toHaveLength(35);for(const p of profiles)expect(p.geometry.userData.environmentUV).toBe(true);
  const sources=[...new Set(meshes(world).map(m=>m.geometry))];
  const materials=[...new Set(meshes(world).map(m=>m.material as T.Material))];
  const counts=new Map<T.BufferGeometry|T.Material,number>(),listeners=new Map<T.BufferGeometry|T.Material,()=>void>();
  const observe=(r:T.BufferGeometry|T.Material)=>{counts.set(r,0);const listener=()=>counts.set(r,counts.get(r)!+1);listeners.set(r,listener);r.addEventListener('dispose',listener);};
  for(const r of [...sources,...materials])observe(r);
  (DepthRenderer.prototype as unknown as {bakeWorld:()=>void}).bakeWorld.call({world});
  for(const g of sources)expect(counts.get(g)).toBe(g.userData.environmentUV?1:0);
  const baked=meshes(world).map(m=>m.geometry);for(const g of baked)observe(g);
  disposeModel(world);
  for(const g of baked)expect(counts.get(g)).toBe(1);
  for(const m of materials)expect(counts.get(m)).toBe(m.userData.actorMaterial?1:0);
  for(const g of sources)expect(counts.get(g)).toBe(g.userData.environmentUV?1:0);
  for(const [r,listener] of listeners)r.removeEventListener('dispose',listener);
 });
 it('mounts fixed-scale rifles radially around a supported spindle and leaves the south sector open',()=>{
  const root=armoryCarousel();root.updateMatrixWorld(true);
  const mounts=root.children.filter(o=>o.name==='radial-weapon-mount');expect(mounts).toHaveLength(7);
  const angles=new Set<number>(),reference=createStoredArmoryRifle();
  for(const mount of mounts){
   angles.add(Number(mount.rotation.y.toFixed(3)));
   const rifle=mount.getObjectByName('stored-rifle')!;
   expect(rifle.scale.toArray()).toEqual([1,1,1]);
   for(const name of ['stock','receiver','barrel','magazine']){
    const part=rifle.getObjectByName(name) as T.Mesh,original=reference.getObjectByName(name) as T.Mesh;
    expect(Array.from(part.geometry.getAttribute('position').array)).toEqual(Array.from(original.geometry.getAttribute('position').array));
   }
   const center=rifle.getWorldPosition(new T.Vector3());
   expect(Math.hypot(center.x-600/32,center.z-450/32)).toBeCloseTo(Math.hypot(1.55,.21),5);
   expect(center.z-450/32).toBeLessThan(1); // No gun in the camera-facing south sector.
   const spoke=new T.Box3().setFromObject(mount.getObjectByName('radial-spoke')!,true);
   const clamp=new T.Box3().setFromObject(mount.getObjectByName('secured-clamp')!,true);
   expect(spoke.intersectsBox(clamp)).toBe(true);
  }
  expect(angles.size).toBe(7);
  const target=root.getObjectByName('carousel-spindle')!.getWorldPosition(new T.Vector3());
  const hit=new T.Raycaster(target.clone().add(new T.Vector3(0,.2,8)),new T.Vector3(0,-.2,-8).normalize()).intersectObject(root,true)[0];
  expect(hit?.object.name).toBe('carousel-spindle');
  disposeModel(reference);disposeModel(root);
 });
 it('physically connects each hanger shoulder through its pivot to the supported post',()=>{
  const root=armoryCarousel();
  for(const original of root.children.filter(o=>o.name==='hinged-armor-hanger')){
   const hanger=original.clone(true);hanger.position.set(0,0,0);hanger.rotation.set(0,0,0);hanger.updateMatrixWorld(true);
   const bounds=(name:string)=>new T.Box3().setFromObject(hanger.getObjectByName(name)!,true);
   for(const [a,b] of [['hanger-post','hanger-hinge'],['hanger-hinge','hanger-pivot-link'],['hanger-pivot-link','hanger-shoulders'],['hanger-shoulders','hung-armor-chest']])expect(bounds(a).intersectsBox(bounds(b)),`${a} -> ${b}`).toBe(true);
  }
  disposeModel(root);
 });
 it('has an actual recessed vise well below the continuous worktop, with exposed jaws',()=>{
  const root=armoryCarousel();root.updateMatrixWorld(true);
  const vise=root.getObjectByName('maintenance-vise')!,well=vise.getObjectByName('recessed-vise-well')!;
  const target=well.getWorldPosition(new T.Vector3());target.x+=.15;
  const hit=new T.Raycaster(target.clone().add(new T.Vector3(0,4,0)),new T.Vector3(0,-1,0)).intersectObject(root,true)[0];
  expect(hit?.object).toBe(well);
  expect(hit!.point.y).toBeLessThan(1.14-.05);
  for(const jaw of vise.children.filter(o=>o.name==='vise-jaw'))expect(new T.Box3().setFromObject(jaw).max.y).toBeGreaterThan(1.14);
  disposeModel(root);
 });
});
