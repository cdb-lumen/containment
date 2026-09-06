import {afterEach, expect, it, vi} from 'vitest';
import {AudioSystem} from '../src/game/audio/AudioSystem';
import {AUDIO_STORAGE_KEY, loadAudioPreferences, saveAudioPreferences} from '../src/game/audio/preferences';

const store = (value: string | null) => ({getItem: vi.fn(() => value), setItem: vi.fn()});
afterEach(() => vi.unstubAllGlobals());

it('defaults to 30% and unmuted without stored preferences', () => {
  expect(loadAudioPreferences(null)).toEqual({master: .3, muted: false});
  expect(loadAudioPreferences(store(null))).toEqual({master: .3, muted: false});
});
it.each([0, .3, .73, 1])('preserves saved master %s and mute separately', master => {
  const storage = store(JSON.stringify({master, muted: true}));
  expect(loadAudioPreferences(storage)).toEqual({master, muted: true});
  expect(storage.getItem).toHaveBeenCalledWith(AUDIO_STORAGE_KEY);
});
it.each(['broken', 'null', '[]', '"loud"', '{"master":-1}', '{"master":2}', '{"master":"0"}'])('tolerates invalid storage %s', value => {
  expect(loadAudioPreferences(store(value))).toEqual({master: .3, muted: false});
});
it('validates fields independently and leaves unrelated storage alone', () => {
  expect(loadAudioPreferences(store('{"master":0.65,"muted":"false"}'))).toEqual({master: .65, muted: false});
  expect(loadAudioPreferences(store('{"master":null,"muted":true}'))).toEqual({master: .3, muted: true});
  const storage = store(null);
  saveAudioPreferences(storage, {master: 0, muted: true});
  expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(AUDIO_STORAGE_KEY, '{"master":0,"muted":true}');
});
it('keeps controls usable when storage is blocked or full', () => {
  const storage = {getItem: () => {throw new Error('blocked');}, setItem: () => {throw new Error('full');}};
  expect(loadAudioPreferences(storage)).toEqual({master: .3, muted: false});
  expect(() => saveAudioPreferences(storage, {master: .7, muted: false})).not.toThrow();
  expect(() => saveAudioPreferences(null, {master: .7, muted: false})).not.toThrow();
});
it('applies 30% by default and changes the live master gain without changing channel levels', async () => {
  const gains: {gain: {value: number; setTargetAtTime: ReturnType<typeof vi.fn>}; connect: ReturnType<typeof vi.fn>}[] = [];
  const param = () => ({value: 1, setTargetAtTime: vi.fn()});
  class Context {
    state = 'running'; currentTime = 0; destination = {};
    createGain() {const node = {gain: param(), connect: vi.fn().mockReturnThis()}; gains.push(node); return node;}
    createDynamicsCompressor() {return {threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect: vi.fn().mockReturnThis()};}
  }
  vi.stubGlobal('window', {AudioContext: Context});
  vi.stubGlobal('fetch', vi.fn(async () => ({ok: false})));
  const audio = new AudioSystem({music: .38, effects: .8});
  expect(await audio.unlock()).toBe(true);
  expect(gains[0].gain.value).toBe(.3 * .85);
  expect(gains[1].gain.value).toBe(.8);
  expect(gains[2].gain.value).toBe(.38);
  const silent = new AudioSystem({master: 0});
  expect(await silent.unlock()).toBe(true);
  expect(gains[4].gain.value).toBe(0);
  expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.3 * .85, 0, .025);
  audio.setMasterVolume(0);
  expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, .025);
  audio.setMasterVolume(.73);
  expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.73 * .85, 0, .025);
  expect(gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(.8, 0, .025);
  expect(gains[2].gain.setTargetAtTime).toHaveBeenLastCalledWith(.38, 0, .15);
});
