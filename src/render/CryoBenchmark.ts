import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
let template:T.Group|undefined;
let pending:Promise<void>|undefined;
/** Optional art has a bounded wait. Late transfers cannot populate the cache. */
export async function prepareCryoBenchmark(id:string){
 if(id!=='passenger-vault'||template)return;
 if(!pending){
  pending=new Promise<void>(resolve=>{
   let active=true;
   const finish=()=>{if(!active)return;active=false;clearTimeout(timer);resolve();};
   const timer=setTimeout(finish,5000);
   void new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/environment/cryo-review.glb`).then(asset=>{
    if(active){template=asset.scene;template.updateMatrixWorld(true);}
    finish();
   }).catch(finish);
  }).finally(()=>{pending=undefined;});
 }
 await pending;
}
export function cryoBenchmarkTemplate(){return template;}
