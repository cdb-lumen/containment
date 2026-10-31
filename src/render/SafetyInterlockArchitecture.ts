import * as T from 'three';
import {box,rod} from './meshParts';
import {safetyInterlockEntries,safetyInterlockEntryPoint} from './SafetyInterlockBlockout';

/** Room12 only: flush deck finish and outboard insulation, never new collision. */
export function safetyInterlockArchitecture(parent:T.Group,w:number,h:number){
 const shell=new T.Group();shell.name='room12-insulated-shell';parent.add(shell);
 const material=(name:string,color:number,metalness:number,roughness:number)=>{
  const m=new T.MeshStandardMaterial({color,metalness,roughness});m.name=`room12-shell-${name}`;m.userData.actorMaterial=true;return m;
 };
 const ceramic=material('ceramic',0xaaa48e,.08,.86),metal=material('steel',0x354246,.55,.72),copper=material('copper',0x624633,.65,.55),orange=material('worn-safety',0x946044,.15,.9),dark=material('recess',0x172123,.1,.95);
 const b=(name:string,x:number,y:number,z:number,width:number,height:number,depth:number,m:T.Material)=>{const mesh=box(shell,x,y,z,width,height,depth,m,.025);mesh.name=name;return mesh;};
 // Large insulated rear panels, with a continuous grounded sill. All raised
 // geometry stays outside z=0 so the canonical north bypass stays untouched.
 b('rear-sill',w/2,.16,-.4,w,.32,.65,metal);
 for(let x=2;x<w;x+=4){
  const width=Math.min(3.84,w-x+1.9);
  b('ceramic-wall-panel',x,1.48,-.48,width,2.55,.36,ceramic);
  b('recessed-service-band',x,1.2,-.265,width-.22,.57,.055,dark);
  b('panel-foot',x,.42,-.19,width-.3,.12,.22,metal);
  for(const dx of [-width/2+.16,width/2-.16])b('panel-clamp',x+dx,1.5,-.2,.14,2.2,.12,metal);
 }
 // Two independently terminated runs. No cosmetic wire reconnects the recorder
 // and AI equipment across the center break.
 for(const [a,z] of [[.6,w*.43],[w*.57,w-.6]]){
  rod(shell,new T.Vector3(a,2.45,-.16),new T.Vector3(z,2.45,-.16),.075,.075,copper);
  for(const x of [a,z])b('ceramic-termination',x,2.45,-.17,.22,.34,.28,ceramic);
 }
 b('room12-isolation-break',w/2,1.2,-.225,1.8,.57,.035,orange);
 // Narrow flush service channels stay at the perimeter; the main deck remains
 // quiet and open rather than acquiring detached equipment pads or boxes.
 const deck=new T.Group();deck.name='room12-service-deck';shell.add(deck);
 // Slot faces sit above the channel, never coplanar with its top face.
 const inlay=(name:string,x:number,z:number,width:number,depth:number,m:T.Material)=>{const slot=name==='channel-slot';const mesh=box(deck,x,slot?.018:.006,z,width,slot?.004:.012,depth,m,0);mesh.name=name;mesh.castShadow=false;};
 for(const z of [1.75,h-1.75]){
  inlay('service-channel',w/2,z,w-2,.52,metal);
  for(let x=1.2;x<w-1;x+=.42)inlay('channel-slot',x,z,.065,.36,dark);
 }
 // Fitted base entries, not reservation centers. Three independent service runs:
 // load jaw to recorder, battery return to the south deck, rear feed to the
 // AI's loose plug. Nothing joins the AI receptacle or crosses the jaw break.
 const footprints=[[330,210,160,140],[700,210,160,140],[480,580,240,120]].map(([x,z,width,depth])=>({x:x*w/1200,y:z*h/880,width:width*w/1200,height:depth*h/880}));
 const [recorder,ai,load,ret]=safetyInterlockEntries.map((e,i)=>safetyInterlockEntryPoint(footprints[i<2?i:2],e));
 const route=(name:string,points:T.Vector2[])=>{
  const group=new T.Group();group.name=`service-route-${name}`;deck.add(group);
  const piece=(name:string,x:number,y:number,z:number,width:number,height:number,depth:number,m:T.Material)=>{
   const mesh=box(group,x,y,z,width,height,depth,m,0);mesh.name=name;mesh.castShadow=false;
  };
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],alongX=Math.abs(b.x-a.x)>1e-6;
   const length=alongX?Math.abs(b.x-a.x):Math.abs(b.y-a.y),x=(a.x+b.x)/2,z=(a.y+b.y)/2;
   // A dark bed and raised side lips form a shallow physical trough. The
   // conductor sits above its bed, below the lips, never above the deck limit.
   piece('trough-bed',x,.004,z,alongX?length:.34,.008,alongX?.34:length,dark);
   for(const side of [-1,1])piece('trough-lip',x+(alongX?0:side*.15),.016,z+(alongX?side*.15:0),alongX?length:.04,.012,alongX?.04:length,metal);
   piece('inset-conductor',x,.014,z,alongX?length:.10,.009,alongX?.10:length,orange);
  }
 };
 route('recorder-load',[load,new T.Vector2(recorder.x,load.y),recorder]);
 route('ai-rear',[new T.Vector2(ai.x,0),ai]);
 route('battery-return',[ret,new T.Vector2(ret.x,h-1.75)]);
 // Rear feed rises only outboard of the traversable deck and meets its band.
 b('rear-feed-riser-case',ai.x,.60,-.0801,.34,1.20,.16,metal);
 b('rear-feed-riser-conductor',ai.x,.60,-.0121,.10,1.20,.024,orange);
 b('rear-feed-termination',ai.x,1.20,-.1401,.44,.26,.28,ceramic);
 // Short worn approach stripes belong to existing equipment, not new zones.
 for(const [x,z,width] of [[w*410/1200,h*380/880,4.5],[w*780/1200,h*380/880,4.5],[w*.5,h*735/880,6.8]]){
  for(const side of [-1,1])inlay('equipment-approach-mark',x+side*width*.36,z,width*.24,.075,orange);
 }
}
