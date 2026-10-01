import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {DIAGNOSTIC_SOLIDS,DIAGNOSTIC_TOPOLOGY,diagnosticConsolePolygon} from '../src/game/roguelike/diagnosticGalleryLayout';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
import {environmentArchitecture} from '../src/render/ShipEnvironments';
import {disposeModel} from '../src/render/meshParts';
const proposal=JSON.parse(readFileSync('tests/fixtures/diagnostic-gallery-layout.json','utf8'));
const node={id:'diagnostic-test',templateId:'diagnostic-gallery',depth:10,kind:'combat',next:[],reward:'upgrade'} as const;
describe('Diagnostic gallery rough placement',()=>{
 it('deeply freezes topology and model footprint data at runtime',()=>{
  const assertFrozen=(value:unknown):void=>{
   if(value===null||typeof value!=='object')return;
   expect(Object.isFrozen(value)).toBe(true);
   for(const child of Object.values(value))assertFrozen(child);
  };
  for(const value of [DIAGNOSTIC_SOLIDS,DIAGNOSTIC_TOPOLOGY,diagnosticConsolePolygon(112,155),STORY_ROOM_TEMPLATES['diagnostic-gallery']])assertFrozen(value);
  const point=DIAGNOSTIC_SOLIDS[0].polygon[0],before=point.x;
  expect(Reflect.set(point,'x',before+1)).toBe(false);
  expect(point.x).toBe(before);
 });
 it('integrates exactly the approved three solids, retaining shell and anchors',()=>{
  const t=STORY_ROOM_TEMPLATES['diagnostic-gallery'];
  expect(t.voids).toEqual(proposal.solids.map((s:any)=>s.polygon));expect(t.obstacles).toEqual([]);
  expect(t.boundary).toBeUndefined();expect([t.width,t.height]).toEqual([1200,880]);
  expect(t.spawn).toEqual(proposal.canonical.spawn);expect(t.exit).toEqual(proposal.canonical.exit);expect(t.breaches).toEqual(proposal.canonical.breaches);
 });
 for(const radius of [16,28]){
  it(`preserves radius ${radius} routes and rejects model interiors`,()=>{
   const g=createExpeditionGeometry(node);
   for(const path of Object.values(proposal.routes) as {x:number;y:number}[][])for(let i=1;i<path.length;i++)expect(canTraverseExpedition(g,path[i-1],path[i],radius)).toBe(true);
   for(const p of [...proposal.canonical.breaches,...Object.values(proposal.activity_points)])expect(canOccupyExpedition(g,p as any,radius)).toBe(true);
   for(const p of [{x:600,y:150},{x:350,y:440},{x:850,y:440}])expect(canOccupyExpedition(g,p,radius)).toBe(false);
  });
 }
 it('places a physical deck cutaway and two low curved banks in the runtime registration',()=>{
  const world=new T.Group();environmentArchitecture(world,'engineering',37.5,27.5,'diagnostic-gallery');
  const parts=world.children.filter(o=>o.name.startsWith('diagnostic-'));
  expect(parts.length).toBeGreaterThan(20);
  for(const name of ['diagnostic-physical-ship-cutaway','diagnostic-west-low-console','diagnostic-east-low-console','diagnostic-purge-bus','diagnostic-occupied-cryo-0'])expect(parts.some(o=>o.name===name)).toBe(true);
  world.updateMatrixWorld(true);
  for(const part of parts){
   const b=new T.Box3().setFromObject(part,true);expect(b.min.y).toBeGreaterThanOrEqual(-1e-6);
   expect(b.max.y).toBeLessThanOrEqual(2.4);
   const owner=proposal.solids.find((s:any)=>s.id===part.userData.solidId);expect(owner).toBeDefined();
   // Every transformed vertex, not just an object origin, stays within its solid.
   const polygon=owner.polygon;
   const inside=(x:number,y:number)=>{let c=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;};
   part.traverse(o=>{if(o instanceof T.Mesh){const pos=o.geometry.getAttribute('position');for(let i=0;i<pos.count;i++){const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);expect(inside(p.x*32,p.z*32)).toBe(true);}}});
  }
  disposeModel(world);
 });
 it('makes four occupied berths with tapered shells and separated human limbs instead of screen markers',()=>{
  const world=new T.Group();environmentArchitecture(world,'engineering',37.5,27.5,'diagnostic-gallery');
  world.updateMatrixWorld(true);
  const bounds=(name:string)=>{
   const mesh=world.getObjectByName(`diagnostic-${name}`);expect(mesh,name).toBeInstanceOf(T.Mesh);
   return new T.Box3().setFromObject(mesh!,true);
  };
  for(let i=0;i<4;i++){
   const shell=world.getObjectByName(`diagnostic-occupied-cryo-${i}`) as T.Mesh;
   expect(shell.geometry.type).toBe('ExtrudeGeometry');
   const berth=bounds(`occupied-cryo-${i}`),size=berth.getSize(new T.Vector3());
   expect(size.x/size.z).toBeGreaterThan(1.7);
   expect(size.x*32).toBeGreaterThanOrEqual(39);
   const head=bounds(`cryo-head-${i}`),torso=bounds(`cryo-person-${i}`);
   expect(head.max.x).toBeLessThan(torso.min.x);
   for(const side of ['near','far']){
    const arm=bounds(`cryo-arm-${side}-${i}`),leg=bounds(`cryo-leg-${side}-${i}`);
    expect(leg.min.x).toBeGreaterThan(torso.min.x);
    for(const part of [head,torso,arm,leg]){
     expect(part.min.x).toBeGreaterThan(berth.min.x);expect(part.max.x).toBeLessThan(berth.max.x);
     expect(part.min.z).toBeGreaterThan(berth.min.z);expect(part.max.z).toBeLessThan(berth.max.z);
     expect(part.min.y).toBeGreaterThanOrEqual(berth.max.y);
    }
   }
   expect(bounds(`cryo-leg-far-${i}`).max.z).toBeLessThan(bounds(`cryo-leg-near-${i}`).min.z);
  }
  disposeModel(world);
 });
 it('adds a flush theatre floor and outboard shell without new walkable-space solids',()=>{
  const world=new T.Group();environmentArchitecture(world,'engineering',37.5,27.5,'diagnostic-gallery');
  world.updateMatrixWorld(true);
  const shell=world.children.filter(o=>o.name.startsWith('gallery-shell-'));
  const floor=world.children.filter(o=>o.name.startsWith('gallery-floor-'));
  expect(shell.length).toBeGreaterThan(10);expect(floor.length).toBeGreaterThan(5);
  for(const part of shell){const b=new T.Box3().setFromObject(part,true);expect(b.max.z).toBeLessThanOrEqual(0);}
  for(const part of floor){
   const b=new T.Box3().setFromObject(part,true);
   expect(b.max.y).toBeLessThan(.015);expect(b.min.y).toBeGreaterThanOrEqual(0);
   expect(b.min.x).toBeGreaterThanOrEqual(0);expect(b.max.x).toBeLessThanOrEqual(37.5);
   expect(b.min.z).toBeGreaterThanOrEqual(0);expect(b.max.z).toBeLessThanOrEqual(27.5);
  }
  for(const part of [...shell,...floor]){const material=(part as T.Mesh).material as T.MeshStandardMaterial;expect(material.emissiveIntensity).toBeLessThanOrEqual(.2);}
  expect(world.children.every(o=>o.name.startsWith('diagnostic-')||o.name.startsWith('gallery-'))).toBe(true);
  disposeModel(world);
 });
 it('builds ten sloped instrument housings on recessed console cabinets',()=>{
  const world=new T.Group();environmentArchitecture(world,'engineering',37.5,27.5,'diagnostic-gallery');world.updateMatrixWorld(true);
  for(const id of ['west-low-console','east-low-console']){
   const base=world.getObjectByName(`diagnostic-${id}`)!;
   const body=world.getObjectByName(`diagnostic-${id}-cabinet`);
   expect(body).toBeInstanceOf(T.Mesh);
   const baseBounds=new T.Box3().setFromObject(base,true),bodyBounds=new T.Box3().setFromObject(body!,true);
   expect(baseBounds.max.y).toBeCloseTo(4/32);
   expect(bodyBounds.min.y).toBeCloseTo(baseBounds.max.y);
   for(let i=0;i<5;i++){
    const hood=world.getObjectByName(`diagnostic-${id}-instrument-hood-${i}`) as T.Mesh;
    expect(hood).toBeInstanceOf(T.Mesh);
    const positions=hood.geometry.getAttribute('position');
    const heights=new Set(Array.from({length:positions.count},(_,j)=>Math.round(positions.getY(j)*3200)));
    expect(heights.size).toBeGreaterThanOrEqual(3);
    const b=new T.Box3().setFromObject(hood,true);
    expect(b.max.y*32).toBeGreaterThan(36);expect(b.min.y*32).toBeCloseTo(23);
    for(const part of ['gauge','selector','switch-guard'])expect(world.getObjectByName(`diagnostic-${id}-${part}-${i}`)).toBeInstanceOf(T.Mesh);
   }
  }
  disposeModel(world);
 });
 it('connects both actual cabinets to the board through flush covered service trunks',()=>{
  const world=new T.Group();environmentArchitecture(world,'engineering',37.5,27.5,'diagnostic-gallery');world.updateMatrixWorld(true);
  const bounds=(name:string)=>{
   const mesh=world.getObjectByName(name);expect(mesh,name).toBeInstanceOf(T.Mesh);
   return new T.Box3().setFromObject(mesh!,true);
  };
  for(const side of ['west','east']){
   // Axis-aligned trunk sections must overlap at each joint, including the
   // vertical sockets on the real cabinet and pedestal, not just nearby marks.
   const names=[`diagnostic-${side}-low-console-cabinet`,`diagnostic-${side}-service-drop`,
    `gallery-floor-${side}-service-long`,`gallery-floor-${side}-service-turn`,
    `diagnostic-${side}-board-socket`,'diagnostic-physical-ship-cutaway'];
   for(let i=1;i<names.length;i++)expect(bounds(names[i-1]).intersectsBox(bounds(names[i])),`${names[i-1]} joins ${names[i]}`).toBe(true);
   // AABB overlap alone can lie for a curved cabinet. Raycast the actual
   // cabinet underside inside the drop, and the pedestal inside its socket.
   for(const [terminal,body] of [[names[1],names[0]],[names[4],names[5]]]){
    const b=bounds(terminal),p=b.getCenter(new T.Vector3());p.y=-1;
    const hits=new T.Raycaster(p,new T.Vector3(0,1,0)).intersectObject(world.getObjectByName(body)!);
    expect(hits.length,`${terminal} intersects real ${body} triangles`).toBeGreaterThan(0);
    expect(hits[0].point.y).toBeGreaterThanOrEqual(b.min.y-1e-6);
    expect(hits[0].point.y).toBeLessThan(b.max.y);
   }
   for(const suffix of ['service-drop','board-socket']){
    const b=bounds(`diagnostic-${side}-${suffix}`);
    expect(b.min.y).toBeCloseTo(0);expect(b.max.y*32).toBeGreaterThanOrEqual(18);
   }
   const long=bounds(`gallery-floor-${side}-service-long`),turn=bounds(`gallery-floor-${side}-service-turn`);
   for(const b of [long,turn])expect(b.max.y*32).toBeLessThan(.4);
   expect(long.getSize(new T.Vector3()).x*32).toBeGreaterThanOrEqual(15);
   // Crossing the flush trunk stays legal for both supported actor radii.
   const x=side==='west'?346:854;
   for(const radius of [16,28])expect(canTraverseExpedition(createExpeditionGeometry(node),{x:x-40,y:285},{x:x+40,y:285},radius)).toBe(true);
  }
  for(const x of [362,833])expect(world.getObjectByName(`gallery-floor-cable-trunk-${x}`)).toBeUndefined();
  disposeModel(world);
 });
 it('does not register Room11 models into Room12',()=>{
  const world=new T.Group();environmentArchitecture(world,'engineering',37.5,27.5,'safety-interlock-station');expect(world.children.some(o=>o.name.startsWith('diagnostic-'))).toBe(false);disposeModel(world);
 });
});
