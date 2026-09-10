import * as T from 'three';
import type {ArcSegment} from './electricArc';
export type LightningSegment=ArcSegment&{width:number};
/** Ball-only paths: 11 trunk segments and at most 12 fork segments. */
export function ballLightning(start:T.Vector3,end:T.Vector3,seed:number):LightningSegment[]{
 let state=seed|0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
 const axis=end.clone().sub(start),length=axis.length();if(length<.001)return[];
 const side=new T.Vector3(-axis.z,0,axis.x).normalize(),points=[start.clone()],result:LightningSegment[]=[];
 const strength=.8+random()*.6;
 for(let i=1;i<=11;i++){
  const t=i===11?1:(i-.35+random()*.7)/11,p=start.clone().addScaledVector(axis,t);
  if(i<11){p.addScaledVector(side,(random()-.5)*Math.min(1.4,length*.48));p.y+=(random()-.5)*.5;}
  result.push({start:points[i-1],end:p,branch:false,width:strength*(1-t*.65)*(.65+random()*.7)});points.push(p);
 }
 for(let f=0;f<3;f++){
  const fork=2+Math.floor(random()*7),sign=random()<.5?-1:1,count=2+Math.floor(random()*3);
  let p=points[fork];const strength=result[fork-1].width*.55;
  for(let j=0;j<count;j++){
   const q=p.clone().addScaledVector(axis,.035+random()*.075).addScaledVector(side,sign*(.12+random()*.36));q.y+=(random()-.4)*.35;
   result.push({start:p,end:q,branch:true,width:strength*(1-j/count)*(.7+random()*.5)});p=q;
  }
 }
 return result;
}
