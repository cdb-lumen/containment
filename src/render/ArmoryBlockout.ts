import * as T from 'three';
import {MAT,box,ball} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room6 rough. Four human-scale assemblies replace repeated generic rack cells.
 * The existing collision rectangles, route, room envelope and shared materials stay unchanged.
 */
export function armoryBlockout(f:Footprint,index:number):T.Group{
 const root=new T.Group(),body=new T.Group();root.add(body);
 const role=index%4;
 root.name=['armory-secured-weapons','armory-armor-fitting','armory-issue-bench','armory-ammunition-store'][role];
 const w=role===0?8.75:5.625,d=role===3?5.3125:3.125;
 const b=(x:number,y:number,z:number,ww:number,h:number,dd:number,m:T.Material,r=.035)=>box(body,x,y,z,ww,h,dd,m,r);
 // A continuous raised toe plinth gives the unchanged blocked footprint a physical owner.
 b(0,.09,0,w,.18,d,MAT.black);
 if(role===0){
  // Closed end cheeks and a lock rail enclose individual gun bays. The open front
  // exposes stocks, receivers and magazines instead of hiding them behind dense bars.
  b(0,1.14,-d/2+.16,w,2.1,.24,MAT.steel);
  for(const x of [-w/2+.1,w/2-.1])b(x,1.19,0,.2,2.2,d,MAT.edge);
  // Shallow rear cap leaves the elevated shipping view into the locked rack open.
  b(0,2.25,-d/2+.2,w,.16,.4,MAT.steel);
  b(0,.36,.2,w-.4,.14,1.8,MAT.edge);
  for(let i=0;i<3;i++){
   // Broad side profiles lean toward the elevated view, on separate backed mounts.
   const gun=new T.Group();gun.name='stored-rifle';gun.position.set(-2.65+i*2.65,1.05,.38);gun.rotation.set(-.72,0,.24);body.add(gun);
   const p=(name:string,x:number,y:number,z:number,ww:number,h:number,dd:number,m:T.Material)=>{const part=box(gun,x,y,z,ww,h,dd,m,.025);part.name=name;return part;};
    const profile=(name:string,points:number[][],depth:number,m:T.Material)=>{
     const shape=new T.Shape(points.map(([x,y])=>new T.Vector2(x,y)));
     const geometry=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.012,bevelThickness:.012,curveSegments:1});
     geometry.translate(0,0,-depth/2);geometry.computeBoundingBox();
     const center=geometry.boundingBox!.getCenter(new T.Vector3());geometry.translate(-center.x,-center.y,-center.z);
     const part=new T.Mesh(geometry,m);part.position.copy(center);part.name=name;part.castShadow=true;part.receiveShadow=true;gun.add(part);return part;
    };
    // Pale furniture surrounds a separate dark receiver. The lower grip remains
    // exposed below the small receiver clamp, not buried in a full-height pad.
    profile('stock',[[-1.08,-.17],[-1.08,.12],[-.82,.12],[-.65,.055],[-.49,.055],[-.49,-.025],[-.7,-.045],[-.83,-.17]],.15,MAT.bone);
    p('butt-pad',-1.09,-.025,0,.055,.32,.17,MAT.rubber);
    profile('receiver',[[-.52,-.09],[-.52,.105],[-.4,.16],[.14,.16],[.23,.08],[.23,-.1],[-.24,-.1],[-.34,-.05]],.22,MAT.steel);
    profile('handguard',[[.23,-.055],[.23,.13],[.51,.13],[.63,.065],[.63,-.055]],.18,MAT.bone);
    p('barrel',.85,.05,0,.52,.075,.08,MAT.black);
    p('muzzle',1.12,.05,0,.12,.13,.12,MAT.edge);
    profile('magazine',[[.075,-.085],[.25,-.085],[.28,-.33],[.21,-.44],[.065,-.4]],.14,MAT.edge);
    profile('grip',[[-.48,-.055],[-.32,-.075],[-.39,-.37],[-.55,-.34]],.15,MAT.bone);
    p('sight',-.13,.22,0,.21,.09,.09,MAT.black);
    p('cradle',-.12,.015,-.19,.5,.22,.18,MAT.rubber);
    p('retainer',-.15,.025,.16,.045,.22,.065,MAT.trim);

   // Mount bears on the shelf; the rifle stays secured rather than floating.
   b(-2.65+i*2.65,.69,.38,.28,.52,.38,MAT.edge);
  }
 }else if(role===1){
  b(0,.3,0,w-.2,.24,d-.2,MAT.steel);
  b(0,1.02,-1.22,w-.2,1.5,.2,MAT.steel);
  for(const x of [-1.55,0,1.55]){
   b(x,.79,.1,.14,1.05,.14,MAT.edge);
   b(x,1.13,.1,.54,.64,.35,MAT.rubber);
   // Neck and arm cutouts leave a shaped chest shell, not a square bib.
   const chest=new T.Shape([[-.23,-.34],[.23,-.34],[.33,-.08],[.4,.12],[.31,.31],[.16,.31],[.12,.17],[-.12,.17],[-.16,.31],[-.31,.31],[-.4,.12],[-.33,-.08]].map(([xx,yy])=>new T.Vector2(xx,yy)));
   const shell=new T.Mesh(new T.ExtrudeGeometry(chest,{depth:.14,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.018,bevelThickness:.018,curveSegments:1}),MAT.bone);
   shell.name='armor-chest';shell.position.set(x,1.18,.27);shell.castShadow=true;shell.receiveShadow=true;body.add(shell);
   // Separate waist band and shoulder caps retain the dark flexible joints.
   b(x,.81,.32,.49,.1,.2,MAT.edge);
   for(const side of [-1,1]){
    b(x+side*.4,1.38,.12,.18,.13,.2,MAT.rubber);
    const shoulder=b(x+side*.48,1.38,.17,.28,.27,.39,MAT.bone,.07);shoulder.rotation.z=side*-.4;
   }
   ball(body,x,1.68,.1,.23,.22,.23,MAT.bone);
   b(x,1.69,.29,.34,.1,.05,MAT.black,.01);
   b(x,.48,.1,.75,.12,.66,MAT.black);
  }
 }else if(role===2){
  // Low issue/work bench: open knee space, two pedestals, a supported equipment case.
  for(const x of [-w/2+.55,w/2-.55])b(x,.53,0,.9,.72,d-.25,MAT.steel);
  b(0,.96,0,w-.12,.16,d-.12,MAT.bone);
  b(-1.2,1.17,-.1,1.6,.25,.95,MAT.black);
  for(const x of [-1.72,-.68])b(x,1.18,.39,.13,.18,.07,MAT.trim);
  b(1.2,1.07,.3,1.1,.06,.85,MAT.rubber);
  b(1.2,1.15,.3,.85,.12,.3,MAT.edge);
  b(1.2,1.15,-.15,.75,.12,.12,MAT.black);
 }else{
  // Ammunition drawers and two low palletized sealed cases, not another gun rack.
  b(0,.97,-1.55,w-.25,1.58,1.8,MAT.steel);
  for(const x of [-1.75,0,1.75])for(const y of [.55,1.18]){
   b(x,y,-.62,1.55,.5,.08,MAT.edge);
   b(x,y,-.53,.45,.065,.1,MAT.black);
   b(x-.52,y,-.56,.16,.18,.04,MAT.bone,.01);
  }
  for(const x of [-1.35,1.35]){
   b(x,.3,1.25,2.3,.24,2.1,MAT.rubber);
   b(x,.72,1.25,2.15,.6,1.9,MAT.orange);
   b(x,1.06,1.25,2.22,.12,1.96,MAT.edge);
   for(const offset of [-.65,.65])b(x+offset,.75,2.23,.1,.7,.07,MAT.black);
  }
 }
 // Horizontal fit only; do not stretch human-scale heights to fill a larger cell.
 // Tiny synthetic footprint controls scale uniformly down without leaking geometry.
 const s=Math.min(1,f.width/w,f.height/d);
 body.scale.set(f.width/w,s,f.height/d);
 root.position.set(f.x+f.width/2,0,f.y+f.height/2);
 root.userData.footprint={...f};
 return root;
}
