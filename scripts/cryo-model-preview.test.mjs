import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {installCandidate,transformRoom} from './cryo-model-preview.mjs';

test('preview hooks replace only shell loop and local branches, not saddles or production source',async()=>{
 const source=await readFile('src/render/AuthoredRooms.ts','utf8');const changed=transformRoom(source);
 assert.equal((changed.match(/omittedShells\+\+/g)||[]).length,1);assert.equal((changed.match(/omittedBranches\+\+/g)||[]).length,1);
 assert(changed.includes('box(x,13,z+dz,64,6,14,f.dark,2);'));assert(changed.includes('pipe([x0+50,12,headerZ],[trunk,12,headerZ],2,mat);'));
 assert.equal(await readFile('src/render/AuthoredRooms.ts','utf8'),source);
 assert.throws(()=>transformRoom(''),/unique preview hook/);
});

test('actual GLB native bounds, all feet supported, actual unions connected, contained adapters',async()=>{
 const file=await readFile('public/assets/benchmark/sealed-cryo.glb');const length=file.readUInt32LE(12);const doc=JSON.parse(file.subarray(20,20+length).toString());
 const binaryOffset=20+length;const binary=file.subarray(binaryOffset+8,binaryOffset+8+file.readUInt32LE(binaryOffset));
 // Only skip texture decode for this CPU geometry test. Browser proof loads the unchanged GLB.
 doc.buffers[0].uri='data:application/octet-stream;base64,'+binary.toString('base64');delete doc.images;delete doc.textures;delete doc.samplers;doc.materials=[{}];for(const mesh of doc.meshes)for(const p of mesh.primitives)p.material=0;
 globalThis.ProgressEvent??=class ProgressEvent{constructor(type,data){Object.assign(this,{type},data);}};
 const {scene}=await new GLTFLoader().parseAsync(JSON.stringify(doc),'');const {diagnostics,model,adapters}=installCandidate(T,scene);
 assert.equal(diagnostics.feet.length,4);assert.equal(diagnostics.routes.length,2);assert.equal(model.scale.x,1);assert.equal(model.rotation.y,0);assert.equal(diagnostics.bounds.min[1],16);
 const close=(actual,expected)=>assert(Math.abs(actual-expected)<.002,`${actual} != ${expected}`);
 close(diagnostics.bounds.min[0],465.52);close(diagnostics.bounds.max[0],514.48);close(diagnostics.bounds.min[2],253.72);close(diagnostics.bounds.max[2],336.28);
 for(const {endpoint,unionBounds} of diagnostics.routes)for(let axis=0;axis<3;axis++)assert(endpoint[axis]>=unionBounds.min[axis]&&endpoint[axis]<=unionBounds.max[axis]);
 const group=new T.Group();group.add(model,adapters);assert.equal(group.children.filter(o=>o.name==='native-cryo-candidate').length,1);
 for(const radius of [16,28])for(const y of [190,440])for(let x=440;x<=840;x+=4)for(const b of [diagnostics.bounds,...diagnostics.segments])assert(Math.hypot(Math.max(b.min[0]-x,0,x-b.max[0]),Math.max(b.min[2]-y,0,y-b.max[2]))>=radius);
 console.log(JSON.stringify(diagnostics,null,2));
});
