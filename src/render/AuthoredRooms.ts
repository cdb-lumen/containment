import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Point=Readonly<{x:number;y:number}>;
type Outline=readonly Point[];
type RoomPlan=Readonly<{width:number;height:number;boundary?:Outline;voids?:readonly Outline[];obstacles:readonly {x:number;y:number;width:number;height:number}[]}>;
const U=32,TAU=Math.PI*2;
export const AUTHORED_ROOMS=['passenger-vault','breached-loading-bay','overload-floor'] as const;
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
 readonly paint=this.mat(0x34454b,.62,.66);readonly edge=this.mat(0x718184,.7,.36);
 readonly dark=this.mat(0x101b22,.5,.65);readonly deck=this.mat(0x263238,.32,.91);
 readonly ivory=this.mat(0x9dada6,.58,.4);readonly bronze=this.mat(0x91714a,.73,.42);
 readonly rust=this.mat(0x71452d,.56,.72);readonly chitin=this.mat(0x303b35,.25,.78);
 readonly ribs=this.mat(0x697164,.48,.64);readonly bolts=this.mat(0x69767a,.78,.47);
 readonly seam=this.mat(0x293a40,.3,.88);readonly stencil=this.mat(0x77745c,.2,.9);
 constructor(){
  this.chitin.name='boarding-carapace';this.ribs.name='boarding-ribs';this.bolts.name='reactor-fasteners';this.deck.name='painted-steel-deck';
  // Eight-metre paint sheet: fine rolled grain, broad rubbed patches and sparse
  // staggered plate joints. No image requests or canvas dependency.
  const size=256,albedo=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
   const i=(z*size+x)*4,hash=((x*73856093)^(z*19349663))>>>0,grain=(hash%13)-6;
   const wear=Math.sin(x*.037+Math.sin(z*.025))*3+Math.cos(z*.052)*2;
   const joint=(z===0||z===128||((x+(z<128?0:96))%256===0))?14:0;
   const scratch=(hash%229===0&&x%19<12)?9:0,c=Math.round(228+grain*.55+wear-joint+scratch);
   albedo.set([c,c,c,255],i);const r=224+hash%23;rough.set([r,r,r,255],i);
  }
  const texture=(data:Uint8Array)=>{const t=new T.DataTexture(data,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
  this.deck.map=texture(albedo);this.deck.map.colorSpace=T.SRGBColorSpace;this.deck.roughnessMap=texture(rough);
  this.deck.addEventListener('dispose',()=>{this.deck.map?.dispose();this.deck.roughnessMap?.dispose();});
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
 box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,r=.04,angle=0){this.add(r?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),m,v(x,y,z),new T.Euler(0,angle,0));}
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
 finish(){for(const [material,parts]of this.parts){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(geometry){const mesh=new T.Mesh(geometry,material);mesh.userData.bakedEnvironment=true;mesh.castShadow=true;mesh.receiveShadow=true;this.root.add(mesh);}}
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
   const a=hole[i],b=hole[(i+1)%hole.length],p=v(a.x/U,0,a.y/U),q=v(b.x/U,0,b.y/U),length=p.distanceTo(q),steps=Math.ceil(length/2.2);
   f.pipe(p.clone().setY(-.26),q.clone().setY(-.26),.16,f.edge);if(scar)continue;f.pipe(p.clone().setY(.45),q.clone().setY(.45),.045,f.ivory);
   f.pipe(p.clone().setY(-2.8),q.clone().setY(-2.8),.11,f.cold);
   for(let j=0;j<steps;j++){const s=p.clone().lerp(q,j/steps);f.pipe(s.clone().setY(-3.8),s.clone().setY(.5),.065,f.paint);}
  }
 }
}
function passengerVault(f:Fabricator,t:RoomPlan){
 for(const hole of t.voids??[]){const b=bounds(hole);
  // Occupied pressure pods remain human-sized, stacked under the balcony.
  for(let x=b.x0+1.05;x<b.x1-.9;x+=2.05){
   // Solve each column against the sloping back wall instead of discarding a
   // whole bank when a global grid begins just outside that polygon.
   const candidates:number[]=[];for(let z=b.z0+1.46;z<b.z1-1.45;z+=.08)
    if([[-.89,-1.43],[.89,-1.43],[-.89,1.43],[.89,1.43]].every(([dx,dz])=>contains(hole,x+dx,z+dz)))candidates.push(z);
   if(!candidates.length)continue;const z=candidates[Math.floor(candidates.length/2)];
   for(const y of [-3.05,-.95]){
    f.box(x,y,z,1.72,.62,2.8,f.ivory,.18);f.box(x,y+.34,z,1.31,.09,2.34,f.dark,.12);
    f.ellipsoid(x,y+.48,z-.67,.19,.16,.22,f.skin);f.ellipsoid(x,y+.45,z-.04,.29,.12,.46,f.body);
    for(const side of [-1,1]){f.pipe(v(x+side*.14,y+.43,z+.25),v(x+side*.16,y+.43,z+.9),.105,f.body);f.box(x+side*.67,y+.39,z,.055,.04,2.05,f.cold,.012);}
    f.box(x,y+.53,z+.46,1.63,.12,.14,f.edge);f.box(x,y+.39,z+1.15,.46,.04,.12,f.warm,.01);
   }
  }
  for(const side of [-1,1])f.pipe(v(b.x+side*(b.w/2-.3),-3.9,b.z0+.4),v(b.x+side*(b.w/2-.3),-3.9,b.z1-.4),.18,f.bronze);
 }
 const boundary=bounds(outline(t));f.sign('PASSENGERS / VITALS NOMINAL',boundary.x,1.36,boundary.z0+.35,7.8);
 equipment(f,t,'cryo');
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
 f.add(new T.ExtrudeGeometry(roomDeckShape(t),{depth:.44,steps:1,bevelEnabled:false}),f.deck,v(0,-.46,0),new T.Euler(-Math.PI/2,0,0));
 edgeArchitecture(f,t,id==='breached-loading-bay');deckServices(f,t);
 if(id==='passenger-vault')passengerVault(f,t);else if(id==='breached-loading-bay')breachedBay(f,t);else reactorFloor(f,t);
 return f.finish();
}
