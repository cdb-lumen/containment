import {beforeAll,describe,it,expect} from 'vitest';
import * as T from 'three';
import {DeathRagdolls,initDeathPhysics} from './DeathRagdolls';
import type {ActorModel} from './models';
const room={width:640,height:640,obstacles:[],boundary:undefined,voids:undefined};
function actor(x=5,y=2,z=5,brute=false):ActorModel {
 const root=new T.Group(),body=new T.Group(),chest=new T.Bone();chest.name='chest';root.add(body);body.add(chest);root.position.set(x,y,z);
 for(const side of [-1,1]){const upper=new T.Bone(),lower=new T.Bone();upper.name=brute?`leg.front.${side<0?'r':'l'}`:`leg${side<0?0:1}_upper`;lower.name=brute?`foot.front.${side<0?'r':'l'}`:`leg${side<0?0:1}_lower`;upper.position.set(side*.3,0,0);lower.position.set(side*.5,-.3,0);chest.add(upper);upper.add(lower);}
 root.updateMatrixWorld(true);return{root,body,height:1,limbs:[],animate(){},freeze(){}};
}
beforeAll(initDeathPhysics);
describe('death-only articulated physics',()=>{
 it('preserves live bodies on static refresh and supports the rendered table top',()=>{
  const w=new T.Group(),table=new T.Mesh(new T.BoxGeometry(8,2.4,8));table.position.set(5,1.2,5);w.add(table);
  const p=new DeathRagdolls();p.setRoom(room,w);p.add(1,actor(5,4,5),'crawler',{x:0,z:0});const before=p.inspect(1);p.refreshStatic(w);expect(p.inspect(1)).toEqual(before);
  for(let i=0;i<120;i++)p.update(1/60);expect(p.position(1)!.y).toBeGreaterThan(2.2);p.dispose();
 });
 it('keeps concave proxy floor holes open and downgraded airborne corpses falling',()=>{
  const p=new DeathRagdolls();p.setRoom({...room,voids:[[{x:64,y:64},{x:288,y:64},{x:288,y:288},{x:192,y:288},{x:192,y:192},{x:64,y:192}]]});
  for(let i=0;i<6;i++)p.add(i,actor(4,10,4),'crawler',{x:0,z:0});p.setQuality('low');const y=p.position(0)!.y;
  for(let i=0;i<120;i++)p.update(1/60);expect(p.position(0)!.y).toBeLessThan(y-5);expect(p.position(3)!.y).toBeLessThan(0);p.update(0);expect(p.snapshot().stepMs).toBe(0);p.dispose();
 });
 it('uses connected rigid bodies, killing direction, gravity and independent limb rotations',()=>{
  const p=new DeathRagdolls();p.setRoom(room);const m=actor();expect(p.snapshot().bodies).toBe(0);
  expect(p.add(1,m,'crawler',{x:6,z:0})).toBe(true);expect(p.snapshot().joints).toBe(4);
  const initial=p.inspect(1)!;for(let i=0;i<30;i++)p.update(1/60);
  const after=p.inspect(1)!;expect(after[0].position.x).toBeGreaterThan(initial[0].position.x+.3);
  expect(after[0].position.y).toBeLessThan(initial[0].position.y+.4);
  expect(after.some((b,i)=>Math.abs(b.rotation.x-after[0].rotation.x)+Math.abs(b.rotation.z-after[0].rotation.z)>.03&&i>0)).toBe(true);
  expect(p.maxJointError(1)).toBeLessThan(.15);p.dispose();
 });
 it('throws a heavy brute less for the same shot and preserves zero-delta pause',()=>{
  const p=new DeathRagdolls();p.setRoom(room);p.add(1,actor(),'crawler',{x:8,z:0});p.add(2,actor(5,2,8,true),'brute',{x:8,z:0});
  const initial=p.inspect(1);p.update(0);expect(p.inspect(1)).toEqual(initial);
  for(let i=0;i<20;i++)p.update(1/60);
  expect(p.inspect(1)![0].position.x).toBeGreaterThan(p.inspect(2)![0].position.x+.4);p.dispose();
 });
 it('bounds admission by High/Low, ignores corpse collisions and frees ownership on removal/reset',()=>{
  const p=new DeathRagdolls();p.setRoom(room);p.setQuality('low');
  for(let i=0;i<3;i++)expect(p.add(i,actor(),'crawler',{x:1,z:0})).toBe(true);
  expect(p.add(99,actor(),'crawler',{x:1,z:0})).toBe(false);expect(p.snapshot().bodies).toBe(15);
  expect(p.snapshot().collisionGroups).toBe(0x00020001);p.remove(1);expect(p.snapshot().active).toBe(2);
  p.setRoom(room);expect(p.snapshot().bodies).toBe(0);expect(p.snapshot().joints).toBe(0);p.dispose();
 });
 it('collides with rendered furniture sides and floor, then retires simulation',()=>{
  const world=new T.Group();const floor=new T.Mesh(new T.BoxGeometry(20,.2,20));floor.position.set(10,-.1,10);world.add(floor);const table=new T.Mesh(new T.BoxGeometry(1,3,20));table.position.set(7.5,1.5,10);world.add(table);const p=new DeathRagdolls();p.setRoom(room,world);
  expect(p.add(1,actor(5,.8,5),'crawler',{x:12,z:0})).toBe(true);
  for(let i=0;i<180;i++){p.update(1/60);const bodies=p.inspect(1);if(bodies?.length){expect(bodies[0].position.x).toBeLessThan(7.2);expect(bodies.every(b=>b.position.y>-.25)).toBe(true);}}
  for(let i=0;i<300;i++)p.update(1/60);expect(p.snapshot().active).toBe(0);expect(p.snapshot().bodies).toBe(0);p.dispose();
 });
 it('sync-corpse translates every articulated piece without losing pose and restores pooled bones',()=>{
  const p=new DeathRagdolls();p.setRoom(room);const m=actor(),before=m.root.getObjectByName('leg0_upper')!.quaternion.clone();p.add(1,m,'crawler',{x:5,z:0});
  for(let i=0;i<12;i++)p.update(1/60);const old=p.inspect(1)!;p.sync(1,10,11);const moved=p.inspect(1)!;
  expect(moved[0].position.x).toBeCloseTo(10);expect(moved[0].position.z).toBeCloseTo(11);
  for(let i=1;i<moved.length;i++)expect(moved[i].position.x-moved[0].position.x).toBeCloseTo(old[i].position.x-old[0].position.x);
  p.remove(1);expect(m.root.getObjectByName('leg0_upper')!.quaternion.equals(before)).toBe(true);p.dispose();
 });
});
