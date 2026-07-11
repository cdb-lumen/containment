import { describe, expect, it } from 'vitest';

import { MAX_ACTIVE_ENEMIES } from '../../src/game/constants';
import { STANDARD_ENEMY_IDS } from '../../src/game/enemies/catalog';
import {
  HordeDirector,
  type HordeEvent,
  type SpawnRequestEvent,
} from '../../src/game/waves/HordeDirector';
import { ARMORY_AFTER_WAVES, WAVE_PLAN } from '../../src/game/waves/wavePlan';

const spawnEvents = (events: readonly HordeEvent[]): SpawnRequestEvent[] =>
  events.filter((event): event is SpawnRequestEvent => event.type === 'spawn-request');

const drainCurrentWave = (director: HordeDirector): HordeEvent[] => {
  const waveNumber = director.currentWave;
  if (waveNumber === null) throw new Error('No active wave');
  const expected = WAVE_PLAN[waveNumber - 1].totalSpawns;
  const events: HordeEvent[] = [];
  let spawned = 0;
  while (spawned < expected) {
    const batch = director.update(Number.MAX_VALUE, 0);
    events.push(...batch);
    spawned += spawnEvents(batch).length;
  }
  events.push(...director.update(0, 0));
  return events;
};

const emitCurrentWaveBudgetAtConfiguredIntervals = (
  director: HordeDirector,
): number => {
  const waveNumber = director.currentWave;
  if (waveNumber === null) throw new Error('No active wave');
  const wave = WAVE_PLAN[waveNumber - 1];
  let spawned = 0;
  while (spawned < wave.totalSpawns) {
    spawned += spawnEvents(director.update(wave.spawnIntervalMs, 0)).length;
  }
  return wave.totalSpawns * wave.spawnIntervalMs;
};

