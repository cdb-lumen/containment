import * as T from 'three';
import {PASSENGER_FINISHES} from './RoomEquipmentPalette';
import {createAwakeningServiceFinish} from './AwakeningServiceFinish';
import {AWAKENING_BLOCKOUT,PASSENGER_BLOCKOUT,AUTHORED_ROOM_TOPOLOGIES} from '../game/roguelike/authoredRoomTopologies';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Point=Readonly<{x:number;y:number}>;
type Outline=readonly Point[];
type RoomPlan=Readonly<{width:number;height:number;boundary?:Outline;voids?:readonly Outline[];obstacles:readonly {x:number;y:number;width:number;height:number}[]}>;
const U=32,TAU=Math.PI*2;
export const AUTHORED_ROOMS=['awakening-bay','passenger-vault','breached-loading-bay','overload-floor'] as const;
const outline=(t:RoomPlan):Outline=>t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];
const path=(points:Outline)=>points.map(p=>new T.Vector2(p.x/U,-p.y/U));
/** The collision template is the sole source of deck edges and cut-outs. */
export function roomDeckShape(t:RoomPlan):T.Shape{
 const shape=new T.Shape(path(outline(t)));for(const hole of t.voids??[])shape.holes.push(new T.Path(path(hole)));return shape;
}
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const bounds=(points:Outline)=>{const xs=points.map(p=>p.x/U),zs=points.map(p=>p.y/U),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);return {x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,x0,x1,z0,z1};};
function contains(points:Outline,x:number,z:number){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>z*U)!==(b.y>z*U)&&x*U<(b.x-a.x)*(z*U-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}

