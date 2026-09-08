import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {DepthGame,type GameEffect} from '../../src/DepthGame';
import {generateRun} from '../../src/game/roguelike/run';
import {expeditionRewardOffers} from '../../src/game/roguelike/expedition';
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
// Exclude only the four faces flush with the hall boundary, not failed probes.
const accessibleFaces=rectangles.flatMap(([x,y,w,h],i)=>[
 {face:point(x,y+h/2),normal:point(-1,0),side:'west'},
 {face:point(x+w,y+h/2),normal:point(1,0),side:'east'},
 {face:point(x+w/2,y),normal:point(0,-1),side:'north'},
 {face:point(x+w/2,y+h),normal:point(0,1),side:'south'},
].filter(f=>!(i===4&&f.side==='north'||i===5&&f.side==='south'||i>=6&&f.side==='east')));
const outward=(face:{x:number;y:number},normal:{x:number;y:number},distance:number)=>point(face.x+normal.x*distance,face.y+normal.y*distance);
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
  for(const p of positions){
   expect(canOccupyExpedition(g,p,28),JSON.stringify(p)).toBe(true);expect(nav.reachable(p),JSON.stringify(p)).toBe(true);
   const approach=p.x===1000?[g.playerSpawn,point(960,440),point(960,p.y),p]
    :p.y===180||p.y===700?[g.playerSpawn,point(260,440),point(260,p.y),p]
    :[g.playerSpawn,point(600,440),point(600,p.y),p];
   for(let i=1;i<approach.length;i++)expect(canTraverseExpedition(g,approach[i-1],approach[i],28),JSON.stringify({p,segment:i})).toBe(true);
  }
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
 it('pins first face contact, shotgun normals, previous-centre hits and stopped grenade fuse semantics',()=>{
  expect(accessibleFaces).toHaveLength(28);
  for(const {face,normal} of accessibleFaces)for(const mode of ['shotgun','rifle','hazard','grenade'] as const){
   const events:GameEffect[]=[],game=setup(e=>events.push(e)),start=outward(face,normal,60),previous=outward(face,normal,11);
   expect(canOccupyExpedition(game.geometry,start,16)).toBe(true);
   game.bullets.push({kind:mode==='hazard'||mode==='grenade'?mode:'player',...start,life:1.1,request:{weaponId:mode==='shotgun'?'shotgun':'rifle',damage:20,speed:1000,radius:7,angle:Math.atan2(-normal.y,-normal.x),penetration:1,splashRadius:mode==='grenade'?80:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   // Seven 7px steps remain legal; the eighth crosses the radius-7 boundary.
   for(let i=0;i<7;i++)game['updateBullets'](.007);
   expect(events).toEqual([]);expect(game.bullets).toHaveLength(1);
   expect(game.bullets[0].x).toBeCloseTo(previous.x,6);expect(game.bullets[0].y).toBeCloseTo(previous.y,6);
   game['updateBullets'](.007);
   if(mode==='grenade'){
    expect(events).toEqual([]);expect(game.bullets).toHaveLength(1);expect(game.bullets[0].request.speed).toBe(0);
    game['updateBullets'](.5);expect(events).toEqual([]);
    expect(game.bullets[0].x).toBeCloseTo(previous.x,6);expect(game.bullets[0].y).toBeCloseTo(previous.y,6);
    game['updateBullets'](.55);
   }
   expect(game.bullets).toHaveLength(0);expect(events).toHaveLength(1);
   const event=events[0],expected=mode==='shotgun'?face:previous;
   expect(event.type).toBe(mode==='grenade'?'explosion':'hit');expect(event.x).toBeCloseTo(expected.x,4);expect(event.y).toBeCloseTo(expected.y,4);
   if(mode==='shotgun'){expect(event.wall?.x).toBeCloseTo(normal.x,6);expect(event.wall?.y).toBeCloseTo(normal.y,6);}else expect(event.wall).toBeUndefined();
  }
 });
 it('traces along-face and corner grazing with real player and hazard projectiles',()=>{
  for(const kind of ['player','hazard'] as const)for(const y of [232,234]){
   const events:GameEffect[]=[],game=setup(e=>events.push(e));
   game.bullets.push({kind,x:290,y,life:2,request:{weaponId:'shotgun',damage:20,speed:1000,radius:7,angle:0,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   for(let i=0;i<38;i++)game['updateBullets'](.007);
   if(y===232){expect(events).toEqual([]);expect(game.bullets).toHaveLength(1);expect(game.bullets[0].x).toBeCloseTo(556);expect(game.bullets[0].y).toBe(y);}
   else{expect(game.bullets).toHaveLength(0);expect(events).toHaveLength(1);expect(events[0].type).toBe('hit');
    if(kind==='player'){expect(events[0].x).toBeCloseTo(320,4);expect(events[0].y).toBeCloseTo(240,4);expect(events[0].wall!.x).toBeLessThan(0);expect(events[0].wall!.y).toBeLessThan(0);expect(Math.hypot(events[0].wall!.x,events[0].wall!.y)).toBeCloseTo(1);}
    else{expect(events[0].x).toBe(311);expect(events[0].y).toBe(234);expect(events[0].wall).toBeUndefined();}
   }
  }
 });
 it('keeps grenade splash behind A occluded while damaging a same-side target',()=>{
  const events:GameEffect[]=[],game=setup(e=>events.push(e));
  const exposed=game.enemies.spawn('crawler',260,360),shielded=game.enemies.spawn('crawler',548,300);
  expect(exposed.spawned).toBe(true);expect(shielded.spawned).toBe(true);if(!exposed.spawned||!shielded.spawned)throw new Error('legal splash fixtures did not spawn');
  const beforeExposed=game.enemies.getSnapshot(exposed.enemy.id)!.health,beforeShielded=game.enemies.getSnapshot(shielded.enemy.id)!.health;
  game.bullets.push({kind:'grenade',x:309,y:300,life:.01,request:{weaponId:'rocket',damage:20,speed:0,radius:7,angle:0,penetration:1,splashRadius:300,knockback:0},tracker:new ProjectileHitTracker(1)});
  game['updateBullets'](.02);expect(game.bullets).toHaveLength(0);
  expect(events.filter(e=>e.type==='explosion')).toEqual([{type:'explosion',x:309,y:300,radius:300,elements:[]}]);
  expect(game.enemies.getSnapshot(exposed.enemy.id)!.health).toBeLessThan(beforeExposed);expect(game.enemies.getSnapshot(shielded.enemy.id)!.health).toBe(beforeShielded);
 });
 it('rejects radius-14 crawler edge drops without relocation on every accessible face',()=>{
  expect(ENEMIES.crawler.radius).toBe(14);
  for(const {face,normal} of accessibleFaces){
   const game=setup(),p=outward(face,normal,15);
   expect(canOccupyExpedition(game.geometry,p,ENEMIES.crawler.radius)).toBe(true);expect(canOccupyExpedition(game.geometry,p,16)).toBe(false);
   expect(game.pickups.spawn('credits',10,p.x,p.y)).toEqual({spawned:false,reason:'invalid'});
   const reasons=new Set<string>();for(let i=0;i<200;i++){const result=game.pickups.rollEnemyDrop('crawler',p.x,p.y);expect(result.dropped).toBe(false);if(!result.dropped)reasons.add(result.reason);}
   expect([...reasons].sort()).toEqual(['chance','invalid-position']);expect(game.pickups.snapshot).toHaveLength(0);
   const credits=game.combat.snapshot.credits;game['collectLoot'](true);expect(game.combat.snapshot.credits).toBe(credits);
  }
 });
 it('admits legal crawler drops and attracts them along all accessible faces including island east sides',()=>{
  for(const {face,normal} of accessibleFaces){
   const game=setup(),p=outward(face,normal,28),player=outward(face,normal,88);
   expect(canOccupyExpedition(game.geometry,p,16)).toBe(true);expect(canTraverseExpedition(game.geometry,p,player,16)).toBe(true);
   Object.assign(game.player,player);let dropped=false;
   for(let i=0;i<200&&!dropped;i++)dropped=game.pickups.rollEnemyDrop('crawler',p.x,p.y).dropped;
   expect(dropped).toBe(true);const initial=game.pickups.snapshot[0];expect(initial.x).toBe(p.x);expect(initial.y).toBe(p.y);
   game.update(50);expect(game.pickups.snapshot).toHaveLength(1);
   expect(Math.hypot(game.pickups.snapshot[0].x-player.x,game.pickups.snapshot[0].y-player.y)).toBeLessThan(60);
   for(let i=0;i<40&&game.pickups.snapshot.length;i++){game.update(50);for(const pickup of game.pickups.snapshot)expect(canOccupyExpedition(game.geometry,pickup,16)).toBe(true);}
   expect(game.pickups.snapshot).toHaveLength(0);expect(game.player.x).toBe(player.x);expect(game.player.y).toBe(player.y);
  }
 });
 it('runs the actual room-2 director, warning delay, mixed spawns, clear sweep and reward progression within a bounded CPU simulation',()=>{
  const events:GameEffect[]=[],game=new DepthGame(e=>events.push(e));game.newRun(137);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  // Finish room 1 through its real director, using deterministic damage rather than a combat-skill claim.
  const finish=()=>{let frames=0;for(;frames<2000&&game.status==='playing';frames++){game.update(50);for(const e of game.enemies.snapshot.enemies)game.damage(e.id,100000);}expect(frames).toBeLessThan(2000);expect(game.status).toBe('reward');};
  finish();game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);game.route(game.node.next[0]);
  expect(game.node.templateId).toBe('passenger-vault');expect(game.node.depth).toBe(1);expect(game.expedition.run.currentNodeId).toBe(game.node.id);
  expect(game.storyRoom?.objective).toBe('Clear the occupied pod rows.');
  const plan=game['director'].plan,first=plan.schedule[0],chosen=game.geometry.breaches.find(b=>b.id===first.breachId)!;
  Object.assign(game.player,chosen);events.length=0;
  for(let i=0;i<13;i++)game.update(50);
  const warning=events.find(e=>e.type==='enemy-warning')!;expect(warning).toBeDefined();expect(warning.durationMs).toBe(650);
  const safe=[...game.geometry.breaches].sort((a,b)=>Math.hypot(b.x-chosen.x,b.y-chosen.y)-Math.hypot(a.x-chosen.x,a.y-chosen.y))[0];
  expect(warning.x).toBe(safe.x+(safe.facing==='east'?56:-56));expect(warning.y).toBe(safe.y);expect(game.enemies.activeCount).toBe(0);
  for(let i=0;i<12;i++)game.update(50);expect(game.enemies.activeCount).toBe(0);game.update(50);expect(game.enemies.activeCount).toBe(1);
  const seen=new Set<number>(),families=new Set<string>();let peak=0,frames=0;
  for(;frames<2000&&game.status==='playing';frames++){
   for(const e of game.enemies.snapshot.enemies){seen.add(e.id);families.add(e.type);expect(canOccupyExpedition(game.geometry,e,e.radius)).toBe(true);}
   peak=Math.max(peak,game.enemies.activeCount);
   // Allow an initial mixed crowd to run, then remove enemies through production death handling.
   if(frames>=30)for(const e of game.enemies.snapshot.enemies)game.damage(e.id,100000);
   if(game['director'].snapshot.remaining===0&&game.enemies.activeCount===0&&game['pending'].length===0){
    game.pickups.reset(137);expect(game.pickups.spawn('credits',10,600,440).spawned).toBe(true);
    const credits=game.combat.snapshot.credits;game.update(50);expect(game.combat.snapshot.credits).toBe(credits+10);break;
   }
   game.update(50);
  }
  expect(frames).toBeLessThan(2000);expect(seen.size).toBe(plan.totalSpawns);expect(families).toEqual(new Set(plan.schedule.map(s=>s.enemyId)));expect(families.size).toBeGreaterThan(1);expect(peak).toBeGreaterThan(1);
  expect(game['director'].phase).toBe('complete');expect(game.status).toBe('reward');expect(game.pickups.snapshot).toHaveLength(0);expect(game.encounterRemaining).toBe(0);
  expect(game.expedition.run.completedNodeIds).toContain(game.node.id);expect(game.expedition.resources.credits).toBe(game.combat.snapshot.credits);
  const offers=expeditionRewardOffers(game.expedition);if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();expect(game.status).toBe('route');game.route(game.node.next[0]);expect(game.node.depth).toBe(2);
 });
 it('renders closed single-tier reservations above a continuous deck, no old wells or exposed bodies',()=>{
  const group=authoredRoom('passenger-vault',ROOM_TEMPLATES[node.templateId])!;group.updateMatrixWorld(true);
  expect(group.userData.sealedPassengers).toBe(16);expect(group.userData.storyFixtures).toHaveLength(8);
  const ray=new T.Raycaster();for(const [x,y,w,h,maxHeight] of rectangles){ray.set(new T.Vector3((x+w/2)/32,10,(y+h/2)/32),new T.Vector3(0,-1,0));const hit=ray.intersectObject(group,true)[0];expect(hit).toBeDefined();expect(hit.point.y).toBeGreaterThan(0);expect(hit.point.y).toBeLessThanOrEqual(maxHeight/32+.001);}
  group.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;expect(m.color?.getHex()).not.toBe(0xb5a48e);o.geometry.computeBoundingBox();expect(o.geometry.boundingBox!.min.y).toBeGreaterThan(-1);}});disposeModel(group);
 });
});
