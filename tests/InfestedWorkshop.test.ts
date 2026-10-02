import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment,environmentArchitecture} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {MAT,disposeModel} from '../src/render/meshParts';

const solids=ROOM_TEMPLATES['infested-workshop'].obstacles;
const models=()=>solids.map((f,i)=>environmentObstacle('infested',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},i,'infested-workshop'));
const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
describe('Room15 rough machinery',()=>{
 it('replaces cable-like resin with asymmetric closed webs anchored into machine castings',()=>{
  const model=models()[0];model.updateMatrixWorld(true);
  const webs:T.Mesh[]=[];model.traverse(o=>{if(o instanceof T.Mesh&&o.name==='directional-resin')webs.push(o);});
  expect(webs.length).toBeGreaterThanOrEqual(2);
  for(const web of webs){
   expect(web.geometry.type).toBe('BufferGeometry');
   expect(web.geometry.getAttribute('uv')).toBeDefined();
   const widths=web.userData.widths as number[];expect(new Set(widths).size).toBeGreaterThan(3);
   for(const anchor of web.userData.anchors as {point:number[];owner:string}[]){
    const p=new T.Vector3().fromArray(anchor.point);web.parent!.localToWorld(p);
    expect(bounds(model.getObjectByName(anchor.owner)!).expandByScalar(.025).containsPoint(p),anchor.owner).toBe(true);
   }
  }
  expect(model.getObjectByName('housing-resin-wrap')).toBeUndefined();
 });
 it('carries broad resin over the headstock roof rather than leaving a front fringe',()=>{
  const model=models()[0],cell=model.children[0];
  cell.updateMatrixWorld(true);
  const roof=(model.getObjectByName('headstock') as T.Mesh).position.y+.55;
  const webs:T.Mesh[]=[];model.traverse(o=>{if(o instanceof T.Mesh&&o.name==='directional-resin')webs.push(o);});
  for(const web of webs){
   const positions=web.geometry.getAttribute('position');const top=new T.Box3();
   for(let i=0;i<positions.count;i++)if(positions.getY(i)>roof)top.expandByPoint(new T.Vector3().fromBufferAttribute(positions,i));
   expect(top.isEmpty()).toBe(false);
   expect(top.getSize(new T.Vector3()).z).toBeGreaterThan(.55);
   expect(top.getSize(new T.Vector3()).x).toBeGreaterThan(.35);
  }
 });
 it('anchors a substantial tendon outside the column silhouette at both ends',()=>{
  const model=models()[0];model.updateMatrixWorld(true);
  const brace=model.getObjectByName('tendon-brace') as T.Mesh;
  for(const anchor of brace.userData.anchors as {point:number[];owner:string}[]){
   const point=brace.parent!.localToWorld(new T.Vector3().fromArray(anchor.point));
   expect(bounds(model.getObjectByName(anchor.owner)!).containsPoint(point),anchor.owner).toBe(true);
  }
  brace.geometry.computeBoundingBox();
  expect(brace.geometry.boundingBox!.max.x).toBeGreaterThan(1.2);
  expect(Math.min(...brace.userData.widths)).toBeGreaterThanOrEqual(.18);
  for(const name of ['tendon-foot-cuff','tendon-arm-cuff'])expect(model.getObjectByName(name)).toBeDefined();
 });
 it('connects visible severed supply pieces to the machine with an open cut gap',()=>{
  const model=models()[0];model.updateMatrixWorld(true);
  const upstream=model.getObjectByName('insulation-cut-stub')!;
  const downstream=model.getObjectByName('insulation-return')!;
  expect(downstream).toBeDefined();
  expect(bounds(upstream).intersectsBox(bounds(model.getObjectByName('arm-column')!))).toBe(true);
  expect(bounds(downstream).intersectsBox(bounds(model.getObjectByName('arm-foot')!))).toBe(true);
  expect(bounds(upstream).intersectsBox(bounds(downstream))).toBe(false);
  expect(bounds(model.getObjectByName('peeled-insulation')!).intersectsBox(bounds(downstream))).toBe(true);
  const cores:T.Object3D[]=[];model.traverse(o=>{if(o.name==='cut-copper-end')cores.push(o);});
  expect(cores).toHaveLength(3);
  for(const core of cores){
   expect(bounds(core).intersectsBox(bounds(upstream))).toBe(true);
   expect(bounds(core).intersectsBox(bounds(downstream))).toBe(false);
  }
 });
 it('holds coaxial stock in the chuck and tailstock with contacting gripper pads',()=>{
  const model=models()[0];model.updateMatrixWorld(true);
  const piece=bounds(model.getObjectByName('suspended-workpiece')!);
  for(const name of ['chuck','tailstock-center','gripper-pad-left','gripper-pad-right']){
   expect(model.getObjectByName(name),name).toBeDefined();
   expect(piece.intersectsBox(bounds(model.getObjectByName(name)!)),name).toBe(true);
  }
 });
 it('shows a torn folded guard and separated insulation ends rather than a closed cover',()=>{
  const model=models()[0];
  for(const name of ['guard-torn-edge','guard-fold','guard-hinge','cable-clamp','insulation-cut-stub','cut-copper-end','peeled-insulation'])expect(model.getObjectByName(name),name).toBeDefined();
  expect(bounds(model.getObjectByName('insulation-cut-stub')!).intersectsBox(bounds(model.getObjectByName('peeled-insulation')!))).toBe(false);
 });
 it('owns and disposes web geometry without retiring shared workshop materials',()=>{
  const first=models()[0],second=models()[0];
  const a=first.getObjectByName('directional-resin') as T.Mesh,b=second.getObjectByName('directional-resin') as T.Mesh;
  expect(a.geometry).not.toBe(b.geometry);expect(a.material).toBe(b.material);
  let retired=0,materialRetired=0;a.geometry.addEventListener('dispose',()=>retired++);
  (a.material as T.Material).addEventListener('dispose',()=>materialRetired++);
  disposeModel(first);expect(retired).toBe(1);expect(materialRetired).toBe(0);
  expect(Array.from(b.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
 });
 it('uses room-local worn paint and matte longitudinal resin without emissive poison',()=>{
  const first=models()[0],second=models()[0];
  const paint=(first.getObjectByName('headstock') as T.Mesh).material as T.MeshStandardMaterial;
  const resin=(first.getObjectByName('directional-resin') as T.Mesh).material as T.MeshStandardMaterial;
  expect(paint).not.toBe(MAT.trim);expect(paint.map).toBeInstanceOf(T.DataTexture);
  expect(resin.roughness).toBeGreaterThan(.9);expect(resin.metalness).toBe(0);
  expect(resin.map).toBeInstanceOf(T.DataTexture);expect(resin.emissive.getHex()).toBe(0);
  expect((second.getObjectByName('headstock') as T.Mesh).material).toBe(paint);
  expect(first.getObjectByName('resin-fiber')).toBeDefined();
 });
 it('keeps the workshop shell outboard and deck markings flush with no free growth puddles',()=>{
  const shell=new T.Group();environmentArchitecture(shell,'infested',37.5,27.5,'infested-workshop');
  expect(shell.getObjectByName('workshop-rear-cassette')).toBeDefined();
  expect(shell.getObjectByName('workshop-deck-seam')).toBeDefined();
  shell.traverse(o=>{if(o instanceof T.Mesh){
   const b=bounds(o);expect(b.max.y<=.011||b.max.z<=.001).toBe(true);
   expect((o.material as T.MeshStandardMaterial).emissive.getHex()).toBe(0);
  }});
  const neighbor=new T.Group();environmentArchitecture(neighbor,'infested',37.5,27.5,'swarm-junction');
  expect(neighbor.getObjectByName('workshop-rear-cassette')).toBeUndefined();
 });
 it('places a lathe and articulated manipulator on the original first island',()=>{
  const model=models()[0];
  for(const name of ['lathe-bed','chuck','carriage','way-front','way-rear','broken-guard','arm-upper','arm-forearm','tendon-brace','suspended-workpiece','peeled-insulation'])expect(model.getObjectByName(name),name).toBeDefined();
  const piece=bounds(model.getObjectByName('suspended-workpiece')!);
  expect(piece.min.y).toBeGreaterThan(.5);
 });
 it('preserves four original solids and planned equipment roles',()=>{
  expect(solids).toEqual([{x:280,y:220,width:190,height:140},{x:480,y:560,width:180,height:160},{x:700,y:160,width:130,height:240},{x:850,y:550,width:150,height:140}]);
  expect(models().map(m=>m.name)).toEqual(['workshop-lathe-manipulator','workshop-fixture-bench','workshop-gantry','workshop-stock-cabinet']);
  expect(environmentObstacle('infested',{x:0,y:0,width:5,height:5},0,'swarm-junction').name).toBe('infested-obstacle-0');
 });
 it('contains every actual vertex inside reserved envelopes before flattening and real renderer batching',()=>{
  const reservations=[{x:288,y:228,width:174,height:124},{x:488,y:568,width:164,height:144},{x:708,y:168,width:114,height:224},{x:858,y:558,width:134,height:124}];
  models().forEach((model,i)=>{
   const b=bounds(model),r=reservations[i];
   expect(b.min.x).toBeGreaterThanOrEqual(r.x/32-1e-5);expect(b.max.x).toBeLessThanOrEqual((r.x+r.width)/32+1e-5);
   expect(b.min.z).toBeGreaterThanOrEqual(r.y/32-1e-5);expect(b.max.z).toBeLessThanOrEqual((r.y+r.height)/32+1e-5);
   expect(b.min.y).toBeGreaterThanOrEqual(-1e-5);
   let meshes=0,triangles=0;const materials=new Set<T.Material>();
   model.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;materials.add(o.material as T.Material);}});
   expect(meshes).toBeLessThanOrEqual(128);expect(triangles).toBeLessThanOrEqual(100000);expect(materials.size).toBeLessThanOrEqual(8);
   expect(materials.has(MAT.acid)).toBe(false);
   const world=new T.Group();appendEnvironment(world,model);
   const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};
   renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();
   const after=bounds(world);expect(after.min.distanceTo(b.min)).toBeLessThan(1e-5);expect(after.max.distanceTo(b.max)).toBeLessThan(1e-5);
   expect(world.children.length).toBe(materials.size);disposeModel(world);renderer.floorMaterial.dispose();
  });
 });
});
