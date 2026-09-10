import * as T from 'three';
import {box,MAT} from './meshParts';
import type {Footprint} from './ShipEnvironments';

/** Room3 layout experiment. Low cutaway masses, not finished cabin equipment.
 * Heights in renderer metres: cabin 1.35, bunk/storage 1.10, packing 1.20.
 * The filled storage bases explain collision without inviting entry into a recess.
 */
export function residentialGalleryBlockout(f:Footprint,index:number):T.Group{
 const root=new T.Group(),parts=new T.Group();root.name=`residential-gallery-blockout-${index}`;root.add(parts);
 const w=f.width,d=f.height;
 // Normalized plan coordinates keep every part inside the existing reservation.
 const b=(name:string,x:number,z:number,width:number,depth:number,bottom:number,height:number,material:T.Material)=>{
  const mesh=box(parts,x*w,bottom+height/2,z*d,width*w,height,depth*d,material,0);mesh.name=name;return mesh;
 };
 if(index===0||index===2){
  // Backed, roofless cutaway cabin fronts: solid depth, end cheeks and closed south-facing doors.
  b('cabin-storage-body',.5,.47,.996,.936,0,1.12,MAT.steel);
  for(let n=0;n<3;n++){
   const x=(n+.5)/3;
   b('closed-cabin-door',x,.965,.25,.066,0,1.24,MAT.armor);
   b('door-recess',x,.999,.012,.002,.1,1.04,MAT.rubber);
   b('threshold',x,.969,.31,.058,0,.12,MAT.edge);
   b('cutaway-lintel',x,.96,.33,.076,1.24,.11,MAT.edge);
  }
  for(const x of [.018,.982])b('cabin-end',x,.5,.032,.996,0,1.35,MAT.armor);
 }else if(index===1){
  b('under-bunk-storage',.5,.5,.996,.996,0,.56,MAT.steel);
  // One human-sized empty mattress near the north opening, storage fills the deep rear.
  b('empty-mattress',.35,.205,.30,.35,.56,.16,MAT.armor);
  b('pillow',.35,.345,.25,.055,.72,.09,MAT.edge);
  b('bedside-storage',.79,.205,.414,.406,.56,.3,MAT.edge);
  for(let n=0;n<3;n++)b('rear-locker', (n+.5)/3,.705,.326,.586,.56,.44,MAT.armor);
  for(const x of [.025,.975])b('alcove-cheek',x,.5,.046,.996,.56,.54,MAT.steel);
  b('low-alcove-back',.5,.975,.95,.046,.56,.54,MAT.steel);
 }else{
  // A low packing/storage island, not an oversized single trolley.
  b('packing-storage-base',.5,.5,.996,.996,0,.4,MAT.steel);
  for(let x=1;x<3;x++)for(let z=0;z<2;z++){
   b('packed-trunk',.17+x*.33,.15+z*.29,.28,.276,.4,.42+(x+z)%2*.14,MAT.armor);
  }
  // Loaded trolley on the north-west packing base; wheels, deck and broad end handle.
  for(const x of [.10,.34])for(const z of [.10,.40])b('trolley-wheel',x,z,.035,.055,.4,.12,MAT.rubber);
  b('trolley-deck',.22,.25,.32,.39,.52,.08,MAT.edge);
  b('trolley-load',.22,.25,.28,.35,.6,.45,MAT.steel);
  for(const x of [.08,.36])b('trolley-upright',x,.445,.024,.025,.6,.6,MAT.edge);
  b('trolley-handle',.22,.445,.304,.025,1.12,.08,MAT.edge);
  // Displaced bench sits diagonally across the southern storage, within its reservation.
  b('bench-support',.52,.8,.80,.30,.4,.18,MAT.steel);
  const seat=b('displaced-bench',.52,.8,.80,.23,.58,.16,MAT.rubber);seat.rotation.y=.10;
  b('bench-end-luggage',.055,.805,.10,.35,.4,.52,MAT.armor);
 }
 root.position.set(f.x,0,f.y);root.userData.footprint={...f};return root;
}
