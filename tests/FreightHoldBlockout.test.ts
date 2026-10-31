import {expect,it} from 'vitest';
import * as T from 'three';
import {environmentObstacle,environmentArchitecture} from '../src/render/ShipEnvironments';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canTraverseExpedition,canOccupyExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';

it('supports folded steel crawler shoes around exposed end wheels',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[1];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},1,'freight-hold');
 model.updateMatrixWorld(true);
 const tracks:T.Object3D[]=[];model.traverse(o=>{if(o.name==='steel-crawler')tracks.push(o);});
 expect(tracks).toHaveLength(2);
 const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
 const frame=model.getObjectByName('crawler-bridge')!;expect(frame).toBeDefined();
 for(const track of tracks){
  const shoes=track.children.filter(o=>o.name==='folded-shoe') as T.Mesh[];
  expect(shoes.length).toBeGreaterThan(20);
  for(const shoe of shoes){
   expect((shoe.material as T.MeshStandardMaterial).metalness).toBeGreaterThan(.5);
   shoe.geometry.computeBoundingBox();const size=shoe.geometry.boundingBox!.getSize(new T.Vector3());
   expect(size.y).toBeGreaterThan(.15);expect(size.z).toBeGreaterThan(.5);
  }
  const wheels=track.children.filter(o=>o.name==='crawler-wheel');expect(wheels).toHaveLength(4);
  expect(bounds(frame).intersectsBox(bounds(track))).toBe(true);
  const load=track.parent!;
  for(const wheel of [wheels[0],wheels[3]]){
   const center=bounds(wheel).getCenter(new T.Vector3());
   const local=load.worldToLocal(center.clone());
   const start=load.localToWorld(new T.Vector3(local.x,local.y,Math.sign(local.z)*1.8));
   const hits=new T.Raycaster(start,center.sub(start).normalize(),0,2).intersectObject(track,true);
   expect(hits.length).toBeGreaterThan(0);expect(hits[0].object.name).toBe('crawler-wheel');
  }
 }
});

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

it('opens the operator station side and faces its supported seat toward the boom',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[1];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},1,'freight-hold');
 const cab=model.getObjectByName('cab')!;
 const seat=cab.getObjectByName('operator-seat');expect(seat).toBeDefined();
 const bounds=(name:string)=>new T.Box3().setFromObject(cab.getObjectByName(name)!,true);
 const cushion=bounds('operator-seat'),back=bounds('operator-back'),floor=bounds('operator-floor'),pedestal=bounds('seat-pedestal');
 expect(back.max.x).toBeLessThan(cushion.max.x);expect(back.intersectsBox(cushion)).toBe(true);
 expect(pedestal.intersectsBox(cushion)).toBe(true);expect(pedestal.intersectsBox(floor)).toBe(true);
 const roof=bounds('operator-canopy');
 for(const name of ['canopy-rear','canopy-front'])expect(bounds(name).intersectsBox(roof)).toBe(true);
 // A finite clear side opening above the step, tested by several horizontal rays.
 model.updateMatrixWorld(true);
 const load=cab.parent!;
 for(const x of [-.85,-.6,-.35])for(const y of [1.45,1.8]){
  const start=load.localToWorld(new T.Vector3(x,y,.4));
  const end=load.localToWorld(new T.Vector3(x,y,-.08));
  const ray=new T.Raycaster(start,end.clone().sub(start).normalize(),0,start.distanceTo(end));
  expect(ray.intersectObject(cab,true)).toHaveLength(0);
 }
});

