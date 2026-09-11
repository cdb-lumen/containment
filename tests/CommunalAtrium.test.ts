import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {EnvironmentMaterials} from '../src/render/EnvironmentMaterials';
import {MAT,disposeModel} from '../src/render/meshParts';
import {generateRun} from '../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {DepthGame} from '../src/DepthGame';
import {ProjectileHitTracker} from '../src/game/combat/CombatSystem';
const node=generateRun(3,3).nodes.find(n=>n.templateId==='communal-atrium')!;
// Independent expected footprints: inward-facing offset court with the basin
// at its north end. The main passage now runs outside the southern island.
const rectangles=[[250,100,260,90],[450,350,260,90],[270,190,220,26],[470,324,220,26],[224,120,26,70],[710,350,26,70],[510,120,80,60],[330,84,96,16]];
const polygons=rectangles.map(([x,y,w,h])=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]);
const point=(x:number,y:number)=>({x,y});
const routes=[[[100,440],[170,440],[170,490],[1010,490],[1010,440],[1100,440]],[[100,440],[170,440],[170,45],[1010,45],[1010,440],[1100,440]],[[100,440],[170,440],[170,530],[1010,530],[1010,440],[1100,440]],[[170,270],[400,270],[600,270],[800,270],[1010,270]],[[400,270],[400,490]],[[800,270],[800,490]]].map(r=>r.map(([x,y])=>point(x,y)));
function renderer(){
 const surfaces=Object.assign(Object.create(EnvironmentMaterials.prototype),{floor:new T.MeshStandardMaterial(),wall:new T.MeshStandardMaterial(),cover:new T.MeshStandardMaterial()});
 return Object.assign(Object.create(DepthRenderer.prototype),{scene:new T.Scene(),world:new T.Group(),effects:{clear(){},setWorld(){}},temporaryMaterials:[],actors:new Map(),nests:new Map(),queen:null,corpses:[],pickupMeshes:new Map(),poolMeshes:new Map(),pendingShots:[],afflictions:{clear(){}},muzzle:{intensity:0},contacts:{begin(){},end(){}},surfaces,floorMaterial:surfaces.floor,camera:new T.OrthographicCamera(-20,20,15,-15),focus:new T.Vector3(),lighting:{loadRoom(){}}});
}
function meshes(root:T.Object3D){const all:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)all.push(o);});return all;}
function hit(root:T.Object3D,x:number,y:number){root.updateMatrixWorld(true);return new T.Raycaster(new T.Vector3(x/32,6,y/32),new T.Vector3(0,-1,0)).intersectObject(root,true)[0];}
function setup(){const game=new DepthGame();game.node=node;game.geometry=createExpeditionGeometry(node);game.navigation=new FacilityNavigation(game.geometry);game.status='playing';Object.assign(game.player,game.geometry.playerSpawn);return game;}
describe('Communal Atrium inward-facing garden court rough',()=>{
 it('redistributes existing seating and brings the south enclosure to the preserved through-passage',()=>{
  const t=ROOM_TEMPLATES[node.templateId];expect(t.voids).toEqual(polygons);expect(t.obstacles).toEqual([]);
  expect(t.boundary).toEqual([[0,0],[1200,0],[1200,580],[0,580]].map(([x,y])=>point(x,y)));
  expect(t.spawn).toEqual(point(100,440));expect(t.exit).toEqual(point(1100,440));
  expect(t.breaches).toEqual([[100,100],[1100,100],[100,500],[1100,500]].map(([x,y])=>point(x,y)));
 });
 it('sweeps all encounter radii through the main passage and both outer loops, then walks real player input',()=>{
  const game=setup(),g=game.geometry;
  for(const route of routes)for(let i=1;i<route.length;i++)for(const r of [14,16,17,18,24,28,30,38]){
   expect(canTraverseExpedition(g,route[i-1],route[i],r)).toBe(true);expect(canTraverseExpedition(g,route[i],route[i-1],r)).toBe(true);
  }
  for(const route of routes){Object.assign(game.player,route[0]);for(const target of route.slice(1)){
   for(let i=0;i<400&&Math.hypot(target.x-game.player.x,target.y-game.player.y)>=2;i++){
    const dx=target.x-game.player.x,dy=target.y-game.player.y;
    game.update(Math.min(50,Math.hypot(dx,dy)/220*1000),{x:dx,y:dy,fire:false,angle:null,autoAim:false});
    expect(canOccupyExpedition(g,game.player,16)).toBe(true);
   }expect(Math.hypot(target.x-game.player.x,target.y-game.player.y)).toBeLessThan(2);
  }}
  for(const p of [point(170,210),point(990,330),point(600,490)])expect(canOccupyExpedition(g,p,38)).toBe(true);
 });
 it('routes live crawlers and brutes from both courts and every inward breach to both ends of the gathering passage',()=>{
  const geometry=createExpeditionGeometry(node);
  const starts=[point(380,260),point(780,340),...geometry.breaches.map(b=>point(b.x+(b.facing==='east'?56:-56),b.y))];
  for(const target of [point(280,490),point(860,490),point(550,270)])for(const type of ['crawler','brute'] as const)for(const start of starts){
   const game=setup();Object.assign(game.player,target);expect(canOccupyExpedition(geometry,start,38)).toBe(true);
   const spawned=game.enemies.spawn(type,start.x,start.y);expect(spawned.spawned).toBe(true);if(!spawned.spawned)continue;
   let steps=0;for(;steps<1200;steps++){const e=game.enemies.getSnapshot(spawned.enemy.id)!;expect(canOccupyExpedition(geometry,e,e.radius)).toBe(true);if(Math.hypot(e.x-target.x,e.y-target.y)<80)break;game.enemies.update(50,game.player);}
   expect(steps,JSON.stringify({start,target,type})).toBeLessThan(1200);
  }
 });
 it('passes real shots along the passage and blocks shots on garden, seating and water silhouettes',()=>{
  for(const kind of ['player','hazard'] as const)for(const [x,y,angle,blocked] of [[300,490,0,false],[170,145,0,true],[580,270,Math.PI/2,true],[550,250,-Math.PI/2,true]] as const){
   const game=setup();game.bullets.push({kind,x,y,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   for(let i=0;i<8;i++)game['updateBullets'](.05);expect(game.bullets).toHaveLength(blocked?0:1);
  }
  expect(hasClearExpeditionShot(setup().geometry,point(170,490),point(1010,490))).toBe(true);
  expect(hasClearExpeditionShot(setup().geometry,point(100,440),point(1100,440))).toBe(false);
 });
 it('collects real drops at seat and water approaches and never leaves relocated drops in any fixture',()=>{
  for(const p of [point(380,250),point(780,330),point(550,220),point(170,145),point(580,270),point(600,490),point(990,330)]){
   const game=setup();game.navigation.prepare(game.player,1);expect(game.navigation.reachable(p)).toBe(true);
   expect(game.pickups.spawn('credits',10,p.x,p.y).spawned).toBe(true);Object.assign(game.player,p);const before=game.combat.snapshot.credits;game.update(50);expect(game.pickups.snapshot).toHaveLength(0);expect(game.combat.snapshot.credits).toBe(before+10);
  }
  for(const [x,y,w,h] of rectangles){const game=setup();game.pickups.spawn('armor',10,x+w/2,y+h/2);for(const p of game.pickups.snapshot)expect(canOccupyExpedition(game.geometry,p,16)).toBe(true);}
 });
 it('turns both southern seat backs away from the shared court without moving the north enclosure',()=>{
  const r=renderer();r.loadRoom(node);const equipment=r.world.getObjectByName('communal-atrium-rough')!;
  for(const [x,y] of [[380,193],[580,347],[713,390]])expect(hit(equipment,x,y)?.point.y! *32).toBeCloseTo(44);
  for(const [x,y] of [[380,212],[580,328],[732,390]])expect(hit(equipment,x,y)!.point.y*32).toBeCloseTo(24);
  expect(hit(equipment,780,225)).toBeUndefined();
  expect(hit(equipment,64,-13)!.point.y*32).toBeCloseTo(84);
  expect(canOccupyExpedition(createExpeditionGeometry(node),point(550,270),38)).toBe(true);
  disposeModel(r.world);
 });
 it('draws the physical south enclosure and no floor beyond it without shrinking the camera envelope',()=>{
  const r=renderer();r.loadRoom(node);const g=createExpeditionGeometry(node);
  expect(ROOM_TEMPLATES[node.templateId].height).toBe(880);
  expect(canOccupyExpedition(g,point(600,650),0)).toBe(false);
  expect(hit(r.world,600,650)).toBeUndefined();expect(hit(r.world,600,800)).toBeUndefined();
  expect(hit(r.world,600,580)!.point.y*32).toBeGreaterThan(16);
  const wall=new T.Raycaster(new T.Vector3(600/32,.5,570/32),new T.Vector3(0,0,1),0,20/32).intersectObject(r.world,true);
  expect(wall.length).toBeGreaterThan(0);disposeModel(r.world);
 });
 it('renders every physical footprint without ghost satellite plinths, with contained tree crowns and owned bounded palette',()=>{
  const sharedBefore=Object.values(MAT).map(m=>[m.color.getHex(),m.metalness,m.roughness,m.emissive.getHex(),m.emissiveIntensity]);
  const r=renderer();r.loadRoom(node);const all=meshes(r.world),equipment=r.world.getObjectByName('communal-atrium-rough');expect(equipment).toBeDefined();if(!equipment)return;
  const materials=new Set(meshes(equipment).map(m=>m.material as T.MeshStandardMaterial));expect([...materials].map(m=>m.name)).toContain('ca_soil');expect(materials.size).toBeLessThanOrEqual(8);
  expect(all.length).toBeLessThanOrEqual(32);expect(all.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3,0)).toBeLessThan(45000);
  // Dense vertical physical occupancy compares real batched triangles to queries.
  // Flush floor markings and perimeter architecture are outside these probes.
  const g=createExpeditionGeometry(node);
  for(let x=150;x<=1050;x+=10)for(let y=40;y<=550;y+=10){
   const actual=hit(equipment,x+.37,y+.41);const raised=actual!==undefined&&actual.point.y*32>1;
   expect(raised,`${x}/${y}`).toBe(!canOccupyExpedition(g,point(x+.37,y+.41),0));
  }
  for(const p of [point(170,210),point(990,330),point(600,490)])expect(hit(equipment,p.x,p.y)).toBeUndefined();
  const leaves=meshes(equipment).filter(m=>(m.material as T.Material).name==='ca_leaf');expect(leaves).toHaveLength(1);
  const bounds=new T.Box3().setFromObject(leaves[0]);expect(bounds.max.y*32).toBeGreaterThan(105);expect(bounds.max.y*32).toBeLessThanOrEqual(130);
  for(const m of materials){expect(Object.values(MAT)).not.toContain(m);expect(m.userData.actorMaterial).toBe(true);expect(m.emissiveIntensity).toBeLessThan(.5);}
  expect(Object.values(MAT).map(m=>[m.color.getHex(),m.metalness,m.roughness,m.emissive.getHex(),m.emissiveIntensity])).toEqual(sharedBefore);expect(r.roomLoading).toBe(false);
  const shared=Object.values(MAT).map(m=>vi.spyOn(m,'dispose')),owned=[...materials].map(m=>vi.spyOn(m,'dispose')),geometry=meshes(equipment).map(m=>vi.spyOn(m.geometry,'dispose'));
  r.loadRoom({...node,id:'next',templateId:'crew-checkpoint'});for(const s of [...owned,...geometry])expect(s).toHaveBeenCalledTimes(1);for(const s of shared)expect(s).not.toHaveBeenCalled();expect(r.surfaces.floor.color.getHex()).toBe(0x646d70);expect(r.surfaces.cover.color.getHex()).toBe(0x7e8b8d);
  disposeModel(r.world);vi.restoreAllMocks();
 });
});
