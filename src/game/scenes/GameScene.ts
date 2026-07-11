import Phaser from 'phaser';

import { TEXTURE_KEYS } from '../art/createTextures';
import {
  CombatSystem,
  ProjectileHitTracker,
  type ProjectileRequest,
} from '../combat/CombatSystem';
import { ProjectilePool } from '../combat/ProjectilePool';
import type { WeaponId } from '../combat/types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { installDiagnostics, type DiagnosticsCleanup } from '../diagnostics/diagnostics';
import type { HazardAttackEvent } from '../enemies/EnemySystem';
import { Hud } from '../hud/Hud';
import { DesktopInput } from '../input/DesktopInput';
import { Player } from '../player/Player';
import { HordeRuntime } from '../waves/HordeRuntime';
import { FacilityWorld } from '../world/FacilityWorld';
import type { ResultsSceneData } from './ResultsScene';
import { SCENE_KEYS } from './sceneKeys';

const CAMERA_BACKGROUND = '#070a0f';
const INITIAL_OBJECTIVE = 'MOVE OR FIRE TO INITIATE LOCKDOWN';
const PROJECTILE_INITIAL_SIZE = 180;
const PROJECTILE_MAX_SIZE = 300;
const MAX_DELTA_MS = 100;
const MUZZLE_DISTANCE = 38;
const MUZZLE_FLASH_MS = 48;
const ACID_PROJECTILE_SPEED = 340;
const HAZARD_POOL_RADIUS = 54;
const HAZARD_POOL_LIFETIME_MS = 4_000;
const HAZARD_POOL_TICK_MS = 700;
const HAZARD_POOL_DAMAGE_FRACTION = 0.35;
const MAX_HAZARD_POOLS = 20;
const RESULTS_TRANSITION_DELAY_MS = 700;

type ProjectileImage = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

type ProjectileKind = 'player' | 'grenade' | 'enemy-hazard';

type ProjectileInit =
  | Readonly<{
      request: ProjectileRequest;
      kind: 'player' | 'grenade';
    }>
  | Readonly<{
      request: ProjectileRequest;
      kind: 'enemy-hazard';
      originX: number;
      originY: number;
    }>;

type ProjectileRuntime = {
  lifetimeMs: number;
  request: ProjectileRequest;
  hitTracker: ProjectileHitTracker;
  kind: ProjectileKind;
};

type HazardPoolState = {
  effect: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  radius: number;
  remainingMs: number;
  tickCooldownMs: number;
  baseDamage: number;
  damageFraction: number;
};

type ProjectilePresentation = Readonly<{
  texture: string;
  width: number;
  height: number;
}>;

const projectilePresentation = (
  weaponId: WeaponId,
  kind: ProjectileKind,
): ProjectilePresentation => {
  if (kind === 'enemy-hazard' || kind === 'grenade') {
    return {
      texture: TEXTURE_KEYS.projectileAcid,
      width: kind === 'enemy-hazard' ? 16 : 18,
      height: kind === 'enemy-hazard' ? 16 : 18,
    };
  }
  if (weaponId === 'plasma') {
    return {
      texture: TEXTURE_KEYS.projectilePlasma,
      width: 18,
      height: 18,
    };
  }
  if (weaponId === 'rocket') {
    return {
      texture: TEXTURE_KEYS.projectileAcid,
      width: 30,
      height: 14,
    };
  }
  return {
    texture: TEXTURE_KEYS.projectileBullet,
    width: weaponId === 'shotgun' ? 16 : 22,
    height: weaponId === 'shotgun' ? 6 : 7,
  };
};

const safeDelta = (delta: number): number =>
  Number.isFinite(delta) ? Phaser.Math.Clamp(delta, 0, MAX_DELTA_MS) : 0;

