import Phaser from 'phaser';

import { TEXTURE_KEYS } from '../art/createTextures';
import type { InputState } from '../input/InputState';

const PLAYER_DISPLAY_SIZE = 54;
const PLAYER_BODY_RADIUS = 24;
const PLAYER_BODY_OFFSET = 8;
const PLAYER_SPEED = 260;
const MAX_SPEED_MULTIPLIER = 4;

type PlayerPoint = Readonly<Phaser.Types.Math.Vector2Like>;

export class Player {
  readonly sprite: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

  private isDestroyed = false;
  private speedMultiplier = 1;

  constructor(scene: Phaser.Scene, spawn: PlayerPoint) {
    const spawnX = Number.isFinite(spawn.x) ? spawn.x : 0;
    const spawnY = Number.isFinite(spawn.y) ? spawn.y : 0;

    this.sprite = scene.physics.add
      .image(spawnX, spawnY, TEXTURE_KEYS.marine)
      .setDisplaySize(PLAYER_DISPLAY_SIZE, PLAYER_DISPLAY_SIZE)
      .setCircle(PLAYER_BODY_RADIUS, PLAYER_BODY_OFFSET, PLAYER_BODY_OFFSET)
      .setCollideWorldBounds(true)
      .setDepth(spawnY);
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
        this.sprite.setRotation(Math.atan2(aimY, aimX));
      }
    }

    this.sprite.setDepth(this.sprite.y);
  }

  reset(point: PlayerPoint): void {
    if (this.isDestroyed || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;

    this.speedMultiplier = 1;
    this.sprite.body.reset(point.x, point.y);
    this.sprite.setRotation(0).setDepth(point.y);
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
    this.isDestroyed = true;
    this.sprite.destroy();
  }
}
