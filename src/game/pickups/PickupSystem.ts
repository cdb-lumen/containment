import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { ENEMIES } from '../enemies/catalog';
import type { EnemyId } from '../enemies/types';

export type PickupKind = 'credits' | 'health' | 'armor' | 'ammo' | 'grenade';

export const PICKUP_KINDS: readonly PickupKind[] = Object.freeze([
  'credits',
  'health',
  'armor',
  'ammo',
  'grenade',
]);

export const MAX_ACTIVE_PICKUPS = 60;
export const PICKUP_RADIUS = 16;
export const PICKUP_LIFETIME_MS = 30_000;
export const PICKUP_FADE_MS = 5_000;
export const MIN_PICKUP_LIFETIME_MS = 1_000;
export const MAX_PICKUP_LIFETIME_MS = 120_000;

const MAX_REWARD_VALUE = 1_000_000;
const MAX_EFFICIENCY = 10;
const MAX_MAGNET_RANGE = Math.hypot(WORLD_WIDTH, WORLD_HEIGHT);
const MAX_MAGNET_SPEED = 100_000;
const MAX_UPDATE_DELTA_MS = MAX_PICKUP_LIFETIME_MS;
const DEFAULT_MAGNET_RANGE = 180;
const DEFAULT_MAGNET_SPEED = 300;
const DEFAULT_SEED = 0;

export type PickupPoint = Readonly<{
  x: number;
  y: number;
}>;

export type PickupSnapshot = Readonly<{
  id: number;
  kind: PickupKind;
  value: number;
  x: number;
  y: number;
  ageMs: number;
  lifetimeMs: number;
  alpha: number;
}>;

export type PickupSpawnOptions = Readonly<{
  lifetimeMs?: number;
}>;

export type PickupUpdateOptions = Readonly<{
  magnetEnabled?: boolean;
  magnetRange?: number;
  magnetSpeed?: number;
  pickupEfficiency?: number;
}>;

export type PickupCollectionOptions = Readonly<{
  pickupEfficiency?: number;
}>;

export type PickupSpawnResult =
  | Readonly<{ spawned: true; pickup: PickupSnapshot }>
  | Readonly<{ spawned: false; reason: 'invalid' | 'cap' }>;

export type EnemyDropResult =
  | Readonly<{ dropped: true; pickup: PickupSnapshot }>
  | Readonly<{
      dropped: false;
      reason: 'chance' | 'invalid-enemy' | 'invalid-position' | 'cap';
    }>;

export type PickupReward =
  | Readonly<{ kind: 'credits'; amount: number; credits: number }>
  | Readonly<{ kind: 'health'; amount: number }>
  | Readonly<{ kind: 'armor'; amount: number }>
  | Readonly<{ kind: 'ammo'; amount: number }>
  | Readonly<{ kind: 'grenade'; amount: number }>;

export type PickupCollectionResult =
  | Readonly<{
      collected: true;
      pickupId: number;
      reward: PickupReward;
    }>
  | Readonly<{
      collected: false;
      reason: 'not-found' | 'out-of-range' | 'invalid-player';
    }>;

export type PickupExpiredEvent = Readonly<{
  type: 'expired';
  pickupId: number;
}>;

export type PickupUpdateResult = Readonly<{
  expiredIds: readonly number[];
  events: readonly PickupExpiredEvent[];
}>;

type PickupState = {
  id: number;
  kind: PickupKind;
  value: number;
  x: number;
  y: number;
  ageMs: number;
  lifetimeMs: number;
};

type WeightedKind = Readonly<{
  kind: PickupKind;
  weight: number;
}>;

const DROP_KIND_WEIGHTS: readonly WeightedKind[] = Object.freeze([
  Object.freeze({ kind: 'credits', weight: 45 }),
  Object.freeze({ kind: 'health', weight: 20 }),
  Object.freeze({ kind: 'armor', weight: 15 }),
  Object.freeze({ kind: 'ammo', weight: 15 }),
  Object.freeze({ kind: 'grenade', weight: 5 }),
]);

