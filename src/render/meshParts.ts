import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const material=(color:number,metalness=.3,roughness=.55,emissive=0,intensity=0)=>new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:intensity});
export const MAT={
 armor:material(0xb7c1b4,.58,.39),dark:material(0x152327,.7,.42),joint:material(0x080d11,.25,.72),
 trim:material(0xc29b59,.74,.3),visor:material(0x4bf6eb,.55,.15,0x27dccd,2.5),
 shell:material(0x35453b,.38,.3),shellDark:material(0x182b29,.42,.45),flesh:material(0x765047,.1,.65),
 claw:material(0xb4c0aa,.6,.3),acid:material(0x77cb69,.28,.28,0x55a834,.7),eye:material(0xff7049,.3,.2,0xff3c10,2.8),
 purple:material(0x51445e,.58,.4),orange:material(0x876044,.6,.4),
 bone:material(0xc5b894,.14,.42),rubber:material(0x20282c,.05,.91),red:material(0xa1543c,.38,.5),copper:material(0xaa7846,.78,.31),
 steel:material(0x36464c,.78,.5),edge:material(0x52646b,.78,.36),black:material(0x0b1317,.55,.57),
 cyan:material(0x63c8c8,.4,.3,0x3fb2b6,1.8),amber:material(0xd68d39,.4,.3,0xff8734,1.6),
};
export const geometries=new Map<string,T.BufferGeometry>();
export function geometry(key:string,make:()=>T.BufferGeometry){let g=geometries.get(key);if(!g){g=make();geometries.set(key,g);}return g;}
export function box(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material,r=.045){
 const mesh=new T.Mesh(geometry(`b${w}/${h}/${d}/${r}`,()=>r?new RoundedBoxGeometry(w,h,d,1,r):new T.BoxGeometry(w,h,d)),mat);
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function ball(parent:T.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:T.Material){
 const mesh=new T.Mesh(geometry('sphere',()=>new T.SphereGeometry(1,12,8)),mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function rod(parent:T.Object3D,a:T.Vector3,b:T.Vector3,r1:number,r2:number,mat:T.Material){
 const length=a.distanceTo(b);const mesh=new T.Mesh(geometry(`c${r1}/${r2}/${length.toFixed(3)}`,()=>new T.CylinderGeometry(r1,r2,length,7)),mat);
 mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());mesh.castShadow=true;parent.add(mesh);return mesh;
}
/** Bake rigid armor into one mesh per material; joints remain independently animated. */
export function batch(group:T.Group){
 group.updateMatrixWorld(true);const buckets=new Map<T.Material,T.BufferGeometry[]>();
 for(const child of [...group.children])if(child instanceof T.Mesh){const g=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrix);const m=child.material as T.Material;const list=buckets.get(m)??[];list.push(g);buckets.set(m,list);group.remove(child);}
 for(const [m,list]of buckets){const geometry=mergeGeometries(list,false);list.forEach(g=>g.dispose());if(geometry){const mesh=new T.Mesh(geometry,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}}
}
/** A tapered chitin shell, rather than a stack of intersecting spheres. */
export function shell(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material){
 const g=geometry(`shell:${w}/${h}/${d}`,()=>{
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[],rings=8,sides=12;
  for(let row=0;row<=rings;row++){
   const v=row/rings,profile=Math.pow(Math.sin(v*Math.PI),.58),taper=1-.32*v;
   for(let col=0;col<=sides;col++){
    const a=col/sides*Math.PI*2,ridge=1+.055*Math.cos(a*4);
    vertices.push(Math.cos(a)*w*profile*taper*ridge,Math.sin(a)*h*profile+Math.sin(v*Math.PI)*h*.16,(v-.5)*d);
    uv.push(col/sides,v);
    if(row<rings&&col<sides){const i=row*(sides+1)+col,j=i+sides+1;indices.push(i,i+1,j,i+1,j+1,j);}
   }
  }
  const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(vertices,3));result.setAttribute('uv',new T.Float32BufferAttribute(uv,2));result.setIndex(indices);result.computeVertexNormals();return result;
 });
 const mesh=new T.Mesh(g,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function ring(parent:T.Object3D,x:number,y:number,z:number,r:number,t:number,mat:T.Material){
 const mesh=new T.Mesh(geometry(`ring:${r}/${t}`,()=>new T.TorusGeometry(r,t,6,16)),mat);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
export function disposeModel(root:T.Object3D){
 const shared=new Set(geometries.values()),disposed=new Set<T.BufferGeometry|T.Material|T.Skeleton>();
 const dispose=(resource:T.BufferGeometry|T.Material|T.Skeleton)=>{if(!disposed.has(resource)){disposed.add(resource);resource.dispose();}};
 root.traverse(object=>{if(object instanceof T.Mesh){if(!shared.has(object.geometry)&&!object.geometry.userData.sharedAsset)dispose(object.geometry);const materials=Array.isArray(object.material)?object.material:[object.material];for(const m of materials)if(m.userData.actorMaterial)dispose(m);if(object instanceof T.SkinnedMesh)dispose(object.skeleton);}});root.removeFromParent();
}
