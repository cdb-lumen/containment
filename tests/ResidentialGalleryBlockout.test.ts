import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {appendEnvironment,environmentArchitecture,environmentObstacle} from '../src/render/ShipEnvironments';
import {MAT,disposeModel} from '../src/render/meshParts';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';

const reservations=STORY_ROOM_TEMPLATES['residential-gallery'].obstacles.map(r=>({x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32}));
function bake(world:T.Group){
 const renderer=Object.create(DepthRenderer.prototype) as {world:T.Group;floorMaterial:T.Material;bakeWorld():void};
 renderer.world=world;renderer.floorMaterial=new T.MeshStandardMaterial();renderer.bakeWorld();renderer.floorMaterial.dispose();world.updateMatrixWorld(true);return world;
}
function obstacle(index:number,id='residential-gallery'){
 const world=new T.Group();appendEnvironment(world,environmentObstacle('habitation',reservations[index],index,id));return bake(world);
}
function heightAt(world:T.Group,x:number,z:number){
 return new T.Raycaster(new T.Vector3(x,5,z),new T.Vector3(0,-1,0)).intersectObject(world,true)[0]?.point.y??0;
}
function signature(world:T.Group){
 world.updateMatrixWorld(true);const values:number[]=[];world.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);values.push(v.x,v.y,v.z);}values.push((o.material as T.MeshStandardMaterial).color.getHex());}});return values;
}
describe('Residential Gallery neutral whole-room blockout',()=>{
 for(const [index,f] of reservations.entries())it(`reservation ${index} has low, contained, genuinely occupied batched geometry`,()=>{
  const world=obstacle(index);
  try{
   const b=new T.Box3().setFromObject(world,true);
   expect(b.min.x).toBeGreaterThanOrEqual(f.x-1e-5);expect(b.max.x).toBeLessThanOrEqual(f.x+f.width+1e-5);
   expect(b.min.z).toBeGreaterThanOrEqual(f.y-1e-5);expect(b.max.z).toBeLessThanOrEqual(f.y+f.height+1e-5);
   expect(b.min.y).toBeCloseTo(0,5);
   let occupied=0,substantial=0;
   // Raycast the real material-batched triangles, not declared bounds or prop labels.
   for(let x=0;x<20;x++)for(let z=0;z<20;z++){
    const height=heightAt(world,f.x+(x+.5)*f.width/20,f.y+(z+.5)*f.height/20);
    if(height>=.28)occupied++;if(height>=.55)substantial++;
   }
   expect(occupied/400).toBeGreaterThanOrEqual(.95);expect(substantial/400).toBeGreaterThanOrEqual(.65);
   expect(b.max.y).toBeLessThanOrEqual(1.45);
   expect(world.children.length).toBeLessThanOrEqual(4);
   world.traverse(o=>{if(o instanceof T.Mesh)expect([MAT.armor,MAT.steel,MAT.rubber,MAT.edge]).toContain(o.material);});
  }finally{disposeModel(world);}
 });
 it('keeps the bunk open above its mattress and lower than its surrounding storage',()=>{
  const world=obstacle(1),f=reservations[1];
  try{
   const mattress=heightAt(world,f.x+f.width*.35,f.y+f.height*.2);
   expect(mattress).toBeGreaterThan(.55);expect(mattress).toBeLessThan(.9);
   expect(heightAt(world,f.x+f.width*.35,f.y+f.height*.8)).toBeGreaterThan(mattress+.15);
  }finally{disposeModel(world);}
 });
 it('only replaces room3 props, leaving default and Communal Atrium identical',()=>{
  const gallery=obstacle(0),atrium=obstacle(0,'communal-atrium'),legacy=obstacle(0,'');
  try{expect(signature(atrium)).toEqual(signature(legacy));expect(signature(gallery)).not.toEqual(signature(atrium));}
  finally{[gallery,atrium,legacy].forEach(disposeModel);}
 });
 it('subordinates only room3 cross-inlay and rear door panels',()=>{
  const architecture=(id:string)=>{const world=new T.Group();environmentArchitecture(world,'habitation',37.5,27.5,id);return bake(world);};
  const gallery=architecture('residential-gallery'),atrium=architecture('communal-atrium'),legacy=architecture('');
  try{
   expect(signature(atrium)).toEqual(signature(legacy));expect(signature(gallery)).not.toEqual(signature(atrium));
   expect(gallery.children.some(o=>o instanceof T.Mesh&&o.material===MAT.orange)).toBe(false);
  }finally{[gallery,atrium,legacy].forEach(disposeModel);}
 });
});
