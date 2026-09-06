import * as T from 'three';
import {MAT,box,ball,rod,ring,shell,geometry} from './meshParts';

export const SHIP_ENVIRONMENTS=['cryogenics','habitation','security','cargo','communications','engineering','maintenance','infested','containment','reactor'] as const;
export type ShipEnvironment=typeof SHIP_ENVIRONMENTS[number];
const roomPairs=[['awakening-bay','passenger-vault'],['residential-gallery','communal-atrium'],['crew-checkpoint','armory'],['freight-hold','breached-loading-bay'],['relay-racks','transmission-chamber'],['diagnostic-gallery','safety-interlock-station'],['coolant-plant','service-shaft-landing'],['infested-workshop','swarm-junction'],['shielding-gate','containment-annulus'],['manual-control-chamber','overload-floor']];
/** Stable integration contract: domain keeps its own route; renderer accepts these IDs or an explicit environment. */
export function shipEnvironment(templateId:string):ShipEnvironment|undefined{return SHIP_ENVIRONMENTS[roomPairs.findIndex(pair=>pair.includes(templateId))];}
export type Footprint={x:number;y:number;width:number;height:number};
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);

/** All models are authored in a local cell, then fitted inside the authoritative collision rectangle. */
export function environmentObstacle(environment:ShipEnvironment,footprint:Footprint,index=0,templateId=''):T.Group{
 const root=new T.Group();root.name=`${environment}-obstacle-${index}`;
 const long=Math.max(footprint.width,footprint.height),short=Math.min(footprint.width,footprint.height);
 const columns=environment==='reactor'?1:Math.min(4,Math.max(1,Math.floor(short/2)));
 const rows=environment==='reactor'?1:Math.min(8,Math.max(1,Math.floor(long/2.7)));
 const count=columns*rows;
 for(let i=0;i<count;i++){
  const cell=new T.Group();cell.name=environment;root.add(cell);
  const b=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,r=.04)=>box(cell,x,y,z,w,h,d,m,r);
  const pipe=(a:T.Vector3,c:T.Vector3,r:number,m:T.Material)=>rod(cell,a,c,r,r,m);
  switch(environment){
   case 'cryogenics':{
    b(0,.14,0,1.7,.28,2.5,MAT.steel,.12);
    // Rounded pressure shell, recessed dark window, separate sleeping person and protective ribs.
    b(0,.63,0,1.62,.9,2.42,MAT.armor,.3);
    b(0,1.04,0,1.2,.17,1.97,MAT.shellDark,.24);
    ball(cell,0,1.18,-.55,.19,.12,.2,MAT.bone);
    shell(cell,0,1.17,.03,.25,.09,.8,MAT.rubber);
    for(const side of [-1,1]){
     pipe(v(side*.13,1.16,.28),v(side*.15,1.16,.76),.08,MAT.rubber);
     pipe(v(side*.3,1.16,-.19),v(side*.31,1.16,.3),.065,MAT.rubber);
     b(side*.67,1.01,0,.055,.05,1.7,MAT.cyan,.02);
    }
    b(0,1.22,.38,1.45,.11,.1,MAT.armor);
    b(0,1.12,1.02,.65,.06,.15,MAT.cyan);
    b(.57,1.13,-.91,.12,.05,.16,MAT.acid);
    break;
   }
   case 'habitation':{
    // Padded banquette with a back, armrests, paired seat cushions and a low domestic table.
    b(0,.23,-.4,1.75,.4,1.2,MAT.orange,.1);
    b(0,.95,-.89,1.76,1.05,.22,MAT.bone,.1);
    for(const x of [-.43,.43]){b(x,.57,-.36,.78,.26,.9,MAT.red,.12);b(x,.93,-.72,.75,.57,.23,MAT.orange,.1);}
    for(const x of [-.83,.83])b(x,.66,-.35,.14,.56,1.1,MAT.bone);
    b(0,.54,.64,1.36,.12,.66,MAT.bone,.12);b(0,.25,.64,.48,.5,.38,MAT.steel);
    b(-.38,.64,.64,.3,.06,.36,MAT.purple);
    rod(cell,v(.37,.61,.62),v(.37,.8,.62),.08,.07,MAT.armor);
    b(.63,.15,1.1,.48,.3,.24,MAT.orange);break;
   }
   case 'security':{
    b(0,.15,0,1.9,.3,2.5,MAT.black);
    if(templateId==='armory'){
     b(0,1,-.55,1.72,1.8,1.1,MAT.steel);
     for(const x of [-.55,0,.55]){pipe(v(x,.65,-.05),v(x,1.7,-.05),.06,MAT.black);b(x,1.05,.01,.25,.18,.15,MAT.rubber);}
     for(let x=-.77;x<.8;x+=.25)b(x,1.1,.16,.035,1.6,.035,MAT.edge,0);
    }else{
     for(const z of [-.64,.64]){const panel=b(0,.9,z,1.8,1.35,.4,MAT.steel);panel.rotation.x=z>0?-.14:.14;b(0,1.6,z,1.7,.12,.5,MAT.armor);}
    }
    for(const x of [-.7,.7]){b(x,.6,0,.2,1,2.35,MAT.edge);b(x,1.17,0,.15,.08,.65,MAT.amber);}
    break;
   }
   case 'cargo':{
    const levels= index%3===0?3:2;
    for(let level=0;level<levels;level++){
     const z=level%2?.12:0,m=level%2?MAT.orange:MAT.steel;
     b(0,.5+level*.88,z,1.8,.84,2.23,m,.045);
     for(let rib=-.92;rib<1;rib+=.3)b(0,.93+level*.88,z+rib,1.64,.055,.055,MAT.edge,0);
     for(const x of [-.84,.84])for(const dz of [-.96,.96])b(x,.5+level*.88,z+dz,.1,.88,.13,MAT.bone);
     b(0,.5+level*.88,z+1.13,.95,.045,.02,MAT.trim,0);
     for(const x of [-.34,.34])b(x,.5+level*.88,z+1.14,.04,.7,.04,MAT.edge,0);
    }break;
   }
   case 'communications':{
    b(0,.12,0,1.8,.24,2.5,MAT.steel);
    for(const z of [-.64,.64]){
     b(0,1.05,z,1.66,1.95,1.03,MAT.black);
     for(let shelf=0;shelf<5;shelf++){
      b(0,.38+shelf*.32,z+.49,1.43,.24,.1,MAT.edge);
      for(let led=0;led<3;led++)b(-.53+led*.18,.4+shelf*.32,z+.555,.07,.04,.025,led===2?MAT.cyan:MAT.acid,0);
      b(.35,.4+shelf*.32,z+.555,.37,.035,.025,MAT.black,0);
     }
     b(0,2.04,z,1.3,.06,.7,MAT.steel);
     for(const x of [-.5,.5]){const antenna=ring(cell,x,2.15,z,.18,.04,MAT.copper);antenna.rotation.y=Math.PI/2;}
    }break;
   }
   case 'engineering':{
    b(0,.46,0,1.8,.88,2.3,MAT.steel);
    for(const z of [-.66,.66]){
     const screen=b(0,1.14,z,1.55,.15,.8,MAT.black);screen.rotation.x=.32;
     const display=b(0,1.24,z-.01,1.25,.025,.55,MAT.cyan);display.rotation.x=.32;
     for(let n=0;n<4;n++)b(-.44+n*.29,1.29,z+.28,.13,.05,.1,n===0?MAT.amber:MAT.bone);
     for(let n=0;n<3;n++)b(-.31+n*.3,1.27,z-.1,.025,.025,.3,MAT.black,0);
    }
    b(-.84,.83,0,.12,1.45,2.25,MAT.trim);b(.84,.83,0,.12,1.45,2.25,MAT.trim);break;
   }
   case 'maintenance':{
    b(0,.12,0,1.9,.24,2.5,MAT.steel);
    for(const x of [-.48,.48]){
     pipe(v(x,.72,-.98),v(x,.72,.98),.3,MAT.copper);
     for(const z of [-.78,.78]){const flange=ring(cell,x,.72,z,.35,.085,MAT.edge);flange.scale.setScalar(1);}
     b(x,.29,0,.72,.35,.7,MAT.black);
    }
    pipe(v(0,.4,0),v(0,1.3,0),.29,MAT.steel);
    const wheel=ring(cell,0,1.36,0,.4,.06,MAT.red);wheel.rotation.x=Math.PI/2;
    for(const a of [0,Math.PI/2]){const spoke=b(0,1.36,0,.78,.05,.06,MAT.red);spoke.rotation.y=a;}
    break;
   }
   case 'infested':{
    b(0,.3,0,1.66,.6,2.2,MAT.steel);
    shell(cell,0,.65,0,.89,.48,2.4,MAT.flesh);
    for(let n=0;n<5;n++){
     const z=-.94+n*.46,x=Math.sin(n*2.3+index)*.35;
     shell(cell,x,.9+n%2*.3,z,.43,.65,.76,MAT.shellDark);
     ball(cell,x+.12,1.22+n%2*.3,z,.14,.16,.18,MAT.acid);
     rod(cell,v(-.79,.15,z),v(x,1.38,z-.1),.035,.14,MAT.bone);
     rod(cell,v(.79,.15,z),v(x,1.38,z-.1),.035,.12,MAT.flesh);
    }break;
   }
   case 'containment':{
    b(0,.16,0,1.9,.32,2.5,MAT.black);
    for(let n=0;n<4;n++){
     const z=-.87+n*.58,height=1.55+Math.sin(n*Math.PI/3)*.55;
     b(0,height/2,z,1.8,height,.45,MAT.armor,.08);
     b(0,height+.05,z,1.5,.1,.39,MAT.edge);
     b(0,.5,z+.24,.25,.72,.025,MAT.black);
     b(0,1.1,z+.24,.4,.12,.025,MAT.amber);
     for(const x of [-.78,.78])b(x,height/2,z,.12,height-.1,.48,MAT.steel);
    }break;
   }
   case 'reactor':{
    b(0,.14,0,1.9,.28,2.5,MAT.black);
    rod(cell,v(0,.24,0),v(0,2.32,0),.48,.65,MAT.steel);
    shell(cell,0,1.3,0,.32,.95,.75,MAT.cyan);
    for(const y of [.44,1.16,1.88,2.48]){const collar=ring(cell,0,y,0,.76,.1,y===1.16?MAT.cyan:MAT.trim);collar.rotation.x=Math.PI/2;}
    for(const x of [-.75,.75]){b(x,1.25,0,.16,2.5,.25,MAT.armor);pipe(v(x,.3,0),v(x*.56,2.6,0),.065,MAT.copper);}
    for(const z of [-1,1])b(0,.35,z,1.65,.5,.22,MAT.steel);
    break;
   }
  }
  // Fit actual vertex bounds, including bevels, rods and rotations. No new navigation obstacles.
  cell.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(cell),size=bounds.getSize(v(0,0,0)),center=bounds.getCenter(v(0,0,0));
  const cw=short/columns*.97,cd=long/rows*.97;
  cell.scale.set(cw/size.x,Math.min(environment==='reactor'?1.6:1,cw/1.5),cd/size.z);
  cell.position.set((i%columns-(columns-1)/2)*short/columns-center.x*cell.scale.x,-bounds.min.y*cell.scale.y,(Math.floor(i/columns)-(rows-1)/2)*long/rows-center.z*cell.scale.z);
 }
 if(footprint.width>footprint.height)root.rotation.y=Math.PI/2;
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);
 root.userData.footprint={...footprint};return root;
}

