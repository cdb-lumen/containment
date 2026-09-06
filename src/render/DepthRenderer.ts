import {roomFocus} from './roomFraming';
import {SceneLighting,ContactShadows} from './SceneLighting';
import {authoredRoom} from './AuthoredRooms';
import {ActorPool} from './ActorPool';
import {FrameBudget,type GraphicsTier} from './FrameBudget';
import {EnvironmentMaterials} from './EnvironmentMaterials';
import {shipEnvironment,environmentObstacle,environmentArchitecture,appendEnvironment,type ShipEnvironment} from './ShipEnvironments';
import * as T from 'three';
import {EnemyHealthBars} from './EnemyHealthBars';
import {AttackEffects} from './AttackEffects';
import {AcidPoolMaterial} from './acidPool';
import {AfflictionBatches} from './afflictions';
import {WEAPON_APPEARANCE} from './weapons';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MAT,box,ball,rod,marine,alien,nest,disposeModel,freezeCorpse,type ActorModel} from './models';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import type {DepthGame,GameEffect} from '../DepthGame';
import type {RunNode} from '../game/roguelike/types';
const UNIT=32;
type Corpse={model:ActorModel;x:number;y:number;vx:number;vy:number;height:number;lift:number;spin:number;age:number;id:number};
export class DepthRenderer {
 readonly renderer:T.WebGLRenderer;readonly scene=new T.Scene();readonly camera=new T.OrthographicCamera();
 private afflictions=new AfflictionBatches(new T.TextureLoader());private healthBars=new EnemyHealthBars();private hudScene=new T.Scene();private world=new T.Group();private actors=new Map<number,ActorModel>();private nests=new Map<number,T.Group>();private queen:ActorModel|null=null;
 private actorPool=new ActorPool();private player=marine();private corpses:Corpse[]=[];private effects:AttackEffects;
 private surfaces:EnvironmentMaterials;private floorMaterial:T.MeshStandardMaterial;
 private lighting=new SceneLighting();private contacts=new ContactShadows();private muzzle:T.PointLight;private muzzleLife=0;
 private pendingShots:GameEffect[]=[];private shotSocket=new T.Vector3();
 private spotlight:T.SpotLight;private focus=new T.Vector3(18,0,14);private raycaster=new T.Raycaster();private ground=new T.Plane(new T.Vector3(0,1,0),0);
 private composer:EffectComposer;private bloom:UnrealBloomPass;private tier:GraphicsTier='balanced';private auto=true;private budget=new FrameBudget();private shadowTime=0;private shadowsDirty=true;private pixelRatio=1;
 private time=0;private recoil=0;private roomKey='';private temporaryMaterials:T.Material[]=[];
 private bulletMesh:T.InstancedMesh;private dummy=new T.Object3D();
 private pickupMeshes=new Map<number,T.Group>();private exit:T.Group|null=null;
 private warning=new T.Group();private poolMeshes=new Map<number,T.Mesh<T.CircleGeometry,AcidPoolMaterial>>();private menuActors=new T.Group();private menuMarine=marine();private menuAlien=alien('brute',true);private lastMenu=false;
 constructor(readonly canvas:HTMLCanvasElement){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.22;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.info.autoReset=false;
  this.hudScene.add(this.healthBars.root);this.scene.add(this.afflictions.root);
  this.scene.background=new T.Color(0x081014);this.scene.fog=new T.FogExp2(0x102027,.014);
  const pmrem=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.scene.environment=pmrem.fromScene(room,.04).texture;this.scene.environmentIntensity=.4;room.dispose();pmrem.dispose();
  this.scene.add(this.lighting.root,this.contacts.mesh);
  this.surfaces=new EnvironmentMaterials(this.renderer.capabilities.getMaxAnisotropy());this.floorMaterial=this.surfaces.floor;
  this.scene.add(this.world,this.player.root);
  this.muzzle=new T.PointLight(0xffc679,0,3,2);this.scene.add(this.muzzle);
  this.effects=new AttackEffects(this.scene,undefined,this.world);
  this.spotlight=new T.SpotLight(0xbbe7ee,5,14,.38,.9,1.4);this.spotlight.position.set(0,2,0);this.scene.add(this.spotlight,this.spotlight.target);

  this.bulletMesh=new T.InstancedMesh(new T.SphereGeometry(1,6,4),new T.MeshBasicMaterial({color:0xffffff}),320);this.bulletMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.bulletMesh.frustumCulled=false;this.scene.add(this.bulletMesh);
  this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(800,600),.38,.45,1.12);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
  const ringMat=new T.MeshBasicMaterial({color:0xff7850,transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide});
  const outer=new T.Mesh(new T.RingGeometry(.965,1,64),ringMat);outer.rotation.x=-Math.PI/2;this.warning.add(outer);
  const disk=new T.Mesh(new T.CircleGeometry(.95,64),new T.MeshBasicMaterial({color:0xf86839,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide}));disk.rotation.x=-Math.PI/2;this.warning.add(disk);this.scene.add(this.warning);this.warning.visible=false;
  this.menuActors.add(this.menuMarine.root,this.menuAlien.root);this.menuMarine.root.scale.setScalar(1.8);this.menuAlien.root.scale.multiplyScalar(1.5);this.scene.add(this.menuActors);
  this.resize();
 }
 get qualityTier(){return this.tier;}
 setQuality(value:'auto'|'high'|'low'){
  this.auto=value==='auto';this.tier=value==='high'?'high':value==='low'||matchMedia('(pointer:coarse)').matches?'low':'balanced';this.budget.reset();this.applyQuality();
 }
 private applyQuality(){this.renderer.shadowMap.enabled=this.tier!=='low';this.shadowsDirty=true;this.resize();}
 observeFrame(delta:number,cpuMs:number,active:boolean){if(!active){this.budget.reset();return;}if(this.auto&&this.tier!=='low'&&this.budget.sample(delta,cpuMs)){this.tier='low';this.applyQuality();}}
 resize(){
  const w=window.innerWidth,h=window.innerHeight,post=this.tier==='high';this.pixelRatio=Math.min(devicePixelRatio||1,post?1.5:this.tier==='balanced'?1.25:1);
  this.renderer.setPixelRatio(this.pixelRatio);this.renderer.setSize(w,h,false);this.composer.setPixelRatio(post?this.pixelRatio:1);this.composer.setSize(post?w:1,post?h:1);
  const view=h>w?31:22;this.camera.left=-view*w/h/2;this.camera.right=view*w/h/2;this.camera.top=view/2;this.camera.bottom=-view/2;this.camera.near=.1;this.camera.far=120;this.camera.updateProjectionMatrix();
 }
 /** Load shaders, textures, GPU buffers and common animation actions before combat. */
 async prepare(node:RunNode){
  this.loadRoom(node);await this.surfaces.ready;
  const warm:T.Group=new T.Group(),models:ActorModel[]=[];this.scene.add(warm);
  const yieldTask=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
  const shadowEnabled=this.renderer.shadowMap.enabled;
  try{
   for(const kind of ['crawler','brute','spitter','stalker','carrier','queen'])for(let i=0;i<(kind==='queen'?1:3);i++){
    const m=this.actorPool.take(kind,i===2);m.prepare?.();m.animate(0,1,0);m.root.position.copy(this.focus);warm.add(m.root);models.push(m);await yieldTask();
   }
   for(const id of ['pistol','rifle','shotgun','plasma','rocket'] as const){this.player.equip?.(id);this.player.animate(0,0,0);await yieldTask();}this.player.equip?.('shotgun');
   const textures=new Set<T.Texture>();this.scene.traverse(o=>{if(o instanceof T.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(material))if(value instanceof T.Texture)textures.add(value);});
   for(const texture of textures){this.renderer.initTexture(texture);await yieldTask();}
   this.camera.position.copy(this.focus).add(new T.Vector3(0,26,19));this.camera.lookAt(this.focus);this.scene.updateMatrixWorld(true);
   // Compile the actual screen-output variants; an offscreen target changes tone mapping.
   this.renderer.setRenderTarget(null);this.renderer.setViewport(0,0,64,64);this.renderer.setScissor(0,0,64,64);this.renderer.setScissorTest(true);
   for(const shadows of [true,false]){this.renderer.shadowMap.enabled=shadows;await this.renderer.compileAsync(this.scene,this.camera);this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);await yieldTask();}
   await this.renderer.compileAsync(this.hudScene,this.camera);
  }finally{this.renderer.setRenderTarget(null);this.renderer.shadowMap.enabled=shadowEnabled;this.renderer.setScissorTest(false);this.resize();for(const m of models)this.actorPool.release(m);warm.removeFromParent();this.shadowsDirty=true;}
 }
 pointer(clientX:number,clientY:number,targets:readonly {id:number;x:number;y:number;radius:number}[]=[]){
  const rect=this.canvas.getBoundingClientRect();
  this.raycaster.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera);
  // Only a pointer over the torso corrects the floor projection. No cone magnetism.
  let nearest=Infinity,selected:{x:number;y:number}|null=null;
  for(const t of targets){const model=t.id===-1?this.queen:this.actors.get(t.id);if(!model)continue;
   const radius=t.radius/UNIT,height=model.height,center=new T.Vector3(t.x/UNIT,height*.5,t.y/UNIT);
   const scale=new T.Vector3(radius,Math.max(.15,height*.48),radius);
   const ray=this.raycaster.ray.clone();ray.origin.sub(center).divide(scale);ray.direction.divide(scale).normalize();
   const contact=ray.intersectSphere(new T.Sphere(new T.Vector3(),1),new T.Vector3());if(!contact)continue;
   const distance=contact.multiply(scale).add(center).distanceToSquared(this.raycaster.ray.origin);
   if(distance<nearest){nearest=distance;selected={x:t.x,y:t.y};}
  }
  if(selected)return selected;
  const result=new T.Vector3();return this.raycaster.ray.intersectPlane(this.ground,result)?{x:result.x*UNIT,y:result.z*UNIT}:null;
 }
 visible(x:number,y:number){const p=new T.Vector3(x/UNIT,.6,y/UNIT).project(this.camera);return Math.abs(p.x)<.9&&Math.abs(p.y)<.8;}
 private bakeWorld(){
  this.world.updateMatrixWorld(true);const buckets=new Map<T.Material,T.BufferGeometry[]>();
  for(const child of [...this.world.children])if(child instanceof T.Mesh&&child.material!==this.floorMaterial){
   const material=child.material;
   // Flattened environments retain fitted transforms in matrix, not position.
   const {x,y,z}=new T.Vector3().setFromMatrixPosition(child.matrix);
   if(material instanceof T.MeshStandardMaterial&&material.emissiveIntensity>=.5&&material.emissive.getHex()!==0&&y>=.65){
    const fixtures=this.world.userData.lightFixtures??=[];
    if(fixtures.length<256)fixtures.push({x,y,z,color:material.emissive.getHex()});
   }
   const g=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrix);const mat=child.material as T.Material;const list=buckets.get(mat)??[];list.push(g);buckets.set(mat,list);if(child.geometry.userData.environmentUV)child.geometry.dispose();this.world.remove(child);
  }
  for(const [mat,list]of buckets){const merged=mergeGeometries(list);list.forEach(g=>g.dispose());if(merged){const mesh=new T.Mesh(merged,mat);mesh.userData.bakedEnvironment=true;mesh.castShadow=true;mesh.receiveShadow=true;this.world.add(mesh);}}
 }
 loadRoom(node:RunNode,environment:ShipEnvironment|undefined=shipEnvironment(node.templateId)){
  this.clearPools();
  this.roomKey=node.id;this.shadowsDirty=true;disposeModel(this.world);this.temporaryMaterials.forEach(m=>m.dispose());this.temporaryMaterials=[];this.world=new T.Group();this.scene.add(this.world);this.effects.setWorld(this.world);
  for(const m of this.actors.values())this.actorPool.release(m);this.actors.clear();for(const n of this.nests.values())disposeModel(n);this.nests.clear();if(this.queen)this.actorPool.release(this.queen);this.queen=null;
  for(const c of this.corpses)this.actorPool.release(c.model);this.corpses=[];for(const p of this.pickupMeshes.values())disposeModel(p);this.pickupMeshes.clear();this.effects.clear();this.afflictions.clear();this.pendingShots=[];this.muzzleLife=0;this.recoil=0;
  const t=ROOM_TEMPLATES[node.templateId],w=t.width/UNIT,h=t.height/UNIT;
  this.muzzle.intensity=0;this.contacts.begin();this.contacts.end();
  const bespoke=authoredRoom(node.templateId,t);
  const act=Math.min(2,Math.floor(node.depth/4));this.surfaces.theme(act);if(environment)this.surfaces.shipTheme(environment);
  if(bespoke){this.world.add(bespoke);}else{
  const floor=box(this.world,w/2,-.18,h/2,w,.32,h,this.floorMaterial,0);floor.receiveShadow=true;this.surfaces.uv(floor,3.2);
  box(this.world,w/2,-.57,h/2,w+.6,.5,h+.6,MAT.black);
  // Low foreground parapets and tall rear bulkheads keep combat readable.
  for(let x=1;x<w;x+=2){if(!environment)this.wallPanel(x,0,2.6,2,0);this.wallPanel(x,h,.65,2,0);}
  for(let z=1;z<h;z+=2){this.wallPanel(0,z,1.1,2,Math.PI/2);this.wallPanel(w,z,1.1,2,Math.PI/2);}
  for(let x=2;x<w-1;x+=5){
   box(this.world,x,2.2,.21,1.05,.075,.09,MAT.cyan);box(this.world,x,.07,1,.9,.02,.06,MAT.amber,.01);
   box(this.world,x,.075,h-1,.9,.02,.06,MAT.amber,.01);
  }
  for(const [obstacleIndex,r] of t.obstacles.entries()){
   const x=(r.x+r.width/2)/UNIT,z=(r.y+r.height/2)/UNIT,rw=r.width/UNIT,rh=r.height/UNIT;
   if(environment){appendEnvironment(this.world,environmentObstacle(environment,{x:r.x/UNIT,y:r.y/UNIT,width:rw,height:rh},obstacleIndex,node.templateId));continue;}
   const tall=act===1;const height=tall?1.45:1.05;
   this.surfaces.uv(box(this.world,x,height/2,z,rw,height,rh,this.surfaces.cover,.055),2);this.surfaces.uv(box(this.world,x,height-.08,z,rw-.07,.16,rh-.07,this.surfaces.cover),2);
   for(let a=-rw/2+.25;a<rw/2;a+=.8){box(this.world,x+a,height+.02,z,.045,.02,rh-.25,MAT.edge,.01);}
   box(this.world,x,height+.06,z,rw-.35,.08,.1,MAT.trim,.015);
   for(const side of [-1,1])box(this.world,x+side*(rw/2-.11),height*.5,z,.12,height*.83,rh-.16,MAT.edge,.02);
   if(act===2){
    for(let dz=-rh/2+.4;dz<rh/2-.2;dz+=1.2){rod(this.world,new T.Vector3(x-rw*.3,height+.10,z+dz),new T.Vector3(x+rw*.3,height+.10,z+dz),.13,.13,MAT.copper);ball(this.world,x,height+.20,z+dz,.24,.22,.22,MAT.shellDark);}
   }
   if(tall){
    for(let dz=-rh/2+.7;dz<rh/2-.2;dz+=1.3){
     rod(this.world,new T.Vector3(x,.3,z+dz),new T.Vector3(x,1.95,z+dz),.38,.38,MAT.shellDark);
     box(this.world,x,1.7,z+dz,.68,.13,.68,node.templateId==='specimen-bay'?MAT.acid:MAT.cyan);
    }
   }else{
    for(let dz=-rh/2+.6;dz<rh/2-.1;dz+=1.1){box(this.world,x,height+.19,z+dz,Math.max(.3,rw-.5),.25,.8,MAT.dark);box(this.world,x-.22,height+.34,z+dz,.28,.02,.4,MAT.cyan,.01);}
   }
  }
  for(let z=2;z<h-1;z+=3.2)box(this.world,w/2,.001,z,w-1,.012,.022,MAT.black,0);
  for(const x of [1.35,w-1.35])for(let z=2;z<h-2;z+=1.2)box(this.world,x,.012,z,.075,.015,.6,act===1?MAT.cyan:MAT.trim,0);
  // Overhead utility pipes along the back edge, independently lit panels and vents.
  for(const z of [.42,.72]){rod(this.world,new T.Vector3(.4,2.65,z),new T.Vector3(w-.4,2.65,z),.09,.09,MAT.edge);}
  for(let x=3;x<w;x+=6){box(this.world,x,2.65,.58,.12,.28,.8,MAT.dark);}
  for(const b of t.breaches){const x=b.x/UNIT,z=b.y/UNIT;box(this.world,x,.04,z,1.25,.06,1.1,MAT.black);for(let i=-4;i<=4;i++)box(this.world,x+i*.12,.085,z,.05,.04,.9,MAT.edge,.01);}
  if(environment)environmentArchitecture(this.world,environment,w,h);
  this.bakeWorld();
  }
  this.exit=new T.Group();this.exit.position.set(t.exit.x/UNIT,0,t.exit.y/UNIT);this.world.add(this.exit);
  for(const side of [-1,1]){box(this.exit,0,.7,side*.7,.12,1.4,.18,MAT.steel);box(this.exit,.08,.7,side*.7,.04,1.05,.05,MAT.cyan,.01);}
  box(this.exit,0,1.5,0,.2,.2,1.6,MAT.dark);box(this.exit,0,.035,0,1.7,.02,1.55,MAT.dark);
  if(node.kind==='boss'&&!bespoke){
   const ring=new T.Mesh(new T.TorusGeometry(6.7,.045,5,80),MAT.amber);ring.rotation.x=Math.PI/2;ring.position.set(w/2,.07,h/2);this.world.add(ring);
   const inner=new T.Mesh(new T.TorusGeometry(4.9,.025,5,60),MAT.cyan);inner.rotation.x=Math.PI/2;inner.position.set(w/2,.08,h/2);this.world.add(inner);
  }
  const initial=roomFocus(t.spawn.x/UNIT,t.spawn.y/UNIT,w,h,this.camera.right-this.camera.left,this.camera.top-this.camera.bottom);
  this.focus.set(initial.x,0,initial.z);this.lighting.loadRoom(this.world,w,h);
 }
 private wallPanel(x:number,z:number,height:number,length:number,rotation:number){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;
  this.surfaces.uv(box(g,0,height/2,0,length,height,.32,this.surfaces.wall),2);box(g,0,height/2,.19,length-.17,height-.15,.12,this.surfaces.cover);box(g,0,height+.015,0,length,.08,.48,MAT.edge);
  for(const side of [-1,1])box(g,side*(length/2-.1),height/2,.22,.11,height,.12,MAT.edge,.015);
  g.updateMatrix();for(const child of [...g.children]){child.applyMatrix4(g.matrix);this.world.add(child);}
 }
 effect(effect:GameEffect){
  const x=effect.x/UNIT,z=effect.y/UNIT;
  if(effect.type==='hurt'||effect.type==='sync-corpse')return;
  if(effect.type==='explosion'||(effect.type==='boon'&&(effect.boon==='blast'||effect.boon==='overload')))this.lighting.explosion(x,z,(effect.radius??48)/UNIT);
  if(effect.type==='shot'){
   this.recoil=1;if(this.pendingShots.length<4)this.pendingShots.push(effect);return;
  }
  if(effect.type==='enemy-attack'){if(effect.id===-1)this.queen?.attack?.();else this.actors.get(effect.id!)?.attack?.();}
  if((effect.contact==='damage'||effect.contact==='armor')&&effect.targetId!==undefined){if(effect.targetId===-1)this.queen?.hit?.();else this.actors.get(effect.targetId)?.hit?.();}
  if(effect.type==='corpse'){
   let existing=this.actors.get(effect.id!);if(!existing&&effect.family){existing=this.actorPool.take(effect.family);existing.root.position.set(x,0,z);this.scene.add(existing.root);}if(existing){freezeCorpse(existing);this.actors.delete(effect.id!);this.corpses.push({model:existing,id:effect.id!,x,y:z,vx:(effect.vx??0)/UNIT,vy:(effect.vy??0)/UNIT,height:.2,lift:3,spin:2.4,age:0});if(this.corpses.length>(matchMedia('(pointer:coarse)').matches?6:12)){this.actorPool.release(this.corpses.shift()!.model);}}
  }
  this.effects.event(effect);
 }
 syncCorpse(id:number,x:number,y:number){const corpse=this.corpses.find(c=>c.id===id);if(corpse){corpse.x=x/UNIT;corpse.y=y/UNIT;corpse.vx=corpse.vy=0;}}
 render(game:DepthGame,delta:number,menu=false){
  if(this.roomKey!==game.node.id)this.loadRoom(game.node);
  if(game.status!=='playing'){for(const model of this.actors.values())model.hit?.(0);this.queen?.hit?.(0);}
  const dt=game.status==='paused'||game.status==='reward'||game.status==='route'?0:Math.min(delta,.05);this.time+=dt;const p=game.player;
  const bounds=game.geometry.bounds;
  const framed=roomFocus(p.x/UNIT,p.y/UNIT,bounds.width/UNIT,bounds.height/UNIT,(this.camera.right-this.camera.left)/this.camera.zoom,(this.camera.top-this.camera.bottom)/this.camera.zoom);
  const desired=new T.Vector3(framed.x,0,framed.z);if(menu){desired.set(bounds.width/UNIT*.45,0,bounds.height/UNIT*.51);}
  this.focus.lerp(desired,1-Math.exp(-dt*7));this.camera.position.copy(this.focus).add(new T.Vector3(0,26,19));this.camera.lookAt(this.focus);this.camera.updateMatrixWorld();
  // The shadow projection remains anchored to the room, avoiding subpixel shimmer.
  this.player.root.position.set(p.x/UNIT,0,p.y/UNIT);this.player.root.visible=!menu;this.player.root.rotation.z=game.combat.snapshot.dead?1.4:0;
  const combat=game.combat.snapshot;this.player.equip?.(combat.weaponId);
  this.player.animate(this.time,p.moving?1:0,p.angle,this.recoil,combat.reloading?Math.max(.001,1-combat.reloadRemainingMs/combat.reloadDurationMs):0,{x:p.vx,y:p.vy});this.recoil=Math.max(0,this.recoil-dt*14);
  const socket=this.player.muzzleWorld!(this.shotSocket);
  for(const shot of this.pendingShots){const id=shot.weapon??'pistol';this.effects.shot(socket,shot.angle??p.angle,id);this.muzzleLife=id==='shotgun'?.075:.045;this.muzzle.color.setHex(WEAPON_APPEARANCE[id].color);this.muzzle.position.copy(socket);}this.pendingShots.length=0;
  for(const b of game.bullets)if(b.kind==='player'&&!b.visualMuzzle){const distance=Math.max(0,(socket.x-p.x/UNIT)*Math.cos(b.request.angle)+(socket.z-p.y/UNIT)*Math.sin(b.request.angle))*UNIT;b.visualMuzzle={x:socket.x,y:socket.y,z:socket.z,distance};}
  this.spotlight.position.set(p.x/UNIT,1.55,p.y/UNIT);this.spotlight.target.position.set(p.x/UNIT+Math.cos(p.angle)*9,.1,p.y/UNIT+Math.sin(p.angle)*9);
  const active=new Set<number>();
  for(const e of game.enemies.snapshot.enemies){active.add(e.id);let model=this.actors.get(e.id);if(!model){model=this.actorPool.take(e.type,e.elite);this.shadowsDirty=true;this.actors.set(e.id,model);this.scene.add(model.root);}model.root.position.set(e.x/UNIT,0,e.y/UNIT);model.setAffliction?.(game.boonStatuses(e.id));model.animate(this.time+e.id,Math.hypot(e.velocityX,e.velocityY)>2?1:.12,Math.atan2((e.type==='spitter'?game.player.y:e.targetY)-e.y,(e.type==='spitter'?game.player.x:e.targetX)-e.x));}
  for(const [id,model]of this.actors)if(!active.has(id)){this.actorPool.release(model);this.actors.delete(id);this.shadowsDirty=true;}
  this.healthBars.update([...game.enemies.snapshot.enemies.map(e=>({x:e.x/UNIT,z:e.y/UNIT,height:this.actors.get(e.id)?.height??1,health:e.health,maxHealth:e.maxHealth,elite:e.elite,armor:e.armor,maxArmor:e.maxArmor})),...game.boss.snapshot.nests.map(n=>({x:n.x/UNIT,z:n.y/UNIT,height:1.35,health:n.health,maxHealth:n.maxHealth}))],this.camera,this.canvas.clientHeight,menu);
  this.menuActors.visible=menu;
  if(menu){this.menuMarine.root.position.set(23,0,13);this.menuAlien.root.position.set(28,0,15);this.menuMarine.animate(this.time,0,.42);this.menuAlien.animate(this.time,.12,Math.PI+.5);}
  if(menu!==this.lastMenu){this.camera.zoom=menu?1.23:1;this.camera.updateProjectionMatrix();this.lastMenu=menu;}
  const q=game.boss.snapshot;
  this.warning.visible=!!q.pendingTelegraph&&!menu;
  if(q.pendingTelegraph){const t=q.pendingTelegraph;this.warning.position.set(t.targetX/UNIT,.045,t.targetY/UNIT);this.warning.scale.setScalar(t.radius/UNIT);const material=(this.warning.children[0] as T.Mesh).material as T.MeshBasicMaterial;material.opacity=.8;}
  this.syncPools(game.pools);

  if(q.active&&!this.queen){this.queen=this.actorPool.take('queen');this.scene.add(this.queen.root);}
  if(this.queen){this.queen.setExposed?.(q.vulnerable);this.queen.setAffliction?.(q.defeated?{chilled:false,burning:false,poisoned:false,frozen:false}:game.boonStatuses(-1));this.queen.root.position.set(q.x/UNIT,0,q.y/UNIT);this.queen.animate(this.time,.4,q.rotation);if(q.defeated){this.queen.root.rotation.z=1.25;this.queen.root.position.y=-.35;}}
  const nestIds=new Set<number>();for(const n of q.nests){nestIds.add(n.id);let model=this.nests.get(n.id);if(!model){model=nest();this.nests.set(n.id,model);this.scene.add(model);}model.position.set(n.x/UNIT,0,n.y/UNIT);model.scale.y=1+Math.sin(this.time*3+n.id)*.035;}
  for(const[id,model]of this.nests)if(!nestIds.has(id)){disposeModel(model);this.nests.delete(id);}
  for(const c of this.corpses){if(c.age>2&&Math.abs(c.vx)+Math.abs(c.vy)<.02&&c.height<=.08)continue;c.age+=dt;const moved=game.moveCorpse({x:c.x*UNIT,y:c.y*UNIT,radius:14},c.vx*dt*UNIT,c.vy*dt*UNIT);c.x=moved.x/UNIT;c.y=moved.y/UNIT;if(moved.blocked){c.vx*=-.22;c.vy*=-.22;}c.vx*=Math.exp(-3.8*dt);c.vy*=Math.exp(-3.8*dt);c.lift-=9.8*dt;c.height=Math.max(.08,c.height+c.lift*dt);if(c.height<=.08)c.lift=0;
   c.model.root.position.set(c.x,c.height,c.y);c.model.body.rotation.z=Math.min(Math.PI*.78,c.age*5);c.model.root.rotation.y+=c.spin*dt*Math.exp(-c.age*3);
  }
  this.muzzleLife-=dt;this.muzzle.intensity=this.muzzleLife>0?6*Math.min(1,this.muzzleLife/.035):0;
  this.lighting.update(dt);
  this.contacts.begin();
  if(menu){this.contacts.add(23,13,.75);this.contacts.add(28,15,1.1);}else{
   this.contacts.add(p.x/UNIT,p.y/UNIT,.45);
   if(this.queen)this.contacts.add(q.x/UNIT,q.y/UNIT,1.3);
   for(const n of q.nests)this.contacts.add(n.x/UNIT,n.y/UNIT,.7);
   for(const e of game.enemies.snapshot.enemies)this.contacts.add(e.x/UNIT,e.y/UNIT,e.radius/UNIT);
   for(const c of this.corpses)this.contacts.add(c.x,c.y,.45);
  }
  this.contacts.end();
  this.effects.update(dt,this.camera,game.bullets);
  let index=0;for(const b of game.bullets){if(index>=320)break;if(b.kind==='player'&&(2-b.life)*b.request.speed<(b.visualMuzzle?.distance??0))continue;this.dummy.position.set(b.x/UNIT,b.kind==='grenade'?1+Math.sin((1-b.life/1.1)*Math.PI)*1.4:b.visualMuzzle?.y??.95,b.y/UNIT);this.dummy.rotation.set(0,Math.PI/2-b.request.angle,0);this.dummy.scale.set(b.kind==='hazard'?.09:.025,.025,b.request.weaponId==='rocket'?.35:.24);this.dummy.updateMatrix();this.bulletMesh.setMatrixAt(index,this.dummy.matrix);this.bulletMesh.setColorAt(index,new T.Color(b.kind==='hazard'?0xa4e875:b.request.weaponId==='plasma'?0x73eced:0xffd58f));index++;}this.bulletMesh.count=index;this.bulletMesh.instanceMatrix.needsUpdate=true;if(this.bulletMesh.instanceColor)this.bulletMesh.instanceColor.needsUpdate=true;

  const pickupIds=new Set<number>();for(const item of game.pickups.snapshot){pickupIds.add(item.id);let model=this.pickupMeshes.get(item.id);if(!model){model=new T.Group();box(model,0,0,0,.34,.22,.34,MAT.dark);box(model,0,.13,0,.26,.03,.26,item.kind==='health'?MAT.acid:MAT.cyan,.01);this.pickupMeshes.set(item.id,model);this.scene.add(model);}model.position.set(item.x/UNIT,.26+Math.sin(this.time*2+item.id)*.07,item.y/UNIT);model.rotation.y=this.time*.6;}
  for(const[id,model]of this.pickupMeshes)if(!pickupIds.has(id)){disposeModel(model);this.pickupMeshes.delete(id);}
  this.shadowTime+=dt;this.renderer.shadowMap.needsUpdate=this.shadowsDirty||this.shadowTime>=1/30;
  if(this.renderer.shadowMap.needsUpdate){this.shadowTime=0;this.shadowsDirty=false;}
  this.afflictions.update(this.scene.children,this.camera,this.time);this.renderer.info.reset();
  if(this.tier==='high')this.composer.render();else this.renderer.render(this.scene,this.camera);
  const autoClear=this.renderer.autoClear;this.renderer.autoClear=false;this.renderer.render(this.hudScene,this.camera);this.renderer.autoClear=autoClear;
 }
 private syncPools(pools:readonly {id:number;x:number;y:number;radius:number;life:number}[]){
  const poolIds=new Set<number>();
  for(const p of pools){
   poolIds.add(p.id);let mesh=this.poolMeshes.get(p.id);
   if(!mesh){mesh=new T.Mesh(new T.CircleGeometry(1,40),new AcidPoolMaterial(p.id));mesh.rotation.x=-Math.PI/2;this.scene.add(mesh);this.poolMeshes.set(p.id,mesh);}
   mesh.position.set(p.x/UNIT,.03,p.y/UNIT);mesh.scale.setScalar(p.radius/UNIT);
   mesh.material.opacity=Math.min(.3,p.life*.3);mesh.material.surfaceTime.value=this.time;
  }
  for(const[id,mesh]of this.poolMeshes)if(!poolIds.has(id)){mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();this.poolMeshes.delete(id);}
 }
 private clearPools(){for(const mesh of this.poolMeshes.values()){mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();}this.poolMeshes.clear();}
 dispose(){this.clearPools();disposeModel(this.world);this.temporaryMaterials.forEach(m=>m.dispose());this.lighting.dispose();this.contacts.dispose();this.afflictions.dispose();this.actorPool.dispose();this.healthBars.dispose();this.effects.dispose();this.renderer.dispose();this.composer.dispose();this.surfaces.dispose();}
}
