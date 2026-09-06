import {beforeAll,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mapSurfaceUV} from '../src/render/EnvironmentMaterials';
import {marine,alien,freezeCorpse,disposeModel} from '../src/render/models';
import {WEAPON_FIT,weaponModel} from '../src/render/weapons';
import {loadModels} from './loadModels';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {MutationRuntime,type MutationTarget} from '../src/game/roguelike/MutationRuntime';
import {MUTATION_IDS} from '../src/game/roguelike/mutationCatalog';
import {isValidBuildState} from '../src/game/roguelike/builds';
import type {MutationId} from '../src/game/roguelike/types';
import type {WeaponId} from '../src/game/combat/types';
beforeAll(loadModels);
function world(ids:MutationId[],visible=true){
 const combat=new CombatSystem();combat.setBuild({mutations:ids});const targets:Array<MutationTarget&{health:number}>=[{id:1,x:30,y:0,radius:14,health:1000,maxHealth:1000},{id:2,x:90,y:0,radius:14,health:1000,maxHealth:1000}];
 const hits:Array<{id:number;amount:number}>=[],effects:string[]=[],slows=new Map<number,number>();
 const runtime=new MutationRuntime(combat,{player:()=>({x:0,y:0}),targets:()=>targets.filter(t=>t.health>0),damage:(id,amount)=>{const t=targets.find(t=>t.id===id)!;if(t.health<=0)return{applied:false,died:false};hits.push({id,amount});t.health-=amount;return{applied:true,died:t.health<=0};},move:()=>({blocked:false}),moveCorpse:t=>({...t,blocked:false}),setSlow:(id,n)=>slows.set(id,n),canAffect:()=>visible,boonEffect:k=>effects.push(k)});
 const hit=(id='shot',target=targets[0],weapon:WeaponId='rifle',primed=false)=>runtime.hit(id,weapon,{...target},{x:1,y:0},primed);
 const advance=(ms:number)=>{for(let n=0;n<ms;n+=50)runtime.update(Math.min(50,ms-n));};
 return{combat,targets,hits,effects,slows,runtime,hit,advance};
}
describe('elemental expansion and supply economy',()=>{
 it('supports 48 unique boons',()=>{expect(MUTATION_IDS).toHaveLength(48);expect(new Set(MUTATION_IDS).size).toBe(48);expect(isValidBuildState({mutations:MUTATION_IDS})).toBe(true);});
 it('refreshes poison without stacking, and secondary poison kills spread within cover limits',()=>{
  const w=world(['caustic-rounds']);w.hit();w.hit('second');w.advance(3000);expect(w.hits.reduce((sum,h)=>sum+h.amount,0)).toBe(30);expect(w.runtime.statuses(1).poisoned).toBe(false);
  const bloom=world(['caustic-rounds','toxic-bloom']);bloom.targets[0].health=5;bloom.hit();bloom.advance(500);expect(bloom.runtime.statuses(2).poisoned).toBe(true);bloom.advance(3000);expect(bloom.targets[1].health).toBe(970);
  const blocked=world(['caustic-rounds','toxic-bloom'],false);blocked.targets[0].health=5;blocked.hit();blocked.advance(500);expect(blocked.runtime.statuses(2).poisoned).toBe(false);
 });
 it('requires existing ingredients for thermal and combustion reactions, and consumes the correct statuses',()=>{
  const w=world(['cryogenic','incendiary','thermal-shock']);w.hit('a');expect(w.hits).toHaveLength(0);w.hit('b');expect(w.effects).toContain('shatter');expect(w.runtime.statuses(1)).toMatchObject({chilled:false,burning:false});w.advance(50);expect(w.slows.get(1)).toBe(1);
  const fire=world(['incendiary','caustic-rounds','combustion']);fire.hit('a');fire.hit('b');expect(fire.runtime.statuses(1)).toMatchObject({burning:false,poisoned:true});expect(fire.hits.filter(h=>h.amount===26)).toHaveLength(2);
 });
 it('roots briefly, restores the stronger remaining slow and preserves three stacks on reload',()=>{
  const w=world(['cryogenic','absolute-zero','cold-snap']);w.hit('a');w.hit('b');w.hit('c');w.advance(50);expect(w.slows.get(1)).toBe(0);w.runtime.completedReload({x:0,y:0});w.advance(50);expect(w.slows.get(1)).toBe(0);w.advance(350);expect(w.slows.get(1)).toBeCloseTo(.5);w.advance(2500);expect(w.slows.get(1)).toBe(1);
 });
 it('detonates delayed charges after the original target dies, once per shot and behind no walls',()=>{
  const w=world(['aftershock']);w.hit();w.hit();w.targets[0].health=0;w.runtime.kill({...w.targets[0]},'direct',{chainId:'shot',depth:0});w.advance(450);expect(w.hits).toEqual([{id:2,amount:18}]);
  const blocked=world(['aftershock'],false);blocked.hit();blocked.advance(500);expect(blocked.hits).toHaveLength(0);
 });
 it('connects reload, healing, primed shots and armor-break defense to real effects',()=>{
  const w=world(['combat-medic','blood-capacitor','reactive-barrier','shock-absorber']);w.combat.restoreRunResources({...w.combat.getRunResources(),health:50,armor:0});w.runtime.completedReload({x:0,y:0});expect(w.combat.snapshot.health).toBe(52);w.hit();expect(w.hits).toContainEqual({id:1,amount:24});w.runtime.hurt(10,0,{x:0,y:0});w.advance(50);expect(w.slows.get(1)).toBe(0);expect(w.hits.filter(h=>h.amount===20)).toHaveLength(2);
  const cascade=world(['hot-reload','reactor-cascade']);cascade.hit('primed',cascade.targets[0],'shotgun',true);cascade.targets[0].health=0;cascade.runtime.kill({...cascade.targets[0]},'direct',{chainId:'primed',depth:0});expect(cascade.hits).toContainEqual({id:2,amount:36});
 });
 it('runs dry under sustained fire without drops, including Rapid Cycle',()=>{
  for(const weapon of ['rifle','shotgun','plasma','rocket'] as const)for(const fast of [false,true]){const c=new CombatSystem();if(fast)c.setBuild({mutations:['rapid-cycle']});c.switchWeapon(weapon);c.replenishReserves();let fired=0,ranDry=false;
   for(let ms=0;ms<180000;ms+=50){c.regenerateReserves(50);c.update(50);fired+=c.fire(0).length;c.reloadIfEmpty();if(c.snapshot.magazine+c.snapshot.reserve===0)ranDry=true;}expect(ranDry,`${weapon} fast=${fast}`).toBe(true);expect(fired).toBeGreaterThan(10);
  }
 });
 it('links the third arc to a delayed blast and expires frost fields without permanent slows',()=>{
  const w=world(['arc-filament','ball-lightning']);for(let i=0;i<12;i++)w.hit(`arc-${i}`);expect(w.effects).toContain('charge');expect(w.hits.filter(h=>h.amount===22)).toHaveLength(0);w.advance(500);expect(w.hits.filter(h=>h.amount===22)).toHaveLength(2);
  const frost=world(['cryogenic','glacial-wake']);frost.hit();frost.targets[0].health=0;frost.runtime.kill({...frost.targets[0]},'direct',{chainId:'shot',depth:0});frost.advance(50);expect(frost.slows.get(2)).toBe(.75);frost.advance(2000);expect(frost.slows.get(2)).toBe(1);
 });
 it('regenerates reserves without filling magazines, granting pickup boons or cancelling reload',()=>{
  const c=new CombatSystem();c.switchWeapon('shotgun');c.setBuild({mutations:['magnetic-feed']});const r=c.getRunResources();c.restoreRunResources({...r,ammo:{...r.ammo,shotgun:{magazine:2,reserve:0},rifle:{magazine:30,reserve:0}}});
  c.regenerateReserves(3000);expect(c.snapshot.magazine).toBe(2);expect(c.snapshot.reserve).toBe(1);c.startReload();c.regenerateReserves(1000);expect(c.snapshot.reloading).toBe(true);expect(c.snapshot.magazine).toBe(2);
  c.replenishReserves();expect(c.snapshot.reserve).toBe(21);expect(c.snapshot.reloading).toBe(true);c.collectAmmoPack();expect(c.getRunResources().ammo.rocket.reserve).toBe(5);expect(c.getRunResources().ammo.rifle.reserve).toBe(100);
 });
});
describe('map geometry and actor frame-time fixes',()=>{
 it('keeps every rounded wall and cover UV triangle nondegenerate',()=>{
  for(const [w,h,d]of [[2,2.6,.32],[5,1.05,3]]){const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,1,.045));mapSurfaceUV(mesh);const uv=mesh.geometry.getAttribute('uv');for(let i=0;i<uv.count;i+=3){const area=(uv.getX(i+1)-uv.getX(i))*(uv.getY(i+2)-uv.getY(i))-(uv.getY(i+1)-uv.getY(i))*(uv.getX(i+2)-uv.getX(i));expect(Math.abs(area)).toBeGreaterThan(1e-9);}mesh.geometry.dispose();}
 });
 it('freezes the original skinned corpse without cloning/skinning/rebuilding geometry on death',()=>{
  const model=alien('carrier');model.animate(0,1,.4);model.animate(.05,1,.4);const meshes:T.Mesh[]=[];model.root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});const geometries=meshes.map(m=>m.geometry);const spies=meshes.filter((m):m is T.SkinnedMesh=>m instanceof T.SkinnedMesh).map(m=>vi.spyOn(m,'applyBoneTransform'));freezeCorpse(model);expect(meshes.map(m=>m.geometry)).toEqual(geometries);for(const spy of spies){expect(spy).not.toHaveBeenCalled();spy.mockRestore();}disposeModel(model.root);
 });
 it('keeps every gun attached to the authored hand socket during reload, recoil and directional gait',()=>{
  for(const id of Object.keys(WEAPON_FIT) as WeaponId[]){const m=marine();m.equip!(id);m.animate(0,0,0);m.root.updateMatrixWorld(true);const forward=new T.Vector3(0,0,1).applyQuaternion(m.weapon!.getWorldQuaternion(new T.Quaternion()));expect(Math.abs(Math.atan2(forward.z,forward.x)),id).toBeLessThan(.01);for(let i=0;i<30;i++){m.animate(i/60,1,.4,.8,.5,{x:0,y:220});m.root.updateMatrixWorld(true);const socket=m.root.getObjectByName('tag_weapon')!;expect(socket.getWorldPosition(new T.Vector3()).distanceTo(m.weapon!.getWorldPosition(new T.Vector3()))).toBeLessThan(1e-5);expect(socket.getWorldQuaternion(new T.Quaternion()).angleTo(m.weapon!.getWorldQuaternion(new T.Quaternion()))).toBeLessThan(.001);}disposeModel(m.root);
   const gun=weaponModel(id);const size=new T.Box3().setFromObject(gun.root).getSize(new T.Vector3());expect(size.z).toBeLessThan(1.55);disposeModel(gun.root);
  }
 });
});
