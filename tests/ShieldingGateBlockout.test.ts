import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment} from '../src/render/ShipEnvironments';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';

const solids=ROOM_TEMPLATES['shielding-gate'].obstacles;
const models=()=>solids.map((s,i)=>environmentObstacle('containment',{x:s.x/32,y:s.y/32,width:s.width/32,height:s.height/32},i,'shielding-gate'));
const named=(r:T.Object3D,prefix:string)=>{const found:T.Object3D[]=[];r.traverse(o=>{if(o.name.startsWith(prefix))found.push(o);});return found;};
describe('Room17 rough shield gate',()=>{
 it('replaces repeated generic cells with two nested static gate assemblies and backing cover',()=>{
  const m=models();
  expect(m.map(r=>r.name)).toEqual(['shielding-gate-west','shielding-gate-backing','shielding-gate-east']);
  for(const i of [0,2]){
   expect(named(m[i],'shield-leaf-')).toHaveLength(3);
   expect(named(m[i],'screw-shaft')).toHaveLength(1);
   expect(named(m[i],'guide-shoe-')).toHaveLength(2);
   expect(named(m[i],'gear-housing')).toHaveLength(1);
   expect(named(m[i],'backing-layer-').length).toBeGreaterThanOrEqual(3);
  }
 });
 it('keeps every vertex inside the original collision footprints before and after batching',()=>{
  for(const [i,model] of models().entries()){
   const f=solids[i];
   for(const object of [model,(()=>{const g=new T.Group();appendEnvironment(g,model.clone(true));return g;})()]){
    const b=new T.Box3().setFromObject(object,true);
    expect(b.min.x).toBeGreaterThanOrEqual(f.x/32-1e-6);expect(b.max.x).toBeLessThanOrEqual((f.x+f.width)/32+1e-6);
    expect(b.min.z).toBeGreaterThanOrEqual(f.y/32-1e-6);expect(b.max.z).toBeLessThanOrEqual((f.y+f.height)/32+1e-6);
    expect(b.min.y).toBeGreaterThanOrEqual(-1e-6);
   }
  }
 });
 it('places gate machinery inside stage1 G1 and G2 reservations without spanning the threshold',()=>{
  const m=models();
  for(const [i,x] of [[0,310],[2,810]]){
   m[i].updateMatrixWorld(true);
   const g=m[i].getObjectByName('gate-mechanism');expect(g).toBeDefined();
   const b=new T.Box3().setFromObject(g!,true);
   expect(b.min.x*32).toBeGreaterThanOrEqual(x-1e-5);expect(b.max.x*32).toBeLessThanOrEqual(x+80+1e-5);
   expect(b.min.z*32).toBeGreaterThanOrEqual(345-1e-5);expect(b.max.z*32).toBeLessThanOrEqual(435+1e-5);
  }
 });
 it('uses room-local dull shielding, brushed contacts and nonemissive service paint',()=>{
  for(const model of models()){
   const layer=model.getObjectByName('backing-layer-0') as T.Mesh;
   const lead=layer.material as T.MeshStandardMaterial;
   expect(lead.name).toBe('shielding-gate-lead');
   expect(lead.roughness).toBeGreaterThanOrEqual(.75);
   expect(Math.max(lead.color.r,lead.color.g,lead.color.b)).toBeLessThan(.3);
  }
  const west=models()[0];
  const steel=(west.getObjectByName('contact-edge-0') as T.Mesh).material as T.MeshStandardMaterial;
  expect(steel.name).toBe('shielding-gate-contact');expect(steel.roughness).toBeGreaterThan(.4);
  west.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;expect(m.emissive.getHex()).toBe(0);}});
 });
 it('breaks long shielding shells into recessed cassettes and connected transverse saddles',()=>{
  for(const model of models()){
   expect(named(model,'shell-cassette-').length).toBeGreaterThanOrEqual(6);
   expect(named(model,'shell-saddle-').length).toBeGreaterThanOrEqual(2);
  }
 });
 it('has tapered static locks, recessed seals and dosimeter wells in both gate heads',()=>{
  for(const i of [0,2]){
   const model=models()[i];
   const wedge=model.getObjectByName('locking-wedge') as T.Mesh;
   expect(wedge).toBeDefined();
   const p=wedge.geometry.getAttribute('position');
   const xs=new Set(Array.from({length:p.count},(_,n)=>p.getX(n).toFixed(3)));
   expect(xs.size).toBeGreaterThanOrEqual(3);
   expect(named(model,'compression-seal-')).toHaveLength(3);
   expect(named(model,'dosimeter-well')).toHaveLength(1);
   expect(named(model,'bearing-collar-')).toHaveLength(2);
  }
 });
 it('connects the exposed screw to a traveling nut and a raised open locking yoke',()=>{
  for(const i of [0,2]){
   const model=models()[i];model.updateMatrixWorld(true);
   const bounds=(name:string)=>{const o=model.getObjectByName(name);expect(o,name).toBeDefined();return new T.Box3().setFromObject(o!,true);};
   const nut=bounds('traveling-nut'),shaft=bounds('screw-shaft');
   expect(nut.intersectsBox(shaft)).toBe(true);
   expect(bounds('drive-clevis').intersectsBox(nut)).toBe(true);
   expect(bounds('lock-pocket').max.y*32).toBeGreaterThan(115);
   expect(bounds('locking-wedge').getSize(new T.Vector3()).x*32).toBeGreaterThanOrEqual(23);
   expect(named(model,'lock-cheek-')).toHaveLength(2);
   expect(named(model,'lock-seat-')).toHaveLength(2);
   expect(bounds('dosimeter-well').getSize(new T.Vector3()).z*32).toBeGreaterThan(14);
   expect(bounds('dosimeter-well').min.y*32).toBeGreaterThan(115);
   expect(named(model,'manual-wheel')).toHaveLength(1);
  }
 });
 it('leaves the other containment room on its existing model path',()=>{
  const r=environmentObstacle('containment',{x:0,y:0,width:3,height:8},0,'containment-annulus');
  expect(r.name).toBe('containment-obstacle-0');expect(named(r,'shield-leaf-')).toHaveLength(0);
 });
});
