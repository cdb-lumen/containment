import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {attachPassengerExemplar} from './PassengerExemplar';
import {authoredRoom} from './AuthoredRooms';
import {DepthRenderer} from './DepthRenderer';
import {ROOM_TEMPLATES as AUTHORED_ROOM_TOPOLOGIES} from '../game/roguelike/roomTemplates';
function fixture(){const room=new T.Group(),fallback=new T.Group();fallback.name='passenger-exemplar-fallback';room.add(fallback);return {room,fallback};}
function source(){const s=new T.Group();s.add(new T.Mesh(new T.BoxGeometry(.5,.5,.5),new T.MeshStandardMaterial()));return s;}

describe('Passenger Vault single exemplar',()=>{
 it('isolates exactly one original upper pod for atomic replacement',()=>{
  const room=authoredRoom('passenger-vault',AUTHORED_ROOM_TOPOLOGIES['passenger-vault']!)!;
  const targets=room.children.filter(o=>o.name==='passenger-exemplar-fallback');
  expect(targets).toHaveLength(1);
 });
 it('uses the existing frozen-canvas loading gate for the exemplar',()=>{
  const get=Object.getOwnPropertyDescriptor(DepthRenderer.prototype,'roomLoading')!.get!;
  for(const state of ['loading','ready','fallback'])expect(!!get.call({passengerExemplar:{state}})).toBe(state==='loading');
 });
 it('loads the actual GLB once at native scale and preserves unrelated room children',async()=>{
  const bytes=readFileSync('public/assets/passenger-vault/exemplar.glb'),loader=new GLTFLoader();
  loader.register(()=>({name:'geometry-only-test',loadTexture:async()=>new T.Texture()}));
  const s=(await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
  const {room,fallback}=fixture(),neighbour=new T.Group();room.add(neighbour);
  const owner=attachPassengerExemplar(room,vi.fn(),async()=>s);await owner.ready;
  expect(owner.error).toBeUndefined();expect(owner.state).toBe('ready');expect(fallback.parent).toBeNull();expect(neighbour.parent).toBe(room);
  expect(s.position.toArray()).toEqual([433.6/32,0,300.48/32]);expect(s.scale.toArray()).toEqual([1,1,1]);owner.dispose();
 });
 it('keeps the complete fallback after HTTP404',async()=>{
  const {room,fallback}=fixture(),fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('',{status:404}));
  try{const owner=attachPassengerExemplar(room,vi.fn());await owner.ready;expect(owner.state).toBe('fallback');expect(fallback.parent).toBe(room);owner.dispose();}finally{fetcher.mockRestore();}
 });
 it('times out, disposes ignored-abort late resources once and permits reentry',async()=>{
  vi.useFakeTimers();try{
   const {room,fallback}=fixture();let resolve!:(s:T.Group)=>void;
   const owner=attachPassengerExemplar(room,vi.fn(),()=>new Promise(r=>resolve=r),20);
   await vi.advanceTimersByTimeAsync(21);await owner.ready;expect(owner.state).toBe('fallback');expect(fallback.parent).toBe(room);
   const s=source(),mesh=s.children[0] as T.Mesh,spy=vi.spyOn(mesh.geometry,'dispose');resolve(s);await Promise.resolve();await Promise.resolve();expect(spy).toHaveBeenCalledTimes(1);
   const next=attachPassengerExemplar(room,vi.fn(),async()=>source());await next.ready;expect(next.state).toBe('ready');owner.dispose();expect(next.state).toBe('ready');next.dispose();
  }finally{vi.useRealTimers();}
 });
 it('settles cancellation even if decoding ignores abort, without touching the fallback',async()=>{
  const {room,fallback}=fixture(),owner=attachPassengerExemplar(room,vi.fn(),()=>new Promise(()=>{}));owner.dispose();await owner.ready;expect(owner.state).toBe('disposed');expect(fallback.parent).toBe(room);
 });
 it('retires shared resources exactly once and contains observer errors',async()=>{
  const {room}=fixture(),s=source(),mesh=s.children[0] as T.Mesh,m=mesh.material as T.MeshStandardMaterial,map=new T.Texture();m.map=map;m.roughnessMap=map;s.add(new T.Mesh(mesh.geometry,m));
  const spies=[vi.spyOn(mesh.geometry,'dispose'),vi.spyOn(m,'dispose'),vi.spyOn(map,'dispose')];
  const owner=attachPassengerExemplar(room,()=>{throw Error('observer');},async()=>s);await owner.ready;expect(owner.state).toBe('ready');expect(owner.notificationError).toBeInstanceOf(Error);owner.dispose();owner.dispose();for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
 it('rejects oversized geometry without removing the original pod',async()=>{
  const {room,fallback}=fixture(),s=source();s.scale.setScalar(20);const owner=attachPassengerExemplar(room,vi.fn(),async()=>s);await owner.ready;expect(owner.state).toBe('fallback');expect(fallback.parent).toBe(room);owner.dispose();
 });
});
