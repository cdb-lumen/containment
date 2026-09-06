import {it,expect} from 'vitest';
import * as T from 'three';
import {EnemyHealthBars,healthFraction} from '../src/render/EnemyHealthBars';
it('keeps enemy health legible across view sizes, clamps damage and removes dead bars',()=>{
 const bars=new EnemyHealthBars(3),camera=new T.OrthographicCamera(-10,10,10,-10),enemy={x:2,z:3,height:1,health:25,maxHealth:100};
 expect(healthFraction(25,100)).toBe(.25);expect(healthFraction(-1,100)).toBe(0);expect(healthFraction(120,100)).toBe(1);expect(healthFraction(20,0)).toBe(0);
 bars.update([enemy,{...enemy,health:0}],camera,800);const [background,fill]=bars.root.children as T.InstancedMesh[];expect(fill.count).toBe(1);const m=new T.Matrix4();fill.getMatrixAt(0,m);expect(m.elements[0]).toBeCloseTo(32*20/800*.25);const original=m.elements[0];
 bars.update([enemy],camera,400);fill.getMatrixAt(0,m);expect(m.elements[0]).toBeCloseTo(original*2);bars.update([],camera,400,true);expect(fill.count).toBe(0);expect(background.count).toBe(0);expect(bars.root.visible).toBe(false);bars.dispose();
});
