import Phaser from 'phaser';

import { TEXTURE_KEYS } from '../art/createTextures';
import { ObjectPool } from '../pools/ObjectPool';
import {
  AREA_ATTACK_DELAY_MS,
  type QueenBossEvent,
  type QueenBossSnapshot,
  type QueenDamageTarget,
  type QueenNestSnapshot,
} from './QueenBossSystem';

const POOL_SIZE = 7;
const QUEEN_KEY = 'queen';
const QUEEN_DISPLAY_SIZE = 152;
const QUEEN_BODY_RADIUS = 76;
const NEST_DISPLAY_SIZE = 56;
const NEST_BODY_RADIUS = 24;
const STATUS_DEPTH = 4_098;
const TELEGRAPH_DEPTH = 4_097;
const EFFECT_DEPTH = 4_099;
const MAX_EVENT_EFFECTS = 3;
const EFFECT_DURATION_MS = 360;

const COLORS = Object.freeze({
  void: 0x070a0f,
  cyan: 0x69d8e7,
  orange: 0xf39237,
  acid: 0xb6e35f,
  alien: 0x91be61,
  alienDark: 0x263d2c,
  critical: 0xff6347,
});

export type QueenBossImage = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

export type QueenBossRadarPosition = Readonly<{
  key: string;
  marker: 'boss' | 'nest';
  x: number;
  y: number;
}>;

type MutableRadarPosition = {
  key: string;
  marker: 'boss' | 'nest';
  x: number;
  y: number;
};

type BossViewInit = Readonly<{
  key: string;
  target: QueenDamageTarget;
  x: number;
  y: number;
  rotation: number;
  texture: string;
  tint: number | null;
  displaySize: number;
  bodyRadius: number;
}>;

const QUEEN_TARGET: QueenDamageTarget = Object.freeze({ type: 'queen' });

const nestKey = (id: number): string => `nest:${id}`;

const targetKey = (target: QueenDamageTarget): string =>
  target.type === 'queen' ? QUEEN_KEY : nestKey(target.id);

const clampUnit = (value: number): number =>
  Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, 1) : 0;

const finite = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

/**
 * Phaser-only pooled presentation for the deterministic queen boss snapshot.
 * Arcade bodies are overlap targets only; they never participate in navigation.
 */
export class QueenBossView {
  readonly group: Phaser.Physics.Arcade.Group;

  readonly #scene: Phaser.Scene;
  readonly #statusLayer: Phaser.GameObjects.Graphics;
  readonly #telegraphLayer: Phaser.GameObjects.Graphics;
  readonly #spritesByKey = new Map<string, QueenBossImage>();
  readonly #targetBySprite = new Map<object, QueenDamageTarget>();
  readonly #ownedSprites = new Set<QueenBossImage>();
  readonly #seenKeys = new Set<string>();
  readonly #handledEventIds = new Set<number>();
  readonly #eventEffects = new Set<Phaser.GameObjects.Graphics>();
  readonly #effectTweens = new Map<Phaser.GameObjects.Graphics, Phaser.Tweens.Tween>();
  readonly #mutableRadarPositions: MutableRadarPosition[] = [];
  #pool: ObjectPool<QueenBossImage, BossViewInit> | null;
  #destroyed = false;

