import {describe,it,expect,vi} from 'vitest';
import {AudioSystem} from '../src/game/audio/AudioSystem';
import {elementalCueSamples,type ElementalCue} from '../src/game/audio/elementalCues';

describe('elemental audio',()=>{
 it.each([22050,44100,48000])('makes bounded, click-free and distinct PCM at %iHz',rate=>{
  const energies:number[]=[],crossings:number[]=[];
  for(const kind of ['freeze','shatter','reactor'] as const){
   const a=elementalCueSamples(kind,rate);expect(a).toEqual(elementalCueSamples(kind,rate));
   expect(a[0]).toBe(0);expect(a.at(-1)).toBe(0);expect(a.every(Number.isFinite)).toBe(true);
   expect(Math.max(...a.map(Math.abs))).toBeLessThan(.7);
   const energy=a.reduce((n,v)=>n+v*v,0)/a.length;energies.push(energy);expect(energy).toBeGreaterThan(.001);
   crossings.push(a.reduce((n,v,i)=>n+(i>0&&v*a[i-1]<0?1:0),0)/a.length);
  }
  // Distinct actual spectra: low reactor versus noisy crystalline impact.
  expect(crossings[2]).toBeLessThan(crossings[1]/3);expect(crossings[0]).toBeLessThan(crossings[1]);
 });
 it.each([0,NaN,Infinity,7999,192001])('rejects invalid sample rate %s',rate=>expect(()=>elementalCueSamples('freeze',rate)).toThrow());
 it('cues only new freeze onsets, permits refreeze/room reuse, and respects paused state',()=>{
  const audio=new AudioSystem(),play=vi.spyOn(audio,'playElemental').mockImplementation(()=>{});
  audio.syncFrozen([],1);audio.syncFrozen([1,2],1);audio.syncFrozen([1,2],1);audio.syncFrozen([2],1);
  expect(play).toHaveBeenCalledTimes(1);
  audio.syncFrozen([1,2],1);expect(play).toHaveBeenCalledTimes(2);
  audio.pauseAll();audio.syncFrozen([3],1);expect(play).toHaveBeenCalledTimes(2);
  audio.resumeAll();audio.syncFrozen([3],1);expect(play).toHaveBeenCalledTimes(3);
  audio.syncFrozen([3],2);expect(play).toHaveBeenCalledTimes(4);
  audio.destroy();audio.syncFrozen([4],2);expect(play).toHaveBeenCalledTimes(4);
 });
 it('caches three buffers, rate-limits bursts, and uses the existing paused voice path',()=>{
  const audio=new AudioSystem(),clock={state:'running',currentTime:0,sampleRate:48000,
   createBuffer:vi.fn((_channels:number,length:number)=>({getChannelData:()=>new Float32Array(length)}))};
  Object.assign(audio,{context:clock,effectsGain:{}});
  const play=vi.spyOn(audio as unknown as {playBuffer:(...args:unknown[])=>null},'playBuffer').mockReturnValue(null);
  for(const kind of ['freeze','shatter','reactor'] as const){audio.playElemental(kind);audio.playElemental(kind);}
  expect(play).toHaveBeenCalledTimes(3);expect(clock.createBuffer).toHaveBeenCalledTimes(3);
  clock.currentTime=1;for(const kind of ['freeze','shatter','reactor'] as ElementalCue[])audio.playElemental(kind);
  expect(play).toHaveBeenCalledTimes(6);expect(clock.createBuffer).toHaveBeenCalledTimes(3);
  audio.pauseAll();clock.currentTime=2;audio.playElemental('shatter');expect(play).toHaveBeenCalledTimes(6);
 });
});
