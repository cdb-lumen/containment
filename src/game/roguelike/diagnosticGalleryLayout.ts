import type {Point} from './types';
/** Approved stage1 footprint coordinates, game units. Furniture solids, not pits. */
export function diagnosticConsolePolygon(start:number,end:number,inner=300,outer=350):readonly Point[]{
 const arc=(radius:number,reverse=false)=>Array.from({length:25},(_,i)=>{
  const a=(start+(end-start)*(reverse?24-i:i)/24)*Math.PI/180;
  return {x:Number((600+radius*Math.cos(a)).toFixed(4)),y:Number((220+radius*Math.sin(a)).toFixed(4))};
 });
 return Object.freeze([...arc(outer),...arc(inner,true)].map(p=>Object.freeze(p)));
}
export const DIAGNOSTIC_SOLIDS=Object.freeze([
 {id:'physical-ship-cutaway',polygon:Object.freeze([{x:400,y:90},{x:800,y:90},{x:800,y:210},{x:400,y:210}].map(p=>Object.freeze(p)))},
 {id:'west-low-console',polygon:diagnosticConsolePolygon(112,155)},
 {id:'east-low-console',polygon:diagnosticConsolePolygon(25,68)},
].map(s=>Object.freeze(s)));
export const DIAGNOSTIC_TOPOLOGY=Object.freeze({voids:Object.freeze(DIAGNOSTIC_SOLIDS.map(s=>s.polygon)),obstacles:Object.freeze([])});
