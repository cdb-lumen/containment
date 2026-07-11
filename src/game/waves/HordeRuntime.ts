import Phaser from 'phaser';

import {
  calculateSplashDamage,
  DEFAULT_COMBAT_MODIFIERS,
  type CombatSystem,
  type ProjectileHitTracker,
  type ProjectileRequest,
} from '../combat/CombatSystem';
import { MAX_ACTIVE_ENEMIES, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import {
  QUALITY_PROFILES,
  type QualityProfileName,
} from '../effects/quality';
import {
  EnemySystem,
  type CollisionSteeringContext,
  type EnemyDeathEvent,
  type EnemyEvent,
  type EnemySpawnRequestEvent,
  type HazardAttackEvent,
} from '../enemies/EnemySystem';
import {
  BossRuntime,
  type BossProjectileHitResult,
} from '../enemies/BossRuntime';
import { EnemyView } from '../enemies/EnemyView';
import type {
  MinionSpawnRequestEvent,
  QueenBossSnapshot,
  QueenDamageTarget,
  QueenDefeatedEvent,
} from '../enemies/QueenBossSystem';
import { STANDARD_ENEMY_IDS } from '../enemies/catalog';
import {
  PICKUP_RADIUS,
  PickupSystem,
  type PickupReward,
} from '../pickups/PickupSystem';
import { PickupView } from '../pickups/PickupView';
import type { Player } from '../player/Player';
import { RunState, type RunResult } from '../run/RunState';
import { ArmoryOverlay } from '../upgrades/ArmoryOverlay';
import {
  UpgradeSystem,
  type AutomaticResolution,
  type UpgradeModifiers,
  type UpgradeOffer,
  type UpgradeSnapshot,
} from '../upgrades/UpgradeSystem';
import type { FacilityWorld } from '../world/FacilityWorld';
import {
  FACILITY_LAYOUT,
  type FacilityBreach,
  type FacilityRect,
} from '../world/facilityLayout';
import {
  HordeDirector,
  type HordeEvent,
  type HordePhase,
  type SpawnRequestEvent,
} from './HordeDirector';

const DEFAULT_SEED = 0x484f5244;
const MAX_UPDATE_DELTA_MS = 100;
const PLAYER_COLLISION_RADIUS = 24;
const BREACH_INWARD_OFFSET = 56;
const MAX_BREACH_EFFECTS = 12;
const BREACH_EFFECT_DURATION_MS = 240;
const MAX_AREA_DAMAGE = 1_000_000;
const MAX_AREA_RADIUS = Math.hypot(WORLD_WIDTH, WORLD_HEIGHT);
const MAX_AREA_KNOCKBACK = 120;
const DIAGNOSTIC_DIRECTOR_DELTA_MS = 120_000;
const MAX_DIAGNOSTIC_STEPS = 512;
const WAVE_BONUS_MULTIPLIER = 50;

const EMPTY_PROJECTILE_HIT_RESULT: HordeProjectileHitResult = Object.freeze({
  applied: false,
  exhausted: false,
  died: false,
});

const EMPTY_AREA_DAMAGE_RESULT: HordeAreaDamageResult = Object.freeze({
  appliedCount: 0,
  deathCount: 0,
  enemyIds: Object.freeze([]) as readonly number[],
});

export type HordeHazardAttackHandler = (attack: HazardAttackEvent) => void;
export type HordeEnemyDeathHandler = (event: EnemyDeathEvent) => void;
export type HordePickupHandler = (
  reward: PickupReward,
  position: Readonly<{ x: number; y: number }>,
) => void;

export type EnemyAttackPresentationSignal = (enemyId: number) => boolean;

/** Routes only explicit attack events; the signal decides whether the ID is still active. */
export const routeEnemyAttackPresentation = (
  event: EnemyEvent,
  signal: EnemyAttackPresentationSignal,
): boolean => {
  if (event.type !== 'contact-attack' && event.type !== 'hazard-attack') return false;
  if (!Number.isSafeInteger(event.enemyId) || event.enemyId < 0) return false;
  return signal(event.enemyId);
};

export type HordeRuntimeOptions = Readonly<{
  scene: Phaser.Scene;
  combat: CombatSystem;
  player: Player;
  facility: FacilityWorld;
  getPresentationTime?: () => number;
  onHazardAttack: HordeHazardAttackHandler;
  onEnemyDeath?: HordeEnemyDeathHandler;
  onQueenDefeated?: (position: Readonly<{ x: number; y: number }>) => void;
  onPickupCollected?: HordePickupHandler;
  seed?: number;
}>;

export type HordeProjectileHitResult = Readonly<{
  applied: boolean;
  exhausted: boolean;
  died: boolean;
}>;

export type HordeAreaDamageResult = Readonly<{
  appliedCount: number;
  deathCount: number;
  enemyIds: readonly number[];
}>;

const normalizeSeed = (seed: number): number =>
  Number.isFinite(seed) && Number.isInteger(seed) ? seed >>> 0 : DEFAULT_SEED;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const safeDelta = (deltaMs: number): number =>
  Number.isFinite(deltaMs) ? clamp(deltaMs, 0, MAX_UPDATE_DELTA_MS) : 0;

const intersectsCircle = (
  x: number,
  y: number,
  radius: number,
  rect: FacilityRect,
): boolean => {
  const nearestX = clamp(x, rect.x, rect.x + rect.width);
  const nearestY = clamp(y, rect.y, rect.y + rect.height);
  return Math.hypot(x - nearestX, y - nearestY) <= radius;
};

const inwardOffset = (
  breach: FacilityBreach,
): Readonly<{ x: number; y: number }> => {
  switch (breach.facing) {
    case 'north':
      return Object.freeze({ x: 0, y: -BREACH_INWARD_OFFSET });
    case 'south':
      return Object.freeze({ x: 0, y: BREACH_INWARD_OFFSET });
    case 'east':
      return Object.freeze({ x: BREACH_INWARD_OFFSET, y: 0 });
    case 'west':
      return Object.freeze({ x: -BREACH_INWARD_OFFSET, y: 0 });
  }
};

const waveObjective = (wave: number): string =>
  `WAVE ${wave} // CONTAINMENT PURGE ACTIVE`;

/**
 * Phaser orchestration seam for the deterministic horde, pickup, and upgrade
 * systems. Domain snapshots remain authoritative; Phaser objects are views only.
 */
export class HordeRuntime {
  readonly #scene: Phaser.Scene;
  readonly #combat: CombatSystem;
  readonly #player: Player;
  readonly #facility: FacilityWorld;
  readonly #onHazardAttack: HordeHazardAttackHandler;
  readonly #onEnemyDeath: HordeEnemyDeathHandler | undefined;
  readonly #onQueenDefeated: HordeRuntimeOptions['onQueenDefeated'];
  readonly #onPickupCollected: HordePickupHandler | undefined;
  readonly #enemySystem: EnemySystem;
  readonly #pickupSystem: PickupSystem;
  readonly #upgradeSystem: UpgradeSystem;
  readonly #runState: RunState;
  readonly #enemyView: EnemyView;
  readonly #pickupView: PickupView;
  readonly #bossRuntime: BossRuntime;
  readonly #armoryOverlay: ArmoryOverlay;
  readonly #breachEffects = new Set<Phaser.GameObjects.Graphics>();
  readonly #breachTweens = new Set<Phaser.Tweens.Tween>();
  readonly #breachTweenByEffect = new Map<
    Phaser.GameObjects.Graphics,
    Phaser.Tweens.Tween
  >();
  readonly #director: HordeDirector;
  readonly #pendingSpawnRequests: SpawnRequestEvent[] = [];
  #initialSeed: number;
  #randomState: number;
  #arrivalStarted = false;
  #defeatReported = false;
  #queenDefeatHandled = false;
  #lastBossPhase: QueenBossSnapshot['phase'] = 'idle';
  #breachEffectLimit = MAX_BREACH_EFFECTS;
  #destroyed = false;

  readonly #handleSceneShutdown = (): void => {
    this.#dispose(false);
  };

  constructor(options: HordeRuntimeOptions) {
    this.#scene = options.scene;
    this.#combat = options.combat;
    this.#player = options.player;
    this.#facility = options.facility;
    this.#onHazardAttack = options.onHazardAttack;
    this.#onEnemyDeath = options.onEnemyDeath;
    this.#onQueenDefeated = options.onQueenDefeated;
    this.#onPickupCollected = options.onPickupCollected;
    this.#initialSeed = normalizeSeed(options.seed ?? DEFAULT_SEED);
    this.#randomState = this.#initialSeed;
    this.#director = new HordeDirector(() => this.#random());
    this.#enemySystem = new EnemySystem({
      canMove: (context): boolean => this.#canEnemyMove(context),
    });
    this.#pickupSystem = new PickupSystem(this.#initialSeed);
    this.#upgradeSystem = new UpgradeSystem();
    this.#runState = new RunState();
    const getPresentationTime = options.getPresentationTime ?? (() => 0);
    this.#enemyView = new EnemyView(this.#scene, getPresentationTime);
    this.#pickupView = new PickupView(this.#scene);
    this.#bossRuntime = new BossRuntime({
      scene: this.#scene,
      combat: this.#combat,
      player: this.#player,
      getPresentationTime,
      getOccupiedEnemyCapacity: (): number => this.#occupiedEnemyCapacity(),
      spawnMinion: (event): boolean => this.#spawnBossMinion(event),
      onQueenDefeated: (event): void => this.#handleQueenDefeated(event),
    });
    this.#armoryOverlay = new ArmoryOverlay(
      this.#scene,
      (offer, index): void => this.#purchaseArmoryOffer(offer, index),
    );
    this.#scene.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.#handleSceneShutdown,
    );
  }

  get enemyGroup(): Phaser.Physics.Arcade.Group {
    return this.#enemyView.group;
  }

  get bossGroup(): Phaser.Physics.Arcade.Group {
    return this.#bossRuntime.group;
  }

  enemyIdFor(gameObject: unknown): number | null {
    return this.#enemyView.enemyIdFor(gameObject);
  }

  bossTargetFor(gameObject: unknown): QueenDamageTarget | null {
    return this.#bossRuntime.targetFor(gameObject);
  }

  get bossSnapshot(): QueenBossSnapshot {
    return this.#bossRuntime.snapshot;
  }

  get activeEnemies(): number {
    return this.#enemySystem.activeCount + this.#bossRuntime.activeCount;
  }

  get presentationSkinKeys(): readonly string[] { return this.#enemyView.activeSkinKeys; }
  get framedPresentationCount(): number { return this.#enemyView.framedCount; }
  get presentationObjectCount(): number { return this.#enemyView.visualCount; }

  get activePickups(): number {
    return this.#pickupSystem.snapshot.length;
  }

  get radarPositions(): readonly Readonly<{ x: number; y: number }>[] {
    return Object.freeze([
      ...this.#enemyView.activePositions,
      ...this.#bossRuntime.radarPositions,
    ]);
  }

  get phase(): HordePhase {
    return this.#director.phase;
  }

  setEffectsProfile(profile: QualityProfileName): void {
    this.#enemyView.setQuality(profile);
    this.#bossRuntime.setQuality(profile);
    this.#breachEffectLimit = Math.min(
      MAX_BREACH_EFFECTS,
      QUALITY_PROFILES[profile].dynamicLights,
    );
    while (this.#breachEffects.size > this.#breachEffectLimit) {
      const oldest = this.#breachEffects.values().next().value;
      if (!oldest) break;
      this.#retireBreachEffect(oldest, true);
    }
  }

  get armoryVisible(): boolean {
    return this.#armoryOverlay.isVisible;
  }

  get currentUpgradeSnapshot(): UpgradeSnapshot {
    return this.#upgradeSystem.snapshot;
  }

  get currentUpgradeModifiers(): UpgradeModifiers {
    return this.#upgradeSystem.modifiers;
  }

  get upgradeSnapshot(): UpgradeSnapshot {
    return this.currentUpgradeSnapshot;
  }

  get upgradeModifiers(): UpgradeModifiers {
    return this.currentUpgradeModifiers;
  }

  get runResult(): RunResult {
    return this.#runState.snapshot(
      this.#upgradeSystem.levels,
      this.#combat.snapshot.credits,
    );
  }

  startArrival(): boolean {
    if (this.#destroyed || this.#arrivalStarted) return false;
    this.#arrivalStarted = true;
    const events = this.#director.start();
    this.#runState.start();
    this.#processHordeEvents(events);
    this.#syncViews();
    return true;
  }

  update(deltaMs: number): void {
    if (this.#destroyed) return;
    const delta = safeDelta(deltaMs);
    const playerPoint = this.#playerPoint();
    this.#runState.update(delta);
    this.#retryPendingSpawns();

    if (this.#director.phase === 'combat') {
      this.#processHordeEvents(
        this.#director.update(delta, this.#occupiedEnemyCapacity()),
      );
    }

    if (this.#director.phase === 'boss') {
      this.#bossRuntime.update(delta);
      this.#updateBossObjective();
    }

    this.#processEnemyEvents(this.#enemySystem.update(delta, playerPoint));
    this.#updatePickups(delta, playerPoint);
    this.#updateArmory(delta);
    this.#reportDefeatIfNeeded();
    this.#syncViews();
  }

  handleProjectileHit(
    enemyId: number,
    request: ProjectileRequest,
    tracker: ProjectileHitTracker,
    knockback: Readonly<{ x: number; y: number }>,
  ): HordeProjectileHitResult {
    if (
      this.#destroyed ||
      !Number.isSafeInteger(enemyId) ||
      request === null ||
      typeof request !== 'object' ||
      tracker === null ||
      typeof tracker !== 'object'
    ) {
      return EMPTY_PROJECTILE_HIT_RESULT;
    }

    const tracked = tracker.hit(enemyId);
    if (!tracked.applied) {
      return Object.freeze({
        applied: false,
        exhausted: tracked.exhausted,
        died: false,
      });
    }

    const damage = this.#enemySystem.applyDamage(enemyId, request.damage, knockback);
    this.#processEnemyEvents(damage.events);
    this.#syncViews();
    return Object.freeze({
      applied: damage.applied,
      exhausted: tracked.exhausted,
      died: damage.died,
    });
  }

  handleBossProjectileHit(
    target: QueenDamageTarget,
    request: ProjectileRequest,
    tracker: ProjectileHitTracker,
  ): BossProjectileHitResult {
    return this.#bossRuntime.handleProjectileHit(target, request, tracker);
  }

  applyAreaDamage(
    x: number,
    y: number,
    baseDamage: number,
    radius: number,
    knockback: number,
  ): HordeAreaDamageResult {
    if (
      this.#destroyed ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(baseDamage) ||
      !Number.isFinite(radius) ||
      !Number.isFinite(knockback) ||
      baseDamage <= 0 ||
      radius <= 0
    ) {
      return EMPTY_AREA_DAMAGE_RESULT;
    }

    const centerX = clamp(x, 0, WORLD_WIDTH);
    const centerY = clamp(y, 0, WORLD_HEIGHT);
    const boundedDamage = clamp(baseDamage, 0, MAX_AREA_DAMAGE);
    const boundedRadius = clamp(radius, 1, MAX_AREA_RADIUS);
    const boundedKnockback = clamp(knockback, 0, MAX_AREA_KNOCKBACK);
    const enemyIds: number[] = [];
    let deathCount = 0;

    for (const enemy of this.#enemySystem.snapshot.enemies) {
      const offsetX = enemy.x - centerX;
      const offsetY = enemy.y - centerY;
      const distance = Math.hypot(offsetX, offsetY);
      const damageAmount = calculateSplashDamage(
        boundedDamage,
        distance,
        boundedRadius,
      );
      if (damageAmount <= 0) continue;

      const falloff = boundedDamage > 0 ? damageAmount / boundedDamage : 0;
      const direction = this.#radialDirection(enemy.id, offsetX, offsetY);
      const result = this.#enemySystem.applyDamage(enemy.id, damageAmount, {
        x: direction.x * boundedKnockback * falloff,
        y: direction.y * boundedKnockback * falloff,
      });
      if (!result.applied) continue;
      enemyIds.push(enemy.id);
      if (result.died) deathCount += 1;
      this.#processEnemyEvents(result.events);
    }

    const bossDamage = this.#bossRuntime.applyAreaDamage(
      centerX,
      centerY,
      boundedDamage,
      boundedRadius,
    );

    this.#syncViews();
    return Object.freeze({
      appliedCount: enemyIds.length + bossDamage.appliedCount,
      deathCount: deathCount + bossDamage.destroyedCount,
      enemyIds: Object.freeze(enemyIds),
    });
  }

  forceBossDefeatForDiagnostics(): boolean {
    if (this.#destroyed || this.#director.phase !== 'boss') return false;
    return this.#bossRuntime.forceDefeatForDiagnostics();
  }

  selectArmoryIndex(index: number): boolean {
    if (
      this.#destroyed ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > 2 ||
      !this.#upgradeSystem.armory.open
    ) {
      return false;
    }
    const offer = this.#upgradeSystem.armory.offers[index];
    if (!offer?.affordable) return false;
    this.#armoryOverlay.handleSelectionIndex(index);
    return !this.#upgradeSystem.armory.open;
  }

  completeWaveForDiagnostics(): HordePhase {
    if (this.#destroyed) return this.#director.phase;
    if (this.#director.phase === 'idle') this.startArrival();
    if (this.#director.phase === 'armory') {
      this.#resolveArmoryTimeout();
      return this.#director.phase;
    }
    if (this.#director.phase !== 'combat') return this.#director.phase;

    this.clearEnemies();
    const targetWave = this.#director.currentWave;
    for (let step = 0; step < MAX_DIAGNOSTIC_STEPS; step += 1) {
      if (
        this.#director.phase !== 'combat' ||
        this.#director.currentWave !== targetWave
      ) {
        break;
      }
      this.#processHordeEvents(
        this.#director.update(DIAGNOSTIC_DIRECTOR_DELTA_MS, 0),
        false,
      );
    }
    this.#syncViews();
    return this.#director.phase;
  }

  spawnStressWave(): number {
    return this.spawnEnemiesForDiagnostics(MAX_ACTIVE_ENEMIES);
  }

  spawnEnemiesForDiagnostics(count: number): number {
    if (!import.meta.env.DEV) return 0;
    return this.#spawnEnemyBatch(count);
  }

  #spawnEnemyBatch(count: number): number {
    const requested = Number.isFinite(count)
      ? Math.min(MAX_ACTIVE_ENEMIES, Math.max(0, Math.trunc(count)))
      : 0;
    if (requested === 0) return 0;
    if (this.#destroyed) return 0;
    if (this.#director.phase === 'idle') this.startArrival();
    this.#resumeArmoryIfNeeded();
    for (let step = 0; step < 8 && this.#director.phase === 'combat'; step += 1) {
      const currentWave = this.#director.currentWave ?? 0;
      if (currentWave >= 8) break;
      this.completeWaveForDiagnostics();
    }

    this.clearEnemies();
    for (let step = 0; step < 16; step += 1) {
      if (this.#director.phase === 'armory') {
        this.#resumeArmoryIfNeeded();
        continue;
      }
      if (this.#director.phase !== 'combat') break;
      const currentWave = this.#director.currentWave ?? 0;
      if (currentWave >= 8) break;
      this.completeWaveForDiagnostics();
    }
    this.#resumeArmoryIfNeeded();

    this.clearEnemies();
    const stressTypes = STANDARD_ENEMY_IDS.filter((type) => type !== 'carrier');
    const columns = 15;
    for (let index = 0; index < requested; index += 1) {
      const type = stressTypes[index % stressTypes.length];
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = 180 + column * 150;
      const y = 120 + row * 125;
      const spawned = this.#enemySystem.spawn(type, x, y, index % 17 === 0);
      if (!spawned.spawned) break;
    }

    this.#combat.setWave(8);
    this.#facility.setWaveAccess(8);
    this.#combat.setObjective(waveObjective(8));
    this.#syncViews();
    return this.#enemySystem.activeCount;
  }

  defeatEnemiesForDiagnostics(count: number): number {
    if (!import.meta.env.DEV) return 0;
    return this.#defeatEnemyBatch(count);
  }

  #defeatEnemyBatch(count: number): number {
    if (this.#destroyed || !Number.isFinite(count)) return 0;
    const requested = Math.min(
      MAX_ACTIVE_ENEMIES,
      Math.max(0, Math.trunc(count)),
    );
    const targets = this.#enemySystem.snapshot.enemies.slice(0, requested);
    let defeated = 0;
    for (const enemy of targets) {
      const result = this.#enemySystem.applyDamage(
        enemy.id,
        enemy.health + enemy.armor,
      );
      if (result.died) defeated += 1;
      this.#processEnemyEvents(result.events);
    }
    this.#syncViews();
    return defeated;
  }

  clearEnemies(): number {
    if (this.#destroyed) return 0;
    this.#pendingSpawnRequests.length = 0;
    let removed = 0;
    for (const enemy of this.#enemySystem.snapshot.enemies) {
      if (this.#enemySystem.remove(enemy.id)) removed += 1;
    }
    this.#syncViews();
    return removed;
  }

  reset(seed?: number): void {
    if (this.#destroyed) return;
    if (seed !== undefined && Number.isFinite(seed) && Number.isInteger(seed)) {
      this.#initialSeed = normalizeSeed(seed);
    }
    this.#randomState = this.#initialSeed;
    this.#director.reset();
    this.#pendingSpawnRequests.length = 0;
    this.#enemySystem.reset();
    this.#pickupSystem.reset(this.#initialSeed);
    this.#upgradeSystem.reset();
    this.#bossRuntime.reset();
    this.#runState.reset();
    this.#arrivalStarted = false;
    this.#defeatReported = false;
    this.#queenDefeatHandled = false;
    this.#lastBossPhase = 'idle';
    this.#armoryOverlay.hide();
    this.#enemyView.clear();
    this.#pickupView.clear();
    this.#applyUpgradeModifiers();
    this.#combat.setModifiers(DEFAULT_COMBAT_MODIFIERS);
    this.#player.setSpeedMultiplier(1);
    this.#clearBreachEffects(true);
    this.#syncViews();
  }

  destroy(): void {
    this.#dispose(true);
  }

  #playerPoint(): Readonly<{ x: number; y: number; radius: number }> {
    const x = Number.isFinite(this.#player.sprite.x) ? this.#player.sprite.x : 0;
    const y = Number.isFinite(this.#player.sprite.y) ? this.#player.sprite.y : 0;
    return Object.freeze({ x, y, radius: PLAYER_COLLISION_RADIUS });
  }

  #processHordeEvents(events: readonly HordeEvent[], spawnRequests = true): void {
    for (const event of events) {
      switch (event.type) {
        case 'wave-start':
          this.#combat.setWave(event.wave);
          this.#combat.setObjective(waveObjective(event.wave));
          this.#facility.setWaveAccess(event.wave);
          break;
        case 'spawn-request':
          if (
            spawnRequests &&
            !this.#spawnFromBreach(event) &&
            this.#pendingSpawnRequests.length < MAX_ACTIVE_ENEMIES
          ) {
            this.#pendingSpawnRequests.push(event);
          }
          break;
        case 'wave-complete': {
          this.#runState.recordWaveCleared(event.wave);
          const bonus = event.wave * WAVE_BONUS_MULTIPLIER;
          this.#addCredits(bonus);
          this.#combat.setObjective(
            `WAVE ${event.wave} SECURED // +${bonus} CR`,
          );
          break;
        }
        case 'armory-start': {
          this.#combat.setObjective('FIELD ARMORY ONLINE // SELECT UPGRADE');
          const credits = this.#combat.snapshot.credits;
          const armory = this.#upgradeSystem.beginArmory(credits, {
            seed: this.#initialSeed,
            round: event.afterWave,
            armoryId: `wave-${event.afterWave}`,
          });
          this.#armoryOverlay.show(armory);
          break;
        }
        case 'armory-end':
          this.#armoryOverlay.hide();
          break;
        case 'boss-start': {
          const { x, y } = FACILITY_LAYOUT.queenArena.safeCenter;
          this.#bossRuntime.start(x, y);
          this.#facility.setWaveAccess(8);
          this.#combat.setObjective(
            'QUEEN ARMORED // DESTROY NESTS // AWAIT CORE EXPOSURE',
          );
          break;
        }
        case 'victory':
          this.#combat.setObjective('CONTAINMENT SECURED');
          break;
        case 'defeat':
          this.#combat.setObjective(
            'MARINE DOWN // CONTAINMENT FAILED',
          );
          break;
      }
    }
  }

  #spawnFromBreach(request: SpawnRequestEvent): boolean {
    const breach = this.#resolveBreach(request.breachId);
    if (!breach) return false;
    const offset = inwardOffset(breach);
    const spawned = this.#enemySystem.spawn(
      request.enemyId,
      breach.x + offset.x,
      breach.y + offset.y,
      request.elite,
    );
    if (!spawned.spawned) return false;
    this.#createBreachEffect(breach);
    this.#enemyView.sync(this.#enemySystem.snapshot.enemies);
    return true;
  }

  #retryPendingSpawns(): void {
    while (this.#pendingSpawnRequests.length > 0) {
      const request = this.#pendingSpawnRequests[0];
      if (!request || !this.#spawnFromBreach(request)) return;
      this.#pendingSpawnRequests.shift();
    }
  }

  #resolveBreach(token: string): FacilityBreach | null {
    const active = this.#facility.activeBreaches;
    if (active.length === 0) return null;
    const normalized = token.trim().toLowerCase();
    const aliases: Readonly<Record<string, readonly string[]>> = Object.freeze({
      hangar: Object.freeze(['dock', 'loading']),
      reactor: Object.freeze(['power', 'generator']),
    });
    const terms = Object.freeze([normalized, ...(aliases[normalized] ?? [])]);
    const coherent = active.filter((breach) =>
      terms.some((term) => term.length > 0 && breach.id.toLowerCase().includes(term)),
    );
    const candidates = coherent.length > 0 ? coherent : active;
    return candidates[Math.floor(this.#random() * candidates.length)] ?? candidates[0];
  }

  #processEnemyEvents(events: readonly EnemyEvent[]): void {
    for (const event of events) {
      routeEnemyAttackPresentation(event, (enemyId) => this.#enemyView.triggerAttack(enemyId));
      switch (event.type) {
        case 'contact-attack':
          this.#combat.applyDamage(event.damage);
          break;
        case 'hazard-attack':
          try {
            this.#onHazardAttack(event);
          } catch {
            // Presentation/projectile callbacks cannot roll back simulation state.
          }
          break;
        case 'death':
          this.#processDeath(event);
          break;
        case 'spawn-request':
          this.#processChildSpawn(event);
          break;
      }
    }
  }

  #processDeath(event: EnemyDeathEvent): void {
    this.#runState.recordEnemyDefeated(event.elite, event.enemyId);
    this.#addCredits(event.reward);
    this.#pickupSystem.rollEnemyDrop(event.enemyType, event.x, event.y);
    this.#onEnemyDeath?.(event);
  }

  #processChildSpawn(event: EnemySpawnRequestEvent): void {
    this.#enemySystem.spawn(
      event.enemyType,
      event.x,
      event.y,
      event.elite,
    );
  }

  #occupiedEnemyCapacity(): number {
    const counts = [
      this.#enemySystem.activeCount,
      this.#enemySystem.reservedCount,
      this.#pendingSpawnRequests.length,
    ];
    if (counts.some((count) => !Number.isSafeInteger(count) || count < 0)) {
      return MAX_ACTIVE_ENEMIES;
    }
    return Math.min(
      MAX_ACTIVE_ENEMIES,
      counts.reduce((sum, count) => sum + count, 0),
    );
  }

  #spawnBossMinion(event: MinionSpawnRequestEvent): boolean {
    return this.#enemySystem.spawn(
      event.enemyType,
      event.x,
      event.y,
      false,
    ).spawned;
  }

  #updateBossObjective(): void {
    const phase = this.#bossRuntime.snapshot.phase;
    if (phase === this.#lastBossPhase) return;
    this.#lastBossPhase = phase;
    switch (phase) {
      case 'armored':
        this.#combat.setObjective('QUEEN ARMORED // HOLD FIRE // BREAK NESTS');
        break;
      case 'nest-spawn':
        this.#combat.setObjective('NEST SURGE // DESTROY TELEPORTER PODS');
        break;
      case 'vulnerable':
        this.#combat.setObjective('CORE EXPOSED // FOCUS FIRE');
        break;
      case 'idle':
      case 'defeated':
        break;
    }
  }

  #handleQueenDefeated(event: QueenDefeatedEvent): void {
    if (
      this.#queenDefeatHandled ||
      this.#defeatReported ||
      this.#combat.snapshot.dead ||
      this.#director.phase !== 'boss'
    ) {
      return;
    }
    this.#queenDefeatHandled = true;
    this.#onQueenDefeated?.(Object.freeze({ x: event.x, y: event.y }));
    this.#addCredits(event.reward);
    this.#pendingSpawnRequests.length = 0;
    this.#runState.finishVictory(
      this.#upgradeSystem.levels,
      this.#combat.snapshot.credits,
    );
    this.#processHordeEvents(this.#director.reportBossDefeated());
  }

  #updatePickups(
    deltaMs: number,
    player: Readonly<{ x: number; y: number }>,
  ): void {
    const modifiers = this.#upgradeSystem.modifiers;
    this.#pickupSystem.update(deltaMs, player, {
      magnetEnabled: modifiers.pickupMagnetEnabled,
      pickupEfficiency: modifiers.pickupValueMultiplier,
    });

    for (const pickup of this.#pickupSystem.snapshot) {
      if (Math.hypot(player.x - pickup.x, player.y - pickup.y) > PICKUP_RADIUS) {
        continue;
      }
      const collection = this.#pickupSystem.collect(pickup.id, player, {
        pickupEfficiency: modifiers.pickupValueMultiplier,
      });
      if (collection.collected) {
        this.#applyPickupReward(collection.reward);
        this.#onPickupCollected?.(
          collection.reward,
          Object.freeze({ x: pickup.x, y: pickup.y }),
        );
      }
    }
  }

  #applyPickupReward(reward: PickupReward): void {
    switch (reward.kind) {
      case 'credits':
        this.#addCredits(reward.credits);
        break;
      case 'health':
        this.#combat.restoreHealth(reward.amount);
        break;
      case 'armor':
        this.#combat.restoreArmor(reward.amount);
        break;
      case 'ammo':
        this.#combat.addReserveAmmo(reward.amount);
        break;
      case 'grenade':
        this.#combat.addGrenades(reward.amount);
        break;
    }
  }

  #updateArmory(deltaMs: number): void {
    if (!this.#upgradeSystem.armory.open) return;
    const resolution = this.#upgradeSystem.update(deltaMs);
    if (resolution) {
      this.#completeArmoryResolution(resolution);
      return;
    }
    this.#armoryOverlay.update(this.#upgradeSystem.armory);
  }

  #purchaseArmoryOffer(offer: UpgradeOffer, index: number): void {
    if (this.#destroyed || !this.#upgradeSystem.armory.open) return;
    const current = this.#upgradeSystem.armory.offers[index];
    if (
      current?.id !== offer.id ||
      !current.affordable ||
      current.cost > this.#upgradeSystem.armory.credits
    ) {
      return;
    }
    const result = this.#upgradeSystem.purchase(offer.id);
    if (!result.purchased) return;
    this.#completeArmoryResolution(
      Object.freeze({ ...result, automatic: true }),
    );
  }

  #resolveArmoryTimeout(): void {
    if (!this.#upgradeSystem.armory.open) return;
    this.#completeArmoryResolution(this.#upgradeSystem.timeout());
  }

  #resumeArmoryIfNeeded(): void {
    if (this.#director.phase === 'armory') this.#resolveArmoryTimeout();
  }

  #completeArmoryResolution(resolution: AutomaticResolution): void {
    const currentCredits = this.#combat.snapshot.credits;
    const remainingCredits = resolution.purchased
      ? Math.max(0, currentCredits - resolution.spent)
      : currentCredits;
    this.#combat.setCredits(remainingCredits);
    this.#applyUpgradeModifiers();
    this.#armoryOverlay.hide();
    this.#processHordeEvents(this.#director.completeArmory());
  }

  #applyUpgradeModifiers(): void {
    const modifiers = this.#upgradeSystem.modifiers;
    this.#combat.setModifiers({
      damageMultiplier: modifiers.damageMultiplier,
      penetrationBonus: modifiers.penetrationBonus,
      spreadMultiplier: modifiers.spreadMultiplier,
      reloadMultiplier: modifiers.reloadMultiplier,
      magazineMultiplier: modifiers.magazineMultiplier,
      maxArmorBonus: modifiers.maxArmorBonus,
    });
    this.#player.setSpeedMultiplier(modifiers.movementMultiplier);
  }

  #reportDefeatIfNeeded(): void {
    if (
      this.#defeatReported ||
      !this.#combat.snapshot.dead ||
      !['combat', 'armory', 'boss'].includes(this.#director.phase)
    ) {
      return;
    }
    this.#defeatReported = true;
    this.#pendingSpawnRequests.length = 0;
    if (this.#upgradeSystem.cancelArmory()) this.#armoryOverlay.hide();
    this.#runState.finishDefeat(
      this.#upgradeSystem.levels,
      this.#combat.snapshot.credits,
    );
    const events = this.#director.reportPlayerDefeated();
    this.#processHordeEvents(events);
    if (events.length === 0) {
      this.#combat.setObjective('MARINE DOWN // CONTAINMENT FAILED');
    }
  }

  #addCredits(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const reward = Math.floor(amount);
    if (!Number.isSafeInteger(reward) || reward <= 0) return;
    const current = this.#combat.snapshot.credits;
    this.#combat.setCredits(
      Math.min(Number.MAX_SAFE_INTEGER, current + reward),
    );
  }

  #canEnemyMove(context: CollisionSteeringContext): boolean {
    const { toX, toY, radius } = context;
    if (
      !Number.isFinite(toX) ||
      !Number.isFinite(toY) ||
      !Number.isFinite(radius) ||
      radius < 0 ||
      toX - radius < FACILITY_LAYOUT.bounds.x ||
      toY - radius < FACILITY_LAYOUT.bounds.y ||
      toX + radius > FACILITY_LAYOUT.bounds.x + FACILITY_LAYOUT.bounds.width ||
      toY + radius > FACILITY_LAYOUT.bounds.y + FACILITY_LAYOUT.bounds.height
    ) {
      return false;
    }

    for (const wall of FACILITY_LAYOUT.walls) {
      if (intersectsCircle(toX, toY, radius, wall)) return false;
    }
    const wave = this.#combat.snapshot.wave;
    for (const door of FACILITY_LAYOUT.doors) {
      if (
        door.initialState === 'closed' &&
        door.unlockWave > wave &&
        intersectsCircle(toX, toY, radius, door)
      ) {
        return false;
      }
    }
    return true;
  }

  #radialDirection(
    enemyId: number,
    offsetX: number,
    offsetY: number,
  ): Readonly<{ x: number; y: number }> {
    const distance = Math.hypot(offsetX, offsetY);
    if (distance > 0 && Number.isFinite(distance)) {
      return Object.freeze({ x: offsetX / distance, y: offsetY / distance });
    }
    return Object.freeze({ x: enemyId % 2 === 0 ? -1 : 1, y: 0 });
  }

  #createBreachEffect(breach: FacilityBreach): void {
    if (this.#destroyed) return;
    while (this.#breachEffects.size >= this.#breachEffectLimit) {
      const oldest = this.#breachEffects.values().next().value;
      if (!oldest) break;
      this.#retireBreachEffect(oldest, true);
    }

    const effect = this.#scene.add.graphics({ x: breach.x, y: breach.y });
    effect.setDepth(breach.y + 10);
    effect.fillStyle(0xf39237, 0.12);
    effect.fillCircle(0, 0, 24);
    effect.lineStyle(3, 0xf39237, 0.9);
    effect.strokeCircle(0, 0, 28);
    effect.lineStyle(1, 0x69d8e7, 0.8);
    effect.strokeCircle(0, 0, 18);
    effect.setScale(0.5);
    this.#breachEffects.add(effect);

    const tween = this.#scene.tweens.add({
      targets: effect,
      scale: 1.45,
      alpha: 0,
      duration: BREACH_EFFECT_DURATION_MS,
      ease: 'Cubic.Out',
      onComplete: (): void => {
        this.#breachTweens.delete(tween);
        this.#breachTweenByEffect.delete(effect);
        this.#breachEffects.delete(effect);
        if (effect.active) effect.destroy();
      },
    });
    this.#breachTweens.add(tween);
    this.#breachTweenByEffect.set(effect, tween);
  }

  #retireBreachEffect(
    effect: Phaser.GameObjects.Graphics,
    destroyDisplayObject: boolean,
  ): void {
    const tween = this.#breachTweenByEffect.get(effect);
    if (tween) {
      tween.stop();
      this.#scene.tweens.remove(tween);
      this.#breachTweens.delete(tween);
      this.#breachTweenByEffect.delete(effect);
    }
    this.#breachEffects.delete(effect);
    if (destroyDisplayObject && effect.active) effect.destroy();
  }

  #clearBreachEffects(destroyDisplayObjects: boolean): void {
    if (!destroyDisplayObjects) {
      this.#breachEffects.clear();
      this.#breachTweens.clear();
      this.#breachTweenByEffect.clear();
      return;
    }
    for (const effect of [...this.#breachEffects]) {
      this.#retireBreachEffect(effect, true);
    }
  }

  #syncViews(): void {
    if (this.#destroyed) return;
    this.#enemyView.sync(this.#enemySystem.snapshot.enemies);
    this.#pickupView.sync(this.#pickupSystem.snapshot);
  }

  #random(): number {
    this.#randomState = (this.#randomState + 0x6d2b79f5) >>> 0;
    let value = this.#randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }

  #dispose(destroyDisplayObjects: boolean): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#scene.events.off(
      Phaser.Scenes.Events.SHUTDOWN,
      this.#handleSceneShutdown,
    );
    this.#clearBreachEffects(destroyDisplayObjects);
    this.#bossRuntime.destroy();
    this.#enemyView.destroy();
    this.#pickupView.destroy();
    if (destroyDisplayObjects) this.#armoryOverlay.destroy();
  }
}
