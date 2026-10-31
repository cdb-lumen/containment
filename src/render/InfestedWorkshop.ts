import * as T from 'three';
import {box,rod,ring,shell} from './meshParts';
import {WORKSHOP_MAT as MAT} from './InfestedWorkshopMaterials';
import type {Footprint} from './ShipEnvironments';

/** Room15 stage4: attached resin braces and a damaged, supported lathe assembly. */
export function infestedWorkshop(footprint:Footprint,index:number):T.Group{
 const root=new T.Group(),cell=new T.Group();root.add(cell);
 const roles=['lathe-manipulator','fixture-bench','gantry','stock-cabinet'];
 root.name=`workshop-${roles[index%4]}`;
 const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 const b=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material=MAT.steel)=>{
  const mesh=box(cell,x,y,z,w,h,d,m,.025);mesh.name=name;return mesh;
 };
 const link=(name:string,a:T.Vector3,c:T.Vector3,r:number,m:T.Material=MAT.edge)=>{
  const mesh=rod(cell,a,c,r,r,m);mesh.name=name;return mesh;
 };
 // Closed flattened webs flare into their supports. Unequal widths and skewed
 // ridges break the parallel cable silhouette without scattering loose tendrils.
 const web=(name:string,points:T.Vector3[],widths:number[],owners:string[],side=v(1,0,0))=>{
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[],sides=8;
  const normals=points.map((_,i)=>new T.Vector3().crossVectors(side,
   points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)])).normalize());
  points.forEach((p,row)=>{
   const normal=normals[row];
   for(let j=0;j<=sides;j++){
    const angle=j/sides*Math.PI*2;
    const q=p.clone().addScaledVector(side,Math.cos(angle)*widths[row])
     .addScaledVector(normal,Math.sin(angle)*(.045+widths[row]*.12));
    vertices.push(q.x,q.y,q.z);uv.push(j/sides*.08,row/(points.length-1)*.3);
    if(row<points.length-1&&j<sides){const a=row*(sides+1)+j,c=a+sides+1;indices.push(a,c,a+1,a+1,c,c+1);}
   }
  });
  for(let j=1;j<sides-1;j++){
   indices.push(0,j+1,j);const last=(points.length-1)*(sides+1);indices.push(last,last+j,last+j+1);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  // The existing world batcher retires room-owned UV geometry after copying it.
  geometry.userData.environmentUV=true;
  const mesh=new T.Mesh(geometry,MAT.flesh);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;cell.add(mesh);
  mesh.userData.widths=widths;
  mesh.userData.anchors=[{point:points[0].toArray(),owner:owners[0]},{point:points.at(-1)!.toArray(),owner:owners[1]}];
  // A single raised seam avoids the previous parallel striped fringe.
  const fiber=points.map((p,i)=>p.clone().addScaledVector(side,widths[i]*.15).addScaledVector(normals[i],.065));
  for(let i=1;i<fiber.length;i++)link('resin-fiber',fiber[i-1],fiber[i],.035,MAT.flesh);
 };
 const rib=(x:number,z:number,top:number)=>{
  const a=v(x-.12,.42,z+.09),mid=v(x,.95,z+.1),end=v(x+.12,top,z-.08);
  link('directional-resin',a,mid,.11,MAT.flesh);
  link('directional-resin',mid,end,.085,MAT.flesh);
  for(const offset of [-.065,0,.065]){
   const shift=v(offset,.012,.075);
   link('resin-fiber',a.clone().add(shift),mid.clone().add(shift),.019,MAT.flesh);
   link('resin-fiber',mid.clone().add(shift),end.clone().add(shift),.014,MAT.flesh);
  }
 };
 if(index%4===0){
  // Long axis follows the original northwest island, operator faces south.
  for(const x of [-1.7,1.7])b('pedestal',x,.47,0,.9,.94,1.35,MAT.black);
  b('lathe-bed',0,.94,0,4.8,.32,1.45);
  b('way-front',.2,1.16,.39,3.8,.13,.15,MAT.edge);
  b('way-rear',.2,1.16,-.39,3.8,.13,.15,MAT.edge);
  b('headstock',-1.78,1.55,0,1.12,1.1,1.2,MAT.trim);
  link('chuck',v(-1.15,1.67,0),v(-.8,1.67,0),.41,MAT.edge);
  for(const a of [0,Math.PI*2/3,Math.PI*4/3]){
   b('chuck-jaw',-.77,1.67+Math.sin(a)*.24,Math.cos(a)*.24,.16,.14,.14,MAT.black);
  }
  b('carriage',.55,1.31,0,.92,.23,1.22,MAT.trim);
  b('cross-slide',.55,1.5,.08,.5,.18,.74,MAT.edge);
  b('tool-post',.55,1.72,.32,.22,.3,.25,MAT.black);
  b('cutting-tool',.33,1.79,.19,.55,.07,.09,MAT.edge);
  b('tailstock',1.7,1.51,0,.65,.72,.67,MAT.trim);
  link('tailstock-center',v(1.2,1.67,0),v(1.55,1.67,0),.09);
  const wheel=ring(cell,.56,1.3,.79,.23,.045,MAT.edge);wheel.name='carriage-handwheel';
  // The rear half remains hinged. The ragged front lip folds away from the chuck.
  const outline=new T.Shape();outline.moveTo(-.66,0);outline.lineTo(.59,0);outline.lineTo(.59,.5);
  outline.lineTo(.32,.43);outline.lineTo(.22,.62);outline.lineTo(.04,.45);outline.lineTo(-.14,.55);
  outline.lineTo(-.26,.38);outline.lineTo(-.46,.58);outline.lineTo(-.66,.49);outline.closePath();
  const guard=new T.Mesh(new T.ExtrudeGeometry(outline,{depth:.07,bevelEnabled:false}),MAT.trim);
  guard.geometry.userData.environmentUV=true;
  guard.name='broken-guard';guard.position.set(-1.21,1.96,-.57);guard.rotation.x=-.65;guard.castShadow=true;cell.add(guard);
  b('guard-stump',-.71,1.83,-.54,.12,.5,.12,MAT.edge);
  link('guard-hinge',v(-1.86,1.98,-.54),v(-.61,1.98,-.54),.065,MAT.edge);
  const fold=b('guard-fold',-1.57,2.28,-.84,.48,.07,.35,MAT.trim);fold.rotation.z=.35;
  link('guard-torn-edge',v(-1.67,2.3,-.79),v(-1.4,2.38,-.87),.033,MAT.edge);
  // A rear bolted shoulder supports a bent two-link arm, not a floating arch.
  b('arm-foot',.72,1.17,-.83,.75,.24,.48,MAT.black);
  link('arm-column',v(.72,1.2,-.83),v(.72,2.08,-.83),.18,MAT.trim);
  const shoulder=v(.72,2.05,-.83),elbow=v(-.12,2.92,-.62),wrist=v(-.2,2.24,0);
  link('arm-upper',shoulder,elbow,.16,MAT.trim);
  link('arm-forearm',elbow,wrist,.12,MAT.trim);
  for(const p of [shoulder,elbow,wrist])link('arm-hinge',p.clone().add(v(0,0,-.15)),p.clone().add(v(0,0,.15)),.23,MAT.edge);
  // The brace bows outboard of the column so its span is not buried in the arm.
  // Both broad cuffs intersect their mechanical owners and the membrane ends.
  web('tendon-brace',[v(.98,1.24,-.83),v(1.28,1.65,-.68),v(.91,2.23,-.58),v(.04,2.75,-.66)],
   [.29,.22,.18,.27],['arm-foot','arm-upper']);
  const footCuff=shell(cell,.98,1.27,-.83,.32,.18,.25,MAT.flesh);footCuff.name='tendon-foot-cuff';
  const armCuff=shell(cell,.04,2.75,-.66,.27,.2,.23,MAT.flesh);armCuff.name='tendon-arm-cuff';
  // Coaxial stock is seated in the chuck and tailstock. Opposed gripper pads
  // close around it from front and rear, with a supported wrist crosshead.
  b('gripper-crosshead',-.2,2.2,0,.35,.16,.76,MAT.black);
  for(const [z,name] of [[-.28,'left'],[.28,'right']] as const){
   link('gripper',v(-.2,2.2,z),v(-.2,1.68,z),.065,MAT.black);
   b(`gripper-pad-${name}`,-.2,1.67,z,.32,.22,.34,MAT.black);
  }
  link('suspended-workpiece',v(-.87,1.67,0),v(1.25,1.67,0),.16,MAT.copper);
  // Thick connected lobes climb the operator face and fold across the roof.
  // The upper contact occupies the visible top plane, not only the front lip.
  web('directional-resin',[v(-1.98,1.02,.56),v(-1.97,1.6,.68),v(-1.99,2.16,.57),v(-1.96,2.17,.04),v(-1.96,2.06,-.3)],
   [.34,.31,.36,.29,.27],['lathe-bed','headstock']);
  web('directional-resin',[v(-1.42,1.04,.52),v(-1.56,1.55,.68),v(-1.63,2.16,.57),v(-1.69,2.18,.15),v(-1.63,2.06,-.19)],
   [.25,.23,.27,.22,.21],['lathe-bed','headstock']);
  // Broad attached apron establishes the fixed machine mass at gameplay scale.
  b('bed-apron',-.1,.74,.69,4.25,.36,.12,MAT.steel);
  for(const x of [-1.8,-1.48])b('apron-worn-paint',x,.76,.765,.22,.25,.025,MAT.trim);
  link('wet-resin-seam',v(-2.03,1.42,.66),v(-1.97,1.75,.64),.018,MAT.wet);
  const socket=shell(cell,.78,1.3,-.76,.3,.13,.42,MAT.flesh);socket.name='asymmetric-growth-socket';
  // The torn supply runs across the exposed rear shoulder, above the bed.
  // One end enters the column. The other returns to the foot, with a wide gap.
  b('cable-clamp',.82,2.01,-.96,.22,.34,.32,MAT.edge);
  link('insulation-cut-stub',v(.72,2.02,-.94),v(1.32,2.02,-.94),.14,MAT.rubber);
  link('insulation-return',v(.99,1.22,-.97),v(1.91,1.55,-.94),.16,MAT.rubber);
  const flap=b('peeled-insulation',2.01,1.48,-.88,.38,.44,.1,MAT.rubber);flap.rotation.z=-.55;
  for(let i=0;i<3;i++){
   link('cut-copper-end',v(1.28,2.02,-1.02+i*.08),v(1.55,2.05,-1.02+i*.08),.036,MAT.copper);
  }
  // Coarse missing-paint patches only, not final surface texturing.
  b('chipped-yellow',-1.96,2.106,.12,.35,.014,.25,MAT.steel);
  b('chipped-yellow',1.75,1.875,.08,.23,.014,.24,MAT.steel);
 }else if(index%4===1){
  for(const x of [-1.55,1.55])for(const z of [-1.1,1.1])b('bench-leg',x,.5,z,.26,1,.26,MAT.black);
  b('fixture-table',0,1.12,0,3.6,.24,2.7);
  for(const x of [-1,0,1])b('fixture-slot',x,1.25,0,.07,.025,2.35,MAT.black);
  for(const x of [-.8,.8])b('vise-jaw',x,1.46,0,.28,.42,.9,MAT.trim);
  link('vise-screw',v(-1.35,1.4,0),v(1.35,1.4,0),.08);
  rib(-1.5,-.8,1.2);
 }else if(index%4===2){
  b('gantry-base',0,.13,0,2.8,.26,5.4,MAT.black);
  for(const z of [-2,2]){
   for(const x of [-1,1])b('gantry-upright',x,1.2,z,.25,2.4,.28,MAT.trim);
   b('gantry-crossbeam',0,2.4,z,2.4,.25,.4);
  }
  for(const x of [-.75,.75])b('gantry-rail',x,2.58,0,.14,.18,4.5,MAT.edge);
  b('gantry-slider',0,2.7,-.55,1.8,.18,.55,MAT.trim);
  link('gantry-tool',v(0,2.65,-.55),v(0,1.3,-.55),.12);
  b('gantry-fixture',0,.52,0,1.3,.6,1.6);
  rib(-1,1.7,2.3);
 }else{
  b('stock-cabinet',0,1,0,3.2,2,1.3);
  for(const y of [.35,.85,1.35,1.85]){
   b('drawer',0,y,.7,2.9,.37,.1,MAT.trim);
   b('drawer-handle',0,y,.8,.7,.07,.1,MAT.black);
  }
  b('stock-cradle',0,2.1,0,2.9,.2,1.2,MAT.black);
  for(const z of [-.33,0,.33])link('retained-stock',v(-1.3,2.3,z),v(1.3,2.3,z),.11,MAT.edge);
  rib(1.2,.58,1.8);
 }
 // Fit actual vertices to the stage1 inner reservation, eight units from solids.
 cell.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(cell,true),size=bounds.getSize(v(0,0,0)),center=bounds.getCenter(v(0,0,0));
 const w=Math.max(footprint.width-.5,footprint.width*.5),d=Math.max(footprint.height-.5,footprint.height*.5);
 cell.scale.set(w/size.x,Math.min(1,w/size.x,d/size.z),d/size.z);
 cell.position.set(-center.x*cell.scale.x,-bounds.min.y*cell.scale.y,-center.z*cell.scale.z);
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);
 root.userData.footprint={...footprint};return root;
}
