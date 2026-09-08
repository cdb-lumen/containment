import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {DepthGame,type GameEffect} from '../../src/DepthGame';
import {generateRun} from '../../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {ProjectileHitTracker} from '../../src/game/combat/CombatSystem';
import {ENEMIES} from '../../src/game/enemies/catalog';
import {authoredRoom} from '../../src/render/AuthoredRooms';
import {disposeModel} from '../../src/render/meshParts';
const nodes=generateRun(3,3).nodes,node=nodes.find(n=>n.templateId==='passenger-vault')!;
const rectangles=[[320,240,200,120,40],[680,240,200,120,40],[320,520,200,120,40],[680,520,200,120,40],[300,40,600,80,48],[300,760,600,80,32],[1040,240,120,80,40],[1040,560,120,80,32]];
const point=(x:number,y:number)=>({x,y});
const geometry=()=>createExpeditionGeometry(node);
const setup=(emit:(e:GameEffect)=>void=()=>{})=>{const game=new DepthGame(emit);game.node=node;game.geometry=geometry();game.navigation=new FacilityNavigation(game.geometry);game.status='playing';Object.assign(game.player,game.geometry.playerSpawn);return game;};
const routes=[[[100,440],[1100,440]],[[100,440],[260,440],[260,180],[960,180],[960,440],[1100,440]],[[100,440],[260,440],[260,700],[960,700],[960,440],[1100,440]],[[600,180],[600,700]]].map(r=>r.map(([x,y])=>point(x,y)));
const targets=[point(180,440),point(600,180),point(600,700),point(600,440),point(1100,440)];
describe('reviewed Passenger Vault whole-room blockout',()=>{
 it('preserves all nineteen other templates',()=>expect(nodes.filter(n=>n!==node).map(n=>ROOM_TEMPLATES[n.templateId])).toMatchSnapshot());
 it('uses exactly the eight sealed reservations, rectangular deck and four offset-safe breaches',()=>{
  const g=geometry();expect(g.boundary).toEqual([point(40,40),point(1160,40),point(1160,840),point(40,840)]);
  expect(g.voids).toEqual(rectangles.map(([x,y,w,h])=>[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)]));
  expect(ROOM_TEMPLATES[node.templateId].obstacles).toEqual([]);
  expect(g.breaches.map(({x,y})=>point(x,y))).toEqual([point(260,180),point(960,180),point(260,700),point(960,700)]);
 });
 it('sweeps player and encounter radii on all four routes and diagonally through open intersections',()=>{
  const g=geometry();for(const radius of new Set([16,28,...Object.values(ENEMIES).filter(e=>e.radius<=38).map(e=>e.radius)])){
   for(const route of routes)for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],radius),JSON.stringify({radius,route,i})).toBe(true);
   expect(canTraverseExpedition(g,point(560,400),point(640,480),radius)).toBe(true);
  }
  const game=setup();for(const route of routes){Object.assign(game.player,route[0]);for(const target of route.slice(1)){for(let i=0;i<300&&Math.hypot(target.x-game.player.x,target.y-game.player.y)>2;i++){const dx=target.x-game.player.x,dy=target.y-game.player.y;game.update(Math.min(50,Math.hypot(dx,dy)/220*1000),{x:dx,y:dy,fire:false,angle:null,autoAim:false});expect(canOccupyExpedition(g,game.player,16)).toBe(true);}expect(Math.hypot(target.x-game.player.x,target.y-game.player.y)).toBeLessThan(2);}}
 });
 it('reaches every working and maintenance position at radius 28',()=>{
  const g=geometry(),nav=new FacilityNavigation(g);nav.prepare(g.playerSpawn,1);
  const positions=[... [345,395,445,495,705,755,805,855].flatMap(x=>[point(x,400),point(x,480)]),...[420,600,780].flatMap(x=>[point(x,180),point(x,700)]),point(1000,280),point(1000,600),g.playerSpawn,g.exitPoint];
  for(const p of positions){expect(canOccupyExpedition(g,p,28),JSON.stringify(p)).toBe(true);expect(nav.reachable(p),JSON.stringify(p)).toBe(true);}
 });
 it('routes live brutes from every production offset and spawn fallback to every loop without clipping or stalling',()=>{
  for(const target of targets)for(const breach of geometry().breaches){const game=setup();Object.assign(game.player,target);const start=point(breach.x+(breach.facing==='east'?56:-56),breach.y);
   expect(canOccupyExpedition(game.geometry,start,38)).toBe(true);expect(game['spawn']('brute',start.x,start.y)).toBe(true);
   const id=game.enemies.snapshot.enemies[0].id;let steps=0;for(;steps<1200;steps++){const e=game.enemies.getSnapshot(id)!;expect(canOccupyExpedition(game.geometry,e,e.radius)).toBe(true);if(Math.hypot(e.x-target.x,e.y-target.y)<80)break;game.enemies.update(50,game.player);}expect(steps,JSON.stringify({start,target})).toBeLessThan(1200);
  }
  for(const [x,y,w,h] of rectangles){const game=setup();expect(game['spawn']('brute',x+w/2,y+h/2)).toBe(true);for(const e of game.enemies.snapshot.enemies){expect(canOccupyExpedition(game.geometry,e,e.radius)).toBe(true);game.navigation.prepare(game.player,1);expect(game.navigation.reachable(e)).toBe(true);}}
 });
 it('keeps L1/L2 open and the oblique A ray blocked',()=>{const g=geometry();expect(hasClearExpeditionShot(g,point(180,440),point(1020,440))).toBe(true);expect(hasClearExpeditionShot(g,point(600,180),point(600,700))).toBe(true);expect(hasClearExpeditionShot(g,point(260,440),point(780,180))).toBe(false);});
 it('passes real player and hazard projectiles through L1/L2 without wall impacts',()=>{
  for(const [from,to] of [[point(180,440),point(1020,440)],[point(600,180),point(600,700)]])for(const kind of ['player','hazard'] as const){
   const events:GameEffect[]=[],game=setup(e=>events.push(e)),distance=Math.hypot(to.x-from.x,to.y-from.y),angle=Math.atan2(to.y-from.y,to.x-from.x);
   game.bullets.push({kind,...from,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   for(let remaining=distance/1000;remaining>0;remaining-=.05)game['updateBullets'](Math.min(.05,remaining));
   expect(game.bullets).toHaveLength(1);expect(game.bullets[0].x).toBeCloseTo(to.x);expect(game.bullets[0].y).toBeCloseTo(to.y);expect(events).toEqual([]);
  }
 });
 it('matches rendered low solid contacts to every accessible logical face',()=>{
  const group=authoredRoom('passenger-vault',ROOM_TEMPLATES[node.templateId])!;group.updateMatrixWorld(true);
  const ray=new T.Raycaster();for(const [x,y,w,h] of rectangles)for(const [start,end] of [[point(x-60,y+h/2),point(x,y+h/2)],[point(x+w+60,y+h/2),point(x+w,y+h/2)],[point(x+w/2,y-60),point(x+w/2,y)],[point(x+w/2,y+h+60),point(x+w/2,y+h)]]){
   if(!canOccupyExpedition(geometry(),start,16))continue;
   ray.set(new T.Vector3(start.x/32,16/32,start.y/32),new T.Vector3(end.x-start.x,0,end.y-start.y).normalize());const hit=ray.intersectObject(group,true)[0];expect(hit).toBeDefined();expect(hit.point.x*32).toBeCloseTo(end.x,3);expect(hit.point.z*32).toBeCloseTo(end.y,3);
  }disposeModel(group);
 });
 it('stops real bullets and grenades at every accessible row/service face with matching impact events',()=>{
  for(const [x,y,w,h] of rectangles){const faces=[[point(x-60,y+h/2),0],[point(x+w+60,y+h/2),Math.PI],[point(x+w/2,y-60),Math.PI/2],[point(x+w/2,y+h+60),-Math.PI/2]] as const;
   for(const [start,angle] of faces){if(!canOccupyExpedition(geometry(),start,16))continue;
    for(const kind of ['player','hazard','grenade'] as const){const events:GameEffect[]=[],game=setup(e=>events.push(e));game.bullets.push({kind,...start,life:1.1,request:{weaponId:'shotgun',damage:20,speed:1000,radius:7,angle,penetration:1,splashRadius:kind==='grenade'?80:0,knockback:0},tracker:new ProjectileHitTracker(1)});
     for(let i=0;i<24;i++){game.update(50);for(const b of game.bullets)expect(canOccupyExpedition(game.geometry,b,7)).toBe(true);}expect(game.bullets).toHaveLength(0);expect(events.some(e=>e.type===(kind==='grenade'?'explosion':'hit'))).toBe(true);
    }
   }
  }
 });
 it('places and collects real drops at probes, every row corner and service face; preserves clear-room sweep',()=>{
  const positions=[point(600,440),point(260,300),point(960,580),...rectangles.flatMap(([x,y,w,h])=>[point(x-28,y-28),point(x+w+28,y-28),point(x-28,y+h+28),point(x+w+28,y+h+28),point(x+w/2,y-28),point(x+w/2,y+h+28),point(x-28,y+h/2)])].filter(p=>canOccupyExpedition(geometry(),p,16));
  for(const p of positions){const game=setup();game.navigation.prepare(game.player,1);expect(game.navigation.reachable(p)).toBe(true);let dropped=false;for(let i=0;i<100&&!dropped;i++)dropped=game.pickups.rollEnemyDrop('brute',p.x,p.y).dropped;expect(dropped).toBe(true);Object.assign(game.player,p);game.update(50);expect(game.pickups.snapshot).toHaveLength(0);}
  const game=setup();for(const p of [point(600,440),point(260,300),point(960,580)])expect(game.pickups.spawn('credits',10,p.x,p.y).spawned).toBe(true);const before=game.combat.snapshot.credits;game['collectLoot'](true);expect(game.pickups.snapshot).toHaveLength(0);expect(game.combat.snapshot.credits).toBe(before+30);
 });
 it('does not attract a pickup through a row corner, then collects along an open approach',()=>{
  const game=setup();Object.assign(game.player,point(500,388));expect(game.pickups.spawn('credits',10,548,340).spawned).toBe(true);
  for(let i=0;i<10;i++)game.update(50);expect(game.pickups.snapshot).toHaveLength(1);expect(canOccupyExpedition(game.geometry,game.pickups.snapshot[0],16)).toBe(true);
  Object.assign(game.player,point(568,380));for(let i=0;i<20;i++)game.update(50);expect(game.pickups.snapshot).toHaveLength(0);
 });
 it('renders closed single-tier reservations above a continuous deck, no old wells or exposed bodies',()=>{
  const group=authoredRoom('passenger-vault',ROOM_TEMPLATES[node.templateId])!;group.updateMatrixWorld(true);
  expect(group.userData.sealedPassengers).toBe(16);expect(group.userData.storyFixtures).toHaveLength(8);
  const ray=new T.Raycaster();for(const [x,y,w,h,maxHeight] of rectangles){ray.set(new T.Vector3((x+w/2)/32,10,(y+h/2)/32),new T.Vector3(0,-1,0));const hit=ray.intersectObject(group,true)[0];expect(hit).toBeDefined();expect(hit.point.y).toBeGreaterThan(0);expect(hit.point.y).toBeLessThanOrEqual(maxHeight/32+.001);}
  group.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;expect(m.color?.getHex()).not.toBe(0xb5a48e);o.geometry.computeBoundingBox();expect(o.geometry.boundingBox!.min.y).toBeGreaterThan(-1);}});disposeModel(group);
 });
});
