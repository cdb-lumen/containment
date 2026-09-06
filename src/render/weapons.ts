import * as T from 'three';
import {instantiateAsset} from './assets';
import type {WeaponId} from '../game/combat/types';
export type GunModel={root:T.Group;muzzle:T.Object3D;slide:T.Group;id:WeaponId};
export const WEAPON_APPEARANCE:Record<WeaponId,{recoil:number;color:number}>={
 pistol:{recoil:.075,color:0xffdfab},rifle:{recoil:.06,color:0xffcc7f},
 shotgun:{recoil:.12,color:0xffb968},plasma:{recoil:.045,color:0x69ecff},rocket:{recoil:.10,color:0xffad59},
};
export const WEAPON_FIT:Record<WeaponId,{scale:number;aimYaw:number}>={pistol:{scale:.65146,aimYaw:-5.69},rifle:{scale:.60640,aimYaw:2.99},shotgun:{scale:.65039,aimYaw:7.62},plasma:{scale:.84341,aimYaw:2.53},rocket:{scale:.84286,aimYaw:3.70}};
export function weaponModel(id:WeaponId):GunModel{
 const asset=instantiateAsset(id),root=new T.Group(),slide=new T.Group();root.name=`weapon-${id}`;root.add(slide);slide.add(asset.root);asset.root.scale.multiplyScalar(WEAPON_FIT[id].scale);
 const muzzle=asset.root.getObjectByName('muzzle');if(!muzzle)throw new Error(`Missing muzzle socket: ${id}`);
 return{root,slide,muzzle,id};
}
