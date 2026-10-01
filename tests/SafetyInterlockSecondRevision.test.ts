import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {safetyInterlockBlockout} from '../src/render/SafetyInterlockBlockout';
import {disposeModel} from '../src/render/meshParts';
const model=(i:number)=>safetyInterlockBlockout({x:0,y:0,width:i===2?7.5:5,height:i===2?3.75:4.375},i);
const part=(r:T.Object3D,n:string)=>{const p=r.getObjectByName(n);expect(p,`missing ${n}`).toBeDefined();return p!;};
const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
describe('Room12 second service revision',()=>{
 it('attaches a substantial tilted service door to hinges behind an exposed recessed board',()=>{
  const r=model(1),door=part(r,'open-ai-service-panel'),b=bounds(door);
  expect(b.getSize(new T.Vector3()).x).toBeGreaterThan(3);
  expect(b.getSize(new T.Vector3()).y).toBeGreaterThan(.6);
  expect(b.min.y).toBeGreaterThan(bounds(part(r,'exposed-circuit-board')).max.y);
  expect(bounds(part(r,'panel-hinge')).intersectsBox(b)).toBe(true);
  for(const n of ['panel-inner-recess','panel-stay','ai-protective-cheek-left','ai-protective-cheek-right','socket-recess-bed','service-edge-wear'])part(r,n);
  disposeModel(r);
 });
 it('keeps the pulled lead attached at both ends with a supported route and a visible isolation gap',()=>{
  const r=model(1);r.updateMatrixWorld(true);
  const lead=part(r,'disconnected-lead') as T.Mesh,g=lead.geometry as T.TubeGeometry;
  for(const [t,n] of [[0,'plug-sleeve'],[1,'ai-cable-gland']] as const){const p=lead.localToWorld(g.parameters.path.getPointAt(t));expect(bounds(part(r,n)).expandByScalar(.02).containsPoint(p)).toBe(true);}
  for(const n of ['lead-support-front','lead-support-rear'])expect(bounds(part(r,n)).intersectsBox(bounds(lead))).toBe(true);
  expect(bounds(part(r,'disconnected-plug')).min.x-bounds(part(r,'disconnect-receptacle')).max.x).toBeGreaterThan(.3);
  disposeModel(r);
 });
 it('protects the sealed recorder and lower contactor with recessed layered housings',()=>{
  const r=model(0),lower=model(2);
  for(const n of ['recorder-impact-shoulder-left','recorder-impact-shoulder-right','recorder-side-recess','control-thumb-wear'])part(r,n);
  expect(bounds(part(r,'sealed-inspection-pane')).min.y).toBeGreaterThan(bounds(part(r,'record-tape-span')).max.y);
  for(const n of ['contactor-cradle-left','contactor-cradle-right','battery-protective-saddle'])part(lower,n);
  disposeModel(r);disposeModel(lower);
 });
});
