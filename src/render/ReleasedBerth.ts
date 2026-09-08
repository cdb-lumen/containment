import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {disposeModel} from './meshParts';

export const RELEASED_BERTH_URL=import.meta.env.BASE_URL+'assets/awakening/released-berth/released-berth.glb';
/** This single assembly owns its embedded PBR resources, never the bank's. */
function retire(root:T.Group){
 const resources=new Set<{dispose():void}>(),images=new Set<ImageBitmap>();
 root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const t of Object.values(m))if(t instanceof T.Texture){resources.add(t);if(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)images.add(t.image);}}}});
 root.removeFromParent();resources.forEach(r=>r.dispose());images.forEach(i=>i.close());
}
function validate(source:T.Group){
 source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source,true),epsilon=.001;
 if(![...box.min.toArray(),...box.max.toArray()].every(Number.isFinite)||box.min.x< -45/32-epsilon||box.max.x>103/32+epsilon||box.min.z< -60/32-epsilon||box.max.z>60/32+epsilon||box.min.y< -epsilon||box.max.y>36.5/32||box.max.y<.1)throw Error('released berth fit rejected');
 let meshes=0,triangles=0;
 source.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position?.count??0)/3;if(o instanceof T.SkinnedMesh||Array.isArray(o.material)||!(o.material instanceof T.MeshStandardMaterial)||!o.geometry.attributes.normal||!o.geometry.attributes.uv)throw Error('unsupported released berth mesh');}});
 if(!meshes||meshes>16||triangles>20000)throw Error('released berth geometry budget exceeded');
}
async function loadSource(signal:AbortSignal){
 const response=await fetch(RELEASED_BERTH_URL,{signal});if(!response.ok)throw Error(`released berth HTTP ${response.status}`);
 const bytes=await response.arrayBuffer();if(bytes.byteLength>800000)throw Error('released berth byte budget exceeded');
 return (await new GLTFLoader().parseAsync(bytes,RELEASED_BERTH_URL.slice(0,RELEASED_BERTH_URL.lastIndexOf('/')+1))).scene;
}
export function attachReleasedBerth(room:T.Group,onChanged:()=>void,load:(signal:AbortSignal)=>Promise<T.Group>=loadSource,timeoutMs=8000){
 const controller=new AbortController();let active=true,source:T.Group|undefined,timer:ReturnType<typeof setTimeout>;
 const fallback=room.getObjectByName('awakening-release');
 const owner={state:'loading',notificationError:undefined as unknown,ready:Promise.resolve(),dispose(){if(owner.state==='disposed')return;active=false;controller.abort();clearTimeout(timer);if(source){retire(source);source=undefined;}owner.state='disposed';}};
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('released berth timeout')),timeoutMs);});
 const pending=(async()=>load(controller.signal))().then(s=>{if(!active){retire(s);throw Error('stale released berth');}return s;});
 const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('released berth cancelled')),{once:true}));
 owner.ready=Promise.race([pending,timeout,cancelled]).then(s=>{
  if(!active){retire(s);return;}source=s;
  if(!fallback||fallback.parent!==room)throw Error('stale released berth target');
  validate(s);s.name='released-berth';s.position.set(135/32,0,440/32);s.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});
  const oldSigns=new Set(fallback.userData.localSigns??[]);
  room.add(s);room.userData.localSigns=(room.userData.localSigns??[]).filter((sign:unknown)=>!oldSigns.has(sign));disposeModel(fallback);owner.state='ready';
 }).catch(()=>{if(source){retire(source);source=undefined;}if(active){active=false;controller.abort();owner.state='fallback';}}).then(()=>{
  if(owner.state==='ready')try{onChanged();}catch(error){owner.notificationError=error;}
 }).finally(()=>clearTimeout(timer));
 return owner;
}
