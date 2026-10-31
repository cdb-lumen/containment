import assert from 'node:assert/strict';
export function verifyCircuitCoverage(frames){
 const results=[];
 for(const [startRoute,endRoute] of [[1,6],[6,11]]){
  const start=frames.findIndex(f=>f.routeIndex>=startRoute),end=frames.findIndex(f=>f.routeIndex>=endRoute);
  assert(start>=0&&end>start,`Circuit ${startRoute} requires recorded start/end`);
  let winding=0,maxStep=0;
  for(let i=start+1;i<=end;i++){
   const a=frames[i-1].player,b=frames[i].player;
   const before=Math.atan2(a.y-440,a.x-600),after=Math.atan2(b.y-440,b.x-600);
   const delta=Math.atan2(Math.sin(after-before),Math.cos(after-before));
   winding+=delta;maxStep=Math.max(maxStep,Math.abs(delta));
  }
  // Recorded 50ms normal movement cannot jump across a significant ring arc.
  assert(maxStep<.2,'Circuit samples must form a continuous angular path');
  assert(Math.abs(Math.abs(winding)-2*Math.PI)<.25,'Circuit must wind once around shielding, within endpoint tolerance');
  results.push({startFrame:frames[start].i,endFrame:frames[end].i,windingRadians:winding,maxAngularStep:maxStep});
 }
 assert(results[0].windingRadians*results[1].windingRadians<0,'Circuits must wind in opposite directions');
 return results;
}
