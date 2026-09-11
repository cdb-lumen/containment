import * as T from 'three';

type Finish=Readonly<{color:number;metalness?:number;roughness?:number}>;
/** Gameplay-scale finishes, applied only to exclusively owned room materials.
 * Colours are sRGB tints; embedded albedo/ORM, UVs and status emission stay intact.
 * Keep pale medical lids subordinate to dark plant cabinets. Habitation uses
 * sage enamel, warm cloth and muted luggage rather than cryogenic white.
 */
export const PASSENGER_FINISHES:Readonly<Record<string,Finish>>={
 PV_shell:{color:0x9aafb3},
 PV_carrier:{color:0x718b97},
 PV_metal:{color:0x92a1a6},
 PV_ancillary_recess:{color:0x23333e,metalness:.25,roughness:.82},
 PV_shared_enclosure_monitor_atlas:{color:0x394b57},
 PV_ancillary_mechanism:{color:0x647780,metalness:.65,roughness:.55},
};
export const RESIDENTIAL_FINISHES:Readonly<Record<string,Finish>>={
 rg_armor:{color:0x788b83,metalness:.25,roughness:.76},
 // Reuse the original dark roof/edge finish instead of another tint experiment.
 rg_edge:{color:0x52646b,metalness:.78,roughness:.36},
 rg_rubber:{color:0x283637,metalness:0,roughness:.96},
 rg_steel:{color:0x2c3535,metalness:.78,roughness:.65},
 rg_trim:{color:0x9b855c,metalness:.6,roughness:.55},
 rg_bone:{color:0xb5ae96,metalness:0,roughness:.94},
 rg_red:{color:0x805a4f,metalness:.12,roughness:.85},
};
export function applyOwnedEquipmentPalette(root:T.Object3D,finishes:Readonly<Record<string,Finish>>){
 const seen=new Set<T.MeshStandardMaterial>();
 root.traverse(o=>{if(!(o instanceof T.Mesh))return;
  for(const material of Array.isArray(o.material)?o.material:[o.material]){
   if(!(material instanceof T.MeshStandardMaterial)||seen.has(material))continue;
   seen.add(material);const finish=finishes[material.name];if(!finish)continue;
   material.color.setHex(finish.color);
   if(finish.metalness!==undefined)material.metalness=finish.metalness;
   if(finish.roughness!==undefined)material.roughness=finish.roughness;
  }
 });
}
