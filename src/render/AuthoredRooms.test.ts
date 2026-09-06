import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom,roomDeckShape} from './AuthoredRooms';
import {disposeModel} from './meshParts';
const template={width:1200,height:880,boundary:[{x:80,y:80},{x:1100,y:100},{x:1000,y:800},{x:80,y:750}],voids:[[{x:450,y:300},{x:700,y:300},{x:700,y:550},{x:450,y:550}]],obstacles:[]};
describe('authored architecture',()=>{
 it('uses authoritative polygon and holes in domain coordinates',()=>{
  const shape=roomDeckShape(template);expect(shape.getPoints().slice(0,4).map(p=>[p.x,p.y])).toEqual(template.boundary.map(p=>[p.x/32,-p.y/32]));
  expect(shape.holes).toHaveLength(1);expect(shape.holes[0].getPoints()[0].x).toBe(450/32);
  const geometry=new T.ShapeGeometry(shape),pos=geometry.getAttribute('position'),index=geometry.index!;
  for(let i=0;i<index.count;i+=3){let x=0,z=0;for(let j=0;j<3;j++){x+=pos.getX(index.getX(i+j))/3;z-=pos.getY(index.getX(i+j))/3;}expect(x>450/32&&x<700/32&&z>300/32&&z<550/32).toBe(false);}geometry.dispose();
 });
 it.each(['passenger-vault','breached-loading-bay','overload-floor'])('batches %s and releases every owned GPU resource once',id=>{
  const group=authoredRoom(id,template)!;expect(group).toBeInstanceOf(T.Group);expect(group.children.length).toBeLessThan(22);
  const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();group.traverse(o=>{if(o instanceof T.Mesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  expect(geometry.size).toBeGreaterThan(5);let disposed=0;for(const resource of [...geometry,...materials])resource.addEventListener('dispose',()=>disposed++);
  disposeModel(group);expect(disposed).toBe(geometry.size+materials.size);
 });
 it('does not replace other rooms',()=>expect(authoredRoom('awakening-bay',template)).toBeNull());
});
