import { MAX_ACTIVE_ENEMIES } from '../constants';
import { ENEMIES } from './catalog';

export const QUEEN_ARMORED_DURATION_MS = 2_000;
export const QUEEN_NEST_SPAWN_DURATION_MS = 1_000;
export const QUEEN_VULNERABLE_DURATION_MS = 4_000;
export const MAX_QUEEN_UPDATE_DELTA_MS = 10_000;
export const MAX_QUEEN_NESTS = 6;
export const NEST_MAX_HEALTH = 300;
export const NEST_DISTANCE = 210;
export const AREA_ATTACK_RANGE = 900;
export const AREA_ATTACK_RADIUS = 120;
export const AREA_ATTACK_DELAY_MS = 900;

export type QueenStage = 1 | 2 | 3;
export type QueenBossPhase =
  | 'idle'
  | 'armored'
  | 'nest-spawn'
  | 'vulnerable'
  | 'defeated';

export const NEST_TARGET_COUNT: Readonly<Record<QueenStage, number>> = Object.freeze({
  1: 2,
  2: 4,
  3: 6,
});

export const NEST_SPAWN_COOLDOWN_MS: Readonly<Record<QueenStage, number>> =
  Object.freeze({
    1: 1_800,
    2: 1_300,
    3: 900,
  });

export const AREA_ATTACK_COOLDOWN_MS: Readonly<Record<QueenStage, number>> =
  Object.freeze({
    1: 2_800,
    2: 2_200,
    3: 1_600,
  });

export type QueenPlayerState = Readonly<{
  x: number;
  y: number;
  radius?: number;
}>;

export type QueenDamageTarget =
  | Readonly<{ type: 'queen' }>
  | Readonly<{ type: 'nest'; id: number }>;

export type QueenNestSnapshot = Readonly<{
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  spawnCooldownRemainingMs: number;
}>;

export type AreaTelegraphSnapshot = Readonly<{
  id: number;
  targetX: number;
  targetY: number;
  radius: number;
  delayRemainingMs: number;
  damage: number;
}>;

export type QueenBossSnapshot = Readonly<{
  active: boolean;
  defeated: boolean;
  phase: QueenBossPhase;
  stage: QueenStage;
  x: number;
  y: number;
  rotation: number;
  health: number;
  maxHealth: number;
  vulnerable: boolean;
  phaseRemainingMs: number;
  nests: readonly QueenNestSnapshot[];
  pendingTelegraph: AreaTelegraphSnapshot | null;
}>;

export type AreaTelegraphEvent = Readonly<{
  type: 'area-telegraph';
  eventId: number;
  telegraphId: number;
  x: number;
  y: number;
  radius: number;
  delayMs: number;
  damage: number;
}>;

export type AreaAttackEvent = Readonly<{
  type: 'area-attack';
  eventId: number;
  telegraphId: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
}>;

export type MinionSpawnRequestEvent = Readonly<{
  type: 'minion-spawn-request';
  eventId: number;
  requestId: number;
  nestId: number;
  enemyType: 'crawler';
  x: number;
  y: number;
}>;

export type NestDestroyedEvent = Readonly<{
  type: 'nest-destroyed';
  eventId: number;
  nestId: number;
  x: number;
  y: number;
}>;

export type QueenDefeatedEvent = Readonly<{
  type: 'queen-defeated';
  eventId: number;
  x: number;
  y: number;
  reward: number;
}>;

export type QueenBossEvent =
  | AreaTelegraphEvent
  | AreaAttackEvent
  | MinionSpawnRequestEvent
  | NestDestroyedEvent
  | QueenDefeatedEvent;

export type QueenDamageResult = Readonly<{
  applied: boolean;
  blockedByArmor: boolean;
  damage: number;
  destroyed: boolean;
  defeated: boolean;
  events: readonly QueenBossEvent[];
}>;

type QueenNestState = {
  id: number;
  slot: number;
  x: number;
  y: number;
  health: number;
  spawnCooldownRemainingMs: number;
};

type AreaTelegraphState = {
  id: number;
  targetX: number;
  targetY: number;
  radius: number;
  delayRemainingMs: number;
  damage: number;
};

const EMPTY_EVENTS: readonly QueenBossEvent[] = Object.freeze([]);

const freezeEvents = (events: QueenBossEvent[]): readonly QueenBossEvent[] =>
  Object.freeze(events.map((event) => Object.freeze(event)));

