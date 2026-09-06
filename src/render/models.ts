import * as T from 'three';
import {MAT,shell,rod,batch,disposeModel} from './meshParts';
import {instantiateAsset,type AssetName} from './assets';
import {afflictionEffects,NO_AFFLICTION,type AfflictionStatus} from './afflictions';
import {weaponModel,WEAPON_FIT,WEAPON_APPEARANCE,type GunModel} from './weapons';
import type {WeaponId} from '../game/combat/types';
export {MAT,box,ball,rod,disposeModel} from './meshParts';
export type ActorModel={root:T.Group;body:T.Group;limbs:T.Group[];height:number;weapon?:T.Group;
 animate:(time:number,moving:number,aim:number,recoil?:number,reload?:number,velocity?:{x:number;y:number})=>void;
 equip?:(id:WeaponId)=>void;muzzleWorld?:(target:T.Vector3)=>T.Vector3;
 reset?:()=>void;prepare?:()=>void;setAffliction?:(status:AfflictionStatus)=>void;freeze?:()=>void;attack?:()=>void;hit?:()=>void;setExposed?:(exposed:boolean)=>void;stop?:()=>void;};
const vec=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const species:Record<string,{asset:AssetName;span:number;height?:number}>={
 crawler:{asset:'dretch',span:1.75},stalker:{asset:'basilisk',span:2.35},spitter:{asset:'marauder',span:2.35},
 carrier:{asset:'dragoon',span:3.05},brute:{asset:'tyrant',span:3.1},queen:{asset:'tyrant',span:6.5},
};
const rigMetrics=new Map<string,{size:T.Vector3;center:T.Vector3;minY:number}>();
function rig(name:AssetName,span:number,human=false){
 const source=instantiateAsset(name),root=new T.Group(),body=new T.Group();root.add(body);body.add(source.root);source.root.rotation.y=-Math.PI/2;
 const mixer=new T.AnimationMixer(source.root),actions=new Map<string,T.AnimationAction>(),upper=new Set<string>();
 if(human)source.root.getObjectByName('ribs')?.traverse(o=>upper.add(o.name));
 const action=(name:string):T.AnimationAction|undefined=>{let existing=actions.get(name);if(existing)return existing;const clip=source.clips.find(c=>c.name===name);if(!clip)return;
  const masked=human?new T.AnimationClip(clip.name,clip.duration,clip.tracks.filter(t=>clip.name.endsWith('_delta')?upper.has(t.name.split('.')[0]):!upper.has(t.name.split('.')[0]))):clip;
  existing=mixer.clipAction(masked);actions.set(name,existing);return existing;
 };
 const idle=action('stand')??action('idle');idle?.play();if(human){const pose=action('shotgun_delta');pose?.play();if(pose)pose.paused=true;}mixer.update(0);root.updateMatrixWorld(true);
 let metrics=rigMetrics.get(name);if(!metrics){const bounds=new T.Box3().setFromObject(root,true);metrics={size:bounds.getSize(new T.Vector3()),center:bounds.getCenter(new T.Vector3()),minY:bounds.min.y};rigMetrics.set(name,metrics);}
 const {size,center,minY}=metrics,factor=span/(human?size.y:Math.max(size.x,size.z));
 source.root.scale.multiplyScalar(factor);body.position.y=-minY*factor;source.root.position.x=-center.x*factor;source.root.position.z=-center.z*factor;
 const height=size.y*factor;let current=idle,previous:number|undefined,attackTime=0;
 const switchTo=(next:T.AnimationAction|undefined,oneShot=false)=>{if(!next||next===current&&!oneShot)return;next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);next.setLoop(oneShot?T.LoopOnce:T.LoopRepeat,oneShot?1:Infinity);next.clampWhenFinished=oneShot;next.play();current?.fadeOut(.13);next.fadeIn(.13);current=next;};
 const step=(time:number,moving:number,backwards=false,speed=1)=>{const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;attackTime=Math.max(0,attackTime-dt);if(!attackTime)switchTo(moving>.3?(backwards?action('run_back'):action('run'))??action('walk'):idle);if(current&&moving>.3)current.setEffectiveTimeScale(speed);mixer.update(dt);};
 return{...source,assetRoot:source.root,root,body,height,mixer,actions,action,step,
 reset(){mixer.stopAllAction();mixer.timeScale=1;previous=undefined;attackTime=0;current=idle;idle?.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();root.position.set(0,0,0);root.rotation.set(0,0,0);body.rotation.set(0,0,0);root.traverse(o=>{if(o instanceof T.Bone)o.matrixAutoUpdate=true;if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});mixer.update(0);},freeze(){mixer.timeScale=0;},attack(){const attack=action('attack');if(attack){switchTo(attack,true);attackTime=attack.getClip().duration;}},stop(){mixer.stopAllAction();mixer.uncacheRoot(source.root);}};
}
export function alien(kind:string,elite=false):ActorModel{
 const def=species[kind]??species.crawler,r=rig(def.asset,def.span*(elite?1.12:1));r.root.name=`alien-${kind}`;
 const color=new T.Color(kind==='queen'?0xffd3bb:elite?0xffe2b5:0xffffff);for(const m of r.materials)m.color.multiply(color);
 let flash=0,previous:number|undefined,exposed=false,dead=false,status:AfflictionStatus=NO_AFFLICTION;
 let effects:ReturnType<typeof afflictionEffects>|undefined;
 return{root:r.root,body:r.body,limbs:[],height:r.height,attack(){if(!dead&&!status.frozen)r.attack();},freeze(){dead=true;status=NO_AFFLICTION;effects?.reset();r.freeze();},stop:r.stop,prepare(){r.action('run');r.action('attack');},reset(){r.reset();flash=0;previous=undefined;exposed=dead=false;status=NO_AFFLICTION;effects?.reset();for(const m of r.materials)m.emissiveIntensity=0;},hit(){flash=1;},setExposed(v){exposed=v;},setAffliction(v){
  if(dead)return;status=v;
  if(!effects&&(v.chilled||v.burning||v.poisoned||v.frozen))effects=afflictionEffects(r.root,def.span*(elite?1.12:1),r.height);
  effects?.set(v);r.mixer.timeScale=v.frozen?0:1;
 },
 animate(time,moving,aim){const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;flash=Math.max(0,flash-dt*9);r.root.rotation.y=Math.PI/2-aim;r.step(time,moving);effects?.animate(time);for(const m of r.materials){m.emissive.setHex(status.frozen?0x79ddff:exposed?0x42602b:0x8f3320);m.emissiveIntensity=flash*.4+(status.frozen?.12:exposed?.22:0);}}};
}
export function marine():ActorModel{
 const r=rig('marine',2.05,true),weapon=new T.Group();r.root.name='marine';r.root.add(weapon);
 const guns=new Map<WeaponId,GunModel>();let current:GunModel;const socket=r.assetRoot.getObjectByName('tag_weapon')!;let pose=r.action('shotgun_delta');
 const equip=(id:WeaponId)=>{if(current?.id===id)return;let gun=guns.get(id);if(!gun){gun=weaponModel(id);guns.set(id,gun);weapon.add(gun.root);}for(const g of guns.values())g.root.visible=g===gun;current=gun;pose?.stop();pose=r.action(`${({pistol:'blaster',plasma:'prifle',rocket:'lcannon'} as Partial<Record<WeaponId,string>>)[id]??id}_delta`);if(pose){pose.play();pose.paused=true;}};equip('shotgun');
 const inverse=new T.Matrix4(),socketMatrix=new T.Matrix4(),scale=new T.Vector3();
 const spine=r.assetRoot.getObjectByName('spine')!,parentQ=new T.Quaternion(),compensation=new T.Quaternion(),up=new T.Vector3(0,1,0),baseSpine=spine.quaternion.clone(),ribs=r.assetRoot.getObjectByName('ribs')!,baseRibs=ribs.quaternion.clone(),armAxis=new T.Vector3();let gaitYaw=0,backwards=false,previous:number|undefined;
 return{root:r.root,body:r.body,limbs:[],height:r.height,weapon,equip,stop:r.stop,muzzleWorld(target){return current.muzzle.getWorldPosition(target);},
 animate(time,moving,aim,recoil=0,reload=0,velocity){r.root.rotation.y=Math.PI/2-aim;
  const dt=previous===undefined?1/60:Math.max(0,Math.min(.05,time-previous));previous=time;
  const v=velocity??{x:Math.cos(aim)*moving*220,y:Math.sin(aim)*moving*220},travel=Math.hypot(v.x,v.y),direction=Math.atan2(v.y,v.x),forward=Math.cos(direction-aim);if(travel>3){if(forward<-.22)backwards=true;else if(forward>.02)backwards=false;}
  const desired=travel>3?Math.atan2(Math.sin(aim-direction-(backwards?Math.PI:0)),Math.cos(aim-direction-(backwards?Math.PI:0))):0;
  gaitYaw+=Math.atan2(Math.sin(desired-gaitYaw),Math.cos(desired-gaitYaw))*(1-Math.exp(-dt*16));
  spine.quaternion.copy(baseSpine);ribs.quaternion.copy(baseRibs);r.assetRoot.rotation.y=-Math.PI/2+gaitYaw;r.step(time,moving,backwards,T.MathUtils.clamp(travel/220,.35,1.5));
  baseSpine.copy(spine.quaternion);spine.parent!.getWorldQuaternion(parentQ);compensation.copy(parentQ).invert().multiply(new T.Quaternion().setFromAxisAngle(up,-gaitYaw-T.MathUtils.degToRad(WEAPON_FIT[current.id].aimYaw))).multiply(parentQ);spine.quaternion.premultiply(compensation);

  const pose=reload>0?Math.sin(Math.PI*reload):0;
  baseRibs.copy(ribs.quaternion);ribs.parent!.getWorldQuaternion(parentQ);armAxis.set(-Math.sin(aim),0,Math.cos(aim));compensation.copy(parentQ).invert().multiply(new T.Quaternion().setFromAxisAngle(armAxis,pose*.18-recoil*.035)).multiply(parentQ);ribs.quaternion.premultiply(compensation);
  socket.updateWorldMatrix(true,false);inverse.copy(r.root.matrixWorld).invert();socketMatrix.multiplyMatrices(inverse,socket.matrixWorld);socketMatrix.decompose(weapon.position,weapon.quaternion,scale);weapon.scale.setScalar(1);
 }};
}
export function nest():T.Group{
 const g=new T.Group();g.name='queen-nest';shell(g,0,.23,0,.8,.25,1.7,MAT.flesh);shell(g,0,.65,0,.54,.61,1.14,MAT.acid);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a),z=Math.sin(a);rod(g,vec(x*.95,.04,z*.95),vec(x*.45,.38,z*.45),.11,.055,MAT.flesh);rod(g,vec(x*.45,.38,z*.45),vec(x*.24,1.18,z*.24),.015,.11,MAT.shellDark);}
 for(let i=0;i<3;i++)shell(g,0,1.06+i*.08,0,.27-i*.055,.1,.55-i*.1,MAT.flesh);batch(g);return g;
}


