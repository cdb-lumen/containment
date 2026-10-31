import * as T from 'three';
import {organicShell} from './organicShell';
import {SWARM_SCUTES} from './swarmScuteContours';
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
  const cavity=Math.hypot((p.x-600)/44,(p.y-285)/34);
  // Three bent, unequal volumes continue all the way to the contour. Avoid a
  // constant-height manufactured rim and separate decorative plate inserts.
  const westT=Math.max(0,Math.min(1,(p.x-378)/190));
  const westAxis=141+westT*121+16*Math.sin(westT*Math.PI);
  const west=Math.exp(-1*((p.y-westAxis)/(19+20*westT))**2)*
   Math.exp(-1*((p.x-481)/116)**4)*(.35+.65*Math.sin(westT*Math.PI));
  const eastT=Math.max(0,Math.min(1,(815-p.x)/155));
  const eastAxis=150+eastT*117-16*Math.sin(eastT*Math.PI*1.3);
  const east=Math.exp(-1*((p.y-eastAxis)/(17+13*eastT))**2)*
   Math.exp(-1*((p.x-737)/115)**4)*(.45+.55*Math.sin(eastT*Math.PI*1.7)**2);
  const southT=Math.max(0,Math.min(1,(378-p.y)/79));
  const southAxis=610-18*Math.sin(southT*Math.PI);
  const south=Math.exp(-1*((p.x-southAxis)/(15+14*southT))**2)*Math.exp(-1*((p.y-344)/57)**4);
  const cabinet=Math.max(0,1-Math.hypot((p.x-681)/40,(p.y-241)/36));
  const tipDistance=Math.min(...[[378,141],[815,150],[610,378]].map(([x,y])=>Math.hypot(p.x-x,p.y-y)));
  const tipRelief=.25+.75*Math.min(1,tipDistance/30);
  const hub=Math.exp(-1*(((p.x-602)/88)**2+((p.y-285)/76)**2));
  const crown=Math.max(west,east,south,hub)*tipRelief;
  let edge=Infinity;
  for(let i=0;i<SWARM_ORGAN.length;i++){const a=SWARM_ORGAN[i],b=SWARM_ORGAN[(i+1)%SWARM_ORGAN.length],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));edge=Math.min(edge,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));}
  return 31+3.4*crown*Math.min(1,edge/5)*Math.max(0,Math.min(1,(cavity-1)*2))*(1-.9*cabinet);
 };
 add('organ-bed',organicShell(SWARM_ORGAN,shellHeight),tendon);
 // Broad overlapping shell volumes grow out of a low continuous tendon bed.
 // Relief preserves the cavity, exposed severed tissue and surviving cabinet.
 for(const [index,scute] of SWARM_SCUTES.entries()){
  const g=organicShell(scute.contour,p=>{
   const dx=p.x-scute.center.x,dy=p.y-scute.center.y;
   const u=(dx*Math.cos(scute.angle)+dy*Math.sin(scute.angle))/scute.length;
   const v=(-dx*Math.sin(scute.angle)+dy*Math.cos(scute.angle))/scute.width;
   const arch=Math.max(0,1-3.2*v*v)*(.45+.55*Math.sin(Math.PI*Math.max(0,Math.min(1,u+.5))));
   const cavity=Math.max(0,Math.min(1,(Math.hypot((p.x-600)/53,(p.y-285)/44)-1)*3));
   const cabinet=Math.max(0,Math.min(1,Math.max(Math.abs(p.x-682)-24,Math.abs(p.y-240)-30)/10));
   const tip=Math.max(0,Math.min(1,(Math.min(...[[378,141],[815,150],[610,378]].map(([x,y])=>Math.hypot(p.x-x,p.y-y)))-13)/28));
   return 31.05+index*.025+(3.8+9.5*arch)*Math.min(cavity,cabinet,tip);
  },U,2);
  const positions=g.getAttribute('position');for(let i=0;i<positions.count/2;i++)positions.setY(i,31/U);g.computeVertexNormals();
  add(`carapace-scute-${scute.name}`,g,chitin);
 }
 // Broad irregular exposed cross-sections with a dark retained outer sheath.
 for(const [name,points] of [
  ['west',[[358,143],[366,124],[388,121],[406,135],[408,147],[393,167],[374,163]]],
  ['east',[[789,126],[819,129],[837,148],[824,169],[803,175],[787,160]]],
  ['south',[[588,366],[606,358],[627,366],[633,381],[616,391],[599,389]]],
 ] as const){
  const contour=points.map(([x,y])=>({x,y}));
  const cx=contour.reduce((n,p)=>n+p.x,0)/contour.length,cy=contour.reduce((n,p)=>n+p.y,0)/contour.length;
  const cutShell=(outline:Point[],height:(p:Point)=>number)=>{
   const g=organicShell(outline,height),positions=g.getAttribute('position');
   // Thick section attached to the retained root, not a column down to the deck.
   for(let i=0;i<positions.count;i++)if(positions.getY(i)<1e-8)positions.setY(i,30/U);
   g.computeVertexNormals();return g;
  };
  const outward=new T.Vector2(cx-600,cy-285).normalize();
  const cutHeight=(p:Point)=>{
   const transverse=-(p.x-cx)*outward.y+(p.y-cy)*outward.x;
   const split=5*(Math.exp(-1*((transverse-10)/3)**2)+Math.exp(-1*((transverse+10)/3)**2));
   return Math.max(32,39+3*Math.tanh(((p.x-cx)*outward.x+(p.y-cy)*outward.y)/9)
    +1.2*Math.sin((p.x-cx)*.19+(p.y-cy)*.27)-split);
  };
  add(`root-${name}-sheath`,cutShell(contour,p=>35+.7*Math.sin((p.x-cx)*.2)),dark);
  // The ragged tissue reaches the front edge in several places: the retained
  // sheath is interrupted, rather than a closed border around a small cap.
  const inner=contour.map((p,i)=>{
   const exposed=p.y>=cy||i===0,scale=exposed?1:.72;
   return {x:cx+(p.x-cx)*scale,y:cy+(p.y-cy)*scale};
  });
  add(`root-${name}-tissue`,cutShell(inner,()=>34.4),tendon);
  add(`root-${name}-cut`,cutShell(inner,cutHeight),rib);
 }
 // A dished organic lip encloses an actual low, broad sensory cavity. Four
 // closed rings give an outward shell, steep inner wall and sealed underside.
 const lipVertices:number[]=[],lipIndices:number[]=[],steps=48;
 const rings:readonly (readonly [number,number,number])[]=[[49,40,31],[41,32,41],[30,23,32],[30,23,31]];
 for(const [ring,[rx,ry,h]] of rings.entries())for(let i=0;i<steps;i++){
  const a=i/steps*Math.PI*2,warp=1+.10*Math.sin(3*a+.4);
  lipVertices.push((600+rx*Math.cos(a)*warp)/U,(h+(ring===1?1.5*Math.sin(a+.6):0))/U,(285+ry*Math.sin(a)*warp)/U);
 }
 for(let r=0;r<rings.length;r++)for(let i=0;i<steps;i++){
  const a=r*steps+i,b=r*steps+(i+1)%steps,c=((r+1)%rings.length)*steps+i,d=((r+1)%rings.length)*steps+(i+1)%steps;
  lipIndices.push(a,c,b,b,c,d);
 }
 const lip=new T.BufferGeometry();lip.setAttribute('position',new T.Float32BufferAttribute(lipVertices,3));lip.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(lipVertices.length/3*2),2));lip.setIndex(lipIndices);lip.computeVertexNormals();
 add('sensory-carapace-lip',lip,chitin);
 const recess:XY[]=Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return [600+32*Math.cos(a),285+25*Math.sin(a)] as XY;});
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
 box('distributor-roof-service-panel',640,228,29,20,42.5,.4,dark);
 for(const x of [643,653,663])box('distributor-roof-bus',x,231,3,13,42.9,1.2,metal);
 for(const x of [640,670])box('distributor-housing-fastener',x,225,2,2,42.5,1.1,metal);
 const engulf=[[654,218],[667,219],[680,228],[676,245],[665,245],[660,237],[643,231],[641,225]].map(([x,y])=>({x,y}));
 add('distributor-engulfing-fold',organicShell(engulf,p=>42+2.4*Math.exp(-1*(((p.y-233)/12)**2))),tendon);
 for(let i=0;i<3;i++)box('hub-split-conduit',628+i*3,235+i*9,10,3,32,3,tendon);
 // Deliberate cabinet relocation leaves its hardware east of the larger cavity.
 for(const child of root.children)if(child instanceof T.Mesh&&(child.name==='severed-distributor'||child.name==='torn-distributor-lid'||child.name.startsWith('distributor-')||child.name==='hub-split-conduit'))child.geometry.translate(26/U,0,0);
 // A connected side-to-roof tongue consumes the cabinet's left corner while
 // preserving the three front ports, torn lid and roof-service witness.
 const sideWrap=[[648,246],[656,232],[662,228],[666,241],[670,252],[664,260],[657,260]].map(([x,y])=>({x,y}));
 const wrap=organicShell(sideWrap,p=>34+10.4*Math.max(0,Math.min(1,(p.x-653)/13)));
 const wrapPositions=wrap.getAttribute('position');for(let i=0;i<wrapPositions.count/2;i++)wrapPositions.setY(i,31/U);wrap.computeVertexNormals();
 add('consuming-distributor-side-wrap',wrap,tendon);
 // Six flush segments reproduce the layout's service paths. They do not add solids.
 const runs:readonly (readonly XY[])[]=[[[330,90],[378,141],[550,275]],[[870,90],[815,150],[676,250]],[[600,620],[610,378],[600,305]]];
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
