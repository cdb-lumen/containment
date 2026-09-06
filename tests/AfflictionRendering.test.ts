import {beforeAll,describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from './loadModels';
import {alien,freezeCorpse,disposeModel,collapseCorpse} from '../src/render/models';
import {ActorPool} from '../src/render/ActorPool';
beforeAll(loadModels);
const off={chilled:false,burning:false,poisoned:false,frozen:false,chillStacks:0};
const all={chilled:true,burning:true,poisoned:true,frozen:true,chillStacks:3};
const names=['status-burning','status-chill','status-frozen','status-poison'];
const pose=(m:ReturnType<typeof alien>)=>{const result:string[]=[];m.root.traverse(o=>{if(o instanceof T.Bone)result.push(o.quaternion.toArray().join());});return result;};
describe('persistent actor afflictions',()=>{
 it('shows independent simultaneous cues, follows the actor, and expires immediately',()=>{
  const m=alien('brute');m.setAffliction?.(all);m.animate(1,1,0);
  for(const name of names)expect(m.root.getObjectByName(name)?.visible).toBe(true);
  const fire=m.root.getObjectByName('status-burning')!;const before=fire.getWorldPosition(new T.Vector3());m.root.position.x=9;
  expect(fire.getWorldPosition(new T.Vector3()).x-before.x).toBeCloseTo(9);
  m.setAffliction?.({...all,burning:false});expect(fire.visible).toBe(false);expect(m.root.getObjectByName('status-frozen')?.visible).toBe(true);
  m.setAffliction?.(off);for(const name of names)expect(m.root.getObjectByName(name)?.visible).toBe(false);disposeModel(m.root);
 });
 it('shows chill buildup without inferring freeze and accepts legacy status objects',()=>{
  const m=alien('crawler');m.setAffliction?.({chilled:true,burning:false});
  const ring=m.root.getObjectByName('status-chill') as T.Mesh;expect(ring?.visible).toBe(true);const first=ring.geometry.drawRange.count;
  m.setAffliction?.({...off,chilled:true,chillStacks:3});expect(ring.geometry.drawRange.count).toBeGreaterThan(first);expect(m.root.getObjectByName('status-frozen')?.visible).toBe(false);disposeModel(m.root);
 });
 it('freezes living animation only from authoritative frozen, then thaws',()=>{
  const m=alien('brute');m.animate(0,1,0);m.animate(.05,1,0);m.setAffliction?.(all);m.animate(.1,1,0);const frozen=pose(m);m.animate(.15,1,0);expect(pose(m)).toEqual(frozen);
  m.setAffliction?.({...all,frozen:false});m.animate(.2,1,0);expect(pose(m)).not.toEqual(frozen);disposeModel(m.root);
 });
 it('pauses effects on repeated presentation time and reuses a fixed geometry budget',()=>{
  const m=alien('brute');m.setAffliction?.(all);m.animate(0,1,0);m.animate(.05,1,0);
  const effect=m.root.getObjectByName('status-burning')!;const scale=effect.scale.toArray();m.animate(.05,1,0);expect(effect.scale.toArray()).toEqual(scale);
  const resources=new Set<T.BufferGeometry>();m.root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments)resources.add(o.geometry);});
  for(let i=0;i<100;i++){m.setAffliction?.(i%2?all:off);m.animate(.05+i*.01,1,0);}
  m.root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments)expect(resources.has(o.geometry)).toBe(true);});disposeModel(m.root);
 });
 it('clears dead actors and pool reuse without retaining frozen bones',()=>{
  const pool=new ActorPool(),m=pool.take('brute');m.setAffliction?.(all);freezeCorpse(m);
  for(const name of names)expect(m.root.getObjectByName(name)?.visible).toBe(false);
  m.setAffliction?.(all);for(const name of names)expect(m.root.getObjectByName(name)?.visible).toBe(false);
  pool.release(m);const reused=pool.take('brute');expect(reused).toBe(m);for(const name of names)expect(m.root.getObjectByName(name)?.visible).toBe(false);
  reused.animate(0,1,0);reused.animate(.05,1,0);const before=pose(reused);reused.animate(.1,1,0);expect(pose(reused)).not.toEqual(before);pool.release(reused);pool.dispose();
 });
 it('disposes all owned cue materials and geometries including the frozen lines',()=>{
  const m=alien('crawler');m.setAffliction?.(all);const spies=[];
  for(const name of names){const cue=m.root.getObjectByName(name) as T.Mesh;spies.push(vi.spyOn(cue.geometry,'dispose'),vi.spyOn(cue.material as T.Material,'dispose'));}
  disposeModel(m.root);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
 it('does not bake status geometry into collapsed corpses',()=>{
  const m=alien('crawler');m.setAffliction?.(all);const cage=m.root.getObjectByName('status-frozen') as T.LineSegments;const dispose=vi.spyOn(cage.geometry,'dispose');collapseCorpse(m);expect(dispose).toHaveBeenCalledTimes(1);expect(m.root.getObjectByName('status-burning')).toBeUndefined();
  m.root.traverse(o=>{if(o instanceof T.Mesh)expect(o.material).not.toBeInstanceOf(T.MeshBasicMaterial);});disposeModel(m.root);
 });
});