/** Retain GPU skinning and freeze the existing pose; no per-death vertex cloning or normal rebuild. */
export function freezeCorpse(model:ActorModel){model.freeze?.();model.root.updateMatrixWorld(true);model.root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial)m.emissiveIntensity=0;}if(o instanceof T.Bone)o.matrixAutoUpdate=false;});}

/** Bake the deformed skin, so thrown bodies keep the exact impact pose. */
export function collapseCorpse(model:ActorModel){
 model.setAffliction?.(NO_AFFLICTION);
 for(const child of [...model.root.children])if(child.userData.afflictionEffect)disposeModel(child);
 model.root.updateMatrixWorld(true);const inverse=model.root.matrixWorld.clone().invert(),baked=new T.Group(),position=new T.Vector3();
 model.root.traverseVisible(object=>{if(object instanceof T.Mesh){
  const geometry=object.geometry.clone();delete geometry.userData.sharedAsset;
  if(object instanceof T.SkinnedMesh){object.skeleton.update();const vertices=geometry.getAttribute('position');for(let i=0;i<vertices.count;i++){position.fromBufferAttribute(vertices,i);object.applyBoneTransform(i,position);vertices.setXYZ(i,position.x,position.y,position.z);}geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.deleteAttribute('tangent');geometry.computeVertexNormals();}
  geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));const mesh=new T.Mesh(geometry,object.material);mesh.castShadow=mesh.receiveShadow=true;baked.add(mesh);
 }});
 model.stop?.();model.root.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});for(const child of [...model.root.children])child.removeFromParent();model.root.add(baked);model.body=baked;model.limbs.length=0;
}
