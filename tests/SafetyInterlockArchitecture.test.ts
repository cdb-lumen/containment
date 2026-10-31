import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {environmentArchitecture,appendEnvironment} from '../src/render/ShipEnvironments';
import {diagnosticGalleryModels} from '../src/render/DiagnosticGalleryModels';
import {diagnosticGalleryArchitecture} from '../src/render/DiagnosticGalleryArchitecture';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {disposeModel,MAT} from '../src/render/meshParts';

const make=(id='safety-interlock-station')=>{const root=new T.Group();environmentArchitecture(root,'engineering',37.5,27.5,id);return root;};
describe('Room12 insulated shell',()=>{
 it('uses a room-local insulated rear wall and flush service deck',()=>{
  const root=make();
  for(const name of ['ceramic-wall-panel','service-channel','room12-isolation-break'])expect(root.getObjectByName(name)).toBeDefined();
  root.traverse(o=>{if(o instanceof T.Mesh){const b=new T.Box3().setFromObject(o,true);if(b.max.y>.025)expect(b.max.z).toBeLessThanOrEqual(0);else {expect(b.min.x).toBeGreaterThanOrEqual(0);expect(b.max.x).toBeLessThanOrEqual(37.5);expect(b.min.z).toBeGreaterThanOrEqual(0);expect(b.max.z).toBeLessThanOrEqual(27.5);}}});
 });
 it('separates service slot faces from the steel channel tops',()=>{
  const root=make(),channels:T.Box3[]=[],slots:T.Box3[]=[];
  root.traverse(o=>{if(o.name==='service-channel')channels.push(new T.Box3().setFromObject(o,true));if(o.name==='channel-slot')slots.push(new T.Box3().setFromObject(o,true));});
  expect(channels).toHaveLength(2);expect(slots.length).toBeGreaterThan(100);
  for(const slot of slots){const channel=channels.find(c=>c.min.z<=slot.min.z&&c.max.z>=slot.max.z)!;expect(channel).toBeDefined();expect(slot.min.y-channel.max.y).toBeGreaterThan(.001);expect(slot.max.y).toBeLessThan(.025);}
 });
 it('keeps local materials disposable without mutating the shared palette',()=>{
  const root=make(),materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh)materials.add(o.material as T.Material);});
  expect(materials.size).toBeLessThanOrEqual(5);
  const spies=[...materials].map(m=>{expect(Object.values(MAT)).not.toContain(m);expect(m.userData.actorMaterial).toBe(true);return vi.spyOn(m,'dispose');});
  disposeModel(root);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);vi.restoreAllMocks();
 });
 it('batches the shell into five draw meshes without changing its bounds',()=>{
  const root=make(),before=new T.Box3().setFromObject(root,true);
  const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};
  renderer.world=root;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();
  expect(root.children).toHaveLength(5);
  const after=new T.Box3().setFromObject(root,true);
  for(const axis of ['x','y','z'] as const){expect(after.min[axis]).toBeCloseTo(before.min[axis],5);expect(after.max[axis]).toBeCloseTo(before.max[axis],5);}
  disposeModel(root);renderer.floorMaterial.dispose();
 });
 it('keeps the generic engineering fallback separate from the Room12 shell',()=>{
  const generic=make(''),unknown=make('unregistered-engineering-room');
  const signature=(root:T.Group)=>{const items:unknown[]=[];root.traverse(o=>{if(o instanceof T.Mesh)items.push([o.position.toArray(),o.scale.toArray(),(o.material as T.MeshStandardMaterial).color.getHex()]);});return items;};
  expect(signature(unknown)).toEqual(signature(generic));
  expect(generic.getObjectByName('room12-insulated-shell')).toBeUndefined();
  disposeModel(generic);disposeModel(unknown);
 });
 it('preserves Room11 authored equipment and architecture without adding the Room12 shell',()=>{
  // Room11 now intentionally owns an authored model; it must no longer equal
  // generic engineering. Compare actual dispatch against both owned builders.
  const actual=make('diagnostic-gallery'),expected=new T.Group();
  appendEnvironment(expected,diagnosticGalleryModels());appendEnvironment(expected,diagnosticGalleryArchitecture());
  const signature=(root:T.Group)=>{root.updateMatrixWorld(true);const items:unknown[]=[];root.traverse(o=>{if(o instanceof T.Mesh)items.push([o.name,o.matrixWorld.toArray(),Array.from(o.geometry.getAttribute('position').array),o.geometry.index?Array.from(o.geometry.index.array):null,(o.material as T.MeshStandardMaterial).color.getHex()]);});return items;};
  expect(signature(actual)).toEqual(signature(expected));
  expect(actual.getObjectByName('diagnostic-physical-ship-cutaway')).toBeDefined();
  expect(actual.getObjectByName('room12-insulated-shell')).toBeUndefined();
  disposeModel(actual);disposeModel(expected);
 });
});
