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
import { Hud } from '../hud/Hud';
import { DesktopInput } from '../input/DesktopInput';
import { Player } from '../player/Player';
import { FacilityWorld } from '../world/FacilityWorld';
import { SCENE_KEYS } from './sceneKeys';

const CAMERA_BACKGROUND = '#070a0f';
const INITIAL_OBJECTIVE = 'MOVE OR FIRE TO INITIATE LOCKDOWN';
const ACTIVE_OBJECTIVE = 'SECURE THE LOADING DOCK';
const PROJECTILE_INITIAL_SIZE = 180;
const PROJECTILE_MAX_SIZE = 300;
const MAX_DELTA_MS = 100;
const MUZZLE_DISTANCE = 38;
const MUZZLE_FLASH_MS = 48;
const MAX_WAVE = 8;

type ProjectileImage = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

type ProjectileInit = Readonly<{
  request: ProjectileRequest;
  isGrenade: boolean;
}>;

type ProjectileRuntime = {
  lifetimeMs: number;
  request: ProjectileRequest;
  hitTracker: ProjectileHitTracker;
  isGrenade: boolean;
};

type ProjectilePresentation = Readonly<{
  texture: string;
  width: number;
  height: number;
}>;

const projectilePresentation = (
  weaponId: WeaponId,
  isGrenade: boolean,
): ProjectilePresentation => {
  if (isGrenade) {
    return {
      texture: TEXTURE_KEYS.projectileAcid,
      width: 18,
      height: 18,
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
  private projectileGroup: Phaser.Physics.Arcade.Group | null = null;
  private projectilePool: ProjectilePool<ProjectileImage, ProjectileInit> | null = null;
  private playerCollider: Phaser.Physics.Arcade.Collider | null = null;
  private projectileCollider: Phaser.Physics.Arcade.Collider | null = null;
  private muzzleFlash: Phaser.GameObjects.Image | null = null;
  private muzzleTimer: Phaser.Time.TimerEvent | null = null;
  private missionBanner: Phaser.GameObjects.Container | null = null;
  private missionBannerTween: Phaser.Tweens.Tween | null = null;
  private cleanupDiagnostics: DiagnosticsCleanup | null = null;
  private readonly activeProjectiles = new Set<ProjectileImage>();
  private readonly projectileRuntime = new Map<ProjectileImage, ProjectileRuntime>();
  private readonly blastEffects = new Set<Phaser.GameObjects.Graphics>();
  private readonly blastTweens = new Set<Phaser.Tweens.Tween>();
  private missionStarted = false;
  private shuttingDown = false;

  private readonly handleProjectileBlockerCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    first,
  ): void => {
    const projectile = this.asActiveProjectile(first);
    if (projectile === null) return;

    const runtime = this.projectileRuntime.get(projectile);
    if (runtime && (runtime.isGrenade || runtime.request.weaponId === 'rocket')) {
      this.createBlast(projectile.x, projectile.y, runtime.request.splashRadius);
    }
    this.releaseProjectile(projectile);
  };

  private readonly hideMuzzleFlash = (): void => {
    this.muzzleFlash?.setVisible(false);
    if (this.muzzleTimer) this.muzzleTimer.paused = true;
  };

  private readonly handleShutdown = (): void => {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

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

    this.projectileCollider?.destroy();
    this.projectileCollider = null;
    this.playerCollider?.destroy();
    this.playerCollider = null;

    this.clearProjectiles();
    // Phaser has already begun dismantling scene-owned groups and display objects
    // when SHUTDOWN is emitted. Drop our references and let the Scene own their
    // destruction rather than clearing already-detached Physics groups.
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
    this.activeProjectiles.clear();
    this.projectileRuntime.clear();

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
    if (this.shuttingDown || !combat || !player || !desktopInput) return;

    const deltaMs = safeDelta(delta);
    combat.update(deltaMs);

    const input = desktopInput.read(this.cameras.main, player.sprite);
    const snapshot = combat.getSnapshot();
    const canAct = !snapshot.dead && !input.pausePressed;

    if (canAct) {
      player.applyInput(input);
    } else {
      player.stop();
    }

    let projectileSpawned = false;
    if (canAct) {
      if (input.weaponPressed !== null) combat.switchWeapon(input.weaponPressed);
      if (input.reloadPressed) combat.startReload();
      if (input.medkitPressed) combat.consumeMedkit();

      const aimAngle = this.getAimAngle(input.aimWorldX, input.aimWorldY);
      if (input.fireHeld) {
        for (const request of combat.fire(aimAngle)) {
          projectileSpawned = this.spawnProjectile(request, false) || projectileSpawned;
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
          projectileSpawned = this.spawnProjectile(request, true) || projectileSpawned;
        }
      }

      const moved = input.movementX !== 0 || input.movementY !== 0;
      if (!this.missionStarted && (moved || projectileSpawned)) {
        this.initiateLockdown();
      }
    }

    this.updateProjectiles(deltaMs);
    this.hud?.setRadarState(player.sprite.x, player.sprite.y, []);
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
          const { request, isGrenade } = init;
          const player = this.player;
          if (!player || !Number.isFinite(request.angle) || !Number.isFinite(request.speed)) {
            throw new Error('Cannot activate projectile without a finite launch state');
          }

          const presentation = projectilePresentation(request.weaponId, isGrenade);
          const radius = Phaser.Math.Clamp(
            Number.isFinite(request.radius) ? request.radius : 4,
            2,
            12,
          );
          const muzzleX = player.sprite.x + Math.cos(request.angle) * MUZZLE_DISTANCE;
          const muzzleY = player.sprite.y + Math.sin(request.angle) * MUZZLE_DISTANCE;
          const speed = Math.max(0, request.speed);

          projectile
            .setTexture(presentation.texture)
            .setDisplaySize(presentation.width, presentation.height)
            .setPosition(muzzleX, muzzleY)
            .setRotation(request.angle)
            .setDepth(muzzleY + 4)
            .setActive(true)
            .setVisible(true);
          projectile.body.enable = true;
          projectile.body.reset(muzzleX, muzzleY);
          projectile.setCircle(radius);
          projectile.setVelocity(
            Math.cos(request.angle) * speed,
            Math.sin(request.angle) * speed,
          );

          this.projectileRuntime.set(projectile, {
            lifetimeMs: isGrenade ? 1_600 : request.weaponId === 'rocket' ? 3_400 : 2_800,
            request,
            hitTracker: new ProjectileHitTracker(request.penetration),
            isGrenade,
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

  private spawnProjectile(request: ProjectileRequest, isGrenade: boolean): boolean {
    const pool = this.projectilePool;
    return pool !== null && pool.acquire({ request, isGrenade }) !== null;
  }

  private releaseProjectile(projectile: ProjectileImage): void {
    this.projectilePool?.release(projectile);
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
        if (runtime.isGrenade || runtime.request.weaponId === 'rocket') {
          const blastX = Phaser.Math.Clamp(projectile.x, 0, WORLD_WIDTH);
          const blastY = Phaser.Math.Clamp(projectile.y, 0, WORLD_HEIGHT);
          this.createBlast(blastX, blastY, runtime.request.splashRadius);
        }
        this.releaseProjectile(projectile);
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

  private initiateLockdown(): void {
    if (this.missionStarted) return;
    this.missionStarted = true;
    this.combat?.setWave(1);
    this.combat?.setObjective(ACTIVE_OBJECTIVE);
    this.facility?.setWaveAccess(1);
  }

  private resetRun(): void {
    const combat = this.combat;
    const facility = this.facility;
    const player = this.player;
    if (!combat || !facility || !player || this.shuttingDown) return;

    this.clearProjectiles();
    this.hideMuzzleFlash();
    combat.reset();
    combat.setWave(0);
    combat.setObjective(INITIAL_OBJECTIVE);
    facility.reset();
    facility.setWaveAccess(0);
    player.reset(facility.playerSpawn);
    player.stop();
    this.desktopInput?.clearEdges();
    this.missionStarted = false;
    this.cameras.main.centerOn(player.sprite.x, player.sprite.y);
    this.hud?.setRadarState(player.sprite.x, player.sprite.y, []);
  }

  private completeWave(): void {
    const combat = this.combat;
    if (!combat || this.shuttingDown) return;
    const wave = Math.min(MAX_WAVE, combat.getSnapshot().wave + 1);
    combat.setWave(wave);
    this.facility?.setWaveAccess(wave);
    this.missionStarted = wave > 0;
    combat.setObjective(
      wave >= MAX_WAVE ? 'REACH QUEEN CONTAINMENT' : 'ADVANCE TO THE NEXT CONTAINMENT SECTOR',
    );
  }

  private installSceneDiagnostics(): void {
    const getSnapshot = () => this.combat?.getSnapshot();
    const getActiveProjectileCount = () => this.activeProjectiles.size;
    this.cleanupDiagnostics = installDiagnostics({
      get phase(): 'combat' | 'defeat' {
        return getSnapshot()?.dead === true ? 'defeat' : 'combat';
      },
      get playerHealth(): number {
        return getSnapshot()?.health ?? 0;
      },
      get activeEnemies(): number {
        return 0;
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
      completeWave: (): void => this.completeWave(),
      spawnStressWave: (): void => {
        this.combat?.setWave(MAX_WAVE);
        this.facility?.setWaveAccess(MAX_WAVE);
        this.combat?.setObjective('REACH QUEEN CONTAINMENT');
        this.missionStarted = true;
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