const damageResult = (
  applied: boolean,
  blockedByArmor: boolean,
  damage: number,
  destroyed: boolean,
  defeated: boolean,
  events: readonly QueenBossEvent[] = EMPTY_EVENTS,
): QueenDamageResult =>
  Object.freeze({
    applied,
    blockedByArmor,
    damage,
    destroyed,
    defeated,
    events,
  });

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const sanitizeDelta = (deltaMs: number): number => {
  if (!isFiniteNumber(deltaMs) || deltaMs < 0) return 0;
  return Math.min(deltaMs, MAX_QUEEN_UPDATE_DELTA_MS);
};

const sanitizeOccupiedCapacity = (value: number): number => {
  if (!isFiniteNumber(value)) return MAX_ACTIVE_ENEMIES;
  return Math.floor(Math.min(MAX_ACTIVE_ENEMIES, Math.max(0, value)));
};

const validPlayer = (value: unknown): value is QueenPlayerState => {
  if (typeof value !== 'object' || value === null) return false;
  const player = value as Partial<QueenPlayerState>;
  return isFiniteNumber(player.x) && isFiniteNumber(player.y);
};

export class QueenBossSystem {
  readonly #nests = new Map<number, QueenNestState>();
  #phase: QueenBossPhase = 'idle';
  #x = 0;
  #y = 0;
  #rotation = 0;
  #health = ENEMIES.queen.maxHealth;
  #phaseRemainingMs = 0;
  #pendingTelegraph: AreaTelegraphState | null = null;
  #areaCooldownRemainingMs = 0;
  #nextNestId = 1;
  #nextEventId = 1;
  #nextTelegraphId = 1;
  #nextRequestId = 1;

  get snapshot(): QueenBossSnapshot {
    return this.getSnapshot();
  }

  getSnapshot(): QueenBossSnapshot {
    const nests = Object.freeze(
      [...this.#nests.values()].map((nest) =>
        Object.freeze({
          id: nest.id,
          x: nest.x,
          y: nest.y,
          health: nest.health,
          maxHealth: NEST_MAX_HEALTH,
          spawnCooldownRemainingMs: nest.spawnCooldownRemainingMs,
        }),
      ),
    );
    const pendingTelegraph = this.#pendingTelegraph
      ? Object.freeze({
          id: this.#pendingTelegraph.id,
          targetX: this.#pendingTelegraph.targetX,
          targetY: this.#pendingTelegraph.targetY,
          radius: this.#pendingTelegraph.radius,
          delayRemainingMs: this.#pendingTelegraph.delayRemainingMs,
          damage: this.#pendingTelegraph.damage,
        })
      : null;

    return Object.freeze({
      active: this.#isActive(),
      defeated: this.#phase === 'defeated',
      phase: this.#phase,
      stage: this.#stage(),
      x: this.#x,
      y: this.#y,
      rotation: this.#rotation,
      health: this.#health,
      maxHealth: ENEMIES.queen.maxHealth,
      vulnerable: this.#phase === 'vulnerable',
      phaseRemainingMs: this.#phaseRemainingMs,
      nests,
      pendingTelegraph,
    });
  }

  start(x: number, y: number): boolean {
    if (this.#phase !== 'idle' || !isFiniteNumber(x) || !isFiniteNumber(y)) {
      return false;
    }

    this.#x = x;
    this.#y = y;
    this.#rotation = 0;
    this.#health = ENEMIES.queen.maxHealth;
    this.#phase = 'armored';
    this.#phaseRemainingMs = QUEEN_ARMORED_DURATION_MS;
    this.#areaCooldownRemainingMs = 0;
    return true;
  }

  update(
    deltaMs: number,
    player: QueenPlayerState,
    occupiedEnemyCapacity: number,
  ): readonly QueenBossEvent[] {
    if (
      !this.#isActive() ||
      !isFiniteNumber(deltaMs) ||
      deltaMs < 0 ||
      !validPlayer(player)
    ) {
      return EMPTY_EVENTS;
    }

    const delta = sanitizeDelta(deltaMs);
    const occupiedCapacity = sanitizeOccupiedCapacity(occupiedEnemyCapacity);
    this.#rotation = Math.atan2(player.y - this.#y, player.x - this.#x);

    const nestsAtStart = [...this.#nests.keys()];
    this.#advancePhase(delta, occupiedCapacity);

    const events: QueenBossEvent[] = [];
    this.#advanceNestCooldowns(
      delta,
      nestsAtStart,
      occupiedCapacity,
      events,
    );
    this.#advanceAreaAttack(delta, player, events);
    return freezeEvents(events);
  }

