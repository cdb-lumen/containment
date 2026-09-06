import {describe,it,expect} from 'vitest';
import {generateRun} from '../../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {ProjectileHitTracker} from '../../src/game/combat/CombatSystem';
import {DepthGame} from '../../src/DepthGame';
const nodes=generateRun(3,3).nodes;
const geometry=()=>createExpeditionGeometry(nodes.find(n=>n.templateId==='awakening-bay')!);
describe('awakening cradle',()=>{
 it('preserves the other nineteen complete templates exactly',()=>{
  const unchanged=nodes.filter(n=>n.templateId!=='awakening-bay').map(n=>ROOM_TEMPLATES[n.templateId]);
  expect(unchanged).toHaveLength(19);expect(unchanged).toMatchSnapshot();
 });
 it('cuts the fan corners, broken cradle and service arm out of the actual floor',()=>{
  const g=geometry();
  for(const p of [{x:100,y:200},{x:110,y:440},{x:600,y:440},{x:600,y:210},{x:850,y:620}])
   for(const r of [0,9,28,38])expect(canOccupyExpedition(g,p,r),JSON.stringify(p)).toBe(false);
  expect(hasClearExpeditionShot(g,{x:350,y:440},{x:1000,y:440})).toBe(false);
 });
 it('allows radius-38 traversal from the broken cradle to exit on both broad routes',()=>{
  const g=geometry(),nav=new FacilityNavigation(g);nav.prepare(g.playerSpawn,1);
  for(const side of [300,580]){
   const route=[g.playerSpawn,{x:350,y:side},{x:600,y:side},{x:1000,y:440},g.exitPoint];
   for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],38),JSON.stringify(route[i])).toBe(true);
  }
  for(const b of g.breaches)for(const p of [b,{x:b.x+(b.facing==='east'?56:-56),y:b.y}]){
   expect(canOccupyExpedition(g,p,38)).toBe(true);expect(nav.reachable(p)).toBe(true);
  }
 });
 it.each([300,580])('routes a live brute around the service arm via y=%s without entering solids',y=>{
  const game=new DepthGame();game.geometry=geometry();game.navigation=new FacilityNavigation(game.geometry);Object.assign(game.player,{x:1000,y:440});
  const result=game.enemies.spawn('brute',350,y);expect(result.spawned).toBe(true);if(!result.spawned)return;
  for(let i=0;i<1200;i++){game.enemies.update(50,game.player);const e=game.enemies.getSnapshot(result.enemy.id)!;expect(canOccupyExpedition(game.geometry,e,e.radius)).toBe(true);}
  const e=game.enemies.getSnapshot(result.enemy.id)!;expect(Math.hypot(e.x-1000,e.y-440)).toBeLessThan(80);
 });
 it.each(['player','hazard'] as const)('stops live %s projectiles on the arm',kind=>{
  const game=new DepthGame();game.geometry=geometry();game.navigation=new FacilityNavigation(game.geometry);game.status='playing';Object.assign(game.player,game.geometry.playerSpawn);
  game.bullets.push({kind,x:350,y:440,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle:0,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
  game.update(50);expect(game.bullets).toHaveLength(1);game.update(50);expect(game.bullets).toHaveLength(0);
 });
 it('rejects live enemy and pickup spawns inside machinery and outside the fan',()=>{
  const game=new DepthGame();game.geometry=geometry();game.navigation=new FacilityNavigation(game.geometry);
  for(const p of [{x:600,y:440},{x:100,y:200},{x:600,y:210}]){
   game['spawn']('brute',p.x,p.y);
   for(const enemy of game.enemies.snapshot.enemies)expect(canOccupyExpedition(game.geometry,enemy,enemy.radius)).toBe(true);
   const result=game.pickups.spawn('armor',10,p.x,p.y);
   // Drops may be rejected or relocated, but never remain in a solid.
   if(result.spawned)for(const drop of game.pickups.snapshot)expect(canOccupyExpedition(game.geometry,drop,16)).toBe(true);
  }
 });
});
