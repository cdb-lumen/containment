import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {environmentObstacle,appendEnvironment} from '../src/render/ShipEnvironments';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {MAT,geometries} from '../src/render/meshParts';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {DepthGame} from '../src/DepthGame';

const room=STORY_ROOM_TEMPLATES['crew-checkpoint'];
const footprints=room.obstacles.map(f=>({x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32}));
const model=(index:number)=>environmentObstacle('security',footprints[index],index,'crew-checkpoint');
const named=(root:T.Object3D,name:string)=>{root.updateWorldMatrix(true,true);const result:T.Object3D[]=[];root.traverse(o=>{if(o.name===name)result.push(o);});return result;};
describe('Room5 checkpoint rough',()=>{
 it('joins both room walls and leaves one breached passage beside the protected station',()=>{
  expect([room.width,room.height,room.spawn,room.exit]).toEqual([1200,880,{x:100,y:440},{x:1100,y:440}]);
  const [north,south,desk]=room.obstacles;
  expect(north.y).toBe(0);expect(south.y+south.height).toBe(room.height);
  expect(north.x).toBe(south.x);expect(north.width).toBe(south.width);
  expect(south.y-north.y-north.height).toBe(128);
  expect(north.x+north.width).toBe(desk.x);
  expect(desk.y+desk.height).toBe(north.y+north.height);
 });
 it.each([16,28])('keeps radius %s routes and the crew position legal through production movement',radius=>{
  const geometry=createExpeditionGeometry(generateRun(137).nodes[4]),game=new DepthGame();game.geometry=geometry;
  const operator={x:730,y:320};
  for(const point of [room.spawn,room.exit,operator,...room.breaches])expect(canOccupyExpedition(geometry,point,radius)).toBe(true);
  const routes=[[[100,440],[1100,440]],[[1100,440],[100,440]],[[730,440],[730,320]],[[100,100],[400,100],[400,440],[730,440],[730,320]],[[1100,780],[730,780],[730,440],[730,320]]];
  for(const route of routes){
   Object.assign(game.player,{x:route[0][0],y:route[0][1],radius});
   for(const [x,y] of route.slice(1)){
    const from={x:game.player.x,y:game.player.y},to={x,y};expect(canTraverseExpedition(geometry,from,to,radius)).toBe(true);
    const steps=Math.ceil(Math.hypot(x-from.x,y-from.y)/2);
    for(let i=0;i<steps;i++){const moved=game.moveCorpse(game.player,(x-from.x)/steps,(y-from.y)/steps);expect(moved.blocked).toBe(false);Object.assign(game.player,{x:moved.x,y:moved.y});expect(canOccupyExpedition(geometry,game.player,radius)).toBe(true);}
    expect(game.player.x).toBeCloseTo(x,5);expect(game.player.y).toBeCloseTo(y,5);
   }
  }
  // Every possible crossing of the partition centre lies in its gate. Closing
  // that gap disconnects west/east, rather than leaving a walk-around at a wall.
  const [north,south]=room.obstacles,mid=north.x+north.width/2;
  const closed={...geometry,blockers:[...geometry.blockers,{x:north.x,y:north.y+north.height,width:north.width,height:south.y-north.y-north.height}]};
  let open=0;
  for(let y=radius;y<=room.height-radius;y++){
   const legal=canOccupyExpedition(geometry,{x:mid,y},radius);
   if(legal){open++;expect(y).toBeGreaterThanOrEqual(north.y+north.height+radius);expect(y).toBeLessThanOrEqual(south.y-radius);}
   expect(canOccupyExpedition(closed,{x:mid,y},radius)).toBe(false);
  }
  expect(open).toBeGreaterThan(0);
 });
 it('blocks west-approach shots at the shield and operator, but leaves the gate open',()=>{
  const geometry=createExpeditionGeometry(generateRun(137).nodes[4]);
  expect(hasClearExpeditionShot(geometry,{x:100,y:440},{x:1100,y:440})).toBe(true);
  for(const y of [100,320,700])expect(hasClearExpeditionShot(geometry,{x:400,y},{x:800,y})).toBe(false);
  for(const y of [360,400,440])expect(hasClearExpeditionShot(geometry,{x:100,y},{x:730,y:320})).toBe(false);
 });
 it.each([0,1])('builds low longitudinal cover with grounded diagonal braces at reservation %s',index=>{
  const root=model(index),plates=named(root,'ballistic-panel'),braces=named(root,'rear-brace');
  expect(plates).toHaveLength(4);expect(braces).toHaveLength(8);
  for(const panel of plates){const b=new T.Box3().setFromObject(panel,true);expect(b.max.z-b.min.z).toBeGreaterThan(2);expect(b.max.x-b.min.x).toBeCloseTo(.48,5);expect(b.max.y).toBeLessThanOrEqual(1.3);}
  for(const brace of braces){const b=new T.Box3().setFromObject(brace,true);expect(b.min.y).toBeLessThan(.3);expect(b.max.y).toBeGreaterThan(.9);expect(b.max.x-b.min.x).toBeGreaterThan(1);}
 });
 it('gives the representative west shield thick armor and a connected frame on exposed grounded skids',()=>{
  const root=model(0),panel=new T.Box3().setFromObject(named(root,'ballistic-panel')[1],true);
  expect(panel.max.x-panel.min.x).toBeCloseTo(.48,5);
  const skids=named(root,'representative-skid').slice(2,4),posts=named(root,'representative-frame-post').slice(2,4);
  expect(skids).toHaveLength(2);expect(posts).toHaveLength(2);
  for(let i=0;i<2;i++){
   const foot=new T.Box3().setFromObject(skids[i],true),post=new T.Box3().setFromObject(posts[i],true);
   expect(foot.min.y).toBeCloseTo(0,5);expect(foot.max.y).toBeLessThan(panel.min.y);
   expect(foot.intersectsBox(post)).toBe(true);expect(post.intersectsBox(panel)).toBe(true);
   expect(foot.max.x-foot.min.x).toBeGreaterThan(2);
  }
  const sill=new T.Box3().setFromObject(named(root,'representative-frame-sill')[1],true);
  expect(sill.intersectsBox(panel)).toBe(true);
  for(const post of posts)expect(sill.intersectsBox(new T.Box3().setFromObject(post,true))).toBe(true);
  const toes=named(root,'representative-rear-shoe').slice(2,4);expect(toes).toHaveLength(2);
  for(let i=0;i<2;i++){
   const toe=new T.Box3().setFromObject(toes[i],true),foot=new T.Box3().setFromObject(skids[i],true);
   expect(toe.min.y).toBeCloseTo(0,5);expect(toe.intersectsBox(foot)).toBe(true);
   expect(toe.max.y-foot.max.y).toBeGreaterThan(.1);
   expect(toe.max.z-toe.min.z).toBeGreaterThan(.5);
  }
  expect(named(model(1),'representative-skid')).toHaveLength(8);
 });
 it.each([0,1])('finishes every shield with the accepted grounded construction at reservation %s',index=>{
  const root=model(index),panels=named(root,'ballistic-panel');
  expect(panels).toHaveLength(4);
  const skids=named(root,'representative-skid'),posts=named(root,'representative-frame-post'),shoes=named(root,'representative-rear-shoe');
  expect(skids).toHaveLength(8);expect(posts).toHaveLength(8);expect(shoes).toHaveLength(8);
  expect(named(root,'ballast-base')).toHaveLength(0);
  for(let n=0;n<4;n++){
   const panel=new T.Box3().setFromObject(panels[n],true);
   expect(panel.max.x-panel.min.x).toBeCloseTo(.48,5);
   for(let side=0;side<2;side++){
    const i=n*2+side,foot=new T.Box3().setFromObject(skids[i],true),post=new T.Box3().setFromObject(posts[i],true),shoe=new T.Box3().setFromObject(shoes[i],true);
    expect(foot.min.y).toBeCloseTo(0,5);expect(shoe.min.y).toBeCloseTo(0,5);
    expect(foot.intersectsBox(post)).toBe(true);expect(post.intersectsBox(panel)).toBe(true);expect(shoe.intersectsBox(foot)).toBe(true);
   }
  }
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
  expect(stock.max.z).toBeGreaterThan(receiver.max.z);expect(barrel.min.z).toBeLessThan(receiver.min.z);
  for(const part of [stock,receiver,barrel])expect(bed.containsBox(new T.Box3(new T.Vector3(part.min.x,bed.min.y,part.min.z),new T.Vector3(part.max.x,bed.max.y,part.max.z)))).toBe(true);
  expect(bed.min.y).toBeCloseTo(bounds('closed-control-cabinet').max.y,5);
  const locks=named(root,'weapon-retaining-lock');expect(locks).toHaveLength(2);
  for(const lock of locks){const b=new T.Box3().setFromObject(lock,true);expect(b.intersectsBox(receiver)||b.intersectsBox(barrel)).toBe(true);expect(b.min.y).toBeLessThanOrEqual(bed.max.y);}
 });
 it('anchors the partition to walls and shows gate damage without putting hardware in the passage',()=>{
  for(const index of [0,1]){
   const root=model(index),f=footprints[index];
   expect(named(root,'wall-anchor')).toHaveLength(1);expect(named(root,'gate-jamb')).toHaveLength(1);
   const join=new T.Box3().setFromObject(named(root,'wall-anchor')[0],true);
   expect(index===0?join.min.z:join.max.z).toBeCloseTo(index===0?0:room.height/32,5);
   const jamb=new T.Box3().setFromObject(named(root,'gate-jamb')[0],true);
   expect(jamb.max.y).toBeGreaterThan(1.6);
   expect(index===0?jamb.max.z:jamb.min.z).toBeCloseTo(index===0?f.y+f.height:f.y,5);
  }
  const north=model(0),slats=named(north,'forced-gate-leaf');expect(slats).toHaveLength(4);
  const slatBounds=slats.map(s=>new T.Box3().setFromObject(s,true));
  expect(Math.max(...slatBounds.map(b=>b.max.x))-Math.min(...slatBounds.map(b=>b.min.x))).toBeGreaterThan(1.5);
  const straps=named(north,'gate-leaf-strap');expect(straps).toHaveLength(1);
  const strap=new T.Box3().setFromObject(straps[0],true);
  // These are axis-aligned solid boxes, not diagonal-brace AABBs.
  for(const slat of slatBounds)expect(strap.intersectsBox(slat)).toBe(true);
  const spines=named(north,'gate-leaf-spine');expect(spines).toHaveLength(1);
  const spine=new T.Box3().setFromObject(spines[0],true);expect(spine.intersectsBox(strap)).toBe(true);
  for(const hinge of named(north,'gate-hinge'))expect(spine.intersectsBox(new T.Box3().setFromObject(hinge,true))).toBe(true);
  expect(named(model(1),'broken-latch')).toHaveLength(2);
  const station=model(2),seat=new T.Box3().setFromObject(named(station,'guard-seat')[0],true),screen=new T.Box3().setFromObject(named(station,'guard-terminal')[0],true);
  expect(seat.getCenter(new T.Vector3()).x).toBeGreaterThan(screen.getCenter(new T.Vector3()).x);
 });
 it.each([0,1,2])('keeps all vertices and flattened geometry inside footprint %s with cached resources',index=>{
  const root=model(index),f=footprints[index],world=new T.Group();
  const check=(object:T.Object3D)=>{const b=new T.Box3().setFromObject(object,true);expect(b.min.x).toBeGreaterThanOrEqual(f.x-1e-5);expect(b.max.x).toBeLessThanOrEqual(f.x+f.width+1e-5);expect(b.min.z).toBeGreaterThanOrEqual(f.y-1e-5);expect(b.max.z).toBeLessThanOrEqual(f.y+f.height+1e-5);expect(b.min.y).toBeGreaterThanOrEqual(-1e-5);};
  check(root);expect(root.userData.footprint).toEqual(f);appendEnvironment(world,root);check(world);
  expect(world.children.length).toBeLessThan(100);
  for(const child of world.children){const m=child as T.Mesh;expect([...geometries.values()]).toContain(m.geometry);expect(Object.values(MAT)).toContain(m.material);}
 });
});
