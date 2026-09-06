import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {HitConfirmation} from '../src/render/HitConfirmation';
it('confirms only briefly at the pointer, distinguishes blocks and clears on pause',()=>{
 const element={style:{left:'',top:'',opacity:''},dataset:{contact:''},hidden:true};
 const marker=new HitConfirmation(element);marker.confirm('damage');expect(element.hidden).toBe(true);
 marker.point(120,200);marker.confirm('damage');expect(element.hidden).toBe(false);expect(element.dataset.contact).toBe('damage');
 marker.update(.2,true);expect(element.hidden).toBe(true);
 marker.confirm('blocked');expect(element.dataset.contact).toBe('blocked');marker.update(0,false);expect(element.hidden).toBe(true);
 marker.clear();marker.confirm('damage');expect(element.hidden).toBe(true);
});
it('fades every contact from a quiet peak without a full-opacity hold',()=>{
 const element={style:{left:'',top:'',opacity:''},dataset:{contact:''},hidden:true};
 const marker=new HitConfirmation(element);marker.point(120,200);
 for(const contact of ['damage','armor','blocked'] as const){
  marker.confirm(contact);expect(element.dataset.contact).toBe(contact);
  expect(Number(element.style.opacity)).toBeCloseTo(.65);
  marker.update(.025,true);expect(Number(element.style.opacity)).toBeCloseTo(.4875);
  marker.update(.025,true);expect(Number(element.style.opacity)).toBeCloseTo(.325);
  marker.update(.051,true);expect(element.hidden).toBe(true);expect(Number(element.style.opacity)).toBe(0);
 }
 marker.confirm('armor');marker.update(.05,true);marker.confirm('damage');
 expect(Number(element.style.opacity)).toBeCloseTo(.65);
 marker.clear();expect(element.hidden).toBe(true);marker.update(0,true);expect(Number(element.style.opacity)).toBe(0);
});
it('uses small open-center hairline ticks with no glow or size pulse',()=>{
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 const rules=css.match(/#hit-confirmation[^{}]*\{[^}]*\}/g)!.join('');
 expect(rules).toContain('width:10px;height:10px');
 expect(rules).toContain('width:1px;height:10px');
 expect(rules).toContain('transparent 40% 60%');
 expect(rules).not.toMatch(/box-shadow|scale\(|animation|transition/);
 expect(rules).toContain('[data-contact=armor]{color:#8da5ad}');
 expect(rules).toContain('[data-contact=blocked]{color:#79868d}');
});
