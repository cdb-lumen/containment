import {describe,it,expect} from 'vitest';
import {DepthGame} from '../../src/DepthGame';
import {generateRun} from '../../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {ProjectileHitTracker} from '../../src/game/combat/CombatSystem';
import {ENEMIES} from '../../src/game/enemies/catalog';
import {expeditionRewardOffers} from '../../src/game/roguelike/expedition';

const node=generateRun(3,3).nodes.find(n=>n.templateId==='communal-atrium')!;
const point=(x:number,y:number)=>({x,y});
const geometry=()=>createExpeditionGeometry(node);
const setup=()=>{const game=new DepthGame();game.node=node;game.geometry=geometry();game.navigation=new FacilityNavigation(game.geometry);game.enemies=game['makeEnemies']();game.status='playing';Object.assign(game.player,game.geometry.playerSpawn);return game;};
const targets=[point(436,440),point(584,256),point(744,360),point(744,528),point(980,528),point(1100,440)];
const route=[point(436,440),point(436,528),point(1100,528),point(1100,440)];

describe('accepted Communal Atrium south32 gameplay',()=>{
 it('installs the exact inset physical polygon without changing the shipping envelope',()=>{
  const t=ROOM_TEMPLATES[node.templateId],g=geometry();
  expect([t.width,t.height]).toEqual([1200,880]);
  expect(t.boundary).toEqual([[248,192],[782,192],[782,256],[1200,360],[1200,580],[336,580],[336,360],[248,256]].map(([x,y])=>point(x,y)));
  expect(g.playerSpawn).toEqual(point(436,440));expect(g.exitPoint).toEqual(point(1100,440));
  expect(t.voids).toHaveLength(12);expect(t.obstacles).toEqual([]);
  for(const p of [point(100,440),point(600,700),point(880,440),point(584,336),point(1038,460)])expect(canOccupyExpedition(g,p,16)).toBe(false);
 });
 it('walks the main southern passage with production input and finite actor clearance',()=>{
  const game=setup();
  for(const radius of [16,ENEMIES.crawler.radius,ENEMIES.brute.radius])for(let i=1;i<route.length;i++)expect(canTraverseExpedition(game.geometry,route[i-1],route[i],radius),JSON.stringify({radius,from:route[i-1],to:route[i]})).toBe(true);
  Object.assign(game.player,route[0]);
  for(const target of route.slice(1)){
   for(let frame=0;frame<300&&Math.hypot(target.x-game.player.x,target.y-game.player.y)>2;frame++){
    const dx=target.x-game.player.x,dy=target.y-game.player.y;
    game.update(Math.min(50,Math.hypot(dx,dy)/220*1000),{x:dx,y:dy,fire:false,angle:null,autoAim:false});
    expect(canOccupyExpedition(game.geometry,game.player,16)).toBe(true);
   }
   expect(Math.hypot(target.x-game.player.x,target.y-game.player.y)).toBeLessThan(2);
  }
 });
 it.each((['crawler','brute'] as const).flatMap(family=>targets.flatMap(target=>geometry().breaches.map(breach=>({family,target,breach})))))( 'routes $family from $breach.id to $target with swept legality and real contact',({family,target,breach})=>{
  const game=setup(),start=point(breach.x,breach.y);
  expect(canOccupyExpedition(game.geometry,target,16)).toBe(true);
  expect(canOccupyExpedition(game.geometry,start,ENEMIES[family].radius)).toBe(true);
  Object.assign(game.player,target);expect(game.enemies.spawn(family,start.x,start.y).spawned).toBe(true);
  const initial=game.enemies.snapshot.enemies[0];expect(point(initial.x,initial.y)).toEqual(start);expect(initial.radius).toBe(ENEMIES[family].radius);
  let contacted=false;
  for(let frame=0;frame<1200&&!contacted;frame++){
   const before=game.enemies.getSnapshot(initial.id)!;game.navigation.prepare(game.player,1);
   const events=game.enemies.update(50,game.player),after=game.enemies.getSnapshot(initial.id)!;
   expect(canOccupyExpedition(game.geometry,after,after.radius)).toBe(true);
   expect(canTraverseExpedition(game.geometry,before,after,after.radius)).toBe(true);
   contacted=events.some(e=>e.type==='contact-attack');
  }
  expect(contacted,JSON.stringify({family,start,target,last:game.enemies.getSnapshot(initial.id)})).toBe(true);
 });
 it('keeps breach centers legal and uses production fallback for the water-adjacent inward brute spawn',()=>{
  const g=geometry();
  for(const breach of g.breaches)for(const radius of [16,ENEMIES.crawler.radius,ENEMIES.brute.radius]){
   expect(canOccupyExpedition(g,breach,radius)).toBe(true);
  }
  const requested=point(1044,500);expect(canOccupyExpedition(g,requested,ENEMIES.brute.radius)).toBe(false);
  const game=setup();expect(game['spawn']('brute',requested.x,requested.y)).toBe(true);
  const actual=game.enemies.snapshot.enemies[0];expect(canOccupyExpedition(g,actual,actual.radius)).toBe(true);
  expect(point(actual.x,actual.y)).not.toEqual(requested);
  expect(canOccupyExpedition(g,g.exitPoint,28)).toBe(true);expect(canOccupyExpedition(g,g.exitPoint,38)).toBe(false);
 });
 it('rejects a deliberately disconnected navigation control',()=>{
  const g=geometry(),blocked={...g,voids:[...g.voids!,[point(720,192),point(780,192),point(780,580),point(720,580)]]};
  const nav=new FacilityNavigation(blocked);nav.prepare(point(436,440),1);
  expect(nav.reachable(point(1100,440))).toBe(false);
 });
 it('runs finite player and hazard shots along the passage and stops them at the table and garden',()=>{
  for(const kind of ['player','hazard'] as const)for(const [from,to,clear] of [
   [point(436,528),point(1100,528),true],
   [point(744,440),point(980,440),false],
   [point(584,256),point(584,400),false],
  ] as const){
   const game=setup(),distance=Math.hypot(to.x-from.x,to.y-from.y);
   expect(hasClearExpeditionShot(game.geometry,from,to)).toBe(clear);
   game.bullets.push({kind,...from,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle:Math.atan2(to.y-from.y,to.x-from.x),penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   for(let remaining=distance/1000;remaining>0;remaining-=.01)game['updateBullets'](Math.min(.01,remaining));
   expect(game.bullets).toHaveLength(clear?1:0);
   if(clear){expect(game.bullets[0].x).toBeCloseTo(to.x);expect(game.bullets[0].y).toBeCloseTo(to.y);}
  }
 });
 it('collects legal pickups by walking and rejects every fixture-center drop',()=>{
  const game=setup();
  for(const polygon of ROOM_TEMPLATES[node.templateId].voids!){const p=point(polygon.reduce((sum,p)=>sum+p.x,0)/polygon.length,polygon.reduce((sum,p)=>sum+p.y,0)/polygon.length);expect(game.pickups.spawn('credits',10,p.x,p.y)).toEqual({spawned:false,reason:'invalid'});}
  Object.assign(game.player,point(436,528));const before=game.combat.snapshot.credits;
  expect(game.pickups.spawn('credits',10,650,528).spawned).toBe(true);
  for(let i=0;i<25;i++)game.update(50,{x:1,y:0,fire:false,angle:null,autoAim:false});
  expect(game.pickups.snapshot).toHaveLength(0);expect(game.combat.snapshot.credits).toBe(before+10);
 });
 it('prevents garden-corner magnet-through-solid and collects from a legal input-driven approach',()=>{
  const game=setup();Object.assign(game.player,point(532,392));
  expect(canOccupyExpedition(game.geometry,game.player,16)).toBe(true);
  expect(game.pickups.spawn('credits',10,488,360).spawned).toBe(true);
  expect(canTraverseExpedition(game.geometry,game.pickups.snapshot[0],game.player,16)).toBe(false);
  for(let i=0;i<10;i++)game.update(50);
  expect(game.pickups.snapshot).toHaveLength(1);
  const before=game.combat.snapshot.credits;
  for(let i=0;i<6;i++)game.update(50,{x:-1,y:0,fire:false,angle:null,autoAim:false});
  for(let i=0;i<20;i++)game.update(50);
  expect(game.pickups.snapshot).toHaveLength(0);expect(game.combat.snapshot.credits).toBe(before+10);
 });
 it('completes the real Room4 director and reward progression with deterministic kill assistance',()=>{
  const game=new DepthGame();game.newRun(137);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  const claim=()=>{const offers=expeditionRewardOffers(game.expedition);if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();};
  for(let room=0;room<4;room++){
   if(room===3)expect(game.node.templateId).toBe('communal-atrium');
   let frames=0;for(;frames<2000&&game.status==='playing';frames++){
    game.update(50);for(const enemy of game.enemies.snapshot.enemies){expect(canOccupyExpedition(game.geometry,enemy,enemy.radius)).toBe(true);game.damage(enemy.id,100000);}
   }
   expect(frames).toBeLessThan(2000);expect(game.status).toBe('reward');
   expect(game.expedition.run.completedNodeIds).toContain(game.node.id);expect(game.encounterRemaining).toBe(0);
   claim();expect(game.status).toBe('route');game.route(game.node.next[0]);
  }
  expect(game.node.depth).toBe(4);expect(game.status).toBe('playing');
 });
});
