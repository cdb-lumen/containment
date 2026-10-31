import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import proposedContour from '../../tests/fixtures/swarm-organ-proposed-contour.json';
import {createHash} from 'node:crypto';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../game/world/expeditionGeometry';
import {environmentArchitecture} from './ShipEnvironments';
import {DepthRenderer} from './DepthRenderer';
import {disposeModel,MAT} from './meshParts';
const layout=JSON.parse(readFileSync('docs/art-evidence/room16-story-flow-v3/stage-1/attempt-1011/layout.json','utf8'));
const point=([x,y]:number[])=>({x,y});
const template=ROOM_TEMPLATES['swarm-junction'];
const node={id:'room16-test',templateId:'swarm-junction',depth:16,kind:'combat',next:[],reward:'upgrade'} as const;
const model=()=>{const root=new T.Group();environmentArchitecture(root,'infested',37.5,27.5,'swarm-junction');root.updateMatrixWorld(true);return root;};
const bake=(world:T.Group)=>(DepthRenderer.prototype as unknown as {bakeWorld:()=>void}).bakeWorld.call({world});
const meshes=(root:T.Group)=>{const out:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)out.push(o);});return out;};
describe('Room16 room visuals',()=>{
 it('closes the continuous curved body and cavity lip with opposite directed edges and outward faces',()=>{
  const root=model(),plates=meshes(root).filter(m=>m.name==='organ-bed');expect(plates).toHaveLength(1);
  const lip=meshes(root).find(m=>m.name==='sensory-carapace-lip')!;expect(lip).toBeDefined();
  const badEdges=(indices:number[])=>{
   const edges=new Map<string,number[]>();
   for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
    const a=indices[i+j],b=indices[i+(j+1)%3],key=`${Math.min(a,b)},${Math.max(a,b)}`;
    const e=edges.get(key)??[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);
   }
   return [...edges.values()].filter(([count,direction])=>count!==2||direction!==0).length;
  };
  for(const plate of [...plates,lip]){
   const p=plate.geometry.getAttribute('position'),indices=Array.from(plate.geometry.index!.array);
   expect(badEdges(indices),plate.name).toBe(0);
   const corrupted=[...indices];[corrupted[1],corrupted[2]]=[corrupted[2],corrupted[1]];expect(badEdges(corrupted)).toBeGreaterThan(0);
   let volume=0;
   for(let i=0;i<indices.length;i+=3){
    const ids=indices.slice(i,i+3),v=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j));
    const cross=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));expect(cross.lengthSq()).toBeGreaterThan(1e-12);
    volume+=v[0].dot(v[1].clone().cross(v[2]))/6;
    if(plate!==lip){
     if(ids.every(j=>j>=p.count/2))expect(cross.y,plate.name).toBeGreaterThan(0);
     if(ids.every(j=>j<p.count/2))expect(cross.y,plate.name).toBeLessThan(0);
    }else{
     const band=Math.floor(i/(48*6));
     if(band<2)expect(cross.y,'lip upper slope').toBeGreaterThan(0);
     if(band===2){const center=v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1/3);expect(cross.dot(new T.Vector3(600/32-center.x,0,260/32-center.z)),'lip inner wall').toBeGreaterThan(0);}
     if(band===3)expect(cross.y,'lip underside').toBeLessThan(0);
    }
   }
   expect(volume,plate.name).toBeGreaterThan(0);
  }
  disposeModel(root);
 });
 it('keeps the rounded underbody closed with positive volume and the full shot-plane silhouette',()=>{
  const bed=meshes(model()).find(m=>m.name==='organ-bed')!,p=bed.geometry.getAttribute('position'),indices=Array.from(bed.geometry.index!.array);
  const edges=new Map<string,{count:number;direction:number}>();let volume=0;
  for(let i=0;i<indices.length;i+=3){
   const ids=indices.slice(i,i+3),v=ids.map(j=>new T.Vector3().fromBufferAttribute(p,j));
   expect(v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).lengthSq()).toBeGreaterThan(1e-12);
   volume+=v[0].dot(v[1].clone().cross(v[2]))/6;
   for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=`${Math.min(a,b)},${Math.max(a,b)}`,e=edges.get(key)??{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}
  }
  for(const edge of edges.values()){expect(edge.count).toBe(2);expect(edge.direction).toBe(0);}expect(volume).toBeGreaterThan(0);
  // Every revised footprint corner has continuous shell mass across the fallback shot plane.
  for(const point of template.voids![0]){
   const samples=Array.from({length:p.count},(_,i)=>new T.Vector3().fromBufferAttribute(p,i));
   const column=samples.filter(v=>Math.hypot(v.x*32-point.x,v.z*32-point.y)<.001);expect(Math.min(...column.map(v=>v.y))).toBe(0);expect(Math.max(...column.map(v=>v.y*32))).toBeGreaterThanOrEqual(30.4);
  }
  disposeModel(bed.parent as T.Group);
 });
 it('uses one curved charcoal mass rather than repeated plate belts around its sunken cavity',()=>{
  const root=model(),ms=meshes(root);
  expect(ms.filter(m=>m.name.includes('-plate-'))).toHaveLength(0);
  expect((ms.find(m=>m.name==='organ-bed')!.material as T.Material).name).toBe('swarm-charcoal');
  expect(template.voids![0]).toHaveLength(132);
  const cavity=ms.find(m=>m.name==='sensory-recess')!,lip=ms.find(m=>m.name==='sensory-carapace-lip')!;
  const cb=new T.Box3().setFromObject(cavity),lb=new T.Box3().setFromObject(lip);
  expect(cb.getSize(new T.Vector3()).x*32).toBeGreaterThan(55);
  expect(lb.max.y*32-cb.max.y*32).toBeGreaterThan(7);
  const ray=new T.Raycaster(new T.Vector3(600/32,4,260/32),new T.Vector3(0,-1,0));
  expect(ray.intersectObject(root,true)[0].object.name).toBe('sensory-recess');
  expect(ms.some(m=>m.name==='severed-distributor')).toBe(true);
  disposeModel(root);
 });
 it('keeps recognizable cabinet components mechanically connected and exposed',()=>{
  const root=model(),ms=meshes(root),part=(name:string)=>ms.find(m=>m.name===name)!;
  const box=(m:T.Mesh)=>new T.Box3().setFromObject(m).expandByScalar(1e-6);
  const housing=part('severed-distributor'),front=part('distributor-front-right'),lid=part('torn-distributor-lid');
  expect(box(housing).intersectsBox(box(front))).toBe(true);
  expect(box(housing).intersectsBox(box(lid))).toBe(true);
  const sockets=ms.filter(m=>m.name==='distributor-terminal-socket'),cores=ms.filter(m=>m.name==='distributor-terminal-core');
  expect(sockets).toHaveLength(3);expect(cores).toHaveLength(3);
  for(let i=0;i<3;i++){expect(box(front).intersectsBox(box(sockets[i]))).toBe(true);expect(box(sockets[i]).intersectsBox(box(cores[i]))).toBe(true);}
  for(const m of ms.filter(m=>m.name==='distributor-vent-slot'||m.name==='distributor-housing-fastener'))expect(box(housing).intersectsBox(box(m)),m.name).toBe(true);
  // Visible upper housing and torn lid must remain above the surrounding shell.
  for(const [x,z,name] of [[635,250,'severed-distributor'],[640,225,'torn-distributor-lid']] as const){
   const target=new T.Vector3(x/32,43.5/32,z/32),direction=new T.Vector3(0,26,19).normalize();
   const ray=new T.Raycaster(target.clone().addScaledVector(direction,10),direction.clone().negate());
   expect(ray.intersectObject(root,true)[0]?.object.name).toBe(name);
  }
  disposeModel(root);
 });
 it('uses a varying organic heightfield, differentiated materials and recessed wall bays',()=>{
  const root=model(),ms=meshes(root);
  const plate=ms.find(m=>m.name==='organ-bed')!;
  const ys=new Set(Array.from(plate.geometry.getAttribute('position').array).filter((_,i)=>i%3===1).map(v=>v.toFixed(4)));
  expect(ys.size).toBeGreaterThan(4);
  const material=(name:string)=>ms.map(m=>m.material as T.MeshStandardMaterial).find(m=>m.name===name)!;
  expect(material('swarm-charcoal').roughness).toBeLessThan(material('swarm-bone-grey').roughness);
  expect(material('swarm-human-metal').metalness).toBeGreaterThan(.65);
  expect(ms.filter(m=>m.name==='bulkhead-inset')).toHaveLength(9);
  expect(ms.some(m=>m.name==='hub-split-conduit')).toBe(true);
  disposeModel(root);
 });
 it('uses the explicit revised curved contour while preserving the historical baseline and all anchors',()=>{
  expect(template.voids).toEqual([proposedContour]);expect(layout.organPolygon).toHaveLength(18);expect(template.voids).not.toEqual([layout.organPolygon.map(point)]);expect(template.obstacles).toEqual([]);
  expect([template.width,template.height,template.spawn,template.exit,template.breaches]).toEqual([1200,880,{x:100,y:440},{x:1100,y:440},[{x:100,y:100},{x:1100,y:100},{x:100,y:780},{x:1100,y:780}]]);
  for(const o of [template,template.voids,template.voids?.[0],...(template.voids?.[0]??[])])expect(Object.isFrozen(o)).toBe(true);
 });
 // Reference: main-equivalent HUD51610c6 tree; Room16 is the sole template delta.
 it('leaves every other room template byte-equivalent',()=>{
  const others=Object.fromEntries(Object.entries(ROOM_TEMPLATES).filter(([id])=>id!=='swarm-junction'));
  expect(createHash('sha256').update(JSON.stringify(others)).digest('hex')).toBe('ebf41d99facd54ba19514602b1c3c6821d70533e9ad79feddb9d0d94db81fc8d');
 });
 for(const radius of [16,28,38])it(`retains all planned routes, breaches and connected usable space for radius ${radius}`,()=>{
  const g=createExpeditionGeometry(node);
  const routes=[...Object.values(layout.routes) as number[][][],...g.breaches.map(b=>[[b.x,b.y],[b.x+(b.facing==='east'?56:-56),b.y]]),[[600,440],[600,480],[600,650],[600,740]]];
  for(const route of routes)for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,point(route[i-1]),point(route[i]),radius),JSON.stringify(route)).toBe(true);
  for(const p of [...Object.values(layout.activities) as number[][],...Object.values(layout.arms) as number[][]])expect(canOccupyExpedition(g,point(p),radius)).toBe(true);
  const nodes=new Map<string,{x:number;y:number}>();for(let y=40;y<880;y+=20)for(let x=40;x<1200;x+=20)if(canTraverseExpedition(g,{x,y},{x,y},radius))nodes.set(`${x},${y}`,{x,y});
  const first=nodes.keys().next().value!;const unseen=new Set(nodes.keys());unseen.delete(first);const queue=[first];
  for(let i=0;i<queue.length;i++){const p=nodes.get(queue[i])!;for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const k=`${p.x+dx},${p.y+dy}`;if(unseen.has(k)&&canTraverseExpedition(g,p,nodes.get(k)!,radius)){unseen.delete(k);queue.push(k);}}}
  expect(unseen.size).toBe(0);
 });
 it('documents removed and added sealed regions against the preserved original contour',()=>{
  const current=createExpeditionGeometry(node),original={...current,voids:[layout.organPolygon.map(point)]};
  let removed=0,added=0;
  for(let y=110;y<=380;y+=2)for(let x=360;x<=840;x+=2){
   const p={x,y},oldFree=canOccupyExpedition(original,p,0),newFree=canOccupyExpedition(current,p,0);
   if(!oldFree&&newFree)removed++;if(oldFree&&!newFree)added++;
  }
  expect(removed).toBe(1068);expect(added).toBe(727);
 });
 it('places a low organ, three separate cut ends, severed hub, gantry and flush service paths',()=>{
  const root=model();const ms=meshes(root);
  expect(ms.filter(m=>m.name==='retained-rear-bulkhead')).toHaveLength(9);
  for(const name of ['organ-bed','root-west-cut','root-east-cut','root-south-cut','severed-distributor','sensory-recess','directional-gantry'])expect(ms.some(m=>m.name===name),name).toBe(true);
  const solids=ms.filter(m=>m.userData.swarmSolid);expect(solids.length).toBeGreaterThan(12);
  const bounds=new T.Box3();solids.forEach(m=>bounds.union(new T.Box3().setFromObject(m,true)));
  expect(bounds.min.x*32).toBeCloseTo(370,3);expect(bounds.max.x*32).toBeCloseTo(830,3);expect(bounds.min.z*32).toBeCloseTo(115,3);expect(bounds.max.z*32).toBeCloseTo(370,3);expect(bounds.min.y).toBeCloseTo(0);expect(bounds.max.y*32).toBeLessThanOrEqual(44.8);
  const runs=ms.filter(m=>m.userData.swarmService);expect(runs.length).toBe(6);for(const m of runs){const b=new T.Box3().setFromObject(m,true);expect(b.max.y*32).toBeLessThanOrEqual(.2);expect(b.min.y).toBeGreaterThanOrEqual(0);}
  for(const m of ms)expect((m.material as T.MeshStandardMaterial).emissiveIntensity).toBe(0);
  disposeModel(root);
 });
 it('matches solid model vertices and sampled top surface with actual occupancy, before and after production bake',()=>{
  const root=model(),g=createExpeditionGeometry(node);
  expect(meshes(root).some(m=>m.userData.swarmSolid)).toBe(true);
  // All raised solid vertices must lie on or inside the actual collision polygon.
  const polygon=template.voids![0];
  const inside=(x:number,y:number)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<.002)return true;if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
  for(const m of meshes(root).filter(m=>m.userData.swarmSolid)){const p=m.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);expect(inside(v.x*32,v.z*32),`${m.name} ${v.toArray()}`).toBe(true);}}
  const before=new T.Box3().setFromObject(root,true);const preCount=meshes(root).length;expect(preCount).toBeLessThan(100);expect(root.children.every(o=>o instanceof T.Mesh)).toBe(true);
  for(const phase of ['pre','post']){if(phase==='post')bake(root);root.updateMatrixWorld(true);const ray=new T.Raycaster();for(let y=105;y<=380;y+=10)for(let x=360;x<=840;x+=10){ray.set(new T.Vector3(x/32,4,y/32),new T.Vector3(0,-1,0));const raised=ray.intersectObject(root,true).some(h=>h.point.y*32>.5);expect(raised,`${phase} ${x}/${y}`).toBe(!canOccupyExpedition(g,{x,y},0));}}
  expect(meshes(root).length).toBeLessThanOrEqual(7);expect(meshes(root).length).toBeLessThan(preCount);const after=new T.Box3().setFromObject(root,true);expect(after.min.distanceTo(before.min)).toBeLessThan(1e-5);expect(after.max.distanceTo(before.max)).toBeLessThan(1e-5);disposeModel(root);
 });
 it('disposes every owned geometry and material once across repeated room visits without disposing shared materials',()=>{
  const shared=vi.spyOn(MAT.steel,'dispose');
  for(let visit=0;visit<3;visit++){const root=model(),ms=meshes(root),materials=[...new Set(ms.map(m=>m.material as T.Material))];expect(materials.every(m=>m.userData.actorMaterial)).toBe(true);
   const materialSpies=materials.map(m=>vi.spyOn(m,'dispose')),sourceSpies=ms.map(m=>vi.spyOn(m.geometry,'dispose'));bake(root);expect(sourceSpies.every(s=>s.mock.calls.length===1)).toBe(true);
   const baked=meshes(root).map(m=>vi.spyOn(m.geometry,'dispose'));disposeModel(root);for(const s of [...materialSpies,...baked])expect(s).toHaveBeenCalledTimes(1);
  }expect(shared).not.toHaveBeenCalled();shared.mockRestore();
 });
 it('covers the sealed shot silhouette at the renderer fallback height, before and after production bake',()=>{
  const root=model(),g=createExpeditionGeometry(node);
  for(const phase of ['pre','post']){
   if(phase==='post')bake(root);root.updateMatrixWorld(true);
   for(const y of [120,140,180,220,260,300,350,365,400]){
    const from={x:300,y},to={x:900,y};
    const ray=new T.Raycaster(new T.Vector3(from.x/32,.95,y/32),new T.Vector3(1,0,0),0,(to.x-from.x)/32);
    expect(ray.intersectObject(root,true).length>0,`${phase} fallback-height shot at ${y}`).toBe(!hasClearExpeditionShot(g,from,to));
   }
  }
  disposeModel(root);
 });
 it('has a physical gap at the gantry break with an attached lowered end',()=>{
  const root=model(),ray=new T.Raycaster(new T.Vector3(725/32,4,22/32),new T.Vector3(0,-1,0));
  expect(ray.intersectObject(root,true)).toHaveLength(0);
  const end=meshes(root).find(m=>m.name==='gantry-broken-end')!;
  const support=meshes(root).find(m=>m.name==='gantry-end-support')!;
  expect(end).toBeDefined();expect(support).toBeDefined();
  expect(new T.Box3().setFromObject(end).intersectsBox(new T.Box3().setFromObject(support))).toBe(true);
  disposeModel(root);
 });
 it('does not select Room16 models for the preceding room or a near-match ID',()=>{
  for(const id of ['infested-workshop','swarm-junction-other']){const root=new T.Group();environmentArchitecture(root,'infested',37.5,27.5,id);expect(meshes(root).some(m=>m.userData.swarmSolid)).toBe(false);disposeModel(root);}
 });
});
