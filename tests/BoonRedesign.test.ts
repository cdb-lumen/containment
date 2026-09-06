import {beforeAll,describe,expect,it} from 'vitest';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {MutationRuntime,type MutationTarget} from '../src/game/roguelike/MutationRuntime';
import {addMutation,deriveBuildStats,draftMutationOffers} from '../src/game/roguelike/builds';
import {MUTATION_CATALOG} from '../src/game/roguelike/mutationCatalog';
import type {MutationId} from '../src/game/roguelike/types';
import {alien,freezeCorpse,disposeModel} from '../src/render/models';
import {loadModels} from './loadModels';
beforeAll(loadModels);
function world(ids:MutationId[],visible=true,immovable=false){
 const combat=new CombatSystem();combat.setBuild({mutations:ids});
 const targets=[{id:1,x:30,y:0,radius:14,health:1000,maxHealth:1000,immovable},{id:2,x:90,y:0,radius:14,health:1000,maxHealth:1000}];
 const hits:Array<{id:number;amount:number}>=[],slows=new Map<number,number>();
 const runtime=new MutationRuntime(combat,{targets:()=>targets.filter(t=>t.health>0),player:()=>({x:0,y:0}),damage:(id,amount)=>{const t=targets.find(t=>t.id===id)!;hits.push({id,amount});t.health-=amount;return{applied:true,died:t.health<=0};},move:()=>({blocked:false}),moveCorpse:t=>({...t,blocked:false}),setSlow:(id,n)=>slows.set(id,n),canAffect:()=>visible});
 const hit=(shot:string,target:MutationTarget=targets[0])=>runtime.hit(shot,'rifle',{...target},{x:1,y:0});
 const advance=(ms:number)=>{for(let t=0;t<ms;t+=50)runtime.update(Math.min(50,ms-t));};
 return{combat,targets,runtime,hits,slows,hit,advance};
}
describe('build-defining choices',()=>{
 it('offers three distinct starters, then a real continuation for every path',()=>{
  const starters=['cryogenic','incendiary','breacher','hot-reload'];
  const continuations:Record<string,string[]>={cryogenic:['absolute-zero','shattershot','ice-lance','permafrost','frostbite','frost-armor','glacial-wake'],incendiary:['scavenger','combustion'],breacher:['chain-reaction','seismic-impact','heavy-pellets'],'hot-reload':['reactor-cascade','magnetic-feed','last-shell','rapid-cycle']};
  for(let seed=0;seed<128;seed++){
   expect(draftMutationOffers(seed,{mutations:[]}).every(m=>starters.includes(m.id))).toBe(true);
   for(const root of starters){const build={mutations:[root as MutationId]};for(const rare of [false,true]){const offers=draftMutationOffers(seed,build,rare);expect(offers.some(m=>continuations[root].includes(m.id)),`${root}/${seed}`).toBe(true);expect(new Set(offers.map(m=>m.id)).size).toBe(3);expect(offers.every(m=>m.id!==root)).toBe(true);if(rare)expect(offers.some(m=>m.rarity==='rare')).toBe(true);expect(offers).toEqual(draftMutationOffers(seed,build,rare));}}
  }
 });
 it('accepts Cold Snap as a usable chill source and does not offer status siphon without a source',()=>{
  expect(()=>addMutation({mutations:['cold-snap']},'absolute-zero')).not.toThrow();
  for(let seed=0;seed<100;seed++)expect(draftMutationOffers(seed,{mutations:['breacher']}).some(m=>m.id==='siphon-shells')).toBe(false);
 });
 it('ordinary boons have no arbitrary numerical penalties; Blood Price is explicit risk',()=>{
  const stats=deriveBuildStats({mutations:['breacher','heavy-pellets','cryogenic','hot-reload','last-shell','volatile-remains']},'shotgun');
  expect(stats.projectileDamageMultiplier).toBeCloseTo(1.35);expect(stats.shotIntervalMultiplier).toBe(1);expect(stats.reloadDurationMultiplier).toBeLessThanOrEqual(1);expect(stats.incomingDamageMultiplier).toBe(1);
  expect(deriveBuildStats({mutations:['blood-price']},'pistol')).toMatchObject({projectileDamageMultiplier:1.35,incomingDamageMultiplier:1.2});
  expect(MUTATION_CATALOG.scavenger.name).toBe('Kindling');expect(MUTATION_CATALOG['magnetic-feed'].name).toBe('Cycle Capacitor');
 });
});
describe('composed combat paths',()=>{
 it('shatter takes precedence over Thermal Shock on the same consumed chill',()=>{
  const w=world(['cryogenic','shattershot','incendiary']);w.hit('a');w.hit('b');w.hit('c');w.combat.setBuild({mutations:['cryogenic','shattershot','incendiary','thermal-shock']});w.hit('d');
  expect(w.hits.some(h=>h.amount===32)).toBe(false);expect(w.runtime.statuses(1)).toMatchObject({chilled:false,burning:true});
 });
 it('consumes chill before Thermal Shock when base projectile damage is lethal',()=>{
  const w=world(['cryogenic','absolute-zero','shattershot','incendiary']);
  w.hit('a');w.hit('b');w.hit('c');w.advance(50);
  expect(w.runtime.statuses(1)).toMatchObject({chillStacks:3,frozen:true,burning:true});
  w.combat.setBuild({mutations:['cryogenic','absolute-zero','shattershot','incendiary','thermal-shock']});
  // DepthGame.updateBullets snapshots the target before base damage, then dispatches hit and kill.
  const snapshot={...w.targets[0]};w.targets[0].health=0;
  w.runtime.hit('base-lethal','rifle',snapshot,{x:1,y:0});
  expect(w.runtime.statuses(1)).toMatchObject({chilled:false,frozen:false});
  w.runtime.kill(snapshot,'direct',{chainId:'base-lethal',depth:0});
  expect(w.hits.filter(h=>h.id===2)).toEqual([{id:2,amount:16}]);
 });
 it('registers empowerment before shatter kills and excludes later burn kills',()=>{
  const w=world(['cryogenic','shattershot','hot-reload','reactor-cascade']);w.hit('a');w.hit('b');w.hit('c');w.targets[0].health=20;
  w.combat.switchWeapon('plasma');w.runtime.hit('empowered','rifle',{...w.targets[0]},{x:1,y:0},true);
  expect(w.hits.filter(h=>h.id===2&&h.amount===36)).toHaveLength(1);
  w.runtime.kill({...w.targets[0]},'direct',{chainId:'empowered',depth:0});expect(w.hits.filter(h=>h.id===2&&h.amount===36)).toHaveLength(1);
  const dot=world(['incendiary','hot-reload','reactor-cascade']);dot.targets[0].health=4;dot.runtime.hit('empowered','rifle',{...dot.targets[0]},{x:1,y:0},true);dot.advance(250);expect(dot.hits.some(h=>h.amount===36)).toBe(false);
 });
 it('Cold Snap alone can reach three stacks and freeze before a shatter',()=>{
  const w=world(['cold-snap','absolute-zero','shattershot']);w.runtime.completedReload({x:0,y:0});w.runtime.completedReload({x:0,y:0});w.advance(50);
  expect(w.runtime.statuses(1)).toMatchObject({chillStacks:3,frozen:true});w.hit('finish');expect(w.runtime.statuses(1)).toMatchObject({chillStacks:0,frozen:false});
 });
 it('stacks, freezes, then shatters with a rifle, thawing immediately without losing burn',()=>{
  const w=world(['cryogenic','absolute-zero','shattershot','frostbite','incendiary']);
  w.hit('a');w.hit('b');expect(w.hits).toHaveLength(0);w.hit('c');w.advance(50);
  expect(w.runtime.statuses(1)).toMatchObject({chilled:true,chillStacks:3,frozen:true,burning:true});expect(w.slows.get(1)).toBe(0);
  w.hit('d');w.advance(50);expect(w.runtime.statuses(1)).toMatchObject({chilled:false,frozen:false,burning:true});expect(w.slows.get(1)).toBe(1);expect(w.hits).toContainEqual({id:2,amount:16});
  const boss=world(['cryogenic','absolute-zero','shattershot'],true,true);boss.hit('a');boss.hit('b');boss.hit('c');boss.advance(50);expect(boss.runtime.statuses(1)).toMatchObject({chillStacks:3,frozen:false});expect(boss.slows.get(1)).not.toBe(0);boss.hit('d');expect(boss.hits).toContainEqual({id:2,amount:16});
 });
 it('spreads burning secondary deaths with full reserves and respects cover and expiry',()=>{
  const last=world(['incendiary','scavenger']);last.targets[0].health=24;last.hit('last');last.advance(1500);expect(last.runtime.statuses(2).burning).toBe(true);
  const w=world(['incendiary','scavenger']);w.combat.replenishReserves();w.targets[0].health=4;w.hit('a');w.advance(250);expect(w.runtime.statuses(2).burning).toBe(true);w.advance(1500);expect(w.targets[1].health).toBe(976);expect(w.runtime.statuses(2).burning).toBe(false);
  const blocked=world(['incendiary','scavenger'],false);blocked.targets[0].health=4;blocked.hit('a');blocked.advance(250);expect(blocked.runtime.statuses(2).burning).toBe(false);
 });
 it('combustion needs existing burn, not poison, and consumes fire before reignition',()=>{
  const w=world(['incendiary','combustion']);w.hit('a');expect(w.hits).toHaveLength(0);w.hit('b');expect(w.hits).toContainEqual({id:2,amount:26});expect(w.runtime.statuses(1).burning).toBe(false);w.hit('c');expect(w.runtime.statuses(1).burning).toBe(true);
 });
 it('switch priming requires an ordinary shot, consumes once, and cannot prime by switch spam',()=>{
  const c=new CombatSystem();c.setBuild({mutations:['magnetic-feed']});c.switchWeapon('rifle');expect(c.fire(0)[0].primed).toBeUndefined();c.switchWeapon('pistol');const shot=c.fire(0)[0];expect(shot.primed).toBe(true);c.switchWeapon('shotgun');expect(c.fire(0)[0].primed).toBeUndefined();c.resetMutationEncounter();c.switchWeapon('plasma');expect(c.fire(0)[0].primed).toBeUndefined();
 });
 it('renders simultaneous independent persistent cues and clears corpses and reused actors',()=>{
  const m=alien('brute');m.setAffliction!({chilled:true,burning:true,frozen:true,chillStacks:3});m.animate(0,1,0);m.animate(.1,1,0);
  expect(m.root.userData.affliction.status).toMatchObject({burning:true,chilled:true,frozen:true});
  m.setAffliction!({chilled:true,burning:false,frozen:false,chillStacks:1});m.animate(.2,1,0);expect(m.root.userData.affliction.status).toMatchObject({burning:false,chilled:true,frozen:false});
  m.setAffliction!({chilled:true,burning:true,frozen:true});freezeCorpse(m);expect(m.root.userData.affliction.status).toMatchObject({burning:false,chilled:false,frozen:false});m.reset!();expect(m.root.userData.affliction.status.chilled).toBe(false);disposeModel(m.root);
 });
});
