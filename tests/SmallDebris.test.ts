import {it,expect,vi} from 'vitest';
import * as T from 'three';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
const camera=new T.Camera();
it('keeps monster fragments small, varied and short-lived without changing the solid pool',()=>{
 const random=vi.spyOn(Math,'random').mockReturnValue(.5),scene=new T.Scene(),fx=new AttackEffects(scene);
 try{
  fx.event({type:'corpse',x:0,y:0});fx.update(.01,camera,[]);
  const debris=scene.children[2] as T.InstancedMesh,m=new T.Matrix4(),s=new T.Vector3();
  expect(debris.geometry.type).toBe('BoxGeometry');expect(fx.counts.debris).toBe(10);
  for(let i=0;i<debris.count;i++){debris.getMatrixAt(i,m);s.setFromMatrixScale(m);expect(Math.max(s.x,s.y,s.z)).toBeLessThanOrEqual(.09);}
  fx.update(1.1,camera,[]);expect(fx.counts.debris).toBe(0);
  for(let i=0;i<100;i++)fx.event({type:'corpse',x:0,y:0});fx.update(.01,camera,[]);
  expect(fx.counts.debris).toBe(EFFECT_LIMITS.debris);expect(debris.count).toBe(EFFECT_LIMITS.debris);fx.clear();expect(debris.count).toBe(0);
 }finally{random.mockRestore();fx.dispose();}
});
it.each(['hit','acid'] as const)('retires %s target fragments quickly but preserves weapon casings',type=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene);
 fx.event({type,x:0,y:0,targetId:1,weapon:'pistol',angle:0});
 expect(fx.counts.debris).toBe(4);fx.update(.8,camera,[]);expect(fx.counts.debris).toBe(0);
 fx.shot(new T.Vector3(0,1,0),0,'pistol');fx.update(.8,camera,[]);expect(fx.counts.debris).toBe(1);
 fx.dispose();
});
