import { describe, expect, it } from 'vitest';

import { TEXTURE_KEYS } from '../../src/game/art/createTextures';
import {
  BLOOD_DECALS,
  BLOOD_DECAL_FRAME_NAMES,
  CORPSE_FAMILIES,
  applyToAvailableBloodDecals,
  bloodDecalLoadDescriptor,
  resolveBloodDecal,
  resolveCorpseSource,
} from '../../src/game/art/deathVisualAssets';

const IDS = ['marine', 'crawler', 'brute', 'spitter', 'stalker', 'carrier', 'queen'] as const;
const FRAME_NAMES = [
  'human-small', 'human-medium', 'human-large', 'human-streak',
  'alien-small', 'alien-medium', 'alien-large', 'alien-streak',
  'acid-small', 'acid-medium', 'acid-large', 'acid-scorch',
] as const;

describe('corpse visual assets', () => {
  it('maps every character death frame and blood family', () => {
    expect(Object.keys(CORPSE_FAMILIES)).toEqual(IDS);
    expect(IDS.map((id) => CORPSE_FAMILIES[id].frame)).toEqual(IDS.map(() => 6));
    expect(IDS.map((id) => CORPSE_FAMILIES[id].bloodGroup)).toEqual([
      'human', 'alien', 'alien', 'acid', 'alien', 'alien', 'acid',
    ]);
    expect(CORPSE_FAMILIES.queen.major).toBe(true);
    expect(IDS.filter((id) => id !== 'queen').every((id) => !CORPSE_FAMILIES[id].major)).toBe(true);
  });

  it('resolves authored death frames or procedural textures and promotes elites to major', () => {
    expect(resolveCorpseSource((key) => key === 'skin-crawler', 'crawler')).toMatchObject({
      texture: 'skin-crawler', framed: true, frame: 6, bloodGroup: 'alien', major: false,
    });
    expect(resolveCorpseSource(() => false, 'spitter', true)).toMatchObject({
      texture: TEXTURE_KEYS.alienSpitter, framed: false, frame: undefined,
      bloodGroup: 'acid', major: true,
    });
  });

  it('is deeply frozen including display sizes', () => {
    expect(Object.isFrozen(CORPSE_FAMILIES)).toBe(true);
    for (const family of Object.values(CORPSE_FAMILIES)) {
      expect(Object.isFrozen(family)).toBe(true);
      expect(Object.isFrozen(family.displaySize)).toBe(true);
    }
  });
});

describe('blood decal assets', () => {
  it('defines twelve contiguous named frames in exact family order', () => {
    expect(BLOOD_DECAL_FRAME_NAMES).toEqual(FRAME_NAMES);
    expect(BLOOD_DECALS.frames).toEqual(Object.fromEntries(FRAME_NAMES.map((name, index) => [name, index])));
    expect(Object.values(BLOOD_DECALS.frames)).toEqual([...Array(12).keys()]);
    expect(bloodDecalLoadDescriptor()).toEqual({
      key: 'blood-decals', url: 'assets/effects/blood-decals-sheet.png', frameWidth: 64, frameHeight: 64,
    });
  });

  it('resolves authored frames by group and family or the procedural fallback', () => {
    expect(resolveBloodDecal(() => true, 'human', 'large')).toEqual({
      texture: 'blood-decals', framed: true, frame: 2,
    });
    expect(resolveBloodDecal(() => true, 'acid', 'scorch')).toEqual({
      texture: 'blood-decals', framed: true, frame: 11,
    });
    expect(resolveBloodDecal(() => false, 'alien', 'medium')).toEqual({
      texture: TEXTURE_KEYS.splatter, framed: false, frame: undefined,
    });
  });

  it('applies work only when the optional sheet is available', () => {
    const touched: string[] = [];
    applyToAvailableBloodDecals(() => false, (key) => touched.push(key));
    applyToAvailableBloodDecals((key) => key === 'blood-decals', (key) => touched.push(key));
    expect(touched).toEqual(['blood-decals']);
  });

  it('deeply freezes the manifest and frame structures', () => {
    expect(Object.isFrozen(BLOOD_DECALS)).toBe(true);
    expect(Object.isFrozen(BLOOD_DECALS.frames)).toBe(true);
    expect(Object.isFrozen(BLOOD_DECAL_FRAME_NAMES)).toBe(true);
  });
});
