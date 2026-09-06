import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {MutationRuntime} from '../src/game/roguelike/MutationRuntime';
import {AttackEffects} from '../src/render/AttackEffects';
import {DepthGame,type GameEffect} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';

describe('body wall-slam presentation',()=>{
 for(const seismic of [false,true])it(`routes one directed slam, retains native wall damage and seismic area=${seismic}`,()=>{
  const combat=new CombatSystem();combat.setBuild({mutations:seismic?['breacher','seismic-impact']:['breacher']});
  const target={id:1,x:100,y:100,radius:28,health:1000},nearby={id:2,x:125,y:100,radius:12,health:1000};
  const slams:unknown[]=[],visuals:string[]=[],hits:{id:number;amount:number}[]=[];
  const runtime=new MutationRuntime(combat,{targets:()=>[target,nearby],damage:(id,amount)=>{hits.push({id,amount});return{applied:true,died:false};},move:()=>({blocked:true}),moveCorpse:t=>({...t,blocked:true}),setSlow:()=>{},effect:()=>visuals.push('explosion'),boonEffect:k=>visuals.push(k),wallSlam:(...args:unknown[])=>slams.push(args)});
  runtime.hit('shot','shotgun',{...target},{x:0,y:-1});runtime.update(25);runtime.update(25);
  expect(slams).toHaveLength(1);expect(visuals).toEqual([]);
  expect(hits).toEqual(seismic?[{id:1,amount:24},{id:2,amount:24},{id:1,amount:21.599999999999998}]:[{id:1,amount:21.599999999999998}]);
 });
 it('keeps ordinary pellet richness despite PR47 metadata, with no wall-slam reinterpretation',()=>{
  const fx=new AttackEffects(new T.Scene());
  fx.event({type:'hit',weapon:'shotgun',x:100,y:100,angle:0,wall:{x:-1,y:0},shotId:'s'});
  expect(fx.counts).toEqual({glow:10,smoke:1,debris:3,decals:0,fire:0,pulses:0});
 });
 it('emits no blast rings or fire, and fans fragments away from contact',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene);
  fx.event({type:'wall-slam',x:0,y:0,wall:{x:0,y:1},targetId:1});
  expect(fx.counts.fire).toBe(0);expect(fx.counts.pulses).toBe(0);expect(fx.counts.debris).toBeGreaterThanOrEqual(14);expect(fx.counts.smoke).toBeGreaterThanOrEqual(5);
  fx.update(.02,new T.PerspectiveCamera(),[]);
  const debris=scene.children[2] as T.InstancedMesh,m=new T.Matrix4();
  for(let i=0;i<debris.count;i++){debris.getMatrixAt(i,m);expect(m.elements[14]).toBeGreaterThan(0);}
  fx.update(4,new T.PerspectiveCamera(),[]);expect(Object.values(fx.counts).every(n=>n===0)).toBe(true);
 });
 it('preserves genuine explosions and confirmed target contact',()=>{
  const fx=new AttackEffects(new T.Scene());fx.event({type:'explosion',x:0,y:0,radius:100,elements:['fire']});expect(fx.counts.fire).toBe(1);expect(fx.counts.pulses).toBe(1);
  fx.clear();fx.event({type:'hit',contact:'damage',weapon:'shotgun',x:0,y:0,targetId:1});expect(fx.counts.glow).toBe(4);expect(fx.counts.debris).toBe(0);
 });
 it('traces native shotgun hit, launch, wall contact and additional damage in authored geometry',()=>{
  const events:GameEffect[]=[],g=new DepthGame(e=>events.push(e));g.newRun(1729);g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);g.skipStory();g.enemies.reset();g.combat.setBuild({mutations:['breacher','seismic-impact','heavy-pellets']});g.switchWeapon('shotgun');Object.assign(g.player,{x:760,y:205});
  const spawn=g.enemies.spawn('brute',760,88,true);expect(spawn.spawned).toBe(true);if(!spawn.spawned)return;
  for(let i=0;i<30;i++)g.update(1000/30,{x:0,y:0,fire:i===6,angle:-Math.PI/2,autoAim:false});
  const slams=events.filter(e=>e.type==='wall-slam');expect(slams).toHaveLength(1);expect(slams[0].targetId).toBe(spawn.enemy.id);expect(slams[0].wall!.y).toBeGreaterThan(.9);expect(slams[0].y).toBeLessThan(65);expect(events.some(e=>e.contact)).toBe(true);expect(events.filter(e=>e.type==='explosion')).toHaveLength(0);
 });
});
