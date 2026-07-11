import { describe, expect, it } from 'vitest';

import {
  MAX_RUN_ELAPSED_MS,
  MAX_RUN_KILLS,
  RunState,
  sanitizeRunResult,
  updateRunRecords,
} from '../../src/game/run/RunState';
import { calculateScore } from '../../src/game/scoring/score';

describe('RunState', () => {
  it('builds a deterministic victory result from recorded run behavior', () => {
    const run = new RunState();
    run.start();
    run.update(612_345.9);
    run.recordEnemyDefeated(false, 'grunt-1');
    run.recordEnemyDefeated(true, 'elite-1');
    run.recordWaveCleared(1);
    run.recordWaveCleared(2);

    const result = run.finishVictory(
      { movement: 2, damage: 3, reload: 0 },
      240,
    );

    expect(result).toEqual({
      started: true,
      ended: true,
      outcome: 'victory',
      score: calculateScore({
        kills: 2,
        eliteKills: 1,
        bossDefeated: true,
        wavesCleared: 2,
        creditsUnspent: 240,
        elapsedMs: 612_345,
      }),
      kills: 2,
      eliteKills: 1,
      wavesCleared: 2,
      elapsedMs: 612_345,
      bossDefeated: true,
      creditsUnspent: 240,
      selectedUpgrades: [
        { id: 'damage', label: 'Overpressure rounds', level: 3 },
        { id: 'movement', label: 'Servo assist', level: 2 },
      ],
    });
  });

  it('protects enemy, wave, and finish events from duplicate inflation and stops after ending', () => {
    const run = new RunState();
    run.start();
    run.update(100);

    run.recordEnemyDefeated(true, 'same-enemy');
    run.recordEnemyDefeated(true, 'same-enemy');
    run.recordWaveCleared(1);
    run.recordWaveCleared(1);

    const first = run.finishDefeat({ armor: 1 }, 12);
    run.update(9_999);
    run.recordEnemyDefeated(false, 'late-enemy');
    run.recordWaveCleared(2);
    const duplicateFinish = run.finishVictory({ damage: 5 }, 999);

    expect(first).toMatchObject({
      outcome: 'defeat',
      kills: 1,
      eliteKills: 1,
      wavesCleared: 1,
      elapsedMs: 100,
      bossDefeated: false,
      creditsUnspent: 12,
      selectedUpgrades: [{ id: 'armor', label: 'Reactive plating', level: 1 }],
    });
    expect(duplicateFinish).toEqual(first);
    expect(duplicateFinish).not.toBe(first);
    expect(duplicateFinish.selectedUpgrades).not.toBe(first.selectedUpgrades);
  });

  it('fully resets lifecycle, counters, event identities, and finalized data for another run', () => {
    const run = new RunState();
    run.start();
    run.update(500);
    run.recordEnemyDefeated(true, 'reused-id');
    run.recordWaveCleared(7);
    const first = run.finishVictory({ damage: 2 }, 50);

    run.reset();
    expect(run.snapshot()).toEqual({
      started: false,
      ended: false,
      outcome: 'active',
      score: 0,
      kills: 0,
      eliteKills: 0,
      wavesCleared: 0,
      elapsedMs: 0,
      bossDefeated: false,
      creditsUnspent: 0,
      selectedUpgrades: [],
    });

    run.start();
    run.update(20);
    run.recordEnemyDefeated(false, 'reused-id');
    run.recordWaveCleared(7);
    const second = run.finishDefeat({ movement: 1 }, 3);

    expect(second).toMatchObject({
      outcome: 'defeat',
      kills: 1,
      eliteKills: 0,
      wavesCleared: 1,
      elapsedMs: 20,
      creditsUnspent: 3,
    });
    expect(second.selectedUpgrades).toEqual([
      { id: 'movement', label: 'Servo assist', level: 1 },
    ]);
    expect(first).toMatchObject({
      outcome: 'victory',
      kills: 1,
      eliteKills: 1,
      elapsedMs: 500,
      creditsUnspent: 50,
    });
  });

  it('ignores malformed activity and safely bounds huge run and result values', () => {
    const run = new RunState();
    run.update(10);
    run.recordEnemyDefeated(false, 'before-start');
    run.recordWaveCleared(1);
    run.start();

    for (const invalidDelta of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      run.update(invalidDelta);
    }
    run.update(Number.MAX_VALUE);
    run.update(1);
    run.recordEnemyDefeated(false, Number.NaN);
    run.recordWaveCleared(Number.NaN);
    run.recordWaveCleared(-1);
    run.recordWaveCleared(Number.MAX_VALUE);

    const malformedLevels = {
      damage: Number.MAX_VALUE,
      movement: 1.9,
      armor: -2,
      reload: Number.NaN,
      unknown: 10,
    } as const;
    const result = run.finishDefeat(malformedLevels, Number.MAX_VALUE);

    expect(result.elapsedMs).toBe(MAX_RUN_ELAPSED_MS);
    expect(result.kills).toBe(0);
    expect(result.wavesCleared).toBe(0);
    expect(result.creditsUnspent).toBe(1_000_000_000);
    expect(result.selectedUpgrades).toEqual([
      { id: 'damage', label: 'Overpressure rounds', level: 5 },
      { id: 'movement', label: 'Servo assist', level: 1 },
    ]);
    expect(Number.isSafeInteger(result.score)).toBe(true);
  });

  it('returns fresh deeply frozen snapshots without retaining mutable input aliases', () => {
    const run = new RunState();
    const levels: Record<string, number> = { damage: 2 };
    run.start();
    const finished = run.finishVictory(levels, 5);
    levels.damage = 5;

    const first = run.snapshot();
    const second = run.snapshot();
    expect(first).toEqual(finished);
    expect(second).toEqual(finished);
    expect(first).not.toBe(second);
    expect(first.selectedUpgrades).not.toBe(second.selectedUpgrades);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.selectedUpgrades)).toBe(true);
    expect(Object.isFrozen(first.selectedUpgrades[0])).toBe(true);
    expect(first.selectedUpgrades[0]?.level).toBe(2);

    expect(() => {
      (first.selectedUpgrades as unknown as Array<{ level: number }>)[0]!.level =
        99;
    }).toThrow(TypeError);
    expect(run.snapshot().selectedUpgrades[0]?.level).toBe(2);
  });
});

