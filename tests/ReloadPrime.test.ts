import {it,expect,vi} from 'vitest';
import * as T from 'three';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
import {DepthRenderer} from '../src/render/DepthRenderer';

it('keeps non-damaging reload priming compact, rising and free of blast debris/rings',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 fx.event({type:'boon',boon:'overload',x:64,y:96});
 expect(fx.counts.pulses).toBe(0);expect(fx.counts.debris).toBe(0);expect(fx.counts.smoke).toBe(0);expect(fx.counts.fire).toBe(0);expect(fx.counts.glow).toBeGreaterThan(0);
 const particles=(fx as unknown as {glow:{p:T.Vector3;v:T.Vector3}[]}).glow;
 expect(particles.every(p=>Math.hypot(p.p.x-2,p.p.z-3)<.5&&p.v.y>0&&Math.hypot(p.v.x,p.v.z)<.1)).toBe(true);
 fx.update(.05,camera,[]);const mesh=scene.children[0] as T.InstancedMesh,before=Array.from(mesh.instanceMatrix.array);fx.update(0,camera,[]);expect(Array.from(mesh.instanceMatrix.array)).toEqual(before);
 for(let i=0;i<30;i++)fx.event({type:'boon',boon:'overload',x:64,y:96});expect(fx.counts.glow).toBeLessThanOrEqual(EFFECT_LIMITS.glow);
 for(let i=0;i<30;i++)fx.update(.05,camera,[]);expect(fx.counts.glow).toBe(0);fx.clear();fx.dispose();expect(scene.children).toHaveLength(0);
});
it('preserves damaging Reactor Cascade blast but does not light the room for reload priming',()=>{
 const fx=new AttackEffects(new T.Scene());fx.event({type:'boon',boon:'overload',x:64,y:96,radius:115});expect(fx.counts.pulses).toBeGreaterThan(0);expect(fx.counts.debris).toBeGreaterThan(0);fx.dispose();
 const explosion=vi.fn(),event=vi.fn();const owner={lighting:{explosion},effects:{event},hitMarkers:{}};
 DepthRenderer.prototype.effect.call(owner as unknown as DepthRenderer,{type:'boon',boon:'overload',x:64,y:96});expect(explosion).not.toHaveBeenCalled();expect(event).toHaveBeenCalled();
 DepthRenderer.prototype.effect.call(owner as unknown as DepthRenderer,{type:'boon',boon:'overload',x:64,y:96,radius:115});expect(explosion).toHaveBeenCalledOnce();
});