it('forms an open excavator scoop with sloping cheeks and supported cutting teeth',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[1];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},1,'freight-hold');
 const bucket=model.getObjectByName('bucket')!;model.updateMatrixWorld(true);
 const ray=(a:T.Vector3,b:T.Vector3)=>{
  const start=bucket.localToWorld(a),end=bucket.localToWorld(b);
  return new T.Raycaster(start,end.clone().sub(start).normalize(),0,start.distanceTo(end)).intersectObject(bucket,true);
 };
 // The forward cheek slopes down rather than enclosing a rectangular tray.
 expect(ray(new T.Vector3(2.1,.7,1.5),new T.Vector3(2.1,.7,.85))).toHaveLength(0);
 expect(ray(new T.Vector3(1.6,.7,1.5),new T.Vector3(1.6,.7,.85)).length).toBeGreaterThan(0);
 // Open cavity has a continuous bearing floor, not a closed top or hollow outline.
 for(const x of [1.7,1.9,2.1]){
  const hits=ray(new T.Vector3(x,1.1,.45),new T.Vector3(x,.25,.45));
  expect(hits.length).toBeGreaterThan(0);
  const height=bucket.worldToLocal(hits[0].point.clone()).y;
  expect(height).toBeCloseTo(.43,4);
 }
 const lip=bucket.getObjectByName('cutting-lip');expect(lip).toBeDefined();
 const teeth=bucket.children.filter(o=>o.name.startsWith('cutting-tooth-'));expect(teeth).toHaveLength(4);
 const lipBounds=new T.Box3().setFromObject(lip!,true);
 for(const tooth of teeth){
  const b=new T.Box3().setFromObject(tooth,true);
  expect(b.intersectsBox(lipBounds)).toBe(true);expect(b.max.x).toBeGreaterThan(lipBounds.max.x);
 }
});

it('separates rounded shackle shoulders from the crosspiece while retaining its pickup bearing',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[2];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},2,'freight-hold');
 model.updateMatrixWorld(true);
 const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
 const beam=bounds(model.getObjectByName('lowered-yoke')!);
 const pickup=bounds(model.getObjectByName('master-link')!);
 expect(beam.intersectsBox(pickup)).toBe(true);
 const eyes:T.Object3D[]=[];model.traverse(o=>{if(o.name==='shackle-eye')eyes.push(o);});
 expect(eyes).toHaveLength(4);
 for(const eye of eyes)expect(bounds(eye).min.z-beam.max.z).toBeGreaterThan(.1);
});

it('stows substantial open load shackles pinned to the lifting beam',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[2];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},2,'freight-hold');
 const beam=model.getObjectByName('lowered-yoke')!;
 const shackles=model.getObjectByName('load-shackles');expect(shackles).toBeDefined();
 model.updateMatrixWorld(true);
 const load=beam.parent!;
 for(const x of [-1.08,.3]){
  const start=load.localToWorld(new T.Vector3(x,1.3,.47));
  const end=load.localToWorld(new T.Vector3(x,.2,.47));
  expect(new T.Raycaster(start,end.clone().sub(start).normalize(),0,start.distanceTo(end)).intersectObject(shackles!,true)).toHaveLength(0);
 }
 const pins:T.Object3D[]=[];model.traverse(o=>{if(o.name==='shackle-pin')pins.push(o);});expect(pins).toHaveLength(2);
 // The forward pin now transfers through a beam-connected lug, not through the beam body.
 const lugs:T.Object3D[]=[];model.traverse(o=>{if(o.name==='beam-lug')lugs.push(o);});expect(lugs).toHaveLength(2);
 for(const [i,pin] of pins.entries()){
  expect(new T.Box3().setFromObject(pin,true).intersectsBox(new T.Box3().setFromObject(lugs[i],true))).toBe(true);
  expect(new T.Box3().setFromObject(lugs[i],true).intersectsBox(new T.Box3().setFromObject(beam,true))).toBe(true);
 }
 const bows:T.Object3D[]=[];shackles!.traverse(o=>{if(o.name==='shackle-bow')bows.push(o);});expect(bows).toHaveLength(2);
 for(const bow of bows){const size=new T.Box3().setFromObject(bow,true).getSize(new T.Vector3());expect(size.x).toBeGreaterThan(.5);expect(size.z).toBeGreaterThan(.3);}
});

