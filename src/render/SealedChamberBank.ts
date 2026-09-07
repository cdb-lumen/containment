import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {AWAKENING_BLOCKOUT} from '../game/roguelike/authoredRoomTopologies';
import {createAwakeningRacks} from './AuthoredRooms';
import {disposeModel} from './meshParts';

const U=32;
export const SEALED_CHAMBER_URL=import.meta.env.BASE_URL+'assets/benchmark/sealed-cryo.glb';
const slots=AWAKENING_BLOCKOUT.slice(1,3).flatMap(b=>{
 const xs=b.footprint.map(p=>p.x),zs=b.footprint.map(p=>p.y);
 return Array.from({length:4},(_,j)=>({x:Math.min(...xs)+50+j*100,z:(Math.min(...zs)+Math.max(...zs))/2}));
});
/** Ownership is room-local. Embedded textures and instance buffers retire once. */
function retire(...roots:T.Object3D[]){
 const resources=new Set<{dispose():void}>(),images=new Set<ImageBitmap>();
 for(const root of roots){root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);if(o instanceof T.InstancedMesh)resources.add(o);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const t of Object.values(m))if(t instanceof T.Texture){resources.add(t);if(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)images.add(t.image);}}}});root.removeFromParent();}
 resources.forEach(r=>r.dispose());images.forEach(i=>i.close());
}
/** Eight copies share the untouched indexed UV/normal/PBR source, not 8 GLTF loads.
 * Instance matrices retain every exported node transform. No room/world flattening. */
export function buildSealedBank(source:T.Group){
 source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source,true),size=box.getSize(new T.Vector3());
 if(![...box.min.toArray(),...box.max.toArray()].every(Number.isFinite)||size.x>84/U||size.z>86/U||size.y>1||size.y<.1)throw Error('sealed chamber fit rejected');
 // Validate the whole source before allocating any instance buffers.
 source.traverse(o=>{if(o instanceof T.Mesh&&(o instanceof T.SkinnedMesh||Array.isArray(o.material)||!o.geometry.attributes.normal||!o.geometry.attributes.uv))throw Error('unsupported chamber mesh');});
 const root=new T.Group();root.name='sealed-chamber-bank';root.userData.sealedPassengers=slots.length;
 // Only new resources belong to this builder. Shared source resources remain
 // caller-owned until a completed bank is handed back to the room owner.
 const allocated=new Set<{dispose():void}>();
 try{
 source.traverse(o=>{if(!(o instanceof T.Mesh))return;
  const mesh=new T.InstancedMesh(o.geometry,o.material,slots.length);allocated.add(mesh);mesh.name=o.name;mesh.castShadow=mesh.receiveShadow=true;
  slots.forEach((p,i)=>mesh.setMatrixAt(i,new T.Matrix4().makeTranslation(p.x/U,.5-box.min.y,p.z/U).multiply(o.matrixWorld)));
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);
 });
 if(!root.children.length)throw Error('empty chamber');
 // Approved measured union bottoms, native source revision e87b1f2c. Both feeds
 // enter below their manifold. East return bypass clears retained saddle ends.
 const routes:{circuit:number;points:number[][]}[]=root.userData.serviceRoutes=[];
 for(const circuit of [0,1]){
  const parts:T.BufferGeometry[]=[];
  for(const {x,z} of slots){const dx=x-490,dz=z-295,end=[(circuit===0?478.48:493.84)+dx,24.42,258.04+dz];
   const points=circuit===0?[[x,12,z-48],[end[0],12,z-48],[end[0],12,end[2]],end]:[[x,12,z+48],[x+36,12,z+48],[x+36,12,z-40],[end[0],12,z-40],[end[0],12,end[2]],end];
   routes.push({circuit,points});
   for(let i=1;i<points.length;i++){const a=new T.Vector3(...points[i-1]).divideScalar(U),b=new T.Vector3(...points[i]).divideScalar(U),d=b.clone().sub(a);const g=new T.CylinderGeometry(.8/U,.8/U,d.length(),12);allocated.add(g);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());parts.push(g);}
  }
  const geometry=mergeGeometries(parts,false);if(!geometry)throw Error('chamber adapter merge failed');allocated.add(geometry);
  parts.forEach(p=>{allocated.delete(p);p.dispose();});const material=new T.MeshStandardMaterial({color:circuit===0?0x557984:0x8e795b,metalness:.65,roughness:.48});allocated.add(material);
  const mesh=new T.Mesh(geometry,material);mesh.name=circuit===0?'sealed-supply':'sealed-return';mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 }
 return root;
 }catch(error){allocated.forEach(resource=>resource.dispose());root.clear();throw error;}
}
async function loadSource(signal:AbortSignal){
 const response=await fetch(SEALED_CHAMBER_URL,{signal});if(!response.ok)throw Error(`chamber HTTP ${response.status}`);
 const bytes=await response.arrayBuffer();if(bytes.byteLength>1100000)throw Error('chamber byte budget exceeded');
 return (await new GLTFLoader().parseAsync(bytes,SEALED_CHAMBER_URL.slice(0,SEALED_CHAMBER_URL.lastIndexOf('/')+1))).scene;
}
export function attachSealedBank(room:T.Group,onChanged:()=>void,load:(signal:AbortSignal)=>Promise<T.Group>=loadSource,timeoutMs=8000){
 const controller=new AbortController();let active=true,bank:T.Group|undefined,source:T.Group|undefined;
 const owner={state:'loading',notificationError:undefined as unknown,ready:Promise.resolve(),dispose(){if(!active&&owner.state==='disposed')return;active=false;controller.abort();clearTimeout(timer);if(bank)retire(bank,...source?[source]:[]);owner.state='disposed';}};
 let timer:ReturnType<typeof setTimeout>;
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('chamber timeout')),timeoutMs);});
 const pending=(async()=>load(controller.signal))().then(s=>{if(!active){retire(s);throw Error('stale chamber');}return s;});
 const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('chamber cancelled')),{once:true}));
 owner.ready=Promise.race([pending,timeout,cancelled]).then(s=>{
  if(!active){retire(s);return;}source=s;
  const fallback=room.getObjectByName('awakening-racks');if(!fallback)throw Error('stale rack target');
  bank=buildSealedBank(s);const racks=createAwakeningRacks(true);racks.userData.serviceRoutes=bank.userData.serviceRoutes;
  const oldSigns=new Set(fallback.userData.localSigns??[]);
  const signs=[...(room.userData.localSigns??[]).filter((sign:unknown)=>!oldSigns.has(sign)),...racks.userData.localSigns??[]];
  racks.add(bank);room.add(racks);room.userData.serviceRoutes=racks.userData.serviceRoutes;room.userData.localSigns=signs;disposeModel(fallback);owner.state='ready';
 }).catch(()=>{if(source){retire(...bank?[bank,source]:[source]);source=undefined;bank=undefined;}if(active){active=false;controller.abort();owner.state='fallback';}}).then(()=>{
  // Observers do not own the committed assembly and cannot roll it back.
  if(owner.state==='ready')try{onChanged();}catch(error){owner.notificationError=error;}
 }).finally(()=>clearTimeout(timer));
 return owner;
}
