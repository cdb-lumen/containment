import { characterAnimation, type CharacterAnimationOutput } from '../art/characterAnimation';
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

    return characterAnimation({
      skin: enemy.type,
      entityId: enemy.id,
      nowMs: now,
      velocityX: enemy.velocityX,
      velocityY: enemy.velocityY,
      attackUntilMs: this.attackUntilMs,
      hitUntilMs: this.hitUntilMs,
      dead: false,
      quality,
      reducedMotion,
      reducedFlash,
    });
  }
}