  applyDamage(target: QueenDamageTarget, amount: number): QueenDamageResult {
    if (!this.#isActive() || !isFiniteNumber(amount) || amount <= 0) {
      return damageResult(false, false, 0, false, false);
    }
    if (typeof target !== 'object' || target === null || !('type' in target)) {
      return damageResult(false, false, 0, false, false);
    }

    if (target.type === 'queen') return this.#damageQueen(amount);
    if (target.type === 'nest' && Number.isSafeInteger(target.id)) {
      return this.#damageNest(target.id, amount);
    }
    return damageResult(false, false, 0, false, false);
  }

  reset(): void {
    this.#nests.clear();
    this.#phase = 'idle';
    this.#x = 0;
    this.#y = 0;
    this.#rotation = 0;
    this.#health = ENEMIES.queen.maxHealth;
    this.#phaseRemainingMs = 0;
    this.#pendingTelegraph = null;
    this.#areaCooldownRemainingMs = 0;
    this.#nextNestId = 1;
    this.#nextEventId = 1;
    this.#nextTelegraphId = 1;
    this.#nextRequestId = 1;
  }

  #isActive(): boolean {
    return this.#phase !== 'idle' && this.#phase !== 'defeated';
  }

  #stage(): QueenStage {
    if (this.#health > ENEMIES.queen.maxHealth * (2 / 3)) return 1;
    if (this.#health > ENEMIES.queen.maxHealth * (1 / 3)) return 2;
    return 3;
  }

  #advancePhase(deltaMs: number, occupiedEnemyCapacity: number): void {
    let remainingDelta = deltaMs;
    while (this.#isActive() && remainingDelta >= this.#phaseRemainingMs) {
      remainingDelta -= this.#phaseRemainingMs;
      this.#enterNextPhase(occupiedEnemyCapacity);
      if (remainingDelta === 0) return;
    }
    if (this.#isActive()) {
      this.#phaseRemainingMs = Math.max(0, this.#phaseRemainingMs - remainingDelta);
    }
  }

  #enterNextPhase(occupiedEnemyCapacity: number): void {
    if (this.#phase === 'armored') {
      this.#phase = 'nest-spawn';
      this.#phaseRemainingMs = QUEEN_NEST_SPAWN_DURATION_MS;
      this.#ensureNestTarget(occupiedEnemyCapacity);
      return;
    }
    if (this.#phase === 'nest-spawn') {
      this.#phase = 'vulnerable';
      this.#phaseRemainingMs = QUEEN_VULNERABLE_DURATION_MS;
      return;
    }
    if (this.#phase === 'vulnerable') {
      this.#phase = 'armored';
      this.#phaseRemainingMs = QUEEN_ARMORED_DURATION_MS;
    }
  }

  #ensureNestTarget(occupiedEnemyCapacity: number): void {
    const stage = this.#stage();
    const availableNestSlots = Math.max(
      0,
      MAX_ACTIVE_ENEMIES - occupiedEnemyCapacity - 1,
    );
    const target = Math.min(
      MAX_QUEEN_NESTS,
      NEST_TARGET_COUNT[stage],
      availableNestSlots,
    );
    const pressureCooldown = NEST_SPAWN_COOLDOWN_MS[stage];

    for (const nest of this.#nests.values()) {
      nest.spawnCooldownRemainingMs = Math.min(
        nest.spawnCooldownRemainingMs,
        pressureCooldown,
      );
    }

    const occupiedSlots = new Set([...this.#nests.values()].map(({ slot }) => slot));
    for (let slot = 0; this.#nests.size < target && slot < MAX_QUEEN_NESTS; slot += 1) {
      if (occupiedSlots.has(slot)) continue;
      const angle = (Math.PI * 2 * slot) / MAX_QUEEN_NESTS;
      const nest: QueenNestState = {
        id: this.#nextNestId,
        slot,
        x: this.#x + Math.cos(angle) * NEST_DISTANCE,
        y: this.#y + Math.sin(angle) * NEST_DISTANCE,
        health: NEST_MAX_HEALTH,
        spawnCooldownRemainingMs: pressureCooldown,
      };
      this.#nextNestId += 1;
      occupiedSlots.add(slot);
      this.#nests.set(nest.id, nest);
    }
  }

  #advanceNestCooldowns(
    deltaMs: number,
    nestsAtStart: readonly number[],
    occupiedEnemyCapacity: number,
    events: QueenBossEvent[],
  ): void {
    let availableSlots = Math.max(
      0,
      MAX_ACTIVE_ENEMIES - occupiedEnemyCapacity - 1 - this.#nests.size,
    );
    const cooldown = NEST_SPAWN_COOLDOWN_MS[this.#stage()];

    for (const nestId of nestsAtStart) {
      const nest = this.#nests.get(nestId);
      if (!nest) continue;
      nest.spawnCooldownRemainingMs -= deltaMs;

      while (nest.spawnCooldownRemainingMs <= 0) {
        if (availableSlots <= 0) {
          nest.spawnCooldownRemainingMs = 0;
          break;
        }
        events.push({
          type: 'minion-spawn-request',
          eventId: this.#takeEventId(),
          requestId: this.#nextRequestId,
          nestId: nest.id,
          enemyType: 'crawler',
          x: nest.x,
          y: nest.y,
        });
        this.#nextRequestId += 1;
        availableSlots -= 1;
        nest.spawnCooldownRemainingMs += cooldown;
      }
    }
  }

  #advanceAreaAttack(
    deltaMs: number,
    player: QueenPlayerState | null,
    events: QueenBossEvent[],
  ): void {
    const pendingAtStart = this.#pendingTelegraph;
    if (pendingAtStart) {
      pendingAtStart.delayRemainingMs = Math.max(
        0,
        pendingAtStart.delayRemainingMs - deltaMs,
      );
      if (pendingAtStart.delayRemainingMs === 0) {
        events.push({
          type: 'area-attack',
          eventId: this.#takeEventId(),
          telegraphId: pendingAtStart.id,
          x: pendingAtStart.targetX,
          y: pendingAtStart.targetY,
          radius: pendingAtStart.radius,
          damage: pendingAtStart.damage,
        });
        this.#pendingTelegraph = null;
        this.#areaCooldownRemainingMs = AREA_ATTACK_COOLDOWN_MS[this.#stage()];
      }
      return;
    }

    this.#areaCooldownRemainingMs = Math.max(
      0,
      this.#areaCooldownRemainingMs - deltaMs,
    );
    if (
      this.#areaCooldownRemainingMs > 0 ||
      player === null ||
      !this.#playerInArenaRange(player)
    ) {
      return;
    }

    const telegraph: AreaTelegraphState = {
      id: this.#nextTelegraphId,
      targetX: player.x,
      targetY: player.y,
      radius: AREA_ATTACK_RADIUS,
      delayRemainingMs: AREA_ATTACK_DELAY_MS,
      damage: ENEMIES.queen.contactDamage,
    };
    this.#nextTelegraphId += 1;
    this.#pendingTelegraph = telegraph;
    events.push({
      type: 'area-telegraph',
      eventId: this.#takeEventId(),
      telegraphId: telegraph.id,
      x: telegraph.targetX,
      y: telegraph.targetY,
      radius: telegraph.radius,
      delayMs: AREA_ATTACK_DELAY_MS,
      damage: telegraph.damage,
    });
  }

  #playerInArenaRange(player: QueenPlayerState): boolean {
    const radius = isFiniteNumber(player.radius) && player.radius > 0 ? player.radius : 0;
    const distance = Math.hypot(player.x - this.#x, player.y - this.#y);
    return Number.isFinite(distance) && distance <= AREA_ATTACK_RANGE + radius;
  }

  #damageQueen(amount: number): QueenDamageResult {
    if (this.#phase !== 'vulnerable') {
      const blocked = this.#phase === 'armored' || this.#phase === 'nest-spawn';
      return damageResult(false, blocked, 0, false, false);
    }

    const appliedDamage = Math.min(this.#health, amount);
    this.#health = Math.max(0, this.#health - appliedDamage);
    if (this.#health !== 0) {
      return damageResult(true, false, appliedDamage, false, false);
    }

    this.#phase = 'defeated';
    this.#phaseRemainingMs = 0;
    this.#pendingTelegraph = null;
    this.#areaCooldownRemainingMs = 0;
    const events = freezeEvents([
      {
        type: 'queen-defeated',
        eventId: this.#takeEventId(),
        x: this.#x,
        y: this.#y,
        reward: ENEMIES.queen.creditReward,
      },
    ]);
    return damageResult(true, false, appliedDamage, true, true, events);
  }

  #damageNest(id: number, amount: number): QueenDamageResult {
    const nest = this.#nests.get(id);
    if (!nest) return damageResult(false, false, 0, false, false);

    const appliedDamage = Math.min(nest.health, amount);
    nest.health = Math.max(0, nest.health - appliedDamage);
    if (nest.health !== 0) {
      return damageResult(true, false, appliedDamage, false, false);
    }

    this.#nests.delete(id);
    const events = freezeEvents([
      {
        type: 'nest-destroyed',
        eventId: this.#takeEventId(),
        nestId: nest.id,
        x: nest.x,
        y: nest.y,
      },
    ]);
    return damageResult(true, false, appliedDamage, true, false, events);
  }

  #takeEventId(): number {
    const id = this.#nextEventId;
    this.#nextEventId += 1;
    return id;
  }
}
