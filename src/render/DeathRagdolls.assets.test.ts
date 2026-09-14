import {beforeAll,it,expect} from 'vitest';
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
