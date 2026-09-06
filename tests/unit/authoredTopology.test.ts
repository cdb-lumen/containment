import {describe,it,expect} from 'vitest';
import {generateRun} from '../../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {ProjectileHitTracker} from '../../src/game/combat/CombatSystem';
import {DepthGame} from '../../src/DepthGame';
const ids=['passenger-vault','breached-loading-bay','overload-floor'];
const nodes=generateRun(3,3).nodes;
const probes=[{x:600,y:280},{x:680,y:380},{x:600,y:440}];
describe('three authored walkable topologies',()=>{
 it('replaces exactly three rectangular footprints with polygon boundaries and real voids',()=>{
  expect(nodes).toHaveLength(20);
  for(const n of nodes){const t=ROOM_TEMPLATES[n.templateId];if(ids.includes(n.templateId)){
   expect(t).toHaveProperty('boundary');expect(t).toHaveProperty('voids');
   const g=createExpeditionGeometry(n);
   for(const radius of [0,9,28,38]){
    expect(canOccupyExpedition(g,{x:50,y:50},radius)).toBe(false);
    expect(canOccupyExpedition(g,probes[ids.indexOf(n.templateId)],radius)).toBe(false);
   }
  }else{expect(t).not.toHaveProperty('boundary');expect(t).not.toHaveProperty('voids');}}
 });
 it('connects spawn, exit and inward-offset breaches for larger actors',()=>{
  for(const n of nodes.filter(n=>ids.includes(n.templateId))){const g=createExpeditionGeometry(n),nav=new FacilityNavigation(g);nav.prepare(g.playerSpawn,1);
   for(const p of [g.playerSpawn,g.exitPoint,...g.breaches,...g.breaches.map(b=>({x:b.x+(b.facing==='east'?56:-56),y:b.y}))]){
    expect(canOccupyExpedition(g,p,38),`${n.templateId} ${JSON.stringify(p)}`).toBe(true);
    expect(nav.reachable(p),`${n.templateId} navigation ${JSON.stringify(p)}`).toBe(true);
   }
  }
 });
 it('blocks sightlines and player/corpse movement into cryo void but keeps cross-aisle open',()=>{
  const n=nodes.find(n=>n.templateId==='passenger-vault')!,g=createExpeditionGeometry(n);
  expect(hasClearExpeditionShot(g,{x:300,y:280},{x:1000,y:280})).toBe(false);
  expect(hasClearExpeditionShot(g,{x:300,y:440},{x:1050,y:440})).toBe(true);
  const game=new DepthGame();game.geometry=g;
  for(const radius of [28,38]){const moved=game.moveCorpse({x:600,y:440,radius},0,-200);expect(moved.blocked).toBe(true);expect(moved.y).toBeGreaterThanOrEqual(360+radius);}
  const nav=new FacilityNavigation(g);expect(nav.waypoint({x:300,y:280,radius:28},{x:1000,y:280},1)).not.toBeNull();
 });
 it('routes real brutes around voids including a clear ray with insufficient body clearance',()=>{
  for(const [start,target] of [[{x:340,y:390},{x:1040,y:360}],[{x:340,y:250},{x:1000,y:280}]]){
   const game=new DepthGame();game.geometry=createExpeditionGeometry(nodes.find(n=>n.templateId==='passenger-vault')!);game.navigation=new FacilityNavigation(game.geometry);Object.assign(game.player,target);
   const result=game.enemies.spawn('brute',start.x,start.y);expect(result.spawned).toBe(true);if(!result.spawned)continue;
   for(let i=0;i<1200;i++){game.enemies.update(50,game.player);const e=game.enemies.getSnapshot(result.enemy.id)!;expect(canOccupyExpedition(game.geometry,e,e.radius)).toBe(true);}
   const e=game.enemies.getSnapshot(result.enemy.id)!;expect(Math.hypot(e.x-target.x,e.y-target.y)).toBeLessThan(80);
  }
 });
 it('stops actual player and hazard bullets at cryo void edges',()=>{
  for(const kind of ['player','hazard'] as const){const game=new DepthGame();game.geometry=createExpeditionGeometry(nodes.find(n=>n.templateId==='passenger-vault')!);game.navigation=new FacilityNavigation(game.geometry);game.status='playing';Object.assign(game.player,{x:100,y:440});
   game.bullets.push({kind,x:600,y:440,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle:-Math.PI/2,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   game.update(50);expect(game.bullets).toHaveLength(1);game.update(50);expect(game.bullets).toHaveLength(0);
  }
 });
 it('never magnets pickups through the corner of a void',()=>{
  const game=new DepthGame();game.geometry=createExpeditionGeometry(nodes.find(n=>n.templateId==='passenger-vault')!);game.navigation=new FacilityNavigation(game.geometry);game.status='playing';Object.assign(game.player,{x:920,y:380});
  expect(game.pickups.spawn('armor',10,960,340).spawned).toBe(true);
  for(let i=0;i<10;i++){game.update(50);expect(game.pickups.snapshot).toHaveLength(1);expect(canOccupyExpedition(game.geometry,game.pickups.snapshot[0],16)).toBe(true);}
 });
});
