import {describe,expect,it,vi} from 'vitest';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {generateRun} from '../src/game/roguelike/run';

const node=generateRun(1729,3).nodes[0];
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done;});return {promise,resolve};}

// Stop at the first scene mutation; no GPU or authored asset stubs are needed.
function fixture(owners:Record<string,{ready:Promise<void>}>){
 const started=new Error('prewarm reached');
 const add=vi.fn(()=>{throw started;});
 const renderer=Object.assign(Object.create(DepthRenderer.prototype),{
  loadRoom:vi.fn(),surfaces:{ready:Promise.resolve()},scene:{add},...owners,
 }) as DepthRenderer;
 const prepare=renderer.prepare(node).catch(error=>{expect(error).toBe(started);});
 return {add,prepare};
}

describe('room preparation before GPU warmup',()=>{
 it.each(['sealedBank','releasedBerth','recoveryKit'])('waits for %s image decoding before warming the scene',async owner=>{
  const ready=deferred(),{add,prepare}=fixture({[owner]:{ready:ready.promise}});
  await Promise.resolve();await Promise.resolve();
  const startedEarly=add.mock.calls.length;
  ready.resolve();await prepare;
  expect(startedEarly).toBe(0);
  expect(add).toHaveBeenCalledTimes(1);
 });
 it('waits for every awakening owner rather than the first one to settle',async()=>{
  const bank=deferred(),berth=deferred(),kit=deferred();
  const {add,prepare}=fixture({sealedBank:{ready:bank.promise},releasedBerth:{ready:berth.promise},recoveryKit:{ready:kit.promise}});
  bank.resolve();berth.resolve();await Promise.resolve();await Promise.resolve();
  const startedEarly=add.mock.calls.length;
  kit.resolve();await prepare;
  expect(startedEarly).toBe(0);expect(add).toHaveBeenCalledTimes(1);
 });
 it('does not block rooms without optional awakening owners',async()=>{
  const {add,prepare}=fixture({});await prepare;expect(add).toHaveBeenCalledTimes(1);
 });
});
