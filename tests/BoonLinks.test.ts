import {it,expect} from 'vitest';
import * as T from 'three';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
for(const boon of ['impact','frost'] as const)it(`${boon} draws a straight endpoint-anchored link, not violet lightning`,()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 fx.event({type:'boon',boon,x:32,y:64,targetX:160,targetY:64});fx.update(.01,camera,[]);
 const beam=scene.children[6] as T.InstancedMesh,m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3(),color=new T.Color();
 beam.getMatrixAt(0,m);m.decompose(p,q,s);beam.getColorAt(0,color);
 expect(p.x).toBeCloseTo(3);expect(p.y).toBeCloseTo(.8);expect(p.z).toBeCloseTo(2);
 expect(s.y).toBeCloseTo(4);expect(new T.Vector3(0,1,0).applyQuaternion(q).x).toBeCloseTo(1);
 expect(color.getHex()).toBe(boon==='impact'?0xf5dab0:0x8cdeed);
 expect(fx.counts.pulses).toBe(0);expect(fx.counts.fire).toBe(0);
 fx.update(.5,camera,[]);expect(beam.count).toBe(0);fx.dispose();
});
it('bounds link traffic and clears link state without stealing arc admission',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 for(let i=0;i<100;i++){fx.event({type:'boon',boon:'frost',x:0,y:0,targetX:160,targetY:0});fx.update(.001,camera,[]);}
 const beam=scene.children[6] as T.InstancedMesh;expect(beam.count).toBeLessThanOrEqual(EFFECT_LIMITS.beams);
 fx.clear();fx.update(.01,camera,[]);expect(beam.count).toBe(0);
 fx.event({type:'boon',boon:'impact',x:0,y:0,targetX:160,targetY:0});fx.event({type:'boon',boon:'frost',x:0,y:0,targetX:160,targetY:0});fx.event({type:'boon',boon:'arc',x:0,y:0,targetX:160,targetY:0});fx.update(.01,camera,[]);
 expect(beam.count).toBeGreaterThan(42);fx.dispose();
});
