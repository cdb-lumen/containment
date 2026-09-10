import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const specs=[['rg_cabin_nw',280,160,240,100,1.35],['rg_bunk_storage',280,520,120,200,1.10],['rg_cabin_ne',650,270,260,100,1.35],['rg_packing',780,570,140,150,1.20]];
function check(ok,msg){if(!ok)throw Error(msg)}
function validate(root,spec){
 const [id,x,z,w,d,h]=spec;root.updateWorldMatrix(true,true);
 const bounds=new T.Box3().setFromObject(root,true);const lo=[x/32,0,z/32],hi=[(x+w)/32,h,(z+d)/32];
 for(let i=0;i<3;i++){check(bounds.min.getComponent(i)>=lo[i]-2e-5&&bounds.max.getComponent(i)<=hi[i]+2e-5,'bounds');}
 check(Math.abs(bounds.min.y)<2e-5&&Math.abs(bounds.max.y-h)<2e-5,'height');
 let triangles=0,vertices=0,minArea=Infinity,minNormal=Infinity,maxNormal=0,minWindingDot=Infinity;const mats=new Set();
 root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;check(p&&n&&uv,'attributes');check(p.count===n.count&&p.count===uv.count,'counts');
 check(o.material.isMeshStandardMaterial&&o.material.side===T.FrontSide&&!o.material.transparent,'material');check(o.material.metalness>=0&&o.material.metalness<=1&&o.material.roughness>=0&&o.material.roughness<=1,'pbr');mats.add(o.material.name);
 for(let i=0;i<p.count;i++){check([p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i),uv.getX(i),uv.getY(i)].every(Number.isFinite),'finite');const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));check(Math.abs(l-1)<1e-4,'normal');minNormal=Math.min(minNormal,l);maxNormal=Math.max(maxNormal,l);}vertices+=p.count;
 const count=g.index?.count??p.count;check(count%3===0,'triangles');for(let i=0;i<count;i+=3){const ids=[0,1,2].map(k=>g.index?g.index.getX(i+k):i+k);check(ids.every(k=>k>=0&&k<p.count),'index');const a=new T.Vector3().fromBufferAttribute(p,ids[0]),b=new T.Vector3().fromBufferAttribute(p,ids[1]),c=new T.Vector3().fromBufferAttribute(p,ids[2]);const cross=b.sub(a).cross(c.sub(a));const area=cross.length()/2;check(area>1e-12,'degenerate');minArea=Math.min(minArea,area);cross.normalize();for(const k of ids){const dot=cross.dot(new T.Vector3().fromBufferAttribute(n,k));check(dot>0,'winding');minWindingDot=Math.min(minWindingDot,dot);}triangles++;}});
 return {id,bounds_gltf:[bounds.min.toArray(),bounds.max.toArray()],triangles,vertices,materials:[...mats],minArea,minNormal,maxNormal,minWindingDot};
}

async function load(){const raw=readFileSync('public/assets/residential-gallery/residential-gallery-equipment.glb');expect(raw.length).toBeLessThan(1024*1024);return (await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'')).scene;}
describe('Residential Gallery authored equipment',()=>{
 it('imports exactly four filled reservations within the frozen height and resource budgets',async()=>{
 const scene=await load();expect(scene.children.map(o=>o.name).sort()).toEqual(specs.map(s=>s[0]).sort());
 const rows=specs.map(spec=>validate(scene.getObjectByName(spec[0]),spec));
 expect(rows.reduce((sum,r)=>sum+r.triangles,0)).toBeLessThanOrEqual(16000);
 expect(rows.every(r=>r.triangles>0)).toBe(true);
 const materials=new Set(),meshes=[];scene.traverse(o=>{if(!o.isMesh)return;meshes.push(o);materials.add(o.material);for(const v of Object.values(o.material))expect(v instanceof T.Texture).toBe(false);});
 expect(materials.size).toBeLessThanOrEqual(8);expect(meshes.length).toBeLessThanOrEqual(32);
 });
 for(const spec of specs)it('rejects bounds, normal, winding and degenerate corruption in '+spec[0],async()=>{
 const scene=await load(),root=scene.getObjectByName(spec[0]),mesh=root.children.find(o=>o.isMesh);
 const x=root.position.x;root.position.x+=20;expect(()=>validate(root,spec)).toThrow('bounds');root.position.x=x;
 const n=mesh.geometry.attributes.normal,old=[n.getX(0),n.getY(0),n.getZ(0)];n.setXYZ(0,0,0,0);expect(()=>validate(root,spec)).toThrow('normal');n.setXYZ(0,...old);
 const idx=mesh.geometry.index,a=idx.getX(0),b=idx.getX(1);idx.setX(0,b);expect(()=>validate(root,spec)).toThrow('degenerate');idx.setX(0,a);
 idx.setX(0,b);idx.setX(1,a);expect(()=>validate(root,spec)).toThrow('winding');idx.setX(0,a);idx.setX(1,b);
 const side=mesh.material.side;mesh.material.side=T.DoubleSide;expect(()=>validate(root,spec)).toThrow('material');mesh.material.side=side;
 validate(root,spec);
 });
});
