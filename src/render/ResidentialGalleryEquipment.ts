import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {disposeModel} from './meshParts';

// Frozen room-3 collision rectangles in gameplay units, with original cutaway heights.
const ZONES=[
 {name:'rg_cabin_nw',x:280,z:160,w:240,d:100,h:1.35},
 {name:'rg_bunk_storage',x:280,z:520,w:120,d:200,h:1.1},
 {name:'rg_cabin_ne',x:650,z:270,w:260,d:100,h:1.35},
 {name:'rg_packing',x:780,z:570,w:140,d:150,h:1.2},
] as const;
const MAX_BYTES=512*1024,MAX_DRAWS=24,MAX_TRIANGLES=8000,MAX_VERTICES=16000,MAX_MATERIALS=7;
const FALLBACK='residential-gallery-equipment-fallback';
/** This owner exclusively owns decoded resources; fallback uses shared global MAT/cache. */
function retire(root:T.Group){
 const resources=new Set<{dispose():void}>(),images=new Set<ImageBitmap>();
 root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line||o instanceof T.Points){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const t of Object.values(m))if(t instanceof T.Texture){resources.add(t);if(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)images.add(t.image);}}if(o instanceof T.SkinnedMesh)resources.add(o.skeleton);}});
 root.removeFromParent();resources.forEach(r=>r.dispose());images.forEach(i=>i.close());
}
/** Validate actual vertices, not transformed local AABBs of rotated batched meshes. */
export function validateResidentialGalleryEquipment(source:T.Group){
 source.updateWorldMatrix(true,true);
 if(source.parent||!source.matrix.equals(new T.Matrix4())||source.children.length!==ZONES.length)throw Error('Residential root contract rejected');
 let draws=0,triangles=0,vertices=0;const materials=new Set<T.Material>();
 for(const zone of ZONES){
  const matches=source.children.filter(c=>c.name===zone.name);if(matches.length!==1)throw Error('missing or duplicate Residential root');
  const root=matches[0];let meshes=0;
  root.traverse(o=>{
   if(!(o instanceof T.Mesh)){if(!(o instanceof T.Group)&&o!==root)throw Error('unsupported Residential object');return;}
   if(o instanceof T.SkinnedMesh||o instanceof T.InstancedMesh||Array.isArray(o.material)||!(o.material instanceof T.MeshStandardMaterial)||o.material.transparent||o.material.opacity!==1||o.material.side!==T.FrontSide)throw Error('unsupported Residential material or mesh');
   if(Object.values(o.material).some(v=>v instanceof T.Texture))throw Error('Residential texture budget exceeded');
   materials.add(o.material);if(materials.size>MAX_MATERIALS)throw Error('Residential material budget exceeded');
   meshes++;draws++;if(draws>MAX_DRAWS)throw Error('Residential draw budget exceeded');
   const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
   if(!p||p.itemSize!==3||!n||n.itemSize!==3||!uv||uv.itemSize!==2||n.count!==p.count||uv.count!==p.count||Object.keys(g.morphAttributes).length)throw Error('unsupported Residential geometry');
   vertices+=p.count;triangles+=(g.index?.count??p.count)/3;
   if(vertices>MAX_VERTICES)throw Error('Residential vertex budget exceeded');
   if(!Number.isInteger(triangles)||triangles>MAX_TRIANGLES)throw Error('Residential triangle budget exceeded');
   for(const attribute of Object.values(g.attributes) as T.BufferAttribute[])for(const value of attribute.array)if(!Number.isFinite(value))throw Error('nonfinite Residential geometry');
   if(!o.matrixWorld.elements.every(Number.isFinite))throw Error('nonfinite Residential transform');
   if(g.index)for(const index of g.index.array)if(!Number.isInteger(index)||index<0||index>=p.count)throw Error('invalid Residential index');
  });
  const b=new T.Box3().setFromObject(root,true),e=1e-5;
  if(!meshes||![...b.min.toArray(),...b.max.toArray()].every(Number.isFinite)||b.min.x<zone.x/32-e||b.max.x>(zone.x+zone.w)/32+e||b.min.z<zone.z/32-e||b.max.z>(zone.z+zone.d)/32+e||Math.abs(b.min.y)>e||Math.abs(b.max.y-zone.h)>e)throw Error('Residential precise bounds rejected');
 }
 source.userData={...source.userData,draws,triangles,vertices,materials:materials.size,decodedTextureBytes:0};
}
/** Bounded single embedded GLB. Reject allocating extensions/images before decode. */
export async function loadResidentialGallerySource(signal:AbortSignal){
 const response=await fetch(import.meta.env.BASE_URL+'assets/residential-gallery/residential-gallery-equipment.glb',{signal});
 if(!response.ok)throw Error(`Residential HTTP ${response.status}`);
 if(Number(response.headers.get('content-length'))>MAX_BYTES){await response.body?.cancel();throw Error('Residential byte budget exceeded');}
 const reader=response.body?.getReader();if(!reader)throw Error('Residential missing body');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES)throw Error('Residential byte budget exceeded');chunks.push(value);}}catch(error){await reader.cancel();throw error;}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const view=new DataView(bytes.buffer);
 if(size<28||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==size||view.getUint32(16,true)!==0x4e4f534a)throw Error('invalid Residential GLB');
 const length=view.getUint32(12,true);
 if(length%4||length>size-28||view.getUint32(24+length,true)!==0x004e4942||view.getUint32(20+length,true)!==size-28-length)throw Error('invalid Residential JSON');
 const doc=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+length)));
 if((doc.materials?.length??0)>MAX_MATERIALS)throw Error('Residential material budget exceeded');
 if(doc.images?.length||doc.textures?.length)throw Error('Residential texture budget exceeded');
 if(doc.extensionsRequired?.length||doc.extensionsUsed?.length||doc.animations?.length||doc.skins?.length||doc.buffers?.length!==1||doc.buffers[0].uri||doc.buffers[0].byteLength>size-28-length)throw Error('external or unsupported Residential resources');
 // Bound graph work and accessor allocations independently of compressed/transfer size.
 if((doc.nodes?.length??0)>128||(doc.meshes?.length??0)>MAX_DRAWS||(doc.accessors?.length??0)>128)throw Error('Residential definition budget exceeded');
 // Decode only one bounded tree, rather than every scene or duplicated graph path.
 if(doc.scenes?.length!==1||(doc.scene??0)!==0||!Array.isArray(doc.scenes[0].nodes)||!Array.isArray(doc.nodes))throw Error('Residential scene contract rejected');
 const visited=new Set<number>();
 const visit=(index:number)=>{
  if(!Number.isInteger(index)||index<0||index>=doc.nodes.length||visited.has(index))throw Error('Residential graph contract rejected');
  visited.add(index);const node=doc.nodes[index];
  if(node.mesh!==undefined&&(!Number.isInteger(node.mesh)||node.mesh<0||node.mesh>=(doc.meshes?.length??0)))throw Error('Residential mesh reference rejected');
  if(node.children!==undefined&&!Array.isArray(node.children))throw Error('Residential children rejected');
  for(const child of node.children??[])visit(child);
 };
 for(const index of doc.scenes[0].nodes)visit(index);
 if(visited.size!==doc.nodes.length)throw Error('Residential unreachable nodes rejected');
 let draws=0,vertices=0,triangles=0;
 for(const accessor of doc.accessors??[])if(accessor.sparse||!Number.isInteger(accessor.count)||accessor.count<1||accessor.count>MAX_TRIANGLES*3||accessor.bufferView===undefined)throw Error('Residential accessor budget exceeded');
 for(const mesh of doc.meshes??[])for(const p of mesh.primitives??[]){
  const count=doc.accessors?.[p.attributes?.POSITION]?.count,indexCount=p.indices===undefined?count:doc.accessors?.[p.indices]?.count;
  draws++;vertices+=count;triangles+=indexCount/3;
  if(p.targets||p.mode!==undefined&&p.mode!==4||!Number.isFinite(vertices)||!Number.isInteger(triangles)||draws>MAX_DRAWS||vertices>MAX_VERTICES||triangles>MAX_TRIANGLES)throw Error('Residential geometry budget exceeded');
 }
 if(signal.aborted)throw Error('Residential cancelled');
 const scene=(await new GLTFLoader().parseAsync(bytes.buffer,'')).scene;
 if(signal.aborted){retire(scene);throw Error('Residential cancelled');}return scene;
}
export function attachResidentialGalleryEquipment(room:T.Group,onChanged:()=>void,load:(signal:AbortSignal)=>Promise<T.Group>=loadResidentialGallerySource,timeoutMs=8000){
 const controller=new AbortController();let active=true,source:T.Group|undefined,timer:ReturnType<typeof setTimeout>;
 const fallback=room.getObjectByName(FALLBACK);
 const cleanup=()=>{if(source){retire(source);source=undefined;}};
 const owner={state:'loading',error:undefined as unknown,notificationError:undefined as unknown,ready:Promise.resolve(),dispose(){if(owner.state==='disposed')return;active=false;controller.abort();clearTimeout(timer);cleanup();owner.state='disposed';}};
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Residential timeout')),timeoutMs);});
 const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('Residential cancelled')),{once:true}));
 const pending=(async()=>{const loaded=await load(controller.signal);if(!active){retire(loaded);throw Error('stale Residential source');}source=loaded;})();
 owner.ready=Promise.race([pending,timeout,cancelled]).then(()=>{
  if(!active)return;if(!fallback||fallback.parent!==room)throw Error('stale Residential fallback');
  validateResidentialGalleryEquipment(source!);
  // Exported roots already contain their final translations. No fitting or second transform.
  source!.name='residential-gallery-equipment';source!.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});
  room.add(source!);disposeModel(fallback);owner.state='ready';
 }).catch(error=>{owner.error=error;cleanup();if(active){active=false;controller.abort();owner.state='fallback';}}).then(()=>{if(owner.state==='ready')try{onChanged();}catch(error){owner.notificationError=error;}}).finally(()=>clearTimeout(timer));
 return owner;
}
