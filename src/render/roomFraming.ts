/** Orthographic ground-plane extents for the fixed (0,26,19) camera offset. */
export function roomFocus(x:number,z:number,width:number,depth:number,viewWidth:number,viewHeight:number,templateId?:string){
 const halfX=Math.min(width/2,Math.max(0,viewWidth/2-.7));
 const halfZ=Math.min(depth/2,Math.max(0,viewHeight/2*Math.hypot(26,19)/26-.7));
 // The Shielding Gate north lane reaches the wall. Reserve projected headroom
 // for the marine's full body, without changing zoom or the south limit.
 const north=templateId==='shielding-gate'?Math.min(depth/2,Math.max(0,viewHeight/2*Math.hypot(26,19)/26-2.2)):halfZ;
 return {x:Math.max(halfX,Math.min(width-halfX,x)),z:Math.max(north,Math.min(depth-halfZ,z))};
}
