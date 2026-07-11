import { MAX_ACTIVE_ENEMIES } from '../constants';
import { STANDARD_ENEMY_IDS } from '../enemies/catalog';
import type { StandardEnemyId } from '../enemies/types';
import { ARMORY_AFTER_WAVES, WAVE_PLAN, type WaveDefinition } from './wavePlan';

export type HordePhase =
  | 'idle'
  | 'combat'
  | 'armory'
  | 'boss'
  | 'victory'
  | 'defeat';

export type WaveStartEvent = { type: 'wave-start'; wave: number };
export type SpawnRequestEvent = {
  type: 'spawn-request';
  wave: number;
  enemyId: StandardEnemyId;
  elite: boolean;
  breachId: string;
};
export type WaveCompleteEvent = { type: 'wave-complete'; wave: number };
export type ArmoryStartEvent = { type: 'armory-start'; afterWave: number };
export type ArmoryEndEvent = { type: 'armory-end'; afterWave: number };
export type BossStartEvent = { type: 'boss-start' };
export type VictoryEvent = { type: 'victory' };
export type DefeatEvent = { type: 'defeat' };

export type HordeEvent =
  | WaveStartEvent
  | SpawnRequestEvent
  | WaveCompleteEvent
  | ArmoryStartEvent
  | ArmoryEndEvent
  | BossStartEvent
  | VictoryEvent
  | DefeatEvent;

const MAX_RANDOM = 1 - Number.EPSILON;

export class HordeDirector {
  readonly #random: () => number;
  #phase: HordePhase = 'idle';
  #waveIndex = -1;
  #spawned = 0;
  #accumulatedMs = 0;
  #elapsedWaveMs = 0;

  constructor(random: () => number = Math.random) {
    this.#random = random;
  }

  get phase(): HordePhase {
    return this.#phase;
  }

  get currentWave(): number | null {
    return this.#waveIndex < 0 ? null : WAVE_PLAN[this.#waveIndex].number;
  }

  start(): HordeEvent[] {
    if (this.#phase !== 'idle') return [];
    this.#phase = 'combat';
    this.#waveIndex = 0;
    this.#spawned = 0;
    this.#accumulatedMs = 0;
    this.#elapsedWaveMs = 0;
    return [{ type: 'wave-start', wave: 1 }];
  }

  update(deltaMs: number, aliveCount: number): HordeEvent[] {
    if (
      this.#phase !== 'combat' ||
      !Number.isFinite(deltaMs) ||
      deltaMs < 0 ||
      !Number.isFinite(aliveCount) ||
      aliveCount < 0
    ) {
      return [];
    }

    const wave = WAVE_PLAN[this.#waveIndex];
    this.#elapsedWaveMs = Math.min(
      Number.MAX_SAFE_INTEGER,
      this.#elapsedWaveMs + deltaMs,
    );
    if (this.#spawned === wave.totalSpawns) {
      return aliveCount === 0 && this.#elapsedWaveMs >= wave.durationMs
        ? this.#completeWave(wave)
        : [];
    }

    this.#accumulatedMs = Math.min(
      Number.MAX_SAFE_INTEGER,
      this.#accumulatedMs + deltaMs,
    );
    const due = Math.floor(this.#accumulatedMs / wave.spawnIntervalMs);
    const slots = Math.max(
      0,
      Math.floor(Math.min(wave.concurrentCap, MAX_ACTIVE_ENEMIES) - aliveCount),
    );
    const count = Math.min(
      due,
      wave.totalSpawns - this.#spawned,
      slots,
      MAX_ACTIVE_ENEMIES,
    );
    if (count <= 0) return [];

    const events: HordeEvent[] = [];
    for (let index = 0; index < count; index += 1) {
      events.push(this.#spawnEvent(wave));
    }
    this.#spawned += count;
    this.#accumulatedMs -= count * wave.spawnIntervalMs;
    return events;
  }

  completeArmory(): HordeEvent[] {
    if (this.#phase !== 'armory') return [];
    const afterWave = WAVE_PLAN[this.#waveIndex].number;
    this.#waveIndex += 1;
    this.#phase = 'combat';
    this.#spawned = 0;
    this.#accumulatedMs = 0;
    this.#elapsedWaveMs = 0;
    return [
      { type: 'armory-end', afterWave },
      { type: 'wave-start', wave: WAVE_PLAN[this.#waveIndex].number },
    ];
  }

  reportBossDefeated(): HordeEvent[] {
    if (this.#phase !== 'boss') return [];
    this.#phase = 'victory';
    return [{ type: 'victory' }];
  }

  reportPlayerDefeated(): HordeEvent[] {
    if (!['combat', 'armory', 'boss'].includes(this.#phase)) return [];
    this.#phase = 'defeat';
    return [{ type: 'defeat' }];
  }

  reset(): HordeEvent[] {
    this.#phase = 'idle';
    this.#waveIndex = -1;
    this.#spawned = 0;
    this.#accumulatedMs = 0;
    this.#elapsedWaveMs = 0;
    return [];
  }

  #completeWave(wave: WaveDefinition): HordeEvent[] {
    const events: HordeEvent[] = [
      { type: 'wave-complete', wave: wave.number },
    ];
    this.#elapsedWaveMs = 0;
    if (wave.number === WAVE_PLAN.length) {
      this.#phase = 'boss';
      events.push({ type: 'boss-start' });
      return events;
    }
    if ((ARMORY_AFTER_WAVES as readonly number[]).includes(wave.number)) {
      this.#phase = 'armory';
      events.push({ type: 'armory-start', afterWave: wave.number });
      return events;
    }

    this.#waveIndex += 1;
    this.#spawned = 0;
    this.#accumulatedMs = 0;
    events.push({ type: 'wave-start', wave: WAVE_PLAN[this.#waveIndex].number });
    return events;
  }

  #spawnEvent(wave: WaveDefinition): SpawnRequestEvent {
    return {
      type: 'spawn-request',
      wave: wave.number,
      enemyId: this.#weightedEnemy(wave),
      elite: this.#safeRandom() < wave.eliteChance,
      breachId:
        wave.breachIds[
          Math.min(
            wave.breachIds.length - 1,
            Math.floor(this.#safeRandom() * wave.breachIds.length),
          )
        ],
    };
  }

  #weightedEnemy(wave: WaveDefinition): StandardEnemyId {
    const positive = STANDARD_ENEMY_IDS.filter(
      (enemyId) => wave.enemyWeights[enemyId] > 0,
    );
    const total = positive.reduce(
      (sum, enemyId) => sum + wave.enemyWeights[enemyId],
      0,
    );
    const target = this.#safeRandom() * total;
    let cumulative = 0;
    for (const enemyId of positive) {
      cumulative += wave.enemyWeights[enemyId];
      if (target < cumulative) return enemyId;
    }
    return positive[positive.length - 1];
  }

  #safeRandom(): number {
    let value: number;
    try {
      value = this.#random();
    } catch {
      return 0;
    }
    if (Number.isNaN(value) || value === Number.NEGATIVE_INFINITY) return 0;
    if (!Number.isFinite(value)) return MAX_RANDOM;
    return Math.min(MAX_RANDOM, Math.max(0, value));
  }
}
