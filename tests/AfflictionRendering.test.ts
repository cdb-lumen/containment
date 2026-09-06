import {beforeAll,describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from './loadModels';
import {alien,freezeCorpse,disposeModel,collapseCorpse} from '../src/render/models';
import {ActorPool} from '../src/render/ActorPool';
import {AfflictionBatches} from '../src/render/afflictions';
beforeAll(loadModels);
const off={chilled:false,burning:false,poisoned:false,frozen:false,chillStacks:0};
const all={chilled:true,burning:true,poisoned:true,frozen:true,chillStacks:3};
const pose=(m:ReturnType<typeof alien>)=>{const result:string[]=[];m.root.traverse(o=>{if(o instanceof T.Bone)result.push(o.quaternion.toArray().join());});return result;};
describe('persistent actor afflictions',()=>{
 it('submits independent simultaneous cues and expires immediately',()=>{
  const m=alien('brute'),batch=new AfflictionBatches(),camera=new T.PerspectiveCamera();m.setAffliction?.(all);batch.update([m.root],camera,1);
  expect(batch.counts).toEqual({fire:3,poison:2,drops:4,ice:10,embers:4});m.setAffliction?.({...all,burning:false});batch.update([m.root],camera,1);expect(batch.counts.fire).toBe(0);expect(batch.counts.ice).toBe(10);
  m.setAffliction?.(off);batch.update([m.root],camera,1);expect(Object.values(batch.counts).every(n=>n===0)).toBe(true);batch.dispose();disposeModel(m.root);
 });
 it('accumulates chill without inferring frozen and accepts legacy status objects',()=>{
  const m=alien('crawler'),batch=new AfflictionBatches(),camera=new T.PerspectiveCamera();m.setAffliction?.({chilled:true,burning:false});batch.update([m.root],camera,0);expect(batch.counts.ice).toBe(2);
  m.setAffliction?.({...off,chilled:true,chillStacks:3});batch.update([m.root],camera,0);expect(batch.counts.ice).toBe(6);expect(m.root.userData.affliction.status.frozen).toBe(false);batch.dispose();disposeModel(m.root);
 });
 it('freezes living animation only from authoritative frozen, then thaws',()=>{
  const m=alien('brute');m.animate(0,1,0);m.animate(.05,1,0);m.setAffliction?.(all);m.animate(.1,1,0);const frozen=pose(m);m.animate(.15,1,0);expect(pose(m)).toEqual(frozen);m.setAffliction?.({...all,frozen:false});m.animate(.2,1,0);expect(pose(m)).not.toEqual(frozen);disposeModel(m.root);
 });
 it('pauses batches exactly and keeps actor geometry unchanged',()=>{
  const m=alien('brute'),batch=new AfflictionBatches(),camera=new T.PerspectiveCamera();const count=m.root.children.length;m.setAffliction?.(all);batch.update([m.root],camera,.5);
  const matrices=batch.root.children.map(o=>Array.from((o as T.InstancedMesh).instanceMatrix.array));batch.update([m.root],camera,.5);expect(batch.root.children.map(o=>Array.from((o as T.InstancedMesh).instanceMatrix.array))).toEqual(matrices);expect(m.root.children.length).toBe(count);batch.dispose();disposeModel(m.root);
 });
 it('clears dead actors and pool reuse without retaining frozen bones',()=>{
  const pool=new ActorPool(),m=pool.take('brute');m.setAffliction?.(all);freezeCorpse(m);expect(m.root.userData.affliction.status).toEqual(off);m.setAffliction?.(all);expect(m.root.userData.affliction.status).toEqual(off);
  pool.release(m);const reused=pool.take('brute');expect(reused).toBe(m);expect(m.root.userData.affliction.status).toEqual(off);reused.animate(0,1,0);reused.animate(.05,1,0);const before=pose(reused);reused.animate(.1,1,0);expect(pose(reused)).not.toEqual(before);pool.release(reused);pool.dispose();
 });
 it('disposes renderer-owned resources once',()=>{const batch=new AfflictionBatches();const spies=batch.root.children.flatMap(o=>{const m=o as T.Mesh;return[vi.spyOn(m.geometry,'dispose'),vi.spyOn(m.material as T.Material,'dispose')];});batch.dispose();for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);});
 it('does not bake status geometry into collapsed corpses',()=>{const m=alien('crawler');m.setAffliction?.(all);collapseCorpse(m);expect(m.root.userData.affliction.status).toEqual(off);m.root.traverse(o=>{if(o instanceof T.Mesh)expect(o.material).not.toBeInstanceOf(T.MeshBasicMaterial);});disposeModel(m.root);});
});
