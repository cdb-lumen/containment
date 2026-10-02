import {it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom} from './AuthoredRooms';
import {createOverloadDraft,batchOverloadDraft} from './OverloadDraft';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {disposeModel} from './meshParts';
import {appendEnvironment} from './ShipEnvironments';
import {DepthRenderer} from './DepthRenderer';
const reservations:Record<string,number[]>={
 'coolant-header':[480,540,340,410], 'power-bus':[660,720,340,410],
 'restraint-head':[565,635,480,540], 'induction-core':[570,630,365,465],
};
function vertices(root:T.Object3D){
 root.updateMatrixWorld(true);const result:T.Vector3[]=[];
 root.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++)result.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).multiplyScalar(32));}});
 return result;
}
function insideVoid(p:T.Vector3){const poly=ROOM_TEMPLATES['overload-floor'].voids![0];return poly.every((a,i)=>{const b=poly[(i+1)%poly.length];return (b.x-a.x)*(p.z-a.y)-(b.y-a.y)*(p.x-a.x)>=-.001;});}
function triangles(root:T.Object3D){let n=0;root.traverse(o=>{if(o instanceof T.Mesh)n+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;});return n;}
it('places distinct Room20 service heads instead of repeating radial clamps',()=>{
 const room=authoredRoom('overload-floor',ROOM_TEMPLATES['overload-floor'])!;
 expect(room.userData.overloadDraftRoles).toEqual(Object.keys(reservations));disposeModel(room);
});
it('fits every real head vertex in its layout reservation and supports it from the shaft floor',()=>{
 const root=createOverloadDraft();
 for(const [name,[x0,x1,z0,z1]] of Object.entries(reservations)){
  const points=vertices(root.getObjectByName(name)!);expect(points.length).toBeGreaterThan(100);
  const b=new T.Box3().setFromPoints(points);expect(b.min.y).toBeCloseTo(-160);expect(b.max.y).toBeGreaterThan(25);
  expect(points.every(p=>p.x>=x0-.001&&p.x<=x1+.001&&p.z>=z0-.001&&p.z<=z1+.001)).toBe(true);
 }
 expect(vertices(root).every(insideVoid)).toBe(true);disposeModel(root);
});
it('preserves actual bounds and triangle count through both batching stages and retires owned resources once',()=>{
 const raw=createOverloadDraft(),before=new T.Box3().setFromObject(raw),count=triangles(raw);
 const sources=new Map<T.BufferGeometry,number>();raw.traverse(o=>{if(o instanceof T.Mesh){sources.set(o.geometry,0);o.geometry.addEventListener('dispose',()=>sources.set(o.geometry,sources.get(o.geometry)!+1));}});
 const draft=batchOverloadDraft(raw);expect([...sources.values()].every(n=>n===1)).toBe(true);
 const intermediate=new Map<T.BufferGeometry,number>();for(const child of draft.children){const g=(child as T.Mesh).geometry;intermediate.set(g,0);g.addEventListener('dispose',()=>intermediate.set(g,intermediate.get(g)!+1));}
 expect(draft.children).toHaveLength(6);expect(triangles(draft)).toBe(count);
 const world=new T.Group();appendEnvironment(world,draft);
 const renderer={world,floorMaterial:new T.MeshStandardMaterial()};
 (DepthRenderer.prototype as unknown as {bakeWorld(this:typeof renderer):void}).bakeWorld.call(renderer);
 expect([...intermediate.values()].every(n=>n===1)).toBe(true);
 expect(world.children).toHaveLength(6);expect(triangles(world)).toBe(count);
 const after=new T.Box3().setFromObject(world);for(const key of ['min','max'] as const)expect(after[key].distanceTo(before[key])).toBeLessThan(.00001);
 expect(vertices(world).every(insideVoid)).toBe(true);
 const resources=new Map<T.BufferGeometry|T.Material,number>();world.traverse(o=>{if(o instanceof T.Mesh)for(const r of [o.geometry,o.material as T.Material])resources.set(r,0);});
 for(const r of resources.keys())r.addEventListener('dispose',()=>resources.set(r,resources.get(r)!+1));
 disposeModel(world);expect([...resources.values()].every(n=>n===1)).toBe(true);renderer.floorMaterial.dispose();
});
it('constructs segmented coil shoes, flanged coolant, guarded buswork and an attached restraint ram',()=>{
 const root=createOverloadDraft();
 for(const name of ['coil-shoes','coolant-flanges','bus-insulators','restraint-ram']){
  const part=root.getObjectByName(name);expect(part, name).toBeDefined();
  expect(vertices(part!).length).toBeGreaterThan(100);
 }
 const shoes=root.getObjectByName('coil-shoes')!;expect(shoes.children).toHaveLength(18);
 const ram=new T.Box3().setFromObject(root.getObjectByName('restraint-ram')!);
 expect(ram.min.z*32).toBeLessThanOrEqual(460);expect(ram.max.z*32).toBeGreaterThanOrEqual(510);
 expect(triangles(root)).toBeLessThan(24000);disposeModel(root);
});
it('retains canonical empty collision and all four breaches',()=>{
 const t=ROOM_TEMPLATES['overload-floor'];expect(t.obstacles).toEqual([]);expect(t.breaches).toHaveLength(4);
 expect(t.spawn).toEqual({x:140,y:440});expect(t.exit).toEqual({x:1060,y:440});
});
