import * as T from 'three';
import {SWARM_ORGAN} from '../game/world/swarmJunctionLayout';
import type {Point} from '../game/roguelike/types';

const U=32;
type XY=readonly [number,number];
/** Room16 local room visuals. Game-unit dimensions; no animation, lights or gameplay. */
export function swarmJunctionBlockout(){
 const root=new T.Group();root.name='swarm-junction-rough';
 const material=(name:string,color:number,metalness:number)=>{
  const m=new T.MeshStandardMaterial({color,metalness,roughness:.8,emissiveIntensity:0});
  m.name=`swarm-${name}`;m.userData.actorMaterial=true;return m;
 };
 const chitin=material('charcoal',0x303735,.15),rib=material('bone-grey',0xa1a599,.15),
  tendon=material('tendon',0x63504a,.05),metal=material('human-metal',0x4f646b,.6),
  dark=material('recess',0x101715,.05),mark=material('direction',0xb2ac89,.2);
 const add=(name:string,g:T.BufferGeometry,m:T.Material,solid=true)=>{
  // The production bake releases these uncached source geometries. disposeModel
  // releases the baked geometry and owned materials on room change or shutdown.
  g.userData.environmentUV=true;
  const mesh=new T.Mesh(g,m);mesh.name=name;mesh.userData.swarmSolid=solid;
  mesh.castShadow=solid;mesh.receiveShadow=true;root.add(mesh);return mesh;
 };
 const slab=(name:string,points:readonly Point[],bottom:number,height:number,m:T.Material,solid=true)=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/U,-p.y/U)));
  const g=new T.ExtrudeGeometry(shape,{depth:height/U,bevelEnabled:false,steps:1});
  g.rotateX(-Math.PI/2);g.translate(0,bottom/U,0);return add(name,g,m,solid);
 };
 const poly=(name:string,p:readonly XY[],bottom:number,height:number,m:T.Material,solid=true)=>slab(name,p.map(([x,y])=>({x,y})),bottom,height,m,solid);
 const box=(name:string,x:number,y:number,w:number,d:number,bottom:number,height:number,m:T.Material,solid=true)=>poly(name,[[x,y],[x+w,y],[x+w,y+d],[x,y+d]],bottom,height,m,solid);
 const mix=(a:XY,b:XY,t:number):XY=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 // A closed shell with a crowned, tapered back, rather than a stack of slabs.
 const crown=(name:string,a:XY,b:XY,c:XY,d:XY,height:number)=>{
  const vertices:number[]=[],indices:number[]=[];const n=12;
  for(let layer=0;layer<2;layer++)for(let j=0;j<=n;j++)for(let k=0;k<=n;k++){
   const t=j/n,s=k/n;
   // Inset bowed flanks and swept ends stay inside the supplied collision-safe
   // quad. The plan silhouette curves as well as the shell's upper surface.
   const along=.006+.88*t+.11*Math.sin(Math.PI*s);
   const across=.006+.988*s+.04*Math.sin(Math.PI*t)*(1-2*s);
   const p=mix(mix(a,c,along),mix(b,d,along),across);
   const h=layer===0?31:32+height*Math.sin(Math.PI*s)*Math.sin(Math.PI*(.12+.76*t));
   vertices.push(p[0]/U,h/U,p[1]/U);
  }
  const side=(n+1)*(n+1);
  const tri=(a:number,b:number,c:number)=>indices.push(a,b,c);
  for(let j=0;j<n;j++)for(let k=0;k<n;k++){
   const q=j*(n+1)+k,r=q+n+1;
   tri(q,r,q+1);tri(q+1,r,r+1);
   tri(q+side,q+1+side,r+side);tri(q+1+side,r+1+side,r+side);
  }
  const edge:number[]=[];
  for(let k=0;k<n;k++)edge.push(k);
  for(let j=0;j<n;j++)edge.push(j*(n+1)+n);
  for(let k=n;k>0;k--)edge.push(n*(n+1)+k);
  for(let j=n;j>0;j--)edge.push(j*(n+1));
  for(let i=0;i<edge.length;i++){const q=edge[i],r=edge[(i+1)%edge.length];tri(q,r,q+side);tri(r,r+side,q+side);}
  if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));g.setIndex(indices);g.computeVertexNormals();
  return add(name,g,chitin);
 };
 chitin.color.setHex(0x39423a);chitin.metalness=.08;chitin.roughness=.72;rib.color.setHex(0x777d6b);rib.roughness=.88;
 tendon.color.setHex(0x424b3b);metal.metalness=.72;metal.roughness=.58;
 // Retain the exact sealed shot silhouette at .95m, but bury its planar top
 // beneath charcoal shell lobes. No contrasting pink platform or striped beds.
 // A continuous rounded underbody replaces the vertical platform walls.
 // The full sealed polygon remains solid at the .95m shot plane; lower rings
 // contract toward the hub inside that reservation rather than adding tendrils
 // across circulation lanes. The .6-unit upper collar preserves exact blocking.
 const contour=SWARM_ORGAN.map(p=>new T.Vector2(p.x,p.y));
 const bedVertices:number[]=[],bedIndices:number[]=[],levels=[0,5,10,15,20,25,30.4,31];
 for(const height of levels){
  const scale=height>=30.4?1:.88+.12*Math.sin(height/30.4*Math.PI/2);
  for(const p of SWARM_ORGAN)bedVertices.push((600+(p.x-600)*scale)/U,height/U,(260+(p.y-260)*scale)/U);
 }
 const count=contour.length,area=T.ShapeUtils.area(contour);
 for(let layer=0;layer<levels.length-1;layer++)for(let i=0;i<count;i++){
  const a=layer*count+i,b=layer*count+(i+1)%count,c=a+count,d=b+count;
  bedIndices.push(...(area>0?[a,c,b,b,c,d]:[a,b,c,b,d,c]));
 }
 for(const triangle of T.ShapeUtils.triangulateShape(contour,[])){
  const [a,b,c]=triangle,pa=contour[a],pb=contour[b],pc=contour[c];
  const cross=(pb.x-pa.x)*(pc.y-pa.y)-(pb.y-pa.y)*(pc.x-pa.x);
  const down=cross>0?[a,b,c]:[a,c,b],up=[down[0],down[2],down[1]];
  bedIndices.push(...down,...up.map(i=>i+(levels.length-1)*count));
 }
 const bed=new T.BufferGeometry();bed.setAttribute('position',new T.Float32BufferAttribute(bedVertices,3));
 bed.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(bedVertices.length/3*2),2));bed.setIndex(bedIndices);bed.computeVertexNormals();add('organ-bed',bed,dark);
 const arm=(name:string,a:XY,b:XY,c:XY,d:XY,segments:readonly (readonly [number,number,number])[])=>{
  for(const [i,[start,end,height]] of segments.entries())
   crown(`${name}-plate-${i}`,mix(a,c,start),mix(b,d,start),mix(a,c,end),mix(b,d,end),height);
  // Bone is confined to the ruptured terminal, rather than repeated cross-bars.
  poly(`${name}-cut`,[a,b,mix(b,d,.03),mix(a,c,.065)],29,5,rib);
  poly(`${name}-saddle`,[mix(a,c,.09),mix(mix(a,c,.09),mix(b,d,.09),.3),mix(mix(a,c,.18),mix(b,d,.18),.3),mix(a,c,.18)],31,5,metal);
 };
 arm('root-west',[370,130],[415,115],[551,283],[575,234],[[0,.48,8],[.32,.79,11],[.65,1,12]]);
 arm('root-east',[785,115],[830,130],[627,234],[649,283],[[0,.62,11],[.43,1,8]]);
 arm('root-south',[575,370],[625,370],[575,300],[625,300],[[0,1,9]]);
 // Broad shoulder scales bridge the roots into one body, not three equal belts.
 crown('hub-west-plate-0',[516,255],[550,214],[556,282],[580,231],11);
 crown('hub-east-plate-0',[627,231],[650,214],[635,291],[684,254],9);
 crown('hub-south-plate-0',[552,282],[647,282],[575,310],[625,310],12);
 // A dished organic lip encloses an actual low, broad sensory cavity. Four
 // closed rings give an outward shell, steep inner wall and sealed underside.
 const lipVertices:number[]=[],lipIndices:number[]=[],steps=48;
 const rings:readonly (readonly [number,number,number])[]=[[49,40,31],[41,32,41],[30,23,32],[30,23,31]];
 for(const [ring,[rx,ry,h]] of rings.entries())for(let i=0;i<steps;i++){
  const a=i/steps*Math.PI*2,warp=1+.10*Math.sin(3*a+.4);
  lipVertices.push((600+rx*Math.cos(a)*warp)/U,(h+(ring===1?1.5*Math.sin(a+.6):0))/U,(260+ry*Math.sin(a)*warp)/U);
 }
 for(let r=0;r<rings.length;r++)for(let i=0;i<steps;i++){
  const a=r*steps+i,b=r*steps+(i+1)%steps,c=((r+1)%rings.length)*steps+i,d=((r+1)%rings.length)*steps+(i+1)%steps;
  lipIndices.push(a,c,b,b,c,d);
 }
 const lip=new T.BufferGeometry();lip.setAttribute('position',new T.Float32BufferAttribute(lipVertices,3));lip.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(lipVertices.length/3*2),2));lip.setIndex(lipIndices);lip.computeVertexNormals();
 add('sensory-carapace-lip',lip,chitin);
 const recess:XY[]=Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return [600+32*Math.cos(a),260+25*Math.sin(a)] as XY;});
 poly('sensory-recess',recess,31,.5,dark);
 const enamel=material('distributor-enamel',0xb9b09b,.35);
 // A recognizable torn distribution cabinet survives on the organ's east
 // shoulder: two connected walls, torn lid and connector bank, engulfed below.
 box('severed-distributor',615,229,25,42,31,11.5,enamel);
 box('distributor-front-right',611,269,29,7,31,11.5,enamel);
 poly('torn-distributor-lid',[[610,225],[604,212],[614,212],[640,231]],31,12.5,enamel);
 // Visible dark seams and connected terminal sockets distinguish the cabinet
 // from pale shell fragments. None implies an interactable reward or light.
 for(const x of [617,626,635]){
  box('distributor-terminal-socket',x,276,5,4,33,6,dark);
  box('distributor-terminal-core',x+1,279,3,2,34,3,metal);
 }
 for(const y of [238,247,256])box('distributor-vent-slot',640,y,1.5,5,34,5,dark);
 for(const x of [618,636])box('distributor-housing-fastener',x,233,2,2,42.5,1.1,metal);
 for(let i=0;i<3;i++)box('hub-split-conduit',610+i*3,235+i*9,10,3,32,3,tendon);
 // Six flush segments reproduce the layout's service paths. They do not add solids.
 const runs:readonly (readonly XY[])[]=[[[330,90],[400,135],[550,250]],[[870,90],[800,135],[650,250]],[[600,620],[600,370],[600,280]]];
 for(const [i,run] of runs.entries())for(let j=1;j<run.length;j++){
  const [a,b]=[run[j-1],run[j]],length=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=-(b[1]-a[1])/length*3,dy=(b[0]-a[0])/length*3;
  const m=poly(`flush-service-${i}-${j}`,[[a[0]+dx,a[1]+dy],[b[0]+dx,b[1]+dy],[b[0]-dx,b[1]-dy],[a[0]-dx,a[1]-dy]],.07,.04,metal,false);m.userData.swarmService=true;
 }
 // Far-wall gantry uses a rough right arrow instead of tiny text. The broken
 // end and wall-fixed supports stay within the reserved y12..32 dressing band.
 poly('directional-gantry',[[450,12],[710,12],[717,17],[708,21],[717,28],[706,32],[450,32]],51,16,metal,false);
 box('gantry-wall-support',458,12,10,12,0,51,metal,false);
 box('gantry-end-support',734,12,10,12,0,42,metal,false);
 poly('gantry-right-arrow',[[632,15],[680,15],[680,13],[701,22],[680,30],[680,27],[632,27]],67,.6,mark,false);
 poly('gantry-broken-end',[[738,12],[750,12],[750,32],[731,32],[738,27],[732,19]],42,12,metal,false);
 // Retain the generic rear bulkhead envelope, without random infestation nodules.
 for(let x=2;x<37.5;x+=4){
  const width=Math.min(3.96,37.5-x+2)*U;
  box('retained-rear-bulkhead',x*U-width/2,-.575*U,width,.35*U,0,2.65*U,metal,false);
  box('bulkhead-inset',x*U-width/2+9,-.224*U,width-18,.035*U,12,60,dark,false);
  box('retained-rear-rib',(x-.15)*U,-.24*U,.3*U,.22*U,0,2.65*U,metal,false);
 }
 return root;
}
