import { FACILITY_LAYOUT, type FacilityPoint, type FacilityProp, type FacilityRect } from './facilityLayout';
import geometry from './propGeometry.json';
export const propVisual = (prop:FacilityProp) => geometry[prop.kind];
/** Collision follows opaque sprite bounds after the same uniform scale as the art. */
export function propBounds(prop:FacilityProp):FacilityRect|null {
  const shape=propVisual(prop);if(!shape.solid)return null;
  const scale=Math.min(prop.width/shape.width,prop.height/shape.height);
  const [left,top,right,bottom]=shape.bounds as [number,number,number,number];
  const width=(right-left)*scale,height=(bottom-top)*scale;
  const cx=prop.x+prop.width/2+(left+right-shape.width)*scale/2;
  const cy=prop.y+prop.height/2+(top+bottom-shape.height)*scale/2;
  return {x:cx-width/2,y:cy-height/2,width,height};
}
export const PROP_BLOCKERS=FACILITY_LAYOUT.props.flatMap(p=>{const b=propBounds(p);return b?[b]:[];});
export const facilityBlockers=(wave:number):readonly FacilityRect[] => [
  ...FACILITY_LAYOUT.walls,...PROP_BLOCKERS,
  ...FACILITY_LAYOUT.doors.filter(d=>d.initialState==='closed'&&d.unlockWave>wave),
];
export const circleBlocked=(point:FacilityPoint,radius:number,blockers:readonly FacilityRect[]):boolean =>
  point.x<radius||point.y<radius||point.x>2560-radius||point.y>1440-radius||blockers.some(r=>{
    const dx=point.x-Math.max(r.x,Math.min(r.x+r.width,point.x));
    const dy=point.y-Math.max(r.y,Math.min(r.y+r.height,point.y));return dx*dx+dy*dy<radius*radius;
  });
