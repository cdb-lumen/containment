import * as T from 'three';
import type {Point,RoomTemplate} from '../game/roguelike/types';
import {COMMUNAL_ATRIUM_BLOCKOUT} from '../game/roguelike/authoredRoomTopologies';
import {MAT,box,rod} from './meshParts';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import gardenTrees from './garden-trees.json';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Split garden court: fit each authored bed independently in loaded and fallback modes. */
export function communalAtrium(t:RoomTemplate, fixtures=COMMUNAL_ATRIUM_BLOCKOUT, garden?:T.Group):T.Group{
 const root=new T.Group();root.name='communal-atrium-rough';
 const finish=(name:string,source:T.MeshStandardMaterial,color:number,metalness:number,roughness:number)=>{
  const m=source.clone();m.name=`ca_${name}`;m.color.setHex(color);m.metalness=metalness;m.roughness=roughness;m.emissive.setHex(0);m.emissiveIntensity=0;m.userData.actorMaterial=true;return m;
 };
 const support=finish('support',MAT.steel,0x343a37,.6,.72),ceramic=finish('ceramic',MAT.bone,0x666557,.05,.87);
 const soil=finish('soil',MAT.rubber,0x30271f,0,1),leaf=finish('leaf',MAT.shell,0x486344,0,.92);
 const bark=finish('irrigation',MAT.copper,0x625344,.3,.83),seat=finish('upholstery',MAT.red,0x765747,0,.93);
 const signal=finish('welcome',MAT.amber,0xa88b59,.1,.7),water=finish('water',MAT.shellDark,0x354e4c,.25,.28);
 signal.emissive.setHex(0x9b6b32);signal.emissiveIntensity=.22;leaf.side=T.DoubleSide;
 const allocated=new Set<T.BufferGeometry>(),retained=new Set<T.BufferGeometry>();let complete=false;
 const own=(g:T.BufferGeometry)=>{allocated.add(g);return g;};
 try{
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>box(root,x/32,y/32,z/32,w/32,h/32,d/32,m,0);
 const padded=(x:number,y:number,z:number,w:number,h:number,d:number,r:number,m:T.Material)=>{
  const g=own(new RoundedBoxGeometry(w/32,h/32,d/32,1,r/32));
  g.translate(x/32,y/32,z/32);const mesh=new T.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 };
 const v=(x:number,y:number,z:number)=>new T.Vector3(x/32,y/32,z/32);
 const pipe=(a:T.Vector3,c:T.Vector3,r:number,m:T.Material)=>rod(root,a,c,r/32,r/32,m);
 const solid=(points:readonly Point[],bottom:number,top:number,m:T.Material,hole?:readonly Point[])=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  if(hole)shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p.x/32,-p.y/32))));
  const g=own(new T.ExtrudeGeometry(shape,{depth:(top-bottom)/32,bevelEnabled:false,steps:1,curveSegments:1}));g.rotateX(-Math.PI/2);g.translate(0,bottom/32,0);
  const mesh=new T.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 };
 for(const [index,inputFixture] of fixtures.entries()){
  // Build both garden modes in the authored 144x64 frame. Rotate a longitudinal
  // bed before fitting its shared collision footprint; keep plant height unchanged.
  const isGarden=inputFixture.kind==='garden';
  const longitudinal=isGarden&&inputFixture.h>inputFixture.w;
  const f=isGarden?{...inputFixture,w:144,h:64}:inputFixture;
  const firstGardenChild=root.children.length;
  const footprint=[{x:f.x,y:f.y},{x:f.x+f.w,y:f.y},{x:f.x+f.w,y:f.y+f.h},{x:f.x,y:f.y+f.h}],cx=f.x+f.w/2,cz=f.y+f.h/2;
  if(f.kind==='garden'&&garden){
   const roles:Record<string,T.Material>={ca_support:support,ca_ceramic:ceramic,ca_soil:soil,ca_leaf:leaf,ca_irrigation:bark};
   garden.updateWorldMatrix(true,true);let triangles=0;
   garden.traverse(o=>{if(o instanceof T.Mesh){
    const g=own(o.geometry.clone());g.applyMatrix4(o.matrixWorld);g.translate(cx/32,0,cz/32);
    const mesh=new T.Mesh(g,roles[(o.material as T.Material).name]);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
    triangles+=(g.index?.count??g.attributes.position.count)/3;
   }});root.userData.authoredGardenTriangles=triangles;
  }else if(f.kind==='garden'){
   const inner=footprint.map(p=>({x:p.x+(p.x<cx?5:-5),y:p.y+(p.y<cz?5:-5)}));
   solid(footprint,0,17,support);solid(footprint,17,23,ceramic,inner);solid(inner,17,19,soil);
   // Generated from the authored export's roundtripped tree meshes.
   for(const tree of gardenTrees){
    const g=own(new T.BufferGeometry());
    g.setAttribute('position',new T.Float32BufferAttribute(tree.positions,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(tree.normals,3));g.setIndex(tree.indices);
    g.translate(cx/32,0,cz/32);
    const crown=new T.Mesh(g,tree.role==='ca_leaf'?leaf:bark);
    crown.castShadow=crown.receiveShadow=true;root.add(crown);
   }
  }else if(f.kind==='table'){
   // Ceramic top on a recessed steel apron, with the reviewed top height.
   // The space beneath remains a solid gameplay reservation, not a passage.
   padded(cx,22,cz,f.w,4,f.h,.8,ceramic);
   b(cx,19,cz,f.w-3,2,f.h-3,support);
   for(const dx of [-f.w/2+6,f.w/2-6])for(const dz of [-f.h/2+6,f.h/2-6])b(cx+dx,9,cz+dz,8,18,8,support);
  }else if(f.kind.startsWith('seat-')){
   // A padded insert above a full-width metal seat pan. Keep the old envelope,
   // support contacts and outward-facing backs; no fixture moves.
   const alongX=f.w>f.h;
   b(cx,9.4,cz,f.w,2,f.h,support);
   padded(cx,12.4,cz,f.w-2,4,f.h-2,1,seat);
   if(alongX){
    for(const dx of [-Math.min(f.w*.38,f.w/2-4),0,Math.min(f.w*.38,f.w/2-4)])b(cx+dx,4.2,cz,8,8.4,f.h-6,support);
    const backZ=f.kind==='seat-north'?f.y+3:f.y+f.h-3,front=f.kind==='seat-north'?1:-1;
    padded(cx,24.4,backZ-front*.75,f.w,20,1.5,.6,support);
    padded(cx,24.4,backZ-front*2.25,f.w-3,17,1.5,.6,seat);
    padded(cx,24.4,backZ+front*1.5,f.w-3,17,3,1,seat);
    for(const dx of [-f.w/2+1,f.w/2-1])b(cx+dx,18.4,cz,2,8,f.h,support);
   }else{
    for(const dz of [-Math.min(f.h*.38,f.h/2-4),0,Math.min(f.h*.38,f.h/2-4)])b(cx,4.2,cz+dz,f.w-6,8.4,8,support);
    const backX=f.kind==='seat-west'?f.x+3:f.x+f.w-3,front=f.kind==='seat-west'?1:-1;
    padded(backX-front*.75,24.4,cz,1.5,20,f.h,.6,support);
    padded(backX-front*2.25,24.4,cz,1.5,17,f.h-3,.6,seat);
    padded(backX+front*1.5,24.4,cz,3,17,f.h-3,1,seat);
    for(const dz of [-f.h/2+1,f.h/2-1])b(cx,18.4,cz+dz,f.w,8,2,support);
   }
  }else if(f.kind==='water'){
   // Refreshment counter south of the paired garden and dining court.
   // Its inset basin and dispenser stay inside the shared rectangle.
   solid(footprint,0,32,support);
   const circle=(radius:number)=>Array.from({length:20},(_,i)=>({x:cx+10+Math.cos(i*Math.PI/10)*radius,y:cz+Math.sin(i*Math.PI/10)*radius}));
   solid(footprint,32,36,ceramic,circle(17));solid(circle(17),32,33,water);
   b(f.x+13,44,cz,18,24,32,support);b(f.x+23,49,cz,3,10,18,ceramic);
   pipe(v(cx+12,34,cz-16),v(cx+12,44,cz-16),2,bark);pipe(v(cx+12,44,cz-16),v(cx+12,44,cz-7),2,bark);
  }else if(f.kind==='back'){
   // Low shared backing, when authored, uses its complete collision rectangle.
   solid(footprint,0,32,support);
  }else{
   // Recess only the welcome housing front .2 units; signal and query stay fixed.
   const recessed=footprint.map(p=>({x:p.x,y:p.y===f.y+f.h?p.y-.2:p.y}));
   solid(recessed,0,62,support);
   // Small welcome display beside the west garden.
   b(cx,47,f.y+f.h-.6,f.w-12,22,1,signal);
   // Rough public-information graphic: information symbol and two notice rows.
   // Same support material, contained within the existing face, no new fittings.
   const ink=(x:number,y:number,w:number,h:number)=>b(x,y,f.y+f.h-.105,w,h,.01,support);
   const left=f.x+9;
   ink(left+3,53,3,3);ink(left+3,45,3,9);ink(left+3,40,7,2);
   const start=left+12,end=f.x+f.w-10;
   ink((start+end)/2,53,end-start,2.5);
   ink((start+end-7)/2,47,end-start-7,2.5);
   ink((start+end-13)/2,41,end-start-13,2.5);

  }
  if(isGarden){
   const transform=new T.Matrix4().makeTranslation((inputFixture.x+inputFixture.w/2)/32,0,(inputFixture.y+inputFixture.h/2)/32)
    .multiply(new T.Matrix4().makeRotationY(longitudinal?-Math.PI/2:0))
    .multiply(new T.Matrix4().makeScale((longitudinal?inputFixture.h:inputFixture.w)/144,1,(longitudinal?inputFixture.w:inputFixture.h)/64))
    .multiply(new T.Matrix4().makeTranslation(-cx/32,0,-cz/32));
   for(const child of root.children.slice(firstGardenChild)){child.updateMatrix();child.matrix.premultiply(transform);child.matrixAutoUpdate=false;}
  }
 }
 // The enclosure and passage-facing seats define circulation without detached
 // floor strokes implying equivalent outer loops.
 // Room4 rear panels occupy the first horizontal, northernmost boundary edge.
 // DepthRenderer renders the remaining stepped enclosure edges from this same polygon.
 const northY=Math.min(...t.boundary!.map(p=>p.y)),north=t.boundary!.filter(p=>p.y===northY),west=Math.min(...north.map(p=>p.x)),east=Math.max(...north.map(p=>p.x));
 for(let left=west;left<east;left+=128){const right=Math.min(left+128,east),x=(left+right)/2;
  b(x,42,northY-6.08,right-left,84,12.16,support);
  b(x,42,northY-10,5,84,4,ceramic);if(Math.floor((left-west)/128)%2===0)b(x,59,northY-11,Math.min(48,right-left),18,2,ceramic);
 }

 // Imported factor-only meshes have no UVs. Separate compatible attributes so
 // material-only merging cannot silently drop geometry or invent texture UVs.
  const buckets=new Map<string,{material:T.Material;list:T.BufferGeometry[]}>();root.updateMatrixWorld(true);
  for(const child of [...root.children])if(child instanceof T.Mesh){
   const g=own(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone());g.applyMatrix4(child.matrix);
   const material=child.material as T.Material;
   const signature=Object.keys(g.attributes).sort().map(k=>{const a=g.attributes[k];return `${k}/${a.itemSize}/${a.normalized}/${a.array.constructor.name}`;}).join('|');
   const key=material.uuid+signature,bucket=buckets.get(key)??{material,list:[]};bucket.list.push(g);buckets.set(key,bucket);root.remove(child);
  }
  for(const {material,list} of buckets.values()){
   const g=mergeGeometries(list,false);if(!g)throw Error('incompatible communal geometry');own(g);retained.add(g);
   const mesh=new T.Mesh(g,material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
  }
  complete=true;return root;
 }finally{
  for(const g of allocated)if(!complete||!retained.has(g))g.dispose();
  if(!complete){for(const m of [support,ceramic,soil,leaf,bark,seat,signal,water])m.dispose();root.removeFromParent();}
 }
}
