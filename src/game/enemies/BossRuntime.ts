import Phaser from 'phaser';

import {
  calculateSplashDamage,
  type CombatSystem,
  type ProjectileHitTracker,
  type ProjectileRequest,
} from '../combat/CombatSystem';
import { MAX_ACTIVE_ENEMIES } from '../constants';
import type { QualityProfileName } from '../effects/quality';
import type { Player } from '../player/Player';
import {
  AREA_ATTACK_RANGE,
  MAX_QUEEN_NESTS,
  QUEEN_ARMORED_DURATION_MS,
  QUEEN_NEST_SPAWN_DURATION_MS,
  QUEEN_VULNERABLE_DURATION_MS,
  QueenBossSystem,
  type MinionSpawnRequestEvent,
  type QueenBossEvent,
  type QueenBossSnapshot,
  type QueenDamageResult,
  type QueenDamageTarget,
  type QueenDefeatedEvent,
} from './QueenBossSystem';
import {
  QueenBossView,
  type QueenBossRadarPosition,
} from './QueenBossView';

const DEFAULT_PLAYER_RADIUS = 24;
const MAX_DIAGNOSTIC_STEPS = 4;

export type BossRuntimeOptions = Readonly<{
  scene: Phaser.Scene;
  combat: CombatSystem;
  player: Player;
  getOccupiedEnemyCapacity(): number;
  spawnMinion(event: MinionSpawnRequestEvent): boolean;
  onQueenDefeated(event: QueenDefeatedEvent): void;
}>;

export type BossProjectileHitResult = Readonly<{
  applied: boolean;
  blocked: boolean;
  exhausted: boolean;
  destroyed: boolean;
  defeated: boolean;
}>;

export type BossAreaDamageResult = Readonly<{
  appliedCount: number;
  blockedCount: number;
  destroyedCount: number;
  defeated: boolean;
}>;

const EMPTY_PROJECTILE_HIT_RESULT: BossProjectileHitResult = Object.freeze({
  applied: false,
  blocked: false,
  exhausted: false,
  destroyed: false,
  defeated: false,
});

const EMPTY_AREA_DAMAGE_RESULT: BossAreaDamageResult = Object.freeze({
  appliedCount: 0,
  blockedCount: 0,
  destroyedCount: 0,
  defeated: false,
});

const stableTargetId = (target: QueenDamageTarget): string =>
  target.type === 'queen' ? 'queen' : `nest:${target.id}`;

const isObject = (value: unknown): value is object =>
  value !== null && (typeof value === 'object' || typeof value === 'function');

type QueenDurability = Readonly<{ armor?: number; health: number }>;

export const didQueenDurabilityDecrease = (
  before: QueenDurability,
  after: QueenDurability,
): boolean =>
  (typeof before.armor === 'number' && typeof after.armor === 'number' &&
    Number.isFinite(before.armor) && Number.isFinite(after.armor) && after.armor < before.armor) ||
  (Number.isFinite(before.health) && Number.isFinite(after.health) && after.health < before.health);

export const routeQueenBossEventPresentation = (
  event: QueenBossEvent,
  signal: (event: QueenBossEvent) => void,
): boolean => {
  switch (event.type) {
    case 'area-telegraph':
    case 'area-attack':
    case 'queen-defeated':
      signal(event);
      return true;
    case 'minion-spawn-request':
    case 'nest-destroyed':
      return false;
  }
};

/**
 * Phaser runtime seam over QueenBossSystem. The pure system remains authoritative;
 * this adapter routes callbacks, player damage, projectile dedupe, and its view.
 */
export class BossRuntime {
  readonly #scene: Phaser.Scene;
  readonly #combat: CombatSystem;
  readonly #player: Player;
  readonly #getOccupiedEnemyCapacity: () => number;
  readonly #spawnMinion: (event: MinionSpawnRequestEvent) => boolean;
  readonly #onQueenDefeated: (event: QueenDefeatedEvent) => void;
  readonly #system = new QueenBossSystem();
  readonly #view: QueenBossView;
  readonly #processedEventIds = new Set<number>();
  #destroyed = false;

