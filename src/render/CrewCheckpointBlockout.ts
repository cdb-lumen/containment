import * as T from 'three';
import {box,rod,MAT} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room5 west-facing checkpoint. Wall-connected armor protects the eastern
 * crew station; a forced gate leaves the campaign passage open.
 * Procedural source is the reproducible asset, without external loading.
 */
export function crewCheckpointBlockout(f:Footprint,index:number):T.Group{
 const root=new T.Group(),parts=new T.Group();root.name=`crew-checkpoint-blockout-${index}`;root.add(parts);
 // Author at shipping scale, then shrink only for smaller fallback reservations.
 const station=index===2,w=station?5:2.5,d=station?2.5:12.5;
 const b=(name:string,x:number,y:number,z:number,width:number,height:number,depth:number,material:T.Material)=>{
  const mesh=box(parts,x,y,z,width,height,depth,material,0);mesh.name=name;return mesh;
 };
 if(station){
  b('station-plinth',2.5,.09,1.25,4.98,.18,2.48,MAT.black);
  b('closed-control-cabinet',2.5,.48,.46,4.8,.78,.8,MAT.steel);
  b('guard-counter',2.5,.91,1.11,4.8,.12,.72,MAT.orange);
  for(const x of [.5,4.5]){
   b('counter-pedestal',x,.49,1.51,.8,.8,1.76,MAT.steel);
   b('cabinet-door',x,.52,2.399,.66,.64,.025,MAT.edge);
   b('cabinet-handle',x,.68,2.42,.24,.035,.04,MAT.bone);
  }
  // Tucked seat makes the staffed side legible without implying a walkable bay.
  b('seat-pedestal',2.5,.32,1.92,.38,.28,.4,MAT.black);
  b('guard-seat',2.5,.53,1.92,.72,.16,.7,MAT.rubber);
  b('seat-back',2.5,.83,2.23,.74,.52,.13,MAT.orange);
  b('terminal-foot',1.76,1.005,.95,.52,.07,.36,MAT.black);
  b('terminal-stem',1.76,1.15,.94,.12,.28,.12,MAT.edge);
  b('guard-terminal',1.76,1.36,.94,.88,.49,.16,MAT.black);
  b('unlit-terminal-glass',1.76,1.36,1.025,.72,.34,.018,MAT.shellDark);
  b('terminal-keyboard',1.76,.992,1.27,.62,.04,.22,MAT.edge);
  // Exposed inert crew weapon in a bolted cradle, not a loose pickup or case.
  b('weapon-cradle-bed',3.15,.91,.48,2,.08,.72,MAT.shell);
  b('retained-weapon-stock',2.55,1.03,.48,.5,.16,.28,MAT.rubber);
  b('retained-weapon-receiver',2.99,1.04,.48,.45,.18,.19,MAT.edge);
  b('retained-weapon-barrel',3.59,1.04,.48,.8,.09,.09,MAT.black);
  b('retained-weapon-grip',2.88,1.01,.66,.12,.12,.26,MAT.rubber);
  b('retained-weapon-magazine',3.12,1.01,.65,.14,.12,.24,MAT.black);
  for(const x of [3.01,3.66])b('weapon-retaining-lock',x,1.015,.48,.055,.23,.38,MAT.orange);
 }else{
  // One connected line faces the west arrival; the east side retains its braces.
  const wallZ=index===0?.1:d-.1,gateZ=index===0?d-.2:.2;
  b('wall-anchor',.65,.7,wallZ,1.3,1.4,.2,MAT.edge);
  b('gate-jamb',.65,.9,gateZ,1.3,1.8,.4,MAT.steel);
  b('gate-jamb-cap',.65,1.84,gateZ,1.3,.08,.4,MAT.orange);
  if(index===0){
   // The gate was driven back against its protected side, not neatly opened.
   // Unequal torn slats and a sheared upper hinge retain the physical failure.
   for(let n=0;n<4;n++){
    const length=[1.8,2.15,1.65,2][n];
    b('forced-gate-leaf',1.48+n*.12,.35+n*.31,d-.2-length/2,.16,.28,length,MAT.armor);
   }
   for(const y of [.3,1.25])b('gate-hinge',1.12,y,d-.28,1,.15,.2,MAT.orange);
  }else{
   for(const x of [.25,.8])b('broken-latch',x,.85,.09,.22,.18,.18,MAT.orange);
  }
  for(let n=0;n<4;n++){
   const z=(n+.5)*d/4,length=d/4-.04;
   // Repeat the accepted west module without changing the reserved footprint.
    b('ballistic-panel',.36,.76,z,.48,.98,length,MAT.shell);
    b('shield-top-edge',.36,1.27,z,.6,.06,length,MAT.edge);
    b('lower-face-armor',.095,.42,z,.05,.36,length-.14,MAT.armor);
    b('representative-frame-sill',.5,.29,z,.5,.14,length,MAT.edge);
    b('rear-ballast',1.98,.12,z,.96,.24,length-.42,MAT.steel);
    for(const dz of [-length*.36,length*.36]){
     b('representative-skid',1.25,.09,z+dz,2.46,.18,.66,MAT.edge);
     b('representative-front-shoe',.44,.11,z+dz,.8,.22,.68,MAT.orange);
     b('representative-rear-shoe',2.14,.17,z+dz,.64,.34,.68,MAT.orange);
     b('representative-frame-post',.61,.71,z+dz,.22,1.1,.24,MAT.edge);
     const brace=rod(parts,new T.Vector3(.65,1.11,z+dz),new T.Vector3(2.22,.16,z+dz),.1,.1,MAT.edge);brace.name='rear-brace';
    }
    b('crew-mark',.107,.99,z,.025,.18,.46,MAT.bone);
  }
 }
 if(station){
  // Preserve the complete counter and weapon assembly, turn its working side east.
  const fit=new T.Group();root.add(fit);fit.add(parts);
  parts.rotation.y=Math.PI/2;parts.position.z=w;
  fit.scale.set(f.width/d,Math.min(1,f.width/d,f.height/w),f.height/w);
 }else parts.scale.set(f.width/w,Math.min(1,f.width/w,f.height/d),f.height/d);
 root.position.set(f.x,0,f.y);root.userData.footprint={...f};return root;
}
