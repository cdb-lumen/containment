import { describe, expect, it } from 'vitest';

import { calculateScore } from '../../src/game/scoring/score';

const EMPTY_RUN = {
  kills: 0,
  eliteKills: 0,
  bossDefeated: false,
  wavesCleared: 0,
  creditsUnspent: 0,
  elapsedMs: 0,
};

describe('calculateScore', () => {
  it('is deterministic for the same run data', () => {
    const run = {
      kills: 87,
      eliteKills: 6,
      bossDefeated: true,
      wavesCleared: 8,
      creditsUnspent: 240,
      elapsedMs: 612_345,
    };

    expect(calculateScore(run)).toBe(calculateScore({ ...run }));
  });

  it('awards a positive component for every scoring achievement', () => {
    const baseline = calculateScore(EMPTY_RUN);

    expect(calculateScore({ ...EMPTY_RUN, kills: 1 })).toBeGreaterThan(baseline);
    expect(calculateScore({ ...EMPTY_RUN, eliteKills: 1 })).toBeGreaterThan(
      baseline,
    );
    expect(calculateScore({ ...EMPTY_RUN, wavesCleared: 1 })).toBeGreaterThan(
      baseline,
    );
    expect(calculateScore({ ...EMPTY_RUN, creditsUnspent: 1 })).toBeGreaterThan(
      baseline,
    );
    expect(
      calculateScore({ ...EMPTY_RUN, bossDefeated: true, elapsedMs: 3_600_000 }),
    ).toBeGreaterThan(baseline);
  });

  it('only awards a bounded completion-time bonus after defeating the boss', () => {
    const incompleteFast = calculateScore({ ...EMPTY_RUN, elapsedMs: 1 });
    const incompleteSlow = calculateScore({
      ...EMPTY_RUN,
      elapsedMs: 99_999_999,
    });
    expect(incompleteFast).toBe(incompleteSlow);

    const bossOnly = calculateScore({
      ...EMPTY_RUN,
      bossDefeated: true,
      elapsedMs: 99_999_999,
    });
    const fastest = calculateScore({
      ...EMPTY_RUN,
      bossDefeated: true,
      elapsedMs: 0,
    });
    expect(fastest).toBeGreaterThanOrEqual(bossOnly);
    expect(fastest - bossOnly).toBeLessThan(1_000_000);
  });

  it('clamps invalid numeric inputs and always returns a safe integer', () => {
    const invalidScore = calculateScore({
      kills: Number.NaN,
      eliteKills: Number.POSITIVE_INFINITY,
      bossDefeated: false,
      wavesCleared: -4,
      creditsUnspent: Number.NEGATIVE_INFINITY,
      elapsedMs: -1,
    });
    expect(invalidScore).toBe(0);

    const fractionalScore = calculateScore({
      kills: 1.9,
      eliteKills: 2.7,
      bossDefeated: true,
      wavesCleared: 3.5,
      creditsUnspent: 4.9,
      elapsedMs: 5.2,
    });
    expect(Number.isInteger(fractionalScore)).toBe(true);
    expect(Number.isFinite(fractionalScore)).toBe(true);
    expect(fractionalScore).toBeGreaterThanOrEqual(0);
  });

  it('does not turn non-finite elapsed time into the fastest bonus', () => {
    const completedSlow = calculateScore({
      ...EMPTY_RUN,
      bossDefeated: true,
      elapsedMs: 99_999_999,
    });

    expect(
      calculateScore({
        ...EMPTY_RUN,
        bossDefeated: true,
        elapsedMs: Number.POSITIVE_INFINITY,
      }),
    ).toBe(completedSlow);
    expect(
      calculateScore({
        ...EMPTY_RUN,
        bossDefeated: true,
        elapsedMs: Number.NaN,
      }),
    ).toBe(completedSlow);
  });
});
