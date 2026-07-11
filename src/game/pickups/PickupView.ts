import Phaser from 'phaser';

import { TEXTURE_KEYS } from '../art/createTextures';
import { ObjectPool } from '../pools/ObjectPool';
import type { PickupKind, PickupSnapshot } from './PickupSystem';

const INITIAL_POOL_SIZE = 24;
const MAX_POOL_SIZE = 60;

export type PickupImage = Phaser.GameObjects.Image;

type PickupPresentation = Readonly<{
  tint: number;
  scale: number;
}>;

const PICKUP_PRESENTATION: Readonly<Record<PickupKind, PickupPresentation>> =
  Object.freeze({
    credits: Object.freeze({ tint: 0xf39237, scale: 0.86 }),
    health: Object.freeze({ tint: 0xd95b5b, scale: 1 }),
    armor: Object.freeze({ tint: 0x69d8e7, scale: 1.1 }),
    ammo: Object.freeze({ tint: 0xf4efe6, scale: 0.94 }),
    grenade: Object.freeze({ tint: 0xb6e35f, scale: 1.18 }),
  });

const clampUnit = (value: number): number =>
  Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, 1) : 0;

/** Phaser-only pooled presentation for deterministic PickupSystem snapshots. */
export class PickupView {
  private readonly scene: Phaser.Scene;
  private readonly spritesById = new Map<number, PickupImage>();
  private readonly idsBySprite = new Map<object, number>();
  private readonly seenIds = new Set<number>();
  private pool: ObjectPool<PickupImage, PickupSnapshot> | null;
  private destroyed = false;

  private readonly handleSceneShutdown = (): void => {
    if (this.destroyed) return;

    // Scene shutdown owns display-list destruction. Avoid touching pooled images
    // after Phaser has begun detaching them from the Scene.
    this.destroyed = true;
    this.pool = null;
    this.spritesById.clear();
    this.idsBySprite.clear();
    this.seenIds.clear();
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pool = this.createPool();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
  }

  get count(): number {
    return this.spritesById.size;
  }

  /** Adds, updates, and releases pooled images to match the supplied snapshots. */
  sync(pickups: readonly PickupSnapshot[]): void {
    if (this.destroyed || this.pool === null) return;

    this.seenIds.clear();
    for (const pickup of pickups) this.seenIds.add(pickup.id);

    // Reclaim absent IDs before acquiring replacements at the hard cap.
    for (const [id, sprite] of this.spritesById) {
      if (!this.seenIds.has(id)) this.pool.release(sprite);
    }

    for (const pickup of pickups) {
      let sprite = this.spritesById.get(pickup.id);
      if (sprite === undefined) {
        sprite = this.pool.acquire(pickup) ?? undefined;
        if (sprite === undefined) continue;
        this.spritesById.set(pickup.id, sprite);
        this.idsBySprite.set(sprite, pickup.id);
      } else {
        this.applySnapshot(sprite, pickup);
      }
    }
  }

  pickupIdFor(gameObject: unknown): number | null {
    if (
      gameObject === null ||
      (typeof gameObject !== 'object' && typeof gameObject !== 'function')
    ) {
      return null;
    }
    return this.idsBySprite.get(gameObject) ?? null;
  }

  getSprite(id: number): PickupImage | null {
    return this.spritesById.get(id) ?? null;
  }

  /** Idempotently returns all active images to the reusable pool. */
  clear(): void {
    if (this.destroyed || this.pool === null) return;
    this.pool.clear();
    this.seenIds.clear();
  }

  /** Stops using the adapter; Phaser retains ownership of its display objects. */
  destroy(): void {
    if (this.destroyed) return;

    this.scene.events.off(
      Phaser.Scenes.Events.SHUTDOWN,
      this.handleSceneShutdown,
    );
    this.clear();
    this.pool = null;
    this.destroyed = true;
  }

  private createPool(): ObjectPool<PickupImage, PickupSnapshot> {
    return new ObjectPool<PickupImage, PickupSnapshot>(
      {
        create: (): PickupImage =>
          this.scene.add
            .image(0, 0, TEXTURE_KEYS.pickup)
            .setActive(false)
            .setVisible(false),
        activate: (sprite, pickup): void => {
          this.applySnapshot(sprite, pickup);
          sprite.setActive(true).setVisible(true);
        },
        deactivate: (sprite): void => {
          const id = this.idsBySprite.get(sprite);
          if (id !== undefined) {
            this.spritesById.delete(id);
            this.idsBySprite.delete(sprite);
          }
          sprite
            .setActive(false)
            .setVisible(false)
            .setPosition(0, 0)
            .setAlpha(1)
            .setScale(1)
            .clearTint();
        },
      },
      INITIAL_POOL_SIZE,
      MAX_POOL_SIZE,
    );
  }

  private applySnapshot(sprite: PickupImage, pickup: PickupSnapshot): void {
    const presentation = PICKUP_PRESENTATION[pickup.kind];
    sprite
      .setTexture(TEXTURE_KEYS.pickup)
      .setPosition(pickup.x, pickup.y)
      .setAlpha(clampUnit(pickup.alpha))
      .setDepth(pickup.y + 1)
      .setScale(presentation.scale)
      .setTint(presentation.tint);
  }
}
