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
const oval=[[450,440],[470,375],[525,327],[600,310],[675,327],[730,375],[750,440],[730,505],[675,553],[600,570],[525,553],[470,505]].map(([x,y])=>({x,y}));
function renderer(){
 const surfaces=Object.assign(Object.create(EnvironmentMaterials.prototype),{floor:new T.MeshStandardMaterial(),wall:new T.MeshStandardMaterial(),cover:new T.MeshStandardMaterial()});
 return Object.assign(Object.create(DepthRenderer.prototype),{scene:new T.Scene(),world:new T.Group(),effects:{clear(){},setWorld(){}},temporaryMaterials:[],actors:new Map(),nests:new Map(),queen:null,corpses:[],pickupMeshes:new Map(),poolMeshes:new Map(),pendingShots:[],afflictions:{clear(){}},muzzle:{intensity:0},contacts:{begin(){},end(){}},surfaces,floorMaterial:surfaces.floor,camera:new T.OrthographicCamera(-20,20,15,-15),focus:new T.Vector3(),lighting:{loadRoom(){}}});
}
function meshes(root:T.Object3D){const all:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)all.push(o);});return all;}
function hit(root:T.Object3D,x:number,y:number){root.updateMatrixWorld(true);return new T.Raycaster(new T.Vector3(x/32,5,y/32),new T.Vector3(0,-1,0)).intersectObject(root,true)[0];}
describe('Communal Atrium rough shared room',()=>{
 it('routes live crawlers and brutes through both flanks and every inward breach',()=>{
  const geometry=createExpeditionGeometry(node);
  const pairs=[[[420,330],[840,260]],[[840,260],[420,330]],[[380,630],[780,560]],[[780,560],[380,630]],...geometry.breaches.map(b=>[[b.x+(b.facing==='east'?56:-56),b.y],[1100,440]])];
  for(const type of ['crawler','brute'] as const)for(const [start,target] of pairs){
   const game=new DepthGame();game.geometry=geometry;game.navigation=new FacilityNavigation(geometry);Object.assign(game.player,{x:target[0],y:target[1]});
   const spawned=game.enemies.spawn(type,start[0],start[1]);expect(spawned.spawned).toBe(true);if(!spawned.spawned)continue;
   for(let i=0;i<1200;i++){game.enemies.update(50,game.player);const e=game.enemies.getSnapshot(spawned.enemy.id)!;expect(canOccupyExpedition(geometry,e,e.radius)).toBe(true);}
   const e=game.enemies.getSnapshot(spawned.enemy.id)!;expect(Math.hypot(e.x-target[0],e.y-target[1])).toBeLessThan(80);
  }
 });
 it('stops real projectiles at the bed and admits a pickup in a freed corner',()=>{
  for(const kind of ['player','hazard'] as const){
   const game=new DepthGame();game.geometry=createExpeditionGeometry(node);game.navigation=new FacilityNavigation(game.geometry);game.status='playing';Object.assign(game.player,{x:100,y:440});
   game.bullets.push({kind,x:400,y:440,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle:0,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   game.update(50);expect(game.bullets).toHaveLength(0);
   expect(game.pickups.spawn('armor',10,458,318).spawned).toBe(true);expect(game.pickups.snapshot[0]).toMatchObject({x:458,y:318});
  }
 });
 it('installs only the proposed polygon and retains anchors and both satellites',()=>{
  const t=ROOM_TEMPLATES[node.templateId];expect(t.voids).toEqual([oval]);expect(t.boundary).toEqual([[0,0],[1200,0],[1200,880],[0,880]].map(([x,y])=>({x,y})));
  expect(t.obstacles).toEqual([{x:260,y:160,width:120,height:100},{x:830,y:610,width:120,height:100}]);expect(t.spawn).toEqual({x:100,y:440});expect(t.exit).toEqual({x:1100,y:440});
  expect(t.breaches).toEqual([[100,100],[1100,100],[100,780],[1100,780]].map(([x,y])=>({x,y})));
 });
 it('opens the old rectangular corners while preserving orbit, shot and breach routes',()=>{
  const g=createExpeditionGeometry(node);expect(canOccupyExpedition(g,{x:458,y:318},16)).toBe(true);expect(canOccupyExpedition(g,{x:600,y:440},16)).toBe(false);
  const routes=[[[100,440],[200,340],[420,330],[450,240],[800,240],[1000,340],[1100,440]],[[100,440],[200,540],[400,640],[750,640],[780,550],[1000,540],[1100,440]]];
  for(const route of routes)for(let i=1;i<route.length;i++)for(const r of [14,16,17,18,24,28,30,38]){const [a,b]=[route[i-1],route[i]].map(([x,y])=>({x,y}));expect(canTraverseExpedition(g,a,b,r)).toBe(true);expect(canTraverseExpedition(g,b,a,r)).toBe(true);}
  for(const goal of [g.playerSpawn,g.exitPoint]){const nav=new FacilityNavigation(g);nav.prepare(goal,1);for(const p of [g.playerSpawn,g.exitPoint,...g.breaches,...g.breaches.map(b=>({x:b.x+(b.facing==='east'?56:-56),y:b.y}))]){expect(canOccupyExpedition(g,p,38)).toBe(true);expect(nav.reachable(p)).toBe(true);}}
  expect(hasClearExpeditionShot(g,g.playerSpawn,g.exitPoint)).toBe(false);for(const y of [240,640])expect(hasClearExpeditionShot(g,{x:450,y},{x:750,y})).toBe(true);
 });
 it('renders the exact low garden, visible satellite corners and bounded owned palette through loadRoom',()=>{
  const sharedBefore=Object.values(MAT).map(m=>[m.color.getHex(),m.metalness,m.roughness,m.emissive.getHex(),m.emissiveIntensity]);
  const r=renderer();r.loadRoom(node);const all=meshes(r.world),equipment=r.world.getObjectByName('communal-atrium-rough');expect(equipment).toBeDefined();
  if(!equipment)return;
  const materials=new Set(meshes(equipment).map(m=>m.material as T.MeshStandardMaterial));expect([...materials].map(m=>m.name)).toContain('ca_soil');expect(materials.size).toBeLessThanOrEqual(8);
  expect(all.length).toBeLessThanOrEqual(32);expect(all.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3,0)).toBeLessThan(45000);
  for(const p of oval){const inward={x:p.x+(600-p.x)*.002,y:p.y+(440-p.y)*.002};expect(hit(equipment,inward.x,inward.y)!.point.y*32).toBeCloseTo(18,2);}
  expect(hit(equipment,458,318)).toBeUndefined();expect(hit(equipment,600,400)!.point.y*32).toBeCloseTo(14,2);
  for(const [x,y] of [[261,161],[379,259],[831,611],[949,709]])expect(hit(equipment,x,y)!.point.y*32).toBeCloseTo(6,2);
  for(const mesh of meshes(equipment)){const p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);if(v.x*32>440&&v.x*32<760&&v.z*32>300&&v.z*32<580){expect(v.y*32).toBeLessThanOrEqual(96.001);for(let j=0;j<oval.length;j++){const a=oval[j],b=oval[(j+1)%oval.length];expect((b.x-a.x)*(v.z*32-a.y)-(b.y-a.y)*(v.x*32-a.x)).toBeGreaterThanOrEqual(-.01);}}}}
  for(const m of materials){expect(Object.values(MAT)).not.toContain(m);expect(m.userData.actorMaterial).toBe(true);expect(m.emissiveIntensity).toBeLessThan(.5);}
  expect(Object.values(MAT).map(m=>[m.color.getHex(),m.metalness,m.roughness,m.emissive.getHex(),m.emissiveIntensity])).toEqual(sharedBefore);
  expect(r.roomLoading).toBe(false);
  const shared=Object.values(MAT).map(m=>vi.spyOn(m,'dispose')),owned=[...materials].map(m=>vi.spyOn(m,'dispose')),geometry=meshes(equipment).map(m=>vi.spyOn(m.geometry,'dispose'));
  r.loadRoom({...node,id:'next',templateId:'crew-checkpoint'});for(const s of [...owned,...geometry])expect(s).toHaveBeenCalledTimes(1);for(const s of shared)expect(s).not.toHaveBeenCalled();expect(r.surfaces.floor.color.getHex()).toBe(0x646d70);expect(r.surfaces.cover.color.getHex()).toBe(0x7e8b8d);
  disposeModel(r.world);vi.restoreAllMocks();
 });
});
