import {describe,it,expect,vi} from 'vitest';
import {EnemySystem} from '../../src/game/enemies/EnemySystem';
import {DepthGame} from '../../src/DepthGame';
import {generateRun} from '../../src/game/roguelike/run';
import {createExpeditionGeometry} from '../../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {canOccupyExpedition,canTraverseExpedition} from '../../src/game/world/expeditionGeometry';

// Fresh bounded fixtures for the illegal-retreat class; not historical replay equality.
function scene(start:{x:number;y:number},player:{x:number;y:number},specials=true,elite=false,room?:string){
 const game=new DepthGame();if(room)game.node=generateRun(1729,3).nodes.find(n=>n.templateId===room)!;if(!specials)game.node={...game.node,id:'legacy-test'};
 game.geometry={...game.geometry,bounds:{x:0,y:0,width:1200,height:880},blockers:[],boundary:[{x:0,y:0},{x:1200,y:0},{x:1200,y:880},{x:0,y:880}],voids:undefined};
 if(room)game.geometry=createExpeditionGeometry(game.node);
 game.navigation=new FacilityNavigation(game.geometry);game.enemies=game['makeEnemies']();Object.assign(game.player,player);game.status='playing';
 const spawn=game.enemies.spawn('spitter',start.x,start.y,elite);if(!spawn.spawned)throw Error('fixture spawn');
 return {game,id:spawn.enemy.id};
}
function reachesDamage(game:DepthGame,id:number){
 const before=game.combat.snapshot.health+game.combat.snapshot.armor;
 for(let i=0;i<900&&game.combat.snapshot.health+game.combat.snapshot.armor===before;i++){
  const previous=game.enemies.getSnapshot(id)!;
  game.navigation.prepare(game.player,1);game['enemyEvents'](game.enemies.update(50,game.player));game['updateBullets'](.05);
  const current=game.enemies.getSnapshot(id)!;
  expect(canOccupyExpedition(game.geometry,current,current.radius)).toBe(true);
  expect(canTraverseExpedition(game.geometry,previous,current,current.radius)).toBe(true);
 }
 expect(game.combat.snapshot.health+game.combat.snapshot.armor).toBeLessThan(before);
}
describe('spitter reachable firing positions',()=>{
 it.each([[true,false],[true,true],[false,false],[false,true]])('escapes an illegal west retreat, specials=%s elite=%s',(specials,elite)=>{
  const {game,id}=scene({x:100,y:440},{x:200,y:440},specials,elite);reachesDamage(game,id);
 });
 it.each([
  [{x:1100,y:440},{x:1000,y:440}],
  [{x:600,y:100},{x:600,y:200}],
  [{x:600,y:780},{x:600,y:680}],
 ])('finds a firing position beside another boundary (%j)',(start,player)=>{const {game,id}=scene(start,player);reachesDamage(game,id);});
 it('retains the clear firing-position control',()=>{const {game,id}=scene({x:100,y:200},{x:200,y:440});reachesDamage(game,id);});
 it('keeps a reachable alternate goal stable while approaching firing range',()=>{
  const {game,id}=scene({x:100,y:440},{x:200,y:440});
  const route=vi.spyOn(game.navigation,'waypoint');
  for(let i=0;i<8;i++)game.enemies.update(50,game.player);
  expect(route.mock.calls.length).toBeGreaterThan(1);
  const goals=route.mock.calls.map(([,goal])=>({x:goal.x,y:goal.y}));
  expect(goals.every(goal=>goal.x===goals[0].x&&goal.y===goals[0].y)).toBe(true);
  expect(game.enemies.getSnapshot(id)).not.toBeNull();
 });
 it('bounds repeated searches when every candidate is disconnected',()=>{
  const route=vi.fn((enemy:{x:number;y:number})=>enemy);
  const enemies=new EnemySystem({route,canMove:()=>true,canAttack:()=>true});
  expect(enemies.spawn('spitter',100,440,false).spawned).toBe(true);
  for(let i=0;i<20;i++)enemies.update(50,{x:200,y:440});
  expect(route.mock.calls.length).toBeLessThan(100);
 });

 // Fresh executions of the documented Room17 coordinates, not recovered replay bytes.
 it.each([
  [{x:600,y:200},{x:600,y:300}],
  [{x:600,y:550},{x:600,y:500}],
  [{x:600,y:200},{x:240,y:395}],
  [{x:600,y:550},{x:240,y:395}],
  [{x:1044,y:780},{x:480,y:665}],
  [{x:156,y:780},{x:720,y:665}],
 ])('reaches actual damage in Room17 from %j toward %j',(start,player)=>{
  const {game,id}=scene(start,player,true,false,'shielding-gate');reachesDamage(game,id);
 });

 it('recovers after the player moves away from a cached firing goal',()=>{
  const {game,id}=scene({x:100,y:440},{x:200,y:440});
  for(let i=0;i<8;i++)game.enemies.update(50,game.player);
  Object.assign(game.player,{x:400,y:600});reachesDamage(game,id);
 });
 it('recovers after legal knockback changes the approach',()=>{
  const {game,id}=scene({x:100,y:440},{x:200,y:440});
  for(let i=0;i<8;i++)game.enemies.update(50,game.player);
  expect(game.enemies.moveBy(id,0,-60).blocked).toBe(false);reachesDamage(game,id);
 });

 // A fresh Room15 breach-to-anchor matrix; historical 300-case bytes remain unavailable.
 it.each([{x:156,y:100},{x:1044,y:100},{x:156,y:780},{x:1044,y:780}].flatMap(start=>
  [{x:600,y:440},{x:600,y:100},{x:600,y:780},{x:200,y:440},{x:1100,y:440}].map(player=>[start,player])))
 ('reaches actual damage in Room15 from %j toward %j',(start,player)=>{
  const {game,id}=scene(start,player,true,false,'infested-workshop');reachesDamage(game,id);
 });

});
