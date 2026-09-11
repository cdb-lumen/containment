import * as T from 'three';
import type {Point,RoomTemplate} from '../game/roguelike/types';
import {MAT,box,rod,batch,geometries} from './meshParts';

/** Synchronous complete rough room. No optional asset/decode path: the same
 * geometry is always available, including when environment textures fail. */
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
 const garden=t.voids![0],inner=garden.map(p=>({x:600+(p.x-600)*.94,y:440+(p.y-440)*.94}));
 solid(garden,0,12,support);solid(garden,12,18,ceramic,inner);solid(inner,12,14,soil);
 pipe(v(530,22,440),v(670,22,440),2,bark);
 // Sparse, separated leaf cards rather than an opaque canopy. All crowns are
 // inset from the shared polygon and the far combat edge remains unobscured.
 for(const [cx,cz,r,height] of [[550,430,28,87],[650,465,32,96]]){
  pipe(v(cx,14,cz),v(cx+3,height-12,cz-2),3,bark);
  for(let i=0;i<9;i++){
   const a=i*2.4,x=cx+Math.cos(a)*r*.43,z=cz+Math.sin(a)*r*.43,y=height-12-(i%3)*10;
   pipe(v(cx+2,y-10,cz),v(x,y,z),1,bark);
   const shape=new T.Shape([new T.Vector2(-r*.38/32,0),new T.Vector2(0,r*.2/32),new T.Vector2(r*.38/32,0),new T.Vector2(0,-r*.2/32)]);
   const g=new T.ShapeGeometry(shape);const mesh=new T.Mesh(g,leaf);mesh.rotation.set(-Math.PI/2+.35,a,.2);mesh.position.copy(v(x,y,z));mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
  }
 }
 for(const f of t.obstacles)b(f.x+f.width/2,3,f.y+f.height/2,f.width,6,f.height,support);
 const bench=(x:number,z:number,depth:number)=>{
  for(const dx of [-32,32])b(x+dx,12,z,8,12,depth-2,support);
  b(x,20,z,88,4,depth,seat);b(x,28,z-depth/2+2,88,12,4,seat);
 };
 bench(322,240.5,25);bench(883,695,18);
 // Three joined facets form a shallow curved housing facing the southwest.
 const housing=[{x:287,y:180},{x:309,y:188},{x:331,y:205},{x:356,y:212}];
 const back=housing.map(p=>({x:p.x+5,y:p.y-7})).reverse();solid([...housing,...back],6,48,support);
 for(let i=0;i<housing.length-1;i++){
  const a=housing[i],c=housing[i+1],dx=c.x-a.x,dz=c.y-a.y;
  const panel=b((a.x+c.x)/2-.5,36,(a.y+c.y)/2+.7,Math.hypot(dx,dz)-3,13,1,signal);panel.rotation.y=-Math.atan2(dz,dx);
 }
 // A broad basin recess and a small spout communicate drinking water at rough scale.
 const circle=(radius:number)=>Array.from({length:20},(_,i)=>({x:875+Math.cos(i*Math.PI/10)*radius,y:652+Math.sin(i*Math.PI/10)*radius}));
 solid(circle(15),6,28,support);solid(circle(30),28,36,ceramic,circle(24));solid(circle(24),28,30,water);
 pipe(v(875,30,628),v(875,36,628),2,bark);pipe(v(875,36,628),v(875,36,638),2,bark);
 // Quiet flush promenade cues and enclosed communal rear bays. No false doors.
 for(const z of [240,640])b(600,-.22,z,350,.35,2,ceramic);
 for(let x=64;x<t.width;x+=128){b(x,42,-13,126,84,12,support);b(x,42,-5,5,84,5,ceramic);if(x%256===64)b(x,59,-6,48,18,2,ceramic);}
 // Batch all rough components together to eight owned material draws. Retire
 // uncached polygon/card source geometry; cached meshParts stay shared.
 const shared=new Set(geometries.values()),owned=new Set<T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh&&!shared.has(o.geometry))owned.add(o.geometry);});
 batch(root);owned.forEach(g=>g.dispose());return root;
}
