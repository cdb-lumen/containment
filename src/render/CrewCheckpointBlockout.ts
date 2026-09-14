import * as T from 'three';
import {box,rod,MAT} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room5 whole-room rough. Renderer metres, unchanged collision reservations.
 * Chest-high shield faces run along the line, with exposed rear struts and
 * low ballast filling the reserved depth. The north island is a guard station.
 * Procedural source is the reproducible asset; no external loading dependency.
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
  b('secured-equipment-case',3.35,1.13,.75,1.22,.32,.6,MAT.shell);
  for(const x of [2.98,3.72])b('case-retaining-band',x,1.299,.75,.07,.018,.61,MAT.trim);
 }else{
  // Both lines use the same construction, not an invented canonical attack direction.
  for(let n=0;n<4;n++){
   const z=(n+.5)*d/4,length=d/4-.04;
   b('ballast-base',1.25,.18,z,2.48,.36,length,MAT.steel);
   b('ballistic-panel',.36,.76,z,.24,.98,length,MAT.shell);
   b('shield-top-edge',.36,1.27,z,.3,.06,length,MAT.edge);
   b('lower-face-armor',.215,.42,z,.05,.36,length-.14,MAT.armor);
   for(const dz of [-length*.36,length*.36]){
    const brace=rod(parts,new T.Vector3(.52,1.11,z+dz),new T.Vector3(2.22,.22,z+dz),.075,.075,MAT.edge);brace.name='rear-brace';
    b('anchor-foot',2.22,.08,z+dz,.42,.16,.3,MAT.black);
    b('shield-upright',.52,.77,z+dz,.13,.98,.14,MAT.edge);
   }
   // One restrained non-emissive recognition patch per panel, not glowing shelf caps.
   b('crew-mark',.226,.99,z,.025,.18,.46,MAT.bone);
  }
 }
 parts.scale.set(f.width/w,Math.min(1,f.width/w,f.height/d),f.height/d);
 root.position.set(f.x,0,f.y);root.userData.footprint={...f};return root;
}
