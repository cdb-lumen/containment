import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {coolantPlantBlockout,coolantPlantServices} from '../src/render/CoolantPlantBlockout';
import {environmentObstacle,environmentArchitecture,appendEnvironment} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import type {RunNode} from '../src/game/roguelike/types';
const template=ROOM_TEMPLATES['coolant-plant'];
const node={id:'coolant-test',templateId:'coolant-plant',depth:12,kind:'combat',reward:'upgrade',next:[]} as RunNode;
const footprints=[[300,210,150,150],[750,210,150,150],[300,540,150,150],[750,540,150,150],[550,390,100,100]];
function bake(world:T.Group){const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();renderer.floorMaterial.dispose();return world;}
describe('coolant plant room visuals',()=>{
 it('builds coaxial volute, coupling and motor with a tangential discharge',()=>{
  for(const index of [2,3]){
   const model=coolantPlantBlockout({x:0,y:0,width:4,height:4},index);
   const volute=model.getObjectByName('pump-volute') as T.Mesh;
   expect(volute).toBeDefined();expect(volute.geometry.type).toBe('ExtrudeGeometry');
   const shaft=model.getObjectByName('motor-coupling') as T.Mesh;
   const motor=model.getObjectByName('pump-motor') as T.Mesh;
   expect(shaft).toBeDefined();expect(motor).toBeDefined();
   expect(shaft.position.y).toBe(motor.position.y);expect(shaft.position.z).toBe(motor.position.z);
   expect(model.getObjectByName('tangential-discharge')).toBeDefined();
   expect(model.getObjectByName('strainer-cutaway')).toBeDefined();
   expect(model.getObjectByName('strainer-basket')).toBeDefined();
  }
 });
 it('presents curved pump heads toward the desktop view and a thick open strainer shell',()=>{
  for(const index of [2,3]){
   const model=coolantPlantBlockout({x:0,y:0,width:4,height:4},index);
   model.updateMatrixWorld(true);
   const volute=model.getObjectByName('pump-volute') as T.Mesh;
   const axis=new T.Vector3(0,0,1).transformDirection(volute.matrixWorld);
   expect(Math.abs(axis.z)).toBeGreaterThan(.85);
   const housing=model.getObjectByName('strainer-cutaway') as T.Mesh;
   expect(housing.geometry.type).toBe('ExtrudeGeometry');
   expect(model.getObjectByName('strainer-cut-rim')).toBeDefined();
  }
 });
 it('identifies life support with room-local raised service lettering',()=>{
  const model=coolantPlantBlockout({x:0,y:0,width:4,height:4},4);
  const label=model.getObjectByName('life-support-service-label');
  expect(label).toBeDefined();
  expect(label!.userData.text).toBe('LIFE SUPPORT');
  expect(new T.Box3().setFromObject(label!).getSize(new T.Vector3()).x).toBeGreaterThan(2);
 });
 it('connects expansion vessels to both exchanger shells inside the retained skids',()=>{
  for(const index of [0,1]){
   const model=coolantPlantBlockout({x:0,y:0,width:4,height:4},index);
   expect(model.getObjectByName('expansion-vessel')).toBeDefined();
   expect(model.getObjectByName('expansion-branch')).toBeDefined();
   expect(model.getObjectByName('exchanger-channel-head')).toBeDefined();
  }
 });
 it('keeps service covers non-emissive and breaks their finish into grate slots',()=>{
  const services=coolantPlantServices(),materials=new Set<T.MeshStandardMaterial>();
  services.traverse(o=>{if(o instanceof T.Mesh)materials.add(o.material as T.MeshStandardMaterial);});
  for(const m of materials)expect(m.emissive.getHex()).toBe(0);
  expect(services.children.length).toBeGreaterThan(30);
 });
 it('gives both installations the same room-local enamel and stainless finish',()=>{
  const materials=(index:number)=>{const found=new Map<string,T.MeshStandardMaterial>();coolantPlantBlockout({x:0,y:0,width:4,height:4},index).traverse(o=>{if(o instanceof T.Mesh)found.set(o.material.name,o.material);});return found;};
  const left=materials(0),right=materials(1),pump=materials(2);
  for(const name of ['coolant-enamel','coolant-stainless','coolant-mineral']){
   expect(left.has(name)).toBe(true);expect(right.get(name)).toBe(left.get(name));expect(pump.get(name)).toBe(left.get(name));
  }
  expect(left.get('coolant-stainless')!.roughness).toBeGreaterThanOrEqual(.65);
  expect(left.get('coolant-enamel')!.emissive.getHex()).toBe(0);
 });
 it('uses twin exposed headers and braced supports instead of a solid saddle cabinet',()=>{
  const saddle=coolantPlantBlockout({x:0,y:0,width:4,height:4},4);
  expect(saddle.getObjectByName('supply-header')).toBeDefined();
  expect(saddle.getObjectByName('return-header')).toBeDefined();
  expect(saddle.getObjectByName('saddle-open-frame')).toBeDefined();
 });
 it('retains all five accepted solid footprints and exact room registration',()=>{
  expect(template.obstacles.map(r=>[r.x,r.y,r.width,r.height])).toEqual(footprints);
  footprints.forEach(([x,y,width,height],index)=>{
   const f={x:x/32,y:y/32,width:width/32,height:height/32};
   const model=environmentObstacle('maintenance',f,index,'coolant-plant');
   expect(model.name).toBe(index<2?'coolant-heat-exchanger':index<4?'coolant-pump-return':'coolant-service-saddle');
   const world=new T.Group();appendEnvironment(world,model);
   const assertBounds=()=>{const b=new T.Box3().setFromObject(world,true);expect(b.min.x).toBeCloseTo(f.x,5);expect(b.max.x).toBeCloseTo(f.x+f.width,5);expect(b.min.z).toBeCloseTo(f.y,5);expect(b.max.z).toBeCloseTo(f.y+f.height,5);expect(b.min.y).toBeCloseTo(0,5);expect(b.max.y).toBeLessThan(index===4?1.3:3);};
   assertBounds();
   bake(world);
   assertBounds();
  });
  expect(environmentObstacle('maintenance',{x:0,y:0,width:4,height:4},0,'service-shaft-landing').name).toBe('maintenance-obstacle-0');
 });
 it('joins both installations and all four saddle ports with flush walkable covers',()=>{
  const model=coolantPlantServices();
  expect(model.userData.servicePaths).toEqual([[[375,340],[375,560]],[[825,340],[825,560]],[[375,410],[550,410]],[[375,470],[550,470]],[[650,410],[825,410]],[[650,470],[825,470]]]);
  const b=new T.Box3().setFromObject(model,true);expect(b.max.y).toBeLessThan(.01);expect(b.min.y).toBeGreaterThanOrEqual(0);
  const world=new T.Group();appendEnvironment(world,model);bake(world);expect(world.children.length).toBeLessThanOrEqual(3);
  const integrated=new T.Group();environmentArchitecture(integrated,'maintenance',37.5,27.5,'coolant-plant');
  expect(integrated.children.every(c=>c instanceof T.Mesh)).toBe(true);
 });
 it.each([16,28])('keeps both circuits, both saddle bypasses and exit open at radius %s',radius=>{
  const g=createExpeditionGeometry(node);
  const routes=[[[500,440],[500,150],[200,150],[200,750],[500,750],[500,440]],[[700,440],[700,750],[1000,750],[1000,150],[700,150],[700,440]],[[100,440],[500,440],[500,330],[700,330],[700,440],[1100,440]],[[100,440],[500,440],[500,550],[700,550],[700,440],[1100,440]]];
  for(const route of routes)for(let i=1;i<route.length;i++){const [x,y]=route[i-1],[x2,y2]=route[i];expect(canTraverseExpedition(g,{x,y},{x:x2,y:y2},radius)).toBe(true);}
  for(const y of [330,550])expect(hasClearExpeditionShot(g,{x:500,y},{x:700,y})).toBe(true);
  expect(hasClearExpeditionShot(g,{x:500,y:440},{x:700,y:440})).toBe(false);
 });
 it('confines the shell finish to the exact coolant room',()=>{
  for(const id of ['coolant-plant','service-shaft-landing','']){
   const world=new T.Group();environmentArchitecture(world,'maintenance',37.5,27.5,id);
   const finishes=new Set<string>();world.traverse(o=>{if(o instanceof T.Mesh)finishes.add((o.material as T.Material).name);});
   expect(finishes.has('coolant-enamel')).toBe(id==='coolant-plant');
   expect(finishes.has('coolant-stainless')).toBe(id==='coolant-plant');
  }
 });
 it('uses fewer than ten batched material draws for the complete assembly',()=>{
  const world=new T.Group();template.obstacles.forEach((r,i)=>appendEnvironment(world,coolantPlantBlockout({x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},i)));appendEnvironment(world,coolantPlantServices());bake(world);expect(world.children.length).toBeLessThan(10);
 });
});
