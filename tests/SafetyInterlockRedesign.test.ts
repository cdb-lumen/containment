import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {safetyInterlockBlockout} from '../src/render/SafetyInterlockBlockout';
import {appendEnvironment} from '../src/render/ShipEnvironments';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {disposeModel} from '../src/render/meshParts';

const model=(role:number)=>safetyInterlockBlockout({x:0,y:0,width:role===2?7.5:5,height:role===2?3.75:4.375},role);
const part=(root:T.Object3D,name:string)=>{const p=root.getObjectByName(name);expect(p,`missing functional geometry: ${name}`).toBeDefined();return p!;};
const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
const mesh=(root:T.Object3D,name:string)=>part(root,name) as T.Mesh;
const worldPoint=(o:T.Object3D,p:T.Vector3)=>{o.updateWorldMatrix(true,false);return o.localToWorld(p.clone());};

describe('Room12 functional model redesign',()=>{
 it('uses open reel flanges around wound tape, with an actual guided tape path under the seal',()=>{
  const root=model(0),pane=bounds(part(root,'sealed-inspection-pane'));
  for(const side of ['left','right']){
   const flange=mesh(root,`reel-flange-${side}-upper`),pack=mesh(root,`wound-tape-${side}`);
   expect(flange.geometry).toBeInstanceOf(T.ExtrudeGeometry);
   const shape=(flange.geometry as T.ExtrudeGeometry).parameters.shapes as T.Shape;
   expect(shape.holes.length).toBeGreaterThanOrEqual(4);
   for(const hole of shape.holes){
    const holeBox=new T.Box2().setFromPoints(hole.getPoints(32)),center=holeBox.getCenter(new T.Vector2());
    const p=worldPoint(flange,new T.Vector3(center.x,center.y,0));
    const ray=new T.Raycaster(p.add(new T.Vector3(0,2,0)),new T.Vector3(0,-1,0));
    expect(ray.intersectObject(flange)).toHaveLength(0);
   }
   expect(bounds(flange).getSize(new T.Vector3()).x).toBeGreaterThan(bounds(pack).getSize(new T.Vector3()).x);
   expect(bounds(pack).max.y).toBeLessThan(bounds(flange).min.y+.01);
   expect(bounds(flange).max.y).toBeLessThan(pane.min.y);
  }
  const tape=mesh(root,'record-tape-span');
  expect(tape.geometry.type).toBe('ExtrudeGeometry');
  const tapeBounds=bounds(tape);
  expect(tapeBounds.getSize(new T.Vector3()).z).toBeGreaterThan(.25);
  expect(tapeBounds.max.y).toBeLessThan(pane.min.y);
  for(const name of ['tape-head','tape-guide-left','tape-guide-right','recorder-drive-belt','recorder-local-harness'])expect(part(root,name)).toBeDefined();
  disposeModel(root);
 });
 it('opens the AI shell to real circuit boards, heat-sink fins and capacitors',()=>{
  const root=model(1),board=mesh(root,'exposed-circuit-board');root.updateMatrixWorld(true);
  const b=bounds(board),center=b.getCenter(new T.Vector3());
  // The board must be visible from above, not buried below the old solid housing.
  const ray=new T.Raycaster(new T.Vector3(center.x,4,center.z),new T.Vector3(0,-1,0));
  const hits=ray.intersectObject(root,true);
  expect(hits[0].object).toBe(board);
  const shell=part(root,'ai-housing');expect(shell).toBeInstanceOf(T.Group);
  for(const name of ['processor-heatsink','capacitor-bank','ai-internal-harness'])expect(part(root,name)).toBeDefined();
  const fins=part(root,'processor-heatsink').children;
  expect(fins.length).toBeGreaterThanOrEqual(5);
  expect(bounds(fins[1]).min.x-bounds(fins[0]).max.x).toBeGreaterThan(.03);
  disposeModel(root);
 });
 it('shows an unplugged lead with exposed pins and a clear gap to its upward-facing receptacle',()=>{
  const root=model(1),socket=part(root,'disconnect-receptacle'),plug=part(root,'disconnected-plug');
  const gap=bounds(plug).min.x-bounds(socket).max.x;expect(gap).toBeGreaterThan(.3);
  const pins=part(root,'exposed-plug-pins');expect(pins.children.length).toBeGreaterThanOrEqual(3);
  expect(bounds(pins).min.x).toBeLessThan(bounds(part(root,'plug-sleeve')).min.x);
  const lead=mesh(root,'disconnected-lead');expect(lead.geometry).toBeInstanceOf(T.TubeGeometry);
  expect(bounds(lead).max.z).toBeLessThanOrEqual(bounds(part(root,'housing-base')).max.z);
  disposeModel(root);
 });
 it('builds forked conducting jaws on fluted ceramic insulators without bridging the break',()=>{
  const root=model(2),left=mesh(root,'contactor-left'),right=mesh(root,'contactor-right');
  expect(left.geometry).toBeInstanceOf(T.ExtrudeGeometry);expect(right.geometry).toBeInstanceOf(T.ExtrudeGeometry);
  const lb=bounds(left),rb=bounds(right);expect(rb.min.x-lb.max.x).toBeGreaterThan(.5);
  for(const side of ['left','right']){
   const insulator=mesh(root,`fluted-insulator-${side}`);
   expect(insulator.geometry).toBeInstanceOf(T.LatheGeometry);
   const profile=(insulator.geometry as T.LatheGeometry).parameters.points;
   expect(new Set(profile.map(p=>p.x)).size).toBeGreaterThanOrEqual(3);
   expect(bounds(insulator).max.y).toBeLessThanOrEqual(bounds(side==='left'?left:right).max.y);
  }
  const gap=new T.Box3(new T.Vector3(lb.max.x+.03,lb.min.y,Math.max(lb.min.z,rb.min.z)),new T.Vector3(rb.min.x-.03,Math.max(lb.max.y,rb.max.y)+.2,Math.min(lb.max.z,rb.max.z)));
  root.traverse(o=>{if(o instanceof T.Mesh&&o!==left&&o!==right)expect(bounds(o).intersectsBox(gap),`${o.name} bridges the contact gap`).toBe(false);});
  disposeModel(root);
 });
 it('terminates heavy battery supply and return cables on the actual battery and load fittings',()=>{
  const root=model(2);
  for(const [name,start,end] of [['battery-supply-cable','battery-positive-terminal','contactor-feed-lug'],['battery-return-cable','battery-negative-terminal','battery-return-gland'],['contactor-load-cable','contactor-load-lug','load-output-gland']]){
   const cable=mesh(root,name),geometry=cable.geometry as T.TubeGeometry;
   expect(geometry).toBeInstanceOf(T.TubeGeometry);expect(geometry.parameters.radius).toBeGreaterThanOrEqual(.09);
   for(const [t,target] of [[0,start],[1,end]] as const){
    const point=worldPoint(cable,geometry.parameters.path.getPointAt(t));
    expect(bounds(part(root,target)).expandByScalar(.04).containsPoint(point),`${name} misses ${target}`).toBe(true);
   }
  }
  disposeModel(root);
 });
 for(const role of [0,1,2])for(const batched of [false,true])it(`owns and releases custom geometry once, role=${role}, batched=${batched}`,()=>{
  const root=model(role),owned=new Set<T.BufferGeometry>();
  root.traverse(o=>{if(o instanceof T.Mesh&&o.geometry.userData.environmentUV)owned.add(o.geometry);});
  expect(owned.size).toBeGreaterThan(2);
  const spies=[...owned].map(g=>vi.spyOn(g,'dispose')),world=new T.Group();appendEnvironment(world,root);
  if(batched){const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();renderer.floorMaterial.dispose();}
  disposeModel(world);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);vi.restoreAllMocks();
 });
});