it('encloses forward shackle pins in bored arm eyes and beam-connected lugs',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[2];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},2,'freight-hold');
 model.updateMatrixWorld(true);
 const beam=model.getObjectByName('lowered-yoke')!,load=beam.parent!;
 const eyes:T.Object3D[]=[],lugs:T.Object3D[]=[],pins:T.Object3D[]=[];
 model.traverse(o=>{if(o.name==='shackle-eye')eyes.push(o);if(o.name==='beam-lug')lugs.push(o);if(o.name==='shackle-pin')pins.push(o);});
 expect(eyes).toHaveLength(4);expect(lugs).toHaveLength(2);
 const bounds=(o:T.Object3D)=>new T.Box3().setFromObject(o,true);
 for(const [i,x] of [-1.08,.3].entries()){
  expect(bounds(lugs[i]).intersectsBox(bounds(beam))).toBe(true);
  expect(bounds(pins[i]).intersectsBox(bounds(beam))).toBe(false);
  const hits=(object:T.Object3D,y:number,z:number)=>{
   const a=load.localToWorld(new T.Vector3(x-.6,y,z)),b=load.localToWorld(new T.Vector3(x+.6,y,z));
   return new T.Raycaster(a,b.clone().sub(a).normalize(),0,a.distanceTo(b)).intersectObject(object,true);
  };
  for(const part of [lugs[i],...eyes.slice(i*2,i*2+2)]){
   expect(hits(part,.45,.22)).toHaveLength(0);
   expect(hits(part,.59,.22).length).toBeGreaterThan(0);
  }
  expect(hits(pins[i],.45,.22).length).toBeGreaterThan(0);
 }
});

it('joins narrow pickup legs into a broad foot around a clear aperture',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[2];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},2,'freight-hold');
 const eye=model.getObjectByName('master-link')!,load=eye.parent!;model.updateMatrixWorld(true);
 const hits=(x:number,y:number)=>{
  const a=load.localToWorld(new T.Vector3(x,y,.5)),b=load.localToWorld(new T.Vector3(x,y,-.5));
  return new T.Raycaster(a,b.clone().sub(a).normalize(),0,a.distanceTo(b)).intersectObject(eye,true);
 };
 for(const x of [-.79,.01])for(const y of [.78,.86,.94,1.02,1.1,1.18,1.26,1.34])expect(hits(x,y).length).toBeGreaterThan(0);
 for(const x of [-.59,-.39,-.19])for(const y of [.98,1.12,1.26,1.38])expect(hits(x,y)).toHaveLength(0);
 for(const x of [-.79,-.59,-.39,-.19,.01])expect(hits(x,.78).length).toBeGreaterThan(0);
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

it('rounds the shackle eye shoulder instead of stacking flat pin collars',()=>{
 const f=STORY_ROOM_TEMPLATES['freight-hold'].obstacles[2];
 const model=environmentObstacle('cargo',{x:f.x/32,y:f.y/32,width:f.width/32,height:f.height/32},2,'freight-hold');
 model.updateMatrixWorld(true);
 const eyes:T.Mesh[]=[];model.traverse(o=>{if(o.name==='shackle-eye')eyes.push(o as T.Mesh);});
 expect(eyes).toHaveLength(4);
 for(const eye of eyes){
  const heightAt=(x:number)=>{
   const a=eye.localToWorld(new T.Vector3(x,.5,0)),b=eye.localToWorld(new T.Vector3(x,0,0));
   const hits=new T.Raycaster(a,b.clone().sub(a).normalize(),0,a.distanceTo(b)).intersectObject(eye);
   expect(hits.length).toBeGreaterThan(0);return eye.worldToLocal(hits[0].point.clone()).y;
  };
  expect(heightAt(0)).toBeGreaterThan(heightAt(.105)+.025);
  expect(heightAt(0)).toBeGreaterThan(heightAt(-.105)+.025);
 }
});
