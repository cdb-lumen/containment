import {
  MAX_ACTIVE_ENEMIES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../constants';
import { ENEMIES, STANDARD_ENEMY_IDS } from './catalog';
import type { StandardEnemyId } from './types';

const ELITE_MULTIPLIER = 2;
const BRUTE_ARMOR_RATIO = 0.5;
const BRUTE_KNOCKBACK_RESISTANCE = 0.2;
const CARRIER_CHILD_CAP = 3;
const DEFAULT_PLAYER_RADIUS = 16;
const NEAR_DECISION_INTERVAL_MS = 50;
const FAR_DECISION_INTERVAL_MS = 250;
const FAR_DECISION_DISTANCE = 800;
const MAX_MOVEMENT_DELTA_MS = 250;
const MAX_TIMER_DELTA_MS = 2_000;
const SEPARATION_WEIGHT = 0.7;
const SPITTER_MIN_RANGE = 240;
const SPITTER_MAX_RANGE = 360;
const SPITTER_ATTACK_MIN_RANGE = 180;
const SPITTER_ATTACK_MAX_RANGE = 420;
const STALKER_FLANK_DISTANCE = 180;
const STALKER_CAMOUFLAGED_MS = 2_000;
const STALKER_REVEALED_MS = 1_000;
const CAMOUFLAGED_ALPHA = 0.35;
const MAX_KNOCKBACK = 120;

export type EnemyPlayerState = {
  readonly x: number;
  readonly y: number;
  readonly radius?: number;
};

export type CollisionSteeringContext = Readonly<{
  enemyId: number;
  enemyType: StandardEnemyId;
  radius: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}>;

export type EnemySystemOptions = Readonly<{
  canMove?: (context: CollisionSteeringContext) => boolean;
}>;

export type ContactAttackEvent = Readonly<{
  type: 'contact-attack';
  enemyId: number;
  enemyType: StandardEnemyId;
  damage: number;
}>;

export type HazardAttackEvent = Readonly<{
  type: 'hazard-attack';
  enemyId: number;
  enemyType: 'spitter';
  damage: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}>;

export type EnemyDeathEvent = Readonly<{
  type: 'death';
  enemyId: number;
  enemyType: StandardEnemyId;
  elite: boolean;
  x: number;
  y: number;
  reward: number;
  dropChance: number;
}>;

export type EnemySpawnRequestEvent = Readonly<{
  type: 'spawn-request';
  sourceEnemyId: number;
  enemyType: 'crawler';
  x: number;
  y: number;
  elite: false;
  requestIndex: number;
}>;

export type EnemyEvent =
  | ContactAttackEvent
  | HazardAttackEvent
  | EnemyDeathEvent
  | EnemySpawnRequestEvent;

export type CamouflageState = 'camouflaged' | 'revealed' | 'none';

export type EnemySnapshot = Readonly<{
  id: number;
  type: StandardEnemyId;
  elite: boolean;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  radius: number;
  speed: number;
  contactDamage: number;
  creditReward: number;
  dropChance: number;
  contactCooldownRemainingMs: number;
  rangedCooldownRemainingMs: number;
  decisionIntervalMs: number;
  decisionCooldownRemainingMs: number;
  decisionVersion: number;
  camouflageState: CamouflageState;
  camouflageRemainingMs: number;
  alpha: number;
  reservedChildren: number;
}>;

export type EnemySystemSnapshot = Readonly<{
  activeCount: number;
  reservedCount: number;
  enemies: readonly EnemySnapshot[];
}>;

export type SpawnResult =
  | Readonly<{ spawned: true; enemy: EnemySnapshot }>
  | Readonly<{
      spawned: false;
      reason: 'capacity' | 'invalid-position' | 'invalid-type';
    }>;

export type DamageResult = Readonly<{
  applied: boolean;
  absorbedByArmor: number;
  healthDamage: number;
  died: boolean;
  appliedKnockback: Readonly<{ x: number; y: number }>;
  events: readonly EnemyEvent[];
}>;

type EnemyState = {
  id: number;
  type: StandardEnemyId;
  elite: boolean;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  radius: number;
  speed: number;
  contactDamage: number;
  creditReward: number;
  dropChance: number;
  contactCooldownRemainingMs: number;
  rangedCooldownRemainingMs: number;
  decisionIntervalMs: number;
  decisionCooldownRemainingMs: number;
  decisionVersion: number;
  camouflageState: CamouflageState;
  camouflageRemainingMs: number;
  alpha: number;
  reservedChildren: number;
};

type Vector = { x: number; y: number };

const freezeEvent = <T extends EnemyEvent>(event: T): T => Object.freeze(event);

const freezeEvents = (events: EnemyEvent[]): readonly EnemyEvent[] =>
  Object.freeze(events.map((event) => freezeEvent(event)));

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const normalized = (x: number, y: number): Vector => {
  const magnitude = Math.hypot(x, y);
  if (!Number.isFinite(magnitude) || magnitude === 0) return { x: 0, y: 0 };
  return { x: x / magnitude, y: y / magnitude };
};

const isStandardEnemyId = (value: unknown): value is StandardEnemyId =>
  typeof value === 'string' && STANDARD_ENEMY_IDS.includes(value as StandardEnemyId);

export class EnemySystem {
  readonly #enemies = new Map<number, EnemyState>();
  readonly #listeners = new Set<(event: EnemyEvent) => void>();
  readonly #canMove?: (context: CollisionSteeringContext) => boolean;
  #nextId = 1;
  #reservedCount = 0;

  constructor(options: EnemySystemOptions = {}) {
    this.#canMove = options.canMove;
  }

  get activeCount(): number {
    return this.#enemies.size;
  }

  get reservedCount(): number {
    return this.#reservedCount;
  }

  get snapshot(): EnemySystemSnapshot {
    return this.getSystemSnapshot();
  }

  getSystemSnapshot(): EnemySystemSnapshot {
    const enemies = Object.freeze(
      [...this.#enemies.values()].map((enemy) => this.#snapshotEnemy(enemy)),
    );
    return Object.freeze({
      activeCount: this.activeCount,
      reservedCount: this.reservedCount,
      enemies,
    });
  }

  getSnapshot(id: number): EnemySnapshot | null {
    if (!Number.isSafeInteger(id)) return null;
    const enemy = this.#enemies.get(id);
    return enemy ? this.#snapshotEnemy(enemy) : null;
  }

  spawn(type: StandardEnemyId, x: number, y: number, elite = false): SpawnResult {
    if (!isStandardEnemyId(type)) {
      return Object.freeze({ spawned: false, reason: 'invalid-type' });
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return Object.freeze({ spawned: false, reason: 'invalid-position' });
    }
    if (this.activeCount + this.reservedCount >= MAX_ACTIVE_ENEMIES) {
      return Object.freeze({ spawned: false, reason: 'capacity' });
    }

    const definition = ENEMIES[type];
    const multiplier = elite === true ? ELITE_MULTIPLIER : 1;
    const maxHealth = definition.maxHealth * multiplier;
    const maxArmor = type === 'brute' ? maxHealth * BRUTE_ARMOR_RATIO : 0;
    const clampedX = clamp(x, 0, WORLD_WIDTH);
    const clampedY = clamp(y, 0, WORLD_HEIGHT);
    const availableReservations =
      MAX_ACTIVE_ENEMIES - (this.activeCount + this.reservedCount + 1);
    const reservedChildren =
      type === 'carrier' ? Math.min(CARRIER_CHILD_CAP, availableReservations) : 0;
    const state: EnemyState = {
      id: this.#nextId++,
      type,
      elite: elite === true,
      x: clampedX,
      y: clampedY,
      velocityX: 0,
      velocityY: 0,
      targetX: clampedX,
      targetY: clampedY,
      health: maxHealth,
      maxHealth,
      armor: maxArmor,
      maxArmor,
      radius: definition.radius,
      speed: definition.speed,
      contactDamage: definition.contactDamage * multiplier,
      creditReward: definition.creditReward * multiplier,
      dropChance: definition.dropChance,
      contactCooldownRemainingMs: 0,
      rangedCooldownRemainingMs: 0,
      decisionIntervalMs: NEAR_DECISION_INTERVAL_MS,
      decisionCooldownRemainingMs: 0,
      decisionVersion: 0,
      camouflageState: type === 'stalker' ? 'camouflaged' : 'none',
      camouflageRemainingMs: type === 'stalker' ? STALKER_CAMOUFLAGED_MS : 0,
      alpha: type === 'stalker' ? CAMOUFLAGED_ALPHA : 1,
      reservedChildren,
    };

    this.#enemies.set(state.id, state);
    this.#reservedCount += reservedChildren;
    return Object.freeze({ spawned: true, enemy: this.#snapshotEnemy(state) });
  }

  update(deltaMs: number, player: EnemyPlayerState): readonly EnemyEvent[] {
    if (!this.#validDelta(deltaMs) || !this.#validPlayer(player)) {
      return Object.freeze([]);
    }

    const timerDelta = Math.min(deltaMs, MAX_TIMER_DELTA_MS);
    const movementDelta = Math.min(deltaMs, MAX_MOVEMENT_DELTA_MS);
    const events: EnemyEvent[] = [];

    for (const enemy of this.#enemies.values()) {
      enemy.contactCooldownRemainingMs = Math.max(
        0,
        enemy.contactCooldownRemainingMs - timerDelta,
      );
      enemy.rangedCooldownRemainingMs = Math.max(
        0,
        enemy.rangedCooldownRemainingMs - timerDelta,
      );
      enemy.decisionCooldownRemainingMs = Math.max(
        0,
        enemy.decisionCooldownRemainingMs - timerDelta,
      );
      this.#advanceCamouflage(enemy, timerDelta);
    }

    for (const enemy of this.#enemies.values()) {
      if (enemy.decisionCooldownRemainingMs === 0) {
        this.#decide(enemy, player);
      }
    }

    for (const enemy of this.#enemies.values()) {
      this.#integrate(enemy, movementDelta);
      this.#collectAttacks(enemy, player, events);
    }

    const frozen = freezeEvents(events);
    this.#publish(frozen);
    return frozen;
  }

  applyDamage(
    id: number,
    amount: number,
    knockback?: Readonly<{ x: number; y: number }>,
  ): DamageResult {
    const enemy = Number.isSafeInteger(id) ? this.#enemies.get(id) : undefined;
    if (!enemy || !Number.isFinite(amount) || amount <= 0) {
      return this.#damageResult(false, 0, 0, false, { x: 0, y: 0 }, []);
    }

    const absorbedByArmor = Math.min(enemy.armor, amount);
    enemy.armor -= absorbedByArmor;
    const healthDamage = Math.min(enemy.health, amount - absorbedByArmor);
    enemy.health -= healthDamage;
    const appliedKnockback = this.#applyKnockback(enemy, knockback);
    const died = enemy.health === 0;
    const events: EnemyEvent[] = [];

    if (died) {
      events.push(
        freezeEvent({
          type: 'death',
          enemyId: enemy.id,
          enemyType: enemy.type,
          elite: enemy.elite,
          x: enemy.x,
          y: enemy.y,
          reward: enemy.creditReward,
          dropChance: enemy.dropChance,
        }),
      );
      if (enemy.type === 'carrier') {
        for (let index = 0; index < enemy.reservedChildren; index += 1) {
          const angle = (index * Math.PI * 2) / Math.max(1, enemy.reservedChildren);
          events.push(
            freezeEvent({
              type: 'spawn-request',
              sourceEnemyId: enemy.id,
              enemyType: 'crawler',
              x: clamp(enemy.x + Math.cos(angle) * enemy.radius, 0, WORLD_WIDTH),
              y: clamp(enemy.y + Math.sin(angle) * enemy.radius, 0, WORLD_HEIGHT),
              elite: false,
              requestIndex: index,
            }),
          );
        }
      }
      this.#reservedCount -= enemy.reservedChildren;
      this.#enemies.delete(enemy.id);
    }

    const result = this.#damageResult(
      true,
      absorbedByArmor,
      healthDamage,
      died,
      appliedKnockback,
      events,
    );
    this.#publish(result.events);
    return result;
  }

  remove(id: number): boolean {
    if (!Number.isSafeInteger(id)) return false;
    const enemy = this.#enemies.get(id);
    if (!enemy) return false;
    this.#reservedCount -= enemy.reservedChildren;
    this.#enemies.delete(id);
    return true;
  }

  reset(): void {
    this.#enemies.clear();
    this.#reservedCount = 0;
    this.#nextId = 1;
  }

  subscribe(listener: (event: EnemyEvent) => void): () => void {
    this.#listeners.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.#listeners.delete(listener);
    };
  }

  #snapshotEnemy(enemy: EnemyState): EnemySnapshot {
    return Object.freeze({
      id: enemy.id,
      type: enemy.type,
      elite: enemy.elite,
      x: enemy.x,
      y: enemy.y,
      velocityX: enemy.velocityX,
      velocityY: enemy.velocityY,
      targetX: enemy.targetX,
      targetY: enemy.targetY,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      armor: enemy.armor,
      maxArmor: enemy.maxArmor,
      radius: enemy.radius,
      speed: enemy.speed,
      contactDamage: enemy.contactDamage,
      creditReward: enemy.creditReward,
      dropChance: enemy.dropChance,
      contactCooldownRemainingMs: enemy.contactCooldownRemainingMs,
      rangedCooldownRemainingMs: enemy.rangedCooldownRemainingMs,
      decisionIntervalMs: enemy.decisionIntervalMs,
      decisionCooldownRemainingMs: enemy.decisionCooldownRemainingMs,
      decisionVersion: enemy.decisionVersion,
      camouflageState: enemy.camouflageState,
      camouflageRemainingMs: enemy.camouflageRemainingMs,
      alpha: enemy.alpha,
      reservedChildren: enemy.reservedChildren,
    });
  }

  #validDelta(deltaMs: number): boolean {
    return Number.isFinite(deltaMs) && deltaMs >= 0;
  }

  #validPlayer(player: EnemyPlayerState): boolean {
    return (
      player !== null &&
      typeof player === 'object' &&
      Number.isFinite(player.x) &&
      Number.isFinite(player.y) &&
      (player.radius === undefined ||
        (Number.isFinite(player.radius) && player.radius >= 0))
    );
  }

  #advanceCamouflage(enemy: EnemyState, deltaMs: number): void {
    if (enemy.type !== 'stalker' || deltaMs === 0) return;
    let remainingDelta = deltaMs;
    while (remainingDelta >= enemy.camouflageRemainingMs) {
      remainingDelta -= enemy.camouflageRemainingMs;
      if (enemy.camouflageState === 'camouflaged') {
        enemy.camouflageState = 'revealed';
        enemy.camouflageRemainingMs = STALKER_REVEALED_MS;
        enemy.alpha = 1;
      } else {
        enemy.camouflageState = 'camouflaged';
        enemy.camouflageRemainingMs = STALKER_CAMOUFLAGED_MS;
        enemy.alpha = CAMOUFLAGED_ALPHA;
      }
    }
    enemy.camouflageRemainingMs -= remainingDelta;
  }

  #decide(enemy: EnemyState, player: EnemyPlayerState): void {
    const distanceToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    enemy.decisionIntervalMs =
      distanceToPlayer > FAR_DECISION_DISTANCE
        ? FAR_DECISION_INTERVAL_MS
        : NEAR_DECISION_INTERVAL_MS;
    enemy.decisionCooldownRemainingMs = enemy.decisionIntervalMs;
    enemy.decisionVersion += 1;

    let targetX = player.x;
    let targetY = player.y;
    let direction = normalized(player.x - enemy.x, player.y - enemy.y);

    if (enemy.type === 'spitter') {
      if (distanceToPlayer < SPITTER_MIN_RANGE) {
        direction = normalized(enemy.x - player.x, enemy.y - player.y);
        targetX = enemy.x + direction.x * SPITTER_MIN_RANGE;
        targetY = enemy.y + direction.y * SPITTER_MIN_RANGE;
      } else if (distanceToPlayer <= SPITTER_MAX_RANGE) {
        direction = { x: 0, y: 0 };
        targetX = enemy.x;
        targetY = enemy.y;
      }
    } else if (enemy.type === 'stalker') {
      const toPlayer = normalized(player.x - enemy.x, player.y - enemy.y);
      const flankSide = enemy.id % 2 === 0 ? -1 : 1;
      targetX = player.x - toPlayer.y * STALKER_FLANK_DISTANCE * flankSide;
      targetY = player.y + toPlayer.x * STALKER_FLANK_DISTANCE * flankSide;
      direction = normalized(targetX - enemy.x, targetY - enemy.y);
    }

    const separation = this.#separation(enemy);
    const combined = normalized(
      direction.x + separation.x * SEPARATION_WEIGHT,
      direction.y + separation.y * SEPARATION_WEIGHT,
    );
    enemy.targetX = clamp(targetX, 0, WORLD_WIDTH);
    enemy.targetY = clamp(targetY, 0, WORLD_HEIGHT);
    enemy.velocityX = combined.x * enemy.speed;
    enemy.velocityY = combined.y * enemy.speed;
  }

  #separation(enemy: EnemyState): Vector {
    let separationX = 0;
    let separationY = 0;
    for (const other of this.#enemies.values()) {
      if (other.id === enemy.id) continue;
      const offsetX = enemy.x - other.x;
      const offsetY = enemy.y - other.y;
      const distance = Math.hypot(offsetX, offsetY);
      const separationRadius = enemy.radius + other.radius;
      if (distance >= separationRadius) continue;
      if (distance === 0) {
        separationY += enemy.id < other.id ? -1 : 1;
      } else {
        const strength = 1 - distance / separationRadius;
        separationX += (offsetX / distance) * strength;
        separationY += (offsetY / distance) * strength;
      }
    }
    return normalized(separationX, separationY);
  }

  #integrate(enemy: EnemyState, deltaMs: number): void {
    if (deltaMs === 0) return;
    const scale = deltaMs / 1_000;
    const movementX = enemy.velocityX * scale;
    const movementY = enemy.velocityY * scale;
    if (movementX === 0 && movementY === 0) return;

    const candidates = [
      { x: enemy.x + movementX, y: enemy.y + movementY },
      { x: enemy.x + movementX, y: enemy.y },
      { x: enemy.x, y: enemy.y + movementY },
      { x: enemy.x - movementY, y: enemy.y + movementX },
      { x: enemy.x + movementY, y: enemy.y - movementX },
    ];
    for (const candidate of candidates) {
      const toX = clamp(candidate.x, 0, WORLD_WIDTH);
      const toY = clamp(candidate.y, 0, WORLD_HEIGHT);
      if (!this.#movementAllowed(enemy, toX, toY)) continue;
      enemy.x = toX;
      enemy.y = toY;
      return;
    }
  }

  #movementAllowed(enemy: EnemyState, toX: number, toY: number): boolean {
    if (!this.#canMove) return true;
    const context: CollisionSteeringContext = Object.freeze({
      enemyId: enemy.id,
      enemyType: enemy.type,
      radius: enemy.radius,
      fromX: enemy.x,
      fromY: enemy.y,
      toX,
      toY,
    });
    try {
      return this.#canMove(context) === true;
    } catch {
      return false;
    }
  }

  #collectAttacks(
    enemy: EnemyState,
    player: EnemyPlayerState,
    events: EnemyEvent[],
  ): void {
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    const playerRadius = player.radius ?? DEFAULT_PLAYER_RADIUS;
    if (
      distance <= enemy.radius + playerRadius &&
      enemy.contactCooldownRemainingMs === 0
    ) {
      events.push(
        freezeEvent({
          type: 'contact-attack',
          enemyId: enemy.id,
          enemyType: enemy.type,
          damage: enemy.contactDamage,
        }),
      );
      enemy.contactCooldownRemainingMs = ENEMIES[enemy.type].attackCooldownMs;
    }

    if (
      enemy.type === 'spitter' &&
      distance >= SPITTER_ATTACK_MIN_RANGE &&
      distance <= SPITTER_ATTACK_MAX_RANGE &&
      enemy.rangedCooldownRemainingMs === 0
    ) {
      events.push(
        freezeEvent({
          type: 'hazard-attack',
          enemyId: enemy.id,
          enemyType: 'spitter',
          damage: enemy.contactDamage,
          sourceX: enemy.x,
          sourceY: enemy.y,
          targetX: player.x,
          targetY: player.y,
        }),
      );
      enemy.rangedCooldownRemainingMs = ENEMIES.spitter.attackCooldownMs;
    }
  }

  #applyKnockback(
    enemy: EnemyState,
    knockback?: Readonly<{ x: number; y: number }>,
  ): Readonly<{ x: number; y: number }> {
    if (
      !knockback ||
      !Number.isFinite(knockback.x) ||
      !Number.isFinite(knockback.y)
    ) {
      return Object.freeze({ x: 0, y: 0 });
    }
    const magnitude = Math.hypot(knockback.x, knockback.y);
    if (magnitude === 0) return Object.freeze({ x: 0, y: 0 });
    const clampedMagnitude = Math.min(magnitude, MAX_KNOCKBACK);
    const resistance = enemy.type === 'brute' ? BRUTE_KNOCKBACK_RESISTANCE : 1;
    const appliedX = (knockback.x / magnitude) * clampedMagnitude * resistance;
    const appliedY = (knockback.y / magnitude) * clampedMagnitude * resistance;
    const previousX = enemy.x;
    const previousY = enemy.y;
    enemy.x = clamp(enemy.x + appliedX, 0, WORLD_WIDTH);
    enemy.y = clamp(enemy.y + appliedY, 0, WORLD_HEIGHT);
    return Object.freeze({ x: enemy.x - previousX, y: enemy.y - previousY });
  }

  #damageResult(
    applied: boolean,
    absorbedByArmor: number,
    healthDamage: number,
    died: boolean,
    appliedKnockback: Readonly<{ x: number; y: number }>,
    events: EnemyEvent[],
  ): DamageResult {
    return Object.freeze({
      applied,
      absorbedByArmor,
      healthDamage,
      died,
      appliedKnockback: Object.freeze({ ...appliedKnockback }),
      events: freezeEvents(events),
    });
  }

  #publish(events: readonly EnemyEvent[]): void {
    if (events.length === 0 || this.#listeners.size === 0) return;
    for (const event of events) {
      for (const listener of [...this.#listeners]) {
        try {
          listener(event);
        } catch {
          // Scene/HUD adapters cannot roll back deterministic simulation state.
        }
      }
    }
  }
}
