import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {AWAKENING_FUNCTIONAL_ENVELOPES} from '../game/roguelike/authoredRoomTopologies';
import {disposeModel} from './meshParts';

export const RECOVERY_KIT_URL=import.meta.env.BASE_URL+'assets/awakening/recovery-kit/room-kit.glb';
/** This single assembly owns its embedded PBR resources, never the bank's. */
function retire(root:T.Group){
 const resources=new Set<{dispose():void}>(),images=new Set<ImageBitmap>();
 root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const t of Object.values(m))if(t instanceof T.Texture){resources.add(t);if(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)images.add(t.image);}}}});
 root.removeFromParent();resources.forEach(r=>r.dispose());images.forEach(i=>i.close());
}
function validate(source:T.Group){
 source.updateMatrixWorld(true);
 const allowed=AWAKENING_FUNCTIONAL_ENVELOPES.filter(e=>['monitor','seat-pullback','locker-door','cabinet-door','trolley'].includes(e.id));
 source.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position'),index=o.geometry.index;
 if(!p)throw Error('missing kit positions');
 const count=index?.count??p.count;
 for(let i=0;i<count;i+=3){const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(o.matrixWorld).multiplyScalar(32).add(new T.Vector3(204,0,700)));
 if(!allowed.some(e=>points.every(v=>[v.x,v.y,v.z].every(Number.isFinite)&&v.x>=e.bounds.x-.01&&v.x<=e.bounds.x+e.bounds.w+.01&&v.z>=e.bounds.y-.01&&v.z<=e.bounds.y+e.bounds.h+.01&&v.y>=-.01&&v.y<=e.maxHeight+.01)))throw Error('recovery kit fit rejected');
 }
 });
 let meshes=0,triangles=0;
 source.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position?.count??0)/3;if(o instanceof T.SkinnedMesh||Array.isArray(o.material)||!(o.material instanceof T.MeshStandardMaterial)||!o.geometry.attributes.normal||!o.geometry.attributes.uv)throw Error('unsupported recovery kit mesh');}});
 if(!meshes||meshes>24||triangles>30000)throw Error('recovery kit geometry budget exceeded');
}
async function loadSource(signal:AbortSignal){
 const response=await fetch(RECOVERY_KIT_URL,{signal});if(!response.ok)throw Error(`recovery kit HTTP ${response.status}`);
 const bytes=await response.arrayBuffer();if(bytes.byteLength>1800000)throw Error('recovery kit byte budget exceeded');
 const gltf=await new GLTFLoader().parseAsync(bytes,RECOVERY_KIT_URL.slice(0,RECOVERY_KIT_URL.lastIndexOf('/')+1));
 try{gltf.scene.traverse(o=>{if(!(o instanceof T.Mesh)||!(o.material instanceof T.MeshStandardMaterial))return;
 const id=gltf.parser.associations.get(o.material)?.materials;if(id===undefined)return;
 const pbr=gltf.parser.json.materials[id].pbrMetallicRoughness;
 if((pbr?.baseColorTexture&&!o.material.map)||(pbr?.metallicRoughnessTexture&&(!o.material.roughnessMap||!o.material.metalnessMap)))throw Error('recovery kit image decode failed');
 });return gltf.scene;}catch(error){retire(gltf.scene);throw error;}
}
export function attachRecoveryKit(room:T.Group,onChanged:()=>void,load:(signal:AbortSignal)=>Promise<T.Group>=loadSource,timeoutMs=8000){
 const controller=new AbortController();let active=true,source:T.Group|undefined,timer:ReturnType<typeof setTimeout>;
 const fallback=room.getObjectByName('awakening-kit');
 const owner={state:'loading',notificationError:undefined as unknown,ready:Promise.resolve(),dispose(){if(owner.state==='disposed')return;active=false;controller.abort();clearTimeout(timer);if(source){retire(source);source=undefined;}owner.state='disposed';}};
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('recovery kit timeout')),timeoutMs);});
 const pending=(async()=>load(controller.signal))().then(s=>{if(!active){retire(s);throw Error('stale recovery kit');}return s;});
 const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('recovery kit cancelled')),{once:true}));
 owner.ready=Promise.race([pending,timeout,cancelled]).then(s=>{
  if(!active){retire(s);return;}source=s;
  if(!fallback||fallback.parent!==room)throw Error('stale recovery kit target');
  validate(s);s.name='recovery-kit';s.position.set(204/32,0,700/32);s.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});
  const oldSigns=new Set(fallback.userData.localSigns??[]);
  room.add(s);room.userData.localSigns=(room.userData.localSigns??[]).filter((sign:unknown)=>!oldSigns.has(sign));disposeModel(fallback);owner.state='ready';
 }).catch(()=>{if(source){retire(source);source=undefined;}if(active){active=false;controller.abort();owner.state='fallback';}}).then(()=>{
  if(owner.state==='ready')try{onChanged();}catch(error){owner.notificationError=error;}
 }).finally(()=>clearTimeout(timer));
 return owner;
}
