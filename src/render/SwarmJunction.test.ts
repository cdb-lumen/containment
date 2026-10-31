import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
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
 it('closes every crowned plate and cavity lip with opposite directed edges and outward faces',()=>{
  const root=model(),plates=meshes(root).filter(m=>m.name.includes('-plate-'));expect(plates).toHaveLength(9);
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
 it('replaces belt bands with unequal overlapping curved shells and a broad sunken cavity',()=>{
  const root=model(),ms=meshes(root);
  expect(ms.filter(m=>/^root-.*-rib-/.test(m.name))).toHaveLength(0);
  expect((ms.find(m=>m.name==='organ-bed')!.material as T.Material).name).toBe('swarm-charcoal');
  const counts=['west','east','south'].map(side=>ms.filter(m=>m.name.startsWith(`root-${side}-plate-`)).length);
  expect(counts).toEqual([3,2,1]);
  const west=ms.filter(m=>m.name.startsWith('root-west-plate-'));
  for(let i=1;i<west.length;i++)expect(new T.Box3().setFromObject(west[i-1]).intersectsBox(new T.Box3().setFromObject(west[i]))).toBe(true);
  // The outer edge must bow in plan, not merely crown a rectangular belt tile.
  const p=west[0].geometry.getAttribute('position'),n=Math.sqrt(p.count/2)-1;
  const a=new T.Vector3().fromBufferAttribute(p,0),b=new T.Vector3().fromBufferAttribute(p,n*(n+1));
  const midpoint=new T.Vector3().fromBufferAttribute(p,Math.floor(n/2)*(n+1));
  const edge=b.clone().sub(a);edge.y=0;const delta=midpoint.sub(a);delta.y=0;
  expect(edge.clone().cross(delta).length()/edge.length()).toBeGreaterThan(.05);
  const cavity=ms.find(m=>m.name==='sensory-recess')!,lip=ms.find(m=>m.name==='sensory-carapace-lip')!;
  const cb=new T.Box3().setFromObject(cavity),lb=new T.Box3().setFromObject(lip);
  expect(cb.getSize(new T.Vector3()).x*32).toBeGreaterThan(55);
  expect(lb.max.y*32-cb.max.y*32).toBeGreaterThan(7);
  const ray=new T.Raycaster(new T.Vector3(600/32,4,260/32),new T.Vector3(0,-1,0));
  expect(ray.intersectObject(root,true)[0].object.name).toBe('sensory-recess');
  expect(ms.some(m=>m.name==='severed-distributor')).toBe(true);
  disposeModel(root);
 });
 it('uses crowned organic plates, differentiated materials and recessed wall bays',()=>{
  const root=model(),ms=meshes(root);
  const plate=ms.find(m=>m.name==='root-west-plate-1')!;
  const ys=new Set(Array.from(plate.geometry.getAttribute('position').array).filter((_,i)=>i%3===1).map(v=>v.toFixed(4)));
  expect(ys.size).toBeGreaterThan(4);
  const material=(name:string)=>ms.map(m=>m.material as T.MeshStandardMaterial).find(m=>m.name===name)!;
  expect(material('swarm-charcoal').roughness).toBeLessThan(material('swarm-bone-grey').roughness);
  expect(material('swarm-human-metal').metalness).toBeGreaterThan(.65);
  expect(ms.filter(m=>m.name==='bulkhead-inset')).toHaveLength(9);
  expect(ms.some(m=>m.name==='hub-split-conduit')).toBe(true);
  disposeModel(root);
 });
 it('uses exactly the stage1 sealed three-root footprint and unchanged anchors',()=>{
  expect(template.voids).toEqual([layout.organPolygon.map(point)]);expect(template.obstacles).toEqual([]);
  expect([template.width,template.height,template.spawn,template.exit,template.breaches]).toEqual([1200,880,{x:100,y:440},{x:1100,y:440},[{x:100,y:100},{x:1100,y:100},{x:100,y:780},{x:1100,y:780}]]);
  for(const o of [template,template.voids,template.voids?.[0],...(template.voids?.[0]??[])])expect(Object.isFrozen(o)).toBe(true);
 });
 // Reference: merged main d1d24d3; Room16 is the sole template delta.
 it('leaves every other room template byte-equivalent',()=>{
  const others=Object.fromEntries(Object.entries(ROOM_TEMPLATES).filter(([id])=>id!=='swarm-junction'));
  expect(createHash('sha256').update(JSON.stringify(others)).digest('hex')).toBe('43c93ce70d615d8aa3b139185b8f420be223850976e0b8fdce0157e5dac79e42');
 });
 for(const radius of [16,28])it(`retains all planned routes, breaches and connected usable space for radius ${radius}`,()=>{
  const g=createExpeditionGeometry(node);
  const routes=[...Object.values(layout.routes) as number[][][],...g.breaches.map(b=>[[b.x,b.y],[b.x+(b.facing==='east'?56:-56),b.y]]),[[600,440],[600,480],[600,650],[600,740]]];
  for(const route of routes)for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,point(route[i-1]),point(route[i]),radius),JSON.stringify(route)).toBe(true);
  for(const p of [...Object.values(layout.activities) as number[][],...Object.values(layout.arms) as number[][]])expect(canOccupyExpedition(g,point(p),radius)).toBe(true);
  const nodes=new Map<string,{x:number;y:number}>();for(let y=40;y<880;y+=20)for(let x=40;x<1200;x+=20)if(canTraverseExpedition(g,{x,y},{x,y},radius))nodes.set(`${x},${y}`,{x,y});
  const first=nodes.keys().next().value!;const unseen=new Set(nodes.keys());unseen.delete(first);const queue=[first];
  for(let i=0;i<queue.length;i++){const p=nodes.get(queue[i])!;for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const k=`${p.x+dx},${p.y+dy}`;if(unseen.has(k)&&canTraverseExpedition(g,p,nodes.get(k)!,radius)){unseen.delete(k);queue.push(k);}}}
  expect(unseen.size).toBe(0);
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
  const polygon=layout.organPolygon.map(point);
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
