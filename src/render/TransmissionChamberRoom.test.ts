import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '../game/world/expeditionGeometry';
import {clearPolygonTopology} from '../game/world/polygonGeometry';
import {authoredRoom} from './AuthoredRooms';
import {disposeModel} from './meshParts';
const layout=JSON.parse(readFileSync('docs/art-evidence/room10-story-flow-v3/stage-1/attempt-962/layout.json','utf8'));
// Preserve the historical proposal; only the oversized antenna foundation is revised.
const priorSolids=structuredClone(layout.solids);
layout.solids=layout.solids.map((s:any)=>s.id==='antenna-truss'?{...s,points:[{x:560,y:84},{x:640,y:84},{x:640,y:110},{x:560,y:110}]}:s);
const template=ROOM_TEMPLATES['transmission-chamber'];
const geometry=()=>createExpeditionGeometry({id:'room10-stage2',templateId:'transmission-chamber'} as Parameters<typeof createExpeditionGeometry>[0]);
describe('Room10 rough placement',()=>{
 it('implements eight original solids plus a proportionate antenna foundation and retains canonical anchors',()=>{
  expect(template.voids).toEqual(layout.solids.map((s:{points:unknown})=>s.points));
  expect(template.obstacles).toEqual([]);expect(template.boundary).toEqual(layout.boundary);
  for(const key of ['width','height','spawn','exit','breaches'] as const)expect(template[key]).toEqual(layout[key]);
  expect(geometry().blockers).toEqual(geometry().boundaryWalls);
 });
 it.each([16,28,38])('preserves every reviewed swept route at radius %s',radius=>{
  const g=geometry();
  for(const route of layout.routes){
   const points=route.points as {x:number;y:number}[];
   expect(points.every(p=>canOccupyExpedition(g,p,radius)),route.id+' endpoints').toBe(true);
   const swept=points.slice(1).every((p,i)=>canTraverseExpedition(g,points[i],p,radius));
   expect(swept,route.id).toBe(route.expected==='clear');
  }
  for(const anchor of [template.spawn,template.exit,...template.breaches])expect(canOccupyExpedition(g,anchor,radius)).toBe(true);
  for(const solid of layout.solids){const p={x:solid.points.reduce((n:number,p:{x:number})=>n+p.x,0)/solid.points.length,y:solid.points.reduce((n:number,p:{y:number})=>n+p.y,0)/solid.points.length};expect(canOccupyExpedition(g,p,radius)).toBe(false);}
 });
 it('renders all nine grounded fixtures inside their collision outlines',()=>{
  const room=authoredRoom('transmission-chamber',template);expect(room).not.toBeNull();if(!room)return;
  room.updateMatrixWorld(true);
  for(const solid of layout.solids){
   const fixture=room.getObjectByName(solid.id);expect(fixture,solid.id).toBeDefined();if(!fixture)continue;
   let vertices=0;const bounds=new T.Box3().setFromObject(fixture);expect(bounds.min.y).toBeCloseTo(0,5);
   fixture.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const q={x:v.x*32,y:v.z*32};
    // Expand by 0.002 game units solely for Float32 vertex rounding at exact edges.
    const center=solid.points.reduce((c:{x:number;y:number},p:{x:number;y:number})=>({x:c.x+p.x/solid.points.length,y:c.y+p.y/solid.points.length}),{x:0,y:0});
    const inset={x:q.x+(center.x-q.x)*.00001,y:q.y+(center.y-q.y)*.00001};
    expect(clearPolygonTopology({voids:[solid.points]},inset,inset,0),solid.id+' vertex outside').toBe(false);vertices++;
   }});expect(vertices).toBeGreaterThan(20);
   if(solid.id.startsWith('waveguide'))expect(bounds.max.y*32).toBeLessThanOrEqual(44);
  }
  disposeModel(room);
 });
 it('fits the foundation to its complete round hardware and frees the abandoned platform edges',()=>{
  const room=authoredRoom('transmission-chamber',template)!;room.updateMatrixWorld(true);
  const base=new T.Box3().setFromObject(room.getObjectByName('antenna-truss')!),hardware=new T.Box3().setFromObject(room.getObjectByName('antenna-hardware')!);
  expect(base.getSize(new T.Vector3()).x/hardware.getSize(new T.Vector3()).x).toBeLessThan(1.5);
  expect(room.getObjectByName('antenna-hardware')!.scale.x).toBe(.32);
  const g=geometry();for(const r of [16,28,38])expect(canTraverseExpedition(g,{x:510,y:50},{x:510,y:150},r)).toBe(true);
  expect(canOccupyExpedition(g,{x:600,y:97},0)).toBe(false);
  for(let i=0;i<layout.solids.length;i++)if(layout.solids[i].id!=='antenna-truss')expect(layout.solids[i]).toEqual(priorSolids[i]);
  disposeModel(room);
 });
 it('keeps stage3 shell inside existing wall bands and deck dressing flush',()=>{
  const room=authoredRoom('transmission-chamber',template)!;room.updateMatrixWorld(true);
  const shell=room.getObjectByName('ceramic-perimeter-shell')!;expect(shell).toBeDefined();
  shell.traverse(o=>{if(!(o instanceof T.Mesh))return;const b=new T.Box3().setFromObject(o);
   expect(b.max.x*32<=6||b.min.x*32>=1194||b.max.z*32<=6||b.min.z*32>=874).toBe(true);
  });
  const floor=room.getObjectByName('flush-deck-inlays')!;expect(new T.Box3().setFromObject(floor).max.y*32).toBeLessThanOrEqual(.101);
  expect(room.getObjectByName('transmission-instrument-panel')).toBeDefined();
  room.traverse(o=>{if(!(o instanceof T.Mesh))return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(m instanceof T.MeshStandardMaterial){expect(m.emissiveIntensity).toBeLessThanOrEqual(m.name==='transmission-indicator'?.25:1);expect(m.map).toBeNull();}
  }});disposeModel(room);
 });
 it('keeps the complete antenna below the shipping desktop top edge',()=>{
  const room=authoredRoom('transmission-chamber',template)!;room.updateMatrixWorld(true);
  try{
   const antenna=room.getObjectByName('antenna-truss')!;
   // Fixed shipping-camera samples from entry, north and south, not an overview fit.
   for(const [x,z] of [[14.944444444444445,32.75],[18.749895208512196,31.924150746901642],[18.75,33.575826873693]]){
    const camera=new T.OrthographicCamera(-11*1280/900,11*1280/900,11,-11,.1,120);
    camera.position.set(x,26,z);camera.quaternion.set(-.4527600968822728,0,0,.8916323764148287);camera.updateMatrixWorld(true);
    antenna.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position');
     for(let i=0;i<p.count;i++){
      const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).project(camera);
      expect(v.y,'antenna must remain in frame, dish hardware must clear top by 12 pixels').toBeLessThanOrEqual(o.parent===antenna?1:1-24/900);
     }
    });
   }
   const bounds=new T.Box3().setFromObject(antenna);
   expect(bounds.min.y).toBeCloseTo(0,5);expect(bounds.max.y*32).toBeLessThanOrEqual(70);
   const size=new T.Box3().setFromObject(room.getObjectByName('dish-rim')!).getSize(new T.Vector3());
   expect(size.x/size.y,'retain round dish proportions').toBeCloseTo(1,4);
   expect(size.x*32,'dish must remain larger than a person').toBeGreaterThan(48);
  }finally{disposeModel(room);}
 });
 it('faces the dish into the room and joins its rim to a supported receiver',()=>{
  const room=authoredRoom('transmission-chamber',template)!;room.updateMatrixWorld(true);
  for(const name of ['dish-reflector','dish-rim','dish-gimbal','dish-receiver-support','feed-alloy-collar'])expect(room.getObjectByName(name),name).toBeDefined();
  const ray=new T.Raycaster(room.getObjectByName('antenna-hardware')!.localToWorld(new T.Vector3(630/32,112/32,109/32)),new T.Vector3(0,0,-1));
  const hits=ray.intersectObject(room.getObjectByName('antenna-truss')!,true);
  expect(hits.length).toBeGreaterThan(0);
  expect((hits[0].object as T.Mesh).material).toHaveProperty('name','transmission-ceramic');
  expect(hits[0].face!.normal.clone().transformDirection(hits[0].object.matrixWorld).z).toBeGreaterThan(.5);
  disposeModel(room);
 });
 it('recesses the ceramic center behind the rim and receiver with alloy behind the face',()=>{
  const room=authoredRoom('transmission-chamber',template)!;room.updateMatrixWorld(true);
  try{
   const reflector=room.getObjectByName('dish-reflector')!;
   const hardware=room.getObjectByName('antenna-hardware')!;
   const ceramic=reflector.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name==='transmission-ceramic') as T.Mesh;
   const p=ceramic.geometry.getAttribute('position'),rings=new Map<number,number[]>();
   for(let i=0;i<p.count;i++){
    const v=hardware.worldToLocal(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(ceramic.matrixWorld)).multiplyScalar(32);
    const radius=Math.round(Math.hypot(v.x-600,v.y-112));
    const depths=rings.get(radius)??[];depths.push(v.z);rings.set(radius,depths);
   }
   const radii=[0,18,40,60,76];
   for(let i=1;i<radii.length;i++)expect(Math.max(...rings.get(radii[i-1])!),`radius ${radii[i-1]} must be recessed behind ${radii[i]}`).toBeLessThan(Math.min(...rings.get(radii[i])!));
   expect(Math.min(...rings.get(76)!)-Math.max(...rings.get(0)!)).toBeGreaterThan(15);
   const rim=room.getObjectByName('dish-rim')!,rimBounds=new T.Box3().setFromObject(rim);
   expect(hardware.worldToLocal(rimBounds.getCenter(new T.Vector3())).z*32).toBeCloseTo(rings.get(76)![0],4);
   expect(Math.max(...rings.get(76)!)).toBeLessThan(99);
   for(const radius of [10,30,50,70]){
    const front=new T.Raycaster(hardware.localToWorld(new T.Vector3((600+radius)/32,112/32,109/32)),new T.Vector3(0,0,-1)).intersectObject(reflector,true)[0];
    const rear=new T.Raycaster(hardware.localToWorld(new T.Vector3((600+radius)/32,112/32,35/32)),new T.Vector3(0,0,1)).intersectObject(reflector,true)[0];
    expect((front.object as T.Mesh).material).toHaveProperty('name','transmission-ceramic');
    expect((rear.object as T.Mesh).material).toHaveProperty('name','transmission-alloy');
    expect(front.point.z).toBeGreaterThan(rear.point.z);
   }
  }finally{disposeModel(room);}
 });
 it('releases batch scratch geometry once and retains shadow ownership',()=>{
  const disposal=vi.spyOn(T.BufferGeometry.prototype,'dispose');
  try{
   const room=authoredRoom('transmission-chamber',template)!;
   const discarded=[...disposal.mock.contexts];expect(discarded.length).toBeGreaterThan(0);
   room.traverse(o=>{if(o instanceof T.Mesh){
    expect(discarded).not.toContain(o.geometry);
    expect(o.castShadow&&o.receiveShadow&&o.userData.bakedEnvironment).toBe(true);
   }});
   disposeModel(room);
   expect(new Set(disposal.mock.contexts).size).toBe(disposal.mock.contexts.length);
  }finally{disposal.mockRestore();}
 });
 it('owns bounded room resources and disposes each exactly once',()=>{
  const room=authoredRoom('transmission-chamber',template);expect(room).not.toBeNull();if(!room)return;
  const resources=new Set<T.BufferGeometry|T.Material>();let meshes=0,triangles=0;
  room.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])resources.add(m);}});
  expect(meshes).toBeLessThan(90);expect(triangles).toBeLessThan(15000);
  const counts=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,counts.get(r)!+1));disposeModel(room);for(const n of counts.values())expect(n).toBe(1);
 });
});
