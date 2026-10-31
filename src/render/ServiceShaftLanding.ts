import * as T from 'three';
import type {RoomTemplate,Point} from '../game/roguelike/types';

const U=32;
/** Room14 shell and machinery. All dimensions are game units. The template owns
 * the floor cutout and collision; machinery and edge protection stay inside it. */
export function serviceShaftLanding(t:RoomTemplate):T.Group{
 const root=new T.Group();root.name='service-shaft-landing';
 const material=(name:string,color:number,metalness=.45,emissive=0)=>{
  const m=new T.MeshStandardMaterial({name:`shaft-${name}`,color,metalness,roughness:.72,emissive,emissiveIntensity:emissive?.35:0});m.userData.actorMaterial=true;return m;
 };
 const steel=material('steel',0x46565f,.65),zinc=material('zinc',0x9aa8aa,.65),dark=material('depth',0x202e3a,.25),deck=material('deck',0x58676a,.25),amber=material('amber',0xcb9552,.35,0x7a481d),fiber=material('fiber',0x75acb5,.2,0x24454b);
 zinc.roughness=.48;deck.roughness=.92;dark.roughness=.88;
 const grate=material('worn-grate',0x687c83,.5);grate.roughness=.84;
 // Low-contrast rolled-metal grain, generated locally with no borrowed assets.
 const pixels=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const i=(y*64+x)*4,v=225+((x*17+y*31+x*y*3)%23);
  pixels[i]=pixels[i+1]=pixels[i+2]=v;pixels[i+3]=255;
 }
 const grain=new T.DataTexture(pixels,64,64);grain.colorSpace=T.SRGBColorSpace;
 grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(.7,.7);
 grain.magFilter=T.LinearFilter;grain.minFilter=T.LinearMipmapLinearFilter;grain.generateMipmaps=true;grain.needsUpdate=true;
 deck.map=grain;deck.addEventListener('dispose',()=>grain.dispose());
 const group=(name:string)=>{const g=new T.Group();g.name=name;root.add(g);return g;};
 const mesh=(g:T.Group,geometry:T.BufferGeometry,m:T.Material)=>{
  // bakeWorld consumes this room-owned geometry, unlike the shared mesh cache.
  geometry.userData.environmentUV=true;
  const o=new T.Mesh(geometry,m);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;
 };
 const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const o=mesh(g,new T.BoxGeometry(w/U,h/U,d/U),m);o.position.set(x/U,y/U,z/U);return o;};
 const beam=(g:T.Group,a:number[],b:number[],radius:number,m:T.Material)=>{
  const p=new T.Vector3(...a.map(n=>n/U) as [number,number,number]),q=new T.Vector3(...b.map(n=>n/U) as [number,number,number]);
  const o=mesh(g,new T.CylinderGeometry(radius/U,radius/U,p.distanceTo(q),8),m);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o;
 };
 const path=(points:readonly Point[])=>points.map(p=>new T.Vector2(p.x/U,-p.y/U));
 const outline=t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];
 const floorShape=new T.Shape(path(outline));for(const hole of t.voids??[])floorShape.holes.push(new T.Path(path(hole)));
 const floor=mesh(group('connected-balcony'),new T.ExtrudeGeometry(floorShape,{depth:12/U,bevelEnabled:false,steps:1}),deck);floor.rotation.x=-Math.PI/2;floor.position.y=-12/U;
 const curb=group('shaft-curbs'),depth=group('shaft-depth');
 for(const hole of t.voids??[]){
  const bottom=mesh(depth,new T.ShapeGeometry(new T.Shape(path(hole))),dark);bottom.rotation.x=-Math.PI/2;bottom.position.y=-150/U;
  for(let i=0;i<hole.length;i++){
   const a=hole[i],b=hole[(i+1)%hole.length];
   // Clockwise plan polygons have their solid interior to the right. Inset
   // every curb and post so no visually blocked space is legal walking floor.
   const dx=b.x-a.x,dz=b.y-a.y,length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
   const x=(a.x+b.x)/2+nx*7,z=(a.y+b.y)/2+nz*7;
   const horizontal=dz===0;
   box(curb,x,5,z,horizontal?length-16:12,10,horizontal?12:length-16,steel);
   box(depth,x,-76,z,horizontal?length-16:8,136,horizontal?8:length-16,steel);
   const posts=Math.floor(length/110);
   for(let j=0;j<posts;j++){
    const s=(j+.5)/posts,px=a.x+dx*s+nx*8,pz=a.y+dz*s+nz*8;
    box(curb,px,19,pz,8,28,8,zinc);
    box(curb,px,34,pz,12,3,12,amber);
   }
  }
 }
 const guides=group('guides'),weight=group('counterweight'),sheaves=group('sheaves'),bracing=group('bracing');
 // Recessed stacked weight between a single pair of lift guides, not a rack.
 box(weight,580,-49,430,124,116,92,steel);
 for(const x of [526,634])box(weight,x,-49,479,8,116,7,dark);
 for(const y of [-94,-69,-44,-19])box(weight,580,y,478,118,18,5,zinc);
 const frame=new T.Group();frame.name='weight-frame';weight.add(frame);
 for(const x of [510,650])box(frame,x,-44,470,12,140,18,steel);
 for(const y of [-108,20])box(frame,580,y,466,178,12,28,steel);
 for(const y of [-80,12]){
  box(frame,580,y,430,170,10,20,steel);
  for(const x of [510,650])box(frame,x,y,450,12,14,52,steel);
 }
 // Broad retaining straps distinguish the removable weight plates from the cage.
 for(const x of [536,624])box(weight,x,-55,483,7,105,3,dark);
 for(const x of [478,682]){
  box(guides,x,-17,430,13,232,20,zinc);
  box(guides,x,-17,439,24,232,6,steel);
  for(const y of [-80,12]){
   box(guides,x+(x<580?18:-18),y,430,27,20,29,steel);
   const roller=mesh(guides,new T.CylinderGeometry(9/U,9/U,10/U,12),amber);roller.rotation.x=Math.PI/2;roller.position.set(x/U,y/U,445/U);
  }
  const wheel=new T.Group();wheel.name=`sheave-${x}`;sheaves.add(wheel);
  // Paired cheeks leave a dark rope groove. The axle runs through the hub,
  // with two bearing blocks carried by the guide head, not across the wheel.
  for(const z of [426,434]){
   const rim=mesh(wheel,new T.TorusGeometry(22/U,3/U,8,24),zinc);rim.position.set(x/U,99/U,z/U);rim.name='rim';
  }
  const groove=mesh(wheel,new T.TorusGeometry(21/U,2/U,8,24),dark);groove.position.set(x/U,99/U,430/U);
  beam(wheel,[x,99,423],[x,99,439],7,steel).name='hub';
  beam(wheel,[x,99,408],[x,99,452],3,zinc).name='axle';
  for(const [z,name] of [[411,'bearing-rear'],[449,'bearing-front']] as const){
   box(wheel,x,94,z,16,19,8,steel).name=name;
   box(wheel,x,81,z,26,9,12,zinc).name=`${name}-pad`;
  }
  for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
   beam(wheel,[x+6*Math.cos(angle),99+6*Math.sin(angle),435],[x+20*Math.cos(angle),99+20*Math.sin(angle),435],2.5,zinc).name='spoke';
  }
  for(const dx of [-22,22])beam(sheaves,[x+dx,-126,430],[x+dx,99,430],1.6,zinc);
 }
 box(guides,580,69,430,228,16,28,steel);
 // Expose the rear structural bay above the rim. Its lower posts still reach
 // the shaft base; the diagonal is clear of the counterweight silhouette.
 for(const [z,low,high] of [[285,-15,65],[530,-128,-22]]){
  const truss=new T.Group();truss.name=z===285?'rear-truss':'front-truss';bracing.add(truss);
  beam(truss,[470,low,z],[690,high,z],6,zinc);beam(truss,[690,low,z],[470,high,z],6,zinc);
  for(const x of [470,690]){
   for(const y of [low,high])box(truss,x,y,z,22,20,12,steel);
   beam(truss,[x,-132,z],[x,high,z],7,steel);
  }
  beam(truss,[470,high,z],[690,high,z],4,steel);
 }
 // Side ties transfer the guide-head load to the rear posts.
 for(const x of [470,690])beam(bracing,[x,65,285],[x,69,430],4,steel);
 const local=group('local-junction');
 box(local,359,-10,405,34,80,44,steel);box(local,359,33,405,36,6,46,amber);
 // West working face: mechanical call plate. No invented reconnect interaction.
 box(local,341.5,17,393,2,21,16,zinc);box(local,340.8,17,393,1,8,8,dark);
 // Empty socket and a visibly pulled fiber plug, separated by an air gap.
 box(local,349,38,409,11,4,11,dark);
 box(local,373,39,418,13,7,16,fiber);
 box(local,373,39,407,9,5,5,zinc);
 beam(local,[377,36,426],[384,18,436],3.5,fiber);
 beam(local,[384,18,436],[384,-18,438],3.5,fiber);
 // Mount the sign on the north curb, clear of the raised rear truss.
 // Canvas is room-local and disposed with it.
 box(local,810,9,258,172,12,32,steel);
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');
  if(ctx){ctx.fillStyle='#27343b';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#e6ba79';ctx.font='bold 72px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('LOCAL ACCESS ONLY',512,66,1000);
   const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
   const m=new T.MeshStandardMaterial({map:texture,roughness:.8});m.userData.actorMaterial=true;m.addEventListener('dispose',()=>texture.dispose());
   const sign=mesh(local,new T.PlaneGeometry(168/U,27/U),m);sign.rotation.x=-Math.PI/2;sign.position.set(810/U,15.1/U,258/U);
  }
 }
 const shell=group('outer-shell');
 box(shell,600,22,-6,1200,68,12,steel);
 for(const x of [0,1200])box(shell,x,8,440,10,28,880,steel);
 box(shell,600,4,886,1200,20,12,steel);
 // Recessed wall panels and exposed flanges stay beyond the legal boundary.
 const ribs=group('wall-ribs');
 for(let x=60;x<1200;x+=120){
  box(ribs,x,20,-.8,108,48,1.2,dark);
  box(ribs,x-56,22,-5,7,66,10,zinc);
  box(ribs,x,48,-4,106,4,6,zinc);
  if(x%240===60)box(ribs,x,43,-.6,30,4,1,amber);
 }
 for(const x of [-1,1201])for(let z=80;z<880;z+=120)box(ribs,x,10,z,1.5,26,10,zinc);
 // Welded floor cassettes are flush markings, not new raised obstacles.
 // Three runs trace the connected C, with separate short exit-side panels.
 const finish=group('deck-finish');
 const panel=(x:number,z:number,w:number,d:number)=>{
  box(finish,x,.08,z,w,.16,d,steel);
  for(const dz of [-d/2+3,d/2-3])box(finish,x,.19,z+dz,w-6,.12,1.4,grate);
  for(const dx of [-w/2+3,w/2-3])box(finish,x+dx,.19,z,1.4,.12,d-6,grate);
  // Dark slots with a worn zinc lip read as grating without opening the floor.
  for(let dz=-d/2+12;dz<d/2-8;dz+=12){
   box(finish,x,.18,z+dz,w-20,.12,3,dark);
   box(finish,x,.27,z+dz+2,w-20,.1,1,grate);
  }
 };
 for(const z of [140,740])for(let x=110;x<1200;x+=140)panel(x,z,126,104);
 for(const z of [280,420,560])panel(180,z,104,126);
 for(const z of [300,460])panel(1050,z,150,110);
 // Narrow drainage seams and worn edge paint follow real shaft edges only.
 for(const [x,z,w,d] of [[620,220,552,3],[620,660,552,3],[320,440,3,390],[920,380,3,292],[1050,520,250,3],[1050,660,250,3]]){
  box(finish,x,.15,z,w,.2,d,dark);
 }
 for(const z of [228,652])for(let x=368;x<900;x+=80)box(finish,x,.22,z,32,.2,4,amber);
 return root;
}
