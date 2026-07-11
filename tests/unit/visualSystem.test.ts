import { describe, expect, it } from 'vitest';

import {
  ACTOR_VISUAL_SCALE,
  AMBIENT_VISUAL_BUDGET,
  HUD_LAYOUT,
  MATERIAL_VARIANTS,
  roomMaterialVariant,
} from '../../src/game/art/visualSystem';

describe('visual system contracts', () => {
  it('keeps the playfield dominant while preserving readable HUD instruments', () => {
    expect(HUD_LAYOUT.topBandHeight).toBeLessThanOrEqual(82);
    expect(HUD_LAYOUT.bottomBandHeight).toBeLessThanOrEqual(48);
    expect(HUD_LAYOUT.playfieldHeight).toBeGreaterThanOrEqual(590);
  });

  it('makes the marine and enemy silhouettes readable without changing physics', () => {
    expect(ACTOR_VISUAL_SCALE.marine).toBeGreaterThanOrEqual(88);
    expect(ACTOR_VISUAL_SCALE.brute).toBeGreaterThan(ACTOR_VISUAL_SCALE.crawler);
    expect(ACTOR_VISUAL_SCALE.carrier).toBeGreaterThan(ACTOR_VISUAL_SCALE.spitter);
  });

  it('selects stable material variants per room and floor family', () => {
    expect(new Set(MATERIAL_VARIANTS.plate).size).toBeGreaterThanOrEqual(3);
    expect(roomMaterialVariant('medical', 'plate')).toBe(roomMaterialVariant('medical', 'plate'));
    expect(MATERIAL_VARIANTS.plate).toContain(roomMaterialVariant('medical', 'plate'));
    expect(MATERIAL_VARIANTS.grate).toContain(roomMaterialVariant('reactor', 'grate'));
  });

  it('bounds scene-owned ambient layers for low-cost lifecycle-safe rendering', () => {
    expect(AMBIENT_VISUAL_BUDGET.maxLightPools).toBeLessThanOrEqual(12);
    expect(AMBIENT_VISUAL_BUDGET.maxDustMotes).toBeLessThanOrEqual(32);
    expect(AMBIENT_VISUAL_BUDGET.lowQualityDustMotes).toBe(0);
  });
});
