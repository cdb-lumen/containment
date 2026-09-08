import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {disposeModel} from './meshParts';

export const PASSENGER_EXEMPLAR_URL=import.meta.env.BASE_URL+'assets/passenger-vault/exemplar.glb';
/** Same bounded ownership contract as RecoveryKit. This owner replaces one pod. */
function retire(root:T.Group){
 const resources=new Set<{dispose():void}>(),images=new Set<ImageBitmap>();
 root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const t of Object.values(m))if(t instanceof T.Texture){resources.add(t);if(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)images.add(t.image);}}}});
 root.removeFromParent();resources.forEach(r=>r.dispose());images.forEach(i=>i.close());
}
export function validatePassengerExemplar(source:T.Group){
 source.updateMatrixWorld(true);let meshes=0,triangles=0;
 source.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  meshes++;const p=o.geometry.getAttribute('position');
  if(o instanceof T.SkinnedMesh||Array.isArray(o.material)||!(o.material instanceof T.MeshStandardMaterial)||!p||!o.geometry.attributes.normal||!o.geometry.attributes.uv)throw Error('unsupported passenger mesh');
  triangles+=(o.geometry.index?.count??p.count)/3;
  for(let i=0;i<p.count;i++){
   const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).multiplyScalar(32);
   // Convex subreservation inside the unchanged first well, including feet/trunk unions.
   if(![v.x,v.y,v.z].every(Number.isFinite)||v.x< -26.2||v.x>24.6||v.z< -53.2||v.z>49.1||v.y< -156.18||v.y>15.84)throw Error('passenger fit rejected');
  }
 });
 if(!meshes||meshes>10||triangles>24000)throw Error('passenger geometry budget exceeded');
}
async function loadSource(signal:AbortSignal){
 const response=await fetch(PASSENGER_EXEMPLAR_URL,{signal});if(!response.ok)throw Error(`passenger HTTP ${response.status}`);
 const bytes=await response.arrayBuffer();if(bytes.byteLength>800000)throw Error('passenger byte budget exceeded');
 const gltf=await new GLTFLoader().parseAsync(bytes,PASSENGER_EXEMPLAR_URL.slice(0,PASSENGER_EXEMPLAR_URL.lastIndexOf('/')+1));
 try{gltf.scene.traverse(o=>{if(!(o instanceof T.Mesh)||!(o.material instanceof T.MeshStandardMaterial))return;
  const id=gltf.parser.associations.get(o.material)?.materials;if(id===undefined)return;
  const pbr=gltf.parser.json.materials[id].pbrMetallicRoughness;
  if((pbr?.baseColorTexture&&!o.material.map)||(pbr?.metallicRoughnessTexture&&(!o.material.roughnessMap||!o.material.metalnessMap)))throw Error('passenger image decode failed');
 });return gltf.scene;}catch(error){retire(gltf.scene);throw error;}
}
export function attachPassengerExemplar(room:T.Group,onChanged:()=>void,load:(signal:AbortSignal)=>Promise<T.Group>=loadSource,timeoutMs=8000){
 const controller=new AbortController();let active=true,source:T.Group|undefined,timer:ReturnType<typeof setTimeout>;
 const fallback=room.getObjectByName('passenger-exemplar-fallback');
 const owner={state:'loading',error:undefined as unknown,notificationError:undefined as unknown,ready:Promise.resolve(),dispose(){if(owner.state==='disposed')return;active=false;controller.abort();clearTimeout(timer);if(source){retire(source);source=undefined;}owner.state='disposed';}};
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('passenger timeout')),timeoutMs);});
 const pending=(async()=>load(controller.signal))().then(s=>{if(!active){retire(s);throw Error('stale passenger');}return s;});
 const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('passenger cancelled')),{once:true}));
 owner.ready=Promise.race([pending,timeout,cancelled]).then(s=>{
  if(!active){retire(s);return;}source=s;
  if(!fallback||fallback.parent!==room)throw Error('stale passenger target');
  validatePassengerExemplar(s);s.name='passenger-exemplar';s.position.set(433.6/32,0,300.48/32);s.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});
  room.add(s);disposeModel(fallback);owner.state='ready';
 }).catch(error=>{owner.error=error;if(source){retire(source);source=undefined;}if(active){active=false;controller.abort();owner.state='fallback';}}).then(()=>{
  if(owner.state==='ready')try{onChanged();}catch(error){owner.notificationError=error;}
 }).finally(()=>clearTimeout(timer));
 return owner;
}
