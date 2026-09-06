import {it,expect} from 'vitest';
import * as T from 'three';
import {afflictionEffects,AfflictionBatches} from '../src/render/afflictions';

const sample=(mesh:T.InstancedMesh,index=0)=>{const m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();mesh.getMatrixAt(index,m);m.decompose(p,q,s);return{p,q,s};};
it('replaces actor-height sheets with bounded smaller overlapping alpha sprites',()=>{
 const batch=new AfflictionBatches(undefined,2),camera=new T.Camera();camera.rotation.set(-.8,.2,0);camera.updateMatrixWorld();
 const roots=Array.from({length:12},()=>{const root=new T.Group();afflictionEffects(root,2,1).set({burning:true,poisoned:true,chilled:true,chillStacks:3});return root;});
 batch.update(roots,camera,1);
 const [fire,poison,ice,,embers]=batch.root.children as T.InstancedMesh[];
 expect(batch.counts).toEqual({fire:12,poison:8,ice:12,drops:8,embers:12});
 for(const mesh of [fire,poison])for(let i=0;i<mesh.count;i++){
  const {s,q}=sample(mesh,i);expect(s.x).toBeLessThanOrEqual(.6);expect(s.y).toBeLessThanOrEqual(.8);
  expect(Math.abs(q.dot(camera.quaternion))).toBeCloseTo(1);expect(mesh.geometry.type).toBe('PlaneGeometry');
  const alpha=mesh.geometry.getAttribute('particleAlpha').getX(i);expect(alpha).toBeGreaterThanOrEqual(0);expect(alpha).toBeLessThanOrEqual(1);
 }
 expect(embers.geometry.type).toBe('PlaneGeometry');expect(batch.root.children).toHaveLength(5);
 for(const mesh of batch.root.children as T.InstancedMesh[]){
  expect(mesh.count).toBeLessThanOrEqual(mesh.instanceMatrix.count);
  for(const name of ['atlas','particleAlpha']){const attribute=mesh.geometry.getAttribute(name);if(attribute)expect(mesh.count).toBeLessThanOrEqual(attribute.count);}
 }
 // Sum full card rectangles, a conservative coverage budget independent of alpha.
 for(const [mesh,oldArea] of [[fire,2*3*.68*1.2],[poison,2*2*1.3*1.35]] as const){
  let area=0;for(let i=0;i<mesh.count;i++){const {s}=sample(mesh,i);area+=s.x*s.y;}
  expect(area).toBeLessThan(oldArea);
 }
 expect(ice.geometry.type).toBe('OctahedronGeometry');batch.dispose();
});
it('rises and fades at material-specific rates without wall-clock drift or stale pool state',()=>{
 const batch=new AfflictionBatches(undefined,1),root=new T.Group(),state=afflictionEffects(root,2,1),camera=new T.Camera();
 state.set({burning:true,poisoned:true,chilled:false});batch.update([root],camera,.2);
 const [fire,poison,,,embers]=batch.root.children as T.InstancedMesh[];
 const before=[fire,poison,embers].map(m=>sample(m).p.clone());
 batch.update([root],camera,.21);
 const rise=[fire,poison,embers].map((m,i)=>sample(m).p.y-before[i].y);
 expect(rise.every(n=>n>0)).toBe(true);expect(rise[2]).toBeGreaterThan(rise[0]);expect(rise[0]).toBeGreaterThan(rise[1]);
 const snapshot=[fire,poison,embers].map(m=>Array.from(m.instanceMatrix.array));batch.update([root],camera,.21);
 expect([fire,poison,embers].map(m=>Array.from(m.instanceMatrix.array))).toEqual(snapshot);
 const alphas=Array.from(fire.geometry.getAttribute('particleAlpha').array);expect(new Set(alphas.slice(0,6)).size).toBeGreaterThan(2);
 state.reset();batch.update([root],camera,2);expect(Object.values(batch.counts).every(n=>n===0)).toBe(true);batch.dispose();
});