/** Room-local resources. No dimension-keyed global cache and no retained source meshes. */
class Fabricator{
 readonly root=new T.Group();private parts=new Map<T.Material,T.BufferGeometry[]>();
 readonly contact=new T.MeshBasicMaterial({color:0x020609,transparent:true,depthWrite:false,opacity:.34});
 readonly shaft=this.mat(0x536d76,.3,.83,0x24414a,.26);
 readonly paint=this.mat(0x34454b,.62,.66);readonly edge=this.mat(0x718184,.7,.36);
 readonly dark=this.mat(0x101b22,.5,.65);readonly deck=this.mat(0x263238,.32,.91);
 readonly ivory=this.mat(0x9dada6,.58,.4);readonly bronze=this.mat(0x91714a,.73,.42);
 readonly rust=this.mat(0x71452d,.56,.72);readonly chitin=this.mat(0x303b35,.25,.78);
 readonly ribs=this.mat(0x697164,.48,.64);readonly bolts=this.mat(0x69767a,.78,.47);
 readonly seam=this.mat(0x293a40,.3,.88);readonly stencil=this.mat(0x77745c,.2,.9);
 constructor(){
  this.contact.userData.actorMaterial=true;this.contact.name='environment-contact';this.shaft.name='shaft-liner';
  const contactData=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const edge=Math.min(x,y,31-x,31-y)/6;contactData.set([255,255,255,Math.round(255*Math.min(1,edge)**2)],(y*32+x)*4);}
  const contactMap=new T.DataTexture(contactData,32,32);contactMap.needsUpdate=true;contactMap.magFilter=T.LinearFilter;this.contact.map=contactMap;this.contact.addEventListener('dispose',()=>contactMap.dispose());
  this.chitin.name='boarding-carapace';this.ribs.name='boarding-ribs';this.bolts.name='reactor-fasteners';this.deck.name='painted-steel-deck';
  // Eight-metre paint sheet: fine rolled grain, broad rubbed patches and sparse
  // staggered plate joints. No image requests or canvas dependency.
  const size=256,albedo=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4);
  const relief=(x:number,z:number)=>{x=(x+size)%size;z=(z+size)%size;const dx=Math.min((x+(z<128?0:96))%256,256-(x+(z<128?0:96))%256),dz=Math.min(z%128,128-z%128);return -Math.max(0,1-Math.min(dx,dz)/2.5);};
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
   const i=(z*size+x)*4,hash=((x*73856093)^(z*19349663))>>>0,grain=(hash%13)-6;
   const wear=Math.sin(x*.037+Math.sin(z*.025))*3+Math.cos(z*.052)*2;
   const joint=(z===0||z===128||((x+(z<128?0:96))%256===0))?14:0;
   const scratch=(hash%229===0&&x%19<12)?9:0,c=Math.round(228+grain*.55+wear-joint+scratch);
   albedo.set([c,c,c,255],i);const r=Math.round(234+wear*2);rough.set([r,r,r,255],i);
   const n=new T.Vector3((relief(x-1,z)-relief(x+1,z))*.9,(relief(x,z-1)-relief(x,z+1))*.9,1).normalize();normal.set([Math.round(128+n.x*127),Math.round(128+n.y*127),Math.round(128+n.z*127),255],i);
  }
  const texture=(data:Uint8Array)=>{const t=new T.DataTexture(data,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
  this.deck.map=texture(albedo);this.deck.map.colorSpace=T.SRGBColorSpace;this.deck.roughnessMap=texture(rough);this.deck.normalMap=texture(normal);this.deck.normalScale.set(.65,.65);
  this.deck.addEventListener('dispose',()=>{this.deck.map?.dispose();this.deck.roughnessMap?.dispose();this.deck.normalMap?.dispose();});
 }
 readonly cold=this.mat(0x6ac9d3,.42,.27,0x38919c,.8);readonly warm=this.mat(0xe7ab65,.4,.38,0xd67d34,.7);
 readonly body=this.mat(0x53646b,.1,.83);readonly skin=this.mat(0xb5a48e,.1,.77);
 private mat(color:number,metalness:number,roughness:number,emissive=0,emissiveIntensity=0){const m=new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity});m.userData.actorMaterial=true;return m;}
 add(g:T.BufferGeometry,m:T.Material,position=new T.Vector3(),rotation=new T.Euler(),scale=new T.Vector3(1,1,1)){
  // Capture local origins before material batching erases individual fixtures.
  if(m instanceof T.MeshStandardMaterial&&m.emissiveIntensity>=.5&&m.emissive.getHex()!==0&&position.y>=.65){
   const fixtures=this.root.userData.lightFixtures??=[];
   if(fixtures.length<256)fixtures.push({x:position.x,y:position.y,z:position.z,color:m.emissive.getHex()});
  }
  const matrix=new T.Matrix4().compose(position,new T.Quaternion().setFromEuler(rotation),scale),flat=g.index?g.toNonIndexed():g.clone();g.dispose();flat.applyMatrix4(matrix);if(m===this.deck){const p=flat.getAttribute('position'),uv=flat.getAttribute('uv');for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/8,p.getZ(i)/8);}const parts=this.parts.get(m)??[];parts.push(flat);this.parts.set(m,parts);
 }
 box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,r=.04,angle=0){if(y-h/2<=.05&&y+h/2>.25&&h>.3)this.add(new T.PlaneGeometry(w+.6,d+.6),this.contact,v(x,.012,z),new T.Euler(-Math.PI/2,0,angle));this.add(r?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),m,v(x,y,z),new T.Euler(0,angle,0));}
 pipe(a:T.Vector3,b:T.Vector3,r:number,m:T.Material,r2=r){const g=new T.CylinderGeometry(r2,r,a.distanceTo(b),10);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(v(0,1,0),b.clone().sub(a).normalize()));this.add(g,m,a.clone().add(b).multiplyScalar(.5));}
 ring(x:number,y:number,z:number,r:number,t:number,m:T.Material,start=0,length=TAU){this.add(new T.TorusGeometry(r,t,6,64,length),m,v(x,y,z),new T.Euler(-Math.PI/2,0,start));}
 ellipsoid(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material){this.add(new T.SphereGeometry(1,12,8),m,v(x,y,z),new T.Euler(),v(w,h,d));}
 slab(points:Outline,y:number,depth:number,m:T.Material){this.add(new T.ExtrudeGeometry(new T.Shape(path(points)),{depth,bevelEnabled:false,steps:1}),m,v(0,y,0),new T.Euler(-Math.PI/2,0,0));}
 sign(text:string,x:number,y:number,z:number,width:number){
  this.box(x,y,z,width,.09,.8,this.dark,.035);
  if(typeof document==='undefined')return;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const c=canvas.getContext('2d');if(!c)return;c.fillStyle='#18262b';c.fillRect(0,0,1024,128);c.fillStyle='#edc28a';c.font='600 66px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,66,990);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:.25,roughness:.7});material.userData.actorMaterial=true;material.addEventListener('dispose',()=>texture.dispose());
  this.add(new T.PlaneGeometry(width-.1,.7),material,v(x,y+.052,z),new T.Euler(-Math.PI/2,0,0));
 }
 finish(){for(const [material,parts]of this.parts){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(geometry){const mesh=new T.Mesh(geometry,material);mesh.userData.bakedEnvironment=true;mesh.castShadow=material!==this.contact;mesh.receiveShadow=material!==this.contact;this.root.add(mesh);}}
  // Dispose palette entries unused by this room as well.
  const used=new Set(this.parts.keys());for(const value of Object.values(this))if(value instanceof T.Material&&!used.has(value))value.dispose();this.parts.clear();return this.root;
 }
}
function edgeArchitecture(f:Fabricator,t:RoomPlan,scar=false){
 const perimeter=outline(t);
 // Separate armoured cassettes follow each true polygon edge, including sloped facets.
 for(let i=0;i<perimeter.length;i++){
  const a=perimeter[i],b=perimeter[(i+1)%perimeter.length],ax=a.x/U,az=a.y/U,bx=b.x/U,bz=b.y/U,length=Math.hypot(bx-ax,bz-az),angle=-Math.atan2(bz-az,bx-ax),segments=Math.max(1,Math.ceil(length/2.8));
  const rear=(az+bz)/2<t.height/U*.32,height=rear?1.55:.42;
  for(let j=0;j<segments;j++){const s=(j+.5)/segments,x=ax+(bx-ax)*s,z=az+(bz-az)*s,w=length/segments-.055;
   f.box(x,height/2-.25,z,w,height,.38,f.paint,.055,angle);f.box(x,height-.22,z,w,.09,.5,f.edge,.025,angle);
   if(j%2===0)f.box(x,height-.15,z,.68,.045,.12,rear?f.cold:f.warm,.012,angle);
   if(scar&&rear){f.box(x,.36,z,w-.12,.7,.46,f.rust,.04,angle);f.box(x,.77,z,w-.08,.09,.57,f.bronze,.02,angle);for(const side of [-1,1])f.pipe(v(x+Math.cos(-angle)*side*w*.4,-.15,z+Math.sin(-angle)*side*w*.4),v(x+Math.cos(-angle)*side*w*.4,1.1,z+Math.sin(-angle)*side*w*.4),.08,f.edge);}
  }
  // Sparse flush service hatches and inset edge seams supply scale, not a tile grid.
  const midpoint=v((ax+bx)/2,0,(az+bz)/2),center=bounds(perimeter),inward=v(center.x-midpoint.x,0,center.z-midpoint.z).normalize();
  const hatch=midpoint.clone().addScaledVector(inward,1.15);
  if(i%2===0&&contains(perimeter,hatch.x,hatch.z)&&!(t.voids??[]).some(h=>contains(h,hatch.x,hatch.z))){f.box(hatch.x,-.012,hatch.z,1.45,.016,.82,f.dark,.025,angle);f.box(hatch.x,-.001,hatch.z,1.35,.01,.72,f.paint,.02,angle);f.box(hatch.x,.006,hatch.z,.32,.012,.05,f.edge,.008,angle);}
  f.pipe(v(ax,-.58,az),v(bx,-.58,bz),.17,f.dark);
 }
 for(const hole of t.voids??[]){
  f.slab(hole,-5,.12,f.dark);
  for(let i=0;i<hole.length;i++){
   const start=hole[i],end=hole[(i+1)%hole.length],p=v(start.x/U,0,start.y/U),q=v(end.x/U,0,end.y/U),length=p.distanceTo(q),steps=Math.ceil(length/2.2);
   f.pipe(p.clone().setY(-.26),q.clone().setY(-.26),.16,f.edge);if(scar)continue;f.pipe(p.clone().setY(.45),q.clone().setY(.45),.045,f.ivory);
   // Inset liners and projecting ribs stay inside the opening, not under deck.
   const center=bounds(hole),inward=v(center.x-(p.x+q.x)/2,0,center.z-(p.z+q.z)/2).normalize();
   const a=p.clone().addScaledVector(inward,.2),b=q.clone().addScaledVector(inward,.2),mid=a.clone().add(b).multiplyScalar(.5);
   f.box(mid.x,-2.15,mid.z,length,3.9,.12,f.shaft,.02,-Math.atan2(q.z-p.z,q.x-p.x));
   for(const y of [-1.2,-2.5,-3.7])f.pipe(a.clone().setY(y),b.clone().setY(y),.065,f.cold);
   for(let j=0;j<steps;j++){const s=a.clone().lerp(b,(j+.5)/steps).addScaledVector(inward,.14);f.pipe(s.clone().setY(-4),s.clone().setY(-.18),.105,f.shaft);}
  }
 }
}
/** Authored in game units, using the room's synchronous batched geometry pipeline.
 * The empty berth, nested lid and released restraints are the completed pose.
 * No optional download or runtime opening state is needed. */
