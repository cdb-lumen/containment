import {describe,it,expect} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
const node=generateRun(1729,3).nodes.find(n=>n.templateId==='shielding-gate')!;
function fixture(x:number,y:number){
 const game=new DepthGame();game.node=node;game.geometry=createExpeditionGeometry(node);game.enemies=game['makeEnemies']();
 const result=game.enemies.spawn('spitter',x,y);if(!result.spawned)throw Error('Legal spitter fixture must spawn');
 return {game,id:result.enemy.id,before:game.enemies.getSnapshot(result.enemy.id)!};
}
describe('production enemy swept movement',()=>{
 it('does not knock a spitter across the recorded Shielding Gate corner into a legal endpoint',()=>{
  // Native sourceaa4, frames420→421: both endpoints are legal, the intervening radius18 sweep is not.
  const from={x:289.3859237654455,y:107.50048220650496},to={x:281.2396715160295,y:187.0846425293285};
  const {game,id,before}=fixture(from.x,from.y);
  expect(canOccupyExpedition(game.geometry,from,before.radius)).toBe(true);
  expect(canOccupyExpedition(game.geometry,to,before.radius)).toBe(true);
  expect(canTraverseExpedition(game.geometry,from,to,before.radius)).toBe(false);
  const result=game.damage(id,20,{x:to.x-from.x,y:to.y-from.y});
  const after=game.enemies.getSnapshot(id)!;
  expect(result.applied).toBe(true);expect(after.health).toBe(before.health-20);
  expect(canTraverseExpedition(game.geometry,before,after,before.radius)).toBe(true);
  expect(Math.hypot(after.x-before.x,after.y-before.y)).toBeGreaterThan(0); // Retain a legal sliding fallback.
 });
 it('retains ordinary knockback and damage in open floor',()=>{
  const {game,id,before}=fixture(100,440);
  game.damage(id,20,{x:12,y:9});const after=game.enemies.getSnapshot(id)!;
  expect(after.x).toBeCloseTo(112);expect(after.y).toBeCloseTo(449);expect(after.health).toBe(before.health-20);
  expect(canTraverseExpedition(game.geometry,before,after,before.radius)).toBe(true);
 });
});
