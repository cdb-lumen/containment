import Phaser from 'phaser';

import { TEXTURE_KEYS } from '../art/createTextures';
import type { EnemySnapshot } from './EnemySystem';
import { EnemyPool } from './EnemyPool';
import type { StandardEnemyId } from './types';

const INITIAL_POOL_SIZE = 90;
const MAX_POOL_SIZE = 150;
const HEALTH_BAR_HEIGHT = 4;
const ARMOR_BAR_HEIGHT = 3;
const BAR_GAP = 2;
const BAR_OFFSET = 8;
const ELITE_SCALE = 1.14;
const ELITE_TINT = 0xf39237;
const HEALTH_COLOR = 0x91be61;
const HEALTH_DAMAGED_COLOR = 0xe58a28;
const ARMOR_COLOR = 0x69d8e7;
const BAR_BACKGROUND = 0x070a0f;
const OVERLAY_DEPTH = 4_096;

export type EnemyImage = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

export type EnemyViewPosition = Readonly<{
  id: number;
  x: number;
  y: number;
}>;

type MutableEnemyViewPosition = {
  id: number;
  x: number;
  y: number;
};

type EnemyPresentation = Readonly<{
  texture: string;
  displaySize: number;
}>;

const ENEMY_PRESENTATION: Readonly<Record<StandardEnemyId, EnemyPresentation>> =
  Object.freeze({
    crawler: Object.freeze({
      texture: TEXTURE_KEYS.alienRunner,
      displaySize: 44,
    }),
    brute: Object.freeze({
      texture: TEXTURE_KEYS.alienBrute,
      displaySize: 68,
    }),
    spitter: Object.freeze({
      texture: TEXTURE_KEYS.alienSpitter,
      displaySize: 52,
    }),
    stalker: Object.freeze({
      texture: TEXTURE_KEYS.alienStalker,
      displaySize: 50,
    }),
    carrier: Object.freeze({
      texture: TEXTURE_KEYS.alienDrone,
      displaySize: 62,
    }),
  });

const clampUnit = (value: number): number =>
  Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, 1) : 0;

/**
 * Phaser-only presentation for deterministic EnemySystem snapshots.
 *
 * The view owns no combat state: snapshots remain authoritative and Arcade
 * bodies exist only so projectile overlap callbacks can resolve an enemy ID.
 */
export class EnemyView {
  readonly group: Phaser.Physics.Arcade.Group;
  readonly activePositions: readonly EnemyViewPosition[];

  private readonly scene: Phaser.Scene;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly spritesById = new Map<number, EnemyImage>();
  private readonly idsBySprite = new Map<object, number>();
  private readonly positionsById = new Map<number, MutableEnemyViewPosition>();
  private readonly mutableActivePositions: MutableEnemyViewPosition[] = [];
  private readonly seenIds = new Set<number>();
  private pool: EnemyPool<EnemyImage, EnemySnapshot> | null;
  private destroyed = false;

  private readonly handleSceneShutdown = (): void => {
    if (this.destroyed) return;

    // SHUTDOWN is emitted while Phaser is dismantling Scene-owned display and
    // physics lists. Do not deactivate children through an already-detached
    // Group; only discard adapter bookkeeping and let the Scene destroy them.
    this.destroyed = true;
    this.pool = null;
    this.spritesById.clear();
    this.idsBySprite.clear();
    this.positionsById.clear();
    this.mutableActivePositions.length = 0;
    this.seenIds.clear();
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.overlay = scene.add.graphics().setDepth(OVERLAY_DEPTH);
    this.activePositions = this.mutableActivePositions;
    this.pool = this.createPool();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
  }

  get count(): number {
    return this.spritesById.size;
  }

