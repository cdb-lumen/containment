import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
import {wallContact} from '../src/game/world/wallContact';
import {createExpeditionGeometry} from '../src/game/world/expeditionGeometry';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {DepthGame} from '../src/DepthGame';
import {DepthRenderer} from '../src/render/DepthRenderer';

// Build the renderer's real panels without constructing WebGL or loading textures.
function panel(height=1.1,rotation=0){
 const world=new T.Group(),material=new T.MeshStandardMaterial();
 const build=DepthRenderer.prototype as unknown as {wallPanel:(x:number,z:number,h:number,length:number,rotation:number)=>void};
 build.wallPanel.call({world,surfaces:{wall:material,cover:material,uv:()=>{}}},0,0,height,2,rotation);
 return world;
}
function strikeWorld(){const world=panel(1.4,-Math.PI/2);world.position.set(100/32,0,100/32);return world;}
function decal(scene:T.Scene){
 const mesh=scene.children[3] as T.InstancedMesh,m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();
 mesh.getMatrixAt(0,m);m.decompose(p,q,s);return {p,normal:new T.Vector3(0,0,1).applyQuaternion(q)};
}
import type {GameEffect} from '../src/DepthGame';
const hit=(i=0,shotId='shot-1'):GameEffect=>({type:'hit',weapon:'shotgun',x:100,y:100+i*2,angle:0,shotId,wall:{x:-1,y:0}} as GameEffect);
describe('shotgun metal wall strikes',()=>{
 it('anchors to the rendered cover at .25, not the collision plane inside the panel',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene,undefined,panel(1.4));
  fx.event({...hit(),x:0,y:0,wall:{x:0,y:1}});fx.update(.001,new T.PerspectiveCamera(),[]);
  expect(fx.counts.decals).toBe(1);expect(decal(scene).p.z).toBeCloseTo(.268);expect(decal(scene).normal.z).toBeCloseTo(1);
 });
 it('uses the actual transformed face normal for oblique corner contacts',()=>{
  const scene=new T.Scene(),rotation=.6,world=panel(1.4,rotation),fx=new AttackEffects(scene,undefined,world);
  const approach=new T.Vector3(.3,0,.954).normalize().applyAxisAngle(new T.Vector3(0,1,0),rotation);
  fx.event({...hit(),x:0,y:0,wall:{x:approach.x,y:approach.z}});fx.update(.001,new T.PerspectiveCamera(),[]);
  const d=decal(scene),normal=new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(0,1,0),rotation);
  expect(fx.counts.decals).toBe(1);expect(d.normal.distanceTo(normal)).toBeLessThan(.00001);expect(d.p.dot(normal)).toBeCloseTo(.268);
 });
 it('never creates floating marks over low parapets, void rims, or missing nearby surfaces',()=>{
  for(const world of [panel(.4),new T.Group(),panel()]){
   if(world.children.length&&world.children[0].position.y>.4)world.position.z=-4;
   const fx=new AttackEffects(new T.Scene(),undefined,world);fx.event({...hit(),x:0,y:0,wall:{x:0,y:1}});
   expect(fx.counts.decals).toBe(0);expect(fx.counts.fire).toBe(0);expect(fx.counts.pulses).toBe(0);expect(fx.counts.glow).toBeLessThanOrEqual(4);
  }
 });
 it('omits marks whose footprint would hang beyond a rendered face edge',()=>{
  const random=vi.spyOn(Math,'random').mockReturnValue(.5);
  try{
   const world=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(2,.82,.5),new T.MeshStandardMaterial());mesh.position.y=.41;world.add(mesh);
   const fx=new AttackEffects(new T.Scene(),undefined,world);fx.event({...hit(),x:0,y:0,wall:{x:0,y:1}});
   expect(fx.counts.decals).toBe(0);expect(fx.counts.glow).toBe(4);
  }finally{random.mockRestore();}
 });
 it('emits shared shot identity and wall contact through real projectile collision',()=>{
  const events:GameEffect[]=[],g=new DepthGame(e=>events.push(e));g.newRun(1729);g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);g.switchWeapon('shotgun');
  Object.assign(g.player,{x:1040,y:g.geometry.bounds.height/2});
  g.update(10,{x:0,y:0,fire:true,angle:0,autoAim:false});for(let i=0;i<10;i++)g.update(20,{x:0,y:0,fire:false,angle:0,autoAim:false});
  const hits=events.filter(e=>e.type==='hit'&&e.weapon==='shotgun');expect(hits).toHaveLength(8);
  expect(new Set(hits.map(e=>e.shotId)).size).toBe(1);expect(hits[0].shotId).toBeTruthy();
  for(const h of hits){expect(h.wall).toEqual({x:-1,y:0});expect(h.x).toBeCloseTo(1160);expect(h.targetId).toBeUndefined();}
 });
 it('separates different shots, distant hits and different planes without stacking nearby arrivals',()=>{
  const fx=new AttackEffects(new T.Scene()),camera=new T.PerspectiveCamera();fx.event(hit());fx.update(.02,camera,[]);fx.event(hit(1));expect(fx.counts.smoke).toBe(1);
  fx.event(hit(1,'shot-2'));fx.event({...hit(),x:500});fx.event({...hit(),wall:{x:0,y:1}});fx.event({...hit(),x:110});expect(fx.counts.smoke).toBe(5);
 });
 it('resolves exact front and oblique wall planes and polygon voids',()=>{
  const g=createExpeditionGeometry(new DepthGame().node);
  const rect={...g,boundary:undefined,voids:[],bounds:{x:0,y:0,width:500,height:500},blockers:[]};
  for(const next of [{x:-3,y:200},{x:-3,y:206}]){
   const c=wallContact(rect,{x:5,y:200},next,2);expect(c.x).toBeCloseTo(0);expect(c.normal.x).toBeCloseTo(1);expect(c.normal.y).toBeCloseTo(0);
  }
  const triangle=[{x:100,y:100},{x:200,y:200},{x:100,y:300}];
  const c=wallContact({...rect,voids:[triangle]},{x:154,y:145},{x:150,y:153},2);
  expect(c.normal.x).toBeCloseTo(Math.SQRT1_2);expect(c.normal.y).toBeCloseTo(-Math.SQRT1_2);
 });
 it('uses wall normals for outward sparks, chips and vertical decal matrices',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene,undefined,strikeWorld()),camera=new T.PerspectiveCamera();fx.event(hit());fx.update(.001,camera,[]);
  const meshes=scene.children as T.InstancedMesh[],m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();
  for(const index of [0,2])for(let i=0;i<meshes[index].count;i++){meshes[index].getMatrixAt(i,m);m.decompose(p,q,s);expect(p.x).toBeLessThan(100/32);expect(s.x).toBeLessThanOrEqual(.12);}
  const before=meshes[2].count?new T.Matrix4():m;meshes[2].getMatrixAt(0,before);const x=before.elements[12];fx.update(.03,camera,[]);meshes[2].getMatrixAt(0,m);expect(m.elements[12]).toBeLessThan(x);
  meshes[0].getMatrixAt(1,m);expect(m.elements[12]).toBeLessThan(100/32-.04);
  meshes[3].getMatrixAt(0,m);m.decompose(p,q,s);const normal=new T.Vector3(0,0,1).applyQuaternion(q);expect(normal.x).toBeCloseTo(-1);expect(normal.y).toBeCloseTo(0);
 });
 it('keeps eight pinpricks but shares nearby dust and never creates blast layers',()=>{
  const fx=new AttackEffects(new T.Scene(),undefined,strikeWorld());for(let i=0;i<8;i++)fx.event(hit(i));
  expect(fx.counts).toEqual({fire:0,glow:32,smoke:1,debris:16,decals:8,pulses:0});
 });
 it('does not reinterpret enemy hits or other weapons',()=>{
  const fx=new AttackEffects(new T.Scene());fx.event({type:'hit',weapon:'shotgun',x:100,y:100,targetId:1});expect(fx.counts.decals).toBe(0);
  fx.clear();fx.event({...hit(),weapon:'rifle'});expect(fx.counts.decals).toBe(0);
 });
 it('expires transient strikes and marks and stays bounded under saturation',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene,undefined,strikeWorld()),camera=new T.PerspectiveCamera();
  for(let i=0;i<500;i++)fx.event(hit(i%8,`shot-${i}`));
  expect(fx.counts.decals).toBe(EFFECT_LIMITS.decals);
  for(const [key,count] of Object.entries(fx.counts))expect(count).toBeLessThanOrEqual(EFFECT_LIMITS[key as keyof typeof EFFECT_LIMITS]);
  fx.update(1.3,camera,[]);expect(fx.counts).toEqual({fire:0,glow:0,smoke:0,debris:0,decals:0,pulses:0});
  fx.clear();fx.event(hit());expect(fx.counts.smoke).toBe(1);
 });
});
