import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom,roomDeckShape} from './AuthoredRooms';
import {disposeModel} from './meshParts';
import {AUTHORED_ROOM_TOPOLOGIES} from '../game/roguelike/authoredRoomTopologies';
const actual=(id:keyof typeof AUTHORED_ROOM_TOPOLOGIES)=>({...template,...AUTHORED_ROOM_TOPOLOGIES[id]!});
const materialMesh=(group:T.Group,name:string)=>group.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===name) as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
const template={width:1200,height:880,boundary:[{x:80,y:80},{x:1100,y:100},{x:1000,y:800},{x:80,y:750}],voids:[[{x:450,y:300},{x:700,y:300},{x:700,y:550},{x:450,y:550}]],obstacles:[]};
describe('authored architecture',()=>{
 it('uses authoritative polygon and holes in domain coordinates',()=>{
  const shape=roomDeckShape(template);expect(shape.getPoints().slice(0,4).map(p=>[p.x,p.y])).toEqual(template.boundary.map(p=>[p.x/32,-p.y/32]));
  expect(shape.holes).toHaveLength(1);expect(shape.holes[0].getPoints()[0].x).toBe(450/32);
  const geometry=new T.ShapeGeometry(shape),pos=geometry.getAttribute('position'),index=geometry.index!;
  for(let i=0;i<index.count;i+=3){let x=0,z=0;for(let j=0;j<3;j++){x+=pos.getX(index.getX(i+j))/3;z-=pos.getY(index.getX(i+j))/3;}expect(x>450/32&&x<700/32&&z>300/32&&z<550/32).toBe(false);}geometry.dispose();
 });
 it.each(['passenger-vault','breached-loading-bay','overload-floor'])('batches %s and releases every owned GPU resource once',id=>{
  const group=authoredRoom(id,template)!;expect(group).toBeInstanceOf(T.Group);expect(group.children.length).toBeLessThan(22);
  const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();group.traverse(o=>{if(o instanceof T.Mesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  expect(geometry.size).toBeGreaterThan(5);let disposed=0;for(const resource of [...geometry,...materials])resource.addEventListener('dispose',()=>disposed++);
  disposeModel(group);expect(disposed).toBe(geometry.size+materials.size);
 });
 it('packs occupied pods across both true sloped wells',()=>{
  const group=authoredRoom('passenger-vault',actual('passenger-vault'))!;
  const skin=group.children.find(o=>o instanceof T.Mesh&&(o.material as T.MeshStandardMaterial).color.getHex()===0xb5a48e) as T.Mesh;
  const p=skin.geometry.getAttribute('position');
  for(const hole of actual('passenger-vault').voids!){const z0=Math.min(...hole.map(p=>p.y))/32,z1=Math.max(...hole.map(p=>p.y))/32;const columns=new Set<number>();
   for(let i=0;i<p.count;i++)if(p.getZ(i)>z0&&p.getZ(i)<z1&&p.getY(i)>-1)columns.add(Math.round(p.getX(i)));
   expect(columns.size).toBeGreaterThanOrEqual(6);
  }disposeModel(group);
 });
 it('exposes raised boarding ribs above the carapace instead of embedding slits',()=>{
  const group=authoredRoom('breached-loading-bay',actual('breached-loading-bay'))!,ribs=materialMesh(group,'boarding-ribs'),shell=materialMesh(group,'boarding-carapace');
  expect(ribs).toBeDefined();expect(shell).toBeDefined();group.updateMatrixWorld(true);
  const p=ribs.geometry.getAttribute('position'),ray=new T.Raycaster();let exposed=0;
  for(let i=0;i<p.count;i+=30){if(p.getY(i)<1.4)continue;ray.set(new T.Vector3(p.getX(i),6,p.getZ(i)),new T.Vector3(0,-1,0));const hit=ray.intersectObject(shell)[0];if(hit&&p.getY(i)>hit.point.y+.045)exposed++;}
  expect(exposed).toBeGreaterThan(20);shell.geometry.computeBoundingBox();expect(shell.geometry.boundingBox!.max.y).toBeGreaterThan(2);
  disposeModel(group);
 });
 it.each(['passenger-vault','breached-loading-bay','overload-floor'] as const)('gives %s quiet world-scaled steel textures with owned disposal',id=>{
  const group=authoredRoom(id,actual(id))!,deck=materialMesh(group,'painted-steel-deck');expect(deck).toBeDefined();
  const map=deck.material.map as T.DataTexture,rough=deck.material.roughnessMap as T.DataTexture;expect(map).toBeInstanceOf(T.DataTexture);expect(rough).toBeInstanceOf(T.DataTexture);
  expect(map.wrapS).toBe(T.RepeatWrapping);expect(new Set(map.image.data).size).toBeGreaterThan(8);
  const p=deck.geometry.getAttribute('position'),uv=deck.geometry.getAttribute('uv');for(let i=0;i<p.count;i+=21){expect(uv.getX(i)).toBeCloseTo(p.getX(i)/8,4);expect(uv.getY(i)).toBeCloseTo(p.getZ(i)/8,4);}
  let disposed=0;map.addEventListener('dispose',()=>disposed++);rough.addEventListener('dispose',()=>disposed++);disposeModel(group);expect(disposed).toBe(2);expect(group.children.length).toBeLessThan(22);
 });
 it('adds bolted reactor clamp housings',()=>{const group=authoredRoom('overload-floor',actual('overload-floor'))!;expect(materialMesh(group,'reactor-fasteners')).toBeDefined();disposeModel(group);});
 it('builds shared story footprints with sealed banks and no exposed bodies',()=>{
  const template=actual('awakening-bay'),group=authoredRoom('awakening-bay',template)!;
  expect(group.userData.storyFixtures.map((f:{id:string})=>f.id)).toEqual(['player-release','bank-north','bank-south','supply-wall','monitoring-recovery','interrupted-service']);
  for(const [i,fixture] of group.userData.storyFixtures.entries())expect(fixture.footprint).toBe(template.voids![i]);
  expect(materialMesh(group,'awakening-service-arm')).toBeUndefined();
  expect(group.children.some(o=>o instanceof T.Mesh&&(o.material as T.MeshStandardMaterial).color.getHex()===0xb5a48e)).toBe(false);
  expect(group.children.length).toBeLessThan(22);disposeModel(group);
 });
 it('does not replace other rooms',()=>expect(authoredRoom('residential-gallery',template)).toBeNull());
});
