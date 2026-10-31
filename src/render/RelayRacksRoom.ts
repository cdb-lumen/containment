import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RELAY_RACKS_FOOTPRINTS} from '../game/roguelike/relayRacksLayout';

/** Room-local shell and major forms. Dimensions are game units.
 * Raised forms remain inside the five production solids. Cross-aisle cables
 * are flush deck inlays, not extra blockers or relay-success indicators. */
export function relayRacksRoom():T.Group{
 const root=new T.Group();root.name='authored-relay-racks';
 const material=(name:string,color:number,metalness=.35)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:.78});m.name=name;m.userData.actorMaterial=true;return m;};
 const deck=material('painted-steel-deck',0x30383a,.1),dark=material('relay-frame-metal',0x1d272b,.65),rail=material('relay-rail-metal',0x526164,.7),pale=material('relay-ceramic',0xc7cec0,.05),cyan=material('relay-fiber',0x568b91,.1),amber=material('relay-bridge-metal',0x8b7350,.65),damage=material('relay-cut-metal',0x765746);
 rail.roughness=.48;pale.roughness=.62;amber.roughness=.58;
 // Dry, low-contrast deck. All surface treatment belongs to this room.
 const normals=new T.DataTexture(new Uint8Array([127,128,255,255,129,128,255,255,128,127,255,255,128,129,255,255]),2,2);
 normals.wrapS=normals.wrapT=T.RepeatWrapping;normals.repeat.set(150,110);normals.needsUpdate=true;
 deck.normalMap=normals;deck.normalScale.set(.3,.3);deck.roughness=.92;deck.addEventListener('dispose',()=>normals.dispose());
 const contact=new T.MeshBasicMaterial({color:0x111c23,transparent:true,opacity:.3,depthWrite:false});contact.name='environment-contact';contact.userData.actorMaterial=true;
 cyan.emissive.setHex(0x24464b);cyan.emissiveIntensity=.25;
 const groups=new Map<T.Group,Map<T.Material,{parts:T.BufferGeometry[];name:string}>>();
 const group=(name:string)=>{const g=new T.Group();g.name=name;root.add(g);groups.set(g,new Map());return g;};
 const add=(g:T.Group,geo:T.BufferGeometry,m:T.Material,name='')=>{
  const flat=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
  const batch=groups.get(g)!;if(!batch.has(m))batch.set(m,{parts:[],name});batch.get(m)!.parts.push(flat);
 };
 const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,name='')=>add(g,new T.BoxGeometry(w/32,h/32,d/32).translate(x/32,y/32,z/32),m,name);
 const pipe=(g:T.Group,a:number[],b:number[],radius:number,m:T.Material,name='')=>{
  const p=new T.Vector3(...a.map(n=>n/32)),q=new T.Vector3(...b.map(n=>n/32));
  const geo=new T.CylinderGeometry(radius/32,radius/32,p.distanceTo(q),8);
  geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),q.clone().sub(p).normalize()));geo.translate(...p.add(q).multiplyScalar(.5).toArray());add(g,geo,m,name);
 };
 const shell=group('relay-neutral-shell');
 box(shell,600,-6,440,1200,12,880,deck);
 // Seams follow broad deck plates rather than outline detached cargo pads.
 const seams=group('relay-deck-seams');
 for(const z of [100,340,540,780])box(seams,600,.025,z,1200,.05,.8,contact);
 for(const x of [180,460,740,1020])box(seams,x,.025,440,.8,.05,880,contact);
 // Low service-wall cassettes stay outside the existing playable envelope.
 const panels=group('relay-shell-panels');
 for(const z of [-7,887])for(const x of [80,240,400,560,720,880,1040,1160]){
  box(panels,x,25,z,x===1160?72:140,42,12,dark);
  box(panels,x,35,z,64,12,14,rail);
  for(const dx of [-20,0,20])box(panels,x+dx,42,z,8,2,12,pale);
 }
 for(const x of [-7,1207])for(const z of [90,250,630,790]){
  box(panels,x,25,z,12,42,140,dark);
  box(panels,x,35,z,14,12,64,rail);
 }
 // Entry/exit breaks remain the same width as the reviewed blockout.
 for(const z of [-6,886])box(shell,600,12,z,1200,24,12,dark);
 for(const x of [-6,1206])for(const z of [180,700])box(shell,x,12,z,12,24,360,dark);
 root.userData.lightFixtures=[];
 for(const x of [160,480,720,1040]){
  box(shell,x,27,-6,28,4,8,cyan);
  root.userData.lightFixtures.push({x:x/32,y:27/32,z:-6/32,color:cyan.emissive.getHex()});
 }
 for(const [i,r]of RELAY_RACKS_FOOTPRINTS.entries()){
  const g=group(`relay-fixture-${i}`),x=r.x+r.width/2,z=r.y+r.height/2;
  box(g,x,4,z,r.width,8,r.height,dark);
  add(shell,new T.PlaneGeometry(r.width/32,r.height/32).rotateX(-Math.PI/2).translate(x/32,.005,z/32),contact);
  if(i<4){
   const broken=i===1,height=broken?56:76;
   const plenum=group(`relay-cooling-plenum-${i}`);g.add(plenum);
   box(plenum,x,13,z,84,10,148,dark);
   for(const dx of [-40,40])for(const dz of [-60,-40,-20,0,20,40,60])box(plenum,x+dx,20,z+dz,6,6,9,rail);
   // Three repeated blade bays share an open frame, not a stretched cabinet.
   for(const dx of [-43,43])for(const dz of [-77,77])box(g,x+dx,height/2,z+dz,6,height,6,rail,'relay-open-rails');
   for(const dz of [-77,77])box(g,x,height-3,z+dz,92,6,6,rail);
   for(const dx of [-40,40])box(g,x+dx,broken?24:39,z,6,8,154,rail);
   for(const bay of [-1,0,1]){
    const bz=z+bay*50;
    box(g,x,13,bz,84,10,42,dark);
    const trayHeight=broken&&bay===0?25:40;
    box(g,x,trayHeight,bz,78,5,38,rail);
    // Ceramic is confined to the patch field and removable tray handles.
    for(const dx of [-28,28])box(g,x+dx,trayHeight+4,bz+12,12,4,6,pale);
    for(const dx of [-18,-6,6,18])box(g,x+dx,trayHeight+3,bz+6,4,1,13,dark);
    // Top-facing patch blocks and broad loops stay legible at game zoom.
    if(!(broken&&bay===0)){
     box(g,x,51,bz-12,62,9,12,dark);
     for(const dx of [-20,0,20])box(g,x+dx,57,bz-12,8,4,9,pale);
     const curve=new T.CatmullRomCurve3([[x-23,57,bz-10],[x-25,broken?60:78,bz+5],[x+25,broken?60:78,bz+5],[x+23,57,bz-10]].map(p=>new T.Vector3(p[0]/32,p[1]/32,p[2]/32)));
     add(g,new T.TubeGeometry(curve,12,2.2/32,5,false),broken?damage:cyan,'relay-fiber-loops');
    }else{
     // Missing tray and short fallen rail are contained inside the damaged bay.
     pipe(g,[x-33,17,bz-15],[x+29,28,bz+14],4,damage);
    }
   }
  }else{
   // Exposed reel, circular retaining flanges and a split strain-relief crown.
   // The former square lid hid the drum at the shipping camera angle.
   add(g,new T.CylinderGeometry(33/32,33/32,40/32,16).translate(x/32,32/32,(z-26)/32),amber,'relay-distribution-drum');
   const flanges=group('relay-drum-flanges');g.add(flanges);
   for(const y of [12,54])add(flanges,new T.CylinderGeometry(42/32,42/32,8/32,20).translate(x/32,y/32,(z-26)/32),rail);
   for(const dx of [-24,24])box(g,x+dx,8,z-26,16,8,68,dark);
   // Broad ribs tie the two flanges together, leaving the reel visible between.
   for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const dx=Math.cos(angle)*34,dz=Math.sin(angle)*34;
    pipe(g,[x+dx,16,z-26+dz],[x+dx,50,z-26+dz],3,rail);
   }
   const fork=group('relay-fork-guides');g.add(fork);
   for(const side of [-1,1]){
    // Two ceramic combs with individual dark slots, not a rectangular cover.
    box(fork,x+side*25,62,z-7,26,8,16,pale);
    for(const lane of [-1,0,1]){
     const endX=x+side*25+lane*7;
     box(fork,endX,67,z-7,4,2,12,dark);
     const curve=new T.CatmullRomCurve3([[x+lane*5,22,z-73],[x+lane*5,63,z-52],[x+side*16+lane*5,70,z-27],[endX,69,z-7]].map(p=>new T.Vector3(p[0]/32,p[1]/32,p[2]/32)));
     add(fork,new T.TubeGeometry(curve,10,1.8/32,5,false),cyan);
    }
    // Bolted saddles and jacketed tails support the fork and bridge housing.
    box(g,x+side*25,58,z-7,28,4,20,dark);
    pipe(g,[x+side*28,19,z+1],[x+side*28,19,z+37],4,dark);
   }
   // Separate ceramic jaws expose the missing bridge. The parked handle stays
   // on the right housing, so no new interaction or success state is implied.
   const coupler=group('relay-bridge-coupler');g.add(coupler);
   for(const side of [-1,1]){
    const jaw=group(side<0?'relay-coupler-left':'relay-coupler-right');coupler.add(jaw);
    box(jaw,x+side*31,12,z+54,28,8,40,rail);
    box(jaw,x+side*30,28,z+54,24,24,34,dark);
    box(jaw,x+side*21,41,z+54,10,18,30,pale);
    for(const dz of [46,62])box(jaw,x+side*12,41,z+dz,10,6,6,amber);
    for(const dz of [40,68])box(jaw,x+side*36,43,z+dz,8,6,6,rail);
   }
   // A low broken cable end below the open jaws continues the severed spur.
   pipe(coupler,[x,8,z+78],[x-5,14,z+67],3,damage);
   const lever=group('relay-manual-lever');coupler.add(lever);
   pipe(lever,[x+32,37,z+42],[x+32,62,z+58],3,rail);
   pipe(lever,[x+23,62,z+58],[x+41,62,z+58],4,amber);
  }
 }
 const channels=group('relay-flush-channels');
 // Flat rectangular inlays: north feed connects both upper banks to the hub.
 box(channels,600,.15,230,10,.3,260,cyan);
 box(channels,600,.15,100,510,.3,10,cyan);
 for(const x of [350,850])box(channels,x,.15,130,10,.3,60,cyan);
 // Severed southern spur: a 26-unit unpainted gap, no raised trip hazard.
 box(channels,600,.15,539,10,.3,38,damage);
 box(channels,600,.15,627,10,.3,86,damage);
 box(channels,500,.15,670,200,.3,10,damage);
 for(const [g,batches]of groups)for(const [m,{parts,name}]of batches){
  const geo=mergeGeometries(parts,false)!;for(const p of parts)p.dispose();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=g!==channels&&g!==shell;mesh.receiveShadow=true;mesh.userData.bakedEnvironment=true;(g===shell?root:g).add(mesh);
 }
 return root;
}