  readonly #handleSceneShutdown = (): void => {
    this.#dispose(false);
  };

  constructor(options: BossRuntimeOptions) {
    this.#scene = options.scene;
    this.#combat = options.combat;
    this.#player = options.player;
    this.#getOccupiedEnemyCapacity = options.getOccupiedEnemyCapacity;
    this.#spawnMinion = options.spawnMinion;
    this.#onQueenDefeated = options.onQueenDefeated;
    this.#view = new QueenBossView(options.scene);
    this.#scene.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.#handleSceneShutdown,
    );
  }

  get group(): Phaser.Physics.Arcade.Group {
    return this.#view.group;
  }

  targetFor(gameObject: unknown): QueenDamageTarget | null {
    return this.#view.targetFor(gameObject);
  }

  get activeCount(): number {
    return this.#view.activeCount;
  }

  get radarPositions(): readonly QueenBossRadarPosition[] {
    return this.#view.radarPositions;
  }

  get snapshot(): QueenBossSnapshot {
    return this.#system.snapshot;
  }

  setQuality(profile: QualityProfileName): void {
    this.#view.setQuality(profile);
  }

  start(x: number, y: number): boolean {
    if (this.#destroyed) return false;
    const started = this.#system.start(x, y);
    this.#syncView();
    return started;
  }

  update(deltaMs: number): void {
    if (this.#destroyed) return;
    const events = this.#system.update(
      deltaMs,
      this.#playerPoint(),
      this.#occupiedEnemyCapacity(),
    );
    this.#processEvents(events, true);
    this.#syncView();
  }

  handleProjectileHit(
    target: QueenDamageTarget,
    request: ProjectileRequest,
    tracker: ProjectileHitTracker,
  ): BossProjectileHitResult {
    if (
      this.#destroyed ||
      !this.#isCurrentTarget(target) ||
      !isObject(request) ||
      !isObject(tracker)
    ) {
      return EMPTY_PROJECTILE_HIT_RESULT;
    }

    const tracked = tracker.hit(stableTargetId(target));
    if (!tracked.applied) {
      return Object.freeze({
        applied: false,
        blocked: false,
        exhausted: tracked.exhausted,
        destroyed: false,
        defeated: false,
      });
    }

    const before = this.#system.snapshot;
    const damage = this.#system.applyDamage(target, request.damage);
    const after = this.#system.snapshot;
    this.#view.handleAppliedDamage(
      target,
      target.type === 'queen' && before.active && didQueenDurabilityDecrease(before, after),
    );
    if (damage.blockedByArmor) this.#view.handleShieldBlocked(target);
    this.#processDamage(damage);
    this.#syncView();
    return Object.freeze({
      applied: damage.applied,
      blocked: damage.blockedByArmor,
      exhausted: tracked.exhausted,
      destroyed: damage.destroyed,
      defeated: damage.defeated,
    });
  }

  applyAreaDamage(
    x: number,
    y: number,
    baseDamage: number,
    radius: number,
  ): BossAreaDamageResult {
    if (
      this.#destroyed ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(baseDamage) ||
      !Number.isFinite(radius) ||
      baseDamage <= 0 ||
      radius <= 0
    ) {
      return EMPTY_AREA_DAMAGE_RESULT;
    }

    const snapshot = this.#system.snapshot;
    if (!snapshot.active) return EMPTY_AREA_DAMAGE_RESULT;

    const targets: Array<
      Readonly<{ target: QueenDamageTarget; x: number; y: number }>
    > = [
      Object.freeze({
        target: Object.freeze({ type: 'queen' as const }),
        x: snapshot.x,
        y: snapshot.y,
      }),
      ...snapshot.nests.slice(0, MAX_QUEEN_NESTS).map((nest) =>
        Object.freeze({
          target: Object.freeze({ type: 'nest' as const, id: nest.id }),
          x: nest.x,
          y: nest.y,
        }),
      ),
    ];

    let appliedCount = 0;
    let blockedCount = 0;
    let destroyedCount = 0;
    let defeated = false;

    for (const candidate of targets) {
      const distance = Math.hypot(candidate.x - x, candidate.y - y);
      const amount = calculateSplashDamage(baseDamage, distance, radius);
      if (amount <= 0) continue;

      const before = this.#system.snapshot;
      const damage = this.#system.applyDamage(candidate.target, amount);
      const after = this.#system.snapshot;
      this.#view.handleAppliedDamage(
        candidate.target,
        candidate.target.type === 'queen' && before.active && didQueenDurabilityDecrease(before, after),
      );
      if (damage.applied) appliedCount += 1;
      if (damage.blockedByArmor) {
        blockedCount += 1;
        this.#view.handleShieldBlocked(candidate.target);
      }
      if (damage.destroyed) destroyedCount += 1;
      if (damage.defeated) defeated = true;
      this.#processDamage(damage);
    }

    this.#syncView();
    return Object.freeze({
      appliedCount,
      blockedCount,
      destroyedCount,
      defeated,
    });
  }

  /**
   * Exercises the real phase and damage paths for diagnostics. Updates use a
   * virtual point outside arena range and full enemy capacity, so no attack or
   * minion side effect can harm the live player or overfill the horde.
   */
  forceDefeatForDiagnostics(): boolean {
    if (this.#destroyed || this.#system.snapshot.defeated) return false;
    if (!this.#system.snapshot.active) {
      const idle = this.#system.snapshot;
      if (!this.#system.start(idle.x, idle.y)) return false;
    }

    for (let step = 0; step < MAX_DIAGNOSTIC_STEPS; step += 1) {
      const snapshot = this.#system.snapshot;
      if (snapshot.phase === 'vulnerable' || snapshot.defeated) break;
      const safePlayer = Object.freeze({
        x: snapshot.x + AREA_ATTACK_RANGE + DEFAULT_PLAYER_RADIUS + 1_000,
        y: snapshot.y,
        radius: DEFAULT_PLAYER_RADIUS,
      });
      const events = this.#system.update(
        this.#phaseAdvanceDelta(snapshot.phase),
        safePlayer,
        MAX_ACTIVE_ENEMIES,
      );
      this.#processEvents(events, false);
    }

    const vulnerable = this.#system.snapshot;
    if (vulnerable.phase !== 'vulnerable') {
      this.#syncView();
      return false;
    }

    const damage = this.#system.applyDamage(
      Object.freeze({ type: 'queen' }),
      vulnerable.maxHealth,
    );
    this.#processDamage(damage);
    this.#syncView();
    return damage.defeated;
  }

  reset(): void {
    if (this.#destroyed) return;
    this.#processedEventIds.clear();
    this.#system.reset();
    this.#view.clear();
    this.#syncView();
  }

  destroy(): void {
    this.#dispose(true);
  }

  #playerPoint(): Readonly<{ x: number; y: number; radius: number }> {
    const sprite = this.#player.sprite;
    const radius =
      sprite.body.isCircle && Number.isFinite(sprite.body.halfWidth)
        ? Math.max(0, sprite.body.halfWidth)
        : DEFAULT_PLAYER_RADIUS;
    return Object.freeze({
      x: Number.isFinite(sprite.x) ? sprite.x : 0,
      y: Number.isFinite(sprite.y) ? sprite.y : 0,
      radius,
    });
  }

  #occupiedEnemyCapacity(): number {
    try {
      return this.#getOccupiedEnemyCapacity();
    } catch {
      return MAX_ACTIVE_ENEMIES;
    }
  }

  #isCurrentTarget(target: QueenDamageTarget): boolean {
    if (!isObject(target) || !('type' in target)) return false;
    const snapshot = this.#system.snapshot;
    if (!snapshot.active) return false;
    if (target.type === 'queen') return true;
    return (
      target.type === 'nest' &&
      Number.isSafeInteger(target.id) &&
      snapshot.nests.some((nest) => nest.id === target.id)
    );
  }

  #processDamage(damage: QueenDamageResult): void {
    this.#processEvents(damage.events, true);
  }

  #processEvents(events: readonly QueenBossEvent[], damagePlayer: boolean): void {
    for (const event of events) {
      if (this.#processedEventIds.has(event.eventId)) continue;
      this.#processedEventIds.add(event.eventId);
      if (!routeQueenBossEventPresentation(event, (routed) => this.#view.handleEvent(routed))) {
        this.#view.handleEvent(event);
      }

      switch (event.type) {
        case 'minion-spawn-request':
          try {
            this.#spawnMinion(event);
          } catch {
            // Callback failure cannot roll back an event already emitted by the system.
          }
          break;
        case 'area-attack':
          if (damagePlayer && this.#playerIntersects(event.x, event.y, event.radius)) {
            this.#combat.applyDamage(event.damage);
          }
          break;
        case 'queen-defeated':
          // Death art is routed above. Release the snapshot-authoritative overlap
          // body before observers can transition or inspect the defeated scene.
          this.#syncView();
          try {
            this.#onQueenDefeated(event);
          } catch {
            // Victory callbacks are observers and cannot roll back queen defeat.
          }
          break;
        case 'area-telegraph':
        case 'nest-destroyed':
          break;
      }
    }
  }

  #playerIntersects(x: number, y: number, radius: number): boolean {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(radius) ||
      radius < 0
    ) {
      return false;
    }
    const player = this.#playerPoint();
    const distance = Math.hypot(player.x - x, player.y - y);
    return Number.isFinite(distance) && distance <= radius + player.radius;
  }

  #phaseAdvanceDelta(phase: QueenBossSnapshot['phase']): number {
    switch (phase) {
      case 'armored':
        return QUEEN_ARMORED_DURATION_MS;
      case 'nest-spawn':
        return QUEEN_NEST_SPAWN_DURATION_MS;
      case 'vulnerable':
        return QUEEN_VULNERABLE_DURATION_MS;
      case 'idle':
      case 'defeated':
        return 0;
    }
  }

  #syncView(): void {
    if (!this.#destroyed) this.#view.sync(this.#system.snapshot);
  }

  #dispose(destroyDisplayObjects: boolean): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#scene.events.off(
      Phaser.Scenes.Events.SHUTDOWN,
      this.#handleSceneShutdown,
    );
    this.#processedEventIds.clear();
    this.#system.reset();
    if (destroyDisplayObjects) this.#view.destroy();
  }
}
