import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {DepthGame} from '../src/DepthGame';
import {ProjectileHitTracker} from '../src/game/combat/CombatSystem';
import {generateRun} from '../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
import {relayRacksRoom} from '../src/render/RelayRacksRoom';
import {disposeModel} from '../src/render/models';
const node=generateRun(1729,3).nodes.find(n=>n.templateId==='relay-racks')!;
function fire(y:number,reverse:boolean){
 const game=new DepthGame();game.node=node;game.geometry=createExpeditionGeometry(node);game.enemies.reset();game.status='playing';
 Object.assign(game.player,{x:reverse?740:460,y,angle:reverse?Math.PI:0});
 game.combat.switchWeapon('pistol');const request=game.combat.fire(game.player.angle)[0];expect(request).toBeDefined();
 const bullet={x:game.player.x,y,life:2,kind:'player' as const,request,tracker:new ProjectileHitTracker(request.penetration)};game.bullets=[bullet];
 for(let i=0;i<40&&game.bullets.length&&(reverse?bullet.x>460:bullet.x<740);i++)game['updateBullets'](.01);
 return reverse?bullet.x<=460:bullet.x>=740;
}
describe('Room9 physical south gap',()=>{
 it.each([false,true])('passes a production pistol through y514 in direction %s, with solid and open controls',reverse=>{
  expect(fire(514,reverse)).toBe(true);
  expect(fire(440,reverse)).toBe(false);
  expect(fire(540,reverse)).toBe(true);
 });
 it('keeps the whole raised central fixture outside the swept pistol corridor, independently of muzzle height',()=>{
  const model=relayRacksRoom();model.updateMatrixWorld(true);
  try{
   const bounds=new T.Box3().setFromObject(model.getObjectByName('relay-fixture-4')!);
   // Production pistol radius4: y514 has a southern silhouette boundary of510.
   expect(bounds.max.z*32).toBeLessThanOrEqual(510.001);
   expect(bounds.max.y*32).toBeGreaterThan(50); // Retain raised equipment rather than flattening it.
  }finally{disposeModel(model);}
 });
 it('does not turn the narrow pistol clearance into a route through the fixture',()=>{
  const geometry=createExpeditionGeometry(node);
  for(const radius of [16,28,38])expect(canTraverseExpedition(geometry,{x:460,y:514},{x:740,y:514},radius)).toBe(false);
  expect(ROOM_TEMPLATES['relay-racks'].obstacles).toHaveLength(5);
 });
});
