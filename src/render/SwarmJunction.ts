import * as T from 'three';
import {organicShell} from './organicShell';
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
 chitin.color.setHex(0x39423a);chitin.metalness=.08;chitin.roughness=.72;rib.color.setHex(0x777d6b);rib.roughness=.88;
 tendon.color.setHex(0x424b3b);metal.metalness=.72;metal.roughness=.58;
 // The silhouette and heightfield are one sealed body. Every top triangle is
 // constrained to the shared concave contour; no contracted ring crosses a bay.
 const shellHeight=(p:Point)=>{
  let distance=Infinity;
  for(let i=0;i<SWARM_ORGAN.length;i++){
   const a=SWARM_ORGAN[i],b=SWARM_ORGAN[(i+1)%SWARM_ORGAN.length],dx=b.x-a.x,dy=b.y-a.y;
   const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
   distance=Math.min(distance,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));
  }
  const cavity=Math.hypot((p.x-600)/44,(p.y-260)/34);
  const tipDistance=Math.min(...[[392,135],[799,134],[606,359]].map(([x,y])=>Math.hypot(p.x-x,p.y-y)));
  const tipRise=Math.max(0,Math.min(1,(tipDistance-17)/15));
  return 31+12*Math.tanh(distance/12)*Math.max(0,Math.min(1,(cavity-1)*2))*tipRise;
 };
 add('organ-bed',organicShell(SWARM_ORGAN,shellHeight),chitin);
 // Three small exposed terminal cuts sit inside the new curved root ends.
 poly('root-west-cut',[[383,133],[394,128],[402,136],[391,142]],31,4,rib);
 poly('root-east-cut',[[790,128],[802,128],[807,134],[795,139]],31,4,rib);
 poly('root-south-cut',[[599,354],[612,354],[612,364],[601,363]],31,4,rib);
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
 box('severed-distributor',634,222,42,32,31,11.5,enamel);
 box('distributor-front-right',634,252,42,8,31,11.5,enamel);
 poly('torn-distributor-lid',[[634,224],[634,214],[648,218],[658,213],[676,224]],31,12.5,enamel);
 // One broad dark connector panel interrupts a coherent enclosure face.
 box('distributor-front-panel',638,260,30,1,33,7,dark);
 for(const x of [640,651,662]){
  box('distributor-terminal-socket',x,260,5,4,33,6,dark);
  box('distributor-terminal-core',x+1,263,3,2,34,3,metal);
 }
 for(const y of [226,235,244])box('distributor-vent-slot',676,y,1.5,5,34,5,dark);
 for(const x of [640,670])box('distributor-housing-fastener',x,225,2,2,42.5,1.1,metal);
 for(let i=0;i<3;i++)box('hub-split-conduit',628+i*3,235+i*9,10,3,32,3,tendon);
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