function awakeningRelease(f:Fabricator,hole:Outline){
 const b=bounds(hole),dx=b.x0*U-90,dz=b.z0*U-380;
 const box=(x:number,h:number,z:number,w:number,t:number,d:number,m:T.Material,r=1)=>f.box((x+dx)/U,h/U,(z+dz)/U,w/U,t/U,d/U,m,r/U);
 const pipe=(x:number,h:number,z:number,x2:number,h2:number,z2:number,r:number,m:T.Material)=>f.pipe(v((x+dx)/U,h/U,(z+dz)/U),v((x2+dx)/U,h2/U,(z2+dz)/U),r/U,m);
 // Load-bearing cradle, inset empty mattress and segmented end bumpers.
 box(135,3,440,88,6,118,f.dark,3);
 box(135,6,440,80,6,112,f.ivory,4);
 box(136,8,440,62,4,85,f.seam,4);
 for(const z of [414,431,448,465])box(136,9, z,56,2,16,f.body,2);
 box(136,11,408,40,6,12,f.ivory,3);
 box(136,8,481,55,3,8,f.dark,2);
 // A low east sill is intentionally not a side wall: feet can reach the landing.
 box(176,5,440,6,6,70,f.edge,1);
 for(const x of [104,168]){
  box(x,12,488,7,12,15,f.ivory,2);
  box(x,10,391,7,8,14,f.edge,1);
 }
 // Two guide channels carry three overlapping telescoping canopy cassettes.
 // The entire parked lid is y383..405; nothing hinges into the aisle.
 for(const x of [101,169]){
  box(x,15,440,4,4,110,f.dark,1);
  box(x,17,440,1.3,1,108,f.edge,.3);
  box(x,20,395,6,8,18,f.bolts,1);
  pipe(x,19,399,x,19,428,1.2,f.edge);
  pipe(x,19,402,x,19,414,2.1,f.dark);
 }
 for(const [z,h,w,d] of [[393,23,76,20],[394,28,72,18],[395,33,68,16]]){
  box(135,h,z,w,5,d,f.ivory,2);
  box(135,h+2.6,z,w-8,.5,d-5,f.paint,1);
 }
 // Quiet amber release indicator; physical latches are open beside the mattress.
 box(135,36,395,36,1,3,f.warm,.4);
 for(const z of [425,459]){
  box(108,12,z,10,2,5,f.bronze,.5);
  box(111,13,z+3,4,2,7,f.dark,.5);
  box(164,10,z,8,2,5,f.bronze,.5);
  box(159,11,z+4,4,2,9,f.dark,.5);
 }
 // West recovery handrail, welded sockets and feet. East gap stays fully open.
 for(const z of [389,442,491]){
  box(96,2,z,7,4,8,f.edge,.6);
  pipe(96,3,z,96,27,z,1.3,f.edge);
  box(96,6,z,4,5,4,f.dark,.5);
 }
 pipe(96,28,386,96,28,494,1.5,f.ivory);
 // Fasteners, service seam and sparse rub marks imply use, not wreckage.
 for(const z of [409,480])for(const x of [116,154])box(x,9.2,z,2,.6,2,f.bolts,.3);
 for(const z of [433,452,470])box(173,8.1,z,2,.3,7,f.ivory,.2);
 box(135,4,497,46,2,1,f.seam,.2);
 box(156,5.5,497,7,1,1.2,f.cold,.2);
 // Flush non-slip recovery deck. All tread and border relief stays below 0.6.
 box(209,.16,440,58,.32,120,f.paint,0);
 for(const x of [182,236])box(x,.36,440,1,.16,116,f.edge,0);
 for(let z=386;z<498;z+=6)box(209,.38,z,49,.2,1,f.seam,0);
 for(const z of [392,488])box(188,.4,z,9,.2,2,f.stencil,0);
}
/** Standalone construction uses exactly the same parts as the room for mesh QA. */
export function createAwakeningRelease(){const f=new Fabricator();awakeningRelease(f,AWAKENING_BLOCKOUT[0].footprint);awakeningPlate(f,'RELEASED',135,36.2,390,62,10);const root=f.finish();root.name='awakening-release';return root;}
/** Closed low pressure cassettes on bolted saddles. Services cross circulation
 * below the deck in a closed duct; only contained risers stand above deck. */
