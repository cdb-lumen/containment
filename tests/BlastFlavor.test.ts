import {it,expect} from 'vitest';
import * as T from 'three';
import {AttackEffects} from '../src/render/AttackEffects';
it('keeps unflavored explosions neutral and composes ice/poison without a fireball',()=>{
 const fx=new AttackEffects(new T.Scene());fx.event({type:'explosion',x:0,y:0,radius:100});expect(fx.counts.fire).toBe(0);
 fx.clear();fx.event({type:'explosion',x:0,y:0,radius:100,elements:['ice','poison']});expect(fx.counts.fire).toBe(0);expect(fx.counts.debris).toBeGreaterThan(0);
 fx.clear();fx.event({type:'explosion',x:0,y:0,radius:100,elements:['fire']});expect(fx.counts.fire).toBe(1);
});
