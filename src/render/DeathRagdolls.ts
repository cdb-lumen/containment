import RAPIER from '@dimforge/rapier3d-compat';
import * as T from 'three';
import type {ActorModel} from './models';
import type {RoomTemplate} from '../game/roguelike/types';

let ready=false,initializing:Promise<void>|undefined;
export function initDeathPhysics(){return initializing??=RAPIER.init().then(()=>{ready=true;});}
const GROUPS=0x00020001,STATIC_GROUPS=0x00010002,STEP=1/120;
export const RAGDOLL_BUDGET={high:6,low:3} as const;
// Authored deformation bones only. IK controls, fingers, antennae and small face
// bones remain attached to their nearest simulated ancestor. At most 19 bodies.
const CORE:Record<string,string[]>={crawler:['chest'],stalker:['torso','chest','neck_lo','head'],spitter:['bum','spine2','head'],carrier:['body','body001','body002','head'],brute:['chest','tail','neck','head']};
const canon=(name:string)=>name.replace(/[.]/g,''); // GLTFLoader sanitizes dots.
function selected(name:string,family:string){
 const n=canon(name);if(CORE[family]?.includes(n))return true;
 if(family==='crawler')return /^leg\d_(upper|lower)$/.test(n);
 if(family==='stalker')return /^(leg_(back|front)_(up|mid)|arm_(up|mid))[LR]$/.test(n);
 if(family==='spitter')return /^(leg_[bm]1?|hand1?)[LR]$/.test(n);
 if(family==='carrier')return /^(leg_(front|middle|back)(001)?|upper_arm(001)?)[LR]$/.test(n);
 return /^(leg\.(back|front)|foot\.(back|front)|shoulder|forearm)\.[rl]$/.test(name)||/^(leg(back|front)|foot(back|front)|shoulder|forearm)[rl]$/.test(n);
}
type BonePose={bone:T.Bone;position:T.Vector3;rotation:T.Quaternion;scale:T.Vector3;auto:boolean};
type Part={bone:T.Bone;body:RAPIER.RigidBody;bindRotation:T.Quaternion};
type RagdollRecord={model:ActorModel;parts:Part[];joints:RAPIER.ImpulseJoint[];poses:BonePose[];age:number;settled:boolean;falling:boolean;fallSpeed:number;support:T.Vector3;supportLift:number;rootPosition:T.Vector3;anchor:T.Vector3};
type Room=Pick<RoomTemplate,'width'|'height'|'obstacles'|'boundary'|'voids'>;

