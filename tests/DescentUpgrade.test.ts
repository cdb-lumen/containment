import {beforeAll,describe,expect,it} from 'vitest';
import * as T from 'three';
import {loadModels} from './loadModels';
import {marine} from '../src/render/models';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {MutationRuntime,type MutationTarget} from '../src/game/roguelike/MutationRuntime';
import {claimExpeditionMutation,createExpedition,completeExpeditionRoom,expeditionRewardOffers,rerollExpedition,rerollCost,expeditionCheckpoint,restoreExpedition} from '../src/game/roguelike/expedition';
import {generateRun,isValidRunState} from '../src/game/roguelike/run';
import {progressionFor} from '../src/game/roguelike/progression';
import {createEncounterPlan} from '../src/game/waves/EncounterDirector';
import type {MutationId} from '../src/game/roguelike/types';
import {EnemySystem} from '../src/game/enemies/EnemySystem';
import {deriveBuildStats,addMutation} from '../src/game/roguelike/builds';
beforeAll(loadModels);

function runtime(ids:MutationId[],visible=true){
 const combat=new CombatSystem();combat.setBuild({mutations:ids});
 const targets:MutationTarget[]=[{id:1,x:0,y:0,radius:14,health:200},{id:2,x:80,y:0,radius:14,health:200}];
 const effects:string[]=[],hits:{id:number;amount:number}[]=[],slows:number[]=[];
 const host=new MutationRuntime(combat,{targets:()=>targets,damage:(id,amount)=>{hits.push({id,amount});return{applied:true,died:false};},move:()=>({blocked:false}),moveCorpse:t=>({...t,blocked:false}),setSlow:(_id,n)=>slows.push(n),canAffect:()=>visible,boonEffect:k=>effects.push(k)});
 return{combat,host,targets,hits,effects,slows};
}
describe('complete descent',()=>{
 it('varies opening families and persists paid, finite rerolls exactly',()=>{
  const c=new CombatSystem();c.setCredits(2000);const openings=new Set<string>();
  for(let seed=0;seed<40;seed++){const e=createExpedition(seed,c.getRunResources());openings.add(expeditionRewardOffers(e).map(x=>x.id).join());}
  // Four starters give at most 24 ordered three-card drafts.
  expect(openings.size).toBeGreaterThan(12);
  let e=createExpedition(42,c.getRunResources());
  e=claimExpeditionMutation(e,expeditionRewardOffers(e)[0].id);e=completeExpeditionRoom(e,c.getRunResources());
  const first=expeditionRewardOffers(e).map(x=>x.id),cost=rerollCost(e);e=rerollExpedition(e);
  expect(e.resources.credits).toBe(2000-cost);// An opening reroll must reveal the fourth path; two starters necessarily repeat.
  expect(expeditionRewardOffers(e).some(x=>!first.includes(x.id))).toBe(true);
  const restored=restoreExpedition(expeditionCheckpoint(e,123));expect(expeditionRewardOffers(restored)).toEqual(expeditionRewardOffers(e));
  e=rerollExpedition(restored);expect(()=>rerollExpedition(e)).toThrow();
  expect(()=>rerollExpedition({...restored,resources:{...restored.resources,credits:0}})).toThrow();
 });
 it('preserves six-room legacy paths while new runs scale through three acts',()=>{
  const legacy=generateRun(42,1),modern=generateRun(42,2);
  expect(legacy.bossId).toBe('42:r5-boss');expect(isValidRunState({version:1,seed:42,currentNodeId:legacy.startId,completedNodeIds:[],phase:'combat'})).toBe(true);
  expect(modern.nodes.find(n=>n.id===modern.bossId)?.depth).toBe(11);
  const first=modern.nodes.find(n=>n.depth===0)!,late=modern.nodes.find(n=>n.depth===9&&n.kind==='combat')!;
  expect(progressionFor(late).health).toBeGreaterThan(progressionFor(first).health*1.5);
  const plan=(node:typeof first)=>createEncounterPlan({seed:42,node,breachIds:['a','b','c']});
  expect(plan(late).totalSpawns).toBeGreaterThan(plan(first).totalSpawns*3);expect(plan(late).concurrentCap).toBeLessThanOrEqual(18);
 });
 it('gives charging elites a locked, avoidable windup and preserves scaled speed after chill',()=>{
  const e=new EnemySystem({balance:{health:1.5,damage:1.1,speed:1.1,eliteHealth:1.65,eliteDamage:1.2,specials:true}});
  const result=e.spawn('brute',0,0,true);expect(result.spawned).toBe(true);if(!result.spawned)return;
  e.setSlow(result.enemy.id,.5);e.setSlow(result.enemy.id,1);expect(e.getSnapshot(result.enemy.id)?.speed).toBeCloseTo(66);
  let warned=false;for(let i=0;i<35;i++){const events=e.update(50,{x:300,y:0});if(events.some(x=>x.type==='attack-warning')){warned=true;expect(e.getSnapshot(result.enemy.id)?.windupMs).toBe(850);break;}}
  expect(warned).toBe(true);const before=e.getSnapshot(result.enemy.id)!;e.update(50,{x:300,y:100});expect(e.getSnapshot(result.enemy.id)?.x).toBe(before.x);
 });
 it('executes arc, refreshed burn and reload frost without duplicate procs or wall leaks',()=>{
  const r=runtime(['arc-filament','conductive-shell','incendiary','cold-snap']);
  for(let i=0;i<4;i++){r.host.hit(`s${i}`,'rifle',r.targets[0],{x:1,y:0});r.host.hit(`s${i}`,'rifle',r.targets[0],{x:1,y:0});}
  expect(r.effects.filter(x=>x==='arc')).toHaveLength(1);expect(r.hits.filter(x=>x.id===2)[0].amount).toBeCloseTo(22.4);
  for(let i=0;i<30;i++)r.host.update(50);expect(r.hits.filter(x=>x.id===1).reduce((n,x)=>n+x.amount,0)).toBe(24);
  r.host.completedReload({x:0,y:0});expect(r.slows).toEqual([.7,.7]);expect(r.host.statuses(1).chilled).toBe(true);
  const blocked=runtime(['arc-filament','cold-snap','volatile-remains'],false);for(let i=0;i<4;i++)blocked.host.hit(`s${i}`,'rifle',blocked.targets[0],{x:1,y:0});blocked.host.completedReload({x:0,y:0});blocked.host.kill(blocked.targets[0]);expect(blocked.hits).toHaveLength(0);expect(blocked.slows).toHaveLength(0);
 });
 it('bounds recovery and impact procs and makes family bonuses executable',()=>{
  const r=runtime(['pressure-point','leech-rounds','cryogenic','frost-armor']);r.combat.restoreRunResources({...r.combat.getRunResources(),health:40,armor:0});
  for(let i=0;i<5;i++)r.host.hit(`s${i}`,'pistol',r.targets[0],{x:1,y:0});expect(r.hits.map(x=>x.amount)).toEqual([24]);
  r.host.kill(r.targets[0]);expect(r.combat.snapshot.armor).toBe(3);
  for(let id=2;id<=28;id++)r.host.kill({...r.targets[0],id});expect(r.combat.snapshot.health).toBe(64);
  expect(deriveBuildStats({mutations:['piercing-rounds','breacher','pressure-point']},'rifle')).toMatchObject({penetrationBonus:1,projectileDamageMultiplier:1.12});
  expect(()=>addMutation({mutations:[]},'conductive-shell')).toThrow();
  r.combat.restoreRunResources({...r.combat.getRunResources(),health:100,armor:0});r.combat.setBuild({mutations:['field-medic']});r.combat.restoreHealth(20);expect(r.combat.snapshot.armor).toBe(5);
 });
 it('turns the lower body into travel while retaining gun aim, including repeated paused frames',()=>{
  const model=marine();model.animate(0,0,0);model.root.updateMatrixWorld(true);const initial=model.weapon!.getWorldQuaternion(new T.Quaternion());
  for(let i=1;i<70;i++)model.animate(i/60,1,0,0,0,{x:0,y:220});model.root.updateMatrixWorld(true);
  const strafing=model.weapon!.getWorldQuaternion(new T.Quaternion());expect(initial.angleTo(strafing)).toBeLessThan(.3);
  const asset=model.root.getObjectByName('spine')!;expect(asset).toBeDefined();const pose=asset.quaternion.clone();model.animate(69/60,1,0,0,0,{x:0,y:220});expect(asset.quaternion.angleTo(pose)).toBeLessThan(.001);
  for(let i=70;i<100;i++)model.animate(i/60,1,0,0,0,{x:-220,y:0});model.root.updateMatrixWorld(true);expect(initial.angleTo(model.weapon!.getWorldQuaternion(new T.Quaternion()))).toBeLessThan(.3);
 });
});