export class GameScene extends Phaser.Scene {
  private facility: FacilityWorld | null = null;
  private player: Player | null = null;
  private desktopInput: DesktopInput | null = null;
  private combat: CombatSystem | null = null;
  private hud: Hud | null = null;
  private horde: HordeRuntime | null = null;
  private projectileGroup: Phaser.Physics.Arcade.Group | null = null;
  private projectilePool: ProjectilePool<ProjectileImage, ProjectileInit> | null = null;
  private playerCollider: Phaser.Physics.Arcade.Collider | null = null;
  private projectileCollider: Phaser.Physics.Arcade.Collider | null = null;
  private projectileEnemyOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private projectileBossOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private projectilePlayerOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private muzzleFlash: Phaser.GameObjects.Image | null = null;
  private muzzleTimer: Phaser.Time.TimerEvent | null = null;
  private missionBanner: Phaser.GameObjects.Container | null = null;
  private missionBannerTween: Phaser.Tweens.Tween | null = null;
  private cleanupDiagnostics: DiagnosticsCleanup | null = null;
  private readonly activeProjectiles = new Set<ProjectileImage>();
  private readonly projectileRuntime = new Map<ProjectileImage, ProjectileRuntime>();
  private readonly blastEffects = new Set<Phaser.GameObjects.Graphics>();
  private readonly blastTweens = new Set<Phaser.Tweens.Tween>();
  private readonly hazardPools = new Set<HazardPoolState>();
  private missionStarted = false;
  private shuttingDown = false;
  private resultTransitionRemainingMs: number | null = null;
  private resultSceneStarted = false;

