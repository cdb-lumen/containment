import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TRANSMISSION_BLOCKOUT} from '../game/roguelike/transmissionChamberLayout';
import type {Point} from '../game/roguelike/types';
const U=32;
/** Room10 stage3. Ceramic/alloy transmission hardware on matching sealed bases.
 * No new interactions, milestone text, arena roof, shield or emissive route ring. */
export function transmissionChamberRoom():T.Group{
 const room=new T.Group();room.name='authored-transmission-chamber';
 const mat=(name:string,color:number,metalness=.25,roughness=.78)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});m.name=name;m.userData.actorMaterial=true;return m;};
 const steel=mat('transmission-alloy',0x748590,.65,.48),ceramic=mat('transmission-ceramic',0xbec5c3,.08,.7),dark=mat('transmission-housing',0x202f38,.4,.8),deck=mat('transmission-deck',0x303e47,.3,.86),blue=mat('transmission-indicator',0x8abacb,.1,.6);
 const machined=mat('transmission-machined-alloy',0x9baab0,.78,.3);
 const seam=mat('transmission-deck-seam',0x26343c,.3,.85),inlay=mat('transmission-deck-inlay',0x475961,.35,.8);
 blue.emissive.setHex(0x315965);blue.emissiveIntensity=.25;
 const mesh=(owner:T.Group,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x/U,y/U,z/U);o.castShadow=true;o.receiveShadow=true;o.userData.bakedEnvironment=true;owner.add(o);return o;};
 const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>mesh(g,new T.BoxGeometry(w/U,h/U,d/U),m,x,y,z);
 const cylinder=(g:T.Group,x:number,y:number,z:number,r:number,h:number,m:T.Material,open=false)=>mesh(g,new T.CylinderGeometry(r/U,r/U,h/U,24,1,open),m,x,y,z);
 const slab=(g:T.Group,points:readonly Point[],height:number,base:number,m:T.Material)=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/U,-p.y/U)));
  const o=mesh(g,new T.ExtrudeGeometry(shape,{depth:height/U,bevelEnabled:false,steps:1}),m,0,base,0);o.rotation.x=-Math.PI/2;return o;
 };
 const rod=(g:T.Group,a:number[],b:number[],radius:number,m:T.Material)=>{
  const av=new T.Vector3(...a.map(v=>v/U) as [number,number,number]),bv=new T.Vector3(...b.map(v=>v/U) as [number,number,number]);
  const o=mesh(g,new T.CylinderGeometry(radius/U,radius/U,av.distanceTo(bv),8),m);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());
 };
 // Continuous rectangular deck. Collision voids are filled by solid equipment bases.
 box(room,600,-8,440,1200,16,880,deck);
 box(room,600,24,0,1200,48,12,dark);box(room,600,7,880,1200,14,12,dark);
 for(const x of [0,1200])box(room,x,12,440,12,24,880,dark);
 // Flush expansion joints and two quiet service strips, never raised route blockers.
 const floor=new T.Group();floor.name='flush-deck-inlays';room.add(floor);
 for(const x of [200,400,600,800,1000])box(floor,x,.025,440,1,.05,868,seam);
 for(const z of [176,352,528,704])box(floor,600,.025,z,1188,.05,1,seam);
 for(const x of [175,1025]){
  box(floor,x,.035,440,30,.07,868,inlay);
  for(const z of [120,280,600,760])box(floor,x,.08,z,16,.04,2,steel);
 }
 const shell=new T.Group();shell.name='ceramic-perimeter-shell';room.add(shell);
 // All shell dressing stays within the existing six-unit perimeter wall band.
 for(const x of [100,300,900,1100]){
  box(shell,x,29,0,184,34,10,ceramic);
  box(shell,x,11,5,174,8,2,steel);
  box(shell,x,39,5,88,3,2,blue);
 }
 for(const x of [0,1200])for(const z of [110,290,590,770]){
  box(shell,x,15,z,10,22,158,steel);
  box(shell,x,28,z,10,4,156,ceramic);
 }
 for(const x of [100,300,500,700,900,1100])box(shell,x,10,880,180,10,10,steel);
 for(const f of TRANSMISSION_BLOCKOUT){
  const g=new T.Group();g.name=f.id;g.userData.footprint=f.footprint;room.add(g);
  const center=f.footprint.reduce((c,p)=>({x:c.x+p.x/f.footprint.length,y:c.y+p.y/f.footprint.length}),{x:0,y:0});
  slab(g,f.footprint,8,0,dark);
  if(f.id.startsWith('waveguide')){
   slab(g,f.footprint,12,8,steel);
   const inset=f.footprint.map(p=>({x:center.x+(p.x-center.x)*.8,y:center.y+(p.y-center.y)*.8}));
   slab(g,inset,5,20,dark);
   const vane=new T.Group();vane.name='ceramic-waveguide-cover';vane.position.set(center.x/U,0,center.y/U);vane.rotation.y=-Math.atan2(center.y-440,center.x-600);g.add(vane);
   // Split ceramic covers expose the dark radial channel rather than a pale pedestal.
   for(const z of [-14,14])box(vane,0,27,z,42,6,8,ceramic);
   box(vane,0,26,0,40,2,9,steel);
   for(const x of [-17,17])box(vane,x,29,0,3,4,26,steel);
   cylinder(vane,9,31,0,7,8,dark);
   for(const y of [30,35,40])cylinder(vane,9,y,0,10,3,ceramic);
   box(vane,-16,30,0,4,3,7,blue);
  }else if(f.id==='exposed-feed'){
   slab(g,f.footprint,5,8,steel);
   cylinder(g,600,17,440,48,8,ceramic);
   cylinder(g,600,30,440,30,26,steel,true);
   cylinder(g,600,22,440,27,2,dark);
   const lip=mesh(g,new T.TorusGeometry(30/U,4/U,8,32),ceramic,600,43,440);lip.rotation.x=-Math.PI/2;
   cylinder(g,600,27,440,9,8,blue);
   const collar=new T.Group();collar.name='feed-alloy-collar';g.add(collar);
   for(const y of [20,36]){
    const band=mesh(collar,new T.TorusGeometry(30/U,2/U,6,32),machined,600,y,440);band.rotation.x=-Math.PI/2;
   }
   for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    box(collar,600+30*Math.cos(a),28,440+30*Math.sin(a),4,12,4,dark);
   }
   for(let i=0;i<6;i++){
    const a=i*Math.PI/3,x=600+40*Math.cos(a),z=440+40*Math.sin(a);
    cylinder(g,x,24,z,5,6,steel);
   }
  }else if(f.id==='antenna-truss'){
   // Compact the complete round dish assembly on the south edge of its existing
   // proportionate plinth. Its sealed collision footprint follows the same base;
   // hardware, concavity and shipping camera remain unchanged.
   const plinth=g;
   const hardware=new T.Group();hardware.name='antenna-hardware';plinth.add(hardware);
   hardware.scale.setScalar(.32);
   hardware.position.set(600*(1-.32)/U,8*(1-.32)/U,(99-75*.32)/U);
   {
   const g=hardware;
   for(const x of [520,680]){box(g,x,13,75,28,10,50,steel);box(g,x,57,75,12,78,12,steel);}
   box(g,600,95,75,174,12,18,steel);
   rod(g,[526,20,75],[674,90,75],4,dark);rod(g,[674,20,75],[526,90,75],4,dark);
   // The concave ceramic face points south into the arena, with a closed alloy back.
   const reflector=new T.Group();reflector.name='dish-reflector';g.add(reflector);
   // This rotation maps profile height to northward depth. Recess the center
   // to z=48 behind the unchanged z=66 rim, away from the south-side receiver.
   const dish=mesh(reflector,new T.LatheGeometry([[0,36],[18,35],[40,31],[60,25],[76,18]].map(([r,h])=>new T.Vector2(r/U,h/U)),48),ceramic,600,112,84);
   dish.rotation.x=-Math.PI/2;
   const back=mesh(reflector,new T.LatheGeometry([[76,18],[79,20],[61,28],[40,34],[18,38],[0,39]].map(([r,h])=>new T.Vector2(r/U,h/U)),48),steel,600,112,84);back.rotation.x=-Math.PI/2;
   const rim=new T.Group();rim.name='dish-rim';g.add(rim);
   mesh(rim,new T.TorusGeometry(76/U,3/U,8,48),machined,600,112,66);
   // Side bearings and cheek plates join the reflector to the original grounded truss.
   const gimbal=new T.Group();gimbal.name='dish-gimbal';g.add(gimbal);
   for(const x of [517,683]){
    box(gimbal,x,100,75,10,32,20,dark);
    const bearing=cylinder(gimbal,x,112,75,11,12,machined);bearing.rotation.z=Math.PI/2;
    box(gimbal,x,89,75,18,6,26,steel);
   }
   const receiver=new T.Group();receiver.name='dish-receiver-support';g.add(receiver);
   for(const angle of [Math.PI/2,Math.PI*7/6,Math.PI*11/6]){
    rod(receiver,[600+72*Math.cos(angle),112+72*Math.sin(angle),67],[600,112,101],2.4,machined);
   }
   rod(receiver,[600,112,48],[600,112,100],4,dark);
   const horn=mesh(receiver,new T.CylinderGeometry(8/U,5/U,12/U,12),machined,600,112,99);horn.rotation.x=Math.PI/2;
   box(receiver,600,112,106,9,9,2,blue);
   }
  }else{
   box(g,925,23,652.5,138,30,55,dark);
   for(const x of [862,988])box(g,x,25,652.5,10,32,51,ceramic);
   box(g,925,17,679,110,12,2,steel);
   const panel=new T.Group();panel.name='transmission-instrument-panel';panel.position.set(925/U,43/U,652.5/U);panel.rotation.x=.2;g.add(panel);
   box(panel,0,0,0,136,6,49,steel);
   box(panel,-13,4,-5,94,2,28,dark);
   // Passive carrier bars and tuning diagram. No milestone or completion message.
   for(const [x,w] of [[-41,21],[-12,26],[18,19]])box(panel,x,5.2,-12,w,.4,2,blue);
   for(let i=0;i<9;i++)box(panel,-49+i*8,5.2,-2,3,.4,4+(i%3)*3,blue);
   for(const z of [-12,1,14])cylinder(panel,52,5,z,3,3,ceramic);
   box(panel,-13,4,17,94,2,5,dark);
  }
 }
 // Batch opaque static siblings without flattening the named fixture hierarchy.
 // Keep shell batches in individual wall bands and mirrored dish geometry separate.
 const owners:T.Group[]=[];room.traverse(o=>{if(o instanceof T.Group)owners.push(o);});
 for(const owner of owners){
  const batches=new Map<string,T.Mesh<T.BufferGeometry,T.Material>[]>();
  for(const child of owner.children){
   if(!(child instanceof T.Mesh)||Array.isArray(child.material))continue;
   child.updateMatrix();if(child.matrix.determinant()<0)continue;
   const band=owner===shell?(child.position.z===0?'north':child.position.z===880/U?'south':child.position.x===0?'west':child.position.x===1200/U?'east':'north'):'';
   const key=child.material.uuid+band;
   const batch=batches.get(key)??[];batch.push(child);batches.set(key,batch);
  }
  for(const batch of batches.values()){
   if(batch.length<2)continue;
   const parts=batch.map(o=>{
    const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
    return g.applyMatrix4(o.matrix);
   });
   const merged=mergeGeometries(parts,false);for(const g of parts)g.dispose();
   if(!merged)throw new Error('Incompatible transmission room batch');
   const combined=mesh(owner,merged,batch[0].material);
   combined.name='static-'+batch[0].material.name;
   for(const o of batch){owner.remove(o);o.geometry.dispose();}
  }
 }
 room.userData.storyFixtures=TRANSMISSION_BLOCKOUT;
 return room;
}
