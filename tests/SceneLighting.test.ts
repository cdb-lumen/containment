import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';

it('wires lighting and contact patches into the production renderer and reset lifecycle',()=>{
 const source=readFileSync('src/render/DepthRenderer.ts','utf8');
 expect(source).toContain('this.lighting.loadRoom(this.world,w,h)');
 expect(source).toContain('this.lighting.update(dt)');
 expect(source).toContain('this.contacts.end()');
 expect(source).toContain('this.lighting.dispose()');
});
import {SceneLighting,ContactShadows} from '../src/render/SceneLighting';
import {authoredRoom,AUTHORED_ROOMS} from '../src/render/AuthoredRooms';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {disposeModel} from '../src/render/meshParts';
import {appendEnvironment} from '../src/render/ShipEnvironments';

it('retains actual fixture origins when authored geometry is baked',()=>{
 for(const id of AUTHORED_ROOMS){
  const room=authoredRoom(id,ROOM_TEMPLATES[id])!;
  expect(room.userData.lightFixtures?.length??0).toBeGreaterThan(3);
  expect(room.userData.lightFixtures.length).toBeLessThanOrEqual(256);
  const rig=new SceneLighting();rig.loadRoom(room,ROOM_TEMPLATES[id].width/32,ROOM_TEMPLATES[id].height/32);
  expect(rig.fixtures.filter(l=>l.intensity>0)).toHaveLength(4);
  for(const light of rig.fixtures)expect(room.userData.lightFixtures.some((f:{x:number;y:number;z:number})=>light.position.equals(new T.Vector3(f.x,f.y,f.z)))).toBe(true);
  rig.dispose();disposeModel(room);
 }
});

it('retains unmerged fixture positions through the real legacy renderer bake',()=>{
 const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};
 renderer.world=new T.Group();renderer.floorMaterial=new T.MeshStandardMaterial();
 const material=new T.MeshStandardMaterial({emissive:0x66cddd,emissiveIntensity:1});
 const geometry=new T.BoxGeometry(1,.1,.1);
 for(const x of [3,9,15,21]){const mesh=new T.Mesh(geometry,material);mesh.position.set(x,1.2,4);renderer.world.add(mesh);}
 renderer.bakeWorld();expect(renderer.world.children).toHaveLength(1);
 const rig=new SceneLighting();rig.loadRoom(renderer.world,24,16);
 expect(rig.fixtures.map(l=>l.position.x).sort((a,b)=>a-b)).toEqual([3,9,15,21]);
 rig.dispose();disposeModel(renderer.world);geometry.dispose();material.dispose();renderer.floorMaterial.dispose();
});

it.each([
 {y:1.2,offset:1,included:true},
 {y:.1,offset:1,included:true},
 {y:1.2,offset:-1,included:false},
])('bakes flattened legacy fixture matrix origins with y=$y and offset=$offset',({y,offset,included})=>{
 const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};
 renderer.world=new T.Group();renderer.floorMaterial=new T.MeshStandardMaterial();
 renderer.world.position.set(40,3,20);renderer.world.rotation.y=-.4;
 const model=new T.Group();model.position.set(8,offset,6);model.rotation.y=Math.PI/2;renderer.world.add(model);
 const material=new T.MeshStandardMaterial({emissive:0x66cddd,emissiveIntensity:1});
 const geometry=new T.BoxGeometry(1,.1,.1),mesh=new T.Mesh(geometry,material);
 mesh.position.set(3,y,2);model.add(mesh);
 appendEnvironment(renderer.world,model);model.removeFromParent();
 expect(mesh.matrixAutoUpdate).toBe(false);
 expect(mesh.position.toArray()).toEqual([3,y,2]);
 const localOrigin=new T.Vector3(10,y+offset,3),worldOrigin=mesh.getWorldPosition(new T.Vector3());
 renderer.bakeWorld();
 const baked=renderer.world.children[0] as T.Mesh;
 baked.geometry.computeBoundingBox();
 expect(baked.geometry.boundingBox!.getCenter(new T.Vector3()).distanceTo(localOrigin)).toBeLessThan(1e-6);
 const records=renderer.world.userData.lightFixtures??[];
 expect(records).toHaveLength(included?1:0);
 if(included){
  const record=records[0];
  expect(new T.Vector3(record.x,record.y,record.z).distanceTo(localOrigin)).toBeLessThan(1e-6);
  expect(record.color).toBe(0x66cddd);
 }
 const rig=new SceneLighting();rig.loadRoom(renderer.world,24,16);
 const lights=rig.fixtures.filter(light=>light.intensity>0);
 expect(lights).toHaveLength(included?1:0);
 if(included)expect(lights[0].position.distanceTo(worldOrigin)).toBeLessThan(1e-6);
 rig.dispose();disposeModel(renderer.world);geometry.dispose();material.dispose();renderer.floorMaterial.dispose();
});

