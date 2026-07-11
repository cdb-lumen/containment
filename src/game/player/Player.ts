import Phaser from 'phaser';

import { TEXTURE_KEYS } from '../art/createTextures';
import {
  CHARACTER_SKINS,
  resolveCharacterSkinTexture,
} from '../art/characterSkins';
import type { QualityProfileName } from '../effects/quality';
import type { InputState } from '../input/InputState';
import {
  PlayerPresentationState,
  type PlayerPresentationSnapshot,
} from './PlayerPresentationState';

const PLAYER_DISPLAY_SIZE = 54;
const PLAYER_BODY_RADIUS = 24;
const PLAYER_BODY_OFFSET = 8;
const PLAYER_SPEED = 260;
const MAX_SPEED_MULTIPLIER = 4;

type PlayerPoint = Readonly<Phaser.Types.Math.Vector2Like>;

type PlayerPresentationOptions = Readonly<{
  dead: boolean;
  quality: QualityProfileName;
  reducedMotion: boolean;
  reducedFlash: boolean;
}>;

export class Player {
  readonly sprite: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  readonly skinKey: string;

  private readonly art: Phaser.GameObjects.Image | null;
  private readonly presentation = new PlayerPresentationState();
  private isDestroyed = false;
  private speedMultiplier = 1;
  private aimRotation = 0;

  constructor(scene: Phaser.Scene, spawn: PlayerPoint) {
    const spawnX = Number.isFinite(spawn.x) ? spawn.x : 0;
    const spawnY = Number.isFinite(spawn.y) ? spawn.y : 0;
    const resolved = resolveCharacterSkinTexture(
      (key) => scene.textures?.exists?.(key) === true,
      'marine',
    );
    this.skinKey = resolved.texture;

    this.sprite = scene.physics.add
      .image(spawnX, spawnY, TEXTURE_KEYS.marine)
      .setDisplaySize(PLAYER_DISPLAY_SIZE, PLAYER_DISPLAY_SIZE)
      .setCircle(PLAYER_BODY_RADIUS, PLAYER_BODY_OFFSET, PLAYER_BODY_OFFSET)
      .setCollideWorldBounds(true)
      .setDepth(spawnY);

    this.art = resolved.framed
      ? scene.add
          .image(spawnX, spawnY, resolved.texture, CHARACTER_SKINS.marine.frames.idleA)
          .setDisplaySize(PLAYER_DISPLAY_SIZE, PLAYER_DISPLAY_SIZE)
          .setDepth(spawnY)
      : null;
    if (this.art) this.sprite.setVisible(false);
  }

  applyInput(input: InputState): void {
    if (this.isDestroyed) return;

    let movementX = Number.isFinite(input.movementX) ? input.movementX : 0;
    let movementY = Number.isFinite(input.movementY) ? input.movementY : 0;
    movementX = Math.max(-1, Math.min(1, movementX));
    movementY = Math.max(-1, Math.min(1, movementY));

    const magnitudeSquared = movementX * movementX + movementY * movementY;
    if (magnitudeSquared > 1) {
      const inverseMagnitude = 1 / Math.sqrt(magnitudeSquared);
      movementX *= inverseMagnitude;
      movementY *= inverseMagnitude;
    }

    this.sprite.setVelocity(movementX * this.currentSpeed, movementY * this.currentSpeed);

    if (Number.isFinite(input.aimWorldX) && Number.isFinite(input.aimWorldY)) {
      const aimX = input.aimWorldX - this.sprite.x;
      const aimY = input.aimWorldY - this.sprite.y;
      if (Number.isFinite(aimX) && Number.isFinite(aimY) && (aimX !== 0 || aimY !== 0)) {
        this.aimRotation = Math.atan2(aimY, aimX);
        this.sprite.setRotation(this.aimRotation);
      }
    }

    this.sprite.setDepth(this.sprite.y);
  }

  updatePresentation(nowMs: number, options: PlayerPresentationOptions): void {
    if (this.isDestroyed) return;
    const velocity = this.sprite.body.velocity;
    const output = this.presentation.update(nowMs, {
      velocityX: velocity.x,
      velocityY: velocity.y,
      ...options,
    });
    if (!this.art) return;

    this.art
      .setPosition(this.sprite.x + output.offsetX, this.sprite.y + output.offsetY)
      .setRotation(this.aimRotation + output.rotationOffset)
      .setDisplaySize(PLAYER_DISPLAY_SIZE * output.scaleX, PLAYER_DISPLAY_SIZE * output.scaleY)
      .setDepth(this.sprite.depth)
      .setActive(this.sprite.active)
      .setVisible(this.sprite.active);
    this.art.setFrame(CHARACTER_SKINS.marine.frames[output.frame]);
    if (output.hitBrightness > 0) this.art.setTint(0xffffff);
    else this.art.clearTint();
  }

  triggerRecoil(nowMs: number): void {
    if (!this.isDestroyed) this.presentation.triggerRecoil(nowMs);
  }

  triggerHit(nowMs: number): void {
    if (!this.isDestroyed) this.presentation.triggerHit(nowMs);
  }

  presentationSnapshot(nowMs: number): PlayerPresentationSnapshot {
    return this.presentation.snapshot(nowMs);
  }

  reset(point: PlayerPoint): void {
    if (this.isDestroyed || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;

    this.speedMultiplier = 1;
    this.aimRotation = 0;
    this.presentation.reset();
    this.sprite.body.reset(point.x, point.y);
    this.sprite.setRotation(0).setDepth(point.y);
    this.art
      ?.setPosition(point.x, point.y)
      .setRotation(0)
      .setDisplaySize(PLAYER_DISPLAY_SIZE, PLAYER_DISPLAY_SIZE)
      .setFrame(CHARACTER_SKINS.marine.frames.idleA)
      .clearTint()
      .setDepth(point.y)
      .setActive(true)
      .setVisible(true);
  }

  get currentSpeed(): number {
    return PLAYER_SPEED * this.speedMultiplier;
  }

  setSpeedMultiplier(multiplier: number): boolean {
    if (
      this.isDestroyed ||
      !Number.isFinite(multiplier) ||
      multiplier <= 0 ||
      multiplier > MAX_SPEED_MULTIPLIER
    ) {
      return false;
    }
    this.speedMultiplier = multiplier;
    return true;
  }

  stop(): void {
    if (this.isDestroyed) return;
    this.sprite.setVelocity(0, 0);
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.stop();
    this.speedMultiplier = 1;
    this.presentation.reset();
    this.isDestroyed = true;
    this.art?.destroy();
    this.sprite.destroy();
  }
}
