import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {ROOM_STORY_ROUTE} from '../src/game/roguelike/storyRooms';
import {authoredRoom} from '../src/render/AuthoredRooms';
import {disposeModel} from '../src/render/meshParts';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
const t=STORY_ROOM_TEMPLATES['containment-annulus'];
it('integrates the approved solid core and ring without detached blockers',()=>{
 expect(t.boundary).toEqual([{x:80,y:40},{x:1120,y:40},{x:1160,y:80},{x:1160,y:800},{x:1120,y:840},{x:80,y:840},{x:40,y:800},{x:40,y:80}]);
 expect(t.voids).toEqual([[{x:420,y:240},{x:780,y:240},{x:840,y:300},{x:840,y:580},{x:780,y:640},{x:420,y:640},{x:360,y:580},{x:360,y:300}]]);
 expect(t.obstacles).toEqual([]);
});
it('keeps both complete ring directions and entry/exit open at player and enemy clearance',()=>{
 const g=createExpeditionGeometry({id:'room18-test',templateId:'containment-annulus',depth:17,kind:'combat',reward:'upgrade',next:[]});const ring=[[240,440],[240,220],[340,140],[860,140],[960,220],[960,660],[860,740],[340,740],[240,660],[240,440]].map(([x,y])=>({x,y}));
 for(const r of [16,28,30,38]){
  for(const path of [ring,[...ring].reverse(),[t.spawn,ring[0]],[{x:960,y:440},t.exit]])for(let i=1;i<path.length;i++)expect(canTraverseExpedition(g,path[i-1],path[i],r)).toBe(true);
  for(const p of [...t.breaches,{x:600,y:160},{x:600,y:720},{x:930,y:350},{x:930,y:490}])expect(canOccupyExpedition(g,p,r)).toBe(true);
  expect(canOccupyExpedition(g,{x:600,y:440},r)).toBe(false);
 }
 expect(hasClearExpeditionShot(g,{x:240,y:440},{x:960,y:440})).toBe(false);
});
it('places bounded room assemblies and preserves owned resource disposal',()=>{
 const model=authoredRoom(t.id,t);expect(model).not.toBeNull();if(!model)return;
 expect(model.userData.stage).toBe('model-iteration');
 expect(model.userData.assemblies).toEqual(['sealed-core','segmented-jacket','radial-feet','inspection-plugs','passenger-vitals','authorization-state']);
 const bounds=new T.Box3().setFromObject(model,true);expect(bounds.min.x).toBeGreaterThanOrEqual(40/32-1e-5);expect(bounds.max.x).toBeLessThanOrEqual(1160/32+1e-5);expect(bounds.max.y).toBeLessThanOrEqual(1.7);
 const meshes:T.Mesh[]=[];model.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});expect(meshes.length).toBeLessThanOrEqual(8);
 const materials=[...new Set(meshes.map(m=>m.material as T.Material))];const gs=meshes.map(m=>vi.spyOn(m.geometry,'dispose')),ms=materials.map(m=>vi.spyOn(m,'dispose'));
 disposeModel(model);for(const spy of [...gs,...ms])expect(spy).toHaveBeenCalledTimes(1);vi.restoreAllMocks();
});
it('retires document-present sign textures with their owned materials',()=>{
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})});
 try{
  const model=authoredRoom(t.id,t)!;const textures=new Set<T.Texture>();
  model.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshBasicMaterial;if(m.map)textures.add(m.map);}});
  expect(textures.size).toBe(2);const spies=[...textures].map(texture=>vi.spyOn(texture,'dispose'));
  disposeModel(model);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 }finally{vi.unstubAllGlobals();vi.restoreAllMocks();}
});
// CPU raycasts check actual surfaces without a renderer or GPU job.
function surface(model:T.Object3D,x:number,z:number){
 model.updateMatrixWorld(true);
 return new T.Raycaster(new T.Vector3(x/32,5,z/32),new T.Vector3(0,-1,0)).intersectObject(model,true)[0];
}
it('builds a continuous contrasting circulation finish with flush service seams',()=>{
 const model=authoredRoom(t.id,t)!;
 for(const [x,z] of [[600,150],[600,730],[300,440],[900,440],[390,165],[810,715]]){
  const hit=surface(model,x,z);expect(hit).toBeDefined();
  expect((hit.object as T.Mesh<T.BufferGeometry,T.Material>).material.name).toBe('annulus-circulation');
  expect(hit.point.y*32).toBeGreaterThan(0);expect(hit.point.y*32).toBeLessThanOrEqual(1);
 }
 // All walkable space remains a floor, not new non-colliding equipment.
 for(let x=80;x<=1120;x+=20)for(let z=80;z<=800;z+=20){
  const insideCore=x>=350&&x<=850&&z>=230&&z<=650;
  if(!insideCore)expect(surface(model,x,z).point.y*32).toBeLessThanOrEqual(1.01);
 }
 disposeModel(model);
});
it('closes the shield roof with broad ceramic panels and keeps the front jacket low',()=>{
 const model=authoredRoom(t.id,t)!;
 for(let i=0;i<16;i++){
  const a=(i+.5)*Math.PI/8,hit=surface(model,600+Math.cos(a)*105,440+Math.sin(a)*97);
  expect((hit.object as T.Mesh<T.BufferGeometry,T.Material>).material.name).toMatch(/^annulus-ceramic/);
  expect(hit.point.y*32).toBeGreaterThanOrEqual(30);
 }
 const front=surface(model,600,605),back=surface(model,600,275);
 expect(front.point.y*32).toBeLessThanOrEqual(42);expect(back.point.y).toBeGreaterThan(front.point.y);
 const ceramic:T.MeshStandardMaterial[]=[];
 model.traverse(o=>{if(o instanceof T.Mesh&&o.material.name.startsWith('annulus-ceramic'))ceramic.push(o.material);});
 expect(ceramic.length).toBe(2);for(const m of ceramic){expect(m.metalness).toBeLessThan(.1);expect(m.roughness).toBeGreaterThan(.8);expect(m.emissive.getHex()).toBe(0);}
 disposeModel(model);
});
it('raises load-bearing shoes above the solid plinth and recesses displays inside guards',()=>{
 const model=authoredRoom(t.id,t)!;
 // West foot is clear of the status rail. Shoes must not be buried in the plinth.
 const shoe=surface(model,376,440);
 expect(shoe.point.y*32).toBeGreaterThanOrEqual(17);
 expect((shoe.object as T.Mesh<T.BufferGeometry,T.Material>).material.name).toBe('annulus-bands');
 const web=surface(model,400,432);
 expect(web.point.y*32).toBeGreaterThan(23);
 const screen=surface(model,810,350),guard=surface(model,833,350);
 expect(guard.point.y*32-screen.point.y*32).toBeGreaterThanOrEqual(6);
 expect((guard.object as T.Mesh<T.BufferGeometry,T.Material>).material.name).toBe('annulus-bands');
 // A recessed service throat and its flanged collar are separate solid levels.
 expect(surface(model,600,634).point.y*32).toBeGreaterThan(surface(model,600,622).point.y*32);
 disposeModel(model);
});
it('keeps raised construction inside the exact canonical solid footprint',()=>{
 const model=authoredRoom(t.id,t)!;
 const g=createExpeditionGeometry({id:'room18-model-test',templateId:t.id,depth:17,kind:'combat',reward:'upgrade',next:[]});
 for(let x=330;x<=870;x+=5)for(let z=215;z<=665;z+=5){
  if(canOccupyExpedition(g,{x,y:z},0))expect(surface(model,x,z).point.y*32,`${x},${z}`).toBeLessThanOrEqual(1.01);
 }
 disposeModel(model);
});
it('retains the living-passenger and unarmed story',()=>{
 const story=ROOM_STORY_ROUTE.find(r=>r.templateId===t.id)!;
 expect(story.objective).toContain('Overload is NOT armed.');expect(story.story).toBe('PASSENGERS ALIVE. Manual authorization still required.');
});
