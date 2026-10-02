import * as T from 'three';
import {box,rod,geometry} from './meshParts';
import {WORKSHOP_MAT as MAT} from './InfestedWorkshopMaterials';

/** Room-local rear wall and flush deck. No geometry enters actor volume. */
export function infestedWorkshopArchitecture(parent:T.Group,w:number,h:number){
 const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 const inlay=(name:string,x:number,z:number,width:number,depth:number,material:T.Material)=>{
  const mesh=new T.Mesh(geometry('workshop-deck-plane',()=>new T.PlaneGeometry(1,1)),material);
  mesh.name=name;mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.003,z);mesh.scale.set(width,depth,1);mesh.receiveShadow=true;parent.add(mesh);
 };
 // Sparse panel joints replace the disconnected green-black growth puddles.
 for(let x=3;x<w;x+=6)inlay('workshop-deck-seam',x,h/2,.025,h-.6,MAT.black);
 // Faded threshold paint stays at the perimeter, never suggests a hazard zone.
 for(const z of [.48,h-.48])for(let x=2;x<w-1;x+=5){
  inlay('workshop-threshold-paint',x,z,1.1,.055,MAT.trim);
 }
 for(let x=2;x<w;x+=4){
  const panel=box(parent,x,1.32,-.43,Math.min(3.94,w-x+2),2.64,.34,MAT.steel,.04);panel.name='workshop-rear-cassette';
  box(parent,x,1.32,-.18,.2,2.64,.18,MAT.black,.025);
  box(parent,x,.36,-.19,3.7,.38,.14,MAT.trim,.02);
  box(parent,x,2.3,-.2,3.7,.12,.13,MAT.edge,.02);
 }
 // One service run remains useful; growth grips only its left wall attachment.
 rod(parent,v(.3,1.65,-.18),v(w-.3,1.65,-.18),.055,.055,MAT.copper);
 for(let i=0;i<4;i++){
  const x=3+i*.17;
  rod(parent,v(x-.2,.3,-.17),v(x,1.25,-.14),.045,.075,MAT.flesh);
  rod(parent,v(x,1.25,-.14),v(x+.35,1.85,-.16),.03,.045,MAT.flesh);
 }
}
