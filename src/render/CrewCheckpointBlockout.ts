import * as T from 'three';
import {box,rod,geometry,MAT} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room5 west-facing checkpoint. Wall-connected armor protects the eastern
 * crew station; a forced gate leaves the campaign passage open.
 * Procedural source is the reproducible asset, without external loading.
 */
export function crewCheckpointBlockout(f:Footprint,index:number):T.Group{
 const root=new T.Group(),parts=new T.Group();root.name=`crew-checkpoint-blockout-${index}`;root.add(parts);
 // Author at shipping scale, then shrink only for smaller fallback reservations.
 const station=index===2,fallen=index===3,w=fallen?2.75:station?5:2.5,d=fallen?3.5:station?2.5:12.5;
 const b=(name:string,x:number,y:number,z:number,width:number,height:number,depth:number,material:T.Material)=>{
  const mesh=box(parts,x,y,z,width,height,depth,material,0);mesh.name=name;return mesh;
 };
 if(fallen){
  // The torn leaf rests on its collapsed armored housing, not a thin floor
  // decal. The solid housing communicates the unchanged 2D shot blocker.
  b('collapsed-gate-housing',1.375,.52,1.75,2.75,1.04,3.5,MAT.steel);
  b('fallen-gate-ground-rail',1.375,.09,1.75,2.75,.18,3.5,MAT.edge);
  b('fallen-gate-head-frame',1.35,1.04,.13,2.7,.22,.26,MAT.edge);
  b('fallen-gate-side-frame',2.59,1.04,1.75,.22,.22,3.42,MAT.edge);
  b('fallen-gate-side-frame',.14,1.04,1.13,.22,.22,2.16,MAT.edge);
  const a=new T.Vector3(.14,1.08,2.2),c=new T.Vector3(.46,1.44,3.13),e=new T.Vector3(2.59,1.08,3.36);
  const bent=rod(parts,a,c,.11,.11,MAT.edge);bent.name='fallen-gate-displaced-corner';
  const end=rod(parts,c,e,.11,.11,MAT.edge);end.name='fallen-gate-torn-end-frame';
  const plateGeometry=geometry('room5-broad-torn-leaf-v2',()=>{
   const flat=[[.13,.16],[2.6,.16],[2.6,2.17],[.14,2.17]];
   const bend=[[.14,2.17],[2.6,2.17],[2.6,3.34],[2.22,3.28],[2.02,2.83],[1.83,3.13],[1.47,2.68],[1.29,3.12],[.48,3.13]];
   const positions:number[]=[],uv:number[]=[];
   // Split at the bend first. Refine only its curved triangles so a lifted
   // corner cannot interpolate across the untouched flat armor.
   const face=(a:T.Vector3,b:T.Vector3,c:T.Vector3,steps:number)=>{
    if(steps){
     const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);
     face(a,ab,ca,steps-1);face(ab,b,bc,steps-1);face(ca,bc,c,steps-1);face(ab,bc,ca,steps-1);return;
    }
    for(const p of [a,b,c]){
     const lift=.39*Math.max(0,(p.z-2.17)/.96)*Math.max(0,(2.59-p.x)/2.13);
     positions.push(p.x,p.y+lift,p.z);uv.push(p.x,p.z);
    }
   };
   const point=(p:number[],y:number)=>new T.Vector3(p[0],y,p[1]);
   for(const [section,steps] of [[flat,0],[bend,3]] as const){
    const contour=section.map(p=>new T.Vector2(p[0],p[1]));
    for(const [a,b,c] of T.ShapeUtils.triangulateShape(contour,[])){
     face(point(section[a],1.17),point(section[c],1.17),point(section[b],1.17),steps);
     face(point(section[a],1.01),point(section[b],1.01),point(section[c],1.01),steps);
    }
   }
   const outline=[...flat.slice(0,3),...bend.slice(2),bend[0]];
   for(let i=0;i<outline.length;i++){
    const a=outline[i],b=outline[(i+1)%outline.length],steps=Math.max(a[1],b[1])>2.17?3:0;
    face(point(a,1.01),point(a,1.17),point(b,1.17),steps);
    face(point(a,1.01),point(b,1.17),point(b,1.01),steps);
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
  });
  const infill=new T.Mesh(plateGeometry,MAT.armor);infill.name='fallen-gate-infill';
  infill.castShadow=infill.receiveShadow=true;parts.add(infill);
  b('sheared-gate-hinge',.2,1.2,.32,.3,.18,.26,MAT.orange);
 }else if(station){
  b('station-plinth',2.5,.09,1.25,4.98,.18,2.48,MAT.black);
  b('closed-control-cabinet',2.5,.48,.46,4.8,.78,.8,MAT.steel);
  b('guard-counter',2.5,.91,1.11,4.8,.12,.72,MAT.edge);
  for(const x of [.5,4.5]){
   b('counter-pedestal',x,.49,1.51,.8,.8,1.76,MAT.steel);
   b('cabinet-door',x,.52,2.399,.66,.64,.025,MAT.edge);
   b('cabinet-handle',x,.68,2.42,.24,.035,.04,MAT.bone);
  }
  // Tucked seat makes the staffed side legible without implying a walkable bay.
  b('seat-pedestal',2.5,.32,1.92,.38,.28,.4,MAT.edge);
  b('guard-seat',2.5,.53,1.92,.84,.16,.76,MAT.bone);
  b('seat-back',2.5,.85,2.23,.84,.6,.18,MAT.bone);
  b('terminal-foot',1.76,1.005,.95,.52,.07,.36,MAT.black);
  b('terminal-stem',1.76,1.15,.94,.12,.28,.12,MAT.edge);
  b('guard-terminal',1.76,1.36,.94,.88,.49,.16,MAT.black);
  // A pale nonemissive face stays distinct without implying a live pickup.
  b('unlit-terminal-glass',1.76,1.36,1.025,.72,.34,.018,MAT.armor);
  b('terminal-keyboard',1.76,.99,1.27,.62,.04,.22,MAT.bone);
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
   // A single torn plate stays captured by the hinge strap. Its irregular
   // free edge replaces the disconnected horizontal courses of the rough.
   const remnantGeometry=geometry('room5-connected-gate-remnant-v1',()=>{
    const outline=new T.Shape();
    outline.moveTo(.3,.18);outline.lineTo(1.88,.18);
    outline.lineTo(1.62,.49);outline.lineTo(1.91,.68);
    outline.lineTo(1.35,.83);outline.lineTo(1.68,1.12);
    outline.lineTo(1.21,1.22);outline.lineTo(1.38,1.6);
    outline.lineTo(.3,1.6);outline.closePath();
    return new T.ExtrudeGeometry(outline,{depth:.14,bevelEnabled:false,steps:1});
   });
   const remnant=new T.Mesh(remnantGeometry,MAT.armor);remnant.name='forced-gate-leaf';
   remnant.position.z=d-.3;remnant.castShadow=remnant.receiveShadow=true;parts.add(remnant);
   b('gate-leaf-strap',.5,.87,d-.32,.5,1.62,.6,MAT.edge);
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
