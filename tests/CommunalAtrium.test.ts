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
// Keep both rejected layouts as real contact-event negative controls.
const rejectedRectangles=[[550,250,100,100],[460,250,26,130],[714,250,26,130],[560,190,80,60],[560,174,80,16]];
const entranceRectangles=[[330,250,100,100],[220,280,26,130],[490,280,26,130],[340,190,80,60],[340,174,80,16]];
const sharedTableRectangles=[[245,205,110,110],[155,182,70,36],[480,225,280,70],[500,176,240,28],[500,316,240,28],[910,232.5,80,55]];
const rectangles=[[280,280,96,72],[280,352,96,28],[376,324,64,56],[760,280,96,72],[760,352,96,28],[856,324,64,56]];
const approaches=[[328,424],[408,424],[808,424],[888,424],[328,230],[808,230]].map(([x,y])=>({x,y}));
const polygons=rectangles.map(([x,y,w,h])=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]);
const point=(x:number,y:number)=>({x,y});
const routes=[[[100,440],[1100,440]],[[100,440],[100,180],[1100,180],[1100,440]],[[600,100],[600,500]],[[200,180],[200,500]],[[1000,180],[1000,500]],...approaches.map(t=>[[t.x,t.y>380?440:180],[t.x,t.y]])].map(r=>r.map(([x,y])=>point(x,y)));
function renderer(){
 const surfaces=Object.assign(Object.create(EnvironmentMaterials.prototype),{floor:new T.MeshStandardMaterial(),wall:new T.MeshStandardMaterial(),cover:new T.MeshStandardMaterial()});
 return Object.assign(Object.create(DepthRenderer.prototype),{scene:new T.Scene(),world:new T.Group(),effects:{clear(){},setWorld(){}},temporaryMaterials:[],actors:new Map(),nests:new Map(),queen:null,corpses:[],pickupMeshes:new Map(),poolMeshes:new Map(),pendingShots:[],afflictions:{clear(){}},muzzle:{intensity:0},contacts:{begin(){},end(){}},surfaces,floorMaterial:surfaces.floor,camera:new T.OrthographicCamera(-20,20,15,-15),focus:new T.Vector3(),lighting:{loadRoom(){}}});
}
function meshes(root:T.Object3D){const all:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)all.push(o);});return all;}
function hit(root:T.Object3D,x:number,y:number){root.updateMatrixWorld(true);return new T.Raycaster(new T.Vector3(x/32,6,y/32),new T.Vector3(0,-1,0)).intersectObject(root,true)[0];}
function setup(){const game=new DepthGame();game.node=node;game.geometry=createExpeditionGeometry(node);game.navigation=new FacilityNavigation(game.geometry);game.enemies=game['makeEnemies']();game.status='playing';Object.assign(game.player,game.geometry.playerSpawn);return game;}
describe('Communal Atrium connected-bay rough',()=>{
 it('retains rejected entrance and south-stance clearance controls',()=>{
  const g=setup().geometry,old={...g,voids:entranceRectangles.map(([x,y,w,h])=>[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)])};
  for(const radius of [14,16,17,18,24,28,30,38]){
   expect(canOccupyExpedition(old,point(400,270),radius)).toBe(false);
   expect(canTraverseExpedition(old,point(400,270),point(400,490),radius)).toBe(false);
   expect(canTraverseExpedition(g,point(200,270),point(200,490),radius)).toBe(true);
  }
  for(const x of [328,408,808,888]){
   expect(canTraverseExpedition(g,point(x,440),point(x,414),38)).toBe(false);
   expect(canTraverseExpedition(g,point(x,440),point(x,424),38)).toBe(true);
  }
 });
 it('preserves 78 historical shared-table contacts and 15 stalls, and tests 48 connected-bay contacts',()=>{
  const run=(historical:number[][]|null,start:{x:number;y:number},target:{x:number;y:number})=>{
   const game=setup();
   if(historical)game.geometry={...game.geometry,voids:historical.map(([x,y,w,h])=>[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)])};
   game.navigation=new FacilityNavigation(game.geometry);game.enemies=game['makeEnemies']();Object.assign(game.player,target);
   expect(canOccupyExpedition(game.geometry,start,28)).toBe(true);expect(canOccupyExpedition(game.geometry,target,28)).toBe(true);
   const spawned=game.enemies.spawn('brute',start.x,start.y);expect(spawned.spawned).toBe(true);if(!spawned.spawned)throw Error('Brute spawn rejected');
   let steps=0,contact=false;
   const unsubscribe=game.enemies.subscribe(event=>{if(event.type==='contact-attack'&&event.enemyId===spawned.enemy.id)contact=true;});
   for(;steps<1200;steps++){
    const e=game.enemies.getSnapshot(spawned.enemy.id)!;expect(e.radius).toBe(28);expect(canOccupyExpedition(game.geometry,e,e.radius)).toBe(true);
    if(contact)break;
    game.navigation.prepare(game.player,1);game.enemies.update(50,game.player);
   }
   unsubscribe();
   return {steps,contact,final:game.enemies.getSnapshot(spawned.enemy.id)!};
  };
  for(const start of [point(900,340),point(600,140)]){
   const old=run(rejectedRectangles,start,point(520,300));expect(old.steps).toBe(1200);expect(old.contact).toBe(false);
   expect(old.final.x).toBeCloseTo(528,0);expect(old.final.y).toBeGreaterThan(204);expect(old.final.y).toBeLessThan(210);
   expect(Math.hypot(old.final.x-520,old.final.y-300)).toBeGreaterThan(90);
  }
  const starts=[[100,440],[900,340],[600,140],[300,440],[600,490],[520,450],[680,450],[520,140],[680,140],[156,100],[1044,100],[156,500],[1044,500]].map(([x,y])=>point(x,y));
  for(const start of starts){const old=run(entranceRectangles,start,point(458,345));expect(old.contact).toBe(false);expect(old.steps).toBe(1200);}
  for(const target of [point(440,260),point(800,260),point(620,130),point(620,390),point(860,260),point(390,260)])for(const start of starts){const result=run(sharedTableRectangles,start,target);expect(result.contact,JSON.stringify({start,target})).toBe(true);expect(result.steps).toBeLessThan(1200);}
  for(const target of approaches)for(const [x,y] of [[100,440],[1100,440],[600,140],[600,500],[156,100],[1044,100],[156,500],[1044,500]]){const start=point(x,y),result=run(null,start,target);expect(result.contact,JSON.stringify({start,target})).toBe(true);expect(result.steps).toBeLessThan(1200);}
 // Full-suite contention must not truncate any historical or current cases.
 },20000);
 it('uses the exact six preflighted footprints and preserves enclosure, spawn, exit and breaches',()=>{
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
  for(const p of [point(100,210),point(1050,330),point(600,490)])expect(canOccupyExpedition(g,p,38)).toBe(true);
 });
 it('routes live crawlers and brutes from both courts and every inward breach to both ends of the gathering passage',()=>{
  const geometry=createExpeditionGeometry(node);
  const starts=[point(600,260),point(1000,340),...geometry.breaches.map(b=>point(b.x+(b.facing==='east'?56:-56),b.y))];
  for(const target of [point(280,490),point(860,490),point(600,420)])for(const type of ['crawler','brute'] as const)for(const start of starts){
   const game=setup();Object.assign(game.player,target);expect(canOccupyExpedition(geometry,start,38)).toBe(true);
   const spawned=game.enemies.spawn(type,start.x,start.y);expect(spawned.spawned).toBe(true);if(!spawned.spawned)continue;
   let steps=0;for(;steps<1200;steps++){const e=game.enemies.getSnapshot(spawned.enemy.id)!;expect(canOccupyExpedition(geometry,e,e.radius)).toBe(true);if(Math.hypot(e.x-target.x,e.y-target.y)<80)break;game.enemies.update(50,game.player);}
   expect(steps,JSON.stringify({start,target,type})).toBeLessThan(1200);
  }
 });
 it('passes real shots along the passage and blocks shots on garden, seating and water silhouettes',()=>{
  for(const kind of ['player','hazard'] as const)for(const [x,y,angle,blocked] of [[100,490,0,false],[328,230,Math.PI/2,true],[808,230,Math.PI/2,true],[328,424,-Math.PI/2,true],[808,424,-Math.PI/2,true],[408,424,-Math.PI/2,true],[888,424,-Math.PI/2,true]] as const){
   const game=setup();game.bullets.push({kind,x,y,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
   for(let i=0;i<8;i++)game['updateBullets'](.05);expect(game.bullets).toHaveLength(blocked?0:1);
  }
  expect(hasClearExpeditionShot(setup().geometry,point(170,490),point(1010,490))).toBe(true);
  expect(hasClearExpeditionShot(setup().geometry,point(100,440),point(1100,440))).toBe(true);
 });
 it('collects real drops at seat and water approaches and explicitly rejects fixture-center spawns',()=>{
  for(const p of [point(100,440),...approaches]){
   const game=setup();game.navigation.prepare(game.player,1);expect(game.navigation.reachable(p)).toBe(true);
   expect(game.pickups.spawn('credits',10,p.x,p.y).spawned).toBe(true);Object.assign(game.player,p);const before=game.combat.snapshot.credits;game.update(50);expect(game.pickups.snapshot).toHaveLength(0);expect(game.combat.snapshot.credits).toBe(before+10);
  }
  for(const [x,y,w,h] of rectangles){const game=setup();expect(game.pickups.spawn('armor',10,x+w/2,y+h/2)).toMatchObject({spawned:false,reason:'invalid'});expect(game.pickups.snapshot).toHaveLength(0);}
 });
 it('walks from the entrance to collect each seat and water drop without teleporting onto it',()=>{
  const pickupRoutes=approaches.map(t=>t.y>380?[[t.x,440],[t.x,t.y]]:[[100,180],[t.x,180],[t.x,t.y]]);
  for(const route of pickupRoutes){
   const game=setup(),[x,y]=route[route.length-1],before=game.combat.snapshot.credits;
   game.navigation.prepare(game.player,1);expect(game.navigation.reachable(point(x,y))).toBe(true);
   expect(game.pickups.spawn('credits',10,x,y).spawned).toBe(true);
   for(const [tx,ty] of route){
    let steps=0;
    for(;steps<400&&Math.hypot(tx-game.player.x,ty-game.player.y)>=2;steps++){
     const dx=tx-game.player.x,dy=ty-game.player.y;
     game.update(Math.min(50,Math.hypot(dx,dy)/220*1000),{x:dx,y:dy,fire:false,angle:null,autoAim:false});
     expect(canOccupyExpedition(game.geometry,game.player,game.player.radius)).toBe(true);
    }
    expect(steps).toBeLessThan(400);
   }
   expect(game.pickups.snapshot).toHaveLength(0);expect(game.combat.snapshot.credits).toBe(before+10);
  }
 });
 it('supports attached passage-facing seats and water without moving the north enclosure',()=>{
  const r=renderer();r.loadRoom(node);const equipment=r.world.getObjectByName('communal-atrium-rough')!;
  for(const x of [328,808]){
   expect(hit(equipment,x,355)!.point.y*32).toBeCloseTo(44);
   expect(hit(equipment,x,374)!.point.y*32).toBeCloseTo(24);
  }
  equipment.updateMatrixWorld(true);
  for(const x of [328,808]){
   const hits=new T.Raycaster(new T.Vector3(x/32,-1/32,366/32),new T.Vector3(0,1,0)).intersectObject(equipment,true);
   expect(hits[0].point.y*32).toBeCloseTo(0);
  }
  for(const p of approaches)expect(canOccupyExpedition(createExpeditionGeometry(node),p,28)).toBe(true);
  expect(hit(equipment,620,260)).toBeUndefined();
  expect(hit(equipment,64,-13)!.point.y*32).toBeCloseTo(84);
  expect(canOccupyExpedition(createExpeditionGeometry(node),point(328,316),16)).toBe(false);
  expect(hit(equipment,328,316)!.point.y*32).toBeGreaterThan(100);
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
  for(const p of [point(100,210),point(1050,330),point(600,490)])expect(hit(equipment,p.x,p.y)).toBeUndefined();
  const leaves=meshes(equipment).filter(m=>(m.material as T.Material).name==='ca_leaf');expect(leaves).toHaveLength(1);
  const bounds=new T.Box3().setFromObject(leaves[0]);expect(bounds.max.y*32).toBeGreaterThan(105);expect(bounds.max.y*32).toBeLessThanOrEqual(130);
  for(const m of materials){expect(Object.values(MAT)).not.toContain(m);expect(m.userData.actorMaterial).toBe(true);expect(m.emissiveIntensity).toBeLessThan(.5);}
  expect(Object.values(MAT).map(m=>[m.color.getHex(),m.metalness,m.roughness,m.emissive.getHex(),m.emissiveIntensity])).toEqual(sharedBefore);expect(r.roomLoading).toBe(false);
  const shared=Object.values(MAT).map(m=>vi.spyOn(m,'dispose')),owned=[...materials].map(m=>vi.spyOn(m,'dispose')),geometry=meshes(equipment).map(m=>vi.spyOn(m.geometry,'dispose'));
  r.loadRoom({...node,id:'next',templateId:'crew-checkpoint'});for(const s of [...owned,...geometry])expect(s).toHaveBeenCalledTimes(1);for(const s of shared)expect(s).not.toHaveBeenCalled();expect(r.surfaces.floor.color.getHex()).toBe(0x646d70);expect(r.surfaces.cover.color.getHex()).toBe(0x7e8b8d);
  disposeModel(r.world);vi.restoreAllMocks();
 });
});
