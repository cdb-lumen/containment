import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import proposedContour from '../../tests/fixtures/swarm-organ-lobed-contour.json';
import previousContour from '../../tests/fixtures/swarm-organ-proposed-contour.json';
import {createHash} from 'node:crypto';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../game/world/expeditionGeometry';
import {environmentArchitecture} from './ShipEnvironments';
import {DepthRenderer} from './DepthRenderer';
import {FacilityNavigation} from '../game/world/FacilityNavigation';
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
  const layered=meshes(root).filter(m=>m.name.startsWith('carapace-scute-')||m.name.startsWith('carapace-overlap-')||/^root-.*-(cut|sheath|tissue)$/.test(m.name)||m.name==='distributor-engulfing-fold'||m.name==='consuming-distributor-side-wrap');
  expect(layered).toHaveLength(19); // Eight scutes, nine cut/sheath/tissue sections and two cabinet folds.
  expect(meshes(root).some(m=>m.name.startsWith('carapace-overlap-'))).toBe(false);
  const badEdges=(indices:number[])=>{
   const edges=new Map<string,number[]>();
   for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
    const a=indices[i+j],b=indices[i+(j+1)%3],key=`${Math.min(a,b)},${Math.max(a,b)}`;
    const e=edges.get(key)??[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);
   }
   return [...edges.values()].filter(([count,direction])=>count!==2||direction!==0).length;
  };
  for(const plate of [...plates,...layered,lip]){
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
     if(band===2){const center=v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1/3);expect(cross.dot(new T.Vector3(600/32-center.x,0,285/32-center.z)),'lip inner wall').toBeGreaterThan(0);}
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
 it('supports charcoal scutes on a connected tendon bed around an open sensory cavity',()=>{
  const root=model(),ms=meshes(root);
  expect(ms.filter(m=>m.name.includes('-plate-'))).toHaveLength(0);
  expect((ms.find(m=>m.name==='organ-bed')!.material as T.Material).name).toBe('swarm-tendon');
  const scutes=ms.filter(m=>m.name.startsWith('carapace-scute-'));expect(scutes).toHaveLength(8);for(const scute of scutes)expect((scute.material as T.Material).name).toBe('swarm-charcoal');
  expect(template.voids![0]).toHaveLength(150);
  const cavity=ms.find(m=>m.name==='sensory-recess')!,lip=ms.find(m=>m.name==='sensory-carapace-lip')!;
  const cb=new T.Box3().setFromObject(cavity),lb=new T.Box3().setFromObject(lip);
  expect(cb.getSize(new T.Vector3()).x*32).toBeGreaterThan(55);
  expect(lb.max.y*32-cb.max.y*32).toBeGreaterThan(7);
  const ray=new T.Raycaster(new T.Vector3(600/32,4,285/32),new T.Vector3(0,-1,0));
  expect(ray.intersectObject(root,true)[0].object.name).toBe('sensory-recess');
  expect(ms.some(m=>m.name==='severed-distributor')).toBe(true);
  disposeModel(root);
 });
 it('builds overlapping supported scutes above connected tissue rather than isolated inserts',()=>{
  const root=model(),ray=new T.Raycaster(),bed=root.getObjectByName('organ-bed')!;
  for(const [x,y,a,b] of [[440,198,'west-middle','west-outer'],[500,235,'west-middle','west-inner'],[765,190,'east-outer','east-middle'],[708,230,'east-middle','east-inner'],[604,350,'south-lower','south-upper']] as const){
   ray.set(new T.Vector3(x/32,4,y/32),new T.Vector3(0,-1,0));
   const one=root.getObjectByName(`carapace-scute-${a}`)!,two=root.getObjectByName(`carapace-scute-${b}`)!;
   const hits=[ray.intersectObject(one)[0],ray.intersectObject(two)[0]];expect(hits.every(Boolean)).toBe(true);
   const base=ray.intersectObject(bed)[0];expect(base).toBeDefined();expect(base.point.y*32).toBeGreaterThanOrEqual(31-1e-5);
   for(const piece of [one,two])expect(new T.Box3().setFromObject(piece).min.y*32).toBeCloseTo(31,4);
  }
  ray.set(new T.Vector3(600/32,4,220/32),new T.Vector3(0,-1,0));expect(ray.intersectObject(root,true)[0]?.object).toBe(bed);
  const direction=new T.Vector3(0,26,19).normalize();
  for(const [x,y,name] of [[406,180,'west-outer'],[462,220,'west-middle'],[502,256,'west-inner'],[794,164,'east-outer'],[758,204,'east-middle'],[642,264,'east-inner'],[554,336,'south-upper'],[582,360,'south-lower']] as const){
   const target=new T.Vector3(x/32,40/32,y/32);ray.set(target.clone().addScaledVector(direction,10),direction.clone().negate());expect(ray.intersectObject(root,true)[0]?.object.name).toBe(`carapace-scute-${name}`);
  }
  for(const x of [588,600,612]){const target=new T.Vector3(x/32,31.5/32,285/32);ray.set(target.clone().addScaledVector(direction,10),direction.clone().negate());expect(ray.intersectObject(root,true)[0]?.object.name).toBe('sensory-recess');}
  disposeModel(root);
 });
 it('exposes internal cut tissue and a connected cabinet side-to-roof fold without hiding its ports',()=>{
  const root=model(),ray=new T.Raycaster(),direction=new T.Vector3(0,26,19).normalize();
  for(const [x,y,name] of [[802,152,'root-east-tissue'],[602,380,'root-south-tissue'],[658,252,'consuming-distributor-side-wrap']] as const){const target=new T.Vector3(x/32,40/32,y/32);ray.set(target.clone().addScaledVector(direction,10),direction.clone().negate());expect(ray.intersectObject(root,true)[0]?.object.name).toBe(name);}
  ray.set(new T.Vector3(666.5/32,4,245/32),new T.Vector3(0,-1,0));const hits=ray.intersectObject(root,true);expect(hits[0]?.object.name).toBe('consuming-distributor-side-wrap');expect(hits.some(h=>h.object.name==='distributor-roof-service-panel')).toBe(true);
  for(const x of [668.5,679.5,690.5]){const target=new T.Vector3(x/32,35.5/32,265/32);ray.set(target.clone().addScaledVector(direction,10),direction.clone().negate());expect(ray.intersectObject(root,true)[0]?.object.name).toBe('distributor-terminal-core');}
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
  for(const [x,z,name] of [[661,250,'severed-distributor'],[666,220,'torn-distributor-lid']] as const){
   const target=new T.Vector3(x/32,43.5/32,z/32),direction=new T.Vector3(0,26,19).normalize();
   const ray=new T.Raycaster(target.clone().addScaledVector(direction,10),direction.clone().negate());
   expect(ray.intersectObject(root,true)[0]?.object.name).toBe(name);
  }
  disposeModel(root);
 });
 it('exposes the three severed terminal tops and the cabinet connector face to the shipping camera',()=>{
  const root=model(),direction=new T.Vector3(0,26,19).normalize();
  for(const name of ['root-west-cut','root-east-cut','root-south-cut','distributor-front-panel']){
   const part=root.getObjectByName(name)!,bounds=new T.Box3().setFromObject(part),center=bounds.getCenter(new T.Vector3());
   const ray=new T.Raycaster(center.clone().addScaledVector(direction,10),direction.clone().negate());
   if(name==='distributor-front-panel'){
    // The middle port belongs on the panel center. It may cover the panel,
    // but neither the organ nor its sensory lip may hide that hardware.
    expect(['distributor-front-panel','distributor-terminal-socket','distributor-terminal-core']).toContain(ray.intersectObject(root,true)[0]?.object.name);
    center.x=bounds.min.x+10/32; // Exposed face between the first two ports.
    ray.set(center.clone().addScaledVector(direction,10),direction.clone().negate());
   }
   expect(ray.intersectObject(root,true)[0]?.object.name,name).toBe(name);
   if(name!=='distributor-front-panel'){
    ray.set(new T.Vector3(center.x,5,center.z),new T.Vector3(0,-1,0));
    expect(ray.intersectObject(root,true)[0]?.object.name,name+' top').toBe(name);
   }
  }
  disposeModel(root);
 });
 it('attaches the thick terminal sections and leaves the roof service panel readable beside the engulfing fold',()=>{
  const root=model(),bed=root.getObjectByName('organ-bed')!,box=(name:string)=>new T.Box3().setFromObject(root.getObjectByName(name)!);
  const ray=new T.Raycaster(),direction=new T.Vector3(0,26,19).normalize();
  for(const end of ['west','east','south']){
   const cut=box(`root-${end}-cut`),sheath=box(`root-${end}-sheath`),center=cut.getCenter(new T.Vector3());
   expect(cut.min.y*32).toBeCloseTo(30,4);expect(cut.max.y-cut.min.y).toBeGreaterThan(6/32);
   expect(sheath.containsPoint(new T.Vector3(center.x,sheath.min.y,center.z))).toBe(true);
   ray.set(new T.Vector3(center.x,5,center.z),new T.Vector3(0,-1,0));
   const attachedTop=ray.intersectObject(bed)[0].point.y;
   expect(attachedTop).toBeGreaterThan(cut.min.y);expect(attachedTop).toBeLessThan(cut.max.y);
  }
  const panel=box('distributor-roof-service-panel'),housing=box('severed-distributor'),fold=box('distributor-engulfing-fold');
  expect(panel.getSize(new T.Vector3()).x*panel.getSize(new T.Vector3()).z*32*32).toBeGreaterThan(500);
  expect(Math.abs(panel.min.y-housing.max.y)).toBeLessThan(1e-6);
  expect(housing.intersectsBox(fold)).toBe(true);expect(fold.max.y).toBeGreaterThan(housing.max.y);
  for(const name of ['distributor-roof-bus'])for(const mesh of meshes(root).filter(m=>m.name===name))expect(panel.intersectsBox(new T.Box3().setFromObject(mesh))).toBe(true);
  const target=new T.Vector3(675/32,42.9/32,237/32);ray.set(target.clone().addScaledVector(direction,10),direction.clone().negate());
  expect(ray.intersectObject(root,true)[0]?.object.name).toBe('distributor-roof-service-panel');
  ray.set(new T.Vector3(700/32,5,234/32),new T.Vector3(0,-1,0));
  expect(ray.intersectObject(root,true)[0]?.object.name).toBe('distributor-engulfing-fold');
  disposeModel(root);
 });
 it('opens the terminal borders and crosses the cabinet roof while retaining exposed hardware',()=>{
  const root=model(),ray=new T.Raycaster();
  // Preserve named tissue/hardware exposure while the south cut and cabinet move
  // with the explicit major-form proposal. These are not generic any-mesh rays.
  for(const [x,z,name] of [[397,146,'root-west-cut'],[800,143,'root-east-cut'],[616,388,'root-south-cut'],[679,228,'distributor-engulfing-fold'],[700,234,'distributor-engulfing-fold'],[675,237,'distributor-roof-service-panel']] as const){
   ray.set(new T.Vector3(x/32,5,z/32),new T.Vector3(0,-1,0));
   const hits=ray.intersectObject(root,true);
   expect(hits[0]?.object.name,`${x},${z}`).toBe(name);
   if(name==='distributor-engulfing-fold'){
    const support=hits.find(h=>h.object.name==='severed-distributor');
    expect(support).toBeDefined();expect(hits[0].point.y).toBeGreaterThan(support!.point.y);
    expect(hits[0].point.y-support!.point.y).toBeLessThan(2.3/32);
   }
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
 it('uses the explicit revised lobed contour while preserving the historical baseline and all anchors',()=>{
  expect(template.voids).toEqual([proposedContour]);expect(layout.organPolygon).toHaveLength(18);expect(template.voids).not.toEqual([layout.organPolygon.map(point)]);expect(template.obstacles).toEqual([]);
  expect([template.width,template.height,template.spawn,template.exit,template.breaches]).toEqual([1200,880,{x:100,y:440},{x:1100,y:440},[{x:100,y:100},{x:1100,y:100},{x:100,y:780},{x:1100,y:780}]]);
  for(const o of [template,template.voids,template.voids?.[0],...(template.voids?.[0]??[])])expect(Object.isFrozen(o)).toBe(true);
 });
 // Reference: merged main76b4a23 (verified identical to captured Armory ed13a96).
 // Room16 is the sole template delta; the current Armory is intentionally retained.
 it('leaves every other room template byte-equivalent',()=>{
  const others=Object.fromEntries(Object.entries(ROOM_TEMPLATES).filter(([id])=>id!=='swarm-junction'));
  expect(createHash('sha256').update(JSON.stringify(others)).digest('hex')).toBe('341bcc775e848414f93dc7d3e1d86d4f45c096e55bf435aa4ac548fab1262053');
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
 for(const radius of [16,28,38])it(`navigates the enlarged west/east scallops and south root at radius ${radius}`,()=>{
  const g=createExpeditionGeometry(node);
  for(const [start,goal] of [[{x:460,y:340},{x:450,y:100}],[{x:780,y:300},{x:740,y:80}],[{x:510,y:440},{x:710,y:440}]] as const){
   const nav=new FacilityNavigation(g),p={...start,radius};
   expect(canOccupyExpedition(g,p,radius)).toBe(true);expect(canOccupyExpedition(g,goal,radius)).toBe(true);
   for(let i=0;i<900&&Math.hypot(p.x-goal.x,p.y-goal.y)>4;i++){
    const q=nav.waypoint(p,goal,1)??goal,d=Math.hypot(q.x-p.x,q.y-p.y),step=Math.min(8,d);
    if(d<1e-8)break;
    const next={x:p.x+(q.x-p.x)*step/d,y:p.y+(q.y-p.y)*step/d};
    expect(canTraverseExpedition(g,p,next,radius),`${JSON.stringify(start)} toward ${JSON.stringify(goal)}`).toBe(true);
    Object.assign(p,next);
   }
   expect(Math.hypot(p.x-goal.x,p.y-goal.y),`${JSON.stringify(start)} toward ${JSON.stringify(goal)}`).toBeLessThanOrEqual(4);
  }
 });
 it('preserves historical topology deltas and declares the full major-form footprint change',()=>{
  const current=createExpeditionGeometry(node),original=layout.organPolygon.map(point);
  const compare=(a:readonly {x:number;y:number}[],b:readonly {x:number;y:number}[])=>{
   let removed=0,added=0;
   for(let y=110;y<=405;y+=2)for(let x=340;x<=860;x+=2){
    const p={x,y},oldFree=canOccupyExpedition({...current,voids:[a]},p,0),newFree=canOccupyExpedition({...current,voids:[b]},p,0);
    if(!oldFree&&newFree)removed++;if(oldFree&&!newFree)added++;
   }
   return {removed,added};
  };
  // Original 18-point proposal and rejected 132-point silhouette remain immutable.
  expect(compare(original,previousContour)).toEqual({removed:1068,added:727});
  expect(compare(original,current.voids![0])).toEqual({removed:917,added:7377});
  expect(compare(previousContour,current.voids![0])).toEqual({removed:469,added:7270});
 });
 it('places a low organ, three separate cut ends, severed hub, gantry and flush service paths',()=>{
  const root=model();const ms=meshes(root);
  expect(ms.filter(m=>m.name==='retained-rear-bulkhead')).toHaveLength(9);
  for(const name of ['organ-bed','root-west-cut','root-east-cut','root-south-cut','severed-distributor','sensory-recess','directional-gantry'])expect(ms.some(m=>m.name===name),name).toBe(true);
  const solids=ms.filter(m=>m.userData.swarmSolid);expect(solids.length).toBeGreaterThan(12);
  const bounds=new T.Box3();solids.forEach(m=>bounds.union(new T.Box3().setFromObject(m,true)));
  expect(bounds.min.x*32).toBeCloseTo(350,3);expect(bounds.max.x*32).toBeCloseTo(850,3);expect(bounds.min.z*32).toBeCloseTo(115,3);expect(bounds.max.z*32).toBeCloseTo(395,3);expect(bounds.min.y).toBeCloseTo(0);expect(bounds.max.y*32).toBeLessThanOrEqual(44.8);
  const runs=ms.filter(m=>m.userData.swarmService);expect(runs.length).toBe(6);for(const m of runs){const b=new T.Box3().setFromObject(m,true);expect(b.max.y*32).toBeLessThanOrEqual(.2);expect(b.min.y).toBeGreaterThanOrEqual(0);}
  for(const m of ms)expect((m.material as T.MeshStandardMaterial).emissiveIntensity).toBe(0);
  disposeModel(root);
 });
 it('matches added and freed local pockets to movement, short shots and rendered mass',()=>{
  const root=model(),after=createExpeditionGeometry(node),before={...after,voids:[previousContour]};
  const ray=new T.Raycaster();
  for(const [x,y,added] of [[352,157,true],[450,157,false]] as const){
   const p={x,y},a={x:x-1,y},b={x:x+1,y};
   expect(canOccupyExpedition(before,p,16)).toBe(added);
   expect(canOccupyExpedition(after,p,16)).toBe(!added);
   expect(canTraverseExpedition(before,a,b,16)).toBe(added);
   expect(canTraverseExpedition(after,a,b,16)).toBe(!added);
   expect(hasClearExpeditionShot(before,a,b)).toBe(added);
   expect(hasClearExpeditionShot(after,a,b)).toBe(!added);
   ray.set(new T.Vector3(x/32,4,y/32),new T.Vector3(0,-1,0));
   expect(ray.intersectObject(root,true).some(h=>h.point.y*32>.5)).toBe(added);
  }
  disposeModel(root);
 });
 it('keeps every solid vertex in collision and preserves bounds through production bake',()=>{
  const root=model();
  expect(meshes(root).some(m=>m.userData.swarmSolid)).toBe(true);
  // All raised solid vertices must lie on or inside the actual collision polygon.
  const polygon=template.voids![0];
  const inside=(x:number,y:number)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<.002)return true;if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
  for(const m of meshes(root).filter(m=>m.userData.swarmSolid)){const p=m.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);expect(inside(v.x*32,v.z*32),`${m.name} ${v.toArray()}`).toBe(true);}}
  // Vertices alone miss triangles crossing a concave notch. Sample every
  // projected edge midpoint and face centroid, including non-indexed solids.
  const outside:string[]=[];
  for(const m of meshes(root).filter(m=>m.userData.swarmSolid)){
   const p=m.geometry.getAttribute('position'),index=m.geometry.index;
   const ids=index?Array.from(index.array):Array.from({length:p.count},(_,i)=>i);
   for(let i=0;i<ids.length;i+=3){
    const v=ids.slice(i,i+3).map(j=>new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(m.matrixWorld));
    const samples=[v[0].clone().add(v[1]).multiplyScalar(.5),v[1].clone().add(v[2]).multiplyScalar(.5),v[2].clone().add(v[0]).multiplyScalar(.5),v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1/3)];
    for(const q of samples)if(!inside(q.x*32,q.z*32))outside.push(`${m.name} triangle${i/3} ${q.x*32}/${q.z*32}`);
   }
  }
  expect(outside).toEqual([]);
  const before=new T.Box3().setFromObject(root,true);const preCount=meshes(root).length;expect(preCount).toBeLessThan(100);expect(root.children.every(o=>o instanceof T.Mesh)).toBe(true);
  bake(root);
  expect(meshes(root).length).toBeLessThanOrEqual(7);expect(meshes(root).length).toBeLessThan(preCount);const after=new T.Box3().setFromObject(root,true);expect(after.min.distanceTo(before.min)).toBeLessThan(1e-5);expect(after.max.distanceTo(before.max)).toBeLessThan(1e-5);disposeModel(root);
 });
 // The denser conforming shell retains the complete 10-unit grid in each
 // representation. Separate cases keep each CPU ray workload under the runner's
 // ordinary per-test budget without loosening any geometry assertion or timeout.
 it.each(['pre','post'].flatMap(phase=>[[phase,105,195],[phase,205,295],[phase,305,405]] as const))('matches every sampled top-surface ray to actual occupancy (%s bake, rows %i–%i)',(phase,startY,endY)=>{
  const root=model(),g=createExpeditionGeometry(node);if(phase==='post')bake(root);root.updateMatrixWorld(true);
  const ray=new T.Raycaster();
  for(let y=startY;y<=endY;y+=10)for(let x=340;x<=860;x+=10){
   ray.set(new T.Vector3(x/32,4,y/32),new T.Vector3(0,-1,0));
   const raised=ray.intersectObject(root,true).some(h=>h.point.y*32>.5);
   expect(raised,`${phase} ${x}/${y}`).toBe(!canOccupyExpedition(g,{x,y},0));
  }
  disposeModel(root);
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
