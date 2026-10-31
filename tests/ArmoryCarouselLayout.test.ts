import {describe,it,expect} from 'vitest';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {ARMORY_SOLIDS} from '../src/game/world/armoryCarouselLayout';
import {createExpeditionGeometry,canTraverseExpedition,canOccupyExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';

const node={id:'armory-layout',templateId:'armory',depth:5,kind:'elite',next:[],reward:'upgrade'} as const;
const point=(x:number,y:number)=>({x,y});
describe('Armory carousel and horseshoe circulation',()=>{
 it('owns two exact sealed silhouettes and preserves the room anchors',()=>{
  const t=ROOM_TEMPLATES.armory;
  expect(t.voids).toEqual(ARMORY_SOLIDS);expect(t.obstacles).toEqual([]);
  expect([t.width,t.height,t.spawn,t.exit,t.breaches]).toEqual([1200,880,point(100,440),point(1100,440),[point(100,100),point(1100,100),point(100,780),point(1100,780)]]);
 });
 for(const radius of [16,28,38])it(`admits radius${radius} through the mouth, around the spindle and along the outer retreat loop`,()=>{
  const g=createExpeditionGeometry(node);
  const paths=[[[100,440],[180,440],[180,760],[600,760],[600,620],[600,595]],
   [[180,440],[180,80],[1020,80],[1020,760],[180,760],[180,440]],
   Array.from({length:37},(_,i)=>{const a=(90+i*10)*Math.PI/180;return [600+145*Math.cos(a),450+145*Math.sin(a)];})];
  for(const path of paths)for(let i=1;i<path.length;i++)expect(canTraverseExpedition(g,point(...path[i-1] as [number,number]),point(...path[i] as [number,number]),radius),JSON.stringify({radius,from:path[i-1],to:path[i]})).toBe(true);
  expect(canTraverseExpedition(g,point(600,620),point(600,300),radius)).toBe(false);
  expect(canOccupyExpedition(g,point(600,450),radius)).toBe(false);
  expect(canTraverseExpedition(g,point(180,450),point(450,450),radius)).toBe(false);
 });
 it('blocks counter/spindle shots while keeping the open mouth and inner aisle clear',()=>{
  const g=createExpeditionGeometry(node);
  expect(hasClearExpeditionShot(g,point(600,760),point(600,595))).toBe(true);
  expect(hasClearExpeditionShot(g,point(600,620),point(600,300))).toBe(false);
  expect(hasClearExpeditionShot(g,point(180,450),point(450,450))).toBe(false);
  expect(hasClearExpeditionShot(g,point(455,450),point(455,550))).toBe(true);
 });
});