  /** Synchronizes pooled sprites and the single shared status overlay. */
  sync(enemies: readonly EnemySnapshot[]): void {
    if (this.destroyed || this.pool === null) return;

    this.seenIds.clear();
    for (const enemy of enemies) this.seenIds.add(enemy.id);

    // Release first so a completely replaced max-size snapshot can reuse every
    // slot without transiently exceeding the pool cap.
    for (const [id, sprite] of this.spritesById) {
      if (!this.seenIds.has(id)) this.pool.release(sprite);
    }

    for (const enemy of enemies) {
      let sprite = this.spritesById.get(enemy.id);
      if (sprite === undefined) {
        sprite = this.pool.acquire(enemy) ?? undefined;
        if (sprite === undefined) continue;
        this.spritesById.set(enemy.id, sprite);
        this.idsBySprite.set(sprite, enemy.id);
        this.addPosition(enemy);
      } else {
        this.applySnapshot(sprite, enemy);
      }
      this.updatePosition(enemy);
    }

    this.redrawOverlay(enemies);
  }

  /** Resolves a projectile-overlap Game Object back to its domain enemy ID. */
  enemyIdFor(gameObject: unknown): number | null {
    if (
      gameObject === null ||
      (typeof gameObject !== 'object' && typeof gameObject !== 'function')
    ) {
      return null;
    }
    return this.idsBySprite.get(gameObject) ?? null;
  }

  getSprite(id: number): EnemyImage | null {
    return this.spritesById.get(id) ?? null;
  }

  /** Idempotently returns every active sprite to the pool. */
  clear(): void {
    if (this.destroyed || this.pool === null) return;
    this.pool.clear();
    this.overlay.clear();
    this.seenIds.clear();
  }

  /**
   * Stops using the adapter without destroying Scene-owned Groups or images.
   * During Scene shutdown, Phaser performs that destruction itself.
   */
  destroy(): void {
    if (this.destroyed) return;

    this.scene.events.off(
      Phaser.Scenes.Events.SHUTDOWN,
      this.handleSceneShutdown,
    );
    this.clear();
    this.overlay.setVisible(false);
    this.pool = null;
    this.destroyed = true;
  }

  private createPool(): EnemyPool<EnemyImage, EnemySnapshot> {
    return new EnemyPool<EnemyImage, EnemySnapshot>(
      {
        create: (): EnemyImage => {
          const sprite = this.scene.physics.add.image(
            0,
            0,
            TEXTURE_KEYS.alienRunner,
          );
          this.group.add(sprite);
          sprite.body.setAllowGravity(false);
          sprite.body.setImmovable(true);
          sprite.body.enable = false;
          sprite.setActive(false).setVisible(false);
          return sprite;
        },
        activate: (sprite, enemy): void => {
          this.applySnapshot(sprite, enemy);
          sprite.setActive(true).setVisible(true);
          sprite.body.enable = true;
          sprite.body.reset(enemy.x, enemy.y);
        },
        deactivate: (sprite): void => {
          const id = this.idsBySprite.get(sprite);
          if (id !== undefined) {
            this.spritesById.delete(id);
            this.idsBySprite.delete(sprite);
            this.removePosition(id);
          }
          sprite.body.enable = false;
          sprite
            .setActive(false)
            .setVisible(false)
            .setPosition(0, 0)
            .setRotation(0)
            .setAlpha(1)
            .setScale(1)
            .clearTint();
        },
      },
      INITIAL_POOL_SIZE,
      MAX_POOL_SIZE,
    );
  }

  private applySnapshot(sprite: EnemyImage, enemy: EnemySnapshot): void {
    const presentation = ENEMY_PRESENTATION[enemy.type];
    const displaySize =
      presentation.displaySize * (enemy.elite ? ELITE_SCALE : 1);
    const radius = Math.max(1, Number.isFinite(enemy.radius) ? enemy.radius : 1);

    sprite
      .setTexture(presentation.texture)
      .setDisplaySize(displaySize, displaySize)
      .setPosition(enemy.x, enemy.y)
      .setAlpha(clampUnit(enemy.alpha))
      .setDepth(enemy.y);

    if (enemy.elite) sprite.setTint(ELITE_TINT);
    else sprite.clearTint();

    if (
      Number.isFinite(enemy.velocityX) &&
      Number.isFinite(enemy.velocityY) &&
      (enemy.velocityX !== 0 || enemy.velocityY !== 0)
    ) {
      sprite.setRotation(Math.atan2(enemy.velocityY, enemy.velocityX));
    }

    const sourceRadius = radius / Math.max(Number.EPSILON, Math.abs(sprite.scaleX));
    const bodyOffset = Math.max(0, (sprite.width - sourceRadius * 2) / 2);
    sprite.body.enable = true;
    sprite.body.reset(enemy.x, enemy.y);
    sprite.setCircle(sourceRadius, bodyOffset, bodyOffset);
  }

