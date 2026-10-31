import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {serviceShaftLanding} from '../../src/render/ServiceShaftLanding';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {appendEnvironment} from '../../src/render/ShipEnvironments';
import {DepthRenderer} from '../../src/render/DepthRenderer';
import {disposeModel} from '../../src/render/meshParts';
import {DepthGame} from '../../src/DepthGame';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {generateRun} from '../../src/game/roguelike/run';
const template=ROOM_TEMPLATES['service-shaft-landing'];
const points=[[340,240],[900,240],[900,540],[1200,540],[1200,640],[340,640]].map(([x,y])=>({x,y}));
const geometry=createExpeditionGeometry({id:'shaft-test',templateId:'service-shaft-landing'} as any);
function bake(root:T.Group){const world=new T.Group();appendEnvironment(world,root);const r=Object.create(DepthRenderer.prototype) as any;r.world=world;r.floorMaterial=new T.MeshStandardMaterial();r.bakeWorld();r.floorMaterial.dispose();world.updateMatrixWorld(true);return world;}
describe('Room14 accepted C balcony rough placement',()=>{
 it('exposes a rear truss above the deck without moving it onto the route',()=>{
  const root=serviceShaftLanding(template);root.updateMatrixWorld(true);
  const rear=root.getObjectByName('rear-truss');expect(rear).toBeTruthy();
  const bounds=new T.Box3().setFromObject(rear!,true);
  expect(bounds.max.y*32).toBeGreaterThan(60);
  expect(bounds.max.z*32).toBeLessThan(310);
  expect(bounds.min.z*32).toBeGreaterThan(240);
  // From the shipping camera direction, the upper diagonal must be first hit.
  const target=new T.Vector3(525/32,45/32,285/32);
  const direction=new T.Vector3(0,36,26).normalize();
  const hits=new T.Raycaster(target.clone().addScaledVector(direction,50),direction.negate()).intersectObject(root,true);
  expect(hits[0]?.object.parent).toBe(rear);
  disposeModel(root);
 });
 it('builds sheave hubs, spokes and bearing supports as connected assemblies',()=>{
  const root=serviceShaftLanding(template);root.updateMatrixWorld(true);
  for(const x of [478,682]){
   const wheel=root.getObjectByName(`sheave-${x}`);expect(wheel).toBeTruthy();
   for(const name of ['rim','hub','axle','bearing-front','bearing-rear'])expect(wheel!.getObjectByName(name)).toBeTruthy();
   expect(wheel!.children.filter(o=>o.name==='spoke')).toHaveLength(4);
   const axle=new T.Box3().setFromObject(wheel!.getObjectByName('axle')!,true);
   expect(axle.min.z*32).toBeLessThanOrEqual(411);
   expect(axle.max.z*32).toBeGreaterThanOrEqual(449);
  }
  disposeModel(root);
 });
 it('ties the counterweight plates to both guide shoes with a load-bearing frame',()=>{
  const root=serviceShaftLanding(template);root.updateMatrixWorld(true);
  const frame=root.getObjectByName('weight-frame');expect(frame).toBeTruthy();
  const bounds=new T.Box3().setFromObject(frame!,true);
  expect(bounds.min.x*32).toBeLessThanOrEqual(497);
  expect(bounds.max.x*32).toBeGreaterThanOrEqual(663);
  expect(bounds.min.y*32).toBeLessThan(-105);
  expect(bounds.max.y*32).toBeGreaterThan(20);
  disposeModel(root);
 });
 it('owns deterministic worn deck grain and disposes its texture',()=>{
  const root=serviceShaftLanding(template);
  const floor=root.getObjectByName('connected-balcony')!.children[0] as T.Mesh;
  const material=floor.material as T.MeshStandardMaterial;
  expect(material.map).toBeInstanceOf(T.DataTexture);
  expect((material.map as T.DataTexture).image.width).toBe(64);
  let disposed=0;material.map!.addEventListener('dispose',()=>disposed++);
  disposeModel(root);expect(disposed).toBe(1);
 });
 it('keeps new deck finish flush and wall ribs outside walking space',()=>{
  const root=serviceShaftLanding(template);root.updateMatrixWorld(true);
  for(const name of ['deck-finish','wall-ribs']){
   const group=root.getObjectByName(name);expect(group).toBeTruthy();
   expect(group!.children.length).toBeGreaterThan(12);
   group!.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){
    const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
    if(name==='deck-finish'){expect(v.y*32).toBeLessThanOrEqual(.5);expect(canOccupyExpedition(geometry,{x:v.x*32,y:v.z*32},0)).toBe(true);}
    else expect(canOccupyExpedition(geometry,{x:v.x*32,y:v.z*32},0)).toBe(false);
   }}});
  }
  disposeModel(root);
 });
 it('installs exactly the accepted shaft and retains canonical anchors',()=>{
  expect(template.voids).toEqual([points]);expect(template.obstacles).toEqual([]);
  expect(template.spawn).toEqual({x:100,y:440});expect(template.exit).toEqual({x:1100,y:440});
  expect(template.breaches).toEqual([[100,100],[1100,100],[100,780],[1100,780]].map(([x,y])=>({x,y})));
 });
 for(const radius of [16,28,30,38])it(`retains full C and progression sweeps at radius ${radius}`,()=>{
  const route=[[1044,740],[180,740],[180,140],[1040,140],[1040,440],[1100,440]].map(([x,y])=>({x,y}));
  for(let i=1;i<route.length;i++)expect(canTraverseExpedition(geometry,route[i-1],route[i],radius)).toBe(true);
  expect(canTraverseExpedition(geometry,template.spawn,{x:180,y:440},radius)).toBe(true);
  expect(canTraverseExpedition(geometry,{x:180,y:440},{x:280,y:405},radius)).toBe(true);
  expect(canOccupyExpedition(geometry,{x:600,y:440},radius)).toBe(false);
  expect(canTraverseExpedition(geometry,{x:1040,y:440},{x:1040,y:740},radius)).toBe(false);
 });
 it('keeps radius38 actors clear at every canonical breach emergence and endpoint',()=>{
  for(const p of [geometry.playerSpawn,geometry.exitPoint])expect(canOccupyExpedition(geometry,p,38)).toBe(true);
  for(const b of geometry.breaches){const inward={x:b.x+(b.facing==='east'?56:-56),y:b.y};expect(canTraverseExpedition(geometry,b,inward,38)).toBe(true);}
 });
 it('does not bridge the open east mouth or concave shoulder with deck triangles',()=>{
  const root=serviceShaftLanding(template);root.updateMatrixWorld(true);const floor=root.getObjectByName('connected-balcony')!.children[0] as T.Mesh;
  const p=floor.geometry.getAttribute('position'),indices=floor.geometry.index?Array.from(floor.geometry.index.array):Array.from({length:p.count},(_,i)=>i);
  for(let i=0;i<indices.length;i+=3){
   const v=indices.slice(i,i+3).map(k=>new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(floor.matrixWorld));
   if(!v.every(q=>Math.abs(q.y)<1e-6))continue;
   for(const w of [[1/3,1/3,1/3],[.6,.2,.2],[.2,.6,.2],[.2,.2,.6]]){
    const q=v[0].clone().multiplyScalar(w[0]).addScaledVector(v[1],w[1]).addScaledVector(v[2],w[2]);expect(canOccupyExpedition(geometry,{x:q.x*32,y:q.z*32},0)).toBe(true);
   }
  }
  for(const phase of ['before','after']){
   const model=phase==='before'?root:bake(root);model.updateMatrixWorld(true);
   for(const [x,y] of [[899,239],[899,241],[901,539],[901,541],[1199,539],[1199,541],[1199,639],[1199,641],[339,440],[341,440]]){
    const hits=new T.Raycaster(new T.Vector3(x/32,5,y/32),new T.Vector3(0,-1,0)).intersectObject(model,true);
    expect(hits.some(h=>Math.abs(h.point.y)<1e-5),phase+' '+x+'/'+y).toBe(canOccupyExpedition(geometry,{x,y},0));
   }
   if(phase==='after')disposeModel(model);
  }
  expect(hasClearExpeditionShot(geometry,{x:180,y:740},{x:1040,y:740})).toBe(true);
  expect(hasClearExpeditionShot(geometry,{x:180,y:440},{x:1040,y:440})).toBe(false);
  expect(hasClearExpeditionShot(geometry,{x:1040,y:440},{x:1040,y:740})).toBe(false);
 });
 it('supports both sheave bearings on their pads without floating gaps',()=>{
  const root=serviceShaftLanding(template);root.updateMatrixWorld(true);
  for(const x of [478,682])for(const [z,name] of [[411,'bearing-rear'],[449,'bearing-front']] as const){
   const wheel=root.getObjectByName('sheave-'+x)!,bearing=wheel.getObjectByName(name)!;
   const pad=wheel.getObjectByName(name+'-pad')!;expect(pad).toBeDefined();
   expect(new T.Box3().setFromObject(pad).min.y*32).toBeCloseTo(76.5);
   expect(new T.Raycaster(new T.Vector3(x/32,84/32,(z-20)/32),new T.Vector3(0,0,1)).intersectObject(pad).length).toBeGreaterThan(0);
   expect(new T.Box3().setFromObject(pad).expandByScalar(1e-6).intersectsBox(new T.Box3().setFromObject(bearing)),x+' '+name).toBe(true);
  }
  disposeModel(root);
 });
 it('crosses the full C using actual updates with pursuing brutes and dropped pickups',()=>{
  const game=new DepthGame();game.node=generateRun(1729).nodes.find(n=>n.templateId==='service-shaft-landing')!;
  expect(game.node.kind).not.toBe('boss');game.geometry=createExpeditionGeometry(game.node);game.navigation=new FacilityNavigation(game.geometry);
  // Controlled simulation: the constructor director stays inactive, as in room evidence.
  game.status='playing';Object.assign(game.player,{x:1044,y:740});
  const result=game.enemies.spawn('brute',1120,740);expect(result.spawned).toBe(true);
  expect(game.pickups.spawn('armor',10,760,740).spawned).toBe(true);
  let updates=0;
  for(const [x,y] of [[180,740],[180,140],[1040,140],[1040,440],[1100,440]]){
   let budget=800;
   while(Math.hypot(game.player.x-x,game.player.y-y)>1&&budget-->0){
    const dx=x-game.player.x,dy=y-game.player.y,d=Math.hypot(dx,dy),s=Math.min(1,d/(220/60));
    game.update(1000/60,{x:dx/d*s,y:dy/d*s,fire:false,angle:null,autoAim:false});updates++;
    expect(game.status).toBe('playing');
    for(const actor of [game.player,...game.enemies.snapshot.enemies])expect(canOccupyExpedition(game.geometry,actor,actor.radius)).toBe(true);
    for(const p of game.pickups.snapshot)expect(canOccupyExpedition(game.geometry,p,16)).toBe(true);
   }
   expect(Math.hypot(game.player.x-x,game.player.y-y)).toBeLessThanOrEqual(1);
  }
  expect(updates).toBeGreaterThan(600);expect(game.pickups.snapshot).toHaveLength(0);
  expect(game.enemies.snapshot.enemies).toHaveLength(1);
  // The brute moves at 60 units/s, slower than the marine. Keep the final
  // target still and require contact damage, not arrival on the marine's clock.
  const vitality=game.combat.snapshot.health+game.combat.snapshot.armor;
  let contact=false;
  for(let i=0;i<2400;i++){
   game.update(1000/60,{x:0,y:0,fire:false,angle:null,autoAim:false});
   for(const actor of [game.player,...game.enemies.snapshot.enemies])expect(canOccupyExpedition(game.geometry,actor,actor.radius)).toBe(true);
   if(game.combat.snapshot.health+game.combat.snapshot.armor<vitality){contact=true;break;}
  }
  expect(contact).toBe(true);
  expect(game.enemies.snapshot.enemies[0].y).toBeLessThan(540);
 });
 it('keeps deck triangles on legal floor and machinery inside solid space before and after batching',()=>{
  const root=serviceShaftLanding(template);root.updateMatrixWorld(true);
  for(const name of ['counterweight','guides','sheaves','bracing','local-junction','shaft-curbs']){
   const group=root.getObjectByName(name)!;expect(group).toBeTruthy();let count=0;
   group.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);expect(canOccupyExpedition(geometry,{x:v.x*32,y:v.z*32},0),`${name} vertex ${v.x*32}/${v.z*32}`).toBe(false);count++;}}});expect(count).toBeGreaterThan(0);
  }
  const before=new T.Box3().setFromObject(root,true);const world=bake(root),after=new T.Box3().setFromObject(world,true);
  expect(after.min.distanceTo(before.min)).toBeLessThan(.0001);expect(after.max.distanceTo(before.max)).toBeLessThan(.0001);
  expect(world.children.length).toBeLessThanOrEqual(8);
  for(const [x,z,legal] of [[180,440,true],[180,140,true],[1040,440,true],[760,740,true],[800,440,false],[1040,590,false]] as const){
   const hits=new T.Raycaster(new T.Vector3(x/32,4,z/32),new T.Vector3(0,-1,0)).intersectObject(world,true);
   expect(hits.some(h=>Math.abs(h.point.y)<.025)).toBe(legal);
  }
  const mats=new Set<T.Material>();world.traverse(o=>{if(o instanceof T.Mesh)mats.add(o.material as T.Material);});let disposed=0;
  for(const m of mats){expect(m.userData.actorMaterial).toBe(true);m.addEventListener('dispose',()=>disposed++);}
  disposeModel(world);expect(disposed).toBe(mats.size);
 });
});
