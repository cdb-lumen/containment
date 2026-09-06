/** Orthographic ground-plane extents for the fixed (0,26,19) camera offset. */
export function roomFocus(x:number,z:number,width:number,depth:number,viewWidth:number,viewHeight:number){
 const halfX=Math.min(width/2,Math.max(0,viewWidth/2-.7));
 const halfZ=Math.min(depth/2,Math.max(0,viewHeight/2*Math.hypot(26,19)/26-.7));
 return {x:Math.max(halfX,Math.min(width-halfX,x)),z:Math.max(halfZ,Math.min(depth-halfZ,z))};
}
