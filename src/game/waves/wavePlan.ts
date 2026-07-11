import type { StandardEnemyId } from '../enemies/types';

export type WaveDefinition = Readonly<{
  number: number;
  durationMs: number;
  totalSpawns: number;
  concurrentCap: number;
  spawnIntervalMs: number;
  enemyWeights: Readonly<Record<StandardEnemyId, number>>;
  eliteChance: number;
  breachIds: readonly string[];
}>;

const weights = (
  crawler: number,
  brute: number,
  spitter: number,
  stalker: number,
  carrier: number,
): Readonly<Record<StandardEnemyId, number>> =>
  Object.freeze({ crawler, brute, spitter, stalker, carrier });

const wave = (definition: Omit<WaveDefinition, 'breachIds'> & { breachIds: string[] }) =>
  Object.freeze({ ...definition, breachIds: Object.freeze(definition.breachIds) });

export const WAVE_PLAN: readonly WaveDefinition[] = Object.freeze([
  wave({
    number: 1,
    durationMs: 45_000,
    totalSpawns: 25,
    concurrentCap: 20,
    spawnIntervalMs: 900,
    enemyWeights: weights(0.8, 0.2, 0, 0, 0),
    eliteChance: 0.02,
    breachIds: ['north', 'south'],
  }),
  wave({
    number: 2,
    durationMs: 50_000,
    totalSpawns: 35,
    concurrentCap: 28,
    spawnIntervalMs: 800,
    enemyWeights: weights(0.7, 0.3, 0, 0, 0),
    eliteChance: 0.04,
    breachIds: ['north', 'south', 'east'],
  }),
  wave({
    number: 3,
    durationMs: 55_000,
    totalSpawns: 48,
    concurrentCap: 40,
    spawnIntervalMs: 700,
    enemyWeights: weights(0.58, 0.27, 0.15, 0, 0),
    eliteChance: 0.06,
    breachIds: ['north', 'south', 'east'],
  }),
  wave({
    number: 4,
    durationMs: 60_000,
    totalSpawns: 60,
    concurrentCap: 55,
    spawnIntervalMs: 650,
    enemyWeights: weights(0.48, 0.3, 0.22, 0, 0),
    eliteChance: 0.08,
    breachIds: ['north', 'south', 'east', 'west'],
  }),
  wave({
    number: 5,
    durationMs: 65_000,
    totalSpawns: 72,
    concurrentCap: 70,
    spawnIntervalMs: 600,
    enemyWeights: weights(0.4, 0.27, 0.2, 0.13, 0),
    eliteChance: 0.1,
    breachIds: ['north', 'south', 'east', 'west'],
  }),
  wave({
    number: 6,
    durationMs: 70_000,
    totalSpawns: 90,
    concurrentCap: 90,
    spawnIntervalMs: 550,
    enemyWeights: weights(0.34, 0.26, 0.22, 0.18, 0),
    eliteChance: 0.12,
    breachIds: ['north', 'south', 'east', 'west', 'hangar'],
  }),
  wave({
    number: 7,
    durationMs: 75_000,
    totalSpawns: 110,
    concurrentCap: 120,
    spawnIntervalMs: 500,
    enemyWeights: weights(0.3, 0.22, 0.2, 0.16, 0.12),
    eliteChance: 0.15,
    breachIds: ['north', 'south', 'east', 'west', 'hangar'],
  }),
  wave({
    number: 8,
    durationMs: 80_000,
    totalSpawns: 130,
    concurrentCap: 150,
    spawnIntervalMs: 450,
    enemyWeights: weights(0.24, 0.22, 0.2, 0.18, 0.16),
    eliteChance: 0.18,
    breachIds: ['north', 'south', 'east', 'west', 'hangar', 'reactor'],
  }),
] satisfies readonly WaveDefinition[]);

export const ARMORY_AFTER_WAVES = Object.freeze([2, 4, 6] as const);
