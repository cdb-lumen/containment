import { describe, expect, it } from 'vitest';

import {
  CHARACTER_FRAME_NAMES,
  CHARACTER_SKINS,
  type CharacterFrameName,
  type CharacterSkinId,
} from '../../src/game/art/characterSkins';

const IDS: readonly CharacterSkinId[] = [
  'marine',
  'crawler',
  'brute',
  'spitter',
  'stalker',
  'carrier',
  'queen',
];

const FRAME_NAMES: readonly CharacterFrameName[] = [
  'idleA',
  'idleB',
  'moveA',
  'moveB',
  'attack',
  'hit',
  'death',
];

const FALLBACKS = [
  'marine',
  'alien-runner',
  'alien-brute',
  'alien-spitter',
  'alien-stalker',
  'alien-drone',
  'alien-queen',
] as const;

describe('character skin manifest', () => {
  it('defines every original character family exactly once in stable order', () => {
    expect(Object.keys(CHARACTER_SKINS)).toEqual(IDS);
    expect(Object.values(CHARACTER_SKINS).map((skin) => skin.id)).toEqual(IDS);
    expect(new Set(Object.values(CHARACTER_SKINS).map((skin) => skin.texture)).size).toBe(
      IDS.length,
    );
    expect(Object.values(CHARACTER_SKINS).map((skin) => skin.texture)).toEqual(
      IDS.map((id) => `skin-${id}`),
    );
  });

  it('uses local PNG sheets and fixed pixel cells', () => {
    for (const id of IDS) {
      const skin = CHARACTER_SKINS[id];
      expect(skin.url).toBe(`assets/characters/${id}-sheet.png`);
      expect(skin.frameWidth).toBe(id === 'queen' ? 160 : 96);
      expect(skin.frameHeight).toBe(id === 'queen' ? 160 : 96);
    }
  });

  it('maps semantic frame names to the seven sheet cells', () => {
    expect(CHARACTER_FRAME_NAMES).toEqual(FRAME_NAMES);
    for (const skin of Object.values(CHARACTER_SKINS)) {
      expect(skin.frames).toEqual({
        idleA: 0,
        idleB: 1,
        moveA: 2,
        moveB: 3,
        attack: 4,
        hit: 5,
        death: 6,
      });
    }
  });

  it('preserves the existing procedural texture fallbacks', () => {
    expect(Object.values(CHARACTER_SKINS).map((skin) => skin.fallbackTexture)).toEqual(
      FALLBACKS,
    );
  });

  it('freezes the manifest, definitions, frame names, and frame maps', () => {
    expect(Object.isFrozen(CHARACTER_SKINS)).toBe(true);
    expect(Object.isFrozen(CHARACTER_FRAME_NAMES)).toBe(true);
    for (const skin of Object.values(CHARACTER_SKINS)) {
      expect(Object.isFrozen(skin)).toBe(true);
      expect(Object.isFrozen(skin.frames)).toBe(true);
    }
  });
});
