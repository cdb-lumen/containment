import {
  createCharacterAnimationOutput,
  writeCharacterAnimation,
  type MutableCharacterAnimationInput,
  type MutableCharacterAnimationOutput,
} from '../art/characterAnimation';
import type { QualityProfileName } from '../effects/quality';
import type { QueenBossEvent, QueenBossSnapshot } from './QueenBossSystem';

export const QUEEN_ATTACK_ANTICIPATION_MS = 900;
export const QUEEN_ATTACK_RECOVERY_MS = 180;
export const QUEEN_HIT_PRESENTATION_MS = 90;

const finiteTime = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;

/** Mutable, allocation-free presentation policy state for the single queen follower. */
export class QueenPresentationState {
  readonly #input: MutableCharacterAnimationInput = {
    skin: 'queen', entityId: 0, nowMs: 0, velocityX: 0, velocityY: 0,
    attackUntilMs: 0, hitUntilMs: 0, dead: false, quality: 'high',
    reducedMotion: false, reducedFlash: false,
  };
  readonly #output: MutableCharacterAnimationOutput = createCharacterAnimationOutput();
  #attackUntilMs = 0;
  #hitUntilMs = 0;

  acquire(snapshot: QueenBossSnapshot): void {
    void snapshot;
    this.release();
  }

  handleEvent(event: QueenBossEvent, nowMs: number): void {
    const now = finiteTime(nowMs);
    if (event.type === 'area-telegraph') {
      const delay = Number.isFinite(event.delayMs) ? Math.max(0, event.delayMs) : 0;
      this.#attackUntilMs = Math.max(this.#attackUntilMs, now + delay);
    } else if (event.type === 'area-attack') {
      this.#attackUntilMs = Math.max(this.#attackUntilMs, now + QUEEN_ATTACK_RECOVERY_MS);
    }
  }

  triggerHit(nowMs: number, appliedDecrease: boolean): void {
    if (!appliedDecrease) return;
    this.#hitUntilMs = Math.max(this.#hitUntilMs, finiteTime(nowMs) + QUEEN_HIT_PRESENTATION_MS);
  }

  update(
    snapshot: QueenBossSnapshot,
    nowMs: number,
    quality: QualityProfileName,
    reducedMotion: boolean,
    reducedFlash: boolean,
  ): MutableCharacterAnimationOutput {
    const now = finiteTime(nowMs);
    const stageFactor = snapshot.stage === 3 ? 1.45 : snapshot.stage === 2 ? 1.2 : 1;
    const input = this.#input;
    input.nowMs = now * stageFactor;
    input.attackUntilMs = this.#attackUntilMs > now ? input.nowMs + (this.#attackUntilMs - now) : 0;
    input.hitUntilMs = this.#hitUntilMs > now ? input.nowMs + (this.#hitUntilMs - now) : 0;
    input.dead = snapshot.defeated || snapshot.phase === 'defeated';
    input.quality = quality;
    input.reducedMotion = reducedMotion;
    input.reducedFlash = reducedFlash;
    writeCharacterAnimation(this.#output, input);
    if (quality !== 'low' && !input.dead) {
      this.#output.emissiveAlpha = Math.min(1, this.#output.emissiveAlpha * stageFactor);
    }
    return this.#output;
  }

  release(): void {
    this.#attackUntilMs = 0;
    this.#hitUntilMs = 0;
    const output = this.#output;
    output.frame = 'idleA';
    output.offsetX = 0;
    output.offsetY = 0;
    output.scaleX = 1;
    output.scaleY = 1;
    output.rotationOffset = 0;
    output.emissiveAlpha = 0;
    output.hitBrightness = 0;
  }
}
