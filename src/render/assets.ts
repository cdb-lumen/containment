import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
export const ASSET_NAMES=['marine','dretch','basilisk','marauder','dragoon','tyrant','pistol','rifle','shotgun','plasma','rocket'] as const;
export type AssetName=typeof ASSET_NAMES[number];
const templates=new Map<AssetName,GLTF>();
export function registerAsset(name:AssetName,asset:GLTF){
 asset.scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.userData.sharedAsset=true;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)if(m instanceof T.MeshStandardMaterial){for(const map of [m.map,m.normalMap])if(map)map.anisotropy=4;}}});
 templates.set(name,asset);
}
export async function preloadAssets(progress:(fraction:number)=>void=()=>{}){
 const loader=new GLTFLoader();let completed=0;
 // Four concurrent transfers keep startup responsive on mobile connections.
 const queue=[...ASSET_NAMES];await Promise.all(Array.from({length:4},async()=>{while(queue.length){const name=queue.shift()!;if(!templates.has(name))registerAsset(name,await loader.loadAsync(`${import.meta.env.BASE_URL}assets/models/${name}.glb`));progress(++completed/ASSET_NAMES.length);}}));
}
export function instantiateAsset(name:AssetName){
 const asset=templates.get(name);if(!asset)throw new Error(`Asset ${name} was not loaded`);
 const root=clone(asset.scene);const materials:T.MeshStandardMaterial[]=[],materialCopies=new Map<T.Material,T.Material>(),skeletons:T.Skeleton[]=[];
 root.traverse(o=>{if(o instanceof T.Mesh){
  const copy=(m:T.Material)=>{let c=materialCopies.get(m);if(!c){c=m.clone();c.userData.actorMaterial=true;materialCopies.set(m,c);if(c instanceof T.MeshStandardMaterial)materials.push(c);}return c;};
  o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);
  if(o instanceof T.SkinnedMesh){const own=o.skeleton,shared=skeletons.find(s=>s.bones.length===own.bones.length&&s.bones.every((b,i)=>b===own.bones[i]&&s.boneInverses[i].equals(own.boneInverses[i])));if(shared)o.skeleton=shared;else skeletons.push(own);}
 }});
 return{root,clips:asset.animations,materials};
}
