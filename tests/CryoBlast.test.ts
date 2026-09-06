import {it,expect} from 'vitest';
import * as T from 'three';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {MutationRuntime} from '../src/game/roguelike/MutationRuntime';
import {AttackEffects} from '../src/render/AttackEffects';
import type {MutationId} from '../src/game/roguelike/types';
function fixture(mutations:MutationId[]){
 const combat=new CombatSystem();combat.setBuild({mutations});
 const fx=new AttackEffects(new T.Scene()),events:string[]=[],damage:number[]=[];
 const target={id:1,x:0,y:0,radius:14,health:1000};
 const runtime=new MutationRuntime(combat,{targets:()=>[target],damage:(_,n)=>{damage.push(n);return {applied:true,died:false};},move:()=>({blocked:false}),moveCorpse:t=>({...t,blocked:false}),setSlow:()=>{},effect:(x,y,radius)=>{events.push('explosion');fx.event({type:'explosion',x,y,radius});},boonEffect:(boon,x,y,targetX,targetY,radius)=>{events.push(boon);fx.event({type:'boon',boon,x,y,targetX,targetY,radius});}});
 const hit=(n:number)=>{fx.update(.05,new T.PerspectiveCamera(),[]);runtime.hit(`shot-${n}`,'pistol',target,{x:1,y:0});};
 return {fx,events,damage,runtime,hit};
}
it('routes fourth-hit Shattershot to cold particles, never the generic fire atlas, preserving 24+16 damage',()=>{
 const w=fixture(['cryogenic','shattershot']);for(let n=0;n<4;n++)w.hit(n);
 expect(w.events).toContain('shatter');expect(w.events).not.toContain('explosion');expect(w.fx.counts.fire).toBe(0);expect(w.damage).toEqual([24,16]);
});
it('keeps absolute zero, thermal shock and armor-break cold routes free of fire',()=>{
 for(const ids of [['cryogenic','absolute-zero'],['cryogenic','incendiary','thermal-shock'],['shock-absorber']] as MutationId[][]){const w=fixture(ids);if(ids[0]==='shock-absorber')w.runtime.hurt(10,0,{x:0,y:0});else for(let n=0;n<(ids[1]==='absolute-zero'?3:2);n++)w.hit(n);expect(w.events).toContain('shatter');expect(w.fx.counts.fire).toBe(0);}
});
it('renders a blue-white fracture flash and short vapor, without scorch or fire',()=>{
 const fx=new AttackEffects(new T.Scene());fx.event({type:'boon',boon:'shatter',x:0,y:0,radius:60});
 expect(fx.counts.fire).toBe(0);expect(fx.counts.decals).toBe(0);expect(fx.counts.glow).toBeGreaterThan(0);expect(fx.counts.debris).toBeGreaterThan(0);
 const particles=fx as unknown as {smoke:{color:T.Color;life:number}[];glow:{color:T.Color}[]};
 expect(particles.smoke.every(p=>p.life<=.35&&p.color.b>p.color.r)).toBe(true);expect(particles.glow.every(p=>p.color.b>=p.color.r)).toBe(true);
 fx.update(.4,new T.PerspectiveCamera(),[]);expect(fx.counts.smoke).toBe(0);
});
it('retains neutral generic rocket/grenade explosions and volatile-remains',()=>{
 const w=fixture(['volatile-remains']);w.runtime.kill({id:1,x:0,y:0,radius:14,health:0});expect(w.events).toContain('explosion');expect(w.fx.counts.fire).toBe(0);
 for(const weapon of ['rocket','shotgun'] as const){w.fx.clear();w.fx.event({type:'explosion',weapon,x:0,y:0,radius:100});expect(w.fx.counts.fire).toBe(0);}
});
