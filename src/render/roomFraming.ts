/** Orthographic ground-plane extents for the fixed (0,26,19) camera offset. */
export function roomFocus(x:number,z:number,width:number,depth:number,viewWidth:number,viewHeight:number,templateId?:string){
 const halfX=Math.min(width/2,Math.max(0,viewWidth/2-.7));
 const halfZ=Math.min(depth/2,Math.max(0,viewHeight/2*Math.hypot(26,19)/26-.7));
 // Room19's elevated north-wall opening sits above the ground-plane envelope.
 // Let the existing camera follow a northward player four world units farther;
 // keep center/south framing, zoom and projection unchanged.
 // Ground-plane framing alone clips the marine at the north wall. Reserve
 // projected body headroom for every room; retain Room19's larger art allowance.
 const actorNorth=Math.min(depth/2,Math.max(0,viewHeight/2*Math.hypot(26,19)/26-2.2));
 const northLimit=templateId==='manual-control-chamber'?Math.max(0,halfZ-4):actorNorth;
 return {x:Math.max(halfX,Math.min(width-halfX,x)),z:Math.max(northLimit,Math.min(depth-halfZ,z))};
}
