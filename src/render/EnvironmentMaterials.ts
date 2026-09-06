import type {ShipEnvironment} from './ShipEnvironments';
import * as T from 'three';

/** Shared authored surfaces. One texture set per surface, reused by every room. */
export class EnvironmentMaterials {
 readonly textures:T.Texture[]=[];readonly ready:Promise<void>;
 readonly floor:T.MeshStandardMaterial;
 readonly wall:T.MeshStandardMaterial;
 readonly cover:T.MeshStandardMaterial;
 constructor(anisotropy:number){
  const manager=new T.LoadingManager();this.ready=new Promise(resolve=>{manager.onLoad=()=>resolve();});const loader=new T.TextureLoader(manager);
  const surface=(name:string,metalness:number)=>{
   const load=(suffix:string,color=false)=>{const t=loader.load(`${import.meta.env.BASE_URL}assets/environment/${name}_${suffix}.jpg`);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,anisotropy);if(color)t.colorSpace=T.SRGBColorSpace;this.textures.push(t);return t;};
   const map=load('diff',true),normalMap=load('nor_gl'),arm=load('arm');
   return new T.MeshStandardMaterial({map,normalMap,roughnessMap:arm,metalnessMap:arm,metalness,roughness:1,normalScale:new T.Vector2(.3,.3)});
  };
  this.floor=surface('metal_plate_02',.28);this.wall=surface('concrete',0);this.cover=surface('metal_plate',.35);
 }
 theme(act:number){this.floor.color.setHex([0xe0e9eb,0xd8eced,0xe5e5de][act]);this.wall.color.setHex([0xc9d1d5,0xc6dee0,0xc6cebe][act]);this.cover.color.setHex([0xd6cbb8,0xc4d9de,0xd0c9b7][act]);}
 shipTheme(environment:ShipEnvironment){
  const palette:Record<ShipEnvironment,[number,number,number]>={
   cryogenics:[0x829b9e,0xe0e7da,0xcad7d2],habitation:[0x8c7761,0xc3ad8d,0xb79b7d],
   security:[0x646d70,0x697b82,0x7e8b8d],cargo:[0x7a7e77,0x879397,0xa49c85],
   communications:[0x526b75,0x627b8b,0x77929a],engineering:[0x7d817a,0x9c9a87,0xa7a591],
   maintenance:[0x697b79,0x77918b,0x9b9d88],infested:[0x626e66,0x718478,0x8d8b77],
   containment:[0x75858b,0xa0afb0,0xa9b7b5],reactor:[0x4e6771,0x7a929b,0xa6b3b1],
  };
  const [floor,wall,cover]=palette[environment];this.floor.color.setHex(floor);this.wall.color.setHex(wall);this.cover.color.setHex(cover);
 }
 /** Per-face physical UVs keep tread and panel scale consistent on all dimensions. */
 uv(mesh:T.Mesh,tile=2){mapSurfaceUV(mesh,tile);}

 dispose(){this.textures.forEach(t=>t.dispose());[this.floor,this.wall,this.cover].forEach(m=>m.dispose());}
}

export function mapSurfaceUV(mesh:T.Mesh,tile=2){
  mesh.geometry=mesh.geometry.clone();mesh.geometry.userData.environmentUV=true;
  const g=mesh.geometry,uv=g.getAttribute('uv');g.computeBoundingBox();const size=g.boundingBox!.getSize(new T.Vector3());
  // Preserve the rounded-box face chart, including bevel triangles. Projecting each
  // vertex by its normal switches axes inside triangles and creates zero-area UVs.
  for(const group of g.groups){const face=group.materialIndex??0,w=face<2?size.z:size.x,h=face<2?size.y:face<4?size.z:size.y;
   const seen=new Set<number>();for(let j=group.start;j<group.start+group.count;j++){const i=g.index?g.index.getX(j):j;if(seen.has(i))continue;seen.add(i);uv.setXY(i,uv.getX(i)*w/tile,uv.getY(i)*h/tile);}}
  uv.needsUpdate=true;
 }
