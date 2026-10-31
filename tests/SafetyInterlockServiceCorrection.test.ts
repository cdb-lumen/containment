import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {safetyInterlockBlockout} from '../src/render/SafetyInterlockBlockout';
import {safetyInterlockArchitecture} from '../src/render/SafetyInterlockArchitecture';
import {disposeModel} from '../src/render/meshParts';
const footprints=[[330,210,160,140],[700,210,160,140],[480,580,240,120]].map(([x,y,width,height])=>({x:x/32,y:y/32,width:width/32,height:height/32}));
const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
const part=(o:T.Object3D,n:string)=>{const p=o.getObjectByName(n);expect(p,`missing ${n}`).toBeDefined();return p!;};
describe('Room12 rejected-candidate correction',()=>{
 it('retains the exact fitted island world boundaries',()=>{
  footprints.forEach((f,i)=>{
   const root=safetyInterlockBlockout(f,i),b=bounds(root);
   expect(b.min.x).toBeCloseTo(f.x+f.width*.015,5);
   expect(b.max.x).toBeCloseTo(f.x+f.width*.985,5);
   expect(b.min.z).toBeCloseTo(f.y+f.height*.015,5);
   expect(b.max.z).toBeCloseTo(f.y+f.height*.985,5);
   expect(b.min.y).toBeCloseTo(0,5);
   // The second revision opens the AI lid but retains the collision footprint.
   // Equipment and the raised door must remain under the existing 2.5-unit cap.
   expect(b.max.y).toBeLessThan(2.5);
   expect(b.max.y).toBeGreaterThan(1.6);
   disposeModel(root);
  });
 });
 it('presents a broad contrasting tape face below low-tint glass',()=>{
  const root=safetyInterlockBlockout(footprints[0],0),tape=part(root,'record-tape-span') as T.Mesh;
  const shape=(tape.geometry as T.ExtrudeGeometry).parameters.shapes as T.Shape;
  // The lower head run needs a top face wider than a subpixel hairline.
  const points=shape.getPoints();const zs=points.filter(p=>p.x>=-.43&&p.x<=.08).map(p=>-p.y);
  expect(Math.max(...zs)-Math.min(...zs)).toBeGreaterThanOrEqual(.10);
  const material=tape.material as T.MeshStandardMaterial;
  const backing=(part(root,'inspection-window') as T.Mesh).material as T.MeshStandardMaterial;
  const luminance=(c:T.Color)=>.2126*c.r+.7152*c.g+.0722*c.b;
  expect((luminance(material.color)+.05)/(luminance(backing.color)+.05)).toBeGreaterThan(3);
  const glass=(part(root,'sealed-inspection-pane') as T.Mesh).material as T.MeshStandardMaterial;
  expect(glass.opacity).toBeLessThanOrEqual(.14);
  expect(bounds(tape).max.y).toBeLessThan(bounds(part(root,'sealed-inspection-pane')).min.y);
  disposeModel(root);
 });
 it('joins fitted equipment fittings with flush contained conductors, never across AI isolation',()=>{
  const shell=new T.Group();safetyInterlockArchitecture(shell,37.5,27.5);
  const models=footprints.map((f,i)=>safetyInterlockBlockout(f,i));models.forEach(m=>m.updateMatrixWorld(true));
  for(const [name,index,port] of [['recorder-load',0,'recorder-service-entry'],['recorder-load',2,'load-service-entry'],['ai-rear',1,'ai-service-entry'],['battery-return',2,'return-service-entry']] as const){
   const route=part(shell,`service-route-${name}`),entry=part(models[index],port),p=bounds(entry).getCenter(new T.Vector3());
   const conductors: T.Box3[]=[];route.traverse(o=>{if(o.name==='inset-conductor')conductors.push(bounds(o));});
   expect(conductors.some(b=>b.clone().expandByScalar(.02).containsPoint(new T.Vector3(p.x,.014,p.z)))).toBe(true);
   route.traverse(o=>{if(o instanceof T.Mesh){const b=bounds(o);expect(b.max.y).toBeLessThanOrEqual(.025);expect(b.min.x).toBeGreaterThanOrEqual(0);expect(b.max.x).toBeLessThanOrEqual(37.5);expect(b.min.z).toBeGreaterThanOrEqual(0);expect(b.max.z).toBeLessThanOrEqual(27.5);}});
   // Every conductor segment meets its predecessor, and sits inside a trough bed.
   for(let i=1;i<conductors.length;i++)expect(conductors[i].intersectsBox(conductors[i-1])).toBe(true);
   const beds:T.Box3[]=[];route.traverse(o=>{if(o.name==='trough-bed')beds.push(bounds(o));});
   for(const c of conductors)expect(beds.some(b=>b.min.x<=c.min.x&&b.max.x>=c.max.x&&b.min.z<=c.min.z&&b.max.z>=c.max.z&&b.max.y<c.min.y)).toBe(true);
  }
  const load=bounds(part(shell,'service-route-recorder-load')),ai=bounds(part(shell,'service-route-ai-rear'));
  expect(load.intersectsBox(ai)).toBe(false);
  expect(ai.min.z).toBeCloseTo(0,5);
  expect(bounds(part(shell,'service-route-battery-return')).max.z).toBeGreaterThanOrEqual(25.75);
  for(const [index,lead,terminal] of [[0,'recorder-service-riser','recorder-terminal-block'],[1,'ai-service-riser','ai-cable-gland'],[2,'load-service-riser','load-output-gland'],[2,'return-service-riser','battery-return-gland']] as const){
   const cable=part(models[index],lead) as T.Mesh,g=cable.geometry as T.TubeGeometry;
   const endpoint=cable.localToWorld(g.parameters.path.getPointAt(1));
   expect(bounds(part(models[index],terminal)).containsPoint(endpoint)).toBe(true);
  }
  models.forEach(disposeModel);disposeModel(shell);
 });
});
