import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {SHIP_ENVIRONMENTS,appendEnvironment,environmentArchitecture,environmentObstacle,shipEnvironment,type ShipEnvironment} from '../src/render/ShipEnvironments';
import {MAT,disposeModel,geometries} from '../src/render/meshParts';
import {DepthRenderer} from '../src/render/DepthRenderer';

// Independent route contract: do not derive expected IDs from the renderer table.
const rooms:Record<ShipEnvironment,string[]>={
 cryogenics:['awakening-bay','passenger-vault'],habitation:['residential-gallery','communal-atrium'],
 security:['crew-checkpoint','armory'],cargo:['freight-hold','breached-loading-bay'],
 communications:['relay-racks','transmission-chamber'],engineering:['diagnostic-gallery','safety-interlock-station'],
 maintenance:['coolant-plant','service-shaft-landing'],infested:['infested-workshop','swarm-junction'],
 containment:['shielding-gate','containment-annulus'],reactor:['manual-control-chamber','overload-floor'],
};
const footprints=[{x:3,y:5,width:2,height:7},{x:-7,y:11,width:9,height:2},{x:1,y:2,width:.6,height:.8},{x:2,y:3,width:12,height:24}];
function meshes(root:T.Object3D){const result:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)result.push(o);});return result;}
function contained(root:T.Object3D,f:typeof footprints[number]){
 const b=new T.Box3().setFromObject(root,true);
 expect(b.isEmpty()).toBe(false);
 expect(b.min.x).toBeGreaterThanOrEqual(f.x-1e-5);expect(b.max.x).toBeLessThanOrEqual(f.x+f.width+1e-5);
 expect(b.min.z).toBeGreaterThanOrEqual(f.y-1e-5);expect(b.max.z).toBeLessThanOrEqual(f.y+f.height+1e-5);
 expect(b.min.y).toBeGreaterThanOrEqual(-1e-5);expect(b.max.y).toBeGreaterThan(0);
}
describe('ship environments',()=>{
 it('maps exactly twenty independently specified room IDs across ten environments',()=>{
  expect(SHIP_ENVIRONMENTS).toEqual(Object.keys(rooms));
  expect(Object.values(rooms).flat()).toHaveLength(20);
  for(const [env,ids] of Object.entries(rooms))for(const id of ids)expect(shipEnvironment(id)).toBe(env);
  for(const id of ['','unknown','Armory','armory-extra'])expect(shipEnvironment(id)).toBeUndefined();
 });
 for(const env of SHIP_ENVIRONMENTS){
  it(`${env} models and flattened models stay inside every collision footprint`,()=>{
   for(const id of rooms[env])for(const [index,f] of footprints.entries()){
    const model=environmentObstacle(env,f,index,id);
    expect(model.userData.footprint).toEqual(f);expect(model.userData.footprint).not.toBe(f);
    expect(model.children.length).toBeGreaterThan(0);expect(model.children.length).toBeLessThanOrEqual(32);
    contained(model,f);const world=new T.Group();appendEnvironment(world,model);contained(world,f);
    expect(world.children.every(o=>o instanceof T.Mesh)).toBe(true);
   }
  });
  it(`${env} batches to a bounded material set and disposes only owned resources`,()=>{
   const world=new T.Group();environmentArchitecture(world,env,32,24);
   appendEnvironment(world,environmentObstacle(env,{x:5,y:5,width:4,height:8},0,rooms[env][0]));
   const originals=meshes(world),sharedGeometry=new Set(originals.map(m=>m.geometry));
   const ownedMaterials=new Set(originals.map(m=>m.material as T.MeshStandardMaterial).filter(m=>!Object.values(MAT).includes(m)));
   if(env==='habitation'){expect(ownedMaterials.size).toBe(4);for(const m of ownedMaterials)expect(m.userData.actorMaterial).toBe(true);}else expect(ownedMaterials.size).toBe(0);
   expect([...sharedGeometry].every(g=>[...geometries.values()].includes(g))).toBe(true);
   const geometrySpies=[...sharedGeometry].map(g=>vi.spyOn(g,'dispose'));
   const materialSpies=Object.values(MAT).map(m=>vi.spyOn(m,'dispose'));
   const ownedMaterialSpies=[...ownedMaterials].map(m=>vi.spyOn(m,'dispose'));
   try{
    // Exercise the real material batching path without constructing a WebGL context.
    const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};
    renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();
    const baked=meshes(world);
    expect(baked.length).toBeGreaterThan(0);expect(baked.length).toBeLessThanOrEqual(Object.keys(MAT).length);
    expect(baked.length).toBe(new Set(originals.map(m=>m.material)).size);
    const ownedSpies=baked.map(m=>vi.spyOn(m.geometry,'dispose'));
    disposeModel(world);
    for(const spy of ownedSpies)expect(spy).toHaveBeenCalledTimes(1);
    for(const spy of [...geometrySpies,...materialSpies])expect(spy).not.toHaveBeenCalled();
    for(const spy of ownedMaterialSpies)expect(spy).toHaveBeenCalledTimes(1);
    renderer.floorMaterial.dispose();
   }finally{vi.restoreAllMocks();}
  });
 }
 it.each([32,44])('maintenance grates at width %s have no overlapping coplanar faces',w=>{
  const world=new T.Group();environmentArchitecture(world,'maintenance',w,24);
  const grates=meshes(world).map(mesh=>({mesh,bounds:new T.Box3().setFromObject(mesh,true)}))
   .filter(({bounds})=>Math.abs(bounds.max.y-.002)<1e-6&&bounds.min.z>0);
  expect(grates.length).toBeGreaterThan(0);
  const overlaps:string[]=[];
  for(let i=0;i<grates.length;i++)for(let j=i+1;j<grates.length;j++){
   const a=grates[i].bounds,b=grates[j].bounds;
   if(Math.min(a.max.x,b.max.x)-Math.max(a.min.x,b.min.x)>1e-6&&Math.min(a.max.z,b.max.z)-Math.max(a.min.z,b.min.z)>1e-6)overlaps.push(`${i}/${j}`);
  }
  expect(overlaps).toEqual([]);
  // Partition the entire original two bands, retaining the dark gaps and metal bars.
  const area=grates.reduce((sum,{bounds:b})=>sum+(b.max.x-b.min.x)*(b.max.z-b.min.z),0);
  expect(area).toBeCloseTo(4*(w-1),4);
  expect(new Set(grates.map(({mesh})=>mesh.material))).toEqual(new Set([MAT.black,MAT.edge]));
 });
 it('maintenance grates use only upward planar triangles, not hidden box faces',()=>{
  const world=new T.Group();environmentArchitecture(world,'maintenance',32,24);
  const grates=meshes(world).filter(mesh=>Math.abs(new T.Box3().setFromObject(mesh,true).max.y-.002)<1e-6&&mesh.position.z>0);
  let triangles=0;
  for(const mesh of grates){
   const b=new T.Box3().setFromObject(mesh,true);expect(b.max.y-b.min.y).toBeLessThan(1e-6);
   const normal=new T.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('normal'),0).transformDirection(mesh.matrixWorld);
   expect(normal.y).toBeCloseTo(1);
   triangles+=(mesh.geometry.index?.count??mesh.geometry.getAttribute('position').count)/3;
   expect(mesh.castShadow).toBe(false);expect(mesh.receiveShadow).toBe(true);
  }
  expect(triangles).toBeGreaterThan(0);expect(triangles).toBeLessThan(1000);
 });
 it('flattening preserves every vertex transform, including nonuniform scale and rotated children',()=>{
  const model=new T.Group(),cell=new T.Group();model.position.set(8,0,9);model.rotation.y=Math.PI/2;model.add(cell);
  cell.scale.set(2,.6,3);cell.position.set(1,2,3);
  const mesh=new T.Mesh(new T.BoxGeometry(),MAT.steel);mesh.rotation.set(.32,.6,.1);mesh.position.set(.3,.8,-.2);cell.add(mesh);
  model.updateMatrixWorld(true);const before=mesh.matrixWorld.clone();
  const parent=new T.Group();parent.position.set(-3,2,6);parent.rotation.y=.7;parent.scale.set(2,3,4);
  appendEnvironment(parent,model);parent.updateMatrixWorld(true);
  expect(parent.children).toEqual([mesh]);expect(cell.children).toHaveLength(0);
  for(let i=0;i<16;i++)expect(mesh.matrixWorld.elements[i]).toBeCloseTo(before.elements[i],10);
  mesh.geometry.dispose();
 });
});
