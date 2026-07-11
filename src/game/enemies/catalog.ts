import type {
  EnemyDefinition,
  EnemyId,
  StandardEnemyId,
} from './types';

export const STANDARD_ENEMY_IDS = Object.freeze(
  [
    'crawler',
    'brute',
    'spitter',
    'stalker',
    'carrier',
  ] as const satisfies readonly StandardEnemyId[],
);

const enemy = (definition: EnemyDefinition): Readonly<EnemyDefinition> =>
  Object.freeze(definition);

export const ENEMIES: Readonly<
  Record<EnemyId, Readonly<EnemyDefinition>>
> = Object.freeze({
  crawler: enemy({
    id: 'crawler',
    label: 'Swarm crawler',
    maxHealth: 42,
    speed: 150,
    radius: 14,
    contactDamage: 12,
    attackCooldownMs: 600,
    creditReward: 5,
    dropChance: 0.08,
    behavior: 'pursuit',
  }),
  brute: enemy({
    id: 'brute',
    label: 'Brute',
    maxHealth: 320,
    speed: 60,
    radius: 28,
    contactDamage: 35,
    attackCooldownMs: 1_200,
    creditReward: 35,
    dropChance: 0.3,
    behavior: 'armored-charge',
  }),
  spitter: enemy({
    id: 'spitter',
    label: 'Spitter',
    maxHealth: 100,
    speed: 78,
    radius: 18,
    contactDamage: 10,
    attackCooldownMs: 1_500,
    creditReward: 18,
    dropChance: 0.18,
    behavior: 'ranged-hazard',
  }),
  stalker: enemy({
    id: 'stalker',
    label: 'Stalker',
    maxHealth: 120,
    speed: 125,
    radius: 17,
    contactDamage: 22,
    attackCooldownMs: 900,
    creditReward: 25,
    dropChance: 0.22,
    behavior: 'flank-camouflage',
  }),
  carrier: enemy({
    id: 'carrier',
    label: 'Brood carrier',
    maxHealth: 220,
    speed: 70,
    radius: 24,
    contactDamage: 18,
    attackCooldownMs: 1_100,
    creditReward: 30,
    dropChance: 0.28,
    behavior: 'spawn-on-death',
  }),
  queen: enemy({
    id: 'queen',
    label: 'Teleporter queen',
    maxHealth: 5_000,
    speed: 35,
    radius: 76,
    contactDamage: 50,
    attackCooldownMs: 1_300,
    creditReward: 1_000,
    dropChance: 0,
    behavior: 'boss-phases',
  }),
});
