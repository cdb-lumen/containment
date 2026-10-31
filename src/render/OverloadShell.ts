import * as T from 'three';

type Point=Readonly<{x:number;y:number}>;
type Plan=Readonly<{height:number;boundary?:readonly Point[];voids?:readonly (readonly Point[])[]}>;
/** Room20-only finishes. Walkable finishes are flush. Raised work follows the
 * existing wall footprint; structure below the deck never changes collision. */
export function createOverloadShell(t:Plan){
 const root=new T.Group();root.name='overload-shell';
 const mat=(name:string,color:number,metalness:number,roughness:number)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});m.name=name;m.userData.actorMaterial=true;return m;};
 const ceramic=mat('overload-thermal-ceramic',0x8b968b,.12,.88),steel=mat('overload-shell-steel',0x455c62,.68,.58),recess=mat('overload-shell-recess',0x111e24,.35,.85),copper=mat('overload-heat-copper',0x967043,.7,.6),wear=recess;
 let group:T.Group;
 const role=(name:string)=>{group=new T.Group();group.name=name;root.add(group);};
 const box=(x:number,h:number,z:number,w:number,d:number,thickness:number,m:T.Material,angle=0)=>{const mesh=new T.Mesh(new T.BoxGeometry(w/32,thickness/32,d/32),m);mesh.position.set(x/32,h/32,z/32);mesh.rotation.y=angle;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);};
 const slab=(points:Point[],m:T.Material)=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  const geo=new T.ExtrudeGeometry(shape,{depth:.018,steps:1,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,m===wear?-.011:-.013,0);
  const mesh=new T.Mesh(geo,m);mesh.receiveShadow=true;group.add(mesh);
 };
 role('thermal-apron');
 const hole=t.voids?.[0]??[],cx=600,cz=430;
 const scale=(p:Point,s:number)=>({x:cx+(p.x-cx)*s,y:cz+(p.y-cz)*s});
 const lerp=(a:Point,b:Point,s:number)=>({x:a.x+(b.x-a.x)*s,y:a.y+(b.y-a.y)*s});
 // A broad segmented refractory apron belongs to the pit, not detached floor pads.
 for(let i=0;i<hole.length;i++){
  const a=hole[i],b=hole[(i+1)%hole.length];
  for(let j=0;j<3;j++){
   const p=lerp(a,b,(j+.025)/3),q=lerp(a,b,(j+.975)/3);
   slab([scale(p,1.025),scale(q,1.025),scale(q,1.23),scale(p,1.23)],ceramic);
   slab([scale(p,1.025),scale(q,1.025),scale(q,1.065),scale(p,1.065)],wear);
   slab([scale(p,1.245),scale(q,1.245),scale(q,1.265),scale(p,1.265)],copper);
  }
 }
 role('service-decks');
 // Inset heat exchanger access grilles in each lateral lobe. Flush strips,
 // rather than raised furniture, keep all four breach approaches usable.
 for(const x of [235,965]){
  box(x,-.4,440,116,286,.5,recess);
  for(const dx of [-57,57])box(x+dx,0,440,3,286,.4,copper);
  for(let z=301;z<580;z+=12)box(x,0,z,108,3,.5,steel);
  for(const z of [300,440,580])box(x,.1,z,116,5,.4,steel);
 }
 // Broad cooler steel plates distinguish the north service lobe.
 for(const x of [531,600,669]){
  box(x,-.1,181,65,116,.4,steel);
  box(x,0,127,58,4,.4,copper);
 }
 role('perimeter-armour');
 const boundary=t.boundary??[];
 for(let i=0;i<boundary.length;i++){
  const a=boundary[i],b=boundary[(i+1)%boundary.length];
  if((a.y+b.y)/2>=t.height*.32)continue;
  const length=Math.hypot(b.x-a.x,b.y-a.y),angle=-Math.atan2(b.y-a.y,b.x-a.x),n=Math.ceil(length/70);
  for(let j=0;j<n;j++){
   const p=lerp(a,b,(j+.5)/n),w=length/n-5;
   box(p.x,13,p.y,w,12,23,ceramic,angle);
   box(p.x,26,p.y,w+2,14,4,copper,angle);
   box(p.x,-3,p.y,w+2,13,7,recess,angle);
  }
 }
 role('underdeck-frame');
 for(let i=0;i<boundary.length;i++){
  const a=boundary[i],b=boundary[(i+1)%boundary.length],p=lerp(a,b,.5),length=Math.hypot(b.x-a.x,b.y-a.y),angle=-Math.atan2(b.y-a.y,b.x-a.x);
  box(p.x,-21,p.y,length,10,22,recess,angle);
  box(p.x,-33,p.y,length,14,4,steel,angle);
  for(const s of [.2,.5,.8]){const q=lerp(a,b,s);box(q.x,-20,q.y,7,15,24,copper,angle);}
 }
 return root;
}
