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
it('two real brute rigs retain separate fitted skin and pooled poses',()=>{
 const p=new DeathRagdolls(),world=new T.Group(),floor=new T.Mesh(new T.BoxGeometry(20,.32,20));
 floor.position.set(10,-.18,10);world.add(floor);p.setRoom({width:640,height:640,obstacles:[]},world);
 const a=alien('brute'),b=alien('brute',true);
 a.root.position.set(5,0,5);b.root.position.set(10,0,10);
 a.animate(1,1,.4);b.animate(1,1,1.2);freezeCorpse(a);freezeCorpse(b);
 const bones=(m:typeof a)=>{const result:T.Bone[]=[];m.root.traverse(o=>{if(o instanceof T.Bone)result.push(o);});return result;};
 const ab=bones(a),bb=bones(b),initial=ab.map(o=>o.matrix.toArray());
 expect(ab.every(o=>!bb.includes(o))).toBe(true);
 try{
  expect(p.add(1,a,'brute',{x:8,z:2})).toBe(true);expect(p.add(2,b,'brute',{x:-4,z:3})).toBe(true);
  for(let i=0;i<180;i++){p.update(1/60);expect(p.maxJointError(1)).toBeLessThan(.2);expect(p.maxJointError(2)).toBeLessThan(.2);}
  for(const model of [a,b]){model.root.updateMatrixWorld(true);expect(new T.Box3().setFromObject(model.root,true).min.y).toBeGreaterThanOrEqual(-.025);}
  const other=bb.map(o=>o.matrix.toArray());p.remove(1);
  expect(ab.map(o=>o.matrix.toArray())).toEqual(initial);expect(bb.map(o=>o.matrix.toArray())).toEqual(other);expect(p.has(2)).toBe(true);
 }finally{p.dispose();floor.geometry.dispose();}
});
for(const family of ['crawler','stalker','spitter','carrier','brute'])for(const elite of [false,true])it(`${family} elite=${elite}: actual blended skin stays above the deck during active contact`,()=>{
 const p=new DeathRagdolls(),world=new T.Group(),floor=new T.Mesh(new T.BoxGeometry(20,.32,20));
 floor.position.set(10,-.18,10);world.add(floor);p.setRoom({width:640,height:640,obstacles:[]},world);
 const m=alien(family,elite);m.root.position.set(5,0,5);m.animate(1,1,.4);freezeCorpse(m);
 expect(p.add(1,m,family,{x:8,z:2})).toBe(true);
 const root=m.root.position.clone();
 try{
  for(let frame=0;frame<180;frame++){
   p.update(1/60);expect(p.maxJointError(1)).toBeLessThan(.2);
   if(frame%5!==4)continue;
   m.root.updateMatrixWorld(true);let minY=Infinity;
   m.root.traverse(o=>{if(o instanceof T.SkinnedMesh)for(let k=0;k<o.geometry.getAttribute('position').count;k++)minY=Math.min(minY,o.getVertexPosition(k,new T.Vector3()).applyMatrix4(o.matrixWorld).y);});
   expect(minY,`frame ${frame+1}`).toBeGreaterThanOrEqual(-.025);
  }
  expect(m.root.position.distanceTo(root)).toBeLessThan(1e-8);
 }finally{p.dispose();floor.geometry.dispose();}
});
