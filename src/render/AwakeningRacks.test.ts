import {afterEach,it,expect} from 'vitest';
import * as T from 'three';
import {createAwakeningRacks,authoredRoom} from './AuthoredRooms';
import {AWAKENING_BLOCKOUT,AUTHORED_ROOM_TOPOLOGIES} from '../game/roguelike/authoredRoomTopologies';
import {disposeModel} from './meshParts';
const owned:T.Group[]=[];
afterEach(()=>{owned.forEach(disposeModel);owned.length=0;});
const make=()=>{const g=createAwakeningRacks();owned.push(g);g.updateMatrixWorld(true);return g;};
const hits=(g:T.Group,x:number,z:number)=>new T.Raycaster(new T.Vector3(x/32,5,z/32),new T.Vector3(0,-1,0)).intersectObject(g,true).map(h=>h.point.y*32);
it('keeps raised rack and supply vertices inside the unchanged solids and low silhouette',()=>{
 const g=make();let count=0;
 const footprints=AWAKENING_BLOCKOUT.filter(f=>f.id.startsWith('bank-')||f.id==='supply-wall');
 g.traverse(o=>{if(!(o instanceof T.Mesh)||o.material instanceof T.MeshBasicMaterial)return;
 const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){
 const x=p.getX(i)*32,h=p.getY(i)*32,z=p.getZ(i)*32;if(h<=.601)continue;count++;
 const owner=footprints.find(f=>x>=f.footprint[0].x-.001&&x<=f.footprint[2].x+.001&&z>=f.footprint[0].y-.001&&z<=f.footprint[2].y+.001);
 expect(owner).toBeDefined();expect(h).toBeLessThanOrEqual(owner?.id==='supply-wall'?42:34);
 }});expect(count).toBeGreaterThan(1000);
});
it('supports all eight closed shells on saddles, beams and deck plates',()=>{
 const g=make();for(const z of [295,585])for(const x of [490,590,690,790]){
 expect(hits(g,x,z)[0]).toBeGreaterThan(28);
 for(const dz of [-28,28]){const ys=hits(g,x,z+dz);for(const level of [4,10,16])expect(ys.some(y=>Math.abs(y-level)<.05)).toBe(true);}
 }
});
it('connects every pod supply and return to a wall terminal with real emitted pipe segments',()=>{
 const g=make();const routes=g.userData.serviceRoutes as {points:number[][]}[];expect(routes).toHaveLength(16);
 for(const {points} of routes){expect(points[0][2]).toBe(115);expect(points[0][1]).toBe(18);
 for(let i=1;i<points.length;i++){
 const a=new T.Vector3(...points[i-1]).divideScalar(32),b=new T.Vector3(...points[i]).divideScalar(32),mid=a.clone().lerp(b,.5);
 const direction=new T.Vector3(1,0,0);if(Math.abs(b.x-a.x)>.001)direction.set(0,0,1);
 const ray=new T.Raycaster(mid.clone().addScaledVector(direction,.3),direction.negate(),0,.6);
 expect(ray.intersectObject(g,true).length).toBeGreaterThan(0);
 }
 expect(points.at(-1)![1]).toBe(20);
 }
 // Cross-aisles retain flush closed deck covers, never exposed hoses or pits.
 for(const z of [190,440])expect(hits(g,818,z)[0]).toBeLessThanOrEqual(.6);
});
it('uses the same rack assembly and service routes in the actual shared room lifecycle',()=>{
 const standalone=make(),g=authoredRoom('awakening-bay',{width:1200,height:880,...AUTHORED_ROOM_TOPOLOGIES['awakening-bay']!})!;owned.push(g);g.updateMatrixWorld(true);
 expect(g.userData.serviceRoutes).toEqual(standalone.userData.serviceRoutes);
 for(const [x,z] of [[490,295],[790,585],[818,190],[650,115]])expect(hits(g,x,z)[0]).toBeCloseTo(hits(standalone,x,z)[0],3);
});
