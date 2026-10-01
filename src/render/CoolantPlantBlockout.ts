import * as T from 'three';
import {box,ring,geometry} from './meshParts';
import type {Footprint} from './ShipEnvironments';

const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const finish=(name:string,color:number,metalness:number,roughness:number,emissive=0,intensity=0)=>{
 const material=new T.MeshStandardMaterial({name:`coolant-${name}`,color,metalness,roughness,emissive,emissiveIntensity:intensity});return material;
};
/** Room-owned finishes. Never recolor shared maintenance materials. */
export const COOLANT_MAT={
 enamel:finish('enamel',0x638b86,.32,.58),
 stainless:finish('stainless',0x81908f,.72,.69),
 frame:finish('frame',0x34474b,.6,.76),
 dark:finish('dark',0x18282c,.25,.86),
 mineral:finish('mineral',0x8c8971,.05,.96),
 amber:finish('amber',0xb99558,.3,.62,0x775021,.35),
 cool:finish('cool',0x84b7b5,.25,.5,0x497e80,.45),
};
/** The plinth retains the authoritative collision rectangle. All raised parts
 * stay inside it; supply and return pass below the walkable deck. */
export function coolantPlantBlockout(footprint:Footprint,index:number):T.Group{
 const root=new T.Group(),cell=new T.Group();root.add(cell);
 root.name=index<2?'coolant-heat-exchanger':index<4?'coolant-pump-return':'coolant-service-saddle';
 const m=COOLANT_MAT;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material)=>box(cell,x,y,z,w,h,d,material,0);
 const pipe=(a:T.Vector3,c:T.Vector3,r:number,material:T.Material)=>{
  const length=a.distanceTo(c),mesh=new T.Mesh(geometry(`coolant-cylinder:${r}:${length}`,()=>new T.CylinderGeometry(r,r,length,12)),material);
  mesh.position.copy(a).add(c).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(v(0,1,0),c.clone().sub(a).normalize());mesh.castShadow=mesh.receiveShadow=true;cell.add(mesh);return mesh;
 };
 const bend=(points:T.Vector3[],radius:number)=>{
  const key=`coolant-bend:${radius}:${points.map(p=>p.toArray().join(',')).join('/')}`;
  const mesh=new T.Mesh(geometry(key,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points),12,radius,8,false)),m.stainless);mesh.castShadow=mesh.receiveShadow=true;cell.add(mesh);return mesh;
 };
 const valve=(x:number,y:number,z:number)=>{
  pipe(v(x,y-.2,z),v(x,y,z),.06,m.stainless);
  const wheel=ring(cell,x,y,z,.22,.036,m.amber);wheel.rotation.x=-Math.PI/2;
  for(const dx of [-.17,.17])pipe(v(x,y,z),v(x+dx,y,z),.025,m.amber);
 };
 b(0,.1,0,4,.2,4,m.frame);
 // Enamel side rails tie the paired skids together without a bright floor pad.
 for(const x of [-1.82,1.82])b(x,.24,0,.12,.08,3.6,m.enamel);
 if(index<2){
  for(const z of [-.95,.95]){
   b(0,.45,z,2.15,.5,.35,m.frame);
   pipe(v(0,1.28,z-.11),v(0,1.28,z+.11),.87,m.stainless);
  }
  pipe(v(0,1.28,-1.3),v(0,1.28,1.3),.82,m.enamel);
  for(const z of [-1.4,1.4]){
   pipe(v(0,1.28,z-.08),v(0,1.28,z+.08),.96,m.stainless);
   pipe(v(0,1.28,z-.09),v(0,1.28,z+.09),.77,m.enamel);
   for(let i=0;i<8;i++){
    const a=i*Math.PI/4,x=Math.cos(a)*.84,y=1.28+Math.sin(a)*.84;
    pipe(v(x,y,z-.12),v(x,y,z+.12),.055,m.dark);
   }
  }
  // Raised channel covers separate the end heads from the shell flange.
  for(const z of [-1.53,1.53])pipe(v(0,1.28,z-.035),v(0,1.28,z+.035),.64,m.frame).name='exchanger-channel-head';
  // The expansion vessel branches directly off the shell, not onto a walking route.
  b(-1.3,.36,-.15,.72,.32,.9,m.frame);
  pipe(v(-1.3,.55,-.15),v(-1.3,1.8,-.15),.34,m.enamel).name='expansion-vessel';
  for(const y of [.61,1.7])pipe(v(-1.3,y-.04,-.15),v(-1.3,y+.04,-.15),.37,m.stainless);
  pipe(v(-1.3,1.8,-.15),v(-1.3,1.96,-.15),.11,m.stainless);
  bend([v(-.68,1.28,.35),v(-1.05,1.28,.35),v(-1.3,1.16,.3),v(-1.3,.75,-.15)],.12).name='expansion-branch';
  // Curved outlet drops and a separate return riser remain within the skid.
  bend([v(0,1.28,1.52),v(0,1.25,1.7),v(0,.85,1.72),v(0,.24,1.72)],.19);
  bend([v(.7,1.1,-.85),v(1.3,1.1,-.85),v(1.48,.75,-.7),v(1.48,.24,-.7)],.16);
  valve(1.4,1.28,-.75);
  b(.84,1.25,.1,.035,.18,.55,m.cool);
  // Small scale deposits belong to the flange drain, not the walking floor.
  b(.35,.66,1.5,.12,.28,.012,m.mineral);
  b(.5,.74,1.5,.08,.12,.012,m.mineral);
 }else if(index<4){
  const firstPumpPart=cell.children.length;
  b(0,.32,0,3.3,.24,2.8,m.frame);
  // Volute lies in the YZ plane. Its impeller, coupling and motor share X.
  const voluteGeometry=geometry('coolant-volute',()=>{
   const shape=new T.Shape();shape.moveTo(.62,-.3);
   shape.bezierCurveTo(.94,.12,.58,.88,.08,.79);
   shape.bezierCurveTo(-.23,.76,-.4,.57,-.55,.43);
   shape.bezierCurveTo(-1,.05,-.64,-.68,-.12,-.68);
   shape.bezierCurveTo(.23,-.73,.5,-.57,.62,-.3);
   return new T.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.06,bevelThickness:.06,curveSegments:16});
  });
  const volute=new T.Mesh(voluteGeometry,m.enamel);volute.rotation.y=Math.PI/2;volute.position.set(-1.22,1.02,0);volute.name='pump-volute';volute.castShadow=volute.receiveShadow=true;cell.add(volute);
  pipe(v(-1.32,1.02,0),v(-1.23,1.02,0),.63,m.stainless);
  pipe(v(-1.36,1.02,0),v(-1.32,1.02,0),.48,m.frame);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,y=1.02+Math.cos(a)*.54,z=Math.sin(a)*.54;
   pipe(v(-1.4,y,z),v(-1.33,y,z),.052,m.dark);
  }
  b(-.96,.4,0,.8,.4,1.2,m.frame);
  pipe(v(-.72,1.02,0),v(.35,1.02,0),.13,m.stainless).name='motor-coupling';
  for(const x of [-.46,-.16])pipe(v(x-.065,1.02,0),v(x+.065,1.02,0),.27,m.stainless);
  pipe(v(-.39,1.02,0),v(-.23,1.02,0),.23,m.dark);
  // Open guard rails leave the two coupling flanges legible from above.
  for(const z of [-.33,.33])b(-.31,.83,z,.75,.12,.08,m.amber);
  pipe(v(.35,1.02,0),v(1.55,1.02,0),.47,m.enamel).name='pump-motor';
  for(const x of [.48,.68,.88,1.08,1.28,1.48])pipe(v(x-.025,1.02,0),v(x+.025,1.02,0),.5,m.frame);
  b(.94,.57,0,1.35,.3,1.3,m.frame);
  pipe(v(1.55,1.02,0),v(1.66,1.02,0),.43,m.stainless);
  // Tangential outlet leaves the scroll shoulder; axial suction turns below deck.
  bend([v(-.96,1.64,.43),v(-.96,1.64,1.1),v(-.96,1.3,1.55),v(-.96,.2,1.55)],.19).name='tangential-discharge';
  bend([v(-1.36,1.02,0),v(-1.65,1.02,0),v(-1.65,.85,-.9),v(-1.35,.65,-1.38),v(.7,.65,-1.38)],.17);
  valve(-.96,1.84,1.1);
  // Permanent cutaway housing exposes a ribbed basket, entirely on the skid.
  pipe(v(.7,.3,-1.38),v(.7,.48,-1.38),.33,m.frame);
  // A thick horseshoe shell leaves a wide inspection mouth, not a wire cage.
  const housingGeometry=geometry('coolant-strainer-cutaway-thick',()=>{
   const section=new T.Shape();
   section.absarc(0,0,.46,-Math.PI*2/3,Math.PI*2/3,false);
   section.lineTo(Math.cos(Math.PI*2/3)*.32,Math.sin(Math.PI*2/3)*.32);
   section.absarc(0,0,.32,Math.PI*2/3,-Math.PI*2/3,true);section.closePath();
   return new T.ExtrudeGeometry(section,{depth:.68,bevelEnabled:false,curveSegments:20});
  });
  const housing=new T.Mesh(housingGeometry,m.enamel);
  housing.rotation.x=-Math.PI/2;housing.position.set(.7,.43,-1.38);housing.name='strainer-cutaway';housing.castShadow=housing.receiveShadow=true;cell.add(housing);
  const rim=new T.Mesh(housingGeometry,m.stainless);rim.rotation.x=-Math.PI/2;rim.scale.z=.1;
  rim.position.set(.7,1.08,-1.38);rim.name='strainer-cut-rim';cell.add(rim);
  const basket=new T.Group();basket.name='strainer-basket';cell.add(basket);
  for(const y of [.5,.74,1.04]){const hoop=ring(basket,.7,y,-1.38,.28,.025,m.stainless);hoop.rotation.x=-Math.PI/2;}
  for(let i=0;i<10;i++){const a=i*Math.PI/5;pipe(v(.7+Math.cos(a)*.28,.5,-1.38+Math.sin(a)*.28),v(.7+Math.cos(a)*.28,1.04,-1.38+Math.sin(a)*.28),.022,m.stainless);}
  bend([v(.7,.65,-1.38),v(1.4,.65,-1.38),v(1.6,.4,-1.38),v(1.6,.2,-1.38)],.17);
  b(.96,1.55,0,.55,.1,.42,m.frame);
  b(1,1.61,0,.18,.025,.15,m.amber);
  b(-.57,.56,.5,.12,.15,.018,m.mineral);
  // Turn the connected assembly toward the room's service aisle. The casing
  // face now reads as a scroll from the fixed desktop camera, not its thin edge.
  const pumpAssembly=new T.Group();pumpAssembly.name='pump-service-facing-assembly';
  for(const part of cell.children.slice(firstPumpPart))pumpAssembly.add(part);
  pumpAssembly.rotation.y=Math.PI/2;cell.add(pumpAssembly);
 }else{
  // Open low frame carries two separate headers, each aligned with its covers.
  for(const x of [-1.25,1.25]){
   b(x,.51,0,.22,.62,3.35,m.frame).name='saddle-open-frame';
   b(x,.83,0,.38,.12,3.35,m.stainless);
  }
  for(const [i,z] of [-1.2,1.2].entries()){
   pipe(v(-1.78,.94,z),v(1.78,.94,z),.23,m.enamel).name=i===0?'supply-header':'return-header';
   for(const x of [-1.5,1.5])pipe(v(x-.07,.94,z),v(x+.07,.94,z),.3,m.stainless);
   // Drop ports meet the same below-deck service coordinates as the rough model.
   for(const x of [-1.8,1.8])pipe(v(x,.2,z),v(x,.94,z),.18,m.stainless);
   valve(i===0?-.55:.55,1.22,z);
  }
  b(0,.84,0,2.95,.12,1.35,m.dark);
  // Raised stencil pixels batch with the existing metal finish, no DOM or texture.
  const label=new T.Group();label.name='life-support-service-label';label.userData.text='LIFE SUPPORT';cell.add(label);
  const glyphs:Record<string,string[]>={
   L:['100','100','100','100','111'],I:['111','010','010','010','111'],
   F:['111','100','110','100','100'],E:['111','100','110','100','111'],
   S:['111','100','111','001','111'],U:['101','101','101','101','111'],
   P:['111','101','111','100','100'],O:['111','101','101','101','111'],
   R:['110','101','110','101','101'],T:['111','010','010','010','010'],
  };
  for(const [row,text] of ['LIFE','SUPPORT'].entries()){
   const pitch=.1,left=-(text.length*4-1)*pitch/2;
   for(const [i,char] of [...text].entries())for(const [y,line] of glyphs[char].entries())for(const [x,pixel] of [...line].entries()){
    if(pixel==='1')box(label,left+(i*4+x+.5)*pitch,.913,-.55+row*.62+(y+.5)*pitch,.088,.018,.088,m.stainless,0);
   }
  }
 }
 cell.scale.set(footprint.width/4,Math.min(1,footprint.width/4,footprint.height/4),footprint.height/4);
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);
 root.userData.footprint={...footprint};return root;
}
/** Accepted below-deck service network. No emissive line or raised crossing. */
export function coolantPlantServices():T.Group{
 const root=new T.Group();root.name='coolant-flush-services';
 const paths=[[[375,340],[375,560]],[[825,340],[825,560]],[[375,410],[550,410]],[[375,470],[550,470]],[[650,410],[825,410]],[[650,470],[825,470]]];
 root.userData.servicePaths=paths;
 const plane=(x:number,z:number,w:number,d:number,height:number,material:T.Material)=>{
  const mesh=new T.Mesh(geometry('coolant-flush-cover',()=>new T.PlaneGeometry(1,1)),material);
  mesh.rotation.x=-Math.PI/2;mesh.scale.set(w/32,d/32,1);mesh.position.set(x/32,height,z/32);mesh.receiveShadow=true;root.add(mesh);
 };
 for(const [[x,z],[x2,z2]] of paths){
  const horizontal=z===z2,w=horizontal?Math.abs(x2-x):16,d=horizontal?16:Math.abs(z2-z);
  plane((x+x2)/2,(z+z2)/2,w,d,.003,COOLANT_MAT.frame);
  const length=horizontal?w:d;
  for(let along=5;along<length-3;along+=8)plane(horizontal?x+along:x,horizontal?z:z+along,horizontal?2:10,horizontal?10:2,.004,COOLANT_MAT.dark);
 }
 return root;
}
