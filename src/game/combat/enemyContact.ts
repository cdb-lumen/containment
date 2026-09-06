import type {EnemyId} from '../enemies/types';
/** Authored rig span, shared with rendering. Feet/navigation remain unchanged. */
export const ENEMY_SPAN:Readonly<Record<EnemyId,number>>={crawler:1.75,stalker:2.35,spitter:2.35,carrier:3.05,brute:3.1,queen:6.5};
export function enemyShotRadius(kind:EnemyId,elite=false){return ENEMY_SPAN[kind]*32*.35*(elite?1.12:1);}
type Point={x:number;y:number};
/** Earliest entry in a swept circle. Relative endpoints also support moving targets. */
export function sweptCircle(from:Point,to:Point,center:Point,radius:number):number|null{
 const x=from.x-center.x,y=from.y-center.y,dx=to.x-from.x,dy=to.y-from.y;
 const c=x*x+y*y-radius*radius;if(c<=0)return 0;
 const a=dx*dx+dy*dy;if(a===0)return null;
 const b=x*dx+y*dy,d=b*b-a*c;if(d<0)return null;
 const t=(-b-Math.sqrt(d))/a;return t>=0&&t<=1?t:null;
}
