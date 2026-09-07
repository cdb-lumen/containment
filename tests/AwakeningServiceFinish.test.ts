import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {createAwakeningRacks,createAwakeningEnvelope} from '../src/render/AuthoredRooms';
import {createAwakeningServiceFinish} from '../src/render/AwakeningServiceFinish';
import {AWAKENING_BLOCKOUT} from '../src/game/roguelike/authoredRoomTopologies';

describe('Awakening service covers',()=>{
 it('keeps all cover vertices within the original supply reservation and on its roof',()=>{
  const root=createAwakeningRacks(true);root.updateMatrixWorld(true);
  const mesh=root.children.find(o=>(o as T.Mesh).material instanceof T.MeshStandardMaterial&&((o as T.Mesh).material as T.Material).name==='awakening-service-enamel') as T.Mesh;
  expect(mesh).toBeDefined();const b=new T.Box3().setFromObject(mesh),p=AWAKENING_BLOCKOUT[3].footprint;
  expect(b.min.x*32).toBeGreaterThan(Math.min(...p.map(p=>p.x)));expect(b.max.x*32).toBeLessThan(Math.max(...p.map(p=>p.x)));
  expect(b.min.z*32).toBeGreaterThan(Math.min(...p.map(p=>p.y)));expect(b.max.z*32).toBeLessThan(Math.max(...p.map(p=>p.y)));
  expect(b.min.y*32).toBeCloseTo(36.2,3);expect(b.max.y*32).toBeCloseTo(36.5,3);
  const ray=new T.Raycaster(new T.Vector3(b.min.x+.3,40/32,(b.min.z+b.max.z)/2),new T.Vector3(0,-1,0));
  const hits=ray.intersectObject(root,true);expect(hits[0].object).toBe(mesh);
  // Cover bottom meets the gasket top; gasket bottom meets existing h36 roof.
  expect(hits.some(h=>Math.abs(h.point.y*32-36.2)<.01)).toBe(true);
  expect(hits.some(h=>Math.abs(h.point.y*32-36)<.01)).toBe(true);
 });
 it('retains real rear-wall face contact at half the 12.16 thickness',()=>{
  const root=createAwakeningEnvelope();root.updateMatrixWorld(true);
  const ray=new T.Raycaster(new T.Vector3(620/32,20/32,100/32),new T.Vector3(0,0,-1));
  const hits=ray.intersectObject(root,true);expect(hits.length).toBeGreaterThan(0);
  const boundary=Math.min(...AWAKENING_BLOCKOUT[3].footprint.map(p=>p.y));
  expect(boundary).toBeGreaterThan(0);
  expect(hits[0].point.z*32).toBeCloseTo(40+6.08,3);
 });
 it('owns bounded original textures and retires each exactly once with material',()=>{
  const m=createAwakeningServiceFinish(),a=m.map as T.DataTexture,r=m.roughnessMap as T.DataTexture;
  expect(a.image.width).toBe(128);expect(r.image.height).toBe(128);expect(a.colorSpace).toBe(T.SRGBColorSpace);
  expect(r.colorSpace).toBe(T.NoColorSpace);expect(m.userData.provenance).toContain('Original');
  const ad=vi.spyOn(a,'dispose'),rd=vi.spyOn(r,'dispose');m.dispose();expect(ad).toHaveBeenCalledOnce();expect(rd).toHaveBeenCalledOnce();
 });
});