function awakeningRacks(f:Fabricator,holes:readonly Outline[],sealed=false){
 const box=(x:number,h:number,z:number,w:number,t:number,d:number,m:T.Material,r=1)=>f.box(x/U,h/U,z/U,w/U,t/U,d/U,m,r/U);
 const pipe=(a:number[],b:number[],r:number,m:T.Material)=>f.pipe(v(a[0]/U,a[1]/U,a[2]/U),v(b[0]/U,b[1]/U,b[2]/U),r/U,m);
 const supply=bounds(holes[3]),wallZ=supply.z*U;
 const routes:{points:number[][]}[]=f.root.userData.serviceRoutes=[];
 // Supply cabinet remains in its approved rear footprint, with a service face
 // toward the outer aisle. Two dedicated circuits per bank, no broken hoses.
 box(supply.x*U,3,wallZ,supply.w*U-4,6,supply.d*U-4,f.dark,2);
 box(supply.x*U,21,wallZ,supply.w*U-10,30,supply.d*U-10,f.paint,2);
 const serviceFinish=createAwakeningServiceFinish();
 for(let x=supply.x0*U+45;x<supply.x1*U-25;x+=80){
  // Removable crown covers sit directly on the original cabinet roof at h36.
  // Individual gaskets and captive screws make service divisions legible above.
  box(x,36.1,wallZ,70,.2,30,f.dark,.1);
  box(x,36.35,wallZ,68,.3,28,serviceFinish,.1);
  for(const dx of [-29,29])for(const dz of [-10,10])box(x+dx,36.65,wallZ+dz,2,.3,2,f.bolts,.15);
  box(x,22,wallZ+20,68,24,2,f.ivory,1);
  box(x+23,23,wallZ+21.5,3,8,1,f.dark,.3);
  for(let j=0;j<4;j++)box(x-16+j*8,15,wallZ+21.5,3,7,1,f.seam,.2);
 }
 awakeningPlate(f,'LIFE SUPPORT',supply.x*U,37,wallZ,106,16);
 for(const index of [1,2]){
  const b=bounds(holes[index]),z=b.z*U,x0=b.x0*U;
  // Solid infill removes the collision cutout without creating a pit.
  f.slab(holes[index],-.10,.10,f.dark);
  for(const dz of [-28,28]){
   box(b.x*U,7,z+dz,b.w*U-8,6,10,f.edge,1);
   for(let j=0;j<4;j++){
    const x=x0+50+j*100;
    box(x,2,z+dz,72,4,20,f.paint,1);
    box(x,13,z+dz,64,6,14,f.dark,2);
    for(const dx of [-30,30])box(x+dx,4.6,z+dz+7,3,1.2,3,f.bolts,.4);
   }
  }
  for(let j=0;j<4;j++){
   const x=x0+50+j*100;
   if(sealed)continue;
   box(x,21,z,84,10,86,f.ivory,5);
   box(x,26.5,z,83,2,85,f.dark,4);
   box(x,29,z,80,3,82,f.ivory,5);
   box(x,30.7,z-5,64,.6,55,f.paint,4);
   awakeningPlate(f,'OCCUPIED',x,31.4,z-7,62,14);
   // Closed compression latches bridge the seam, not a lid-opening pose.
   for(const dx of [-40,40])for(const dz of [-24,24])box(x+dx,26,z+dz,4,7,8,f.bronze,1);
   box(x,31.4,z+24,44,.8,10,f.dark,1);
   box(x-9,32,z+24,19,.5,3,f.cold,.4);
   // Repeated pulse ticks supply a non-colour living-status cue at each shell.
   for(const [dx,d] of [[4,3],[8,7],[12,4]])box(x+dx,32,z+24,2,.5,d,f.ivory,.2);
  }

  // Dedicated paired underfloor trunks. Wall -> buried run -> rack riser ->
  // contained rear header -> individual sealed coupling on each cassette.
  for(const [circuit,dz] of [[0,-48],[1,48]]){
   const trunk=x0+376+circuit*12-(index-1)*24,headerZ=z+dz,mat=circuit===0?f.bronze:f.edge;
   const common=[[trunk,18,wallZ],[trunk,-8,wallZ],[trunk,-8,headerZ],[trunk,12,headerZ]];
   for(let k=1;k<common.length;k++)pipe(common[k-1],common[k],2,mat);
   pipe([x0+50,12,headerZ],[trunk,12,headerZ],2,mat);
   box(trunk,1,headerZ,9,2,9,f.dark,1);
   box(trunk,18,wallZ,9,8,9,mat,1);
   for(let j=0;j<4;j++){
    const x=x0+50+j*100,portZ=z+(circuit===0?-41:41);
    if(sealed)continue;
    const branch=[[x,12,headerZ],[x,20,headerZ],[x,20,portZ]];
    for(let k=1;k<branch.length;k++)pipe(branch[k-1],branch[k],1.6,mat);
    box(x,20,portZ,8,7,5,f.dark,1);
    routes.push({points:[...common,[x,12,headerZ],...branch.slice(1)]});
   }
  }
 }
 // Removable closed floor plates over the shared duct. Relief stays under the
 // existing flush-landing limit, so neither aisle gains render-only collision.
 for(let z=145;z<625;z+=30){
  box(810,.15,z,52,.3,30,f.paint,0);
  for(const x of [812,832])box(x,.35,z,2,.2,3,f.bolts,.2);
 }
}
export function createAwakeningRacks(sealed=false){const f=new Fabricator();awakeningRacks(f,AWAKENING_BLOCKOUT.map(f=>f.footprint),sealed);f.root.name='awakening-racks';return f.finish();}
/** Unattended recovery kit; all hardware stays in the frozen sub-reservations.
 * Cabinet-supported controls face north, seat faces south, locker faces east,
 * and the open satellite cabinet faces west. No asynchronous asset owner. */