  private addPosition(enemy: EnemySnapshot): void {
    if (this.positionsById.has(enemy.id)) return;
    const position: MutableEnemyViewPosition = {
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
    };
    this.positionsById.set(enemy.id, position);
    this.mutableActivePositions.push(position);
  }

  private updatePosition(enemy: EnemySnapshot): void {
    const position = this.positionsById.get(enemy.id);
    if (position === undefined) return;
    position.x = enemy.x;
    position.y = enemy.y;
  }

  private removePosition(id: number): void {
    const position = this.positionsById.get(id);
    if (position === undefined) return;
    this.positionsById.delete(id);
    const index = this.mutableActivePositions.indexOf(position);
    if (index >= 0) this.mutableActivePositions.splice(index, 1);
  }

  private redrawOverlay(enemies: readonly EnemySnapshot[]): void {
    this.overlay.clear();

    for (const enemy of enemies) {
      if (!this.spritesById.has(enemy.id)) continue;
      const damaged = enemy.health < enemy.maxHealth;
      const armored = enemy.maxArmor > 0;
      if (!damaged && !armored && !enemy.elite) continue;

      const alpha = clampUnit(enemy.alpha);
      const radius = Math.max(1, Number.isFinite(enemy.radius) ? enemy.radius : 1);
      const width = Math.max(24, radius * 2.2 * (enemy.elite ? ELITE_SCALE : 1));
      const left = enemy.x - width / 2;
      const healthY = enemy.y - radius - BAR_OFFSET;
      const healthRatio = clampUnit(
        enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 0,
      );

      this.overlay.fillStyle(BAR_BACKGROUND, 0.82 * alpha);
      this.overlay.fillRect(left - 1, healthY - 1, width + 2, HEALTH_BAR_HEIGHT + 2);
      this.overlay.fillStyle(
        healthRatio > 0.35 ? HEALTH_COLOR : HEALTH_DAMAGED_COLOR,
        alpha,
      );
      this.overlay.fillRect(left, healthY, width * healthRatio, HEALTH_BAR_HEIGHT);

      if (armored) {
        const armorY = healthY + HEALTH_BAR_HEIGHT + BAR_GAP;
        const armorRatio = clampUnit(
          enemy.maxArmor > 0 ? enemy.armor / enemy.maxArmor : 0,
        );
        this.overlay.fillStyle(BAR_BACKGROUND, 0.82 * alpha);
        this.overlay.fillRect(left - 1, armorY - 1, width + 2, ARMOR_BAR_HEIGHT + 2);
        this.overlay.fillStyle(ARMOR_COLOR, alpha);
        this.overlay.fillRect(left, armorY, width * armorRatio, ARMOR_BAR_HEIGHT);
      }

      if (enemy.elite) this.drawEliteMarker(enemy.x, healthY - 8, alpha);
    }
  }

  private drawEliteMarker(x: number, y: number, alpha: number): void {
    const halfWidth = 5;
    const halfHeight = 7;
    this.overlay.lineStyle(2, ELITE_TINT, alpha);
    this.overlay.beginPath();
    this.overlay.moveTo(x, y - halfHeight);
    this.overlay.lineTo(x + halfWidth, y);
    this.overlay.lineTo(x, y + halfHeight);
    this.overlay.lineTo(x - halfWidth, y);
    this.overlay.closePath();
    this.overlay.strokePath();
  }
}
