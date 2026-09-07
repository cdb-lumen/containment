import {it,expect} from 'vitest';
import * as T from 'three';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';

it('renders untargeted arc discharges as bounded electrical spokes, not an explosion ring',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 fx.event({type:'boon',boon:'arc',x:64,y:96,radius:100});
 expect(fx.counts.pulses).toBe(0);expect((fx as unknown as {arcs:unknown[]}).arcs.length).toBe(6);expect(fx.counts.fire).toBe(0);
 fx.update(.05,camera,[]);
 const beams=scene.children[6] as T.InstancedMesh;expect(beams.count).toBeGreaterThan(12);expect(beams.count).toBeLessThanOrEqual(EFFECT_LIMITS.beams);
 const matrix=new T.Matrix4();beams.getMatrixAt(0,matrix);expect(new T.Vector3().setFromMatrixPosition(matrix).y).toBeGreaterThan(.1);
 for(let i=0;i<12;i++)fx.update(.05,camera,[]);
 expect((fx as unknown as {arcs:unknown[]}).arcs.length).toBe(0);fx.dispose();expect(scene.children).toHaveLength(0);
});
it('scatters physical fragmentation shards with gravity and no radial pulse',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 fx.event({type:'boon',boon:'impact',x:64,y:96,radius:115});
 expect(fx.counts.pulses).toBe(0);expect(fx.counts.fire).toBe(0);expect(fx.counts.debris).toBe(12);
 const particles=(fx as unknown as {debris:{v:T.Vector3;p:T.Vector3;gravity:number;stretch:number}[]}).debris;
 expect(particles.every(p=>p.gravity>0&&p.stretch>1&&p.p.y>.1)).toBe(true);
 expect(particles.some(p=>p.v.x>0)&&particles.some(p=>p.v.x<0)&&particles.some(p=>p.v.z>0)&&particles.some(p=>p.v.z<0)).toBe(true);
 const before=particles.map(p=>p.p.clone());fx.update(.1,camera,[]);expect(particles.every((p,i)=>p.p.distanceTo(before[i])>.1)).toBe(true);
 for(let i=0;i<30;i++){fx.update(.05,camera,[]);fx.event({type:'boon',boon:'impact',x:64,y:96,radius:115});}
 expect(fx.counts.debris).toBeLessThanOrEqual(EFFECT_LIMITS.debris);fx.clear();expect(Object.values(fx.counts).every(n=>n===0)).toBe(true);fx.dispose();
});
