import * as T from 'three';
import type {EncounterPhase} from '../game/waves/EncounterDirector';

export const OVERLOAD_EMISSION_MIN=.20,OVERLOAD_EMISSION_MAX=.45;
export type OverloadVisualState=Readonly<{phase:EncounterPhase;dispatched:number;totalSpawns:number;playing:boolean}>;

/** Room-owned material only. Dispatch progress is not completion or a new timer. */
export class OverloadEmission {
 private material:T.MeshStandardMaterial|undefined;
 reset(){this.material=undefined;}
 bind(world:T.Object3D,templateId:string){
  this.reset();if(templateId!=='overload-floor')return;
  world.traverse(object=>{
   if(!(object instanceof T.Mesh))return;
   for(const material of Array.isArray(object.material)?object.material:[object.material]){
    if(material instanceof T.MeshStandardMaterial&&material.userData.overloadColumn===true&&material.userData.actorMaterial===true)this.material=material;
   }
  });
  if(this.material)this.material.emissiveIntensity=OVERLOAD_EMISSION_MIN;
 }
 update(state:OverloadVisualState|undefined,delta:number){
  if(!this.material||!state?.playing||state.phase!=='combat'||!Number.isFinite(delta)||delta<=0)return;
  if(!Number.isFinite(state.dispatched)||!Number.isFinite(state.totalSpawns)||state.totalSpawns<=0)return;
  const progress=Math.max(0,Math.min(1,state.dispatched/state.totalSpawns));
  const target=OVERLOAD_EMISSION_MIN+(OVERLOAD_EMISSION_MAX-OVERLOAD_EMISSION_MIN)*progress*progress*(3-2*progress);
  // Smooth discrete dispatch batches; the game state alone determines the target.
  const blend=1-Math.exp(-Math.min(delta,.05)*4);
  this.material.emissiveIntensity+=(target-this.material.emissiveIntensity)*blend;
 }
}
