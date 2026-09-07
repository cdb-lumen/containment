import {describe,it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import * as T from 'three';
import {buildSealedBank,attachSealedBank} from './SealedChamberBank';
import {createAwakeningRacks} from './AuthoredRooms';
const source=()=>{const g=new T.Group();const m=new T.MeshStandardMaterial({map:new T.Texture(),roughness:.48});g.add(new T.Mesh(new T.BoxGeometry(1.53,.694,2.58),m));g.children[0].position.y=.352;return g;};
describe('sealed chamber bank',()=>{
 it('keeps a committed bank when its notification throws',async()=>{
  const room=new T.Group(),rack=createAwakeningRacks(),s=source();room.add(rack);
  const disposed=vi.spyOn((s.children[0] as T.Mesh).geometry,'dispose');
  const error=Error('observer failed');const changed=vi.fn(()=>{throw error;});
  const owner=attachSealedBank(room,changed,async()=>s);await owner.ready;
  expect(owner.state).toBe('ready');expect(owner.notificationError).toBe(error);expect(room.getObjectByName('sealed-chamber-bank')).toBeDefined();
  expect(rack.parent).toBeNull();expect(disposed).not.toHaveBeenCalled();expect(changed).toHaveBeenCalledTimes(1);
  owner.dispose();owner.dispose();expect(disposed).toHaveBeenCalledTimes(1);
 });
 it('updates only fallback-owned room sign metadata after committing',async()=>{
  const room=new T.Group(),rack=createAwakeningRacks(),other={text:'RELEASED'};room.add(rack);
  room.userData.localSigns=[...rack.userData.localSigns,other];
  const owner=attachSealedBank(room,vi.fn(),async()=>source());await owner.ready;
  expect(room.userData.localSigns).toEqual([other,...room.getObjectByName('awakening-racks')!.userData.localSigns??[]]);
  owner.dispose();
 });
 it('retires partially initialized instances without disposing caller-owned source',()=>{
  const s=source(),mesh=s.children[0] as T.Mesh,geometry=vi.spyOn(mesh.geometry,'dispose');
  const disposed=vi.spyOn(T.InstancedMesh.prototype,'dispose');
  const fail=vi.spyOn(T.InstancedMesh.prototype,'computeBoundingSphere').mockImplementation(()=>{throw Error('bounds failed');});
  try{expect(()=>buildSealedBank(s)).toThrow('bounds failed');expect(disposed).toHaveBeenCalledTimes(1);expect(geometry).not.toHaveBeenCalled();}
  finally{fail.mockRestore();disposed.mockRestore();}
 });
 it('retires partial adapter allocations once and leaves fallback metadata intact',async()=>{
  const room=new T.Group(),rack=createAwakeningRacks(),s=source();room.add(rack);
  room.userData.localSigns=[...rack.userData.localSigns];room.userData.serviceRoutes=rack.userData.serviceRoutes;
  const signs=room.userData.localSigns,routes=room.userData.serviceRoutes,retired=new Map<T.BufferGeometry,number>();
  const original=T.BufferGeometry.prototype.dispose;
  const dispose=vi.spyOn(T.BufferGeometry.prototype,'dispose').mockImplementation(function(this:T.BufferGeometry){retired.set(this,(retired.get(this)??0)+1);original.call(this);});
  const originalTranslate=T.BufferGeometry.prototype.translate;let cylinders=0;
  const translate=vi.spyOn(T.BufferGeometry.prototype,'translate').mockImplementation(function(this:T.BufferGeometry,x,y,z){if(this instanceof T.CylinderGeometry&&++cylinders===26)throw Error('adapter failed');return originalTranslate.call(this,x,y,z);});
  const instances=vi.spyOn(T.InstancedMesh.prototype,'dispose'),materials=vi.spyOn(T.Material.prototype,'dispose'),textures=vi.spyOn(T.Texture.prototype,'dispose');
  try{const owner=attachSealedBank(room,vi.fn(),async()=>s);await owner.ready;
   expect(owner.state).toBe('fallback');expect(rack.parent).toBe(room);expect(room.getObjectByName('sealed-chamber-bank')).toBeUndefined();
   expect(room.userData.localSigns).toBe(signs);expect(room.userData.serviceRoutes).toBe(routes);
   expect(retired.size).toBe(28);expect([...retired.values()].every(n=>n===1)).toBe(true);expect(instances).toHaveBeenCalledTimes(1);
   expect(materials).toHaveBeenCalledTimes(2);expect(textures).toHaveBeenCalledTimes(1);
   owner.dispose();expect([...retired.values()].every(n=>n===1)).toBe(true);
   expect(materials).toHaveBeenCalledTimes(2);expect(textures).toHaveBeenCalledTimes(1);expect(instances).toHaveBeenCalledTimes(1);
  }finally{translate.mockRestore();dispose.mockRestore();instances.mockRestore();materials.mockRestore();textures.mockRestore();}
 });
 it('uses the real HTTP failure path without mutating fallback',async()=>{
  let requests=0;const server=createServer((_req,res)=>{requests++;res.writeHead(404);res.end();});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address() as {port:number},realFetch=globalThis.fetch;
  const fetcher=vi.fn((_url:unknown,options?:RequestInit)=>realFetch(`http://127.0.0.1:${address.port}/missing.glb`,options));vi.stubGlobal('fetch',fetcher);
  try{const room=new T.Group(),rack=createAwakeningRacks();room.add(rack);const changed=vi.fn();const owner=attachSealedBank(room,changed);await owner.ready;
   expect(owner.state).toBe('fallback');expect(rack.parent).toBe(room);expect(room.children).toEqual([rack]);expect(changed).not.toHaveBeenCalled();expect(fetcher).toHaveBeenCalledTimes(1);expect(requests).toBe(1);owner.dispose();
  }finally{vi.unstubAllGlobals();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
 });
 it('retires a late decode once after timeout without changing fallback',async()=>{
  vi.useFakeTimers();
  try{const room=new T.Group(),rack=createAwakeningRacks();room.add(rack);let resolve!:(s:T.Group)=>void;
   const owner=attachSealedBank(room,vi.fn(),()=>new Promise(r=>resolve=r),20);
   await vi.advanceTimersByTimeAsync(21);await owner.ready;const s=source(),dispose=vi.spyOn((s.children[0] as T.Mesh).geometry,'dispose');
   resolve(s);await vi.advanceTimersByTimeAsync(0);expect(owner.state).toBe('fallback');expect(room.children).toEqual([rack]);expect(dispose).toHaveBeenCalledTimes(1);owner.dispose();expect(dispose).toHaveBeenCalledTimes(1);
  }finally{vi.useRealTimers();}
 });
 it('contains synchronous loader exceptions before touching the rack',async()=>{
  const room=new T.Group(),rack=createAwakeningRacks();room.add(rack);const changed=vi.fn();
  const owner=attachSealedBank(room,changed,()=>{throw Error('loader failed synchronously');});await owner.ready;
  expect(owner.state).toBe('fallback');expect(room.children).toEqual([rack]);expect(changed).not.toHaveBeenCalled();owner.dispose();
 });
 it('rejects an unsupported later primitive before allocating instances',()=>{
  const s=source(),bad=(s.children[0] as T.Mesh).clone();bad.geometry=bad.geometry.clone();bad.geometry.deleteAttribute('uv');s.add(bad);
  const allocation=vi.spyOn(T.InstancedMesh.prototype,'setMatrixAt');
  try{expect(()=>buildSealedBank(s)).toThrow('unsupported');expect(allocation).not.toHaveBeenCalled();}finally{allocation.mockRestore();}
 });
 it('shares textured geometry across eight native-scale sealed neighbours',()=>{const s=source(),bank=buildSealedBank(s);const pods=bank.children.filter(o=>o instanceof T.InstancedMesh) as T.InstancedMesh[];expect(pods).toHaveLength(1);expect(pods[0].count).toBe(8);expect(pods[0].material).toBe((s.children[0] as T.Mesh).material);expect(pods[0].geometry.attributes.normal).toBeDefined();expect(pods[0].geometry.attributes.uv).toBeDefined();pods[0].computeBoundingBox();expect(pods[0].boundingBox!.min.y).toBeCloseTo(.5);expect(bank.children.length).toBe(3);expect(pods[0].receiveShadow).toBe(true);});
 it('rejects oversize geometry rather than hiding the fallback',()=>{const s=source();s.scale.setScalar(2);expect(()=>buildSealedBank(s)).toThrow(/fit/);});
 it('retains baseline until success and only replaces rack assembly',async()=>{const room=new T.Group(),racks=createAwakeningRacks(),other=new T.Group();room.add(racks,other);let resolve!:(s:T.Group)=>void;const load=vi.fn(()=>new Promise<T.Group>(r=>resolve=r));const changed=vi.fn();const owner=attachSealedBank(room,changed,load);expect(racks.parent).toBe(room);resolve(source());await owner.ready;expect(racks.parent).toBeNull();expect(other.parent).toBe(room);expect(changed).toHaveBeenCalledTimes(1);expect(room.getObjectByName('sealed-chamber-bank')).toBeDefined();owner.dispose();});
 it('keeps baseline on failure',async()=>{const room=new T.Group(),rack=createAwakeningRacks();room.add(rack);const owner=attachSealedBank(room,vi.fn(),async()=>{throw Error('404');});await owner.ready;expect(rack.parent).toBe(room);expect(owner.state).toBe('fallback');owner.dispose();});
 it('disposes stale decoded resources and cannot mutate a departed room',async()=>{const room=new T.Group(),rack=createAwakeningRacks();room.add(rack);let resolve!:(s:T.Group)=>void;const owner=attachSealedBank(room,vi.fn(),()=>new Promise(r=>resolve=r));owner.dispose();const s=source(),mesh=s.children[0] as T.Mesh,geometry=vi.spyOn(mesh.geometry,'dispose'),material=vi.spyOn(mesh.material as T.Material,'dispose'),texture=vi.spyOn((mesh.material as T.MeshStandardMaterial).map!,'dispose');resolve(s);await owner.ready;expect(rack.parent).toBe(room);expect(geometry).toHaveBeenCalledTimes(1);expect(material).toHaveBeenCalledTimes(1);expect(texture).toHaveBeenCalledTimes(1);});
 it('settles cancellation even when the bank decoder ignores abort',async()=>{const room=new T.Group();room.add(createAwakeningRacks());const owner=attachSealedBank(room,vi.fn(),()=>new Promise(()=>{}));owner.dispose();await owner.ready;expect(owner.state).toBe('disposed');});
 it('bounds stalled loading and permits a fresh room entry',async()=>{vi.useFakeTimers();const room=new T.Group();room.add(createAwakeningRacks());const owner=attachSealedBank(room,vi.fn(),()=>new Promise(()=>{}),20);await vi.advanceTimersByTimeAsync(21);await owner.ready;expect(owner.state).toBe('fallback');owner.dispose();const next=attachSealedBank(room,vi.fn(),async()=>source());await next.ready;expect(next.state).toBe('ready');next.dispose();vi.useRealTimers();});
});
