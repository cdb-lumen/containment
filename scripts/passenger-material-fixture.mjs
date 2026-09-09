// CPU contract for an isolated presentation build, never a runtime owner.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
export const families=['chamber','row-carrier','distribution-north','distribution-south','monitor-north','monitor-south','service-finish'];
export function geometryBatchKey(geometry){
 return JSON.stringify([!!geometry.index,Object.entries(geometry.attributes).sort(([a],[b])=>a.localeCompare(b)).map(([name,a])=>[name,a.itemSize,a.normalized,a.array.constructor.name])]);
}
export const assetVariants=Object.fromEntries(['before','budget'].map(stage=>[stage,Object.fromEntries(families.map(family=>[family,'public/assets/passenger-vault/'+(stage==='budget'?'material-budget/':families.indexOf(family)<2?'materials/wear-':'')+family+'.glb']))]));
export const placements=[];
for(const [x,z,angle] of [[420,300,0],[780,300,0],[420,580,Math.PI],[780,580,Math.PI]]){
 placements.push({family:'row-carrier',x,z,angle,dx:0,dz:0});
 for(const dx of [-2.34375,-.78125,.78125,2.34375])placements.push({family:'chamber',x,z,angle,dx,dz:.25});
}
for(const [family,x,z,angle] of [['distribution-north',600,80,0],['distribution-south',600,800,Math.PI],['monitor-north',1100,280,0],['monitor-south',1100,600,0],['service-finish',0,0,0]])placements.push({family,x,z,angle,dx:0,dz:0});
export function transformAuthored(code){
 const needle='for(const [i,role] of PASSENGER_BLOCKOUT.entries()){';
 const feeds='for(const x of [420,780])for(const [y,length] of [[184,128],[696,128]])box(x,.08,y,3,.16,length,f.seam);';
 for(const token of [needle,feeds])assert.equal(code.split(token).length,2,'Fixture source contract drift');
 return code.replace(needle,needle+'\n continue; // temporary seven-family fixture owns equipment').replace(feeds,'// temporary imported flush kit owns feed markings');
}
export async function reserveOutput(argument){
 assert.ok(argument,'An explicit fresh evidence directory is required');
 const out=resolve(argument);await mkdir(dirname(out),{recursive:true});
 await mkdir(out); // EEXIST is intentional, including an empty prior destination.
 return out;
}
