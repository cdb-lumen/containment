import * as T from 'three';
import {diagnosticConsolePolygon} from '../game/roguelike/diagnosticGalleryLayout';
import type {Point} from '../game/roguelike/types';

/** Room-local cutaway and instrument banks. No shared assets or interactions. */
export function diagnosticGalleryModels():T.Group{
 const root=new T.Group();root.name='diagnostic-gallery-rough-models';
 const mat=(color:number,emissive=0)=>{const m=new T.MeshStandardMaterial({color,roughness:.7,metalness:.25,emissive,emissiveIntensity:emissive?.45:0});m.userData.actorMaterial=true;return m;};
 const teal=mat(0x476466),ivory=mat(0xb8b7a3),dark=mat(0x172b31),edge=mat(0x738589),amber=mat(0xd69d4b,0xcb822f),cryo=mat(0x67a99e,0x327b70);
 let owner='physical-ship-cutaway';
 const add=(name:string,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0)=>{const mesh=new T.Mesh(g,m);mesh.name=`diagnostic-${name}`;mesh.userData.solidId=owner;mesh.position.set(x/32,y/32,z/32);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 const box=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>add(name,new T.BoxGeometry(w/32,h/32,d/32),m,x,y,z);
 const slab=(name:string,points:readonly Point[],height:number,thickness:number,m:T.Material)=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  const mesh=add(name,new T.ExtrudeGeometry(shape,{depth:thickness/32,steps:1,bevelEnabled:false}),m,0,height,0);mesh.rotation.x=-Math.PI/2;return mesh;
 };
 const pipe=(name:string,a:number[],b:number[],radius:number,m:T.Material)=>{
  const p=new T.Vector3(...a.map(v=>v/32) as [number,number,number]),q=new T.Vector3(...b.map(v=>v/32) as [number,number,number]);
  const mesh=add(name,new T.CylinderGeometry(radius/32,radius/32,p.distanceTo(q),8),m);mesh.position.copy(p).add(q).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return mesh;
 };
 // Sealed pedestal, stern at west, pointed bow at east. No floor opening.
 box('physical-ship-cutaway',600,9,150,396,18,116,dark);
 slab('ship-hull',[{x:411,y:99},{x:741,y:99},{x:789,y:150},{x:741,y:201},{x:411,y:201}],18,8,teal);
 box('stern-frame',416,39,150,7,42,99,ivory);
 // Steel terminal sockets meet the flush service trenches at the pedestal.
 for(const [side,x] of [['west',408],['east',792]] as const)box(`${side}-board-socket`,x,9,190,12,18,16,edge);
 // Three stepped deck plates expose each face to the south approach.
 const decks=[{z:179,h:28,width:345},{z:149,h:43,width:361},{z:119,h:58,width:337}];
 for(const [i,d] of decks.entries()){
  box(`deck-${i}`,594,d.h,d.z,d.width,6,26,ivory);
  box(`deck-recess-${i}`,596,d.h+4,d.z,d.width-18,2,20,dark);
  box(`purge-branch-${i}`,580,d.h+6,d.z,265,3,4,amber);
  // End nodes make the common bus physically terminate on every deck.
  box(`purge-node-${i}`,715,d.h+7,d.z,9,5,12,amber);
  if(i<2)for(const x of [522,564,606,648]){
   box(`system-module-${i}-${x}`,x,d.h+8,d.z-5,27,8,9,teal);
  }
 }
 // Diagonal hardwired spine behind a partial guard, joining all three plates.
 pipe('purge-bus',[450,34,179],[450,64,119],3,amber);
 box('bus-cover',435,52,141,10,35,70,teal);
 for(const z of [119,149,179])box(`bus-clamp-${z}`,450,34+(179-z)/2,z,13,3,5,edge);
 // Tapered berth shells and separated limbs read as occupied pods at room scale.
 // Keep the four centers, feed connections and upper-deck footprint unchanged.
 for(const [i,x] of [510,553,596,639].entries()){
  const berth=(length:number,width:number)=>[
   {x:x-length/2,y:114},{x:x-length/2+6,y:118-width/2},
   {x:x+length/2-6,y:118-width/2},{x:x+length/2,y:114},
   {x:x+length/2,y:122},{x:x+length/2-6,y:118+width/2},
   {x:x-length/2+6,y:118+width/2},{x:x-length/2,y:122},
  ];
  slab(`occupied-cryo-${i}`,berth(40,22),62,6,cryo);
  slab(`cryo-window-${i}`,berth(35,17),68,.8,dark);
  const head=add(`cryo-head-${i}`,new T.SphereGeometry(3.5/32,10,8),ivory,x-12,72,118);head.scale.y=.65;
  slab(`cryo-person-${i}`,[{x:x-7.5,y:114},{x:x+1,y:115},{x:x+2,y:118},{x:x+1,y:121},{x:x-7.5,y:122}],69,4,ivory);
  for(const [side,z] of [['far',-1],['near',1]] as const){
   box(`cryo-arm-${side}-${i}`,x-2,71,118+z*6,10,3,2.5,ivory);
   box(`cryo-leg-${side}-${i}`,x+9,71,118+z*2.75,13,3,3,ivory);
  }
  box(`cryo-feed-${i}`,x,66,129,4,3,5,amber);
 }
 // Recessed cabinets support separate sloped instrument housings. The plinth
 // retains the approved solid footprint; all controls face the inner theatre.
 for(const [id,start,end] of [['west-low-console',112,155],['east-low-console',25,68]] as const){
  owner=id;
  slab(id,diagnosticConsolePolygon(start+.3,end-.3,301,349),0,4,dark);
  slab(`${id}-cabinet`,diagnosticConsolePolygon(start+.6,end-.6,307,343),4,19,teal);
  slab(`${id}-top`,diagnosticConsolePolygon(start+.6,end-.6,303,347),23,2,edge);
  // Inner-face drop descends from the real cabinet to its service trench.
  // Entire raised section remains inside the approved console solid.
  const side=id==='west-low-console'?'west':'east',dropX=side==='west'?346:854;
  box(`${side}-service-drop`,dropX,11.5,398,12,23,12,edge);
  for(let i=0;i<5;i++){
   const a=(start+5+(end-start-10)*i/4)*Math.PI/180;
   const x=600+325*Math.cos(a),z=220+325*Math.sin(a),angle=Math.PI/2-a;
   const housing=new T.BoxGeometry(36/32,1,40/32);
   const vertices=housing.getAttribute('position');
   for(let j=0;j<vertices.count;j++)vertices.setY(j,(vertices.getY(j)>0?32+vertices.getZ(j)*8:23)/32);
   housing.computeVertexNormals();
   const hood=add(`${id}-instrument-hood-${i}`,housing,ivory,x,0,z);hood.rotation.y=angle;
   const slope=Math.atan(.25);
   // Local Z points outwards. Controls sit on, and tilt with, the wedge face.
   const mounted=(name:string,g:T.BufferGeometry,m:T.Material,u:number,v:number,lift:number)=>{
    const h=32+v*.25+lift;
    const mesh=add(`${id}-${name}-${i}`,g,m,x+u*Math.cos(angle)+v*Math.sin(angle),h,z-u*Math.sin(angle)+v*Math.cos(angle));
    mesh.quaternion.setFromEuler(new T.Euler(-slope,angle,0,'YXZ'));return mesh;
   };
   mounted('gauge-recess',new T.BoxGeometry(30/32,.8/32,32/32),dark,0,0,.4);
   mounted('gauge-rim',new T.CylinderGeometry(8.5/32,8.5/32,1.5/32,16),edge,-4,5,1.3);
   mounted('gauge',new T.CylinderGeometry(6.5/32,6.5/32,1.6/32,16),cryo,-4,5,2);
   const needle=mounted('needle',new T.BoxGeometry(1.6/32,.8/32,8/32),ivory,-4,5,3.2);needle.rotateY(.5);
   mounted('selector',new T.CylinderGeometry(4/32,5/32,3/32,8),edge,8,-8,2.1);
   mounted('switch-guard',new T.BoxGeometry(9/32,3/32,7/32),ivory,-7,-9,1.8);
   mounted('switch',new T.BoxGeometry(3/32,4/32,5/32),amber,-7,-9,3.4);
   // Full-height radial cabinet seams are visible from the normal approach.
   const seam=box(`${id}-cabinet-seam-${i}`,600+343*Math.cos(a),14,220+343*Math.sin(a),2,17,1,dark);seam.rotation.y=angle;
  }
 }
 return root;
}
