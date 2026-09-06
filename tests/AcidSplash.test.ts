import {it,expect,vi} from 'vitest';
import * as T from 'three';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
const camera=new T.PerspectiveCamera();
camera.position.set(0,8,6);camera.lookAt(0,0,0);camera.updateMatrixWorld();
function fixture(){const scene=new T.Scene(),fx=new AttackEffects(scene);return{scene,fx,drops:scene.children[1] as T.InstancedMesh};}
it.each([undefined,96])('renders untargeted acid radius %s as bounded non-additive drops without blast/spark pools',radius=>{
 const {scene,fx,drops}=fixture();
 try{
  fx.event({type:'acid',x:64,y:96,angle:.4,radius});fx.update(.01,camera,[]);
  expect(fx.counts).toEqual({fire:0,glow:0,smoke:radius===undefined?10:18,debris:0,pulses:0,decals:0});
  expect(scene.children).toHaveLength(8);expect((drops.material as T.ShaderMaterial).blending).toBe(T.NormalBlending);
  expect((scene.children[6] as T.InstancedMesh).count).toBe(0);
  for(let i=0;i<drops.count;i++)expect(drops.geometry.getAttribute('effectFrame').getX(i)).toBe(-1);
 }finally{fx.dispose();}
});
it('sprays outward, falls into floor splats without bouncing, then expires',()=>{
 const random=vi.spyOn(Math,'random').mockReturnValue(.5),{fx,drops}=fixture(),m=new T.Matrix4(),p=new T.Vector3(),scale=new T.Vector3();
 try{
  fx.event({type:'acid',x:64,y:96,radius:96});fx.update(.1,camera,[]);drops.getMatrixAt(0,m);p.setFromMatrixPosition(m);scale.setFromMatrixScale(m);
  expect(p.y).toBeGreaterThan(.1);expect(Math.hypot(p.x-2,p.z-3)).toBeGreaterThan(.1);expect(scale.y).toBeGreaterThan(scale.x);
  fx.update(.5,camera,[]);expect(drops.count).toBeGreaterThan(0);drops.getMatrixAt(0,m);p.setFromMatrixPosition(m);
  expect(p.y).toBeCloseTo(.012);expect(Math.abs(m.elements[10])).toBeLessThan(.001);
  fx.update(.05,camera,[]);drops.getMatrixAt(0,m);expect(m.elements[13]).toBeCloseTo(.012);
  fx.update(1,camera,[]);expect(fx.counts.smoke).toBe(0);expect(drops.count).toBe(0);
 }finally{random.mockRestore();fx.dispose();}
});
it('shares the smoke cap, freezes on pause and clears without allocating more draws',()=>{
 const {scene,fx,drops}=fixture();
 try{
  for(let i=0;i<100;i++)fx.event({type:'acid',x:0,y:0,radius:96});
  expect(fx.counts.smoke).toBe(EFFECT_LIMITS.smoke);fx.update(.01,camera,[]);expect(drops.count).toBe(EFFECT_LIMITS.smoke);
  const matrices=drops.instanceMatrix.array.slice();fx.update(0,camera,[]);expect(drops.instanceMatrix.array).toEqual(matrices);
  expect(scene.children).toHaveLength(8);fx.clear();expect(fx.counts.smoke).toBe(0);expect(drops.count).toBe(0);
  fx.event({type:'explosion',x:0,y:0,radius:96,elements:['poison']});fx.update(.01,camera,[]);
  expect(fx.counts.pulses).toBe(1);expect(fx.counts.glow).toBeGreaterThan(0);
  for(let i=0;i<drops.count;i++)expect(drops.geometry.getAttribute('effectFrame').getX(i)).toBeGreaterThanOrEqual(0);
 }finally{fx.dispose();}
});
it('preserves dim shipping target contacts and legacy flesh fragments',()=>{
 const {fx}=fixture();
 try{
  fx.event({type:'acid',x:0,y:0,targetId:1,contact:'damage',weapon:'pistol'});
  expect(fx.counts).toEqual({fire:0,glow:4,smoke:0,debris:0,pulses:0,decals:0});fx.clear();
  fx.event({type:'acid',x:0,y:0,targetId:1,weapon:'pistol'});expect(fx.counts.debris).toBe(4);expect(fx.counts.smoke).toBe(0);
  fx.clear();fx.event({type:'corpse',x:0,y:0});expect(fx.counts.debris).toBe(10);
 }finally{fx.dispose();}
});