  private readonly handleProjectileBlockerCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    first,
  ): void => {
    const projectile = this.asActiveProjectile(first);
    if (projectile === null) return;

    const runtime = this.projectileRuntime.get(projectile);
    if (!runtime) return;
    this.endProjectileAt(projectile, projectile.x, projectile.y);
  };

  private readonly handleProjectileEnemyOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    first,
    second,
  ): void => {
    const projectile = this.asActiveProjectile(first);
    const horde = this.horde;
    if (projectile === null || horde === null) return;

    const runtime = this.projectileRuntime.get(projectile);
    if (!runtime || runtime.kind === 'enemy-hazard') return;

    const enemyId = horde.enemyIdFor(second);
    if (enemyId === null) return;

    if (runtime.request.splashRadius > 0) {
      this.detonateProjectile(projectile, projectile.x, projectile.y);
      return;
    }

    const angle = Number.isFinite(runtime.request.angle) ? runtime.request.angle : 0;
    const magnitude = Number.isFinite(runtime.request.knockback)
      ? Math.max(0, runtime.request.knockback)
      : 0;
    const knockbackX = Math.cos(angle) * magnitude;
    const knockbackY = Math.sin(angle) * magnitude;
    const hit = horde.handleProjectileHit(
      enemyId,
      runtime.request,
      runtime.hitTracker,
      {
        x: Number.isFinite(knockbackX) ? knockbackX : 0,
        y: Number.isFinite(knockbackY) ? knockbackY : 0,
      },
    );
    if (hit.exhausted) this.releaseProjectile(projectile);
  };

  private readonly handleProjectileBossOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    first,
    second,
  ): void => {
    const projectile = this.asActiveProjectile(first);
    const horde = this.horde;
    if (projectile === null || horde === null) return;

    const runtime = this.projectileRuntime.get(projectile);
    if (!runtime || runtime.kind === 'enemy-hazard') return;

    const target = horde.bossTargetFor(second);
    if (target === null) return;

    if (runtime.request.splashRadius > 0) {
      this.detonateProjectile(projectile, projectile.x, projectile.y);
      return;
    }

    const hit = horde.handleBossProjectileHit(
      target,
      runtime.request,
      runtime.hitTracker,
    );
    if (hit.exhausted) this.releaseProjectile(projectile);
  };

  private readonly handleProjectilePlayerOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    first,
  ): void => {
    const projectile = this.asActiveProjectile(first);
    if (projectile === null) return;

    const runtime = this.projectileRuntime.get(projectile);
    if (!runtime || runtime.kind !== 'enemy-hazard') return;

    this.combat?.applyDamage(runtime.request.damage);
    this.createHazardPool(projectile.x, projectile.y, runtime.request.damage);
    this.releaseProjectile(projectile);
  };

  private readonly handleHazardAttack = (attack: HazardAttackEvent): void => {
    if (
      this.shuttingDown ||
      !Number.isFinite(attack.sourceX) ||
      !Number.isFinite(attack.sourceY) ||
      !Number.isFinite(attack.targetX) ||
      !Number.isFinite(attack.targetY) ||
      !Number.isFinite(attack.damage) ||
      attack.damage <= 0
    ) {
      return;
    }

    const offsetX = attack.targetX - attack.sourceX;
    const offsetY = attack.targetY - attack.sourceY;
    const angle = offsetX === 0 && offsetY === 0 ? 0 : Math.atan2(offsetY, offsetX);
    const request: ProjectileRequest = Object.freeze({
      weaponId: 'plasma',
      damage: attack.damage,
      speed: ACID_PROJECTILE_SPEED,
      radius: 8,
      angle: Number.isFinite(angle) ? angle : 0,
      penetration: 1,
      splashRadius: 0,
      knockback: 0,
    });
    this.spawnProjectile(
      Object.freeze({
        request,
        kind: 'enemy-hazard',
        originX: attack.sourceX,
        originY: attack.sourceY,
      }),
    );
  };

  private readonly hideMuzzleFlash = (): void => {
    this.muzzleFlash?.setVisible(false);
    if (this.muzzleTimer) this.muzzleTimer.paused = true;
  };

  private readonly handleShutdown = (): void => {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.resetResultTransition();

    this.cleanupDiagnostics?.();
    this.cleanupDiagnostics = null;

    if (this.muzzleTimer) {
      this.muzzleTimer.remove(false);
      this.muzzleTimer = null;
    }
    this.muzzleFlash?.setVisible(false).destroy();
    this.muzzleFlash = null;

    if (this.missionBannerTween) {
      this.missionBannerTween.stop();
      this.tweens.remove(this.missionBannerTween);
      this.missionBannerTween = null;
    }
    this.missionBanner?.destroy();
    this.missionBanner = null;

    for (const tween of [...this.blastTweens]) {
      tween.stop();
      this.tweens.remove(tween);
    }
    this.blastTweens.clear();
    for (const effect of this.blastEffects) effect.destroy();
    this.blastEffects.clear();

    this.projectileEnemyOverlap?.destroy();
    this.projectileEnemyOverlap = null;
    this.projectileBossOverlap?.destroy();
    this.projectileBossOverlap = null;
    this.projectilePlayerOverlap?.destroy();
    this.projectilePlayerOverlap = null;
    this.projectileCollider?.destroy();
    this.projectileCollider = null;
    this.playerCollider?.destroy();
    this.playerCollider = null;

    this.horde?.destroy();
    this.horde = null;
    // Scene shutdown may already have detached these world-space Graphics.
    // Drop bookkeeping only and let Phaser finish destroying Scene ownership.
    this.clearHazardPools(false);

    // Phaser has already begun dismantling scene-owned groups, bodies, and
    // display objects when SHUTDOWN is emitted. Drop our pool bookkeeping and
    // let the Scene own destruction; manual run resets still call clearProjectiles.
    this.projectileGroup = null;
    this.projectilePool = null;
    this.activeProjectiles.clear();
    this.projectileRuntime.clear();

    this.hud?.destroy();
    this.hud = null;
    this.desktopInput?.destroy();
    this.desktopInput = null;
    this.player = null;
    this.facility = null;
    this.combat = null;
  };

  constructor() {
    super({ key: SCENE_KEYS.game });
  }

  create(): void {
    this.shuttingDown = false;
    this.missionStarted = false;
    this.resetResultTransition();
    this.activeProjectiles.clear();
    this.projectileRuntime.clear();
    this.hazardPools.clear();

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main
      .setBackgroundColor(CAMERA_BACKGROUND)
      .setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const facility = new FacilityWorld(this);
    facility.reset();
    facility.setWaveAccess(0);
    this.facility = facility;

    const player = new Player(this, facility.playerSpawn);
    this.player = player;
    this.playerCollider = this.physics.add.collider(
      player.sprite,
      facility.colliderGroup,
    );
    this.cameras.main.startFollow(player.sprite, false, 0.12, 0.12);

    const combat = new CombatSystem();
    combat.setWave(0);
    combat.setObjective(INITIAL_OBJECTIVE);
    this.combat = combat;

    this.desktopInput = new DesktopInput(this);
    this.projectileGroup = this.physics.add.group({ allowGravity: false });
    this.projectilePool = this.createProjectilePool();
    this.projectileCollider = this.physics.add.collider(
      this.projectileGroup,
      facility.colliderGroup,
      this.handleProjectileBlockerCollision,
    );

    const horde = new HordeRuntime({
      scene: this,
      combat,
      player,
      facility,
      onHazardAttack: this.handleHazardAttack,
    });
    this.horde = horde;
    this.projectileEnemyOverlap = this.physics.add.overlap(
      this.projectileGroup,
      horde.enemyGroup,
      this.handleProjectileEnemyOverlap,
    );
    if (this.projectileBossOverlap === null) {
      this.projectileBossOverlap = this.physics.add.overlap(
        this.projectileGroup,
        horde.bossGroup,
        this.handleProjectileBossOverlap,
      );
    }
    this.projectilePlayerOverlap = this.physics.add.overlap(
      this.projectileGroup,
      player.sprite,
      this.handleProjectilePlayerOverlap,
    );

    this.muzzleFlash = this.add
      .image(player.sprite.x, player.sprite.y, TEXTURE_KEYS.muzzleFlash)
      .setDepth(player.sprite.y + 6)
      .setVisible(false);
    this.muzzleTimer = this.time.addEvent({
      delay: MUZZLE_FLASH_MS,
      callback: this.hideMuzzleFlash,
      callbackScope: this,
      loop: true,
      paused: true,
    });

    this.hud = new Hud(this, combat);
    this.createMissionBanner();
    this.installSceneDiagnostics();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);
  }

  update(_time: number, delta: number): void {
    const combat = this.combat;
    const player = this.player;
    const desktopInput = this.desktopInput;
    const horde = this.horde;
    if (this.shuttingDown || !combat || !player || !desktopInput || !horde) return;

    const deltaMs = safeDelta(delta);
    if (this.resultTransitionRemainingMs !== null || this.resultSceneStarted) {
      this.advanceResultTransition(deltaMs, horde);
      return;
    }
    if (this.beginResultTransition(horde, player)) {
      this.hud?.setRadarState(player.sprite.x, player.sprite.y, horde.radarPositions);
      return;
    }

    combat.update(deltaMs);

    const input = desktopInput.read(this.cameras.main, player.sprite);
    const snapshot = combat.getSnapshot();
    const armoryVisible = horde.armoryVisible;
    const canAct = !snapshot.dead && !input.pausePressed && !armoryVisible;

    if (canAct) player.applyInput(input);
    else player.stop();

    let projectileSpawned = false;
    if (armoryVisible) {
      const armoryIndex =
        input.weaponPressed === 'pistol'
          ? 0
          : input.weaponPressed === 'rifle'
            ? 1
            : input.weaponPressed === 'shotgun'
              ? 2
              : null;
      if (armoryIndex !== null) horde.selectArmoryIndex(armoryIndex);
    } else if (canAct) {
      if (input.weaponPressed !== null) combat.switchWeapon(input.weaponPressed);
      if (input.reloadPressed) combat.startReload();
      if (input.medkitPressed) combat.consumeMedkit();

      const aimAngle = this.getAimAngle(input.aimWorldX, input.aimWorldY);
      if (input.fireHeld) {
        for (const request of combat.fire(aimAngle)) {
          projectileSpawned =
            this.spawnProjectile({ request, kind: 'player' }) || projectileSpawned;
        }
        if (projectileSpawned) this.showMuzzleFlash(aimAngle);
      }

      if (input.grenadePressed) {
        const grenade = combat.throwGrenade(aimAngle);
        if (grenade !== null) {
          const request: ProjectileRequest = Object.freeze({
            weaponId: 'rocket',
            damage: grenade.damage,
            speed: grenade.speed,
            radius: 9,
            angle: grenade.angle,
            penetration: 1,
            splashRadius: grenade.splashRadius,
            knockback: grenade.knockback,
          });
          projectileSpawned =
            this.spawnProjectile({ request, kind: 'grenade' }) || projectileSpawned;
        }
      }

      const moved = input.movementX !== 0 || input.movementY !== 0;
      if (!this.missionStarted && (moved || projectileSpawned)) {
        this.initiateLockdown();
      }
    }

    horde.update(deltaMs);
    if (this.beginResultTransition(horde, player)) {
      this.hud?.setRadarState(player.sprite.x, player.sprite.y, horde.radarPositions);
      return;
    }
    const armoryOpenAfterUpdate = horde.armoryVisible;
    if (armoryOpenAfterUpdate) this.clearHostileEffects();
    this.updateProjectiles(deltaMs);
    if (!armoryOpenAfterUpdate) this.updateHazardPools(deltaMs);
    this.hud?.setRadarState(player.sprite.x, player.sprite.y, horde.radarPositions);
  }

  private beginResultTransition(horde: HordeRuntime, player: Player): boolean {
    if (horde.phase !== 'victory' && horde.phase !== 'defeat') return false;
    if (this.resultTransitionRemainingMs === null && !this.resultSceneStarted) {
      this.resultTransitionRemainingMs = RESULTS_TRANSITION_DELAY_MS;
      player.stop();
      this.hideMuzzleFlash();
      this.clearProjectiles();
      this.clearHazardPools(true);
    }
    return true;
  }

  private advanceResultTransition(deltaMs: number, horde: HordeRuntime): void {
    this.player?.stop();
    if (this.resultSceneStarted) return;

    const remainingMs = this.resultTransitionRemainingMs;
    if (remainingMs === null) return;
    this.resultTransitionRemainingMs = Math.max(0, remainingMs - deltaMs);
    if (this.resultTransitionRemainingMs > 0) return;

    this.resultTransitionRemainingMs = null;
    this.resultSceneStarted = true;
    this.scene.start(
      SCENE_KEYS.results,
      { result: horde.runResult } satisfies ResultsSceneData,
    );
  }

  private resetResultTransition(): void {
    this.resultTransitionRemainingMs = null;
    this.resultSceneStarted = false;
  }

  private createProjectilePool(): ProjectilePool<ProjectileImage, ProjectileInit> {
    return new ProjectilePool<ProjectileImage, ProjectileInit>(
      {
        create: (): ProjectileImage => {
          const projectile = this.physics.add
            .image(0, 0, TEXTURE_KEYS.projectileBullet)
            .setActive(false)
            .setVisible(false);
          projectile.body.setAllowGravity(false);
          projectile.body.enable = false;
          this.projectileGroup?.add(projectile);
          return projectile;
        },
        activate: (projectile, init): void => {
          const { request, kind } = init;
          if (!Number.isFinite(request.angle) || !Number.isFinite(request.speed)) {
            throw new Error('Cannot activate projectile without a finite launch state');
          }

          const player = this.player;
          if (kind !== 'enemy-hazard' && player === null) {
            throw new Error('Cannot activate a player projectile without its owner');
          }
          const originX =
            kind === 'enemy-hazard'
              ? init.originX
              : player!.sprite.x + Math.cos(request.angle) * MUZZLE_DISTANCE;
          const originY =
            kind === 'enemy-hazard'
              ? init.originY
              : player!.sprite.y + Math.sin(request.angle) * MUZZLE_DISTANCE;
          if (!Number.isFinite(originX) || !Number.isFinite(originY)) {
            throw new Error('Cannot activate projectile without a finite origin');
          }

          const presentation = projectilePresentation(request.weaponId, kind);
          const radius = Phaser.Math.Clamp(
            Number.isFinite(request.radius) ? request.radius : 4,
            2,
            12,
          );
          const speed = Math.max(0, request.speed);

          projectile
            .setTexture(presentation.texture)
            .setDisplaySize(presentation.width, presentation.height)
            .setPosition(originX, originY)
            .setRotation(request.angle)
            .setDepth(originY + 4)
            .setActive(true)
            .setVisible(true);
          projectile.body.enable = true;
          projectile.body.reset(originX, originY);
          projectile.setCircle(radius);
          projectile.setVelocity(
            Math.cos(request.angle) * speed,
            Math.sin(request.angle) * speed,
          );

          this.projectileRuntime.set(projectile, {
            lifetimeMs:
              kind === 'grenade' ? 1_600 : request.weaponId === 'rocket' ? 3_400 : 2_800,
            request,
            hitTracker: new ProjectileHitTracker(request.penetration),
            kind,
          });
          this.activeProjectiles.add(projectile);
        },
        deactivate: (projectile): void => {
          projectile.setVelocity(0, 0);
          projectile.body.enable = false;
          projectile.setActive(false).setVisible(false).setPosition(0, 0).setRotation(0);
          this.projectileRuntime.delete(projectile);
          this.activeProjectiles.delete(projectile);
        },
      },
      PROJECTILE_INITIAL_SIZE,
      PROJECTILE_MAX_SIZE,
    );
  }

  private spawnProjectile(init: ProjectileInit): boolean {
    const pool = this.projectilePool;
    return pool !== null && pool.acquire(init) !== null;
  }

  private releaseProjectile(projectile: ProjectileImage): void {
    this.projectilePool?.release(projectile);
  }

  private detonateProjectile(projectile: ProjectileImage, x: number, y: number): void {
    const runtime = this.projectileRuntime.get(projectile);
    if (!runtime || !this.activeProjectiles.has(projectile)) return;

    const blastX = Phaser.Math.Clamp(Number.isFinite(x) ? x : projectile.x, 0, WORLD_WIDTH);
    const blastY = Phaser.Math.Clamp(Number.isFinite(y) ? y : projectile.y, 0, WORLD_HEIGHT);
    const knockback = Number.isFinite(runtime.request.knockback)
      ? Math.max(0, runtime.request.knockback)
      : 0;
    this.horde?.applyAreaDamage(
      blastX,
      blastY,
      runtime.request.damage,
      runtime.request.splashRadius,
      knockback,
    );
    this.createBlast(blastX, blastY, runtime.request.splashRadius);
    this.releaseProjectile(projectile);
  }

  private endProjectileAt(projectile: ProjectileImage, x: number, y: number): void {
    const runtime = this.projectileRuntime.get(projectile);
    if (!runtime || !this.activeProjectiles.has(projectile)) return;

    const endX = Phaser.Math.Clamp(Number.isFinite(x) ? x : projectile.x, 0, WORLD_WIDTH);
    const endY = Phaser.Math.Clamp(Number.isFinite(y) ? y : projectile.y, 0, WORLD_HEIGHT);
    if (runtime.kind !== 'enemy-hazard' && runtime.request.splashRadius > 0) {
      this.detonateProjectile(projectile, endX, endY);
      return;
    }
    if (runtime.kind === 'enemy-hazard') {
      this.createHazardPool(endX, endY, runtime.request.damage);
    }
    this.releaseProjectile(projectile);
  }

  private updateProjectiles(deltaMs: number): void {
    for (const projectile of [...this.activeProjectiles]) {
      const runtime = this.projectileRuntime.get(projectile);
      if (!runtime) {
        this.releaseProjectile(projectile);
        continue;
      }

      runtime.lifetimeMs -= deltaMs;
      projectile.setDepth(projectile.y + 4);
      const outsideWorld =
        projectile.x < 0 ||
        projectile.x > WORLD_WIDTH ||
        projectile.y < 0 ||
        projectile.y > WORLD_HEIGHT;
      if (runtime.lifetimeMs <= 0 || outsideWorld) {
        this.endProjectileAt(projectile, projectile.x, projectile.y);
      }
    }
  }

  private clearProjectiles(): void {
    if (!this.projectilePool) {
      this.activeProjectiles.clear();
      this.projectileRuntime.clear();
      return;
    }

    try {
      this.projectilePool.clear();
    } catch {
      for (const projectile of [...this.activeProjectiles]) {
        try {
          this.projectilePool.release(projectile);
        } catch {
          projectile.body.enable = false;
          projectile.setActive(false).setVisible(false);
        }
      }
    }
    this.activeProjectiles.clear();
    this.projectileRuntime.clear();
  }

  private asActiveProjectile(
    value:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): ProjectileImage | null {
    if (!(value instanceof Phaser.Physics.Arcade.Image)) return null;
    const projectile = value as ProjectileImage;
    return this.activeProjectiles.has(projectile) ? projectile : null;
  }

  private getAimAngle(aimWorldX: number, aimWorldY: number): number {
    const player = this.player;
    if (!player || !Number.isFinite(aimWorldX) || !Number.isFinite(aimWorldY)) {
      return 0;
    }

    const offsetX = aimWorldX - player.sprite.x;
    const offsetY = aimWorldY - player.sprite.y;
    if (offsetX === 0 && offsetY === 0) {
      return Number.isFinite(player.sprite.rotation) ? player.sprite.rotation : 0;
    }
    const angle = Math.atan2(offsetY, offsetX);
    return Number.isFinite(angle) ? angle : 0;
  }

  private showMuzzleFlash(angle: number): void {
    const player = this.player;
    const muzzleFlash = this.muzzleFlash;
    const muzzleTimer = this.muzzleTimer;
    if (!player || !muzzleFlash || !muzzleTimer) return;

    const muzzleX = player.sprite.x + Math.cos(angle) * MUZZLE_DISTANCE;
    const muzzleY = player.sprite.y + Math.sin(angle) * MUZZLE_DISTANCE;
    muzzleFlash
      .setPosition(muzzleX, muzzleY)
      .setRotation(angle)
      .setDepth(muzzleY + 7)
      .setVisible(true);
    muzzleTimer.reset({
      delay: MUZZLE_FLASH_MS,
      callback: this.hideMuzzleFlash,
      callbackScope: this,
      loop: true,
      paused: false,
    });
  }

  private createBlast(x: number, y: number, requestedRadius: number): void {
    if (this.shuttingDown) return;
    const radius = Phaser.Math.Clamp(
      Number.isFinite(requestedRadius) && requestedRadius > 0 ? requestedRadius : 72,
      56,
      132,
    );
    const effect = this.add.graphics({ x, y }).setDepth(y + 8);
    effect.fillStyle(0xf39237, 0.2);
    effect.fillCircle(0, 0, radius * 0.48);
    effect.lineStyle(4, 0xf39237, 0.92);
    effect.strokeCircle(0, 0, radius * 0.52);
    effect.lineStyle(2, 0x69d8e7, 0.8);
    effect.strokeCircle(0, 0, radius * 0.34);
    effect.setScale(0.32);
    this.blastEffects.add(effect);

    const tween = this.tweens.add({
      targets: effect,
      scale: 1,
      alpha: 0,
      duration: 190,
      ease: 'Cubic.Out',
      onComplete: (): void => {
        this.blastTweens.delete(tween);
        this.blastEffects.delete(effect);
        effect.destroy();
      },
    });
    this.blastTweens.add(tween);
  }

  private createHazardPool(x: number, y: number, baseDamage: number): void {
    if (
      this.shuttingDown ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(baseDamage) ||
      baseDamage <= 0
    ) {
      return;
    }
    while (this.hazardPools.size >= MAX_HAZARD_POOLS) {
      const oldest = this.hazardPools.values().next().value;
      if (!oldest) break;
      this.retireHazardPool(oldest, true);
    }

    const poolX = Phaser.Math.Clamp(x, 0, WORLD_WIDTH);
    const poolY = Phaser.Math.Clamp(y, 0, WORLD_HEIGHT);
    const effect = this.add
      .graphics({ x: poolX, y: poolY })
      .setDepth(Math.max(-5, poolY - HAZARD_POOL_RADIUS - 1));
    effect.fillStyle(0x91be61, 0.13);
    effect.fillCircle(0, 0, HAZARD_POOL_RADIUS);
    effect.fillStyle(0xb6e35f, 0.08);
    effect.fillCircle(0, 0, HAZARD_POOL_RADIUS * 0.66);
    effect.lineStyle(2, 0x6f9c3c, 0.72);
    effect.strokeCircle(0, 0, HAZARD_POOL_RADIUS);
    effect.lineStyle(1, 0xb6e35f, 0.5);
    effect.strokeCircle(0, 0, HAZARD_POOL_RADIUS * 0.68);

    this.hazardPools.add({
      effect,
      x: poolX,
      y: poolY,
      radius: HAZARD_POOL_RADIUS,
      remainingMs: HAZARD_POOL_LIFETIME_MS,
      tickCooldownMs: HAZARD_POOL_TICK_MS,
      baseDamage,
      damageFraction: HAZARD_POOL_DAMAGE_FRACTION,
    });
  }

  private clearHostileEffects(): void {
    for (const projectile of [...this.activeProjectiles]) {
      if (this.projectileRuntime.get(projectile)?.kind === 'enemy-hazard') {
        this.releaseProjectile(projectile);
      }
    }
    this.clearHazardPools(true);
  }

  private updateHazardPools(deltaMs: number): void {
    const combat = this.combat;
    const player = this.player;
    if (!combat || !player) return;

    for (const pool of [...this.hazardPools]) {
      pool.remainingMs = Math.max(0, pool.remainingMs - deltaMs);
      pool.tickCooldownMs = Math.max(0, pool.tickCooldownMs - deltaMs);
      const lifeRatio = pool.remainingMs / HAZARD_POOL_LIFETIME_MS;
      pool.effect.setAlpha(0.18 + lifeRatio * 0.64);
      if (pool.remainingMs === 0) {
        this.retireHazardPool(pool, true);
        continue;
      }
      if (
        combat.getSnapshot().dead ||
        pool.tickCooldownMs > 0 ||
        Math.hypot(player.sprite.x - pool.x, player.sprite.y - pool.y) > pool.radius
      ) {
        continue;
      }

      combat.applyDamage(pool.baseDamage * pool.damageFraction);
      pool.tickCooldownMs = HAZARD_POOL_TICK_MS;
    }
  }

  private retireHazardPool(pool: HazardPoolState, destroyDisplayObject: boolean): void {
    this.hazardPools.delete(pool);
    if (destroyDisplayObject && pool.effect.active) pool.effect.destroy();
  }

  private clearHazardPools(destroyDisplayObjects: boolean): void {
    if (!destroyDisplayObjects) {
      this.hazardPools.clear();
      return;
    }
    for (const pool of [...this.hazardPools]) this.retireHazardPool(pool, true);
  }

  private initiateLockdown(): void {
    if (this.missionStarted) return;
    this.missionStarted = true;
    this.horde?.startArrival();
  }

  private resetRun(): void {
    const combat = this.combat;
    const facility = this.facility;
    const player = this.player;
    if (!combat || !facility || !player || this.shuttingDown) return;

    this.resetResultTransition();
    this.clearProjectiles();
    this.clearHazardPools(true);
    this.hideMuzzleFlash();
    combat.reset();
    facility.reset();
    facility.setWaveAccess(0);
    player.reset(facility.playerSpawn);
    player.stop();
    this.horde?.reset();
    combat.setObjective(INITIAL_OBJECTIVE);
    combat.setWave(0);
    this.desktopInput?.clearEdges();
    this.missionStarted = false;
    this.cameras.main.centerOn(player.sprite.x, player.sprite.y);
    this.hud?.setRadarState(
      player.sprite.x,
      player.sprite.y,
      this.horde?.radarPositions ?? [],
    );
  }

  private installSceneDiagnostics(): void {
    const getSnapshot = () => this.combat?.getSnapshot();
    const getHorde = () => this.horde;
    const getActiveProjectileCount = () => this.activeProjectiles.size;
    this.cleanupDiagnostics = installDiagnostics({
      get phase(): 'arrival' | 'armory' | 'combat' | 'boss' | 'victory' | 'defeat' {
        if (getSnapshot()?.dead === true) return 'defeat';
        const horde = getHorde();
        if (horde?.armoryVisible === true) return 'armory';
        const phase = horde?.phase;
        return phase === undefined || phase === 'idle' ? 'arrival' : phase;
      },
      get playerHealth(): number {
        return getSnapshot()?.health ?? 0;
      },
      get bossHealth(): number {
        const snapshot = getHorde()?.bossSnapshot;
        return snapshot && (snapshot.active || snapshot.defeated) ? snapshot.health : 0;
      },
      get activeEnemies(): number {
        return getHorde()?.activeEnemies ?? 0;
      },
      get activeProjectiles(): number {
        return getActiveProjectileCount();
      },
      get wave(): number {
        return getSnapshot()?.wave ?? 0;
      },
      get touchControlsVisible(): boolean {
        return false;
      },
      startRun: (): void => this.resetRun(),
      damagePlayer: (amount?: number): void => {
        const damage =
          typeof amount === 'number' && Number.isFinite(amount) && amount > 0
            ? Math.min(amount, 10_000)
            : 25;
        this.combat?.applyDamage(damage);
      },
      completeWave: (): void => {
        const phase = this.horde?.completeWaveForDiagnostics();
        this.missionStarted = phase !== undefined && phase !== 'idle';
      },
      spawnStressWave: (): void => {
        this.missionStarted = (this.horde?.spawnStressWave() ?? 0) > 0;
      },
      defeatBoss: (): void => {
        this.horde?.forceBossDefeatForDiagnostics();
      },
      restart: (): void => {
        this.scene.restart();
      },
    });
  }

  private createMissionBanner(): void {
    const panel = this.add.graphics();
    panel.fillStyle(0x070a0f, 0.9);
    panel.fillRoundedRect(-218, -30, 436, 60, 4);
    panel.lineStyle(2, 0xf39237, 0.9);
    panel.strokeRoundedRect(-218, -30, 436, 60, 4);
    panel.fillStyle(0x69d8e7, 1);
    panel.fillRect(-218, -30, 84, 3);

    const heading = this.add
      .text(0, -17, 'K-17  //  LOADING DOCK', {
        color: '#f4efe6',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        letterSpacing: 1.2,
      })
      .setOrigin(0.5, 0);
    const subheading = this.add
      .text(0, 7, 'LOCKDOWN ARMED', {
        color: '#69d8e7',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        letterSpacing: 1.8,
      })
      .setOrigin(0.5, 0);

    this.missionBanner = this.add
      .container(640, 150, [panel, heading, subheading])
      .setScrollFactor(0, 0, true)
      .setDepth(9_000);
    this.missionBannerTween = this.tweens.add({
      targets: this.missionBanner,
      alpha: 0,
      delay: 1_250,
      duration: 450,
      ease: 'Sine.In',
      onComplete: (): void => {
        this.missionBanner?.setVisible(false);
        this.missionBannerTween = null;
      },
    });
  }
}
