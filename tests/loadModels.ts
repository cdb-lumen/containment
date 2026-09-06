import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ASSET_NAMES,registerAsset} from '../src/render/assets';
/** Parse production geometry/animations in Node; texture bytes are audited separately. */
export async function loadModels(){
 for(const name of ASSET_NAMES){const buffer=readFileSync(`public/assets/models/${name}.glb`),jsonLength=buffer.readUInt32LE(12),json=JSON.parse(buffer.subarray(20,20+jsonLength).toString());
  for(const m of json.materials??[]){m.extras={...m.extras,sourceTexture:m.pbrMetallicRoughness?.baseColorTexture?.index,sourceAsset:name};if(m.pbrMetallicRoughness)delete m.pbrMetallicRoughness.baseColorTexture;delete m.normalTexture;delete m.emissiveTexture;delete m.occlusionTexture;}
  delete json.images;delete json.textures;const binary=buffer.subarray(28+jsonLength);json.buffers=[{byteLength:binary.length}];let text=JSON.stringify(json);text+=' '.repeat((4-text.length%4)%4);const encoded=Buffer.from(text),glb=Buffer.alloc(28+encoded.length+binary.length);glb.write('glTF');glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(encoded.length,12);glb.write('JSON',16);encoded.copy(glb,20);glb.writeUInt32LE(binary.length,20+encoded.length);glb.write('BIN\0',24+encoded.length);binary.copy(glb,28+encoded.length);
  const asset=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.length),'');registerAsset(name,asset);
 }
}
