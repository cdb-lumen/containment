import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {disposeModel} from './meshParts';
import floorAttributes from './passengerFloor.json';

export const PASSENGER_FAMILIES=['chamber','row-carrier','distribution-north','distribution-south','monitor-north','monitor-south','service-finish'] as const;
type Family=typeof PASSENGER_FAMILIES[number];
type Sources=Record<string,T.Object3D>;
const MAX_BYTES=16*1024*1024,MAX_TEXTURE_BYTES=32*1024*1024;
function mipBytes(width:number,height:number){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>2048||height>2048)throw Error('Passenger decoded image budget exceeded');
 let bytes=0;while(true){bytes+=width*height*4;if(width===1&&height===1)return bytes;width=Math.max(1,Math.floor(width/2));height=Math.max(1,Math.floor(height/2));}
}
const placements:{family:Family;x:number;z:number;angle:number;dx:number;dz:number}[]=[];
for(const [x,z,angle] of [[420,300,0],[780,300,0],[420,580,Math.PI],[780,580,Math.PI]]){
 placements.push({family:'row-carrier',x,z,angle,dx:0,dz:0});
 for(const dx of [-2.34375,-.78125,.78125,2.34375])placements.push({family:'chamber',x,z,angle,dx,dz:.25});
}
for(const [family,x,z,angle] of [['distribution-north',600,80,0],['distribution-south',600,800,Math.PI],['monitor-north',1100,280,0],['monitor-south',0,0,0],['service-finish',0,0,0]] as const)placements.push({family,x,z,angle,dx:0,dz:0});
/** Resource identities are shared by merged meshes and source graphs. */
function retire(roots:T.Group[]){
 const resources=new Set<{dispose():void}>(),images=new Set<ImageBitmap>();
 for(const root of roots){root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const t of Object.values(m))if(t instanceof T.Texture){resources.add(t);if(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)images.add(t.image);}}}});root.removeFromParent();}
 resources.forEach(r=>r.dispose());images.forEach(i=>i.close());
}
export function buildPassengerVault(sources:Sources){
 const root=new T.Group();root.name='passenger-vault-equipment';
 const bins=new Map<string,{material:T.Material;parts:T.BufferGeometry[];service:boolean}>(),allocated=new Set<T.BufferGeometry>();
 const materials=new Set<T.Material>(),textures=new Set<T.Texture>();let decodedBytes=0;
 let triangles=0;
 try{
  for(const p of placements){const source=sources[p.family];if(!source)throw Error('missing Passenger family');source.updateWorldMatrix(true,true);
   const transform=new T.Matrix4().compose(new T.Vector3(p.x/32,0,p.z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),p.angle),new T.Vector3(1,1,1)).multiply(new T.Matrix4().makeTranslation(p.dx,0,p.dz));
   let meshes=0;source.traverse(o=>{if(!(o instanceof T.Mesh))return;meshes++;
    if(o instanceof T.SkinnedMesh||Array.isArray(o.material)||!(o.material instanceof T.MeshStandardMaterial)||!o.geometry.attributes.position||!o.geometry.attributes.normal)throw Error('unsupported Passenger mesh');
    materials.add(o.material);if(materials.size>8)throw Error('Passenger material budget exceeded');
    for(const t of Object.values(o.material))if(t instanceof T.Texture&&!textures.has(t)){textures.add(t);decodedBytes+=mipBytes(t.image?.width,t.image?.height);if(decodedBytes>MAX_TEXTURE_BYTES)throw Error('Passenger decoded image budget exceeded');}
    triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;if(!Number.isInteger(triangles)||triangles>100000)throw Error('Passenger triangle budget exceeded');
    const g:T.BufferGeometry=o.geometry.clone();allocated.add(g);g.applyMatrix4(new T.Matrix4().multiplyMatrices(transform,o.matrixWorld));g.computeBoundingBox();const b=g.boundingBox!;
    if(![...b.min.toArray(),...b.max.toArray()].every(Number.isFinite)||b.min.x<0||b.max.x>38||b.min.z<0||b.max.z>28||b.min.y< -2||b.max.y>4)throw Error('Passenger room bounds rejected');
    const service=p.family==='service-finish';
    const key=service+o.material.uuid+JSON.stringify([!!g.index,Object.entries(g.attributes).sort(([a],[b])=>a.localeCompare(b)).map(([n,a])=>[n,a.itemSize,a.normalized,a.array.constructor.name])]);
    const bin=bins.get(key)??{material:o.material,parts:[],service};bin.parts.push(g);bins.set(key,bin);
   });if(!meshes||meshes>2000)throw Error('Passenger mesh budget exceeded');
  }
  const draws=[...bins.values()].reduce((n,{material})=>n+(material.transparent&&material.side===T.DoubleSide&&!material.forceSinglePass?2:1),0);
  if(draws>48)throw Error('Passenger draw budget exceeded');root.userData.draws=draws;
  for(const {material,parts,service} of bins.values()){const geometry=mergeGeometries(parts,false);if(!geometry)throw Error('Passenger merge failed');allocated.add(geometry);const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;
   // Render-local state keeps eight shared material definitions. Never mutate
   // the source material permanently or apply the finish bias to other families.
   if(service){mesh.userData.passengerServiceFinish=true;let saved:[boolean,number,number]|undefined;
    mesh.onBeforeRender=()=>{saved=[material.polygonOffset,material.polygonOffsetFactor,material.polygonOffsetUnits];material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;};
    mesh.onAfterRender=()=>{if(saved){[material.polygonOffset,material.polygonOffsetFactor,material.polygonOffsetUnits]=saved;saved=undefined;}};
   }root.add(mesh);}
  for(const {parts} of bins.values())for(const g of parts){allocated.delete(g);g.dispose();}
  root.userData.instances=placements.length;root.userData.triangles=triangles;root.userData.materials=materials.size;root.userData.decodedTextureBytes=decodedBytes;return root;
 }catch(error){allocated.forEach(g=>g.dispose());root.clear();throw error;}
}
/** Stream cap applies before GLTF parsing; only embedded resources are permitted. */
export async function loadPassengerSource(signal:AbortSignal){
 const url=import.meta.env.BASE_URL+'assets/passenger-vault/runtime/equipment.glb';
 const response=await fetch(url,{signal});if(!response.ok)throw Error(`Passenger HTTP ${response.status}`);
 const max=MAX_BYTES;if(Number(response.headers.get('content-length'))>max){await response.body?.cancel();throw Error('Passenger byte budget exceeded');}
 const reader=response.body?.getReader();if(!reader)throw Error('Passenger missing body');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error('Passenger byte budget exceeded');chunks.push(value);}}catch(error){await reader.cancel();throw error;}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const view=new DataView(bytes.buffer);if(size<28||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==size||view.getUint32(16,true)!==0x4e4f534a)throw Error('invalid Passenger GLB');
 const length=view.getUint32(12,true);if(length%4||length>size-28||view.getUint32(24+length,true)!==0x004e4942||view.getUint32(20+length,true)!==size-28-length)throw Error('invalid Passenger JSON');
 const json=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+length)));
 if((json.materials?.length??0)>8)throw Error('Passenger material budget exceeded');
 if([...(json.buffers??[]),...(json.images??[])].some(r=>r.uri)||json.extensionsRequired?.some((e:string)=>e!=='KHR_texture_transform'))throw Error('external or unsupported Passenger resources');
 let decodedBytes=0;const binaryOffset=28+length,dimensions:{width:number;height:number}[]=[];
 for(const image of json.images??[]){const bv=json.bufferViews?.[image.bufferView],start=binaryOffset+(bv?.byteOffset??0);
  if(image.mimeType!=='image/png'||!bv||bv.byteLength<24||start<binaryOffset||start+bv.byteLength>size||view.getUint32(start)!==0x89504e47||view.getUint32(start+12)!==0x49484452)throw Error('invalid Passenger PNG');
  const width=view.getUint32(start+16),height=view.getUint32(start+20);mipBytes(width,height);dimensions.push({width,height});
 }
 // Each texture definition may allocate separately even when images are shared.
 for(const texture of json.textures??[]){const image=dimensions[texture.source];if(!image)throw Error('invalid Passenger texture');decodedBytes+=mipBytes(image.width,image.height);if(decodedBytes>MAX_TEXTURE_BYTES)throw Error('Passenger decoded image budget exceeded');}
 if(signal.aborted)throw Error('Passenger cancelled');
 const scene=(await new GLTFLoader().parseAsync(bytes.buffer,'')).scene;
 if(signal.aborted){retire([scene]);throw Error('Passenger cancelled');}return scene;
}
export function attachPassengerVault(room:T.Group,onChanged:()=>void,load:(signal:AbortSignal)=>Promise<T.Group>=loadPassengerSource,timeoutMs=8000){
 const controller=new AbortController();let active=true,source:T.Group|undefined,bank:T.Group|undefined,timer:ReturnType<typeof setTimeout>;
 const fallback=room.getObjectByName('passenger-equipment-fallback');
 const cleanup=()=>{retire([...source?[source]:[],...bank?[bank]:[]]);source=undefined;bank=undefined;};
 const owner={state:'loading',notificationError:undefined as unknown,error:undefined as unknown,ready:Promise.resolve(),dispose(){if(owner.state==='disposed')return;active=false;controller.abort();clearTimeout(timer);cleanup();owner.state='disposed';}};
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Passenger timeout')),timeoutMs);});
 const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('Passenger cancelled')),{once:true}));
 const pending=(async()=>{const s=await load(controller.signal);if(!active){retire([s]);throw Error('stale Passenger source');}source=s;})();
 owner.ready=Promise.race([pending,timeout,cancelled]).then(()=>{if(!active)return;if(!fallback||fallback.parent!==room)throw Error('stale Passenger fallback');
 const sources:Sources={};for(const family of PASSENGER_FAMILIES){const matches=source!.children.filter(o=>o.name===family);if(matches.length!==1)throw Error('missing or duplicate Passenger family');sources[family]=matches[0];}bank=buildPassengerVault(sources);
 const decks:T.Mesh[]=[];room.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)&&o.material.name==='painted-steel-deck')decks.push(o);});
 if(decks.length!==1)throw Error('Passenger requires exactly one deck');
 {const deck=decks[0],g=new T.BufferGeometry();for(const [key,name,size] of [['POSITION','position',3],['NORMAL','normal',3],['TEXCOORD_0','uv',2]] as const)g.setAttribute(name,new T.Float32BufferAttribute(floorAttributes[key],size));room.updateMatrixWorld(true);g.applyMatrix4(new T.Matrix4().copy(deck.matrixWorld).invert().multiply(room.matrixWorld));deck.geometry.dispose();deck.geometry=g;}
 room.add(bank);disposeModel(fallback);owner.state='ready';}).catch(error=>{owner.error=error;cleanup();if(active){active=false;controller.abort();owner.state='fallback';}}).then(()=>{if(owner.state==='ready')try{onChanged();}catch(error){owner.notificationError=error;}}).finally(()=>clearTimeout(timer));
 return owner;
}
