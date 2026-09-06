import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {authoredRoom} from './AuthoredRooms';
import {disposeModel} from './meshParts';
import {AUTHORED_ROOM_TOPOLOGIES} from '../game/roguelike/authoredRoomTopologies';
const plan={width:1200,height:880,...AUTHORED_ROOM_TOPOLOGIES['passenger-vault']!};
async function asset(){const bytes=readFileSync('public/assets/environment/cryo-review.glb');return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength), '')).scene;}
describe('cryo review asset contract',()=>{
 it('requests only the selected room, falls back on failure, retries and shares concurrent loads',async()=>{
  const {prepareCryoBenchmark,cryoBenchmarkTemplate}=await import('./CryoBenchmark');
  const bytes=readFileSync('public/assets/environment/cryo-review.glb');
  const fixture=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const load=vi.spyOn(GLTFLoader.prototype,'loadAsync').mockRejectedValueOnce(new Error('offline')).mockResolvedValue(fixture);
  try{
   await prepareCryoBenchmark('awakening-bay');expect(load).not.toHaveBeenCalled();
   await prepareCryoBenchmark('passenger-vault');expect(cryoBenchmarkTemplate()).toBeUndefined();
   const fallback=authoredRoom('passenger-vault',plan)!;expect(fallback.userData.cryoPodCount).toBeUndefined();disposeModel(fallback);
   await Promise.all([prepareCryoBenchmark('passenger-vault'),prepareCryoBenchmark('passenger-vault')]);
   expect(load).toHaveBeenCalledTimes(2);expect(load.mock.calls[0][0]).toBe('/assets/environment/cryo-review.glb');
   expect(cryoBenchmarkTemplate()).toBe(fixture.scene);await prepareCryoBenchmark('passenger-vault');expect(load).toHaveBeenCalledTimes(2);
  }finally{load.mockRestore();}
 });
 it('imports a bounded metre-scale pressure vessel with nine reused materials',async()=>{
  const pod=await asset();pod.updateMatrixWorld(true);const size=new T.Box3().setFromObject(pod).getSize(new T.Vector3());
  expect(size.x).toBeLessThan(1.79);expect(size.z).toBeLessThan(2.87);expect(size.y).toBeLessThan(1.1);
  expect(size.x).toBeGreaterThan(1.5);expect(size.z).toBeGreaterThan(2.7);
  const materials=new Set<T.Material>();let triangles=0;pod.traverse(o=>{if(o instanceof T.Mesh){materials.add(o.material);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;expect(o.geometry.attributes.normal).toBeDefined();expect(o.geometry.attributes.uv).toBeDefined();}});
  expect(materials.size).toBe(9);expect(triangles).toBeLessThan(6500);
 });
 it('exports sleeping anatomy and visible hands without adding material batches',async()=>{
  const pod=await asset();const components:string[]=[];
  pod.traverse(o=>{if(o instanceof T.Mesh)components.push(...(o.userData.occupantComponents??[]));});
  for(const part of ['Contoured face','Nose bridge','Closed eyelid left','Closed eyelid right','Neck','Left palm','Right palm','Left thumb','Right thumb','Suit collar','Shoulder restraint left','Shoulder restraint right']) expect(components).toContain(part);
  const skin=pod.getObjectByName('cryo-passenger') as T.Mesh;
  const bounds=new T.Box3().setFromObject(skin);
  expect(bounds.max.x-bounds.min.x).toBeGreaterThan(.5);
  expect(bounds.max.y).toBeGreaterThan(.49);
 });
 it('batches all pods by material, preserves source and disposes room copies exactly once',async()=>{
  const pod=await asset(),before=new T.Box3().setFromObject(pod),snapshot=JSON.stringify(plan);
  const room=authoredRoom('passenger-vault',plan,pod)!;
  const cryo=room.children.filter(o=>o instanceof T.Mesh&&(o.material as T.Material).name.startsWith('cryo-')) as T.Mesh[];
  expect(cryo).toHaveLength(9);expect(room.userData.cryoPodCount).toBe(28);
  expect(new T.Box3().setFromObject(pod).equals(before)).toBe(true);expect(JSON.stringify(plan)).toBe(snapshot);
  let sourceDisposals=0;pod.traverse(o=>{if(o instanceof T.Mesh)o.geometry.addEventListener('dispose',()=>sourceDisposals++);});
  const resources=new Set<T.BufferGeometry|T.Material>();room.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);resources.add(o.material);}});let disposed=0;for(const r of resources)r.addEventListener('dispose',()=>disposed++);
  disposeModel(room);expect(disposed).toBe(resources.size);expect(sourceDisposals).toBe(0);
  const second=authoredRoom('passenger-vault',plan,pod)!;expect(second.userData.cryoPodCount).toBe(28);disposeModel(second);
 });
});
