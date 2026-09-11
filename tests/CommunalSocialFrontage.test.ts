import {describe,it,expect} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canOccupyExpedition as occupy,canTraverseExpedition as traverse} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {ProjectileHitTracker} from '../src/game/combat/CombatSystem';
import {PickupSystem} from '../src/game/pickups/PickupSystem';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
const node=generateRun(3,3).nodes.find(n=>n.templateId==='communal-atrium')!;
const point=([x,y]:number[])=>({x,y});
const rectangles=[[180,330,720,12],...[180,300,420,540,660,780].map(x=>[x,342,96,28]),...[276,396,516,636,756,876].map(x=>[x,342,24,36]),...[180,420,660].map(x=>[x,286,96,44]),[900,310,60,68]];
const targets=[[228,424],[468,424],[708,424],[930,424],[120,330],[1040,330],[228,230],[708,230]];
const starts=[[100,440],[1100,440],[600,140],[600,500],[156,100],[1044,100],[156,500],[1044,500]];
function setup(){const game=new DepthGame();game.node=node;game.geometry=createExpeditionGeometry(node);game.navigation=new FacilityNavigation(game.geometry);game.enemies=game['makeEnemies']();game.status='playing';Object.assign(game.player,game.geometry.playerSpawn);return game;}
describe('Room4 social-frontage rough hypothesis, not composition acceptance',()=>{
 it('sweeps all encounter radii along both end loops and walks the actual player to the exit',()=>{
  const game=setup(),g=game.geometry;
  const routes=[[[100,440],[1100,440]],[[100,440],[120,440],[120,230],[1040,230],[1040,440],[1100,440]],[[120,500],[1040,500]]];
  for(const route of routes)for(let i=1;i<route.length;i++)for(const radius of [14,16,17,18,24,28,30,38])for(const reverse of [false,true]){
   expect(traverse(g,point(route[reverse?i:i-1]),point(route[reverse?i-1:i]),radius)).toBe(true);
  }
  for(const route of routes){Object.assign(game.player,point(route[0]));for(const dest of route.slice(1)){
   let steps=0;for(;steps<400&&Math.hypot(dest[0]-game.player.x,dest[1]-game.player.y)>=2;steps++){
    const previous={x:game.player.x,y:game.player.y},dx=dest[0]-game.player.x,dy=dest[1]-game.player.y;
    game.update(Math.min(50,Math.hypot(dx,dy)/220*1000),{x:dx,y:dy,fire:false,angle:null,autoAim:false});
    expect(traverse(g,previous,game.player,16)).toBe(true);
   }expect(steps).toBeLessThan(400);
  }}
  game.navigation.prepare(g.exitPoint,1);expect(game.navigation.reachable(g.playerSpawn)).toBe(true);
  const barrier={...g,blockers:[...g.blockers,{x:590,y:0,width:20,height:580}]};
  const bad=new FacilityNavigation(barrier);bad.prepare(g.exitPoint,1);expect(bad.reachable(g.playerSpawn)).toBe(false);
 });
 it('runs the real Room4 director and reward progression with deterministic kill assistance',()=>{
  const game=new DepthGame();game.newRun(137);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  const reward=()=>{const offers=expeditionRewardOffers(game.expedition);if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();expect(game.status).toBe('route');game.route(game.node.next[0]);};
  for(let room=0;room<4;room++){
   if(room===3){expect(game.node.templateId).toBe('communal-atrium');expect(game.storyRoom?.objective).toBeTruthy();}
   let frames=0,seen=0;
   for(;frames<2000&&game.status==='playing';frames++){
    game.update(50);for(const enemy of game.enemies.snapshot.enemies){expect(occupy(game.geometry,enemy,enemy.radius)).toBe(true);seen++;game.damage(enemy.id,100000);}
   }
   expect(frames).toBeLessThan(2000);expect(seen).toBeGreaterThan(0);expect(game.status).toBe('reward');
   expect(game.expedition.run.completedNodeIds).toContain(game.node.id);expect(game.encounterRemaining).toBe(0);
   reward();
  }
  expect(game.node.depth).toBe(4);
 });
 it('uses the preflight solid frontage and leaves both end routes open',()=>{
  const g=setup().geometry;
  expect(g.voids).toEqual(rectangles.map(([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(point)));
  for(const radius of [16,28,38])for(const x of [120,1040])expect(traverse(g,{x,y:230},{x,y:500},radius)).toBe(true);
  expect(traverse(g,{x:228,y:230},{x:228,y:424},16)).toBe(false);
 });
 it('requires actual brute28 contact for all 64 legal start/target pairs with every step swept',()=>{
  let count=0;
  for(const target of targets)for(const start of starts){
   const game=setup(),g=game.geometry;Object.assign(game.player,point(target));expect(game.player.radius).toBe(16);
   expect(occupy(g,point(start),28)).toBe(true);expect(occupy(g,point(target),28)).toBe(true);
   const spawn=game.enemies.spawn('brute',...start as [number,number]);expect(spawn.spawned).toBe(true);if(!spawn.spawned)throw Error('spawn rejected');
   expect(spawn.enemy.radius).toBe(28);let contact=false,steps=0;
   const unsubscribe=game.enemies.subscribe(e=>{if(e.type==='contact-attack'&&e.enemyId===spawn.enemy.id)contact=true;});
   for(;steps<1200&&!contact;steps++){
    const previous=game.enemies.getSnapshot(spawn.enemy.id)!;game.navigation.prepare(game.player,1);game.enemies.update(50,game.player);
    const next=game.enemies.getSnapshot(spawn.enemy.id)!;expect(occupy(g,next,28)).toBe(true);expect(traverse(g,previous,next,28)).toBe(true);
   }
   unsubscribe();expect(contact,JSON.stringify({start,target,steps})).toBe(true);count++;
  }expect(count).toBe(64);
 },20000);
 it('runs real finite player and hazard shots through the passage but not through the garden',()=>{
  for(const kind of ['player','hazard'] as const)for(const [x,y,angle,blocked] of [[100,440,0,false],[228,230,Math.PI/2,true],[468,424,-Math.PI/2,true],[930,424,-Math.PI/2,true]] as const){
   const game=setup();Object.assign(game.player,{x:100,y:500});game.bullets.push({kind,x,y,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   for(let i=0;i<8;i++)game['updateBullets'](.05);expect(game.bullets).toHaveLength(blocked?0:1);
  }
 });
 it('walks actual player input from spawn to all pickup approaches and rejects all solid drop centers',()=>{
  for(const target of targets){const game=setup(),before=game.combat.snapshot.credits;
   expect(game.pickups.spawn('credits',10,...target as [number,number]).spawned).toBe(true);
   const route=target[1]===230?[[120,440],[120,230],target]:[[target[0],440],target];
   for(const dest of route){let steps=0;for(;steps<400&&Math.hypot(dest[0]-game.player.x,dest[1]-game.player.y)>=2;steps++){
    const dx=dest[0]-game.player.x,dy=dest[1]-game.player.y,previous={x:game.player.x,y:game.player.y};
    game.update(Math.min(50,Math.hypot(dx,dy)/220*1000),{x:dx,y:dy,fire:false,angle:null,autoAim:false});
    expect(occupy(game.geometry,game.player,16)).toBe(true);expect(traverse(game.geometry,previous,game.player,16)).toBe(true);
   }expect(steps).toBeLessThan(400);}
   expect(game.pickups.snapshot).toHaveLength(0);expect(game.combat.snapshot.credits).toBe(before+10);
  }
  for(const [x,y,w,h] of rectangles)expect(setup().pickups.spawn('credits',10,x+w/2,y+h/2).spawned).toBe(false);
  const g=setup().geometry,pickups=new PickupSystem(0,(a,b,r)=>traverse(g,a,b,r)),drop=pickups.spawn('credits',10,228,260);expect(drop.spawned).toBe(true);if(!drop.spawned)throw Error('drop rejected');
  for(let i=0;i<30;i++)pickups.update(50,{x:228,y:410},{magnetEnabled:true,magnetRange:180});
  expect(pickups.collect(drop.pickup.id,{x:228,y:410}).collected).toBe(false);expect(pickups.snapshot).toHaveLength(1);expect(occupy(g,pickups.snapshot[0],16)).toBe(true);
 });
});
