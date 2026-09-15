import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {RoomTemplate} from '../game/roguelike/types';
import {communalAtrium} from './CommunalAtrium';
import {disposeModel} from './meshParts';

const MAX_BYTES=128*1024;
const PARTS=new Map<string,string>([['bed_support','ca_support'],['soil','ca_soil'],...Array.from({length:2},(_,i)=>[`rim_end_${i}`,'ca_ceramic']),...Array.from({length:4},(_,i)=>[`rim_long_${Math.floor(i/2)}_${i%2}`,'ca_ceramic']),...Array.from({length:3},(_,t)=>[[`tree${t}_trunk`,'ca_irrigation'],...Array.from({length:[2,3,2][t]},(_,j)=>[`tree${t}_branch${j}`,'ca_irrigation']),...Array.from({length:[2,3,2][t]},(_,j)=>[`tree${t}_crown${j}`,'ca_leaf'])]).flat()] as [string,string][]);
/** Decoded donors are exclusive and texture-free. Room finishes remain separately owned. */
function retire(source:T.Group){const resources=new Set<T.BufferGeometry|T.Material>();source.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])resources.add(m);}});source.removeFromParent();resources.forEach(r=>r.dispose());}
export function validateCommunalGarden(source:T.Group){
 source.updateWorldMatrix(true,true);if(source.parent||!source.matrix.equals(new T.Matrix4()))throw Error('garden root rejected');
 const found=new Set<string>(),materials=new Set<T.Material>();let vertices=0,triangles=0;
 source.traverse(o=>{
  if(!(o instanceof T.Mesh)){if(!(o instanceof T.Group))throw Error('garden object rejected');return;}
  if(found.has(o.name)||!PARTS.has(o.name))throw Error('garden inventory rejected');found.add(o.name);
  const m=o.material;if(o instanceof T.SkinnedMesh||o instanceof T.InstancedMesh||Array.isArray(m)||!(m instanceof T.MeshStandardMaterial)||m.name!==PARTS.get(o.name)||m.transparent||m.opacity!==1||m.side!==(m.name==='ca_leaf'?T.DoubleSide:T.FrontSide)||Object.values(m).some(v=>v instanceof T.Texture))throw Error('garden donor rejected');
  materials.add(m);const g=o.geometry,p=g.attributes.position,n=g.attributes.normal;
  if(!p||p.itemSize!==3||!n||n.itemSize!==3||n.count!==p.count||Object.keys(g.morphAttributes).length)throw Error('garden attributes rejected');
  vertices+=p.count;triangles+=(g.index?.count??p.count)/3;
  if(vertices>4000||!Number.isInteger(triangles)||triangles>1500)throw Error('garden geometry budget');
  for(const a of Object.values(g.attributes) as T.BufferAttribute[])for(const value of a.array)if(!Number.isFinite(value))throw Error('garden nonfinite attribute');
  for(let i=0;i<n.count;i++){const length=new T.Vector3().fromBufferAttribute(n,i).length();if(length<.99||length>1.01)throw Error('garden normal rejected');}
  if(g.index)for(const index of g.index.array)if(index>=p.count||index<0||!Number.isInteger(index))throw Error('garden index rejected');
  if(!o.matrixWorld.elements.every(Number.isFinite))throw Error('garden transform rejected');
 });
 if(found.size!==PARTS.size||materials.size!==5)throw Error('garden incomplete');
 const b=new T.Box3().setFromObject(source,true),e=1e-5;
 if(![...b.min.toArray(),...b.max.toArray()].every(Number.isFinite)||Math.abs(b.min.y)>e||b.max.y>93.909111/32+e||b.min.x< -72/32-e||b.max.x>72/32+e||b.min.z< -1-e||b.max.z>1+e)throw Error('garden bounds rejected');
}
/** Same bounded, single-scene protocol as ResidentialGalleryEquipment. */
export async function loadCommunalGarden(signal:AbortSignal){
 const response=await fetch(import.meta.env.BASE_URL+'assets/communal-atrium/signature-garden.glb',{signal});
 if(!response.ok)throw Error(`garden HTTP ${response.status}`);
 if(Number(response.headers.get('content-length'))>MAX_BYTES){await response.body?.cancel();throw Error('garden byte budget');}
 const reader=response.body?.getReader();if(!reader)throw Error('garden missing body');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES)throw Error('garden byte budget');chunks.push(value);}}catch(error){await reader.cancel();throw error;}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 const v=new DataView(bytes.buffer);
 if(size<28||v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==size||v.getUint32(16,true)!==0x4e4f534a)throw Error('garden GLB rejected');
 const length=v.getUint32(12,true);
 if(length%4||length>size-28||v.getUint32(24+length,true)!==0x004e4942||v.getUint32(20+length,true)!==size-28-length)throw Error('garden chunks rejected');
 const doc=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+length)));
 if(doc.images?.length||doc.textures?.length||doc.extensionsRequired?.length||doc.extensionsUsed?.length||doc.animations?.length||doc.skins?.length||doc.buffers?.length!==1||doc.buffers[0].uri||doc.buffers[0].byteLength>size-28-length)throw Error('garden resources rejected');
 if(doc.materials?.length!==5||doc.nodes?.length!==PARTS.size||doc.meshes?.length!==PARTS.size||doc.accessors?.length>128||doc.scenes?.length!==1||(doc.scene??0)!==0||!Array.isArray(doc.scenes[0].nodes))throw Error('garden definitions rejected');
 const visited=new Set<number>();
 const visit=(index:number)=>{if(!Number.isInteger(index)||index<0||index>=doc.nodes.length||visited.has(index))throw Error('garden graph rejected');visited.add(index);const n=doc.nodes[index];if(n.mesh!==undefined&&(!Number.isInteger(n.mesh)||n.mesh<0||n.mesh>=doc.meshes.length))throw Error('garden mesh reference');if(n.children!==undefined&&!Array.isArray(n.children))throw Error('garden children rejected');for(const child of n.children??[])visit(child);};
 for(const i of doc.scenes[0].nodes)visit(i);if(visited.size!==doc.nodes.length)throw Error('garden unreachable nodes');
 for(const a of doc.accessors??[])if(a.sparse||!Number.isInteger(a.count)||a.count<1||a.count>4500||a.bufferView===undefined)throw Error('garden accessor budget');
 let draws=0,vertices=0,triangles=0;
 for(const mesh of doc.meshes)for(const p of mesh.primitives??[]){const count=doc.accessors?.[p.attributes?.POSITION]?.count,indexCount=p.indices===undefined?count:doc.accessors?.[p.indices]?.count;draws++;vertices+=count;triangles+=indexCount/3;if(p.targets||p.mode!==undefined&&p.mode!==4||!Number.isFinite(vertices)||!Number.isInteger(triangles)||draws>PARTS.size||vertices>4000||triangles>1500)throw Error('garden decode budget');}
 if(signal.aborted)throw Error('garden cancelled');const source=(await new GLTFLoader().parseAsync(bytes.buffer,'')).scene;
 if(signal.aborted){retire(source);throw Error('garden cancelled');}return source;
}
export function attachCommunalGarden(room:T.Group,t:RoomTemplate,onChanged:()=>void,load:(signal:AbortSignal)=>Promise<T.Group>=loadCommunalGarden,timeoutMs=8000){
 const controller=new AbortController();let active=true,source:T.Group|undefined,built:T.Group|undefined,timer:ReturnType<typeof setTimeout>;
 const fallback=room.getObjectByName('communal-atrium-rough');
 const cleanup=()=>{if(source){retire(source);source=undefined;}if(built){disposeModel(built);built=undefined;}};
 const owner={state:'loading',error:undefined as unknown,notificationError:undefined as unknown,ready:Promise.resolve(),dispose(){if(owner.state==='disposed')return;active=false;controller.abort();clearTimeout(timer);cleanup();owner.state='disposed';}};
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('garden timeout')),timeoutMs);});
 const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('garden cancelled')),{once:true}));
 const pending=(async()=>{const loaded=await load(controller.signal);if(!active){retire(loaded);throw Error('stale garden');}source=loaded;})();
 owner.ready=Promise.race([pending,timeout,cancelled]).then(()=>{
  if(!active)return;if(!fallback||fallback.parent!==room)throw Error('stale garden fallback');validateCommunalGarden(source!);
  // Rebuild the same ordinary assemblies to retain shared finish identity and
  // batching across garden and furniture, with no second material lifetime.
  built=communalAtrium(t,undefined,source);built.name='communal-atrium-authored';
  retire(source!);source=undefined;room.add(built);disposeModel(fallback);owner.state='ready';
 }).catch(error=>{owner.error=error;cleanup();if(active){active=false;controller.abort();owner.state='fallback';}}).then(()=>{if(owner.state==='ready')try{onChanged();}catch(error){owner.notificationError=error;}}).finally(()=>clearTimeout(timer));
 return owner;
}
