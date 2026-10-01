import * as T from 'three';
import {box,rod,ring} from './meshParts';
import type {Footprint} from './ShipEnvironments';

// Floor entries share the actual base fit used below. Kept inside the retained reservations.
export const safetyInterlockEntries=[
 {name:'recorder',x:-1.75,z:-1.65,terminal:[-1.75,1.42,-.94]},
 {name:'ai',x:1.98,z:-.86,terminal:[1.98,.70,-.86]},
 {name:'load',x:-3.17,z:-1.25,terminal:[-3.17,.53,-1.25]},
 {name:'return',x:3.17,z:1.25,terminal:[3.17,.53,1.25]},
] as const;
export function safetyInterlockEntryPoint(footprint:Footprint,entry:typeof safetyInterlockEntries[number]){
 const lower=entry.name==='load'||entry.name==='return';
 return new T.Vector2(footprint.x+footprint.width/2+entry.x*footprint.width*.97/(lower?7.25:4.8),footprint.y+footprint.height/2+entry.z*footprint.height*.97/(lower?3.5:4.15));
}

/** Room12 equipment only. Collision and all story behavior remain authoritative elsewhere. */
export function safetyInterlockBlockout(footprint:Footprint,index:number):T.Group{
 const root=new T.Group(),cell=new T.Group();root.add(cell);
 const palette=(name:string,color:number,metalness:number,roughness:number,emissive=0)=>{
  const m=new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:emissive?.35:0});m.name=`room12-${name}`;m.userData.actorMaterial=true;return m;
 };
 const ivory=palette('ivory',0xc9c0a3,.12,.72),copper=palette('dark-copper',0x654432,.65,.49),orange=palette('muted-orange',0x986346,.25,.7),dark=palette('socket',0x172326,.15,.85),steel=palette('housing',0x465354,.55,.64),lamp=palette('local-light',0xd2ba7e,.1,.6,0xc8a361);
 const b=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const mesh=box(cell,x,y,z,w,h,d,m,.035);mesh.name=name;return mesh;};
 const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 // Custom surfaces are room-owned. The existing world batcher releases these
 // inputs after copying them; shared meshParts geometry remains untouched.
 const owned=(name:string,geometry:T.BufferGeometry,material:T.Material,parent:T.Object3D=cell)=>{
  geometry.userData.environmentUV=true;
  const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const outline=(points:number[][])=>new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));
 const plate=(name:string,shape:T.Shape,y:number,depth:number,material:T.Material,parent:T.Object3D=cell)=>{
  const mesh=owned(name,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:24,steps:1}),material,parent);
  mesh.rotation.x=-Math.PI/2;mesh.position.y=y;return mesh;
 };
 const cylinder=(name:string,x:number,y:number,z:number,radius:number,height:number,material:T.Material,parent:T.Object3D=cell)=>{
  const mesh=owned(name,new T.CylinderGeometry(radius,radius,height,24),material,parent);mesh.position.set(x,y,z);return mesh;
 };
 const cable=(name:string,points:number[][],radius:number,material:T.Material)=>owned(name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(([x,y,z])=>v(x,y,z))),32,radius,8,false),material);
 const role=index%3;
 if(role===0){
  root.name='safety-recorder';
  b('sealed-base',0,.15,0,4.8,.3,4.15,ivory);
  plate('recorder-body',outline([[-2.18,-1.6],[-1.91,-1.88],[1.91,-1.88],[2.18,-1.6],[2.18,1.25],[1.78,1.62],[-1.78,1.62],[-2.18,1.25]]),.3,.99,ivory);
  // Reuse the sixth palette slot for a single glazed lid, not another material.
  dark.name='room12-inspection-glass';dark.color.setHex(0xc6cec8);
  dark.transparent=true;dark.opacity=.10;dark.depthWrite=false;dark.roughness=.16;dark.metalness=.1;
  b('inspection-gasket',-.2,1.305,-.05,3.72,.07,2.55,steel);
  b('inspection-window',-.2,1.35,-.05,3.35,.035,2.27,steel);
  const pane=new T.Mesh(new T.PlaneGeometry(3.58,2.55),dark);
  pane.name='sealed-inspection-pane';pane.rotation.x=-Math.PI/2;pane.position.set(-.2,1.67,-.05);
  pane.geometry.userData.environmentUV=true;cell.add(pane);
  for(const [name,x,radius] of [['left',-1.02,.54],['right',.64,.39]] as const){
   const spool=new T.Group();spool.name=`record-spool-${name}`;cell.add(spool);
   // Cutouts are holes through the flanges, not painted dots on solid drums.
   const flange=new T.Shape();flange.absarc(0,0,.67,0,Math.PI*2,false);
   for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5,hole=new T.Path();
    hole.absarc(Math.cos(angle)*.43,Math.sin(angle)*.43,.145,0,Math.PI*2,true);flange.holes.push(hole);
   }
   for(const [level,y] of [['lower',1.38],['upper',1.54]] as const){
    const disc=plate(`reel-flange-${name}-${level}`,flange,y,.035,ivory,spool);disc.position.set(x,y,-.16);
   }
   cylinder(`wound-tape-${name}`,x,1.46,-.16,radius,.12,copper,spool);
   cylinder(`reel-hub-${name}`,x,1.49,-.16,.13,.22,steel,spool);
  }
  // Pale leader face has enough top width to survive the fixed gameplay camera.
  // Its continuous U path remains seated between the packs, guides and read head.
  plate('record-tape-span',outline([[-1.53,.02],[-1.14,.70],[-.42,.88],[.08,.88],[.79,.69],[1.01,-.01],[1.13,.02],[.89,.79],[.08,1.01],[-.43,1.01],[-1.24,.80],[-1.65,.06]]),1.405,.10,ivory);
  for(const [side,x] of [['left',-1.14],['right',.79]] as const)cylinder(`tape-guide-${side}`,x,1.47,.69,.095,.19,ivory);
  b('tape-head',-.17,1.46,1.04,.51,.23,.19,steel);
  cable('recorder-drive-belt',[[-1.02,1.39,-.69],[-1.27,1.39,-1.02],[-.2,1.39,-1.11],[.88,1.39,-1.02],[.64,1.39,-.55]],.035,orange);
  cable('recorder-local-harness',[[-.17,1.39,1.09],[-.75,1.38,1.14],[-1.7,1.38,1.02],[-1.75,1.38,-.88]],.045,orange);
  b('recorder-terminal-block',-1.75,1.42,-.94,.19,.14,.34,copper);
  for(const x of [-1.98,1.59])b('window-rim',x,1.51,-.05,.2,.44,2.8,ivory);
  for(const z of [-1.38,1.28])b('window-rim',-.2,1.51,z,3.78,.44,.2,ivory);
  for(const x of [-1.98,1.59])b('lid-hinge',x,1.73,-.9,.3,.12,.4,steel);
  b('lid-seal-bridge',1.47,1.74,1.27,.27,.09,.66,orange);
  b('timestamp-sill',-.2,1.28,1.7,3.7,.24,.7,ivory);
  b('timestamp-plate',-.3,1.43,1.69,3.15,.08,.59,copper);
  const lines=['LOCAL RECORD','BEFORE AWAKENING'];
  const legendMaterial=ivory;
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;
   const context=canvas.getContext('2d');
   if(context){
    context.fillStyle='#c6b18b';context.fillRect(0,0,768,160);
    context.fillStyle='#242c2b';context.font='bold 54px monospace';context.textAlign='center';context.textBaseline='middle';
    lines.forEach((line,i)=>context.fillText(line,384,42+i*76));
    // Neutral swatch preserves the original ivory color on every non-label face.
    context.fillStyle='#ffffff';context.fillRect(0,0,16,16);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;
    legendMaterial.map=texture;legendMaterial.addEventListener('dispose',()=>texture.dispose());
   }
  }
  const legend=new T.Mesh(new T.PlaneGeometry(2.96,.52),legendMaterial);
  legend.geometry.userData.environmentUV=true;
  legend.name='timestamp-legend';legend.userData.lines=lines;legend.rotation.x=-Math.PI/2;legend.position.set(-.3,1.475,1.69);cell.add(legend);
  b('seal-strap',1.47,1.44,1.63,.15,.1,.79,orange);
  b('seal',1.47,1.52,1.88,.28,.1,.22,copper);
  const lever=rod(cell,v(1.99,1.05,.65),v(1.99,1.8,1.06),.085,.085,copper);lever.name='manual-test-lever';
  b('lever-grip',1.99,1.82,1.06,.42,.18,.23,orange);
  b('steady-local-lamp',-1.85,1.35,1.7,.2,.12,.23,lamp);
  // A deep protective perimeter leaves the sealed inspection lid untouched.
  for(const [side,x] of [['left',-2.18],['right',2.18]] as const){
   b(`recorder-impact-shoulder-${side}`,x,.86,-.28,.35,1.12,3.15,ivory);
   b('recorder-side-recess',x*1.055,.80,-.28,.045,.48,2.32,copper);
   for(const z of [-1.47,.91])b('recorder-corner-guard',x,.92,z,.39,1.02,.36,steel);
  }
  b('control-thumb-wear',1.99,1.914,1.06,.26,.006,.12,ivory);
  cell.traverse(o=>{
   if(o instanceof T.Mesh&&o.material===ivory&&o!==legend){
    // meshParts geometry is shared across rooms. Only remap owned copies.
    if(!o.geometry.userData.environmentUV){
     o.geometry=o.geometry.clone();
     // BufferGeometry.clone shares userData. Do not mark the cache entry owned.
     o.geometry.userData={...o.geometry.userData};
    }
    // Existing world batching releases owned environment-UV inputs after copying.
    o.geometry.userData.environmentUV=true;const uv=o.geometry.getAttribute('uv');
    for(let i=0;i<uv.count;i++)uv.setXY(i,8/768,1-8/160);
    uv.needsUpdate=true;
   }
  });
 }else if(role===1){
  root.name='disconnected-ai-housing';
  b('housing-base',0,.15,0,4.8,.3,4.15,steel);
  // Open service chassis. No opaque lid covers the board or cooling hardware.
  const housing=new T.Group();housing.name='ai-housing';cell.add(housing);
  housing.add(b('chassis-pan',0,.43,-.4,4.15,.26,2.85,steel));
  for(const x of [-2,2])housing.add(b('chassis-cheek',x,.98,-.4,.18,1.34,2.85,steel));
  housing.add(b('chassis-back',0,.98,-1.77,4.15,1.34,.16,steel));
  b('exposed-circuit-board',0,.84,-.43,3.64,.13,2.36,dark);
  // Leave a broad board margin between components so their silhouettes read.
  b('processor-package',-.85,1.0,-.62,1.13,.20,1.1,copper);
  const heatsink=new T.Group();heatsink.name='processor-heatsink';cell.add(heatsink);
  for(let i=0;i<7;i++)heatsink.add(b('cooling-fin',-1.33+i*.16,1.31,-.62,.065,.52,.99,ivory));
  const capacitors=new T.Group();capacitors.name='capacitor-bank';cell.add(capacitors);
  for(const x of [.65,1.25])for(const z of [-1.12,-.52]){
   cylinder('capacitor-can',x,1.15,z,.19,.49,steel,capacitors);
   cylinder('capacitor-cap',x,1.40,z,.15,.025,ivory,capacitors);
  }
  for(const x of [-1.15,-.5,.3,.95]){
   b('memory-package',x,.97,.37,.4,.15,.37,ivory);
   for(const dx of [-.25,.25])b('memory-contacts',x+dx,.925,.37,.075,.035,.31,copper);
   b('board-trace',x,.913,.05,.055,.014,.21,copper);
  }
  b('internal-connector',1.62,1.0,.38,.18,.20,.54,orange);
  cable('ai-internal-harness',[[1.62,1.05,.38],[1.73,1.13,-.1],[1.71,1.13,-1.3],[.25,1.03,-1.4]],.055,orange);
  b('board-power-terminal',.25,1.0,-1.4,.30,.19,.20,copper);
  b('socket-board',-.8,.43,1.37,2.2,.25,.96,orange);
  const receptacle=new T.Group();receptacle.name='disconnect-receptacle';cell.add(receptacle);
  for(const [name,x] of [['left',-1.36],['right',-.46]] as const){
   const socket=cylinder(`empty-socket-${name}`,x,.59,1.37,.29,.1,dark,receptacle);
   const mouth=ring(receptacle,x,.66,1.37,.29,.055,ivory);mouth.rotation.x=Math.PI/2;mouth.name=`socket-rim-${name}`;
   for(const dx of [-.1,.1])cylinder('receptacle-contact',socket.position.x+dx,.648,1.37,.035,.025,copper,receptacle);
  }
  const plug=new T.Group();plug.name='disconnected-plug';cell.add(plug);
  plug.add(b('plug-sleeve',1.25,.66,1.37,.86,.49,.68,orange));
  plug.add(b('plug-collar',.84,.66,1.37,.15,.55,.75,ivory));
  const pins=new T.Group();pins.name='exposed-plug-pins';plug.add(pins);
  for(const z of [1.19,1.37,1.55]){
   const pin=rod(pins,v(.49,.60,z),v(.80,.60,z),.045,.045,copper);pin.name='connector-pin';
  }
  cable('disconnected-lead',[[1.59,.66,1.37],[1.92,.52,1.34],[2.19,.48,.78],[2.17,.58,-.58],[1.98,.70,-.86]],.12,orange);
  b('ai-cable-gland',1.98,.70,-.86,.3,.3,.34,orange);
  // Hinged back access door, deliberately held open. Its layered underside
  // faces the player; the recorder remains the only pale, sealed assembly.
  ivory.color.setHex(0x9caa9e);
  const panel=new T.Group();panel.name='open-ai-service-panel';panel.position.set(0,1.40,-1.40);panel.rotation.x=1.20;cell.add(panel);
  const doorPart=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const p=b(name,x,y,z,w,h,d,m);panel.add(p);return p;};
  doorPart('panel-outer-shell',0,0,-.43,3.86,.18,.94,steel);
  doorPart('panel-inner-recess',0,.105,-.43,3.28,.04,.66,dark);
  for(const x of [-1.72,1.72])doorPart('panel-edge-return',x,.18,-.43,.19,.22,.89,orange);
  for(const x of [-.95,.95])doorPart('panel-stiffener',x,.16,-.43,.16,.13,.65,steel);
  for(const x of [-1.5,1.5]){
   b('panel-hinge',x,1.40,-1.40,.48,.22,.30,copper);
   const stay=rod(cell,v(x,1.02,-.75),v(x,2.16,-1.65),.065,.065,orange);stay.name='panel-stay';
  }
  for(const [side,x] of [['left',-2.12],['right',2.12]] as const){
   plate(`ai-protective-cheek-${side}`,outline([[x-.15,-1.82],[x+.15,-1.82],[x+.15,.65],[x-.15,.96]]),.30,1.28,steel);
   b('chassis-layered-rail',x,1.59,-.40,.31,.12,2.78,orange);
  }
  b('socket-recess-bed',-.80,.32,1.38,2.62,.12,1.18,dark);
  for(const z of [.85,1.91])b('socket-protective-lip',-.80,.58,z,2.65,.39,.13,steel);
  b('lead-support-front',2.12,.49,.86,.33,.24,.24,orange);
  b('lead-support-rear',2.15,.56,-.45,.33,.25,.24,orange);
  // Scuffed access lips and pull grip only, not uniform noise on the casing.
  for(const [x,z,w] of [[-1.35,1.91,.46],[-.38,1.91,.29],[-2.12,.32,.22]])b('service-edge-wear',x,.785,z,w,.025,.10,ivory);
  b('plug-pull-grip',1.25,.96,1.37,.48,.10,.43,steel);
  b('plug-grip-wear',1.25,1.019,1.37,.26,.018,.20,ivory);
 }else{
  root.name='split-contactor-battery';
  b('island-base',0,.15,0,7.25,.3,3.5,steel);
  for(const [side,x] of [['left',-2.35],['right',.72]] as const){
   b(`contactor-cradle-${side}`,x,.36,0,1.78,.12,2.38,dark);
   for(const z of [-1.05,1.05])b('contactor-protective-wall',x,.64,z,1.78,.60,.25,steel);
   for(const z of [-1.05,1.05])b('cradle-lip',x,.96,z,1.78,.08,.26,orange);
  }
  b('battery-protective-saddle',2.72,.40,0,1.51,.20,2.20,dark);
  for(const z of [-.82,.82])b('battery-impact-guard',2.72,.91,z,1.5,1.12,.18,steel);
  for(const [side,x] of [['left',-2.35],['right',.72]] as const){
   b('insulator-foot',x,.39,0,1.34,.18,1.5,ivory);
   const profile=[new T.Vector2(0,0),new T.Vector2(.35,0)];
   for(let i=0;i<4;i++){
    const y=.06+i*.15;profile.push(new T.Vector2(.32,y),new T.Vector2(.49,y+.035),new T.Vector2(.49,y+.07),new T.Vector2(.30,y+.12));
   }
   profile.push(new T.Vector2(.30,.68),new T.Vector2(0,.68));
   const post=owned(`fluted-insulator-${side}`,new T.LatheGeometry(profile,32),ivory);post.position.set(x,.44,0);
   cylinder('insulator-stud',x,1.15,0,.13,.22,steel);
  }
  // Each contact has two fingers and a recessed mouth. Nothing bridges the air gap.
  plate('contactor-left',outline([[-3.14,-.57],[-.95,-.57],[-.95,-.28],[-1.55,-.28],[-1.55,.28],[-.95,.28],[-.95,.57],[-3.14,.57]]),1.12,.22,copper);
  plate('contactor-right',outline([[-.25,-.57],[1.65,-.57],[1.65,.57],[-.25,.57],[-.25,.28],[.35,.28],[.35,-.28],[-.25,-.28]]),1.12,.22,copper);
  for(const x of [-1.03,-.17])for(const z of [-.43,.43])b('contact-wear-face',x,1.355,z,.16,.025,.28,orange);
  const battery=cylinder('local-battery',2.72,1.01,0,.59,1.42,ivory);
  for(const y of [.46,1.46]){const collar=ring(cell,battery.position.x,y,0,.61,.08,orange);collar.rotation.x=Math.PI/2;}
  cylinder('battery-lid',2.72,1.74,0,.55,.08,steel);
  b('battery-positive-terminal',2.46,1.84,0,.22,.18,.26,copper);
  b('battery-negative-terminal',2.99,1.84,0,.22,.18,.26,copper);
  b('contactor-feed-lug',1.42,1.34,0,.33,.19,.38,orange);
  b('contactor-load-lug',-2.94,1.34,0,.33,.19,.38,orange);
  b('battery-return-gland',3.17,.53,1.25,.38,.38,.36,ivory);
  b('load-output-gland',-3.17,.53,-1.25,.38,.38,.36,ivory);
  cable('battery-supply-cable',[[2.46,1.84,0],[2.18,1.61,-.70],[1.73,1.45,-.77],[1.42,1.34,0]],.12,orange);
  cable('battery-return-cable',[[2.99,1.84,0],[3.34,1.45,.48],[3.38,.85,1.01],[3.17,.53,1.25]],.11,dark);
  cable('contactor-load-cable',[[-2.94,1.34,0],[-3.30,1.04,-.45],[-3.34,.63,-.93],[-3.17,.53,-1.25]],.12,dark);
 }
 // Short enclosed risers emerge at the existing functional fittings, not dummy pads.
 for(const entry of safetyInterlockEntries.filter(e=>role===0?e.name==='recorder':role===1?e.name==='ai':e.name==='load'||e.name==='return')){
  b(`${entry.name}-service-entry`,entry.x,.01,entry.z,.18,.02,.18,steel);
  cable(`${entry.name}-service-riser`,[[entry.x,.065,entry.z],[entry.x,.32,entry.z],[...entry.terminal]],.06,orange);
 }
 // Fit actual vertex bounds for both canonical and generic test footprints.
 cell.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(cell,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 cell.scale.set(footprint.width*.97/size.x,Math.min(1,footprint.width/size.x,footprint.height/size.z),footprint.height*.97/size.z);
 cell.position.set(-center.x*cell.scale.x,-bounds.min.y*cell.scale.y,-center.z*cell.scale.z);
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);root.userData.footprint={...footprint};
 return root;
}