it('routes real explosion events to one light in world units',()=>{
 const rig=new SceneLighting();const event=vi.fn();
 const renderer=Object.create(DepthRenderer.prototype);
 Object.assign(renderer,{lighting:rig,effects:{event}});
 renderer.effect({type:'explosion',x:320,y:640,radius:96});
 expect(rig.blast.position.toArray()).toEqual([10,.9,20]);expect(rig.blast.distance).toBe(4.5);
 expect(event).toHaveBeenCalledOnce();rig.dispose();
});

describe('bounded presentation lighting',()=>{
 it('never substitutes the origin of a translated baked room for a fixture',()=>{
  const rig=new SceneLighting(),room=authoredRoom('passenger-vault',ROOM_TEMPLATES['passenger-vault'])!;
  room.position.set(40,2,20);rig.loadRoom(room,80,40);
  for(const light of rig.fixtures)expect(room.userData.lightFixtures.some((f:{x:number;y:number;z:number})=>light.position.equals(new T.Vector3(f.x+40,f.y+2,f.z+20)))).toBe(true);
  rig.dispose();disposeModel(room);
 });
 it('uses a cool directional key and a readable, subordinate ambient fill',()=>{
  const rig=new SceneLighting();
  expect(rig.key.color.b).toBeGreaterThan(rig.key.color.r);
  expect(rig.ambient.intensity).toBeGreaterThanOrEqual(1);
  expect(rig.ambient.intensity).toBeLessThan(rig.key.intensity/2);
  expect(rig.key.castShadow).toBe(true);
  expect(rig.key.shadow.mapSize.x).toBe(1024);
 });
 it('selects spaced actual emissive fixtures with a fixed non-shadow light budget',()=>{
  const rig=new SceneLighting(),room=new T.Group();
  for(let i=0;i<40;i++){const mesh=new T.Mesh(new T.BoxGeometry(.8,.08,.1),new T.MeshStandardMaterial({emissive:0x66cddd,emissiveIntensity:1}));mesh.position.set(i*2,1.2,0);room.add(mesh);}
  rig.loadRoom(room,40,20);
  expect(rig.fixtures).toHaveLength(4);
  expect(rig.fixtures.every(l=>!l.castShadow&&l.distance<=6&&l.intensity>0)).toBe(true);
  expect(new Set(rig.fixtures.map(l=>l.position.x)).size).toBe(4);
  const objects=[...rig.root.children];rig.loadRoom(new T.Group(),10,10);
  expect(rig.root.children).toEqual(objects);
  expect(rig.fixtures.every(l=>l.intensity===0)).toBe(true);
 });
 it('reads baked authored fixture positions without using merged mesh centers',()=>{
  const rig=new SceneLighting(),room=new T.Group(),child=new T.Group();room.add(child);child.position.set(2,0,3);
  child.userData.lightFixtures=[{x:4,y:1.2,z:5,color:0x66cddd}];rig.loadRoom(room,20,20);
  expect(rig.fixtures[0].position.toArray()).toEqual([6,1.2,8]);
 });
 it('bounds explosion light energy and retires it using only presentation delta',()=>{
  const rig=new SceneLighting(),lights=[...rig.root.children];
  for(let i=0;i<100;i++)rig.explosion(i,2,100000);
  expect(rig.blast.intensity).toBeLessThanOrEqual(12);expect(rig.blast.distance).toBeLessThanOrEqual(7);
  rig.update(0);expect(rig.blast.intensity).toBeGreaterThan(0);
  rig.update(.05);expect(rig.blast.intensity).toBeGreaterThan(0);
  rig.update(.5);expect(rig.blast.intensity).toBe(0);expect(rig.root.children).toEqual(lights);
  rig.explosion(1,2,3);rig.loadRoom(new T.Group(),20,20);expect(rig.blast.intensity).toBe(0);
 });
 it('keeps contact patches ground aligned, capped, resettable and disposable',()=>{
  const shadows=new ContactShadows(),matrix=new T.Matrix4();
  shadows.begin();for(let i=0;i<200;i++)shadows.add(i,2,.5);
  shadows.end();expect(shadows.mesh.count).toBe(64);expect(shadows.mesh.castShadow).toBe(false);
  shadows.mesh.getMatrixAt(0,matrix);expect(new T.Vector3().setFromMatrixPosition(matrix).y).toBeCloseTo(.025);
  shadows.begin();shadows.end();expect(shadows.mesh.count).toBe(0);
  const geometry=vi.spyOn(shadows.mesh.geometry,'dispose'),material=vi.spyOn(shadows.mesh.material as T.Material,'dispose');
  shadows.dispose();expect(geometry).toHaveBeenCalledOnce();expect(material).toHaveBeenCalledOnce();
 });
});