  readonly #handleSceneShutdown = (): void => {
    if (this.#destroyed) return;

    // Phaser owns Scene display/physics teardown. Dropping references here avoids
    // touching a Group whose children may already have been detached.
    this.#destroyed = true;
    this.#pool = null;
    this.#spritesByKey.clear();
    this.#targetBySprite.clear();
    this.#ownedSprites.clear();
    this.#seenKeys.clear();
    this.#handledEventIds.clear();
    this.#eventEffects.clear();
    this.#effectTweens.clear();
    this.#mutableRadarPositions.length = 0;
  };

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;
    this.group = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.#telegraphLayer = scene.add.graphics().setDepth(TELEGRAPH_DEPTH);
    this.#statusLayer = scene.add.graphics().setDepth(STATUS_DEPTH);
    this.#pool = this.#createPool();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.#handleSceneShutdown);
  }

  get activeCount(): number {
    return this.#spritesByKey.size;
  }

  get radarPositions(): readonly QueenBossRadarPosition[] {
    return this.#mutableRadarPositions;
  }

  /** Matches the seven pooled overlap images to stable queen/nest target keys. */
  sync(snapshot: QueenBossSnapshot): void {
    if (this.#destroyed || this.#pool === null) return;

    const inits = this.#snapshotInits(snapshot);
    this.#seenKeys.clear();
    for (const init of inits) this.#seenKeys.add(init.key);

    // Release absent keys first so a replacement snapshot never needs an eighth
    // object while all seven slots are occupied.
    for (const [key, sprite] of this.#spritesByKey) {
      if (!this.#seenKeys.has(key)) this.#pool.release(sprite);
    }

    for (const init of inits) {
      let sprite = this.#spritesByKey.get(init.key);
      if (sprite === undefined) {
        sprite = this.#pool.acquire(init) ?? undefined;
        if (sprite === undefined) continue;
        this.#spritesByKey.set(init.key, sprite);
        this.#targetBySprite.set(sprite, init.target);
      } else {
        this.#applyInit(sprite, init);
      }
    }

    this.#updateRadar(snapshot);
    this.#redrawStatus(snapshot);
    this.#redrawTelegraph(snapshot);
  }

  /** Resolves an unknown Phaser overlap object to an immutable domain target. */
  targetFor(gameObject: unknown): QueenDamageTarget | null {
    if (
      gameObject === null ||
      (typeof gameObject !== 'object' && typeof gameObject !== 'function')
    ) {
      return null;
    }
    return this.#targetBySprite.get(gameObject) ?? null;
  }

  /** Bounded event feedback; persistent state remains snapshot-driven. */
  handleEvent(event: QueenBossEvent): void {
    if (this.#destroyed || this.#handledEventIds.has(event.eventId)) return;
    this.#handledEventIds.add(event.eventId);

    switch (event.type) {
      case 'area-telegraph':
        this.#createPulse(event.x, event.y, event.radius * 0.35, COLORS.orange, 0.34);
        break;
      case 'area-attack':
        this.#createPulse(event.x, event.y, event.radius, COLORS.acid, 0.72);
        break;
      case 'nest-destroyed':
        this.#createPulse(event.x, event.y, NEST_BODY_RADIUS * 1.4, COLORS.orange, 0.8);
        break;
      case 'queen-defeated':
        this.#createPulse(event.x, event.y, QUEEN_BODY_RADIUS * 1.35, COLORS.cyan, 0.85);
        break;
      case 'minion-spawn-request':
        break;
    }
  }

  /** Provides restrained cyan shield feedback for a consumed armored hit. */
  handleShieldBlocked(target: QueenDamageTarget): void {
    if (this.#destroyed) return;
    const sprite = this.#spritesByKey.get(targetKey(target));
    if (!sprite) return;
    const radius = target.type === 'queen' ? QUEEN_BODY_RADIUS : NEST_BODY_RADIUS;
    this.#createPulse(sprite.x, sprite.y, radius * 1.08, COLORS.cyan, 0.7);
  }

  /** Returns every active target to the fixed pool and clears reused layers. */
  clear(): void {
    if (this.#destroyed || this.#pool === null) return;
    this.#pool.clear();
    this.#statusLayer.clear();
    this.#telegraphLayer.clear();
    this.#seenKeys.clear();
    this.#handledEventIds.clear();
    this.#mutableRadarPositions.length = 0;
    this.#clearEffects(true);
  }

  /** Idempotent manual teardown. Scene shutdown uses the reference-only path. */
  destroy(): void {
    if (this.#destroyed) return;
    this.#scene.events.off(
      Phaser.Scenes.Events.SHUTDOWN,
      this.#handleSceneShutdown,
    );
    this.clear();
    this.#pool = null;
    this.#destroyed = true;
    this.#statusLayer.destroy();
    this.#telegraphLayer.destroy();
    this.group.destroy(true, true);
    this.#ownedSprites.clear();
    this.#spritesByKey.clear();
    this.#targetBySprite.clear();
  }

  #createPool(): ObjectPool<QueenBossImage, BossViewInit> {
    return new ObjectPool<QueenBossImage, BossViewInit>(
      {
        create: (): QueenBossImage => {
          const sprite = this.#scene.physics.add.image(
            0,
            0,
            TEXTURE_KEYS.alienQueen,
          );
          this.group.add(sprite);
          sprite.body.setAllowGravity(false);
          sprite.body.setImmovable(true);
          sprite.body.setVelocity(0, 0);
          sprite.body.enable = false;
          sprite.setActive(false).setVisible(false);
          this.#ownedSprites.add(sprite);
          return sprite;
        },
        activate: (sprite, init): void => {
          this.#applyInit(sprite, init);
          sprite.setActive(true).setVisible(true);
          sprite.body.enable = true;
          sprite.body.reset(init.x, init.y);
          sprite.body.setVelocity(0, 0);
        },
        deactivate: (sprite): void => {
          const target = this.#targetBySprite.get(sprite);
          if (target) this.#spritesByKey.delete(targetKey(target));
          this.#targetBySprite.delete(sprite);
          sprite.body.setVelocity(0, 0);
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
      POOL_SIZE,
      POOL_SIZE,
    );
  }

  #snapshotInits(snapshot: QueenBossSnapshot): readonly BossViewInit[] {
    if (!snapshot.active) return [];
    const inits: BossViewInit[] = [
      Object.freeze({
        key: QUEEN_KEY,
        target: QUEEN_TARGET,
        x: finite(snapshot.x),
        y: finite(snapshot.y),
        rotation: finite(snapshot.rotation),
        texture: TEXTURE_KEYS.alienQueen,
        tint: null,
        displaySize: QUEEN_DISPLAY_SIZE,
        bodyRadius: QUEEN_BODY_RADIUS,
      }),
    ];

    for (const nest of snapshot.nests.slice(0, POOL_SIZE - 1)) {
      const target: QueenDamageTarget = Object.freeze({ type: 'nest', id: nest.id });
      inits.push(
        Object.freeze({
          key: nestKey(nest.id),
          target,
          x: finite(nest.x),
          y: finite(nest.y),
          rotation: 0,
          texture: TEXTURE_KEYS.alienDrone,
          tint: COLORS.alienDark,
          displaySize: NEST_DISPLAY_SIZE,
          bodyRadius: NEST_BODY_RADIUS,
        }),
      );
    }
    return inits;
  }

  #applyInit(sprite: QueenBossImage, init: BossViewInit): void {
    sprite
      .setTexture(init.texture)
      .setDisplaySize(init.displaySize, init.displaySize)
      .setPosition(init.x, init.y)
      .setRotation(init.rotation)
      .setAlpha(1)
      .setDepth(init.y + 2);
    if (init.tint === null) sprite.clearTint();
    else sprite.setTint(init.tint);

    const scale = Math.max(Number.EPSILON, Math.abs(sprite.scaleX));
    const sourceRadius = init.bodyRadius / scale;
    const offset = Math.max(0, (sprite.width - sourceRadius * 2) / 2);
    sprite.body.enable = true;
    sprite.body.reset(init.x, init.y);
    sprite.body.setAllowGravity(false);
    sprite.body.setImmovable(true);
    sprite.body.setVelocity(0, 0);
    sprite.setCircle(sourceRadius, offset, offset);
  }

  #updateRadar(snapshot: QueenBossSnapshot): void {
    this.#mutableRadarPositions.length = 0;
    if (!snapshot.active || !this.#spritesByKey.has(QUEEN_KEY)) return;
    this.#mutableRadarPositions.push({
      key: QUEEN_KEY,
      marker: 'boss',
      x: finite(snapshot.x),
      y: finite(snapshot.y),
    });
    for (const nest of snapshot.nests) {
      const key = nestKey(nest.id);
      if (!this.#spritesByKey.has(key)) continue;
      this.#mutableRadarPositions.push({
        key,
        marker: 'nest',
        x: finite(nest.x),
        y: finite(nest.y),
      });
    }
  }

  #redrawStatus(snapshot: QueenBossSnapshot): void {
    const graphics = this.#statusLayer;
    graphics.clear();
    if (!snapshot.active || !this.#spritesByKey.has(QUEEN_KEY)) return;

    const healthRatio = clampUnit(
      snapshot.maxHealth > 0 ? snapshot.health / snapshot.maxHealth : 0,
    );
    const critical = healthRatio <= 0.25;
    const barWidth = 184;
    const barHeight = 10;
    const left = snapshot.x - barWidth / 2;
    const top = snapshot.y - QUEEN_BODY_RADIUS - 28;

    graphics.fillStyle(COLORS.void, 0.94);
    graphics.fillRect(left - 3, top - 3, barWidth + 6, barHeight + 6);
    graphics.fillStyle(critical ? COLORS.critical : COLORS.orange, 1);
    graphics.fillRect(left, top, barWidth * healthRatio, barHeight);
    graphics.lineStyle(critical ? 3 : 2, critical ? COLORS.critical : COLORS.cyan, 1);
    graphics.strokeRect(left - 2, top - 2, barWidth + 4, barHeight + 4);

    // Stage pips remain legible at arena zoom and avoid another text object.
    for (let stage = 1; stage <= 3; stage += 1) {
      const active = stage <= snapshot.stage;
      graphics.fillStyle(active ? COLORS.orange : COLORS.alienDark, active ? 1 : 0.72);
      graphics.fillRect(left + (stage - 1) * 18, top - 12, 12, 5);
    }
    this.#drawEliteMarker(graphics, snapshot.x, top - 15, critical);

    if (snapshot.vulnerable) {
      graphics.fillStyle(COLORS.orange, 0.34);
      graphics.fillCircle(snapshot.x, snapshot.y, 28);
      graphics.lineStyle(4, critical ? COLORS.critical : COLORS.cyan, 0.96);
      graphics.strokeCircle(snapshot.x, snapshot.y, 22);
      graphics.fillStyle(COLORS.cyan, 0.9);
      graphics.fillCircle(snapshot.x, snapshot.y, 8);
    } else if (snapshot.phase === 'armored' || snapshot.phase === 'nest-spawn') {
      graphics.lineStyle(4, COLORS.cyan, 0.82);
      graphics.strokeCircle(snapshot.x, snapshot.y, QUEEN_BODY_RADIUS + 9);
      graphics.lineStyle(2, COLORS.orange, 0.58);
      graphics.strokeCircle(snapshot.x, snapshot.y, QUEEN_BODY_RADIUS + 15);
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6 + snapshot.rotation;
        const inner = QUEEN_BODY_RADIUS + 9;
        const outer = QUEEN_BODY_RADIUS + 18;
        graphics.lineBetween(
          snapshot.x + Math.cos(angle) * inner,
          snapshot.y + Math.sin(angle) * inner,
          snapshot.x + Math.cos(angle) * outer,
          snapshot.y + Math.sin(angle) * outer,
        );
      }
    }

    for (const nest of snapshot.nests) this.#drawNestStatus(graphics, nest);
  }

  #drawEliteMarker(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    critical: boolean,
  ): void {
    graphics.lineStyle(3, critical ? COLORS.critical : COLORS.orange, 1);
    graphics.beginPath();
    graphics.moveTo(x, y - 9);
    graphics.lineTo(x + 7, y);
    graphics.lineTo(x, y + 9);
    graphics.lineTo(x - 7, y);
    graphics.closePath();
    graphics.strokePath();
  }

  #drawNestStatus(
    graphics: Phaser.GameObjects.Graphics,
    nest: QueenNestSnapshot,
  ): void {
    if (!this.#spritesByKey.has(nestKey(nest.id))) return;
    const ratio = clampUnit(nest.maxHealth > 0 ? nest.health / nest.maxHealth : 0);
    const podRadius = NEST_BODY_RADIUS + 7;
    graphics.fillStyle(COLORS.alienDark, 0.58);
    graphics.fillCircle(nest.x, nest.y, podRadius);
    graphics.lineStyle(3, COLORS.acid, 0.92);
    graphics.strokeCircle(nest.x, nest.y, podRadius);
    graphics.lineStyle(2, COLORS.orange, 0.82);
    graphics.strokeCircle(nest.x, nest.y, NEST_BODY_RADIUS - 2);
    for (let spoke = 0; spoke < 4; spoke += 1) {
      const angle = Math.PI / 4 + (Math.PI / 2) * spoke;
      graphics.lineBetween(
        nest.x + Math.cos(angle) * (NEST_BODY_RADIUS - 7),
        nest.y + Math.sin(angle) * (NEST_BODY_RADIUS - 7),
        nest.x + Math.cos(angle) * (podRadius + 5),
        nest.y + Math.sin(angle) * (podRadius + 5),
      );
    }
    graphics.fillStyle(COLORS.orange, 0.95);
    graphics.fillCircle(nest.x, nest.y, 5);

    const width = 58;
    const left = nest.x - width / 2;
    const top = nest.y - NEST_BODY_RADIUS - 12;
    graphics.fillStyle(COLORS.void, 0.9);
    graphics.fillRect(left - 2, top - 2, width + 4, 7);
    graphics.fillStyle(ratio <= 0.25 ? COLORS.critical : COLORS.acid, 0.98);
    graphics.fillRect(left, top, width * ratio, 3);
    graphics.lineStyle(1, COLORS.orange, 0.72);
    graphics.strokeRect(left - 1, top - 1, width + 2, 5);
  }

  #redrawTelegraph(snapshot: QueenBossSnapshot): void {
    const graphics = this.#telegraphLayer;
    graphics.clear();
    const telegraph = snapshot.pendingTelegraph;
    if (!snapshot.active || telegraph === null) return;

    const x = finite(telegraph.targetX);
    const y = finite(telegraph.targetY);
    const radius = Math.max(1, finite(telegraph.radius, 1));
    const progress = clampUnit(1 - telegraph.delayRemainingMs / AREA_ATTACK_DELAY_MS);

    graphics.fillStyle(COLORS.orange, 0.08 + progress * 0.08);
    graphics.fillCircle(x, y, radius);
    graphics.lineStyle(3, COLORS.orange, 0.92);
    graphics.strokeCircle(x, y, radius);
    graphics.lineStyle(4, COLORS.acid, 0.9);
    graphics.beginPath();
    graphics.arc(x, y, radius - 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    graphics.strokePath();

    // Sparse alternating ticks communicate toxicity without a full-screen flash.
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12;
      const inner = radius * (index % 2 === 0 ? 0.48 : 0.64);
      const outer = Math.min(radius - 14, inner + 12);
      graphics.lineStyle(2, index % 2 === 0 ? COLORS.orange : COLORS.acid, 0.46);
      graphics.lineBetween(
        x + Math.cos(angle) * inner,
        y + Math.sin(angle) * inner,
        x + Math.cos(angle) * outer,
        y + Math.sin(angle) * outer,
      );
    }
    graphics.lineStyle(2, COLORS.orange, 0.9);
    graphics.strokeCircle(x, y, 10);
    graphics.lineBetween(x - 17, y, x + 17, y);
    graphics.lineBetween(x, y - 17, x, y + 17);
  }

  #createPulse(
    x: number,
    y: number,
    radius: number,
    color: number,
    alpha: number,
  ): void {
    if (this.#destroyed) return;
    while (this.#eventEffects.size >= MAX_EVENT_EFFECTS) {
      const oldest = this.#eventEffects.values().next().value;
      if (!oldest) break;
      this.#retireEffect(oldest, true);
    }

    const effect = this.#scene.add.graphics({ x: finite(x), y: finite(y) });
    effect.setDepth(EFFECT_DEPTH);
    effect.fillStyle(color, Math.min(0.18, alpha * 0.2));
    effect.fillCircle(0, 0, Math.max(2, finite(radius, 2)));
    effect.lineStyle(3, color, clampUnit(alpha));
    effect.strokeCircle(0, 0, Math.max(2, finite(radius, 2)));
    effect.setScale(0.55);
    this.#eventEffects.add(effect);

    const tween = this.#scene.tweens.add({
      targets: effect,
      scale: 1.32,
      alpha: 0,
      duration: EFFECT_DURATION_MS,
      ease: 'Cubic.Out',
      onComplete: (): void => {
        this.#effectTweens.delete(effect);
        this.#eventEffects.delete(effect);
        if (effect.active) effect.destroy();
      },
    });
    this.#effectTweens.set(effect, tween);
  }

  #retireEffect(
    effect: Phaser.GameObjects.Graphics,
    destroyDisplayObject: boolean,
  ): void {
    const tween = this.#effectTweens.get(effect);
    if (tween) {
      tween.stop();
      this.#scene.tweens.remove(tween);
      this.#effectTweens.delete(effect);
    }
    this.#eventEffects.delete(effect);
    if (destroyDisplayObject && effect.active) effect.destroy();
  }

  #clearEffects(destroyDisplayObjects: boolean): void {
    if (!destroyDisplayObjects) {
      this.#eventEffects.clear();
      this.#effectTweens.clear();
      return;
    }
    for (const effect of [...this.#eventEffects]) this.#retireEffect(effect, true);
  }
}