/** Flatten nested models for the renderer's material batching, preserving transforms. */
export function appendEnvironment(parent:T.Group,model:T.Group){
 model.updateWorldMatrix(true,true);parent.updateWorldMatrix(true,false);
 const inverseParent=parent.matrixWorld.clone().invert(),meshes:T.Mesh[]=[];model.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
 // Nonuniform fitted cells plus rotated rods create shear. TRS decomposition
 // loses it, so retain the full static matrix for vertex-accurate batching.
 for(const mesh of meshes){mesh.matrix.copy(inverseParent).multiply(mesh.matrixWorld);mesh.matrixAutoUpdate=false;parent.add(mesh);}
}

/** Flush deck inlays and outboard rear architecture never occupy a walkable tile. */
export function environmentArchitecture(parent:T.Group,env:ShipEnvironment,w:number,h:number){
 const accent=env==='habitation'?MAT.bone:env==='infested'?MAT.acid:['security','engineering','containment','maintenance'].includes(env)?MAT.amber:MAT.cyan;
 const inlay=(x:number,z:number,width:number,depth:number,mat:T.Material)=>{const m=box(parent,x,-.007,z,width,.018,depth,mat,0);m.castShadow=false;return m;};
 // Deck language stays readable even when the nearest prop is off camera.
 if(env==='cryogenics'){
  for(let x=.3;x<w-.3;x+=3)for(let z=.3;z<h-.3;z+=3){const tw=Math.min(2.94,w-.3-x),td=Math.min(2.94,h-.3-z);inlay(x+tw/2,z+td/2,tw,td,MAT.armor);}
 }else if(env==='habitation'){
  inlay(w/2,h/2,w-1,2.3,MAT.orange);inlay(w/2,h/2,2.3,h-1,MAT.orange);
  for(const side of [-1,1]){inlay(w/2,h/2+side*1.2,w-1,.045,MAT.bone);inlay(w/2+side*1.2,h/2,.045,h-1,MAT.bone);}
 }else if(env==='communications'){
  for(let lane=0;lane<4;lane++){const x=w*.3+lane*.15;inlay(x,h/2,.055,h-1,lane===0?MAT.cyan:MAT.black);inlay(w*.55,h*.3+lane*.15,w*.5,.045,MAT.edge);}
 }else if(env==='engineering'){
  for(const z of [h*.3,h*.7]){inlay(w/2,z,w-2,.09,MAT.trim);for(let x=3;x<w-2;x+=3)inlay(x,z+.3,.65,.06,MAT.bone);}
 }else if(env==='cargo'||env==='security'){
  for(const x of [w*.25,w*.75])for(const z of [h*.25,h*.75]){
   for(const side of [-1,1]){inlay(x+side*1.5,z,.065,3,MAT.trim);inlay(x,z+side*1.5,3,.065,MAT.trim);}
  }
 }else if(env==='maintenance'){
  // One upward-facing layer: dark gaps abut the bars rather than sharing
  // the old slab's top face. The cached unit plane has no hidden box faces.
  const grate=(x:number,z:number,width:number,depth:number,mat:T.Material)=>{
   const mesh=new T.Mesh(geometry('maintenance-grate-plane',()=>new T.PlaneGeometry(1,1)),mat);
   mesh.rotation.x=-Math.PI/2;mesh.scale.set(width,depth,1);mesh.position.set(x,.002,z);
   mesh.receiveShadow=true;parent.add(mesh);
  };
  for(const z of [h*.25,h*.75]){
   for(const side of [-1,1])grate(w/2,z+side*.975,w-1,.05,MAT.black);
   let left=.5;
   for(let x=1;x<w-1;x+=.28){
    const edge=x-.065/2;
    grate((left+edge)/2,z,edge-left,1.9,MAT.black);
    grate(x,z,.065,1.9,MAT.edge);left=x+.065/2;
   }
   grate((left+w-.5)/2,z,w-.5-left,1.9,MAT.black);
  }
 }else if(env==='infested'){
  for(let n=0;n<12;n++){const x=1+(w-2)*(Math.sin(n*13.7)*.5+.5),z=1+(h-2)*(Math.cos(n*5.1)*.5+.5);const stain=ball(parent,x,-.012,z,1.5,.018,.85,MAT.shellDark);stain.castShadow=false;}
 }
 for(let x=2;x<w;x+=4){
  const height=env==='cargo'?3.4:env==='containment'?3:2.65;
  box(parent,x,height/2,-.4,Math.min(3.96,w-x+2),height,.35,env==='cryogenics'?MAT.armor:env==='habitation'?MAT.bone:MAT.steel,env==='cryogenics'?.18:.04);
  box(parent,x,height/2,-.13,.3,height,.22,env==='cryogenics'?MAT.armor:MAT.edge);
  if(env==='cargo'){
   box(parent,x,3.5,-.35,3.95,.2,.5,MAT.trim);
   rod(parent,v(x-1.8,2.7,-.1),v(x+1.8,3.35,-.1),.065,.065,MAT.edge);
  }else if(env==='maintenance'){
   rod(parent,v(x-2,1.45,-.21),v(Math.min(w,x+2),1.45,-.21),.2,.2,MAT.copper);
  }else if(env==='containment'||env==='security'){
   for(const side of [-1,1]){const rib=box(parent,x+side*1.25,height/2,-.12,.25,height,.24,MAT.armor);rib.rotation.z=side*.16;}
  }
  if(env==='habitation'){
   box(parent,x,1.25,-.045,1.6,2.4,.06,MAT.orange);
   box(parent,x,1.4,-.003,1.22,1.8,.015,MAT.black,0);
   box(parent,x+.48,1.1,.01,.05,.22,.012,MAT.bone,0);
  }else if(env==='infested'){
   shell(parent,x,1.4,-.45,.7,1.3,.6,MAT.flesh);
  }else{
   box(parent,x,2.1,-.04,env==='communications'?1.8:1,.12,.06,accent);
   if(env==='engineering')box(parent,x,1.3,-.035,2,1.1,.05,MAT.black);
  }
 }
 if(env==='reactor'||env==='containment'){
  for(const radius of [.22,.33,.44]){const r=ring(parent,w/2,.005,h/2,Math.min(w,h)*radius,.018,accent);r.rotation.x=-Math.PI/2;r.scale.z=.1;r.castShadow=false;}
 }else if(env==='maintenance'){
  for(let z=1;z<h-1;z+=.35)for(const x of [1,w-1])box(parent,x,-.005,z,1.2,.018,.06,MAT.black,0);
 }else{
  for(const x of [1,w-1])for(let z=1;z<h;z+=env==='cargo'?.7:2){const stripe=box(parent,x,-.003,z,env==='cargo'?.42:.07,.02,.35,accent,0);if(env==='cargo')stripe.rotation.y=.6;stripe.castShadow=false;}
 }
}
