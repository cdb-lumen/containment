import {it,expect} from 'vitest';
import * as T from 'three';
import {AttackEffects} from '../src/render/AttackEffects';
it('renders a bounded frost material inside the stable real radius, with pause and exact expiry',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 fx.event({type:'boon',boon:'field',x:64,y:96,radius:75,durationMs:2000});fx.update(.05,camera,[]);
 const field=scene.getObjectByName('frost-fields') as T.InstancedMesh;
 expect(field).toBeDefined();expect(field.count).toBe(1);
 const m=new T.Matrix4();field.getMatrixAt(0,m);expect(new T.Vector3().setFromMatrixScale(m).x).toBeCloseTo(150/32);
 expect((field.material as T.ShaderMaterial).fragmentShader).toContain('crystal');
 const frozen=Array.from(field.instanceMatrix.array),alpha=Array.from(field.geometry.getAttribute('effectAlpha').array);
 fx.update(0,camera,[]);expect(Array.from(field.instanceMatrix.array)).toEqual(frozen);expect(Array.from(field.geometry.getAttribute('effectAlpha').array)).toEqual(alpha);
 fx.update(1.9,camera,[]);expect(field.count).toBe(1);fx.update(.051,camera,[]);expect(field.count).toBe(0);fx.dispose();expect(scene.children).toHaveLength(0);
});
it('caps frost fields at four, clears and disposes their shared resources',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 for(let i=0;i<10;i++){fx.event({type:'boon',boon:'field',x:i*32,y:96,radius:75,durationMs:2000});fx.update(.01,camera,[]);}
 const field=scene.getObjectByName('frost-fields') as T.InstancedMesh;expect(field).toBeDefined();expect(field.count).toBe(4);
 let geometry=0,material=0;field.geometry.addEventListener('dispose',()=>geometry++);(field.material as T.Material).addEventListener('dispose',()=>material++);
 fx.clear();expect(field.count).toBe(0);fx.update(.1,camera,[]);expect(field.count).toBe(0);fx.dispose();expect(geometry).toBe(1);expect(material).toBe(1);
});
