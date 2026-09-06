import {expect,it} from 'vitest';
import {HitConfirmation} from '../src/render/HitConfirmation';
it('confirms only briefly at the pointer, distinguishes blocks and clears on pause',()=>{
 const element={style:{left:'',top:'',opacity:''},dataset:{contact:''},hidden:true};
 const marker=new HitConfirmation(element);marker.confirm('damage');expect(element.hidden).toBe(true);
 marker.point(120,200);marker.confirm('damage');expect(element.hidden).toBe(false);expect(element.dataset.contact).toBe('damage');
 marker.update(.2,true);expect(element.hidden).toBe(true);
 marker.confirm('blocked');expect(element.dataset.contact).toBe('blocked');marker.update(0,false);expect(element.hidden).toBe(true);
 marker.clear();marker.confirm('damage');expect(element.hidden).toBe(true);
});
