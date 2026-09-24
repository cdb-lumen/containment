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