const FIXED_VALUES: Readonly<Record<Exclude<PickupKind, 'credits'>, readonly number[]>> =
  Object.freeze({
    health: Object.freeze([10, 20, 30]),
    armor: Object.freeze([8, 15, 25]),
    ammo: Object.freeze([12, 24, 36]),
    grenade: Object.freeze([1]),
  });

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPickupKind = (value: unknown): value is PickupKind =>
  typeof value === 'string' && PICKUP_KINDS.includes(value as PickupKind);

const isEnemyId = (value: unknown): value is EnemyId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(ENEMIES, value);

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const normalizeSeed = (seed: number): number =>
  Number.isFinite(seed) && Number.isInteger(seed) ? seed >>> 0 : DEFAULT_SEED;

const isValidSeed = (seed: unknown): seed is number =>
  typeof seed === 'number' && Number.isFinite(seed) && Number.isInteger(seed);

const safeLifetime = (value: unknown): number => {
  if (!isFiniteNumber(value) || value <= 0) return PICKUP_LIFETIME_MS;
  return clamp(Math.floor(value), MIN_PICKUP_LIFETIME_MS, MAX_PICKUP_LIFETIME_MS);
};

const safeEfficiency = (value: unknown): number => {
  if (!isFiniteNumber(value) || value < 1) return 1;
  return clamp(value, 1, MAX_EFFICIENCY);
};

const safeRewardAmount = (value: number, efficiency: number): number => {
  const multiplied = value * efficiency;
  if (!Number.isFinite(multiplied)) return MAX_REWARD_VALUE;
  return clamp(Math.round(multiplied), 0, MAX_REWARD_VALUE);
};

const alphaFor = (pickup: PickupState): number => {
  const remainingMs = pickup.lifetimeMs - pickup.ageMs;
  if (remainingMs <= 0) return 0;
  if (remainingMs >= PICKUP_FADE_MS) return 1;
  return clamp(remainingMs / PICKUP_FADE_MS, 0, 1);
};

const snapshotOf = (pickup: PickupState): PickupSnapshot =>
  Object.freeze({
    id: pickup.id,
    kind: pickup.kind,
    value: pickup.value,
    x: pickup.x,
    y: pickup.y,
    ageMs: pickup.ageMs,
    lifetimeMs: pickup.lifetimeMs,
    alpha: alphaFor(pickup),
  });

const emptyUpdateResult = (): PickupUpdateResult =>
  Object.freeze({
    expiredIds: Object.freeze([]) as readonly number[],
    events: Object.freeze([]) as readonly PickupExpiredEvent[],
  });

const noSpawn = (reason: 'invalid' | 'cap'): PickupSpawnResult =>
  Object.freeze({ spawned: false, reason });

const noDrop = (
  reason: 'chance' | 'invalid-enemy' | 'invalid-position' | 'cap',
): EnemyDropResult => Object.freeze({ dropped: false, reason });

const noCollection = (
  reason: 'not-found' | 'out-of-range' | 'invalid-player',
): PickupCollectionResult => Object.freeze({ collected: false, reason });

export const applyPickupCredits = (
  currentCredits: number,
  collection: PickupCollectionResult,
): number => {
  if (!isFiniteNumber(currentCredits) || currentCredits < 0) return 0;
  const current = clamp(Math.floor(currentCredits), 0, Number.MAX_SAFE_INTEGER);
  if (!collection.collected || collection.reward.kind !== 'credits') return current;
  return clamp(current + collection.reward.credits, 0, Number.MAX_SAFE_INTEGER);
};

export class PickupSystem {
  readonly #active = new Map<number, PickupState>();
  #initialSeed: number;
  #randomState: number;
  #nextId = 1;

  constructor(seed = DEFAULT_SEED) {
    this.#initialSeed = normalizeSeed(seed);
    this.#randomState = this.#initialSeed;
  }

  get snapshot(): readonly PickupSnapshot[] {
    return this.getSnapshot();
  }