function awakeningKit(f:Fabricator){
 const box=(x:number,h:number,z:number,w:number,t:number,d:number,m:T.Material,r=1)=>f.box(x/U,h/U,z/U,w/U,t/U,d/U,m,r/U);
 const pipe=(a:number[],b:number[],r:number,m:T.Material)=>f.pipe(v(a[0]/U,a[1]/U,a[2]/U),v(b[0]/U,b[1]/U,b[2]/U),r/U,m);
 // Medical drawer cabinet bears the console: recessed toe-space, full worktop,
 // low supported display and tactile keys on the near operator edge.
 box(204,2,684,56,4,30,f.dark);
 box(204,16,685,58,28,30,f.ivory,2);
 for(const h of [10,22]){
  box(204,h,669.5,52,10,1,f.paint,.3);
  box(204,h+2,668.5,14,2,2,f.edge,.4);
 }
 box(181,22,668.6,3,8,1,f.ivory,.2);box(181,22,668.5,8,3,1,f.ivory,.2);
 box(204,31,682.5,62,2,37,f.edge,1);
 box(204,33,667,48,2,4,f.dark,.4);
 for(const x of [185,194,204,214,223])box(x,33.7,667,5,.6,3,x===223?f.warm:f.ivory,.3);
 // Screen is set into a backed instrument wedge, not a floating glass slab.
 box(204,34,686,52,4,26,f.paint,1);
 box(204,36.5,686,50,1,25,f.dark,.7);
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');
  if(c){
   c.fillStyle='#10282d';c.fillRect(0,0,512,256);c.fillStyle='#a5ece5';c.font='bold 62px monospace';c.fillText('08 STABLE',22,70);
   c.strokeStyle='#7edbd5';c.lineWidth=6;c.beginPath();
   for(const [i,y] of [160,160,157,166,115,203,148,160,160,160,160,157,166,115,203,148,160].entries()){const x=22+i*29;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();
   for(let i=0;i<8;i++){c.fillStyle='#7edbd5';c.fillRect(24+i*60,226,40,10);}
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
   const material=new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:.45,roughness:.65});material.userData.actorMaterial=true;material.addEventListener('dispose',()=>texture.dispose());
   f.add(new T.PlaneGeometry(48/U,23/U),material,v(204/U,37.1/U,686/U),new T.Euler(-Math.PI/2,0,0));
  }
 }
 // Recovery chair faces its southern access area: bolted feet, stretchers,
 // cushion at23, low back to north and reachable arms.
 for(const x of [190,218])for(const z of [710,742]){
  box(x,1,z,6,2,6,f.dark,.5);box(x,10,z,3,18,3,f.edge,.5);
 }
 for(const x of [190,218])pipe([x,9,710],[x,9,742],1.3,f.edge);
 box(204,19,727,32,4,38,f.paint,2);box(204,22,727,30,2,36,f.body,2);
 for(const x of [190,218]){box(x,27,708,3,20,3,f.edge,.5);box(x,26,738,2,12,2,f.edge,.5);box(x,32,725,4,3,30,f.ivory,1);}
 box(204,31,707,30,12,4,f.body,2);
 // Personal locker: an east-facing recessed sliding leaf; rails and pulls do
 // not protrude into the cross-aisle. Short local marking replaces debug text.
 box(270,2,700,34,4,86,f.dark,1);
 box(270,24,700,34,40,86,f.ivory,2);
 box(287.2,24,700,1,36,79,f.dark,.3);
 for(const z of [680,720])box(287.7,24,z,.5,34,38,f.paint,.2);
 for(const h of [7,41])box(287.8,h,700,.3,1,80,f.edge,.1);
 box(287.9,25,703,.2,8,3,f.ivory,.1);
 // Compact lid marking uses a matching aspect ratio, not the room-header font.
 box(270,44.4,700,28,.8,16,f.dark,.5);
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');
  if(c){c.fillStyle='#18262b';c.fillRect(0,0,256,128);c.fillStyle='#d5dfd7';c.font='bold 100px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('KIT',128,68);
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
   const material=new T.MeshStandardMaterial({map:texture,roughness:.7});material.userData.actorMaterial=true;material.addEventListener('dispose',()=>texture.dispose());
   f.add(new T.PlaneGeometry(27/U,15/U),material,v(270/U,44.9/U,700/U),new T.Euler(-Math.PI/2,0,0));
  }
 }
 // Open satellite supply cabinet. Back and cheeks carry the shelves; split
 // door leaves fold inward against the north/south cheeks, never into route.
 box(1075,2,681.5,60,4,45,f.dark,1);
 box(1103,24,681.5,4,40,45,f.paint,1);
 for(const z of [660,703])box(1075,24,z,60,40,3,f.ivory,1);
 for(const h of [5,20,36,45])box(1075,h,681.5,60,2,40,f.edge,.5);
 for(const z of [664,699]){
  box(1055,25,z,20,36,2,f.ivory,.4);
  box(1072,25,z,14,36,2,f.paint,.4);
  pipe([1046,8,z],[1046,42,z],1,f.bronze);
  box(1076,26,z+(z<680?2:-2),3,8,2,f.dark,.3);
 }
 // One sealed dressing pack remains on the lower shelf, not decorative litter.
 box(1090,11,687,14,10,12,f.ivory,1);
 box(1090,16.3,687,8,.6,3,f.cold,.2);
 // Abandoned trolley parked four units east of storage alignment. Wheels
 // touch deck; uprights carry both trays and the raised west push handle.
 for(const x of [1058,1100])for(const z of [716,740]){
  pipe([x-2,3,z],[x+2,3,z],3,f.dark);
  box(x,10,z,2,14,2,f.edge,.4);
 }
 for(const h of [8,17])box(1079,h,728,48,2,28,f.edge,1);
 for(const z of [714,742])box(1079,20,z,48,4,2,f.ivory,.5);
 for(const x of [1055,1103])box(x,20,728,2,4,28,f.ivory,.5);
 for(const z of [717,739])pipe([1055,17,z],[1050,30,z],1.3,f.edge);
 pipe([1050,30,717],[1050,30,739],1.6,f.ivory);
}
export function createAwakeningKit(){const f=new Fabricator();awakeningKit(f);f.root.name='awakening-kit';return f.finish();}
/** Small equipment plates retain physical aspect ratio and never span a bank. */
function awakeningPlate(f:Fabricator,text:string,x:number,h:number,z:number,width:number,depth=14){
 (f.root.userData.localSigns??=[]).push({text,x,h,z,width,depth});
 f.box(x/U,h/U,z/U,width/U,.6/U,depth/U,f.dark,.4/U);
 if(typeof document==='undefined')return;
 const canvas=document.createElement('canvas');canvas.width=Math.round(width*8);canvas.height=Math.round(depth*8);const c=canvas.getContext('2d');if(!c)return;
 c.fillStyle='#18262b';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#d5dfd7';c.font=`600 ${Math.floor(Math.min(depth*5.8,width*12/text.length))}px monospace`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,canvas.width/2,canvas.height/2);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshStandardMaterial({map:texture,roughness:.7});material.userData.actorMaterial=true;material.addEventListener('dispose',()=>texture.dispose());
 f.add(new T.PlaneGeometry(width/U,depth/U),material,v(x/U,(h+.32)/U,z/U),new T.Euler(-Math.PI/2,0,0));
}
/** The same wall cassette rhythm follows the approved boundary. The east
 * bulkhead is parked open; damage is confined to its north drive housing. */
