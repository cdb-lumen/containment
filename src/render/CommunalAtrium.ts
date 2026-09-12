import * as T from 'three';
import type {Point,RoomTemplate} from '../game/roguelike/types';
import {COMMUNAL_ATRIUM_BLOCKOUT} from '../game/roguelike/authoredRoomTopologies';
import {MAT,box,rod,batch,geometries} from './meshParts';

/** Synchronous whole-room rough, shared physical footprints with gameplay.
 * Three sides of separate garden-facing chairs gather around one planted center.
 * No optional decode path or detail-stage fittings. */
export function communalAtrium(t:RoomTemplate, fixtures=COMMUNAL_ATRIUM_BLOCKOUT):T.Group{
 const root=new T.Group();root.name='communal-atrium-rough';
 const finish=(name:string,source:T.MeshStandardMaterial,color:number,metalness:number,roughness:number)=>{
  const m=source.clone();m.name=`ca_${name}`;m.color.setHex(color);m.metalness=metalness;m.roughness=roughness;m.emissive.setHex(0);m.emissiveIntensity=0;m.userData.actorMaterial=true;return m;
 };
 const support=finish('support',MAT.steel,0x343a37,.6,.72),ceramic=finish('ceramic',MAT.bone,0x666557,.05,.87);
 const soil=finish('soil',MAT.rubber,0x30271f,0,1),leaf=finish('leaf',MAT.shell,0x486344,0,.92);
 const bark=finish('irrigation',MAT.copper,0x625344,.3,.83),seat=finish('upholstery',MAT.red,0x765747,0,.93);
 const signal=finish('welcome',MAT.amber,0xa88b59,.1,.7),water=finish('water',MAT.shellDark,0x354e4c,.25,.28);
 signal.emissive.setHex(0x9b6b32);signal.emissiveIntensity=.22;leaf.side=T.DoubleSide;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>box(root,x/32,y/32,z/32,w/32,h/32,d/32,m,0);
 const v=(x:number,y:number,z:number)=>new T.Vector3(x/32,y/32,z/32);
 const pipe=(a:T.Vector3,c:T.Vector3,r:number,m:T.Material)=>rod(root,a,c,r/32,r/32,m);
 const solid=(points:readonly Point[],bottom:number,top:number,m:T.Material,hole?:readonly Point[])=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  if(hole)shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p.x/32,-p.y/32))));
  const g=new T.ExtrudeGeometry(shape,{depth:(top-bottom)/32,bevelEnabled:false,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,bottom/32,0);
  const mesh=new T.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 };
 for(const [index,f] of fixtures.entries()){
  const footprint=[{x:f.x,y:f.y},{x:f.x+f.w,y:f.y},{x:f.x+f.w,y:f.y+f.h},{x:f.x,y:f.y+f.h}],cx=f.x+f.w/2,cz=f.y+f.h/2;
  if(f.kind==='garden'){
   const inner=footprint.map(p=>({x:p.x+(p.x<cx?5:-5),y:p.y+(p.y<cz?5:-5)}));
   solid(footprint,0,17,support);solid(footprint,17,23,ceramic,inner);solid(inner,17,19,soil);
   // Low planting pockets stay inside the shallow preflight footprint.
   for(const tx of (f.w<=96?[f.x+32,f.x+f.w-32]:Array.from({length:Math.ceil((f.w-64)/64)+1},(_,i)=>f.x+32+i*(f.w-64)/Math.ceil((f.w-64)/64)))){const tz=cz;
    pipe(v(tx,19,tz),v(tx+3,78,tz),4,bark);
    for(let i=0;i<7;i++){
     const a=i*2.4,reach=i===6?0:12,x=tx+Math.cos(a)*reach,z=tz+Math.sin(a)*8,y=68+(i%3)*7;
     pipe(v(tx+2,48+i*4,tz),v(x,y,z),2,bark);
     const g=new T.IcosahedronGeometry(1,0);g.scale(14/32,14/32,12/32);g.translate(x/32,y/32,z/32);
     const crown=new T.Mesh(g,leaf);crown.castShadow=crown.receiveShadow=true;root.add(crown);
    }
   }
   // Irrigation lies on the soil, not suspended across the room.
   pipe(v(f.x+8,21,cz),v(f.x+f.w-8,21,cz),2,bark);
  }else if(f.kind==='table'){
   // Ordinary top on four inset legs. The full tabletop is the shared solid
   // gameplay silhouette; the space underneath is not an actor passage.
   b(cx,21,cz,f.w,6,f.h,ceramic);
   for(const dx of [-f.w/2+6,f.w/2-6])for(const dz of [-f.h/2+6,f.h/2-6])b(cx+dx,9,cz+dz,8,18,8,support);
  }else if(f.kind.startsWith('seat-')){
   // A continuous seat silhouette plus inset legs, no invisible plinth.
   const alongX=f.w>f.h;
   b(cx,11.4,cz,f.w,6,f.h,seat);
   if(alongX){
    for(const dx of [-Math.min(f.w*.38,f.w/2-4),0,Math.min(f.w*.38,f.w/2-4)])b(cx+dx,4.2,cz,8,8.4,f.h-6,support);
    const backZ=f.kind==='seat-north'?f.y+3:f.y+f.h-3;
    b(cx,24.4,backZ,f.w,20,6,seat);
    for(const dx of [-f.w/2+3,f.w/2-3])b(cx+dx,18.4,cz,6,8,f.h,support);
   }else{
    for(const dz of [-Math.min(f.h*.38,f.h/2-4),0,Math.min(f.h*.38,f.h/2-4)])b(cx,4.2,cz+dz,f.w-6,8.4,8,support);
    const backX=f.kind==='seat-west'?f.x+3:f.x+f.w-3;
    b(backX,24.4,cz,6,20,f.h,seat);
    for(const dz of [-f.h/2+3,f.h/2-3])b(cx,18.4,cz+dz,f.w,8,6,support);
   }
  }else if(f.kind==='water'){
   // Refreshment counter east of the table, with an inset drinking basin
   // and upright dispenser. All support occupies its actual shared rectangle.
   solid(footprint,0,32,support);
   const circle=(radius:number)=>Array.from({length:20},(_,i)=>({x:cx+10+Math.cos(i*Math.PI/10)*radius,y:cz+Math.sin(i*Math.PI/10)*radius}));
   solid(footprint,32,36,ceramic,circle(17));solid(circle(17),32,33,water);
   b(f.x+13,44,cz,18,24,32,support);b(f.x+23,49,cz,3,10,18,ceramic);
   pipe(v(cx+12,34,cz-16),v(cx+12,44,cz-16),2,bark);pipe(v(cx+12,44,cz-16),v(cx+12,44,cz-7),2,bark);
  }else if(f.kind==='back'){
   solid(footprint,0,32,support);
  }else{
   solid(footprint,0,62,support);
   // Small welcome display beside the west garden.
   b(cx,47,f.y+f.h-.6,f.w-12,22,1,signal);
  }
 }
 // The enclosure and passage-facing seats define circulation without detached
 // floor strokes implying equivalent outer loops.
 // Room4 rear panel faces the polygon's north edge. Props above are unchanged.
 const northY=Math.min(...t.boundary!.map(p=>p.y)),north=t.boundary!.filter(p=>p.y===northY),west=Math.min(...north.map(p=>p.x)),east=Math.max(...north.map(p=>p.x));
 for(let left=west;left<east;left+=128){const right=Math.min(left+128,east),x=(left+right)/2;
  b(x,42,northY-6.08,right-left,84,12.16,support);
  b(x,42,northY-10,5,84,4,ceramic);if(Math.floor((left-west)/128)%2===0)b(x,59,northY-11,Math.min(48,right-left),18,2,ceramic);
 }
 const shared=new Set(geometries.values()),owned=new Set<T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh&&!shared.has(o.geometry))owned.add(o.geometry);});
 batch(root);owned.forEach(g=>g.dispose());return root;
}
