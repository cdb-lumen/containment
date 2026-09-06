import {it,expect} from 'vitest';
import * as T from 'three';
import {afflictionEffects,AfflictionBatches} from '../src/render/afflictions';
it('batches crowds with independent statuses, bounded capacity and immediate retirement',()=>{
 const scene=new T.Scene(),batch=new AfflictionBatches(undefined,8);scene.add(batch.root);
 const roots=Array.from({length:20},()=>{const root=new T.Group();scene.add(root);afflictionEffects(root,2,1).set({burning:true,chilled:true,chillStacks:3,frozen:true,poisoned:true});return root;});
 batch.update(scene.children,new T.PerspectiveCamera(),1);
 expect(batch.root.children.length).toBeLessThanOrEqual(5);
 expect(batch.counts.fire).toBe(24);expect(batch.counts.poison).toBe(16);expect(batch.counts.ice).toBeGreaterThan(0);
 roots.forEach(r=>r.removeFromParent());batch.update(scene.children,new T.PerspectiveCamera(),1);expect(Object.values(batch.counts).every(n=>n===0)).toBe(true);batch.dispose();
});
it('samples authored alpha and inset sRGB flame cells',()=>{
 const scene=new T.Scene(),batch=new AfflictionBatches(undefined,1),root=new T.Group();scene.add(root);
 afflictionEffects(root,2,1).set({chilled:false,burning:true});batch.update(scene.children,new T.Camera(),1);
 const fire=batch.root.children[0] as T.InstancedMesh,material=fire.material as T.ShaderMaterial;
 expect(material.fragmentShader).toContain('float a=s.a*');expect(material.fragmentShader).not.toContain('max(s.r');
 expect(material.uniforms.map.value.colorSpace).toBe(T.SRGBColorSpace);
 const uv=fire.geometry.getAttribute('atlas');expect(uv.getZ(0)).toBeLessThan(1/16);expect(uv.getW(0)).toBeLessThan(1/4);batch.dispose();
});
