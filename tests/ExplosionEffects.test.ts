import {it,expect} from 'vitest';
import * as T from 'three';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
it('layers bounded animated explosions, retires fire before smoke and clears every pool',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 fx.event({type:'explosion',elements:['fire'],x:0,y:0,radius:100});
 expect(fx.counts).toMatchObject({fire:1,debris:9});
 fx.update(.12,camera,[]);
 const fire=scene.children.find(m=>m.name==='explosion-fire') as T.InstancedMesh;
 expect(fire.count).toBe(1);expect(fire.geometry.getAttribute('effectFrame').getX(0)).toBeGreaterThan(0);
 fx.update(.6,camera,[]);expect(fx.counts.fire).toBe(0);expect(fx.counts.smoke).toBeGreaterThan(0);
 for(let i=0;i<100;i++)fx.event({type:'explosion',elements:['fire'],x:0,y:0});
 expect(fx.counts.fire).toBeLessThanOrEqual(EFFECT_LIMITS.fire);expect(fx.counts.debris).toBeLessThanOrEqual(EFFECT_LIMITS.debris);
 fx.clear();expect(Object.values(fx.counts).every(n=>n===0)).toBe(true);fx.dispose();expect(scene.children).toHaveLength(0);
});
it('gives solid impacts backward directional fragments and settles debris on the floor',()=>{
 const fx=new AttackEffects(new T.Scene()),camera=new T.PerspectiveCamera();fx.event({type:'hit',x:0,y:0,angle:0,weapon:'pistol'});
 const particles=(fx as unknown as {debris:{v:T.Vector3;p:T.Vector3;ground:boolean}[]}).debris;
 expect(particles.length).toBe(3);expect(particles.every(p=>p.v.x<0)).toBe(true);
 for(let i=0;i<180;i++)fx.update(1/60,camera,[]);
 expect(particles.every(p=>p.ground&&p.p.y>=.035)).toBe(true);
});

it('keeps authored coverage, linear shading, inset UVs and injectable atlas loading',()=>{
 const loaded:T.Texture[]=[];
 const loader={load:()=>{const t=new T.Texture();loaded.push(t);return t;}} as unknown as T.TextureLoader;
 const scene=new T.Scene(),fx=new AttackEffects(scene,loader);
 expect(loaded).toHaveLength(2);expect(loaded[0].colorSpace).toBe(T.SRGBColorSpace);expect(loaded[1].colorSpace).toBe(T.NoColorSpace);
 for(const t of loaded){expect(t.generateMipmaps).toBe(false);expect(t.minFilter).toBe(T.LinearFilter);}
 const fire=scene.children.find(m=>m.name==='explosion-fire') as T.InstancedMesh;
 const mat=fire.material as T.ShaderMaterial;
 expect(mat.uniforms.inset.value).toBe(.5/256);expect(mat.fragmentShader).toContain('vAlpha*tex.a');expect(mat.fragmentShader).toContain('smoothstep(.0,.12,vUv.y)');expect(mat.fragmentShader).toContain('colorspace_fragment');expect(mat.fragmentShader).not.toContain('tex.rgb*vec3');
 fx.event({type:'explosion',elements:['fire'],x:0,y:0,radius:100});fx.update(.016,new T.PerspectiveCamera(),[]);
 const matrix=new T.Matrix4();fire.getMatrixAt(0,matrix);expect(new T.Vector3().setFromMatrixPosition(matrix).y).toBeGreaterThan(1);
 fx.dispose();
});
it('routes blast through the explosion layers and bounds velocity trails',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 fx.event({type:'boon',boon:'combustion',x:0,y:0});expect(fx.counts.fire).toBe(1);
 fx.update(.016,camera,[]);const beam=scene.children[6] as T.InstancedMesh;expect(beam.count).toBeGreaterThan(0);expect(beam.count).toBeLessThanOrEqual(EFFECT_LIMITS.beams);
 fx.clear();expect(beam.count).toBe(0);fx.dispose();
});
