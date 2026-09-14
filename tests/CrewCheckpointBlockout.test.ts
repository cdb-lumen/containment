import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment} from '../src/render/ShipEnvironments';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {MAT,geometries} from '../src/render/meshParts';

const room=STORY_ROOM_TEMPLATES['crew-checkpoint'];
const footprints=room.obstacles.map(f=>({x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32}));
const model=(index:number)=>environmentObstacle('security',footprints[index],index,'crew-checkpoint');
const named=(root:T.Object3D,name:string)=>{const result:T.Object3D[]=[];root.traverse(o=>{if(o.name===name)result.push(o);});return result;};
describe('Room5 checkpoint rough',()=>{
 it('joins the cover and counter around a central bay without changing the arrival/exit envelope',()=>{
  expect([room.width,room.height,room.spawn,room.exit]).toEqual([1200,880,{x:100,y:440},{x:1100,y:440}]);
  expect(room.obstacles).toEqual([{x:450,y:260,width:80,height:320},{x:690,y:260,width:80,height:320},{x:530,y:260,width:160,height:80}]);
  const [west,east,desk]=room.obstacles;
  expect(west.x+west.width).toBe(desk.x);
  expect(desk.x+desk.width).toBe(east.x);
  expect(east.x-west.x-west.width).toBe(160);
 });
 it.each([0,1])('builds low longitudinal cover with grounded diagonal braces at reservation %s',index=>{
  const root=model(index),plates=named(root,'ballistic-panel'),braces=named(root,'rear-brace');
  expect(plates).toHaveLength(4);expect(braces).toHaveLength(8);
  for(const [n,panel] of plates.entries()){const b=new T.Box3().setFromObject(panel,true);expect(b.max.z-b.min.z).toBeGreaterThan(2);expect(b.max.x-b.min.x).toBeCloseTo(index===0&&n===1?.48:.24,5);expect(b.max.y).toBeLessThanOrEqual(1.3);}
  for(const brace of braces){const b=new T.Box3().setFromObject(brace,true);expect(b.min.y).toBeLessThan(.3);expect(b.max.y).toBeGreaterThan(.9);expect(b.max.x-b.min.x).toBeGreaterThan(1);}
 });
 it('gives the representative west shield thick armor and a connected frame on exposed grounded skids',()=>{
  const root=model(0),panel=new T.Box3().setFromObject(named(root,'ballistic-panel')[1],true);
  expect(panel.max.x-panel.min.x).toBeCloseTo(.48,5);
  const skids=named(root,'representative-skid'),posts=named(root,'representative-frame-post');
  expect(skids).toHaveLength(2);expect(posts).toHaveLength(2);
  for(let i=0;i<2;i++){
   const foot=new T.Box3().setFromObject(skids[i],true),post=new T.Box3().setFromObject(posts[i],true);
   expect(foot.min.y).toBeCloseTo(0,5);expect(foot.max.y).toBeLessThan(panel.min.y);
   expect(foot.intersectsBox(post)).toBe(true);expect(post.intersectsBox(panel)).toBe(true);
   expect(foot.max.x-foot.min.x).toBeGreaterThan(2);
  }
  const sill=new T.Box3().setFromObject(named(root,'representative-frame-sill')[0],true);
  expect(sill.intersectsBox(panel)).toBe(true);
  for(const post of posts)expect(sill.intersectsBox(new T.Box3().setFromObject(post,true))).toBe(true);
  const toes=named(root,'representative-rear-shoe');expect(toes).toHaveLength(2);
  for(let i=0;i<2;i++){
   const toe=new T.Box3().setFromObject(toes[i],true),foot=new T.Box3().setFromObject(skids[i],true);
   expect(toe.min.y).toBeCloseTo(0,5);expect(toe.intersectsBox(foot)).toBe(true);
   expect(toe.max.y-foot.max.y).toBeGreaterThan(.1);
   expect(toe.max.z-toe.min.z).toBeGreaterThan(.5);
  }
  expect(named(model(1),'representative-skid')).toHaveLength(0);
 });
 it('replaces the northern repeat with one guard counter, tucked seat and mounted terminal',()=>{
  const root=model(2);
  for(const name of ['guard-counter','guard-seat','guard-terminal','weapon-cradle-bed'])expect(named(root,name)).toHaveLength(1);
  expect(named(root,'ballistic-panel')).toHaveLength(0);
  expect(new T.Box3().setFromObject(root,true).max.y).toBeLessThanOrEqual(1.65);
 });
 it('secures an exposed stock, receiver and barrel to a supported cradle instead of a closed case',()=>{
  const root=model(2),bounds=(name:string)=>{
   const objects=named(root,name);expect(objects).toHaveLength(1);
   return new T.Box3().setFromObject(objects[0],true);
  };
  expect(named(root,'secured-equipment-case')).toHaveLength(0);
  const stock=bounds('retained-weapon-stock'),receiver=bounds('retained-weapon-receiver'),barrel=bounds('retained-weapon-barrel'),bed=bounds('weapon-cradle-bed');
  expect(stock.intersectsBox(receiver)).toBe(true);expect(receiver.intersectsBox(barrel)).toBe(true);
  expect(stock.min.x).toBeLessThan(receiver.min.x);expect(barrel.max.x).toBeGreaterThan(receiver.max.x);
  for(const part of [stock,receiver,barrel])expect(bed.containsBox(new T.Box3(new T.Vector3(part.min.x,bed.min.y,part.min.z),new T.Vector3(part.max.x,bed.max.y,part.max.z)))).toBe(true);
  expect(bed.min.y).toBeCloseTo(bounds('closed-control-cabinet').max.y,5);
  const locks=named(root,'weapon-retaining-lock');expect(locks).toHaveLength(2);
  for(const lock of locks){const b=new T.Box3().setFromObject(lock,true);expect(b.intersectsBox(receiver)||b.intersectsBox(barrel)).toBe(true);expect(b.min.y).toBeLessThanOrEqual(bed.max.y);}
 });
 it.each([0,1,2])('keeps all vertices and flattened geometry inside footprint %s with cached resources',index=>{
  const root=model(index),f=footprints[index],world=new T.Group();
  const check=(object:T.Object3D)=>{const b=new T.Box3().setFromObject(object,true);expect(b.min.x).toBeGreaterThanOrEqual(f.x-1e-5);expect(b.max.x).toBeLessThanOrEqual(f.x+f.width+1e-5);expect(b.min.z).toBeGreaterThanOrEqual(f.y-1e-5);expect(b.max.z).toBeLessThanOrEqual(f.y+f.height+1e-5);expect(b.min.y).toBeGreaterThanOrEqual(-1e-5);};
  check(root);expect(root.userData.footprint).toEqual(f);appendEnvironment(world,root);check(world);
  expect(world.children.length).toBeLessThan(100);
  for(const child of world.children){const m=child as T.Mesh;expect([...geometries.values()]).toContain(m.geometry);expect(Object.values(MAT)).toContain(m.material);}
 });
});
