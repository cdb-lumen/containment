import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
let template:T.Group|undefined;
let pending:Promise<void>|undefined;
/** Optional room-local art: failed transfers retain the existing procedural pods. */
export async function prepareCryoBenchmark(id:string){
 if(id!=='passenger-vault'||template)return;
 pending??=new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/environment/cryo-review.glb`).then(asset=>{
  template=asset.scene;template.updateMatrixWorld(true);
 }).catch(()=>{pending=undefined;});
 await pending;
}
export function cryoBenchmarkTemplate(){return template;}
