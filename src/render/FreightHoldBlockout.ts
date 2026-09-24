import * as T from 'three';
import {MAT,box,rod,ring} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room7 transport loads. The solid skid deck marks each reserved footprint. */
export function freightHoldBlockout(f:Footprint,index:number):T.Group{
 const root=new T.Group(),load=new T.Group();root.add(load);root.name=`freight-load-${index}`;
 const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,r=.025)=>box(load,x,y,z,w,h,d,m,r);
 const p=(a:T.Vector3,c:T.Vector3,r:number,m:T.Material)=>rod(load,a,c,r,r,m);
 const width=index===0?5.25:index===1?5:index===2?3:index===3?8.5:4.5,depth=index===0?2.75:index===1?3.75:index===2?2:3.5;
 b(0,.13,0,width,.26,depth,MAT.steel);
 for(const z of [-depth/2+.12,depth/2-.12])b(0,.28,z,width-.16,.1,.13,MAT.edge);
 if(index===0){
  // One restrained seed pressure vessel, not another full-size machine island.
  for(const x of [-1.6,1.6])b(x,.53,0,.45,.65,2.1,MAT.rubber);
  const drum=p(v(-2.2,1.12,0),v(2.2,1.12,0),.83,MAT.orange);drum.name='seed-drum';
  for(const x of [-2.1,-1.6,1.6,2.1]){const band=ring(load,x,1.12,0,.84,.055,MAT.edge);band.rotation.y=Math.PI/2;}
  p(v(2.2,1.12,0),v(2.26,1.12,0),.34,MAT.edge);
  p(v(2.26,1.12,0),v(2.29,1.12,0),.23,MAT.black);
  for(const x of [-1.6,1.6])for(const z of [-1.13,1.13])p(v(x,.3,z),v(x,1.65,z*.5),.045,MAT.edge);
 }else if(index===1){
  // Compact tracked chassis, operator cab and folded boom; bucket rests on its skid.
  // Folded steel shoes carry the track surface; there is no solid rubber side slab.
  for(const z of [-1.18,1.18]){
   const track=new T.Group();track.name='steel-crawler';load.add(track);
   for(const x of [-1.65,-.98,-.32,.35]){
    rod(track,v(x,.64,z-.345),v(x,.64,z+.345),.295,.295,MAT.steel).name='crawler-wheel';
   }
   const section=new T.Shape();section.moveTo(-.145,.045);section.lineTo(.145,.045);
   section.lineTo(.145,-.14);section.lineTo(.085,-.14);section.lineTo(.085,-.025);
   section.lineTo(-.085,-.025);section.lineTo(-.085,-.14);section.lineTo(-.145,-.14);section.closePath();
   const shoe=(x:number,y:number,angle:number)=>{
    const geometry=new T.ExtrudeGeometry(section,{depth:.64,bevelEnabled:false});geometry.translate(0,0,-.32);
    const mesh=new T.Mesh(geometry,MAT.edge);mesh.name='folded-shoe';mesh.position.set(x,y,z);mesh.rotation.z=angle;
    mesh.castShadow=true;mesh.receiveShadow=true;track.add(mesh);
   };
   for(let i=0;i<8;i++){
    shoe(-1.65+(i+.5)*.25,.995,0);shoe(-1.65+(i+.5)*.25,.285,Math.PI);
   }
   for(const [x,direction] of [[-1.65,-1],[.35,1]])for(let i=0;i<4;i++){
    const angle=-Math.PI/2+(i+.5)*Math.PI/4;
    shoe(x+direction*.355*Math.cos(angle),.64+.355*Math.sin(angle),direction*(angle-Math.PI/2));
   }
  }
  const frame=new T.Group();frame.name='crawler-bridge';load.add(frame);
  for(const x of [-1.3,0])box(frame,x,.79,0,.38,.26,2.65,MAT.steel,.035);
  rod(frame,v(-.65,.73,0),v(-.65,.97,0),.6,.6,MAT.black);
  // Retain the linked-chassis candidate upper body and its supported rear counterweight.
  b(-.55,1.035,-.04,1.9,.25,1.25,MAT.orange,.07);
  b(.13,1.13,.45,.48,.35,.46,MAT.orange,.04);
  b(-1.48,1.25,-.12,.72,.64,1.22,MAT.orange,.2);
  const cab=new T.Group();cab.name='cab';load.add(cab);
  const cb=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{
   const part=box(cab,x,y,z,w,h,d,m,.025);part.name=name;return part;
  };
  // East-facing seat and controls, with an open near side above the boarding step.
  cb('operator-floor',-.65,1.23,-.44,1.32,.14,1.08,MAT.edge);
  cb('seat-pedestal',-.87,1.38,-.48,.35,.22,.45,MAT.steel);
  cb('operator-seat',-.78,1.52,-.48,.59,.16,.58,MAT.rubber);
  cb('operator-back',-1.06,1.77,-.48,.15,.55,.6,MAT.rubber);
  cb('control-plinth',-.15,1.5,-.5,.2,.42,.54,MAT.steel);
  cb('control-grip',-.29,1.77,-.24,.12,.16,.08,MAT.black);
  cb('boarding-step',-.65,1.04,.23,.75,.12,.35,MAT.edge);
  cb('canopy-rear',-1.18,1.85,-.7,.1,1.16,.1,MAT.edge);
  cb('canopy-front',-.14,1.85,-.85,.1,1.16,.1,MAT.edge);
  // Narrow chamfered canopy leaves the side opening and control station exposed.
  const outline=new T.Shape();outline.moveTo(-1.32,-.98);outline.lineTo(-.18,-.98);
  outline.lineTo(.02,-.77);outline.lineTo(-.16,-.22);outline.lineTo(-1.2,-.22);outline.lineTo(-1.32,-.38);outline.closePath();
  const canopyGeometry=new T.ExtrudeGeometry(outline,{depth:.1,bevelEnabled:false});
  canopyGeometry.rotateX(Math.PI/2);canopyGeometry.translate(0,2.47,0);
  const canopy=new T.Mesh(canopyGeometry,MAT.orange);canopy.name='operator-canopy';canopy.castShadow=true;canopy.receiveShadow=true;cab.add(canopy);
  // Box-section arms meet at exposed transverse pins, not round pipe elbows.
  const boomMember=(name:string,a:T.Vector3,c:T.Vector3,w:number)=>{
   const mid=a.clone().add(c).multiplyScalar(.5);
   const member=b(mid.x,mid.y,mid.z,w,a.distanceTo(c),.34,MAT.orange,.035);
   member.rotation.z=-Math.atan2(c.x-a.x,c.y-a.y);member.name=name;
  };
  boomMember('folded-boom',v(.15,1.16,.45),v(.9,2.05,.45),.42);
  boomMember('folded-stick',v(.9,2.05,.45),v(1.55,.7,.45),.32);
  for(const [name,x,y] of [['boom-base',.15,1.16],['boom-elbow',.9,2.05],['bucket-pin',1.55,.7]] as const){
   p(v(x,y,.18),v(x,y,.72),.18,MAT.edge).name=name;
   p(v(x,y,.73),v(x,y,.77),.09,MAT.black);
  }
  p(v(.22,1.33,.8),v(.57,1.63,.8),.085,MAT.black);
  p(v(.57,1.63,.8),v(.83,1.89,.8),.045,MAT.edge);
  const lock=b(.96,.64,.46,.14,.75,.8,MAT.red);lock.name='transport-lock';
  // Folded steel scoop with a chamfered heel and tapered side cheeks.
  const bucket=new T.Group();bucket.name='bucket';load.add(bucket);
  const plate=(name:string,points:number[][],z:number,depth:number,m:T.Material)=>{
   const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
   const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false});geometry.translate(0,0,z);
   const mesh=new T.Mesh(geometry,m);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;bucket.add(mesh);
  };
  plate('scoop-shell',[[1.31,.94],[1.31,.52],[1.48,.29],[2.36,.29],[2.36,.43],[1.62,.43],[1.49,.58],[1.49,.94]],-.2,1.3,MAT.edge);
  for(const z of [-.2,.98])plate('scoop-cheek',[[1.32,.92],[1.64,.88],[2.37,.43],[2.37,.3],[1.48,.3],[1.32,.48]],z,.12,MAT.steel);
  const lip=box(bucket,2.29,.39,.45,.17,.12,1.3,MAT.armor,.01);lip.name='cutting-lip';
  for(const [i,z] of [0,.3,.6,.9].entries()){
   plate(`cutting-tooth-${i}`,[[2.24,.45],[2.475,.34],[2.475,.3],[2.24,.33]],z-.08,.16,MAT.armor);
  }
  for(const z of [.19,.65])box(bucket,1.5,.71,z,.38,.3,.1,MAT.orange,.025);
  for(const x of [-1.8,.42])for(const z of [-1.5,1.5])p(v(x,.3,z),v(x,.86,z*.65),.05,MAT.edge);
 }else if(index===2){
  // A stowed spreader with two pinned bow shackles, not a bare H-frame.
  const yoke=b(-.39,.55,-.12,2.02,.5,.34,MAT.orange);yoke.name='lowered-yoke';
  for(const x of [-1.08,.3])b(x,.35,-.35,.48,.18,.65,MAT.rubber);
  const shackles=new T.Group();shackles.name='load-shackles';load.add(shackles);
  for(const x of [-1.08,.3]){
   const bow=new T.Mesh(new T.TorusGeometry(.28,.09,8,16,Math.PI),MAT.edge);
   bow.rotation.x=Math.PI/2;bow.position.set(x,.45,.47);bow.name='shackle-bow';shackles.add(bow);
   // Rounded forged shoulders taper into the retained bow arms.
   for(const side of [-1,1]){
    rod(shackles,v(x+side*.28,.45,.47),v(x+side*.28,.45,.29),.09,.135,MAT.edge);
    const profile=[new T.Vector2(.105,-.13),new T.Vector2(.13,-.13),
     new T.Vector2(.17,-.1),new T.Vector2(.205,-.05),new T.Vector2(.215,0),
     new T.Vector2(.205,.05),new T.Vector2(.17,.1),new T.Vector2(.13,.13),
     new T.Vector2(.105,.13),new T.Vector2(.105,-.13)];
    const geometry=new T.LatheGeometry(profile,24);geometry.rotateZ(Math.PI/2);
    const eye=new T.Mesh(geometry,MAT.edge);eye.position.set(x+side*.28,.45,.22);
    eye.name='shackle-eye';eye.castShadow=true;eye.receiveShadow=true;shackles.add(eye);
   }
   // The pin crosses a bored lug connected to the beam, with one quiet end cap.
   const lug=new T.Shape();lug.moveTo(.17,-.18);lug.lineTo(-.22,-.18);
   lug.absarc(-.22,0,.18,-Math.PI/2,-Math.PI*1.5,true);lug.lineTo(.17,.18);lug.closePath();
   const bore=new T.Path();bore.absarc(-.22,0,.105,0,Math.PI*2,true);lug.holes.push(bore);
   const geometry=new T.ExtrudeGeometry(lug,{depth:.3,bevelEnabled:false,curveSegments:16});
   geometry.rotateY(Math.PI/2);geometry.translate(x-.15,.45,0);
   const mesh=new T.Mesh(geometry,MAT.orange);mesh.name='beam-lug';mesh.castShadow=true;mesh.receiveShadow=true;shackles.add(mesh);
   p(v(x-.42,.45,.22),v(x+.42,.45,.22),.095,MAT.armor).name='shackle-pin';
   p(v(x+.42,.45,.22),v(x+.46,.45,.22),.11,MAT.steel);
  }
  // One open arch continues into a broad beam-mounted foot without a central post.
  const eye=new T.Shape();eye.moveTo(-.94,.75);eye.lineTo(.16,.75);
  eye.lineTo(.16,.88);eye.lineTo(.07,.88);eye.lineTo(.07,1.34);
  eye.quadraticCurveTo(.07,1.78,-.39,1.78);
  eye.quadraticCurveTo(-.85,1.78,-.85,1.34);
  eye.lineTo(-.85,.88);eye.lineTo(-.94,.88);eye.closePath();
  const bore=new T.Path();bore.moveTo(-.73,.9);bore.lineTo(-.73,1.34);
  bore.quadraticCurveTo(-.73,1.65,-.39,1.65);
  bore.quadraticCurveTo(-.05,1.65,-.05,1.34);bore.lineTo(-.05,.9);bore.closePath();eye.holes.push(bore);
  const eyeGeometry=new T.ExtrudeGeometry(eye,{depth:.16,bevelEnabled:false,curveSegments:12});
  eyeGeometry.translate(0,0,-.2);
  const pickup=new T.Mesh(eyeGeometry,MAT.edge);pickup.name='master-link';
  pickup.castShadow=true;pickup.receiveShadow=true;load.add(pickup);
  p(v(.94,.67,-.56),v(.94,.67,.56),.37,MAT.black);
  for(const z of [-.56,.56])p(v(.94,.67,z-.025),v(.94,.67,z+.025),.48,MAT.edge);
 }else{
  const cases=new T.Group();cases.name='freight-cases';load.add(cases);
  const count=index===3?4:2,step=(width-.2)/count;
  for(let i=0;i<count;i++){
   const x=-width/2+.1+step*(i+.5),rise=i%2===0?0:.35;
   // Repeat the accepted construction while retaining alternating case heights.
   const cargoCase=new T.Group();cargoCase.name=`freight-case-${i}`;cases.add(cargoCase);
   const cw=step-.12,cd=depth-.35;
   box(cargoCase,x,.96+rise/2,0,cw,1.32+rise,cd,MAT.armor,.06);
   const seat=box(cargoCase,x,1.65+rise,0,cw,.06,cd,MAT.black,0);seat.name='case-lid-seat';
   const rim=new T.Group();rim.name='case-rim';cargoCase.add(rim);
   for(const side of [-1,1]){
    box(rim,x+side*(cw/2-.06),1.7+rise,0,.12,.12,cd,MAT.edge,.012);
    box(rim,x,1.7+rise,side*(cd/2-.06),cw-.24,.12,.12,MAT.edge,.012);
   }
   const lid=box(cargoCase,x,1.76+rise,0,cw-.42,.16,cd-.42,MAT.steel,.04);lid.name='case-inset-lid';
   for(const side of [-1,1]){
    const sx=x+side*.55,strap=box(cargoCase,sx,1.855+rise,0,.13,.04,cd-.1,MAT.orange,.01);
    strap.name=side<0?'case-strap-left':'case-strap-right';
    for(const z of [-1,1]){
     box(cargoCase,sx,1.08+rise/2,z*(cd/2-.015),.13,1.56+rise,.065,MAT.orange,.01);
     box(cargoCase,sx,1.53+rise,z*(cd/2+.025),.23,.22,.11,MAT.black,.025);
     box(cargoCase,sx,1.54+rise,z*(cd/2+.085),.13,.1,.02,MAT.edge,.005);
    }
   }
  }
 }
 root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(load,true),size=bounds.getSize(v(0,0,0));
 load.scale.set(f.width/size.x,Math.min(1,f.width/width,f.height/depth),f.height/size.z);
 load.position.set(-bounds.min.x*load.scale.x,-bounds.min.y*load.scale.y,-bounds.min.z*load.scale.z);
 root.position.set(f.x,0,f.y);root.userData.footprint={...f};return root;
}

/** Two storage rows frame a clear cross-ship handling aisle. */
export function freightBayMarkings():T.Group{
 const root=new T.Group();root.name='freight-bay-markings';
 for(const [x,z,w,d] of [[244,164,662,190],[244,514,652,200]]){
  for(const side of [-1,1]){
   const a=box(root,(x+w/2+side*w/2)/32,-.007,(z+d/2)/32,.04,.018,d/32,MAT.trim,0);
   const b=box(root,(x+w/2)/32,-.007,(z+d/2+side*d/2)/32,w/32,.018,.04,MAT.trim,0);
   a.castShadow=false;b.castShadow=false;
  }
 }
 return root;
}
