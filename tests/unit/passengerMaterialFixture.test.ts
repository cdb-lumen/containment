import {describe,it,expect} from 'vitest';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

describe('nonintegrated seven-family material fixture',()=>{
 it('keeps incompatible geometry attributes in separate material batches',async()=>{
  const {geometryBatchKey}=await import('../../scripts/passenger-material-fixture.mjs');
  const {BoxGeometry}=await import('three');
  const a=new BoxGeometry(),b=a.clone();b.deleteAttribute('uv');
  expect(geometryBatchKey(a)).not.toBe(geometryBatchKey(b));
  expect(geometryBatchKey(a)).toBe(geometryBatchKey(a.clone()));
  expect(geometryBatchKey(a)).not.toBe(geometryBatchKey(a.toNonIndexed()));
 });
 it('loads all seven actual candidate files and the matched pre-budget package',async()=>{
  const {assetVariants,placements}=await import('../../scripts/passenger-material-fixture.mjs');
  const expected=['chamber','row-carrier','distribution-north','distribution-south','monitor-north','monitor-south','service-finish'];
  expect(Object.keys(assetVariants.budget)).toEqual(expected);
  expect(Object.keys(assetVariants.before)).toEqual(expected);
  for(const family of expected){
   expect(assetVariants.budget[family]).toBe(`public/assets/passenger-vault/material-budget/${family}.glb`);
   expect((await readFile(assetVariants.budget[family])).subarray(0,4).toString()).toBe('glTF');
   expect(placements.filter(p=>p.family===family)).toHaveLength(family==='chamber'?16:family==='row-carrier'?4:1);
  }
  expect(placements).toHaveLength(25);
  expect(placements.find(p=>p.family==='distribution-south')).toMatchObject({x:600,z:800,angle:Math.PI});
  expect(placements.find(p=>p.family==='service-finish')).toMatchObject({x:0,z:0,angle:0});
 });
 it('replaces only reserved equipment and temporary feed annotations',async()=>{
  const {transformAuthored}=await import('../../scripts/passenger-material-fixture.mjs');
  const source=await readFile('src/render/AuthoredRooms.ts','utf8');
  const result=transformAuthored(source);
  expect(result).toContain('continue; // temporary seven-family fixture owns equipment');
  expect(result).not.toContain('for(const x of [420,780])for(const [y,length]');
  expect(result).toContain('box(600,24,34,1132,48,12,f.paint)');
  expect(()=>transformAuthored('wrong source')).toThrow();
 });
 it('refuses absent and existing evidence destinations without modifying them',async()=>{
  const {reserveOutput}=await import('../../scripts/passenger-material-fixture.mjs');
  const root=await mkdtemp(join(tmpdir(),'pv-fixture-'));
  try{
   await expect(reserveOutput(undefined)).rejects.toThrow();
   const out=join(root,'fresh');await reserveOutput(out);
   await expect(reserveOutput(out)).rejects.toThrow();
  }finally{await rm(root,{recursive:true,force:true});}
 });
});
