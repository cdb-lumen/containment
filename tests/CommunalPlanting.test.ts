import {it,expect} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {communalAtrium} from '../src/render/CommunalAtrium';
import {COMMUNAL_ATRIUM_BLOCKOUT} from '../src/game/roguelike/authoredRoomTopologies';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {disposeModel} from '../src/render/meshParts';

const fixture=COMMUNAL_ATRIUM_BLOCKOUT.find(f=>f.id==='corridor-garden')!;
async function donor(){const bytes=readFileSync('public/assets/communal-atrium/signature-garden.glb');return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;}
function vertices(root:T.Group,role?:string){
 root.updateMatrixWorld(true);const points:T.Vector3[]=[];
 root.traverse(o=>{if(o instanceof T.Mesh&&(!role||(o.material as T.Material).name===role)){
  const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).multiplyScalar(32);if(v.z>Math.min(...ROOM_TEMPLATES['communal-atrium'].boundary!.map(p=>p.y)))points.push(v);}
 }});return points;
}
it.each(['loaded','fallback'])('%s corridor planting has low broad foliage within the unchanged reservation',async mode=>{
 const source=mode==='loaded'?await donor():undefined;
 const root=communalAtrium(ROOM_TEMPLATES['communal-atrium'],[fixture],source);
 try{
  const foliage=vertices(root,'ca_leaf');expect(foliage.length).toBeGreaterThan(100);
  const bounds=new T.Box3().setFromPoints(foliage),all=new T.Box3().setFromPoints(vertices(root));
  expect(bounds.max.y).toBeLessThanOrEqual(40);expect(bounds.max.y).toBeGreaterThan(28);
  expect(bounds.max.x-bounds.min.x).toBeGreaterThan(12);
  expect(bounds.max.z-bounds.min.z).toBeGreaterThan(9);
  expect(all.min.x).toBeCloseTo(fixture.x,3);expect(all.max.x).toBeCloseTo(fixture.x+fixture.w,3);
  expect(all.min.z).toBeCloseTo(fixture.y,3);expect(all.max.z).toBeCloseTo(fixture.y+fixture.h,3);
  expect(all.min.y).toBeCloseTo(0,3);expect(bounds.min.y).toBeCloseTo(19,3);
 }finally{disposeModel(root);if(source)disposeModel(source);}
});
it('corridor planting is identical with the real loaded donor and fallback',async()=>{
 const source=await donor(),a=communalAtrium(ROOM_TEMPLATES['communal-atrium'],[fixture],source),b=communalAtrium(ROOM_TEMPLATES['communal-atrium'],[fixture]);
 try{expect(vertices(a).map(v=>v.toArray())).toEqual(vertices(b).map(v=>v.toArray()));}finally{disposeModel(a);disposeModel(b);disposeModel(source);}
});
