import {describe,it,expect,beforeAll} from 'vitest';
import * as T from 'three';
import {marine,alien,collapseCorpse,disposeModel} from '../src/render/models';
import {weaponModel,WEAPON_APPEARANCE} from '../src/render/weapons';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
import type {WeaponId} from '../src/game/combat/types';
import {loadModels} from './loadModels';
beforeAll(loadModels);
const ids:WeaponId[]=['pistol','rifle','shotgun','plasma','rocket'];
function meshCount(root:T.Object3D){let n=0;root.traverseVisible(o=>{if(o instanceof T.Mesh)n++;});return n;}
describe('model and attack presentation',()=>{
 it('equips five distinct silhouettes with a barrel socket that follows aim',()=>{
  const marineModel=marine(),sizes:string[]=[];
  for(const id of ids){const gun=weaponModel(id);const size=new T.Box3().setFromObject(gun.root).getSize(new T.Vector3());sizes.push(size.toArray().map(n=>n.toFixed(3)).join());expect(gun.muzzle.position.z).toBeGreaterThan(.4);disposeModel(gun.root);marineModel.equip!(id);expect(marineModel.weapon!.children.filter(c=>c.visible)).toHaveLength(1);}
  expect(new Set(sizes).size).toBe(5);marineModel.animate(1,0,0);const right=marineModel.muzzleWorld!(new T.Vector3());marineModel.animate(1,0,Math.PI/2);const down=marineModel.muzzleWorld!(new T.Vector3());expect(right.x).toBeGreaterThan(.7);expect(down.z).toBeGreaterThan(.7);expect(right.length()).toBeCloseTo(down.length());
 });
 it('freezes a corpse pose without changing its silhouette and reduces render batches',()=>{
  const model=alien('brute',true);model.root.position.set(15,0,8);model.animate(1,.8,.4);model.root.updateMatrixWorld(true);const before=new T.Box3().setFromObject(model.root,true),draws=meshCount(model.root);collapseCorpse(model);const after=new T.Box3().setFromObject(model.root,true);expect(after.min.distanceTo(before.min)).toBeLessThan(.00001);expect(after.max.distanceTo(before.max)).toBeLessThan(.00001);expect(meshCount(model.root)).toBeLessThanOrEqual(draws);expect(meshCount(model.root)).toBeLessThanOrEqual(8);
 });
 it('has distinct species dimensions and keeps living meshes within a draw budget',()=>{
  const dimensions=[];for(const kind of ['crawler','brute','spitter','carrier','stalker','queen']){const a=alien(kind);a.animate(1,0,0);dimensions.push(new T.Box3().setFromObject(a.root).getSize(new T.Vector3()).toArray().map(n=>n.toFixed(2)).join());expect(meshCount(a.root)).toBeLessThanOrEqual(46);a.root.traverse(o=>{if(o instanceof T.Mesh){const normal=o.geometry.getAttribute('normal');expect(Array.from(normal.array).every(Number.isFinite)).toBe(true);}});}expect(new Set(dimensions).size).toBe(6);
 });
 it('caps particles during sustained combat, freezes on pause and clears on room changes',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
  for(let i=0;i<70;i++){fx.shot(new T.Vector3(4,1,5),.2,'shotgun');fx.event({type:'explosion',x:128,y:160,radius:120});fx.event({type:'corpse',x:128,y:160});}
  for(const [key,value]of Object.entries(fx.counts))expect(value).toBeLessThanOrEqual(EFFECT_LIMITS[key as keyof typeof fx.counts]);const before=fx.counts;fx.update(0,camera,[]);expect(fx.counts).toEqual(before);fx.update(.04,camera,[]);
  scene.traverse(o=>{if(o instanceof T.InstancedMesh){expect(o.count).toBeLessThanOrEqual(o.instanceMatrix.count);expect(o.instanceColor).not.toBeNull();expect(o.geometry.getAttribute('effectAlpha').count).toBe(o.instanceMatrix.count);}});
  fx.clear();expect(Object.values(fx.counts).every(n=>n===0)).toBe(true);fx.dispose();expect(scene.children).toHaveLength(0);
 });
});
