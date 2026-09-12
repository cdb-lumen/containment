import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {EnvironmentMaterials} from '../src/render/EnvironmentMaterials';
import {MAT,disposeModel,geometries} from '../src/render/meshParts';
import {communalAtrium} from '../src/render/CommunalAtrium';
import {COMMUNAL_ATRIUM_BLOCKOUT} from '../src/game/roguelike/authoredRoomTopologies';
import {generateRun} from '../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
const node=generateRun(3,3).nodes.find(n=>n.templateId==='communal-atrium')!;
// CPU-only loadRoom contract: no WebGL context, browser, camera or lighting override in production.
function renderer(){
 const surfaces=Object.assign(Object.create(EnvironmentMaterials.prototype),{floor:new T.MeshStandardMaterial(),wall:new T.MeshStandardMaterial(),cover:new T.MeshStandardMaterial()});
 return Object.assign(Object.create(DepthRenderer.prototype),{scene:new T.Scene(),world:new T.Group(),effects:{clear(){},setWorld(){}},temporaryMaterials:[],actors:new Map(),nests:new Map(),queen:null,corpses:[],pickupMeshes:new Map(),poolMeshes:new Map(),pendingShots:[],afflictions:{clear(){}},muzzle:{intensity:0},contacts:{begin(){},end(){}},surfaces,floorMaterial:surfaces.floor,camera:new T.OrthographicCamera(-20,20,15,-15),focus:new T.Vector3(),lighting:{loadRoom(){}}});
}
function meshes(root:T.Object3D){const all:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)all.push(o);});return all;}
function hit(root:T.Object3D,x:number,y:number){root.updateMatrixWorld(true);return new T.Raycaster(new T.Vector3(x/32,6,y/32),new T.Vector3(0,-1,0)).intersectObject(root,true)[0];}
const materialState=()=>Object.values(MAT).map(m=>[m.color.getHex(),m.metalness,m.roughness,m.emissive.getHex(),m.emissiveIntensity]);

describe('accepted south32 CPU rendering and ownership',()=>{
 it('shares twelve immutable fixtures, including the south32 dining group, with gameplay',()=>{
  expect(COMMUNAL_ATRIUM_BLOCKOUT).toHaveLength(12);expect(Object.isFrozen(COMMUNAL_ATRIUM_BLOCKOUT)).toBe(true);
  expect(COMMUNAL_ATRIUM_BLOCKOUT.map(f=>[f.id,f.x,f.y,f.w,f.h])).toEqual([
   ['shared-table',800,416,144,48],['north-seat-0',808,400,28,16],['north-seat-1',856,400,28,16],['north-seat-2',904,400,28,16],
   ['south-seat-0',808,472,28,16],['south-seat-1',856,472,28,16],['south-seat-2',904,472,28,16],['shared-garden',512,304,144,64],
   ['shared-water',1008,440,60,40],['entry-welcome',388,192,64,16],['garden-seat-0',464,312,16,28],['garden-seat-1',688,312,16,28],
  ]);
  for(const f of COMMUNAL_ATRIUM_BLOCKOUT){expect(Object.isFrozen(f)).toBe(true);expect(Object.isFrozen(f.footprint)).toBe(true);}
  expect(ROOM_TEMPLATES[node.templateId].voids).toEqual(COMMUNAL_ATRIUM_BLOCKOUT.map(f=>f.footprint));
 });
 it('uses identical embedded and explicit fixtures and keeps each rendered footprint occupied',()=>{
  const t=ROOM_TEMPLATES[node.templateId],implicit=communalAtrium(t),explicit=communalAtrium(t,COMMUNAL_ATRIUM_BLOCKOUT);
  try{
   expect(meshes(implicit).map(m=>Array.from(m.geometry.getAttribute('position').array))).toEqual(meshes(explicit).map(m=>Array.from(m.geometry.getAttribute('position').array)));
   for(const f of COMMUNAL_ATRIUM_BLOCKOUT)for(let ix=0;ix<5;ix++)for(let iy=0;iy<5;iy++){
    const x=f.x+(ix+.5)*f.w/5,y=f.y+(iy+.5)*f.h/5;
    expect(canOccupyExpedition(createExpeditionGeometry(node),{x,y},0)).toBe(false);
    expect(hit(implicit,x,y)?.point.y,`${f.id} ${x}/${y}`).toBeGreaterThan(0);
   }
   expect(hit(implicit,872,440)!.point.y*32).toBeCloseTo(24);
   expect(hit(implicit,820,412)!.point.y*32).toBeCloseTo(14.4);
   expect(hit(implicit,500,190)!.point.y*32).toBeCloseTo(84);
  }finally{disposeModel(implicit);disposeModel(explicit);}
 });
 it('draws only the physical floor, keeps south wall collision visible, and authors finite physical UVs',()=>{
  const r=renderer();r.loadRoom(node);
  try{
   expect(ROOM_TEMPLATES[node.templateId].height).toBe(880);
   for(const [x,y] of [[100,440],[600,650],[600,800],[1000,250]])expect(hit(r.world,x,y)).toBeUndefined();
   expect(hit(r.world,600,528)!.point.y*32).toBeCloseTo(-.64);
   expect(hit(r.world,600,581)!.point.y*32).toBeGreaterThan(16);
   const wall=new T.Raycaster(new T.Vector3(600/32,.5,570/32),new T.Vector3(0,0,1),0,20/32).intersectObject(r.world,true);expect(wall.length).toBeGreaterThan(0);
   for(const m of meshes(r.world)){const uv=m.geometry.getAttribute('uv');if(uv)expect(Array.from(uv.array).every(Number.isFinite)).toBe(true);}
  }finally{disposeModel(r.world);}
 });
 it('bounds aggregate geometry and owned finishes, releases exactly once, and resets tint without loading freeze',()=>{
  const before=materialState(),r=renderer();r.loadRoom(node);
  const equipment=r.world.getObjectByName('communal-atrium-rough')!;expect(equipment).toBeDefined();
  const all=meshes(r.world),materials=new Set(meshes(equipment).map(m=>m.material as T.MeshStandardMaterial));
  expect(materials.size).toBe(8);expect(all.length).toBeLessThanOrEqual(32);
  const triangles=all.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3,0);expect(triangles).toBeLessThan(45000);
  console.info('south32 CPU budget',JSON.stringify({worldMeshes:all.length,equipmentMaterials:materials.size,triangles}));
  for(const m of materials){expect(Object.values(MAT)).not.toContain(m);expect(m.userData.actorMaterial).toBe(true);expect(m.emissiveIntensity).toBeLessThan(.5);}
  expect(materialState()).toEqual(before);expect(r.roomLoading).toBe(false);
  const shared=[...Object.values(MAT),...geometries.values()].map(m=>vi.spyOn(m,'dispose'));
  const owned=[...materials,...meshes(equipment).map(m=>m.geometry)].map(m=>vi.spyOn(m,'dispose'));
  try{
   r.loadRoom({...node,id:'next',templateId:'crew-checkpoint'});
   for(const spy of owned)expect(spy).toHaveBeenCalledTimes(1);for(const spy of shared)expect(spy).not.toHaveBeenCalled();
   expect(r.surfaces.floor.color.getHex()).toBe(0x646d70);expect(r.surfaces.cover.color.getHex()).toBe(0x7e8b8d);expect(r.roomLoading).toBe(false);
  }finally{disposeModel(r.world);vi.restoreAllMocks();}
 });
});
