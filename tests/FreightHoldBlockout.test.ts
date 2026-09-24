import {expect,it} from 'vitest';
import * as T from 'three';
import {environmentObstacle,environmentArchitecture} from '../src/render/ShipEnvironments';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canTraverseExpedition,canOccupyExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';

it('groups seed stock and machinery with supporting freight inside aligned bays',()=>{
 const room=STORY_ROOM_TEMPLATES['freight-hold'];
 expect(room.obstacles).toHaveLength(5);
 const models=room.obstacles.map((f,i)=>environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},i,'freight-hold'));
 expect(models.filter(m=>m.getObjectByName('bucket'))).toHaveLength(1);
 expect(models[0].getObjectByName('seed-drum')).toBeDefined();
 expect(models[1].getObjectByName('cab')).toBeDefined();
 expect(models[2].getObjectByName('lowered-yoke')).toBeDefined();
 expect(models.slice(3).every(m=>m.getObjectByName('freight-cases'))).toBe(true);
 for(const [i,m] of models.entries()){
  const f=room.obstacles[i],b=new T.Box3().setFromObject(m,true);
  expect(b.min.x).toBeCloseTo(f.x/32,5);expect(b.max.x).toBeCloseTo((f.x+f.width)/32,5);
  expect(b.min.z).toBeCloseTo(f.y/32,5);expect(b.max.z).toBeCloseTo((f.y+f.height)/32,5);
  expect(b.min.y).toBeCloseTo(0,5);expect(b.max.y).toBeLessThan(2.8);
 }
 const architecture=new T.Group();environmentArchitecture(architecture,'cargo',30,22,'freight-hold');
 const bay=architecture.getObjectByName('freight-bay-markings');expect(bay).toBeDefined();
 expect(bay!.children.length).toBe(8);
 expect(environmentObstacle('cargo',{x:0,y:0,width:5,height:4},1,'breached-loading-bay').getObjectByName('bucket')).toBeUndefined();
});

it('seats the representative inset lid inside an exposed rim with two retaining straps',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[3];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},3,'freight-hold');
 const lid=model.getObjectByName('case-inset-lid');expect(lid).toBeDefined();
 const bounds=(name:string)=>new T.Box3().setFromObject(model.getObjectByName(name)!,true);
 const top=bounds('case-inset-lid'),rim=bounds('case-rim'),seat=bounds('case-lid-seat');
 expect(top.min.x).toBeGreaterThan(rim.min.x+.05);expect(top.max.x).toBeLessThan(rim.max.x-.05);
 expect(top.min.z).toBeGreaterThan(rim.min.z+.05);expect(top.max.z).toBeLessThan(rim.max.z-.05);
 expect(top.min.y).toBeCloseTo(seat.max.y,5);expect(top.max.y).toBeGreaterThan(rim.max.y+.04);
 for(const side of ['left','right']){
  const strap=bounds(`case-strap-${side}`);
  expect(strap.min.y).toBeLessThanOrEqual(top.max.y);expect(strap.max.y).toBeGreaterThan(top.max.y);
  expect(strap.min.z).toBeLessThan(top.min.z);expect(strap.max.z).toBeGreaterThan(top.max.z);
 }
});

it('gives every freight case a supported inset lid, exposed rim and paired restraints',()=>{
 for(const index of [3,4]){
  const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[index];
  const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},index,'freight-hold');
  const lids:T.Object3D[]=[];model.traverse(o=>{if(o.name==='case-inset-lid')lids.push(o);});
  expect(lids).toHaveLength(index===3?4:2);
  for(const lid of lids){
   const group=lid.parent!;
   const bounds=(name:string)=>new T.Box3().setFromObject(group.getObjectByName(name)!,true);
   const top=new T.Box3().setFromObject(lid,true),rim=bounds('case-rim'),seat=bounds('case-lid-seat');
   expect(top.min.x).toBeGreaterThan(rim.min.x+.05);expect(top.max.x).toBeLessThan(rim.max.x-.05);
   expect(top.min.z).toBeGreaterThan(rim.min.z+.05);expect(top.max.z).toBeLessThan(rim.max.z-.05);
   expect(top.min.y).toBeCloseTo(seat.max.y,5);expect(top.max.y).toBeGreaterThan(rim.max.y+.04);
   for(const side of ['left','right']){
    const strap=bounds(`case-strap-${side}`);
    expect(strap.min.y).toBeLessThanOrEqual(top.max.y);expect(strap.max.y).toBeGreaterThan(top.max.y);
    expect(strap.min.z).toBeLessThan(top.min.z);expect(strap.max.z).toBeGreaterThan(top.max.z);
   }
  }
 }
});

it('connects squared excavator boom members through exposed transverse pivot hubs',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[1];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},1,'freight-hold');
 const boom=model.getObjectByName('folded-boom') as T.Mesh;
 const stick=model.getObjectByName('folded-stick') as T.Mesh;
 expect(boom).toBeDefined();expect(stick).toBeDefined();
 const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
 const elbow=model.getObjectByName('boom-elbow')!;expect(elbow).toBeDefined();
 expect(bounds(boom).intersectsBox(bounds(elbow))).toBe(true);
 expect(bounds(stick).intersectsBox(bounds(elbow))).toBe(true);
 const pin=bounds(elbow),arm=bounds(boom);
 expect(pin.min.z).toBeLessThan(arm.min.z);expect(pin.max.z).toBeGreaterThan(arm.max.z);
 expect(boom.geometry.type).not.toBe('CylinderGeometry');
 expect(stick.geometry.type).not.toBe('CylinderGeometry');
 const bucket=model.getObjectByName('bucket')!;
 expect(bounds(stick).intersectsBox(bounds(bucket))).toBe(true);
});

it('keeps the central aisle and outer freight circuits clear for player and brute radii',()=>{
 const node=generateRun(1729,3).nodes.find(n=>n.templateId==='freight-hold')!;
 const g=createExpeditionGeometry(node);
 const paths=[[[100,440],[1100,440]],[[100,440],[100,100],[1100,100],[1100,440]],[[100,440],[100,780],[1100,780],[1100,440]]];
 for(const radius of [16,28]){
  expect(canOccupyExpedition(g,g.playerSpawn,radius)).toBe(true);
  expect(canOccupyExpedition(g,g.exitPoint,radius)).toBe(true);
  for(const path of paths)for(let i=1;i<path.length;i++){
   const a={x:path[i-1][0],y:path[i-1][1]},b={x:path[i][0],y:path[i][1]};
   expect(canTraverseExpedition(g,a,b,radius)).toBe(true);
   expect(canTraverseExpedition(g,b,a,radius)).toBe(true);
  }
 }
 expect(hasClearExpeditionShot(g,{x:100,y:440},{x:1100,y:440})).toBe(true);
 for(const f of STORY_ROOM_TEMPLATES['freight-hold'].obstacles){
  const center={x:f.x+f.width/2,y:f.y+f.height/2};
  expect(canOccupyExpedition(g,center,16)).toBe(false);
  expect(hasClearExpeditionShot(g,{x:100,y:440},center)).toBe(false);
 }
});
