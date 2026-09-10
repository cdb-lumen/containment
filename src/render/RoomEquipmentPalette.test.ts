import * as T from 'three';
import {describe,it,expect,vi} from 'vitest';
import {authoredRoom} from './AuthoredRooms';
import {residentialGalleryBlockout} from './ResidentialGalleryBlockout';
import {AUTHORED_ROOM_TOPOLOGIES} from '../game/roguelike/authoredRoomTopologies';
import {attachPassengerVault} from './PassengerVault';
import {disposeModel} from './meshParts';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {applyOwnedEquipmentPalette,PASSENGER_FINISHES,RESIDENTIAL_FINISHES} from './RoomEquipmentPalette';
import {buildPassengerVault,PASSENGER_FAMILIES} from './PassengerVault';
import {attachResidentialGalleryEquipment} from './ResidentialGalleryEquipment';
import {MAT} from './meshParts';

function state(root:T.Object3D){root.updateMatrixWorld(true);const rows:unknown[]=[];root.traverse(o=>{if(o instanceof T.Mesh)rows.push({matrix:o.matrixWorld.toArray(),attributes:Object.fromEntries(Object.entries(o.geometry.attributes).map(([k,a])=>[k,Array.from((a as T.BufferAttribute).array)])),index:o.geometry.index?Array.from(o.geometry.index.array):null,material:o.material});});return rows;}
describe('room-owned gameplay palette',()=>{
 it('keeps cabinet masses dark and separates Residential graphite from sage doors',()=>{
  expect(PASSENGER_FINISHES.PV_shared_enclosure_monitor_atlas.color).toBe(0x394b57);
  expect(RESIDENTIAL_FINISHES.rg_steel.color).toBe(0x2c3535);
  expect(RESIDENTIAL_FINISHES.rg_steel.metalness).toBe(.78);
  expect(RESIDENTIAL_FINISHES.rg_steel.roughness).toBe(.65);
 });
 it('retains owned Passenger finishes on HTTP404 and disposes them once',async()=>{
  const room=authoredRoom('passenger-vault',{width:1200,height:880,...AUTHORED_ROOM_TOPOLOGIES['passenger-vault']!})!;
  const fallback=room.getObjectByName('passenger-equipment-fallback')!,materials=new Set<T.MeshStandardMaterial>();
  fallback.traverse(o=>{if(o instanceof T.Mesh)materials.add(o.material as T.MeshStandardMaterial);});
  const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('',{status:404}));
  const spies=[...materials].map(m=>vi.spyOn(m,'dispose'));
  try{const owner=attachPassengerVault(room,()=>{});await owner.ready;expect(owner.state).toBe('fallback');expect(fallback.parent).toBe(room);
   expect([...materials].some(m=>m.color.getHex()===PASSENGER_FINISHES.PV_shared_enclosure_monitor_atlas.color)).toBe(true);
   expect([...materials].some(m=>m.color.getHex()===PASSENGER_FINISHES.PV_shell.color)).toBe(true);
   owner.dispose();disposeModel(room);spies.forEach(spy=>expect(spy).toHaveBeenCalledTimes(1));
  }finally{fetcher.mockRestore();}
 });
 it('retains Residential fallback palette on HTTP404 without owning global materials or geometry',async()=>{
  const room=new T.Group(),fallback=new T.Group();fallback.name='residential-gallery-equipment-fallback';room.add(fallback);
  const globals=Object.values(MAT).map(m=>({m,color:m.color.clone(),dispose:vi.spyOn(m,'dispose')}));
  for(let i=0;i<4;i++)fallback.add(residentialGalleryBlockout({x:0,y:0,width:6,height:4},i));
  const materials=new Set<T.MeshStandardMaterial>();fallback.traverse(o=>{if(o instanceof T.Mesh)materials.add(o.material as T.MeshStandardMaterial);});
  const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('',{status:404}));
  try{const owner=attachResidentialGalleryEquipment(room,()=>{});await owner.ready;expect(owner.state).toBe('fallback');expect(fallback.parent).toBe(room);
   for(const m of materials){expect(Object.values(MAT)).not.toContain(m);expect(m.color.getHex()).toBe(RESIDENTIAL_FINISHES[m.name].color);expect(m.userData.actorMaterial).toBe(true);}
   const spies=[...materials].map(m=>vi.spyOn(m,'dispose'));owner.dispose();disposeModel(room);spies.forEach(spy=>expect(spy).toHaveBeenCalledTimes(1));
   globals.forEach(({m,color,dispose})=>{expect(m.color).toEqual(color);expect(dispose).not.toHaveBeenCalled();});
  }finally{fetcher.mockRestore();globals.forEach(({dispose})=>dispose.mockRestore());}
 });
 it('integrates Passenger finishes before batching without changing shared or status materials',()=>{
  const material=new T.MeshStandardMaterial({name:'PV_shell'}),source=new T.Group();source.add(new T.Mesh(new T.BoxGeometry(.2,.2,.2).translate(.2,.2,.2),material));
  const sources=Object.fromEntries(PASSENGER_FAMILIES.map(f=>[f,source])),global=MAT.armor.color.clone(),before=state(source);
  const bank=buildPassengerVault(sources);
  expect(material.color.getHex()).toBe(PASSENGER_FINISHES.PV_shell.color);
  expect(state(source)).toEqual(before);expect(MAT.armor.color).toEqual(global);
  expect(bank.userData.materials).toBe(1);expect(bank.userData.instances).toBe(25);
 });
 it('installs real Residential palette with identical geometry, allocation count and no global tint leak',async()=>{
  const bytes=readFileSync('public/assets/residential-gallery/residential-gallery-equipment.glb');
  const source=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
  const before=state(source),global=MAT.armor.color.clone(),room=new T.Group(),fallback=new T.Group();fallback.name='residential-gallery-equipment-fallback';room.add(fallback);
  fallback.add(residentialGalleryBlockout({x:0,y:0,width:6,height:4},0));
  const fallbackMaterials=new Set<T.Material>();fallback.traverse(o=>{if(o instanceof T.Mesh)fallbackMaterials.add(o.material as T.Material);});
  const fallbackDisposals=[...fallbackMaterials].map(m=>vi.spyOn(m,'dispose'));
  const owner=attachResidentialGalleryEquipment(room,()=>{},async()=>source);await owner.ready;
  expect(owner.state).toBe('ready');expect(state(source)).toEqual(before);expect(source.userData.materials).toBe(7);expect(source.userData.draws).toBe(22);
  source.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;expect(m.color.getHex()).toBe(RESIDENTIAL_FINISHES[m.name].color);}});
  expect(MAT.armor.color).toEqual(global);expect(fallback.parent).toBeNull();owner.dispose();disposeModel(room);fallbackDisposals.forEach(spy=>expect(spy).toHaveBeenCalledTimes(1));
 });
 it('keeps maps, emission, culling, transparency and unknown materials unchanged; application is idempotent',()=>{
  const root=new T.Group(),map=new T.Texture(),orm=new T.Texture();
  for(const name of [...Object.keys(PASSENGER_FINISHES),'PV_live_cyan','PV_matte_gasket','unrelated'])root.add(new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({name,map,roughnessMap:orm,metalnessMap:orm,emissiveMap:map,emissive:0x157d89,emissiveIntensity:.5})));
  const before=root.children.map(o=>{const m=(o as T.Mesh).material as T.MeshStandardMaterial;return {name:m.name,map:m.map,roughnessMap:m.roughnessMap,metalnessMap:m.metalnessMap,emissiveMap:m.emissiveMap,emissive:m.emissive.clone(),intensity:m.emissiveIntensity,side:m.side,opacity:m.opacity,transparent:m.transparent};});
  applyOwnedEquipmentPalette(root,PASSENGER_FINISHES);
  root.children.forEach((o,i)=>{const m=(o as T.Mesh).material as T.MeshStandardMaterial,b=before[i];expect(m.map).toBe(b.map);expect(m.roughnessMap).toBe(b.roughnessMap);expect(m.metalnessMap).toBe(b.metalnessMap);expect(m.emissiveMap).toBe(b.emissiveMap);expect(m.emissive).toEqual(b.emissive);expect(m.emissiveIntensity).toBe(b.intensity);expect(m.side).toBe(b.side);expect(m.opacity).toBe(b.opacity);expect(m.transparent).toBe(b.transparent);if(!PASSENGER_FINISHES[m.name])expect(m.color.getHex()).toBe(0xffffff);});
  const once=root.children.map(o=>((o as T.Mesh).material as T.MeshStandardMaterial).color.getHex());applyOwnedEquipmentPalette(root,PASSENGER_FINISHES);expect(root.children.map(o=>((o as T.Mesh).material as T.MeshStandardMaterial).color.getHex())).toEqual(once);
 });
});
