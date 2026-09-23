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
   p('stock',-.79,-.04,0,.55,.32,.18,MAT.bone);
   p('stock-neck',-.47,.02,0,.2,.13,.14,MAT.edge);
   p('receiver',-.14,.02,0,.55,.25,.22,MAT.edge);
   p('handguard',.36,.03,0,.5,.19,.2,MAT.bone);
   p('barrel',.85,.05,0,.52,.075,.08,MAT.black);
   p('muzzle',1.12,.05,0,.12,.13,.12,MAT.edge);
   p('magazine',.02,-.27,0,.19,.4,.15,MAT.black).rotation.z=.16;
   p('grip',-.35,-.23,0,.13,.3,.14,MAT.rubber).rotation.z=-.25;
   p('sight',-.13,.21,0,.25,.1,.1,MAT.black);
   p('cradle',-.12,0,-.19,.7,.65,.18,MAT.rubber);
   p('retainer',-.15,.01,.15,.065,.3,.08,MAT.trim);
   // Mount bears on the shelf; the rifle stays secured rather than floating.
   b(-2.65+i*2.65,.69,.38,.28,.52,.38,MAT.edge);
  }
 }else if(role===1){
  b(0,.3,0,w-.2,.24,d-.2,MAT.steel);
  b(0,1.02,-1.22,w-.2,1.5,.2,MAT.steel);
  for(const x of [-1.55,0,1.55]){
   b(x,.79,.1,.14,1.05,.14,MAT.edge);
   b(x,1.13,.1,.65,.68,.35,MAT.rubber);
   b(x,1.18,.33,.55,.46,.17,MAT.bone);
   for(const side of [-1,1]){const shoulder=b(x+side*.4,1.38,.15,.28,.22,.4,MAT.bone);shoulder.rotation.z=side*-.3;}
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
