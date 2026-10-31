import * as T from 'three';

/** Room11 only. Flush floor finishes and rear cladding outside the collision envelope. */
export function diagnosticGalleryArchitecture():T.Group{
 const root=new T.Group();root.name='gallery-architecture';
 const material=(color:number,roughness=.85,metalness=.15)=>{
  const m=new T.MeshStandardMaterial({color,roughness,metalness,emissiveIntensity:0});m.userData.actorMaterial=true;return m;
 };
 const teal=material(0x365354),ivory=material(0x999c8e),dark=material(0x202d30),seam=material(0x131f23),steel=material(0x5d7476,.6,.4),deck=material(0x293638),theatre=material(0x3b5050);
 const add=(name:string,g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{
  const mesh=new T.Mesh(g,m);mesh.name=`gallery-${name}`;mesh.position.set(x/32,y/32,z/32);mesh.receiveShadow=true;root.add(mesh);return mesh;
 };
 const box=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{
  const mesh=add(name,new T.BoxGeometry(w/32,h/32,d/32),m,x,y,z);mesh.castShadow=true;return mesh;
 };
 const floor=(name:string,points:T.Vector2[],m:T.Material,y=.2)=>{
  const mesh=add(`floor-${name}`,new T.ShapeGeometry(new T.Shape(points)),m,0,y,0);mesh.rotation.x=-Math.PI/2;return mesh;
 };
 const rect=(name:string,x:number,z:number,w:number,d:number,m:T.Material,y=.2)=>floor(name,[new T.Vector2(x/32,-z/32),new T.Vector2((x+w)/32,-z/32),new T.Vector2((x+w)/32,-(z+d)/32),new T.Vector2(x/32,-(z+d)/32)],m,y);
 // Broad laid deck sheets. Thin dark joints are gaps, not raised tile borders.
 for(let row=0;row<8;row++)for(let col=0;col<4;col++)rect(`sheet-${row}-${col}`,12+col*294,12+row*107,292,105,deck);
 const arc=(radius:number,reverse=false)=>Array.from({length:65},(_,i)=>{
  const a=(reverse?180-i*180/64:i*180/64)*Math.PI/180;
  return new T.Vector2((600+radius*Math.cos(a))/32,-(220+radius*Math.sin(a))/32);
 });
 // Continuous semicircular working apron joins the board to its operator banks.
 floor('theatre-apron',[...arc(381),new T.Vector2(219/32,-220/32)],theatre,.24);
 floor('outer-seam',[...arc(385),...arc(381,true)],seam,.25);
 floor('ivory-arc',[...arc(373),...arc(371,true)],ivory,.26);
 // Quiet entry spine. Covered service trenches turn into the board sockets
 // and end beneath the cabinet drops. Flush lids preserve every crossing route.
 rect('entry-spine',583,614,34,246,teal,.24);
 for(const x of [582,616])rect(`entry-edge-${x}`,x,614,1.5,246,steel,.25);
 for(const [side,x,boardX] of [['west',346,408],['east',854,792]] as const){
  rect(`${side}-service-long`,x-8,182,16,222,steel,.28);
  rect(`${side}-service-turn`,Math.min(x,boardX)-8,182,Math.abs(boardX-x)+16,16,steel,.28);
  // Dark panel joints across the steel lids, rather than two loose floor rails.
  for(const z of [222,262,302,342,382])rect(`${side}-service-lid-joint-${z}`,x-8,z,16,1.5,seam,.29);
 }
 // Outboard ribbed wall. The central recess frames the cutaway without a second screen.
 for(let i=0;i<10;i++){
  const x=60+i*120;
  box(`shell-panel-${i}`,x,42,-16,118,84,20,teal);
  box(`shell-lower-${i}`,x,15,-4,108,26,3,dark);
  box(`shell-instrument-band-${i}`,x,51,-4,108,31,3,ivory);
  box(`shell-rib-${i}`,x-57,43,-3,4,86,5,steel);
  for(let j=0;j<4;j++)box(`shell-vent-${i}-${j}`,x-24+j*16,51,-2,7,17,1,dark);
 }
 box('shell-cutaway-recess',600,40,-1,414,68,1,dark);
 box('shell-header',600,79,-5,426,6,8,ivory);
 for(const x of [385,815])box(`shell-jamb-${x}`,x,40,-4,7,78,7,steel);
 // Cool task strips are unlit material, not new scene lights or a luminous veil.
 for(const x of [180,1020])box(`shell-task-strip-${x}`,x,72,-1,84,3,1,ivory);
 return root;
}
