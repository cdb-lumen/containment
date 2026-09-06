import {it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom,AUTHORED_ROOMS} from '../src/render/AuthoredRooms';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {disposeModel} from '../src/render/meshParts';
it.each(AUTHORED_ROOMS)('keeps authored deck relief dry and environmental grounding unlit in %s',id=>{
 const root=authoredRoom(id,ROOM_TEMPLATES[id])!;const meshes=root.children.filter(o=>o instanceof T.Mesh) as T.Mesh[];
 const deck=meshes.find(o=>o.material instanceof T.MeshStandardMaterial&&o.material.name==='painted-steel-deck')!.material as T.MeshStandardMaterial;
 expect(deck.normalMap).toBeInstanceOf(T.DataTexture);expect(deck.roughness).toBeGreaterThan(.8);
 expect(deck.normalScale.x).toBeGreaterThan(.2);expect(deck.normalScale.x).toBeLessThan(1);
 const contact=meshes.find(o=>(o.material as T.Material).name==='environment-contact');expect(contact).toBeDefined();
 expect(contact!.material).toBeInstanceOf(T.MeshBasicMaterial);expect(contact!.castShadow).toBe(false);expect((contact!.material as T.Material).depthWrite).toBe(false);
 disposeModel(root);
});
it('builds lit recessed shaft liners and ribs below deck',()=>{
 const root=authoredRoom('passenger-vault',ROOM_TEMPLATES['passenger-vault'])!;
 const liner=root.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name==='shaft-liner') as T.Mesh;
 expect(liner).toBeDefined();const m=liner.material as T.MeshStandardMaterial;
 expect(m.emissiveIntensity).toBeGreaterThan(.1);expect(m.emissiveIntensity).toBeLessThan(.4);
 liner.geometry.computeBoundingBox();expect(liner.geometry.boundingBox!.min.y).toBeLessThan(-3);expect(liner.geometry.boundingBox!.max.y).toBeLessThan(0);
 disposeModel(root);
});
