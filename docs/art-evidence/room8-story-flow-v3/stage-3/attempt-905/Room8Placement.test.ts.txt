import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom} from './AuthoredRooms';
import {disposeModel} from './meshParts';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {generateRun} from '../game/roguelike/run';
import {createExpeditionGeometry,canOccupyExpedition} from '../game/world/expeditionGeometry';
import {FacilityNavigation} from '../game/world/FacilityNavigation';
import {DepthGame} from '../DepthGame';
const id='breached-loading-bay';
const node=generateRun(1729,3).nodes.find(n=>n.templateId===id)!;
const routes=[[[140,440],[240,320],[370,235],[570,150],[770,160],[1020,360],[1080,520]],[[140,440],[220,510],[420,550],[590,620],[970,640],[1080,520]]];
describe('Room8 story-flow placement',()=>{
 it('places the outbound pallet in its accepted solid footprint',()=>{
  expect(ROOM_TEMPLATES[id].obstacles).toEqual([{x:300,y:600,width:100,height:70},{x:640,y:740,width:120,height:50}]);
  const geometry=createExpeditionGeometry(node);
  expect(canOccupyExpedition(geometry,{x:700,y:765},16)).toBe(false);
 });
 it('renders a continuous raised hull seal across the solid scar',()=>{
  const room=authoredRoom(id,ROOM_TEMPLATES[id])!;room.updateMatrixWorld(true);
  const seal=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name==='room8-hull-seal') as T.Mesh;
  expect(seal).toBeDefined();
  if(seal){
   const ray=new T.Raycaster();
   for(const [x,y] of [[460,307],[600,280],[680,410],[820,510],[900,459]]){
    ray.set(new T.Vector3(x/32,6,y/32),new T.Vector3(0,-1,0));
    const hit=ray.intersectObject(seal)[0];expect(hit).toBeDefined();expect(hit.point.y).toBeGreaterThan(.1);
   }
  }
  disposeModel(room);
 });
 it('keeps both accepted loops usable for player and large actors in runtime geometry',()=>{
  const geometry=createExpeditionGeometry(node),navigation=new FacilityNavigation(geometry);navigation.prepare(geometry.playerSpawn,1);
  for(const route of routes)for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4);
   for(let j=0;j<=steps;j++)for(const radius of [16,28,38])expect(canOccupyExpedition(geometry,{x:a[0]+(b[0]-a[0])*j/steps,y:a[1]+(b[1]-a[1])*j/steps},radius)).toBe(true);
  }
  for(const p of [geometry.playerSpawn,geometry.exitPoint,...geometry.breaches])expect(navigation.reachable(p)).toBe(true);
  for(const route of routes)for(const radius of [16,28,38]){
   const game=new DepthGame();game.geometry=geometry;
   for(let i=1;i<route.length;i++){
    const a=route[i-1],b=route[i],moved=game.moveCorpse({x:a[0],y:a[1],radius},b[0]-a[0],b[1]-a[1]);
    expect(moved.blocked).toBe(false);expect(moved.x).toBeCloseTo(b[0]);expect(moved.y).toBeCloseTo(b[1]);
   }
  }
 });
});
