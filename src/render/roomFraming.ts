/** Orthographic ground-plane extents for the fixed (0,26,19) camera offset. */
export function roomFocus(x:number,z:number,width:number,depth:number,viewWidth:number,viewHeight:number,templateId?:string){
 // Portrait opening composition includes the empty release and first sealed pod.
 // Keep shipping scale; bias only near the waking position, fading out by x400.
 if(templateId==='awakening-bay'&&viewWidth<viewHeight)x+=85/32*Math.max(0,1-Math.abs(x-230/32)/(170/32));
 const halfX=Math.min(width/2,Math.max(0,viewWidth/2-.7));
 const halfZ=Math.min(depth/2,Math.max(0,viewHeight/2*Math.hypot(26,19)/26-.7));
 return {x:Math.max(halfX,Math.min(width-halfX,x)),z:Math.max(halfZ,Math.min(depth-halfZ,z))};
}
