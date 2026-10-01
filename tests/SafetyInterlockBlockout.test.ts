import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {disposeModel,MAT} from '../src/render/meshParts';
import {createExpeditionGeometry,canTraverseExpedition,canOccupyExpedition} from '../src/game/world/expeditionGeometry';

const reservations=[[330,210,160,140],[700,210,160,140],[480,580,240,120]].map(([x,y,width,height])=>({x:x/32,y:y/32,width:width/32,height:height/32}));
const model=(i:number,id='safety-interlock-station')=>environmentObstacle('engineering',reservations[i],i,id);
const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
describe('Room12 rough safety equipment',()=>{
 it('places the isolated recorder, AI housing and lower contactor at the retained reservations',()=>{
  expect([0,1,2].map(i=>model(i).name)).toEqual(['safety-recorder','disconnected-ai-housing','split-contactor-battery']);
  const recorder=model(0);
  for(const name of ['inspection-window','record-spool-left','record-spool-right','manual-test-lever','timestamp-plate'])expect(recorder.getObjectByName(name)).toBeDefined();
  const ai=model(1);for(const name of ['empty-socket-left','empty-socket-right'])expect(ai.getObjectByName(name)).toBeDefined();
  expect(bounds(ai).min.x-bounds(recorder).max.x).toBeGreaterThanOrEqual(210/32);
 });
 it('gives the recorder a seated inspection gasket, tape path and sealed pre-awakening plate',()=>{
  const recorder=model(0);
  for(const name of ['inspection-gasket','record-tape-span','timestamp-sill','timestamp-legend','seal-strap'])expect(recorder.getObjectByName(name)).toBeDefined();
  const sill=bounds(recorder.getObjectByName('timestamp-sill')!),plate=bounds(recorder.getObjectByName('timestamp-plate')!);
  expect(plate.min.x).toBeGreaterThan(sill.min.x);expect(plate.max.x).toBeLessThan(sill.max.x);
  expect(plate.min.y).toBeLessThanOrEqual(sill.max.y+.02);
  expect(recorder.getObjectByName('timestamp-legend')!.userData.lines).toEqual(['LOCAL RECORD','BEFORE AWAKENING']);
 });
 it('closes the entire reel mechanism beneath a framed inspection pane',()=>{
  const recorder=model(0),pane=recorder.getObjectByName('sealed-inspection-pane') as T.Mesh;
  expect(pane).toBeDefined();const cover=bounds(pane);
  for(const name of ['record-spool-left','record-spool-right','record-tape-span']){
   const mechanism=bounds(recorder.getObjectByName(name)!);
   expect(cover.min.y).toBeGreaterThan(mechanism.max.y);
   expect(cover.min.x).toBeLessThan(mechanism.min.x);expect(cover.max.x).toBeGreaterThan(mechanism.max.x);
   expect(cover.min.z).toBeLessThan(mechanism.min.z);expect(cover.max.z).toBeGreaterThan(mechanism.max.z);
  }
  const glass=pane.material as T.MeshStandardMaterial;
  expect(glass.transparent).toBe(true);expect(glass.depthWrite).toBe(false);
  expect(recorder.getObjectByName('lid-seal-bridge')).toBeDefined();
  disposeModel(recorder);
 });
 for(const batched of [false,true])it(`releases owned recorder geometry once, batched=${batched}`,()=>{
  const recorder=model(0),control=model(0,''),shared=new Set<T.BufferGeometry>();
  control.traverse(o=>{if(o instanceof T.Mesh)shared.add(o.geometry);});
  const owned=new Set<T.BufferGeometry>();recorder.traverse(o=>{if(o instanceof T.Mesh&&((o.material as T.Material).name==='room12-ivory'||o.name==='sealed-inspection-pane'))owned.add(o.geometry);});
  expect(owned.size).toBeGreaterThan(8);
  const ownedSpies=[...owned].map(g=>vi.spyOn(g,'dispose')),sharedSpies=[...shared].map(g=>vi.spyOn(g,'dispose'));
  const world=new T.Group();appendEnvironment(world,recorder);
  if(batched){const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();renderer.floorMaterial.dispose();for(const spy of ownedSpies)expect(spy).toHaveBeenCalledTimes(1);}
  disposeModel(world);for(const spy of ownedSpies)expect(spy).toHaveBeenCalledTimes(1);
  for(const spy of sharedSpies)expect(spy).not.toHaveBeenCalled();vi.restoreAllMocks();disposeModel(control);
 });
 it('disposes the recorder inscription texture through its owned material',()=>{
  const fillText=vi.fn(),context={fillRect:vi.fn(),fillText,fillStyle:'',font:'',textAlign:'',textBaseline:''};
  vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>context})});
  try{
   const recorder=model(0),legend=recorder.getObjectByName('timestamp-legend') as T.Mesh;
   expect(legend).toBeDefined();const material=legend.material as T.MeshStandardMaterial;
   expect(material.map).toBeInstanceOf(T.CanvasTexture);const spy=vi.spyOn(material.map!,'dispose');
   expect(fillText.mock.calls.map(c=>c[0])).toEqual(['LOCAL RECORD','BEFORE AWAKENING']);
   disposeModel(recorder);expect(spy).toHaveBeenCalledTimes(1);
  }finally{vi.unstubAllGlobals();}
 });
 it('shares ivory with the inscription without tinting other geometry or changing the local lamp',()=>{
  const paints:unknown[][]=[];
  const context={fillStyle:'',font:'',textAlign:'',textBaseline:'',fillRect(...args:number[]){paints.push([this.fillStyle,...args]);},fillText:vi.fn()};
  vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>context})});
  try{
   const recorder=model(0),legend=recorder.getObjectByName('timestamp-legend') as T.Mesh;
   const ivory=(recorder.getObjectByName('recorder-body') as T.Mesh).material as T.MeshStandardMaterial;
   expect(legend.material).toBe(ivory);expect(ivory.color.getHex()).toBe(0xc9c0a3);
   expect(ivory.metalness).toBe(.12);expect(ivory.roughness).toBe(.72);
   expect(ivory.map).toBeInstanceOf(T.CanvasTexture);expect(ivory.map!.colorSpace).toBe(T.SRGBColorSpace);
   expect(ivory.map!.generateMipmaps).toBe(false);expect(ivory.map!.minFilter).toBe(T.LinearFilter);
   expect(paints.at(-1)).toEqual(['#ffffff',0,0,16,16]);
   let protectedMeshes=0;
   recorder.traverse(o=>{if(o instanceof T.Mesh&&o.material===ivory&&o!==legend){
    protectedMeshes++;const uv=o.geometry.getAttribute('uv');
    for(let i=0;i<uv.count;i++){expect(uv.getX(i)).toBeCloseTo(8/768,7);expect(uv.getY(i)).toBeCloseTo(1-8/160,7);}
   }});
   expect(protectedMeshes).toBeGreaterThan(8);
   expect(Array.from(legend.geometry.getAttribute('uv').array)).toEqual([0,1,1,1,0,0,1,0]);
   const lamp=(recorder.getObjectByName('steady-local-lamp') as T.Mesh).material as T.MeshStandardMaterial;
   expect(lamp).not.toBe(ivory);expect(lamp.name).toBe('room12-local-light');
   expect(lamp.color.getHex()).toBe(0xd2ba7e);expect(lamp.emissive.getHex()).toBe(0xc8a361);expect(lamp.emissiveIntensity).toBe(.35);
   disposeModel(recorder);
  }finally{vi.unstubAllGlobals();}
 });
 it('leaves a measurable gap between actual copper jaws, with a separate battery',()=>{
  const lower=model(2),left=lower.getObjectByName('contactor-left'),right=lower.getObjectByName('contactor-right');
  expect(left).toBeDefined();expect(right).toBeDefined();
  expect(bounds(right!).min.x-bounds(left!).max.x).toBeGreaterThan(.5);
  expect(lower.getObjectByName('local-battery')).toBeDefined();
 });
 for(const i of [0,1,2])it(`grounds and contains reservation ${i} before and after real batching`,()=>{
  const root=model(i),f=reservations[i],world=new T.Group();
  const check=(o:T.Object3D)=>{const b=bounds(o);expect(b.min.x).toBeGreaterThanOrEqual(f.x-1e-5);expect(b.max.x).toBeLessThanOrEqual(f.x+f.width+1e-5);expect(b.min.z).toBeGreaterThanOrEqual(f.y-1e-5);expect(b.max.z).toBeLessThanOrEqual(f.y+f.height+1e-5);expect(b.min.y).toBeCloseTo(0,5);expect(b.max.y).toBeLessThan(2.5);};
  check(root);appendEnvironment(world,root);
  const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();check(world);
  const materials=new Set<T.Material>();world.traverse(o=>{if(o instanceof T.Mesh)materials.add(o.material as T.Material);});
  expect(materials.size).toBeLessThanOrEqual(6);const spies=[...materials].map(m=>{expect(Object.values(MAT)).not.toContain(m);expect(m.userData.actorMaterial).toBe(true);return vi.spyOn(m,'dispose');});
  disposeModel(world);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);renderer.floorMaterial.dispose();vi.restoreAllMocks();
 });
 it('does not replace the neighboring room or generic engineering models',()=>{
  const signature=(o:T.Object3D)=>{const data:unknown[]=[];o.traverse(m=>{if(m instanceof T.Mesh)data.push([m.position.toArray(),m.scale.toArray(),m.geometry.uuid,(m.material as T.MeshStandardMaterial).color.getHex()]);});return data;};
  expect(signature(model(0,'diagnostic-gallery'))).toEqual(signature(model(0,'')));
  expect(model(0).name).not.toBe(model(0,'diagnostic-gallery').name);
 });
 it('retains canonical collision, direct route, bypasses and viewing approaches for both actor radii',()=>{
  const g=createExpeditionGeometry({id:'room12-check',depth:11,kind:'combat',reward:'upgrade',next:[],templateId:'safety-interlock-station'});
  expect(g.voids??[]).toEqual([]);
  const paths=[[[100,440],[1100,440]],[[100,440],[100,140],[1100,140],[1100,440]],[[100,440],[100,760],[1100,760],[1100,440]],[[410,440],[410,395]],[[780,440],[780,395]],[[600,440],[600,535]]];
  for(const r of [16,28]){for(const path of paths)for(let j=1;j<path.length;j++)expect(canTraverseExpedition(g,{x:path[j-1][0],y:path[j-1][1]},{x:path[j][0],y:path[j][1]},r)).toBe(true);for(const b of g.breaches)expect(canOccupyExpedition(g,{x:b.x+(b.facing==='east'?56:-56),y:b.y},r)).toBe(true);}
 });
});
