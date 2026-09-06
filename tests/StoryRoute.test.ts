import {describe,it,expect} from 'vitest';
import {generateRun,createRun,clearRoom,finishReward,enterRoom,isValidRunState} from '../src/game/roguelike/run';
import {DepthGame} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {createEncounterPlan} from '../src/game/waves/EncounterDirector';

const ids='awakening-bay,passenger-vault,residential-gallery,communal-atrium,crew-checkpoint,armory,freight-hold,breached-loading-bay,relay-racks,transmission-chamber,diagnostic-gallery,safety-interlock-station,coolant-plant,service-shaft-landing,infested-workshop,swarm-junction,shielding-gate,containment-annulus,manual-control-chamber,overload-floor'.split(',');
function clear(game:DepthGame){
 for(let i=0;i<2600&&game.status==='playing';i++){
  for(const e of game.enemies.snapshot.enemies)game.damage(e.id,100000);
  game.update(50);
 }
}
function reward(game:DepthGame){const offers=expeditionRewardOffers(game.expedition);if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();}

describe('authored story campaign',()=>{
 it('paces ordinary assaults differently from the two extended holdouts',()=>{
  const graph=generateRun(42),plan=(depth:number)=>createEncounterPlan({seed:42,node:graph.nodes[depth],breachIds:['a']});
  expect(plan(8).schedule.at(-1)!.atMs).toBeLessThan(12000);
  for(const depth of [9,19])expect(plan(depth).schedule.at(-1)!.atMs).toBeGreaterThan(30000);
  expect(plan(19).kind).not.toBe('boss');
 });
 it('shows concise essential status and removes the facility escape story from the active UI',async()=>{
  const {readFileSync}=await import('node:fs');const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  expect(source).not.toMatch(/Twelve rooms below|lift carries you toward daylight/);
  expect(source).toContain('id="destroy-ship"');expect(source).toContain('game.authorizeDestruction()');
  expect(source).toContain('game.storyStatus');expect(source).toContain('game.skipStory()');
 });
 it('keeps modern enemy behavior and bounded encounter sizes throughout v3',async()=>{
  const {progressionFor}=await import('../src/game/roguelike/progression');
  for(const node of generateRun(42).nodes){
   const balance=progressionFor(node),plan=createEncounterPlan({seed:42,node,breachIds:['a']});
   expect(balance.specials).toBe(true);expect(balance.health).toBeLessThan(1.8);
   expect(plan.totalSpawns).toBeLessThanOrEqual([9,19].includes(node.depth)?48:31);
  }
 });
 it('dismisses only optional presentation and restores it for the next authored beat',()=>{
  const g=new DepthGame();g.newRun(137);expect(g.storyPresentation).toBeTruthy();
  const status=g.storyStatus;g.skipStory();expect(g.storyPresentation).toBeUndefined();expect(g.storyStatus).toBe(status);
  clear(g);reward(g);g.route(g.node.next[0]);clear(g);reward(g);g.route(g.node.next[0]);
  expect(g.storyPresentation).toBeTruthy();
 });
 it('places the warden and carrier matron at the authored elite rooms',()=>{
  const g=new DepthGame();g.newRun(137);
  for(let depth=0;depth<=15;depth++){
   if(depth===5||depth===15){
    for(let i=0;i<30;i++)g.update(50);
    const champion=g.enemies.snapshot.enemies.find(e=>e.champion);
    expect(champion?.champion).toBe(depth===5?'warden':'matron');
    expect(champion?.type).toBe(depth===5?'brute':'carrier');
   }
   clear(g);if(depth<15){reward(g);g.route(g.node.next[0]);}
  }
 });
 it('visits exactly twenty rooms in fixed milestone order, across seeds',()=>{
  for(const seed of [0,42,1729,0xffffffff]){
   const graph=generateRun(seed);expect(graph.nodes.map(n=>n.templateId)).toEqual(ids);
   expect(graph.nodes).toHaveLength(20);
   expect(graph.nodes.every((n,i)=>n.next.join() === (graph.nodes[i+1]?.id??''))).toBe(true);
   expect(graph.nodes.every(n=>createEncounterPlan({seed,node:n,breachIds:['a','b']}).totalSpawns>0)).toBe(true);
  }
 });
 it('publishes immutable room names, ten environments and objectives without dialogue requirements',async()=>{
  const {ROOM_STORY_ROUTE}=await import('../src/game/roguelike/storyRooms');
  expect(ROOM_STORY_ROUTE.map(r=>r.templateId)).toEqual(ids);
  expect(new Set(ROOM_STORY_ROUTE.map(r=>r.environment)).size).toBe(10);
  expect(Object.isFrozen(ROOM_STORY_ROUTE)).toBe(true);
  for(const r of ROOM_STORY_ROUTE){expect(Object.isFrozen(r)).toBe(true);expect(r.name.length).toBeGreaterThan(3);expect(r.objective.length).toBeGreaterThan(8);}
 });
 it('plays every room, requires a separate fatal authorization, and ends without escape',()=>{
  const saved=new Map<string,string>();const storage={getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>{saved.set(k,v);},removeItem:(k:string)=>{saved.delete(k);}};
  const effects:string[]=[];const g=new DepthGame(e=>effects.push(e.type),storage);g.newRun(137);
  expect(g.status).toBe('playing');expect(g.combat.snapshot.weaponId).toBe('shotgun');
  for(let depth=0;depth<20;depth++){
   expect(g.node.templateId).toBe(ids[depth]);expect(g.status).toBe('playing');
   g.skipStory();expect(g.status).toBe('playing');
   expect(g.authorizeDestruction()).toBe(false);
   if(depth===19)effects.length=0;
   clear(g);expect(g.combat.snapshot.dead).toBe(depth===19);
   if(depth===19){expect(g.status).toBe('complete');expect(effects).toContain('explosion');break;}
   expect(g.status).toBe('reward');reward(g);expect(g.status).toBe('route');
   if(depth===18){
    const before=g.expedition;g.skipStory();g.route(g.node.next[0]);g.update(5000);
    expect(g.expedition).toEqual(before);expect(g.status).toBe('route');
    const restored=new DepthGame(()=>{},storage);expect(restored.continueRun()).toBe(true);
    restored.route(restored.node.next[0]);expect(restored.node.templateId).toBe('manual-control-chamber');
    expect(g.authorizeDestruction()).toBe(true);
   }else g.route(g.node.next[0]);
  }
  expect(g.expedition.run.completedNodeIds).toHaveLength(20);expect(g.canContinue).toBe(false);
  expect(g.storyStatus).toContain('ALL ABOARD LOST');expect(g.storyStatus).toContain('NEW EARTH WARNED');
  const completed=g.expedition;g.skipStory();g.authorizeDestruction();g.route('escape');g.update(5000);expect(g.expedition).toEqual(completed);
  g.newRun(137);expect(g.node.templateId).toBe(ids[0]);expect(g.expedition.run.completedNodeIds).toHaveLength(0);expect(g.status).toBe('playing');
 });
 it('rejects skipping a milestone in persisted paths and retains old graph lengths',()=>{
  expect(generateRun(42,1).nodes.find(n=>n.id===generateRun(42,1).bossId)?.depth).toBe(5);
  expect(generateRun(42,2).nodes.find(n=>n.id===generateRun(42,2).bossId)?.depth).toBe(11);
  const g=generateRun(42);let r=finishReward(clearRoom(createRun(42)));
  expect(()=>enterRoom(r,g.nodes[2].id)).toThrow();r=enterRoom(r,g.nodes[1].id);expect(isValidRunState(r)).toBe(true);
 });
});