function awakeningEnvelope(f:Fabricator,t:RoomPlan){
 const box=(x:number,h:number,z:number,w:number,d:number,l:number,m:T.Material,r=1)=>f.box(x/U,h/U,z/U,w/U,d/U,l/U,m,r/U);
 const perimeter=outline(t);
 for(let i=0;i<perimeter.length;i++){
  const a=perimeter[i],b=perimeter[(i+1)%perimeter.length];
  const runs=a.x===1160&&b.x===1160?[[a,{x:1160,y:348}],[{x:1160,y:532},b]]:[[a,b]];
  for(const [p,q] of runs){const length=Math.hypot(q.x-p.x,q.y-p.y),angle=-Math.atan2(q.y-p.y,q.x-p.x),n=Math.ceil(length/88),height=(p.y+q.y)/2<282?42:14;
   for(let j=0;j<n;j++){
    const s=(j+.5)/n,x=p.x+(q.x-p.x)*s,z=p.y+(q.y-p.y)*s,w=length/n;
    f.box(x/U,(height/2-4)/U,z/U,(w-2)/U,height/U,12.16/U,f.paint,1/U,angle);
    f.box(x/U,(height-3)/U,z/U,(w-4)/U,2/U,13/U,f.edge,.5/U,angle);
    // Recessed joint straps and paired fasteners share the cassette supports.
    const u=j/n,jx=p.x+(q.x-p.x)*u,jz=p.y+(q.y-p.y)*u;
    f.box(jx/U,(height/2-4)/U,jz/U,2/U,height/U,12/U,f.dark,.2/U,angle);
    for(const side of [-1,1])f.box((x+Math.cos(-angle)*side*(w/2-7))/U,(height-1.8)/U,(z+Math.sin(-angle)*side*(w/2-7))/U,2/U,.8/U,3/U,f.bolts,.2/U,angle);
   }
  }
 }
 // Flush expansion joints in the main access deck. No raised trip obstacles.
 for(const x of [320,520,720,920])box(x,.08,440,1,.16,168,f.seam,0);
 for(const z of [358,522])box(640,.08,z,620,.16,1,f.seam,0);
 // Sealed sockets support jambs, lintel and the retracted overhead door leaves.
 for(const z of [360,520]){
  box(1154,2,z,24,4,24,f.dark);box(1154,38,z,16,72,22,f.ivory);
  box(1145,36,z,2,64,12,f.paint,.4);box(1154,74,z,22,4,26,f.edge);
 }
 box(1154,78,440,22,12,184,f.paint);box(1154,86,440,18,4,164,f.edge);
 for(const z of [397,440,483])box(1154,73,z,16,2,40,f.ivory,.5);
 box(1149,.2,440,20,.4,128,f.edge,0);
 for(const z of [381,499])box(1137,.18,z,22,.3,3,f.stencil,0);
 // Exposed drive beneath one buckled cover, not a destroyed life-support line.
 box(1153,55,339,20,30,16,f.dark);for(const h of [46,53,60])box(1142,h,339,3,3,12,f.bronze,.4);
 f.add(new T.BoxGeometry(3/U,26/U,15/U),f.paint,v(1145/U,55/U,327/U),new T.Euler(.18,0,-.22));
 for(const h of [49,58])box(1140,h,331,1.2,2,8,f.edge,.2);
 awakeningPlate(f,'RESTORE COMMS',1100,.25,550,112,18);
 // Two worn parking corners connect the offset trolley to interrupted work.
 for(const x of [1050,1100]){box(x,.12,748,7,.2,1,f.stencil,0);box(x,.12,744,1,.2,8,f.stencil,0);}
}
export function createAwakeningEnvelope(){const f=new Fabricator();awakeningEnvelope(f,{width:1200,height:880,...AUTHORED_ROOM_TOPOLOGIES['awakening-bay']!});return f.finish();}
function awakeningBay(f:Fabricator,t:RoomPlan){
 // Role metadata never owns alternate render coordinates.
 const racks=createAwakeningRacks();f.root.add(racks);f.root.userData.serviceRoutes=racks.userData.serviceRoutes;(f.root.userData.localSigns??=[]).push(...racks.userData.localSigns??[]);
 (f.root.userData.lightFixtures??=[]).push(...racks.userData.lightFixtures??[]);delete racks.userData.lightFixtures;
 f.root.userData.storyFixtures=AWAKENING_BLOCKOUT.map(({id},i)=>({id,footprint:t.voids?.[i]}));
 for(const [i,hole] of (t.voids??[]).entries()){
  const role=AWAKENING_BLOCKOUT[i].id;
  if(role.startsWith('bank-')||role==='supply-wall')continue;
  if(role!=='player-release')f.slab(hole,-.10,.10,f.paint);
  if(role==='player-release'){
   const release=createAwakeningRelease();f.root.add(release);(f.root.userData.localSigns??=[]).push(...release.userData.localSigns??[]);
   (f.root.userData.lightFixtures??=[]).push(...release.userData.lightFixtures??[]);delete release.userData.lightFixtures;
  }
 }
 const kit=createAwakeningKit();f.root.add(kit);
 (f.root.userData.lightFixtures??=[]).push(...kit.userData.lightFixtures??[]);delete kit.userData.lightFixtures;
}
function passengerVault(room:Fabricator,t:RoomPlan){
 const f=new Fabricator();
 // These finishes belong only to this fallback, never the perimeter or global MAT.
 f.paint.color.setHex(PASSENGER_FINISHES.PV_shared_enclosure_monitor_atlas.color);
 f.ivory.color.setHex(PASSENGER_FINISHES.PV_shell.color);
 f.ivory.name='passenger-fallback-lids';
 f.dark.color.setHex(PASSENGER_FINISHES.PV_ancillary_recess.color);
 f.dark.metalness=PASSENGER_FINISHES.PV_ancillary_recess.metalness!;
 f.dark.roughness=PASSENGER_FINISHES.PV_ancillary_recess.roughness!;
 const box=(x:number,h:number,y:number,w:number,d:number,l:number,m:T.Material)=>f.box(x/U,h/U,y/U,w/U,d/U,l/U,m,0);
 // Neutral blockout only. A full-height sealed plinth makes the whole row
 // contact conservative, including the infill between closed chamber volumes.
 f.root.userData.sealedPassengers=16;
 f.root.userData.storyFixtures=PASSENGER_BLOCKOUT.map(({id},i)=>({id,footprint:t.voids?.[i]}));
 for(const [i,role] of PASSENGER_BLOCKOUT.entries()){
  const b=bounds(t.voids![i]),x=b.x*U,y=b.z*U;
  box(x,role.row?12:role.height/2,y,b.w*U,role.row?24:role.height,b.d*U,f.paint);
  if(!role.row)continue;
  const north=i<2,cy=north?308:572;
  for(let slot=0;slot<4;slot++){
   const cx=b.x0*U+25+slot*50;
   box(cx,32,cy,40,16,88,f.ivory);
   // Broad live band at each working face; no exposed occupants or glass.
   box(cx,36,north?351:529,32,6,2,f.cold);
  }
  box(x,28,north?248:632,200,8,16,f.dark);
 }
 // Flush, neutral route annotations. No raised pipes or extra blockers.
 for(const x of [420,780])for(const [y,length] of [[184,128],[696,128]])box(x,.08,y,3,.16,length,f.seam);
 const fallback=f.finish();fallback.name='passenger-equipment-fallback';room.root.add(fallback);
 room.root.userData.sealedPassengers=16;room.root.userData.storyFixtures=fallback.userData.storyFixtures;
 room.root.userData.lightFixtures=fallback.userData.lightFixtures;delete fallback.userData.lightFixtures;
 // Perimeter volumes are outside the same boundary queried by actors/shots.
 const wall=(x:number,h:number,y:number,w:number,d:number,l:number)=>room.box(x/U,h/U,y/U,w/U,d/U,l/U,room.paint,0);
 wall(600,24,34,1132,48,12);wall(600,12,846,1132,24,12);
 wall(34,12,440,12,24,800);wall(1166,12,440,12,24,800);
}
function breachedBay(f:Fabricator,t:RoomPlan){
 for(const hole of t.voids??[]){const b=bounds(hole);
  // Cross-section loft: a narrow dorsal keel, high shoulders and rolled-under
  // flanks. Both shell and ribs use this SAME profile, so ribs cannot sink into it.
  const axis=v(.81,0,.586).normalize(),across=v(-axis.z,0,axis.x),origin=v(b.x,0,b.z);
  const inset=hole.map(p=>({x:b.x*U+(p.x-b.x*U)*.86,y:b.z*U+(p.y-b.z*U)*.86}));
  const projection=inset.map(p=>v(p.x/U,0,p.y/U).sub(origin).dot(axis));
  const lo=Math.min(...projection)+.35,hi=Math.max(...projection)-.35;
  const sections:T.Vector3[][]=[];
  for(let along=lo;along<=hi;along+=.72){
   const center=origin.clone().addScaledVector(axis,along);if(!contains(inset,center.x,center.z))continue;
   const widths=[-1,1].map(side=>{let w=0;while(w<8&&contains(inset,center.x+across.x*(w+.05)*side,center.z+across.z*(w+.05)*side))w+=.05;return Math.max(.02,w-.16);});
   const taper=Math.sin(Math.PI*(along-lo+.3)/(hi-lo+.6)),crown=.35+2.15*Math.pow(Math.max(0,taper),.55);
   const section:T.Vector3[]=[];
   for(let j=0;j<=12;j++){const s=(j-6)/6,width=widths[s<0?0:1];section.push(center.clone().addScaledVector(across,s*width*.9*(.12+.88*Math.pow(Math.max(0,taper),.7))).setY(-.35+(crown+.35)*Math.pow(Math.max(0,1-s*s),.65)));}
   sections.push(section);
  }
  const vertices:number[]=[];
  for(let k=0;k<sections.length-1;k++)for(let j=0;j<12;j++){
   const a=sections[k][j],b=sections[k+1][j],c=sections[k][j+1],d=sections[k+1][j+1];
   for(const p of [a,c,b,c,d,b])vertices.push(p.x,p.y,p.z);
  }
  for(const [index,direction]of [[0,-1],[sections.length-1,1]]){const section=sections[index];if(!section)continue;const tip=section[6].clone().addScaledVector(axis,direction*.22).setY(-.32);for(let j=0;j<12;j++)for(const p of direction<0?[tip,section[j+1],section[j]]:[tip,section[j],section[j+1]])vertices.push(p.x,p.y,p.z);}
  const carapace=new T.BufferGeometry();carapace.setAttribute('position',new T.Float32BufferAttribute(vertices,3));carapace.setAttribute('uv',new T.Float32BufferAttribute(new Array(vertices.length/3*2).fill(0),2));carapace.computeVertexNormals();f.add(carapace,f.chitin);
  for(let k=1;k<sections.length-1;k++){
   const section=sections[k];for(let j=0;j<12;j++)f.pipe(section[j].clone().add(v(0,.11,0)),section[j+1].clone().add(v(0,.11,0)),.095,f.ribs);
   const crown=section[6];f.box(crown.x,crown.y+.15,crown.z,.4,.2,.27,f.rust,.035,-Math.atan2(axis.z,axis.x));
   if(k<sections.length-2)f.pipe(crown.clone().add(v(0,.08,0)),sections[k+1][6].clone().add(v(0,.08,0)),.12,f.dark);
  }
  // Ruptured, angled hull petals are local to the scar, not route obstacles.
  for(let i=0;i<hole.length;i++){const a=hole[i],q=hole[(i+1)%hole.length],x=(a.x+q.x)/2/U,z=(a.y+q.y)/2/U,angle=-Math.atan2(q.y-a.y,q.x-a.x),len=Math.hypot(q.x-a.x,q.y-a.y)/U;
   const tangent=v(Math.cos(-angle),0,Math.sin(-angle)),inward=v(b.x-x,0,b.z-z).normalize();
   // Short folded plates expose bright torn metal, interrupted by hydraulic shoes.
   for(let s=-len/2+.5;s<len/2-.2;s+=.85){const p=v(x,0,z).addScaledVector(tangent,s).addScaledVector(inward,.18);
    const fold=Math.abs(Math.round(s*13))%4;
    f.add(new T.BoxGeometry(.52+fold*.065,.075,.29+fold*.09),fold===0?f.rust:f.edge,p.clone().setY(.13+fold*.055),new T.Euler(.2+fold*.13,angle,.07*(fold-1)));
   }
   const anchor=v(x,0,z).addScaledVector(inward,.25),toe=anchor.clone().addScaledVector(inward,.8);
   f.box(anchor.x,.32,anchor.z,.7,.5,.66,f.paint,.035,angle);f.box(anchor.x,.6,anchor.z,.58,.06,.5,f.bronze,.02,angle);
   f.pipe(anchor.clone().setY(.56),toe.clone().setY(.26),.12,f.edge);f.box(toe.x,.23,toe.z,.58,.25,.38,f.dark,.025,angle);
   for(const side of [-1,1]){const bolt=anchor.clone().addScaledVector(tangent,side*.22);f.pipe(bolt.clone().setY(.62),bolt.clone().setY(.69),.065,f.bronze);}
   f.box(anchor.x,.66,anchor.z,.23,.035,.12,f.warm,.01,angle);
  }
 }
 const b=bounds(outline(t));f.sign('EMERGENCY HULL SEAL / HOLD',b.x,1.35,b.z0+.35,8);
 equipment(f,t,'cargo');
}
function reactorFloor(f:Fabricator,t:RoomPlan){
 for(const hole of t.voids??[]){const b=bounds(hole),radius=Math.min(b.w,b.d)*.42;
  f.pipe(v(b.x,-4.5,b.z),v(b.x,-.5,b.z),radius*.7,f.dark);
  for(const y of [-3.3,-1.4,.15]){f.ring(b.x,y,b.z,radius,.15,f.edge);f.ring(b.x,y+.2,b.z,radius*.83,.055,f.cold);}
  f.pipe(v(b.x,-3.9,b.z),v(b.x,.65,b.z),radius*.32,f.cold);
  f.ring(b.x,.72,b.z,radius*.45,.19,f.bronze);f.ring(b.x,.86,b.z,radius*.66,.13,f.ivory);
  for(let i=0;i<12;i++){const a=i*TAU/12,dx=Math.cos(a),dz=Math.sin(a);
   f.pipe(v(b.x+dx*radius*.82,-3.4,b.z+dz*radius*.82),v(b.x+dx*radius*.61,.55,b.z+dz*radius*.61),.16,f.bronze);
   // Suspended clamps are contained inside the non-walkable well.
   if(i%2===0){const x=b.x+dx*radius,z=b.z+dz*radius;
    f.box(x,.15,z,.78,.65,1.5,f.paint,.07,-a);f.box(x,.51,z,.64,.1,1.3,f.edge,.025,-a);
    f.box(x,.58,z,.43,.05,.72,f.dark,.025,-a);
    for(const side of [-1,1])for(const end of [-1,1]){const bx=x+dx*side*.25-dz*end*.52,bz=z+dz*side*.25+dx*end*.52;f.pipe(v(bx,.55,bz),v(bx,.65,bz),.065,f.bolts);}
    for(let j=-2;j<=2;j++)f.box(x-dz*j*.19,.63,z+dx*j*.19,.36,.035,.05,f.bronze,.008,-a);
    f.pipe(v(b.x+dx*radius*.5,.88,b.z+dz*radius*.5),v(x,.15,z),.10,f.edge);
    for(const side of [-1,1]){const start=v(x-dz*side*.25,-.3,z+dx*side*.25),elbow=start.clone().add(v(dx*.25,-1.2,dz*.25));f.pipe(start,elbow,.09,f.bronze);f.pipe(elbow,elbow.clone().add(v(-dx*.9,-.6,-dz*.9)),.09,f.paint);}
    f.box(x,.65,z,.14,.025,.14,i%4===0?f.warm:f.cold,.01);
   }
  }
  for(let i=0;i<3;i++){const a=i*TAU/3+.3,dx=Math.cos(a),dz=Math.sin(a);for(const offset of [-.2,.2])f.pipe(v(b.x+dx*radius*.75,-1,b.z+dz*radius*.75+offset),v(b.x+dx*radius*1.1,-2.8,b.z+dz*radius*1.1+offset),.18,f.paint);}
 }
 const b=bounds(outline(t));f.sign('CORE / MANUAL OVERLOAD',b.x,1.36,b.z0+.35,7);
 equipment(f,t,'reactor');
}
/** Coherent equipment assemblies inside exact collision footprints; no arbitrary object stretching. */
function equipment(f:Fabricator,t:RoomPlan,kind:'cryo'|'cargo'|'reactor'){
 for(const r of t.obstacles){const x=(r.x+r.width/2)/U,z=(r.y+r.height/2)/U,w=r.width/U,d=r.height/U;
  f.box(x,.12,z,w,.24,d,f.dark,.07);f.box(x,.47,z,w-.12,.62,d-.12,kind==='cargo'?f.rust:f.paint,.09);f.box(x,.82,z,w-.18,.1,d-.18,f.edge,.03);
  if(kind==='cargo'){
   // One reinforced pressure freight container, with lifting sockets and panel seams.
   for(let dx=-w/2+.3;dx<w/2;dx+=1.3)for(const side of [-1,1])f.box(x+dx,.49,z+side*(d/2-.1),.1,.71,.13,f.bronze,.02);
   f.box(x,.89,z,Math.min(2,w*.6),.045,.12,f.warm,.01);
  }else{
   for(let dx=-w/2+.65;dx<w/2-.3;dx+=1.25){f.box(x+dx,.91,z,.93,.14,Math.max(.3,d-.55),f.dark,.055);f.box(x+dx,1,z-.13,.62,.025,Math.min(.5,d*.3),f.cold,.025);for(let j=0;j<3;j++)f.box(x+dx-.22+j*.2,1.015,z+.29,.09,.02,.07,j===0?f.warm:f.ivory,.008);}
  }
  for(const side of [-1,1])f.box(x+side*(w/2-.12),.49,z,.15,.83,Math.max(.1,d-.12),f.ivory,.04);
 }
}
/** Flush service trenches and short paint brackets preserve quiet combat lanes. */
function deckServices(f:Fabricator,t:RoomPlan){
 const perimeter=outline(t),center=bounds(perimeter),walkable=(x:number,z:number)=>contains(perimeter,x,z)&&!(t.voids??[]).some(h=>contains(h,x,z));
 const strip=(a:T.Vector3,b:T.Vector3,width:number,m:T.Material)=>{
  const d=b.clone().sub(a),steps=Math.ceil(d.length()/.35);
  for(let i=0;i<=steps;i++){const p=a.clone().lerp(b,i/steps);if(!walkable(p.x,p.z))return;}
  const p=a.clone().add(b).multiplyScalar(.5);f.box(p.x,-.004,p.z,d.length(),.012,width,m,0,-Math.atan2(d.z,d.x));
 };
 for(let i=0;i<perimeter.length;i++){
  const a=perimeter[i],b=perimeter[(i+1)%perimeter.length],p=v(a.x/U,0,a.y/U),q=v(b.x/U,0,b.y/U),inward=v(center.x-(p.x+q.x)/2,0,center.z-(p.z+q.z)/2).normalize();
  p.lerp(q,.1).addScaledVector(inward,.8);q.lerp(v(a.x/U,0,a.y/U),.1).addScaledVector(inward,.8);
  strip(p,q,.075,f.seam);if(i%2===0)strip(p.clone().addScaledVector(inward,.12),q.clone().addScaledVector(inward,.12),.035,f.seam);
 }
 for(const hole of t.voids??[])for(let i=0;i<hole.length;i++){
  const a=hole[i],b=hole[(i+1)%hole.length],mid=v((a.x+b.x)/64,0,(a.y+b.y)/64),h=bounds(hole),out=mid.clone().sub(v(h.x,0,h.z)).normalize(),tangent=v(b.x-a.x,0,b.y-a.y).normalize();
  const p=mid.clone().addScaledVector(out,.52),q=p.clone().addScaledVector(tangent,.95);
  strip(p.clone().addScaledVector(tangent,-.95),q,.09,f.stencil);strip(q,q.clone().addScaledVector(out,.32),.07,f.stencil);
  for(let j=0;j<3;j++){const tick=p.clone().addScaledVector(tangent,(j-1)*.23).addScaledVector(out,.22);strip(tick,tick.clone().addScaledVector(out,.14),.06,f.stencil);}
 }
}
export function authoredRoom(id:string,t:RoomPlan):T.Group|null{
 if(!(AUTHORED_ROOMS as readonly string[]).includes(id))return null;
 const f=new Fabricator();f.root.name=`authored-${id}`;
 const deckPlan=id==='passenger-vault'?{...t,voids:[]}:t;
 f.add(new T.ExtrudeGeometry(roomDeckShape(deckPlan),{depth:.44,steps:1,bevelEnabled:false}),f.deck,v(0,-.46,0),new T.Euler(-Math.PI/2,0,0));
 if(id==='awakening-bay')awakeningEnvelope(f,t);else if(id!=='passenger-vault')edgeArchitecture(f,t,id==='breached-loading-bay');
 if(id!=='passenger-vault')deckServices(f,t);
 if(id==='awakening-bay')awakeningBay(f,t);else if(id==='passenger-vault')passengerVault(f,t);else if(id==='breached-loading-bay')breachedBay(f,t);else reactorFloor(f,t);
 return f.finish();
}