describe('wave plan', () => {
  it('defines exactly eight coherent, increasingly varied standard waves', () => {
    expect(WAVE_PLAN).toHaveLength(8);
    expect(WAVE_PLAN.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(WAVE_PLAN.map(({ totalSpawns }) => totalSpawns)).toEqual([
      25, 35, 48, 60, 72, 90, 110, 130,
    ]);
    expect(WAVE_PLAN.map(({ concurrentCap }) => concurrentCap)).toEqual([
      20, 28, 40, 55, 70, 90, 120, 150,
    ]);

    let previousVariety = 0;
    for (const wave of WAVE_PLAN) {
      expect(Number.isSafeInteger(wave.durationMs) && wave.durationMs > 0).toBe(true);
      expect(Number.isSafeInteger(wave.totalSpawns) && wave.totalSpawns > 0).toBe(true);
      expect(Number.isSafeInteger(wave.concurrentCap) && wave.concurrentCap > 0).toBe(true);
      expect(wave.concurrentCap).toBeLessThanOrEqual(MAX_ACTIVE_ENEMIES);
      expect(Number.isSafeInteger(wave.spawnIntervalMs) && wave.spawnIntervalMs > 0).toBe(true);
      expect(wave.eliteChance).toBeGreaterThanOrEqual(0);
      expect(wave.eliteChance).toBeLessThanOrEqual(1);

      const weightedIds = Object.keys(wave.enemyWeights);
      expect(weightedIds.every((id) => STANDARD_ENEMY_IDS.includes(id as never))).toBe(true);
      const weights = STANDARD_ENEMY_IDS.map((id) => wave.enemyWeights[id] ?? 0);
      expect(weights.every((weight) => Number.isFinite(weight) && weight >= 0)).toBe(true);
      expect(weights.some((weight) => weight > 0)).toBe(true);
      const variety = weights.filter((weight) => weight > 0).length;
      expect(variety).toBeGreaterThanOrEqual(previousVariety);
      previousVariety = variety;

      expect(wave.breachIds.length).toBeGreaterThan(0);
      expect(new Set(wave.breachIds).size).toBe(wave.breachIds.length);
      expect(wave.breachIds.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    }
  });

  it('deep-freezes public wave data and publishes exact armory breaks', () => {
    expect(ARMORY_AFTER_WAVES).toEqual([2, 4, 6]);
    expect(Object.isFrozen(ARMORY_AFTER_WAVES)).toBe(true);
    expect(Object.isFrozen(WAVE_PLAN)).toBe(true);
    for (const wave of WAVE_PLAN) {
      expect(Object.isFrozen(wave)).toBe(true);
      expect(Object.isFrozen(wave.enemyWeights)).toBe(true);
      expect(Object.isFrozen(wave.breachIds)).toBe(true);
    }

    expect(() => {
      (WAVE_PLAN as unknown as Array<unknown>).pop();
    }).toThrow(TypeError);
    expect(() => {
      (WAVE_PLAN[0].breachIds as unknown as string[]).push('mutation');
    }).toThrow(TypeError);
  });
});

describe('HordeDirector', () => {
  it('starts wave one once and exposes readable state', () => {
    const director = new HordeDirector(() => 0);
    expect(director.phase).toBe('idle');
    expect(director.currentWave).toBeNull();

    expect(director.start()).toEqual([{ type: 'wave-start', wave: 1 }]);
    expect(director.phase).toBe('combat');
    expect(director.currentWave).toBe(1);
    expect(director.start()).toEqual([]);
  });

  it('accumulates intervals and obeys wave, global, and reported alive caps', () => {
    const director = new HordeDirector(() => 0);
    director.start();
    const wave = WAVE_PLAN[0];

    expect(spawnEvents(director.update(wave.spawnIntervalMs - 1, 0))).toHaveLength(0);
    expect(spawnEvents(director.update(1, 0))).toHaveLength(1);
    expect(spawnEvents(director.update(wave.spawnIntervalMs * 100, wave.concurrentCap))).toHaveLength(0);
    expect(spawnEvents(director.update(0, wave.concurrentCap - 1))).toHaveLength(1);

    const capped = new HordeDirector(() => 0);
    capped.start();
    expect(spawnEvents(capped.update(Number.MAX_VALUE, 0))).toHaveLength(
      Math.min(WAVE_PLAN[0].totalSpawns, WAVE_PLAN[0].concurrentCap, MAX_ACTIVE_ENEMIES),
    );
  });

  it('never overruns the wave budget, even after huge accumulated time', () => {
    const director = new HordeDirector(() => 0.5);
    director.start();
    const allSpawns: SpawnRequestEvent[] = [];
    while (allSpawns.length < WAVE_PLAN[0].totalSpawns) {
      allSpawns.push(...spawnEvents(director.update(Number.MAX_VALUE, 0)));
    }
    for (let index = 0; index < 10; index += 1) {
      allSpawns.push(...spawnEvents(director.update(Number.MAX_VALUE, 1)));
    }

    expect(allSpawns).toHaveLength(WAVE_PLAN[0].totalSpawns);
    expect(director.update(Number.MAX_VALUE, 1)).toEqual([]);
    expect(director.phase).toBe('combat');
  });

  it('completes only after every spawn was requested and alive count reaches zero', () => {
    const director = new HordeDirector(() => 0);
    director.start();
    const wave = WAVE_PLAN[0];

    expect(director.update(0, 0)).toEqual([]);
    let spawned = 0;
    while (spawned < wave.totalSpawns) {
      spawned += spawnEvents(director.update(Number.MAX_VALUE, 0)).length;
    }
    expect(director.phase).toBe('combat');
    expect(director.currentWave).toBe(1);
    expect(director.update(0, 2)).toEqual([]);
    expect(director.update(0, 0)).toEqual([
      { type: 'wave-complete', wave: 1 },
      { type: 'wave-start', wave: 2 },
    ]);
  });

  it('treats durationMs as the minimum observable duration after a cleared full budget', () => {
    const director = new HordeDirector(() => 0);
    director.start();
    const wave = WAVE_PLAN[0];
    const scheduledElapsed = emitCurrentWaveBudgetAtConfiguredIntervals(director);
    expect(scheduledElapsed).toBeLessThan(wave.durationMs);

    expect(director.update(0, 0)).toEqual([]);
    expect(director.update(wave.durationMs - scheduledElapsed - 1, 0)).toEqual([]);
    expect(director.phase).toBe('combat');
    expect(director.update(1, 0)).toEqual([
      { type: 'wave-complete', wave: 1 },
      { type: 'wave-start', wave: 2 },
    ]);
  });

  it('does not advance wave duration for invalid delta values', () => {
    const director = new HordeDirector(() => 0);
    director.start();
    const wave = WAVE_PLAN[0];
    const scheduledElapsed = emitCurrentWaveBudgetAtConfiguredIntervals(director);
    director.update(wave.durationMs - scheduledElapsed - 1, 0);

    expect(director.update(-1, 0)).toEqual([]);
    expect(director.update(Number.NaN, 0)).toEqual([]);
    expect(director.update(Number.POSITIVE_INFINITY, 0)).toEqual([]);
    expect(director.update(0, 0)).toEqual([]);
    expect(director.update(1, 0)).toContainEqual({ type: 'wave-complete', wave: 1 });
  });

  it('resets elapsed duration across next-wave, armory, and reset transitions', () => {
    const director = new HordeDirector(() => 0);
    director.start();

    drainCurrentWave(director);
    expect(director.currentWave).toBe(2);
    const waveTwoScheduled = emitCurrentWaveBudgetAtConfiguredIntervals(director);
    expect(waveTwoScheduled).toBeLessThan(WAVE_PLAN[1].durationMs);
    expect(director.update(0, 0)).toEqual([]);
    expect(
      director.update(WAVE_PLAN[1].durationMs - waveTwoScheduled, 0),
    ).toContainEqual({ type: 'armory-start', afterWave: 2 });

    expect(director.completeArmory()).toContainEqual({ type: 'wave-start', wave: 3 });
    const waveThreeScheduled = emitCurrentWaveBudgetAtConfiguredIntervals(director);
    expect(waveThreeScheduled).toBeLessThan(WAVE_PLAN[2].durationMs);
    expect(director.update(0, 0)).toEqual([]);

    director.reset();
    director.start();
    const resetScheduled = emitCurrentWaveBudgetAtConfiguredIntervals(director);
    expect(director.update(0, 0)).toEqual([]);
    expect(
      director.update(WAVE_PLAN[0].durationMs - resetScheduled, 0),
    ).toContainEqual({ type: 'wave-complete', wave: 1 });
  });

  it('enters and exits armory after waves 2, 4, and 6 in order', () => {
    const director = new HordeDirector(() => 0);
    director.start();

    for (let wave = 1; wave <= 6; wave += 1) {
      const events = drainCurrentWave(director);
      expect(events).toContainEqual({ type: 'wave-complete', wave });
      if (ARMORY_AFTER_WAVES.includes(wave as 2 | 4 | 6)) {
        expect(events.slice(-2)).toEqual([
          { type: 'wave-complete', wave },
          { type: 'armory-start', afterWave: wave },
        ]);
        expect(director.phase).toBe('armory');
        expect(director.completeArmory()).toEqual([
          { type: 'armory-end', afterWave: wave },
          { type: 'wave-start', wave: wave + 1 },
        ]);
        expect(director.completeArmory()).toEqual([]);
      }
    }
    expect(director.currentWave).toBe(7);
  });

  it('starts the boss only after wave eight is fully spawned and cleared', () => {
    const director = new HordeDirector(() => 0);
    director.start();

    while (director.currentWave !== 8) {
      const completedWave = director.currentWave!;
      drainCurrentWave(director);
      if (director.phase === 'armory') director.completeArmory();
      expect(director.currentWave).toBe(completedWave + 1);
    }

    const waveEight = WAVE_PLAN[7];
    let spawned = 0;
    while (spawned < waveEight.totalSpawns) {
      spawned += spawnEvents(director.update(Number.MAX_VALUE, 0)).length;
    }
    expect(director.phase).toBe('combat');
    expect(director.update(0, 1)).toEqual([]);
    expect(director.update(0, 0)).toEqual([
      { type: 'wave-complete', wave: 8 },
      { type: 'boss-start' },
    ]);
    expect(director.phase).toBe('boss');
  });

  it('selects weighted enemies and breaches deterministically without zero weights', () => {
    const low = new HordeDirector(() => 0);
    low.start();
    const lowSpawn = spawnEvents(low.update(WAVE_PLAN[0].spawnIntervalMs, 0))[0];

    const high = new HordeDirector(() => 1);
    high.start();
    const highSpawn = spawnEvents(high.update(WAVE_PLAN[0].spawnIntervalMs, 0))[0];

    expect(lowSpawn).toMatchObject({
      enemyId: 'crawler',
      elite: true,
      breachId: WAVE_PLAN[0].breachIds[0],
    });
    expect(highSpawn).toMatchObject({
      enemyId: 'brute',
      elite: false,
      breachId: WAVE_PLAN[0].breachIds.at(-1),
    });
    expect(WAVE_PLAN[0].enemyWeights[lowSpawn.enemyId]).toBeGreaterThan(0);
    expect(WAVE_PLAN[0].enemyWeights[highSpawn.enemyId]).toBeGreaterThan(0);
  });

  it('clamps malformed random, delta, and alive values safely', () => {
    const malformed = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
    let index = 0;
    const director = new HordeDirector(() => malformed[index++ % malformed.length]);
    director.start();
    const interval = WAVE_PLAN[0].spawnIntervalMs;

    expect(director.update(Number.NaN, 0)).toEqual([]);
    expect(director.update(Number.POSITIVE_INFINITY, 0)).toEqual([]);
    expect(director.update(-1, 0)).toEqual([]);
    expect(director.update(interval, Number.NaN)).toEqual([]);
    expect(director.update(interval, -1)).toEqual([]);
    expect(director.update(interval, Number.POSITIVE_INFINITY)).toEqual([]);

    const events = director.update(interval, 0);
    const spawn = spawnEvents(events)[0];
    expect(STANDARD_ENEMY_IDS).toContain(spawn.enemyId);
    expect(WAVE_PLAN[0].breachIds).toContain(spawn.breachId);
    expect(WAVE_PLAN[0].enemyWeights[spawn.enemyId]).toBeGreaterThan(0);
  });

  it('uses deterministic zero fallback when injected random throws', () => {
    const director = new HordeDirector(() => {
      throw new Error('rng failed');
    });
    director.start();

    const events = director.update(WAVE_PLAN[0].spawnIntervalMs, 0);
    const spawn = spawnEvents(events)[0];
    expect(spawn).toMatchObject({
      enemyId: 'crawler',
      elite: true,
      breachId: WAVE_PLAN[0].breachIds[0],
    });
    expect(STANDARD_ENEMY_IDS).toContain(spawn.enemyId);
    expect(WAVE_PLAN[0].breachIds).toContain(spawn.breachId);
  });

  it('handles victory, defeat, terminal idempotence, and reset', () => {
    const director = new HordeDirector(() => 0);
    expect(director.reportBossDefeated()).toEqual([]);
    expect(director.reportPlayerDefeated()).toEqual([]);

    director.start();
    expect(director.reportPlayerDefeated()).toEqual([{ type: 'defeat' }]);
    expect(director.phase).toBe('defeat');
    expect(director.reportPlayerDefeated()).toEqual([]);
    expect(director.update(Number.MAX_VALUE, 0)).toEqual([]);

    expect(director.reset()).toEqual([]);
    expect(director.phase).toBe('idle');
    expect(director.currentWave).toBeNull();
    expect(director.start()).toEqual([{ type: 'wave-start', wave: 1 }]);

    while (director.phase !== 'boss') {
      drainCurrentWave(director);
      if (director.phase === 'armory') director.completeArmory();
    }
    expect(director.reportBossDefeated()).toEqual([{ type: 'victory' }]);
    expect(director.phase).toBe('victory');
    expect(director.reportBossDefeated()).toEqual([]);
    expect(director.reportPlayerDefeated()).toEqual([]);

    director.reset();
    expect(director.update(Number.MAX_VALUE, 0)).toEqual([]);
    expect(director.phase).toBe('idle');
  });
});