/** Presentation-only world. Never fed back into combat, navigation or mutation state. */
export class DeathRagdolls {
 private world:RAPIER.World|undefined;
 private records=new Map<number,RagdollRecord>();
 private tier:'high'|'low'='high';private accumulator=0;
 private v=new T.Vector3();private q=new T.Quaternion();
 private elapsedMs=0;private steps=0;private overflow=0;
 setQuality(tier:'high'|'low'){
  this.tier=tier;
  const active=[...this.records.values()].filter(r=>!r.settled);
  while(active.length>RAGDOLL_BUDGET[tier])this.retire(active.shift()!);
 }
 private statics:RAPIER.Collider[]=[];
 private fallLimit=-32;
 private supportRay=new RAPIER.Ray({x:0,y:0,z:0},{x:0,y:-1,z:0});
 private collisionMaterial=new T.MeshBasicMaterial({side:T.DoubleSide});
 setRoom(room:Room,world?:T.Object3D){
  this.dispose();if(!ready)return;
  this.world=new RAPIER.World({x:0,y:-9.81,z:0});this.world.integrationParameters.numSolverIterations=12;
  this.accumulator=0;this.elapsedMs=0;this.steps=0;this.overflow=0;
  if(world){this.refreshStatic(world);return;}
  // Compatibility proxy only. Without rendered geometry furniture heights are
  // unknown, so do not fabricate them. Polygon voids remain floor holes.
  const group=new T.Group(),boundary=room.boundary??[{x:0,y:0},{x:room.width,y:0},{x:room.width,y:room.height},{x:0,y:room.height}];
  const shape=new T.Shape(boundary.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  for(const hole of room.voids??[])shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p.x/32,-p.y/32))));
  const floor=new T.Mesh(new T.ShapeGeometry(shape),this.collisionMaterial);floor.rotation.x=-Math.PI/2;group.add(floor);
  for(let i=0;i<boundary.length;i++){
   const a=boundary[i],b=boundary[(i+1)%boundary.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32;
   const mesh=new T.Mesh(new T.BoxGeometry(Math.hypot(dx,dz),3,.24),this.collisionMaterial);
   mesh.position.set((a.x+b.x)/64,1.5,(a.y+b.y)/64);mesh.rotation.y=-Math.atan2(dz,dx);group.add(mesh);
  }
  this.refreshStatic(group);group.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});
 }
 /** Replace static triangles only. Existing ragdolls and their poses survive. */
 refreshStatic(world:T.Object3D){
  if(!this.world)return;
  for(const c of this.statics)this.world.removeCollider(c,false);this.statics=[];
  this.fallLimit=-32;world.updateWorldMatrix(true,true);
  world.traverseVisible(o=>{
   if(!(o instanceof T.Mesh)||o instanceof T.SkinnedMesh||o.userData.ragdollCollision===false)return;
   const materials=Array.isArray(o.material)?o.material:[o.material];
   if(materials.every(m=>!m.visible||(m.transparent&&m.opacity<.5)))return;
   const add=(matrix:T.Matrix4)=>{
    let g=o.geometry.clone().applyMatrix4(matrix);g.computeBoundingBox();
    this.fallLimit=Math.min(this.fallLimit,g.boundingBox!.min.y-32);
    const size=g.boundingBox!.getSize(new T.Vector3());
    // Dense standalone equipment gets a fitted finite-height proxy. Broad deck
    // meshes keep triangles so authored concave cutouts remain open.
    if((g.index?.count??g.getAttribute('position')?.count??0)>12288&&size.x<8&&size.z<8&&size.y>.15){
     const center=g.boundingBox!.getCenter(new T.Vector3());g.dispose();g=new T.BoxGeometry(size.x,size.y,size.z).translate(center.x,center.y,center.z);
    }
    const pos=g.getAttribute('position');if(!pos){g.dispose();return;}
    const vertices=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){vertices[i*3]=pos.getX(i);vertices[i*3+1]=pos.getY(i);vertices[i*3+2]=pos.getZ(i);}
    const index=g.index?new Uint32Array(g.index.array):Uint32Array.from({length:pos.count},(_,i)=>i);
    if(index.length<3){g.dispose();return;}
    this.statics.push(this.world!.createCollider(RAPIER.ColliderDesc.trimesh(vertices,index).setCollisionGroups(STATIC_GROUPS).setFriction(.8)));
    g.dispose();
   };
   if(o instanceof T.InstancedMesh){const matrix=new T.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);add(matrix.premultiply(o.matrixWorld));}}else add(o.matrixWorld);
  });
  // Rapier 0.20 scene queries share the simulation broad phase. Publish changed
  // statics with a zero-duration step, without advancing existing bodies.
  const timestep=this.world.timestep;this.world.timestep=0;this.world.step();this.world.timestep=timestep;
  for(const r of this.records.values())if(r.settled){r.falling=true;r.fallSpeed=0;}
 }
 add(id:number,model:ActorModel,family:string,velocity:{x:number;z:number}){
  if(!this.world||this.records.has(id))return false;
  if(this.snapshot().active>=RAGDOLL_BUDGET[this.tier]){this.overflow++;return false;}
  model.root.updateMatrixWorld(true);
  const poses:BonePose[]=[],bones:T.Bone[]=[];
  model.root.traverse(o=>{if(o instanceof T.Bone){poses.push({bone:o,position:o.position.clone(),rotation:o.quaternion.clone(),scale:o.scale.clone(),auto:o.matrixAutoUpdate});if(selected(o.name,family))bones.push(o);}});
  if(bones.length<3||bones.length>20)return false;
  model.freeze?.();
  const parts:Part[]=[],joints:RAPIER.ImpulseJoint[]=[],mass=family==='brute'?3.5:family==='carrier'?1.8:1;
  const speed=Math.hypot(velocity.x,velocity.z),scale=Math.min(1,12/Math.max(speed,.001))/mass;
  for(const bone of bones){
   bone.matrixAutoUpdate=true;const position=bone.getWorldPosition(new T.Vector3()),rotation=bone.getWorldQuaternion(new T.Quaternion());
   const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x,position.y,position.z).setRotation({x:0,y:0,z:0,w:1}).setCanSleep(true).setCcdEnabled(true).setLinearDamping(.6).setAngularDamping(1.8));
   // Capsule along the first deformation child, with a small end sphere for tips.
   const child=bone.children.find(o=>o instanceof T.Bone&&!/^ik/i.test(o.name));
   const end=child?child.getWorldPosition(new T.Vector3()).sub(position):new T.Vector3(0,.12,0);
   const length=T.MathUtils.clamp(end.length(),.1,.9),radius=T.MathUtils.clamp(model.height*.055,.045,.16);
   const local=end.clone().normalize();
   const shapeQ=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),local);
   const desc=RAPIER.ColliderDesc.capsule(Math.max(0,length/2-radius),radius).setTranslation(local.x*length/2,local.y*length/2,local.z*length/2).setRotation(shapeQ).setMass(mass*(parts.length===0?3:1)).setCollisionGroups(GROUPS).setFriction(.8).setRestitution(.08);
   this.world.createCollider(desc,body);
   body.setLinvel({x:velocity.x*scale,y:2.3/Math.sqrt(mass),z:velocity.z*scale},true);
   // Off-center shot torque tips the body. Limbs subsequently respond to joints,
   // gravity and contacts rather than a canned rotation or independent animation.
   body.setAngvel({x:velocity.z*scale*.24,y:0,z:-velocity.x*scale*.24},true);
   parts.push({bone,body,bindRotation:rotation});
  }
  for(const part of parts.slice(1)){
   let parent=part.bone.parent;while(parent&&!parts.some(p=>p.bone===parent))parent=parent.parent;
   const other=parts.find(p=>p.bone===parent)??parts[0];
   const anchor=part.body.translation(),op=other.body.translation(),oq=other.body.rotation();
   const local=new T.Vector3(anchor.x-op.x,anchor.y-op.y,anchor.z-op.z).applyQuaternion(new T.Quaternion(oq.x,oq.y,oq.z,oq.w).invert());
   const joint=this.world.createImpulseJoint(RAPIER.JointData.revolute(local,{x:0,y:0,z:0},{x:1,y:0,z:0}),other.body,part.body,true) as RAPIER.RevoluteImpulseJoint;
   // Align both constraint frames in the captured world pose, then bound flexion.
   const childQ=part.body.rotation(),frame=new T.Quaternion(childQ.x,childQ.y,childQ.z,childQ.w).invert().multiply(new T.Quaternion(oq.x,oq.y,oq.z,oq.w));
   const axisFrame=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2);joint.setFrameX1(axisFrame);joint.setFrameX2(frame.multiply(axisFrame));
   joint.setLimits(-1.1,1.1);joint.setContactsEnabled(false);joints.push(joint);
  }
  this.records.set(id,{model,parts,joints,poses,age:0,settled:false,falling:false,fallSpeed:0,support:new T.Vector3(),supportLift:.25,rootPosition:model.root.position.clone(),anchor:new T.Vector3().copy(parts[0].body.translation())});return true;
 }
 update(dt:number){
  this.elapsedMs=0;if(!this.world||dt<=0)return;
  let active=false,falling=false;for(const r of this.records.values()){active ||= !r.settled;falling ||= r.falling;}
  if(!active&&!falling)return;const start=performance.now(),delta=Math.min(dt,.05);
  if(active){this.accumulator+=delta;while(this.accumulator+1e-9>=STEP){this.world.timestep=STEP;this.world.step();
   // Project residual anchor drift after the bounded iterative solve. Small
   // imported extremities otherwise stretch under large mass/inertia ratios.
   for(const r of this.records.values())for(const j of r.joints){const a=j.body1(),b=j.body2(),q=a.rotation();const target=new T.Vector3().copy(j.anchor1()).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w)).add(a.translation());b.setTranslation(target,false);}
   this.accumulator-=STEP;this.steps++;}}
  for(const r of this.records.values()){
   if(r.falling){this.fall(r,delta);continue;}if(r.settled)continue;r.age+=delta;this.apply(r);
   if(r.parts.every(p=>p.body.isSleeping()))this.retire(r);else if(r.age>=6)this.retire(r);
  }
  this.elapsedMs=performance.now()-start;
 }
 private fall(r:RagdollRecord,dt:number){
  r.fallSpeed-=9.81*dt;let dy=r.fallSpeed*dt;
  // The frozen pose only translates. Its cached bottom-center support avoids
  // rescanning every skinned vertex or accepting an AABB corner across a pit.
  // Start above shallow solver penetration rather than casting below the floor.
  const lift=r.supportLift,origin=this.supportRay.origin;
  origin.x=r.support.x;origin.y=r.support.y+lift;origin.z=r.support.z;
  const hit=this.world!.castRay(this.supportRay,lift-dy,true,RAPIER.QueryFilterFlags.ONLY_FIXED,GROUPS);
  r.supportLift=.25;
  if(hit){dy=lift-hit.timeOfImpact;r.falling=false;r.fallSpeed=0;}
  r.model.root.position.y+=dy;r.anchor.y+=dy;r.support.y+=dy;r.model.root.updateMatrixWorld(true);
  // Stop retained renderer-owned corpses below every static, including real pits.
  if(r.support.y<this.fallLimit){r.falling=false;r.fallSpeed=0;}
 }
 private apply(r:RagdollRecord){
  // Parent-first world -> local mapping retains imported bind matrices and GPU
  // skinning. Unsimulated bones follow the nearest simulated parent unchanged.
  for(const p of r.parts){
   const position=p.body.translation(),rotation=p.body.rotation();
   p.bone.parent!.updateWorldMatrix(true,false);
   this.v.set(position.x,position.y,position.z);p.bone.position.copy(p.bone.parent!.worldToLocal(this.v));
   p.bone.parent!.getWorldQuaternion(this.q).invert();p.bone.quaternion.set(rotation.x,rotation.y,rotation.z,rotation.w).multiply(p.bindRotation).premultiply(this.q);p.bone.updateMatrix();p.bone.updateWorldMatrix(false,true);
  }
  r.anchor.copy(r.parts[0].body.translation());
 }
 private retire(r:RagdollRecord){
  if(r.settled)return;this.apply(r);
  r.model.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(r.model.root,true);
  if(bounds.isEmpty())r.support.copy(r.anchor).y-=.05;
  else {bounds.getCenter(r.support);r.support.y=bounds.min.y;}
  r.supportLift=Math.max(.25,(bounds.isEmpty()?r.anchor.y:bounds.max.y)-r.support.y+.25);
  for(const p of r.parts){p.body.sleep();this.world!.removeRigidBody(p.body);}r.parts=[];r.joints=[];r.settled=true;r.falling=true;r.fallSpeed=0;
 }
 has(id:number){return this.records.has(id);}
 position(id:number){return this.records.get(id)?.anchor;}
 sync(id:number,x:number,z:number){
  const r=this.records.get(id);if(!r)return;const dx=x-r.anchor.x,dz=z-r.anchor.z;
  if(r.settled){r.model.root.position.x+=dx;r.model.root.position.z+=dz;r.support.x+=dx;r.support.z+=dz;r.falling=true;r.fallSpeed=0;}else{
   for(const p of r.parts){const v=p.body.translation();p.body.setTranslation({x:v.x+dx,y:v.y,z:v.z+dz},true);p.body.setLinvel({x:0,y:0,z:0},true);}this.apply(r);
  }
  r.anchor.x=x;r.anchor.z=z;
 }
 remove(id:number){
  const r=this.records.get(id);if(!r)return;
  if(!r.settled)for(const p of r.parts)this.world!.removeRigidBody(p.body);
  for(const p of r.poses){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.rotation);p.bone.scale.copy(p.scale);p.bone.matrixAutoUpdate=p.auto;p.bone.updateMatrix();}
  r.model.root.position.copy(r.rootPosition);r.model.root.updateMatrixWorld(true);this.records.delete(id);
 }
 inspect(id:number){return this.records.get(id)?.parts.map(p=>({name:p.bone.name,position:{...p.body.translation()},rotation:{...p.body.rotation()},sleeping:p.body.isSleeping()}));}
 maxJointError(id:number){
  let error=0;for(const j of this.records.get(id)?.joints??[]){const a=j.body1(),b=j.body2(),qa=a.rotation(),qb=b.rotation();const va=new T.Vector3().copy(j.anchor1()).applyQuaternion(new T.Quaternion(qa.x,qa.y,qa.z,qa.w)).add(a.translation());const vb=new T.Vector3().copy(j.anchor2()).applyQuaternion(new T.Quaternion(qb.x,qb.y,qb.z,qb.w)).add(b.translation());error=Math.max(error,va.distanceTo(vb));}return error;
 }
 snapshot(){let active=0,falling=0,bodies=0,joints=0;for(const r of this.records.values()){if(!r.settled)active++;if(r.falling)falling++;bodies+=r.parts.length;joints+=r.joints.length;}return{active,falling,bodies,joints,settled:this.records.size-active-falling,budget:RAGDOLL_BUDGET[this.tier],collisionGroups:GROUPS,staticColliders:(this.world?.colliders.len()??0)-bodies,stepMs:this.elapsedMs,steps:this.steps,overflow:this.overflow};}
 dispose(){for(const id of this.records.keys())this.remove(id);this.world?.free();this.world=undefined;this.statics=[];this.accumulator=0;this.elapsedMs=0;}
}
