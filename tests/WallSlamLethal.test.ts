import {describe,it,expect} from 'vitest';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {MutationRuntime,type MutationHost} from '../src/game/roguelike/MutationRuntime';

function fixture(ghost:boolean){
 const combat=new CombatSystem();combat.setBuild({mutations:['breacher','seismic-impact','volatile-remains']});
 const targets=[{id:1,x:30,y:0,radius:14,health:ghost?0:10},{id:2,x:70,y:0,radius:14,health:1000}];
 const hits:Array<{id:number;amount:number}>=[],slams:Array<{id:number;x:number;y:number}>=[],explosions:number[]=[];
 const host:MutationHost={targets:()=>targets.filter(t=>t.health>0),damage:(id,amount)=>{const target=targets.find(t=>t.id===id)!;if(target.health<=0)return {applied:false,died:false};hits.push({id,amount});target.health-=amount;return {applied:true,died:target.health<=0};},move:()=>({blocked:true}),moveCorpse:t=>({...t,x:32,blocked:true}),setSlow:()=>{},canAffect:()=>true,effect:(_x,_y,radius)=>explosions.push(radius)};
 // Assign separately so this regression can also execute on the pre-fix host API.
 Object.assign(host,{wallSlam:(t:{id:number;x:number;y:number})=>slams.push({id:t.id,x:t.x,y:t.y})});
 const runtime=new MutationRuntime(combat,host);
 runtime.hit('shot','shotgun',{...targets[0],health:10},{x:1,y:0});
 return {runtime,targets,hits,slams,explosions};
}

describe('wall-slam lethal and corpse routing',()=>{
 it('shows one slam when seismic kills before Breacher and retains the genuine volatile explosion',()=>{
  const f=fixture(false);f.runtime.update(50);
  expect(f.slams).toEqual([{id:1,x:30,y:0}]);
  expect(f.hits).toEqual([{id:1,amount:24},{id:2,amount:24},{id:2,amount:22}]);
  expect(f.explosions).toEqual([72]);
  f.runtime.update(50);expect(f.slams).toHaveLength(1);expect(f.hits).toHaveLength(3);
 });
 it('slams a moved ghost once and applies seismic damage only to living targets',()=>{
  const f=fixture(true);f.runtime.update(50);
  expect(f.slams).toEqual([{id:1,x:32,y:0}]);
  expect(f.hits).toEqual([{id:2,amount:24}]);expect(f.explosions).toEqual([]);
  expect(f.targets[0].health).toBe(0);
  f.runtime.update(50);expect(f.slams).toHaveLength(1);expect(f.hits).toHaveLength(1);
 });
});
