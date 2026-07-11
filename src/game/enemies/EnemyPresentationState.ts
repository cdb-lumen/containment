import {
  createCharacterAnimationOutput,
  writeCharacterAnimation,
  type CharacterAnimationOutput,
  type MutableCharacterAnimationInput,
} from '../art/characterAnimation';
import type { QualityProfileName } from '../effects/quality';
import type { EnemySnapshot } from './EnemySystem';

const HIT_WINDOW_MS = 90;
const ATTACK_WINDOW_MS = 140;

export type EnemyPresentationSnapshot = Readonly<{
  enemyId: number | null;
  previousHealth: number;
  hitUntilMs: number;
  attackUntilMs: number;
}>;

const safeNow = (nowMs: number): number => Number.isFinite(nowMs) ? Math.max(0, nowMs) : 0;

/** One renderer-independent presentation record owned by each pooled view slot. */
export class EnemyPresentationState {
  private enemyId: number | null = null;
  private previousHealth = 0;
  private hitUntilMs = 0;
  private attackUntilMs = 0;
  private readonly animationInput: MutableCharacterAnimationInput = {
    skin: 'crawler', entityId: 0, nowMs: 0, velocityX: 0, velocityY: 0,
    attackUntilMs: 0, hitUntilMs: 0, dead: false, quality: 'high',
    reducedMotion: false, reducedFlash: false,
  };
  private readonly animationOutput = createCharacterAnimationOutput();

  get snapshot(): EnemyPresentationSnapshot {
    return Object.freeze({
      enemyId: this.enemyId,
      previousHealth: this.previousHealth,
      hitUntilMs: this.hitUntilMs,
      attackUntilMs: this.attackUntilMs,
    });
  }

  acquire(enemy: EnemySnapshot): void {
    this.enemyId = enemy.id;
    this.previousHealth = Number.isFinite(enemy.health) ? enemy.health : 0;
    this.hitUntilMs = 0;
    this.attackUntilMs = 0;
  }

  release(): void {
    this.enemyId = null;
    this.previousHealth = 0;
    this.hitUntilMs = 0;
    this.attackUntilMs = 0;
  }

  triggerAttack(nowMs: number): void {
    if (this.enemyId === null) return;
    const now = safeNow(nowMs);
    this.attackUntilMs = now + ATTACK_WINDOW_MS;
  }

  update(
    enemy: EnemySnapshot,
    nowMs: number,
    quality: QualityProfileName,
    reducedMotion: boolean,
    reducedFlash: boolean,
  ): CharacterAnimationOutput {
    const now = safeNow(nowMs);
    if (this.enemyId !== enemy.id) this.acquire(enemy);
    else if (Number.isFinite(enemy.health) && enemy.health < this.previousHealth) {
      this.hitUntilMs = now + HIT_WINDOW_MS;
    }
    this.previousHealth = Number.isFinite(enemy.health) ? enemy.health : this.previousHealth;

    const input = this.animationInput;
    input.skin = enemy.type;
    input.entityId = enemy.id;
    input.nowMs = now;
    input.velocityX = enemy.velocityX;
    input.velocityY = enemy.velocityY;
    input.attackUntilMs = this.attackUntilMs;
    input.hitUntilMs = this.hitUntilMs;
    input.dead = false;
    input.quality = quality;
    input.reducedMotion = reducedMotion;
    input.reducedFlash = reducedFlash;
    return writeCharacterAnimation(this.animationOutput, input);
  }
}
