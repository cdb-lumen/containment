import {expect,it,beforeAll} from 'vitest';
import * as T from 'three';
import {alien} from '../src/render/models';
import {ActorPool} from '../src/render/ActorPool';
import {loadModels} from './loadModels';
import {AttackEffects} from '../src/render/AttackEffects';
beforeAll(loadModels);
const materials=(model:ReturnType<typeof alien>)=>{const set=new Set<T.MeshStandardMaterial>();model.root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial)set.add(m);});return [...set];};
it('briefly brightens only the struck actor, preserves frozen status and clears on reuse',()=>{
 const pool=new ActorPool(),a=pool.take('crawler'),b=pool.take('crawler');a.animate(0,0,0);b.animate(0,0,0);
 a.setAffliction!({frozen:true,chilled:true,burning:false,poisoned:false});a.hit!();a.animate(.01,0,0);
 expect(Math.max(...materials(a).map(m=>m.emissiveIntensity))).toBeGreaterThan(.12);
 expect(Math.max(...materials(a).map(m=>m.emissiveIntensity))).toBeLessThanOrEqual(.22);
 expect(materials(a).every(m=>m.emissive.getHex()===0x79ddff)).toBe(true);
 expect(Math.max(...materials(b).map(m=>m.emissiveIntensity))).toBe(0);
 for(let i=1;i<8;i++)a.animate(i*.05,0,0);
 expect(Math.max(...materials(a).map(m=>m.emissiveIntensity))).toBeCloseTo(.12);
 pool.release(a);const reused=pool.take('crawler');reused.animate(0,0,0);expect(Math.max(...materials(reused).map(m=>m.emissiveIntensity))).toBe(0);pool.release(reused);pool.release(b);pool.dispose();
});
it('caps repeated actor hits without washing out material or exposed colors',()=>{
 const a=alien('brute');a.animate(0,0,0);const base=materials(a).map(m=>m.color.getHex());
 a.hit!(1);a.hit!(4);a.animate(0,0,0);
 expect(Math.max(...materials(a).map(m=>m.emissiveIntensity))).toBeGreaterThan(0);
 expect(Math.max(...materials(a).map(m=>m.emissiveIntensity))).toBeLessThanOrEqual(.1);
 expect(materials(a).map(m=>m.color.getHex())).toEqual(base);
 a.setExposed!(true);a.animate(0,0,0);
 expect(materials(a).every(m=>m.emissive.getHex()===0x42602b)).toBe(true);
 expect(Math.max(...materials(a).map(m=>m.emissiveIntensity))).toBeLessThanOrEqual(.32);
 for(let i=1;i<5;i++)a.animate(i*.05,0,0);
 expect(Math.max(...materials(a).map(m=>m.emissiveIntensity))).toBeCloseTo(.22);
 a.reset!();a.animate(0,0,0);expect(materials(a).every(m=>m.emissiveIntensity===0)).toBe(true);
 a.stop!();
});
it('uses a compact contact burst instead of the generic acid spray',()=>{
 const effects=new AttackEffects(new T.Scene());effects.event({type:'acid',contact:'damage',x:320,y:320,targetId:1});
 expect(effects['glow'].length).toBeLessThanOrEqual(5);expect(effects['glow'].length).toBeGreaterThan(0);
 expect(Math.max(...effects['glow'].map(p=>p.life))).toBeLessThanOrEqual(.18);
 effects.dispose();
});
