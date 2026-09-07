import {describe,it,expect} from 'vitest';
import {generateRun} from '../../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {ProjectileHitTracker} from '../../src/game/combat/CombatSystem';
import {AWAKENING_BLOCKOUT,AWAKENING_FUNCTIONAL_ENVELOPES} from '../../src/game/roguelike/authoredRoomTopologies';
import {DepthGame} from '../../src/DepthGame';
const nodes=generateRun(3,3).nodes;
const geometry=()=>createExpeditionGeometry(nodes.find(n=>n.templateId==='awakening-bay')!);
describe('awakening cradle',()=>{
 it('preserves the other nineteen complete templates exactly',()=>{
  const unchanged=nodes.filter(n=>n.templateId!=='awakening-bay').map(n=>ROOM_TEMPLATES[n.templateId]);
  expect(unchanged).toHaveLength(19);expect(unchanged).toMatchSnapshot();
 });
 it('blocks chamfered corners and straight equipment footprints',()=>{
  const g=geometry();
  for(const p of [{x:50,y:50},{x:110,y:440},{x:600,y:280},{x:600,y:580},{x:220,y:700}])
   for(const r of [0,9,28,38])expect(canOccupyExpedition(g,p,r),JSON.stringify(p)).toBe(false);
  expect(hasClearExpeditionShot(g,{x:350,y:440},{x:1000,y:440})).toBe(true);
 });
 it('allows radius-38 traversal from the broken cradle to exit on both broad routes',()=>{
  const g=geometry(),nav=new FacilityNavigation(g);nav.prepare(g.playerSpawn,1);
  for(const radius of [16,28,38])expect(canTraverseExpedition(g,g.playerSpawn,g.exitPoint,radius),`center radius ${radius}`).toBe(true);
  for(const side of [190,700]){
   const route=[g.playerSpawn,{x:350,y:440},{x:350,y:side},{x:960,y:side},{x:960,y:440},g.exitPoint];
   for(const radius of [16,28,38])for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],radius),JSON.stringify(route[i])).toBe(true);
  }
  for(const b of g.breaches)for(const p of [b,{x:b.x+(b.facing==='east'?56:-56),y:b.y}]){
   expect(canOccupyExpedition(g,p,38)).toBe(true);expect(nav.reachable(p)).toBe(true);
  }
 });
 it('keeps kit sweeps within solids and reserved standing centers reachable',()=>{
  const g=geometry(),nav=new FacilityNavigation(g);nav.prepare(g.playerSpawn,1);
  for(const e of AWAKENING_FUNCTIONAL_ENVELOPES){
   const b=e.bounds;
   if(e.kind==='access'){
    if(e.id==='landing')continue;
    const center={x:b.x+b.w/2,y:b.y+b.h/2};
    expect(canOccupyExpedition(g,center,28),e.id).toBe(true);expect(nav.reachable(center),e.id).toBe(true);
   }else{
    const f=AWAKENING_BLOCKOUT.find(f=>f.id===e.fixture)!.footprint;
    expect(b.x,e.id).toBeGreaterThanOrEqual(f[0].x);expect(b.y,e.id).toBeGreaterThanOrEqual(f[0].y);
    expect(b.x+b.w,e.id).toBeLessThanOrEqual(f[2].x);expect(b.y+b.h,e.id).toBeLessThanOrEqual(f[2].y);
   }
  }
 });
 it.each([190,700])('routes a live brute around the straight banks via y=%s without entering solids',y=>{
  const game=new DepthGame();game.geometry=geometry();game.navigation=new FacilityNavigation(game.geometry);Object.assign(game.player,{x:1000,y:440});
  const result=game.enemies.spawn('brute',350,y);expect(result.spawned).toBe(true);if(!result.spawned)return;
  for(let i=0;i<1200;i++){game.enemies.update(50,game.player);const e=game.enemies.getSnapshot(result.enemy.id)!;expect(canOccupyExpedition(game.geometry,e,e.radius)).toBe(true);}
  const e=game.enemies.getSnapshot(result.enemy.id)!;expect(Math.hypot(e.x-1000,e.y-440)).toBeLessThan(80);
 });
 it.each(['player','hazard'] as const)('stops live %s projectiles on a sealed bank',kind=>{
  const game=new DepthGame();game.geometry=geometry();game.navigation=new FacilityNavigation(game.geometry);game.status='playing';Object.assign(game.player,game.geometry.playerSpawn);
  game.bullets.push({kind,x:350,y:280,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle:0,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
  game.update(50);expect(game.bullets).toHaveLength(1);game.update(50);expect(game.bullets).toHaveLength(0);
 });
 it('rejects live enemy and pickup spawns inside equipment and outside the chamfer',()=>{
  const game=new DepthGame();game.geometry=geometry();game.navigation=new FacilityNavigation(game.geometry);
  for(const p of [{x:600,y:280},{x:50,y:50},{x:600,y:580}]){
   game['spawn']('brute',p.x,p.y);
   for(const enemy of game.enemies.snapshot.enemies)expect(canOccupyExpedition(game.geometry,enemy,enemy.radius)).toBe(true);
   const result=game.pickups.spawn('armor',10,p.x,p.y);
   // Drops may be rejected or relocated, but never remain in a solid.
   if(result.spawned)for(const drop of game.pickups.snapshot)expect(canOccupyExpedition(game.geometry,drop,16)).toBe(true);
  }
 });
});
