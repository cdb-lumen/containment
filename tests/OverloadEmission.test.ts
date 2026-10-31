import {it,expect,vi} from 'vitest';
import * as T from 'three';
import {OverloadEmission,OVERLOAD_EMISSION_MIN,OVERLOAD_EMISSION_MAX} from '../src/render/OverloadEmission';
import {createOverloadDraft,batchOverloadDraft} from '../src/render/OverloadDraft';
import {appendEnvironment} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {disposeModel,MAT} from '../src/render/meshParts';
import {DepthGame} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {EncounterDirector} from '../src/game/waves/EncounterDirector';
import {generateRun} from '../src/game/roguelike/run';
const materials=(root:T.Object3D)=>{const result=new Set<T.MeshStandardMaterial>();root.traverse(o=>{if(o instanceof T.Mesh)result.add(o.material as T.MeshStandardMaterial);});return [...result];};
const column=(root:T.Object3D)=>materials(root).filter(m=>m.userData.overloadColumn===true);
const state={phase:'combat' as const,dispatched:48,totalSpawns:48,playing:true};
it('observes the real authorized final holdout without advancing it or conflating defeat with completion',()=>{
 const game=new DepthGame();game.newRun(137);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
 for(let depth=0;depth<19;depth++){
  expect(game.overloadVisualState).toBeUndefined();game['clearRoom']();
  const offers=expeditionRewardOffers(game.expedition);if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();
  if(depth<18)game.route(game.node.next[0]);
 }
 expect(game.node.templateId).toBe('manual-control-chamber');expect(game.overloadVisualState).toBeUndefined();
 expect(game.authorizeDestruction()).toBe(true);expect(game.overloadVisualState).toEqual({phase:'combat',dispatched:0,totalSpawns:48,playing:true});
 const before=JSON.stringify({run:game.expedition,resources:game.combat.snapshot,elapsed:game.elapsed});
 for(let i=0;i<10;i++)expect(Object.isFrozen(game.overloadVisualState)).toBe(true);
 expect(JSON.stringify({run:game.expedition,resources:game.combat.snapshot,elapsed:game.elapsed})).toBe(before);
 for(let i=0;i<20;i++)game.update(50);expect(game.overloadVisualState!.dispatched).toBeGreaterThan(0);
 game.pause();const paused=game.overloadVisualState;game.update(5000);expect(game.overloadVisualState).toEqual(paused);expect(paused!.playing).toBe(false);
 game.resume();game.hurt(100000);expect(game.overloadVisualState!.phase).toBe('dead');expect(game.overloadVisualState!.playing).toBe(false);expect(game.status).toBe('dead');
});
it('follows actual capacity-limited dispatch rather than elapsed time, survivors or an invented completion clock',()=>{
 const root=createOverloadDraft(),material=column(root)[0],emission=new OverloadEmission();emission.bind(root,'overload-floor');
 const director=new EncounterDirector({seed:137,node:generateRun(137,3).nodes[19],breachIds:['a']});director.start();
 for(let i=0;i<10;i++){director.update(100000,director.snapshot.concurrentCap);emission.update({...director.snapshot,playing:true},.05);}
 expect(director.snapshot.dispatched).toBe(0);expect(material.emissiveIntensity).toBe(OVERLOAD_EMISSION_MIN);
 while(director.snapshot.dispatched<director.snapshot.totalSpawns)director.update(100000,0);
 director.update(100000,1);expect(director.phase).toBe('combat'); // Survivors still block completion.
 let previous=material.emissiveIntensity;
 for(let i=0;i<100;i++){emission.update({...director.snapshot,playing:true},.05);expect(material.emissiveIntensity).toBeGreaterThanOrEqual(previous);expect(material.emissiveIntensity).toBeLessThanOrEqual(OVERLOAD_EMISSION_MAX);expect(material.emissiveIntensity-previous).toBeLessThan(.05);previous=material.emissiveIntensity;}
 expect(material.emissiveIntensity).toBeCloseTo(OVERLOAD_EMISSION_MAX,6);
 director.update(0,0);expect(director.phase).toBe('complete');emission.update({...director.snapshot,playing:false},100);expect(material.emissiveIntensity).toBe(previous);
 emission.reset();disposeModel(root);
});
it('freezes invalid/paused/terminal updates, clamps malformed progress and never mutates unrelated materials',()=>{
 const root=createOverloadDraft(),emission=new OverloadEmission(),material=column(root)[0],others=materials(root).filter(m=>m!==material),before=others.map(m=>m.emissiveIntensity),shared=MAT.steel.emissiveIntensity;
 emission.bind(root,'other-room');emission.update(state,100);expect(material.emissiveIntensity).toBe(OVERLOAD_EMISSION_MIN);
 emission.bind(root,'overload-floor');emission.update(state,.05);const value=material.emissiveIntensity;
 for(const delta of [0,-1,NaN,Infinity])emission.update(state,delta);
 emission.update({...state,playing:false},.05);emission.update({...state,phase:'dead'},.05);emission.update({...state,phase:'complete'},.05);emission.update({...state,dispatched:NaN},.05);emission.update({...state,totalSpawns:0},.05);
 expect(material.emissiveIntensity).toBe(value);
 for(let i=0;i<100;i++)emission.update({...state,dispatched:100000},100000);
 expect(material.emissiveIntensity).toBeLessThanOrEqual(OVERLOAD_EMISSION_MAX);expect(material.emissiveIntensity).toBeLessThan(.5);
 expect(others.map(m=>m.emissiveIntensity)).toEqual(before);expect(MAT.steel.emissiveIntensity).toBe(shared);
 emission.reset();const stopped=material.emissiveIntensity;emission.update(state,.05);expect(material.emissiveIntensity).toBe(stopped);disposeModel(root);
});
it('binds the live owned material through both production batches and releases references over three visits',()=>{
 const emission=new OverloadEmission();
 for(let visit=0;visit<3;visit++){
  const raw=createOverloadDraft(),original=column(raw)[0],dispose=vi.spyOn(original,'dispose');
  const world=new T.Group();appendEnvironment(world,batchOverloadDraft(raw));const floorMaterial=new T.MeshStandardMaterial();
  (DepthRenderer.prototype as unknown as {bakeWorld:()=>void}).bakeWorld.call({world,floorMaterial});
  expect(column(world)).toEqual([original]);expect(world.userData.lightFixtures??[]).toEqual([]);
  emission.bind(world,'overload-floor');expect(original.emissiveIntensity).toBe(OVERLOAD_EMISSION_MIN);emission.update(state,.05);expect(original.emissiveIntensity).toBeGreaterThan(OVERLOAD_EMISSION_MIN);
  emission.reset();const value=original.emissiveIntensity;disposeModel(world);emission.update(state,.05);expect(original.emissiveIntensity).toBe(value);expect(dispose).toHaveBeenCalledTimes(1);floorMaterial.dispose();
 }
});
