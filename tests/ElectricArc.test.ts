import {it,expect} from 'vitest';
import * as T from 'three';
import {electricArc} from '../src/render/electricArc';
import {AttackEffects,EFFECT_LIMITS} from '../src/render/AttackEffects';
it('anchors a continuous trunk with three finite branching forks and seeded restrikes',()=>{
 const a=new T.Vector3(),b=new T.Vector3(5,.8,2),s=electricArc(a,b,42);
 expect(s).toHaveLength(21);expect(s.filter(x=>x.branch)).toHaveLength(9);
 expect(s[0].start.equals(a)).toBe(true);expect(s[11].end.equals(b)).toBe(true);
 for(let i=1;i<12;i++)expect(s[i].start.equals(s[i-1].end)).toBe(true);
 expect(electricArc(a,b,42)).toEqual(s);expect(electricArc(a,b,43)).not.toEqual(s);
 expect(electricArc(a,a,1)).toEqual([]);
});
it('shares the bounded beam draw, expires lightning and clears transient shards',()=>{
 const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera();
 for(let i=0;i<40;i++){fx.event({type:'boon',x:0,y:0,boon:'arc',targetX:160,targetY:0});fx.update(.001,camera,[]);}
 const beams=scene.children[6] as T.InstancedMesh;
 expect(beams.count).toBeGreaterThan(0);expect(beams.count).toBeLessThanOrEqual(EFFECT_LIMITS.beams);expect(scene.children).toHaveLength(7);
 fx.update(.4,camera,[]);expect(beams.count).toBe(0);
 fx.event({type:'boon',x:0,y:0,boon:'shatter'});expect(fx.counts.debris).toBe(18);
 fx.clear();expect(scene.children.every(m=>(m as T.InstancedMesh).count===0)).toBe(true);fx.dispose();
});
