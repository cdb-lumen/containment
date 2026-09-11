import * as T from 'three';
import type {Point,RoomTemplate} from '../game/roguelike/types';
import {COMMUNAL_ATRIUM_BLOCKOUT} from '../game/roguelike/authoredRoomTopologies';
import {MAT,box,rod,batch,geometries} from './meshParts';

/** Synchronous whole-room rough, shared physical footprints with gameplay.
 * Staggered north garden seating faces the main east/west passage.
 * No optional decode path or detail-stage fittings. */
export function communalAtrium(t:RoomTemplate):T.Group{
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
 for(const [index,f] of COMMUNAL_ATRIUM_BLOCKOUT.entries()){
  const footprint=t.voids![index],cx=f.x+f.w/2,cz=f.y+f.h/2;
  if(f.kind==='garden'){
   const inner=footprint.map(p=>({x:p.x+(p.x<cx?5:-5),y:p.y+(p.y<cz?5:-5)}));
   solid(footprint,0,17,support);solid(footprint,17,23,ceramic,inner);solid(inner,17,19,soil);
   // Four modest indoor trees fill shallow beds rather than tiny twigs in a
   // broad dirt disk. Crowns remain inside planted ground, away from walkers.
   for(const tx of [f.x+65,f.x+195]){
    pipe(v(tx,19,cz),v(tx+3,111,cz),4,bark);
    for(let i=0;i<7;i++){
     const a=i*2.4,reach=i===6?0:21,x=tx+Math.cos(a)*reach,z=cz+Math.sin(a)*reach,y=99+(i%3)*8;
     pipe(v(tx+2,72+i*4,cz),v(x,y,z),2,bark);
     const g=new T.IcosahedronGeometry(1,0);g.scale(19/32,14/32,17/32);g.translate(x/32,y/32,z/32);
     const crown=new T.Mesh(g,leaf);crown.castShadow=crown.receiveShadow=true;root.add(crown);
    }
   }
   // Irrigation lies on the soil, not suspended across the room.
   pipe(v(f.x+8,21,cz),v(f.x+f.w-8,21,cz),2,bark);
  }else if(f.kind.startsWith('seat-')){
   // A continuous seat silhouette plus inset legs, no invisible plinth.
   const alongX=f.w>f.h;
   b(cx,21,cz,f.w,6,f.h,seat);
   if(alongX){
    for(const dx of [-f.w*.38,0,f.w*.38])b(cx+dx,9,cz,8,18,f.h-6,support);
    const backZ=f.kind==='seat-south'?f.y+3:f.y+f.h-3;
    b(cx,34,backZ,f.w,20,6,seat);
    for(const dx of [-f.w/2+3,f.w/2-3])b(cx+dx,28,cz,6,8,f.h,support);
   }else{
    for(const dz of [-f.h*.35,f.h*.35])b(cx,9,cz+dz,f.w-6,18,8,support);
    b(f.x+f.w-3,34,cz,6,20,f.h,seat);
   }
  }else if(f.kind==='water'){
   // Refreshment counter touches the garden end, with an inset drinking basin
   // and upright dispenser. All support occupies its actual shared rectangle.
   solid(footprint,0,32,support);
   const circle=(radius:number)=>Array.from({length:20},(_,i)=>({x:cx+12+Math.cos(i*Math.PI/10)*radius,y:cz+Math.sin(i*Math.PI/10)*radius}));
   solid(footprint,32,36,ceramic,circle(19));solid(circle(19),32,33,water);
   b(f.x+13,44,cz,18,24,32,support);b(f.x+23,49,cz,3,10,18,ceramic);
   pipe(v(cx+12,34,cz-16),v(cx+12,44,cz-16),2,bark);pipe(v(cx+12,44,cz-16),v(cx+12,44,cz-7),2,bark);
  }else{
   solid(footprint,0,62,support);
   // A small running warm display backs the north garden, not a detached prop.
   b(cx,47,f.y+f.h-.6,f.w-12,22,1,signal);
  }
 }
 // The enclosure and passage-facing seats define circulation without detached
 // floor strokes implying equivalent outer loops.
 for(let x=64;x<t.width;x+=128){b(x,42,-13,126,84,12,support);b(x,42,-5,5,84,5,ceramic);if(x%256===64)b(x,59,-6,48,18,2,ceramic);}
 const shared=new Set(geometries.values()),owned=new Set<T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh&&!shared.has(o.geometry))owned.add(o.geometry);});
 batch(root);owned.forEach(g=>g.dispose());return root;
}
