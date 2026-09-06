import * as T from 'three';

/** Resolve presentation geometry only. Collision planes can sit inside thick wall panels. */
export function wallSurface(world:T.Object3D,p:T.Vector3,outward:T.Vector3,footprint=.085){
 // Start on the playable side, beyond the panel's .28 protruding trim.
 // The short ray must not attach a void-rim strike to an unrelated distant wall.
 world.updateWorldMatrix(true,true);
 const ray=new T.Raycaster(p.clone().addScaledVector(outward,.6),outward.clone().negate(),0,.95);
 for(const hit of ray.intersectObject(world,true)){
  if(!hit.face)continue;
  let visible=true;
  for(let object:T.Object3D|null=hit.object;object;object=object.parent)if(!object.visible){visible=false;break;}
  if(!visible)continue;
  const normal=hit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
  if(Math.abs(normal.y)>.3||normal.dot(outward)<.2)continue;
  // A .12 mark can rotate, so reserve its bounding square on this same face.
  const tangent=new T.Vector3(normal.z,0,-normal.x).normalize(),up=new T.Vector3().crossVectors(normal,tangent);
  let supported=true;
  for(const x of [-footprint,footprint])for(const y of [-footprint,footprint]){
   const sample=hit.point.clone().addScaledVector(tangent,x).addScaledVector(up,y);
   ray.set(sample.clone().addScaledVector(normal,.1),normal.clone().negate());ray.far=.12;
   const support=ray.intersectObject(hit.object,false)[0];
   if(!support?.face||Math.abs(support.point.clone().sub(sample).dot(normal))>.005){supported=false;continue;}
   const supportNormal=support.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
   if(supportNormal.dot(normal)<.98)supported=false;
  }
  return {point:hit.point,normal,supported};
 }
 return undefined;
}
