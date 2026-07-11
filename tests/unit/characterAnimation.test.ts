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

  it('gives crawlers a faster movement frame cadence than brutes', () => {
    const frames = (skin: CharacterSkinId, times: readonly number[]) => times.map((nowMs) =>
      characterAnimation(animationInput({ skin, nowMs, velocityX: 1 })).frame);
    expect(frames('crawler', [0, 200, 400, 600])).toEqual(['moveA', 'moveB', 'moveA', 'moveB']);
    expect(frames('brute', [0, 200, 400, 600])).toEqual(['moveA', 'moveA', 'moveA', 'moveB']);
  });

  it('gives brutes slow, heavy compression over their gait', () => {
    const start = characterAnimation(animationInput({ skin: 'brute', entityId: 0, velocityX: 1, nowMs: 0 }));
    const compressed = characterAnimation(animationInput({ skin: 'brute', entityId: 0, velocityX: 1, nowMs: 300 }));
    const recovered = characterAnimation(animationInput({ skin: 'brute', entityId: 0, velocityX: 1, nowMs: 600 }));
    expect(compressed.scaleX).toBeLessThan(start.scaleX);
    expect(compressed.scaleY).toBeGreaterThan(start.scaleY);
    expect(recovered.scaleX).toBeCloseTo(start.scaleX);
    expect(recovered.scaleY).toBeCloseTo(start.scaleY);
    expect(Math.abs(compressed.offsetY)).toBeLessThan(1);
  });

  it('animates the spitter pulse while low quality suppresses only its optional secondary pulse', () => {
    const at = (nowMs: number, quality: 'high' | 'medium' | 'low' = 'high') => characterAnimation(animationInput({
      skin: 'spitter', entityId: 0, nowMs, velocityX: 1, quality,
    }));
    const highStart = at(0);
    const highPeak = at(250);
    const mediumPeak = at(250, 'medium');
    const lowPeak = at(250, 'low');
    expect(highPeak.emissiveAlpha).toBeGreaterThan(highStart.emissiveAlpha);
    expect(mediumPeak.emissiveAlpha).toBeLessThan(highPeak.emissiveAlpha);
    expect(highPeak.scaleX).toBeGreaterThan(highStart.scaleX);
    expect(highPeak.scaleY).toBeLessThan(highStart.scaleY);
    expect(lowPeak).toMatchObject({ emissiveAlpha: 0, scaleX: 1, scaleY: 1 });
    expect(lowPeak.frame).toBe(highPeak.frame);
  });

  it('gives carriers a continuous bob whose phase is distinct from step-frame cadence', () => {
    const at = (nowMs: number, velocityX = 1) => characterAnimation(animationInput({
      skin: 'carrier', entityId: 0, nowMs, velocityX,
    }));
    const start = at(0);
    const withinFirstFrame = at(210);
    const nextFrame = at(420);
    expect(start.frame).toBe(withinFirstFrame.frame);
    expect(withinFirstFrame.offsetY).not.toBe(start.offsetY);
    expect(nextFrame.frame).not.toBe(start.frame);
    expect(nextFrame.offsetY).not.toBe(start.offsetY);
    expect(at(210, 0).offsetY).not.toBe(withinFirstFrame.offsetY);
  });

  it('keeps slow queen breathing at low quality but removes it for reduced motion', () => {
    const at = (nowMs: number, quality: 'high' | 'low' = 'high', reducedMotion = false) =>
      characterAnimation(animationInput({ skin: 'queen', entityId: 0, nowMs, quality, reducedMotion }));
    const start = at(0);
    const later = at(1_000);
    const lowLater = at(1_000, 'low');
    expect(later.scaleX).not.toBe(start.scaleX);
    expect(later.scaleY).not.toBe(start.scaleY);
    expect(lowLater.scaleX).toBe(later.scaleX);
    expect(lowLater.scaleY).toBe(later.scaleY);
    expect(lowLater.emissiveAlpha).toBe(0);
    expect(at(1_000, 'low', true)).toMatchObject({
      offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotationOffset: 0,
    });
  });

  it('keeps marine movement restrained across its gait', () => {
    for (const nowMs of [0, 90, 180, 270, 360]) {
      const marine = characterAnimation(animationInput({ skin: 'marine', entityId: 0, nowMs, velocityX: 1 }));
      expect(Math.abs(marine.offsetY)).toBeLessThanOrEqual(0.45);
      expect(Math.abs(marine.rotationOffset)).toBeLessThanOrEqual(0.008);
      expect(marine.scaleX).toBe(1);
      expect(marine.scaleY).toBe(1);
    }
  });

  it('uses deterministic stable-phase stalker shimmer with restrained quality effects', () => {
    const at = (nowMs: number, entityId = 12, quality: 'high' | 'medium' | 'low' = 'high') =>
      characterAnimation(animationInput({ skin: 'stalker', nowMs, entityId, quality }));
    const high = at(333);
    expect(at(333)).toEqual(high);
    expect(at(523).emissiveAlpha).not.toBe(high.emissiveAlpha);
    expect(at(333, 13).emissiveAlpha).not.toBe(high.emissiveAlpha);
    expect(high.emissiveAlpha).toBeGreaterThan(0);
    expect(at(333, 12, 'medium').emissiveAlpha).toBeLessThan(high.emissiveAlpha);
    expect(at(333, 12, 'low').emissiveAlpha).toBe(0);
    expect(at(333, 12, 'low').frame).toBe(high.frame);
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
