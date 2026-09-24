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
  for(const z of [-1,1]){
   b(-.65,.6,z,2.8,.65,.65,MAT.rubber,.22);
   for(const x of [-1.65,-.95,-.25,.45])p(v(x,.62,z-.34),v(x,.62,z+.34),.22,MAT.edge);
  }
  b(-.8,1.02,0,2.65,.38,1.6,MAT.orange,.12);
  b(-1.55,1.43,-.2,.75,.5,1.3,MAT.orange);
  const cab=b(-.65,1.67,-.47,1.1,1.16,1.05,MAT.black,.08);cab.name='cab';
  // Window framing and roof create a legible seated operator volume.
  for(const x of [-1.17,-.13])for(const z of [-.97,.03])b(x,1.76,z,.075,1.05,.075,MAT.edge,0);
  b(-.65,2.29,-.47,1.24,.12,1.22,MAT.orange);
  b(-.62,1.33,.42,.72,.18,.25,MAT.edge);
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
  // Open scoop: rear and cheek plates, floor, and separately exposed cutting teeth.
  const bucket=new T.Group();bucket.name='bucket';load.add(bucket);
  box(bucket,1.83,.37,.45,1.03,.16,1.3,MAT.edge,.02);
  box(bucket,1.38,.64,.45,.14,.6,1.3,MAT.steel,.02);
  for(const z of [-.17,1.07])box(bucket,1.82,.56,z,1.02,.44,.12,MAT.steel,.02);
  for(const z of [0,.3,.6,.9])box(bucket,2.35,.36,z,.25,.12,.16,MAT.edge,0);
  for(const x of [-1.8,.42])for(const z of [-1.5,1.5])p(v(x,.3,z),v(x,.86,z*.65),.05,MAT.edge);
 }else if(index===2){
  // Stowed lifting yoke and cable reel share a low handling skid.
  const yoke=b(-.35,.43,0,1.95,.22,.28,MAT.orange);yoke.name='lowered-yoke';
  for(const x of [-1.1,.4]){b(x,.43,0,.2,.22,1.5,MAT.orange);for(const z of [-.62,.62])ring(load,x,.65,z,.1,.025,MAT.edge).rotation.x=Math.PI/2;}
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
