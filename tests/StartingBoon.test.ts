import {describe,it,expect} from 'vitest';
import {DepthGame,type GameEffect} from '../src/DepthGame';
import {claimExpeditionMutation,completeExpeditionRoom,createExpedition,expeditionRewardOffers,rerollExpedition} from '../src/game/roguelike/expedition';
import {isValidRunState} from '../src/game/roguelike/run';
import {prerequisitesMet} from '../src/game/roguelike/boonPaths';
import {MUTATION_IDS} from '../src/game/roguelike/mutationCatalog';

const choose=(g:DepthGame)=>{const id=expeditionRewardOffers(g.expedition)[0].id;g.chooseMutation(id);return id;};
describe('starting boon',()=>{
 it('offers three deterministic eligible boons before the first encounter',()=>{
  for(let seed=0;seed<32;seed++){
   const g=new DepthGame();g.newRun(seed);
   expect(g.status).toBe('reward');expect(g.expedition.run.phase).toBe('starting-boon');
   expect(g.expedition.run.completedNodeIds).toEqual([]);
   const offers=expeditionRewardOffers(g.expedition);
   expect(offers).toHaveLength(3);expect(new Set(offers.map(m=>m.id)).size).toBe(3);
   expect(offers.every(m=>prerequisitesMet(m,g.expedition.build))).toBe(true);
   expect(offers).toEqual(expeditionRewardOffers(createExpedition(seed,g.combat.getRunResources())));
  }
 });
 it('freezes combat, controls, resources and time until a valid choice, then starts the same room once',()=>{
  const effects:GameEffect[]=[],g=new DepthGame(e=>effects.push(e));g.newRun(137);
  const before=g.combat.getRunResources(),player={...g.player},node=g.node.id;
  for(let i=0;i<100;i++)g.update(50,{x:1,y:1,fire:true,angle:1,autoAim:true});
  g.hurt(10000);g.grenade();g.heal();g.reload();g.switchWeapon('rocket');g.pause();g.resume();g.route(g.node.next[0]);g.claimResources();
  expect(g.status).toBe('reward');expect(g.elapsed).toBe(0);expect(g.player).toEqual(player);
  expect(g.combat.getRunResources()).toEqual(before);expect(g.enemies.activeCount).toBe(0);
  expect(g.bullets).toEqual([]);expect(effects).toEqual([]);expect(g.reroll()).toBe(false);
  const invalid=MUTATION_IDS.find(id=>!expeditionRewardOffers(g.expedition).some(m=>m.id===id))!;
  expect(()=>g.chooseMutation(invalid)).toThrow('Mutation is not offered');expect(g.status).toBe('reward');
  const id=choose(g),revision=g.roomRevision;
  expect(g.status).toBe('playing');expect(g.expedition.run.phase).toBe('combat');expect(g.node.id).toBe(node);
  expect(g.combat.build.mutations).toEqual([id]);expect(g.expedition.run.completedNodeIds).toEqual([]);
  g.chooseMutation(id);expect(g.roomRevision).toBe(revision);expect(g.combat.build.mutations).toEqual([id]);
  g.update(50,{x:0,y:0,fire:true,angle:0,autoAim:false});expect(g.elapsed).toBeGreaterThan(0);
  expect(effects.some(e=>e.type==='shot')).toBe(true);
 });
 it('requires a fresh choice after death, completion, or returning to the menu',()=>{
  const g=new DepthGame();
  for(const status of ['dead','complete','menu'] as const){
   g.newRun(42);choose(g);g.status=status;g.newRun(42);
   expect(g.status).toBe('reward');expect(g.expedition.build.mutations).toEqual([]);expect(g.elapsed).toBe(0);
   choose(g);expect(g.combat.build.mutations).toHaveLength(1);
  }
 });
 it('keeps the first room reward separate and resets the initial draft roll',()=>{
  const g=new DepthGame();let e=createExpedition(42,{...g.combat.getRunResources(),credits:500});
  expect(()=>completeExpeditionRoom(e,e.resources)).toThrow();
  e=rerollExpedition(e);expect(e.run.draftRoll).toBe(1);
  const first=expeditionRewardOffers(e)[0].id;e=claimExpeditionMutation(e,first);
  expect(e.run.draftRoll).toBe(0);expect(()=>claimExpeditionMutation(e,first)).toThrow();
  e=completeExpeditionRoom(e,e.resources);expect(e.run.completedNodeIds).toHaveLength(1);
  const offers=expeditionRewardOffers(e);expect(offers).toHaveLength(3);expect(offers.some(m=>m.id===first)).toBe(false);
  e=claimExpeditionMutation(e,offers[0].id);expect(e.run.phase).toBe('route');expect(e.build.mutations).toHaveLength(2);
 });
 it('rejects a starting choice in a later room or a legacy run',()=>{
  const g=new DepthGame();g.newRun(42);const run=g.expedition.run;
  expect(isValidRunState(run)).toBe(true);
  expect(isValidRunState({...run,currentNodeId:g.node.next[0],completedNodeIds:[g.node.id]})).toBe(false);
  expect(isValidRunState({...run,version:2})).toBe(false);
 });
});