  getSnapshot(): readonly PickupSnapshot[] {
    return Object.freeze(Array.from(this.#active.values(), snapshotOf));
  }

  spawn(
    kind: PickupKind,
    value: number,
    x: number,
    y: number,
    options: PickupSpawnOptions = {},
  ): PickupSpawnResult {
    const safeOptions = options !== null && typeof options === 'object' ? options : {};
    if (
      !isPickupKind(kind) ||
      !isFiniteNumber(value) ||
      value < 0 ||
      !isFiniteNumber(x) ||
      !isFiniteNumber(y)
    ) {
      return noSpawn('invalid');
    }
    if (this.#active.size >= MAX_ACTIVE_PICKUPS) return noSpawn('cap');

    const pickup: PickupState = {
      id: this.#allocateId(),
      kind,
      value: clamp(Math.round(value), 0, MAX_REWARD_VALUE),
      x: clamp(x, PICKUP_RADIUS, WORLD_WIDTH - PICKUP_RADIUS),
      y: clamp(y, PICKUP_RADIUS, WORLD_HEIGHT - PICKUP_RADIUS),
      ageMs: 0,
      lifetimeMs: safeLifetime(safeOptions.lifetimeMs),
    };
    this.#active.set(pickup.id, pickup);
    return Object.freeze({ spawned: true, pickup: snapshotOf(pickup) });
  }

  rollEnemyDrop(enemyId: EnemyId, x: number, y: number): EnemyDropResult {
    if (!isEnemyId(enemyId)) return noDrop('invalid-enemy');
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return noDrop('invalid-position');
    if (this.#active.size >= MAX_ACTIVE_PICKUPS) return noDrop('cap');

    const enemy = ENEMIES[enemyId];
    const dropChance = clamp(
      isFiniteNumber(enemy.dropChance) ? enemy.dropChance : 0,
      0,
      1,
    );
    if (this.#random() >= dropChance) return noDrop('chance');

    const kind = this.#randomKind();
    const value = this.#randomValue(kind, enemy.creditReward);
    const result = this.spawn(kind, value, x, y);
    if (!result.spawned) return noDrop(result.reason === 'cap' ? 'cap' : 'invalid-position');
    return Object.freeze({ dropped: true, pickup: result.pickup });
  }

  update(
    deltaMs: number,
    player: PickupPoint,
    options: PickupUpdateOptions = {},
  ): PickupUpdateResult {
    if (!isFiniteNumber(deltaMs) || deltaMs < 0) return emptyUpdateResult();
    const safeOptions = options !== null && typeof options === 'object' ? options : {};
    const safeDeltaMs = clamp(deltaMs, 0, MAX_UPDATE_DELTA_MS);
    const playerIsFinite =
      player !== null &&
      typeof player === 'object' &&
      isFiniteNumber(player.x) &&
      isFiniteNumber(player.y);
    const magnetEnabled = safeOptions.magnetEnabled === true && playerIsFinite;
    const magnetRange = this.#safeMagnetRange(safeOptions.magnetRange);
    const magnetSpeed = this.#safeMagnetSpeed(safeOptions.magnetSpeed);
    const expiredIds: number[] = [];
    const events: PickupExpiredEvent[] = [];

    for (const pickup of this.#active.values()) {
      pickup.ageMs = Math.min(pickup.lifetimeMs, pickup.ageMs + safeDeltaMs);
      if (pickup.ageMs >= pickup.lifetimeMs) {
        this.#active.delete(pickup.id);
        expiredIds.push(pickup.id);
        events.push(Object.freeze({ type: 'expired', pickupId: pickup.id }));
        continue;
      }
      if (magnetEnabled && magnetRange !== null && magnetSpeed !== null) {
        this.#moveTowardPlayer(pickup, player, safeDeltaMs, magnetRange, magnetSpeed);
      }
    }

    return Object.freeze({
      expiredIds: Object.freeze(expiredIds),
      events: Object.freeze(events),
    });
  }

  collect(
    pickupId: number,
    player: PickupPoint,
    options: PickupCollectionOptions = {},
  ): PickupCollectionResult {
    const safeOptions = options !== null && typeof options === 'object' ? options : {};
    const pickup =
      Number.isSafeInteger(pickupId) && pickupId > 0 ? this.#active.get(pickupId) : undefined;
    if (pickup === undefined) return noCollection('not-found');
    if (
      player === null ||
      typeof player !== 'object' ||
      !isFiniteNumber(player.x) ||
      !isFiniteNumber(player.y)
    ) {
      return noCollection('invalid-player');
    }

    const distance = Math.hypot(player.x - pickup.x, player.y - pickup.y);
    if (!Number.isFinite(distance) || distance > PICKUP_RADIUS) {
      return noCollection('out-of-range');
    }

    this.#active.delete(pickup.id);
    const reward = this.#rewardFor(pickup, safeEfficiency(safeOptions.pickupEfficiency));
    return Object.freeze({
      collected: true,
      pickupId: pickup.id,
      reward,
    });
  }

  remove(pickupId: number): boolean {
    if (!Number.isSafeInteger(pickupId) || pickupId <= 0) return false;
    return this.#active.delete(pickupId);
  }

  reset(seed?: number): void {
    if (seed !== undefined && isValidSeed(seed)) {
      this.#initialSeed = normalizeSeed(seed);
    }
    this.#randomState = this.#initialSeed;
    this.#nextId = 1;
    this.#active.clear();
  }

  #allocateId(): number {
    let candidate = this.#nextId;
    while (this.#active.has(candidate)) {
      candidate = candidate >= Number.MAX_SAFE_INTEGER ? 1 : candidate + 1;
    }
    this.#nextId = candidate >= Number.MAX_SAFE_INTEGER ? 1 : candidate + 1;
    return candidate;
  }

  #random(): number {
    this.#randomState = (this.#randomState + 0x6d2b79f5) >>> 0;
    let value = this.#randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }

  #randomKind(): PickupKind {
    const totalWeight = DROP_KIND_WEIGHTS.reduce((total, entry) => total + entry.weight, 0);
    let roll = this.#random() * totalWeight;
    for (const entry of DROP_KIND_WEIGHTS) {
      roll -= entry.weight;
      if (roll < 0) return entry.kind;
    }
    return DROP_KIND_WEIGHTS[DROP_KIND_WEIGHTS.length - 1].kind;
  }

  #randomValue(kind: PickupKind, enemyCredits: number): number {
    if (kind === 'credits') {
      const safeCredits = isFiniteNumber(enemyCredits) && enemyCredits >= 0 ? enemyCredits : 0;
      const factors = [0.4, 0.7, 1] as const;
      const factor = factors[Math.floor(this.#random() * factors.length)];
      return clamp(Math.max(1, Math.round(safeCredits * factor)), 0, MAX_REWARD_VALUE);
    }
    const values = FIXED_VALUES[kind];
    return values[Math.floor(this.#random() * values.length)];
  }

  #safeMagnetRange(value: unknown): number | null {
    if (value === undefined) return DEFAULT_MAGNET_RANGE;
    if (!isFiniteNumber(value) || value <= 0) return null;
    return clamp(value, PICKUP_RADIUS, MAX_MAGNET_RANGE);
  }

  #safeMagnetSpeed(value: unknown): number | null {
    if (value === undefined) return DEFAULT_MAGNET_SPEED;
    if (!isFiniteNumber(value) || value <= 0) return null;
    return clamp(value, 0, MAX_MAGNET_SPEED);
  }

  #moveTowardPlayer(
    pickup: PickupState,
    player: PickupPoint,
    deltaMs: number,
    range: number,
    speed: number,
  ): void {
    const deltaX = player.x - pickup.x;
    const deltaY = player.y - pickup.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (!Number.isFinite(distance) || distance <= 0 || distance > range) return;

    const maximumStep = speed * (deltaMs / 1_000);
    const step = Math.min(distance, Number.isFinite(maximumStep) ? maximumStep : distance);
    const scale = step / distance;
    pickup.x = clamp(pickup.x + deltaX * scale, PICKUP_RADIUS, WORLD_WIDTH - PICKUP_RADIUS);
    pickup.y = clamp(pickup.y + deltaY * scale, PICKUP_RADIUS, WORLD_HEIGHT - PICKUP_RADIUS);
  }

  #rewardFor(pickup: PickupState, efficiency: number): PickupReward {
    const amount = safeRewardAmount(pickup.value, efficiency);
    if (pickup.kind === 'credits') {
      return Object.freeze({ kind: 'credits', amount, credits: amount });
    }
    return Object.freeze({ kind: pickup.kind, amount });
  }
}
