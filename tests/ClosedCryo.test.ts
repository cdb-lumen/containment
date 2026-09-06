import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import * as T from 'three';
import {authoredRoom} from '../src/render/AuthoredRooms';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';

it('exports sealed chambers without hidden passengers and within the mesh budget',()=>{
 const bytes=readFileSync('public/assets/environment/cryo-review.glb');
 const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 const names=gltf.materials.map((m:{name:string})=>m.name);
 expect(names).not.toContain('cryo-passenger');expect(names).not.toContain('cryo-suit');expect(names).not.toContain('cryo-berth');
 expect(names).toEqual(expect.arrayContaining(['cryo-ceramic','cryo-seal','cryo-status']));
 expect(gltf.nodes.flatMap((n:{extras?:{components?:string[]}})=>n.extras?.components??[])).toContain('Sealed pressure lid');
 const triangles=gltf.meshes.flatMap((m:{primitives:{indices:number}[]})=>m.primitives).reduce((sum:number,p:{indices:number})=>sum+gltf.accessors[p.indices].count/3,0);
 expect(triangles).toBeLessThan(3500);
});
it('keeps the optional-asset fallback sealed too',()=>{
 const room=authoredRoom('passenger-vault',ROOM_TEMPLATES['passenger-vault'],undefined)!;
 let spheres=0;room.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;if(m.color?.getHex()===0xb5a48e||m.color?.getHex()===0x53646b)spheres++;}});
 expect(spheres).toBe(0);
});