describe('sanitizeRunResult', () => {
  it('recomputes canonical score and rejects counters outside RunState bounds', () => {
    const poisoned = sanitizeRunResult({
      started: true,
      ended: true,
      outcome: 'defeat',
      score: Number.MAX_SAFE_INTEGER,
      kills: 0,
      eliteKills: 0,
      wavesCleared: 0,
      elapsedMs: 0,
      bossDefeated: false,
      creditsUnspent: 0,
      selectedUpgrades: [{ id: 'damage', label: 'FORGED', level: 1 }],
    });

    expect(poisoned).toEqual({
      started: true,
      ended: true,
      outcome: 'defeat',
      score: calculateScore({
        kills: 0,
        eliteKills: 0,
        wavesCleared: 0,
        elapsedMs: 0,
        bossDefeated: false,
        creditsUnspent: 0,
      }),
      kills: 0,
      eliteKills: 0,
      wavesCleared: 0,
      elapsedMs: 0,
      bossDefeated: false,
      creditsUnspent: 0,
      selectedUpgrades: [
        { id: 'damage', label: 'Overpressure rounds', level: 1 },
      ],
    });
    if (poisoned === null) throw new Error('Expected canonical result');
    expect(Object.isFrozen(poisoned)).toBe(true);
    expect(Object.isFrozen(poisoned.selectedUpgrades)).toBe(true);
    expect(updateRunRecords({ bestScore: 0, bestTimeMs: null }, poisoned).best).toEqual({
      bestScore: 0,
      bestTimeMs: null,
    });

    expect(
      sanitizeRunResult({
        ...poisoned,
        kills: MAX_RUN_KILLS + 1,
        selectedUpgrades: [],
      }),
    ).toBeNull();
  });
});

describe('updateRunRecords', () => {
  const victoryResult = () => {
    const run = new RunState();
    run.start();
    run.update(400);
    run.recordEnemyDefeated(false, 'one');
    return run.finishVictory({}, 0);
  };

  it('returns immutable previous and best records with independent record flags', () => {
    const result = victoryResult();
    const current = { bestScore: result.score - 1, bestTimeMs: 300 };

    const update = updateRunRecords(current, result);

    expect(update).toEqual({
      previous: current,
      best: { bestScore: result.score, bestTimeMs: 300 },
      isNewBestScore: true,
      isNewBestTime: false,
    });
    expect(update.previous).not.toBe(current);
    expect(update.best).not.toBe(current);
    expect(Object.isFrozen(update)).toBe(true);
    expect(Object.isFrozen(update.previous)).toBe(true);
    expect(Object.isFrozen(update.best)).toBe(true);
  });

  it('never sets or improves best time for defeat while allowing its score record', () => {
    const run = new RunState();
    run.start();
    run.update(10);
    const defeat = run.finishDefeat({}, 100);

    const update = updateRunRecords(
      { bestScore: 0, bestTimeMs: null },
      defeat,
    );

    expect(update.best).toEqual({
      bestScore: defeat.score,
      bestTimeMs: null,
    });
    expect(update.isNewBestScore).toBe(defeat.score > 0);
    expect(update.isNewBestTime).toBe(false);
  });

  it('defaults malformed current fields safely and can establish victory records', () => {
    const result = victoryResult();
    const malformed = {
      bestScore: Number.POSITIVE_INFINITY,
      bestTimeMs: -1,
    } as const;

    const update = updateRunRecords(malformed, result);

    expect(update.previous).toEqual({ bestScore: 0, bestTimeMs: null });
    expect(update.best).toEqual({
      bestScore: result.score,
      bestTimeMs: result.elapsedMs,
    });
    expect(update.isNewBestScore).toBe(true);
    expect(update.isNewBestTime).toBe(true);
  });
});
