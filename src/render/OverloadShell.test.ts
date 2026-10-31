import {it,expect} from 'vitest';
import * as T from 'three';
import {createOverloadShell} from './OverloadShell';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {disposeModel} from './meshParts';
const t=ROOM_TEMPLATES['overload-floor'];
it('builds Room20 thermal apron, service grates and backed wall cassettes without changing topology',()=>{
 const before=JSON.stringify(t),room=createOverloadShell(t);
 expect(room.children.map(c=>c.name)).toEqual(['thermal-apron','service-decks','perimeter-armour','underdeck-frame']);
 expect(JSON.stringify(t)).toBe(before);
 for(const name of ['thermal-apron','service-decks']){
  const b=new T.Box3().setFromObject(room.getObjectByName(name)!);
  expect(b.max.y).toBeLessThanOrEqual(.011);expect(b.min.y).toBeGreaterThanOrEqual(-.05);
 }
 disposeModel(room);
});
it('keeps every apron vertex outside the central void and inside the room boundary',()=>{
 const root=createOverloadShell(t);let count=0;
 const inside=(poly:readonly {x:number;y:number}[],x:number,y:number)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
 root.getObjectByName('thermal-apron')!.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const x=p.getX(i)*32,z=p.getZ(i)*32;expect(inside(t.boundary!,x,z)).toBe(true);expect(inside(t.voids![0],x,z)).toBe(false);count++;}}});
 expect(count).toBeGreaterThan(100);disposeModel(root);
});
