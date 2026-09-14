import {afterEach,describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {readFileSync,existsSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as builder from './CommunalAtrium';
import gardenTrees from './garden-trees.json';
import {DepthRenderer} from './DepthRenderer';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {MAT,disposeModel} from './meshParts';
const t=ROOM_TEMPLATES['communal-atrium'];
const file='public/assets/communal-atrium/signature-garden.glb';
const candidate=file;
async function source(){const b=readFileSync(candidate);return (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
function meshes(s:T.Object3D){const a:T.Mesh[]=[];s.traverse(o=>{if(o instanceof T.Mesh)a.push(o);});return a;}
function spies(s:T.Object3D){return [...new Set(meshes(s).flatMap(m=>[m.geometry,...Array.isArray(m.material)?m.material:[m.material]]))].map(r=>vi.spyOn(r,'dispose'));}
function fixture(){const room=new T.Group(),fallback=builder.communalAtrium(t);room.add(fallback);return {room,fallback};}
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
describe('authored communal garden',()=>{
 it('provides a bounded owner that retains fallback until the actual GLB is ready',async()=>{
  expect(existsSync('src/render/CommunalGarden.ts')).toBe(true);
  const {attachCommunalGarden}=await import('./CommunalGarden');
  const {room,fallback}=fixture(),retired=spies(fallback),changed=vi.fn();
  vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(readFileSync(file)));
  const owner=attachCommunalGarden(room,t,changed);expect(owner.state).toBe('loading');expect(fallback.parent).toBe(room);
  await owner.ready;expect(owner.error).toBeUndefined();expect(owner.state).toBe('ready');expect(fallback.parent).toBeNull();retired.forEach(s=>expect(s).toHaveBeenCalledTimes(1));
  const built=room.getObjectByName('communal-atrium-authored')!;expect(built).toBeDefined();expect(changed).toHaveBeenCalledTimes(1);
  const allocated=spies(built);owner.dispose();owner.dispose();allocated.forEach(s=>expect(s).toHaveBeenCalledTimes(1));expect(built.parent).toBeNull();
 });
 it.each(['cancel','timeout'])('settles %s and retires late resources without changing reentry',async mode=>{
  expect(existsSync('src/render/CommunalGarden.ts')).toBe(true);const {attachCommunalGarden}=await import('./CommunalGarden');
  const stale=await source(),next=await source(),retired=spies(stale),{room,fallback}=fixture();let finish!:(s:T.Group)=>void;
  vi.useFakeTimers();const changed=vi.fn(),owner=attachCommunalGarden(room,t,changed,()=>new Promise(r=>finish=r),20);
  if(mode==='cancel')owner.dispose();else await vi.advanceTimersByTimeAsync(21);await owner.ready;expect(owner.state).toBe(mode==='cancel'?'disposed':'fallback');expect(fallback.parent).toBe(room);
  const second=attachCommunalGarden(room,t,vi.fn(),async()=>next);await second.ready;expect(second.state).toBe('ready');finish(stale);await Promise.resolve();await Promise.resolve();retired.forEach(s=>expect(s).toHaveBeenCalledTimes(1));expect(changed).not.toHaveBeenCalled();owner.dispose();expect(second.state).toBe('ready');second.dispose();
 });
 it.each(['404','invalid','missing','bounds','normal'])('retains complete fallback on %s',async defect=>{
  expect(existsSync('src/render/CommunalGarden.ts')).toBe(true);const {attachCommunalGarden}=await import('./CommunalGarden');const {room,fallback}=fixture();
  const s=await source();if(defect==='missing')s.children[0].name='missing';if(defect==='bounds')s.position.x=10;if(defect==='normal')meshes(s)[0].geometry.attributes.normal.setX(0,NaN);
  vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('invalid',defect==='404'?{status:404}:undefined));
  const owner=attachCommunalGarden(room,t,vi.fn(),['404','invalid'].includes(defect)?undefined:async()=>s);await owner.ready;expect(owner.state).toBe('fallback');expect(owner.error).toBeDefined();expect(fallback.parent).toBe(room);owner.dispose();disposeModel(room);
 });
 it.each(['header','stream','scenes','duplicate-node','cycle','external','accessor'])('rejects %s before actual decode',async defect=>{
  const {loadCommunalGarden}=await import('./CommunalGarden');let body:Buffer=readFileSync(file);
  if(['header','stream'].includes(defect))body=Buffer.alloc(128*1024+1);else{
   const n=body.readUInt32LE(12),doc=JSON.parse(body.subarray(20,20+n).toString());
   if(defect==='scenes')doc.scenes=Array(100).fill(doc.scenes[0]);if(defect==='duplicate-node')doc.scenes[0].nodes.push(doc.scenes[0].nodes[0]);if(defect==='cycle')doc.nodes[0].children=[0];if(defect==='external')doc.buffers[0].uri='https://example.invalid/buffer';if(defect==='accessor')doc.accessors[0].count=10000000;
   const j=Buffer.from(JSON.stringify(doc)),p=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);body=Buffer.concat([body.subarray(0,12),Buffer.alloc(8),p,body.subarray(20+n)]);body.writeUInt32LE(body.length,8);body.writeUInt32LE(p.length,12);body.writeUInt32LE(0x4e4f534a,16);
  }
  vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(new Uint8Array(body),defect==='header'?{headers:{'content-length':String(body.length)}}:undefined));const decode=vi.spyOn(GLTFLoader.prototype,'parseAsync');await expect(loadCommunalGarden(new AbortController().signal)).rejects.toThrow();expect(decode).not.toHaveBeenCalled();
 });
 it('retires an ignored-abort real decode once and isolates successful observer failure',async()=>{
  const {attachCommunalGarden}=await import('./CommunalGarden'),s=await source(),retired=spies(s),{room}=fixture();let finish!:(s:never)=>void;
  vi.spyOn(globalThis,'fetch').mockImplementation(async()=>new Response(readFileSync(file)));const decode=vi.spyOn(GLTFLoader.prototype,'parseAsync').mockImplementation(()=>new Promise(r=>finish=r));
  const owner=attachCommunalGarden(room,t,vi.fn());await vi.waitFor(()=>expect(decode).toHaveBeenCalled());owner.dispose();await owner.ready;finish({scene:s} as never);await vi.waitFor(()=>retired.forEach(s=>expect(s).toHaveBeenCalledTimes(1)));decode.mockRestore();
  const second=attachCommunalGarden(room,t,()=>{throw Error('observer');});await second.ready;expect(second.state).toBe('ready');expect(second.notificationError).toBeInstanceOf(Error);second.dispose();
 });
 it('retires every adapter allocation when a later transform throws',async()=>{
  const {attachCommunalGarden}=await import('./CommunalGarden'),s=await source(),{room,fallback}=fixture(),created:T.BufferGeometry[]=[],original=T.BufferGeometry.prototype.clone;
  vi.spyOn(T.BufferGeometry.prototype,'clone').mockImplementation(function(this:T.BufferGeometry){const g=original.call(this);created.push(g);vi.spyOn(g,'dispose');if(created.length===3)vi.spyOn(g,'applyMatrix4').mockImplementation(()=>{throw Error('injected transform');});return g;});
  const owner=attachCommunalGarden(room,t,vi.fn(),async()=>s);await owner.ready;expect(owner.state).toBe('fallback');expect(fallback.parent).toBe(room);expect(created.length).toBeGreaterThanOrEqual(3);for(const g of created)expect(g.dispose).toHaveBeenCalledTimes(1);owner.dispose();disposeModel(room);
 });
 it('does not mutate or destroy donor MAT textures on success or teardown',async()=>{
  const {attachCommunalGarden}=await import('./CommunalGarden'),texture=new T.Texture(),old=MAT.steel.map;MAT.steel.map=texture;
  const spy=vi.spyOn(texture,'dispose'),before=MAT.steel.color.getHex(),{room}=fixture();
  try{const owner=attachCommunalGarden(room,t,vi.fn(),source);await owner.ready;expect(owner.state).toBe('ready');expect(MAT.steel.color.getHex()).toBe(before);owner.dispose();expect(spy).not.toHaveBeenCalled();}finally{MAT.steel.map=old;texture.dispose();}
 });
 it('replaces rough foliage with all authored triangles in compatible owned batches',async()=>{
  const s=await source(),rough=builder.communalAtrium(t),built=(builder.communalAtrium as any)(t,undefined,s);
  const triangleCount=(r:T.Object3D)=>meshes(r).reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0);
  expect(triangleCount(built)).not.toBe(triangleCount(rough));
  // The seven-pad replacement has 1396 triangles within the unchanged 1500 cap.
  expect(built.userData.authoredGardenTriangles).toBe(1396);
  const imported=meshes(built).filter(m=>!m.geometry.attributes.uv);expect(imported).toHaveLength(5);
  expect(triangleCount(s)).toBe(1396);
  expect(imported.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0)).toBe(2*triangleCount(s));
  const bounds=new T.Box3();for(const m of imported)bounds.expandByObject(m,true);
  expect(bounds.min.x*32).toBeCloseTo(480);expect(bounds.max.x*32).toBeCloseTo(698);expect(bounds.min.z*32).toBeCloseTo(294);expect(bounds.max.z*32).toBeCloseTo(400);expect(bounds.min.y).toBeCloseTo(0);expect(bounds.max.y*32).toBeLessThan(93.909111);
  expect(new Set(meshes(built).map(m=>m.material)).size).toBe(8);
  expect(meshes(built).length).toBeLessThanOrEqual(11);
  for(const m of meshes(built)){expect(m.castShadow&&m.receiveShadow).toBe(true);expect((m.material as T.Material).userData.actorMaterial).toBe(true);expect(Object.values(MAT)).not.toContain(m.material);}
  disposeModel(rough);disposeModel(built);
 });
 it('preserves exported split normals and indexed triangles in fallback data',async()=>{
  const donor=await source();
  const compare=(rows:typeof gardenTrees)=>{
   expect(rows).toHaveLength(17);
   for(const row of rows){
    const mesh=donor.getObjectByName(row.name) as T.Mesh;expect(mesh).toBeInstanceOf(T.Mesh);
    expect(row.positions).toEqual(Array.from(mesh.geometry.attributes.position.array));
    expect(row.normals).toEqual(Array.from(mesh.geometry.attributes.normal.array));
    expect(row.indices).toEqual(Array.from(mesh.geometry.index!.array));
   }
  };
  compare(gardenTrees);
  const corrupted=structuredClone(gardenTrees);corrupted[0].normals[0]+=0.25;
  expect(()=>compare(corrupted)).toThrow();disposeModel(donor);
 });
 it.each(['ca_leaf','ca_irrigation'])('retains identical loaded and fallback %s geometry at both garden reservations',async role=>{
  const donor=await source(),fallback=builder.communalAtrium(t),loaded=builder.communalAtrium(t,undefined,donor);
  const foliage=(root:T.Group)=>meshes(root).filter(m=>(m.material as T.Material).name===role).flatMap(m=>{
   const p=m.geometry.attributes.position;
   return Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(3)).join(','));
  }).sort();
  const actual=foliage(fallback);expect(actual.length).toBeGreaterThan(1000);expect(actual).toEqual(foliage(loaded));
  disposeModel(fallback);disposeModel(loaded);disposeModel(donor);
 });
 it('freezes the existing loading gate for garden only',()=>{const get=Object.getOwnPropertyDescriptor(DepthRenderer.prototype,'roomLoading')!.get!;for(const state of ['loading','ready','fallback','disposed'])expect(get.call({communalGarden:{state}})).toBe(state==='loading');});
});
