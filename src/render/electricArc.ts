import * as T from 'three';
export type ArcSegment={start:T.Vector3;end:T.Vector3;branch:boolean};
/** Fixed segment budget, coherent forks, and anchored endpoints. Seed changes per restrike. */
export function electricArc(start:T.Vector3,end:T.Vector3,seed:number):ArcSegment[]{
 let state=(seed|0)+1;const random=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
 const axis=end.clone().sub(start),length=axis.length(),side=new T.Vector3(-axis.z,0,axis.x).normalize();
 if(length<.001)return[];
 const points=[start.clone()],result:ArcSegment[]=[];
 for(let i=1;i<=12;i++){
  const t=i/12,p=start.clone().addScaledVector(axis,t);
  if(i<12){p.addScaledVector(side,(i%2?1:-1)*(.2+random()*.8)*Math.min(1,length*.2)*Math.sin(t*Math.PI));p.y+=(random()-.5)*.4;}
  result.push({start:points[i-1],end:p,branch:false});points.push(p);
 }
 for(const fork of [3,6,9]){
  let p=points[fork];const sign=random()<.5?-1:1;
  for(let j=1;j<=3;j++){
   const q=p.clone().addScaledVector(axis,j%2?.025:-.012).addScaledVector(side,sign*(.16+random()*.25));q.y+=(random()-.3)*.3;
   result.push({start:p,end:q,branch:true});p=q;
  }
 }
 return result;
}
