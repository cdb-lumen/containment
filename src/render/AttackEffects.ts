import * as T from 'three';
import type {WeaponId} from '../game/combat/types';
import type {Bullet,GameEffect} from '../DepthGame';
import {WEAPON_APPEARANCE} from './weapons';
import {electricArc} from './electricArc';
const UP=new T.Vector3(0,1,0),WHITE=new T.Color(0xffffff);
type Particle={p:T.Vector3;v:T.Vector3;color:T.Color;age:number;life:number;size:number;stretch:number;spin:number;rotation:number;gravity:number;ground:boolean};
type Pulse={p:T.Vector3;color:T.Color;age:number;life:number;radius:number;angle:number;slash:boolean;stable:boolean};
export const EFFECT_LIMITS={glow:360,smoke:80,debris:80,pulses:24,decals:64,beams:320,fire:16} as const;
const vertex=`attribute float effectFrame; varying float vFrame;attribute float effectAlpha;varying vec2 vUv;varying vec3 vColor;varying float vAlpha;
void main(){vFrame=effectFrame;vUv=uv;vColor=instanceColor;vAlpha=effectAlpha;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`;
const fragment=`uniform sampler2D map;uniform float inset;uniform float grid;uniform float textured;varying float vFrame;uniform float style;varying vec2 vUv;varying vec3 vColor;varying float vAlpha;
void main(){vec2 p=vUv*2.0-1.0;float d=length(p);float alpha=vAlpha;vec3 color=vColor;
if(style<0.5){alpha*=pow(max(0.0,1.0-d),1.8);color*=1.0+2.0*pow(max(0.0,1.0-d),5.0);}
else if(style<1.5){float n=.86+.09*sin(p.x*13.0+p.y*7.0)+.05*sin(p.y*19.0-p.x*4.0);alpha*=(1.0-smoothstep(.15,1.0,d/n))*.48;}
if(textured>.5){float frame=floor(vFrame);vec2 cell=vec2(mod(frame,grid),grid-1.0-floor(frame/grid));vec4 tex=texture2D(map,(cell+clamp(vUv,inset,1.0-inset))/grid);alpha=vAlpha*tex.a*(style>2.5?.9*smoothstep(.0,.12,vUv.y):.42);color=style>2.5?tex.rgb:vColor*(.6+tex.r*.8);}
if(alpha<.003)discard;gl_FragColor=vec4(color,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
function pool(scene:T.Scene,geometry:T.BufferGeometry,count:number,style:number,additive=false,texture?:T.Texture,grid=1){
 geometry.setAttribute('effectFrame',new T.InstancedBufferAttribute(new Float32Array(count),1));
 const alpha=new T.InstancedBufferAttribute(new Float32Array(count),1);alpha.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectAlpha',alpha);
 const material=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{style:{value:style},map:{value:texture??null},grid:{value:grid},inset:{value:grid===5?.5/256:.5/128},textured:{value:texture?1:0}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:additive?T.AdditiveBlending:T.NormalBlending});
 const mesh=new T.InstancedMesh(geometry,material,count);mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.setColorAt(0,WHITE);mesh.frustumCulled=false;scene.add(mesh);return mesh;
}
/** Bounded GPU instance pools: no lights or draw call per pellet / particle. */
export class AttackEffects {
 private fire:Particle[]=[];private fireMesh:T.InstancedMesh;private textures:T.Texture[]=[];
 private arcs:{start:T.Vector3;end:T.Vector3;age:number;seed:number}[]=[];
 private glow:Particle[]=[];private smoke:Particle[]=[];private debris:Particle[]=[];private decals:Particle[]=[];private pulses:Pulse[]=[];
 private glowMesh:T.InstancedMesh;private smokeMesh:T.InstancedMesh;private debrisMesh:T.InstancedMesh;private decalMesh:T.InstancedMesh;private pulseMesh:T.InstancedMesh;private slashMesh:T.InstancedMesh;private beamMesh:T.InstancedMesh;
 private dummy=new T.Object3D();private forward=new T.Vector3();private previous=new WeakMap<Bullet,T.Vector3>();private trailClock=0;private boonBursts=0;private arcBursts=0;
 constructor(scene:T.Scene,loader:T.TextureLoader|undefined=typeof document==='undefined'?undefined:new T.TextureLoader()){
  const texture=(name:string,srgb=false)=>{const t=loader?.load(`${import.meta.env.BASE_URL}assets/vfx/${name}.png`)??new T.Texture();t.minFilter=t.magFilter=T.LinearFilter;t.generateMipmaps=false;t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;this.textures.push(t);return t;};
  this.fireMesh=pool(scene,new T.PlaneGeometry(1,1),EFFECT_LIMITS.fire,3,false,texture('Explosion01',true),5);this.fireMesh.name='explosion-fire';
  this.glowMesh=pool(scene,new T.PlaneGeometry(1,1),EFFECT_LIMITS.glow,0,true);
  this.smokeMesh=pool(scene,new T.PlaneGeometry(1,1),EFFECT_LIMITS.smoke,1,false,texture('WispySmoke02'),8);
  this.debrisMesh=pool(scene,new T.BoxGeometry(1,1,1),EFFECT_LIMITS.debris,2);
  this.decalMesh=pool(scene,new T.PlaneGeometry(1,1),EFFECT_LIMITS.decals,1);
  this.pulseMesh=pool(scene,new T.RingGeometry(.955,1,48),EFFECT_LIMITS.pulses,2,true);
  this.slashMesh=pool(scene,new T.RingGeometry(.72,1,16,1,-.65,1.3),EFFECT_LIMITS.pulses,2,true);
  this.beamMesh=pool(scene,new T.CylinderGeometry(1,1,1,5),EFFECT_LIMITS.beams,2,true);
  // Keep the existing pool order stable for renderer diagnostics.
  scene.remove(this.fireMesh);scene.add(this.fireMesh);
 }
 private particle(list:Particle[],limit:number,p:T.Vector3,color:number,size:number,life:number,v=new T.Vector3(),gravity=0,stretch=1){
  if(list.length>=limit)list.shift();list.push({p:p.clone(),v,color:new T.Color(color),age:0,life,size,stretch,spin:(Math.random()-.5)*(list===this.smoke?.9:12),rotation:Math.random()*6.28,gravity,ground:false});
 }
 private pulse(p:T.Vector3,color:number,radius:number,life:number,angle=0,slash=false,stable=false){if(this.pulses.length>=EFFECT_LIMITS.pulses)this.pulses.shift();this.pulses.push({p:p.clone(),color:new T.Color(color),radius,life,age:0,angle,slash,stable});}
 shot(p:T.Vector3,angle:number,id:WeaponId){
  const cfg=WEAPON_APPEARANCE[id],forward=new T.Vector3(Math.cos(angle),0,Math.sin(angle)),right=new T.Vector3(-forward.z,0,forward.x);
  const count=id==='shotgun'?6:id==='plasma'?4:id==='rocket'?7:3;
  // A hot core and directional lobes extend from the actual barrel socket.
  for(let i=0;i<count;i++){
   const spread=(i-count/2)*.07,pos=p.clone().addScaledVector(forward,.05+i*.085).addScaledVector(right,spread);
   this.particle(this.glow,EFFECT_LIMITS.glow,pos,cfg.color,id==='shotgun'?.46:.28,.045+i*.008,forward.clone().multiplyScalar(1.6));
  }
  this.particle(this.glow,EFFECT_LIMITS.glow,p,0xfff4df,.2,.045);
  for(let i=0;i<(id==='shotgun'?8:3);i++){
   const v=forward.clone().multiplyScalar(2+Math.random()*5).addScaledVector(right,(Math.random()-.5)*2);v.y=Math.random()*1.4;
   this.particle(this.glow,EFFECT_LIMITS.glow,p,cfg.color,.075,.14+Math.random()*.14,v,2);
  }
  if(id==='plasma')this.pulse(p,cfg.color,.4,.18,angle);
  else{
   this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x82938d,.40,.55,forward.clone().multiplyScalar(.45).add(new T.Vector3(0,.45,0)));
   if(id!=='rocket'){
    const casing=p.clone().addScaledVector(forward,-.65),v=right.multiplyScalar(1.6+Math.random());v.y=1.7;
    this.particle(this.debris,EFFECT_LIMITS.debris,casing,id==='shotgun'?0x994b31:0xc69a51,id==='shotgun'?.065:.038,5,v,9.8,2.5);
   }
  }
 }
 event(e:GameEffect){
  const p=new T.Vector3(e.x/32,(e.type==='explosion'||e.radius!==undefined)? .10:.8,e.y/32);
  const angle=e.angle??0,forward=new T.Vector3(Math.cos(angle),0,Math.sin(angle));
  if(e.type==='enemy-warning'){
   p.y=.035;const life=(e.durationMs??650)/1000;
   this.pulse(p,0xe9a564,(e.radius??38)/32,life);
   if(e.targetX!==undefined&&e.targetY!==undefined){const target=new T.Vector3(e.targetX/32,.04,e.targetY/32);this.pulse(target,0xe9a564,.8,life);const direction=target.clone().sub(p);for(let i=0;i<12;i++)this.particle(this.glow,EFFECT_LIMITS.glow,p.clone().addScaledVector(direction,i/12),0xd98d54,.07,life);}
   return;
  }
  if(e.type==='boon'){
   if(this.boonBursts++>=8)return;
   const colors={frost:0x8cdeed,arc:0xb3bbff,burn:0xf89847,impact:0xf5dab0,leech:0xbb7385,shield:0x86c9ce,overload:0xf4b96b,poison:0x5dd8b6,charge:0xd6b9f3,blast:0xffba71,shatter:0xa3eaf3,field:0x75bdcf},color=colors[e.boon??'impact'];
   if(e.targetX!==undefined&&e.targetY!==undefined){
    if(this.arcBursts++>=2)return;const end=new T.Vector3(e.targetX/32,.8,e.targetY/32);
    if(this.arcs.length>=6)this.arcs.shift();this.arcs.push({start:p.clone(),end,age:0,seed:Math.floor(Math.random()*65536)});
    this.particle(this.glow,EFFECT_LIMITS.glow,end,0xddeaff,.48,.10);
    for(let i=0;i<9;i++){const a=i*2.399;this.particle(this.glow,EFFECT_LIMITS.glow,end,i%2?0x8d9bff:0xcbefff,.065,.18+Math.random()*.16,new T.Vector3(Math.cos(a)*2,.4+Math.random()*2,Math.sin(a)*2),4);}
    return;
   }
   if(e.boon==='field'){this.pulse(new T.Vector3(p.x,.025,p.z),color,(e.radius??75)/32,(e.durationMs??2000)/1000,0,false,true);return;}
   if(e.boon==='charge'){this.particle(this.glow,EFFECT_LIMITS.glow,p,color,.25,(e.durationMs??450)/1000);return;}
   if(e.boon==='shatter'){
    for(let i=0;i<18;i++){const a=i*2.399;this.particle(this.debris,EFFECT_LIMITS.debris,p,i%3?0x64b7d5:0xb9efff,.10+Math.random()*.08,.65+Math.random()*.3,new T.Vector3(Math.cos(a)*(2+Math.random()*3),1+Math.random()*3,Math.sin(a)*(2+Math.random()*3)),8,2.7);}
    this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x91c4d5,.7,.35,new T.Vector3(0,.25,0));return;
   }
   if(e.boon==='blast'||e.boon==='overload'){this.event({type:'explosion',x:e.x,y:e.y,radius:e.radius??48});return;}
   const frost=e.boon==='frost',shield=e.boon==='shield'||e.boon==='leech';
   this.pulse(new T.Vector3(p.x,.05,p.z),color,e.radius?e.radius/32:frost?1.3:shield?.65:.8,frost?.45:.3);
   for(let i=0;i<(frost?7:5);i++){const a=i*6.28/7,v=new T.Vector3(Math.cos(a)*.8,shield?1.4:.5,Math.sin(a)*.8);this.particle(this.glow,EFFECT_LIMITS.glow,p,color,frost?.12:.10,.35,v,0);}
   return;
  }
  if(e.type==='enemy-attack'){
   if(e.id===-1)return;
   if(e.family==='spitter'){
    p.y=.8;for(let i=0;i<7;i++)this.particle(this.glow,EFFECT_LIMITS.glow,p,0x9bd25e,.1,.3,forward.clone().multiplyScalar(1+Math.random()*2).add(new T.Vector3(0,Math.random(),0)),2);
   }else{p.y=.38;this.pulse(p,0xc8c6a3,1.1,.16,angle,true);}return;
  }
  if(e.type==='pickup'){this.particle(this.glow,EFFECT_LIMITS.glow,p,0x87f3d1,.45,.22,new T.Vector3(0,1,0));return;}
  if(e.type==='hurt'||e.type==='shot'||e.type==='sync-corpse')return;
  const explosion=e.type==='explosion',acid=e.type==='acid',death=e.type==='corpse';
  const impactColor=acid||death?0x9ebc5e:e.weapon==='plasma'?0x69ddff:0xffc68b;
  if(explosion||(acid&&e.radius)){
   const r=(e.radius??100)/32,color=acid?0x8dd45a:0xffb64e;
   this.pulse(p,color,r,.24);this.particle(this.glow,EFFECT_LIMITS.glow,p,acid?color:0xffedbc,r*.65,.065);
   if(!acid){const center=p.clone(),size=Math.min(5,r*1.5);center.y=size*.38;this.particle(this.fire,EFFECT_LIMITS.fire,center,0xffffff,size,.62,new T.Vector3(0,.65,0));this.fire[this.fire.length-1].spin=0;this.fire[this.fire.length-1].rotation=0;
    for(let i=0;i<9;i++){const a=i*2.399,s=1.5+Math.random()*r;this.particle(this.debris,EFFECT_LIMITS.debris,p,i%2?0x746c59:0x343a38,.055+Math.random()*.07,3.5,new T.Vector3(Math.cos(a)*s,2+Math.random()*3,Math.sin(a)*s),9.8,1.8);}}
   for(let i=0;i<16;i++){const a=Math.random()*6.28,s=1+Math.random()*r*2,v=new T.Vector3(Math.cos(a)*s,Math.random()*4+.5,Math.sin(a)*s);this.particle(this.glow,EFFECT_LIMITS.glow,p,color,.10+Math.random()*.08,.25+Math.random()*.4,v,6);}
   for(let i=0;i<5;i++)this.particle(this.smoke,EFFECT_LIMITS.smoke,p,acid?0x758b50:0x58625e,.65+Math.random()*.5,.85+Math.random()*.4,new T.Vector3((Math.random()-.5)*r,1+Math.random(),(Math.random()-.5)*r));
   this.particle(this.decals,EFFECT_LIMITS.decals,new T.Vector3(p.x,.008,p.z),acid?0x283f20:0x111719,r*1.4,14);
  }else{
   if(!acid&&!death)for(let i=0;i<3;i++){const a=angle+Math.PI+(Math.random()-.5)*1.1,s=1+Math.random()*2;this.particle(this.debris,EFFECT_LIMITS.debris,p,0x898477,.045,3.5,new T.Vector3(Math.cos(a)*s,1+Math.random()*1.5,Math.sin(a)*s),9.8,1.8);}
   for(let i=0;i<(death?16:acid?7:9);i++){
    const a=acid||death?Math.random()*6.28:angle+Math.PI+(Math.random()-.5)*1.3,s=.8+Math.random()*3,v=new T.Vector3(Math.cos(a)*s,Math.random()*2.8,Math.sin(a)*s).addScaledVector(forward,acid?1.5:-1.5);
    this.particle(this.glow,EFFECT_LIMITS.glow,p,impactColor,acid?.095:.065,.15+Math.random()*.24,v,7);
   }
   this.particle(this.glow,EFFECT_LIMITS.glow,p,impactColor,acid?.3:.4,.075);
   if(!acid&&!death)this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x8b9185,.35,.45,new T.Vector3(0,.3,0));
   if(acid||death){
    this.particle(this.decals,EFFECT_LIMITS.decals,new T.Vector3(p.x,.009,p.z),0x263524,death?1.25:.5,16);
    for(let i=0;i<(death?7:2);i++)this.particle(this.debris,EFFECT_LIMITS.debris,p,i%2?0x4c5541:0x9a9872,.075+Math.random()*.08,6,new T.Vector3((Math.random()-.5)*3,1+Math.random()*3,(Math.random()-.5)*3),9.8,1.7);
   }
  }
 }
 private drawParticles(list:Particle[],mesh:T.InstancedMesh,dt:number,camera:T.Camera,mode:'glow'|'smoke'|'debris'|'decal'|'fire'){
  const alpha=mesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute;let index=0;
  for(const s of list){
   s.age+=dt;if(s.age>=s.life)continue;const t=s.age/s.life;
   if(!s.ground){s.v.y-=s.gravity*dt;s.p.addScaledVector(s.v,dt);s.rotation+=s.spin*dt;if(mode==='debris'&&s.p.y<.035){s.p.y=.035;s.v.y=Math.abs(s.v.y)*.23;s.v.x*=.65;s.v.z*=.65;s.spin*=.55;if(s.v.y<.35&&Math.hypot(s.v.x,s.v.z)<.3){s.ground=true;s.v.set(0,0,0);s.spin=0;}}}
   this.dummy.position.copy(s.p);this.dummy.quaternion.copy(camera.quaternion);
   if(mode==='decal')this.dummy.rotation.set(-Math.PI/2,0,s.rotation);
   else if(mode==='debris')this.dummy.rotation.set(s.rotation,s.rotation*.7,s.rotation*.4);
   else this.dummy.rotateZ(s.rotation);
   const size=s.size*(mode==='smoke'?1+t*2.5:mode==='glow'?1-t*.4:mode==='fire'?1+t*.25:1);
   (mesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute).setX(index,Math.min(mode==='fire'?24:63,Math.floor(t*(mode==='fire'?25:64))));
   this.dummy.scale.set(size,mode==='debris'?size*.5:size,size*s.stretch);this.dummy.updateMatrix();mesh.setMatrixAt(index,this.dummy.matrix);mesh.setColorAt(index,s.color);alpha.setX(index,mode==='decal'?.75*(1-t*t):mode==='debris'?Math.min(1,(1-t)*4):mode==='fire'?Math.min(1,(1-t)*4):(1-t)*(mode==='smoke'?Math.min(1,t*10):1));index++;
  }
  for(let i=list.length-1;i>=0;i--)if(list[i].age>=list[i].life)list.splice(i,1);
  this.finish(mesh,index);
 }
 private finish(mesh:T.InstancedMesh,count:number){mesh.count=count;(mesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute).needsUpdate=true;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;(mesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute).needsUpdate=true;}
 update(dt:number,camera:T.Camera,bullets:readonly Bullet[]){
  if(dt<=0)return;
  this.boonBursts=this.arcBursts=0;this.trailClock+=dt;const trail=this.trailClock>.04;if(trail)this.trailClock=0;
  let beam=0;const alpha=this.beamMesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute;
  for(const b of bullets){
   if(b.kind==='player'&&(2-b.life)*b.request.speed<(b.visualMuzzle?.distance??0))continue;
   const id=b.request.weaponId,grenade=b.kind==='grenade',hazard=b.kind==='hazard';
   const p=new T.Vector3(b.x/32,grenade?1+Math.sin((1-b.life/1.1)*Math.PI)*1.4:b.visualMuzzle?.y??.99,b.y/32);
   const old=this.previous.get(b)??(b.visualMuzzle?new T.Vector3(b.visualMuzzle.x,b.visualMuzzle.y,b.visualMuzzle.z):p.clone().addScaledVector(new T.Vector3(Math.cos(b.request.angle),0,Math.sin(b.request.angle)),-b.request.speed/32*dt));
   if(!grenade&&beam<EFFECT_LIMITS.beams){
    this.forward.copy(p).sub(old);const distance=this.forward.length();
    if(distance>.002){this.dummy.position.copy(p).add(old).multiplyScalar(.5);this.dummy.quaternion.setFromUnitVectors(UP,this.forward.normalize());this.dummy.scale.set(hazard?.04:id==='plasma'?.035:.012,distance,hazard?.04:id==='plasma'?.035:.012);this.dummy.updateMatrix();this.beamMesh.setMatrixAt(beam,this.dummy.matrix);this.beamMesh.setColorAt(beam,new T.Color(hazard?0xb2d968:WEAPON_APPEARANCE[id].color));alpha.setX(beam,.85);beam++;}
   }
   this.previous.set(b,p);
   if(trail&&(id==='plasma'||id==='rocket'||hazard)&&!grenade){
    this.particle(this.glow,EFFECT_LIMITS.glow,p,hazard?0x9cdb66:WEAPON_APPEARANCE[id].color,hazard?.2:id==='rocket'?.22:.19,.16);
    if(id==='rocket')this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x77817d,.25,.6,new T.Vector3(0,.2,0));
   }
  }
  // Reuse the bounded beam pool: broad violet corona plus thin blue-white core.
  for(const arc of this.arcs){
   arc.age+=dt;if(arc.age>=.26)continue;
   const strike=Math.floor(arc.age/.045),fade=Math.pow(1-arc.age/.26,.6)*(strike%2?.65:1);
   for(const segment of electricArc(arc.start,arc.end,arc.seed+strike))for(let layer=0;layer<2;layer++){
    if(beam>=EFFECT_LIMITS.beams)break;
    this.forward.copy(segment.end).sub(segment.start);const length=this.forward.length();
    this.dummy.position.copy(segment.start).add(segment.end).multiplyScalar(.5);this.dummy.quaternion.setFromUnitVectors(UP,this.forward.normalize());
    const width=(layer?.012:.045)*(segment.branch?.55:1);
    this.dummy.scale.set(width,length,width);this.dummy.updateMatrix();this.beamMesh.setMatrixAt(beam,this.dummy.matrix);
    this.beamMesh.setColorAt(beam,new T.Color(layer?0xc4eaff:0x666dff));alpha.setX(beam++,fade*(layer?.95:.22));
   }
  }
  this.arcs=this.arcs.filter(a=>a.age<.26);
  // Short velocity-aligned spark streaks share the existing bounded beam draw.
  for(const spark of this.glow){
   if(beam>=EFFECT_LIMITS.beams)break;
   const speed=spark.v.length();if(speed<2||spark.age+dt>=spark.life)continue;
   const length=Math.min(.28,speed*.035);
   this.forward.copy(spark.v).normalize();this.dummy.position.copy(spark.p).addScaledVector(this.forward,-length*.5);
   this.dummy.quaternion.setFromUnitVectors(UP,this.forward);this.dummy.scale.set(.009,length,.009);this.dummy.updateMatrix();
   this.beamMesh.setMatrixAt(beam,this.dummy.matrix);this.beamMesh.setColorAt(beam,spark.color);alpha.setX(beam++,(1-spark.age/spark.life)*.55);
  }
  this.finish(this.beamMesh,beam);
  this.drawParticles(this.fire,this.fireMesh,dt,camera,'fire');
  this.drawParticles(this.glow,this.glowMesh,dt,camera,'glow');this.drawParticles(this.smoke,this.smokeMesh,dt,camera,'smoke');this.drawParticles(this.debris,this.debrisMesh,dt,camera,'debris');this.drawParticles(this.decals,this.decalMesh,dt,camera,'decal');
  let ring=0,slash=0;for(const pulse of this.pulses){pulse.age+=dt;if(pulse.age>=pulse.life)continue;const t=pulse.age/pulse.life,mesh=pulse.slash?this.slashMesh:this.pulseMesh,index=pulse.slash?slash++:ring++;
   this.dummy.position.copy(pulse.p);this.dummy.rotation.set(-Math.PI/2,0,-pulse.angle);const size=pulse.radius*(pulse.stable?1:pulse.slash?.65+t*.35:.15+t*.85);this.dummy.scale.setScalar(size);this.dummy.updateMatrix();mesh.setMatrixAt(index,this.dummy.matrix);mesh.setColorAt(index,pulse.color);(mesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute).setX(index,(1-t)*.8);
  }
  this.pulses=this.pulses.filter(p=>p.age<p.life);this.finish(this.pulseMesh,ring);this.finish(this.slashMesh,slash);
 }
 clear(){this.fire=[];this.trailClock=0;this.boonBursts=this.arcBursts=0;this.arcs=[];this.glow=[];this.smoke=[];this.debris=[];this.decals=[];this.pulses=[];this.previous=new WeakMap();for(const m of this.meshes())m.count=0;}
 get counts(){return{fire:this.fire.length,glow:this.glow.length,smoke:this.smoke.length,debris:this.debris.length,pulses:this.pulses.length,decals:this.decals.length};}
 private meshes(){return[this.fireMesh,this.glowMesh,this.smokeMesh,this.debrisMesh,this.decalMesh,this.pulseMesh,this.slashMesh,this.beamMesh];}
 dispose(){for(const t of this.textures)t.dispose();for(const m of this.meshes()){m.geometry.dispose();(m.material as T.Material).dispose();m.removeFromParent();}}
}
