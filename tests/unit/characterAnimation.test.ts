import { describe, expect, it } from 'vitest';

import {
  CHARACTER_FRAME_NAMES,
  CHARACTER_SKINS,
  type CharacterFrameName,
  type CharacterSkinId,
} from '../../src/game/art/characterSkins';
import {
  animationPhaseForId,
  characterAnimation,
  type CharacterAnimationInput,
} from '../../src/game/art/characterAnimation';

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

const animationInput = (overrides: Partial<CharacterAnimationInput> = {}): CharacterAnimationInput => ({
  skin: 'marine', entityId: 12, nowMs: 0, velocityX: 0, velocityY: 0,
  attackUntilMs: 0, hitUntilMs: 0, dead: false, quality: 'high',
  reducedMotion: false, reducedFlash: false, ...overrides,
});

describe('character animation policy', () => {
  it('produces stable distinct phases in [0, 1) and safely normalizes invalid ids', () => {
    expect(animationPhaseForId(12)).toBe(animationPhaseForId(12));
    expect(animationPhaseForId(12)).not.toBe(animationPhaseForId(13));
    for (const id of [0, -1, 1.75, Number.NaN, Infinity, -Infinity]) {
      const phase = animationPhaseForId(id);
      expect(Number.isFinite(phase)).toBe(true);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(1);
    }
    expect(animationPhaseForId(Number.NaN)).toBe(animationPhaseForId(0));
  });

  it('alternates deterministic idle and locomotion frames', () => {
    expect(characterAnimation(animationInput({ nowMs: 0 })).frame).toBe('idleA');
    expect(characterAnimation(animationInput({ nowMs: 1_000 })).frame).toBe('idleB');
    expect(characterAnimation(animationInput({ velocityX: 1, nowMs: 0 })).frame).toBe('moveA');
    expect(characterAnimation(animationInput({ velocityY: -1, nowMs: 500 })).frame).toBe('moveB');
  });

  it('applies death, hit, attack, movement, idle precedence with bounded windows', () => {
    const active = { nowMs: 100, velocityX: 1, attackUntilMs: 101, hitUntilMs: 101 };
    expect(characterAnimation(animationInput(active)).frame).toBe('hit');
    expect(characterAnimation(animationInput({ ...active, dead: true })).frame).toBe('death');
    expect(characterAnimation(animationInput({ ...active, hitUntilMs: 100 })).frame).toBe('attack');
    expect(characterAnimation(animationInput({ ...active, attackUntilMs: 100, hitUntilMs: 100 })).frame).toMatch(/^move/);
    expect(characterAnimation(animationInput({ nowMs: 100, attackUntilMs: Infinity })).frame).toMatch(/^idle/);
  });

  it('gives families visibly different gait, compression, pulse, bob, and breathing', () => {
    const moving = { nowMs: 275, velocityX: 2 };
    const crawler = characterAnimation(animationInput({ ...moving, skin: 'crawler' }));
    const brute = characterAnimation(animationInput({ ...moving, skin: 'brute' }));
    const spitter = characterAnimation(animationInput({ ...moving, skin: 'spitter' }));
    const carrier = characterAnimation(animationInput({ ...moving, skin: 'carrier' }));
    const queen = characterAnimation(animationInput({ ...moving, skin: 'queen' }));
    const marine = characterAnimation(animationInput({ ...moving, skin: 'marine' }));
    expect(crawler.frame).not.toBe(brute.frame);
    expect(brute.scaleY).toBeLessThan(crawler.scaleY);
    expect(spitter.emissiveAlpha).toBeGreaterThan(marine.emissiveAlpha);
    expect(carrier.offsetY).not.toBe(crawler.offsetY);
    expect(Math.abs(queen.scaleY - 1)).toBeLessThan(Math.abs(brute.scaleY - 1));
  });

  it('uses stable-phase stalker shimmer with restrained medium and disabled low quality effects', () => {
    const base = { skin: 'stalker' as const, nowMs: 333 };
    const high = characterAnimation(animationInput(base));
    const other = characterAnimation(animationInput({ ...base, entityId: 13 }));
    const medium = characterAnimation(animationInput({ ...base, quality: 'medium' }));
    const low = characterAnimation(animationInput({ ...base, quality: 'low' }));
    expect(high.emissiveAlpha).not.toBe(other.emissiveAlpha);
    expect(medium.emissiveAlpha).toBeLessThanOrEqual(high.emissiveAlpha);
    expect(low.emissiveAlpha).toBe(0);
    expect(low.frame).toBe(high.frame);
  });

  it('keeps reduced motion and reduced flash independent from frame communication', () => {
    const active = { nowMs: 100, velocityX: 1, hitUntilMs: 200 };
    const normal = characterAnimation(animationInput(active));
    const motion = characterAnimation(animationInput({ ...active, reducedMotion: true }));
    const flash = characterAnimation(animationInput({ ...active, reducedFlash: true }));
    expect(motion.frame).toBe(normal.frame);
    expect(motion).toMatchObject({ offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotationOffset: 0 });
    expect(flash.frame).toBe('hit');
    expect(flash.hitBrightness).toBe(0);
    expect(normal.hitBrightness).toBeGreaterThan(0);
    expect(flash.offsetY).toBe(normal.offsetY);
  });

  it('returns finite frozen defaults for nonfinite numeric inputs', () => {
    const output = characterAnimation(animationInput({ entityId: Number.NaN, nowMs: Infinity,
      velocityX: Number.NaN, velocityY: -Infinity, attackUntilMs: Infinity, hitUntilMs: Number.NaN }));
    for (const value of [output.offsetX, output.offsetY, output.scaleX, output.scaleY,
      output.rotationOffset, output.emissiveAlpha, output.hitBrightness]) {
      expect(Number.isFinite(value)).toBe(true);
    }
    expect(output.frame).toBe('idleA');
    expect(Object.isFrozen(output)).toBe(true);
  });

  it('makes death static and suppresses flash and secondary effects', () => {
    expect(characterAnimation(animationInput({ dead: true, hitUntilMs: 999,
      attackUntilMs: 999, velocityX: 10 }))).toEqual({
      frame: 'death', offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1,
      rotationOffset: 0, emissiveAlpha: 0, hitBrightness: 0,
    });
  });
});
