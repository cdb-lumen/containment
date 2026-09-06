import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Optional additions preserve older status producers. Never derive frozen from stacks. */
export type AfflictionStatus={chilled:boolean;burning:boolean;poisoned?:boolean;chillStacks?:number;frozen?:boolean};
export const NO_AFFLICTION:AfflictionStatus={chilled:false,burning:false,poisoned:false,frozen:false,chillStacks:0};

/** Four bounded draw calls per affected actor, no emitters, lights or per-frame allocations.
 * Root-local cues leave the center and outer floor telegraphs unobscured. */
export function afflictionEffects(root:T.Group,span:number,height:number){
 const radius=span*.39;
 const material=(color:number,opacity:number)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const combine=(parts:T.BufferGeometry[])=>{const merged=mergeGeometries(parts)!;for(const part of parts)part.dispose();return merged;};
 const flames=[];
 for(let i=0;i<4;i++){const angle=i*Math.PI/2+.4,h=Math.max(.45,height*.55)*(i%2?.8:1);flames.push(new T.ConeGeometry(span*.075,h,5).translate(Math.cos(angle)*radius*.72,h*.5,Math.sin(angle)*radius*.72));}
 const burning=new T.Mesh(combine(flames),material(0xff8e32,.9));burning.name='status-burning';burning.position.y=.1;
 const chill=new T.Mesh(new T.RingGeometry(radius*.96,radius*1.06,48),material(0x79ddff,.8));chill.name='status-chill';chill.rotation.x=-Math.PI/2;chill.position.y=.13;
 const cage=new T.CylinderGeometry(radius*.62,radius,height*1.05,6,1,true);
 const frozen=new T.LineSegments(new T.EdgesGeometry(cage),new T.LineBasicMaterial({color:0xc5f5ff,transparent:true,opacity:.9,depthWrite:false,toneMapped:false}));cage.dispose();frozen.name='status-frozen';frozen.position.y=height*.53;
 const droplets=[];for(let i=0;i<3;i++){const angle=i*Math.PI*2/3;droplets.push(new T.SphereGeometry(span*.045,5,3).translate(Math.cos(angle)*radius*.65,height*.72,Math.sin(angle)*radius*.65));}
 const poison=new T.Mesh(combine(droplets),material(0x9bea75,.85));poison.name='status-poison';
 const cues=[burning,chill,frozen,poison];for(const cue of cues){cue.userData.afflictionEffect=true;cue.material.userData.actorMaterial=true;cue.visible=false;cue.castShadow=cue.receiveShadow=false;root.add(cue);}
 return{
  set(status:AfflictionStatus){
   burning.visible=status.burning;chill.visible=status.chilled;frozen.visible=status.frozen??false;poison.visible=status.poisoned??false;
   const stacks=Number.isFinite(status.chillStacks)?T.MathUtils.clamp(Math.floor(status.chillStacks!),1,3):1;
   chill.geometry.setDrawRange(0,stacks*16*6);
  },
  animate(time:number){burning.scale.y=.94+Math.sin(time*9)*.12;poison.position.y=Math.sin(time*3)*.06;},
  reset(){for(const cue of cues){cue.visible=false;cue.castShadow=cue.receiveShadow=false;}burning.scale.set(1,1,1);poison.position.y=0;},
 };
}
