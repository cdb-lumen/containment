import { describe, expect, it } from 'vitest';

import {
  QUALITY_PROFILES,
  QualityController,
  resolveEffectsQuality,
} from '../../src/game/effects/quality';

describe('effect quality profiles', () => {
  it('provides ordered immutable caps for every bounded effect kind', () => {
    expect(QUALITY_PROFILES).toEqual({
      low: { dynamicLights: 4, particles: 64, decals: 32, remains: 8, shellCasings: 16, flash: 0.45, shake: 0.5 },
      medium: { dynamicLights: 8, particles: 128, decals: 64, remains: 16, shellCasings: 32, flash: 0.75, shake: 0.75 },
      high: { dynamicLights: 16, particles: 256, decals: 128, remains: 32, shellCasings: 64, flash: 1, shake: 1 },
    });
    expect(Object.isFrozen(QUALITY_PROFILES)).toBe(true);
    expect(Object.values(QUALITY_PROFILES).every(Object.isFrozen)).toBe(true);
  });

  it('downgrades auto quality one level per sustained slow window and never upgrades', () => {
    const quality = new QualityController({ selection: 'auto', initialAutoProfile: 'high', rollingWindowSize: 4, slowFrameMs: 20 });

    [21, 25, 22].forEach((ms) => quality.recordFrame(ms));
    expect(quality.activeProfile).toBe('high');
    quality.recordFrame(24);
    expect(quality.activeProfile).toBe('medium');

    [10, 10, 10, 10, 10, 10].forEach((ms) => quality.recordFrame(ms));
    expect(quality.activeProfile).toBe('medium');

    [30, 30, 30, 30].forEach((ms) => quality.recordFrame(ms));
    expect(quality.activeProfile).toBe('low');
    [40, 40, 40, 40].forEach((ms) => quality.recordFrame(ms));
    expect(quality.activeProfile).toBe('low');
  });

  it('does not adapt an explicitly selected quality', () => {
    const quality = new QualityController({ selection: 'high', rollingWindowSize: 2, slowFrameMs: 20 });
    [100, 100, 100, 100].forEach((ms) => quality.recordFrame(ms));
    expect(quality.activeProfile).toBe('high');
  });

  it('lets accessibility settings reduce profile flash and shake defaults', () => {
    expect(resolveEffectsQuality('high', { reducedFlash: true, reducedShake: true })).toMatchObject({ flash: 0.25, shake: 0 });
    expect(resolveEffectsQuality('low', { reducedFlash: false, reducedShake: false })).toEqual(QUALITY_PROFILES.low);
  });
});
