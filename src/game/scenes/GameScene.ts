import Phaser from 'phaser';

import { PresentationClock } from '../art/PresentationClock';
import { TEXTURE_KEYS } from '../art/createTextures';
import { AudioSystem } from '../audio/AudioSystem';
import {
  CombatSystem,
  ProjectileHitTracker,
  type ProjectileRequest,
} from '../combat/CombatSystem';
import { ProjectilePool } from '../combat/ProjectilePool';
import type { WeaponId } from '../combat/types';
import { GAME_HEIGHT, GAME_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { installDiagnostics, type DiagnosticsCleanup } from '../diagnostics/diagnostics';
import type { EnemyDeathEvent, HazardAttackEvent } from '../enemies/EnemySystem';
import {
  EFFECT_KINDS,
  EffectsSystem,
  type EffectKind,
} from '../effects/EffectsSystem';
import {
  QualityController,
  resolveEffectsQuality,
  type QualityProfileName,
  type QualitySelection,
} from '../effects/quality';
import { Hud } from '../hud/Hud';
import { DesktopInput } from '../input/DesktopInput';
import { EMPTY_INPUT_STATE, type InputState } from '../input/InputState';
import { TouchInput } from '../input/TouchInput';
import { DEFAULT_SAVE_DATA, type SaveData } from '../persistence/saveData';
import type { PickupReward } from '../pickups/PickupSystem';
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
const QUALITY_WARMUP_MS = 2_000;

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

const mergeInputStates = (
  desktop: InputState,
  touch: InputState,
  touchAimPointerActive: boolean,
): InputState => {
  const touchMoving = touch.movementX !== 0 || touch.movementY !== 0;
  const touchAiming = touch.fireHeld;
  return Object.freeze({
    movementX: touchMoving ? touch.movementX : desktop.movementX,
    movementY: touchMoving ? touch.movementY : desktop.movementY,
    aimWorldX: touchAiming ? touch.aimWorldX : desktop.aimWorldX,
    aimWorldY: touchAiming ? touch.aimWorldY : desktop.aimWorldY,
    fireHeld: touch.fireHeld || (!touchAimPointerActive && desktop.fireHeld),
    reloadPressed: touch.reloadPressed || desktop.reloadPressed,
    grenadePressed: touch.grenadePressed || desktop.grenadePressed,
    interactPressed: touch.interactPressed || desktop.interactPressed,
    medkitPressed: touch.medkitPressed || desktop.medkitPressed,
    pausePressed: touch.pausePressed || desktop.pausePressed,
    weaponPressed: touch.weaponPressed ?? desktop.weaponPressed,
  });
};

export class GameScene extends Phaser.Scene {
  private facility: FacilityWorld | null = null;
  private player: Player | null = null;
  private desktopInput: DesktopInput | null = null;
  private touchInput: TouchInput | null = null;
  private combat: CombatSystem | null = null;
  private hud: Hud | null = null;
  private horde: HordeRuntime | null = null;
  private audio: AudioSystem | null = null;
  private effects: EffectsSystem | null = null;
  private quality: QualityController | null = null;
  private qualitySelection: QualitySelection = 'auto';
  private qualityWarmupRemainingMs = QUALITY_WARMUP_MS;
  private readonly effectDisplays = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly effectDisplayPool: Phaser.GameObjects.Graphics[] = [];
  private lastAlienSoundAt = Number.NEGATIVE_INFINITY;
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
  private portraitBlocked = false;
  private pauseRequested = false;
  private readonly presentationClock = new PresentationClock();

  private readonly handlePauseKey = (): void => {
    this.requestPause('manual');
  };

  private readonly handleAudioGesture = (): void => {
    const audio = this.audio;
    if (audio === null) return;
    void audio.unlock();
  };

  private readonly handleSettingsChanged = (
    settings: SaveData['settings'],
  ): void => {
    this.applyRuntimeSettings(settings);
  };

  private readonly handleUiSound = (): void => {
    this.audio?.playUI();
  };

  private readonly handleEnemyDeath = (event: EnemyDeathEvent): void => {
    this.addBattleEffect('decals', event.x, event.y, false, 'splatter');
    this.addBattleEffect(
      'remains',
      event.x,
      event.y,
      event.elite || event.enemyType === 'brute' || event.enemyType === 'carrier',
      event.enemyType,
    );
    if (this.time.now - this.lastAlienSoundAt >= 240) {
      this.lastAlienSoundAt = this.time.now;
      this.audio?.playAlien();
    }
  };

  private readonly handlePickupCollected = (
    _reward: PickupReward,
    position: Readonly<{ x: number; y: number }>,
  ): void => {
    this.addBattleEffect('particles', position.x, position.y, false, 'pickup');
    this.audio?.playPickup();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') this.requestPause('focus');
  };

  private readonly handleWindowBlur = (): void => {
    this.requestPause('focus');
  };

  private readonly handleViewportChange = (): void => {
    this.updatePortraitBlock();
  };

  private readonly handleSceneResume = (): void => {
    this.pauseRequested = false;
    this.registry.set('gamePaused', false);
    this.desktopInput?.clearEdges();
    this.touchInput?.setModalBlocked(false);
    this.touchInput?.suspend();
    this.updatePortraitBlock();
    if (!this.portraitBlocked) this.presentationClock.resume();
    if (!this.portraitBlocked) this.audio?.resumeAll();
  };

  private readonly handleProjectileBlockerCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    first,
  ): void => {
    const projectile = this.asActiveProjectile(first);
    if (projectile === null) return;

    const runtime = this.projectileRuntime.get(projectile);
    if (!runtime) return;
    this.addBattleEffect('particles', projectile.x, projectile.y, false, 'impact');
    if (runtime.request.weaponId === 'rocket') {
      this.addBattleEffect('decals', projectile.x, projectile.y, false, 'scorch');
    }
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
    if (hit.applied) {
      this.addBattleEffect('particles', projectile.x, projectile.y, false, 'impact');
    }
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
    if (hit.applied) {
      this.addBattleEffect('particles', projectile.x, projectile.y, false, 'boss-impact');
    }
    if (hit.exhausted) this.releaseProjectile(projectile);
  };

  private readonly handleProjectilePlayerOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    first,
  ): void => {
    const projectile = this.asActiveProjectile(first);
    if (projectile === null) return;

    const runtime = this.projectileRuntime.get(projectile);
    if (!runtime || runtime.kind !== 'enemy-hazard') return;

    this.applyPlayerDamage(runtime.request.damage);
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
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.input.keyboard?.off('keydown-ESC', this.handlePauseKey);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('resize', this.handleViewportChange);
    window.removeEventListener('orientationchange', this.handleViewportChange);
    window.removeEventListener('pointerdown', this.handleAudioGesture, true);
    window.removeEventListener('keydown', this.handleAudioGesture, true);
    this.game.events.off('settings-changed', this.handleSettingsChanged);
    this.game.events.off('ui-sound', this.handleUiSound);
    this.events.off(Phaser.Scenes.Events.RESUME, this.handleSceneResume);

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

    this.clearBlastEffects();

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
    this.clearBattleEffects(false);
    this.effects = null;
    this.quality = null;
    this.audio?.destroy();
    this.audio = null;

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
    this.touchInput?.destroy();
    this.touchInput = null;
    this.portraitBlocked = false;
    this.player = null;
    this.facility = null;
    this.combat = null;
  };

  constructor() {
    super({ key: SCENE_KEYS.game });
  }

  create(): void {
    this.shuttingDown = false;
    this.pauseRequested = false;
    this.missionStarted = false;
    this.resetResultTransition();
    this.activeProjectiles.clear();
    this.projectileRuntime.clear();
    this.hazardPools.clear();
    this.effectDisplays.clear();
    this.effectDisplayPool.length = 0;
    this.qualityWarmupRemainingMs = QUALITY_WARMUP_MS;
    this.lastAlienSoundAt = Number.NEGATIVE_INFINITY;
    this.presentationClock.reset();

    const initialSettings = this.currentSettings();
    this.qualitySelection = initialSettings.quality;
    this.quality = new QualityController({ selection: initialSettings.quality });
    this.effects = new EffectsSystem(this.quality.activeProfile);
    this.audio = new AudioSystem({
      master: initialSettings.masterVolume,
      music: initialSettings.musicVolume,
      effects: initialSettings.effectsVolume,
    });
    window.addEventListener('pointerdown', this.handleAudioGesture, true);
    window.addEventListener('keydown', this.handleAudioGesture, true);
    this.game.events.on('settings-changed', this.handleSettingsChanged);
    this.game.events.on('ui-sound', this.handleUiSound);

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
    const gameParent = this.game.canvas.parentElement;
    if (gameParent !== null) {
      this.touchInput = new TouchInput(
        {
          canvas: this.game.canvas,
          parent: gameParent,
        },
        {
          onEnabledChange: (enabled) => this.hud?.setTouchLayout(enabled),
        },
      );
    }
    this.updatePortraitBlock();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.input.keyboard?.on('keydown-ESC', this.handlePauseKey);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('resize', this.handleViewportChange);
    window.addEventListener('orientationchange', this.handleViewportChange);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleSceneResume);

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
      getPresentationTime: () => this.presentationClock.snapshot(),
      onHazardAttack: this.handleHazardAttack,
      onEnemyDeath: this.handleEnemyDeath,
      onPickupCollected: this.handlePickupCollected,
    });
    this.horde = horde;
    horde.setEffectsProfile(this.quality?.activeProfile ?? 'high');
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
    this.hud.setTouchLayout(this.touchInput?.enabled === true);
    this.createMissionBanner();
    if (import.meta.env.DEV) this.installSceneDiagnostics();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown);
  }

  update(_time: number, delta: number): void {
    const combat = this.combat;
    const player = this.player;
    const desktopInput = this.desktopInput;
    const touchInput = this.touchInput;
    const horde = this.horde;
    if (this.shuttingDown || !combat || !player || !desktopInput || !horde) return;

    if (this.portraitBlocked) {
      player.stop();
      touchInput?.setBlocked(true);
      return;
    }
    touchInput?.setBlocked(false);

    const deltaMs = safeDelta(delta);
    this.updateAdaptiveQuality(deltaMs);
    this.updateAudioIntensity(horde);
    if (this.resultTransitionRemainingMs !== null || this.resultSceneStarted) {
      this.advanceResultTransition(deltaMs, horde);
      return;
    }
    if (this.beginResultTransition(horde, player)) {
      this.hud?.setRadarState(player.sprite.x, player.sprite.y, horde.radarPositions);
      return;
    }

    const touchAimPointerActive = touchInput?.hasActiveAimPointer ?? false;
    const desktopState = desktopInput.read(
      this.cameras.main,
      player.sprite,
      !touchAimPointerActive,
    );
    const touchState = touchInput?.read(player.sprite) ?? EMPTY_INPUT_STATE;
    const input = mergeInputStates(
      desktopState,
      touchState,
      touchAimPointerActive,
    );
    if (input.pausePressed) {
      this.requestPause('manual');
      return;
    }

    const presentationTimeMs = this.presentationClock.advance(deltaMs);

    combat.update(deltaMs);
    const snapshot = combat.getSnapshot();
    const armoryVisible = horde.armoryVisible;
    const canAct = !snapshot.dead && !armoryVisible;

    if (canAct) player.applyInput(input);
    else player.stop();

    const settings = this.currentSettings();
    player.updatePresentation(presentationTimeMs, {
      dead: snapshot.dead,
      quality: this.quality?.activeProfile ?? 'high',
      reducedMotion: this.registry.get('reducedMotion') === true,
      reducedFlash: settings.reducedFlash,
    });

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
        const requests = combat.fire(aimAngle);
        let firedThisFrame = false;
        for (const request of requests) {
          const spawned = this.spawnProjectile({ request, kind: 'player' });
          firedThisFrame = spawned || firedThisFrame;
          projectileSpawned = spawned || projectileSpawned;
        }
        if (firedThisFrame && requests[0]) {
          player.triggerRecoil(presentationTimeMs);
          this.playWeaponSound(requests[0].weaponId);
          if (['pistol', 'rifle', 'shotgun'].includes(requests[0].weaponId)) {
            this.addBattleEffect(
              'shellCasings',
              player.sprite.x,
              player.sprite.y,
              false,
              requests[0].weaponId,
            );
          }
          this.showMuzzleFlash(aimAngle);
        }
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
          const grenadeSpawned = this.spawnProjectile({
            request,
            kind: 'grenade',
          });
          projectileSpawned = grenadeSpawned || projectileSpawned;
          if (grenadeSpawned) this.audio?.playRocket();
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

  private requestPause(reason: 'manual' | 'focus'): void {
    if (this.shuttingDown || this.pauseRequested || !this.sys.isActive()) return;
    this.pauseRequested = true;
    this.presentationClock.suspend();
    this.player?.freezeMotion();
    this.physics.world.pause();
    this.audio?.pauseAll();
    this.audio?.playUI();
    this.hideMuzzleFlash();
    this.touchInput?.setModalBlocked(true);
    this.desktopInput?.clearEdges();
    this.registry.set('gamePaused', true);
    this.scene.launch(SCENE_KEYS.pause, { reason });
    this.scene.pause(SCENE_KEYS.game);
  }

  private updatePortraitBlock(): void {
    const blocked = (() => {
      try {
        return window.matchMedia(
          '(orientation: portrait) and (pointer: coarse)',
        ).matches;
      } catch {
        return false;
      }
    })();
    this.portraitBlocked = blocked;
    this.touchInput?.setBlocked(blocked);
    if (blocked) {
      this.presentationClock.suspend();
      this.player?.freezeMotion();
      this.physics.world.pause();
      this.time.paused = true;
      this.tweens.pauseAll();
      this.audio?.pauseAll();
    } else if (!this.pauseRequested) {
      this.presentationClock.resume();
      this.physics.world.resume();
      this.time.paused = false;
      this.tweens.resumeAll();
      this.audio?.resumeAll();
    }
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
    const settings = this.currentSettings();
    const quality = resolveEffectsQuality(
      this.quality?.activeProfile ?? 'high',
      settings,
    );
    if (quality.shake > 0 && !this.cameras.main.shakeEffect.isRunning) {
      this.cameras.main.shake(110, 0.0035 * quality.shake);
    }
    this.audio?.playExplosion();
    this.addBattleEffect('dynamicLights', x, y, false, 'blast');
    this.addBattleEffect('particles', x, y, false, 'blast');
    this.addBattleEffect('decals', x, y, false, 'scorch');
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

  private applyRuntimeSettings(settings: SaveData['settings']): void {
    this.audio?.setVolumes({
      master: settings.masterVolume,
      music: settings.musicVolume,
      effects: settings.effectsVolume,
    });
    if (settings.quality === this.qualitySelection) return;
    const currentProfile = this.quality?.activeProfile ?? 'high';
    this.qualitySelection = settings.quality;
    this.quality = new QualityController({
      selection: settings.quality,
      initialAutoProfile:
        settings.quality === 'auto' ? currentProfile : undefined,
    });
    this.qualityWarmupRemainingMs = QUALITY_WARMUP_MS;
    this.setEffectsProfile(this.quality.activeProfile);
  }

  private updateAdaptiveQuality(deltaMs: number): void {
    const quality = this.quality;
    const effects = this.effects;
    if (!quality || !effects || !this.missionStarted) return;
    if (this.qualityWarmupRemainingMs > 0) {
      this.qualityWarmupRemainingMs = Math.max(
        0,
        this.qualityWarmupRemainingMs - deltaMs,
      );
      return;
    }
    const previous = quality.activeProfile;
    const active = quality.recordFrame(deltaMs);
    if (active === previous) return;
    this.setEffectsProfile(active);
  }

  private setEffectsProfile(profile: QualityProfileName): void {
    const effects = this.effects;
    if (!effects) return;
    effects.setProfile(profile);
    if (profile === 'low') {
      for (const light of effects.snapshot('dynamicLights')) {
        effects.remove(light.id);
      }
    }
    this.horde?.setEffectsProfile(profile);
    this.syncEffectDisplays();
  }

  private resetQualityForRun(): void {
    this.qualityWarmupRemainingMs = QUALITY_WARMUP_MS;
    if (this.qualitySelection !== 'auto') return;
    this.quality = new QualityController({ selection: 'auto' });
    this.setEffectsProfile(this.quality.activeProfile);
  }

  private updateAudioIntensity(horde: HordeRuntime): void {
    const wave = this.combat?.getSnapshot().wave ?? 0;
    const intensity =
      horde.phase === 'boss'
        ? 1
        : horde.phase === 'combat'
          ? Math.min(0.95, 0.32 + wave * 0.075)
          : horde.phase === 'idle'
            ? 0.18
            : 0.08;
    this.audio?.setMusicIntensity(intensity);
  }

  private playWeaponSound(weaponId: WeaponId): void {
    switch (weaponId) {
      case 'pistol':
        this.audio?.playPistol();
        break;
      case 'rifle':
        this.audio?.playRifle();
        break;
      case 'shotgun':
        this.audio?.playShotgun();
        break;
      case 'plasma':
        this.audio?.playPlasma();
        break;
      case 'rocket':
        this.audio?.playRocket();
        break;
    }
  }

  private addBattleEffect(
    kind: EffectKind,
    x: number,
    y: number,
    major: boolean,
    label: string,
  ): void {
    const effects = this.effects;
    if (
      !effects ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      this.shuttingDown
    ) {
      return;
    }
    const record = effects.add(kind, { label, major });
    if (record === null) return;
    this.syncEffectDisplays();
    if (kind === 'dynamicLights' && effects.profile === 'low') {
      effects.remove(record.id);
      return;
    }
    const display = this.createEffectDisplay(record.id, kind, x, y, major, label);
    this.effectDisplays.set(record.id, display);
  }

  private createEffectDisplay(
    id: number,
    kind: EffectKind,
    x: number,
    y: number,
    major: boolean,
    label: string,
  ): Phaser.GameObjects.Graphics {
    const graphics = this.effectDisplayPool.pop() ?? this.add.graphics();
    graphics
      .clear()
      .setPosition(x, y)
      .setAlpha(1)
      .setScale(1)
      .setRotation(0)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setVisible(true)
      .setActive(true);
    const rotation = ((id * 47) % 360) * (Math.PI / 180);
    switch (kind) {
      case 'dynamicLights':
        graphics.fillStyle(0xf39237, 0.14);
        graphics.fillCircle(0, 0, 54);
        graphics.setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 5);
        break;
      case 'particles':
        graphics.lineStyle(2, label === 'pickup' ? 0x69d8e7 : 0xf39237, 0.9);
        for (let index = 0; index < 6; index += 1) {
          const angle = rotation + (index / 6) * Math.PI * 2;
          graphics.lineBetween(
            Math.cos(angle) * 5,
            Math.sin(angle) * 5,
            Math.cos(angle) * 18,
            Math.sin(angle) * 18,
          );
        }
        graphics.setDepth(y + 8);
        break;
      case 'decals':
        graphics.fillStyle(label === 'scorch' ? 0x17120f : 0x6f171b, 0.62);
        graphics.fillEllipse(
          0,
          0,
          label === 'scorch' ? 38 : 26,
          label === 'scorch' ? 24 : 18,
        );
        graphics.setRotation(rotation).setDepth(Math.max(-10, y - 24));
        break;
      case 'remains':
        graphics.fillStyle(major ? 0x35582c : 0x294425, major ? 0.88 : 0.72);
        graphics.fillEllipse(0, 0, major ? 42 : 28, major ? 24 : 16);
        graphics.lineStyle(2, 0x7ebf43, major ? 0.5 : 0.3);
        graphics.strokeEllipse(0, 0, major ? 42 : 28, major ? 24 : 16);
        graphics.setRotation(rotation).setDepth(Math.max(-9, y - 20));
        break;
      case 'shellCasings':
        graphics.fillStyle(0xc68b39, 0.9);
        graphics.fillRect(-4, -1, 8, 3);
        graphics.setRotation(rotation).setDepth(Math.max(-8, y - 14));
        break;
    }

    if (kind === 'particles' || kind === 'dynamicLights') {
      this.tweens.add({
        targets: graphics,
        alpha: 0,
        scale: kind === 'particles' ? 1.45 : 1.25,
        duration: kind === 'particles' ? 190 : 150,
        ease: 'Quad.Out',
        onComplete: (): void => this.removeBattleEffect(id),
      });
    }
    return graphics;
  }

  private removeBattleEffect(id: number): void {
    this.effects?.remove(id);
    const display = this.effectDisplays.get(id);
    this.effectDisplays.delete(id);
    if (display) this.releaseEffectDisplay(display);
  }

  private releaseEffectDisplay(display: Phaser.GameObjects.Graphics): void {
    if (!display.active) return;
    this.tweens.killTweensOf(display);
    display.clear().setVisible(false).setActive(false);
    this.effectDisplayPool.push(display);
  }

  private syncEffectDisplays(): void {
    const effects = this.effects;
    if (!effects) return;
    const retained = new Set<number>();
    for (const kind of EFFECT_KINDS) {
      for (const effect of effects.snapshot(kind)) retained.add(effect.id);
    }
    for (const [id, display] of this.effectDisplays) {
      if (retained.has(id)) continue;
      this.effectDisplays.delete(id);
      this.releaseEffectDisplay(display);
    }
  }

  private clearBlastEffects(): void {
    for (const tween of [...this.blastTweens]) {
      tween.stop();
      this.tweens.remove(tween);
    }
    this.blastTweens.clear();
    for (const effect of this.blastEffects) effect.destroy();
    this.blastEffects.clear();
  }

  private clearBattleEffects(recycleDisplays: boolean): void {
    this.effects?.clear();
    if (recycleDisplays) {
      for (const display of this.effectDisplays.values()) {
        this.releaseEffectDisplay(display);
      }
    } else {
      this.effectDisplayPool.length = 0;
    }
    this.effectDisplays.clear();
  }

  private currentSettings(): SaveData['settings'] {
    const settings = this.registry.get('settings') as
      | SaveData['settings']
      | undefined;
    return settings ?? DEFAULT_SAVE_DATA.settings;
  }

  private applyPlayerDamage(amount: number): void {
    const combat = this.combat;
    if (combat === null) return;
    const healthBefore = combat.getSnapshot().health;
    combat.applyDamage(amount);
    if (combat.getSnapshot().health >= healthBefore) return;

    this.player?.triggerHit(this.presentationClock.snapshot());

    const settings = this.currentSettings();
    const quality = resolveEffectsQuality(
      this.quality?.activeProfile ?? 'high',
      settings,
    );
    if (!settings.reducedFlash && quality.flash >= 0.5) {
      this.cameras.main.flash(80, 244, 239, 230, false);
      return;
    }

    const edgePulse = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(12_000);
    edgePulse.lineStyle(4, 0xf39237, 0.3);
    edgePulse.strokeRect(5, 5, GAME_WIDTH - 10, GAME_HEIGHT - 10);
    this.blastEffects.add(edgePulse);
    this.time.delayedCall(220, () => {
      this.blastEffects.delete(edgePulse);
      if (edgePulse.active) edgePulse.destroy();
    });
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

      this.applyPlayerDamage(pool.baseDamage * pool.damageFraction);
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
    this.audio?.playAlarm();
    this.horde?.startArrival();
  }

  private resetRun(): void {
    const combat = this.combat;
    const facility = this.facility;
    const player = this.player;
    if (!combat || !facility || !player || this.shuttingDown) return;

    this.resetResultTransition();
    this.presentationClock.reset();
    this.clearProjectiles();
    this.clearHazardPools(true);
    this.clearBattleEffects(true);
    this.clearBlastEffects();
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
    this.touchInput?.suspend();
    this.updatePortraitBlock();
    this.missionStarted = false;
    this.resetQualityForRun();
    this.audio?.setMusicIntensity(0.08);
    this.cameras.main.centerOn(player.sprite.x, player.sprite.y);
    this.hud?.setRadarState(
      player.sprite.x,
      player.sprite.y,
      this.horde?.radarPositions ?? [],
    );
  }

  private installSceneDiagnostics(): void {
    if (!import.meta.env.DEV) return;
    const getSnapshot = () => this.combat?.getSnapshot();
    const getHorde = () => this.horde;
    const getActiveProjectileCount = () => this.activeProjectiles.size;
    const getActiveQuality = () => this.quality?.activeProfile ?? 'unknown';
    const getTouchControlsVisible = () => this.touchInput?.enabled ?? false;
    const getPlayer = () => this.player;
    const getPresentationTime = () => this.presentationClock.snapshot();
    const getReducedMotion = () => this.registry.get('reducedMotion') === true;
    const getReducedFlash = () => this.currentSettings().reducedFlash;
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
      get activeEnemySkinKeys(): readonly string[] {
        return getHorde()?.presentationSkinKeys ?? Object.freeze([]);
      },
      get framedEnemyCount(): number {
        return getHorde()?.framedPresentationCount ?? 0;
      },
      get enemyVisualCount(): number {
        return getHorde()?.presentationObjectCount ?? 0;
      },
      get wave(): number {
        return getSnapshot()?.wave ?? 0;
      },
      get activeQuality(): string {
        return getActiveQuality();
      },
      get presentationTimeMs(): number {
        return getPresentationTime();
      },
      get reducedMotion(): boolean {
        return getReducedMotion();
      },
      get reducedFlash(): boolean {
        return getReducedFlash();
      },
      get touchControlsVisible(): boolean {
        return getTouchControlsVisible();
      },
      get playerSkinKey(): string {
        return getPlayer()?.skinKey ?? 'unknown';
      },
      get playerFrame(): string {
        return getPlayer()?.presentationSnapshot(getPresentationTime()).frame ?? 'idleA';
      },
      get playerAnimating(): boolean {
        return getPlayer()?.presentationSnapshot(getPresentationTime()).animating ?? false;
      },
      get playerRecoil(): boolean {
        return getPlayer()?.presentationSnapshot(getPresentationTime()).recoil ?? false;
      },
      get playerHit(): boolean {
        return getPlayer()?.presentationSnapshot(getPresentationTime()).hit ?? false;
      },
      get playerVisualOffsetX(): number { return getPlayer()?.visualSnapshot().offsetX ?? 0; },
      get playerVisualOffsetY(): number { return getPlayer()?.visualSnapshot().offsetY ?? 0; },
      get playerVisualScaleX(): number { return getPlayer()?.visualSnapshot().scaleX ?? 1; },
      get playerVisualScaleY(): number { return getPlayer()?.visualSnapshot().scaleY ?? 1; },
      get playerVisualRotationOffset(): number { return getPlayer()?.visualSnapshot().rotationOffset ?? 0; },
      get playerBodyRotation(): number { return getPlayer()?.visualSnapshot().bodyRotation ?? 0; },
      get playerFallbackFramed(): boolean { return getPlayer()?.visualSnapshot().framed ?? false; },
      startRun: (): void => this.resetRun(),
      damagePlayer: (amount?: number): void => {
        const damage =
          typeof amount === 'number' && Number.isFinite(amount) && amount > 0
            ? Math.min(amount, 10_000)
            : 25;
        this.applyPlayerDamage(damage);
      },
      completeWave: (): void => {
        const phase = this.horde?.completeWaveForDiagnostics();
        this.missionStarted = phase !== undefined && phase !== 'idle';
      },
      spawnStressWave: (): void => {
        this.missionStarted = (this.horde?.spawnStressWave() ?? 0) > 0;
      },
      focusQueenArena: (): void => {
        const player = this.player;
        const arena = this.facility?.queenArena;
        if (!player || !arena || this.horde?.phase !== 'boss') return;
        const playerX = arena.safeCenter.x - arena.safeRadius * 0.55;
        const playerY = arena.safeCenter.y + arena.safeRadius * 0.35;
        player.sprite.setPosition(playerX, playerY);
        this.cameras.main.centerOn(arena.safeCenter.x, arena.safeCenter.y);
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
