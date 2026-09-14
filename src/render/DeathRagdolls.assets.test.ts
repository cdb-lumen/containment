import {beforeAll,it,expect,vi} from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {registerAsset,type AssetName} from './assets';
import {alien,freezeCorpse} from './models';
import {DeathRagdolls,initDeathPhysics} from './DeathRagdolls';
beforeAll(async()=>{
 await initDeathPhysics();
 for(const name of ['dretch','basilisk','marauder','dragoon','tyrant'] as AssetName[]){
  const bytes=readFileSync(`public/assets/models/${name}.glb`),loader=new GLTFLoader();
  loader.register(()=>({name:'cpu-texture-stub',loadTexture:async()=>new T.Texture()}));
  registerAsset(name,await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''));
 }
});
it('benchmarks two retired GLB corpses against 120 statics without per-frame skin scans',()=>{
 const p=new DeathRagdolls(),world=new T.Group();
 for(let i=0;i<120;i++){const mesh=new T.Mesh(new T.BoxGeometry(2,.2,2));mesh.position.set(i%12*3,-.1,Math.floor(i/12)*3);world.add(mesh);}
 p.setRoom({width:1200,height:1200,obstacles:[]},world);
 for(let i=0;i<5;i++){const m=alien(i===0?'brute':'crawler');m.root.position.set(5,1000,5);freezeCorpse(m);expect(p.add(i,m,i===0?'brute':'crawler',{x:0,z:0})).toBe(true);}
 p.setQuality('low');for(let i=2;i<5;i++)p.remove(i);
 const vertices=vi.spyOn(T.SkinnedMesh.prototype,'getVertexPosition'),rays=vi.spyOn(RAPIER.World.prototype,'castRay'),samples:number[]=[];
 try{
  for(let i=0;i<360;i++){p.update(1/60);samples.push(p.snapshot().stepMs);}
  expect(vertices.mock.calls.length).toBe(0);expect(rays.mock.calls.length).toBe(720);
  expect(p.snapshot()).toMatchObject({active:0,falling:2,settled:0,staticColliders:120,steps:0});
  samples.sort((a,b)=>a-b);console.info('retired GLB CPU benchmark',JSON.stringify({frames:samples.length,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95Ms:samples[Math.ceil(samples.length*.95)-1],maxMs:samples.at(-1)}));
 }finally{vertices.mockRestore();rays.mockRestore();p.dispose();world.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});}
});
for(const family of ['crawler','stalker','spitter','carrier','brute'])it(`${family}: retirement recovers the rendered deck top, not its underside`,()=>{
 const p=new DeathRagdolls(),world=new T.Group(),floor=new T.Mesh(new T.BoxGeometry(20,.32,20));floor.position.set(10,-.18,10);world.add(floor);p.setRoom({width:640,height:640,obstacles:[]},world);
 const m=alien(family);m.root.position.set(5,0,5);m.animate(1,1,.4);freezeCorpse(m);p.add(1,m,family,{x:8,z:2});
 for(let i=0;i<600;i++)p.update(1/60);
 expect(new T.Box3().setFromObject(m.root,true).min.y).toBeCloseTo(-.02,2);expect(p.snapshot().falling).toBe(0);p.dispose();floor.geometry.dispose();
});
for(const family of ['crawler','stalker','spitter','carrier','brute'])it(`${family}: actual GLB skin remains jointed and finite, then returns to the living pool pose`,()=>{
 const p=new DeathRagdolls();p.setRoom({width:640,height:640,obstacles:[]});const m=alien(family);m.root.position.set(5,.5,5);m.root.rotation.y=.73;m.root.scale.setScalar(1.2);m.animate(1,1,.4);m.root.updateMatrixWorld(true);
 const before=new T.Box3().setFromObject(m.root,true),bones:T.Bone[]=[];m.root.traverse(o=>{if(o instanceof T.Bone)bones.push(o);});const initial=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
 freezeCorpse(m);expect(p.add(1,m,family,{x:8,z:2})).toBe(true);expect(p.snapshot().bodies).toBeGreaterThanOrEqual(13);expect(p.snapshot().bodies).toBeLessThanOrEqual(20);
 const skin:T.SkinnedMesh[]=[];m.root.traverse(o=>{if(o instanceof T.SkinnedMesh)skin.push(o);});
 const vertices=skin.map(s=>s.getVertexPosition(0,new T.Vector3()).applyMatrix4(s.matrixWorld));p.update(1/120);m.root.updateMatrixWorld(true);
 skin.forEach((s,i)=>expect(s.getVertexPosition(0,new T.Vector3()).applyMatrix4(s.matrixWorld).distanceTo(vertices[i])).toBeLessThan(.3));
 for(let i=0;i<120;i++){p.update(1/60);expect(p.maxJointError(1)).toBeLessThan(.2);}
 m.root.updateMatrixWorld(true);const after=new T.Box3().setFromObject(m.root,true);expect(after.isEmpty()).toBe(false);expect(after.getSize(new T.Vector3()).length()).toBeLessThan(before.getSize(new T.Vector3()).length()*2);
 expect(bones.some((b,i)=>b.quaternion.angleTo(initial[i].q)>.1)).toBe(true);
 p.remove(1);bones.forEach((b,i)=>{expect(b.position.distanceTo(initial[i].p)).toBeLessThan(1e-8);expect(b.quaternion.toArray()).toEqual(initial[i].q.toArray());});m.reset?.();expect(bones.every(b=>b.matrixAutoUpdate)).toBe(true);p.dispose();
});
