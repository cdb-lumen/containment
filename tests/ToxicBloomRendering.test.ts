import {it,expect} from 'vitest';
import * as T from 'three';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
const bloom={type:'boon',boon:'poison',x:320,y:320,radius:100} as const;
it('Toxic Bloom disperses raised irregular wisps without a ring or persistent field',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 fx.event(bloom);expect(fx.counts.pulses).toBe(0);expect(fx.counts.smoke).toBeGreaterThanOrEqual(6);expect(fx.counts.glow).toBe(0);
 fx.update(.1,camera,[]);const mesh=scene.children[1] as T.InstancedMesh;
 expect((mesh.material as T.Material).blending).toBe(T.NormalBlending);
 const positions=Array.from({length:mesh.count},(_,i)=>{const m=new T.Matrix4();mesh.getMatrixAt(i,m);return new T.Vector3().setFromMatrixPosition(m);});
 expect(positions.every(p=>p.y>.3)).toBe(true);expect(new Set(positions.map(p=>p.y.toFixed(3))).size).toBeGreaterThan(3);
 const before=Array.from(mesh.instanceMatrix.array);fx.update(0,camera,[]);expect(Array.from(mesh.instanceMatrix.array)).toEqual(before);
 fx.update(.15,camera,[]);expect(Array.from(mesh.instanceMatrix.array)).not.toEqual(before);
 fx.update(.6,camera,[]);expect(fx.counts.smoke).toBe(0);expect(mesh.count).toBe(0);expect((scene.getObjectByName('frost-fields') as T.InstancedMesh).count).toBe(0);
 fx.dispose();expect(scene.children).toHaveLength(0);
});
it('shares fixed smoke resources, resets, and preserves point poison and poison explosions',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera(),draws=scene.children.length;
 for(let n=0;n<100;n++){fx.event(bloom);fx.update(.001,camera,[]);}expect(fx.counts.smoke).toBeLessThanOrEqual(EFFECT_LIMITS.smoke);expect(scene.children.length).toBe(draws);
 fx.clear();expect(Object.values(fx.counts).every(n=>n===0)).toBe(true);
 fx.event({...bloom,radius:undefined});expect(fx.counts.pulses).toBe(1);expect(fx.counts.smoke).toBe(0);
 fx.clear();fx.event({type:'explosion',x:320,y:320,radius:100,elements:['poison']});expect(fx.counts.pulses).toBe(1);expect(fx.counts.debris).toBeGreaterThan(0);fx.dispose();
});
