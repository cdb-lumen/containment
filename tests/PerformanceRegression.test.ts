import {beforeAll,describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from './loadModels';
import {marine,freezeCorpse,disposeModel} from '../src/render/models';
import {ActorPool} from '../src/render/ActorPool';
import {FramePacer,FrameDiagnostics} from '../src/render/FrameBudget';
import {BuildEventResolver,resolveBuildEvent,createBuildResolutionState,BUILD_LIMITS,type BuildEvent} from '../src/game/roguelike/builds';
import {MUTATION_IDS} from '../src/game/roguelike/mutationCatalog';
beforeAll(loadModels);
describe('live event ledger',()=>{
 it('matches the pure reducer for mixed combat events and keeps snapshots isolated',()=>{
  const live=new BuildEventResolver(),build={mutations:MUTATION_IDS};let state=createBuildResolutionState();
  const resources={weapon:'shotgun' as const,health:50,maxHealth:100,armor:25,maxArmor:100,magazine:3,capacity:8,reserve:40,maxReserve:100000};
  for(let i=0;i<160;i++){
   const envelope={id:`event-${i}`,cause:{chainId:`chain-${Math.floor(i/8)}`,depth:i%4}};
   const body=([{type:'reload',weapon:'shotgun',roundsLoaded:5},{type:'shot',weapon:'shotgun',magazineBefore:1},{type:'hit',weapon:'shotgun',targetId:'1',direction:{x:1,y:0},chilledStacks:2},{type:'wall-hit',targetId:'1',impulse:120},{type:'body-collision',targetId:'2',direction:{x:1,y:1},impulse:80},{type:'kill',targetId:'2',source:'direct',resources},{type:'pickup',kind:'ammo',resources},{type:'heal',amount:20,resources}] as const)[i%8];
   const event={...envelope,...body} as BuildEvent,pure=resolveBuildEvent(build,state,event),result=live.resolve(build,event);expect(result.commands).toEqual(pure.commands);expect(result.rejected).toBe(pure.rejected);state=pure.state;expect(live.snapshot).toEqual(state);expect(live.resolve(build,event).rejected).toBe('duplicate');
  }
  const external=live.snapshot;(external.seenEventIds as string[]).length=0;expect(live.snapshot.seenEventIds).toHaveLength(160);live.reset();expect(live.snapshot).toEqual(createBuildResolutionState());
 });
 it('retains validation, depth, chain and encounter limits with constant-time history checks',()=>{
  const r=new BuildEventResolver(),b={mutations:[]},hit=(id:number,chain=`s-${id}`,depth=0):BuildEvent=>({id:`e-${id}`,cause:{chainId:chain,depth},type:'hit',weapon:'rifle',targetId:'1',direction:{x:1,y:0},chilledStacks:0});
  expect(r.resolve(b,{...hit(0),type:'invalid'} as unknown as BuildEvent).rejected).toBe('invalid-event');expect(r.resolve(b,hit(0,'deep',4)).rejected).toBe('depth-limit');
  for(let i=0;i<32;i++)expect(r.resolve(b,hit(i,'same')).rejected).toBeUndefined();expect(r.resolve(b,hit(33,'same')).rejected).toBe('chain-limit');
  for(let i=32;i<BUILD_LIMITS.maxEncounterEvents;i++)r.resolve(b,hit(i));expect(r.resolve(b,hit(2048)).rejected).toBe('encounter-limit');
 });
});
describe('prepared render resources',()=>{
 it('shares skeletons and materials within a marine without sharing animation between actors',()=>{
  const a=marine(),b=marine(),skeletons=new Set<T.Skeleton>(),materials=new Set<T.Material>();a.root.traverse(o=>{if(o instanceof T.SkinnedMesh){skeletons.add(o.skeleton);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});expect(skeletons.size).toBe(1);expect(materials.size).toBe(4);
  b.root.traverse(o=>{if(o instanceof T.SkinnedMesh){expect(skeletons.has(o.skeleton)).toBe(false);expect(skeletons.values().next().value!.bones[0]).not.toBe(o.skeleton.bones[0]);}});
  const skeleton=[...skeletons][0],dispose=vi.spyOn(skeleton,'dispose');disposeModel(a.root);expect(dispose).toHaveBeenCalledTimes(1);disposeModel(b.root);
 });
 it('revives pooled corpses with moving bones and clean effects while keeping their GPU resources',()=>{
  const pool=new ActorPool(),first=pool.take('brute',true);first.prepare?.();first.animate(0,1,0);first.animate(.05,1,0);const mesh=first.root.getObjectByProperty('isSkinnedMesh',true) as T.SkinnedMesh,geometry=mesh.geometry,skeleton=mesh.skeleton;
  first.setAffliction?.({chilled:true,burning:true});freezeCorpse(first);first.body.rotation.z=2;pool.release(first);const reused=pool.take('brute',true);expect(reused).toBe(first);expect(mesh.geometry).toBe(geometry);expect(mesh.skeleton).toBe(skeleton);expect(reused.body.rotation.z).toBe(0);reused.root.traverse(o=>{if(o instanceof T.Bone)expect(o.matrixAutoUpdate).toBe(true);});
  reused.animate(0,1,0);reused.animate(.05,1,0);const pose=skeleton.bones.map(b=>b.quaternion.toArray().join());reused.animate(.10,1,0);expect(skeleton.bones.some((b,i)=>b.quaternion.toArray().join()!==pose[i])).toBe(true);pool.release(reused);pool.dispose();
 });
});
describe('frame pacing',()=>{
 it('renders approximately 60 times per second on 60, 120 and 144 Hz displays without losing elapsed time',()=>{
  for(const hz of [60,120,144]){const p=new FramePacer();let frames=0,time=0;for(let i=0;i<hz*10;i++){const dt=p.sample(i*1000/hz);if(dt!==null){frames++;time+=dt;}}expect(frames).toBeGreaterThanOrEqual(599);expect(frames).toBeLessThanOrEqual(601);expect(time).toBeCloseTo(10,1);p.reset();expect(p.sample(50000)).toBe(1/60);}
 });
 it('paces after stalls and bounds diagnostic storage',()=>{
  const pacer=new FramePacer();pacer.sample(0);pacer.sample(50);expect(pacer.sample(58)).toBeNull();
  const d=new FrameDiagnostics();for(let i=0;i<200;i++)d.record(i===199?100:16.7,2,4);expect(d.snapshot.samples).toBe(120);expect(d.snapshot.stallsOver50ms).toBe(1);
 });
});
